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
  
  const types = ['text', 'ltext', 'enum', 'lenum', 'boolean', 'number', 'string'];
  
  for (const fieldType of types) {
    const r = await ctPost(token, '/products/search', {
      limit: 2,
      query: { exact: { field: 'variants.attributes.search-color.key', fieldType, value: 'yellow' } },
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    });
    if (r.status === 200) {
      console.log(`✓ fieldType='${fieldType}': ${r.data.total} results`);
    } else {
      console.log(`✗ fieldType='${fieldType}': ${r.data.message}`);
    }
  }
  
  // Also test without .key suffix
  for (const fieldType of ['lenum', 'enum']) {
    const r = await ctPost(token, '/products/search', {
      limit: 2,
      query: { exact: { field: 'variants.attributes.search-color', fieldType, value: 'yellow' } },
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    });
    if (r.status === 200) {
      console.log(`✓ field='search-color' fieldType='${fieldType}': ${r.data.total} results`);
    } else {
      console.log(`✗ field='search-color' fieldType='${fieldType}': ${r.data.message}`);
    }
  }
  
  // Test sort
  const sortTests = [
    { field: 'score', order: 'desc' },
    { field: 'name.en-US', order: 'asc' },
    { field: 'createdAt', order: 'desc' },
  ];
  
  for (const s of sortTests) {
    const r = await ctPost(token, '/products/search', {
      limit: 2,
      sort: [s],
      productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
    });
    if (r.status === 200) {
      console.log(`✓ sort {field:'${s.field}',order:'${s.order}'}: ok, names: ${r.data.results.map(p => p.productProjection?.name?.['en-US'])}`);
    } else {
      console.log(`✗ sort {field:'${s.field}',order:'${s.order}'}: ${r.data.message}`);
    }
  }
}

explore().catch(console.error);
