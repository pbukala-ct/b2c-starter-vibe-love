import 'dotenv/config';

const projectKey = process.env.CTP_PROJECT_KEY;
const authUrl = process.env.CTP_AUTH_URL;
const apiUrl = process.env.CTP_API_URL;

async function getToken() {
  const creds = Buffer.from(`${process.env.CTP_CLIENT_ID}:${process.env.CTP_CLIENT_SECRET}`).toString('base64');
  const resp = await fetch(`${authUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(process.env.CTP_SCOPES)}`
  });
  return (await resp.json()).access_token;
}

async function ct(token, method, path, body) {
  const resp = await fetch(`${apiUrl}/${projectKey}${path}`, {
    method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await resp.text();
  const data = JSON.parse(text);
  if (resp.status >= 400) throw new Error(`CT API ${method} ${path}: ${resp.status} ${JSON.stringify(data)}`);
  return data;
}

async function setup() {
  const token = await getToken();
  
  // 1. Get existing recurrence policies
  const existing = await ct(token, 'GET', '/recurrence-policies?limit=100');
  console.log("Existing policies:", existing.results.map(p => p.key));
  const policyMap = {};
  for (const p of existing.results) policyMap[p.key] = p;
  
  // 2. Create missing recurrence policies
  const policiesToCreate = [
    {
      key: 'bi-weekly',
      name: { 'en-US': 'Every 2 Weeks', 'en-GB': 'Every 2 Weeks', 'de-DE': 'Alle 2 Wochen' },
      description: { 'en-US': 'Renews automatically every 2 weeks' },
      schedule: { type: 'standard', value: 2, intervalUnit: 'Weeks' }
    },
    {
      key: 'weekly',
      name: { 'en-US': 'Every Week', 'en-GB': 'Every Week', 'de-DE': 'Jede Woche' },
      description: { 'en-US': 'Renews automatically every week' },
      schedule: { type: 'standard', value: 1, intervalUnit: 'Weeks' }
    }
  ];
  
  for (const pol of policiesToCreate) {
    if (policyMap[pol.key]) {
      console.log(`Policy '${pol.key}' already exists: ${policyMap[pol.key].id}`);
    } else {
      const created = await ct(token, 'POST', '/recurrence-policies', pol);
      console.log(`Created policy '${pol.key}': ${created.id}`);
      policyMap[pol.key] = created;
    }
  }
  
  const monthlyId = policyMap['monthly'].id;
  const biWeeklyId = policyMap['bi-weekly'].id;
  const weeklyId = policyMap['weekly'].id;
  
  console.log('\nPolicy IDs:', { monthly: monthlyId, biWeekly: biWeeklyId, weekly: weeklyId });
  
  // 3. Get Ben Pillow Cover product
  const products = await ct(token, 'GET', '/products?where=' + encodeURIComponent('key = "ben-pillow-cover"'));
  const product = products.results[0];
  console.log('\nProduct:', product.id, 'version:', product.version);
  
  const currentPrices = product.masterData.staged.masterVariant.prices;
  console.log('Current prices:', currentPrices.map(p => `${p.key}: ${p.value.currencyCode} ${p.value.centAmount} ${p.recurrencePolicy ? '(recurring)' : ''}`));
  
  // 4. Add missing recurring prices
  // Regular prices: EUR 1299, GBP 1299, USD 1299
  // Monthly (10% off): EUR 1169, GBP 1169, USD 1169 (USD exists)
  // Bi-weekly (15% off): EUR 1104, GBP 1104, USD 1104
  // Weekly (20% off): EUR 1039, GBP 1039, USD 1039
  
  const existingKeys = new Set(currentPrices.map(p => p.key));
  const pricesToAdd = [];
  
  const recurringPrices = [
    // Monthly - EUR (DE)
    { key: 'ben-pillow-cover-monthly-eur', country: 'DE', currency: 'EUR', amount: 1169, policyId: monthlyId },
    // Monthly - GBP (GB)
    { key: 'ben-pillow-cover-monthly-gbp', country: 'GB', currency: 'GBP', amount: 1169, policyId: monthlyId },
    // Bi-weekly - USD (US)
    { key: 'ben-pillow-cover-biweekly-usd', country: 'US', currency: 'USD', amount: 1104, policyId: biWeeklyId },
    // Bi-weekly - EUR (DE)
    { key: 'ben-pillow-cover-biweekly-eur', country: 'DE', currency: 'EUR', amount: 1104, policyId: biWeeklyId },
    // Bi-weekly - GBP (GB)
    { key: 'ben-pillow-cover-biweekly-gbp', country: 'GB', currency: 'GBP', amount: 1104, policyId: biWeeklyId },
    // Weekly - USD (US)
    { key: 'ben-pillow-cover-weekly-usd', country: 'US', currency: 'USD', amount: 1039, policyId: weeklyId },
    // Weekly - EUR (DE)
    { key: 'ben-pillow-cover-weekly-eur', country: 'DE', currency: 'EUR', amount: 1039, policyId: weeklyId },
    // Weekly - GBP (GB)
    { key: 'ben-pillow-cover-weekly-gbp', country: 'GB', currency: 'GBP', amount: 1039, policyId: weeklyId },
  ];
  
  for (const p of recurringPrices) {
    if (!existingKeys.has(p.key)) pricesToAdd.push(p);
    else console.log(`Price '${p.key}' already exists`);
  }
  
  if (pricesToAdd.length > 0) {
    const actions = pricesToAdd.map(p => ({
      action: 'addPrice',
      variantId: 1,
      price: {
        key: p.key,
        value: { currencyCode: p.currency, centAmount: p.amount },
        country: p.country,
        recurrencePolicy: { typeId: 'recurrence-policy', id: p.policyId }
      }
    }));
    
    const updated = await ct(token, 'POST', `/products/${product.id}`, {
      version: product.version,
      actions
    });
    console.log(`\nAdded ${pricesToAdd.length} recurring prices to Ben Pillow Cover. New version: ${updated.version}`);
    
    // Publish
    const published = await ct(token, 'POST', `/products/${product.id}`, {
      version: updated.version,
      actions: [{ action: 'publish' }]
    });
    console.log('Published. Version:', published.version);
  }
  
  console.log('\n✅ Subscription setup complete!');
  console.log('Policy IDs (save these):', { monthly: monthlyId, biWeekly: biWeeklyId, weekly: weeklyId });
}

setup().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
