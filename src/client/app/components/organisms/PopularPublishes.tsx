"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import BookCard from '../molecules/BookCard';
import EmptySearchResults from '../molecules/EmptySearchResults';
import { useI18n } from '../../providers/I18nProvider';
import { apiFetch, safeFetch } from '../../utils/apiClient';

interface Book {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
}

interface PopularPublishesProps {
  searchQuery?: string;
  logHistory?: boolean;
  onFetchCompleted?: () => void;
}

export default function PopularPublishes({
  searchQuery = '',
  logHistory = false,
  onFetchCompleted
}: PopularPublishesProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read URL search params
  const currentPage = parseInt(searchParams.get('page') || '1');
  const genres = searchParams.get('genres') || '';
  const branches = searchParams.get('branches') || '';
  const availableOnly = searchParams.get('availableOnly') || '';
  const startYear = searchParams.get('startYear') || '';
  const endYear = searchParams.get('endYear') || '';

  const hasActiveFilters = !!(genres || branches || availableOnly || startYear || endYear || searchQuery);

  const [books, setBooks] = useState<Book[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const limit = 24;

        if (searchQuery || genres || branches || availableOnly || startYear || endYear) {
          // Formulate filters object
          const filterObj: any = {};
          if (genres) {
            filterObj.genres = genres.split(',');
          }
          if (branches) {
            filterObj.branches = branches.split(',').map(Number);
          }
          if (availableOnly) {
            filterObj.availableOnly = availableOnly === 'true';
          }
          if (startYear || endYear) {
            filterObj.publicationDate = {};
            if (startYear) filterObj.publicationDate.start = startYear;
            if (endYear) filterObj.publicationDate.end = endYear;
          }

          const result = await apiFetch<any>('/api/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: searchQuery,
              logHistory: logHistory,
              filters: filterObj
            })
          });

          if (result.success && result.data) {
            const data = result.data;
            const allSearchBooks = data.books || [];

            // Client-side pagination slice
            const startIndex = (currentPage - 1) * limit;
            const paginatedBooks = allSearchBooks.slice(startIndex, startIndex + limit);

            setBooks(paginatedBooks);
            setTotalPages(Math.ceil(allSearchBooks.length / limit) || 1);

            // Save searchHistoryId if returned (for click tracking later)
            if (typeof window !== 'undefined') {
              if (data.searchHistoryId) {
                sessionStorage.setItem('currentSearchHistoryId', data.searchHistoryId);
              } else {
                sessionStorage.removeItem('currentSearchHistoryId');
              }
              // Save search context for later click logging if needed
              sessionStorage.setItem('currentSearchQuery', searchQuery);
              sessionStorage.setItem('currentFilters', JSON.stringify(filterObj));
            }
          }
          if (onFetchCompleted) {
            onFetchCompleted();
          }
        } else {
          // Clear active search history context for passive catalog clicks
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('currentSearchHistoryId');
            sessionStorage.removeItem('currentSearchQuery');
            sessionStorage.removeItem('currentFilters');
          }

          // Build dynamic query parameters for explore endpoint
          const params = new URLSearchParams();
          params.set('page', currentPage.toString());
          params.set('limit', limit.toString());

          const res = await safeFetch(`${apiUrl}/api/library/books?${params.toString()}`);
          if (res && res.ok) {
            const data = await res.json();
            setBooks(data.books || []);
            setTotalPages(data.totalPages || 1);
          }
          if (onFetchCompleted) {
            onFetchCompleted();
          }
        }
      } catch (error) {
        console.error('Error fetching books from catalog:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [currentPage, genres, branches, availableOnly, startYear, endYear, searchQuery, logHistory]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('currentSearchHistoryId');
    }
    router.push(pathname);
  };

  return (
    <div className="w-full max-w-7xl mx-auto my-12 px-4">
      {/* Section Header */}
      <h2 className="text-foreground font-manrope text-2xl font-bold tracking-[0.01em] mb-6">
        {hasActiveFilters ? t('library.result') : t('library.title')}
      </h2>

      {/* Book Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="flex flex-col gap-3 animate-pulse">
              <div className="w-full aspect-[3/4] bg-[#EAEAEA] dark:bg-neutral-700 rounded-lg" />
              <div className="flex flex-col gap-1.5">
                <div className="h-4 bg-[#EAEAEA] dark:bg-neutral-700 rounded-md w-3/4" />
                <div className="h-3 bg-[#EAEAEA] dark:bg-neutral-700 rounded-md w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <EmptySearchResults hasActiveFilters={hasActiveFilters} onClearFilters={handleClearFilters} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {books.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              author={book.author}
              image={book.coverImage || "/Rectangle1248.png"}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 select-none">
          <button
            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 h-8 rounded-lg font-inter text-sm font-semibold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {t('library.prev')}
          </button>

          {(() => {
            const pages = [];
            const range = 1;

            pages.push(
              <button
                key={1}
                onClick={() => handlePageChange(1)}
                className={`w-8 h-8 rounded-lg font-inter text-sm font-semibold transition-colors cursor-pointer ${
                  currentPage === 1 ? "bg-teal text-white" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                }`}
              >
                1
              </button>
            );

            if (currentPage > range + 2) {
              pages.push(<span key="left-dots" className="px-1 text-neutral-500 font-bold">...</span>);
            }

            const start = Math.max(2, currentPage - range);
            const end = Math.min(totalPages - 1, currentPage + range);

            for (let i = start; i <= end; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`w-8 h-8 rounded-lg font-inter text-sm font-semibold transition-colors cursor-pointer ${
                    currentPage === i ? "bg-teal text-white" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                  }`}
                >
                  {i}
                </button>
              );
            }

            if (currentPage < totalPages - range - 1) {
              pages.push(<span key="right-dots" className="px-1 text-neutral-500 font-bold">...</span>);
            }

            if (totalPages > 1) {
              pages.push(
                <button
                  key={totalPages}
                  onClick={() => handlePageChange(totalPages)}
                  className={`w-8 h-8 rounded-lg font-inter text-sm font-semibold transition-colors cursor-pointer ${
                    currentPage === totalPages ? "bg-teal text-white" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                  }`}
                >
                  {totalPages}
                </button>
              );
            }

            return pages;
          })()}

          <button
            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 h-8 rounded-lg font-inter text-sm font-semibold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {t('library.next')}
          </button>
        </div>
      )}
    </div>
  );
}
