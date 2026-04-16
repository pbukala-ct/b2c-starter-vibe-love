## Context

The storefront uses Tailwind CSS v4 with all tokens in the `@theme` block of `globals.css`. There is no `tailwind.config.ts`. Fonts are loaded from Google Fonts via `next/font/google` in `layout.tsx` — the project already loads Inter. The header's top bar text comes from the `header.topBar` translation key across three locale JSON files (`en-us.json`, `en-gb.json`, `de-de.json`). Categories are fetched via `getCategoryTree()` which calls `getRawCategories()` — a CT query that returns ALL categories in the project. The MegaMenu receives `categories: Category[]` as a prop from the Header, which is called in `app/layout.tsx`.

Product search uses `executeProductSearch()` in `search.ts`. When `CTP_STORE_KEY` is set and the store doesn't exist in CT, the current fallback incorrectly passes `storeProjection: storeKey` to the base search, which silently strips prices from the response. The fix is to use the plain body (without storeProjection) as the fallback.

The `Variant` type in `lib/types.ts` and the `mapVariant` function in `lib/mappers/product.ts` currently omit `availableQuantity` from CT's `ProductVariantAvailability`.

## Goals / Non-Goals

**Goals:**
- Visual distinction: Playfair Display serif headings, warm charcoal (`#2c1a10`) replacing cold near-black, dusty-rose (`terra`) top bar, cream header background — all achievable via CSS tokens + font load, zero component rewrites
- Category filtering: nav and homepage category list shows only store-relevant categories
- Price/cart fix: prices always appear; add-to-cart visible on product cards
- PDP inventory count: "N in stock", "Low stock (N left)", or "Out of stock" based on `availableQuantity`

**Non-Goals:**
- Custom page layouts for category landing pages
- Routing-based multi-tenancy
- Real-time inventory polling

## Decisions

### Decision 1: Derive store categories from product search results

Rather than calling a dedicated "get store categories" endpoint (which doesn't exist in this form in CT), the category list for nav and homepage is derived by running the store-scoped product search with a high limit, collecting all `product.categories[0].id` values, and using those IDs to filter the full category tree.

**Why**: No extra CT API call beyond what's already needed. Works with both the in-store search (when store exists) and the fallback.

**Risk**: A product whose primary category isn't in the nav will cause that category to never appear. Mitigated by using `product.categories` (all categories) not just `[0]`.

**Implementation**:
- In `layout.ts`, after `searchProducts()`, collect all category IDs from results
- Filter `categories` (from `getCategoryTree`) to only those whose `id` appears in the set, or whose `parent.id` appears (to preserve parent-child structure)
- Pass filtered categories to `Grid` and to the `Header` (which passes them to `MegaMenu`)
- The `app/layout.tsx` root layout also calls `getCategoryTree` for the Header — update it to call `getStoreScopedCategories()` helper instead

### Decision 2: Colour palette — warm charcoal + serif headings

Change `--color-charcoal` from `#1a1a1a` (cold near-black) to `#2c1a10` (warm dark espresso). Add `--font-heading` token in `@theme`, load Playfair Display via `next/font/google`, inject it as a CSS variable in `layout.tsx`, apply it to `h1`/`h2`/`h3` via a global CSS rule.

**Why**: Changing one token and one font shifts the entire brand feel instantly. Every heading, footer, and dark background becomes warm rather than cold.

**Risk**: Playfair Display is a relatively heavy font (~40KB for the subset). Mitigated by using `display: swap` and loading only weights 400 and 700.

### Decision 3: Fix search fallback — drop storeProjection

The 404-fallback body must NOT include `storeProjection` when the store doesn't exist. Setting `storeProjection` to a non-existent key causes CT to return products without price embeddings. The correct fallback is the original `body` unchanged.

```typescript
// BEFORE (broken):
const fallbackBody = { ...body, productProjectionParameters: { ...body.productProjectionParameters, storeProjection: CTP_STORE_KEY } };
// AFTER (correct):
// just use body directly — no store projection when store doesn't exist
const { body: result } = await apiRoot.products().search().post({ body }).execute();
```

### Decision 4: Inventory status — threshold-based display

`availableQuantity` is added to the `Variant` type and mapper. On the PDP, the display logic:
- `availableQuantity >= 10` (or no quantity data but `isOnStock = true`): "In stock"
- `1 <= availableQuantity <= 9`: "Low stock — only N left"
- `availableQuantity === 0` or `isOnStock === false`: "Out of stock"

The threshold (10) is a hardcoded constant on the PDP page — intentionally not a config since it's a simple demo signal.

## Risks / Trade-offs

- **Store category filtering N+1**: collecting category IDs from search results requires no extra queries — we already fetch products for the homepage. However, the Header's category list (in `app/layout.tsx`) fetches categories separately from layout.ts. To avoid an extra product search, the `getStoreScopedCategories()` helper reuses a single product search call. This means the server component tree calls it twice (once for homepage content, once for header). Acceptable for a demo.
- **Playfair Display FOUT**: mitigated by `font-display: swap` via `next/font`.
- **`availableQuantity` may be 0 even when `isOnStock = true`**: CT can mark a product in-stock based on inventory channel rules (e.g. infinite supply) even when `availableQuantity` is 0. Safeguard: show "In stock" if `isOnStock = true` and `availableQuantity` is undefined or 0 but not explicitly unavailable.
