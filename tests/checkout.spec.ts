import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { CREDENTIALS } from '../config/env';

const PRODUCT = 'Samsung galaxy s6';

const ORDER_DETAILS = {
  name: 'John Doe',
  country: 'USA',
  city: 'New York',
  card: '1234567890123456',
  month: '12',
  year: '2026',
};

test.describe('DemoBlaze End-to-End Workflow', () => {
  test('TC_E2E_001: Logged-in user adds a product to the cart and completes checkout', async ({
    page,
  }) => {
    const homePage = new HomePage(page);
    const loginPage = new LoginPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await test.step('Sign in', async () => {
      await homePage.goto();
      await loginPage.login(CREDENTIALS.username, CREDENTIALS.password);
    });

    await test.step('Add the product to the cart', async () => {
      await homePage.openProduct(PRODUCT);
      await productPage.verifyLoaded(PRODUCT);

      const alertMessage = await productPage.addToCart();
      expect(alertMessage).toContain('Product added');
    });

    await test.step('Verify the cart contents', async () => {
      await homePage.openCart();
      await cartPage.verifyItemInCart(PRODUCT);
    });

    await test.step('Place the order', async () => {
      await cartPage.placeOrder(ORDER_DETAILS);

      const confirmation = await cartPage.verifyPurchaseSuccess();
      expect(confirmation).toContain(ORDER_DETAILS.card);

      await cartPage.confirmPurchase();
    });

    await test.step('Cart is emptied after a successful purchase', async () => {
      await cartPage.goto();
      await expect(cartPage.rowFor(PRODUCT)).toHaveCount(0);
    });
  });
});
