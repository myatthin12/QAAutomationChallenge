import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** The sign-up modal opened from the DemoBlaze navigation bar. */
export class SignUpPage extends BasePage {
  readonly signUpModal: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signUpSubmitButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.signUpModal = page.locator('#signInModal');
    this.usernameInput = page.locator('#sign-username');
    this.passwordInput = page.locator('#sign-password');
    this.signUpSubmitButton = page.locator('button[onclick="register()"]');
    this.closeButton = this.signUpModal.locator('button.btn-secondary');
  }

  async openSignUpModal() {
    await this.signUpNavButton.click();
    await this.waitForModalOpen(this.signUpModal);
    await expect(this.usernameInput).toBeVisible();
  }

  /** Submits the sign-up form and returns the resulting alert text. */
  async signUpExpectingAlert(username: string, password: string): Promise<string> {
    await this.openSignUpModal();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    return this.captureAlert(() => this.signUpSubmitButton.click());
  }
}
