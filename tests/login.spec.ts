import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CREDENTIALS, INVALID_PASSWORD } from '../config/env';

test.describe('DemoBlaze Authentication Suite', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('TC_LOG_001: Login with valid credentials', async () => {
    await loginPage.openLoginModal();
    await loginPage.fillCredentials(CREDENTIALS.username, CREDENTIALS.password);
    await loginPage.submitLogin();

    await loginPage.verifyLoggedIn(CREDENTIALS.username);
  });

  test('TC_LOG_002: Login with wrong password shows an alert and keeps the user signed out', async () => {
    const message = await loginPage.loginExpectingAlert(
      CREDENTIALS.username,
      INVALID_PASSWORD,
    );

    expect(message).toBe('Wrong password.');

    await loginPage.closeLoginModal();
    await loginPage.verifyLoggedOut();
  });

  test('TC_LOG_003: Login with an unknown user shows an alert', async () => {
    const unknownUser = `no-such-user-${Date.now()}`;

    const message = await loginPage.loginExpectingAlert(unknownUser, INVALID_PASSWORD);

    expect(message).toBe('User does not exist.');

    await loginPage.closeLoginModal();
    await loginPage.verifyLoggedOut();
  });
});
