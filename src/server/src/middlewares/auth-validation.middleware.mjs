const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[\p{L}\p{N} _.-]{2,100}$/u;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

const fail = (res, details) => res.status(400).json({
  success: false,
  error: { code: 'VALIDATION_ERROR', message: 'Invalid request data.', details },
});

export const validateEmailBody = (req, res, next) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 255) return fail(res, { email: 'A valid email is required.' });
  req.body.email = email;
  return next();
};

export const validateRegistration = (req, res, next) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const details = {};
  if (!EMAIL_PATTERN.test(email) || email.length > 255) details.email = 'A valid email is required.';
  if (!USERNAME_PATTERN.test(username)) details.username = 'Username must contain 2-100 valid characters.';
  if (!PASSWORD_PATTERN.test(password)) details.password = 'Password must be 8-128 characters with upper, lower and number.';
  if (Object.keys(details).length) return fail(res, details);
  req.body = { ...req.body, email, username };
  return next();
};

export const validateNewPassword = (req, res, next) => {
  if (!PASSWORD_PATTERN.test(String(req.body?.newPassword || ''))) {
    return fail(res, { newPassword: 'Password must be 8-128 characters with upper, lower and number.' });
  }
  return next();
};
