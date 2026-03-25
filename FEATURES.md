# Features

Comprehensive inventory of implemented storefront features. This file is the source of truth for what exists in the codebase — keep it updated when adding or removing features.

## Search & Discovery

- Full-text product search via commercetools Product Search API
- Category browsing with nested 3-level hierarchy
- Mega menu with full category tree
- Faceted filtering (color, finish, sort)
- Paginated results (24 items per page)

## Product Detail Pages

- Variant selection (color, size, specifications)
- Image gallery with thumbnail strip
- Breadcrumb navigation (Home > Category > Product)
- Subscribe & Save option (see below)
- Free shipping threshold display (orders over $500)

## Subscribe & Save

- One-time vs. subscription toggle on eligible products
- Multiple recurrence frequencies (Weekly, Bi-weekly, Monthly)
- Savings percentage displayed vs. one-time price
- Subscription data captured natively in commercetools cart (no custom fields)
- Subscription items visually distinguished in cart and checkout

## Cart

- Mini-cart flyout on add-to-cart (auto-hides after 4 seconds)
- Full cart page with quantity editing and item removal
- Subscription items labeled with recurrence interval
- Order summary with subtotal, estimated tax, and shipping

## Checkout

- Guest checkout (no account required)
- Logged-in checkout with saved address pre-fill
- Shipping address form with country/state/postal code
- Shipping method selection with pricing
- Credit card payment form with auto-fill test card button (4242 4242 4242 4242)
- Order confirmation page with subscription setup notification

## Split Shipments

- "Ship to multiple addresses" toggle at checkout
- Add multiple shipping addresses per order
- Assign line item quantities across different addresses
- Order detail displays items grouped by shipment

## My Account — Profile

- Edit first name, last name, and email
- Success/error feedback on save

## My Account — Orders

- Order list with status badges (Processing, Confirmed, Delivered, Cancelled)
- Order detail with line items, shipping/billing addresses, and price breakdowns
- Subscription and split shipment indicators on order detail

## My Account — Subscriptions

- List all recurring orders with status (Active, Paused, Cancelled)
- Schedule display (Weekly, Bi-weekly, Monthly)
- Next order date
- Pause, resume, and cancel actions
- Skip next order
- Change delivery schedule

## My Account — Addresses

- List, add, edit, and delete saved addresses
- Default shipping and default billing toggles (independent)
- Optional address nickname
- Localized address format (US vs. EU street/number)

## My Account — Payment Methods

- List saved cards with brand detection (Visa, Mastercard, Amex, Discover)
- Add and remove cards (last 4 digits stored, demo tokenization)
- Set default payment method

## Internationalization

- Country selector in header with flag emoji (US, GB, DE)
- Currency switching (USD, GBP, EUR)
- Locale-aware product and category names
- Localized money formatting
- Country preference persisted in cookie

## Authentication & Sessions

- JWT-based sessions using `jose`, stored in HTTP-only cookie
- Login with email and password
- Registration with name, email, and password
- Test credential button (jen@example.com / 123)
- Logout clears cart reference from session
- Anonymous cart merged to customer on login
- Post-auth redirect support

## API Routes (BFF)

All commercetools calls go through server-side Next.js API routes. The browser never contacts commercetools directly.

| Route | Methods | Purpose |
|---|---|---|
| `/api/auth/login` | POST | Sign in |
| `/api/auth/register` | POST | Create account |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/me` | GET | Current user |
| `/api/cart` | GET, POST | Get or create cart |
| `/api/cart/items` | POST | Add item |
| `/api/cart/items/[itemId]` | PUT, DELETE | Update quantity, remove item |
| `/api/checkout` | POST | Place order |
| `/api/account/profile` | GET, PUT | View/edit profile |
| `/api/account/orders` | GET | List orders |
| `/api/account/orders/[orderId]` | GET | Order detail |
| `/api/account/subscriptions` | GET | List subscriptions |
| `/api/account/subscriptions/[id]` | PUT | Pause/resume/cancel/skip/reschedule |
| `/api/account/addresses` | GET, POST, PUT, DELETE, PATCH | Address CRUD + set defaults |
| `/api/account/payments` | GET, POST, DELETE, PATCH | Payment method CRUD + set default |
| `/api/countries` | GET | Available countries |
| `/api/shipping-methods` | GET | Shipping options |
| `/api/recurrence-policies` | GET | Subscription frequencies |

## Agent Portal (CS Agent Impersonation) — Phase 1 + Phase 2

A protected area of the storefront (`/agent`) accessible only to authenticated CS agents. Phase 1 is read-only: agents can look up customers and view their active cart. Write operations (cart edit, checkout) are Phase 2.

### Authentication
- Dedicated login at `/agent/login` (separate from customer login)
- Agents sign in with email + password; credentials stored in CT Custom Objects (`agent-credentials`)
- Passwords hashed with scrypt (Node.js built-in) for existing accounts; new accounts created via MC App use bcrypt (`bcrypt:<hash>` prefix) — both formats accepted transparently by the login route
- JWT sessions signed with `AGENT_SESSION_SECRET` (distinct from `SESSION_SECRET`), stored in `agent-session` HTTP-only cookie
- 30-minute inactivity timeout; automatic logout when timer reaches zero
- Roles: `read-only` (view only) or `order-placement` (can edit cart + checkout)
- All `/api/agent/*` routes require a valid agent session (return 401 otherwise)
- Agent nav bar shows the active customer's full name (not raw ID) and a live MM:SS countdown to session expiry; warning style applied when under 5 minutes remain

### Customer Lookup
- Agents can search by email address, commercetools customer ID, order number, or by name (first/last name partial match)
- Name search returns up to 10 matching customers in a dropdown; agent selects one to start a session
- Name search debounces 300 ms, requires minimum 2 characters
- Exact-match search (email/customerId/orderId) returns: customer name, email, account status, open order count
- Agents can start a customer session (scopes the agent JWT to one customer at a time)
- Agents must explicitly end a customer session before looking up a different customer

### Active Cart View
- Agent can view the customer's active cart: line items, SKU, name, quantity, unit price, totals
- Applied discount codes and shipping address displayed
- Staleness warning shown if cart was last modified more than 24 hours ago
- "No active cart" state handled

### Audit Log
- Every agent action (login, logout, customer lookup, cart view, session start/end) produces an immutable audit log entry in CT Custom Objects (`agent-audit-log`)
- Entries contain: agentId, agentEmail, customerId, sessionId, actionType, actionDetail, timestamp, outcome
- Compliance query endpoint: `GET /api/agent/audit?customerId=<id>&dateFrom=<iso>&dateTo=<iso>`

### Cart Edit (Phase 2)
- Add items by SKU (stock validation by CT), remove items, update quantity (quantity 0 removes item)
- Apply and remove discount codes
- Update shipping address on cart (field-level validation, required fields enforced)
- All write operations require `order-placement` role
- After each successful cart mutation, the agent portal broadcasts a `cart-updated` event via the browser `BroadcastChannel('cart-updates')` API; the customer-facing mini cart subscribes and calls `refreshCart()` instantly (same-browser real-time sync)
- `visibilitychange` fallback: the mini cart also re-fetches the cart whenever the storefront tab regains focus, covering cross-machine scenarios

### Customer Address Book (Phase 2)
- Agents can view all saved addresses on the customer detail page
- Agents with `order-placement` role can add new addresses (POST) and edit existing addresses (PUT)
- Address changes write to `customer.addresses` in CT via `addAddress` and `changeAddress` actions
- All address book actions are audit-logged with `customer.address-book.*` action types

### Agent-Initiated Checkout (Phase 2)
- Confirmation modal shows full order summary (items, total) before submission
- Address picker in modal lists customer's saved addresses as radio options; pre-selects one matching the cart shipping address if available
- If a different address is selected, the cart shipping address is updated before order submission
- If the customer has no saved addresses and no cart shipping address, the agent is prompted to add one
- Places order using existing CT cart checkout flow
- Order confirmation email sent to customer with agent-assisted attribution
- Payment failure surfaces failure reason to agent; cart left intact
- `confirmationToken: "confirmed"` guard prevents accidental checkout

### Agent API Routes

| Route | Methods | Purpose |
|---|---|---|
| `/api/agent/auth/login` | POST | Agent login; issues `agent-session` cookie |
| `/api/agent/auth/logout` | POST | Agent logout; clears cookie + writes audit entry |
| `/api/agent/session` | PATCH | Set/clear `activeCustomerId` in agent JWT |
| `/api/agent/customers/lookup` | GET | Search customer by email, customerId, orderId, or name (partial match) |
| `/api/agent/customers/[customerId]/cart` | GET | View customer's active cart |
| `/api/agent/customers/[customerId]/cart/items` | POST, DELETE, PATCH | Add/remove/update cart line items |
| `/api/agent/customers/[customerId]/cart/discounts` | POST, DELETE | Apply/remove discount codes |
| `/api/agent/customers/[customerId]/cart/address` | PUT | Update shipping address on cart |
| `/api/agent/customers/[customerId]/addresses` | GET, POST | View and add customer addresses |
| `/api/agent/customers/[customerId]/addresses/[addressId]` | PUT | Update a customer address |
| `/api/agent/customers/[customerId]/checkout` | POST | Place order on behalf of customer |
| `/api/agent/audit` | GET | Compliance audit log query |

### Setup
- Provision agent accounts: `node tools/setup-agent-credentials.mjs` (edit `AGENTS` array, requires `tools/.env`)
- Required env var: `AGENT_SESSION_SECRET` in `site/.env` (see CLAUDE.md)

## Admin Tools

Scripts in `tools/` for commercetools project setup and exploration. All use `tools/.env` (admin scope).

| Script | Purpose |
|---|---|
| `ct-admin.mjs` | Shared CT client with auth |
| `explore-catalog.mjs` | Browse product catalog |
| `explore-more.mjs` | Extended catalog exploration |
| `explore-recurring.mjs` | Inspect recurring order data |
| `setup-subscriptions.mjs` | Configure recurrence policies |
| `get-attribute-values.mjs` | List product attribute values |
| `test-search*.mjs` | Various Product Search API tests |
| `setup-agent-credentials.mjs` | Provision CS agent accounts in CT Custom Objects |
