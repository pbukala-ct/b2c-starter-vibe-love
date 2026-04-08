import { DEFAULT_LOCALE } from './utils';
import type { LayoutSection } from './types';
import { getCategoryTree } from '@/lib/ct/categories';
import { searchProducts } from '@/lib/ct/search';

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

// Stub — replace with an API call when the layout service is available
export async function getPageSections(
  _pageId: string,
  locale: string,
  currency: string,
  country: string
): Promise<LayoutSection[]> {
  const catImages: Record<string, string> = {
    furniture:
      'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Art_Deco_Coffee_Table-1.1.jpeg',
    'home-decor':
      'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Braided_Rug-1.1.jpeg',
    kitchen:
      'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Ella_Square_Plate-1.1.jpeg',
    'new-arrivals':
      'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Aria_Rug-1.1.jpeg',
    'ganz-neu':
      'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Aria_Rug-1.1.jpeg',
  };

  const categories = await getCategoryTree(locale);
  const topCategories = categories
    .filter((c) => !c.parent)
    .slice(0, 4)
    .map((cat) => ({
      ...cat,
      images: cat.images.length > 0 ? cat.images : [catImages[cat.slug] ?? ''],
    }));

  const newArrivals = await searchProducts({
    limit: 4,
    sort: [{ field: 'createdAt', order: 'desc' }],
    currency,
    country,
    locale,
  });

  const featuredProducts = await searchProducts({ limit: 8, currency, country, locale });

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
                  src: 'https://storage.googleapis.com/merchant-center-europe/sample-data/b2c-lifestyle/Canela_Three_Seater_Sofa-1.1.jpeg',
                },
                subTitle: {
                  'en-US': 'Curated for Modern Living',
                  'en-GB': 'Curated for Modern Living',
                  'de-DE': 'Kuratiert für modernes Wohnen',
                },
                title: {
                  'en-US': 'Design Your<br/><span class="font-semibold">Perfect Space</span>',
                  'en-GB': 'Design Your<br/><span class="font-semibold">Perfect Space</span>',
                  'de-DE':
                    'Gestalten Sie Ihren<br/><span class="font-semibold">perfekten Raum</span>',
                },
                text: {
                  'en-US':
                    'Premium furniture and home goods, thoughtfully selected for the modern home.',
                  'en-GB':
                    'Premium furniture and home goods, thoughtfully selected for the modern home.',
                  'de-DE':
                    'Premium-Möbel und Wohnaccessoires, sorgfältig für das moderne Zuhause ausgewählt.',
                },
                buttons: [
                  {
                    href: '/category/furniture',
                    variant: 'primary',
                    label: {
                      'en-US': 'Shop Furniture',
                      'en-GB': 'Shop Furniture',
                      'de-DE': 'Möbel kaufen',
                    },
                  },
                  {
                    href: '/category/home-decor',
                    variant: 'outline',
                    label: {
                      'en-US': 'Home Decor',
                      'en-GB': 'Home Décor',
                      'de-DE': 'Wohndekoration',
                    },
                  },
                ],
              },
            },
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
                items: topCategories,
              },
            },
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
              layoutItemType: 'content/message',
              configuration: {
                mobile: true,
                tablet: true,
                desktop: true,
                title: {
                  'en-US': 'Subscribe & Save',
                  'en-GB': 'Subscribe & Save',
                  'de-DE': 'Abonnieren & Sparen',
                },
                description: {
                  'en-US':
                    'Set up recurring deliveries on select products and save up to 20%. Pause or cancel anytime.',
                  'en-GB':
                    'Set up recurring deliveries on select products and save up to 20%. Pause or cancel anytime.',
                  'de-DE':
                    'Richten Sie wiederkehrende Lieferungen für ausgewählte Produkte ein und sparen Sie bis zu 20%. Jederzeit pausierbar oder kündbar.',
                },
                cta: {
                  label: {
                    'en-US': 'Shop Subscribe & Save',
                    'en-GB': 'Shop Subscribe & Save',
                    'de-DE': 'Abonnieren & Sparen',
                  },
                  target: '/search?sort=createdAt',
                },
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
