import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './config/env';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* DemoBlaze is a shared public demo app, so allow a retry everywhere. */
  retries: process.env.CI ? 2 : 1,
  /* DemoBlaze throttles concurrent traffic, so keep the worker count low. */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['html', { open: 'never' }]],
  /* The public demo app is slow under load; give actions room to settle. */
  timeout: 90_000,
  expect: { timeout: 15_000 },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL so specs can call page.goto('/'). */
    baseURL: BASE_URL,
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          // Firefox honours the OS-level proxy settings, which makes local runs
          // fail with NS_ERROR_PROXY_CONNECTION_REFUSED on machines that have a
          // stale system proxy configured. Set IGNORE_SYSTEM_PROXY=1 to opt out.
          firefoxUserPrefs: process.env.IGNORE_SYSTEM_PROXY
            ? { 'network.proxy.type': 0 }
            : {},
        },
      },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
