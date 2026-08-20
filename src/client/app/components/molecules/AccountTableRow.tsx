"use client";

import { useI18n } from '../../providers/I18nProvider';
import type { ManagedAccount } from '../../utils/authorizationApi';

interface AccountTableRowProps {
  account: ManagedAccount;
  onPromote: (account: ManagedAccount) => void;
  onDemote: (account: ManagedAccount) => void;
}

const roleStyles: Record<string, string> = {
  admin: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  librarian: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  user: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function AccountTableRow({ account, onPromote, onDemote }: AccountTableRowProps) {
  const { t } = useI18n();

  const canPromote = !account.isSelf && !account.isLastAdmin && account.role !== 'admin';
  const canDemote = !account.isSelf && !account.isLastAdmin && !account.isSeniorAdmin && account.role !== 'user';
  const selfDisabled = account.isSelf;
  const lastAdminDisabled = account.isLastAdmin;
  const seniorAdminDisabled = account.isSeniorAdmin;

  const tooltip = selfDisabled
    ? t('admin.authorization.disabled_self_tooltip')
    : lastAdminDisabled
      ? t('admin.authorization.disabled_last_admin_tooltip')
      : seniorAdminDisabled
        ? t('admin.authorization.disabled_senior_admin_tooltip')
        : undefined;

  return (
    <div
      role="row"
      className="flex pr-6 items-center w-full border-t border-[#E8E2D5] dark:border-neutral-700"
    >
      {/* Account */}
      <div className="flex py-4 px-6 items-center gap-3 w-[260px]">
        <div className="shrink-0">
          {account.avatar ? (
            <img
              src={account.avatar}
              alt={account.username}
              className="w-10 h-10 rounded-full object-cover border border-[#E8E2D5] dark:border-neutral-600"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#486C7E] dark:bg-[#2C4A58] text-white flex items-center justify-center text-sm font-bold">
              {(account.username || '?').trim().charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[#000] dark:text-neutral-100 font-manrope text-sm font-bold leading-5 truncate">
            {account.username}
            {account.isSelf && (
              <span className="ml-1 text-[#006A61] dark:text-[#FFB95F] text-xs font-semibold">
                {t('admin.authorization.you')}
              </span>
            )}
          </p>
          <p className="text-[#686C71] dark:text-neutral-400 text-xs truncate">{account.email}</p>
        </div>
      </div>

      {/* Role */}
      <div className="flex py-4 px-6 flex-col items-start w-[140px]">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleStyles[account.role] || 'bg-gray-100 text-gray-800'}`}>
          {t(`admin.authorization.role_${account.role}`)}
        </span>
        {account.isLastAdmin && account.role === 'admin' && (
          <span className="mt-1 text-[10px] font-semibold text-orange-600 dark:text-orange-300 uppercase tracking-wide">
            {t('admin.authorization.last_admin')}
          </span>
        )}
      </div>

      {/* Status */}
      <div className="flex py-4 px-6 flex-col items-start w-[120px]">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[account.status] || 'bg-gray-100 text-gray-800'}`}>
          {t(`admin.authorization.status_${account.status}`)}
        </span>
      </div>

      {/* Branch */}
      <div className="flex py-4 px-6 flex-col items-start w-[140px]">
        <p className="text-[#1D1C16] dark:text-neutral-300 font-manrope text-sm">
          {account.branchName || '—'}
        </p>
      </div>

      {/* Liabilities */}
      <div className="flex py-4 px-6 flex-col items-start w-[150px]">
        {account.role === 'user' && (account.liabilities.unreturnedBooks > 0 || account.liabilities.unpaidFines > 0) ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
            {account.liabilities.unreturnedBooks > 0 &&
              t('admin.authorization.liabilities_unreturned', { n: account.liabilities.unreturnedBooks })}
            {account.liabilities.unreturnedBooks > 0 && account.liabilities.unpaidFines > 0 && ' · '}
            {account.liabilities.unpaidFines > 0 &&
              t('admin.authorization.liabilities_unpaid', { n: account.liabilities.unpaidFines })}
          </p>
        ) : (
          <p className="text-xs text-neutral-400 dark:text-neutral-500">{t('admin.authorization.liabilities_clean')}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex py-4 pl-6 justify-end items-center gap-2 flex-1" title={tooltip}>
        {account.role !== 'admin' && (
          <button
            onClick={() => onPromote(account)}
            disabled={!canPromote}
            className="px-3 py-1.5 rounded-full border border-[#006A61] text-[#006A61] dark:border-[#FFB95F] dark:text-[#FFB95F] text-xs font-bold hover:bg-teal-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t('admin.authorization.action_promote')}
          </button>
        )}
        {account.role !== 'user' && (
          <button
            onClick={() => onDemote(account)}
            disabled={!canDemote}
            className="px-3 py-1.5 rounded-full border border-[#BA1A1A] text-[#BA1A1A] dark:border-red-400 dark:text-red-300 text-xs font-bold hover:bg-red-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t('admin.authorization.action_demote')}
          </button>
        )}
      </div>
    </div>
  );
}
