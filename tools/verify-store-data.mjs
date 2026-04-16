/**
 * Verify that store-scoped data (prices, inventory) is accessible.
 * Tests both the in-store product projections endpoint AND price channel data.
 */
import { apiRoot, projectKey } from './ct-admin.mjs';

const STORE_KEY = 'home-accessories-store';
const DIST_CHANNEL_ID = '9c83cda2-7df2-4536-a340-52d0a451aea4';
const SUPPLY_CHANNEL_ID = '60b9114f-7936-4a69-9616-dcab7f6b2b58';

// 1. Test in-store product projections search (old API — always available)
console.log('\n=== IN-STORE PRODUCT PROJECTIONS (to verify Product Selection filtering) ===');
try {
  const { body } = await apiRoot
    .inStoreKeyWithStoreKeyValue({ storeKey: STORE_KEY })
    .productProjections()
    .get({
      queryArgs: {
        limit: 5,
        staged: false,
        priceCurrency: 'EUR',
        priceCountry: 'DE',
      }
    })
    .execute();
  console.log(`Total in-store products: ${body.total} (showing ${body.results.length})`);
  for (const p of body.results) {
    const name = p.name?.['en-US'] || p.name?.en || p.id;
    const price = p.masterVariant?.price;
    const avail = p.masterVariant?.availability;
    console.log(`  Product: ${name}`);
    console.log(`    price: ${price ? `${price.value.centAmount / 100} ${price.value.currencyCode} (channel: ${price.channel?.id || 'none'})` : 'NO PRICE'}`);
    console.log(`    isOnStock: ${avail?.isOnStock} | availableQty: ${avail?.availableQuantity}`);
  }
} catch (e) {
  console.error('In-store projections error:', e.message);
  if (e.body) console.error('CT error body:', JSON.stringify(e.body));
}

// 2. Test in-store product projections SEARCH endpoint
console.log('\n=== IN-STORE PRODUCT PROJECTIONS SEARCH ===');
try {
  const { body } = await apiRoot
    .inStoreKeyWithStoreKeyValue({ storeKey: STORE_KEY })
    .productProjections()
    .search()
    .get({
      queryArgs: {
        limit: 5,
        staged: false,
        priceCurrency: 'EUR',
        priceCountry: 'DE',
      }
    })
    .execute();
  console.log(`Total: ${body.total}, results: ${body.results.length}`);
  for (const p of body.results) {
    const name = p.name?.['en-US'] || p.name?.en || p.id;
    const price = p.masterVariant?.price;
    console.log(`  ${name} | price: ${price ? `${price.value.centAmount / 100} ${price.value.currencyCode}` : 'NONE'}`);
  }
} catch (e) {
  console.error('In-store search error:', e.message);
}

// 3. Check a few products for channel-specific prices
console.log('\n=== PRODUCT PRICES PER CHANNEL (first 3 selection products) ===');
const { body: selBody } = await apiRoot
  .productSelections()
  .withKey({ key: 'home-accessories-selection' })
  .products()
  .get({ queryArgs: { limit: 3 } })
  .execute();

for (const item of selBody.results) {
  const productId = item.product.id;
  try {
    const { body: prod } = await apiRoot
      .products()
      .withId({ ID: productId })
      .get()
      .execute();
    const name = prod.masterData?.current?.name?.['en-US'] || productId;
    const prices = prod.masterData?.current?.masterVariant?.prices || [];
    console.log(`\n  Product: ${name}`);
    if (prices.length === 0) {
      console.log('    NO PRICES CONFIGURED');
    } else {
      for (const p of prices) {
        const channel = p.channel?.id || 'NO CHANNEL (default)';
        const matchesDist = p.channel?.id === DIST_CHANNEL_ID;
        console.log(`    ${p.value.centAmount / 100} ${p.value.currencyCode} | channel: ${channel}${matchesDist ? ' *** STORE CHANNEL ***' : ''}`);
      }
    }
    // Check inventory
    const inventory = prod.masterData?.current?.masterVariant?.availability;
    console.log(`    availability: isOnStock=${inventory?.isOnStock} qty=${inventory?.availableQuantity}`);
  } catch (e) {
    console.error(`  Product ${productId} error:`, e.message);
  }
}

// 4. Check inventory entries for supply channel
console.log('\n=== INVENTORY ENTRIES FOR SUPPLY CHANNEL ===');
try {
  const { body: inv } = await apiRoot
    .inventory()
    .get({ queryArgs: { where: `supplyChannel(id="${SUPPLY_CHANNEL_ID}")`, limit: 5 } })
    .execute();
  console.log(`Inventory entries for home-accessories-supply: ${inv.total}`);
  for (const e of inv.results.slice(0, 3)) {
    console.log(`  sku: ${e.sku} | availableQty: ${e.availableQuantity} | channel: ${e.supplyChannel?.id}`);
  }
} catch (e) {
  console.error('Inventory error:', e.message);
}
