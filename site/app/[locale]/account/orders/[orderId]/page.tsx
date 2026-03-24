'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatMoney, getLocalizedString, formatStreetAddress } from '@/lib/utils';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from 'next-intl';

interface LineItem {
  id: string;
  name: Record<string, string>;
  quantity: number;
  totalPrice: { centAmount: number; currencyCode: string };
  recurrenceInfo?: { recurrencePolicy: { id: string } };
  shippingDetails?: {
    targets: Array<{ addressKey: string; quantity: number }>;
    valid: boolean;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  orderState: string;
  totalPrice: { centAmount: number; currencyCode: string };
  taxedPrice?: {
    totalNet: { centAmount: number; currencyCode: string };
    totalGross: { centAmount: number; currencyCode: string };
    taxPortions?: Array<{
      name: string;
      amount: { centAmount: number; currencyCode: string };
      rate: number;
    }>;
  };
  shippingInfo?: {
    shippingMethodName: string;
    price: { centAmount: number; currencyCode: string };
  };
  lineItems: LineItem[];
  shippingAddress?: {
    firstName: string;
    lastName: string;
    streetName: string;
    streetNumber?: string;
    additionalAddressInfo?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    streetName: string;
    streetNumber?: string;
    additionalAddressInfo?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  itemShippingAddresses?: Array<{
    key?: string;
    firstName: string;
    lastName: string;
    streetName: string;
    streetNumber?: string;
    additionalAddressInfo?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  }>;
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { localePath } = useLocale();
  const t = useTranslations('orderDetail');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/account/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [orderId]);

  if (isLoading) {
    return (
      <div>
        <div className="bg-cream-dark mb-6 h-8 w-48 animate-pulse rounded" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-cream-dark h-32 animate-pulse rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <h1 className="text-charcoal mb-6 text-2xl font-semibold">{t('orderNotFound')}</h1>
        <Link href={localePath('/account/orders')} className="text-terra text-sm hover:underline">
          {t('backToOrdersList')}
        </Link>
      </div>
    );
  }

  const addr = order.shippingAddress;
  const isSplitShipment = order.itemShippingAddresses && order.itemShippingAddresses.length > 1;

  // Build a lookup from addressKey → address for split-shipment display
  const addrByKey = new Map((order.itemShippingAddresses || []).map((a) => [a.key, a]));

  // Group line items by their shipping addressKey (for split orders)
  const shipmentGroups: Map<string, Array<{ item: LineItem; qty: number }>> = new Map();

  if (isSplitShipment) {
    for (const item of order.lineItems) {
      const targets = item.shippingDetails?.targets || [];
      for (const t of targets) {
        const key = t.addressKey;
        if (!shipmentGroups.has(key)) shipmentGroups.set(key, []);
        shipmentGroups.get(key)!.push({ item, qty: t.quantity });
      }
    }
  }

  /** Render a compact inline address */
  const inlineAddr = (a: {
    streetNumber?: string;
    streetName: string;
    city: string;
    state?: string;
    postalCode: string;
  }) =>
    `${formatStreetAddress(a.streetNumber, a.streetName)}, ${a.city}${a.state ? ` ${a.state}` : ''} ${a.postalCode}`;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={localePath('/account/orders')}
          className="text-charcoal-light hover:text-charcoal text-sm"
        >
          {t('backToOrders')}
        </Link>
        <span className="text-border">/</span>
        <h1 className="text-charcoal text-2xl font-semibold">
          {t('orderHeading', { number: order.orderNumber })}
        </h1>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <p className="text-charcoal-light text-sm">
          {new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <span className="bg-sage/10 text-sage border-sage/20 rounded-full border px-2 py-0.5 text-xs">
          {order.orderState}
        </span>
      </div>

      <div className="mb-6 space-y-6">
        {/* ── Split-shipment: items grouped by address ─────────────── */}
        {isSplitShipment ? (
          <>
            {Array.from(shipmentGroups.entries()).map(([key, items], gi) => {
              const a = addrByKey.get(key);
              return (
                <div key={key} className="border-border rounded-sm border bg-white p-5">
                  {/* Shipment header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h2 className="text-charcoal font-semibold">
                        {t('shipment', { current: gi + 1, total: shipmentGroups.size })}
                      </h2>
                      {a && (
                        <p className="text-charcoal-light mt-0.5 text-sm">
                          Ship to: {a.firstName} {a.lastName} — {inlineAddr(a)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Items in this shipment */}
                  <div className="space-y-3">
                    {items.map(({ item, qty }) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div>
                          <span className="text-charcoal">
                            {getLocalizedString(item.name, 'en-US')}
                          </span>
                          <span className="text-charcoal-light ml-2">× {qty}</span>
                          {item.recurrenceInfo?.recurrencePolicy && (
                            <span className="text-sage border-sage/30 ml-2 rounded-full border px-1.5 py-0.5 text-xs">
                              {t('subscription')}
                            </span>
                          )}
                        </div>
                        <span className="text-charcoal font-medium">
                          {formatMoney(
                            Math.round(item.totalPrice.centAmount * (qty / item.quantity)),
                            item.totalPrice.currencyCode
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Totals card */}
            <div className="border-border rounded-sm border bg-white p-5">
              <h2 className="text-charcoal mb-4 font-semibold">{t('orderTotal')}</h2>
              <div className="space-y-2 text-sm">
                <div className="text-charcoal-light flex justify-between">
                  <span>{t('subtotal')}</span>
                  <span>
                    {formatMoney(
                      order.lineItems.reduce((s, i) => s + i.totalPrice.centAmount, 0),
                      order.totalPrice.currencyCode
                    )}
                  </span>
                </div>
                {order.shippingInfo && (
                  <div className="text-charcoal-light flex justify-between">
                    <span>{t('shipping', { method: order.shippingInfo.shippingMethodName })}</span>
                    <span>
                      {formatMoney(
                        order.shippingInfo.price.centAmount,
                        order.shippingInfo.price.currencyCode
                      )}
                    </span>
                  </div>
                )}
                {order.taxedPrice && (
                  <div className="text-charcoal-light flex justify-between">
                    <span>{t('tax')}</span>
                    <span>
                      {formatMoney(
                        order.taxedPrice.totalGross.centAmount -
                          order.taxedPrice.totalNet.centAmount,
                        order.taxedPrice.totalGross.currencyCode
                      )}
                    </span>
                  </div>
                )}
                <div className="text-charcoal border-border flex justify-between border-t pt-1 font-semibold">
                  <span>{t('total')}</span>
                  <span>
                    {formatMoney(
                      order.taxedPrice?.totalGross?.centAmount ?? order.totalPrice.centAmount,
                      order.taxedPrice?.totalGross?.currencyCode ?? order.totalPrice.currencyCode
                    )}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── Single-shipment: flat item list ──────────────────── */
          <div className="border-border rounded-sm border bg-white p-5">
            <h2 className="text-charcoal mb-4 font-semibold">{t('items')}</h2>
            <div className="space-y-3">
              {order.lineItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <span className="text-charcoal">{getLocalizedString(item.name, 'en-US')}</span>
                    <span className="text-charcoal-light ml-2">× {item.quantity}</span>
                    {item.recurrenceInfo?.recurrencePolicy && (
                      <span className="text-sage border-sage/30 ml-2 rounded-full border px-1.5 py-0.5 text-xs">
                        {t('subscription')}
                      </span>
                    )}
                  </div>
                  <span className="text-charcoal font-medium">
                    {formatMoney(item.totalPrice.centAmount, item.totalPrice.currencyCode)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-border mt-4 space-y-2 border-t pt-4 text-sm">
              <div className="text-charcoal-light flex justify-between">
                <span>{t('subtotal')}</span>
                <span>
                  {formatMoney(
                    order.lineItems.reduce((s, i) => s + i.totalPrice.centAmount, 0),
                    order.totalPrice.currencyCode
                  )}
                </span>
              </div>
              {order.shippingInfo && (
                <div className="text-charcoal-light flex justify-between">
                  <span>{t('shipping', { method: order.shippingInfo.shippingMethodName })}</span>
                  <span>
                    {formatMoney(
                      order.shippingInfo.price.centAmount,
                      order.shippingInfo.price.currencyCode
                    )}
                  </span>
                </div>
              )}
              {order.taxedPrice && (
                <div className="text-charcoal-light flex justify-between">
                  <span>{t('tax')}</span>
                  <span>
                    {formatMoney(
                      order.taxedPrice.totalGross.centAmount - order.taxedPrice.totalNet.centAmount,
                      order.taxedPrice.totalGross.currencyCode
                    )}
                  </span>
                </div>
              )}
              <div className="text-charcoal border-border flex justify-between border-t pt-1 font-semibold">
                <span>{t('total')}</span>
                <span>
                  {formatMoney(
                    order.taxedPrice?.totalGross?.centAmount ?? order.totalPrice.centAmount,
                    order.taxedPrice?.totalGross?.currencyCode ?? order.totalPrice.currencyCode
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Addresses (only for non-split orders) ───────────── */}
        {!isSplitShipment && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {addr && (
              <div className="border-border rounded-sm border bg-white p-5">
                <h2 className="text-charcoal mb-3 font-semibold">{t('shippingAddress')}</h2>
                <address className="text-charcoal-light space-y-0.5 text-sm not-italic">
                  <p>
                    {addr.firstName} {addr.lastName}
                  </p>
                  <p>{formatStreetAddress(addr.streetNumber, addr.streetName)}</p>
                  {addr.additionalAddressInfo && <p>{addr.additionalAddressInfo}</p>}
                  <p>
                    {addr.city}
                    {addr.state ? `, ${addr.state}` : ''} {addr.postalCode}
                  </p>
                  <p>{addr.country}</p>
                </address>
              </div>
            )}

            {order.billingAddress && (
              <div className="border-border rounded-sm border bg-white p-5">
                <h2 className="text-charcoal mb-3 font-semibold">{t('billingAddress')}</h2>
                <address className="text-charcoal-light space-y-0.5 text-sm not-italic">
                  <p>
                    {order.billingAddress.firstName} {order.billingAddress.lastName}
                  </p>
                  <p>
                    {formatStreetAddress(
                      order.billingAddress.streetNumber,
                      order.billingAddress.streetName
                    )}
                  </p>
                  {order.billingAddress.additionalAddressInfo && (
                    <p>{order.billingAddress.additionalAddressInfo}</p>
                  )}
                  <p>
                    {order.billingAddress.city}
                    {order.billingAddress.state ? `, ${order.billingAddress.state}` : ''}{' '}
                    {order.billingAddress.postalCode}
                  </p>
                  <p>{order.billingAddress.country}</p>
                </address>
              </div>
            )}
          </div>
        )}

        {/* Billing (split shipment) */}
        {isSplitShipment && order.billingAddress && (
          <div className="border-border rounded-sm border bg-white p-5">
            <h2 className="text-charcoal mb-3 font-semibold">{t('billingAddress')}</h2>
            <address className="text-charcoal-light space-y-0.5 text-sm not-italic">
              <p>
                {order.billingAddress.firstName} {order.billingAddress.lastName}
              </p>
              <p>
                {formatStreetAddress(
                  order.billingAddress.streetNumber,
                  order.billingAddress.streetName
                )}
              </p>
              {order.billingAddress.additionalAddressInfo && (
                <p>{order.billingAddress.additionalAddressInfo}</p>
              )}
              <p>
                {order.billingAddress.city}
                {order.billingAddress.state ? `, ${order.billingAddress.state}` : ''}{' '}
                {order.billingAddress.postalCode}
              </p>
              <p>{order.billingAddress.country}</p>
            </address>
          </div>
        )}
      </div>
    </div>
  );
}
