import { apiRoot } from './ct-admin.mjs';
const DIST_CH = '9c83cda2-7df2-4536-a340-52d0a451aea4';
const SUPPLY_CH = '60b9114f-7936-4a69-9616-dcab7f6b2b58';

// Get all products in the selection and their prices
const { body } = await apiRoot.productSelections().withKey({ key: 'home-accessories-selection' }).products().get({ queryArgs: { limit: 100 } }).execute();
const ids = body.results.map(r => r.product.id);
const where = `id in (${ids.map(id => `"${id}"`).join(',')})`;
const { body: prods } = await apiRoot.products().get({ queryArgs: { where, limit: 100 } }).execute();

console.log('=== STORE CHANNEL PRICES BY CURRENCY ===');
const channelCurrencies = new Set();
const defaultCurrencies = new Set();

for (const p of prods.results) {
  const current = p.masterData.current;
  const name = current.name?.['en-US'] || p.id;
  const allPrices = current.masterVariant.prices || [];
  const channelPrices = allPrices.filter(pr => pr.channel?.id === DIST_CH);
  const defaultPrices = allPrices.filter(pr => !pr.channel);

  for (const cp of channelPrices) channelCurrencies.add(cp.value.currencyCode);
  for (const dp of defaultPrices) defaultCurrencies.add(dp.value.currencyCode);

  if (name === 'Nordic Ceramic Vase') {
    console.log(`\n${name}:`);
    console.log('  Channel prices:', channelPrices.map(p => `${p.value.centAmount/100} ${p.value.currencyCode}`).join(', '));
    console.log('  Default prices:', defaultPrices.map(p => `${p.value.centAmount/100} ${p.value.currencyCode}`).join(', '));
  }
}
console.log('\nAll currencies with store-channel prices:', [...channelCurrencies].join(', '));
console.log('All currencies with default prices:', [...defaultCurrencies].join(', '));

// Test Product Search with USD + priceChannel
console.log('\n=== PRODUCT SEARCH: USD + priceChannel ===');
const { body: search1 } = await apiRoot.products().search().post({ body: {
  limit: 1,
  query: { exact: { field: 'variants.sku', value: 'HAC-001' } },
  productProjectionParameters: {
    priceCurrency: 'USD',
    priceCountry: 'US',
    priceChannel: DIST_CH,
    expand: ['masterVariant.price.discounted.discount'],
  },
}}).execute();
const p1 = search1.results[0]?.productProjection;
console.log('Product:', p1?.name?.['en-US']);
console.log('price:', p1?.masterVariant?.price ? `${p1.masterVariant.price.value.centAmount/100} ${p1.masterVariant.price.value.currencyCode} (channel: ${p1.masterVariant.price.channel?.id || 'none'})` : 'NO PRICE');

// Test Product Search with EUR + priceChannel
console.log('\n=== PRODUCT SEARCH: EUR + priceChannel ===');
const { body: search2 } = await apiRoot.products().search().post({ body: {
  limit: 1,
  query: { exact: { field: 'variants.sku', value: 'HAC-001' } },
  productProjectionParameters: {
    priceCurrency: 'EUR',
    priceCountry: 'DE',
    priceChannel: DIST_CH,
    expand: ['masterVariant.price.discounted.discount'],
  },
}}).execute();
const p2 = search2.results[0]?.productProjection;
console.log('Product:', p2?.name?.['en-US']);
console.log('price:', p2?.masterVariant?.price ? `${p2.masterVariant.price.value.centAmount/100} ${p2.masterVariant.price.value.currencyCode} (channel: ${p2.masterVariant.price.channel?.id || 'none'})` : 'NO PRICE');

// Test inventory - expand availability channels
console.log('\n=== INVENTORY: expand availability.channels ===');
const { body: search3 } = await apiRoot.products().search().post({ body: {
  limit: 1,
  query: { exact: { field: 'variants.sku', value: 'HAC-001' } },
  productProjectionParameters: {
    priceCurrency: 'EUR',
    priceCountry: 'DE',
    expand: ['masterVariant.availability.channels'],
  },
}}).execute();
const p3 = search3.results[0]?.productProjection;
const avail = p3?.masterVariant?.availability;
console.log('Global availability:', avail?.isOnStock, avail?.availableQuantity);
console.log('Channel availability keys:', Object.keys(avail?.channels || {}));
const supplyAvail = avail?.channels?.[SUPPLY_CH];
console.log(`Supply channel (${SUPPLY_CH}) avail:`, supplyAvail?.isOnStock, supplyAvail?.availableQuantity);
