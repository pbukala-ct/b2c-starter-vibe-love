'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CartLineItem } from '@/context/CartContext';
import { formatMoney, getLocalizedString } from '@/lib/utils';
import { useLocale } from '@/context/LocaleContext';
import { useState } from 'react';
import { useRecurrencePolicies } from '@/hooks/useRecurrencePolicies';

interface CartItemProps {
  item: CartLineItem;
  onUpdate: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}

export default function CartItem({ item, onUpdate, onRemove }: CartItemProps) {
  const { locale } = useLocale();
  const policyMap = useRecurrencePolicies();
  const [qty, setQty] = useState(item.quantity);
  const [updating, setUpdating] = useState(false);

  const name = getLocalizedString(item.name, locale);
  const image = item.variant?.images?.[0]?.url;
  const unitPrice = formatMoney(item.price?.value?.centAmount || 0, item.price?.value?.currencyCode || 'USD');
  const total = formatMoney(item.totalPrice?.centAmount || 0, item.totalPrice?.currencyCode || 'USD');
  const isSubscription = !!item.recurrenceInfo?.recurrencePolicy;
  const policyId = item.recurrenceInfo?.recurrencePolicy?.id;
  const intervalLabel = policyId ? (policyMap.get(policyId) || 'Subscribe & Save') : 'Subscribe & Save';
  const slug = item.productSlug?.['en-US'] || item.productKey || item.productId;

  const handleQtyChange = async (newQty: number) => {
    if (newQty < 1) return;
    setQty(newQty);
    setUpdating(true);
    await onUpdate(item.id, newQty);
    setUpdating(false);
  };

  return (
    <div className="flex gap-4 py-5 border-b border-border last:border-0">
      {/* Image */}
      <div className="w-20 h-20 relative flex-shrink-0 bg-cream-dark rounded-sm overflow-hidden">
        {image ? (
          <Image src={image} alt={name} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="w-full h-full bg-cream-dark" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${slug}`}
          className="text-sm font-medium text-charcoal hover:text-terra line-clamp-2"
        >
          {name}
        </Link>

        {isSubscription && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-sage font-medium">♻ {intervalLabel}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          {/* Qty controls */}
          <div className="flex items-center border border-border rounded-sm">
            <button
              onClick={() => handleQtyChange(qty - 1)}
              disabled={updating || qty <= 1}
              className="w-8 h-8 flex items-center justify-center text-charcoal-light hover:text-charcoal disabled:opacity-40 text-lg"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 h-8 flex items-center justify-center text-sm font-medium">
              {updating ? '…' : qty}
            </span>
            <button
              onClick={() => handleQtyChange(qty + 1)}
              disabled={updating}
              className="w-8 h-8 flex items-center justify-center text-charcoal-light hover:text-charcoal text-lg"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-sm font-medium text-charcoal">{total}</p>
            {qty > 1 && (
              <p className="text-xs text-charcoal-light">{unitPrice} each</p>
            )}
          </div>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id)}
        className="text-charcoal-light hover:text-red-500 transition-colors flex-shrink-0 self-start mt-1"
        aria-label="Remove item"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
