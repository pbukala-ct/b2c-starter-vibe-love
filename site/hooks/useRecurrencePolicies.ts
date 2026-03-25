'use client';

import useSWR from 'swr';
import { KEY_RECURRENCE_POLICIES } from '@/lib/cache-keys';
import { getLocalizedString } from '@/lib/utils';

interface RecurrencePolicy {
  id: string;
  key: string;
  name: Record<string, string>;
  description?: Record<string, string>;
  schedule: { type: string; value: number; intervalUnit: string };
}

function formatInterval(schedule: { intervalUnit: string; value: number }) {
  const unit = schedule.intervalUnit.toLowerCase();
  const v = schedule.value;
  if (unit === 'month' || unit === 'months') return v === 1 ? 'Monthly' : `Every ${v} months`;
  if (unit === 'week' || unit === 'weeks') return v === 1 ? 'Weekly' : `Every ${v} weeks`;
  if (unit === 'day' || unit === 'days') return v === 1 ? 'Daily' : `Every ${v} days`;
  return `Every ${v} ${unit}s`;
}

async function policiesFetcher() {
  const res = await fetch('/api/recurrence-policies');
  if (!res.ok) return { policies: [], policyMap: new Map<string, string>() };
  const data = await res.json();
  const policies: RecurrencePolicy[] = data.policies || [];
  const policyMap = new Map<string, string>();
  for (const p of policies) {
    const label = p.schedule ? formatInterval(p.schedule) : getLocalizedString(p.name) || p.key;
    policyMap.set(p.id, label);
  }
  return { policies, policyMap };
}

/** Returns a Map<policyId, humanLabel> — used in MiniCart and CartItem */
export function useRecurrencePolicies(): Map<string, string> {
  const { data } = useSWR(KEY_RECURRENCE_POLICIES, policiesFetcher, {
    revalidateOnFocus: false,
  });
  return data?.policyMap ?? new Map();
}

/** Returns the full policy objects array — used in SubscribeAndSave */
export function useRecurrencePoliciesList(): RecurrencePolicy[] {
  const { data } = useSWR(KEY_RECURRENCE_POLICIES, policiesFetcher, {
    revalidateOnFocus: false,
  });
  return data?.policies ?? [];
}
