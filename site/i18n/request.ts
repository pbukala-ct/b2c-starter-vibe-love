import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale } from './config';

// Map vibe-country cookie values to i18n locale
function countryToLocale(country: string | undefined): string {
  if (country === 'DE') return 'de';
  return 'en';
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const country = cookieStore.get('vibe-country')?.value;
  const locale = countryToLocale(country) || defaultLocale;

  let messages: Record<string, unknown>;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`../messages/${defaultLocale}.json`)).default;
  }

  return { locale, messages, timeZone: 'UTC' };
});
