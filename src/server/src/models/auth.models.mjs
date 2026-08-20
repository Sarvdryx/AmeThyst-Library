import pool from '../config/postgres.mjs';

// ─── users ────────────────────────────────────────────────────────────────────

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

// ─── pending_users ────────────────────────────────────────────────────────────

export const getPendingByToken = async (token) => {
  const result = await pool.query(
    'SELECT * FROM pending_users WHERE token = $1',
    [token]
  );
  return result.rows[0] || null;
};

export const getPendingByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM pending_users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

export const deletePendingByToken = async (token, client = pool) => {
  await client.query('DELETE FROM pending_users WHERE token = $1', [token]);
};

export const deletePendingByEmail = async (email) => {
  await pool.query('DELETE FROM pending_users WHERE email = $1', [email]);
};

export const insertUserFromPending = async ({ email, passwordHash, username }, client = pool) => {
  const result = await client.query(
    `INSERT INTO users (email, password_hash, username, phone_number, avatar, role)
     VALUES ($1, $2, $3, NULL, NULL, 'user')
     RETURNING user_id, email, username, phone_number, avatar, role`,
    [email, passwordHash, username]
  );
  return result.rows[0];
};

// ─── otp_store ────────────────────────────────────────────────────────────────

// UPSERT: nếu email đã có row thì ghi đè (user gửi lại OTP)
export const saveOtpDB = async (email, otpHash, expiredAt) => {
  await pool.query(
    `INSERT INTO otp_store (email, otp_hash, expired_at, verified, attempt_count)
     VALUES ($1, $2, $3, false, 0)
     ON CONFLICT (email) DO UPDATE
       SET otp_hash   = EXCLUDED.otp_hash,
           expired_at = EXCLUDED.expired_at,
           verified   = false,
           attempt_count = 0`,
    [email, otpHash, expiredAt]
  );
};

export const getOtpDB = async (email) => {
  const result = await pool.query(
    'SELECT * FROM otp_store WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

export const markVerifiedDB = async (email, newExpiredAt) => {
  await pool.query(
    `UPDATE otp_store
     SET verified = true, expired_at = $2
     WHERE email = $1`,
    [email, newExpiredAt]
  );
};

export const incrementOtpAttemptsDB = async (email) => {
  const result = await pool.query(
    `UPDATE public.otp_store
     SET attempt_count = attempt_count + 1
     WHERE email = $1
     RETURNING attempt_count`,
    [email],
  );
  return result.rows[0]?.attempt_count ?? null;
};

export const deleteOtpDB = async (email) => {
  await pool.query('DELETE FROM otp_store WHERE email = $1', [email]);
};

export const recordLoginFailure = async (userId, maxAttempts = 5, lockMinutes = 15) => {
  const result = await pool.query(
    `UPDATE public.users
     SET failed_login_attempts = failed_login_attempts + 1,
         locked_until = CASE
           WHEN failed_login_attempts + 1 >= $2 THEN CURRENT_TIMESTAMP + ($3 * INTERVAL '1 minute')
           ELSE locked_until
         END
     WHERE user_id = $1
     RETURNING failed_login_attempts, locked_until`,
    [userId, maxAttempts, lockMinutes],
  );
  return result.rows[0] || null;
};

export const recordLoginSuccess = (userId) => pool.query(
  `UPDATE public.users
   SET last_login_at = CURRENT_TIMESTAMP, failed_login_attempts = 0, locked_until = NULL
   WHERE user_id = $1`,
  [userId],
);
