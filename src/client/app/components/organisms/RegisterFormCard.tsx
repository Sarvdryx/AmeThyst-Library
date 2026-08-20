"use client";

import React, { useMemo } from 'react';
import { FormField, OAuthButtons } from '../molecules';
import { Button, SecurityIndicator, ErrorMessage, PasswordInput, Divider } from '../atoms';
import { calculatePasswordStrength, validatePassword } from '../../utils/password';
import { validateEmail } from '../../utils/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../providers/I18nProvider';
import { mapServerError } from '../../utils/errors';
import { apiFetch } from '../../utils/apiClient';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormState {
  isLoading: boolean;
  error: string | null;
  validationErrors: Partial<Record<string, string>>;
}

interface RegisterFormCardProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  state: FormState;
  setState: React.Dispatch<React.SetStateAction<FormState>>;
}

export default function RegisterFormCard({ 
  formData, 
  setFormData, 
  state, 
  setState 
}: RegisterFormCardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const passwordStrength = useMemo(() => calculatePasswordStrength(formData.password), [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

    // Client-side email validation
    const emailValidationError = validateEmail(formData.email);
    if (emailValidationError) {
      setState(prev => ({ ...prev, error: t(emailValidationError) }));
      return;
    }

    const error = validatePassword(formData.password, formData.confirmPassword);
    if (error) {
      setState(prev => ({ ...prev, error: t(error) }));
      return;
    }
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await apiFetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.fullName
        })
      });

      if (!result.success) throw new Error(result.message || t('auth.register_failed'));

      setState(prev => ({ ...prev, isLoading: false }));
      router.push(`/check-mail?email=${encodeURIComponent(formData.email)}`);
    } catch (err: unknown) {
      console.error('Register error:', err);
      const raw = err instanceof Error ? err.message : undefined;
      setState(prev => ({ ...prev, isLoading: false, error: mapServerError(raw, t, 'auth.register_failed') }));
    }
  };

  return (
    <div className="w-full max-w-[380px] flex flex-col gap-6">
      <header className="flex flex-col gap-1 text-center">
        <h2 className="text-3xl font-semibold tracking-[-0.01em] text-[#0B1C30] dark:text-neutral-200">
          {t('auth.register_title')}
        </h2>
        <p className="text-sm text-[#45474C] dark:text-neutral-400">
          {t('auth.register_details_subtitle')}
        </p>
      </header>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {state.error && <ErrorMessage message={state.error} />}
        <FormField
          label={t('auth.full_name_label')}
          id="fullName"
          placeholder="Alex Johnson"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          error={state.validationErrors?.fullName}
          disabled={state.isLoading}
        />

        <FormField
          label={t('auth.email_address_label')}
          id="email"
          type="email"
          placeholder={t('auth.email_address_placeholder')}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={state.validationErrors?.email}
          disabled={state.isLoading}
        />

        <div className="flex flex-col gap-2">
          <PasswordInput
            label={t('auth.password_label')}
            id="password"
            name="password"
            placeholder={t('auth.password_placeholder_short')}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            autoComplete="new-password"
            autoCapitalize="none"
            spellCheck={false}
            error={state.validationErrors?.password}
            disabled={state.isLoading}
          />
          <PasswordInput
            label={t('auth.confirm_password_label')}
            id="confirmPassword"
            name="confirmPassword"
            placeholder={t('auth.confirm_password_placeholder')}
            value={formData.confirmPassword || ""}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            autoComplete="new-password"
            autoCapitalize="none"
            spellCheck={false}
            error={state.validationErrors?.confirmPassword}
            disabled={state.isLoading}
          />
          <SecurityIndicator level={passwordStrength} />
        </div>

        <Button
          type="submit"
          className="w-full h-[52px] mt-2"
          isLoading={state.isLoading}
        >
          {t('auth.register_button')}
        </Button>

        <Divider label={t('auth.or_continue_with')} className="my-2" />

        <OAuthButtons label={t('auth.sign_up_google')} />

        <div className="flex pt-2 flex-col items-center w-full">
          <p className="text-[#091426] dark:text-neutral-200 font-inter text-sm leading-5 w-fit">
            {t('auth.already_have_account')}{' '}
            <Link href="/login" className="font-semibold text-[#091426] dark:text-neutral-200 hover:underline">
              {t('auth.login_link')}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
