import { apiRoot, projectKey } from './ct-admin.mjs';
import { ClientBuilder } from '@commercetools/sdk-client-v2';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

const client = new ClientBuilder()
  .withProjectKey(process.env.CTP_PROJECT_KEY)
  .withClientCredentialsFlow({
    host: process.env.CTP_AUTH_URL,
    projectKey: process.env.CTP_PROJECT_KEY,
    credentials: { clientId: process.env.CTP_CLIENT_ID, clientSecret: process.env.CTP_CLIENT_SECRET },
    scopes: [process.env.CTP_SCOPES],
  })
  .withHttpMiddleware({ host: process.env.CTP_API_URL })
  .build();

// Test 1: in-store product-projections (GET)
console.log('\n=== TEST 1: in-store product-projections GET ===');
try {
  const r = await client.execute({
    uri: `/${process.env.CTP_PROJECT_KEY}/in-store/key=home-accessories-store/product-projections?limit=2&staged=false&priceCurrency=EUR&priceCountry=DE`,
    method: 'GET',
  });
  const names = r.body.results?.map(p => p.name?.['en-US']).join(', ');
  console.log(`OK: ${r.body.total} total, first 2: ${names}`);
  const price = r.body.results?.[0]?.masterVariant?.price;
  console.log(`First product price: ${price ? `${price.value.centAmount/100} ${price.value.currencyCode} (channel: ${price.channel?.id || 'none'})` : 'NO PRICE'}`);
} catch (e) {
  console.error('FAIL:', e.message, e.statusCode);
}

// Test 2: in-store product-projections/search (GET with text)
console.log('\n=== TEST 2: in-store product-projections/search GET ===');
try {
  const r = await client.execute({
    uri: `/${process.env.CTP_PROJECT_KEY}/in-store/key=home-accessories-store/product-projections/search?limit=2&staged=false&priceCurrency=EUR&priceCountry=DE`,
    method: 'GET',
  });
  console.log(`OK: ${r.body.total} total products`);
  const price = r.body.results?.[0]?.masterVariant?.price;
  const avail = r.body.results?.[0]?.masterVariant?.availability;
  console.log(`First price: ${price ? `${price.value.centAmount/100} ${price.value.currencyCode}` : 'NONE'}`);
  console.log(`First availability: isOnStock=${avail?.isOnStock}, qty=${avail?.availableQuantity}`);
} catch (e) {
  console.error('FAIL:', e.message, e.statusCode);
}

// Test 3: What does the store's product selection look like via in-store?
console.log('\n=== TEST 3: Store product selection check ===');
try {
  const { body: store } = await apiRoot.stores().withKey({ key: 'home-accessories-store' }).get().execute();
  console.log('Store distributionChannels:', store.distributionChannels?.map(c => c.id));
  console.log('Store supplyChannels:', store.supplyChannels?.map(c => c.id));
  console.log('Store productSelections:', store.productSelections?.map(ps => ({ id: ps.productSelection.id, active: ps.active })));
} catch (e) {
  console.error('Store get error:', e.message);
}

// Test 4: product projections with priceChannel (not in-store)
console.log('\n=== TEST 4: Base product-projections with priceChannel ===');
try {
  const r = await client.execute({
    uri: `/${process.env.CTP_PROJECT_KEY}/product-projections?limit=2&staged=false&priceCurrency=EUR&priceCountry=DE&priceChannel=9c83cda2-7df2-4536-a340-52d0a451aea4`,
    method: 'GET',
  });
  console.log(`OK: ${r.body.total} total`);
  const price = r.body.results?.[0]?.masterVariant?.price;
  console.log(`First price: ${price ? `${price.value.centAmount/100} ${price.value.currencyCode} (channel: ${price.channel?.id || 'none'})` : 'NONE'}`);
} catch (e) {
  console.error('FAIL:', e.message);
}
