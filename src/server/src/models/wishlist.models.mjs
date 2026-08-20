import pool from '../config/postgres.mjs';

/**
 * Adds a book to a user's wishlist in PostgreSQL.
 * @param {string} userId - UUID of the user
 * @param {string} bookId - ID of the book
 * @returns {Promise<object>} The created wishlist entry or existing entry
 */
export const addWishlist = async (userId, bookId) => {
  const sql = `
    INSERT INTO public.user_wishlist (wish_id, user_id, book_id, added_at)
    VALUES (gen_random_uuid(), $1, $2, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, book_id) DO UPDATE 
    SET added_at = CURRENT_TIMESTAMP
    RETURNING wish_id AS "wishId", user_id AS "userId", book_id AS "bookId", added_at AS "addedAt"
  `;
  const result = await pool.query(sql, [userId, bookId]);
  return result.rows[0];
};

/**
 * Removes a book from a user's wishlist in PostgreSQL.
 * @param {string} userId - UUID of the user
 * @param {string} bookId - ID of the book
 * @returns {Promise<boolean>} True if deleted, false otherwise
 */
export const removeWishlist = async (userId, bookId) => {
  const sql = `
    DELETE FROM public.user_wishlist
    WHERE user_id = $1 AND book_id = $2
    RETURNING wish_id
  `;
  const result = await pool.query(sql, [userId, bookId]);
  return result.rowCount > 0;
};

/**
 * Retrieves a user's wishlist books from PostgreSQL.
 * @param {string} userId - UUID of the user
 * @returns {Promise<Array>} List of wishlisted book objects
 */
export const getWishlistByUserId = async (userId) => {
  const sql = `
    SELECT 
      w.book_id AS id, 
      b.title, 
      b.author, 
      b.image_url AS "coverImage"
    FROM public.user_wishlist w
    JOIN public.books b ON w.book_id = b.book_id
    WHERE w.user_id = $1
    ORDER BY w.added_at DESC
  `;
  const result = await pool.query(sql, [userId]);
  
  return result.rows.map(book => ({
    id: book.id,
    title: book.title,
    author: book.author ? book.author.join(', ') : 'Unknown Author',
    coverImage: book.coverImage || null
  }));
};

/**
 * Checks if a book is wishlisted by a user.
 * @param {string} userId - UUID of the user
 * @param {string} bookId - ID of the book
 * @returns {Promise<boolean>} True if wishlisted, false otherwise
 */
export const checkWishlistStatus = async (userId, bookId) => {
  const sql = `
    SELECT 1 
    FROM public.user_wishlist 
    WHERE user_id = $1 AND book_id = $2
    LIMIT 1
  `;
  const result = await pool.query(sql, [userId, bookId]);
  return result.rows.length > 0;
};
