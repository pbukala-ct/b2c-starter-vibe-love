---
name: add-api
description: How to add a new backend API endpoint and wire it to a SWR hook that client components can consume.
---

# Add a New API Route + Frontend Hook

How to add a new backend API endpoint and wire it to a SWR hook that client components can consume.

## Rules

**Never call `fetch('/api/*')` directly inside a client component.** All API calls belong in a hook in `site/hooks/`. Components call the hook.

**Never import from `@/lib/ct/*` in a frontend component or hook.** The data flow is strictly one-way:

```
Frontend component → hook (site/hooks/) → fetch('/api/…') → API route (site/app/api/) → lib/ct/<namespace>.ts → commercetools
```

`lib/ct/` is server-only. It must never appear in any `'use client'` file.

If a frontend component needs a **type** that originates in a CT module, import it from `@/lib/types` instead:

```typescript
// ✅ correct
import type { Category, ProductProjection, Price } from '@/lib/types';

// ❌ wrong — even for types
import { Category } from '@/lib/ct/categories';
```

When adding a new shared type, add it to `site/lib/types.ts` as a re-export.

---

## Step 1 — Add a cache key

`site/lib/cache-keys.ts` is the single source of truth for SWR cache keys.

```typescript
// simple resource
export const KEY_WIDGETS = 'widgets';

// parameterised resource
export function keyWidget(id: string) {
  return `widget-${id}`;
}
```

---

## Step 2 — Create the API route

All CT API calls go through Next.js API routes in `site/app/api/`. The browser never talks to commercetools directly.

```
site/app/api/widgets/route.ts          ← GET list, POST create
site/app/api/widgets/[id]/route.ts     ← GET one, PUT update, DELETE
```

Typical GET handler shape:

```typescript
// site/app/api/widgets/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getLocale } from '@/lib/locale';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { country, currency } = await getLocale();
  // ... fetch from CT, return data
  return NextResponse.json({ widgets });
}
```

---

## Step 2.1 — Add CT helper functions in the right namespace file

All commercetools API calls live in `site/lib/ct/`. Each file owns one domain:

| File | Owns |
|---|---|
| `lib/ct/auth.ts` | Customer auth: `signInCustomer`, `signUpCustomer`, `getCustomerById`, `updateCustomer` |
| `lib/ct/orders.ts` | Orders: `getCustomerOrders`, `getOrderById`, `addOrderReturnInfo` |
| `lib/ct/subscriptions.ts` | Recurring orders & recurrence policies |
| `lib/ct/wishlist.ts` | Shopping lists (CT wishlist) |
| `lib/ct/custom-objects.ts` | CT custom objects |
| `lib/ct/cart.ts` | Cart operations |

All files import the shared `ct()` helper from `lib/ct/request.ts`:

```typescript
// lib/ct/widgets.ts
import { ct } from './request';

export async function getWidgets(customerId: string) {
  return ct('GET', `/widgets?where=${encodeURIComponent(`customerId = "${customerId}"`)}`);
}

export async function createWidget(data: Record<string, unknown>) {
  return ct('POST', '/widgets', data);
}
```

**Rule**: never add CT calls directly to an API route. Put them in the matching `lib/ct/<namespace>.ts` file and import from there.

---

## Step 3 — Create or update the hook

### New hook file — read-only resource

```typescript
// site/hooks/useWidgets.ts
'use client';

import useSWR from 'swr';
import { KEY_WIDGETS, keyWidget } from '@/lib/cache-keys';

export interface Widget { id: string; name: string; /* ... */ }

async function widgetsFetcher(): Promise<Widget[]> {
  const res = await fetch('/api/widgets');
  if (!res.ok) return [];
  const data = await res.json();
  return data.widgets ?? [];
}

export function useWidgets() {
  return useSWR<Widget[]>(KEY_WIDGETS, widgetsFetcher, { revalidateOnFocus: false });
}
```

### Adding mutations to an existing hook

Mutations use `useSWRConfig` to update the cache after a successful API call. They **always** throw on error so the calling component can handle it.

```typescript
// site/hooks/useWidgets.ts  (continued)
import { useSWRConfig } from 'swr';

export function useWidgetMutations() {
  const { mutate } = useSWRConfig();

  async function createWidget(data: Partial<Widget>) {
    const res = await fetch('/api/widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Failed to create widget');
    }
    const newData = await res.json();
    // Option A: set cache directly from response (no refetch)
    mutate(KEY_WIDGETS, newData.widgets, { revalidate: false });
    // Option B: revalidate from server (simpler, one extra request)
    // mutate(KEY_WIDGETS);
  }

  async function updateWidget(id: string, data: Partial<Widget>) {
    const res = await fetch(`/api/widgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Failed to update widget');
    }
    mutate(KEY_WIDGETS);           // invalidate list
    mutate(keyWidget(id));         // invalidate detail
  }

  async function deleteWidget(id: string) {
    const res = await fetch(`/api/widgets/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete widget');
    const newData = await res.json();
    mutate(KEY_WIDGETS, newData.widgets, { revalidate: false });
  }

  return { createWidget, updateWidget, deleteWidget };
}
```

### Parameterised hook (e.g. by locale)

Use an array key — SWR serialises it and passes it to the fetcher:

```typescript
export function useWidgetsByCountry() {
  const { country } = useLocale();
  const key: [string, string] | null = country ? [KEY_WIDGETS, country] : null;
  return useSWR<Widget[]>(key, ([, c]) => fetchWidgets(c), { revalidateOnFocus: false });
}
```

---

## Step 4 — Use the hook in a component

```typescript
'use client';
import { useWidgets, useWidgetMutations } from '@/hooks/useWidgets';

export default function WidgetsPage() {
  const { data: widgets = [], isLoading, error } = useWidgets();
  const { createWidget, deleteWidget } = useWidgetMutations();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage />;

  return (
    <>
      {widgets.map(w => (
        <div key={w.id}>
          {w.name}
          <button onClick={() => deleteWidget(w.id)}>Delete</button>
        </div>
      ))}
    </>
  );
}
```

---

## Existing hooks to reuse or extend

| Hook file | Exports | Cache keys |
|-----------|---------|------------|
| `hooks/useCartSWR.ts` | `useCartSWR`, `useCartMutations` | `KEY_CART` |
| `hooks/useOrders.ts` | `useOrders`, `useOrder` | `KEY_ORDERS`, `keyOrder(id)` |
| `hooks/useSubscriptions.ts` | `useSubscriptions`, `useSubscription`, `useSubscriptionAction` | `KEY_SUBSCRIPTIONS`, `keySubscription(id)` |
| `hooks/useAddresses.ts` | `useAddresses`, `useAddressMutations` | `KEY_ADDRESSES` |
| `hooks/usePayments.ts` | `usePayments`, `usePaymentMutations` | `KEY_PAYMENTS` |
| `hooks/useShippingMethods.ts` | `useShippingMethods` | `keyShippingMethods(country, currency)` |
| `hooks/useAccount.ts` | `useAccount` | `KEY_ACCOUNT` |
| `hooks/useRecurrencePolicies.ts` | `useRecurrencePolicies`, `useRecurrencePoliciesList` | `KEY_RECURRENCE_POLICIES` |
| `hooks/useWishlist.ts` | `useWishlist`, `useWishlistMutations` | `KEY_WISHLIST` |

---

## Checklist

- [ ] Add cache key(s) to `site/lib/cache-keys.ts`
- [ ] Create API route(s) in `site/app/api/`
- [ ] Create or update hook in `site/hooks/`
- [ ] Export types from the hook so components don't redeclare them
- [ ] Component uses `isLoading` / `error` from SWR for loading/error states
- [ ] Mutations throw on error — wrap the call in `try/catch` in the component
- [ ] Never call `fetch('/api/*')` directly in a client component
