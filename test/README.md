# Vibe Home — End-to-End Tests

Playwright browser tests covering the three core user journeys.

## Tests

| File | Scenario |
|---|---|
| `1-registered-checkout.spec.ts` | Sign in as jen@example.com, add 3 products, checkout, verify order in My Orders |
| `2-anonymous-checkout.spec.ts` | Add 2 products without signing in, checkout as guest |
| `3-subscription-checkout.spec.ts` | Sign in, subscribe to Ben Pillow Cover, checkout, verify in My Subscriptions |

## Setup

```bash
cd test
npm install
npx playwright install chromium
```

## Run against live site

```bash
npm test
```

## Run against local dev server

```bash
BASE_URL=http://localhost:3000 npm test
```

## Run headed (see the browser)

```bash
npm run test:headed
```

## View report after a run

```bash
npm run report
```
