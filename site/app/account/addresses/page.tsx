'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { useCombinedStreetField, formatStreetAddress, parseStreetAddress } from '@/lib/utils';

interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  streetName: string;
  streetNumber?: string;
  streetAddress?: string;            // combined field for US-style input
  additionalAddressInfo?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

const emptyAddress: Address = {
  firstName: '', lastName: '', streetName: '', streetNumber: '',
  streetAddress: '', additionalAddressInfo: '',
  city: '', state: '', postalCode: '', country: 'US', phone: '',
};

interface AddressData {
  addresses: Address[];
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;
}

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
  // Pre-populate streetAddress from separate fields when loading existing addresses
  const initWithStreetAddr: Address = {
    ...initial,
    streetAddress: initial.streetAddress || formatStreetAddress(initial.streetNumber, initial.streetName),
    country: initial.country || defaultCountry,
  };
  const [form, setForm] = useState<Address>(initWithStreetAddr);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Figure out the initial default setting for this address
  const isCurrentShipping = initial.id && initial.id === currentDefaultShippingId;
  const isCurrentBilling = initial.id && initial.id === currentDefaultBillingId;
  const initialDefault: DefaultType =
    isCurrentShipping && isCurrentBilling ? 'both' :
    isCurrentShipping ? 'shipping' :
    isCurrentBilling ? 'billing' : '';
  const [setDefault, setSetDefault] = useState<DefaultType>(initialDefault);

  const isCombined = useCombinedStreetField(form.country);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      // Convert combined street address to separate fields for CT API
      const addrToSave = { ...form };
      if (isCombined && addrToSave.streetAddress) {
        const parsed = parseStreetAddress(addrToSave.streetAddress);
        addrToSave.streetName = parsed.streetName;
        addrToSave.streetNumber = parsed.streetNumber;
      }
      // Remove UI-only fields before sending
      delete addrToSave.streetAddress;
      await onSave(addrToSave, setDefault || undefined);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  }

  const field = (key: keyof Address, label: string, required = false, type = 'text', placeholder?: string) => (
    <div>
      <label className="block text-xs font-medium text-charcoal mb-1">{label}</label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={form[key] as string || ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-charcoal"
      />
    </div>
  );

  return (
    <div className="bg-white border border-border rounded-sm p-6 mb-6">
      <h2 className="font-semibold text-charcoal mb-4">{title}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nickname at the top */}
        {field('additionalAddressInfo', 'Nickname (optional)', false, 'text', 'e.g. Home, Office, Mom\'s house')}
        <div className="grid grid-cols-2 gap-4">
          {field('firstName', 'First name', true)}
          {field('lastName', 'Last name', true)}
        </div>
        {isCombined ? (
          <div className="space-y-4">
            {field('streetAddress', 'Street Address', true, 'text', '123 Main Street')}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">{field('streetName', 'Street', true)}</div>
            <div>{field('streetNumber', 'Number')}</div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          <div>{field('city', 'City', true)}</div>
          <div>{field('state', 'State')}</div>
          <div>{field('postalCode', 'Postal code', true)}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">Country</label>
            <select
              value={form.country}
              onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              className="w-full border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-charcoal bg-white"
            >
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
            </select>
          </div>
          <div>{field('phone', 'Phone', false, 'tel')}</div>
        </div>

        {/* Default address selector — independent toggle pills */}
        <div>
          <label className="block text-xs font-medium text-charcoal mb-2">Set as default</label>
          <div className="flex flex-wrap gap-2">
            {([
              { type: 'shipping' as const, label: 'Default Shipping', activeClass: 'bg-sage/15 text-sage border-sage/50' },
              { type: 'billing' as const, label: 'Default Billing', activeClass: 'bg-terra/15 text-terra border-terra/50' },
            ]).map(({ type, label, activeClass }) => {
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
                      newShipping && newBilling ? 'both' :
                      newShipping ? 'shipping' :
                      newBilling ? 'billing' : ''
                    );
                  }}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors font-medium ${
                    isOn ? activeClass : 'bg-white text-charcoal-light border-border hover:border-charcoal hover:text-charcoal'
                  }`}
                >
                  {isOn ? '✓ ' : ''}{label}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-charcoal text-white px-5 py-2 text-sm font-medium rounded-sm hover:bg-charcoal/80 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save Address'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border border-border text-charcoal-light px-5 py-2 text-sm rounded-sm hover:text-charcoal"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddressesPage() {
  const { country } = useLocale();
  const [data, setData] = useState<AddressData>({ addresses: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  useEffect(() => { fetchAddresses(); }, []);

  async function fetchAddresses() {
    try {
      const res = await fetch('/api/account/addresses');
      const d = await res.json();
      setData(d);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAdd(address: Address, defaultType?: DefaultType) {
    const res = await fetch('/api/account/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, defaultType }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || 'Failed to add address');
    }
    const d = await res.json();
    setData(d);
    setShowAddForm(false);
  }

  async function handleEdit(address: Address, defaultType?: DefaultType) {
    const res = await fetch('/api/account/addresses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId: address.id, address, defaultType }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || 'Failed to update address');
    }
    const d = await res.json();
    setData(d);
    setEditingId(null);
  }

  async function handleDelete(addressId: string) {
    setDeletingId(addressId);
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId }),
      });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(addressId: string, type: 'shipping' | 'billing' | 'both') {
    setSettingDefaultId(addressId);
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId, type }),
      });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } finally {
      setSettingDefaultId(null);
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-charcoal mb-6">Addresses</h1>
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-28 bg-cream-dark rounded-sm animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">Addresses</h1>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="text-sm bg-charcoal text-white px-4 py-2 rounded-sm hover:bg-charcoal/80 transition-colors"
          >
            Add Address
          </button>
        )}
      </div>

      {showAddForm && (
        <AddressForm
          initial={emptyAddress}
          title="New Address"
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
          defaultCountry={country}
          currentDefaultShippingId={data.defaultShippingAddressId}
          currentDefaultBillingId={data.defaultBillingAddressId}
        />
      )}

      {data.addresses.length === 0 && !showAddForm ? (
        <div className="bg-white border border-border rounded-sm p-12 text-center">
          <p className="text-charcoal-light">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.addresses.map((addr) => {
            const isDefaultShipping = addr.id === data.defaultShippingAddressId;
            const isDefaultBilling = addr.id === data.defaultBillingAddressId;

            if (editingId === addr.id) {
              return (
                <div key={addr.id} className="sm:col-span-2">
                  <AddressForm
                    initial={addr}
                    title="Edit Address"
                    onSave={(updated, defaultType) => handleEdit({ ...updated, id: addr.id }, defaultType)}
                    onCancel={() => setEditingId(null)}
                    defaultCountry={country}
                    currentDefaultShippingId={data.defaultShippingAddressId}
                    currentDefaultBillingId={data.defaultBillingAddressId}
                  />
                </div>
              );
            }

            return (
              <div key={addr.id} className="bg-white border border-border rounded-sm p-5">
                {/* Default badges */}
                {(isDefaultShipping || isDefaultBilling) && (
                  <div className="flex gap-1.5 mb-3">
                    {isDefaultShipping && (
                      <span className="text-xs bg-sage/10 text-sage border border-sage/20 px-2 py-0.5 rounded-full">
                        Default Shipping
                      </span>
                    )}
                    {isDefaultBilling && (
                      <span className="text-xs bg-terra/10 text-terra border border-terra/20 px-2 py-0.5 rounded-full">
                        Default Billing
                      </span>
                    )}
                  </div>
                )}

                {addr.additionalAddressInfo && (
                  <p className="text-xs font-medium text-charcoal-light uppercase tracking-wider mb-2">{addr.additionalAddressInfo}</p>
                )}
                <address className="text-sm text-charcoal not-italic space-y-0.5">
                  <p className="font-medium">{addr.firstName} {addr.lastName}</p>
                  <p className="text-charcoal-light">{formatStreetAddress(addr.streetNumber, addr.streetName)}</p>
                  <p className="text-charcoal-light">{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode}</p>
                  <p className="text-charcoal-light">{addr.country}</p>
                  {addr.phone && <p className="text-charcoal-light">{addr.phone}</p>}
                </address>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setEditingId(addr.id!)}
                    className="text-xs text-charcoal hover:text-terra border border-border px-2.5 py-1 rounded-sm hover:border-terra transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id!)}
                    disabled={deletingId === addr.id}
                    className="text-xs text-charcoal-light hover:text-red-500 border border-border px-2.5 py-1 rounded-sm hover:border-red-300 transition-colors disabled:opacity-50"
                  >
                    {deletingId === addr.id ? 'Removing…' : 'Remove'}
                  </button>
                  {!isDefaultShipping && (
                    <button
                      onClick={() => handleSetDefault(addr.id!, isDefaultBilling ? 'both' : 'shipping')}
                      disabled={settingDefaultId === addr.id}
                      className="text-xs text-charcoal-light hover:text-sage border border-border px-2.5 py-1 rounded-sm hover:border-sage/50 transition-colors disabled:opacity-50"
                    >
                      {settingDefaultId === addr.id ? '…' : 'Set Default Shipping'}
                    </button>
                  )}
                  {!isDefaultBilling && (
                    <button
                      onClick={() => handleSetDefault(addr.id!, isDefaultShipping ? 'both' : 'billing')}
                      disabled={settingDefaultId === addr.id}
                      className="text-xs text-charcoal-light hover:text-terra border border-border px-2.5 py-1 rounded-sm hover:border-terra/50 transition-colors disabled:opacity-50"
                    >
                      {settingDefaultId === addr.id ? '…' : 'Set Default Billing'}
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
