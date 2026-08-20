import bcrypt from 'bcryptjs';
import {
  findUserByEmail,
  getPendingByToken,
  getPendingByEmail,
  deletePendingByToken,
  deletePendingByEmail,
  insertUserFromPending,
  recordLoginFailure,
  recordLoginSuccess,
} from '../models/auth.models.mjs';
import pool from '../config/postgres.mjs';
import { sendVerificationEmail } from '../utils/mailer.mjs';
import {
  buildUserPayload,
  withTransaction,
  replacePendingUser,
  SALT_ROUNDS,
} from '../utils/authHelpers.mjs';

const REGISTER_RESPONSE = 'If this email can be registered, a verification message will be sent.';
const RESEND_RESPONSE = 'If a pending registration exists, a verification message will be sent.';

const emailDeliveryError = (cause) => {
  const error = new Error('Verification email could not be delivered. Please try again later.', { cause });
  error.code = 'EMAIL_DELIVERY_FAILED';
  return error;
};

export const registerUser = async ({ email, password, username }) => {
  const existing = await findUserByEmail(email);
  if (existing?.status === 'suspended') {
    const error = new Error('Your account has been suspended.');
    error.code = 'USER_SUSPENDED';
    throw error;
  }
  if (existing) return { message: REGISTER_RESPONSE };

  const pendingRow = await getPendingByEmail(email);
  if (pendingRow) {
    if (new Date() >= new Date(pendingRow.expired_at)) {
      await deletePendingByEmail(email);
    } else {
      return { message: REGISTER_RESPONSE };
    }
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const token = await withTransaction((client) =>
    replacePendingUser(client, { email, passwordHash, username })
  );

  try {
    await sendVerificationEmail(email, token);
  } catch (err) {
    console.error('Email delivery failed for registration:', err);
    throw emailDeliveryError(err);
  }
  return { message: REGISTER_RESPONSE };
};

export const verifyEmail = async ({ token }) => {
  const row = await getPendingByToken(token);
  if (!row) throw new Error('Invalid or expired verification link.');

  if (new Date() >= new Date(row.expired_at)) {
    await deletePendingByToken(token);
    throw new Error('Verification link has expired. Please register again.');
  }

  const existing = await findUserByEmail(row.email);
  if (existing) {
    await deletePendingByToken(token);
    throw new Error('Email already exists.');
  }

  const user = await withTransaction(async (client) => {
    const userRow = await insertUserFromPending({
      email: row.email,
      passwordHash: row.password_hash,
      username: row.username,
    }, client);
    await deletePendingByToken(token, client);
    return userRow;
  });

  return { user: buildUserPayload(user), userRow: user };
};

export const resendVerificationEmailService = async ({ email }) => {
  const pendingRow = await getPendingByEmail(email);
  if (!pendingRow) {
    return { message: RESEND_RESPONSE };
  }

  const newToken = await withTransaction((client) =>
    replacePendingUser(client, {
      email,
      passwordHash: pendingRow.password_hash,
      username: pendingRow.username,
    })
  );

  try {
    await sendVerificationEmail(email, newToken);
  } catch (err) {
    console.error('Email delivery failed for resend:', err);
    await withTransaction((client) =>
      replacePendingUser(client, {
        email,
        passwordHash: pendingRow.password_hash,
        username: pendingRow.username,
        token: pendingRow.token,
        expiredAt: pendingRow.expired_at,
      })
    );
    throw emailDeliveryError(err);
  }
  return { message: RESEND_RESPONSE };
};

export const loginUser = async ({ email, password }) => {
  const user = await findUserByEmail(email);
  const fallbackHash = '$2b$10$7EqJtq98hPqEX7fNZaFWoO.HkLXrKYuRpfM8caUVbVQyTgT1nYq2K';
  
  if (!user) {
    const pending = await getPendingByEmail(email);
    if (pending && new Date() < new Date(pending.expired_at)) {
      const isMatch = await bcrypt.compare(password, pending.password_hash);
      if (isMatch) {
        const error = new Error('Please verify your email address to continue.');
        error.code = 'USER_UNVERIFIED';
        throw error;
      }
    }
  }

  const isMatch = await bcrypt.compare(password, user?.password_hash || fallbackHash);
  const locked = user?.locked_until && new Date(user.locked_until) > new Date();
  const isSuspended = user?.status === 'suspended';
  if (!user || !isMatch || locked || (!isSuspended && user.status !== 'active')) {
    if (user && !locked) await recordLoginFailure(user.user_id);
    throw new Error('Invalid email or password');
  }

  if (isSuspended) {
    const error = new Error('Your account has been suspended.');
    error.code = 'USER_SUSPENDED';
    throw error;
  }

  await recordLoginSuccess(user.user_id);
  const refreshed = await pool.query('SELECT * FROM public.users WHERE user_id = $1', [user.user_id]);
  return refreshed.rows[0] || user;
};
