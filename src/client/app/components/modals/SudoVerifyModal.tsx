"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../providers/I18nProvider';

interface SudoVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sudoPassword: string) => Promise<void>;
  title?: string;
  description?: string;
}

export default function SudoVerifyModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
}: SudoVerifyModalProps) {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || typeof window === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await onSubmit(password);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('admin.authorization.sudo_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label={t('admin.authorization.cancel')}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 className="font-manrope text-lg font-bold text-black dark:text-neutral-100 mb-1">
          {title || t('admin.authorization.sudo_title')}
        </h2>
        <p className="text-[#75777D] dark:text-neutral-400 text-sm mb-6">
          {description || t('admin.authorization.sudo_required_hint')}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="sudo-password" className="block text-sm font-semibold text-[#1D1C16] dark:text-neutral-200 mb-1.5">
              {t('admin.authorization.sudo_label')}
            </label>
            <input
              id="sudo-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="w-full h-[52px] px-4 rounded-lg border border-[#C5C6CD] bg-[#F8F9FF] text-base focus:outline-none focus:ring-1 focus:ring-[#006A61] transition-all dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:ring-[#FFB95F]"
            />
          </div>

          {error && (
            <p className="text-[#D93025] dark:text-red-300 text-sm font-medium">{error}</p>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 text-sm font-bold rounded-full border border-[#C5C6CD] text-[#1D1C16] dark:border-neutral-600 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              {t('admin.authorization.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !password}
              className="flex-1 py-2.5 text-sm font-bold rounded-full bg-[#091426] text-white dark:bg-neutral-100 dark:text-[#091426] hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {isLoading ? t('admin.authorization.sudo_loading') : t('admin.authorization.sudo_submit')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
