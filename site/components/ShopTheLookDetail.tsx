'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCart } from '@/context/CartContext';
import ShopTheLookProductTile from './ShopTheLookProductTile';
import type { ResolvedLookProduct } from '@/lib/types';

interface ShopTheLookDetailProps {
  products: ResolvedLookProduct[];
}

export default function ShopTheLookDetail({ products }: ShopTheLookDetailProps) {
  const t = useTranslations('shopTheLook');
  const { addToCartAndShow } = useCart();

  const [addingId, setAddingId] = useState<string | null>(null);
  const [addingAll, setAddingAll] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [allAdded, setAllAdded] = useState(false);
  const [partialError, setPartialError] = useState(false);

  async function addSingleToCart(product: ResolvedLookProduct) {
    setAddingId(product.productId);
    try {
      const resp = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.productId, variantId: product.variantId, quantity: 1 }),
      });
      if (resp.ok) {
        const data = await resp.json();
        addToCartAndShow(data.cart);
        setAddedIds((prev) => new Set(prev).add(product.productId));
        setTimeout(
          () => setAddedIds((prev) => { const next = new Set(prev); next.delete(product.productId); return next; }),
          2000
        );
      }
    } finally {
      setAddingId(null);
    }
  }

  async function addAllToCart() {
    setAddingAll(true);
    setPartialError(false);
    let failed = 0;
    let lastCart = null;

    for (const product of products) {
      try {
        const resp = await fetch('/api/cart/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.productId, variantId: product.variantId, quantity: 1 }),
        });
        if (resp.ok) {
          const data = await resp.json();
          lastCart = data.cart;
          setAddedIds((prev) => new Set(prev).add(product.productId));
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    if (lastCart) addToCartAndShow(lastCart);

    if (failed > 0) {
      setPartialError(true);
    } else {
      setAllAdded(true);
      setTimeout(() => setAllAdded(false), 2500);
    }

    setAddingAll(false);
  }

  const isBusy = addingAll || addingId !== null;

  return (
    <div>
      {/* Product grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ShopTheLookProductTile
            key={product.productId}
            product={product}
            position={product.position}
            addingId={addingId}
            addedIds={addedIds}
            onAddToCart={addSingleToCart}
            disabled={isBusy}
            addToCartLabel={t('addToCart')}
            addingLabel={t('adding')}
            addedLabel={t('added')}
          />
        ))}
      </div>

      {/* Add All to Cart */}
      <div className="mt-8 flex flex-col items-center gap-3">
        {partialError && (
          <p className="text-sm text-red-600">{t('partialError')}</p>
        )}
        <button
          onClick={addAllToCart}
          disabled={isBusy}
          className="bg-terra hover:bg-terra/90 flex min-w-64 items-center justify-center gap-2 rounded-sm px-8 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
        >
          {addingAll ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              {t('addingAll')}
            </>
          ) : allAdded ? (
            <>✓ {t('allAdded')}</>
          ) : (
            t('addAllToCart')
          )}
        </button>
      </div>
    </div>
  );
}
