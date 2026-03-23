import { getRequestConfig } from 'next-intl/server';
import { getLocale } from '@/lib/locale';
import { COUNTRY_CONFIG } from '@/lib/utils';

export default getRequestConfig(async () => {
  const { locale: fullLocale } = await getLocale();
  // Derive the short locale key used for message files ('en' or 'de')
  const lang = fullLocale.split('-')[0];
  const availableLangs = Object.values(COUNTRY_CONFIG)
    .map((c) => c.locale.split('-')[0]);
  const messageLocale = availableLangs.includes(lang) ? lang : 'en';

  let messages: Record<string, unknown>;
  try {
    messages = (await import(`../messages/${messageLocale}.json`)).default;
  } catch {
    messages = (await import('../messages/en.json')).default;
  }

  return { locale: fullLocale, messages, timeZone: 'UTC' };
});
