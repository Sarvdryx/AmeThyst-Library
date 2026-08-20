"use client";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="py-4 px-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 flex justify-between items-center w-full">
      {/* Show count */}
      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
        Showing {(page - 1) * 10 + 1} - {Math.min(page * 10, totalItems)} of {totalItems} users
      </span>

      {/* Pagination buttons */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={page === 1}
          className="p-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
          aria-label="Previous Page"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Dynamic indices list */}
        {Array.from({ length: totalPages }).map((_, i) => {
          const pNum = i + 1;
          const isActive = page === pNum;
          
          // Show simple pagination window
          if (totalPages > 5 && Math.abs(page - pNum) > 2 && pNum !== 1 && pNum !== totalPages) {
            if (pNum === 2 || pNum === totalPages - 1) {
              return <span key={pNum} className="px-2 text-neutral-400">...</span>;
            }
            return null;
          }

          return (
            <button
              key={pNum}
              onClick={() => onPageChange(pNum)}
              className={`w-9 h-9 font-extrabold text-xs rounded-md transition-colors cursor-pointer ${
                isActive
                  ? 'bg-neutral-800 dark:bg-neutral-300 text-white dark:text-neutral-900 border border-neutral-800 dark:border-neutral-300'
                  : 'border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {pNum}
            </button>
          );
        })}

        {/* Next */}
        <button
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          disabled={page === totalPages}
          className="p-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
          aria-label="Next Page"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

      </div>
    </div>
  );
}
