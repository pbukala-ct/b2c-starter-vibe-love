/**
 * ct-admin.mjs — Shared commercetools admin client for tool scripts.
 *
 * Uses manage_project scope for full administrative access.
 * This client is for setup and exploration scripts ONLY.
 *
 * NEVER import this from the storefront (site/). The storefront uses a
 * separate API client with minimal scopes defined in site/.env.
 *
 * Credentials are loaded from tools/.env.
 * Required variables:
 *   CTP_PROJECT_KEY, CTP_CLIENT_ID, CTP_CLIENT_SECRET,
 *   CTP_AUTH_URL, CTP_API_URL, CTP_SCOPES=manage_project:<projectKey>
 */

import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk';
import { ClientBuilder } from '@commercetools/sdk-client-v2';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load tools/.env regardless of where the script is run from
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

const projectKey = process.env.CTP_PROJECT_KEY;
const authUrl    = process.env.CTP_AUTH_URL;
const apiUrl     = process.env.CTP_API_URL;

if (!projectKey || !process.env.CTP_CLIENT_ID || !process.env.CTP_CLIENT_SECRET) {
  console.error(
    'Missing CT credentials.\n' +
    'Create tools/.env with CTP_PROJECT_KEY, CTP_CLIENT_ID, CTP_CLIENT_SECRET,\n' +
    'CTP_AUTH_URL, CTP_API_URL, and CTP_SCOPES=manage_project:<projectKey>.\n' +
    'See site/README.md for instructions.'
  );
  process.exit(1);
}

const client = new ClientBuilder()
  .withProjectKey(projectKey)
  .withClientCredentialsFlow({
    host: authUrl,
    projectKey,
    credentials: {
      clientId: process.env.CTP_CLIENT_ID,
      clientSecret: process.env.CTP_CLIENT_SECRET,
    },
    scopes: [process.env.CTP_SCOPES],
  })
  .withHttpMiddleware({ host: apiUrl })
  .build();

export const apiRoot = createApiBuilderFromCtpClient(client).withProjectKey({ projectKey });
export { projectKey, authUrl, apiUrl };
