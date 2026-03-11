import ProductCard from './ProductCard';
import { ProductProjection } from '@/lib/ct/search';

interface ProductGridProps {
  products: ProductProjection[];
  title?: string;
  total?: number;
}

export default function ProductGrid({ products, title, total }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-charcoal-light">
        <p className="text-lg mb-2">No products found</p>
        <p className="text-sm">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div>
      {(title || total !== undefined) && (
        <div className="flex items-center justify-between mb-6">
          {title && <h1 className="text-2xl font-semibold text-charcoal">{title}</h1>}
          {total !== undefined && (
            <p className="text-sm text-charcoal-light">{total} products</p>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-7">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
