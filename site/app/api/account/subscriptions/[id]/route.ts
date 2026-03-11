import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { updateRecurringOrder } from '@/lib/ct/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, version } = body;

  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let ctAction;
  if (action === 'pause') {
    ctAction = { action: 'setRecurringOrderState', recurringOrderState: 'Paused' };
  } else if (action === 'resume') {
    ctAction = { action: 'setRecurringOrderState', recurringOrderState: 'Active' };
  } else if (action === 'cancel') {
    ctAction = { action: 'setRecurringOrderState', recurringOrderState: 'Cancelled' };
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const result = await updateRecurringOrder(id, version, [ctAction]);
  return NextResponse.json({ subscription: result });
}
