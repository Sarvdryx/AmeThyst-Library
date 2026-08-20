export const SPECIAL_CHARS = [
  '!', '@', '#', '$', '%', '^', '&', '*', '(', ')',
  '_', '+', '-', '=', '[', ']', '{', '}', ';', ':',
  "'", '"', ',', '.', '<', '>', '/', '?', '\\', '|',
  '`', '~'
];

// Tính độ mạnh password (trả về mảng boolean tương ứng 4 điều kiện)
export function calculatePasswordStrength(password: string): [boolean, boolean, boolean, boolean] {
  if (!password) return [false, false, false, false];
  const hasLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = password.split('').some(char => SPECIAL_CHARS.includes(char));
  return [hasLength, hasUppercase, hasNumber, hasSpecial];
}

export function validateNewPassword(newPassword: string, confirmPassword: string): string | null {
  if (newPassword !== confirmPassword) return 'auth.passwords_no_match';
  
  const [hasLength, hasUppercase, hasNumber, hasSpecial] = calculatePasswordStrength(newPassword);
  if (!hasLength) return 'auth.password_min_length';
  if (!hasUppercase) return 'auth.password_require_uppercase';
  if (!hasNumber) return 'auth.password_require_digit';
  if (!hasSpecial) return 'auth.password_require_special';
  
  return null;
}

export const validatePassword = validateNewPassword;