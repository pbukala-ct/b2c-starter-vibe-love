'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { COUNTRY_CONFIG } from '@/lib/utils';

const COUNTRY_TO_URL_LOCALE: Record<string, string> = {
  US: 'en-us',
  GB: 'en-gb',
  DE: 'de-de',
};

interface LocaleContextType {
  country: string;
  currency: string;
  locale: string;
  urlLocale: string;
  localePath: (path: string) => string;
  setCountry: (country: string) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextType>({
  country: 'US',
  currency: 'USD',
  locale: 'en-US',
  urlLocale: 'en-us',
  localePath: (path) => `/en-us${path}`,
  setCountry: async () => {},
});

export function LocaleProvider({
  children,
  initialCountry,
}: {
  children: ReactNode;
  initialCountry?: string;
}) {
  const [country, setCountryState] = useState(initialCountry || 'US');

  useEffect(() => {
    if (initialCountry) return;
    const saved = document.cookie
      .split('; ')
      .find((r) => r.startsWith('vibe-country='))
      ?.split('=')[1];
    if (saved && COUNTRY_CONFIG[saved]) {
      setCountryState(saved);
    }
  }, [initialCountry]);

  const setCountry = async (newCountry: string) => {
    if (!COUNTRY_CONFIG[newCountry]) return;
    setCountryState(newCountry);
    document.cookie = `vibe-country=${newCountry}; path=/; max-age=${30 * 24 * 3600}; samesite=lax`;
    await fetch('/api/locale', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: newCountry }),
    });
    const newUrlLocale = COUNTRY_TO_URL_LOCALE[newCountry] || 'en-us';
    const currentPath = window.location.pathname;
    // Strip existing locale prefix and navigate to new one
    const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}-[a-z]{2}(\/|$)/, '/');
    window.location.href = `/${newUrlLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
  };

  const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG['US'];
  const urlLocale = COUNTRY_TO_URL_LOCALE[country] || 'en-us';
  const localePath = (path: string) =>
    `/${urlLocale}${path.startsWith('/') ? path : `/${path}`}`;

  return (
    <LocaleContext.Provider
      value={{
        country,
        currency: config.currency,
        locale: config.locale,
        urlLocale,
        localePath,
        setCountry,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
