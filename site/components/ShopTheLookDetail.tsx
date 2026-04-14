'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCart } from '@/context/CartContext';
import ShopTheLookProductTile from './ShopTheLookProductTile';
import type { ResolvedLookProduct } from '@/lib/types';

interface ShopTheLookDetailProps {
  products: ResolvedLookProduct[];
}

function getLookLayout(count: number): string {
  if (count === 1) return 'flex justify-center';
  if (count === 2) return 'grid grid-cols-1 gap-5 sm:grid-cols-2';
  if (count === 3) return 'grid grid-cols-1 gap-5 sm:grid-cols-3';
  if (count === 4) return 'grid grid-cols-2 gap-5 sm:grid-cols-2';
  return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';
}

export default function ShopTheLookDetail({ products }: ShopTheLookDetailProps) {
  const t = useTranslations('shopTheLook');
  const { addToCartAndShow } = useCart();

  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

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

  const isBusy = addingId !== null;

  return (
    <div className={getLookLayout(products.length)}>
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
          viewDetailsLabel={t('viewDetails')}
        />
      ))}
    </div>
  );
}
