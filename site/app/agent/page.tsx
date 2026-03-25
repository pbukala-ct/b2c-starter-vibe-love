import { redirect } from 'next/navigation';

// /agent → redirect to dashboard (handled by portal layout auth check)
export default function AgentRootPage() {
  redirect('/agent/dashboard');
}
