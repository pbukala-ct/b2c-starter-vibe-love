'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useWishlist, useWishlistMutations } from '@/hooks/useWishlist';
import { useFormatters } from '@/hooks/useFormatters';
import { useCart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { WishlistItem } from '@/hooks/useWishlist';

function WishlistCard({
  item,
  onRemove,
  onMoveToCart,
  productHref,
}: {
  item: WishlistItem;
  onRemove: () => Promise<void>;
  onMoveToCart: () => Promise<void>;
  productHref?: string;
}) {
  const { formatMoney, getLocalizedString } = useFormatters();
  const t = useTranslations('nav');
  const [removing, setRemoving] = useState(false);
  const [adding, setAdding] = useState(false);

  const image = item.variant.images?.[0]?.url;
  const name = getLocalizedString(item.name);
  const price = item.variant.price?.value;

  return (
    <div className="bg-white border border-border rounded-sm overflow-hidden">
      <div className="relative aspect-square bg-cream-dark">
        {image ? (
          <Image src={image} alt={name} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-border">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <button
          onClick={async () => { setRemoving(true); await onRemove(); setRemoving(false); }}
          disabled={removing}
          aria-label="Remove from wishlist"
          className="absolute top-2 right-2 w-7 h-7 bg-white border border-border rounded-full flex items-center justify-center text-charcoal-light hover:text-terra hover:border-terra transition-colors disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-3 space-y-2">
        {productHref ? (
          <Link href={productHref} className="text-sm font-medium text-charcoal hover:text-terra line-clamp-2 block">
            {name}
          </Link>
        ) : (
          <p className="text-sm font-medium text-charcoal line-clamp-2">{name}</p>
        )}
        {price && (
          <p className="text-sm text-charcoal">{formatMoney(price.centAmount, price.currencyCode)}</p>
        )}
        <button
          onClick={async () => { setAdding(true); await onMoveToCart(); setAdding(false); }}
          disabled={adding}
          className="w-full bg-charcoal text-white text-xs py-2 px-3 rounded-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50"
        >
          {adding ? '…' : t('cart')}
        </button>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { data: wishlist, isLoading } = useWishlist();
  const { removeItem } = useWishlistMutations();
  const { addToCartAndShow } = useCart();
  const { localePath } = useLocale();
  const { getLocalizedString } = useFormatters();
  const t = useTranslations('nav');

  async function addToCart(item: WishlistItem) {
    if (!item.productId) return;
    const resp = await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: item.productId, variantId: item.variant.id ?? 1, quantity: 1 }),
    });
    if (resp.ok) {
      const data = await resp.json();
      addToCartAndShow(data.cart);
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-charcoal mb-6">{t('wishlist')}</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square bg-cream-dark rounded-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const items = wishlist?.items ?? [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">{t('wishlist')}</h1>
        {items.length > 0 && (
          <span className="text-sm text-charcoal-light">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-border rounded-sm p-12 text-center">
          <svg className="w-12 h-12 text-border mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <p className="text-charcoal-light mb-4">Your wishlist is empty.</p>
          <Link href={localePath('/')} className="bg-charcoal text-white px-6 py-2.5 text-sm font-medium hover:bg-charcoal/80 transition-colors rounded-sm inline-block">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => {
            const slug = item.productSlug ? getLocalizedString(item.productSlug as Record<string, string>) : undefined;
            const productHref = slug ? localePath(`/products/${slug}`) : undefined;
            return (
              <WishlistCard
                key={item.id}
                item={item}
                productHref={productHref}
                onRemove={() => removeItem(item.id)}
                onMoveToCart={() => addToCart(item)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
