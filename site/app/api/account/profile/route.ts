import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSessionToken, setSessionCookie } from '@/lib/session';
import { getCustomerById, updateCustomer } from '@/lib/ct/auth';

export async function GET() {
  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const customer = await getCustomerById(session.customerId);
  return NextResponse.json({ customer });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  const { firstName, lastName } = body;

  // Fetch the current version to satisfy CT's optimistic concurrency check
  const current = await getCustomerById(session.customerId);

  const actions = [];
  if (firstName) actions.push({ action: 'setFirstName', firstName });
  if (lastName) actions.push({ action: 'setLastName', lastName });

  const customer = await updateCustomer(session.customerId, current.version, actions);

  const newSession = {
    ...session,
    customerFirstName: customer.firstName || '',
    customerLastName: customer.lastName || '',
  };
  const token = await createSessionToken(newSession);
  const resp = NextResponse.json({ customer });
  setSessionCookie(resp, token);
  return resp;
}
