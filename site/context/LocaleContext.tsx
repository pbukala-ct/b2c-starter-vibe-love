'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { COUNTRY_CONFIG, DEFAULT_LOCALE } from '@/lib/utils';

interface LocaleContextType {
  country: string;
  currency: string;
  locale: string;
  setCountry: (country: string) => void;
}

const LocaleContext = createContext<LocaleContextType>({
  country: DEFAULT_LOCALE.country,
  currency: DEFAULT_LOCALE.currency,
  locale: DEFAULT_LOCALE.locale,
  setCountry: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<string>(DEFAULT_LOCALE.country);

  useEffect(() => {
    const saved = document.cookie
      .split('; ')
      .find((r) => r.startsWith('vibe-country='))
      ?.split('=')[1];
    if (saved && COUNTRY_CONFIG[saved]) {
      setCountryState(saved);
    }
  }, []);

  const setCountry = (newCountry: string) => {
    setCountryState(newCountry);
    document.cookie = `vibe-country=${newCountry}; path=/; max-age=${30 * 24 * 3600}; samesite=lax`;
  };

  const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG[DEFAULT_LOCALE.country];

  return (
    <LocaleContext.Provider
      value={{ country, currency: config.currency, locale: config.locale, setCountry }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

/** Returns the full COUNTRY_CONFIG lookup table for use in client components. */
export function useCountryConfig() {
  return COUNTRY_CONFIG;
}
