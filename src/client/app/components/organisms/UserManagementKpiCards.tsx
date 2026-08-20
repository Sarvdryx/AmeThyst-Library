"use client";

import { useI18n } from '../../providers/I18nProvider';
import { StatsData } from '../../types/admin';

interface UserManagementKpiCardsProps {
  stats: StatsData;
  loading: boolean;
}

export default function UserManagementKpiCards({ stats, loading }: UserManagementKpiCardsProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* KPI 1: Total Users */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden flex flex-col justify-between h-[135px]">
        <div>
          <p className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400 tracking-wider">
            {t('admin.stat_total_users')}
          </p>
          <p className="text-4xl font-black text-neutral-800 dark:text-neutral-100 mt-2 font-manrope">
            {loading ? '...' : stats.totalUsers.toLocaleString()}
          </p>
        </div>
        <div className="absolute right-4 bottom-4 opacity-5 dark:opacity-10 text-neutral-800 dark:text-neutral-100">
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        </div>
      </div>

      {/* KPI 2: Active Users */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden flex flex-col justify-between h-[135px]">
        <div>
          <p className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400 tracking-wider">
            {t('admin.stat_active_users')}
          </p>
          <p className="text-4xl font-black text-neutral-800 dark:text-neutral-100 mt-2 font-manrope">
            {loading ? '...' : stats.activeUsers.toLocaleString()}
          </p>
        </div>
        <div className="mt-3 w-full">
          <div className="w-full bg-[#F2EDE3] dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-neutral-800 dark:bg-neutral-300 h-full transition-all duration-500" 
              style={{ width: stats.totalUsers > 0 ? `${(stats.activeUsers / stats.totalUsers) * 100}%` : '0%' }}
            />
          </div>
        </div>
        <div className="absolute right-4 bottom-4 opacity-5 dark:opacity-10 text-neutral-800 dark:text-neutral-100">
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
      </div>

      {/* KPI 3: Suspended Users */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden flex flex-col justify-between h-[135px]">
        <div>
          <p className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400 tracking-wider">
            {t('admin.stat_suspended_users')}
          </p>
          <p className="text-4xl font-black text-[#BA1A1A] mt-2 font-manrope">
            {loading ? '...' : stats.suspendedUsers.toLocaleString()}
          </p>
        </div>
        <p className="text-xs font-bold text-[#BA1A1A] tracking-wider uppercase mt-2">
          ⚠️ {t('admin.stat_requires_review')}
        </p>
        <div className="absolute right-4 bottom-4 opacity-10 text-[#BA1A1A]">
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>
      </div>

      {/* KPI 4: Librarians Count */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden flex flex-col justify-between h-[135px]">
        <div>
          <p className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400 tracking-wider">
            {t('admin.stat_librarians_count')}
          </p>
          <p className="text-4xl font-black text-neutral-800 dark:text-neutral-100 mt-2 font-manrope">
            {loading ? '...' : stats.librariansCount.toLocaleString()}
          </p>
        </div>
        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-2">
          {t('admin.stat_staff_directory')}
        </p>
        <div className="absolute right-4 bottom-4 opacity-5 dark:opacity-10 text-neutral-800 dark:text-neutral-100">
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 11.55C9.64 9.35 6.48 8 3 8v11c3.48 0 6.64 1.35 9 3.55 2.36-2.2 5.52-3.55 9-3.55V8c-3.48 0-6.64 1.35-9 3.55zM12 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z" />
          </svg>
        </div>
      </div>

    </div>
  );
}
