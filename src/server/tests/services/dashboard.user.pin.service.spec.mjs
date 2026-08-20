import { vi } from 'vitest';
import pool from '../../src/config/postgres.mjs';
import {
  generatePickupPin,
  generateReturnPin,
  cleanupReturnPin,
  cleanupReservationPin,
} from '../../src/services/dashboard.user.services.mjs';

vi.mock('../../src/config/postgres.mjs', () => ({
  default: {
    query: vi.fn(),
    connect: vi.fn(),
    on: vi.fn(),
  },
}));

const USER_ID = 'u-001';
const BORROW_ID = 'bb-001';

describe('dashboard.user.services.mjs - PIN lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePickupPin - confirm borrow flow', () => {
    it('[TC-SRV-PIN-US-001] should generate a 6-digit PIN, set status pending, and return expiresAt 180s in the future', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('WHERE borrow_id = $1 AND user_id = $2 AND status IN')) {
          return { rows: [{ borrow_id: BORROW_ID, user_id: USER_ID }] };
        }
        if (sql.includes('pin IS NOT NULL AND expired_at > NOW()')) {
          return { rows: [] };
        }
        if (sql.includes('SET pin = NULL, expired_at = NULL, status = \'reserved\'')) {
          return { rowCount: 1, rows: [] };
        }
        if (sql.includes('SET pin = $1, expired_at = $2, status = \'pending\'')) {
          return { rowCount: 1, rows: [] };
        }
        return { rows: [] };
      });

      const result = await generatePickupPin(USER_ID, BORROW_ID);

      expect(Math.random).toHaveBeenCalled();
      expect(result.pin).toMatch(/^\d{6}$/);
      expect(result.pin).toBe('550000');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(result.expiresAt.getTime() - Date.now()).toBeCloseTo(180 * 1000, -3);

      const updateCall = pool.query.mock.calls.find((call) =>
        call[0].includes('SET pin = $1, expired_at = $2, status = \'pending\'')
      );
      expect(updateCall[1][0]).toBe('550000');
      expect(updateCall[1][2]).toBe(BORROW_ID);
      vi.restoreAllMocks();
    });

    it('[TC-SRV-PIN-US-002] should return RESERVATION_NOT_FOUND when the reservation does not exist', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await generatePickupPin(USER_ID, BORROW_ID);

      expect(result).toEqual({
        error: { code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found or invalid status' },
        statusCode: 404,
      });
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('[TC-SRV-PIN-US-003] should reuse the existing active PIN without regenerating', async () => {
      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('WHERE borrow_id = $1 AND user_id = $2 AND status IN')) {
          return { rows: [{ borrow_id: BORROW_ID, user_id: USER_ID }] };
        }
        if (sql.includes('pin IS NOT NULL AND expired_at > NOW()')) {
          return { rows: [{ pin: '111111', expired_at: new Date(Date.now() + 60000) }] };
        }
        return { rows: [] };
      });

      const result = await generatePickupPin(USER_ID, BORROW_ID);

      expect(result).toEqual({ pin: '111111', expiresAt: expect.any(Date) });
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('[TC-SRV-PIN-US-004] should return PIN_GENERATION_FAILED after 3 unique-violation attempts', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('WHERE borrow_id = $1 AND user_id = $2 AND status IN')) {
          return { rows: [{ borrow_id: BORROW_ID, user_id: USER_ID }] };
        }
        if (sql.includes('pin IS NOT NULL AND expired_at > NOW()')) {
          return { rows: [] };
        }
        if (sql.includes('SET pin = NULL, expired_at = NULL, status = \'reserved\'')) {
          return { rowCount: 1, rows: [] };
        }
        if (sql.includes('SET pin = $1, expired_at = $2, status = \'pending\'')) {
          const err = new Error('duplicate key');
          err.code = '23505';
          throw err;
        }
        return { rows: [] };
      });

      const result = await generatePickupPin(USER_ID, BORROW_ID);

      expect(result).toEqual({
        error: { code: 'PIN_GENERATION_FAILED', message: 'Failed to generate unique PIN after 3 attempts' },
        statusCode: 500,
      });
      vi.restoreAllMocks();
    });

    it('[TC-SRV-PIN-US-005] should throw non-unique database errors', async () => {
      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('WHERE borrow_id = $1 AND user_id = $2 AND status IN')) {
          return { rows: [{ borrow_id: BORROW_ID, user_id: USER_ID }] };
        }
        if (sql.includes('pin IS NOT NULL AND expired_at > NOW()')) {
          return { rows: [] };
        }
        if (sql.includes('SET pin = NULL, expired_at = NULL, status = \'reserved\'')) {
          return { rowCount: 1, rows: [] };
        }
        if (sql.includes('SET pin = $1, expired_at = $2, status = \'pending\'')) {
          throw new Error('connection lost');
        }
        return { rows: [] };
      });

      await expect(generatePickupPin(USER_ID, BORROW_ID)).rejects.toThrow('connection lost');
    });
  });

  describe('generateReturnPin - confirm return flow', () => {
    it('[TC-SRV-PIN-US-006] should generate a PIN and set status pending_return for a borrowed book', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.25);
      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('AND status IN')) {
          return { rows: [{ borrow_id: BORROW_ID, user_id: USER_ID }] };
        }
        if (sql.includes('pin IS NOT NULL AND expired_at > NOW()')) {
          return { rows: [] };
        }
        if (sql.includes('SET pin = NULL, expired_at = NULL, status = \'borrowed\'')) {
          return { rowCount: 1, rows: [] };
        }
        if (sql.includes('SET pin = $1, expired_at = $2, status = \'pending_return\'')) {
          return { rowCount: 1, rows: [] };
        }
        return { rows: [] };
      });

      const result = await generateReturnPin(USER_ID, BORROW_ID);

      expect(result.pin).toMatch(/^\d{6}$/);
      const updateCall = pool.query.mock.calls.find((call) =>
        call[0].includes('SET pin = $1, expired_at = $2, status = \'pending_return\'')
      );
      expect(updateCall[1][0]).toBe(result.pin);
      expect(updateCall[1][2]).toBe(BORROW_ID);
      vi.restoreAllMocks();
    });

    it('[TC-SRV-PIN-US-007] should return BORROW_NOT_FOUND when the book is not currently borrowed', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await generateReturnPin(USER_ID, BORROW_ID);

      expect(result).toEqual({
        error: {
          code: 'BORROW_NOT_FOUND',
          message: 'Borrow record not found or book is not currently borrowed',
        },
        statusCode: 404,
      });
    });

    it('[TC-SRV-PIN-US-008] should return INTERNAL_ERROR with 500 when a database failure occurs', async () => {
      pool.query.mockRejectedValue(new Error('db down'));

      const result = await generateReturnPin(USER_ID, BORROW_ID);

      expect(result).toEqual({
        error: { code: 'INTERNAL_ERROR', message: 'db down' },
        statusCode: 500,
      });
    });
  });

  describe('cleanupReturnPin', () => {
    it('[TC-SRV-PIN-US-009] should clear the return PIN and restore status borrowed when a row was updated', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const cleaned = await cleanupReturnPin(USER_ID, BORROW_ID);

      expect(cleaned).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SET pin = NULL, expired_at = NULL, status = \'borrowed\''),
        [BORROW_ID, USER_ID]
      );
    });

    it('[TC-SRV-PIN-US-010] should return false when no row matched pending_return', async () => {
      pool.query.mockResolvedValue({ rowCount: 0 });

      const cleaned = await cleanupReturnPin(USER_ID, BORROW_ID);

      expect(cleaned).toBe(false);
    });
  });

  describe('cleanupReservationPin', () => {
    it('[TC-SRV-PIN-US-011] should clear the pickup PIN and restore status reserved when a row was updated', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const cleaned = await cleanupReservationPin(USER_ID, BORROW_ID);

      expect(cleaned).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SET pin = NULL, expired_at = NULL, status = \'reserved\''),
        [BORROW_ID, USER_ID]
      );
    });

    it('[TC-SRV-PIN-US-012] should return false when no pending row matched', async () => {
      pool.query.mockResolvedValue({ rowCount: 0 });

      const cleaned = await cleanupReservationPin(USER_ID, BORROW_ID);

      expect(cleaned).toBe(false);
    });
  });
});
