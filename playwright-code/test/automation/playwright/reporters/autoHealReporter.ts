/**
 * Auto-heal diagnosis reporter.
 *
 * For every failed/timed-out test this reporter inspects the Playwright error,
 * classifies the most likely root cause (locator change, timeout, element
 * state, real defect, flake, network, auth, …) and appends a human-readable
 * "🔧 AUTO-HEAL DIAGNOSIS" block to the test's error message. Because it is
 * registered FIRST in playwright.config.ts (before the `html` reporter), the
 * mutated error is picked up by the HTML reporter and rendered inside the
 * test's "Errors" box, directly under the failing stack trace.
 *
 * It does NOT edit any code or auto-fix anything: it only diagnoses and suggests,
 * so a real product defect is never silently masked. Treat "Probable cause" as a
 * strong hint, not a verdict.
 */
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

export interface Diagnosis {
  category: string;
  confidence: 'High' | 'Medium' | 'Low';
  cause: string;
  fixes: string[];
}

const FAILURE_STATUSES = ['failed', 'timedOut'];

/** Join all available error text for a result into one searchable blob. */
function errorBlob(result: TestResult): string {
  const parts: string[] = [];
  if (result.error?.message) parts.push(result.error.message);
  if (result.error?.stack) parts.push(result.error.stack);
  for (const e of result.errors ?? []) {
    if (e.message) parts.push(e.message);
  }
  return parts.join('\n');
}

/** Pull the failing `Locator: ...` line out of an error message, if present. */
function extractLocator(blob: string): string | null {
  const m = blob.match(/Locator:\s*(.+)/);
  return m ? m[1].trim() : null;
}

/**
 * Classify a failure from its error text. Order matters: more specific /
 * higher-value signals are checked first (e.g. "element(s) not found" beats a
 * generic timeout, because a missing locator is the actionable root cause).
 */
export function classifyFailure(blob: string, isFlaky: boolean): Diagnosis {
  const has = (re: RegExp) => re.test(blob);

  if (isFlaky) {
    return {
      category: '🔁 Flaky / transient',
      confidence: 'High',
      cause:
        'The test failed on the first attempt but PASSED on retry — this is a timing/transient issue, not a stable defect.',
      fixes: [
        'Likely not a product bug. Stabilise the step that failed before re-triaging.',
        'Add an explicit wait for the element/network state instead of relying on implicit timing.',
        'If it recurs across runs, investigate the specific step shown in the retry-0 error.',
      ],
    };
  }

  if (
    has(
      /net::ERR|ERR_CONNECTION|ERR_NETWORK|ECONNREFUSED|ERR_ABORTED|NS_ERROR/i,
    )
  ) {
    return {
      category: '🌐 Network / infrastructure',
      confidence: 'High',
      cause:
        'A network or connection error occurred — usually an environment/infra problem, not a test or product issue.',
      fixes: [
        'Re-run the test; check the target environment (prod/preprod) is up.',
        'Verify VPN/proxy and that the baseURL host is reachable from the agent.',
      ],
    };
  }

  if (
    has(
      /can'?t find account|unable to (login|log in)|Sign in|authentication failed|login failed/i,
    )
  ) {
    return {
      category: '🔐 Auth / login',
      confidence: 'High',
      cause:
        'The test could not authenticate — wrong/expired account, missing PLAYWRIGHT_ENV, or login flow changed.',
      fixes: [
        'Confirm the test account exists for this environment and the correct PLAYWRIGHT_ENV is set.',
        'Check the login Page Object (QBOLogin) for selector/flow changes.',
      ],
    };
  }

  if (
    has(/element\(s\) not found/i) ||
    (has(/waiting for (get_?by|locator)/i) && !has(/Received/i))
  ) {
    return {
      category: '🔍 Locator changed / not found',
      confidence: 'High',
      cause:
        'The selector matched no element. The UI likely changed (renamed/restructured), the element is inside an iframe, or it never rendered.',
      fixes: [
        'Update the selector in the relevant Page Object (under pages/), NOT in the spec.',
        'If the content moved into an iframe, use page.frameLocator(...) — page.getBy* cannot pierce iframes.',
        'If an overlay/coachmark is covering or replacing it, dismiss it first.',
        'Confirm the element is expected on this account/permission set before assuming a code bug.',
      ],
    };
  }

  if (has(/strict mode violation|resolved to \d+ elements/i)) {
    return {
      category: '⚠️ Ambiguous selector (strict mode)',
      confidence: 'High',
      cause:
        'The selector matched multiple elements, so Playwright refused to act in strict mode.',
      fixes: [
        'Narrow the selector (add role/name/exact text, or a parent scope).',
        'If matching the first match is genuinely intended, append .first().',
      ],
    };
  }

  if (
    has(
      /intercepts pointer events|element is not stable|not enabled|is not editable|element is not visible|Received:\s*hidden/i,
    )
  ) {
    return {
      category: '🧱 Element state / actionability',
      confidence: 'Medium',
      cause:
        'The element exists but was not in an actionable state — hidden, disabled, unstable, or covered by another element.',
      fixes: [
        'Scroll the element into view and wait for it to be enabled/stable before acting.',
        'Dismiss any overlay/banner/coachmark intercepting the click.',
        'If it should be enabled, this may be a real product defect — review the screenshot/video.',
      ],
    };
  }

  if (has(/Expected/i) && has(/Received/i)) {
    return {
      category: '🐞 Assertion mismatch — possible defect',
      confidence: 'Medium',
      cause:
        'The element was found but its value/state did not match the expectation (Expected vs Received differ).',
      fixes: [
        'Compare Expected vs Received: if the app value is wrong, this is a PRODUCT DEFECT — needs dev review.',
        'If the app changed intentionally, update the expected value in the test.',
      ],
    };
  }

  if (
    has(/Timeout \d+ms exceeded|exceeded while waiting|Test timeout of \d+/i)
  ) {
    return {
      category: '⏱ Timeout',
      confidence: 'Medium',
      cause:
        'An action or assertion timed out waiting for the page/element — slow load, late-rendering element, or a step that never completes.',
      fixes: [
        'Wait for the specific element/network state rather than a fixed sleep.',
        'If the page is genuinely slow, raise the timeout for that step.',
        'Check the screenshot/video to confirm the element eventually appears.',
      ],
    };
  }

  if (has(/page\.goto|Navigation (failed|to)|net::|frame was detached/i)) {
    return {
      category: '🧭 Navigation',
      confidence: 'Medium',
      cause: 'Page navigation did not complete as expected.',
      fixes: [
        'Verify the URL/route is still valid and reachable in this environment.',
        'Wait for the expected landing element after navigation.',
      ],
    };
  }

  return {
    category: '🔎 Needs manual review',
    confidence: 'Low',
    cause:
      'This failure did not match a known pattern — triage it from the artifacts below.',
    fixes: [
      'Review the error, call log, screenshot and video manually.',
      'If this pattern recurs, extend classifyFailure() in autoHealReporter.ts.',
    ],
  };
}

/**
 * Compact, plain-text rendering of the diagnosis for embedding directly inside
 * the Playwright "Errors" box (which shows monospace text, not markdown). This
 * is what makes the diagnosis appear as a "card" right under the error.
 */
function buildErrorBanner(
  diag: Diagnosis,
  locator: string | null,
  where: string | null,
): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('──────────────────────────────────────────────');
  lines.push('🔧 AUTO-HEAL DIAGNOSIS');
  lines.push('──────────────────────────────────────────────');
  lines.push(`Category   : ${diag.category}`);
  lines.push(`Confidence : ${diag.confidence}`);
  lines.push(`Cause      : ${diag.cause}`);
  if (locator) lines.push(`Locator    : ${locator}`);
  if (where) lines.push(`Where      : ${where}`);
  lines.push('Suggested fix:');
  for (const f of diag.fixes) lines.push(`  • ${f}`);
  lines.push('──────────────────────────────────────────────');
  lines.push('(auto-generated hint — verify against screenshot/video)');
  return lines.join('\n');
}

class AutoHealReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult): void {
    if (!FAILURE_STATUSES.includes(result.status)) return;

    const blob = errorBlob(result);
    if (!blob) return;

    const isFlaky = test.outcome() === 'flaky';
    const diag = classifyFailure(blob, isFlaky);
    const locator = extractLocator(blob);

    const loc = result.errors?.[0]?.location ?? test.location;
    const where = loc ? `${loc.file}:${loc.line}` : null;

    const banner = buildErrorBanner(diag, locator, where);

    // Append the diagnosis to the error so the HTML reporter renders it inside
    // the "Errors" box, directly under the failing stack trace — instead of
    // tucking it away in the "Attachments" section. The HTML report renders
    // `error.stack` (the trace + code frame), so we must append there; `.stack`
    // already embeds the message, so mutating `.message` alone is invisible.
    const appendBanner = (err?: { message?: string; stack?: string }): void => {
      if (!err) return;
      if (err.stack) err.stack = `${err.stack}\n${banner}`;
      else if (err.message) err.message = `${err.message}\n${banner}`;
      else err.message = banner;
    };

    appendBanner(result.error);
    const firstError = result.errors?.[0];
    if (firstError && firstError !== result.error) appendBanner(firstError);

    // Also surface a one-liner in the CI/console log.
    // eslint-disable-next-line no-console
    console.log(
      `\n🔧 [auto-heal] ${test.title}\n   → ${diag.category} (${
        diag.confidence
      })${locator ? `  locator: ${locator}` : ''}`,
    );
  }
}

export default AutoHealReporter;
