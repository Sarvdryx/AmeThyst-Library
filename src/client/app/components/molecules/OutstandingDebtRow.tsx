"use client";

import { useState } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { apiFetch } from '../../utils/apiClient';
import Amount from '../atoms/Amount';

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

interface OutstandingDebtRowProps {
  debt: Debt;
  onPaymentConfirmed: () => void;
}

export default function OutstandingDebtRow({ debt, onPaymentConfirmed }: OutstandingDebtRowProps) {
  const { t } = useI18n();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleConfirmPayment = async () => {
    setConfirming(true);
    try {
      const result = await apiFetch('/dashboard/librarian/loan-fees/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ penalty_id: debt.penalty_id }),
      });

      if (result.success) {
        onPaymentConfirmed();
      }
    } finally {
      setConfirming(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 py-4 px-5 border-b border-[#F2EDE3] dark:border-neutral-700/50 last:border-0 hover:bg-[#F8F3E9]/30 dark:hover:bg-neutral-700/30 transition-colors w-full">
        <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden">
          {debt.avatar ? (
            <img src={debt.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#D7B6FE] dark:bg-purple-800 flex items-center justify-center">
              <span className="text-[#604382] dark:text-purple-200 font-manrope text-xs font-bold">
                {debt.username.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-manrope text-sm font-bold text-black dark:text-neutral-100">{debt.username}</p>
          {debt.book_title && (
            <p className="text-[#75777D] dark:text-neutral-400 font-inter text-xs mt-0.5 truncate">
              <span className="font-bold">{t('dashboard.loan_fees_header_book')}:</span> {debt.book_title}
            </p>
          )}
          {debt.description && (
            <p className="text-[#75777D] dark:text-neutral-500 font-inter text-[10px] mt-0.5 truncate">
              <span className="font-bold">{t('dashboard.loan_fees_header_description')}:</span> {debt.description}
            </p>
          )}
          <p className="text-[#75777D] dark:text-neutral-500 font-inter text-[10px] mt-0.5">
            {debt.record_date ? new Date(debt.record_date).toLocaleDateString() : ''}
          </p>
        </div>

        <div className="w-[120px] shrink-0 text-right">
          <Amount
            value={debt.penalty_amount}
            className="text-sm font-bold text-[#D93025] dark:text-red-300"
          />
        </div>

        <div className="w-[100px] shrink-0 flex justify-end">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={confirming}
            className="px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-hankenGrotesk text-[11px] font-bold hover:opacity-90 transition-opacity tracking-[0.05em] disabled:opacity-40"
          >
            {confirming ? '...' : t('dashboard.loan_fees_librarian_confirm')}
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowConfirm(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-manrope text-lg font-bold text-black dark:text-neutral-100 mb-2">{t('dashboard.loan_fees_confirm_title')}</h3>
            <p className="text-[#615E58] dark:text-neutral-400 text-sm mb-6">{t('dashboard.loan_fees_confirm_message', { username: debt.username, amount: Number(debt.penalty_amount).toFixed(2) })}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowConfirm(false)} className="py-2 px-5 rounded-full border border-[#E8E2D5] dark:border-neutral-600 text-[#43474D] dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">{t('dashboard.loan_fees_confirm_cancel')}</button>
              <button onClick={handleConfirmPayment} disabled={confirming} className="py-2 px-5 rounded-full bg-[#D93025] text-white dark:bg-red-600 text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40">{confirming ? '...' : t('dashboard.loan_fees_confirm_yes')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
