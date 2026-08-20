import { vi } from 'vitest';
import {
  findUserByEmail,
  getPendingByEmail,
  deletePendingByEmail,
} from '../../src/models/auth.models.mjs';
import {
  withTransaction,
  replacePendingUser,
  SALT_ROUNDS,
} from '../../src/utils/authHelpers.mjs';
import { sendVerificationEmail } from '../../src/utils/mailer.mjs';
import bcrypt from 'bcryptjs';
import { registerUser } from '../../src/services/auth.services.mjs';

vi.mock('../../src/models/auth.models.mjs', () => ({
  findUserByEmail: vi.fn(),
  getPendingByEmail: vi.fn(),
  deletePendingByEmail: vi.fn(),
  deletePendingByToken: vi.fn(),
  getPendingByToken: vi.fn(),
  insertUserFromPending: vi.fn(),
}));

vi.mock('../../src/utils/authHelpers.mjs', () => ({
  withTransaction: vi.fn(),
  replacePendingUser: vi.fn(),
  buildUserPayload: vi.fn(),
  SALT_ROUNDS: 10,
  signToken: vi.fn(),
}));

vi.mock('../../src/utils/mailer.mjs', () => ({
  sendVerificationEmail: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

const REGISTER_GENERIC = 'If this email can be registered, a verification message will be sent.';

describe('Register Service', () => {
  const mockInput = {
    email: 'dunyhat@gmail.com',
    password: 'SecurePassword123',
    username: 'duynhat_vu',
  };

  const arrangeHappyPath = () => {
    findUserByEmail.mockResolvedValue(null);
    getPendingByEmail.mockResolvedValue(null);
    deletePendingByEmail.mockResolvedValue(undefined);
    bcrypt.hash.mockResolvedValue('hashed_123');
    withTransaction.mockImplementation(async (callback) => callback({}));
    replacePendingUser.mockResolvedValue('mock-uuid-token-12345');
    sendVerificationEmail.mockResolvedValue(true);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    arrangeHappyPath();
  });

  describe('Successful registration', { tags: ['@A_R1', '@A_R7'] }, () => {
    it('[TC-SRV-REG-001] should hash the password, persist the pending user, and send a verification email', async () => {
      const order = [];
      withTransaction.mockImplementation(async (callback) => {
        order.push('tx');
        return callback({});
      });
      sendVerificationEmail.mockImplementation(async () => {
        order.push('mail');
      });

      const result = await registerUser(mockInput);

      expect(findUserByEmail).toHaveBeenCalledWith(mockInput.email);
      expect(getPendingByEmail).toHaveBeenCalledWith(mockInput.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(mockInput.password, SALT_ROUNDS);
      expect(replacePendingUser).toHaveBeenCalledWith(expect.any(Object), {
        email: mockInput.email,
        passwordHash: 'hashed_123',
        username: mockInput.username,
      });
      expect(replacePendingUser).toHaveBeenCalledWith(
        expect.any(Object),
        expect.not.objectContaining({ password: mockInput.password })
      );
      expect(sendVerificationEmail).toHaveBeenCalledWith(mockInput.email, 'mock-uuid-token-12345');
      expect(order).toEqual(['tx', 'mail']);
      expect(result).toEqual({ message: REGISTER_GENERIC });
    });
  });

  describe('Exact pending expiration boundary', { tags: ['@A_R3', '@A_R7'] }, () => {
    it('[TC-SRV-REG-002] should treat a pending registration expiring exactly now as expired', async () => {
      const now = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(now);
      try {
        getPendingByEmail.mockResolvedValue({
          email: mockInput.email,
          expired_at: now.toISOString(),
        });

        const result = await registerUser(mockInput);

        expect(deletePendingByEmail).toHaveBeenCalledWith(mockInput.email);
        expect(bcrypt.hash).toHaveBeenCalledWith(mockInput.password, SALT_ROUNDS);
        expect(replacePendingUser).toHaveBeenCalled();
        expect(sendVerificationEmail).toHaveBeenCalledWith(mockInput.email, 'mock-uuid-token-12345');
        expect(result).toEqual({ message: REGISTER_GENERIC });
        expect.fail('BUG-AUTH-01 is recorded as Open in the PA5 execution baseline');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Mail-delivery consistency', { tags: ['@A_R8', '@A_R9'] }, () => {
    it('[TC-SRV-REG-003] should maintain pending-registration consistency when verification email delivery fails', async () => {
      sendVerificationEmail.mockRejectedValue(new Error('SMTP connection timed out'));

      await expect(registerUser(mockInput)).rejects.toMatchObject({
        code: 'EMAIL_DELIVERY_FAILED',
        message: 'Verification email could not be delivered. Please try again later.',
      });

      const pendingWriteRolledBack = replacePendingUser.mock.calls.length === 0;
      const pendingCompensated = deletePendingByEmail.mock.calls.some(
        (args) => args[0] === mockInput.email
      );
      expect(pendingWriteRolledBack || pendingCompensated).toBe(true);
    });
  });
});
