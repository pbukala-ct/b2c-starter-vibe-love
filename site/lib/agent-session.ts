import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'agent-session';
// Inactivity timeout: 30 minutes
const INACTIVITY_SECONDS = 30 * 60;

function getSecret(): Uint8Array {
  const secret = process.env.AGENT_SESSION_SECRET;
  if (!secret) throw new Error('AGENT_SESSION_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export type AgentRole = 'read-only' | 'order-placement';

export interface AgentSession {
  agentId: string;
  agentEmail: string;
  agentName: string;
  role: AgentRole;
  activeCustomerId: string | null;
  activeCustomerName?: string | null;
  sessionId: string;
}

/** Read and verify the agent session from the current request cookies. */
export async function getAgentSession(): Promise<AgentSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { iat, exp, ...session } = payload as unknown as AgentSession & { iat?: number; exp?: number };
    return session as AgentSession;
  } catch {
    return null;
  }
}

/** Read the JWT exp claim (Unix seconds) from the agent session cookie. Returns null if missing/invalid. */
export async function getAgentSessionExp(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return (payload.exp as number) ?? null;
  } catch {
    return null;
  }
}

/** Read and verify the agent session from a NextRequest (for use in middleware / API routes). */
export async function getAgentSessionFromRequest(req: NextRequest): Promise<AgentSession | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { iat, exp, ...session } = payload as unknown as AgentSession & { iat?: number; exp?: number };
    return session as AgentSession;
  } catch {
    return null;
  }
}

/** Sign a new agent session JWT with a 30-minute inactivity window. */
export async function createAgentSessionToken(data: AgentSession): Promise<string> {
  return new SignJWT(data as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${INACTIVITY_SECONDS}s`)
    .sign(getSecret());
}

/** Set the agent-session cookie on a response. Refreshes the inactivity timer. */
export function setAgentSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: INACTIVITY_SECONDS,
    path: '/',
  });
  return response;
}

/** Clear the agent-session cookie on a response. */
export function clearAgentSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}

/**
 * Require an authenticated agent session in an API route.
 * Returns the session, or a 401 NextResponse if the session is missing/invalid.
 * Usage:
 *   const { session, error } = await requireAgentSession(request);
 *   if (error) return error;
 */
export async function requireAgentSession(
  req: NextRequest
): Promise<{ session: AgentSession; error: null } | { session: null; error: NextResponse }> {
  const session = await getAgentSessionFromRequest(req);
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { session, error: null };
}

/**
 * Require an agent with the `order-placement` role.
 * Returns 403 for `read-only` agents.
 */
export async function requireOrderPlacementRole(
  req: NextRequest
): Promise<{ session: AgentSession; error: null } | { session: null; error: NextResponse }> {
  const result = await requireAgentSession(req);
  if (result.error) return result;
  if (result.session.role !== 'order-placement') {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Forbidden: order-placement role required' },
        { status: 403 }
      ),
    };
  }
  return result;
}

/**
 * Require that the agent's active customer matches the given customerId.
 * Returns 403 if there is a mismatch (cross-customer access attempt).
 */
export function requireActiveCustomer(
  session: AgentSession,
  customerId: string
): NextResponse | null {
  if (session.activeCustomerId !== customerId) {
    return NextResponse.json(
      { error: 'Forbidden: customer ID does not match active session' },
      { status: 403 }
    );
  }
  return null;
}
