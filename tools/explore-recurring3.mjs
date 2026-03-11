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
  
  // Try to get recurrence policy by ID
  const rp = await ctRequest(token, 'GET', '/recurrence-policies/be7a6660-400d-4659-988a-20a49bd05964');
  console.log("RECURRENCE POLICY:", JSON.stringify(rp, null, 2));
  
  // Try listing recurrence policies
  const rps = await ctRequest(token, 'GET', '/recurrence-policies');
  console.log("\nALL RECURRENCE POLICIES:", JSON.stringify(rps, null, 2));
  
  // Get the Ben Pillow Cover product to see full pricing
  const benPillow = await ctRequest(token, 'GET', '/products?where=' + encodeURIComponent('key = "ben-pillow-cover"'));
  console.log("\nBEN PILLOW COVER:", JSON.stringify(benPillow.data.results[0]?.masterData?.staged?.masterVariant?.prices, null, 2));
}

explore().catch(console.error);
