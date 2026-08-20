import React from 'react';
import Link from 'next/link';
import BookCover from '../atoms/BookCover';
import { apiFetch } from '../../utils/apiClient';
import { getLoggedInUser } from '../../utils/user';

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  image: string;
}

export default function BookCard({ id, title, author, image }: BookCardProps) {
  const handleCardClick = () => {
    if (typeof window !== 'undefined') {
      const searchHistoryId = sessionStorage.getItem('currentSearchHistoryId');
      if (getLoggedInUser()) {
        // Async log recommendation click if it exists
        void apiFetch(`/api/dashboard/user/recommendations/${id}/click`, {
          method: 'POST',
        }).catch(err => console.error("Failed to log recommendation click:", err));

        const query = sessionStorage.getItem('currentSearchQuery') || '';
        const filtersStr = sessionStorage.getItem('currentFilters');
        const filters = filtersStr ? JSON.parse(filtersStr) : null;
        const hasFilters = filters && Object.keys(filters).length > 0;

        if (searchHistoryId || query || hasFilters) {
          void apiFetch('/api/search/history/click', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              searchHistoryId,
              bookId: id,
              query,
              filters
            })
          })
          .then(result => {
            if (!result.success) throw new Error(result.message || 'Failed to log search click');
            const data = result.data as { searchHistoryId?: string } | undefined;
            if (data?.searchHistoryId) {
              sessionStorage.setItem('currentSearchHistoryId', data.searchHistoryId);
            }
          })
          .catch(err => console.error("Failed to log intent click:", err));
        }
      }
    }
  };

  return (
    <Link 
      href={`/library/${id}`} 
      onClick={handleCardClick}
      className="flex flex-col gap-3 group cursor-pointer block"
    >
      {/* Book Cover Container */}
      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-200">
        <BookCover
          src={image}
          alt={title}
          className="group-hover:scale-105 transition-transform duration-300"
          containerClassName="w-full h-full"
        />
      </div>
      {/* Book Info */}
      <div className="flex flex-col gap-1">
        <h3 className="text-navy dark:text-neutral-200 font-manrope text-base font-bold leading-tight line-clamp-2">
          {title}
        </h3>
        <p className="text-[#75777D] dark:text-neutral-400 font-inter text-xs font-medium">
          {author}
        </p>
      </div>
    </Link>
  );
}
