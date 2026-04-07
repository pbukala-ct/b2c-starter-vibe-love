import Link from 'next/link';
import { searchProducts } from '@/lib/ct/search';
import { getCategoryTree } from '@/lib/ct/categories';
import ProductCard from '@/components/product/ProductCard';
import HeroBanner from '@/components/home/HeroBanner';
import CategoryCard from '@/components/category/CategoryCard';
import { getLocalizedString } from '@/lib/utils';
import { getLocale } from '@/lib/session';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/home/Section';

export default async function HomePage() {
  const { country, currency, locale } = await getLocale();
  const urlLocale = locale.toLowerCase();
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
      <HeroBanner />

      {/* Category cards */}
      <Section title={'home.shopByCategory'}>
        {topCategories.map((cat) => {
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
          return (
            <CategoryCard key={cat.id} category={cat} locale={locale} image={catImages[slug]} />
          );
        })}
      </Section>

      {/* New Arrivals */}
      <Section
        title={'home.newArrivals'}
        cta={{ title: 'common.viewAll', target: `/${urlLocale}/search?sort=createdAt` }}
      >
        {newArrivals.products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </Section>

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
            href={`/${urlLocale}/search?subscriptionEligible=true`}
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
          <Link href={`/${urlLocale}/search`} className="text-terra text-sm hover:underline">
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
