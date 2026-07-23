import path from 'path';
import { test, expect } from '@playwright/test';
import { runScoutCrawl } from '../../src/scout/crawler';
import { resolveScoutOptions, resolveViewports } from '../../src/scout/config';
import { writeScoutReport } from '../../src/scout/report';
import type { ScoutRunResult } from '../../src/scout/types';

/**
 * UI Scout — exploratory crawl for testers.
 *
 * Discovers same-origin pages, checks broken links / dead ends, console & network
 * failures, broken images, horizontal overflow, and tiny/unnamed controls.
 * Repeats across mobile / tablet / desktop viewports.
 *
 * Auth comes from the setup project's storageState (same as e2e).
 */
test.describe('UI Scout', () => {
  test.describe.configure({ mode: 'serial' });

  const results: ScoutRunResult[] = [];
  const outputRoot = path.join(process.cwd(), 'scout-report');
  const options = resolveScoutOptions(outputRoot);
  const viewports = resolveViewports();

  for (const viewport of viewports) {
    test(`crawl @ ${viewport.name} (${viewport.width}x${viewport.height}) @scout`, async ({
      page,
      browserName,
    }) => {
      test.setTimeout(180_000);

      const result = await runScoutCrawl(page, viewport, browserName, options);
      results.push(result);

      await test.info().attach(`scout-${viewport.name}.json`, {
        body: Buffer.from(JSON.stringify(result, null, 2)),
        contentType: 'application/json',
      });

      const blockers = result.issues.filter(
        (i) => i.severity === 'critical' || i.severity === 'serious',
      );

      // Soft gate: report everything; fail only on high-severity findings.
      // Demo sites often have minor layout quirks — those stay in the HTML report.
      expect(
        blockers,
        blockers.map((b) => `[${b.severity}] ${b.category}: ${b.message} @ ${b.url}`).join('\n'),
      ).toEqual([]);
    });
  }

  test.afterAll(() => {
    if (results.length === 0) return;
    const { htmlPath, jsonPath } = writeScoutReport(results, outputRoot);
    // eslint-disable-next-line no-console
    console.log(`\nUI Scout report written:\n  ${htmlPath}\n  ${jsonPath}\n`);
  });
});
