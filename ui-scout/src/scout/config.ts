import path from 'path';
import { isSauceDemoBase } from './auth';
import type { ScoutRunOptions, ViewportProfile } from './types';

export const DEFAULT_VIEWPORTS: ViewportProfile[] = [
  { name: 'mobile', width: 390, height: 844, isMobile: true },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return !['0', 'false', 'no', 'off'].includes(raw.toLowerCase());
}

/**
 * Resolve scout options from env so testers can point at any app without code changes.
 *
 * BASE_URL + SCOUT_AUTH control the target site / login.
 * SCOUT_START_PATH / SCOUT_SEED_PATHS / SCOUT_MAX_PAGES / SCOUT_VIEWPORTS
 * SCOUT_EXCLUDE / SCOUT_MAX_CLICKS / SCOUT_SCREENSHOTS
 * SCOUT_A11Y / SCOUT_CONTENT / SCOUT_INTERACTION / SCOUT_VISUAL
 * SCOUT_MAX_TAB_STOPS / SCOUT_MAX_FORM_PROBES / SCOUT_MAX_TOOLTIP_PROBES
 * SCOUT_UPDATE_BASELINES / SCOUT_VISUAL_THRESHOLD / SCOUT_VISUAL_MASK
 * SCOUT_PROBE_EXTERNAL / SCOUT_PROBE_SOCIAL / SCOUT_DEDUPE
 */
export function resolveScoutOptions(outputRoot = path.join(process.cwd(), 'scout-report')): ScoutRunOptions {
  const sauceDefaults = isSauceDemoBase();
  const excludeRaw = process.env.SCOUT_EXCLUDE ?? 'logout,reset,sign-out,signout';
  const excludePathPatterns = excludeRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => new RegExp(s, 'i'));

  const seedRaw =
    process.env.SCOUT_SEED_PATHS ??
    (sauceDefaults ? '/inventory.html,/cart.html,/checkout-step-one.html' : '/');

  return {
    startPath: process.env.SCOUT_START_PATH ?? (sauceDefaults ? '/inventory.html' : '/'),
    seedPaths: seedRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    maxPages: Number(process.env.SCOUT_MAX_PAGES ?? 20),
    sameOriginOnly: true,
    excludePathPatterns,
    captureScreenshots: envFlag('SCOUT_SCREENSHOTS', true),
    screenshotDir: path.join(outputRoot, 'screenshots'),
    maxClickProbes: Number(process.env.SCOUT_MAX_CLICKS ?? 12),
    runA11y: envFlag('SCOUT_A11Y', true),
    runContent: envFlag('SCOUT_CONTENT', true),
    runInteraction: envFlag('SCOUT_INTERACTION', true),
    maxTabStops: Number(process.env.SCOUT_MAX_TAB_STOPS ?? 20),
    maxFormProbes: Number(process.env.SCOUT_MAX_FORM_PROBES ?? 4),
    maxTooltipProbes: Number(process.env.SCOUT_MAX_TOOLTIP_PROBES ?? 10),
    probeExternalLinks: envFlag('SCOUT_PROBE_EXTERNAL', false),
    probeSocialLinks: envFlag('SCOUT_PROBE_SOCIAL', false),
    dedupeIssues: envFlag('SCOUT_DEDUPE', true),
    runVisual: envFlag('SCOUT_VISUAL', true),
    baselineDir: process.env.SCOUT_BASELINE_DIR
      ? path.resolve(process.env.SCOUT_BASELINE_DIR)
      : path.join(process.cwd(), 'scout-baselines'),
    diffDir: path.join(outputRoot, 'diffs'),
    visualMaskSelectors: (process.env.SCOUT_VISUAL_MASK ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    visualThreshold: Number(process.env.SCOUT_VISUAL_THRESHOLD ?? 0.01),
    updateBaselines: envFlag('SCOUT_UPDATE_BASELINES', false),
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
