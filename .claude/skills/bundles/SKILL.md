# Bundles Feature

Implements product bundling: a main product carries a set of referenced products (accessories, components) that are added to the cart together as a unit. Bundle child items are hidden from the cart counter and displayed as sub-rows under their parent.

---

## Architecture Overview

- **CT data model**: Bundle products carry an attribute (e.g. `bundled-products`) that is a `set` of `reference` to `product`. The attribute key must be confirmed with the user.
- **Cart relationship**: When a bundle is added, each child gets a CT line item with a custom field `parentKey` pointing to the parent's `key` (a UUID). This allows cascade update/delete.
- **Custom type**: A CT custom type `line-item-additional-info` stores `parentKey` on child line items.
- **Frontend**: Child items are filtered out of the visible cart; the parent's `CartLineItem` carries a `bundledItems` array for display.

---

## Step 1 — CT Setup Scripts (run once)

### 1a. Custom type for line item metadata

**File**: `tools/create-bundles-custom-type.mjs`

```js
import { apiRoot } from './ct-admin.mjs';

const draft = {
  key: 'line-item-additional-info',
  name: { 'en-US': 'Line Item Additional Info' },
  resourceTypeIds: ['line-item'],
  fieldDefinitions: [
    {
      name: 'parentKey',
      label: { 'en-US': 'Parent Line Item Key' },
      required: false,
      type: { name: 'String' },
      inputHint: 'SingleLine',
    },
  ],
};

try {
  await apiRoot.types().post({ body: draft }).execute();
  console.log('Created custom type: line-item-additional-info');
} catch (e) {
  if (e.statusCode === 409) console.log('Already exists.');
  else throw e;
}
```

Run: `node tools/create-bundles-custom-type.mjs`

### 1b. Bundle attribute on product type (if missing)

First explore with `node tools/explore-catalog.mjs` to find the product type key and confirm the attribute name. If the attribute doesn't exist, create it:

**File**: `tools/create-bundles-attribute.mjs`

```js
import { apiRoot } from './ct-admin.mjs';

// Replace with the actual product type key for products that will have bundles
const PRODUCT_TYPE_KEY = 'your-product-type-key';
// The attribute name to store the set of referenced products
const ATTR_NAME = 'bundled-products';

const productType = await apiRoot.productTypes().withKey({ key: PRODUCT_TYPE_KEY }).get().execute();

await apiRoot.productTypes().withKey({ key: PRODUCT_TYPE_KEY }).post({
  body: {
    version: productType.body.version,
    actions: [{
      action: 'addAttributeDefinition',
      attribute: {
        name: ATTR_NAME,
        label: { 'en-US': 'Bundled Products' },
        isRequired: false,
        isSearchable: false,
        type: {
          name: 'set',
          elementType: { name: 'reference', referenceTypeId: 'product' },
        },
      },
    }],
  },
}).execute();
console.log(`Added attribute '${ATTR_NAME}' to product type '${PRODUCT_TYPE_KEY}'`);
```

Run: `node tools/create-bundles-attribute.mjs`

---

## Step 2 — Add `uuid` dependency

In `site/package.json`, add to `dependencies`:
```json
"uuid": "^11.1.0"
```

Then run `npm install` in `site/`.

---

## Step 3 — Extend `CartLineItem` type

**File**: `site/context/CartContext.tsx`

Add `key`, `parentKey`, and `bundledItems` to `CartLineItem`:

```typescript
export interface CartLineItem {
  id: string;
  key?: string;          // UUID set on parent bundle items
  parentKey?: string;    // matches parent's key for child bundle items
  bundledItems?: CartLineItem[];  // populated client-side by bundleItems()
  productId: string;
  // ... rest of existing fields unchanged
}
```

---

## Step 4 — CT cart operations

**File**: `site/lib/ct/cart.ts`

### 4a. Modify `addLineItem` to accept optional `key`

```typescript
export async function addLineItem(
  cartId: string,
  cartVersion: number,
  productId: string,
  variantId: number,
  quantity: number,
  recurrencePolicyId?: string,
  key?: string            // NEW: UUID for bundle parent
) {
  const action = {
    action: 'addLineItem',
    productId,
    variantId,
    quantity,
    ...(key ? { key } : {}),
    // ... existing recurrenceInfo spread unchanged
  } as CartUpdateAction;
  // ... rest unchanged
}
```

### 4b. Add `addBundledLineItems` function

Adds child SKUs to the cart referencing the parent's key via a custom field.

```typescript
export async function addBundledLineItems(
  cartId: string,
  cartVersion: number,
  skuList: string[],
  parentKey: string
) {
  if (!skuList.length) return await getCart(cartId);

  // Resolve each SKU to productId + variantId using the CT Product Search API
  const actions: CartUpdateAction[] = [];
  for (const sku of skuList) {
    // Use apiRoot.productProjections to find each SKU
    const { body } = await apiRoot
      .productProjections()
      .search()
      .get({ queryArgs: { filter: `variants.sku:"${sku}"`, limit: 1 } })
      .execute();
    const product = body.results[0];
    if (!product) continue;
    const allVariants = [product.masterVariant, ...(product.variants || [])];
    const variant = allVariants.find((v) => v.sku === sku) || product.masterVariant;

    actions.push({
      action: 'addLineItem',
      productId: product.id,
      variantId: variant.id,
      quantity: 1,
      custom: {
        type: { typeId: 'type', key: 'line-item-additional-info' },
        fields: { parentKey },
      },
    } as CartUpdateAction);
  }

  if (!actions.length) return await getCart(cartId);

  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({ body: { version: cartVersion, actions } })
    .execute();
  return body;
}
```

### 4c. Modify `changeLineItemQuantity` to cascade to bundle children

```typescript
export async function changeLineItemQuantity(
  cartId: string,
  cartVersion: number,
  lineItemId: string,
  quantity: number
) {
  const cart = await getCart(cartId);
  const item = cart.lineItems.find((li) => li.id === lineItemId);
  const itemKey = item?.key;

  // Find bundle children
  const bundleChildren = itemKey
    ? cart.lineItems.filter(
        (li) => li.custom?.fields?.parentKey === itemKey
      )
    : [];

  const actions: CartUpdateAction[] = [
    { action: 'changeLineItemQuantity', lineItemId, quantity },
    ...bundleChildren.map((child) => ({
      action: 'changeLineItemQuantity' as const,
      lineItemId: child.id,
      quantity,
    })),
  ];

  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({ body: { version: cart.version, actions } })
    .execute();
  return body;
}
```

### 4d. Modify `removeLineItem` to cascade bundle children

```typescript
export async function removeLineItem(cartId: string, cartVersion: number, lineItemId: string) {
  const cart = await getCart(cartId);
  const item = cart.lineItems.find((li) => li.id === lineItemId);
  const itemKey = item?.key;

  const bundleChildren = itemKey
    ? cart.lineItems.filter(
        (li) => li.custom?.fields?.parentKey === itemKey
      )
    : [];

  const actions: CartUpdateAction[] = [
    { action: 'removeLineItem', lineItemId },
    ...bundleChildren.map((child) => ({
      action: 'removeLineItem' as const,
      lineItemId: child.id,
    })),
  ];

  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({ body: { version: cart.version, actions } })
    .execute();
  return body;
}
```

> **Note**: `changeLineItemQuantity` and `removeLineItem` now fetch the cart internally to find children. Remove the `cartVersion` parameter from their callers (`site/app/api/cart/items/[itemId]/route.ts`) or keep it but ignore it — the internal fetch gets the latest version.

---

## Step 5 — Cart items API route

**File**: `site/app/api/cart/items/route.ts`

Accept `bundledSKUList` in the POST body:

```typescript
import { v4 as uuidv4 } from 'uuid';
import { addBundledLineItems } from '@/lib/ct/cart';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productId, variantId = 1, quantity = 1, recurrencePolicyId, bundledSKUList } = body;
  // ... existing session/cart setup unchanged ...

  // Generate a UUID key when there are bundle items
  const itemKey = bundledSKUList?.length ? uuidv4() : undefined;

  const updatedCart = await addLineItem(
    cartId!,
    cart.version,
    productId,
    variantId,
    quantity,
    recurrencePolicyId,
    itemKey        // NEW
  );

  // Add bundle children if any
  let finalCart = updatedCart;
  if (itemKey && bundledSKUList?.length) {
    finalCart = await addBundledLineItems(
      updatedCart.id,
      updatedCart.version,
      bundledSKUList,
      itemKey
    );
  }

  const newSession = { ...session, cartId: finalCart.id };
  const token = await createSessionToken(newSession);
  const resp = NextResponse.json({ cart: finalCart });
  setSessionCookie(resp, token);
  return resp;
}
```

---

## Step 6 — Map `key` and `parentKey` in `CartLineItem`

The CT API response includes `key` on line items and custom fields. Update `CartLineItem` mapping wherever the cart is serialized to the frontend (CT returns the raw cart in JSON — since this project uses the raw CT response directly, the `key` field from CT will be present automatically). However, `parentKey` lives in `custom.fields.parentKey`.

To surface `parentKey` on `CartLineItem`, add a cart transformation helper:

**File**: `site/lib/ct/cart-mapper.ts` (new file)

```typescript
import type { Cart as CTCart } from '@commercetools/platform-sdk';
import type { Cart, CartLineItem } from '@/context/CartContext';

export function mapCart(ctCart: CTCart): Cart {
  return {
    ...ctCart,
    lineItems: ctCart.lineItems.map((li): CartLineItem => ({
      id: li.id,
      key: li.key,
      parentKey: (li.custom?.fields?.parentKey as string | undefined),
      productId: li.productId,
      productKey: li.productKey,
      name: li.name,
      variant: {
        id: li.variant.id,
        sku: li.variant.sku,
        images: li.variant.images,
        prices: li.variant.prices,
      },
      price: li.price,
      totalPrice: li.totalPrice,
      quantity: li.quantity,
      recurrenceInfo: (li as unknown as { recurrenceInfo?: CartLineItem['recurrenceInfo'] })
        .recurrenceInfo,
      productSlug: li.productSlug,
    })),
  } as Cart;
}
```

Then in all API routes that return `{ cart }`, wrap with `mapCart`:

```typescript
import { mapCart } from '@/lib/ct/cart-mapper';
// ...
return NextResponse.json({ cart: mapCart(updatedCart) });
```

Apply this to:
- `site/app/api/cart/route.ts`
- `site/app/api/cart/items/route.ts`
- `site/app/api/cart/items/[itemId]/route.ts`
- `site/app/api/cart/discount/route.ts`

---

## Step 7 — Bundle utilities (client-side)

**File**: `site/lib/bundle-utils.ts` (new file)

```typescript
import type { CartLineItem } from '@/context/CartContext';

export const BUNDLE_ITEMS_ATTR = 'bundledItems';

/**
 * Groups child line items under their parent.
 * Returns only parent (non-child) items with bundledItems populated.
 */
export function bundleItems(lineItems: CartLineItem[]): CartLineItem[] {
  const childKeys = new Set(
    lineItems.filter((li) => li.parentKey).map((li) => li.parentKey!)
  );

  return lineItems
    .filter((li) => !li.parentKey)
    .map((li) => ({
      ...li,
      bundledItems: li.key
        ? lineItems.filter((child) => child.parentKey === li.key)
        : [],
    }));
}

/** Total visible line item count (exclude bundle children) */
export function cartItemCount(lineItems: CartLineItem[]): number {
  return lineItems.filter((li) => !li.parentKey).reduce((sum, li) => sum + li.quantity, 0);
}
```

---

## Step 8 — Apply bundle middleware in cart hook

**File**: `site/hooks/useCartSWR.ts`

Import `bundleItems` and apply it when data is returned:

```typescript
import { bundleItems } from '@/lib/bundle-utils';

async function cartFetcher(): Promise<Cart | null> {
  const res = await fetch('/api/cart');
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.cart) return null;
  return {
    ...data.cart,
    lineItems: bundleItems(data.cart.lineItems ?? []),
  };
}
```

---

## Step 9 — CartItem: display bundle sub-items

**File**: `site/components/cart/CartItem.tsx`

After the subscription badge and before the quantity controls, add:

```tsx
{item.bundledItems && item.bundledItems.length > 0 && (
  <div className="mt-2 space-y-1">
    {item.bundledItems.map((bi) => {
      const biName = getLocalizedString(bi.name);
      const biPrice = formatMoney(
        bi.price?.value?.centAmount || 0,
        bi.price?.value?.currencyCode || 'USD'
      );
      return (
        <div key={bi.id} className="text-charcoal-light flex items-center justify-between text-xs">
          <span>+ {biName}</span>
          <span>{biPrice}</span>
        </div>
      );
    })}
  </div>
)}
```

---

## Step 10 — Product search: load bundle data

**File**: `site/lib/ct/search.ts`

Add a function that fetches a product by SKU with bundle attributes expanded:

```typescript
export async function getProductWithBundles(
  sku: string,
  locale: string,
  currency: string,
  country: string,
  bundleAttrName: string  // e.g. 'bundled-products'
) {
  const product = await getProductBySku(sku, locale, currency, country);
  if (!product) return null;

  const allVariants = [product.masterVariant, ...(product.variants || [])];
  const variant = allVariants.find((v) => v?.sku === sku) || product.masterVariant;
  const attrs = variant?.attributes || product.masterVariant?.attributes || [];
  const bundleAttr = attrs.find((a: { name: string }) => a.name === bundleAttrName);

  if (!bundleAttr) return { product, bundledProducts: [] };

  // bundleAttr.value is an array of { typeId: 'product', id: string }
  const refs: Array<{ id: string }> = Array.isArray(bundleAttr.value) ? bundleAttr.value : [];

  const bundledProducts = await Promise.all(
    refs.map(async (ref) => {
      try {
        const { body } = await apiRoot
          .productProjections()
          .withId({ ID: ref.id })
          .get({ queryArgs: { priceCurrency: currency, priceCountry: country } })
          .execute();
        return body;
      } catch {
        return null;
      }
    })
  );

  return { product, bundledProducts: bundledProducts.filter(Boolean) };
}
```

---

## Step 11 — Bundle product detail component

**File**: `site/components/product/BundleAddToCart.tsx` (new client component)

```tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useFormatters } from '@/hooks/useFormatters';
import Image from 'next/image';

interface BundledProduct {
  id: string;
  name: Record<string, string>;
  masterVariant: {
    sku?: string;
    images?: Array<{ url: string }>;
    prices?: Array<{ value: { centAmount: number; currencyCode: string } }>;
  };
}

interface BundleAddToCartProps {
  productId: string;
  variantId: number;
  bundledProducts: BundledProduct[];
  locale: string;
}

export default function BundleAddToCart({
  productId,
  variantId,
  bundledProducts,
  locale,
}: BundleAddToCartProps) {
  const [loading, setLoading] = useState(false);
  const { addToCartAndShow } = useCart();
  const { formatMoney, getLocalizedString } = useFormatters();

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      const bundledSKUList = bundledProducts
        .map((p) => p.masterVariant?.sku)
        .filter(Boolean) as string[];

      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, variantId, quantity: 1, bundledSKUList }),
      });
      if (!res.ok) throw new Error('Failed to add bundle to cart');
      const data = await res.json();
      addToCartAndShow(data.cart);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {bundledProducts.length > 0 && (
        <div className="border-border rounded-sm border p-4 space-y-3">
          <p className="text-charcoal text-xs font-semibold tracking-wider uppercase">
            Included in bundle
          </p>
          {bundledProducts.map((bp) => {
            const name = getLocalizedString(bp.name);
            const image = bp.masterVariant?.images?.[0]?.url;
            const price = bp.masterVariant?.prices?.[0];
            return (
              <div key={bp.id} className="flex items-center gap-3">
                {image && (
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-sm bg-gray-100">
                    <Image src={image} alt={name} fill className="object-cover" sizes="48px" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-charcoal text-sm font-medium truncate">{name}</p>
                  {price && (
                    <p className="text-charcoal-light text-xs">
                      {formatMoney(price.value.centAmount, price.value.currencyCode)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={loading}
        className="bg-terra hover:bg-terra-dark text-white w-full rounded-sm px-6 py-3 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading ? 'Adding…' : 'Add Bundle to Cart'}
      </button>
    </div>
  );
}
```

---

## Step 12 — Wire bundle component into PDP

**File**: `site/app/[locale]/[slug]/p/[sku]/page.tsx`

1. Import the new search function and component:
```typescript
import { getProductWithBundles } from '@/lib/ct/search';
import BundleAddToCart from '@/components/product/BundleAddToCart';
```

2. Ask the user for the bundle attribute name (e.g. `bundled-products`) and define it as a constant.

3. Replace `getProductBySku` with `getProductWithBundles` (or call it alongside):
```typescript
const BUNDLE_ATTR = 'bundled-products'; // confirm with user

const [{ product, bundledProducts }, policiesResult] = await Promise.all([
  getProductWithBundles(sku, locale, currency, country, BUNDLE_ATTR),
  getRecurrencePolicies(),
]);
if (!product) notFound();
```

4. In the JSX, replace `<AddToCartButton>` with conditional rendering:
```tsx
{bundledProducts && bundledProducts.length > 0 ? (
  <BundleAddToCart
    productId={product.id}
    variantId={variant?.id || product.masterVariant.id}
    bundledProducts={bundledProducts}
    locale={locale}
  />
) : isSubscriptionEligible && recurringPrices.length > 0 ? (
  <SubscribeAndSave ... />
) : (
  <AddToCartButton ... />
)}
```

---

## Step 13 — i18n additions

**File**: `site/messages/en.json`

Add under the `"cart"` key:
```json
"bundledWith": "Included in bundle",
"addBundle": "Add Bundle to Cart"
```

Repeat for other locale files (`en-us.json`, `de.json`, etc.).

---

## Step 14 — Update `FEATURES.md` and `test.txt`

After implementing, update `FEATURES.md` to document the bundle feature and add plain-English test cases to `test.txt`, e.g.:

```
Bundle product display: When a product has bundled accessories, the PDP shows all included items with images and prices before the Add to Cart button.
Bundle add to cart: Clicking "Add Bundle to Cart" adds the main product and all bundled accessories to the cart in one operation.
Bundle cart display: Bundled accessories appear as sub-items under their parent in the mini-cart and cart page.
Bundle quantity update: Changing the quantity of a bundle parent also updates all child item quantities.
Bundle remove: Removing a bundle parent also removes all child bundle items from the cart.
```

---

## Implementation Checklist

- [ ] Run `create-bundles-custom-type.mjs` — creates CT custom type
- [ ] Confirm bundle attribute key with user; run `create-bundles-attribute.mjs` if needed
- [ ] Add `uuid` to `site/package.json`, run `npm install`
- [ ] Extend `CartLineItem` in `site/context/CartContext.tsx`
- [ ] Update `site/lib/ct/cart.ts` — `addLineItem`, `removeLineItem`, `changeLineItemQuantity`, add `addBundledLineItems`
- [ ] Create `site/lib/ct/cart-mapper.ts`
- [ ] Update all cart API routes to use `mapCart`
- [ ] Update `site/app/api/cart/items/route.ts` — accept `bundledSKUList`
- [ ] Create `site/lib/bundle-utils.ts`
- [ ] Update `site/hooks/useCartSWR.ts` — apply `bundleItems` in fetcher
- [ ] Update `site/components/cart/CartItem.tsx` — display sub-items
- [ ] Add `getProductWithBundles` to `site/lib/ct/search.ts`
- [ ] Create `site/components/product/BundleAddToCart.tsx`
- [ ] Update PDP page to detect bundle attribute and render `BundleAddToCart`
- [ ] Add i18n keys to all message files
- [ ] Update `FEATURES.md` and `test.txt`
