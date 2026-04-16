## 1. Fix product prices (regression — do first)

- [x] 1.1 In `site/lib/ct/search.ts` `executeProductSearch()`, change the 404 fallback to use the plain `body` without `storeProjection` — remove the fallback body mutation entirely
- [x] 1.2 Start the dev server and verify prices appear on product cards and PDP

## 2. Vibe Love visual identity — colour tokens and font

- [x] 2.1 In `site/app/globals.css`, change `--color-charcoal` from `#1a1a1a` to `#2c1a10` (warm espresso); add `--font-heading` CSS variable placeholder
- [x] 2.2 In `site/app/layout.tsx`, add `Playfair_Display` import from `next/font/google` (weights 400, 700; subsets latin; display swap); assign its CSS variable to `--font-heading` on `<html>`
- [x] 2.3 In `site/app/globals.css`, add a global CSS rule: `h1, h2, h3 { font-family: var(--font-heading), serif; }`
- [x] 2.4 In `site/app/globals.css`, update `--color-charcoal` and warm up the scrollbar track/thumb to match the new palette
- [x] 2.5 Verify headings on homepage, PDP, and category page render in Playfair Display

## 3. Vibe Love visual identity — header and top bar

- [x] 3.1 In `site/components/layout/Header.tsx`, change the top bar from `bg-charcoal` to `bg-terra`
- [x] 3.2 Update the `header.topBar` translation key in all three locale files (`en-us.json`, `en-gb.json`, `de-de.json`) to "Curated home accessories — crafted with love" (or locale equivalent)
- [x] 3.3 In `Header.tsx`, change the main header wrapper from `bg-white` to `bg-cream`
- [x] 3.4 In `Header.tsx`, change the mobile menu panel from `bg-white` to `bg-cream`
- [x] 3.5 In `Header.tsx`, change the account dropdown from `bg-white` to `bg-cream`
- [x] 3.6 Verify the header reads as visually distinct from the original storefront: warm top bar, warm cream nav bar

## 4. Vibe Love visual identity — footer

- [x] 4.1 In `site/components/layout/Footer.tsx`, change the footer background from `bg-charcoal` to the new warm charcoal token (no code change needed — token update in 2.1 already changes this)
- [x] 4.2 Verify the footer reads as warm brown rather than cold black

## 5. Store category filtering

- [x] 5.1 In `site/lib/ct/categories.ts`, add an exported `getStoreScopedCategories(locale, currency, country)` helper that: (a) fetches the full category tree, (b) when `CTP_STORE_KEY` is set, runs a store-scoped product search with `limit: 250` and no query to collect all product category IDs, (c) returns only categories (and their parents) whose IDs appear in the collected set; falls back to full tree when no store key is set
- [x] 5.2 In `site/app/layout.tsx`, replace `getCategoryTree(locale)` with `getStoreScopedCategories(locale, currency, country)`
- [x] 5.3 In `site/lib/layout.ts`, replace the `topCategories` derivation with the filtered result from `getStoreScopedCategories` (or filter after collecting product category IDs from the already-fetched `newArrivals`/`featuredProducts`)
- [ ] 5.4 Verify: MegaMenu only shows home-accessories-relevant categories when store key is set
- [ ] 5.5 Verify: mobile nav only shows store-relevant categories

## 6. PDP inventory status

- [x] 6.1 In `site/lib/types.ts`, add `availableQuantity?: number` to the `Variant.availability` object type
- [x] 6.2 In `site/lib/mappers/product.ts`, update `mapVariant` to include `availableQuantity: v.availability?.availableQuantity` in the mapped availability object
- [x] 6.3 In `site/app/[locale]/[slug]/p/[sku]/page.tsx`, derive `availableQuantity` from `variant?.availability?.availableQuantity` and `isSoldOut` from the existing logic
- [x] 6.4 In the PDP page, add an inventory status block between the variant selector and the add-to-cart actions:
  - `isSoldOut` → muted "Out of stock" pill
  - `availableQuantity >= 1 && availableQuantity <= 9` → amber "Low stock — only N left"
  - otherwise (in stock, no quantity or ≥10) → sage "In stock"
- [ ] 6.5 Verify on a PDP: inventory indicator is visible, correct colour, shows quantity when low

## 7. Verify and document

- [x] 7.1 Confirm prices and add-to-cart button are visible on PLP product cards (hover to see button)
- [x] 7.2 Confirm top bar is dusty rose with Vibe Love tagline
- [x] 7.3 Confirm headings use Playfair Display throughout
- [x] 7.4 Confirm footer background reads as warm brown
- [x] 7.5 Update `FEATURES.md` with the visual identity and inventory status additions
- [x] 7.6 Update `test.txt` with test descriptions for heading font, top bar colour, inventory indicator, and category filtering
