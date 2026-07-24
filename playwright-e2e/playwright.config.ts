import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const baseURL = process.env.BASE_URL ?? 'https://www.saucedemo.com';
const authFile = path.join(__dirname, '.auth/user.json');
const isCI = !!process.env.CI;

const desktopIgnore = [
  /.*\.setup\.ts/,
  /auth\/login\.spec\.ts/,
  /api\/.*/,
  /network\/.*/,
  /advanced\/clock\.spec\.ts/,
];

/**
 * Project topology (expert pattern):
 * 1) setup             → login once, write storageState
 * 2) chromium/firefox/webkit → authenticated e2e
 * 3) mobile-chrome     → Pixel 5 device emulation
 * 4) unauthenticated   → login negatives + network + clock demos
 * 5) api               → Playwright request context only
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    [
      'allure-playwright',
      {
        detail: true,
        outputFolder: 'allure-results',
        suiteTitle: true,
      },
    ],
    ...(isCI ? [['github'] as const] : []),
  ],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  use: {
    baseURL,
    // Sauce Demo (and many apps) use data-test instead of data-testid.
    testIdAttribute: 'data-test',
    // retain-on-failure keeps a trace for every failed attempt (great for demos/CI).
    trace: 'retain-on-failure',
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
      testIgnore: desktopIgnore,
    },
    {
      name: 'firefox',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: authFile,
      },
      // Skip visual on non-Chromium to avoid cross-engine baseline churn.
      testIgnore: [...desktopIgnore, /visual\/.*/],
    },
    {
      name: 'webkit',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Safari'],
        storageState: authFile,
      },
      testIgnore: [...desktopIgnore, /visual\/.*/],
    },
    {
      name: 'mobile-chrome',
      dependencies: ['setup'],
      use: {
        ...devices['Pixel 5'],
        storageState: authFile,
      },
      testMatch: /inventory\/.*\.spec\.ts|advanced\/soft-assertions\.spec\.ts/,
    },
    {
      name: 'unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /auth\/login\.spec\.ts|network\/.*|advanced\/clock\.spec\.ts/,
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
