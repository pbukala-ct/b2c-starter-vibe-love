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
      // Discard carts that are no longer active (e.g. already ordered / merged).
      // Attempting to addLineItem on an Ordered cart throws a CT error.
      if (cart.cartState && cart.cartState !== 'Active') {
        cart = undefined;
        cartId = undefined;
      }
    } catch {
      cartId = undefined;
    }
  }

  // CT carts store currency at cart.currency OR cart.totalPrice.currencyCode.
  // Always prefer totalPrice.currencyCode as the authoritative source.
  const cartCurrency = cart?.currency || cart?.totalPrice?.currencyCode;

  // Create new cart if none exists, currency missing/mismatched, or country changed
  if (!cartId || !cart || !cartCurrency || cartCurrency !== config.currency) {
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
