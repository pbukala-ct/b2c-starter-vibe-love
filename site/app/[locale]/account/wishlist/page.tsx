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
    <div className="border-border overflow-hidden rounded-sm border bg-white">
      <div className="bg-cream-dark relative aspect-square">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="text-border absolute inset-0 flex items-center justify-center">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        <button
          onClick={async () => {
            setRemoving(true);
            await onRemove();
            setRemoving(false);
          }}
          disabled={removing}
          aria-label="Remove from wishlist"
          className="border-border text-charcoal-light hover:text-terra hover:border-terra absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border bg-white transition-colors disabled:opacity-50"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-2 p-3">
        {productHref ? (
          <Link
            href={productHref}
            className="text-charcoal hover:text-terra line-clamp-2 block text-sm font-medium"
          >
            {name}
          </Link>
        ) : (
          <p className="text-charcoal line-clamp-2 text-sm font-medium">{name}</p>
        )}
        {price && (
          <p className="text-charcoal text-sm">
            {formatMoney(price.centAmount, price.currencyCode)}
          </p>
        )}
        <button
          onClick={async () => {
            setAdding(true);
            await onMoveToCart();
            setAdding(false);
          }}
          disabled={adding}
          className="bg-charcoal hover:bg-charcoal/80 w-full rounded-sm px-3 py-2 text-xs text-white transition-colors disabled:opacity-50"
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
      body: JSON.stringify({
        productId: item.productId,
        variantId: item.variant.id ?? 1,
        quantity: 1,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      addToCartAndShow(data.cart);
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-charcoal mb-6 text-2xl font-semibold">{t('wishlist')}</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-cream-dark aspect-square animate-pulse rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  const items = wishlist?.items ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-charcoal text-2xl font-semibold">{t('wishlist')}</h1>
        {items.length > 0 && (
          <span className="text-charcoal-light text-sm">
            ({items.length} {items.length === 1 ? 'item' : 'items'})
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="border-border rounded-sm border bg-white p-12 text-center">
          <svg
            className="text-border mx-auto mb-4 h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          <p className="text-charcoal-light mb-4">Your wishlist is empty.</p>
          <Link
            href={localePath('/')}
            className="bg-charcoal hover:bg-charcoal/80 inline-block rounded-sm px-6 py-2.5 text-sm font-medium text-white transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const slug = item.productSlug
              ? getLocalizedString(item.productSlug as Record<string, string>)
              : undefined;
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
