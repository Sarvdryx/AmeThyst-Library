"use client";

import { useI18n } from '../../providers/I18nProvider';
import { StatusBadge, BookCover, Skeleton } from '../atoms';

export interface BorrowerInfo {
  fullName: string;
  libraryId: string;
  department: string;
  eligibility: 'eligible' | 'suspended';
}

export interface BookInfo {
  title: string;
  author: string;
  bookCode: string;
  coverUrl: string | null;
}

interface BorrowerInfoPanelProps {
  borrower: BorrowerInfo;
  books: BookInfo[];
  isLoading?: boolean;
}

export default function BorrowerInfoPanel({ borrower, books, isLoading }: BorrowerInfoPanelProps) {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 p-3">
              <Skeleton className="h-16 w-12 rounded" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          {t('verification.borrower_section')}
        </p>
        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          {borrower.fullName}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          ID: {borrower.libraryId}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {borrower.department}
        </p>
        <StatusBadge
          variant={borrower.eligibility === 'eligible' ? 'active' : 'pending'}
          label={t(`verification.eligibility_${borrower.eligibility}`)}
        />
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          {t('verification.books_section')} ({books.length})
        </p>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {books.map((book, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
              <BookCover
                src={book.coverUrl || undefined}
                alt={book.title}
                className="w-12 h-16 rounded"
                containerClassName="w-12 h-16 rounded shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {book.title}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{book.author}</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">{book.bookCode}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
