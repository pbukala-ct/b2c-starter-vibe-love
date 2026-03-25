'use client';

import useSWR from 'swr';
import { useLocale } from '@/context/LocaleContext';
import { keyShippingMethods } from '@/lib/cache-keys';

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  price: { centAmount: number; currencyCode: string } | null;
  freeAbove: { centAmount: number } | null;
}

async function shippingMethodsFetcher([, country, currency]: [string, string, string]): Promise<
  ShippingMethod[]
> {
  const res = await fetch(`/api/shipping-methods?country=${country}&currency=${currency}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.shippingMethods ?? [];
}

export function useShippingMethods() {
  const { country, currency } = useLocale();
  const key: [string, string, string] | null =
    country && currency ? [keyShippingMethods(country, currency), country, currency] : null;
  return useSWR<ShippingMethod[]>(key, shippingMethodsFetcher, { revalidateOnFocus: false });
}
