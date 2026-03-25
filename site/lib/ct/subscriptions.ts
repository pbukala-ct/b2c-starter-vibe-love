import { apiRoot } from './client';
import type { RecurringOrderUpdateAction } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/recurring-order';

export async function getCustomerRecurringOrders(customerId: string) {
  const { body } = await apiRoot
    .recurringOrders()
    .get({
      queryArgs: {
        where: `customer(id = "${customerId}")`,
        limit: 50,
        expand: ['originOrder'],
      },
    })
    .execute();
  return body;
}

export async function getRecurringOrderById(recurringOrderId: string) {
  const { body } = await apiRoot.recurringOrders().withId({ ID: recurringOrderId }).get().execute();
  return body;
}

export async function updateRecurringOrder(
  recurringOrderId: string,
  version: number,
  actions: Array<RecurringOrderUpdateAction>
) {
  const { body } = await apiRoot
    .recurringOrders()
    .withId({ ID: recurringOrderId })
    .post({ body: { version, actions } })
    .execute();
  return body;
}

export async function getRecurrencePolicies() {
  const { body } = await apiRoot
    .recurrencePolicies()
    .get({ queryArgs: { limit: 20 } })
    .execute();
  return body;
}

export async function getRecurrencePolicyById(policyId: string) {
  const { body } = await apiRoot.recurrencePolicies().withId({ ID: policyId }).get().execute();
  return body;
}
