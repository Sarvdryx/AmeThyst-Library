"use client";
import React from 'react';
import { useI18n } from '../../providers/I18nProvider';

import { CustomSelect } from '../atoms/CustomSelect';

export type SortOption = 'newest' | 'availability';

interface StudyGroupSortProps {
  sortOption: SortOption;
  onSortChange: (val: SortOption) => void;
}

export default function StudyGroupSort({ sortOption, onSortChange }: StudyGroupSortProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {t('study_together.sort_by')}:
      </span>
      <CustomSelect
        className="w-40"
        value={sortOption}
        onChange={(val) => onSortChange(val as SortOption)}
        options={[
          { value: 'newest', label: t('study_together.sort_newest') },
          { value: 'availability', label: t('study_together.sort_availability') }
        ]}
      />
    </div>
  );
}
