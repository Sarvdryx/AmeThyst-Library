export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\d{9,10}$/;

/**
 * Validates a phone number.
 * Returns a translation key if invalid, otherwise null.
 */
export function validatePhone(phone: string | null | undefined): string | null {
  if (!phone || phone.trim() === '') return null;
  if (!PHONE_REGEX.test(phone)) {
    return 'profile.phone_validation_error';
  }
  return null;
}

/**
 * Validates an email address.
 * Returns a translation key if invalid, otherwise null.
 */
export function validateEmail(email: string | null | undefined): string | null {
  if (!email || !email.trim()) {
    return 'auth.email_required';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'auth.invalid_email_format';
  }
  return null;
}

/**
 * Validates a user's full name.
 * Returns a translation key if invalid, otherwise null.
 */
export function validateFullName(name: string | null | undefined): string | null {
  if (!name || !name.trim()) {
    return 'profile.full_name_required';
  }
  return null;
}
