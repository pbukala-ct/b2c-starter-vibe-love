'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface CustomerResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
}

interface CustomerSearchDropdownProps {
  onSelect: (customer: CustomerResult) => void;
}

export default function CustomerSearchDropdown({ onSelect }: CustomerSearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/customers/lookup?name=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.customers ?? []);
        setOpen(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  }

  function handleSelect(customer: CustomerResult) {
    setQuery(`${customer.firstName} ${customer.lastName}`.trim() || customer.email);
    setOpen(false);
    onSelect(customer);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by first or last name…"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        {loading && (
          <span className="self-center text-xs text-gray-400">Searching…</span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => handleSelect(c)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between gap-4"
              >
                <span className="text-sm text-gray-900">
                  {c.firstName} {c.lastName}
                </span>
                <span className="text-xs text-gray-500 truncate">{c.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow px-4 py-3 text-sm text-gray-500">
          No customers found matching &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
