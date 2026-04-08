'use client';

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { Category } from '@/lib/types';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const tCommon = useTranslations('common');

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group bg-cream-dark relative aspect-square overflow-hidden rounded-sm"
    >
      {category.images && category.images.length > 0 && (
        <Image
          src={category.images[0]}
          alt={category.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      )}
      <div className="from-charcoal/60 absolute inset-0 bg-linear-to-t to-transparent" />
      <div className="absolute right-0 bottom-0 left-0 p-4">
        <h3 className="text-sm font-semibold text-white">{category.name}</h3>
        <p className="mt-0.5 text-xs text-white/70 transition-colors group-hover:text-white">
          {tCommon('explore')}
        </p>
      </div>
    </Link>
  );
}
