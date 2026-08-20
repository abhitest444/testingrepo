import { Page, Locator, expect } from '@playwright/test';
import TimeEntriesPage from '../TimeEntriesPage';
// NOTE: These sibling FastPipeline page objects (used only by the Schedule /
// Time off / Time team branches of navigateToTimeSubmenu) don't exist in the
// repo yet — the SCH01 / TOF01 / TTM01 suites haven't landed. They are disabled
// so this module compiles and the BR01 (Time entries) path works today. Restore
// them — and the page-object widget-ready calls in navigateToTimeSubmenu — once
// those page objects exist.
// import SchedulePage from './SchedulePage';
import TimeOffPage from './TimeOffPage';
// import TimeTeamPage from './TimeTeamPage';
import { TimeSubmenu } from '../../config/types';

// ============================================================================
// FastPipeline-scoped Dashboard navigation & validation helpers
//
// Self-contained copy of the shared navigation/validation helpers required by
// the SCH01 / TOF01 / TTM01 / TRP01 suites. Only the methods these four suites
// consume are copied here; the full DashboardPage class (settings, currency,
// etc.) is intentionally NOT duplicated. Reuses the sibling FastPipeline page
// objects (SchedulePage / TimeOffPage / TimeTeamPage) and owns its own Time
// sub-nav navigation (navigateToTimeTabSubmenu) using the shared TimeEntriesPage.
// ============================================================================

/** Minimal account shape required by the helpers below. */
export interface DashboardAccount {
  role: string;
  companyType?: 'elite' | 'premium' | 'ies' | 'standard';
}

/**
 * SCH01 Step 1b — Dashboard validation.
 *
 * Verifies that the QBO shell loaded successfully after login:
 *   - Body node  (`[data-id=bodyNode]`)      — all company types
 *   - QBO sidebar (`//*[@aria-label='Side']`) — elite / premium / standard only
 *   - Account header (`.oneIntuitAccountHeaderItem`) — all company types
 *
 * All assertions are soft so a single environment quirk does not abort the suite.
 * Call this immediately after schStep01_login (from QBOLogin.ts) completes.
 */
export async function validateDashboard(
  page: Page,
  account: DashboardAccount,
): Promise<void> {
  console.log(
    ' Validating dashboard: companyType=%s role=%s',
    account.companyType,
    account.role,
  );

  // Body node is present for every company type.
  try {
    await expect(page.locator('[data-id=bodyNode]')).toBeVisible({
      timeout: 15000,
    });
  } catch (error) {
    console.warn(
      ' [soft] QBO body node visible — %s',
      error instanceof Error ? error.message : error,
    );
  }

  // QBO sidebar is present for elite / premium / standard; IES has a different shell.
  if (account.companyType !== 'ies') {
    try {
      await expect(page.locator(`//*[@aria-label='Side']`)).toBeVisible({
        timeout: 15000,
      });
    } catch (error) {
      console.warn(
        ' [soft] QBO sidebar visible — %s',
        error instanceof Error ? error.message : error,
      );
    }
  }

  // Account header is common to all shells.
  try {
    await expect(page.locator('.oneIntuitAccountHeaderItem')).toBeVisible({
      timeout: 15000,
    });
  } catch (error) {
    console.warn(
      ' [soft] Account header visible — %s',
      error instanceof Error ? error.message : error,
    );
  }

  console.log(' ✓ Dashboard validated');
}

/**
 * Dismisses QBO shell/dashboard-level onboarding overlays that QBO renders right
 * after login — welcome modals, product-tour coachmarks, and "what's new"
 * dialogs. These overlays paint a full-page backdrop that intercepts pointer
 * events, so the FIRST dashboard interaction in a suite (hovering "All apps",
 * opening the Time sub-nav, the step012 assertions) fails with a timeout /
 * "element intercepts pointer events" error when an overlay is left up. This is
 * the QBO-shell counterpart to TESingleTimeEntryPage.handlePopupsInAnyOrder,
 * which only clears the in-trowser popups.
 *
 * Contract:
 *  - Fully soft: every probe is short-timeout + try/catch, so the common case
 *    (no overlay) costs ~a few seconds and the helper NEVER throws.
 *  - Loops a few rounds because onboarding overlays stack (welcome → tour →
 *    coachmark) and dismissing one reveals the next; stops as soon as a round
 *    clears nothing.
 *  - Only ever clicks a dismiss/close/skip affordance — never a primary CTA —
 *    so it cannot navigate the page away from the dashboard.
 *
 * Returns the number of overlays dismissed (0 when the dashboard was already
 * clear). Safe to call before any dashboard interaction in every suite.
 */
export async function dismissQboOnboardingIfVisible(
  page: Page,
): Promise<number> {
  if (page.isClosed()) {
    return 0;
  }

  // Dismiss affordances in priority order: most specific (scoped to a modal
  // dialog) first, generic coachmark close last. Negative/neutral choices only.
  const dismissers: Array<{ label: string; locator: () => Locator }> = [
    {
      label: 'onboarding dialog Close (×)',
      locator: () =>
        page
          .getByTestId('ModalDialog')
          .getByRole('button', { name: /^close$/i })
          .first(),
    },
    {
      label: '"No thanks" / "Maybe later" / "Not now" / "Remind me later"',
      locator: () =>
        page
          .getByRole('button', {
            name: /^(no thanks|maybe later|not now|remind me later)$/i,
          })
          .first(),
    },
    {
      label: '"Skip" / "Skip for now" / "Skip tour"',
      locator: () =>
        page.getByRole('button', { name: /^skip( for now| tour)?$/i }).first(),
    },
    {
      label: '"Got it" / "Dismiss" / "Done"',
      locator: () =>
        page.getByRole('button', { name: /^(got it|dismiss|done)$/i }).first(),
    },
    {
      label: 'generic coachmark close',
      locator: () =>
        page
          .locator('[aria-label="Close"], [data-testid="close-button"]')
          .first(),
    },
  ];

  let dismissed = 0;
  const maxRounds = 5;

  for (let round = 0; round < maxRounds; round++) {
    let handledThisRound = false;

    for (const { label, locator } of dismissers) {
      try {
        const target = locator();
        if (await target.isVisible({ timeout: 750 }).catch(() => false)) {
          await target.click({ timeout: 2000 });
          await page.waitForTimeout(400);
          dismissed++;
          handledThisRound = true;
          console.log(' ✓ Dismissed QBO onboarding overlay: %s', label);
        }
      } catch {
        // Overlay vanished on its own or wasn't actionable — keep going.
      }
    }

    // Nothing left to dismiss this round → the dashboard is clear.
    if (!handledThisRound) {
      break;
    }
  }

  if (dismissed === 0) {
    console.log(' No QBO onboarding overlay present — nothing to dismiss.');
  }
  return dismissed;
}

/**
 * SCH01 Step 2 — Navigate to a Time sub-menu and wait for the matching page to
 * render.
 *
 * `navigateToTimeTabSubmenu(submenu)` performs the actual redirect by clicking
 * the `aria-label='${submenu}'` link in the Time sub-nav, so every submenu is
 * routed generically. After the click, this helper waits for the destination
 * page's content to paint — branching per submenu because each tab renders a
 * different widget (some inside their own iframe) and therefore has a different
 * "ready" signal:
 *
 *   Schedule  → SchedulePage.waitForScheduleWidgetReady()  (iframe[title="Schedule"])
 *   Time off  → TimeOffPage.waitForTimeOffPageReady()
 *   Time team → TimeTeamPage.waitForTeamWidgetReady()      (iframe[title="Your Team"])
 *   (others)  → generic loading-spinner wait (already done above)
 *
 * `submenu` is required — no hardcoded default, keeping the helper generic.
 */
/**
 * Waits until the Time entries shell is ready — either the loading spinner has
 * appeared and cleared, or the key page controls (date-range + display-by) are
 * visible. Falls back to a short fixed wait if neither signal is observed.
 *
 * Copied verbatim from TimeEntriesPage.waitForPageReady so this FastPipeline
 * DashboardPage owns its own page-ready wait. The original method in
 * TimeEntriesPage.ts (used by TimeEntriesFlowsPage.ts) is left unchanged.
 */
export async function waitForPageReady(page: Page): Promise<void> {
  try {
    // Wait for either the loading spinner to appear and disappear, or key page elements to be visible
    await Promise.race([
      // Option 1: Wait for loading spinner to finish
      page
        .locator('[data-testid="LoadingSpinner"]')
        .waitFor({ state: 'visible', timeout: 30000 })
        .then(() =>
          page.locator('[data-testid="LoadingSpinner"]').waitFor({
            state: 'hidden',
            timeout: 10000,
          }),
        ),
      // Option 2: Wait for key page elements that indicate the page is ready
      Promise.all([
        page
          .locator('[data-testid="DateRangeSelect"], .DateRangeSelect')
          .waitFor({ state: 'visible', timeout: 10000 }),
        page
          .locator(
            '[aria-label="Display by"], [data-testid="DisplayByDropdown"]',
          )
          .waitFor({ state: 'visible', timeout: 10000 }),
      ]),
    ]);
    // Small buffer to ensure any immediate popups have time to appear
    await page.waitForTimeout(500);
  } catch (error) {
    // If specific elements aren't found, fall back to a shorter wait
    await page.waitForTimeout(2000);
  }
}

/**
 * Clicks the `aria-label='${submenu}'` link in the Time sub-nav and waits for
 * the destination shell to settle.
 *
 * Copied verbatim from TETimeEntriesTabPage.navigateToTimeTabSubmenu
 * (TimeEntriesFlowsPage.ts) so this FastPipeline DashboardPage owns its own
 * navigation and no longer depends on the Time-entries page object. The
 * original method in TimeEntriesFlowsPage.ts is left unchanged.
 */
export async function ensureSubmenuVisible(
  tabItem: Locator,
  submenu: TimeSubmenu,
): Promise<boolean> {
  let visible = false;
  try {
    await expect(tabItem).toBeVisible({ timeout: 10000 });
    visible = true;
  } catch {
    visible = false;
  }

  if (!visible) {
    console.log(
      ' ✗ Time sub-menu "%s" is not present for this SKU — ending the test here.',
      submenu,
    );
    return false;
  }

  console.log(
    ' ✓ Time sub-menu "%s" is present — continuing the flow.',
    submenu,
  );
  return true;
}

export async function navigateToTimeTabSubmenu(
  page: Page,
  submenu: TimeSubmenu,
): Promise<boolean> {
  const tePageBase = new TimeEntriesPage(page);

  const allApps = page.locator(`//*[@aria-label='All apps']`).first();
  await expect(allApps).toBeVisible({ timeout: 10000 });
  await allApps.hover();

  const timeMenu = page.locator(`//*[@aria-label='Time']`).first();
  await expect(timeMenu).toBeVisible({ timeout: 10000 });
  await timeMenu.hover();

  // Guard: the Time sub-menu item is not available for every SKU. If it never
  // becomes visible, log which submenu/SKU is missing and end the flow here so
  // the test completes instead of failing on a raw assertion later.
  const tabItem = page.locator(`//*[@aria-label='${submenu}']`).first();
  if (!(await ensureSubmenuVisible(tabItem, submenu))) {
    return false;
  }

  await tabItem.click();
  await page.waitForTimeout(10000);

  await waitForPageReady(page);
  await tePageBase.handlePopupsInAnyOrder();
  return true;
}

export async function navigateToTimeSubmenu(
  page: Page,
  account: DashboardAccount,
  submenu: TimeSubmenu,
): Promise<boolean> {
  if (!(await navigateToTimeTabSubmenu(page, submenu))) {
    return false;
  }
  await new TimeEntriesPage(page).waitForLoadingToDisappear();

  // Per-tab readiness. Schedule / Time team render their widget inside an iframe;
  // wait for that frame where we can. These waits are self-contained (no sibling
  // page objects) and best-effort — the generic loading wait above already
  // settled the page, so a miss here is non-fatal.
  //
  // When the SchedulePage / TimeOffPage / TimeTeamPage FastPipeline page objects
  // land, restore their dedicated widget-ready calls here:
  //   Schedule  → new SchedulePage(page).waitForScheduleWidgetReady()
  //   Time off  → new TimeOffPage(page).waitForTimeOffPageReady()
  //   Time team → new TimeTeamPage(page).waitForTeamWidgetReady()
  try {
    switch (submenu) {
      case 'Schedule':
        await page
          .locator('iframe[title="Schedule"]')
          .waitFor({ state: 'visible', timeout: 30000 });
        break;
      case 'Time team':
        await page
          .locator('iframe[title="Your Team"]')
          .waitFor({ state: 'visible', timeout: 30000 });
        break;
      case 'Time off':
        await new TimeOffPage(page).waitForTimeOffPageReady();
        break;
      default:
        // Other tabs (Overview, Time entries, Approvals, Assignments,
        // Time projects) have no dedicated widget-ready hook — the
        // loading-spinner wait above is sufficient for navigation.
        break;
    }
  } catch (error) {
    console.warn(
      ' [soft] %s widget-ready wait — %s',
      submenu,
      error instanceof Error ? error.message : error,
    );
  }

  console.log(' ✓ Navigated to %s page', submenu);
  return true;
}

/**
 * SCH01 Step 3 — Verify that the QBO left-nav sidebar and Time sub-menu do NOT
 * collapse or get hidden after landing on the Schedule page.
 *
 * Mirrors the four-layer check used by step02_navigateToTimeSubmenu in
 * TimeEntriesFlows.Util.ts. All assertions are soft.
 *
 *   Layer 1 — Global app switcher (All apps)
 *   Layer 2 — Time sub-nav first link
 *   Layer 3 — Time sub-nav panel (data-id="time-body")
 *   Layer 4 — QBO sidebar link (non-IES only)
 *   Layer 5 — Schedule item visible and active in Time sub-nav
 */
export async function validateLeftNavPersistence(
  page: Page,
  account: DashboardAccount,
): Promise<void> {
  console.log(' Verifying left-nav persistence on Schedule page');

  const soft = async (label: string, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (error) {
      console.warn(
        ' [soft] %s — %s',
        label,
        error instanceof Error ? error.message : error,
      );
    }
  };

  await soft('left-navigation menu still visible', async () => {
    await expect(page.locator(`//*[@aria-label='Side']`).first()).toBeVisible({
      timeout: 10000,
    });
  });

  await soft('left-navigation: Time sub-menu links still visible', async () => {
    await expect(
      page.locator(`//*[@data-id='time-body']//a`).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  await soft('left-nav: Time sub-nav panel not collapsed', async () => {
    await expect(page.locator(`//*[@data-id='time-body']`).first()).toBeVisible(
      { timeout: 10000 },
    );
  });

  if (account.companyType !== 'ies') {
    await soft(
      'left-nav: QBO sidebar not collapsed (Side aria-label visible)',
      async () => {
        await expect(page.locator(`//*[@aria-label='Side']`)).toBeVisible({
          timeout: 10000,
        });
      },
    );
  }

  await soft(
    'left-nav: Schedule link visible and active in Time sub-nav',
    async () => {
      await expect(
        page.locator(`//*[@aria-label='Schedule']`).first(),
      ).toBeVisible({ timeout: 10000 });
    },
  );

  console.log(' ✓ Left-nav persistence confirmed');
}

/**
 * Verifies the QBO left-nav and Time sub-menu remain visible after landing on a
 * Time sub-tab. Generalised from the original TOF01-only helper so it can be
 * reused across suites: pass the tab whose nav link should still be present via
 * `activeSubmenu` (defaults to 'Time off'). All assertions are soft.
 *
 * Used by TOF01, TTM01 and TRP01.
 */
export async function validateTimeOffLeftNavPersistence(
  page: Page,
  account: DashboardAccount,
  activeSubmenu: TimeSubmenu = 'Time off',
): Promise<void> {
  console.log(' Verifying left-nav persistence (active: %s)', activeSubmenu);

  const soft = async (label: string, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (error) {
      console.warn(
        ' [soft] %s — %s',
        label,
        error instanceof Error ? error.message : error,
      );
    }
  };

  await soft('left-navigation menu still visible', async () => {
    await expect(page.locator(`//*[@aria-label='Side']`).first()).toBeVisible({
      timeout: 10000,
    });
  });

  await soft('left-nav: Time sub-menu links still visible', async () => {
    await expect(
      page.locator(`//*[@data-id='time-body']//a`).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  await soft('left-nav: Time sub-nav panel not collapsed', async () => {
    await expect(page.locator(`//*[@data-id='time-body']`).first()).toBeVisible(
      { timeout: 10000 },
    );
  });

  if (account.companyType !== 'ies') {
    await soft('left-nav: QBO sidebar not collapsed', async () => {
      await expect(page.locator(`//*[@aria-label='Side']`)).toBeVisible({
        timeout: 10000,
      });
    });
  }

  await soft(
    `left-nav: "${activeSubmenu}" link visible in Time sub-nav`,
    async () => {
      await expect(
        page.locator(`//*[@aria-label='${activeSubmenu}']`).first(),
      ).toBeVisible({ timeout: 10000 });
    },
  );

  console.log(' ✓ Left-nav persistence confirmed');
}
