'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart, Cart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';
import { formatMoney, getLocalizedString } from '@/lib/utils';
import { useState } from 'react';
import { useRecurrencePolicies } from '@/hooks/useRecurrencePolicies';

function MiniCartFooter({ cart, country, localePath, onClose }: { cart: Cart; country: string; localePath: (path: string) => string; onClose: () => void }) {
  const taxAmount = cart.taxedPrice
    ? cart.taxedPrice.totalGross.centAmount - cart.taxedPrice.totalNet.centAmount
    : country === 'US' ? Math.round(cart.totalPrice.centAmount * 0.1) : 0;
  const taxIsEstimate = !cart.taxedPrice && taxAmount > 0;
  return (
    <div className="p-5 border-t border-border space-y-3">
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-charcoal-light">Subtotal</span>
          <span className="font-medium">{formatMoney(cart.totalPrice.centAmount, cart.totalPrice.currencyCode)}</span>
        </div>
        {taxAmount > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-charcoal-light">{taxIsEstimate ? 'Est. Tax (10%)' : 'Tax'}</span>
            <span>{formatMoney(taxAmount, cart.totalPrice.currencyCode)}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-charcoal-light">Shipping calculated at checkout</p>
      <Link
        href={localePath('/checkout')}
        onClick={onClose}
        className="block w-full bg-charcoal text-white text-sm font-medium py-3 text-center hover:bg-charcoal/80 transition-colors rounded-sm"
      >
        Checkout
      </Link>
      <Link
        href={localePath('/cart')}
        onClick={onClose}
        className="block w-full border border-border text-charcoal text-sm font-medium py-2.5 text-center hover:bg-cream transition-colors rounded-sm"
      >
        View Cart
      </Link>
    </div>
  );
}

export default function MiniCart() {
  const { cart, showMiniCart, setShowMiniCart, itemCount, setCart } = useCart();
  const { locale, currency, country, localePath } = useLocale();
  const policyMap = useRecurrencePolicies();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

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
        className="relative flex items-center gap-1 text-charcoal hover:text-terra transition-colors"
        aria-label={`Cart (${itemCount} items)`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-terra text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {showMiniCart && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowMiniCart(false)}
        />
      )}

      {/* Flyout panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${showMiniCart ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-charcoal text-lg">
            Shopping Cart{' '}
            {itemCount > 0 && <span className="text-charcoal-light text-sm font-normal">({itemCount})</span>}
          </h2>
          <button
            onClick={() => setShowMiniCart(false)}
            className="text-charcoal-light hover:text-charcoal transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {!cart || cart.lineItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <svg className="w-12 h-12 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-charcoal-light">Your cart is empty</p>
              <Link
                href={localePath('/')}
                onClick={() => setShowMiniCart(false)}
                className="text-terra text-sm hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.lineItems.map((item) => {
                const name = getLocalizedString(item.name, locale);
                const image = item.variant?.images?.[0]?.url;
                const price = formatMoney(item.price?.value?.centAmount || 0, item.price?.value?.currencyCode || currency);
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
                        href={localePath(`/${item.productSlug?.['en-US'] || item.productKey || item.productId}/p/${item.variant?.sku || item.productId}`)}
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
                          aria-label="Remove item"
                        >
                          Remove
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
