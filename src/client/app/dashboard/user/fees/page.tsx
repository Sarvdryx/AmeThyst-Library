"use client";

import { useState, useEffect } from 'react';
import { useI18n } from '../../../providers/I18nProvider';
import { apiFetch } from '../../../utils/apiClient';
import FeesBreakdownPanel from '../../../components/organisms/FeesBreakdownPanel';
import type { Fee } from '../../../data/mockLoansFees';

export default function LoanFeesPage() {
  const { t } = useI18n();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await apiFetch<{ outstanding: any[]; history: any[] }>('/dashboard/user/fees');
        if (result.success && result.data) {
          const { outstanding, history } = result.data;
          const mapped: Fee[] = [
            ...outstanding.map((r: any) => ({
              id: r.penalty_id,
              type: r.issue === 'overdue' ? 'overdue_fine' as const : r.issue === 'damaged' ? 'damage' as const : r.issue === 'lost' ? 'lost_book' as const : 'processing' as const,
              loanId: r.borrow_id,
              bookTitle: r.book_title || '',
              amount: Number(r.penalty_amount),
              issuedDate: r.record_date ? new Date(r.record_date).toLocaleDateString() : '',
              status: 'pending' as const,
              description: r.description || '',
            })),
            ...history.map((r: any) => ({
              id: r.penalty_id,
              type: r.issue === 'overdue' ? 'overdue_fine' as const : r.issue === 'damaged' ? 'damage' as const : r.issue === 'lost' ? 'lost_book' as const : 'processing' as const,
              loanId: r.borrow_id,
              bookTitle: r.book_title || '',
              amount: Number(r.penalty_amount),
              issuedDate: r.record_date ? new Date(r.record_date).toLocaleDateString() : '',
              paidDate: r.paid_at ? new Date(r.paid_at).toLocaleDateString() : undefined,
              status: 'paid' as const,
              description: r.description || '',
            })),
          ];
          setFees(mapped);
        } else {
          setError(result.message || 'Failed to load fees');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-manrope text-[40px] font-bold leading-[54.5px] text-black dark:text-neutral-100">
          {t('dashboard.loan_fees_title')}
        </h1>
      </div>

      {loading ? (
        <div className="py-16 text-center text-neutral-400 font-manrope text-sm">Loading...</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 font-manrope text-sm">{error}</div>
      ) : (
        <FeesBreakdownPanel fees={fees} />
      )}
    </>
  );
}
