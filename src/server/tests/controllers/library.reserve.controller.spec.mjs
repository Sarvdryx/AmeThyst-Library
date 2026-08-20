import { vi } from 'vitest';
import { createReservation } from '../../src/services/library.services.mjs';
import { uploadToCloudinary } from '../../src/services/user.services.mjs';
import { reserveBook } from '../../src/controllers/library.controller.mjs';

vi.mock('../../src/services/library.services.mjs', () => ({
  getBookById: vi.fn(),
  getRecommendations: vi.fn(),
  getRelatedBooks: vi.fn(),
  getBooksList: vi.fn(),
  createReservation: vi.fn(),
  createBookService: vi.fn(),
  updateBookService: vi.fn(),
  deleteBookService: vi.fn(),
  getAllBranchesService: vi.fn(),
}));

vi.mock('../../src/services/user.services.mjs', () => ({
  uploadToCloudinary: vi.fn(),
}));

describe('library.controller.mjs - reserveBook', () => {
  let req;
  let res;

  const arrangeHappyPath = () => {
    createReservation.mockResolvedValue({
      reservation: {
        reservationId: 'res-1',
        bookId: 'b-001',
        branchId: 1,
        branchName: 'Main Branch',
        branchAddress: '123 Main St',
        shelf: 'A101',
        reserveDate: '2026-08-08',
        status: 'reserved',
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    arrangeHappyPath();

    req = {
      user: { userId: 'u-001' },
      body: { bookId: 'b-001', branchId: 1 },
    };

    res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
  });

  describe('Test 1 - Successful reservation', () => {
    it('[TC-CTL-RES-001] should return 201 with the created reservation', async () => {
      await reserveBook(req, res);

      expect(createReservation).toHaveBeenCalledWith('u-001', 'b-001', 1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          reservationId: 'res-1',
          bookId: 'b-001',
          branchId: 1,
          branchName: 'Main Branch',
          branchAddress: '123 Main St',
          shelf: 'A101',
          reserveDate: '2026-08-08',
          status: 'reserved',
        },
      });
    });

    it('[TC-CTL-RES-002] should pass bookId and branchId as-is to the service', async () => {
      req.body = { bookId: 'b-002', branchId: 2 };
      await reserveBook(req, res);

      expect(createReservation).toHaveBeenCalledWith('u-001', 'b-002', 2);
    });
  });

  describe('Test 2 - Missing parameters', () => {
    it('[TC-CTL-RES-003] should return 400 MISSING_PARAMETERS when bookId is missing', async () => {
      req.body = { branchId: 1 };

      await reserveBook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'MISSING_PARAMETERS', message: 'bookId and branchId are required' },
      });
      expect(createReservation).not.toHaveBeenCalled();
    });

    it('[TC-CTL-RES-004] should return 400 MISSING_PARAMETERS when branchId is missing', async () => {
      req.body = { bookId: 'b-001' };

      await reserveBook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'MISSING_PARAMETERS', message: 'bookId and branchId are required' },
      });
      expect(createReservation).not.toHaveBeenCalled();
    });

    it('[TC-CTL-RES-005] should return 400 MISSING_PARAMETERS when both bookId and branchId are missing', async () => {
      req.body = {};

      await reserveBook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(createReservation).not.toHaveBeenCalled();
    });
  });

  describe('Test 3 - Service-level domain errors', () => {
    it('[TC-CTL-RES-006] should forward USER_NOT_FOUND error with its status code', async () => {
      createReservation.mockResolvedValue({
        error: { code: 'USER_NOT_FOUND', message: 'User account not found. Please re-login.' },
        statusCode: 404,
      });

      await reserveBook(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User account not found. Please re-login.' },
      });
    });

    it('[TC-CTL-RES-007] should forward BOOK_UNAVAILABLE error with its status code', async () => {
      createReservation.mockResolvedValue({
        error: { code: 'BOOK_UNAVAILABLE', message: 'No available copies at the selected branch' },
        statusCode: 400,
      });

      await reserveBook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'BOOK_UNAVAILABLE', message: 'No available copies at the selected branch' },
      });
    });

    it('[TC-CTL-RES-008] should default to status 400 when the service error has no statusCode', async () => {
      createReservation.mockResolvedValue({
        error: { code: 'UNKNOWN', message: 'Something went wrong' },
      });

      await reserveBook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'UNKNOWN', message: 'Something went wrong' },
      });
    });
  });

  describe('Test 4 - Unexpected failures', () => {
    it('[TC-CTL-RES-009] should return 500 INTERNAL_ERROR when the service throws', async () => {
      createReservation.mockRejectedValue(new Error('DB connection lost'));

      await reserveBook(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    });
  });

  describe('Test 5 - Data-shape invariants', () => {
    it('[TC-CTL-RES-010] should never leak raw error messages on unexpected exceptions', async () => {
      createReservation.mockRejectedValue(new Error('db password=secret123 leaked'));

      await reserveBook(req, res);

      const responseBody = res.json.mock.calls[0][0];
      expect(JSON.stringify(responseBody)).not.toContain('password');
      expect(JSON.stringify(responseBody)).not.toContain('secret123');
    });
  });
});
