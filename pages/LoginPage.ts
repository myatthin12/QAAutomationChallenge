import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** The login modal opened from the DemoBlaze navigation bar. */
export class LoginPage extends BasePage {
  readonly loginModal: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginSubmitButton: Locator;
  readonly closeButton: Locator;
  readonly dismissButton: Locator;

  constructor(page: Page) {
    super(page);
    this.loginModal = page.locator('#logInModal');
    this.usernameInput = page.locator('#loginusername');
    this.passwordInput = page.locator('#loginpassword');
    this.loginSubmitButton = page.locator('button[onclick="logIn()"]');
    this.closeButton = this.loginModal.locator('button.btn-secondary');
    this.dismissButton = this.loginModal.locator('button.close');
  }

  /**
   * Opens the home page, retrying the navigation if it stalls. The demo host
   * intermittently times out a page load under traffic, which would otherwise
   * fail the test on an infrastructure hiccup rather than a real defect.
   */
  async goto() {
    await expect(async () => {
      await this.page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(this.loginNavButton).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 60_000 });
  }

  async openLoginModal() {
    await this.loginNavButton.click();
    // Bootstrap fades the modal in; waiting for the input alone is not enough
    // because clicks land on the backdrop while the animation runs.
    await this.waitForModalOpen(this.loginModal);
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

    await expect(this.loginModal).not.toBeVisible();
    await this.verifyLoggedIn(username);
  }

  /** Submits credentials expected to be rejected and returns the alert text. */
  async loginExpectingAlert(username: string, password: string): Promise<string> {
    await this.openLoginModal();
    await this.fillCredentials(username, password);
    return this.captureAlert(() => this.submitLogin());
  }

  /** Submits the form without opening the modal again (already open). */
  async submitExpectingAlert(): Promise<string> {
    return this.captureAlert(() => this.submitLogin());
  }

  async closeLoginModal() {
    await this.closeButton.click();
    await expect(this.loginModal).not.toBeVisible();
    await expect(this.loginNavButton).toBeVisible();
  }

  /** Submits the login form by pressing Enter in the password field. */
  async submitWithEnterKey() {
    await this.passwordInput.press('Enter');
  }

  async passwordFieldType(): Promise<string | null> {
    return this.passwordInput.getAttribute('type');
  }
}
