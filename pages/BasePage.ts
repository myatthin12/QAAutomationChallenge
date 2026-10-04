import { Page, Locator, Dialog, expect } from '@playwright/test';

/**
 * Shared behaviour for every page: the navigation bar that DemoBlaze renders
 * on all routes, and the helpers for its JS-driven alerts and modals.
 */
export abstract class BasePage {
  readonly page: Page;
  readonly homeNavLink: Locator;
  readonly cartNavButton: Locator;
  readonly loginNavButton: Locator;
  readonly signUpNavButton: Locator;
  readonly logoutNavButton: Locator;
  readonly userGreeting: Locator;

  protected constructor(page: Page) {
    this.page = page;
    this.homeNavLink = page.locator('.navbar-brand');
    this.cartNavButton = page.locator('#cartur');
    this.loginNavButton = page.locator('#login2');
    this.signUpNavButton = page.locator('#signin2');
    this.logoutNavButton = page.locator('#logout2');
    this.userGreeting = page.locator('#nameofuser');
  }

  /**
   * Runs an action that triggers a native alert and returns its message.
   *
   * The handler accepts the dialog the moment it opens, rather than leaving it
   * parked on a pending `waitForEvent('dialog')`. That distinction matters:
   * DemoBlaze raises some alerts *synchronously inside the click handler* -
   * the order form's "Please fill out Name and Creditcard." and the empty
   * login check both do - and a click that opens a dialog nobody accepts never
   * resolves, so the click times out instead of the assertion running.
   *
   * Resolving through a promise rather than returning from the handler means
   * this works whichever way round the two events land: synchronously during
   * the click, or later from an AJAX callback.
   */
  async captureAlert(action: () => Promise<void>, timeoutMs = 30_000): Promise<string> {
    let resolveMessage!: (message: string) => void;
    const captured = new Promise<string>((resolve) => {
      resolveMessage = resolve;
    });

    this.page.once('dialog', async (dialog: Dialog) => {
      resolveMessage(dialog.message());
      await dialog.accept();
    });

    await action();

    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        captured,
        new Promise<string>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`No dialog appeared within ${timeoutMs}ms`)),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /** Waits for a Bootstrap modal to finish fading in before interacting. */
  async waitForModalOpen(modal: Locator) {
    await expect(modal).toHaveClass(/show/, { timeout: 30_000 });
  }

  async openCart() {
    await this.cartNavButton.click();
  }

  async logout() {
    await this.logoutNavButton.click();
    await expect(this.loginNavButton).toBeVisible();
  }

  async verifyLoggedIn(username: string) {
    await expect(this.userGreeting).toBeVisible();
    await expect(this.userGreeting).toHaveText(`Welcome ${username}`);
    await expect(this.logoutNavButton).toBeVisible();
  }

  async verifyLoggedOut() {
    await expect(this.loginNavButton).toBeVisible();
    await expect(this.userGreeting).not.toBeVisible();
  }
}
