import { vi } from 'vitest';
import pool from '../../src/config/postgres.mjs';
import {
  invalidateUserRecommendationCache,
  getUserRecommendations,
} from '../../src/services/recommendation.services.mjs';
import { createReservation } from '../../src/services/library.services.mjs';

const MAX_BORROW_LIMIT = 6;

vi.mock('../../src/config/postgres.mjs', () => ({
  default: {
    query: vi.fn(),
    connect: vi.fn(),
    on: vi.fn(),
  },
}));

vi.mock('../../src/services/recommendation.services.mjs', () => ({
  invalidateUserRecommendationCache: vi.fn(),
  getUserRecommendations: vi.fn(),
}));

vi.mock('../../src/services/system-configuration.services.mjs', () => ({
  systemConfigurationService: {
    getSnapshot: vi.fn(() => ({ MAX_BORROW_LIMIT })),
  },
}));

const BOOK_ID = 'b-001';
const BRANCH_ID = 1;
const USER_ID = 'u-001';

describe('library.services.mjs - createReservation', () => {
  let mockClient;

  const isSQL = (sql, fragment) => typeof sql === 'string' && sql.includes(fragment);

  const happyPathQuery = async (sql) => {
    if (isSQL(sql, 'BEGIN')) return { rows: [] };
    if (isSQL(sql, 'FROM public.users WHERE user_id')) {
      return { rows: [{ user_id: USER_ID, borrow_num: 0 }] };
    }
    if (isSQL(sql, 'SELECT COUNT(*) as unpaid')) return { rows: [{ unpaid: '0' }] };
    if (isSQL(sql, 'available_quantity, shelf')) {
      return { rows: [{ available_quantity: 2, shelf: 'A101' }] };
    }
    if (isSQL(sql, 'SELECT bb.borrow_id FROM public.borrow_book')) {
      return { rows: [] };
    }
    if (isSQL(sql, 'UPDATE public.library SET available_quantity')) {
      return { rows: [] };
    }
    if (isSQL(sql, 'INSERT INTO public.borrow_book')) {
      return { rows: [{ borrow_id: 'res-1', reserve_date: '2026-08-08' }] };
    }
    if (isSQL(sql, 'UPDATE public.users SET borrow_num')) {
      return { rows: [] };
    }
    if (isSQL(sql, 'SELECT name, address FROM public.branches')) {
      return { rows: [{ name: 'Main Branch', address: '123 Main St' }] };
    }
    return { rows: [] };
  };

  const arrangeHappyPath = () => {
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };

    mockClient.query.mockImplementation(happyPathQuery);

    pool.connect.mockResolvedValue(mockClient);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    arrangeHappyPath();
  });

  describe('Test 1 - Successful reservation', () => {
    it('[TC-SRV-RES-001] should begin a transaction and return a reservation payload', async () => {
      const result = await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      expect(pool.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toEqual({
        reservation: {
          reservationId: 'res-1',
          bookId: BOOK_ID,
          branchId: BRANCH_ID,
          branchName: 'Main Branch',
          branchAddress: '123 Main St',
          shelf: 'A101',
          reserveDate: '2026-08-08',
          status: 'reserved',
        },
      });
    });

    it('[TC-SRV-RES-002] should decrement available quantity and insert a borrow_book row with status reserved', async () => {
      await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.library SET available_quantity = available_quantity - 1'),
        [BOOK_ID, BRANCH_ID]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.borrow_book'),
        [USER_ID, BOOK_ID, BRANCH_ID]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('VALUES ($1, $2, $3, \'reserved\')'),
        [USER_ID, BOOK_ID, BRANCH_ID]
      );
    });

    it('[TC-SRV-RES-003] should increment the user borrow_num after a successful reservation', async () => {
      await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.users SET borrow_num = borrow_num + 1'),
        [USER_ID]
      );
    });

    it('[TC-SRV-RES-004] should invalidate the recommendation cache on success', async () => {
      await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      expect(invalidateUserRecommendationCache).toHaveBeenCalledWith(USER_ID);
    });

    it('[TC-SRV-RES-005] should not precompute recommendations when NODE_ENV is test', async () => {
      await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      expect(getUserRecommendations).not.toHaveBeenCalled();
    });

    it('[TC-SRV-RES-006] should release the client connection after success', async () => {
      await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('[TC-SRV-RES-007] should use N/A shelf fallback when inventory row has no shelf', async () => {
      mockClient.query.mockImplementation(async (sql) => {
        if (isSQL(sql, 'available_quantity, shelf')) {
          return { rows: [{ available_quantity: 1, shelf: null }] };
        }
        if (isSQL(sql, 'INSERT INTO public.borrow_book')) {
          return { rows: [{ borrow_id: 'res-2', reserve_date: '2026-08-08' }] };
        }
        if (isSQL(sql, 'SELECT name, address FROM public.branches')) {
          return { rows: [{ name: 'East Branch', address: '456 East St' }] };
        }
        return happyPathQuery(sql);
      });

      const result = await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      expect(result.reservation.shelf).toBe('N/A');
      expect(result.reservation.branchName).toBe('East Branch');
    });
  });

  describe('Test 2 - User not found', () => {
    it('[TC-SRV-RES-008] should roll back and return USER_NOT_FOUND with 404', async () => {
      mockClient.query.mockImplementation(async (sql) => {
        if (isSQL(sql, 'FROM public.users WHERE user_id')) {
          return { rows: [] };
        }
        return { rows: [] };
      });

      const result = await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.query).not.toHaveBeenCalledWith('COMMIT');
      expect(result).toEqual({
        error: { code: 'USER_NOT_FOUND', message: 'User account not found. Please re-login.' },
        statusCode: 404,
      });
    });
  });

  describe('Test 3 - Unpaid debt blocks reservation', () => {
    it('[TC-SRV-RES-009] should roll back and return UNPAID_DEBT with 400 when the user has unpaid penalties', async () => {
      mockClient.query.mockImplementation(async (sql) => {
        if (isSQL(sql, 'FROM public.users WHERE user_id')) {
          return { rows: [{ user_id: USER_ID }] };
        }
        if (isSQL(sql, 'SELECT COUNT(*) as unpaid')) {
          return { rows: [{ unpaid: '1' }] };
        }
        return { rows: [] };
      });

      const result = await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(result).toEqual({
        error: {
          code: 'UNPAID_DEBT',
          message: 'You have unpaid debts. Please clear all outstanding penalties before reserving a new book.',
        },
        statusCode: 400,
      });
    });
  });

  describe('Test 4 - Borrow limit exceeded', () => {
    it('[TC-SRV-RES-010] should roll back and return BORROW_LIMIT_EXCEEDED with 400 when borrow_num reaches the limit', async () => {
      mockClient.query.mockImplementation(async (sql) => {
        if (isSQL(sql, 'FROM public.users WHERE user_id')) {
          return { rows: [{ user_id: USER_ID, borrow_num: MAX_BORROW_LIMIT }] };
        }
        if (isSQL(sql, 'SELECT COUNT(*) as unpaid')) {
          return { rows: [{ unpaid: '0' }] };
        }
        return { rows: [] };
      });

      const result = await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(result).toEqual({
        error: {
          code: 'BORROW_LIMIT_EXCEEDED',
          message: `You have reached the maximum borrow limit of ${MAX_BORROW_LIMIT} books`,
        },
        statusCode: 400,
      });
    });
  });

  describe('Test 5 - Book not found at branch', () => {
    it('[TC-SRV-RES-011] should roll back and return BOOK_NOT_FOUND with 404 when inventory has no rows', async () => {
      mockClient.query.mockImplementation(async (sql) => {
        if (isSQL(sql, 'FROM public.users WHERE user_id')) {
          return { rows: [{ user_id: USER_ID }] };
        }
        if (isSQL(sql, 'SELECT COUNT(*) as unpaid')) {
          return { rows: [{ unpaid: '0' }] };
        }
        if (isSQL(sql, 'SELECT borrow_num FROM public.users')) {
          return { rows: [{ borrow_num: 0 }] };
        }
        if (isSQL(sql, 'available_quantity, shelf')) {
          return { rows: [] };
        }
        return { rows: [] };
      });

      const result = await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(result).toEqual({
        error: { code: 'BOOK_NOT_FOUND', message: 'Book not found at the selected branch' },
        statusCode: 404,
      });
    });
  });

  describe('Test 6 - Book unavailable', () => {
    it('[TC-SRV-RES-012] should roll back and return BOOK_UNAVAILABLE with 400 when available quantity is zero', async () => {
      mockClient.query.mockImplementation(async (sql) => {
        if (isSQL(sql, 'FROM public.users WHERE user_id')) {
          return { rows: [{ user_id: USER_ID }] };
        }
        if (isSQL(sql, 'SELECT COUNT(*) as unpaid')) {
          return { rows: [{ unpaid: '0' }] };
        }
        if (isSQL(sql, 'SELECT borrow_num FROM public.users')) {
          return { rows: [{ borrow_num: 0 }] };
        }
        if (isSQL(sql, 'available_quantity, shelf')) {
          return { rows: [{ available_quantity: 0, shelf: 'A101' }] };
        }
        return { rows: [] };
      });

      const result = await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(result).toEqual({
        error: { code: 'BOOK_UNAVAILABLE', message: 'No available copies at the selected branch' },
        statusCode: 400,
      });
    });
  });

  describe('Test 7 - Duplicate reservation', () => {
    it('[TC-SRV-RES-013] should roll back and return ALREADY_RESERVED with 400 when the user already has an active reservation or borrow', async () => {
      mockClient.query.mockImplementation(async (sql) => {
        if (isSQL(sql, 'FROM public.users WHERE user_id')) {
          return { rows: [{ user_id: USER_ID }] };
        }
        if (isSQL(sql, 'SELECT COUNT(*) as unpaid')) {
          return { rows: [{ unpaid: '0' }] };
        }
        if (isSQL(sql, 'SELECT borrow_num FROM public.users')) {
          return { rows: [{ borrow_num: 0 }] };
        }
        if (isSQL(sql, 'available_quantity, shelf')) {
          return { rows: [{ available_quantity: 2, shelf: 'A101' }] };
        }
        if (isSQL(sql, 'SELECT bb.borrow_id FROM public.borrow_book')) {
          return { rows: [{ borrow_id: 'res-dup' }] };
        }
        return { rows: [] };
      });

      const result = await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(result).toEqual({
        error: {
          code: 'ALREADY_RESERVED',
          message: 'You already have an active reservation or borrow for this book',
        },
        statusCode: 400,
      });
    });
  });

  describe('Test 8 - Unexpected database failures', () => {
    it('[TC-SRV-RES-014] should roll back and rethrow when a query throws inside the transaction', async () => {
      mockClient.query.mockImplementation(async (sql) => {
        if (isSQL(sql, 'available_quantity, shelf')) {
          throw new Error('DB lock timeout');
        }
        return happyPathQuery(sql);
      });

      await expect(createReservation(USER_ID, BOOK_ID, BRANCH_ID)).rejects.toThrow('DB lock timeout');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('[TC-SRV-RES-015] should release the client even when the transaction fails', async () => {
      mockClient.query.mockImplementation(async () => {
        throw new Error('unexpected');
      });

      await expect(createReservation(USER_ID, BOOK_ID, BRANCH_ID)).rejects.toThrow('unexpected');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('Test 9 - Data-shape invariants', () => {
    it('[TC-SRV-RES-016] should lock inventory rows with FOR UPDATE to prevent overbooking', async () => {
      await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('available_quantity, shelf'),
        [BOOK_ID, BRANCH_ID]
      );
      const inventorySql = mockClient.query.mock.calls.find(
        (call) => isSQL(call[0], 'available_quantity, shelf')
      )[0];
      expect(inventorySql).toContain('FOR UPDATE');
    });

    it('[TC-SRV-RES-017] should check for duplicate active reservations that have no return record and no penalty', async () => {
      await createReservation(USER_ID, BOOK_ID, BRANCH_ID);

      const duplicateCall = mockClient.query.mock.calls.find(
        (call) => isSQL(call[0], 'SELECT bb.borrow_id FROM public.borrow_book')
      );
      expect(duplicateCall).toBeDefined();
      expect(duplicateCall[0]).toContain('status IN (\'reserved\', \'pending\', \'borrowed\')');
      expect(duplicateCall[0]).toContain('public.return_book');
      expect(duplicateCall[0]).toContain('public.book_penalty');
      expect(duplicateCall[1]).toEqual([USER_ID, BOOK_ID]);
    });
  });
});
