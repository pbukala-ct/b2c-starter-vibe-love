'use client';

import useSWR, { useSWRConfig } from 'swr';
import { KEY_SUBSCRIPTIONS, keySubscription } from '@/lib/cache-keys';

export interface RecurringOrder {
  id: string;
  version: number;
  key?: string;
  recurringOrderState: 'Active' | 'Paused' | 'Cancelled';
  schedule?: { type: string; value: number; intervalUnit: string };
  nextOrderDate?: string;
  nextOrderAt?: string;
  startsAt?: string;
  skipConfiguration?: { totalToSkip: number; skipped: number };
  lineItems?: Array<{
    id: string;
    name: Record<string, string>;
    quantity: number;
    totalPrice: { centAmount: number; currencyCode: string };
  }>;
  originOrder?: { obj?: { lineItems?: unknown[] } };
}

async function subscriptionsFetcher(): Promise<RecurringOrder[]> {
  const res = await fetch('/api/account/subscriptions');
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

export function useSubscriptions() {
  return useSWR<RecurringOrder[]>(KEY_SUBSCRIPTIONS, subscriptionsFetcher, {
    revalidateOnFocus: false,
  });
}

async function subscriptionFetcher(url: string): Promise<RecurringOrder | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.subscription ?? null;
}

export function useSubscription(id: string) {
  return useSWR<RecurringOrder | null>(
    id ? keySubscription(id) : null,
    () => subscriptionFetcher(`/api/account/subscriptions/${id}`),
    { revalidateOnFocus: false }
  );
}

export function useSubscriptionAction() {
  const { mutate } = useSWRConfig();

  async function action(id: string, actionType: string, payload?: Record<string, unknown>) {
    const res = await fetch(`/api/account/subscriptions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionType, ...payload }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || `Failed to ${actionType} subscription`);
    }
    mutate(KEY_SUBSCRIPTIONS);
    mutate(keySubscription(id));
  }

  return { action };
}
