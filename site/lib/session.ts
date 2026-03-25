import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COUNTRY_CONFIG, DEFAULT_LOCALE } from '@/lib/utils';

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'vibe-home-fallback-secret-key-2024'
);
const COOKIE_NAME = 'vibe-session';

export interface Session {
  customerId?: string;
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  cartId?: string;
  country?: string;
  currency?: string;
  locale?: string;
  subscriptions?: Record<string, string>; // productId → recurrencePolicyId
}

export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return {};
  try {
    const { payload } = await jwtVerify(token, SECRET);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { iat, exp, ...session } = payload as Session & { iat?: number; exp?: number };
    return session;
  } catch {
    return {};
  }
}

const DEFAULT_COUNTRY = DEFAULT_LOCALE.country;

export async function getLocale(): Promise<{ country: string; currency: string; locale: string }> {
  const session = await getSession();
  if (session.country && session.currency && session.locale) {
    return { country: session.country, currency: session.currency, locale: session.locale };
  }
  const cookieStore = await cookies();
  const country = cookieStore.get('vibe-country')?.value || DEFAULT_COUNTRY;
  const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG[DEFAULT_COUNTRY];
  return { country, currency: config.currency, locale: config.locale };
}

export async function createSessionToken(data: Session): Promise<string> {
  return new SignJWT(data as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET);
}

export function setSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
