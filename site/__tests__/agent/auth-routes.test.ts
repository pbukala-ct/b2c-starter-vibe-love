/**
 * Unit tests for agent auth routes (login + logout).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

process.env.AGENT_SESSION_SECRET = 'test-secret-that-is-long-enough-for-testing-purposes';

// Mock the CT client
vi.mock('@/lib/ct/client', () => ({
  apiRoot: {
    customObjects: vi.fn(),
  },
  projectKey: 'test-project',
}));

import { apiRoot } from '@/lib/ct/client';
import { createAgentSessionToken, type AgentSession } from '@/lib/agent-session';
import { scryptSync, randomBytes } from 'node:crypto';

// Import routes after mocking
import { POST as loginPOST } from '@/app/api/agent/auth/login/route';
import { POST as logoutPOST } from '@/app/api/agent/auth/logout/route';

const SESSION: AgentSession = {
  agentId: 'agent-001',
  agentEmail: 'agent@ct.com',
  agentName: 'Test Agent',
  role: 'order-placement',
  activeCustomerId: null,
  sessionId: 'session-xyz',
};

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function makeAgentRecord(email: string, password: string, role = 'order-placement') {
  return {
    email,
    passwordHash: hashPassword(password),
    role,
    name: 'Test Agent',
  };
}

function setupAuditMock() {
  const noopExecute = vi.fn().mockResolvedValue({});
  vi.mocked(apiRoot.customObjects).mockReturnValue({
    post: vi.fn().mockReturnValue({ execute: noopExecute }),
    get: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue({ body: { results: [] } }) }),
    withContainerAndKey: vi.fn().mockReturnValue({ get: vi.fn().mockReturnValue({ execute: noopExecute }) }),
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Login route
// ---------------------------------------------------------------------------
describe('POST /api/agent/auth/login', () => {
  it('returns 400 when body is missing email or password', async () => {
    const req = new NextRequest('http://localhost/api/agent/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'agent@ct.com' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await loginPOST(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 when agent record not found in CT', async () => {
    const noopExecute = vi.fn().mockResolvedValue({});
    vi.mocked(apiRoot.customObjects).mockReturnValue({
      post: vi.fn().mockReturnValue({ execute: noopExecute }),
      withContainerAndKey: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue({
          execute: vi.fn().mockRejectedValue(new Error('Not found')),
        }),
      }),
    } as any);

    const req = new NextRequest('http://localhost/api/agent/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@example.com', password: 'wrong' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await loginPOST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid credentials');
  });

  it('returns 401 when password is wrong', async () => {
    const record = makeAgentRecord('agent@ct.com', 'correct-password');
    vi.mocked(apiRoot.customObjects).mockReturnValue({
      post: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
      withContainerAndKey: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue({ body: { value: record } }),
        }),
      }),
    } as any);

    const req = new NextRequest('http://localhost/api/agent/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'agent@ct.com', password: 'wrong-password' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await loginPOST(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 and sets agent-session cookie on valid credentials', async () => {
    const record = makeAgentRecord('agent@ct.com', 'correct-password');
    vi.mocked(apiRoot.customObjects).mockReturnValue({
      post: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
      withContainerAndKey: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue({ body: { value: record } }),
        }),
      }),
    } as any);

    const req = new NextRequest('http://localhost/api/agent/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'agent@ct.com', password: 'correct-password' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await loginPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(res.cookies.get('agent-session')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Logout route
// ---------------------------------------------------------------------------
describe('POST /api/agent/auth/logout', () => {
  it('returns 200 and clears cookie even without a session (already logged out)', async () => {
    setupAuditMock();
    const req = new NextRequest('http://localhost/api/agent/auth/logout', { method: 'POST' });
    const res = await logoutPOST(req);
    expect(res.status).toBe(200);
    // Cookie cleared (maxAge = 0)
    const cookie = res.cookies.get('agent-session');
    expect(cookie?.maxAge).toBe(0);
  });

  it('returns 200 and writes audit entry when session exists', async () => {
    const postMock = vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue({}) });
    vi.mocked(apiRoot.customObjects).mockReturnValue({
      post: postMock,
      withContainerAndKey: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
      }),
    } as any);

    const token = await createAgentSessionToken(SESSION);
    const req = new NextRequest('http://localhost/api/agent/auth/logout', { method: 'POST' });
    req.cookies.set('agent-session', token);

    const res = await logoutPOST(req);
    expect(res.status).toBe(200);
    // Audit entry was written
    expect(postMock).toHaveBeenCalledOnce();
    const auditPayload = postMock.mock.calls[0][0].body.value;
    expect(auditPayload.actionType).toBe('session.ended');
    // Cookie cleared
    const cookie = res.cookies.get('agent-session');
    expect(cookie?.maxAge).toBe(0);
  });
});
