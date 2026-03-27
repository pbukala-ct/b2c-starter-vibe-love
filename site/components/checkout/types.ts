import type { AddressFormValues } from '@/components/address/AddressFields';

export type Address = AddressFormValues & { key: string };

export interface SavedAddress {
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

export interface ItemShipping {
  lineItemId: string;
  productName: string;
  quantity: number;
  addresses: Array<{ addressKey: string; qty: number }>;
}

export interface Payment {
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvc: string;
}
