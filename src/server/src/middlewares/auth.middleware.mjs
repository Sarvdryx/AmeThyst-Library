import jwt from 'jsonwebtoken';
import pool from '../config/postgres.mjs';
import { ACCESS_COOKIE, JWT_AUDIENCE, JWT_ISSUER } from '../utils/authHelpers.mjs';

const authError = (res, status, code, message) => res.status(status).json({
  success: false,
  error: { code, message },
});

export const authenticate = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  const userId = decoded?.userId;
  if (!userId) {
    const error = new Error('Token does not contain a valid user identifier.');
    error.code = 'INVALID_TOKEN_USER';
    throw error;
  }
  const result = await pool.query(
    'SELECT user_id, email, username, avatar, role, branch_id, status, token_version, must_change_password FROM public.users WHERE user_id = $1',
    [userId],
  );
  if (!result.rows[0]) {
    const error = new Error('Your account is no longer available. Please sign in again.');
    error.code = 'AUTH_USER_NOT_FOUND';
    throw error;
  }
  const user = result.rows[0];
  if (user.status === 'suspended') {
    const error = new Error('Your account has been suspended.');
    error.code = 'USER_SUSPENDED';
    throw error;
  }
  if ((decoded.token_version ?? 0) !== (user.token_version ?? 0)) {
    const error = new Error('Your session is no longer valid. Please sign in again.');
    error.code = 'INVALID_TOKEN_VERSION';
    throw error;
  }
  return { ...decoded, userId: user.user_id, email: user.email, username: user.username, avatar: user.avatar, role: user.role, branch_id: user.branch_id ?? null, status: user.status, must_change_password: user.must_change_password ?? false };
};

const isPasswordChangeRequest = (req) => {
  const path = (req.originalUrl || req.url || '').split('?')[0];
  return req.method === 'PUT' && path.endsWith('/user/profile/password');
};

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.[ACCESS_COOKIE];
  if (!token) return authError(res, 401, 'AUTH_REQUIRED', 'No token provided.');

  try {
    req.user = await authenticate(token);
    if (req.user.must_change_password && !isPasswordChangeRequest(req)) {
      return authError(res, 403, 'MUST_CHANGE_PASSWORD', 'You must set your password before continuing.');
    }
    next();
  } catch (err) {
    if (err.code === 'USER_SUSPENDED') return authError(res, 401, err.code, err.message);
    if (err.code === 'AUTH_USER_NOT_FOUND') return authError(res, 401, err.code, err.message);
    if (err.code === 'INVALID_TOKEN_VERSION') return authError(res, 401, 'INVALID_TOKEN', err.message);
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(err.name) || err.code === 'INVALID_TOKEN_USER') return authError(res, 401, 'INVALID_TOKEN', 'Invalid token.');
    return authError(res, 503, 'AUTH_DATABASE_UNAVAILABLE', 'Authentication service is temporarily unavailable.');
  }
};

/**
 * Middleware that optionally decodes JWT.
 * Does not block guests.
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.[ACCESS_COOKIE];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = await authenticate(token);
    next();
  } catch (err) {
    if (err.code === 'USER_SUSPENDED') return authError(res, 401, err.code, err.message);
    if (err.code === 'AUTH_USER_NOT_FOUND') return authError(res, 401, err.code, err.message);
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(err.name) || err.code === 'INVALID_TOKEN_USER') {
      req.user = null;
      return next();
    }
    return authError(res, 503, 'AUTH_DATABASE_UNAVAILABLE', 'Authentication service is temporarily unavailable.');
  }
};

