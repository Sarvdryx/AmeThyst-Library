"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '../atoms/Button';
import { getLoggedInUserInitials, useStoredUser } from '../../utils/user';
import { useI18n } from '../../providers/I18nProvider';
import NotificationBell from './NotificationBell';
import UserAvatar from '../atoms/UserAvatar';

export default function AuthActions() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const user = useStoredUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-10 w-24" />;

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="hidden font-inter text-sm font-semibold text-white transition-colors hover:text-[#8FB2C1] sm:block"
        >
          {t('navbar.sign_in')}
        </Link>
        <Link href="/register">
          <Button variant="primary" className="h-auto rounded-lg bg-white px-6 py-2 !text-black hover:bg-[#DCE6EA]">
            {t('navbar.join_now')}
          </Button>
        </Link>
      </div>
    );
  }

  const initials = getLoggedInUserInitials() || '?';

  return (
    <div className="relative flex items-center gap-4">
      <NotificationBell enabled={true} t={t} userId={user?.userId} />
      <Link href="/profile" aria-label={user.username}>
        <UserAvatar
          avatar={user.avatar}
          initials={initials}
          alt={user.username}
          className="h-10 w-10 border border-neutral-700 transition-transform hover:scale-105"
          fallbackClassName="bg-[#486C7E] font-bold text-white"
        />
      </Link>
    </div>
  );
}