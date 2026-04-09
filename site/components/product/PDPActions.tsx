'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import QuantitySelector from './QuantitySelector';
import AddToCartButton from './AddToCartButton';
import SubscribeAndSave from './SubscribeAndSave';
import Button from '@/components/ui/Button';
import type { Price } from '@/lib/types';

interface PDPActionsProps {
  productId: string;
  variantId: number;
  regularPrice: Price;
  recurringPrices: Price[];
  isSubscriptionEligible: boolean;
  isSoldOut: boolean;
}

export default function PDPActions({
  productId,
  variantId,
  regularPrice,
  recurringPrices,
  isSubscriptionEligible,
  isSoldOut,
}: PDPActionsProps) {
  const t = useTranslations('product');
  const [quantity, setQuantity] = useState(1);

  if (isSoldOut) {
    return (
      <div className="space-y-3">
        <p className="text-charcoal-light text-sm">{t('outOfStock')}</p>
        <Button variant="primary" size="lg" className="w-full" disabled>
          {t('currentlyUnavailable')}
        </Button>
      </div>
    );
  }

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
