"use client";

import React, { useState } from 'react';
import { useI18n } from '../../../providers/I18nProvider';

export default function TopCategoriesBarChart({ categories = [] }) {
  const { t } = useI18n();
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const maxTurns = categories.length > 0 ? Math.max(...categories.map((c) => c.borrowTurns)) : 1;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-sm border border-stone-200/60 dark:border-neutral-700 flex flex-col w-full h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-manrope text-xl font-bold text-black dark:text-white">
          {t('admin.top_categories_title')}
        </h2>
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-stone-100 dark:bg-neutral-700 px-2.5 py-1 rounded-md">
          {t('admin.borrow_turns')}
        </span>
      </div>

      {categories.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
          {t('admin.no_category_data')}
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-around gap-2 overflow-y-auto custom-scrollbar pr-1">
          {categories.map((item) => {
            const widthPct = Math.max(8, Math.round((item.borrowTurns / maxTurns) * 100));
            const isHovered = hoveredCategory === item.categoryId;

            return (
              <div
                key={item.categoryId}
                className="group relative flex flex-col gap-1 cursor-pointer"
                onMouseEnter={() => setHoveredCategory(item.categoryId)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="flex justify-between items-center text-xs font-bold font-hankenGrotesk text-stone-800 dark:text-neutral-200">
                  <span className="truncate max-w-[200px] sm:max-w-[280px]">
                    <span className="text-neutral-400 mr-2">#{item.rank}</span>
                    {item.categoryName}
                  </span>
                  <span className="text-stone-600 dark:text-neutral-400 font-mono">
                    {item.borrowTurns.toLocaleString()} {t('admin.borrow_turns')}
                  </span>
                </div>

                <div className="w-full bg-stone-100 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHovered
                        ? 'bg-amber-600 dark:bg-amber-400'
                        : 'bg-black dark:bg-white'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>

                {/* Tooltip Overlay */}
                {isHovered && (
                  <div className="absolute right-0 -top-8 bg-black text-white text-[10px] font-semibold px-2 py-1 rounded shadow z-10 animate-fade-in">
                    {item.categoryName}: {item.borrowTurns} {t('admin.borrow_turns')} ({item.percentageShare}%)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
