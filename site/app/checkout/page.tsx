'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { formatMoney, getLocalizedString } from '@/lib/utils';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

type Step = 'shipping' | 'split' | 'payment' | 'review';

interface Address {
  key: string;
  firstName: string;
  lastName: string;
  streetName: string;
  streetNumber: string;
  city: string;
  postalCode: string;
  state?: string;
  country: string;
  email?: string;
}

interface SavedAddress {
  id: string;
  firstName: string;
  lastName: string;
  streetName: string;
  streetNumber?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

interface ItemShipping {
  lineItemId: string;
  productName: string;
  quantity: number;
  addresses: Array<{ addressKey: string; qty: number }>;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, setCart, refreshCart } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { currency, country, locale } = useLocale();
  const [step, setStep] = useState<Step>('shipping');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Shipping addresses (for split shipment: one per shipping group)
  const [primaryAddr, setPrimaryAddr] = useState<Address>({
    key: 'addr-primary',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    streetName: '',
    streetNumber: '',
    city: '',
    postalCode: '',
    state: '',
    country: country || 'US',
    email: user?.email || '',
  });

  const [additionalAddresses, setAdditionalAddresses] = useState<Address[]>([]);
  const [useSplitShipment, setUseSplitShipment] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string>('');

  // Per-item shipping assignments
  const [itemShipping, setItemShipping] = useState<ItemShipping[]>([]);

  // Shipping methods
  const [shippingMethods, setShippingMethods] = useState<Array<{
    id: string; name: string; description?: string;
    price: { centAmount: number; currencyCode: string } | null;
    freeAbove: { centAmount: number } | null;
  }>>([]);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>('');

  // Billing address
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddr, setBillingAddr] = useState<Address>({
    key: 'addr-billing',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    streetName: '',
    streetNumber: '',
    city: '',
    postalCode: '',
    state: '',
    country: country || 'US',
  });

  // Payment
  const [payment, setPayment] = useState({
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvc: '',
  });

  useEffect(() => {
    refreshCart();
    fetch(`/api/shipping-methods?country=${country}&currency=${currency}`)
      .then(r => r.json())
      .then(data => {
        if (data.shippingMethods?.length) {
          setShippingMethods(data.shippingMethods);
          setSelectedShippingMethodId(data.shippingMethods[0].id);
        }
      })
      .catch(() => {});
    if (isLoggedIn) {
      fetch('/api/account/addresses')
        .then(r => r.json())
        .then(data => setSavedAddresses(data.addresses || []))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (cart) {
      // Initialize item shipping with all items going to primary address
      setItemShipping(
        cart.lineItems.map((item) => ({
          lineItemId: item.id,
          productName: getLocalizedString(item.name, locale),
          quantity: item.quantity,
          addresses: [{ addressKey: 'addr-primary', qty: item.quantity }],
        }))
      );
    }
  }, [cart, locale]);

  // Auto-fill dummy credit card
  const autoFillCard = () => {
    setPayment({
      cardNumber: '4242 4242 4242 4242',
      cardName: `${user?.firstName || 'Test'} ${user?.lastName || 'User'}`,
      cardExpiry: '12/28',
      cardCvc: '123',
    });
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setPrimaryAddr((prev) => ({ ...prev, [field]: value }));
  };

  const applySavedAddress = (id: string) => {
    setSelectedSavedAddressId(id);
    const saved = savedAddresses.find(a => a.id === id);
    if (saved) {
      setPrimaryAddr(prev => ({
        ...prev,
        firstName: saved.firstName,
        lastName: saved.lastName,
        streetName: saved.streetName,
        streetNumber: saved.streetNumber || '',
        city: saved.city,
        state: saved.state || '',
        postalCode: saved.postalCode,
        country: saved.country,
      }));
    }
  };

  const addSplitAddress = () => {
    const key = `addr-split-${additionalAddresses.length + 1}`;
    setAdditionalAddresses((prev) => [
      ...prev,
      {
        key,
        firstName: '',
        lastName: '',
        streetName: '',
        streetNumber: '',
        city: '',
        postalCode: '',
        state: '',
        country: country || 'US',
      },
    ]);
  };

  const updateSplitAddress = (index: number, field: keyof Address, value: string) => {
    setAdditionalAddresses((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  };

  const updateItemAddressQty = (lineItemId: string, addressKey: string, qty: number) => {
    setItemShipping((prev) =>
      prev.map((is) => {
        if (is.lineItemId !== lineItemId) return is;
        const existing = is.addresses.find((a) => a.addressKey === addressKey);
        if (existing) {
          return {
            ...is,
            addresses: is.addresses.map((a) =>
              a.addressKey === addressKey ? { ...a, qty } : a
            ),
          };
        }
        return {
          ...is,
          addresses: [...is.addresses, { addressKey, qty }],
        };
      })
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const allAddresses = [primaryAddr, ...additionalAddresses];

      // Build line item shipping details
      const lineItemShippingDetails = useSplitShipment
        ? itemShipping.map((is) => ({
            lineItemId: is.lineItemId,
            targets: is.addresses
              .filter((a) => a.qty > 0)
              .map((a) => ({ addressKey: a.addressKey, quantity: a.qty })),
          }))
        : cart?.lineItems.map((item) => ({
            lineItemId: item.id,
            targets: [{ addressKey: 'addr-primary', quantity: item.quantity }],
          })) || [];

      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddresses: allAddresses,
          billingAddress: billingSameAsShipping ? primaryAddr : billingAddr,
          lineItemShipping: lineItemShippingDetails,
          shippingMethodId: selectedShippingMethodId,
          paymentInfo: payment,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || 'Checkout failed');
      }

      const data = await resp.json();
      setCart(null);
      router.push(`/checkout/confirmation/${data.orderId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart || cart.lineItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-charcoal-light">Your cart is empty. <a href="/" className="text-terra hover:underline">Continue shopping</a></p>
      </div>
    );
  }

  const allAddresses = [primaryAddr, ...additionalAddresses];
  const hasSubscriptions = cart.lineItems.some((i) => i.recurrenceInfo?.recurrencePolicy);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-charcoal mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3 space-y-8">
          {/* Guest/Login notice */}
          {!isLoggedIn && (
            <div className="bg-cream border border-border rounded-sm p-4 text-sm">
              <span className="text-charcoal-light">Have an account? </span>
              <a href="/login?redirect=/checkout" className="text-terra hover:underline">Sign in</a>
              <span className="text-charcoal-light"> for faster checkout</span>
            </div>
          )}

          {/* Shipping Address */}
          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-4">Shipping Address</h2>
            {savedAddresses.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-medium text-charcoal-light uppercase tracking-wider block mb-1.5">
                  Use a saved address
                </label>
                <select
                  value={selectedSavedAddressId}
                  onChange={e => applySavedAddress(e.target.value)}
                  className="w-full border border-border px-3 py-2.5 text-sm rounded-sm bg-white focus:outline-none focus:border-charcoal"
                >
                  <option value="">— Enter a new address —</option>
                  {savedAddresses.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.firstName} {a.lastName} — {a.streetNumber ? `${a.streetNumber} ` : ''}{a.streetName}, {a.city}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={primaryAddr.firstName} onChange={(e) => handleAddressChange('firstName', e.target.value)} required />
              <Input label="Last Name" value={primaryAddr.lastName} onChange={(e) => handleAddressChange('lastName', e.target.value)} required />
              <Input label="Street Name" value={primaryAddr.streetName} onChange={(e) => handleAddressChange('streetName', e.target.value)} className="col-span-2" required />
              <Input label="Street Number" value={primaryAddr.streetNumber} onChange={(e) => handleAddressChange('streetNumber', e.target.value)} required />
              <Input label="City" value={primaryAddr.city} onChange={(e) => handleAddressChange('city', e.target.value)} required />
              <Input label="ZIP / Postal Code" value={primaryAddr.postalCode} onChange={(e) => handleAddressChange('postalCode', e.target.value)} required />
              <Input label="State / Region" value={primaryAddr.state || ''} onChange={(e) => handleAddressChange('state', e.target.value)} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-charcoal-light uppercase tracking-wider">Country</label>
                <select
                  value={primaryAddr.country}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  className="w-full border border-border px-3 py-2.5 text-sm rounded-sm bg-white focus:outline-none focus:border-charcoal"
                >
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="DE">Germany</option>
                </select>
              </div>
              <Input label="Email" type="email" value={primaryAddr.email || ''} onChange={(e) => handleAddressChange('email', e.target.value)} className="col-span-2" />
            </div>
          </div>

          {/* Split Shipment */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="split-shipment"
                checked={useSplitShipment}
                onChange={(e) => setUseSplitShipment(e.target.checked)}
                className="accent-charcoal"
              />
              <label htmlFor="split-shipment" className="text-sm font-medium text-charcoal cursor-pointer">
                Ship to multiple addresses (split shipment)
              </label>
            </div>

            {useSplitShipment && (
              <div className="space-y-6 pl-4 border-l-2 border-border">
                {/* Additional addresses */}
                {additionalAddresses.map((addr, index) => (
                  <div key={addr.key} className="space-y-4">
                    <h3 className="text-sm font-medium text-charcoal">Address {index + 2}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="First Name" value={addr.firstName} onChange={(e) => updateSplitAddress(index, 'firstName', e.target.value)} />
                      <Input label="Last Name" value={addr.lastName} onChange={(e) => updateSplitAddress(index, 'lastName', e.target.value)} />
                      <Input label="Street Name" value={addr.streetName} onChange={(e) => updateSplitAddress(index, 'streetName', e.target.value)} className="col-span-2" />
                      <Input label="Street Number" value={addr.streetNumber} onChange={(e) => updateSplitAddress(index, 'streetNumber', e.target.value)} />
                      <Input label="City" value={addr.city} onChange={(e) => updateSplitAddress(index, 'city', e.target.value)} />
                      <Input label="ZIP Code" value={addr.postalCode} onChange={(e) => updateSplitAddress(index, 'postalCode', e.target.value)} />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSplitAddress}
                  className="text-sm text-terra hover:underline flex items-center gap-1"
                >
                  + Add another address
                </button>

                {/* Per-item address assignment */}
                {additionalAddresses.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-charcoal mb-3">Assign items to addresses</h3>
                    <div className="space-y-4">
                      {itemShipping.map((is) => (
                        <div key={is.lineItemId} className="text-sm">
                          <p className="font-medium text-charcoal mb-2 line-clamp-1">{is.productName} (qty: {is.quantity})</p>
                          <div className="space-y-1">
                            {allAddresses.map((addr) => {
                              const current = is.addresses.find((a) => a.addressKey === addr.key)?.qty || 0;
                              return (
                                <div key={addr.key} className="flex items-center gap-3">
                                  <span className="text-charcoal-light text-xs w-32 truncate">
                                    {addr.firstName} {addr.lastName || `(Address ${allAddresses.indexOf(addr) + 1})`}
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={is.quantity}
                                    value={current}
                                    onChange={(e) => updateItemAddressQty(is.lineItemId, addr.key, parseInt(e.target.value) || 0)}
                                    className="w-16 border border-border px-2 py-1 text-sm rounded-sm focus:outline-none focus:border-charcoal"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Billing Address */}
          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-4">Billing Address</h2>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="billing-same"
                checked={billingSameAsShipping}
                onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                className="accent-charcoal"
              />
              <label htmlFor="billing-same" className="text-sm text-charcoal cursor-pointer">
                Same as shipping address
              </label>
            </div>
            {!billingSameAsShipping && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={billingAddr.firstName} onChange={(e) => setBillingAddr(p => ({ ...p, firstName: e.target.value }))} required />
                <Input label="Last Name" value={billingAddr.lastName} onChange={(e) => setBillingAddr(p => ({ ...p, lastName: e.target.value }))} required />
                <Input label="Street Name" value={billingAddr.streetName} onChange={(e) => setBillingAddr(p => ({ ...p, streetName: e.target.value }))} className="col-span-2" required />
                <Input label="Street Number" value={billingAddr.streetNumber} onChange={(e) => setBillingAddr(p => ({ ...p, streetNumber: e.target.value }))} required />
                <Input label="City" value={billingAddr.city} onChange={(e) => setBillingAddr(p => ({ ...p, city: e.target.value }))} required />
                <Input label="ZIP / Postal Code" value={billingAddr.postalCode} onChange={(e) => setBillingAddr(p => ({ ...p, postalCode: e.target.value }))} required />
                <Input label="State / Region" value={billingAddr.state || ''} onChange={(e) => setBillingAddr(p => ({ ...p, state: e.target.value }))} />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-charcoal-light uppercase tracking-wider">Country</label>
                  <select
                    value={billingAddr.country}
                    onChange={(e) => setBillingAddr(p => ({ ...p, country: e.target.value }))}
                    className="w-full border border-border px-3 py-2.5 text-sm rounded-sm bg-white focus:outline-none focus:border-charcoal"
                  >
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Payment */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-charcoal">Payment</h2>
              <button
                type="button"
                onClick={autoFillCard}
                className="text-xs text-terra hover:underline border border-terra/30 px-3 py-1 rounded-sm hover:bg-terra/5 transition-colors"
              >
                Auto-fill test card
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Card Number"
                value={payment.cardNumber}
                onChange={(e) => setPayment((p) => ({ ...p, cardNumber: e.target.value }))}
                placeholder="4242 4242 4242 4242"
                className="col-span-2"
              />
              <Input
                label="Cardholder Name"
                value={payment.cardName}
                onChange={(e) => setPayment((p) => ({ ...p, cardName: e.target.value }))}
                placeholder="Full name on card"
                className="col-span-2"
              />
              <Input
                label="Expiry Date"
                value={payment.cardExpiry}
                onChange={(e) => setPayment((p) => ({ ...p, cardExpiry: e.target.value }))}
                placeholder="MM/YY"
              />
              <Input
                label="CVC"
                value={payment.cardCvc}
                onChange={(e) => setPayment((p) => ({ ...p, cardCvc: e.target.value }))}
                placeholder="123"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-sm">
              {error}
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            isLoading={submitting}
            disabled={!primaryAddr.firstName || !primaryAddr.streetName || !primaryAddr.city || !payment.cardNumber}
          >
            Place Order • {formatMoney(cart.totalPrice.centAmount, cart.totalPrice.currencyCode)}
          </Button>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-cream p-5 rounded-sm sticky top-24">
            <h2 className="font-semibold text-charcoal mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {cart.lineItems.map((item) => {
                const name = getLocalizedString(item.name, locale);
                const img = item.variant?.images?.[0]?.url;
                return (
                  <div key={item.id} className="flex gap-3">
                    {img && (
                      <div className="w-12 h-12 relative flex-shrink-0 bg-cream-dark rounded-sm overflow-hidden">
                        <Image src={img} alt={name} fill className="object-cover" sizes="48px" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-charcoal line-clamp-1">{name}</p>
                      {item.recurrenceInfo?.recurrencePolicy && (
                        <p className="text-xs text-sage">♻ Subscription</p>
                      )}
                      <p className="text-xs text-charcoal-light mt-0.5">
                        Qty: {item.quantity} · {formatMoney(item.price?.value?.centAmount || 0, item.price?.value?.currencyCode || currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {(() => {
              const sm = shippingMethods.find(m => m.id === selectedShippingMethodId) || shippingMethods[0];
              const isFree = sm?.freeAbove && cart.totalPrice.centAmount >= sm.freeAbove.centAmount;
              const shippingCost = (sm?.price && !isFree) ? sm.price.centAmount : 0;
              const taxAmount = cart.taxedPrice
                ? cart.taxedPrice.totalGross.centAmount - cart.taxedPrice.totalNet.centAmount
                : country === 'US' ? Math.round(cart.totalPrice.centAmount * 0.1) : 0;
              const taxIsEstimate = !cart.taxedPrice && taxAmount > 0;
              const total = cart.totalPrice.centAmount + shippingCost + (taxIsEstimate ? taxAmount : 0);
              return (
                <div className="border-t border-border pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal-light">Subtotal</span>
                    <span>{formatMoney(cart.totalPrice.centAmount, cart.totalPrice.currencyCode)}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-charcoal-light">{taxIsEstimate ? 'Est. Tax (10%)' : 'Tax'}</span>
                      <span>{formatMoney(taxAmount, cart.totalPrice.currencyCode)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-charcoal-light">
                      {sm?.name ? `Shipping (${sm.name})` : 'Shipping'}
                    </span>
                    <span className={isFree ? 'text-sage text-xs' : ''}>
                      {!sm?.price ? <span className="text-xs">Calculated at order</span> : isFree ? 'Free' : formatMoney(sm.price.centAmount, sm.price.currencyCode)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-border">
                    <span>Estimated Total</span>
                    <span>{formatMoney(total, cart.totalPrice.currencyCode)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
