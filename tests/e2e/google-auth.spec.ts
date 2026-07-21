import { expect, test } from '@playwright/test';

/**
 * E2E tests for Google Sign-In UI on TacticalHub.
 *
 * These tests validate the presence and labelling of Google sign-in controls
 * across the login, register, and checkout pages.  They do NOT perform a live
 * Google OAuth flow (which requires a real browser session and test Google
 * credentials) but verify the full structural integration: button presence,
 * correct copy, divider text, and account-linking warning placement.
 */

test('login page renders Google sign-in button with correct label', async ({ page }) => {
  await page.goto('/account/login');
  await expect(page.getByRole('heading', { name: /access your account/i })).toBeVisible();

  const googleButton = page.getByRole('button', { name: /continue with google/i });
  await expect(googleButton).toBeVisible();
  await expect(googleButton).toContainText('no verification email required');
  await expect(googleButton).toBeEnabled();
});

test('login page has an "or continue with email" divider between Google and the form', async ({ page }) => {
  await page.goto('/account/login');
  await expect(page.getByText(/or continue with email/i)).toBeVisible();
  // The traditional email/password form should still be present.
  await expect(page.getByLabel(/email address/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
});

test('register page renders Google sign-in button with correct label', async ({ page }) => {
  await page.goto('/account/register');
  await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();

  const googleButton = page.getByRole('button', { name: /continue with google/i });
  await expect(googleButton).toBeVisible();
  await expect(googleButton).toContainText('no verification email required');
});

test('register page has an "or register with email" divider', async ({ page }) => {
  await page.goto('/account/register');
  await expect(page.getByText(/or register with email/i)).toBeVisible();
  // The email/password registration form should still be present.
  await expect(page.getByLabel(/full name/i)).toBeVisible();
  await expect(page.getByLabel(/email address/i)).toBeVisible();
});

test('checkout with cart shows account-required panel that mentions Google sign-in', async ({ page }) => {
  // Seed local storage with a cart item so the checkout page progresses past
  // the empty-cart guard.
  await page.addInitScript(() => {
    window.localStorage.setItem('tecticalhub-cart-storage', JSON.stringify({
      state: {
        cart: [{
          productId: 'e2e-product',
          inventoryId: 'e2e-inventory',
          variantSku: 'E2E-SKU',
          name: 'E2E Test Backpack',
          price: 3000,
          image: '/file.svg',
          quantity: 1,
          vendor: 'TecticalHub',
        }],
        wishlist: [],
      },
      version: 0,
    }));
  });

  await page.goto('/checkout');
  // The "account required" gate should appear because the user is not logged in.
  await expect(page.getByRole('heading', { name: /account required/i })).toBeVisible();
  // Panel should mention Google sign-in as an option.
  await expect(page.getByText(/google/i)).toBeVisible();
  // Register and Log in CTAs must still be present.
  await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
});

test('clicking the Google button on login page initiates the auth flow', async ({ page }) => {
  await page.goto('/account/login');
  const googleButton = page.getByRole('button', { name: /continue with google/i });

  // Intercept the Google sign-in popup by listening for a new popup window.
  // We do not complete the flow in headless tests; we just confirm the button
  // click triggers an auth interaction (button enters loading state).
  const popupPromise = page.context().waitForEvent('page', { timeout: 3000 }).catch(() => null);

  await googleButton.click();

  // After click the button should show the loading spinner text OR a popup
  // should have been attempted.  Either outcome confirms the flow was initiated.
  const loadingIndicator = page.getByRole('button', { name: /connecting to google/i });
  const popupOpened = await popupPromise;

  if (await loadingIndicator.isVisible().catch(() => false)) {
    await expect(loadingIndicator).toBeVisible();
  } else {
    // A popup page opened — that's the expected behaviour in a real browser.
    expect(popupOpened).not.toBeNull();
  }
});
