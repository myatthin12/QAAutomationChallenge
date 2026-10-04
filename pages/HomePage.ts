import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** The DemoBlaze product catalogue (index.html). */
export class HomePage extends BasePage {
  readonly productCards: Locator;
  readonly categoryLinks: Locator;
  readonly nextPageButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productCards = page.locator('#tbodyid .card-title a');
    this.categoryLinks = page.locator('#itemc');
    this.nextPageButton = page.locator('#next2');
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

  async filterByCategory(category: string) {
    await this.categoryLinks
      .filter({ hasText: new RegExp(category, 'i') })
      .first()
      .click();
    await expect(this.productCards.first()).toBeVisible();
  }

  async productTitles(): Promise<string[]> {
    return (await this.productCards.allTextContents()).map((title) => title.trim());
  }
}
