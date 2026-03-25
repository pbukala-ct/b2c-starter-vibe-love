'use client';

interface PillFacetProps {
  buckets: { key: string; count: number }[];
  currentValue: string | null;
  onSelect: (key: string | null) => void;
}

export default function PillFacet({ buckets, currentValue, onSelect }: PillFacetProps) {
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
          {key} ({count})
        </button>
      ))}
    </div>
  );
}
