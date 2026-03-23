import { cookies } from 'next/headers';
import { COUNTRY_CONFIG, DEFAULT_LOCALE } from './utils';

export { DEFAULT_LOCALE };

export async function getLocale() {
  const cookieStore = await cookies();
  const country = cookieStore.get('vibe-country')?.value || DEFAULT_LOCALE.country;
  const { currency, locale } = COUNTRY_CONFIG[country] || DEFAULT_LOCALE;
  return { country, currency, locale };
}
