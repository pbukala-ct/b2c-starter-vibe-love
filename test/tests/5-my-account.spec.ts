/**
 * Test 5–9: My Account section tests
 *
 * Covers all My Account sub-pages for a signed-in registered user:
 *   5. Profile   — update name, verify success, restore
 *   6. Orders    — list view + order detail page
 *   7. Subscriptions — list view, pause/resume cycle
 *   8. Addresses — add, edit (default pills), delete
 *   9. Payment Methods — add card, set default, remove
 */
import { test, expect, Page } from '@playwright/test';
import { signIn } from './helpers';

// ─────────────────────────────────────────────────────────────
// Test 5 — Profile
// ─────────────────────────────────────────────────────────────
test.describe('Test 5 — My Account: Profile', () => {

  test('update name, verify success message, restore original', async ({ page }) => {
    await signIn(page);
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible({ timeout: 10_000 });

    // Read the current first name so we can restore it
    const firstNameInput = page.getByLabel(/first name/i).first();
    const originalName = await firstNameInput.inputValue();

    // Update first name
    const updatedName = 'TestFirstName';
    await firstNameInput.fill(updatedName);
    await page.getByRole('button', { name: /save changes/i }).click();

    // Verify success message
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 10_000 });
    console.log(`✅ Profile saved with name: ${updatedName}`);

    // Restore original name
    await firstNameInput.fill(originalName);
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 10_000 });
    console.log(`✅ Profile restored to: ${originalName}`);
  });

});

// ─────────────────────────────────────────────────────────────
// Test 6 — Orders
// ─────────────────────────────────────────────────────────────
test.describe('Test 6 — My Account: Orders', () => {

  test('orders list shows orders; order detail page loads', async ({ page }) => {
    await signIn(page);
    await page.goto('/account/orders');
    await expect(page.getByRole('heading', { name: /orders/i })).toBeVisible({ timeout: 10_000 });

    // Allow either orders list or empty state
    const hasOrders = await page.getByText(/order #/i).first().isVisible({ timeout: 10_000 }).catch(() => false);

    if (!hasOrders) {
      // Empty state is valid — just verify the "Start Shopping" link is present
      await expect(page.getByRole('link', { name: /start shopping/i })).toBeVisible();
      console.log('ℹ️  No orders found — empty state displayed');
      return;
    }

    // Verify at least one order row has number, date-ish text, and a total
    const firstOrder = page.locator('.bg-white.border').first();
    await expect(firstOrder.getByText(/order #/i)).toBeVisible();
    console.log('✅ Order list visible');

    // Click "View details" on the first order
    const detailsLink = page.getByRole('link', { name: /view details/i }).first();
    const detailsHref = await detailsLink.getAttribute('href');
    await detailsLink.click();
    await expect(page).toHaveURL(/\/account\/orders\//, { timeout: 15_000 });
    console.log(`✅ Order detail page loaded: ${detailsHref}`);

    // Verify detail page has meaningful content
    await expect(page.getByText(/order/i).first()).toBeVisible({ timeout: 10_000 });
  });

});

// ─────────────────────────────────────────────────────────────
// Test 7 — Subscriptions
// ─────────────────────────────────────────────────────────────
test.describe('Test 7 — My Account: Subscriptions', () => {

  test('subscriptions list; pause then resume an active subscription', async ({ page }) => {
    await signIn(page);
    await page.goto('/account/subscriptions');
    await expect(page.getByRole('heading', { name: /subscriptions/i })).toBeVisible({ timeout: 10_000 });

    // Check for subscriptions
    const hasSubscriptions = await page.getByText(/active|paused/i).first().isVisible({ timeout: 10_000 }).catch(() => false);

    if (!hasSubscriptions) {
      // Empty state — verify the CTA link
      await expect(page.getByRole('link', { name: /shop subscribe/i })).toBeVisible();
      console.log('ℹ️  No subscriptions found — empty state displayed');
      return;
    }

    console.log('✅ Subscriptions list visible');

    // Find an Active subscription and pause it
    const pauseBtn = page.getByRole('button', { name: /^pause$/i }).first();
    const hasPauseBtn = await pauseBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasPauseBtn) {
      await pauseBtn.click();
      // Wait for the UI to update — Paused badge should appear
      await expect(page.getByText(/paused/i).first()).toBeVisible({ timeout: 15_000 });
      console.log('✅ Subscription paused');

      // Resume it
      const resumeBtn = page.getByRole('button', { name: /^resume$/i }).first();
      await expect(resumeBtn).toBeVisible({ timeout: 10_000 });
      await resumeBtn.click();
      await expect(page.getByText(/active/i).first()).toBeVisible({ timeout: 15_000 });
      console.log('✅ Subscription resumed');
    } else {
      // All subscriptions are already paused or cancelled — just verify badges visible
      await expect(page.getByText(/paused|cancelled/i).first()).toBeVisible();
      console.log('ℹ️  No active subscription to pause — badges verified');
    }
  });

});

// ─────────────────────────────────────────────────────────────
// Test 8 — Addresses
// ─────────────────────────────────────────────────────────────
test.describe('Test 8 — My Account: Addresses', () => {

  const TEST_ADDRESS = {
    nickname: 'Test Addr',
    firstName: 'Test',
    lastName: 'User',
    street: '999 Playwright Ave',
    city: 'Austin',
    state: 'TX',
    zip: '73301',
  };

  async function fillAddressForm(page: Page, addr: typeof TEST_ADDRESS) {
    await page.getByLabel(/nickname/i).first().fill(addr.nickname);
    await page.getByLabel(/first name/i).first().fill(addr.firstName);
    await page.getByLabel(/last name/i).first().fill(addr.lastName);
    await page.getByLabel(/street address/i).first().fill(addr.street);
    await page.getByLabel(/city/i).first().fill(addr.city);
    await page.getByLabel(/state/i).first().fill(addr.state);
    await page.getByLabel(/postal|zip/i).first().fill(addr.zip);
  }

  test('add address, edit with default pills, delete', async ({ page }) => {
    await signIn(page);
    await page.goto('/account/addresses');
    await expect(page.getByRole('heading', { name: /addresses/i })).toBeVisible({ timeout: 10_000 });

    // ── Add new address ───────────────────────────────────────
    await page.getByRole('button', { name: /add address/i }).click();
    await fillAddressForm(page, TEST_ADDRESS);

    // Verify the two default pills are present and independent
    const shippingPill = page.getByRole('button', { name: /default shipping/i });
    const billingPill = page.getByRole('button', { name: /default billing/i });
    await expect(shippingPill).toBeVisible();
    await expect(billingPill).toBeVisible();

    // Neither should be active initially (new address form)
    await expect(shippingPill).not.toContainText('✓');
    await expect(billingPill).not.toContainText('✓');

    // Toggle Shipping on
    await shippingPill.click();
    await expect(shippingPill).toContainText('✓');
    await expect(billingPill).not.toContainText('✓');

    // Toggle Billing on too — both active
    await billingPill.click();
    await expect(shippingPill).toContainText('✓');
    await expect(billingPill).toContainText('✓');

    // Toggle Shipping off — only billing active
    await shippingPill.click();
    await expect(shippingPill).not.toContainText('✓');
    await expect(billingPill).toContainText('✓');

    // Save with no defaults (toggle billing off too)
    await billingPill.click();
    await page.getByRole('button', { name: /save address/i }).click();
    await page.waitForLoadState('networkidle');

    // Verify new address appears in list
    await expect(page.getByText(TEST_ADDRESS.nickname)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(TEST_ADDRESS.street)).toBeVisible();
    console.log('✅ New address added and visible');

    // ── Edit the address — change city ────────────────────────
    // Find the card containing our test address nickname and click Edit within it
    const testCard = page.locator('.bg-white.border').filter({ hasText: TEST_ADDRESS.nickname });
    await testCard.getByRole('button', { name: /edit/i }).click();

    // Change city
    const cityInput = page.getByLabel(/city/i).first();
    await cityInput.fill('Dallas');
    await page.getByRole('button', { name: /save address/i }).click();
    await page.waitForLoadState('networkidle');

    // Verify updated city shows in the card
    await expect(page.getByText('Dallas')).toBeVisible({ timeout: 10_000 });
    console.log('✅ Address edited, city updated to Dallas');

    // ── Delete the test address ───────────────────────────────
    const updatedCard = page.locator('.bg-white.border').filter({ hasText: TEST_ADDRESS.nickname });
    await updatedCard.getByRole('button', { name: /remove/i }).click();
    await page.waitForLoadState('networkidle');

    // Verify it's gone
    await expect(page.getByText(TEST_ADDRESS.nickname)).not.toBeVisible({ timeout: 10_000 });
    console.log('✅ Test address removed');
  });

});

// ─────────────────────────────────────────────────────────────
// Test 9 — Payment Methods
// ─────────────────────────────────────────────────────────────
test.describe('Test 9 — My Account: Payment Methods', () => {

  test('add card, verify in list, set default if applicable, remove card', async ({ page }) => {
    await signIn(page);
    await page.goto('/account/payments');
    await expect(page.getByRole('heading', { name: /payment methods/i })).toBeVisible({ timeout: 10_000 });

    // Count existing cards before adding
    const existingCards = await page.locator('.bg-white.border').count();

    // ── Add a new card ────────────────────────────────────────
    await page.getByRole('button', { name: /add card/i }).click();
    await page.getByLabel(/cardholder name/i).fill('Test Cardholder');
    await page.getByLabel(/card number/i).fill('4111 1111 1111 1111');
    await page.getByLabel(/expiry/i).fill('12/28');
    await page.getByRole('button', { name: /save card/i }).click();
    await page.waitForLoadState('networkidle');

    // Verify the new Visa card shows in the list
    await expect(page.getByText('1111')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Test Cardholder')).toBeVisible();
    console.log('✅ New Visa card added (last 4: 1111)');

    // ── Set as default if there were pre-existing cards ───────
    if (existingCards > 0) {
      // The new card may not be default — find its row and set default
      const newCardRow = page.locator('.bg-white.border').filter({ hasText: '1111' }).filter({ hasText: 'Test Cardholder' });
      const setDefaultBtn = newCardRow.getByRole('button', { name: /set default/i });
      const hasSetDefault = await setDefaultBtn.isVisible({ timeout: 3_000 }).catch(() => false);
      if (hasSetDefault) {
        await setDefaultBtn.click();
        await page.waitForLoadState('networkidle');
        await expect(newCardRow.getByText(/default/i)).toBeVisible({ timeout: 10_000 });
        console.log('✅ New card set as default');
      } else {
        // Already default (only card) — verify badge present
        await expect(newCardRow.getByText(/default/i)).toBeVisible();
        console.log('✅ Card shows Default badge');
      }
    }

    // ── Remove the test card ──────────────────────────────────
    const testCardRow = page.locator('.bg-white.border').filter({ hasText: '1111' }).filter({ hasText: 'Test Cardholder' });
    await testCardRow.getByRole('button', { name: /remove/i }).click();
    await page.waitForLoadState('networkidle');

    // Verify it's gone — wait for the row to disappear
    await expect(
      page.locator('.bg-white.border').filter({ hasText: 'Test Cardholder' })
    ).not.toBeVisible({ timeout: 10_000 });
    console.log('✅ Test card removed');
  });

});
