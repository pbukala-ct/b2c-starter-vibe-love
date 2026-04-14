import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import type { ShopTheLookCustomObject } from '@/lib/types';

interface ShopTheLookCardProps {
  bundle: ShopTheLookCustomObject;
}

export default function ShopTheLookCard({ bundle }: ShopTheLookCardProps) {
  const t = useTranslations('shopTheLook');
  const { name, description, products } = bundle.value;

  return (
    <Link
      href={`/shop-the-look/${bundle.key}`}
      className="group border-border flex flex-col overflow-hidden rounded-sm border bg-white transition-shadow hover:shadow-md"
    >
      {/* Decorative header strip */}
      <div className="bg-cream flex h-44 items-center justify-center">
        <div className="flex -space-x-2">
          {Array.from({ length: Math.min(products.length, 3) }).map((_, i) => (
            <div
              key={i}
              className="border-cream flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white text-2xl shadow-sm"
              style={{ zIndex: 3 - i }}
            >
              {['🛋️', '🪑', '🏮'][i]}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-charcoal group-hover:text-terra mb-1 text-base font-semibold transition-colors">
          {name}
        </h2>
        {description && (
          <p className="text-charcoal-light mb-3 line-clamp-2 text-sm">{description}</p>
        )}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-charcoal-light text-xs">
            {t('products', { count: products.length })}
          </span>
          <span className="text-terra text-xs font-medium group-hover:underline">
            {t('navLink')} →
          </span>
        </div>
      </div>
    </Link>
  );
}
