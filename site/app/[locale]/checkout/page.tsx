'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useCartSWR } from '@/hooks/useCartSWR';

export default function CheckoutIndexPage() {
  const router = useRouter();
  const { data: cart } = useCartSWR();

  useEffect(() => {
    if (cart === undefined) return; // still loading

    const hasAddr = !!(cart?.shippingAddress?.streetName && cart?.billingAddress?.streetName);
    const hasMethod = !!cart?.shippingInfo;

    if (hasAddr && hasMethod) {
      router.replace('/checkout/payment');
    } else if (hasAddr) {
      router.replace('/checkout/shipping');
    } else {
      router.replace('/checkout/addresses');
    }
  }, [cart]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
