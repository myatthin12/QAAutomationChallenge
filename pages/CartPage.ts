import { Page, Locator, expect } from '@playwright/test';

export interface OrderDetails {
  name: string;
  country: string;
  city: string;
  card: string;
  month: string;
  year: string;
}

/**
 * The DemoBlaze cart page (cart.html) and its "Place Order" modal.
 */
export class CartPage {
  readonly page: Page;
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
  readonly successModal: Locator;
  readonly successHeading: Locator;
  readonly successDetails: Locator;
  readonly successConfirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
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
    this.successModal = page.locator('.sweet-alert');
    this.successHeading = this.successModal.locator('h2');
    this.successDetails = this.successModal.locator('p.lead');
    this.successConfirmButton = this.successModal.locator('button.confirm');
  }

  async goto() {
    await this.page.goto('/cart.html', { waitUntil: 'domcontentloaded' });
    await expect(this.placeOrderButton).toBeVisible();
  }

  rowFor(productName: string): Locator {
    return this.rows.filter({ hasText: productName });
  }

  /**
   * Waits for a product to show up in the cart.
   * DemoBlaze renders the cart from an async API call that occasionally
   * resolves after the first paint, so retry with a reload instead of
   * failing on the first empty render.
   */
  async verifyItemInCart(productName: string) {
    await expect(async () => {
      const row = this.rowFor(productName);
      if ((await row.count()) === 0) {
        await this.page.reload({ waitUntil: 'domcontentloaded' });
      }
      await expect(row).toHaveCount(1, { timeout: 5_000 });
    }).toPass({ timeout: 45_000 });

    await expect(this.totalPrice).not.toBeEmpty();
  }

  async openOrderModal() {
    await this.placeOrderButton.click();
    // Wait for the Bootstrap fade-in to finish before typing.
    await expect(this.orderModal).toHaveClass(/show/);
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

  /** Asserts the confirmation dialog and returns its details text. */
  async verifyPurchaseSuccess(): Promise<string> {
    await expect(this.successModal).toBeVisible();
    await expect(this.successHeading).toHaveText('Thank you for your purchase!');
    await expect(this.successDetails).toContainText('Amount:');

    return (await this.successDetails.textContent()) ?? '';
  }

  async confirmPurchase() {
    await this.successConfirmButton.click();
    await expect(this.successModal).not.toBeVisible();
  }
}
