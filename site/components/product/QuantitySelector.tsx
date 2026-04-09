'use client';

import { useTranslations } from 'next-intl';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
}: QuantitySelectorProps) {
  const t = useTranslations('cart');

  return (
    <div className="flex items-center gap-3">
      <span className="text-charcoal-light text-sm">{t('quantity')}</span>
      <div className="border-border flex items-center rounded-sm border">
        <button
          type="button"
          aria-label={t('decreaseQuantity')}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="text-charcoal hover:bg-cream disabled:text-border cursor-pointer px-3 py-2 text-lg leading-none transition-colors disabled:cursor-not-allowed"
        >
          −
        </button>
        <span className="text-charcoal w-10 text-center text-sm font-medium">{value}</span>
        <button
          type="button"
          aria-label={t('increaseQuantity')}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="text-charcoal hover:bg-cream disabled:text-border cursor-pointer px-3 py-2 text-lg leading-none transition-colors disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}
