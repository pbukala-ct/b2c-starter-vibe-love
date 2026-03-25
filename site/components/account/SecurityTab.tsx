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
      <h2 className="text-charcoal mb-2 text-xl font-semibold">{t('changePassword')}</h2>
      <p className="text-charcoal-light mb-6 text-sm">{t('changePasswordDescription')}</p>

      <div className="border-border rounded-sm border bg-white p-6">
        <form onSubmit={handleSubmit} className="max-w-md space-y-5">
          <div>
            <label className="text-charcoal mb-1.5 block text-sm font-medium">
              {t('currentPassword')}
            </label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-charcoal mb-1.5 block text-sm font-medium">
              {t('newPassword')}
            </label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-charcoal mb-1.5 block text-sm font-medium">
              {t('confirmNewPassword')}
            </label>
            <input
              type="password"
              value={form.confirmNewPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmNewPassword: e.target.value }))}
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>

          {success && (
            <div className="bg-sage/10 border-sage/20 text-charcoal rounded-sm border px-4 py-3 text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-charcoal hover:bg-charcoal/80 rounded-sm px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Saving…' : t('changePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
