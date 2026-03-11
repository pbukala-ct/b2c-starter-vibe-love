import 'dotenv/config';

const projectKey = process.env.CTP_PROJECT_KEY;
const authUrl = process.env.CTP_AUTH_URL;
const apiUrl = process.env.CTP_API_URL;

// Get token
async function getToken() {
  const creds = Buffer.from(`${process.env.CTP_CLIENT_ID}:${process.env.CTP_CLIENT_SECRET}`).toString('base64');
  const resp = await fetch(`${authUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(process.env.CTP_SCOPES)}`
  });
  const data = await resp.json();
  return data.access_token;
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
  console.log("Token obtained");
  
  // Try different recurring order endpoints
  const endpoints = [
    '/recurring-order-policies',
    '/recurring-orders',
    '/subscription-policies',
    '/subscriptions',
    '/order-edits',
  ];
  
  for (const ep of endpoints) {
    const result = await ctRequest(token, 'GET', ep);
    console.log(`\n${ep}: status=${result.status}`, JSON.stringify(result.data).slice(0, 200));
  }
  
  // Try creating a recurrence policy
  const createResult = await ctRequest(token, 'POST', '/recurring-order-policies', {
    key: 'monthly',
    name: { 'en-US': 'Monthly' },
    recurrenceInterval: { count: 1, unit: 'month' }
  });
  console.log("\nCreate recurrence policy:", createResult.status, JSON.stringify(createResult.data).slice(0, 500));
}

explore().catch(console.error);
