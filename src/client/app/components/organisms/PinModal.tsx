"use client";

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../providers/I18nProvider';
import { useCountdownFromDate } from '../../hooks/useCountdown';

interface Props {
  pin: string;
  expiresAt: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function PinModal({ pin, expiresAt, isOpen, onClose, title }: Props) {
  const { t } = useI18n();
  const { minutes, seconds, isExpired } = useCountdownFromDate(expiresAt);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-[#E8F0FE] dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#1A73E8] dark:text-blue-300">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor" />
              </svg>
            </div>
          </div>

          <h2 className="font-manrope text-lg font-bold text-black dark:text-neutral-100 mb-2">
            {title || t('pin.title')}
          </h2>

          <div className="my-6">
            <div className="text-5xl font-mono font-bold tracking-[0.3em] text-[#1A73E8] dark:text-blue-300">
              {pin}
            </div>
          </div>

          {isExpired ? (
            <p className="text-[#D93025] dark:text-red-300 text-sm font-medium">
              {t('pin.expired')}
            </p>
          ) : (
            <p className="text-[#75777D] dark:text-neutral-400 text-sm">
              {t('pin.expires_in', { minutes: String(minutes).padStart(2, '0'), seconds: String(seconds).padStart(2, '0') })}
            </p>
          )}

          <button
            onClick={onClose}
            className="mt-6 w-full py-2.5 text-sm font-bold rounded-full bg-black text-white dark:bg-neutral-100 dark:text-black hover:opacity-80 transition-opacity"
          >
            {t('pin.close')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
