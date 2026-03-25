'use client';

import { useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { isCombinedStreetField, formatStreetAddress, parseStreetAddress } from '@/lib/utils';
import { useAddresses, useAddressMutations } from '@/hooks/useAddresses';
import type { Address } from '@/hooks/useAddresses';
import { useTranslations } from 'next-intl';

const emptyAddress: Address = {
  firstName: '',
  lastName: '',
  streetName: '',
  streetNumber: '',
  streetAddress: '',
  additionalAddressInfo: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  phone: '',
};

type DefaultType = '' | 'shipping' | 'billing' | 'both';

function AddressForm({
  initial,
  title,
  onSave,
  onCancel,
  defaultCountry,
  currentDefaultShippingId,
  currentDefaultBillingId,
}: {
  initial: Address;
  title: string;
  onSave: (addr: Address, setDefault?: DefaultType) => Promise<void>;
  onCancel: () => void;
  defaultCountry: string;
  currentDefaultShippingId?: string;
  currentDefaultBillingId?: string;
}) {
  const initWithStreetAddr: Address = {
    ...initial,
    streetAddress:
      initial.streetAddress || formatStreetAddress(initial.streetNumber, initial.streetName),
    country: initial.country || defaultCountry,
  };
  const [form, setForm] = useState<Address>(initWithStreetAddr);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const isCurrentShipping = initial.id && initial.id === currentDefaultShippingId;
  const isCurrentBilling = initial.id && initial.id === currentDefaultBillingId;
  const initialDefault: DefaultType =
    isCurrentShipping && isCurrentBilling
      ? 'both'
      : isCurrentShipping
        ? 'shipping'
        : isCurrentBilling
          ? 'billing'
          : '';
  const [setDefault, setSetDefault] = useState<DefaultType>(initialDefault);

  const isCombined = isCombinedStreetField(form.country);
  const t = useTranslations('addresses');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const addrToSave = { ...form };
      if (isCombined && addrToSave.streetAddress) {
        const parsed = parseStreetAddress(addrToSave.streetAddress);
        addrToSave.streetName = parsed.streetName;
        addrToSave.streetNumber = parsed.streetNumber;
      }
      delete addrToSave.streetAddress;
      await onSave(addrToSave, setDefault || undefined);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  }

  const field = (
    key: keyof Address,
    label: string,
    required = false,
    type = 'text',
    placeholder?: string
  ) => (
    <div>
      <label htmlFor={`addr-${key}`} className="text-charcoal mb-1 block text-xs font-medium">
        {label}
      </label>
      <input
        id={`addr-${key}`}
        type={type}
        required={required}
        placeholder={placeholder}
        value={(form[key] as string) || ''}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="border-border focus:border-charcoal w-full rounded-sm border px-3 py-2 text-sm focus:outline-none"
      />
    </div>
  );

  return (
    <div className="border-border mb-6 rounded-sm border bg-white p-6">
      <h2 className="text-charcoal mb-4 font-semibold">{title}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nickname at the top */}
        {field('additionalAddressInfo', t('nickname'), false, 'text', t('nicknamePlaceholder'))}
        <div className="grid grid-cols-2 gap-4">
          {field('firstName', t('firstName'), true)}
          {field('lastName', t('lastName'), true)}
        </div>
        {isCombined ? (
          <div className="space-y-4">
            {field('streetAddress', t('streetAddress'), true, 'text', '123 Main Street')}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">{field('streetName', t('street'), true)}</div>
            <div>{field('streetNumber', t('number'))}</div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          <div>{field('city', t('city'), true)}</div>
          <div>{field('state', t('state'))}</div>
          <div>{field('postalCode', t('postalCode'), true)}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-charcoal mb-1 block text-xs font-medium">{t('country')}</label>
            <select
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className="border-border focus:border-charcoal w-full rounded-sm border bg-white px-3 py-2 text-sm focus:outline-none"
            >
              <option value="US">{t('countryUS')}</option>
              <option value="GB">{t('countryGB')}</option>
              <option value="DE">{t('countryDE')}</option>
            </select>
          </div>
          <div>{field('phone', t('phone'), false, 'tel')}</div>
        </div>

        <div>
          <label className="text-charcoal mb-2 block text-xs font-medium">
            {t('setAsDefault')}
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              {
                type: 'shipping' as const,
                label: t('defaultShipping'),
                activeClass: 'bg-sage/15 text-sage border-sage/50',
              },
              {
                type: 'billing' as const,
                label: t('defaultBilling'),
                activeClass: 'bg-terra/15 text-terra border-terra/50',
              },
            ].map(({ type, label, activeClass }) => {
              const isOn = setDefault === type || setDefault === 'both';
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    const shippingOn = setDefault === 'shipping' || setDefault === 'both';
                    const billingOn = setDefault === 'billing' || setDefault === 'both';
                    const newShipping = type === 'shipping' ? !shippingOn : shippingOn;
                    const newBilling = type === 'billing' ? !billingOn : billingOn;
                    setSetDefault(
                      newShipping && newBilling
                        ? 'both'
                        : newShipping
                          ? 'shipping'
                          : newBilling
                            ? 'billing'
                            : ''
                    );
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isOn
                      ? activeClass
                      : 'text-charcoal-light border-border hover:border-charcoal hover:text-charcoal bg-white'
                  }`}
                >
                  {isOn ? '✓ ' : ''}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-charcoal hover:bg-charcoal/80 rounded-sm px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSaving ? t('savingAddress') : t('saveAddress')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border-border text-charcoal-light hover:text-charcoal rounded-sm border px-5 py-2 text-sm"
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddressesPage() {
  const { country } = useLocale();
  const t = useTranslations('addresses');
  const { data, isLoading } = useAddresses();
  const { addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddressMutations();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const addresses = data?.addresses || [];
  const defaultShippingAddressId = data?.defaultShippingAddressId;
  const defaultBillingAddressId = data?.defaultBillingAddressId;

  async function handleAdd(address: Address, defaultType?: DefaultType) {
    await addAddress(address, defaultType || undefined);
    setShowAddForm(false);
  }

  async function handleEdit(address: Address, defaultType?: DefaultType) {
    await updateAddress(address.id!, address, defaultType || undefined);
    setEditingId(null);
  }

  async function handleDelete(addressId: string) {
    setDeletingId(addressId);
    try {
      await deleteAddress(addressId);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(addressId: string, type: 'shipping' | 'billing' | 'both') {
    setSettingDefaultId(addressId);
    try {
      await setDefaultAddress(addressId, type);
    } finally {
      setSettingDefaultId(null);
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-charcoal mb-6 text-2xl font-semibold">{t('title')}</h1>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-cream-dark h-28 animate-pulse rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-charcoal text-2xl font-semibold">{t('title')}</h1>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-charcoal hover:bg-charcoal/80 rounded-sm px-4 py-2 text-sm text-white transition-colors"
          >
            {t('addAddress')}
          </button>
        )}
      </div>

      {showAddForm && (
        <AddressForm
          initial={emptyAddress}
          title={t('newAddress')}
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
          defaultCountry={country}
          currentDefaultShippingId={defaultShippingAddressId}
          currentDefaultBillingId={defaultBillingAddressId}
        />
      )}

      {addresses.length === 0 && !showAddForm ? (
        <div className="border-border rounded-sm border bg-white p-12 text-center">
          <p className="text-charcoal-light">{t('noAddresses')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((addr) => {
            const isDefaultShipping = addr.id === defaultShippingAddressId;
            const isDefaultBilling = addr.id === defaultBillingAddressId;

            if (editingId === addr.id) {
              return (
                <div key={addr.id} className="sm:col-span-2">
                  <AddressForm
                    initial={addr}
                    title={t('editAddress')}
                    onSave={(updated, defaultType) =>
                      handleEdit({ ...updated, id: addr.id }, defaultType)
                    }
                    onCancel={() => setEditingId(null)}
                    defaultCountry={country}
                    currentDefaultShippingId={defaultShippingAddressId}
                    currentDefaultBillingId={defaultBillingAddressId}
                  />
                </div>
              );
            }

            return (
              <div key={addr.id} className="border-border rounded-sm border bg-white p-5">
                {/* Default badges */}
                {(isDefaultShipping || isDefaultBilling) && (
                  <div className="mb-3 flex gap-1.5">
                    {isDefaultShipping && (
                      <span className="bg-sage/10 text-sage border-sage/20 rounded-full border px-2 py-0.5 text-xs">
                        {t('defaultShipping')}
                      </span>
                    )}
                    {isDefaultBilling && (
                      <span className="bg-terra/10 text-terra border-terra/20 rounded-full border px-2 py-0.5 text-xs">
                        {t('defaultBilling')}
                      </span>
                    )}
                  </div>
                )}

                {addr.additionalAddressInfo && (
                  <p className="text-charcoal-light mb-2 text-xs font-medium tracking-wider uppercase">
                    {addr.additionalAddressInfo}
                  </p>
                )}
                <address className="text-charcoal space-y-0.5 text-sm not-italic">
                  <p className="font-medium">
                    {addr.firstName} {addr.lastName}
                  </p>
                  <p className="text-charcoal-light">
                    {formatStreetAddress(addr.streetNumber, addr.streetName)}
                  </p>
                  <p className="text-charcoal-light">
                    {addr.city}
                    {addr.state ? `, ${addr.state}` : ''} {addr.postalCode}
                  </p>
                  <p className="text-charcoal-light">{addr.country}</p>
                  {addr.phone && <p className="text-charcoal-light">{addr.phone}</p>}
                </address>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setEditingId(addr.id!)}
                    className="text-charcoal hover:text-terra border-border hover:border-terra rounded-sm border px-2.5 py-1 text-xs transition-colors"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id!)}
                    disabled={deletingId === addr.id}
                    className="text-charcoal-light border-border rounded-sm border px-2.5 py-1 text-xs transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-50"
                  >
                    {deletingId === addr.id ? t('removing') : t('remove')}
                  </button>
                  {!isDefaultShipping && (
                    <button
                      onClick={() =>
                        handleSetDefault(addr.id!, isDefaultBilling ? 'both' : 'shipping')
                      }
                      disabled={settingDefaultId === addr.id}
                      className="text-charcoal-light hover:text-sage border-border hover:border-sage/50 rounded-sm border px-2.5 py-1 text-xs transition-colors disabled:opacity-50"
                    >
                      {settingDefaultId === addr.id ? '…' : t('setDefaultShipping')}
                    </button>
                  )}
                  {!isDefaultBilling && (
                    <button
                      onClick={() =>
                        handleSetDefault(addr.id!, isDefaultShipping ? 'both' : 'billing')
                      }
                      disabled={settingDefaultId === addr.id}
                      className="text-charcoal-light hover:text-terra border-border hover:border-terra/50 rounded-sm border px-2.5 py-1 text-xs transition-colors disabled:opacity-50"
                    >
                      {settingDefaultId === addr.id ? '…' : t('setDefaultBilling')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
