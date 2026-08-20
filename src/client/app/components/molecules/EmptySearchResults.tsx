import React from 'react';
import { useI18n } from '../../providers/I18nProvider';

interface EmptySearchResultsProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export default function EmptySearchResults({ hasActiveFilters, onClearFilters }: EmptySearchResultsProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col justify-center items-center h-64 gap-4 text-[#75777D] font-medium border-2 border-dashed border-[#C5C6CD] rounded-2xl bg-white/50 p-8 select-none">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#75777D" strokeWidth="1.5" className="text-gray-400">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="text-center flex flex-col gap-1">
        <span className="text-[#091426] font-bold text-lg font-manrope">{t('library.no_books_found')}</span>
        <span className="text-sm font-inter">{t('library.no_books_found_message')}</span>
      </div>
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="mt-2 px-6 py-2.5 bg-[#006F66] text-white rounded-xl text-sm font-semibold hover:bg-[#005a53] transition active:scale-95 cursor-pointer shadow-sm font-inter"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}
