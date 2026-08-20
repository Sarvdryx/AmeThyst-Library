"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRedirectPathForUser } from '../utils/user';
import { Toast } from '../components/atoms';
import { useI18n } from '../providers/I18nProvider';
import { useAuth } from '../providers/AuthProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const [authState, setAuthState] = useState<'loading' | 'authorized' | 'unauthorized' | 'forbidden'>('loading');
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' } | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotification({ message: t('dashboard.auth_required'), type: 'info' });
      setAuthState('unauthorized');
      const returnTo = `${window.location.pathname}${window.location.search}`;
      setTimeout(() => router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`), 2000);
      return;
    }
    const role = user?.role || 'user';
    const pathname = window.location.pathname;
    const isAdminSection = pathname.startsWith('/dashboard/admin');
    const isLibrarianSection = pathname.startsWith('/dashboard/librarian');
    const hasValidRole = role === 'user' || role === 'librarian' || role === 'admin';
    const hasSectionAccess =
      (!isAdminSection || role === 'admin') &&
      (!isLibrarianSection || role === 'librarian' || role === 'admin');
    if (!hasValidRole || !hasSectionAccess) {
      setNotification({ message: t('dashboard.auth_forbidden'), type: 'error' });
      setAuthState('forbidden');
      setTimeout(() => router.push(hasValidRole ? getRedirectPathForUser(user) : '/'), 2000);
      return;
    }
    setAuthState('authorized');
  }, [loading, router, t, user]);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 dark:bg-neutral-900">
        <p className="text-neutral-500 dark:text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (authState === 'unauthorized' || authState === 'forbidden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 dark:bg-neutral-900">
        {notification && (
          <Toast message={notification.message} type={notification.type} onDismiss={() => {}} duration={4000} />
        )}
      </div>
    );
  }

  return (
    <>
      {notification && (
        <Toast message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} duration={4000} />
      )}
      {children}
    </>
  );
}
