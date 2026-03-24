import { apiUrl, projectKey } from './client';

export interface SearchFilters {
  color?: string;
  finish?: string;
  newArrival?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

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
  sort?: string;
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

async function getAdminToken(): Promise<string> {
  const authUrl = process.env.CTP_AUTH_URL!;
  const creds = Buffer.from(`${process.env.CTP_CLIENT_ID}:${process.env.CTP_CLIENT_SECRET}`).toString('base64');
  const resp = await fetch(`${authUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(process.env.CTP_SCOPES!)}`,
    next: { revalidate: 3500 },
  });
  const data = await resp.json();
  return data.access_token;
}

export async function searchProducts(params: SearchParams): Promise<SearchResult> {
  const token = await getAdminToken();
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
    sort = 'createdAt',
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

  const searchQuery = queryParts.length === 0
    ? undefined
    : queryParts.length === 1
    ? queryParts[0]
    : { and: queryParts };

  const sortParam = sort === 'price-asc' || sort === 'price-desc'
    ? [{ field: 'variants.prices.centAmount', order: sort === 'price-asc' ? 'asc' : 'desc' }]
    : sort === 'name'
    ? [{ field: 'name', locale, order: 'asc' }]
    : [{ field: 'createdAt', order: 'desc' as const }];

  const body: Record<string, unknown> = {
    limit,
    offset,
    productProjectionParameters: {
      priceCurrency: currency,
      priceCountry: country,
    },
    sort: sortParam,
  };

  if (searchQuery) body.query = searchQuery;

  const resp = await fetch(`${apiUrl}/${projectKey}/products/search`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate: 60 },
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(`Product search failed: ${err.message}`);
  }

  return resp.json();
}

export async function getProductBySku(sku: string, locale: string, currency: string, country: string): Promise<ProductProjection | null> {
  const token = await getAdminToken();

  const resp = await fetch(`${apiUrl}/${projectKey}/products/search`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      limit: 1,
      query: { exact: { field: 'variants.sku', value: sku } },
      productProjectionParameters: { priceCurrency: currency, priceCountry: country, localeProjection: [locale] },
    }),
    next: { revalidate: 60 },
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  return data.results[0]?.productProjection || null;
}

export async function getProductById(id: string, currency: string, country: string): Promise<ProductProjection | null> {
  const token = await getAdminToken();

  const resp = await fetch(`${apiUrl}/${projectKey}/products/search`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      limit: 1,
      query: { exact: { field: 'id', value: id } },
      productProjectionParameters: { priceCurrency: currency, priceCountry: country },
    }),
    next: { revalidate: 60 },
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  return data.results[0]?.productProjection || null;
}
