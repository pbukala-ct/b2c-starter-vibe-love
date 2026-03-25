import { NextRequest, NextResponse } from 'next/server';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { apiRoot } from '@/lib/ct/client';
import {
  createAgentSessionToken,
  setAgentSessionCookie,
  type AgentSession,
  type AgentRole,
} from '@/lib/agent-session';
import { writeAuditEntry } from '@/lib/agent-audit';

function verifyPassword(password: string, storedHash: string): boolean {
  // Format: `scrypt:<salt>:<hash>` (existing accounts)
  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, hash] = parts;
    try {
      const derived = scryptSync(password, salt, 64).toString('hex');
      return timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
    } catch {
      return false;
    }
  }
  // Format: `bcrypt:<hash>` (accounts created via MC Admin App)
  if (storedHash.startsWith('bcrypt:')) {
    return bcrypt.compareSync(password, storedHash.slice('bcrypt:'.length));
  }
  return false;
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  type AgentRecord = {
    email: string;
    passwordHash: string;
    role: AgentRole;
    name: string;
    agentId?: string;
    active?: boolean;
    lastLoginAt?: string;
  };

  // Look up agent credentials from CT Custom Objects by email value
  // (key format may differ between storefront-created and MC-app-created records)
  let agentRecord: AgentRecord | null = null;
  let recordVersion: number | undefined;
  let recordKey: string | undefined;

  try {
    const result = await apiRoot
      .customObjects()
      .withContainer({ container: 'agent-credentials' })
      .get({ queryArgs: { where: `value(email="${email}")`, limit: 1 } })
      .execute();
    const obj = result.body.results[0] ?? null;
    if (obj) {
      agentRecord = obj.value as AgentRecord;
      recordVersion = obj.version;
      recordKey = obj.key;
    }
  } catch {
    // Not found — return generic error to avoid email enumeration
  }

  if (!agentRecord || !verifyPassword(password, agentRecord.passwordHash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Check active flag — missing/undefined is treated as active (backward compatible)
  if (agentRecord.active === false) {
    return NextResponse.json(
      { error: 'Account deactivated. Please contact your administrator.' },
      { status: 401 }
    );
  }

  const sessionId = randomUUID();
  const agentId = agentRecord.agentId ?? recordKey ?? email.replace(/[^a-zA-Z0-9_-]/g, '_');

  const sessionData: AgentSession = {
    agentId,
    agentEmail: agentRecord.email,
    agentName: agentRecord.name,
    role: agentRecord.role,
    activeCustomerId: null,
    sessionId,
  };

  const token = await createAgentSessionToken(sessionData);

  // Audit: session started
  await writeAuditEntry({
    agentId,
    agentEmail: agentRecord.email,
    agentName: agentRecord.name,
    customerId: null,
    sessionId,
    actionType: 'session.started',
    actionDetail: { role: agentRecord.role },
    timestamp: new Date().toISOString(),
    outcome: 'success',
  });

  // Write lastLoginAt back to the credential record (fire-and-forget — don't block login)
  apiRoot
    .customObjects()
    .post({
      body: {
        container: 'agent-credentials',
        key: recordKey!,
        version: recordVersion,
        value: {
          ...agentRecord,
          lastLoginAt: new Date().toISOString(),
        },
      },
    })
    .execute()
    .catch(() => {
      // Non-critical — login proceeds regardless
    });

  const response = NextResponse.json({ ok: true });
  return setAgentSessionCookie(response, token);
}
