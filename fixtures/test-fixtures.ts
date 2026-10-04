import { test as base, expect, request as playwrightRequest } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { DemoBlazeApi } from '../api/DemoBlazeApi';
import { API_BASE_URL, BASE_URL } from '../config/env';
import { withRetry } from '../utils/retry';

export interface IsolatedUser {
  username: string;
  password: string;
}

/**
 * Central fixture set. Specs declare only what they need, which keeps them free
 * of constructor boilerplate and makes adding a page object a one-line change
 * here rather than an edit to every spec.
 */
interface Fixtures {
  homePage: HomePage;
  loginPage: LoginPage;
  productPage: ProductPage;
  cartPage: CartPage;
  api: DemoBlazeApi;
  /**
   * A freshly registered account, unique to this test.
   *
   * DemoBlaze scopes the server-side cart to the *account*, not the browser
   * session, so two tests logged in as the same user share one cart and
   * contaminate each other in parallel. Registering a throwaway account per
   * test restores isolation.
   */
  isolatedUser: IsolatedUser;
  /**
   * Puts the browser in a signed-in state as a throwaway account, by seeding
   * the session cookie from an API login rather than driving the login UI.
   *
   * Two reasons:
   *   1. Isolation. The DemoBlaze cart is stored server-side against the
   *      *account*, so tests sharing a login share one cart. A fresh account
   *      per test is the only way to start from an empty cart.
   *   2. Weight. Driving the login form in all 23 cart tests re-tests login 23
   *      times for no extra coverage, and the extra page loads are enough to
   *      get throttled by this shared demo host. The login UI itself is
   *      covered by the login suite and by E2E-001.
   */
  signedIn: IsolatedUser;
}

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  api: async ({}, use) => {
    const context = await playwrightRequest.newContext({
      baseURL: API_BASE_URL,
      // The demo host is slow under load; generous so setup calls do not fail.
      timeout: 60_000,
    });
    await use(new DemoBlazeApi(context));
    await context.dispose();
  },
  isolatedUser: async ({ api }, use, testInfo) => {
    // Date + worker + retry + random suffix: unique even if two workers start
    // a test within the same millisecond.
    const suffix = Math.random().toString(36).slice(2, 8);
    const unique = `${Date.now()}-w${testInfo.workerIndex}r${testInfo.retry}-${suffix}`;
    const user: IsolatedUser = {
      username: `qa-auto-${unique}`,
      password: 'Passw0rd!2026',
    };

    await withRetry(
      async () => {
        const response = await api.signup(user.username, user.password);
        expect(response.ok(), 'test account signup should succeed').toBeTruthy();
      },
      { label: `signup ${user.username}` },
    );

    await use(user);
  },
  signedIn: async ({ context, api, isolatedUser }, use) => {
    const token = await withRetry(
      () => api.loginToken(isolatedUser.username, isolatedUser.password),
      { label: `login ${isolatedUser.username}` },
    );

    await context.addCookies([
      {
        name: 'tokenp_',
        value: token,
        domain: new URL(BASE_URL).hostname,
        path: '/',
      },
    ]);

    await use(isolatedUser);
  },
});

export { expect };
