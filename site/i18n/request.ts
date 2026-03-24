import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale) {
    const headersList = await headers();
    locale = headersList.get('x-next-intl-locale') ?? 'en-us';
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
