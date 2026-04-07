'use client';

import { Link } from '@/i18n/routing';
import { useOrders } from '@/hooks/useOrders';
import { useFormatters } from '@/hooks/useFormatters';
import { useTranslations } from 'next-intl';

const STATE_COLORS: Record<string, string> = {
  Open: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Confirmed: 'bg-sage/10 text-sage border-sage/20',
  Complete: 'bg-green-50 text-green-700 border-green-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function OrdersPage() {
  const t = useTranslations('orders');
  const { formatMoney, getLocalizedString, formatDate } = useFormatters();
  const { data: orders = [], isLoading } = useOrders();

  const STATE_LABELS: Record<string, string> = {
    Open: t('stateProcessing'),
    Confirmed: t('stateConfirmed'),
    Complete: t('stateDelivered'),
    Cancelled: t('stateCancelled'),
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-charcoal mb-6 text-2xl font-semibold">{t('title')}</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-cream-dark h-24 animate-pulse rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-charcoal mb-6 text-2xl font-semibold">{t('title')}</h1>

      {orders.length === 0 ? (
        <div className="border-border rounded-sm border bg-white p-12 text-center">
          <p className="text-charcoal-light mb-4">{t('noOrders')}</p>
          <Link
            href="/"
            className="bg-charcoal hover:bg-charcoal/80 inline-block rounded-sm px-6 py-2.5 text-sm font-medium text-white transition-colors"
          >
            {t('startShopping')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border-border rounded-sm border bg-white p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-3">
                    <p className="text-charcoal text-sm font-semibold">
                      {t('orderNumber', { number: order.orderNumber })}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${STATE_COLORS[order.orderState] || 'bg-cream text-charcoal-light border-border'}`}
                    >
                      {STATE_LABELS[order.orderState] || order.orderState}
                    </span>
                  </div>
                  <p className="text-charcoal-light text-xs">
                    {formatDate(order.createdAt, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-charcoal text-sm font-semibold">
                    {formatMoney(order.totalPrice.centAmount, order.totalPrice.currencyCode)}
                  </p>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="text-terra text-xs hover:underline"
                  >
                    {t('viewDetails')}
                  </Link>
                </div>
              </div>
              <div className="text-charcoal-light text-xs">
                {order.lineItems.slice(0, 3).map((item) => (
                  <span key={item.id}>
                    {getLocalizedString(item.name)} × {item.quantity}
                    {order.lineItems.indexOf(item) < Math.min(order.lineItems.length, 3) - 1
                      ? ', '
                      : ''}
                  </span>
                ))}
                {order.lineItems.length > 3 &&
                  ` ${t('more', { count: order.lineItems.length - 3 })}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
