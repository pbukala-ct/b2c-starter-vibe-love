'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { SortValues } from '@/lib/ct/search';

const COLORS = [
  { key: 'black', hex: '#1A1A1A' },
  { key: 'gray', hex: '#9CA3AF' },
  { key: 'white', hex: '#F9FAFB' },
  { key: 'blue', hex: '#3B82F6' },
  { key: 'brown', hex: '#92400E' },
  { key: 'green', hex: '#22C55E' },
  { key: 'red', hex: '#EF4444' },
  { key: 'purple', hex: '#A855F7' },
  { key: 'pink', hex: '#EC4899' },
  { key: 'yellow', hex: '#EAB308' },
  { key: 'gold', hex: '#D97706' },
  { key: 'silver', hex: '#C0C0C0' },
  { key: 'multicolored', hex: 'linear-gradient(135deg, #3B82F6, #EC4899, #22C55E)' },
];

const FINISHES = ['black', 'white', 'gold', 'silver', 'brown', 'gray', 'glass', 'transparent'];

const SORT_OPTIONS: Array<{ value: SortValues; translationKey: string }> = [
  {
    value: [
      { field: 'score', order: 'desc' },
      {
        order: 'desc',
        field: 'id',
      },
    ],
    translationKey: 'relevance',
  },
  { value: [{ field: 'createdAt', order: 'desc' }], translationKey: 'sortNewest' },
  {
    value: [{ field: 'price', order: 'asc' }],
    translationKey: 'sortPriceLow',
  },
  {
    value: [{ field: 'price', order: 'desc' }],
    translationKey: 'sortPriceHigh',
  },
  { value: [{ field: 'name', order: 'asc' }], translationKey: 'sortNameAZ' },
];

const DEFAULT_SORT: SortValues = [{ field: 'createdAt', order: 'desc' }];

function encodeSortValues(sort: SortValues): string {
  return sort.map((s) => `${s.field}:${s.order}`).join(',');
}

interface ProductFiltersProps {
  currentColor?: string;
  currentFinish?: string;
  currentSort?: SortValues;
  showFinish?: boolean;
  availableColors?: string[];
  availableFinishes?: string[];
}

export default function ProductFilters({
  currentColor,
  currentFinish,
  currentSort = DEFAULT_SORT,
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

  const updateSort = useCallback(
    (sort: SortValues) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('sort', encodeSortValues(sort));
      params.delete('offset');
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
          value={encodeSortValues(currentSort)}
          onChange={(e) => {
            const opt = SORT_OPTIONS.find((o) => encodeSortValues(o.value) === e.target.value);
            if (opt) updateSort(opt.value);
          }}
          className="border-border focus:border-charcoal w-full rounded-sm border bg-white px-3 py-2 text-sm focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => {
            const encoded = encodeSortValues(opt.value);
            return (
              <option key={encoded} value={encoded}>
                {t(opt.translationKey)}
              </option>
            );
          })}
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
            (color) => {
              const label = t(`colors.${color.key}`);
              return (
                <button
                  key={color.key}
                  onClick={() =>
                    updateFilter('color', currentColor === color.key ? null : color.key)
                  }
                  title={label}
                  aria-label={label}
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
              );
            }
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
            {FINISHES.filter((f) => !availableFinishes || availableFinishes.includes(f)).map(
              (finish) => (
                <button
                  key={finish}
                  onClick={() => updateFilter('finish', currentFinish === finish ? null : finish)}
                  className={`rounded-sm border px-3 py-1 text-xs transition-all ${
                    currentFinish === finish
                      ? 'bg-charcoal border-charcoal text-white'
                      : 'border-border text-charcoal-light hover:border-charcoal hover:text-charcoal'
                  }`}
                >
                  {t(`finishes.${finish}`)}
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
