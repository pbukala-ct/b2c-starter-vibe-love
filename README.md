# Vibe Home

A full-featured B2C ecommerce storefront built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS v4**, and **commercetools** as the headless commerce backend.

Features include product catalog & search, cart, checkout with Subscribe & Save, customer accounts, address book, order history, and recurring order management.

---

## Project Structure

```
vibe2/
├── site/          # Next.js storefront
├── tools/         # Admin scripts for CT setup and data exploration
├── netlify.toml   # Netlify build configuration
└── .gitignore
```

---

## Prerequisites

- Node.js 18+
- npm 9+
- A commercetools project in the US region ([sign up free](https://commercetools.com))

---

## Step 1 — Create the Storefront API Client

In the CT Merchant Center go to **Settings → Developer → API Clients** and create a new client named `vibe-storefront`. Grant **only** the following scopes — do **not** select `manage_project`:

| Scope | Used for |
|---|---|
| `view_products` | Product catalog search and categories |
| `view_project_settings` | Country and currency configuration |
| `manage_customers` | Sign-in, registration, profile, addresses |
| `manage_orders` | Cart, checkout, order history, shipping methods |
| `manage_payments` | Payment records at checkout |
| `manage_recurring_orders` | Subscribe & Save orders and recurrence policies |
| `manage_custom_objects` | Stored payment methods (masked card records) |

After creating the client, copy the **Client ID** and **Client Secret** — they are shown only once.

---

## Step 2 — Create `site/.env`

Create a file named `.env` inside the `site/` directory:

```
CTP_PROJECT_KEY=your-project-key
CTP_CLIENT_ID=your-client-id
CTP_CLIENT_SECRET=your-client-secret
CTP_AUTH_URL=https://auth.us-central1.gcp.commercetools.com
CTP_API_URL=https://api.us-central1.gcp.commercetools.com
CTP_SCOPES=view_products:your-project-key view_project_settings:your-project-key manage_customers:your-project-key manage_orders:your-project-key manage_payments:your-project-key manage_recurring_orders:your-project-key manage_custom_objects:your-project-key
SESSION_SECRET=replace-with-a-long-random-string
```

**Region:** The URLs above are for US-Central (GCP). See [CT region endpoints](https://docs.commercetools.com/api/general-concepts#regions) if your project is hosted elsewhere.

**SESSION_SECRET:** Must be a long, unpredictable string used to sign session cookies. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 3 — Install and Run Locally

```bash
cd site
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Netlify

`netlify.toml` at the repo root configures the build automatically — Netlify will install dependencies, build from the `site/` directory, and enable Next.js App Router support via `@netlify/plugin-nextjs`.

### First deploy

1. Push this repository to GitHub.
2. In the [Netlify dashboard](https://app.netlify.com), click **Add new site → Import an existing project**.
3. Connect to GitHub and select this repository.
4. Netlify will detect `netlify.toml` and pre-fill the build settings — no changes needed.
5. Click **Deploy site**.

### Environment variables

After the site is created, go to **Site configuration → Environment variables** and add every variable from `site/.env`:

- `CTP_PROJECT_KEY`
- `CTP_CLIENT_ID`
- `CTP_CLIENT_SECRET`
- `CTP_AUTH_URL`
- `CTP_API_URL`
- `CTP_SCOPES`
- `SESSION_SECRET`

### Automatic deploys on push

Once the GitHub repo is connected, every push to the **main** branch automatically triggers a new Netlify build and deployment. This is Netlify's default behavior — no additional configuration is required.

---

## Admin Tools (`tools/`)

The `tools/` directory contains Node.js scripts for catalog exploration, tax setup, shipping configuration, and other administrative tasks. These use a **separate CT API client** with full `manage_project` scope and should never be mixed with the storefront credentials.

The shared admin CT client lives in **`tools/ct-admin.mjs`** and is imported by all tool scripts.

### Create the admin credentials

Create **`tools/.env`**:

```
CTP_PROJECT_KEY=your-project-key
CTP_CLIENT_ID=your-admin-client-id
CTP_CLIENT_SECRET=your-admin-client-secret
CTP_AUTH_URL=https://auth.us-central1.gcp.commercetools.com
CTP_API_URL=https://api.us-central1.gcp.commercetools.com
CTP_SCOPES=manage_project:your-project-key
```

Create a **separate** API client in the CT Merchant Center with `manage_project` scope for use with these tools. Never copy this credential into `site/.env`.

### Run a tool

```bash
cd tools
npm install
node explore-catalog.mjs
```

---

## Environment File Summary

| File | Scope | Purpose |
|---|---|---|
| `site/.env` | 7 targeted scopes | Storefront runtime — set these in Netlify too |
| `tools/.env` | `manage_project` | Admin tools only — never used by the storefront |

Neither file is committed to version control (covered by `.gitignore`).

---

## Tech Stack

- [Next.js 14](https://nextjs.org) App Router + Server Components
- [Tailwind CSS v4](https://tailwindcss.com) with `@theme` block (no config file)
- [commercetools](https://commercetools.com) headless commerce platform
- TypeScript throughout
- Hosted on [Netlify](https://netlify.com)
