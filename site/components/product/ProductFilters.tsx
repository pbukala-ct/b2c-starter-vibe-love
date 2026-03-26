'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { ProductSearchFacetResult } from '@commercetools/platform-sdk';
import type { FacetDefinition, SortValues } from '@/lib/ct/search';
import { BOOLEAN_FACET_ACTIVE_VALUE, FACET_RENDERER_MAP } from '@/lib/ct/facet-config';
import ColorFacet from './facets/ColorFacet';
import PillFacet from './facets/PillFacet';
import ToggleFacet from './facets/ToggleFacet';

const SORT_OPTIONS: Array<{ value: SortValues; translationKey: string }> = [
  {
    value: [
      { field: 'score', order: 'desc' },
      { order: 'desc', field: 'id' },
    ],
    translationKey: 'relevance',
  },
  { value: [{ field: 'createdAt', order: 'desc' }], translationKey: 'sortNewest' },
  { value: [{ field: 'price', order: 'asc' }], translationKey: 'sortPriceLow' },
  { value: [{ field: 'price', order: 'desc' }], translationKey: 'sortPriceHigh' },
  { value: [{ field: 'name', order: 'asc' }], translationKey: 'sortNameAZ' },
];

const DEFAULT_SORT: SortValues = [{ field: 'createdAt', order: 'desc' }];

function encodeSortValues(sort: SortValues): string {
  return sort.map((s) => `${s.field}:${s.order}`).join(',');
}

function facetParamKey(name: string): string {
  return name.replace('variants.attributes.', '');
}

function formatFacetLabel(name: string): string {
  return facetParamKey(name)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type BucketFacet = { name: string; buckets: { key: string; count: number }[] };

function isBucketFacet(f: ProductSearchFacetResult): f is BucketFacet {
  return 'buckets' in f;
}

interface ProductFiltersProps {
  currentSort?: SortValues;
  facets?: ProductSearchFacetResult[];
  facetDefinitions?: FacetDefinition[];
}

export default function ProductFilters({
  currentSort = DEFAULT_SORT,
  facets = [],
  facetDefinitions = [],
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
      params.delete('offset');
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

  const bucketFacets = facets.filter(isBucketFacet).filter((f) => f.buckets.length > 0);

  const activeFacetParams = bucketFacets.map((f) => {
    const config = FACET_RENDERER_MAP[f.name];
    return config?.urlParam ?? facetParamKey(f.name);
  });

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    activeFacetParams.forEach((key) => params.delete(key));
    params.delete('offset');
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasFilters = activeFacetParams.some((key) => searchParams.has(key));

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

      {/* Dynamic facets */}
      {bucketFacets.map((facet) => {
        const config = FACET_RENDERER_MAP[facet.name];
        const isBoolean = facet.buckets.every((b) => b.key === 'true' || b.key === 'false');
        const renderer = config?.renderer ?? (isBoolean ? 'toggle' : 'pill');
        const paramKey = config?.urlParam ?? facetParamKey(facet.name);
        const currentValue = searchParams.get(paramKey);

        return (
          <div key={facet.name}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-charcoal text-xs font-semibold tracking-wider uppercase">
                {facetDefinitions.find((d) => d.attributeId === facet.name)?.attributeLabel ??
                  formatFacetLabel(facet.name)}
              </h3>
              {renderer === 'toggle' ? (
                <ToggleFacet
                  isActive={currentValue === BOOLEAN_FACET_ACTIVE_VALUE}
                  onToggle={() =>
                    updateFilter(
                      paramKey,
                      currentValue === BOOLEAN_FACET_ACTIVE_VALUE
                        ? null
                        : BOOLEAN_FACET_ACTIVE_VALUE
                    )
                  }
                  label={
                    facetDefinitions.find((d) => d.attributeId === facet.name)?.attributeLabel ??
                    formatFacetLabel(facet.name)
                  }
                />
              ) : (
                currentValue && (
                  <button
                    onClick={() => updateFilter(paramKey, null)}
                    className="text-terra text-xs hover:underline"
                  >
                    {t('clear')}
                  </button>
                )
              )}
            </div>

            {renderer === 'color' && (
              <ColorFacet
                buckets={facet.buckets}
                attributeValues={
                  facetDefinitions.find((d) => d.attributeId === facet.name)?.attributeValues
                }
                currentValue={currentValue}
                onSelect={(key) => updateFilter(paramKey, key)}
              />
            )}

            {renderer === 'pill' && (
              <PillFacet
                buckets={facet.buckets}
                currentValue={currentValue}
                onSelect={(key) => updateFilter(paramKey, key)}
              />
            )}
          </div>
        );
      })}

      {/* Clear all */}
      {hasFilters && (
        <button onClick={clearFilters} className="text-terra text-xs hover:underline">
          {t('clearAllFilters')}
        </button>
      )}
    </div>
  );
}
