import { searchProducts } from '@/lib/ct/search';
import { getCategoryTree } from '@/lib/ct/categories';
import ProductCard from '@/components/product/ProductCard';
import HeroBanner from '@/components/home/HeroBanner';
import CategoryCard from '@/components/category/CategoryCard';
import MessageBanner from '@/components/home/MessageBanner';
import { getLocalizedString } from '@/lib/utils';
import { getLocale } from '@/lib/session';
import Section from '@/components/home/Section';

export default async function HomePage() {
  const { country, currency, locale } = await getLocale();
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

      <Section
        title={'home.newArrivals'}
        cta={{ label: 'common.viewAll', target: '/search?sort=createdAt' }}
      >
        {newArrivals.products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </Section>

      <MessageBanner
        title="home.subscribeAndSaveTitle"
        description="home.subscribeAndSaveDescription"
        cta={{ label: 'home.shopSubscribeAndSave', target: '/search?subscriptionEligible=true' }}
      />

      <Section title={'home.featuredProducts'} cta={{ label: 'common.viewAll', target: '/search' }}>
        {featuredResult.products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </Section>
    </div>
  );
}
