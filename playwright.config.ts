import { defineConfig, devices } from '@playwright/test';
import { API_BASE_URL, BASE_URL } from './config/env';

/**
 * Test-type layout
 * ----------------
 * tests/ui    UI / regression, runs the full suite on Chromium and the
 *             @smoke subset on the other browsers and mobile viewports
 * tests/api   contract and negative checks straight against the REST API
 * tests/perf  page-load and endpoint latency budgets
 *
 * Shaping cross-browser coverage this way keeps the signal (every browser
 * exercises the critical paths) without multiplying the whole suite by five
 * against a shared public demo app.
 *
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  /* Fail the build on CI if a test.only was left in the source. */
  forbidOnly: !!process.env.CI,
  /* DemoBlaze is a shared public demo app, so allow a retry everywhere. */
  retries: process.env.CI ? 2 : 1,
  /*
   * Deliberately serial. DemoBlaze throttles bursts of traffic: running this
   * suite with parallel workers produced ERR_CONNECTION_CLOSED and TLS socket
   * disconnects that look like test failures but are the host shedding load.
   * One worker keeps the request rate civil and the results trustworthy.
   * In CI each browser project is its own runner, so wall-clock stays sane.
   */
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  /* The public demo app is slow under load; give actions room to settle. */
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: BASE_URL,
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    /* ---------- API: no browser needed, so it runs first and fastest ---------- */
    {
      name: 'api',
      testDir: './tests/api',
      // The demo API is occasionally slow; a longer action timeout here keeps
      // genuine contract failures distinguishable from transient latency.
      use: { baseURL: API_BASE_URL, actionTimeout: 30_000 },
    },

    /* ---------- UI: full regression on Chromium ---------- */
    {
      name: 'ui-chromium',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'] },
    },

    /* ---------- UI: critical paths on the other engines ---------- */
    {
      name: 'ui-firefox',
      testDir: './tests/ui',
      grep: /@smoke/,
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
      name: 'ui-webkit',
      testDir: './tests/ui',
      grep: /@smoke/,
      use: { ...devices['Desktop Safari'] },
    },

    /* ---------- UI: critical paths on mobile viewports ---------- */
    {
      name: 'ui-mobile-chrome',
      testDir: './tests/ui',
      grep: /@smoke/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'ui-mobile-safari',
      testDir: './tests/ui',
      grep: /@smoke/,
      use: { ...devices['iPhone 14'] },
    },

    /* ---------- Performance: single engine, budgets from .env ---------- */
    {
      name: 'perf',
      testDir: './tests/perf',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
