import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/postgres.mjs';
import { withTransaction, SALT_ROUNDS } from '../utils/authHelpers.mjs';
import { disconnectUserSockets, emitAuthorizationChanged } from '../config/socket.mjs';
import { revokeUserSessions } from './auth-session.services.mjs';
import { sendAdminInviteEmail } from '../utils/mailer.mjs';
import { findUserByEmail } from '../models/auth.models.mjs';
import * as authorizationModel from '../models/authorization.models.mjs';

const ROLE_LEVEL = { user: 0, librarian: 1, admin: 2 };

const createError = (code, message, status = 400) => {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
};

const assertValidBranch = async (branchId) => {
  const parsed = Number(branchId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError('BRANCH_REQUIRED', 'A valid library branch is required for a librarian account.', 400);
  }
  const result = await pool.query('SELECT branch_id FROM public.branches WHERE branch_id = $1', [parsed]);
  if (result.rows.length === 0) {
    throw createError('BRANCH_NOT_FOUND', 'The selected library branch does not exist.', 400);
  }
  return parsed;
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

export const assertActiveStatus = (user) => {
  if (!user) throw createError('USER_NOT_FOUND', 'User account not found.', 404);
  if (user.status !== 'active') {
    throw createError('ACCOUNT_NOT_ACTIVE', 'This account is not active and cannot be modified.', 400);
  }
};

export const verifySudoPassword = async (sudoPassword, passwordHash) => {
  if (!sudoPassword || !passwordHash) {
    throw createError('INVALID_CREDENTIALS', 'The current password is incorrect.', 401);
  }
  const isMatch = await bcrypt.compare(sudoPassword, passwordHash);
  if (!isMatch) {
    throw createError('INVALID_CREDENTIALS', 'The current password is incorrect.', 401);
  }
};

const getActorWithPassword = async (actorId) => {
  const result = await pool.query(
    'SELECT user_id, email, role, status, password_hash, created_at, admin_since FROM public.users WHERE user_id = $1',
    [actorId]
  );
  return result.rows[0] || null;
};

export const writeAudit = async (client, { actorId, targetId, action, prevValue, newValue, reason = null }) => {
  await client.query(
    'INSERT INTO public.authorize_history (modified_by, modified_to) VALUES ($1, $2)',
    [actorId, targetId]
  );
  const result = await client.query(
    `INSERT INTO public.admin_audit_logs (actor_id, target_id, action, prev_value, new_value, reason)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING log_id, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at`,
    [actorId, targetId, action, prevValue, newValue, reason]
  );
  return result.rows[0];
};

export const getActiveAdminCountForUpdate = async (client) => {
  const result = await client.query(
    `SELECT COUNT(*)::integer AS count
       FROM (SELECT user_id FROM public.users WHERE role = 'admin' AND status = 'active' FOR UPDATE) locked`
  );
  return result.rows[0].count;
};

const buildHistoryEntry = ({ logId, actor, target, action, prevValue, newValue, createdAt }) => ({
  id: logId,
  actor: { userId: actor.userId, username: actor.username, avatar: actor.avatar ?? null },
  target: { userId: target.userId, username: target.username, avatar: target.avatar ?? null },
  action,
  change: prevValue ? `${prevValue} → ${newValue}` : `→ ${newValue}`,
  timestamp: new Date(createdAt).toISOString(),
});

// ─── List accounts (US1) ──────────────────────────────────────────────────────

export const listUsersForManagementService = async ({
  actor,
  search = '',
  role = 'all',
  status = 'all',
  page = 1,
  limit = 20,
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;
  const normalizedSearch = (search || '').trim();

  const [users, total] = await Promise.all([
    authorizationModel.listUsersForManagement({
      search: normalizedSearch,
      role,
      status,
      limit: parsedLimit,
      offset,
      currentUserId: actor.userId,
    }),
    authorizationModel.countUsersForManagement({ search: normalizedSearch, role, status }),
  ]);

  return {
    users: users.map((u) => ({
      userId: u.userId,
      email: u.email,
      username: u.username,
      avatar: u.avatar,
      role: u.role,
      status: u.status,
      branchId: u.branchId,
      branchName: u.branchName,
      isSelf: u.isSelf,
      isLastAdmin: u.isLastAdmin,
      isSeniorAdmin: u.isSeniorAdmin,
      liabilities: { unreturnedBooks: u.unreturnedBooks, unpaidFines: u.unpaidFines },
    })),
    pagination: { total, page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(total / parsedLimit) },
  };
};

// ─── Promote (US1) ────────────────────────────────────────────────────────────

export const promoteUserService = async ({ actor, userId, targetRole, branchId, sudoPassword }) => {
  const normalizedTarget = String(targetRole || '').toLowerCase();
  if (!['librarian', 'admin'].includes(normalizedTarget)) {
    throw createError('INVALID_TARGET_ROLE', 'Target role must be librarian or admin.', 400);
  }

  const target = await authorizationModel.findUserById(userId);
  if (!target) throw createError('USER_NOT_FOUND', 'User account not found.', 404);
  assertActiveStatus(target);

  if (target.user_id === actor.userId) {
    throw createError('SELF_ACTION_FORBIDDEN', 'You cannot change the role of your own account.', 400);
  }

  if (ROLE_LEVEL[target.role] >= ROLE_LEVEL[normalizedTarget]) {
    throw createError('INVALID_ROLE_TRANSITION', `Cannot promote a ${target.role} account to ${normalizedTarget}.`, 400);
  }

  if (target.role === 'user') {
    const liabilities = await authorizationModel.getLiabilityCounts(userId);
    if (liabilities.unreturnedBooks > 0 || liabilities.unpaidFines > 0) {
      throw createError(
        'LIABILITIES_PENDING',
        'This account has unreturned books or unpaid fines and cannot be promoted yet.',
        400
      );
    }
  }

  const newBranchId = normalizedTarget === 'librarian' ? await assertValidBranch(branchId) : null;

  if (normalizedTarget === 'admin') {
    const actorRow = await getActorWithPassword(actor.userId);
    await verifySudoPassword(sudoPassword, actorRow?.password_hash);
  }

  const result = await withTransaction(async (client) => {
    const update = await client.query(
      `UPDATE public.users
          SET role = $1,
              branch_id = $3,
              token_version = token_version + 1,
              admin_since = CASE WHEN $1::varchar = 'admin' THEN CURRENT_TIMESTAMP ELSE admin_since END
        WHERE user_id = $2
        RETURNING user_id, email, username, avatar, role, status`,
      [normalizedTarget, userId, newBranchId]
    );
    const audit = await writeAudit(client, {
      actorId: actor.userId,
      targetId: userId,
      action: 'PROMOTE',
      prevValue: target.role,
      newValue: normalizedTarget,
    });
    await revokeUserSessions(userId, 'role_changed', client);
    return { updatedUser: update.rows[0], audit };
  });

  const entry = buildHistoryEntry({
    logId: result.audit.log_id,
    actor: { userId: actor.userId, username: actor.username, avatar: actor.avatar },
    target: { userId, username: result.updatedUser.username, avatar: result.updatedUser.avatar },
    action: 'PROMOTE',
    prevValue: target.role,
    newValue: normalizedTarget,
    createdAt: result.audit.created_at,
  });
  emitAuthorizationChanged(entry);
  disconnectUserSockets(userId);

  return {
    message: `Account promoted to ${normalizedTarget}. All existing sessions have been terminated; the account must sign in again.`,
    historyEntry: entry,
  };
};

// ─── Demote (US2 + US4 guardrails) ────────────────────────────────────────────

export const demoteUserService = async ({ actor, userId, targetRole, branchId, sudoPassword }) => {
  const normalizedTarget = String(targetRole || '').toLowerCase();
  if (!['user', 'librarian'].includes(normalizedTarget)) {
    throw createError('INVALID_TARGET_ROLE', 'Target role must be user or librarian.', 400);
  }

  const target = await authorizationModel.findUserById(userId);
  if (!target) throw createError('USER_NOT_FOUND', 'User account not found.', 404);
  assertActiveStatus(target);

  if (target.user_id === actor.userId) {
    throw createError('SELF_ACTION_FORBIDDEN', 'You cannot change the role of your own account.', 400);
  }

  if (ROLE_LEVEL[target.role] <= ROLE_LEVEL[normalizedTarget]) {
    throw createError('INVALID_ROLE_TRANSITION', `Cannot demote a ${target.role} account to ${normalizedTarget}.`, 400);
  }

  const newBranchId = normalizedTarget === 'librarian' ? await assertValidBranch(branchId) : null;

  let actorRow = null;
  if (target.role === 'admin') {
    actorRow = await getActorWithPassword(actor.userId);
    await verifySudoPassword(sudoPassword, actorRow?.password_hash);
  }

  const result = await withTransaction(async (client) => {
    if (target.role === 'admin') {
      const adminCount = await getActiveAdminCountForUpdate(client);
      if (adminCount <= 1) {
        throw createError(
          'LAST_ADMIN_PROTECTED',
          'The system must always keep at least one active administrator.',
          400
        );
      }

      const targetGrant = new Date(target.admin_since || target.created_at || 0).getTime();
      const actorGrant = new Date(actorRow.admin_since || actorRow.created_at || 0).getTime();
      if (targetGrant < actorGrant) {
        throw createError(
          'ADMIN_SENIORITY_PROTECTED',
          'You cannot demote an administrator who was granted the admin role before you.',
          400
        );
      }
    }

    const update = await client.query(
      `UPDATE public.users
          SET role = $1,
              branch_id = $3,
              token_version = token_version + 1,
              admin_since = CASE WHEN $1::varchar = 'admin' THEN admin_since ELSE NULL END
        WHERE user_id = $2
        RETURNING user_id, email, username, avatar, role, status`,
      [normalizedTarget, userId, newBranchId]
    );
    const audit = await writeAudit(client, {
      actorId: actor.userId,
      targetId: userId,
      action: 'DEMOTE',
      prevValue: target.role,
      newValue: normalizedTarget,
    });
    await revokeUserSessions(userId, 'role_changed', client);
    return { updatedUser: update.rows[0], audit };
  });

  const entry = buildHistoryEntry({
    logId: result.audit.log_id,
    actor: { userId: actor.userId, username: actor.username, avatar: actor.avatar },
    target: { userId, username: result.updatedUser.username, avatar: result.updatedUser.avatar },
    action: 'DEMOTE',
    prevValue: target.role,
    newValue: normalizedTarget,
    createdAt: result.audit.created_at,
  });
  emitAuthorizationChanged(entry);
  disconnectUserSockets(userId);

  return {
    message: `Account demoted to ${normalizedTarget}. All active sessions have been terminated.`,
    historyEntry: entry,
  };
};

// ─── Invite admin (US3) ───────────────────────────────────────────────────────

const generateTemporaryPassword = () => crypto.randomBytes(9).toString('base64url');

export const inviteAdminService = async ({ actor, email, sudoPassword }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw createError('INVALID_EMAIL', 'A valid email address is required.', 400);
  }

  const actorRow = await getActorWithPassword(actor.userId);
  await verifySudoPassword(sudoPassword, actorRow?.password_hash);

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) throw createError('EMAIL_TAKEN', 'An account with this email already exists.', 400);

  const tempPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);
  const username = normalizedEmail.split('@')[0].slice(0, 100) || 'new_admin';

  const result = await withTransaction(async (client) => {
    const insert = await client.query(
      `INSERT INTO public.users (email, password_hash, username, role, status, must_change_password, admin_since)
       VALUES ($1, $2, $3, 'admin', 'active', true, CURRENT_TIMESTAMP)
       RETURNING user_id, email, username, avatar, role, status`,
      [normalizedEmail, passwordHash, username]
    );
    const newUser = insert.rows[0];
    const audit = await writeAudit(client, {
      actorId: actor.userId,
      targetId: newUser.user_id,
      action: 'ADMIN_INVITE',
      prevValue: null,
      newValue: 'admin',
    });
    try {
      await sendAdminInviteEmail(normalizedEmail, tempPassword);
    } catch (err) {
      throw createError('EMAIL_SEND_FAILED', 'The invitation email could not be sent. No account was created.', 400);
    }
    return { newUser, audit };
  });

  const entry = buildHistoryEntry({
    logId: result.audit.log_id,
    actor: { userId: actor.userId, username: actor.username, avatar: actor.avatar },
    target: { userId: result.newUser.user_id, username: result.newUser.username, avatar: result.newUser.avatar },
    action: 'ADMIN_INVITE',
    prevValue: null,
    newValue: 'admin',
    createdAt: result.audit.created_at,
  });
  emitAuthorizationChanged(entry);

  return { message: 'Invitation sent. The new admin can sign in with the temporary password from the email.' };
};

// ─── History (US5) ────────────────────────────────────────────────────────────

export const getHistoryService = async ({ action = 'all', page = 1, limit = 20 }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;
  const normalizedAction = ['all', 'PROMOTE', 'DEMOTE', 'ADMIN_INVITE'].includes(action) ? action : 'all';

  const [history, total] = await Promise.all([
    authorizationModel.listHistory({ action: normalizedAction, limit: parsedLimit, offset }),
    authorizationModel.countHistory({ action: normalizedAction }),
  ]);

  return {
    history: history.map((row) => ({
      id: row.id,
      actor: { userId: row.actorUserId, username: row.actorUsername, avatar: row.actorAvatar },
      target: { userId: row.targetUserId, username: row.targetUsername, avatar: row.targetAvatar },
      action: row.action,
      change: row.prevValue ? `${row.prevValue} → ${row.newValue}` : `→ ${row.newValue}`,
      timestamp: new Date(row.createdAt).toISOString(),
    })),
    pagination: { total, page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(total / parsedLimit) },
  };
};
