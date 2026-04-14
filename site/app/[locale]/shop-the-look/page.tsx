import { getTranslations } from 'next-intl/server';
import { getShopTheLookBundles } from '@/lib/ct/shop-the-look';
import ShopTheLookCard from '@/components/ShopTheLookCard';

export default async function ShopTheLookPage() {
  const [t, bundles] = await Promise.all([
    getTranslations('shopTheLook'),
    getShopTheLookBundles(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      {/* Page header */}
      <div className="mb-10 text-center">
        <h1 className="text-charcoal mb-2 text-3xl font-semibold tracking-tight">
          {t('title')}
        </h1>
        <p className="text-charcoal-light text-base">{t('subtitle')}</p>
      </div>

      {bundles.length === 0 ? (
        <div className="border-border rounded-sm border bg-white py-20 text-center">
          <p className="text-charcoal-light text-sm">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bundles.map((bundle) => (
            <ShopTheLookCard key={bundle.key} bundle={bundle} />
          ))}
        </div>
      )}
    </div>
  );
}
