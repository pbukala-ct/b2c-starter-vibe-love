/**
 * setup-agent-credentials.mjs — Provision CS agent credentials in commercetools.
 *
 * Stores agent records as CT Custom Objects in the `agent-credentials` container.
 * Each object key is the agent's email address.
 *
 * Usage:
 *   node tools/setup-agent-credentials.mjs
 *
 * Edit the AGENTS array below before running.
 * Requires tools/.env with manage_project scope.
 *
 * Password hashing: uses Node.js built-in crypto.scryptSync (secure key derivation).
 * The stored format is `scrypt:<salt>:<hash>` so the login route can verify it.
 */

import { apiRoot } from './ct-admin.mjs';
import { scryptSync, randomBytes } from 'node:crypto';

// ---------------------------------------------------------------------------
// Edit this list before running
// ---------------------------------------------------------------------------
const AGENTS = [
  {
    email: 'agent@ct.com',
    password: '1234!',
    role: 'order-placement', // 'read-only' | 'order-placement'
    name: 'Example Agent',
  },
];
// ---------------------------------------------------------------------------

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

async function upsertAgent(agent) {
  const { email, password, role, name } = agent;
  const passwordHash = hashPassword(password);

  const key = email.replace(/[^a-zA-Z0-9_-]/g, '_');

  await apiRoot
    .customObjects()
    .post({
      body: {
        container: 'agent-credentials',
        key,
        value: {
          email,
          passwordHash,
          role,
          name,
          createdAt: new Date().toISOString(),
        },
      },
    })
    .execute();

  console.log(`✔ Upserted agent: ${email} (role: ${role})`);
}

console.log('Provisioning agent credentials in CT Custom Objects...\n');

for (const agent of AGENTS) {
  await upsertAgent(agent);
}

console.log('\nDone. Agent credentials stored in container: agent-credentials');
console.log('Note: passwords are hashed with scrypt and cannot be recovered.');
console.log('To reset a password, re-run this script with a new password value.');
