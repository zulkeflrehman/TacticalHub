import { expect, test, type Locator, type Page } from '@playwright/test';

type Rgb = [number, number, number];

function parseColor(value: string): Rgb {
  const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
  if (value.startsWith('color(srgb') && channels.length >= 3) {
    return [channels[0] * 255, channels[1] * 255, channels[2] * 255];
  }
  if (channels.length < 3) throw new Error(`Unsupported computed color: ${value}`);
  return [channels[0], channels[1], channels[2]];
}

function luminance([red, green, blue]: Rgb): number {
  const linear = [red, green, blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function contrastRatio(foreground: Rgb, background: Rgb): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

async function computedContrast(locator: Locator, pseudoElement?: '::placeholder'): Promise<number> {
  const colors = await locator.evaluate((element, pseudo) => {
    const foreground = getComputedStyle(element, pseudo || null).color;
    let current: Element | null = element;
    let background = 'rgb(255, 255, 255)';

    while (current) {
      const candidate = getComputedStyle(current).backgroundColor;
      const alpha = Number(candidate.match(/[\d.]+/g)?.[3] ?? 1);
      if (candidate !== 'transparent' && alpha >= 0.95) {
        background = candidate;
        break;
      }
      current = current.parentElement;
    }

    return { foreground, background };
  }, pseudoElement);

  return contrastRatio(parseColor(colors.foreground), parseColor(colors.background));
}

async function seedCart(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('tecticalhub-cart-storage', JSON.stringify({
      state: {
        cart: [{
          productId: 'contrast-product',
          inventoryId: 'contrast-inventory',
          variantSku: 'CONTRAST-SKU',
          name: 'Contrast Test Backpack',
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
}

test('critical customer flows keep text and primary actions readable', async ({ page }) => {
  await seedCart(page);

  await page.goto('/cart');
  const cartHeading = page.getByRole('heading', { level: 1, name: /shopping cart/i });
  await expect(cartHeading).toBeVisible();
  expect(await computedContrast(cartHeading)).toBeGreaterThanOrEqual(4.5);

  const checkoutLink = page.getByRole('link', { name: /proceed to checkout/i });
  await expect(checkoutLink).toBeVisible();
  expect(await computedContrast(checkoutLink)).toBeGreaterThanOrEqual(4.5);

  await page.goto('/checkout');
  const accountHeading = page.getByRole('heading', { name: /account required/i });
  await expect(accountHeading).toBeVisible();
  expect(await computedContrast(accountHeading)).toBeGreaterThanOrEqual(4.5);

  await page.goto('/account/login');
  const loginButton = page.getByRole('button', { name: 'Log In', exact: true });
  const footerEmail = page.getByPlaceholder('Enter your email address');
  await expect(loginButton).toBeVisible();
  await expect(footerEmail).toBeVisible();
  expect(await computedContrast(loginButton)).toBeGreaterThanOrEqual(4.5);
  expect(await computedContrast(footerEmail, '::placeholder')).toBeGreaterThanOrEqual(4.5);
});

test('mobile authentication controls are legible and touch friendly', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/account/register');

  const nameInput = page.getByLabel(/full name/i);
  const emailInput = page.getByLabel(/email address/i);
  await expect(nameInput).toBeVisible();
  await expect(emailInput).toBeVisible();

  for (const input of [nameInput, emailInput]) {
    const metrics = await input.evaluate((element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return {
        fontSize: Number.parseFloat(style.fontSize),
        height: box.height,
      };
    });
    expect(metrics.fontSize).toBeGreaterThanOrEqual(16);
    expect(metrics.height).toBeGreaterThanOrEqual(44);
    expect(await computedContrast(input)).toBeGreaterThanOrEqual(4.5);
  }
});
