import { vi, describe, it, expect, beforeEach } from 'vitest';
import pool from '../../src/config/postgres.mjs';
import { googleVerifyCallback } from '../../src/config/passport.mjs';

vi.mock('../../src/config/postgres.mjs', () => ({
  default: {
    query: vi.fn(),
  },
}));

describe('Google Auth Strategy', () => {
  const mockProfile = {
    emails: [{ value: 'oauth@example.com' }],
    displayName: 'Google User',
    photos: [{ value: 'https://avatar-url.com/pic.jpg' }],
  };

  const mockDone = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('First-time provisioning', { tags: ['@A_R5', '@A_R7'] }, () => {
    it('[TC-CFG-GA-001] should provision a Google user with mapped data and a null avatar fallback', async () => {
      const mockCreatedUser = {
        user_id: 88,
        email: 'oauth@example.com',
        username: 'Google User',
        avatar: 'https://avatar-url.com/pic.jpg',
        role: 'user',
      };
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [mockCreatedUser] });

      await googleVerifyCallback('access', 'refresh', mockProfile, mockDone);

      expect(pool.query).toHaveBeenNthCalledWith(1, 'SELECT * FROM users WHERE email = $1', [
        'oauth@example.com',
      ]);
      expect(pool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO users'),
        ['oauth@example.com', 'Google User', 'https://avatar-url.com/pic.jpg', 'GOOGLE_AUTH', 'user']
      );
      expect(mockDone).toHaveBeenCalledWith(null, mockCreatedUser);

      vi.clearAllMocks();
      const profileNoPhoto = {
        emails: [{ value: 'oauth@example.com' }],
        displayName: 'Google User',
      };
      const mockCreatedWithoutPhoto = {
        ...mockCreatedUser,
        user_id: 89,
        avatar: null,
      };
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [mockCreatedWithoutPhoto] });

      await googleVerifyCallback('access', 'refresh', profileNoPhoto, mockDone);

      expect(pool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO users'),
        ['oauth@example.com', 'Google User', null, 'GOOGLE_AUTH', 'user']
      );
      expect(mockDone).toHaveBeenCalledWith(null, mockCreatedWithoutPhoto);
    });
  });

  describe('Returning user and password-account collision', { tags: ['@A_R2', '@A_R6'] }, () => {
    it('[TC-CFG-GA-002] should return an existing Google user and refuse a password-account collision', async () => {
      const mockExistingUser = {
        user_id: 88,
        email: 'oauth@example.com',
        username: 'Google User',
        avatar: 'https://avatar-url.com/pic.jpg',
        password_hash: 'GOOGLE_AUTH',
        role: 'user',
      };
      pool.query.mockResolvedValueOnce({ rows: [mockExistingUser] });

      await googleVerifyCallback('access', 'refresh', mockProfile, mockDone);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(mockDone).toHaveBeenCalledWith(null, mockExistingUser);

      vi.clearAllMocks();
      const mockPasswordUser = {
        user_id: 99,
        email: 'oauth@example.com',
        username: 'Existing Password User',
        avatar: null,
        password_hash: '$2b$10$bcrypt-hash-xyz',
        role: 'user',
      };
      pool.query.mockResolvedValueOnce({ rows: [mockPasswordUser] });

      await googleVerifyCallback('access', 'refresh', mockProfile, mockDone);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(mockDone).toHaveBeenCalledWith(null, false, { message: 'account_exists_with_password' });
    });
  });

});
