import pool from '../config/postgres.mjs';
import { calculateTotalPenalty } from '../utils/penalty.utils.mjs';
import { systemConfigurationService } from './system-configuration.services.mjs';
import * as roomModel from '../models/room.models.mjs';
import { emitRoomDashboardChanged } from '../config/socket.mjs';

/**
 * Branch-scoped overview statistics for the librarian room dashboard.
 * @param {number} branchId
 * @returns {Promise<Object>}
 */
export const getRoomsOverview = async (branchId) => {
  const stats = await roomModel.getRoomsOverviewStats(branchId);
  return { branchId, ...stats };
};

/**
 * Branch-scoped, paginated active reservations list.
 * @param {number} branchId
 * @param {{search?: string, status?: string, from?: string, to?: string, page?: number, limit?: number}} [filters={}]
 * @returns {Promise<{items: Array, pagination: Object}>}
 */
export const getActiveReservations = async (branchId, filters = {}) => {
  return roomModel.findActiveReservations(branchId, filters);
};

const toDate = (value) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const formatDate = (date) => date.toISOString().slice(0, 10);

const mondayOfWeek = (anchor) => {
  const day = toDate(anchor);
  const weekday = day.getUTCDay();
  const diff = (weekday === 0 ? 7 : weekday) - 1;
  day.setUTCDate(day.getUTCDate() - diff);
  return day;
};

/**
 * Branch-scoped calendar schedule. For view=week the range is normalized to the
 * Monday..Sunday week containing `from`; for view=day the range is the single day.
 * @param {number} branchId
 * @param {string} from (YYYY-MM-DD)
 * @param {string} to (YYYY-MM-DD)
 * @param {'week'|'day'} [view='week']
 * @returns {Promise<{branchId: number, rooms: Array, events: Array}>}
 */
export const getRoomSchedule = async (branchId, from, to, view = 'week') => {
  let rangeFrom = from;
  let rangeTo = to;

  if (view === 'week') {
    const monday = mondayOfWeek(from);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    rangeFrom = formatDate(monday);
    rangeTo = formatDate(sunday);
  } else {
    rangeTo = rangeFrom || rangeTo;
  }

  const result = await roomModel.findRoomSchedule(branchId, rangeFrom, rangeTo);
  return { branchId, ...result };
};

/**
 * Fetches a single reservation's full read-only detail with branch guard.
 * @param {string} reserveId
 * @param {number} branchId
 * @returns {Promise<Object|{error: {code: string}, statusCode: number}>}
 */
export const getReservationDetail = async (reserveId, branchId) => {
  const detail = await roomModel.findReservationDetail(reserveId, branchId);
  if (!detail) {
    return { error: { code: 'NOT_FOUND', message: 'Reservation not found.' }, statusCode: 404 };
  }
  if (detail.branchId !== branchId) {
    return { error: { code: 'WRONG_BRANCH', message: 'This reservation belongs to a different branch.' }, statusCode: 403 };
  }
  return detail;
};


/**
 * Find a borrow record by PIN (must not be expired)
 * @param {string} pin - The 6-digit PIN
 * @param {string} [status='pending'] - Expected borrow_book status ('pending' for borrow, 'pending_return' for return)
 */
export const verifyReturnPin = async (pin, branchId) => {
  const record = await findBorrowRecordByPin(pin, 'pending_return', branchId);
  if (!record) {
    return { error: { code: 'PIN_NOT_FOUND', message: 'The PIN has expired or does not exist.' }, statusCode: 404 };
  }

  return {
    borrowId: record.borrow_id,
    borrower: {
      username: record.username,
      gender: record.gender,
      phone_number: record.phone_number,
      email: record.email,
      birth_date: record.birth_date
    },
    book: {
      title: record.book_title,
      author: Array.isArray(record.book_author) ? record.book_author.join(', ') : record.book_author,
      publisher: record.book_publisher,
      genres: Array.isArray(record.book_genres) ? record.book_genres.join(', ') : record.book_genres,
      image_url: record.book_image_url,
      price: record.book_price
    },
    borrowing: {
      reserve_date: record.reserve_date,
      borrow_date: record.borrow_date,
      due_date: record.due_date
    },
    configurationVersion: systemConfigurationService.getState().version
  };
};

const rejectStaleReturnConfiguration = async (borrowId, expectedVersion, branchId) => {
  const currentVersion = systemConfigurationService.getState().version;
  if (expectedVersion === currentVersion) return null;

  await pool.query(
    `UPDATE public.borrow_book
     SET pin = NULL, expired_at = NULL, status = 'borrowed'
     WHERE borrow_id = $1 AND branch_id = $2 AND status = 'pending_return'`,
    [borrowId, branchId]
  );
  return {
    error: {
      code: 'CONFIGURATION_CHANGED',
      message: 'System configuration changed during this return inspection. Generate and enter a new Return PIN.',
    },
    statusCode: 409,
  };
};

export const previewReturnPenalty = async (borrowId, conditions, isLost, expectedVersion, branchId) => {
  const staleConfiguration = await rejectStaleReturnConfiguration(borrowId, expectedVersion, branchId);
  if (staleConfiguration) return staleConfiguration;

  const recordRes = await pool.query(
    `SELECT bb.due_date, b.price
     FROM public.borrow_book bb
     JOIN public.books b ON bb.book_id = b.book_id
     WHERE bb.borrow_id = $1 AND bb.branch_id = $2 AND bb.status = 'pending_return'`,
    [borrowId, branchId]
  );

  if (recordRes.rows.length === 0) {
    return { error: { code: 'NOT_FOUND', message: 'Borrow record not found or not in pending_return status' }, statusCode: 404 };
  }

  const { due_date, price } = recordRes.rows[0];
  const returnDate = new Date();
  const overdueDays = due_date && returnDate > new Date(due_date)
    ? Math.ceil((returnDate - new Date(due_date)) / (1000 * 60 * 60 * 24))
    : 0;
  const normalizedConditions = isLost ? ['lost'] : (conditions || []);
  const policy = systemConfigurationService.getSnapshot();

  return calculateTotalPenalty(normalizedConditions, Number(price), overdueDays, policy);
};

/**
 * Verifies a pending room check-in PIN and returns reservation/user/room details.
 * @param {string} pin
 * @param {number} librarianBranchId
 * @returns {Promise<Object>}
 */
export const verifyRoomPin = async (pin, librarianBranchId) => {
  const record = await roomModel.findPendingRoomReservationByPin(pin);
  if (!record) {
    return { error: { code: 'PIN_NOT_FOUND', message: 'The PIN has expired or does not exist.' }, statusCode: 404 };
  }

  if (record.branchId !== librarianBranchId) {
    return { error: { code: 'WRONG_BRANCH', message: 'This room reservation belongs to a different branch.' }, statusCode: 403 };
  }

  return {
    reserveId: record.reserveId,
    reservation: {
      startDate: record.startDate,
      startTime: record.startTime,
      endTime: record.endTime
    },
    user: {
      userId: record.userId,
      username: record.username,
      gender: record.gender,
      phoneNumber: record.phoneNumber,
      email: record.email,
      avatar: record.avatar
    },
    room: {
      roomName: record.roomName,
      description: record.description,
      capacity: record.capacity,
      imgUrl: record.imgUrl,
      branchName: record.branchName,
      branchAddress: record.branchAddress
    }
  };
};

/**
 * Confirms a room check-in, transitioning the reservation to 'used' and clearing the PIN.
 * Guards that the reservation's room belongs to the librarian's branch.
 * @param {string} reserveId
 * @param {number} librarianBranchId
 * @returns {Promise<Object>}
 */
export const confirmRoomCheckin = async (reserveId, librarianBranchId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const branch = await roomModel.findReservationBranch(reserveId, client);
    if (!branch) {
      await client.query('ROLLBACK');
      return { error: { code: 'NOT_FOUND', message: 'Reservation not found' }, statusCode: 404 };
    }
    if (branch.branchId !== librarianBranchId) {
      await client.query('ROLLBACK');
      return { error: { code: 'WRONG_BRANCH', message: 'This room reservation belongs to a different branch.' }, statusCode: 403 };
    }

    const confirmed = await roomModel.confirmRoomCheckin(reserveId, client);
    if (!confirmed) {
      await client.query('ROLLBACK');
      return { error: { code: 'NOT_FOUND', message: 'Reservation not found or already checked in' }, statusCode: 404 };
    }

    await client.query('COMMIT');
    emitRoomDashboardChanged(branch.branchId, 'checked_in');
    return { success: true, reserveId, status: 'used' };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error confirming room check-in:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const getOutstandingDebts = async (search, branchId) => {

  try {
    let query = `
      SELECT bp.penalty_id, bp.borrow_id, bp.user_id, bp.issue, bp.description,
             bp.penalty_amount, bp.record_date, bp.is_paid, u.username, u.avatar,
             b.title as book_title
      FROM public.book_penalty bp
      JOIN public.users u ON bp.user_id = u.user_id
      LEFT JOIN public.borrow_book bb ON bp.borrow_id = bb.borrow_id
      LEFT JOIN public.books b ON bb.book_id = b.book_id
      LEFT JOIN public.return_book rb ON bp.return_id = rb.return_id
      WHERE bp.is_paid = false AND COALESCE(bb.branch_id, rb.branch_id) = $1
    `;
    const params = [branchId];

    if (search) {
      query += ` AND u.username ILIKE $2`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY bp.record_date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching outstanding debts:', error);
    throw error;
  }
};

export const getPaidFees = async (search, branchId) => {
  try {
    let query = `
      SELECT bp.penalty_id, bp.borrow_id, bp.user_id, bp.issue, bp.description,
             bp.penalty_amount, bp.record_date, bp.paid_at, u.username, u.avatar,
             b.title as book_title
      FROM public.book_penalty bp
      JOIN public.users u ON bp.user_id = u.user_id
      LEFT JOIN public.borrow_book bb ON bp.borrow_id = bb.borrow_id
      LEFT JOIN public.books b ON bb.book_id = b.book_id
      LEFT JOIN public.return_book rb ON bp.return_id = rb.return_id
      WHERE bp.is_paid = true AND COALESCE(bb.branch_id, rb.branch_id) = $1
    `;
    const params = [branchId];

    if (search) {
      query += ` AND u.username ILIKE $2`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY bp.paid_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching paid fees:', error);
    throw error;
  }
};

export const confirmPayment = async (penaltyId, branchId) => {
  try {
    const check = await pool.query(
      `SELECT bp.penalty_id, bp.is_paid
       FROM public.book_penalty bp
       LEFT JOIN public.borrow_book bb ON bp.borrow_id = bb.borrow_id
       LEFT JOIN public.return_book rb ON bp.return_id = rb.return_id
       WHERE bp.penalty_id = $1 AND COALESCE(bb.branch_id, rb.branch_id) = $2`,
      [penaltyId, branchId]
    );

    if (check.rows.length === 0) {
      return { error: { code: 'NOT_FOUND', message: 'Penalty record not found' }, statusCode: 404 };
    }

    if (check.rows[0].is_paid) {
      return { error: { code: 'ALREADY_PAID', message: 'This penalty has already been paid' }, statusCode: 409 };
    }

    const result = await pool.query(
      `UPDATE public.book_penalty SET is_paid = true, paid_at = NOW()
       WHERE penalty_id = $1 AND EXISTS (
         SELECT 1 FROM public.book_penalty bp
         LEFT JOIN public.borrow_book bb ON bp.borrow_id = bb.borrow_id
         LEFT JOIN public.return_book rb ON bp.return_id = rb.return_id
         WHERE bp.penalty_id = $1 AND COALESCE(bb.branch_id, rb.branch_id) = $2
       ) RETURNING paid_at`,
      [penaltyId, branchId]
    );

    return { penalty_id: penaltyId, is_paid: true, paid_at: result.rows[0].paid_at };
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

export const confirmReturn = async (borrowId, branchId, conditions, description, isLost, expectedVersion) => {
  const staleConfiguration = await rejectStaleReturnConfiguration(borrowId, expectedVersion, branchId);
  if (staleConfiguration) return staleConfiguration;
  const policy = systemConfigurationService.getSnapshot();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const recordRes = await client.query(
      `SELECT bb.user_id, bb.book_id, bb.borrow_date, bb.due_date, b.price
       FROM public.borrow_book bb
       JOIN public.books b ON bb.book_id = b.book_id
       WHERE bb.borrow_id = $1 AND bb.branch_id = $2 AND bb.status = 'pending_return'
       FOR UPDATE`,
      [borrowId, branchId]
    );

    if (recordRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { error: { code: 'NOT_FOUND', message: 'Borrow record not found or not in pending_return status' }, statusCode: 404 };
    }

    const { user_id, book_id, due_date, price } = recordRes.rows[0];
    const returnDate = new Date();
    const isOverdue = due_date ? returnDate > new Date(due_date) : false;
    const overdueDays = isOverdue ? Math.ceil((returnDate - new Date(due_date)) / (1000 * 60 * 60 * 24)) : 0;

    const normalizedConditions = isLost ? ['lost'] : (conditions || []);
    const calculatedPenalty = calculateTotalPenalty(normalizedConditions, Number(price), overdueDays, policy);
    let penaltyAmount = calculatedPenalty.amount;
    let issue = calculatedPenalty.issue?.toLowerCase() || null;
    let returnId = null;

    const isPerfect = conditions && conditions.includes('perfect_condition');

    if (isLost) {
      if (!issue || !['overdue', 'damaged', 'lost', 'combined'].includes(issue)) {
        await client.query('ROLLBACK');
        return { error: { code: 'INVALID_ISSUE', message: 'Invalid penalty issue type for lost book' }, statusCode: 500 };
      }
      await client.query(
        `INSERT INTO public.book_penalty (borrow_id, user_id, issue, description, record_date, penalty_amount)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [borrowId, user_id, issue, description, returnDate, penaltyAmount]
      );
    } else {
      if (penaltyAmount > 0) {
        if (!issue || !['overdue', 'damaged', 'lost', 'combined'].includes(issue)) {
          await client.query('ROLLBACK');
          return { error: { code: 'INVALID_ISSUE', message: 'Invalid penalty issue type' }, statusCode: 500 };
        }
        const penaltyRes = await client.query(
          `WITH new_return AS (
             INSERT INTO public.return_book (borrow_id, branch_id, return_date, is_overdue)
             VALUES ($1, $2, $3, $4) RETURNING return_id
           )
           INSERT INTO public.book_penalty (borrow_id, return_id, user_id, issue, description, record_date, penalty_amount)
           SELECT $1, return_id, $5, $6, $7, $3, $8 FROM new_return
           RETURNING return_id`,
          [borrowId, branchId, returnDate, isOverdue, user_id, issue, description, penaltyAmount]
        );
        returnId = penaltyRes.rows[0].return_id;
      } else {
        const returnIdRes = await client.query(
          `INSERT INTO public.return_book (borrow_id, branch_id, return_date, is_overdue)
           VALUES ($1, $2, $3, $4) RETURNING return_id`,
          [borrowId, branchId, returnDate, isOverdue]
        );
        returnId = returnIdRes.rows[0].return_id;
      }

      if (!isLost) {
        await client.query(
          `UPDATE public.library SET available_quantity = available_quantity + 1 WHERE book_id = $1 AND branch_id = $2`,
          [book_id, branchId]
        );
      }
    }

    await client.query(
      `UPDATE public.users SET borrow_num = GREATEST(borrow_num - 1, 0) WHERE user_id = $1`,
      [user_id]
    );

    await client.query(
      `UPDATE public.borrow_book SET pin = NULL, expired_at = NULL WHERE borrow_id = $1`,
      [borrowId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      data: {
        returnId: isLost ? null : returnId,
        penaltyId: null,
        penaltyAmount,
        issue,
        inventoryUpdated: !isLost
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error confirming return:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const findBorrowRecordByPin = async (pin, status = 'pending', branchId = null) => {


  const query = `
    SELECT
      bb.borrow_id,
      bb.user_id,
      bb.branch_id,
      bb.book_id,
      bb.status,
      bb.reserve_date,
      bb.borrow_date,
      bb.due_date,
      u.username,
      u.gender,
      u.phone_number,
      u.email,
      u.birth_date,
      u.avatar,
      b.title as book_title,
      b.author as book_author,
      b.publisher as book_publisher,
      b.genres as book_genres,
      b.image_url as book_image_url,
      b.price as book_price
    FROM public.borrow_book bb
    JOIN public.users u ON bb.user_id = u.user_id
    JOIN public.books b ON bb.book_id = b.book_id
    WHERE bb.pin = $1 AND bb.expired_at > NOW() AND bb.status = $2
      AND ($3::integer IS NULL OR bb.branch_id = $3)
  `;

  const params = [pin, status, branchId];


  const result = await pool.query(query, params);


  if (result.rows.length > 0) {


  } else {


  }
  return result.rows.length > 0 ? result.rows[0] : null;
};


/**
 * Check if a user is eligible to borrow (no overdue books, not suspended)
 */
export const checkUserEligibility = async (userId) => {
  const overdueQuery = `
    SELECT COUNT(*) as overdue_count
    FROM public.borrow_book
    WHERE user_id = $1 AND status = 'borrowed' AND due_date < NOW()
  `;
  const userQuery = `SELECT user_id FROM public.users WHERE user_id = $1`;


  const [overdueRes, userRes] = await Promise.all([
    pool.query(overdueQuery, [userId]),
    pool.query(userQuery, [userId])
  ]);


  if (userRes.rows.length === 0) {
    return { eligible: false, reason: 'User not found.' };
  }


  const overdueCount = parseInt(overdueRes.rows[0].overdue_count);
  if (overdueCount > 0) {
    return { eligible: false, reason: 'User has overdue books.' };
  }


  return { eligible: true, reason: 'User is eligible.' };
};


/**
 * Verify a PIN and return borrower + book details with branch check
 */
export const verifyPin = async (pin, librarianBranchId) => {



  const record = await findBorrowRecordByPin(pin);
  if (!record) {


    return { error: { code: 'PIN_NOT_FOUND', message: 'The PIN has expired or does not exist.' }, statusCode: 404 };
  }


  if (record.branch_id !== librarianBranchId) {


    return { error: { code: 'WRONG_BRANCH', message: 'You have arrived at the wrong book borrowing branch.' }, statusCode: 403 };
  }


  return {
    borrowId: record.borrow_id,
    borrower: {
      username: record.username,
      gender: record.gender,
      phone_number: record.phone_number,
      email: record.email,
      avatar: record.avatar || null
    },
    book: {
      title: record.book_title,
      author: Array.isArray(record.book_author) ? record.book_author.join(', ') : record.book_author,
      publisher: record.book_publisher,
      genre: Array.isArray(record.book_genres) ? record.book_genres.join(', ') : record.book_genres,
      price: record.book_price,
      image_url: record.book_image_url || null
    }
  };
};


/**
 * Confirm a borrowing: update status to borrowed, set due_date, create calendar event, nullify expired_reserve
 */
export const confirmBorrowing = async (borrowId, librarianBranchId) => {



  const client = await pool.connect();
  try {
    await client.query('BEGIN');



    const recordQuery = 'SELECT user_id, book_id, branch_id FROM public.borrow_book WHERE borrow_id = $1 AND branch_id = $2 FOR UPDATE';
    const recordRes = await client.query(recordQuery, [borrowId, librarianBranchId]);



    if (recordRes.rows.length === 0) {


      await client.query('ROLLBACK');
      return { error: { code: 'NOT_FOUND', message: 'Borrow record not found.' }, statusCode: 404 };
    }


    const { user_id, book_id } = recordRes.rows[0];



    const eligibility = await checkUserEligibility(user_id);


    if (!eligibility.eligible) {


      await client.query('ROLLBACK');
      return { error: { code: 'USER_INELIGIBLE', message: 'Borrower has overdue books or is suspended. Cannot confirm borrowing.' }, statusCode: 409 };
    }


    const updateQuery = `
      UPDATE public.borrow_book
      SET status = 'borrowed', borrow_date = NOW(), due_date = NOW() + INTERVAL '14 days', pin = NULL, expired_at = NULL
      WHERE borrow_id = $1
      RETURNING due_date
    `;
    const updateRes = await client.query(updateQuery, [borrowId]);



    if (updateRes.rows.length === 0) {


      await client.query('ROLLBACK');
      return { error: { code: 'UPDATE_FAILED', message: 'Failed to update borrow record.' }, statusCode: 500 };
    }


    const dueDate = updateRes.rows[0].due_date;



    await client.query('COMMIT');



    return { borrowId, status: 'borrowed', due_date: dueDate };
  } catch (error) {


    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};


/**
 * Cancel a borrowing: delete borrow record and increment book quantity
 */
export const cancelBorrowing = async (borrowId, librarianBranchId) => {



  const client = await pool.connect();
  try {
    await client.query('BEGIN');



    const recordQuery = 'SELECT book_id, branch_id, user_id FROM public.borrow_book WHERE borrow_id = $1 AND branch_id = $2 FOR UPDATE';
    const recordRes = await client.query(recordQuery, [borrowId, librarianBranchId]);



    if (recordRes.rows.length === 0) {


      await client.query('ROLLBACK');
      return { error: { code: 'NOT_FOUND', message: 'Borrow record not found.' }, statusCode: 404 };
    }


    const { book_id, branch_id, user_id } = recordRes.rows[0];



    await client.query(
      'DELETE FROM public.borrow_book WHERE borrow_id = $1',
      [borrowId]
    );



    await client.query(
      'UPDATE public.library SET available_quantity = available_quantity + 1 WHERE book_id = $1 AND branch_id = $2',
      [book_id, branch_id]
    );



    await client.query(
      'UPDATE public.users SET borrow_num = GREATEST(borrow_num - 1, 0) WHERE user_id = $1',
      [user_id]
    );



    await client.query('COMMIT');



    return { borrowId, status: 'cancelled' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Fetch all borrow/pickup records from public.borrow_book joined with books, users, branches
 */
export const getPickupsService = async (branchId) => {
  const [pickupsRes, redeemedRes] = await Promise.all([
    pool.query(`
      SELECT 
        bb.borrow_id,
        bb.user_id,
        bb.book_id,
        bb.branch_id,
        bb.reserve_date,
        bb.borrow_date,
        bb.due_date,
        bb.pin,
        bb.expired_at,
        bb.status,
        b.title as book_title,
        b.isbn as book_isbn,
        b.image_url as book_image_url,
        u.username,
        u.email,
        u.avatar,
        br.name as branch_name,
        br.name_short
      FROM public.borrow_book bb
      JOIN public.books b ON bb.book_id = b.book_id
      JOIN public.users u ON bb.user_id = u.user_id
      JOIN public.branches br ON bb.branch_id = br.branch_id
      WHERE bb.status = 'reserved' AND bb.branch_id = $1
      ORDER BY bb.reserve_date DESC, bb.expired_at ASC
    `, [branchId]),
    pool.query(`
      SELECT COUNT(*) as count
      FROM public.borrow_book
      WHERE status = 'borrowed' AND borrow_date::date = CURRENT_DATE AND branch_id = $1
    `, [branchId]),
  ]);

  const pickups = pickupsRes.rows.map((r) => ({
    borrow_id: r.borrow_id,
    user_id: r.user_id,
    book_id: r.book_id,
    branch_id: r.branch_id,
    reserve_date: r.reserve_date,
    borrow_date: r.borrow_date,
    due_date: r.due_date,
    pin: r.pin,
    expired_at: r.expired_at,
    status: r.status,
    book_title: r.book_title || 'Untitled',
    book_isbn: r.book_isbn || 'N/A',
    book_image_url: r.book_image_url || '/BookCover.png',
    username: r.username || 'User',
    email: r.email || '',
    avatar: r.avatar || null,
    branch_name: r.branch_name,
    name_short: r.name_short || `CS${r.branch_id}`
  }));

  return {
    pickups,
    redeemedToday: parseInt(redeemedRes.rows[0].count, 10),
  };
};

export const getActiveBorrowings = async (branchId) => {
  const query = `
    SELECT 
      bb.borrow_id,
      bb.user_id,
      bb.book_id,
      bb.branch_id,
      bb.reserve_date,
      bb.borrow_date,
      bb.due_date,
      bb.pin,
      bb.expired_at,
      bb.status,
      bb.extend_num,
      b.title as book_title,
      b.isbn as book_isbn,
      b.image_url as book_image_url,
      b.author as book_author,
      u.username,
      u.email,
      u.avatar,
      br.name as branch_name,
      br.name_short
    FROM public.borrow_book bb
    JOIN public.books b ON bb.book_id = b.book_id
    JOIN public.users u ON bb.user_id = u.user_id
    JOIN public.branches br ON bb.branch_id = br.branch_id
    WHERE bb.status = 'borrowed' AND bb.branch_id = $1
      AND NOT EXISTS (SELECT 1 FROM public.return_book rb WHERE rb.borrow_id = bb.borrow_id)
      AND NOT EXISTS (SELECT 1 FROM public.book_penalty bp WHERE bp.borrow_id = bb.borrow_id)
    ORDER BY bb.due_date ASC
  `;

  const res = await pool.query(query, [branchId]);
  return res.rows.map((r) => ({
    borrow_id: r.borrow_id,
    user_id: r.user_id,
    book_id: r.book_id,
    branch_id: r.branch_id,
    reserve_date: r.reserve_date,
    borrow_date: r.borrow_date,
    due_date: r.due_date,
    pin: r.pin,
    expired_at: r.expired_at,
    status: r.status,
    extend_num: r.extend_num || 0,
    book_title: r.book_title || 'Untitled',
    book_isbn: r.book_isbn || 'N/A',
    book_image_url: r.book_image_url || '/BookCover.png',
    book_author: Array.isArray(r.book_author) ? r.book_author.join(', ') : (r.book_author || 'Unknown Author'),
    username: r.username || 'User',
    email: r.email || '',
    avatar: r.avatar || null,
    branch_name: r.branch_name,
    name_short: r.name_short || `CS${r.branch_id}`
  }));
};

