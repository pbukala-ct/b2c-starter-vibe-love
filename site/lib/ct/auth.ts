import { apiRoot } from './client';
import type { CustomerUpdateAction } from '@commercetools/platform-sdk';
import type { RecurringOrderUpdateAction } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/recurring-order';
import { QueryParam } from '@commercetools/platform-sdk/dist/declarations/src/generated/shared/utils/common-types';

export async function signInCustomer(email: string, password: string, anonymousCartId?: string) {
  const { body } = await apiRoot
    .login()
    .post({
      body: {
        email,
        password,
        ...(anonymousCartId
          ? {
              anonymousCartId,
              anonymousCartSignInMode: 'MergeWithExistingCustomerCart',
            }
          : {}),
      },
    })
    .execute();
  return body;
}

export async function signUpCustomer(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const { body } = await apiRoot.customers().post({ body: data }).execute();
  return body;
}

export async function getCustomerById(customerId: string) {
  const { body } = await apiRoot.customers().withId({ ID: customerId }).get().execute();
  return body;
}

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

export async function updateCustomer(
  customerId: string,
  version: number,
  actions: Array<{ action: string; [key: string]: unknown }>
) {
  const { body } = await apiRoot
    .customers()
    .withId({ ID: customerId })
    .post({ body: { version, actions: actions as CustomerUpdateAction[] } })
    .execute();
  return body;
}

export async function getRecurringOrderById(
  recurringOrderId: string,
  queryArgs?: {
    expand?: string | string[];
    [key: string]: QueryParam;
  }
) {
  const { body } = await apiRoot
    .recurringOrders()
    .withId({ ID: recurringOrderId })
    .get({ queryArgs: queryArgs })
    .execute();
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

export async function getCustomObject(container: string, key: string) {
  try {
    const { body } = await apiRoot
      .customObjects()
      .withContainerAndKey({ container, key })
      .get()
      .execute();
    return body;
  } catch (e) {
    if ((e as Error).message.includes('404') || (e as Error).message.includes('ResourceNotFound')) {
      return null;
    }
    throw e;
  }
}

export async function upsertCustomObject(container: string, key: string, value: unknown) {
  const { body } = await apiRoot
    .customObjects()
    .post({ body: { container, key, value } })
    .execute();
  return body;
}

export async function getOrderById(orderId: string) {
  const { body } = await apiRoot.orders().withId({ ID: orderId }).get().execute();
  return body;
}
