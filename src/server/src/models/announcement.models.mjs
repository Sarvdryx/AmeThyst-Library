import pool from '../config/postgres.mjs';

/**
 * Inserts a new announcement in draft or active status.
 * @param {Object} announcementDetails
 * @param {string} announcementDetails.title
 * @param {string} announcementDetails.content
 * @param {string|null} announcementDetails.expiredDate
 * @param {string} [announcementDetails.status]
 * @returns {Promise<Object>}
 */
export const insertAnnouncement = async ({ title, content, expiredDate, status = 'draft' }) => {
  const query = `
    INSERT INTO announcements (title, content, expired_date, status)
    VALUES ($1, $2, $3, $4)
    RETURNING 
      announce_id AS "announceId",
      created_at AS "createdAt",
      expired_date AS "expiredDate",
      title,
      content,
      status
  `;
  const result = await pool.query(query, [title, content, expiredDate, status]);
  return result.rows[0];
};

/**
 * Finds announcements for management with pagination and optional status filter.
 * @param {Object} params
 * @param {number} params.limit
 * @param {number} params.offset
 * @param {string} [params.status]
 * @returns {Promise<Array>}
 */
export const findAnnouncementsForManagement = async ({ limit, offset, status }) => {
  let query = `
    SELECT 
      announce_id AS "announceId",
      created_at AS "createdAt",
      expired_date AS "expiredDate",
      title,
      content,
      status
    FROM announcements
  `;
  const params = [];
  if (status) {
    query += ` WHERE status = $1`;
    params.push(status);
  }
  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Counts total announcements matching an optional status filter.
 * @param {Object} params
 * @param {string} [params.status]
 * @returns {Promise<number>}
 */
export const countAnnouncementsForManagement = async ({ status } = {}) => {
  let query = `SELECT COUNT(*)::int AS count FROM announcements`;
  const params = [];
  if (status) {
    query += ` WHERE status = $1`;
    params.push(status);
  }
  const result = await pool.query(query, params);
  return result.rows[0].count;
};

/**
 * Retrieves a single announcement by its ID.
 * @param {string} announceId
 * @returns {Promise<Object|null>}
 */
export const findAnnouncementById = async (announceId) => {
  const query = `
    SELECT 
      announce_id AS "announceId",
      created_at AS "createdAt",
      expired_date AS "expiredDate",
      title,
      content,
      status
    FROM announcements
    WHERE announce_id = $1
  `;
  const result = await pool.query(query, [announceId]);
  return result.rows[0] || null;
};

/**
 * Updates status field of an announcement.
 * @param {string} announceId
 * @param {string} status
 * @returns {Promise<Object|null>}
 */
export const updateAnnouncementStatus = async (announceId, status) => {
  const query = `
    UPDATE announcements
    SET status = $2
    WHERE announce_id = $1
    RETURNING 
      announce_id AS "announceId",
      created_at AS "createdAt",
      expired_date AS "expiredDate",
      title,
      content,
      status
  `;
  const result = await pool.query(query, [announceId, status]);
  return result.rows[0] || null;
};

/**
 * Updates title, content, and expired_date of an existing announcement.
 * @param {string} announceId
 * @param {Object} details
 * @param {string} details.title
 * @param {string} details.content
 * @param {string|null} details.expiredDate
 * @returns {Promise<Object|null>}
 */
export const updateAnnouncementDetails = async (announceId, { title, content, expiredDate }) => {
  const query = `
    UPDATE announcements
    SET title = $2, content = $3, expired_date = $4
    WHERE announce_id = $1
    RETURNING 
      announce_id AS "announceId",
      created_at AS "createdAt",
      expired_date AS "expiredDate",
      title,
      content,
      status
  `;
  const result = await pool.query(query, [announceId, title, content, expiredDate]);
  return result.rows[0] || null;
};

/**
 * Permanently deletes an announcement.
 * @param {string} announceId
 * @returns {Promise<Object|null>}
 */
export const deleteAnnouncementById = async (announceId) => {
  const query = `
    DELETE FROM announcements
    WHERE announce_id = $1
    RETURNING announce_id AS "announceId"
  `;
  const result = await pool.query(query, [announceId]);
  return result.rows[0] || null;
};

/**
 * Finds all active, non-expired announcements.
 * @returns {Promise<Array>}
 */
export const findActiveAnnouncements = async () => {
  const query = `
    SELECT 
      announce_id AS "announceId",
      created_at AS "createdAt",
      expired_date AS "expiredDate",
      title,
      content,
      status
    FROM announcements
    WHERE status = 'active' AND (expired_date IS NULL OR expired_date >= CURRENT_DATE)
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
};

/**
 * Automatically updates active announcements whose expiration date has passed to 'expired'.
 * @returns {Promise<Array>} List of updated announcement records.
 */
export const updateExpiredAnnouncements = async () => {
  const query = `
    UPDATE announcements
    SET status = 'expired'
    WHERE status = 'active' AND expired_date < CURRENT_DATE
    RETURNING announce_id AS "announceId"
  `;
  const result = await pool.query(query);
  return result.rows;
};
