import { authSessionCoordinator } from './authSessionCoordinator.mjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function getToken(): null { return null; }
export function getBranchId(): string | null { return null; }
export async function authHeaders(): Promise<Record<string, string>> {
  const csrf = await getCsrfToken();
  return csrf ? { 'X-CSRF-Token': csrf } : {};
}

export interface ApiResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: { page: number; pageSize: number; totalItems: number; totalPages: number };
  error?: { code: string; message: string; details?: Record<string, unknown>; retryAt?: string | null };
}

const readCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const entry = document.cookie.split('; ').find((item) => item.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
};

let cachedCsrfToken: string | null = null;

export function resetCsrfToken(): void {
  cachedCsrfToken = null;
}

// The API may live on a different site than the client (e.g. Render + Vercel).
// There, the amethyst_csrf cookie is never readable via document.cookie, so we
// fetch the live token from the server body. The token always mirrors the
// cookie the server holds for the request, keeping the double-submit check valid.
export async function getCsrfToken(): Promise<string | null> {
  const fromCookie = readCookie('amethyst_csrf');
  if (fromCookie) {
    cachedCsrfToken = fromCookie;
    return fromCookie;
  }
  if (cachedCsrfToken) return cachedCsrfToken;
  const response = await safeFetch(`${API_URL}/auth/csrf`, { credentials: 'include' });
  if (!response || !response.ok) return null;
  const data = await parseResponse(response);
  const token = data?.data?.csrfToken || null;
  if (token) cachedCsrfToken = token;
  return token;
}

const reportNetworkEvent = (type: 'network-error' | 'network-recovered') => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(type));
};

export const reportNetworkError = () => reportNetworkEvent('network-error');
export const reportNetworkRecovery = () => reportNetworkEvent('network-recovered');

export const safeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response | null> => {
  try {
    const response = await fetch(input, init);
    reportNetworkRecovery();
    return response;
  } catch {
    reportNetworkError();
    return null;
  }
};

const parseResponse = async (response: Response): Promise<any> => {
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try { return await response.json(); } catch { return null; }
  }
  const text = await response.text();
  return text ? { message: text } : null;
};

const refreshSession = () => authSessionCoordinator.run(async () => {
  const csrf = await getCsrfToken();
  let response = await safeFetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: csrf ? { 'X-CSRF-Token': csrf } : {},
  });
  if (response && response.status === 403) {
    resetCsrfToken();
    const retryCsrf = await getCsrfToken();
    response = await safeFetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: retryCsrf ? { 'X-CSRF-Token': retryCsrf } : {},
    });
  }
  if (!response) return false;
  const data = await parseResponse(response);
  if (!response.ok) {
    if (data?.error?.code === 'USER_SUSPENDED') return 'USER_SUSPENDED';
    return false;
  }
  const user = data?.data?.user;
  if (typeof window !== 'undefined' && user) window.dispatchEvent(new CustomEvent('user-updated', { detail: user }));
  resetCsrfToken();
  return true;
});

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}, retried = false): Promise<ApiResult<T>> {
  const headers = new Headers(options.headers || {});
  const method = String(options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
  }
  const response = await safeFetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' });
  if (!response) {
    return { success: false, message: 'Network connection error. Please check your connection and try again.' };
  }
  let cachedData: any;
  if (response.status === 401 && !retried && !path.startsWith('/auth/')) {
    const preview = await parseResponse(response.clone());
    if (preview?.error?.code !== 'USER_SUSPENDED') {
      const refreshResult = await refreshSession();
      if (refreshResult === true) {
        return apiFetch<T>(path, options, true);
      } else if (refreshResult === 'USER_SUSPENDED') {
        cachedData = { success: false, error: { code: 'USER_SUSPENDED', message: 'Account suspended' } };
      } else {
        cachedData = preview;
      }
    } else {
      cachedData = preview;
    }
  }
  const data = cachedData ?? await parseResponse(response);
  if (!response.ok || data?.success === false) {
    if (response.status === 403 && data?.error?.code === 'CSRF_INVALID' && !retried) {
      resetCsrfToken();
      return apiFetch<T>(path, options, true);
    }
    if (data?.error?.code === 'USER_SUSPENDED' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('account-suspended'));
    } else if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('user-updated', { detail: null }));
      const returnTo = `${window.location.pathname}${window.location.search}`;
      if (!window.location.pathname.startsWith('/login')) window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    const fallback = response.statusText || 'Request failed';
    return { success: false, message: data?.error?.message || data?.message || (typeof data?.error === 'string' ? data.error : fallback), error: typeof data?.error === 'object' ? data.error : undefined };
  }
  return { success: true, data: (data?.success === true ? data.data : data) as T, message: data?.message, meta: data?.meta };
}
