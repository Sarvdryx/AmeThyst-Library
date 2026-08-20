import './env.mjs';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from './postgres.mjs';

const isTransientConnectionError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return ['57P01', '57P02', '57P03'].includes(error?.code)
    || error?.code === 'ECONNRESET'
    || message.includes('connection terminated unexpectedly')
    || message.includes('connection ended unexpectedly');
};

const queryUserByEmail = async (email) => {
  try {
    return await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  } catch (error) {
    if (!isTransientConnectionError(error)) throw error;
    // A PostgreSQL restart invalidates pooled sockets. A read-only lookup is
    // safe to retry once; pg-pool will acquire a fresh connection.
    return pool.query('SELECT * FROM users WHERE email = $1', [email]);
  }
};

export const googleVerifyCallback = async (accessToken, refreshToken, profile, done) => {
  try {
    const verifiedEmail = profile.emails?.find((entry) => entry?.verified !== false)?.value;
    if (!verifiedEmail) return done(null, false, { message: 'verified_email_required' });
    const email = verifiedEmail.toLowerCase();
    const username = profile.displayName;
    const avatar = profile.photos?.[0]?.value ?? null;

    let result = await queryUserByEmail(email);

    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO users (email, username, avatar, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING user_id, email, username, avatar, role, branch_id, status, token_version, must_change_password`,
        [email, username, avatar, 'GOOGLE_AUTH', 'user']
      );
    } else {
      const user = result.rows[0];
      if (user.password_hash !== 'GOOGLE_AUTH') {
        return done(null, false, { message: 'account_exists_with_password' });
      }
    }

    const dbUser = result.rows[0];
    if (dbUser.status === 'suspended') {
      return done(null, false, { message: 'USER_SUSPENDED' });
    }

    return done(null, dbUser);
  } catch (err) {
    return done(err, null);
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    googleVerifyCallback
  )
);

export default passport;
