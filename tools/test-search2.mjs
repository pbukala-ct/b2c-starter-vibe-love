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
  const resp = await fetch(`${apiUrl}/${projectKey}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return { status: resp.status, data: await resp.json() };
}

async function explore() {
  const token = await getToken();
  
  // The new Product Search API uses different query format
  // Let me check the CT docs format for Product Search
  
  // Try category filter with correct field
  const catResult = await ctPost(token, '/products/search', {
    limit: 5,
    query: {
      exact: {
        field: 'variants.categories.id',
        value: 'c3d18e53-adbc-402a-9c3a-28320265ce6b'
      }
    },
    productProjectionParameters: {
      priceCurrency: 'USD',
      priceCountry: 'US'
    }
  });
  console.log("\nCategory filter (variants.categories.id) status:", catResult.status);
  if (catResult.status === 200) {
    console.log("Products:", catResult.data.total, catResult.data.results.map(p => p.productProjection?.name?.['en-US']));
  } else {
    console.log("Error:", catResult.data.message);
  }

  // Try fullText with field param
  const textResult = await ctPost(token, '/products/search', {
    limit: 5,
    query: {
      fullText: { field: 'name', value: 'sofa', locale: 'en-US' }
    },
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  console.log("\nText search 'sofa' status:", textResult.status);
  if (textResult.status === 200) {
    console.log("Results:", textResult.data.total, textResult.data.results.map(p => p.productProjection?.name?.['en-US']));
  } else {
    console.log("Error:", textResult.data.message);
  }

  // Try facets with required count field
  const facetResult = await ctPost(token, '/products/search', {
    limit: 1,
    facets: [
      { name: 'color', expression: 'variants.attributes.search-color.key', count: { type: 'term' } }
    ],
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  console.log("\nFacets status:", facetResult.status);
  if (facetResult.status === 200) {
    console.log("Facets:", JSON.stringify(facetResult.data.facets, null, 2));
  } else {
    console.log("Error:", facetResult.data.message, JSON.stringify(facetResult.data.errors?.slice(0,2)));
  }
  
  // Try the old product-projections search API (might be available)
  const oldSearch = await ctGet(token, '/product-projections/search?text.en-US=sofa&priceCurrency=USD&priceCountry=US&limit=5');
  console.log("\nOld search status:", oldSearch.status, oldSearch.data.total || oldSearch.data.message);

  // Check what fields are available
  const allProds = await ctPost(token, '/products/search', {
    limit: 1,
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  if (allProds.status === 200 && allProds.data.results.length > 0) {
    const proj = allProds.data.results[0].productProjection;
    console.log("\nProduct projection fields:", Object.keys(proj));
    console.log("Master variant fields:", Object.keys(proj.masterVariant || {}));
    console.log("First category:", proj.categories?.[0]);
  }
}

explore().catch(console.error);
