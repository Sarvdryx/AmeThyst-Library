"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { apiFetch } from '../../utils/apiClient';
import { getLoggedInUser } from '../../utils/user';
import InspectionPanel from './InspectionPanel';

const SLOT_COUNT = 6;

interface Borrower {
  username: string;
  gender: string;
  phone_number: string;
  email: string;
  birth_date: string;
}

interface Book {
  title: string;
  author: string;
  publisher: string;
  genres: string;
  image_url: string;
  price: number;
}

interface Borrowing {
  reserve_date: string;
  borrow_date: string;
  due_date: string;
}

interface VerifyReturnData {
  borrowId: number;
  borrower: Borrower;
  book: Book;
  borrowing: Borrowing;
  configurationVersion: string;
}

type Step = 'pin' | 'inspection' | 'done';

export default function ReturnFlowPanel() {
  const { t } = useI18n();
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(SLOT_COUNT).fill(null));
  const [digits, setDigits] = useState<string[]>(Array(SLOT_COUNT).fill(''));
  const [activeIndex, setActiveIndex] = useState(-1);
  const [step, setStep] = useState<Step>('pin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnData, setReturnData] = useState<VerifyReturnData | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [step]);

  const focusSlot = useCallback((index: number) => {
    if (index >= 0 && index < SLOT_COUNT) {
      inputRefs.current[index]?.focus();
      setActiveIndex(index);
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    if (!digit) return;
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    if (index < SLOT_COUNT - 1) focusSlot(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        focusSlot(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusSlot(index - 1);
    } else if (e.key === 'ArrowRight' && index < SLOT_COUNT - 1) {
      focusSlot(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, SLOT_COUNT);
    if (pasted) {
      const newDigits = pasted.split('');
      while (newDigits.length < SLOT_COUNT) newDigits.push('');
      setDigits(newDigits);
      focusSlot(Math.min(pasted.length, SLOT_COUNT - 1));
    }
  };

  const handleVerify = async () => {
    const pin = digits.join('');
    if (pin.length !== SLOT_COUNT) return;

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const result = await apiFetch<VerifyReturnData>('/dashboard/librarian/verify-return-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!result.success) {
        setError(result.message || 'PIN verification failed');
        return;
      }

      setReturnData(result.data!);
      setStep('inspection');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectionComplete = () => {
    setResultMessage('Book return confirmed successfully');
    setStep('done');
  };

  const handleConfigurationChanged = () => {
    setDigits(Array(SLOT_COUNT).fill(''));
    setStep('pin');
    setError(null);
    setReturnData(null);
    setResultMessage(null);
    setNotice(t('dashboard.inspection_configuration_changed'));
  };

  const handleReset = () => {
    setDigits(Array(SLOT_COUNT).fill(''));
    setStep('pin');
    setError(null);
    setReturnData(null);
    setResultMessage(null);
    focusSlot(0);
  };

  const pinCode = digits.join('');

  if (step === 'done') {
    return (
      <div className="flex items-center justify-center w-full py-16">
        <div className="flex max-w-[896px] flex-col items-center gap-8 w-full">
          <div className="flex p-8 flex-col items-center rounded-xl border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 w-full shadow-sm">
            <div className="flex py-8 px-0 flex-col items-center w-full gap-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 dark:text-green-300">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="text-[#43474D] dark:text-neutral-200 font-hankenGrotesk text-lg font-bold text-center">
                {resultMessage}
              </p>
              <button
                onClick={handleReset}
                className="cursor-pointer flex py-3 px-8 items-center gap-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.1em] hover:opacity-90 transition-opacity"
              >
                {t('dashboard.inspection_verify_another')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'inspection' && returnData) {
    return (
      <div className="w-full py-8 px-4 animate-fadeIn">
        <div className="max-w-[1024px] mx-auto">
          <h1 className="text-[#0B1C30] dark:text-neutral-100 font-inter text-[32px] font-bold leading-10 tracking-[-0.02em] mb-6">
            {t('dashboard.inspection_title')}
          </h1>
          <InspectionPanel
            borrowId={String(returnData.borrowId)}
            borrower={returnData.borrower}
            book={returnData.book}
            borrowing={returnData.borrowing}
            branchId={String(getLoggedInUser()?.branch_id || '')}
            configurationVersion={returnData.configurationVersion}
            onComplete={handleInspectionComplete}
            onCancel={handleReset}
            onConfigurationChanged={handleConfigurationChanged}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full py-16">
      <div className="flex max-w-[896px] flex-col items-center gap-8 w-full">
        <div className="flex flex-col items-center gap-2 w-full">
          <h1 className="text-[#0B1C30] dark:text-neutral-100 font-inter text-[32px] font-bold leading-10 tracking-[-0.02em] text-center">
            {t('dashboard.inspection_pin_title')}
          </h1>
          <p className="text-[#615E58] dark:text-neutral-400 font-manrope text-sm">{t('dashboard.inspection_pin_subtitle')}</p>
        </div>

        <div className="flex p-8 flex-col items-start rounded-xl border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 w-full shadow-sm">
          <div className="flex py-8 px-0 flex-col items-center w-full">
            <div className="flex pb-8 flex-col items-start w-fit">
              <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.2em]">
                {t('verification.enter_code_label')}
              </p>
            </div>

            <div className="flex pb-12 flex-col items-start w-fit" onPaste={handlePaste}>
              <div className="flex items-start gap-4 w-fit">
                {digits.slice(0, 3).map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={() => setActiveIndex(i)}
                    onBlur={() => setActiveIndex(-1)}
                    autoComplete="one-time-code"
                    disabled={loading}
                    className={`w-16 h-20 rounded-lg border-2 text-center text-2xl font-mono font-bold outline-none transition-colors
                      ${activeIndex === i
                        ? 'border-amber-500 dark:border-amber-400 ring-1 ring-amber-500 dark:ring-amber-400'
                        : 'border-[#E8E2D5] dark:border-neutral-600'
                      }
                      bg-[#FEF9EF] dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100
                      [&::-webkit-inner-spin-button]:appearance-none
                      [&::-webkit-outer-spin-button]:appearance-none
                    `}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
                <div className="w-4" />
                {digits.slice(3).map((d, i) => {
                  const idx = i + 3;
                  return (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onFocus={() => setActiveIndex(idx)}
                      onBlur={() => setActiveIndex(-1)}
                      autoComplete="one-time-code"
                      disabled={loading}
                      className={`w-16 h-20 rounded-lg border-2 text-center text-2xl font-mono font-bold outline-none transition-colors
                        ${activeIndex === idx
                          ? 'border-amber-500 dark:border-amber-400 ring-1 ring-amber-500 dark:ring-amber-400'
                          : 'border-[#E8E2D5] dark:border-neutral-600'
                        }
                        bg-[#FEF9EF] dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100
                        [&::-webkit-inner-spin-button]:appearance-none
                        [&::-webkit-outer-spin-button]:appearance-none
                      `}
                      aria-label={`Digit ${idx + 1}`}
                    />
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="pb-6 w-full">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium text-center">{error}</p>
                </div>
              </div>
            )}

            {notice && (
              <div className="pb-6 w-full" role="alert">
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/20">
                  <p className="text-center text-sm font-medium text-amber-900 dark:text-amber-200">{notice}</p>
                </div>
              </div>
            )}

            <div className="flex justify-center items-start gap-4 w-full">
              <button
                onClick={handleVerify}
                disabled={pinCode.length !== SLOT_COUNT || loading}
                className="cursor-pointer flex py-3 px-12 items-center gap-2 rounded-full bg-black dark:bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                <span className="text-white dark:text-black font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.1em]">
                  {loading ? t('dashboard.inspection_verifying') : t('dashboard.inspection_verify_button')}
                </span>
              </button>

              <button
                onClick={handleReset}
                disabled={loading}
                className="cursor-pointer flex py-3.5 px-8 flex-col justify-center items-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <span className="text-[#43474D] dark:text-neutral-300 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.1em]">
                  {t('verification.clear_button')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
