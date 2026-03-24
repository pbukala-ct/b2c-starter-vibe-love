import Link from 'next/link';
import { getOrderById } from '@/lib/ct/auth';
import { getSession, getLocale } from '@/lib/session';
import { formatMoney, getLocalizedString, toUrlLocale } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata = { title: 'Order Confirmed' };

export default async function ConfirmationPage({ params }: PageProps) {
  const { orderId } = await params;
  const [session, localeData, t] = await Promise.all([getSession(), getLocale(), getTranslations('confirmation')]);
  const lp = (p: string) => `/${toUrlLocale(localeData.country)}${p}`;

  let order = null;
  try {
    order = await getOrderById(orderId);
  } catch {}

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-16 text-center">
      <div className="w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-semibold text-charcoal mb-3">{t('title')}</h1>
      <p className="text-charcoal-light mb-2">
        {t('thankYou')}
      </p>
      {order?.orderNumber && (
        <p className="text-sm text-charcoal-light mb-8">
          {t('orderNumber', { number: order.orderNumber })}
        </p>
      )}

      {order?.lineItems && (
        <div className="bg-cream rounded-sm p-6 mb-8 text-left">
          <h2 className="font-semibold text-charcoal mb-4">{t('orderDetails')}</h2>
          <div className="space-y-3">
            {order.lineItems.map((item: { id: string; name: Record<string, string>; quantity: number; totalPrice: { centAmount: number; currencyCode: string }; recurrenceInfo?: { recurrencePolicy: { id: string } } }) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span className="text-charcoal">{getLocalizedString(item.name, 'en-US')}</span>
                  <span className="text-charcoal-light ml-2">× {item.quantity}</span>
                  {item.recurrenceInfo?.recurrencePolicy && (
                    <span className="ml-2 text-sage text-xs">{t('subscription')}</span>
                  )}
                </div>
                <span>{formatMoney(item.totalPrice.centAmount, item.totalPrice.currencyCode)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
            {(() => {
              const subtotal = order.lineItems.reduce((s: number, i: { totalPrice: { centAmount: number } }) => s + i.totalPrice.centAmount, 0);
              const shipping = order.shippingInfo?.price?.centAmount ?? 0;
              const tax = order.taxedPrice ? order.taxedPrice.totalGross.centAmount - order.taxedPrice.totalNet.centAmount : 0;
              const total = order.taxedPrice?.totalGross?.centAmount ?? order.totalPrice?.centAmount;
              const currency = order.totalPrice?.currencyCode;
              return (
                <>
                  <div className="flex justify-between text-charcoal-light">
                    <span>{t('subtotal')}</span><span>{formatMoney(subtotal, currency)}</span>
                  </div>
                  {shipping > 0 && (
                    <div className="flex justify-between text-charcoal-light">
                      <span>{order.shippingInfo?.shippingMethodName ? t('shippingWithMethod', { method: order.shippingInfo.shippingMethodName }) : t('shipping')}</span>
                      <span>{formatMoney(shipping, currency)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between text-charcoal-light">
                      <span>{t('tax')}</span><span>{formatMoney(tax, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-charcoal pt-1 border-t border-border">
                    <span>{t('total')}</span><span>{formatMoney(total, currency)}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {order?.lineItems?.some((i: { recurrenceInfo?: { recurrencePolicy?: { id: string } } }) => i.recurrenceInfo?.recurrencePolicy) && (
        <div className="bg-sage/10 border border-sage/20 rounded-sm p-4 mb-8">
          <p className="text-sm text-charcoal">
            {t('subscriptionSetUp')}{' '}
            {session.customerId ? (
              <Link href={lp('/account/subscriptions')} className="text-terra hover:underline">
                {t('mySubscriptions')}
              </Link>
            ) : (
              <Link href={lp('/login')} className="text-terra hover:underline">{t('yourAccount')}</Link>
            )}.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {session.customerId && (
          <Link
            href={lp('/account/orders')}
            className="bg-charcoal text-white px-6 py-3 text-sm font-medium hover:bg-charcoal/80 transition-colors rounded-sm"
          >
            {t('viewMyOrders')}
          </Link>
        )}
        <Link
          href={lp('/')}
          className="border border-border text-charcoal px-6 py-3 text-sm font-medium hover:bg-cream transition-colors rounded-sm"
        >
          {t('continueShopping')}
        </Link>
      </div>
    </div>
  );
}
