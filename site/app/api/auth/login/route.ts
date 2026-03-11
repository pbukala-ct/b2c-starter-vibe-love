import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSessionToken, setSessionCookie } from '@/lib/session';
import { signInCustomer } from '@/lib/ct/auth';
import { getCart, setCartCustomerId } from '@/lib/ct/cart';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const session = await getSession();

  try {
    const result = await signInCustomer(email, password, session.cartId);
    const customer = result.customer;

    // If the old anonymous cart was merged, we might have a new cart
    let cartId = session.cartId;
    if (result.cart) {
      cartId = result.cart.id;
    }

    // If there's a cart and it doesn't have customerId set, set it
    if (cartId) {
      try {
        const cart = await getCart(cartId);
        if (!cart.customerId) {
          const updated = await setCartCustomerId(cartId, cart.version, customer.id);
          cartId = updated.id;
        }
      } catch {
        // Cart may not exist
      }
    }

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
    const msg = e instanceof Error ? e.message : 'Login failed';
    if (msg.includes('400') || msg.includes('Unauthorized') || msg.includes('invalid')) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
