import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly loginNavButton: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginSubmitButton: Locator;
  readonly loginModalCloseButton: Locator;
  readonly userGreeting: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginNavButton = page.locator('#login2');
    this.usernameInput = page.locator('#loginusername');
    this.passwordInput = page.locator('#loginpassword');
    this.loginSubmitButton = page.locator('button[onclick="logIn()"]');
    this.loginModalCloseButton = page.locator('#logInModal button.btn-secondary', { hasText: 'Close' });
    this.userGreeting = page.locator('#nameofuser');
  }

  async goto() {
    await this.page.goto('https://www.demoblaze.com/');
  }

  async openLoginModal() {
    await this.loginNavButton.click();
    await this.usernameInput.waitFor({ state: 'visible' });
  }

  async fillCredentials(username: string, pass: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(pass);
  }

  async submitLogin() {
    await this.loginSubmitButton.click();
  }

  async verifyLoggedIn() {
    await this.userGreeting.waitFor({ state: 'visible' });
  }

  async loginWithInvalidCredentials(username: string, invalidPass: string) {
    await this.openLoginModal();
    await this.fillCredentials(username, invalidPass);

    const dialogPromise = this.page.waitForEvent('dialog');
    await this.submitLogin();

    const dialog = await dialogPromise;
    await dialog.accept();

    await this.loginModalCloseButton.click();
    await this.loginNavButton.waitFor({ state: 'visible' });
  }
}