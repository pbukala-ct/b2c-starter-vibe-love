'use client';

const COLOR_HEX: Record<string, string> = {
  black: '#1A1A1A',
  gray: '#9CA3AF',
  white: '#F9FAFB',
  blue: '#3B82F6',
  brown: '#92400E',
  green: '#22C55E',
  red: '#EF4444',
  purple: '#A855F7',
  pink: '#EC4899',
  yellow: '#EAB308',
  gold: '#D97706',
  silver: '#C0C0C0',
  multicolored: 'linear-gradient(135deg, #3B82F6, #EC4899, #22C55E)',
};

interface ColorFacetProps {
  buckets: { key: string; count: number }[];
  attributeValues?: { key: string; label: string }[];
  currentValue: string | null;
  onSelect: (key: string | null) => void;
}

export default function ColorFacet({
  buckets,
  attributeValues,
  currentValue,
  onSelect,
}: ColorFacetProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {buckets.map(({ key }) => {
        const label = attributeValues?.find((v) => v.key === key)?.label ?? key;
        return (
          <button
            key={key}
            onClick={() => onSelect(currentValue === key ? null : key)}
            title={label}
            aria-label={label}
            className={`h-7 w-7 rounded-full border-2 transition-all ${
              currentValue === key
                ? 'border-charcoal scale-110'
                : 'border-border hover:border-charcoal-light'
            }`}
            style={{
              background: COLOR_HEX[key] || '',
              boxShadow: key === 'white' ? 'inset 0 0 0 1px #E5E0D8' : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
