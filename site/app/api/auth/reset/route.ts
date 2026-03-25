import { NextRequest, NextResponse } from 'next/server';
import { apiRoot } from '@/lib/ct/client';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    const { body: customer } = await apiRoot
      .customers()
      .passwordReset()
      .post({ body: { tokenValue: token, newPassword } })
      .execute();

    return NextResponse.json({
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password reset failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
