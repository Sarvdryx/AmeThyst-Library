"use client";

import { useI18n } from '../../providers/I18nProvider';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../utils/apiClient';
import { localizedDesc, localizedBranchName } from '../../utils/room';
import { PinModal } from '../organisms';

export interface Reservation {
  reserveId: string;
  startDate: string;
  startTime: string;
  endTime: string;
  status: 'used' | 'pending' | 'reserved';
  roomName: string;
  imgUrl: string | null;
  description: string;
  capacity: number;
  roomId: number;
  branchId: number;
  branchName: string;
  pin?: string | null;
  expiresAt?: string | null;
  checkinTime?: string | null;
  checkoutTime?: string | null;
}

interface Props {
  reservation: Reservation;
  onCancelled?: () => void;
}

export default function ReservationCard({ reservation, onCancelled }: Props) {
  const { t } = useI18n();
  const [imgError, setImgError] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generatingPin, setGeneratingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinErrorFading, setPinErrorFading] = useState(false);
  const [pin, setPin] = useState<string | null>(reservation.pin ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(reservation.expiresAt ?? null);
  const [pinModal, setPinModal] = useState<{ open: boolean; pin: string; expiresAt: string }>({ open: false, pin: '', expiresAt: '' });
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [now, setNow] = useState(() => new Date().getTime());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date().getTime()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!pinError) return;
    const fadeTimer = setTimeout(() => setPinErrorFading(true), 3000);
    const clearTimer = setTimeout(() => setPinError(null), 3300);
    return () => { clearTimeout(fadeTimer); clearTimeout(clearTimer); };
  }, [pinError]);

  const showPinError = useCallback((message: string) => {
    setPinError(message);
    setPinErrorFading(false);
  }, []);

  const formatTime = (timeStr: string) => timeStr.slice(0, 5);

  const displayStatus = reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1);
  const statusColor =
    reservation.status === 'reserved'
      ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300';

  const displayDate = new Date(reservation.startDate).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const slotDate = reservation.startDate.slice(0, 10);
  const isSlotElapsed = now >= new Date(`${slotDate}T${reservation.endTime}`).getTime();
  const isCheckedIn = reservation.status === 'used';
  const isCheckedOut = checkedOut || Boolean(reservation.checkoutTime);

  const showCheckout = isCheckedIn;

  const handleCheckout = async () => {
    if (checkingOut) return;
    setCheckingOut(true);
    setPinError(null);
    try {
      const result = await apiFetch<{ alreadyCheckedOut: boolean }>(`/api/rooms/reserve/${reservation.reserveId}/checkout`, { method: 'POST' });
      if (result.success) {
        setCheckedOut(true);
        onCancelled?.();
      } else {
        showPinError(result.message || t('room.checkout_failed'));
      }
    } catch {
      showPinError(t('room.checkout_failed'));
    } finally {
      setCheckingOut(false);
    }
  };

  const handleGeneratePin = async () => {
    if (generatingPin) return;
    setGeneratingPin(true);
    setPinError(null);
    try {
      if (pin && expiresAt && new Date(expiresAt).getTime() > Date.now()) {
        setPinModal({ open: true, pin, expiresAt });
        return;
      }
      const result = await apiFetch<{ pin: string; expiresAt: string }>(`/api/rooms/reserve/${reservation.reserveId}/pin`, { method: 'POST' });
      if (result.success && result.data) {
        setPin(result.data.pin);
        setExpiresAt(result.data.expiresAt);
        setPinModal({ open: true, pin: result.data.pin, expiresAt: result.data.expiresAt });
      } else {
        showPinError(result.message || 'Failed to generate PIN');
      }
    } catch {
      showPinError('Network error. Please try again.');
    } finally {
      setGeneratingPin(false);
    }
  };

  const handleCleanupPin = useCallback(async () => {
    try {
      await apiFetch(`/api/rooms/reserve/${reservation.reserveId}/pin/cleanup`, { method: 'POST' });
    } catch {
      // Best-effort cleanup; server expiry handles staleness regardless.
    }
  }, [reservation.reserveId]);

  useEffect(() => {
    if (!pin || !expiresAt) return;
    const expiresMs = new Date(expiresAt).getTime();
    const delay = expiresMs - Date.now();
    if (delay <= 0) return;
    const timer = setTimeout(() => {
      setPin(null);
      setExpiresAt(null);
      setPinModal((m) => (m.open ? { open: false, pin: '', expiresAt: '' } : m));
      handleCleanupPin();
    }, delay);
    return () => clearTimeout(timer);
  }, [pin, expiresAt, handleCleanupPin]);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      {/* Banner Image */}
      <div className="w-full h-40 rounded-t-xl overflow-hidden bg-[#F8F3E9] dark:bg-neutral-700 flex items-center justify-center">
        {reservation.imgUrl && !imgError ? (
          <img
            src={reservation.imgUrl}
            alt={reservation.roomName}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-neutral-400">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 3v18" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="font-manrope text-xl font-bold text-[#1D1C16] dark:text-neutral-100 leading-tight">
              {reservation.roomName}
            </h3>
            <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold leading-4 ${statusColor}`}>
              {displayStatus}
            </span>
          </div>

          <p className="text-xs text-[#75777D] dark:text-neutral-400 leading-relaxed">
            {localizedDesc(t, reservation.roomId, reservation.description) || ''}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-[#75777D] dark:text-neutral-400">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{displayDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{localizedBranchName(t, reservation.branchId, reservation.branchName)}</span>
            </div>
          </div>
        </div>

      <div className="mx-5 border-t border-[#E8E2D5] dark:border-neutral-700" />

      <div className="p-5 pt-4 flex gap-2">
        {showCheckout ? (
          <button
            onClick={() => setShowCheckoutConfirm(true)}
            disabled={checkingOut || isCheckedOut || !isSlotElapsed}
            className="flex-1 py-2 text-xs font-bold rounded-full bg-[#1A73E8] text-white hover:opacity-85 transition-opacity disabled:opacity-60"
          >
            {checkingOut ? '...' : isCheckedOut ? t('room.checked_out') : t('room.checkout_confirm')}
          </button>
        ) : (
          <>
            <button
              onClick={handleGeneratePin}
              disabled={generatingPin}
              className="flex-1 py-2 text-xs font-bold rounded-full bg-[#FFB95F] text-[#091426] hover:bg-[#e6a54d] transition-colors disabled:opacity-60"
            >
              {generatingPin ? '...' : pin ? t('room.view_pin') : t('room.create_pin')}
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex-1 py-2 text-xs font-bold rounded-full border border-[#E8E2D5] dark:border-neutral-600 text-[#D93025] dark:text-red-300 hover:bg-[#FCE8E6] dark:hover:bg-red-900/30 transition-colors"
            >
              {t('room.cancel')}
            </button>
          </>
        )}
      </div>

      {showCheckout && !isCheckedOut && !isSlotElapsed && (
        <p className="px-5 pb-4 text-xs text-[#75777D] dark:text-neutral-400">
          {t('room.checkout_available_after', { time: formatTime(reservation.endTime) })}
        </p>
      )}

      {showConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowConfirm(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-neutral-800 rounded-xl shadow-xl p-6 w-80 max-w-[90vw]">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-5 text-center">
              {t('room.cancel_confirm_title', { roomName: reservation.roomName })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 text-xs font-bold rounded-full border border-[#E8E2D5] dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                {t('room.cancel_confirm_keep')}
              </button>
              <button
                onClick={async () => {
                  if (cancelling) return;
                  setCancelling(true);
                  const result = await apiFetch(`/api/rooms/reserve/${reservation.reserveId}`, {
                    method: 'DELETE',
                  });
                  setCancelling(false);
                  setShowConfirm(false);
                  if (result.success) {
                    onCancelled?.();
                  }
                }}
                className="flex-1 py-2 text-xs font-bold rounded-full bg-[#D93025] text-white hover:opacity-85 transition-opacity disabled:opacity-50"
              >
                {cancelling ? '...' : t('room.cancel_confirm_cancel')}
              </button>
            </div>
          </div>
        </>
      )}

      {pinError && (
        <p className={`px-5 pb-4 text-xs text-[#D93025] dark:text-red-300 transition-opacity duration-300 ${pinErrorFading ? 'opacity-0' : 'opacity-100'}`}>{pinError}</p>
      )}

      {showCheckoutConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowCheckoutConfirm(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-neutral-800 rounded-xl shadow-xl p-6 w-80 max-w-[90vw]">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-5 text-center">
              {t('room.checkout_confirm_title', { roomName: reservation.roomName })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setShowCheckoutConfirm(false);
                  await handleCheckout();
                }}
                disabled={checkingOut}
                className="flex-1 py-2 text-xs font-bold rounded-full bg-[#1A73E8] text-white hover:opacity-85 transition-opacity disabled:opacity-60"
              >
                {checkingOut ? '...' : t('room.checkout_confirm_yes')}
              </button>
              <button
                onClick={() => setShowCheckoutConfirm(false)}
                disabled={checkingOut}
                className="flex-1 py-2 text-xs font-bold rounded-full border border-[#E8E2D5] dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                {t('room.cancel_confirm_keep')}
              </button>
            </div>
          </div>
        </>
      )}

      <PinModal
        pin={pinModal.pin}
        expiresAt={pinModal.expiresAt}
        isOpen={pinModal.open}
        onClose={() => setPinModal({ open: false, pin: '', expiresAt: '' })}
      />
    </div>
  );
}
