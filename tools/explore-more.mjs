import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";
import { ClientBuilder } from "@commercetools/sdk-client-v2";
import 'dotenv/config';

const projectKey = process.env.CTP_PROJECT_KEY;
const client = new ClientBuilder()
  .withProjectKey(projectKey)
  .withClientCredentialsFlow({
    host: process.env.CTP_AUTH_URL,
    projectKey,
    credentials: { clientId: process.env.CTP_CLIENT_ID, clientSecret: process.env.CTP_CLIENT_SECRET },
    scopes: [process.env.CTP_SCOPES],
  })
  .withHttpMiddleware({ host: process.env.CTP_API_URL })
  .build();

const apiRoot = createApiBuilderFromCtpClient(client).withProjectKey({ projectKey });

async function explore() {
  // Shipping methods
  const shipping = await apiRoot.shippingMethods().get({ queryArgs: { limit: 20 } }).execute();
  console.log("SHIPPING METHODS:", JSON.stringify(shipping.body.results.map(s => ({
    id: s.id, name: s.name, zoneRates: s.zoneRates
  })), null, 2));

  // Tax categories
  const taxes = await apiRoot.taxCategories().get({ queryArgs: { limit: 20 } }).execute();
  console.log("\nTAX CATEGORIES:", JSON.stringify(taxes.body.results.map(t => ({
    id: t.id, name: t.name
  })), null, 2));

  // Check for recurring order settings
  try {
    const orderSettings = await apiRoot.get().execute();
    console.log("\nPROJECT SETTINGS:", JSON.stringify(orderSettings.body, null, 2));
  } catch(e) { console.log("project settings error:", e.message); }
  
  // Check existing recurring orders / subscriptions
  try {
    const recOrders = await apiRoot.orders().get({ queryArgs: { limit: 5, where: ['recurringOrder is defined'] } }).execute();
    console.log("\nRECURRING ORDERS (first 5):", recOrders.body.total);
  } catch(e) { console.log("recurring orders error:", e.message); }

  // Sample product with full details
  const prod = await apiRoot.products().get({ queryArgs: { limit: 1 } }).execute();
  const p = prod.body.results[0];
  console.log("\nFULL PRODUCT:", JSON.stringify({
    id: p.id,
    name: p.masterData?.current?.name,
    masterVariant: {
      sku: p.masterData?.current?.masterVariant?.sku,
      prices: p.masterData?.current?.masterVariant?.prices,
      images: p.masterData?.current?.masterVariant?.images?.slice(0,2),
      attributes: p.masterData?.current?.masterVariant?.attributes
    }
  }, null, 2));
}

explore().catch(e => {
  console.error(e.message);
  if (e.body) console.error(JSON.stringify(e.body, null, 2));
});
