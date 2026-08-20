"use client";

import { useI18n } from '../../providers/I18nProvider';
import BookCover from '../atoms/BookCover';

interface Borrower {
  username: string;
  gender: string;
  phone_number: string;
  email: string;
  birth_date: string;
}

interface Book {
  title: string;
  author: string;
  publisher: string;
  genres: string;
  image_url: string;
  price: number;
}

interface Borrowing {
  reserve_date: string;
  borrow_date: string;
  due_date: string;
}

interface BorrowInfoPanelProps {
  borrower: Borrower;
  book: Book;
  borrowing: Borrowing;
}

export default function BorrowInfoPanel({ borrower, book, borrowing }: BorrowInfoPanelProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      <div className="p-4 rounded-lg border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          {t('dashboard.inspection_user_info')}
        </p>
        <div className="space-y-2 text-sm">
          <p><span className="text-neutral-400">{t('verification.borrower_section')}:</span> <span className="font-medium dark:text-neutral-200">{borrower.username}</span></p>
          <p><span className="text-neutral-400">{t('verification.borrower_gender')}:</span> <span className="font-medium dark:text-neutral-200 capitalize">{borrower.gender || '—'}</span></p>
          <p><span className="text-neutral-400">{t('verification.borrower_phone')}:</span> <span className="font-medium dark:text-neutral-200">{borrower.phone_number || '—'}</span></p>
          <p><span className="text-neutral-400">{t('verification.borrower_email')}:</span> <span className="font-medium dark:text-neutral-200">{borrower.email}</span></p>
          <p><span className="text-neutral-400">{t('verification.borrower_birth')}:</span> <span className="font-medium dark:text-neutral-200">{borrower.birth_date ? new Date(borrower.birth_date).toLocaleDateString() : '—'}</span></p>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          {t('dashboard.inspection_book_info')}
        </p>
        <div className="flex gap-3">
          <BookCover src={book.image_url} alt={book.title} className="w-16 h-20 rounded" containerClassName="w-16 h-20 rounded shrink-0" />
          <div className="space-y-1 text-sm min-w-0">
            <p className="font-semibold dark:text-neutral-100 truncate">{book.title}</p>
            <p className="text-neutral-400 text-xs">{book.author}</p>
            <p className="text-neutral-400 text-xs">{book.publisher}</p>
            <p className="text-neutral-400 text-xs">{book.genres}</p>
            <p className="font-semibold text-[#1A73E8] dark:text-blue-300">${book.price}</p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          {t('dashboard.inspection_borrowing_info')}
        </p>
        <div className="space-y-2 text-sm">
          <p><span className="text-neutral-400">{t('librarian.inspection_borrow_date')}:</span> <span className="font-medium dark:text-neutral-200">{borrowing.borrow_date ? new Date(borrowing.borrow_date).toLocaleDateString() : '—'}</span></p>
          <p><span className="text-neutral-400">{t('librarian.inspection_due_date')}:</span> <span className="font-medium dark:text-neutral-200">{borrowing.due_date ? new Date(borrowing.due_date).toLocaleDateString() : '—'}</span></p>
          <p><span className="text-neutral-400">{t('dashboard.borrowed_label_reserved')}:</span> <span className="font-medium dark:text-neutral-200">{borrowing.reserve_date ? new Date(borrowing.reserve_date).toLocaleDateString() : '—'}</span></p>
        </div>
      </div>
    </div>
  );
}
