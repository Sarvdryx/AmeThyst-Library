'use client';

import React from 'react';
import { useI18n } from '../../providers/I18nProvider';
import type { RecentSearchItem } from '../../utils/searchApi';

interface RecentSearchesDropdownProps {
  items: RecentSearchItem[];
  visible: boolean;
  loading?: boolean;
  onSelect: (term: string) => void;
}

export default function RecentSearchesDropdown({
  items,
  visible,
  loading = false,
  onSelect
}: RecentSearchesDropdownProps) {
  const { t } = useI18n();

  if (!visible) return null;

  return (
    <div
      className="absolute top-full left-[-2px] right-[-2px] bg-white dark:bg-neutral-800 border-2 border-t-0 border-transparent dark:border-neutral-700 rounded-b-2xl shadow-xl overflow-hidden font-manrope z-50 transition-all animate-fadeIn"
      onMouseDown={(e) => e.preventDefault()} // Prevent blurring input before selection
    >
      <div className="h-[1px] bg-neutral-200/80 dark:bg-neutral-700/80 mx-4" />

      <div className="px-5 py-2 flex justify-between items-center bg-[#FBF9F5]/40 dark:bg-neutral-900/30">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {t('searchbar.recent_searches') || 'Recent Searches'}
        </span>
      </div>

      {loading ? (
        <div className="px-5 py-4 text-center text-xs text-neutral-400 dark:text-neutral-500 animate-pulse">
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 py-4 text-center text-xs text-neutral-400 dark:text-neutral-500 italic">
          {t('searchbar.no_recent_searches') || 'No recent searches'}
        </div>
      ) : (
        <ul className="py-1">
          {items.map((item) => (
            <li key={item.id || item.searchContent}>
              <button
                type="button"
                onClick={() => onSelect(item.searchContent)}
                className="w-full px-5 py-3 text-left text-sm flex items-center justify-between gap-3 text-neutral-800 dark:text-neutral-100 hover:bg-[#F5F0E6] dark:hover:bg-neutral-700/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Google Search History Clock Icon */}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-neutral-400 dark:text-neutral-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="truncate font-medium text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.searchContent}
                  </span>
                </div>
                {/* Arrow Icon */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-neutral-400 dark:text-neutral-500 opacity-60 group-hover:opacity-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all shrink-0"
                >
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
