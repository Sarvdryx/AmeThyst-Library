import React from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { Skeleton } from '../atoms';
import AnnouncementListItem, { type Announcement, type AnnouncementStatus } from './AnnouncementListItem';

interface AnnouncementManagementListProps {
  announcements: Announcement[];
  loading: boolean;
  selectedId: string | null;
  saving: boolean;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  getStatusBadgeStyles: (status: AnnouncementStatus) => string;
  getStatusTranslation: (status: AnnouncementStatus) => string;
}

export default function AnnouncementManagementList({
  announcements,
  loading,
  selectedId,
  saving,
  onSelect,
  onCreateNew,
  getStatusBadgeStyles,
  getStatusTranslation,
}: AnnouncementManagementListProps) {
  const { t } = useI18n();

  return (
    <div className="w-full lg:w-1/3 flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800 shadow-sm overflow-hidden h-[720px]">
      <div className="flex justify-between items-center p-6 border-b border-neutral-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-manrope">
          {t('announcements.all_announcements')}
        </h2>
        <button 
          onClick={onCreateNew}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-amber-600 text-white rounded-full text-xs font-bold font-hankenGrotesk hover:bg-slate-800 dark:hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>+</span>
          <span>{t('announcements.status_new')}</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 border border-neutral-200 dark:border-slate-800 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400 py-20">
            {t('announcements.no_announcements')}
          </div>
        ) : (
          announcements.map((ann) => (
            <AnnouncementListItem
              key={ann.id}
              announcement={ann}
              isSelected={selectedId === ann.id}
              onClick={() => onSelect(ann.id)}
              getStatusBadgeStyles={getStatusBadgeStyles}
              getStatusTranslation={getStatusTranslation}
            />
          ))
        )}
      </div>
    </div>
  );
}
