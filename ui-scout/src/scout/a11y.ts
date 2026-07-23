import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import type { IssueSeverity, ScoutIssue } from './types';

const IMPACT_TO_SEVERITY: Record<string, IssueSeverity> = {
  critical: 'critical',
  serious: 'serious',
  moderate: 'moderate',
  minor: 'minor',
};

/**
 * Run axe on the current page and map violations into Scout issues.
 */
export async function scanPageAccessibility(page: Page): Promise<ScoutIssue[]> {
  const pageUrl = page.url();

  try {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    return results.violations.flatMap((violation) => {
      const severity = IMPACT_TO_SEVERITY[violation.impact ?? 'moderate'] ?? 'moderate';
      const sample = violation.nodes
        .slice(0, 3)
        .map((n) => n.target.join(' '))
        .join('; ');

      return [
        {
          category: 'a11y' as const,
          severity,
          message: `${violation.id}: ${violation.help}`,
          url: pageUrl,
          details: `${violation.nodes.length} node(s). ${sample}`.slice(0, 500),
          selector: violation.nodes[0]?.target?.[0]
            ? String(violation.nodes[0].target[0])
            : undefined,
        },
      ];
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return [
      {
        category: 'a11y',
        severity: 'moderate',
        message: 'Accessibility scan failed to run',
        url: pageUrl,
        details: message.slice(0, 500),
      },
    ];
  }
}
