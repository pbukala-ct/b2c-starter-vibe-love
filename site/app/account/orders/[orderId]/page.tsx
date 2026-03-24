'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useSWRConfig } from 'swr';
import { formatStreetAddress } from '@/lib/utils';
import { useFormatters } from '@/hooks/useFormatters';
import { useOrder } from '@/hooks/useOrders';
import { keyOrder } from '@/lib/cache-keys';
import type { Order } from '@/hooks/useOrders';

// ─── Shipment Timeline ───────────────────────────────────────────────────────

function ShipmentTimeline({ order, formatDate }: { order: Order; formatDate: (d: string) => string }) {
  const s = order.shipmentState;
  const isShipped = s === 'Shipped' || s === 'Delivered' || s === 'Partial';
  const isDelivered = s === 'Delivered' || order.orderState === 'Complete';

  const steps = [
    { label: 'Ordered', done: true, date: formatDate(order.createdAt), sub: '' },
    { label: s === 'Partial' ? 'Partially Shipped' : 'Shipped', done: isShipped, date: '', sub: s === 'Partial' ? 'Some items shipped' : '' },
    { label: 'Delivered', done: isDelivered, date: '', sub: '' },
  ];

  return (
    <div className="bg-white border border-border rounded-sm p-5 mb-6">
      <h2 className="font-semibold text-charcoal mb-4">Shipment Status</h2>
      {(s === 'Backorder' || s === 'Delayed') && (
        <div className={`text-sm px-3 py-2 rounded-sm mb-4 ${s === 'Backorder' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
          ⚠ {s === 'Backorder' ? 'This order is on backorder.' : 'This shipment is delayed.'}
        </div>
      )}
      <div className="flex items-start gap-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              {i > 0 && <div className={`flex-1 h-0.5 ${steps[i - 1].done && step.done ? 'bg-sage' : 'bg-border'}`} />}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-sage border-sage' : 'bg-white border-border'}`}>
                {step.done && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${step.done && steps[i + 1].done ? 'bg-sage' : 'bg-border'}`} />}
            </div>
            <p className={`text-xs mt-2 font-medium text-center ${step.done ? 'text-charcoal' : 'text-charcoal-light'}`}>{step.label}</p>
            {step.date && <p className="text-xs text-charcoal-light text-center">{step.date}</p>}
            {step.sub && <p className="text-xs text-charcoal-light text-center">{step.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Return Modal ─────────────────────────────────────────────────────────────

function ReturnModal({ order, onClose, getLocalizedString }: {
  order: Order;
  onClose: () => void;
  getLocalizedString: (obj: Record<string, string>) => string;
}) {
  const { mutate } = useSWRConfig();
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Already-returned quantities per lineItemId
  const returnedQty: Record<string, number> = {};
  for (const batch of order.returnInfo ?? []) {
    for (const item of batch.items) {
      returnedQty[item.lineItemId] = (returnedQty[item.lineItemId] ?? 0) + item.quantity;
    }
  }

  const returnableItems = order.lineItems.filter(
    item => item.quantity - (returnedQty[item.id] ?? 0) > 0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const items = Object.entries(selected)
      .filter(([, qty]) => qty > 0)
      .map(([lineItemId, quantity]) => ({ lineItemId, quantity }));
    if (items.length === 0) { setError('Select at least one item to return.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/account/orders/${order.id}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, comment: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit return.'); return; }
      mutate(keyOrder(order.id), data, { revalidate: false });
      onClose();
    } catch {
      setError('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-sm shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-charcoal">Return Items</h2>
          <button onClick={onClose} className="text-charcoal-light hover:text-charcoal transition-colors" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-3 max-h-80 overflow-y-auto">
            <p className="text-sm text-charcoal-light mb-4">Select the items you want to return and the quantity for each.</p>
            {returnableItems.map(item => {
              const maxQty = item.quantity - (returnedQty[item.id] ?? 0);
              const qty = selected[item.id] ?? 0;
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
                  <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={qty > 0}
                      onChange={e => setSelected(prev => ({ ...prev, [item.id]: e.target.checked ? 1 : 0 }))}
                      className="rounded border-border flex-shrink-0"
                    />
                    <span className="text-sm text-charcoal truncate">{getLocalizedString(item.name)}</span>
                  </label>
                  {qty > 0 ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelected(prev => ({ ...prev, [item.id]: Math.max(1, qty - 1) }))}
                        className="w-6 h-6 border border-border rounded-sm text-charcoal-light hover:text-charcoal flex items-center justify-center text-sm"
                      >−</button>
                      <span className="w-6 text-center text-sm font-medium text-charcoal">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setSelected(prev => ({ ...prev, [item.id]: Math.min(maxQty, qty + 1) }))}
                        disabled={qty >= maxQty}
                        className="w-6 h-6 border border-border rounded-sm text-charcoal-light hover:text-charcoal flex items-center justify-center text-sm disabled:opacity-30"
                      >+</button>
                      <span className="text-xs text-charcoal-light">of {maxQty}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-charcoal-light flex-shrink-0">Qty: {maxQty}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-6 pb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5">
              Comment <span className="text-charcoal-light font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Reason for return or any additional notes…"
              className="w-full rounded border border-border px-3 py-2 text-sm text-charcoal placeholder:text-charcoal-light focus:border-charcoal focus:outline-none resize-none"
            />
          </div>

          {error && (
            <p className="px-6 text-sm text-red-600">{error}</p>
          )}

          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-charcoal-light hover:text-charcoal border border-border rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || Object.values(selected).every(q => q === 0)}
              className="px-4 py-2 text-sm font-medium bg-charcoal text-white rounded-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Order Detail Page ────────────────────────────────────────────────────────

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { formatMoney, getLocalizedString, formatDate } = useFormatters();
  const { data: order, isLoading } = useOrder(orderId);
  const [showReturnModal, setShowReturnModal] = useState(false);

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

  console.log('order', order);

  // Already-returned quantities — used to decide if button should show
  const returnedQty: Record<string, number> = {};
  for (const batch of order.returnInfo ?? []) {
    for (const item of batch.items) {
      returnedQty[item.lineItemId] = (returnedQty[item.lineItemId] ?? 0) + item.quantity;
    }
  }
  const canReturn = (order.orderState === 'Complete' || order.orderState === 'Confirmed')
    && order.lineItems.some(item => item.quantity - (returnedQty[item.id] ?? 0) > 0);

  const addr = order.shippingAddress;
  const isSplitShipment = order.itemShippingAddresses && order.itemShippingAddresses.length > 1;

  const addrByKey = new Map(
    (order.itemShippingAddresses || []).map((a) => [a.key, a])
  );

  const shipmentGroups: Map<string, Array<{ item: Order['lineItems'][number]; qty: number }>> = new Map();
  if (isSplitShipment) {
    for (const item of order.lineItems) {
      for (const t of item.shippingDetails?.targets || []) {
        if (!shipmentGroups.has(t.addressKey)) shipmentGroups.set(t.addressKey, []);
        shipmentGroups.get(t.addressKey)!.push({ item, qty: t.quantity });
      }
    }
  }

  const inlineAddr = (a: { streetNumber?: string; streetName: string; city: string; state?: string; postalCode: string }) =>
    `${formatStreetAddress(a.streetNumber, a.streetName)}, ${a.city}${a.state ? ` ${a.state}` : ''} ${a.postalCode}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/account/orders" className="text-charcoal-light hover:text-charcoal text-sm">← Orders</Link>
        <span className="text-border">/</span>
        <h1 className="text-2xl font-semibold text-charcoal">Order #{order.orderNumber}</h1>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <p className="text-sm text-charcoal-light">{formatDate(order.createdAt)}</p>
          <span className="text-xs bg-sage/10 text-sage border border-sage/20 px-2 py-0.5 rounded-full">
            {order.orderState}
          </span>
        </div>
        {canReturn && (
          <button
            onClick={() => setShowReturnModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-sm text-charcoal-light hover:text-charcoal hover:border-charcoal transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Return Items
          </button>
        )}
      </div>

      {/* Shipment timeline */}
      {order.shipmentState && (
        <ShipmentTimeline order={order} formatDate={formatDate} />
      )}

      {/* Existing returns */}
      {(order.returnInfo?.length ?? 0) > 0 && (
        <div className="bg-white border border-border rounded-sm p-5 mb-6">
          <h2 className="font-semibold text-charcoal mb-4">Returns</h2>
          <div className="space-y-4">
            {order.returnInfo!.map((batch, i) => (
              <div key={i} className="text-sm">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  {batch.returnTrackingId && (
                    <span className="text-charcoal-light">
                      Tracking: <span className="font-mono text-charcoal">{batch.returnTrackingId}</span>
                    </span>
                  )}
                  {batch.returnDate && (
                    <span className="text-charcoal-light">{formatDate(batch.returnDate)}</span>
                  )}
                </div>
                <div className="space-y-1">
                  {batch.items.map(ri => {
                    const lineItem = order.lineItems.find(l => l.id === ri.lineItemId);
                    return (
                      <div key={ri.id} className="flex gap-2 text-charcoal-light">
                        <span>{lineItem ? getLocalizedString(lineItem.name) : ri.lineItemId}</span>
                        <span>× {ri.quantity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6 mb-6">
        {/* Split-shipment */}
        {isSplitShipment ? (
          <>
            {Array.from(shipmentGroups.entries()).map(([key, items], gi) => {
              const a = addrByKey.get(key);
              return (
                <div key={key} className="bg-white border border-border rounded-sm p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-semibold text-charcoal">Shipment {gi + 1} of {shipmentGroups.size}</h2>
                      {a && (
                        <p className="text-sm text-charcoal-light mt-0.5">
                          Ship to: {a.firstName} {a.lastName} — {inlineAddr(a)}
                        </p>
                      )}
                    </div>
                  </div>
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
                          {formatMoney(Math.round(item.totalPrice.centAmount * (qty / item.quantity)), item.totalPrice.currencyCode)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

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
          /* Single-shipment */
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

        {/* Addresses */}
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

      {showReturnModal && (
        <ReturnModal
          order={order}
          onClose={() => setShowReturnModal(false)}
          getLocalizedString={getLocalizedString}
        />
      )}
    </div>
  );
}
