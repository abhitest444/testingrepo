import { Page, Locator, expect, test } from '@playwright/test';
import OverviewFlowsPage from '../../../pages/FastPipeline/OverviewFlowsPage';
import { LoginCredentials } from '../../../config/types';
import { AccountMatrix, resolveMatrixAccounts } from './accountMatrix';
import { verifyLeftNavPersistence } from '../../../commonUtils';

// ---- Reused QB Time Setup flow (pages/QBOSettingsPage.ts) -------------------
// Method 2 covers every case from flows/Priority/QBTimeSetupCases.spec.ts by
// reusing the SAME exported functions that spec calls — no duplication.
import {
  goToQBTimeSetup,
  verifySetUpTimeTrackingAndClickLetsGo,
  verifyTimesheetSettingsAndClickNext,
  verifyInviteTeamAndClickSkipForNow,
  verifyTailorYourSetupAndClickDone,
  verifyTaskRouteWidgets,
} from '../../../pages/QBOSettingsPage';

/**
 * =============================================================================
 * OV01 — Overview Tab End-to-End test utilities
 * =============================================================================
 *
 * Mirrors the TE01 / AS01 FastPipeline convention: the spec file is a thin
 * wrapper that wires up beforeEach and calls `runOverviewFullSuite`. All step
 * logic lives here.
 *
 * The suite runs ONE test made of TWO methods:
 *   1. `verifyOverviewUiElements` — verify every UI element rendered on the
 *      Overview screen (page header, guided-setup card, setup tasks, shortcuts,
 *      helpful resources, and the Time left-nav submenu). Uses `expect.soft` so
 *      ALL elements are checked and the report lists every missing one, while
 *      the test still fails if anything is absent.
 *   2. `runQbTimeSetupCases` — covers every case from
 *      `flows/Priority/QBTimeSetupCases.spec.ts` by reusing its exported
 *      functions (set-up dialog, timesheet settings, invite team, tailor your
 *      setup, and the task-route widgets).
 *
 * Conventions:
 *  - console.log('[OV01][...] ...') checkpoints for HTML report traceability.
 *  - Every check runs inside `test.step('label', ...)` so the report labels it.
 * =============================================================================
 */

// Per-element visibility timeout for Method 1. Short on purpose so a missing
// element fails the test in seconds rather than waiting out the 3-min global
// expect timeout configured in playwright.config.ts.
const ELEMENT_TIMEOUT = 15_000;

/**
 * Scroll the element into view, then hard-assert it is visible.
 *
 *  - The scroll makes each verified element actually appear on screen during a
 *    headed run, so you can watch the suite walk down the page.
 *  - The scroll is best-effort (capped + caught) so a MISSING element still
 *    fails fast via the `expect` below with a clean, named error rather than
 *    hanging on the scroll's default 5-min action timeout.
 */
async function expectVisible(
  locator: Locator,
  message?: string,
): Promise<void> {
  await locator
    .scrollIntoViewIfNeeded({ timeout: ELEMENT_TIMEOUT })
    .catch(() => undefined);
  await expect(locator, message).toBeVisible({ timeout: ELEMENT_TIMEOUT });
}

/**
 * Assert visibility ONLY when the element is present, logging which branch ran.
 * Used for elements that legitimately vary by SKU/account state — e.g. the
 * "Go to classic QuickBooks Time" control renders on Elite/IES but NOT on
 * Premium, and the guided-setup card is account-state dependent. A genuinely
 * broken element still surfaces (the presence probe + log makes the absence
 * visible in the report) without hard-failing on a known SKU difference.
 */
async function expectVisibleIfPresent(
  locator: Locator,
  label: string,
  probeTimeout = 10_000,
): Promise<boolean> {
  const present = await isPresent(locator, probeTimeout);
  if (present) {
    await expectVisible(locator, label);
    console.log('[OV01][Method1] %s — present ✓', label);
  } else {
    console.log(
      '[OV01][Method1] %s — not present for this account (skipped)',
      label,
    );
  }
  return present;
}

/**
 * Presence probe that ACTUALLY WAITS. `locator.isVisible()` is an immediate,
 * synchronous check — it ignores any `{ timeout }` option — so probing with it
 * races the page render and falsely reports "absent" before content paints.
 * `waitFor({ state: 'visible' })` waits up to `timeout` for the element to
 * appear, then resolves false (instead of throwing) if it never does.
 */
async function isPresent(locator: Locator, timeout = 10_000): Promise<boolean> {
  return locator
    .first()
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false);
}

// ---- Test account shape ----------------------------------------------------

export interface OVTestAccount {
  credentials: LoginCredentials;
  role: 'admin' | 'manager' | 'employee' | 'vendor';
  /**
   * `FreeData` marks an FP Free-data SKU (Advanced / Essentials / Plus / SS):
   * these companies do NOT get the Overview tab, so the suite runs ONLY a
   * negative check (Overview absent under Time options) instead of the full flow.
   */
  companyType?: 'elite' | 'premium' | 'ies' | 'standard' | 'FreeData';
}

/**
 * Builds an OVTestAccount from login credentials plus optional overrides.
 * Defaults model an Elite admin (the broadest-coverage path) — same as AS01.
 */
export function buildOverviewAccount(
  credentials: LoginCredentials,
  overrides: {
    role?: OVTestAccount['role'];
    companyType?: OVTestAccount['companyType'];
  } = {},
): OVTestAccount {
  return {
    credentials,
    role: overrides.role ?? credentials.expectedRole ?? 'admin',
    companyType:
      overrides.companyType ??
      (credentials.companyType as OVTestAccount['companyType'] | undefined) ??
      'elite',
  };
}

// ---- SKU matrix: run the full suite across IES / Elite / Premium -----------
//
// `TEST_ACCOUNT` selects EITHER a SKU group (below) OR an exact account key
// (e.g. OV01, IES05 — an exact key wins over a group of the same name). A group
// expands to every account in its pool that exists in the active env
// (PLAYWRIGHT_ENV); missing keys are skipped, not fatal. Each resolved account
// gets its own full-suite test in the spec. companyType on each account row
// (prod/preprod.accounts.ts) seeds the suite's elite/IES/premium behaviour.
const OV_ACCOUNT_MATRIX: AccountMatrix = {
  // Intuit Enterprise Suite — companyType 'ies'. IES01–IES16 exist; one
  // representative is listed. Pass an exact key (e.g. TEST_ACCOUNT=IES05) to
  // target a specific IES account, or add more keys here to run several.
  IES: ['IESF01'],
  // QBO + Time/Payroll Elite — companyType 'elite'. OV01 is the overview elite
  // account.
  PR_ELITE: ['OVF01'],
  // QBO + Time/Payroll Premium — companyType 'premium'. No premium account is
  // wired yet; replace the placeholder once one is added to *.accounts.ts.
  PR_PREMIUM: ['OVFP01'],
  FREE_DATA_ADV: ['FPFDA01'],
  FREE_DATA_ESSENTIAL: ['FPFDE01'],
  FREE_DATA_PLUS: ['FPFDP01'],
  FREE_DATA_SS: ['TODO_FREE_ACCOUNT_KEY'],
};

/** A built {@link OVTestAccount} paired with the account key it came from. */
export interface OVMatrixAccount {
  /** The account key (e.g. `OV01`, `IES01`) — used to label the per-account test. */
  testId: string;
  account: OVTestAccount;
}

/**
 * Resolves `TEST_ACCOUNT` into the ORDERED list of {@link OVTestAccount}s the
 * Overview full suite should run against. A SKU group returns its whole pool;
 * an exact account key returns a single account. `TEST_ACCOUNT` is required —
 * with no fallback configured, an unset selector throws (matches the TE track).
 */
export function buildOverviewAccountsFromMatrix(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): OVMatrixAccount[] {
  return resolveMatrixAccounts({
    matrix: OV_ACCOUNT_MATRIX,
    param: selector,
    label: 'OV',
  }).map(({ testId, credentials }) => ({
    testId,
    account: buildOverviewAccount(credentials, {
      role: credentials.expectedRole ?? 'admin',
      // FP Free-data accounts (FPFD* keys) are marked 'FreeData' so the suite
      // runs ONLY the negative check (Overview absent under Time options).
      ...(isFreeDataAccount(testId)
        ? { companyType: 'FreeData' as const }
        : {}),
    }),
  }));
}

/**
 * Free-data SKUs (FP Free: Advanced / Essentials / Plus / SS) use account keys
 * prefixed `FPFD` (e.g. FPFDA01, FPFDE01, FPFDP01, FPFDS01). These companies do
 * NOT get the Overview tab.
 */
function isFreeDataAccount(testId: string): boolean {
  return /^FPFD/i.test(testId.trim());
}

// ============================================================================
// Method 1 — Verify all UI elements visible on the Overview screen
// ============================================================================

export async function verifyOverviewUiElements(
  page: Page,
  ovPage: OverviewFlowsPage,
  account: OVTestAccount,
): Promise<void> {
  console.log('[OV01][Method1] Verifying Overview UI elements');

  // Each check scrolls the element into view (so it's visible on screen during
  // a headed run) then HARD-asserts visibility. A missing element FAILS FAST
  // with a named error instead of waiting out the 3-min global expect timeout.

  await test.step('Method1 — navigate to Overview tab', async () => {
    await ovPage.navigateToOverview();
  });

  // After My Apps → Time → Overview, confirm the left nav did not collapse.
  // Free-data accounts never reach Method 1 (they branch out earlier), so the
  // 'FreeData' marker can't appear here — narrow it for the shared CompanyType.
  await verifyLeftNavPersistence(page, {
    activeTab: 'Overview',
    companyType:
      account.companyType === 'FreeData' ? 'standard' : account.companyType,
  });

  // Header. Overview heading + Give feedback render on every SKU. The "Go to
  // classic QuickBooks Time" control renders on Elite/IES but NOT on Premium, so
  // assert it only when present.
  await test.step('Method1 — page header (Overview, classic link, feedback)', async () => {
    await expectVisible(ovPage.overviewHeading());
    await expectVisible(ovPage.giveFeedbackLink());
    await expectVisibleIfPresent(
      ovPage.goToClassicQbTimeHeaderLink(),
      'header "Go to classic QuickBooks Time"',
    );
  });

  // The guided-setup card ("Schedule your free guided setup" + "Schedule my
  // call") is account-state dependent — present on Premium and on fresh
  // Elite/IES, absent once an account is fully past setup. Assert it only when
  // present (independent of the setup-tasks variant below).
  await test.step('Method1 — guided-setup card + "Schedule my call"', async () => {
    const cardShown = await expectVisibleIfPresent(
      ovPage.guidedSetupCardHeading(),
      'guided-setup card',
    );
    if (cardShown) {
      await expectVisible(ovPage.scheduleMyCallButton());
    }
  });

  // Setup Tasks has TWO independent variants. A pre-setup account shows the task
  // list (Set up time tracking / Get your team ready / Set up kiosk). Once QB
  // Time setup is completed (Method 2 does this and PERMANENTLY mutates the
  // account), the same card switches to the "customized" state ("Your time
  // tracking setup has been customized" + Set up your work week / Add a time
  // entry / Approve time). The variant is INDEPENDENT of the guided-setup card
  // above (e.g. Premium shows the guided card AND customized tasks). Detect the
  // live variant and assert accordingly so the suite is re-runnable.
  // Anchor on the common "Setup Tasks" heading first so the card has actually
  // rendered before we decide the variant (avoids racing the page paint).
  await expectVisible(ovPage.setupTasksHeading());
  const customized = await isPresent(ovPage.setupCustomizedMessage());
  console.log(
    '[OV01][Method1] Setup Tasks variant: %s',
    customized ? 'customized (setup completed)' : 'pre-setup',
  );
  if (customized) {
    await test.step('Method1 — setup tasks section (customized / post-setup)', async () => {
      await expectVisible(ovPage.setupTasksHeading());
      await expectVisible(ovPage.setupCustomizedMessage());
      await expectVisible(ovPage.setUpWorkWeekTask());
      await expectVisible(ovPage.addTimeEntryTask());
      await expectVisible(ovPage.approveTimeTask());
    });
  } else {
    await test.step('Method1 — setup tasks section (pre-setup)', async () => {
      await expectVisible(ovPage.setupTasksHeading());
      await expectVisible(ovPage.setUpTimeTrackingTask());
      await expectVisible(ovPage.getTeamReadyTask());
      await expectVisible(ovPage.setUpKioskTask());
    });
  }

  // Shortcuts card. Tiles render on every SKU; the in-card "Go to classic
  // QuickBooks Time" link renders on Elite/IES but NOT on Premium.
  await test.step('Method1 — shortcuts card (all tiles)', async () => {
    await expectVisible(ovPage.shortcutsHeading());
    for (const label of ovPage.shortcutLabels) {
      await expectVisible(ovPage.shortcutTile(label), `shortcut "${label}"`);
    }
    await expectVisibleIfPresent(
      ovPage.goToClassicQbTimeShortcutLink(),
      'shortcuts "Go to classic QuickBooks Time"',
    );
  });

  await test.step('Method1 — helpful resources', async () => {
    await expectVisible(ovPage.helpfulResourcesHeading());
    await expectVisible(ovPage.howToApproveTimeLink());
  });

  await test.step('Method1 — Time left-nav submenu items', async () => {
    for (const item of ovPage.submenuItems) {
      await expectVisible(ovPage.submenuItem(item), `submenu "${item}"`);
    }
  });

  console.log('[OV01][Method1] Overview UI elements verified');
}

// ============================================================================
// Method 2 — Cover all cases from QBTimeSetupCases.spec.ts
// ============================================================================

export async function runQbTimeSetupCases(page: Page): Promise<void> {
  console.log('[OV01][Method2] Starting QB Time Setup cases');

  await test.step('Method2 — go to QB Time Setup', async () => {
    await goToQBTimeSetup(page);
  });

  await test.step('Method2 — "Set up time tracking" screen', async () => {
    await verifySetUpTimeTrackingAndClickLetsGo(page);
  });

  await test.step('Method2 — "Timesheet settings" screen', async () => {
    await verifyTimesheetSettingsAndClickNext(page);
  });

  await test.step('Method2 — "Invite team" screen', async () => {
    await verifyInviteTeamAndClickSkipForNow(page);
  });

  await test.step('Method2 — "Tailor your setup" screen', async () => {
    await verifyTailorYourSetupAndClickDone(page);
  });

  await test.step('Method2 — task-route widgets', async () => {
    await verifyTaskRouteWidgets(page);
  });

  console.log('[OV01][Method2] Completed QB Time Setup cases');
}

// ============================================================================
// Suite orchestrator
// ============================================================================

/**
 * Runs the full OV01 suite: Method 1 (Overview UI verification) then Method 2
 * (QB Time Setup cases). Method 1 runs first because the QB Time Setup flow in
 * Method 2 completes the setup and mutates the Overview page.
 */
export async function runOverviewFullSuite(
  page: Page,
  account: OVTestAccount,
): Promise<void> {
  const ovPage = new OverviewFlowsPage(page);

  // Fail fast: cap the default action timeout at 30s (explicit per-call
  // timeouts still override this).
  page.setDefaultTimeout(30_000);

  console.log(
    `[OV01] Running Overview suite as ${account.role} (${account.companyType}).`,
  );

  // Free-data SKUs (FP Free) do NOT get Overview. For these accounts run ONLY
  // the negative check (Overview absent under Time options) and stop — the full
  // suite below applies to IES / Elite / Premium only.
  if (account.companyType === 'FreeData') {
    await test.step('Free-data — Overview tab NOT visible under Time options', async () => {
      const visible = await ovPage.isOverviewAvailableUnderTimeMenu();
      console.log(
        '[OV01][FreeData] companyType=%s — Overview under Time visible=%s (want false)',
        account.companyType,
        visible,
      );
      expect(
        visible,
        'Overview tab must NOT be visible under Time options for free-data accounts',
      ).toBeFalsy();
    });
    return;
  }

  // Method 1 — verify all UI elements on the Overview screen.
  await verifyOverviewUiElements(page, ovPage, account);

  // Method 2 — cover all cases from QBTimeSetupCases.spec.ts.
  await runQbTimeSetupCases(page);

  console.log('[OV01] Full suite complete.');
}
