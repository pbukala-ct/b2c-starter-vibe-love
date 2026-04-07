'use client';

import { Link } from '@/i18n/routing';
import { useCartSWR, useCartMutations } from '@/hooks/useCartSWR';
import { useLocale } from '@/context/LocaleContext';
import { formatMoney } from '@/lib/utils';
import CartItem from '@/components/cart/CartItem';
import { useTranslations } from 'next-intl';

export default function CartPage() {
  const { data: cart, isLoading } = useCartSWR();
  const { updateLineItem, removeLineItem } = useCartMutations();
  const { country } = useLocale();
  const t = useTranslations('cart');

  const handleUpdate = async (itemId: string, quantity: number) => {
    await updateLineItem(itemId, quantity);
  };

  const handleRemove = async (itemId: string) => {
    await removeLineItem(itemId);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center lg:px-8">
        <div className="text-charcoal-light animate-pulse">{t('loading')}</div>
      </div>
    );
  }

  if (!cart || cart.lineItems.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center lg:px-8">
        <svg
          className="text-border mx-auto mb-4 h-16 w-16"
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
        <h1 className="text-charcoal mb-3 text-2xl font-semibold">{t('empty')}</h1>
        <p className="text-charcoal-light mb-6">{t('emptyDescription')}</p>
        <Link
          href="/"
          className="bg-charcoal hover:bg-charcoal/80 inline-block rounded-sm px-6 py-3 text-sm font-medium text-white transition-colors"
        >
          {t('continueShopping')}
        </Link>
      </div>
    );
  }

  const hasSubscriptions = cart.lineItems.some((item) => item.recurrenceInfo?.recurrencePolicy);
  const taxAmount = cart.taxedPrice
    ? cart.taxedPrice.totalGross.centAmount - cart.taxedPrice.totalNet.centAmount
    : country === 'US'
      ? Math.round(cart.totalPrice.centAmount * 0.1)
      : 0;
  const taxIsEstimate = !cart.taxedPrice && taxAmount > 0;
  const estimatedTotal = cart.totalPrice.centAmount + (taxIsEstimate ? taxAmount : 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      <h1 className="text-charcoal mb-8 text-2xl font-semibold">{t('title')}</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2">
          {cart.lineItems.map((item) => (
            <CartItem key={item.id} item={item} onUpdate={handleUpdate} onRemove={handleRemove} />
          ))}
        </div>

        {/* Order summary */}
        <div>
          <div className="bg-cream sticky top-24 rounded-sm p-6">
            <h2 className="text-charcoal mb-4 text-lg font-semibold">{t('orderSummary')}</h2>

            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal-light">
                  {t('subtotalWithCount', {
                    count: cart.lineItems.reduce((s, i) => s + i.quantity, 0),
                  })}
                </span>
                <span>{formatMoney(cart.totalPrice.centAmount, cart.totalPrice.currencyCode)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-charcoal-light">
                    {taxIsEstimate ? t('estimatedTax') : t('tax')}
                  </span>
                  <span>{formatMoney(taxAmount, cart.totalPrice.currencyCode)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-charcoal-light">{t('shipping')}</span>
                <span className="text-sage text-xs font-medium">{t('shippingCalculated')}</span>
              </div>
            </div>

            <div className="border-border text-charcoal mb-5 flex justify-between border-t pt-4 font-semibold">
              <span>{t('estimatedTotal')}</span>
              <span>{formatMoney(estimatedTotal, cart.totalPrice.currencyCode)}</span>
            </div>

            {hasSubscriptions && (
              <div className="bg-sage/10 border-sage/20 mb-4 rounded-sm border p-3">
                <p className="text-charcoal text-xs">{t('subscriptionNotice')}</p>
              </div>
            )}

            <Link
              href="/checkout"
              className="bg-charcoal hover:bg-charcoal/80 block w-full rounded-sm py-3.5 text-center text-sm font-medium text-white transition-colors"
            >
              {t('checkout')}
            </Link>
            <Link
              href="/"
              className="text-charcoal-light hover:text-terra mt-3 block w-full text-center text-sm transition-colors"
            >
              {t('continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
