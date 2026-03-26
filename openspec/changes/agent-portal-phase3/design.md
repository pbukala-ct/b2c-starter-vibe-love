## Context

The agent portal (Phase 1+2 + UX fixes) shipped with: session-scoped customer lookup, cart view, line item editing, address book management, and agent-initiated checkout. Three gaps remain:

1. When a customer has no Active cart, the portal shows an empty state with no action — agents cannot start an assisted purchase.
2. Customer name search is case-sensitive exact-match; typing `johnson` returns nothing for a customer named `Johnson`.
3. Orders placed by agents are indistinguishable from self-placed orders in `My Account > Orders` — customers dispute them as unrecognised.

Current state:
- `CustomerDetailClient.tsx` renders a static "No active cart" message when `initialCart === null`.
- `GET /api/agent/customers/lookup` name search uses a strict CT `where` predicate; no `ilike`.
- `POST /api/agent/customers/[id]/checkout/route.ts` creates the CT order but attaches no agent metadata.
- No CT custom type exists for order attribution.

## Goals / Non-Goals

**Goals:**
- Allow agents with `order-placement` role to create a new cart for a customer who has none.
- Make customer name search case-insensitive with partial-match support (min 2 chars).
- Tag every agent-placed order with agent identity fields via a CT custom type.
- Surface a "Placed by CS Agent" badge on agent-attributed orders in the customer's My Account.
- Write an audit log entry for every cart creation attempt (success and failure).

**Non-Goals:**
- Pre-populating the new cart with line items at creation time (agents use the existing add-line-item UI after creation).
- Fuzzy / combined single-field search across all customer fields simultaneously.
- Agent-initiated returns, refunds, or order cancellations.
- Customer email notification of agent-placed orders.
- Deleting carts.

## Decisions

### 1. Cart creation goes through a new BFF route; no direct CT client call from UI

**Decision**: `POST /api/agent/customers/[customerId]/cart` is a new Next.js API route. It verifies the agent session, confirms `order-placement` role, checks no Active cart already exists (guard against double-create), creates the cart in CT with `customerId` + `customerEmail`, writes the audit log, and returns the new cart.

**Alternative considered**: Create the cart from a Server Component and redirect. Rejected — the customer detail page is a client component; a REST route is the existing pattern for all agent mutations.

**Rationale**: Consistent with all other agent API routes. Role check and audit log happen server-side, not client-side.

### 2. Guard against double-create: check for existing cart before creating

**Decision**: Before calling `POST /carts` in CT, the route fetches active carts for the customer (`where: customerId="..." and cartState="Active"`). If one exists it returns 409 Conflict so the UI can refresh rather than create a duplicate.

**Rationale**: The "Create cart" button is only shown when `initialCart === null` (server-rendered), but a race condition is possible if the agent double-clicks or the page is open in two tabs.

### 3. Case-insensitive search: CT `ilike` predicate with lowercase normalisation fallback

**Decision**: The `name` search param in `GET /api/agent/customers/lookup` builds the CT `where` predicate using `ilike` on both `firstName` and `lastName`:
```
where=firstName ilike "%johnson%" or lastName ilike "%johnson%"
```
Input is trimmed and lowercased server-side before query construction. If CT does not support `ilike` on the environment (sandbox difference), the fallback is to pass the original casing and add a second query with `.toLowerCase()` — then deduplicate results.

**Alternative considered**: Store a normalised lowercase name in a CT custom field with a migration script. Rejected — requires a one-time migration across all customer records and ongoing sync; `ilike` has zero migration cost.

**Risk**: CT `ilike` on name fields may not be available on older CT projects. The fallback covers this.

### 4. CT custom type for order attribution: created via tools/ setup script

**Decision**: A new script `tools/setup-agent-order-type.mjs` creates the custom type `agent-order-attribution` with fields `agentId` (String), `agentEmail` (String), `agentName` (String). The type is assigned to the `order` resource type identifier. The script is idempotent (skip if type already exists).

**Alternative considered**: Create the type manually in Merchant Center. Rejected — not reproducible, not version-controlled, breaks on new environment setup.

**Risk (R-003)**: If the custom type does not exist at the time of the first agent checkout, the order update will fail. Mitigation: the checkout route catches the error, logs it, and proceeds without attribution rather than blocking the checkout. A pre-flight check logs a warning on startup.

### 5. Attribution attached at order creation time via CT Order setCustomType + setCustomField

**Decision**: After `POST /orders` (from cart), the checkout route immediately calls `POST /orders/[orderId]` with two update actions: `setCustomType` (using the `agent-order-attribution` key) and `setCustomField` for each of the three fields. This is a separate CT call after order creation.

**Alternative considered**: Pass custom fields in the cart before order creation so they are inherited. CT does not copy cart custom fields to the order automatically; a separate order update is required regardless.

**Rationale**: Keeps the order creation call clean; attribution is non-blocking — if the update fails the order still exists.

### 6. Attribution badge: new shared component, rendered conditionally

**Decision**: A new `AgentOrderBadge` component in `site/components/agent/` renders a small label "Placed by CS Agent" using a distinct but non-alarming style (blue/indigo tones, small text). It is conditionally rendered wherever `order.custom?.fields?.agentId` is truthy. Added to the order list card and the order detail page.

**Alternative considered**: Inline conditional rendering in each order component without a shared component. Rejected — badge will appear in at least two places; a shared component ensures consistency.

**Accessibility**: Badge uses text + icon, not colour alone. `aria-label` on the badge element.

## Risks / Trade-offs

- **R-001 — CT cart creation permission**: The storefront API client may not have permission to create carts with an explicit `customerId`. Test on day 1; fallback is a dedicated agent CT client with `manage_orders` scope.
- **R-002 — CT `ilike` not supported**: Some CT project configurations may not support `ilike` on customer name fields. Fallback: normalise case client-side and issue two queries. Acceptable latency overhead for a search interaction.
- **R-003 — Custom type missing at first agent checkout**: Non-blocking by design — checkout succeeds, attribution is skipped, error is logged. Better than blocking a checkout over metadata.
- **R-004 — Badge copy ambiguity**: "Placed by CS Agent" may confuse customers unfamiliar with the term. Mitigation: use full copy "Placed by a Customer Service agent on your behalf" if space allows; keep it short on the order list card.

## Migration Plan

1. Run `tools/setup-agent-order-type.mjs` in the CT environment before deploying the storefront changes.
2. Deploy storefront: new cart creation route, updated search route, updated checkout route, badge component, order list/detail UI changes.
3. No database migration. No changes to existing order records (badge only appears on orders placed after deploy).
4. Rollback: revert Next.js deployment. Attribution custom type remains in CT but causes no harm if the checkout route no longer writes to it. Badge component is simply not rendered.

## Open Questions

- **OQ-001**: Does the storefront CT client scope support `POST /carts` with an explicit `customerId`? → Must be verified on day 1. If not, a new `manage_orders`-scoped CT API client must be created and its credentials added to `site/.env` and Netlify env vars.
- **OQ-002**: Does CT support `ilike` on `firstName`/`lastName` in the customers `where` predicate on this project? → Verify in sandbox before building UI.
- **OQ-003**: GDPR: does right-to-erasure apply to `agentEmail` stored in CT order custom fields? → Flag to stakeholder before Phase 3 launch.
- **OQ-005**: Final copy for the attribution badge. Options: "Placed by CS Agent" / "Agent-assisted order" / "Placed on your behalf by Customer Support". → Decide before UI build.
