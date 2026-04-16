# Features

Comprehensive inventory of implemented storefront features. This file is the source of truth for what exists in the codebase — keep it updated when adding or removing features.

## Design & Theme — Vibe Love

- Premium home accessories brand aesthetic: warm cream/espresso/dusty-rose palette, clean corners
- **Heading font**: Playfair Display (weights 400, 700) loaded via `next/font/google`; applied to all `h1`, `h2`, `h3` via `--font-heading` CSS variable; Inter used for body text
- All theme tokens defined in `@theme` block in `site/app/globals.css` (Tailwind CSS v4 — no `tailwind.config.ts`)
- Color tokens: `cream` (#faf7f4 warm white), `cream-dark` (#f0ebe3), `charcoal` (#2c1a10 warm espresso), `charcoal-light` (#6b4e3d), `terra` (#b5768a dusty rose accent), `terra-dark` (#9a5f74), `sage` (#7d9b7a green accent), `border` (#e5e0d8), `border-dark` (#d0c8bc)
- **Header top bar**: dusty rose (`bg-terra`) with "Curated home accessories — crafted with love" tagline
- **Header and nav dropdowns**: warm cream background (`bg-cream`) instead of white; MegaMenu, CountrySelector, SearchBar, mobile panel all use cream
- **Footer**: warm espresso brown from `charcoal` token (`#2c1a10`)
- Brand name "Vibe Love" displayed in header logo and footer; page title template `%s | Vibe Love`
- Homepage hero: "The Art of Home" / "Love Every Corner of Home" with Aria Rug background image

## Multi-Brand / CT Store Scoping

- `NEXT_PUBLIC_CTP_STORE_KEY` env var in `site/.env` sets the CT store context for all API calls
- When set, all product search, cart, and order operations are automatically scoped to that store via `inStoreKeyWithStoreKeyValue()` on the CT SDK builder
- Implementation: `scopedRoot` exported from `site/lib/ct/client.ts` — store-scoped root (or base root when env var is unset); used in `cart.ts` (all cart/order ops) and `search.ts` (product search/PDP)
- Non-store-scoped operations intentionally kept on base `apiRoot`: `getShippingMethods`, `createPayment`, `categories`, `recurringOrders`
- Currently configured for `home-accessories-store` — products scoped to that store's Product Selection, prices to its price channel, inventory to its inventory channel
- **Category filtering**: `getStoreScopedCategories(locale, currency, country)` in `categories.ts` fetches the full tree then filters to only categories that have products in the store-scoped search; used in `app/layout.tsx` (Header/MegaMenu) and `lib/layout.ts` (homepage category section); falls back to full tree when no store key is set
- To redeploy for a different CT store: change `NEXT_PUBLIC_CTP_STORE_KEY` in `site/.env` and redeploy (no code changes required)

## Search & Discovery

- Full-text product search via commercetools Product Search API
- Category browsing with nested 3-level hierarchy
- Mega menu with full category tree
- Dynamic faceted filtering driven by commercetools Product Search facets API
- Facet definitions auto-fetched from product type attributes (60s module-level cache), filtered by `FACET_BLOCKLIST` and extended with `getExtraFacets(t)` in `facet-config.ts`
- Per-facet render config in `FACET_RENDERER_MAP`: `'color'` (swatches), `'pill'` (pills with counts), `'toggle'` (boolean on/off), or `'range'` (formatted money range pills); defaults to `'pill'` for unmapped facets
- Boolean facets auto-detected (all bucket keys `'true'`/`'false'`) and rendered as toggle switches via `ToggleFacet`
- Money/range facets auto-detected via `attributeType === 'money'` and rendered as formatted price range pills via `MoneyRangeFacet`; bucket keys (e.g. `*-10000.0`) formatted as human-readable labels (e.g. `< $100`)
- Configurable price range facet in `getExtraFacets` with custom `ranges` array (e.g. `[{to:10000},{from:10000,to:20000},{from:20000}]`)
- Range filter applied server-side via CT `SearchLongRangeExpression` (`gte`/`lt` fields); attributeId resolved by direct match before falling back to `variants.attributes.` prefix
- Color facet (`search-color`) and finish facet (`search-finish`) rendered as swatches via `ColorFacet`
- Color swatch labels resolved from CT localized enum (`attributeValues`) — no next-intl translations for color names
- Extra facets (e.g. price) labeled via `next-intl` `search.price` key (all three locales)
- Facet section headers resolved from CT product type `attributeLabel` (localized); falls back to derived label for unmapped facets
- Facet filters passed as generic `facetFilters: Record<string, string>` — URL param keys mapped server-side to CT attribute fields/types via `buildFacetFilterQueryParts`; CT field names never exposed in URLs
- Sort options: Relevance, Newest, Price Low→High, Price High→Low, Name A–Z
- Sort and filter state encoded in URL query params for shareable/bookmarkable URLs
- Sort field aliases (`price`, `name`, `score`) mapped to commercetools internals server-side
- Category pages default to `categoryOrderHints` sort (Merchant Center ordering) with graceful fallback to `createdAt:desc` on missing index data
- Sort labels localized via `next-intl` (all three locales)
- Paginated results (24 items per page)

## Product Detail Pages

- Variant selection driven by `lib/ct/variant-config.ts` (see variant-config skill):
  - Auto-detects selectable attributes (those with >1 distinct value across variants)
  - `VARIANT_SELECTOR_BLOCKLIST` — attribute names never shown as selectors (e.g. `new-arrival`, `subscription-eligible`, `search-color`, `search-finish`, raw code attrs)
  - `VARIANT_RENDERER_MAP` — `'pill'` (default) or `'color'` swatch per attribute; `color-label` and `finish-label` render as swatches
  - `VARIANT_COLOR_CODE_ATTR` — maps display attribute to companion hex-code attribute (`color-label` → `color-code`, `finish-label` → `finish-code`); label value used as swatch tooltip and text fallback
  - `VARIANT_SORT_ORDER` — explicit display order (color first, finish second, size third); unlisted attributes appended after
  - Best-match navigation: selecting a value maximises matching of other currently selected attributes (e.g. switching color preserves size)
  - Cross-attribute availability: an option is only enabled if at least one in-stock variant exists with that value AND all other currently-selected attribute values (e.g. Blue + Matte selected → size S disabled if no Blue + Matte + S variant is in stock)
  - Unavailable options rendered as non-clickable `<span>` (dimmed, `cursor-not-allowed`, `title="Sold out"`)
  - Attribute display labels fetched from CT product type model (localized), with derived fallback
  - Server-rendered `<Link>` elements — no client JS required for navigation
- Out-of-stock handling: `variant.availability.isOnStock` drives sold-out state; when sold out shows localized "Out of stock" message + disabled "Currently unavailable" button (`product.outOfStock` / `product.currentlyUnavailable` translation keys)
- **Inventory status indicator on PDP**: stock level shown between variant selector and add-to-cart; logic: `isOnStock=false` → red "Out of stock"; `availableQuantity 1–9` → amber "Low stock — only N left"; otherwise → sage "In stock"; `availableQuantity` mapped from CT `ProductVariantAvailability.availableQuantity` through `lib/mappers/product.ts` → `Variant.availability.availableQuantity`
- Image URL transforms configured in `lib/ct/image-config.ts` — three separate functions for listing (`transformListingImageUrl`), PDP carousel (`transformDetailImageUrl`), and PDP thumbnails (`transformThumbnailImageUrl`); supports CDN prefixes, size suffixes, Imgix, Cloudinary, etc. Next.js image optimization disabled (`unoptimized: true`) to prevent query params being appended to CDN URLs
- Horizontal image carousel (`ProductImageCarousel`) with portrait (3:4) aspect ratio, `object-contain` (no cropping), white background, and CSS snap scrolling
- Carousel shows 2 images at a time; left/right arrow buttons overlaid via CSS grid for reliable vertical centering
- Clickable thumbnail strip below carousel highlights the active image; scrolling the carousel updates the active thumbnail
- Single-image fallback (no arrows); no-image placeholder
- Discounted price display: when a CT product discount applies, the discounted price is shown in accent color (`text-terra`) with the original price struck through; both PDP and product cards support this
- Product discount badge: the CT product discount name (localized, from Merchant Center) is shown as a `bg-terra` badge — top-right on listing cards, below the price on PDP; discount reference is expanded in the search query (`masterVariant.price.discounted.discount` / `variants.price.discounted.discount`)
- Sold-out listing cards: products with `isOnStock === false` show a localized "Out of stock" label on hover instead of the add-to-cart button
- Breadcrumb navigation (Home > Category > Product)
- Quantity selector (− / count / + control, min 1, max 99) above the add-to-cart button
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
- Discount code / coupon input on cart page

## Checkout

- Guest checkout (no account required)
- Logged-in checkout with saved address dropdown for both shipping and billing
- On page load, cart's existing shipping address pre-fills the form; if it matches a saved address the dropdown pre-selects it
- When no cart address exists, auto-selects the saved address matching the current locale's country
- Selecting a saved address immediately sets it on the cart via `PATCH /api/cart`
- Typing a new address debounces 600 ms then sets it on the cart once all required fields are filled
- Shipping method selection immediately sets the method on the cart via `PATCH /api/cart`
- Billing "same as shipping" checkbox mirrors the shipping address to cart billing in real time
- Country in address forms pre-selected from the URL locale param (e.g. `de-de` → Germany)
- Country select populated from global locale config (same source as locale switcher)
- Postal code validated per country using the `validator` npm package (`isPostalCode`)
- Email validated using `validator` (`isEmail`)
- Billing address section appears before split shipment section
- Shared `AddressFields` component (`components/address/AddressFields.tsx`) used for all address forms — renders first/last name, street (combined for US, split name+number for EU), apt/suite, city, postal code, state, country, phone, and optionally email; postal code validated on blur
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

## My Account — Wishlist

- Wishlist page at `/account/wishlist` showing all saved items in a product grid
- Add to wishlist via heart icon button on every product detail page (visible when logged in)
- Filled heart indicates the item is already in the wishlist; clicking again removes it
- "Add to Cart" button on each wishlist card moves the item to the cart
- Remove button (×) on each wishlist card deletes the item from the wishlist
- Item count shown in page heading
- Empty state with "Start Shopping" link
- Wishlist is persisted in commercetools Shopping Lists (survives logout/login)

## My Account — Orders

- Order list with status badges (Processing, Confirmed, Delivered, Cancelled)
- Shipment state badge on each order card (Pending, Ready to Ship, Shipped, Delivered, Partially Shipped, On Backorder, Delayed)
- Order detail with line items, shipping/billing addresses, and price breakdowns
- Subscription and split shipment indicators on order detail
- Shipment status timeline on order detail: Ordered → Shipped → Delivered with filled/hollow step indicators
- Backorder/Delayed banner on order detail when applicable
- Return request form on eligible orders (Complete or Confirmed state) — select items and quantities
- Existing returns shown with tracking ID, return date, and item list

## My Account — Subscriptions

- List all recurring orders with status (Active, Paused, Cancelled)
- Schedule display (Weekly, Bi-weekly, Monthly)
- Next order date
- Pause, resume, and cancel actions
- Skip next order
- Change delivery schedule
- Subscription detail page at `/account/subscriptions/[id]`

## My Account — Addresses

- List, add, edit, and delete saved addresses
- Default shipping and default billing toggles (independent)
- Country defaults to the current locale's country when adding a new address
- Localized address display: US format (`123 Main St`), European format (`Main St 123`)
- Phone field included in address form
- Shared `AddressFields` component used for all address field rendering (same as checkout)

## My Account — Payment Methods

- List saved cards with brand detection (Visa, Mastercard, Amex, Discover)
- Add and remove cards (last 4 digits stored, demo tokenization)
- Set default payment method

## My Account — Security

- Change password form at `/account/security`
- Current password verification before accepting new password

## Internationalization

- Locale-prefixed URLs: `/en-us/...`, `/en-gb/...`, `/de-de/...`
- `site/proxy.ts` auto-redirects non-locale paths based on `vibe-country` cookie (falls back to `en-us`)
- Country selector navigates to locale-correct URL on switch
- Country selector in header with flag emoji (US, GB, DE)
- Currency switching (USD, GBP, EUR)
- Locale-aware product and category names
- Localized money formatting
- Country preference persisted in cookie
- Full UI translations via `next-intl` covering all three locales (en-US, en-GB, de-DE)
- ICU plural format for item counts and skip messages
- Translation keys organized in JSON message files under `site/messages/` (`en-us.json`, `en-gb.json`, `de-de.json`) by namespace (common, nav, header, footer, product, cart, checkout, confirmation, account, orders, addresses, payments, subscriptions, auth, search, home)
- Server components use `getTranslations()`, client components use `useTranslations()` hook
- `site/i18n/routing.ts` — defines supported locales via `defineRouting` and exports locale-aware navigation primitives (`Link`, `useRouter`, `usePathname`, `redirect`, `getPathname`) via `createNavigation`; all components import `Link` from here instead of `next/link` — no manual locale prefix construction anywhere in the codebase

## Loyalty Programme

- Loyalty tier and points stored as CT customer custom fields (`loyaltyTier`, `loyaltyPoints`)
- Tier badge displayed inline next to the username in the header (both desktop dropdown trigger and mobile nav)
- Loyalty tier and points shown in the account sidebar (`/account` layout) and on the account overview page
- `useLoyalty` hook reads directly from `useAccount()` — loyalty data is included in the `/api/account/profile` response, avoiding a separate network round-trip
- `LoyaltyWidget` client component renders tier badge + points balance; used in both the header dropdown and the account area
- Backend: `GET /api/account/loyalty` route available for standalone loyalty queries (returns `loyaltyTier` and `loyaltyPoints` from CT customer custom fields)

## Shop the Look

An editorial feature that surfaces curated product bundles stored as commercetools Custom Objects (container: `shop-the-look`).

### Listing Page (`/shop-the-look`)
- Displays all active bundles as cards in a responsive grid
- Each card hero shows a real product image collage fetched via a single batch `productProjections` query:
  - 1 image: full-bleed
  - 2 images: side-by-side halves
  - 3 images: left half + 2 stacked on right
  - Fallback: neutral grey block when no images available
- Product count badge overlaid on the hero image
- Bundle name, description, and "Shop now" CTA link on each card
- BFF route: `GET /api/shop-the-look`

### Detail Page (`/shop-the-look/[key]`)
- Breadcrumb navigation back to listing page
- Bundle name, description, and product count in a header section
- **"Add All to Cart"** button anchored in the header (right-aligned) — always visible without scrolling; extracted into `ShopTheLookActions` client component
  - Sequential cart additions with spinner state
  - Success (`✓ All added`) and partial-error states
- **Adaptive product tile grid** based on bundle size:
  - 1 product: centred single tile (`max-w-sm mx-auto`)
  - 2 products: 2-column grid
  - 3 products: asymmetric editorial layout — featured tile spans 2 rows on the left, two smaller tiles stacked on the right (CSS grid `row-span-2`)
  - 4 products: 2×2 grid
  - 5+ products: 2-column (mobile) → 3-column (desktop) grid
- Each product tile has an individual "Add to Cart" button with adding/added state feedback
- Featured tile (3-product layout) uses `aspect-[3/4]` tall image area; standard tiles use `aspect-square`
- Position badge (numbered) overlaid on each product image
- BFF route: `GET /api/shop-the-look/[key]`
- Navigation: "Shop the Look" link in MegaMenu and mobile nav

### Data Model
- Bundles stored in CT Custom Objects, container: `shop-the-look`
- Bundle fields: `name`, `description`, `status` (`active`|`draft`), `products[]` (each with `productId`, `variantId`, `position`)
- Only `status: "active"` bundles are shown on the storefront
- `resolveBundleProducts` batch-fetches all product data in one CT query, resolves pinned variant or falls back to master variant

## Homepage

- Hero banner (`site/components/home/HeroBanner.tsx`) configured via `site/config/hero.json` — edit JSON to change background image, eyebrow text, heading parts (with optional `bold` and `newLine` flags), description, and CTA buttons; all text fields are locale maps (`en-US`, `en-GB`, `de-DE`)
- Home page sections (`site/components/home/Section.tsx`) — reusable wrapper with title, optional "view all" CTA link, and a 4-column product/category grid
- Category cards (`site/components/category/CategoryCard.tsx`) — resolves localized name and slug internally, builds locale-aware href via next-intl routing

## Authentication & Sessions

- JWT-based sessions using `jose`, stored in HTTP-only cookie
- Login with email and password
- Registration with name, email, and password
- Forgot password flow: request reset email at `/forgot-password`, set new password at `/reset-password`
- Email confirmation via token (`/api/auth/confirm`)
- Change password from account security page
- Test credential button (jen@example.com / 123)
- Logout clears cart reference from session
- Anonymous cart merged to customer on login
- Post-auth redirect support

## API Routes (BFF)

All commercetools calls go through server-side Next.js API routes. The browser never contacts commercetools directly. Client components fetch data via SWR hooks in `site/hooks/` — never via direct `fetch('/api/*')` calls in components.

| Route | Methods | Purpose |
|---|---|---|
| `/api/auth/login` | POST | Sign in |
| `/api/auth/register` | POST | Create account |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/me` | GET | Current user |
| `/api/auth/request-reset` | POST | Request password reset email |
| `/api/auth/reset` | POST | Reset password with token |
| `/api/auth/confirm` | POST | Confirm email with token |
| `/api/auth/change-password` | POST | Change password (authenticated) |
| `/api/cart` | GET, POST, PATCH | Get or create cart; PATCH sets shipping address, billing address, and/or shipping method |
| `/api/cart/items` | POST | Add item |
| `/api/cart/items/[itemId]` | PUT, DELETE | Update quantity, remove item |
| `/api/cart/discount` | POST, DELETE | Apply / remove discount code |
| `/api/checkout` | POST | Place order |
| `/api/account/profile` | GET, PUT | View/edit profile |
| `/api/account/orders` | GET | List orders |
| `/api/account/orders/[orderId]` | GET | Order detail |
| `/api/account/orders/[orderId]/returns` | POST | Submit return request |
| `/api/account/wishlist` | GET, POST | Get wishlist / add item |
| `/api/account/wishlist/items/[itemId]` | PUT, DELETE | Update quantity / remove item |
| `/api/account/subscriptions` | GET | List subscriptions |
| `/api/account/subscriptions/[id]` | PUT | Pause/resume/cancel/skip/reschedule |
| `/api/account/addresses` | GET, POST, PUT, DELETE, PATCH | Address CRUD + set defaults |
| `/api/account/payments` | GET, POST, DELETE, PATCH | Payment method CRUD + set default |
| `/api/shop-the-look` | GET | List active Shop the Look bundles |
| `/api/shop-the-look/[key]` | GET | Single bundle detail |
| `/api/account/loyalty` | GET | Customer loyalty tier and points |
| `/api/countries` | GET | Available countries |
| `/api/shipping-methods` | GET | Shipping options |
| `/api/recurrence-policies` | GET | Subscription frequencies |

## Agent Portal (CS Agent Impersonation) — Phase 1 + Phase 2 + Phase 3

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
- Name search uses CT `=` predicate which is case-insensitive by spec — "johnson" finds "Johnson", "JOHNSON", etc.; input is split on whitespace so "Maria Smith" finds anyone with firstName "Maria" OR lastName "Smith"
- Name search is exact-match per token (partial prefix search requires the CT Customer Search API, not yet enabled)
- Name search returns up to 10 matching customers in a dropdown; agent selects one to start a session
- Name search debounces 300 ms, requires minimum 2 characters
- Exact-match search (email/customerId/orderId) returns: customer name, email, account status, open order count
- Agents can start a customer session (scopes the agent JWT to one customer at a time)
- Agents must explicitly end a customer session before looking up a different customer

### Active Cart View
- Agent can view the customer's active cart: line items, SKU, name, quantity, unit price, totals
- Applied discount codes and shipping address displayed
- Staleness warning shown if cart was last modified more than 24 hours ago
- If no active cart exists, agents with `order-placement` role see a "+ Create cart" button
- Creating a cart calls `POST /api/agent/customers/[id]/cart`, writes an audit entry, and transitions the UI to the cart view without a page reload

### Cart Creation (Phase 3)
- `POST /api/agent/customers/[customerId]/cart` creates a new Active CT cart owned by the customer with `origin: "Merchant"` (requires `order-placement` role)
- Derives currency from the customer's first saved address country; defaults to USD
- Guards against duplicate carts: returns 409 Conflict if an Active cart already exists; the UI refreshes to display the existing cart
- Every creation attempt (success or failure) is written to the audit log with `actionType: "cart.created"`
- Setup required: run `node tools/setup-agent-order-type.mjs` to create the CT custom type before deploying

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

### Order Attribution (Phase 3)
- Every order placed via the agent checkout route is tagged with a CT custom type `agent-order-attribution` containing `agentId`, `agentEmail`, and `agentName`
- Attribution is written as a non-blocking CT order update after `createOrderFromCart` — checkout succeeds even if the attribution write fails
- Customers see a "CS Agent assisted" badge on agent-attributed orders in My Account → Orders (list and detail views)
- Badge is visually distinct (indigo pill) and uses both colour and text to meet WCAG 2.1 AA
- Self-placed orders have no badge; attribution fields are only present when an agent performed the checkout
- Setup: create the custom type first with `node tools/setup-agent-order-type.mjs`

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
| `/api/agent/customers/[customerId]/cart` | GET, POST | View customer's active cart; POST creates a new cart |
| `/api/agent/customers/[customerId]/cart/items` | POST, DELETE, PATCH | Add/remove/update cart line items |
| `/api/agent/customers/[customerId]/cart/discounts` | POST, DELETE | Apply/remove discount codes |
| `/api/agent/customers/[customerId]/cart/address` | PUT | Update shipping address on cart |
| `/api/agent/customers/[customerId]/addresses` | GET, POST | View and add customer addresses |
| `/api/agent/customers/[customerId]/addresses/[addressId]` | PUT | Update a customer address |
| `/api/agent/customers/[customerId]/checkout` | POST | Place order on behalf of customer |
| `/api/agent/audit` | GET | Compliance audit log query |

### Setup
- Provision agent accounts: `node tools/setup-agent-credentials.mjs` (edit `AGENTS` array, requires `tools/.env`)
- Create order attribution CT custom type: `node tools/setup-agent-order-type.mjs` (run once per CT project, idempotent)
- Required env var: `AGENT_SESSION_SECRET` in `site/.env` (see CLAUDE.md)

## Developer Tooling

- **ESLint 9** flat config (`eslint.config.mjs`) with Next.js, TypeScript, React Hooks, and jsx-a11y rules
- **Prettier** with `prettier-plugin-tailwindcss` for automatic Tailwind class sorting
- Lint scripts: `npm run lint`, `npm run lint:fix`, `npm run format`, `npm run format:check`

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
