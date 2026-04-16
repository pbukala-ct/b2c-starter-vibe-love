'use client';

import { Link } from '@/i18n/routing';
import type { Category } from '@/lib/types';

interface MegaMenuProps {
  categories: Category[];
}

/**
 * Flat nav items for the home-accessories-store.
 * Derived from analysis of the 20 products in home-accessories-selection —
 * all are in the 'home-accents' CT category. The flat menu reflects product
 * type groupings without requiring CT subcategories.
 */
const STORE_NAV_ITEMS = [
  { label: 'Shop All', href: '/search' },
  { label: 'Home Decor', href: '/category/home-accents' },
  { label: 'Kitchen & Dining', href: '/search' },
  { label: 'Bath & Bedroom', href: '/search' },
  { label: 'New Arrivals', href: '/search?sort=createdAt' },
] as const;

export default function MegaMenu({ categories }: MegaMenuProps) {
  const storeKey = process.env.NEXT_PUBLIC_CTP_STORE_KEY;

  // When a store is configured, render a flat brand-specific nav (no submenus)
  if (storeKey) {
    return (
      <nav className="hidden items-center gap-0 lg:flex">
        {STORE_NAV_ITEMS.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className="text-charcoal hover:text-terra hover:border-terra border-b-2 border-transparent px-4 py-5 text-sm font-medium transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  // Default: dynamic category tree nav
  const topLevel = categories.filter((c) => !c.parent);

  return (
    <nav className="hidden items-center gap-0 lg:flex">
      {topLevel.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className="text-charcoal hover:text-terra hover:border-terra border-b-2 border-transparent px-4 py-5 text-sm font-medium transition-colors"
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  );
}
