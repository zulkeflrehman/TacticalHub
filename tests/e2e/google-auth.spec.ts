import { expect, test } from '@playwright/test';

/**
 * E2E tests for Google Sign-In UI on TacticalHub.
 *
 * These tests validate button presence, dividers, and account-linking UI.
 * They do NOT perform a live Google OAuth flow (which requires real credentials)
 * but verify structural integration: button presence, copy, dividers, and gating.
 *
 * Dividers use semantic role="separator" with a stable data-testid for reliable
 * querying after the React Suspense boundary resolves.
 */

test('login page renders Google sign-in button with correct label', async ({ page }) => {
  await page.goto('/account/login');
  await expect(page.getByRole('heading', { name: /access your account/i })).toBeVisible();

  const googleButton = page.getByRole('button', { name: /continue with google/i });
  await expect(googleButton).toBeVisible();
  await expect(googleButton).toContainText('Continue with Google');
  await expect(googleButton).toBeEnabled();
});

test('login page has a divider between Google button and email form', async ({ page }) => {
  await page.goto('/account/login');

  // Wait for Suspense to resolve: the heading is inside LoginContent.
  await expect(page.getByRole('heading', { name: /access your account/i })).toBeVisible();

  // Stable data-testid on the semantic separator div.
  const divider = page.getByTestId('email-divider');
  await expect(divider).toBeVisible();
  await expect(divider).toHaveAttribute('role', 'separator');

  // Confirm the email form fields are present (labels linked via htmlFor).
  await expect(page.getByLabel(/email address/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
});

test('register page renders Google sign-in button with correct label', async ({ page }) => {
  await page.goto('/account/register');
  await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();

  const googleButton = page.getByRole('button', { name: /continue with google/i });
  await expect(googleButton).toBeVisible();
  await expect(googleButton).toContainText('Continue with Google');
});

test('register page has a divider between Google button and email form', async ({ page }) => {
  await page.goto('/account/register');

  // Wait for Suspense to resolve: the heading is inside RegisterContent.
  await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();

  // Stable data-testid on the semantic separator div.
  const divider = page.getByTestId('email-divider');
  await expect(divider).toBeVisible();
  await expect(divider).toHaveAttribute('role', 'separator');

  // Confirm the email/password registration form is present (labels linked via htmlFor).
  await expect(page.getByLabel(/full name/i)).toBeVisible();
  await expect(page.getByLabel(/email address/i)).toBeVisible();
});

test('checkout with cart shows account-required panel with a Google sign-in button', async ({ page }) => {
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
  // The "account required" gate appears because the user is not signed in.
  await expect(page.getByRole('heading', { name: /account required/i })).toBeVisible();

  // The panel must contain a real Google Sign-In button, not just descriptive text.
  const googleButton = page.getByRole('button', { name: /continue with google/i });
  await expect(googleButton).toBeVisible();
  await expect(googleButton).toBeEnabled();

  // Register and Log in CTAs must also be present.
  await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
});

test('clicking the Google button on login page initiates the auth flow', async ({ page }) => {
  await page.goto('/account/login');
  const googleButton = page.getByRole('button', { name: /continue with google/i });

  // Intercept any popup opened by the sign-in flow.
  // We do not complete the OAuth flow in headless tests; we confirm that
  // the button click triggers an auth interaction: loading state or popup.
  const popupPromise = page.context().waitForEvent('page', { timeout: 3000 }).catch(() => null);

  await googleButton.click();

  const loadingIndicator = page.getByRole('button', { name: /connecting to google/i });
  const popupOpened = await popupPromise;

  if (await loadingIndicator.isVisible().catch(() => false)) {
    await expect(loadingIndicator).toBeVisible();
  } else {
    // A popup page opened — expected in a real browser.
    expect(popupOpened).not.toBeNull();
  }
});

test('clicking the Google button on checkout account-required panel initiates the auth flow', async ({ page }) => {
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
  await expect(page.getByRole('heading', { name: /account required/i })).toBeVisible();

  const googleButton = page.getByRole('button', { name: /continue with google/i });
  const popupPromise = page.context().waitForEvent('page', { timeout: 3000 }).catch(() => null);

  await googleButton.click();

  const loadingIndicator = page.getByRole('button', { name: /connecting to google/i });
  const popupOpened = await popupPromise;

  if (await loadingIndicator.isVisible().catch(() => false)) {
    await expect(loadingIndicator).toBeVisible();
  } else {
    expect(popupOpened).not.toBeNull();
  }
});
