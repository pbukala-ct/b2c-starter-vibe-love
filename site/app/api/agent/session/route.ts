/**
 * PATCH /api/agent/session
 * Body: { customerId: string | null }
 *
 * Sets or clears the activeCustomerId in the agent's JWT.
 * - customerId: string  → start a customer session
 * - customerId: null    → end the current customer session
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  requireAgentSession,
  createAgentSessionToken,
  setAgentSessionCookie,
} from '@/lib/agent-session';
import { writeAuditEntry } from '@/lib/agent-audit';

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAgentSession(req);
  if (error) return error;

  let body: { customerId?: string | null; customerName?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!('customerId' in body)) {
    return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
  }

  const newCustomerId = body.customerId ?? null;
  const isStarting = newCustomerId !== null;
  const newCustomerName = isStarting ? (body.customerName ?? null) : null;

  await writeAuditEntry({
    agentId: session.agentId,
    agentEmail: session.agentEmail,
    agentName: session.agentName,
    customerId: newCustomerId ?? session.activeCustomerId,
    sessionId: session.sessionId,
    actionType: isStarting ? 'customer.session.started' : 'customer.session.ended',
    actionDetail: {
      previousCustomerId: session.activeCustomerId,
      newCustomerId,
    },
    timestamp: new Date().toISOString(),
    outcome: 'success',
  });

  const updatedSession = { ...session, activeCustomerId: newCustomerId, activeCustomerName: newCustomerName };
  const token = await createAgentSessionToken(updatedSession);
  const response = NextResponse.json({ ok: true, activeCustomerId: newCustomerId });
  return setAgentSessionCookie(response, token);
}
