import { test, expect } from '../../fixtures/test-fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { CartPage } from '../../pages/CartPage';
import { PRODUCTS } from '../../data/products';
import { VALID_ORDER } from '../../data/orders';

const product = PRODUCTS.galaxyS6;

/**
 * The end-to-end demo the challenge asks for: log in with valid credentials,
 * add a product to the cart, then place an order.
 *
 * It runs as a freshly registered account (see the isolatedUser fixture)
 * because DemoBlaze scopes the server-side cart to the account - sharing one
 * login across parallel browsers would mean sharing one cart.
 */
test.describe('End-to-end purchase', { tag: ['@ui', '@regression'] }, () => {
  test(
    'E2E-001: a signed-in user adds a product and completes checkout',
    { tag: '@smoke' },
    async ({ page, isolatedUser, homePage, productPage, cartPage }) => {
      const loginPage = new LoginPage(page);

      await test.step('Log in with valid credentials', async () => {
        await homePage.goto();
        await loginPage.login(isolatedUser.username, isolatedUser.password);
      });

      await test.step('Add a product to the cart from the catalogue', async () => {
        await homePage.openProduct(product.title);
        await productPage.verifyLoaded(product.title);
        expect(await productPage.price()).toBe(product.price);

        const alert = await productPage.addToCart();
        expect(alert).toMatch(/^Product added\.?$/);
      });

      await test.step('Verify the cart contents and total', async () => {
        await homePage.openCart();
        await cartPage.verifyItemInCart(product.title);
        expect(await cartPage.rowPrices()).toEqual([product.price]);
        expect(await cartPage.total()).toBe(product.price);
      });

      await test.step('Place the order', async () => {
        await cartPage.placeOrder(VALID_ORDER);

        const confirmation = await cartPage.verifyPurchaseSuccess();
        expect(confirmation).toContain(VALID_ORDER.card);
        expect(confirmation).toContain(VALID_ORDER.name);
        expect(CartPage.parseConfirmedAmount(confirmation)).toBe(product.price);

        await cartPage.confirmPurchase();
      });

      await test.step('The cart is empty and the session is still active', async () => {
        await cartPage.goto();
        await expect(cartPage.rows).toHaveCount(0);
        await cartPage.verifyLoggedIn(isolatedUser.username);
      });
    },
  );
});
