import { ct } from './request';

export async function getCustomerOrders(customerId: string, limit = 20, offset = 0) {
  return ct(
    'GET',
    `/orders?where=${encodeURIComponent(`customerId = "${customerId}"`)}&sort=createdAt+desc&limit=${limit}&offset=${offset}`
  );
}

export async function getOrderById(orderId: string) {
  return ct('GET', `/orders/${orderId}`);
}

export async function addOrderReturnInfo(
  orderId: string,
  version: number,
  items: Array<{ lineItemId: string; quantity: number }>,
  returnTrackingId: string,
  returnDate: string,
  comment?: string
) {
  return ct('POST', `/orders/${orderId}`, {
    version,
    actions: [
      {
        action: 'addReturnInfo',
        returnDate,
        returnTrackingId,
        items: items.map((i) => ({
          lineItemId: i.lineItemId,
          quantity: i.quantity,
          shipmentState: 'Returned',
          ...(comment ? { comment } : {}),
        })),
      },
    ],
  });
}
