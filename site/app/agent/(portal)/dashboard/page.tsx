'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerSearchDropdown from '@/components/agent/CustomerSearchDropdown';

type SearchMethod = 'email' | 'customerId' | 'orderId';

interface CustomerResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  openOrderCount: number;
}

export default function AgentDashboardPage() {
  const router = useRouter();
  const [searchMethod, setSearchMethod] = useState<SearchMethod>('email');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CustomerResult | null | 'not-found'>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const params = new URLSearchParams({ [searchMethod]: query });
      const res = await fetch(`/api/agent/customers/lookup?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Search failed');
        return;
      }

      setResult(data.found ? data.customer : 'not-found');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSession(customerId: string, customerName?: string) {
    const res = await fetch('/api/agent/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, customerName: customerName ?? null }),
    });
    if (res.ok) {
      router.push(`/agent/customers/${customerId}`);
      router.refresh();
    }
  }

  async function handleDropdownSelect(customer: { id: string; firstName: string; lastName: string; email: string }) {
    const customerName = `${customer.firstName} ${customer.lastName}`.trim() || customer.email;
    await handleStartSession(customer.id, customerName);
  }

  const placeholder =
    searchMethod === 'email'
      ? 'customer@example.com'
      : searchMethod === 'customerId'
      ? 'CT customer ID'
      : 'Order ID';

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Customer Lookup</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Search by name</p>
          <CustomerSearchDropdown onSelect={handleDropdownSelect} />
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2 w-fit mx-auto">or search by exact match</div>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            {(['email', 'customerId', 'orderId'] as SearchMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => { setSearchMethod(method); setQuery(''); setResult(null); }}
                className={`text-sm px-3 py-1 rounded border ${
                  searchMethod === method
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {method === 'email' ? 'Email' : method === 'customerId' ? 'Customer ID' : 'Order ID'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type={searchMethod === 'email' ? 'email' : 'text'}
              required
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {result === 'not-found' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          No customer found matching that query.
        </div>
      )}

      {result && result !== 'not-found' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
            Customer found
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="text-sm font-medium text-gray-900">
                {result.firstName} {result.lastName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{result.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Account status</p>
              <p className="text-sm font-medium text-gray-900">
                {result.isEmailVerified ? (
                  <span className="text-green-600">Verified</span>
                ) : (
                  <span className="text-yellow-600">Unverified email</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Open orders</p>
              <p className="text-sm font-medium text-gray-900">{result.openOrderCount}</p>
            </div>
          </div>
          <button
            onClick={() => handleStartSession(result.id, `${result.firstName} ${result.lastName}`.trim() || result.email)}
            className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800"
          >
            Start customer session →
          </button>
        </div>
      )}
    </div>
  );
}
