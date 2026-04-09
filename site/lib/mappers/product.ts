import type {
  ProductProjection,
  ProductVariant as CtProductVariant,
  Price as CtPrice,
} from '@commercetools/platform-sdk';
import type { Product, Price, Variant } from '@/lib/types';
import { getLocalizedString } from '@/lib/utils';

function mapPrice(p: CtPrice, locale: string): Price {
  return {
    centAmount: p.value.centAmount,
    currencyCode: p.value.currencyCode,
    discounted: p.discounted
      ? {
          centAmount: p.discounted.value.centAmount,
          currencyCode: p.discounted.value.currencyCode,
          discountName:
            getLocalizedString(
              p.discounted.discount?.obj?.name as Record<string, string> | undefined,
              locale
            ) || undefined,
        }
      : undefined,
    recurrencePolicy: (p as unknown as Record<string, unknown>).recurrencePolicy as
      | { id: string }
      | undefined,
    country: p.country,
  };
}

function mapVariant(v: CtProductVariant, matchingIds: Set<number> | null, locale: string): Variant {
  return {
    id: v.id,
    sku: v.sku ?? '',
    images: (v.images ?? []).map((img) => img.url),
    price: v.price ? mapPrice(v.price, locale) : undefined,
    prices: (v.prices ?? []).map((p) => mapPrice(p, locale)),
    attributes: (v.attributes ?? []).map((a) => ({ name: a.name, value: a.value })),
    availability: v.availability ? { isOnStock: v.availability.isOnStock } : undefined,
    isMatchingVariant: matchingIds ? matchingIds.has(v.id) : undefined,
  };
}

export function mapProduct(
  p: ProductProjection,
  matchingIds: Set<number> | null = null,
  locale: string = 'en-US'
): Product {
  return {
    id: p.id,
    key: p.key,
    name: getLocalizedString(p.name as Record<string, string>, locale),
    slug: getLocalizedString(p.slug as Record<string, string>, locale),
    description:
      getLocalizedString(p.description as Record<string, string> | undefined, locale) || undefined,
    categories: (p.categories ?? []).map((c) => ({ id: c.id })),
    variants: [
      mapVariant(p.masterVariant, matchingIds, locale),
      ...(p.variants ?? []).map((v) => mapVariant(v, matchingIds, locale)),
    ],
    metaTitle:
      getLocalizedString(p.metaTitle as Record<string, string> | undefined, locale) || undefined,
    metaDescription:
      getLocalizedString(p.metaDescription as Record<string, string> | undefined, locale) ||
      undefined,
    metaKeywords:
      getLocalizedString(p.metaKeywords as Record<string, string> | undefined, locale) || undefined,
  };
}
