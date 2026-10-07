import { defineConfig, devices } from '@playwright/test';
import { getCamrBaseUrl } from './config';

export default defineConfig({
  testDir: '.',
  testMatch: 'test.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'reports/html' }]],
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: getCamrBaseUrl(),
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
