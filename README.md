# Vibe Home

> **FORK THIS REPO FIRST!** Do not clone directly — click the **Fork** button at the top-right of this page to create your own copy, then clone your fork. This ensures you have your own repository to push changes to and connect to your own Netlify site for automatic deployments.

A full-featured B2C ecommerce storefront built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS v4**, and **commercetools** as the headless commerce backend.

Features include product catalog & search, cart, checkout with Subscribe & Save, customer accounts, address book, order history, and recurring order management.

---

## Project Structure

```
b2c-starter/
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

## Step 1 — Create the Storefront API Client and Save the `.env` File

In the CT Merchant Center go to **Settings → Developer → API Clients** and create a new API Client.  

Select **Frontend B2C** as the template, and add these additional scopes:

| Scope | Used for |
|---|---|
| `manage_payments` | Payment records at checkout |
| `manage_recurring_orders` | Subscribe & Save orders and recurrence policies |
| `manage_custom_objects` | Stored payment methods (masked card records) |

After creating the client, the Merchant Center will show the credentials. Download the **Environment Variables (.env) file** and save it as `site/.env` in your project.

Then open `site/.env` and add this line at the bottom:

```
SESSION_SECRET=replace-with-a-long-random-string
```

Generate a value for `SESSION_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 2 — Install and Run Locally

```bash
cd site
npm install
npm run dev
```

Open http://localhost:8888

---

## Deploying to Netlify

`netlify.toml` at the repo root configures the build automatically — Netlify will install dependencies, build from the `site/` directory, and enable Next.js App Router support via `@netlify/plugin-nextjs`.

### First deploy

1. Push your new repository to GitHub.
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

You will likely create your own tools -- it's super easy, just ask Claude Code to write a tool to perform a certain task and put it in the tools directory.  Claude Code will start by exploring what's there and build (and run) whatever you ask it to.  

This is much more powerful and useful than hooking up MCP, for example, and has the advantage of being repeatable / deterministic.

The shared admin CT client lives in **`tools/ct-admin.mjs`** and is imported by all tool scripts.

### Create the admin credentials

Create an API Client with the **Admin client** scope and download to **`tools/.env`**

Do NOT use an admin client for `site/.env`.

### Run a tool -- example

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

## End-to-End Testing

**Testing is finally easy and useful!!!**

I have a high-level description of tests in test.txt.   If I change this file, I simply tell Claude Code:

"Update the tests in the test directory to match what's in test.txt, then run those tests"

The tests use browser automation (Playwright)

---

## Tech Stack

- [Next.js 14](https://nextjs.org) App Router + Server Components
- [Tailwind CSS v4](https://tailwindcss.com) with `@theme` block (no config file)
- [commercetools](https://commercetools.com) headless commerce platform
- [Playwright](https://playwright.dev) for end-to-end testing
- TypeScript throughout
- Hosted on [Netlify](https://netlify.com)
