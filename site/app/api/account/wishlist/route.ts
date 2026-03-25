import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getOrCreateWishlist, addWishlistItem } from '@/lib/ct/wishlist';

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
          ? Object.fromEntries(
              (li.nameAllLocales as Array<{ locale: string; value: string }>).map((n) => [
                n.locale,
                n.value,
              ])
            )
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
