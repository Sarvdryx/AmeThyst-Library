"use client";

import { useI18n } from "../../providers/I18nProvider";
import { UserRecord, UserDetails } from "../../types/admin";
import ModalShell from "./ModalShell";
import { formatShortDate } from "../../utils/dateFormat";

interface UserDetailsModalProps {
  user: UserRecord | null;
  detailedData: UserDetails | null;
  loading: boolean;
  onClose: () => void;
}

export default function UserDetailsModal({
  user,
  detailedData,
  loading,
  onClose,
}: UserDetailsModalProps) {
  const { t, locale } = useI18n();

  if (!user) return null;

  const formatJoinedDate = (dateStr: string) => formatShortDate(dateStr, locale);

  const footer = (
    <button
      onClick={onClose}
      className="px-4 py-2 border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-extrabold rounded-md transition-colors text-neutral-700 dark:text-neutral-300 cursor-pointer"
    >
      {t("admin.button_close")}
    </button>
  );

  return (
    <ModalShell
      title={t("admin.modal_details_title")}
      onClose={onClose}
      closeLabel={t("admin.button_close")}
      footer={footer}
    >
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
          <span className="text-xs text-neutral-400 font-semibold">
            {t("admin.modal_loading_details")}
          </span>
        </div>
      ) : (
        <>
          {/* Header identity card */}
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                className="w-14 h-14 rounded-full object-cover border border-neutral-300"
                alt={user.username}
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#E7E2D8] flex items-center justify-center font-bold text-lg text-neutral-600">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-extrabold text-neutral-800 dark:text-neutral-100 text-lg leading-snug">
                {user.username}
              </span>
              <span className="text-xs font-bold text-neutral-400">
                {t("admin.field_id")}: {user.userId}
              </span>
            </div>
          </div>

          {/* Attributes metadata grid */}
          <div className="grid grid-cols-2 gap-4 border-t border-neutral-200 dark:border-neutral-700 pt-4 font-manrope text-xs text-neutral-700 dark:text-neutral-300">
            <div>
              <p className="font-black text-neutral-400 uppercase tracking-wider mb-1">
                {t("admin.field_email")}
              </p>
              <p className="font-bold truncate">{user.email}</p>
            </div>
            <div>
              <p className="font-black text-neutral-400 uppercase tracking-wider mb-1">
                {t("admin.field_phone")}
              </p>
              <p className="font-bold">{user.phoneNumber || "-"}</p>
            </div>
            <div>
              <p className="font-black text-neutral-400 uppercase tracking-wider mb-1">
                {t("admin.field_role")}
              </p>
              <p className="font-bold capitalize">{user.role}</p>
            </div>
            <div>
              <p className="font-black text-neutral-400 uppercase tracking-wider mb-1">
                {t("admin.field_status")}
              </p>
              <p className="font-bold capitalize">{user.status}</p>
            </div>
            <div>
              <p className="font-black text-neutral-400 uppercase tracking-wider mb-1">
                {t("admin.field_joined_date")}
              </p>
              <p className="font-bold">{formatJoinedDate(user.joinedDate)}</p>
            </div>
            <div>
              <p className="font-black text-neutral-400 uppercase tracking-wider mb-1">
                {t("admin.field_last_login")}
              </p>
              <p className="font-bold">
                {user.lastLogin ? formatJoinedDate(user.lastLogin) : "-"}
              </p>
            </div>
          </div>

          {/* Suspension reason info */}
          {detailedData?.status === "suspended" && (
            <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-[#BA1A1A] p-4 rounded-md mt-2">
              <p className="text-xs font-black text-[#BA1A1A] uppercase tracking-wider mb-1">
                {t("admin.field_reason_label")}
              </p>
              <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 leading-relaxed italic">
                "
                {detailedData.suspendedReason ||
                  t("admin.text_no_reason_provided")}
                "
              </p>
            </div>
          )}
        </>
      )}
    </ModalShell>
  );
}
