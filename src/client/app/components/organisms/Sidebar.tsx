"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logoutUser, getInitials } from '../../utils/user';
import { useI18n } from '../../providers/I18nProvider';
import { AvatarUploader, BorrowingLimitCard } from '../molecules';
import { isBorrowerRole } from '../../utils/roles';

export default function Sidebar({
  username,
  avatarUrl,
  role = 'user',
  borrowNum = 0,
  maxBorrowLimit = 5,
  onAvatarUpdate,
}: {
  username: string;
  avatarUrl?: string;
  role?: string;
  borrowNum?: number;
  maxBorrowLimit?: number;
  onAvatarUpdate?: (newUrl: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  };

  const getRoleLabel = () => {
    if (role === 'admin') return t('profile.role_admin');
    if (role === 'librarian') return t('profile.role_librarian');
    return t('profile.role_user');
  };

  return (
    <>
      <button
        className="lg:hidden p-4 rounded-md text-[#091426] dark:text-neutral-200 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        {t('sidebar.menu')}
      </button>
      <aside className={`${isOpen ? 'block' : 'hidden'} lg:flex w-[330px] min-h-screen bg-[#F8EFE6] dark:bg-neutral-900 border-r border-[#000000] dark:border-neutral-700 flex flex-col sticky top-0 h-screen`}>
        <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto">
          <div className="flex flex-col items-center gap-4">
            <AvatarUploader
              avatarUrl={avatarUrl || ''}
              onAvatarUpdate={onAvatarUpdate || (() => { })}
              username={username}
            />
            <div className="flex flex-col items-center space-y-3">
              <h2 className="text-lg font-bold text-[#45474C] dark:text-neutral-200">{username}</h2>

              <span className="bg-[#86F2E4] dark:bg-[#86F2E4]/20 text-[#006F66] dark:text-[#86F2E4] px-3 py-1 rounded-full text-sm font-semibold capitalize">
                {getRoleLabel()}
              </span>
            </div>
          </div>

        <nav className="flex flex-col gap-2">
            <Link href="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#EAEAEA] active:bg-[#D4D4D4] dark:hover:bg-neutral-700 dark:active:bg-neutral-600 transition-all text-[#091426] dark:text-neutral-200">
              <span>👤</span> {t('profile.profile_link')}
            </Link>
            <Link href="/profile/security" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#EAEAEA] active:bg-[#D4D4D4] dark:hover:bg-neutral-700 dark:active:bg-neutral-600 transition-all text-[#091426] dark:text-neutral-200">
              <span>🔒</span> {t('profile.security_link')}
            </Link>
        </nav>

          {/* Borrowing Information Widget — only relevant for the 'user' role */}
          {isBorrowerRole(role) && (
            <BorrowingLimitCard borrowNum={borrowNum} maxBorrowLimit={maxBorrowLimit} />
          )}
        </div>

        <div className="flex justify-center p-6 pt-4 border-t border-[#000000]/10 dark:border-neutral-700">
          <button
            className="p-3 w-full max-w-[200px] rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-all font-semibold"
            onClick={handleLogout}
          >
            {t('profile.logout')}
          </button>
        </div>
      </aside>
    </>
  );
}