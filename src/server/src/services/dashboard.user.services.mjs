import pool from '../config/postgres.mjs';
import { cleanText } from './search.services.mjs';

/**
 * Shared PIN-generation core used by book pickup/return and room check-in flows.
 * @param {Object} opts
 * @param {string} opts.table Target table (e.g. 'borrow_book', 'reserve_room')
 * @param {string} opts.idColumn Primary id column name (e.g. 'borrow_id', 'reserve_id')
 * @param {string} opts.userId Owning user UUID
 * @param {string|number} opts.entityId Entity id value
 * @param {string[]} opts.allowedStatuses Statuses the row must be in to generate a PIN
 * @param {string} opts.resetStatus Status to revert to when clearing a stale PIN
 * @param {string} opts.pendingStatus Status to set once the PIN is stored
 * @param {string} opts.notFoundCode Error code when the row is not found/invalid status
 * @param {string} opts.notFoundMessage Error message when not found
 * @param {number} [opts.expiryMs=180000] PIN validity window
 */
export const generateEntityPin = async ({
  table,
  idColumn,
  userId,
  entityId,
  allowedStatuses,
  resetStatus,
  pendingStatus,
  notFoundCode,
  notFoundMessage,
  expiryMs = 180 * 1000,
}) => {
  const statusList = allowedStatuses.map((s) => `'${s}'`).join(', ');
  const check = await pool.query(
    `SELECT ${idColumn}, user_id FROM public.${table} WHERE ${idColumn} = $1 AND user_id = $2 AND status IN (${statusList})`,
    [entityId, userId]
  );

  if (check.rows.length === 0) {
    return { error: { code: notFoundCode, message: notFoundMessage }, statusCode: 404 };
  }

  const active = await pool.query(
    `SELECT pin, to_char(expired_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS expired_at FROM public.${table} WHERE ${idColumn} = $1 AND pin IS NOT NULL AND expired_at > NOW()`,
    [entityId]
  );

  if (active.rows.length > 0) {
    return { pin: active.rows[0].pin, expiresAt: active.rows[0].expired_at };
  }

  await pool.query(
    `UPDATE public.${table} SET pin = NULL, expired_at = NULL, status = '${resetStatus}' WHERE ${idColumn} = $1`,
    [entityId]
  );

  for (let attempt = 0; attempt < 3; attempt++) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + expiryMs);

    try {
      const updated = await pool.query(
        `UPDATE public.${table} SET pin = $1, expired_at = $2, status = '${pendingStatus}' WHERE ${idColumn} = $3`,
        [pin, expiresAt, entityId]
      );

      if (updated.rowCount > 0) {
        return { pin, expiresAt };
      }
    } catch (err) {
      if (err.code === '23505') {
        continue;
      }
      throw err;
    }
  }

  return { error: { code: 'PIN_GENERATION_FAILED', message: 'Failed to generate unique PIN after 3 attempts' }, statusCode: 500 };
};

export const generatePickupPin = async (userId, borrowId) => {
  try {
    return await generateEntityPin({
      table: 'borrow_book',
      idColumn: 'borrow_id',
      userId,
      entityId: borrowId,
      allowedStatuses: ['reserved', 'pending'],
      resetStatus: 'reserved',
      pendingStatus: 'pending',
      notFoundCode: 'RESERVATION_NOT_FOUND',
      notFoundMessage: 'Reservation not found or invalid status',
    });
  } catch (error) {
    console.error('Error generating pickup PIN:', error);
    throw error;
  }
};

export const cancelReservationById = async (userId, reservationId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkQuery = `
      SELECT borrow_id, book_id, branch_id, status 
      FROM public.borrow_book 
      WHERE borrow_id = $1 AND user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [reservationId, userId]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { 
        error: { code: 'NOT_FOUND', message: 'Reservation not found' },
        statusCode: 404
      };
    }

    const reservation = checkResult.rows[0];

    if (reservation.status !== 'pending' && reservation.status !== 'reserved') {
      await client.query('ROLLBACK');
      return { 
        error: { code: 'CANNOT_CANCEL', message: 'Only pending or reserved reservations can be cancelled' },
        statusCode: 400
      };
    }

    await client.query(
      'UPDATE public.library SET available_quantity = available_quantity + 1 WHERE book_id = $1 AND branch_id = $2',
      [reservation.book_id, reservation.branch_id]
    );

    await client.query(
      'DELETE FROM public.borrow_book WHERE borrow_id = $1',
      [reservationId]
    );

    await client.query(
      'UPDATE public.users SET borrow_num = GREATEST(borrow_num - 1, 0) WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');

    return {
      reservationId,
      status: 'cancelled'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getUserBorrowRecords = async (userId) => {
  const query = `
    SELECT 
      bb.borrow_id,
      bb.book_id,
      bb.branch_id,
      bb.status,
      bb.borrow_date,
      bb.due_date,
      bb.reserve_date,
      bb.expired_at,
      bb.pin,
      bb.extend_num,
      b.title,
      b.author,
      b.image_url,
      br.name as branch_name,
      br.address as branch_address,
      (SELECT return_date FROM public.return_book WHERE borrow_id = bb.borrow_id LIMIT 1) as return_date,
      (SELECT is_overdue FROM public.return_book WHERE borrow_id = bb.borrow_id LIMIT 1) as is_overdue,
      EXISTS (SELECT 1 FROM public.return_book WHERE borrow_id = bb.borrow_id) as has_return,
      EXISTS (SELECT 1 FROM public.book_penalty WHERE borrow_id = bb.borrow_id) as has_penalty,
      (SELECT ARRAY_AGG(DISTINCT issue) FROM public.book_penalty WHERE borrow_id = bb.borrow_id) as penalty_issues
    FROM public.borrow_book bb
    JOIN public.books b ON bb.book_id = b.book_id
    JOIN public.branches br ON bb.branch_id = br.branch_id
    WHERE bb.user_id = $1
    ORDER BY 
      CASE bb.status 
        WHEN 'pending' THEN 1
        WHEN 'borrowed' THEN 2
        WHEN 'reserved' THEN 3
      END,
      bb.borrow_date DESC NULLS LAST,
      bb.reserve_date DESC NULLS LAST
  `;
  const result = await pool.query(query, [userId]);
  
  const current = [];
  const past = [];

  const classifyCondition = (issues) => {
    if (!issues || issues.length === 0) return 'returned';
    if (issues.includes('lost')) return 'lost';
    if (issues.includes('combined')) return 'combined';
    if (issues.includes('damaged') && issues.includes('overdue')) return 'combined';
    if (issues.includes('damaged')) return 'damaged';
    if (issues.includes('overdue')) return 'overdue';
    return 'returned';
  };

  for (const row of result.rows) {
    const penaltyIssues = row.penalty_issues || [];

    const book = {
      id: row.borrow_id,
      bookId: row.book_id,
      title: cleanText(row.title),
      author: row.author ? row.author.map(cleanText).join(', ') : 'Unknown Author',
      coverImage: row.image_url || null,
      branchId: row.branch_id,
      branchName: row.branch_name,
      branchAddress: row.branch_address,
      status: row.status,
      borrowDate: row.borrow_date,
      dueDate: row.due_date,
      reserveDate: row.reserve_date,
      expiresAt: row.expired_at,
      pin: row.pin || null,
      returnedDate: row.return_date || null,
      extendNum: row.extend_num != null ? row.extend_num : 0,
      isOverdue: row.is_overdue || false,
      borrowCondition: row.has_return || row.has_penalty ? classifyCondition(penaltyIssues) : undefined
    };

    if (row.has_return || row.has_penalty) {
      past.push(book);
    } else {
      current.push(book);
    }
  }
  
  return { current, past };
};

export const generateReturnPin = async (userId, borrowId) => {
  try {
    return await generateEntityPin({
      table: 'borrow_book',
      idColumn: 'borrow_id',
      userId,
      entityId: borrowId,
      allowedStatuses: ['borrowed'],
      resetStatus: 'borrowed',
      pendingStatus: 'pending_return',
      notFoundCode: 'BORROW_NOT_FOUND',
      notFoundMessage: 'Borrow record not found or book is not currently borrowed',
    });
  } catch (error) {
    console.error('Error generating return PIN:', error);
    return { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected error occurred' }, statusCode: 500 };
  }
};

export const extendDueDate = async (userId, borrowId) => {
  try {
    const check = await pool.query(
      `SELECT borrow_id, extend_num, due_date FROM public.borrow_book WHERE borrow_id = $1 AND user_id = $2 AND status = 'borrowed'`,
      [borrowId, userId]
    );

    if (check.rows.length === 0) {
      return { error: { code: 'BORROW_NOT_FOUND', message: 'Borrow record not found or book is not currently borrowed' }, statusCode: 404 };
    }

    const { extend_num, due_date } = check.rows[0];

    if (extend_num >= 3) {
      return { error: { code: 'EXTEND_LIMIT_REACHED', message: 'This book has already been extended the maximum of 3 times.' }, statusCode: 400 };
    }

    const newDueDate = new Date(due_date);
    newDueDate.setDate(newDueDate.getDate() + 7);

    await pool.query(
      `UPDATE public.borrow_book SET due_date = $1, extend_num = extend_num + 1 WHERE borrow_id = $2`,
      [newDueDate, borrowId]
    );

    return { dueDate: newDueDate.toISOString(), extendNum: extend_num + 1 };
  } catch (error) {
    console.error('Error extending due date:', error);
    return { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected error occurred' }, statusCode: 500 };
  }
};

export const cleanupReturnPin = async (userId, borrowId) => {
  try {
    const result = await pool.query(
      `UPDATE public.borrow_book SET pin = NULL, expired_at = NULL, status = 'borrowed'
       WHERE borrow_id = $1 AND user_id = $2 AND status = 'pending_return'`,
      [borrowId, userId]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error cleaning up return PIN:', error);
    return false;
  }
};

export const getUserFees = async (userId) => {
  try {
    const outstanding = await pool.query(
      `SELECT bp.penalty_id, bp.borrow_id, bp.issue, bp.description,
              bp.penalty_amount, bp.record_date, b.title as book_title
       FROM public.book_penalty bp
       JOIN public.borrow_book bb ON bp.borrow_id = bb.borrow_id
       JOIN public.books b ON bb.book_id = b.book_id
       WHERE bp.user_id = $1 AND bp.is_paid = false
       ORDER BY bp.record_date DESC`,
      [userId]
    );

    const history = await pool.query(
      `SELECT bp.penalty_id, bp.borrow_id, bp.issue, bp.description,
              bp.penalty_amount, bp.record_date, bp.paid_at, b.title as book_title
       FROM public.book_penalty bp
       JOIN public.borrow_book bb ON bp.borrow_id = bb.borrow_id
       JOIN public.books b ON bb.book_id = b.book_id
       WHERE bp.user_id = $1 AND bp.is_paid = true
       ORDER BY bp.paid_at DESC`,
      [userId]
    );

    return { outstanding: outstanding.rows, history: history.rows };
  } catch (error) {
    console.error('Error fetching user fees:', error);
    throw error;
  }
};

export const getBorrowingHistory = async (userId) => {
  try {
    const query = `
      SELECT
        rb.return_id,
        rb.borrow_id,
        rb.branch_id,
        rb.return_date,
        rb.is_overdue,
        br.name as branch_name,
        b.image_url,
        b.title,
        b.author
      FROM public.return_book rb
      JOIN public.borrow_book bb ON rb.borrow_id = bb.borrow_id
      JOIN public.books b ON bb.book_id = b.book_id
      JOIN public.branches br ON rb.branch_id = br.branch_id
      WHERE bb.user_id = $1
      ORDER BY rb.return_date DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching borrowing history:', error);
    throw error;
  }
};

export const cleanupReservationPin = async (userId, borrowId) => {
  try {
    const result = await pool.query(
      `UPDATE public.borrow_book SET pin = NULL, expired_at = NULL, status = 'reserved'
       WHERE borrow_id = $1 AND user_id = $2 AND status = 'pending'`,
      [borrowId, userId]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error cleaning up reservation PIN:', error);
    return false;
  }
};
