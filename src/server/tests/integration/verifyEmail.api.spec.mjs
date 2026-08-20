import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import pool from '../../src/config/postgres.mjs';
import { createAuthSession } from '../../src/services/auth-session.services.mjs';
import authRoutes from '../../src/routes/auth.routes.mjs';

vi.mock('../../src/config/postgres.mjs', () => {
  const queryMock = vi.fn();
  const connectMock = vi.fn();
  return {
    default: {
      query: queryMock,
      connect: connectMock,
      on: vi.fn(),
    },
  };
});

vi.mock('../../src/services/auth-session.services.mjs', () => ({
  createAuthSession: vi.fn(),
  revokeRefreshToken: vi.fn(),
  rotateAuthSession: vi.fn(),
}));

vi.mock('../../src/services/recommendation.services.mjs', () => ({
  getUserRecommendations: vi.fn().mockResolvedValue(undefined),
}));

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Verify Email API', () => {
  let mockClient;
  const mockToken = 'mock-uuid-token-54321';

  const sessionUser = {
    userId: 42,
    email: 'verify@example.com',
    username: 'verify_user',
    avatar: null,
    role: 'user',
    branch_id: null,
    must_change_password: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };

    pool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({ rows: [] });
    pool.query.mockResolvedValue({ rows: [] });
    createAuthSession.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      csrfToken: 'csrf',
      user: sessionUser,
    });
  });

  describe('Successful HTTP flow', { tags: ['@A_R1', '@A_R7', '@A_R10'] }, () => {
    it('[TC-INT-VE-001] should return 200 with the session user and no JWT field', async () => {
      const mockPendingRow = {
        token: mockToken,
        email: 'verify@example.com',
        password_hash: 'hashed_password',
        username: 'verify_user',
        expired_at: new Date(Date.now() + 60000).toISOString(),
      };

      const mockUserRow = {
        user_id: 42,
        email: 'verify@example.com',
        username: 'verify_user',
        password_hash: 'hashed_password',
        avatar: null,
        role: 'user',
      };

      pool.query.mockResolvedValueOnce({ rows: [mockPendingRow] });
      pool.query.mockResolvedValueOnce({ rows: [] });

      mockClient.query.mockImplementation(async (sql) => {
        if (typeof sql === 'string' && sql.includes('INSERT INTO users')) {
          return { rows: [mockUserRow] };
        }
        return { rows: [] };
      });

      const res = await request(app)
        .post('/auth/verify-email')
        .send({ token: mockToken });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ user: sessionUser });
      expect(res.body).not.toHaveProperty('token');
      expect(createAuthSession).toHaveBeenCalledWith(mockUserRow, expect.any(Object));
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });

  describe('Request validation', { tags: ['@A_R3', '@A_R10'] }, () => {
    it('[TC-INT-VE-002] should return 400 when the verification token is missing', async () => {
      const res = await request(app)
        .post('/auth/verify-email')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Verification token is required' });
      expect(createAuthSession).not.toHaveBeenCalled();
    });
  });

});
