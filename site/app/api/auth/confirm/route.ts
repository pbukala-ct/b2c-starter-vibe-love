import { NextRequest, NextResponse } from 'next/server';
import { apiRoot } from '@/lib/ct/client';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Confirmation token is required' }, { status: 400 });
    }

    const { body: customer } = await apiRoot
      .customers()
      .emailConfirm()
      .post({ body: { tokenValue: token } })
      .execute();

    return NextResponse.json({
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email confirmation failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
