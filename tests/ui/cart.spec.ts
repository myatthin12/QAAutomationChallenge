import { test, expect } from '../../fixtures/test-fixtures';
import { CartPage } from '../../pages/CartPage';
import { PRODUCTS } from '../../data/products';
import {
  EMPTY_ORDER,
  LONG_TEXT,
  VALID_ORDER,
  XSS_PAYLOAD,
  orderWith,
} from '../../data/orders';

const { galaxyS6, nokiaLumia1520 } = PRODUCTS;

/**
 * Cart suite.
 *
 * Every test depends on the `signedIn` fixture, which registers a throwaway
 * account and logs in with it. That is not incidental - it is what makes these
 * tests isolated:
 *
 *   - Anonymous visitors send an empty cart id, so they all share ONE global
 *     server-side cart. Running these tests anonymously made them read dozens
 *     of rows left behind by other runs.
 *   - A logged-in cart is keyed to the account, and is shared by every browser
 *     session using that login.
 *
 * A fresh account per test is therefore the only way to get a clean cart.
 */
test.describe('Cart', { tag: ['@ui', '@regression'] }, () => {
  // Activates the signedIn fixture for every test in this file: it registers a
  // throwaway account and logs in, which is what gives each test a clean cart.
  test.beforeEach(async ({ signedIn }) => {
    expect(signedIn.username).toMatch(/^qa-auto-/);
  });

  test(
    'CART-001: adds a single product to the cart',
    { tag: '@smoke' },
    async ({ productPage, cartPage }) => {
      await productPage.gotoById(galaxyS6.id);
      const alert = await productPage.addToCart();
      expect(alert).toMatch(/^Product added\.?$/);

      await cartPage.goto();
      await cartPage.verifyItemInCart(galaxyS6.title);
    },
  );

  test('CART-002: adds two different products as separate rows', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();
    await productPage.gotoById(nokiaLumia1520.id);
    await productPage.addToCart();

    await cartPage.goto();
    await cartPage.waitForRowCount(2);
    await expect(cartPage.rowFor(galaxyS6.title)).toHaveCount(1);
    await expect(cartPage.rowFor(nokiaLumia1520.title)).toHaveCount(1);
  });

  test('CART-003: adding the same product twice creates two rows', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();

    await cartPage.goto();
    // The cart has no quantity column, so a repeat add is a second line item.
    await cartPage.verifyItemInCart(galaxyS6.title, 2);
    expect(await cartPage.total()).toBe(galaxyS6.price * 2);
  });

  test('CART-004: shows the product title and price from the product page', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    const priceOnProductPage = await productPage.price();
    await productPage.addToCart();

    await cartPage.goto();
    await cartPage.verifyItemInCart(galaxyS6.title);
    expect(priceOnProductPage).toBe(galaxyS6.price);
    expect(await cartPage.rowPrices()).toEqual([galaxyS6.price]);
  });

  test('CART-005: totals a single product correctly', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();

    await cartPage.goto();
    await cartPage.verifyItemInCart(galaxyS6.title);
    expect(await cartPage.total()).toBe(galaxyS6.price);
  });

  test('CART-006: totals multiple products correctly', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();
    await productPage.gotoById(nokiaLumia1520.id);
    await productPage.addToCart();

    await cartPage.goto();
    await cartPage.waitForRowCount(2);
    expect(await cartPage.total()).toBe(galaxyS6.price + nokiaLumia1520.price);
  });

  test('CART-007: removes one product and updates the total', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();
    await productPage.gotoById(nokiaLumia1520.id);
    await productPage.addToCart();

    await cartPage.goto();
    await cartPage.waitForRowCount(2);
    await cartPage.removeItem(galaxyS6.title);

    await expect(cartPage.rowFor(galaxyS6.title)).toHaveCount(0);
    await expect(cartPage.rowFor(nokiaLumia1520.title)).toHaveCount(1);
    expect(await cartPage.total()).toBe(nokiaLumia1520.price);
  });

  test('CART-008: removing the last product empties the cart', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();

    await cartPage.goto();
    await cartPage.verifyItemInCart(galaxyS6.title);
    await cartPage.removeItem(galaxyS6.title);

    await expect(cartPage.rows).toHaveCount(0);
  });

  test('CART-009: shows an empty cart with no rows', async ({ cartPage }) => {
    await cartPage.goto();

    await expect(cartPage.rows).toHaveCount(0);
  });

  test('CART-010: opens the order modal with all six fields', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();
    await cartPage.goto();
    await cartPage.verifyItemInCart(galaxyS6.title);

    await cartPage.openOrderModal();

    await expect(cartPage.nameInput).toBeVisible();
    await expect(cartPage.countryInput).toBeVisible();
    await expect(cartPage.cityInput).toBeVisible();
    await expect(cartPage.cardInput).toBeVisible();
    await expect(cartPage.monthInput).toBeVisible();
    await expect(cartPage.yearInput).toBeVisible();
  });

  test('CART-011: rejects a purchase with every field empty', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();
    await cartPage.goto();
    await cartPage.verifyItemInCart(galaxyS6.title);

    await cartPage.openOrderModal();
    await cartPage.fillOrderDetails(EMPTY_ORDER);
    const alert = await cartPage.purchaseExpectingAlert();

    expect(alert).toBe('Please fill out Name and Creditcard.');
    await expect(cartPage.successModal).not.toBeVisible();
  });

  test('CART-012: rejects a purchase with no credit card', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();
    await cartPage.goto();
    await cartPage.verifyItemInCart(galaxyS6.title);

    await cartPage.openOrderModal();
    await cartPage.fillOrderDetails(orderWith({ card: '' }));
    const alert = await cartPage.purchaseExpectingAlert();

    expect(alert).toBe('Please fill out Name and Creditcard.');
  });

  test('CART-013: rejects a purchase with no name', async ({ productPage, cartPage }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();
    await cartPage.goto();
    await cartPage.verifyItemInCart(galaxyS6.title);

    await cartPage.openOrderModal();
    await cartPage.fillOrderDetails(orderWith({ name: '' }));
    const alert = await cartPage.purchaseExpectingAlert();

    expect(alert).toBe('Please fill out Name and Creditcard.');
  });

  test('CART-014: closing the order modal leaves the cart intact', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();
    await cartPage.goto();
    await cartPage.verifyItemInCart(galaxyS6.title);

    await cartPage.openOrderModal();
    await cartPage.fillOrderDetails(VALID_ORDER);
    await cartPage.closeOrderModal();

    await expect(cartPage.successModal).not.toBeVisible();
    await expect(cartPage.rowFor(galaxyS6.title)).toHaveCount(1);
  });

  test('CART-015: keeps the cart when navigating away and back', async ({
    productPage,
    cartPage,
    homePage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();

    await cartPage.goto();
    await cartPage.verifyItemInCart(galaxyS6.title);
    await homePage.goto();
    await cartPage.goto();

    await cartPage.verifyItemInCart(galaxyS6.title);
  });

  test('CART-016: keeps the cart across a page refresh', async ({
    productPage,
    cartPage,
    page,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();
    await cartPage.goto();
    await cartPage.verifyItemInCart(galaxyS6.title);

    await page.reload({ waitUntil: 'domcontentloaded' });

    // Still exactly one row - a refresh must not duplicate or drop the item.
    await cartPage.verifyItemInCart(galaxyS6.title, 1);
  });

  test('CART-017: renders script input as text instead of executing it', async ({
    productPage,
    cartPage,
    page,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();
    await cartPage.goto();
    await cartPage.verifyItemInCart(galaxyS6.title);

    await cartPage.placeOrder(orderWith({ name: XSS_PAYLOAD }));
    const confirmation = await cartPage.verifyPurchaseSuccess();

    // The payload is echoed back verbatim as text and never runs.
    expect(confirmation).toContain(XSS_PAYLOAD);
    expect(
      await page.evaluate(
        () => (window as never as { __xssExecuted?: boolean }).__xssExecuted,
      ),
    ).toBeFalsy();
  });

  test('CART-018: stays stable with an over-long name', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();
    await cartPage.goto();
    await cartPage.verifyItemInCart(galaxyS6.title);

    await cartPage.placeOrder(orderWith({ name: LONG_TEXT }));

    await cartPage.verifyPurchaseSuccess();
  });

  test('CART-019: confirmation amount matches the cart total', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();
    await productPage.gotoById(nokiaLumia1520.id);
    await productPage.addToCart();
    await cartPage.goto();
    await cartPage.waitForRowCount(2);

    const total = await cartPage.total();
    await cartPage.placeOrder(VALID_ORDER);
    const confirmation = await cartPage.verifyPurchaseSuccess();

    expect(CartPage.parseConfirmedAmount(confirmation)).toBe(total);
  });

  test('CART-020: empties the cart after a successful purchase', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.gotoById(galaxyS6.id);
    await productPage.addToCart();
    await cartPage.goto();
    await cartPage.verifyItemInCart(galaxyS6.title);

    await cartPage.placeOrder(VALID_ORDER);
    await cartPage.verifyPurchaseSuccess();
    await cartPage.confirmPurchase();

    await cartPage.goto();
    await expect(cartPage.rows).toHaveCount(0);
  });

  test(
    'CART-021: completes a purchase from an empty cart for 0 USD',
    { tag: '@known-defect' },
    async ({ cartPage }) => {
      await cartPage.goto();
      await expect(cartPage.rows).toHaveCount(0);

      await cartPage.placeOrder(VALID_ORDER);
      const confirmation = await cartPage.verifyPurchaseSuccess();

      // DEFECT-001: an empty cart should not be purchasable at all, yet the
      // app confirms an order for 0 USD.
      expect(CartPage.parseConfirmedAmount(confirmation)).toBe(0);
    },
  );

  test(
    'CART-022: accepts a purchase with no country, city or expiry date',
    { tag: '@known-defect' },
    async ({ productPage, cartPage }) => {
      await productPage.gotoById(galaxyS6.id);
      await productPage.addToCart();
      await cartPage.goto();
      await cartPage.verifyItemInCart(galaxyS6.title);

      await cartPage.placeOrder(
        orderWith({ country: '', city: '', month: '', year: '' }),
      );

      // DEFECT-002: only Name and Credit card are validated, so an order can
      // be placed with no delivery address and no card expiry.
      await cartPage.verifyPurchaseSuccess();
    },
  );

  test(
    'CART-023: accepts a non-numeric credit card number',
    { tag: '@known-defect' },
    async ({ productPage, cartPage }) => {
      await productPage.gotoById(galaxyS6.id);
      await productPage.addToCart();
      await cartPage.goto();
      await cartPage.verifyItemInCart(galaxyS6.title);

      await cartPage.placeOrder(orderWith({ card: 'ABC-not-a-card-!@#' }));

      // DEFECT-004: the card field has no format or Luhn validation.
      await cartPage.verifyPurchaseSuccess();
    },
  );
});
