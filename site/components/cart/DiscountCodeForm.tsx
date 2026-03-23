'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface DiscountCode {
  discountCodeId: string;
  code?: string;
  name?: string;
}

interface DiscountCodeFormProps {
  appliedDiscounts?: DiscountCode[];
  onApply: (code: string) => Promise<void>;
  onRemove: (discountCodeId: string) => Promise<void>;
}

export function DiscountCodeForm({ appliedDiscounts = [], onApply, onRemove }: DiscountCodeFormProps) {
  const t = useTranslations('cart');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setError('');
    setIsLoading(true);
    try {
      await onApply(trimmed);
      setCode('');
    } catch {
      setError(t('invalidCode'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleApply} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder={t('discountCodePlaceholder')}
          aria-label={t('discountCode')}
          className="flex-1 border border-border rounded-sm px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
        />
        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          className="bg-charcoal text-white px-4 py-2 text-sm font-medium hover:bg-charcoal/80 transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? '…' : t('applyCode')}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      {appliedDiscounts.length > 0 && (
        <ul className="space-y-2">
          {appliedDiscounts.map((d) => (
            <li
              key={d.discountCodeId}
              className="flex items-center justify-between bg-sage/10 border border-sage/20 rounded-sm px-3 py-2 text-sm"
            >
              <span className="font-medium text-charcoal">
                {d.code ?? d.name ?? d.discountCodeId}
              </span>
              <button
                type="button"
                onClick={() => onRemove(d.discountCodeId)}
                className="text-terra hover:underline text-xs ml-3"
              >
                {t('removeCode')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
