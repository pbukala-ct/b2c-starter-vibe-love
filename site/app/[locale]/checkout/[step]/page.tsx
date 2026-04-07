'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/routing';
import { useCartSWR } from '@/hooks/useCartSWR';
import { useAccount } from '@/hooks/useAccount';
import { useShippingMethods } from '@/hooks/useShippingMethods';
import { useLocale, useCountryConfig } from '@/context/LocaleContext';
import {
  formatMoney,
  getLocalizedString,
  formatStreetAddress,
  toCtAddress,
  DEFAULT_LOCALE,
} from '@/lib/utils';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import CheckoutStep from '@/components/checkout/CheckoutStep';
import StepAddresses from '@/components/checkout/StepAddresses';
import StepShipping from '@/components/checkout/StepShipping';
import StepPayment from '@/components/checkout/StepPayment';
import type { Address, SavedAddress, ItemShipping, Payment } from '@/components/checkout/types';

const STEP_NAMES: Record<1 | 2 | 3, string> = { 1: 'addresses', 2: 'shipping', 3: 'payment' };
const STEP_NUMBERS: Record<string, 1 | 2 | 3> = { addresses: 1, shipping: 2, payment: 3 };

export default function CheckoutStepPage() {
  const router = useRouter();
  const params = useParams();
  const { data: cart, mutate: mutateCart } = useCartSWR();
  const { data: user } = useAccount();
  const isLoggedIn = !!user;
  const { currency, country, locale } = useLocale();
  const countryConfig = useCountryConfig();

  const urlLocaleParam = (params.locale as string) || '';
  const step = (params.step as string) || 'addresses';
  const activeStep: 1 | 2 | 3 = STEP_NUMBERS[step] ?? 1;

  const goToStep = (n: 1 | 2 | 3) => router.push(`/checkout/${STEP_NAMES[n]}`);

  // Derive country from URL locale param so the form matches the current URL
  const countryFromUrl =
    Object.entries(countryConfig).find(
      ([, cfg]) => (cfg as { locale: string }).locale.toLowerCase() === urlLocaleParam.toLowerCase()
    )?.[0] ??
    country ??
    DEFAULT_LOCALE.country;

  const { data: shippingMethodsData = [] } = useShippingMethods();
  const t = useTranslations('checkout');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [primaryAddr, setPrimaryAddr] = useState<Address>({
    key: 'addr-primary',
    firstName: cart?.shippingAddress?.firstName || user?.firstName || '',
    lastName: cart?.shippingAddress?.lastName || user?.lastName || '',
    streetName: cart?.shippingAddress?.streetName || '',
    streetNumber: cart?.shippingAddress?.streetNumber || '',
    streetAddress: formatStreetAddress(
      cart?.shippingAddress?.streetNumber,
      cart?.shippingAddress?.streetName,
      cart?.shippingAddress?.country
    ),
    additionalAddressInfo: cart?.shippingAddress?.additionalAddressInfo || '',
    city: cart?.shippingAddress?.city || '',
    postalCode: cart?.shippingAddress?.postalCode || '',
    state: cart?.shippingAddress?.state || '',
    country: cart?.shippingAddress?.country || countryFromUrl,
    email: user?.email || '',
    phone: cart?.shippingAddress?.phone || '',
  });

  const [additionalAddresses, setAdditionalAddresses] = useState<Address[]>([]);
  const [useSplitShipment, setUseSplitShipment] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string>('');

  const [itemShipping, setItemShipping] = useState<ItemShipping[]>([]);

  const [shippingMethods, setShippingMethods] = useState(shippingMethodsData);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>('');

  const [selectedBillingSavedAddressId, setSelectedBillingSavedAddressId] = useState<string>('');

  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddr, setBillingAddr] = useState<Address>({
    key: 'addr-billing',
    firstName: cart?.billingAddress?.firstName || user?.firstName || '',
    lastName: cart?.billingAddress?.lastName || user?.lastName || '',
    streetName: cart?.billingAddress?.streetName || '',
    streetNumber: cart?.billingAddress?.streetNumber || '',
    streetAddress: formatStreetAddress(
      cart?.billingAddress?.streetNumber,
      cart?.billingAddress?.streetName,
      cart?.billingAddress?.country
    ),
    additionalAddressInfo: '',
    city: cart?.billingAddress?.city || '',
    postalCode: cart?.billingAddress?.postalCode || '',
    state: cart?.billingAddress?.state || '',
    country: cart?.billingAddress?.country || countryFromUrl,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const setFieldError = (key: string, msg: string) =>
    setFieldErrors((prev) => ({ ...prev, [key]: msg }));

  const [payment, setPayment] = useState<Payment>({
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvc: '',
  });

  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  type CartAddress = NonNullable<typeof cart>['shippingAddress'];
  function ctAddrEq(cartAddr: CartAddress, next: ReturnType<typeof toCtAddress>): boolean {
    if (!cartAddr) return false;
    const eq = (a?: string, b?: string) => (a || '') === (b || '');
    return (
      eq(cartAddr.firstName, next.firstName) &&
      eq(cartAddr.lastName, next.lastName) &&
      eq(cartAddr.streetName, next.streetName) &&
      eq(cartAddr.streetNumber, next.streetNumber) &&
      eq(cartAddr.city, next.city) &&
      eq(cartAddr.postalCode, next.postalCode) &&
      eq(cartAddr.country, next.country)
    );
  }

  // Skip guard: redirect if the current step's prerequisites are not met
  useEffect(() => {
    if (cart === undefined) return;
    const hasAddr = !!(cart?.shippingAddress?.streetName && cart?.billingAddress?.streetName);
    const hasMethod = !!cart?.shippingInfo;
    if (step === 'shipping' && !hasAddr) {
      router.replace('/checkout/addresses');
    } else if (step === 'payment' && !hasAddr) {
      router.replace('/checkout/addresses');
    } else if (step === 'payment' && !hasMethod) {
      router.replace('/checkout/shipping');
    }
  }, [cart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update shipping methods when data arrives; pre-select cart's existing method if set
  useEffect(() => {
    if (shippingMethodsData.length > 0) {
      setShippingMethods(shippingMethodsData);
      if (!selectedShippingMethodId) {
        const cartMethodId = cart?.shippingInfo?.shippingMethod?.id;
        const cartMethodExists = shippingMethodsData.some((m) => m.id === cartMethodId);
        setSelectedShippingMethodId(cartMethodExists ? cartMethodId! : shippingMethodsData[0].id);
      }
    }
  }, [shippingMethodsData, selectedShippingMethodId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedShippingMethodId) return;
    if (activeStep !== 2) return;
    if (cartRef.current?.shippingInfo?.shippingMethod?.id === selectedShippingMethodId) return;
    fetch('/api/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shippingMethodId: selectedShippingMethodId }),
    })
      .then((r) => r.json())
      .then((data) => mutateCart(data.cart, { revalidate: false }))
      .catch(() => {});
  }, [selectedShippingMethodId, activeStep]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/account/addresses')
        .then((r) => r.json())
        .then((data) => {
          const addresses: SavedAddress[] = data.addresses || [];
          setSavedAddresses(addresses);

          const cartAddr = cart?.shippingAddress;
          if (cartAddr?.streetName && addresses.length > 0) {
            const norm = (s?: string) => (s || '').trim().toLowerCase();
            const cartMatch = addresses.find(
              (a) =>
                norm(a.streetName) === norm(cartAddr.streetName) &&
                norm(a.streetNumber) === norm(cartAddr.streetNumber) &&
                norm(a.city) === norm(cartAddr.city) &&
                norm(a.postalCode) === norm(cartAddr.postalCode) &&
                norm(a.country) === norm(cartAddr.country)
            );
            if (cartMatch) {
              setSelectedSavedAddressId(cartMatch.id);
            }
          } else if (!cartAddr?.streetName && addresses.length > 0) {
            const match = addresses.find((a) => a.country === country);
            if (match) {
              setSelectedSavedAddressId(match.id);
              setPrimaryAddr((prev) => ({
                ...prev,
                firstName: match.firstName,
                lastName: match.lastName,
                streetName: match.streetName,
                streetNumber: match.streetNumber || '',
                streetAddress: formatStreetAddress(
                  match.streetNumber,
                  match.streetName,
                  match.country
                ),
                additionalAddressInfo: match.additionalAddressInfo || '',
                city: match.city,
                state: match.state || '',
                postalCode: match.postalCode,
                country: match.country,
              }));
            }
          }
        })
        .catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cart) {
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

  // Debounced cart shipping address update
  useEffect(() => {
    if (selectedSavedAddressId) return;
    const {
      firstName,
      lastName,
      streetAddress,
      streetName,
      city,
      postalCode,
      country: c,
    } = primaryAddr;
    const hasStreet = streetAddress || streetName;
    if (!firstName || !lastName || !hasStreet || !city || !postalCode || !c) return;
    if (ctAddrEq(cartRef.current?.shippingAddress, toCtAddress(primaryAddr))) return;
    const timer = setTimeout(() => {
      fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress: toCtAddress(primaryAddr) }),
      })
        .then((r) => r.json())
        .then((data) => mutateCart(data.cart, { revalidate: false }))
        .catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [primaryAddr, selectedSavedAddressId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced cart billing address update
  useEffect(() => {
    if (billingSameAsShipping || selectedBillingSavedAddressId) return;
    const {
      firstName,
      lastName,
      streetAddress,
      streetName,
      city,
      postalCode,
      country: c,
    } = billingAddr;
    const hasStreet = streetAddress || streetName;
    if (!firstName || !lastName || !hasStreet || !city || !postalCode || !c) return;
    if (ctAddrEq(cartRef.current?.billingAddress, toCtAddress(billingAddr))) return;
    const timer = setTimeout(() => {
      fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingAddress: toCtAddress(billingAddr) }),
      })
        .then((r) => r.json())
        .then((data) => mutateCart(data.cart, { revalidate: false }))
        .catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [billingAddr, billingSameAsShipping, selectedBillingSavedAddressId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mirror shipping → billing on cart when same-as-shipping is checked
  useEffect(() => {
    if (!billingSameAsShipping) return;
    const {
      firstName,
      lastName,
      streetAddress,
      streetName,
      city,
      postalCode,
      country: c,
    } = primaryAddr;
    const hasStreet = streetAddress || streetName;
    if (!firstName || !lastName || !hasStreet || !city || !postalCode || !c) return;
    if (ctAddrEq(cartRef.current?.billingAddress, toCtAddress(primaryAddr))) return;
    fetch('/api/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billingAddress: toCtAddress(primaryAddr) }),
    })
      .then((r) => r.json())
      .then((data) => mutateCart(data.cart, { revalidate: false }))
      .catch(() => {});
  }, [billingSameAsShipping, primaryAddr]); // eslint-disable-line react-hooks/exhaustive-deps

  const autoFillCard = () => {
    setPayment({
      cardNumber: '4242 4242 4242 4242',
      cardName: `${user?.firstName || 'Test'} ${user?.lastName || 'User'}`,
      cardExpiry: '12/28',
      cardCvc: '123',
    });
  };

  const patchCartShippingAddress = (addr: SavedAddress) => {
    fetch('/api/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shippingAddress: toCtAddress(addr) }),
    })
      .then((r) => r.json())
      .then((data) => mutateCart(data.cart, { revalidate: false }))
      .catch(() => {});
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
        streetAddress: formatStreetAddress(saved.streetNumber, saved.streetName, saved.country),
        additionalAddressInfo: saved.additionalAddressInfo || '',
        city: saved.city,
        state: saved.state || '',
        postalCode: saved.postalCode,
        country: saved.country,
      }));
      patchCartShippingAddress(saved);
    }
  };

  const applyBillingSavedAddress = (id: string) => {
    setSelectedBillingSavedAddressId(id);
    const saved = savedAddresses.find((a) => a.id === id);
    if (saved) {
      setBillingAddr((prev) => ({
        ...prev,
        firstName: saved.firstName,
        lastName: saved.lastName,
        streetName: saved.streetName,
        streetNumber: saved.streetNumber || '',
        streetAddress: formatStreetAddress(saved.streetNumber, saved.streetName, saved.country),
        additionalAddressInfo: saved.additionalAddressInfo || '',
        city: saved.city,
        state: saved.state || '',
        postalCode: saved.postalCode,
        country: saved.country,
      }));
      fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingAddress: toCtAddress(saved) }),
      })
        .then((r) => r.json())
        .then((data) => mutateCart(data.cart, { revalidate: false }))
        .catch(() => {});
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
        country: countryFromUrl,
      },
    ]);
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
        return { ...is, addresses: [...is.addresses, { addressKey, qty }] };
      })
    );
  };

  const toApiAddress = (addr: Address) => ({
    key: addr.key,
    email: addr.email || undefined,
    ...toCtAddress(addr),
  });

  const handleContinueToShipping = async () => {
    const shippingSource = selectedSavedAddressId
      ? savedAddresses.find((a) => a.id === selectedSavedAddressId)
      : primaryAddr;
    const billingSource = billingSameAsShipping
      ? shippingSource
      : selectedBillingSavedAddressId
        ? savedAddresses.find((a) => a.id === selectedBillingSavedAddressId)
        : billingAddr;

    const body: Record<string, unknown> = {};
    if (shippingSource && !ctAddrEq(cartRef.current?.shippingAddress, toCtAddress(shippingSource))) {
      body.shippingAddress = toCtAddress(shippingSource);
    }
    if (billingSource && !ctAddrEq(cartRef.current?.billingAddress, toCtAddress(billingSource))) {
      body.billingAddress = toCtAddress(billingSource);
    }

    if (Object.keys(body).length > 0) {
      const data = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json());
      await mutateCart(data.cart, { revalidate: false });
    }

    goToStep(2);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const allAddressesForSubmit = [primaryAddr, ...additionalAddresses].map(toApiAddress);
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
          shippingAddresses: allAddressesForSubmit,
          billingAddress: toApiAddress(billingSource),
          lineItemShipping: lineItemShippingDetails,
          shippingMethodId: selectedShippingMethodId,
          paymentInfo: payment,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || 'Checkout failed');
        return;
      }

      mutateCart(null, { revalidate: false });
      router.push(`/checkout/confirmation/${data.orderId}`);
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
          <Link href="/" className="text-terra hover:underline">
            {t('continueShopping')}
          </Link>
        </p>
      </div>
    );
  }

  const allAddresses = [primaryAddr, ...additionalAddresses];

  const shippingDisplay = selectedSavedAddressId
    ? savedAddresses.find((a) => a.id === selectedSavedAddressId)
    : primaryAddr;
  const billingDisplay = billingSameAsShipping
    ? shippingDisplay
    : selectedBillingSavedAddressId
      ? savedAddresses.find((a) => a.id === selectedBillingSavedAddressId)
      : billingAddr;

  const formatAddrLines = (a: {
    firstName?: string;
    lastName?: string;
    streetName?: string;
    streetNumber?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }) => (
    <address className="text-charcoal-light space-y-0.5 text-sm not-italic">
      <p className="text-charcoal font-medium">
        {a.firstName} {a.lastName}
      </p>
      <p>{formatStreetAddress(a.streetNumber, a.streetName, a.country)}</p>
      <p>
        {a.city}
        {a.state ? `, ${a.state}` : ''} {a.postalCode}
      </p>
      <p>{a.country}</p>
    </address>
  );

  const selectedShippingMethod = shippingMethods.find((m) => m.id === selectedShippingMethodId);

  const step1Summary = shippingDisplay ? (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-charcoal-light mb-2 text-xs font-medium tracking-wider uppercase">
          {t('shippingAddress')}
        </p>
        {formatAddrLines(shippingDisplay)}
      </div>
      {billingDisplay && (
        <div>
          <p className="text-charcoal-light mb-2 text-xs font-medium tracking-wider uppercase">
            {t('billingAddress')}
          </p>
          {formatAddrLines(billingDisplay)}
        </div>
      )}
    </div>
  ) : null;

  const step2Summary = selectedShippingMethod ? (
    <>
      <p className="text-charcoal text-sm font-medium">{selectedShippingMethod.name}</p>
      {selectedShippingMethod.price && (
        <p className="text-charcoal-light text-xs">
          {formatMoney(
            selectedShippingMethod.price.centAmount,
            selectedShippingMethod.price.currencyCode
          )}
        </p>
      )}
    </>
  ) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <h1 className="text-charcoal mb-8 text-2xl font-semibold">{t('title')}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Steps */}
        <div className="space-y-3 lg:col-span-3">
          {!isLoggedIn && (
            <div className="bg-cream border-border rounded-sm border p-4 text-sm">
              <span className="text-charcoal-light">{t('guestNotice')} </span>
              <Link
                href="/login?redirect=/checkout"
                className="text-terra hover:underline"
              >
                {t('signIn')}
              </Link>
              <span className="text-charcoal-light"> {t('signInForFaster')}</span>
            </div>
          )}

          <CheckoutStep
            step={1}
            title={t('shippingAddress')}
            activeStep={activeStep}
            editLabel={t('edit')}
            onEdit={() => goToStep(1)}
            summary={step1Summary}
          >
            <StepAddresses
              primaryAddr={primaryAddr}
              onChangePrimary={(v) => setPrimaryAddr((prev) => ({ ...prev, ...v }))}
              savedAddresses={savedAddresses}
              selectedSavedAddressId={selectedSavedAddressId}
              onSelectSavedAddress={applySavedAddress}
              billingAddr={billingAddr}
              onChangeBilling={(v) => setBillingAddr((prev) => ({ ...prev, ...v }))}
              billingSameAsShipping={billingSameAsShipping}
              onBillingSameAsShippingChange={setBillingSameAsShipping}
              selectedBillingSavedAddressId={selectedBillingSavedAddressId}
              onSelectBillingSavedAddress={applyBillingSavedAddress}
              useSplitShipment={useSplitShipment}
              onSplitShipmentChange={setUseSplitShipment}
              additionalAddresses={additionalAddresses}
              allAddresses={allAddresses}
              onAddSplitAddress={addSplitAddress}
              onChangeAdditional={(index, v) =>
                setAdditionalAddresses((prev) =>
                  prev.map((a, i) => (i === index ? { ...a, ...v } : a))
                )
              }
              itemShipping={itemShipping}
              onUpdateItemQty={updateItemAddressQty}
              fieldErrors={fieldErrors}
              onFieldError={setFieldError}
              onContinue={handleContinueToShipping}
            />
          </CheckoutStep>

          <CheckoutStep
            step={2}
            title={t('shippingMethod')}
            activeStep={activeStep}
            editLabel={t('edit')}
            onEdit={() => goToStep(2)}
            summary={step2Summary}
          >
            <StepShipping
              shippingMethods={shippingMethods}
              selectedShippingMethodId={selectedShippingMethodId}
              onSelect={setSelectedShippingMethodId}
              cartTotalCentAmount={cart.totalPrice.centAmount}
              cartCurrencyCode={cart.totalPrice.currencyCode}
              onContinue={() => goToStep(3)}
            />
          </CheckoutStep>

          <CheckoutStep step={3} title={t('payment')} activeStep={activeStep}>
            <StepPayment
              payment={payment}
              onChange={setPayment}
              onAutoFill={autoFillCard}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={error}
              disabled={
                !primaryAddr.firstName ||
                !(primaryAddr.streetAddress || primaryAddr.streetName) ||
                !primaryAddr.city ||
                !payment.cardNumber ||
                Object.values(fieldErrors).some(Boolean)
              }
              cartTotalCentAmount={cart.totalPrice.centAmount}
              cartCurrencyCode={cart.totalPrice.currencyCode}
            />
          </CheckoutStep>
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
                      <div className="bg-cream-dark relative h-12 w-12 shrink-0 overflow-hidden rounded-sm">
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
