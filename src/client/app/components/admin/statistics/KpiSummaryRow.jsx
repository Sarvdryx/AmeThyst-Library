"use client";

import React from 'react';
import { useI18n } from '../../../providers/I18nProvider';

export default function KpiSummaryRow({ summaryMetrics }) {
  const { t } = useI18n();

  const totalUsers = summaryMetrics?.totalUsers ?? 0;
  const activeBorrows = summaryMetrics?.activeBorrows ?? 0;
  const overdueBooks = summaryMetrics?.overdueBooksCount ?? 0;
  const totalLateFees = summaryMetrics?.totalLateFees ?? 0;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* Card 1: Total Users */}
      <div className="relative overflow-hidden bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm border border-stone-200/60 dark:border-neutral-700 flex flex-col justify-between h-[110px]">
        <div>
          <span className="text-[11px] font-bold font-hankenGrotesk text-slate-500 dark:text-neutral-400 tracking-wider uppercase truncate block">
            {t('admin.kpi_total_users')}
          </span>
          <div className="flex items-baseline mt-1.5">
            <span className="text-2xl font-bold font-hankenGrotesk text-black dark:text-white tracking-tight">
              {totalUsers.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="absolute right-3 bottom-3 opacity-10 pointer-events-none text-slate-900 dark:text-white">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>

      {/* Card 2: Active Borrows */}
      <div className="relative overflow-hidden bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm border border-stone-200/60 dark:border-neutral-700 flex flex-col justify-between h-[110px]">
        <div>
          <span className="text-[11px] font-bold font-hankenGrotesk text-slate-500 dark:text-neutral-400 tracking-wider uppercase truncate block">
            {t('admin.kpi_active_borrows')}
          </span>
          <div className="flex items-baseline mt-1.5">
            <span className="text-2xl font-bold font-hankenGrotesk text-black dark:text-white tracking-tight">
              {activeBorrows.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="absolute right-3 bottom-3 opacity-10 pointer-events-none text-slate-900 dark:text-white">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
          </svg>
        </div>
      </div>

      {/* Card 3: Overdue Books */}
      <div className="bg-red-50/70 dark:bg-red-950/40 rounded-2xl p-4 shadow-sm border border-red-200 dark:border-red-900/60 flex flex-col justify-between h-[110px]">
        <div>
          <span className="text-[11px] font-bold font-hankenGrotesk text-red-700 dark:text-red-300 tracking-wider uppercase truncate block">
            {t('admin.kpi_overdue_books')}
          </span>
          <div className="flex items-baseline mt-1.5">
            <span className="text-2xl font-bold font-hankenGrotesk text-red-600 dark:text-red-400 tracking-tight">
              {overdueBooks.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-700 dark:text-red-300">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          <span className="truncate">{t('admin.kpi_requires_audit')}</span>
        </div>
      </div>

      {/* Card 4: Total Late Fees */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm border border-stone-200/60 dark:border-neutral-700 flex flex-col justify-between h-[110px]">
        <div>
          <span className="text-[11px] font-bold font-hankenGrotesk text-slate-500 dark:text-neutral-400 tracking-wider uppercase truncate block">
            {t('admin.kpi_total_late_fees')}
          </span>
          <div className="flex items-baseline mt-1.5">
            <span className="text-lg xl:text-xl font-bold font-hankenGrotesk text-black dark:text-white tracking-tight truncate">
              {formatCurrency(totalLateFees)}
            </span>
          </div>
        </div>
        <div className="flex gap-1 mt-1">
          <div className="h-1 flex-1 bg-black/20 dark:bg-white/20 rounded-full" />
          <div className="h-1 flex-1 bg-black/40 dark:bg-white/40 rounded-full" />
          <div className="h-1 flex-1 bg-black/60 dark:bg-white/60 rounded-full" />
          <div className="h-1 flex-1 bg-black dark:bg-white rounded-full" />
        </div>
      </div>
    </div>
  );
}
