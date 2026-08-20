"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../../providers/I18nProvider';

interface PickupRecord {
  borrow_id: string;
  user_id: string;
  book_id: string;
  branch_id: number;
  reserve_date: string;
  borrow_date?: string;
  due_date?: string;
  pin?: string;
  expired_at?: string;
  status: string;
  book_title: string;
  book_isbn: string;
  book_image_url?: string;
  username: string;
  email: string;
  avatar?: string;
  branch_name: string;
  name_short: string;
}

const ITEMS_PER_PAGE = 10;

export default function BookPickupTab() {
  const { t } = useI18n();
  const [pickups, setPickups] = useState<PickupRecord[]>([]);
  const [redeemedToday, setRedeemedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchPickups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/librarian/pickups`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || {};
        setPickups(data.pickups || []);
        setRedeemedToday(data.redeemedToday || 0);
      }
    } catch (err) {
      console.error('Failed to fetch pickups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, []);

  const overdueCount = useMemo(() => {
    const now = Date.now();
    return pickups.filter(p => {
      if (!p.reserve_date) return false;
      const deadline = new Date(p.reserve_date).getTime() + 7 * 24 * 60 * 60 * 1000;
      return deadline <= now;
    }).length;
  }, [pickups]);

  const filteredPickups = useMemo(() => {
    if (!searchQuery.trim()) return pickups;
    const q = searchQuery.toLowerCase().trim();
    return pickups.filter(p =>
      (p.book_title || '').toLowerCase().includes(q) ||
      (p.book_isbn || '').toLowerCase().includes(q) ||
      (p.username || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q)
    );
  }, [pickups, searchQuery]);

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredPickups.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filteredPickups.length / ITEMS_PER_PAGE));

  return (
    <div className="flex py-4 px-2 md:px-4 flex-col items-start gap-6 w-full animate-fadeIn text-slate-800 dark:text-slate-100">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="flex p-6 flex-col items-start gap-1 border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm rounded-xl">
          <div className="flex justify-between items-start w-full">
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="text-xs font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
              {t('librarian.kpi_total_pickups_pending')}
            </span>
          </div>
          <p className="text-2xl font-bold font-hankenGrotesk mt-2">{pickups.length}</p>
        </div>

        <div className="flex p-6 flex-col items-start gap-1 border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm rounded-xl">
          <div className="flex justify-between items-start w-full">
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <span className="text-xs font-bold tracking-wider text-red-600 dark:text-red-400 uppercase">
              {t('librarian.kpi_overdue_pickups')}
            </span>
          </div>
          <p className="text-2xl font-bold font-hankenGrotesk mt-2">{overdueCount}</p>
        </div>

        <div className="flex p-6 flex-col items-start gap-1 border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm rounded-xl">
          <div className="flex justify-between items-start w-full">
            <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span className="text-xs font-bold tracking-wider text-teal-600 dark:text-teal-400 uppercase">
              {t('librarian.kpi_redeemed_today')}
            </span>
          </div>
          <p className="text-2xl font-bold font-hankenGrotesk mt-2">{redeemedToday}</p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex p-3 items-center gap-4 rounded-xl bg-slate-100 dark:bg-neutral-800 w-full">
        <div className="flex flex-col items-start w-full relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search by title, ISBN, user name, or email..."
            className="flex py-2 pr-4 pb-2 pl-10 items-center rounded-lg border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 w-full text-sm font-manrope text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-2.5 text-slate-400">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex flex-col rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm w-full overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center border-b border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 py-3.5 px-6 font-bold text-xs text-slate-600 dark:text-neutral-300 font-hankenGrotesk tracking-wider uppercase w-full">
          <div className="flex-1 min-w-[280px] text-left">{t('librarian.pickup_book_details')}</div>
          <div className="w-[240px] text-left">{t('librarian.pickup_user')}</div>
          <div className="w-[150px] text-left">{t('librarian.pickup_reserve_date')}</div>
          <div className="w-[130px] text-left">{t('librarian.pickup_branch')}</div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 font-inter text-base animate-pulse">
            Loading pickup records...
          </div>
        ) : pageItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-neutral-400 font-manrope text-sm">
            No pickup records found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-neutral-700 w-full">
            {pageItems.map((item) => (
              <div key={item.borrow_id} className="flex items-center py-4 px-6 text-sm font-manrope hover:bg-slate-50/50 dark:hover:bg-neutral-700/50 transition-colors w-full">
                {/* Book Details: Title & ISBN */}
                <div className="flex-1 min-w-[280px] flex items-center gap-3 pr-4">
                  <div className="w-10 h-14 bg-slate-100 dark:bg-neutral-700 rounded overflow-hidden shrink-0 border border-slate-200 dark:border-neutral-600">
                    {item.book_image_url ? (
                      <img src={item.book_image_url} alt={item.book_title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Book</div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">{item.book_title}</p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono mt-1">ISBN: {item.book_isbn}</p>
                  </div>
                </div>

                {/* User with Avatar */}
                <div className="w-[240px] flex items-center gap-3 pr-4">
                  <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden">
                    {item.avatar ? (
                      <img src={item.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                        <span className="text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                          {item.username ? item.username.slice(0, 2).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{item.username}</p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">{item.email}</p>
                  </div>
                </div>

                {/* Reserve Date */}
                <div className="w-[150px] text-slate-700 dark:text-neutral-300 font-mono text-xs">
                  {item.reserve_date ? new Date(item.reserve_date).toLocaleDateString() : 'N/A'}
                </div>

                {/* Branch */}
                <div className="w-[130px]">
                  <span className="font-mono font-bold text-xs bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded border border-indigo-200 dark:border-indigo-800">
                    {item.name_short}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table Pagination */}
        <div className="flex py-4 px-6 justify-between items-center bg-slate-50 dark:bg-neutral-900 border-t border-slate-200 dark:border-neutral-700">
          <p className="text-xs text-slate-500 font-medium">
            Showing {startIdx + 1}-{Math.min(startIdx + ITEMS_PER_PAGE, filteredPickups.length)} of {filteredPickups.length} records
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 text-xs font-semibold rounded bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 disabled:opacity-40 transition-colors hover:bg-slate-100 dark:hover:bg-neutral-700"
            >
              Prev
            </button>
            <span className="text-xs font-bold px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 text-xs font-semibold rounded bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 disabled:opacity-40 transition-colors hover:bg-slate-100 dark:hover:bg-neutral-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
