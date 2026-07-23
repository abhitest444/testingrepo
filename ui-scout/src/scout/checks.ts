import type { Page, Request, ConsoleMessage } from '@playwright/test';
import type { ScoutIssue } from './types';

export type IssueCollectors = {
  consoleErrors: string[];
  networkFailures: { url: string; status: number; method: string }[];
  pageErrors: string[];
  reset: () => void;
};

/**
 * Attach listeners once per crawl. Call `reset()` between page visits.
 */
export function attachIssueCollectors(page: Page): IssueCollectors {
  const collectors: IssueCollectors = {
    consoleErrors: [],
    networkFailures: [],
    pageErrors: [],
    reset() {
      this.consoleErrors = [];
      this.networkFailures = [];
      this.pageErrors = [];
    },
  };

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      collectors.consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err: Error) => {
    collectors.pageErrors.push(err.message);
  });

  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      const request: Request = response.request();
      const resourceType = request.resourceType();
      // Focus on assets that usually mean a broken UX, not every analytics 404.
      if (['document', 'stylesheet', 'script', 'image', 'font'].includes(resourceType)) {
        collectors.networkFailures.push({
          url: response.url(),
          status,
          method: request.method(),
        });
      }
    }
  });

  return collectors;
}

export function collectorsToIssues(pageUrl: string, collectors: IssueCollectors): ScoutIssue[] {
  const issues: ScoutIssue[] = [];

  for (const text of collectors.consoleErrors) {
    issues.push({
      category: 'console-error',
      severity: 'serious',
      message: 'Browser console error',
      url: pageUrl,
      details: text.slice(0, 500),
    });
  }

  for (const err of collectors.pageErrors) {
    issues.push({
      category: 'page-error',
      severity: 'critical',
      message: 'Uncaught page exception',
      url: pageUrl,
      details: err.slice(0, 500),
    });
  }

  for (const failure of collectors.networkFailures) {
    issues.push({
      category: 'network-failure',
      severity: failure.status >= 500 ? 'critical' : 'serious',
      message: `Failed ${failure.method} ${failure.status}`,
      url: pageUrl,
      details: failure.url,
    });
  }

  return issues;
}

type DomFindings = {
  brokenImages: { src: string; alt: string }[];
  overflow: boolean;
  scrollWidth: number;
  clientWidth: number;
  tinyClickables: { tag: string; text: string; width: number; height: number }[];
  emptyButtons: { tag: string; testId: string | null }[];
};

/**
 * In-page heuristics for common UI defects a manual tester would flag.
 */
export async function scanDomForUiIssues(page: Page): Promise<ScoutIssue[]> {
  const findings = await page.evaluate((): DomFindings => {
    const brokenImages = Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => ({
        src: img.currentSrc || img.src,
        alt: img.alt || '',
      }));

    const docEl = document.documentElement;
    const scrollWidth = docEl.scrollWidth;
    const clientWidth = docEl.clientWidth;
    const overflow = scrollWidth > clientWidth + 2;

    const tinyClickables: DomFindings['tinyClickables'] = [];
    const emptyButtons: DomFindings['emptyButtons'] = [];

    const clickables = document.querySelectorAll(
      'a, button, [role="button"], input[type="submit"], input[type="button"]',
    );

    for (const el of Array.from(clickables)) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;

      const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
      const testId = el.getAttribute('data-test') || el.getAttribute('data-testid');

      if (rect.width > 0 && rect.height > 0 && (rect.width < 8 || rect.height < 8)) {
        tinyClickables.push({
          tag: el.tagName.toLowerCase(),
          text,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }

      if (
        (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') &&
        !text &&
        !(el as HTMLInputElement).value &&
        !el.getAttribute('aria-label') &&
        !el.querySelector('img, svg')
      ) {
        emptyButtons.push({ tag: el.tagName.toLowerCase(), testId });
      }
    }

    return {
      brokenImages: brokenImages.slice(0, 20),
      overflow,
      scrollWidth,
      clientWidth,
      tinyClickables: tinyClickables.slice(0, 20),
      emptyButtons: emptyButtons.slice(0, 20),
    };
  });

  const issues: ScoutIssue[] = [];
  const pageUrl = page.url();

  for (const img of findings.brokenImages) {
    issues.push({
      category: 'broken-image',
      severity: 'serious',
      message: 'Broken or empty image',
      url: pageUrl,
      details: img.src,
      selector: img.alt ? `img[alt="${img.alt}"]` : undefined,
    });
  }

  if (findings.overflow) {
    issues.push({
      category: 'layout',
      severity: 'moderate',
      message: 'Horizontal page overflow (content wider than viewport)',
      url: pageUrl,
      details: `scrollWidth=${findings.scrollWidth}, clientWidth=${findings.clientWidth}`,
    });
  }

  for (const el of findings.tinyClickables) {
    issues.push({
      category: 'interactive',
      severity: 'moderate',
      message: 'Interactive control is unusually small',
      url: pageUrl,
      details: `<${el.tag}> "${el.text}" ${el.width}x${el.height}px`,
    });
  }

  for (const el of findings.emptyButtons) {
    issues.push({
      category: 'interactive',
      severity: 'minor',
      message: 'Button has no visible or accessible name',
      url: pageUrl,
      details: el.testId ? `data-test=${el.testId}` : `<${el.tag}>`,
      selector: el.testId ? `[data-test="${el.testId}"]` : undefined,
    });
  }

  return issues;
}

export async function pageLooksRendered(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const text = (document.body?.innerText || '').trim();
    if (text.length < 20) return false;
    const hasAppChrome = Boolean(
      document.querySelector('[data-test], [data-testid], #root, #app, main, nav, header'),
    );
    return hasAppChrome || text.length > 80;
  });
}

export type DiscoveredLink = {
  href: string;
  text: string;
  kind: 'url' | 'hash';
};

/**
 * Collect anchors. Real URLs are crawl/probe candidates; hash links need click discovery.
 */
export async function extractLinks(page: Page, baseOrigin: string): Promise<DiscoveredLink[]> {
  return page.evaluate((origin) => {
    const results: { href: string; text: string; kind: 'url' | 'hash' }[] = [];
    const seen = new Set<string>();

    for (const anchor of Array.from(document.querySelectorAll('a[href]'))) {
      const raw = (anchor.getAttribute('href') || '').trim();
      const text = (anchor.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
      if (!raw || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) {
        continue;
      }

      if (raw === '#' || (raw.startsWith('#') && !raw.startsWith('#/'))) {
        const key = `hash:${text || raw}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({ href: raw, text, kind: 'hash' });
        continue;
      }

      let absolute: string;
      try {
        absolute = new URL(raw, window.location.href).href;
      } catch {
        continue;
      }

      if (!absolute.startsWith(origin)) {
        // Still record external http(s) links for broken-link probing.
        if (/^https?:/i.test(absolute)) {
          const key = absolute.split('#')[0];
          if (!seen.has(key)) {
            seen.add(key);
            results.push({ href: key, text, kind: 'url' });
          }
        }
        continue;
      }

      const normalized = absolute.split('#')[0];
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      results.push({ href: normalized, text, kind: 'url' });
    }

    return results;
  }, baseOrigin);
}

/**
 * Click hash / in-app controls and collect URLs the SPA navigates to.
 * Restores the starting URL between probes.
 */
export async function discoverClickNavigations(
  page: Page,
  excludePathPatterns: RegExp[],
  maxProbes: number,
): Promise<string[]> {
  const startUrl = page.url();
  const candidates = await page.evaluate(() => {
    const nodes = Array.from(
      document.querySelectorAll(
        'a[href="#"], a[href=""], [data-test="shopping-cart-link"], .shopping_cart_link',
      ),
    );

    return nodes.map((el, index) => {
      const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
      const testId = el.getAttribute('data-test') || el.getAttribute('data-testid') || '';
      return { index, text, testId };
    });
  });

  const found = new Set<string>();
  let probes = 0;

  for (const candidate of candidates) {
    if (probes >= maxProbes) break;
    const label = `${candidate.text} ${candidate.testId}`;
    if (excludePathPatterns.some((re) => re.test(label))) continue;
    if (!candidate.text && !candidate.testId) continue;
    // Skip empty icon-only product image links if we already have the title link.
    if (!candidate.text && candidate.testId !== 'shopping-cart-link') continue;

    probes += 1;
    try {
      if (page.url() !== startUrl) {
        await page.goto(startUrl, { waitUntil: 'domcontentloaded' });
      }

      const locator = candidate.testId
        ? page.locator(`[data-test="${candidate.testId}"]`).first()
        : page.getByRole('link', { name: candidate.text, exact: true }).first();

      await locator.click({ timeout: 3_000 });
      await new Promise((r) => setTimeout(r, 400));

      const next = page.url().split('#')[0];
      if (next && next !== startUrl.split('#')[0]) {
        found.add(next);
      }
    } catch {
      // Click did not navigate — ignore and continue probing.
    }
  }

  if (page.url() !== startUrl) {
    await page.goto(startUrl, { waitUntil: 'domcontentloaded' }).catch(() => undefined);
  }

  return [...found];
}

/** @deprecated use extractLinks */
export async function extractSameOriginLinks(
  page: Page,
  baseOrigin: string,
): Promise<{ href: string; text: string }[]> {
  const links = await extractLinks(page, baseOrigin);
  return links.filter((l) => l.kind === 'url' && l.href.startsWith(baseOrigin));
}

