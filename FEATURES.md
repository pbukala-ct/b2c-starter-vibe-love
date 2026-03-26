# Features

Comprehensive inventory of implemented storefront features. This file is the source of truth for what exists in the codebase — keep it updated when adding or removing features.

## Search & Discovery

- Full-text product search via commercetools Product Search API
- Category browsing with nested 3-level hierarchy
- Mega menu with full category tree
- Dynamic faceted filtering driven by commercetools Product Search facets API
- Facet definitions auto-fetched from product type attributes (60s module-level cache), filtered by `FACET_BLOCKLIST` and extended with `getExtraFacets(t)` in `facet-config.ts`
- Per-facet render config in `FACET_RENDERER_MAP`: `'color'` (swatches) or `'pill'` (pills with counts); defaults to `'pill'` for unmapped facets
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
- Optional address nickname
- Localized address format (US vs. EU street/number)

## My Account — Payment Methods

- List saved cards with brand detection (Visa, Mastercard, Amex, Discover)
- Add and remove cards (last 4 digits stored, demo tokenization)
- Set default payment method

## My Account — Security

- Change password form at `/account/security`
- Current password verification before accepting new password

## Internationalization

- Locale-prefixed URLs: `/en-us/...`, `/en-gb/...`, `/de-de/...`
- Middleware auto-redirects non-locale paths based on `vibe-country` cookie (falls back to `en-us`)
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
| `/api/cart` | GET, POST | Get or create cart |
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
| `/api/countries` | GET | Available countries |
| `/api/shipping-methods` | GET | Shipping options |
| `/api/recurrence-policies` | GET | Subscription frequencies |

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
