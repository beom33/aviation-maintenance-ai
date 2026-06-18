'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { translations, defaultLocale } from '@/lib/i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(defaultLocale);

  useEffect(() => {
    const saved = localStorage.getItem('locale');
    if (saved === 'en' || saved === 'ko') setLocale(saved);
  }, []);

  const toggle = () => {
    const next = locale === 'ko' ? 'en' : 'ko';
    setLocale(next);
    localStorage.setItem('locale', next);
  };

  const t = translations[locale];

  return (
    <LanguageContext.Provider value={{ locale, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
