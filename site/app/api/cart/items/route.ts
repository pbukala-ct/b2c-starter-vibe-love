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

  // --- server-side debug info (safe to expose — non-sensitive IDs only) ---
  const debug: Record<string, string> = {
    receivedCartId: session.cartId ?? '(none)',
    cartFetchResult: 'skipped',
    usedCartId: '(tbd)',
  };

  let cart;
  let cartId = session.cartId;

  if (cartId) {
    try {
      cart = await getCart(cartId);
      // Discard carts that are no longer active (e.g. already ordered / merged).
      // Attempting to addLineItem on an Ordered cart throws a CT error.
      if (cart.cartState && cart.cartState !== 'Active') {
        debug.cartFetchResult = `found_${cart.cartState}`;
        cart = undefined;
        cartId = undefined;
      } else {
        debug.cartFetchResult = `found_Active_currency_${cart.currency}`;
      }
    } catch (err) {
      debug.cartFetchResult = `error:${String(err).slice(0, 80)}`;
      cartId = undefined;
    }
  }

  // Create new cart if none exists, currency missing/mismatched, or country changed
  if (!cartId || !cart || !cart.currency || cart.currency !== config.currency) {
    cart = await createCart(config.currency, country, session.customerId);
    cartId = cart.id;
    debug.cartCreatedReason = !session.cartId
      ? 'no_session_cartId'
      : debug.cartFetchResult.startsWith('found_Active')
        ? `currency_mismatch(cart=${cart.currency},config=${config.currency})`
        : debug.cartFetchResult;
  }

  debug.usedCartId = cartId!;

  const updatedCart = await addLineItem(cartId!, cart.version, productId, variantId, quantity, recurrencePolicyId);

  const newSession = { ...session, cartId: updatedCart.id };
  const token = await createSessionToken(newSession);
  const resp = NextResponse.json({ cart: updatedCart, debug });
  setSessionCookie(resp, token);
  return resp;
}
