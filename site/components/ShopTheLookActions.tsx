'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCart } from '@/context/CartContext';
import type { ResolvedLookProduct } from '@/lib/types';

interface ShopTheLookActionsProps {
  products: ResolvedLookProduct[];
}

export default function ShopTheLookActions({ products }: ShopTheLookActionsProps) {
  const t = useTranslations('shopTheLook');
  const { addToCartAndShow } = useCart();
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);
  const [partialError, setPartialError] = useState(false);

  async function handleAddAll() {
    setAdding(true);
    setPartialError(false);
    let failed = 0;
    let lastCart = null;

    for (const product of products) {
      try {
        const resp = await fetch('/api/cart/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.productId,
            variantId: product.variantId,
            quantity: 1,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          lastCart = data.cart;
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
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    }

    setAdding(false);
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        onClick={handleAddAll}
        disabled={adding}
        className="bg-terra hover:bg-terra/90 flex items-center gap-2 rounded-sm px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
      >
        {adding ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            {t('addingAll')}
          </>
        ) : done ? (
          <>✓ {t('allAdded')}</>
        ) : (
          t('addAllToCart')
        )}
      </button>
      {partialError && (
        <p className="text-xs text-red-600">{t('partialError')}</p>
      )}
    </div>
  );
}
