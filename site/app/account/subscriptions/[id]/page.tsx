'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscriptions';
import { useFormatters } from '@/hooks/useFormatters';

const STATE_COLORS: Record<string, string> = {
  Active: 'bg-sage/10 text-sage border-sage/20',
  Paused: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const SCHEDULES = [
  { label: 'Monthly',   schedule: { type: 'standard', value: 1, intervalUnit: 'months' } },
  { label: 'Bi-weekly', schedule: { type: 'standard', value: 2, intervalUnit: 'weeks' } },
  { label: 'Weekly',    schedule: { type: 'standard', value: 1, intervalUnit: 'weeks' } },
];

function scheduleLabel(schedule: { type: string; value: number; intervalUnit: string }) {
  const unit = schedule.intervalUnit?.toLowerCase();
  if (unit === 'weeks' && schedule.value === 1) return 'Weekly';
  if (unit === 'weeks' && schedule.value === 2) return 'Bi-weekly';
  if (unit === 'months' && schedule.value === 1) return 'Monthly';
  return `Every ${schedule.value} ${unit}`;
}

export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: sub, mutate, isLoading } = useSubscription(id);
  const { formatMoney, getLocalizedString, formatDate } = useFormatters();
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function doAction(action: string, extra: Record<string, unknown> = {}) {
    setActionError(null);
    setActionLoading(action);
    try {
      const res = await fetch(`/api/account/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      await mutate();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(null);
      setConfirmCancel(false);
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse text-charcoal-light py-8">Loading subscription…</div>
    );
  }

  if (!sub) {
    return (
      <div className="py-8">
        <p className="text-charcoal-light mb-4">Subscription not found.</p>
        <Link href="/account/subscriptions" className="text-terra text-sm hover:underline">
          ← Back to subscriptions
        </Link>
      </div>
    );
  }

  const state = sub.recurringOrderState;
  const nextDate = sub.nextOrderDate || sub.nextOrderAt;
  const canPause = state === 'Active';
  const canResume = state === 'Paused';
  const canCancel = state === 'Active' || state === 'Paused';
  const canSkip = state === 'Active' || state === 'Paused';

  const total = sub.lineItems?.reduce(
    (sum, item) => sum + (item.totalPrice?.centAmount || 0),
    0
  ) ?? 0;
  const currencyCode = sub.lineItems?.[0]?.totalPrice?.currencyCode || undefined;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-charcoal-light hover:text-charcoal transition-colors text-sm"
        >
          ←
        </button>
        <h1 className="text-2xl font-semibold text-charcoal">Subscription Detail</h1>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-4">
          {actionError}
        </div>
      )}

      <div className="bg-white border border-border rounded-sm p-6 space-y-5">
        {/* Status + ID */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-charcoal-light mb-1">Subscription ID</p>
            <p className="text-sm font-mono text-charcoal">{sub.id.slice(0, 8)}…</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATE_COLORS[state] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {state}
          </span>
        </div>

        {/* Schedule */}
        {sub.schedule && (
          <div>
            <p className="text-xs text-charcoal-light mb-1">Delivery frequency</p>
            <p className="text-sm font-medium text-charcoal">{scheduleLabel(sub.schedule)}</p>
          </div>
        )}

        {/* Next order date */}
        {nextDate && state !== 'Cancelled' && (
          <div>
            <p className="text-xs text-charcoal-light mb-1">Next order</p>
            <p className="text-sm text-charcoal">{formatDate(nextDate)}</p>
          </div>
        )}

        {/* Skip info */}
        {sub.skipConfiguration && sub.skipConfiguration.totalToSkip > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-sm px-3 py-2 text-xs text-yellow-700">
            Skipping {sub.skipConfiguration.totalToSkip} order{sub.skipConfiguration.totalToSkip > 1 ? 's' : ''}
          </div>
        )}

        {/* Line items */}
        {sub.lineItems && sub.lineItems.length > 0 && (
          <div>
            <p className="text-xs text-charcoal-light mb-2">Items</p>
            <div className="space-y-2">
              {sub.lineItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-charcoal">{getLocalizedString(item.name)} × {item.quantity}</span>
                  <span className="text-charcoal font-medium">
                    {formatMoney(item.totalPrice?.centAmount ?? 0, item.totalPrice?.currencyCode)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-3 pt-3 flex justify-between text-sm font-semibold text-charcoal">
              <span>Total per order</span>
              <span>{formatMoney(total, currencyCode)}</span>
            </div>
          </div>
        )}

        {/* Change schedule */}
        {canPause && (
          <div>
            <p className="text-xs text-charcoal-light mb-2">Change frequency</p>
            <div className="flex flex-wrap gap-2">
              {SCHEDULES.map((s) => {
                const isCurrent = sub.schedule &&
                  sub.schedule.value === s.schedule.value &&
                  sub.schedule.intervalUnit === s.schedule.intervalUnit;
                return (
                  <button
                    key={s.label}
                    onClick={() => doAction('setSchedule', { schedule: s.schedule })}
                    disabled={!!actionLoading || isCurrent}
                    className={`px-3 py-1.5 text-xs rounded-sm border transition-colors ${
                      isCurrent
                        ? 'bg-charcoal text-white border-charcoal cursor-default'
                        : 'border-border text-charcoal-light hover:border-charcoal hover:text-charcoal disabled:opacity-50'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
          {canPause && (
            <button
              onClick={() => doAction('pause')}
              disabled={!!actionLoading}
              className="px-4 py-2 text-sm border border-border rounded-sm text-charcoal hover:bg-cream transition-colors disabled:opacity-50"
            >
              {actionLoading === 'pause' ? 'Pausing…' : 'Pause'}
            </button>
          )}
          {canResume && (
            <button
              onClick={() => doAction('resume')}
              disabled={!!actionLoading}
              className="px-4 py-2 text-sm bg-charcoal text-white rounded-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'resume' ? 'Resuming…' : 'Resume'}
            </button>
          )}
          {canSkip && (
            <button
              onClick={() => doAction('skip', { totalToSkip: (sub.skipConfiguration?.totalToSkip || 0) + 1 })}
              disabled={!!actionLoading}
              className="px-4 py-2 text-sm border border-border rounded-sm text-charcoal hover:bg-cream transition-colors disabled:opacity-50"
            >
              {actionLoading === 'skip' ? 'Skipping…' : 'Skip Next Order'}
            </button>
          )}
          {canCancel && !confirmCancel && (
            <button
              onClick={() => setConfirmCancel(true)}
              disabled={!!actionLoading}
              className="px-4 py-2 text-sm text-red-600 hover:underline transition-colors disabled:opacity-50"
            >
              Cancel Subscription
            </button>
          )}
          {confirmCancel && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-charcoal-light">Are you sure?</span>
              <button
                onClick={() => doAction('cancel')}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'cancel' ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="px-4 py-2 text-sm border border-border rounded-sm text-charcoal hover:bg-cream transition-colors"
              >
                Keep
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Link href="/account/subscriptions" className="text-terra text-sm hover:underline">
          ← Back to all subscriptions
        </Link>
      </div>
    </div>
  );
}
