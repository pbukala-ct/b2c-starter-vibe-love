'use client';

import { use } from 'react';
import Link from 'next/link';
import { formatStreetAddress } from '@/lib/utils';
import { useFormatters } from '@/hooks/useFormatters';
import { useOrder } from '@/hooks/useOrders';
import type { Order } from '@/hooks/useOrders';

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { formatMoney, getLocalizedString, formatDate } = useFormatters();
  const { data: order, isLoading } = useOrder(orderId);

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-cream-dark rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-cream-dark rounded-sm animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-charcoal mb-6">Order Not Found</h1>
        <Link href="/account/orders" className="text-terra hover:underline text-sm">← Back to orders</Link>
      </div>
    );
  }

  const addr = order.shippingAddress;
  const isSplitShipment =
    order.itemShippingAddresses && order.itemShippingAddresses.length > 1;

  // Build a lookup from addressKey → address for split-shipment display
  const addrByKey = new Map(
    (order.itemShippingAddresses || []).map((a) => [a.key, a])
  );

  // Group line items by their shipping addressKey (for split orders)
  const shipmentGroups: Map<
    string,
    Array<{ item: Order['lineItems'][number]; qty: number }>
  > = new Map();

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
  const inlineAddr = (a: { streetNumber?: string; streetName: string; city: string; state?: string; postalCode: string }) =>
    `${formatStreetAddress(a.streetNumber, a.streetName)}, ${a.city}${a.state ? ` ${a.state}` : ''} ${a.postalCode}`;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/account/orders" className="text-charcoal-light hover:text-charcoal text-sm">← Orders</Link>
        <span className="text-border">/</span>
        <h1 className="text-2xl font-semibold text-charcoal">Order #{order.orderNumber}</h1>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <p className="text-sm text-charcoal-light">
          {formatDate(order.createdAt)}
        </p>
        <span className="text-xs bg-sage/10 text-sage border border-sage/20 px-2 py-0.5 rounded-full">
          {order.orderState}
        </span>
      </div>

      <div className="space-y-6 mb-6">
        {/* ── Split-shipment: items grouped by address ─────────────── */}
        {isSplitShipment ? (
          <>
            {Array.from(shipmentGroups.entries()).map(([key, items], gi) => {
              const a = addrByKey.get(key);
              return (
                <div key={key} className="bg-white border border-border rounded-sm p-5">
                  {/* Shipment header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-semibold text-charcoal">
                        Shipment {gi + 1} of {shipmentGroups.size}
                      </h2>
                      {a && (
                        <p className="text-sm text-charcoal-light mt-0.5">
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
                          <span className="text-charcoal">{getLocalizedString(item.name)}</span>
                          <span className="text-charcoal-light ml-2">× {qty}</span>
                          {item.recurrenceInfo?.recurrencePolicy && (
                            <span className="ml-2 text-sage text-xs border border-sage/30 px-1.5 py-0.5 rounded-full">♻ Subscription</span>
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
            <div className="bg-white border border-border rounded-sm p-5">
              <h2 className="font-semibold text-charcoal mb-4">Order Total</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-charcoal-light">
                  <span>Subtotal</span>
                  <span>{formatMoney(order.lineItems.reduce((s, i) => s + i.totalPrice.centAmount, 0), order.totalPrice.currencyCode)}</span>
                </div>
                {order.shippingInfo && (
                  <div className="flex justify-between text-charcoal-light">
                    <span>Shipping ({order.shippingInfo.shippingMethodName})</span>
                    <span>{formatMoney(order.shippingInfo.price.centAmount, order.shippingInfo.price.currencyCode)}</span>
                  </div>
                )}
                {order.taxedPrice && (
                  <div className="flex justify-between text-charcoal-light">
                    <span>Tax</span>
                    <span>{formatMoney(order.taxedPrice.totalGross.centAmount - order.taxedPrice.totalNet.centAmount, order.taxedPrice.totalGross.currencyCode)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-charcoal pt-1 border-t border-border">
                  <span>Total</span>
                  <span>{formatMoney(order.taxedPrice?.totalGross?.centAmount ?? order.totalPrice.centAmount, order.taxedPrice?.totalGross?.currencyCode ?? order.totalPrice.currencyCode)}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── Single-shipment: flat item list ──────────────────── */
          <div className="bg-white border border-border rounded-sm p-5">
            <h2 className="font-semibold text-charcoal mb-4">Items</h2>
            <div className="space-y-3">
              {order.lineItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <span className="text-charcoal">{getLocalizedString(item.name)}</span>
                    <span className="text-charcoal-light ml-2">× {item.quantity}</span>
                    {item.recurrenceInfo?.recurrencePolicy && (
                      <span className="ml-2 text-sage text-xs border border-sage/30 px-1.5 py-0.5 rounded-full">♻ Subscription</span>
                    )}
                  </div>
                  <span className="text-charcoal font-medium">
                    {formatMoney(item.totalPrice.centAmount, item.totalPrice.currencyCode)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-charcoal-light">
                <span>Subtotal</span>
                <span>{formatMoney(order.lineItems.reduce((s, i) => s + i.totalPrice.centAmount, 0), order.totalPrice.currencyCode)}</span>
              </div>
              {order.shippingInfo && (
                <div className="flex justify-between text-charcoal-light">
                  <span>Shipping ({order.shippingInfo.shippingMethodName})</span>
                  <span>{formatMoney(order.shippingInfo.price.centAmount, order.shippingInfo.price.currencyCode)}</span>
                </div>
              )}
              {order.taxedPrice && (
                <div className="flex justify-between text-charcoal-light">
                  <span>Tax</span>
                  <span>{formatMoney(order.taxedPrice.totalGross.centAmount - order.taxedPrice.totalNet.centAmount, order.taxedPrice.totalGross.currencyCode)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-charcoal pt-1 border-t border-border">
                <span>Total</span>
                <span>{formatMoney(order.taxedPrice?.totalGross?.centAmount ?? order.totalPrice.centAmount, order.taxedPrice?.totalGross?.currencyCode ?? order.totalPrice.currencyCode)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Addresses (only for non-split orders) ───────────── */}
        {!isSplitShipment && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addr && (
              <div className="bg-white border border-border rounded-sm p-5">
                <h2 className="font-semibold text-charcoal mb-3">Shipping Address</h2>
                <address className="text-sm text-charcoal-light not-italic space-y-0.5">
                  <p>{addr.firstName} {addr.lastName}</p>
                  <p>{formatStreetAddress(addr.streetNumber, addr.streetName)}</p>
                  {addr.additionalAddressInfo && <p>{addr.additionalAddressInfo}</p>}
                  <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode}</p>
                  <p>{addr.country}</p>
                </address>
              </div>
            )}

            {order.billingAddress && (
              <div className="bg-white border border-border rounded-sm p-5">
                <h2 className="font-semibold text-charcoal mb-3">Billing Address</h2>
                <address className="text-sm text-charcoal-light not-italic space-y-0.5">
                  <p>{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
                  <p>{formatStreetAddress(order.billingAddress.streetNumber, order.billingAddress.streetName)}</p>
                  {order.billingAddress.additionalAddressInfo && <p>{order.billingAddress.additionalAddressInfo}</p>}
                  <p>{order.billingAddress.city}{order.billingAddress.state ? `, ${order.billingAddress.state}` : ''} {order.billingAddress.postalCode}</p>
                  <p>{order.billingAddress.country}</p>
                </address>
              </div>
            )}
          </div>
        )}

        {/* Billing (split shipment) */}
        {isSplitShipment && order.billingAddress && (
          <div className="bg-white border border-border rounded-sm p-5">
            <h2 className="font-semibold text-charcoal mb-3">Billing Address</h2>
            <address className="text-sm text-charcoal-light not-italic space-y-0.5">
              <p>{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
              <p>{formatStreetAddress(order.billingAddress.streetNumber, order.billingAddress.streetName)}</p>
              {order.billingAddress.additionalAddressInfo && <p>{order.billingAddress.additionalAddressInfo}</p>}
              <p>{order.billingAddress.city}{order.billingAddress.state ? `, ${order.billingAddress.state}` : ''} {order.billingAddress.postalCode}</p>
              <p>{order.billingAddress.country}</p>
            </address>
          </div>
        )}
      </div>
    </div>
  );
}
