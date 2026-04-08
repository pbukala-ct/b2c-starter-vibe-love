import { Link } from '@/i18n/routing';
import { getOrderById } from '@/lib/ct/auth';
import { getSession, getLocale } from '@/lib/session';
import { formatMoney, getLocalizedString } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata: Metadata = { title: 'Order Confirmed' };

export default async function ConfirmationPage({ params }: PageProps) {
  const { locale } = await getLocale();
  const { orderId } = await params;
  const [session, t] = await Promise.all([getSession(), getTranslations('confirmation')]);
  let order = null;
  try {
    order = await getOrderById(orderId);
  } catch {
    // order not found — show partial confirmation page
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center lg:px-8">
      <div className="bg-sage/20 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
        <svg className="text-sage h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-charcoal mb-3 text-3xl font-semibold">{t('title')}</h1>
      <p className="text-charcoal-light mb-2">{t('thankYou')}</p>
      {order?.orderNumber && (
        <p className="text-charcoal-light mb-8 text-sm">
          {t('orderNumber', { number: order.orderNumber })}
        </p>
      )}

      {order?.lineItems && (
        <div className="bg-cream mb-8 rounded-sm p-6 text-left">
          <h2 className="text-charcoal mb-4 font-semibold">{t('orderDetails')}</h2>
          <div className="space-y-3">
            {order.lineItems.map(
              (item: {
                id: string;
                name: Record<string, string>;
                quantity: number;
                totalPrice: { centAmount: number; currencyCode: string };
                recurrenceInfo?: { recurrencePolicy: { id: string } };
              }) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <span className="text-charcoal">{getLocalizedString(item.name, locale)}</span>
                    <span className="text-charcoal-light ml-2">× {item.quantity}</span>
                    {item.recurrenceInfo?.recurrencePolicy && (
                      <span className="text-sage ml-2 text-xs">{t('subscription')}</span>
                    )}
                  </div>
                  <span>
                    {formatMoney(item.totalPrice.centAmount, item.totalPrice.currencyCode)}
                  </span>
                </div>
              )
            )}
          </div>
          <div className="border-border mt-4 space-y-2 border-t pt-4 text-sm">
            {(() => {
              const subtotal = order.lineItems.reduce(
                (s: number, i: { totalPrice: { centAmount: number } }) =>
                  s + i.totalPrice.centAmount,
                0
              );
              const shipping = order.shippingInfo?.price?.centAmount ?? 0;
              const tax = order.taxedPrice
                ? order.taxedPrice.totalGross.centAmount - order.taxedPrice.totalNet.centAmount
                : 0;
              const total =
                order.taxedPrice?.totalGross?.centAmount ?? order.totalPrice?.centAmount;
              const currency = order.totalPrice?.currencyCode;
              return (
                <>
                  <div className="text-charcoal-light flex justify-between">
                    <span>{t('subtotal')}</span>
                    <span>{formatMoney(subtotal, currency)}</span>
                  </div>
                  {shipping > 0 && (
                    <div className="text-charcoal-light flex justify-between">
                      <span>
                        {order.shippingInfo?.shippingMethodName
                          ? t('shippingWithMethod', {
                              method: order.shippingInfo.shippingMethodName,
                            })
                          : t('shipping')}
                      </span>
                      <span>{formatMoney(shipping, currency)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="text-charcoal-light flex justify-between">
                      <span>{t('tax')}</span>
                      <span>{formatMoney(tax, currency)}</span>
                    </div>
                  )}
                  <div className="text-charcoal border-border flex justify-between border-t pt-1 font-semibold">
                    <span>{t('total')}</span>
                    <span>{formatMoney(total, currency)}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {order?.lineItems?.some(
        (i: { recurrenceInfo?: { recurrencePolicy?: { id: string } } }) =>
          i.recurrenceInfo?.recurrencePolicy
      ) && (
        <div className="bg-sage/10 border-sage/20 mb-8 rounded-sm border p-4">
          <p className="text-charcoal text-sm">
            {t('subscriptionSetUp')}{' '}
            {session.customerId ? (
              <Link href="/account/subscriptions" className="text-terra hover:underline">
                {t('mySubscriptions')}
              </Link>
            ) : (
              <Link href="/login" className="text-terra hover:underline">
                {t('yourAccount')}
              </Link>
            )}
            .
          </p>
        </div>
      )}

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        {session.customerId && (
          <Link
            href="/account/orders"
            className="bg-charcoal hover:bg-charcoal/80 rounded-sm px-6 py-3 text-sm font-medium text-white transition-colors"
          >
            {t('viewMyOrders')}
          </Link>
        )}
        <Link
          href="/"
          className="border-border text-charcoal hover:bg-cream rounded-sm border px-6 py-3 text-sm font-medium transition-colors"
        >
          {t('continueShopping')}
        </Link>
      </div>
    </div>
  );
}
