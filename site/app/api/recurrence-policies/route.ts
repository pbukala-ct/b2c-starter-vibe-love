import { NextResponse } from 'next/server';
import { getRecurrencePolicies } from '@/lib/ct/subscriptions';

export async function GET() {
  try {
    const data = await getRecurrencePolicies();
    return NextResponse.json({ policies: data.results || [] });
  } catch {
    return NextResponse.json({ policies: [] });
  }
}
