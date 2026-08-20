import bcrypt from 'bcryptjs';
import pool from '../config/postgres.mjs';
import {
  findUserByEmail,
  saveOtpDB,
  getOtpDB,
  markVerifiedDB,
  deleteOtpDB,
  incrementOtpAttemptsDB,
} from '../models/auth.models.mjs';
import { sendOTPEmail } from '../utils/mailer.mjs';
import {
  generateOtp,
  validateOtpRecord,
  validateVerifiedRecord,
  OTP_VERIFY_TTL,
  OTP_RESET_TTL,
  hashOtp,
} from '../utils/otpHelpers.mjs';
import { SALT_ROUNDS } from '../utils/authHelpers.mjs';
import { revokeUserSessions } from './auth-session.services.mjs';
import { disconnectUserSockets } from '../config/socket.mjs';


export const sendOtp = async (email) => {
  const otp = generateOtp();
  const expiredAt = new Date(Date.now() + OTP_VERIFY_TTL);

  await saveOtpDB(email, hashOtp(email, otp), expiredAt);
  try {
    await sendOTPEmail(email, otp);
  } catch (cause) {
    const error = new Error('Reset code email could not be delivered. Please try again later.');
    error.code = 'EMAIL_DELIVERY_FAILED';
    error.cause = cause;
    throw error;
  }
  return { message: 'OTP sent to your email' };
};

export const verifyOtp = async ({ email, otp }) => {
  const row = await getOtpDB(email);
  try {
    validateOtpRecord(row, email, otp);
  } catch (error) {
    if (row && error.message === 'Incorrect OTP') await incrementOtpAttemptsDB(email);
    throw error;
  }

  const newExpiredAt = new Date(Date.now() + OTP_RESET_TTL);
  await markVerifiedDB(email, newExpiredAt);
  return { message: 'OTP verified successfully' };
};

export const checkVerified = async (email) => {
  const row = await getOtpDB(email);
  validateVerifiedRecord(row);
};

export const clearOtp = async (email) => {
  await deleteOtpDB(email);
};

export const forgotPassword = async ({ email }) => {
  const user = await findUserByEmail(email);
  if (!user) return { message: 'If an account exists for this email, a reset code has been sent.' };
  await sendOtp(email);
  return { message: 'If an account exists for this email, a reset code has been sent.' };
};

export const resetPassword = async ({ email, newPassword }) => {
  await checkVerified(email);

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const result = await pool.query(
    `UPDATE users
     SET password_hash = $1, token_version = token_version + 1,
         failed_login_attempts = 0, locked_until = NULL
     WHERE email = $2 RETURNING user_id`,
    [passwordHash, email]
  );

  if (result.rows[0]) {
    const userId = result.rows[0].user_id;
    await revokeUserSessions(userId, 'password_reset');
    disconnectUserSockets(userId);
  }

  await clearOtp(email);
  return { message: 'Password reset successfully' };
};
