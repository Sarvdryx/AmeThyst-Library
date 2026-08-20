"use client";

import { useI18n } from '../../providers/I18nProvider';
import type { HistoryEntry } from '../../utils/authorizationApi';

interface HistoryLogRowProps {
  entry: HistoryEntry;
  highlighted?: boolean;
}

const actionStyles: Record<string, string> = {
  PROMOTE: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  DEMOTE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  ADMIN_INVITE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
};

const Avatar = ({ username, avatar }: { username: string; avatar: string | null }) => (
  <div className="shrink-0">
    {avatar ? (
      <img src={avatar} alt={username} className="w-8 h-8 rounded-full object-cover border border-[#E8E2D5] dark:border-neutral-600" />
    ) : (
      <div className="w-8 h-8 rounded-full bg-[#486C7E] dark:bg-[#2C4A58] text-white flex items-center justify-center text-xs font-bold">
        {(username || '?').trim().charAt(0).toUpperCase()}
      </div>
    )}
  </div>
);

export default function HistoryLogRow({ entry, highlighted = false }: HistoryLogRowProps) {
  const { t, locale } = useI18n();

  const date = new Date(entry.timestamp);
  const dateLabel = !isNaN(date.getTime())
    ? date.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Ho_Chi_Minh',
      })
    : '';

  return (
    <div
      role="row"
      className={`flex px-6 py-4 items-center w-full border-t border-[#E8E2D5] dark:border-neutral-700 transition-colors ${
        highlighted ? 'bg-teal-50/70 dark:bg-teal-900/20' : ''
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Avatar username={entry.actor.username} avatar={entry.actor.avatar} />
        <span className="text-[#1D1C16] dark:text-neutral-200 font-manrope text-sm font-bold truncate">
          {entry.actor.username}
        </span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 ml-2 text-neutral-400">
          <path d="M4.6 8L0 3.4 1.4 2l5.4 5.4L1.4 12.8 0 11.4 4.6 8zm6.4 0L6.4 3.4 7.8 2l5.4 5.4L7.8 12.8 6.4 11.4 11 8z" fill="currentColor" />
        </svg>
      </div>

      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Avatar username={entry.target.username} avatar={entry.target.avatar} />
        <span className="text-[#1D1C16] dark:text-neutral-200 font-manrope text-sm truncate">
          {entry.target.username}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0 w-[240px]">
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#F3EFE7] dark:bg-neutral-700 text-[#1D1C16] dark:text-neutral-200 truncate">
          {entry.change}
        </span>
        <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-semibold ${actionStyles[entry.action] || 'bg-gray-100 text-gray-800'}`}>
          {t(`admin.authorization.action_${entry.action.toLowerCase()}`)}
        </span>
        {highlighted && (
          <span className="shrink-0 px-2 py-1 rounded-full text-xs font-bold bg-[#006A61] dark:bg-[#FFB95F] text-white dark:text-[#091426]">
            {t('admin.authorization.history_new')}
          </span>
        )}
      </div>

      <div className="shrink-0 w-36 text-right">
        <p className="text-[#686C71] dark:text-neutral-400 text-xs">{dateLabel}</p>
      </div>
    </div>
  );
}
