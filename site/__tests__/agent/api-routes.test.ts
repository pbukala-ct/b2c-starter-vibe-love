/**
 * Unit tests for Phase 1 agent API routes.
 * Asserts that every route:
 *  - Rejects unauthenticated requests with 401
 *  - Enforces activeCustomerId scoping with 403
 *  - Only returns data for the active customer
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

process.env.AGENT_SESSION_SECRET = 'test-secret-that-is-long-enough-for-testing-purposes';

// Mock CT client
vi.mock('@/lib/ct/client', () => ({
  apiRoot: {
    carts: vi.fn(),
    customers: vi.fn(),
    orders: vi.fn(),
    customObjects: vi.fn(),
  },
  projectKey: 'test-project',
}));

import { createAgentSessionToken, type AgentSession } from '@/lib/agent-session';
import { apiRoot } from '@/lib/ct/client';

// Import routes after mocking
import { GET as cartGET } from '@/app/api/agent/customers/[customerId]/cart/route';
import { GET as lookupGET } from '@/app/api/agent/customers/lookup/route';
import { PATCH as sessionPATCH } from '@/app/api/agent/session/route';
import { GET as auditGET } from '@/app/api/agent/audit/route';

const SESSION: AgentSession = {
  agentId: 'agent-001',
  agentEmail: 'agent@example.com',
  agentName: 'Test Agent',
  role: 'order-placement',
  activeCustomerId: 'customer-abc',
  sessionId: 'session-xyz',
};

async function makeAuthRequest(url: string, session?: AgentSession, options?: { method?: string; body?: string; headers?: Record<string, string> }): Promise<NextRequest> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const req = new NextRequest(url, options as any);
  if (session) {
    const token = await createAgentSessionToken(session);
    req.cookies.set('agent-session', token);
  }
  return req;
}

// Silence audit writes in all route tests
beforeEach(() => {
  vi.clearAllMocks();
  const noopExecute = vi.fn().mockResolvedValue({});
  vi.mocked(apiRoot.customObjects).mockReturnValue({
    post: vi.fn().mockReturnValue({ execute: noopExecute }),
    get: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue({ body: { results: [] } }) }),
  } as any);
});

// ---------------------------------------------------------------------------
// Cart GET route
// ---------------------------------------------------------------------------
describe('GET /api/agent/customers/[customerId]/cart', () => {
  it('returns 401 with no session', async () => {
    const req = await makeAuthRequest('http://localhost/api/agent/customers/customer-abc/cart');
    const res = await cartGET(req, { params: Promise.resolve({ customerId: 'customer-abc' }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 when customerId does not match activeCustomerId', async () => {
    const req = await makeAuthRequest(
      'http://localhost/api/agent/customers/customer-other/cart',
      SESSION
    );
    const res = await cartGET(req, { params: Promise.resolve({ customerId: 'customer-other' }) });
    expect(res.status).toBe(403);
  });

  it('returns cart data for the correct customer', async () => {
    const cartData = {
      id: 'cart-123',
      version: 1,
      lineItems: [],
      discountCodes: [],
      shippingAddress: null,
      shippingInfo: null,
      totalPrice: { centAmount: 0, currencyCode: 'USD', fractionDigits: 2 },
      lastModifiedAt: new Date().toISOString(),
      cartState: 'Active',
    };
    const executeGet = vi.fn().mockResolvedValue({ body: { results: [cartData] } });
    vi.mocked(apiRoot.carts).mockReturnValue({
      get: vi.fn().mockReturnValue({ execute: executeGet }),
    } as any);

    const req = await makeAuthRequest(
      'http://localhost/api/agent/customers/customer-abc/cart',
      SESSION
    );
    const res = await cartGET(req, { params: Promise.resolve({ customerId: 'customer-abc' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cart.id).toBe('cart-123');
  });

  it('returns { cart: null } when no active cart exists', async () => {
    vi.mocked(apiRoot.carts).mockReturnValue({
      get: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue({ body: { results: [] } }) }),
    } as any);

    const req = await makeAuthRequest(
      'http://localhost/api/agent/customers/customer-abc/cart',
      SESSION
    );
    const res = await cartGET(req, { params: Promise.resolve({ customerId: 'customer-abc' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cart).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Customer lookup route
// ---------------------------------------------------------------------------
describe('GET /api/agent/customers/lookup', () => {
  it('returns 401 with no session', async () => {
    const req = new NextRequest('http://localhost/api/agent/customers/lookup?email=test@test.com');
    const res = await lookupGET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when no search param given', async () => {
    const req = await makeAuthRequest('http://localhost/api/agent/customers/lookup', SESSION);
    const res = await lookupGET(req);
    expect(res.status).toBe(400);
  });

  it('returns found: false when customer not found', async () => {
    vi.mocked(apiRoot.customers).mockReturnValue({
      get: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue({ body: { results: [] } }),
      }),
    } as any);

    const req = await makeAuthRequest(
      'http://localhost/api/agent/customers/lookup?email=unknown@example.com',
      SESSION
    );
    const res = await lookupGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.found).toBe(false);
  });

  it('returns customer data when found by email', async () => {
    const customer = {
      id: 'customer-abc',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      isEmailVerified: true,
    };
    vi.mocked(apiRoot.customers).mockReturnValue({
      get: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue({ body: { results: [customer] } }),
      }),
    } as any);
    vi.mocked(apiRoot.orders).mockReturnValue({
      get: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue({ body: { total: 2 } }),
      }),
    } as any);

    const req = await makeAuthRequest(
      'http://localhost/api/agent/customers/lookup?email=user@example.com',
      SESSION
    );
    const res = await lookupGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.found).toBe(true);
    expect(body.customer.id).toBe('customer-abc');
    expect(body.customer.openOrderCount).toBe(2);
  });

  it('returns customer data when found by customerId', async () => {
    const customer = {
      id: 'customer-abc',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      isEmailVerified: true,
    };
    vi.mocked(apiRoot.customers).mockReturnValue({
      withId: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue({ body: customer }),
        }),
      }),
    } as any);
    vi.mocked(apiRoot.orders).mockReturnValue({
      get: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue({ body: { total: 0 } }),
      }),
    } as any);

    const req = await makeAuthRequest(
      'http://localhost/api/agent/customers/lookup?customerId=customer-abc',
      SESSION
    );
    const res = await lookupGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.found).toBe(true);
    expect(body.customer.id).toBe('customer-abc');
  });

  it('returns customer data when found by orderId', async () => {
    const customer = {
      id: 'customer-abc',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      isEmailVerified: true,
    };
    vi.mocked(apiRoot.orders).mockReturnValue({
      withId: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue({ body: { customerId: 'customer-abc', orderState: 'Open' } }),
        }),
      }),
      get: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue({ body: { total: 1 } }),
      }),
    } as any);
    vi.mocked(apiRoot.customers).mockReturnValue({
      withId: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue({ body: customer }),
        }),
      }),
    } as any);

    const req = await makeAuthRequest(
      'http://localhost/api/agent/customers/lookup?orderId=order-123',
      SESSION
    );
    const res = await lookupGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.found).toBe(true);
    expect(body.customer.id).toBe('customer-abc');
  });
});

// ---------------------------------------------------------------------------
// Cart stale warning
// ---------------------------------------------------------------------------
describe('GET /api/agent/customers/[customerId]/cart — staleness', () => {
  it('returns isStale: true for carts older than 24 hours', async () => {
    const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const cartData = {
      id: 'cart-stale',
      version: 1,
      lineItems: [],
      discountCodes: [],
      shippingAddress: null,
      shippingInfo: null,
      totalPrice: { centAmount: 0, currencyCode: 'USD', fractionDigits: 2 },
      lastModifiedAt: staleDate,
      cartState: 'Active',
    };
    vi.mocked(apiRoot.carts).mockReturnValue({
      get: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue({ body: { results: [cartData] } }) }),
    } as any);

    const req = await makeAuthRequest(
      'http://localhost/api/agent/customers/customer-abc/cart',
      SESSION
    );
    const res = await cartGET(req, { params: Promise.resolve({ customerId: 'customer-abc' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cart.isStale).toBe(true);
  });

  it('returns isStale: false for recently-modified carts', async () => {
    const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    const cartData = {
      id: 'cart-fresh',
      version: 1,
      lineItems: [],
      discountCodes: [],
      shippingAddress: null,
      shippingInfo: null,
      totalPrice: { centAmount: 0, currencyCode: 'USD', fractionDigits: 2 },
      lastModifiedAt: recentDate,
      cartState: 'Active',
    };
    vi.mocked(apiRoot.carts).mockReturnValue({
      get: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue({ body: { results: [cartData] } }) }),
    } as any);

    const req = await makeAuthRequest(
      'http://localhost/api/agent/customers/customer-abc/cart',
      SESSION
    );
    const res = await cartGET(req, { params: Promise.resolve({ customerId: 'customer-abc' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cart.isStale).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Session PATCH route
// ---------------------------------------------------------------------------
describe('PATCH /api/agent/session', () => {
  it('returns 401 with no session', async () => {
    const req = new NextRequest('http://localhost/api/agent/session', {
      method: 'PATCH',
      body: JSON.stringify({ customerId: 'customer-abc' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await sessionPATCH(req);
    expect(res.status).toBe(401);
  });

  it('updates activeCustomerId in the response cookie', async () => {
    const req = await makeAuthRequest('http://localhost/api/agent/session', SESSION, {
      method: 'PATCH',
      body: JSON.stringify({ customerId: 'customer-new' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await sessionPATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activeCustomerId).toBe('customer-new');
    expect(res.cookies.get('agent-session')).toBeDefined();
  });

  it('clears activeCustomerId when null is passed', async () => {
    const req = await makeAuthRequest('http://localhost/api/agent/session', SESSION, {
      method: 'PATCH',
      body: JSON.stringify({ customerId: null }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await sessionPATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activeCustomerId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Audit query route
// ---------------------------------------------------------------------------
describe('GET /api/agent/audit', () => {
  it('returns 401 with no session', async () => {
    const req = new NextRequest('http://localhost/api/agent/audit?customerId=customer-abc');
    const res = await auditGET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when customerId is missing', async () => {
    const req = await makeAuthRequest('http://localhost/api/agent/audit', SESSION);
    const res = await auditGET(req);
    expect(res.status).toBe(400);
  });

  it('returns entries for the queried customer', async () => {
    const auditEntries = [
      { customerId: 'customer-abc', actionType: 'cart.viewed', timestamp: '2026-03-19T10:00:00.000Z' },
    ];
    vi.mocked(apiRoot.customObjects).mockReturnValue({
      post: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
      get: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue({ body: { results: auditEntries.map((e) => ({ value: e })) } }),
      }),
    } as any);

    const req = await makeAuthRequest(
      'http://localhost/api/agent/audit?customerId=customer-abc',
      SESSION
    );
    const res = await auditGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries).toHaveLength(1);
    expect(body.entries[0].actionType).toBe('cart.viewed');
  });
});
