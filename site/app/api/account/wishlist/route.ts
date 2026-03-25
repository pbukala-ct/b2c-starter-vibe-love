import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getOrCreateWishlist, addWishlistItem } from '@/lib/ct/wishlist';
import { ShoppingList } from '@commercetools/platform-sdk';

export function shapeWishlist(raw: ShoppingList) {
  const lineItems = raw.lineItems ?? [];
  return {
    id: raw.id,
    version: raw.version,
    items: lineItems.map((li) => {
      return {
        id: li.id,
        productId: li.productId,
        name: li.name,
        quantity: li.quantity ?? 1,
        productSlug: li.productSlug,
        variant: {
          id: li.variant?.id,
          sku: li.variant?.sku,
          images: li.variant?.images,
          price: li.variant?.prices?.[0] ?? null,
        },
      };
    }),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const wishlist = await getOrCreateWishlist(session.customerId);
    return NextResponse.json(shapeWishlist(wishlist));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { sku, quantity = 1 } = await req.json();
  if (!sku) return NextResponse.json({ error: 'sku required' }, { status: 400 });
  try {
    const wishlist = await getOrCreateWishlist(session.customerId);
    const updated = await addWishlistItem(wishlist.id, wishlist.version, sku, quantity);
    return NextResponse.json(shapeWishlist(updated));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
