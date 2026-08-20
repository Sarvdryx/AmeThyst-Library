import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import pool from '../../src/config/postgres.mjs';
import { sendVerificationEmail } from '../../src/utils/mailer.mjs';
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

const RESEND_GENERIC = 'If a pending registration exists, a verification message will be sent.';

const app = express();
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
        .send({ email: mockEmail });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: RESEND_GENERIC });
      expect(sendVerificationEmail).toHaveBeenCalledWith(mockEmail, expect.any(String));
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });

  describe('Anti-email-enumeration', { tags: ['@A_R2', '@A_R4', '@A_R10'] }, () => {
    it('[TC-INT-RV-002] should return 200 with the generic message when no pending registration exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/auth/resend-verification')
        .send({ email: mockEmail });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: RESEND_GENERIC });
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });
  });
});
