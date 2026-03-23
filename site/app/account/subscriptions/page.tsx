'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFormatters } from '@/hooks/useFormatters';

interface RecurringOrder {
  id: string;
  key?: string;
  recurringOrderState: string;
  schedule: { type: string; value: number; intervalUnit: string };
  nextOrderDate?: string;
  skipConfiguration?: { totalToSkip: number; skipped: number; lastSkippedAt?: string };
  lineItems: {
    id: string;
    name: Record<string, string>;
    quantity: number;
    totalPrice: { centAmount: number; currencyCode: string };
  }[];
}

const STATE_LABELS: Record<string, string> = {
  Active: 'Active',
  Paused: 'Paused',
  Cancelled: 'Cancelled',
};

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

function isCurrentSchedule(sub: RecurringOrder, s: typeof SCHEDULES[0]) {
  return sub.schedule.value === s.schedule.value && sub.schedule.intervalUnit === s.schedule.intervalUnit;
}

export default function SubscriptionsPage() {
  const { formatMoney, getLocalizedString, formatDate } = useFormatters();
  const [subscriptions, setSubscriptions] = useState<RecurringOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function fetchSubscriptions() {
    try {
      const res = await fetch('/api/account/subscriptions');
      const data = await res.json();
      setSubscriptions(data.results || []);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAction(id: string, action: string, payload?: Record<string, unknown>) {
    setActionLoading(id + action);
    setActionError(null);
    try {
      const res = await fetch(`/api/account/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      if (res.ok) {
        await fetchSubscriptions();
      } else {
        const d = await res.json().catch(() => ({}));
        setActionError(d.error || `Failed to ${action} subscription`);
      }
    } catch {
      setActionError(`Failed to ${action} subscription`);
    } finally {
      setActionLoading(null);
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-charcoal mb-6">Subscriptions</h1>
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-36 bg-cream-dark rounded-sm animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-charcoal mb-6">Subscriptions</h1>

      {actionError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm">
          {actionError}
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="bg-white border border-border rounded-sm p-12 text-center">
          <p className="text-charcoal-light mb-2">You don&apos;t have any active subscriptions.</p>
          <p className="text-sm text-charcoal-light mb-6">
            Subscribe to eligible products and save up to 20% on every order.
          </p>
          <Link href="/products/ben-pillow-cover" className="bg-sage text-white px-6 py-2.5 text-sm font-medium hover:bg-sage/90 transition-colors rounded-sm inline-block">
            Shop Subscribe &amp; Save
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map(sub => {
            const isActive = sub.recurringOrderState === 'Active';
            const isPaused = sub.recurringOrderState === 'Paused';
            const isCancelled = sub.recurringOrderState === 'Cancelled';
            const lineItems: typeof sub.lineItems = sub.lineItems ?? [];
            const total = lineItems.reduce((sum, i) => sum + i.totalPrice.centAmount, 0);
            const currency = lineItems[0]?.totalPrice.currencyCode || 'USD';

            const skipCfg = sub.skipConfiguration;
            const pendingSkips = skipCfg ? skipCfg.totalToSkip - skipCfg.skipped : 0;

            return (
              <div key={sub.id} className="bg-white border border-border rounded-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs border px-2 py-0.5 rounded-full ${STATE_COLORS[sub.recurringOrderState] || 'bg-cream text-charcoal-light border-border'}`}>
                        {STATE_LABELS[sub.recurringOrderState] || sub.recurringOrderState}
                      </span>
                      <span className="text-xs text-charcoal-light">{scheduleLabel(sub.schedule)}</span>
                      {pendingSkips > 0 && (
                        <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">
                          Skipping {pendingSkips} order{pendingSkips > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {sub.nextOrderDate && !isCancelled && (
                      <p className="text-xs text-charcoal-light">
                        Next order: {formatDate(sub.nextOrderDate)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-semibold text-charcoal text-sm">{formatMoney(total, currency)}</p>
                    <Link href={`/account/subscriptions/${sub.id}`} className="text-xs text-terra hover:underline">
                      View details →
                    </Link>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  {lineItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-charcoal-light">
                        {getLocalizedString(item.name)} × {item.quantity}
                      </span>
                      <span className="text-charcoal">{formatMoney(item.totalPrice.centAmount, item.totalPrice.currencyCode)}</span>
                    </div>
                  ))}
                </div>

                {!isCancelled && (
                  <div className="pt-3 border-t border-border space-y-3">
                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      {isActive && (
                        <button
                          onClick={() => handleAction(sub.id, 'pause')}
                          disabled={actionLoading === sub.id + 'pause'}
                          className="text-xs border border-border text-charcoal-light hover:text-charcoal hover:border-charcoal px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50"
                        >
                          {actionLoading === sub.id + 'pause' ? 'Pausing…' : 'Pause'}
                        </button>
                      )}
                      {isPaused && (
                        <button
                          onClick={() => handleAction(sub.id, 'resume')}
                          disabled={actionLoading === sub.id + 'resume'}
                          className="text-xs border border-sage text-sage hover:bg-sage/10 px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50"
                        >
                          {actionLoading === sub.id + 'resume' ? 'Resuming…' : 'Resume'}
                        </button>
                      )}
                      {isActive && (
                        <button
                          onClick={() => {
                            const currentPending = skipCfg ? skipCfg.totalToSkip - skipCfg.skipped : 0;
                            const newTotal = (skipCfg?.totalToSkip ?? 0) + 1;
                            handleAction(sub.id, 'skip', { totalToSkip: currentPending > 0 ? newTotal : 1 });
                          }}
                          disabled={actionLoading === sub.id + 'skip'}
                          className="text-xs border border-border text-charcoal-light hover:text-charcoal hover:border-charcoal px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50"
                        >
                          {actionLoading === sub.id + 'skip' ? 'Skipping…' : 'Skip next order'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this subscription?')) {
                            handleAction(sub.id, 'cancel');
                          }
                        }}
                        disabled={actionLoading === sub.id + 'cancel'}
                        className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50"
                      >
                        {actionLoading === sub.id + 'cancel' ? 'Cancelling…' : 'Cancel subscription'}
                      </button>
                    </div>

                    {/* Schedule pills */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-charcoal-light">Change schedule:</span>
                      {SCHEDULES.map(s => {
                        const isCurrent = isCurrentSchedule(sub, s);
                        const loadKey = sub.id + 'setSchedule' + s.label;
                        return (
                          <button
                            key={s.label}
                            onClick={() => !isCurrent && handleAction(sub.id, 'setSchedule', { schedule: s.schedule })}
                            disabled={isCurrent || actionLoading === loadKey}
                            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                              isCurrent
                                ? 'bg-charcoal text-white border-charcoal cursor-default'
                                : 'bg-white text-charcoal-light border-border hover:border-charcoal hover:text-charcoal'
                            } disabled:opacity-60`}
                          >
                            {actionLoading === loadKey ? '…' : s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
