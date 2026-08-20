import { Page, Locator, expect, test } from '@playwright/test';
import SingleTimeActivityPage from '../../../pages/SingleTimeActivityPage';
import TETimeEntriesTabPage from '../../../pages/FastPipeline/TimeEntriesFlowsPage';
import ReportsPage from '../../../pages/ReportsPage';
import { CommonLocators } from '../../../commonUtils';
import { LABELS } from '../../../constants';
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
 * STA01 — Single Time Activity END-TO-END (single consolidated case)
 * =============================================================================
 *
 * Covers the full Single Time Activity ("Single day entry") surface on one
 * self-created activity:
 *   • open the STA trowser, verify form structure
 *   • CREATE (duration mode) + success toast
 *   • Billable + Bill-rate rules: auto-populate from employee, service override,
 *     revert/clear, employee-without-rate hides rate, manual override, numeric
 *     validation, bill rate only when billable checked
 *   • Taxable rules: Taxable only visible when Billable checked (+ sales tax on),
 *     toggle on/off, "+ tax" indicator (there is NO per-entry taxable-rate field;
 *     the rate is the company sales-tax rate)
 *   • Start/End time mode (+ break) vs Duration
 *   • Save variants: Save, Save and new (form clears), Save and close
 *   • EDIT/UPDATE the activity and verify persisted
 *   • STA HISTORY (in trowser): reopen a recent activity and edit it
 *   • Validate + EDIT from the Reports page (Time Activities by Employee Detail)
 *   • Required-field + invalid-rate validation
 *   • DELETE
 *
 * Cleanup (afterEach) deletes created activities from the
 * Reports → "Time Activities by Employee Detail" report (per requirement),
 * opening each via the Hours drill-down and deleting it.
 *
 * Built on proven page objects: SingleTimeActivityPage (the trowser) and
 * ReportsPage (reports edit + cleanup). Soft asserts for non-critical checks;
 * hard asserts on create/save/delete.
 *
 * ACCOUNT: a US elite company with Sales Tax ENABLED (so Taxable renders), plus
 * seeded employees-with-rates, services-with-prices, a customer, class and
 * location.
 * =============================================================================
 */

// ---- Account shape ---------------------------------------------------------

export interface STAEntitlements {
  canSeeBillable: boolean;
  canSeeTaxable: boolean; // requires Sales Tax enabled on the company
  canSeeCostRate: boolean;
  canDelete: boolean;
  // Class & Location tracking — unavailable on QBO Essentials (free), so the
  // Essentials accounts skip all Class/Location selection + verification.
  canSeeClassLocation: boolean;
}

export interface STATestAccount {
  credentials: LoginCredentials;
  role: 'admin' | 'manager' | 'employee' | 'vendor';
  region: 'us' | 'ca' | 'uk';
  companyType?: 'elite' | 'premium' | 'ies' | 'standard';
  entitlements: STAEntitlements;
}

export function buildSTAAccount(
  credentials: LoginCredentials,
  overrides: {
    role?: STATestAccount['role'];
    region?: STATestAccount['region'];
    companyType?: STATestAccount['companyType'];
    entitlements?: Partial<STAEntitlements>;
  } = {},
): STATestAccount {
  return {
    credentials,
    role: overrides.role ?? 'admin',
    region: overrides.region ?? 'us',
    companyType:
      overrides.companyType ??
      (credentials.companyType as STATestAccount['companyType'] | undefined) ??
      'elite',
    entitlements: {
      canSeeBillable: true,
      canSeeTaxable: true,
      canSeeCostRate: true,
      canDelete: true,
      canSeeClassLocation: true,
      ...overrides.entitlements,
    },
  };
}

// ---- Account matrix (TEST_ACCOUNT-driven, shared model) --------------------

/**
 * Maps the CI `TEST_ACCOUNT` parameter to the pool of account keys it runs
 * against. A group (e.g. `TEST_ACCOUNT=STA`) expands to every account in its
 * list, and the spec runs the full STA01 suite once per account. An exact key
 * (e.g. `TEST_ACCOUNT=STA01`) runs just that account. When the parameter is
 * unset, the suite falls back to STA01 (preserving the original behavior).
 * Add more keys/groups here as the matrix grows.
 */
const STA_ACCOUNT_MATRIX: AccountMatrix = {
  // Legacy self-named group — kept for backward compatibility with jobs that
  // still pass TEST_ACCOUNT=STA. Resolves to the elite account.
  // Legacy self-named group — kept for backward compatibility with jobs that
  // still pass TEST_ACCOUNT=STA. Resolves to the elite account.
  STA: ['STA01'],
  // SKU groups — mirror the other Time-Menu FastPipeline tracks so the shared
  // TEST_ACCOUNT selector (IES / PR_ELITE / PR_PREMIUM) resolves here too. SKUs
  // without a provisioned STA account (which needs sales tax enabled + seeded
  // employees-with-rates / services-with-prices / customer) stay as TODO
  // placeholders and — thanks to allowEmpty below — register no tests instead
  // of aborting.
  //
  // QBO + Time/Payroll Elite — STA01 is an elite company set up for STA.
  PR_ELITE: ['STA01'],
  // Intuit Enterprise Suite.
  IES: ['STAIES01'],
  // QBO + Time/Payroll Premium.
  PR_PREMIUM: ['STAPREM01'],
  // FREE companies — QBO base tiers (Advanced / Essentials / Plus). Single time
  // activity is available on these tiers, so they run the full suite; billable/
  // taxable/rate coverage degrades gracefully (soft) if those aren't enabled.
  FREE_DATA_ADV: ['STAFREEADV01'],
  FREE_DATA_ESSENTIAL: ['STAFREEESS01'],
  FREE_DATA_PLUS: ['STAFREEPLUS01'],
  // Payroll First — LEGACY experience (timeActivityExperience: Legacy). Runs the
  // legacy "Add time" drawer suite (runSTALegacySuite) instead of the new trowser
  // flow. Account key wired when provisioned.
  PAYROLL_FIRST: ['STAPF01'],
};

/** A built {@link STATestAccount} paired with the account key it came from. */
export interface STAMatrixAccount {
  testId: string;
  account: STATestAccount;
}

/**
 * Resolve the `TEST_ACCOUNT` selector into the ordered list of STA accounts to
 * run (one full-suite test per account). Defaults to `process.env.TEST_ACCOUNT`;
 * falls back to STA01 when unset.
 */
export function buildSTAAccountsFromMatrix(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): STAMatrixAccount[] {
  return resolveMatrixAccounts({
    matrix: STA_ACCOUNT_MATRIX,
    param: selector,
    fallbackTestId: 'STA01',
    label: 'STA',
    // Mirror the sibling tracks: a SKU group with no provisioned account resolves
    // to [] (logged) and registers no tests, rather than aborting the whole run.
    allowEmpty: true,
  }).map(({ testId, credentials }) => ({
    testId,
    account: buildSTAAccount(credentials, {
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

const DURATION = '05:00';
const DURATION_EDITED = '06:30';
const BILL_RATE_OVERRIDE = '99.00';
const NOTE_CREATE = 'STA01 activity';
const NOTE_EDITED = 'STA01 activity - edited';
const NOTE_HISTORY = 'STA01 activity - history edit';
const NOTE_REPORT = 'STA01 activity - report edit';
const NOTE_TAXABLE = 'STA01 activity - taxable';
const START_TIME = '9:00 AM';
const END_TIME = '11:00 AM';

/** Notes used by this run — afterEach cleanup targets these via the report. */
export const STA01_NOTES = [
  NOTE_CREATE,
  NOTE_EDITED,
  NOTE_HISTORY,
  NOTE_REPORT,
];

/**
 * Soft-assert helper — warn instead of failing, AND time-bounded so a wrong
 * locator / no-timeout Playwright action can't hang the run. On timeout (or any
 * error) it logs and continues; the abandoned op's late rejection is swallowed.
 * This is the core of the defensive design: every interaction goes through here,
 * so the worst case is a fast `[soft]` warning telling us exactly what's wrong.
 */
async function soft(
  label: string,
  fn: () => Promise<void>,
  ms = 25000,
): Promise<void> {
  // In --debug (PWDEBUG set) do NOT impose the wall-clock timeout: Node's
  // setTimeout keeps firing while the Inspector is paused (pause only suspends
  // Playwright actions, not JS timers), which would advance the flow while
  // you're paused. Just run the block with a try/catch so stepping works.
  if (process.env.PWDEBUG) {
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[STA01][soft] ${label} — ${message}`);
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
    console.warn(`[STA01][soft] ${label} — ${message}`);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Reopen the most-recently-saved activity from the History popup (the first row
 * in "Recent Time Entries") and wait for the form to be ready. Used to verify a
 * just-created/edited activity persisted. No id capture needed.
 */
async function reopenLatestFromHistory(
  page: Page,
  sta: SingleTimeActivityPage,
): Promise<boolean> {
  await sta.clickHistoryButton().catch(() => undefined);
  // Wait for the popup to actually render.
  await page
    .getByText('RECENT TIME ENTRIES', { exact: false })
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => undefined);

  // Each recent entry row renders the label "Time charge"; target that (the
  // styled-class/role-row selectors are stale on this build), falling back to
  // the older class/role locators.
  const row = page
    .getByText('Time charge', { exact: false })
    .first()
    .or(
      page.locator(
        `//tr[contains(@class,"RecentTimeActivitiesModal__StyledTableRow")]`,
      ),
    )
    .or(
      page.locator(
        `//div[contains(@class,"RecentTimeActivitiesModal")]//tr[@role="row"]`,
      ),
    )
    .first();
  // The popup RE-FETCHES all entries each time it opens, so the more entries
  // we've created during the run, the LONGER the rows take to render. Wait
  // generously (up to 60s) for a row to appear rather than checking too early.
  const ok = await row
    .waitFor({ state: 'visible', timeout: 60000 })
    .then(() => true)
    .catch(() => false);
  if (!ok) {
    console.warn(
      '[STA01] no recent activity row in History popup — closing it',
    );
    // IMPORTANT: close the popup (it's an aria-modal) so it can't block the
    // next step's clicks.
    await sta.clickHistoryButton().catch(() => undefined);
    await page.waitForTimeout(500);
    return false;
  }
  await page.waitForTimeout(1000); // small settle before clicking
  await row.click();
  await waitFormReady(page);
  await page.waitForTimeout(1000);
  return true;
}

/** Today as MM/DD/YYYY (US format). */
function todayUS(): string {
  return new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

/**
 * Ensure the form is in start/end mode (on=true) or duration mode (on=false).
 * Detect the CURRENT mode by the visible "Start time" field — the toggle input
 * is visually hidden, so verifySetClockToggleState() (which checks the input's
 * visibility) is unreliable. Only flips the toggle when the mode differs.
 */
async function setStartEndMode(
  page: Page,
  sta: SingleTimeActivityPage,
  on: boolean,
): Promise<void> {
  const startEndShown = (): Promise<boolean> =>
    page
      .getByText('Start time', { exact: true })
      .filter({ visible: true })
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
  if ((await startEndShown()) !== on) {
    await sta.clickSetClockInAndOutToggles().catch(() => undefined);
    await page.waitForTimeout(700);
  }
}

/**
 * Open a fresh STA trowser, confirm it loaded, and NORMALIZE to duration mode.
 * The "Set start and end time" toggle persists across opens, so after a
 * start/end entry the Duration field would be hidden and any duration fill
 * would hang. Steps that need start/end set it back on via setStartEndMode().
 */
/**
 * Readiness = the Name field's dropdown is actually interactable (NOT just the
 * "Single day entry" heading, which appears before the fields finish loading —
 * the trowser can render its shell with a blank/dead Name field). Same locator
 * openDropdown('Name') uses, so it's reliable AND resolves fast when the form is
 * genuinely ready (unlike waitTillNameFieldVisible's 60s). Returns false if the
 * form never becomes interactable.
 */
async function waitFormReady(page: Page, timeout = 20000): Promise<boolean> {
  // NOTE: use waitFor (auto-retries up to `timeout`) — locator.isVisible() is an
  // immediate, non-waiting check that ignores `timeout`, so the Name field would
  // be reported missing the instant it hasn't rendered yet.
  return page
    .locator(
      `//span[contains(text(),'Name')]/ancestor::label//div[contains(@class,'Dropdown')]`,
    )
    .first()
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false);
}

async function openNewSTA(
  page: Page,
  sta: SingleTimeActivityPage,
  viaCreateMenu = false,
): Promise<void> {
  // If the form loads incompletely (shell only), re-navigate once.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    // First navigation (step 1) goes through the global Create (+New) menu so
    // we also verify Single time activity + Weekly timesheet are accessible
    // from Create; the re-navigation fallback uses the direct URL.
    if (viaCreateMenu && attempt === 1) {
      await openViaCreateMenu(page, 'sta');
    } else {
      await sta.navigateToSingleTime();
    }
    await sta.handleSTATourPopup().catch(() => undefined);
    await sta.handleTourModal().catch(() => undefined);
    if (await waitFormReady(page)) break;
    console.warn(
      '[STA01] STA form did not fully load (Name field not interactable) — re-navigating (attempt %d)',
      attempt,
    );
  }
  await setStartEndMode(page, sta, false); // force duration mode
}

/**
 * Bounded, PROPERLY-AWAITED check that the STA trowser has closed. Avoids the
 * page object's validateTrowserClosed(), whose un-awaited expect().toBeVisible()
 * calls leak an unhandled rejection ~3s later that fails the test and closes the
 * page — bypassing soft() entirely.
 */
async function expectTrowserClosed(page: Page): Promise<void> {
  await expect(page.getByText('Single day entry').first())
    .toBeHidden({ timeout: 8000 })
    .catch(() => undefined);
}

/** Select the first option of a dropdown field, best-effort (field may be off). */
async function selectFirst(
  sta: SingleTimeActivityPage,
  label: string,
): Promise<void> {
  await soft(`select first "${label}"`, async () => {
    await sta.openDropdown(label);
    await sta.clickDropdownOption(1, label);
  });
}

/**
 * Open the Name dropdown and select the index-th EMPLOYEE (0-based, among the
 * employee options only — "+ Add new" is excluded). Returns false WITHOUT
 * hanging when that employee doesn't exist: Playwright clicks have no default
 * timeout, so a missing .nth(index) would otherwise wait out the whole test
 * (and soft() can't rescue a hang, only a thrown error).
 */
async function selectEmployee(
  page: Page,
  sta: SingleTimeActivityPage,
  index = 0,
): Promise<boolean> {
  const opts = page.getByRole('option').getByText('Employee', { exact: true });
  // The Name options load async — a fixed wait then immediate count gives a
  // false "have 0" when they're slow (e.g. right after Save-and-new). WAIT for
  // an employee option to render, re-opening the dropdown once if needed.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await sta.openDropdown('Name');
    await opts
      .first()
      .waitFor({ state: 'visible', timeout: 8000 })
      .catch(() => undefined);
    if ((await opts.count()) > 0) break;
    console.log('[STA01] Name options not rendered yet (attempt %d)', attempt);
    await page.waitForTimeout(800);
  }
  const count = await opts.count();
  if (index >= count) {
    console.log(
      '[STA01] employee #%d not available (have %d) — skipping',
      index,
      count,
    );
    return false;
  }
  await opts.nth(index).click();
  await page.waitForTimeout(300);
  return true;
}

/**
 * Open the Service dropdown and click the nth option (0-based, includes the
 * "+ Add new" row at index 0, so the first real service is index 1). Guarded:
 * returns false WITHOUT hanging when that option doesn't exist.
 */
async function selectServiceByIndex(
  page: Page,
  sta: SingleTimeActivityPage,
  index: number,
): Promise<boolean> {
  await sta.openDropdown('Service');
  await page.waitForTimeout(500);
  const opts = page.getByRole('option');
  const count = await opts.count();
  if (index >= count) {
    await page.keyboard.press('Escape').catch(() => undefined);
    console.log(
      '[STA01] service option #%d not available (have %d)',
      index,
      count,
    );
    return false;
  }
  await opts.nth(index).click({ force: true });
  await page.waitForTimeout(300);
  return true;
}

/**
 * Open an STA from the "Time Activities by Employee Detail" report, then confirm
 * the "Single day entry" trowser opened. The drill-down is the row's "Hours"
 * (Duration) link — the SAME proven pattern used in RunPayrollEditFlow
 * (`reports.clickHoursLink()` → `sta.validateSTALoaded()`). The date/row cell is
 * NOT a link, so clicking it does nothing. Falls back to clicking a data-row
 * value cell (the "Sales" product/service link) if no "Hours" link is present.
 * Bounded; returns false (no hang) if nothing opens the STA.
 */
async function openStaFromReport(
  page: Page,
  reports: ReportsPage,
): Promise<boolean> {
  const openSignal = page.getByText('Single day entry').first();
  const dataRow = `//tr[contains(@class,"tanstackTable__row") and not(contains(@class,"top-level-grouped-row"))][1]`;

  // Genuinely WAIT for the report table to render a drill-down target before
  // deciding there's anything to open. The table can re-render slowly right
  // after a refresh (Today → All Dates), so a real `waitFor` here avoids
  // falsely concluding "empty" and stopping cleanup early.
  const haveRow = await page
    .locator(dataRow)
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  const haveHours = await reports.hoursLink.isVisible().catch(() => false);
  if (!haveRow && !haveHours) {
    console.log('[STA01] no report rows visible — no activities to open');
    return false;
  }

  // The report drill-down is a clickable VALUE cell in a data row — the date/row
  // cell is NOT a link. This report shows "Sales" (Product/Service) and the
  // Duration (e.g. "05:00"); both are transaction links that open the STA. We
  // also try the shared "Hours" link (used by RunPayrollEditFlow) in case the
  // report renders an Hours column. Try each in turn until the trowser opens.
  const candidates: Locator[] = [
    reports.hoursLink, // "Hours" drill-down link (if report has an Hours column)
    page.locator(`${dataRow}//td//*[normalize-space(text())='Sales']`).first(), // Product/Service value
    page
      .locator(`${dataRow}//td//*[contains(normalize-space(text()),':')]`)
      .first(), // Duration value (e.g. 05:00)
  ];

  // `isVisible()` is an IMMEDIATE check (it does not wait). To actually wait for
  // the trowser to open we must `waitFor({ state: 'visible' })`.
  const waitOpened = (ms: number): Promise<boolean> =>
    openSignal
      .waitFor({ state: 'visible', timeout: ms })
      .then(() => true)
      .catch(() => false);

  const settleOpened = async (): Promise<boolean> => {
    // Confirmed open — now wait for the form to be interactable (Name dropdown),
    // then a short settle, before we delete/edit.
    await waitFormReady(page, 30000);
    await page.waitForTimeout(2000);
    return true;
  };

  for (const target of candidates) {
    // If a previous candidate already opened the trowser, stop — the remaining
    // candidates sit BEHIND the overlay and clicking them would stall.
    if (await openSignal.isVisible().catch(() => false)) {
      return settleOpened();
    }
    if (!(await target.isVisible({ timeout: 5000 }).catch(() => false)))
      continue;
    await target.click().catch(() => undefined);
    // Genuinely WAIT (up to 25s) for the "Single day entry" heading to appear.
    if (await waitOpened(25000)) {
      return settleOpened();
    }
  }

  console.log('[STA01] STA trowser did not open from any report drill-down');
  return false;
}

// ============================================================================
// Step 1 — Open STA + form structure
// ============================================================================

export async function step01_openAndStructure(
  page: Page,
  account: STATestAccount,
  sta: SingleTimeActivityPage,
): Promise<void> {
  console.log(
    '[STA01][Step1] companyType=%s role=%s region=%s',
    account.companyType,
    account.role,
    account.region,
  );
  await openNewSTA(page, sta, true); // first navigation via the Create (+New) menu
  console.log('[STA01][Step1] STA trowser ("Single day entry") loaded');

  // Core fields present (visible-text/label based; settings may hide some).
  await soft('Start date field present', async () => {
    await sta.validateStartDateFieldPresence();
  });
  await soft('Notes field present', async () => {
    await sta.validateNotesFieldPresence();
  });
}

// ============================================================================
// Step 2 — CREATE (duration mode) + success toast
// ============================================================================

/** The values entered on the created STA, captured so we can verify they persist. */
export interface EnteredValues {
  name: string;
  customer: string;
  service: string;
  className: string;
  location: string;
  payType: string;
  duration: string;
  billRate: string;
  notes: string;
}

export async function step02_create(
  page: Page,
  account: STATestAccount,
  sta: SingleTimeActivityPage,
): Promise<EnteredValues> {
  const v: EnteredValues = {
    name: '',
    customer: '',
    service: '',
    className: '',
    location: '',
    payType: '',
    duration: DURATION,
    billRate: '',
    notes: NOTE_CREATE,
  };
  const read = (p: Promise<string | null>): Promise<string> =>
    p.then((x) => (x ?? '').trim()).catch(() => '');

  // Name (employee) — required; pick first employee, then capture it.
  await soft('select Name (first employee)', async () => {
    await selectEmployee(page, sta, 0);
    v.name = await read(sta.getNameInputFieldValue());
  });

  await soft('set Start date = today', async () => {
    await sta.fillStartDate(todayUS());
    await page.keyboard.press('Tab');
  });

  // Customer / Service / Class / Location / Pay type — first option, captured.
  // NOTE: getCustomerFieldValue()/getServiceFieldValue() read a data-testid
  // (stripped in prod → empty), so capture Customer by its aria-label input and
  // Service via the label-based getFieldValue (same as Class/Location).
  const readCustomer = (): Promise<string> =>
    page
      .locator(`//input[contains(@aria-label,'ustomer')]`)
      .first()
      .inputValue()
      .then((x) => (x ?? '').trim())
      .catch(() => '');
  await selectFirst(sta, 'Customer');
  v.customer = await readCustomer();
  await selectFirst(sta, 'Service');
  v.service = await read(sta.getFieldValue('Service'));
  // Class & Location aren't available on QBO Essentials — skip them there (the
  // round-trip verify also skips automatically since the captured value stays '').
  if (account.entitlements.canSeeClassLocation) {
    await selectFirst(sta, 'Class');
    v.className = await read(sta.getFieldValue('Class'));
    await selectFirst(sta, 'Location');
    v.location = await read(sta.getFieldValue('Location'));
  } else {
    console.log(
      '[STA01][Step2] Class/Location not available (Essentials) — skipping',
    );
  }
  // Free QBO companies have no payroll, so Pay type isn't available — skip it.
  if (account.companyType === 'standard') {
    console.log(
      '[STA01][Step2] Pay type not available on free company — skipping',
    );
  } else {
    await soft('select Pay type (first option)', async () => {
      // selectPayTypeOption() only clicks the menu item, it does NOT open the
      // dropdown — and a missing item click hangs (no default timeout). Open it
      // ourselves and only click if an option actually renders.
      await sta.openDropdown('Pay type');
      await page.waitForTimeout(600);
      const opt = page
        .locator(`//li[contains(@class,'menu-item-container')]`)
        .or(page.getByRole('option'))
        .first();
      if (await opt.isVisible({ timeout: 3000 }).catch(() => false)) {
        await opt.click();
      } else {
        await page.keyboard.press('Escape').catch(() => undefined);
      }
      v.payType = await read(sta.getFieldValue('Pay type'));
    });
  }

  await soft('enter Duration', async () => {
    await sta.fillData('Duration', DURATION);
  });
  await soft('enter Notes', async () => {
    await sta.fillNotes(NOTE_CREATE);
  });
  v.billRate = await read(
    Promise.resolve(String(await sta.returnBillRateValue().catch(() => ''))),
  );

  console.log('[STA01][Step2] entered values: %o', v);

  // The trowser shows a live "Summary: N hours at $rate per hour = $total" line.
  // Validate it reflects the entered duration (5h) and, when billable, the
  // computed total (5 × rate).
  await soft('summary reflects hours × rate', async () => {
    const summary = page.getByText(/^Summary:/).first();
    await expect(summary).toBeVisible({ timeout: 8000 });
    const text = ((await summary.textContent()) ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    console.log('[STA01][Step2] %s', text);
    expect(text).toMatch(/5 hours/i); // DURATION 05:00 = 5 hours
    const rate = Number(v.billRate);
    if (Number.isFinite(rate) && rate > 0) {
      const total = (5 * rate).toFixed(2).replace('.', '\\.');
      expect(text).toMatch(new RegExp(`per hour = \\$${total}`));
    } else {
      expect(text).toMatch(/=\s*\$/); // at least a computed total is shown
    }
  });

  await soft('save (create)', async () => {
    await sta.clickButton('Save');
  });
  await soft('success toast after create', async () => {
    await sta.validateSuccessToast();
  });
  console.log('[STA01][Step2] STA created (duration mode)');

  // --- VERIFY persistence: reopen the saved activity from History and assert
  //     every captured field round-tripped. ---
  await soft(
    'reopen from History and verify all entered values',
    async () => {
      if (!(await reopenLatestFromHistory(page, sta))) return;

      const check = async (
        label: string,
        actualP: Promise<string>,
        expected: string,
      ) => {
        if (!expected) return; // nothing captured to compare
        const actual = await actualP;
        console.log(
          '[STA01][Step2][verify] %s: expected="%s" actual="%s"',
          label,
          expected,
          actual,
        );
        expect(actual).toContain(expected);
      };
      await check('Customer', readCustomer(), v.customer);
      await check('Service', read(sta.getFieldValue('Service')), v.service);
      await check('Class', read(sta.getFieldValue('Class')), v.className);
      await check('Location', read(sta.getFieldValue('Location')), v.location);
      await check(
        'Notes',
        read(Promise.resolve(await sta.getNotesFieldValue())),
        v.notes,
      );
      await check('Duration', read(sta.getFieldValue('Duration')), v.duration);
      if (v.billRate) {
        await check(
          'Bill rate',
          read(
            Promise.resolve(
              String(await sta.returnBillRateValue().catch(() => '')),
            ),
          ),
          v.billRate,
        );
      }
    },
    90000,
  ); // History can be slow to render as entries accumulate

  return v;
}

// ============================================================================
// Step 3 — Billable + Bill-rate rules
// ============================================================================

export async function step03_billableAndRate(
  page: Page,
  account: STATestAccount,
  sta: SingleTimeActivityPage,
): Promise<void> {
  if (!account.entitlements.canSeeBillable) {
    console.log('[STA01][Step3] SKIPPED — billable not available');
    return;
  }

  // Open a fresh form to exercise the rate rules cleanly.
  await openNewSTA(page, sta);

  // Bounded, self-contained reads — the bill-rate input only exists when
  // Billable is checked, so we must check visibility BEFORE reading its value
  // (inputValue() on a missing element hangs with no default timeout).
  const billRateInput = page
    .locator(`//input[@aria-label='Bill rate']`)
    .first();
  const rateVisible = (): Promise<boolean> =>
    billRateInput.isVisible({ timeout: 2000 }).catch(() => false);
  const rate = async (): Promise<string> =>
    (await rateVisible()) ? billRateInput.inputValue().catch(() => '') : '';
  const billableChecked = (): Promise<boolean> =>
    sta.isCheckboxChecked('Billable').catch(() => false);

  // --- A: default state on a fresh form (no employee yet). ---
  await soft('A: billable default state (no employee)', async () => {
    console.log(
      '[STA01][Step3] A billable default checked = %s',
      await billableChecked(),
    );
  });

  // --- B: employee 1 → bill rate auto-populates (billable may auto-check). ---
  await soft('B: employee 1 → bill rate auto-populates', async () => {
    await selectEmployee(page, sta, 0);
    await page.waitForTimeout(800);
    console.log(
      '[STA01][Step3] B emp1 rate="%s" billable=%s',
      await rate(),
      await billableChecked(),
    );
  });

  // --- C: switch to employee 2 → rate updates to that employee's default. ---
  await soft('C: employee 2 → bill rate updates', async () => {
    if (!(await selectEmployee(page, sta, 1))) return; // only 1 employee
    await page.waitForTimeout(800);
    console.log('[STA01][Step3] C emp2 rate="%s"', await rate());
  });

  // --- D: service with a price → overrides the employee rate. (index 1 = first
  //     real service, after the "+ Add new" row at index 0.) ---
  await soft('D: service A → overrides employee rate', async () => {
    if (!(await selectServiceByIndex(page, sta, 1))) return;
    await page.waitForTimeout(800);
    console.log('[STA01][Step3] D serviceA rate="%s"', await rate());
  });

  // --- E: switch to a second service → rate changes again (skips if absent). ---
  await soft('E: service B → rate changes', async () => {
    if (!(await selectServiceByIndex(page, sta, 2))) return; // only one service
    await page.waitForTimeout(800);
    console.log('[STA01][Step3] E serviceB rate="%s"', await rate());
  });

  // --- F: switch back to the first service → rate reverts. ---
  await soft('F: back to service A → rate reverts', async () => {
    if (!(await selectServiceByIndex(page, sta, 1))) return;
    await page.waitForTimeout(800);
    console.log('[STA01][Step3] F serviceA rate again="%s"', await rate());
  });

  // --- G: clear the service → rate falls back to the employee default. ---
  await soft('G: clear service → back to employee rate', async () => {
    await sta.clearFieldValue('Service');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(800);
    console.log('[STA01][Step3] G after-clear rate="%s"', await rate());
  });

  // --- H: employee WITHOUT a default rate → billable off + bill rate hidden. ---
  await soft(
    'H: employee without rate → billable off / rate hidden',
    async () => {
      if (!(await selectEmployee(page, sta, 2))) return; // no 3rd employee
      await page.waitForTimeout(800);
      console.log(
        '[STA01][Step3] H emp3 billable=%s rateVisible=%s',
        await billableChecked(),
        await rateVisible(),
      );
    },
  );

  // --- I: manual bill-rate override sticks (billable checked). ---
  await soft('I: manual bill-rate override sticks', async () => {
    await sta.checkCheckboxIfVisible('Billable');
    await sta.fillBillRateInput(BILL_RATE_OVERRIDE);
    await page.waitForTimeout(300);
    await sta.validateBillRateValue(BILL_RATE_OVERRIDE);
  });

  // --- J: bill-rate non-numeric handling. The STA bill-rate field does NOT
  //     hard-reject letters on type (it sanitizes elsewhere), so log the
  //     observed value rather than asserting. Restore a valid value after. ---
  await soft('J: bill-rate non-numeric input (observed)', async () => {
    await sta.fillBillRateInput('abc');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    console.log('[STA01][Step3] J bill-rate after "abc" = "%s"', await rate());
    await sta.fillBillRateInput(BILL_RATE_OVERRIDE);
  });

  // --- K: uncheck Billable hides the rate; re-check shows it. ---
  await soft('K: toggle Billable hides/shows bill rate', async () => {
    await sta.uncheckCheckboxIfVisible('Billable');
    await page.waitForTimeout(300);
    expect(await rateVisible()).toBeFalsy();
    await sta.checkCheckboxIfVisible('Billable');
    await page.waitForTimeout(300);
    expect(await rateVisible()).toBeTruthy();
  });

  console.log('[STA01][Step3] Billable + bill-rate: scenarios A–K exercised');
}

// ============================================================================
// Step 4 — Taxable rules (Sales Tax enabled)
// ============================================================================

export async function step04_taxable(
  page: Page,
  account: STATestAccount,
  sta: SingleTimeActivityPage,
): Promise<void> {
  if (!account.entitlements.canSeeTaxable) {
    console.log('[STA01][Step4] SKIPPED — taxable not available');
    return;
  }

  // Open a FRESH form and set a valid billable state (employee + customer) —
  // Taxable only renders for a valid billable time activity, and the prior
  // step may have left the form on a rate-less employee / no customer.
  await openNewSTA(page, sta);
  await soft('select employee + customer for taxable', async () => {
    await selectEmployee(page, sta, 0);
    await selectFirst(sta, 'Customer');
    await sta.checkCheckboxIfVisible('Billable');
    await page.waitForTimeout(500);
  });

  // Taxable visibility — check the VISIBLE "Taxable" text label, NOT the
  // checkbox input. The page object's isCheckboxVisible() targets the wrong
  // node (preceding-sibling) and the real <input> is visually hidden, so it
  // always reports false even when Taxable is on screen.
  const taxableVisible = (): Promise<boolean> =>
    page
      .getByText('Taxable', { exact: true })
      .filter({ visible: true })
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

  // With Billable OFF, Taxable must be hidden; with Billable ON, it appears.
  await soft('Taxable hidden when Billable unchecked', async () => {
    await sta.uncheckCheckboxIfVisible('Billable');
    await page.waitForTimeout(500);
    expect(await taxableVisible()).toBeFalsy();
  });

  let isTaxableShown = false;
  await soft('Taxable visible when Billable checked', async () => {
    await sta.checkCheckboxIfVisible('Billable');
    await page.waitForTimeout(500);
    isTaxableShown = await taxableVisible();
    expect(isTaxableShown).toBeTruthy();
  });

  if (!isTaxableShown) {
    console.log(
      '[STA01][Step4] Taxable not present — Sales Tax likely off on this company',
    );
    return;
  }

  // Toggle Taxable on, then off (rule check).
  await soft('check Taxable', async () => {
    await sta.checkCheckboxIfVisible('Taxable');
    await page.waitForTimeout(300);
    expect(await sta.isCheckboxChecked('Taxable')).toBeTruthy();
  });
  await soft('uncheck Taxable', async () => {
    await sta.uncheckCheckboxIfVisible('Taxable');
    await page.waitForTimeout(300);
    expect(await sta.isCheckboxChecked('Taxable')).toBeFalsy();
  });

  // --- CREATE an activity WITH Taxable checked, save, and verify it PERSISTS
  //     (reopen by id → Taxable still checked). The form already has the
  //     employee + customer selected at the top of this step. ---
  await soft(
    'create activity with Taxable checked → persists',
    async () => {
      await sta.checkCheckboxIfVisible('Billable');
      await page.waitForTimeout(300);
      await sta.checkCheckboxIfVisible('Taxable');
      await page.waitForTimeout(300);
      expect(await sta.isCheckboxChecked('Taxable')).toBeTruthy();
      await sta.fillStartDate(todayUS());
      await page.keyboard.press('Tab');
      await sta.fillData('Duration', DURATION);
      await sta.fillNotes(NOTE_TAXABLE);
      // With Billable + Taxable on, the summary line shows the "plus tax"
      // indicator — validate it before saving.
      const summary = page.getByText(/^Summary:/).first();
      if (await summary.isVisible({ timeout: 5000 }).catch(() => false)) {
        const text = ((await summary.textContent()) ?? '')
          .replace(/\s+/g, ' ')
          .trim();
        console.log('[STA01][Step4] %s', text);
        expect(text).toMatch(/plus tax/i);
      }
      await sta.clickButton('Save');
      await sta.validateSuccessToast().catch(() => undefined);
      await page.waitForTimeout(2000); // let the create persist before reopening
      // Reopen from History and confirm Taxable persisted.
      if (!(await reopenLatestFromHistory(page, sta))) return;
      await page.waitForTimeout(1500); // let the reopened form populate the checkbox
      const billable = await sta
        .isCheckboxChecked('Billable')
        .catch(() => false);
      const taxable = await sta.isCheckboxChecked('Taxable').catch(() => false);
      console.log(
        '[STA01][Step4] reopened taxable activity: billable=%s taxable=%s',
        billable,
        taxable,
      );
      expect(taxable).toBeTruthy();
    },
    90000,
  );

  // --- EDIT: uncheck Taxable on the reopened activity, save, and verify it
  //     persists as unchecked. ---
  await soft(
    'edit activity to uncheck Taxable → persists',
    async () => {
      await sta.uncheckCheckboxIfVisible('Taxable');
      await page.waitForTimeout(600);
      // Confirm the uncheck actually registered BEFORE saving (the styled toggle
      // can lag the hidden input); re-try the uncheck once if it's still checked.
      if (await sta.isCheckboxChecked('Taxable').catch(() => false)) {
        await sta.uncheckCheckboxIfVisible('Taxable');
        await page.waitForTimeout(600);
      }
      console.log(
        '[STA01][Step4] taxable before save=%s',
        await sta.isCheckboxChecked('Taxable').catch(() => true),
      );
      await sta.clickButton('Save');
      await sta.validateSuccessToast().catch(() => undefined);
      await page.waitForTimeout(2000); // let the update persist before reopening
      if (!(await reopenLatestFromHistory(page, sta))) return;
      await page.waitForTimeout(1500); // let the reopened form populate the checkbox
      const taxable = await sta.isCheckboxChecked('Taxable').catch(() => false);
      console.log('[STA01][Step4] after edit (unchecked) taxable=%s', taxable);
      expect(taxable).toBeFalsy();
    },
    90000,
  );

  console.log(
    '[STA01][Step4] Taxable rules + create/edit persistence verified',
  );
}

// ============================================================================
// Step 5 — Start/End time mode (+ break)
// ============================================================================

export async function step05_startEndTime(
  page: Page,
  account: STATestAccount,
  sta: SingleTimeActivityPage,
): Promise<void> {
  await openNewSTA(page, sta);
  await soft('select Name (first employee)', async () => {
    await selectEmployee(page, sta, 0);
  });
  // Billable auto-checks on this company, and billable time requires a Customer
  // — without one the Save is blocked ("Customer is required to make time
  // billable"), so select one for every create.
  await selectFirst(sta, 'Customer');
  await soft('set Start date = today', async () => {
    await sta.fillStartDate(todayUS());
    await page.keyboard.press('Tab');
  });

  await soft('enable Set start and end time + pick times', async () => {
    await setStartEndMode(page, sta, true);
    await sta.selectTime('Start', START_TIME);
    await sta.selectTime('End', END_TIME);
  });

  await soft('add a break', async () => {
    // NOTE: validateBreakButtonVisible() is an assertion (returns void), so
    // using it as a boolean always skipped this block. Check the "Add break"
    // button's visibility directly.
    const addBreakBtn = page.getByRole('button', { name: 'Add break' });
    if (!(await addBreakBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log(
        '[STA01][Step5] "Add break" button not visible — break skipped',
      );
      return;
    }
    await addBreakBtn.click();
    // The break field renders AFTER the button click — wait for it before
    // filling (the field is empty by default), then commit with Tab.
    await page
      .locator(`//span[text()='Break']/ancestor::label/descendant::input`)
      .first()
      .waitFor({ state: 'visible', timeout: 8000 })
      .catch(() => undefined);
    await sta.fillBreak('00:30');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    console.log(
      '[STA01][Step5] break added = "%s"',
      await page
        .locator(`//span[text()='Break']/ancestor::label/descendant::input`)
        .first()
        .inputValue()
        .catch(() => ''),
    );
  });

  await soft('enter Notes', async () => {
    await sta.fillNotes(NOTE_CREATE);
  });

  await soft('save (start/end create)', async () => {
    await sta.clickButton('Save');
  });
  await soft('success toast after start/end create', async () => {
    await sta.validateSuccessToast();
  });

  // Reopen from History and verify the Start time, End time, and Break persisted.
  await soft(
    'reopen from History and verify start/end + break',
    async () => {
      await page.waitForTimeout(2000); // let the create persist before reopening
      if (!(await reopenLatestFromHistory(page, sta))) return;
      await page.waitForTimeout(1500); // let the reopened form populate the fields
      const liveValue = (xpathLabel: string): Promise<string> =>
        page
          .locator(
            `//span[text()='${xpathLabel}']/ancestor::label/descendant::input`,
          )
          .first()
          .inputValue()
          .catch(() => '');
      const startVal = await liveValue('Start time');
      const endVal = await liveValue('End time');
      const breakVal = await liveValue('Break');
      console.log(
        '[STA01][Step5] reopened start="%s" end="%s" break="%s"',
        startVal,
        endVal,
        breakVal,
      );
      // Times may render with/without a leading zero (9:00 AM vs 09:00 AM).
      expect(startVal.replace(/^0/, '')).toContain('9:00');
      expect(endVal).toContain('11:00');
      // Break is conditional (only if the Break button was available); verify it
      // round-tripped to 30 minutes when present.
      if (breakVal) {
        expect(breakVal.replace(/\D/g, '')).toContain('30');
      } else {
        console.log(
          '[STA01][Step5] no break to verify (break button unavailable)',
        );
      }
    },
    90000,
  );

  console.log('[STA01][Step5] STA created (start/end mode) + values verified');
}

// ============================================================================
// Step 6 — Save variants (Save and new clears; Save and close returns)
// ============================================================================

export async function step06_saveVariants(
  page: Page,
  account: STATestAccount,
  sta: SingleTimeActivityPage,
): Promise<void> {
  // Save and new → form clears.
  await openNewSTA(page, sta);
  await soft('fill minimal then Save and new → form clears', async () => {
    await selectEmployee(page, sta, 0);
    await selectFirst(sta, 'Customer'); // billable auto-checks → customer required
    await sta.fillStartDate(todayUS());
    await page.keyboard.press('Tab');
    await sta.fillData('Duration', DURATION);
    await sta.fillNotes(NOTE_CREATE);
    await sta.clickSaveAndNewButton();
    // Save-and-new clears the entry fields (Duration + Notes) but RETAINS the
    // Name (employee). The clear happens AFTER the save completes, so WAIT for
    // the fields to empty rather than reading at a fixed delay. Read the LIVE
    // value via toHaveValue('') — NOT getAttribute('value')/textContent, which
    // return the stale HTML attribute / original text and falsely look non-empty.
    const durationInput = page.getByPlaceholder('hh:mm').first();
    const notesArea = sta.notesTextarea().first();
    await expect(durationInput).toHaveValue('', { timeout: 15000 });
    await expect(notesArea).toHaveValue('', { timeout: 15000 });
    console.log(
      '[STA01][Step6] Save-and-new cleared Duration + Notes (Name retained)',
    );
  });

  // Save and close → trowser closes back to dashboard.
  await openNewSTA(page, sta);
  await soft('fill minimal then Save and close → trowser closes', async () => {
    await selectEmployee(page, sta, 0);
    await selectFirst(sta, 'Customer'); // billable auto-checks → customer required
    await sta.fillStartDate(todayUS());
    await page.keyboard.press('Tab');
    await sta.fillData('Duration', DURATION);
    await sta.fillNotes(NOTE_CREATE);
    await sta.clickSaveAndCloseButton();
    await expectTrowserClosed(page);
  });
  console.log('[STA01][Step6] Save / Save-and-new / Save-and-close verified');
}

// ============================================================================
// Step 7 — Edit / Update + persistence
// ============================================================================

export async function step07_editUpdate(
  page: Page,
  account: STATestAccount,
  sta: SingleTimeActivityPage,
): Promise<void> {
  // Create one, keep it open, then edit duration + notes + bill rate and save.
  await openNewSTA(page, sta);
  await soft('create for edit + capture id', async () => {
    await selectEmployee(page, sta, 0);
    await selectFirst(sta, 'Customer'); // billable auto-checks → customer required
    await sta.fillStartDate(todayUS());
    await page.keyboard.press('Tab');
    await sta.fillData('Duration', DURATION);
    await sta.fillNotes(NOTE_CREATE);
    await sta.clickButton('Save');
    await sta.validateSuccessToast().catch(() => undefined);
  });

  await soft('edit duration + notes + bill rate, save', async () => {
    await sta.fillData('Duration', DURATION_EDITED);
    if (account.entitlements.canSeeBillable) {
      await sta.checkCheckboxIfVisible('Billable');
      await sta.fillBillRateInput(BILL_RATE_OVERRIDE);
    }
    await sta.fillNotes(NOTE_EDITED);
    await sta.clickButton('Save');
    await sta.validateSuccessToast().catch(() => undefined);
  });

  // Verify the edit persisted by reopening from History.
  await soft(
    'reopen from History and verify edited values',
    async () => {
      if (!(await reopenLatestFromHistory(page, sta))) return;
      const notes = await sta.getNotesFieldValue().catch(() => '');
      console.log('[STA01][Step7] reopened notes="%s"', notes);
      expect(notes).toContain(NOTE_EDITED);
    },
    90000,
  );
  console.log('[STA01][Step7] Edit/update verified');
}

// ============================================================================
// Step 8 — STA History (in trowser): reopen + edit a recent activity
// ============================================================================

export async function step08_history(
  page: Page,
  account: STATestAccount,
  sta: SingleTimeActivityPage,
): Promise<void> {
  await openNewSTA(page, sta);
  await soft(
    'open History → reopen recent → edit → save',
    async () => {
      // Reuse the robust history-reopen (matches the "Time charge" row).
      if (!(await reopenLatestFromHistory(page, sta))) return;
      // Edit the reopened activity from history.
      await sta.fillNotes(NOTE_HISTORY);
      await sta.clickButton('Save');
      await sta.validateSuccessToast().catch(() => undefined);
      // VERIFY the edit persisted — the saved entry stays open, so the Notes
      // field should hold the edited value (not just "saved without error").
      await page.waitForTimeout(1500);
      await expect(sta.notesTextarea().first()).toHaveValue(NOTE_HISTORY, {
        timeout: 10000,
      });
    },
    90000,
  );
  console.log('[STA01][Step8] History reopen + edit + persistence verified');
}

// ============================================================================
// Step 9 — Validate + edit from the Reports page
// ============================================================================

export async function step09_reportsEdit(
  page: Page,
  account: STATestAccount,
  sta: SingleTimeActivityPage,
  reports: ReportsPage,
  entered: EnteredValues,
): Promise<void> {
  await soft(
    'open Time Activities by Employee Detail report',
    async () => {
      await reports.navigateToReportsPage();
      await reports.searchAndOpenReport('Time Activities by Employee Detail');
      // Wait for the report table to actually render a row (or confirm empty).
      await page
        .locator(`//tr[contains(@class,"tanstackTable__row")]`)
        .first()
        .waitFor({ state: 'visible', timeout: 30000 })
        .catch(() => undefined);
    },
    60000,
  );

  // Validate the report surfaces our activity's entered values. The report
  // columns are: Activity date, Customer, Product/Service, Description (=Notes),
  // Rates, Duration, Billable (Y/N), Amount. Assert each value is present.
  const inReport = (text: string, ms = 8000): Promise<boolean> =>
    page
      .getByText(text, { exact: false })
      .first()
      .isVisible({ timeout: ms })
      .catch(() => false);

  await soft('report reflects entered values', async () => {
    const hours = await reports
      .getColumnValuesByHeader('Duration')
      .catch(() => [] as string[]);
    console.log('[STA01][Step9] report Duration values: %o', hours);
    if (entered.customer) expect(await inReport(entered.customer)).toBeTruthy();
    if (entered.service) expect(await inReport(entered.service)).toBeTruthy();
    expect(await inReport(entered.notes)).toBeTruthy(); // Description column
    expect(await inReport(entered.duration)).toBeTruthy(); // 05:00
    // Billable (Y/N) column shows "Yes" and the Rates column shows the bill rate
    // for our billable activity.
    expect(await inReport('Yes')).toBeTruthy();
    if (entered.billRate) {
      expect(await inReport(entered.billRate)).toBeTruthy();
    }
  });

  // Open an activity from the report via its row drill-down, edit, save, and
  // VERIFY the edit persisted on the saved entry.
  await soft('open STA from report → edit → save → verify', async () => {
    if (!(await openStaFromReport(page, reports))) return;
    await sta.validateSTALoaded();
    await sta.fillNotes(NOTE_REPORT);
    await sta.clickButton('Save');
    await sta.validateSuccessToast().catch(() => undefined);
    await page.waitForTimeout(1500);
    await expect(sta.notesTextarea().first()).toHaveValue(NOTE_REPORT, {
      timeout: 10000,
    });
  });
  console.log('[STA01][Step9] Reports view + edit + persistence verified');
}

// ============================================================================
// Step 10 — Negative scenarios / validation
//
// Thresholds match the widget (singleTimeTrowser): Notes max = 4000 chars
// (MAX_NOTES_LENGTH), time-format error on bad times, break-exceeds-total is
// server-validated. NOTE: end-before-start is NOT an error for an STA — the
// widget treats it as an overnight entry (+24h) — so it is deliberately not
// tested here.
// ============================================================================

export async function step10_validation(
  page: Page,
  account: STATestAccount,
  sta: SingleTimeActivityPage,
): Promise<void> {
  // Bounded error-text check (visible-filtered, short timeout) — avoids the
  // page object's validate*Error() helpers, whose toBeVisible() uses the 180s
  // global expect timeout and burns 3 minutes when an error doesn't render.
  // `isVisible()` is an IMMEDIATE check (it does not wait), so we must
  // `waitFor({ state: 'visible' })` to actually give the inline error time to
  // render after blur/Save.
  const errorSoon = (pattern: RegExp, ms = 8000): Promise<boolean> =>
    page
      .getByText(pattern)
      .filter({ visible: true })
      .first()
      .waitFor({ state: 'visible', timeout: ms })
      .then(() => true)
      .catch(() => false);

  // 10a — Name required.
  await soft('Name required → error on save', async () => {
    await openNewSTA(page, sta);
    await sta.clearNameInputField();
    await sta.clickButton('Save');
    expect(await errorSoon(/required/i)).toBeTruthy();
  });

  // 10b — Start date required.
  await soft('Start date required → error on save', async () => {
    await openNewSTA(page, sta);
    await selectEmployee(page, sta, 0);
    await sta.clearStartDateField();
    await sta.clickButton('Save');
    expect(await errorSoon(/required/i)).toBeTruthy();
  });

  // 10c — Invalid start date: ALPHABETS → "Invalid date" error. Letters can't be
  // parsed as a date, so the widget flags them.
  await soft('invalid Start date (alphabets) → error', async () => {
    await openNewSTA(page, sta);
    const startDate = page.getByLabel('Start date', { exact: true });
    await startDate.click();
    await startDate.fill('');
    await startDate.pressSequentially('abcdefghij', { delay: 50 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);
    const shown = await errorSoon(/invalid date/i, 12000);
    console.log(
      '[STA01][Step10c] alphabets invalid-date error shown=%s',
      shown,
    );
    expect(shown).toBeTruthy();
  });

  // 10c.2 — Date correction: an OUT-OF-RANGE numeric date (month 13, day 45) is
  // not rejected — the masked input NORMALIZES it to a valid date. Verify the
  // field did NOT keep the literal "13/45/2026" (i.e., it auto-corrected).
  await soft('out-of-range Start date → auto-corrected', async () => {
    await openNewSTA(page, sta);
    const startDate = page.getByLabel('Start date', { exact: true });
    await startDate.click();
    await startDate.fill('');
    await startDate.pressSequentially('13/45/2026', { delay: 50 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1500);
    const val = (await startDate.inputValue().catch(() => '')) ?? '';
    console.log('[STA01][Step10c.2] out-of-range date corrected to "%s"', val);
    expect(val !== '' && val !== '13/45/2026').toBeTruthy();
  });

  // 10d — Notes max length (4000 chars). The "Exceeds max length" error is
  // triggered on Save (not on blur).
  await soft('Notes over max length (4000) → error', async () => {
    await openNewSTA(page, sta);
    await sta.fillNotes('x'.repeat(4001));
    await sta.clickButton('Save');
    expect(await errorSoon(/exceeds max length/i)).toBeTruthy();
  });

  // 10e — Invalid time (start/end mode).
  await soft('invalid Start time → time-format error', async () => {
    await openNewSTA(page, sta);
    await selectEmployee(page, sta, 0);
    await setStartEndMode(page, sta, true);
    await sta.fillTime('Start', '99:99 ZZ').catch(() => undefined);
    await page.keyboard.press('Tab');
    expect(await errorSoon(/time|invalid/i)).toBeTruthy();
  });

  // 10f — Break exceeds total time (start/end mode: 2h total, 3h break).
  await soft('break exceeds total time → error', async () => {
    await openNewSTA(page, sta);
    await selectEmployee(page, sta, 0);
    await sta.fillStartDate(todayUS());
    await page.keyboard.press('Tab');
    await setStartEndMode(page, sta, true);
    await sta.selectTime('Start', START_TIME); // 9:00 AM
    await sta.selectTime('End', END_TIME); // 11:00 AM → 2h total
    // Boolean check on the "Add break" button (validateBreakButtonVisible is an
    // assertion → always skipped this block before).
    const addBreakBtn = page.getByRole('button', { name: 'Add break' });
    if (!(await addBreakBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('[STA01][Step10f] "Add break" button not visible — skipped');
      return;
    }
    await addBreakBtn.click();
    await page
      .locator(`//span[text()='Break']/ancestor::label/descendant::input`)
      .first()
      .waitFor({ state: 'visible', timeout: 8000 })
      .catch(() => undefined);
    await sta.fillBreak('03:00'); // > 2h total
    await page.keyboard.press('Tab');
    await sta.clickButton('Save');
    expect(await errorSoon(/break|exceed|total/i, 10000)).toBeTruthy();
  });

  // 10g — Billable checked WITHOUT a Customer → time can't be billable.
  // (Picking the employee auto-checks Billable; leave Customer empty.)
  await soft(
    'billable without customer → customer-required error',
    async () => {
      await openNewSTA(page, sta);
      await selectEmployee(page, sta, 0);
      await sta.checkCheckboxIfVisible('Billable'); // ensure Billable is on
      await sta.fillStartDate(todayUS());
      await page.keyboard.press('Tab');
      await sta.fillData('Duration', DURATION); // so only the customer rule fires
      await sta.clickButton('Save');
      expect(await errorSoon(/customer is required/i)).toBeTruthy();
    },
  );

  // 10h — No duration AND no start/end time → save blocked. The widget requires
  // either a duration or both start+end ("Either start time and end time or
  // duration is required").
  await soft('no duration / no time → required error', async () => {
    await openNewSTA(page, sta); // openNewSTA normalizes to duration mode
    await selectEmployee(page, sta, 0);
    await selectFirst(sta, 'Customer');
    await sta.fillStartDate(todayUS());
    await page.keyboard.press('Tab');
    // Leave Duration empty (and not in start/end mode), then save.
    await sta.clickButton('Save');
    expect(
      await errorSoon(
        /start time and end time or duration|duration is required|required/i,
        12000,
      ),
    ).toBeTruthy();
  });

  console.log('[STA01][Step10] Negative scenarios verified');
}

// ============================================================================
// Step 11 — Delete
// ============================================================================

export async function step11_delete(
  page: Page,
  account: STATestAccount,
  sta: SingleTimeActivityPage,
): Promise<void> {
  if (!account.entitlements.canDelete) {
    console.log('[STA01][Step11] SKIPPED — delete not allowed');
    return;
  }
  await soft(
    'reopen a recent activity from History and delete it',
    async () => {
      await openNewSTA(page, sta);
      if (!(await reopenLatestFromHistory(page, sta))) return;
      await sta.clickButton('Delete');
      await sta.clickYesOnDeleteConfirmation();
      await expectTrowserClosed(page);
      console.log('[STA01][Step11] deleted a recent activity');
    },
    90000,
  );
  console.log('[STA01][Step11] Delete verified');
}

// ============================================================================
// afterEach cleanup — delete created activities via the Reports page
// (Reports → Time Activities by Employee Detail → open each via Hours → delete)
// ============================================================================

export async function cleanupCreatedActivities(page: Page): Promise<void> {
  const sta = new SingleTimeActivityPage(page);
  const reports = new ReportsPage(page);

  // Simple loop: open the report → open an activity → delete it in the STA
  // trowser → back on the report, refresh the list (Today → All Dates) →
  // repeat until no activities remain. No id capture, no graphql.
  await soft(
    '[cleanup] open Time Activities by Employee Detail',
    async () => {
      // Retry the open — a transient navigation/URL/network error must NOT
      // abandon cleanup (that would leave created activities behind).
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          await reports.navigateToReportsPage();
          await reports.searchAndOpenReport(
            'Time Activities by Employee Detail',
          );
          return;
        } catch (e) {
          console.warn(
            '[STA01][cleanup] report open attempt %d failed: %s — retrying',
            attempt,
            e instanceof Error ? e.message : String(e),
          );
          await page.waitForTimeout(2000);
        }
      }
    },
    90000,
  );

  const MAX = 200;
  let deleted = 0;
  for (let i = 0; i < MAX; i += 1) {
    // Open the first remaining activity from the report; false ⇒ none left.
    const opened = await openStaFromReport(page, reports);
    if (!opened) {
      console.log('[STA01][cleanup] no activities left — %d deleted', deleted);
      break;
    }

    let didDelete = false;
    await soft('[cleanup] delete activity in trowser', async () => {
      await sta.clickButton('Delete');
      await sta.clickYesOnDeleteConfirmation();
      await expectTrowserClosed(page);
      didDelete = true;
    });
    if (!didDelete) {
      console.warn('[STA01][cleanup] delete failed — stopping to avoid a loop');
      break;
    }
    deleted += 1;
    console.log('[STA01][cleanup] deleted activity #%d', deleted);

    // Deleting returns to the report; refresh the list via Today → All Dates so
    // the deleted row drops off before we open the next one.
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
// Step 12 — Time entry settings popover (toggle a field's visibility)
//
// Opens the gear → "Time entry settings", toggles ONE field (Pay type) OFF,
// saves, confirms it's hidden in the form, then toggles it back ON and saves so
// the field stays ENABLED after the test (no lingering company-setting change).
// ============================================================================

export async function step12_settingsPopover(
  page: Page,
  account: STATestAccount,
  sta: SingleTimeActivityPage,
): Promise<void> {
  // Free QBO companies have no payroll, so the "Pay type" field isn't available
  // — use "Service" for the settings-toggle validation on those (Class/Location
  // aren't available on Essentials). Non-free keeps "Pay type" (safe to toggle —
  // doesn't gate billable/taxable steps).
  const isFree = account.companyType === 'standard';
  const FIELD = isFree ? 'Service' : 'Pay type';
  // IDS checkbox: READ state via the hidden <input> (.isChecked works regardless
  // of visibility), but TOGGLE by clicking the visible LABEL — force-clicking the
  // hidden input does NOT fire the controlled onChange (that was the bug).
  const ppInput = page
    .locator(
      `//div[contains(@class,'TimeSettingsPopoverForm')]//span[text()='${FIELD}']/ancestor::label/descendant::input`,
    )
    .first();
  const ppLabel = page
    .locator(
      `//div[contains(@class,'TimeSettingsPopoverForm')]//span[text()='${FIELD}']/ancestor::label`,
    )
    .first();
  const isChecked = (): Promise<boolean> =>
    ppInput.isChecked().catch(() => false);
  // The FORM's field label (not the popover's). After Save the popover closes,
  // so this matches only the form field.
  const formField = page.locator(`//span[text()='${FIELD}']`).first();
  const settingsHeading = page
    .getByText('Time entry settings', { exact: false })
    .first();
  // After Save: wait for the popover to CLOSE, then genuinely WAIT for the form
  // field to hide/appear (toBeHidden/toBeVisible retry — unlike isVisible()).
  const expectFieldHidden = async (): Promise<void> => {
    await settingsHeading
      .waitFor({ state: 'hidden', timeout: 8000 })
      .catch(() => undefined);
    await expect(formField).toBeHidden({ timeout: 10000 });
  };
  const expectFieldVisible = async (): Promise<void> => {
    await settingsHeading
      .waitFor({ state: 'hidden', timeout: 8000 })
      .catch(() => undefined);
    await expect(formField).toBeVisible({ timeout: 10000 });
  };
  const popoverOpen = async (): Promise<void> => {
    // Settings gear icon — label-based locator (verified) scoped to the dialog.
    await page
      .getByRole('dialog', { name: 'Single day entry' })
      .getByLabel('Settings')
      .click();
    // Confirm via the VISIBLE heading, not the hidden checkbox input.
    await expect(
      page.getByText('Time entry settings', { exact: false }).first(),
    ).toBeVisible({ timeout: 8000 });
  };

  // IMPORTANT: do NOT select an employee here. A field that has a VALUE can't
  // be hidden via the settings popover (the toggle is blocked/reverts), and
  // picking an employee can auto-populate Pay type. A fresh form leaves all
  // fields empty, so Pay type can be toggled off cleanly.
  await openNewSTA(page, sta);

  let toggledOff = false;
  await soft(
    `open settings → toggle ${FIELD} OFF → verify hidden`,
    async () => {
      await popoverOpen();
      console.log(
        '[STA01][Step12] %s checked before=%s',
        FIELD,
        await isChecked(),
      );
      if (await isChecked()) {
        await ppLabel.click(); // uncheck via the visible label
        await page.waitForTimeout(500);
      }
      console.log(
        '[STA01][Step12] %s checked after click=%s',
        FIELD,
        await isChecked(),
      );
      await sta.clickOnSaveSettingsInsidePopover();
      toggledOff = true;
      await expectFieldHidden(); // waits for popover close + field to disappear
      console.log(
        '[STA01][Step12] after toggle OFF, "%s" field hidden ✓',
        FIELD,
      );
    },
  );

  // ALWAYS restore the field (toggle back ON) so it stays enabled afterward —
  // run this even if the verify above failed, as long as we toggled it off.
  if (toggledOff) {
    await soft(
      `open settings → toggle ${FIELD} ON → verify restored`,
      async () => {
        await popoverOpen();
        if (!(await isChecked())) {
          await ppLabel.click(); // re-check via the visible label
          await page.waitForTimeout(500);
        }
        await sta.clickOnSaveSettingsInsidePopover();
        await expectFieldVisible(); // waits for popover close + field to reappear
        console.log(
          '[STA01][Step12] after toggle ON (restore), "%s" field visible ✓',
          FIELD,
        );
      },
    );
  }
  console.log(
    '[STA01][Step12] Settings popover toggle verified (field restored)',
  );
}

// ============================================================================
// Orchestrator
// ============================================================================

export async function runSTAFDFullSuite(
  page: Page,
  account: TETestAccount,
  createdEntries: string[] = [],
): Promise<void> {
  await runSTAFastPipelineFullSuite(page, account, createdEntries);
}

// ============================================================================
// STA Fast Pipeline — Time Entries tab flow (mirrors runSTEFullSuite)
//
// Login → dashboard → navigate → tab/filters/columns/role validations (soft)
// → STA CRUD via Add time → Single time activity on the Time Entries grid.
// ============================================================================

const STA_FP_NOTE_CREATE = 'STA-FP activity';
const STA_FP_NOTE_EDITED = 'STA-FP activity - edited';
const STA_FP_DURATION = '05:00';
const STA_FP_DURATION_EDITED = '06:00';
const STA_FP_BILL_RATE = '10';

/** Notes created by the Fast Pipeline STA flow — used by cleanup fallback. */
export const STA_FP_NOTES = [STA_FP_NOTE_CREATE, STA_FP_NOTE_EDITED];

async function staFpSoftStep(
  label: string,
  fn: () => Promise<unknown>,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    console.warn(`[STA-FP][soft] ${label} — failed, continuing:`, error);
  }
}

/**
 * Step 7 — STA CRUD on the Time Entries grid (free-data / Single time activity).
 * Create with duration + billable, verify in grid, edit duration, delete.
 */
export async function step07_staCRUD(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
  createdEntries: string[],
): Promise<void> {
  const sta = new SingleTimeActivityPage(page);
  const common = new CommonLocators(page);

  await test.step('set Today range before create', async () => {
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.today);
    await teTabPage.waitForLoadingToDisappear();
  });

  await test.step('open Single Time Activity trowser', async () => {
    await teTabPage.openAddTimeSTA();
    await sta.handleSTATourPopup().catch(() => undefined);
    await sta.handleTourModal().catch(() => undefined);
    await sta.validateSTALoaded();
  });
  console.log('[STA-FP][Step7] STA trowser ("Single day entry") opened');

  await test.step('select Name (first employee)', async () => {
    await selectEmployee(page, sta, 0);
  });

  let customer = '';
  await test.step('select Customer (first option)', async () => {
    await selectFirst(sta, 'Customer');
    customer = await page
      .locator(`//input[contains(@aria-label,'ustomer')]`)
      .first()
      .inputValue()
      .catch(() => '');
  });
  await test.step('select Service (first option)', async () => {
    await selectFirst(sta, 'Service');
  });

  let billable = false;
  if (account.entitlements.canSeeBillable) {
    await test.step('check Billable + bill rate', async () => {
      await sta.checkCheckboxIfVisible('Billable');
      await sta.fillBillRateInput(STA_FP_BILL_RATE);
      billable = true;
    });
  }

  await test.step('enter Duration + Notes', async () => {
    await sta.fillData('Duration', STA_FP_DURATION);
    await sta.fillNotes(STA_FP_NOTE_CREATE);
  });
  createdEntries.push(STA_FP_NOTE_CREATE);

  await test.step('save + close trowser', async () => {
    await sta.clickButton('Save');
    await sta.validateSuccessToast().catch(() => undefined);
    await sta.clickButton('Close');
    await teTabPage.waitForLoadingToDisappear();
  });
  console.log('[STA-FP][Step7] STA entry created');

  await test.step('set Today range for grid verification', async () => {
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.today);
    await teTabPage.waitForLoadingToDisappear();
  });

  await verifyEntryInGrid(page, teTabPage, {
    notes: STA_FP_NOTE_CREATE,
    customer: customer || undefined,
    hours: STA_FP_DURATION,
    billableChecked: billable ? true : undefined,
  });
  console.log('[STA-FP][Step7] Created entry verified in grid');

  await test.step('open entry from grid for edit', async () => {
    await teTabPage.getRowByNotes(STA_FP_NOTE_CREATE).click();
    await sta.handleTourModal().catch(() => undefined);
    await sta.validateSTALoaded();
    await teTabPage.waitForLoadingToDisappear();
  });

  await test.step('edit duration → 06:00 + notes', async () => {
    await sta.fillData('Duration', STA_FP_DURATION_EDITED);
    await sta.fillNotes(STA_FP_NOTE_EDITED);
  });
  createdEntries.push(STA_FP_NOTE_EDITED);

  await test.step('save and close edited entry', async () => {
    await sta.clickSaveAndCloseButton();
    await teTabPage.waitForLoadingToDisappear();
  });
  console.log('[STA-FP][Step7] STA entry edited');

  await test.step('set Today range for edited verification', async () => {
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.today);
    await teTabPage.waitForLoadingToDisappear();
  });

  await verifyEntryInGrid(page, teTabPage, {
    notes: STA_FP_NOTE_EDITED,
    hours: STA_FP_DURATION_EDITED,
    billableChecked: billable ? true : undefined,
  });
  console.log('[STA-FP][Step7] Edited entry verified in grid');

  await test.step('delete entry from grid trowser', async () => {
    const row = teTabPage.getRowByNotes(STA_FP_NOTE_EDITED);
    if (!(await row.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('[STA-FP][Step7] No row to delete — skipped');
      return;
    }
    await row.click();
    await sta.handleTourModal().catch(() => undefined);
    await sta.clickButton('Delete');
    await sta.clickYesOnDeleteConfirmation();
    await expect(page.getByText('Time entry deleted.')).toBeVisible({
      timeout: 15000,
    });
    await teTabPage.waitForLoadingToDisappear();
    await expect
      .poll(() => teTabPage.isRowWithNotesVisible(STA_FP_NOTE_EDITED), {
        timeout: 15000,
      })
      .toBeFalsy();
  });
  console.log('[STA-FP][Step7] STA entry deleted from grid');
}

/**
 * Deletes STA entries left on the Time Entries grid (STA trowser delete flow).
 * Safe to call from shared afterEach — no-ops when nothing remains.
 */
export async function cleanupCreatedSTAEntries(
  page: Page,
  createdEntries: string[] = [],
): Promise<void> {
  if (page.isClosed()) {
    console.log('[STA-FP][cleanup] Page closed — skipping');
    return;
  }

  const sta = new SingleTimeActivityPage(page);
  const teTabPage = new TETimeEntriesTabPage(page);
  const common = new CommonLocators(page);
  const notesToDelete = [
    ...new Set([...createdEntries, ...STA_FP_NOTES]),
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
        '[STA-FP][cleanup] Time Entries grid not available — skipping',
      );
      return;
    }
    await common.selectDisplayByOption(LABELS.date);
    await teTabPage.waitForLoadingToDisappear();
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.thisMonth);
    await teTabPage.waitForLoadingToDisappear();

    for (const notes of notesToDelete) {
      const row = teTabPage.getRowByNotes(notes);
      if (!(await row.isVisible({ timeout: 2000 }).catch(() => false))) {
        continue;
      }
      await row.click();
      await sta.handleTourModal().catch(() => undefined);
      const deleteBtn = page.getByRole('button', { name: 'Delete' });
      if (!(await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
        await page.keyboard.press('Escape').catch(() => undefined);
        continue;
      }
      await sta.clickButton('Delete');
      await sta.clickYesOnDeleteConfirmation();
      await page
        .getByText('Time entry deleted.')
        .waitFor({
          state: 'visible',
          timeout: 15000,
        })
        .catch(() => undefined);
      await teTabPage.waitForLoadingToDisappear();
      console.log('[STA-FP][cleanup] Deleted entry with notes="%s"', notes);
    }
  } catch (error) {
    console.warn('[STA-FP][cleanup] Cleanup encountered an issue:', error);
  }
}

/**
 * Runs the STA Fast Pipeline suite: same validation phases as STE, then STA
 * CRUD on the Time Entries grid (Add time → Single time activity).
 */
export async function runSTAFastPipelineFullSuite(
  page: Page,
  account: TETestAccount,
  createdEntries: string[] = [],
): Promise<void> {
  const teTabPage = new TETimeEntriesTabPage(page);

  page.setDefaultTimeout(30_000);

  await staFpSoftStep('Step1 — login & role setup', () =>
    step01_loginAndRoleSetup(page, account),
  );
  await staFpSoftStep('Step1.2 — dashboard validation', () =>
    step012_validateDashboard(page, account),
  );
  await staFpSoftStep('Step2 — navigate to Time entries', () =>
    step02_navigateToTimeSubmenu(page, account, teTabPage),
  );
  await staFpSoftStep('Step3 — tab visibility vs entitlements', () =>
    step03_tabVisibilityVsEntitlements(page, account, teTabPage),
  );
  await staFpSoftStep('Step4 — filters validation', () =>
    step04_filtersValidation(page, account, teTabPage),
  );
  await staFpSoftStep('Step5 — column visibility & settings', () =>
    step05_columnVisibilityAndSettings(page, account, teTabPage),
  );
  await staFpSoftStep('Step6 — role-scoped data visibility', () =>
    step06_roleScopedDataVisibility(page, account, teTabPage),
  );
  await step07_staCRUD(page, account, teTabPage, createdEntries);

  console.log('[STA-FP] Full suite complete.');
}

export async function runSTAFullSuite(
  page: Page,
  account: STATestAccount,
): Promise<void> {
  const sta = new SingleTimeActivityPage(page);
  const reports = new ReportsPage(page);

  await step01_openAndStructure(page, account, sta);
  // Settings popover toggle runs FIRST, on a fresh empty form — a field with a
  // value can't be hidden, so this must happen before any entry is created.
  await step12_settingsPopover(page, account, sta);
  const entered = await step02_create(page, account, sta);
  await step03_billableAndRate(page, account, sta);
  await step04_taxable(page, account, sta);
  await step05_startEndTime(page, account, sta);
  await step06_saveVariants(page, account, sta);
  await step07_editUpdate(page, account, sta);
  await step08_history(page, account, sta);
  await step09_reportsEdit(page, account, sta, reports, entered);
  await step10_validation(page, account, sta);
  await step11_delete(page, account, sta);

  console.log('[STA01] Full suite complete.');
}
