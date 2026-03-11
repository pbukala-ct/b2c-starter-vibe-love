/**
 * Test 4: Split shipment checkout (multiple ship-to addresses)
 * - Sign in as jen@example.com
 * - Add 2 products to the cart
 * - At checkout, enable split shipment and add a second address
 * - Assign one item to each address
 * - Complete checkout
 * - Verify the order appears under My Account → My Orders
 */
import { test, expect } from '@playwright/test';
import { signIn, clearCart, addProductToCart, fillShipping, fillPayment, SHIPPING, SHIPPING_2 } from './helpers';

test.describe('Test 4 — Split shipment checkout', () => {

  test('sign in, add products, split shipment to two addresses, checkout, verify order', async ({ page }) => {
    // ── 1. Sign in ────────────────────────────────────────────────────────────
    await signIn(page);
    await expect(page).toHaveURL(/\/$|\/account/);

    // ── 1b. Clear any leftover cart items ────────────────────────────────────
    await clearCart(page);

    // ── 2. Add 2 products ───────────────────────────────────────────────────
    const productNames: string[] = [];
    for (let i = 0; i < 2; i++) {
      const name = await addProductToCart(page, i);
      productNames.push(name);
      console.log(`Added: ${name}`);
    }

    // ── 3. Go to cart and verify items ──────────────────────────────────────
    await page.goto('/cart');
    for (const name of productNames) {
      await expect(page.getByText(name).first()).toBeVisible();
    }

    // ── 4. Proceed to checkout ──────────────────────────────────────────────
    await page.locator('main').getByRole('link', { name: /checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout/);

    // ── 5. Fill primary shipping address ────────────────────────────────────
    await fillShipping(page, SHIPPING);

    // ── 6. Enable split shipment ────────────────────────────────────────────
    const splitCheckbox = page.getByLabel(/ship to multiple addresses|split shipment/i);
    await splitCheckbox.check();
    await expect(splitCheckbox).toBeChecked();

    // ── 7. Add second address ───────────────────────────────────────────────
    await page.getByText(/add another address/i).click();

    // Fill the second address fields (they appear under "Address 2")
    // Target the second set of address fields using nth selectors
    const addr2 = SHIPPING_2;
    const firstNameInputs = page.getByLabel(/first name/i);
    const lastNameInputs = page.getByLabel(/last name/i);
    const streetInputs = page.getByLabel(/street address/i);
    const cityInputs = page.getByLabel(/city/i);
    const zipInputs = page.getByLabel(/zip|postal/i);

    // The second address is the last set of matching fields
    await firstNameInputs.last().fill(addr2.firstName);
    await lastNameInputs.last().fill(addr2.lastName);
    await streetInputs.last().fill(addr2.streetAddress);
    await cityInputs.last().fill(addr2.city);
    await zipInputs.last().fill(addr2.zip);

    // ── 8. Assign items to addresses ────────────────────────────────────────
    // Each item starts with all quantity at primary address. We need to move
    // one item to the second address. The UI shows number inputs per item per address.
    // For the second product, set primary qty to 0 and second address qty to 1.
    const itemSections = page.getByText(/qty:/i);
    const qtyInputs = page.locator('input[type="number"]');
    const qtyCount = await qtyInputs.count();

    if (qtyCount >= 4) {
      // 2 items × 2 addresses = 4 number inputs
      // Item 1: addr1=1, addr2=0  (keep default)
      // Item 2: addr1=0, addr2=1
      await qtyInputs.nth(2).fill('0');  // item 2 → primary = 0
      await qtyInputs.nth(3).fill('1');  // item 2 → secondary = 1
    }

    // ── 9. Fill payment ─────────────────────────────────────────────────────
    await fillPayment(page);

    // ── 10. Place order ─────────────────────────────────────────────────────
    await page.getByRole('button', { name: /place order|submit order|pay/i }).click();
    await page.waitForURL(/\/checkout\/confirmation/, { timeout: 30_000 });

    // ── 11. Verify order confirmation ───────────────────────────────────────
    await expect(page.getByText(/order.*confirmed|thank you|order #/i).first()).toBeVisible();
    const orderId = page.url().split('/').pop();
    console.log(`Split shipment order created: ${orderId}`);

    // ── 12. Check My Orders ─────────────────────────────────────────────────
    await page.goto('/account/orders');
    await expect(page.locator(`a[href*="${orderId}"]`).first()).toBeVisible({ timeout: 15_000 });
    console.log('✅ Split shipment order visible in My Orders');
  });

});
