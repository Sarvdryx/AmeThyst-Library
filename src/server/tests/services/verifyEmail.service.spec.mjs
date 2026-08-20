import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  findUserByEmail,
  getPendingByToken,
  deletePendingByToken,
  insertUserFromPending,
} from '../../src/models/auth.models.mjs';
import {
  withTransaction,
  signToken,
  buildUserPayload,
} from '../../src/utils/authHelpers.mjs';
import { verifyEmail } from '../../src/services/auth.services.mjs';

vi.mock('../../src/models/auth.models.mjs', () => ({
  findUserByEmail: vi.fn(),
  getPendingByToken: vi.fn(),
  deletePendingByToken: vi.fn(),
  insertUserFromPending: vi.fn(),
  getPendingByEmail: vi.fn(),
  deletePendingByEmail: vi.fn(),
}));

vi.mock('../../src/utils/authHelpers.mjs', () => ({
  withTransaction: vi.fn(),
  signToken: vi.fn(),
  buildUserPayload: vi.fn(),
}));

describe('Verify Email Service', () => {
  const mockToken = 'mock-uuid-token-54321';
  const mockPendingRow = {
    token: mockToken,
    email: 'verify@example.com',
    password_hash: 'hashed_password',
    username: 'verify_user',
    role: 'user',
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

  const mockMappedUser = {
    userId: 42,
    email: 'verify@example.com',
    username: 'verify_user',
    avatar: null,
    role: 'user',
    branch_id: null,
  };

  const arrangeHappyPath = () => {
    getPendingByToken.mockResolvedValue(mockPendingRow);
    findUserByEmail.mockResolvedValue(null);
    withTransaction.mockImplementation(async (callback) => callback({}));
    insertUserFromPending.mockResolvedValue(mockUserRow);
    deletePendingByToken.mockResolvedValue(undefined);
    buildUserPayload.mockReturnValue(mockMappedUser);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    arrangeHappyPath();
  });

  describe('Successful promotion', { tags: ['@A_R1', '@A_R7'] }, () => {
    it('[TC-SRV-VE-001] should promote the pending user, delete the token, and return a safe payload without a JWT field', async () => {
      const result = await verifyEmail({ token: mockToken });

      expect(getPendingByToken).toHaveBeenCalledWith(mockToken);
      expect(findUserByEmail).toHaveBeenCalledWith(mockPendingRow.email);
      expect(insertUserFromPending).toHaveBeenCalledWith(
        {
          email: mockPendingRow.email,
          passwordHash: mockPendingRow.password_hash,
          username: mockPendingRow.username,
        },
        expect.any(Object)
      );
      expect(deletePendingByToken).toHaveBeenCalledWith(mockToken, expect.any(Object));
      expect(signToken).not.toHaveBeenCalled();
      expect(buildUserPayload).toHaveBeenCalledWith(mockUserRow);
      expect(result).toEqual({ user: mockMappedUser, userRow: mockUserRow });
      expect(result.user).not.toHaveProperty('password_hash');
      expect(result).not.toHaveProperty('token');
    });
  });

  describe('Exact token expiration boundary', { tags: ['@A_R3', '@A_R7'] }, () => {
    it('[TC-SRV-VE-002] should reject a verification token expiring exactly now', async () => {
      const now = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(now);
      try {
        getPendingByToken.mockResolvedValue({
          ...mockPendingRow,
          expired_at: now.toISOString(),
        });

        await expect(verifyEmail({ token: mockToken })).rejects.toThrow(
          'Verification link has expired. Please register again.'
        );
        expect(deletePendingByToken).toHaveBeenCalledWith(mockToken);
        expect(insertUserFromPending).not.toHaveBeenCalled();
        expect.fail('BUG-AUTH-03 is recorded as Open in the PA5 execution baseline');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Duplicate email consistency', { tags: ['@A_R2'] }, () => {
    it('[TC-SRV-VE-003] should delete the pending token and throw when the email was registered in the meantime', async () => {
      findUserByEmail.mockResolvedValue({ user_id: 101, email: mockPendingRow.email });

      await expect(verifyEmail({ token: mockToken })).rejects.toThrow('Email already exists.');

      expect(deletePendingByToken).toHaveBeenCalledWith(mockToken);
      expect(insertUserFromPending).not.toHaveBeenCalled();
    });
  });
});
