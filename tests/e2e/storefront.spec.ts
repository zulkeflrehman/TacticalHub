import { expect, test } from '@playwright/test';

test('static storefront and customer navigation load without a server runtime', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/TECTICALHUB/i);
  await page.goto('/cart');
  await expect(page.getByRole('heading', { level: 1, name: /shopping cart/i })).toBeVisible();
  await page.goto('/account/login');
  await expect(page.getByRole('heading', { name: /access your account/i })).toBeVisible();
});

test('unknown content renders the not-found experience', async ({ page }) => {
  await page.goto('/pages?slug=this-page-does-not-exist');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible({ timeout: 20_000 });
});

test('live catalog data can be opened and added to the local cart', async ({ page }) => {
  test.skip(process.env.PLAYWRIGHT_REQUIRE_CATALOG !== 'true', 'Runs only during post-deployment verification.');
  await page.goto('/');
  const firstProduct = page.locator('a[href^="/products/?slug="]').first();
  await expect(firstProduct).toBeVisible({ timeout: 20_000 });
  await firstProduct.click();
  await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: /add to cart/i }).click();
  await page.goto('/cart');
  await expect(page.getByRole('heading', { level: 1, name: /shopping cart \(1\)/i })).toBeVisible();
});
