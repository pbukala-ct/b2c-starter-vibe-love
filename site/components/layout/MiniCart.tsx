'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart, Cart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';
import { formatMoney, getLocalizedString } from '@/lib/utils';
import { useState } from 'react';
import { useRecurrencePolicies } from '@/hooks/useRecurrencePolicies';
import { useTranslations } from 'next-intl';

function MiniCartFooter({
  cart,
  country,
  localePath,
  onClose,
}: {
  cart: Cart;
  country: string;
  localePath: (path: string) => string;
  onClose: () => void;
}) {
  const t = useTranslations('miniCart');
  const taxAmount = cart.taxedPrice
    ? cart.taxedPrice.totalGross.centAmount - cart.taxedPrice.totalNet.centAmount
    : country === 'US'
      ? Math.round(cart.totalPrice.centAmount * 0.1)
      : 0;
  const taxIsEstimate = !cart.taxedPrice && taxAmount > 0;
  return (
    <div className="border-border space-y-3 border-t p-5">
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-charcoal-light">{t('subtotal')}</span>
          <span className="font-medium">
            {formatMoney(cart.totalPrice.centAmount, cart.totalPrice.currencyCode)}
          </span>
        </div>
        {taxAmount > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-charcoal-light">
              {taxIsEstimate ? t('estimatedTax') : t('tax')}
            </span>
            <span>{formatMoney(taxAmount, cart.totalPrice.currencyCode)}</span>
          </div>
        )}
      </div>
      <p className="text-charcoal-light text-xs">{t('shippingCalculated')}</p>
      <Link
        href={localePath('/checkout')}
        onClick={onClose}
        className="bg-charcoal hover:bg-charcoal/80 block w-full rounded-sm py-3 text-center text-sm font-medium text-white transition-colors"
      >
        {t('checkout')}
      </Link>
      <Link
        href={localePath('/cart')}
        onClick={onClose}
        className="border-border text-charcoal hover:bg-cream block w-full rounded-sm border py-2.5 text-center text-sm font-medium transition-colors"
      >
        {t('viewCart')}
      </Link>
    </div>
  );
}

export default function MiniCart() {
  const { cart, showMiniCart, setShowMiniCart, itemCount, setCart } = useCart();
  const { locale, currency, country, localePath } = useLocale();
  const policyMap = useRecurrencePolicies();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const t = useTranslations('miniCart');

  const handleRemove = async (lineItemId: string) => {
    setIsUpdating(lineItemId);
    try {
      const resp = await fetch(`/api/cart/items/${lineItemId}`, { method: 'DELETE' });
      if (resp.ok) {
        const data = await resp.json();
        setCart(data.cart);
      }
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <>
      {/* Cart icon button */}
      <button
        onClick={() => setShowMiniCart(!showMiniCart)}
        className="text-charcoal hover:text-terra relative flex items-center gap-1 transition-colors"
        aria-label={`Cart (${itemCount} items)`}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        {itemCount > 0 && (
          <span className="bg-terra absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full text-xs font-medium text-white">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {showMiniCart && (
        <button
          className="fixed inset-0 z-40 cursor-default bg-black/20"
          onClick={() => setShowMiniCart(false)}
          aria-label={t('closeCart')}
          tabIndex={-1}
        />
      )}

      {/* Flyout panel */}
      <div
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${showMiniCart ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-5">
          <h2 className="text-charcoal text-lg font-semibold">
            {t('title')}{' '}
            {itemCount > 0 && (
              <span className="text-charcoal-light text-sm font-normal">({itemCount})</span>
            )}
          </h2>
          <button
            onClick={() => setShowMiniCart(false)}
            className="text-charcoal-light hover:text-charcoal transition-colors"
            aria-label={t('closeCart')}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {!cart || cart.lineItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <svg
                className="text-border h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p className="text-charcoal-light">{t('empty')}</p>
              <Link
                href={localePath('/')}
                onClick={() => setShowMiniCart(false)}
                className="text-terra text-sm hover:underline"
              >
                {t('continueShopping')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.lineItems.map((item) => {
                const name = getLocalizedString(item.name, locale);
                const image = item.variant?.images?.[0]?.url;
                const price = formatMoney(
                  item.price?.value?.centAmount || 0,
                  item.price?.value?.currencyCode || currency
                );
                const isSubscription = !!item.recurrenceInfo?.recurrencePolicy;
                const policyId = item.recurrenceInfo?.recurrencePolicy?.id;
                const intervalLabel = policyId
                  ? policyMap.get(policyId) || 'Subscribe & Save'
                  : 'Subscribe & Save';

                return (
                  <div key={item.id} className="flex gap-3">
                    {image && (
                      <div className="bg-cream-dark relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-sm">
                        <Image src={image} alt={name} fill className="object-cover" sizes="64px" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={localePath(
                          `/${item.productSlug?.['en-US'] || item.productKey || item.productId}/p/${item.variant?.sku || item.productId}`
                        )}
                        onClick={() => setShowMiniCart(false)}
                        className="text-charcoal hover:text-terra line-clamp-2 text-sm font-medium"
                      >
                        {name}
                      </Link>
                      {isSubscription && (
                        <span className="text-sage mt-0.5 inline-block text-xs font-medium">
                          ♻ {intervalLabel}
                        </span>
                      )}
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-charcoal text-sm">
                          {item.quantity > 1 && (
                            <span className="text-charcoal-light mr-1">{item.quantity}×</span>
                          )}
                          {price}
                        </span>
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={isUpdating === item.id}
                          className="text-charcoal-light text-xs transition-colors hover:text-red-500"
                          aria-label={t('removeItem')}
                        >
                          {t('remove')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart && cart.lineItems.length > 0 && (
          <MiniCartFooter
            cart={cart}
            country={country}
            localePath={localePath}
            onClose={() => setShowMiniCart(false)}
          />
        )}
      </div>
    </>
  );
}
