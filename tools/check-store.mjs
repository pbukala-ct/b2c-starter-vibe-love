import { apiRoot, projectKey } from './ct-admin.mjs';

// Check stores
try {
  const { body } = await apiRoot.stores().get({ queryArgs: { limit: 50 } }).execute();
  console.log('Stores:', body.results.map(s => `${s.key} (${s.name?.['en-US'] || 'no name'})`));
} catch(e) {
  console.error('Stores error:', e.message);
}

// Test in-store product search
try {
  const { body } = await apiRoot.inStoreKeyWithStoreKeyValue({ storeKey: 'home-accessories-store' })
    .productProjections()
    .get({ queryArgs: { limit: 1 } })
    .execute();
  console.log('In-store product projections: OK, total', body.total);
} catch(e) {
  console.error('In-store product projections error:', e.message);
}
