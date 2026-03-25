---
name: bopis
description: How to implement Buy Online, Pick Up In Store (BOPIS) — channel API, supply-channel cart integration, per-store inventory, and channel selector UI.
---

# Buy Online, Pick Up In Store (BOPIS)

Allows customers to choose between home delivery or store pickup when adding a product to cart. Each pickup item is linked to a specific commercetools Channel (store location) via a supply channel reference. Cart items are visually grouped by fulfillment method.

## Data Flow

```
Component → useChannels hook → /api/channels → lib/ct/channels.ts → CT /channels
Component → useCartMutations.addToCart(supplyChannelId?) → /api/cart/items → lib/ct/cart.ts addLineItem(supplyChannelId?)
```

---

## Step 1 — CT Channel library (`site/lib/ct/channels.ts`)

Create a new file. No mapper needed — pass CT responses as-is.

```typescript
// site/lib/ct/channels.ts
import { ct } from './request';

export async function getAllChannels() {
  // expand custom fields if needed; limit=500 covers most store counts
  return ct('GET', '/channels?limit=500');
}

export async function getChannelById(channelId: string) {
  return ct('GET', `/channels/${channelId}`);
}

export async function getChannelByKey(channelKey: string) {
  const encoded = encodeURIComponent(`key = "${channelKey}"`);
  const data = await ct('GET', `/channels?where=${encoded}&limit=1`);
  return data.results?.[0] ?? null;
}
```

---

## Step 2 — API routes for channels

### `site/app/api/channels/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getAllChannels } from '@/lib/ct/channels';

export async function GET() {
  const data = await getAllChannels();
  return NextResponse.json({ channels: data.results ?? [] });
}
```

### `site/app/api/channels/[id]/route.ts`

```typescript
import { NextResponse, NextRequest } from 'next/server';
import { getChannelById, getChannelByKey } from '@/lib/ct/channels';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Support ?by=key query param to fetch by key instead of ID
  const byKey = req.nextUrl.searchParams.get('by') === 'key';
  const channel = byKey ? await getChannelByKey(id) : await getChannelById(id);
  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ channel });
}
```

---

## Step 3 — Cart: supply channel support

### 3a. Update `site/lib/ct/cart.ts`

Add `supplyChannelId` parameter to `addLineItem`:

```typescript
export async function addLineItem(
  cartId: string,
  cartVersion: number,
  productId: string,
  variantId: number,
  quantity: number,
  recurrencePolicyId?: string,
  supplyChannelId?: string,          // ← new optional parameter
) {
  const addAction: Record<string, unknown> = {
    action: 'addLineItem',
    productId,
    variantId,
    quantity,
  };
  if (recurrencePolicyId) {
    addAction.recurrenceInfo = {
      recurrencePolicy: { typeId: 'recurrence-policy', id: recurrencePolicyId },
      priceSelectionMode: 'Fixed',
    };
  }
  if (supplyChannelId) {
    addAction.supplyChannel = { typeId: 'channel', id: supplyChannelId };
  }
  return ct('POST', `/carts/${cartId}`, { version: cartVersion, actions: [addAction] });
}
```

### 3b. Update `site/app/api/cart/items/route.ts`

Read `supplyChannelId` from request body and forward it:

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productId, variantId = 1, quantity = 1, recurrencePolicyId, supplyChannelId } = body;
  // ... existing cart resolution logic unchanged ...
  const updatedCart = await addLineItem(
    cartId!, cart.version, productId, variantId, quantity,
    recurrencePolicyId,
    supplyChannelId,      // ← pass through
  );
  // ... rest of handler unchanged ...
}
```

---

## Step 4 — Product availability: expose per-channel stock

CT includes per-channel inventory in the product search response under `availability.channels` when you add `availabilityFilter` to the search body. Update `site/lib/ct/search.ts` to request it:

```typescript
// In the POST body sent to /products/search, add:
const body: Record<string, unknown> = {
  limit, offset,
  productProjectionParameters: {
    priceCurrency: currency,
    priceCountry: country,
    // Include per-channel availability data:
    includeChannelIds: [],    // empty = all channels
  },
  sort: [{ field: 'createdAt', order: 'desc' }],
};
```

The response variant objects will then contain:
```json
{
  "availability": {
    "isOnStock": true,
    "availableQuantity": 10,
    "channels": {
      "<channelId>": {
        "isOnStock": true,
        "availableQuantity": 5,
        "restockableInDays": 0
      }
    }
  }
}
```

No code change needed to read this — it flows through automatically since we pass CT responses as-is.

---

## Step 5 — Cache keys

Add to `site/lib/cache-keys.ts`:

```typescript
export const KEY_CHANNELS = 'channels';

export function keyChannel(id: string) {
  return `channel-${id}`;
}
```

---

## Step 6 — `useChannels` hook (`site/hooks/useChannels.ts`)

```typescript
'use client';
import useSWR from 'swr';
import { KEY_CHANNELS, keyChannel } from '@/lib/cache-keys';

export interface ChannelAddress {
  streetName?: string;
  streetNumber?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface GeoLocation {
  type: string;
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Channel {
  id: string;
  key: string;
  name?: Record<string, string>;
  description?: Record<string, string>;
  roles: string[];
  address?: ChannelAddress;
  geoLocation?: GeoLocation;
}

async function channelsFetcher(): Promise<Channel[]> {
  const res = await fetch('/api/channels');
  if (!res.ok) return [];
  const data = await res.json();
  return data.channels ?? [];
}

export function useChannels() {
  return useSWR<Channel[]>(KEY_CHANNELS, channelsFetcher, {
    revalidateOnFocus: false,
    // Channel list changes rarely — long cache is fine
    dedupingInterval: 60_000,
  });
}

async function channelFetcher(id: string): Promise<Channel | null> {
  const res = await fetch(`/api/channels/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.channel ?? null;
}

export function useChannel(id: string | null) {
  return useSWR<Channel | null>(
    id ? keyChannel(id) : null,
    () => channelFetcher(id!),
    { revalidateOnFocus: false },
  );
}
```

---

## Step 7 — Type extensions

### Extend `CartLineItem` in `site/context/CartContext.tsx`

Add `supplyChannelId` to the existing `CartLineItem` interface:

```typescript
export interface CartLineItem {
  // ... existing fields ...
  supplyChannelId?: string;   // ← present when item is a pickup item
}
```

### Extend `Variant` in `site/lib/ct/search.ts`

Add availability to the existing `Variant` interface:

```typescript
export interface VariantChannelAvailability {
  isOnStock: boolean;
  availableQuantity?: number;
  restockableInDays?: number;
}

export interface VariantAvailability {
  isOnStock?: boolean;
  availableQuantity?: number;
  channels?: Record<string, VariantChannelAvailability>;
}

export interface Variant {
  // ... existing fields ...
  availability?: VariantAvailability;   // ← new
}
```

Export new types from `site/lib/types.ts`:

```typescript
export type { VariantAvailability, VariantChannelAvailability } from '@/lib/ct/search';
```

---

## Step 8 — `useCartMutations`: expose `supplyChannelId`

In `site/hooks/useCartSWR.ts`, the `addToCart` mutation (if it exists) or the direct fetch in the component should accept `supplyChannelId`. The API call becomes:

```typescript
async function addToCart(
  productId: string,
  variantId: number,
  quantity: number,
  options?: { recurrencePolicyId?: string; supplyChannelId?: string }
) {
  const resp = await fetch('/api/cart/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId,
      variantId,
      quantity,
      recurrencePolicyId: options?.recurrencePolicyId,
      supplyChannelId: options?.supplyChannelId,
    }),
  });
  if (!resp.ok) throw new Error('Failed to add to cart');
  const data = await resp.json();
  mutate(KEY_CART, data.cart, { revalidate: false });
}
```

---

## Step 9 — UI Components

### `ChannelSelector` component

Renders two panels: Delivery (standard) and Pick Up In Store. Persists selection to `localStorage`.

```typescript
// site/components/ChannelSelector.tsx
'use client';
import { useState, useEffect } from 'react';
import { StoreLocator } from './StoreLocator';
import type { Variant } from '@/lib/types';

interface Props {
  variant: Variant;
  onChannelChange: (supplyChannelId: string | null) => void;
}

export function ChannelSelector({ variant, onChannelChange }: Props) {
  const [mode, setMode] = useState<'delivery' | 'pickup'>('delivery');

  useEffect(() => {
    const saved = localStorage.getItem('bopis-mode') as 'delivery' | 'pickup' | null;
    if (saved) setMode(saved);
  }, []);

  function select(m: 'delivery' | 'pickup') {
    setMode(m);
    localStorage.setItem('bopis-mode', m);
    if (m === 'delivery') onChannelChange(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => select('delivery')}
        className={mode === 'delivery' ? 'bg-gray-100 font-semibold p-3 rounded border' : 'p-3 rounded border'}
      >
        Home Delivery
      </button>
      <button
        onClick={() => select('pickup')}
        className={mode === 'pickup' ? 'bg-gray-100 font-semibold p-3 rounded border' : 'p-3 rounded border'}
      >
        Pick Up In Store
      </button>

      {mode === 'pickup' && (
        <StoreLocator variant={variant} onStoreSelect={onChannelChange} />
      )}
    </div>
  );
}
```

### `StoreLocator` component

Dropdown listing channels with per-store stock status. Falls back to delivery when out of stock.

```typescript
// site/components/StoreLocator.tsx
'use client';
import { useState } from 'react';
import { useChannels } from '@/hooks/useChannels';
import type { Variant } from '@/lib/types';

interface Props {
  variant: Variant;
  onStoreSelect: (channelId: string | null) => void;
}

export function StoreLocator({ variant, onStoreSelect }: Props) {
  const { data: channels = [], isLoading } = useChannels();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) return <p className="text-sm text-gray-500">Loading stores…</p>;

  function handleChange(channelId: string) {
    const avail = variant.availability?.channels?.[channelId];
    if (avail && !avail.isOnStock) {
      // Out of stock at this store — notify parent to revert to delivery
      onStoreSelect(null);
      setSelectedId(null);
      return;
    }
    setSelectedId(channelId);
    onStoreSelect(channelId);
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        className="border rounded p-2 w-full"
        value={selectedId ?? ''}
        onChange={(e) => handleChange(e.target.value)}
      >
        <option value="">— Select a store —</option>
        {channels.map((ch) => {
          const avail = variant.availability?.channels?.[ch.id];
          const inStock = avail?.isOnStock ?? false;
          const qty = avail?.availableQuantity ?? 0;
          const label = ch.name?.['en-US'] ?? ch.key;
          return (
            <option key={ch.id} value={ch.id} disabled={!inStock}>
              {label} {inStock ? `(${qty} in stock)` : '(out of stock)'}
            </option>
          );
        })}
      </select>
    </div>
  );
}
```

### Cart grouping hook — `useChannelLineItems` (`site/hooks/useChannelLineItems.ts`)

Groups cart line items into delivery vs pickup buckets for the cart UI.

```typescript
'use client';
import type { CartLineItem } from '@/context/CartContext';

export interface GroupedLineItems {
  deliveryItems: CartLineItem[];
  pickupItems: CartLineItem[];
}

export function groupLineItems(lineItems: CartLineItem[]): GroupedLineItems {
  return {
    deliveryItems: lineItems.filter((i) => !i.supplyChannelId),
    pickupItems: lineItems.filter((i) => !!i.supplyChannelId),
  };
}
```

Use in the cart component:

```typescript
import { groupLineItems } from '@/hooks/useChannelLineItems';
const { deliveryItems, pickupItems } = groupLineItems(cart.lineItems);
```

### CartItem pickup badge (`site/components/cart/CartItem.tsx`)

Show "Store pickup: \<name\>" below the product name for pickup items. Use `useChannel` to resolve the name — it is already cached from the product page so no extra network call is made in practice.

```typescript
import { useChannel } from '@/hooks/useChannels';

// inside the component:
const { data: supplyChannel } = useChannel(item.supplyChannel?.id ?? null);
const supplyChannelName = supplyChannel?.name?.['en-US'] ?? supplyChannel?.key;

// in JSX, after the subscription badge:
{item.supplyChannel && (
  <div className="flex items-center gap-1 mt-1">
    <span className="text-xs text-terra font-medium">
      Store pickup{supplyChannelName ? `: ${supplyChannelName}` : ''}
    </span>
  </div>
)}
```

---

## Step 10 — Product Details page integration

In the product details page/component, add `ChannelSelector` and thread the selected channel into `addToCart`:

```typescript
'use client';
import { useState } from 'react';
import { ChannelSelector } from '@/components/ChannelSelector';

// Inside your component:
const [supplyChannelId, setSupplyChannelId] = useState<string | null>(null);

async function handleAddToCart() {
  await addToCart(productId, variantId, quantity, { supplyChannelId: supplyChannelId ?? undefined });
}

// In JSX, after the variant selector:
<ChannelSelector variant={selectedVariant} onChannelChange={setSupplyChannelId} />
```

---

## Step 11 — Translations (i18n)

Add keys to all three message files (`messages/en-us.json`, `messages/en-gb.json`, `messages/de-de.json`):

```json
{
  "product": {
    "home-delivery": "Home Delivery",
    "pick-up-in-store": "Pick Up In Store",
    "select-store": "Select a store",
    "in-stock": "{qty} in stock",
    "out-of-stock": "Out of stock",
    "loading-stores": "Loading stores…"
  },
  "cart": {
    "delivery-items": "Delivery",
    "pickup-items": "Store Pickup"
  }
}
```

---

## Checklist

### Backend
- [ ] Create `site/lib/ct/channels.ts` with `getAllChannels`, `getChannelById`, `getChannelByKey`
- [ ] Create `site/app/api/channels/route.ts` (GET all)
- [ ] Create `site/app/api/channels/[id]/route.ts` (GET one, supports `?by=key`)
- [ ] Update `addLineItem` in `site/lib/ct/cart.ts` to accept `supplyChannelId`
- [ ] Update `site/app/api/cart/items/route.ts` to pass `supplyChannelId` through
- [ ] Add `includeChannelIds` to product search body in `site/lib/ct/search.ts`

### Types
- [ ] Add `supplyChannelId?: string` to `CartLineItem` in `site/context/CartContext.tsx`
- [ ] Add `VariantAvailability`, `VariantChannelAvailability` interfaces to `site/lib/ct/search.ts`
- [ ] Extend `Variant` with `availability?: VariantAvailability`
- [ ] Export new types from `site/lib/types.ts`

### Cache Keys
- [ ] Add `KEY_CHANNELS` and `keyChannel(id)` to `site/lib/cache-keys.ts`

### Frontend Hooks
- [ ] Create `site/hooks/useChannels.ts` with `useChannels()` and `useChannel(id)`
- [ ] Update `site/hooks/useCartSWR.ts` `addToCart` mutation to accept `supplyChannelId`
- [ ] Create `site/hooks/useChannelLineItems.ts` with `groupLineItems` helper

### UI Components
- [ ] Create `site/components/ChannelSelector.tsx`
- [ ] Create `site/components/StoreLocator.tsx`
- [ ] Update cart items list to render `deliveryItems` and `pickupItems` in separate sections
- [ ] Add "Store pickup: \<name\>" badge to `CartItem` using `useChannel(item.supplyChannel?.id)`
- [ ] Wire `ChannelSelector` into the product details page

### UX / i18n
- [ ] Add translation keys for all BOPIS text
- [ ] Persist channel mode selection in `localStorage`
- [ ] Show out-of-stock graceful fallback (revert to delivery)

---

## Key Engineering Notes

**Supply channel reference format** — CT requires a typed resource reference:
```typescript
{ typeId: 'channel', id: channelId }
```

**Channel roles** — BOPIS stores typically have role `InventorySupply`. Filter by role if you only want pickup-eligible stores:
```typescript
const storeChannels = channels.filter(ch => ch.roles.includes('InventorySupply'));
```

**Availability data** — Only present in search responses when `includeChannelIds` is set. If the field is absent, treat as unknown availability (don't block pickup selection).

**StoreLocator visibility** — Only render a channel in the store picker if it has an entry in `variant.availability.channels`. A channel with no availability record has no inventory data for that variant and must not be offered for pickup. The filter is:
```typescript
channels.filter(
  (ch) => ch.roles.includes('InventorySupply') && variant.availability?.channels?.[ch.id] !== undefined
)
```
Once filtered this way, you can access `avail.isOnStock` / `avail.availableQuantity` without null-checks inside the list render.

**No mapper pattern** — This codebase passes CT responses directly. Do not create mapper classes. Transform inline in the hook or component if needed.

**Dynamic route params** — Always `await params` in Next.js 15 route handlers:
```typescript
const { id } = await params;
```
