import Link from 'next/link';
import Image from 'next/image';
import { searchProducts } from '@/lib/ct/search';
import { getCategoryTree } from '@/lib/ct/categories';
import ProductCard from '@/components/product/ProductCard';
import { getLocalizedString, toUrlLocale } from '@/lib/utils';
import { getLocale } from '@/lib/session';

export default async function HomePage() {
  const { country, currency, locale } = await getLocale();
  const lp = (p: string) => `/${toUrlLocale(country)}${p}`;
  const [newArrivals, featuredResult, categories] = await Promise.all([
    searchProducts({ limit: 4, sort: 'createdAt', currency, country, locale }),
    searchProducts({ limit: 8, currency, country, locale }),
    getCategoryTree(),
  ]);

  const topCategories = categories.filter((c) => !c.parent).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-charcoal text-white min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/90 to-charcoal/60 z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Canela_Sofa-1.1.jpeg')`,
          }}
        />
        <div className="relative z-20 max-w-7xl mx-auto px-4 lg:px-8 py-20">
          <div className="max-w-xl">
            <p className="text-terra text-sm font-medium uppercase tracking-widest mb-4">
              Curated for Modern Living
            </p>
            <h1 className="text-4xl md:text-6xl font-light leading-tight mb-6">
              Design Your<br />
              <span className="font-semibold">Perfect Space</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              Premium furniture and home goods, thoughtfully selected for the modern home.
            </p>
            <div className="flex gap-4">
              <Link
                href={lp('/category/furniture')}
                className="bg-white text-charcoal px-6 py-3 text-sm font-medium hover:bg-cream transition-colors rounded-sm"
              >
                Shop Furniture
              </Link>
              <Link
                href={lp('/category/home-decor')}
                className="border border-white/40 text-white px-6 py-3 text-sm font-medium hover:bg-white/10 transition-colors rounded-sm"
              >
                Home Decor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category cards */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <h2 className="text-2xl font-semibold text-charcoal mb-8">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topCategories.map((cat) => {
            const name = getLocalizedString(cat.name, 'en-US');
            const slug = cat.slug['en-US'] || Object.values(cat.slug)[0];
            const catImages: Record<string, string> = {
              furniture: 'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Art_Deco_Coffee_Table-1.1.jpeg',
              'home-decor': 'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Braided_Rug-1.1.jpeg',
              kitchen: 'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Ella_Square_Plate-1.1.jpeg',
              'new-arrivals': 'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Aria_Rug-1.1.jpeg',
            };
            const img = catImages[slug] || '';

            return (
              <Link key={cat.id} href={lp(`/category/${slug}`)} className="group relative rounded-sm overflow-hidden aspect-square bg-cream-dark">
                {img && (
                  <Image
                    src={img}
                    alt={name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-sm">{name}</h3>
                  <p className="text-white/70 text-xs mt-0.5 group-hover:text-white transition-colors">
                    Explore →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-charcoal">New Arrivals</h2>
          <Link href={lp('/search?sort=createdAt')} className="text-sm text-terra hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {newArrivals.results.map((r) => (
            <ProductCard key={r.id} product={r.productProjection} />
          ))}
        </div>
      </section>

      {/* Subscribe & Save Banner */}
      <section className="bg-sage/10 border-y border-sage/20 py-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold text-charcoal mb-3">Subscribe & Save</h2>
          <p className="text-charcoal-light mb-6 max-w-md mx-auto">
            Set up recurring deliveries on select products and save up to 20%. Pause or cancel anytime.
          </p>
          <Link
            href={lp('/search?subscriptionEligible=true')}
            className="bg-sage text-white px-6 py-3 text-sm font-medium hover:bg-sage/90 transition-colors rounded-sm inline-block"
          >
            Shop Subscribe & Save
          </Link>
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-charcoal">Featured Products</h2>
          <Link href={lp('/search')} className="text-sm text-terra hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {featuredResult.results.map((r) => (
            <ProductCard key={r.id} product={r.productProjection} />
          ))}
        </div>
      </section>
    </div>
  );
}
