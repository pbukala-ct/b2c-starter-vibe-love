import type { Category as CtCategory } from '@commercetools/platform-sdk';
import type { Category } from '@/lib/types';
import { getLocalizedString } from '@/lib/utils';

export function mapCategory(c: CtCategory, locale: string = 'en-US'): Category {
  return {
    type: 'Category',
    id: c.id,
    images: [],
    name: getLocalizedString(c.name as Record<string, string>, locale),
    slug: getLocalizedString(c.slug as Record<string, string>, locale),
    parent: c.parent,
    orderHint: c.orderHint,
    metaTitle:
      getLocalizedString(c.metaTitle as Record<string, string> | undefined, locale) || undefined,
    metaDescription:
      getLocalizedString(c.metaDescription as Record<string, string> | undefined, locale) ||
      undefined,
    metaKeywords:
      getLocalizedString(c.metaKeywords as Record<string, string> | undefined, locale) || undefined,
  };
}
