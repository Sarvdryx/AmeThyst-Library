import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import pool from '../config/postgres.mjs';

export const SALT_ROUNDS = 10;

export const ACCESS_COOKIE = 'amethyst_access';
export const REFRESH_COOKIE = 'amethyst_refresh';
export const CSRF_COOKIE = 'amethyst_csrf';
export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const JWT_ISSUER = process.env.JWT_ISSUER || 'amethyst-library';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'amethyst-client';

const isProduction = process.env.NODE_ENV === 'production';
// The client and API may live on different sites (e.g. Vercel + Render). Lax
// cookies are never sent on cross-site subresource fetches, so the auth handoff
// in /auth/callback would fail. Use None (always with Secure) in production;
// keep Lax for local development where everything shares the localhost site.
const secureCookies = isProduction;
const cookieSameSite = isProduction ? 'none' : 'lax';

export const accessCookieOptions = () => ({
  httpOnly: true,
  secure: secureCookies,
  sameSite: cookieSameSite,
  path: '/',
  maxAge: 15 * 60 * 1000,
});

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: secureCookies,
  sameSite: cookieSameSite,
  path: '/auth',
  maxAge: REFRESH_TOKEN_TTL_MS,
});

export const csrfCookieOptions = () => ({
  httpOnly: false,
  secure: secureCookies,
  sameSite: cookieSameSite,
  path: '/',
  maxAge: REFRESH_TOKEN_TTL_MS,
});

export const hashSecret = (value) => crypto.createHash('sha256').update(value).digest('hex');
export const generateRefreshToken = () => crypto.randomBytes(32).toString('base64url');
export const generateCsrfToken = () => crypto.randomBytes(32).toString('base64url');

export const signToken = (userId, email, role, branchId, tokenVersion = 0, sessionId = null) =>
  jwt.sign(
    { userId, email, role, branch_id: branchId || null, token_version: tokenVersion || 0, session_id: sessionId },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: ACCESS_TOKEN_TTL,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );

export const setAuthCookies = (res, { accessToken, refreshToken, csrfToken }) => {
  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions());
};

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, accessCookieOptions());
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  res.clearCookie(CSRF_COOKIE, csrfCookieOptions());
};

export const buildUserPayload = (user) => ({
  userId: user.user_id,
  email: user.email,
  username: user.username,
  avatar: user.avatar,
  role: user.role,
  branch_id: user.branch_id || null,
  must_change_password: user.must_change_password ?? false,
});

export const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const PENDING_TTL_MS = 5 * 60 * 1000;

export const replacePendingUser = async (client, {
  email,
  passwordHash,
  username,
  token = crypto.randomUUID(),
  expiredAt = new Date(Date.now() + PENDING_TTL_MS),
}) => {
  await client.query('DELETE FROM pending_users WHERE email = $1', [email]);
  await client.query(
    `INSERT INTO pending_users (token, email, password_hash, username, role, expired_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [token, email, passwordHash, username, 'user', expiredAt]
  );

  return token;
};
