'use client';

import useSWR from 'swr';
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
