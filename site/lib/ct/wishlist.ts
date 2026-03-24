import { ct } from './request';

const expandVariants = 'lineItems[*].variant';

export async function getOrCreateWishlist(customerId: string) {
  const existing = await ct('GET', `/shopping-lists?where=${encodeURIComponent(`customer(id = "${customerId}")`)}&&limit=1&expand=${expandVariants}`);

  if (existing.results?.length > 0) {
    return existing.results[0];
  }
  return ct('POST', `/shopping-lists?expand=${expandVariants}`, {
    name: { en: 'Wishlist' },
    customer: { typeId: 'customer', id: customerId },
  });
}

export async function addWishlistItem(wishlistId: string, version: number, sku: string, quantity: number) {
  return ct('POST', `/shopping-lists/${wishlistId}?expand=${expandVariants}`, {
    version,
    actions: [{ action: 'addLineItem', sku, quantity }],
  });
}

export async function removeWishlistItem(wishlistId: string, version: number, lineItemId: string) {
  return ct('POST', `/shopping-lists/${wishlistId}?expand=${expandVariants}`, {
    version,
    actions: [{ action: 'removeLineItem', lineItemId }],
  });
}

export async function updateWishlistItemQty(wishlistId: string, version: number, lineItemId: string, quantity: number) {
  return ct('POST', `/shopping-lists/${wishlistId}?expand=${expandVariants}`, {
    version,
    actions: [{ action: 'changeLineItemQuantity', lineItemId, quantity }],
  });
}
