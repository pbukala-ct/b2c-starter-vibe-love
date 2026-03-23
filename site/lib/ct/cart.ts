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

export async function getCart(cartId: string) {
  return ct('GET', `/carts/${cartId}`);
}

export async function createCart(currency: string, country: string, customerId?: string) {
  const body: Record<string, unknown> = {
    currency,
    country,
  };
  if (customerId) body.customerId = customerId;
  return ct('POST', '/carts', body);
}

export async function addLineItem(
  cartId: string,
  cartVersion: number,
  productId: string,
  variantId: number,
  quantity: number,
  recurrencePolicyId?: string
) {
  const addAction: Record<string, unknown> = {
    action: 'addLineItem',
    productId,
    variantId,
    quantity,
  };
  if (recurrencePolicyId) {
    addAction.recurrenceInfo = {
      recurrencePolicy: { typeId: 'recurrence-policy', id: recurrencePolicyId },
      priceSelectionMode: 'Fixed',
    };
  }
  return ct('POST', `/carts/${cartId}`, {
    version: cartVersion,
    actions: [addAction],
  });
}

export async function removeLineItem(cartId: string, cartVersion: number, lineItemId: string) {
  return ct('POST', `/carts/${cartId}`, {
    version: cartVersion,
    actions: [{ action: 'removeLineItem', lineItemId }],
  });
}

export async function changeLineItemQuantity(
  cartId: string,
  cartVersion: number,
  lineItemId: string,
  quantity: number
) {
  return ct('POST', `/carts/${cartId}`, {
    version: cartVersion,
    actions: [{ action: 'changeLineItemQuantity', lineItemId, quantity }],
  });
}

export async function setCartCustomerId(cartId: string, cartVersion: number, customerId: string) {
  return ct('POST', `/carts/${cartId}`, {
    version: cartVersion,
    actions: [{ action: 'setCustomerId', customerId }],
  });
}

export async function setShippingAddress(
  cartId: string,
  cartVersion: number,
  address: Record<string, string>
) {
  return ct('POST', `/carts/${cartId}`, {
    version: cartVersion,
    actions: [{ action: 'setShippingAddress', address }],
  });
}

export async function addItemShippingAddress(
  cartId: string,
  cartVersion: number,
  address: Record<string, unknown>
) {
  return ct('POST', `/carts/${cartId}`, {
    version: cartVersion,
    actions: [{ action: 'addItemShippingAddress', address }],
  });
}

export async function setLineItemShippingDetails(
  cartId: string,
  cartVersion: number,
  lineItemId: string,
  targets: Array<{ addressKey: string; quantity: number }>
) {
  return ct('POST', `/carts/${cartId}`, {
    version: cartVersion,
    actions: [{ action: 'setLineItemShippingDetails', lineItemId, shippingDetails: { targets } }],
  });
}

export async function setShippingMethod(
  cartId: string,
  cartVersion: number,
  shippingMethodId: string
) {
  return ct('POST', `/carts/${cartId}`, {
    version: cartVersion,
    actions: [{
      action: 'setShippingMethod',
      shippingMethod: { typeId: 'shipping-method', id: shippingMethodId },
    }],
  });
}

export async function addShipping(
  cartId: string,
  cartVersion: number,
  shippingKey: string,
  shippingMethodId: string,
  addressKey: string
) {
  return ct('POST', `/carts/${cartId}`, {
    version: cartVersion,
    actions: [{
      action: 'addShipping',
      shippingKey,
      shippingMethod: { typeId: 'shipping-method', id: shippingMethodId },
      shippingAddress: { key: addressKey },
    }],
  });
}

export async function setBillingAddress(
  cartId: string,
  cartVersion: number,
  address: Record<string, string>
) {
  return ct('POST', `/carts/${cartId}`, {
    version: cartVersion,
    actions: [{ action: 'setBillingAddress', address }],
  });
}

export async function getShippingMethods() {
  return ct('GET', '/shipping-methods?limit=20');
}

export async function createPayment(currency: string, centAmount: number, customerId?: string) {
  const body: Record<string, unknown> = {
    amountPlanned: { currencyCode: currency, centAmount },
    paymentMethodInfo: { method: 'credit-card', name: { 'en-US': 'Credit Card' } },
  };
  if (customerId) body.customer = { typeId: 'customer', id: customerId };
  return ct('POST', '/payments', body);
}

export async function addPaymentToCart(cartId: string, cartVersion: number, paymentId: string) {
  return ct('POST', `/carts/${cartId}`, {
    version: cartVersion,
    actions: [{ action: 'addPayment', payment: { typeId: 'payment', id: paymentId } }],
  });
}

export async function createOrderFromCart(cartId: string, cartVersion: number) {
  return ct('POST', '/orders', { cart: { typeId: 'cart', id: cartId }, version: cartVersion });
}

export async function applyDiscountCode(cartId: string, cartVersion: number, code: string) {
  return ct('POST', `/carts/${cartId}`, {
    version: cartVersion,
    actions: [{ action: 'addDiscountCode', code }],
  });
}

export async function removeDiscountCode(cartId: string, cartVersion: number, discountCodeId: string) {
  return ct('POST', `/carts/${cartId}`, {
    version: cartVersion,
    actions: [{ action: 'removeDiscountCode', discountCode: { typeId: 'discount-code', id: discountCodeId } }],
  });
}

export async function createRecurringOrder(
  orderId: string,
  cartId: string,
  customerId: string,
  schedule: { value: number; intervalUnit: string }
) {
  const now = new Date();
  const nextOrderAt = new Date(now);
  if (schedule.intervalUnit === 'Months') {
    nextOrderAt.setMonth(nextOrderAt.getMonth() + schedule.value);
  } else if (schedule.intervalUnit === 'Weeks') {
    nextOrderAt.setDate(nextOrderAt.getDate() + schedule.value * 7);
  }

  return ct('POST', '/recurring-orders', {
    originOrder: { typeId: 'order', id: orderId },
    cart: { typeId: 'cart', id: cartId },
    customer: { typeId: 'customer', id: customerId },
    startsAt: now.toISOString(),
    nextOrderAt: nextOrderAt.toISOString(),
    recurringOrderState: 'Active',
    schedule: { type: 'standard', value: schedule.value, intervalUnit: schedule.intervalUnit },
  });
}
