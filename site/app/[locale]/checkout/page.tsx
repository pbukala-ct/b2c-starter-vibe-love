'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartSWR } from '@/hooks/useCartSWR';
import { useLocale } from '@/context/LocaleContext';

export default function CheckoutIndexPage() {
  const router = useRouter();
  const { data: cart } = useCartSWR();
  const { localePath } = useLocale();

  useEffect(() => {
    if (cart === undefined) return; // still loading

    const hasAddr = !!(cart?.shippingAddress?.streetName && cart?.billingAddress?.streetName);
    const hasMethod = !!cart?.shippingInfo;

    if (hasAddr && hasMethod) {
      router.replace(localePath('/checkout/payment'));
    } else if (hasAddr) {
      router.replace(localePath('/checkout/shipping'));
    } else {
      router.replace(localePath('/checkout/addresses'));
    }
  }, [cart]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
