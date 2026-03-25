'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AgentRole } from '@/lib/agent-session';

interface CartLineItem {
  id: string;
  name: Record<string, string>;
  sku: string;
  quantity: number;
  unitPrice: { centAmount: number; currencyCode: string; fractionDigits: number };
  totalPrice: { centAmount: number; currencyCode: string; fractionDigits: number };
}

interface Cart {
  id: string;
  version: number;
  lineItems: CartLineItem[];
  discountCodes: Array<{ discountCode: { id: string; obj?: { code: string } } }>;
  shippingAddress: Record<string, string> | null;
  totalPrice: { centAmount: number; currencyCode: string; fractionDigits: number };
  lastModifiedAt: string;
  isStale: boolean;
}

interface CustomerDetailClientProps {
  customerId: string;
  agentRole: AgentRole;
  initialCart: Cart | null;
}

function formatMoney(amount: number, currency: string, fractionDigits: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
  }).format(amount / Math.pow(10, fractionDigits));
}

function broadcastCartUpdate() {
  try {
    const channel = new BroadcastChannel('cart-updates');
    channel.postMessage({ type: 'cart-updated' });
    channel.close();
  } catch {
    // BroadcastChannel not supported — silent no-op
  }
}

export default function CustomerDetailClient({
  customerId,
  agentRole,
  initialCart,
}: CustomerDetailClientProps) {
  const router = useRouter();
  const canEdit = agentRole === 'order-placement';

  const [cart, setCart] = useState<Cart | null>(initialCart);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add item state
  const [addSku, setAddSku] = useState('');

  // Discount code state
  const [discountCode, setDiscountCode] = useState('');

  // Shipping address state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    firstName: '', lastName: '', streetName: '', streetNumber: '',
    city: '', postalCode: '', country: 'US',
  });

  // Checkout state
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<{ orderId: string; orderNumber: string } | null>(null);

  // Address picker state
  interface SavedAddress {
    id?: string;
    firstName?: string;
    lastName?: string;
    streetName?: string;
    streetNumber?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  }
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  async function refreshCart() {
    const res = await fetch(`/api/agent/customers/${customerId}/cart`);
    if (res.ok) {
      const data = await res.json();
      setCart(data.cart);
    }
  }

  function flash(msg: string, isError = false) {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!addSku.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/customers/${customerId}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: addSku.trim(), quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) { flash(data.error ?? 'Failed to add item', true); return; }
      setAddSku('');
      await refreshCart();
      broadcastCartUpdate();
      flash('Item added to cart');
    } finally { setLoading(false); }
  }

  async function handleRemoveItem(lineItemId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/customers/${customerId}/cart/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineItemId }),
      });
      const data = await res.json();
      if (!res.ok) { flash(data.error ?? 'Failed to remove item', true); return; }
      await refreshCart();
      broadcastCartUpdate();
      flash('Item removed');
    } finally { setLoading(false); }
  }

  async function handleQuantityChange(lineItemId: string, quantity: number) {
    if (quantity < 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/customers/${customerId}/cart/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineItemId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) { flash(data.error ?? 'Failed to update quantity', true); return; }
      await refreshCart();
      broadcastCartUpdate();
    } finally { setLoading(false); }
  }

  async function handleApplyDiscount(e: React.FormEvent) {
    e.preventDefault();
    if (!discountCode.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/customers/${customerId}/cart/discounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { flash(data.error ?? 'Invalid discount code', true); return; }
      setDiscountCode('');
      await refreshCart();
      broadcastCartUpdate();
      flash('Discount code applied');
    } finally { setLoading(false); }
  }

  async function handleRemoveDiscount(discountCodeId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/customers/${customerId}/cart/discounts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountCodeId }),
      });
      const data = await res.json();
      if (!res.ok) { flash(data.error ?? 'Failed to remove discount', true); return; }
      await refreshCart();
      broadcastCartUpdate();
      flash('Discount code removed');
    } finally { setLoading(false); }
  }

  async function handleAddressUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/customers/${customerId}/cart/address`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error ?? 'Failed to update address', true);
        return;
      }
      setShowAddressForm(false);
      await refreshCart();
      broadcastCartUpdate();
      flash('Shipping address updated');
    } finally { setLoading(false); }
  }

  async function openCheckoutModal() {
    setShowCheckoutConfirm(true);
    // Fetch saved addresses for the picker
    const res = await fetch(`/api/agent/customers/${customerId}/addresses`);
    if (res.ok) {
      const data = await res.json();
      setSavedAddresses(data.addresses ?? []);
      // Pre-select address that matches cart shipping address if any
      if (cart?.shippingAddress) {
        const matched = (data.addresses ?? []).find((a: { id?: string; streetName?: string; city?: string }) =>
          a.streetName === cart.shippingAddress?.streetName && a.city === cart.shippingAddress?.city
        );
        setSelectedAddressId(matched?.id ?? null);
      } else {
        setSelectedAddressId(null);
      }
    }
  }

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      // If a different address was selected, update the cart shipping address first
      if (selectedAddressId) {
        const selected = savedAddresses.find((a) => a.id === selectedAddressId);
        if (selected) {
          const addrRes = await fetch(`/api/agent/customers/${customerId}/cart/address`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selected),
          });
          if (!addrRes.ok) {
            const d = await addrRes.json();
            flash(d.error ?? 'Failed to set shipping address', true);
            setShowCheckoutConfirm(false);
            return;
          }
          await refreshCart();
        }
      }

      const res = await fetch(`/api/agent/customers/${customerId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: 'agent-assisted',
          confirmationToken: 'confirmed',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error ?? 'Checkout failed', true);
        setShowCheckoutConfirm(false);
        return;
      }
      setCheckoutResult({ orderId: data.orderId, orderNumber: data.orderNumber });
      setShowCheckoutConfirm(false);
      setCart(null);
      flash(`Order ${data.orderNumber} placed successfully`);
    } finally { setCheckoutLoading(false); }
  }

  const itemName = (item: CartLineItem) =>
    item.name['en-US'] ?? item.name[Object.keys(item.name)[0]] ?? '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customer Session</h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">{customerId}</p>
        </div>
        <button
          onClick={() => router.push('/agent/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to search
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {checkoutResult && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
          Order <strong>{checkoutResult.orderNumber}</strong> placed. Confirmation email sent to customer.
        </div>
      )}

      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Active Cart</h2>

        {!cart && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">This customer has no active cart.</p>
          </div>
        )}

        {cart && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {cart.isStale && (
              <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-800">
                ⚠ Cart was last modified more than 24 hours ago (
                {new Date(cart.lastModifiedAt).toLocaleString()})
              </div>
            )}

            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                  {canEdit && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-gray-900">{itemName(item)}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.sku}</td>
                    <td className="px-4 py-3 text-right">
                      {canEdit ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={loading}
                            className="w-6 h-6 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={loading}
                            className="w-6 h-6 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {formatMoney(item.unitPrice.centAmount, item.unitPrice.currencyCode, item.unitPrice.fractionDigits)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatMoney(item.totalPrice.centAmount, item.totalPrice.currencyCode, item.totalPrice.fractionDigits)}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={loading}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50">
                <tr>
                  <td colSpan={canEdit ? 4 : 3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                    Cart total
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatMoney(cart.totalPrice.centAmount, cart.totalPrice.currencyCode, cart.totalPrice.fractionDigits)}
                  </td>
                  {canEdit && <td />}
                </tr>
              </tfoot>
            </table>

            {/* Discount codes */}
            <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center gap-2 text-xs">
              {cart.discountCodes.length > 0 ? (
                cart.discountCodes.map((dc) => (
                  <span key={dc.discountCode.id} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5">
                    {dc.discountCode?.obj?.code ?? '(code)'}
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveDiscount(dc.discountCode.id)}
                        disabled={loading}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-40 ml-1"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-gray-400">No discount codes applied</span>
              )}
              {canEdit && (
                <form onSubmit={handleApplyDiscount} className="flex gap-1 ml-auto">
                  <input
                    type="text"
                    placeholder="Discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-0.5 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={loading || !discountCode.trim()}
                    className="bg-gray-700 text-white rounded px-2 py-0.5 text-xs hover:bg-gray-600 disabled:opacity-40"
                  >
                    Apply
                  </button>
                </form>
              )}
            </div>

            {/* Shipping address */}
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-600">
              {cart.shippingAddress ? (
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-medium text-gray-700">Ship to: </span>
                    {cart.shippingAddress.streetNumber} {cart.shippingAddress.streetName},{' '}
                    {cart.shippingAddress.city}, {cart.shippingAddress.postalCode},{' '}
                    {cart.shippingAddress.country}
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="text-xs text-blue-600 hover:text-blue-800 ml-4 shrink-0"
                    >
                      Edit address
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">No shipping address set</span>
                  {canEdit && (
                    <button
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Add address
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Address form */}
            {showAddressForm && canEdit && (
              <form onSubmit={handleAddressUpdate} className="px-4 py-4 border-t border-gray-100 bg-gray-50">
                <h3 className="text-xs font-medium text-gray-700 mb-3">Shipping address</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(['firstName', 'lastName', 'streetName', 'streetNumber', 'city', 'postalCode'] as const).map((field) => (
                    <div key={field}>
                      <label className="block text-gray-500 mb-0.5 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                      <input
                        type="text"
                        required={field !== 'streetNumber'}
                        value={addressForm[field]}
                        onChange={(e) => setAddressForm({ ...addressForm, [field]: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-gray-500 mb-0.5">Country</label>
                    <select
                      value={addressForm.country}
                      onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    >
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="DE">Germany</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gray-900 text-white rounded px-3 py-1 text-xs hover:bg-gray-800 disabled:opacity-40"
                  >
                    Save address
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="bg-white border border-gray-300 text-gray-700 rounded px-3 py-1 text-xs hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Add item */}
            {canEdit && (
              <form onSubmit={handleAddItem} className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Add item by SKU"
                  value={addSku}
                  onChange={(e) => setAddSku(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
                <button
                  type="submit"
                  disabled={loading || !addSku.trim()}
                  className="bg-gray-900 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800 disabled:opacity-40"
                >
                  Add
                </button>
              </form>
            )}

            {/* Checkout */}
            {canEdit && cart.lineItems.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
                <button
                  onClick={openCheckoutModal}
                  className="bg-green-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-600"
                >
                  Place order on behalf of customer →
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Checkout confirmation modal */}
      {showCheckoutConfirm && cart && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Confirm order placement</h2>
            <p className="text-sm text-gray-600 mb-4">
              You are about to place an order on behalf of customer{' '}
              <strong className="font-mono text-xs">{customerId}</strong>.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items</span>
                <span className="font-medium">{cart.lineItems.length}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Order total</span>
                <span className="font-semibold">
                  {formatMoney(cart.totalPrice.centAmount, cart.totalPrice.currencyCode, cart.totalPrice.fractionDigits)}
                </span>
              </div>
            </div>

            {/* Address picker */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-700 mb-2">Shipping address</p>
              {savedAddresses.length === 0 && !cart.shippingAddress && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  No saved addresses. Please add an address in the Address Book below, or set one via the cart address form.
                </p>
              )}
              {savedAddresses.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {savedAddresses.map((addr) => (
                    addr.id && (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-2 p-2 rounded border cursor-pointer text-xs ${
                          selectedAddressId === addr.id
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="checkoutAddress"
                          value={addr.id}
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id!)}
                          className="mt-0.5"
                        />
                        <span className="text-gray-700">
                          <span className="font-medium">{addr.firstName} {addr.lastName}</span>
                          <br />
                          {addr.streetNumber} {addr.streetName}, {addr.city}, {addr.postalCode}, {addr.country}
                        </span>
                      </label>
                    )
                  ))}
                </div>
              )}
              {savedAddresses.length === 0 && cart.shippingAddress && (
                <p className="text-xs text-gray-600 bg-gray-50 rounded border border-gray-200 px-3 py-2">
                  Using cart address: {cart.shippingAddress.city}, {cart.shippingAddress.country}
                </p>
              )}
            </div>

            <p className="text-xs text-gray-500 mb-4">
              A confirmation email will be sent to the customer indicating this order was placed with agent assistance.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCheckoutConfirm(false)}
                disabled={checkoutLoading}
                className="border border-gray-300 text-gray-700 rounded px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading || (savedAddresses.length === 0 && !cart.shippingAddress) || (savedAddresses.length > 0 && !selectedAddressId && !cart.shippingAddress)}
                className="bg-green-700 text-white rounded px-4 py-2 text-sm font-medium hover:bg-green-600 disabled:opacity-40"
              >
                {checkoutLoading ? 'Placing order…' : 'Confirm & place order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
