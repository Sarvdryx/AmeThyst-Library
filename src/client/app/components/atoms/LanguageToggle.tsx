"use client";
import React from 'react';
import { useI18n } from '../../providers/I18nProvider';

export function LanguageToggle() {
  const { locale, toggleLocale, t } = useI18n();

  return (
    <button
      onClick={toggleLocale}
      className="!text-[#FFF] px-3 py-1.5 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-800 text-foreground dark:text-neutral-200 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006F66] dark:focus-visible:outline-[#FFB95F] flex items-center gap-1.5 cursor-pointer font-inter text-xs font-bold leading-normal border border-transparent hover:border-neutral-200 dark:hover:border-neutral-200"
      aria-label={t('navbar.language_aria_label')}
      title={locale === 'en' ? t('navbar.language_tooltip_en') : t('navbar.language_tooltip_vi')}
    >
      {/* Globe Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 text-neutral-500 dark:text-neutral-400"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
      <span className="uppercase tracking-wider">
        {locale}
      </span>
    </button>
  );
}
