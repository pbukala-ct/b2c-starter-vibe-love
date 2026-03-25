import { redirect } from 'next/navigation';
import { getAgentSession } from '@/lib/agent-session';
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

  // Fetch the cookie header for the server-side API call
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:8888';
  const cartRes = await fetch(`${base}/api/agent/customers/${customerId}/cart`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  const cartData = cartRes.ok ? await cartRes.json() : { cart: null };

  return (
    <>
      <CustomerDetailClient
        customerId={customerId}
        agentRole={session.role}
        initialCart={cartData.cart}
      />
      <CustomerAddressBook customerId={customerId} agentRole={session.role} />
    </>
  );
}
