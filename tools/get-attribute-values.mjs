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

async function ctPost(token, path, body) {
  const resp = await fetch(`${apiUrl}/${projectKey}${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: resp.status, data: await resp.json() };
}

async function ctGet(token, path) {
  const resp = await fetch(`${apiUrl}/${projectKey}${path}`, { headers: { 'Authorization': `Bearer ${token}` } });
  return { status: resp.status, data: await resp.json() };
}

async function explore() {
  const token = await getToken();
  
  // Get attribute definitions from product types to know enum values
  const pt = await ctGet(token, '/product-types?limit=10');
  for (const type of pt.data.results) {
    const enumAttrs = type.attributes?.filter(a => a.type?.name === 'lenum' || a.type?.name === 'enum');
    for (const attr of enumAttrs || []) {
      console.log(`\nProduct type '${type.name}' - attribute '${attr.name}' (${attr.type?.name}):`);
      const values = attr.type?.values || [];
      console.log('  Values:', JSON.stringify(values.map(v => ({ key: v.key, label: v.label }))));
    }
  }
  
  // Test attribute filter in Product Search
  const r1 = await ctPost(token, '/products/search', {
    limit: 5,
    query: { exact: { field: 'variants.attributes.search-color.key', value: 'yellow' } },
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  console.log('\nAttribute filter (search-color=yellow):', r1.status, r1.data.total ?? r1.data.message);
  
  const r2 = await ctPost(token, '/products/search', {
    limit: 5,
    query: { and: [
      { exact: { field: 'categoriesSubTree', value: '824ff565-f58c-46b0-aa7b-6be27d4b383e' } },
      { exact: { field: 'variants.attributes.search-color.key', value: 'yellow' } }
    ]},
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  console.log('Combined category + color filter:', r2.status, r2.data.total ?? r2.data.message);
}

explore().catch(console.error);
