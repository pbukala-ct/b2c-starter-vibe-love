import Link from 'next/link';
import Image from 'next/image';
import { searchProducts } from '@/lib/ct/search';
import { getCategoryTree } from '@/lib/ct/categories';
import ProductCard from '@/components/product/ProductCard';
import { getLocalizedString, toUrlLocale } from '@/lib/utils';
import { getLocale } from '@/lib/session';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const { country, currency, locale } = await getLocale();
  const lp = (p: string) => `/${toUrlLocale(country)}${p}`;
  const t = await getTranslations('home');
  const tCommon = await getTranslations('common');
  const [newArrivals, featuredResult, categories] = await Promise.all([
    searchProducts({ limit: 4, sort: [{ field: 'createdAt', order: 'desc' }], currency, country, locale }),
    searchProducts({ limit: 8, currency, country, locale }),
    getCategoryTree(),
  ]);

  const topCategories = categories.filter((c) => !c.parent).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="bg-charcoal relative flex min-h-[60vh] items-center overflow-hidden text-white">
        <div className="from-charcoal via-charcoal/90 to-charcoal/60 absolute inset-0 z-10 bg-gradient-to-r" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Canela_Sofa-1.1.jpeg')`,
          }}
        />
        <div className="relative z-20 mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="max-w-xl">
            <p className="text-terra mb-4 text-sm font-medium tracking-widest uppercase">
              {t('curatedForModernLiving')}
            </p>
            <h1 className="mb-6 text-4xl leading-tight font-light md:text-6xl">
              {t('designYourPerfectSpace')}
              <br />
              <span className="font-semibold">{t('perfectSpace')}</span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-white/70">{t('heroDescription')}</p>
            <div className="flex gap-4">
              <Link
                href={lp('/category/furniture')}
                className="text-charcoal hover:bg-cream rounded-sm bg-white px-6 py-3 text-sm font-medium transition-colors"
              >
                {t('shopFurniture')}
              </Link>
              <Link
                href={lp('/category/home-decor')}
                className="rounded-sm border border-white/40 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                {t('homeDecor')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category cards */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <h2 className="text-charcoal mb-8 text-2xl font-semibold">{t('shopByCategory')}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {topCategories.map((cat) => {
            const name = getLocalizedString(cat.name, 'en-US');
            const slug = cat.slug['en-US'] || Object.values(cat.slug)[0];
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
                <div className="from-charcoal/60 absolute inset-0 bg-gradient-to-t to-transparent" />
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
