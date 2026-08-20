import { useI18n } from '../../providers/I18nProvider';
import type { BorrowedBook } from './BorrowedBookCard';
import BookCover from '../atoms/BookCover';

interface Props {
  books: BorrowedBook[];
}

const conditionKey: Record<string, string> = {
  returned: 'dashboard.borrowed_condition_returned',
  overdue: 'dashboard.borrowed_condition_overdue',
  damaged: 'dashboard.borrowed_condition_damaged',
  lost: 'dashboard.borrowed_condition_lost',
  combined: 'dashboard.borrowed_condition_combined',
};

const conditionBg: Record<string, string> = {
  returned: 'bg-[#E8F5E9] dark:bg-green-900/30',
  overdue: 'bg-[#FFF3E0] dark:bg-orange-900/30',
  damaged: 'bg-[#FCE8E6] dark:bg-red-900/30',
  lost: 'bg-[#F3E8FF] dark:bg-purple-900/30',
  combined: 'bg-[#FCE8E6] dark:bg-red-900/30',
};

const conditionText: Record<string, string> = {
  returned: 'text-[#1E8E3E] dark:text-green-300',
  overdue: 'text-[#E37400] dark:text-orange-300',
  damaged: 'text-[#D93025] dark:text-red-300',
  lost: 'text-[#7C3AED] dark:text-purple-300',
  combined: 'text-[#D93025] dark:text-red-300',
};

export default function BorrowedHistoryTable({ books }: Props) {
  const { t } = useI18n();
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#E8E2D5] dark:border-neutral-700">
            <th className="py-3 px-5 text-[10px] font-bold text-[#75777D] dark:text-neutral-400 tracking-[0.1em] uppercase">{t('dashboard.borrowed_table_title')}</th>
            <th className="py-3 px-5 text-[10px] font-bold text-[#75777D] dark:text-neutral-400 tracking-[0.1em] uppercase">{t('dashboard.borrowed_table_author')}</th>
            <th className="py-3 px-5 text-[10px] font-bold text-[#75777D] dark:text-neutral-400 tracking-[0.1em] uppercase">{t('dashboard.borrowed_table_borrowed')}</th>
            <th className="py-3 px-5 text-[10px] font-bold text-[#75777D] dark:text-neutral-400 tracking-[0.1em] uppercase">{t('dashboard.borrowed_table_returned')}</th>
            <th className="py-3 px-5 text-[10px] font-bold text-[#75777D] dark:text-neutral-400 tracking-[0.1em] uppercase">{t('dashboard.borrowed_table_condition')}</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id} className="border-b border-[#F2EDE3] dark:border-neutral-700/50 last:border-0 hover:bg-[#F8F3E9]/50 dark:hover:bg-neutral-700/30 transition-colors">
              <td className="py-4 px-5">
                <div className="flex items-center gap-3">
                  <BookCover
                    src={book.coverImage || book.cover}
                    alt={book.title}
                    className="w-8 h-11 rounded"
                    containerClassName="w-8 h-11 rounded shrink-0"
                  />
                  <span className="font-manrope text-sm font-bold text-black dark:text-neutral-100">{book.title}</span>
                </div>
              </td>
              <td className="py-4 px-5 text-[#75777D] dark:text-neutral-400 font-inter text-xs">{book.author}</td>
              <td className="py-4 px-5 text-black dark:text-neutral-200 font-manrope text-xs">{book.borrowDate ? new Date(book.borrowDate).toLocaleDateString() : '—'}</td>
              <td className="py-4 px-5 text-black dark:text-neutral-200 font-manrope text-xs">{book.returnedDate ? new Date(book.returnedDate).toLocaleDateString() : '—'}</td>
              <td className="py-4 px-5">
                {book.borrowCondition && (
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold leading-4 ${conditionBg[book.borrowCondition]} ${conditionText[book.borrowCondition]}`}>
                    {t(conditionKey[book.borrowCondition])}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {books.length === 0 && (
        <div className="py-16 text-center text-neutral-400 dark:text-neutral-500 font-manrope text-sm">{t('dashboard.borrowed_no_books')}</div>
      )}
    </div>
  );
}
