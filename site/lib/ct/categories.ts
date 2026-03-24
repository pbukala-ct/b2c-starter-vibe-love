import { apiRoot } from './client';

export interface Category {
  id: string;
  name: Record<string, string>;
  slug: Record<string, string>;
  parent?: { typeId: string; id: string };
  orderHint?: string;
  children?: Category[];
}

let categoriesCache: Category[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCategories(): Promise<Category[]> {
  if (categoriesCache && Date.now() - cacheTime < CACHE_TTL) {
    return categoriesCache;
  }

  const result = await apiRoot
    .categories()
    .get({ queryArgs: { limit: 200 } })
    .execute();
  categoriesCache = result.body.results.map((c) => ({
    id: c.id,
    name: c.name as Record<string, string>,
    slug: c.slug as Record<string, string>,
    parent: c.parent,
    orderHint: c.orderHint,
  }));
  cacheTime = Date.now();
  return categoriesCache;
}

export async function getCategoryTree(): Promise<Category[]> {
  const flat = await getCategories();
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

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => Object.values(c.slug).includes(slug)) || null;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.id === id) || null;
}
