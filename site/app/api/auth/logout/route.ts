import { NextResponse } from 'next/server';
import { getSession, createSessionToken, setSessionCookie } from '@/lib/session';

export async function POST() {
  const session = await getSession();

  // Clear customer data and cart from session
  const newSession = {
    country: session.country,
    currency: session.currency,
    locale: session.locale,
    // cartId cleared on logout per requirements
  };

  const token = await createSessionToken(newSession);
  const resp = NextResponse.json({ success: true });
  setSessionCookie(resp, token);
  return resp;
}
