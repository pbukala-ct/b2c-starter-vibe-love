'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ProductProjection } from '@/lib/types';
import { useFormatters } from '@/hooks/useFormatters';
import { useLocale } from '@/context/LocaleContext';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { transformListingImageUrl } from '@/lib/ct/image-config';

interface ProductCardProps {
  product: ProductProjection;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { localePath } = useLocale();
  const { formatMoney, getLocalizedString } = useFormatters();
  const { addToCartAndShow } = useCart();
  const [adding, setAdding] = useState(false);
  const t = useTranslations('product');

  const name = getLocalizedString(product.name);
  const slug = getLocalizedString(product.slug) || product.key || product.id;
  const sku = product.masterVariant?.sku || product.id;
  const image = product.masterVariant?.images?.[0]?.url
    ? transformListingImageUrl(product.masterVariant.images[0].url)
    : undefined;
  const price = product.masterVariant?.price;
  const hasSubscription = product.masterVariant?.recurrencePrices?.some((p) => p.recurrencePolicy);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      const resp = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, variantId: 1, quantity: 1 }),
      });
      if (resp.ok) {
        const data = await resp.json();
        addToCartAndShow(data.cart);
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link href={localePath(`/${slug}/p/${sku}`)} className="group block">
      <div className="bg-cream-dark relative mb-3 aspect-square overflow-hidden rounded-sm">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="text-border flex h-full w-full items-center justify-center">
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

        {hasSubscription && (
          <div className="bg-sage absolute top-2 left-2 rounded-sm px-2 py-0.5 text-xs font-medium text-white">
            {t('subscribeAndSave')}
          </div>
        )}

        {/* Quick add button */}
        <button
          onClick={handleAddToCart}
          disabled={adding}
          className="text-charcoal hover:bg-charcoal absolute right-2 bottom-2 rounded-sm bg-white px-3 py-1.5 text-xs font-medium opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 hover:text-white"
        >
          {adding ? t('adding') : t('addToCart')}
        </button>
      </div>

      <div>
        <h3 className="text-charcoal group-hover:text-terra mb-1 line-clamp-2 text-sm font-medium transition-colors">
          {name}
        </h3>
        {price ? (
          <p className="text-charcoal-light text-sm">
            {formatMoney(price.value.centAmount, price.value.currencyCode)}
          </p>
        ) : (
          <p className="text-charcoal-light text-sm">{t('seeOptions')}</p>
        )}
      </div>
    </Link>
  );
}
