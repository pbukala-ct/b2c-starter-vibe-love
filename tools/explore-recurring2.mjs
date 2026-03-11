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
  
  // Get the existing recurring order
  const ro = await ctRequest(token, 'GET', '/recurring-orders?limit=5');
  console.log("RECURRING ORDERS:", JSON.stringify(ro.data.results, null, 2));
  
  // Try to understand subscriptions
  const subs = await ctRequest(token, 'GET', '/subscriptions');
  console.log("\nSUBSCRIPTIONS:", JSON.stringify(subs.data, null, 2));
  
  // Check what the recurring order looks like
  if (ro.data.results.length > 0) {
    const id = ro.data.results[0].id;
    const detail = await ctRequest(token, 'GET', `/recurring-orders/${id}`);
    console.log("\nRECURRING ORDER DETAIL:", JSON.stringify(detail.data, null, 2));
  }
}

explore().catch(console.error);
