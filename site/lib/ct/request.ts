import { apiUrl, projectKey } from './client';

async function getAdminToken(): Promise<string> {
  const authUrl = process.env.CTP_AUTH_URL!;
  const creds = Buffer.from(
    `${process.env.CTP_CLIENT_ID}:${process.env.CTP_CLIENT_SECRET}`
  ).toString('base64');
  const resp = await fetch(`${authUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(process.env.CTP_SCOPES!)}`,
  });
  const data = await resp.json();
  return data.access_token;
}

export async function ct(method: string, path: string, body?: unknown) {
  const token = await getAdminToken();
  const resp = await fetch(`${apiUrl}/${projectKey}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`CT ${method} ${path}: ${data.message || resp.status}`);
  return data;
}
