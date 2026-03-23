'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart, Cart } from '@/context/CartContext';
import { useCartSWR } from '@/hooks/useCartSWR';
import { useLocale } from '@/context/LocaleContext';
import { useFormatters } from '@/hooks/useFormatters';
import { useState } from 'react';
import { useRecurrencePolicies } from '@/hooks/useRecurrencePolicies';
import { Drawer } from '@/components/ui/Drawer';

function MiniCartFooter({ cart, country, onClose }: { cart: Cart; country: string; onClose: () => void }) {
  const { formatMoney } = useFormatters();
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
        href="/checkout"
        onClick={onClose}
        className="block w-full bg-charcoal text-white text-sm font-medium py-3 text-center hover:bg-charcoal/80 transition-colors rounded-sm"
      >
        Checkout
      </Link>
      <Link
        href="/cart"
        onClick={onClose}
        className="block w-full border border-border text-charcoal text-sm font-medium py-2.5 text-center hover:bg-cream transition-colors rounded-sm"
      >
        View Cart
      </Link>
    </div>
  );
}

export default function MiniCart() {
  const { showMiniCart, setShowMiniCart } = useCart();
  const { data: cart, mutate } = useCartSWR();
  const { country } = useLocale();
  const { formatMoney, getLocalizedString } = useFormatters();
  const policyMap = useRecurrencePolicies();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const itemCount = cart?.lineItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleRemove = async (lineItemId: string) => {
    setIsUpdating(lineItemId);
    try {
      const resp = await fetch(`/api/cart/items/${lineItemId}`, { method: 'DELETE' });
      if (resp.ok) {
        const data = await resp.json();
        mutate(data.cart, { revalidate: false });
      }
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
        <p className="text-charcoal-light">Your cart is empty</p>
        <Link
          href="/"
          onClick={() => setShowMiniCart(false)}
          className="text-terra text-sm hover:underline"
        >
          Continue Shopping
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
                  href={`/products/${getLocalizedString(item.productSlug) || item.productKey || item.productId}`}
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
    )
  );

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

      <Drawer
        isOpen={showMiniCart}
        onClose={() => setShowMiniCart(false)}
        title={`Shopping Cart${itemCount > 0 ? ` (${itemCount})` : ''}`}
        footer={cart && cart.lineItems.length > 0 ? (
          <MiniCartFooter cart={cart} country={country} onClose={() => setShowMiniCart(false)} />
        ) : undefined}
      >
        {cartItems}
      </Drawer>
    </>
  );
}
