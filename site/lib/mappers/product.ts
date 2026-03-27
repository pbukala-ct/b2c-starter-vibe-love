import type {
  ProductProjection,
  ProductVariant as CtProductVariant,
  Price as CtPrice,
} from '@commercetools/platform-sdk';
import type { Product, Price, Variant } from '@/lib/types';

function mapPrice(p: CtPrice): Price {
  return {
    centAmount: p.value.centAmount,
    currencyCode: p.value.currencyCode,
    discounted: p.discounted
      ? {
          centAmount: p.discounted.value.centAmount,
          currencyCode: p.discounted.value.currencyCode,
          discountName: p.discounted.discount?.obj?.name as Record<string, string> | undefined,
        }
      : undefined,
    recurrencePolicy: (p as Record<string, unknown>).recurrencePolicy as { id: string } | undefined,
    country: p.country,
  };
}

function mapVariant(v: CtProductVariant, matchingIds: Set<number> | null): Variant {
  return {
    id: v.id,
    sku: v.sku ?? '',
    images: (v.images ?? []).map((img) => img.url),
    price: v.price ? mapPrice(v.price) : undefined,
    prices: (v.prices ?? []).map(mapPrice),
    attributes: (v.attributes ?? []).map((a) => ({ name: a.name, value: a.value })),
    availability: v.availability ? { isOnStock: v.availability.isOnStock } : undefined,
    isMatchingVariant: matchingIds ? matchingIds.has(v.id) : undefined,
  };
}

export function mapProduct(p: ProductProjection, matchingIds: Set<number> | null = null): Product {
  return {
    id: p.id,
    key: p.key,
    name: p.name as Record<string, string>,
    slug: p.slug as Record<string, string>,
    description: p.description as Record<string, string> | undefined,
    categories: (p.categories ?? []).map((c) => ({ id: c.id })),
    variants: [
      mapVariant(p.masterVariant, matchingIds),
      ...(p.variants ?? []).map((v) => mapVariant(v, matchingIds)),
    ],
    metaTitle: p.metaTitle as Record<string, string> | undefined,
    metaDescription: p.metaDescription as Record<string, string> | undefined,
    metaKeywords: p.metaKeywords as Record<string, string> | undefined,
  };
}
