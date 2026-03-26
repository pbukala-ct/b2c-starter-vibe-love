'use client';

import { useFormatters } from '@/hooks/useFormatters';
import { useLocale } from '@/context/LocaleContext';

interface MoneyRangeFacetProps {
  buckets: { key: string; count: number }[];
  currentValue: string | null;
  onSelect: (key: string | null) => void;
}

/** Parses a CT range bucket key like "*-10000", "10000-20000", "20000-*" */
function parseRangeKey(key: string): { from?: number; to?: number } {
  const [rawFrom, rawTo] = key.split('-');
  return {
    from: rawFrom === '*' ? undefined : Number(rawFrom),
    to: rawTo === '*' ? undefined : Number(rawTo),
  };
}

export default function MoneyRangeFacet({ buckets, currentValue, onSelect }: MoneyRangeFacetProps) {
  const { formatMoney } = useFormatters();
  const { currency } = useLocale();

  function formatLabel(key: string): string {
    const { from, to } = parseRangeKey(key);
    const fmtFrom = from !== undefined ? formatMoney(from, currency) : null;
    const fmtTo = to !== undefined ? formatMoney(to, currency) : null;
    if (fmtFrom && fmtTo) return `${fmtFrom} – ${fmtTo}`;
    if (fmtTo) return `< ${fmtTo}`;
    if (fmtFrom) return `> ${fmtFrom}`;
    return key;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {buckets.map(({ key, count }) => (
        <button
          key={key}
          onClick={() => onSelect(currentValue === key ? null : key)}
          className={`rounded-sm border px-3 py-1 text-xs transition-all ${
            currentValue === key
              ? 'bg-charcoal border-charcoal text-white'
              : 'border-border text-charcoal-light hover:border-charcoal hover:text-charcoal'
          }`}
        >
          {formatLabel(key)} ({count})
        </button>
      ))}
    </div>
  );
}
