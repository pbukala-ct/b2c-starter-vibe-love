import { NextRequest, NextResponse } from 'next/server';
import { requireAgentSession, requireActiveCustomer } from '@/lib/agent-session';
import { writeAuditEntry } from '@/lib/agent-audit';
import { apiRoot } from '@/lib/ct/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { session, error } = await requireAgentSession(req);
  if (error) return error;

  const { customerId } = await params;
  const scopeError = requireActiveCustomer(session, customerId);
  if (scopeError) return scopeError;

  try {
    const result = await apiRoot
      .carts()
      .get({
        queryArgs: {
          where: `customerId="${customerId}" and cartState="Active"`,
          sort: 'lastModifiedAt desc',
          limit: 1,
          expand: ['lineItems[*].variant', 'shippingInfo.shippingMethod'],
        },
      })
      .execute();

    const cart = result.body.results[0] ?? null;

    await writeAuditEntry({
      agentId: session.agentId,
      agentEmail: session.agentEmail,
      agentName: session.agentName,
      customerId,
      sessionId: session.sessionId,
      actionType: 'cart.viewed',
      actionDetail: {
        cartId: cart?.id ?? null,
        lineItemCount: cart?.lineItems?.length ?? 0,
      },
      timestamp: new Date().toISOString(),
      outcome: 'success',
    });

    if (!cart) {
      return NextResponse.json({ cart: null });
    }

    const now = Date.now();
    const lastModified = new Date(cart.lastModifiedAt).getTime();
    const staleHours = (now - lastModified) / (1000 * 60 * 60);

    return NextResponse.json({
      cart: {
        id: cart.id,
        version: cart.version,
        lineItems: cart.lineItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          sku: item.variant?.sku ?? '',
          quantity: item.quantity,
          unitPrice: item.price.value,
          totalPrice: item.totalPrice,
        })),
        discountCodes: cart.discountCodes ?? [],
        shippingAddress: cart.shippingAddress ?? null,
        shippingInfo: cart.shippingInfo ?? null,
        totalPrice: cart.totalPrice,
        lastModifiedAt: cart.lastModifiedAt,
        isStale: staleHours > 24,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch cart';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
