import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getOrderById, addOrderReturnInfo } from '@/lib/ct/orders';

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { orderId } = await params;

  let order;
  try {
    order = await getOrderById(orderId);
  } catch {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.customerId !== session.customerId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const items: Array<{ lineItemId: string; quantity: number }> = body.items;
  const comment: string | undefined = body.comment || undefined;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 });
  }

  const returnTrackingId = `RET-${orderId.slice(-6).toUpperCase()}-${Date.now()}`;
  const returnDate = new Date().toISOString();

  try {
    const updated = await addOrderReturnInfo(
      orderId,
      order.version,
      items,
      returnTrackingId,
      returnDate,
      comment
    );
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to create return' },
      { status: 500 }
    );
  }
}
