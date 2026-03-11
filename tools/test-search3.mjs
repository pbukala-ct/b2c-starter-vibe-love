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
  
  // Category filter - the category is on the product level
  const catResult = await ctPost(token, '/products/search', {
    limit: 5,
    query: {
      exact: {
        field: 'categories.id',
        fieldType: 'set',
        value: 'c3d18e53-adbc-402a-9c3a-28320265ce6b'
      }
    },
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  console.log("Category (fieldType set) status:", catResult.status, catResult.data.message || catResult.data.total);

  // Try filter expression
  const catResult2 = await ctPost(token, '/products/search', {
    limit: 5,
    filter: { exact: { field: 'categories.id', value: 'c3d18e53-adbc-402a-9c3a-28320265ce6b' } },
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  console.log("Filter exact categories.id status:", catResult2.status, catResult2.data.message || catResult2.data.total);

  // fullText search
  const textResult = await ctPost(token, '/products/search', {
    limit: 5,
    query: {
      fullText: { field: 'name', value: 'rug', locale: 'en-US' }
    },
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  console.log("\nText search 'rug' status:", textResult.status);
  if (textResult.status === 200) {
    console.log("Results:", textResult.data.results.map(p => p.productProjection?.name?.['en-US']));
  } else {
    console.log("Error:", textResult.data.message);
  }
  
  // Try wildcard text search
  const textResult2 = await ctPost(token, '/products/search', {
    limit: 3,
    query: {
      fullText: { field: 'name', value: 'sofa', locale: 'en-US', mustMatch: 'any' }
    },
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  console.log("\nText search 'sofa' (mustMatch any) status:", textResult2.status, textResult2.data.message || textResult2.data.results?.map(p => p.productProjection?.name?.['en-US']));

  // facets with correct format
  const facetResult = await ctPost(token, '/products/search', {
    limit: 1,
    facets: [
      { name: 'color', expression: 'variants.attributes.search-color.key', count: { type: 'term', name: 'colors' } }
    ],
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  console.log("\nFacet test status:", facetResult.status, facetResult.data.message || JSON.stringify(facetResult.data.facets)?.slice(0, 200));
  
  // Try range facet
  const facetResult2 = await ctPost(token, '/products/search', {
    limit: 1,
    facets: [
      { 
        name: 'color',
        count: { type: 'terms', name: 'color', scope: { type: 'expression', expression: 'variants.attributes.search-color.key' } }
      }
    ],
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  console.log("\nFacet test2 status:", facetResult2.status, facetResult2.data.message || JSON.stringify(facetResult2.data.facets)?.slice(0, 200));
  
  // Check recurrencePrices field on a product
  const prod = await ctPost(token, '/products/search', {
    limit: 1,
    query: { exact: { field: 'key', value: 'ben-pillow-cover' } },
    productProjectionParameters: { priceCurrency: 'USD', priceCountry: 'US' }
  });
  if (prod.status === 200 && prod.data.results.length > 0) {
    const mv = prod.data.results[0].productProjection?.masterVariant;
    console.log("\nBen Pillow Cover masterVariant:", JSON.stringify({ prices: mv?.prices, recurrencePrices: mv?.recurrencePrices }, null, 2));
  }
}

explore().catch(console.error);
