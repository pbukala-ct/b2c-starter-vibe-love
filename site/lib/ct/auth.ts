import { apiUrl, projectKey } from './client';

async function getAdminToken(): Promise<string> {
  const authUrl = process.env.CTP_AUTH_URL!;
  const creds = Buffer.from(`${process.env.CTP_CLIENT_ID}:${process.env.CTP_CLIENT_SECRET}`).toString('base64');
  const resp = await fetch(`${authUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(process.env.CTP_SCOPES!)}`,
  });
  const data = await resp.json();
  return data.access_token;
}

async function ct(method: string, path: string, body?: unknown) {
  const token = await getAdminToken();
  const resp = await fetch(`${apiUrl}/${projectKey}${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`CT ${method} ${path}: ${data.message || resp.status}`);
  return data;
}

export async function signInCustomer(email: string, password: string, anonymousCartId?: string) {
  const body: Record<string, unknown> = { email, password };
  if (anonymousCartId) {
    body.anonymousCartId = anonymousCartId;
    body.anonymousCartSignInMode = 'MergeWithExistingCustomerCart';
  }
  // CT customer sign-in endpoint
  return ct('POST', '/login', body);
}

export async function signUpCustomer(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  return ct('POST', '/customers', data);
}

export async function getCustomerById(customerId: string) {
  return ct('GET', `/customers/${customerId}`);
}

export async function getCustomerOrders(customerId: string, limit = 20, offset = 0) {
  return ct(
    'GET',
    `/orders?where=${encodeURIComponent(`customerId = "${customerId}"`)}&sort=createdAt+desc&limit=${limit}&offset=${offset}`
  );
}

export async function getCustomerRecurringOrders(customerId: string) {
  return ct(
    'GET',
    `/recurring-orders?where=${encodeURIComponent(`customer(id = "${customerId}")`)}&limit=50&expand=originOrder`
  );
}

export async function updateCustomer(
  customerId: string,
  version: number,
  actions: Array<{ action: string; [key: string]: unknown }>
) {
  return ct('POST', `/customers/${customerId}`, { version, actions });
}

export async function getRecurringOrderById(recurringOrderId: string) {
  return ct('GET', `/recurring-orders/${recurringOrderId}`);
}

export async function updateRecurringOrder(
  recurringOrderId: string,
  version: number,
  actions: Array<{ action: string; [key: string]: unknown }>
) {
  return ct('POST', `/recurring-orders/${recurringOrderId}`, { version, actions });
}

export async function getRecurrencePolicies() {
  return ct('GET', '/recurrence-policies?limit=20');
}

export async function getCustomObject(container: string, key: string) {
  try {
    return await ct('GET', `/custom-objects/${container}/${key}`);
  } catch (e) {
    if ((e as Error).message.includes('404') || (e as Error).message.includes('ResourceNotFound')) {
      return null;
    }
    throw e;
  }
}

export async function upsertCustomObject(container: string, key: string, value: unknown) {
  return ct('POST', '/custom-objects', { container, key, value });
}

export async function getOrderById(orderId: string) {
  return ct('GET', `/orders/${orderId}`);
}
