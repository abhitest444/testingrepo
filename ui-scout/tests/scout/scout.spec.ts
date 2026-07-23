import path from 'path';
import { test, expect } from '@playwright/test';
import { runScoutCrawl } from '../../src/scout/crawler';
import { resolveScoutOptions, resolveViewports } from '../../src/scout/config';
import { readScoutResultShards, resetScoutArtifacts, writeScoutReport, writeScoutResultShard } from '../../src/scout/report';
import type { ScoutRunResult } from '../../src/scout/types';

/**
 * UI Scout — exploratory crawl for testers.
 *
 * Discovers pages, checks links/UI heuristics, runs axe per page, and compares
 * screenshots to baselines across mobile / tablet / desktop.
 */
test.describe('UI Scout', () => {
  test.describe.configure({ mode: 'serial' });

  const results: ScoutRunResult[] = [];
  resetScoutArtifacts(path.join(process.cwd(), 'scout-report'));
  const suiteStartedAt = new Date().toISOString();
  const outputRoot = path.join(process.cwd(), 'scout-report');
  const options = resolveScoutOptions(outputRoot);
  const viewports = resolveViewports();
  const a11yStrict = ['1', 'true', 'yes', 'on'].includes(
    (process.env.SCOUT_A11Y_STRICT ?? '').toLowerCase(),
  );

  for (const viewport of viewports) {
    test.describe(viewport.name, () => {
      test.use({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: Boolean(viewport.isMobile),
        hasTouch: Boolean(viewport.isMobile),
      });

      test(`crawl @ ${viewport.name} (${viewport.width}x${viewport.height}) @scout`, async ({
        page,
        browserName,
      }) => {
        test.setTimeout(240_000);

        const result = await runScoutCrawl(page, viewport, browserName, options);
        results.push(result);
        writeScoutResultShard(result, outputRoot);

        await test.info().attach(`scout-${browserName}-${viewport.name}.json`, {
          body: Buffer.from(JSON.stringify(result, null, 2)),
          contentType: 'application/json',
        });

        const blockers = result.issues.filter((i) => {
          if (i.category === 'a11y' && !a11yStrict) return false;
          return i.severity === 'critical' || i.severity === 'serious';
        });

        expect(
          blockers,
          blockers.map((b) => `[${b.severity}] ${b.category}: ${b.message} @ ${b.url}`).join('\n'),
        ).toEqual([]);
      });
    });
  }

  test.afterAll(() => {
    const mergedResults = readScoutResultShards(outputRoot, suiteStartedAt);
    const reportResults = mergedResults.length > 0 ? mergedResults : results;
    if (reportResults.length === 0) return;
    const { htmlPath, jsonPath } = writeScoutReport(reportResults, outputRoot);
    // eslint-disable-next-line no-console
    console.log(`\nUI Scout report written:\n  ${htmlPath}\n  ${jsonPath}\n`);
  });
});
