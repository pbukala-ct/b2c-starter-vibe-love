import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSessionToken, setSessionCookie } from '@/lib/session';
import { getCart, createCart } from '@/lib/ct/cart';
import { COUNTRY_CONFIG } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const session = await getSession();
  const country = req.cookies.get('vibe-country')?.value || 'US';
  const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG['US'];

  if (!session.cartId) {
    return NextResponse.json({ cart: null });
  }

  try {
    const cart = await getCart(session.cartId);
    return NextResponse.json({ cart });
  } catch {
    // Cart not found - clear it
    const newSession = { ...session, cartId: undefined };
    const token = await createSessionToken(newSession);
    const resp = NextResponse.json({ cart: null });
    setSessionCookie(resp, token);
    return resp;
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json();
  const country = req.cookies.get('vibe-country')?.value || body.country || 'US';
  const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG['US'];

  const cart = await createCart(config.currency, country, session.customerId);

  const newSession = { ...session, cartId: cart.id };
  const token = await createSessionToken(newSession);
  const resp = NextResponse.json({ cart });
  setSessionCookie(resp, token);
  return resp;
}
