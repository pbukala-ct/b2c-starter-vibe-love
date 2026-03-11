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
  
  // Test parentProduct.categories.id
  const r1 = await ctPost(token, '/products/search', {
    limit: 3,
    query: { exact: { field: 'parentProduct.categories.id', value: 'c3d18e53-adbc-402a-9c3a-28320265ce6b' } },
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  console.log(`parentProduct.categories.id: ${r1.status} - ${r1.data.total ?? r1.data.message}`);
  if (r1.status === 200 && r1.data.total < 20) {
    console.log('  Names:', r1.data.results.map(p => p.productProjection?.name?.['en-US']));
  }
  
  // Test products CQL
  const r2 = await ctGet(token, '/products?where=' + encodeURIComponent('masterData(current(categories(id="c3d18e53-adbc-402a-9c3a-28320265ce6b")))') + '&limit=3');
  console.log(`CQL category filter: ${r2.status} - total ${r2.data.total}`);
  if (r2.status === 200) {
    console.log('  Names:', r2.data.results.map(p => p.masterData?.current?.name?.['en-US']));
  }
  
  // Test product projections (via products endpoint)
  const r3 = await ctGet(token, '/product-projections?where=' + encodeURIComponent('categories(id="c3d18e53-adbc-402a-9c3a-28320265ce6b")') + '&priceCurrency=USD&priceCountry=US&limit=3');
  console.log(`Product projections: ${r3.status} - ${r3.data.total ?? r3.data.message}`);
  
  // Get full facet response to understand structure
  const r4 = await ctPost(token, '/products/search', {
    limit: 1,
    facets: [
      { name: 'color_terms', expression: 'variants.attributes.search-color.key', count: { type: 'terms', name: 'colors' } }
    ],
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  console.log('\nFull facet response:', JSON.stringify(r4.data.facets, null, 2));
  console.log('  Result structure:', Object.keys(r4.data));
  
  // Check if parentProduct has categories
  const r5 = await ctPost(token, '/products/search', {
    limit: 1,
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  if (r5.status === 200) {
    const variant = r5.data.results[0]?.productProjection?.masterVariant;
    const pp = r5.data.results[0]?.productProjection;
    console.log('\nProduct projection categories:', JSON.stringify(pp?.categories?.slice(0,2)));
    console.log('Variant available fields:', JSON.stringify(Object.keys(variant || {})));
  }
  
  // Try searching with a query that uses parentProduct.categories
  const r6 = await ctPost(token, '/products/search', {
    limit: 3,
    query: {
      exact: {
        field: 'parentProduct.categories',
        value: 'c3d18e53-adbc-402a-9c3a-28320265ce6b'
      }
    },
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  console.log(`\nparentProduct.categories: ${r6.status} - ${r6.data.total ?? r6.data.message}`);
}

explore().catch(console.error);
