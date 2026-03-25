import { NextRequest, NextResponse } from 'next/server';
import { requireAgentSession } from '@/lib/agent-session';
import { queryAuditLog } from '@/lib/agent-audit';

export async function GET(req: NextRequest) {
  const { session, error } = await requireAgentSession(req);
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const customerId = searchParams.get('customerId');
  if (!customerId) {
    return NextResponse.json({ error: 'customerId query param is required' }, { status: 400 });
  }

  const dateFrom = searchParams.get('dateFrom') ?? undefined;
  const dateTo = searchParams.get('dateTo') ?? undefined;

  const entries = await queryAuditLog(customerId, dateFrom, dateTo);
  return NextResponse.json({ entries });
}
