import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getOrCreateWishlist, removeWishlistItem, updateWishlistItemQty } from '@/lib/ct/wishlist';

function shapeWishlist(raw: Record<string, unknown>) {
  const lineItems = (raw.lineItems as Array<Record<string, unknown>>) ?? [];
  return {
    id: raw.id,
    version: raw.version,
    items: lineItems.map((li) => {
      const variant = (li.variant as Record<string, unknown>) ?? {};
      const prices = (variant.prices as Array<Record<string, unknown>>) ?? [];
      return {
        id: li.id,
        productId: li.productId,
        name: li.nameAllLocales
          ? Object.fromEntries((li.nameAllLocales as Array<{ locale: string; value: string }>).map(n => [n.locale, n.value]))
          : (li.name ?? {}),
        quantity: li.quantity ?? 1,
        productSlug: li.productSlug,
        variant: {
          id: variant.id,
          sku: variant.sku,
          images: variant.images,
          price: prices[0] ?? null,
        },
      };
    }),
  };
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { itemId } = await params;
  try {
    const wishlist = await getOrCreateWishlist(session.customerId);
    const updated = await removeWishlistItem(wishlist.id, wishlist.version, itemId);
    return NextResponse.json(shapeWishlist(updated));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { itemId } = await params;
  const { quantity } = await req.json();
  if (typeof quantity !== 'number' || quantity < 1) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
  }
  try {
    const wishlist = await getOrCreateWishlist(session.customerId);
    const updated = await updateWishlistItemQty(wishlist.id, wishlist.version, itemId, quantity);
    return NextResponse.json(shapeWishlist(updated));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
