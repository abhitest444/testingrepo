import { expect, test as setup } from '@playwright/test';
import { prepareScoutAuth, resolveScoutAuthMode, SCOUT_AUTH_FILE } from '../../src/scout/auth';

/**
 * Scout-only auth setup — does not affect e2e `auth.setup.ts`.
 *
 * Modes (SCOUT_AUTH):
 * - none  → empty storage (public sites)
 * - form  → generic login via selectors + credentials env
 * - sauce → Sauce Demo POM (default when BASE_URL is saucedemo)
 */
setup('prepare scout auth', async ({ page }) => {
  const mode = resolveScoutAuthMode();
  // eslint-disable-next-line no-console
  console.log(`[scout-auth] mode=${mode} → ${SCOUT_AUTH_FILE}`);

  const used = await prepareScoutAuth(page);
  expect(used).toBe(mode);
  expect(SCOUT_AUTH_FILE).toBeTruthy();
});
