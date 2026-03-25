import { redirect } from 'next/navigation';
import { getAgentSession } from '@/lib/agent-session';
import { writeAuditEntry } from '@/lib/agent-audit';
import { apiRoot } from '@/lib/ct/client';
import CustomerDetailClient from '@/components/agent/CustomerDetailClient';
import CustomerAddressBook from '@/components/agent/CustomerAddressBook';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const session = await getAgentSession();

  if (!session || session.activeCustomerId !== customerId) {
    redirect('/agent/dashboard');
  }

  // Fetch cart directly from CT — no HTTP self-call
  let initialCart = null;
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
      actionDetail: { cartId: cart?.id ?? null, lineItemCount: cart?.lineItems?.length ?? 0 },
      timestamp: new Date().toISOString(),
      outcome: 'success',
    });

    if (cart) {
      const staleHours = (Date.now() - new Date(cart.lastModifiedAt).getTime()) / (1000 * 60 * 60);
      initialCart = {
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
        shippingAddress: (cart.shippingAddress as unknown as Record<string, string>) ?? null,
        totalPrice: cart.totalPrice,
        lastModifiedAt: cart.lastModifiedAt,
        isStale: staleHours > 24,
      };
    }
  } catch {
    // Cart fetch failed — show empty state
  }

  return (
    <>
      <CustomerDetailClient
        customerId={customerId}
        agentRole={session.role}
        initialCart={initialCart}
      />
      <CustomerAddressBook customerId={customerId} agentRole={session.role} />
    </>
  );
}
