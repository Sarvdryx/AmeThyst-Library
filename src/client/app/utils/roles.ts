export const ROLES = {
  USER: 'user',
  LIBRARIAN: 'librarian',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const isBorrowerRole = (role?: string): boolean => role === ROLES.USER;
export const isLibrarianRole = (role?: string): boolean => role === ROLES.LIBRARIAN;
export const isAdminRole = (role?: string): boolean => role === ROLES.ADMIN;
export const isStaffRole = (role?: string): boolean =>
  role === ROLES.LIBRARIAN || role === ROLES.ADMIN;
