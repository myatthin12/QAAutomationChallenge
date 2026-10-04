import { Page } from '@playwright/test';

export interface NavigationMetrics {
  /** Time to the browser `load` event. */
  loadMs: number;
  domContentLoadedMs: number;
  /** First Contentful Paint, or null when the browser does not report it. */
  firstContentfulPaintMs: number | null;
  transferredBytes: number;
}

/**
 * Reads navigation metrics from the Performance Timeline of the current page.
 *
 * Uses the browser's own instrumentation rather than wall-clock timing around
 * page.goto(), so the numbers exclude Playwright's own overhead. Firefox and
 * WebKit do not report paint timings, hence the nullable FCP.
 */
export async function collectNavigationMetrics(page: Page): Promise<NavigationMetrics> {
  return page.evaluate(() => {
    const [navigation] = performance.getEntriesByType(
      'navigation',
    ) as PerformanceNavigationTiming[];
    const fcp = performance
      .getEntriesByType('paint')
      .find((entry) => entry.name === 'first-contentful-paint');

    return {
      loadMs: navigation ? navigation.loadEventEnd - navigation.startTime : 0,
      domContentLoadedMs: navigation
        ? navigation.domContentLoadedEventEnd - navigation.startTime
        : 0,
      firstContentfulPaintMs: fcp ? fcp.startTime : null,
      transferredBytes: navigation ? navigation.transferSize : 0,
    };
  });
}

/** Times an async operation in milliseconds. */
export async function measure<T>(operation: () => Promise<T>): Promise<[T, number]> {
  const started = Date.now();
  const result = await operation();
  return [result, Date.now() - started];
}
