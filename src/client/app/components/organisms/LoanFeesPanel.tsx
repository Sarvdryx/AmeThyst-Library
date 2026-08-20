"use client";

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { apiFetch } from '../../utils/apiClient';
import OutstandingDebtRow from '../molecules/OutstandingDebtRow';
import PaidFeeRow from '../molecules/PaidFeeRow';

interface Debt {
  penalty_id: number;
  borrow_id: number;
  user_id: number;
  issue: string;
  description: string;
  penalty_amount: number;
  record_date: string;
  username: string;
  avatar?: string | null;
  book_title?: string;
}

export default function LoanFeesPanel() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [paidFees, setPaidFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebts = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const [outstandingRes, paidRes] = await Promise.all([
        apiFetch<Debt[]>(`/dashboard/librarian/loan-fees/outstanding${params}`),
        apiFetch<any[]>(`/dashboard/librarian/loan-fees/history${params}`),
      ]);
      if (outstandingRes.success) {
        setDebts(outstandingRes.data!);
      } else {
        setError(outstandingRes.message || 'Failed to load debts');
      }
      if (paidRes.success) {
        setPaidFees(paidRes.data!);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchDebts(search || undefined), 300);
    return () => clearTimeout(timeout);
  }, [search, fetchDebts]);

  const totalOutstanding = debts.reduce((s, d) => s + Number(d.penalty_amount), 0);

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-col items-start relative w-[400px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dashboard.loan_fees_librarian_search')}
            className="flex pt-[11px] pr-4 pb-[11px] pl-10 items-center rounded-lg border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800 w-full text-base font-manrope text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#03192E] dark:focus:ring-neutral-400"
          />
          <svg width="17" height="24" viewBox="0 0 17 24" fill="none" className="absolute left-3 top-[11px] w-4 h-6">
            <path d="M15.68 16.38L9.42 10.12C8.92 10.55 8.34 10.88 7.69 11.11C7.04 11.34 6.39 11.46 5.73 11.46C4.13 11.46 2.78 10.91 1.67 9.80C0.56 8.68 0 7.33 0 5.73C0 4.13 0.56 2.78 1.67 1.67C2.78 0.56 4.13 0 5.73 0C7.33 0 8.68 0.56 9.8 1.67C10.91 2.78 11.46 4.13 11.46 5.73C11.46 6.43 11.34 7.10 11.09 7.75C10.85 8.40 10.52 8.95 10.12 9.42L16.38 15.68L15.68 16.38ZM5.73 10.46C7.06 10.46 8.18 10.00 9.09 9.09C10.00 8.18 10.46 7.06 10.46 5.73C10.46 4.40 10.00 3.28 9.09 2.37C8.18 1.46 7.06 1 5.73 1C4.40 1 3.28 1.46 2.37 2.37C1.46 3.28 1 4.40 1 5.73C1 7.06 1.46 8.18 2.37 9.09C3.28 10.00 4.40 10.46 5.73 10.46Z" fill="#74777D" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[0_10px_30px_-5px_rgba(26,46,68,0.06)] rounded-xl w-full overflow-hidden">
        <div className="flex pt-6 px-5 pb-3 items-center justify-between border-b border-[#E8E2D5] dark:border-neutral-700">
          <p className="text-[#43474D] dark:text-neutral-300 font-hankenGrotesk text-sm font-bold tracking-[0.05em]">
            {t('dashboard.loan_fees_title')} ({debts.length})
          </p>
          <span className="text-[#D93025] dark:text-red-300 font-bold text-sm">
            {t('dashboard.loan_fees_pending')}: ${totalOutstanding.toFixed(2)}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-neutral-400 dark:text-neutral-500 font-manrope text-sm">
            Loading...
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-500 dark:text-red-400 font-manrope text-sm">
            {error}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 py-2 px-5 border-b border-[#E8E2D5] dark:border-neutral-700 text-[10px] font-bold text-[#75777D] dark:text-neutral-400 tracking-[0.1em] uppercase">
              <div className="w-10 shrink-0" />
              <div className="flex-1 min-w-0">{t('dashboard.loan_fees_librarian_header_borrower')}</div>
              <div className="w-[120px] shrink-0 text-right">{t('dashboard.loan_fees_librarian_header_amount')}</div>
              <div className="w-[100px] shrink-0 text-right">{t('dashboard.loan_fees_librarian_header_action')}</div>
            </div>
            {debts.length === 0 ? (
              <div className="py-10 text-center text-neutral-400 dark:text-neutral-500 font-manrope text-sm">
                {t('dashboard.loan_fees_librarian_no_debts')}
              </div>
            ) : (
              <div className="divide-y divide-[#F2EDE3] dark:divide-neutral-700/50">
                {debts.map((debt) => (
                  <OutstandingDebtRow
                    key={debt.penalty_id}
                    debt={debt}
                    onPaymentConfirmed={() => fetchDebts(search || undefined)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {paidFees.length > 0 && (
        <div className="flex flex-col border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[0_10px_30px_-5px_rgba(26,46,68,0.06)] rounded-xl w-full overflow-hidden">
          <div className="flex pt-6 px-5 pb-3 items-center border-b border-[#E8E2D5] dark:border-neutral-700">
            <p className="text-[#43474D] dark:text-neutral-300 font-hankenGrotesk text-sm font-bold tracking-[0.05em]">
              {t('dashboard.fees_history')} ({paidFees.length})
            </p>
          </div>
          <div className="flex items-center gap-4 py-2 px-5 border-b border-[#E8E2D5] dark:border-neutral-700 text-[10px] font-bold text-[#75777D] dark:text-neutral-400 tracking-[0.1em] uppercase">
            <div className="w-10 shrink-0" />
            <div className="flex-1 min-w-0">{t('dashboard.loan_fees_librarian_header_borrower')}</div>
            <div className="w-[120px] shrink-0 text-right">{t('dashboard.loan_fees_header_amount')}</div>
            <div className="w-[100px] shrink-0 text-right">{t('dashboard.fees_header_paid_date')}</div>
          </div>
          <div className="divide-y divide-[#F2EDE3] dark:divide-neutral-700/50">
            {paidFees.map((fee: any) => (
              <PaidFeeRow key={fee.penalty_id} fee={fee} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
