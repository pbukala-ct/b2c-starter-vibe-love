'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import Button from '@/components/ui/Button';

interface AddToCartButtonProps {
  productId: string;
  variantId: number;
  label?: string;
}

export default function AddToCartButton({ productId, variantId, label = 'Add to Cart' }: AddToCartButtonProps) {
  const { addToCartAndShow } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleClick = async () => {
    setAdding(true);
    try {
      const resp = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, variantId, quantity: 1 }),
      });
      if (resp.ok) {
        const data = await resp.json();
        addToCartAndShow(data.cart);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      onClick={handleClick}
      isLoading={adding}
    >
      {added ? '✓ Added to Cart' : label}
    </Button>
  );
}
