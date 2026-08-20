"use client";

import React, { useState } from 'react';
import RegisterTemplate from '../components/templates/RegisterTemplate';
import { ForgotPasswordCard } from '../components/organisms';
import { SubmitData } from '../components/organisms/ForgotPasswordCard';
import { useRedirectIfLoggedIn } from '../utils/user';
import { useI18n } from '../providers/I18nProvider';

const STEP_CONFIG = {
  1: { endpoint: '/auth/forgot-password',  body: (d: SubmitData) => ({ email: d.email }) },
  2: { endpoint: '/auth/verify-otp',       body: (d: SubmitData) => ({ email: d.email, otp: d.otp }) },
  3: { endpoint: '/auth/reset-password',   body: (d: SubmitData) => ({ email: d.email, newPassword: d.newPassword }) },
};

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  useRedirectIfLoggedIn();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleBackToSignIn = () => {
    window.location.href = '/login';
  };

  const handleSubmit = async (data: SubmitData) => {
    setIsLoading(true);
    try {
      const config = STEP_CONFIG[data.step];
      const endpoint = config.endpoint;
      const body = config.body(data);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        let errorMessage = t('auth.something_went_wrong');
        try {
          const errorData = await res.json();
          errorMessage = typeof errorData.error === 'string'
            ? errorData.error
            : errorData.error?.message || errorData.message || errorMessage;
        } catch (_) {
          // fallback to default error message if response is not JSON
        }
        throw new Error(errorMessage);
      }

      if (data.step === 3) {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.something_went_wrong');
      console.error('Forgot password error:', err);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RegisterTemplate>
      <ForgotPasswordCard
        onBackToSignIn={handleBackToSignIn}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isSuccess={isSuccess}
      />
    </RegisterTemplate>
  );
}
