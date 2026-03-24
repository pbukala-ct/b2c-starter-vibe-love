'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
  cart: Cart | null;
  isLoading: boolean;
  showMiniCart: boolean;
  setCart: (cart: Cart | null) => void;
  setShowMiniCart: (show: boolean) => void;
  itemCount: number;
  addToCartAndShow: (cart: Cart) => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cart: null,
  isLoading: false,
  showMiniCart: false,
  setCart: () => {},
  setShowMiniCart: () => {},
  itemCount: 0,
  addToCartAndShow: () => {},
  refreshCart: async () => {},
});

export function CartProvider({
  initialCart,
  children,
}: {
  initialCart: Cart | null;
  children: ReactNode;
}) {
  const [cart, setCart] = useState<Cart | null>(initialCart);
  const [isLoading, setIsLoading] = useState(false);
  const [showMiniCart, setShowMiniCart] = useState(false);

  const itemCount = cart?.lineItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const addToCartAndShow = useCallback((newCart: Cart) => {
    setCart(newCart);
    setShowMiniCart(true);
    setTimeout(() => setShowMiniCart(false), 4000);
  }, []);

  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/cart');
      if (resp.ok) {
        const data = await resp.json();
        setCart(data.cart);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        showMiniCart,
        setCart,
        setShowMiniCart,
        itemCount,
        addToCartAndShow,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
