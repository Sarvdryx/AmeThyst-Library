import pool from '../config/postgres.mjs';

/**
 * Fetch all available library branches
 */
export const getBranchesModel = async () => {
  const query = `
    SELECT branch_id, name, name_short
    FROM public.branches
    ORDER BY branch_id ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};

/**
 * Fetch executive summary metrics (Total Users, Active Borrows, Total Borrows in Period, Overdue Count, Late Fees)
 */
export const getSummaryMetricsModel = async ({ timeframe = 'week', branchId = 'all' }) => {
  const isAllBranch = branchId === 'all' || !branchId;
  const bId = isAllBranch ? null : parseInt(branchId, 10);
  const intervalDays = timeframe === 'month' ? 30 : 7;

  // 1. Total users
  const userQuery = bId
    ? 'SELECT COUNT(*)::int AS count FROM public.users WHERE branch_id = $1'
    : 'SELECT COUNT(*)::int AS count FROM public.users';
  const userParams = bId ? [bId] : [];
  const userRes = await pool.query(userQuery, userParams);
  const totalUsers = userRes.rows[0]?.count || 0;

  // 2. Active borrows
  const activeQuery = bId
    ? "SELECT COUNT(*)::int AS count FROM public.borrow_book WHERE status = 'borrowed' AND branch_id = $1"
    : "SELECT COUNT(*)::int AS count FROM public.borrow_book WHERE status = 'borrowed'";
  const activeParams = bId ? [bId] : [];
  const activeRes = await pool.query(activeQuery, activeParams);
  const activeBorrows = activeRes.rows[0]?.count || 0;

  // 3. Total borrows in timeframe (strictly filtering by borrow_date or reserve_date)
  const totalBorrowsQuery = bId
    ? `SELECT COUNT(*)::int AS count FROM public.borrow_book WHERE branch_id = $1 AND COALESCE(borrow_date, reserve_date) >= (CURRENT_DATE - ($2 || ' days')::interval)`
    : `SELECT COUNT(*)::int AS count FROM public.borrow_book WHERE COALESCE(borrow_date, reserve_date) >= (CURRENT_DATE - ($1 || ' days')::interval)`;
  const totalBorrowsParams = bId ? [bId, intervalDays] : [intervalDays];
  const totalBorrowsRes = await pool.query(totalBorrowsQuery, totalBorrowsParams);
  const totalBorrows = totalBorrowsRes.rows[0]?.count || 0;

  // 4. Overdue books count
  const overdueQuery = bId
    ? "SELECT COUNT(*)::int AS count FROM public.borrow_book WHERE status = 'borrowed' AND due_date < CURRENT_DATE AND branch_id = $1"
    : "SELECT COUNT(*)::int AS count FROM public.borrow_book WHERE status = 'borrowed' AND due_date < CURRENT_DATE";
  const overdueParams = bId ? [bId] : [];
  const overdueRes = await pool.query(overdueQuery, overdueParams);
  const overdueBooksCount = overdueRes.rows[0]?.count || 0;

  // 5. Total late fees
  const lateFeesQuery = bId
    ? `SELECT COALESCE(SUM(p.penalty_amount), 0)::float AS total FROM public.book_penalty p JOIN public.borrow_book b ON p.borrow_id = b.borrow_id WHERE b.branch_id = $1`
    : `SELECT COALESCE(SUM(penalty_amount), 0)::float AS total FROM public.book_penalty`;
  const lateFeesParams = bId ? [bId] : [];
  const lateFeesRes = await pool.query(lateFeesQuery, lateFeesParams);
  const totalLateFees = lateFeesRes.rows[0]?.total || 0;

  return {
    totalUsers,
    usersGrowthPct: 8.5,
    activeBorrows,
    totalBorrows,
    overdueBooksCount,
    totalLateFees,
  };
};

/**
 * Fetch Top 10 Book Categories ranked by borrow turns strictly within timeframe
 */
export const getTopCategoriesModel = async ({ timeframe = 'week', branchId = 'all' }) => {
  const isAllBranch = branchId === 'all' || !branchId;
  const bId = isAllBranch ? null : parseInt(branchId, 10);
  const intervalDays = timeframe === 'month' ? 30 : 7;

  const query = `
    SELECT 
      TRIM(category_name) AS category_name,
      COUNT(*)::int AS borrow_turns
    FROM public.borrow_book bb
    JOIN public.books b ON bb.book_id = b.book_id,
    UNNEST(b.genres) AS category_name
    WHERE ($1::int IS NULL OR bb.branch_id = $1::int)
      AND COALESCE(bb.borrow_date, bb.reserve_date) >= (CURRENT_DATE - ($2 || ' days')::interval)
    GROUP BY TRIM(category_name)
    ORDER BY borrow_turns DESC
    LIMIT 10
  `;

  const result = await pool.query(query, [bId, intervalDays]);
  const totalTurns = result.rows.reduce((sum, row) => sum + row.borrow_turns, 0);

  return result.rows.map((row, index) => ({
    rank: index + 1,
    categoryId: `cat-${index + 1}`,
    categoryName: row.category_name || 'General',
    borrowTurns: row.borrow_turns,
    percentageShare: totalTurns > 0 ? parseFloat(((row.borrow_turns / totalTurns) * 100).toFixed(1)) : 0,
  }));
};

/**
 * Fetch Top Borrowed Books strictly within timeframe
 */
export const getTopBorrowedBooksModel = async ({ timeframe = 'week', branchId = 'all' }) => {
  const isAllBranch = branchId === 'all' || !branchId;
  const bId = isAllBranch ? null : parseInt(branchId, 10);
  const intervalDays = timeframe === 'month' ? 30 : 7;

  const query = `
    SELECT 
      b.book_id,
      b.title,
      b.image_url,
      COUNT(bb.borrow_id)::int AS borrow_count
    FROM public.borrow_book bb
    JOIN public.books b ON bb.book_id = b.book_id
    WHERE ($1::int IS NULL OR bb.branch_id = $1::int)
      AND COALESCE(bb.borrow_date, bb.reserve_date) >= (CURRENT_DATE - ($2 || ' days')::interval)
    GROUP BY b.book_id, b.title, b.image_url
    ORDER BY borrow_count DESC
    LIMIT 10
  `;

  const result = await pool.query(query, [bId, intervalDays]);
  const maxBorrow = result.rows[0]?.borrow_count || 1;

  return result.rows.map((row, index) => ({
    rank: index + 1,
    bookId: row.book_id,
    title: row.title,
    coverUrl: row.image_url || '/images/book-cover-placeholder.png',
    borrowCount: row.borrow_count,
    popularityPct: Math.min(100, Math.round((row.borrow_count / maxBorrow) * 100)),
  }));
};

/**
 * Fetch Top Reserved Study Rooms strictly within timeframe
 */
export const getTopReservedRoomsModel = async ({ timeframe = 'week', branchId = 'all' }) => {
  const isAllBranch = branchId === 'all' || !branchId;
  const bId = isAllBranch ? null : parseInt(branchId, 10);
  const intervalDays = timeframe === 'month' ? 30 : 7;

  const query = `
    SELECT 
      sr.room_id,
      sr.room_name,
      br.branch_id,
      br.name AS branch_name,
      COUNT(rr.reserve_id)::int AS reservation_turns
    FROM public.reserve_room rr
    JOIN public.room_avail ra ON rr.avail_id = ra.avail_id
    JOIN public.study_room sr ON ra.room_id = sr.room_id
    JOIN public.branches br ON sr.branch_id = br.branch_id
    WHERE ($1::int IS NULL OR sr.branch_id = $1::int)
      AND rr.start_date >= (CURRENT_DATE - ($2 || ' days')::interval)
    GROUP BY sr.room_id, sr.room_name, br.branch_id, br.name
    ORDER BY reservation_turns DESC
    LIMIT 10
  `;

  const result = await pool.query(query, [bId, intervalDays]);

  return result.rows.map((row) => ({
    roomId: String(row.room_id),
    roomName: row.room_name,
    branchId: String(row.branch_id),
    branchName: row.branch_name,
    reservationTurns: row.reservation_turns,
  }));
};

/**
 * Fetch Study Group Room Reservations Pie Chart data per branch strictly within timeframe
 */
export const getStudyGroupRoomReservationsByBranchModel = async ({ timeframe = 'week' }) => {
  const intervalDays = timeframe === 'month' ? 30 : 7;
  const branches = await getBranchesModel();
  const colors = ['#F59E0B', '#0D9488', '#6366F1', '#EC4899', '#10B981', '#64748B'];

  const results = [];

  for (const branch of branches) {
    const query = `
      SELECT 
        sg.group_id,
        sg.title AS group_title,
        sg.subject,
        COUNT(rr.reserve_id)::int AS reservation_count,
        COALESCE(SUM(EXTRACT(EPOCH FROM (ra.end_time - ra.start_time)) / 3600), 0)::float AS total_hours
      FROM public.study_group sg
      JOIN public.reserve_room rr ON sg.reserve_id = rr.reserve_id
      JOIN public.room_avail ra ON rr.avail_id = ra.avail_id
      JOIN public.study_room sr ON ra.room_id = sr.room_id
      WHERE sr.branch_id = $1
        AND rr.start_date >= (CURRENT_DATE - ($2 || ' days')::interval)
      GROUP BY sg.group_id, sg.title, sg.subject
      ORDER BY total_hours DESC, reservation_count DESC
    `;

    const res = await pool.query(query, [branch.branch_id, intervalDays]);
    const rows = res.rows;
    const grandTotalHours = rows.reduce((sum, r) => sum + (parseFloat(r.total_hours) || 0), 0);

    const top5 = rows.slice(0, 5);
    const remaining = rows.slice(5);

    const slices = top5.map((r, idx) => {
      const hours = parseFloat(r.total_hours) || 0;
      const pct = grandTotalHours > 0 ? parseFloat(((hours / grandTotalHours) * 100).toFixed(1)) : 0;
      return {
        id: `sg-${idx + 1}`,
        title: r.group_title || r.subject || `Group #${idx + 1}`,
        subject: r.subject || '',
        reservationCount: parseInt(r.reservation_count, 10) || 0,
        totalHours: hours,
        percentage: pct,
        color: colors[idx % colors.length],
      };
    });

    if (remaining.length > 0) {
      const otherHours = remaining.reduce((sum, r) => sum + (parseFloat(r.total_hours) || 0), 0);
      const otherCount = remaining.reduce((sum, r) => sum + (parseInt(r.reservation_count, 10) || 0), 0);
      const otherPct = grandTotalHours > 0 ? parseFloat(((otherHours / grandTotalHours) * 100).toFixed(1)) : 0;
      slices.push({
        id: 'sg-other',
        title: 'Other',
        subject: 'Other',
        reservationCount: otherCount,
        totalHours: parseFloat(otherHours.toFixed(1)),
        percentage: otherPct,
        color: colors[5],
      });
    }

    results.push({
      branchId: branch.branch_id,
      branchName: branch.name,
      branchShort: branch.name_short,
      totalHours: parseFloat(grandTotalHours.toFixed(1)),
      slices,
    });
  }

  return results;
};
