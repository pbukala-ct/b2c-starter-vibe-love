import type { ProductSearchFacetResult } from '@commercetools/platform-sdk';
import type { FacetResult } from '@/lib/types';

export function mapFacets(facets: ProductSearchFacetResult[]): FacetResult[] {
  return facets.flatMap((f) => {
    if (!('buckets' in f)) return [];
    const bucketFacet = f as { name: string; buckets: Array<{ key: string; count: number }> };
    return [
      {
        name: bucketFacet.name,
        buckets: bucketFacet.buckets.map(({ key, count }) => ({ key, count })),
      },
    ];
  });
}
