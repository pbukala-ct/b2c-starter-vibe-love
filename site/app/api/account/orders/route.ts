import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getCustomerOrders } from '@/lib/ct/orders';

export async function GET() {
  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const orders = await getCustomerOrders(session.customerId);
  return NextResponse.json({ orders: orders.results });
}
