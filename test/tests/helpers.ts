import { Page } from '@playwright/test';

export const REGISTERED_USER = {
  email: 'jen@example.com',
  password: '123',
};

// CT address format — street name and number are separate fields in the checkout form
export const SHIPPING = {
  firstName: 'Jennifer',
  lastName: 'Robinson',
  streetName: 'Test Street',  // fills the "Street Name" input
  streetNumber: '123',         // fills the "Street Number" input
  city: 'New York',
  state: 'NY',
  zip: '10001',
  country: 'US',
};

export const CARD = {
  holderName: 'Jennifer Robinson',
  number: '4111111111111111',
  expiry: '12/28',
  cvv: '123',
};

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
 * Waits for the DOM to reflect each removal before moving on.
 */
export async function clearCart(page: Page) {
  await page.goto('/cart');
  for (let i = 0; i < 20; i++) {
    // Scope to <main> so we don't accidentally target the MiniCart's remove buttons
    const removeBtn = page.locator('main').getByRole('button', { name: 'Remove item' }).first();
    const visible = await removeBtn.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!visible) break;

    // Count remove buttons before clicking so we can detect when the DOM updates
    const btnCountBefore = await page
      .locator('main')
      .getByRole('button', { name: 'Remove item' })
      .count();

    await removeBtn.click();

    // Wait for one "Remove item" button to disappear from main (item removed from DOM)
    await page.waitForFunction(
      (expected: number) =>
        document.querySelectorAll('main [aria-label="Remove item"]').length < expected,
      btnCountBefore,
      { timeout: 60_000 },
    );
  }
}

/**
 * Read the current cart item count from the header badge.
 * Returns 0 if the badge element is absent or contains no digit.
 */
async function getCartCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const badge = document.querySelector('[aria-label*="Cart"]');
    if (!badge) return 0;
    const label = badge.getAttribute('aria-label') || '';
    const m = label.match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  });
}

/**
 * Add a product to cart from the furniture category page.
 * `index` selects which product card to open (0 = first, 1 = second, …).
 *
 * Scopes the product-card selector to <main> to avoid matching MiniCart links
 * (always present in the header DOM but translated off-screen).
 *
 * Waits for the cart badge count to *increase* — this proves:
 *   1. The POST /api/cart/items network round-trip completed.
 *   2. The browser processed the Set-Cookie response header (cartId persisted).
 *   3. The React CartContext re-rendered with the new cart.
 */
export async function addProductToCart(page: Page, index = 0): Promise<string> {
  await page.goto('/category/furniture');

  // Scope to <main> to exclude MiniCart product links rendered in the header
  const cards = page.locator('main').locator('a[href^="/products/"]');
  await cards.nth(index).click();
  await page.waitForURL(/\/products\//);

  const productName = await page.locator('h1').first().innerText();

  // Select one-time purchase if the Subscribe & Save radio is present
  const oneTime = page.getByRole('radio', { name: /one-time/i });
  if (await oneTime.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await oneTime.click();
  }

  // Capture current count *before* clicking so we can detect the badge increase
  const countBefore = await getCartCount(page);

  await page.getByRole('button', { name: /add to cart/i }).click();

  // Wait for the badge count to exceed the previous value.
  // Using a badge-count check (rather than waitForResponse) is more reliable because
  // it confirms the Set-Cookie header was processed and the session cookie is stored
  // before we navigate to the next page.
  await page.waitForFunction(
    (prev: number) => {
      const badge = document.querySelector('[aria-label*="Cart"]');
      if (!badge) return false;
      const label = badge.getAttribute('aria-label') || '';
      const m = label.match(/\d+/);
      return m ? parseInt(m[0], 10) > prev : false;
    },
    countBefore,
    { timeout: 30_000 },
  );

  return productName;
}

/** Fill in the checkout shipping form */
export async function fillShipping(page: Page, addr = SHIPPING) {
  // Use .first() on each to pick the shipping-address section if billing also has the same fields
  await page.getByLabel(/first name/i).first().fill(addr.firstName);
  await page.getByLabel(/last name/i).first().fill(addr.lastName);
  // CT splits the street into "Street Name" and "Street Number" (separate fields)
  await page.getByLabel(/street name/i).first().fill(addr.streetName);
  await page.getByLabel(/street number/i).first().fill(addr.streetNumber);
  await page.getByLabel(/city/i).first().fill(addr.city);
  await page.getByLabel(/state.*region|state|province/i).first().fill(addr.state);
  await page.getByLabel(/zip|postal/i).first().fill(addr.zip);

  const countrySelect = page.getByLabel(/country/i).first();
  if (await countrySelect.isVisible()) {
    await countrySelect.selectOption('US');
  }
}

/** Fill in the payment form */
export async function fillPayment(page: Page, card = CARD) {
  await page.getByLabel(/cardholder|name on card/i).fill(card.holderName);
  await page.getByLabel(/card number/i).fill(card.number);
  await page.getByLabel(/expir/i).fill(card.expiry);
  await page.getByLabel(/cvv|cvc|security/i).fill(card.cvv);
}
