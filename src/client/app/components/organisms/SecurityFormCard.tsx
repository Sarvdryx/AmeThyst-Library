"use client";

import React, { useState, useMemo } from 'react';
import { FormField } from '../molecules';
import { Button, SecurityIndicator, ErrorMessage, PasswordInput } from '../atoms';
import { setCurrentUser } from '../../utils/user';
import { calculatePasswordStrength, validateNewPassword } from '../../utils/password';
import { useI18n } from '../../providers/I18nProvider';
import { mapServerError } from '../../utils/errors';
import { apiFetch } from '../../utils/apiClient';

export default function SecurityFormCard({ isGoogleAccount = false }: { isGoogleAccount?: boolean }) {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const passwordStrength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);

    const validationError = validateNewPassword(newPassword, confirmPassword);
    if (validationError) {
      setError(t(validationError));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await apiFetch('/user/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword: password, newPassword }),
      });
      if (!result.success) throw new Error(result.message || 'Failed to update password');

      setCurrentUser(null);
      window.location.assign('/login?passwordChanged=1');
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : undefined;
      setError(mapServerError(raw, t, 'profile.password_update_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isGoogleAccount) {
    return (
      <div className="w-full max-w-[380px] flex flex-col gap-6 bg-white dark:bg-neutral-800 p-6 rounded-xl border border-[#D4D4D4] dark:border-neutral-700 shadow-sm">
        <header className="flex flex-col gap-1 text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.01em] text-[#0B1C30] dark:text-neutral-200">
            {t('profile.security_settings')}
          </h2>
        </header>
        <div className="flex flex-col gap-4 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xl font-bold border border-blue-100 dark:border-blue-800">
            G
          </div>
          <p className="text-sm text-[#45474C] dark:text-neutral-400 leading-relaxed">
            {(() => {
              const msg = t('profile.google_linked_message');
              const term = msg.includes('Google Authentication') ? 'Google Authentication' : 'Xác thực Google';
              const parts = msg.split(term);
              if (parts.length > 1) {
                return (<>{parts[0]}<strong>{term}</strong>{parts[1]}</>);
              }
              return msg;
            })()}
          </p>
          <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="w-full mt-2">
            <Button variant="primary" className="w-full h-[52px]">
              {t('profile.manage_google_account')}
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[380px] flex flex-col gap-6">
      <header className="flex flex-col gap-1 text-center">
        <h2 className="text-3xl font-semibold tracking-[-0.01em] text-[#0B1C30] dark:text-neutral-200">
          {t('profile.security_settings')}
        </h2>
      </header>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {error && <ErrorMessage message={error} />}
        {success && <ErrorMessage message={success} variant="success" />}
        <PasswordInput
          label={t('profile.current_password')}
          id="currentPassword"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <PasswordInput
            label={t('profile.new_password')}
            id="newPassword"
            placeholder={t('profile.new_password_placeholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordInput
            label={t('profile.confirm_new_password')}
            id="confirmPassword"
            placeholder={t('profile.confirm_new_password_placeholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <SecurityIndicator level={passwordStrength} />
        </div>
        <Button type="submit" className="w-full h-[52px] mt-2" isLoading={isLoading}>
          {t('profile.update_password')}
        </Button>
      </form>
    </div>
  );
}
