'use client';

import useSWR from 'swr';
import { KEY_ORDERS } from '@/lib/cache-keys';

async function ordersFetcher(): Promise<{ results: unknown[]; total: number }> {
  const res = await fetch('/api/account/orders');
  if (!res.ok) return { results: [], total: 0 };
  return res.json();
}

export function useOrders() {
  return useSWR(KEY_ORDERS, ordersFetcher, {
    revalidateOnFocus: false,
  });
}
