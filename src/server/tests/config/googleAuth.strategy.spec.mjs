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
    it('[TC-CFG-GA-001] should provision a Google user with the profile avatar', async () => {
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
    });

    it('[TC-CFG-GA-003] should provision a Google user with a null avatar when no photo exists', async () => {
      const profileNoPhoto = {
        emails: [{ value: 'oauth@example.com' }],
        displayName: 'Google User',
      };
      const mockCreatedWithoutPhoto = {
        user_id: 89,
        email: 'oauth@example.com',
        username: 'Google User',
        avatar: null,
        role: 'user',
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
    it('[TC-CFG-GA-002] should return an existing Google user without inserting a duplicate', async () => {
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
    });

    it('[TC-CFG-GA-004] should refuse a password-account collision', async () => {
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

  describe('Profile validation', { tags: ['@A_R7'] }, () => {
    it('[TC-CFG-GA-005] should reject a profile without a verified email', async () => {
      const profileWithoutVerifiedEmail = {
        emails: [{ value: 'unverified@example.com', verified: false }],
        displayName: 'Unverified User',
      };

      await googleVerifyCallback('access', 'refresh', profileWithoutVerifiedEmail, mockDone);

      expect(pool.query).not.toHaveBeenCalled();
      expect(mockDone).toHaveBeenCalledWith(null, false, { message: 'verified_email_required' });
    });
  });
});
