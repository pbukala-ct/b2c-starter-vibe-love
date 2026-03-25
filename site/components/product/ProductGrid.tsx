import ProductCard from './ProductCard';
import type { ProductProjection } from '@/lib/types';

interface ProductGridProps {
  products: ProductProjection[];
  title?: string;
  total?: number;
}

export default function ProductGrid({ products, title, total }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-charcoal-light py-16 text-center">
        <p className="mb-2 text-lg">No products found</p>
        <p className="text-sm">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div>
      {(title || total !== undefined) && (
        <div className="mb-6 flex items-center justify-between">
          {title && <h1 className="text-charcoal text-2xl font-semibold">{title}</h1>}
          {total !== undefined && <p className="text-charcoal-light text-sm">{total} products</p>}
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
