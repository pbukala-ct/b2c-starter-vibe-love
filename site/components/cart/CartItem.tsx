'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CartLineItem } from '@/context/CartContext';
import { useFormatters } from '@/hooks/useFormatters';
import { useLocale } from '@/context/LocaleContext';
import { useState } from 'react';
import { useRecurrencePolicies } from '@/hooks/useRecurrencePolicies';
import { useTranslations } from 'next-intl';

interface CartItemProps {
  item: CartLineItem;
  onUpdate: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}

export default function CartItem({ item, onUpdate, onRemove }: CartItemProps) {
  const { locale, localePath } = useLocale();
  const { formatMoney, getLocalizedString } = useFormatters();
  const policyMap = useRecurrencePolicies();
  const [qty, setQty] = useState(item.quantity);
  const [updating, setUpdating] = useState(false);
  const t = useTranslations('cart');

  const name = getLocalizedString(item.name);
  const image = item.variant?.images?.[0]?.url;
  const unitPrice = formatMoney(
    item.price?.value?.centAmount || 0,
    item.price?.value?.currencyCode || 'USD'
  );
  const total = formatMoney(
    item.totalPrice?.centAmount || 0,
    item.totalPrice?.currencyCode || 'USD'
  );
  const isSubscription = !!item.recurrenceInfo?.recurrencePolicy;
  const policyId = item.recurrenceInfo?.recurrencePolicy?.id;
  const intervalLabel = policyId
    ? policyMap.get(policyId) || 'Subscribe & Save'
    : 'Subscribe & Save';
  const slug = getLocalizedString(item.productSlug) || item.productKey || item.productId;
  const sku = item.variant?.sku || item.productId;

  const handleQtyChange = async (newQty: number) => {
    if (newQty < 1) return;
    setQty(newQty);
    setUpdating(true);
    await onUpdate(item.id, newQty);
    setUpdating(false);
  };

  return (
    <div className="border-border flex gap-4 border-b py-5 last:border-0">
      {/* Image */}
      <div className="bg-cream-dark relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-sm">
        {image ? (
          <Image src={image} alt={name} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="bg-cream-dark h-full w-full" />
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <Link
          href={localePath(`/${slug}/p/${sku}`)}
          className="text-charcoal hover:text-terra line-clamp-2 text-sm font-medium"
        >
          {name}
        </Link>

        {isSubscription && (
          <div className="mt-1 flex items-center gap-1">
            <span className="text-sage text-xs font-medium">♻ {intervalLabel}</span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          {/* Qty controls */}
          <div className="border-border flex items-center rounded-sm border">
            <button
              onClick={() => handleQtyChange(qty - 1)}
              disabled={updating || qty <= 1}
              className="text-charcoal-light hover:text-charcoal flex h-8 w-8 items-center justify-center text-lg disabled:opacity-40"
              aria-label={t('decreaseQuantity')}
            >
              −
            </button>
            <span className="flex h-8 w-8 items-center justify-center text-sm font-medium">
              {updating ? '…' : qty}
            </span>
            <button
              onClick={() => handleQtyChange(qty + 1)}
              disabled={updating}
              className="text-charcoal-light hover:text-charcoal flex h-8 w-8 items-center justify-center text-lg"
              aria-label={t('increaseQuantity')}
            >
              +
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-charcoal text-sm font-medium">{total}</p>
            {qty > 1 && (
              <p className="text-charcoal-light text-xs">
                {unitPrice} {t('each')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id)}
        className="text-charcoal-light mt-1 flex-shrink-0 self-start transition-colors hover:text-red-500"
        aria-label={t('removeItem')}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
