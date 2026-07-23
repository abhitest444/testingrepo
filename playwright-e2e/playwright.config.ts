import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const baseURL = process.env.BASE_URL ?? 'https://www.saucedemo.com';
const authFile = path.join(__dirname, '.auth/user.json');

/**
 * Project topology (expert pattern):
 * 1) setup        → login once, write storageState
 * 2) e2e browsers → reuse session (fast, stable)
 * 3) unauthenticated → login/negative cases (no stored session)
 * 4) api          → Playwright request context only
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\/auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      testIgnore: [
        /.*\.setup\.ts/,
        /auth\/login\.spec\.ts/,
        /api\/.*/,
        /network\/.*/,
        /scout\/.*/,
      ],
    },
    {
      name: 'firefox',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: authFile,
      },
      testIgnore: [
        /.*\.setup\.ts/,
        /auth\/login\.spec\.ts/,
        /api\/.*/,
        /network\/.*/,
        /scout\/.*/,
      ],
    },
    {
      name: 'webkit',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Safari'],
        storageState: authFile,
      },
      testIgnore: [
        /.*\.setup\.ts/,
        /auth\/login\.spec\.ts/,
        /api\/.*/,
        /network\/.*/,
        /scout\/.*/,
      ],
    },
    {
      name: 'unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /auth\/login\.spec\.ts|network\/.*/,
    },
    {
      name: 'api',
      testMatch: /api\/.*/,
      use: {
        baseURL: process.env.API_BASE_URL ?? 'https://restful-booker.herokuapp.com',
        extraHTTPHeaders: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },
  ],
});
