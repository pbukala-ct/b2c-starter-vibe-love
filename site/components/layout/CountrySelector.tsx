'use client';

import { useState } from 'react';
import { useLocale, useCountryConfig } from '@/context/LocaleContext';
import { useTranslations } from 'next-intl';

export default function CountrySelector() {
  const { country, setCountry } = useLocale();
  const countryConfig = useCountryConfig();
  const [open, setOpen] = useState(false);
  const t = useTranslations('nav');

  const countries = Object.entries(countryConfig);
  const current = countryConfig[country];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-charcoal-light hover:text-charcoal flex items-center gap-1.5 text-sm transition-colors"
        aria-label={t('selectCountry')}
      >
        <span className="text-base">{current?.flag}</span>
        <span className="hidden text-xs sm:block">{current?.name || country}</span>
        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close country selector"
            tabIndex={-1}
          />
          <div className="border-border absolute top-full right-0 z-50 mt-2 min-w-40 rounded-sm border bg-cream shadow-lg">
            {countries.map(([code, cfg]) => (
              <button
                key={code}
                onClick={async () => {
                  await setCountry(code);
                  setOpen(false);
                }}
                className={`hover:bg-cream flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${code === country ? 'text-charcoal font-medium' : 'text-charcoal-light'}`}
              >
                <span className="text-base">{cfg.flag}</span>
                <span>{cfg.name}</span>
                <span className="text-charcoal-light ml-auto text-xs">{cfg.currency}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
