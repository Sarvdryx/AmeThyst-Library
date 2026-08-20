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
      const res = await request(app).post('/auth/register').send(validBody);

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

});
