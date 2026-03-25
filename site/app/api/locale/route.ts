import { NextResponse } from 'next/server';
import { getSession, createSessionToken, setSessionCookie } from '@/lib/session';
import { COUNTRY_CONFIG } from '@/lib/utils';

export async function PATCH(request: Request) {
  const { country } = await request.json();
  if (!country || !COUNTRY_CONFIG[country as string]) {
    return NextResponse.json({ error: 'Invalid country' }, { status: 400 });
  }
  const session = await getSession();
  const config = COUNTRY_CONFIG[country as string];
  const token = await createSessionToken({
    ...session,
    country,
    currency: config.currency,
    locale: config.locale,
  });
  const response = NextResponse.json({ ok: true });
  return setSessionCookie(response, token);
}
