export const COUNTRY_CONFIG: Record<string, { currency: string; locale: string; name: string; flag: string }> = {
  US: { currency: 'USD', locale: 'en-US', name: 'United States', flag: '🇺🇸' },
  GB: { currency: 'GBP', locale: 'en-GB', name: 'United Kingdom', flag: '🇬🇧' },
  DE: { currency: 'EUR', locale: 'de-DE', name: 'Germany', flag: '🇩🇪' },
};

export function formatMoney(centAmount: number, currency: string): string {
  const amount = centAmount / 100;
  return new Intl.NumberFormat(
    currency === 'USD' ? 'en-US' : currency === 'GBP' ? 'en-GB' : 'de-DE',
    { style: 'currency', currency }
  ).format(amount);
}

export function getLocalizedString(
  obj: Record<string, string> | undefined,
  locale: string
): string {
  if (!obj) return '';
  return obj[locale] || obj['en-US'] || obj['en-GB'] || Object.values(obj)[0] || '';
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Country to currency mapping (for all euro zone countries etc.)
export function getCurrencyForCountry(country: string): string {
  const eurCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'FI', 'IE', 'LU', 'SK', 'SI', 'EE', 'LV', 'LT', 'CY', 'MT'];
  if (eurCountries.includes(country)) return 'EUR';
  if (country === 'GB') return 'GBP';
  return 'USD';
}
