import { test, expect } from '../../fixtures/test-fixtures';
import { collectNavigationMetrics, measure } from '../../utils/performance';
import { PERF_BUDGETS } from '../../config/env';
import { PRODUCTS } from '../../data/products';

/**
 * Lightweight performance guardrails.
 *
 * These are regression tripwires, not a load test: they assert that a page or
 * endpoint stays inside a generous budget (configurable via .env) using the
 * browser's own Performance Timeline rather than wall-clock timing around
 * Playwright calls. Metrics are attached to the HTML report for trending.
 */
test.describe('Performance', { tag: ['@perf'] }, () => {
  test('PERF-001: the catalogue loads within budget', async ({
    homePage,
    page,
  }, testInfo) => {
    await homePage.goto();
    await page.waitForLoadState('load');

    const metrics = await collectNavigationMetrics(page);
    await testInfo.attach('home-navigation-metrics.json', {
      body: JSON.stringify(metrics, null, 2),
      contentType: 'application/json',
    });

    expect(metrics.loadMs).toBeLessThan(PERF_BUDGETS.homeLoadMs);
    expect(metrics.domContentLoadedMs).toBeLessThan(PERF_BUDGETS.domContentLoadedMs);
    if (metrics.firstContentfulPaintMs !== null) {
      expect(metrics.firstContentfulPaintMs).toBeLessThan(
        PERF_BUDGETS.firstContentfulPaintMs,
      );
    }
  });

  test('PERF-002: the cart page loads within budget', async ({
    cartPage,
    page,
  }, testInfo) => {
    await cartPage.goto();
    await page.waitForLoadState('load');

    const metrics = await collectNavigationMetrics(page);
    await testInfo.attach('cart-navigation-metrics.json', {
      body: JSON.stringify(metrics, null, 2),
      contentType: 'application/json',
    });

    expect(metrics.loadMs).toBeLessThan(PERF_BUDGETS.homeLoadMs);
  });

  test('PERF-003: the catalogue endpoint responds within budget', async ({
    api,
  }, testInfo) => {
    const [response, durationMs] = await measure(() => api.entries());

    await testInfo.attach('entries-timing.json', {
      body: JSON.stringify({ durationMs, budgetMs: PERF_BUDGETS.apiResponseMs }, null, 2),
      contentType: 'application/json',
    });

    expect(response.status()).toBe(200);
    expect(durationMs).toBeLessThan(PERF_BUDGETS.apiResponseMs);
  });

  test('PERF-004: a product lookup responds within budget', async ({ api }) => {
    const [response, durationMs] = await measure(() =>
      api.viewProduct(PRODUCTS.galaxyS6.id),
    );

    expect(response.status()).toBe(200);
    expect(durationMs).toBeLessThan(PERF_BUDGETS.apiResponseMs);
  });
});
