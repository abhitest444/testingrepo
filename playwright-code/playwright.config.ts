// eslint-disable-next-line import/no-extraneous-dependencies
import {devices, PlaywrightTestConfig} from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './test/automation/playwright',
  /* Maximum time one test can run for. */
  timeout: 60 * 60 * 1000, // 60 minutes for both CI and local
  expect: {
    timeout: 3 * 60 * 1000, // 3 minutes for both CI and local
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    // Registered FIRST so its attachment is rendered by the html reporter below.
    ['./test/automation/playwright/reporters/autoHealReporter.ts'],
    ['html', {outputFolder: 'reports/playwright'}],
    ['junit', { outputFile: 'reports/playwright/junit-report.xml' }], // Generates JUnit XML
    ['list'], // Add list reporter for better console output
    ['json', {outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT?.trim() || 'reports/playwright/playwright-report.json' }] // Added for jira auto create
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 300000, // 5 minutes for both CI and local
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    viewport: {
      width: 1000,
      height: 800,
    },
    defaultBrowserType: 'chromium',
    screenshot: 'on',
    video: 'on',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        baseURL: 'https://app.e2e.qbo.intuit.com',
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'safari',
      use: {
        baseURL: 'https://app.e2e.qbo.intuit.com',
        ...devices['Desktop Safari'],
      },
    },
    {
      name: 'chromium-prod',
      use: {
        baseURL: 'https://app.qbo.intuit.com',
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox-prod',
      use: {
        baseURL: 'https://app.qbo.intuit.com',
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'Microsoft Edge-prod',
      use: {
        baseURL: 'https://app.qbo.intuit.com',
        ...devices['Desktop Edge'],
      },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'reports/results-playwright',
};

export default config;
