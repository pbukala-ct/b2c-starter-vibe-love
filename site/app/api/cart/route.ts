import { NextRequest, NextResponse } from 'next/server';
import { getSession, getLocale, createSessionToken, setSessionCookie } from '@/lib/session';
import {
  getCart,
  createCart,
  setShippingAddress,
  setBillingAddress,
  setShippingMethod,
} from '@/lib/ct/cart';

export async function GET(_req: NextRequest) {
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

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session.cartId) return NextResponse.json({ error: 'No cart' }, { status: 400 });

  const { shippingAddress, billingAddress, shippingMethodId } = await req.json();
  let cart = await getCart(session.cartId);
  if (shippingAddress)
    cart = await setShippingAddress(session.cartId, cart.version, shippingAddress);
  if (billingAddress) cart = await setBillingAddress(session.cartId, cart.version, billingAddress);
  if (shippingMethodId)
    cart = await setShippingMethod(session.cartId, cart.version, shippingMethodId);
  return NextResponse.json({ cart });
}

export async function POST(_req: NextRequest) {
  const [session, { country, currency }] = await Promise.all([getSession(), getLocale()]);

  const cart = await createCart(currency, country, session.customerId);

  const newSession = { ...session, cartId: cart.id };
  const token = await createSessionToken(newSession);
  const resp = NextResponse.json({ cart });
  setSessionCookie(resp, token);
  return resp;
}
