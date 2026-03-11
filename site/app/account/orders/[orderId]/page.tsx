'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatMoney, getLocalizedString } from '@/lib/utils';

interface LineItem {
  id: string;
  name: Record<string, string>;
  quantity: number;
  totalPrice: { centAmount: number; currencyCode: string };
  recurrenceInfo?: { recurrencePolicy: { id: string } };
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
    taxPortions?: Array<{ name: string; amount: { centAmount: number; currencyCode: string }; rate: number }>;
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
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/account/orders/${orderId}`)
      .then(r => r.json())
      .then(data => {
        setOrder(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [orderId]);

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

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/account/orders" className="text-charcoal-light hover:text-charcoal text-sm">← Orders</Link>
        <span className="text-border">/</span>
        <h1 className="text-2xl font-semibold text-charcoal">Order #{order.orderNumber}</h1>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <p className="text-sm text-charcoal-light">
          {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <span className="text-xs bg-sage/10 text-sage border border-sage/20 px-2 py-0.5 rounded-full">
          {order.orderState}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Items */}
        <div className="md:col-span-2 bg-white border border-border rounded-sm p-5">
          <h2 className="font-semibold text-charcoal mb-4">Items</h2>
          <div className="space-y-3">
            {order.lineItems.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span className="text-charcoal">{getLocalizedString(item.name, 'en-US')}</span>
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

        {/* Shipping */}
        {addr && (
          <div className="bg-white border border-border rounded-sm p-5">
            <h2 className="font-semibold text-charcoal mb-3">Shipping Address</h2>
            <address className="text-sm text-charcoal-light not-italic space-y-0.5">
              <p>{addr.firstName} {addr.lastName}</p>
              <p>{addr.streetNumber ? `${addr.streetNumber} ` : ''}{addr.streetName}</p>
              <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode}</p>
              <p>{addr.country}</p>
            </address>
          </div>
        )}

        {/* Billing */}
        {order.billingAddress && (
          <div className="bg-white border border-border rounded-sm p-5">
            <h2 className="font-semibold text-charcoal mb-3">Billing Address</h2>
            <address className="text-sm text-charcoal-light not-italic space-y-0.5">
              <p>{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
              <p>{order.billingAddress.streetNumber ? `${order.billingAddress.streetNumber} ` : ''}{order.billingAddress.streetName}</p>
              <p>{order.billingAddress.city}{order.billingAddress.state ? `, ${order.billingAddress.state}` : ''} {order.billingAddress.postalCode}</p>
              <p>{order.billingAddress.country}</p>
            </address>
          </div>
        )}
      </div>
    </div>
  );
}
