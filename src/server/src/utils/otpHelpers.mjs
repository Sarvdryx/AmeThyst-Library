import crypto from 'crypto';

export const OTP_VERIFY_TTL = 60 * 1000;
export const OTP_RESET_TTL = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

export const hashOtp = (email, otp) => crypto
  .createHmac('sha256', process.env.OTP_HMAC_SECRET || process.env.JWT_SECRET)
  .update(`${String(email).toLowerCase()}:${otp}`)
  .digest('hex');

export const validateOtpRecord = (row, email, otp) => {
  if (!row) throw new Error('Invalid OTP');
  if (new Date() > new Date(row.expired_at)) throw new Error('OTP has expired');
  if ((row.attempt_count ?? 0) >= OTP_MAX_ATTEMPTS) throw new Error('OTP attempt limit exceeded');
  const actual = Buffer.from(hashOtp(email, otp), 'hex');
  const expected = Buffer.from(row.otp_hash || '', 'hex');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    throw new Error('Incorrect OTP');
  }
};

export const validateVerifiedRecord = (row) => {
  if (!row || !row.verified) throw new Error('OTP not verified');
  if (new Date() > new Date(row.expired_at)) {
    throw new Error('OTP session has expired. Please request a new OTP.');
  }
};
