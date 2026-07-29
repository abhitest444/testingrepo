import type { Page } from '@playwright/test';
import type { ScoutIssue } from './types';

export type ContentFinding = {
  kind: string;
  message: string;
  severity: ScoutIssue['severity'];
  snippet: string;
  selector?: string;
};

export const COMMON_TYPOS: { pattern: RegExp; word: string; suggestion: string }[] = [
  { pattern: /\bteh\b/gi, word: 'teh', suggestion: 'the' },
  { pattern: /\brecieve\b/gi, word: 'recieve', suggestion: 'receive' },
  { pattern: /\boccured\b/gi, word: 'occured', suggestion: 'occurred' },
  { pattern: /\bseperate\b/gi, word: 'seperate', suggestion: 'separate' },
  { pattern: /\bdefinately\b/gi, word: 'definately', suggestion: 'definitely' },
  { pattern: /\baccomodate\b/gi, word: 'accomodate', suggestion: 'accommodate' },
  { pattern: /\buntill\b/gi, word: 'untill', suggestion: 'until' },
  { pattern: /\bwich\b/gi, word: 'wich', suggestion: 'which' },
  { pattern: /\bthier\b/gi, word: 'thier', suggestion: 'their' },
  { pattern: /\bbeleive\b/gi, word: 'beleive', suggestion: 'believe' },
];

const PLACEHOLDER_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\blorem ipsum\b/i, label: 'Lorem ipsum placeholder' },
  { pattern: /\b(?:\[placeholder\]|your text here|sample text|coming soon)\b/i, label: 'Placeholder copy' },
  { pattern: /\bTODO:\s*\S/i, label: 'TODO marker in visible text' },
  { pattern: /\bTBD\b/, label: 'TBD marker in visible text' },
];

export function analyzeTitle(title: string): ContentFinding[] {
  const trimmed = title.trim();
  const findings: ContentFinding[] = [];

  if (!trimmed) {
    findings.push({
      kind: 'empty-title',
      message: 'Page title is empty',
      severity: 'moderate',
      snippet: '(empty)',
    });
    return findings;
  }

  if (/^(untitled|document|home page|new page)$/i.test(trimmed)) {
    findings.push({
      kind: 'generic-title',
      message: 'Page title looks like a default / placeholder',
      severity: 'moderate',
      snippet: trimmed,
    });
  }

  if (/\s[-|–—]\s*$/.test(trimmed) || /^\s[-|–—]\s/.test(trimmed)) {
    findings.push({
      kind: 'title-punctuation',
      message: 'Page title has dangling or leading separator (incomplete branding?)',
      severity: 'minor',
      snippet: trimmed,
    });
  }

  if (trimmed.length < 3) {
    findings.push({
      kind: 'short-title',
      message: 'Page title is unusually short',
      severity: 'minor',
      snippet: trimmed,
    });
  }

  return findings;
}

export function findTextQualityIssues(text: string, maxFindings = 8): ContentFinding[] {
  const findings: ContentFinding[] = [];
  const sample = text.replace(/\s+/g, ' ').trim().slice(0, 8000);
  if (sample.length < 8) return findings;

  if (/ {2,}/.test(text)) {
    findings.push({
      kind: 'double-space',
      message: 'Double spaces in visible text',
      severity: 'minor',
      snippet: text.match(/\S+ {2,}\S+/)?.[0]?.slice(0, 120) ?? 'double space',
    });
  }

  const repeated = sample.match(/\b([A-Za-z]{3,})\s+\1\b/i);
  if (repeated) {
    findings.push({
      kind: 'repeated-word',
      message: `Repeated word "${repeated[1]}"`,
      severity: 'minor',
      snippet: repeated[0].slice(0, 120),
    });
  }

  for (const { pattern, label } of PLACEHOLDER_PATTERNS) {
    const match = sample.match(pattern);
    if (match) {
      findings.push({
        kind: 'placeholder',
        message: label,
        severity: 'serious',
        snippet: match[0].slice(0, 120),
      });
      break;
    }
  }

  for (const typo of COMMON_TYPOS) {
    if (!typo.pattern.test(sample)) continue;
    typo.pattern.lastIndex = 0;
    const match = sample.match(typo.pattern);
    findings.push({
      kind: 'typo',
      message: `Possible typo: "${typo.word}" → "${typo.suggestion}"`,
      severity: 'moderate',
      snippet: match?.[0] ?? typo.word,
    });
    if (findings.length >= maxFindings) break;
  }

  return findings.slice(0, maxFindings);
}

export function analyzeHeadingStructure(headings: { level: number; text: string }[]): ContentFinding[] {
  const findings: ContentFinding[] = [];
  const h1s = headings.filter((h) => h.level === 1);

  if (headings.length > 0 && h1s.length === 0) {
    findings.push({
      kind: 'missing-h1',
      message: 'Page has headings but no h1',
      severity: 'moderate',
      snippet: headings[0]?.text.slice(0, 80) ?? '',
      selector: `h${headings[0]?.level}`,
    });
  }

  if (h1s.length > 1) {
    findings.push({
      kind: 'multiple-h1',
      message: `Multiple h1 headings (${h1s.length})`,
      severity: 'moderate',
      snippet: h1s.map((h) => h.text).join(' | ').slice(0, 120),
      selector: 'h1',
    });
  }

  let lastLevel = 0;
  for (const heading of headings) {
    if (lastLevel > 0 && heading.level > lastLevel + 1) {
      findings.push({
        kind: 'heading-skip',
        message: `Heading level skipped (h${lastLevel} → h${heading.level})`,
        severity: 'moderate',
        snippet: heading.text.slice(0, 80),
        selector: `h${heading.level}`,
      });
      break;
    }
    lastLevel = heading.level;
  }

  for (const heading of headings) {
    if (!heading.text.trim()) {
      findings.push({
        kind: 'empty-heading',
        message: `Empty h${heading.level} heading`,
        severity: 'moderate',
        snippet: `(empty h${heading.level})`,
        selector: `h${heading.level}`,
      });
      break;
    }
  }

  return findings;
}

export function contentFindingsToIssues(pageUrl: string, findings: ContentFinding[]): ScoutIssue[] {
  return findings.map((f) => ({
    category: 'content' as const,
    severity: f.severity,
    message: f.message,
    url: pageUrl,
    details: f.snippet.slice(0, 500),
    selector: f.selector,
  }));
}

/**
 * Copy / grammar heuristics on page title, visible text, and heading structure.
 */
export async function scanPageContent(page: Page): Promise<ScoutIssue[]> {
  const pageUrl = page.url();

  const payload = await page.evaluate(() => {
    const visibleText = (document.body?.innerText || '').slice(0, 12_000);
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((el) => ({
      level: Number(el.tagName.slice(1)),
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
    }));
    return { title: document.title, visibleText, headings: headings.slice(0, 40) };
  });

  const findings: ContentFinding[] = [
    ...analyzeTitle(payload.title),
    ...findTextQualityIssues(payload.visibleText),
    ...analyzeHeadingStructure(payload.headings),
  ];

  return contentFindingsToIssues(pageUrl, findings);
}
