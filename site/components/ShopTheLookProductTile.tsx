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
  addToCartLabel: string;
  addingLabel: string;
  addedIds: Set<string>;
  addedLabel: string;
  viewDetailsLabel: string;
}

export default function ShopTheLookProductTile({
  product,
  position,
  addingId,
  onAddToCart,
  disabled,
  addToCartLabel,
  addingLabel,
  addedIds,
  addedLabel,
  viewDetailsLabel,
}: ShopTheLookProductTileProps) {
  const isAdding = addingId === product.productId;
  const isAdded = addedIds.has(product.productId);

  return (
    <div className="border-border group flex h-full flex-col overflow-hidden rounded-sm border bg-white">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <span className="bg-charcoal/70 absolute top-3 left-3 z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white">
          {position + 1}
        </span>
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
        <p className="text-charcoal mb-0.5 line-clamp-2 text-sm font-medium">
          {product.name}
        </p>

        <Link
          href={`/product/${product.slug}`}
          className="text-charcoal-light hover:text-terra mb-2 text-xs underline-offset-2 hover:underline transition-colors"
        >
          {viewDetailsLabel}
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
