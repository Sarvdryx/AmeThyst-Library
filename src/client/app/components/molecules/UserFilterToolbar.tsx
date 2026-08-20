"use client";

import { useI18n } from '../../providers/I18nProvider';

interface UserFilterToolbarProps {
  search: string;
  selectedRole: string;
  selectedStatus: string;
  onSearchChange: (val: string) => void;
  onRoleChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onExportClick: () => void;
  loading?: boolean;
}

export default function UserFilterToolbar({
  search,
  selectedRole,
  selectedStatus,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onExportClick,
  loading = false,
}: UserFilterToolbarProps) {
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-neutral-800 p-5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left Side: Search & dropdown filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 w-full max-w-4xl">
        
        {/* Search text input */}
        <div className="relative w-full sm:w-80 shrink-0">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            className="w-full bg-[#F8F3E9] dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md py-2.5 pl-10 pr-4 text-sm text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-300"
            placeholder={t('admin.search_placeholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t('admin.search_placeholder')}
          />
        </div>

        {/* Role Filter dropdown */}
        <div className="relative w-full sm:w-48 shrink-0">
          <select
            className="w-full bg-[#F8F3E9] dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md py-2.5 px-4 pr-10 text-sm text-neutral-800 dark:text-neutral-100 appearance-none focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-300"
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value)}
            aria-label="Filter by Role"
          >
            <option value="">{t('admin.filter_all_roles')}</option>
            <option value="admin">{t('admin.badge_admin')}</option>
            <option value="librarian">{t('admin.badge_librarian')}</option>
            <option value="user">{t('admin.badge_user')}</option>
          </select>
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>

        {/* Status Filter dropdown */}
        <div className="relative w-full sm:w-48 shrink-0">
          <select
            className="w-full bg-[#F8F3E9] dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md py-2.5 px-4 pr-10 text-sm text-neutral-800 dark:text-neutral-100 appearance-none focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-300"
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter by Status"
          >
            <option value="">{t('admin.filter_all_statuses')}</option>
            <option value="active">{t('admin.status_active')}</option>
            <option value="suspended">{t('admin.status_suspended')}</option>
          </select>
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>

      </div>

      {/* Right Side: CSV Export outlined button */}
      <button
        onClick={onExportClick}
        disabled={loading}
        className="w-full md:w-auto px-5 py-2.5 border-2 border-neutral-800 dark:border-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 font-extrabold text-sm rounded-md tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        aria-label={t('admin.button_export_csv')}
      >
        <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {t('admin.button_export_csv')}
      </button>
    </div>
  );
}
