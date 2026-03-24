'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
}

export default function AccountProfilePage() {
  const { user, setUser } = useAuth();
  const t = useTranslations('account');
  const [form, setForm] = useState<Profile>({ firstName: '', lastName: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '' });
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
        setUser({ ...user!, firstName: data.firstName, lastName: data.lastName, email: data.email });
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
      <h1 className="text-2xl font-semibold text-charcoal mb-6">{t('profile')}</h1>

      <div className="bg-white border border-border rounded-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-first-name" className="block text-sm font-medium text-charcoal mb-1.5">{t('firstName')}</label>
              <input
                id="profile-first-name"
                type="text"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                required
                className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
              />
            </div>
            <div>
              <label htmlFor="profile-last-name" className="block text-sm font-medium text-charcoal mb-1.5">{t('lastName')}</label>
              <input
                id="profile-last-name"
                type="text"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                required
                className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-charcoal mb-1.5">{t('emailAddress')}</label>
            <input
              id="profile-email"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
            />
          </div>

          {message && (
            <div className="bg-sage/10 border border-sage/20 text-charcoal text-sm px-4 py-3 rounded-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="bg-charcoal text-white px-6 py-2.5 text-sm font-medium hover:bg-charcoal/80 transition-colors rounded-sm disabled:opacity-50"
          >
            {isSaving ? t('saving') : t('saveChanges')}
          </button>
        </form>
      </div>
    </div>
  );
}
