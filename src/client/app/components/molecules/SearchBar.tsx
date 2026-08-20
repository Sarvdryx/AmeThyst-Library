"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../atoms/Button';
import { useI18n } from '../../providers/I18nProvider';
import { useAuth } from '../../providers/AuthProvider';
import RecentSearchesDropdown from './RecentSearchesDropdown';
import { getTopRecentSearches, saveRecentSearch, type RecentSearchItem } from '../../utils/searchApi';

interface SearchBarProps {
  onFilterClick?: () => void;
  onSearchTrigger?: (query: string, isSubmit?: boolean) => void;
  value?: string;
  onChange?: (val: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  hasActiveFilters?: boolean;
}

export default function SearchBar({
  onFilterClick,
  onSearchTrigger,
  value,
  onChange,
  onSearch,
  placeholder,
  hasActiveFilters = false
}: SearchBarProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeQuery = value !== undefined ? value : query;

  // Close dropdown when clicking outside container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const items = await getTopRecentSearches(5);
      setRecentSearches(items);
    } catch (err) {
      console.error('Failed to fetch recent search history:', err);
      setRecentSearches([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFocus = () => {
    if (onSearchTrigger) {
      onSearchTrigger(activeQuery);
    }
    if (user) {
      void fetchHistory();
      setIsDropdownOpen(true);
    }
  };

  const executeSearchWithTerm = (term: string) => {
    if (inputRef.current) {
      inputRef.current.blur();
    }
    setIsDropdownOpen(false);

    if (user && term.trim()) {
      void saveRecentSearch(term.trim()).then(() => {
        void fetchHistory();
      });
    }

    if (onSearchTrigger) {
      onSearchTrigger(term, true);
      return;
    }
    if (onSearch) {
      onSearch();
      return;
    }
    if (term.trim()) {
      router.push(`/library?genres=&query=${encodeURIComponent(term.trim())}`);
    }
  };

  const executeSearch = () => {
    executeSearchWithTerm(activeQuery);
  };

  const handleRecentSelect = (term: string) => {
    if (onChange) {
      onChange(term);
    } else {
      setQuery(term);
    }
    executeSearchWithTerm(term);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onChange) {
      onChange(val);
    } else {
      setQuery(val);
    }
    if (onSearchTrigger) {
      onSearchTrigger(val, false);
    }
  };

  const hasDropdownContent = user && isDropdownOpen;

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-[896px] mx-auto bg-white dark:bg-neutral-800 border-2 shadow-sm p-4 flex items-center justify-between gap-4 mt-[-44px] relative z-30 transition-all duration-200 ${
        hasDropdownContent
          ? 'rounded-t-2xl rounded-b-none border-neutral-200 dark:border-neutral-700 shadow-2xl'
          : 'rounded-2xl border-transparent dark:border-neutral-700'
      }`}
    >
      {/* Search Input Group */}
      <div className="flex items-center gap-4 flex-grow">
        {/* Search Icon */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 shrink-0 text-foreground dark:text-neutral-400 cursor-pointer hover:scale-105 transition-transform"
          onClick={executeSearch}
        >
          <path
            d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14.03 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z"
            fill="currentColor"
          />
        </svg>
        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={activeQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder || t('searchbar.placeholder')}
          className="w-full bg-transparent border-none outline-none font-inter text-base text-foreground dark:text-neutral-100 placeholder-neutral-400"
        />
      </div>

      {/* Filter Button */}
      {onFilterClick && (
        <div className="relative shrink-0">
          <Button 
            variant={hasActiveFilters ? "primary" : "outline"} 
            className="flex items-center gap-2 py-2 px-4 h-auto rounded-xl cursor-pointer"
            onClick={onFilterClick}
          >
            <svg
              width="18"
              height="12"
              viewBox="0 0 18 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[18px] h-3"
            >
              <path
                d="M7 12H11V10H7V12ZM0 0V2H18V0H0ZM3 7H15V5H3V7Z"
                fill="currentColor"
              />
            </svg>
            <span>{t('searchbar.filter')}</span>
          </Button>
        </div>
      )}

      {/* Attached Search History Dropdown (Google Search style) */}
      {user && (
        <RecentSearchesDropdown
          items={recentSearches}
          visible={isDropdownOpen}
          loading={loadingHistory}
          onSelect={handleRecentSelect}
        />
      )}
    </div>
  );
}
