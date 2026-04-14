import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getShopTheLookBundle, resolveBundleProducts } from '@/lib/ct/shop-the-look';
import { getLocale } from '@/lib/session';
import ShopTheLookDetail from '@/components/ShopTheLookDetail';

interface ShopTheLookDetailPageProps {
  params: Promise<{ key: string }>;
}

export default async function ShopTheLookDetailPage({ params }: ShopTheLookDetailPageProps) {
  const { key } = await params;

  const [t, bundle, { locale, currency, country }] = await Promise.all([
    getTranslations('shopTheLook'),
    getShopTheLookBundle(key),
    getLocale(),
  ]);

  if (!bundle || bundle.value.status !== 'active') {
    notFound();
  }

  const products = await resolveBundleProducts(bundle.value, locale, currency, country);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/shop-the-look" className="text-charcoal-light hover:text-terra transition-colors">
          {t('title')}
        </Link>
        <span className="text-charcoal-light mx-2">›</span>
        <span className="text-charcoal font-medium">{bundle.value.name}</span>
      </nav>

      {/* Bundle header */}
      <div className="mb-10">
        <h1 className="text-charcoal mb-2 text-3xl font-semibold tracking-tight">
          {bundle.value.name}
        </h1>
        {bundle.value.description && (
          <p className="text-charcoal-light max-w-2xl text-base">{bundle.value.description}</p>
        )}
        <p className="text-charcoal-light mt-2 text-sm">
          {t('products', { count: products.length })}
        </p>
      </div>

      {/* Products + actions */}
      <ShopTheLookDetail products={products} />
    </div>
  );
}
