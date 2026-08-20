import type { Fee } from '../../data/mockLoansFees';
import { useI18n } from '../../providers/I18nProvider';
import StatusBadge from '../atoms/StatusBadge';
import Amount from '../atoms/Amount';

interface FeeRowProps {
  fee: Fee;
}

const feeStatusVariant: Record<string, 'paid' | 'pending' | 'waived'> = {
  paid: 'paid',
  pending: 'pending',
  waived: 'waived',
};

const typeIcon: Record<string, string> = {
  overdue_fine: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  lost_book: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
  damage: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V8h2v6z',
  processing: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
};

const feeTypeKey: Record<Fee['type'], string> = {
  overdue_fine: 'dashboard.loan_fees_overdue_fine',
  lost_book: 'dashboard.loan_fees_lost_book',
  damage: 'dashboard.loan_fees_damage',
  processing: 'dashboard.loan_fees_processing',
};

export default function FeeRow({ fee }: FeeRowProps) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-4 py-4 px-5 border-b border-[#F2EDE3] dark:border-neutral-700/50 last:border-0 hover:bg-[#F8F3E9]/30 dark:hover:bg-neutral-700/30 transition-colors">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path d={typeIcon[fee.type] || typeIcon.processing} fill="#75777D" className="dark:fill-neutral-400" />
      </svg>

      <div className="flex-1 min-w-0">
        <p className="font-manrope text-sm font-bold text-black dark:text-neutral-100 truncate">
          {t(feeTypeKey[fee.type])}
        </p>
        {fee.bookTitle && (
          <p className="text-[#75777D] dark:text-neutral-400 font-inter text-xs mt-0.5 truncate">
            <span className="font-bold">{t('dashboard.loan_fees_header_book')}:</span> {fee.bookTitle}
          </p>
        )}
        {fee.description && (
          <p className="text-[#75777D] dark:text-neutral-500 font-inter text-[10px] mt-0.5 truncate">
            <span className="font-bold">{t('dashboard.loan_fees_header_description')}:</span> {fee.description}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <Amount value={fee.amount} className={`text-sm ${fee.status === 'pending' && fee.amount > 0 ? 'text-[#D93025] dark:text-red-300' : 'text-black dark:text-neutral-200'}`} />
        <StatusBadge variant={feeStatusVariant[fee.status]} label={fee.status === 'paid' ? t('dashboard.loan_fees_status_paid') : fee.status === 'pending' ? t('dashboard.loan_fees_pending') : 'Waived'} />
      </div>

      <span className="text-[#75777D] dark:text-neutral-400 font-inter text-[10px] w-20 text-right shrink-0">
        {fee.status === 'paid' && fee.paidDate
          ? `Paid: ${fee.paidDate}`
          : fee.issuedDate || ''}
      </span>
    </div>
  );
}
