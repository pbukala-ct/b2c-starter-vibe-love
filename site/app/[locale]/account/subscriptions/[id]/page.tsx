'use client';

import { use, useState } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { useSubscription, useSubscriptionAction } from '@/hooks/useSubscriptions';
import { useFormatters } from '@/hooks/useFormatters';
import { useRecurrencePoliciesList } from '@/hooks/useRecurrencePolicies';
import { useTranslations } from 'next-intl';

const STATE_COLORS: Record<string, string> = {
  Active: 'bg-sage/10 text-sage border-sage/20',
  Paused: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: sub, isLoading } = useSubscription(id);
  const { formatMoney, getLocalizedString, formatDate } = useFormatters();
  const t = useTranslations('subscriptions');
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const policies = useRecurrencePoliciesList();
  const { action: subscriptionAction } = useSubscriptionAction();

  async function doAction(actionType: string, extra: Record<string, unknown> = {}) {
    setActionError(null);
    setActionLoading(actionType);
    try {
      await subscriptionAction(id, actionType, extra);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(null);
      setConfirmCancel(false);
    }
  }

  if (isLoading) {
    return <div className="text-charcoal-light animate-pulse py-8">{t('loading')}</div>;
  }

  if (!sub) {
    return (
      <div className="py-8">
        <p className="text-charcoal-light mb-4">{t('notFound')}</p>
        <Link
          href="/account/subscriptions"
          className="text-terra text-sm hover:underline"
        >
          ← {t('backToSubscriptions')}
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

  const total =
    sub.lineItems?.reduce((sum, item) => sum + (item.totalPrice?.centAmount || 0), 0) ?? 0;
  const currencyCode = sub.lineItems?.[0]?.totalPrice?.currencyCode || undefined;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-charcoal-light hover:text-charcoal text-sm transition-colors"
        >
          ←
        </button>
        <h1 className="text-charcoal text-2xl font-semibold">{t('detailTitle')}</h1>
      </div>

      {actionError && (
        <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="border-border space-y-5 rounded-sm border bg-white p-6">
        {/* Status + ID */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-charcoal-light mb-1 text-xs">{t('subscriptionId')}</p>
            <p className="text-charcoal font-mono text-sm">{sub.id.slice(0, 8)}…</p>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATE_COLORS[state] || 'border-gray-200 bg-gray-50 text-gray-600'}`}
          >
            {state}
          </span>
        </div>

        {/* Schedule */}
        {sub.schedule && (
          <div>
            <p className="text-charcoal-light mb-1 text-xs">{t('deliveryFrequency')}</p>
            <p className="text-charcoal text-sm font-medium">
              {getLocalizedString(policies.find((p) => p.id === sub.id)?.name)}
            </p>
          </div>
        )}

        {/* Next order date */}
        {nextDate && state !== 'Cancelled' && (
          <div>
            <p className="text-charcoal text-sm">
              {t('nextOrder', { date: formatDate(nextDate) })}
            </p>
          </div>
        )}

        {/* Skip info */}
        {sub.skipConfiguration && sub.skipConfiguration.totalToSkip > 0 && (
          <div className="rounded-sm border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
            {t('skipping', { count: sub.skipConfiguration.totalToSkip })}
          </div>
        )}

        {/* Line items */}
        {sub.lineItems && sub.lineItems.length > 0 && (
          <div>
            <p className="text-charcoal-light mb-2 text-xs">{t('items')}</p>
            <div className="space-y-2">
              {sub.lineItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-charcoal">
                    {getLocalizedString(item.name)} × {item.quantity}
                  </span>
                  <span className="text-charcoal font-medium">
                    {formatMoney(item.totalPrice?.centAmount ?? 0, item.totalPrice?.currencyCode)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-border text-charcoal mt-3 flex justify-between border-t pt-3 text-sm font-semibold">
              <span>{t('totalPerOrder')}</span>
              <span>{formatMoney(total, currencyCode)}</span>
            </div>
          </div>
        )}

        {/* Change schedule */}
        {canPause && (
          <div>
            <p className="text-charcoal-light mb-2 text-xs">{t('changeSchedule')}</p>
            <div className="flex flex-wrap gap-2">
              {policies.map((p) => {
                const isCurrent =
                  sub.schedule &&
                  sub.schedule.value === p.schedule.value &&
                  sub.schedule.intervalUnit === p.schedule.intervalUnit;
                return (
                  <button
                    key={p.id}
                    onClick={() => doAction('setSchedule', { recurrencePolicyId: p.id })}
                    disabled={!!actionLoading || !!isCurrent}
                    className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${
                      isCurrent
                        ? 'bg-charcoal border-charcoal cursor-default text-white'
                        : 'border-border text-charcoal-light hover:border-charcoal hover:text-charcoal disabled:opacity-50'
                    }`}
                  >
                    {getLocalizedString(p.name)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-border flex flex-wrap gap-3 border-t pt-2">
          {canPause && (
            <button
              onClick={() => doAction('pause')}
              disabled={!!actionLoading}
              className="border-border text-charcoal hover:bg-cream rounded-sm border px-4 py-2 text-sm transition-colors disabled:opacity-50"
            >
              {actionLoading === 'pause' ? t('pausing') : t('pause')}
            </button>
          )}
          {canResume && (
            <button
              onClick={() => doAction('resume')}
              disabled={!!actionLoading}
              className="bg-charcoal hover:bg-charcoal/80 rounded-sm px-4 py-2 text-sm text-white transition-colors disabled:opacity-50"
            >
              {actionLoading === 'resume' ? t('resuming') : t('resume')}
            </button>
          )}
          {canSkip && (
            <button
              onClick={() =>
                doAction('skip', { totalToSkip: (sub.skipConfiguration?.totalToSkip || 0) + 1 })
              }
              disabled={!!actionLoading}
              className="border-border text-charcoal hover:bg-cream rounded-sm border px-4 py-2 text-sm transition-colors disabled:opacity-50"
            >
              {actionLoading === 'skip' ? t('skippingOrder') : t('skipNextOrder')}
            </button>
          )}
          {canCancel && !confirmCancel && (
            <button
              onClick={() => setConfirmCancel(true)}
              disabled={!!actionLoading}
              className="px-4 py-2 text-sm text-red-600 transition-colors hover:underline disabled:opacity-50"
            >
              {t('cancelSubscription')}
            </button>
          )}
          {confirmCancel && (
            <div className="flex items-center gap-3">
              <span className="text-charcoal-light text-sm">{t('cancelConfirm')}</span>
              <button
                onClick={() => doAction('cancel')}
                disabled={!!actionLoading}
                className="rounded-sm bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === 'cancel' ? t('cancelling') : t('confirmCancelYes')}
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="border-border text-charcoal hover:bg-cream rounded-sm border px-4 py-2 text-sm transition-colors"
              >
                {t('confirmCancelNo')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Link
          href="/account/subscriptions"
          className="text-terra text-sm hover:underline"
        >
          ← {t('backToSubscriptions')}
        </Link>
      </div>
    </div>
  );
}
