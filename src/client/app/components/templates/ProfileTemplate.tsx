"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '../organisms/Sidebar';
import { NavBar, Footer } from '../organisms';
import { useI18n } from '../../providers/I18nProvider';

interface ProfileTemplateProps {
  children: React.ReactNode;
  username: string;
  avatarUrl?: string;
  role?: string;
  borrowNum?: number;
  maxBorrowLimit?: number;
  onAvatarUpdate?: (newUrl: string) => void;
}

export default function ProfileTemplate({ children, username, avatarUrl, role, borrowNum, maxBorrowLimit = 5, onAvatarUpdate }: ProfileTemplateProps) {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      {/* Welcome Notification */}
      {isVisible && username && (
        <div className={`bg-[#006F66] text-white text-center text-sm font-semibold overflow-hidden transition-all duration-500 ease-in-out ${isClosing ? 'max-h-0 opacity-0 py-0' : 'max-h-12 opacity-100 py-2'}`}>
          {t('profile.welcome')} {username}!
        </div>
      )}

      <div className="flex flex-1 bg-[#F8EFE6] dark:bg-[#091426]">
        <Sidebar username={username} avatarUrl={avatarUrl} role={role} borrowNum={borrowNum} maxBorrowLimit={maxBorrowLimit} onAvatarUpdate={onAvatarUpdate} />

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}