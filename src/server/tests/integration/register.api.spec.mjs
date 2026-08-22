import { vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import pool from '../../src/config/postgres.mjs';
import { sendVerificationEmail } from '../../src/utils/mailer.mjs';
import bcrypt from 'bcryptjs';
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

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

const REGISTER_GENERIC = 'If this email can be registered, a verification message will be sent.';

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use('/auth', authRoutes);

describe('Register API', () => {
  let mockClient;

  const validBody = {
    email: 'integration@example.com',
    password: 'Password123',
    username: 'integration_user',
  };

  const arrangeHappyPath = () => {
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };

    pool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({ rows: [] });
    pool.query.mockResolvedValue({ rows: [] });
    bcrypt.hash.mockResolvedValue('mocked_hashed_password');
    sendVerificationEmail.mockResolvedValue(true);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    arrangeHappyPath();
  });

  describe('Successful HTTP flow', { tags: ['@A_R1', '@A_R10'] }, () => {
    it('[TC-INT-REG-001] should register via the API and send a verification email with a generic 201 body', async () => {
      const res = await request(app)
        .post('/auth/register')
        .set('X-Forwarded-For', '198.51.100.11')
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ message: REGISTER_GENERIC });
      expect(sendVerificationEmail).toHaveBeenCalledWith('integration@example.com', expect.any(String));
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });

  describe('Anti-email-enumeration', { tags: ['@A_R2', '@A_R10'] }, () => {
    it('[TC-INT-REG-002] should return 201 with the generic message and skip mailer when the email already exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1, email: 'dup@example.com' }] });

      const res = await request(app)
        .post('/auth/register')
        .set('X-Forwarded-For', '198.51.100.12')
        .send({
          email: 'dup@example.com',
          password: 'Password123',
          username: 'dup_user',
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ message: REGISTER_GENERIC });
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('Pending-registration lifecycle', { tags: ['@A_R3', '@A_R10'] }, () => {
    it('[TC-INT-REG-003] should hide an active pending registration without replacing it or sending another email', async () => {
      const activePending = {
        email: validBody.email,
        password_hash: 'existing_hash',
        username: validBody.username,
        token: 'active-token',
        expired_at: new Date(Date.now() + 60_000).toISOString(),
      };
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [activePending] });

      const res = await request(app)
        .post('/auth/register')
        .set('X-Forwarded-For', '198.51.100.13')
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ message: REGISTER_GENERIC });
      expect(pool.connect).not.toHaveBeenCalled();
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('Request validation', { tags: ['@A_R7', '@A_R10'] }, () => {
    it('[TC-INT-REG-004] should reject an invalid registration body before persistence', async () => {
      const res = await request(app)
        .post('/auth/register')
        .set('X-Forwarded-For', '198.51.100.14')
        .send({ email: 'not-an-email', password: 'weak', username: '' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR' },
      });
      expect(pool.query).not.toHaveBeenCalled();
      expect(pool.connect).not.toHaveBeenCalled();
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('Failed-delivery retry consistency', { tags: ['@A_R8', '@A_R9', '@A_R10'] }, () => {
    it('[TC-INT-REG-005] should allow a retry to create and deliver a fresh pending registration after initial mail failure', async () => {
      let persistedPending = null;

      pool.query.mockImplementation(async (sql, values) => {
        if (sql.includes('SELECT * FROM users')) return { rows: [] };
        if (sql.includes('SELECT * FROM pending_users WHERE email')) {
          return { rows: persistedPending ? [{ ...persistedPending }] : [] };
        }
        if (sql.includes('DELETE FROM pending_users WHERE email')) {
          if (persistedPending?.email === values[0]) persistedPending = null;
          return { rows: [] };
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
      sendVerificationEmail
        .mockRejectedValueOnce(new Error('SMTP connection timed out'))
        .mockResolvedValueOnce(true);

      const first = await request(app)
        .post('/auth/register')
        .set('X-Forwarded-For', '198.51.100.15')
        .send(validBody);
      const tokenAfterFailure = persistedPending?.token;
      const second = await request(app)
        .post('/auth/register')
        .set('X-Forwarded-For', '198.51.100.15')
        .send(validBody);

      expect(first.status).toBe(502);
      expect(second.status).toBe(201);
      expect(sendVerificationEmail).toHaveBeenCalledTimes(2);
      expect(persistedPending?.token).not.toBe(tokenAfterFailure);
    });
  });
});
