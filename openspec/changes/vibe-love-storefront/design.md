## Context

The project is a Next.js 14 App Router storefront connected to a commercetools backend. All CT API calls go through Next.js API routes (BFF pattern) — the browser never calls CT directly. The CT client is initialised server-side using credentials from `site/.env`.

A second CT store (`home-accessories-store`) is already configured in the CT project with its own Product Selection, price channel, and inventory channel. The goal is to surface this store through the existing frontend codebase with minimal structural change — primarily env-var injection and a visual rebrand.

Colour customisation is done via the `@theme` block in the global CSS file (Tailwind CSS v4 — no `tailwind.config.ts`). There is no existing design token abstraction layer.

## Goals / Non-Goals

**Goals:**
- All CT API calls (product search, PDP, cart create, cart update, order creation) pass the store key in the CT API path
- PLP and search return only products in the `home-accessories-store` Product Selection
- PDP prices and inventory reflect store-scoped channels
- Orders created via checkout have `storeRef: home-accessories-store`
- "Vibe Love" logo, colour palette, and homepage hero copy replace the existing brand
- Store key (and optionally channel keys) are read from environment variables, not hardcoded

**Non-Goals:**
- Route-based or runtime multi-tenancy (both brands in a single deployment)
- Custom checkout UI beyond what already exists
- SEO, analytics, or production performance optimisation
- A second CT project or separate deployment pipeline

## Decisions

### Decision 1: Store key injected via env var into all CT API path segments

CT store-scoped endpoints follow the pattern `/in-store/key=<storeKey>/...`. The store key is read from `NEXT_PUBLIC_CTP_STORE_KEY` at server start and prepended to every CT API route path.

**Rationale**: This is the CT-native pattern. It requires no CT SDK changes — just a path prefix. The env var approach means switching stores is a single variable change plus redeploy, satisfying the reusability requirement.

**Alternative considered**: Passing store context via a request header or SDK option. Rejected because the path-based approach is the standard CT REST pattern and is explicit and auditable in logs.

### Decision 2: CSS custom properties in `@theme` block for brand colours

Vibe Love colour tokens are defined by overriding Tailwind CSS v4 theme variables in `site/app/globals.css`. No new files or build steps needed.

**Rationale**: The project already uses `@theme` for all customisation. Overriding variables here is the lowest-risk path — no component code changes required for components that use semantic colour tokens.

**Alternative considered**: A separate CSS file per brand, loaded conditionally. Rejected because the Vibe Love deployment is a dedicated instance; there is no need for runtime brand switching.

**Risk**: Some components may use hardcoded Tailwind utility classes (e.g. `bg-slate-900`) rather than semantic tokens. These will not be affected by token overrides and will need targeted class replacements. A pre-implementation audit is required.

### Decision 3: Homepage hero content driven by component props, not a CMS

Vibe Love homepage hero copy (headline, subheadline, CTA) is hardcoded in the homepage component for the demo. No CMS or feature-flag system is introduced.

**Rationale**: The demo's homepage content is stable and known. Adding a CMS integration is out of scope and would increase complexity without demo value.

## Risks / Trade-offs

- **Hardcoded component colours** → Audit all components for non-token colour classes before starting brand work; fix any found as part of this change.
- **CT store config changes break the demo** → Document the CT environment as stable demo infrastructure. Store credentials and config live in `site/.env` (gitignored).
- **Checkout store context omission** → The existing cart/checkout code must be audited to confirm every cart mutation and order-creation call includes the store path prefix. Missing even one call will result in an order without `storeRef`.
- **Product imagery quality** → If CT product images are not suitable for a premium home accessories brand, the hero section will use a static lifestyle background rather than a product image.

## Open Questions

- OQ-001: Are there any CT API calls in the codebase that bypass the BFF API routes and call CT directly from the browser? (Expected: no — but must confirm before injecting store key server-side only.)
- OQ-002: Does the CT client library used in this project already support store-scoped paths, or must the path prefix be added manually to each fetch call?
