import fs from 'fs';
import path from 'path';
import type { ScoutIssue, ScoutRunResult } from './types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function severityClass(severity: ScoutIssue['severity']): string {
  return `sev-${severity}`;
}

function renderIssueRow(issue: ScoutIssue): string {
  return `<tr>
    <td><span class="badge ${severityClass(issue.severity)}">${escapeHtml(issue.severity)}</span></td>
    <td>${escapeHtml(issue.category)}</td>
    <td>${escapeHtml(issue.message)}</td>
    <td><code>${escapeHtml(issue.url)}</code></td>
    <td>${escapeHtml(issue.details ?? '')}</td>
  </tr>`;
}

function renderRun(run: ScoutRunResult, index: number): string {
  const issueRows = run.issues.map(renderIssueRow).join('\n') ||
    `<tr><td colspan="5" class="ok">No issues found for this viewport.</td></tr>`;

  const pageRows = run.pagesVisited
    .map(
      (p) => `<tr>
      <td><code>${escapeHtml(p.url)}</code></td>
      <td>${escapeHtml(p.title)}</td>
      <td>${p.status ?? '—'}</td>
      <td>${p.internalLinks}</td>
      <td>${p.issues.length}</td>
    </tr>`,
    )
    .join('\n');

  return `
  <section class="run">
    <h2>${escapeHtml(run.browserName)} · ${escapeHtml(run.viewport.name)}
      <span class="muted">${run.viewport.width}×${run.viewport.height}</span>
    </h2>
    <div class="stats">
      <div><strong>${run.summary.pages}</strong><span>pages</span></div>
      <div><strong>${run.summary.issues}</strong><span>issues</span></div>
      <div><strong>${run.summary.bySeverity.critical}</strong><span>critical</span></div>
      <div><strong>${run.summary.bySeverity.serious}</strong><span>serious</span></div>
      <div><strong>${run.summary.bySeverity.moderate}</strong><span>moderate</span></div>
      <div><strong>${run.summary.bySeverity.minor}</strong><span>minor</span></div>
    </div>
    <h3>Issues</h3>
    <table>
      <thead>
        <tr><th>Severity</th><th>Category</th><th>Message</th><th>Page</th><th>Details</th></tr>
      </thead>
      <tbody>${issueRows}</tbody>
    </table>
    <details ${index === 0 ? 'open' : ''}>
      <summary>Visited pages (${run.pagesVisited.length})</summary>
      <table>
        <thead>
          <tr><th>URL</th><th>Title</th><th>Status</th><th>Internal links</th><th>Issues</th></tr>
        </thead>
        <tbody>${pageRows}</tbody>
      </table>
    </details>
  </section>`;
}

/**
 * Writes machine-readable JSON + a standalone HTML report for testers.
 */
export function writeScoutReport(
  results: ScoutRunResult[],
  outputDir: string,
): { jsonPath: string; htmlPath: string } {
  fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, 'scout-report.json');
  const htmlPath = path.join(outputDir, 'scout-report.html');

  const totals = results.reduce(
    (acc, run) => {
      acc.pages += run.summary.pages;
      acc.issues += run.summary.issues;
      acc.critical += run.summary.bySeverity.critical;
      acc.serious += run.summary.bySeverity.serious;
      return acc;
    },
    { pages: 0, issues: 0, critical: 0, serious: 0 },
  );

  fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), totals, results }, null, 2));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>UI Scout Report</title>
  <style>
    :root {
      --bg: #0f1419;
      --panel: #1a2332;
      --text: #e7ecf3;
      --muted: #8b9bb4;
      --line: #2a3648;
      --critical: #ff5c5c;
      --serious: #ff9f43;
      --moderate: #f7c948;
      --minor: #7aa2ff;
      --ok: #3dd68c;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
      background: radial-gradient(1200px 600px at 10% -10%, #1e3a5f 0%, transparent 50%),
                  radial-gradient(900px 500px at 100% 0%, #243b2e 0%, transparent 45%),
                  var(--bg);
      color: var(--text);
      line-height: 1.45;
      padding: 2rem clamp(1rem, 4vw, 3rem) 4rem;
    }
    h1 { font-size: clamp(1.8rem, 3vw, 2.4rem); margin: 0 0 0.35rem; letter-spacing: -0.02em; }
    h2 { margin: 0 0 1rem; font-size: 1.25rem; }
    h3 { margin: 1.5rem 0 0.75rem; font-size: 1rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .lede { color: var(--muted); margin: 0 0 2rem; max-width: 52rem; }
    .hero-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    .hero-stats div, .stats div {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 0.9rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .hero-stats strong, .stats strong { font-size: 1.5rem; }
    .hero-stats span, .stats span { color: var(--muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.6rem; margin-bottom: 1rem; }
    .run {
      background: color-mix(in srgb, var(--panel) 88%, black);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 1.25rem 1.35rem 1.5rem;
      margin-bottom: 1.25rem;
    }
    .muted { color: var(--muted); font-weight: 400; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th, td { text-align: left; padding: 0.55rem 0.6rem; border-bottom: 1px solid var(--line); vertical-align: top; }
    th { color: var(--muted); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
    code { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 0.82rem; word-break: break-all; }
    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .sev-critical { background: color-mix(in srgb, var(--critical) 25%, transparent); color: var(--critical); }
    .sev-serious { background: color-mix(in srgb, var(--serious) 25%, transparent); color: var(--serious); }
    .sev-moderate { background: color-mix(in srgb, var(--moderate) 22%, transparent); color: var(--moderate); }
    .sev-minor { background: color-mix(in srgb, var(--minor) 22%, transparent); color: var(--minor); }
    .ok { color: var(--ok); text-align: center; }
    details { margin-top: 1rem; }
    summary { cursor: pointer; color: var(--muted); margin-bottom: 0.75rem; }
  </style>
</head>
<body>
  <header>
    <h1>UI Scout Report</h1>
    <p class="lede">
      Automated crawl across viewports: broken links, dead ends, console/network failures,
      broken images, overflow, and weak interactive targets.
    </p>
    <div class="hero-stats">
      <div><strong>${totals.pages}</strong><span>page visits</span></div>
      <div><strong>${totals.issues}</strong><span>issues</span></div>
      <div><strong>${totals.critical}</strong><span>critical</span></div>
      <div><strong>${totals.serious}</strong><span>serious</span></div>
      <div><strong>${results.length}</strong><span>viewport runs</span></div>
    </div>
  </header>
  ${results.map((run, i) => renderRun(run, i)).join('\n')}
</body>
</html>`;

  fs.writeFileSync(htmlPath, html);
  return { jsonPath, htmlPath };
}
