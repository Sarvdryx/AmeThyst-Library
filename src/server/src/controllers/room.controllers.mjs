import * as roomService from '../services/room.services.mjs';
import { emitStudyGroupChanged } from '../config/socket.mjs';

export const getStudyGroupFilterOptionsController = async (_req, res) => {
  try {
    return res.status(200).json({ success: true, data: await roomService.getStudyGroupFilterOptions() });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, error: error.message || 'Unable to load Study Group filter options.' });
  }
};

/**
 * Controller to get room details.
 */
export const getRoomDetailsController = async (req, res) => {
  try {
    const { name, roomId, branchId } = req.query;
    const identifier = roomId || name;
    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Room identifier (roomId or name) is required.'
      });
    }

    const room = await roomService.getRoomDetails(identifier, branchId);
    return res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'An error occurred while fetching room details.'
    });
  }
};

/**
 * Controller to get room availability slots.
 */
export const getRoomAvailabilityController = async (req, res) => {
  try {
    const { roomId, date } = req.query;
    if (!roomId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Invalid roomId or date parameter format.'
      });
    }

    const availability = await roomService.getRoomAvailability(roomId, date);
    return res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'An error occurred while fetching availability.'
    });
  }
};

/**
 * Controller to create a room reservation.
 */
export const createReservationController = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const { availId, startDate } = req.body;
    if (!availId || !startDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: availId, startDate.'
      });
    }

    const reservation = await roomService.createReservation(userId, availId, startDate);
    return res.status(201).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.code
        ? { code: error.code, message: error.message || 'An error occurred while creating reservation.' }
        : error.message || 'An error occurred while creating reservation.'
    });
  }
};

/**
 * Controller to get user's room reservations.
 */
export const getUserReservationsController = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const result = await roomService.getUserReservations(userId);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'An error occurred while fetching reservations.'
    });
  }
};

/**
 * Controller to cancel a room reservation.
 */
export const cancelReservationController = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const { reserveId } = req.params;
    if (!reserveId) {
      return res.status(400).json({ success: false, error: 'Missing reservation ID.' });
    }

    await roomService.cancelReservation(reserveId, userId);
    emitStudyGroupChanged(null, 'reservation-cancelled');
    return res.status(200).json({ success: true, message: 'Reservation cancelled.' });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'An error occurred while cancelling reservation.'
    });
  }
};

/**
 * Controller to generate a check-in PIN for a room reservation.
 */
export const generateRoomPinController = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const { reserveId } = req.params;
    if (!reserveId) {
      return res.status(400).json({ success: false, error: 'Missing reservation ID.' });
    }

    const result = await roomService.generateRoomPin(userId, reserveId);
    if (result.error) {
      return res.status(result.statusCode).json({ success: false, error: result.error });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'An error occurred while generating PIN.'
    });
  }
};

/**
 * Controller to fetch a user's room reservation history.
 */
export const getRoomHistoryController = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const { from, to } = req.query;
    const history = await roomService.getRoomHistory(userId, from, to);
    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'An error occurred while fetching room history.'
    });
  }
};

/**
 * Controller to clear a pending room check-in PIN (user dismisses flow).
 */
export const cleanupRoomPinController = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const { reserveId } = req.params;
    if (!reserveId) {
      return res.status(400).json({ success: false, error: 'Missing reservation ID.' });
    }

    const result = await roomService.cleanupRoomPin(userId, reserveId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'An error occurred while clearing PIN.'
    });
  }
};

/**
 * Controller to confirm checkout for a used room reservation.
 */
export const confirmCheckoutController = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const { reserveId } = req.params;
    if (!reserveId) {
      return res.status(400).json({ success: false, error: 'Missing reservation ID.' });
    }

    const result = await roomService.confirmCheckout(userId, reserveId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.code
        ? { code: error.code, message: error.message || 'An error occurred while confirming checkout.' }
        : error.message || 'An error occurred while confirming checkout.'
    });
  }
};
