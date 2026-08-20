"use client";

import React from 'react';
import { useI18n } from '../../../providers/I18nProvider';

export default function StatisticsHeaderFilter({
  timeframe,
  setTimeframe,
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full pb-2">
      <div>
        <h1 className="font-hankenGrotesk text-3xl font-bold text-black dark:text-white tracking-tight">
          {t('admin.sidebar_statistics')}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Timeframe Pill Toggles */}
        <div className="inline-flex p-1 bg-stone-100 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 rounded-full shadow-sm">
          <button
            type="button"
            onClick={() => setTimeframe('week')}
            className={`px-4 py-1.5 text-xs font-bold font-hankenGrotesk rounded-full transition-all ${
              timeframe === 'week'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow'
                : 'text-stone-600 dark:text-neutral-300 hover:text-black dark:hover:text-white'
            }`}
          >
            {t('admin.filter_this_week')}
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('month')}
            className={`px-4 py-1.5 text-xs font-bold font-hankenGrotesk rounded-full transition-all ${
              timeframe === 'month'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow'
                : 'text-stone-600 dark:text-neutral-300 hover:text-black dark:hover:text-white'
            }`}
          >
            {t('admin.filter_this_month')}
          </button>
        </div>
      </div>
    </div>
  );
}
