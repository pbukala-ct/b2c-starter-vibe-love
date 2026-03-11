import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getCustomerRecurringOrders } from '@/lib/ct/auth';

export async function GET() {
  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const result = await getCustomerRecurringOrders(session.customerId);
  return NextResponse.json({ results: result.results || [] });
}
