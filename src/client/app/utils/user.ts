import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCsrfToken, resetCsrfToken } from './apiClient';
import { authSessionCoordinator } from './authSessionCoordinator.mjs';

export interface StoredUser {
  userId?: string; username?: string; email?: string; phone_number?: string; avatar?: string;
  role?: string; branch_id?: number | null; must_change_password?: boolean;
}

let currentUser: StoredUser | null = null;
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function setCurrentUser(user: StoredUser | null) {
  currentUser = user;
  resetCsrfToken();
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('user-updated', { detail: user }));
}

export function getInitials(name: string): string {
  return name ? name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) : '';
}
export const getLoggedInUser = () => currentUser;
export const getLoggedInUserInitials = () => getInitials(currentUser?.username || '');
export const isLoggedIn = () => Boolean(currentUser);
export const getAuthToken = (): null => null;

export async function logoutUser(): Promise<void> {
  if (typeof window === 'undefined') return;
  await authSessionCoordinator.run(async () => {
    const csrf = await getCsrfToken();
    await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include', headers: csrf ? { 'X-CSRF-Token': csrf } : {} }).catch(() => undefined);
    resetCsrfToken();
    setCurrentUser(null);
  });
}

export function updateStoredUser(partial: Partial<StoredUser>): StoredUser | null {
  if (!currentUser) return null;
  currentUser = { ...currentUser, ...partial };
  setCurrentUser(currentUser);
  return currentUser;
}

export function useStoredUser(): StoredUser | null {
  const [user, setUser] = useState<StoredUser | null>(currentUser);
  useEffect(() => {
    const onUpdate = (event: Event) => setUser((event as CustomEvent<StoredUser | null>).detail);
    window.addEventListener('user-updated', onUpdate);
    return () => window.removeEventListener('user-updated', onUpdate);
  }, []);
  return user;
}

export function getRedirectPathForUser(user: StoredUser | null): string {
  if (!user) return '/login';
  if (user.role === 'librarian') return '/dashboard/librarian';
  if (user.role === 'admin') return '/dashboard/admin';
  return '/library';
}
export function getDashboardPath(user: StoredUser | null): string {
  if (!user) return '';
  if (user.role === 'librarian') return '/dashboard/librarian';
  if (user.role === 'admin') return '/dashboard/admin';
  return '/dashboard/user';
}

export function useRedirectIfLoggedIn(redirectTo?: string): void {
  const router = useRouter();
  const user = useStoredUser();
  useEffect(() => { if (user) router.push(redirectTo || getRedirectPathForUser(user)); }, [router, redirectTo, user]);
}
export function useRequireAuth(redirectTo = '/login'): void {
  const router = useRouter();
  const user = useStoredUser();
  useEffect(() => {
    const onReady = () => { if (!currentUser) router.push(redirectTo); };
    window.addEventListener('auth-ready', onReady);
    if (user) return () => window.removeEventListener('auth-ready', onReady);
    return () => window.removeEventListener('auth-ready', onReady);
  }, [router, redirectTo, user]);
}
