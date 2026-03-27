export const DEFAULT_LOCALE = {
  country: 'US',
  currency: 'USD',
  locale: 'en-US',
} as const;

export const COUNTRY_CONFIG: Record<
  string,
  { currency: string; locale: string; name: string; flag: string }
> = {
  US: { currency: 'USD', locale: 'en-US', name: 'United States', flag: '🇺🇸' },
  GB: { currency: 'GBP', locale: 'en-GB', name: 'United Kingdom', flag: '🇬🇧' },
  DE: { currency: 'EUR', locale: 'de-DE', name: 'Germany', flag: '🇩🇪' },
};

const CURRENCY_LOCALE: Record<string, string> = Object.fromEntries(
  Object.values(COUNTRY_CONFIG).map((c) => [c.currency, c.locale])
);

export function formatMoney(centAmount: number, currency: string): string {
  const amount = centAmount / 100;
  const locale = CURRENCY_LOCALE[currency] ?? DEFAULT_LOCALE.locale;
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function getLocalizedString(
  obj: Record<string, string> | undefined,
  locale?: string
): string {
  if (!obj) return '';
  return (
    obj[locale ?? DEFAULT_LOCALE.locale] ||
    obj[DEFAULT_LOCALE.locale] ||
    Object.values(obj)[0] ||
    ''
  );
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ---------- Address helpers ----------

/**
 * Returns true for countries that use a single "Street Address" field (US convention).
 * European countries keep separate "Street Name" and "Street Number" inputs.
 */
export function isCombinedStreetField(country: string): boolean {
  return country === 'US';
}

/**
 * Combine separate CT streetNumber + streetName into a single display string.
 * Works for all locales (US shows "123 Main St", EU shows "123 Main St" too).
 */
export function formatStreetAddress(
  streetNumber?: string,
  streetName?: string,
  country?: string
): string {
  const num = streetNumber?.trim() || '';
  const name = streetName?.trim() || '';
  if (num && name) {
    // European format: street name first, then number (e.g. "Lagedeich 1")
    return isCombinedStreetField(country || 'US') ? `${num} ${name}` : `${name} ${num}`;
  }
  return name || num;
}

/**
 * Parse a combined US-style street address into CT's separate streetNumber + streetName.
 * Extracts a leading number/letter token (e.g. "123", "12A", "4500") as streetNumber.
 * If there's no leading number, streetNumber is empty and the whole string becomes streetName.
 */
export function parseStreetAddress(streetAddress: string): {
  streetNumber: string;
  streetName: string;
} {
  const trimmed = streetAddress.trim();
  const match = trimmed.match(/^(\d+[A-Za-z]?)\s+(.+)$/);
  if (match) {
    return { streetNumber: match[1], streetName: match[2] };
  }
  // No leading number — entire string is the street name
  return { streetNumber: '', streetName: trimmed };
}

/**
 * Convert a form address (with optional combined streetAddress) to the CT API shape.
 * Parses the combined street field for US addresses; uses separate fields otherwise.
 */
export function toCtAddress(addr: {
  firstName: string;
  lastName: string;
  streetName: string;
  streetNumber?: string;
  streetAddress?: string;
  additionalAddressInfo?: string;
  city: string;
  postalCode: string;
  state?: string;
  country: string;
  phone?: string;
}) {
  const street =
    isCombinedStreetField(addr.country) && addr.streetAddress
      ? parseStreetAddress(addr.streetAddress)
      : { streetName: addr.streetName, streetNumber: addr.streetNumber || '' };
  return {
    firstName: addr.firstName,
    lastName: addr.lastName,
    streetName: street.streetName,
    streetNumber: street.streetNumber || undefined,
    additionalAddressInfo: addr.additionalAddressInfo || undefined,
    city: addr.city,
    postalCode: addr.postalCode,
    state: addr.state || undefined,
    country: addr.country,
    phone: addr.phone || undefined,
  };
}

export function toUrlLocale(country: string): string {
  return (COUNTRY_CONFIG[country]?.locale ?? DEFAULT_LOCALE.locale).toLowerCase();
}
