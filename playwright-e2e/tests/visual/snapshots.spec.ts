import { expect, test } from '../../src/fixtures/test.fixture';

/**
 * Visual regression with Playwright's built-in screenshot assertions.
 * Baselines live beside this file under `*-snapshots/`.
 *
 * Update intentionally:
 *   npx playwright test tests/visual --update-snapshots
 */
test.describe('Visual snapshots', () => {
  test.use({
    // Keep visual baselines stable across machines.
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  test('login page matches baseline @visual', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    });
    try {
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.locator('[data-test="login-button"]')).toBeVisible();

      // Mask dynamic noise if any; Sauce Demo login is mostly static.
      await expect(page).toHaveScreenshot('login-page.png', {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });
    } finally {
      await context.close();
    }
  });

  test('inventory header matches baseline @visual', async ({ authenticatedPage, page }) => {
    void authenticatedPage;
    await expect(page.locator('.header_label')).toBeVisible();

    await expect(page.locator('.header_container')).toHaveScreenshot('inventory-header.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });
});
