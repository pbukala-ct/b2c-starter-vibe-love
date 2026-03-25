'use client';

import useSWR, { useSWRConfig } from 'swr';
import { KEY_PAYMENTS } from '@/lib/cache-keys';

export interface StoredCard {
  id: string;
  cardholderName: string;
  last4: string;
  brand: string;
  expiry: string;
  token: string;
  isDefault: boolean;
}

async function paymentsFetcher(): Promise<StoredCard[]> {
  const res = await fetch('/api/account/payments');
  if (!res.ok) return [];
  const data = await res.json();
  return data.cards ?? [];
}

export function usePayments() {
  return useSWR<StoredCard[]>(KEY_PAYMENTS, paymentsFetcher, { revalidateOnFocus: false });
}

export function usePaymentMutations() {
  const { mutate } = useSWRConfig();

  async function addPayment(cardData: Record<string, unknown>) {
    const res = await fetch('/api/account/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || 'Failed to save card');
    mutate(KEY_PAYMENTS, d.cards, { revalidate: false });
  }

  async function deletePayment(cardId: string) {
    const res = await fetch('/api/account/payments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId }),
    });
    if (!res.ok) throw new Error('Failed to remove card');
    const d = await res.json();
    mutate(KEY_PAYMENTS, d.cards, { revalidate: false });
  }

  async function setDefaultPayment(cardId: string) {
    const res = await fetch('/api/account/payments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId }),
    });
    if (!res.ok) throw new Error('Failed to set default payment');
    const d = await res.json();
    mutate(KEY_PAYMENTS, d.cards, { revalidate: false });
  }

  return { addPayment, deletePayment, setDefaultPayment };
}
