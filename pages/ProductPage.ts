import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** A DemoBlaze product detail page (prod.html). */
export class ProductPage extends BasePage {
  readonly productName: Locator;
  readonly productPrice: Locator;
  readonly productDescription: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productName = page.locator('h2.name');
    this.productPrice = page.locator('h3.price-container');
    this.productDescription = page.locator('#more-information');
    this.addToCartButton = page.getByRole('link', { name: 'Add to cart' });
  }

  /**
   * Opens a product by id, retrying the navigation if the page does not
   * render. The demo host intermittently serves a blank product page under
   * load, which would otherwise surface as a misleading "element not found".
   */
  async gotoById(id: number) {
    await expect(async () => {
      await this.page.goto(`/prod.html?idp_=${id}`, { waitUntil: 'domcontentloaded' });
      await expect(this.addToCartButton).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 60_000 });
  }

  async verifyLoaded(productName: string) {
    await expect(this.page).toHaveURL(/prod\.html/);
    await expect(this.productName).toHaveText(productName);
    await expect(this.addToCartButton).toBeVisible();
  }

  /** The numeric price shown on the detail page, e.g. "$360 *includes tax" -> 360. */
  async price(): Promise<number> {
    const text = (await this.productPrice.textContent()) ?? '';
    const match = text.match(/\$\s*([\d.,]+)/);
    return match ? Number(match[1].replace(/,/g, '')) : NaN;
  }

  /**
   * Clicks "Add to cart" and returns the text of the confirmation alert.
   *
   * The POST is awaited as well as the alert: without it a dropped request
   * surfaces much later as an inexplicably empty cart, instead of failing here.
   */
  async addToCart(): Promise<string> {
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/addtocart'),
      { timeout: 30_000 },
    );

    const message = await this.captureAlert(() => this.addToCartButton.click());

    const response = await responsePromise;
    expect(response.ok(), 'add-to-cart request should succeed').toBeTruthy();

    return message;
  }
}
