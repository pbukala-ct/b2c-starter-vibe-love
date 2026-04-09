'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/routing';
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
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-charcoal text-3xl font-semibold">{t('resetPasswordTitle')}</h1>
          <p className="text-charcoal-light mt-2 text-sm">{t('resetPasswordDescription')}</p>
        </div>

        <div className="border-border rounded-sm border bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="token" className="text-charcoal mb-1.5 block text-sm font-medium">
                {t('tokenLabel')}
              </label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                autoComplete="one-time-code"
                placeholder={t('tokenPlaceholder')}
                className="border-border text-charcoal focus:border-charcoal w-full rounded-sm border px-3 py-2.5 font-mono text-sm transition-colors focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="text-charcoal mb-1.5 block text-sm font-medium"
              >
                {t('newPasswordLabel')}
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="border-border text-charcoal focus:border-charcoal w-full rounded-sm border px-3 py-2.5 text-sm transition-colors focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="text-charcoal mb-1.5 block text-sm font-medium"
              >
                {t('confirmPassword')}
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="border-border text-charcoal focus:border-charcoal w-full rounded-sm border px-3 py-2.5 text-sm transition-colors focus:outline-none"
              />
            </div>

            {error && (
              <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="bg-charcoal hover:bg-charcoal/80 w-full rounded-sm py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Resetting…' : t('submitReset')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-terra text-sm font-medium hover:underline">
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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="border-charcoal h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
