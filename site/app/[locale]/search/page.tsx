import { searchProducts, parseSortParam } from '@/lib/ct/search';
import ProductGrid from '@/components/product/ProductGrid';
import ProductFilters from '@/components/product/ProductFilters';
import { getLocale } from '@/lib/session';
import { toUrlLocale } from '@/lib/utils';
import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    color?: string;
    finish?: string;
    sort?: string;
    offset?: string;
    newArrival?: string;
  }>;
}

export const metadata: Metadata = { title: 'Search' };

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { country, currency, locale } = await getLocale();
  const lp = (p: string) => `/${toUrlLocale(country)}${p}`;
  const offset = parseInt(sp.offset || '0');
  const limit = 24;

  const result = await searchProducts({
    query: sp.q,
    filters: {
      color: sp.color,
      finish: sp.finish,
      newArrival: sp.newArrival === 'true',
    },
    sort: sp.sort ? parseSortParam(sp.sort) : [{ field: 'createdAt', order: 'desc' as const }],
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

  const totalPages = Math.ceil(result.total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const title = sp.q
    ? `Search results for "${sp.q}"`
    : sp.newArrival === 'true'
      ? 'New Arrivals'
      : 'All Products';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <nav className="text-charcoal-light mb-6 flex items-center gap-2 text-xs">
        <Link href={lp('/')} className="hover:text-terra">
          Home
        </Link>
        <span>/</span>
        <span className="text-charcoal">{title}</span>
      </nav>

      <div className="flex gap-8">
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
        </aside>

        <div className="min-w-0 flex-1">
          <ProductGrid products={products} title={title} total={result.total} />

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
                    className={`flex h-9 w-9 items-center justify-center rounded-sm border text-sm ${page === currentPage ? 'bg-charcoal border-charcoal text-white' : 'border-border hover:bg-cream'}`}
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
