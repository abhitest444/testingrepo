import { Page } from '@playwright/test';

const TRANSIENT_NAV_ERROR =
  /net::ERR_CONNECTION_RESET|net::ERR_CONNECTION_CLOSED|net::ERR_CONNECTION_ABORTED|ERR_NETWORK_CHANGED|ECONNRESET|ERR_INTERNET_DISCONNECTED/i;

const MAX_NAV_ATTEMPTS = 3;

function isTransientNavigationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return TRANSIENT_NAV_ERROR.test(message);
}

/**
 * Navigate to a URL while preserving the intuit_authn_session_slot query parameter
 * from the current page URL.
 *
 * Retries briefly on transient network errors (e.g. net::ERR_CONNECTION_RESET)
 * that are common against Intuit hosts when VPN/proxy flaps.
 *
 * Note: JSDoc types here deliberately use `{object}` instead of playwright-specific
 * types. ESLint's valid-jsdoc rule rejects TypeScript-style types like
 * `{Page}` or `{Promise<import('@playwright/test').Response | null>}`, so the
 * JSDoc stays permissive while the real typing is enforced by the function
 * signature below. Do NOT change these JSDoc types to named TS types.
 *
 * @param {object} page - The Playwright Page object
 * @param {string} url - The target URL to navigate to
 * @param {object} [options] - Optional navigation options (same as page.goto options)
 * @returns {Promise<object>} The navigation response (Playwright Response | null)
 */
async function gotoWithAuthSession(
  page: Page,
  url: string,
  options?: Parameters<Page['goto']>[1],
): ReturnType<Page['goto']> {
  let targetUrl = url;
  const currentUrl = new URL(page.url());
  const sessionSlot = currentUrl.searchParams.get('intuit_authn_session_slot');
  if (sessionSlot) {
    const parsedTarget = new URL(url, currentUrl.origin);
    if (!parsedTarget.searchParams.has('intuit_authn_session_slot')) {
      parsedTarget.searchParams.set('intuit_authn_session_slot', sessionSlot);
    }
    targetUrl = parsedTarget.toString();
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_NAV_ATTEMPTS; attempt++) {
    try {
      return await page.goto(targetUrl, options);
    } catch (error) {
      lastError = error;
      if (!isTransientNavigationError(error) || attempt === MAX_NAV_ATTEMPTS) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      console.log(
        `[gotoWithAuthSession] Transient nav error (attempt ${attempt}/${MAX_NAV_ATTEMPTS}): ${
          message.split('\n')[0]
        }; retrying...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}

export default gotoWithAuthSession;
