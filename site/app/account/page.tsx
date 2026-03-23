'use client';

import { useState, useEffect } from 'react';
import { useAccount } from '@/hooks/useAccount';

export default function AccountProfilePage() {
  const { data: user, mutate } = useAccount();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
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
        body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update profile');
      } else {
        const c = data.customer;
        mutate({ ...user!, firstName: c.firstName, lastName: c.lastName }, { revalidate: false });
        setMessage('Profile updated successfully');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-charcoal mb-6">Profile</h1>

      <div className="bg-white border border-border rounded-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-first-name" className="block text-sm font-medium text-charcoal mb-1.5">First name</label>
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
              <label htmlFor="profile-last-name" className="block text-sm font-medium text-charcoal mb-1.5">Last name</label>
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
            <label htmlFor="profile-email" className="block text-sm font-medium text-charcoal mb-1.5">Email address</label>
            <input
              id="profile-email"
              type="email"
              value={form.email}
              disabled
              className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal-light bg-cream focus:outline-none transition-colors"
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
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
