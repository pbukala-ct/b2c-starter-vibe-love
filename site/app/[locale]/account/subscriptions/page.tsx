'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFormatters } from '@/hooks/useFormatters';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from 'next-intl';
import { useRecurrencePoliciesList } from '@/hooks/useRecurrencePolicies';
import { useSubscriptions, useSubscriptionAction } from '@/hooks/useSubscriptions';

// STATE_LABELS now use translations, see component

const STATE_COLORS: Record<string, string> = {
  Active: 'bg-sage/10 text-sage border-sage/20',
  Paused: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function SubscriptionsPage() {
  const { localePath } = useLocale();
  const { formatMoney, getLocalizedString, formatDate } = useFormatters();
  const t = useTranslations('subscriptions');
  const policies = useRecurrencePoliciesList();
  const { data: subscriptions = [], isLoading } = useSubscriptions();
  const { action: subscriptionAction } = useSubscriptionAction();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const STATE_LABELS: Record<string, string> = {
    Active: t('stateActive'),
    Paused: t('statePaused'),
    Cancelled: t('stateCancelled'),
  };

  async function handleAction(id: string, actionType: string, payload?: Record<string, unknown>) {
    setActionLoading(id + actionType);
    setActionError(null);
    try {
      await subscriptionAction(id, actionType, payload);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : `Failed to ${actionType} subscription`);
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
            const lineItems = sub.lineItems ?? [];
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
                        {getLocalizedString(policies.find((p) => p.id === sub.id)?.name)}
                      </span>
                      {pendingSkips > 0 && (
                        <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700">
                          {t('skipping', { count: pendingSkips })}
                        </span>
                      )}
                    </div>
                    {sub.nextOrderDate && !isCancelled && (
                      <p className="text-charcoal-light text-xs">
                        {t('nextOrder', { date: formatDate(sub.nextOrderDate) })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-charcoal text-sm font-semibold">
                      {formatMoney(total, currency)}
                    </p>
                    <Link href={localePath(`/account/subscriptions/${sub.id}`)} className="text-xs text-terra hover:underline">
                      {t('viewDetails')}
                    </Link>
                  </div>
                </div>

                <div className="mb-4 space-y-1">
                  {lineItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-charcoal-light">
                        {getLocalizedString(item.name)} × {item.quantity}
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
                      {policies.map((p) => {
                        const isCurrent = sub.schedule?.value === p.schedule.value && sub.schedule?.intervalUnit === p.schedule.intervalUnit;
                        const loadKey = sub.id + 'setSchedule' + p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => !isCurrent && handleAction(sub.id, 'setSchedule', { recurrencePolicyId: p.id })}
                            disabled={isCurrent || actionLoading === loadKey}
                            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                              isCurrent
                                ? 'bg-charcoal border-charcoal cursor-default text-white'
                                : 'text-charcoal-light border-border hover:border-charcoal hover:text-charcoal bg-white'
                            } disabled:opacity-60`}
                          >
                            {actionLoading === loadKey ? '…' : getLocalizedString(p.name)}
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
