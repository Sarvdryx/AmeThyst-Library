"use client";

import { useI18n } from '../../providers/I18nProvider';
import Amount from '../atoms/Amount';

interface PaidFee {
  penalty_id: number;
  borrow_id: number;
  user_id: number;
  issue: string;
  description: string;
  penalty_amount: number;
  record_date: string;
  paid_at: string;
  username: string;
  avatar?: string | null;
  book_title?: string;
}

interface PaidFeeRowProps {
  fee: PaidFee;
}

export default function PaidFeeRow({ fee }: PaidFeeRowProps) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-4 py-4 px-5 border-b border-[#F2EDE3] dark:border-neutral-700/50 last:border-0 hover:bg-[#F8F3E9]/30 dark:hover:bg-neutral-700/30 transition-colors w-full">
      <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden">
        {fee.avatar ? (
          <img src={fee.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#D7B6FE] dark:bg-purple-800 flex items-center justify-center">
            <span className="text-[#604382] dark:text-purple-200 font-manrope text-xs font-bold">
              {fee.username.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-manrope text-sm font-bold text-black dark:text-neutral-100">{fee.username}</p>
        {fee.book_title && (
          <p className="text-[#75777D] dark:text-neutral-400 font-inter text-xs mt-0.5 truncate">
            <span className="font-bold">{t('dashboard.loan_fees_header_book')}:</span> {fee.book_title}
          </p>
        )}
        {fee.description && (
          <p className="text-[#75777D] dark:text-neutral-500 font-inter text-[10px] mt-0.5 truncate">
            <span className="font-bold">{t('dashboard.loan_fees_header_description')}:</span> {fee.description}
          </p>
        )}
      </div>

      <div className="w-[120px] shrink-0 text-right">
        <Amount
          value={fee.penalty_amount}
          className="text-sm font-bold text-black dark:text-neutral-200"
        />
      </div>

      <div className="w-[100px] shrink-0 text-right">
        <span className="text-[#75777D] dark:text-neutral-400 font-inter text-[10px]">
          {fee.paid_at ? new Date(fee.paid_at).toLocaleDateString() : ''}
        </span>
      </div>
    </div>
  );
}
