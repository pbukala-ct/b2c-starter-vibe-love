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
- Translation keys organized in JSON message files under `site/messages/` by namespace (common, nav, header, footer, product, cart, checkout, confirmation, account, orders, addresses, payments, subscriptions, auth, search, home)
- Server components use `getTranslations()`, client components use `useTranslations()` hook

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
