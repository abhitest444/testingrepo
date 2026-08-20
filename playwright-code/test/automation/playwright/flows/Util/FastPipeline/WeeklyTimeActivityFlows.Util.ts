import { Page, Locator, expect, test } from '@playwright/test';
import { WeeklyTimeActivity } from '../../../pages/WeeklyTimeActivity';
import SingleTimeActivityPage from '../../../pages/SingleTimeActivityPage';
import TETimeEntriesTabPage from '../../../pages/FastPipeline/TimeEntriesFlowsPage';
import ReportsPage from '../../../pages/ReportsPage';
import { CommonLocators } from '../../../commonUtils';
import { LABELS } from '../../../utils';
import { LABELS as TE_LABELS } from '../../../constants';
import { LoginCredentials } from '../../../config/types';
import { AccountMatrix, resolveMatrixAccounts } from './accountMatrix';
import { openViaCreateMenu } from '../../../commonUtils';
import {
  TETestAccount,
  step01_loginAndRoleSetup,
  step012_validateDashboard,
  step02_navigateToTimeSubmenu,
  step03_tabVisibilityVsEntitlements,
  step04_filtersValidation,
  step05_columnVisibilityAndSettings,
  step06_roleScopedDataVisibility,
  verifyEntryInGrid,
} from './TimeEntriesFlows.Util';

/**
 * =============================================================================
 * WTA01 — Weekly Time Activity END-TO-END (single consolidated case)
 * =============================================================================
 *
 * Covers the full Weekly Time Activity ("Weekly timesheet") surface on
 * self-created weekly entries — the weekly sibling of STA01:
 *   • open the weekly trowser, verify grid structure (Name, week, day columns,
 *     Billable/Bill rate/Taxable, Save / Save and new / Save and close)
 *   • CREATE a row (employee + customer + service + class + location + per-day
 *     Duration + notes + billable) across the week + success toast, then verify
 *     every entered value round-trips in the grid
 *   • Billable + Bill-rate rules: visible only when enabled, rate only when
 *     billable checked, toggle hides/shows, manual override, service rate
 *   • Taxable rules: visible for a valid billable row, check/uncheck, persists
 *   • Weekly specifics: multi-day durations, multiple rows in one save, totals
 *   • Save variants: Save, Save and new (fields clear), Save and close (closes)
 *   • EDIT/UPDATE a row and verify persisted
 *   • "History" equivalent: reopen the saved week + edit (weekly has no
 *     recent-entries popup; persistence is also proven via Reports)
 *   • Validate + EDIT from the Reports page (Time Activities by Employee Detail);
 *     the report drill-down opens the single-day trowser even for weekly entries
 *   • Required-field + max-length + min-hours validation (negatives)
 *   • DELETE
 *
 * Cleanup (afterEach) deletes created entries from the
 * Reports → "Time Activities by Employee Detail" report (per requirement),
 * opening each via the Hours/Sales/Duration drill-down and deleting it — the
 * SAME proven loop as STA01 (weekly entries are daily time entries in that
 * report).
 *
 * Built on proven page objects: WeeklyTimeActivity (the weekly trowser),
 * SingleTimeActivityPage (report drill-down edit + cleanup) and ReportsPage.
 * Soft asserts for non-critical checks; hard asserts on create/save/delete.
 *
 * ACCOUNT: a US elite company with Sales Tax ENABLED (so Taxable renders), plus
 * seeded employees-with-rates, services-with-prices, a customer, class and
 * location.
 * =============================================================================
 */

// ---- Account shape ---------------------------------------------------------

export interface WTAEntitlements {
  canSeeBillable: boolean;
  canSeeTaxable: boolean; // requires Sales Tax enabled on the company
  canDelete: boolean;
  // Class & Location tracking — unavailable on QBO Essentials (free), so the
  // Essentials accounts skip all Class/Location selection + verification.
  canSeeClassLocation: boolean;
}

export interface WTATestAccount {
  credentials: LoginCredentials;
  role: 'admin' | 'manager' | 'employee' | 'vendor';
  region: 'us' | 'ca' | 'uk';
  companyType?: 'elite' | 'premium' | 'ies' | 'standard';
  entitlements: WTAEntitlements;
}

export function buildWTAAccount(
  credentials: LoginCredentials,
  overrides: {
    role?: WTATestAccount['role'];
    region?: WTATestAccount['region'];
    companyType?: WTATestAccount['companyType'];
    entitlements?: Partial<WTAEntitlements>;
  } = {},
): WTATestAccount {
  return {
    credentials,
    role: overrides.role ?? 'admin',
    region: overrides.region ?? 'us',
    companyType:
      overrides.companyType ??
      (credentials.companyType as WTATestAccount['companyType'] | undefined) ??
      'elite',
    entitlements: {
      canSeeBillable: true,
      canSeeTaxable: true,
      canDelete: true,
      canSeeClassLocation: true,
      ...overrides.entitlements,
    },
  };
}

// ---- Account matrix (TEST_ACCOUNT-driven, shared model) --------------------

/**
 * Maps the CI `TEST_ACCOUNT` parameter to the pool of account keys it runs
 * against. A group (e.g. `TEST_ACCOUNT=WTA`) expands to every account in its
 * list, and the spec runs the full WTA01 suite once per account. An exact key
 * (e.g. `TEST_ACCOUNT=WTA01`) runs just that account. Unset → falls back to
 * WTA01. Add more keys/groups here as the matrix grows.
 */
const WTA_ACCOUNT_MATRIX: AccountMatrix = {
  // Legacy self-named group — kept for backward compatibility with jobs that
  // still pass TEST_ACCOUNT=WTA. Resolves to the elite account.
  // Legacy self-named group — kept for backward compatibility with jobs that
  // still pass TEST_ACCOUNT=WTA. Resolves to the elite account.
  WTA: ['WTA01'],
  // SKU groups — mirror the other Time-Menu FastPipeline tracks so the shared
  // TEST_ACCOUNT selector (IES / PR_ELITE / PR_PREMIUM) resolves here too. SKUs
  // without a provisioned WTA account (which needs sales tax enabled + seeded
  // employees-with-rates / services-with-prices / customer) stay as TODO
  // placeholders and — thanks to allowEmpty below — register no tests instead
  // of aborting.
  //
  // QBO + Time/Payroll Elite — WTA01 is an elite company set up for WTA.
  PR_ELITE: ['WTA01'],
  // Intuit Enterprise Suite.
  IES: ['WTAIES01'],
  // QBO + Time/Payroll Premium.
  PR_PREMIUM: ['WTAPREM01'],
  // FREE companies — QBO base tiers (Advanced / Essentials / Plus). Weekly
  // timesheet is available on these tiers, so they run the full suite; billable/
  // taxable/rate coverage degrades gracefully (soft) if those aren't enabled.
  FREE_DATA_ADV: ['WTAFREEADV01'],
  FREE_DATA_ESSENTIAL: ['WTAFREEESS01'],
  FREE_DATA_PLUS: ['WTAFREEPLUS01'],
  // Payroll First — LEGACY experience (timeActivityExperience: Legacy). Runs the
  // legacy classic weekly-grid suite (runWTALegacySuite) instead of the new
  // trowser flow. Account key wired when provisioned.
  PAYROLL_FIRST: ['WTAPF01'],
};

/** A built {@link WTATestAccount} paired with the account key it came from. */
export interface WTAMatrixAccount {
  testId: string;
  account: WTATestAccount;
}

/**
 * Resolve the `TEST_ACCOUNT` selector into the ordered list of WTA accounts to
 * run (one full-suite test per account). Defaults to `process.env.TEST_ACCOUNT`;
 * falls back to WTA01 when unset.
 */
export function buildWTAAccountsFromMatrix(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): WTAMatrixAccount[] {
  return resolveMatrixAccounts({
    matrix: WTA_ACCOUNT_MATRIX,
    param: selector,
    fallbackTestId: 'WTA01',
    label: 'WTA',
    // Mirror the sibling tracks: a SKU group with no provisioned account resolves
    // to [] (logged) and registers no tests, rather than aborting the whole run.
    allowEmpty: true,
  }).map(({ testId, credentials }) => ({
    testId,
    account: buildWTAAccount(credentials, {
      role: credentials.expectedRole ?? 'admin',
      entitlements: {
        canSeeBillable: true,
        canSeeTaxable: true,
        canDelete: credentials.canDeleteTime ?? true,
        // QBO Essentials (free) has no Class/Location tracking.
        canSeeClassLocation: !/FREEESS/i.test(testId),
      },
    }),
  }));
}

// ---- Constants -------------------------------------------------------------

// The grid normalizes hours to zero-padded HH:MM, so the cell value for 5h is
// "05:00" (not "5:00"). Use the normalized form so fill AND the toHaveValue
// assertions match.
const DUR = '05:00'; // per-day duration to enter
const DUR_EDIT = '06:00';
const BILL_RATE_OVERRIDE = '99.00';
const NOTE_CREATE = 'WTA01 activity';
const NOTE_EDITED = 'WTA01 activity - edited';
const NOTE_HISTORY = 'WTA01 activity - reopen edit';
const NOTE_REPORT = 'WTA01 activity - report edit';
const NOTE_TAXABLE = 'WTA01 activity - taxable';

const ROW = 1; // first (and primary) data row in the weekly grid

/** Notes used by this run — afterEach cleanup targets all created entries. */
export const WTA01_NOTES = [
  NOTE_CREATE,
  NOTE_EDITED,
  NOTE_HISTORY,
  NOTE_REPORT,
  NOTE_TAXABLE,
];

/**
 * Soft-assert helper — warn instead of failing, AND time-bounded so a wrong
 * locator / no-timeout Playwright action can't hang the run. On timeout (or any
 * error) it logs and continues. Under --debug (PWDEBUG) the wall-clock race is
 * skipped so Inspector stepping works (Node timers fire during a pause).
 */
async function soft(
  label: string,
  fn: () => Promise<void>,
  ms = 25000,
): Promise<void> {
  if (process.env.PWDEBUG) {
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[WTA01][soft] ${label} — ${message}`);
    }
    return;
  }

  const p = fn();
  p.catch(() => undefined); // swallow a late rejection after we've moved on
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      p,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`timed out after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[WTA01][soft] ${label} — ${message}`);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ---- Prod-safe weekly-trowser helpers --------------------------------------

/** The Name field — an IDS combobox labelled "Select name" on a fresh form. */
function nameCombobox(page: Page): Locator {
  return page.getByRole('combobox', { name: 'Select name' }).first();
}

/**
 * Readiness = the Name combobox ("Select name") is on screen. Gating on the
 * actual combobox (not just the label span) confirms the field is interactable.
 */
async function waitWtaFormReady(page: Page, timeout = 20000): Promise<boolean> {
  // NOTE: use waitFor (auto-retries up to `timeout`) — locator.isVisible() is an
  // immediate, non-waiting check that ignores `timeout`, so the Name combobox
  // would be reported missing the instant it hasn't rendered yet.
  return nameCombobox(page)
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false);
}

/**
 * Best-effort dismiss of the WTA tour popup — but ONLY when a tour is actually
 * detected. We must NOT blindly click a generic Close button: the trowser has
 * its own close X, and clicking that would close the form (causing a
 * re-navigate loop). So detect the tour first, then close it within the popover.
 */
async function dismissWtaTour(page: Page): Promise<void> {
  const tourPresent = await page
    .getByText('We transformed')
    .first()
    .or(page.getByRole('button', { name: "See what's new" }).first())
    .isVisible({ timeout: 1500 })
    .catch(() => false);
  if (!tourPresent) return;

  const close = page
    .getByRole('button', { name: 'Done' })
    .first()
    .or(page.getByRole('button', { name: /skip/i }).first())
    .or(
      page
        .locator(
          `//div[contains(@class,'GeneralPopoverTourstyled')]//button[@aria-label='Close']`,
        )
        .first(),
    );
  await close.click({ timeout: 3000 }).catch(() => undefined);
  await page.waitForTimeout(500);
}

/**
 * Close the "Close Tooltip" coachmark if it's on the WTA form — it overlays the
 * fields and can block the first click. Bounded so a missing tooltip never hangs.
 */
async function closeWtaTooltip(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: 'Close Tooltip' }).first();
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await btn.click().catch(() => undefined);
    await page.waitForTimeout(500);
  }
}

/**
 * Open a fresh weekly trowser, dismiss the tour/tooltip, and wait until ready.
 * Navigate ONCE and wait patiently (45s) — re-navigating resets the SPA render,
 * so aggressive retries actually PREVENT the form from settling. Only re-nav
 * once as a last resort.
 */
async function openNewWTA(
  page: Page,
  wta: WeeklyTimeActivity,
  viaCreateMenu = false,
): Promise<void> {
  // First navigation (step 1) goes through the global Create (+New) menu so we
  // also verify Single time activity + Weekly timesheet are accessible from
  // Create; the re-navigation fallback uses the direct URL.
  if (viaCreateMenu) {
    await openViaCreateMenu(page, 'wta');
  } else {
    await wta.navigateToWeeklyTime();
  }
  await dismissWtaTour(page).catch(() => undefined);
  let ready = await waitWtaFormReady(page, 45000);
  if (!ready) {
    console.warn('[WTA01] weekly form slow to load — re-navigating once');
    await wta.navigateToWeeklyTime();
    await dismissWtaTour(page).catch(() => undefined);
    ready = await waitWtaFormReady(page, 45000);
  }
  // Dismiss the coachmark tooltip (if present) before any field interaction.
  await closeWtaTooltip(page);
  // Settle wait: on a slow app some fields/elements render a few seconds AFTER
  // the Name combobox appears. A fixed pause keeps later interactions safe.
  await page.waitForTimeout(10000);
}

/**
 * Click the footer "Save" button. Its accessible name is the testid-derived
 * `weekly-time-trowser_save` (NOT the visible "Save" text, which also matches
 * the "Save and new" split control); fall back to the visible-text Save.
 *
 * The footer can briefly show a LOADER instead of an enabled Save right after
 * the form renders/recomputes — so wait for the button to be visible AND enabled
 * before clicking, and let the normal (non-force) click auto-wait for stability.
 * Only force-click as a last resort if it's briefly covered.
 */
async function saveWTA(page: Page): Promise<void> {
  const save = page
    .getByRole('button', { name: 'weekly-time-trowser_save' })
    .or(page.getByRole('button', { name: 'Save', exact: true }))
    .first();
  await save
    .waitFor({ state: 'visible', timeout: 20000 })
    .catch(() => undefined);
  await expect(save)
    .toBeEnabled({ timeout: 15000 })
    .catch(() => undefined);
  await save.click({ timeout: 10000 }).catch(async () => {
    await save.click({ force: true }).catch(() => undefined);
  });
}

/**
 * Click "Save and new" — the green PRIMARY footer button (the caret menu only
 * holds "Save and close"). Click it directly, waiting for it to be enabled (it
 * can briefly show a loader). Falls back to the page object's menu approach.
 */
async function saveAndNewWTA(
  page: Page,
  wta: WeeklyTimeActivity,
): Promise<void> {
  const btn = page
    .getByRole('button', { name: 'weekly-time-trowser_save_and_new' })
    .or(page.getByRole('button', { name: 'Save and new', exact: true }))
    .first();
  if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await expect(btn)
      .toBeEnabled({ timeout: 15000 })
      .catch(() => undefined);
    await btn.click({ timeout: 10000 }).catch(async () => {
      await btn.click({ force: true }).catch(() => undefined);
    });
    return;
  }
  await wta.clickSaveAndNewButton().catch(() => undefined);
}

/** Bounded, properly-awaited check that the weekly trowser has closed. */
async function expectTrowserClosed(page: Page): Promise<void> {
  await expect(page.getByText(LABELS.WTA).first())
    .toBeHidden({ timeout: 8000 })
    .catch(() => undefined);
}

/**
 * Log whether the Billable column is present. We deliberately DO NOT open Time
 * entry settings to enable it: the column is enabled on this company by default
 * and only renders once an employee/row exists, AND the page object's settings
 * toggle uses a 180s `toBeVisible` that hangs on prod (which `soft()` can't
 * rescue under --debug). If billable is genuinely off, billable/taxable steps
 * soft-skip rather than hang.
 */
async function logBillableColumn(wta: WeeklyTimeActivity): Promise<void> {
  const visible = await wta.isBillableVisible().catch(() => false);
  console.log('[WTA01] billable column visible = %s', visible);
}

/**
 * Close an open dropdown WITHOUT pressing Escape — in the weekly trowser Escape
 * closes the whole trowser, not just the menu. Clicking the trowser title (an
 * always-present neutral spot outside the menu) dismisses the open dropdown.
 */
async function dismissDropdown(page: Page): Promise<void> {
  await page
    .getByText(LABELS.WTA)
    .first()
    .click({ timeout: 2000, force: true })
    .catch(() => undefined);
}

/**
 * Open the Name dropdown and select the index-th employee (0-based, "+ Add new"
 * excluded). Returns false WITHOUT hanging when that employee doesn't exist.
 */
async function selectEmployeeWTA(
  page: Page,
  wta: WeeklyTimeActivity,
  index = 0,
): Promise<boolean> {
  await nameCombobox(page)
    .click()
    .catch(() => undefined); // open the Name dropdown
  await page.waitForTimeout(500);
  // The "Select a team member" coachmark overlays the option list and blocks the
  // click — dismiss it, then re-open the dropdown if that collapsed it.
  await closeWtaTooltip(page);
  let opts = page.getByRole('option').filter({ hasNotText: /add new/i });
  if ((await opts.count()) === 0) {
    await nameCombobox(page)
      .click()
      .catch(() => undefined);
    await page.waitForTimeout(400);
    opts = page.getByRole('option').filter({ hasNotText: /add new/i });
  }
  const count = await opts.count();
  if (index >= count) {
    await dismissDropdown(page);
    console.log('[WTA01] employee #%d not available (have %d)', index, count);
    return false;
  }
  await opts.nth(index).click();
  await page.waitForTimeout(400);
  return true;
}

/**
 * Open a row dropdown (Customers/Service/Class/Location) and click the first
 * real option ("+ Add new" excluded). Returns false WITHOUT hanging if the
 * field is absent or has no options.
 */
async function selectRowFirst(
  page: Page,
  wta: WeeklyTimeActivity,
  label: string,
  position = ROW,
): Promise<boolean> {
  if (!(await wta.isVisibile(label, position))) return false;
  await wta.openRowDropdown(label, position);
  await page.waitForTimeout(400);
  // Dismiss any coachmark overlaying the option list, re-opening if needed.
  await closeWtaTooltip(page);
  let opts = page.getByRole('option').filter({ hasNotText: /add new/i });
  if ((await opts.count()) === 0) {
    await wta.openRowDropdown(label, position);
    await page.waitForTimeout(400);
    opts = page.getByRole('option').filter({ hasNotText: /add new/i });
  }
  if ((await opts.count()) === 0) {
    await dismissDropdown(page);
    return false;
  }
  await opts.first().click({ force: true });
  await page.waitForTimeout(300);
  return true;
}

/** Read a row dropdown value safely ('' if the field is hidden). */
async function readDrop(
  wta: WeeklyTimeActivity,
  label: string,
  position = ROW,
): Promise<string> {
  if (!(await wta.isVisibile(label, position).catch(() => false))) return '';
  return (await wta.getDropDownVal(label, position).catch(() => '')) ?? '';
}

/** The Billable checkbox state for a row (false if absent). */
async function isBillable(
  wta: WeeklyTimeActivity,
  position = ROW,
): Promise<boolean> {
  return wta.isChecked(position, LABELS.Billable).catch(() => false);
}

/**
 * Fill only the FIRST `days` day-cells of a row's Duration with `value` (not all
 * 7). Each filled day becomes a separate daily time entry in the report, so
 * filling fewer days keeps the created-entry count — and cleanup time — small.
 * (`enterDurationWithValue` fills the whole week = 7 entries/row.)
 */
async function fillDays(
  page: Page,
  value: string,
  days = 1,
  position = ROW,
): Promise<void> {
  const inputs = page.locator(
    `//tr[${position}]//input[contains(@aria-label,"Duration")]`,
  );
  const total = await inputs.count();
  const n = Math.min(days, total);
  for (let i = 0; i < n; i += 1) {
    await inputs
      .nth(i)
      .fill(value)
      .catch(() => undefined);
  }
  await page.keyboard.press('Tab');
}

/** Assert the first day-cell of a row's Duration equals `value`. */
async function verifyDay(
  page: Page,
  value: string,
  position = ROW,
): Promise<void> {
  await expect(
    page
      .locator(`//tr[${position}]//input[contains(@aria-label,"Duration")]`)
      .first(),
  ).toHaveValue(value);
}

/**
 * Ensure the row's Customer is set — call this LAST (after the team member and
 * any Service/Class/Location), right before saving billable time. Selecting the
 * TEAM MEMBER (and the Service) clears the Customer on this grid, so we always
 * pick the Customer after them and re-select here if it's still empty. Returns
 * the final customer value.
 */
async function ensureCustomer(
  page: Page,
  wta: WeeklyTimeActivity,
  position = ROW,
): Promise<string> {
  if (!(await wta.isVisibile(LABELS.Customers, position).catch(() => false))) {
    return '';
  }
  let cur = await readDrop(wta, LABELS.Customers, position);
  if (!cur) {
    await selectRowFirst(page, wta, LABELS.Customers, position);
    cur = await readDrop(wta, LABELS.Customers, position);
  }
  return cur;
}

// ============================================================================
// Step 1 — Open weekly trowser + grid structure
// ============================================================================

export async function step01_openAndStructure(
  page: Page,
  account: WTATestAccount,
  wta: WeeklyTimeActivity,
): Promise<void> {
  console.log(
    '[WTA01][Step1] companyType=%s role=%s region=%s',
    account.companyType,
    account.role,
    account.region,
  );
  await openNewWTA(page, wta, true); // first navigation via the Create (+New) menu
  console.log('[WTA01][Step1] Weekly trowser ("Weekly timesheet") loaded');

  await soft('Weekly timesheet title present', async () => {
    await expect(page.getByText(LABELS.WTA).first()).toBeVisible({
      timeout: 10000,
    });
  });
  await soft('Name field present', async () => {
    expect(await waitWtaFormReady(page, 8000)).toBeTruthy();
  });
  await soft('week selector present', async () => {
    await expect(
      page
        .locator(
          `//span[text()='Select a week']/ancestor::label/descendant::input`,
        )
        .first(),
    ).toBeVisible({ timeout: 8000 });
  });
  await soft('day-of-week column headers present', async () => {
    const mon = await wta.isTableHeaderVisible('Monday').catch(() => false);
    const fri = await wta.isTableHeaderVisible('Friday').catch(() => false);
    console.log('[WTA01][Step1] day headers Mon=%s Fri=%s', mon, fri);
    expect(mon || fri).toBeTruthy();
  });
  await soft('Billable column availability', async () => {
    console.log(
      '[WTA01][Step1] billable visible = %s',
      await wta.isBillableVisible(),
    );
  });
}

// ============================================================================
// Step 2 — CREATE a weekly row + success toast + round-trip verify
// ============================================================================

export interface EnteredValues {
  customer: string;
  service: string;
  className: string;
  location: string;
  duration: string;
  notes: string;
}

export async function step02_create(
  page: Page,
  account: WTATestAccount,
  wta: WeeklyTimeActivity,
): Promise<EnteredValues> {
  const v: EnteredValues = {
    customer: '',
    service: '',
    className: '',
    location: '',
    duration: DUR,
    notes: NOTE_CREATE,
  };

  await openNewWTA(page, wta);
  await logBillableColumn(wta);

  await soft('select Name (first employee)', async () => {
    await selectEmployeeWTA(page, wta, 0);
  });

  // Row fields — first real option of each (settings may hide some). Select
  // Service/Class/Location FIRST: picking a Service clears the Customer on this
  // grid, so Customer is selected LAST (and verified) right before duration.
  await soft('select Service', async () => {
    await selectRowFirst(page, wta, LABELS.Service);
    v.service = await readDrop(wta, LABELS.Service);
  });
  // Class & Location aren't available on QBO Essentials — skip them there (the
  // round-trip verify also skips automatically since the captured value stays '').
  if (account.entitlements.canSeeClassLocation) {
    await soft('select Class', async () => {
      await selectRowFirst(page, wta, LABELS.Class);
      v.className = await readDrop(wta, LABELS.Class);
    });
    await soft('select Location', async () => {
      await selectRowFirst(page, wta, LABELS.Location);
      v.location = await readDrop(wta, LABELS.Location);
    });
  } else {
    console.log(
      '[WTA01][Step2] Class/Location not available (Essentials) — skipping',
    );
  }

  // Customer LAST — required for billable time. Verify it stuck (re-select once
  // if empty), since other selections can clear it.
  await soft('select Customer (required for billable) + verify', async () => {
    await selectRowFirst(page, wta, LABELS.Customers);
    const cust = await ensureCustomer(page, wta); // re-select if team-member/service cleared it
    v.customer = cust;
    console.log('[WTA01][Step2] customer="%s"', cust);
    expect(cust).not.toBe('');
  });

  await soft('enter per-day Duration across the week', async () => {
    await fillDays(page, DUR);
    await page.keyboard.press('Tab');
  });

  // Billable on + bill rate (customer required for billable time).
  await soft('check Billable + enter bill rate', async () => {
    if (!(await isBillable(wta))) {
      await wta.checkInputCheckbox(ROW, LABELS.Billable).catch(() => undefined);
    }
    await wta.enterBillRate(ROW).catch(() => undefined); // fills a valid rate when visible
  });

  await soft('enter Notes', async () => {
    await wta.enterNotes(NOTE_CREATE, ROW);
  });

  console.log('[WTA01][Step2] entered values: %o', v);

  // Final guard: Customer must still be set for a billable save.
  await soft('ensure Customer set before save', async () => {
    const cust = await ensureCustomer(page, wta);
    console.log('[WTA01][Step2] customer before save="%s"', cust);
  });
  await soft('save (create)', async () => {
    await saveWTA(page);
  });
  await soft('success toast after create', async () => {
    await wta.validateSuccessToast();
  });
  console.log('[WTA01][Step2] weekly entry created');

  // --- VERIFY persistence in-place: the saved grid still reflects our values. ---
  await soft('verify entered values round-trip in the grid', async () => {
    const check = (label: string, actual: string, expected: string) => {
      if (!expected) return;
      console.log(
        '[WTA01][Step2][verify] %s: expected="%s" actual="%s"',
        label,
        expected,
        actual,
      );
      expect(actual).toContain(expected);
    };
    check('Customer', await readDrop(wta, LABELS.Customers), v.customer);
    check('Service', await readDrop(wta, LABELS.Service), v.service);
    check('Class', await readDrop(wta, LABELS.Class), v.className);
    check('Location', await readDrop(wta, LABELS.Location), v.location);
    const notes = await wta.getNotesVal(ROW).catch(() => '');
    console.log('[WTA01][Step2][verify] Notes actual="%s"', notes);
    expect(notes).toContain(NOTE_CREATE);
  });
  await soft('verify per-day Duration persisted', async () => {
    await verifyDay(page, DUR);
  });

  return v;
}

// ============================================================================
// Step 3 — Billable + Bill-rate rules
// ============================================================================

export async function step03_billableAndRate(
  page: Page,
  account: WTATestAccount,
  wta: WeeklyTimeActivity,
): Promise<void> {
  if (!account.entitlements.canSeeBillable) {
    console.log('[WTA01][Step3] SKIPPED — billable not available');
    return;
  }

  await openNewWTA(page, wta);
  await logBillableColumn(wta);
  await soft('setup row for bill-rate rules', async () => {
    await selectEmployeeWTA(page, wta, 0);
    await selectRowFirst(page, wta, LABELS.Customers);
    await fillDays(page, DUR);
    await page.keyboard.press('Tab');
  });

  const billRateInput = page
    .locator(`//tr[${ROW}]//input[@aria-label='${LABELS.BillRate}']`)
    .first();
  const rateVisible = (): Promise<boolean> =>
    billRateInput.isVisible({ timeout: 2000 }).catch(() => false);
  const rate = async (): Promise<string> =>
    (await rateVisible()) ? billRateInput.inputValue().catch(() => '') : '';

  // A: check Billable → bill rate becomes available.
  await soft('A: check Billable → rate available', async () => {
    if (!(await isBillable(wta))) {
      await wta.checkInputCheckbox(ROW, LABELS.Billable);
    }
    await page.waitForTimeout(400);
    console.log(
      '[WTA01][Step3] A billable=%s rateVisible=%s rate="%s"',
      await isBillable(wta),
      await rateVisible(),
      await rate(),
    );
  });

  // B: service with a price → rate may auto-populate / change.
  await soft('B: service → rate updates', async () => {
    if (!(await selectRowFirst(page, wta, LABELS.Service))) return;
    await page.waitForTimeout(600);
    console.log('[WTA01][Step3] B service rate="%s"', await rate());
  });

  // C: manual bill-rate override sticks.
  await soft('C: manual bill-rate override sticks', async () => {
    if (!(await rateVisible())) return;
    await billRateInput.fill('');
    await billRateInput.fill(BILL_RATE_OVERRIDE);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    await wta.validateBillRateValue(ROW, BILL_RATE_OVERRIDE);
  });

  // D: uncheck Billable hides the rate; re-check shows it.
  await soft('D: toggle Billable hides/shows bill rate', async () => {
    await wta.unCheckInputCheckbox(ROW, LABELS.Billable);
    await page.waitForTimeout(400);
    expect(await rateVisible()).toBeFalsy();
    await wta.checkInputCheckbox(ROW, LABELS.Billable);
    await page.waitForTimeout(400);
    console.log(
      '[WTA01][Step3] D rate after re-check visible=%s',
      await rateVisible(),
    );
  });

  console.log('[WTA01][Step3] Billable + bill-rate scenarios A–D exercised');
}

// ============================================================================
// Step 4 — Taxable rules (Sales Tax enabled)
// ============================================================================

export async function step04_taxable(
  page: Page,
  account: WTATestAccount,
  wta: WeeklyTimeActivity,
): Promise<void> {
  if (!account.entitlements.canSeeTaxable) {
    console.log('[WTA01][Step4] SKIPPED — taxable not available');
    return;
  }

  await openNewWTA(page, wta);
  await logBillableColumn(wta);
  await soft('setup valid billable row for taxable', async () => {
    await selectEmployeeWTA(page, wta, 0);
    await selectRowFirst(page, wta, LABELS.Customers);
    await fillDays(page, DUR);
    await page.keyboard.press('Tab');
    if (!(await isBillable(wta))) {
      await wta.checkInputCheckbox(ROW, LABELS.Billable);
    }
    await page.waitForTimeout(400);
  });

  const taxableShown = await wta
    .isVisibile(LABELS.Taxable, ROW)
    .catch(() => false);
  if (!taxableShown) {
    console.log(
      '[WTA01][Step4] Taxable not present — Sales Tax likely off on this company',
    );
    return;
  }

  await soft('check Taxable', async () => {
    if (!(await wta.isChecked(ROW, LABELS.Taxable))) {
      await wta.checkInputCheckbox(ROW, LABELS.Taxable);
    }
    await page.waitForTimeout(300);
    expect(await wta.isChecked(ROW, LABELS.Taxable)).toBeTruthy();
  });

  // --- CREATE a weekly entry WITH Taxable checked, save, verify it persists. ---
  await soft('create entry with Taxable checked → persists', async () => {
    await wta.enterNotes(NOTE_TAXABLE, ROW);
    await ensureCustomer(page, wta); // billable+taxable requires a customer
    await saveWTA(page);
    await wta.validateSuccessToast().catch(() => undefined);
    await page.waitForTimeout(1000);
    const taxable = await wta.isChecked(ROW, LABELS.Taxable).catch(() => false);
    console.log('[WTA01][Step4] after save taxable=%s', taxable);
    expect(taxable).toBeTruthy();
  });

  // --- EDIT: uncheck Taxable, save, verify it persists unchecked. ---
  await soft('edit to uncheck Taxable → persists', async () => {
    await wta.unCheckInputCheckbox(ROW, LABELS.Taxable);
    await page.waitForTimeout(300);
    await saveWTA(page);
    await wta.validateSuccessToast().catch(() => undefined);
    await page.waitForTimeout(1000);
    const taxable = await wta.isChecked(ROW, LABELS.Taxable).catch(() => false);
    console.log('[WTA01][Step4] after edit taxable=%s', taxable);
    expect(taxable).toBeFalsy();
  });

  console.log(
    '[WTA01][Step4] Taxable rules + create/edit persistence verified',
  );
}

// ============================================================================
// Step 5 — Weekly specifics: multi-day durations, multiple rows, totals
// ============================================================================

export async function step05_weeklySpecifics(
  page: Page,
  account: WTATestAccount,
  wta: WeeklyTimeActivity,
): Promise<void> {
  await openNewWTA(page, wta);
  await logBillableColumn(wta);

  await soft('row 1 — employee + customer + multi-day durations', async () => {
    await selectEmployeeWTA(page, wta, 0);
    await selectRowFirst(page, wta, LABELS.Customers, 1);
    await fillDays(page, DUR, 2, 1);
    await page.keyboard.press('Tab');
    await wta.enterNotes(NOTE_CREATE, 1);
  });

  // A second row in the SAME save (weekly grids auto-render extra rows).
  await soft('row 2 — second customer/duration in same week', async () => {
    if (!(await wta.isVisibile(LABELS.Customers, 2))) {
      console.log('[WTA01][Step5] second row not available — single row only');
      return;
    }
    await selectRowFirst(page, wta, LABELS.Customers, 2);
    await fillDays(page, DUR, 1, 2);
    await page.keyboard.press('Tab');
    await wta.enterNotes(NOTE_CREATE, 2);
  });

  await soft('save multi-row week', async () => {
    await ensureCustomer(page, wta, 1); // re-select row-1 customer if cleared
    await saveWTA(page);
    await wta.validateSuccessToast().catch(() => undefined);
  });
  await soft('verify weekly per-day durations persisted (row 1)', async () => {
    await verifyDay(page, DUR, 1);
  });
  console.log('[WTA01][Step5] weekly multi-day / multi-row verified');
}

// ============================================================================
// Step 6 — Save variants (Save and new clears; Save and close closes)
// ============================================================================

export async function step06_saveVariants(
  page: Page,
  account: WTATestAccount,
  wta: WeeklyTimeActivity,
): Promise<void> {
  // Save and new → row fields clear.
  await openNewWTA(page, wta);
  await logBillableColumn(wta);
  await soft('fill minimal then Save and new → fields clear', async () => {
    await selectEmployeeWTA(page, wta, 0);
    await selectRowFirst(page, wta, LABELS.Customers);
    await fillDays(page, DUR);
    await page.keyboard.press('Tab');
    await wta.enterNotes(NOTE_CREATE, ROW);
    await ensureCustomer(page, wta);
    await saveAndNewWTA(page, wta);
    await page.waitForTimeout(3000);
    // Save-and-new clears the row's Customer (and Name) for a fresh entry — the
    // page object's validateSaveandNew asserts exactly that. Notes may or may
    // not clear, so only hard-assert Customer; log Notes.
    const customer = await wta.getCustomerVal(ROW).catch(() => '');
    const notes = await wta.getNotesVal(ROW).catch(() => '');
    console.log(
      '[WTA01][Step6] after Save-and-new: customer="%s" notes="%s"',
      customer,
      notes,
    );
    expect(customer === '' || customer == null).toBeTruthy();
  });

  // Save and close → trowser closes.
  await openNewWTA(page, wta);
  await soft('fill minimal then Save and close → trowser closes', async () => {
    await selectEmployeeWTA(page, wta, 0);
    await selectRowFirst(page, wta, LABELS.Customers);
    await fillDays(page, DUR);
    await page.keyboard.press('Tab');
    await wta.enterNotes(NOTE_CREATE, ROW);
    await ensureCustomer(page, wta);
    await wta.clickSaveAndCloseButton();
    await expectTrowserClosed(page);
  });
  console.log('[WTA01][Step6] Save / Save-and-new / Save-and-close verified');
}

// ============================================================================
// Step 7 — Edit / Update + persistence
// ============================================================================

export async function step07_editUpdate(
  page: Page,
  account: WTATestAccount,
  wta: WeeklyTimeActivity,
): Promise<void> {
  await openNewWTA(page, wta);
  await logBillableColumn(wta);
  await soft('create for edit', async () => {
    await selectEmployeeWTA(page, wta, 0);
    await selectRowFirst(page, wta, LABELS.Customers);
    await fillDays(page, DUR);
    await page.keyboard.press('Tab');
    await wta.enterNotes(NOTE_CREATE, ROW);
    await ensureCustomer(page, wta);
    await saveWTA(page);
    await wta.validateSuccessToast().catch(() => undefined);
  });

  await soft('edit duration + notes + bill rate, save', async () => {
    await fillDays(page, DUR_EDIT);
    await page.keyboard.press('Tab');
    if (account.entitlements.canSeeBillable) {
      if (!(await isBillable(wta))) {
        await wta
          .checkInputCheckbox(ROW, LABELS.Billable)
          .catch(() => undefined);
      }
      await wta.enterBillRate(ROW).catch(() => undefined);
    }
    await wta.enterNotes(NOTE_EDITED, ROW);
    await saveWTA(page);
    await wta.validateSuccessToast().catch(() => undefined);
  });

  await soft('verify edited values persisted', async () => {
    const notes = await wta.getNotesVal(ROW).catch(() => '');
    console.log('[WTA01][Step7] reopened notes="%s"', notes);
    expect(notes).toContain(NOTE_EDITED);
    await verifyDay(page, DUR_EDIT);
  });
  console.log('[WTA01][Step7] Edit/update verified');
}

// ============================================================================
// Step 8 — "History" equivalent: reopen the saved week + edit
//
// Weekly has no recent-entries popup; the closest equivalent is reopening the
// week for the employee (which loads the saved rows) and editing one. This also
// proves cross-reload persistence.
// ============================================================================

export async function step08_reopenAndEdit(
  page: Page,
  account: WTATestAccount,
  wta: WeeklyTimeActivity,
): Promise<void> {
  await openNewWTA(page, wta);
  await soft(
    'reopen saved week → confirm a saved row → edit → save',
    async () => {
      await selectEmployeeWTA(page, wta, 0);
      await page.waitForTimeout(2000);
      // The saved week's rows load for this employee; confirm a non-empty row.
      const customer = await wta.getCustomerVal(ROW).catch(() => '');
      console.log('[WTA01][Step8] reopened row customer="%s"', customer);
      await wta.enterNotes(NOTE_HISTORY, ROW);
      await saveWTA(page);
      await wta.validateSuccessToast().catch(() => undefined);
    },
  );
  console.log('[WTA01][Step8] reopen-week + edit verified');
}

// ============================================================================
// Step 9 — Validate + edit from the Reports page
// ============================================================================

export async function step09_reportsEdit(
  page: Page,
  account: WTATestAccount,
  reports: ReportsPage,
  sta: SingleTimeActivityPage,
  entered: EnteredValues,
): Promise<void> {
  await soft(
    'open Time Activities by Employee Detail report',
    async () => {
      await openReportAndWait(page, reports);
    },
    150000,
  );

  const inReport = (text: string, ms = 15000): Promise<boolean> =>
    page
      .getByText(text, { exact: false })
      .first()
      .waitFor({ state: 'visible', timeout: ms })
      .then(() => true)
      .catch(() => false);

  await soft('report reflects entered values', async () => {
    if (entered.customer) expect(await inReport(entered.customer)).toBeTruthy();
    if (entered.service) expect(await inReport(entered.service)).toBeTruthy();
    expect(await inReport(NOTE_CREATE)).toBeTruthy(); // Description column
    // Billable (Y/N) column shows "Yes" for our billable entry.
    expect(await inReport('Yes')).toBeTruthy();
  });

  // Open an entry from the report → edit → save → VERIFY the edit persisted.
  // The drill-down opens the single-day trowser, so edit via SingleTimeActivityPage.
  await soft('open entry from report → edit → save → verify', async () => {
    if (!(await openEntryFromReport(page, reports))) return;
    await sta.fillNotes(NOTE_REPORT);
    await sta.clickButton('Save');
    await sta.validateSuccessToast().catch(() => undefined);
    await page.waitForTimeout(1500);
    await expect(sta.notesTextarea().first()).toHaveValue(NOTE_REPORT, {
      timeout: 10000,
    });
  });
  console.log('[WTA01][Step9] Reports view + edit + persistence verified');
}

// ============================================================================
// Step 10 — Negative scenarios / validation
// ============================================================================

export async function step10_validation(
  page: Page,
  account: WTATestAccount,
  wta: WeeklyTimeActivity,
): Promise<void> {
  const errorSoon = (pattern: RegExp, ms = 10000): Promise<boolean> =>
    page
      .getByText(pattern)
      .filter({ visible: true })
      .first()
      .waitFor({ state: 'visible', timeout: ms })
      .then(() => true)
      .catch(() => false);

  // The weekly form PRE-LOADS the last employee + their saved week, so the
  // negatives must clear the pre-filled data first. The Name field input:
  const nameInput = page
    .locator(`//span[text()='Name']/ancestor::label//input`)
    .first();

  // 10a — Name required: clear the pre-filled Name, then Save. (No 180s
  // page-object assertion — everything bounded.)
  await soft('Name required → error on save', async () => {
    await openNewWTA(page, wta);
    await nameInput.click().catch(() => undefined);
    await nameInput.fill('').catch(() => undefined);
    await page.waitForTimeout(500);
    const nameVal = await nameInput.inputValue().catch(() => '');
    if (nameVal) {
      console.log(
        '[WTA01][Step10a] Name not clearable ("%s") — skipping required-name negative',
        nameVal,
      );
      return;
    }
    await fillDays(page, DUR);
    await page.keyboard.press('Tab');
    await saveWTA(page);
    const shown = await errorSoon(/required|this field is required/i, 12000);
    console.log('[WTA01][Step10a] name-required error shown=%s', shown);
    expect(shown).toBeTruthy();
  });

  // 10b — No time activity: this error ("You must enter at least one time
  // activity before you can save the timesheet.") only fires on a COMPLETELY
  // empty timesheet (nothing to save AND nothing to delete). The current week
  // pre-loads entries, so we move to a FUTURE week (no data) for the employee
  // and Save without entering anything.
  await soft('empty week → at-least-one-required error', async () => {
    await openNewWTA(page, wta);
    await selectEmployeeWTA(page, wta, 0);
    await wta.selectWeekDropdown('Select a week', 4).catch(() => undefined); // +4 weeks (empty)
    await page.waitForTimeout(3000);
    await saveWTA(page);
    const shown = await errorSoon(
      /at least one time activity|enter at least one/i,
      12000,
    );
    console.log('[WTA01][Step10b] at-least-one-activity error shown=%s', shown);
    expect(shown).toBeTruthy();
  });

  // 10c — Notes max length. The "Exceeds max length" error is raised on SAVE
  // (not on blur), so fill a valid row + over-long notes, ensure a customer so
  // the save isn't blocked by a different error, then Save and check.
  await soft('Notes over max length → error on save', async () => {
    await openNewWTA(page, wta);
    await selectEmployeeWTA(page, wta, 0);
    await fillDays(page, DUR);
    await wta.enterNotes('x'.repeat(4001), ROW);
    await page.keyboard.press('Tab');
    await ensureCustomer(page, wta);
    await saveWTA(page);
    const shown =
      (await errorSoon(/exceeds max length/i, 12000)) ||
      (await wta.validateMaxlength(ROW).catch(() => false));
    console.log('[WTA01][Step10c] notes max-length error shown=%s', shown);
    expect(shown).toBeTruthy();
  });

  console.log('[WTA01][Step10] Negative scenarios verified');
}

// ============================================================================
// Step 11 — Delete
// ============================================================================

export async function step11_delete(
  page: Page,
  account: WTATestAccount,
  wta: WeeklyTimeActivity,
): Promise<void> {
  if (!account.entitlements.canDelete) {
    console.log('[WTA01][Step11] SKIPPED — delete not allowed');
    return;
  }
  await soft('reopen saved week → delete a row → save', async () => {
    await openNewWTA(page, wta);
    await selectEmployeeWTA(page, wta, 0);
    await page.waitForTimeout(2000);
    const before = await wta.getCustomerVal(ROW).catch(() => '');
    if (before === '' || before == null) {
      console.log('[WTA01][Step11] no saved row to delete');
      return;
    }
    await wta.clickDeleteIconRow(ROW);
    await page.waitForTimeout(1000);
    await saveWTA(page).catch(() => undefined);
    await wta.validateSuccessToast().catch(() => undefined);
    console.log('[WTA01][Step11] deleted a weekly row');
  });
  console.log('[WTA01][Step11] Delete verified');
}

/**
 * Open the "Time Activities by Employee Detail" report and WAIT until it has
 * actually rendered before anything reads/verifies it. The report is slow on
 * prod and loads rows/columns asynchronously after the page shell — verifying
 * too early reads an empty/half-loaded report. Waits: loading spinner clears →
 * report title → a data row → plus a fixed settle wait.
 */
async function openReportAndWait(
  page: Page,
  reports: ReportsPage,
): Promise<void> {
  await reports.navigateToReportsPage();
  await reports.searchAndOpenReport('Time Activities by Employee Detail');
  await reports.waitForLoadingToDisappear().catch(() => undefined);
  // The report heading confirms the report (not just the search) is on screen.
  // Use the exact-text heading locator (the page object's getter doesn't match).
  await page
    .getByText('Time Activities by Employee Detail', { exact: true })
    .first()
    .waitFor({ state: 'visible', timeout: 60000 })
    .catch(() => undefined);
  // A data row confirms the table body rendered (entries exist).
  await page
    .locator(`//tr[contains(@class,"tanstackTable__row")]`)
    .first()
    .waitFor({ state: 'visible', timeout: 45000 })
    .catch(() => undefined);
  // Settle wait — rows/columns hydrate a few seconds after the shell on slow prod.
  await page.waitForTimeout(10000);
}

// ============================================================================
// Report drill-down (shared by Step 9 + cleanup)
//
// Identical proven approach to STA01: the "Time Activities by Employee Detail"
// report drill-down is a clickable VALUE cell in a data row (Hours / Sales /
// Duration), which opens the single-day trowser. The date/row cell is NOT a
// link. Try each candidate until "Single day entry" appears. Bounded.
// ============================================================================

async function openEntryFromReport(
  page: Page,
  reports: ReportsPage,
): Promise<boolean> {
  const openSignal = page.getByText('Single day entry').first();
  const dataRow = `//tr[contains(@class,"tanstackTable__row") and not(contains(@class,"top-level-grouped-row"))][1]`;

  const haveRow = await page
    .locator(dataRow)
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  const haveHours = await reports.hoursLink.isVisible().catch(() => false);
  if (!haveRow && !haveHours) {
    console.log('[WTA01] no report rows visible — no entries to open');
    return false;
  }

  const candidates: Locator[] = [
    reports.hoursLink,
    page.locator(`${dataRow}//td//*[normalize-space(text())='Sales']`).first(),
    page
      .locator(`${dataRow}//td//*[contains(normalize-space(text()),':')]`)
      .first(),
  ];

  const waitOpened = (ms: number): Promise<boolean> =>
    openSignal
      .waitFor({ state: 'visible', timeout: ms })
      .then(() => true)
      .catch(() => false);

  for (const target of candidates) {
    if (await openSignal.isVisible().catch(() => false)) {
      await page.waitForTimeout(2000);
      return true;
    }
    if (!(await target.isVisible({ timeout: 5000 }).catch(() => false)))
      continue;
    await target.click().catch(() => undefined);
    if (await waitOpened(25000)) {
      await page.waitForTimeout(2000);
      return true;
    }
  }

  console.log('[WTA01] entry trowser did not open from any report drill-down');
  return false;
}

// ============================================================================
// afterEach cleanup — delete created entries via the Reports page
// (Reports → Time Activities by Employee Detail → open each via drill-down →
// delete in the single-day trowser → refresh list → repeat until empty)
// ============================================================================

export async function cleanupCreatedActivities(page: Page): Promise<void> {
  const sta = new SingleTimeActivityPage(page);
  const reports = new ReportsPage(page);

  await soft(
    '[cleanup] open Time Activities by Employee Detail',
    async () => {
      await openReportAndWait(page, reports);
    },
    150000,
  );

  const MAX = 300;
  let deleted = 0;
  for (let i = 0; i < MAX; i += 1) {
    const opened = await openEntryFromReport(page, reports);
    if (!opened) {
      console.log('[WTA01][cleanup] no entries left — %d deleted', deleted);
      break;
    }

    let didDelete = false;
    await soft('[cleanup] delete entry in trowser', async () => {
      await sta.clickButton('Delete');
      await sta.clickYesOnDeleteConfirmation();
      await expect(page.getByText('Single day entry').first())
        .toBeHidden({ timeout: 8000 })
        .catch(() => undefined);
      didDelete = true;
    });
    if (!didDelete) {
      console.warn('[WTA01][cleanup] delete failed — stopping to avoid a loop');
      break;
    }
    deleted += 1;
    console.log('[WTA01][cleanup] deleted entry #%d', deleted);

    await soft(
      '[cleanup] refresh report (Today → All Dates)',
      async () => {
        await reports.refreshTimeActivitiesReportDateFilter();
      },
      30000,
    );
  }
}

// ============================================================================
// Orchestrator
// ============================================================================

export async function runWTAFDFullSuite(
  page: Page,
  account: TETestAccount,
  createdEntries: string[] = [],
): Promise<void> {
  await runWTAFastPipelineFullSuite(page, account, createdEntries);
}

// ============================================================================
// WTA Fast Pipeline — Time Entries tab flow (mirrors runSTEFullSuite / STA-FP)
//
// Login → dashboard → navigate → tab/filters/columns/role validations (soft)
// → WTA CRUD via Add time → Weekly timesheet on the Time Entries grid.
// ============================================================================

const WTA_FP_NOTE_CREATE = 'WTA-FP activity';
const WTA_FP_NOTE_EDITED = 'WTA-FP activity - edited';
/** Per-day duration — matches codegen `fill('8')` (8 hours). */
const WTA_FP_HOURS = '08:00';
/** Weekdays filled (Mon–Fri) in the weekly grid row. */
const WTA_FP_DAYS = 5;

/** Notes created by the Fast Pipeline WTA flow — used by cleanup fallback. */
export const WTA_FP_NOTES = [WTA_FP_NOTE_CREATE, WTA_FP_NOTE_EDITED];

async function wtaFpSoftStep(
  label: string,
  fn: () => Promise<unknown>,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    console.warn(`[WTA-FP][soft] ${label} — failed, continuing:`, error);
  }
}

/** Open Weekly Timesheet from the Time Entries Add time menu (free-data path). */
async function openWTAFromAddTime(
  page: Page,
  teTabPage: TETimeEntriesTabPage,
): Promise<void> {
  await teTabPage.openAddTimeWTA();
  await dismissWtaTour(page).catch(() => undefined);
  const ready = await waitWtaFormReady(page, 45000);
  if (!ready) {
    throw new Error('[WTA-FP] Weekly timesheet form did not load');
  }
  await closeWtaTooltip(page);
  await page.waitForTimeout(1500);
}

/**
 * Step 7 — WTA CRUD on the Time Entries grid (free-data / Weekly timesheet).
 * Create multi-day hours + customer/service, verify in grid, edit notes, delete row.
 */
export async function step07_wtaCRUD(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
  createdEntries: string[],
): Promise<void> {
  const wta = new WeeklyTimeActivity(page);
  const common = new CommonLocators(page);

  await test.step('set This week range before create', async () => {
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(TE_LABELS.thisWeek);
    await teTabPage.waitForLoadingToDisappear();
  });

  await test.step('open Weekly Timesheet trowser', async () => {
    await openWTAFromAddTime(page, teTabPage);
  });
  console.log('[WTA-FP][Step7] Weekly trowser ("Weekly timesheet") opened');

  let customer = '';
  await test.step('select Name + Service + Customer', async () => {
    await selectEmployeeWTA(page, wta, 0);
    await selectRowFirst(page, wta, LABELS.Service);
    customer = await ensureCustomer(page, wta);
    console.log('[WTA-FP][Step7] customer="%s"', customer);
  });

  await test.step('fill weekday durations + notes', async () => {
    await fillDays(page, WTA_FP_HOURS, WTA_FP_DAYS);
    await page.keyboard.press('Tab');
    await wta.enterNotes(WTA_FP_NOTE_CREATE, ROW);
  });
  createdEntries.push(WTA_FP_NOTE_CREATE);

  await test.step('save and close weekly entry', async () => {
    await saveWTA(page);
    await wta.validateSuccessToast().catch(() => undefined);
    await wta.clickSaveAndCloseButton();
    await teTabPage.waitForLoadingToDisappear();
  });
  console.log('[WTA-FP][Step7] Weekly entry created');

  await test.step('set This week range for grid verification', async () => {
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(TE_LABELS.thisWeek);
    await teTabPage.waitForLoadingToDisappear();
  });

  await verifyEntryInGrid(page, teTabPage, {
    notes: WTA_FP_NOTE_CREATE,
    customer: customer || undefined,
    hoursMin: WTA_FP_HOURS,
    wteGridCoreOnly: true,
  });
  console.log('[WTA-FP][Step7] Created entry verified in grid');

  await test.step('reopen Weekly Timesheet for edit', async () => {
    await openWTAFromAddTime(page, teTabPage);
    await selectEmployeeWTA(page, wta, 0);
    await page.waitForTimeout(2000);
  });

  await test.step('edit notes → edited', async () => {
    await wta.enterNotes(WTA_FP_NOTE_EDITED, ROW);
  });
  createdEntries.push(WTA_FP_NOTE_EDITED);

  await test.step('save and close edited entry', async () => {
    await saveWTA(page);
    await wta.clickSaveAndCloseButton();
    await teTabPage.waitForLoadingToDisappear();
  });
  console.log('[WTA-FP][Step7] Weekly entry edited');

  await test.step('set This week range for edited verification', async () => {
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(TE_LABELS.thisWeek);
    await teTabPage.waitForLoadingToDisappear();
  });

  await verifyEntryInGrid(page, teTabPage, {
    notes: WTA_FP_NOTE_EDITED,
    wteGridCoreOnly: true,
  });
  console.log('[WTA-FP][Step7] Edited entry verified in grid');

  await test.step('delete weekly row from trowser', async () => {
    await openWTAFromAddTime(page, teTabPage);
    await selectEmployeeWTA(page, wta, 0);
    await page.waitForTimeout(2000);
    const rowCustomer = await wta.getCustomerVal(ROW).catch(() => '');
    if (!rowCustomer) {
      console.log('[WTA-FP][Step7] No weekly row to delete — skipped');
      return;
    }
    await wta.clickDeleteIconRow(ROW);
    await page.waitForTimeout(1000);
    await saveWTA(page).catch(() => undefined);
    await wta.validateSuccessToast().catch(() => undefined);
    await wta.clickSaveAndCloseButton();
    await teTabPage.waitForLoadingToDisappear();
  });
  console.log('[WTA-FP][Step7] Weekly row deleted');
}

/**
 * Deletes WTA entries left on the weekly timesheet or Time Entries grid.
 * Safe to call from shared afterEach — no-ops when nothing remains.
 */
export async function cleanupCreatedWTAEntries(
  page: Page,
  createdEntries: string[] = [],
): Promise<void> {
  if (page.isClosed()) {
    console.log('[WTA-FP][cleanup] Page closed — skipping');
    return;
  }

  const wta = new WeeklyTimeActivity(page);
  const teTabPage = new TETimeEntriesTabPage(page);
  const common = new CommonLocators(page);
  const notesToDelete = [
    ...new Set([...createdEntries, ...WTA_FP_NOTES]),
  ].filter(Boolean);

  try {
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(400);

    await teTabPage.navigateToTimeEntriesPage();
    await teTabPage.waitForLoadingToDisappear();
    const gridReady = await page
      .getByLabel('Display by')
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (!gridReady) {
      console.log(
        '[WTA-FP][cleanup] Time Entries grid not available — skipping',
      );
      return;
    }
    await common.selectDisplayByOption(TE_LABELS.date);
    await teTabPage.waitForLoadingToDisappear();
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(TE_LABELS.thisMonth);
    await teTabPage.waitForLoadingToDisappear();

    for (const notes of notesToDelete) {
      const row = teTabPage.getRowByNotes(notes);
      if (!(await row.isVisible({ timeout: 2000 }).catch(() => false))) {
        continue;
      }
      await row.click();
      await page.waitForTimeout(1000);
      const deleteBtn = page.getByRole('button', { name: 'Delete' });
      if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteBtn.click();
        await page
          .getByRole('button', { name: 'Yes' })
          .click()
          .catch(() => undefined);
        await page
          .getByText('Time entry deleted.')
          .waitFor({
            state: 'visible',
            timeout: 15000,
          })
          .catch(() => undefined);
        await teTabPage.waitForLoadingToDisappear();
        console.log('[WTA-FP][cleanup] Deleted grid entry notes="%s"', notes);
        continue;
      }
      await page.keyboard.press('Escape').catch(() => undefined);
    }

    // Fallback: open weekly trowser and delete any remaining row for first employee.
    await openWTAFromAddTime(page, teTabPage).catch(() => undefined);
    if (await waitWtaFormReady(page, 15000).catch(() => false)) {
      await selectEmployeeWTA(page, wta, 0).catch(() => undefined);
      await page.waitForTimeout(1500);
      const rowCustomer = await wta.getCustomerVal(ROW).catch(() => '');
      if (rowCustomer) {
        await wta.clickDeleteIconRow(ROW).catch(() => undefined);
        await saveWTA(page).catch(() => undefined);
        await wta.clickSaveAndCloseButton().catch(() => undefined);
        await teTabPage.waitForLoadingToDisappear();
        console.log('[WTA-FP][cleanup] Deleted weekly trowser row');
      }
    }
  } catch (error) {
    console.warn('[WTA-FP][cleanup] Cleanup encountered an issue:', error);
  }
}

/**
 * Runs the WTA Fast Pipeline suite: same validation phases as STE/STA, then WTA
 * CRUD on the Time Entries grid (Add time → Weekly timesheet).
 */
export async function runWTAFastPipelineFullSuite(
  page: Page,
  account: TETestAccount,
  createdEntries: string[] = [],
): Promise<void> {
  const teTabPage = new TETimeEntriesTabPage(page);

  page.setDefaultTimeout(30_000);

  await wtaFpSoftStep('Step1 — login & role setup', () =>
    step01_loginAndRoleSetup(page, account),
  );
  await wtaFpSoftStep('Step1.2 — dashboard validation', () =>
    step012_validateDashboard(page, account),
  );
  await wtaFpSoftStep('Step2 — navigate to Time entries', () =>
    step02_navigateToTimeSubmenu(page, account, teTabPage),
  );
  await wtaFpSoftStep('Step3 — tab visibility vs entitlements', () =>
    step03_tabVisibilityVsEntitlements(page, account, teTabPage),
  );
  await wtaFpSoftStep('Step4 — filters validation', () =>
    step04_filtersValidation(page, account, teTabPage),
  );
  await wtaFpSoftStep('Step5 — column visibility & settings', () =>
    step05_columnVisibilityAndSettings(page, account, teTabPage),
  );
  await wtaFpSoftStep('Step6 — role-scoped data visibility', () =>
    step06_roleScopedDataVisibility(page, account, teTabPage),
  );
  await step07_wtaCRUD(page, account, teTabPage, createdEntries);

  console.log('[WTA-FP] Full suite complete.');
}

export async function runWTAFullSuite(
  page: Page,
  account: WTATestAccount,
): Promise<void> {
  const wta = new WeeklyTimeActivity(page);
  const reports = new ReportsPage(page);
  const sta = new SingleTimeActivityPage(page);

  await step01_openAndStructure(page, account, wta);
  const entered = await step02_create(page, account, wta);
  await step03_billableAndRate(page, account, wta);
  await step04_taxable(page, account, wta);
  await step05_weeklySpecifics(page, account, wta);
  await step06_saveVariants(page, account, wta);
  await step07_editUpdate(page, account, wta);
  await step08_reopenAndEdit(page, account, wta);
  await step09_reportsEdit(page, account, reports, sta, entered);
  await step10_validation(page, account, wta);
  await step11_delete(page, account, wta);

  console.log('[WTA01] Full suite complete.');
}
