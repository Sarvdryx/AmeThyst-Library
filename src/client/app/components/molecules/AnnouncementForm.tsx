import React from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { type AnnouncementStatus } from './AnnouncementListItem';

interface AnnouncementFormProps {
  selectedId: string | null;
  isNew: boolean;
  status: AnnouncementStatus | undefined;
  saving: boolean;
  editTitle: string;
  editExpiryDate: string;
  editContent: string;
  onTitleChange: (value: string) => void;
  onExpiryDateChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: (targetStatus?: AnnouncementStatus) => void;
  onDelete: () => void;
}

export default function AnnouncementForm({
  selectedId,
  isNew,
  status,
  saving,
  editTitle,
  editExpiryDate,
  editContent,
  onTitleChange,
  onExpiryDateChange,
  onContentChange,
  onSave,
  onDelete,
}: AnnouncementFormProps) {
  const { t } = useI18n();

  const renderActionButtons = () => {
    const btnBase = "px-6 py-2 rounded-full text-xs font-bold tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const secondaryBtn = `${btnBase} border border-neutral-400 dark:border-slate-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-slate-800`;
    const primaryBtn = `${btnBase} bg-slate-900 dark:bg-amber-600 text-white hover:bg-slate-800 dark:hover:bg-amber-700`;
    const warningBtn = `${btnBase} border border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30`;

    // Creating a brand-new announcement: draft or publish immediately.
    if (isNew) {
      return (
        <>
          <button onClick={() => onSave('DRAFT')} disabled={saving} className={secondaryBtn}>
            {t('announcements.save_draft')}
          </button>
          <button onClick={() => onSave('ACTIVE')} disabled={saving} className={primaryBtn}>
            {saving ? t('announcements.loading_announcements') : t('announcements.publish_now')}
          </button>
        </>
      );
    }

    if (status === 'DRAFT') {
      return (
        <>
          <button onClick={() => onSave()} disabled={saving} className={secondaryBtn}>
            {t('announcements.save_changes')}
          </button>
          <button onClick={() => onSave('ACTIVE')} disabled={saving} className={primaryBtn}>
            {saving ? t('announcements.loading_announcements') : t('announcements.publish_now')}
          </button>
        </>
      );
    }

    if (status === 'ACTIVE') {
      return (
        <>
          <button onClick={() => onSave('DRAFT')} disabled={saving} className={warningBtn}>
            {t('announcements.unpublish')}
          </button>
          <button onClick={() => onSave()} disabled={saving} className={primaryBtn}>
            {saving ? t('announcements.loading_announcements') : t('announcements.save_changes')}
          </button>
        </>
      );
    }

    if (status === 'EXPIRED') {
      return (
        <>
          <button onClick={() => onSave()} disabled={saving} className={secondaryBtn}>
            {t('announcements.save_changes')}
          </button>
          <button onClick={() => onSave('ACTIVE')} disabled={saving} className={primaryBtn}>
            {saving ? t('announcements.loading_announcements') : t('announcements.republish')}
          </button>
        </>
      );
    }

    return null;
  };

  return (
    <div className="w-full lg:w-2/3 flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800 shadow-sm h-[720px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-neutral-200 dark:border-slate-800 gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-hankenGrotesk">
          {t('announcements.editor_title')}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {selectedId && !isNew && (
            <button 
              onClick={onDelete}
              disabled={saving}
              className="px-6 py-2 border border-red-500 text-red-500 rounded-full text-xs font-bold tracking-wider hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('announcements.delete')}
            </button>
          )}
          {renderActionButtons()}
        </div>
      </div>

      {selectedId ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 tracking-wider">
              {t('announcements.announcement_title')}
            </label>
            <input 
              type="text" 
              value={editTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              disabled={saving}
              className="w-full p-4 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow disabled:opacity-70"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 tracking-wider">
              {t('announcements.expiry_date')}
            </label>
            <input 
              type="date" 
              value={editExpiryDate}
              onChange={(e) => onExpiryDateChange(e.target.value)}
              disabled={saving}
              min={(() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const date = String(today.getDate()).padStart(2, '0');
                return `${year}-${month}-${date}`;
              })()}
              className="w-full p-4 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow disabled:opacity-70"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 tracking-wider">
              {t('announcements.content_body')}
            </label>
            <textarea 
              value={editContent}
              onChange={(e) => onContentChange(e.target.value)}
              disabled={saving}
              rows={10}
              className="w-full p-4 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow resize-y disabled:opacity-70"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-neutral-400">
          Select an announcement to edit
        </div>
      )}
    </div>
  );
}
