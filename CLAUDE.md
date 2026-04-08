# Claude Code Context

## Project Overview
B2C ecommerce storefront using Next.js 14 App Router, TypeScript, Tailwind CSS v4, and commercetools (CT) as the headless commerce backend.

## Directory Layout
- `site/` — Next.js storefront (all source code here)
- `test/` — Playwright E2E tests (generated from `test.txt`)
- `tools/` — Admin scripts for CT data setup and exploration
- `initial_prompt.txt` — The original prompt that generated the site
- `test.txt` — Plain-English test descriptions

## Dev Server
```bash
cd site && npm run dev -- -p 8888
```
Port 8888. The `.claude/launch.json` config is pre-set for this.

## Key Architecture Decisions

### Tailwind CSS v4
Uses `@import "tailwindcss"` and `@theme` block in CSS. There is NO `tailwind.config.ts` file — all theme customization is in the CSS file.

### API Routes as BFF
All CT API calls go through Next.js API routes in `site/app/api/`. The browser never talks to commercetools directly. Secrets (`CTP_CLIENT_SECRET`, `SESSION_SECRET`) are server-only — never prefixed with `NEXT_PUBLIC_`.

### Session Management
JWT-based sessions using the `jose` library. Sessions are stored in an HTTP-only cookie named `vibe-session`. No server-side session store.

### CT Product Search
Always use `language` (not `locale`) in search queries:
```typescript
const query = { exact: { field: 'slug', value: slug, language: 'en-US' } };
```

### CT Login
The login endpoint is `POST /login` (NOT `/customers/login`).

### CT Carts
Carts are created with `shippingMode: 'Single'`. Use `setShippingAddress` + `setShippingMethod` at checkout.

## Environment Files

**CRITICAL: `site/.env` and `tools/.env` are completely separate API clients with different permission scopes. NEVER copy, share, or reuse credentials between them.**

- `site/.env` — **Storefront** API client (limited scope: Frontend B2C + manage_payments, manage_recurring_orders, manage_custom_objects). Also needs `SESSION_SECRET`.
- `tools/.env` — **Admin** API client (`manage_project` scope — can modify or delete anything in the CT project). Used ONLY by scripts in `tools/`.

If `site/.env` is missing, tell the user to create a new **Frontend B2C** API client in Merchant Center. **NEVER copy `tools/.env` to `site/.env`** — this would give the public-facing storefront full admin access to the commercetools project.

Both files are gitignored. Never commit them.

## Adding or Changing Features

Before making changes, read `FEATURES.md` to understand what already exists. After completing a feature change:

1. **Update `FEATURES.md`** — add, modify, or remove entries so it stays accurate.
2. **Update `test.txt`** — add plain-English test descriptions for new functionality.
3. **Regenerate and run tests** — update the Playwright specs in `test/tests/` to match `test.txt`, then run all tests to verify nothing broke.

This keeps the feature inventory, test descriptions, and actual tests in sync.

## Testing
Tests live in `test/tests/`. They run against the live Netlify site by default (`BASE_URL` in `test/playwright.config.ts`). To run locally: `BASE_URL=http://localhost:8888 npx playwright test`

## Tools Pattern
All tools import from `tools/ct-admin.mjs` which reads `tools/.env`. To create a new tool, follow the existing pattern.

## Using Skills
### Features
You have access to the following skills to implement specific features
1. Superuser: customer impersonation [skill](./.claude/skills/superuser/SKILL.md)
2. BOPIS: Buy Online, Pick Up In Store — channel API, supply-channel cart, per-store inventory, channel selector UI [skill](./.claude/skills/bopis/SKILL.md)
3. Bundles: configurable product bundles — CT custom type setup, parent-child line item relationships, cascade cart updates, bundle PDP component [skill](./.claude/skills/bundles/SKILL.md)
4. Variant Config: configure PDP variant selectors — deny list, render style (pill/swatch), color codes, sort order, availability filtering [skill](./.claude/skills/variant-config/SKILL.md)
5. Image Config: configure product image URL transformations — CDN prefixes, resize suffixes, per-context transforms for listing, detail, and thumbnail images [skill](./.claude/skills/image-config/SKILL.md)

### Generic guideline skills
1. Add API: Guidelines to follow when creating a new api call [skill](./.claude/skills/add-api/SKILL.md)
2. Add new country: Guidelines to follow when adding a new country/locale/language [skill](./.claude/skills/add-country/SKILL.md)
3. Netlify: Provision a new Netlify site under the "cofe-pre-sales" team and configure environment variables [skill](./.claude/skills/netlify/SKILL.md)
4. Add homepage element: How to add a new element (banner, section, custom block) to the homepage layout system [skill](./.claude/skills/add-homepage-element/SKILL.md)

