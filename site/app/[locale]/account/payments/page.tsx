'use client';

import { useState, useEffect } from 'react';

interface StoredCard {
  id: string;
  cardholderName: string;
  last4: string;
  brand: string;
  expiry: string;
  token: string;
  isDefault: boolean;
}

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
    <span className={`inline-flex items-center justify-center text-white text-xs font-bold rounded px-1.5 py-0.5 ${colors[brand] || 'bg-charcoal'}`}>
      {brand === 'Mastercard' ? 'MC' : brand.slice(0, 4)}
    </span>
  );
}

export default function PaymentsPage() {
  const [cards, setCards] = useState<StoredCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cardholderName: '', cardNumber: '', expiry: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/account/payments')
      .then(r => r.json())
      .then(d => setCards(d.cards || []))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const raw = form.cardNumber.replace(/\s/g, '');
    if (raw.length < 12) { setFormError('Enter a valid card number'); return; }
    if (!form.expiry.match(/^\d{2}\/\d{2}$/)) { setFormError('Enter expiry as MM/YY'); return; }
    setSaving(true);
    const res = await fetch('/api/account/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardholderName: form.cardholderName,
        last4: raw.slice(-4),
        brand: detectBrand(raw),
        expiry: form.expiry,
      }),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) {
      setCards(d.cards);
      setForm({ cardholderName: '', cardNumber: '', expiry: '' });
      setShowForm(false);
    } else {
      setFormError(d.error || 'Failed to save card');
    }
  }

  async function handleDelete(cardId: string) {
    const res = await fetch('/api/account/payments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId }),
    });
    if (res.ok) setCards((await res.json()).cards);
  }

  async function handleSetDefault(cardId: string) {
    const res = await fetch('/api/account/payments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId }),
    });
    if (res.ok) setCards((await res.json()).cards);
  }

  function formatCardNumber(val: string) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-charcoal mb-6">Payment Methods</h1>
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-cream-dark rounded-sm animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">Payment Methods</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm bg-charcoal text-white px-4 py-2 rounded-sm hover:bg-charcoal/80 transition-colors"
          >
            Add Card
          </button>
        )}
      </div>

      <p className="text-xs text-charcoal-light mb-6 bg-cream border border-border rounded-sm px-3 py-2">
        This is a demo store. Only the last 4 digits are stored. A secure tokenization reference is generated for each card.
      </p>

      {showForm && (
        <div className="bg-white border border-border rounded-sm p-6 mb-6">
          <h2 className="font-semibold text-charcoal mb-4">Add Payment Method</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label htmlFor="pay-cardholder" className="block text-xs font-medium text-charcoal mb-1">Cardholder Name</label>
              <input id="pay-cardholder" type="text" required placeholder="Full name on card"
                value={form.cardholderName}
                onChange={e => setForm(f => ({ ...f, cardholderName: e.target.value }))}
                className="w-full border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-charcoal" />
            </div>
            <div>
              <label htmlFor="pay-card-number" className="block text-xs font-medium text-charcoal mb-1">Card Number</label>
              <input id="pay-card-number" type="text" required placeholder="4242 4242 4242 4242"
                value={form.cardNumber}
                onChange={e => setForm(f => ({ ...f, cardNumber: formatCardNumber(e.target.value) }))}
                className="w-full border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-charcoal font-mono" />
            </div>
            <div className="w-32">
              <label htmlFor="pay-expiry" className="block text-xs font-medium text-charcoal mb-1">Expiry (MM/YY)</label>
              <input id="pay-expiry" type="text" required placeholder="12/28" maxLength={5}
                value={form.expiry}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                  if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                  setForm(f => ({ ...f, expiry: v }));
                }}
                className="w-full border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-charcoal font-mono" />
            </div>
            {formError && <p className="text-red-600 text-sm">{formError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-charcoal text-white px-5 py-2 text-sm font-medium rounded-sm hover:bg-charcoal/80 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Card'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setFormError(''); }}
                className="border border-border text-charcoal-light px-5 py-2 text-sm rounded-sm hover:text-charcoal">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {cards.length === 0 && !showForm ? (
        <div className="bg-white border border-border rounded-sm p-12 text-center">
          <div className="w-12 h-12 bg-cream-dark rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-charcoal-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="font-semibold text-charcoal mb-2">No saved payment methods</h2>
          <p className="text-sm text-charcoal-light max-w-xs mx-auto">Add a card above to save it for faster checkout.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map(card => (
            <div key={card.id} className="bg-white border border-border rounded-sm p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <BrandBadge brand={card.brand} />
                <div>
                  <p className="text-sm font-medium text-charcoal">
                    •••• •••• •••• {card.last4}
                    {card.isDefault && (
                      <span className="ml-2 text-xs bg-sage/10 text-sage border border-sage/20 px-1.5 py-0.5 rounded-full">Default</span>
                    )}
                  </p>
                  <p className="text-xs text-charcoal-light">{card.cardholderName} · Expires {card.expiry}</p>
                  <p className="text-xs text-charcoal-light/50 font-mono mt-0.5">{card.token.slice(0, 24)}…</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!card.isDefault && (
                  <button onClick={() => handleSetDefault(card.id)}
                    className="text-xs text-charcoal-light hover:text-charcoal border border-border px-2.5 py-1 rounded-sm hover:border-charcoal transition-colors">
                    Set Default
                  </button>
                )}
                <button onClick={() => handleDelete(card.id)}
                  className="text-xs text-charcoal-light hover:text-red-500 border border-border px-2.5 py-1 rounded-sm hover:border-red-300 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
