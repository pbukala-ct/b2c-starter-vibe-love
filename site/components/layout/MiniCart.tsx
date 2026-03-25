'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart, Cart } from '@/context/CartContext';
import { useCartSWR, useCartMutations } from '@/hooks/useCartSWR';
import { useLocale } from '@/context/LocaleContext';
import { useFormatters } from '@/hooks/useFormatters';
import { useState } from 'react';
import { useRecurrencePolicies } from '@/hooks/useRecurrencePolicies';
import { useTranslations } from 'next-intl';
import { Drawer } from '@/components/ui/Drawer';

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
  const { formatMoney } = useFormatters();
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
  const { showMiniCart, setShowMiniCart } = useCart();
  const { data: cart } = useCartSWR();
  const { removeLineItem } = useCartMutations();
  const { country, localePath } = useLocale();
  const { formatMoney, getLocalizedString } = useFormatters();
  const policyMap = useRecurrencePolicies();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const t = useTranslations('miniCart');

  const itemCount = cart?.lineItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleRemove = async (lineItemId: string) => {
    setIsUpdating(lineItemId);
    try {
      await removeLineItem(lineItemId);
    } finally {
      setIsUpdating(null);
    }
  };

  const cartItems = (
    !cart || cart.lineItems.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
        <svg className="w-12 h-12 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
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
          const name = getLocalizedString(item.name);
          const image = item.variant?.images?.[0]?.url;
          const price = formatMoney(item.price?.value?.centAmount || 0, item.price?.value?.currencyCode);
          const isSubscription = !!item.recurrenceInfo?.recurrencePolicy;
          const policyId = item.recurrenceInfo?.recurrencePolicy?.id;
          const intervalLabel = policyId ? (policyMap.get(policyId) || 'Subscribe & Save') : 'Subscribe & Save';

          return (
            <div key={item.id} className="flex gap-3">
              {image && (
                <div className="w-16 h-16 relative flex-shrink-0 bg-cream-dark rounded-sm overflow-hidden">
                  <Image src={image} alt={name} fill className="object-cover" sizes="64px" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link
                  href={localePath(`/${getLocalizedString(item.productSlug) || item.productKey || item.productId}/p/${item.variant?.sku || item.productId}`)}
                  onClick={() => setShowMiniCart(false)}
                  className="text-sm font-medium text-charcoal hover:text-terra line-clamp-2"
                >
                  {name}
                </Link>
                {isSubscription && (
                  <span className="inline-block text-xs text-sage font-medium mt-0.5">
                    ♻ {intervalLabel}
                  </span>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-charcoal">
                    {item.quantity > 1 && <span className="text-charcoal-light mr-1">{item.quantity}×</span>}
                    {price}
                  </span>
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={isUpdating === item.id}
                    className="text-charcoal-light hover:text-red-500 transition-colors text-xs"
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
    )
  );

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

      <Drawer
        isOpen={showMiniCart}
        onClose={() => setShowMiniCart(false)}
        title={`${t('title')}${itemCount > 0 ? ` (${itemCount})` : ''}`}
        footer={cart && cart.lineItems.length > 0 ? (
          <MiniCartFooter cart={cart} country={country} localePath={localePath} onClose={() => setShowMiniCart(false)} />
        ) : undefined}
      >
        {cartItems}
      </Drawer>
    </>
  );
}
