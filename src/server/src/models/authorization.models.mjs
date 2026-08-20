import pool from '../config/postgres.mjs';

const ACTIVE_BORROW_STATUSES = ['reserved', 'pending', 'borrowed', 'pending_return'];

export const findUserById = async (userId) => {
  const result = await pool.query(
    `SELECT user_id, email, username, avatar, role, status, branch_id, token_version, created_at, admin_since
     FROM public.users WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

export const getLiabilityCounts = async (userId) => {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM public.borrow_book
         WHERE user_id = $1 AND status = ANY($2::text[]))::integer AS "unreturnedBooks",
       (SELECT COUNT(*) FROM public.book_penalty
         WHERE user_id = $1 AND is_paid = false)::integer AS "unpaidFines"`,
    [userId, ACTIVE_BORROW_STATUSES]
  );
  return result.rows[0];
};

const buildFilterClauses = ({ search, role, status }) => {
  const clauses = ['1 = 1'];
  const values = [];
  let index = 1;

  if (search) {
    clauses.push(`(u.username ILIKE '%' || $${index} || '%' OR u.email ILIKE '%' || $${index} || '%')`);
    values.push(search);
    index += 1;
  }

  if (role && role !== 'all') {
    clauses.push(`u.role = $${index}`);
    values.push(role);
    index += 1;
  }

  if (status && status !== 'all') {
    clauses.push(`u.status = $${index}`);
    values.push(status);
    index += 1;
  }

  return { where: clauses.join(' AND '), values };
};

export const countUsersForManagement = async ({ search, role, status }) => {
  const { where, values } = buildFilterClauses({ search, role, status });
  const result = await pool.query(
    `SELECT COUNT(*)::integer AS total FROM public.users u WHERE ${where}`,
    values
  );
  return result.rows[0].total;
};

export const listUsersForManagement = async ({ search, role, status, limit, offset, currentUserId }) => {
  const { where, values } = buildFilterClauses({ search, role, status });

  const result = await pool.query(
    `SELECT
       u.user_id AS "userId",
       u.email,
       u.username,
       u.avatar,
       u.role,
       u.status,
       u.branch_id AS "branchId",
       b.name AS "branchName",
       (u.user_id = $${values.length + 1}) AS "isSelf",
       (u.role = 'admin'
         AND (SELECT COUNT(*) FROM public.users WHERE role = 'admin' AND status = 'active') = 1) AS "isLastAdmin",
       (u.role = 'admin'
         AND u.admin_since IS NOT NULL
         AND (SELECT admin_since FROM public.users WHERE user_id = $${values.length + 1}) IS NOT NULL
         AND u.admin_since < (SELECT admin_since FROM public.users WHERE user_id = $${values.length + 1})) AS "isSeniorAdmin",
       COALESCE(bb.active_borrows, 0)::integer AS "unreturnedBooks",
       COALESCE(bp.unpaid_fines, 0)::integer AS "unpaidFines"
     FROM public.users u
     LEFT JOIN public.branches b ON b.branch_id = u.branch_id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS active_borrows
       FROM public.borrow_book
       WHERE status = ANY($${values.length + 2}::text[])
       GROUP BY user_id
     ) bb ON bb.user_id = u.user_id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS unpaid_fines
       FROM public.book_penalty
       WHERE is_paid = false
       GROUP BY user_id
     ) bp ON bp.user_id = u.user_id
     WHERE ${where}
     ORDER BY u.created_at DESC
     LIMIT $${values.length + 3} OFFSET $${values.length + 4}`,
    [...values, currentUserId, ACTIVE_BORROW_STATUSES, limit, offset]
  );

  return result.rows;
};

export const countHistory = async ({ action }) => {
  const result = await pool.query(
    `SELECT COUNT(*)::integer AS total FROM public.admin_audit_logs l WHERE ($1 = 'all' OR l.action = $1)`,
    [action]
  );
  return result.rows[0].total;
};

export const listHistory = async ({ action, limit, offset }) => {
  const result = await pool.query(
    `SELECT
       l.log_id AS "id",
       l.action,
       l.prev_value AS "prevValue",
       l.new_value AS "newValue",
       to_char(l.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt",
       actor.user_id AS "actorUserId",
       actor.username AS "actorUsername",
       actor.avatar AS "actorAvatar",
       target.user_id AS "targetUserId",
       target.username AS "targetUsername",
       target.avatar AS "targetAvatar"
     FROM public.admin_audit_logs l
     JOIN public.users actor ON actor.user_id = l.actor_id
     JOIN public.users target ON target.user_id = l.target_id
     WHERE ($1 = 'all' OR l.action = $1)
     ORDER BY l.created_at DESC
     LIMIT $2 OFFSET $3`,
    [action, limit, offset]
  );
  return result.rows;
};
