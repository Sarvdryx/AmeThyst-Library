import { verifyPin as verifyPinService, confirmBorrowing as confirmBorrowingService, cancelBorrowing as cancelBorrowingService, verifyReturnPin as verifyReturnPinService, previewReturnPenalty as previewReturnPenaltyService, confirmReturn as confirmReturnService, getOutstandingDebts as getOutstandingDebtsService, getPaidFees as getPaidFeesService, confirmPayment as confirmPaymentService, getPickupsService, getActiveBorrowings as getActiveBorrowingsService, verifyRoomPin as verifyRoomPinService, confirmRoomCheckin as confirmRoomCheckinService, getRoomsOverview as getRoomsOverviewService, getActiveReservations as getActiveReservationsService, getRoomSchedule as getRoomScheduleService, getReservationDetail as getReservationDetailService } from '../services/dashboard.librarian.services.mjs';

const getRoomsOverview = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    const data = await getRoomsOverviewService(branchId);
    res.json({ success: true, data, message: 'Room dashboard overview retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

const getActiveReservations = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    const { search, status, from, to } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const data = await getActiveReservationsService(branchId, {
      search: search || undefined,
      status: status || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      limit,
    });
    res.json({ success: true, data, message: 'Active room reservations retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

const getRoomSchedule = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    const { from, to } = req.query;
    const view = req.query.view === 'day' ? 'day' : 'week';
    if (!from) {
      return res.status(400).json({ success: false, data: null, message: 'The `from` date is required.' });
    }
    const data = await getRoomScheduleService(branchId, from, to || from, view);
    res.json({ success: true, data, message: 'Room schedule retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

const getReservationDetail = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    const { reserveId } = req.params;
    const result = await getReservationDetailService(reserveId, branchId);

    if (result.error) {
      return res.status(result.statusCode).json({ success: false, data: null, message: result.error.message });
    }

    res.json({ success: true, data: result, message: 'Reservation detail retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

const getPickups = async (req, res) => {
  try {
    const pickups = await getPickupsService(req.user.branch_id);
    res.json({ success: true, data: pickups });
  } catch (error) {
    res.status(500).json({ success: false, data: [], message: error.message || 'Error fetching pickups.' });
  }
};

const verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const branchId = req.user.branch_id;

    if (!pin || pin.length !== 6) {
      return res.status(400).json({ success: false, data: null, message: 'A valid 6-digit PIN is required.' });
    }

    const result = await verifyPinService(pin, branchId);
    if (result.error) {
      return res.status(result.statusCode).json({ success: false, data: null, message: result.error.message });
    }

    res.json({ success: true, data: { borrowId: result.borrowId, borrower: result.borrower, book: result.book }, message: 'PIN verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

const confirmBorrowing = async (req, res) => {
  try {
    const { borrow_id } = req.body;
    if (!borrow_id) {
      return res.status(400).json({ success: false, data: null, message: 'borrow_id is required.' });
    }

    const result = await confirmBorrowingService(borrow_id, req.user.branch_id);
    if (result.error) {
      return res.status(result.statusCode).json({ success: false, data: null, message: result.error.message });
    }

    res.json({ success: true, data: { borrowId: result.borrowId, status: result.status, due_date: result.due_date }, message: 'Borrowing confirmed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

const cancelBorrowing = async (req, res) => {
  try {
    const { borrow_id } = req.body;
    if (!borrow_id) {
      return res.status(400).json({ success: false, data: null, message: 'borrow_id is required.' });
    }

    const result = await cancelBorrowingService(borrow_id, req.user.branch_id);
    if (result.error) {
      return res.status(result.statusCode).json({ success: false, data: null, message: result.error.message });
    }

    res.json({ success: true, data: { borrowId: result.borrowId, status: result.status }, message: 'Borrowing cancelled successfully. Book quantity updated.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};


const verifyReturnPin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || pin.length !== 6) {
      return res.status(400).json({ success: false, data: null, message: 'A valid 6-digit PIN is required.' });
    }

    const result = await verifyReturnPinService(pin, req.user.branch_id);

    if (result.error) {
      return res.status(result.statusCode).json({ success: false, data: null, message: result.error.message });
    }

    res.json({ success: true, data: result, message: 'Return PIN verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

const verifyRoomPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const branchId = req.user.branch_id;

    if (!pin || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({ success: false, data: null, message: 'A valid 6-digit PIN is required.' });
    }

    const result = await verifyRoomPinService(pin, branchId);

    if (result.error) {
      return res.status(result.statusCode).json({ success: false, data: null, message: result.error.message });
    }

    res.json({ success: true, data: result, message: 'Room PIN verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

const confirmRoomCheckin = async (req, res) => {
  try {
    const { reserve_id } = req.body;
    const branchId = req.user.branch_id;

    if (!reserve_id) {
      return res.status(400).json({ success: false, data: null, message: 'reserve_id is required.' });
    }

    const result = await confirmRoomCheckinService(reserve_id, branchId);

    if (result.error) {
      return res.status(result.statusCode).json({ success: false, data: null, message: result.error.message });
    }

    res.json({ success: true, data: result, message: 'Room check-in confirmed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

const confirmReturn = async (req, res) => {
  try {
    const { borrow_id, conditions, description, is_lost, expected_configuration_version } = req.body;
    const branchId = req.user.branch_id;

    if (!borrow_id || !branchId) {
      return res.status(400).json({ success: false, data: null, message: 'borrow_id and branch_id are required' });
    }

    const result = await confirmReturnService(borrow_id, branchId, conditions || [], description || null, is_lost || false, expected_configuration_version);

    if (result.error) {
      return res.status(result.statusCode).json({ success: false, data: null, error: result.error, message: result.error.message });
    }

    res.json({ success: true, data: result.data, message: 'Return confirmed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

const previewReturnPenalty = async (req, res) => {
  try {
    const { borrow_id, conditions, is_lost, expected_configuration_version } = req.body;
    if (!borrow_id) {
      return res.status(400).json({ success: false, data: null, message: 'borrow_id is required' });
    }

    const result = await previewReturnPenaltyService(borrow_id, conditions || [], is_lost || false, expected_configuration_version, req.user.branch_id);
    if (result.error) {
      return res.status(result.statusCode).json({ success: false, data: null, error: result.error, message: result.error.message });
    }

    return res.json({ success: true, data: result, message: 'Return penalty preview calculated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

const getPaidFees = async (req, res) => {
  try {
    const { search } = req.query;
    const result = await getPaidFeesService(search || null, req.user.branch_id);
    res.json({ success: true, data: result, message: 'Paid fees retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

const getActiveBorrowings = async (req, res) => {
  try {
    const result = await getActiveBorrowingsService(req.user.branch_id);
    res.json({ success: true, data: result, message: 'Active borrowings retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

const getOutstandingDebts = async (req, res) => {
  try {
    const { search } = req.query;
    const result = await getOutstandingDebtsService(search || null, req.user.branch_id);
    res.json({ success: true, data: result, message: 'Outstanding debts retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { penalty_id } = req.body;

    if (!penalty_id) {
      return res.status(400).json({ success: false, data: null, message: 'penalty_id is required' });
    }

    const result = await confirmPaymentService(penalty_id, req.user.branch_id);

    if (result.error) {
      return res.status(result.statusCode).json({ success: false, data: null, message: result.error.message });
    }

    res.json({ success: true, data: result, message: 'Payment confirmed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message || 'An unexpected error occurred.' });
  }
};

export {getPickups, verifyPin, confirmBorrowing, cancelBorrowing, verifyReturnPin, previewReturnPenalty, confirmReturn, getOutstandingDebts, getPaidFees, getActiveBorrowings, confirmPayment, verifyRoomPin, confirmRoomCheckin, getRoomsOverview, getActiveReservations, getRoomSchedule, getReservationDetail };

