## Why

Agent customer name search is broken with a CT parse error:

```
Malformed parameter: where: Syntax error while parsing 'where'.
Invalid input 'l', expected 'n' or 's' (line 1, column 12):
firstName ilike "sofia%" or lastName ilike "sofia%"
           ^
```

The CT Customers API query predicate parser does not support `ilike` as an operator. The parser recognises `in` and `is` starting with `i`, but not `ilike`. Every name search attempt throws a 500.

The fix is to use CT's `=` operator, which the CT documentation explicitly states is case-insensitive for String fields. `firstName = "sofia"` matches "Sofia", "SOFIA", and "sofia". This directly resolves the original complaint ("typing 'johnson' doesn't find Johnson").

The trade-off: `=` is exact match, not partial. Agents must type the full first or last name. This is a step down from the intended prefix search, but it is correct and functional — versus the current state of completely broken.

## What Changes

- Replace `ilike` prefix clauses with `=` equality clauses for `firstName` and `lastName`.
- Tokenise the input on whitespace so "Maria Smith" searches first name "Maria" OR last name "Smith".
- Update FEATURES.md to accurately describe the search as exact-match (case-insensitive).

## Capabilities

### Modified Capabilities

- `agent-customer-lookup`: Name search now uses CT `=` (case-insensitive exact match per token). Searching "johnson" finds "Johnson". Searching "maria smith" finds anyone named "Maria" or "Smith".

## Impact

- **`site/app/api/agent/customers/lookup/route.ts`** — replace `ilike` clauses with `=` clauses; keep token splitting.
- **`FEATURES.md`** — correct the search description.
