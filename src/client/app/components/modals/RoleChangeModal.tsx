"use client";

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../providers/I18nProvider';
import SudoVerifyModal from './SudoVerifyModal';
import { CustomSelect } from '../atoms/CustomSelect';
import { getBranches, type ManagedAccount, type Branch } from '../../utils/authorizationApi';

interface RoleChangeModalProps {
  isOpen: boolean;
  mode: 'promote' | 'demote';
  account: ManagedAccount | null;
  onClose: () => void;
  onSubmit: (targetRole: string, branchId?: number, sudoPassword?: string) => Promise<void>;
}

export default function RoleChangeModal({ isOpen, mode, account, onClose, onSubmit }: RoleChangeModalProps) {
  const { t } = useI18n();
  const [targetRole, setTargetRole] = useState('');
  const [showSudo, setShowSudo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const roleOptions = useMemo(() => {
    if (!account) return [];
    if (mode === 'promote') {
      if (account.role === 'user') return ['librarian', 'admin'];
      if (account.role === 'librarian') return ['admin'];
      return [];
    }
    if (account.role === 'librarian') return ['user'];
    if (account.role === 'admin') return ['librarian', 'user'];
    return [];
  }, [account, mode]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTargetRole(roleOptions[0] || '');
      setShowSudo(false);
      setError(null);
      setBranchId(null);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, roleOptions]);

  useEffect(() => {
    if (!isOpen || !account) return;
    const roleNeedsBranch = mode === 'promote' ? targetRole === 'librarian' : targetRole === 'librarian';
    if (!roleNeedsBranch) return;
    let cancelled = false;
    setBranchesLoading(true);
    (async () => {
      const res = await getBranches();
      if (cancelled) return;
      if (res.success && Array.isArray(res.data)) {
        setBranches(res.data);
        setBranchId((prev) => prev ?? res.data?.[0]?.branch_id ?? null);
      }
      setBranchesLoading(false);
    })();
    return () => { cancelled = true; };
  }, [isOpen, account, mode, targetRole]);

  if (!isOpen || !account || typeof window === 'undefined') return null;

  const needsSudo = mode === 'promote'
    ? targetRole === 'admin'
    : account.role === 'admin';

  const isBlockedByLiabilities =
    mode === 'promote' &&
    account.role === 'user' &&
    (account.liabilities.unreturnedBooks > 0 || account.liabilities.unpaidFines > 0);

  const handleConfirm = async () => {
    if (!targetRole || isSubmitting) return;
    if (targetRole === 'librarian' && !branchId) {
      setError(t('admin.authorization.branch_required'));
      return;
    }
    if (needsSudo) {
      setShowSudo(true);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(targetRole, branchId ?? undefined);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('admin.authorization.toast_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === 'promote'
    ? t('admin.authorization.promote_title', { username: account.username })
    : t('admin.authorization.demote_title', { username: account.username });

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
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

            <h2 className="font-manrope text-lg font-bold text-black dark:text-neutral-100 mb-1">{title}</h2>
            <p className="text-[#75777D] dark:text-neutral-400 text-sm mb-6">
              {account.email}
            </p>

            {isBlockedByLiabilities && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-[#D93025] dark:text-red-300 text-sm font-medium">
                  {t('admin.authorization.liability_blocked')}
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#1D1C16] dark:text-neutral-200 mb-1.5">
                {t('admin.authorization.target_role_label')}
              </label>
              <div className="flex gap-2">
                {roleOptions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-bold transition-colors ${
                      targetRole === role
                        ? 'border-[#006A61] dark:border-[#FFB95F] bg-teal-50 dark:bg-neutral-700 text-[#006A61] dark:text-[#FFB95F]'
                        : 'border-[#E8E2D5] dark:border-neutral-600 text-[#1D1C16] dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {t(`admin.authorization.role_${role}`)}
                  </button>
                ))}
              </div>
            </div>

            {targetRole === 'librarian' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-[#1D1C16] dark:text-neutral-200 mb-1.5">
                  {t('admin.authorization.branch_label')}
                </label>
                {branchesLoading ? (
                  <div className="h-10 px-4 rounded-lg border border-[#C5C6CD] bg-[#F8F9FF] flex items-center text-sm text-neutral-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
                    {t('admin.authorization.branch_loading')}
                  </div>
                ) : branches.length === 0 ? (
                  <p className="text-[#D93025] dark:text-red-300 text-sm font-medium">
                    {t('admin.authorization.branch_unavailable')}
                  </p>
                ) : (
                  <CustomSelect
                    options={branches.map((b) => ({
                      value: String(b.branch_id),
                      label: `${b.name} (${b.name_short})`,
                    }))}
                    value={branchId ? String(branchId) : ''}
                    onChange={(v) => setBranchId(Number(v))}
                  />
                )}
              </div>
            )}

            {mode === 'demote' && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
                  {t('admin.authorization.demote_warning')}
                </p>
              </div>
            )}

            {needsSudo && !showSudo && (
              <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
                {t('admin.authorization.sudo_required_hint')}
              </p>
            )}

            {error && (
              <p className="mb-4 text-[#D93025] dark:text-red-300 text-sm font-medium">{error}</p>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-sm font-bold rounded-full border border-[#C5C6CD] text-[#1D1C16] dark:border-neutral-600 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                {t('admin.authorization.cancel')}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting || isBlockedByLiabilities || roleOptions.length === 0 || (targetRole === 'librarian' && !branchId)}
                className="flex-1 py-2.5 text-sm font-bold rounded-full bg-[#091426] text-white dark:bg-neutral-100 dark:text-[#091426] hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? t('admin.authorization.sudo_loading') : t('admin.authorization.confirm')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <SudoVerifyModal
        isOpen={showSudo}
        onClose={() => setShowSudo(false)}
        onSubmit={async (sudoPassword) => {
          await onSubmit(targetRole, branchId ?? undefined, sudoPassword);
        }}
      />
    </>
  );
}
