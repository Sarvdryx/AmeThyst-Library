import pool from '../config/postgres.mjs';

export const insertAuthSession = async (session, client = pool) => {
  const result = await client.query(
    `INSERT INTO public.auth_sessions
       (user_id, family_id, refresh_token_hash, expires_at, user_agent, ip_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING session_id, family_id`,
    [session.userId, session.familyId, session.refreshTokenHash, session.expiresAt, session.userAgent, session.ipHash],
  );
  return result.rows[0];
};

export const findAuthSessionByHash = async (refreshTokenHash, client = pool) => {
  const result = await client.query(
    `SELECT s.*, u.email, u.username, u.avatar, u.role, u.branch_id,
            u.status, u.token_version, u.must_change_password
     FROM public.auth_sessions s
     JOIN public.users u ON u.user_id = s.user_id
     WHERE s.refresh_token_hash = $1`,
    [refreshTokenHash],
  );
  return result.rows[0] || null;
};

export const revokeAuthSession = (sessionId, reason, client = pool) => client.query(
  `UPDATE public.auth_sessions
   SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP), revoke_reason = COALESCE(revoke_reason, $2)
   WHERE session_id = $1`,
  [sessionId, reason],
);

export const revokeSessionFamily = (familyId, reason, client = pool) => client.query(
  `UPDATE public.auth_sessions
   SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP), revoke_reason = COALESCE(revoke_reason, $2)
   WHERE family_id = $1`,
  [familyId, reason],
);

export const revokeUserSessions = (userId, reason, client = pool) => client.query(
  `UPDATE public.auth_sessions
   SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP), revoke_reason = COALESCE(revoke_reason, $2)
   WHERE user_id = $1 AND revoked_at IS NULL`,
  [userId, reason],
);

export const touchAuthSession = (sessionId, client = pool) => client.query(
  'UPDATE public.auth_sessions SET last_used_at = CURRENT_TIMESTAMP WHERE session_id = $1',
  [sessionId],
);
