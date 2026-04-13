'use client';

import { useAccount } from '@/hooks/useAccount';

export interface LoyaltyData {
  loyaltyPoints: number | null;
  loyaltyTier: string | null;
}

// Reads loyalty fields from the account profile — no extra API call needed because
// /api/account/profile already returns the full CT customer including custom.fields.
export function useLoyalty() {
  const { data: user, isLoading } = useAccount();

  const data: LoyaltyData | undefined =
    user !== undefined && user !== null
      ? { loyaltyTier: user.loyaltyTier ?? null, loyaltyPoints: user.loyaltyPoints ?? null }
      : undefined;

  return { data, isLoading };
}
