'use client';

import useSWR from 'swr';
import { KEY_ACCOUNT } from '@/lib/cache-keys';

export interface AccountProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  version?: number;
}

async function accountFetcher(): Promise<AccountProfile | null> {
  const res = await fetch('/api/account/profile');
  if (!res.ok) return null;
  const data = await res.json();
  return data.customer ?? null;
}

export function useAccount() {
  return useSWR<AccountProfile | null>(KEY_ACCOUNT, accountFetcher, {
    revalidateOnFocus: false,
  });
}
