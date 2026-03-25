'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartSWR } from '@/hooks/useCartSWR';
import { useAccount } from '@/hooks/useAccount';
import { useShippingMethods } from '@/hooks/useShippingMethods';
import { useLocale } from '@/context/LocaleContext';
import {
  formatMoney,
  getLocalizedString,
  isCombinedStreetField,
  formatStreetAddress,
  parseStreetAddress,
} from '@/lib/utils';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface Address {
  key: string;
  firstName: string;
  lastName: string;
  streetName: string;
  streetNumber: string;
  streetAddress: string; // combined field for US-style input
  additionalAddressInfo?: string;
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
  additionalAddressInfo?: string;
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
  const { data: cart, mutate: mutateCart } = useCartSWR();
  const { data: user } = useAccount();
  const isLoggedIn = !!user;
  const { currency, country, locale, localePath } = useLocale();
  const { data: shippingMethodsData = [] } = useShippingMethods();
  const t = useTranslations('checkout');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Shipping addresses (for split shipment: one per shipping group)
  const [primaryAddr, setPrimaryAddr] = useState<Address>({
    key: 'addr-primary',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    streetName: '',
    streetNumber: '',
    streetAddress: '',
    additionalAddressInfo: '',
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

  // Shipping methods from hook
  const [shippingMethods, setShippingMethods] = useState(shippingMethodsData);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>('');

  // Billing address
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddr, setBillingAddr] = useState<Address>({
    key: 'addr-billing',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    streetName: '',
    streetNumber: '',
    streetAddress: '',
    additionalAddressInfo: '',
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

  // Update shipping methods when data arrives from hook
  useEffect(() => {
    if (shippingMethodsData.length > 0) {
      setShippingMethods(shippingMethodsData);
      if (!selectedShippingMethodId) {
        setSelectedShippingMethodId(shippingMethodsData[0].id);
      }
    }
  }, [shippingMethodsData, selectedShippingMethodId]);

  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/account/addresses')
        .then((r) => r.json())
        .then((data) => setSavedAddresses(data.addresses || []))
        .catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    const saved = savedAddresses.find((a) => a.id === id);
    if (saved) {
      setPrimaryAddr((prev) => ({
        ...prev,
        firstName: saved.firstName,
        lastName: saved.lastName,
        streetName: saved.streetName,
        streetNumber: saved.streetNumber || '',
        streetAddress: formatStreetAddress(saved.streetNumber, saved.streetName),
        additionalAddressInfo: saved.additionalAddressInfo || '',
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
        streetAddress: '',
        additionalAddressInfo: '',
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
            addresses: is.addresses.map((a) => (a.addressKey === addressKey ? { ...a, qty } : a)),
          };
        }
        return {
          ...is,
          addresses: [...is.addresses, { addressKey, qty }],
        };
      })
    );
  };

  /** Convert a form Address to the CT API shape (separate streetNumber/streetName) */
  const toApiAddress = (addr: Address) => {
    const isCombined = isCombinedStreetField(addr.country);
    const street = isCombined
      ? parseStreetAddress(addr.streetAddress)
      : { streetNumber: addr.streetNumber, streetName: addr.streetName };
    return {
      key: addr.key,
      firstName: addr.firstName,
      lastName: addr.lastName,
      streetName: street.streetName,
      streetNumber: street.streetNumber,
      additionalAddressInfo: addr.additionalAddressInfo || undefined,
      city: addr.city,
      postalCode: addr.postalCode,
      state: addr.state || undefined,
      country: addr.country,
      email: addr.email || undefined,
    };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const allAddresses = [primaryAddr, ...additionalAddresses].map(toApiAddress);

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

      const billingSource = billingSameAsShipping ? primaryAddr : billingAddr;

      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddresses: allAddresses,
          billingAddress: toApiAddress(billingSource),
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
      mutateCart(null, { revalidate: false });
      router.push(localePath(`/checkout/confirmation/${data.orderId}`));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart || cart.lineItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-charcoal-light">
          {t('emptyCart')}{' '}
          <a href={localePath('/')} className="text-terra hover:underline">
            {t('continueShopping')}
          </a>
        </p>
      </div>
    );
  }

  const allAddresses = [primaryAddr, ...additionalAddresses];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <h1 className="text-charcoal mb-8 text-2xl font-semibold">{t('title')}</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Form */}
        <div className="space-y-8 lg:col-span-3">
          {/* Guest/Login notice */}
          {!isLoggedIn && (
            <div className="bg-cream border-border rounded-sm border p-4 text-sm">
              <span className="text-charcoal-light">{t('guestNotice')} </span>
              <a
                href={localePath('/login') + '?redirect=' + localePath('/checkout')}
                className="text-terra hover:underline"
              >
                {t('signIn')}
              </a>
              <span className="text-charcoal-light"> {t('signInForFaster')}</span>
            </div>
          )}

          {/* Shipping Address */}
          <div>
            <h2 className="text-charcoal mb-4 text-lg font-semibold">{t('shippingAddress')}</h2>
            {savedAddresses.length > 0 && (
              <div className="mb-4">
                <label className="text-charcoal-light mb-1.5 block text-xs font-medium tracking-wider uppercase">
                  {t('useSavedAddress')}
                </label>
                <select
                  value={selectedSavedAddressId}
                  onChange={(e) => applySavedAddress(e.target.value)}
                  className="border-border focus:border-charcoal w-full rounded-sm border bg-white px-3 py-2.5 text-sm focus:outline-none"
                >
                  <option value="">{t('enterNewAddress')}</option>
                  {savedAddresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.firstName} {a.lastName} —{' '}
                      {formatStreetAddress(a.streetNumber, a.streetName)}, {a.city}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('firstName')}
                value={primaryAddr.firstName}
                onChange={(e) => handleAddressChange('firstName', e.target.value)}
                required
              />
              <Input
                label={t('lastName')}
                value={primaryAddr.lastName}
                onChange={(e) => handleAddressChange('lastName', e.target.value)}
                required
              />
              {isCombinedStreetField(primaryAddr.country) ? (
                <>
                  <Input
                    label={t('streetAddress')}
                    value={primaryAddr.streetAddress}
                    onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                    className="col-span-2"
                    required
                    placeholder={t('streetAddressPlaceholder')}
                  />
                  <Input
                    label={t('additionalAddressInfo')}
                    value={primaryAddr.additionalAddressInfo || ''}
                    onChange={(e) => handleAddressChange('additionalAddressInfo', e.target.value)}
                    className="col-span-2"
                    placeholder={t('additionalAddressInfoPlaceholder')}
                  />
                </>
              ) : (
                <>
                  <Input
                    label={t('streetName')}
                    value={primaryAddr.streetName}
                    onChange={(e) => handleAddressChange('streetName', e.target.value)}
                    className="col-span-2"
                    required
                  />
                  <Input
                    label={t('streetNumber')}
                    value={primaryAddr.streetNumber}
                    onChange={(e) => handleAddressChange('streetNumber', e.target.value)}
                    required
                  />
                  <Input
                    label={t('additionalAddressInfo')}
                    value={primaryAddr.additionalAddressInfo || ''}
                    onChange={(e) => handleAddressChange('additionalAddressInfo', e.target.value)}
                    placeholder={t('additionalAddressInfoPlaceholder')}
                  />
                </>
              )}
              <Input
                label={t('city')}
                value={primaryAddr.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                required
              />
              <Input
                label={t('zipPostalCode')}
                value={primaryAddr.postalCode}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                required
              />
              <Input
                label={t('stateRegion')}
                value={primaryAddr.state || ''}
                onChange={(e) => handleAddressChange('state', e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <label className="text-charcoal-light text-xs font-medium tracking-wider uppercase">
                  {t('country')}
                </label>
                <select
                  value={primaryAddr.country}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  className="border-border focus:border-charcoal w-full rounded-sm border bg-white px-3 py-2.5 text-sm focus:outline-none"
                >
                  <option value="US">{t('countryUS')}</option>
                  <option value="GB">{t('countryGB')}</option>
                  <option value="DE">{t('countryDE')}</option>
                </select>
              </div>
              <Input
                label={t('email')}
                type="email"
                value={primaryAddr.email || ''}
                onChange={(e) => handleAddressChange('email', e.target.value)}
                className="col-span-2"
              />
            </div>
          </div>

          {/* Split Shipment */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="split-shipment"
                checked={useSplitShipment}
                onChange={(e) => setUseSplitShipment(e.target.checked)}
                className="accent-charcoal"
              />
              <label
                htmlFor="split-shipment"
                className="text-charcoal cursor-pointer text-sm font-medium"
              >
                {t('splitShipment')}
              </label>
            </div>

            {useSplitShipment && (
              <div className="border-border space-y-6 border-l-2 pl-4">
                {/* Additional addresses */}
                {additionalAddresses.map((addr, index) => (
                  <div key={addr.key} className="space-y-4">
                    <h3 className="text-charcoal text-sm font-medium">
                      {t('address', { num: index + 2 })}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label={t('firstName')}
                        value={addr.firstName}
                        onChange={(e) => updateSplitAddress(index, 'firstName', e.target.value)}
                      />
                      <Input
                        label={t('lastName')}
                        value={addr.lastName}
                        onChange={(e) => updateSplitAddress(index, 'lastName', e.target.value)}
                      />
                      {isCombinedStreetField(addr.country) ? (
                        <>
                          <Input
                            label={t('streetAddress')}
                            value={addr.streetAddress}
                            onChange={(e) =>
                              updateSplitAddress(index, 'streetAddress', e.target.value)
                            }
                            className="col-span-2"
                            placeholder={t('streetAddressPlaceholder')}
                          />
                          <Input
                            label={t('additionalAddressInfo')}
                            value={addr.additionalAddressInfo || ''}
                            onChange={(e) =>
                              updateSplitAddress(index, 'additionalAddressInfo', e.target.value)
                            }
                            className="col-span-2"
                            placeholder={t('additionalAddressInfoPlaceholder')}
                          />
                        </>
                      ) : (
                        <>
                          <Input
                            label={t('streetName')}
                            value={addr.streetName}
                            onChange={(e) =>
                              updateSplitAddress(index, 'streetName', e.target.value)
                            }
                            className="col-span-2"
                          />
                          <Input
                            label={t('streetNumber')}
                            value={addr.streetNumber}
                            onChange={(e) =>
                              updateSplitAddress(index, 'streetNumber', e.target.value)
                            }
                          />
                          <Input
                            label={t('additionalAddressInfo')}
                            value={addr.additionalAddressInfo || ''}
                            onChange={(e) =>
                              updateSplitAddress(index, 'additionalAddressInfo', e.target.value)
                            }
                            placeholder={t('additionalAddressInfoPlaceholder')}
                          />
                        </>
                      )}
                      <Input
                        label={t('city')}
                        value={addr.city}
                        onChange={(e) => updateSplitAddress(index, 'city', e.target.value)}
                      />
                      <Input
                        label={t('zipCode')}
                        value={addr.postalCode}
                        onChange={(e) => updateSplitAddress(index, 'postalCode', e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSplitAddress}
                  className="text-terra flex items-center gap-1 text-sm hover:underline"
                >
                  {t('addAnotherAddress')}
                </button>

                {/* Per-item address assignment */}
                {additionalAddresses.length > 0 && (
                  <div>
                    <h3 className="text-charcoal mb-3 text-sm font-medium">{t('assignItems')}</h3>
                    <div className="space-y-4">
                      {itemShipping.map((is) => (
                        <div key={is.lineItemId} className="text-sm">
                          <p className="text-charcoal mb-2 line-clamp-1 font-medium">
                            {is.productName} (qty: {is.quantity})
                          </p>
                          <div className="space-y-1">
                            {allAddresses.map((addr) => {
                              const current =
                                is.addresses.find((a) => a.addressKey === addr.key)?.qty || 0;
                              return (
                                <div key={addr.key} className="flex items-center gap-3">
                                  <span className="text-charcoal-light w-32 truncate text-xs">
                                    {addr.firstName}{' '}
                                    {addr.lastName || `(Address ${allAddresses.indexOf(addr) + 1})`}
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={is.quantity}
                                    value={current}
                                    onChange={(e) =>
                                      updateItemAddressQty(
                                        is.lineItemId,
                                        addr.key,
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="border-border focus:border-charcoal w-16 rounded-sm border px-2 py-1 text-sm focus:outline-none"
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

          {/* Shipping Method */}
          {shippingMethods.length > 0 && (
            <div>
              <h2 className="text-charcoal mb-4 text-lg font-semibold">{t('shippingMethod')}</h2>
              <div className="space-y-2">
                {shippingMethods.map((method) => {
                  const isFree =
                    method.freeAbove && cart.totalPrice.centAmount >= method.freeAbove.centAmount;
                  return (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-center justify-between rounded-sm border p-4 transition-colors ${
                        selectedShippingMethodId === method.id
                          ? 'border-charcoal bg-cream'
                          : 'border-border hover:border-charcoal/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={method.id}
                          checked={selectedShippingMethodId === method.id}
                          onChange={() => setSelectedShippingMethodId(method.id)}
                          className="accent-charcoal"
                        />
                        <div>
                          <span className="text-charcoal text-sm font-medium">{method.name}</span>
                          {method.description && (
                            <p className="text-charcoal-light mt-0.5 text-xs">
                              {method.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-sm font-medium ${isFree ? 'text-sage' : 'text-charcoal'}`}
                      >
                        {!method.price
                          ? t('tbd')
                          : isFree
                            ? t('free')
                            : formatMoney(method.price.centAmount, method.price.currencyCode)}
                      </span>
                    </label>
                  );
                })}
              </div>
              {(() => {
                const sm = shippingMethods.find((m) => m.id === selectedShippingMethodId);
                if (sm?.freeAbove && cart.totalPrice.centAmount < sm.freeAbove.centAmount) {
                  const remaining = sm.freeAbove.centAmount - cart.totalPrice.centAmount;
                  return (
                    <p className="text-charcoal-light mt-2 text-xs">
                      {t('addMoreForFreeShipping', {
                        amount: formatMoney(remaining, cart.totalPrice.currencyCode),
                      })}
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Billing Address */}
          <div>
            <h2 className="text-charcoal mb-4 text-lg font-semibold">{t('billingAddress')}</h2>
            <div className="mb-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="billing-same"
                checked={billingSameAsShipping}
                onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                className="accent-charcoal"
              />
              <label htmlFor="billing-same" className="text-charcoal cursor-pointer text-sm">
                {t('billingSameAsShipping')}
              </label>
            </div>
            {!billingSameAsShipping && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('firstName')}
                  value={billingAddr.firstName}
                  onChange={(e) => setBillingAddr((p) => ({ ...p, firstName: e.target.value }))}
                  required
                />
                <Input
                  label={t('lastName')}
                  value={billingAddr.lastName}
                  onChange={(e) => setBillingAddr((p) => ({ ...p, lastName: e.target.value }))}
                  required
                />
                {isCombinedStreetField(billingAddr.country) ? (
                  <>
                    <Input
                      label={t('streetAddress')}
                      value={billingAddr.streetAddress}
                      onChange={(e) =>
                        setBillingAddr((p) => ({ ...p, streetAddress: e.target.value }))
                      }
                      className="col-span-2"
                      required
                      placeholder={t('streetAddressPlaceholder')}
                    />
                    <Input
                      label={t('additionalAddressInfo')}
                      value={billingAddr.additionalAddressInfo || ''}
                      onChange={(e) =>
                        setBillingAddr((p) => ({ ...p, additionalAddressInfo: e.target.value }))
                      }
                      className="col-span-2"
                      placeholder={t('additionalAddressInfoPlaceholder')}
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label={t('streetName')}
                      value={billingAddr.streetName}
                      onChange={(e) =>
                        setBillingAddr((p) => ({ ...p, streetName: e.target.value }))
                      }
                      className="col-span-2"
                      required
                    />
                    <Input
                      label={t('streetNumber')}
                      value={billingAddr.streetNumber}
                      onChange={(e) =>
                        setBillingAddr((p) => ({ ...p, streetNumber: e.target.value }))
                      }
                      required
                    />
                    <Input
                      label={t('additionalAddressInfo')}
                      value={billingAddr.additionalAddressInfo || ''}
                      onChange={(e) =>
                        setBillingAddr((p) => ({ ...p, additionalAddressInfo: e.target.value }))
                      }
                      placeholder={t('additionalAddressInfoPlaceholder')}
                    />
                  </>
                )}
                <Input
                  label={t('city')}
                  value={billingAddr.city}
                  onChange={(e) => setBillingAddr((p) => ({ ...p, city: e.target.value }))}
                  required
                />
                <Input
                  label={t('zipPostalCode')}
                  value={billingAddr.postalCode}
                  onChange={(e) => setBillingAddr((p) => ({ ...p, postalCode: e.target.value }))}
                  required
                />
                <Input
                  label={t('stateRegion')}
                  value={billingAddr.state || ''}
                  onChange={(e) => setBillingAddr((p) => ({ ...p, state: e.target.value }))}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-charcoal-light text-xs font-medium tracking-wider uppercase">
                    {t('country')}
                  </label>
                  <select
                    value={billingAddr.country}
                    onChange={(e) => setBillingAddr((p) => ({ ...p, country: e.target.value }))}
                    className="border-border focus:border-charcoal w-full rounded-sm border bg-white px-3 py-2.5 text-sm focus:outline-none"
                  >
                    <option value="US">{t('countryUS')}</option>
                    <option value="GB">{t('countryGB')}</option>
                    <option value="DE">{t('countryDE')}</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Payment */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-charcoal text-lg font-semibold">{t('payment')}</h2>
              <button
                type="button"
                onClick={autoFillCard}
                className="text-terra border-terra/30 hover:bg-terra/5 rounded-sm border px-3 py-1 text-xs transition-colors hover:underline"
              >
                {t('autoFillTestCard')}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('cardNumber')}
                value={payment.cardNumber}
                onChange={(e) => setPayment((p) => ({ ...p, cardNumber: e.target.value }))}
                placeholder="4242 4242 4242 4242"
                className="col-span-2"
              />
              <Input
                label={t('cardholderName')}
                value={payment.cardName}
                onChange={(e) => setPayment((p) => ({ ...p, cardName: e.target.value }))}
                placeholder={t('cardholderNamePlaceholder')}
                className="col-span-2"
              />
              <Input
                label={t('expiryDate')}
                value={payment.cardExpiry}
                onChange={(e) => setPayment((p) => ({ ...p, cardExpiry: e.target.value }))}
                placeholder="MM/YY"
              />
              <Input
                label={t('cvc')}
                value={payment.cardCvc}
                onChange={(e) => setPayment((p) => ({ ...p, cardCvc: e.target.value }))}
                placeholder="123"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            isLoading={submitting}
            disabled={
              !primaryAddr.firstName ||
              !(isCombinedStreetField(primaryAddr.country)
                ? primaryAddr.streetAddress
                : primaryAddr.streetName) ||
              !primaryAddr.city ||
              !payment.cardNumber
            }
          >
            Place Order • {formatMoney(cart.totalPrice.centAmount, cart.totalPrice.currencyCode)}
          </Button>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-cream sticky top-24 rounded-sm p-5">
            <h2 className="text-charcoal mb-4 font-semibold">{t('orderSummary')}</h2>
            <div className="mb-4 space-y-3">
              {cart.lineItems.map((item) => {
                const name = getLocalizedString(item.name, locale);
                const img = item.variant?.images?.[0]?.url;
                return (
                  <div key={item.id} className="flex gap-3">
                    {img && (
                      <div className="bg-cream-dark relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-sm">
                        <Image src={img} alt={name} fill className="object-cover" sizes="48px" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-charcoal line-clamp-1 text-xs font-medium">{name}</p>
                      {item.recurrenceInfo?.recurrencePolicy && (
                        <p className="text-sage text-xs">{t('subscription')}</p>
                      )}
                      <p className="text-charcoal-light mt-0.5 text-xs">
                        {t('qty', { quantity: item.quantity })} ·{' '}
                        {formatMoney(
                          item.price?.value?.centAmount || 0,
                          item.price?.value?.currencyCode || currency
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {(() => {
              const sm =
                shippingMethods.find((m) => m.id === selectedShippingMethodId) ||
                shippingMethods[0];
              const isFree = sm?.freeAbove && cart.totalPrice.centAmount >= sm.freeAbove.centAmount;
              const shippingCost = sm?.price && !isFree ? sm.price.centAmount : 0;
              const taxAmount = cart.taxedPrice
                ? cart.taxedPrice.totalGross.centAmount - cart.taxedPrice.totalNet.centAmount
                : country === 'US'
                  ? Math.round(cart.totalPrice.centAmount * 0.1)
                  : 0;
              const taxIsEstimate = !cart.taxedPrice && taxAmount > 0;
              const total =
                cart.totalPrice.centAmount + shippingCost + (taxIsEstimate ? taxAmount : 0);
              return (
                <div className="border-border space-y-1.5 border-t pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal-light">{t('subtotal')}</span>
                    <span>
                      {formatMoney(cart.totalPrice.centAmount, cart.totalPrice.currencyCode)}
                    </span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-charcoal-light">
                        {taxIsEstimate ? t('estimatedTax') : t('tax')}
                      </span>
                      <span>{formatMoney(taxAmount, cart.totalPrice.currencyCode)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-charcoal-light">
                      {sm?.name ? t('shippingWithMethod', { name: sm.name }) : t('subtotal')}
                    </span>
                    <span className={isFree ? 'text-sage text-xs' : ''}>
                      {!sm?.price ? (
                        <span className="text-xs">{t('calculatedAtOrder')}</span>
                      ) : isFree ? (
                        t('free')
                      ) : (
                        formatMoney(sm.price.centAmount, sm.price.currencyCode)
                      )}
                    </span>
                  </div>
                  <div className="border-border flex justify-between border-t pt-1 font-semibold">
                    <span>{t('estimatedTotal')}</span>
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
