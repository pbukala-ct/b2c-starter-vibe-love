import { NextRequest, NextResponse } from 'next/server';
import { requireOrderPlacementRole, requireActiveCustomer } from '@/lib/agent-session';
import { writeAuditEntry } from '@/lib/agent-audit';
import { apiRoot } from '@/lib/ct/client';
import {
  setShippingAddress,
  setShippingMethod,
  setBillingAddress,
  createPayment,
  addPaymentToCart,
  createOrderFromCart,
  getShippingMethods,
} from '@/lib/ct/cart';

type Params = { params: Promise<{ customerId: string }> };

/**
 * POST /api/agent/customers/[customerId]/checkout
 *
 * Initiates and completes a checkout on behalf of a customer using a saved payment method.
 * Body: { paymentMethodId: string, shippingMethodId?: string, confirmationToken: string }
 *
 * The caller must first call GET /checkout-preview to display the confirmation screen,
 * then POST here with confirmationToken = 'confirmed' to submit.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireOrderPlacementRole(req);
  if (error) return error;

  const { customerId } = await params;
  const scopeError = requireActiveCustomer(session, customerId);
  if (scopeError) return scopeError;

  let body: { paymentMethodId?: string; shippingMethodId?: string; confirmationToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.paymentMethodId) {
    return NextResponse.json({ error: 'paymentMethodId is required' }, { status: 400 });
  }
  if (body.confirmationToken !== 'confirmed') {
    return NextResponse.json(
      { error: 'Explicit confirmation required. Set confirmationToken: "confirmed".' },
      { status: 400 }
    );
  }

  // Find the customer's active cart
  const cartResult = await apiRoot
    .carts()
    .get({ queryArgs: { where: `customerId="${customerId}" and cartState="Active"`, limit: 1 } })
    .execute();
  const cart = cartResult.body.results[0];
  if (!cart) return NextResponse.json({ error: 'No active cart' }, { status: 404 });

  await writeAuditEntry({
    agentId: session.agentId,
    agentEmail: session.agentEmail,
    agentName: session.agentName,
    customerId,
    sessionId: session.sessionId,
    actionType: 'checkout.initiated',
    actionDetail: {
      cartId: cart.id,
      paymentMethodId: body.paymentMethodId,
      cartTotal: cart.totalPrice,
    },
    timestamp: new Date().toISOString(),
    outcome: 'success',
  });

  try {
    let currentCart = cart;
    let version = cart.version;

    // Ensure shipping address is set
    if (!currentCart.shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address must be set on the cart before checkout' },
        { status: 400 }
      );
    }

    // Set shipping method
    const shippingMethodsResult = await getShippingMethods();
    const shippingMethods = shippingMethodsResult.results;
    const shippingMethod = body.shippingMethodId
      ? shippingMethods.find((sm: { id: string }) => sm.id === body.shippingMethodId)
      : shippingMethods[0];

    if (shippingMethod) {
      currentCart = await setShippingMethod(currentCart.id, version, shippingMethod.id);
      version = currentCart.version;
    }

    // Set billing address to same as shipping if not set
    currentCart = await setBillingAddress(
      currentCart.id,
      version,
      currentCart.shippingAddress!
    );
    version = currentCart.version;

    // Create payment using the saved payment method reference
    const payment = await createPayment(
      currentCart.totalPrice.currencyCode,
      currentCart.totalPrice.centAmount,
      customerId
    );
    currentCart = await addPaymentToCart(currentCart.id, version, payment.id);
    version = currentCart.version;

    // Place the order
    const order = await createOrderFromCart(currentCart.id, version);

    // Attach agent attribution to the order (non-blocking — checkout succeeds even if this fails)
    try {
      await apiRoot
        .orders()
        .withId({ ID: order.id })
        .post({
          body: {
            version: order.version,
            actions: [
              {
                action: 'setCustomType',
                type: { typeId: 'type', key: 'agent-order-attribution' },
                fields: {},
              },
              { action: 'setCustomField', name: 'agentId', value: session.agentId },
              { action: 'setCustomField', name: 'agentEmail', value: session.agentEmail },
              { action: 'setCustomField', name: 'agentName', value: session.agentName },
            ],
          },
        })
        .execute();
    } catch {
      // Attribution write failed — order still valid; log silently
      console.error('[agent-checkout] Failed to write attribution to order', order.id);
    }

    await writeAuditEntry({
      agentId: session.agentId,
      agentEmail: session.agentEmail,
      agentName: session.agentName,
      customerId,
      sessionId: session.sessionId,
      actionType: 'checkout.completed',
      actionDetail: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderTotal: order.totalPrice,
        cartId: cart.id,
      },
      timestamp: new Date().toISOString(),
      outcome: 'success',
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderTotal: order.totalPrice,
    });
  } catch (err: unknown) {
    const failureReason = err instanceof Error ? err.message : 'Checkout failed';

    await writeAuditEntry({
      agentId: session.agentId,
      agentEmail: session.agentEmail,
      agentName: session.agentName,
      customerId,
      sessionId: session.sessionId,
      actionType: 'checkout.failed',
      actionDetail: { cartId: cart.id, paymentMethodId: body.paymentMethodId },
      timestamp: new Date().toISOString(),
      outcome: 'failure',
      failureReason,
    });

    return NextResponse.json({ error: failureReason }, { status: 500 });
  }
}
