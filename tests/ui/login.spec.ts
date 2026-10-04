import { test, expect } from '../../fixtures/test-fixtures';
import { SignUpPage } from '../../pages/SignUpPage';
import { CREDENTIALS, INVALID_PASSWORD } from '../../config/env';
import { LONG_TEXT } from '../../data/orders';

/**
 * Login suite. Expected results below are the *observed* behaviour of
 * DemoBlaze, verified against the app and its API. Cases that document a
 * genuine defect are tagged @known-defect and assert today's behaviour, so
 * the suite stays green while the defect stays visible in the report.
 */
test.describe('Login', { tag: ['@ui', '@regression'] }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test(
    'LOGIN-001: logs in with valid credentials',
    { tag: '@smoke' },
    async ({ loginPage }) => {
      await loginPage.login(CREDENTIALS.username, CREDENTIALS.password);

      await expect(loginPage.userGreeting).toHaveText(`Welcome ${CREDENTIALS.username}`);
    },
  );

  test('LOGIN-002: rejects a valid username with a wrong password', async ({
    loginPage,
  }) => {
    const alert = await loginPage.loginExpectingAlert(
      CREDENTIALS.username,
      INVALID_PASSWORD,
    );

    expect(alert).toBe('Wrong password.');
    await loginPage.closeLoginModal();
    await loginPage.verifyLoggedOut();
  });

  test('LOGIN-003: rejects an unregistered username', async ({ loginPage }) => {
    const alert = await loginPage.loginExpectingAlert(
      `ghost-${Date.now()}`,
      INVALID_PASSWORD,
    );

    expect(alert).toBe('User does not exist.');
    await loginPage.closeLoginModal();
    await loginPage.verifyLoggedOut();
  });

  test('LOGIN-004: blocks submission when both fields are empty', async ({
    loginPage,
  }) => {
    await loginPage.openLoginModal();
    const alert = await loginPage.submitExpectingAlert();

    expect(alert).toBe('Please fill out Username and Password.');
    await expect(loginPage.loginModal).toBeVisible();
  });

  test('LOGIN-005: blocks submission when only the username is missing', async ({
    loginPage,
  }) => {
    await loginPage.openLoginModal();
    await loginPage.fillCredentials('', CREDENTIALS.password);
    const alert = await loginPage.submitExpectingAlert();

    expect(alert).toBe('Please fill out Username and Password.');
  });

  test('LOGIN-006: blocks submission when only the password is missing', async ({
    loginPage,
  }) => {
    await loginPage.openLoginModal();
    await loginPage.fillCredentials(CREDENTIALS.username, '');
    const alert = await loginPage.submitExpectingAlert();

    expect(alert).toBe('Please fill out Username and Password.');
  });

  test('LOGIN-007: treats the username as case-sensitive', async ({ loginPage }) => {
    const alert = await loginPage.loginExpectingAlert(
      CREDENTIALS.username.toLowerCase(),
      CREDENTIALS.password,
    );

    // A lower-cased username is a different account entirely.
    expect(alert).toBe('User does not exist.');
  });

  test('LOGIN-008: treats the password as case-sensitive', async ({ loginPage }) => {
    const alert = await loginPage.loginExpectingAlert(
      CREDENTIALS.username,
      CREDENTIALS.password.toLowerCase(),
    );

    expect(alert).toBe('Wrong password.');
  });

  test('LOGIN-009: does not trim surrounding whitespace from the username', async ({
    loginPage,
  }) => {
    const alert = await loginPage.loginExpectingAlert(
      `  ${CREDENTIALS.username}  `,
      CREDENTIALS.password,
    );

    // Documents the behaviour: whitespace is sent verbatim, so the lookup misses.
    expect(alert).toBe('User does not exist.');
  });

  test('LOGIN-010: masks the password input', async ({ loginPage }) => {
    await loginPage.openLoginModal();
    await loginPage.passwordInput.fill(CREDENTIALS.password);

    expect(await loginPage.passwordFieldType()).toBe('password');
  });

  test(
    'LOGIN-011: does not submit the form with the Enter key',
    { tag: '@known-defect' },
    async ({ loginPage }) => {
      await loginPage.openLoginModal();
      await loginPage.fillCredentials(CREDENTIALS.username, CREDENTIALS.password);
      await loginPage.submitWithEnterKey();

      // DEFECT-013: the Login button is type="button" with an onclick handler
      // and the form has no submit handler, so pressing Enter does nothing.
      // Expected behaviour is that Enter submits the login, as on most forms.
      await expect(loginPage.loginModal).toBeVisible();
      await loginPage.verifyLoggedOut();
    },
  );

  test('LOGIN-012: closing the modal leaves the user signed out', async ({
    loginPage,
  }) => {
    await loginPage.openLoginModal();
    await loginPage.fillCredentials(CREDENTIALS.username, CREDENTIALS.password);
    await loginPage.closeLoginModal();

    await loginPage.verifyLoggedOut();
  });

  test('LOGIN-013: logs the user out again', async ({ loginPage }) => {
    await loginPage.login(CREDENTIALS.username, CREDENTIALS.password);
    await loginPage.logout();

    await loginPage.verifyLoggedOut();
  });

  test('LOGIN-014: keeps the session after a page reload', async ({
    loginPage,
    page,
  }) => {
    await loginPage.login(CREDENTIALS.username, CREDENTIALS.password);
    await page.reload({ waitUntil: 'domcontentloaded' });

    await loginPage.verifyLoggedIn(CREDENTIALS.username);
  });

  test('LOGIN-015: keeps the session when navigating to another page', async ({
    loginPage,
    cartPage,
  }) => {
    await loginPage.login(CREDENTIALS.username, CREDENTIALS.password);
    await cartPage.goto();

    await cartPage.verifyLoggedIn(CREDENTIALS.username);
  });

  test('LOGIN-016: stays stable with over-long input', async ({ loginPage }) => {
    const alert = await loginPage.loginExpectingAlert(LONG_TEXT, LONG_TEXT);

    // The app answers rather than hanging or erroring out.
    expect(alert).toMatch(/Wrong password\.|User does not exist\./);
    await expect(loginPage.loginModal).toBeVisible();
  });

  test('LOGIN-017: handles injection-style input safely', async ({ loginPage, page }) => {
    // Embed the SQL metacharacters in a unique username that cannot already
    // exist. DemoBlaze matches usernames as literal strings, so on this shared
    // public demo a fixed payload such as "' OR 1=1 --" may coincidentally be a
    // registered account; a per-run-unique value keeps the test deterministic
    // while still proving the metacharacters grant no bypass.
    const payload = `' OR 1=1 --${Date.now()}`;
    const alert = await loginPage.loginExpectingAlert(payload, payload);

    // No authentication bypass: the input is treated as an ordinary (unknown)
    // credential and rejected, and no session is established.
    expect(alert).toMatch(/Wrong password\.|User does not exist\./);
    await loginPage.closeLoginModal();
    await expect(page.locator('#nameofuser')).not.toBeVisible();
  });

  test('LOGIN-018: rejects signing up with an existing username', async ({ page }) => {
    const signUpPage = new SignUpPage(page);

    const alert = await signUpPage.signUpExpectingAlert(
      CREDENTIALS.username,
      CREDENTIALS.password,
    );

    expect(alert).toBe('This user already exist.');
  });

  test(
    'LOGIN-019: leaks whether an account exists (user enumeration)',
    { tag: '@known-defect' },
    async ({ loginPage }) => {
      const unknownUser = await loginPage.loginExpectingAlert(
        `ghost-${Date.now()}`,
        INVALID_PASSWORD,
      );
      await loginPage.closeLoginModal();
      const wrongPassword = await loginPage.loginExpectingAlert(
        CREDENTIALS.username,
        INVALID_PASSWORD,
      );

      // DEFECT-003: distinct messages let an attacker enumerate valid usernames.
      // A hardened app would return one generic message for both cases.
      expect(unknownUser).toBe('User does not exist.');
      expect(wrongPassword).toBe('Wrong password.');
      expect(unknownUser).not.toBe(wrongPassword);
    },
  );
});
