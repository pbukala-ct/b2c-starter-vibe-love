'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { COUNTRY_CONFIG, DEFAULT_LOCALE, toUrlLocale } from '@/lib/utils';

interface LocaleContextType {
  country: string;
  currency: string;
  locale: string;
  urlLocale: string;
  localePath: (path: string) => string;
  setCountry: (country: string) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextType>({
  country: DEFAULT_LOCALE.country,
  currency: DEFAULT_LOCALE.currency,
  locale: DEFAULT_LOCALE.locale,
  urlLocale: toUrlLocale(DEFAULT_LOCALE.country),
  localePath: (path) => `/${toUrlLocale(DEFAULT_LOCALE.country)}${path}`,
  setCountry: async () => {},
});

export function LocaleProvider({
  children,
  initialCountry,
}: {
  children: ReactNode;
  initialCountry?: string;
}) {
  const [country, setCountryState] = useState<string>(
    initialCountry && COUNTRY_CONFIG[initialCountry] ? initialCountry : DEFAULT_LOCALE.country
  );

  const setCountry = async (newCountry: string) => {
    if (!COUNTRY_CONFIG[newCountry]) return;
    setCountryState(newCountry);
    document.cookie = `vibe-country=${newCountry}; path=/; max-age=${30 * 24 * 3600}; samesite=lax`;
    await fetch('/api/locale', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: newCountry }),
    });
    const newUrlLocale = toUrlLocale(newCountry);
    const currentPath = window.location.pathname;
    // Strip existing locale prefix and navigate to new one
    const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}-[a-z]{2}(\/|$)/, '/');
    window.location.href = `/${newUrlLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
  };

  const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG[DEFAULT_LOCALE.country];
  const urlLocale = toUrlLocale(country);
  const localePath = (path: string) => `/${urlLocale}${path.startsWith('/') ? path : `/${path}`}`;

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

/** Returns the full COUNTRY_CONFIG lookup table for use in client components. */
export function useCountryConfig() {
  return COUNTRY_CONFIG;
}
