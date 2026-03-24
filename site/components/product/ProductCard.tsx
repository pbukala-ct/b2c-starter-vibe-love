'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ProductProjection } from '@/lib/ct/search';
import { formatMoney, getLocalizedString } from '@/lib/utils';
import { useLocale } from '@/context/LocaleContext';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

interface ProductCardProps {
  product: ProductProjection;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { locale, currency, localePath } = useLocale();
  const { addToCartAndShow } = useCart();
  const [adding, setAdding] = useState(false);

  const name = getLocalizedString(product.name, locale);
  const slug = product.slug?.['en-US'] || product.slug?.['en-GB'] || product.key || product.id;
  const image = product.masterVariant?.images?.[0]?.url;
  const price = product.masterVariant?.price;
  const hasSubscription = product.masterVariant?.recurrencePrices?.some(
    (p) => p.recurrencePolicy
  );

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
    <Link href={localePath(`/products/${slug}`)} className="group block">
      <div className="bg-cream-dark rounded-sm overflow-hidden aspect-square relative mb-3">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-border">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {hasSubscription && (
          <div className="absolute top-2 left-2 bg-sage text-white text-xs px-2 py-0.5 rounded-sm font-medium">
            Subscribe & Save
          </div>
        )}

        {/* Quick add button */}
        <button
          onClick={handleAddToCart}
          disabled={adding}
          className="absolute bottom-2 right-2 bg-white text-charcoal text-xs px-3 py-1.5 rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm hover:bg-charcoal hover:text-white font-medium"
        >
          {adding ? '...' : 'Add to Cart'}
        </button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-charcoal group-hover:text-terra transition-colors line-clamp-2 mb-1">
          {name}
        </h3>
        {price ? (
          <p className="text-sm text-charcoal-light">
            {formatMoney(price.value.centAmount, price.value.currencyCode)}
          </p>
        ) : (
          <p className="text-sm text-charcoal-light">See options</p>
        )}
      </div>
    </Link>
  );
}
