import { Page, expect } from '@playwright/test';

export const REGISTERED_USER = {
  email: 'jen@example.com',
  password: '123',
};

export const SHIPPING = {
  firstName: 'Jennifer',
  lastName: 'Robinson',
  street: '123 Test Street',
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

/** Add a product to cart from the catalog. Returns the product name. */
export async function addProductToCart(page: Page, index = 0): Promise<string> {
  await page.goto('/category/furniture');
  const cards = page.locator('[data-testid="product-card"], a[href^="/products/"]');
  await cards.nth(index).click();
  await page.waitForURL(/\/products\//);

  const productName = await page.locator('h1').first().innerText();

  // Select one-time purchase if radio exists
  const oneTime = page.getByRole('radio', { name: /one-time/i });
  if (await oneTime.isVisible()) await oneTime.click();

  await page.getByRole('button', { name: /add to cart/i }).click();
  // Wait for cart count to update
  await page.waitForFunction(() => {
    const badge = document.querySelector('[aria-label*="Cart"]');
    return badge && !/0 items/.test(badge.textContent || '');
  }, { timeout: 10_000 });

  return productName;
}

/** Fill in the checkout shipping form */
export async function fillShipping(page: Page, addr = SHIPPING) {
  await page.getByLabel(/first name/i).fill(addr.firstName);
  await page.getByLabel(/last name/i).fill(addr.lastName);
  await page.getByLabel(/street|address line 1/i).first().fill(addr.street);
  await page.getByLabel(/city/i).fill(addr.city);
  await page.getByLabel(/state|province/i).fill(addr.state);
  await page.getByLabel(/zip|postal/i).fill(addr.zip);

  const countrySelect = page.getByLabel(/country/i);
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
