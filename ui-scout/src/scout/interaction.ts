import type { Page } from '@playwright/test';
import type { ScoutIssue } from './types';

export type InteractionScanOptions = {
  maxTabStops: number;
  maxFormProbes: number;
  maxTooltipProbes: number;
};

function makeIssue(
  category: ScoutIssue['category'],
  severity: ScoutIssue['severity'],
  message: string,
  url: string,
  details?: string,
  selector?: string,
): ScoutIssue {
  return { category, severity, message, url, details, selector };
}

async function scanTooltipAndLabelHints(
  page: Page,
  maxTooltipProbes: number,
): Promise<ScoutIssue[]> {
  const pageUrl = page.url();
  const findings = await page.evaluate((limit) => {
    const controls = Array.from(
      document.querySelectorAll<HTMLElement>('a, button, [role="button"], [aria-label], [title]'),
    );

    function selectorFor(el: Element): string {
      const id = el.getAttribute('id');
      if (id) return `#${id}`;
      const testId = el.getAttribute('data-test') || el.getAttribute('data-testid');
      if (testId) return `[data-test="${testId}"]`;
      const cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean)[0];
      if (cls) return `${el.tagName.toLowerCase()}.${cls}`;
      return el.tagName.toLowerCase();
    }

    const out: { selector: string; reason: string }[] = [];
    for (const el of controls) {
      if (out.length >= limit) break;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      const text = (el.textContent || '').trim();
      const hasIcon = Boolean(el.querySelector('svg, img, i'));
      const label = (el.getAttribute('aria-label') || '').trim();
      const title = (el.getAttribute('title') || '').trim();
      const labelledBy = (el.getAttribute('aria-labelledby') || '').trim();

      let labelledByText = '';
      if (labelledBy) {
        const ids = labelledBy.split(/\s+/).filter(Boolean);
        labelledByText = ids
          .map((id) => document.getElementById(id)?.textContent?.trim() || '')
          .join(' ')
          .trim();
      }

      const hasName = Boolean(text || label || title || labelledByText);
      if (hasIcon && !hasName) {
        out.push({
          selector: selectorFor(el),
          reason: 'Icon-like control has no label/tooltip text',
        });
      } else if (!hasIcon && !text && !label && !title && !labelledByText) {
        out.push({
          selector: selectorFor(el),
          reason: 'Interactive control appears unnamed',
        });
      }
    }
    return out;
  }, maxTooltipProbes);

  return findings.map((f) =>
    makeIssue('tooltip', 'moderate', 'Control lacks tooltip/accessible name', pageUrl, f.reason, f.selector),
  );
}

async function scanKeyboardTabFlow(page: Page, maxTabStops: number): Promise<ScoutIssue[]> {
  const pageUrl = page.url();
  const issues: ScoutIssue[] = [];

  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
  });
  await page.keyboard.press('Tab');

  const focusTrail: string[] = [];
  let focusLosses = 0;
  let invisibleFocusCount = 0;
  let positiveTabIndexCount = 0;

  for (let i = 0; i < maxTabStops; i++) {
    if (i > 0) await page.keyboard.press('Tab');
    // tiny settle to allow JS focus handlers
    await page.waitForTimeout(20);
    const state = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) {
        return { selector: '(none)', isBody: true, visibleFocus: false, positiveTabIndex: false };
      }
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const cls = (el.className || '').toString().trim().split(/\s+/).filter(Boolean)[0];
      const selector = id || (cls ? `${tag}.${cls}` : tag);
      const style = window.getComputedStyle(el);
      const outlineVisible =
        style.outlineStyle !== 'none' && style.outlineWidth !== '0px' && style.outlineColor !== 'rgba(0, 0, 0, 0)';
      const boxShadow = style.boxShadow && style.boxShadow !== 'none';
      const focusVisible = outlineVisible || boxShadow || el.matches(':focus-visible');
      const tabIndex = Number(el.getAttribute('tabindex') ?? NaN);
      return {
        selector,
        isBody: el === document.body || tag === 'body',
        visibleFocus: focusVisible,
        positiveTabIndex: Number.isFinite(tabIndex) && tabIndex > 0,
      };
    });

    focusTrail.push(state.selector);
    if (state.isBody) focusLosses += 1;
    if (!state.visibleFocus) invisibleFocusCount += 1;
    if (state.positiveTabIndex) positiveTabIndexCount += 1;
  }

  const uniqueStops = new Set(focusTrail).size;
  if (focusLosses > 0) {
    issues.push(
      makeIssue(
        'keyboard',
        'moderate',
        'Keyboard tabbing lost focus to document/body',
        pageUrl,
        `focus-losses=${focusLosses}/${maxTabStops}`,
      ),
    );
  }
  if (invisibleFocusCount > Math.max(2, Math.floor(maxTabStops * 0.3))) {
    issues.push(
      makeIssue(
        'keyboard',
        'moderate',
        'Focus indicator not visible during keyboard tabbing',
        pageUrl,
        `invisible-focus=${invisibleFocusCount}/${maxTabStops}`,
      ),
    );
  }
  if (positiveTabIndexCount > 0) {
    issues.push(
      makeIssue(
        'keyboard',
        'minor',
        'Positive tabindex detected (can create non-natural tab order)',
        pageUrl,
        `positive-tabindex-hits=${positiveTabIndexCount}`,
      ),
    );
  }
  if (uniqueStops < Math.max(2, Math.floor(maxTabStops * 0.25))) {
    issues.push(
      makeIssue(
        'keyboard',
        'moderate',
        'Very few unique tab stops discovered',
        pageUrl,
        `unique-stops=${uniqueStops}/${maxTabStops}`,
      ),
    );
  }

  return issues;
}

async function scanCommonFieldValidation(page: Page, maxFormProbes: number): Promise<ScoutIssue[]> {
  const pageUrl = page.url();
  const candidates = await page.evaluate((limit) => {
    const all = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
    const picked: { selector: string; kind: 'email' | 'phone' | 'required' }[] = [];

    function selectorFor(el: HTMLInputElement): string {
      const id = el.id;
      if (id) return `#${id}`;
      const testId = el.getAttribute('data-test') || el.getAttribute('data-testid');
      if (testId) return `[data-test="${testId}"]`;
      const name = el.getAttribute('name');
      if (name) return `input[name="${name}"]`;
      return 'input';
    }

    for (const input of all) {
      if (picked.length >= limit) break;
      const type = (input.type || '').toLowerCase();
      const name = `${input.name || ''} ${input.id || ''} ${input.placeholder || ''}`.toLowerCase();
      let kind: 'email' | 'phone' | 'required' | null = null;
      if (type === 'email' || /\bemail\b/.test(name)) kind = 'email';
      else if (type === 'tel' || /\b(phone|mobile|tel)\b/.test(name)) kind = 'phone';
      else if (input.required) kind = 'required';
      if (!kind) continue;
      picked.push({ selector: selectorFor(input), kind });
    }
    return picked;
  }, maxFormProbes);

  const issues: ScoutIssue[] = [];
  for (const candidate of candidates) {
    const locator = page.locator(candidate.selector).first();
    const visible = await locator.isVisible().catch(() => false);
    const enabled = await locator.isEnabled().catch(() => false);
    if (!visible || !enabled) continue;

    const original = await locator.inputValue().catch(() => '');
    const invalidValue =
      candidate.kind === 'email' ? 'not-an-email' : candidate.kind === 'phone' ? 'abc' : '';
    await locator.fill(invalidValue).catch(() => undefined);
    await locator.blur().catch(() => undefined);
    await page.waitForTimeout(40);

    const result = await page.evaluate((selector) => {
      const el = document.querySelector(selector) as HTMLInputElement | null;
      if (!el) return null;
      const ariaInvalid = (el.getAttribute('aria-invalid') || '').toLowerCase() === 'true';
      const htmlInvalid = el.matches(':invalid');
      const checkValidity = el.checkValidity();
      const describedBy = (el.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent?.trim() || '')
        .join(' ')
        .trim();
      const parentText = (el.closest('form, .field, .form-group, .input-group')?.textContent || '')
        .replace(/\s+/g, ' ')
        .slice(0, 200)
        .toLowerCase();
      const hasErrorText = /(invalid|required|enter|correct|must|please)/.test(
        `${describedBy} ${parentText}`,
      );
      return { ariaInvalid, htmlInvalid, checkValidity, hasErrorText };
    }, candidate.selector);

    await locator.fill(original).catch(() => undefined);

    if (!result) continue;
    const acceptedWithoutFeedback =
      result.checkValidity && !result.ariaInvalid && !result.htmlInvalid && !result.hasErrorText;
    if (acceptedWithoutFeedback) {
      issues.push(
        makeIssue(
          'form-validation',
          'moderate',
          `Invalid ${candidate.kind} input accepted without feedback`,
          pageUrl,
          `selector=${candidate.selector}`,
          candidate.selector,
        ),
      );
    }
  }

  return issues;
}

export async function scanInteractionIssues(
  page: Page,
  options: InteractionScanOptions,
): Promise<ScoutIssue[]> {
  const [tooltipIssues, keyboardIssues, formIssues] = await Promise.all([
    scanTooltipAndLabelHints(page, options.maxTooltipProbes),
    scanKeyboardTabFlow(page, options.maxTabStops),
    scanCommonFieldValidation(page, options.maxFormProbes),
  ]);

  return [...tooltipIssues, ...keyboardIssues, ...formIssues];
}
