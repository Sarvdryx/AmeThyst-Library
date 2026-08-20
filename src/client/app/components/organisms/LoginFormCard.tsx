"use client";

import React from 'react';
import Link from 'next/link';
import { FormField, OAuthButtons } from '../molecules';
import { Button, PasswordInput, Divider } from '../atoms';
import { useI18n } from '../../providers/I18nProvider';

interface Credentials {
  email: string;
  password: string;
}

interface LoginFormCardProps {
  credentials: Credentials;
  setCredentials: React.Dispatch<React.SetStateAction<Credentials>>;
  isLoading: boolean;
  validationErrors: Partial<Record<keyof Credentials, string>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LoginFormCard({ 
  credentials, 
  setCredentials, 
  isLoading, 
  validationErrors,
  onSubmit
}: LoginFormCardProps) {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-[342px] flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h2 className="text-3xl font-semibold tracking-[-0.01em] dark:text-neutral-200">{t('auth.login_button')}</h2>
      </header>

      <form className="flex flex-col gap-6" onSubmit={onSubmit}>
        <FormField
          label={t('auth.email_address_label')}
          id="email"
          type="email"
          placeholder={t('auth.email_address_placeholder')}
          value={credentials.email}
          onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
          error={validationErrors.email}
          disabled={isLoading}
        />

        <PasswordInput
          label={t('auth.password_label')}
          id="password"
          placeholder="••••••••"
          value={credentials.password}
          onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          error={validationErrors.password}
          disabled={isLoading}
          rightLabel={
            <Link href="/forgot-password" className="text-[#006A61] dark:text-[#FFB95F] text-xs font-medium tracking-[0.02em] hover:underline">
              {t('auth.forgot_password')}
            </Link>
          }
        />

        <Button
          type="submit"
          className="w-full h-[52px]"
          isLoading={isLoading}
        >
          {t('auth.login_button')}
        </Button>

        <Divider label={t('auth.or')} />

        <OAuthButtons label={t('auth.sign_in_google')} disabled={isLoading} />

        <div className="flex flex-col items-center gap-4 mt-2">
          <p className="text-[#45474C] dark:text-neutral-400 text-sm tracking-[-0.01em]">
            {t('auth.no_account')}{' '}
            <Link href="/register" className="text-[#006A61] dark:text-[#FFB95F] font-medium hover:underline">
              {t('auth.create_one')}
            </Link>
          </p>
          <Link href="/register" className="w-full h-[52px]">
            <Button variant="primary" className="w-full h-[52px]">
              {t('auth.register_button')}
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}