import { Page, Locator, expect } from '@playwright/test';

/**
 * The DemoBlaze product catalogue (home page) plus the navigation bar
 * that is shared across the whole site.
 */
export class HomePage {
  readonly page: Page;
  readonly cartNavButton: Locator;
  readonly loginNavButton: Locator;
  readonly logoutNavButton: Locator;
  readonly userGreeting: Locator;
  readonly productCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartNavButton = page.locator('#cartur');
    this.loginNavButton = page.locator('#login2');
    this.logoutNavButton = page.locator('#logout2');
    this.userGreeting = page.locator('#nameofuser');
    this.productCards = page.locator('#tbodyid .card-title a');
  }

  async goto() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    // The catalogue is rendered by JS after the initial HTML loads.
    await expect(this.productCards.first()).toBeVisible();
  }

  productLink(productName: string): Locator {
    return this.productCards.filter({ hasText: productName });
  }

  /** Opens a product detail page from the catalogue. */
  async openProduct(productName: string) {
    await this.productLink(productName).first().click();
  }

  async openCart() {
    await this.cartNavButton.click();
  }

  async verifyLoggedIn(username: string) {
    await expect(this.userGreeting).toContainText(`Welcome ${username}`);
  }
}
