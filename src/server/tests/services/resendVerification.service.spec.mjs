import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getPendingByEmail } from '../../src/models/auth.models.mjs';
import {
  withTransaction,
  replacePendingUser,
} from '../../src/utils/authHelpers.mjs';
import { sendVerificationEmail } from '../../src/utils/mailer.mjs';
import { resendVerificationEmailService } from '../../src/services/auth.services.mjs';

vi.mock('../../src/models/auth.models.mjs', () => ({
  getPendingByEmail: vi.fn(),
  findUserByEmail: vi.fn(),
  getPendingByToken: vi.fn(),
  deletePendingByToken: vi.fn(),
  deletePendingByEmail: vi.fn(),
  insertUserFromPending: vi.fn(),
}));

vi.mock('../../src/utils/authHelpers.mjs', () => ({
  withTransaction: vi.fn(),
  replacePendingUser: vi.fn(),
  signToken: vi.fn(),
  buildUserPayload: vi.fn(),
}));

vi.mock('../../src/utils/mailer.mjs', () => ({
  sendVerificationEmail: vi.fn(),
}));

const RESEND_GENERIC = 'If a pending registration exists, a verification message will be sent.';

describe('Resend Verification Service', () => {
  const mockEmail = 'resend@example.com';
  const mockPendingRow = {
    email: mockEmail,
    password_hash: 'existing_password_hash',
    username: 'resend_user',
    expired_at: new Date(Date.now() - 1000).toISOString(),
  };

  const arrangeHappyPath = () => {
    getPendingByEmail.mockResolvedValue(mockPendingRow);
    withTransaction.mockImplementation(async (callback) => callback({}));
    replacePendingUser.mockResolvedValue('new-resend-token-uuid');
    sendVerificationEmail.mockResolvedValue(true);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    arrangeHappyPath();
  });

  describe('Successful resend', { tags: ['@A_R4', '@A_R7'] }, () => {
    it('[TC-SRV-RV-001] should reuse the password hash, refresh the token, and send a generic confirmation', async () => {
      const order = [];
      withTransaction.mockImplementation(async (callback) => {
        order.push('tx');
        return callback({});
      });
      sendVerificationEmail.mockImplementation(async () => {
        order.push('mail');
      });

      const result = await resendVerificationEmailService({ email: mockEmail });

      expect(getPendingByEmail).toHaveBeenCalledWith(mockEmail);
      expect(replacePendingUser).toHaveBeenCalledWith(expect.any(Object), {
        email: mockEmail,
        passwordHash: mockPendingRow.password_hash,
        username: mockPendingRow.username,
      });
      expect(sendVerificationEmail).toHaveBeenCalledWith(mockEmail, 'new-resend-token-uuid');
      expect(order).toEqual(['tx', 'mail']);
      expect(result).toEqual({ message: RESEND_GENERIC });
    });
  });

  describe('Missing pending registration', { tags: ['@A_R2', '@A_R4'] }, () => {
    it('[TC-SRV-RV-002] should return the generic message without side effects when no pending registration exists', async () => {
      getPendingByEmail.mockResolvedValue(null);

      const result = await resendVerificationEmailService({ email: mockEmail });

      expect(result).toEqual({ message: RESEND_GENERIC });
      expect(replacePendingUser).not.toHaveBeenCalled();
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('Mail-delivery consistency', { tags: ['@A_R4', '@A_R8', '@A_R9'] }, () => {
    it('[TC-SRV-RV-003] should preserve the previous token and TTL when replacement email delivery fails', async () => {
      let transactionRejected = false;
      withTransaction.mockImplementation(async (callback) => {
        try {
          return await callback({});
        } catch (err) {
          transactionRejected = true;
          throw err;
        }
      });
      sendVerificationEmail.mockRejectedValue(new Error('SMTP Connection timed out'));

      await expect(resendVerificationEmailService({ email: mockEmail })).rejects.toMatchObject({
        code: 'EMAIL_DELIVERY_FAILED',
        message: 'Verification email could not be delivered. Please try again later.',
      });

      const delayedCommit = replacePendingUser.mock.calls.length === 0;
      const transactionRolledBack = transactionRejected;
      const previousTokenRestored = replacePendingUser.mock.calls.length >= 2;

      expect(delayedCommit || transactionRolledBack || previousTokenRestored).toBe(true);
      expect.fail('BUG-AUTH-04 is recorded as Open in the PA5 execution baseline');
    });
  });
});
