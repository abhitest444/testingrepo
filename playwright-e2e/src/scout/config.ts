import path from 'path';
import type { ScoutRunOptions, ViewportProfile } from './types';

export const DEFAULT_VIEWPORTS: ViewportProfile[] = [
  { name: 'mobile', width: 390, height: 844, isMobile: true },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

/**
 * Resolve scout options from env so testers can point at any app without code changes.
 *
 * SCOUT_START_PATH   default /inventory.html (authenticated Sauce Demo home)
 * SCOUT_MAX_PAGES    default 20
 * SCOUT_SCREENSHOTS  default true
 * SCOUT_EXCLUDE      comma-separated path substrings (default: logout)
 */
export function resolveScoutOptions(outputRoot = path.join(process.cwd(), 'scout-report')): ScoutRunOptions {
  const excludeRaw = process.env.SCOUT_EXCLUDE ?? 'logout';
  const excludePathPatterns = excludeRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => new RegExp(s, 'i'));

  return {
    startPath: process.env.SCOUT_START_PATH ?? '/inventory.html',
    maxPages: Number(process.env.SCOUT_MAX_PAGES ?? 20),
    sameOriginOnly: true,
    excludePathPatterns,
    captureScreenshots: (process.env.SCOUT_SCREENSHOTS ?? 'true').toLowerCase() !== 'false',
    screenshotDir: path.join(outputRoot, 'screenshots'),
  };
}

export function resolveViewports(): ViewportProfile[] {
  const raw = process.env.SCOUT_VIEWPORTS;
  if (!raw) return DEFAULT_VIEWPORTS;

  const wanted = new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );

  return DEFAULT_VIEWPORTS.filter((v) => wanted.has(v.name));
}
