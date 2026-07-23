import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../../src/fixtures/test.fixture';

function formatViolations(
  violations: { id: string; impact?: string | null; help: string; nodes: { html: string }[] }[],
): string {
  return violations
    .map((v) => `[${v.impact ?? 'unknown'}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`)
    .join('\n');
}

test.describe('Accessibility', () => {
  test('inventory has no critical axe violations @a11y', async ({ authenticatedPage, page }) => {
    void authenticatedPage;

    // Full scan attached for transparency (Sauce Demo has known select-name debt).
    const fullResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    await test.info().attach('axe-inventory-full.json', {
      body: Buffer.from(JSON.stringify(fullResults, null, 2)),
      contentType: 'application/json',
    });

    // Gate on regressions beyond the known practice-site defect:
    // sort <select> missing an accessible name.
    const results = await new AxeBuilder({ page })
      .exclude('[data-test="product-sort-container"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    await test.info().attach('axe-inventory-gated.json', {
      body: Buffer.from(JSON.stringify(results, null, 2)),
      contentType: 'application/json',
    });

    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical, formatViolations(critical)).toEqual([]);
  });

  test('login page has no critical axe violations @a11y', async ({ browser }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      await test.info().attach('axe-login.json', {
        body: Buffer.from(JSON.stringify(results, null, 2)),
        contentType: 'application/json',
      });

      const critical = results.violations.filter((v) => v.impact === 'critical');
      expect(critical, formatViolations(critical)).toEqual([]);
    } finally {
      await context.close();
    }
  });
});
