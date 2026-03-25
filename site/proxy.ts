import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE } from '@/lib/utils';

const COUNTRY_TO_LOCALE: Record<string, string> = {
  US: 'en-us',
  GB: 'en-gb',
  DE: 'de-de',
};
const LOCALES = Object.values(COUNTRY_TO_LOCALE);
const DEFAULT_URL_LOCALE = COUNTRY_TO_LOCALE[DEFAULT_LOCALE.country];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, api routes, Next.js internals, and agent portal
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/agent') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Already has a locale prefix — pass through with x-next-intl-locale header
  const matchedLocale = LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (matchedLocale) {
    const response = NextResponse.next();
    response.headers.set('x-next-intl-locale', matchedLocale);
    return response;
  }

  // Derive locale from vibe-country cookie, fall back to DEFAULT_LOCALE
  const country = request.cookies.get('vibe-country')?.value || 'US';
  const locale = COUNTRY_TO_LOCALE[country] || DEFAULT_URL_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next|favicon|.*\\..*).*)', '/'],
};
