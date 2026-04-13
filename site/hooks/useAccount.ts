'use client';

import useSWR from 'swr';
import { KEY_ACCOUNT } from '@/lib/cache-keys';

export interface AccountProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  version?: number;
  loyaltyTier?: string | null;
  loyaltyPoints?: number | null;
}

async function accountFetcher(): Promise<AccountProfile | null> {
  const res = await fetch('/api/account/profile');
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.customer) return null;
  const c = data.customer;
  return {
    id: c.id,
    email: c.email,
    firstName: c.firstName,
    lastName: c.lastName,
    version: c.version,
    loyaltyTier: c.custom?.fields?.loyaltyTier ?? null,
    loyaltyPoints: c.custom?.fields?.loyaltyPoints ?? null,
  };
}

export function useAccount() {
  return useSWR<AccountProfile | null>(KEY_ACCOUNT, accountFetcher, {
    revalidateOnFocus: false,
  });
}
