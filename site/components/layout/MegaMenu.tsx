'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import type { Category } from '@/lib/types';

interface MegaMenuProps {
  categories: Category[];
}

export default function MegaMenu({ categories }: MegaMenuProps) {
  const t = useTranslations('nav');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const topLevel = categories.filter((c) => !c.parent);

  return (
    <nav className="hidden items-center gap-0 lg:flex">
      {topLevel.map((cat) => {
        const hasChildren = (cat.children?.length || 0) > 0;

        return (
          <div
            key={cat.id}
            className="group relative"
            onMouseEnter={() => setActiveCategory(cat.id)}
            onMouseLeave={() => setActiveCategory(null)}
          >
            <Link
              href={`/category/${cat.slug}`}
              className="text-charcoal hover:text-terra hover:border-terra flex items-center gap-1 border-b-2 border-transparent px-4 py-5 text-sm font-medium transition-colors"
            >
              {cat.name}
              {hasChildren && (
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </Link>

            {hasChildren && activeCategory === cat.id && (
              <div className="border-border mega-menu absolute top-full left-0 z-50 min-w-64 border bg-white shadow-xl">
                <div className="grid grid-cols-1 gap-1 p-6">
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-charcoal hover:text-terra py-1 text-sm font-semibold transition-colors"
                  >
                    {t('allCategory', { name: cat.name })}
                  </Link>
                  <div className="border-border my-2 border-t" />
                  {cat.children?.map((child) => {
                    const hasGrandchildren = (child.children?.length || 0) > 0;

                    return (
                      <div key={child.id}>
                        <Link
                          href={`/category/${child.slug}`}
                          className="text-charcoal-light hover:text-terra block py-1.5 text-sm font-medium transition-colors"
                        >
                          {child.name}
                        </Link>
                        {hasGrandchildren && (
                          <div className="mt-0.5 ml-3">
                            {child.children?.map((gc) => (
                              <Link
                                key={gc.id}
                                href={`/category/${gc.slug}`}
                                className="text-charcoal-light/80 hover:text-terra block py-1 text-xs transition-colors"
                              >
                                {gc.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
