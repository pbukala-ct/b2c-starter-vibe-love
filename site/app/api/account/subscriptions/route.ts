import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getCustomerRecurringOrders } from '@/lib/ct/subscriptions';

export async function GET() {
  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const result = await getCustomerRecurringOrders(session.customerId);

  // Inject lineItems from the expanded originOrder so the UI can display product names.
  // CT recurring orders do not carry their own lineItems; they reference the origin order.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subs = (result.results || []).map((sub: any) => ({
    ...sub,
    // Prefer lineItems already on the sub (future-proofing); fall back to origin order.
    lineItems: sub.lineItems?.length
      ? sub.lineItems
      : (sub.originOrder?.obj?.lineItems ?? []),
    // Normalise the next-order field name (CT uses nextOrderAt).
    nextOrderDate: sub.nextOrderDate ?? sub.nextOrderAt,
  }));

  return NextResponse.json({ results: subs });
}
