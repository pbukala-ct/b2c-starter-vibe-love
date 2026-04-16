import { DEFAULT_LOCALE } from './utils';
import type { LayoutSection } from './types';
import { searchProducts } from '@/lib/ct/search';
import { CTP_STORE_KEY } from '@/lib/ct/client';

/** Recursively resolve locale maps ({ 'en-US': '...', 'de-DE': '...' }) to plain strings. */
function localizeConfig<T>(value: T, locale: string): T {
  if (Array.isArray(value)) {
    return value.map((item) => localizeConfig(item, locale)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value as object);
    const isLocaleMap = keys.length > 0 && keys.every((k) => /^[a-z]{2}-[A-Z]{2}$/.test(k));
    if (isLocaleMap) {
      const map = value as Record<string, string>;
      return (map[locale] ?? map[DEFAULT_LOCALE.locale] ?? Object.values(map)[0]) as unknown as T;
    }
    return Object.fromEntries(
      Object.entries(value as object).map(([k, v]) => [k, localizeConfig(v, locale)])
    ) as unknown as T;
  }
  return value;
}

/**
 * Hardcoded category tiles for the home-accessories-store homepage.
 * Derived from analysis of the 20 products in home-accessories-selection —
 * all are in the 'home-accents' CT category, spanning home decor, kitchen,
 * bath, and bedroom product types.
 */
const HOME_ACCESSORIES_CATEGORIES = [
  {
    id: 'cat-decor',
    type: 'Category' as const,
    name: 'Home Decor',
    slug: 'home-accents',
    images: ['https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Braided_Rug-1.1.jpeg'],
    children: [],
  },
  {
    id: 'cat-kitchen',
    type: 'Category' as const,
    name: 'Kitchen & Dining',
    slug: 'home-accents',
    images: ['https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Ella_Square_Plate-1.1.jpeg'],
    children: [],
  },
  {
    id: 'cat-bath',
    type: 'Category' as const,
    name: 'Bath & Bedroom',
    slug: 'home-accents',
    images: ['https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Aria_Rug-1.1.jpeg'],
    children: [],
  },
  {
    id: 'cat-new',
    type: 'Category' as const,
    name: 'New Arrivals',
    slug: 'home-accents',
    images: ['https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Art_Deco_Coffee_Table-1.1.jpeg'],
    children: [],
  },
];

export async function getPageSections(
  _pageId: string,
  locale: string,
  currency: string,
  country: string
): Promise<LayoutSection[]> {
  const newArrivals = await searchProducts({
    limit: 4,
    sort: [{ field: 'createdAt', order: 'desc' }],
    currency,
    country,
    locale,
  });

  const featuredProducts = await searchProducts({ limit: 8, currency, country, locale });

  // Use store-specific hardcoded category tiles when a store is configured
  const categoryItems = CTP_STORE_KEY ? HOME_ACCESSORIES_CATEGORIES : [];

  const sections: LayoutSection[] = [
    {
      sectionId: 'main',
      layoutElements: [
        {
          configuration: { desktop: true, mobile: true, tablet: true, size: 12 },
          items: [
            {
              layoutItemType: 'content/hero',
              configuration: {
                mobile: true,
                tablet: true,
                desktop: true,
                backgroundImage: {
                  src: 'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Aria_Rug-1.1.jpeg',
                },
                subTitle: {
                  'en-US': 'The Art of Home',
                  'en-GB': 'The Art of Home',
                  'de-DE': 'Die Kunst des Wohnens',
                },
                title: {
                  'en-US': 'Love Every<br/><span class="font-semibold">Corner of Home</span>',
                  'en-GB': 'Love Every<br/><span class="font-semibold">Corner of Home</span>',
                  'de-DE':
                    'Liebe jeden<br/><span class="font-semibold">Winkel deines Zuhauses</span>',
                },
                text: {
                  'en-US':
                    'Curated home accessories and décor, crafted for the spaces you love most.',
                  'en-GB':
                    'Curated home accessories and décor, crafted for the spaces you love most.',
                  'de-DE':
                    'Kuratierte Wohnaccessoires und Dekoration, gestaltet für die Räume, die Sie am meisten lieben.',
                },
                buttons: [
                  {
                    href: '/search',
                    variant: 'primary',
                    label: {
                      'en-US': 'Shop Collections',
                      'en-GB': 'Shop Collections',
                      'de-DE': 'Kollektionen entdecken',
                    },
                  },
                  {
                    href: '/search?sort=createdAt',
                    variant: 'outline',
                    label: {
                      'en-US': 'New Arrivals',
                      'en-GB': 'New Arrivals',
                      'de-DE': 'Neuheiten',
                    },
                  },
                ],
              },
            },
            ...(categoryItems.length > 0
              ? [
                  {
                    layoutItemType: 'content/section',
                    configuration: {
                      mobile: true,
                      tablet: true,
                      desktop: true,
                      title: {
                        'en-US': 'Shop by Category',
                        'en-GB': 'Shop by Category',
                        'de-DE': 'Nach Kategorie einkaufen',
                      },
                      items: categoryItems,
                    },
                  },
                ]
              : []),
            {
              layoutItemType: 'content/section',
              configuration: {
                mobile: true,
                tablet: true,
                desktop: true,
                title: {
                  'en-US': 'New Arrivals',
                  'en-GB': 'New Arrivals',
                  'de-DE': 'Neuheiten',
                },
                cta: {
                  label: {
                    'en-US': 'View all →',
                    'en-GB': 'View all →',
                    'de-DE': 'Alle anzeigen →',
                  },
                  target: '/search?sort=createdAt',
                },
                items: newArrivals.products,
              },
            },
            {
              layoutItemType: 'content/section',
              configuration: {
                mobile: true,
                tablet: true,
                desktop: true,
                title: {
                  'en-US': 'Featured Products',
                  'en-GB': 'Featured Products',
                  'de-DE': 'Ausgewählte Produkte',
                },
                cta: {
                  label: {
                    'en-US': 'View all →',
                    'en-GB': 'View all →',
                    'de-DE': 'Alle anzeigen →',
                  },
                  target: '/search',
                },
                items: featuredProducts.products,
              },
            },
          ],
        },
      ],
    },
  ];
  return localizeConfig(sections, locale);
}
