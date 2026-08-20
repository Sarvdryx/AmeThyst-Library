"use client";

import { useI18n } from '../../providers/I18nProvider';

interface SubTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = ['book_management', 'book_pickup', 'book_return', 'loan_fees'];

export default function SubTabBar({ activeTab, onTabChange }: SubTabBarProps) {
  const { t } = useI18n();

  return (
    <div className="border-b border-[#C4C6CD] dark:border-neutral-700 flex">
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`cursor-pointer inline-flex py-4 px-6 justify-center items-center text-xs font-hankenGrotesk leading-4 tracking-[0.05em] transition-colors ${
              isActive
                ? 'border-b-2 border-black dark:border-white text-[#43474D] dark:text-neutral-200 font-black'
                : 'text-[#43474D] dark:text-neutral-400 font-bold hover:text-black dark:hover:text-white'
            }`}
          >
            {t(`librarian.subtab_${tab}`)}
          </button>
        );
      })}
    </div>
  );
}
