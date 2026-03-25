import { NextRequest, NextResponse } from 'next/server';
import { requireAgentSession, clearAgentSessionCookie } from '@/lib/agent-session';
import { writeAuditEntry } from '@/lib/agent-audit';

export async function POST(req: NextRequest) {
  const { session, error } = await requireAgentSession(req);
  if (error) {
    // Already logged out — just clear cookie anyway
    const response = NextResponse.json({ ok: true });
    return clearAgentSessionCookie(response);
  }

  await writeAuditEntry({
    agentId: session.agentId,
    agentEmail: session.agentEmail,
    agentName: session.agentName,
    customerId: session.activeCustomerId,
    sessionId: session.sessionId,
    actionType: 'session.ended',
    actionDetail: { reason: 'logout' },
    timestamp: new Date().toISOString(),
    outcome: 'success',
  });

  const response = NextResponse.json({ ok: true });
  return clearAgentSessionCookie(response);
}
