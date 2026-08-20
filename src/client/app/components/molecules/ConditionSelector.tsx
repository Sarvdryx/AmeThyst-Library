"use client";

import { useI18n } from '../../providers/I18nProvider';
import ConditionCheckbox from '../atoms/ConditionCheckbox';

interface ConditionItem {
  id: string;
  labelKey: string;
}

const CONDITIONS: ConditionItem[] = [
  { id: 'perfect_condition', labelKey: 'dashboard.inspection_perfect' },
  { id: 'slight_cover_scratches', labelKey: 'dashboard.inspection_condition_slight_cover_scratches' },
  { id: 'folded_pages', labelKey: 'dashboard.inspection_condition_folded_pages' },
  { id: 'pencil_marks', labelKey: 'dashboard.inspection_condition_pencil_marks' },
  { id: 'ink_marks', labelKey: 'dashboard.inspection_condition_ink_marks' },
  { id: 'torn_pages', labelKey: 'dashboard.inspection_condition_torn_pages' },
  { id: 'water_damage', labelKey: 'dashboard.inspection_condition_water_damage' },
  { id: 'damaged_binding', labelKey: 'dashboard.inspection_condition_damaged_binding' },
  { id: 'missing_mats', labelKey: 'dashboard.inspection_condition_missing_mats' },
  { id: 'missing_pages', labelKey: 'dashboard.inspection_condition_missing_pages' },
  { id: 'lost', labelKey: 'dashboard.inspection_lost' },
];

interface ConditionSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function ConditionSelector({ selected, onChange }: ConditionSelectorProps) {
  const { t } = useI18n();

  const isPerfect = selected.includes('perfect_condition');
  const isLost = selected.includes('lost');
  const isDisabled = (id: string) => {
    if (isPerfect && id !== 'perfect_condition') return true;
    if (isLost && id !== 'lost') return true;
    return false;
  };

  const handleToggle = (id: string) => {
    if (id === 'perfect_condition') {
      if (isPerfect) {
        onChange([]);
      } else {
        onChange(['perfect_condition']);
      }
      return;
    }
    if (id === 'lost') {
      if (isLost) {
        onChange([]);
      } else {
        onChange(['lost']);
      }
      return;
    }
    if (isPerfect || isLost) return;

    const next = selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id];
    onChange(next);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {CONDITIONS.map(condition => (
        <ConditionCheckbox
          key={condition.id}
          id={condition.id}
          label={t(condition.labelKey)}
          checked={selected.includes(condition.id)}
          onChange={() => handleToggle(condition.id)}
          disabled={isDisabled(condition.id)}
        />
      ))}
    </div>
  );
}
