'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RegisterTemplate from '../components/templates/RegisterTemplate';
import { useI18n } from '../providers/I18nProvider';
import { Button, ErrorMessage } from '../components/atoms';
import { mapServerError } from '../utils/errors';
import { useCountdown } from '../hooks/useCountdown';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function CheckEmailContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');

  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');
  const isResendingRef = useRef(false);
  const { secondsLeft: cooldown, isActive: cooldownActive, start: startCooldown, stop: stopCooldown, reset: resetCooldown } = useCountdown(60);

  useEffect(() => {
    if (!email) {
      router.push('/register');
    }
  }, [email, router]);

  const handleResend = async () => {
    if (!email || cooldownActive || isResending || isResendingRef.current) return;

    isResendingRef.current = true;
    setIsResending(true);
    setResendMessage('');
    setResendError('');

    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('auth.something_went_wrong'));
      }

      setResendMessage(t('auth.resend_verification_success'));
      resetCooldown();
      startCooldown();
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : undefined;
      setResendError(mapServerError(raw, t, 'auth.something_went_wrong'));
    } finally {
      setIsResending(false);
      isResendingRef.current = false;
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="w-full max-w-[420px] flex flex-col items-center gap-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[#E6F4F1] dark:bg-neutral-700 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z"
            stroke="#0A3240" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="dark:stroke-blue-400"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-semibold tracking-[-0.01em] text-[#0B1C30] dark:text-neutral-200">
          {t('auth.check_email_title')}
        </h2>
        <p className="text-sm text-[#45474C] dark:text-neutral-400 leading-6">
          {t('auth.check_email_message').replace('{email}', email)}
        </p>
      </div>

      <div className="w-full flex flex-col gap-3 mt-2">
        <Button
          type="button"
          onClick={handleResend}
          disabled={cooldownActive || isResending}
          isLoading={isResending}
          className="w-full h-[52px]"
          variant="primary"
        >
          {cooldownActive
            ? t('auth.resend_verification_cooldown').replace('{seconds}', String(cooldown))
            : t('auth.resend_verification')}
        </Button>

        {resendMessage && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            {resendMessage}
          </p>
        )}

        {resendError && <ErrorMessage message={resendError} />}
      </div>

      <Link href="/login" className="text-sm font-semibold text-[#0A3240] dark:text-blue-400 hover:underline mt-2">
        ← {t('auth.back_to_sign_in')}
      </Link>
    </div>
  );
}

export default function CheckEmailPage() {
  const { t } = useI18n();
  return (
    <RegisterTemplate>
      <Suspense fallback={
        <div className="w-full max-w-[380px] flex flex-col gap-6 items-center text-center py-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent dark:border-blue-400 dark:border-t-transparent rounded-full animate-spin mb-2" />
          <h2 className="text-2xl font-semibold tracking-[-0.01em]">{t('auth.check_email_title')}</h2>
        </div>
      }>
        <CheckEmailContent />
      </Suspense>
    </RegisterTemplate>
  );
}