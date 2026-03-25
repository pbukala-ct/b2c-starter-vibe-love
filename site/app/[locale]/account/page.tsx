'use client';

import { useState, useEffect } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useSWRConfig } from 'swr';
import { KEY_ACCOUNT } from '@/lib/cache-keys';
import { useTranslations } from 'next-intl';

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
}

export default function AccountProfilePage() {
  const { data: user } = useAccount();
  const { mutate } = useSWRConfig();
  const t = useTranslations('account');
  const [form, setForm] = useState<ProfileForm>({ firstName: '', lastName: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('updateFailed'));
      } else {
        mutate(
          KEY_ACCOUNT,
          {
            ...user!,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
          },
          { revalidate: false }
        );
        setMessage(t('profileUpdated'));
      }
    } catch {
      setError(t('somethingWentWrong'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-charcoal mb-6 text-2xl font-semibold">{t('profile')}</h1>

      <div className="border-border rounded-sm border bg-white p-6">
        <form onSubmit={handleSubmit} className="max-w-md space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="profile-first-name"
                className="text-charcoal mb-1.5 block text-sm font-medium"
              >
                {t('firstName')}
              </label>
              <input
                id="profile-first-name"
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                required
                className="border-border text-charcoal focus:border-charcoal w-full rounded-sm border px-3 py-2.5 text-sm transition-colors focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="profile-last-name"
                className="text-charcoal mb-1.5 block text-sm font-medium"
              >
                {t('lastName')}
              </label>
              <input
                id="profile-last-name"
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                required
                className="border-border text-charcoal focus:border-charcoal w-full rounded-sm border px-3 py-2.5 text-sm transition-colors focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="text-charcoal mb-1.5 block text-sm font-medium"
            >
              {t('emailAddress')}
            </label>
            <input
              id="profile-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              className="border-border text-charcoal focus:border-charcoal w-full rounded-sm border px-3 py-2.5 text-sm transition-colors focus:outline-none"
            />
          </div>

          {message && (
            <div className="bg-sage/10 border-sage/20 text-charcoal rounded-sm border px-4 py-3 text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="bg-charcoal hover:bg-charcoal/80 rounded-sm px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            {isSaving ? t('saving') : t('saveChanges')}
          </button>
        </form>
      </div>
    </div>
  );
}
