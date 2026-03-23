'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

function ResetPasswordContent() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to reset password. The token may be invalid or expired.');
      } else {
        router.push('/login');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-charcoal">{t('resetPasswordTitle')}</h1>
          <p className="text-charcoal-light mt-2 text-sm">{t('resetPasswordDescription')}</p>
        </div>

        <div className="bg-white border border-border rounded-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-charcoal mb-1.5">
                {t('tokenLabel')}
              </label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={e => setToken(e.target.value)}
                required
                autoComplete="one-time-code"
                placeholder={t('tokenPlaceholder')}
                className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors font-mono"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-charcoal mb-1.5">
                {t('newPasswordLabel')}
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-charcoal mb-1.5">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-charcoal text-white py-3 text-sm font-medium hover:bg-charcoal/80 transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting…' : t('submitReset')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-terra hover:underline font-medium">
              {t('loginInstead')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-charcoal border-t-transparent" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
