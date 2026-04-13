'use client';

import { useLoyalty } from '@/hooks/useLoyalty';

const TIER_COLOURS: Record<string, string> = {
  Bronze: 'bg-amber-100 text-amber-800',
  Silver: 'bg-slate-100 text-slate-700',
  Gold: 'bg-yellow-100 text-yellow-800',
  Platinum: 'bg-purple-100 text-purple-800',
};

function tierColour(tier: string): string {
  return TIER_COLOURS[tier] ?? 'bg-blue-100 text-blue-800';
}

export default function LoyaltyWidget() {
  const { data } = useLoyalty();

  if (!data || (data.loyaltyPoints === null && data.loyaltyTier === null)) {
    return null;
  }

  return (
    <div className="border-border border-t px-5 py-4">
      {data.loyaltyTier !== null && (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tierColour(data.loyaltyTier)}`}
        >
          {data.loyaltyTier}
        </span>
      )}
      {data.loyaltyPoints !== null && (
        <p className="text-charcoal-light mt-1 text-xs">
          {data.loyaltyPoints.toLocaleString()} points
        </p>
      )}
    </div>
  );
}
