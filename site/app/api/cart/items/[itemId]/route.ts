import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getCart, removeLineItem, changeLineItemQuantity } from '@/lib/ct/cart';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const body = await req.json();
  const { quantity } = body;

  const session = await getSession();
  if (!session.cartId) return NextResponse.json({ error: 'No cart' }, { status: 400 });

  const cart = await getCart(session.cartId);
  const updatedCart = await changeLineItemQuantity(session.cartId, cart.version, itemId, quantity);
  return NextResponse.json({ cart: updatedCart });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;

  const session = await getSession();
  if (!session.cartId) return NextResponse.json({ error: 'No cart' }, { status: 400 });

  const cart = await getCart(session.cartId);
  const updatedCart = await removeLineItem(session.cartId, cart.version, itemId);
  return NextResponse.json({ cart: updatedCart });
}
