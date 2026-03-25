import { NextRequest, NextResponse } from 'next/server';
import type { BaseAddress } from '@commercetools/platform-sdk';
import {
  requireAgentSession,
  requireOrderPlacementRole,
  requireActiveCustomer,
} from '@/lib/agent-session';
import { writeAuditEntry } from '@/lib/agent-audit';
import { apiRoot } from '@/lib/ct/client';

type Params = { params: Promise<{ customerId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAgentSession(req);
  if (error) return error;

  const { customerId } = await params;
  const scopeError = requireActiveCustomer(session, customerId);
  if (scopeError) return scopeError;

  try {
    const result = await apiRoot.customers().withId({ ID: customerId }).get().execute();
    const addresses = result.body.addresses ?? [];

    await writeAuditEntry({
      agentId: session.agentId,
      agentEmail: session.agentEmail,
      agentName: session.agentName,
      customerId,
      sessionId: session.sessionId,
      actionType: 'customer.address-book.viewed',
      actionDetail: { addressCount: addresses.length },
      timestamp: new Date().toISOString(),
      outcome: 'success',
    });

    return NextResponse.json({ addresses });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch addresses';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireOrderPlacementRole(req);
  if (error) return error;

  const { customerId } = await params;
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
    const result = await apiRoot
      .customers()
      .withId({ ID: customerId })
      .post({
        body: {
          version: current.body.version,
          actions: [{ action: 'addAddress', address: body }],
        },
      })
      .execute();

    await writeAuditEntry({
      agentId: session.agentId,
      agentEmail: session.agentEmail,
      agentName: session.agentName,
      customerId,
      sessionId: session.sessionId,
      actionType: 'customer.address-book.address-added',
      actionDetail: { city: body.city, country: body.country },
      timestamp: new Date().toISOString(),
      outcome: 'success',
    });

    return NextResponse.json({ addresses: result.body.addresses ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add address';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
