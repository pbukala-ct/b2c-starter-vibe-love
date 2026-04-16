import { apiRoot } from './client';
import type { Category as CtCategory } from '@commercetools/platform-sdk';
import type { Category } from '@/lib/types';
import { mapCategory } from '@/lib/mappers/category';
import { DEFAULT_LOCALE } from '@/lib/utils';
import { searchProducts } from '@/lib/ct/search';
import { CTP_STORE_KEY } from '@/lib/ct/client';

export type { Category };

let rawCache: CtCategory[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getRawCategories(): Promise<CtCategory[]> {
  if (rawCache && Date.now() - cacheTime < CACHE_TTL) {
    return rawCache;
  }
  const result = await apiRoot
    .categories()
    .get({ queryArgs: { limit: 200 } })
    .execute();
  rawCache = result.body.results;
  cacheTime = Date.now();
  return rawCache;
}

export async function getCategories(locale: string = DEFAULT_LOCALE.locale): Promise<Category[]> {
  const raw = await getRawCategories();
  return raw.map((c) => mapCategory(c, locale));
}

export async function getCategoryTree(locale: string = DEFAULT_LOCALE.locale): Promise<Category[]> {
  const flat = await getCategories(locale);
  const map = new Map<string, Category>();
  const roots: Category[] = [];

  for (const cat of flat) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of map.values()) {
    if (cat.parent) {
      const parent = map.get(cat.parent.id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(cat);
      } else {
        roots.push(cat);
      }
    } else {
      roots.push(cat);
    }
  }

  const sortByHint = (a: Category, b: Category) => {
    const aH = parseFloat(a.orderHint || '0.5');
    const bH = parseFloat(b.orderHint || '0.5');
    return aH - bH;
  };

  const sortTree = (cats: Category[]): Category[] => {
    return cats.sort(sortByHint).map((c) => ({
      ...c,
      children: sortTree(c.children || []),
    }));
  };

  return sortTree(roots);
}

/**
 * Returns the category tree filtered to only categories that have at least one
 * product in the configured store's product selection. Falls back to the full
 * tree when no store key is set. Parent categories are preserved if any of their
 * children appear in the store.
 */
export async function getStoreScopedCategories(
  locale: string = DEFAULT_LOCALE.locale,
  currency: string = DEFAULT_LOCALE.currency,
  country: string = DEFAULT_LOCALE.country
): Promise<Category[]> {
  const tree = await getCategoryTree(locale);

  if (!CTP_STORE_KEY) return tree;

  // Fetch a broad slice of store products to collect their category IDs
  let storeCategoryIds: Set<string>;
  try {
    const { products } = await searchProducts({ limit: 250, locale, currency, country });
    storeCategoryIds = new Set(products.flatMap((p) => p.categories.map((c) => c.id)));
  } catch {
    // If the search fails, show all categories rather than an empty nav
    return tree;
  }

  if (storeCategoryIds.size === 0) return tree;

  // Keep a top-level category if it or any of its children has a store product
  const filtered: Category[] = [];
  for (const topCat of tree) {
    const filteredChildren = (topCat.children ?? []).filter((child) =>
      storeCategoryIds.has(child.id)
    );
    const topCatHasProducts = storeCategoryIds.has(topCat.id);
    if (!topCatHasProducts && filteredChildren.length === 0) continue;
    filtered.push({ ...topCat, children: filteredChildren });
  }
  return filtered;
}

export async function getCategoryBySlug(
  slug: string,
  locale: string = DEFAULT_LOCALE.locale
): Promise<Category | null> {
  const categories = await getCategories(locale);
  return categories.find((c) => c.slug === slug) || null;
}

export async function getCategoryById(
  id: string,
  locale: string = DEFAULT_LOCALE.locale
): Promise<Category | null> {
  const categories = await getCategories(locale);
  return categories.find((c) => c.id === id) || null;
}
