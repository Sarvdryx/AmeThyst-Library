"use client";

import { useEffect } from 'react';
import { useI18n } from '../../../providers/I18nProvider';
import { useStoredUser } from '../../../utils/user';
import RoleManagementPanel from '../../../components/organisms/RoleManagementPanel';
import AuthorizationHistoryPanel from '../../../components/organisms/AuthorizationHistoryPanel';

export default function AdminAuthorizationPage() {
  const { t } = useI18n();
  const user = useStoredUser();

  useEffect(() => {
    if (user?.must_change_password && typeof window !== 'undefined') {
      window.location.href = '/profile/security';
    }
  }, [user]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-manrope text-3xl font-bold text-[#1A2E44] dark:text-neutral-100">
          {t('admin.authorization.title')}
        </h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          {t('admin.authorization.subtitle')}
        </p>
      </header>

      <RoleManagementPanel />
      <AuthorizationHistoryPanel />
    </div>
  );
}
