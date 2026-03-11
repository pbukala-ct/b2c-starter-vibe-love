'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { COUNTRY_CONFIG } from '@/lib/utils';

interface LocaleContextType {
  country: string;
  currency: string;
  locale: string;
  setCountry: (country: string) => void;
}

const LocaleContext = createContext<LocaleContextType>({
  country: 'US',
  currency: 'USD',
  locale: 'en-US',
  setCountry: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState('US');

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

  const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG['US'];

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
