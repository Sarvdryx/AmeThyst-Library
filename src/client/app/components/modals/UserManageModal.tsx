"use client";

import { useI18n } from "../../providers/I18nProvider";
import { UserRecord } from "../../types/admin";
import ModalShell from "./ModalShell";

interface UserManageModalProps {
  manageUser: UserRecord | null;
  newRole: "admin" | "librarian" | "user";
  newStatus: "active" | "suspended";
  suspendReason: string;
  mutationError: string | null;
  submitting: boolean;
  onRoleChange: (role: "admin" | "librarian" | "user") => void;
  onStatusChange: (status: "active" | "suspended") => void;
  onReasonChange: (reason: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function UserManageModal({
  manageUser,
  newRole,
  newStatus,
  suspendReason,
  mutationError,
  submitting,
  onRoleChange,
  onStatusChange,
  onReasonChange,
  onSubmit,
  onClose,
}: UserManageModalProps) {
  const { t } = useI18n();

  if (!manageUser) return null;

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 text-xs font-extrabold rounded-md text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
      >
        {t("admin.button_cancel")}
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-extrabold rounded-md flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {submitting && (
          <div className="w-3.5 h-3.5 border-2 border-white dark:border-neutral-900 border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {t("admin.button_confirm")}
      </button>
    </>
  );

  return (
    <form onSubmit={onSubmit}>
      <ModalShell
        title={t("admin.modal_manage_title")}
        onClose={onClose}
        closeLabel={t("admin.button_close")}
        footer={footer}
      >
        {/* Target Identity Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E7E2D8] flex items-center justify-center font-bold text-neutral-600">
            {manageUser.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-neutral-800 dark:text-neutral-100 truncate">
              {manageUser.username}
            </span>
            <span className="text-xs font-semibold text-neutral-400">
              {manageUser.email}
            </span>
          </div>
        </div>

        {mutationError && (
          <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-600 p-3.5 rounded text-xs font-semibold text-red-600">
            {mutationError}
          </div>
        )}

        {/* Role select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {t("admin.field_select_role")}
          </label>
          <select
            className="bg-[#F8F3E9] dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md py-2.5 px-4 text-xs font-bold text-neutral-800 dark:text-neutral-100 focus:outline-none"
            value={newRole}
            onChange={(e) => onRoleChange(e.target.value as any)}
          >
            <option value="admin">{t("admin.badge_admin")}</option>
            <option value="librarian">{t("admin.badge_librarian")}</option>
            <option value="user">{t("admin.badge_user")}</option>
          </select>
        </div>

        {/* Status select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {t("admin.field_select_status")}
          </label>
          <select
            className="bg-[#F8F3E9] dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md py-2.5 px-4 text-xs font-bold text-neutral-800 dark:text-neutral-100 focus:outline-none"
            value={newStatus}
            onChange={(e) => onStatusChange(e.target.value as any)}
          >
            <option value="active">{t("admin.status_active")}</option>
            <option value="suspended">{t("admin.status_suspended")}</option>
          </select>
        </div>

        {/* Suspension Reason (Conditional) */}
        {newStatus === "suspended" && (
          <div className="flex flex-col gap-1.5 animate-fade-in">
            <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t("admin.field_reason_label")}
            </label>
            <textarea
              className="bg-[#F8F3E9] dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md py-2.5 px-4 text-xs font-semibold text-neutral-800 dark:text-neutral-100 focus:outline-none h-20 resize-none"
              placeholder={t("admin.field_reason_placeholder")}
              value={suspendReason}
              onChange={(e) => onReasonChange(e.target.value)}
              required
            />
          </div>
        )}
      </ModalShell>
    </form>
  );
}
