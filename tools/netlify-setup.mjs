/**
 * netlify-setup.mjs — Provision a new Netlify site under the "cofe-pre-sales" team.
 *
 * Usage:
 *   node tools/netlify-setup.mjs
 *
 * The script will interactively prompt for:
 *   - Netlify personal access token (or set NETLIFY_AUTH_TOKEN env var)
 *   - Site name
 *   - All required environment variables for the storefront
 *
 * After setup, connect the GitHub repo in the Netlify UI to enable automatic deploys.
 * The netlify.toml in the repo root already contains the correct build configuration.
 */

import { createInterface } from 'readline';

const NETLIFY_API = 'https://api.netlify.com/api/v1';
const TEAM_SLUG = 'cofe-pre-sales';

// ---------- CLI helpers ----------

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function askSecret(question) {
  // Node readline doesn't have built-in hidden input; show the prompt and mask nothing
  // (terminals will echo the input — acceptable for a local setup script)
  return ask(question);
}

// ---------- Netlify API helpers ----------

async function netlify(token, method, path, body) {
  const res = await fetch(`${NETLIFY_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { _raw: text }; }
  if (!res.ok) {
    const msg = data?.message || data?.errors?.join(', ') || text;
    throw new Error(`Netlify API ${method} ${path}: ${res.status} — ${msg}`);
  }
  return data;
}

// ---------- Main ----------

async function main() {
  console.log('\n🌐 Netlify Site Setup\n');

  // 1. Auth token
  let token = process.env.NETLIFY_AUTH_TOKEN;
  if (!token) {
    token = await askSecret('Netlify personal access token: ');
    if (!token) {
      console.error('Error: token is required. Set NETLIFY_AUTH_TOKEN or enter it when prompted.');
      process.exit(1);
    }
  } else {
    console.log('Using NETLIFY_AUTH_TOKEN from environment.');
  }

  // 2. Site name
  const siteName = await ask('Site name: ');
  if (!siteName) {
    console.error('Error: site name is required.');
    process.exit(1);
  }

  // 3. Find the "cofe-pre-sales" account
  process.stdout.write(`\nLooking for '${TEAM_SLUG}' account...`);
  const accounts = await netlify(token, 'GET', '/accounts');
  const account = accounts.find((a) => a.slug === TEAM_SLUG);
  if (!account) {
    const slugs = accounts.map((a) => a.slug).join(', ');
    console.error(`\nError: account '${TEAM_SLUG}' not found. Available accounts: ${slugs}`);
    process.exit(1);
  }
  console.log(` ✓ found (id: ${account.id})`);

  // 4. Create the site
  process.stdout.write(`Creating Netlify site '${siteName}'...`);
  const site = await netlify(token, 'POST', '/sites', {
    name: siteName,
    account_id: account.id,
  });
  console.log(` ✓ created (id: ${site.id})`);

  // 5. Collect environment variables
  console.log('\nConfigure environment variables (press Enter to skip any):');
  console.log('  These are the storefront (site/.env) credentials — NOT the admin tools credentials.\n');

  const envPrompts = [
    { key: 'CTP_PROJECT_KEY',    label: 'CTP_PROJECT_KEY' },
    { key: 'CTP_CLIENT_ID',      label: 'CTP_CLIENT_ID' },
    { key: 'CTP_CLIENT_SECRET',  label: 'CTP_CLIENT_SECRET' },
    { key: 'CTP_AUTH_URL',       label: 'CTP_AUTH_URL (e.g. https://auth.europe-west1.gcp.commercetools.com)' },
    { key: 'CTP_API_URL',        label: 'CTP_API_URL  (e.g. https://api.europe-west1.gcp.commercetools.com)' },
    { key: 'CTP_SCOPES',         label: 'CTP_SCOPES   (e.g. manage_project:my-project)' },
    { key: 'SESSION_SECRET',     label: 'SESSION_SECRET (long random string for JWT signing)' },
  ];

  const env = {};
  for (const { key, label } of envPrompts) {
    const value = await ask(`  ${label}: `);
    if (value) env[key] = value;
  }

  // 6. Set environment variables on the site
  if (Object.keys(env).length > 0) {
    process.stdout.write('\nSetting environment variables...');
    await netlify(token, 'PATCH', `/sites/${site.id}`, {
      build_settings: { env },
    });
    console.log(' ✓ done');
  } else {
    console.log('\nNo environment variables provided — skipping.');
  }

  // 7. Summary
  const siteUrl = site.ssl_url || site.url || `https://${siteName}.netlify.app`;
  const adminUrl = `https://app.netlify.com/sites/${site.name || siteName}`;

  console.log(`
✅ Netlify site ready!
   Site URL:  ${siteUrl}
   Admin URL: ${adminUrl}

Next step: Connect your GitHub repo in the Netlify UI to enable automatic deploys.
  ${adminUrl}/settings/deploys
`);
}

main()
  .catch((err) => {
    console.error('\nError:', err.message);
    process.exit(1);
  })
  .finally(() => rl.close());
