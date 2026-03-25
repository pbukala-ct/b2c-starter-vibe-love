import { redirect } from 'next/navigation';
import { getAgentSession, getAgentSessionExp } from '@/lib/agent-session';
import AgentNav from '@/components/agent/AgentNav';

export const metadata = { title: 'Agent Portal' };

export default async function AgentPortalLayout({ children }: { children: React.ReactNode }) {
  let session: Awaited<ReturnType<typeof getAgentSession>> = null;
  let sessionExp: Awaited<ReturnType<typeof getAgentSessionExp>> = null;
  try {
    [session, sessionExp] = await Promise.all([getAgentSession(), getAgentSessionExp()]);
  } catch {
    // AGENT_SESSION_SECRET missing or JWT failure — treat as unauthenticated
    redirect('/agent/login');
  }
  if (!session) {
    redirect('/agent/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AgentNav
        agentName={session.agentName}
        agentEmail={session.agentEmail}
        role={session.role}
        activeCustomerId={session.activeCustomerId}
        activeCustomerName={session.activeCustomerName ?? null}
        sessionExp={sessionExp}
      />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
