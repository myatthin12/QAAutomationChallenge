import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('DemoBlaze Authentication Suite', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('TC_LOG_001: Login with valid credentials', async () => {
    await loginPage.openLoginModal();
    // Ensure this username/password exists in your DemoBlaze instance
    await loginPage.fillCredentials('m1', 'test1234'); 
    await loginPage.submitLogin();
    await loginPage.verifyLoggedIn();
  });

  test('TC_LOG_002: Login with wrong password handles alert and closes modal', async () => {
    await loginPage.loginWithInvalidCredentials('m1', 'wrongpass123');
  });
});