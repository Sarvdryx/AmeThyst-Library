import pool from '../config/postgres.mjs';
import { cleanText, buildFilterSQL } from './search.services.mjs';
import { invalidateUserRecommendationCache, getUserRecommendations } from './recommendation.services.mjs';
import { generateQueryEmbedding } from './embedding.services.mjs';
import { systemConfigurationService } from './system-configuration.services.mjs';

/**
 * Lấy chi tiết một cuốn sách bằng ID
 */
export const getBookById = async (id, userId = null) => {
  const query = `
    SELECT 
      b.*, 
      EXTRACT(YEAR FROM b.publication_date)::INTEGER AS publication_year, 
      l.branch_id,
      l.shelf, 
      l.quantity, 
      l.available_quantity,
      br.name as branch_name,
      br.address as branch_address
    FROM public.books b
    LEFT JOIN public.library l ON b.book_id = l.book_id
    LEFT JOIN public.branches br ON l.branch_id = br.branch_id
    WHERE b.book_id = $1
    ORDER BY l.branch_id ASC
  `;
  const result = await pool.query(query, [id]);
  
  if (result.rows.length === 0) return null;
  
  const book = result.rows[0];
  
  // Lấy danh sách các chi nhánh
  const inventory = result.rows
    .filter(row => row.branch_name)
    .map(row => ({
      branchId: row.branch_id,
      location: row.branch_name,
      address: row.branch_address,
      shelf: row.shelf || 'N/A',
      availableCopies: row.available_quantity !== undefined ? row.available_quantity : 0
    }));

  // Check for user's active reservation
  let userReservation = null;
  if (userId) {
    const reservationQuery = `
      SELECT bb.*, br.name as branch_name 
      FROM public.borrow_book bb
      JOIN public.branches br ON bb.branch_id = br.branch_id
      WHERE bb.user_id = $1 AND bb.book_id = $2 AND bb.status IN ('reserved', 'pending', 'borrowed')
      ORDER BY bb.reserve_date DESC LIMIT 1
    `;
    const reservationResult = await pool.query(reservationQuery, [userId, id]);
    if (reservationResult.rows.length > 0) {
      const res = reservationResult.rows[0];
      userReservation = {
        reservationId: res.borrow_id,
        branchId: res.branch_id,
        branchName: res.branch_name,
        reserveDate: res.reserve_date,
        expiresAt: res.expired_at,
        status: res.status
      };
    }
  }

  return {
    id: book.book_id,
    book_id: book.book_id,
    title: cleanText(book.title),
    original_title: cleanText(book.original_title) || '',
    author: book.author ? (Array.isArray(book.author) ? book.author.map(cleanText).join(', ') : cleanText(book.author)) : 'Unknown Author',
    description: cleanText(book.description) || '',
    isbn: book.isbn || '',
    language_code: book.language_code || 'eng',
    language: book.language_code ? book.language_code.toUpperCase() : 'ENG',
    book_format: book.book_format || 'Paperback',
    publisher: cleanText(book.publisher) || 'N/A',
    publication_date: book.publication_date ? new Date(book.publication_date).toISOString().split('T')[0] : '',
    publicationYear: book.publication_year || 'N/A',
    num_pages: book.num_pages !== undefined && book.num_pages !== null ? book.num_pages : null,
    numPages: book.num_pages || 'N/A',
    price: book.price !== undefined && book.price !== null ? book.price : null,
    rating: book.rating ? `${book.rating} / 5` : 'N/A',
    genres: book.genres || [],
    coverImage: book.image_url || null,
    image_url: book.image_url || null,
    inventory: inventory,
    branch_stocks: result.rows
      .filter(row => row.branch_id)
      .map(row => ({
        branch_id: row.branch_id,
        branch_name: row.branch_name,
        name_short: row.name_short || `CS${row.branch_id}`,
        quantity: row.quantity !== undefined ? row.quantity : 0,
        available_quantity: row.available_quantity !== undefined ? row.available_quantity : 0,
        shelf: row.shelf || 'N/A'
      })),
    userReservation: userReservation
  };
};

/**
 * Lấy danh sách sách có phân trang
 */
export const getBooksList = async (page = 1, limit = 24, filters = {}) => {
  const offset = (page - 1) * limit;
  const { genres = [], branches = [], availableOnly = false, startYear = null, endYear = null } = filters;

  // 1. Pack unified configurations directly into the helper call starting at index 1
  const searchFilters = {
    genres,
    branches,
    availableOnly,
    publicationDate: { start: startYear, end: endYear }
  };

  let { sql: filterSql, params: queryParams, nextIdx: paramIndex } = buildFilterSQL(searchFilters, 1);

  // 2. Strip leading ' AND ' to construct pristine SQL conditional blocks
  let finalWhereString = '';
  if (filterSql) {
    finalWhereString = `WHERE ${filterSql.replace(/^\s*AND\s*/i, '')}`;
  }

  const limitParam = `$${paramIndex++}`;
  const offsetParam = `$${paramIndex++}`;
  
  const countQuery = `
    SELECT COUNT(DISTINCT b.book_id) 
    FROM public.books b
    LEFT JOIN public.library l ON b.book_id = l.book_id
    ${finalWhereString}
  `;

  const booksQuery = `
    SELECT DISTINCT b.book_id, b.title, b.original_title, b.description, b.num_pages, b.publisher, b.publication_date, b.isbn, b.author, b.language_code, b.book_format, b.genres, b.image_url, b.price
    FROM public.books b
    LEFT JOIN public.library l ON b.book_id = l.book_id
    ${finalWhereString}
    ORDER BY b.title ASC
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `;

  // 4. Execute Queries concurrently (including public.library branch stocks)
  const stocksQuery = `
    SELECT l.book_id, l.branch_id, l.quantity, l.available_quantity, l.shelf, br.name as branch_name, br.name_short
    FROM public.library l
    JOIN public.branches br ON l.branch_id = br.branch_id
    ORDER BY l.branch_id ASC
  `;

  const [countRes, booksRes, stocksRes] = await Promise.all([
    pool.query(countQuery, queryParams),
    pool.query(booksQuery, [...queryParams, limit, offset]),
    pool.query(stocksQuery)
  ]);

  const stocksByBook = {};
  (stocksRes.rows || []).forEach((s) => {
    const key = String(s.book_id || '').trim();
    if (!key) return;
    if (!stocksByBook[key]) stocksByBook[key] = [];
    stocksByBook[key].push({
      branch_id: parseInt(s.branch_id, 10),
      branch_name: s.branch_name || '',
      name_short: s.name_short || `CS${s.branch_id}`,
      quantity: parseInt(s.quantity, 10) || 0,
      available_quantity: s.available_quantity !== undefined && s.available_quantity !== null
        ? parseInt(s.available_quantity, 10)
        : (parseInt(s.quantity, 10) || 0),
      shelf: s.shelf || 'N/A'
    });
  });

  const totalBooks = parseInt(countRes.rows[0].count);

  return {
    books: booksRes.rows.map(book => {
      const key = String(book.book_id || '').trim();
      const stocks = stocksByBook[key] || [];
      return {
        id: book.book_id,
        book_id: book.book_id,
        title: cleanText(book.title),
        original_title: cleanText(book.original_title) || '',
        description: cleanText(book.description) || '',
        num_pages: book.num_pages !== undefined && book.num_pages !== null ? book.num_pages : null,
        price: book.price !== undefined && book.price !== null ? book.price : null,
        publication_date: book.publication_date ? new Date(book.publication_date).toISOString().split('T')[0] : '',
        language_code: book.language_code || 'eng',
        book_format: book.book_format || 'Paperback',
        author: book.author ? (Array.isArray(book.author) ? book.author.map(cleanText).join(', ') : cleanText(book.author)) : 'Unknown Author',
        isbn: book.isbn,
        publisher: cleanText(book.publisher) || 'N/A',
        genres: book.genres || [],
        coverImage: book.image_url || null,
        image_url: book.image_url || null,
        branch_stocks: stocks,
        inventory: stocks
      };
    }),
    totalBooks,
    totalPages: Math.ceil(totalBooks / limit),
    currentPage: page
  };
};
/**
 * Lấy gợi ý sách ngẫu nhiên từ database để tạo tính năng khám phá sách
 */
export const getRecommendations = async (id, limit = 20) => {
  const recQuery = `
    SELECT book_id, title, author, isbn, image_url
    FROM public.books 
    WHERE book_id != $1
    ORDER BY RANDOM()
    LIMIT $2
  `;
  const recRes = await pool.query(recQuery, [id, limit]);
  
  return recRes.rows.map(book => ({
    id: book.book_id,
    title: cleanText(book.title),
    author: book.author ? book.author.map(cleanText).join(', ') : 'Unknown Author',
    coverImage: book.image_url || null
  }));
};

/**
 * Lấy sách cùng chủ đề (genres)
 */
export const getRelatedBooks = async (id) => {
  // 1. Fetch current book's genres
  const bookQuery = 'SELECT genres FROM public.books WHERE book_id = $1';
  const bookRes = await pool.query(bookQuery, [id]);
  
  if (bookRes.rows.length === 0 || !bookRes.rows[0].genres || bookRes.rows[0].genres.length === 0) {
    // Fallback: If no genres found, return random books
    return getRecommendations(id, 20);
  }
  
  const genres = bookRes.rows[0].genres;
  
  // 2. Query books in the same genres (ordered by RANDOM)
  const recQuery = `
    SELECT book_id, title, author, isbn, image_url
    FROM public.books 
    WHERE book_id != $1 AND genres && $2
    ORDER BY RANDOM()
    LIMIT 20
  `;
  const recRes = await pool.query(recQuery, [id, genres]);
  
  // Fallback: If no related books found in same genres, return random books
  if (recRes.rows.length === 0) {
    return getRecommendations(id, 20);
  }
  
  return recRes.rows.map(book => ({
    id: book.book_id,
    title: cleanText(book.title),
    author: book.author ? book.author.map(cleanText).join(', ') : 'Unknown Author',
    coverImage: book.image_url || null
  }));
};
export const createReservation = async (userId, bookId, branchId) => {
  const { MAX_BORROW_LIMIT: borrowLimit } = systemConfigurationService.getSnapshot();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userCheck = await client.query(
      'SELECT user_id, borrow_num FROM public.users WHERE user_id = $1 FOR UPDATE',
      [userId],
    );
    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return { 
        error: { code: 'USER_NOT_FOUND', message: 'User account not found. Please re-login.' },
        statusCode: 404
      };
    }

    const debtCheck = await client.query(
      'SELECT COUNT(*) as unpaid FROM public.book_penalty WHERE user_id = $1 AND is_paid = false',
      [userId]
    );
    if (parseInt(debtCheck.rows[0].unpaid) > 0) {
      await client.query('ROLLBACK');
      return {
        error: { code: 'UNPAID_DEBT', message: 'You have unpaid debts. Please clear all outstanding penalties before reserving a new book.' },
        statusCode: 400
      };
    }

    const currentBorrowNum = userCheck.rows[0].borrow_num || 0;

    if (currentBorrowNum >= borrowLimit) {
      await client.query('ROLLBACK');
      return { 
        error: { code: 'BORROW_LIMIT_EXCEEDED', message: `You have reached the maximum borrow limit of ${borrowLimit} books` },
        statusCode: 400
      };
    }

    const inventoryQuery = `
      SELECT available_quantity, shelf 
      FROM public.library 
      WHERE book_id = $1 AND branch_id = $2 
      FOR UPDATE
    `;
    const inventoryResult = await client.query(inventoryQuery, [bookId, branchId]);
    
    if (inventoryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { 
        error: { code: 'BOOK_NOT_FOUND', message: 'Book not found at the selected branch' },
        statusCode: 404
      };
    }

    const { available_quantity } = inventoryResult.rows[0];

    if (available_quantity <= 0) {
      await client.query('ROLLBACK');
      return { 
        error: { code: 'BOOK_UNAVAILABLE', message: 'No available copies at the selected branch' },
        statusCode: 400
      };
    }

    const duplicateQuery = `
      SELECT bb.borrow_id FROM public.borrow_book bb
      WHERE bb.user_id = $1 AND bb.book_id = $2 AND bb.status IN ('reserved', 'pending', 'borrowed')
        AND NOT EXISTS (SELECT 1 FROM public.return_book rb WHERE rb.borrow_id = bb.borrow_id)
        AND NOT EXISTS (SELECT 1 FROM public.book_penalty bp WHERE bp.borrow_id = bb.borrow_id)
    `;
    const duplicateResult = await client.query(duplicateQuery, [userId, bookId]);
    
    if (duplicateResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return { 
        error: { code: 'ALREADY_RESERVED', message: 'You already have an active reservation or borrow for this book' },
        statusCode: 400
      };
    }

    await client.query(
      'UPDATE public.library SET available_quantity = available_quantity - 1 WHERE book_id = $1 AND branch_id = $2',
      [bookId, branchId]
    );

    const insertQuery = `
      INSERT INTO public.borrow_book (user_id, book_id, branch_id, status)
      VALUES ($1, $2, $3, 'reserved')
      RETURNING borrow_id, reserve_date
    `;
    const insertResult = await client.query(insertQuery, [userId, bookId, branchId]);
    const { borrow_id, reserve_date } = insertResult.rows[0];

    await client.query(
      'UPDATE public.users SET borrow_num = borrow_num + 1 WHERE user_id = $1',
      [userId]
    );

    const branchQuery = 'SELECT name, address FROM public.branches WHERE branch_id = $1';
    const branchResult = await client.query(branchQuery, [branchId]);
    const { name: branchName, address: branchAddress } = branchResult.rows[0];

    const shelf = inventoryResult.rows[0].shelf || 'N/A';

    await client.query('COMMIT');

    // Invalidate recommendation cache and precompute new recommendations
    invalidateUserRecommendationCache(userId);
    if (process.env.NODE_ENV !== 'test') {
      getUserRecommendations(userId).catch(err =>
        console.error(`[Precompute] Failed to precompute after reservation for user ${userId}:`, err)
      );
    }

    return {
      reservation: {
        reservationId: borrow_id,
        bookId,
        branchId,
        branchName,
        branchAddress,
        shelf,
        reserveDate: reserve_date,
        status: 'reserved'
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const cleanupExpiredPins = async () => {
  try {
    const query = `
      UPDATE public.borrow_book
      SET pin = NULL, expired_at = NULL,
          status = CASE
            WHEN status = 'pending' THEN 'reserved'
            WHEN status = 'pending_return' THEN 'borrowed'
            ELSE status
          END
      WHERE status IN ('pending', 'pending_return') AND expired_at IS NOT NULL AND expired_at <= NOW()
    `;
    const result = await pool.query(query);

    const roomQuery = `
      UPDATE public.reserve_room
      SET pin = NULL, expired_at = NULL, status = 'reserved'
      WHERE status = 'pending' AND expired_at IS NOT NULL AND expired_at <= NOW()
      RETURNING avail_id
    `;
    const roomResult = await pool.query(roomQuery);

    const branchIds = [];
    if (roomResult.rows.length > 0) {
      const availIds = roomResult.rows.map((r) => r.avail_id);
      const branchResult = await pool.query(
        `SELECT DISTINCT sr.branch_id AS "branchId"
         FROM room_avail ra
         JOIN study_room sr ON ra.room_id = sr.room_id
         WHERE ra.avail_id = ANY($1::int[])`,
        [availIds]
      );
      branchIds.push(...branchResult.rows.map((r) => r.branchId));
    }

    return { count: result.rowCount + roomResult.rowCount, branchIds };
  } catch (error) {
    console.error('Error cleaning up expired PINs:', error);
    return { count: 0, branchIds: [] };
  }
};

/**
 * Clear all pending PINs on server startup
 */
export const clearAllPins = async () => {
  try {
    const query = `
      UPDATE public.borrow_book
      SET pin = NULL, expired_at = NULL,
          status = CASE
            WHEN status = 'pending' THEN 'reserved'
            WHEN status = 'pending_return' THEN 'borrowed'
            ELSE status
          END
      WHERE status IN ('pending', 'pending_return')
    `;
    const result = await pool.query(query);

    const roomQuery = `
      UPDATE public.reserve_room
      SET pin = NULL, expired_at = NULL, status = 'reserved'
      WHERE status = 'pending'
    `;
    const roomResult = await pool.query(roomQuery);

    return result.rowCount + roomResult.rowCount;
  } catch (error) {
    console.error('Error clearing all pending PINs:', error);
    return 0;
  }
};

/**
 * Automatically cancel reservations that have been in 'reserved' status
 * for more than 7 days (reserve_date + 7 days < NOW()).
 * Deletes the borrow_book record, restores available_quantity, and decrements borrow_num.
 */
export const cleanupExpiredReservations = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const expiredQuery = `
      SELECT borrow_id, book_id, branch_id, user_id
      FROM public.borrow_book
      WHERE status = 'reserved' AND reserve_date + INTERVAL '7 days' < NOW()
      FOR UPDATE
    `;
    const expired = await client.query(expiredQuery);

    if (expired.rows.length === 0) {
      await client.query('COMMIT');
      return 0;
    }

    const ids = expired.rows.map(r => r.borrow_id);
    await client.query(
      'DELETE FROM public.borrow_book WHERE borrow_id = ANY($1)',
      [ids]
    );

    const perBranch = {};
    const perUser = {};
    for (const row of expired.rows) {
      const key = `${row.book_id}:${row.branch_id}`;
      perBranch[key] = perBranch[key] || { book_id: row.book_id, branch_id: row.branch_id, count: 0 };
      perBranch[key].count++;
      perUser[row.user_id] = (perUser[row.user_id] || 0) + 1;
    }

    for (const b of Object.values(perBranch)) {
      await client.query(
        'UPDATE public.library SET available_quantity = available_quantity + $1 WHERE book_id = $2 AND branch_id = $3',
        [b.count, b.book_id, b.branch_id]
      );
    }

    for (const [userId, count] of Object.entries(perUser)) {
      await client.query(
        'UPDATE public.users SET borrow_num = GREATEST(borrow_num - $1, 0) WHERE user_id = $2',
        [count, userId]
      );
    }

    await client.query('COMMIT');
    return expired.rows.length;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cleaning up expired reservations:', error);
    return 0;
  } finally {
    client.release();
  }
};

/**
 * Generate a unique book_id consisting of '9999' + 6 random digits (e.g. '9999123456')
 * Checks public.books to ensure uniqueness before assignment.
 */
export const generateUniqueBookId = async (clientOrPool = pool) => {
  let isUnique = false;
  let newId = '';

  while (!isUnique) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    newId = `9999${randomDigits}`;

    const checkRes = await clientOrPool.query(
      'SELECT 1 FROM public.books WHERE book_id = $1',
      [newId]
    );
    if (checkRes.rows.length === 0) {
      isUnique = true;
    }
  }

  return newId;
};

/**
 * Helper to trigger embedding vector calculation and populate public.books.embedding
 */
export const triggerEmbeddingUpdate = async (bookId, title, author, description, genres) => {
  try {
    const textToEmbed = `${title || ''} ${Array.isArray(author) ? author.join(' ') : author || ''} ${description || ''} ${Array.isArray(genres) ? genres.join(' ') : genres || ''}`;
    const vectorArray = await generateQueryEmbedding(textToEmbed);
    if (vectorArray && Array.isArray(vectorArray)) {
      const vectorStr = `[${vectorArray.join(',')}]`;
      await pool.query(
        'UPDATE public.books SET embedding = $1 WHERE book_id = $2',
        [vectorStr, bookId]
      );
      console.log(`[Embedding Phase Triggered] Initialized vector embedding for book_id (${bookId}).`);
    }
  } catch (err) {
    console.error(`[Embedding Error] Failed to update embedding for book ${bookId}:`, err.message || err);
  }
};

/**
 * Create a new catalog book with unique '9999' + 6-digit book_id and vector embedding initialization
 */
export const createBookService = async (bookData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Generate unique 10-char book_id ('9999' + 6 digits)
    const bookId = await generateUniqueBookId(client);

    const title = bookData.title ? bookData.title.trim() : 'Untitled';
    const original_title = bookData.original_title || null;
    const description = bookData.description || null;
    const num_pages = bookData.num_pages || null;
    const publisher = bookData.publisher || null;
    const publication_date = bookData.publication_date || null;
    const isbn = bookData.isbn ? bookData.isbn.trim() : `ISBN-${Date.now()}`;
    const author = Array.isArray(bookData.author) ? bookData.author : (bookData.author ? [bookData.author] : []);
    const language_code = bookData.language_code || 'eng';
    const book_format = bookData.book_format || 'Paperback';
    const genres = Array.isArray(bookData.genres) ? bookData.genres : (bookData.genres ? [bookData.genres] : []);
    const image_url = bookData.image_url || null;
    const price = bookData.price || 0;

    if (isbn) {
      const existingRes = await client.query('SELECT book_id, title FROM public.books WHERE isbn = $1', [isbn]);
      if (existingRes.rows.length > 0) {
        const dupErr = new Error(`A book with ISBN '${isbn}' already exists in the catalog ("${existingRes.rows[0].title}").`);
        dupErr.statusCode = 400;
        dupErr.code = 'DUPLICATE_BOOK';
        throw dupErr;
      }
    }

    // 2. Insert into public.books
    const insertBookQuery = `
      INSERT INTO public.books (
        book_id, title, original_title, description, num_pages, publisher, publication_date,
        isbn, author, language_code, book_format, genres, image_url, price
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const bookRes = await client.query(insertBookQuery, [
      bookId, title, original_title, description, num_pages, publisher, publication_date,
      isbn, author, language_code, book_format, genres, image_url, price
    ]);

    // 3. Insert per-branch physical stocks into public.library
    const branch_stocks = Array.isArray(bookData.branch_stocks) ? bookData.branch_stocks : [];
    for (const stock of branch_stocks) {
      const branchId = parseInt(stock.branch_id, 10);
      if (!branchId) continue;
      const qty = Math.max(0, parseInt(stock.quantity || 0, 10));
      const avail = Math.min(qty, Math.max(0, parseInt(stock.available_quantity !== undefined ? stock.available_quantity : qty, 10)));
      const shelf = stock.shelf || `CS${branchId}.${title.charAt(0).toUpperCase()}101`;

      await client.query(`
        INSERT INTO public.library (book_id, branch_id, quantity, available_quantity, shelf)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (book_id, branch_id)
        DO UPDATE SET quantity = $3, available_quantity = $4, shelf = $5
      `, [bookId, branchId, qty, avail, shelf]);
    }

    await client.query('COMMIT');

    const createdBook = bookRes.rows[0];

    // 4. Trigger Vector Embedding initialization asynchronously
    triggerEmbeddingUpdate(bookId, title, author, description, genres);

    return createdBook;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating book in database:', error);
    if (error.code === '23505') {
      const dupErr = new Error(`A book with this ISBN (${bookData.isbn || 'unknown'}) already exists in the catalog.`);
      dupErr.statusCode = 400;
      dupErr.code = 'DUPLICATE_BOOK';
      throw dupErr;
    }
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update existing catalog book metadata and trigger embedding recalculation
 */
export const updateBookService = async (bookId, bookData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const title = bookData.title ? bookData.title.trim() : 'Untitled';
    const original_title = bookData.original_title || null;
    const description = bookData.description || null;
    const num_pages = bookData.num_pages || null;
    const publisher = bookData.publisher || null;
    const publication_date = bookData.publication_date || null;
    const isbn = bookData.isbn ? bookData.isbn.trim() : null;
    const author = Array.isArray(bookData.author) ? bookData.author : (bookData.author ? [bookData.author] : []);
    const language_code = bookData.language_code || 'eng';
    const book_format = bookData.book_format || 'Paperback';
    const genres = Array.isArray(bookData.genres) ? bookData.genres : (bookData.genres ? [bookData.genres] : []);
    const image_url = bookData.image_url || null;
    const price = bookData.price || 0;

    if (isbn) {
      const existingRes = await client.query('SELECT book_id, title FROM public.books WHERE isbn = $1 AND book_id != $2', [isbn, bookId]);
      if (existingRes.rows.length > 0) {
        const dupErr = new Error(`A book with ISBN '${isbn}' already exists in the catalog ("${existingRes.rows[0].title}").`);
        dupErr.statusCode = 400;
        dupErr.code = 'DUPLICATE_BOOK';
        throw dupErr;
      }
    }

    const updateBookQuery = `
      UPDATE public.books
      SET title = $1, original_title = $2, description = $3, num_pages = $4, publisher = $5,
          publication_date = $6, isbn = $7, author = $8, language_code = $9, book_format = $10,
          genres = $11, image_url = $12, price = $13
      WHERE book_id = $14
      RETURNING *
    `;

    const bookRes = await client.query(updateBookQuery, [
      title, original_title, description, num_pages, publisher, publication_date,
      isbn, author, language_code, book_format, genres, image_url, price, bookId
    ]);

    // Update branch stocks in public.library
    const branch_stocks = Array.isArray(bookData.branch_stocks) ? bookData.branch_stocks : [];
    for (const stock of branch_stocks) {
      const branchId = parseInt(stock.branch_id, 10);
      if (!branchId) continue;
      const qty = Math.max(0, parseInt(stock.quantity || 0, 10));
      const avail = Math.min(qty, Math.max(0, parseInt(stock.available_quantity !== undefined ? stock.available_quantity : qty, 10)));
      const shelf = stock.shelf || `CS${branchId}.${title.charAt(0).toUpperCase()}101`;

      await client.query(`
        INSERT INTO public.library (book_id, branch_id, quantity, available_quantity, shelf)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (book_id, branch_id)
        DO UPDATE SET quantity = $3, available_quantity = $4, shelf = $5
      `, [bookId, branchId, qty, avail, shelf]);
    }

    await client.query('COMMIT');

    const updatedBook = bookRes.rows[0];

    // Trigger vector embedding calculation
    triggerEmbeddingUpdate(bookId, title, author, description, genres);

    return updatedBook;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating book in database:', error);
    if (error.code === '23505') {
      const dupErr = new Error(`Cannot update book: A book with ISBN (${bookData.isbn || 'unknown'}) already exists in the catalog.`);
      dupErr.statusCode = 400;
      dupErr.code = 'DUPLICATE_BOOK';
      throw dupErr;
    }
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete a catalog book or branch stock
 */
export const deleteBookService = async (bookId, branchId = null) => {
  if (branchId) {
    await pool.query('DELETE FROM public.library WHERE book_id = $1 AND branch_id = $2', [bookId, branchId]);
    return { success: true, message: `Deleted stock for branch ${branchId}` };
  } else {
    await pool.query('DELETE FROM public.library WHERE book_id = $1', [bookId]);
    await pool.query('DELETE FROM public.books WHERE book_id = $1', [bookId]);
    return { success: true, message: `Deleted book ${bookId} from catalog` };
  }
};

/**
 * Get all library branches
 */
export const getAllBranchesService = async () => {
  const res = await pool.query('SELECT * FROM public.branches ORDER BY branch_id ASC');
  return res.rows;
};


