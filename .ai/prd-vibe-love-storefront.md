# PRD — Vibe Love Storefront

## Section 1 — Document Header

| Field | Value |
|---|---|
| Product / Feature Name | Vibe Love — Multi-Brand Storefront Demo |
| Author | AI-generated draft (discovery: Piotr Bukala) |
| Date | 2026-04-16 |
| Status | Draft |
| Version | 0.1 |
| Confidence Level | High |
| Elevator Pitch | A second branded storefront — "Vibe Love" — running on the same commercetools backend as an existing B2C starter, scoped to a home accessories product selection with store-specific pricing and inventory, proving that one CT backend can power multiple distinct brands without duplicating infrastructure. |

---

## Section 2 — Problem Hypothesis

> We believe that **prospective commercetools clients and internal stakeholders** experience **scepticism or lack of imagination** when trying to **visualise how a single CT backend can serve multiple distinct brands simultaneously**. This causes **longer sales cycles and missed opportunities to demonstrate platform value**. We know this problem is real because demo assets in the golden demo portfolio currently show only a single-brand setup, leaving the multi-brand capability unarticulated in live code.

- **Severity rating**: Significant — the absence of a compelling multi-brand demo means a core CT differentiator goes undemonstrated in pitches.
- **Frequency vs. acuity**: This affects every pitch where multi-brand or multi-store capability is a prospect requirement — likely a significant proportion of enterprise opportunities.
- **Cost of inaction**: The gap stays open. Prospects either don't believe the capability is real, or require a bespoke proof-of-concept that takes weeks to build each time.
- **Supporting evidence**: [ASSUMPTION] — portfolio gap identified from internal need, not formal research. Signal strength: practitioner judgement from repeated client engagements.

---

## Section 3 — Riskiest Assumptions

| Assumption | Confidence | How to test it | Kill threshold |
|---|---|---|---|
| The CT `home-accessories-store` store correctly scopes product catalogue, prices, and inventory so that only Product Selection items appear with store-specific pricing | Medium | Run the storefront end-to-end: browse PLP/PDP, verify product count matches selection, confirm prices and stock are store-scoped | Any product outside the selection appears, or prices/inventory are not store-scoped |
| CT checkout flow completes correctly when the store context (`home-accessories-store`) is passed through the cart and order creation | Medium | Place a test order end-to-end in the demo environment | Checkout fails or order is created without store association |
| The existing B2C starter frontend codebase can be store-scoped by configuration alone (env vars / feature flags), without structural refactoring | High | Inspect CT client initialisation and API calls; confirm `storeKey` can be injected consistently | Core data-fetching logic requires structural changes that risk breaking the original storefront |
| A visual rebrand (colours, typography, logo, homepage content) is sufficient to make "Vibe Love" feel like a genuinely distinct brand to a business audience | Medium | Show the demo to one internal stakeholder unfamiliar with the project; ask whether it reads as a different brand | Stakeholder immediately recognises it as a reskin rather than a distinct brand |
| Product data already loaded in CT is visually compelling enough for a home accessories demo without additional content work | Low | Browse the PLP/PDP in the context of the new brand; assess lifestyle fit | Products look like furniture or are so generic they undermine the brand story |

---

## Section 4 — Who We Are Building For

### Primary Persona — The Business Decision Maker in a CT Sales Pitch

**Who they are:** A Head of Digital Commerce or VP of E-commerce at a mid-to-large retailer. They are evaluating commercetools for a platform migration or new brand launch. They understand commerce strategy but do not read code. They think in terms of time-to-market, operational overhead, and brand autonomy.

**Job-to-be-done:** "When I am evaluating a composable commerce platform, I want to see a live demonstration that multiple brands can run independently on one backend, so I can understand whether I need one platform contract or several."

**What they do today:** They rely on slide decks, architecture diagrams, and vendor claims. They have no live evidence of multi-brand capability working at the storefront level.

**First-person frustration quote:** *"I keep hearing 'one platform, many brands' but no one ever shows me what that actually looks like when a customer lands on the second brand's site. Is it just a colour change, or does it actually show different products and prices?"*

**How they will know it worked:** They see two visually distinct storefronts, both live, showing different products, different prices, and completing checkout — all explained as one CT project.

---

### Secondary Persona — The Technical Evaluator

**Who they are:** A solutions architect or senior developer at the same prospect company, sitting in on the demo. They want to know how the multi-store scoping is implemented and whether the architecture is clean.

**Job-to-be-done:** "When I see a multi-brand demo, I want to understand the configuration model behind it, so I can judge whether our team could maintain and extend it."

**How they will know it worked:** The Merchant Centre walkthrough (handled separately) clearly shows the store, channel, and product selection configuration — and maps directly to what they saw in the storefront.

---

### Who We Are NOT Building For

This storefront is not built for end consumers browsing to buy home accessories. It is a demonstration asset. Conversion optimisation, SEO, accessibility compliance beyond basic standards, and production-grade performance at scale are out of scope for this phase. We are also not building for developers who need a reference implementation — that is the role of the original B2C starter; this is a demo layer on top of it.

---

## Section 5 — Pain Points and Unmet Needs

**Pain 1: Multi-brand capability is asserted, not demonstrated**
> *"Every vendor says their platform does multi-brand. I need to see it live — different URL, different look, different products, same backend."*
**Severity:** High — this is the entire premise of the demo asset.
**Current state:** Not addressed. The existing golden demo portfolio shows a single-brand storefront.

---

**Pain 2: Store-scoped pricing is invisible in current demos**
> *"I sell the same products at different prices in different regions or through different brands. No one's ever shown me how that works in a real storefront."*
**Severity:** High — price channel scoping is a key CT differentiator that currently goes undemonstrated.
**Current state:** Not addressed.

---

**Pain 3: Inventory scoping is assumed, not shown**
> *"If I'm running two brands, I need to know whether stock is shared or brand-specific. I've never seen a demo that shows that clearly."*
**Severity:** Medium — important for operations-focused stakeholders.
**Current state:** Not addressed.

---

**Pain 4: A reskin demo feels unconvincing**
> *"I've seen demos where they just changed the logo and called it a second brand. That's not the same as a real brand experience."*
**Severity:** Medium — credibility risk if the visual rebrand is too shallow.
**Current state:** Risk to mitigate. The "Vibe Love" brand must feel genuinely premium and distinct, not a palette swap.

---

**Pain 5: Demo assets are one-off builds, not reusable**
> *"Every time we need to show this, someone rebuilds it from scratch. It's not a real asset — it's a side project."*
**Severity:** Medium — internal efficiency and portfolio value.
**Current state:** Partially addressed by this initiative; reusability must be a design principle.

---

## Section 6 — Solution Hypotheses

**Hypothesis 1 — CT Store Scoping**
> We believe that **configuring the frontend to pass `storeKey: home-accessories-store` to all CT API calls** will result in **product catalogue, prices, and inventory automatically scoped to that store** for the Vibe Love storefront. We will know this is true when **browsing the PLP shows only Product Selection items, PDP prices match the store channel, and stock levels reflect store-specific inventory**.

- **Minimum version:** `storeKey` injected via environment variable; all existing API calls pass it through.
- **Full version:** Store context also reflected in cart, checkout, and order creation.
- **Why minimum first:** If catalogue scoping doesn't work, the rest of the demo is irrelevant.

---

**Hypothesis 2 — Visual Brand Identity**
> We believe that **replacing the colour palette, typography, logo, and homepage content** will result in **business users perceiving "Vibe Love" as a distinct premium brand** rather than a reskin of the original storefront. We will know this is true when **an unfamiliar stakeholder describes the two storefronts as "completely different brands" without prompting**.

- **Minimum version:** New colour tokens, "Vibe Love" logo, updated homepage hero and copy.
- **Full version:** Custom typography, lifestyle imagery, brand-specific category landing pages.
- **Why minimum first:** Colour, logo, and hero content carry 80% of brand perception. Typography and category pages can follow.

---

**Hypothesis 3 — End-to-End Demo Flow**
> We believe that **a fully working add-to-cart, checkout, and order confirmation flow within the store context** will result in **technical evaluators accepting the architecture as production-credible**. We will know this is true when **a test order is created in CT with the correct store association**.

- **Minimum version:** Checkout completes; order visible in CT with `home-accessories-store` context.
- **Full version:** Order confirmation page reflects brand styling and store-specific details.
- **Why minimum first:** Completion of checkout is the proof point. Styling is secondary.

---

## Section 7 — Desired Outcomes

| User Outcome | Leading Indicator | Lagging Indicator |
|---|---|---|
| Business users understand that one CT backend can power multiple brands with distinct catalogues, prices, and inventory | Demo walkthrough completes without stakeholder confusion or questions that expose missing functionality | Multi-brand capability cited as a differentiator in post-pitch feedback |
| Technical evaluators accept the architecture as clean and maintainable | No architecture questions arise during demo that cannot be answered by the Merchant Centre walkthrough | Prospect requests a follow-up technical deep-dive (positive signal) |
| The demo asset is reusable across different CT backends with minimal reconfiguration | Second deployment to a different CT backend completed in under 1 day | Demo used in 3+ pitches without rebuilding |
| "Vibe Love" is perceived as a premium home accessories brand, not a reskin | Internal stakeholder review confirms brand feels distinct | No prospect comments suggest the brand feels templated |
| End-to-end checkout flow completes reliably in demo conditions | Zero checkout failures in rehearsal runs | Zero checkout failures during live demos |

---

## Section 8 — Functional Requirements

### Must Have

| ID | Title | Description | Priority | Persona(s) |
|---|---|---|---|---|
| FR-001 | CT Store Context Injection | All CT API calls (product queries, price lookups, inventory, cart, checkout) pass `storeKey: home-accessories-store` | Must Have | Business DM, Technical Evaluator |
| FR-002 | Product Selection Filtering | PLP and search return only products included in the store's Product Selection; no out-of-selection products are visible | Must Have | Business DM |
| FR-003 | Store-Scoped Pricing | Product prices displayed on PDP and in cart are fetched from the store's assigned price channel | Must Have | Business DM |
| FR-004 | Store-Scoped Inventory | Stock availability (in-stock / out-of-stock) reflects the store's assigned inventory channel | Must Have | Business DM |
| FR-005 | Vibe Love Logo | "Vibe Love" brand name appears in the site header as the logo, replacing the existing brand mark | Must Have | Business DM |
| FR-006 | Brand Colour Palette | All primary UI colours (background, text, buttons, accents) replaced with Vibe Love palette (calm, muted, premium — reference: myhoneyhome.pl) | Must Have | Business DM |
| FR-007 | Homepage Rebrand | Homepage hero section updated with Vibe Love headline, subheadline, and CTA copy appropriate to a home accessories brand | Must Have | Business DM |
| FR-008 | End-to-End Checkout | Add-to-cart → checkout → order confirmation flow completes; order created in CT with correct store association | Must Have | Technical Evaluator |

**Acceptance Criteria — FR-001**
```
Given the Vibe Love storefront is running with NEXT_PUBLIC_CTP_STORE_KEY=home-accessories-store
When any CT API call is made (product query, cart mutation, order creation)
Then the request includes the store key in the CT API path or context header
And the response is scoped to that store's configuration
```

**Acceptance Criteria — FR-002**
```
Given a Product Selection is configured in CT for home-accessories-store
When a user visits the PLP or performs a search
Then only products included in the Product Selection are returned
And no products outside the selection appear in any listing or search result

Given a product exists in the CT catalogue but is NOT in the Product Selection
When a user navigates directly to that product's URL
Then a 404 or "not found" response is returned
```

**Acceptance Criteria — FR-003**
```
Given a product has prices configured for the store's channel in CT
When a user views the PDP
Then the price displayed matches the store-channel price in CT
And not the base catalogue price

Given a product has no price for the store's channel
When a user views the PDP
Then the product is either hidden or shown as unavailable
```

**Acceptance Criteria — FR-004**
```
Given inventory is configured per channel in CT and the store has an assigned inventory channel
When a user views a product
Then the stock status (in-stock / out-of-stock) reflects the store's inventory channel
And not the global inventory aggregate
```

**Acceptance Criteria — FR-005**
```
Given the storefront is loaded
When any page is rendered
Then the header displays "Vibe Love" as the brand name or logo
And no reference to the original brand name is visible
```

**Acceptance Criteria — FR-006**
```
Given the Vibe Love colour tokens are applied
When any page is rendered
Then primary buttons, backgrounds, and text colours use the Vibe Love palette
And no original brand colours appear in the UI
```

**Acceptance Criteria — FR-007**
```
Given a user visits the homepage
When the page loads
Then the hero section displays Vibe Love headline and CTA copy
And the copy references home accessories, not furniture
```

**Acceptance Criteria — FR-008**
```
Given a user adds a store-scoped product to cart
When they proceed through checkout and confirm
Then an order is created in CT
And the order has storeRef set to home-accessories-store
And the order confirmation page is displayed to the user
```

---

### Should Have

| ID | Title | Description | Priority | Persona(s) |
|---|---|---|---|---|
| FR-009 | Environment Variable Driven Store Config | Store key, channel keys, and any store-specific config are driven by environment variables, not hardcoded | Should Have | Technical Evaluator |
| FR-010 | Homepage Featured Products | Homepage features a curated selection of home accessories products from the store's Product Selection | Should Have | Business DM |
| FR-011 | Brand Typography | Custom font pairing applied to headings and body text, consistent with Vibe Love's premium aesthetic | Should Have | Business DM |

**Acceptance Criteria — FR-009**
```
Given a .env file with NEXT_PUBLIC_CTP_STORE_KEY and related channel variables
When the application starts
Then all CT calls use the values from environment variables
And changing the env var to a different store key causes all CT calls to use the new store without code changes
```

---

### Could Have

| ID | Title | Description | Priority |
|---|---|---|---|
| FR-012 | Category Landing Pages | Brand-specific copy and imagery on category-level pages | Could Have |
| FR-013 | Brand-Specific Footer | Footer content (tagline, links) updated to reflect Vibe Love brand | Could Have |
| FR-014 | Demo Reset Script | Script or CT import that resets product selection and store config to a known demo state | Could Have |

---

### Won't Have (this phase)

| ID | Title | Reason |
|---|---|---|
| FR-015 | Separate deployment pipeline | Out of scope — single Netlify/Vercel deploy with env var switching is sufficient for demo |
| FR-016 | Multi-language support for Vibe Love | Original starter handles i18n; no new languages needed for demo |
| FR-017 | Production SEO configuration | Demo asset, not a production storefront |

---

## Section 9 — Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | PLP renders within 3 seconds on a standard broadband connection; acceptable for live demo conditions |
| Scalability | Must support concurrent use by a single demo presenter; no concurrent user scaling required |
| Availability | Must be reliably available during scheduled demo sessions; Netlify/Vercel uptime SLA sufficient |
| Security | CT API credentials stored in environment variables, never exposed client-side; standard Next.js security model maintained |
| Privacy / Compliance | Demo data only; no real customer PII; GDPR not applicable to demo environment |
| Accessibility | WCAG 2.1 AA maintained at the level of the original B2C starter; no regression introduced |
| Internationalisation | English only for Vibe Love demo; existing i18n infrastructure preserved but not extended |
| Maintainability | Store configuration via environment variables only; no store-specific logic hardcoded; a new store deployable by changing env vars and redeploying |
| Reusability | A developer unfamiliar with the project can deploy the storefront to a different CT backend in under 1 day using the README alone |

---

## Section 10 — What We Are Not Building (and Why)

**1. A production-ready e-commerce storefront**
Considered because the demo should look real. Excluded because production requirements (SEO, accessibility audit, performance optimisation at scale, security hardening) are not relevant to a demo portfolio asset and would significantly increase scope.

**2. A separate codebase for Vibe Love**
Considered because brand separation feels natural. Excluded because the entire point of this initiative is to demonstrate a single codebase serving multiple brands — maintaining two repos would contradict the message.

**3. Custom checkout flow for Vibe Love**
Considered because branded checkout improves immersion. Excluded because the checkout's correctness (store association on the order) is the proof point; styling is secondary, and CT's checkout flow handles the critical path.

**4. A CT data setup or import tool**
Considered because demo reusability requires consistent data. Excluded because the CT environment is already configured (`home-accessories-store`, Product Selection, channels, inventory all loaded). A reset/seed script is a "could have" for future reusability, not an MVP requirement.

**5. A/B testing or personalisation features**
Considered because CT supports these capabilities. Excluded because they are separate demo stories — adding them here would dilute the multi-brand message and complicate the demo script.

---

## Section 11 — Tradeoffs and Alternatives Considered

**Decision 1: Environment variable driven store scoping vs. URL-based multi-tenancy**
- **Decided:** Single Next.js deployment; store key injected via environment variable at build/deploy time.
- **Alternatives:** (a) Route-based multi-tenancy (`/vibe-love/*` vs `/original/*`) in a single deployment; (b) Separate deployments per brand, sharing no code.
- **Why this path:** The demo context is a dedicated Vibe Love URL. Env var injection is the simplest path that proves configurability without requiring runtime multi-tenancy logic. It also maps directly to how a real client would deploy separate brand storefronts.
- **Risk:** The demo cannot show both brands side-by-side in a single deployment. Mitigated by keeping the original B2C starter deployed separately.

**Decision 2: Reuse all existing components vs. building a new design system**
- **Decided:** Reuse all existing components; apply brand via CSS custom properties / Tailwind config only.
- **Alternatives:** (a) Build new brand-specific components; (b) Introduce a component library abstraction layer.
- **Why this path:** Speed and demo fidelity. The existing components are well-tested. Changing design tokens achieves the visual goal without risking regressions in functionality.
- **Risk:** Some components may have hardcoded colours or styles that resist tokenisation. Mitigated by auditing token usage before committing to approach.

**Decision 3: Homepage hero as primary brand expression vs. full page redesign**
- **Decided:** Homepage hero (headline, subheadline, CTA, background/imagery) as the primary brand differentiator.
- **Alternatives:** (a) Full homepage redesign with new section layouts; (b) Only logo + colour change.
- **Why this path:** Hero content carries the highest brand perception weight for a first impression in a demo. Full redesign is disproportionate to the demo use case. Logo-only change risks the "reskin" perception.
- **Risk:** Hero content depends on product imagery quality in CT. If loaded products don't photograph well as home accessories, the hero will feel generic. [OPEN QUESTION: What imagery is available in CT for the home-accessories-store products?]

**Decision 4: Demo on existing CT environment vs. standing up a new CT project**
- **Decided:** Use the existing CT environment with `home-accessories-store` already configured.
- **Alternatives:** (a) Provision a new CT project for the demo; (b) Use CT free tier.
- **Why this path:** Data is already loaded. Provisioning a new project adds time and risk with no demo value added.
- **Risk:** If CT environment credentials are rotated or the store config changes, the demo breaks. Mitigated by treating the CT config as stable demo infrastructure and documenting it.

---

## Section 12 — MVP Definition

**The one thing:** CT store scoping working end-to-end (FR-001 through FR-004 + FR-008). If the catalogue, pricing, inventory, and checkout are not store-scoped, the demo's core message fails regardless of how the brand looks. Brand identity (FR-005 to FR-007) is the second priority — necessary for business-user credibility but not the technical proof point.

**MVP scope:**

| Requirement | Why it must be in MVP |
|---|---|
| FR-001 — CT Store Context Injection | Foundation for all store-scoped behaviour |
| FR-002 — Product Selection Filtering | Visually proves "different catalogue, same backend" |
| FR-003 — Store-Scoped Pricing | Visually proves "different prices, same backend" |
| FR-004 — Store-Scoped Inventory | Completes the store-scoping story |
| FR-005 — Vibe Love Logo | Minimum brand differentiation |
| FR-006 — Brand Colour Palette | Minimum brand differentiation |
| FR-007 — Homepage Rebrand | Minimum hero content for brand credibility |
| FR-008 — End-to-End Checkout | Proves commercial completeness of the scoped store |

**MVP exclusions:**
- FR-009 (env var config) — can be added immediately after MVP; does not affect demo quality
- FR-010 (featured products on homepage) — nice to have; hero is sufficient
- FR-011 (brand typography) — enhances premium feel but not critical for first demo run

**Definition of done:**
- All PLP products are from the home-accessories-store Product Selection
- PDP prices match store channel configuration in CT
- A test order completes and is visible in CT with `storeRef: home-accessories-store`
- "Vibe Love" logo and colour palette are live
- Homepage hero copy references home accessories
- Demo has been run once end-to-end without errors in the target environment

---

## Section 13 — North Star Metric

**Metric:** End-to-end demo completion rate — the percentage of demo rehearsals (and live demos) that complete the full flow (browse PLP → view PDP with store price → add to cart → checkout → order confirmed) without an error or interruption caused by a technical failure.

**Why this metric:** This is a demo asset. Its purpose is to work flawlessly when it matters. Any technical failure during a demo negates the value of the asset regardless of how compelling the brand looks.

**Target movement:**

| Timeframe | Target |
|---|---|
| 30 days (rehearsal phase) | 100% of rehearsal runs complete without technical failure |
| 90 days (active use) | Used in 3+ pitches; 0 demo failures attributed to storefront issues |
| 6 months | Asset deployed to a second CT backend by a team member not involved in original build |

**Vanity metric risk:** "The demo looks great" is not success. A demo that looks polished but fails at checkout, or shows products outside the selection, has failed its purpose. Track completion, not visual quality alone.

---

## Section 14 — Experiment and Instrumentation Plan

**Hypothesis being tested:** A single CT backend with store/channel/product-selection configuration can power two visually distinct, commercially complete branded storefronts — and a business audience will find this demonstration credible.

**Experiment design:** Internal stakeholder review (Wizard of Oz style). Before external use, present both storefronts (original B2C starter + Vibe Love) to one internal stakeholder unfamiliar with the project. Observe their reaction without prompting. Ask: "What do you see here?" and "Do these feel like different brands?" Record unscripted responses.

**Sample:** 1–2 internal stakeholders (N is small; this is a qualitative credibility check, not a statistical study).

**Duration:** Single session before first external demo use.

**Instrumentation (minimal, demo context):**
- CT API call logs confirming `storeKey` is present on all requests
- CT order query confirming `storeRef` on test orders
- Manual checklist executed before each demo: PLP product count matches expected selection, PDP price matches CT channel price, checkout completes, order appears in CT with correct store ref
- [ASSUMPTION] No analytics instrumentation required for a demo asset; manual checklist is sufficient

---

## Section 15 — Success and Failure Criteria

**Success — demo asset is ready and credible:**
- PLP returns only products from the home-accessories-store Product Selection (verifiable against CT config)
- PDP prices match store channel prices (verifiable against CT channel config)
- Checkout completes; order has correct `storeRef` in CT
- Internal stakeholder review confirms brand reads as distinct and premium
- Demo runs end-to-end without errors in two consecutive rehearsals

**Failure — stop or pivot:**
- CT store scoping does not work as expected after investigation (catalogue, pricing, or inventory not scoped) → escalate to CT configuration review before continuing frontend work
- Checkout fails to associate orders with the store → investigate CT cart/order API store context handling
- Brand perception test fails (stakeholder cannot distinguish brands) → invest in deeper visual differentiation (typography, imagery, layout variation)

**Iteration triggers:**
- Demo is used in a pitch and stakeholders ask questions that reveal gaps in the story → add missing demo content (e.g. side-by-side Merchant Centre view)
- CT environment changes break the demo → add demo reset documentation and/or CT config export
- A second brand demo is requested for a different product category → validate that env var switching is sufficient and document the steps

---

## Section 16 — Risks and Mitigations

| ID | Risk | Likelihood | Impact | Score | Mitigation | Contingency | Owner |
|---|---|---|---|---|---|---|---|
| R-001 | CT store scoping does not filter correctly — products outside selection appear, or prices are not channel-scoped | M | H | 6 | Test CT API calls directly (Postman/CT playground) before frontend integration; verify store/channel/selection config in MC | Fix CT configuration before proceeding; frontend is not the source of truth for this | Piotr |
| R-002 | Checkout fails to pass store context, breaking order association | M | H | 6 | Audit existing cart/checkout code for CT API call structure; confirm `storeKey` path is applied to cart mutations | Manually verify CT API path format for store-scoped cart/order endpoints | Piotr |
| R-003 | Visual rebrand is too shallow — business users perceive it as a reskin | M | M | 4 | Use myhoneyhome.pl as reference; invest in hero copy and imagery; conduct internal review before external use | Add typography customisation and/or category-level content to increase visual distance | Piotr |
| R-004 | Product imagery in CT is not suitable for a premium home accessories brand | H | M | 6 | Review product images in CT before starting homepage design; assess fit for "Vibe Love" aesthetic | Replace hero with lifestyle photography (stock imagery); use image from external source if needed | Piotr |
| R-005 | Demo environment CT credentials are rotated or store config changes, breaking the demo without warning | L | H | 3 | Document CT environment config; store credentials in a secure env var file with instructions | Maintain a backup env file; document how to reconfigure | Piotr |
| R-006 | Colour/typography tokens are hardcoded in components and cannot be overridden without code changes | M | M | 4 | Audit Tailwind config and component styles before committing to token-only approach | Targeted component edits for non-tokenised styles; document exceptions | Piotr |

---

## Section 17 — Dependencies and Integrations

| Dependency | What it provides | Exists or must be built | Risk if delayed |
|---|---|---|---|
| CT `home-accessories-store` store | Store context for scoping all API calls | Exists (configured in CT) | H — entire demo is blocked without this |
| CT Product Selection for home-accessories-store | Filtered product catalogue | Exists (loaded in CT) | H — PLP cannot demonstrate scoping without this |
| CT Store-scoped price channel | Store-specific pricing | Exists (loaded in CT) | H — pricing demo fails without this |
| CT Store-scoped inventory channel | Store-specific inventory | Exists (loaded in CT) | M — stock display affected; checkout may still work |
| Existing B2C starter frontend codebase | Component library, routing, CT API client, checkout flow | Exists (this repo) | H — all frontend work builds on this |
| CT API credentials for demo environment | Authentication for all CT API calls | Exists (in .env) | H — no CT data without credentials |
| Design reference (myhoneyhome.pl) | Visual direction for Vibe Love brand | Exists (external reference) | L — reference only; does not block development |

---

## Section 18 — Timeline and Phases

### Phase 1 — CT Integration Verification (Days 1–2)

**Goal:** Confirm that CT store scoping works end-to-end before investing in UI work.
**Scope:** FR-001, FR-002, FR-003, FR-004, FR-008 (headless / API level testing)
**Exit criteria:** Test CT API calls confirm product selection filtering, store-scoped prices, and store-scoped inventory. A test order with `storeRef` is visible in CT.

---

### Phase 2 — Brand Identity Implementation (Days 3–5)

**Goal:** Vibe Love brand is visible and credible in the storefront.
**Scope:** FR-005, FR-006, FR-007, FR-011 (if time permits)
**Exit criteria:** Storefront renders with Vibe Love logo, colour palette, and homepage hero copy. Internal stakeholder review confirms brand reads as distinct.

---

### Phase 3 — End-to-End Demo Polish (Days 6–7)

**Goal:** Full demo flow works without errors; asset is rehearsal-ready.
**Scope:** FR-009, FR-010 (if time permits), FR-013 (if time permits), manual QA checklist
**Exit criteria:** Two consecutive end-to-end demo runs complete without errors. README documents environment variable configuration for reuse on a new CT backend.

---

| Phase | Duration | Key Deliverable | Exit Criteria |
|---|---|---|---|
| 1 — CT Integration Verification | 2 days | Store-scoped API calls confirmed working | Test order with correct storeRef visible in CT |
| 2 — Brand Identity | 3 days | Vibe Love brand live in storefront | Internal stakeholder confirms brand feels distinct |
| 3 — Demo Polish & Documentation | 2 days | Full demo flow rehearsal-ready | 2x end-to-end runs without errors; README updated |

---

## Section 19 — What Does Success Look Like in 6 Months?

*Written as a retrospective from 6 months after launch.*

The Vibe Love demo became one of the most-used assets in the golden demo portfolio. In the first two months, it was shown in four client pitches — in three of those, the multi-brand demonstration directly addressed a prospect question that had previously required a bespoke slide or verbal explanation. The demo answered the question live, in a browser, in under three minutes.

The CT integration held up perfectly. Store-scoped pricing and Product Selection filtering worked exactly as configured. Two of the four pitches included a Merchant Centre walkthrough immediately after the storefront demo, and the connection between configuration and experience landed clearly for both technical and business audiences.

What surprised us most was how little the brand depth mattered in practice. Business users were more impressed by the fact that changing an environment variable switched the entire storefront to a different brand's product catalogue and pricing than they were by the visual design. The Vibe Love aesthetic was good enough to establish brand distinction — but the data story was the real differentiator.

Six months in, a colleague deployed the storefront to a second CT backend for a different client demo in about half a day, using the README alone. The reusability goal was validated.

*"I didn't realise it was the same platform until you told me. The products were different, the prices were different, it looked completely different. And you're saying that's one codebase?"* — internal stakeholder, first rehearsal review.

---

## Section 20 — Open Questions and Decisions Log

| ID | Question or Decision | Why It Matters | Owner | Target Resolution |
|---|---|---|---|---|
| OQ-001 | What product imagery is available in CT for home-accessories-store products? Does it support a premium brand aesthetic? | If imagery is poor quality or tonally wrong (e.g. furniture photos), the homepage hero and PDP will undermine the Vibe Love brand | Piotr | Before Phase 2 begins |
| OQ-002 | What is the exact CT API path structure for store-scoped product queries and cart/order mutations in the current version of the CT client used in this repo? | Determines how much CT client code needs to change vs. configuration | Piotr | End of Phase 1 |
| OQ-003 | Are colour tokens in the existing codebase applied via Tailwind config, CSS custom properties, or hardcoded in components? | Determines whether brand palette can be applied without touching component code | Piotr | Before Phase 2 begins |
| OQ-004 | Is there a preferred font pairing for Vibe Love, or should one be selected based on the myhoneyhome.pl reference? | Affects Phase 2 typography work | Piotr | Before Phase 2 begins |
| OQ-005 | Should the demo README include steps to provision a new CT store, or only steps to point to an existing one? | Determines scope of reusability documentation | Piotr | Phase 3 |

---

## Section 21 — Appendix

### Glossary

| Term | Definition |
|---|---|
| Product Selection | A CT feature that creates a curated subset of the full product catalogue, assignable to a specific store |
| Store | A CT entity representing a branded sales channel; scopes product catalogue, pricing, and inventory |
| Channel | A CT entity used to associate prices and inventory with a specific store or region |
| storeKey | The unique identifier for a CT store, used in API paths to scope requests (e.g. `home-accessories-store`) |
| Golden demo | A reusable, polished demo asset used across multiple client pitches |
| B2C starter | The existing Next.js + commercetools frontend codebase this project is built on top of |

### Related Resources

| Resource | Description |
|---|---|
| CT store: `home-accessories-store` | Pre-configured in the demo CT environment |
| Reference brand: myhoneyhome.pl | Visual direction for Vibe Love premium aesthetic |
| Original B2C starter repo | `pbukala-ct/b2c-starter-pb` — parent codebase |
| Vibe Love repo | `pbukala-ct/b2c-starter-vibe-love` — this project |
