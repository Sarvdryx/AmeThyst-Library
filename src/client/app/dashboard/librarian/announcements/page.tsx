"use client";

import { useI18n } from '../../../providers/I18nProvider';
import { LibrarianAnnouncementsPanel } from '../../../components/organisms';

export default function LibrarianAnnouncementsPage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-manrope text-[40px] font-bold leading-[54.5px] text-black dark:text-neutral-100">
          {t('announcements.page_title')}
        </h1>
      </div>
      <LibrarianAnnouncementsPanel />
    </div>
  );
}
