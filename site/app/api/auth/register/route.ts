import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSessionToken, setSessionCookie } from '@/lib/session';
import { signUpCustomer } from '@/lib/ct/auth';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, firstName, lastName } = body;

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }

  const session = await getSession();

  try {
    const result = await signUpCustomer({ email, password, firstName, lastName });
    const customer = result.customer;

    // Sign in to get proper session
    const cartId = session.cartId;

    const newSession = {
      ...session,
      customerId: customer.id,
      customerEmail: customer.email,
      customerFirstName: customer.firstName || '',
      customerLastName: customer.lastName || '',
      cartId,
    };

    const token = await createSessionToken(newSession);
    const resp = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
    });
    setSessionCookie(resp, token);
    return resp;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Registration failed';
    if (msg.includes('400') || msg.includes('already exists') || msg.includes('email')) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
