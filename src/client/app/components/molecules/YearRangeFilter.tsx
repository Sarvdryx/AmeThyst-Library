import React from 'react';
import { useI18n } from '../../providers/I18nProvider';

interface YearRangeFilterProps {
  startYear: string;
  endYear: string;
  onStartYearChange: (val: string) => void;
  onEndYearChange: (val: string) => void;
  onYearSubmit: () => void;
}

export default function YearRangeFilter({
  startYear,
  endYear,
  onStartYearChange,
  onEndYearChange,
  onYearSubmit
}: YearRangeFilterProps) {
  const { t } = useI18n();
  // Helper to intercept the Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onYearSubmit();
      e.currentTarget.blur();
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-[#091426] dark:text-neutral-200 font-inter">{t('filter.publication_year')}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder={t('filter.min_year')}
          value={startYear}
          onChange={(e) => onStartYearChange(e.target.value)}
          onKeyDown={handleKeyDown} // <--- Triggers on Enter
          onBlur={onYearSubmit}
          className="w-full px-3 py-2 border border-[#C5C6CD] dark:border-neutral-700 rounded-xl font-inter text-sm text-navy dark:text-neutral-200 bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#006F66] dark:focus:border-teal"
          min="0"
          max="2100"
        />
        <span className="text-gray-400 font-inter text-sm">—</span>
        <input
          type="number"
          placeholder={t('filter.max_year')}
          value={endYear}
          onChange={(e) => onEndYearChange(e.target.value)}
          onKeyDown={handleKeyDown} // <--- Triggers on Enter
          onBlur={onYearSubmit}
          className="w-full px-3 py-2 border border-[#C5C6CD] dark:border-neutral-700 rounded-xl font-inter text-sm text-navy dark:text-neutral-200 bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#006F66] dark:focus:border-teal"
          min="0"
          max="2100"
        />
      </div>
    </div>
  );
}
