'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import RegisterTemplate from '../components/templates/RegisterTemplate';
import Link from 'next/link';
import { useI18n } from '../providers/I18nProvider';
import { Button } from '../components/atoms';
import { mapServerError } from '../utils/errors';
import { getRedirectPathForUser, setCurrentUser, type StoredUser } from '../utils/user';
import { apiFetch, type ApiResult } from '../utils/apiClient';
import { authSessionCoordinator } from '../utils/authSessionCoordinator.mjs';

type VerificationResult = ApiResult<{ user: StoredUser }>;

function VerifyEmailContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [state, setState] = useState(() => token ? {
    status: 'loading', // 'loading' | 'success' | 'expired' | 'error'
    error: '',
  } : {
    status: 'error',
    error: t('auth.verification_failed'),
  });

  const verificationRequestRef = useRef<{
    token: string;
    promise: Promise<VerificationResult>;
  } | null>(null);

  useEffect(() => {
    let subscribed = true;
    let redirectTimer: number | null = null;

    if (!token) return;

    if (!verificationRequestRef.current || verificationRequestRef.current.token !== token) {
      verificationRequestRef.current = {
        token,
        promise: authSessionCoordinator.run(async () => {
          const verification = await apiFetch<{ user: StoredUser }>('/auth/verify-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });
          if (verification.success && verification.data?.user) {
            setCurrentUser(verification.data.user);
          }
          return verification;
        }),
      };

      queueMicrotask(() => {
        if (subscribed) setState({ status: 'loading', error: '' });
      });
    }

    verificationRequestRef.current.promise.then(
      (result) => {
        if (!subscribed) return;
        if (!result.success && result.message?.toLowerCase().includes('expired')) {
          setState({ status: 'expired', error: '' });
          return;
        }
        if (!result.success || !result.data?.user) {
          const message = result.message || t('auth.verification_failed');
          setState({
            status: 'error',
            error: mapServerError(message, t, 'auth.verification_failed'),
          });
          return;
        }
        const user = result.data.user;
        setState({ status: 'success', error: '' });
        redirectTimer = window.setTimeout(() => router.push(getRedirectPathForUser(user)), 2000);
      },
      (err: unknown) => {
        if (!subscribed) return;
        const msg = err instanceof Error ? err.message : String(err);
        setState({
          status: 'error',
          error: mapServerError(msg, t, 'auth.verification_failed'),
        });
      },
    );

    return () => {
      subscribed = false;
      if (redirectTimer !== null) window.clearTimeout(redirectTimer);
    };
  }, [token, router, t]);

  return (
    <div className="w-full max-w-[420px] flex flex-col items-center gap-6 text-center py-4">
      {state.status === 'loading' && (
        <>
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent dark:border-blue-400 dark:border-t-transparent rounded-full animate-spin mb-2" />
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold text-[#0B1C30] dark:text-neutral-200">{t('auth.verify_email_title')}</h2>
            <p className="text-sm text-[#45474C] dark:text-neutral-400">{t('auth.verifying_email')}</p>
          </div>
        </>
      )}

      {state.status === 'success' && (
        <>
          <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-2xl mb-2 border border-green-100 dark:border-green-800">
            ✓
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold text-[#0B1C30] dark:text-neutral-200">{t('auth.verify_email_title')}</h2>
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              {t('auth.verification_success')}
            </p>
          </div>
        </>
      )}

      {state.status === 'expired' && (
        <>
          <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center text-2xl mb-2 border border-yellow-100 dark:border-yellow-800">
            ⚠
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold text-[#0B1C30] dark:text-neutral-200">{t('auth.verify_email_title')}</h2>
            <p className="text-sm text-[#45474C] dark:text-neutral-400">
              {t('auth.verification_link_expired')}
            </p>
          </div>
          <Link href="/register" className="w-full mt-4">
            <Button variant="primary" className="w-full h-[52px]">
              {t('auth.back_to_register')}
            </Button>
          </Link>
        </>
      )}

      {state.status === 'error' && (
        <>
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-2xl mb-2 border border-red-100 dark:border-red-800">
            ✗
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold text-[#0B1C30] dark:text-neutral-200">{t('auth.verify_email_title')}</h2>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{state.error}</p>
          </div>
          <Link href="/register" className="w-full mt-4">
            <Button variant="primary" className="w-full h-[52px]">
              {t('auth.back_to_register')}
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  const { t } = useI18n();
  return (
    <RegisterTemplate>
      <Suspense fallback={
        <div className="w-full max-w-[380px] flex flex-col gap-6 items-center text-center py-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent dark:border-blue-400 dark:border-t-transparent rounded-full animate-spin mb-2" />
          <h2 className="text-2xl font-semibold tracking-[-0.01em]">{t('auth.verify_email_title')}</h2>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </RegisterTemplate>
  );
}
