import { NextRequest, NextResponse } from 'next/server';
import { apiRoot } from '@/lib/ct/client';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await apiRoot
      .customers()
      .passwordToken()
      .post({ body: { email, ttlMinutes: 2 * 24 * 60 } })
      .execute();

    // Always return 200 to avoid leaking whether an email exists
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Log the error server-side but still return 200 to the client
    console.error('Password reset request error:', error);
    return NextResponse.json({ ok: true });
  }
}
