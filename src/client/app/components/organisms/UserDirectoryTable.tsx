"use client";

import { useI18n } from '../../providers/I18nProvider';
import { UserRecord } from '../../types/admin';
import UserTableRow from '../molecules/UserTableRow';

interface UserDirectoryTableProps {
  users: UserRecord[];
  loading: boolean;
  error: string | null;
  currentUserId?: string;
  onViewDetails: (u: UserRecord) => void;
  onManage: (u: UserRecord) => void;
}

export default function UserDirectoryTable({
  users,
  loading,
  error,
  currentUserId,
  onViewDetails,
  onManage,
}: UserDirectoryTableProps) {
  const { t } = useI18n();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-[#F8F3E9] dark:bg-neutral-700 border-b border-neutral-300 dark:border-neutral-600 text-xs font-black text-neutral-500 dark:text-neutral-300 tracking-wider">
            <th className="py-4 px-6 w-1/4">{t('admin.table_header_user')}</th>
            <th className="py-4 px-6 w-1/4">{t('admin.table_header_contact')}</th>
            <th className="py-4 px-6 w-1/6">{t('admin.table_header_role')}</th>
            <th className="py-4 px-6 w-1/6">{t('admin.table_header_status')}</th>
            <th className="py-4 px-6 w-1/5">{t('admin.table_header_access')}</th>
            <th className="py-4 px-6 w-24 text-center"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700 font-manrope text-sm text-neutral-800 dark:text-neutral-100">
          
          {loading ? (
            // Skeletons loading state
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-5 px-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <div className="w-28 h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
                    <div className="w-16 h-3 bg-neutral-200 dark:bg-neutral-700 rounded" />
                  </div>
                </td>
                <td className="py-5 px-6">
                  <div className="w-40 h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-1" />
                  <div className="w-28 h-3 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </td>
                <td className="py-5 px-6">
                  <div className="w-16 h-5 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
                </td>
                <td className="py-5 px-6">
                  <div className="w-14 h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </td>
                <td className="py-5 px-6">
                  <div className="w-24 h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-1" />
                  <div className="w-20 h-3 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </td>
                <td className="py-5 px-6"></td>
              </tr>
            ))
          ) : error ? (
            // Fetch query error feedback
            <tr>
              <td colSpan={6} className="py-12 text-center text-red-600 font-semibold">
                {error}
              </td>
            </tr>
          ) : users.length === 0 ? (
            // Empty state matching criteria
            <tr>
              <td colSpan={6} className="py-16 text-center text-neutral-400 dark:text-neutral-500 font-semibold text-sm">
                {t('admin.table_no_results')}
              </td>
            </tr>
          ) : (
            // Populated user rows
            users.map((u) => (
              <UserTableRow
                key={u.userId}
                user={u}
                currentUserId={currentUserId}
                onViewDetails={onViewDetails}
                onManage={onManage}
              />
            ))
          )}

        </tbody>
      </table>
    </div>
  );
}
