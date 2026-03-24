'use client';
import { useState, useEffect } from 'react';

function formatInterval(schedule: { intervalUnit: string; value: number }) {
  const unit = schedule.intervalUnit.toLowerCase();
  const v = schedule.value;
  if (unit === 'month') return v === 1 ? 'Monthly' : `Every ${v} months`;
  if (unit === 'week') return v === 1 ? 'Weekly' : `Every ${v} weeks`;
  if (unit === 'day') return v === 1 ? 'Daily' : `Every ${v} days`;
  return `Every ${v} ${unit}s`;
}

let cache: Map<string, string> | null = null;

export function useRecurrencePolicies(): Map<string, string> {
  const [policyMap, setPolicyMap] = useState<Map<string, string>>(cache || new Map());

  useEffect(() => {
    if (cache) return;
    fetch('/api/recurrence-policies')
      .then((r) => r.json())
      .then((data) => {
        const map = new Map<string, string>();
        for (const policy of data.policies || []) {
          let label = '';
          if (policy.schedule) {
            label = formatInterval(policy.schedule);
          } else if (policy.name?.['en-US']) {
            label = policy.name['en-US'];
          }
          map.set(policy.id, label);
        }
        cache = map;
        setPolicyMap(map);
      })
      .catch(() => {});
  }, []);

  return policyMap;
}
