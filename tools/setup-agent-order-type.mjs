/**
 * setup-agent-order-type.mjs — Create the CT custom type for agent order attribution.
 *
 * Creates a custom type `agent-order-attribution` with fields:
 *   agentId    (String) — internal agent identifier
 *   agentEmail (String) — agent email address
 *   agentName  (String) — agent display name
 *
 * The type is assigned to the `order` resource type so it can be attached
 * to any CT Order via setCustomType + setCustomField actions.
 *
 * Usage:
 *   node tools/setup-agent-order-type.mjs
 *
 * Idempotent: safe to run multiple times. Skips creation if the type already exists.
 * Requires tools/.env with manage_project scope.
 */

import { apiRoot } from './ct-admin.mjs';

const TYPE_KEY = 'agent-order-attribution';

async function run() {
  // Check if the type already exists
  let existing = null;
  try {
    const result = await apiRoot
      .types()
      .withKey({ key: TYPE_KEY })
      .get()
      .execute();
    existing = result.body;
  } catch (err) {
    if (!err?.body?.statusCode === 404 && !err?.statusCode === 404) {
      throw err;
    }
    // 404 = doesn't exist yet, proceed with creation
  }

  if (existing) {
    console.log(`✔ Custom type "${TYPE_KEY}" already exists (version ${existing.version}). Skipping.`);
    console.log('  Fields:', existing.fieldDefinitions.map((f) => f.name).join(', '));
    return;
  }

  console.log(`Creating custom type "${TYPE_KEY}"...`);

  const result = await apiRoot
    .types()
    .post({
      body: {
        key: TYPE_KEY,
        name: { en: 'Agent Order Attribution' },
        description: { en: 'Identifies orders placed by CS agents on behalf of customers' },
        resourceTypeIds: ['order'],
        fieldDefinitions: [
          {
            name: 'agentId',
            label: { en: 'Agent ID' },
            required: false,
            type: { name: 'String' },
            inputHint: 'SingleLine',
          },
          {
            name: 'agentEmail',
            label: { en: 'Agent Email' },
            required: false,
            type: { name: 'String' },
            inputHint: 'SingleLine',
          },
          {
            name: 'agentName',
            label: { en: 'Agent Name' },
            required: false,
            type: { name: 'String' },
            inputHint: 'SingleLine',
          },
        ],
      },
    })
    .execute();

  console.log(`✔ Created custom type "${TYPE_KEY}" (version ${result.body.version})`);
  console.log('  Fields: agentId, agentEmail, agentName');
  console.log('  Resource type: order');
  console.log('\nDone. Agent checkout will now write attribution fields to CT orders.');
  console.log('IMPORTANT: Deploy the storefront changes before testing agent checkout.');
}

run().catch((err) => {
  console.error('Failed to create custom type:', err?.body ?? err?.message ?? err);
  process.exit(1);
});
