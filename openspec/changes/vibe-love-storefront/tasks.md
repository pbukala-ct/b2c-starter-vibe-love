## 1. Environment Configuration

- [x] 1.1 Add `NEXT_PUBLIC_CTP_STORE_KEY=home-accessories-store` to `site/.env`
- [x] 1.2 Document the new env var in any existing README or env-var documentation

## 2. CT Store Context Injection

- [x] 2.1 Locate the CT API client initialisation and all fetch/request helpers in `site/app/api/`
- [x] 2.2 Create a helper that reads `NEXT_PUBLIC_CTP_STORE_KEY` and returns the `/in-store/key=<storeKey>/` path prefix (empty string if env var is unset)
- [x] 2.3 Apply the store path prefix to the product search/listing API route
- [x] 2.4 Apply the store path prefix to the product detail (PDP) API route
- [x] 2.5 Apply the store path prefix to the cart creation API route
- [x] 2.6 Apply the store path prefix to all cart update API routes (add line item, set shipping address, set shipping method, remove line item, etc.)
- [x] 2.7 Apply the store path prefix to the order creation API route
- [ ] 2.8 Verify in CT Merchant Center that a test order created via the storefront has `storeRef.key = home-accessories-store`

## 3. Product Selection Filtering Verification

- [ ] 3.1 Browse the PLP and confirm only products in the `home-accessories-store` Product Selection appear
- [ ] 3.2 Attempt to navigate directly to the PDP of a product NOT in the selection and confirm a 404 is returned

## 4. Store-Scoped Pricing and Inventory Verification

- [ ] 4.1 Compare PDP prices displayed in the storefront against the store channel prices configured in CT Merchant Center
- [ ] 4.2 Verify that an out-of-stock product (per store inventory channel) shows as unavailable on the PDP

## 5. Vibe Love Brand — Colour Palette

- [x] 5.1 Audit all components for hardcoded Tailwind colour classes (e.g. `bg-slate-900`, `text-indigo-600`) that will not respond to theme token overrides
- [x] 5.2 Define the Vibe Love colour palette as CSS custom properties in the `@theme` block in `site/app/globals.css`
- [x] 5.3 Replace any hardcoded colour classes identified in 5.1 with semantic token classes
- [x] 5.4 Visually verify that primary buttons, page backgrounds, and headings all use the Vibe Love palette

## 6. Vibe Love Brand — Logo

- [x] 6.1 Update the header component to display "Vibe Love" as the brand name (text or SVG wordmark)
- [x] 6.2 Confirm no reference to the original brand name is visible on any page

## 7. Vibe Love Brand — Homepage Hero

- [x] 7.1 Update the homepage hero headline and subheadline with Vibe Love home accessories copy
- [x] 7.2 Update the hero CTA label and link target (to PLP or a featured category)
- [x] 7.3 Verify the hero copy does not reference furniture or any unrelated category

## 8. End-to-End Demo Flow QA

- [ ] 8.1 Run full add-to-cart → checkout → order confirmation flow in the storefront
- [ ] 8.2 Confirm the order appears in CT Merchant Center with `storeRef: home-accessories-store`
- [ ] 8.3 Run the full flow a second consecutive time without errors (two clean rehearsal runs)

## 9. Documentation

- [x] 9.1 Update `FEATURES.md` to document the Vibe Love store-scoping and brand changes
- [x] 9.2 Update `test.txt` with plain-English test descriptions for store scoping and brand identity
- [ ] 9.3 Regenerate and run Playwright tests to verify no regressions
