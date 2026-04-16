## Why

The initial brand pass changed colour tokens and copy but left the structural look and feel identical to the original storefront — the header layout, top bar colour, font, and homepage component arrangement are unchanged, so the two stores still read as the same site. At the same time, four functional regressions were introduced: prices and the add-to-cart button disappeared from product cards, categories are not filtered by store so irrelevant navigation appears, and there is no inventory count on the PDP. These gaps break both the brand credibility and the demo's core proof points.

## What Changes

- **Distinct visual identity**: warm serif heading font (Playfair Display), dusty-rose top bar replacing the charcoal one, top bar text changed to a Vibe Love tagline, header and footer background shifted from neutral white/charcoal to warm cream/deep warm-brown, homepage hero with a full-bleed warmer treatment and category section layout updated
- **Fix product prices and add-to-cart**: the store-scoped search fallback currently passes a `storeProjection` to a non-existent store, stripping prices; revert the fallback to a plain search without store projection so prices are always returned
- **Category navigation filtered by store**: MegaMenu and mobile nav derive their category list from the store-scoped product search results, not the global category tree, so only categories that contain store products appear
- **Inventory status on PDP**: expose `availableQuantity` from the CT product availability data through the type/mapper stack and display a stock-level indicator on the PDP ("In stock — N remaining" / "Low stock — N left" / "Out of stock")

## Capabilities

### New Capabilities

- `vibe-love-visual-identity`: Serif heading font, warm top bar, and distinct header/footer colour treatment that make Vibe Love read as a clearly different brand on first impression
- `store-category-filtering`: Category tree in nav and homepage sections is derived from which categories have products in the store-scoped search, not from the global CT category list
- `pdp-inventory-status`: Real-time stock quantity displayed on PDP using `availableQuantity` from CT variant availability

### Modified Capabilities

- `vibe-love-brand`: Update colour token for `charcoal` to a warm deep-brown (#2c1a10) and add Playfair Display font for headings; affects globals.css and layout.tsx font load
- `ct-store-scoping`: Fix the 404 fallback in `executeProductSearch` — remove `storeProjection` from the fallback body so prices are always returned when the store is not yet configured

## Impact

- `site/app/globals.css` — new `charcoal` token, added heading font variable
- `site/app/layout.tsx` — add Playfair Display Google Font import
- `site/components/layout/Header.tsx` — top bar colour + text, header bg change
- `site/components/layout/Footer.tsx` — footer bg change to warm dark
- `site/components/layout/MegaMenu.tsx` — accept filtered category list prop
- `site/lib/layout.ts` — derive displayed categories from store product results
- `site/lib/ct/search.ts` — fix fallback: drop `storeProjection` from non-store fallback
- `site/lib/types.ts` — add `availableQuantity?: number` to `Variant`
- `site/lib/mappers/product.ts` — map `v.availability.availableQuantity`
- `site/app/[locale]/[slug]/p/[sku]/page.tsx` — display inventory status section
