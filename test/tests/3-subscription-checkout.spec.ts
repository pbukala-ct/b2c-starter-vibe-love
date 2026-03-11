/**
 * Test 3: Subscription (Subscribe & Save) checkout
 * - Sign in as jen@example.com
 * - Add Ben Pillow Cover with a subscription/recurrence option
 * - Check out
 * - Verify subscription appears under My Account → My Subscriptions
 */
import { test, expect } from '@playwright/test';
import { signIn, fillShipping, fillPayment } from './helpers';

test.describe('Test 3 — Subscription checkout', () => {

  test('sign in, subscribe to product, checkout, verify in My Subscriptions', async ({ page }) => {
    // ── 1. Sign in ────────────────────────────────────────────────────────────
    await signIn(page);

    // ── 2. Navigate to a Subscribe & Save product ─────────────────────────────
    // Ben Pillow Cover is the known subscription product in the CT project
    await page.goto('/products/ben-pillow-cover');
    await expect(page.locator('h1')).toContainText(/ben pillow cover/i, { timeout: 15_000 });

    // ── 3. Select "Subscribe & Save" option ──────────────────────────────────
    const subscribeRadio = page.getByRole('radio', { name: /subscribe/i });
    await expect(subscribeRadio).toBeVisible({ timeout: 10_000 });
    await subscribeRadio.click();

    // Select a recurrence policy (Monthly, Weekly, etc.)
    const policySelect = page.getByRole('combobox').first();
    if (await policySelect.isVisible()) {
      await policySelect.selectOption({ index: 0 });
    }

    // ── 4. Add to cart ────────────────────────────────────────────────────────
    // Wait for the POST /api/cart/items response to confirm the item was saved.
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/cart/items') && resp.request().method() === 'POST',
        { timeout: 10_000 },
      ),
      page.getByRole('button', { name: /subscribe.*add|add to cart/i }).click(),
    ]);

    // ── 5. Verify subscription label in cart ─────────────────────────────────
    await page.goto('/cart');
    await expect(page.getByText(/monthly|weekly|bi-weekly|subscribe/i).first()).toBeVisible();

    // ── 6. Proceed to checkout ────────────────────────────────────────────────
    // Scope to <main> so we click the cart page's button, not the MiniCart's
    // off-screen "Checkout" link that lives in the header DOM.
    await page.locator('main').getByRole('link', { name: /checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout/);

    // ── 7. Fill shipping ─────────────────────────────────────────────────────
    await fillShipping(page);

    // ── 8. Select a shipping method ───────────────────────────────────────────
    const shippingMethod = page.getByRole('radio').first();
    if (await shippingMethod.isVisible()) await shippingMethod.click();

    // ── 9. Fill payment ───────────────────────────────────────────────────────
    await fillPayment(page);

    // ── 10. Place order ───────────────────────────────────────────────────────
    await page.getByRole('button', { name: /place order|submit order|pay/i }).click();
    await page.waitForURL(/\/checkout\/confirmation/, { timeout: 30_000 });

    // ── 11. Verify order confirmation ────────────────────────────────────────
    await expect(page.getByText(/order.*confirmed|thank you|order #/i).first()).toBeVisible();
    const orderId = page.url().split('/').pop();
    console.log(`Subscription order created: ${orderId}`);

    // ── 12. Check My Subscriptions ────────────────────────────────────────────
    await page.goto('/account/subscriptions');
    // Subscriptions may take a moment to appear (async creation in CT)
    await expect(
      page.getByText(/ben pillow cover/i).first()
    ).toBeVisible({ timeout: 20_000 });
    console.log('✅ Subscription visible in My Subscriptions');
  });

});
