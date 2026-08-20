const SERVER_ERROR_MAP: Record<string, string> = {
  'Email does not exist': 'auth.email_not_exist',
  'Invalid OTP': 'auth.otp_incorrect',
  'OTP has expired': 'auth.otp_expired',
  'Incorrect OTP': 'auth.otp_incorrect',
  'OTP not verified': 'auth.otp_incorrect',
  'Password reset failed': 'auth.password_reset_failed',
  'Email already exists': 'auth.email_already_exists',
  'Invalid email or password': 'auth.invalid_email_password',
  'User not found': 'auth.user_not_found',
  'Google accounts cannot change password here': 'auth.google_linked_change_password_error',
  'Invalid password': 'auth.invalid_credentials',
  'Password is incorrect': 'auth.invalid_credentials',
  'Current password is incorrect': 'auth.invalid_credentials',
  'Passwords do not match': 'auth.passwords_no_match',
  'New password must be at least 8 characters': 'auth.password_min_length',
  'Password must be at least 8 characters': 'auth.password_min_length',
  'Password must contain at least one uppercase letter': 'auth.password_require_uppercase',
  'Password must contain at least one number': 'auth.password_require_digit',
  'Password must contain at least one special character': 'auth.password_require_special',
  'Invalid or expired verification link.': 'auth.verification_failed',
  'Verification link has expired. Please register again.': 'auth.verification_link_expired',
  'Email already exists.': 'auth.email_already_exists',
  'A verification email has already been sent. Please check your inbox.': 'auth.verification_already_sent',
  'No pending registration found for this email. Please register again.': 'auth.registration_expired',

  // Profile / Avatar Errors
  'File size exceeds 2MB limit': 'profile.avatar_size_error',
  'Invalid file type, only images are allowed!': 'profile.avatar_type_error',
  'Invalid URL format': 'profile.avatar_url_invalid',
  'No avatar file or URL provided': 'profile.avatar_upload_failed',
  'User not found or failed to update avatar': 'profile.avatar_upload_failed',
  'Phone number must contain only digits and be exactly 9 or 10 digits.': 'profile.phone_validation_error',
  'Invalid phone number format. Must be 9-10 digits.': 'profile.phone_validation_error',
  'Full Name is required': 'profile.full_name_required',
  'Username cannot be empty': 'profile.full_name_required',
  'Email is required': 'auth.email_required',
  'Invalid email format': 'auth.invalid_email_format',
};

export function mapServerError(rawMsg: string | null | undefined, t: (key: string) => string, fallbackKey?: string): string {
  if (!rawMsg) return fallbackKey ? t(fallbackKey) : '';
  
  // Find match in our map
  const translationKey = SERVER_ERROR_MAP[rawMsg];
  if (translationKey) {
    return t(translationKey);
  }
  
  // Fallback to translation key directly if it looks like one, otherwise return the raw error or translated fallback
  if (rawMsg.startsWith('auth.') || rawMsg.startsWith('profile.')) {
    return t(rawMsg);
  }
  
  return rawMsg;
}