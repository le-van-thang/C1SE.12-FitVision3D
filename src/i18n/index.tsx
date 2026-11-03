import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import vi from './vi.json';
import en from './en.json';

export type Locale = 'vi' | 'en';

type TranslationDictionary = typeof vi;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (path: string, fallback?: string) => string;
}

const translations: Record<Locale, Record<string, any>> = {
  vi,
  en,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'fv3d_locale_preference';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // 1. Check local storage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'vi' || stored === 'en') {
        return stored;
      }
      // 2. Fallback to browser language
      const browserLang = navigator.language?.toLowerCase() || '';
      return browserLang.startsWith('vi') ? 'vi' : 'en';
    }
    return 'vi';
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    } catch (e) {
      // Storage unavailable fallback
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'vi' ? 'en' : 'vi');
  }, [locale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (path: string, fallback?: string): string => {
      const parts = path.split('.');
      let current: any = translations[locale];

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          // Fallback to English if missing in current locale
          let fallbackCurrent: any = translations['en'];
          for (const fbPart of parts) {
            if (fallbackCurrent && typeof fallbackCurrent === 'object' && fbPart in fallbackCurrent) {
              fallbackCurrent = fallbackCurrent[fbPart];
            } else {
              return fallback || path;
            }
          }
          return typeof fallbackCurrent === 'string' ? fallbackCurrent : fallback || path;
        }
      }

      return typeof current === 'string' ? current : fallback || path;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}
