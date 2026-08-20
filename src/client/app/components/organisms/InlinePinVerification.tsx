"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { apiFetch } from '../../utils/apiClient';

const SLOT_COUNT = 6;

type Step = 'pin' | 'details' | 'done';

interface Borrower {
  username: string;
  gender: string;
  phone_number: string;
  email: string;
  avatar?: string | null;
}

interface Book {
  title: string;
  author: string;
  publisher: string;
  genre: string;
  price: string;
  image_url?: string | null;
}

interface VerifyData {
  borrowId: number;
  borrower: Borrower;
  book: Book;
}

interface ConfirmData {
  borrowId: number;
  status: string;
  due_date: string;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-start gap-1 min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A6A49B] dark:text-neutral-500">{label}</span>
      <span className="text-sm font-medium break-words leading-snug text-[#1c232e] dark:text-neutral-100">{value}</span>
    </div>
  );
}

export default function InlinePinVerification() {
  const { t } = useI18n();
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(SLOT_COUNT).fill(null));
  const [digits, setDigits] = useState<string[]>(Array(SLOT_COUNT).fill(''));
  const [activeIndex, setActiveIndex] = useState(-1);
  const [step, setStep] = useState<Step>('pin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedData, setVerifiedData] = useState<VerifyData | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'confirm' | 'cancel' | null>(null);

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
    if (index < SLOT_COUNT - 1) {
      focusSlot(index + 1);
    }
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

    if (pin.length !== SLOT_COUNT) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiFetch<VerifyData>('/dashboard/librarian/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!result.success) {
        setError(result.message || 'PIN verification failed');
        return;
      }

      setVerifiedData(result.data!);
      setStep('details');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBorrowing = async () => {
    setConfirmAction('confirm');
  };

  const handleCancelBorrowing = async () => {
    setConfirmAction('cancel');
  };

  const executeConfirmBorrowing = async () => {
    setConfirmAction(null);

    if (!verifiedData) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiFetch<ConfirmData>('/dashboard/librarian/confirm-borrowing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrow_id: verifiedData.borrowId }),
      });

      if (!result.success) {
        setError(result.message || 'Borrowing confirmation failed');
        return;
      }

      setResultMessage(`Borrowing confirmed. Due date: ${new Date(result.data!.due_date).toLocaleDateString()}`);
      setStep('done');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const executeCancelBorrowing = async () => {
    setConfirmAction(null);

    if (!verifiedData) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiFetch('/dashboard/librarian/cancel-borrowing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrow_id: verifiedData.borrowId }),
      });

      if (!result.success) {
        setError(result.message || 'Borrowing cancellation failed');
        return;
      }

      setResultMessage('Borrowing cancelled. Book returned to inventory.');
      setStep('done');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDigits(Array(SLOT_COUNT).fill(''));
    setStep('pin');
    setError(null);
    setVerifiedData(null);
    setResultMessage(null);
    setConfirmAction(null);
    focusSlot(0);
  };

  const pinCode = digits.join('');

  if (step === 'done') {
    return (
      <div className="bg-[#F8EFE6] dark:bg-transparent flex items-center justify-center w-full">
        <div className="flex max-w-[896px] flex-col items-center gap-8 w-full">
          <div className="flex p-8 flex-col items-center rounded-xl border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 w-full shadow-[0_10px_30px_-5px_rgba(26,46,68,0.06)] dark:shadow-none">
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
                Verify Another PIN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'details' && verifiedData) {
    const { borrower, book } = verifiedData;
    const initials =
      (borrower.username || 'U')
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'U';

    return (
      <div className="bg-transparent flex items-center justify-center w-full">
        <div className="flex max-w-[920px] flex-col items-stretch gap-5 w-full">
          <div className="flex items-center gap-3 w-full">
            <div className="flex items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-teal-600/10 dark:bg-teal-400/10 text-teal-700 dark:text-teal-300">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-3 8-10V6l-8-3-8 3v6c0 7 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="flex flex-col items-start min-w-0">
              <h1 className="font-manrope text-[24px] md:text-[26px] font-extrabold leading-tight tracking-tight text-[#091426] dark:text-neutral-100">
                Pickup Verification
              </h1>
              <p className="text-[13px] text-[#75777D] dark:text-neutral-400">
                Review the borrower and book below, then confirm the pickup.
              </p>
            </div>
            <div className="ml-auto shrink-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 text-[11px] font-bold text-teal-700 dark:text-teal-300">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                PIN VERIFIED
              </span>
              <button
                onClick={handleReset}
                aria-label="Close pickup verification"
                title="Close"
                className="flex items-center justify-center w-8 h-8 rounded-full text-[#75777D] dark:text-neutral-400 hover:bg-[#F8F3E9] dark:hover:bg-neutral-700 hover:text-[#43474D] dark:hover:text-neutral-200 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="relative w-full overflow-hidden rounded-2xl border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[0_24px_60px_-24px_rgba(26,46,68,0.28)] dark:shadow-none animate-scale-up">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#091426] via-teal-600 to-[#FFB95F]" />
            <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#FFB95F]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-20 w-56 h-56 rounded-full bg-teal-600/10 blur-3xl" />

            <div className="relative grid md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[#E8E2D5] dark:divide-neutral-700">
              <div className="md:col-span-2 flex flex-col gap-6 p-6 md:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-[#091426] to-teal-800 dark:from-neutral-100 dark:to-neutral-300 text-[#F8EFE6] dark:text-[#091426] font-manrope font-bold text-base shadow-sm">
                    {borrower.avatar ? (
                      <img src={borrower.avatar} alt={borrower.username} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <p className="font-manrope text-lg font-bold truncate w-full text-[#091426] dark:text-neutral-100">
                      {borrower.username}
                    </p>
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                      Borrower
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <DetailItem label="Gender" value={borrower.gender || '—'} />
                  <DetailItem label="Phone" value={borrower.phone_number || '—'} />
                  <div className="col-span-2">
                    <DetailItem label="Email" value={borrower.email || '—'} />
                  </div>
                </div>

                <div className="mt-auto pt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E8E2D5] dark:border-neutral-600 bg-[#F8F3E9] dark:bg-neutral-900 px-2.5 py-1 text-[11px] font-bold text-[#43474D] dark:text-neutral-300">
                    Borrow #{verifiedData.borrowId}
                  </span>
                </div>
              </div>

              <div className="md:col-span-3 flex flex-col gap-5 p-6 md:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-11 h-14 shrink-0 overflow-hidden rounded-md border border-[#E8E2D5] dark:border-neutral-700 bg-[#F8F3E9] dark:bg-neutral-900 shadow-sm">
                    {book.image_url ? (
                      <img src={book.image_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A6A49B]">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-1 min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#75777D] dark:text-neutral-400">
                      Book details
                    </p>
                    <p className="font-manrope text-xl font-extrabold leading-snug text-[#091426] dark:text-neutral-100">
                      {book.title}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <DetailItem label="Author" value={book.author || '—'} />
                  <DetailItem label="Publisher" value={book.publisher || '—'} />
                  <div className="flex flex-col items-start gap-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A6A49B] dark:text-neutral-500">Genre</span>
                    <span className="inline-flex items-center rounded-full border border-[#FFB95F]/40 bg-[#FFB95F]/15 px-2.5 py-0.5 text-xs font-bold text-[#8a5a1a] dark:text-[#FFB95F]">
                      {book.genre || '—'}
                    </span>
                  </div>
                  <DetailItem label="Price" value={book.price || '—'} />
                </div>
              </div>
            </div>

            {error && (
              <div className="relative px-6 md:px-7 pt-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 px-6 md:px-7 py-5 border-t border-[#E8E2D5] dark:border-neutral-700">
              <button
                onClick={handleConfirmBorrowing}
                disabled={loading}
                className="cursor-pointer flex items-center gap-2 rounded-full bg-teal-700 dark:bg-teal-600 px-12 py-3 text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-teal-600 dark:hover:bg-teal-500 transition-all shadow-[0_10px_25px_-10px_rgba(0,111,102,0.6)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.1em]">
                  {loading ? 'Processing...' : 'Confirm Borrowing'}
                </span>
              </button>

              <button
                onClick={handleCancelBorrowing}
                disabled={loading}
                className="cursor-pointer flex items-center gap-2 rounded-full bg-red-500 px-12 py-3 text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-red-400 transition-colors shadow-[0_10px_25px_-10px_rgba(239,68,68,0.6)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                <span className="font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.1em]">
                  {loading ? 'Processing...' : 'Cancel Borrowing'}
                </span>
              </button>
            </div>
          </div>

          {confirmAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 max-w-sm w-full mx-4 shadow-xl">
                <h3 className="text-lg font-bold text-black dark:text-neutral-100 mb-2">
                  {confirmAction === 'confirm' ? 'Confirm Borrowing' : 'Cancel Borrowing'}
                </h3>
                <p className="text-sm text-[#43474D] dark:text-neutral-400 mb-6">
                  {confirmAction === 'confirm'
                    ? `Are you sure you want to confirm this borrowing for "${book.title}"?`
                    : `Are you sure you want to cancel this borrowing for "${book.title}"? This action cannot be undone.`}
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setConfirmAction(null)}
                    disabled={loading}
                    className="px-5 py-2 rounded-full border border-[#E8E2D5] dark:border-neutral-600 text-sm font-medium text-[#43474D] dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={confirmAction === 'confirm' ? executeConfirmBorrowing : executeCancelBorrowing}
                    disabled={loading}
                    className={`px-5 py-2 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed ${
                      confirmAction === 'confirm' ? 'bg-green-600' : 'bg-red-500'
                    }`}
                  >
                    {loading ? 'Processing...' : 'Yes, Proceed'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8EFE6] dark:bg-transparent flex items-center justify-center w-full">
      <div className="flex max-w-[896px] flex-col items-center gap-8 w-full">
        <div className="flex flex-col items-center gap-2 w-full">
          <h1 className="text-[#000] dark:text-neutral-100 font-inter text-[32px] font-bold leading-10 tracking-[0.125em] text-center">
            {t('verification.page_title')}
          </h1>
        </div>

        <div className="flex p-8 flex-col items-start rounded-xl border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 w-full shadow-[0_10px_30px_-5px_rgba(26,46,68,0.06)] dark:shadow-none">
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
                        ? 'border-amber-500 dark:border-amber-400 ring-1 ring-amber-500'
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
                          ? 'border-amber-500 dark:border-amber-400 ring-1 ring-amber-500'
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

            <div className="flex justify-center items-start gap-4 w-full">
              <button
                onClick={handleVerify}
                disabled={pinCode.length !== SLOT_COUNT || loading}
                className="cursor-pointer flex py-3 px-12 items-center gap-2 rounded-full bg-black dark:bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex flex-col items-center">
                  <path d="M4.05417 7.90417L7.35 4.60833L6.51875 3.77708L4.05417 6.24167L2.82917 5.01667L1.99792 5.84792L4.05417 7.90417ZM4.66667 11.6667C3.31528 11.3264 2.19965 10.551 1.31979 9.34062C0.439931 8.13021 0 6.78611 0 5.30833V1.75L4.66667 0L9.33333 1.75V5.30833C9.33333 6.78611 8.8934 8.13021 8.01354 9.34062C7.13368 10.551 6.01806 11.3264 4.66667 11.6667ZM4.66667 10.4417C5.67778 10.1208 6.51389 9.47917 7.175 8.51667C7.83611 7.55417 8.16667 6.48472 8.16667 5.30833V2.55208L4.66667 1.23958L1.16667 2.55208V5.30833C1.16667 6.48472 1.49722 7.55417 2.15833 8.51667C2.81944 9.47917 3.65556 10.1208 4.66667 10.4417Z" fill="white" className="dark:fill-black" />
                </svg>
                <span className="text-white dark:text-black font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.1em]">
                  {loading ? 'Verifying...' : t('verification.verify_button')}
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
