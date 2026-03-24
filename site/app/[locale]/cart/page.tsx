'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';
import { formatMoney, getLocalizedString } from '@/lib/utils';
import CartItem from '@/components/cart/CartItem';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function CartPage() {
  const { cart, setCart, isLoading, refreshCart } = useCart();
  const { locale, currency, country, localePath } = useLocale();
  const t = useTranslations('cart');

  useEffect(() => {
    refreshCart();
  }, []);

  const handleUpdate = async (itemId: string, quantity: number) => {
    const resp = await fetch(`/api/cart/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    if (resp.ok) {
      const data = await resp.json();
      setCart(data.cart);
    }
  };

  const handleRemove = async (itemId: string) => {
    const resp = await fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' });
    if (resp.ok) {
      const data = await resp.json();
      setCart(data.cart);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-16 text-center">
        <div className="animate-pulse text-charcoal-light">{t('loading')}</div>
      </div>
    );
  }

  if (!cart || cart.lineItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-16 text-center">
        <svg className="w-16 h-16 text-border mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h1 className="text-2xl font-semibold text-charcoal mb-3">{t('empty')}</h1>
        <p className="text-charcoal-light mb-6">{t('emptyDescription')}</p>
        <Link href={localePath('/')} className="bg-charcoal text-white px-6 py-3 text-sm font-medium hover:bg-charcoal/80 transition-colors rounded-sm inline-block">
          {t('continueShopping')}
        </Link>
      </div>
    );
  }

  const hasSubscriptions = cart.lineItems.some((item) => item.recurrenceInfo?.recurrencePolicy);
  const taxAmount = cart.taxedPrice
    ? cart.taxedPrice.totalGross.centAmount - cart.taxedPrice.totalNet.centAmount
    : country === 'US' ? Math.round(cart.totalPrice.centAmount * 0.1) : 0;
  const taxIsEstimate = !cart.taxedPrice && taxAmount > 0;
  const estimatedTotal = cart.totalPrice.centAmount + (taxIsEstimate ? taxAmount : 0);

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-charcoal mb-8">{t('title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2">
          {cart.lineItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {/* Order summary */}
        <div>
          <div className="bg-cream p-6 rounded-sm sticky top-24">
            <h2 className="font-semibold text-charcoal text-lg mb-4">{t('orderSummary')}</h2>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-charcoal-light">{t('subtotalWithCount', { count: cart.lineItems.reduce((s, i) => s + i.quantity, 0) })}</span>
                <span>{formatMoney(cart.totalPrice.centAmount, cart.totalPrice.currencyCode)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-charcoal-light">{taxIsEstimate ? t('estimatedTax') : t('tax')}</span>
                  <span>{formatMoney(taxAmount, cart.totalPrice.currencyCode)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-charcoal-light">{t('shipping')}</span>
                <span className="text-sage text-xs font-medium">{t('shippingCalculated')}</span>
              </div>
            </div>

            <div className="border-t border-border pt-4 flex justify-between font-semibold text-charcoal mb-5">
              <span>{t('estimatedTotal')}</span>
              <span>{formatMoney(estimatedTotal, cart.totalPrice.currencyCode)}</span>
            </div>

            {hasSubscriptions && (
              <div className="bg-sage/10 border border-sage/20 rounded-sm p-3 mb-4">
                <p className="text-xs text-charcoal">
                  {t('subscriptionNotice')}
                </p>
              </div>
            )}

            <Link
              href={localePath('/checkout')}
              className="block w-full bg-charcoal text-white text-sm font-medium py-3.5 text-center hover:bg-charcoal/80 transition-colors rounded-sm"
            >
              {t('checkout')}
            </Link>
            <Link
              href={localePath('/')}
              className="block w-full text-center text-sm text-charcoal-light hover:text-terra mt-3 transition-colors"
            >
              {t('continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
