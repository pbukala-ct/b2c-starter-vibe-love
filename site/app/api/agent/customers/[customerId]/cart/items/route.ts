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

/** POST — add a line item by SKU */
export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireOrderPlacementRole(req);
  if (error) return error;

  const { customerId } = await params;
  const scopeError = requireActiveCustomer(session, customerId);
  if (scopeError) return scopeError;

  let body: { sku?: string; quantity?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.sku) return NextResponse.json({ error: 'sku is required' }, { status: 400 });
  const quantity = body.quantity ?? 1;

  try {
    const cart = await getActiveCart(customerId);
    if (!cart) return NextResponse.json({ error: 'No active cart' }, { status: 404 });

    const updated = await apiRoot
      .carts()
      .withId({ ID: cart.id })
      .post({
        body: {
          version: cart.version,
          actions: [{ action: 'addLineItem', sku: body.sku, quantity }],
        },
      })
      .execute();

    await writeAuditEntry({
      agentId: session.agentId,
      agentEmail: session.agentEmail,
      agentName: session.agentName,
      customerId,
      sessionId: session.sessionId,
      actionType: 'cart.line-item.added',
      actionDetail: { sku: body.sku, quantity, cartId: cart.id },
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
      actionType: 'cart.line-item.added',
      actionDetail: { sku: body.sku, quantity },
      timestamp: new Date().toISOString(),
      outcome: 'failure',
      failureReason: err instanceof Error ? err.message : 'Unknown error',
    });
    const message = err instanceof Error ? err.message : 'Failed to add item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE — remove a line item by lineItemId */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { session, error } = await requireOrderPlacementRole(req);
  if (error) return error;

  const { customerId } = await params;
  const scopeError = requireActiveCustomer(session, customerId);
  if (scopeError) return scopeError;

  let body: { lineItemId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!body.lineItemId) return NextResponse.json({ error: 'lineItemId is required' }, { status: 400 });

  try {
    const cart = await getActiveCart(customerId);
    if (!cart) return NextResponse.json({ error: 'No active cart' }, { status: 404 });

    const lineItem = cart.lineItems.find((li) => li.id === body.lineItemId);
    const updated = await apiRoot
      .carts()
      .withId({ ID: cart.id })
      .post({
        body: {
          version: cart.version,
          actions: [{ action: 'removeLineItem', lineItemId: body.lineItemId }],
        },
      })
      .execute();

    await writeAuditEntry({
      agentId: session.agentId,
      agentEmail: session.agentEmail,
      agentName: session.agentName,
      customerId,
      sessionId: session.sessionId,
      actionType: 'cart.line-item.removed',
      actionDetail: {
        lineItemId: body.lineItemId,
        sku: lineItem?.variant?.sku ?? 'unknown',
        cartId: cart.id,
      },
      timestamp: new Date().toISOString(),
      outcome: 'success',
    });

    return NextResponse.json({ cartId: updated.body.id, version: updated.body.version });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH — update line item quantity */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireOrderPlacementRole(req);
  if (error) return error;

  const { customerId } = await params;
  const scopeError = requireActiveCustomer(session, customerId);
  if (scopeError) return scopeError;

  let body: { lineItemId?: string; quantity?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!body.lineItemId || body.quantity === undefined) {
    return NextResponse.json({ error: 'lineItemId and quantity are required' }, { status: 400 });
  }

  try {
    const cart = await getActiveCart(customerId);
    if (!cart) return NextResponse.json({ error: 'No active cart' }, { status: 404 });

    const action =
      body.quantity === 0
        ? { action: 'removeLineItem' as const, lineItemId: body.lineItemId }
        : { action: 'changeLineItemQuantity' as const, lineItemId: body.lineItemId, quantity: body.quantity };

    const updated = await apiRoot
      .carts()
      .withId({ ID: cart.id })
      .post({ body: { version: cart.version, actions: [action] } })
      .execute();

    await writeAuditEntry({
      agentId: session.agentId,
      agentEmail: session.agentEmail,
      agentName: session.agentName,
      customerId,
      sessionId: session.sessionId,
      actionType: 'cart.line-item.quantity-changed',
      actionDetail: { lineItemId: body.lineItemId, quantity: body.quantity, cartId: cart.id },
      timestamp: new Date().toISOString(),
      outcome: 'success',
    });

    return NextResponse.json({ cartId: updated.body.id, version: updated.body.version });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update quantity';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
