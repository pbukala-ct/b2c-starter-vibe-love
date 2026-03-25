'use client';

import { useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const { localePath } = useLocale();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-sage/10 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full">
            <svg
              className="text-sage h-7 w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-charcoal mb-3 text-2xl font-semibold">Check your email</h1>
          <p className="text-charcoal-light mb-6 text-sm">{t('requestResetSuccess')}</p>
          <Link
            href={localePath('/login')}
            className="text-terra text-sm font-medium hover:underline"
          >
            {t('loginInstead')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-charcoal text-3xl font-semibold">{t('requestResetTitle')}</h1>
          <p className="text-charcoal-light mt-2 text-sm">{t('requestResetDescription')}</p>
        </div>

        <div className="border-border rounded-sm border bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="text-charcoal mb-1.5 block text-sm font-medium">
                {t('emailAddress')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
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
              {isLoading ? 'Sending…' : t('requestResetTitle')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href={localePath('/login')}
              className="text-terra text-sm font-medium hover:underline"
            >
              {t('loginInstead')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
