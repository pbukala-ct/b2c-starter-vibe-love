/**
 * Fetches and caches product IDs from the configured store's product selection.
 * Used to filter the Product Search API results to only show store-catalogue products,
 * since the CT in-store product search endpoint is not available for this project.
 */
import { apiRoot } from './client';
import { CTP_STORE_KEY } from './client';

const SELECTION_KEY = 'home-accessories-selection';

let cachedIds: string[] | null = null;
let cacheTs = 0;
const TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Returns product IDs in the store's product selection, cached for 5 minutes.
 * Returns null if no store key is configured or the selection cannot be fetched.
 */
export async function getSelectionProductIds(): Promise<string[] | null> {
  if (!CTP_STORE_KEY) return null;

  if (cachedIds !== null && Date.now() - cacheTs < TTL) {
    return cachedIds;
  }

  try {
    const { body } = await apiRoot
      .productSelections()
      .withKey({ key: SELECTION_KEY })
      .products()
      .get({ queryArgs: { limit: 100 } })
      .execute();

    cachedIds = body.results.map((r) => r.product.id);
    cacheTs = Date.now();
    return cachedIds;
  } catch {
    // If the selection can't be fetched, don't filter — show all products
    return null;
  }
}
