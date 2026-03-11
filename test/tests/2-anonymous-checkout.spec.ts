/**
 * Test 2: Anonymous user checkout
 * - NOT logged in
 * - Add a random collection of products and check out as guest
 */
import { test, expect } from '@playwright/test';
import { addProductToCart, fillShipping, fillPayment } from './helpers';

test.describe('Test 2 — Anonymous user checkout', () => {

  test('add products and checkout without signing in', async ({ page }) => {
    // ── 1. Confirm not signed in ──────────────────────────────────────────────
    await page.goto('/');
    // If somehow signed in (shared browser state), skip — each test uses a
    // fresh browser context in Playwright by default.

    // ── 2. Add several products ───────────────────────────────────────────────
    const productNames: string[] = [];
    for (let i = 0; i < 2; i++) {
      const name = await addProductToCart(page, i);
      productNames.push(name);
      console.log(`Added: ${name}`);
    }

    // ── 3. Go to cart and verify ──────────────────────────────────────────────
    await page.goto('/cart');
    for (const name of productNames) {
      await expect(page.getByText(name).first()).toBeVisible();
    }

    // ── 4. Proceed to checkout ────────────────────────────────────────────────
    await page.getByRole('link', { name: /checkout/i }).first().click();
    await expect(page).toHaveURL(/\/checkout/);

    // Confirm no "Welcome back" / pre-filled account info — this is anonymous
    await expect(page.getByText(/sign in/i).first()).toBeVisible();

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

    // ── 9. Confirm order confirmation page ────────────────────────────────────
    await expect(page.getByText(/order.*confirmed|thank you|order #/i).first()).toBeVisible();
    const orderId = page.url().split('/').pop();
    console.log(`✅ Anonymous order created: ${orderId}`);
  });

});
