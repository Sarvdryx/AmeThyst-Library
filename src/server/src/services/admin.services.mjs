import pool from '../config/postgres.mjs';
import { revokeUserSessions } from '../models/auth-session.models.mjs';
import { disconnectUserSockets, suspendUserSockets } from '../config/socket.mjs';

function escapeSearchWildcards(search) {
  if (!search) return null;
  const trimmed = search.trim();
  if (!trimmed) return null;
  return '%' + trimmed.replace(/[%_\\]/g, '\\$&') + '%';
}

const isSameUserId = (actorId, targetUserId) =>
  String(actorId) === String(targetUserId);

function buildUserFilterClause({ search, role, status }, startIndex = 1) {
  const conditions = [];
  const params = [];
  let paramIndex = startIndex;

  const escapedSearch = escapeSearchWildcards(search);
  if (escapedSearch) {
    conditions.push(`(username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    params.push(escapedSearch);
    paramIndex++;
  }

  if (role) {
    conditions.push(`role = $${paramIndex}`);
    params.push(role);
    paramIndex++;
  }

  if (status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params, nextParamIndex: paramIndex };
}

export const getUsersListService = async ({ search, role, status, page = 1, limit = 10 }) => {
  const limitNum = parseInt(limit, 10);
  const pageNum = parseInt(page, 10);
  const offset = (pageNum - 1) * limitNum;

  const { whereClause, params, nextParamIndex: paramIndex } = buildUserFilterClause({ search, role, status }, 1);

  // Get total count matching criteria
  const countQuery = `SELECT COUNT(*) FROM public.users ${whereClause}`;
  const countResult = await pool.query(countQuery, params);
  const totalItems = parseInt(countResult.rows[0].count, 10);
  const totalPages = Math.ceil(totalItems / limitNum);

  // Get paginated users listing
  const listParams = [...params, limitNum, offset];
  const listQuery = `
    SELECT 
      user_id AS "userId",
      username,
      email,
      phone_number AS "phoneNumber",
      avatar,
      role,
      status,
      created_at AS "joinedDate",
      last_login_at AS "lastLogin"
    FROM public.users
    ${whereClause}
    ORDER BY created_at DESC, user_id DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const listResult = await pool.query(listQuery, listParams);

  return {
    users: listResult.rows,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalItems,
      limit: limitNum,
    }
  };
};

export const getUsersStatsService = async () => {
  const statsQuery = `
    SELECT 
      COUNT(*) AS "totalUsers",
      COUNT(*) FILTER (WHERE status = 'active') AS "activeUsers",
      COUNT(*) FILTER (WHERE status = 'suspended') AS "suspendedUsers",
      COUNT(*) FILTER (WHERE role = 'librarian') AS "librariansCount"
    FROM public.users
  `;
  const result = await pool.query(statsQuery);
  const row = result.rows[0];
  return {
    totalUsers: parseInt(row.totalUsers, 10) || 0,
    activeUsers: parseInt(row.activeUsers, 10) || 0,
    suspendedUsers: parseInt(row.suspendedUsers, 10) || 0,
    librariansCount: parseInt(row.librariansCount, 10) || 0,
  };
};

export const getUserDetailsService = async (userId) => {
  const query = `
    SELECT 
      user_id AS "userId",
      username,
      email,
      phone_number AS "phoneNumber",
      avatar,
      role,
      status,
      suspended_reason AS "suspendedReason",
      created_at AS "joinedDate",
      last_login_at AS "lastLogin"
    FROM public.users
    WHERE user_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
};

async function checkFinalAdminInvariant(client, targetUserId) {
  // Lock active admins rows to prevent concurrent mutations leading to 0 active admins
  const lockQuery = `
    SELECT user_id 
    FROM public.users 
    WHERE role = 'admin' AND status = 'active'
    FOR UPDATE
  `;
  const lockRes = await client.query(lockQuery);
  const activeAdminsCount = lockRes.rows.length;

  if (activeAdminsCount <= 1) {
    // Check if the targeted user is one of these active admins
    const targetQuery = `
      SELECT role, status 
      FROM public.users 
      WHERE user_id = $1
    `;
    const targetRes = await client.query(targetQuery, [targetUserId]);
    const targetUser = targetRes.rows[0];

    if (targetUser && targetUser.role === 'admin' && targetUser.status === 'active') {
      return false; // Violates final active admin guard
    }
  }
  return true;
}

export const updateUserRoleService = async (actorId, targetUserId, newRole) => {
  if (isSameUserId(actorId, targetUserId)) {
    const error = new Error('You cannot change your own role.');
    error.code = 'SELF_MUTATION_BLOCKED';
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check target exists and fetch current role
    const selectRes = await client.query('SELECT role, username FROM public.users WHERE user_id = $1', [targetUserId]);
    if (selectRes.rows.length === 0) {
      const error = new Error('User not found.');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    const targetUser = selectRes.rows[0];

    // Check final active admin safeguard if demoting an admin
    if (targetUser.role === 'admin' && newRole !== 'admin') {
      const isAllowed = await checkFinalAdminInvariant(client, targetUserId);
      if (!isAllowed) {
        const error = new Error('The final active administrator cannot be demoted.');
        error.code = 'FINAL_ADMIN_SAFESHIFT_BLOCKED';
        throw error;
      }
    }

    // Perform role update
    await client.query('UPDATE public.users SET role = $1, token_version = token_version + 1 WHERE user_id = $2', [newRole, targetUserId]);
    await revokeUserSessions(targetUserId, 'role_changed', client);

    // Record audit log
    await client.query(`
      INSERT INTO public.admin_audit_logs (actor_id, target_id, action, prev_value, new_value, reason)
      VALUES ($1, $2, 'ROLE_CHANGE', $3, $4, NULL)
    `, [actorId, targetUserId, targetUser.role, newRole]);

    await client.query('COMMIT');
    disconnectUserSockets(targetUserId);
    return { userId: targetUserId, role: newRole };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const suspendUserService = async (actorId, targetUserId, reason) => {
  if (isSameUserId(actorId, targetUserId)) {
    const error = new Error('You cannot suspend yourself.');
    error.code = 'SELF_MUTATION_BLOCKED';
    throw error;
  }

  if (!reason || reason.trim() === '') {
    const error = new Error('A suspension reason is required.');
    error.code = 'REASON_REQUIRED';
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check target exists and fetch current status
    const selectRes = await client.query('SELECT status, role, username FROM public.users WHERE user_id = $1', [targetUserId]);
    if (selectRes.rows.length === 0) {
      const error = new Error('User not found.');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    const targetUser = selectRes.rows[0];

    // Check final active admin safeguard
    if (targetUser.role === 'admin') {
      const isAllowed = await checkFinalAdminInvariant(client, targetUserId);
      if (!isAllowed) {
        const error = new Error('The final active administrator cannot be suspended.');
        error.code = 'FINAL_ADMIN_SAFESHIFT_BLOCKED';
        throw error;
      }
    }

    // Perform suspension
    await client.query(
      'UPDATE public.users SET status = \'suspended\', suspended_reason = $1, token_version = token_version + 1 WHERE user_id = $2',
      [reason, targetUserId]
    );
    await revokeUserSessions(targetUserId, 'account_suspended', client);

    // Record audit log
    await client.query(`
      INSERT INTO public.admin_audit_logs (actor_id, target_id, action, prev_value, new_value, reason)
      VALUES ($1, $2, 'ACCOUNT_SUSPENSION', $3, 'suspended', $4)
    `, [actorId, targetUserId, targetUser.status, reason]);

    await client.query('COMMIT');
    suspendUserSockets(targetUserId);
    return { userId: targetUserId, status: 'suspended', suspendedReason: reason };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const unsuspendUserService = async (actorId, targetUserId) => {
  if (isSameUserId(actorId, targetUserId)) {
    const error = new Error('You cannot modify your own suspension status.');
    error.code = 'SELF_MUTATION_BLOCKED';
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check target exists and fetch current status
    const selectRes = await client.query('SELECT status, username FROM public.users WHERE user_id = $1', [targetUserId]);
    if (selectRes.rows.length === 0) {
      const error = new Error('User not found.');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    const targetUser = selectRes.rows[0];

    // Perform restoration
    await client.query(
      'UPDATE public.users SET status = \'active\', suspended_reason = NULL, token_version = token_version + 1 WHERE user_id = $1',
      [targetUserId]
    );
    await revokeUserSessions(targetUserId, 'account_unsuspended', client);

    // Record audit log
    await client.query(`
      INSERT INTO public.admin_audit_logs (actor_id, target_id, action, prev_value, new_value, reason)
      VALUES ($1, $2, 'ACCOUNT_UNSUSPENSION', $3, 'active', NULL)
    `, [actorId, targetUserId, targetUser.status]);

    await client.query('COMMIT');
    disconnectUserSockets(targetUserId);
    return { userId: targetUserId, status: 'active' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getExportUsersListService = async ({ search, role, status }) => {
  const { whereClause, params } = buildUserFilterClause({ search, role, status }, 1);

  const listQuery = `
    SELECT 
      user_id AS "userId",
      username,
      email,
      phone_number AS "phoneNumber",
      role,
      status,
      created_at AS "joinedDate",
      last_login_at AS "lastLogin"
    FROM public.users
    ${whereClause}
    ORDER BY created_at DESC, user_id DESC
    LIMIT 1001
  `;

  const result = await pool.query(listQuery, params);
  return result.rows;
};

export const getAuditLogsService = async ({ targetId, actorId, page = 1, limit = 10 }) => {
  const limitNum = parseInt(limit, 10);
  const pageNum = parseInt(page, 10);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (targetId) {
    conditions.push(`l.target_id = $${paramIndex}`);
    params.push(targetId);
    paramIndex++;
  }

  if (actorId) {
    conditions.push(`l.actor_id = $${paramIndex}`);
    params.push(actorId);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get count
  const countQuery = `SELECT COUNT(*) FROM public.admin_audit_logs l ${whereClause}`;
  const countResult = await pool.query(countQuery, params);
  const totalItems = parseInt(countResult.rows[0].count, 10);

  // Get data matching with usernames
  const dataParams = [...params, limitNum, offset];
  const dataQuery = `
    SELECT 
      l.log_id AS "logId",
      l.actor_id AS "actorId",
      ua.username AS "actorUsername",
      l.target_id AS "targetId",
      ut.username AS "targetUsername",
      l.action,
      l.prev_value AS "prevValue",
      l.new_value AS "newValue",
      l.reason,
      l.created_at AS "createdAt"
    FROM public.admin_audit_logs l
    JOIN public.users ua ON l.actor_id = ua.user_id
    JOIN public.users ut ON l.target_id = ut.user_id
    ${whereClause}
    ORDER BY l.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const listResult = await pool.query(dataQuery, dataParams);

  return {
    logs: listResult.rows,
    meta: {
      page: pageNum,
      pageSize: limitNum,
      totalItems,
    }
  };
};
