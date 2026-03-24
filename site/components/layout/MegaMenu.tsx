'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Category } from '@/lib/ct/categories';
import { useLocale } from '@/context/LocaleContext';
import { getLocalizedString } from '@/lib/utils';

interface MegaMenuProps {
  categories: Category[];
}

export default function MegaMenu({ categories }: MegaMenuProps) {
  const { locale, localePath } = useLocale();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const topLevel = categories.filter((c) => !c.parent);

  return (
    <nav className="hidden lg:flex items-center gap-0">
      {topLevel.map((cat) => {
        const name = getLocalizedString(cat.name, locale);
        const slug = cat.slug['en-US'] || Object.values(cat.slug)[0];
        const hasChildren = (cat.children?.length || 0) > 0;

        return (
          <div
            key={cat.id}
            className="relative group"
            onMouseEnter={() => setActiveCategory(cat.id)}
            onMouseLeave={() => setActiveCategory(null)}
          >
            <Link
              href={localePath(`/category/${slug}`)}
              className="flex items-center gap-1 px-4 py-5 text-sm font-medium text-charcoal hover:text-terra transition-colors border-b-2 border-transparent hover:border-terra"
            >
              {name}
              {hasChildren && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </Link>

            {hasChildren && activeCategory === cat.id && (
              <div className="absolute left-0 top-full bg-white border border-border shadow-xl z-50 mega-menu min-w-64">
                <div className="p-6 grid grid-cols-1 gap-1">
                  <Link
                    href={localePath(`/category/${slug}`)}
                    className="font-semibold text-charcoal text-sm py-1 hover:text-terra transition-colors"
                  >
                    All {name}
                  </Link>
                  <div className="border-t border-border my-2" />
                  {cat.children?.map((child) => {
                    const childName = getLocalizedString(child.name, locale);
                    const childSlug = child.slug['en-US'] || Object.values(child.slug)[0];
                    const hasGrandchildren = (child.children?.length || 0) > 0;

                    return (
                      <div key={child.id}>
                        <Link
                          href={localePath(`/category/${childSlug}`)}
                          className="block py-1.5 text-sm text-charcoal-light hover:text-terra transition-colors font-medium"
                        >
                          {childName}
                        </Link>
                        {hasGrandchildren && (
                          <div className="ml-3 mt-0.5">
                            {child.children?.map((gc) => {
                              const gcName = getLocalizedString(gc.name, locale);
                              const gcSlug = gc.slug['en-US'] || Object.values(gc.slug)[0];
                              return (
                                <Link
                                  key={gc.id}
                                  href={localePath(`/category/${gcSlug}`)}
                                  className="block py-1 text-xs text-charcoal-light/80 hover:text-terra transition-colors"
                                >
                                  {gcName}
                                </Link>
                              );
                            })}
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
