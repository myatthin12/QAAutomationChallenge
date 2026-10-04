import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly loginNavButton: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginSubmitButton: Locator;
  readonly userGreeting: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginNavButton = page.locator('#login2');
    this.usernameInput = page.locator('#loginusername');
    this.passwordInput = page.locator('#loginpassword');
    this.loginSubmitButton = page.locator('button[onclick="logIn()"]');
    this.userGreeting = page.locator('#nameofuser');
  }

  async goto() {
    await this.page.goto('https://www.demoblaze.com/');
  }

  async login(username: string, pass: string) {
    await this.loginNavButton.click();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(pass);
    await this.loginSubmitButton.click();
  }

  async verifyLoggedIn(username: string) {
    await expect(this.userGreeting).toContainText(`Welcome ${username}`);
  }
}