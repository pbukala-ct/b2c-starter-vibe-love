'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useTranslations } from 'next-intl';

const COLORS = [
  { key: 'black', label: 'Black', hex: '#1A1A1A' },
  { key: 'gray', label: 'Gray', hex: '#9CA3AF' },
  { key: 'white', label: 'White', hex: '#F9FAFB' },
  { key: 'blue', label: 'Blue', hex: '#3B82F6' },
  { key: 'brown', label: 'Brown', hex: '#92400E' },
  { key: 'green', label: 'Green', hex: '#22C55E' },
  { key: 'red', label: 'Red', hex: '#EF4444' },
  { key: 'purple', label: 'Purple', hex: '#A855F7' },
  { key: 'pink', label: 'Pink', hex: '#EC4899' },
  { key: 'yellow', label: 'Yellow', hex: '#EAB308' },
  { key: 'gold', label: 'Gold', hex: '#D97706' },
  { key: 'silver', label: 'Silver', hex: '#C0C0C0' },
  {
    key: 'multicolored',
    label: 'Multi',
    hex: 'linear-gradient(135deg, #3B82F6, #EC4899, #22C55E)',
  },
];

const FINISHES = [
  { key: 'black', label: 'Black' },
  { key: 'white', label: 'White' },
  { key: 'gold', label: 'Gold' },
  { key: 'silver', label: 'Silver' },
  { key: 'brown', label: 'Brown' },
  { key: 'gray', label: 'Gray' },
  { key: 'glass', label: 'Glass' },
  { key: 'transparent', label: 'Clear' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
];

interface ProductFiltersProps {
  currentColor?: string;
  currentFinish?: string;
  currentSort?: string;
  showFinish?: boolean;
  availableColors?: string[];
  availableFinishes?: string[];
}

export default function ProductFilters({
  currentColor,
  currentFinish,
  currentSort = 'createdAt',
  showFinish = true,
  availableColors,
  availableFinishes,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('search');

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('offset'); // Reset pagination
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('color');
    params.delete('finish');
    params.delete('offset');
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasFilters = currentColor || currentFinish;

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h3 className="text-charcoal mb-3 text-xs font-semibold tracking-wider uppercase">
          {t('sortBy')}
        </h3>
        <select
          value={currentSort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="border-border focus:border-charcoal w-full rounded-sm border bg-white px-3 py-2 text-sm focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Color filter */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-charcoal text-xs font-semibold tracking-wider uppercase">
            {t('color')}
          </h3>
          {currentColor && (
            <button
              onClick={() => updateFilter('color', null)}
              className="text-terra text-xs hover:underline"
            >
              {t('clear')}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {COLORS.filter((c) => !availableColors || availableColors.includes(c.key)).map(
            (color) => (
              <button
                key={color.key}
                onClick={() => updateFilter('color', currentColor === color.key ? null : color.key)}
                title={color.label}
                aria-label={color.label}
                className={`h-7 w-7 rounded-full border-2 transition-all ${
                  currentColor === color.key
                    ? 'border-charcoal scale-110'
                    : 'border-border hover:border-charcoal-light'
                }`}
                style={{
                  background: color.hex,
                  boxShadow: color.key === 'white' ? 'inset 0 0 0 1px #E5E0D8' : undefined,
                }}
              />
            )
          )}
        </div>
      </div>

      {/* Finish filter */}
      {showFinish && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-charcoal text-xs font-semibold tracking-wider uppercase">
              {t('finish')}
            </h3>
            {currentFinish && (
              <button
                onClick={() => updateFilter('finish', null)}
                className="text-terra text-xs hover:underline"
              >
                {t('clear')}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {FINISHES.filter((f) => !availableFinishes || availableFinishes.includes(f.key)).map(
              (finish) => (
                <button
                  key={finish.key}
                  onClick={() =>
                    updateFilter('finish', currentFinish === finish.key ? null : finish.key)
                  }
                  className={`rounded-sm border px-3 py-1 text-xs transition-all ${
                    currentFinish === finish.key
                      ? 'bg-charcoal border-charcoal text-white'
                      : 'border-border text-charcoal-light hover:border-charcoal hover:text-charcoal'
                  }`}
                >
                  {finish.label}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Clear all */}
      {hasFilters && (
        <button onClick={clearFilters} className="text-terra text-xs hover:underline">
          {t('clearAllFilters')}
        </button>
      )}
    </div>
  );
}
