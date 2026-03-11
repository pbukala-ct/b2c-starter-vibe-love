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
  
  // Test categories field in query
  const tests = [
    { desc: 'exact categories (value=id)', body: {
      limit: 3,
      query: { exact: { field: 'categories', value: 'c3d18e53-adbc-402a-9c3a-28320265ce6b' } },
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    }},
    { desc: 'exact categoriesSubTree (value=id)', body: {
      limit: 3,
      query: { exact: { field: 'categoriesSubTree', value: 'c3d18e53-adbc-402a-9c3a-28320265ce6b' } },
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    }},
    { desc: 'exact categoriesSubTree (parent Living Room)', body: {
      limit: 3,
      query: { exact: { field: 'categoriesSubTree', value: '824ff565-f58c-46b0-aa7b-6be27d4b383e' } },
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    }},
    { desc: 'exact categories (name)', body: {
      limit: 3,
      query: { exact: { field: 'name', value: 'Canela Three-Seater Sofa', locale: 'en-US' } },
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    }},
    { desc: 'fullText name.en-US sofa', body: {
      limit: 5,
      query: { fullText: { field: 'name', value: 'sofa', language: 'en-US' } },
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    }},
  ];
  
  for (const test of tests) {
    const r = await ctPost(token, '/products/search', test.body);
    if (r.status === 200) {
      console.log(`✓ ${test.desc}: ${r.data.total} results`);
      if (r.data.total < 20) console.log('  ', r.data.results.map(p => p.productProjection?.name?.['en-US']));
    } else {
      console.log(`✗ ${test.desc}: ${r.status} - ${r.data.message}`);
    }
  }
  
  // Test getting term breakdown from facets - check what types are available
  const facetTypes = [
    { type: 'term', name: 'color' },
    { type: 'terms', name: 'colors' },
    { type: 'value', name: 'colorval' },
  ];
  
  for (const ft of facetTypes) {
    const r = await ctPost(token, '/products/search', {
      limit: 1,
      facets: [{ name: ft.name, expression: 'variants.attributes.search-color.key', count: { type: ft.type, name: ft.name } }],
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    });
    if (r.status === 200) {
      console.log(`\nFacet type '${ft.type}':`, JSON.stringify(r.data.facets));
    } else {
      console.log(`\nFacet type '${ft.type}' error:`, r.data.message);
    }
  }
  
  // Try without the count field
  const r = await ctPost(token, '/products/search', {
    limit: 1,
    facets: [{ name: 'color', expression: 'variants.attributes.search-color.key' }],
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  console.log('\nFacet without count:', r.status, r.data.message || JSON.stringify(r.data.facets));
}

explore().catch(console.error);
