// Shared domain types for use in frontend components.
// Components must import types from here — never directly from @/lib/ct/*.

export interface Price {
  centAmount: number;
  currencyCode: string;
  discounted?: {
    centAmount: number;
    currencyCode: string;
    discountName?: Record<string, string>;
  };
  recurrencePolicy?: { id: string };
  country?: string;
}

export interface Variant {
  id: number;
  sku: string;
  images: string[];
  price?: Price;
  prices: Price[];
  attributes: Array<{ name: string; value: unknown }>;
  availability?: { isOnStock?: boolean };
  isMatchingVariant?: boolean;
}

export interface Product {
  id: string;
  key?: string;
  name: Record<string, string>;
  slug: Record<string, string>;
  description?: Record<string, string>;
  categories: Array<{ id: string }>;
  variants: Variant[]; // index 0 is the master variant
  metaTitle?: Record<string, string>;
  metaDescription?: Record<string, string>;
  metaKeywords?: Record<string, string>;
}

export interface FacetResult {
  name: string;
  buckets: Array<{ key: string; count: number }>;
}

export interface Category {
  id: string;
  name: Record<string, string>;
  slug: Record<string, string>;
  parent?: { typeId: string; id: string };
  orderHint?: string;
  children?: Category[];
  metaTitle?: Record<string, string>;
  metaDescription?: Record<string, string>;
  metaKeywords?: Record<string, string>;
}
