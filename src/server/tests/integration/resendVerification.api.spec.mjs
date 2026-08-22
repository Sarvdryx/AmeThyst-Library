import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import pool from '../../src/config/postgres.mjs';
import { sendVerificationEmail } from '../../src/utils/mailer.mjs';
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

vi.mock('../../src/utils/mailer.mjs', () => ({
  sendVerificationEmail: vi.fn(),
  sendOTPEmail: vi.fn(),
}));

vi.mock('../../src/services/auth-session.services.mjs', () => ({
  createAuthSession: vi.fn(),
  revokeRefreshToken: vi.fn(),
  rotateAuthSession: vi.fn(),
}));

vi.mock('../../src/services/recommendation.services.mjs', () => ({
  getUserRecommendations: vi.fn().mockResolvedValue(undefined),
}));

const RESEND_GENERIC = 'If a pending registration exists, a verification message will be sent.';

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use('/auth', authRoutes);

describe('Resend Verification API', () => {
  let mockClient;
  const mockEmail = 'resend-api@example.com';

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };

    pool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({ rows: [] });
    pool.query.mockResolvedValue({ rows: [] });
    sendVerificationEmail.mockResolvedValue(true);
    createAuthSession.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      csrfToken: 'csrf',
      user: {
        userId: 77,
        email: mockEmail,
        username: 'resend_api_user',
        avatar: null,
        role: 'user',
        branch_id: null,
        must_change_password: false,
      },
    });
  });

  describe('Successful HTTP flow', { tags: ['@A_R4', '@A_R9', '@A_R10'] }, () => {
    it('[TC-INT-RV-001] should return 200 with the generic message and send a verification email', async () => {
      const mockPendingRow = {
        email: mockEmail,
        password_hash: 'hashed_pwd_abc',
        username: 'resend_api_user',
      };

      pool.query.mockResolvedValueOnce({ rows: [mockPendingRow] });

      mockClient.query.mockImplementation(async (sql) => {
        if (typeof sql === 'string' && sql.includes('INSERT INTO pending_users')) {
          return { rows: [] };
        }
        return { rows: [] };
      });

      const res = await request(app)
        .post('/auth/resend-verification')
        .set('X-Forwarded-For', '198.51.100.21')
        .send({ email: mockEmail });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: RESEND_GENERIC });
      expect(sendVerificationEmail).toHaveBeenCalledWith(mockEmail, expect.any(String));
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

      const insertCall = mockClient.query.mock.calls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('INSERT INTO pending_users')
      );
      expect(insertCall).toBeDefined();
      expect(insertCall[1]).toEqual(
        expect.arrayContaining([
          mockEmail,
          mockPendingRow.password_hash,
          mockPendingRow.username,
        ])
      );
      expect(insertCall[1]).toEqual(
        expect.arrayContaining([
          expect.any(String),
          expect.anything(),
        ])
      );

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });

  describe('Anti-email-enumeration', { tags: ['@A_R2', '@A_R4', '@A_R10'] }, () => {
    it('[TC-INT-RV-002] should return 200 with the generic message when no pending registration exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/auth/resend-verification')
        .set('X-Forwarded-For', '198.51.100.22')
        .send({ email: mockEmail });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: RESEND_GENERIC });
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('Failed-delivery consistency', { tags: ['@A_R4', '@A_R8', '@A_R9', '@A_R10'] }, () => {
    it('[TC-INT-RV-003] should keep the previous token committed until resend delivery is confirmed', async () => {
      const previousPending = {
        email: mockEmail,
        password_hash: 'hashed_pwd_abc',
        username: 'resend_api_user',
        token: 'previous-api-token',
        expired_at: new Date(Date.now() + 60_000),
      };
      let persistedPending = { ...previousPending };
      let stateObservedByMailer;

      pool.query.mockImplementation(async (sql, values) => {
        if (sql.includes('SELECT * FROM pending_users WHERE email')) {
          return { rows: persistedPending?.email === values[0] ? [{ ...persistedPending }] : [] };
        }
        return { rows: [] };
      });
      mockClient.query.mockImplementation(async (sql, values) => {
        if (typeof sql === 'string' && sql.includes('DELETE FROM pending_users WHERE email')) {
          if (persistedPending?.email === values[0]) persistedPending = null;
        }
        if (typeof sql === 'string' && sql.includes('INSERT INTO pending_users')) {
          persistedPending = {
            token: values[0],
            email: values[1],
            password_hash: values[2],
            username: values[3],
            role: values[4],
            expired_at: values[5],
          };
        }
        return { rows: [] };
      });
      sendVerificationEmail.mockImplementation(async () => {
        stateObservedByMailer = { ...persistedPending };
        throw new Error('SMTP connection timed out');
      });

      const res = await request(app)
        .post('/auth/resend-verification')
        .set('X-Forwarded-For', '198.51.100.23')
        .send({ email: mockEmail });

      expect(res.status).toBe(502);
      expect(persistedPending.token).toBe(previousPending.token);
      expect(persistedPending.expired_at).toBe(previousPending.expired_at);
      expect(stateObservedByMailer.token).toBe(previousPending.token);
      expect(stateObservedByMailer.expired_at).toBe(previousPending.expired_at);
    });

    it('[TC-INT-RV-004] should keep the previous token verifiable while a resend that later fails is in progress', async () => {
      const previousToken = 'previous-verifiable-token';
      let persistedPending = {
        email: mockEmail,
        password_hash: 'hashed_pwd_abc',
        username: 'resend_api_user',
        token: previousToken,
        expired_at: new Date(Date.now() + 60_000),
      };
      let rejectDelivery;

      pool.query.mockImplementation(async (sql, values) => {
        if (sql.includes('SELECT * FROM pending_users WHERE email')) {
          return { rows: persistedPending?.email === values[0] ? [{ ...persistedPending }] : [] };
        }
        if (sql.includes('SELECT * FROM pending_users WHERE token')) {
          return { rows: persistedPending?.token === values[0] ? [{ ...persistedPending }] : [] };
        }
        if (sql.includes('SELECT * FROM users WHERE email')) return { rows: [] };
        return { rows: [] };
      });
      mockClient.query.mockImplementation(async (sql, values) => {
        if (typeof sql === 'string' && sql.includes('DELETE FROM pending_users WHERE email')) {
          if (persistedPending?.email === values[0]) persistedPending = null;
        }
        if (typeof sql === 'string' && sql.includes('INSERT INTO pending_users')) {
          persistedPending = {
            token: values[0],
            email: values[1],
            password_hash: values[2],
            username: values[3],
            role: values[4],
            expired_at: values[5],
          };
        }
        if (typeof sql === 'string' && sql.includes('INSERT INTO users')) {
          return {
            rows: [{
              user_id: 77,
              email: mockEmail,
              username: 'resend_api_user',
              avatar: null,
              role: 'user',
            }],
          };
        }
        if (typeof sql === 'string' && sql.includes('DELETE FROM pending_users WHERE token')) {
          if (persistedPending?.token === values[0]) persistedPending = null;
        }
        return { rows: [] };
      });
      sendVerificationEmail.mockImplementation(() => new Promise((_resolve, reject) => {
        rejectDelivery = reject;
      }));

      const resendPromise = request(app)
        .post('/auth/resend-verification')
        .set('X-Forwarded-For', '198.51.100.24')
        .send({ email: mockEmail })
        .then((response) => response);
      await vi.waitFor(() => expect(sendVerificationEmail).toHaveBeenCalledTimes(1));

      const verification = await request(app)
        .post('/auth/verify-email')
        .send({ token: previousToken });

      rejectDelivery(new Error('SMTP connection timed out'));
      const resend = await resendPromise;

      expect(resend.status).toBe(502);
      expect(persistedPending.token).toBe(previousToken);
      expect(verification.status).toBe(200);
      expect(verification.body).toHaveProperty('user');
    });
  });
});
