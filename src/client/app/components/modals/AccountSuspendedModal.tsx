"use client";

import { useCallback, useEffect, useRef } from "react";
import { useI18n } from "../../providers/I18nProvider";

interface AccountSuspendedModalProps {
  onClose: () => void;
}

export default function AccountSuspendedModal({ onClose }: AccountSuspendedModalProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-suspended-message"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
        }}
        className="bg-white dark:bg-neutral-800 border-2 border-neutral-800 dark:border-neutral-700 rounded-lg max-w-lg w-full overflow-hidden shadow-2xl relative focus:outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-full text-neutral-500 dark:text-neutral-300 transition-colors cursor-pointer"
          aria-label={t("auth.account_suspended_close")}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="p-6 pr-14">
          <p
            id="account-suspended-message"
            className="text-sm text-neutral-800 dark:text-neutral-100"
          >
            {t("auth.account_suspended")}
          </p>
        </div>
      </div>
    </div>
  );
}
