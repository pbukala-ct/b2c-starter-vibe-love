'use client';

import useSWR, { useSWRConfig } from 'swr';
import { KEY_WISHLIST } from '@/lib/cache-keys';

export interface WishlistItem {
  id: string;
  productId?: string;
  name: Record<string, string>;
  quantity: number;
  productSlug?: Record<string, string>;
  variant: {
    id: number;
    sku: string;
    images?: Array<{ url: string }>;
    price?: { value: { centAmount: number; currencyCode: string } };
  };
}

export interface Wishlist {
  id: string;
  version: number;
  items: WishlistItem[];
}

async function wishlistFetcher(): Promise<Wishlist | null> {
  const res = await fetch('/api/account/wishlist');
  if (!res.ok) return null;
  return res.json();
}

export function useWishlist() {
  return useSWR<Wishlist | null>(KEY_WISHLIST, wishlistFetcher, { revalidateOnFocus: false });
}

export function useWishlistMutations() {
  const { mutate } = useSWRConfig();

  async function addItem(sku: string, quantity = 1) {
    const res = await fetch('/api/account/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, quantity }),
    });
    if (!res.ok) throw new Error('Failed to add to wishlist');
    const updated = await res.json();
    mutate(KEY_WISHLIST, updated, { revalidate: false });
  }

  async function removeItem(itemId: string) {
    const res = await fetch(`/api/account/wishlist/items/${itemId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to remove from wishlist');
    const updated = await res.json();
    mutate(KEY_WISHLIST, updated, { revalidate: false });
  }

  async function updateItem(itemId: string, quantity: number) {
    const res = await fetch(`/api/account/wishlist/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) throw new Error('Failed to update wishlist item');
    const updated = await res.json();
    mutate(KEY_WISHLIST, updated, { revalidate: false });
  }

  return { addItem, removeItem, updateItem };
}
