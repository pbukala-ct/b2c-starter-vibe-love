import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";
import { ClientBuilder } from "@commercetools/sdk-client-v2";
import 'dotenv/config';

const projectKey = process.env.CTP_PROJECT_KEY;
const authUrl = process.env.CTP_AUTH_URL;
const apiUrl = process.env.CTP_API_URL;

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

const apiRoot = createApiBuilderFromCtpClient(client).withProjectKey({ projectKey });

async function explore() {
  // Get project info
  const project = await apiRoot.get().execute();
  console.log("PROJECT:", JSON.stringify({
    name: project.body.name,
    languages: project.body.languages,
    countries: project.body.countries,
    currencies: project.body.currencies,
  }, null, 2));

  // Get product types
  const productTypes = await apiRoot.productTypes().get({ queryArgs: { limit: 20 } }).execute();
  console.log("\nPRODUCT TYPES:", JSON.stringify(productTypes.body.results.map(pt => ({
    id: pt.id,
    name: pt.name,
    attributes: pt.attributes?.map(a => ({ name: a.name, type: a.type?.name, label: a.label }))
  })), null, 2));

  // Get categories
  const categories = await apiRoot.categories().get({ queryArgs: { limit: 100 } }).execute();
  console.log("\nCATEGORIES:", JSON.stringify(categories.body.results.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parent: c.parent?.id,
    orderHint: c.orderHint
  })), null, 2));

  // Get sample products
  const products = await apiRoot.products().get({ queryArgs: { limit: 5, expand: ['productType'] } }).execute();
  console.log("\nSAMPLE PRODUCTS:", JSON.stringify(products.body.results.map(p => ({
    id: p.id,
    name: p.masterData?.current?.name,
    categories: p.masterData?.current?.categories?.map(c => c.id),
    variants: p.masterData?.current?.allVariants?.slice(0, 2).map(v => ({
      sku: v.sku,
      prices: v.prices?.map(pr => ({ value: pr.value, customerGroup: pr.customerGroup?.id, recurring: pr.recurring })),
      attributes: v.attributes
    }))
  })), null, 2));
}

explore().catch(e => {
  console.error(e.message);
  if (e.body) console.error(JSON.stringify(e.body, null, 2));
  process.exit(1);
});
