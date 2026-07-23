import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import base from './playwright.config';

const authFile = path.join(__dirname, '.auth/user.json');

/**
 * Opt-in UI Scout config — keeps exploratory crawls out of default `npm test`.
 *
 * Auth is handled by `tests/auth/scout.auth.setup.ts` (none | form | sauce).
 *
 *   BASE_URL=https://example.com SCOUT_AUTH=none SCOUT_START_PATH=/ npm run scout
 *   npm run scout:browsers
 */
export default defineConfig({
  ...base,
  timeout: 180_000,
  projects: [
    {
      name: 'setup',
      testMatch: /scout\.auth\.setup\.ts/,
    },
    {
      name: 'scout',
      dependencies: ['setup'],
      testMatch: /scout\/.*/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
    },
    {
      name: 'scout-firefox',
      dependencies: ['setup'],
      testMatch: /scout\/.*/,
      use: {
        ...devices['Desktop Firefox'],
        storageState: authFile,
      },
    },
    {
      name: 'scout-webkit',
      dependencies: ['setup'],
      testMatch: /scout\/.*/,
      use: {
        ...devices['Desktop Safari'],
        storageState: authFile,
      },
    },
  ],
});
