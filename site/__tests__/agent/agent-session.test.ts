import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Set up env before importing module
process.env.AGENT_SESSION_SECRET = 'test-secret-that-is-long-enough-for-testing-purposes';

import {
  createAgentSessionToken,
  getAgentSessionFromRequest,
  requireAgentSession,
  requireOrderPlacementRole,
  requireActiveCustomer,
  setAgentSessionCookie,
  clearAgentSessionCookie,
  type AgentSession,
} from '@/lib/agent-session';

const baseSession: AgentSession = {
  agentId: 'agent-001',
  agentEmail: 'agent@example.com',
  agentName: 'Test Agent',
  role: 'order-placement',
  activeCustomerId: 'customer-abc',
  sessionId: 'session-xyz',
};

function makeRequest(token?: string): NextRequest {
  const req = new NextRequest('http://localhost/api/agent/test');
  if (token) {
    req.cookies.set('agent-session', token);
  }
  return req;
}

describe('createAgentSessionToken + getAgentSessionFromRequest', () => {
  it('round-trips a valid session', async () => {
    const token = await createAgentSessionToken(baseSession);
    const req = makeRequest(token);
    const session = await getAgentSessionFromRequest(req);

    expect(session).not.toBeNull();
    expect(session!.agentId).toBe('agent-001');
    expect(session!.agentEmail).toBe('agent@example.com');
    expect(session!.role).toBe('order-placement');
    expect(session!.activeCustomerId).toBe('customer-abc');
    expect(session!.sessionId).toBe('session-xyz');
  });

  it('returns null for missing cookie', async () => {
    const req = makeRequest();
    const session = await getAgentSessionFromRequest(req);
    expect(session).toBeNull();
  });

  it('returns null for a tampered token', async () => {
    const token = await createAgentSessionToken(baseSession);
    const req = makeRequest(token + 'tampered');
    const session = await getAgentSessionFromRequest(req);
    expect(session).toBeNull();
  });

  it('returns null for a token signed with a different secret', async () => {
    // Sign with a different secret by temporarily overriding env
    const originalSecret = process.env.AGENT_SESSION_SECRET;
    process.env.AGENT_SESSION_SECRET = 'different-secret-also-long-enough-for-testing-ok';
    const tokenWithDifferentSecret = await createAgentSessionToken(baseSession);
    process.env.AGENT_SESSION_SECRET = originalSecret!;

    const req = makeRequest(tokenWithDifferentSecret);
    const session = await getAgentSessionFromRequest(req);
    expect(session).toBeNull();
  });
});

describe('requireAgentSession', () => {
  it('returns session for a valid token', async () => {
    const token = await createAgentSessionToken(baseSession);
    const req = makeRequest(token);
    const result = await requireAgentSession(req);

    expect(result.error).toBeNull();
    expect(result.session!.agentId).toBe('agent-001');
  });

  it('returns 401 error for missing token', async () => {
    const req = makeRequest();
    const result = await requireAgentSession(req);

    expect(result.session).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });
});

describe('requireOrderPlacementRole', () => {
  it('allows order-placement role', async () => {
    const token = await createAgentSessionToken({ ...baseSession, role: 'order-placement' });
    const req = makeRequest(token);
    const result = await requireOrderPlacementRole(req);

    expect(result.error).toBeNull();
    expect(result.session!.role).toBe('order-placement');
  });

  it('returns 403 for read-only role', async () => {
    const token = await createAgentSessionToken({ ...baseSession, role: 'read-only' });
    const req = makeRequest(token);
    const result = await requireOrderPlacementRole(req);

    expect(result.session).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('returns 401 for missing token', async () => {
    const req = makeRequest();
    const result = await requireOrderPlacementRole(req);

    expect(result.session).toBeNull();
    expect(result.error!.status).toBe(401);
  });
});

describe('requireActiveCustomer', () => {
  it('returns null when customerId matches activeCustomerId', () => {
    const error = requireActiveCustomer(baseSession, 'customer-abc');
    expect(error).toBeNull();
  });

  it('returns 403 when customerId does not match', () => {
    const error = requireActiveCustomer(baseSession, 'customer-different');
    expect(error).not.toBeNull();
    expect(error!.status).toBe(403);
  });

  it('returns 403 when activeCustomerId is null', () => {
    const sessionWithNoCustomer: AgentSession = { ...baseSession, activeCustomerId: null };
    const error = requireActiveCustomer(sessionWithNoCustomer, 'customer-abc');
    expect(error).not.toBeNull();
    expect(error!.status).toBe(403);
  });
});

describe('cookie helpers', () => {
  it('setAgentSessionCookie sets the agent-session cookie', async () => {
    const token = await createAgentSessionToken(baseSession);
    const response = NextResponse.json({ ok: true });
    setAgentSessionCookie(response, token);

    const cookie = response.cookies.get('agent-session');
    expect(cookie?.value).toBe(token);
    expect(cookie?.httpOnly).toBe(true);
  });

  it('clearAgentSessionCookie sets maxAge to 0', () => {
    const response = NextResponse.json({ ok: true });
    clearAgentSessionCookie(response);

    const cookie = response.cookies.get('agent-session');
    expect(cookie?.maxAge).toBe(0);
  });
});
