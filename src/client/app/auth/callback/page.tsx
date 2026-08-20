"use client";

import { Suspense, useEffect } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { apiFetch } from '../../utils/apiClient';
import { getRedirectPathForUser, setCurrentUser, type StoredUser } from '../../utils/user';

function AuthCallbackContent() {
  const { t } = useI18n();

  useEffect(() => {
    void apiFetch<StoredUser>('/auth/me').then((result) => {
      if (!result.success || !result.data) {
        window.location.replace('/login');
        return;
      }
      setCurrentUser(result.data);
      window.history.replaceState({}, '', '/auth/callback');
      window.location.replace(getRedirectPathForUser(result.data));
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8EFE6] dark:bg-[#091426]">
      <p className="text-[#091426] dark:text-neutral-200">{t('auth.login_loading')}</p>
    </div>
  );
}

export default function AuthCallback() {
  const { t } = useI18n();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8EFE6] dark:bg-[#091426]">
          <p className="text-[#091426] dark:text-neutral-200">{t('auth.login_loading')}</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
