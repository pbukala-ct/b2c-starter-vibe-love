'use client';

import useSWR from 'swr';
import { KEY_ORDERS, keyOrder } from '@/lib/cache-keys';

export interface Order {
  id: string;
  version: number;
  orderNumber: string;
  createdAt: string;
  orderState: string;
  shipmentState?: string;
  totalPrice: { centAmount: number; currencyCode: string };
  taxedPrice?: {
    totalNet: { centAmount: number; currencyCode: string };
    totalGross: { centAmount: number; currencyCode: string };
    taxPortions?: Array<{
      name: string;
      amount: { centAmount: number; currencyCode: string };
      rate: number;
    }>;
  };
  shippingInfo?: {
    shippingMethodName: string;
    price: { centAmount: number; currencyCode: string };
  };
  lineItems: Array<{
    id: string;
    name: Record<string, string>;
    quantity: number;
    totalPrice: { centAmount: number; currencyCode: string };
    recurrenceInfo?: { recurrencePolicy: { id: string } };
    shippingDetails?: {
      targets: Array<{ addressKey: string; quantity: number }>;
      valid: boolean;
    };
  }>;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    streetName: string;
    streetNumber?: string;
    additionalAddressInfo?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    streetName: string;
    streetNumber?: string;
    additionalAddressInfo?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  itemShippingAddresses?: Array<{
    key?: string;
    firstName: string;
    lastName: string;
    streetName: string;
    streetNumber?: string;
    additionalAddressInfo?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  }>;
  custom?: {
    fields?: {
      agentId?: string;
      agentEmail?: string;
      agentName?: string;
    };
  };
  returnInfo?: Array<{
    items: Array<{
      id: string;
      lineItemId: string;
      quantity: number;
      shipmentState: string;
      comment?: string;
    }>;
    returnDate?: string;
    returnTrackingId?: string;
  }>;
}

async function ordersFetcher(): Promise<Order[]> {
  const res = await fetch('/api/account/orders');
  if (!res.ok) return [];
  const data = await res.json();
  return data.orders ?? [];
}

export function useOrders() {
  return useSWR<Order[]>(KEY_ORDERS, ordersFetcher, { revalidateOnFocus: false });
}

async function orderFetcher(id: string): Promise<Order | null> {
  const res = await fetch(`/api/account/orders/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export function useOrder(id: string) {
  return useSWR<Order | null>(keyOrder(id), () => orderFetcher(id), { revalidateOnFocus: false });
}
