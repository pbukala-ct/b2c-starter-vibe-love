'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { mutate as swrMutate } from 'swr';
import { KEY_CART } from '@/lib/cache-keys';

export interface CartLineItem {
  id: string;
  productId: string;
  productKey?: string;
  name: Record<string, string>;
  variant: {
    id: number;
    sku?: string;
    images?: Array<{ url: string }>;
    prices?: Array<{ value: { centAmount: number; currencyCode: string } }>;
  };
  price: { value: { centAmount: number; currencyCode: string } };
  totalPrice: { centAmount: number; currencyCode: string };
  quantity: number;
  recurrenceInfo?: {
    recurrencePolicy: { typeId: string; id: string };
  };
  productSlug?: Record<string, string>;
}

export interface Cart {
  id: string;
  version: number;
  lineItems: CartLineItem[];
  totalPrice: { centAmount: number; currencyCode: string };
  taxedPrice?: {
    totalGross: { centAmount: number; currencyCode: string };
    totalNet: { centAmount: number; currencyCode: string };
  };
  shippingMode?: string;
  shipping?: unknown[];
  itemShippingAddresses?: unknown[];
  customerId?: string;
}

interface CartContextType {
  showMiniCart: boolean;
  setShowMiniCart: (show: boolean) => void;
  addToCartAndShow: (cart: Cart) => void;
}

const CartContext = createContext<CartContextType>({
  showMiniCart: false,
  setShowMiniCart: () => {},
  addToCartAndShow: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [showMiniCart, setShowMiniCart] = useState(false);

  const addToCartAndShow = useCallback((newCart: Cart) => {
    swrMutate(KEY_CART, newCart, { revalidate: false });
    setShowMiniCart(true);
    setTimeout(() => setShowMiniCart(false), 4000);
  }, []);

  return (
    <CartContext.Provider value={{ showMiniCart, setShowMiniCart, addToCartAndShow }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
