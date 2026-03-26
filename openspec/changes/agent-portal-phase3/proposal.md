## Why

The agent portal cannot complete its core promise: assisted checkout for any customer, any time. Agents hit a hard stop when a customer has no active cart — the most common scenario for new shoppers and returning customers who last checked out. Beyond cart creation, agents lose time to case-sensitive search failures and cannot trace which orders they placed because no attribution data exists on the order. Customers have disputed agent-placed orders as unrecognised, eroding trust in a feature designed to build it.

All three pain points are confirmed by real agent and customer complaints, not hypothetical concerns.

## What Changes

- **Cart creation for customers with no active cart**: A "Create cart" button appears on the customer detail page when `initialCart === null`. Clicking it calls a new BFF route `POST /api/agent/customers/[id]/cart`, creates an empty Active CT cart owned by the customer, writes an audit log entry, and refreshes the cart view. Role-gated to `order-placement`.
- **Case-insensitive and partial name search**: The existing customer lookup route gains `ilike`-style predicate support. Name search normalises input and returns partial matches (minimum 2 characters, 300 ms debounce). The existing search tabs are unchanged.
- **CT custom type for order attribution**: A new CT custom type `agent-order-attribution` is created via a setup script in `tools/`. The type adds `agentId`, `agentEmail`, and `agentName` fields to the Order resource. The agent checkout route attaches these fields at order placement time.
- **Attribution badge in My Account > Orders**: Order list cards and order detail pages in the customer-facing storefront show a "Placed by CS Agent" badge when the `agentAttribution` custom field is present. Self-placed orders show nothing.
- **Audit log for cart creation**: Every `POST /api/agent/customers/[id]/cart` call — success or failure — writes to the `agent-audit-log` CT Custom Object with `actionType: "cart.created"`.

## Capabilities

### New Capabilities

- `agent-cart-create`: Agent can create a new Active cart for a customer who has no current Active cart; role-gated to `order-placement`; audited.

### Modified Capabilities

- `agent-customer-lookup`: Name search gains case-insensitive partial matching via CT `ilike` predicate; minimum 2 characters; returns up to 10 results.
- `agent-checkout`: Checkout route modified to attach `agentAttribution` custom fields to the CT order at placement time.
- `agent-cart-view`: Customer detail page shows "Create cart" button in the empty-cart state.

## Impact

- **`tools/setup-agent-order-type.mjs`** — new script to create the `agent-order-attribution` CT custom type and add it to the Order resource.
- **`site/app/api/agent/customers/[customerId]/cart/route.ts`** (new) — `POST` handler: creates Active cart for customer, writes audit entry, returns new cart.
- **`site/app/api/agent/customers/lookup/route.ts`** — extend `name` search to use CT `where` with `ilike` (or `"` + `"` normalised lowercase) instead of exact match.
- **`site/components/agent/CustomerDetailClient.tsx`** — add "Create cart" button + loading/error states in the no-cart empty state; refresh cart view on success.
- **`site/app/api/agent/customers/[customerId]/checkout/route.ts`** — after order is placed, attach `agentAttribution` custom fields using CT Order update or during the `createOrder` call.
- **`site/app/[locale]/account/orders/page.tsx`** and order detail page — read `custom.fields.agentAttribution` from order and conditionally render attribution badge component.
- New `AgentOrderBadge` UI component in `site/components/agent/`.
- No new CT infrastructure beyond the custom type and the new API route.
