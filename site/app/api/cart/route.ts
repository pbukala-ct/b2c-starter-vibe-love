import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSessionToken, setSessionCookie } from '@/lib/session';
import { getCart, createCart } from '@/lib/ct/cart';
import { getLocale } from '@/lib/locale';

export async function GET() {
  const session = await getSession();

  if (!session.cartId) {
    return NextResponse.json({ cart: null });
  }

  try {
    const cart = await getCart(session.cartId);
    // Discard non-Active carts (e.g. Ordered, Merged) so the client sees an
    // empty cart rather than an unmodifiable one with stale items.
    if (cart.cartState && cart.cartState !== 'Active') {
      const newSession = { ...session, cartId: undefined };
      const token = await createSessionToken(newSession);
      const resp = NextResponse.json({ cart: null });
      setSessionCookie(resp, token);
      return resp;
    }
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

export async function POST(_req: NextRequest) {
  const session = await getSession();
  const { country, currency } = await getLocale();

  const cart = await createCart(currency, country, session.customerId);

  const newSession = { ...session, cartId: cart.id };
  const token = await createSessionToken(newSession);
  const resp = NextResponse.json({ cart });
  setSessionCookie(resp, token);
  return resp;
}
