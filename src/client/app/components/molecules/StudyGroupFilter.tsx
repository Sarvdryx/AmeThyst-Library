"use client";
import React from 'react';
import { Input } from '../atoms/Input';
import { useI18n } from '../../providers/I18nProvider';
import type { StudyGroupFilterBranch } from '../../types/studyGroup';
import { localizedBranchName, localizedRoomName } from '../../utils/room';

function FilterCheckbox({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={`group flex min-h-10 items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A61] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 ${
        checked
          ? 'border-[#82B8B1] bg-[#E5F3F2] text-[#004F49] shadow-[0_1px_0_rgba(0,106,97,0.08)] dark:border-teal-700 dark:bg-teal-950/50 dark:text-teal-200'
          : 'border-[#E4DED5] bg-white text-[#4C4451] hover:border-[#B9AEA1] hover:bg-[#FBF8F4] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-500 dark:hover:bg-neutral-800'
      }`}
    >
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${checked ? 'border-[#006A61] bg-[#006A61] text-white' : 'border-[#A9A29A] bg-white text-transparent group-hover:border-[#006A61] dark:bg-neutral-950'}`}>
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
          <path d="m3 8.2 3 3L13 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

interface StudyGroupFilterProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  dateFilter: string;
  onDateChange: (value: string) => void;
  startTimeFilter: string;
  endTimeFilter: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  branches: StudyGroupFilterBranch[];
  selectedBranchIds: number[];
  selectedRoomIds: number[];
  onBranchToggle: (branchId: number) => void;
  onRoomToggle: (roomId: number) => void;
  onAllRooms: () => void;
}

export default function StudyGroupFilter({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateChange,
  startTimeFilter,
  endTimeFilter,
  onStartTimeChange,
  onEndTimeChange,
  branches,
  selectedBranchIds,
  selectedRoomIds,
  onBranchToggle,
  onRoomToggle,
  onAllRooms,
}: StudyGroupFilterProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid w-full gap-4 md:grid-cols-2">
        <div className="min-w-0 self-end">
          {/* Search Input */}
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <Input
              type="text"
              placeholder={t('study_together.search_placeholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="!h-10 w-full bg-white pl-10 shadow-sm dark:bg-neutral-900"
            />
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(150px,1.35fr)_minmax(100px,1fr)_minmax(100px,1fr)]">
          <label className="flex min-w-0 flex-col gap-1 text-xs text-neutral-600 dark:text-neutral-300">
            {t('study_together.filter_date')}
            <input type="date" value={dateFilter} onChange={(event) => onDateChange(event.target.value)} className="h-10 min-w-0 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs text-neutral-600 dark:text-neutral-300">
            {t('study_together.filter_from')}
            <input type="time" value={startTimeFilter} onChange={(event) => onStartTimeChange(event.target.value)} className="h-10 min-w-0 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs text-neutral-600 dark:text-neutral-300">
            {t('study_together.filter_to')}
            <input type="time" value={endTimeFilter} onChange={(event) => onEndTimeChange(event.target.value)} className="h-10 min-w-0 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          </label>
        </div>
      </div>

      <div className="flex justify-end border-t border-[#EAEAEA] pt-3 dark:border-neutral-800">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="study-group-more-filters"
          onClick={() => setExpanded((current) => !current)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#006A61] transition-colors hover:bg-[#E5F3F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A61] dark:text-teal-300 dark:hover:bg-teal-950/50"
        >
          {expanded ? t('study_together.less_filters') : t('study_together.more_filters')}
          <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m5 7.5 5 5 5-5" /></svg>
        </button>
      </div>

      {expanded && <div id="study-group-more-filters" className="grid gap-4 md:grid-cols-2">
        <fieldset className="rounded-2xl border border-[#E4DED5] bg-[#FCFAF7] px-4 pb-4 pt-2 shadow-[0_1px_2px_rgba(11,28,48,0.04)] dark:border-neutral-700 dark:bg-neutral-900/70">
          <legend className="px-2 text-xs font-bold uppercase tracking-[0.08em] text-[#486C7E] dark:text-teal-300">
            {t('study_together.filter_branches')}
            <span className="ml-2 rounded-full bg-[#E5F3F2] px-2 py-0.5 text-[10px] text-[#006A61] dark:bg-teal-950 dark:text-teal-300">{selectedBranchIds.length}/{branches.length}</span>
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {branches.map((branch) => <FilterCheckbox key={branch.branchId} checked={selectedBranchIds.includes(branch.branchId)} onChange={() => onBranchToggle(branch.branchId)} label={localizedBranchName(t, branch.branchId, branch.branchName)} />)}
          </div>
        </fieldset>
        <fieldset className="rounded-2xl border border-[#E4DED5] bg-[#FCFAF7] px-4 pb-4 pt-2 shadow-[0_1px_2px_rgba(11,28,48,0.04)] dark:border-neutral-700 dark:bg-neutral-900/70">
          <legend className="px-2 text-xs font-bold uppercase tracking-[0.08em] text-[#486C7E] dark:text-teal-300">
            {t('study_together.filter_rooms')}
            <span className="ml-2 rounded-full bg-[#E5F3F2] px-2 py-0.5 text-[10px] text-[#006A61] dark:bg-teal-950 dark:text-teal-300">{selectedRoomIds.length || t('study_together.filter_all_rooms')}</span>
          </legend>
          <div className="custom-scrollbar mt-2 grid max-h-32 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            <FilterCheckbox checked={selectedRoomIds.length === 0} onChange={onAllRooms} label={t('study_together.filter_all_rooms')} />
            {branches.filter((branch) => selectedBranchIds.includes(branch.branchId)).flatMap((branch) => branch.rooms).map((room) => <FilterCheckbox key={room.roomId} checked={selectedRoomIds.includes(room.roomId)} onChange={() => onRoomToggle(room.roomId)} label={localizedRoomName(t, room.roomId, room.roomName)} />)}
          </div>
        </fieldset>
      </div>}
    </div>
  );
}
