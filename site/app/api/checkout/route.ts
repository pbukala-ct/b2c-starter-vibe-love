import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSessionToken, setSessionCookie } from '@/lib/session';
import {
  getCart,
  createCart,
  addLineItem,
  setShippingAddress,
  setShippingMethod,
  setBillingAddress,
  createPayment,
  addPaymentToCart,
  createOrderFromCart,
  getShippingMethods,
} from '@/lib/ct/cart';
import { createRecurringOrder } from '@/lib/ct/cart';
import { COUNTRY_CONFIG } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    shippingAddresses,
    billingAddress,
    shippingMethodId,
  } = body;

  const session = await getSession();
  if (!session.cartId) {
    return NextResponse.json({ error: 'No cart found' }, { status: 400 });
  }

  try {
    let cart = await getCart(session.cartId);
    let version = cart.version;

    // Migrate old Multiple-mode carts to new Single-mode carts
    if (cart.shippingMode === 'Multiple') {
      const country = cart.country || 'US';
      const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG['US'];
      const newCart = await createCart(config.currency, country, session.customerId);
      let newVersion = newCart.version;
      let migratedCart = newCart;

      for (const item of (cart.lineItems || [])) {
        const policyId = item.recurrenceInfo?.recurrencePolicy?.id;
        migratedCart = await addLineItem(
          migratedCart.id,
          newVersion,
          item.productId,
          item.variant?.id || 1,
          item.quantity,
          policyId
        );
        newVersion = migratedCart.version;
      }

      cart = migratedCart;
      version = cart.version;
    }

    const primaryAddress = shippingAddresses?.[0] || billingAddress;

    // Set shipping address
    cart = await setShippingAddress(cart.id, version, primaryAddress);
    version = cart.version;

    // Set shipping method
    const shippingMethodsResult = await getShippingMethods();
    const shippingMethods = shippingMethodsResult.results;
    const defaultShipping = shippingMethodId
      ? shippingMethods.find((sm: { id: string }) => sm.id === shippingMethodId)
      : shippingMethods[0];

    if (defaultShipping) {
      try {
        cart = await setShippingMethod(cart.id, version, defaultShipping.id);
        version = cart.version;
      } catch (e) {
        console.error('setShippingMethod error:', e);
      }
    }

    // Set billing address
    cart = await setBillingAddress(cart.id, version, billingAddress);
    version = cart.version;

    // Create payment
    const currency = cart.totalPrice?.currencyCode || 'USD';
    const centAmount = cart.totalPrice?.centAmount || 0;
    const payment = await createPayment(currency, centAmount, session.customerId);
    cart = await addPaymentToCart(cart.id, version, payment.id);
    version = cart.version;

    // Create order from cart
    const order = await createOrderFromCart(cart.id, version);

    // Create recurring orders for subscription line items
    const subscriptionItems = (order.lineItems || []).filter(
      (item: { recurrenceInfo?: { recurrencePolicy: { id: string } } }) => item.recurrenceInfo?.recurrencePolicy
    );

    if (subscriptionItems.length > 0 && session.customerId) {
      for (const item of subscriptionItems) {
        const policyId = item.recurrenceInfo.recurrencePolicy.id;
        const policiesResp = await fetch(
          `${process.env.CTP_API_URL}/${process.env.CTP_PROJECT_KEY}/recurrence-policies/${policyId}`,
          { headers: { 'Authorization': `Bearer ${await getAdminToken()}` } }
        );
        if (policiesResp.ok) {
          const policy = await policiesResp.json();
          try {
            await createRecurringOrder(
              order.id,
              cart.id,
              session.customerId,
              { value: policy.schedule.value, intervalUnit: policy.schedule.intervalUnit }
            );
          } catch (e) {
            console.error('Failed to create recurring order:', e);
          }
        }
      }
    }

    // Clear cart from session
    const newSession = { ...session, cartId: undefined };
    const token = await createSessionToken(newSession);
    const resp = NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber });
    setSessionCookie(resp, token);
    return resp;
  } catch (e: unknown) {
    console.error('Checkout error:', e);
    const msg = e instanceof Error ? e.message : 'Checkout failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

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
