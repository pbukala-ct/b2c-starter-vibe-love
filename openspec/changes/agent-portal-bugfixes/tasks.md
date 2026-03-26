## 1. Fix: Cart creation — set `origin: "Merchant"`

- [x] 1.1 In `site/app/api/agent/customers/[customerId]/cart/route.ts`, add `origin: 'Merchant'` to the `CartDraft` body passed to `POST /carts`

## 2. Fix: Case-insensitive name search

- [x] 2.1 In `site/app/api/agent/customers/lookup/route.ts`, replace the `ilike "%term%"` try/catch block with prefix-wildcard `ilike` clauses:
  - Split trimmed input on whitespace to get tokens (deduplicated)
  - For each token, generate: `firstName ilike "<token>%" or lastName ilike "<token>%"`
  - Join all token clauses with ` or `
  - Example: input "jo sm" → `firstName ilike "jo%" or lastName ilike "jo%" or firstName ilike "sm%" or lastName ilike "sm%"`
- [x] 2.2 Remove the silent `catch` fallback that runs exact `=` queries — if CT rejects the predicate, surface the error (log with `console.error`, return 500) so the failure is visible
- [x] 2.3 Keep the 2-character minimum guard and the audit log entry unchanged
- [x] 2.4 Update `FEATURES.md` — change "case-insensitive `ilike`" description to "prefix `ilike`" to accurately reflect the search behaviour
