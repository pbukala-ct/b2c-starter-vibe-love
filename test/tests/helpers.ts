import { Page } from '@playwright/test';

export const REGISTERED_USER = {
  email: 'jen@example.com',
  password: '123',
};

// US checkout uses a single "Street Address" field (e.g. "123 Main St")
export const SHIPPING = {
  firstName: 'Jennifer',
  lastName: 'Robinson',
  streetAddress: '123 Test Street',
  city: 'New York',
  state: 'NY',
  zip: '10001',
};

// Second address for split-shipment test
export const SHIPPING_2 = {
  firstName: 'Jennifer',
  lastName: 'Robinson',
  streetAddress: '456 Oak Avenue',
  city: 'Los Angeles',
  state: 'CA',
  zip: '90001',
};

export const CARD = {
  holderName: 'Jennifer Robinson',
  number: '4111111111111111',
  expiry: '12/28',
  cvv: '123',
};

// Hardcoded furniture product slugs so addProductToCart is deterministic.
// Navigating directly to a product URL avoids index-ordering surprises on the
// category page and is unaffected by personalisation, A/B tests, or page sort.
const FURNITURE_SLUGS = [
  'opal-king-bed',
  'leah-armchair',
  'traditional-l-seater-sofa',
];

/** Sign in as the registered user via the login page */
export async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(REGISTERED_USER.email);
  await page.getByLabel(/password/i).fill(REGISTERED_USER.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/$|\/account/);
}

/** Sign out if currently logged in */
export async function signOut(page: Page) {
  await page.goto('/');
  const accountLink = page.getByRole('link', { name: /account|jennifer/i }).first();
  if (await accountLink.isVisible()) {
    await page.goto('/account');
    const logoutBtn = page.getByRole('button', { name: /sign out|log out/i });
    if (await logoutBtn.isVisible()) await logoutBtn.click();
  }
}

/**
 * Clear all items from the cart by clicking each "Remove item" button.
 * Scopes to <main> to avoid the MiniCart's off-screen remove buttons.
 * Waits for each item to disappear from the DOM before moving on.
 *
 * NOTE: Non-Active carts (Ordered, Merged) are automatically hidden by the
 * server — GET /api/cart returns null for them — so clearCart will see an
 * empty cart and exit immediately when a previous run's cart has been ordered.
 */
export async function clearCart(page: Page) {
  await page.goto('/cart');
  // Wait for the page to finish loading the cart data
  await page.waitForLoadState('networkidle');

  for (let i = 0; i < 20; i++) {
    // Scope to <main> to avoid matching the MiniCart's remove buttons
    const removeBtn = page.locator('main').getByRole('button', { name: 'Remove item' }).first();
    const visible = await removeBtn.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!visible) break;

    // Count buttons before clicking so we know when the DOM reflects the removal
    const btnCountBefore = await page
      .locator('main')
      .getByRole('button', { name: 'Remove item' })
      .count();

    await removeBtn.click();

    // Wait for one remove button to disappear — the item was removed from the DOM
    await page.waitForFunction(
      (expected: number) =>
        document.querySelectorAll('main [aria-label="Remove item"]').length < expected,
      btnCountBefore,
      { timeout: 60_000 },
    );
  }
}

/**
 * Navigate directly to a known product page (by slug index) and add it to cart.
 *
 * Navigates by hardcoded slug rather than clicking from the category page so
 * the result is deterministic regardless of sort order or personalisation.
 *
 * Waits for the POST /api/cart/items response to confirm the item was saved
 * and the session cookie (cartId) was issued — 60 s allows for Netlify cold starts.
 */
export async function addProductToCart(page: Page, index = 0): Promise<string> {
  const slug = FURNITURE_SLUGS[index];
  await page.goto(`/products/${slug}`);
  await page.waitForURL(/\/products\//);

  const productName = await page.locator('h1').first().innerText();

  // If the product has a Subscribe & Save widget, make sure "One-time" is selected
  const oneTime = page.getByRole('radio', { name: /one-time/i });
  if (await oneTime.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await oneTime.click();
  }

  // Click "Add to Cart" and wait for the network round-trip to complete.
  // Promise.all ensures waitForResponse is registered *before* the click fires.
  const [response] = await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes('/api/cart/items') && resp.request().method() === 'POST',
      { timeout: 60_000 },
    ),
    page.getByRole('button', { name: /add to cart/i }).click(),
  ]);

  if (!response.ok()) {
    const bodyText = await response.text().catch(() => '(no body)');
    console.log(`  ⚠ POST /api/cart/items ${response.status()} — ${bodyText.slice(0, 200)}`);
  }

  return productName;
}

/**
 * Fill in the checkout shipping form.
 * Uses .first() on every locator to target the primary shipping-address section
 * rather than the optional billing-address section that has identical field labels.
 *
 * NOTE: Country defaults to "United States" from the user's locale cookie so we
 * skip that field — the header's CountrySelector button would otherwise be matched
 * by getByLabel(/country/i) and it is not a <select> element.
 */
export async function fillShipping(page: Page, addr = SHIPPING) {
  await page.getByLabel(/first name/i).first().fill(addr.firstName);
  await page.getByLabel(/last name/i).first().fill(addr.lastName);
  await page.getByLabel(/street address/i).first().fill(addr.streetAddress);
  await page.getByLabel(/city/i).first().fill(addr.city);
  await page.getByLabel(/state.*region|state|province/i).first().fill(addr.state);
  await page.getByLabel(/zip|postal/i).first().fill(addr.zip);
  // Country already defaults to "United States" — no action needed.
}

/** Fill in the payment form */
export async function fillPayment(page: Page, card = CARD) {
  await page.getByLabel(/cardholder|name on card/i).fill(card.holderName);
  await page.getByLabel(/card number/i).fill(card.number);
  await page.getByLabel(/expir/i).fill(card.expiry);
  await page.getByLabel(/cvv|cvc|security/i).fill(card.cvv);
}
