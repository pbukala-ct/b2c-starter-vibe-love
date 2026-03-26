## 1. Fix name search predicate

- [x] 1.1 In `site/app/api/agent/customers/lookup/route.ts`, replace the `ilike` prefix clauses with `=` equality clauses — keep the whitespace token-split logic, change `ilike "${token}%"` to `= "${token}"` for both `firstName` and `lastName`
- [x] 1.2 Update `FEATURES.md` — change the name search description to "case-insensitive exact match per token via CT `=` operator; partial/prefix matching requires the CT Customer Search API (not yet enabled)"
