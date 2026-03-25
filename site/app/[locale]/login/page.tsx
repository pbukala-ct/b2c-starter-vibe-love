'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from '@/hooks/useAccount';
import { useSWRConfig } from 'swr';
import { KEY_ACCOUNT } from '@/lib/cache-keys';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user } = useAccount();
  const { mutate } = useSWRConfig();
  const { localePath } = useLocale();
  const t = useTranslations('auth');
  const redirect = searchParams.get('redirect') || localePath('/account');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace(redirect);
  }, [user, router, redirect]);

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
        setError(data.error || t('invalidCredentials'));
      } else {
        const c = data.customer || data;
        mutate(KEY_ACCOUNT, { id: c.id, email: c.email, firstName: c.firstName, lastName: c.lastName }, { revalidate: false });
        router.push(redirect);
      }
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-charcoal text-3xl font-semibold">{t('welcomeBack')}</h1>
          <p className="text-charcoal-light mt-2">{t('signInToAccount')}</p>
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
                className="border-border text-charcoal focus:border-charcoal w-full rounded-sm border px-3 py-2.5 text-sm transition-colors focus:outline-none"
                placeholder={t('emailPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="password" className="text-charcoal mb-1.5 block text-sm font-medium">
                {t('password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="border-border text-charcoal focus:border-charcoal w-full rounded-sm border px-3 py-2.5 text-sm transition-colors focus:outline-none"
                placeholder={t('passwordPlaceholder')}
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
              {isLoading ? t('signingIn') : t('signIn')}
            </button>
          </form>

          <div className="border-border mt-6 border-t pt-6 text-center">
            <p className="text-charcoal-light text-sm">
              {t('noAccount')}{' '}
              <Link
                href={`${localePath('/register')}${redirect !== localePath('/account') ? `?redirect=${redirect}` : ''}`}
                className="text-terra font-medium hover:underline"
              >
                {t('createOne')}
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setEmail('jen@example.com');
                setPassword('123');
              }}
              className="text-terra text-xs font-medium hover:underline"
            >
              {t('useTestCredentials')}
            </button>
          </div>

          <div className="mt-3 text-center">
            <Link href={localePath('/forgot-password')} className="text-charcoal-light text-xs hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
