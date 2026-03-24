'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useAuth();
  const { localePath } = useLocale();
  const t = useTranslations('auth');
  const redirect = searchParams.get('redirect') || localePath('/account');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace(redirect);
  }, [user, router, redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('registrationFailed'));
      } else {
        const c = data.customer || data;
        setUser({ id: c.id, email: c.email, firstName: c.firstName, lastName: c.lastName });
        router.push(redirect);
      }
    } catch {
      setError(t('registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-charcoal">{t('createAccount')}</h1>
          <p className="text-charcoal-light mt-2">{t('joinVibe')}</p>
        </div>

        <div className="bg-white border border-border rounded-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-charcoal mb-1.5">
                  {t('firstName')}
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                  className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
                  placeholder={t('firstNamePlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-charcoal mb-1.5">
                  {t('lastName')}
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                  className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
                  placeholder={t('lastNamePlaceholder')}
                />
              </div>
            </div>

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
                {t('newPassword')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
                placeholder={t('newPasswordPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-charcoal mb-1.5">
                {t('confirmPassword')}
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
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
              {isLoading ? t('creatingAccount') : t('createAccount')}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-charcoal-light">
              {t('alreadyHaveAccount')}{' '}
              <Link href={`${localePath('/login')}${redirect !== localePath('/account') ? `?redirect=${redirect}` : ''}`} className="text-terra hover:underline font-medium">
                {t('signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
