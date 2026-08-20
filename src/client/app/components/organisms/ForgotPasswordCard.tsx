"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FormField } from '../molecules';
import { Button, ErrorMessage, SecurityIndicator, PasswordInput } from '../atoms';
import { validateNewPassword, calculatePasswordStrength } from '../../utils/password';
import { useI18n } from '../../providers/I18nProvider';
import { mapServerError } from '../../utils/errors';
import { validateEmail } from '../../utils/validation';

export interface SubmitData {
  step: 1 | 2 | 3;
  email: string;
  otp?: string;
  newPassword?: string;
}

interface ForgotPasswordCardProps {
  onBackToSignIn: () => void;
  onSubmit: (data: SubmitData) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
  isSuccess?: boolean;
}

const OTP_TTL = 60; // seconds — must match server OTP_VERIFY_TTL

export default function ForgotPasswordCard({ 
  onBackToSignIn, 
  onSubmit, 
  isLoading = false,
  isSuccess = false
}: ForgotPasswordCardProps) {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const isResendingRef = useRef(false);
  
    // OTP countdown
  const [secondsLeft, setSecondsLeft] = useState(OTP_TTL);
  const [otpExpired, setOtpExpired] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const passwordStrength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword]);
  
  const startCountdown = () => {
    setSecondsLeft(OTP_TTL);
    setOtpExpired(false);
    setResendMessage('');
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setOtpExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (step === 2) startCountdown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setError(t(emailValidationError));
      return;
    }
    const result = await onSubmit({ step: 1, email });
    if (result && result.success) { 
      setError(''); 
      setStep(2); 
    } else { 
      setError(mapServerError(result?.error, t, 'auth.email_not_exist'));
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSubmit({ step: 2, email, otp });
    if (result && result.success) { 
      setError(''); 
      setStep(3); 
    } else { 
      setError(mapServerError(result?.error, t, 'auth.otp_incorrect'));
    }
  };
  
  const handleResend = async () => {
    if (isResendingRef.current || isLoading) return;
    isResendingRef.current = true;
    setIsResending(true);
    setOtp('');
    setError('');
    try {
      const result = await onSubmit({ step: 1, email });
      if (result && result.success) {
        setResendMessage(t('auth.otp_resent'));
        startCountdown();
      } else {
        setError(mapServerError(result?.error, t, 'auth.email_not_exist'));
      }
    } finally {
      setIsResending(false);
      isResendingRef.current = false;
    }
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateNewPassword(newPassword, confirmPassword);
    if (validationError) {
      setError(t(validationError));
      return;
    }
    setError('');
    const result = await onSubmit({ step: 3, email, otp, newPassword });

    if (result && result.success) {
      setError('');
    } else {
      setError(mapServerError(result?.error, t, 'auth.password_reset_failed'));
    }
  };

  return (
    <div className="w-full max-w-[480px] rounded-xl bg-white dark:bg-neutral-800 border border-[#C5C6CD] dark:border-neutral-700 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="pt-12 pb-12 px-6 sm:pt-16 sm:px-12 flex flex-col items-start w-full gap-2">

        {isSuccess ? (
          <div className="w-full flex flex-col gap-2">
            <h1 className="text-2xl sm:text-[32px] leading-9 sm:leading-10 font-semibold text-[#091426] dark:text-neutral-200" style={{ letterSpacing: '-0.01em' }}>
              {t('auth.forgot_success_title')}
            </h1>
            <p className="text-sm sm:text-base leading-6 text-[#45474C] dark:text-neutral-400 mb-6">
              {t('auth.forgot_success_message')}
            </p>
          </div>
        ) : (
          <>
            {/* Step 1 — Enter email */}
            {step === 1 && (
              <>
                <h1 className="text-2xl sm:text-[32px] leading-9 sm:leading-10 font-semibold text-[#091426] dark:text-neutral-200" style={{ letterSpacing: '-0.01em' }}>
                  {t('auth.forgot_password_title')}
                </h1>
                <p className="text-sm sm:text-base leading-6 text-[#45474C] dark:text-neutral-400">
                  {t('auth.forgot_password_subtitle')}
                </p>
                <form onSubmit={handleStep1} className="w-full py-6 px-0 flex flex-col gap-6">
                  <FormField
                    label={t('auth.email_address_label')}
                    id="email"
                    type="email"
                    placeholder="researcher@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  {error && <ErrorMessage message={error} />}
                  <Button type="submit" className="w-full h-[52px] gap-2" isLoading={isLoading} disabled={isLoading}>
                    {t('auth.send_otp')}
                  </Button>
                </form>
              </>
            )}

            {/* Step 2 — Enter OTP */}
            {step === 2 && (
              <>
                <h1 className="text-2xl sm:text-[32px] leading-9 sm:leading-10 font-semibold text-[#091426] dark:text-neutral-200" style={{ letterSpacing: '-0.01em' }}>
                  {t('auth.otp_title')}
                </h1>
                <p className="text-sm sm:text-base leading-6 text-[#45474C] dark:text-neutral-400">
                  {(() => {
                    const parts = t('auth.otp_subtitle').split('{email}');
                    return (
                      <>
                        {parts[0]}<b>{email}</b>{parts[1]}
                      </>
                    );
                  })()}
                </p>
                
                {otpExpired ? (
                  /* Expired UI */
                  <div className="w-full py-6 flex flex-col gap-4">
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 flex flex-col gap-1">
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">{t('auth.otp_expired')}</p>
                      <p className="text-sm text-red-500 dark:text-red-400">{t('auth.otp_expired_message')}</p>
                    </div>
                    {error && <ErrorMessage message={error} />}
                    <Button
                      type="button"
                      className="w-full h-[52px] gap-2"
                      isLoading={isResending}
                      disabled={isResending || isLoading}
                      onClick={handleResend}
                    >
                      {t('auth.resend_otp')}
                    </Button>
                  </div>
                ) : (
                  /* Normal OTP form */
                  <form onSubmit={handleStep2} className="w-full py-6 px-0 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <FormField
                        label={t('auth.otp_code_label')}
                        id="otp"
                        type="text"
                        placeholder={t('auth.otp_placeholder')}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <p className="text-xs text-[#45474C] dark:text-neutral-400 tabular-nums">
                        {t('auth.otp_expires_in').replace('{seconds}', String(secondsLeft))}
                      </p>
                    </div>
                    {resendMessage && <p className="text-sm text-green-600 dark:text-green-400">{resendMessage}</p>}
                    {error && <ErrorMessage message={error} />}
                    <Button type="submit" className="w-full h-[52px] gap-2" isLoading={isLoading} disabled={isLoading}>
                      {t('auth.verify_otp')}
                    </Button>
                  </form>
                )}
              </>
            )}

            {/* Step 3 — Enter new password */}
            {step === 3 && (
              <>
                <h1 className="text-2xl sm:text-[32px] leading-9 sm:leading-10 font-semibold text-[#091426] dark:text-neutral-200" style={{ letterSpacing: '-0.01em' }}>
                  {t('auth.new_password_title')}
                </h1>
                <p className="text-sm sm:text-base leading-6 text-[#45474C] dark:text-neutral-400">
                  {t('auth.new_password_subtitle')}
                </p>
                <form onSubmit={handleStep3} className="w-full py-6 px-0 flex flex-col gap-6">
                  <div className="flex flex-col gap-2 w-full">
                    <PasswordInput
                      label={t('auth.new_password_label')}
                      id="newPassword"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <PasswordInput
                      label={t('auth.confirm_password_label')}
                      id="confirmPassword"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <SecurityIndicator level={passwordStrength} />
                  </div>
                  {error && <ErrorMessage message={error} />}
                  <Button type="submit" className="w-full h-[52px] gap-2" isLoading={isLoading} disabled={isLoading}>
                    {t('auth.reset_password')}
                  </Button>
                </form>
              </>
            )}
          </>
        )}

        <button
          type="button"
          onClick={onBackToSignIn}
          disabled={isLoading}
          className="pt-8 w-full border-t border-t-[#C5C6CD] dark:border-t-neutral-700 flex items-center justify-center gap-1.5 group disabled:opacity-50 transition-opacity hover:opacity-80"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 group-hover:-translate-x-0.5 transition-transform">
            <path d="M2.86875 6.75L7.06875 10.95L6 12L0 6L6 0L7.06875 1.05L2.86875 5.25H12V6.75H2.86875Z" fill="currentColor" />
          </svg>
          <span className="text-sm font-semibold text-[#091426] dark:text-neutral-200" style={{ letterSpacing: '0.01em' }}>{t('auth.back_to_sign_in')}</span>
        </button>

      </div>
    </div>
  );
}