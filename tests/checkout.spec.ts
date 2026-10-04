import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';

test.describe('DemoBlaze End-to-End Workflow', () => {
  test('Add product to cart and complete checkout', async ({ page }) => {
    const homePage = new HomePage(page);
    const cartPage = new CartPage(page);

    await homePage.goto();

    // Select product
    await page.click('text=Samsung galaxy s6');

    // Handle browser dialog/alert on "Add to cart"
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Product added');
      await dialog.accept();
    });

    await page.click('text=Add to cart');

    // Navigate to Cart
    await page.click('#cartur');

    // Complete Order
    await cartPage.placeOrder({
      name: 'John Doe',
      country: 'USA',
      city: 'New York',
      card: '1234567890123456',
      month: '12',
      year: '2026',
    });

    await cartPage.verifyPurchaseSuccess();
  });
});