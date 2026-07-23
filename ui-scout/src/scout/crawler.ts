import fs from 'fs';
import path from 'path';
import type { Page } from '@playwright/test';
import {
  attachIssueCollectors,
  collectorsToIssues,
  discoverClickNavigations,
  extractLinks,
  pageLooksRendered,
  scanDomForUiIssues,
} from './checks';
import type { ScoutIssue, ScoutRunOptions, ScoutRunResult, ViewportProfile, VisitedPage } from './types';

function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = '';
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }
  return parsed.href;
}

function isExcluded(url: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(url));
}

function buildSummary(pages: VisitedPage[]): ScoutRunResult['summary'] {
  const summary: ScoutRunResult['summary'] = {
    pages: pages.length,
    issues: 0,
    bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    byCategory: {},
  };

  for (const page of pages) {
    for (const issue of page.issues) {
      summary.issues += 1;
      summary.bySeverity[issue.severity] += 1;
      summary.byCategory[issue.category] = (summary.byCategory[issue.category] ?? 0) + 1;
    }
  }
  return summary;
}

async function probeLinkStatus(page: Page, href: string): Promise<number | null> {
  try {
    const head = await page.request.fetch(href, { method: 'HEAD', maxRedirects: 5 });
    if (head.status() !== 405 && head.status() !== 501) {
      return head.status();
    }
  } catch {
    // Fall through to GET.
  }

  try {
    const get = await page.request.get(href, { maxRedirects: 5 });
    return get.status();
  } catch {
    return null;
  }
}

function enqueue(queue: string[], visited: Set<string>, url: string, patterns: RegExp[]): void {
  const normalized = normalizeUrl(url);
  if (visited.has(normalized) || queue.includes(normalized) || isExcluded(normalized, patterns)) {
    return;
  }
  queue.push(normalized);
}

/**
 * Breadth-first crawl with SPA-aware discovery (seed paths + click probes for href="#").
 */
export async function runScoutCrawl(
  page: Page,
  viewport: ViewportProfile,
  browserName: string,
  options: ScoutRunOptions,
): Promise<ScoutRunResult> {
  const startedAt = new Date().toISOString();

  await page.setViewportSize({ width: viewport.width, height: viewport.height });

  let lastNavError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(options.startPath, { waitUntil: 'domcontentloaded' });
      lastNavError = undefined;
      break;
    } catch (err) {
      lastNavError = err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  if (lastNavError) throw lastNavError;

  const origin = new URL(page.url()).origin;

  const queue: string[] = [];
  enqueue(queue, new Set(), page.url(), options.excludePathPatterns);
  for (const seed of options.seedPaths) {
    enqueue(queue, new Set(), new URL(seed, origin).href, options.excludePathPatterns);
  }

  const visited = new Set<string>();
  const pagesVisited: VisitedPage[] = [];
  const linkStatusCache = new Map<string, number | null>();
  const collectors = attachIssueCollectors(page);

  if (options.captureScreenshots) {
    fs.mkdirSync(options.screenshotDir, { recursive: true });
  }

  while (queue.length > 0 && pagesVisited.length < options.maxPages) {
    const current = queue.shift()!;
    if (visited.has(current) || isExcluded(current, options.excludePathPatterns)) continue;
    visited.add(current);

    collectors.reset();

    let status: number | null = null;
    try {
      const response = await page.goto(current, { waitUntil: 'domcontentloaded' });
      status = response?.status() ?? null;
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pagesVisited.push({
        url: current,
        title: '',
        status,
        outboundLinks: 0,
        internalLinks: 0,
        issues: [
          {
            category: 'dead-end',
            severity: 'critical',
            message: 'Navigation failed (dead end / unreachable page)',
            url: current,
            details: message.slice(0, 500),
          },
        ],
      });
      continue;
    }

    const pageIssues: ScoutIssue[] = [];
    const rendered = await pageLooksRendered(page);

    if (status !== null && status >= 400) {
      if (rendered) {
        // GitHub Pages / SPA hosts often 404 deep links while still booting the app.
        pageIssues.push({
          category: 'dead-end',
          severity: 'minor',
          message: `Host returned HTTP ${status} but page still rendered (SPA soft-404)`,
          url: current,
          details: 'Common on static hosts; not treated as a hard dead end',
        });
      } else {
        pageIssues.push({
          category: 'dead-end',
          severity: status >= 500 ? 'critical' : 'serious',
          message: `Page returned HTTP ${status}`,
          url: current,
        });
      }
    }

    // Drop document self-404 noise from console/network when SPA still rendered.
    const rawCollectorIssues = collectorsToIssues(current, collectors);
    for (const issue of rawCollectorIssues) {
      const isDocSoft404 =
        rendered &&
        status !== null &&
        status >= 400 &&
        (issue.category === 'console-error' || issue.category === 'network-failure') &&
        (issue.details?.includes(current) || issue.details?.includes('status of 404'));
      if (isDocSoft404) continue;
      pageIssues.push(issue);
    }

    pageIssues.push(...(await scanDomForUiIssues(page)));

    if (options.runA11y && rendered) {
      const { scanPageAccessibility } = await import('./a11y');
      pageIssues.push(...(await scanPageAccessibility(page)));
    }

    const links = await extractLinks(page, origin);
    const urlLinks = links.filter((l) => l.kind === 'url');
    const internalUrlLinks = urlLinks.filter((l) => l.href.startsWith(origin));

    for (const link of urlLinks) {
      if (isExcluded(link.href, options.excludePathPatterns)) continue;
      if (options.sameOriginOnly && !link.href.startsWith(origin)) {
        // Still probe external links for broken status — useful for footer socials etc.
      }

      let linkStatus = linkStatusCache.get(link.href);
      if (linkStatus === undefined) {
        linkStatus = await probeLinkStatus(page, link.href);
        linkStatusCache.set(link.href, linkStatus);
      }

      // Same-origin HTML routes on SPA hosts often HEAD/GET as 404 while usable in-browser.
      // Only hard-fail external broken links, or same-origin when probe fails entirely.
      const isExternal = !link.href.startsWith(origin);
      if (linkStatus === null) {
        pageIssues.push({
          category: 'broken-link',
          severity: isExternal ? 'moderate' : 'serious',
          message: isExternal
            ? 'External link probe failed (blocked, timeout, or offline)'
            : 'Link request failed',
          url: current,
          details: `${link.text || '(no text)'} → ${link.href}`,
        });
      } else if (linkStatus >= 400 && isExternal) {
        pageIssues.push({
          category: 'broken-link',
          // Social / CDN endpoints often block automated HEAD/GET — keep as review signal.
          severity: linkStatus === 404 || linkStatus === 410 ? 'serious' : 'moderate',
          message: `Broken or blocked external link (HTTP ${linkStatus})`,
          url: current,
          details: `${link.text || '(no text)'} → ${link.href}`,
        });
      } else if (linkStatus >= 400 && !isExternal) {
        pageIssues.push({
          category: 'broken-link',
          severity: 'minor',
          message: `Same-origin link probe HTTP ${linkStatus} (may be SPA soft-404)`,
          url: current,
          details: `${link.text || '(no text)'} → ${link.href}`,
        });
      }

      if (link.href.startsWith(origin)) {
        enqueue(queue, visited, link.href, options.excludePathPatterns);
      }
    }

    // SPA discovery: click href="#" controls and enqueue resulting routes.
    const clickedUrls = await discoverClickNavigations(
      page,
      options.excludePathPatterns,
      options.maxClickProbes,
    );
    for (const clicked of clickedUrls) {
      if (clicked.startsWith(origin)) {
        enqueue(queue, visited, clicked, options.excludePathPatterns);
      }
    }

    const discoveredInternal = new Set([
      ...internalUrlLinks.map((l) => l.href),
      ...clickedUrls.filter((u) => u.startsWith(origin)),
    ]);

    if (discoveredInternal.size === 0 && !/checkout-complete/.test(current) && rendered) {
      pageIssues.push({
        category: 'dead-end',
        severity: 'minor',
        message: 'No same-origin navigations discovered on page',
        url: current,
        details: 'May be intentional (terminal page) or a navigation gap',
      });
    }

    let screenshotPath: string | undefined;
    let baselinePath: string | undefined;
    let diffPath: string | undefined;
    if (options.captureScreenshots) {
      const { compareScreenshotToBaseline, screenshotBasename } = await import('./visual');
      const runName = `${browserName}_${viewport.name}`;
      const basename = screenshotBasename(runName, current, origin);
      screenshotPath = path.join(options.screenshotDir, basename);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      if (options.runVisual) {
        const visual = compareScreenshotToBaseline(current, screenshotPath, basename, {
          baselineDir: options.baselineDir,
          diffDir: options.diffDir,
          threshold: options.visualThreshold,
          updateBaselines: options.updateBaselines,
        });
        baselinePath = visual.baselinePath;
        diffPath = visual.diffPath;
        pageIssues.push(...visual.issues);
      }
    }

    pagesVisited.push({
      url: current,
      title: await page.title(),
      status,
      outboundLinks: links.length + clickedUrls.length,
      internalLinks: discoveredInternal.size,
      issues: pageIssues,
      screenshotPath,
      baselinePath,
      diffPath,
    });
  }

  const finishedAt = new Date().toISOString();
  return {
    startedAt,
    finishedAt,
    baseURL: origin,
    browserName,
    viewport,
    pagesVisited,
    issues: pagesVisited.flatMap((p) => p.issues),
    summary: buildSummary(pagesVisited),
  };
}
