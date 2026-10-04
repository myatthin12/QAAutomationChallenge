import { Page, Locator, expect } from '@playwright/test';

/**
 * A DemoBlaze product detail page (prod.html).
 */
export class ProductPage {
  readonly page: Page;
  readonly productName: Locator;
  readonly productPrice: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productName = page.locator('h2.name');
    this.productPrice = page.locator('h3.price-container');
    this.addToCartButton = page.getByRole('link', { name: 'Add to cart' });
  }

  async verifyLoaded(productName: string) {
    await expect(this.page).toHaveURL(/prod\.html/);
    await expect(this.productName).toHaveText(productName);
    await expect(this.addToCartButton).toBeVisible();
  }

  /**
   * Clicks "Add to cart" and returns the text of the confirmation alert.
   * The handler is armed before the click so the dialog cannot be missed.
   */
  async addToCart(): Promise<string> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.addToCartButton.click();

    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();

    return message;
  }
}
