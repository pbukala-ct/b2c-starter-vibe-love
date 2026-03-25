'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AgentRole } from '@/lib/agent-session';

interface AgentNavProps {
  agentName: string;
  agentEmail: string;
  role: AgentRole;
  activeCustomerId: string | null;
  activeCustomerName?: string | null;
  sessionExp?: number | null;
}

function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function AgentNav({
  agentName,
  agentEmail,
  role,
  activeCustomerId,
  activeCustomerName,
  sessionExp,
}: AgentNavProps) {
  const router = useRouter();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionExp) return;

    function tick() {
      const now = Math.floor(Date.now() / 1000);
      setRemaining(Math.max(0, sessionExp! - now));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionExp]);

  // Auto-logout when timer reaches zero
  useEffect(() => {
    if (remaining === 0) {
      fetch('/api/agent/auth/logout', { method: 'POST' }).finally(() => {
        router.push('/agent/login');
      });
    }
  }, [remaining, router]);

  async function handleLogout() {
    await fetch('/api/agent/auth/logout', { method: 'POST' });
    router.push('/agent/login');
  }

  async function handleEndCustomerSession() {
    await fetch('/api/agent/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: null }),
    });
    router.push('/agent/dashboard');
    router.refresh();
  }

  const isWarning = remaining !== null && remaining < 5 * 60;

  return (
    <header className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="font-semibold text-sm">Agent Portal</span>
        <span className="text-gray-400 text-xs">|</span>
        <span className="text-gray-300 text-xs">
          {agentName} ({role})
        </span>
        {remaining !== null && (
          <span className={`text-xs font-mono ${isWarning ? 'text-red-400' : 'text-gray-400'}`}>
            {formatMMSS(remaining)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {activeCustomerId && (
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-xs">
              Customer: {activeCustomerName ?? activeCustomerId.slice(0, 8) + '…'}
            </span>
            <button
              onClick={handleEndCustomerSession}
              className="text-xs bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded"
            >
              End session
            </button>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
