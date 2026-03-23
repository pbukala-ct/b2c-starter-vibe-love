'use client';

import { useState } from 'react';
import { useLocale, useCountryConfig } from '@/context/LocaleContext';

export default function CountrySelector() {
  const { country, setCountry } = useLocale();
  const countryConfig = useCountryConfig();
  const [open, setOpen] = useState(false);

  const countries = Object.entries(countryConfig);
  const current = countryConfig[country];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-charcoal-light hover:text-charcoal transition-colors"
        aria-label="Select country"
      >
        <span className="text-base">{current?.flag}</span>
        <span className="hidden sm:block text-xs">{current?.name || country}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 bg-white border border-border shadow-lg rounded-sm z-50 min-w-40">
            {countries.map(([code, cfg]) => (
              <button
                key={code}
                onClick={() => { setCountry(code); setOpen(false); window.location.reload(); }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-cream text-left transition-colors ${code === country ? 'font-medium text-charcoal' : 'text-charcoal-light'}`}
              >
                <span className="text-base">{cfg.flag}</span>
                <span>{cfg.name}</span>
                <span className="ml-auto text-xs text-charcoal-light">{cfg.currency}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
