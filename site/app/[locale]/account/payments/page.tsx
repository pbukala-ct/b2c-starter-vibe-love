'use client';

import { useState } from 'react';
import { usePayments, usePaymentMutations } from '@/hooks/usePayments';
import { useTranslations } from 'next-intl';

function detectBrand(number: string): string {
  const n = number.replace(/\s/g, '');
  if (n.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (/^6(?:011|5)/.test(n)) return 'Discover';
  return 'Card';
}

function BrandBadge({ brand }: { brand: string }) {
  const colors: Record<string, string> = {
    Visa: 'bg-blue-600',
    Mastercard: 'bg-orange-500',
    Amex: 'bg-sky-600',
    Discover: 'bg-amber-500',
    Card: 'bg-charcoal',
  };
  return (
    <span
      className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold text-white ${colors[brand] || 'bg-charcoal'}`}
    >
      {brand === 'Mastercard' ? 'MC' : brand.slice(0, 4)}
    </span>
  );
}

export default function PaymentsPage() {
  const t = useTranslations('payments');
  const { data: cards = [], isLoading } = usePayments();
  const { addPayment, deletePayment, setDefaultPayment } = usePaymentMutations();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cardholderName: '', cardNumber: '', expiry: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const raw = form.cardNumber.replace(/\s/g, '');
    if (raw.length < 12) {
      setFormError(t('invalidCardNumber'));
      return;
    }
    if (!form.expiry.match(/^\d{2}\/\d{2}$/)) {
      setFormError(t('invalidExpiry'));
      return;
    }
    setSaving(true);
    try {
      await addPayment({
        cardholderName: form.cardholderName,
        last4: raw.slice(-4),
        brand: detectBrand(raw),
        expiry: form.expiry,
      });
      setForm({ cardholderName: '', cardNumber: '', expiry: '' });
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : t('failedToSave'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cardId: string) {
    try {
      await deletePayment(cardId);
    } catch {
      // silently ignore
    }
  }

  async function handleSetDefault(cardId: string) {
    try {
      await setDefaultPayment(cardId);
    } catch {
      // silently ignore
    }
  }

  function formatCardNumber(val: string) {
    return val
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-charcoal mb-6 text-2xl font-semibold">{t('title')}</h1>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-cream-dark h-20 animate-pulse rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-charcoal text-2xl font-semibold">{t('title')}</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-charcoal hover:bg-charcoal/80 rounded-sm px-4 py-2 text-sm text-white transition-colors"
          >
            {t('addCard')}
          </button>
        )}
      </div>

      <p className="text-charcoal-light bg-cream border-border mb-6 rounded-sm border px-3 py-2 text-xs">
        {t('demoNotice')}
      </p>

      {showForm && (
        <div className="border-border mb-6 rounded-sm border bg-white p-6">
          <h2 className="text-charcoal mb-4 font-semibold">{t('addPaymentMethod')}</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label
                htmlFor="pay-cardholder"
                className="text-charcoal mb-1 block text-xs font-medium"
              >
                {t('cardholderName')}
              </label>
              <input
                id="pay-cardholder"
                type="text"
                required
                placeholder={t('cardholderNamePlaceholder')}
                value={form.cardholderName}
                onChange={(e) => setForm((f) => ({ ...f, cardholderName: e.target.value }))}
                className="border-border focus:border-charcoal w-full rounded-sm border px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="pay-card-number"
                className="text-charcoal mb-1 block text-xs font-medium"
              >
                {t('cardNumber')}
              </label>
              <input
                id="pay-card-number"
                type="text"
                required
                placeholder="4242 4242 4242 4242"
                value={form.cardNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cardNumber: formatCardNumber(e.target.value) }))
                }
                className="border-border focus:border-charcoal w-full rounded-sm border px-3 py-2 font-mono text-sm focus:outline-none"
              />
            </div>
            <div className="w-32">
              <label htmlFor="pay-expiry" className="text-charcoal mb-1 block text-xs font-medium">
                {t('expiry')}
              </label>
              <input
                id="pay-expiry"
                type="text"
                required
                placeholder="12/28"
                maxLength={5}
                value={form.expiry}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                  if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                  setForm((f) => ({ ...f, expiry: v }));
                }}
                className="border-border focus:border-charcoal w-full rounded-sm border px-3 py-2 font-mono text-sm focus:outline-none"
              />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-charcoal hover:bg-charcoal/80 rounded-sm px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? t('saving') : t('saveCard')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormError('');
                }}
                className="border-border text-charcoal-light hover:text-charcoal rounded-sm border px-5 py-2 text-sm"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {cards.length === 0 && !showForm ? (
        <div className="border-border rounded-sm border bg-white p-12 text-center">
          <div className="bg-cream-dark mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <svg
              className="text-charcoal-light h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h2 className="text-charcoal mb-2 font-semibold">{t('noPaymentMethods')}</h2>
          <p className="text-charcoal-light mx-auto max-w-xs text-sm">
            {t('noPaymentMethodsDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="border-border flex items-center justify-between gap-4 rounded-sm border bg-white p-5"
            >
              <div className="flex items-center gap-4">
                <BrandBadge brand={card.brand} />
                <div>
                  <p className="text-charcoal text-sm font-medium">
                    •••• •••• •••• {card.last4}
                    {card.isDefault && (
                      <span className="bg-sage/10 text-sage border-sage/20 ml-2 rounded-full border px-1.5 py-0.5 text-xs">
                        {t('default')}
                      </span>
                    )}
                  </p>
                  <p className="text-charcoal-light text-xs">
                    {card.cardholderName} · {t('expires')} {card.expiry}
                  </p>
                  <p className="text-charcoal-light/50 mt-0.5 font-mono text-xs">
                    {card.token.slice(0, 24)}…
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!card.isDefault && (
                  <button
                    onClick={() => handleSetDefault(card.id)}
                    className="text-charcoal-light hover:text-charcoal border-border hover:border-charcoal rounded-sm border px-2.5 py-1 text-xs transition-colors"
                  >
                    {t('setDefault')}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(card.id)}
                  className="text-charcoal-light border-border rounded-sm border px-2.5 py-1 text-xs transition-colors hover:border-red-300 hover:text-red-500"
                >
                  {t('remove')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
