'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AgentRole } from '@/lib/agent-session';

interface Address {
  id?: string;
  firstName?: string;
  lastName?: string;
  streetName?: string;
  streetNumber?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  streetName: '',
  streetNumber: '',
  city: '',
  postalCode: '',
  country: 'US',
};

interface CustomerAddressBookProps {
  customerId: string;
  agentRole: AgentRole;
}

export default function CustomerAddressBook({ customerId, agentRole }: CustomerAddressBookProps) {
  const canEdit = agentRole === 'order-placement';
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add address form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ ...EMPTY_FORM });
  const [addLoading, setAddLoading] = useState(false);

  // Edit address state: key = addressId
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [editLoading, setEditLoading] = useState(false);

  function flash(msg: string, isError = false) {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  }

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/customers/${customerId}/addresses`);
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch(`/api/agent/customers/${customerId}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) { flash(data.error ?? 'Failed to add address', true); return; }
      setAddresses(data.addresses ?? []);
      setAddForm({ ...EMPTY_FORM });
      setShowAddForm(false);
      flash('Address added');
    } finally { setAddLoading(false); }
  }

  function startEdit(address: Address) {
    setEditingId(address.id ?? null);
    setEditForm({
      firstName: address.firstName ?? '',
      lastName: address.lastName ?? '',
      streetName: address.streetName ?? '',
      streetNumber: address.streetNumber ?? '',
      city: address.city ?? '',
      postalCode: address.postalCode ?? '',
      country: address.country ?? 'US',
    });
  }

  async function handleEditAddress(e: React.FormEvent, addressId: string) {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await fetch(`/api/agent/customers/${customerId}/addresses/${addressId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { flash(data.error ?? 'Failed to update address', true); return; }
      setAddresses(data.addresses ?? []);
      setEditingId(null);
      flash('Address updated');
    } finally { setEditLoading(false); }
  }

  const addressFormFields = ['firstName', 'lastName', 'streetName', 'streetNumber', 'city', 'postalCode'] as const;

  function renderAddressForm(
    form: typeof EMPTY_FORM,
    setForm: (f: typeof EMPTY_FORM) => void,
    onSubmit: (e: React.FormEvent) => void,
    submitting: boolean,
    onCancel: () => void,
    submitLabel: string
  ) {
    return (
      <form onSubmit={onSubmit} className="mt-3 bg-gray-50 rounded-lg p-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          {addressFormFields.map((field) => (
            <div key={field}>
              <label className="block text-gray-500 mb-0.5 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
              <input
                type="text"
                required={field !== 'streetNumber'}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-gray-500 mb-0.5">Country</label>
            <select
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
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
            disabled={submitting}
            className="bg-gray-900 text-white rounded px-3 py-1 text-xs hover:bg-gray-800 disabled:opacity-40"
          >
            {submitting ? 'Saving…' : submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-white border border-gray-300 text-gray-700 rounded px-3 py-1 text-xs hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Address Book</h2>
        {canEdit && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-800"
          >
            + Add address
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded px-3 py-2 text-xs text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-3 bg-green-50 border border-green-200 rounded px-3 py-2 text-xs text-green-700">{success}</div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading addresses…</p>}

      {!loading && addresses.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
          No saved addresses.
        </div>
      )}

      {!loading && addresses.length > 0 && (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id ?? addr.streetName} className="bg-white rounded-lg border border-gray-200 p-4 text-sm">
              {editingId === addr.id ? (
                renderAddressForm(
                  editForm,
                  setEditForm,
                  (e) => handleEditAddress(e, addr.id!),
                  editLoading,
                  () => setEditingId(null),
                  'Save changes'
                )
              ) : (
                <div className="flex items-start justify-between">
                  <div className="text-gray-700 leading-relaxed">
                    <p className="font-medium text-gray-900">{addr.firstName} {addr.lastName}</p>
                    <p>{addr.streetNumber} {addr.streetName}</p>
                    <p>{addr.city}, {addr.postalCode}, {addr.country}</p>
                  </div>
                  {canEdit && addr.id && (
                    <button
                      onClick={() => startEdit(addr)}
                      className="text-xs text-blue-600 hover:text-blue-800 ml-4 shrink-0"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddForm && canEdit && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-700 mb-2">New address</p>
          {renderAddressForm(
            addForm,
            setAddForm,
            handleAddAddress,
            addLoading,
            () => { setShowAddForm(false); setAddForm({ ...EMPTY_FORM }); },
            'Add address'
          )}
        </div>
      )}
    </section>
  );
}
