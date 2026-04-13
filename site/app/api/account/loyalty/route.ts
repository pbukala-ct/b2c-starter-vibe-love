import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getCustomerById } from '@/lib/ct/auth';

// Reads loyalty data from the `ct-loyalty-customer` custom type on the CT customer record.
// Returns { loyaltyPoints, loyaltyTier } or null values when the type is absent.
export async function GET() {
  const session = await getSession();
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const customer = await getCustomerById(session.customerId);
    const fields = customer.custom?.fields;

    if (!fields) {
      return NextResponse.json({ loyaltyPoints: null, loyaltyTier: null });
    }

    return NextResponse.json({
      loyaltyPoints: fields.loyaltyPoints ?? null,
      loyaltyTier: fields.loyaltyTier ?? null,
    });
  } catch {
    // CT error (e.g. type not found, permission denied) — treat as absent
    return NextResponse.json({ loyaltyPoints: null, loyaltyTier: null });
  }
}
