"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { apiFetch } from '../../utils/apiClient';

const SLOT_COUNT = 6;

type Step = 'pin' | 'details' | 'done';

interface VerifyData {
  reserveId: string;
  reservation: {
    startDate: string;
    startTime: string;
    endTime: string;
  };
  user: {
    userId: string;
    username: string;
    gender: string;
    phoneNumber: string;
    email: string;
    avatar: string | null;
  };
  room: {
    roomName: string;
    description: string;
    capacity: number;
    imgUrl: string | null;
    branchName: string;
    branchAddress: string;
  };
}

export default function RoomCheckinTab() {
  const { t } = useI18n();
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(SLOT_COUNT).fill(null));
  const [digits, setDigits] = useState<string[]>(Array(SLOT_COUNT).fill(''));
  const [activeIndex, setActiveIndex] = useState(-1);
  const [step, setStep] = useState<Step>('pin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedData, setVerifiedData] = useState<VerifyData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
      const result = await apiFetch<VerifyData>('/dashboard/librarian/verify-room-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!result.success) {
        setError(result.message || t('librarian.room_checkin_error_expired'));
        return;
      }

      setVerifiedData(result.data!);
      setStep('details');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckin = async () => {
    setConfirmOpen(false);

    if (!verifiedData) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiFetch('/dashboard/librarian/confirm-room-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reserve_id: verifiedData.reserveId }),
      });

      if (!result.success) {
        setError(result.message || 'Room check-in confirmation failed');
        return;
      }

      setStep('done');
    } catch {
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
    setConfirmOpen(false);
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
                {t('librarian.room_checkin_success')}
              </p>
              <button
                onClick={handleReset}
                className="cursor-pointer flex py-3 px-8 items-center gap-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.1em] hover:opacity-90 transition-opacity"
              >
                {t('librarian.room_checkin_verify_another')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'details' && verifiedData) {
    const { user, room, reservation } = verifiedData;
    return (
      <div className="bg-[#F8EFE6] dark:bg-transparent flex items-center justify-center w-full">
        <div className="flex max-w-[896px] flex-col items-center gap-6 w-full">
          <div className="flex flex-col items-center gap-2 w-full">
            <h1 className="text-[#000] dark:text-neutral-100 font-inter text-[32px] font-bold leading-10 tracking-[0.125em] text-center">
              {t('librarian.room_checkin_title')}
            </h1>
          </div>

          <div className="flex p-8 flex-col rounded-xl border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 w-full shadow-[0_10px_30px_-5px_rgba(26,46,68,0.06)] dark:shadow-none gap-8">
            <div>
              <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.2em] mb-3">
                {t('librarian.room_checkin_user_heading')}
              </p>
              <div className="flex items-center gap-4 mb-4">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <div>
                  <p className="text-[#000] dark:text-neutral-100 font-hankenGrotesk text-base font-bold">{user.username}</p>
                  <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-xs">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.2em] mb-1">PHONE</p>
                  <p className="text-[#000] dark:text-neutral-100 font-hankenGrotesk text-base font-medium">{user.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.2em] mb-1">GENDER</p>
                  <p className="text-[#000] dark:text-neutral-100 font-hankenGrotesk text-base font-medium">{user.gender || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E8E2D5] dark:border-neutral-700 pt-6">
              <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.2em] mb-3">
                {t('librarian.room_checkin_room_heading')}
              </p>
              <div className="flex items-center gap-4 mb-4">
                {room.imgUrl ? (
                  <img src={room.imgUrl} alt={room.roomName} className="w-20 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-16 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <path d="M3 10h18" />
                    </svg>
                  </div>
                )}
                <div>
                  <p className="text-[#000] dark:text-neutral-100 font-hankenGrotesk text-base font-bold">{room.roomName}</p>
                  <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-xs">{room.branchName}{room.branchAddress ? ` · ${room.branchAddress}` : ''}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.2em] mb-1">CAPACITY</p>
                  <p className="text-[#000] dark:text-neutral-100 font-hankenGrotesk text-base font-medium">{room.capacity} people</p>
                </div>
                <div>
                  <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.2em] mb-1">DATE</p>
                  <p className="text-[#000] dark:text-neutral-100 font-hankenGrotesk text-base font-medium">
                    {new Date(reservation.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.2em] mb-1">TIME</p>
                  <p className="text-[#000] dark:text-neutral-100 font-hankenGrotesk text-base font-medium">
                    {reservation.startTime.slice(0, 5)} - {reservation.endTime.slice(0, 5)}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {confirmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 max-w-sm w-full mx-4 shadow-xl">
                  <h3 className="text-lg font-bold text-black dark:text-neutral-100 mb-2">
                    {t('librarian.room_checkin_confirm_title')}
                  </h3>
                  <p className="text-sm text-[#43474D] dark:text-neutral-400 mb-6">
                    {t('librarian.room_checkin_confirm_message', { user: user.username, room: room.roomName })}
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setConfirmOpen(false)}
                      disabled={loading}
                      className="px-5 py-2 rounded-full border border-[#E8E2D5] dark:border-neutral-600 text-sm font-medium text-[#43474D] dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      {t('librarian.room_checkin_go_back')}
                    </button>
                    <button
                      onClick={handleConfirmCheckin}
                      disabled={loading}
                      className="px-5 py-2 rounded-full text-sm font-bold text-white bg-green-600 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? t('librarian.room_checkin_confirming') : t('librarian.room_checkin_proceed')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center items-start gap-4 w-full">
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={loading}
                className="cursor-pointer flex py-3 px-12 items-center gap-2 rounded-full bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                <span className="text-white font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.1em]">
                  {loading ? t('librarian.room_checkin_confirming') : t('librarian.room_checkin_confirm')}
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
    );
  }

  return (
    <div className="bg-[#F8EFE6] dark:bg-transparent flex items-center justify-center w-full">
      <div className="flex max-w-[896px] flex-col items-center gap-8 w-full">
        <div className="flex flex-col items-center gap-2 w-full">
          <h1 className="text-[#000] dark:text-neutral-100 font-inter text-[32px] font-bold leading-10 tracking-[0.125em] text-center">
            {t('librarian.room_checkin_title')}
          </h1>
        </div>

        <div className="flex p-8 flex-col items-start rounded-xl border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 w-full shadow-[0_10px_30px_-5px_rgba(26,46,68,0.06)] dark:shadow-none">
          <div className="flex py-8 px-0 flex-col items-center w-full">
            <div className="flex pb-8 flex-col items-start w-fit">
              <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.2em]">
                {t('librarian.room_checkin_enter_code_label')}
              </p>
            </div>

            <div className="flex pb-12 flex-col items-start w-fit" onPaste={handlePaste}>
              <div className="flex items-start gap-4 w-fit">
                {digits.map((d, i) => (
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
