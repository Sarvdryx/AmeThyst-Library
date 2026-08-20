"use client";
import React from 'react';
import Link from 'next/link';
import NavBar from './components/organisms/NavBar';
import { useI18n } from './providers/I18nProvider';
import { SpotlightRevealHero } from './components/effects';

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#0a0704] text-foreground flex flex-col overflow-x-hidden">
      <NavBar />
      
      <SpotlightRevealHero>
        <div className="flex-grow flex flex-col items-center justify-center text-center max-w-4xl mx-auto py-16 px-6 relative z-50">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] font-manrope">
            {t('landing.title')}
          </h1>
          <p className="text-lg md:text-xl text-neutral-200 opacity-95 mb-12 max-w-xl font-open-sans drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] leading-relaxed">
            {t('landing.subtitle')}
          </p>
          
          <div className="flex flex-col gap-6 w-full max-w-sm pointer-events-auto">
            <Link 
              href="/library" 
              className="w-full px-8 py-4 bg-[#FFB95F] text-neutral-950 rounded-2xl font-bold text-lg hover:opacity-90 hover:scale-[1.02] hover:shadow-[0_6px_25px_rgba(255,185,95,0.5)] transition-all shadow-[0_4px_20px_rgba(255,185,95,0.35)] flex items-center justify-center cursor-pointer"
            >
              {t('landing.explore')}
            </Link>
            
            <div className="flex gap-4">
              <Link 
                href="/login" 
                className="flex-1 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center justify-center cursor-pointer"
              >
                {t('navbar.sign_in')}
              </Link>
              <Link 
                href="/register" 
                className="flex-1 px-6 py-3 bg-[#486C7E]/80 backdrop-blur-md border border-transparent text-white rounded-xl font-semibold hover:bg-[#3e5e6e]/95 transition-all flex items-center justify-center cursor-pointer"
              >
                {t('navbar.join_now')}
              </Link>
            </div>
          </div>
        </div>
      </SpotlightRevealHero>
    </div>
  );
}
