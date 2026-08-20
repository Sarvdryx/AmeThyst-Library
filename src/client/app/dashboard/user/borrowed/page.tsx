"use client";

import { useState, useEffect } from 'react';
import { useI18n } from '../../../providers/I18nProvider';
import { BorrowedBookCard, BorrowedHistoryTable } from '../../../components/molecules';
import { PinModal } from '../../../components/organisms';
import { apiFetch } from '../../../utils/apiClient';
import type { BorrowedBook } from '../../../components/molecules';

type Tab = 'current' | 'history';

export default function BorrowedBooksPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('current');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentBooks, setCurrentBooks] = useState<BorrowedBook[]>([]);
  const [historyBooks, setHistoryBooks] = useState<BorrowedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinModal, setPinModal] = useState<{ open: boolean; pin: string; expiresAt: string }>({ open: false, pin: '', expiresAt: '' });
  const [generatingPinId, setGeneratingPinId] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [confirmExtendId, setConfirmExtendId] = useState<string | null>(null);
  const [extendError, setExtendError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBorrowRecords = async () => {
      setLoading(true);
      try {
        const result = await apiFetch<{ current: BorrowedBook[]; past: BorrowedBook[] }>('/dashboard/user/my-borrowed');
        if (result.success) {
          setCurrentBooks(result.data?.current || []);
          setHistoryBooks(result.data?.past || []);
        } else {
          setCurrentBooks([]);
          setHistoryBooks([]);
        }
      } catch (err) {
        console.error('Error fetching borrow records:', err);
        setCurrentBooks([]);
        setHistoryBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowRecords();
    const interval = setInterval(fetchBorrowRecords, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const isCurrent = tab === 'current';
  const books = isCurrent ? currentBooks : historyBooks;
  const filtered = books.filter((b) => {
    if (search && !b.title.toLowerCase().includes(search.toLowerCase()) && !b.author.toLowerCase().includes(search.toLowerCase())) return false;
    if (!isCurrent) {
      const d = b.returnedDate || '';
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
    }
    return true;
  });

  const handleCancelReservation = async (id: string) => {
    try {
      const result = await apiFetch(`/dashboard/user/reserve/${id}`, { method: 'DELETE' });
      if (result.success) {
        setCurrentBooks(prev => prev.filter(book => book.id !== id));
      }
    } catch (err) {
      console.error('Error cancelling reservation:', err);
    }
  };

  const handleGeneratePin = async (id: string) => {
    try {
      setGeneratingPinId(id);
      const result = await apiFetch<{ pin: string; expiresAt: string }>(`/dashboard/user/reserve/${id}/pin`, { method: 'POST' });
      if (result.success && result.data) {
        setCurrentBooks(prev => prev.map(book =>
          book.id === id ? { ...book, pin: result.data!.pin, status: 'pending', expiresAt: result.data!.expiresAt } : book
        ));
        setPinModal({ open: true, pin: result.data.pin, expiresAt: result.data.expiresAt });
      }
    } catch (err) {
      console.error('Error generating PIN:', err);
    } finally {
      setGeneratingPinId(null);
    }
  };

  const handleGenerateReturnPin = async (id: string) => {
    try {
      setGeneratingPinId(id);
      setPinError(null);
      const result = await apiFetch<{ pin: string; expiresAt: string }>(`/dashboard/user/borrowed/generate-return-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrow_id: id })
      });
      if (result.success && result.data) {
        setCurrentBooks(prev => prev.map(book =>
          book.id === id ? { ...book, pin: result.data!.pin, status: 'pending_return', expiresAt: result.data!.expiresAt } : book
        ));
        setPinModal({ open: true, pin: result.data.pin, expiresAt: result.data.expiresAt });
      } else {
        setPinError(result.message || 'Failed to generate return PIN');
      }
    } catch (err) {
      console.error('Error generating return PIN:', err);
      setPinError('Network error. Please try again.');
    } finally {
      setGeneratingPinId(null);
    }
  };

  const handleViewPin = (id: string) => {
    const book = currentBooks.find(b => b.id === id);
    if (book?.pin) {
      setPinModal({ open: true, pin: book.pin, expiresAt: book.expiresAt || '' });
    }
  };

  const handleRequestExtend = (id: string) => {
    setExtendError(null);
    setConfirmExtendId(id);
  };

  const handleConfirmExtend = async () => {
    const id = confirmExtendId;
    if (!id) return;
    setConfirmExtendId(null);
    setExtendError(null);
    try {
      const result = await apiFetch<{ dueDate: string; extendNum: number }>('/dashboard/user/borrowed/extend-due-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrow_id: id })
      });
      if (result.success && result.data) {
        setCurrentBooks(prev => prev.map(book =>
          book.id === id ? { ...book, dueDate: result.data!.dueDate, extendNum: result.data!.extendNum } : book
        ));
      } else {
        setExtendError(result.message || 'Failed to extend due date');
      }
    } catch (err) {
      console.error('Error extending due date:', err);
      setExtendError('Network error. Please try again.');
    }
  };

  const handleCancelExtend = () => {
    setConfirmExtendId(null);
    setExtendError(null);
  };

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-manrope text-[40px] font-bold leading-[54.5px] text-black dark:text-neutral-100">
          {t('dashboard.borrowed_title')}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          {!isCurrent && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#75777D] dark:text-neutral-400">{t('dashboard.borrowed_from')}</span>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-black dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#1A2E44]/20" />
              <span className="text-[11px] text-[#75777D] dark:text-neutral-400">{t('dashboard.borrowed_to')}</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-black dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#1A2E44]/20" />
            </div>
          )}
          <input type="text" placeholder={t('dashboard.borrowed_search_placeholder')} value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-full border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-black dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1A2E44]/20 dark:focus:ring-neutral-500 w-56" />
        </div>
      </div>

      <div className="flex gap-2 pb-2">
        {(['current', 'history'] as const).map((tabKey) => (
          <button key={tabKey} onClick={() => { setTab(tabKey); setSearch(''); setDateFrom(''); setDateTo(''); }}
            className={`py-2 px-6 rounded-full text-sm font-bold leading-5 transition-colors ${
              tab === tabKey
                ? 'bg-black text-white dark:bg-neutral-100 dark:text-black shadow-sm'
                : 'text-[#43474D] dark:text-neutral-400 hover:text-black dark:hover:text-neutral-200'
            }`}
          >
            {tabKey === 'current' ? t('dashboard.borrowed_tab_current') : t('dashboard.borrowed_tab_history')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-neutral-400 dark:text-neutral-500 font-manrope text-sm animate-pulse">{t('dashboard.borrowed_loading')}</div>
        </div>
      ) : isCurrent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((book) => (
            <BorrowedBookCard
              key={book.id}
              book={book}
              onCancel={handleCancelReservation}
              onViewPin={handleViewPin}
              onGeneratePin={handleGeneratePin}
              onGenerateReturnPin={handleGenerateReturnPin}
              onExtend={handleRequestExtend}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-neutral-400 dark:text-neutral-500 font-manrope text-sm">{t('dashboard.borrowed_no_books')}</div>
          )}
        </div>
      ) : (
        <BorrowedHistoryTable books={filtered} />
      )}

      {extendError && (
        <div className="flex justify-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-6 py-3 max-w-md">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium text-center">{extendError}</p>
          </div>
        </div>
      )}

      {confirmExtendId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleCancelExtend}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-manrope text-lg font-bold text-black dark:text-neutral-100 mb-2">{t('dashboard.borrowed_extend_confirm_title')}</h3>
            <p className="text-[#615E58] dark:text-neutral-400 text-sm mb-6">{t('dashboard.borrowed_extend_confirm_message')}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={handleCancelExtend} className="py-2 px-5 rounded-full border border-[#E8E2D5] dark:border-neutral-600 text-[#43474D] dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">{t('dashboard.borrowed_extend_cancel')}</button>
              <button onClick={handleConfirmExtend} className="py-2 px-5 rounded-full bg-[#1A73E8] text-white dark:bg-blue-600 text-xs font-bold hover:opacity-90 transition-opacity">{t('dashboard.borrowed_extend_confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {pinError && (
        <div className="flex justify-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-6 py-3 max-w-md">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium text-center">{pinError}</p>
          </div>
        </div>
      )}

      <PinModal
        pin={pinModal.pin}
        expiresAt={pinModal.expiresAt}
        isOpen={pinModal.open}
        onClose={() => { setPinModal({ open: false, pin: '', expiresAt: '' }); setPinError(null); }}
        title={t('pin.return_title')}
      />
    </>
  );
}