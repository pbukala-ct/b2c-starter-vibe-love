import { apiRoot } from './client';

export async function getCustomerOrders(customerId: string, limit = 20, offset = 0) {
  const { body } = await apiRoot
    .orders()
    .get({
      queryArgs: {
        where: `customerId = "${customerId}"`,
        sort: 'createdAt desc',
        limit,
        offset,
      },
    })
    .execute();
  return body;
}

export async function getOrderById(orderId: string) {
  const { body } = await apiRoot.orders().withId({ ID: orderId }).get().execute();
  return body;
}

export async function addOrderReturnInfo(
  orderId: string,
  version: number,
  items: Array<{ lineItemId: string; quantity: number }>,
  returnTrackingId: string,
  returnDate: string,
  comment?: string
) {
  const { body } = await apiRoot
    .orders()
    .withId({ ID: orderId })
    .post({
      body: {
        version,
        actions: [
          {
            action: 'addReturnInfo',
            returnDate,
            returnTrackingId,
            items: items.map((i) => ({
              lineItemId: i.lineItemId,
              quantity: i.quantity,
              shipmentState: 'Returned' as const,
              ...(comment ? { comment } : {}),
            })),
          },
        ],
      },
    })
    .execute();
  return body;
}
