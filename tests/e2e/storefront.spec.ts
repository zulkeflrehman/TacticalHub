import { expect, test } from '@playwright/test';

test('static storefront and customer navigation load without a server runtime', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/TECTICALHUB/i);
  await page.goto('/cart');
  await expect(page.getByRole('heading', { level: 1, name: /shopping cart/i })).toBeVisible();
  await page.goto('/account/login');
  await expect(page.getByRole('heading', { name: /access your account/i })).toBeVisible();
});

test('unknown static routes render the not-found experience', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('admin product controls are unavailable to signed-out customers', async ({ page }) => {
  await page.goto('/admin/products');
  await expect(page).toHaveURL(/\/account\/login\/?\?redirect=%2Fadmin%2Fproducts/);

  await page.goto('/');
  await expect(page.getByRole('button', { name: /^edit /i })).toHaveCount(0);
});

test('black primary actions retain white labels on hover and click', async ({ page }) => {
  await page.goto('/account/login');
  const primaryAction = page.getByRole('button', { name: 'Log In', exact: true });
  await expect(primaryAction).toBeVisible();
  await expect(primaryAction).toHaveCSS('color', 'rgb(255, 255, 255)');

  await primaryAction.hover();
  await expect(primaryAction).toHaveCSS('background-color', 'rgb(1, 1, 1)');
  await expect(primaryAction).toHaveCSS('color', 'rgb(255, 255, 255)');

  await primaryAction.click();
  await expect(primaryAction).toHaveCSS('color', 'rgb(255, 255, 255)');
});

test('checkout preserves the local cart while directing customers through account verification', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('tecticalhub-cart-storage', JSON.stringify({
      state: {
        cart: [{
          productId: 'browser-product',
          inventoryId: 'browser-inventory',
          variantSku: 'BROWSER-SKU',
          name: 'Browser Test Backpack',
          price: 2500,
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
  const registerLink = page.getByRole('link', { name: 'Register' });
  await expect(registerLink).toHaveAttribute('href', '/account/register/?redirect=%2Fcheckout');
  await registerLink.click();
  await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();

  await page.goto('/cart');
  await expect(page.getByRole('heading', { level: 1, name: /shopping cart \(1\)/i })).toBeVisible();
});

test('live catalog data can be opened and added to the local cart', async ({ page }) => {
  test.skip(process.env.PLAYWRIGHT_REQUIRE_CATALOG !== 'true', 'Runs only during post-deployment verification.');
  await page.goto('/');
  const firstProduct = page.locator('a[href^="/products/?slug="]').first();
  await expect(firstProduct).toBeVisible({ timeout: 20_000 });
  await firstProduct.click();
  const addToCart = page.getByRole('button', { name: /add to cart/i });
  await expect(addToCart).toBeVisible({ timeout: 20_000 });
  await expect(addToCart).toHaveCSS('color', 'rgb(255, 255, 255)');
  await addToCart.hover();
  await expect(addToCart).toHaveCSS('background-color', 'rgb(1, 1, 1)');
  await expect(addToCart).toHaveCSS('color', 'rgb(255, 255, 255)');
  const productDescription = page.locator('p.whitespace-pre-line');
  await expect(productDescription).toBeVisible();
  await expect(productDescription).not.toHaveText('');
  await expect(productDescription).toHaveCSS('white-space', 'pre-line');
  await addToCart.click();
  await page.goto('/cart');
  await expect(page.getByRole('heading', { level: 1, name: /shopping cart \(1\)/i })).toBeVisible();
});
