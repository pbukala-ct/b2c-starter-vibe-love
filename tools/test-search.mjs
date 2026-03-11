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
  
  // Test Product Search API - simple search for all
  const result = await ctPost(token, '/products/search', {
    limit: 3,
    offset: 0,
    productProjectionParameters: {
      priceCurrency: 'USD',
      priceCountry: 'US'
    }
  });
  
  console.log("Basic search status:", result.status);
  if (result.status === 200) {
    console.log("Total products:", result.data.total);
    console.log("First product:", JSON.stringify(result.data.results[0], null, 2).slice(0, 1000));
  } else {
    console.log("Error:", JSON.stringify(result.data, null, 2));
  }
  
  // Test with category filter
  const catResult = await ctPost(token, '/products/search', {
    limit: 5,
    query: {
      exact: {
        field: 'categories.id',
        value: 'c3d18e53-adbc-402a-9c3a-28320265ce6b' // Sofas
      }
    },
    productProjectionParameters: {
      priceCurrency: 'USD',
      priceCountry: 'US'
    }
  });
  
  console.log("\nCategory filter (Sofas) status:", catResult.status);
  if (catResult.status === 200) {
    console.log("Products in Sofas:", catResult.data.total);
  } else {
    console.log("Error:", JSON.stringify(catResult.data, null, 2));
  }
  
  // Test with text search
  const textResult = await ctPost(token, '/products/search', {
    limit: 5,
    query: {
      fullText: { value: 'sofa', locale: 'en-US' }
    },
    productProjectionParameters: {
      priceCurrency: 'USD',
      priceCountry: 'US'
    }
  });
  
  console.log("\nText search 'sofa' status:", textResult.status);
  if (textResult.status === 200) {
    console.log("Products matching 'sofa':", textResult.data.total);
    console.log("Names:", textResult.data.results.map(p => p.name?.['en-US']));
  } else {
    console.log("Error:", JSON.stringify(textResult.data, null, 2));
  }

  // Test with color facet
  const facetResult = await ctPost(token, '/products/search', {
    limit: 1,
    facets: [
      { name: 'color', expression: 'variants.attributes.search-color.key' },
      { name: 'finish', expression: 'variants.attributes.search-finish.key' }
    ],
    productProjectionParameters: {
      priceCurrency: 'USD',
      priceCountry: 'US'
    }
  });
  
  console.log("\nFacets status:", facetResult.status);
  if (facetResult.status === 200) {
    console.log("Facets:", JSON.stringify(facetResult.data.facets, null, 2));
  } else {
    console.log("Error:", JSON.stringify(facetResult.data, null, 2));
  }
}

explore().catch(console.error);
