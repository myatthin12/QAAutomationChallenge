import { Page, Locator, expect } from '@playwright/test';

/**
 * The login modal that is opened from the DemoBlaze navigation bar.
 */
export class LoginPage {
  readonly page: Page;
  readonly loginNavButton: Locator;
  readonly loginModal: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginSubmitButton: Locator;
  readonly loginModalCloseButton: Locator;
  readonly userGreeting: Locator;
  readonly logoutNavButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginNavButton = page.locator('#login2');
    this.loginModal = page.locator('#logInModal');
    this.usernameInput = page.locator('#loginusername');
    this.passwordInput = page.locator('#loginpassword');
    this.loginSubmitButton = page.locator('button[onclick="logIn()"]');
    this.loginModalCloseButton = this.loginModal.locator('button.btn-secondary');
    this.userGreeting = page.locator('#nameofuser');
    this.logoutNavButton = page.locator('#logout2');
  }

  async goto() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(this.loginNavButton).toBeVisible();
  }

  async openLoginModal() {
    await this.loginNavButton.click();
    // Bootstrap fades the modal in; waiting for the input alone is not enough
    // because clicks land on the backdrop while the animation runs.
    await expect(this.loginModal).toHaveClass(/show/);
    await expect(this.usernameInput).toBeVisible();
  }

  async fillCredentials(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async submitLogin() {
    await this.loginSubmitButton.click();
  }

  /**
   * Opens the modal, submits valid credentials and waits for the session.
   * The login XHR is awaited explicitly so a dropped request fails with a
   * clear message instead of an unexplained "greeting never appeared".
   */
  async login(username: string, password: string) {
    await this.openLoginModal();
    await this.fillCredentials(username, password);

    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/login'),
      { timeout: 30_000 },
    );
    await this.submitLogin();

    const response = await responsePromise;
    expect(response.ok(), 'login request should succeed').toBeTruthy();

    await this.verifyLoggedIn(username);
  }

  async verifyLoggedIn(username: string) {
    await expect(this.loginModal).not.toBeVisible();
    await expect(this.userGreeting).toBeVisible();
    await expect(this.userGreeting).toHaveText(`Welcome ${username}`);
    await expect(this.logoutNavButton).toBeVisible();
  }

  /**
   * Submits a bad password and returns the text of the alert DemoBlaze raises.
   * The dialog handler is armed before the click so the alert cannot be missed.
   */
  async loginExpectingAlert(username: string, password: string): Promise<string> {
    await this.openLoginModal();
    await this.fillCredentials(username, password);

    const dialogPromise = this.page.waitForEvent('dialog');
    await this.submitLogin();

    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.dismiss();

    return message;
  }

  async closeLoginModal() {
    await this.loginModalCloseButton.click();
    await expect(this.loginModal).not.toBeVisible();
    await expect(this.loginNavButton).toBeVisible();
  }

  async verifyLoggedOut() {
    await expect(this.loginNavButton).toBeVisible();
    await expect(this.userGreeting).not.toBeVisible();
  }
}
