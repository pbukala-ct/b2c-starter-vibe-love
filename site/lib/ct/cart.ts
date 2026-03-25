import { apiRoot } from './client';
import type {
  BaseAddress,
  CartUpdateAction,
  CustomerResourceIdentifier,
  ShippingMethodResourceIdentifier,
} from '@commercetools/platform-sdk';

export async function getCart(cartId: string) {
  const { body } = await apiRoot.carts().withId({ ID: cartId }).get().execute();
  return body;
}

export async function createCart(currency: string, country: string, customerId?: string) {
  const { body } = await apiRoot
    .carts()
    .post({ body: { currency, country, ...(customerId ? { customerId } : {}) } })
    .execute();
  return body;
}

export async function addLineItem(
  cartId: string,
  cartVersion: number,
  productId: string,
  variantId: number,
  quantity: number,
  recurrencePolicyId?: string
) {
  // recurrenceInfo is a CT recurring orders extension not yet in the SDK's CartAddLineItemAction type
  const action = {
    action: 'addLineItem',
    productId,
    variantId,
    quantity,
    ...(recurrencePolicyId
      ? {
          recurrenceInfo: {
            recurrencePolicy: { typeId: 'recurrence-policy', id: recurrencePolicyId },
            priceSelectionMode: 'Fixed',
          },
        }
      : {}),
  } as CartUpdateAction;

  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({ body: { version: cartVersion, actions: [action] } })
    .execute();
  return body;
}

export async function removeLineItem(cartId: string, cartVersion: number, lineItemId: string) {
  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({ body: { version: cartVersion, actions: [{ action: 'removeLineItem', lineItemId }] } })
    .execute();
  return body;
}

export async function changeLineItemQuantity(
  cartId: string,
  cartVersion: number,
  lineItemId: string,
  quantity: number
) {
  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({
      body: {
        version: cartVersion,
        actions: [{ action: 'changeLineItemQuantity', lineItemId, quantity }],
      },
    })
    .execute();
  return body;
}

export async function setCartCustomerId(cartId: string, cartVersion: number, customerId: string) {
  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({ body: { version: cartVersion, actions: [{ action: 'setCustomerId', customerId }] } })
    .execute();
  return body;
}

export async function setShippingAddress(
  cartId: string,
  cartVersion: number,
  address: BaseAddress
) {
  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({ body: { version: cartVersion, actions: [{ action: 'setShippingAddress', address }] } })
    .execute();
  return body;
}

export async function addItemShippingAddress(
  cartId: string,
  cartVersion: number,
  address: BaseAddress
) {
  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({
      body: {
        version: cartVersion,
        actions: [{ action: 'addItemShippingAddress', address }],
      },
    })
    .execute();
  return body;
}

export async function setLineItemShippingDetails(
  cartId: string,
  cartVersion: number,
  lineItemId: string,
  targets: Array<{ addressKey: string; quantity: number }>
) {
  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({
      body: {
        version: cartVersion,
        actions: [
          { action: 'setLineItemShippingDetails', lineItemId, shippingDetails: { targets } },
        ],
      },
    })
    .execute();
  return body;
}

export async function setShippingMethod(
  cartId: string,
  cartVersion: number,
  shippingMethodId: string
) {
  const shippingMethod: ShippingMethodResourceIdentifier = {
    typeId: 'shipping-method',
    id: shippingMethodId,
  };
  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({
      body: { version: cartVersion, actions: [{ action: 'setShippingMethod', shippingMethod }] },
    })
    .execute();
  return body;
}

export async function addShipping(
  cartId: string,
  cartVersion: number,
  shippingKey: string,
  shippingMethodId: string,
  addressKey: string
) {
  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({
      body: {
        version: cartVersion,
        actions: [
          {
            action: 'addShippingMethod',
            shippingKey,
            shippingMethod: { typeId: 'shipping-method' as const, id: shippingMethodId },
            shippingAddress: { country: '', key: addressKey },
          },
        ],
      },
    })
    .execute();
  return body;
}

export async function setBillingAddress(cartId: string, cartVersion: number, address: BaseAddress) {
  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({ body: { version: cartVersion, actions: [{ action: 'setBillingAddress', address }] } })
    .execute();
  return body;
}

export async function getShippingMethods() {
  const { body } = await apiRoot
    .shippingMethods()
    .get({ queryArgs: { limit: 20 } })
    .execute();
  return body;
}

export async function createPayment(currency: string, centAmount: number, customerId?: string) {
  const customer: CustomerResourceIdentifier | undefined = customerId
    ? { typeId: 'customer', id: customerId }
    : undefined;
  const { body } = await apiRoot
    .payments()
    .post({
      body: {
        amountPlanned: { currencyCode: currency, centAmount },
        paymentMethodInfo: { method: 'credit-card', name: { 'en-US': 'Credit Card' } },
        ...(customer ? { customer } : {}),
      },
    })
    .execute();
  return body;
}

export async function addPaymentToCart(cartId: string, cartVersion: number, paymentId: string) {
  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({
      body: {
        version: cartVersion,
        actions: [{ action: 'addPayment', payment: { typeId: 'payment', id: paymentId } }],
      },
    })
    .execute();
  return body;
}

export async function createOrderFromCart(cartId: string, cartVersion: number) {
  const { body } = await apiRoot
    .orders()
    .post({ body: { cart: { typeId: 'cart', id: cartId }, version: cartVersion } })
    .execute();
  return body;
}

export async function applyDiscountCode(cartId: string, cartVersion: number, code: string) {
  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({ body: { version: cartVersion, actions: [{ action: 'addDiscountCode', code }] } })
    .execute();
  return body;
}

export async function removeDiscountCode(
  cartId: string,
  cartVersion: number,
  discountCodeId: string
) {
  const { body } = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .post({
      body: {
        version: cartVersion,
        actions: [
          {
            action: 'removeDiscountCode',
            discountCode: { typeId: 'discount-code', id: discountCodeId },
          },
        ],
      },
    })
    .execute();
  return body;
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

  // originOrder is a CT extension not yet in the SDK's RecurringOrderDraft type
  const { body } = await apiRoot
    .recurringOrders()
    .post({
      body: {
        originOrder: { typeId: 'order', id: orderId },
        cart: { typeId: 'cart', id: cartId },
        customer: { typeId: 'customer', id: customerId },
        startsAt: now.toISOString(),
        nextOrderAt: nextOrderAt.toISOString(),
        recurringOrderState: 'Active',
        schedule: { type: 'standard', value: schedule.value, intervalUnit: schedule.intervalUnit },
      } as unknown as Parameters<ReturnType<typeof apiRoot.recurringOrders>['post']>[0]['body'],
    })
    .execute();
  return body;
}
