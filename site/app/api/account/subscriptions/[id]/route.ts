import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getRecurringOrderById, updateRecurringOrder } from '@/lib/ct/subscriptions';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const sub = await getRecurringOrderById(id);
    // Normalise lineItems from origin order if needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalised = { ...sub, lineItems: sub.lineItems?.length ? sub.lineItems : (sub as any).originOrder?.obj?.lineItems ?? [], nextOrderDate: sub.nextOrderDate ?? sub.nextOrderAt };
    return NextResponse.json({ subscription: normalised });
  } catch {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let ctAction: { action: string; [key: string]: unknown };
  if (action === 'pause') {
    ctAction = { action: 'setRecurringOrderState', recurringOrderState: { type: 'paused' } };
  } else if (action === 'resume') {
    ctAction = { action: 'setRecurringOrderState', recurringOrderState: { type: 'active' } };
  } else if (action === 'cancel') {
    ctAction = { action: 'setRecurringOrderState', recurringOrderState: { type: 'canceled' } };
  } else if (action === 'skip') {
    const totalToSkip = (body.totalToSkip as number) || 1;
    ctAction = { action: 'setOrderSkipConfiguration', skipConfigurationInputDraft: { Counter: { totalToSkip } } };
  } else if (action === 'setSchedule') {
    const { recurrencePolicyId } = body;
    ctAction = { action: 'setSchedule', recurrencePolicy: { id: recurrencePolicyId } };
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  try {
    const current = await getRecurringOrderById(id);
    const result = await updateRecurringOrder(id, current.version, [ctAction as { action: string; [key: string]: unknown }]);
    return NextResponse.json({ subscription: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update subscription';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
