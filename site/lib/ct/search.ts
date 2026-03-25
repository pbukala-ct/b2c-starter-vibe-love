import { apiRoot } from './client';
import type { ProductSearchRequest, SearchSorting } from '@commercetools/platform-sdk';

export interface SearchFilters {
  color?: string;
  finish?: string;
  newArrival?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export type SortValues = Array<{ field: string; order: 'asc' | 'desc'; language?: string }>;

export interface SearchParams {
  query?: string;
  categoryId?: string;
  categorySubTree?: boolean;
  filters?: SearchFilters;
  locale?: string;
  currency?: string;
  country?: string;
  limit?: number;
  offset?: number;
  sort?: SortValues;
}

interface SearchResult {
  total: number;
  offset: number;
  limit: number;
  results: Array<{ id: string; productProjection: ProductProjection }>;
}

export interface ProductProjection {
  id: string;
  key?: string;
  name: Record<string, string>;
  description?: Record<string, string>;
  slug: Record<string, string>;
  categories: Array<{ typeId: string; id: string }>;
  masterVariant: Variant;
  variants: Variant[];
  productType: { typeId: string; id: string };
  attributes?: Array<{ name: string; value: unknown }>;
}

export interface Variant {
  id: number;
  sku?: string;
  key?: string;
  prices?: Price[];
  price?: Price;
  images?: Image[];
  attributes?: Array<{ name: string; value: unknown }>;
  recurrencePrices?: Price[];
}

export interface Price {
  id: string;
  key?: string;
  value: { type: string; currencyCode: string; centAmount: number; fractionDigits: number };
  country?: string;
  recurrencePolicy?: { typeId: string; id: string };
}

export interface Image {
  url: string;
  dimensions?: { w: number; h: number };
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

export async function searchProducts(params: SearchParams): Promise<SearchResult> {
  const {
    query,
    categoryId,
    categorySubTree = true,
    filters = {},
    locale = 'en-US',
    currency = 'USD',
    country = 'US',
    limit = 24,
    offset = 0,
    sort = [{ field: 'createdAt', order: 'desc' as const }],
  } = params;

  const queryParts: unknown[] = [];

  if (query) {
    queryParts.push({ fullText: { field: 'name', value: query, language: locale } });
  }

  if (categoryId) {
    queryParts.push({
      exact: {
        field: categorySubTree ? 'categoriesSubTree' : 'categories',
        value: categoryId,
      },
    });
  }

  if (filters.color) {
    queryParts.push({
      exact: {
        field: 'variants.attributes.search-color.key',
        fieldType: 'lenum',
        value: filters.color,
      },
    });
  }

  if (filters.finish) {
    queryParts.push({
      exact: {
        field: 'variants.attributes.search-finish.key',
        fieldType: 'lenum',
        value: filters.finish,
      },
    });
  }

  if (filters.newArrival) {
    queryParts.push({
      exact: {
        field: 'variants.attributes.new-arrival',
        fieldType: 'boolean',
        value: true,
      },
    });
  }

  const searchQuery =
    queryParts.length === 0
      ? undefined
      : queryParts.length === 1
        ? queryParts[0]
        : { and: queryParts };

  const sortParam = sort.map(
    (s) => (s.field === 'name' ? { ...s, language: locale } : s) as SearchSorting
  );

  const body: ProductSearchRequest = {
    limit,
    offset,
    productProjectionParameters: { priceCurrency: currency, priceCountry: country },
    sort: sortParam,
    ...(searchQuery ? { query: searchQuery as ProductSearchRequest['query'] } : {}),
  };

  // If the sort field has no data in the index (e.g. categoryOrderHints not set in Merchant Center),
  // CT returns a query_shard_exception. Retry without the custom sort so the page still loads.
  try {
    const { body: result } = await apiRoot.products().search().post({ body: body }).execute();
    return result as unknown as SearchResult;
  } catch (err: unknown) {
    const msg =
      (err as { body?: { message?: string } }).body?.message ??
      (err as { message?: string }).message ??
      '';
    throw new Error(`Product search failed: ${msg}`, { cause: err });
  }
}

export async function getProductBySku(
  sku: string,
  locale: string,
  currency: string,
  country: string
): Promise<ProductProjection | null> {
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
          },
        },
      })
      .execute();
    return (body as unknown as SearchResult).results[0]?.productProjection ?? null;
  } catch {
    return null;
  }
}

export async function getProductById(
  id: string,
  currency: string,
  country: string
): Promise<ProductProjection | null> {
  try {
    const { body } = await apiRoot
      .products()
      .search()
      .post({
        body: {
          limit: 1,
          query: { exact: { field: 'id', value: id } } as ProductSearchRequest['query'],
          productProjectionParameters: { priceCurrency: currency, priceCountry: country },
        },
      })
      .execute();
    return (body as unknown as SearchResult).results[0]?.productProjection ?? null;
  } catch {
    return null;
  }
}
