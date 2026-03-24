'use client';

import { useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useWishlist, useWishlistMutations } from '@/hooks/useWishlist';

interface Props {
  productId: string;
  sku: string;
}

export default function AddToWishlistButton({ productId, sku }: Props) {
  const { data: user } = useAccount();
  const { data: wishlist } = useWishlist();
  const { addItem, removeItem } = useWishlistMutations();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const wishlistItem = wishlist?.items.find(i => i.productId === productId);
  const isInWishlist = !!wishlistItem;

  async function handleClick() {
    setLoading(true);
    try {
      if (isInWishlist && wishlistItem) {
        await removeItem(wishlistItem.id);
      } else {
        await addItem(sku, 1);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`flex items-center justify-center w-auto h-auto p-4 border rounded-sm transition-colors disabled:opacity-50 ${
        isInWishlist
          ? 'border-terra bg-terra/5 text-terra'
          : 'border-border bg-white text-charcoal-light hover:border-terra hover:text-terra'
      }`}
    >
      <svg
        className="w-5 h-5"
        fill={isInWishlist ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
