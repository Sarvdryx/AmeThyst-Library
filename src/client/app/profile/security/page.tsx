"use client";

import React, { useEffect, useState } from 'react';
import ProfileTemplate from '../../components/templates/ProfileTemplate';
import { SecurityFormCard } from '../../components/organisms';
import { useRequireAuth, getLoggedInUser, updateStoredUser } from '../../utils/user';
import { useI18n } from '../../providers/I18nProvider';
import { apiFetch } from '../../utils/apiClient';

export default function SecurityPage() {
  const { t } = useI18n();
  useRequireAuth();

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('user');
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = getLoggedInUser();
    setUsername(currentUser?.username || '');
    setAvatarUrl(currentUser?.avatar || '');
    setRole(currentUser?.role || 'user');

    let cancelled = false;
    const loadProfile = async () => {
      const result = await apiFetch<Record<string, any>>('/user/profile');
      if (cancelled || !result.success || !result.data) return;
      const data = result.data;
        setUsername(data.username || '');
        setAvatarUrl(data.avatar || '');
        setRole(data.role || 'user');
        setIsGoogleAccount(!!data.isGoogleAccount);
    };
    void loadProfile()
      .catch((err) => console.error(err))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
    updateStoredUser({ avatar: newAvatarUrl });
  };

  return (
    <ProfileTemplate
      username={username}
      avatarUrl={avatarUrl}
      role={role}
      onAvatarUpdate={handleAvatarUpdate}
    >
      <div className="flex justify-center">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <span className="text-[#091426] dark:text-neutral-200 font-medium animate-pulse">{t('profile.security_loading')}</span>
          </div>
        ) : (
          <SecurityFormCard isGoogleAccount={isGoogleAccount} />
        )}
      </div>
    </ProfileTemplate>
  );
}
