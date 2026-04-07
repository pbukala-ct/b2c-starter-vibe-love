import Link from 'next/link';
import Image from 'next/image';
import { searchProducts } from '@/lib/ct/search';
import { getCategoryTree } from '@/lib/ct/categories';
import ProductCard from '@/components/product/ProductCard';
import HeroBanner from '@/components/home/HeroBanner';
import { getLocalizedString, toUrlLocale } from '@/lib/utils';
import { getLocale } from '@/lib/session';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const { country, currency, locale } = await getLocale();
  const lp = (p: string) => `/${toUrlLocale(country)}${p}`;
  const t = await getTranslations('home');
  const tCommon = await getTranslations('common');
  const [newArrivals, featuredResult, categories] = await Promise.all([
    searchProducts({
      limit: 4,
      sort: [{ field: 'createdAt', order: 'desc' }],
      currency,
      country,
      locale,
    }),
    searchProducts({ limit: 8, currency, country, locale }),
    getCategoryTree(),
  ]);

  const topCategories = categories.filter((c) => !c.parent).slice(0, 4);

  return (
    <div>
      <HeroBanner locale={locale} localizedPath={lp} />

      {/* Category cards */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <h2 className="text-charcoal mb-8 text-2xl font-semibold">{t('shopByCategory')}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {topCategories.map((cat) => {
            const name = getLocalizedString(cat.name, locale);
            const slug = getLocalizedString(cat.slug, locale);
            const catImages: Record<string, string> = {
              furniture:
                'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Art_Deco_Coffee_Table-1.1.jpeg',
              'home-decor':
                'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Braided_Rug-1.1.jpeg',
              kitchen:
                'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Ella_Square_Plate-1.1.jpeg',
              'new-arrivals':
                'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Aria_Rug-1.1.jpeg',
            };
            const img = catImages[slug] || '';

            return (
              <Link
                key={cat.id}
                href={lp(`/category/${slug}`)}
                className="group bg-cream-dark relative aspect-square overflow-hidden rounded-sm"
              >
                {img && (
                  <Image
                    src={img}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                )}
                <div className="from-charcoal/60 absolute inset-0 bg-linear-to-t to-transparent" />
                <div className="absolute right-0 bottom-0 left-0 p-4">
                  <h3 className="text-sm font-semibold text-white">{name}</h3>
                  <p className="mt-0.5 text-xs text-white/70 transition-colors group-hover:text-white">
                    {tCommon('explore')}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-charcoal text-2xl font-semibold">{t('newArrivals')}</h2>
          <Link href={lp('/search?sort=createdAt')} className="text-terra text-sm hover:underline">
            {tCommon('viewAll')}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {newArrivals.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Subscribe & Save Banner */}
      <section className="bg-sage/10 border-sage/20 border-y py-12">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
          <h2 className="text-charcoal mb-3 text-2xl font-semibold">
            {t('subscribeAndSaveTitle')}
          </h2>
          <p className="text-charcoal-light mx-auto mb-6 max-w-md">
            {t('subscribeAndSaveDescription')}
          </p>
          <Link
            href={lp('/search?subscriptionEligible=true')}
            className="bg-sage hover:bg-sage/90 inline-block rounded-sm px-6 py-3 text-sm font-medium text-white transition-colors"
          >
            {t('shopSubscribeAndSave')}
          </Link>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-charcoal text-2xl font-semibold">{t('featuredProducts')}</h2>
          <Link href={lp('/search')} className="text-terra text-sm hover:underline">
            {tCommon('viewAll')}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {featuredResult.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
