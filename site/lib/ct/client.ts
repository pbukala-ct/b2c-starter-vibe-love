import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk';
import { ClientBuilder } from '@commercetools/sdk-client-v2';

const projectKey = process.env.CTP_PROJECT_KEY!;
const authUrl = process.env.CTP_AUTH_URL!;
const apiUrl = process.env.CTP_API_URL!;

function buildClient() {
  return new ClientBuilder()
    .withProjectKey(projectKey)
    .withClientCredentialsFlow({
      host: authUrl,
      projectKey,
      credentials: {
        clientId: process.env.CTP_CLIENT_ID!,
        clientSecret: process.env.CTP_CLIENT_SECRET!,
      },
      scopes: [process.env.CTP_SCOPES!],
    })
    .withHttpMiddleware({ host: apiUrl })
    .build();
}

const ctpClient = buildClient();
export const apiRoot = createApiBuilderFromCtpClient(ctpClient).withProjectKey({ projectKey });
export { ctpClient };

export const CTP_STORE_KEY = process.env.NEXT_PUBLIC_CTP_STORE_KEY ?? '';
export const CTP_DISTRIBUTION_CHANNEL_ID = process.env.NEXT_PUBLIC_CTP_DISTRIBUTION_CHANNEL_ID ?? '';
export const CTP_SUPPLY_CHANNEL_ID = process.env.NEXT_PUBLIC_CTP_SUPPLY_CHANNEL_ID ?? '';

/**
 * Store-scoped API root when NEXT_PUBLIC_CTP_STORE_KEY is set; falls back to the
 * base project root otherwise. All cart, order, and product-search calls should
 * use this so that CT automatically scopes catalogue, pricing, and inventory to
 * the configured store. Cast to typeof apiRoot for TypeScript compatibility —
 * the in-store builder exposes the same operation methods with identical
 * request/response shapes; only the URL path differs.
 */
export const scopedRoot = (
  CTP_STORE_KEY
    ? apiRoot.inStoreKeyWithStoreKeyValue({ storeKey: CTP_STORE_KEY })
    : apiRoot
) as typeof apiRoot;

export { projectKey, apiUrl, authUrl };
