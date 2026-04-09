import { getTranslations } from 'next-intl/server';
import { apiRoot } from './client';
import { DEFAULT_LOCALE } from '@/lib/utils';
import type {
  ProductPagedSearchResponse,
  ProductSearchRequest,
  SearchSorting,
} from '@commercetools/platform-sdk';
import {
  type FacetDefinition,
  facetDefinitionsToFacetExpressions,
  getSearchableAttributes,
} from './facets';
import { getExtraFacets, FACET_BLOCKLIST, FACET_RENDERER_MAP } from './facet-config';
import { facetDefinitionToFacetValue } from './facets';
import { mapProduct } from '@/lib/mappers/product';
import { mapFacets } from '@/lib/mappers/facet';
import type { Product, FacetResult } from '@/lib/types';

export type { FacetDefinition } from './facets';

export type SortValues = Array<{ field: string; order: 'asc' | 'desc'; language?: string }>;

export interface SearchParams {
  query?: string;
  categoryId?: string;
  categorySubTree?: boolean;
  /** Generic facet filters keyed by URL param (e.g. { color: 'red', 'new-arrival': 'true' }). */
  facetFilters?: Record<string, string>;
  locale?: string;
  currency?: string;
  country?: string;
  limit?: number;
  offset?: number;
  sort?: SortValues;
  /** Override the auto-fetched facet definitions entirely (skips facet-config.ts). */
  facetDefinitions?: FacetDefinition[];
}

export interface SearchResult {
  total: number;
  offset: number;
  limit: number;
  products: Product[];
  facets: FacetResult[];
  facetDefinitions: FacetDefinition[];
}

const SORT_FIELD_MAP: Record<string, string> = {
  price: 'variants.prices.centAmount',
};

export function parseSortParam(sort: string): SortValues {
  return sort.split(',').map((s) => {
    const [field, order] = s.split(':');
    return { field: SORT_FIELD_MAP[field] ?? field, order: order as 'asc' | 'desc' };
  });
}

/** Invert FACET_RENDERER_MAP: urlParam → attributeId */
const URL_PARAM_TO_ATTRIBUTE_ID: Record<string, string> = Object.fromEntries(
  Object.entries(FACET_RENDERER_MAP)
    .filter(([, cfg]) => cfg.urlParam)
    .map(([attributeId, cfg]) => [cfg.urlParam!, attributeId])
);

function parseRangeKey(value: string): { gte?: number; lt?: number } {
  const [rawFrom, rawTo] = value.split('-');
  const result: { gte?: number; lt?: number } = {};
  if (rawFrom !== '*') result.gte = Number(rawFrom);
  if (rawTo !== '*') result.lt = Number(rawTo);
  return result;
}

function buildFacetFilterQueryParts(
  facetFilters: Record<string, string>,
  facetDefinitions: FacetDefinition[],
  locale: string
): unknown[] {
  return Object.entries(facetFilters).flatMap<unknown>(([urlParam, value]) => {
    if (!value) return [];
    const attributeId =
      URL_PARAM_TO_ATTRIBUTE_ID[urlParam] ??
      facetDefinitions.find(
        (f) => f.attributeId === urlParam || f.attributeId === `variants.attributes.${urlParam}`
      )?.attributeId ??
      `variants.attributes.${urlParam}`;
    const facetDef = facetDefinitions.find((f) => f.attributeId === attributeId);
    if (!facetDef) return [];
    const facetValue = facetDefinitionToFacetValue(facetDef, locale);
    if (facetDef.attributeType === 'money' || facetDef.attributeType === 'range') {
      return [{ range: { field: facetValue.field, ...parseRangeKey(value) } }];
    }
    return [
      {
        exact: {
          field: facetValue.field,
          ...(facetValue.fieldType ? { fieldType: facetValue.fieldType } : {}),
          ...('language' in facetValue && facetValue.language
            ? { language: facetValue.language }
            : {}),
          value: facetDef.attributeType === 'boolean' ? value === 'true' : value,
        },
      },
    ];
  });
}

export async function searchProducts(params: SearchParams): Promise<SearchResult> {
  const {
    query,
    categoryId,
    categorySubTree = true,
    facetFilters = {},
    locale = DEFAULT_LOCALE.locale,
    currency = DEFAULT_LOCALE.currency,
    country = DEFAULT_LOCALE.country,
    limit = 24,
    offset = 0,
    sort = [{ field: 'createdAt', order: 'desc' as const }],
    facetDefinitions,
  } = params;

  const queryParts: unknown[] = [];

  if (query) {
    const wildcardValue = `*${query}*`;
    queryParts.push({
      or: [
        {
          wildcard: {
            field: 'name',
            language: locale,
            value: wildcardValue,
            caseInsensitive: true,
          },
        },
        {
          wildcard: {
            field: 'description',
            language: locale,
            value: wildcardValue,
            caseInsensitive: true,
          },
        },
        {
          wildcard: {
            field: 'slug',
            language: locale,
            value: wildcardValue,
            caseInsensitive: true,
          },
        },
        {
          wildcard: {
            field: 'searchKeywords',
            language: locale,
            value: wildcardValue,
            caseInsensitive: true,
          },
        },
        { exact: { field: 'variants.sku', value: query, caseInsensitive: true } },
      ],
    });
  }

  if (categoryId) {
    queryParts.push({
      exact: {
        field: categorySubTree ? 'categoriesSubTree' : 'categories',
        value: categoryId,
      },
    });
  }

  const baseFacets = facetDefinitions ?? (await getSearchableAttributes(locale));
  const resolvedFacetDefinitions = facetDefinitions
    ? baseFacets
    : [
        ...baseFacets.filter((f) => !FACET_BLOCKLIST.includes(f.attributeId ?? '')),
        ...getExtraFacets(
          await getTranslations({ locale: locale.toLowerCase(), namespace: 'search' })
        ),
      ];

  queryParts.push(...buildFacetFilterQueryParts(facetFilters, resolvedFacetDefinitions, locale));

  const searchQuery =
    queryParts.length === 0
      ? undefined
      : queryParts.length === 1
        ? queryParts[0]
        : { and: queryParts };

  const sortParam = sort.map(
    (s) => (s.field === 'name' ? { ...s, language: locale } : s) as SearchSorting
  );

  const facets =
    resolvedFacetDefinitions.length > 0
      ? facetDefinitionsToFacetExpressions(resolvedFacetDefinitions, locale)
      : undefined;

  const body: ProductSearchRequest = {
    limit,
    offset,
    markMatchingVariants: true,
    productProjectionParameters: {
      priceCurrency: currency,
      priceCountry: country,
      expand: ['masterVariant.price.discounted.discount'],
    },
    sort: sortParam,
    ...(searchQuery ? { query: searchQuery as ProductSearchRequest['query'] } : {}),
    ...(facets ? { facets } : {}),
  };

  const toSearchResult = (raw: ProductPagedSearchResponse): SearchResult => ({
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
    products: raw.results
      .map((r) => {
        const projection = r.productProjection;
        if (!projection) return undefined;
        const mv = r.matchingVariants;
        const matchingIds =
          mv && !mv.allMatched ? new Set(mv.matchedVariants.map((v) => v.id)) : null;
        return mapProduct(projection, matchingIds, params.locale);
      })
      .filter((p) => p !== undefined),
    facets: mapFacets(raw.facets ?? []),
    facetDefinitions: resolvedFacetDefinitions,
  });

  // If the sort field has no data in the index (e.g. categoryOrderHints not set in Merchant Center),
  // CT returns a query_shard_exception. Retry without the custom sort so the page still loads.
  try {
    const { body: result } = await apiRoot.products().search().post({ body: body }).execute();
    return toSearchResult(result);
  } catch (err: unknown) {
    const msg =
      (err as { body?: { message?: string } }).body?.message ??
      (err as { message?: string }).message ??
      '';
    if (msg.includes('query_shard_exception')) {
      const fallbackBody = { ...body, sort: [{ field: 'createdAt', order: 'desc' as const }] };
      const { body: result } = await apiRoot
        .products()
        .search()
        .post({ body: fallbackBody })
        .execute();
      return toSearchResult(result);
    }
    throw new Error(`Product search failed: ${msg}`, { cause: err });
  }
}

export async function getProductBySku(
  sku: string,
  locale: string,
  currency: string,
  country: string
): Promise<Product | null> {
  try {
    const { body } = await apiRoot
      .products()
      .search()
      .post({
        body: {
          limit: 1,
          query: { exact: { field: 'variants.sku', value: sku } } as ProductSearchRequest['query'],
          productProjectionParameters: {
            priceCurrency: currency,
            priceCountry: country,
            localeProjection: [locale],
            expand: [
              'variants.price.discounted.discount',
              'masterVariant.price.discounted.discount',
            ],
          },
        },
      })
      .execute();
    const projection = body.results[0]?.productProjection;
    return projection ? mapProduct(projection, null, locale) : null;
  } catch {
    return null;
  }
}
