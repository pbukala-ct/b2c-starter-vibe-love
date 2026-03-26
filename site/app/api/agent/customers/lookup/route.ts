import { NextRequest, NextResponse } from 'next/server';
import { requireAgentSession } from '@/lib/agent-session';
import { writeAuditEntry } from '@/lib/agent-audit';
import { apiRoot } from '@/lib/ct/client';

export async function GET(req: NextRequest) {
  const { session, error } = await requireAgentSession(req);
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const email = searchParams.get('email');
  const customerId = searchParams.get('customerId');
  const orderId = searchParams.get('orderId');
  const name = searchParams.get('name');

  if (!email && !customerId && !orderId && !name) {
    return NextResponse.json(
      { error: 'Provide one of: email, customerId, orderId, name' },
      { status: 400 }
    );
  }

  try {
    type CustomerRecord = { id: string; email: string; firstName?: string; lastName?: string; isEmailVerified: boolean };

    // Name search: CT = is case-sensitive on name fields in practice.
    // Workaround: include both the input as typed AND title-cased form in an in() clause,
    // covering the common case where names are stored as "Sofia" but typed as "sofia".
    // Input is split on whitespace so "Maria Smith" searches first OR last name per token.
    if (name) {
      const trimmed = name.trim();

      // Minimum 2-character guard
      if (trimmed.length < 2) {
        return NextResponse.json({ found: false, customers: [] });
      }

      const toTitleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

      const tokens = [...new Set(trimmed.split(/\s+/).filter(Boolean))];
      const clauses = tokens.flatMap((t) => {
        const variants = [...new Set([t, toTitleCase(t), t.toLowerCase(), t.toUpperCase()])]
          .map((v) => `"${v.replace(/"/g, '\\"')}"`)
          .join(', ');
        return [`firstName in (${variants})`, `lastName in (${variants})`];
      });
      const where = clauses.join(' or ');

      const result = await apiRoot
        .customers()
        .get({ queryArgs: { where, limit: 10 } })
        .execute();
      const customers = result.body.results;

      await writeAuditEntry({
        agentId: session.agentId,
        agentEmail: session.agentEmail,
        agentName: session.agentName,
        customerId: null,
        sessionId: session.sessionId,
        actionType: 'customer.lookup',
        actionDetail: { searchMethod: 'name', found: customers.length > 0 },
        timestamp: new Date().toISOString(),
        outcome: 'success',
      });

      return NextResponse.json({
        found: customers.length > 0,
        customers: customers.map((c) => ({
          id: c.id,
          email: c.email,
          firstName: c.firstName ?? '',
          lastName: c.lastName ?? '',
          isEmailVerified: c.isEmailVerified,
        })),
      });
    }

    let customer: CustomerRecord | null = null;

    if (email) {
      const result = await apiRoot
        .customers()
        .get({ queryArgs: { where: `email="${email}"`, limit: 1 } })
        .execute();
      customer = result.body.results[0] ?? null;
    } else if (customerId) {
      const result = await apiRoot.customers().withId({ ID: customerId }).get().execute();
      customer = result.body;
    } else if (orderId) {
      const orderResult = await apiRoot.orders().withId({ ID: orderId }).get().execute();
      if (orderResult.body.customerId) {
        const result = await apiRoot
          .customers()
          .withId({ ID: orderResult.body.customerId })
          .get()
          .execute();
        customer = result.body;
      }
    }

    const found = customer !== null;

    await writeAuditEntry({
      agentId: session.agentId,
      agentEmail: session.agentEmail,
      agentName: session.agentName,
      customerId: customer?.id ?? null,
      sessionId: session.sessionId,
      actionType: 'customer.lookup',
      actionDetail: {
        searchMethod: email ? 'email' : customerId ? 'customerId' : 'orderId',
        found,
      },
      timestamp: new Date().toISOString(),
      outcome: 'success',
    });

    if (!customer) {
      return NextResponse.json({ found: false, customer: null });
    }

    // Count open orders
    const ordersResult = await apiRoot
      .orders()
      .get({
        queryArgs: {
          where: `customerId="${customer.id}" and orderState in ("Open", "Confirmed")`,
          limit: 0,
        },
      })
      .execute();

    return NextResponse.json({
      found: true,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName ?? '',
        lastName: customer.lastName ?? '',
        isEmailVerified: customer.isEmailVerified,
        openOrderCount: ordersResult.body.total ?? 0,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lookup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
