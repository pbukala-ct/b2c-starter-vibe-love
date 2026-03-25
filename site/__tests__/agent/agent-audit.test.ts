import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the CT client
vi.mock('@/lib/ct/client', () => ({
  apiRoot: {
    customObjects: vi.fn(),
  },
  projectKey: 'test-project',
}));

import { writeAuditEntry, queryAuditLog, type AuditEntry } from '@/lib/agent-audit';
import { apiRoot } from '@/lib/ct/client';

const baseEntry: AuditEntry = {
  agentId: 'agent-001',
  agentEmail: 'agent@example.com',
  agentName: 'Test Agent',
  customerId: 'customer-abc',
  sessionId: 'session-xyz',
  actionType: 'cart.viewed',
  actionDetail: { cartId: 'cart-123' },
  timestamp: '2026-03-19T10:00:00.000Z',
  outcome: 'success',
};

function makeMockChain(overrides?: { postFn?: ReturnType<typeof vi.fn>; getFn?: ReturnType<typeof vi.fn> }) {
  const executeMock = vi.fn().mockResolvedValue({ body: { results: [] } });
  const postMock = overrides?.postFn ?? vi.fn().mockReturnValue({ execute: executeMock });
  const getMock = overrides?.getFn ?? vi.fn().mockReturnValue({ execute: executeMock });

  return {
    post: postMock,
    get: getMock,
    execute: executeMock,
  };
}

describe('writeAuditEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes to the agent-audit-log container with a unique key', async () => {
    const executeMock = vi.fn().mockResolvedValue({});
    const postMock = vi.fn().mockReturnValue({ execute: executeMock });
    vi.mocked(apiRoot.customObjects).mockReturnValue({ post: postMock } as any);

    await writeAuditEntry(baseEntry);

    expect(postMock).toHaveBeenCalledOnce();
    const callArg = postMock.mock.calls[0][0].body;
    expect(callArg.container).toBe('agent-audit-log');
    expect(callArg.key).toContain(baseEntry.sessionId);
    expect(callArg.key).toContain('cart_viewed');
    expect(callArg.value.agentId).toBe('agent-001');
    expect(callArg.value.customerId).toBe('customer-abc');
    expect(callArg.value.outcome).toBe('success');
  });

  it('throws if the CT write fails (so the caller can abort the mutation)', async () => {
    const executeMock = vi.fn().mockRejectedValue(new Error('CT write failed'));
    const postMock = vi.fn().mockReturnValue({ execute: executeMock });
    vi.mocked(apiRoot.customObjects).mockReturnValue({ post: postMock } as any);

    await expect(writeAuditEntry(baseEntry)).rejects.toThrow('CT write failed');
  });

  it('uses the entry timestamp if provided', async () => {
    const executeMock = vi.fn().mockResolvedValue({});
    const postMock = vi.fn().mockReturnValue({ execute: executeMock });
    vi.mocked(apiRoot.customObjects).mockReturnValue({ post: postMock } as any);

    const customTimestamp = '2026-01-15T08:30:00.000Z';
    await writeAuditEntry({ ...baseEntry, timestamp: customTimestamp });

    const written = postMock.mock.calls[0][0].body.value;
    expect(written.timestamp).toBe(customTimestamp);
  });
});

describe('queryAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns entries matching the given customerId', async () => {
    const entries = [
      { ...baseEntry, customerId: 'customer-abc', timestamp: '2026-03-19T10:00:00.000Z' },
      { ...baseEntry, customerId: 'customer-other', timestamp: '2026-03-19T11:00:00.000Z' },
    ];
    const executeMock = vi.fn().mockResolvedValue({
      body: { results: entries.map((e) => ({ value: e })) },
    });
    const getMock = vi.fn().mockReturnValue({ execute: executeMock });
    vi.mocked(apiRoot.customObjects).mockReturnValue({ get: getMock } as any);

    const result = await queryAuditLog('customer-abc');
    expect(result).toHaveLength(1);
    expect(result[0].customerId).toBe('customer-abc');
  });

  it('filters by dateFrom', async () => {
    const entries = [
      { ...baseEntry, customerId: 'customer-abc', timestamp: '2026-03-01T00:00:00.000Z' },
      { ...baseEntry, customerId: 'customer-abc', timestamp: '2026-03-20T00:00:00.000Z' },
    ];
    const executeMock = vi.fn().mockResolvedValue({
      body: { results: entries.map((e) => ({ value: e })) },
    });
    vi.mocked(apiRoot.customObjects).mockReturnValue({ get: vi.fn().mockReturnValue({ execute: executeMock }) } as any);

    const result = await queryAuditLog('customer-abc', '2026-03-10T00:00:00.000Z');
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe('2026-03-20T00:00:00.000Z');
  });

  it('filters by dateTo', async () => {
    const entries = [
      { ...baseEntry, customerId: 'customer-abc', timestamp: '2026-03-01T00:00:00.000Z' },
      { ...baseEntry, customerId: 'customer-abc', timestamp: '2026-03-20T00:00:00.000Z' },
    ];
    const executeMock = vi.fn().mockResolvedValue({
      body: { results: entries.map((e) => ({ value: e })) },
    });
    vi.mocked(apiRoot.customObjects).mockReturnValue({ get: vi.fn().mockReturnValue({ execute: executeMock }) } as any);

    const result = await queryAuditLog('customer-abc', undefined, '2026-03-10T00:00:00.000Z');
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe('2026-03-01T00:00:00.000Z');
  });
});
