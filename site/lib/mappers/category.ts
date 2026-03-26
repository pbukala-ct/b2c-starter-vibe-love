import type { Category as CtCategory } from '@commercetools/platform-sdk';
import type { Category } from '@/lib/types';

export function mapCategory(c: CtCategory): Category {
  return {
    id: c.id,
    name: c.name as Record<string, string>,
    slug: c.slug as Record<string, string>,
    parent: c.parent,
    orderHint: c.orderHint,
    metaTitle: c.metaTitle as Record<string, string> | undefined,
    metaDescription: c.metaDescription as Record<string, string> | undefined,
    metaKeywords: c.metaKeywords as Record<string, string> | undefined,
  };
}
