import { NextRequest, NextResponse } from 'next/server';
import { requireOrderPlacementRole, requireActiveCustomer } from '@/lib/agent-session';
import { writeAuditEntry } from '@/lib/agent-audit';
import { apiRoot } from '@/lib/ct/client';
import type { BaseAddress } from '@commercetools/platform-sdk';

type Params = { params: Promise<{ customerId: string }> };

async function getActiveCart(customerId: string) {
  const result = await apiRoot
    .carts()
    .get({ queryArgs: { where: `customerId="${customerId}" and cartState="Active"`, limit: 1 } })
    .execute();
  return result.body.results[0] ?? null;
}

/** PUT — update the shipping address on the customer's active cart */
export async function PUT(req: NextRequest, { params }: Params) {
  const { session, error } = await requireOrderPlacementRole(req);
  if (error) return error;

  const { customerId } = await params;
  const scopeError = requireActiveCustomer(session, customerId);
  if (scopeError) return scopeError;

  let address: Partial<BaseAddress>;
  try {
    address = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Validate required fields
  const required = ['firstName', 'lastName', 'streetName', 'city', 'postalCode', 'country'] as const;
  const missing = required.filter((f) => !address[f]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'Missing required fields', fields: missing },
      { status: 400 }
    );
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
          actions: [{ action: 'setShippingAddress', address: address as BaseAddress }],
        },
      })
      .execute();

    await writeAuditEntry({
      agentId: session.agentId,
      agentEmail: session.agentEmail,
      agentName: session.agentName,
      customerId,
      sessionId: session.sessionId,
      actionType: 'cart.shipping-address.updated',
      actionDetail: {
        cartId: cart.id,
        newAddress: {
          city: address.city,
          postalCode: address.postalCode,
          country: address.country,
        },
      },
      timestamp: new Date().toISOString(),
      outcome: 'success',
    });

    return NextResponse.json({
      cartId: updated.body.id,
      version: updated.body.version,
      shippingAddress: updated.body.shippingAddress,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update shipping address';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
