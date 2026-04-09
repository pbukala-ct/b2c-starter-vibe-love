import { FC, PropsWithChildren } from 'react';
import { Link } from '@/i18n/routing';
import type { CTA } from './types';
import { type Category, ItemProps, Product } from '@/lib/types';
import CategoryCard from '@/components/category/CategoryCard';
import ProductCard from '@/components/product/ProductCard';

export type Props = PropsWithChildren<{
  title: string;
  cta?: CTA;
  items: Array<Category | Product>;
}>;

const Section: FC<ItemProps<Props>> = async ({ data }) => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-charcoal text-2xl font-semibold">{data.title}</h2>
        {data.cta && (
          <Link href={data.cta.target} className="text-terra text-sm hover:underline">
            {data.cta.label}
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {data.items.map((item) => {
          switch (item.type) {
            case 'Category': {
              return <CategoryCard key={item.id} category={item} />;
            }
            default: {
              return <ProductCard key={item.id} product={item} />;
            }
          }
        })}
      </div>
    </section>
  );
};

export default Section;
