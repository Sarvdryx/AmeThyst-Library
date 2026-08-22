"use client";

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../atoms/Button';
import searchBarBg from '../../assets/search_bar_bg.png';
import { useI18n } from '../../providers/I18nProvider';
import { InteractiveParticleField } from '../effects';

export default function HeroSection() {
  const { t } = useI18n();
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const helpNavigationLockedRef = useRef(false);
  const helpNavigationTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (helpNavigationTimerRef.current !== null) {
      window.clearTimeout(helpNavigationTimerRef.current);
    }
  }, []);

  const handleExploreLibrary = () => {
    const catalog = document.getElementById('library-catalog');
    if (!catalog) return;
    catalog.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    catalog.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const handleHowItWorks = () => {
    if (helpNavigationLockedRef.current) return;
    helpNavigationLockedRef.current = true;
    router.push('/help');
    helpNavigationTimerRef.current = window.setTimeout(() => {
      helpNavigationLockedRef.current = false;
      helpNavigationTimerRef.current = null;
    }, 1000);
  };

  return (
    <section 
      ref={sectionRef}
      className="w-full bg-navy py-20 px-4 relative overflow-hidden"
      style={{ 
        backgroundImage: `url(${searchBarBg.src || searchBarBg})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        backgroundRepeat: 'no-repeat' 
      }}
    >
      <InteractiveParticleField
        containerRef={sectionRef}
        className="pointer-events-none absolute inset-0 z-0 bg-transparent"
        particleCount={90}
        interactionRadius={160}
        maxPush={45}
      />

      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-teal/10 skew-x-[-12deg] translate-x-20" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-orange/5 rounded-full blur-3xl -translate-x-10 translate-y-20" />

      <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <h1 className="text-white font-manrope text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl">
          {t('hero.title')} <span className="text-orange">{t('hero.title_highlight')}</span> {t('hero.title_suffix')}
        </h1>
        <p className="text-[#A1A3A9] dark:text-neutral-400 font-open-sans text-lg md:text-xl max-w-2xl mb-10">
          {t('hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button type="button" variant="white" className="px-8 py-4 text-base text-black" onClick={handleExploreLibrary}>{t('hero.explore_library')}</Button>
          <Button type="button" variant="white" className="px-8 py-4 text-base text-black" onClick={handleHowItWorks}>{t('hero.how_it_works')}</Button>
        </div>
      </div>
    </section>
  );
}
