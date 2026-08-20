"use client";

import { useState } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import type { Fee } from '../../data/mockLoansFees';
import FeeRow from '../molecules/FeeRow';

interface FeesBreakdownPanelProps {
  fees: Fee[];
}

export default function FeesBreakdownPanel({ fees }: FeesBreakdownPanelProps) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  const filtered = fees.filter((f) => {
    if (filter === 'pending' && f.status !== 'pending') return false;
    if (filter === 'paid' && f.status !== 'paid') return false;
    return true;
  });

  const totalPending = fees.filter((f) => f.status === 'pending').reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h4 className="text-[#75777D] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold tracking-[0.15em] uppercase">
          {t('dashboard.loan_fees_fee_breakdown')}
        </h4>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {(['all', 'pending', 'paid'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-1.5 px-4 rounded-full text-xs font-bold leading-5 transition-colors ${
                  filter === f
                    ? 'bg-black text-white dark:bg-neutral-100 dark:text-black shadow-sm'
                    : 'text-[#43474D] dark:text-neutral-400 hover:text-black dark:hover:text-neutral-200'
                }`}
              >
                {f === 'all' ? t('dashboard.loan_fees_all') : f === 'pending' ? t('dashboard.loan_fees_pending') : t('dashboard.loan_fees_paid')}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <span className="text-[#75777D] dark:text-neutral-400">
              {t('dashboard.loan_fees_pending')}: <span className="font-bold text-[#D93025] dark:text-red-300">${totalPending.toFixed(2)}</span>
            </span>
            <span className="text-[#75777D] dark:text-neutral-400">
              {t('dashboard.loan_fees_paid')}: <span className="font-bold text-black dark:text-neutral-200">${totalPaid.toFixed(2)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-[#F2EDE3] dark:divide-neutral-700/50">
        <div className="flex items-center gap-4 py-2 px-5 text-[10px] font-bold text-[#75777D] dark:text-neutral-400 tracking-[0.1em] uppercase">
          <div className="w-5 shrink-0" />
          <div className="flex-1 min-w-0">{t('dashboard.loan_fees_header_type')}</div>
          <div className="w-[100px] shrink-0 text-right">{t('dashboard.loan_fees_header_amount')}</div>
          <div className="w-20 shrink-0 text-right">{t('dashboard.loan_fees_header_date')}</div>
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 dark:text-neutral-500 font-manrope text-sm">
            {t('dashboard.loan_fees_no_fees')}
          </div>
        ) : (
          filtered.map((fee) => (
            <FeeRow key={fee.id} fee={fee} />
          ))
        )}
      </div>
    </div>
  );
}
