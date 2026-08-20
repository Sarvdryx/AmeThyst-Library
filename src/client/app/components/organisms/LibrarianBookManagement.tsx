"use client";

import { useState } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import SubTabBar from '../molecules/SubTabBar';
import BookTableHeader from '../molecules/BookTableHeader';
import BookTableRow from '../molecules/BookTableRow';
import BookTablePagination from '../molecules/BookTablePagination';
import type { BookEntry } from '../molecules/BookTableRow';

const MOCK_BOOKS: BookEntry[] = [
  { id: 'old_1', coverSrc: '/BookCover.png', title: 'Architecture of Thought', author: 'Julian Thorne', isbn: '978-3-16-148410-0', category: 'Philosophy', available: 3, total: 5, active: true },
  { id: 'old_2', coverSrc: '/BookCover(1).png', title: 'The Modern Grid', author: 'Elena Rossi', isbn: '978-0-262-51763-8', category: 'Design', available: 0, total: 2, active: true },
  { id: 'old_3', coverSrc: '/BookCover(2).png', title: 'Quantum Linguistics', author: 'Dr. Sarah Chen', isbn: '978-1-4028-9462-6', category: 'Science', available: 12, total: 15, active: false },
  { id: 'old_4', coverSrc: '/BookCover(3).png', title: 'Urban Ecosystems', author: 'Marcus Vane', isbn: '978-3-540-49605-2', category: 'Environment', available: 8, total: 10, active: true },
];

export default function LibrarianBookManagement() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('book_management');
  const [currentPage] = useState(1);
  const totalPages = 12;

  const handlePageChange = (page: number) => {
    console.log('Page change to:', page);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-end">
        <h1 className="text-[#03192E] dark:text-neutral-100 font-inter text-[32px] font-bold leading-10 tracking-[0.125em]">
          Books
        </h1>
      </div>

      <SubTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex justify-between items-center w-full">
        <div className="flex items-start gap-3">
          <div className="relative max-w-[448px] w-[448px]">
            <div className="flex pt-[13px] pr-4 pb-[13px] pl-12 justify-center items-start rounded-xl border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800 w-full">
              <p className="text-[#6B7280] dark:text-neutral-400 font-manrope text-base">
                {t('librarian.search_placeholder')}
              </p>
            </div>
            <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-[13px] w-fit h-6">
              <path d="M16.6 18L10.3 11.7C9.8 12.1 9.225 12.4167 8.575 12.65C7.925 12.8833 7.23333 13 6.5 13C4.68333 13 3.14583 12.3708 1.8875 11.1125C0.629167 9.85417 0 8.31667 0 6.5C0 4.68333 0.629167 3.14583 1.8875 1.8875C3.14583 0.629167 4.68333 0 6.5 0C8.31667 0 9.85417 0.629167 11.1125 1.8875C12.3708 3.14583 13 4.68333 13 6.5C13 7.23333 12.8833 7.925 12.65 8.575C12.4167 9.225 12.1 9.8 11.7 10.3L18 16.6L16.6 18ZM6.5 11C7.75 11 8.8125 10.5625 9.6875 9.6875C10.5625 8.8125 11 7.75 11 6.5C11 5.25 10.5625 4.1875 9.6875 3.3125C8.8125 2.4375 7.75 2 6.5 2C5.25 2 4.1875 2.4375 3.3125 3.3125C2.4375 4.1875 2 5.25 2 6.5C2 7.75 2.4375 8.8125 3.3125 9.6875C4.1875 10.5625 5.25 11 6.5 11Z" fill="#74777D" />
            </svg>
          </div>
          <div className="relative">
            <div className="flex pt-3 pr-10 pb-3 pl-6 items-center rounded-xl border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800">
              <span className="text-[#1D1C16] dark:text-neutral-200 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.05em]">
                {t('librarian.all_categories')}
              </span>
              <svg width="12" height="24" viewBox="0 0 12 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
                <path d="M6 7.4L0 1.4L1.4 0L6 4.6L10.6 0L12 1.4L6 7.4Z" fill="#74777D" />
              </svg>
            </div>
          </div>
        </div>
        <button className="flex py-3 px-8 items-center gap-2 rounded-full bg-black dark:bg-white hover:opacity-90 transition-opacity">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 8H0V6H6V0H8V6H14V8H8V14H6V8Z" fill="white" className="dark:fill-black" />
          </svg>
          <span className="text-white dark:text-black font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.05em]">
            {t('librarian.add_book')}
          </span>
        </button>
      </div>

      <div className="flex flex-col border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[0_10px_30px_-10px_rgba(26,46,68,0.06)] dark:shadow-none rounded-lg overflow-hidden">
        <BookTableHeader />
        <div className="flex flex-col w-full">
          {MOCK_BOOKS.map((book, i) => (
            <BookTableRow key={i} book={book} hasBorder={i > 0} />
          ))}
        </div>
        <BookTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
