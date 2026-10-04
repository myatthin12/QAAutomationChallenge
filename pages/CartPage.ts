import { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly placeOrderButton: Locator;
  readonly nameInput: Locator;
  readonly countryInput: Locator;
  readonly cityInput: Locator;
  readonly cardInput: Locator;
  readonly monthInput: Locator;
  readonly yearInput: Locator;
  readonly purchaseButton: Locator;
  readonly successModal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.placeOrderButton = page.locator('button', { hasText: 'Place Order' });
    this.nameInput = page.locator('#name');
    this.countryInput = page.locator('#country');
    this.cityInput = page.locator('#city');
    this.cardInput = page.locator('#card');
    this.monthInput = page.locator('#month');
    this.yearInput = page.locator('#year');
    this.purchaseButton = page.locator('button[onclick="purchaseOrder()"]');
    this.successModal = page.locator('.sweet-alert');
  }

  async placeOrder(details: { name: string; country: string; city: string; card: string; month: string; year: string }) {
    await this.placeOrderButton.click();
    
    // Wait for modal animation to settle before interacting
    await this.nameInput.waitFor({ state: 'visible' });
    
    await this.nameInput.fill(details.name);
    await this.countryInput.fill(details.country);
    await this.cityInput.fill(details.city);
    await this.cardInput.fill(details.card);
    await this.monthInput.fill(details.month);
    await this.yearInput.fill(details.year);
    await this.purchaseButton.click();
  }

  async verifyPurchaseSuccess() {
    await this.successModal.waitFor({ state: 'visible' });
  }
}