import { Page } from '@playwright/test';

export const REGISTERED_USER = {
  email: 'jen@example.com',
  password: '123',
};

// CT address format — checkout uses separate streetName / streetNumber fields
export const SHIPPING = {
  firstName: 'Jennifer',
  lastName: 'Robinson',
  streetName: 'Test Street',
  streetNumber: '123',
  city: 'New York',
  state: 'NY',
  zip: '10001',
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
 * A brief pause after the response lets the browser process Set-Cookie before the
 * next page.goto().
 */
export async function addProductToCart(page: Page, index = 0): Promise<string> {
  const slug = FURNITURE_SLUGS[index];
  await page.goto(`/products/${slug}`);
  await page.waitForURL(/\/products\//);

  const productName = await page.locator('h1').first().innerText();

  // Pre-flight: ask the server what cart it currently sees for this browser session.
  // page.evaluate uses the browser's real cookie jar (including httpOnly cookies).
  const preFlightCart = await page.evaluate(async () => {
    const res = await fetch('/api/cart');
    const data = await res.json() as { cart: { id: string; cartState: string; lineItems: { length?: number } | null } | null };
    return { id: data.cart?.id, state: data.cart?.cartState, items: data.cart?.lineItems?.length };
  }).catch((e: Error) => ({ error: String(e) }));
  console.log(`  → Pre-flight GET /api/cart: ${JSON.stringify(preFlightCart)}`);

  // If the product has a Subscribe & Save widget, make sure "One-time" is selected
  const oneTime = page.getByRole('radio', { name: /one-time/i });
  if (await oneTime.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await oneTime.click();
  }

  // Intercept the outgoing POST request to inspect what cookies are sent.
  const requestSpy = (request: import('@playwright/test').Request) => {
    if (request.url().includes('/api/cart/items') && request.method() === 'POST') {
      const cookie = request.headers()['cookie'] || '(none)';
      const hasSession = cookie.includes('vibe-session');
      console.log(`  → POST request cookie: ${hasSession ? 'vibe-session=<present>' : 'NO vibe-session'} | full: ${cookie.slice(0, 120)}`);
    }
  };
  page.on('request', requestSpy);

  // Click "Add to Cart" and wait for the network round-trip to complete.
  // Promise.all ensures waitForResponse is registered *before* the click fires.
  const [response] = await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes('/api/cart/items') && resp.request().method() === 'POST',
      { timeout: 60_000 },
    ),
    page.getByRole('button', { name: /add to cart/i }).click(),
  ]);

  page.off('request', requestSpy);

  // Log the response status, cart ID, and server-side debug info.
  const status = response.status();
  if (status === 200) {
    try {
      const body = await response.json();
      const cartId = body.cart?.id;
      const itemCount = body.cart?.lineItems?.length ?? '?';
      const dbg = body.debug ?? {};
      console.log(
        `  → POST /api/cart/items ${status} | cartId=${cartId} | lineItems=${itemCount}` +
        ` | srv_received=${dbg.receivedCartId} | srv_fetchResult=${dbg.cartFetchResult}` +
        ` | srv_used=${dbg.usedCartId}` +
        (dbg.cartCreatedReason ? ` | created_reason=${dbg.cartCreatedReason}` : '')
      );
    } catch {
      console.log(`  → POST /api/cart/items ${status} (could not parse body)`);
    }
  } else {
    const bodyText = await response.text().catch(() => '(no body)');
    console.log(`  → POST /api/cart/items ${status} — ${bodyText.slice(0, 200)}`);
  }

  // Give the browser extra time to fully process the Set-Cookie response header
  // and store it in the cookie jar before the next page.goto() fires.
  await page.waitForTimeout(2_000);

  // Diagnostic: check whether the vibe-session cookie was actually stored.
  const allCookies = await page.context().cookies();
  const sessionCookie = allCookies.find(c => c.name === 'vibe-session');
  if (sessionCookie) {
    console.log(`  → vibe-session cookie present (httpOnly=${sessionCookie.httpOnly}, secure=${sessionCookie.secure}, sameSite=${sessionCookie.sameSite})`);
  } else {
    console.log('  → WARNING: vibe-session cookie NOT FOUND in browser context!');
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
  await page.getByLabel(/street name/i).first().fill(addr.streetName);
  await page.getByLabel(/street number/i).first().fill(addr.streetNumber);
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
