import { useI18n } from '../../providers/I18nProvider';

interface BorrowingLimitCardProps {
  borrowNum?: number;
  maxBorrowLimit?: number;
}

export default function BorrowingLimitCard({
  borrowNum = 0,
  maxBorrowLimit = 5,
}: BorrowingLimitCardProps) {
  const { t } = useI18n();

  return (
    <div className="flex p-4 flex-col items-start gap-2 border border-slate-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/40 rounded-xl w-full">
      <div className="flex items-center gap-3 w-full">
        <p className="text-slate-800 dark:text-neutral-200 font-manrope text-sm font-bold leading-[18px]">
          {t('profile.borrowing_info')}
        </p>
      </div>
      <div className="flex pt-2 flex-col items-start gap-1.5 border-t border-slate-300 dark:border-neutral-700 w-full">
        <div className="flex justify-between items-center w-full">
          <span className="text-slate-500 dark:text-neutral-400 font-manrope text-xs font-medium">
            {t('profile.borrowing_limit')}
          </span>
          <span className="text-slate-800 dark:text-neutral-200 font-manrope text-xs font-bold">
            {maxBorrowLimit}
          </span>
        </div>
        <div className="flex justify-between items-center w-full">
          <span className="text-slate-500 dark:text-neutral-400 font-manrope text-xs font-medium">
            {t('profile.books_borrowed')}
          </span>
          <span className="text-slate-800 dark:text-neutral-200 font-manrope text-xs font-bold">
            {borrowNum}
          </span>
        </div>
      </div>
    </div>
  );
}