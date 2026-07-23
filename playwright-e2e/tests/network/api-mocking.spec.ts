import { expect, test } from '@playwright/test';

/**
 * Network mocking against Playwright's public api-mocking demo.
 * Shows route.fulfill for deterministic UI tests when backends are slow/unstable.
 */
test.describe('Network mocking', () => {
  test('UI renders mocked fruit list @smoke', async ({ page }) => {
    await page.route('*/**/api/v1/fruits', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { name: 'QA Melon', id: 1 },
          { name: 'Assert Berry', id: 2 },
        ]),
      });
    });

    await page.goto('https://demo.playwright.dev/api-mocking');

    await expect(page.getByText('QA Melon')).toBeVisible();
    await expect(page.getByText('Assert Berry')).toBeVisible();
  });

  test('UI handles mocked API failure', async ({ page }) => {
    await page.route('*/**/api/v1/fruits', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'upstream unavailable' }),
      });
    });

    await page.goto('https://demo.playwright.dev/api-mocking');

    // Demo app shows an empty list / no fruit rows on failed fetch
    await expect(page.getByText('QA Melon')).toHaveCount(0);
    await expect(page.getByRole('listitem')).toHaveCount(0);
  });

  test('can observe and passthrough a real request', async ({ page }) => {
    let seenMethod: string | undefined;

    await page.route('*/**/api/v1/fruits', async (route) => {
      seenMethod = route.request().method();
      await route.continue();
    });

    await page.goto('https://demo.playwright.dev/api-mocking');
    await expect(page.getByRole('listitem').first()).toBeVisible();
    expect(seenMethod).toBe('GET');
  });
});
