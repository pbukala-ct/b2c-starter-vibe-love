import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getCustomerById, updateCustomer } from '@/lib/ct/auth';

async function getAuthedCustomer() {
  const session = await getSession();
  if (!session.customerId) return null;
  const customer = await getCustomerById(session.customerId);
  return customer;
}

export async function GET() {
  const customer = await getAuthedCustomer();
  if (!customer) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  return NextResponse.json({
    addresses: customer.addresses || [],
    version: customer.version,
    defaultShippingAddressId: customer.defaultShippingAddressId,
    defaultBillingAddressId: customer.defaultBillingAddressId,
  });
}

export async function POST(req: NextRequest) {
  const customer = await getAuthedCustomer();
  if (!customer) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { address } = await req.json();
  const updated = await updateCustomer(customer.id, customer.version, [
    { action: 'addAddress', address },
  ]);
  return NextResponse.json({
    addresses: updated.addresses,
    defaultShippingAddressId: updated.defaultShippingAddressId,
    defaultBillingAddressId: updated.defaultBillingAddressId,
  });
}

export async function PUT(req: NextRequest) {
  const customer = await getAuthedCustomer();
  if (!customer) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { addressId, address } = await req.json();
  const updated = await updateCustomer(customer.id, customer.version, [
    { action: 'changeAddress', addressId, address },
  ]);
  return NextResponse.json({
    addresses: updated.addresses,
    defaultShippingAddressId: updated.defaultShippingAddressId,
    defaultBillingAddressId: updated.defaultBillingAddressId,
  });
}

export async function DELETE(req: NextRequest) {
  const customer = await getAuthedCustomer();
  if (!customer) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { addressId } = await req.json();
  const updated = await updateCustomer(customer.id, customer.version, [
    { action: 'removeAddress', addressId },
  ]);
  return NextResponse.json({
    addresses: updated.addresses,
    defaultShippingAddressId: updated.defaultShippingAddressId,
    defaultBillingAddressId: updated.defaultBillingAddressId,
  });
}

export async function PATCH(req: NextRequest) {
  const customer = await getAuthedCustomer();
  if (!customer) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { addressId, type } = await req.json(); // type: 'shipping' | 'billing' | 'both'
  const actions = [];
  if (type === 'shipping' || type === 'both') {
    actions.push({ action: 'setDefaultShippingAddress', addressId });
  }
  if (type === 'billing' || type === 'both') {
    actions.push({ action: 'setDefaultBillingAddress', addressId });
  }
  const updated = await updateCustomer(customer.id, customer.version, actions);
  return NextResponse.json({
    addresses: updated.addresses,
    defaultShippingAddressId: updated.defaultShippingAddressId,
    defaultBillingAddressId: updated.defaultBillingAddressId,
  });
}
