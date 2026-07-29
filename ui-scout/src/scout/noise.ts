import type { ScoutIssue } from './types';

/** Social / app-link hosts that block automated probes — skip by default. */
export const EXTERNAL_PROBE_SKIP_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'instagram.com',
  'www.instagram.com',
  'twitter.com',
  'www.twitter.com',
  'x.com',
  'www.x.com',
  'snapchat.com',
  'www.snapchat.com',
  'wa.me',
  'web.whatsapp.com',
  'api.whatsapp.com',
  'linkedin.com',
  'www.linkedin.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'tiktok.com',
  'www.tiktok.com',
  'pinterest.com',
  'www.pinterest.com',
  'threads.net',
  'www.threads.net',
]);

export function isSkippableExternalUrl(href: string): boolean {
  try {
    const host = new URL(href).hostname.toLowerCase();
    return EXTERNAL_PROBE_SKIP_HOSTS.has(host);
  } catch {
    return false;
  }
}

/** Stable key for deduping repeat findings across pages (e.g. footer social icons). */
export function issueFingerprint(issue: ScoutIssue): string {
  const detailKey = (issue.details ?? '')
    .replace(/https?:\/\/[^\s]+/g, (url) => {
      try {
        const u = new URL(url);
        return `${u.hostname}${u.pathname}`;
      } catch {
        return url;
      }
    })
    .slice(0, 240);

  return `${issue.category}|${issue.message}|${detailKey}|${issue.selector ?? ''}`;
}

/**
 * Collapse duplicate findings. Keeps the first page URL and notes how many pages share it.
 */
export function dedupeIssues(issues: ScoutIssue[]): ScoutIssue[] {
  const seen = new Map<string, { issue: ScoutIssue; pages: Set<string> }>();

  for (const issue of issues) {
    const key = issueFingerprint(issue);
    const existing = seen.get(key);
    if (existing) {
      existing.pages.add(issue.url);
      continue;
    }
    seen.set(key, { issue, pages: new Set([issue.url]) });
  }

  return [...seen.values()].map(({ issue, pages }) => {
    if (pages.size <= 1) return issue;
    const sample = [...pages].slice(0, 3).join(', ');
    const suffix = pages.size > 3 ? ` (+${pages.size - 3} more)` : '';
    return {
      ...issue,
      url: [...pages][0],
      details: `${issue.details ?? ''} · repeated on ${pages.size} page(s): ${sample}${suffix}`.trim(),
    };
  });
}

/** Apply dedupe per page list and rebuild flat issue array. */
export function dedupeRunIssues(pages: { url: string; issues: ScoutIssue[] }[]): ScoutIssue[] {
  const flat = pages.flatMap((p) => p.issues);
  return dedupeIssues(flat);
}
