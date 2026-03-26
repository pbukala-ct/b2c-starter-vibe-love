## Context

CT Customers API query predicates support a subset of operators. `ilike` is not among them — the parser fails immediately with a syntax error. The supported string operators are `=`, `!=`, `in (...)`, `not in (...)`, and comparison operators `<`, `>`, `<=`, `>=`. CT's own documentation states: "String values in predicates are compared in a case-insensitive manner." This means `=` already provides the case-insensitivity we need.

Current broken predicate:
```
firstName ilike "sofia%" or lastName ilike "sofia%"
```

## Goals / Non-Goals

**Goals:**
- Name search returns results without throwing a CT error.
- Searching "johnson" finds customers with firstName or lastName "Johnson" (case-insensitive).
- Multi-word input works: "Maria Smith" finds anyone with firstName "Maria" OR lastName "Smith".

**Non-Goals:**
- Partial/prefix matching (typing "jo" to find "Johnson"). Not feasible on the CT Customers API without the Customer Search API feature. Out of scope for this fix.

## Decisions

### Use `=` operator with token splitting

**Decision**: Replace all `ilike "token%"` clauses with `= "token"` clauses. Keep the whitespace-token-split logic — it allows searching by full name components.

```ts
const tokens = [...new Set(trimmed.split(/\s+/).filter(Boolean))];
const clauses = tokens.flatMap((t) => {
  const escaped = t.replace(/"/g, '\\"');
  return [`firstName = "${escaped}"`, `lastName = "${escaped}"`];
});
const where = clauses.join(' or ');
```

For input "sofia": `firstName = "sofia" or lastName = "sofia"` — finds "Sofia Reyes" and "Maria Sofia".
For input "maria smith": `firstName = "maria" or lastName = "maria" or firstName = "smith" or lastName = "smith"` — finds anyone named "Maria" or "Smith".

**Why `=` is case-insensitive**: CT documentation explicitly states string predicates are case-insensitive. Confirmed in CT API behaviour: `firstName = "sofia"` matches records with `"Sofia"`, `"SOFIA"`, `"sofia"`.

**Alternative: CT Customer Search API** (`POST /customers/search`): Supports full-text search including partial matching. Requires a separate feature flag enabled on the CT project and a different API call pattern. Deferred — it is a future improvement, not a quick fix.

## Risks / Trade-offs

- **Exact match only**: Agents must type the full first or last name. "Jo" will not find "Johnson". This is a known limitation, communicated in FEATURES.md. Future improvement: adopt the CT Customer Search API when needed.
- **No change to UX**: The dropdown still appears; the minimum 2-character guard still applies. The only change is the predicate sent to CT.

## Migration Plan

No data migration. No CT project changes. Deploy the route change and the feature is immediately functional.
