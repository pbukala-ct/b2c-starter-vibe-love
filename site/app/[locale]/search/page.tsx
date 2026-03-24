import { searchProducts } from '@/lib/ct/search';
import ProductGrid from '@/components/product/ProductGrid';
import ProductFilters from '@/components/product/ProductFilters';
import { getLocale } from '@/lib/session';
import { toUrlLocale } from '@/lib/utils';
import { Suspense } from 'react';
import Link from 'next/link';

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

export const metadata = { title: 'Search' };

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
    sort: sp.sort || 'createdAt',
    locale,
    currency,
    country,
    limit,
    offset,
  });

  const products = result.results.map((r) => r.productProjection);

  // Extract available filter options from results
  const availableColors = [...new Set(products.flatMap(p =>
    [...(p.masterVariant?.attributes || []), ...(p.variants?.flatMap((v: { attributes?: Array<{ name: string; value: unknown }> }) => v.attributes || []) || [])]
      .filter((a: { name: string }) => a.name === 'search-color')
      .map((a: { name: string; value: unknown }) => typeof a.value === 'object' && a.value !== null ? (a.value as { key?: string }).key || '' : String(a.value))
      .filter(Boolean)
  ))];
  const availableFinishes = [...new Set(products.flatMap(p =>
    [...(p.masterVariant?.attributes || []), ...(p.variants?.flatMap((v: { attributes?: Array<{ name: string; value: unknown }> }) => v.attributes || []) || [])]
      .filter((a: { name: string }) => a.name === 'search-finish')
      .map((a: { name: string; value: unknown }) => typeof a.value === 'object' && a.value !== null ? (a.value as { key?: string }).key || '' : String(a.value))
      .filter(Boolean)
  ))];

  const totalPages = Math.ceil(result.total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const title = sp.q
    ? `Search results for "${sp.q}"`
    : sp.newArrival === 'true'
    ? 'New Arrivals'
    : 'All Products';

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-xs text-charcoal-light mb-6">
        <Link href={lp('/')} className="hover:text-terra">Home</Link>
        <span>/</span>
        <span className="text-charcoal">{title}</span>
      </nav>

      <div className="flex gap-8">
        <aside className="hidden md:block w-52 flex-shrink-0">
          <Suspense>
            <ProductFilters
              currentColor={sp.color}
              currentFinish={sp.finish}
              currentSort={sp.sort}
              availableColors={availableColors}
              availableFinishes={availableFinishes}
            />
          </Suspense>
        </aside>

        <div className="flex-1 min-w-0">
          <ProductGrid products={products} title={title} total={result.total} />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {currentPage > 1 && (
                <Link
                  href={`?${new URLSearchParams({ ...sp, offset: String((currentPage - 2) * limit) })}`}
                  className="px-4 py-2 border border-border text-sm hover:bg-cream transition-colors rounded-sm"
                >← Prev</Link>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const page = i + 1;
                return (
                  <Link
                    key={page}
                    href={`?${new URLSearchParams({ ...sp, offset: String((page - 1) * limit) })}`}
                    className={`w-9 h-9 flex items-center justify-center border text-sm rounded-sm ${page === currentPage ? 'bg-charcoal text-white border-charcoal' : 'border-border hover:bg-cream'}`}
                  >
                    {page}
                  </Link>
                );
              })}
              {currentPage < totalPages && (
                <Link
                  href={`?${new URLSearchParams({ ...sp, offset: String(currentPage * limit) })}`}
                  className="px-4 py-2 border border-border text-sm hover:bg-cream transition-colors rounded-sm"
                >Next →</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
