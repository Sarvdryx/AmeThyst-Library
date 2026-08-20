"use client";

import { useI18n } from '../../providers/I18nProvider';
import { UserRecord } from '../../types/admin';
import { formatShortDate, formatRelativeLastLogin } from '../../utils/dateFormat';

interface UserTableRowProps {
  user: UserRecord;
  currentUserId?: string;
  onViewDetails: (u: UserRecord) => void;
  onManage: (u: UserRecord) => void;
}

export default function UserTableRow({
  user,
  currentUserId,
  onViewDetails,
  onManage,
}: UserTableRowProps) {
  const { t, locale } = useI18n();

  const isSuspended = user.status === 'suspended';
  const rowOpacity = isSuspended ? 'opacity-60' : 'opacity-100';

  const formatJoinedDate = (dateStr: string) => formatShortDate(dateStr, locale);

  const formatLastLogin = (dateStr: string | null) => formatRelativeLastLogin(dateStr, locale);

  return (
    <tr className={`hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors ${rowOpacity}`}>
      {/* Identity Details */}
      <td className="py-4 px-6 flex items-center gap-3">
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className={`w-10 h-10 rounded-full object-cover border border-neutral-300 dark:border-neutral-600 ${isSuspended ? 'opacity-50' : 'opacity-100'}`}
            />
          ) : (
            <div className={`w-10 h-10 rounded-full bg-[#E7E2D8] dark:bg-neutral-700 flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-300 ${isSuspended ? 'opacity-50' : 'opacity-100'}`}>
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-neutral-800 dark:text-neutral-100 truncate">
            {user.username}
          </span>
          <span className="text-xs font-semibold text-neutral-400 tracking-wider">
            UID: {user.userId.slice(0, 6).toUpperCase()}
          </span>
        </div>
      </td>

      {/* Contact metadata */}
      <td className="py-4 px-6 min-w-0">
        <div className="flex flex-col min-w-0">
          <span className="text-neutral-800 dark:text-neutral-100 truncate font-semibold">
            {user.email}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {user.phoneNumber || '-'}
          </span>
        </div>
      </td>

      {/* Role Badges */}
      <td className="py-4 px-6">
        {user.role === 'admin' && (
          <span className="inline-block px-3 py-1 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-black rounded-full uppercase tracking-wider scale-95 origin-left">
            {t('admin.badge_admin')}
          </span>
        )}
        {user.role === 'librarian' && (
          <span className="inline-block px-3 py-1 bg-[rgba(215,182,254,0.25)] text-[#6E5191] dark:bg-purple-950/40 dark:text-[#a78bfa] text-xs font-black rounded-full uppercase tracking-wider scale-95 origin-left">
            {t('admin.badge_librarian')}
          </span>
        )}
        {user.role === 'user' && (
          <span className="inline-block px-3 py-1 bg-[#E7E2D8] text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 text-xs font-black rounded-full uppercase tracking-wider scale-95 origin-left">
            {t('admin.badge_user')}
          </span>
        )}
      </td>

      {/* Status lights */}
      <td className="py-4 px-6">
        {user.status === 'active' ? (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-teal-400 dark:bg-teal-500 rounded-full shrink-0" />
            <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-100 uppercase tracking-wider">
              {t('admin.status_active')}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#BA1A1A] rounded-full shrink-0" />
            <span className="text-xs font-extrabold text-[#BA1A1A] uppercase tracking-wider">
              {t('admin.status_suspended')}
            </span>
          </div>
        )}
      </td>

      {/* Access timeline timeline */}
      <td className="py-4 px-6 whitespace-nowrap">
        <div className="flex flex-col text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-semibold">{t('admin.joined_date').replace('{date}', formatJoinedDate(user.joinedDate))}</span>
          <span>{t('admin.last_login').replace('{time}', formatLastLogin(user.lastLogin))}</span>
        </div>
      </td>

      {/* Actions */}
      <td className="py-4 px-6 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onViewDetails(user)}
            className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-neutral-600 dark:text-neutral-300 transition-colors"
            title={t('admin.tooltip_view_details')}
            aria-label={t('admin.tooltip_view_details')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          
          {user.userId !== currentUserId && (
            <button
              onClick={() => onManage(user)}
              className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-neutral-600 dark:text-neutral-300 transition-colors"
              title={t('admin.tooltip_manage_user')}
              aria-label={t('admin.tooltip_manage_user')}
            >
              <svg className="w-5 h-5 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
