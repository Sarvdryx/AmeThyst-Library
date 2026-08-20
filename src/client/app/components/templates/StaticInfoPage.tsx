'use client';
import React from 'react';
import Link from 'next/link';
import NavBar from '../organisms/NavBar';
import Footer from '../organisms/Footer';
import { useI18n } from '../../providers/I18nProvider';
import en from '../../locales/en.json';
import vi from '../../locales/vi.json';

type StaticPageKey = 'help' | 'privacy' | 'terms';

interface StaticSection {
  heading: string;
  body: string;
}

interface StaticPageData {
  title: string;
  subtitle: string;
  sections: StaticSection[];
}

export default function StaticInfoPage({ pageKey }: { pageKey: StaticPageKey }) {
  const { locale } = useI18n();
  const dict = (locale === 'en' ? en : vi) as typeof en & typeof vi;
  const data = dict.staticPages[pageKey] as StaticPageData;
  const { title, subtitle, sections } = data;

  return (
    <div className="min-h-screen bg-[#F8F3E9] dark:bg-neutral-950 flex flex-col transition-colors duration-300">
      <NavBar />
      <main className="flex-grow w-full max-w-3xl mx-auto px-6 py-12 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-teal-700 dark:text-teal-300 hover:text-teal-600 dark:hover:text-teal-200 transition-colors mb-8"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {dict.staticPages.back_to_home}
        </Link>

        <header className="mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-700 dark:bg-teal-600 text-white shadow-[0_10px_25px_-10px_rgba(0,111,102,0.6)] mb-5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h1 className="font-manrope text-3xl md:text-4xl font-extrabold tracking-tight text-[#091426] dark:text-neutral-100">
            {title}
          </h1>
          <p className="mt-3 text-[#75777D] dark:text-neutral-400 font-inter text-base leading-relaxed max-w-xl">
            {subtitle}
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#A6A49B] dark:text-neutral-500">
            {dict.staticPages.last_updated}
          </p>
        </header>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <section
              key={index}
              className="rounded-2xl border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 md:p-8 shadow-[0_16px_40px_-24px_rgba(26,46,68,0.18)]"
            >
              <h2 className="font-manrope text-lg font-bold text-[#091426] dark:text-neutral-100 mb-3">
                {section.heading}
              </h2>
              {section.body.split('\n').map((paragraph, pIndex) => (
                <p
                  key={pIndex}
                  className="text-sm md:text-[15px] leading-relaxed text-[#43474D] dark:text-neutral-300 mb-2 last:mb-0"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[#75777D] dark:text-neutral-400">
            {dict.staticPages.contact_prompt}{' '}
            <a
              href={`mailto:${dict.staticPages.contact_email}`}
              className="font-semibold text-teal-700 dark:text-teal-300 hover:underline"
            >
              {dict.staticPages.contact_email}
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}