import { Page } from '@playwright/test';

/**
 * Network throttling for Playwright via the Chrome DevTools Protocol (CDP).
 *
 * Playwright has no built-in throttling profiles (unlike Puppeteer), so we drive
 * `Network.emulateNetworkConditions` (and optionally `Emulation.setCPUThrottlingRate`)
 * over a CDP session. This is CHROMIUM-ONLY — on Firefox/WebKit projects it is a no-op.
 *
 * The active profile is selected by the `NETWORK_PROFILE` env var (set by the
 * Jenkins job / Groovy pipeline), defaulting to `no-throttle`.
 */

export type NetworkProfileName =
  | 'no-throttle'
  | 'slow-3g'
  | 'fast-3g'
  | 'fast-4g';

interface NetworkConditions {
  offline: boolean;
  /** Download speed in bytes/sec. */
  downloadThroughput: number;
  /** Upload speed in bytes/sec. */
  uploadThroughput: number;
  /** Minimum round-trip latency in ms. */
  latency: number;
}

/** Optional extra CPU slowdown per profile (1 = no throttle, 4 = 4x slower). */
const CPU_THROTTLE_RATE: Record<NetworkProfileName, number> = {
  'no-throttle': 1,
  'slow-3g': 4,
  'fast-3g': 2,
  'fast-4g': 1,
};

const kbps = (kbits: number): number => (kbits * 1024) / 8;
const mbps = (mbits: number): number => (mbits * 1024 * 1024) / 8;

/**
 * Emulation values roughly matching Chrome DevTools' built-in presets.
 * `no-throttle` intentionally has no entry (full speed = no emulation applied).
 */
const NETWORK_PROFILES: Record<
  Exclude<NetworkProfileName, 'no-throttle'>,
  NetworkConditions
> = {
  'slow-3g': {
    offline: false,
    downloadThroughput: kbps(500), // 500 Kbps
    uploadThroughput: kbps(500),
    latency: 400,
  },
  'fast-3g': {
    offline: false,
    downloadThroughput: mbps(1.6), // 1.6 Mbps
    uploadThroughput: kbps(750),
    latency: 150,
  },
  'fast-4g': {
    offline: false,
    downloadThroughput: mbps(4), // 4 Mbps
    uploadThroughput: mbps(3),
    latency: 20,
  },
};

const VALID_PROFILES = new Set<NetworkProfileName>([
  'no-throttle',
  'slow-3g',
  'fast-3g',
  'fast-4g',
]);

/** Resolve the profile from an explicit arg or the NETWORK_PROFILE env var. */
export const resolveNetworkProfile = (profile?: string): NetworkProfileName => {
  const raw = (profile ?? process.env.NETWORK_PROFILE ?? 'no-throttle').trim();
  return VALID_PROFILES.has(raw as NetworkProfileName)
    ? (raw as NetworkProfileName)
    : 'no-throttle';
};

/** True only for Chromium-backed pages, where CDP is available. */
const isChromium = (page: Page): boolean => {
  try {
    return page.context().browser()?.browserType().name() === 'chromium';
  } catch {
    return false;
  }
};

/**
 * Apply network (and optional CPU) throttling to a page via CDP.
 *
 * Safe to call unconditionally: it no-ops for `no-throttle`, unknown values, and
 * non-Chromium browsers, and never throws (throttling must not fail the test run).
 *
 * IMPORTANT: apply this AFTER login/auth so the auth handshake isn't throttled
 * (slow-3g latency can otherwise blow past login timeouts). Call once per page;
 * pages opened later (new tabs/popups) need their own call.
 *
 * @param page - The Playwright Page to throttle.
 * @param profile - Profile name; defaults to the NETWORK_PROFILE env var.
 */
export async function applyNetworkThrottling(
  page: Page,
  profile?: string,
): Promise<void> {
  const resolved = resolveNetworkProfile(profile);

  if (resolved === 'no-throttle') {
    return;
  }

  if (!isChromium(page)) {
    // eslint-disable-next-line no-console
    console.log(
      `[throttle] NETWORK_PROFILE="${resolved}" ignored — CDP throttling is Chromium-only.`,
    );
    return;
  }

  try {
    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');
    await client.send(
      'Network.emulateNetworkConditions',
      NETWORK_PROFILES[resolved],
    );

    const cpuRate = CPU_THROTTLE_RATE[resolved];
    if (cpuRate > 1) {
      await client.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
    }

    // eslint-disable-next-line no-console
    console.log(
      `[throttle] Applied network profile "${resolved}" (CPU ${cpuRate}x).`,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(
      `[throttle] Failed to apply "${resolved}": ${
        (error as Error)?.message ?? error
      }`,
    );
  }
}

export default applyNetworkThrottling;
