import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { apiRoot } from '@/lib/ct/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.customerId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current and new passwords are required' },
        { status: 400 }
      );
    }

    // Fetch current customer version
    const { body: customer } = await apiRoot
      .customers()
      .withId({ ID: session.customerId })
      .get()
      .execute();

    const { body: updated } = await apiRoot
      .customers()
      .password()
      .post({
        body: {
          id: session.customerId,
          version: customer.version,
          currentPassword: oldPassword,
          newPassword,
        },
      })
      .execute();

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password change failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
