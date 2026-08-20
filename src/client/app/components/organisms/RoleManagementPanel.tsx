"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { Input, Button } from '../atoms';
import FilterDropdown from '../molecules/FilterDropdown';
import AccountTableRow from '../molecules/AccountTableRow';
import RoleChangeModal from '../modals/RoleChangeModal';
import InviteAdminModal from '../modals/InviteAdminModal';
import {
  listUsers,
  promoteUser,
  demoteUser,
  inviteAdmin,
  type ManagedAccount,
  type UsersResult,
} from '../../utils/authorizationApi';

const LIMIT = 20;

export default function RoleManagementPanel() {
  const { t } = useI18n();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<UsersResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleModal, setRoleModal] = useState<{ mode: 'promote' | 'demote'; account: ManagedAccount } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAuthError = useCallback((code?: string) => {
    if (code === 'MUST_CHANGE_PASSWORD' && typeof window !== 'undefined') {
      window.location.href = '/profile/security';
      return true;
    }
    return false;
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await listUsers({ search, role, status, page, limit: LIMIT });
    if (res.success && res.data) {
      setData(res.data);
    } else {
      if (handleAuthError(res.error?.code)) return;
      setError(res.message || t('admin.authorization.loading'));
    }
    setLoading(false);
  }, [search, role, status, page, t, handleAuthError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, role, status]);

  const dismissToast = useCallback(() => setToast(null), []);

  const submitRoleChange = useCallback(
    (mode: 'promote' | 'demote', account: ManagedAccount) =>
      async (targetRole: string, branchId?: number, sudoPassword?: string) => {
        const res = mode === 'promote'
          ? await promoteUser(account.userId, targetRole as 'librarian' | 'admin', branchId, sudoPassword)
          : await demoteUser(account.userId, targetRole as 'user' | 'librarian', branchId, sudoPassword);

        if (!res.success) {
          if (handleAuthError(res.error?.code)) return;
          throw new Error(res.message || t('admin.authorization.toast_error'));
        }

        setToast({
          message: res.message || (mode === 'promote'
            ? t('admin.authorization.promote_success')
            : t('admin.authorization.demote_success')),
          type: 'success',
        });
        setRoleModal(null);
        fetchUsers();
      },
    [t, handleAuthError, fetchUsers]
  );

  const submitInvite = useCallback(
    async (email: string, sudoPassword: string) => {
      const res = await inviteAdmin(email, sudoPassword);
      if (!res.success) {
        if (handleAuthError(res.error?.code)) return;
        throw new Error(res.message || t('admin.authorization.toast_error'));
      }
      setToast({ message: res.message || t('admin.authorization.invite_success'), type: 'success' });
      setInviteOpen(false);
      fetchUsers();
    },
    [t, handleAuthError, fetchUsers]
  );

  const pagination = data?.pagination;

  return (
    <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-[#E8E2D5] dark:border-neutral-700 shadow-sm overflow-hidden">
      <div className="flex flex-wrap gap-3 p-6 items-center justify-between border-b border-[#E8E2D5] dark:border-neutral-700">
        <h2 className="font-manrope text-xl font-bold text-[#1A2E44] dark:text-neutral-100">
          {t('admin.authorization.panel_title')}
        </h2>
        <Button variant="primary" className="px-5 h-11" onClick={() => setInviteOpen(true)}>
          {t('admin.authorization.invite_admin')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 p-6 items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.authorization.search_placeholder')}
          className="max-w-xs h-11"
        />
        <FilterDropdown
          label={t('admin.authorization.filter_role')}
          value={role}
          onChange={(v) => setRole(v || 'all')}
          options={[
            { value: 'all', label: t('admin.authorization.role_all') },
            { value: 'user', label: t('admin.authorization.role_user') },
            { value: 'librarian', label: t('admin.authorization.role_librarian') },
            { value: 'admin', label: t('admin.authorization.role_admin') },
          ]}
        />
        <FilterDropdown
          label={t('admin.authorization.filter_status')}
          value={status}
          onChange={(v) => setStatus(v || 'all')}
          options={[
            { value: 'all', label: t('admin.authorization.status_all') },
            { value: 'active', label: t('admin.authorization.status_active') },
            { value: 'suspended', label: t('admin.authorization.status_suspended') },
          ]}
        />
      </div>

      {loading && !data ? (
        <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
          {t('admin.authorization.loading')}
        </div>
      ) : error ? (
        <div className="p-12 text-center">
          <p className="text-[#D93025] dark:text-red-300 font-medium">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchUsers}>
            {t('admin.authorization.retry')}
          </Button>
        </div>
      ) : !data || data.users.length === 0 ? (
        <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
          {t('admin.authorization.empty')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex pr-6 items-center w-full border-b border-[#E8E2D5] dark:border-neutral-700">
            <div className="flex py-3 px-6 items-center w-[260px]">
              <span className="text-[#686C71] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold tracking-[0.05em] uppercase">
                {t('admin.authorization.col_account')}
              </span>
            </div>
            <div className="flex py-3 px-6 items-start w-[140px]">
              <span className="text-[#686C71] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold tracking-[0.05em] uppercase">
                {t('admin.authorization.col_role')}
              </span>
            </div>
            <div className="flex py-3 px-6 items-start w-[120px]">
              <span className="text-[#686C71] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold tracking-[0.05em] uppercase">
                {t('admin.authorization.col_status')}
              </span>
            </div>
            <div className="flex py-3 px-6 items-start w-[140px]">
              <span className="text-[#686C71] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold tracking-[0.05em] uppercase">
                {t('admin.authorization.col_branch')}
              </span>
            </div>
            <div className="flex py-3 px-6 items-start w-[150px]">
              <span className="text-[#686C71] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold tracking-[0.05em] uppercase">
                {t('admin.authorization.col_liabilities')}
              </span>
            </div>
            <div className="flex py-3 px-6 justify-end items-start flex-1">
              <span className="text-[#686C71] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold tracking-[0.05em] uppercase">
                {t('admin.authorization.col_actions')}
              </span>
            </div>
          </div>

          {data.users.map((account) => (
            <AccountTableRow
              key={account.userId}
              account={account}
              onPromote={(acc) => setRoleModal({ mode: 'promote', account: acc })}
              onDemote={(acc) => setRoleModal({ mode: 'demote', account: acc })}
            />
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex p-4 justify-between items-center border-t border-[#E8E2D5] dark:border-neutral-700">
              <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.05em]">
                {t('admin.authorization.page_of', { current: pagination.page, total: pagination.totalPages })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex justify-center items-center rounded-full border border-[#E8E2D5] dark:border-neutral-600 w-9 h-9 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  aria-label={t('admin.authorization.previous_page')}
                >
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                    <path d="M6 12L0 6L6 0L7.4 1.4L2.8 6L7.4 10.6L6 12Z" fill="#1D1C16" className="dark:fill-neutral-300" />
                  </svg>
                </button>
                <span className="font-manrope text-sm font-semibold text-[#1D1C16] dark:text-neutral-200">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="flex justify-center items-center rounded-full border border-[#E8E2D5] dark:border-neutral-600 w-9 h-9 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  aria-label={t('admin.authorization.next_page')}
                >
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                    <path d="M4.6 6L0 1.4L1.4 0L7.4 6L1.4 12L0 10.6L4.6 6Z" fill="#1D1C16" className="dark:fill-neutral-300" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {roleModal && (
        <RoleChangeModal
          isOpen
          mode={roleModal.mode}
          account={roleModal.account}
          onClose={() => setRoleModal(null)}
          onSubmit={submitRoleChange(roleModal.mode, roleModal.account)}
        />
      )}

      <InviteAdminModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} onSubmit={submitInvite} />

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70]">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg font-inter text-sm font-semibold ${
              toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
            <button onClick={dismissToast} className="ml-3 opacity-70 hover:opacity-100" aria-label="close">
              &times;
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
