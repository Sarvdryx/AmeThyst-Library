import { vi } from 'vitest';
import jwt from 'jsonwebtoken';
import pool from '../../src/config/postgres.mjs';
import {
  signToken,
  buildUserPayload,
  withTransaction,
  replacePendingUser,
  PENDING_TTL_MS,
} from '../../src/utils/authHelpers.mjs';

vi.mock('../../src/config/postgres.mjs', () => {
  const queryMock = vi.fn();
  const connectMock = vi.fn();
  return {
    default: {
      query: queryMock,
      connect: connectMock,
    },
  };
});

describe('Auth Helpers - authHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildUserPayload', () => {
    it('[TC-UTL-AUTH-001] should filter user object to build a clean payload and omit password_hash', () => {
      const user = {
        user_id: 42,
        email: 'test@example.com',
        username: 'testuser',
        avatar: 'avatar.png',
        role: 'admin',
        password_hash: 'secret_hash_not_to_leak',
        created_at: new Date(),
      };
      const payload = buildUserPayload(user);
      expect(payload).toEqual({
        userId: 42,
        email: 'test@example.com',
        username: 'testuser',
        avatar: 'avatar.png',
        role: 'admin',
      });
      expect(payload.password_hash).toBeUndefined();
    });
  });

  describe('signToken', () => {
    it('[TC-UTL-AUTH-002] should generate a JWT token signed with JWT_SECRET expiring in 7d', () => {
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'my_super_secret_key';

      const jwtSpy = vi.spyOn(jwt, 'sign').mockReturnValue('mock-jwt-token');

      const token = signToken(123, 'user@example.com');

      expect(jwtSpy).toHaveBeenCalledWith(
        { userId: 123, email: 'user@example.com' },
        'my_super_secret_key',
        { expiresIn: '7d' }
      );
      expect(token).toBe('mock-jwt-token');

      process.env.JWT_SECRET = originalSecret;
      jwtSpy.mockRestore();
    });
  });

  describe('withTransaction', () => {
    let clientMock;

    beforeEach(() => {
      clientMock = {
        query: vi.fn(),
        release: vi.fn(),
      };
      pool.connect.mockResolvedValue(clientMock);
    });

    it('[TC-UTL-AUTH-003] should execute BEGIN, callback, COMMIT, and release the client on success', async () => {
      const callbackMock = vi.fn().mockResolvedValue('callback_result');

      const result = await withTransaction(callbackMock);

      expect(pool.connect).toHaveBeenCalled();
      expect(clientMock.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(callbackMock).toHaveBeenCalledWith(clientMock);
      expect(clientMock.query).toHaveBeenNthCalledWith(2, 'COMMIT');
      expect(clientMock.release).toHaveBeenCalled();
      expect(result).toBe('callback_result');
    });

    it('[TC-UTL-AUTH-004] should execute BEGIN, ROLLBACK on error, release client, and rethrow the error', async () => {
      const callbackMock = vi.fn().mockRejectedValue(new Error('Query failed'));

      await expect(withTransaction(callbackMock)).rejects.toThrow('Query failed');

      expect(pool.connect).toHaveBeenCalled();
      expect(clientMock.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(callbackMock).toHaveBeenCalledWith(clientMock);
      expect(clientMock.query).toHaveBeenNthCalledWith(2, 'ROLLBACK');
      expect(clientMock.release).toHaveBeenCalled();
    });
  });

  describe('replacePendingUser', () => {
    let clientMock;

    beforeEach(() => {
      clientMock = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };
    });

    it('[TC-UTL-AUTH-005] should delete existing pending rows, insert a new row with 5m TTL, and return a UUID token', async () => {
      const mockNow = new Date('2026-07-03T15:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);

      try {
        const email = 'newuser@example.com';
        const passwordHash = 'hash';
        const username = 'newuser';

        const token = await replacePendingUser(clientMock, { email, passwordHash, username });

        expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

        expect(clientMock.query).toHaveBeenCalledTimes(2);

        expect(clientMock.query.mock.calls[0]).toEqual([
          'DELETE FROM pending_users WHERE email = $1',
          [email]
        ]);

        expect(clientMock.query.mock.calls[1][0]).toContain('INSERT INTO pending_users');
        const expectedExpiry = new Date(mockNow.getTime() + PENDING_TTL_MS);
        expect(clientMock.query.mock.calls[1][1]).toEqual([
          token,
          email,
          passwordHash,
          username,
          'user',
          expectedExpiry
        ]);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
