## Why

The existing B2C storefront demo shows only a single-brand setup, leaving commercetools' multi-brand capability undemonstrated in live client pitches. This change creates "Vibe Love" — a second branded storefront scoped to a home accessories product selection on the same CT backend — proving that one CT project can power multiple distinct brands without duplicating infrastructure.

## What Changes

- Inject `storeKey: home-accessories-store` into all CT API calls (product queries, cart mutations, order creation) so catalogue, pricing, and inventory are store-scoped
- Replace the brand identity (logo, colour palette, homepage hero copy) with the "Vibe Love" premium home accessories aesthetic
- Verify end-to-end checkout creates orders with `storeRef: home-accessories-store`
- Drive store configuration entirely from environment variables so the same codebase redeploys to any CT store without code changes

## Capabilities

### New Capabilities

- `ct-store-scoping`: Inject store context (`storeKey`) into all CT API calls — product queries, cart creation, cart mutations, and order creation — so responses are automatically filtered to the store's product selection, price channel, and inventory channel
- `vibe-love-brand`: Visual brand identity for Vibe Love — logo, colour palette (calm, muted, premium), and homepage hero copy appropriate to a home accessories brand
- `store-env-config`: Environment-variable-driven store configuration — store key and any store-specific channel keys read from `.env`, enabling redeployment to a different CT store without code changes

### Modified Capabilities

<!-- No existing specs to modify — this is a greenfield brand layer on the existing codebase -->

## Impact

- `site/lib/ct-client.ts` (or equivalent CT API client) — add store key to all API call paths
- `site/app/api/` — all route handlers that call CT must pass store context
- `site/app/` — homepage hero section copy and imagery
- `site/components/` — header logo component
- `site/app/globals.css` (or Tailwind theme) — colour token overrides for Vibe Love palette
- `site/.env` — new `NEXT_PUBLIC_CTP_STORE_KEY` variable (and optionally channel key vars)
- No breaking changes to existing component APIs; brand changes are applied via CSS tokens and env-var-driven config only
