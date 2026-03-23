'use client';

import useSWR, { useSWRConfig } from 'swr';
import { KEY_CART } from '@/lib/cache-keys';
import type { Cart } from '@/context/CartContext';

async function cartFetcher(): Promise<Cart | null> {
  const res = await fetch('/api/cart');
  if (!res.ok) return null;
  const data = await res.json();
  return data.cart ?? null;
}

export function useCartSWR(fallback?: Cart | null) {
  return useSWR<Cart | null>(KEY_CART, cartFetcher, {
    fallbackData: fallback ?? undefined,
    revalidateOnFocus: true,
  });
}

export function useCartMutations() {
  const { mutate } = useSWRConfig();

  async function updateLineItem(lineItemId: string, quantity: number) {
    const resp = await fetch(`/api/cart/items/${lineItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    if (!resp.ok) throw new Error('Failed to update cart item');
    const data = await resp.json();
    mutate(KEY_CART, data.cart, { revalidate: false });
  }

  async function removeLineItem(lineItemId: string) {
    const resp = await fetch(`/api/cart/items/${lineItemId}`, { method: 'DELETE' });
    if (!resp.ok) throw new Error('Failed to remove cart item');
    const data = await resp.json();
    mutate(KEY_CART, data.cart, { revalidate: false });
  }

  async function applyDiscount(code: string) {
    const resp = await fetch('/api/cart/discount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Invalid discount code');
    mutate(KEY_CART, data.cart, { revalidate: false });
  }

  async function removeDiscount(discountCodeId: string) {
    const resp = await fetch('/api/cart/discount', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discountCodeId }),
    });
    if (!resp.ok) throw new Error('Failed to remove discount');
    const data = await resp.json();
    mutate(KEY_CART, data.cart, { revalidate: false });
  }

  return { updateLineItem, removeLineItem, applyDiscount, removeDiscount };
}
