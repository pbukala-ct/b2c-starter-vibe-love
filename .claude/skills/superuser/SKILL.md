---
name: superuser
description: How to implement the CSR (Customer Service Representative) superuser feature — customer impersonation and real-time cart price overrides.
---

# Superuser / CSR Feature

This feature lets an authorised Customer Service Representative (CSR) log in with their own credentials and then **impersonate a customer** to act on their behalf. While impersonating, the CSR can also **override line item prices** in the customer's cart.

---

## Use-case summary

1. A CSR visits the login page and signs in with their own email/password.
2. If their CT account belongs to the designated CSR customer group, the login response signals that a second step is needed.
3. The login form reveals a second field: **"Customer email to impersonate"**.
4. The CSR submits the customer's email; the session is now dual — it carries both the CSR's identity and the impersonated customer's identity.
5. A **yellow banner** appears in the header indicating active CSR mode.
6. In the cart, each line item shows an **editable price input** (only in CSR mode); the CSR can type a new price and apply it.
7. Logging out ends the impersonation session entirely.

---

## Architecture

```
app/[locale]/login/page.tsx (two-step form)
  └─ POST /api/auth/login                 ← step 1: detect CSR group → { requiresCsrEmail: true }
  └─ POST /api/auth/csr-login             ← step 2: impersonate customer, set dual session

context/SuperUserContext.tsx              ← global CSR state (hook: useSuperUser)
  └─ fetches GET /api/auth/superuser      ← returns csrFirstName, csrLastName, csrEmail or null

Header.tsx                                ← reads context, renders yellow banner when csrId present

Cart line item component                  ← reads context, shows PriceOverrideInput in CSR mode
  └─ PUT /api/cart/items/[itemId]/price   ← sets externalPrice on the line item
       └─ lib/ct/cart.ts: changeLineItemPrice()
```

---

## Step 1 — CT setup

Create a **Customer Group** in CT Merchant Center called e.g. `csr-agents`. Copy its ID into `site/.env`:

```
CSR_GROUP_ID=<your-customer-group-id>
```

Do **not** use `NEXT_PUBLIC_` — this must stay server-only.

---

## Step 2 — Extend the Session type

`site/lib/session.ts` — add CSR fields to the `Session` interface. The normal customer fields (`customerId`, `customerEmail`, etc.) hold the **impersonated** customer once in CSR mode; the new `csr*` fields hold the CSR's own identity.

```typescript
export interface Session {
  // existing fields ...
  customerId?: string;
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  cartId?: string;
  // CSR / superuser fields (only set during impersonation)
  csrId?: string;
  csrEmail?: string;
  csrFirstName?: string;
  csrLastName?: string;
}
```

---

## Step 3 — CT helpers

### `lib/ct/auth.ts` — add `getCustomerByEmail`

```typescript
export async function getCustomerByEmail(email: string) {
  const result = await ct('GET', `/customers?where=${encodeURIComponent(`email="${email}"`)}&limit=1`);
  if (!result.results || result.results.length === 0) {
    throw new Error(`No customer found with email: ${email}`);
  }
  return result.results[0];
}
```

### `lib/ct/cart.ts` — add `changeLineItemPrice`

Uses the CT `setLineItemPrice` update action with an `externalPrice` to override the platform price:

```typescript
export async function changeLineItemPrice(
  cartId: string,
  cartVersion: number,
  lineItemId: string,
  centAmount: number,
  currencyCode: string
) {
  return ct('POST', `/carts/${cartId}`, {
    version: cartVersion,
    actions: [{
      action: 'setLineItemPrice',
      lineItemId,
      externalPrice: { currencyCode, centAmount },
    }],
  });
}
```

---

## Step 4 — API routes

### `app/api/auth/login/route.ts` — detect CSR group membership

After a successful CT `signInCustomer`, check whether the customer belongs to the CSR group. If yes, **do not create a full session** — instead return a signal so the login form can enter its second step.

```typescript
// Inside the POST handler, after `const customer = result.customer;`:

const csrGroupId = process.env.CSR_GROUP_ID;
const isCsr = csrGroupId && customer.customerGroup?.id === csrGroupId;

if (isCsr) {
  // Return the CSR's own data so the frontend can display it,
  // but don't write a session cookie yet — step 2 is needed.
  return NextResponse.json({
    requiresCsrEmail: true,
    csrId: customer.id,
    csrEmail: customer.email,
    csrFirstName: customer.firstName ?? '',
    csrLastName: customer.lastName ?? '',
  });
}

// Normal login flow continues below (create session, set cookie) ...
```

### `app/api/auth/csr-login/route.ts` — impersonation (step 2)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, setSessionCookie } from '@/lib/session';
import { getCustomerByEmail } from '@/lib/ct/auth';

export async function POST(req: NextRequest) {
  const { csrId, csrEmail, csrFirstName, csrLastName, impersonatedEmail } = await req.json();

  if (!csrId || !impersonatedEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let customer;
  try {
    customer = await getCustomerByEmail(impersonatedEmail);
  } catch {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const token = await createSessionToken({
    // Impersonated customer fills the standard fields
    customerId: customer.id,
    customerEmail: customer.email,
    customerFirstName: customer.firstName ?? '',
    customerLastName: customer.lastName ?? '',
    // CSR identity stored separately
    csrId,
    csrEmail,
    csrFirstName,
    csrLastName,
  });

  const resp = NextResponse.json({
    success: true,
    customer: { id: customer.id, email: customer.email },
  });
  setSessionCookie(resp, token);
  return resp;
}
```

### `app/api/auth/superuser/route.ts` — read CSR session state

```typescript
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.csrId) return NextResponse.json({ csr: null });
  return NextResponse.json({
    csr: {
      id: session.csrId,
      email: session.csrEmail,
      firstName: session.csrFirstName,
      lastName: session.csrLastName,
    },
  });
}
```

### `app/api/cart/items/[itemId]/price/route.ts` — price override

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getCart, changeLineItemPrice } from '@/lib/ct/cart';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await getSession();
  if (!session.csrId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { itemId } = await params;
  const { centAmount, currencyCode } = await req.json();

  if (typeof centAmount !== 'number' || !currencyCode) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
  }

  const cart = await getCart(session.cartId!);
  const updated = await changeLineItemPrice(cart.id, cart.version, itemId, centAmount, currencyCode);
  return NextResponse.json({ cart: updated });
}
```

---

## Step 5 — SuperUser context

`site/context/SuperUserContext.tsx` — global CSR state available to all client components.

```typescript
'use client';

import { createContext, useContext, ReactNode } from 'react';
import useSWR from 'swr';

export interface CsrUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface SuperUserContextValue {
  csr: CsrUser | null;
  isLoading: boolean;
}

const SuperUserContext = createContext<SuperUserContextValue>({ csr: null, isLoading: true });

async function csrFetcher(): Promise<CsrUser | null> {
  const res = await fetch('/api/auth/superuser');
  if (!res.ok) return null;
  const data = await res.json();
  return data.csr ?? null;
}

export function SuperUserProvider({ children }: { children: ReactNode }) {
  const { data: csr = null, isLoading } = useSWR<CsrUser | null>('superuser', csrFetcher, {
    revalidateOnFocus: false,
  });
  return (
    <SuperUserContext.Provider value={{ csr, isLoading }}>
      {children}
    </SuperUserContext.Provider>
  );
}

export function useSuperUser() {
  return useContext(SuperUserContext);
}
```

Add `<SuperUserProvider>` to `app/[locale]/layout.tsx` (wrapping or alongside existing providers).

---

## Step 6 — Login form (two-step UI)

The login form (`app/[locale]/login/page.tsx`) needs to handle the `requiresCsrEmail` response from step 1.

```typescript
const [csrPending, setCsrPending] = useState<{
  csrId: string; csrEmail: string; csrFirstName: string; csrLastName: string;
} | null>(null);
const [impersonatedEmail, setImpersonatedEmail] = useState('');

async function handleLogin(e: React.FormEvent) {
  e.preventDefault();
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();

  if (data.requiresCsrEmail) {
    // Switch to step 2 — keep the CSR data in state
    setCsrPending({ csrId: data.csrId, csrEmail: data.csrEmail,
                    csrFirstName: data.csrFirstName, csrLastName: data.csrLastName });
    return;
  }
  // Normal login success / error handling ...
}

async function handleCsrImpersonate(e: React.FormEvent) {
  e.preventDefault();
  const res = await fetch('/api/auth/csr-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...csrPending, impersonatedEmail }),
  });
  if (res.ok) router.push('/');
  else setError('Customer not found');
}
```

When `csrPending` is set, render the second form:

```tsx
{csrPending ? (
  <form onSubmit={handleCsrImpersonate} className="space-y-4">
    <p className="text-sm text-charcoal-light">
      Signed in as <strong>{csrPending.csrFirstName} {csrPending.csrLastName}</strong> (CSR).
      Enter the customer email to impersonate.
    </p>
    <Input
      label="Customer email"
      type="email"
      value={impersonatedEmail}
      onChange={e => setImpersonatedEmail(e.target.value)}
      required
    />
    <Button type="submit">Impersonate Customer</Button>
  </form>
) : (
  /* normal login form */
)}
```

---

## Step 7 — CSR banner in Header

`site/components/layout/Header.tsx` — read `useSuperUser()` and render the yellow banner between the charcoal top bar and the main header bar.

```tsx
import { useSuperUser } from '@/context/SuperUserContext';

// Inside Header component:
const { csr } = useSuperUser();

// In the JSX, above the main header div:
{csr && (
  <div className="bg-yellow-400 text-yellow-900 text-xs font-medium py-1.5 px-4 text-center">
    CSR mode — acting as customer on behalf of {csr.firstName} {csr.lastName} ({csr.email})
  </div>
)}
```

---

## Step 8 — Cart line item price override

### Hook mutation — `hooks/useCartSWR.ts`

Add `changeItemPrice` to `useCartMutations`:

```typescript
async function changeItemPrice(lineItemId: string, centAmount: number, currencyCode: string) {
  const resp = await fetch(`/api/cart/items/${lineItemId}/price`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ centAmount, currencyCode }),
  });
  if (!resp.ok) throw new Error('Failed to update price');
  const data = await resp.json();
  mutate(KEY_CART, data.cart, { revalidate: false });
}
```

### `PriceOverrideInput` component — create in `components/ui/`

This is a generic editable price input; it has no domain knowledge beyond a number.

```typescript
// site/components/ui/PriceOverrideInput.tsx
'use client';

import { useState } from 'react';
import Button from './Button';

interface PriceOverrideInputProps {
  centAmount: number;
  currencyCode: string;
  onApply: (centAmount: number) => Promise<void>;
}

export default function PriceOverrideInput({ centAmount, currencyCode, onApply }: PriceOverrideInputProps) {
  const [raw, setRaw] = useState((centAmount / 100).toFixed(2));
  const [loading, setLoading] = useState(false);
  const isDirty = parseFloat(raw) * 100 !== centAmount;

  async function handleApply() {
    const cents = Math.round(parseFloat(raw) * 100);
    if (isNaN(cents) || cents < 0) return;
    setLoading(true);
    try { await onApply(cents); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-charcoal-light">{currencyCode}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={raw}
        onChange={e => setRaw(e.target.value)}
        className="w-24 border border-yellow-400 rounded-sm px-2 py-1 text-sm text-charcoal focus:outline-none focus:border-yellow-600"
      />
      <Button
        size="sm"
        variant="secondary"
        disabled={!isDirty || loading}
        isLoading={loading}
        onClick={handleApply}
      >
        Apply
      </Button>
    </div>
  );
}
```

### Usage in cart line item

```tsx
import { useSuperUser } from '@/context/SuperUserContext';
import PriceOverrideInput from '@/components/ui/PriceOverrideInput';
import { useCartMutations } from '@/hooks/useCartSWR';

const { csr } = useSuperUser();
const { changeItemPrice } = useCartMutations();

// In the price display area of each line item:
{csr ? (
  <PriceOverrideInput
    centAmount={item.price.value.centAmount}
    currencyCode={item.price.value.currencyCode}
    onApply={(cents) => changeItemPrice(item.id, cents, item.price.value.currencyCode)}
  />
) : (
  <span>{formatMoney(item.price.value.centAmount, item.price.value.currencyCode)}</span>
)}
```

---

## Checklist

- [ ] `CSR_GROUP_ID` env var added to `site/.env`
- [ ] `Session` interface extended with `csr*` fields in `lib/session.ts`
- [ ] `getCustomerByEmail` added to `lib/ct/auth.ts`
- [ ] `changeLineItemPrice` added to `lib/ct/cart.ts`
- [ ] `POST /api/auth/login` detects CSR group and returns `requiresCsrEmail: true`
- [ ] `POST /api/auth/csr-login` creates dual session
- [ ] `GET /api/auth/superuser` exposes CSR session state
- [ ] `PUT /api/cart/items/[itemId]/price` accepts CSR price override
- [ ] `SuperUserProvider` + `useSuperUser` hook in `context/SuperUserContext.tsx`
- [ ] `<SuperUserProvider>` added to `app/[locale]/layout.tsx`
- [ ] Login form handles two-step CSR flow
- [ ] Yellow CSR banner rendered in `Header.tsx`
- [ ] `PriceOverrideInput` created in `components/ui/`
- [ ] `changeItemPrice` mutation added to `useCartMutations` in `hooks/useCartSWR.ts`
- [ ] Cart line item conditionally renders `PriceOverrideInput` when `csr` is set

---

## Security notes

- The price override endpoint (`PUT /api/cart/items/[itemId]/price`) checks `session.csrId` and returns 403 if not present. Normal customers can never call it successfully.
- The `CSR_GROUP_ID` is read only on the server — it is never exposed to the browser.
- CSR group membership is verified by CT on login, not asserted by the client.
- Impersonation ends when the CSR logs out; the session cookie is cleared normally via `POST /api/auth/logout`.
