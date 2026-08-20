"use client";

import { useI18n } from '../../providers/I18nProvider';

interface BookTablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function BookTablePagination({ currentPage, totalPages, onPageChange }: BookTablePaginationProps) {
  const { t } = useI18n();

  const pages: (number | 'ellipsis')[] = [];
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages, currentPage + 1);
  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('ellipsis');
  }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return (
    <div className="flex p-6 justify-between items-center border-t border-[#E8E2D5] dark:border-neutral-700 bg-[rgba(248,243,233,0.30)] dark:bg-neutral-900/30 w-full">
      <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.05em]">
        {t('librarian.page_of', { current: currentPage, total: totalPages })}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex justify-center items-center rounded-full border border-[#E8E2D5] dark:border-neutral-600 w-10 h-10 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:cursor-not-allowed"
        >
          <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 12L0 6L6 0L7.4 1.4L2.8 6L7.4 10.6L6 12Z" fill="#1D1C16" className="dark:fill-neutral-300" />
          </svg>
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e${i}`} className="text-[#43474D] dark:text-neutral-400 font-manrope text-base leading-6">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`flex justify-center items-center rounded-full border w-10 h-10 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.05em] transition-colors ${
                p === currentPage
                  ? 'border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-700 text-[#000] dark:text-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]'
                  : 'border-[#E8E2D5] dark:border-neutral-600 text-[#43474D] dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex justify-center items-center rounded-full border border-[#E8E2D5] dark:border-neutral-600 w-10 h-10 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:cursor-not-allowed"
        >
          <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.6 6L0 1.4L1.4 0L7.4 6L1.4 12L0 10.6L4.6 6Z" fill="#1D1C16" className="dark:fill-neutral-300" />
          </svg>
        </button>
      </div>
    </div>
  );
}
