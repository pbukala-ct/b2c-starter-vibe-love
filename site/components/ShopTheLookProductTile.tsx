import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { formatMoney } from '@/lib/utils';
import type { ResolvedLookProduct } from '@/lib/types';

interface ShopTheLookProductTileProps {
  product: ResolvedLookProduct;
  position: number;
  addingId: string | null;
  onAddToCart: (product: ResolvedLookProduct) => void;
  disabled?: boolean;
  featured?: boolean;
  addToCartLabel: string;
  addingLabel: string;
  addedIds: Set<string>;
  addedLabel: string;
}

export default function ShopTheLookProductTile({
  product,
  position,
  addingId,
  onAddToCart,
  disabled,
  featured = false,
  addToCartLabel,
  addingLabel,
  addedIds,
  addedLabel,
}: ShopTheLookProductTileProps) {
  const isAdding = addingId === product.productId;
  const isAdded = addedIds.has(product.productId);

  return (
    <div className="border-border group flex h-full flex-col overflow-hidden rounded-sm border bg-white">
      {/* Image */}
      <div
        className={`relative overflow-hidden bg-gray-50 ${
          featured ? 'aspect-[3/4] sm:h-full sm:min-h-80' : 'aspect-square'
        }`}
      >
        <span className="bg-charcoal/70 absolute top-3 left-3 z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white">
          {position + 1}
        </span>
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes={featured
              ? '(max-width: 640px) 100vw, 50vw'
              : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            }
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-16 w-16 rounded-sm bg-gray-200" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col p-4">
        <Link
          href={`/product/${product.slug}`}
          className="text-charcoal hover:text-terra mb-1 line-clamp-2 text-sm font-medium transition-colors"
        >
          {product.name}
        </Link>

        {product.priceCentAmount !== undefined && product.priceCurrency ? (
          <p className="text-charcoal mb-3 text-sm font-semibold">
            {formatMoney(product.priceCentAmount, product.priceCurrency)}
          </p>
        ) : (
          <div className="mb-3" />
        )}

        <button
          onClick={() => onAddToCart(product)}
          disabled={disabled || isAdding}
          className="bg-charcoal hover:bg-charcoal/80 w-full rounded-sm py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
        >
          {isAdding ? addingLabel : isAdded ? `✓ ${addedLabel}` : addToCartLabel}
        </button>
      </div>
    </div>
  );
}
