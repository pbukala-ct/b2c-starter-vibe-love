'use client';

import { useState } from 'react';
import type { Price } from '@/lib/types';
import QuantitySelector from './QuantitySelector';
import AddToCartButton from './AddToCartButton';
import SubscribeAndSave from './SubscribeAndSave';

interface PDPActionsProps {
  productId: string;
  variantId: number;
  regularPrice: Price;
  recurringPrices: Price[];
  isSubscriptionEligible: boolean;
}

export default function PDPActions({
  productId,
  variantId,
  regularPrice,
  recurringPrices,
  isSubscriptionEligible,
}: PDPActionsProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="space-y-4">
      <QuantitySelector value={quantity} onChange={setQuantity} />

      {isSubscriptionEligible && recurringPrices.length > 0 ? (
        <SubscribeAndSave
          productId={productId}
          variantId={variantId}
          quantity={quantity}
          regularPrice={regularPrice}
          recurringPrices={recurringPrices}
        />
      ) : (
        <AddToCartButton productId={productId} variantId={variantId} quantity={quantity} />
      )}
    </div>
  );
}
