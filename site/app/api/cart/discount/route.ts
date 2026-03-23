import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSessionToken, setSessionCookie } from '@/lib/session';
import { getCart, applyDiscountCode, removeDiscountCode } from '@/lib/ct/cart';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Discount code is required' }, { status: 400 });
    }

    if (!session.cartId) {
      return NextResponse.json({ error: 'No active cart' }, { status: 404 });
    }

    const currentCart = await getCart(session.cartId);
    const updatedCart = await applyDiscountCode(session.cartId, currentCart.version, code);

    const response = NextResponse.json({ cart: updatedCart });
    const token = await createSessionToken({ ...session, cartId: updatedCart.id });
    return setSessionCookie(response, token);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to apply discount code';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    const { discountCodeId } = await request.json();

    if (!discountCodeId) {
      return NextResponse.json({ error: 'discountCodeId is required' }, { status: 400 });
    }

    if (!session.cartId) {
      return NextResponse.json({ error: 'No active cart' }, { status: 404 });
    }

    const currentCart = await getCart(session.cartId);
    const updatedCart = await removeDiscountCode(session.cartId, currentCart.version, discountCodeId);

    const response = NextResponse.json({ cart: updatedCart });
    const token = await createSessionToken({ ...session, cartId: updatedCart.id });
    return setSessionCookie(response, token);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove discount code';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
