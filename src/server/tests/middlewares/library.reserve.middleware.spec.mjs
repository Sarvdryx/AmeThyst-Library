import { vi } from 'vitest';
import jwt from 'jsonwebtoken';
import pool from '../../src/config/postgres.mjs';
import { verifyToken } from '../../src/middlewares/auth.middleware.mjs';
import { authorizeRole } from '../../src/middlewares/role.middleware.mjs';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn(),
  },
}));

vi.mock('../../src/config/postgres.mjs', () => ({
  default: {
    query: vi.fn(),
    connect: vi.fn(),
    on: vi.fn(),
  },
}));

const USER_ID = 'u-001';

describe('middlewares for POST /api/library/reserve', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      headers: { authorization: 'Bearer valid-token' },
      user: undefined,
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('verifyToken', () => {
    it('[TC-MID-LIB-001] should return 401 AUTH_REQUIRED when no token is provided', async () => {
      req.headers = {};

      await verifyToken(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'No token provided.' },
      });
    });

    it('[TC-MID-LIB-002] should attach the user to req and call next on a valid token', async () => {
      jwt.verify.mockReturnValue({ userId: USER_ID, role: 'user' });
      pool.query.mockResolvedValue({
        rows: [
          {
            user_id: USER_ID,
            email: 'user@example.com',
            role: 'user',
            branch_id: 1,
          },
        ],
      });
      const next = vi.fn();

      await verifyToken(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(req.user).toMatchObject({
        userId: USER_ID,
        email: 'user@example.com',
        role: 'user',
        branch_id: 1,
      });
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT user_id, email, username, avatar, role, branch_id, status, token_version, must_change_password FROM public.users'),
        [USER_ID]
      );
    });

    it('[TC-MID-LIB-003] should return 401 INVALID_TOKEN when the JWT is invalid', async () => {
      jwt.verify.mockImplementation(() => {
        const err = new Error('jwt malformed');
        err.name = 'JsonWebTokenError';
        throw err;
      });

      await verifyToken(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token.' },
      });
    });

    it('[TC-MID-LIB-004] should return 401 AUTH_USER_NOT_FOUND when the user no longer exists', async () => {
      jwt.verify.mockReturnValue({ userId: USER_ID });
      pool.query.mockResolvedValue({ rows: [] });

      await verifyToken(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_USER_NOT_FOUND',
          message: 'Your account is no longer available. Please sign in again.',
        },
      });
    });

    it('[TC-MID-LIB-005] should return 503 AUTH_DATABASE_UNAVAILABLE when the user lookup query fails', async () => {
      jwt.verify.mockReturnValue({ userId: USER_ID });
      pool.query.mockRejectedValue(new Error('connection refused'));

      await verifyToken(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_DATABASE_UNAVAILABLE',
          message: 'Authentication service is temporarily unavailable.',
        },
      });
    });
  });

  describe('authorizeRole', () => {
    it('[TC-MID-LIB-006] should return 401 when req.user is missing', async () => {
      authorizeRole('user')(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('[TC-MID-LIB-007] should return 403 when the user role is not allowed', async () => {
      req.user = { userId: USER_ID, role: 'librarian' };

      authorizeRole('user')(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: insufficient permissions' });
    });

    it('[TC-MID-LIB-008] should call next when the user has an allowed role', async () => {
      req.user = { userId: USER_ID, role: 'user' };
      const next = vi.fn();

      authorizeRole('user')(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
