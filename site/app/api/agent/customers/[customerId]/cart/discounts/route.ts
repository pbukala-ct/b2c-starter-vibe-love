import { NextRequest, NextResponse } from 'next/server';
import { requireOrderPlacementRole, requireActiveCustomer } from '@/lib/agent-session';
import { writeAuditEntry } from '@/lib/agent-audit';
import { apiRoot } from '@/lib/ct/client';

type Params = { params: Promise<{ customerId: string }> };

async function getActiveCart(customerId: string) {
  const result = await apiRoot
    .carts()
    .get({ queryArgs: { where: `customerId="${customerId}" and cartState="Active"`, limit: 1 } })
    .execute();
  return result.body.results[0] ?? null;
}

/** POST — apply a discount code */
export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireOrderPlacementRole(req);
  if (error) return error;

  const { customerId } = await params;
  const scopeError = requireActiveCustomer(session, customerId);
  if (scopeError) return scopeError;

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!body.code) return NextResponse.json({ error: 'code is required' }, { status: 400 });

  try {
    const cart = await getActiveCart(customerId);
    if (!cart) return NextResponse.json({ error: 'No active cart' }, { status: 404 });

    const updated = await apiRoot
      .carts()
      .withId({ ID: cart.id })
      .post({
        body: {
          version: cart.version,
          actions: [{ action: 'addDiscountCode', code: body.code }],
        },
      })
      .execute();

    await writeAuditEntry({
      agentId: session.agentId,
      agentEmail: session.agentEmail,
      agentName: session.agentName,
      customerId,
      sessionId: session.sessionId,
      actionType: 'cart.discount-code.applied',
      actionDetail: { code: body.code, cartId: cart.id },
      timestamp: new Date().toISOString(),
      outcome: 'success',
    });

    return NextResponse.json({ cartId: updated.body.id, version: updated.body.version });
  } catch (err: unknown) {
    await writeAuditEntry({
      agentId: session.agentId,
      agentEmail: session.agentEmail,
      agentName: session.agentName,
      customerId,
      sessionId: session.sessionId,
      actionType: 'cart.discount-code.applied',
      actionDetail: { code: body.code },
      timestamp: new Date().toISOString(),
      outcome: 'failure',
      failureReason: err instanceof Error ? err.message : 'Unknown error',
    });
    const message = err instanceof Error ? err.message : 'Failed to apply discount code';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** DELETE — remove a discount code */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { session, error } = await requireOrderPlacementRole(req);
  if (error) return error;

  const { customerId } = await params;
  const scopeError = requireActiveCustomer(session, customerId);
  if (scopeError) return scopeError;

  let body: { discountCodeId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!body.discountCodeId) {
    return NextResponse.json({ error: 'discountCodeId is required' }, { status: 400 });
  }

  try {
    const cart = await getActiveCart(customerId);
    if (!cart) return NextResponse.json({ error: 'No active cart' }, { status: 404 });

    const updated = await apiRoot
      .carts()
      .withId({ ID: cart.id })
      .post({
        body: {
          version: cart.version,
          actions: [
            {
              action: 'removeDiscountCode',
              discountCode: { typeId: 'discount-code', id: body.discountCodeId },
            },
          ],
        },
      })
      .execute();

    await writeAuditEntry({
      agentId: session.agentId,
      agentEmail: session.agentEmail,
      agentName: session.agentName,
      customerId,
      sessionId: session.sessionId,
      actionType: 'cart.discount-code.removed',
      actionDetail: { discountCodeId: body.discountCodeId, cartId: cart.id },
      timestamp: new Date().toISOString(),
      outcome: 'success',
    });

    return NextResponse.json({ cartId: updated.body.id, version: updated.body.version });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove discount code';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
