'use client';

import { useState } from 'react';
import type { Price } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';
import Button from '@/components/ui/Button';
import { useRecurrencePoliciesList } from '@/hooks/useRecurrencePolicies';
import { RecurringPriceSelector } from './RecurringPriceSelector';
import { useTranslations } from 'next-intl';

interface SubscribeAndSaveProps {
  productId: string;
  variantId: number;
  quantity?: number;
  regularPrice: Price;
  recurringPrices: Price[];
  onAddToCart?: (cart: unknown, mode: 'one-time' | 'subscribe') => void;
}

export default function SubscribeAndSave({
  productId,
  variantId,
  quantity = 1,
  regularPrice,
  recurringPrices,
  onAddToCart,
}: SubscribeAndSaveProps) {
  const recurrencePolicies = useRecurrencePoliciesList();
  const { addToCartAndShow } = useCart();
  const { currency, country } = useLocale();
  const t = useTranslations('product');
  const [selection, setSelection] = useState<'one-time' | string>('one-time');
  const [adding, setAdding] = useState(false);

  // Filter recurring prices for current currency/country
  const availableRecurringPrices = recurringPrices.filter(
    (p) => p.value.currencyCode === currency && (!p.country || p.country === country)
  );

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      const isSubscribe = selection !== 'one-time';
      const recurrencePolicyId = isSubscribe && selection ? selection : undefined;
      const resp = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          variantId,
          quantity,
          recurrencePolicyId,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        addToCartAndShow(data.cart);
        onAddToCart?.(data.cart, isSubscribe ? 'subscribe' : 'one-time');
      }
    } finally {
      setAdding(false);
    }
  };

  if (availableRecurringPrices.length === 0 || recurrencePolicies.length === 0) {
    return (
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleAddToCart}
        isLoading={adding}
      >
        {t('addToCart')}
      </Button>
    );
  }

  const isSubscribe = selection !== 'one-time';
  const buttonLabel = isSubscribe && selection ? t('subscribeAndAddToCart') : t('addToCart');
  const isDisabled = isSubscribe && !selection;

  return (
    <div className="space-y-4">
      <RecurringPriceSelector
        oneTimePrice={regularPrice.value}
        recurringPrices={availableRecurringPrices}
        policies={recurrencePolicies}
        value={selection}
        onChange={setSelection}
      />

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleAddToCart}
        isLoading={adding}
        disabled={isDisabled}
      >
        {buttonLabel}
      </Button>

      {isSubscribe && (
        <p className="text-charcoal-light text-center text-xs">{t('cancelAnytime')}</p>
      )}
    </div>
  );
}
