import { generatePickupPin, cleanupReservationPin, cancelReservationById, getUserBorrowRecords, generateReturnPin as generateReturnPinService, extendDueDate as extendDueDateService, cleanupReturnPin as cleanupReturnPinService, getUserFees as getUserFeesService, getBorrowingHistory as getBorrowingHistoryService } from '../services/dashboard.user.services.mjs';

const generatePin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reservationId } = req.params;

    const result = await generatePickupPin(userId, reservationId);

    if (result.error) {
      return res.status(result.statusCode || 400).json({
        success: false,
        error: result.error
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error generating pickup PIN:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    });
  }
};

const cleanupPin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reservationId } = req.params;
    const cleaned = await cleanupReservationPin(userId, reservationId);
    res.json({ success: true, cleaned });
  } catch (error) {
    console.error('Error cleaning up PIN:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reservationId } = req.params;

    const result = await cancelReservationById(userId, reservationId);
    
    if (result.error) {
      return res.status(result.statusCode || 400).json({ 
        success: false, 
        error: result.error 
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } 
    });
  }
};

const getMyBorrowRecords = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await getUserBorrowRecords(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching borrow records:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const generateReturnPin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { borrow_id } = req.body;

    if (!borrow_id) {
      return res.status(400).json({ success: false, data: null, message: 'borrow_id is required' });
    }

    const result = await generateReturnPinService(userId, borrow_id);

    if (result.error) {
      return res.status(result.statusCode || 400).json({ success: false, data: null, message: result.error.message });
    }

    res.json({ success: true, data: { pin: result.pin, expiresAt: result.expiresAt }, message: 'Return PIN generated successfully' });
  } catch (error) {
    console.error('Error generating return PIN:', error);
    res.status(500).json({ success: false, data: null, message: 'An unexpected error occurred.' });
  }
};

const getUserFees = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await getUserFeesService(userId);
    res.json({ success: true, data: result, message: 'Fees retrieved successfully' });
  } catch (error) {
    console.error('Error fetching user fees:', error);
    res.status(500).json({ success: false, data: null, message: 'An unexpected error occurred.' });
  }
};

const extendDueDate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { borrow_id } = req.body;

    if (!borrow_id) {
      return res.status(400).json({ success: false, data: null, message: 'borrow_id is required' });
    }

    const result = await extendDueDateService(userId, borrow_id);

    if (result.error) {
      return res.status(result.statusCode || 400).json({ success: false, data: null, message: result.error.message });
    }

    res.json({ success: true, data: { dueDate: result.dueDate, extendNum: result.extendNum }, message: 'Due date extended successfully' });
  } catch (error) {
    console.error('Error extending due date:', error);
    res.status(500).json({ success: false, data: null, message: 'An unexpected error occurred.' });
  }
};

const getBorrowingHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await getBorrowingHistoryService(userId);
    res.json({ success: true, data: result, message: 'Borrowing history retrieved successfully' });
  } catch (error) {
    console.error('Error fetching borrowing history:', error);
    res.status(500).json({ success: false, data: null, message: 'An unexpected error occurred.' });
  }
};

const cleanupReturnPin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { borrowId } = req.params;
    const cleaned = await cleanupReturnPinService(userId, borrowId);
    res.json({ success: true, cleaned });
  } catch (error) {
    console.error('Error cleaning up return PIN:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    });
  }
};

export { generatePin, cleanupPin, cancelReservation, getMyBorrowRecords, generateReturnPin, extendDueDate, cleanupReturnPin, getUserFees, getBorrowingHistory };
