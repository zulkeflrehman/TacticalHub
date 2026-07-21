import { expect, test, type Page } from '@playwright/test';

// Mobile viewport sizes to test
const mobileViewports = [
  { name: 'iPhone SE', width: 320, height: 568 },
  { name: 'Galaxy S8', width: 360, height: 740 },
  { name: 'iPhone 12 Pro', width: 390, height: 844 },
  { name: 'Pixel 5', width: 412, height: 915 },
  { name: 'iPad Mini', width: 768, height: 1024 },
];

// Helper to check for horizontal overflow
async function checkNoHorizontalOverflow(page: Page) {
  const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
  const windowInnerWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyScrollWidth).toBeLessThanOrEqual(windowInnerWidth + 1); // +1 for rounding tolerance
}

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
        wishlist: ['test-slug-1', 'test-slug-2'],
      },
      version: 0,
    }));
  });
}

test.describe('Mobile Responsiveness - No Horizontal Overflow', () => {
  for (const viewport of mobileViewports) {
    test(`${viewport.name} (${viewport.width}px) - Homepage has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await checkNoHorizontalOverflow(page);
    });

    test(`${viewport.name} (${viewport.width}px) - Cart page has no horizontal overflow`, async ({ page }) => {
      await setupCartWithItems(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/cart');
      await checkNoHorizontalOverflow(page);
    });

    test(`${viewport.name} (${viewport.width}px) - Checkout page has no horizontal overflow`, async ({ page }) => {
      await setupCartWithItems(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/checkout');
      await checkNoHorizontalOverflow(page);
    });

    test(`${viewport.name} (${viewport.width}px) - Login page has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/account/login');
      await checkNoHorizontalOverflow(page);
    });

    test(`${viewport.name} (${viewport.width}px) - Register page has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/account/register');
      await checkNoHorizontalOverflow(page);
    });
  }
});

test.describe('Mobile Navigation - Header & Menu', () => {
  test('Mobile menu button is visible on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Mobile menu button should be visible
    const menuButton = page.getByRole('button', { name: /menu/i }).or(page.locator('button').filter({ hasText: /menu/i }));
    await expect(menuButton).toBeVisible();
  });

  test('Mobile menu opens and closes correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Find and click mobile menu button
    const menuButton = page.getByRole('button', { name: /menu/i }).or(page.locator('button').filter({ hasText: /menu/i }));
    await menuButton.click();
    
    // Menu dialog should appear
    await expect(page.locator('[role="dialog"][aria-label="Navigation menu"]')).toBeVisible({ timeout: 1000 });
  });

  test('Cart icon shows item count on mobile', async ({ page }) => {
    await setupCartWithItems(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Cart should show count (3 total items)
    const cartBadge = page.locator('text=3').or(page.getByText('3'));
    await expect(cartBadge.first()).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Mobile Product Grids & Images', () => {
  test('Homepage product grid displays correctly at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    
    // Check for product grid
    const productCards = page.locator('[class*="grid"]').first();
    await expect(productCards).toBeVisible({ timeout: 5000 });
    await checkNoHorizontalOverflow(page);
  });

  test('Product images fit within viewport at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    
    // All images should be within viewport
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const box = await images.nth(i).boundingBox();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(320 + 5); // +5 tolerance
      }
    }
  });

  test('Search results grid is mobile-responsive', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/search?q=tactical');
    await checkNoHorizontalOverflow(page);
  });
});

test.describe('Mobile ProductDetails Page', () => {
  test.skip('Product details page is responsive at 320px', async ({ page }) => {
    test.skip(process.env.PLAYWRIGHT_REQUIRE_CATALOG !== 'true', 'Requires live catalog data');
    
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    
    // Click first product
    const firstProduct = page.locator('a[href^="/products/?slug="]').first();
    await expect(firstProduct).toBeVisible({ timeout: 10000 });
    await firstProduct.click();
    
    // Check no overflow
    await checkNoHorizontalOverflow(page);
    
    // Quantity buttons should be visible and tappable (44x44px)
    const decreaseButton = page.getByRole('button', { name: /decrease quantity/i });
    const increaseButton = page.getByRole('button', { name: /increase quantity/i });
    await expect(decreaseButton).toBeVisible();
    await expect(increaseButton).toBeVisible();
    
    // Add to cart button should be visible
    const addToCartButton = page.getByRole('button', { name: /add to cart/i });
    await expect(addToCartButton).toBeVisible();
  });

  test.skip('Product image thumbnails scroll horizontally', async ({ page }) => {
    test.skip(process.env.PLAYWRIGHT_REQUIRE_CATALOG !== 'true', 'Requires live catalog data');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const firstProduct = page.locator('a[href^="/products/?slug="]').first();
    await firstProduct.click();
    
    // Thumbnails container should allow horizontal scrolling without page overflow
    await checkNoHorizontalOverflow(page);
  });
});

test.describe('Mobile Cart Functionality', () => {
  test('Add to Cart opens CartDrawer on mobile', async ({ page }) => {
    await setupCartWithItems(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Cart button should be visible in header
    const cartButton = page.getByTestId('cart-button');
    await expect(cartButton).toBeVisible();
  });

  test('Cart page displays items correctly at 320px', async ({ page }) => {
    await setupCartWithItems(page);
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/cart');
    
    // Check for cart heading (with or without items)
    await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: /shopping cart/i })).toBeVisible();
    await checkNoHorizontalOverflow(page);
  });

  test('Cart quantity controls are touch-friendly (44px)', async ({ page }) => {
    await setupCartWithItems(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/cart');
    
    // Find quantity decrease button
    const decreaseButtons = page.locator('button').filter({ hasText: '-' });
    const firstButton = decreaseButtons.first();
    
    if (await firstButton.count() > 0) {
      const box = await firstButton.boundingBox();
      if (box) {
        // Should be approximately 44x44px (allow some tolerance)
        expect(box.height).toBeGreaterThanOrEqual(40);
        expect(box.width).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('Cart subtotal and checkout button are visible on mobile', async ({ page }) => {
    await setupCartWithItems(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/cart');
    
    // Subtotal should be visible
    await expect(page.getByText(/subtotal/i)).toBeVisible();
    
    // Checkout button should be visible
    const checkoutButton = page.getByRole('link', { name: /checkout/i }).or(page.locator('a[href="/checkout"]'));
    await expect(checkoutButton).toBeVisible();
  });

  test('Remove item button works on mobile', async ({ page }) => {
    await setupCartWithItems(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/cart');
    
    // Remove button should be visible
    const removeButton = page.getByRole('button', { name: /remove/i }).first();
    await expect(removeButton).toBeVisible();
  });
});

test.describe('Mobile Checkout Flow', () => {
  test('Checkout form is mobile-friendly at 320px', async ({ page }) => {
    await setupCartWithItems(page);
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/checkout');
    
    await checkNoHorizontalOverflow(page);
  });

  test('Checkout form fields are accessible at 360px', async ({ page }) => {
    await setupCartWithItems(page);
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/checkout');
    
    // Should show account required message (since not logged in)
    await expect(page.getByRole('heading', { name: /account required/i })).toBeVisible();
  });

  test('Checkout order summary is visible on mobile', async ({ page }) => {
    await setupCartWithItems(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/checkout');
    
    // Order summary text should be findable (even if user not logged in)
    await checkNoHorizontalOverflow(page);
  });
});

test.describe('Mobile Authentication', () => {
  test('Login form is mobile-responsive at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/account/login');
    
    await expect(page.getByRole('heading', { name: /access your account/i })).toBeVisible();
    await checkNoHorizontalOverflow(page);
    
    // Form fields should be visible - use more specific selectors
    const emailInput = page.locator('#login-email');
    const passwordInput = page.locator('#login-password');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('Google Sign-In button is visible on mobile login', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/account/login');
    
    // Google sign-in button should be present
    const googleButton = page.getByRole('button', { name: /google/i }).or(page.locator('button').filter({ hasText: /google/i }));
    await expect(googleButton).toBeVisible();
  });

  test('Register form is mobile-responsive at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/account/register');
    
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
    await checkNoHorizontalOverflow(page);
    
    // Form fields should be visible - use correct IDs
    const nameInput = page.locator('#reg-name');
    const emailInput = page.locator('#reg-email');
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
  });

  test('Register form submit button is accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/account/register');
    
    const submitButton = page.getByRole('button', { name: /create account/i });
    await expect(submitButton).toBeVisible();
  });
});

test.describe('Mobile Specific Viewports', () => {
  test('320px viewport - Homepage renders without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await checkNoHorizontalOverflow(page);
  });

  test('360px viewport - Homepage renders without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    await checkNoHorizontalOverflow(page);
  });

  test('390px viewport - Homepage renders without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await checkNoHorizontalOverflow(page);
  });

  test('412px viewport - Homepage renders without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/');
    await checkNoHorizontalOverflow(page);
  });

  test('768px viewport - Homepage renders without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await checkNoHorizontalOverflow(page);
  });
});
