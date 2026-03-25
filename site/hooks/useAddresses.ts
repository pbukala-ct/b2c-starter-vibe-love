'use client';

import useSWR, { useSWRConfig } from 'swr';
import { KEY_ADDRESSES } from '@/lib/cache-keys';

export interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  streetName: string;
  streetNumber?: string;
  streetAddress?: string;
  additionalAddressInfo?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface AddressData {
  addresses: Address[];
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;
}

async function addressesFetcher(): Promise<AddressData> {
  const res = await fetch('/api/account/addresses');
  if (!res.ok) return { addresses: [] };
  return res.json();
}

export function useAddresses() {
  return useSWR<AddressData>(KEY_ADDRESSES, addressesFetcher, { revalidateOnFocus: false });
}

export function useAddressMutations() {
  const { mutate } = useSWRConfig();

  async function addAddress(address: Partial<Address>, defaultType?: string) {
    const res = await fetch('/api/account/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, defaultType }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || 'Failed to add address');
    }
    const newData = await res.json();
    mutate(KEY_ADDRESSES, newData, { revalidate: false });
  }

  async function updateAddress(addressId: string, address: Partial<Address>, defaultType?: string) {
    const res = await fetch('/api/account/addresses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId, address, defaultType }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || 'Failed to update address');
    }
    const newData = await res.json();
    mutate(KEY_ADDRESSES, newData, { revalidate: false });
  }

  async function deleteAddress(addressId: string) {
    const res = await fetch('/api/account/addresses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId }),
    });
    if (!res.ok) throw new Error('Failed to delete address');
    const newData = await res.json();
    mutate(KEY_ADDRESSES, newData, { revalidate: false });
  }

  async function setDefaultAddress(addressId: string, type: 'shipping' | 'billing' | 'both') {
    const res = await fetch('/api/account/addresses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId, type }),
    });
    if (!res.ok) throw new Error('Failed to set default address');
    const newData = await res.json();
    mutate(KEY_ADDRESSES, newData, { revalidate: false });
  }

  return { addAddress, updateAddress, deleteAddress, setDefaultAddress };
}
