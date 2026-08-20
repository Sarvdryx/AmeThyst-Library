"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from '../locales/en.json';
import vi from '../locales/vi.json';

type Locale = 'en' | 'vi';

interface I18nContextType {
  locale: Locale;
  // The translation function takes a key and optional parameters for interpolation
  t: (key: string, params?: Record<string, string | number>) => string;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const dictionaries = { en, vi };

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    if (savedLocale === 'en' || savedLocale === 'vi') {
      setLocale(savedLocale);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('locale', locale);
  }, [locale, mounted]);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => (prev === 'en' ? 'vi' : 'en'));
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    
    // Attempt lookup in current active dictionary
    let value: any = dictionaries[locale];
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    if (value !== undefined) {
      let result = String(value);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          result = result.replace(`{${k}}`, String(v));
        }
      }
      return result;
    }

    // Fallback: Attempt lookup in alternative dictionary
    const fallbackLocale = locale === 'en' ? 'vi' : 'en';
    let fallbackValue: any = dictionaries[fallbackLocale];
    for (const k of keys) {
      if (fallbackValue && typeof fallbackValue === 'object') {
        fallbackValue = fallbackValue[k];
      } else {
        fallbackValue = undefined;
        break;
      }
    }

    if (fallbackValue !== undefined) {
      let result = String(fallbackValue);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          result = result.replace(`{${k}}`, String(v));
        }
      }
      return result;
    }
    return key;
  }, [locale]);

  const contextValue = useMemo(() => ({ locale, t, toggleLocale }), [locale, t, toggleLocale]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
