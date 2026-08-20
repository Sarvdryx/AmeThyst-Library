"use client";
import React from 'react';
import { useI18n } from '../../providers/I18nProvider';
import FooterLinkSection from '../atoms/FooterLinkSection';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="w-full bg-[#091426] dark:bg-neutral-950 text-white pt-16 pb-8 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="flex flex-col gap-6 col-span-1 md:col-span-1">
            <div className="flex items-center gap-2">
              <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex flex-col items-start w-fit">
                <path d="M4 21.3333V12H6.66667V21.3333H4ZM12 21.3333V12H14.6667V21.3333H12ZM0 26.6667V24H26.6667V26.6667H0ZM20 21.3333V12H22.6667V21.3333H20ZM0 9.33333V6.66667L13.3333 0L26.6667 6.66667V9.33333H0Z" fill="white" />
              </svg>
              <span className="text-[#FFF] font-inter text-2xl font-bold leading-8 w-fit tracking-[-0.025em]">LIMA</span>
            </div>
            <p className="text-[#A1A3A9] font-inter text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          <FooterLinkSection
            title={t('footer.section_library')}
            links={[
              { label: t('footer.all_books'), href: '/library' },
              { label: t('footer.library_map'), href: '/map' },
            ]}
          />

          <FooterLinkSection
            title={t('footer.section_community')}
            links={[
              { label: t('footer.study_groups'), href: '/study-together' },
            ]}
          />

          <FooterLinkSection
            title={t('footer.section_support')}
            links={[
              { label: t('footer.help_center'), href: '/help' },
              { label: t('footer.privacy_policy'), href: '/privacy' },
              { label: t('footer.terms_of_service'), href: '/terms' },
            ]}
          />
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#1C2638] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#75777D] font-inter text-xs">
            {t('footer.copyright')}
          </p>
          <div className="flex gap-6">
            <a href="https://github.com/DuyNhat1705/AmeThyst-Library" target="_blank" rel="noopener noreferrer" className="text-[#75777D] hover:text-white transition-colors text-xs font-semibold uppercase tracking-widest">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
