"use client";

import { useState } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import type { Reservation } from './ReservationCard';
import RoomHistoryCard, { formatDuration } from './RoomHistoryCard';

interface Props {
  bookings: Reservation[];
  onFilter?: (from?: string, to?: string) => void;
  onClear?: () => void;
}

export default function PastBookingsTable({ bookings, onFilter, onClear }: Props) {
  const { t } = useI18n();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const handleApply = () => {
    onFilter?.(from || undefined, to || undefined);
  };

  const handleClear = () => {
    setFrom('');
    setTo('');
    onClear?.();
  };

  return (
    <div>
      {/* Filter toolbar */}
      {onFilter && (
        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#75777D] dark:text-neutral-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>{t('room.history_count', { count: bookings.length })}</span>
          </div>

          <div className="flex flex-wrap items-end gap-3 sm:ml-auto">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#74777D] dark:text-neutral-400 mb-1">
                {t('room.history_filter_from')}
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-[#1D1C16] dark:text-neutral-200 outline-none focus:border-[#FFB95F] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#74777D] dark:text-neutral-400 mb-1">
                {t('room.history_filter_to')}
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-[#1D1C16] dark:text-neutral-200 outline-none focus:border-[#FFB95F] transition-colors"
              />
            </div>
            <button
              onClick={handleApply}
              className="py-2 px-5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 transition-opacity"
            >
              {t('room.history_apply')}
            </button>
            <button
              onClick={handleClear}
              className="py-2 px-5 rounded-full border border-[#E8E2D5] dark:border-neutral-600 text-[#75777D] dark:text-neutral-400 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              {t('room.history_clear')}
            </button>
          </div>
        </div>
      )}

      {/* Stay cards */}
      <div className="space-y-4">
        {bookings.map((b) => (
          <RoomHistoryCard key={b.reserveId} booking={b} />
        ))}
      </div>
    </div>
  );
}
