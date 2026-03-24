'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/utils';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from 'next-intl';

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalPrice: { centAmount: number; currencyCode: string };
  orderState: string;
  lineItems: { id: string; name: Record<string, string>; quantity: number }[];
}

// STATE_LABELS now use translations, see component below

const STATE_COLORS: Record<string, string> = {
  Open: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Confirmed: 'bg-sage/10 text-sage border-sage/20',
  Complete: 'bg-green-50 text-green-700 border-green-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function OrdersPage() {
  const { localePath } = useLocale();
  const t = useTranslations('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const STATE_LABELS: Record<string, string> = {
    Open: t('stateProcessing'),
    Confirmed: t('stateConfirmed'),
    Complete: t('stateDelivered'),
    Cancelled: t('stateCancelled'),
  };

  useEffect(() => {
    fetch('/api/account/orders')
      .then(r => r.json())
      .then(data => {
        setOrders(data.orders || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-charcoal mb-6">{t('title')}</h1>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-cream-dark rounded-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-charcoal mb-6">{t('title')}</h1>

      {orders.length === 0 ? (
        <div className="bg-white border border-border rounded-sm p-12 text-center">
          <p className="text-charcoal-light mb-4">{t('noOrders')}</p>
          <Link href={localePath('/')} className="bg-charcoal text-white px-6 py-2.5 text-sm font-medium hover:bg-charcoal/80 transition-colors rounded-sm inline-block">
            {t('startShopping')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-border rounded-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold text-charcoal text-sm">{t('orderNumber', { number: order.orderNumber })}</p>
                    <span className={`text-xs border px-2 py-0.5 rounded-full ${STATE_COLORS[order.orderState] || 'bg-cream text-charcoal-light border-border'}`}>
                      {STATE_LABELS[order.orderState] || order.orderState}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-light">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-charcoal text-sm">
                    {formatMoney(order.totalPrice.centAmount, order.totalPrice.currencyCode)}
                  </p>
                  <Link href={localePath(`/account/orders/${order.id}`)} className="text-xs text-terra hover:underline">
                    {t('viewDetails')}
                  </Link>
                </div>
              </div>
              <div className="text-xs text-charcoal-light">
                {order.lineItems.slice(0, 3).map(item => (
                  <span key={item.id}>
                    {item.name['en-US'] || Object.values(item.name)[0]} × {item.quantity}
                    {order.lineItems.indexOf(item) < Math.min(order.lineItems.length, 3) - 1 ? ', ' : ''}
                  </span>
                ))}
                {order.lineItems.length > 3 && ` ${t('more', { count: order.lineItems.length - 3 })}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
