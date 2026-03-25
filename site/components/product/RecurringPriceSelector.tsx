'use client';

import { useTranslations } from 'next-intl';
import { useFormatters } from '@/hooks/useFormatters';
import type { Price } from '@/lib/types';

interface RecurrencePolicy {
  id: string;
  key: string;
  name: Record<string, string>;
  schedule: { type: string; value: number; intervalUnit: string };
}

export interface RecurringPriceSelectorProps {
  oneTimePrice: { centAmount: number; currencyCode: string };
  recurringPrices: Price[];
  policies: RecurrencePolicy[];
  /** 'one-time' or a recurrencePolicyId */
  value: 'one-time' | string;
  onChange: (value: 'one-time' | string) => void;
  disabled?: boolean;
}

export function RecurringPriceSelector({
  oneTimePrice,
  recurringPrices,
  policies,
  value,
  onChange,
  disabled = false,
}: RecurringPriceSelectorProps) {
  const t = useTranslations('pdp');
  const { formatMoney, getLocalizedString } = useFormatters();

  const getPolicyName = (price: Price): string => {
    const id = price.recurrencePolicy?.id;
    if (!id) return '';
    const policy = policies.find((p) => p.id === id);
    if (!policy) return id;
    return getLocalizedString(policy.name) || id;
  };

  return (
    <div className="flex flex-col gap-3" role="radiogroup" aria-label={t('purchaseOption')}>
      {/* One-time purchase */}
      <label
        className={`flex cursor-pointer items-center justify-between rounded border-2 p-4 transition-colors ${
          value === 'one-time'
            ? 'border-charcoal bg-cream'
            : 'border-border hover:border-charcoal/40 bg-white'
        }`}
      >
        <span className="flex items-center gap-2">
          <input
            type="radio"
            name="purchase-type"
            value="one-time"
            checked={value === 'one-time'}
            onChange={() => onChange('one-time')}
            className="accent-charcoal h-4 w-4"
            aria-label={t('oneTimePurchase')}
          />
          <span className="text-charcoal text-sm font-medium">{t('oneTimePurchase')}</span>
        </span>
        <span className="text-charcoal text-sm font-semibold">
          {formatMoney(oneTimePrice.centAmount, oneTimePrice.currencyCode)}
        </span>
      </label>

      {/* Subscribe & Save */}
      <label
        className={`flex cursor-pointer flex-col gap-2 rounded border-2 p-4 transition-colors ${
          value !== 'one-time'
            ? 'border-sage bg-sage/5'
            : 'border-border hover:border-sage/40 bg-white'
        } ${disabled ? 'opacity-60' : ''}`}
      >
        <span className="flex items-center gap-2">
          <input
            type="radio"
            name="purchase-type"
            value="subscribe"
            checked={value !== 'one-time'}
            onChange={() => {
              if (value === 'one-time') {
                onChange('');
              }
            }}
            className="accent-sage h-4 w-4"
            aria-label={t('subscribeAndSave')}
          />
          <span className="text-charcoal text-sm font-medium">{t('subscribeAndSave')}</span>
        </span>

        {recurringPrices.length > 0 && (
          <select
            value={value === 'one-time' ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
            className="border-border text-charcoal focus:border-charcoal mt-1 w-full max-w-xs rounded border bg-white px-3 py-2 text-sm focus:outline-none"
            aria-label={t('selectRecurrence')}
          >
            <option value="">{t('selectRecurrence')}</option>
            {recurringPrices.map((price) => {
              const id = price.recurrencePolicy?.id ?? '';
              const label = getPolicyName(price);
              const priceStr = formatMoney(price.value.centAmount, price.value.currencyCode);
              return (
                <option key={id} value={id}>
                  {label} — {priceStr}
                </option>
              );
            })}
          </select>
        )}
      </label>
    </div>
  );
}
