"use client";

import Skeleton from '../atoms/Skeleton';
import {
  isAnnouncementItem,
  isInvitationItem,
  isSystemItem,
  type NotificationItem,
} from '../../hooks/useAnnouncementBell';
import { NotificationEventIcon } from '../organisms/NotificationEventVisuals';

interface NotificationDropdownPanelProps {
  notifications: NotificationItem[];
  loading: boolean;
  t: (key: string) => string;
  onClickItem: (item: NotificationItem) => void;
  formatDate: (value: string) => string;
}

export default function NotificationDropdownPanel({
  notifications,
  loading,
  t,
  onClickItem,
  formatDate,
}: NotificationDropdownPanelProps) {
  return (
    <div className="absolute right-0 mt-3 w-80 max-h-[420px] overflow-y-auto z-50 bg-[#FFFDF9] dark:bg-neutral-900 border border-[#DDD5CC] dark:border-neutral-700 rounded-xl shadow-[0_24px_70px_rgba(7,17,31,.24)] p-4 text-[#0B1C30] dark:text-white text-left font-inter custom-scrollbar animate-fade-in">
      <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#E8E1D9] dark:border-neutral-700">
        <span className="font-bold text-xs font-manrope text-[#0B1C30] dark:text-white uppercase tracking-wider">
          {t('profile.notifications_title')}
        </span>
        {notifications.length > 0 && (
          <span className="text-[10px] bg-[#D56A4A] text-white font-bold px-2 py-0.5 rounded-full">
            {notifications.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4 py-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-8 text-center text-neutral-400 text-sm flex flex-col items-center justify-center">
          <svg className="w-8 h-8 mb-2 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.02 6.02 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <p>{t('profile.no_notifications')}</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 pr-1 flex flex-col gap-2">
          {notifications.map((item) => {
            const isAnnouncement = isAnnouncementItem(item);
            const isInvitation = isInvitationItem(item);
            const systemNotification = isSystemItem(item) ? item.metadata : null;
            const bgClass = item.isRead
              ? 'bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50 opacity-60'
              : 'bg-neutral-50/50 dark:bg-neutral-800/20 hover:bg-neutral-50 dark:hover:bg-neutral-800/40';

            return (
              <button
                key={`${item.category}:${item.id}`}
                onClick={() => onClickItem(item)}
                className={`flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-[background-color,opacity,transform] hover:-translate-y-px ${bgClass}`}
              >
                {isAnnouncement ? (
                  <div className="mt-1 h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300">
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.083.87l-.497.828.497.828a.75.75 0 11-1.083.87l-.042-.02a.75.75 0 01-.334-.638V12a.75.75 0 01.334-.638zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                ) : isInvitation ? (
                  <NotificationEventIcon type="invitation" />
                ) : systemNotification ? (
                  <NotificationEventIcon type={systemNotification.type} />
                ) : (
                  <NotificationEventIcon type="invitation" />
                )}

                <span className="min-w-0 flex-1">
                  <span className="mb-0.5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#D56A4A]">
                    {!item.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />}
                    {isAnnouncement
                      ? t('navbar.announcements_title')
                      : isInvitation
                      ? t('study_group.invitation')
                      : systemNotification
                        ? t(`study_group.notification_${systemNotification.type}`)
                        : ''}
                  </span>
                  <strong className="block truncate text-sm font-bold text-[#0B1C30] dark:text-white">
                    {item.title}
                  </strong>
                  <span className="block truncate text-xs text-[#686C71] dark:text-neutral-400">
                    {isInvitation
                      ? t('study_group.invited_by').replace('{name}', item.metadata.group.host.username)
                      : isAnnouncement
                        ? item.description
                        : systemNotification
                          ? t(`study_group.notification_${systemNotification.type}_summary`).replace(
                          '{name}',
                          systemNotification.memberName || t('study_group.members'),
                        )
                          : item.description}
                  </span>
                  <span className="block text-[9px] text-[#8E9399] mt-1">
                    {formatDate(item.createdAt)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
