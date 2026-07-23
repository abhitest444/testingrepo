import fs from 'fs';
import path from 'path';
import type { Page } from '@playwright/test';
import {
  attachIssueCollectors,
  collectorsToIssues,
  extractSameOriginLinks,
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
  // Use page.request so auth cookies from storageState are included.
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

/**
 * Breadth-first same-origin crawl with UI / link / console checks per page.
 */
export async function runScoutCrawl(
  page: Page,
  viewport: ViewportProfile,
  browserName: string,
  options: ScoutRunOptions,
): Promise<ScoutRunResult> {
  const startedAt = new Date().toISOString();

  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(options.startPath, { waitUntil: 'domcontentloaded' });
  const origin = new URL(page.url()).origin;

  const queue: string[] = [normalizeUrl(page.url())];
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

    if (status !== null && status >= 400) {
      pageIssues.push({
        category: 'dead-end',
        severity: status >= 500 ? 'critical' : 'serious',
        message: `Page returned HTTP ${status}`,
        url: current,
      });
    }

    pageIssues.push(...collectorsToIssues(current, collectors));
    pageIssues.push(...(await scanDomForUiIssues(page)));

    const links = await extractSameOriginLinks(page, origin);

    for (const link of links) {
      if (isExcluded(link.href, options.excludePathPatterns)) continue;

      let linkStatus = linkStatusCache.get(link.href);
      if (linkStatus === undefined) {
        linkStatus = await probeLinkStatus(page, link.href);
        linkStatusCache.set(link.href, linkStatus);
      }

      if (linkStatus === null || linkStatus >= 400) {
        pageIssues.push({
          category: 'broken-link',
          severity: linkStatus !== null && linkStatus >= 500 ? 'critical' : 'serious',
          message: linkStatus === null ? 'Link request failed' : `Broken link (HTTP ${linkStatus})`,
          url: current,
          details: `${link.text || '(no text)'} → ${link.href}`,
        });
      }

      const normalized = normalizeUrl(link.href);
      if (
        !visited.has(normalized) &&
        !queue.includes(normalized) &&
        !isExcluded(normalized, options.excludePathPatterns) &&
        normalized.startsWith(origin)
      ) {
        queue.push(normalized);
      }
    }

    const internalLinks = links.filter((l) => l.href.startsWith(origin)).length;
    // Terminal checkout confirmation is an intentional dead end; skip soft signal there.
    if (internalLinks === 0 && !/checkout-complete/.test(current)) {
      pageIssues.push({
        category: 'dead-end',
        severity: 'minor',
        message: 'No same-origin links found on page',
        url: current,
        details: 'May be intentional (terminal page) or a navigation gap',
      });
    }

    let screenshotPath: string | undefined;
    if (options.captureScreenshots) {
      const safeName =
        current
          .replace(origin, '')
          .replace(/[^\w.-]+/g, '_')
          .replace(/^_+|_+$/g, '') || 'root';
      screenshotPath = path.join(options.screenshotDir, `${viewport.name}_${safeName}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    pagesVisited.push({
      url: current,
      title: await page.title(),
      status,
      outboundLinks: links.length,
      internalLinks,
      issues: pageIssues,
      screenshotPath,
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
