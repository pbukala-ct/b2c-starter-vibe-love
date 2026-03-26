## 1. CT Setup — Order Attribution Custom Type

- [x] 1.1 Create `tools/setup-agent-order-type.mjs` — idempotent script that creates the `agent-order-attribution` CT custom type with fields `agentId` (String, required: false), `agentEmail` (String), `agentName` (String), assigned to resource type `order`
- [ ] 1.2 Run the script against the CT project and confirm the custom type is created (`tools/` pattern: reads `tools/.env`, uses `ct-admin.mjs`)
- [ ] 1.3 Verify `POST /carts` with an explicit `customerId` field succeeds using the storefront CT client credentials — if it returns 403, document required scope expansion before proceeding

## 2. Cart Creation API Route

- [x] 2.1 Create `site/app/api/agent/customers/[customerId]/cart/route.ts` with a `POST` handler:
  - Validate agent session; require `order-placement` role; require `session.activeCustomerId === customerId`
  - Fetch active carts for customer; if one exists return `409 Conflict` with the existing cart
  - Call CT `POST /carts` with `customerId`, `customerEmail`, `currency` (from store config), `shippingMode: "Single"`
  - Write audit entry `actionType: "cart.created"`, `outcome: "success"` with `cartId`
  - On CT error: write audit entry `actionType: "cart.created"`, `outcome: "failure"` with error detail; return 502
  - Return the new cart (shaped to match the `initialCart` type expected by `CustomerDetailClient`)
- [x] 2.2 Fetch the customer's email from CT before cart creation (needed for the `customerEmail` field on the cart)

## 3. Cart Creation UI

- [x] 3.1 Update `site/components/agent/CustomerDetailClient.tsx` — in the no-cart empty state, add a "Create cart" button visible only when `agentRole === "order-placement"`
- [x] 3.2 Add `useState` for `isCreating` and `createError`; on click, `POST /api/agent/customers/[customerId]/cart`, set loading state, handle 409 (refresh cart view), handle errors (display message)
- [x] 3.3 On success, update local cart state so the UI transitions from empty state to the cart view without a full page reload
- [x] 3.4 Hide the "Create cart" button once a cart exists (including after creation)

## 4. Case-Insensitive Customer Name Search

- [x] 4.1 Update `site/app/api/agent/customers/lookup/route.ts` — when `name` query param is present, build CT `where` predicate using `ilike` on `firstName` and `lastName`:
  ```
  firstName ilike "%<name>%" or lastName ilike "%<name>%"
  ```
  Trim and escape input server-side; limit results to 10
- [x] 4.2 Add a minimum 2-character guard: return empty results immediately if `name.length < 2`
- [x] 4.3 If CT returns an error indicating `ilike` is unsupported, fall back to two separate queries (original casing + `.toLowerCase()`) and deduplicate results by `id`
- [x] 4.4 Verify existing `email`, `customerId`, and `orderId` search modes are unaffected

## 5. Order Attribution — Checkout Route

- [x] 5.1 Update `site/app/api/agent/customers/[customerId]/checkout/route.ts` — after the CT order is created, issue a CT order update with two actions:
  - `setCustomType`: `{ type: { key: "agent-order-attribution" }, fields: {} }`
  - `setCustomField` × 3: `agentId`, `agentEmail`, `agentName` from the agent session
- [x] 5.2 Wrap the attribution update in a try/catch — if it fails, log the error but do NOT block or roll back the order; the checkout response still returns success
- [x] 5.3 Add an audit log entry field `orderId` to the existing `order.placed` audit entry so attribution can be cross-referenced

## 6. Attribution Badge Component

- [x] 6.1 Create `site/components/agent/AgentOrderBadge.tsx` — a small badge component that renders "Placed by CS Agent" with an icon; accepts no props (static); includes `role="status"` and `aria-label="This order was placed by a Customer Service agent on your behalf"` for accessibility; uses colour + text (not colour alone)
- [x] 6.2 Style with Tailwind: indigo/blue tones, small text, pill shape — consistent with the existing badge patterns in the codebase

## 7. Attribution Badge — Order List

- [x] 7.1 Locate the order list component in `site/app/[locale]/account/orders/` (or equivalent path)
- [x] 7.2 Update the CT order fetch to include `expand` or ensure `custom.fields` is returned in the orders API response
- [x] 7.3 Render `<AgentOrderBadge />` on each order card where `order.custom?.fields?.agentId` is truthy

## 8. Attribution Badge — Order Detail

- [x] 8.1 Locate the order detail component/page
- [x] 8.2 Ensure `custom.fields` is present in the order detail API response
- [x] 8.3 Render `<AgentOrderBadge />` on the order detail page where `order.custom?.fields?.agentId` is truthy

## 9. FEATURES.md and test.txt Updates

- [x] 9.1 Update `FEATURES.md` — add `agent-cart-create` capability; update `agent-customer-lookup` to reflect case-insensitive partial name search; update `agent-checkout` to note order attribution; add customer-facing attribution badge to the storefront My Account section
- [x] 9.2 Update `test.txt` — add manual test steps for: (a) create cart button appears when no cart exists, (b) create cart creates a usable cart, (c) name search returns results for lowercase input and partial names, (d) agent-placed order shows badge in My Account order list, (e) agent-placed order shows badge in order detail, (f) self-placed order shows no badge
