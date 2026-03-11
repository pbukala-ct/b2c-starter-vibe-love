import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSessionToken, setSessionCookie } from '@/lib/session';
import { getCart, createCart, addLineItem } from '@/lib/ct/cart';
import { COUNTRY_CONFIG } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productId, variantId = 1, quantity = 1, recurrencePolicyId } = body;

  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 });
  }

  const session = await getSession();
  const country = req.cookies.get('vibe-country')?.value || 'US';
  const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG['US'];

  let cart;
  let cartId = session.cartId;

  if (cartId) {
    try {
      cart = await getCart(cartId);
    } catch {
      cartId = undefined;
    }
  }

  // Create new cart if none exists, currency missing/mismatched, or country changed
  if (!cartId || !cart || !cart.currency || cart.currency !== config.currency) {
    cart = await createCart(config.currency, country, session.customerId);
    cartId = cart.id;
  }

  const updatedCart = await addLineItem(cartId!, cart.version, productId, variantId, quantity, recurrencePolicyId);

  const newSession = { ...session, cartId: updatedCart.id };
  const token = await createSessionToken(newSession);
  const resp = NextResponse.json({ cart: updatedCart });
  setSessionCookie(resp, token);
  return resp;
}
