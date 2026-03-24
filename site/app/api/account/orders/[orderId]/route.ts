import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getOrderById } from '@/lib/ct/orders';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { orderId } = await params;

  try {
    const order = await getOrderById(orderId);
    // Ensure the order belongs to the current customer
    if (order.customerId !== session.customerId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
}
