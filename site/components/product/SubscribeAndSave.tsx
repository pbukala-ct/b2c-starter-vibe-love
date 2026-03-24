'use client';

import { useState } from 'react';
import { Price } from '@/lib/ct/search';
import { formatMoney } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';
import Button from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface RecurrencePolicy {
  id: string;
  key: string;
  name: Record<string, string>;
  description?: Record<string, string>;
  schedule: { type: string; value: number; intervalUnit: string };
}

interface SubscribeAndSaveProps {
  productId: string;
  variantId: number;
  regularPrice: Price;
  recurringPrices: Price[];
  recurrencePolicies: RecurrencePolicy[];
  onAddToCart?: (cart: unknown, mode: 'one-time' | 'subscribe') => void;
}

export default function SubscribeAndSave({
  productId,
  variantId,
  regularPrice,
  recurringPrices,
  recurrencePolicies,
  onAddToCart,
}: SubscribeAndSaveProps) {
  const { addToCartAndShow } = useCart();
  const { locale, currency, country } = useLocale();
  const t = useTranslations('product');
  const [mode, setMode] = useState<'one-time' | 'subscribe'>('one-time');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(
    recurrencePolicies[0]?.id || ''
  );
  const [adding, setAdding] = useState(false);

  // Filter recurring prices for current currency/country
  const availableRecurringPrices = recurringPrices.filter(
    (p) => p.value.currencyCode === currency && (!p.country || p.country === country)
  );

  // Map policies to prices
  const policyPrices = recurrencePolicies
    .map((policy) => {
      const price = availableRecurringPrices.find(
        (p) => p.recurrencePolicy?.id === policy.id
      );
      return price ? { policy, price } : null;
    })
    .filter(Boolean) as Array<{ policy: RecurrencePolicy; price: Price }>;

  const selectedPolicyPrice = policyPrices.find(
    (pp) => pp.policy.id === selectedPolicyId
  );

  const regularCentAmount = regularPrice.value.centAmount;
  const subscribePriceCentAmount = selectedPolicyPrice?.price.value.centAmount || regularCentAmount;
  const savingsCent = regularCentAmount - subscribePriceCentAmount;
  const savingsPct = Math.round((savingsCent / regularCentAmount) * 100);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      const recurrencePolicyId = mode === 'subscribe' ? selectedPolicyId : undefined;
      const resp = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          variantId,
          quantity: 1,
          recurrencePolicyId,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        addToCartAndShow(data.cart);
        onAddToCart?.(data.cart, mode);
      }
    } finally {
      setAdding(false);
    }
  };

  if (policyPrices.length === 0) {
    // No subscription options - just show add to cart
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

  return (
    <div className="space-y-4">
      {/* One-time purchase option */}
      <label
        className={`flex items-start gap-3 p-4 border rounded-sm cursor-pointer transition-all ${
          mode === 'one-time' ? 'border-charcoal bg-cream' : 'border-border hover:border-charcoal-light'
        }`}
      >
        <input
          type="radio"
          name="purchase-mode"
          value="one-time"
          checked={mode === 'one-time'}
          onChange={() => setMode('one-time')}
          className="mt-0.5 accent-charcoal"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-charcoal">{t('oneTimePurchase')}</span>
            <span className="text-sm font-semibold text-charcoal">
              {formatMoney(regularPrice.value.centAmount, regularPrice.value.currencyCode)}
            </span>
          </div>
        </div>
      </label>

      {/* Subscribe & Save option */}
      <label
        className={`flex items-start gap-3 p-4 border rounded-sm cursor-pointer transition-all ${
          mode === 'subscribe' ? 'border-sage bg-sage/5' : 'border-border hover:border-sage/50'
        }`}
      >
        <input
          type="radio"
          name="purchase-mode"
          value="subscribe"
          checked={mode === 'subscribe'}
          onChange={() => setMode('subscribe')}
          className="mt-0.5 accent-sage"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-charcoal">
              {t('subscribeOption')}
              {mode === 'subscribe' && savingsPct > 0 && (
                <span className="ml-2 text-xs bg-sage text-white px-1.5 py-0.5 rounded-sm">
                  {t('save', { pct: savingsPct })}
                </span>
              )}
            </span>
            {mode === 'subscribe' && (
              <span className="text-sm font-semibold text-charcoal">
                {formatMoney(subscribePriceCentAmount, currency)}
              </span>
            )}
          </div>

          {mode === 'subscribe' && policyPrices.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-charcoal-light">{t('deliveryFrequency')}</p>
              {policyPrices.map(({ policy, price }) => {
                const policyName = policy.name[locale] || policy.name['en-US'];
                const saving = regularCentAmount - price.value.centAmount;
                const pct = Math.round((saving / regularCentAmount) * 100);
                return (
                  <label
                    key={policy.id}
                    className={`flex items-center justify-between gap-2 p-2.5 border rounded-sm cursor-pointer text-xs ${
                      selectedPolicyId === policy.id
                        ? 'border-sage bg-sage/10 text-charcoal'
                        : 'border-border/50 text-charcoal-light hover:border-sage/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="policy"
                      value={policy.id}
                      checked={selectedPolicyId === policy.id}
                      onChange={() => setSelectedPolicyId(policy.id)}
                      className="accent-sage"
                    />
                    <span className="flex-1">{policyName}</span>
                    <span className="font-medium">{formatMoney(price.value.centAmount, price.value.currencyCode)}</span>
                    {pct > 0 && (
                      <span className="text-sage font-medium">-{pct}%</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </label>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleAddToCart}
        isLoading={adding}
      >
        {mode === 'subscribe' ? t('subscribeAndAddToCart') : t('addToCart')}
      </Button>

      {mode === 'subscribe' && (
        <p className="text-xs text-charcoal-light text-center">
          {t('cancelAnytime')}
        </p>
      )}
    </div>
  );
}
