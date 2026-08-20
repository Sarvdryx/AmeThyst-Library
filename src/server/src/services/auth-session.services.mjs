import crypto from 'crypto';
import pool from '../config/postgres.mjs';
import {
  findAuthSessionByHash,
  insertAuthSession,
  revokeAuthSession,
  revokeSessionFamily,
  revokeUserSessions,
  touchAuthSession,
} from '../models/auth-session.models.mjs';
import {
  REFRESH_TOKEN_TTL_MS,
  buildUserPayload,
  generateCsrfToken,
  generateRefreshToken,
  hashSecret,
  signToken,
} from '../utils/authHelpers.mjs';

const requestMetadata = (req) => ({
  userAgent: String(req?.get?.('user-agent') || '').slice(0, 500) || null,
  ipHash: req?.ip ? hashSecret(req.ip) : null,
});

export const createAuthSession = async (user, req, familyId = crypto.randomUUID(), client = pool) => {
  const refreshToken = generateRefreshToken();
  const row = await insertAuthSession({
    userId: user.user_id,
    familyId,
    refreshTokenHash: hashSecret(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    ...requestMetadata(req),
  }, client);
  return {
    accessToken: signToken(user.user_id, user.email, user.role, user.branch_id, user.token_version ?? 0, row.session_id),
    refreshToken,
    csrfToken: generateCsrfToken(),
    user: buildUserPayload(user),
  };
};

export const rotateAuthSession = async (refreshToken, req) => {
  if (!refreshToken) return null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await findAuthSessionByHash(hashSecret(refreshToken), client);
    if (!current) {
      await client.query('ROLLBACK');
      return null;
    }
    if (current.revoked_at) {
      await revokeSessionFamily(current.family_id, 'refresh_token_reuse', client);
      await client.query('COMMIT');
      return null;
    }
    if (new Date(current.expires_at) <= new Date() || current.status !== 'active') {
      await revokeAuthSession(current.session_id, 'expired_or_inactive', client);
      await client.query('COMMIT');
      if (current.status === 'suspended') {
        const error = new Error('Your account has been suspended.');
        error.code = 'USER_SUSPENDED';
        throw error;
      }
      return null;
    }
    await revokeAuthSession(current.session_id, 'rotated', client);
    await touchAuthSession(current.session_id, client);
    const next = await createAuthSession({
      user_id: current.user_id,
      email: current.email,
      username: current.username,
      avatar: current.avatar,
      role: current.role,
      branch_id: current.branch_id,
      token_version: current.token_version,
      must_change_password: current.must_change_password,
    }, req, current.family_id, client);
    await client.query('COMMIT');
    return next;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const revokeRefreshToken = async (refreshToken, reason = 'logout') => {
  if (!refreshToken) return;
  const session = await findAuthSessionByHash(hashSecret(refreshToken));
  if (session) await revokeAuthSession(session.session_id, reason);
};

export { revokeUserSessions };
