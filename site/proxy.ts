import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['en-us', 'en-gb', 'de-de'];
const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE || 'en-us';
const COUNTRY_TO_LOCALE: Record<string, string> = {
  US: 'en-us',
  GB: 'en-gb',
  DE: 'de-de',
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, api routes, Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Already has a locale prefix — let it through
  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return NextResponse.next();

  // Derive locale from vibe-country cookie, fall back to DEFAULT_LOCALE
  const country = request.cookies.get('vibe-country')?.value || 'US';
  const locale = COUNTRY_TO_LOCALE[country] || DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next|favicon|.*\\..*).*)', '/'],
};
