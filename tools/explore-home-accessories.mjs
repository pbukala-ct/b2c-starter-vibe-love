/**
 * Explore home-accessories-selection: get products, categories, and channel details.
 */
import { apiRoot } from './ct-admin.mjs';

// 1. Get all products in the product selection (single call, limit 100)
console.log('\n=== PRODUCTS IN home-accessories-selection ===');
const { body: selBody } = await apiRoot
  .productSelections()
  .withKey({ key: 'home-accessories-selection' })
  .products()
  .get({ queryArgs: { limit: 100, expand: ['product'] } })
  .execute();

const selectionProducts = selBody.results;
console.log(`Count: ${selectionProducts.length}`);

// Collect category IDs from the product data
const categoryIdSet = new Set();
const productNames = [];

for (const item of selectionProducts) {
  const prod = item.product?.obj;
  if (!prod) {
    // product not expanded — just log the ID
    productNames.push(item.product?.id || '?');
    continue;
  }
  const current = prod.masterData?.current;
  const name = current?.name?.['en-US'] || current?.name?.en || prod.id;
  productNames.push(name);
  for (const cat of current?.categories || []) {
    categoryIdSet.add(cat.id);
  }
}

console.log('\nProducts:');
productNames.forEach(n => console.log(`  - ${n}`));

// 2. If expand didn't work (no obj), fetch via product IDs
if (categoryIdSet.size === 0 && selectionProducts.length > 0) {
  console.log('\nExpand not populated - fetching products by ID...');
  const productIds = selectionProducts.map(r => r.product.id);
  const where = `id in (${productIds.map(id => `"${id}"`).join(',')})`;
  const { body: prodBody } = await apiRoot
    .productProjections()
    .get({ queryArgs: { where, staged: false, limit: 100 } })
    .execute();

  console.log(`\nFetched ${prodBody.results.length} product projections`);
  for (const p of prodBody.results) {
    const name = p.name?.['en-US'] || p.name?.en || p.id;
    console.log(`  Product: ${name}`);
    for (const cat of p.categories || []) {
      categoryIdSet.add(cat.id);
      console.log(`    category id: ${cat.id}`);
    }
  }
}

console.log(`\nUnique category IDs: ${categoryIdSet.size}`);

// 3. Fetch category details
if (categoryIdSet.size > 0) {
  const idList = [...categoryIdSet];
  const where = `id in (${idList.map(id => `"${id}"`).join(',')})`;
  const { body: catBody } = await apiRoot
    .categories()
    .get({ queryArgs: { where, limit: 100 } })
    .execute();

  console.log('\n=== CATEGORY DETAILS ===');
  const byId = {};
  for (const cat of catBody.results) {
    byId[cat.id] = cat;
  }
  // Show roots first, then children
  for (const cat of catBody.results) {
    const name = cat.name?.['en-US'] || cat.name?.en || Object.values(cat.name)[0];
    const slug = cat.slug?.['en-US'] || cat.slug?.en || JSON.stringify(cat.slug);
    const parentName = cat.parent ? (byId[cat.parent.id]?.name?.['en-US'] || cat.parent.id) : 'ROOT';
    console.log(`  key="${cat.key}" name="${name}" slug="${slug}" parent="${parentName}"`);
  }
}

// 4. Fetch all categories to understand the full tree context
console.log('\n=== ALL CATEGORIES (for context) ===');
const { body: allCats } = await apiRoot
  .categories()
  .get({ queryArgs: { limit: 200 } })
  .execute();
const catMap = {};
for (const c of allCats.results) catMap[c.id] = c;
for (const c of allCats.results.filter(c => !c.parent)) {
  const name = c.name?.['en-US'] || c.name?.en || Object.values(c.name)[0];
  const slug = c.slug?.['en-US'] || c.slug?.en || JSON.stringify(c.slug);
  console.log(`  ROOT key="${c.key}" name="${name}" slug="${slug}"`);
  const children = allCats.results.filter(ch => ch.parent?.id === c.id);
  for (const ch of children) {
    const cname = ch.name?.['en-US'] || ch.name?.en || Object.values(ch.name)[0];
    const cslug = ch.slug?.['en-US'] || ch.slug?.en || JSON.stringify(ch.slug);
    const inSel = categoryIdSet.has(ch.id) ? ' *** IN SELECTION ***' : '';
    console.log(`    CHILD key="${ch.key}" name="${cname}" slug="${cslug}"${inSel}`);
  }
  if (categoryIdSet.has(c.id)) console.log(`    *** ROOT IN SELECTION ***`);
}

// 5. Channel details
console.log('\n=== CHANNELS ===');
const { body: chBody } = await apiRoot
  .channels()
  .get({ queryArgs: { limit: 50 } })
  .execute();
for (const ch of chBody.results) {
  const name = ch.name?.['en-US'] || ch.name?.en || ch.key;
  console.log(`  id=${ch.id} key="${ch.key}" roles=[${ch.roles?.join(',')}] name="${name}"`);
}
