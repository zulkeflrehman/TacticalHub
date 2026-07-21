import { expect, test, type Page } from '@playwright/test';

// Mobile viewport sizes to test
const mobileViewports = [
  { name: 'iPhone SE', width: 320, height: 800 },
  { name: 'Galaxy S8', width: 360, height: 800 },
  { name: 'iPhone 12 Pro', width: 390, height: 844 },
  { name: 'Pixel 5', width: 412, height: 915 },
];

// Helper to setup cart with items
async function setupCartWithItems(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('tecticalhub-cart-storage', JSON.stringify({
      state: {
        cart: [
          {
            productId: 'test-product-1',
            inventoryId: 'test-inventory-1',
            variantSku: 'TEST-SKU-1',
            name: 'Tactical Backpack 30L',
            price: 5500,
            image: '/file.svg',
            quantity: 2,
            vendor: 'TacticalHub',
          },
          {
            productId: 'test-product-2',
            inventoryId: 'test-inventory-2',
            variantSku: 'TEST-SKU-2',
            name: 'Combat Boots Size 10',
            price: 8900,
            image: '/file.svg',
            quantity: 1,
            vendor: 'MilitaryGear',
          },
        ],
        wishlist: ['test-slug-1'],
        isOpen: false,
      },
      version: 0,
    }));
  });
}

test.describe('Mobile CartDrawer Navigation Overlap Fix', () => {
  for (const viewport of mobileViewports) {
    test(`${viewport.name} (${viewport.width}×${viewport.height}) - Bottom navigation visibility`, async ({ page }) => {
      await setupCartWithItems(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      // 1. Mobile bottom navigation should be visible initially
      const bottomNav = page.locator('.lg\\:hidden.fixed.bottom-0').first();
      await expect(bottomNav).toBeVisible({ timeout: 5000 });
      
      // Verify all 4 navigation items are present in the bottom nav
      await expect(bottomNav.getByRole('link', { name: /home/i })).toBeVisible();
      await expect(bottomNav.locator('text=Wishlist')).toBeVisible();
      await expect(bottomNav.locator('text=Cart')).toBeVisible();
      await expect(bottomNav.getByRole('link', { name: /account/i })).toBeVisible();
      
      // 2. Click cart button to open CartDrawer (use data-testid to avoid ambiguity)
      const cartButton = page.getByTestId('cart-button');
      await cartButton.click();
      
      // Wait for drawer to open
      await expect(page.getByRole('dialog', { name: /shopping cart/i })).toBeVisible({ timeout: 2000 });
      
      // 3. Mobile bottom navigation should be hidden when drawer is open
      await expect(bottomNav).not.toBeVisible();
      
      // 4. CartDrawer actions should be visible
      await expect(page.getByRole('link', { name: /view cart/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /checkout/i })).toBeVisible();
      
      // 5. Verify actions are in viewport (not hidden by bottom nav)
      const viewCartButton = page.getByRole('link', { name: /view cart/i });
      const checkoutButton = page.getByRole('link', { name: /checkout/i });
      
      const viewCartBox = await viewCartButton.boundingBox();
      const checkoutBox = await checkoutButton.boundingBox();
      
      expect(viewCartBox).toBeTruthy();
      expect(checkoutBox).toBeTruthy();
      
      if (viewCartBox && checkoutBox) {
        // Both buttons should be fully within viewport height
        expect(viewCartBox.y + viewCartBox.height).toBeLessThanOrEqual(viewport.height);
        expect(checkoutBox.y + checkoutBox.height).toBeLessThanOrEqual(viewport.height);
      }
      
      // 6. Close drawer using close button
      const closeButton = page.getByRole('button', { name: /close cart/i });
      await closeButton.click();
      
      // Wait for drawer to close
      await expect(page.getByRole('dialog', { name: /shopping cart/i })).not.toBeVisible({ timeout: 2000 });
      
      // 7. Bottom navigation should be visible again
      await expect(bottomNav).toBeVisible();
    });

    test(`${viewport.name} - Backdrop close restores navigation`, async ({ page }) => {
      await setupCartWithItems(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      const bottomNav = page.locator('.lg\\:hidden.fixed.bottom-0').first();
      await expect(bottomNav).toBeVisible();
      
      // Open drawer using header cart button
      const cartButton = page.getByTestId('cart-button');
      await cartButton.click();
      await expect(page.getByRole('dialog', { name: /shopping cart/i })).toBeVisible();
      await expect(bottomNav).not.toBeVisible();
      
      // Click backdrop to close — use force because the drawer panel sits on top at narrow widths
      await page.locator('.bg-brand-black\\/60').click({ position: { x: 10, y: 10 }, force: true });
      
      // Navigation should restore
      await expect(page.getByRole('dialog', { name: /shopping cart/i })).not.toBeVisible({ timeout: 2000 });
      await expect(bottomNav).toBeVisible();
    });

    test(`${viewport.name} - View Cart navigation closes drawer and restores nav`, async ({ page }) => {
      await setupCartWithItems(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      const bottomNav = page.locator('.lg\\:hidden.fixed.bottom-0').first();
      
      // Open drawer using header cart button
      const cartButton = page.getByTestId('cart-button');
      await cartButton.click();
      await expect(page.getByRole('dialog', { name: /shopping cart/i })).toBeVisible();
      await expect(bottomNav).not.toBeVisible();
      
      // Click View Cart
      const viewCartLink = page.getByRole('link', { name: /view cart/i });
      await expect(viewCartLink).toBeVisible();
      await viewCartLink.click();
      
      // Next.js may add a trailing slash — accept both /cart and /cart/
      await expect(page).toHaveURL(/\/cart\/?$/, { timeout: 5000 });
      
      // Bottom navigation should be visible on cart page
      await expect(page.locator('.lg\\:hidden.fixed.bottom-0').first()).toBeVisible();
    });

    test(`${viewport.name} - Checkout navigation closes drawer and restores nav`, async ({ page }) => {
      await setupCartWithItems(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      const bottomNav = page.locator('.lg\\:hidden.fixed.bottom-0').first();
      
      // Open drawer using header cart button
      const cartButton = page.getByTestId('cart-button');
      await cartButton.click();
      await expect(page.getByRole('dialog', { name: /shopping cart/i })).toBeVisible();
      await expect(bottomNav).not.toBeVisible();
      
      // Click Proceed to Checkout
      const checkoutLink = page.getByRole('link', { name: /checkout/i });
      await expect(checkoutLink).toBeVisible();
      await checkoutLink.click();
      
      // Next.js may add a trailing slash — accept both /checkout and /checkout/
      await expect(page).toHaveURL(/\/checkout\/?$/, { timeout: 5000 });
      
      // Bottom navigation should be visible on checkout page
      await expect(page.locator('.lg\\:hidden.fixed.bottom-0').first()).toBeVisible();
    });
  }

  test('Escape key closes drawer and restores navigation', async ({ page }) => {
    await setupCartWithItems(page);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    
    const bottomNav = page.locator('.lg\\:hidden.fixed.bottom-0').first();
    await expect(bottomNav).toBeVisible();
    
    // Open drawer using header cart button
    const cartButton = page.getByTestId('cart-button');
    await cartButton.click();
    await expect(page.getByRole('dialog', { name: /shopping cart/i })).toBeVisible();
    await expect(bottomNav).not.toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Drawer should close and navigation should restore
    await expect(page.getByRole('dialog', { name: /shopping cart/i })).not.toBeVisible({ timeout: 2000 });
    await expect(bottomNav).toBeVisible();
  });

  test('Continue Shopping button closes empty cart drawer', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    
    const bottomNav = page.locator('.lg\\:hidden.fixed.bottom-0').first();
    await expect(bottomNav).toBeVisible();
    
    // Open empty cart drawer using header cart button
    const cartButton = page.getByTestId('cart-button');
    await cartButton.click();
    
    await expect(page.getByRole('dialog', { name: /shopping cart/i })).toBeVisible();
    await expect(bottomNav).not.toBeVisible();
    
    // Empty cart should show Continue Shopping button
    const continueButton = page.getByRole('button', { name: /continue shopping/i });
    await expect(continueButton).toBeVisible();
    await continueButton.click();
    
    // Drawer should close and navigation should restore
    await expect(page.getByRole('dialog', { name: /shopping cart/i })).not.toBeVisible({ timeout: 2000 });
    await expect(bottomNav).toBeVisible();
  });

  test('Desktop view - bottom navigation not rendered on large screens', async ({ page }) => {
    await setupCartWithItems(page);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    
    // Mobile bottom navigation should not be visible on desktop (lg:hidden)
    const bottomNav = page.locator('.lg\\:hidden.fixed.bottom-0').first();
    await expect(bottomNav).not.toBeVisible();
    
    // Open cart drawer
    const cartButton = page.getByTestId('cart-button');
    await cartButton.click();
    await expect(page.getByRole('dialog', { name: /shopping cart/i })).toBeVisible();
    
    // Bottom nav still not visible (doesn't exist on desktop)
    await expect(bottomNav).not.toBeVisible();
  });
});
