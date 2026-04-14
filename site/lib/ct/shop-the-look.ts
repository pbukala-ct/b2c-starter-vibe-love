import { apiRoot } from './client';
import type {
  ShopTheLookCustomObject,
  ShopTheLookBundle,
  ResolvedLookProduct,
} from '@/lib/types';
import { getLocalizedString } from '@/lib/utils';

const CONTAINER = 'shop-the-look';

// ── 1.1  List all active bundles ──────────────────────────────────────────────

export async function getShopTheLookBundles(): Promise<ShopTheLookCustomObject[]> {
  try {
    const { body } = await apiRoot
      .customObjects()
      .get({
        queryArgs: {
          container: CONTAINER,
          where: 'value(status="active")',
          limit: 50,
          sort: ['lastModifiedAt desc'],
        },
      })
      .execute();

    return (body.results as ShopTheLookCustomObject[]).filter(
      (obj) => obj.value?.status === 'active'
    );
  } catch {
    return [];
  }
}

// ── 1.2  Fetch a single bundle by key ────────────────────────────────────────

export async function getShopTheLookBundle(
  key: string
): Promise<ShopTheLookCustomObject | null> {
  try {
    const { body } = await apiRoot
      .customObjects()
      .withContainerAndKey({ container: CONTAINER, key })
      .get()
      .execute();
    return body as ShopTheLookCustomObject;
  } catch (e) {
    const msg = (e as Error).message ?? '';
    if (msg.includes('404') || msg.includes('ResourceNotFound')) return null;
    throw e;
  }
}

// ── 1.3  Resolve full product+variant data for a bundle ──────────────────────

export async function resolveBundleProducts(
  bundle: ShopTheLookBundle,
  locale: string,
  currency: string,
  country: string
): Promise<ResolvedLookProduct[]> {
  const ordered = [...bundle.products].sort((a, b) => a.position - b.position);
  if (ordered.length === 0) return [];

  const ids = [...new Set(ordered.map((p) => p.productId))];
  const whereClause = `id in (${ids.map((id) => `"${id}"`).join(', ')})`;

  let ctProducts: Record<string, {
    id: string;
    name: Record<string, string>;
    slug: Record<string, string>;
    masterVariant: { id: number; sku?: string; images?: { url: string }[]; price?: { value: { centAmount: number; currencyCode: string } } };
    variants: Array<{ id: number; sku?: string; images?: { url: string }[]; price?: { value: { centAmount: number; currencyCode: string } } }>;
  }> = {};

  try {
    const { body } = await apiRoot
      .productProjections()
      .get({
        queryArgs: {
          where: whereClause,
          limit: ids.length,
          priceCurrency: currency,
          priceCountry: country,
        },
      })
      .execute();

    for (const p of body.results) {
      ctProducts[p.id] = p as typeof ctProducts[string];
    }
  } catch {
    // If product fetch fails, return what we can
  }

  const resolved: ResolvedLookProduct[] = [];

  for (const bp of ordered) {
    const product = ctProducts[bp.productId];
    if (!product) {
      // product no longer exists — omit silently
      continue;
    }

    const allVariants = [product.masterVariant, ...product.variants];
    const variant =
      allVariants.find((v) => v.id === bp.variantId) ?? product.masterVariant;

    resolved.push({
      productId: bp.productId,
      variantId: variant.id,
      position: bp.position,
      name: getLocalizedString(product.name, locale),
      slug: getLocalizedString(product.slug, locale),
      image: variant.images?.[0]?.url ?? '',
      priceCentAmount: variant.price?.value?.centAmount,
      priceCurrency: variant.price?.value?.currencyCode,
      sku: variant.sku ?? '',
    });
  }

  return resolved;
}
