import { NextRequest, NextResponse } from 'next/server';
import type { BaseAddress } from '@commercetools/platform-sdk';
import {
  requireOrderPlacementRole,
  requireActiveCustomer,
} from '@/lib/agent-session';
import { writeAuditEntry } from '@/lib/agent-audit';
import { apiRoot } from '@/lib/ct/client';

type Params = { params: Promise<{ customerId: string; addressId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { session, error } = await requireOrderPlacementRole(req);
  if (error) return error;

  const { customerId, addressId } = await params;
  const scopeError = requireActiveCustomer(session, customerId);
  if (scopeError) return scopeError;

  let body: BaseAddress;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const required = ['firstName', 'lastName', 'streetName', 'city', 'postalCode', 'country'] as const;
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  try {
    const current = await apiRoot.customers().withId({ ID: customerId }).get().execute();

    const addressExists = current.body.addresses?.some((a) => a.id === addressId);
    if (!addressExists) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const result = await apiRoot
      .customers()
      .withId({ ID: customerId })
      .post({
        body: {
          version: current.body.version,
          actions: [{ action: 'changeAddress', addressId, address: body }],
        },
      })
      .execute();

    await writeAuditEntry({
      agentId: session.agentId,
      agentEmail: session.agentEmail,
      agentName: session.agentName,
      customerId,
      sessionId: session.sessionId,
      actionType: 'customer.address-book.address-updated',
      actionDetail: { addressId, city: body.city, country: body.country },
      timestamp: new Date().toISOString(),
      outcome: 'success',
    });

    return NextResponse.json({ addresses: result.body.addresses ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update address';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
