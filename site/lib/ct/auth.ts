import { ct } from './request';

export async function signInCustomer(email: string, password: string, anonymousCartId?: string) {
  const body: Record<string, unknown> = { email, password };
  if (anonymousCartId) {
    body.anonymousCartId = anonymousCartId;
    body.anonymousCartSignInMode = 'MergeWithExistingCustomerCart';
  }
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

export async function updateCustomer(
  customerId: string,
  version: number,
  actions: Array<{ action: string; [key: string]: unknown }>
) {
  return ct('POST', `/customers/${customerId}`, { version, actions });
}
