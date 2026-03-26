import { getTranslations } from 'next-intl/server';
import ProductCard from './ProductCard';
import { ProductProjection } from '@commercetools/platform-sdk';

interface ProductGridProps {
  products: ProductProjection[];
  title?: string;
  total?: number;
}

export default async function ProductGrid({ products, title, total }: ProductGridProps) {
  const t = await getTranslations('search');

  if (products.length === 0) {
    return (
      <div className="text-charcoal-light py-16 text-center">
        <p className="mb-2 text-lg">{t('noProducts')}</p>
        <p className="text-sm">{t('noProductsHint')}</p>
      </div>
    );
  }

  return (
    <div>
      {(title || total !== undefined) && (
        <div className="mb-6 flex items-center justify-between">
          {title && <h1 className="text-charcoal text-2xl font-semibold">{title}</h1>}
          {total !== undefined && (
            <p className="text-charcoal-light text-sm">{t('productCount', { count: total })}</p>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:gap-7 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
