// Shared domain types for use in frontend components.
// Components must import types from here — never directly from @/lib/ct/*.

import { JSX } from 'react';

export interface Price {
  centAmount: number;
  currencyCode: string;
  discounted?: {
    centAmount: number;
    currencyCode: string;
    discountName?: string;
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
  type: 'Product';
  id: string;
  key?: string;
  name: string;
  slug: string;
  description?: string;
  categories: Array<{ id: string }>;
  variants: Variant[]; // index 0 is the master variant
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface FacetResult {
  name: string;
  buckets: Array<{ key: string; count: number }>;
}

export interface Category {
  type: 'Category';
  id: string;
  images: string[];
  name: string;
  slug: string;
  parent?: { typeId: string; id: string };
  orderHint?: string;
  children?: Category[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface LayoutSection {
  sectionId: string;
  layoutElements: LayoutElement[];
}

export interface LayoutElement {
  layoutElementId?: string;
  configuration: LayoutElementConfiguration;
  items: LayoutItem[];
}

export interface LayoutElementConfiguration extends Configuration {
  size: number;
}

export interface LayoutItem {
  layoutItemId?: string;
  layoutItemType: string;
  configuration: LayoutItemConfiguration;
}

export type LayoutItemConfiguration = Configuration & {
  name?: string;
} & Record<string, any>;

export interface Configuration {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
}

export interface ImageProps {
  src?: string;
  alt?: string;
}

export interface ItemProps<T = object> {
  data: T;
  [key: string]: unknown;
}

export interface ItemRegistry {
  [key: string]: (props: ItemProps) => JSX.Element | Promise<JSX.Element>;
}

// ── Shop the Look ──────────────────────────────────────────────────────────────

export type BundleStatus = 'active' | 'draft';

export interface BundleProduct {
  productId: string;
  variantId: number;
  position: number;
}

export interface ShopTheLookBundle {
  name: string;
  description?: string;
  status: BundleStatus;
  products: BundleProduct[];
  createdAt: string;
  updatedAt: string;
}

export interface ShopTheLookCustomObject {
  id: string;
  key: string;
  version: number;
  container: 'shop-the-look';
  value: ShopTheLookBundle;
  lastModifiedAt: string;
}

export interface ResolvedLookProduct {
  productId: string;
  variantId: number;
  position: number;
  name: string;
  slug: string;
  image: string;
  priceCentAmount?: number;
  priceCurrency?: string;
  sku: string;
}
