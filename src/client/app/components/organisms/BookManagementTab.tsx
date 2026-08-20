'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import FilterDropdown from '../molecules/FilterDropdown';
import BookTableHeader from '../molecules/BookTableHeader';
import BookTableRow from '../molecules/BookTableRow';
import BookTablePagination from '../molecules/BookTablePagination';
import EmptySearchResults from '../molecules/EmptySearchResults';
import { Button } from '../atoms/Button';
import type { BookEntry } from '../molecules/BookTableRow';

import BookFormModal from '../modals/BookFormModal';
import BookEditModal from '../modals/BookEditModal';
import BookDeleteModal from '../modals/BookDeleteModal';
import StockTransferModal from '../modals/StockTransferModal';

const ITEMS_PER_PAGE = 10;

export default function BookManagementTab() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBranchFilter, setActiveBranchFilter] = useState(''); // '' = All branches, '1' = Branch 1, '2' = Branch 2
  const [currentPage, setCurrentPage] = useState(1);
  const [rawBooks, setRawBooks] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBookForEdit, setSelectedBookForEdit] = useState<any | null>(null);
  const [selectedBookForDelete, setSelectedBookForDelete] = useState<any | null>(null);
  const [selectedBookForTransfer, setSelectedBookForTransfer] = useState<any | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    setLoading(true);
    try {
      const requestOptions: RequestInit = { credentials: 'include' };

      // 1. Fetch Branches list
      try {
        const branchesRes = await fetch(`${API_BASE}/api/branches`, requestOptions);
        if (branchesRes.ok) {
          const bData = await branchesRes.json();
          setBranches(Array.isArray(bData) ? bData : bData.branches || bData.data || []);
        }
      } catch (e) {
        console.warn('Branches fetch skipped or optional:', e);
      }

      // 2. Fetch ALL Books Catalog from PostgreSQL
      let fetchedBooks: any[] = [];

      try {
        const booksRes = await fetch(`${API_BASE}/api/library/books?limit=100`, requestOptions);
        if (booksRes.ok) {
          const booksData = await booksRes.json();
          fetchedBooks = booksData.books || booksData.data || (Array.isArray(booksData) ? booksData : []);
        }
      } catch (e) {
        console.error('Error fetching full PostgreSQL book catalog:', e);
      }

      // Fallback: If /api/library/books returned no records, try /api/books
      if (!fetchedBooks || fetchedBooks.length === 0) {
        try {
          const fallbackRes = await fetch(`${API_BASE}/api/books?limit=100`, requestOptions);
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            fetchedBooks = fallbackData.data || fallbackData.books || (Array.isArray(fallbackData) ? fallbackData : []);
          }
        } catch (e) {
          console.error('Fallback /api/books also failed:', e);
        }
      }

      setRawBooks(fetchedBooks || []);
    } catch (err) {
      console.error('Failed to fetch librarian book management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Branch Filter Options (All branches, NVC, LT)
  const branchOptions = useMemo(() => {
    const options = [{ value: '', label: 'All branches' }];
    if (Array.isArray(branches) && branches.length > 0) {
      branches.forEach((b: any) => {
        const shortName = b.name_short ? b.name_short : `Branch ${b.branch_id}`;
        options.push({
          value: String(b.branch_id),
          label: `${shortName} (${b.name || 'Branch ' + b.branch_id})`
        });
      });
    } else {
      options.push(
        { value: '1', label: 'NVC (Nguyen Van Cu)' },
        { value: '2', label: 'LT (Linh Trung / Thu Duc)' }
      );
    }
    return options;
  }, [branches]);

  // Map raw DB books to BookEntry format for table rendering
  const mappedBooks: (BookEntry & { original: any })[] = useMemo(() => {
    if (!Array.isArray(rawBooks)) return [];

    const effectiveBranches = (branches && branches.length > 0)
      ? branches
      : [
          { branch_id: 1, name: 'Nguyen Van Cu', name_short: 'CS1' },
          { branch_id: 2, name: 'Thu Duc', name_short: 'CS2' }
        ];

    return rawBooks
      .map((b, idx) => {
        if (!b) return null;

        let totalQty = 0;
        let availableQty = 0;
        const branchStocksList: any[] = [];

        const dbStocksMap: Record<number, any> = {};
        const stocksArr = b.branch_stocks || b.inventory || [];
        if (Array.isArray(stocksArr)) {
          stocksArr.forEach((s: any) => {
            const brId = parseInt(s.branch_id || s.branchId, 10);
            if (brId) dbStocksMap[brId] = s;
          });
        }
        if (b.branch_id !== undefined && b.branch_id !== null) {
          const brId = parseInt(b.branch_id, 10);
          if (brId && !dbStocksMap[brId]) {
            dbStocksMap[brId] = b;
          }
        }

        effectiveBranches.forEach((br: any) => {
          const bId = parseInt(br.branch_id, 10);
          const stock = dbStocksMap[bId];
          const q = stock
            ? (parseInt(stock.quantity !== undefined ? stock.quantity : (stock.totalCopies || stock.availableCopies || 0), 10) || 0)
            : 0;
          const aq = stock
            ? (parseInt(stock.available_quantity !== undefined ? stock.available_quantity : (stock.availableCopies !== undefined ? stock.availableCopies : q), 10) || 0)
            : 0;

          totalQty += q;
          availableQty += aq;

          branchStocksList.push({
            branch_id: bId,
            branch_name: br.name || stock?.branch_name || stock?.location || `Branch ${bId}`,
            name_short: br.name_short || stock?.name_short || `CS${bId}`,
            quantity: q,
            available_quantity: aq,
            shelf: stock?.shelf || 'N/A'
          });
        });

        // Format author string
        let authorStr = 'Unknown Author';
        if (Array.isArray(b.author)) {
          authorStr = b.author.filter(Boolean).map((a: any) => String(a).replace(/^\{|\}$/g, '').replace(/"/g, '').trim()).join(', ');
        } else if (typeof b.author === 'string' && b.author.trim()) {
          authorStr = b.author.replace(/^\{|\}$/g, '').replace(/"/g, '').trim();
        }

        // Format genres/category string
        let categoryStr = 'General';
        if (Array.isArray(b.genres) && b.genres.length > 0) {
          categoryStr = String(b.genres[0]).replace(/^\{|\}$/g, '').replace(/"/g, '').trim();
        } else if (typeof b.genres === 'string' && b.genres.trim()) {
          categoryStr = b.genres.replace(/^\{|\}$/g, '').replace(/"/g, '').split(',')[0].trim() || 'General';
        } else if (b.category) {
          categoryStr = String(b.category).trim();
        }

        // Format publisher string cleanly
        let publisherStr = 'N/A';
        if (typeof b.publisher === 'string' && b.publisher.trim()) {
          publisherStr = b.publisher.replace(/^\{|\}$/g, '').replace(/"/g, '').trim();
        } else if (Array.isArray(b.publisher) && b.publisher.length > 0) {
          publisherStr = b.publisher.map((p: any) => String(p).replace(/^\{|\}$/g, '').replace(/"/g, '').trim()).filter(Boolean).join(', ');
        }

        return {
          id: b.book_id || String(b.id || `book_${idx}`),
          coverSrc: b.image_url || b.coverImage || b.coverSrc || '/BookCover.png',
          title: String(b.title || 'Untitled').replace(/^\{|\}$/g, '').replace(/"/g, '').trim(),
          author: authorStr || 'Unknown Author',
          isbn: b.isbn || 'N/A',
          category: categoryStr,
          publisher: publisherStr || 'N/A',
          available: availableQty,
          total: totalQty,
          branchStocks: branchStocksList,
          original: b
        };
      })
      .filter(Boolean) as (BookEntry & { original: any })[];
  }, [rawBooks, branches]);

  // Execute clean text search and branch criteria filtering
  const filteredBooks = useMemo(() => {
    if (!Array.isArray(mappedBooks)) return [];
    let books = mappedBooks;

    // 1. Text Search (title, author, isbn, publisher matching)
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      books = books.filter(
        (b) =>
          (b.title || '').toLowerCase().includes(q) ||
          (b.author || '').toLowerCase().includes(q) ||
          (b.isbn || '').toLowerCase().includes(q) ||
          (b.publisher || '').toLowerCase().includes(q)
      );
    }

    // 2. Branch Filter (NVC = Available at NVC & NOT available at LT; LT = Available at LT & NOT available at NVC)
    if (activeBranchFilter) {
      const targetBranchId = parseInt(activeBranchFilter, 10);
      const otherBranchId = targetBranchId === 1 ? 2 : 1;

      books = books.filter((b) => {
        const targetStock = b.branchStocks?.find((s: any) => s.branch_id === targetBranchId);
        const otherStock = b.branchStocks?.find((s: any) => s.branch_id === otherBranchId);

        const isAvailableAtTarget = targetStock ? targetStock.available_quantity > 0 : false;
        const isAvailableAtOther = otherStock ? otherStock.available_quantity > 0 : false;

        return isAvailableAtTarget && !isAvailableAtOther;
      });
    }

    return books;
  }, [mappedBooks, searchQuery, activeBranchFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / ITEMS_PER_PAGE));
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleEditBook = (bookEntry: any) => {
    setSelectedBookForEdit(bookEntry.original || bookEntry);
  };

  const handleDeleteBook = (bookEntry: any) => {
    setSelectedBookForDelete(bookEntry.original || bookEntry);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveBranchFilter('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-4">
        <h1 className="text-[#1D1C16] dark:text-neutral-100 font-manrope text-[28px] font-extrabold leading-[34px] tracking-[-0.01em]">
          Books Management
        </h1>

        <div className="flex justify-between items-center w-full">
          <div className="flex items-start gap-3">
            {/* Search Bar */}
            <div className="relative max-w-[448px] w-[448px]">
              <div className="flex pt-[13px] pr-4 pb-[13px] pl-12 justify-center items-start rounded-xl border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800 w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder={t('librarian.search_placeholder') || "Search title, author, ISBN..."}
                  className="w-full bg-transparent border-none outline-none text-[#1D1C16] dark:text-neutral-200 font-manrope text-base placeholder-[#6B7280] dark:placeholder-neutral-400"
                />
              </div>
              <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-[13px] w-fit h-6">
                <path d="M16.6 18L10.3 11.7C9.8 12.1 9.225 12.4167 8.575 12.65C7.925 12.8833 7.23333 13 6.5 13C4.68333 13 3.14583 12.3708 1.8875 11.1125C0.629167 9.85417 0 8.31667 0 6.5C0 4.68333 0.629167 3.14583 1.8875 1.8875C3.14583 0.629167 4.68333 0 6.5 0C8.31667 0 9.85417 0.629167 11.1125 1.8875C12.3708 3.14583 13 4.68333 13 6.5C13 7.23333 12.8833 7.925 12.65 8.575C12.4167 9.225 12.1 9.8 11.7 10.3L18 16.6L16.6 18ZM6.5 11C7.75 11 8.8125 10.5625 9.6875 9.6875C10.5625 8.8125 11 7.75 11 6.5C11 5.25 10.5625 4.1875 9.6875 3.3125C2.4375 4.1875 2 5.25 2 6.5C2 7.75 2.4375 8.8125 3.3125 9.6875C4.1875 10.5625 5.25 11 6.5 11Z" fill="#74777D" />
              </svg>
            </div>

            {/* Branch Filter Dropdown (All branches, Branch 1, Branch 2) */}
            <FilterDropdown
              label="All branches"
              options={branchOptions}
              value={activeBranchFilter}
              onChange={(val) => { setActiveBranchFilter(val); setCurrentPage(1); }}
            />
          </div>

          <Button
            variant="primary"
            className="flex py-3 px-8 items-center gap-2 rounded-full cursor-pointer"
            onClick={() => setIsAddModalOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 8H0V6H6V0H8V6H14V8H8V14H6V8Z" fill="white" className="dark:fill-black" />
            </svg>
            <span className="text-white dark:text-black font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.05em]">
              {t('librarian.add_book')}
            </span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Loading catalog books...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <EmptySearchResults
          hasActiveFilters={!!(searchQuery || activeBranchFilter)}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <div className="flex flex-col items-start w-full rounded-xl border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] overflow-x-auto">
          <BookTableHeader />

          <div className="flex flex-col w-full divide-y divide-[#E8E2D5] dark:divide-neutral-700">
            {paginatedBooks.map((book) => (
              <BookTableRow
                key={book.id}
                book={book}
                renderActions={() => (
                  <div className="flex items-center gap-1.5 justify-end">

                    {/* Edit Button */}
                    <button
                      onClick={() => handleEditBook(book)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded transition-colors"
                      title="Edit Catalog Item"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteBook(book)}
                      className="p-1.5 text-slate-600 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded transition-colors"
                      title="Delete Catalog Item"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                )}
              />
            ))}
          </div>

          <div className="w-full border-t border-[#E8E2D5] dark:border-neutral-700 p-4">
            <BookTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <BookFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
        branches={branches}
      />

      <BookEditModal
        isOpen={!!selectedBookForEdit}
        onClose={() => setSelectedBookForEdit(null)}
        onSuccess={fetchData}
        book={selectedBookForEdit}
        branches={branches}
      />

      <BookDeleteModal
        isOpen={!!selectedBookForDelete}
        onClose={() => setSelectedBookForDelete(null)}
        onSuccess={fetchData}
        book={selectedBookForDelete}
        targetBranchId={null}
      />

      <StockTransferModal
        isOpen={!!selectedBookForTransfer}
        onClose={() => setSelectedBookForTransfer(null)}
        onSuccess={fetchData}
        book={selectedBookForTransfer}
        branches={branches}
      />
    </div>
  );
}
