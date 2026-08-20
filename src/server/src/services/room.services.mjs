import pool from '../config/postgres.mjs';
import * as roomModel from '../models/room.models.mjs';
import { generateEntityPin } from './dashboard.user.services.mjs';
import { emitRoomDashboardChanged } from '../config/socket.mjs';

export const MAX_ROOM_RESERVE_LIMIT = 5;

export const ROOM_PIN_EXPIRY_MS = 3 * 60 * 1000;

export const getStudyGroupFilterOptions = async () => {
  const rows = await roomModel.findStudyGroupFilterOptions();
  const branches = new Map();
  for (const row of rows) {
    if (!branches.has(row.branchId)) branches.set(row.branchId, { branchId: row.branchId, branchName: row.branchName, rooms: [] });
    branches.get(row.branchId).rooms.push({ roomId: row.roomId, roomName: row.roomName, capacity: row.capacity });
  }
  return [...branches.values()];
};

/**
 * Service to fetch details of a study room by name and branch.
 * @param {string} name 
 * @param {number} branchId 
 * @returns {Promise<Object>}
 */
export const getRoomDetails = async (identifier, branchId) => {
  if (!identifier) {
    throw new Error('Missing room name or ID');
  }
  
  let room;
  const parsedId = parseInt(identifier);
  if (!isNaN(parsedId) && String(parsedId) === String(identifier).trim()) {
    room = await roomModel.findRoomById(parsedId);
  } else {
    if (!branchId) {
      throw new Error('Missing branch ID for name-based lookup');
    }
    room = await roomModel.findRoomByNameAndBranch(identifier, parseInt(branchId));
  }

  if (!room) {
    const error = new Error('Room not found.');
    error.status = 404;
    throw error;
  }
  return room;
};

/**
 * Service to fetch availability slots and calculate booking status.
 * @param {number} roomId 
 * @param {string} date 
 * @returns {Promise<Array>}
 */
export const getRoomAvailability = async (roomId, date) => {
  if (!roomId || !date) {
    throw new Error('Invalid roomId or date parameter format.');
  }

  // Basic format check for YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    const error = new Error('Invalid roomId or date parameter format.');
    error.status = 400;
    throw error;
  }

  const parsedRoomId = parseInt(roomId);
  if (isNaN(parsedRoomId)) {
    const error = new Error('Invalid roomId or date parameter format.');
    error.status = 400;
    throw error;
  }

  const rows = await roomModel.findRoomAvailability(parsedRoomId, date);
  
  return rows.map(row => {
    let status = 'free';
    if (row.reserveId) {
      if (row.reserveStatus === 'pending') {
        status = 'pending';
      } else {
        status = 'reserved';
      }
    }
    
    return {
      availId: row.availId,
      startTime: row.startTime,
      endTime: row.endTime,
      status: status,
      reserveId: row.reserveId || null
    };
  });
};

/**
 * Creates a room reservation after checking for conflicts and enforcing the
 * per-user reservation limit. Increments `users.reserve_num` in the same
 * transaction as the insert.
 * @param {string} userId UUID
 * @param {number} availId
 * @param {string} startDate (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
export const createReservation = async (userId, availId, startDate) => {
  if (!userId || !availId || !startDate) {
    const error = new Error('Missing required fields: userId, availId, startDate');
    error.status = 400;
    throw error;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate)) {
    const error = new Error('Invalid date format. Expected YYYY-MM-DD.');
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const slot = await roomModel.lockReservationSlot(availId, startDate, client);
    if (!slot.exists) {
      const missing = new Error('Room availability slot not found.');
      missing.status = 404;
      throw missing;
    }
    if (slot.occupied) {
      const conflict = new Error('This time slot is no longer available.');
      conflict.status = 409;
      throw conflict;
    }

    const reserveNum = await roomModel.findUserReserveNum(userId, client);
    if (reserveNum >= MAX_ROOM_RESERVE_LIMIT) {
      await client.query('ROLLBACK');
      const limitError = new Error(`You have reached the maximum reservation limit of ${MAX_ROOM_RESERVE_LIMIT} rooms`);
      limitError.status = 400;
      limitError.code = 'ROOM_RESERVE_LIMIT_EXCEEDED';
      throw limitError;
    }

    const reservation = await roomModel.createReservation(userId, availId, startDate, client);
    const incremented = await roomModel.incrementReserveNum(userId, MAX_ROOM_RESERVE_LIMIT, client);
    if (!incremented) {
      const limitError = new Error(`You have reached the maximum reservation limit of ${MAX_ROOM_RESERVE_LIMIT} rooms`);
      limitError.status = 400;
      limitError.code = 'ROOM_RESERVE_LIMIT_EXCEEDED';
      throw limitError;
    }

    await client.query('COMMIT');

    const { branchId } = (await roomModel.findReservationBranch(reservation.reserveId)) || {};
    if (branchId) emitRoomDashboardChanged(branchId, 'created');

    return reservation;
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505' && error.constraint === 'uq_reserve_room_active_slot') {
      const conflict = new Error('This time slot is no longer available.');
      conflict.status = 409;
      throw conflict;
    }
    if (error.code === '23503' && error.constraint === 'fk_reserve_user') {
      const staleAccount = new Error('Your account is no longer available. Please sign in again.');
      staleAccount.status = 401;
      staleAccount.code = 'AUTH_USER_NOT_FOUND';
      throw staleAccount;
    }
    if (error.code === '23503' && error.constraint === 'fk_reserve_availroom') {
      const missingSlot = new Error('Room availability slot not found.');
      missingSlot.status = 404;
      throw missingSlot;
    }
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Retrieves and categorizes reservations for a user.
 * @param {string} userId UUID
 * @returns {Promise<{upcoming: Array, past: Array}>}
 */
export const getUserReservations = async (userId) => {
  if (!userId) {
    const error = new Error('User ID is required');
    error.status = 400;
    throw error;
  }

  const rows = await roomModel.findUserReservations(userId);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const toDateStr = (d) => {
    if (typeof d === 'string') return d;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const upcoming = [];
  const past = [];
  for (const r of rows) {
    const isCompleted = r.status === 'used' && Boolean(r.checkoutTime);
    if (isCompleted || toDateStr(r.startDate) < today) {
      past.push(r);
    } else {
      upcoming.push(r);
    }
  }

  return { upcoming, past };
};

/**
 * Cancels a reservation by permanently deleting it, releasing the active slot,
 * and decrementing the user's `reserve_num` in the same transaction.
 * @param {string} reserveId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export const cancelReservation = async (reserveId, userId) => {
  if (!reserveId || !userId) {
    const error = new Error('Missing required fields');
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { branchId } = (await roomModel.findReservationBranch(reserveId, client)) || {};
    const cancelled = await roomModel.cancelReservation(reserveId, userId, client);
    if (!cancelled) {
      await client.query('ROLLBACK');
      const error = new Error('Reservation not found or no longer cancellable');
      error.status = 404;
      throw error;
    }

    await roomModel.decrementReserveNum(userId, client);

    await client.query('COMMIT');

    if (branchId) emitRoomDashboardChanged(branchId, 'cancelled');

    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Generates a check-in PIN for a room reservation, reusing the shared PIN core.
 * Guarded so the PIN can only be generated once the reservation slot window has
 * started (Vietnam local time).
 * @param {string} userId UUID
 * @param {string} reserveId
 * @returns {Promise<{pin: string, expiresAt: Date}|{error: Object, statusCode: number}>}
 */
export const generateRoomPin = async (userId, reserveId) => {
  const slot = await roomModel.findReservationSlotStart(reserveId, userId);

  if (!slot || !['reserved', 'pending'].includes(slot.status)) {
    return {
      error: { code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found or invalid status' },
      statusCode: 404,
    };
  }

  if (!slot.slotStarted) {
    return {
      error: {
        code: 'PIN_NOT_ELIGIBLE_YET',
        message: `Check-in PIN can only be generated once the reservation slot starts (${slot.startDate} ${String(slot.startTime).slice(0, 5)})`,
      },
      statusCode: 409,
    };
  }

  const result = await generateEntityPin({
    table: 'reserve_room',
    idColumn: 'reserve_id',
    userId,
    entityId: reserveId,
    allowedStatuses: ['reserved', 'pending'],
    resetStatus: 'reserved',
    pendingStatus: 'pending',
    notFoundCode: 'RESERVATION_NOT_FOUND',
    notFoundMessage: 'Reservation not found or invalid status',
    expiryMs: ROOM_PIN_EXPIRY_MS,
  });

  if (result.pin) {
    const branch = await roomModel.findReservationBranch(reserveId);
    if (branch?.branchId) emitRoomDashboardChanged(branch.branchId, 'pin_generated');
  }

  return result;
};

/**
 * Manually clears a pending PIN back to 'reserved' (user dismisses PIN flow).
 * @param {string} userId UUID
 * @param {string} reserveId
 * @returns {Promise<{cleaned: boolean}>}
 */
export const cleanupRoomPin = async (userId, reserveId) => {
  const cleaned = await roomModel.cleanupRoomPin(reserveId, userId);
  if (cleaned) {
    const branch = await roomModel.findReservationBranch(reserveId);
    if (branch?.branchId) emitRoomDashboardChanged(branch.branchId, 'pin_cleaned');
  }
  return { cleaned };
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Retrieves a user's room reservation history with optional date filtering.
 * @param {string} userId UUID
 * @param {string} [from] YYYY-MM-DD
 * @param {string} [to] YYYY-MM-DD
 * @returns {Promise<Array>}
 */
export const getRoomHistory = async (userId, from, to) => {
  if (!userId) {
    const error = new Error('User ID is required');
    error.status = 400;
    throw error;
  }

  if (from && !DATE_REGEX.test(from)) {
    const error = new Error('Invalid from date format. Expected YYYY-MM-DD.');
    error.status = 400;
    throw error;
  }
  if (to && !DATE_REGEX.test(to)) {
    const error = new Error('Invalid to date format. Expected YYYY-MM-DD.');
    error.status = 400;
    throw error;
  }

  return roomModel.findRoomHistory(userId, from || undefined, to || undefined);
};

/**
 * Confirms checkout for a used reservation whose slot has elapsed. Inserts a
 * return_room record and decrements reserve_num in one transaction. Returns the
 * existing record if the user already confirmed checkout.
 * @param {string} userId UUID
 * @param {string} reserveId
 * @returns {Promise<Object>}
 */
export const confirmCheckout = async (userId, reserveId) => {
  if (!userId || !reserveId) {
    const error = new Error('Missing required fields');
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await roomModel.findReturnRecord(reserveId, client);
    if (existing) {
      await client.query('ROLLBACK');
      return { alreadyCheckedOut: true, returnId: existing.returnId, checkoutTime: existing.checkoutTime };
    }

    const reservation = await roomModel.findReservationOwnedBy(reserveId, userId, client);
    if (!reservation) {
      await client.query('ROLLBACK');
      const error = new Error('Reservation not found or not owned by user');
      error.status = 404;
      error.code = 'RESERVATION_NOT_FOUND';
      throw error;
    }

    if (reservation.status !== 'used') {
      await client.query('ROLLBACK');
      const error = new Error('Checkout is only available for checked-in reservations');
      error.status = 409;
      error.code = 'CHECKOUT_NOT_ELIGIBLE';
      throw error;
    }

    const toLocalDateStr = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const startDateStr = typeof reservation.startDate === 'string'
      ? reservation.startDate
      : toLocalDateStr(new Date(reservation.startDate));
    const slotEndsAt = new Date(`${startDateStr}T${reservation.endTime}`);
    if (Date.now() < slotEndsAt.getTime()) {
      await client.query('ROLLBACK');
      const error = new Error('Reservation slot has not ended yet');
      error.status = 409;
      error.code = 'CHECKOUT_NOT_ELIGIBLE';
      throw error;
    }

    const { returnId, checkoutTime } = await roomModel.checkoutRoom(reserveId, userId, null, client);

    await client.query('COMMIT');

    const { branchId } = (await roomModel.findReservationBranch(reserveId)) || {};
    if (branchId) emitRoomDashboardChanged(branchId, 'checked_out');

    return { alreadyCheckedOut: false, returnId, checkoutTime };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
