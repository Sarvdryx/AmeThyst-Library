import { vi } from 'vitest';
import {
  generatePickupPin,
  cleanupReservationPin,
  generateReturnPin,
  cleanupReturnPin,
} from '../../src/services/dashboard.user.services.mjs';
import {
  generatePin,
  cleanupPin,
  generateReturnPin as generateReturnPinController,
  cleanupReturnPin as cleanupReturnPinController,
} from '../../src/controllers/dashboard.user.controllers.mjs';

vi.mock('../../src/services/dashboard.user.services.mjs', () => ({
  generatePickupPin: vi.fn(),
  cleanupReservationPin: vi.fn(),
  cancelReservationById: vi.fn(),
  getUserBorrowRecords: vi.fn(),
  generateReturnPin: vi.fn(),
  extendDueDate: vi.fn(),
  cleanupReturnPin: vi.fn(),
  getUserFees: vi.fn(),
  getBorrowingHistory: vi.fn(),
}));

describe('dashboard.user.controllers.mjs - PIN controllers', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { userId: 'u-001' },
      params: { reservationId: 'bb-001' },
      body: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('generatePin - generate pickup PIN', () => {
    it('[TC-CTL-PIN-US-001] should return the generated PIN and expiry when the service succeeds', async () => {
      const expiresAt = new Date(Date.now() + 180000);
      generatePickupPin.mockResolvedValue({ pin: '123456', expiresAt });

      await generatePin(req, res);

      expect(generatePickupPin).toHaveBeenCalledWith('u-001', 'bb-001');
      expect(res.status).not.toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { pin: '123456', expiresAt } });
    });

    it('[TC-CTL-PIN-US-002] should forward service domain errors with their status code', async () => {
      generatePickupPin.mockResolvedValue({
        error: { code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found or invalid status' },
        statusCode: 404,
      });

      await generatePin(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found or invalid status' },
      });
    });

    it('[TC-CTL-PIN-US-003] should default to 400 when the service error has no statusCode', async () => {
      generatePickupPin.mockResolvedValue({ error: { code: 'X', message: 'msg' } });

      await generatePin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('[TC-CTL-PIN-US-004] should return 500 INTERNAL_ERROR when the service throws', async () => {
      generatePickupPin.mockRejectedValue(new Error('db down'));

      await generatePin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    });
  });

  describe('cleanupPin', () => {
    it('[TC-CTL-PIN-US-005] should return cleaned=true when the reservation PIN was reset', async () => {
      cleanupReservationPin.mockResolvedValue(true);

      await cleanupPin(req, res);

      expect(cleanupReservationPin).toHaveBeenCalledWith('u-001', 'bb-001');
      expect(res.json).toHaveBeenCalledWith({ success: true, cleaned: true });
    });

    it('[TC-CTL-PIN-US-006] should return 500 INTERNAL_ERROR when cleanup throws', async () => {
      cleanupReservationPin.mockRejectedValue(new Error('boom'));

      await cleanupPin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('generateReturnPin', () => {
    it('[TC-CTL-PIN-US-007] should return 400 when borrow_id is missing', async () => {
      req.body = {};

      await generateReturnPinController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(generateReturnPin).not.toHaveBeenCalled();
    });

    it('[TC-CTL-PIN-US-008] should return the generated return PIN when the service succeeds', async () => {
      req.body = { borrow_id: 'bb-001' };
      const expiresAt = new Date(Date.now() + 180000);
      generateReturnPin.mockResolvedValue({ pin: '654321', expiresAt });

      await generateReturnPinController(req, res);

      expect(generateReturnPin).toHaveBeenCalledWith('u-001', 'bb-001');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { pin: '654321', expiresAt },
        message: 'Return PIN generated successfully',
      });
    });

    it('[TC-CTL-PIN-US-009] should forward service domain errors with their status code', async () => {
      req.body = { borrow_id: 'bb-001' };
      generateReturnPin.mockResolvedValue({
        error: { code: 'BORROW_NOT_FOUND', message: 'Borrow record not found or book is not currently borrowed' },
        statusCode: 404,
      });

      await generateReturnPinController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Borrow record not found or book is not currently borrowed',
      });
    });
  });

  describe('cleanupReturnPin', () => {
    it('[TC-CTL-PIN-US-010] should call the cleanup service and return cleaned status', async () => {
      req.params = { borrowId: 'bb-001' };
      cleanupReturnPin.mockResolvedValue(true);

      await cleanupReturnPinController(req, res);

      expect(cleanupReturnPin).toHaveBeenCalledWith('u-001', 'bb-001');
      expect(res.json).toHaveBeenCalledWith({ success: true, cleaned: true });
    });

    it('[TC-CTL-PIN-US-011] should return 500 INTERNAL_ERROR when cleanup throws', async () => {
      req.params = { borrowId: 'bb-001' };
      cleanupReturnPin.mockRejectedValue(new Error('boom'));

      await cleanupReturnPinController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
