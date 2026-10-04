import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the repo root. Values already present in the real
// environment (e.g. GitHub Actions secrets) are never overwritten.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** The web application under test. */
export const BASE_URL = process.env.BASE_URL || 'https://www.demoblaze.com';

/** The REST API behind the application, exercised directly by the API suite. */
export const API_BASE_URL = process.env.API_BASE_URL || 'https://api.demoblaze.com';

/** Credentials for the pre-registered DemoBlaze challenge account. */
export const CREDENTIALS = {
  username: process.env.DEMOBLAZE_USERNAME || 'ChallengeUser',
  password: process.env.DEMOBLAZE_PASSWORD || 'ChallengeUser',
};

/** A password that is guaranteed not to match the account above. */
export const INVALID_PASSWORD = 'definitely-not-the-password-123';

/**
 * Performance budgets in milliseconds. Deliberately generous: DemoBlaze is a
 * shared public demo app, so these are regression tripwires rather than
 * precise SLAs. Override per environment via .env.
 */
export const PERF_BUDGETS = {
  homeLoadMs: num(process.env.PERF_HOME_LOAD_MS, 10_000),
  firstContentfulPaintMs: num(process.env.PERF_FCP_MS, 6_000),
  domContentLoadedMs: num(process.env.PERF_DCL_MS, 8_000),
  apiResponseMs: num(process.env.PERF_API_MS, 3_000),
};
