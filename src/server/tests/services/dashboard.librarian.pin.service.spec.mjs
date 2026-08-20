import { vi } from 'vitest';
import pool from '../../src/config/postgres.mjs';
import {
  verifyPin,
  verifyReturnPin,
  confirmBorrowing,
  confirmReturn,
  findBorrowRecordByPin,
} from '../../src/services/dashboard.librarian.services.mjs';

vi.mock('../../src/config/postgres.mjs', () => ({
  default: {
    query: vi.fn(),
    connect: vi.fn(),
    on: vi.fn(),
  },
}));

vi.mock('../../src/services/system-configuration.services.mjs', () => ({
  systemConfigurationService: {
    getSnapshot: vi.fn().mockReturnValue({
      FEE_ADMIN: 1,
      FEE_ADDON: 0,
      DAMAGE_COEFFICIENTS: {
        lost: 2.0,
        torn_pages: 0.20,
        folded_pages: 0.10,
      }
    }),
    getState: vi.fn().mockReturnValue({ version: 1 }),
  },
}));

const BORROW_ID = 'bb-001';
const LIBRARIAN_BRANCH = 1;

const sampleRecord = {
  borrow_id: BORROW_ID,
  user_id: 'u-001',
  branch_id: LIBRARIAN_BRANCH,
  book_id: 'b-001',
  status: 'pending',
  reserve_date: '2026-08-01',
  borrow_date: null,
  due_date: null,
  username: 'student',
  gender: 'male',
  phone_number: '0900000000',
  email: 'student@example.com',
  birth_date: '2000-01-01',
  book_title: 'Clean Code',
  book_author: ['Robert C. Martin'],
  book_publisher: 'Prentice Hall',
  book_genres: ['Programming'],
  book_image_url: 'http://img.com/code.png',
  book_price: 50,
};

describe('dashboard.librarian.services.mjs - PIN verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findBorrowRecordByPin', () => {
    it('[TC-SRV-PIN-LIB-001] should return the matched borrow record joined with user and book', async () => {
      pool.query.mockResolvedValue({ rows: [sampleRecord] });

      const result = await findBorrowRecordByPin('123456', 'pending', 1);

      expect(result).toEqual(sampleRecord);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM public.borrow_book bb'),
        ['123456', 'pending', 1]
      );
    });

    it('[TC-SRV-PIN-LIB-002] should return null when no record matches', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await findBorrowRecordByPin('999999', 'pending');

      expect(result).toBeNull();
    });
  });

  describe('verifyPin - confirm borrow flow', () => {
    it('[TC-SRV-PIN-LIB-003] should return borrower and book details when PIN is valid', async () => {
      pool.query.mockResolvedValue({ rows: [sampleRecord] });

      const result = await verifyPin('123456', LIBRARIAN_BRANCH);

      expect(result).toEqual({
        borrowId: BORROW_ID,
        borrower: {
          username: 'student',
          gender: 'male',
          phone_number: '0900000000',
          email: 'student@example.com',
          avatar: null,
        },
        book: {
          title: 'Clean Code',
          author: 'Robert C. Martin',
          publisher: 'Prentice Hall',
          genre: 'Programming',
          price: 50,
          image_url: null,
        },
      });
    });

    it('[TC-SRV-PIN-LIB-004] should return PIN_NOT_FOUND with 404 when the PIN is invalid or expired', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await verifyPin('999999', LIBRARIAN_BRANCH);

      expect(result).toEqual({
        error: { code: 'PIN_NOT_FOUND', message: 'The PIN has expired or does not exist.' },
        statusCode: 404,
      });
    });

    it('[TC-SRV-PIN-LIB-005] should return WRONG_BRANCH with 403 when the reservation belongs to another branch', async () => {
      pool.query.mockResolvedValue({ rows: [{ ...sampleRecord, branch_id: 2 }] });

      const result = await verifyPin('123456', LIBRARIAN_BRANCH);

      expect(result).toEqual({
        error: { code: 'WRONG_BRANCH', message: 'You have arrived at the wrong book borrowing branch.' },
        statusCode: 403,
      });
    });

    it('[TC-SRV-PIN-LIB-006] should join array authors/genres into a comma-separated string', async () => {
      pool.query.mockResolvedValue({
        rows: [
          {
            ...sampleRecord,
            book_author: ['Author A', 'Author B'],
            book_genres: ['Fiction', 'Mystery'],
          },
        ],
      });

      const result = await verifyPin('123456', LIBRARIAN_BRANCH);

      expect(result.book.author).toBe('Author A, Author B');
      expect(result.book.genre).toBe('Fiction, Mystery');
    });
  });

  describe('verifyReturnPin - confirm return flow', () => {
    it('[TC-SRV-PIN-LIB-007] should return borrowing details when the return PIN is valid', async () => {
      pool.query.mockResolvedValue({
        rows: [
          {
            ...sampleRecord,
            status: 'pending_return',
            borrow_date: '2026-07-20',
            due_date: '2026-08-03',
          },
        ],
      });

      const result = await verifyReturnPin('654321');

      expect(result).toEqual({
        borrowId: BORROW_ID,
        borrower: {
          username: 'student',
          gender: 'male',
          phone_number: '0900000000',
          email: 'student@example.com',
          birth_date: '2000-01-01',
        },
        book: {
          title: 'Clean Code',
          author: 'Robert C. Martin',
          publisher: 'Prentice Hall',
          genres: 'Programming',
          image_url: 'http://img.com/code.png',
          price: 50,
        },
        borrowing: {
          reserve_date: '2026-08-01',
          borrow_date: '2026-07-20',
          due_date: '2026-08-03',
        },
      });
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('bb.pin = $1 AND bb.expired_at > NOW()'),
        ['654321', 'pending_return']
      );
    });

    it('[TC-SRV-PIN-LIB-008] should return PIN_NOT_FOUND with 404 when the return PIN is invalid', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await verifyReturnPin('999999');

      expect(result).toEqual({
        error: { code: 'PIN_NOT_FOUND', message: 'The PIN has expired or does not exist.' },
        statusCode: 404,
      });
    });
  });

  describe('confirmBorrowing', () => {
    let mockClient;

    const arrangeHappyPath = () => {
      mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      mockClient.query.mockImplementation(async (sql) => {
        if (sql === 'BEGIN' || sql === 'COMMIT') return { rows: [] };
        if (sql.includes('SELECT user_id, book_id, branch_id FROM public.borrow_book')) {
          return { rows: [{ user_id: 'u-001', book_id: 'b-001', branch_id: 1 }] };
        }
        if (sql.includes('SET status = \'borrowed\'')) {
          return { rows: [{ due_date: new Date('2026-08-22') }] };
        }
        return { rows: [] };
      });
      pool.connect.mockResolvedValue(mockClient);
    };

    beforeEach(() => {
      arrangeHappyPath();
    });

    it('[TC-SRV-PIN-LIB-009] should set status borrowed with a 14-day due date and commit', async () => {
      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('due_date < NOW()')) return { rows: [{ overdue_count: '0' }] };
        if (sql.includes('SELECT user_id FROM public.users')) return { rows: [{ user_id: 'u-001' }] };
        return { rows: [] };
      });

      const result = await confirmBorrowing(BORROW_ID);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SET status = \'borrowed\', borrow_date = NOW(), due_date = NOW() + INTERVAL \'14 days\''),
        [BORROW_ID]
      );
      expect(result).toEqual({ borrowId: BORROW_ID, status: 'borrowed', due_date: expect.any(Date) });
    });

    it('[TC-SRV-PIN-LIB-010] should return NOT_FOUND with 404 when the borrow record does not exist', async () => {
      mockClient.query.mockImplementation(async (sql) => {
        if (sql.includes('SELECT user_id, book_id, branch_id FROM public.borrow_book')) {
          return { rows: [] };
        }
        return { rows: [] };
      });

      const result = await confirmBorrowing(BORROW_ID);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(result).toEqual({
        error: { code: 'NOT_FOUND', message: 'Borrow record not found.' },
        statusCode: 404,
      });
    });

    it('[TC-SRV-PIN-LIB-011] should return USER_INELIGIBLE with 409 when the user has overdue books', async () => {
      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('due_date < NOW()')) return { rows: [{ overdue_count: '2' }] };
        if (sql.includes('SELECT user_id FROM public.users')) return { rows: [{ user_id: 'u-001' }] };
        return { rows: [] };
      });

      const result = await confirmBorrowing(BORROW_ID);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(result).toEqual({
        error: { code: 'USER_INELIGIBLE', message: 'Borrower has overdue books or is suspended. Cannot confirm borrowing.' },
        statusCode: 409,
      });
    });

    it('[TC-SRV-PIN-LIB-012] should return USER_INELIGIBLE with 409 when the user does not exist', async () => {
      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('due_date < NOW()')) return { rows: [{ overdue_count: '0' }] };
        if (sql.includes('SELECT user_id FROM public.users')) return { rows: [] };
        return { rows: [] };
      });

      const result = await confirmBorrowing(BORROW_ID);

      expect(result).toEqual({
        error: { code: 'USER_INELIGIBLE', message: 'Borrower has overdue books or is suspended. Cannot confirm borrowing.' },
        statusCode: 409,
      });
    });

    it('[TC-SRV-PIN-LIB-013] should release the client and roll back when a query throws', async () => {
      mockClient.query.mockImplementation(async (sql) => {
        if (sql.includes('SELECT user_id, book_id, branch_id FROM public.borrow_book')) {
          throw new Error('db failure');
        }
        return { rows: [] };
      });

      await expect(confirmBorrowing(BORROW_ID)).rejects.toThrow('db failure');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirmReturn', () => {
    let mockClient;

    const arrangeHappyPath = () => {
      mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      mockClient.query.mockImplementation(async (sql) => {
        if (sql === 'BEGIN' || sql === 'COMMIT') return { rows: [] };
        if (sql.includes('SELECT bb.user_id, bb.book_id, bb.borrow_date, bb.due_date, b.price')) {
          return {
            rows: [
              {
                user_id: 'u-001',
                book_id: 'b-001',
                borrow_date: new Date('2026-07-20'),
                due_date: new Date('2026-12-31'),
                price: 50,
              },
            ],
          };
        }
        if (sql.includes('INSERT INTO public.return_book')) {
          return { rows: [{ return_id: 'rt-001' }] };
        }
        return { rows: [] };
      });
      pool.connect.mockResolvedValue(mockClient);
    };

    beforeEach(() => {
      arrangeHappyPath();
    });

    it('[TC-SRV-PIN-LIB-014] should record a clean return with no penalty and restore inventory', async () => {
      const result = await confirmReturn(BORROW_ID, 1, ['perfect_condition'], null, false);

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.return_book'),
        [BORROW_ID, 1, expect.any(Date), false]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.library SET available_quantity = available_quantity + 1'),
        ['b-001', 1]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.users SET borrow_num = GREATEST(borrow_num - 1, 0)'),
        ['u-001']
      );
      expect(result).toEqual({
        success: true,
        data: {
          returnId: 'rt-001',
          penaltyId: null,
          penaltyAmount: 0,
          issue: null,
          inventoryUpdated: true,
        },
      });
    });

    it('[TC-SRV-PIN-LIB-015] should return NOT_FOUND with 404 when the borrow record is not pending_return', async () => {
      mockClient.query.mockImplementation(async (sql) => {
        if (sql.includes('SELECT bb.user_id, bb.book_id, bb.borrow_date, bb.due_date, b.price')) {
          return { rows: [] };
        }
        return { rows: [] };
      });

      const result = await confirmReturn(BORROW_ID, 1, ['perfect_condition'], null, false, 1);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(result).toEqual({
        error: { code: 'NOT_FOUND', message: 'Borrow record not found or not in pending_return status' },
        statusCode: 404,
      });
    });

    it('[TC-SRV-PIN-LIB-016] should charge a lost book penalty of twice the price', async () => {
      const result = await confirmReturn(BORROW_ID, 1, [], 'Book lost', true, 1);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.book_penalty'),
        expect.any(Array)
      );
      expect(result).toEqual({
        success: true,
        data: {
          returnId: null,
          penaltyId: null,
          penaltyAmount: 100,
          issue: 'lost',
          inventoryUpdated: false,
        },
      });
    });

    it('[TC-SRV-PIN-LIB-017] should charge a damage penalty based on the worst damage coefficient', async () => {
      const result = await confirmReturn(BORROW_ID, 1, ['folded_pages'], 'Fold corner', false, 1);

      // price=50, coefficient folded_pages=0.10 => 0.10*50 + Fee_admin(1) + 0 = 6
      expect(result.data.penaltyAmount).toBe(6);
      expect(result.data.issue).toBe('damaged');
      expect(result.data.inventoryUpdated).toBe(true);
    });

    it('[TC-SRV-PIN-LIB-018] should charge an overdue penalty when returned after due date in perfect condition', async () => {
      mockClient.query.mockImplementation(async (sql) => {
        if (sql === 'BEGIN' || sql === 'COMMIT') return { rows: [] };
        if (sql.includes('SELECT bb.user_id, bb.book_id, bb.borrow_date, bb.due_date, b.price')) {
          return {
            rows: [
              {
                user_id: 'u-001',
                book_id: 'b-001',
                borrow_date: new Date('2026-07-01'),
                due_date: new Date('2026-07-10'),
                price: 100,
              },
            ],
          };
        }
        if (sql.includes('INSERT INTO public.return_book')) {
          return { rows: [{ return_id: 'rt-002' }] };
        }
        return { rows: [] };
      });

      const result = await confirmReturn(BORROW_ID, 1, ['perfect_condition'], null, false, 1);

      expect(result.data.issue).toBe('overdue');
      expect(result.data.penaltyAmount).toBeGreaterThan(0);
    });

    it('[TC-SRV-PIN-LIB-019] should clear the PIN and expired_at from the borrow record on successful return', async () => {
      await confirmReturn(BORROW_ID, 1, ['perfect_condition'], null, false, 1);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.borrow_book SET pin = NULL, expired_at = NULL'),
        [BORROW_ID]
      );
    });

    it('[TC-SRV-PIN-LIB-020] should release the client and roll back when the transaction throws', async () => {
      mockClient.query.mockImplementation(async (sql) => {
        if (sql.includes('SELECT bb.user_id, bb.book_id, bb.borrow_date, bb.due_date, b.price')) {
          throw new Error('transaction failed');
        }
        return { rows: [] };
      });

      await expect(confirmReturn(BORROW_ID, 1, ['perfect_condition'], null, false)).rejects.toThrow('transaction failed');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });
});
