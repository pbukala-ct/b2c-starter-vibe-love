import { notFound } from 'next/navigation';
import { getCategoryBySlug, getCategoryTree } from '@/lib/ct/categories';
import { searchProducts, parseSortParam } from '@/lib/ct/search';
import ProductGrid from '@/components/product/ProductGrid';
import ProductFilters from '@/components/product/ProductFilters';
import { getLocalizedString, toUrlLocale } from '@/lib/utils';
import { getLocale } from '@/lib/session';
import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    color?: string;
    finish?: string;
    sort?: string;
    offset?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: 'Category Not Found' };
  const name = getLocalizedString(category.name, 'en-US');
  return { title: name };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const { country, currency, locale } = await getLocale();
  const lp = (p: string) => `/${toUrlLocale(country)}${p}`;

  const [category, categoryTree] = await Promise.all([getCategoryBySlug(slug), getCategoryTree()]);

  if (!category) notFound();

  const name = getLocalizedString(category.name, locale);
  const offset = parseInt(sp.offset || '0');
  const limit = 24;

  const result = await searchProducts({
    categoryId: category.id,
    categorySubTree: true,
    filters: {
      color: sp.color,
      finish: sp.finish,
    },
    sort: sp.sort
      ? parseSortParam(sp.sort)
      : [{ field: `categoryOrderHints.${category.id}`, order: 'asc' as const }],
    locale,
    currency,
    country,
    limit,
    offset,
  });

  const products = result.results.map((r) => r.productProjection);

  // Extract available filter options from results
  const availableColors = [
    ...new Set(
      products.flatMap((p) =>
        [
          ...(p.masterVariant?.attributes || []),
          ...(p.variants?.flatMap(
            (v: { attributes?: Array<{ name: string; value: unknown }> }) => v.attributes || []
          ) || []),
        ]
          .filter((a: { name: string }) => a.name === 'search-color')
          .map((a: { name: string; value: unknown }) =>
            typeof a.value === 'object' && a.value !== null
              ? (a.value as { key?: string }).key || ''
              : String(a.value)
          )
          .filter(Boolean)
      )
    ),
  ];
  const availableFinishes = [
    ...new Set(
      products.flatMap((p) =>
        [
          ...(p.masterVariant?.attributes || []),
          ...(p.variants?.flatMap(
            (v: { attributes?: Array<{ name: string; value: unknown }> }) => v.attributes || []
          ) || []),
        ]
          .filter((a: { name: string }) => a.name === 'search-finish')
          .map((a: { name: string; value: unknown }) =>
            typeof a.value === 'object' && a.value !== null
              ? (a.value as { key?: string }).key || ''
              : String(a.value)
          )
          .filter(Boolean)
      )
    ),
  ];

  // Build breadcrumb
  const breadcrumb: Array<{ name: string; slug: string }> = [];
  let current = category;
  while (current.parent) {
    const parent = categoryTree.flat().find((c) => c.id === current.parent?.id);
    if (parent) {
      breadcrumb.unshift({
        name: getLocalizedString(parent.name, 'en-US'),
        slug: parent.slug['en-US'] || Object.values(parent.slug)[0],
      });
      current = parent;
    } else break;
  }
  breadcrumb.push({ name, slug });

  const totalPages = Math.ceil(result.total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Breadcrumb */}
      <nav className="text-charcoal-light mb-6 flex items-center gap-2 text-xs">
        <Link href={lp('/')} className="hover:text-terra">
          Home
        </Link>
        {breadcrumb.map((crumb, i) => (
          <span key={crumb.slug} className="flex items-center gap-2">
            <span>/</span>
            {i === breadcrumb.length - 1 ? (
              <span className="text-charcoal">{crumb.name}</span>
            ) : (
              <Link href={lp(`/category/${crumb.slug}`)} className="hover:text-terra">
                {crumb.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex gap-8">
        {/* Filters sidebar */}
        <aside className="hidden w-52 flex-shrink-0 md:block">
          <Suspense>
            <ProductFilters
              currentColor={sp.color}
              currentFinish={sp.finish}
              currentSort={sp.sort ? parseSortParam(sp.sort) : undefined}
              availableColors={availableColors}
              availableFinishes={availableFinishes}
            />
          </Suspense>

          {/* Subcategory links */}
          {category.children && category.children.length > 0 && (
            <div className="mt-8">
              <h3 className="text-charcoal mb-3 text-xs font-semibold tracking-wider uppercase">
                Subcategories
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href={lp(`/category/${slug}`)}
                    className="text-charcoal hover:text-terra block py-1 text-sm font-medium"
                  >
                    All {name}
                  </Link>
                </li>
                {category.children.map((child) => {
                  const childName = getLocalizedString(child.name, 'en-US');
                  const childSlug = child.slug['en-US'] || Object.values(child.slug)[0];
                  return (
                    <li key={child.id}>
                      <Link
                        href={lp(`/category/${childSlug}`)}
                        className="text-charcoal-light hover:text-terra block py-1 text-sm"
                      >
                        {childName}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        {/* Products */}
        <div className="min-w-0 flex-1">
          <ProductGrid products={products} title={name} total={result.total} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`?${new URLSearchParams({ ...sp, offset: String((currentPage - 2) * limit) })}`}
                  className="border-border hover:bg-cream rounded-sm border px-4 py-2 text-sm transition-colors"
                >
                  ← Prev
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const page = i + 1;
                return (
                  <Link
                    key={page}
                    href={`?${new URLSearchParams({ ...sp, offset: String((page - 1) * limit) })}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-sm border text-sm transition-colors ${page === currentPage ? 'bg-charcoal border-charcoal text-white' : 'border-border hover:bg-cream'}`}
                  >
                    {page}
                  </Link>
                );
              })}
              {currentPage < totalPages && (
                <Link
                  href={`?${new URLSearchParams({ ...sp, offset: String(currentPage * limit) })}`}
                  className="border-border hover:bg-cream rounded-sm border px-4 py-2 text-sm transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
