'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function SecurityTab() {
  const t = useTranslations('account');
  const tAuth = useTranslations('auth');
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) {
      setError(tAuth('required'));
      return;
    }

    if (form.newPassword !== form.confirmNewPassword) {
      setError(tAuth('passwordMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to change password.');
      } else {
        setSuccess(t('passwordChanged'));
        setForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    'w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors';

  return (
    <div>
      <h2 className="text-xl font-semibold text-charcoal mb-2">{t('changePassword')}</h2>
      <p className="text-sm text-charcoal-light mb-6">{t('changePasswordDescription')}</p>

      <div className="bg-white border border-border rounded-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              {t('currentPassword')}
            </label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              {t('newPassword')}
            </label>
            <input
              type="password"
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              {t('confirmNewPassword')}
            </label>
            <input
              type="password"
              value={form.confirmNewPassword}
              onChange={e => setForm(f => ({ ...f, confirmNewPassword: e.target.value }))}
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>

          {success && (
            <div className="bg-sage/10 border border-sage/20 text-charcoal text-sm px-4 py-3 rounded-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-charcoal text-white px-6 py-2.5 text-sm font-medium hover:bg-charcoal/80 transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving…' : t('changePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
