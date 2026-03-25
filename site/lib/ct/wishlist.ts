import { apiRoot } from './client';

const expandVariants = ['lineItems[*].variant'];

export async function getOrCreateWishlist(customerId: string) {
  const { body: existing } = await apiRoot
    .shoppingLists()
    .get({
      queryArgs: {
        where: `customer(id = "${customerId}")`,
        limit: 1,
        expand: expandVariants,
      },
    })
    .execute();

  if (existing.results?.length > 0) {
    return existing.results[0];
  }

  const { body } = await apiRoot
    .shoppingLists()
    .post({
      body: {
        name: { en: 'Wishlist' },
        customer: { typeId: 'customer', id: customerId },
      },
      queryArgs: { expand: expandVariants },
    })
    .execute();
  return body;
}

export async function addWishlistItem(
  wishlistId: string,
  version: number,
  sku: string,
  quantity: number
) {
  const { body } = await apiRoot
    .shoppingLists()
    .withId({ ID: wishlistId })
    .post({
      body: { version, actions: [{ action: 'addLineItem', sku, quantity }] },
      queryArgs: { expand: expandVariants },
    })
    .execute();
  return body;
}

export async function removeWishlistItem(wishlistId: string, version: number, lineItemId: string) {
  const { body } = await apiRoot
    .shoppingLists()
    .withId({ ID: wishlistId })
    .post({
      body: { version, actions: [{ action: 'removeLineItem', lineItemId }] },
      queryArgs: { expand: expandVariants },
    })
    .execute();
  return body;
}

export async function updateWishlistItemQty(
  wishlistId: string,
  version: number,
  lineItemId: string,
  quantity: number
) {
  const { body } = await apiRoot
    .shoppingLists()
    .withId({ ID: wishlistId })
    .post({
      body: { version, actions: [{ action: 'changeLineItemQuantity', lineItemId, quantity }] },
      queryArgs: { expand: expandVariants },
    })
    .execute();
  return body;
}
