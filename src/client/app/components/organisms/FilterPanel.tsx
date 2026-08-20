import React, { useEffect } from 'react';
import GenreTag from '../atoms/GenreTag';
import ToggleSwitch from '../atoms/ToggleSwitch';
import YearRangeFilter from '../molecules/YearRangeFilter';
import { useI18n } from '../../providers/I18nProvider';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
  selectedBranches: number[];
  onBranchesChange: (branches: number[]) => void;
  availableOnly: boolean;
  onAvailableOnlyChange: (available: boolean) => void;
  startYear: string;
  endYear: string;
  onStartYearChange: (year: string) => void;
  onEndYearChange: (year: string) => void;
  onYearSubmit: () => void;
  onReset: () => void;
}

const GENRES = [
  'Mathematics',
  'Physics',
  'Biology',
  'Computer Science',
  'Fiction',
  'Nonfiction',
  'Philosophy',
  'Psychology',
  'Literature',
  'Others'
];

const BRANCHES = [
  { id: 1, name: 'Nguyen Van Cu Campus Library', short: 'NVC' },
  { id: 2, name: 'Linh Trung Campus Library', short: 'LT' }
];

export default function FilterPanel({
  isOpen,
  onClose,
  selectedGenres,
  onGenresChange,
  selectedBranches,
  onBranchesChange,
  availableOnly,
  onAvailableOnlyChange,
  startYear,
  endYear,
  onStartYearChange,
  onEndYearChange,
  onYearSubmit,
  onReset
}: FilterPanelProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter((g) => g !== genre));
    } else {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  const toggleBranch = (branchId: number) => {
    if (selectedBranches.includes(branchId)) {
      onBranchesChange(selectedBranches.filter((id) => id !== branchId));
    } else {
      onBranchesChange([...selectedBranches, branchId]);
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className={`fixed top-[84px] inset-x-0 bottom-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-out drawer panel */}
      <div
        className={`fixed top-[84px] right-0 h-[calc(100vh-84px)] w-full sm:w-[450px] bg-[#FFF8EB] dark:bg-neutral-900 border-l border-[#C5C6CD] dark:border-neutral-800 shadow-2xl transition-transform duration-300 ease-in-out z-40 flex flex-col overflow-y-auto scrollbar-thin [scrollbar-color:#C5C6CD_transparent] dark:[scrollbar-color:theme(colors.neutral.700)_transparent] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C5C6CD] dark:border-neutral-800">
          <h2 className="text-xl font-bold text-[#091426] dark:text-neutral-100 font-manrope">{t('filter.filters')}</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={onReset}
              className="text-sm font-semibold text-[#006F66] dark:text-teal-400 hover:underline transition font-inter cursor-pointer"
            >
              {t('filter.reset_all')}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition text-[#45474C] dark:text-neutral-400 active:scale-95 cursor-pointer"
              title={t('filter.close_panel')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-8">
          {/* Section 1: Genres */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-[#091426] dark:text-neutral-200 font-inter">{t('filter.genres')}</span>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <GenreTag
                  key={genre}
                  genre={genre}
                  selected={selectedGenres.includes(genre)}
                  onClick={() => toggleGenre(genre)}
                />
              ))}
            </div>
          </div>

          {/* Section 2: Campus Locations */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-[#091426] dark:text-neutral-200 font-inter">{t('filter.campus_location')}</span>
            <div className="flex flex-col gap-3">
              {BRANCHES.map((branch) => (
                <label
                  key={branch.id}
                  className="flex items-center gap-3 cursor-pointer select-none text-[#45474C] dark:text-neutral-300 hover:text-[#091426] dark:hover:text-white font-inter text-sm font-medium"
                >
                  <input
                    type="checkbox"
                    checked={selectedBranches.includes(branch.id)}
                    onChange={() => toggleBranch(branch.id)}
                    className="w-5 h-5 rounded-lg border-[#C5C6CD] dark:border-neutral-700 text-[#006F66] dark:text-teal dark:bg-neutral-800 focus:ring-[#006F66]"
                  />
                  <span>{branch.name} ({branch.short})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Publication Year */}
          <YearRangeFilter
            startYear={startYear}
            endYear={endYear}
            onStartYearChange={onStartYearChange}
            onEndYearChange={onEndYearChange}
            onYearSubmit={onYearSubmit}
          />

          {/* Section 4: Availability */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-[#C5C6CD] dark:border-neutral-800 bg-white dark:bg-neutral-800 shadow-xs">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#091426] dark:text-neutral-200 font-inter">{t('filter.available_only')}</span>
              <span className="text-xs text-[#75777D] dark:text-neutral-400 font-inter">{t('filter.hide_out_of_stock')}</span>
            </div>
            <ToggleSwitch
              checked={availableOnly}
              onChange={onAvailableOnlyChange}
            />
          </div>
        </div>
      </div>
    </>
  );
}
