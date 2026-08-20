"use client";

import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../../providers/I18nProvider';

interface ActiveBorrowing {
  borrow_id: string;
  book_title: string;
  book_isbn: string;
  book_author: string;
  username: string;
  email: string;
  avatar?: string;
  borrow_date: string;
  due_date: string;
  branch_name: string;
  name_short: string;
}

const ITEMS_PER_PAGE = 10;

export default function BookReturnTab() {
  const { t } = useI18n();
  const [borrowings, setBorrowings] = useState<ActiveBorrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchBorrowings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/librarian/active-borrowings`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setBorrowings(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch active borrowings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowings();
  }, []);

  const activeCount = borrowings.length;

  const overdueCount = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return borrowings.filter(b => {
      if (!b.due_date) return false;
      const due = new Date(b.due_date);
      due.setHours(0, 0, 0, 0);
      return due < now;
    }).length;
  }, [borrowings]);

  const expectingTodayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return borrowings.filter(b => {
      if (!b.due_date) return false;
      const due = new Date(b.due_date);
      return due >= today && due < tomorrow;
    }).length;
  }, [borrowings]);

  const filteredBorrowings = useMemo(() => {
    if (!searchQuery.trim()) return borrowings;
    const q = searchQuery.toLowerCase().trim();
    return borrowings.filter(b =>
      (b.book_title || '').toLowerCase().includes(q) ||
      (b.book_isbn || '').toLowerCase().includes(q) ||
      (b.book_author || '').toLowerCase().includes(q) ||
      (b.username || '').toLowerCase().includes(q) ||
      (b.email || '').toLowerCase().includes(q)
    );
  }, [borrowings, searchQuery]);

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredBorrowings.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filteredBorrowings.length / ITEMS_PER_PAGE));

  return (
    <div className="flex p-16 flex-col items-start gap-6 w-full animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6 w-full">
        <div className="flex p-8 flex-col items-start gap-1 border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl shadow-[0_10px_30px_-5px_rgba(26,46,68,0.06)]">
          <div className="flex justify-between items-start w-full">
            <div className="p-3 rounded-xl bg-[#F8F3E9] dark:bg-neutral-700">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1D1C16] dark:text-neutral-200">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
          </div>
          <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-base leading-6 mt-3 tracking-[0.05em]">{t('librarian.kpi_active_borrows')}</p>
          <p className="text-[#1D1C16] dark:text-neutral-100 font-hankenGrotesk text-base leading-6 font-bold">{activeCount}</p>
        </div>

        <div className="flex p-8 flex-col items-start gap-1 border border-[#FFDAD6] dark:border-red-900 bg-white dark:bg-neutral-800 rounded-xl shadow-[0_10px_30px_-5px_rgba(26,46,68,0.06)]">
          <div className="flex justify-between items-start w-full">
            <div className="p-3 rounded-xl bg-[#FFDAD6] dark:bg-red-900">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#BA1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
          <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-base leading-6 mt-3 tracking-[0.05em]">{t('librarian.kpi_overdue_items')}</p>
          <p className="text-[#BA1A1A] font-hankenGrotesk text-base leading-6 font-bold">{overdueCount}</p>
        </div>

        <div className="flex p-8 flex-col items-start gap-1 border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl shadow-[0_10px_30px_-5px_rgba(26,46,68,0.06)]">
          <div className="flex justify-between items-start w-full">
            <div className="p-3 rounded-xl bg-[#F8F3E9] dark:bg-neutral-700">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1D1C16] dark:text-neutral-200">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
          <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-base leading-6 mt-3 tracking-[0.05em]">{t('librarian.kpi_expecting_return_today')}</p>
          <p className="text-[#1D1C16] dark:text-neutral-100 font-hankenGrotesk text-base leading-6 font-bold">{expectingTodayCount}</p>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex p-3 items-center gap-4 rounded-xl bg-slate-100 dark:bg-neutral-800 w-full">
        <div className="flex flex-col items-start w-full relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search by title, author, ISBN, or user name..."
            className="flex py-2 pr-4 pb-2 pl-10 items-center rounded-lg border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 w-full text-sm font-manrope text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-2.5 text-slate-400">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col items-start border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[0_10px_30px_-5px_rgba(26,46,68,0.06)] w-full overflow-hidden rounded-xl">
        {/* Table Header */}
        <div className="flex justify-center items-start border-b border-b-[#E8E2D5] dark:border-neutral-700 bg-[#F8F3E9] dark:bg-neutral-700 w-full">
          <div className="flex py-5 pl-8 pr-4 flex-col items-start w-[220px]">
            <p className="text-[#43474D] dark:text-neutral-300 font-hankenGrotesk text-sm font-bold tracking-[0.05em] whitespace-nowrap">{t('librarian.return_user')}</p>
          </div>
          <div className="flex py-5 pl-8 pr-4 flex-col items-start flex-1">
            <p className="text-[#43474D] dark:text-neutral-300 font-hankenGrotesk text-sm font-bold tracking-[0.05em] whitespace-nowrap">{t('librarian.return_book_title')}</p>
          </div>
          <div className="flex py-5 pl-8 pr-4 flex-col items-start w-[137px]">
            <p className="text-[#43474D] dark:text-neutral-300 font-hankenGrotesk text-sm font-bold tracking-[0.05em] whitespace-nowrap">{t('librarian.return_borrow_date')}</p>
          </div>
          <div className="flex py-5 pl-4 pr-4 flex-col items-start w-[137px]">
            <p className="text-[#43474D] dark:text-neutral-300 font-hankenGrotesk text-sm font-bold tracking-[0.05em] whitespace-nowrap">{t('librarian.return_due_date')}</p>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 font-inter text-base animate-pulse w-full">
            Loading active borrowings...
          </div>
        ) : pageItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-neutral-400 font-manrope text-sm w-full">
            No active borrowings found.
          </div>
        ) : (
          <div className="flex flex-col w-full">
            {pageItems.map((item) => {
              const isOverdue = item.due_date && new Date(item.due_date) < new Date(new Date().toDateString());
              return (
                <div key={item.borrow_id} className={`flex justify-center items-center w-full ${isOverdue ? 'bg-[rgba(255,218,214,0.05)]' : ''} border-b border-b-gray-100 dark:border-neutral-700/50 last:border-b-0`}>
                  {/* User with Avatar */}
                  <div className="flex items-center gap-3 w-[220px] pl-8 py-4 overflow-hidden">
                    <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden">
                      {item.avatar ? (
                        <img src={item.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#D7B6FE] dark:bg-purple-800 flex items-center justify-center">
                          <span className="text-[#604382] dark:text-purple-200 font-manrope text-xs font-bold">
                            {item.username ? item.username.slice(0, 2).toUpperCase() : 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#000] dark:text-neutral-100 font-manrope text-base font-bold truncate whitespace-nowrap">{item.username}</p>
                      <p className="text-[#43474D] dark:text-neutral-400 font-manrope text-xs truncate whitespace-nowrap">{item.email}</p>
                    </div>
                  </div>

                  {/* Book Title */}
                  <div className="flex flex-col items-start flex-1 pl-8 py-4 min-w-0">
                    <p className="text-[#000] dark:text-neutral-100 font-manrope text-base font-bold truncate whitespace-nowrap w-full">{item.book_title}</p>
                    <p className="text-[#43474D] dark:text-neutral-400 font-manrope text-xs mt-1 truncate whitespace-nowrap w-full">{item.book_author}</p>
                  </div>

                  {/* Borrow Date */}
                  <div className="flex py-6 pl-8 pr-4 flex-col items-start w-[137px]">
                    <p className="text-[#43474D] dark:text-neutral-400 font-manrope text-base whitespace-nowrap">
                      {item.borrow_date ? new Date(item.borrow_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>

                  {/* Due Date */}
                  <div className="flex py-6 pl-4 pr-4 flex-col items-start w-[137px]">
                    <p className={`font-manrope text-base whitespace-nowrap ${isOverdue ? 'text-[#BA1A1A] font-bold' : 'text-[#43474D] dark:text-neutral-400'}`}>
                      {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="flex py-6 px-8 justify-between items-center border-t border-t-[#E8E2D5] dark:border-neutral-700 bg-[#F8F3E9] dark:bg-neutral-800 w-full">
          <p className="text-[#000] dark:text-neutral-200 font-manrope text-base">
            Showing {startIdx + 1} - {Math.min(startIdx + ITEMS_PER_PAGE, filteredBorrowings.length)} of {filteredBorrowings.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="flex justify-center items-center rounded-lg border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800 w-10 h-10 hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-30"
            >
              <svg width="7" height="11" viewBox="0 0 7 11" fill="none">
                <path d="M5.31 10.62L0 5.31L5.31 0L6.02 0.71L1.42 5.31L6.02 9.91L5.31 10.62Z" fill="#1D1C16" className="dark:fill-neutral-300" />
              </svg>
            </button>
            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex justify-center items-center rounded-lg w-10 h-10 font-manrope text-base font-bold ${
                    page === currentPage
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[#1D1C16] dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <span className="text-[#74777D] dark:text-neutral-500 font-manrope text-base px-2">...</span>
            <button className="flex justify-center items-center rounded-lg border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800 w-10 h-10 text-[#1D1C16] dark:text-neutral-200 font-manrope text-base hover:bg-gray-100 dark:hover:bg-neutral-700">
              {totalPages}
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="flex justify-center items-center rounded-lg border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800 w-10 h-10 hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-30"
            >
              <svg width="7" height="11" viewBox="0 0 7 11" fill="none">
                <path d="M4.6 5.31L0 0.71L0.71 0L6.02 5.31L0.71 10.62L0 9.91L4.6 5.31Z" fill="#1D1C16" className="dark:fill-neutral-300" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
