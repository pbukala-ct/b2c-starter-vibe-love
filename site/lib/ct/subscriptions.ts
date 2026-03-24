import { ct } from './request';

export async function getCustomerRecurringOrders(customerId: string) {
  return ct(
    'GET',
    `/recurring-orders?where=${encodeURIComponent(`customer(id = "${customerId}")`)}&limit=50&expand=originOrder`
  );
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
