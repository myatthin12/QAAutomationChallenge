import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { OrderDetails } from '../data/orders';

/** The DemoBlaze cart page (cart.html) and its "Place Order" modal. */
export class CartPage extends BasePage {
  readonly rows: Locator;
  readonly totalPrice: Locator;
  readonly placeOrderButton: Locator;
  readonly orderModal: Locator;
  readonly nameInput: Locator;
  readonly countryInput: Locator;
  readonly cityInput: Locator;
  readonly cardInput: Locator;
  readonly monthInput: Locator;
  readonly yearInput: Locator;
  readonly purchaseButton: Locator;
  readonly orderModalCloseButton: Locator;
  readonly successModal: Locator;
  readonly successHeading: Locator;
  readonly successDetails: Locator;
  readonly successConfirmButton: Locator;

  constructor(page: Page) {
    super(page);
    this.rows = page.locator('#tbodyid tr');
    this.totalPrice = page.locator('#totalp');
    this.placeOrderButton = page.getByRole('button', { name: 'Place Order' });
    this.orderModal = page.locator('#orderModal');
    this.nameInput = page.locator('#name');
    this.countryInput = page.locator('#country');
    this.cityInput = page.locator('#city');
    this.cardInput = page.locator('#card');
    this.monthInput = page.locator('#month');
    this.yearInput = page.locator('#year');
    this.purchaseButton = page.locator('button[onclick="purchaseOrder()"]');
    this.orderModalCloseButton = this.orderModal.locator('button.btn-secondary');
    this.successModal = page.locator('.sweet-alert');
    this.successHeading = this.successModal.locator('h2');
    this.successDetails = this.successModal.locator('p.lead');
    this.successConfirmButton = this.successModal.locator('button.confirm');
  }

  /**
   * Opens the cart, retrying the navigation if the page does not render.
   * Same reason as ProductPage.gotoById: under load the demo host sometimes
   * serves a page whose controls never appear.
   */
  async goto() {
    await expect(async () => {
      await this.page.goto('/cart.html', { waitUntil: 'domcontentloaded' });
      await expect(this.placeOrderButton).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 60_000 });
  }

  rowFor(productName: string): Locator {
    return this.rows.filter({ hasText: productName });
  }

  deleteLinkFor(productName: string): Locator {
    return this.rowFor(productName).first().getByText('Delete');
  }

  /**
   * Waits for a product to show up in the cart.
   * DemoBlaze renders the cart from an async API call that occasionally
   * resolves after the first paint, so retry with a reload instead of
   * failing on the first empty render.
   */
  async verifyItemInCart(productName: string, expectedCount = 1) {
    await expect(async () => {
      const row = this.rowFor(productName);
      if ((await row.count()) < expectedCount) {
        await this.page.reload({ waitUntil: 'domcontentloaded' });
      }
      await expect(row).toHaveCount(expectedCount, { timeout: 5_000 });
    }).toPass({ timeout: 45_000 });
  }

  /** Waits for the cart to settle on an expected number of rows. */
  async waitForRowCount(expected: number) {
    await expect(async () => {
      if ((await this.rows.count()) !== expected) {
        await this.page.reload({ waitUntil: 'domcontentloaded' });
      }
      await expect(this.rows).toHaveCount(expected, { timeout: 5_000 });
    }).toPass({ timeout: 45_000 });
  }

  /** The cart total as a number. */
  async total(): Promise<number> {
    await expect(this.totalPrice).not.toBeEmpty();
    return Number((await this.totalPrice.textContent())?.trim());
  }

  /** The per-row prices currently displayed in the cart. */
  async rowPrices(): Promise<number[]> {
    const count = await this.rows.count();
    const prices: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const text = await this.rows.nth(index).locator('td').nth(2).textContent();
      prices.push(Number(text?.trim()));
    }
    return prices;
  }

  async removeItem(productName: string) {
    const before = await this.rows.count();
    await this.deleteLinkFor(productName).click();
    await expect(this.rows).toHaveCount(before - 1, { timeout: 20_000 });
  }

  async emptyCart() {
    await this.goto();
    // Deleting re-renders the table, so always act on the first remaining row.
    while ((await this.rows.count()) > 0) {
      const before = await this.rows.count();
      await this.rows.first().getByText('Delete').click();
      await expect(this.rows).toHaveCount(before - 1, { timeout: 20_000 });
    }
  }

  async openOrderModal() {
    await this.placeOrderButton.click();
    await this.waitForModalOpen(this.orderModal);
    await expect(this.nameInput).toBeVisible();
  }

  async fillOrderDetails(details: OrderDetails) {
    await this.nameInput.fill(details.name);
    await this.countryInput.fill(details.country);
    await this.cityInput.fill(details.city);
    await this.cardInput.fill(details.card);
    await this.monthInput.fill(details.month);
    await this.yearInput.fill(details.year);
  }

  async purchase() {
    await this.purchaseButton.click();
  }

  async placeOrder(details: OrderDetails) {
    await this.openOrderModal();
    await this.fillOrderDetails(details);
    await this.purchase();
  }

  /** Submits the order form expecting a validation alert, and returns it. */
  async purchaseExpectingAlert(): Promise<string> {
    return this.captureAlert(() => this.purchase());
  }

  async closeOrderModal() {
    await this.orderModalCloseButton.click();
    await expect(this.orderModal).not.toBeVisible();
  }

  /** Asserts the confirmation dialog and returns its details text. */
  async verifyPurchaseSuccess(): Promise<string> {
    await expect(this.successModal).toBeVisible();
    await expect(this.successHeading).toHaveText('Thank you for your purchase!');
    await expect(this.successDetails).toContainText('Amount:');
    return (await this.successDetails.textContent()) ?? '';
  }

  /** The "Amount: N USD" figure from the confirmation dialog. */
  static parseConfirmedAmount(confirmation: string): number {
    const match = confirmation.match(/Amount:\s*([\d.,]+)\s*USD/);
    return match ? Number(match[1].replace(/,/g, '')) : NaN;
  }

  async confirmPurchase() {
    await this.successConfirmButton.click();
    await expect(this.successModal).not.toBeVisible();
  }
}
