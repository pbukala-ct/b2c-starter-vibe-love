## Context

Phase 3 shipped two features that have bugs in production:

**Bug 1 — Name search:**
Current implementation in `lookup/route.ts` (name branch):
```ts
const ilikeWhere = `firstName ilike "%${escaped}%" or lastName ilike "%${escaped}%"`;
try {
  const result = await apiRoot.customers().get({ queryArgs: { where: ilikeWhere } }).execute();
  customers = result.body.results;
} catch {
  // fallback: exact = match (still case-insensitive, but NOT partial)
}
```
The `%` characters in the `ilike` pattern may be double-encoded by the CT SDK when serialised as a URL query parameter, causing CT to return a 400 or 0 results. The catch block silently discards the error and runs exact-match fallback queries — which only find customers whose `firstName` or `lastName` exactly equals the input token. Partial input like "jo" never matches "Johnson".

**Bug 2 — Cart origin:**
`POST /api/agent/customers/[customerId]/cart` creates the cart with:
```ts
body: { customerId, customerEmail, currency, country, shippingMode: 'Single' }
```
`cartOrigin` defaults to `"Customer"`. The CT `CartOrigin` enum is `"Customer" | "Merchant"`. Carts created by agents on behalf of customers should have `origin: "Merchant"`.

## Goals / Non-Goals

**Goals:**
- Name search returns results for partial, case-insensitive input (e.g. "jo" finds "Johnson").
- Agent-created carts have `origin: "Merchant"` in CT.

**Non-Goals:**
- Changing the overall search UX (debounce, dropdown, min-char guard are fine).
- Full-text fuzzy search.

## Decisions

### 1. CT ilike encoding fix: use explicit percent-encoded wildcard or alternative predicate

**Root cause analysis**: The CT SDK serialises `where` as a URL query parameter. A `%` character inside the string value becomes `%25` when URL-encoded, which is correct — CT should receive the literal `%` and interpret it as the `ilike` wildcard. However, if the SDK or a middleware double-encodes it (to `%2525`), CT receives a literal `%25` string and finds nothing.

**Decision**: Replace the `%`-wildcard `ilike` pattern with CT's alternative partial-match approach: query using `in (...)` with a generated list of case variants, OR use two `ilike` clauses but validate they work in a unit test before relying on them. The most reliable portable approach for CT Customers partial-name search is:

```ts
// Split input into tokens; for each token, build a starts-with ilike clause
// e.g. input "jo sm" → tokens ["jo", "sm"]
// → firstName ilike "jo%" or lastName ilike "jo%" or firstName ilike "sm%" or lastName ilike "sm%"
```

Using prefix-only wildcard (`"jo%"` instead of `"%jo%"`) avoids the leading-`%` performance concern and is more reliably URL-safe since `%` only appears at the end of the pattern string, after the literal token characters. CT correctly receives `firstName ilike "jo%"` and does a case-insensitive prefix scan.

For cases where the agent types a full name like "Johnson", add a secondary clause with the full-contains pattern as well, deduplicating results.

**Alternative considered**: Use CT's Customer Search API (`/customers/search`) which supports full-text. Rejected for now — it requires an additional CT feature flag and is overkill for name prefix search.

### 2. Fallback strategy when ilike fails

**Decision**: Do not silently swallow ilike failures. If ilike throws (4xx from CT), log the error with `console.error` and return an empty result with a 500, prompting the agent to try a different search method. This surfaces the real failure rather than hiding it behind a confusing "no results" empty state.

The `=` exact fallback is removed because it doesn't solve partial search and creates false confidence that the feature works when it doesn't.

### 3. Cart origin: set `origin: 'Merchant'` in CartDraft

**Decision**: Add the field directly to the cart POST body. One-line change. The CT SDK's `CartDraft` type includes `origin` as an optional field typed as `'Customer' | 'Merchant'`.

## Risks / Trade-offs

- **Prefix-only `ilike`** (`"jo%"`) won't find "Ellie Johnson" when the agent types "johnson" — the prefix matches `lastName` starting with "johnson" so it still works for last names. It won't find "Johnson" if the agent types "nson". Accepted — prefix search is a significant improvement over the broken fallback.
- **No silent fallback**: Removing the silent catch means the search will surface errors to agents if CT rejects the predicate. Better than silently returning zero results.

## Migration Plan

1. Deploy `lookup/route.ts` change — no data migration, no CT changes needed.
2. Deploy `cart/route.ts` change — affects only future carts; existing agent-created carts are not retroactively updated.
3. No Netlify env var changes required.
