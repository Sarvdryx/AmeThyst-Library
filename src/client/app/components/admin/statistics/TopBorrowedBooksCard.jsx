"use client";

import React from 'react';
import Image from 'next/image';
import { useI18n } from '../../../providers/I18nProvider';

export default function TopBorrowedBooksCard({ books = [] }) {
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-sm border border-stone-200/60 dark:border-neutral-700 flex flex-col w-full h-[400px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-manrope text-xl font-bold text-black dark:text-white">
          {t('admin.top_borrowed_books_title')}
        </h2>
      </div>

      {books.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
          {t('admin.no_book_data')}
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
          {books.map((book) => (
            <div key={book.bookId} className="flex items-center gap-4 py-1">
              <div className="relative w-10 h-14 shrink-0 overflow-hidden rounded shadow-sm bg-stone-100 dark:bg-neutral-700">
                <Image
                  src={book.coverUrl || '/images/book-cover-placeholder.png'}
                  alt={book.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold font-hankenGrotesk text-stone-900 dark:text-neutral-100 truncate">
                  <span className="text-neutral-400 mr-1.5">#{book.rank}</span>
                  {book.title}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex-1 bg-stone-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-black dark:bg-white h-full rounded-full transition-all duration-500"
                      style={{ width: `${book.popularityPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-stone-600 dark:text-neutral-400 font-mono shrink-0">
                    {book.borrowCount} {t('admin.borrow_turns')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
