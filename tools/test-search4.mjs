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

async function explore() {
  const token = await getToken();
  
  // Test filter with category - does it actually filter?
  const tests = [
    { desc: 'filter exact categories.id', body: {
      limit: 3, filter: { exact: { field: 'categories.id', value: 'c3d18e53-adbc-402a-9c3a-28320265ce6b' } },
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    }},
    { desc: 'query exact variants.categories.id fieldType reference', body: {
      limit: 3, query: { exact: { field: 'variants.categories.id', fieldType: 'reference', value: 'c3d18e53-adbc-402a-9c3a-28320265ce6b' } },
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    }},
    { desc: 'fullText with language', body: {
      limit: 3, query: { fullText: { field: 'name', value: 'sofa', language: 'en-US' } },
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    }},
    { desc: 'fullText without locale/language', body: {
      limit: 3, query: { fullText: { field: 'name', value: 'sofa' } },
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    }},
    { desc: 'exact on key field', body: {
      limit: 3, query: { exact: { field: 'key', value: 'ben-pillow-cover' } },
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    }},
  ];
  
  for (const test of tests) {
    const r = await ctPost(token, '/products/search', test.body);
    if (r.status === 200) {
      console.log(`✓ ${test.desc}: ${r.data.total} results, names: ${r.data.results.map(p => p.productProjection?.name?.['en-US']).join(', ')}`);
    } else {
      console.log(`✗ ${test.desc}: ${r.status} - ${r.data.message}`);
    }
  }
  
  // Now try the term facet with correct format
  const facets = [
    { desc: 'term facet with count.type=terms', body: {
      limit: 1,
      facets: [{ name: 'colors', expression: 'variants.attributes.search-color.key', count: { type: 'terms', name: 'colors' } }],
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    }},
    { desc: 'value facet', body: {
      limit: 1,
      facets: [{ name: 'colors', expression: 'variants.attributes.search-color.key', count: { type: 'value', name: 'colorCount' } }],
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    }},
    { desc: 'bucket facet', body: {
      limit: 1,
      facets: [{
        name: 'colors',
        count: { type: 'terms', name: 'colors', scope: 'variants.attributes.search-color.key' }
      }],
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    }},
  ];
  
  for (const test of facets) {
    const r = await ctPost(token, '/products/search', test.body);
    if (r.status === 200) {
      console.log(`✓ ${test.desc}: facets = ${JSON.stringify(r.data.facets)?.slice(0, 200)}`);
    } else {
      console.log(`✗ ${test.desc}: ${r.status} - ${r.data.message}`);
    }
  }
}

explore().catch(console.error);
