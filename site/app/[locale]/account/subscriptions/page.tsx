'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/utils';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from 'next-intl';

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

// STATE_LABELS now use translations, see component

const STATE_COLORS: Record<string, string> = {
  Active: 'bg-sage/10 text-sage border-sage/20',
  Paused: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

function isCurrentSchedule(
  sub: RecurringOrder,
  s: { label: string; schedule: { type: string; value: number; intervalUnit: string } }
) {
  return (
    sub.schedule.value === s.schedule.value && sub.schedule.intervalUnit === s.schedule.intervalUnit
  );
}

export default function SubscriptionsPage() {
  const { localePath } = useLocale();
  const t = useTranslations('subscriptions');
  const [subscriptions, setSubscriptions] = useState<RecurringOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const STATE_LABELS: Record<string, string> = {
    Active: t('stateActive'),
    Paused: t('statePaused'),
    Cancelled: t('stateCancelled'),
  };

  const SCHEDULES = [
    {
      label: t('scheduleMonthly'),
      schedule: { type: 'standard', value: 1, intervalUnit: 'months' },
    },
    {
      label: t('scheduleBiWeekly'),
      schedule: { type: 'standard', value: 2, intervalUnit: 'weeks' },
    },
    { label: t('scheduleWeekly'), schedule: { type: 'standard', value: 1, intervalUnit: 'weeks' } },
  ];

  function scheduleLabel(schedule: { type: string; value: number; intervalUnit: string }) {
    const unit = schedule.intervalUnit?.toLowerCase();
    if (unit === 'weeks' && schedule.value === 1) return t('scheduleWeekly');
    if (unit === 'weeks' && schedule.value === 2) return t('scheduleBiWeekly');
    if (unit === 'months' && schedule.value === 1) return t('scheduleMonthly');
    return t('everyInterval', { value: schedule.value, unit });
  }

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
        <h1 className="text-charcoal mb-6 text-2xl font-semibold">{t('title')}</h1>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-cream-dark h-36 animate-pulse rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-charcoal mb-6 text-2xl font-semibold">{t('title')}</h1>

      {actionError && (
        <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="border-border rounded-sm border bg-white p-12 text-center">
          <p className="text-charcoal-light mb-2">{t('noSubscriptions')}</p>
          <p className="text-charcoal-light mb-6 text-sm">{t('noSubscriptionsDescription')}</p>
          <Link
            href={localePath('/search?subscriptionEligible=true')}
            className="bg-sage hover:bg-sage/90 inline-block rounded-sm px-6 py-2.5 text-sm font-medium text-white transition-colors"
          >
            {t('shopSubscribeAndSave')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const isActive = sub.recurringOrderState === 'Active';
            const isPaused = sub.recurringOrderState === 'Paused';
            const isCancelled = sub.recurringOrderState === 'Cancelled';
            const lineItems: typeof sub.lineItems = sub.lineItems ?? [];
            const total = lineItems.reduce((sum, i) => sum + i.totalPrice.centAmount, 0);
            const currency = lineItems[0]?.totalPrice.currencyCode || 'USD';

            const skipCfg = sub.skipConfiguration;
            const pendingSkips = skipCfg ? skipCfg.totalToSkip - skipCfg.skipped : 0;

            return (
              <div key={sub.id} className="border-border rounded-sm border bg-white p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${STATE_COLORS[sub.recurringOrderState] || 'bg-cream text-charcoal-light border-border'}`}
                      >
                        {STATE_LABELS[sub.recurringOrderState] || sub.recurringOrderState}
                      </span>
                      <span className="text-charcoal-light text-xs">
                        {scheduleLabel(sub.schedule)}
                      </span>
                      {pendingSkips > 0 && (
                        <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700">
                          {t('skipping', { count: pendingSkips })}
                        </span>
                      )}
                    </div>
                    {sub.nextOrderDate && !isCancelled && (
                      <p className="text-charcoal-light text-xs">
                        {t('nextOrder', {
                          date: new Date(sub.nextOrderDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }),
                        })}
                      </p>
                    )}
                  </div>
                  <p className="text-charcoal text-sm font-semibold">
                    {formatMoney(total, currency)}
                  </p>
                </div>

                <div className="mb-4 space-y-1">
                  {lineItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-charcoal-light">
                        {item.name['en-US'] || Object.values(item.name)[0]} × {item.quantity}
                      </span>
                      <span className="text-charcoal">
                        {formatMoney(item.totalPrice.centAmount, item.totalPrice.currencyCode)}
                      </span>
                    </div>
                  ))}
                </div>

                {!isCancelled && (
                  <div className="border-border space-y-3 border-t pt-3">
                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      {isActive && (
                        <button
                          onClick={() => handleAction(sub.id, 'pause')}
                          disabled={actionLoading === sub.id + 'pause'}
                          className="border-border text-charcoal-light hover:text-charcoal hover:border-charcoal rounded-sm border px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
                        >
                          {actionLoading === sub.id + 'pause' ? t('pausing') : t('pause')}
                        </button>
                      )}
                      {isPaused && (
                        <button
                          onClick={() => handleAction(sub.id, 'resume')}
                          disabled={actionLoading === sub.id + 'resume'}
                          className="border-sage text-sage hover:bg-sage/10 rounded-sm border px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
                        >
                          {actionLoading === sub.id + 'resume' ? t('resuming') : t('resume')}
                        </button>
                      )}
                      {isActive && (
                        <button
                          onClick={() => {
                            const currentPending = skipCfg
                              ? skipCfg.totalToSkip - skipCfg.skipped
                              : 0;
                            const newTotal = (skipCfg?.totalToSkip ?? 0) + 1;
                            handleAction(sub.id, 'skip', {
                              totalToSkip: currentPending > 0 ? newTotal : 1,
                            });
                          }}
                          disabled={actionLoading === sub.id + 'skip'}
                          className="border-border text-charcoal-light hover:text-charcoal hover:border-charcoal rounded-sm border px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
                        >
                          {actionLoading === sub.id + 'skip'
                            ? t('skippingOrder')
                            : t('skipNextOrder')}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(t('cancelConfirm'))) {
                            handleAction(sub.id, 'cancel');
                          }
                        }}
                        disabled={actionLoading === sub.id + 'cancel'}
                        className="rounded-sm px-3 py-1.5 text-xs text-red-500 transition-colors hover:text-red-700 disabled:opacity-50"
                      >
                        {actionLoading === sub.id + 'cancel'
                          ? t('cancelling')
                          : t('cancelSubscription')}
                      </button>
                    </div>

                    {/* Schedule pills */}
                    <div className="flex items-center gap-2">
                      <span className="text-charcoal-light text-xs">{t('changeSchedule')}</span>
                      {SCHEDULES.map((s) => {
                        const isCurrent = isCurrentSchedule(sub, s);
                        const loadKey = sub.id + 'setSchedule' + s.label;
                        return (
                          <button
                            key={s.label}
                            onClick={() =>
                              !isCurrent &&
                              handleAction(sub.id, 'setSchedule', { schedule: s.schedule })
                            }
                            disabled={isCurrent || actionLoading === loadKey}
                            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                              isCurrent
                                ? 'bg-charcoal border-charcoal cursor-default text-white'
                                : 'text-charcoal-light border-border hover:border-charcoal hover:text-charcoal bg-white'
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
