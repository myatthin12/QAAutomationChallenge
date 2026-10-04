import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the repo root. Values already present in the real
// environment (e.g. GitHub Actions secrets) are never overwritten.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export const BASE_URL = process.env.BASE_URL || 'https://www.demoblaze.com';

/** Credentials for the pre-registered DemoBlaze challenge account. */
export const CREDENTIALS = {
  username: process.env.DEMOBLAZE_USERNAME || 'ChallengeUser',
  password: process.env.DEMOBLAZE_PASSWORD || 'ChallengeUser',
};

/** A password that is guaranteed not to match the account above. */
export const INVALID_PASSWORD = 'definitely-not-the-password-123';
