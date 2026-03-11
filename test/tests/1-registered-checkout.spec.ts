/**
 * Test 1: Registered user checkout
 * - Sign in as jen@example.com
 * - Add a random collection of products and check out
 * - Verify new order appears under My Account → My Orders
 */
import { test, expect } from '@playwright/test';
import { signIn, addProductToCart, fillShipping, fillPayment } from './helpers';

test.describe('Test 1 — Registered user checkout', () => {

  test('sign in, add products, checkout, verify order in account', async ({ page }) => {
    // ── 1. Sign in ────────────────────────────────────────────────────────────
    await signIn(page);
    await expect(page).toHaveURL(/\/$|\/account/);

    // ── 2. Add several products ───────────────────────────────────────────────
    const productNames: string[] = [];
    for (let i = 0; i < 3; i++) {
      const name = await addProductToCart(page, i);
      productNames.push(name);
      console.log(`Added: ${name}`);
    }

    // ── 3. Go to cart and verify items ────────────────────────────────────────
    await page.goto('/cart');
    for (const name of productNames) {
      await expect(page.getByText(name).first()).toBeVisible();
    }

    // ── 4. Proceed to checkout ────────────────────────────────────────────────
    await page.getByRole('link', { name: /checkout/i }).first().click();
    await expect(page).toHaveURL(/\/checkout/);

    // ── 5. Fill shipping ─────────────────────────────────────────────────────
    await fillShipping(page);

    // ── 6. Select a shipping method ───────────────────────────────────────────
    const shippingMethod = page.getByRole('radio').first();
    if (await shippingMethod.isVisible()) await shippingMethod.click();

    // ── 7. Fill payment ───────────────────────────────────────────────────────
    await fillPayment(page);

    // ── 8. Place order ────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /place order|submit order|pay/i }).click();
    await page.waitForURL(/\/checkout\/confirmation/, { timeout: 30_000 });

    // ── 9. Confirm order number on confirmation page ──────────────────────────
    await expect(page.getByText(/order.*confirmed|thank you|order #/i).first()).toBeVisible();
    const orderId = page.url().split('/').pop();
    console.log(`Order created: ${orderId}`);

    // ── 10. Check My Orders ───────────────────────────────────────────────────
    await page.goto('/account/orders');
    await expect(page.getByText(orderId!).first()).toBeVisible({ timeout: 15_000 });
    console.log('✅ Order visible in My Orders');
  });

});
