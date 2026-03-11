import 'dotenv/config';

const projectKey = process.env.CTP_PROJECT_KEY;
const authUrl = process.env.CTP_AUTH_URL;
const apiUrl = process.env.CTP_API_URL;

async function getToken() {
  const creds = Buffer.from(`${process.env.CTP_CLIENT_ID}:${process.env.CTP_CLIENT_SECRET}`).toString('base64');
  const resp = await fetch(`${authUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(process.env.CTP_SCOPES)}`
  });
  return (await resp.json()).access_token;
}

async function ctRequest(token, method, path, body) {
  const resp = await fetch(`${apiUrl}/${projectKey}${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await resp.text();
  try { return { status: resp.status, data: JSON.parse(text) }; }
  catch(e) { return { status: resp.status, data: text }; }
}

async function explore() {
  const token = await getToken();
  
  // Get the origin order of the recurring order to understand the data model
  const originOrder = await ctRequest(token, 'GET', '/orders/d49f90e9-c6b6-424b-af52-82c38995c56d');
  console.log("ORIGIN ORDER:", JSON.stringify(originOrder.data, null, 2));
  
  // Check for jen@example.com
  const jens = await ctRequest(token, 'GET', '/customers?where=' + encodeURIComponent('email = "jen@example.com"'));
  console.log("\nJEN CUSTOMER:", JSON.stringify(jens.data, null, 2));
}

explore().catch(console.error);
