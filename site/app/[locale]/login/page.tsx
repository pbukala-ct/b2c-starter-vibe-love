'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useAuth();
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
        setUser({ id: c.id, email: c.email, firstName: c.firstName, lastName: c.lastName });
        router.push(redirect);
      }
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-charcoal">{t('welcomeBack')}</h1>
          <p className="text-charcoal-light mt-2">{t('signInToAccount')}</p>
        </div>

        <div className="bg-white border border-border rounded-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1.5">
                {t('emailAddress')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
                placeholder={t('emailPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-1.5">
                {t('password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
                placeholder={t('passwordPlaceholder')}
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
              {isLoading ? t('signingIn') : t('signIn')}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-charcoal-light">
              {t('noAccount')}{' '}
              <Link href={`${localePath('/register')}${redirect !== localePath('/account') ? `?redirect=${redirect}` : ''}`} className="text-terra hover:underline font-medium">
                {t('createOne')}
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setEmail('jen@example.com'); setPassword('123'); }}
              className="text-xs text-terra hover:underline font-medium"
            >
              {t('useTestCredentials')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
