## Why

Two bugs discovered after shipping Phase 3 make key agent features non-functional in production:

1. **Case-insensitive name search returns no results.** The `ilike` predicate with `%` wildcards (e.g. `firstName ilike "%johnson%"`) is silently swallowed in a try/catch. The fallback uses exact `=` match, which — while case-insensitive in CT — is not partial: typing "jo" will never match "Johnson". Agents have no working search until this is resolved.

2. **Agent-created carts lack `origin: "Merchant"`.** The CT `CartDraft` has a `cartOrigin` field that distinguishes customer-originated carts (`Customer`, the default) from merchant/agent-initiated ones (`Merchant`). Without setting this field to `"Merchant"`, agent-created carts are indistinguishable from customer-created carts in CT reporting, order flows, and any CT extension that filters by cart origin.

## What Changes

- **Search fix**: Replace the silent try/catch around `ilike` with a direct query using CT's `ilike` operator but escape the `%` wildcards correctly for the SDK's URL encoding. If `ilike` is genuinely unsupported, implement a reliable fallback using token-based `=` clauses (CT string `=` is case-insensitive) plus `starts with` prefix clauses to cover partial entry.
- **Cart origin fix**: Add `origin: "Merchant"` to the `CartDraft` body in `POST /api/agent/customers/[customerId]/cart`.

## Capabilities

### Modified Capabilities

- `agent-customer-lookup`: Name search actually works for partial and case-insensitive input.
- `agent-cart-create`: Carts created by agents are tagged with `origin: "Merchant"` in CT.

## Impact

- **`site/app/api/agent/customers/lookup/route.ts`** — rework name search predicate and fallback strategy.
- **`site/app/api/agent/customers/[customerId]/cart/route.ts`** — add `origin: 'Merchant'` to cart POST body (one line).
