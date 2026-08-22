'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setCurrentUser, type StoredUser } from '../utils/user';
import { safeFetch, getCsrfToken, resetCsrfToken } from '../utils/apiClient';
import { authSessionCoordinator } from '../utils/authSessionCoordinator.mjs';
import { AccountSuspendedModal } from '../components/modals';

interface AuthState { user: StoredUser | null; loading: boolean; refresh: () => Promise<void> }
const AuthContext = createContext<AuthState>({ user: null, loading: true, refresh: async () => undefined });
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const readJson = async (response: Response) => {
  try { return await response.json(); } catch { return null; }
};

const isUserSuspended = (body: { error?: { code?: string } } | null) => body?.error?.code === 'USER_SUSPENDED';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountSuspended, setAccountSuspended] = useState(false);
  const clearSession = useCallback(() => {
    setUser(null);
    setCurrentUser(null);
  }, []);
  const markSuspended = useCallback(() => {
    clearSession();
    setAccountSuspended(true);
  }, [clearSession]);
  const refresh = useCallback(() => authSessionCoordinator.run(async () => {
    try {
      let response = await safeFetch(`${apiUrl}/auth/me`, { credentials: 'include' });
      if (!response) { clearSession(); return; }
      if (response.status === 401) {
        const denied = await readJson(response);
        if (isUserSuspended(denied)) {
          markSuspended();
          return;
        }
        let csrf = await getCsrfToken();
        let refreshed = await safeFetch(`${apiUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: csrf ? { 'X-CSRF-Token': csrf } : {},
        });
        if (refreshed && refreshed.status === 403) {
          const forbidden = await readJson(refreshed);
          if (isUserSuspended(forbidden)) {
            markSuspended();
            return;
          }
          resetCsrfToken();
          csrf = await getCsrfToken();
          refreshed = await safeFetch(`${apiUrl}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: csrf ? { 'X-CSRF-Token': csrf } : {},
          });
        }
        if (refreshed && refreshed.ok) {
          resetCsrfToken();
          response = await safeFetch(`${apiUrl}/auth/me`, { credentials: 'include' });
        } else {
          const refreshError = refreshed ? await readJson(refreshed) : null;
          if (isUserSuspended(refreshError)) {
            markSuspended();
            return;
          }
          clearSession();
          return;
        }
      }
      if (!response || !response.ok) {
        const body = response ? await readJson(response) : null;
        if (isUserSuspended(body)) {
          markSuspended();
          return;
        }
        clearSession();
        return;
      }
      const body = await response.json();
      const next = body?.data || null;
      setUser(next); setCurrentUser(next);
    } catch { clearSession(); }
  }), [clearSession, markSuspended]);
  useEffect(() => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    void refresh().finally(() => { setLoading(false); window.dispatchEvent(new Event('auth-ready')); });
    const onUpdate = (event: Event) => setUser((event as CustomEvent<StoredUser | null>).detail);
    const onSuspended = () => markSuspended();
    window.addEventListener('user-updated', onUpdate);
    window.addEventListener('account-suspended', onSuspended);
    return () => {
      window.removeEventListener('user-updated', onUpdate);
      window.removeEventListener('account-suspended', onSuspended);
    };
  }, [refresh, markSuspended]);
  const value = useMemo(() => ({ user, loading, refresh }), [user, loading, refresh]);
  return (
    <AuthContext.Provider value={value}>
      {children}
      {accountSuspended && (
        <AccountSuspendedModal onClose={() => setAccountSuspended(false)} />
      )}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
