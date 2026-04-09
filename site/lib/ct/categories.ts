import { apiRoot } from './client';
import type { Category as CtCategory } from '@commercetools/platform-sdk';
import type { Category } from '@/lib/types';
import { mapCategory } from '@/lib/mappers/category';
import { DEFAULT_LOCALE } from '@/lib/utils';

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
