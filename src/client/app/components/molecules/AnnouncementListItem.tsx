export type AnnouncementStatus = 'ACTIVE' | 'DRAFT' | 'EXPIRED';

export interface Announcement {
  id: string;
  title: string;
  status: AnnouncementStatus;
  date: string;
  expiryDate: string;
  content: string;
}

interface AnnouncementListItemProps {
  announcement: Announcement;
  isSelected: boolean;
  onClick: () => void;
  getStatusBadgeStyles: (status: AnnouncementStatus) => string;
  getStatusTranslation: (status: AnnouncementStatus) => string;
}

export default function AnnouncementListItem({
  announcement,
  isSelected,
  onClick,
  getStatusBadgeStyles,
  getStatusTranslation,
}: AnnouncementListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-slate-900 dark:border-amber-500'
          : 'bg-white dark:bg-slate-800/50 border border-neutral-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
      } ${announcement.status === 'EXPIRED' ? 'opacity-60' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${getStatusBadgeStyles(announcement.status)}`}>
          {getStatusTranslation(announcement.status)}
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{announcement.date}</span>
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{announcement.title}</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">{announcement.content}</p>
    </div>
  );
}
