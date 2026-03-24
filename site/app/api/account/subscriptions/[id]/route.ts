import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getRecurringOrderById, updateRecurringOrder } from '@/lib/ct/auth';
import { RecurringOrderStateValues, RecurringOrderUpdateAction } from '@commercetools/platform-sdk';
import { RecurringOrderPaused } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/recurring-order';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let ctAction: RecurringOrderUpdateAction;
  if (action === 'pause') {
    ctAction = {
      action: 'setRecurringOrderState',
      recurringOrderState: { type: 'paused' },
    };
  } else if (action === 'resume') {
    ctAction = { action: 'setRecurringOrderState', recurringOrderState: { type: 'active' } };
  } else if (action === 'cancel') {
    ctAction = { action: 'setRecurringOrderState', recurringOrderState: { type: 'canceled' } };
  } else if (action === 'skip') {
    const totalToSkip = (body.totalToSkip as number) || 1;
    ctAction = {
      action: 'setOrderSkipConfiguration',
      skipConfigurationInputDraft: { type: 'Counter', totalToSkip: totalToSkip },
    };
  } else if (action === 'setSchedule') {
    const { schedule } = body;
    ctAction = { action: 'setSchedule', recurrencePolicy: schedule };
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  try {
    // Fetch current version to satisfy CT's optimistic concurrency check
    const current = await getRecurringOrderById(id);
    const result = await updateRecurringOrder(id, current.version, [ctAction]);
    return NextResponse.json({ subscription: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update subscription';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
