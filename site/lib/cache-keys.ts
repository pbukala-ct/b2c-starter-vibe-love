export const KEY_CART = 'cart';
export const KEY_ACCOUNT = 'account';
export const KEY_ORDERS = 'orders';
export const KEY_SUBSCRIPTIONS = 'subscriptions';
export const KEY_RECURRENCE_POLICIES = 'recurrence-policies';

export function keyOrder(orderId: string) {
  return `order-${orderId}`;
}

export function keySubscription(id: string) {
  return `subscription-${id}`;
}
