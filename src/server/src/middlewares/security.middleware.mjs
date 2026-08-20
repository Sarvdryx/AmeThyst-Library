import crypto from 'crypto';
import { rateLimit } from 'express-rate-limit';
import { CSRF_COOKIE } from '../utils/authHelpers.mjs';

const rateResponse = (req, res) => res.status(429).json({
  success: false,
  error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
});

const limiter = (options) => rateLimit({
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateResponse,
  ...options,
});

const positiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

// A dashboard loads several independent widgets and reconnecting sockets can
// cause short request bursts. Keep the global limiter as a broad abuse guard;
// sensitive auth endpoints below retain their substantially tighter limits.
export const globalApiLimiter = limiter({
  windowMs: positiveInteger(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS, 60 * 1000),
  limit: positiveInteger(process.env.GLOBAL_RATE_LIMIT_MAX, 600),
  skip: (req) => req.method === 'OPTIONS',
});
export const loginLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 10 });
export const registerLimiter = limiter({ windowMs: 60 * 60 * 1000, limit: 5 });
export const otpLimiter = limiter({ windowMs: 10 * 60 * 1000, limit: 5 });
export const recoveryLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 3 });

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export const verifyCsrf = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (!req.cookies?.amethyst_access) return next();
  const cookieToken = req.cookies[CSRF_COOKIE];
  const headerToken = req.get('x-csrf-token');
  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    return res.status(403).json({
      success: false,
      error: { code: 'CSRF_INVALID', message: 'Security token is missing or invalid.' },
    });
  }
  return next();
};

export const requireLibrarianBranch = (req, res, next) => {
  if (req.user?.role === 'librarian' && !req.user?.branch_id) {
    return res.status(400).json({
      success: false,
      error: { code: 'BRANCH_REQUIRED', message: 'A librarian branch assignment is required.' },
    });
  }
  return next();
};
