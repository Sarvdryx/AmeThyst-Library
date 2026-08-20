import { vi } from 'vitest';
import {
  verifyPin as verifyPinService,
  confirmBorrowing as confirmBorrowingService,
  verifyReturnPin as verifyReturnPinService,
  confirmReturn as confirmReturnService,
} from '../../src/services/dashboard.librarian.services.mjs';
import {
  verifyPin,
  confirmBorrowing,
  verifyReturnPin,
  confirmReturn,
} from '../../src/controllers/dashboard.librarian.controllers.mjs';

vi.mock('../../src/services/dashboard.librarian.services.mjs', () => ({
  verifyPin: vi.fn(),
  confirmBorrowing: vi.fn(),
  cancelBorrowing: vi.fn(),
  verifyReturnPin: vi.fn(),
  confirmReturn: vi.fn(),
  getOutstandingDebts: vi.fn(),
  getPaidFees: vi.fn(),
  getActiveBorrowings: vi.fn(),
  confirmPayment: vi.fn(),
  getPickupsService: vi.fn(),
}));

describe('dashboard.librarian.controllers.mjs - PIN controllers', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { userId: 'lib-001', branch_id: 1 },
      body: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('verifyPin - librarian verifies a pickup PIN', () => {
    it('[TC-CTL-PIN-LIB-001] should return 400 when the PIN is not exactly 6 digits', async () => {
      req.body = { pin: '123' };

      await verifyPin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(verifyPinService).not.toHaveBeenCalled();
    });

    it('[TC-CTL-PIN-LIB-002] should return 400 when the PIN is missing', async () => {
      req.body = {};

      await verifyPin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('[TC-CTL-PIN-LIB-003] should return the borrower and book details on success', async () => {
      req.body = { pin: '123456' };
      verifyPinService.mockResolvedValue({
        borrowId: 'bb-001',
        borrower: { username: 'student' },
        book: { title: 'Clean Code' },
      });

      await verifyPin(req, res);

      expect(verifyPinService).toHaveBeenCalledWith('123456', 1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          borrowId: 'bb-001',
          borrower: { username: 'student' },
          book: { title: 'Clean Code' },
        },
        message: 'PIN verified successfully',
      });
    });

    it('[TC-CTL-PIN-LIB-004] should forward service domain errors with their status code', async () => {
      req.body = { pin: '123456' };
      verifyPinService.mockResolvedValue({
        error: { code: 'WRONG_BRANCH', message: 'You have arrived at the wrong book borrowing branch.' },
        statusCode: 403,
      });

      await verifyPin(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'You have arrived at the wrong book borrowing branch.',
      });
    });

    it('[TC-CTL-PIN-LIB-005] should return 500 when the service throws', async () => {
      req.body = { pin: '123456' };
      verifyPinService.mockRejectedValue(new Error('boom'));

      await verifyPin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('confirmBorrowing', () => {
    it('[TC-CTL-PIN-LIB-006] should return 400 when borrow_id is missing', async () => {
      req.body = {};

      await confirmBorrowing(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(confirmBorrowingService).not.toHaveBeenCalled();
    });

    it('[TC-CTL-PIN-LIB-007] should return the confirmed borrowing details on success', async () => {
      req.body = { borrow_id: 'bb-001' };
      confirmBorrowingService.mockResolvedValue({
        borrowId: 'bb-001',
        status: 'borrowed',
        due_date: '2026-08-22',
      });

      await confirmBorrowing(req, res);

      expect(confirmBorrowingService).toHaveBeenCalledWith('bb-001', 1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { borrowId: 'bb-001', status: 'borrowed', due_date: '2026-08-22' },
        message: 'Borrowing confirmed successfully',
      });
    });

    it('[TC-CTL-PIN-LIB-008] should forward USER_INELIGIBLE with 409', async () => {
      req.body = { borrow_id: 'bb-001' };
      confirmBorrowingService.mockResolvedValue({
        error: { code: 'USER_INELIGIBLE', message: 'Borrower has overdue books or is suspended. Cannot confirm borrowing.' },
        statusCode: 409,
      });

      await confirmBorrowing(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('verifyReturnPin', () => {
    it('[TC-CTL-PIN-LIB-009] should return 400 when the return PIN is not 6 digits', async () => {
      req.body = { pin: '12' };

      await verifyReturnPin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(verifyReturnPinService).not.toHaveBeenCalled();
    });

    it('[TC-CTL-PIN-LIB-010] should return the borrowing details on success', async () => {
      req.body = { pin: '654321' };
      verifyReturnPinService.mockResolvedValue({
        borrowId: 'bb-001',
        borrower: { username: 'student' },
        book: { title: 'Clean Code' },
        borrowing: { borrow_date: '2026-07-20', due_date: '2026-08-03' },
      });

      await verifyReturnPin(req, res);

      expect(verifyReturnPinService).toHaveBeenCalledWith('654321');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          borrowId: 'bb-001',
          borrower: { username: 'student' },
          book: { title: 'Clean Code' },
          borrowing: { borrow_date: '2026-07-20', due_date: '2026-08-03' },
        },
        message: 'Return PIN verified successfully',
      });
    });

    it('[TC-CTL-PIN-LIB-011] should forward PIN_NOT_FOUND with 404', async () => {
      req.body = { pin: '654321' };
      verifyReturnPinService.mockResolvedValue({
        error: { code: 'PIN_NOT_FOUND', message: 'The PIN has expired or does not exist.' },
        statusCode: 404,
      });

      await verifyReturnPin(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('confirmReturn', () => {
    it('[TC-CTL-PIN-LIB-012] should return 400 when borrow_id or branch_id is missing', async () => {
      req.body = {};

      await confirmReturn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(confirmReturnService).not.toHaveBeenCalled();
    });

    it('[TC-CTL-PIN-LIB-013] should pass defaults for missing optional fields and return the result on success', async () => {
      req.body = { borrow_id: 'bb-001', branch_id: 1 };
      confirmReturnService.mockResolvedValue({
        success: true,
        data: { returnId: 'rt-001', penaltyAmount: 0, issue: null, inventoryUpdated: true },
      });

      await confirmReturn(req, res);

      expect(confirmReturnService).toHaveBeenCalledWith('bb-001', 1, [], null, false, undefined);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { returnId: 'rt-001', penaltyAmount: 0, issue: null, inventoryUpdated: true },
        message: 'Return confirmed successfully',
      });
    });

    it('[TC-CTL-PIN-LIB-014] should forward is_lost and conditions to the service', async () => {
      req.body = { borrow_id: 'bb-001', branch_id: 2, conditions: ['torn_pages'], description: 'torn', is_lost: true };

      await confirmReturn(req, res);

      expect(confirmReturnService).toHaveBeenCalledWith('bb-001', 2, ['torn_pages'], 'torn', true);
    });

    it('[TC-CTL-PIN-LIB-015] should forward service domain errors with their status code', async () => {
      req.body = { borrow_id: 'bb-001', branch_id: 1 };
      confirmReturnService.mockResolvedValue({
        error: { code: 'NOT_FOUND', message: 'Borrow record not found or not in pending_return status' },
        statusCode: 404,
      });

      await confirmReturn(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
