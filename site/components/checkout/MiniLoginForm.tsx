'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAccount } from '@/hooks/useAccount';
import { useCartSWR } from '@/hooks/useCartSWR';

interface MiniLoginFormProps {
  onLoginSuccess?: () => void;
}

export function MiniLoginForm({ onLoginSuccess }: MiniLoginFormProps) {
  const t = useTranslations('checkout');
  const tAuth = useTranslations('auth');
  const { mutate: mutateAccount } = useAccount();
  const { mutate: mutateCart } = useCartSWR();
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
      } else {
        const c = data.customer || data;
        mutateAccount({ id: c.id, email: c.email, firstName: c.firstName, lastName: c.lastName }, { revalidate: false });
        // Refresh cart in case an anonymous cart was merged
        await mutateCart();
        onLoginSuccess?.();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isExpanded) {
    return (
      <div className="bg-cream border border-border rounded-sm p-4 text-sm flex items-center justify-between">
        <span className="text-charcoal-light">
          {t('signInPrompt')}{' '}
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-terra hover:underline font-medium"
          >
            {t('signInLink')}
          </button>
        </span>
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="text-xs text-charcoal-light hover:text-charcoal transition-colors ml-2"
        >
          ›
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-charcoal text-sm">{t('miniLoginTitle')}</h3>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="text-charcoal-light hover:text-charcoal text-xs"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-charcoal mb-1">
            {tAuth('emailLabel')}
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder={tAuth('emailPlaceholder')}
            className="w-full border border-border rounded-sm px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal mb-1">
            {tAuth('passwordLabel')}
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full border border-border rounded-sm px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-charcoal text-white py-2.5 text-sm font-medium hover:bg-charcoal/80 transition-colors rounded-sm disabled:opacity-50"
        >
          {isLoading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
