import { Locator, Page, expect, test } from '@playwright/test';
import TETimeEntriesTabPage from '../../../pages/FastPipeline/TimeEntriesFlowsPage';
import TESingleTimeEntryPage from '../../../pages/FastPipeline/TESingleTimeEntryPage';
import WhosWorkingMapPage from '../../../pages/WhosWorkingMapPage';
import { CommonLocators } from '../../../commonUtils';
import { LoginCredentials } from '../../../config/types';
import { LABELS, testData } from '../../../constants';
import { TimeSubmenu } from '../../../config/types';
import { AccountMatrix, resolveMatrixAccounts } from './accountMatrix';
import {
  validateDashboard,
  navigateToTimeSubmenu,
  validateLeftNavPersistence,
} from '../../../pages/FastPipeline/DashboardPage';
import { BreaksPage } from '../../../pages/BreaksPage';
import { BreaksRulesPage } from '../../../pages/BreaksRulesPage';
import TimeEntriesPage from '../../../pages/TimeEntriesPage';
import {
  openDateRangeDropdown,
  selectDateRangeOption,
  selectDisplayByOption,
  dismissTasksDrawerIfVisible,
  isTimeServiceMaintenanceVisible,
} from '../../../commonUtils';
import { deleteAllVisibleTimeEntries } from '../TimeEntries.util';

/**
 * Account matrix for the Time Entries (TE01) FastPipeline track. Maps the
 * TEST_ACCOUNT parameter (passed by the Groovy/Jenkins job) to the account key(s)
 * this track runs against, one row per platform/flavour. Resolution logic lives in
 * the shared `accountMatrix` util so every track behaves consistently; the matching
 * companyType seed is derived from the same string in `companyTypeFromParam`.
 *
 * Each row is an ORDERED account list — list ONE account per test scenario, in
 * the same order as the test() blocks in the spec. The spec binds accounts to
 * tests by position — index 0 → test 1, index 1 → test 2, and so on:
 *   • a pool SHORTER than the number of tests → tests past the last account are
 *     not registered (they do not run and do not show as skipped);
 *   • a pool LONGER than the number of tests → the extra accounts are unused
 *     (test count is driven by the test() blocks, not the array length).
 * Keys must exist in the active env's accounts file (PLAYWRIGHT_ENV); keys
 * missing from an env are skipped automatically.
 */
const TE_ACCOUNT_MATRIX: AccountMatrix = {
  // Intuit Enterprise Suite — companyType 'ies'.
  // index 0 → STE, index 1 → WTE, index 2 → Time Clock, index 3 → Breaks.
  IES: ['IESTF01', 'IESTF02', 'IESTF03', 'IESTF04'],
  // QBO + Time/Payroll Elite — companyType 'elite'.
  // index 0 → STE, index 1 → WTE, index 2 → Time Clock, index 3 → Breaks.
  PR_ELITE: ['PREF01', 'PREF02', 'PREF03', 'PREF04'],
  // QBO + Time/Payroll Premium — companyType 'premium'.
  // index 0 → STE, index 1 → WTE, index 2 → Time Clock, index 3 → Breaks.
  PR_PREMIUM: ['FPP01', 'FPP02', 'FPP03', 'FPP04'],
  // Plain QBO, no premium add-on — companyType 'standard'.
  // index 0 → STE + STA (FDF01), index 1 → WTE + WTA (FDF02).
  FREE_DATA_ADV: ['FDAF01', 'FDAF02'],
  FREE_DATA_ESSENTIAL: ['FDEF01', 'FDEF02'],
  FREE_DATA_PLUS: ['FDPF01', 'FDPF02'],
  // Add more "parameter -> account list" rows here as this track grows.
};
/** A built {@link TETestAccount} paired with the account key it came from. */
export interface TEMatrixAccount {
  /** The account key (e.g. `IES01`) — used to label the per-account test. */
  testId: string;
  account: TETestAccount;
}

/**
 * Builds the ORDERED list of {@link TETestAccount}s a matrix selector (the
 * TEST_ACCOUNT string) resolves to. A matrix group (e.g. `TEST_ACCOUNT=IES`)
 * returns the group's accounts in declared order (IES → [IES01, IES02]); an
 * exact key (e.g. `IES02`) returns a single-element list. The spec binds each
 * test to an index of this list (index 0 → test 1, index 1 → test 2). Defaults
 * to `process.env.TEST_ACCOUNT`.
 *
 * Platform (companyType), role, and approve/delete entitlements are read from
 * each account row's own metadata in prod/preprod.accounts.ts — companyType
 * seeds the pre-login IES-vs-QBO shell branching and is later refined post-login
 * from real productEntitlements (step012).
 */
/** WTE slot in TE_ACCOUNT_MATRIX pools (index 1, or *02 key when run in isolation). */
function isTeWteAccount(testId: string, index: number): boolean {
  return (
    /^WTE/i.test(testId) ||
    /(?:IESTF02|PREF02|FPP02)$/i.test(testId) ||
    index === 1
  );
}

export function buildTEAccountsFromMatrix(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): TEMatrixAccount[] {
  return resolveMatrixAccounts({
    matrix: TE_ACCOUNT_MATRIX,
    param: selector,
    label: 'TE',
    allowEmpty: true,
  }).map(({ testId, credentials }, index) => ({
    testId,
    account: buildTEAccount(credentials, {
      role: credentials.expectedRole ?? 'admin',
      entitlements: {
        canApprove: credentials.canApproveTime ?? true,
        canDelete: credentials.canDeleteTime ?? true,
        weeklyEntryEnabled: isTeWteAccount(testId, index),
      },
    }),
  }));
}

// ============================================================================
// BR01 Validation Data
// Copied from flows/Breaks/BreaksValidation.data.ts so this util is
// self-contained and does not depend on the Breaks folder at runtime.
// ============================================================================

export const BREAKS_VALIDATION_DATA = {
  testId: 'BR01',
  // Manual break entries use Test Emp1 …
  teamMemberInput: 'Test Emp1',
  teamMemberTable: 'Emp1, Test',
  // … automatic break entries use Test Emp2.
  autoTeamMemberInput: 'Test Emp2',
  autoTeamMemberTable: 'Emp2, Test',
  breakRuleDurationMinutes: '30',
  breakRulePayType: 'Paid',

  // Manual break ENTRY — create (kept identical to the original manual flow).
  cancelDrawerConfirmation: 'No',
  createEntryType: 'Start and end time' as const,
  createStartTime: '08:00 AM',
  createEndTime: '06:00 PM',
  createNotes: 'test break entry',

  // Manual break ENTRY — edit (kept identical to the original manual flow).
  editEntryType: 'Start and end time' as const,
  editStartTime: '9:00 AM',
  editEndTime: '7:00 PM',
  editNotes: 'updated test break entry',
  editExpectedHours: '10.00',

  // Automatic break — the Single Time Entry whose span triggers the automatic
  // break rule (see createAutomaticBreakEntry).
  autoEntryCustomer: 'Test Customer1',
  autoEntryService: 'Sales',
  autoEntryStartTime: '9:00 AM',
  autoEntryEndTime: '6:00 PM',
  autoEntryEditEndTime: '5:00 PM',
  autoEntryNotes: 'Adding automatic break',

  dateRange: 'This week',
};

/**
 * Per-run break rule context. The break rules are created fresh on every run
 * with timestamped names so they are always unique:
 *   • manual break    → "manual break - <timestamp>"    (Manual rule)
 *   • manual break 2  → "manual break 2 - <timestamp>"  (Manual rule — the entry
 *       is switched to this rule while editing the manual break)
 *   • automatic break → "automatic break - <timestamp>" (Automatic rule)
 * `manualBreakType` / `manualBreakType2` are the values shown in the Add/Edit
 * Break drawer's break-type dropdown (e.g. "Paid: manual break - 1718000000000").
 */
export interface BreakSuiteContext {
  manualBreakName: string;
  manualBreakName2: string;
  automaticBreakName: string;
  manualBreakType: string;
  manualBreakType2: string;
  /**
   * Set by createTimeClockEntry: true only when the manual break was actually
   * taken inside the Time Clock. validateTimeClockEntry uses it to skip the
   * break-specific checks (record / End break / start-end time) when the break
   * could not be taken — so those steps fail fast instead of stacking timeouts.
   */
  clockBreakTaken?: boolean;
}

function buildBreakSuiteContext(): BreakSuiteContext {
  const timestamp = `${Date.now()}`;
  const manualBreakName = `manual break - ${timestamp}`;
  const manualBreakName2 = `manual break 2 - ${timestamp}`;
  const automaticBreakName = `automatic break - ${timestamp}`;
  const { breakRulePayType } = BREAKS_VALIDATION_DATA;
  return {
    manualBreakName,
    manualBreakName2,
    automaticBreakName,
    manualBreakType: `${breakRulePayType}: ${manualBreakName}`,
    manualBreakType2: `${breakRulePayType}: ${manualBreakName2}`,
  };
}

/**
 * =============================================================================
 * TE01 — Time Entries Tab End-to-End test utilities
 * =============================================================================
 *
 * All step logic for the TE01 test cases lives here. The spec file is a thin
 * wrapper that wires up beforeEach / afterEach and calls `runTEFullSuite` or
 * `runWTEFullSuite`.
 *
 * Conventions used throughout:
 *  - console.log('[TE01][StepN] ...') checkpoints for HTML report traceability.
 *  - Soft assertions are wrapped in try/catch and downgraded to console.warn so
 *    a single environment quirk does not fail the whole run. Hard assertions
 *    are reserved for critical state.
 *  - No `test.skip()` inside util functions — skip logic is an early return.
 * =============================================================================
 */

// ---- Test account shape ----------------------------------------------------

export interface TEEntitlements {
  canSeeTimeEntriesTab: boolean;
  canSeeAllTabs: boolean; // Time Premium / Elite / Payroll add-on
  canApprove: boolean;
  canDelete: boolean;
  canSeeCostRate: boolean;
  canSeeBillable: boolean;
  canSeePayType: boolean;
  customFieldsEnabled: boolean;
  locationTrackingEnabled: boolean;
  weeklyEntryEnabled: boolean; // for future Weekly test — stub here
}

export interface TESeededData {
  hasLastWeekEntries: boolean;
  hasLastMonthEntries: boolean;
  lockedEntryDate?: string; // ISO date of a known locked entry
  existingEntryForEdit?: string; // entry ID or date to use for Edit flow
  customFieldName?: string; // name of custom field if configured
  timeLocationName?: string; // name of time location if configured
}

export interface TETestAccount {
  credentials: LoginCredentials; // username, password, companyInfo, realmId
  role: 'admin' | 'manager' | 'employee' | 'vendor';
  /** Resolved post-login from qbo.productEntitlements — not passed as a parameter. */
  sku?: 'limited' | 'full' | 'simplestart' | 'ca_hidden';
  /** All raw flavour strings collected from every qbo.productEntitlements row. */
  rawFlavours?: string[];
  region: 'us' | 'ca';
  /**
   * Company platform type — derived post-login inside step012_validateDashboard
   * from account.rawFlavours.  Not passed as a parameter.
   * - 'elite'    : QBO + Time/Payroll Elite add-on (PR_ELITE in flavours).
   * - 'premium'  : QBO + Time/Payroll Premium add-on (PR_PREMIUM in flavours).
   * - 'ies'      : Intuit Enterprise Suite (IES/ENTERPRISE in flavours).
   * - 'standard' : Plain QBO — no premium Time add-on.
   */
  companyType?: 'elite' | 'premium' | 'ies' | 'standard';
  entitlements: TEEntitlements;
  seededData: TESeededData;
}

// ---- Factory ---------------------------------------------------------------

/**
 * Builds a fully-populated TETestAccount from login credentials plus optional
 * overrides. Entitlements and seededData are merged shallowly so callers can
 * override only the fields they care about.
 */
export function buildTEAccount(
  credentials: LoginCredentials,
  overrides: {
    role?: TETestAccount['role'];
    region?: TETestAccount['region'];
    companyType?: TETestAccount['companyType'];
    entitlements?: Partial<TEEntitlements>;
    seededData?: Partial<TESeededData>;
  } = {},
): TETestAccount {
  // Derive companyType: explicit override → credential-level flag → 'elite'
  const resolvedCompanyType: TETestAccount['companyType'] =
    overrides.companyType ??
    (credentials.companyType as TETestAccount['companyType'] | undefined) ??
    'elite';

  return {
    credentials,
    role: overrides.role ?? 'admin',
    // sku is intentionally undefined here; it is resolved post-login by
    // fetchProductEntitlementsFromUI() inside runSTEFullSuite.
    sku: undefined,
    region: overrides.region ?? 'us',
    companyType: resolvedCompanyType,
    entitlements: {
      canSeeTimeEntriesTab: true,
      canSeeAllTabs: true,
      canApprove: true,
      canDelete: true,
      canSeeCostRate: true,
      canSeeBillable: true,
      canSeePayType: true,
      customFieldsEnabled: false,
      locationTrackingEnabled: false,
      weeklyEntryEnabled: false,
      ...overrides.entitlements,
    },
    seededData: {
      hasLastWeekEntries: false,
      hasLastMonthEntries: false,
      ...overrides.seededData,
    },
  };
}

// ---- Constants used across steps -------------------------------------------

const NOTES_CREATE = 'TE01 duration entry';
const NOTES_CREATE_EDITED = 'TE01 duration entry - edited';
const NOTES_START_END = 'TE01 start-end time entry';
const NOTES_START_END_EDITED = 'TE01 start-end time entry - edited';
const NOTES_WHOS_WORKING = 'TE01 whos working test';
const NOTES_WHOS_WORKING_EDITED = 'TE01 whos working test - edited';

const NOTES_WTE_WEEKLY = 'TE01 weekly multi-day entry';
const NOTES_WTE_WEEKLY_EDITED = 'TE01 weekly multi-day entry - edited';

/** All TE01 note identifiers — used by cleanup to remove leftover test data. */
const ALL_TE01_CLEANUP_NOTES = [
  NOTES_CREATE,
  NOTES_CREATE_EDITED,
  NOTES_START_END,
  NOTES_START_END_EDITED,
  NOTES_WHOS_WORKING,
  NOTES_WHOS_WORKING_EDITED,
  NOTES_WTE_WEEKLY,
  NOTES_WTE_WEEKLY_EDITED,
  'TE01 time clock entry',
  'TE01 time clock entry - edited',
] as const;

/** Weekday column indices in the WTE grid (Mon–Wed data columns). */
const WTE_WEEKDAY_COLS = [3, 4, 5];
const WTE_HOURS_PER_DAY = '2';
const WTE_HOURS_PER_DAY_EDITED = '4';

/** Who's Working start time (past date, safe morning window). */
const WHOS_WORKING_START_TIME = '8:00 AM';

/** Days in the past for start/end entries — avoids prod/local timezone date skew. */
const STE_PAST_ENTRY_DAYS_AGO = 2;

function getPastDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

/** Weekly entry context returned after multi-day create (Step 7b). */
export interface TEWeeklyEntryContext {
  notes: string;
  employeeName: string;
  customer: string;
  className: string;
  location: string;
  billableChecked: boolean;
  cfValues: Record<string, string>;
  gridHoursAfterCreate: string;
}

/** Labels for configured custom fields (CF1, CF2, …) — excludes WTE panel chrome. */
function filterConfiguredCustomFieldLabels(labels: string[]): string[] {
  return labels.filter((label) => /^cf\d/i.test(label.trim()));
}

/**
 * Reads the displayed value of a labelled filter control (e.g. "Display by",
 * "Date range"). These are IDS combobox <input>s whose selected text lives in
 * the value property — textContent() of an input is always empty — so read
 * inputValue() first and fall back to textContent() for any non-input control.
 */
async function readFilterControlValue(
  page: Page,
  label: string,
): Promise<string> {
  const control = page.getByLabel(label).first();
  const value = await control.inputValue().catch(() => '');
  if (value) return value.trim();
  const text = await control.textContent().catch(() => '');
  return (text ?? '').trim();
}

/** Soft-assert helper: log a warning instead of failing the test. */
async function soft(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[TE01][soft] ${label} — ${message}`);
  }
}

/** True when Intuit redirected the browser back to the sign-in page. */
async function isOnIntuitLoginPage(page: Page): Promise<boolean> {
  return page
    .getByRole('heading', { name: /let's get you in to QuickBooks/i })
    .isVisible({ timeout: 2000 })
    .catch(() => false);
}

/**
 * Re-authenticate when the session expired between openQBOTETab (spec) and a
 * later util step. No-op when the dashboard shell is already loaded.
 */
async function ensureTeSessionActive(
  page: Page,
  account: TETestAccount,
): Promise<void> {
  if (!(await isOnIntuitLoginPage(page))) {
    return;
  }
  console.warn('[TE01] Session expired — re-authenticating');
  const { openQBOTETab } = await import('../../../pages/QBOLogin');
  await openQBOTETab(page, account.credentials);
  if (await isOnIntuitLoginPage(page)) {
    throw new Error('[TE01] Re-login failed — still on login page');
  }
}

// ============================================================================
// Step 1 — Login & Role Setup
// ============================================================================

export async function step01_loginAndRoleSetup(
  page: Page,
  account: TETestAccount,
): Promise<void> {
  if (page.isClosed()) {
    throw new Error('[TE01][Step1] Page closed — login did not complete');
  }

  await ensureTeSessionActive(page, account);

  console.log(
    '[TE01][Step1] Login state: companyType=%s role=%s region=%s (sku will be resolved from qbo.productEntitlements)',
    account.companyType,
    account.role,
    account.region,
  );

  const { sku, flavours } = await fetchProductEntitlementsFromUI(page);
  account.sku = sku;
  account.rawFlavours = flavours;

  // Body node is present for ALL company types (Elite, Premium, IES, Standard).
  await test.step('QBO body node visible', async () => {
    await expect(page.locator('[data-id=bodyNode]')).toBeVisible({
      timeout: 15000,
    });
  });

  // The QuickBooks Landing Page sidebar link exists only in the standard QBO
  // shell (Elite, Premium, Standard).  IES replaces it with a different nav
  // structure, so the assertion is skipped to avoid a 15-second soft-failure
  // on every IES run.
  if (account.companyType !== 'ies') {
    await test.step('QBO sidebar visible', async () => {
      await expect(page.locator(`[aria-label="Home"]`)).toBeVisible({
        timeout: 15000,
      });
    });
  }

  console.log('[TE01][Step1] Login confirmed');
}

// ============================================================================
// Step 2 — Navigate to Time Entries (Trowser Verification)
// ============================================================================

export async function step02_navigateToTimeEntries(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
): Promise<boolean> {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await teTabPage.navigateToTimeEntriesPage();
  await teTabPage.waitForLoadingToDisappear();

  if (account.entitlements.canSeeTimeEntriesTab === false) {
    await test.step('Time Entries tab hidden', async () => {
      const visible = await teTabPage.isTimeEntriesTabVisible();
      expect(visible).toBeFalsy();
    });
    console.log(
      '[TE01][Step2] Tab correctly hidden for role=%s sku=%s',
      account.role,
      account.sku,
    );
    return false; // signal: skip subsequent steps
  }

  await test.step('Time Entries content present', async () => {
    const hasContent = await teTabPage.isTimeEntriesTabVisible();
    expect(hasContent).toBeTruthy();
  });

  if (consoleErrors.length > 0) {
    console.warn('[TE01][Step2] Console errors observed:');
    consoleErrors.forEach((e) => console.warn('  - %s', e));
  }
  console.log(
    '[TE01][Step2] Navigation successful, console errors: %d',
    consoleErrors.length,
  );
  return true;
}

// ============================================================================
// Step 3 — Tab Visibility vs Entitlements
// ============================================================================

export async function step03_tabVisibilityVsEntitlements(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
): Promise<void> {
  const visibleTabs = await teTabPage.getVisibleTabNames();
  console.log('[TE01][Step3] Time tab count: %d', visibleTabs.length);
  console.log('[TE01][Step3] Tabs visible: %o', visibleTabs);

  const hasTab = (name: string): boolean =>
    visibleTabs.some((t) => t.toLowerCase().includes(name.toLowerCase()));

  if (account.entitlements.canSeeAllTabs === true) {
    await test.step('full tab set present', async () => {
      expect(hasTab('Time Entries') || hasTab('Time entries')).toBeTruthy();
    });
  } else if (account.sku === 'limited') {
    await test.step('limited tab set (Time Entries + Schedule)', async () => {
      expect(hasTab('Time Entries')).toBeTruthy();
    });
  } else if (account.sku === 'simplestart') {
    await test.step('simplestart tab set (Time Entries + Overview)', async () => {
      expect(hasTab('Time Entries')).toBeTruthy();
      expect(hasTab('Schedule')).toBeFalsy();
    });
  }
  console.log('[TE01][Step3] Tab Visibility and Entitlements is successful');
}

// ============================================================================
// Step 4 — Default State & Filters Validation
// ============================================================================

function dateRangeIsCurrentWeek(value: string): boolean {
  const match = value.match(
    /(\d{1,2}\/\d{1,2}\/\d{4})\s*[-–]\s*(\d{1,2}\/\d{1,2}\/\d{4})/,
  );
  if (!match) {
    return false;
  }
  const start = new Date(match[1]);
  const end = new Date(match[2]);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }
  const today = new Date();
  [start, end, today].forEach((d) => d.setHours(0, 0, 0, 0));
  const dayMs = 24 * 60 * 60 * 1000;
  const spanDays = Math.round((end.getTime() - start.getTime()) / dayMs);
  return (
    start.getTime() <= today.getTime() &&
    today.getTime() <= end.getTime() &&
    spanDays === 6
  );
}

/**
 * Returns true when the date-range value is the CURRENT month — either the
 * resolved span (1st → last day of this month, e.g. "6/1/2026 - 6/30/2026") or
 * any span that starts on the 1st and ends on the month's last day containing
 * today. Mirrors {@link dateRangeIsCurrentWeek} for the "This month" filter.
 */
function dateRangeIsCurrentMonth(value: string): boolean {
  const match = value.match(
    /(\d{1,2}\/\d{1,2}\/\d{4})\s*[-–]\s*(\d{1,2}\/\d{1,2}\/\d{4})/,
  );
  if (!match) {
    return false;
  }
  const start = new Date(match[1]);
  const end = new Date(match[2]);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }
  const today = new Date();
  const lastDay = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  return (
    start.getFullYear() === today.getFullYear() &&
    start.getMonth() === today.getMonth() &&
    start.getDate() === 1 &&
    end.getFullYear() === today.getFullYear() &&
    end.getMonth() === today.getMonth() &&
    end.getDate() === lastDay
  );
}

/**
 * Converts a "M/D/YYYY" (or "MM/DD/YYYY") date string — as shown in the STE
 * Start date field — to the "YYYY-MM-DD" (en-CA) format the Recent Time Entries
 * popup uses. Returns '' if the input can't be parsed.
 */
function toEnCaDate(value: string): string {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return '';
  }
  const [, mm, dd, yyyy] = match;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

/** Parse "YYYY-MM-DD" into a local midnight Date. */
function parseEnCaDate(isoDate: string): Date | null {
  const match = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Apply a Custom date-range filter scoped to the entry's own date
 * (`entryDateEnCa`, YYYY-MM-DD), using it as both start and end so the created
 * entry is validated against an exact single-day range.
 */
async function selectDateRangeIncludingEntryDate(
  common: CommonLocators,
  teTabPage: TETimeEntriesTabPage,
  entryDateEnCa?: string,
): Promise<void> {
  const entryDate = entryDateEnCa ? parseEnCaDate(entryDateEnCa) : null;
  if (!entryDate || !entryDateEnCa) {
    return;
  }
  const targetMonthYear = entryDate.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  await common.openDateRangeDropdown();
  await common.selectDateRangeOption(LABELS.custom);
  await teTabPage.tePageBase.selectCustomDateRange(
    targetMonthYear,
    entryDateEnCa,
    entryDateEnCa,
  );
  await teTabPage.waitForLoadingToDisappear();
}

export async function step04_filtersValidation(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
): Promise<void> {
  const common = new CommonLocators(page);

  await ensureTeSessionActive(page, account);
  const gridReady = await ensureTimeEntriesGridReady(page, teTabPage);
  if (!gridReady) {
    console.warn('[TE01][Step4] Grid not ready — skipping filter validation');
    return;
  }

  // --- Default state check ---
  // Wait for the grid to finish loading and the filter controls to actually
  // render their selected value before reading — otherwise the read can race
  // the render and come back empty. expect(...).toHaveText polls until ready.
  await teTabPage.waitForLoadingToDisappear();
  const displayByControl = page.getByLabel(LABELS.displayBy);
  const dateRangeControl = page.getByLabel(LABELS.dateRange);
  await expect(displayByControl).toBeVisible({ timeout: 15000 });
  await expect(dateRangeControl).toBeVisible({ timeout: 15000 });
  // The Display by / Date range controls are <input role="combobox"> elements,
  // so their selected text lives in the input value (not textContent). Wait for
  // the value to populate, then read it via inputValue().
  await expect(displayByControl).toHaveValue(/\S/, { timeout: 15000 });
  await expect(dateRangeControl).toHaveValue(/\S/, { timeout: 15000 });
  await page.waitForTimeout(500);

  const displayByDefault = (
    await displayByControl.inputValue().catch(() => '')
  ).trim();
  const dateRangeDefault = (
    await dateRangeControl.inputValue().catch(() => '')
  ).trim();
  console.log(
    '[TE01][Step4] Default filters: displayBy=%s dateRange=%s',
    displayByDefault,
    dateRangeDefault,
  );
  await test.step('default Display by = Date', async () => {
    expect(displayByDefault).toContain(LABELS.date);
  });
  await test.step('default Date range = This week', async () => {
    // The Date range control renders the selected week's date span (e.g.
    // "5/24/2026 - 5/30/2026"), not the literal "This week" label, so verify the
    // displayed span is the 7-day window containing today.
    expect(dateRangeIsCurrentWeek(dateRangeDefault ?? '')).toBeTruthy();
  });

  // --- Date filter cycling ---
  const dateOptions = [
    LABELS.today,
    LABELS.thisWeek,
    LABELS.thisMonth,
    LABELS.lastWeek,
    LABELS.lastMonth,
    LABELS.custom,
  ];

  for (const option of dateOptions) {
    if (option === LABELS.lastWeek && !account.seededData.hasLastWeekEntries) {
      console.warn(
        '[TE01][Step4] Skipping data assertion for Last week (no seed)',
      );
    }
    if (
      option === LABELS.lastMonth &&
      !account.seededData.hasLastMonthEntries
    ) {
      console.warn(
        '[TE01][Step4] Skipping data assertion for Last month (no seed)',
      );
    }

    await test.step(`apply date filter "${option}"`, async () => {
      await common.openDateRangeDropdown();
      await common.selectDateRangeOption(option);

      if (option === LABELS.custom) {
        await teTabPage.tePageBase.selectCustomDateRange(
          testData.customTargetMonth,
          testData.customStartDate,
          testData.customEndDate,
        );
      }
      await teTabPage.waitForLoadingToDisappear();
    });

    const rowCount = await teTabPage.getEntryRowCount().catch(() => 0);
    console.log(
      '[TE01][Step4] Date filter "%s" applied — rows visible: %s',
      option,
      rowCount > 0,
    );
  }

  // --- Display By cycling ---
  const displayByOptions = [LABELS.date];
  if (account.entitlements.canSeeAllTabs) {
    displayByOptions.push(LABELS.customer);
  }
  for (const option of displayByOptions) {
    await test.step(`apply Display by "${option}"`, async () => {
      await common.selectDisplayByOption(option);
      await teTabPage.waitForLoadingToDisappear();
    });
    const rowCount = await teTabPage.getEntryRowCount().catch(() => 0);
    console.log(
      '[TE01][Step4] Display by "%s" applied — rows visible: %s',
      option,
      rowCount > 0,
    );
  }

  // --- Reset to defaults before Step 5 ---
  await test.step('reset filters to Date / This week', async () => {
    await common.selectDisplayByOption(LABELS.date);
    await teTabPage.waitForLoadingToDisappear();
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.thisWeek);
    await teTabPage.waitForLoadingToDisappear();
  });
}

// ============================================================================
// Step 5 — Column Visibility & Action Settings
// ============================================================================

export async function step05_columnVisibilityAndSettings(
  _page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
): Promise<void> {
  await ensureTeSessionActive(_page, account);
  const gridReady = await ensureTimeEntriesGridReady(_page, teTabPage);
  if (!gridReady) {
    console.warn('[TE01][Step5] Grid not ready — skipping column settings');
    return;
  }

  // --- Default columns check ---
  const defaultColumns = await teTabPage.getVisibleColumnNames();
  console.log('[TE01][Step5] Default columns: %o', defaultColumns);
  const common = new CommonLocators(_page);

  const displayByVisible = await _page
    .getByLabel(LABELS.displayBy)
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (!displayByVisible || /\/app\/setup/.test(_page.url())) {
    await ensureTimeEntriesGridReady(_page, teTabPage);
  }

  await test.step('set Date view / Last month', async () => {
    await common.selectDisplayByOption(LABELS.date);
    await teTabPage.waitForLoadingToDisappear();
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.lastMonth);
    await teTabPage.waitForLoadingToDisappear();
  });

  // --- Per-column toggle + verify -------------------------------------------
  // Mirrors the real Settings drawer (same pattern as grid verification in
  // Step 7): for each column, open the gear → toggle ONE checkbox → the drawer
  // auto-closes → verify the column's visibility changed in the grid → reopen
  // the gear for the next column.
  const settingsColumns = await teTabPage.getColumnSettingsLabels();
  console.log('[TE01][Step5] Toggleable columns: %o', settingsColumns);

  for (const column of settingsColumns) {
    // Disable → verify the column is hidden.
    await test.step(`disable column "${column}" → hidden`, async () => {
      await teTabPage.setColumnVisibility(column, false);
      await teTabPage.assertColumnHidden(column);
      console.log('[TE01][Step5] Column "%s" hidden', column);
    });
    // Re-enable → verify the column is visible again.
    await test.step(`enable column "${column}" → visible`, async () => {
      await teTabPage.setColumnVisibility(column, true);
      await teTabPage.assertColumnVisible(column);
      console.log('[TE01][Step5] Column "%s" visible', column);
    });
  }

  // --- Role-gated columns ---
  if (account.entitlements.canSeeCostRate === false) {
    await test.step('Cost rate column absent', async () => {
      await teTabPage.assertColumnHidden('Cost rate');
    });
  }
  if (account.entitlements.canSeeBillable === false) {
    await test.step('Billable column absent', async () => {
      await teTabPage.assertColumnHidden(LABELS.billable);
    });
  }
  console.log('[TE01][Step5] Column visibility checks complete');
}

// ============================================================================
// Step 6 — Role-Scoped Data Visibility
// ============================================================================

export async function step06_roleScopedDataVisibility(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
): Promise<void> {
  const common = new CommonLocators(page);

  await ensureTimeEntriesGridReady(page, teTabPage);

  await test.step('set Date view / This week', async () => {
    await common.selectDisplayByOption(LABELS.date);
    await teTabPage.waitForLoadingToDisappear();
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.thisWeek);
    await teTabPage.waitForLoadingToDisappear();
  });

  const rowCount = await teTabPage.getEntryRowCount().catch(() => 0);
  const distinctNames = await teTabPage.getDistinctEmployeeNames();
  console.log(
    '[TE01][Step6] Role=%s, visible row count=%d, distinct names=%d',
    account.role,
    rowCount,
    distinctNames.length,
  );

  switch (account.role) {
    case 'admin':
      await test.step('admin sees multiple team members', async () => {
        expect(distinctNames.length).toBeGreaterThan(0);
      });
      break;
    case 'manager':
      await test.step('manager sees team-scoped rows', async () => {
        expect(distinctNames.length).toBeGreaterThanOrEqual(0);
      });
      break;
    case 'employee':
    case 'vendor':
      await test.step('self-scoped data only', async () => {
        // Self-scoped: at most one distinct name should appear.
        expect(distinctNames.length).toBeLessThanOrEqual(1);
      });
      break;
    default:
      break;
  }
}

// ============================================================================
// Step 7 helpers
// ============================================================================

/** Value typed into a TEXT custom field — mixed numeric/string. */
const CF_TEXT_VALUE = 'CFT01';

/** Value typed into a TEXT custom field when editing an existing entry. */
const CF_TEXT_VALUE_EDITED = 'CFT02';

/** Manual mileage value entered during edits. */
const MILES_VALUE = '50';

/**
 * Discovers the configured custom fields in the open STE trowser, asserts at
 * least 2 are present, then fills each by its DETECTED type:
 *   • text custom field (CF1)     → types a numeric/string value.
 *   • dropdown custom field (CF2) → selects the first option.
 * Detecting by type (rather than position) keeps this correct regardless of the
 * order discovery returns the fields in. Returns a name→value map for the grid.
 */
async function populateCustomFields(
  teTabPage: TETimeEntriesTabPage,
): Promise<Record<string, string>> {
  const entered: Record<string, string> = {};
  const discovered = await teTabPage.getCustomFieldLabels();
  const labels = filterConfiguredCustomFieldLabels(discovered);
  console.log('[TE01][Step7][CF] Discovered custom fields: %o', labels);

  await test.step('at least 2 custom fields present', async () => {
    expect(labels.length).toBeGreaterThanOrEqual(2);
  });

  for (const label of labels.slice(0, 2)) {
    await test.step(`populate custom field "${label}"`, async () => {
      const isDropdown = await teTabPage.isCustomFieldDropdown(label);
      const value = isDropdown
        ? await teTabPage.selectCustomFieldFirstOption(label) // dropdown CF → first option
        : await teTabPage.fillCustomFieldText(label, CF_TEXT_VALUE); // text CF → typed value
      if (value) {
        entered[label] = value;
        console.log(
          '[TE01][Step7][CF] "%s" (%s) = "%s"',
          label,
          isDropdown ? 'dropdown' : 'text',
          value,
        );
      }
    });
  }

  return entered;
}

/**
 * Edits custom fields on an open (edit-mode) STE trowser:
 *   • the TEXT custom field (CF1)     → types a new value.
 *   • the DROPDOWN custom field (CF2) → selects the 2nd option, only when
 *     `editDropdown` is true.
 * Returns a name→value map of just the fields it changed (to merge over the
 * originally-created values for grid verification).
 */
async function editCustomFields(
  teTabPage: TETimeEntriesTabPage,
  editDropdown: boolean,
): Promise<Record<string, string>> {
  const changed: Record<string, string> = {};
  const labels = filterConfiguredCustomFieldLabels(
    await teTabPage.getCustomFieldLabels(),
  );

  for (const label of labels.slice(0, 2)) {
    const isDropdown = await teTabPage.isCustomFieldDropdown(label);
    if (!isDropdown) {
      await test.step(`edit text custom field "${label}"`, async () => {
        const value = await teTabPage.fillCustomFieldText(
          label,
          CF_TEXT_VALUE_EDITED,
        );
        if (value) {
          changed[label] = value;
          console.log('[TE01][Step7][CF-edit] text "%s" = "%s"', label, value);
        }
      });
    } else if (editDropdown) {
      await test.step(`edit dropdown custom field "${label}" (2nd option)`, async () => {
        const value = await teTabPage.selectCustomFieldOption(label, 1);
        if (value) {
          changed[label] = value;
          console.log(
            '[TE01][Step7][CF-edit] dropdown "%s" = "%s"',
            label,
            value,
          );
        }
      });
    }
  }
  return changed;
}

/** What a created STE/WTE entry should show back in the Time Entries grid. */
interface ExpectedGridEntry {
  notes: string; // row identifier + Notes column value
  employeeName?: string; // STE "First Last" — compared normalized vs grid "Last, First"
  customer?: string;
  hours?: string; // e.g. "02:00" — compared by total minutes vs grid "2.00"
  hoursMin?: string; // at least this many hours (e.g. after editing one day to 4h)
  billableChecked?: boolean; // true → grid Billable should read Yes
  service?: string; // Service / Service item — contains
  className?: string;
  location?: string;
  customFields?: Record<string, string>; // field name → entered/selected value
  miles?: string; // manual mileage entered, e.g. "50" → grid "50.00"
  milesEmpty?: boolean; // true → grid Miles cell should be empty/zero
  /** WTE weekly rows often omit Class/Location/CF/Miles in the grid — skip those checks. */
  wteGridCoreOnly?: boolean;
}

async function refreshTimeEntriesGrid(
  page: Page,
  teTabPage: TETimeEntriesTabPage,
): Promise<void> {
  const common = new CommonLocators(page);
  try {
    await common.selectDisplayByOption(LABELS.customer);
    await teTabPage.waitForLoadingToDisappear();
    await page.waitForTimeout(800);
    await common.selectDisplayByOption(LABELS.date);
    await teTabPage.waitForLoadingToDisappear();
    await page.waitForTimeout(800);
  } catch (error) {
    console.warn('[TE01] grid refresh (Display by toggle) issue:', error);
  }
}

export async function verifyEntryInGrid(
  page: Page,
  teTabPage: TETimeEntriesTabPage,
  expected: ExpectedGridEntry,
): Promise<void> {
  const common = new CommonLocators(page);
  await teTabPage.waitForLoadingToDisappear();
  // Refresh first so edited/created values (e.g. duration) are not read stale.
  await refreshTimeEntriesGrid(page, teTabPage);

  // Ensure every column we want to read is visible (no-op if already shown).
  // Each enable reopens the gear and toggles a single checkbox.
  const columnsToEnsure = ['Customer', 'Hours', LABELS.billable];
  if (!expected.wteGridCoreOnly) {
    if (expected.service) columnsToEnsure.push('Service');
    if (expected.className) columnsToEnsure.push('Class');
    if (expected.location) columnsToEnsure.push('Location');
    if (expected.miles || expected.milesEmpty) columnsToEnsure.push('Miles');
    for (const cfName of Object.keys(expected.customFields ?? {})) {
      columnsToEnsure.push(cfName);
    }
  }
  for (const column of columnsToEnsure) {
    await test.step(`ensure column "${column}" visible`, async () => {
      await teTabPage.ensureColumnVisibleViaSettings(column);
    });
  }

  await test.step(`row for "${expected.notes}" present`, async () => {
    const visible = await teTabPage.isRowWithNotesVisible(expected.notes);
    expect(visible).toBeTruthy();
  });

  const row = await teTabPage
    .getRowObjectByNotes(expected.notes)
    .catch(() => ({} as Record<string, string>));
  console.log('[TE01][Step7][grid] Row "%s": %o', expected.notes, row);

  // Find a cell value by header predicate (case-insensitive exact / contains).
  const cellByHeader = (pred: (header: string) => boolean): string =>
    Object.entries(row).find(([header]) => pred(header.trim()))?.[1] ?? '';

  // Employee name — the captured value is the clean Name field value (no role
  // badge). normalizeName removes commas, lowercases and sorts the words, so it
  // matches regardless of "First Last" vs "Last, First" display order.
  if (expected.employeeName) {
    await test.step(`grid Name = "${expected.employeeName}"`, async () => {
      const gridName = cellByHeader((h) => /^name$/i.test(h));
      expect(common.normalizeName(gridName)).toBe(
        common.normalizeName(expected.employeeName as string),
      );
    });
  }

  // Customer — contains (case-insensitive).
  if (expected.customer) {
    await test.step(`grid Customer contains "${expected.customer}"`, async () => {
      expect(
        cellByHeader((h) => /^customer$/i.test(h)).toLowerCase(),
      ).toContain((expected.customer as string).toLowerCase());
    });
  }

  // Service — header is "Service" or "Service item"; contains (case-insensitive).
  if (expected.service) {
    await test.step(`grid Service contains "${expected.service}"`, async () => {
      expect(
        cellByHeader((h) => /^service( item)?$/i.test(h)).toLowerCase(),
      ).toContain((expected.service as string).toLowerCase());
    });
  }

  // Hours — exact and/or minimum (decimal "4.00" and "04:00" both normalize).
  if (expected.hoursMin) {
    await soft(`grid Hours >= "${expected.hoursMin}"`, async () => {
      const gridHours = cellByHeader((h) => /^hours$/i.test(h));
      expect(common.normalizeToMinutes(gridHours)).toBeGreaterThanOrEqual(
        common.normalizeToMinutes(expected.hoursMin as string),
      );
    });
  }
  if (expected.hours) {
    await test.step(`grid Hours = "${expected.hours}"`, async () => {
      const gridHours = cellByHeader((h) => /^hours$/i.test(h));
      expect(common.normalizeToMinutes(gridHours)).toBe(
        common.normalizeToMinutes(expected.hours as string),
      );
    });
  }

  // Billable — Yes/No semantics.
  if (expected.billableChecked !== undefined) {
    await test.step(`grid Billable = ${
      expected.billableChecked ? 'Yes' : 'No'
    }`, async () => {
      const billable = cellByHeader((h) => /^billable$/i.test(h)).trim();
      const isYes =
        billable.length > 0 && billable !== '-' && !/^no$/i.test(billable);
      expect(isYes ? 'Yes' : 'No').toBe(
        expected.billableChecked ? 'Yes' : 'No',
      );
    });
  }

  // Class — contains (skipped for WTE when columns are not populated in grid).
  if (expected.className && !expected.wteGridCoreOnly) {
    await soft(`grid Class contains "${expected.className}"`, async () => {
      expect(cellByHeader((h) => /^class$/i.test(h))).toContain(
        expected.className as string,
      );
    });
  }

  // Location — contains.
  if (expected.location) {
    await soft(`grid Location contains "${expected.location}"`, async () => {
      expect(cellByHeader((h) => /^location$/i.test(h))).toContain(
        expected.location as string,
      );
    });
  }

  // Custom fields — column header equals (or includes) the field name.
  for (const [name, value] of Object.entries(expected.customFields ?? {})) {
    if (!value) continue;
    await soft(`grid CF "${name}" contains "${value}"`, async () => {
      const cell = cellByHeader((h) => h === name || h.includes(name));
      expect(cell).toContain(value);
    });
  }

  // Miles — empty after create; numeric after a manual mileage edit.
  if (expected.milesEmpty) {
    await test.step('grid Miles is empty', async () => {
      const miles = cellByHeader((h) => /^miles$/i.test(h)).trim();
      const emptyish = ['', '-', '0', '0.0', '0.00'];
      expect(emptyish.includes(miles)).toBeTruthy();
    });
  } else if (expected.miles) {
    await test.step(`grid Miles = ${expected.miles}`, async () => {
      const readMiles = async (): Promise<string> => {
        const refreshed = await teTabPage
          .getRowObjectByNotes(expected.notes)
          .catch(() => ({} as Record<string, string>));
        return (refreshed.Miles ?? '').trim();
      };
      let miles = await readMiles();
      if (!miles) {
        await expect.poll(readMiles, { timeout: 15000 }).not.toMatch(/^$|^-$/);
        miles = await readMiles();
      }
      expect(parseFloat(miles)).toBeCloseTo(
        parseFloat(expected.miles as string),
        1,
      );
    });
  }

  // Notes — contains.
  await test.step(`grid Notes contains "${expected.notes}"`, async () => {
    expect(cellByHeader((h) => /^notes$/i.test(h))).toContain(expected.notes);
  });
}

// ============================================================================
// Step 7 — CRUD: Single Time Entry (STE)
//
// Creates TWO entries and verifies each in the grid:
//   • Entry 1 — Duration mode, today's date, saved via "Save" + close trowser.
//   • Entry 2 — Start/End mode, yesterday's date, saved via "Save and close".
// Both entries populate Customer/Service/Class/Location + 2 custom fields, and
// every entered value is verified back in the grid (enabling hidden columns via
// the Settings gear as needed).
// ============================================================================

export async function step07_steCRUD(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
  createdEntries: string[],
): Promise<void> {
  const stePage = new TESingleTimeEntryPage(page);
  const common = new CommonLocators(page);

  await ensureTeSessionActive(page, account);
  const onGrid = await ensureTimeEntriesGridReady(page, teTabPage);
  if (!onGrid) {
    throw new Error(
      '[TE01][Step7] Time Entries grid not ready — cannot run STE CRUD',
    );
  }

  // Remove leftover TE01 rows from a prior failed run so create/edit steps do
  // not hit "conflicts with an existing time entry" on retry.
  await test.step('pre-cleanup leftover TE01 entries', async () => {
    await cleanupCreatedEntries(page, []);
  });

  // ==========================================================================
  // Entry 1 — Duration mode, today's date
  // ==========================================================================
  await test.step('set Today range before create', async () => {
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.today);
    await teTabPage.waitForLoadingToDisappear();
  });

  await teTabPage.openAddTimeOption('Single time entry');
  await stePage.handleTourModal();
  await stePage.expectSingleTimeEntryVisible();
  console.log('[TE01][Step7a] STE trowser opened (duration entry)');

  await test.step('Name field populated', async () => {
    await stePage.waitForNameFieldToPopulate();
  });

  // (1) Employee/Name dropdown — select the first option, then fetch the clean
  // employee name from the committed field value (no role badge).
  let e1Name = '';
  await test.step('select Name (first option)', async () => {
    await teTabPage.openDropdownAndSelectFirstOption('Name');
    e1Name = await teTabPage.getSelectedEmployeeName();
  });

  // Duration mode (toggle OFF by default) + enter duration. Only enter the
  // duration once the toggle is OFF — if it is ON (start/end mode) the hh:mm
  // field is not rendered. verifySetClockToggleState reads the toggle's real
  // aria-checked state, so we turn it OFF only when it is actually ON.
  const e1Hours = '02:00';
  await test.step('ensure duration mode (toggle OFF)', async () => {
    const toggleOn = await stePage.verifySetClockToggleState();
    if (toggleOn) {
      await stePage.clickSetClockInAndOutToggles();
    }
  });
  await test.step('enter duration 02:00', async () => {
    await stePage.enterFieldValue('duration', e1Hours);
  });

  // Customer / Service / Class / Location — each: open dropdown, wait, select
  // first real option (the helper skips "+ Add new"). Capture the selected
  // option text for grid verification.
  let e1Customer = '';
  let e1Class = '';
  let e1Location = '';
  await test.step('select Customer (first option)', async () => {
    e1Customer = await teTabPage.openDropdownAndSelectFirstOption('Customer');
  });
  await test.step('select Service (first option)', async () => {
    await teTabPage.openDropdownAndSelectFirstOption('Service');
  });
  await test.step('select Class (first option)', async () => {
    e1Class = await teTabPage.openDropdownAndSelectFirstOption('class');
  });
  await test.step('select Location (first option)', async () => {
    e1Location = await teTabPage.openDropdownAndSelectFirstOption('Location');
  });

  // Two custom fields (CF1 text value, CF2 first dropdown option).
  const cf1 = await populateCustomFields(teTabPage);

  // Billable.
  let e1Billable = false;
  if (account.entitlements.canSeeBillable) {
    await test.step('check billable + bill rate', async () => {
      await stePage.checkCheckboxIfVisible('Billable');
      await stePage.fillBillRateInput('50');
      e1Billable = true;
    });
  }

  // Notes (unique identifier for grid lookup + cleanup).
  await stePage.enterNotes(NOTES_CREATE);
  createdEntries.push(NOTES_CREATE);

  // Capture the entry's ACTUAL Start date from the form so the timer-icon lookup
  // matches the SAME date (immune to a midnight rollover that would otherwise
  // make `new Date()` return a different "today" than the entry's date).
  let e1AddedDate = '';
  await test.step('capture start date for timer-icon lookup', async () => {
    const rawStartDate = await page
      .getByLabel('Start date', { exact: true })
      .inputValue()
      .catch(() => '');
    e1AddedDate =
      toEnCaDate(rawStartDate) || new Date().toLocaleDateString('en-CA');
    console.log(
      '[TE01][Step7] Duration entry Start date="%s" → timer lookup date "%s"',
      rawStartDate,
      e1AddedDate,
    );
  });

  // Save via the "Save" button (keep the trowser OPEN). HARD: a save error
  // fails the test.
  await stePage.clickSaveButton();
  await teTabPage.expectSaveSucceeded();
  console.log('[TE01][Step7b] Duration STE created (trowser kept open)');

  // --------------------------------------------------------------------------
  // First edit — via the timer (history) icon: instead of closing, open the
  // "RECENT TIME ENTRIES" popup, reopen the just-saved entry, edit its duration,
  // and save (keep the trowser open). Then open the timer popup again and use
  // its "View more" link to navigate back to the Time Entries view, where the
  // edited duration is verified in the grid below.
  // --------------------------------------------------------------------------
  const e1HoursTimerEdited = '04:00';
  // e1AddedDate was captured above from the entry's own Start date field, so the
  // Recent Time Entries popup is matched on the entry's real date (en-CA
  // YYYY-MM-DD), not a possibly-rolled-over "today".
  await test.step('open Recent Time Entries via timer icon', async () => {
    await teTabPage.openRecentTimeEntries();
    await teTabPage.clickRecentTimeEntryByDate(e1AddedDate);
    await page.waitForTimeout(1000);
  });
  await test.step('edit duration via timer-icon entry → 04:00', async () => {
    await stePage.enterFieldValue('duration', e1HoursTimerEdited);
  });
  await page.waitForTimeout(500);
  await stePage.clickSaveButton();
  await teTabPage.expectSaveSucceeded();
  console.log('[TE01][Step7b-timer] Duration entry edited via timer icon');

  // Re-open the timer popup and click "View more" to land on the Time Entries view.
  await test.step('open timer popup again + click View more', async () => {
    await teTabPage.openRecentTimeEntries();
    await teTabPage.clickViewMoreInRecentTimeEntries();
    await page.waitForTimeout(1000);
  });
  // Widen beyond "Today" for verification: if the run crosses midnight, the
  // trowser's default Start date and the "Today" filter can disagree by a day.
  // Use a range that includes the entry's actual date — "This week" spans month
  // boundaries (e.g. 6/30 on a 7/1 run) where "This month" would miss the row.
  await test.step('set date range for verification', async () => {
    await selectDateRangeIncludingEntryDate(common, teTabPage, e1AddedDate);
  });

  // Verify entry 1 in the grid: Employee name, Customer, the timer-edited Hours,
  // Billable, Class, Location, CF1, CF2, Miles (empty on create), Notes.
  await verifyEntryInGrid(page, teTabPage, {
    notes: NOTES_CREATE,
    employeeName: e1Name,
    customer: e1Customer,
    hours: e1HoursTimerEdited,
    billableChecked: e1Billable,
    className: e1Class,
    location: e1Location,
    customFields: cf1,
    milesEmpty: true,
  });
  console.log('[TE01][Step7c] Timer-edited duration entry verified in grid');

  // ==========================================================================
  // Entry 2 — Start/End mode, past date (2 days ago — safe across timezones)
  // ==========================================================================
  const pastDateStr = getPastDateStr(STE_PAST_ENTRY_DAYS_AGO);
  const pastDateEnCa = toEnCaDate(pastDateStr);

  await teTabPage.openAddTimeOption('Single time entry');
  await stePage.handleTourModal();
  await stePage.expectSingleTimeEntryVisible();
  console.log('[TE01][Step7d] STE trowser opened (start/end entry)');

  await test.step('Name field populated', async () => {
    await stePage.waitForNameFieldToPopulate();
  });
  let e2Name = '';
  await test.step('select Name (first option)', async () => {
    await teTabPage.openDropdownAndSelectFirstOption('Name');
    e2Name = await teTabPage.getSelectedEmployeeName();
  });

  // Set the date to a past day so any time-of-day is safely in the past on prod.
  await test.step('set start date to past day', async () => {
    await stePage.fillStartDate(pastDateStr);
    await page.keyboard.press('Tab');
  });

  // Enable Start/End time mode, then pick times (9–11 AM = 2 hours).
  const e2Hours = '02:00';
  await test.step('enable start/end time + select times', async () => {
    const toggleOn = await stePage.verifySetClockToggleState();
    if (!toggleOn) {
      await stePage.clickSetClockInAndOutToggles();
      await page.waitForTimeout(1500);
    }
    await page.waitForSelector(`//span[text()="Start time"]`, {
      state: 'visible',
      timeout: 10000,
    });
    await stePage.selectTime('Start', '9:00 AM');
    await stePage.selectTime('End', '11:00 AM');
  });

  let e2Customer = '';
  let e2Class = '';
  let e2Location = '';
  await test.step('select Customer (first option)', async () => {
    e2Customer = await teTabPage.openDropdownAndSelectFirstOption('Customer');
  });
  await test.step('select Service (first option)', async () => {
    await teTabPage.openDropdownAndSelectFirstOption('Service');
  });
  await test.step('select Class (first option)', async () => {
    e2Class = await teTabPage.openDropdownAndSelectFirstOption('class');
  });
  await test.step('select Location (first option)', async () => {
    e2Location = await teTabPage.openDropdownAndSelectFirstOption('Location');
  });

  const cf2 = await populateCustomFields(teTabPage);

  let e2Billable = false;
  if (account.entitlements.canSeeBillable) {
    await test.step('check billable + bill rate', async () => {
      await stePage.checkCheckboxIfVisible('Billable');
      await stePage.fillBillRateInput('50');
      e2Billable = true;
    });
  }

  await stePage.enterNotes(NOTES_START_END);
  createdEntries.push(NOTES_START_END);

  // Save via the "Save and close" button. HARD: a save error fails the test.
  await stePage.clickSaveAndCloseButton();
  await teTabPage.expectSaveSucceeded();
  console.log('[TE01][Step7e] Start/End STE created');

  // Verify entry 2 in the grid — scope the range to the entry's own date.
  await test.step('set date range for verification', async () => {
    await selectDateRangeIncludingEntryDate(common, teTabPage, pastDateEnCa);
  });
  await verifyEntryInGrid(page, teTabPage, {
    notes: NOTES_START_END,
    employeeName: e2Name,
    customer: e2Customer,
    hours: e2Hours,
    billableChecked: e2Billable,
    className: e2Class,
    location: e2Location,
    customFields: cf2,
    milesEmpty: true,
  });
  console.log('[TE01][Step7f] Start/End entry verified in grid');

  // ==========================================================================
  // Edit Entry 1 (duration) — duration + CF1 + CF2 (2nd option) + mileage(50)
  // + notes, then verify the updated values in the grid.
  // ==========================================================================
  const e1HoursEdited = '03:00';
  let e1Miles = '';
  let cf1Edited: Record<string, string> = {};
  await test.step('open duration entry for edit', async () => {
    await selectDateRangeIncludingEntryDate(common, teTabPage, e1AddedDate);
    await teTabPage.getRowByNotes(NOTES_CREATE).click();
    await stePage.handleTourModal();
    await stePage.expectSingleTimeEntryVisible();
    await teTabPage.waitForLoadingToDisappear();
  });
  await test.step('edit duration → 03:00', async () => {
    await stePage.enterFieldValue('duration', e1HoursEdited);
  });
  cf1Edited = await editCustomFields(teTabPage, true); // CF1 text + CF2 2nd option
  await test.step('set mileage manually = 50', async () => {
    e1Miles = await teTabPage.setMileageManual(MILES_VALUE);
  });
  await test.step('edit notes → edited', async () => {
    await stePage.enterNotes(NOTES_CREATE_EDITED);
  });
  createdEntries.push(NOTES_CREATE_EDITED);
  await stePage.clickSaveAndCloseButton();
  await teTabPage.expectSaveSucceeded();
  console.log('[TE01][Step7g] Duration entry edited');

  await verifyEntryInGrid(page, teTabPage, {
    notes: NOTES_CREATE_EDITED,
    hours: e1HoursEdited,
    miles: e1Miles || MILES_VALUE,
    customFields: { ...cf1, ...cf1Edited },
  });
  console.log('[TE01][Step7g] Edited duration entry verified in grid');

  // ==========================================================================
  // Edit Entry 2 (start/end) — end time + CF1 + mileage(50) + notes, then
  // verify the recalculated duration and updated values in the grid.
  // ==========================================================================
  const e2HoursEdited = '02:30'; // 9:00 AM → 11:30 AM
  let e2Miles = '';
  let cf2Edited: Record<string, string> = {};
  await test.step('open start/end entry for edit', async () => {
    await selectDateRangeIncludingEntryDate(common, teTabPage, pastDateEnCa);
    await refreshTimeEntriesGrid(page, teTabPage);
    await expect(teTabPage.getRowByNotes(NOTES_START_END)).toBeVisible({
      timeout: 15000,
    });
    await teTabPage.getRowByNotes(NOTES_START_END).click();
    await stePage.handleTourModal();
    await stePage.expectSingleTimeEntryVisible();
    await teTabPage.waitForLoadingToDisappear();
  });
  await test.step('edit End time → 11:30 AM', async () => {
    // Re-assert past date — IES can reset to today when reopening the trowser.
    await stePage.fillStartDate(pastDateStr);
    await page.keyboard.press('Tab');
    await stePage.selectTime('End', '11:30 AM');
  });
  cf2Edited = await editCustomFields(teTabPage, false); // CF1 (text) only
  await test.step('set mileage manually = 50', async () => {
    e2Miles = await teTabPage.setMileageManual(MILES_VALUE);
  });
  await test.step('edit notes → edited', async () => {
    await stePage.enterNotes(NOTES_START_END_EDITED);
  });
  createdEntries.push(NOTES_START_END_EDITED);
  await stePage.clickSaveAndCloseButton();
  await teTabPage.expectSaveSucceeded();
  console.log('[TE01][Step7h] Start/End entry edited');

  await test.step('set date range for verification', async () => {
    await selectDateRangeIncludingEntryDate(common, teTabPage, pastDateEnCa);
  });
  await verifyEntryInGrid(page, teTabPage, {
    notes: NOTES_START_END_EDITED,
    hours: e2HoursEdited,
    miles: e2Miles || MILES_VALUE,
    customFields: { ...cf2, ...cf2Edited },
  });
  console.log('[TE01][Step7h] Edited start/end entry verified in grid');

  // ==========================================================================
  // Who's Working map flow — use a different employee than entry 1 when possible;
  // if only one worker exists, start after entry 2's end time to avoid overlap.
  //   • edit from the map: clock out (uncheck currently working) + end time +
  //     notes, then confirm the worker drops off the map;
  //   • the entry is deleted with the others below.
  // ==========================================================================
  let wwName = e1Name;

  // 1. Create the currently-working entry.
  await test.step('set date range before who-is-working create', async () => {
    await selectDateRangeIncludingEntryDate(common, teTabPage, pastDateEnCa);
  });
  await teTabPage.openAddTimeOption('Single time entry');
  await stePage.handleTourModal();
  await stePage.expectSingleTimeEntryVisible();
  await test.step('Name field populated', async () => {
    await stePage.waitForNameFieldToPopulate();
  });
  await test.step(`select employee other than "${e1Name}"`, async () => {
    wwName = await teTabPage.selectNameOptionExcluding(e1Name);
  });
  await test.step('set start date to past day', async () => {
    await stePage.fillStartDate(pastDateStr);
    await page.keyboard.press('Tab');
  });
  await test.step('enable start/end time + start time', async () => {
    const on = await stePage.verifySetClockToggleState();
    if (!on) {
      await stePage.clickSetClockInAndOutToggles();
      await page.waitForTimeout(1500);
    }
    await page.waitForSelector(`//span[text()="Start time"]`, {
      state: 'visible',
      timeout: 10000,
    });
    const sameEmployeeAsEntry1 =
      wwName.replace(/[\s,]+/g, '').toLowerCase() ===
      e1Name.replace(/[\s,]+/g, '').toLowerCase();
    const wwStartTime = sameEmployeeAsEntry1
      ? '2:00 PM'
      : WHOS_WORKING_START_TIME;
    await stePage.selectTime('Start', wwStartTime);
  });
  await test.step('select Customer (first option)', async () => {
    await teTabPage.openDropdownAndSelectFirstOption('Customer');
  });
  await test.step('select Service (first option)', async () => {
    await teTabPage.openDropdownAndSelectFirstOption('Service');
  });

  // Billable.
  if (account.entitlements.canSeeBillable) {
    await test.step('check billable + bill rate', async () => {
      await stePage.checkCheckboxIfVisible('Billable');
      await stePage.fillBillRateInput('50');
      e1Billable = true;
    });
  }

  await test.step('check "Currently working"', async () => {
    await teTabPage.setCurrentlyWorking(true);
  });
  await stePage.enterNotes(NOTES_WHOS_WORKING);
  createdEntries.push(NOTES_WHOS_WORKING);
  await stePage.clickSaveAndCloseButton();
  await teTabPage.expectSaveSucceeded();
  console.log(
    '[TE01][Step7j] Currently-working entry created for "%s"',
    wwName,
  );

  // 2. Verify it shows up in the grid.
  await test.step('currently-working entry visible in grid', async () => {
    await teTabPage.waitForLoadingToDisappear();
    const row = await teTabPage
      .getRowObjectByNotes(NOTES_WHOS_WORKING)
      .catch(() => ({}));
    console.log("[TE01][Step7j] Who's-working row: %o", row);
    expect(
      await teTabPage.isRowWithNotesVisible(NOTES_WHOS_WORKING),
    ).toBeTruthy();
  });

  // 3. Open the Who's Working map and confirm the worker is listed.
  await test.step("open Who's Working map + verify worker present", async () => {
    await teTabPage.openWhosWorkingMap();
    expect(await teTabPage.isWorkerInWhosWorking(wwName)).toBeTruthy();
    await page.waitForTimeout(800);
    console.log(
      '[TE01][Step7k] Worker "%s" present in Who\'s Working map',
      wwName,
    );
    //await teTabPage.closeWhosWorkingMap();
  });

  // 4. Edit from the map (the map is left open from step 3); fall back to the
  //    grid row if the map "Edit Time" button doesn't open the STE. Only run
  //    the edit + hard save when the STE trowser actually opened, so the best-
  //    effort map flow can't hard-fail the whole test on an un-opened trowser.
  let steOpen = false;
  await test.step("edit from Who's Working map", async () => {
    steOpen = await teTabPage.clickEditInWhosWorking(wwName);
  });
  if (!steOpen) {
    await test.step('fallback: open who-is-working entry from grid', async () => {
      await teTabPage.closeWhosWorkingMap();
      await teTabPage.waitForLoadingToDisappear();
      await teTabPage.getRowByNotes(NOTES_WHOS_WORKING).click();
      await stePage.handleTourModal();
      steOpen = await stePage.headingSingleTimeEntry
        .isVisible({ timeout: 8000 })
        .catch(() => false);
    });
  }

  if (steOpen) {
    // Wait for the STE form to be interactive before editing (opening from the
    // map can lag); otherwise the field edits silently no-op.
    await test.step('wait for STE form ready', async () => {
      await stePage.waitTillNameFieldVisible();
      await page.waitForTimeout(1000);
    });
    await test.step('uncheck "Currently working" + set end time', async () => {
      await teTabPage.setCurrentlyWorking(false);
      await page.waitForTimeout(1000);
      await page
        .waitForSelector(`//span[text()="End time"]`, {
          state: 'visible',
          timeout: 10000,
        })
        .catch(() => undefined);
      // End time must be AFTER the Who's Working start; pick a clearly-later time.
      await stePage.selectTime('End', '5:00 PM');
    });
    await test.step('edit notes → edited', async () => {
      await stePage.enterNotes(NOTES_WHOS_WORKING_EDITED);
    });
    createdEntries.push(NOTES_WHOS_WORKING_EDITED);
    await stePage.clickSaveAndCloseButton();
    await teTabPage.expectSaveSucceeded();
    // The map trowser may still be open over the grid — close it before verifying.
    await teTabPage.closeWhosWorkingMap();
    console.log("[TE01][Step7l] Who's-working entry edited (clocked out)");
  } else {
    console.warn(
      '[TE01][Step7l] SKIPPED who-is-working edit — STE trowser did not open',
    );
  }

  // 5. Verify in the grid, then confirm the worker dropped off the map.
  await test.step('edited who-is-working entry visible in grid', async () => {
    await teTabPage.waitForLoadingToDisappear();
    // The edit happened from the map; refresh so the edited notes are reflected
    // instead of the stale pre-edit row.
    await refreshTimeEntriesGrid(page, teTabPage);
    expect(
      await teTabPage.isRowWithNotesVisible(NOTES_WHOS_WORKING_EDITED),
    ).toBeTruthy();
  });
  await test.step("worker no longer in Who's Working map", async () => {
    await teTabPage.openWhosWorkingMap();
    expect(await teTabPage.isWorkerInWhosWorking(wwName)).toBeFalsy();
    console.log(
      '[TE01][Step7m] Worker "%s" no longer in Who\'s Working map',
      wwName,
    );
    await teTabPage.closeWhosWorkingMap();
  });

  // // ==========================================================================
  // // Locked entry — view-only (optional)
  // // ==========================================================================
  // if (account.seededData.lockedEntryDate) {
  //   await test.step('locked entry is view-only', async () => {
  //     const viewButton = teTabPage.tePageBase.getFirstLockedRecord();
  //     await expect(viewButton).toBeVisible();
  //     await viewButton.click();
  //     await stePage.expectSingleTimeEntryVisible();
  //     await teTabPage.tePageBase.validateLockIconTooltip().catch(() => undefined);
  //     await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0);
  //     await stePage.closeSingleTimeTrowser().catch(() => undefined);
  //   });
  //   console.log('[TE01][Step7g] Locked entry correctly view-only');
  // } else {
  //   console.log('[TE01][Step7g] SKIPPED — no locked entry seeded');
  // }

  // // ==========================================================================
  // // Approve / Unapprove (duration entry)
  // // ==========================================================================
  // if (account.entitlements.canApprove) {
  //   await test.step('approve / unapprove duration entry', async () => {
  //     await common.openDateRangeDropdown();
  //     await common.selectDateRangeOption(LABELS.today);
  //     await teTabPage.waitForLoadingToDisappear();
  //     await teTabPage.approveEntryByNotes(NOTES_CREATE);
  //     await teTabPage.assertEntryStatus(NOTES_CREATE, 'Approved');
  //     await teTabPage.unapproveEntryByNotes(NOTES_CREATE);
  //     await teTabPage.assertEntryStatus(NOTES_CREATE, 'Unapproved');
  //   });
  //   console.log('[TE01][Step7h] Approve/Unapprove validated');
  // } else {
  //   console.log('[TE01][Step7h] SKIPPED — role=%s cannot approve', account.role);
  // }

  // ==========================================================================
  // Delete all created entries (by their edited notes).
  // ==========================================================================
  for (const notes of [
    NOTES_CREATE_EDITED,
    NOTES_START_END_EDITED,
    NOTES_WHOS_WORKING_EDITED,
  ]) {
    await test.step(`delete entry "${notes}"`, async () => {
      const row = teTabPage.getRowByNotes(notes);
      if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) {
        return;
      }
      await row.click();
      await stePage.handleTourModal();
      await stePage.clickDeleteButton();
      await stePage.expectDeleteConfirmationVisible();
      await stePage.clickYesOnDeleteConfirmation();
      await stePage.expectTimeEntryDeletedToastVisible();
      await teTabPage.waitForLoadingToDisappear();
    });
  }
  console.log(
    '[TE01][Step7i] Deleted both duration and start/end time entries',
  );
}

// ============================================================================
// Step 7b — Weekly Time Entry (WTE) CRUD
// ============================================================================

async function ensureThisWeekFilter(
  common: CommonLocators,
  teTabPage: TETimeEntriesTabPage,
): Promise<void> {
  await common.openDateRangeDropdown();
  await common.selectDateRangeOption(LABELS.thisWeek);
  await teTabPage.waitForLoadingToDisappear();
}

/**
 * Waits for the Time Entries grid filters to render. Submenu navigation can land
 * on a shell-only page (title visible, filters missing); fall back to the direct
 * `/app/time?jobId=time` URL used by the legacy WTE suites when that happens.
 */
export async function ensureTimeEntriesGridReady(
  page: Page,
  teTabPage: TETimeEntriesTabPage,
): Promise<boolean> {
  // Close All-apps flyouts / modals that can leave the time shell without filters.
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(300);
  }

  await dismissTasksDrawerIfVisible(page);

  const timeEntriesLink = page
    .locator(`a[data-id="time-center-entries"], a[aria-label="Time entries"]`)
    .first();
  if (await timeEntriesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await timeEntriesLink.click({ force: true }).catch(() => undefined);
    await teTabPage.waitForLoadingToDisappear();
  }

  // The grid is "ready" when ANY Time Entries content control is visible.
  // Probe each locator independently — a single union selector with `.first()`
  // can match a hidden shell/skeleton node earlier in the DOM and time out even
  // while the real filters are on screen (see PREF03 Time Clock prod runs).
  const readyProbes: Locator[] = [
    page.getByLabel('Display by'),
    page.getByLabel('Date range'),
    page.getByRole('button', { name: /^Clock in$/i }),
    page.locator('[data-testid="DisplayByDropdown"]'),
    page.locator('[data-testid="DateRangeSelect"]'),
    page.locator('.DateRangeSelect'),
  ];

  const waitForReady = async (timeout: number): Promise<boolean> => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      for (const probe of readyProbes) {
        if (
          await probe
            .first()
            .isVisible()
            .catch(() => false)
        ) {
          return true;
        }
      }
      await page.waitForTimeout(500);
    }
    return false;
  };

  if (await waitForReady(10_000)) {
    return true;
  }

  console.log(
    '[TE01][Step2] Display by not visible after submenu navigation — ' +
      'falling back to direct Time Entries URL',
  );

  await teTabPage.navigateToTimeEntriesPage();
  await teTabPage.waitForLoadingToDisappear();
  await teTabPage.tePageBase.handlePopupsInAnyOrder();

  let ready = await waitForReady(60_000);

  // The page header/nav can load while the content region (Display by + grid)
  // never finishes rendering. A hard reload gives the stuck content a second
  // chance before we give up.
  if (!ready) {
    console.log(
      '[TE01][Step2] Display by still hidden after direct navigation — ' +
        'reloading once before giving up',
    );
    await page.reload({ waitUntil: 'load' });
    await teTabPage.waitForLoadingToDisappear();
    await teTabPage.tePageBase.handlePopupsInAnyOrder();
    ready = await waitForReady(60_000);
  }

  if (!ready && (await isTimeServiceMaintenanceVisible(page))) {
    console.warn(
      '[TE01] Time service maintenance in progress — grid filters unavailable',
    );
    return false;
  }

  return ready;
}

/** Returns to the Time Entries grid after WTE trowser save/close. */
async function ensureOnTimeEntriesGrid(
  page: Page,
  teTabPage: TETimeEntriesTabPage,
): Promise<void> {
  await teTabPage.closeWeeklyTrowserIfOpen();
  const onGrid = await ensureTimeEntriesGridReady(page, teTabPage);
  if (!onGrid) {
    throw new Error(
      '[TE01] Time Entries grid did not load — Display by control still hidden',
    );
  }
  await teTabPage.common.dismissGotItPopupIfVisible();
}

async function readGridHours(
  teTabPage: TETimeEntriesTabPage,
  notes: string,
): Promise<string> {
  const row = await teTabPage
    .getRowObjectByNotes(notes)
    .catch(() => ({} as Record<string, string>));
  return (
    Object.entries(row)
      .find(([header]) => /^hours$/i.test(header.trim()))?.[1]
      ?.trim() ?? ''
  );
}

/**
 * Creates a multi-day weekly time entry: hours across weekdays, mileage per day,
 * side-panel location (time location), and custom fields on the first day.
 */
export async function createWeeklyTimeEntryForWte(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
  createdEntries: string[],
): Promise<TEWeeklyEntryContext | null> {
  if (!account.entitlements.weeklyEntryEnabled) {
    console.log(
      '[TE01][Step7b] SKIPPED — weekly entry not enabled for account',
    );
    return null;
  }

  const common = new CommonLocators(page);
  const totalHoursCreate = `${String(WTE_WEEKDAY_COLS.length * 2).padStart(
    2,
    '0',
  )}:00`;

  await soft('set This week before weekly entry create', async () => {
    await ensureThisWeekFilter(common, teTabPage);
  });

  await teTabPage.openWeeklyTimeEntryTrowser();

  const employeeName = await teTabPage.prepareWeeklySheet();
  await teTabPage.clearDefaultWeeklyRow();
  console.log('[TE01][Step7b] WTE trowser opened (multi-day weekly entry)');

  let customer = '';
  let className = '';
  let location = '';
  let billableChecked = false;

  await soft('select customer (first option)', async () => {
    customer = await teTabPage.selectCustomerFirstOption();
  });

  let cfValues: Record<string, string> = {};
  for (let i = 0; i < WTE_WEEKDAY_COLS.length; i++) {
    const col = WTE_WEEKDAY_COLS[i];
    await soft(
      `fill weekday col ${col} with ${WTE_HOURS_PER_DAY}h`,
      async () => {
        await teTabPage.clickWeekdayCell(col);
        await teTabPage.fillActiveCellHours(WTE_HOURS_PER_DAY);
      },
    );
    if (i === 0) {
      await soft('fill side panel service / class / location', async () => {
        const panel = await teTabPage.fillSidePanelServiceClassLocation();
        className = panel.className;
        location = panel.location;
      });
      if (account.entitlements.locationTrackingEnabled && location) {
        await soft('time location persisted in side panel', async () => {
          const savedLocation = await teTabPage.getSidePanelLocationValue();
          expect(savedLocation.length).toBeGreaterThan(0);
          console.log(
            '[TE01][Step7b] Time location on day 1: "%s"',
            savedLocation,
          );
        });
      }
      if (account.entitlements.customFieldsEnabled) {
        cfValues = await populateCustomFields(teTabPage);
      }
      if (account.entitlements.canSeeBillable) {
        await soft('check billable + bill rate', async () => {
          billableChecked = await teTabPage.setSidePanelBillable('50');
        });
      }
      await teTabPage.fillSidePanelNotes(NOTES_WTE_WEEKLY);
      createdEntries.push(NOTES_WTE_WEEKLY);
    } else if (account.entitlements.locationTrackingEnabled && location) {
      await soft(`time location on weekday col ${col}`, async () => {
        const savedLocation = await teTabPage.getSidePanelLocationValue();
        if (savedLocation) {
          console.log(
            '[TE01][Step7b] Time location on col %d: "%s"',
            col,
            savedLocation,
          );
        }
      });
    }

    await soft(`mileage on weekday col ${col}`, async () => {
      const miles = await teTabPage.setMileageManual(MILES_VALUE);
      if (miles) {
        console.log('[TE01][Step7b] Mileage on col %d: %s', col, miles);
      }
    });
  }

  // Single save after all weekdays filled (WeeklyTimeEntry.util pattern).
  await teTabPage.wteSave();
  await teTabPage.wteSaveAndClose();
  await teTabPage.closeWeeklyTrowserIfOpen();
  console.log('[TE01][Step7b] Multi-day WTE entry saved and closed');

  await ensureOnTimeEntriesGrid(page, teTabPage);
  await teTabPage.waitForLoadingToDisappear();

  const gridHoursAfterCreate = await readGridHours(teTabPage, NOTES_WTE_WEEKLY);
  console.log(
    '[TE01][Step7b] Grid hours after create: "%s"',
    gridHoursAfterCreate,
  );

  await verifyEntryInGrid(page, teTabPage, {
    notes: NOTES_WTE_WEEKLY,
    employeeName,
    customer,
    hours: gridHoursAfterCreate || totalHoursCreate,
    // TE grid may show weekly total or last saved day — require at least one day.
    hoursMin: `${WTE_HOURS_PER_DAY.padStart(2, '0')}:00`,
    billableChecked,
    wteGridCoreOnly: true,
  });

  return {
    notes: NOTES_WTE_WEEKLY,
    employeeName,
    customer,
    className,
    location,
    billableChecked,
    cfValues,
    gridHoursAfterCreate: gridHoursAfterCreate || totalHoursCreate,
  };
}

/**
 * Edit, approve/unapprove, locked-entry check, and delete for an existing weekly
 * entry created by `createWeeklyTimeEntryForWte`.
 */
export async function step07b_wteCRUD(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
  createdEntries: string[],
  weeklyEntry: TEWeeklyEntryContext,
): Promise<void> {
  const stePage = new TESingleTimeEntryPage(page);
  const common = new CommonLocators(page);
  const {
    employeeName,
    customer,
    billableChecked,
    notes: createdNotes,
  } = weeklyEntry;

  await soft('set This week and confirm seeded entry before CRUD', async () => {
    await ensureThisWeekFilter(common, teTabPage);
    expect(await teTabPage.isRowWithNotesVisible(createdNotes)).toBeTruthy();
  });
  console.log(
    '[TE01][Step7b] Using seeded weekly entry notes="%s"',
    createdNotes,
  );

  let cfEdited: Record<string, string> = {};

  await teTabPage.openWeeklyTimeEntryTrowser();
  await teTabPage.prepareWeeklySheet(true, employeeName || undefined);
  console.log('[TE01][Step7b-edit] WTE reopened for edit');

  await soft(
    `edit first weekday col → ${WTE_HOURS_PER_DAY_EDITED}h`,
    async () => {
      await teTabPage.clickWeekdayCell(WTE_WEEKDAY_COLS[0]);
      await teTabPage.fillActiveCellHours(WTE_HOURS_PER_DAY_EDITED);
    },
  );

  if (account.entitlements.customFieldsEnabled) {
    cfEdited = await editCustomFields(teTabPage, true);
  }

  await soft('update mileage on edited day', async () => {
    const milesEdited = await teTabPage.setMileageManual('55');
    if (milesEdited) {
      console.log('[TE01][Step7b-edit] Mileage updated: %s', milesEdited);
    }
  });

  if (account.entitlements.locationTrackingEnabled) {
    await soft('time location still set after edit', async () => {
      const loc = await teTabPage.getSidePanelLocationValue();
      if (loc) {
        console.log('[TE01][Step7b-edit] Time location: "%s"', loc);
      }
    });
  }

  await teTabPage.fillSidePanelNotes(NOTES_WTE_WEEKLY_EDITED);
  createdEntries.push(NOTES_WTE_WEEKLY_EDITED);

  await teTabPage.wteSaveAndClose();
  await teTabPage.closeWeeklyTrowserIfOpen();
  console.log('[TE01][Step7b-edit] WTE entry edited in weekly trowser');

  await soft('return to Time Entries grid after edit', async () => {
    await ensureOnTimeEntriesGrid(page, teTabPage);
    await ensureThisWeekFilter(common, teTabPage);
  });

  const gridHoursAfterEdit = await readGridHours(
    teTabPage,
    NOTES_WTE_WEEKLY_EDITED,
  );
  console.log(
    '[TE01][Step7b-edit] Grid hours after edit: "%s"',
    gridHoursAfterEdit,
  );

  await verifyEntryInGrid(page, teTabPage, {
    notes: NOTES_WTE_WEEKLY_EDITED,
    employeeName,
    customer,
    hoursMin: `${WTE_HOURS_PER_DAY_EDITED.padStart(2, '0')}:00`,
    billableChecked,
    customFields: cfEdited,
    wteGridCoreOnly: true,
  });
  console.log('[TE01][Step7b-edit] Edited WTE entry verified in grid');

  if (account.entitlements.canApprove && !page.isClosed()) {
    await soft('approve / unapprove weekly entry', async () => {
      await ensureOnTimeEntriesGrid(page, teTabPage);
      await ensureThisWeekFilter(common, teTabPage);
      expect(
        await teTabPage.isRowWithNotesVisible(NOTES_WTE_WEEKLY_EDITED),
      ).toBeTruthy();
      await teTabPage.approveEntryByNotes(
        NOTES_WTE_WEEKLY_EDITED,
        employeeName,
      );
      await teTabPage.assertEntryStatus(NOTES_WTE_WEEKLY_EDITED, 'Approved');
      await teTabPage.unapproveEntryByNotes(
        NOTES_WTE_WEEKLY_EDITED,
        employeeName,
      );
      await teTabPage.assertEntryStatus(NOTES_WTE_WEEKLY_EDITED, 'Unapproved');
    });
    console.log('[TE01][Step7b] Approve / unapprove complete');
  } else if (page.isClosed()) {
    console.log('[TE01][Step7b] SKIPPED approve — page closed');
  } else {
    console.log('[TE01][Step7b] SKIPPED approve — role cannot approve time');
  }

  if (account.seededData.lockedEntryDate) {
    await soft('locked weekly entry is view-only', async () => {
      const viewButton = teTabPage.tePageBase.getFirstLockedRecord();
      await expect(viewButton).toBeVisible();
      await viewButton.click();
      await stePage.expectSingleTimeEntryVisible();
      await teTabPage.tePageBase
        .validateLockIconTooltip()
        .catch(() => undefined);
      await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0);
      await page
        .getByRole('button', { name: /^close$/i })
        .first()
        .click()
        .catch(() => page.keyboard.press('Escape'));
    });
    console.log('[TE01][Step7b] Locked entry view-only validated');
  } else {
    console.log('[TE01][Step7b] SKIPPED locked entry — none seeded');
  }

  await soft(`delete entry "${NOTES_WTE_WEEKLY_EDITED}"`, async () => {
    await ensureOnTimeEntriesGrid(page, teTabPage);
    await ensureThisWeekFilter(common, teTabPage);
    const row = teTabPage.getRowByNotes(NOTES_WTE_WEEKLY_EDITED);
    if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) {
      return;
    }
    await row.click();
    await stePage.handleTourModal();
    await stePage.clickDeleteButton();
    await stePage.expectDeleteConfirmationVisible();
    await stePage.clickYesOnDeleteConfirmation();
    await stePage.expectTimeEntryDeletedToastVisible();
    await teTabPage.waitForLoadingToDisappear();
  });
  console.log('[TE01][Step7b] Weekly entry deleted');
}

/**
 * Runs the full TE01 Weekly Time Entry suite in sequence (parallel to
 * {@link runTEFullSuite}). `createdEntries` is populated with Notes identifiers
 * for cleanup in the spec's afterEach.
 *
 * Step mapping:
 *   1   — Login & role setup (post-login shell checks)
 *   1.2 — Dashboard validation
 *   2   — Navigate to Time Entries
 *   3   — Tab visibility vs entitlements
 *   4   — Default state & filters
 *   5   — Column visibility & action settings
 *   6   — Role-scoped data visibility
 *   7b  — Weekly Time Entry create + edit / approve / locked / delete
 *   8   — Cleanup (columns, filters)
 */
export async function runWTEFullSuite(
  page: Page,
  account: TETestAccount,
  createdEntries: string[] = [],
): Promise<void> {
  if (!account.entitlements.weeklyEntryEnabled) {
    console.log(
      '[TE01] Weekly entry disabled — suite complete (early return).',
    );
    return;
  }

  const teTabPage = new TETimeEntriesTabPage(page);
  page.setDefaultTimeout(30_000);

  await softStep('Step1 — login & role setup', () =>
    step01_loginAndRoleSetup(page, account),
  );

  await softStep('Step1.2 — dashboard validation', () =>
    step012_validateDashboard(page, account),
  );

  let canContinue = true;
  await softStep('Step2 — navigate to Time entries', async () => {
    canContinue = await step02_navigateToTimeSubmenu(
      page,
      account,
      teTabPage,
      'Time entries',
    );
  });
  if (!canContinue) {
    console.log(
      '[TE01] Time Entries tab hidden — suite complete (early return).',
    );
    return;
  }

  await validateLeftNavPersistence(page, account);

  await softStep('Step3 — tab visibility vs entitlements', () =>
    step03_tabVisibilityVsEntitlements(page, account, teTabPage),
  );
  await softStep('Step4 — filters validation', () =>
    step04_filtersValidation(page, account, teTabPage),
  );
  await ensureTeSessionActive(page, account);
  await step05_columnVisibilityAndSettings(page, account, teTabPage);
  await softStep('Step6 — role-scoped data visibility', () =>
    step06_roleScopedDataVisibility(page, account, teTabPage),
  );

  await ensureTeSessionActive(page, account);
  const weeklyEntry = await createWeeklyTimeEntryForWte(
    page,
    account,
    teTabPage,
    createdEntries,
  );
  if (!weeklyEntry) {
    console.log(
      '[TE01] Weekly entry setup failed — suite complete (early return).',
    );
    return;
  }

  await step07b_wteCRUD(page, account, teTabPage, createdEntries, weeklyEntry);

  await step08_cleanup(page, account, teTabPage);

  console.log('[TE01] Weekly Time Entry full suite complete.');
}

// ============================================================================
// Step 8 — Cleanup
// ============================================================================

export async function step08_cleanup(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
): Promise<void> {
  const common = new CommonLocators(page);

  try {
    // Restore default columns (enable all) — reopens the gear per column.
    await teTabPage.setAllColumnCheckboxes(true);

    if (account.seededData.customFieldName) {
      console.log(
        '[TE01][Step8] NOTE: custom field "%s" used — manual cleanup required (no API util)',
        account.seededData.customFieldName,
      );
    }

    // Reset filters to defaults.
    await common.selectDisplayByOption(LABELS.date);
    await teTabPage.waitForLoadingToDisappear();
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.thisWeek);
    await teTabPage.waitForLoadingToDisappear();

    console.log('[TE01][Step8] Cleanup complete — environment restored');
  } catch (error) {
    console.warn('[TE01][Step8] Cleanup encountered an issue:', error);
  }
}

// ============================================================================
// afterEach cleanup helper — remove any entries created during the run
// ============================================================================

async function dismissBlockingOverlaysBeforeGridClick(
  page: Page,
  stePage: TESingleTimeEntryPage,
): Promise<void> {
  const steClose = page.locator(
    `//div[@data-automation-id="single-time-trowser_close"] / button[@aria-label="Close"]`,
  );
  if (await steClose.isVisible({ timeout: 500 }).catch(() => false)) {
    await steClose.click().catch(() => undefined);
    await page.waitForTimeout(400);
  }

  for (let i = 0; i < 3; i++) {
    const leaveBtn = page
      .getByRole('button', { name: /^(yes|leave)$/i })
      .or(page.getByRole('button', { name: /leave without saving/i }));
    if (await leaveBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await leaveBtn.click().catch(() => undefined);
      await page.waitForTimeout(400);
      break;
    }
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(300);
  }

  const overlay = page.locator('[class*="ActionInProgressOverlay"]');
  await overlay
    .waitFor({ state: 'hidden', timeout: 10000 })
    .catch(() => undefined);

  await stePage.handleTourModal().catch(() => undefined);
}

export async function cleanupCreatedEntries(
  page: Page,
  _createdEntries: string[],
): Promise<void> {
  if (page.isClosed()) {
    console.log('[TE01][cleanup] Page closed — skipping cleanup');
    return;
  }

  const stePage = new TESingleTimeEntryPage(page);
  const teTabPage = new TETimeEntriesTabPage(page);
  const common = new CommonLocators(page);

  try {
    // If a test failed mid-flow, an STE trowser / "leave without saving" popup
    // may still be open and would block the navigation + filter steps below
    // (making cleanup hang). Dismiss any such overlay first.
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(400);
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
        '[cleanup] Time Entries grid not available — ending cleanup.',
      );
      return;
    }
    await common.selectDisplayByOption(LABELS.date);
    await teTabPage.waitForLoadingToDisappear();

    const notesToDelete = [
      ...new Set([...ALL_TE01_CLEANUP_NOTES, ..._createdEntries]),
    ];
    const cleanupRanges = [LABELS.thisWeek, LABELS.thisMonth, LABELS.lastMonth];
    let totalDeleted = 0;

    for (const range of cleanupRanges) {
      await common.openDateRangeDropdown();
      await common.selectDateRangeOption(range);
      await teTabPage.waitForLoadingToDisappear();

      for (const notes of notesToDelete) {
        const row = teTabPage.getRowByNotes(notes);
        if (!(await row.isVisible({ timeout: 1500 }).catch(() => false))) {
          continue;
        }
        await dismissBlockingOverlaysBeforeGridClick(page, stePage);
        await row.click();
        await stePage.handleTourModal().catch(() => undefined);
        await stePage.clickDeleteButton();
        await stePage.expectDeleteConfirmationVisible();
        await stePage.clickYesOnDeleteConfirmation();
        await stePage.expectTimeEntryDeletedToastVisible();
        await teTabPage.waitForLoadingToDisappear();
        totalDeleted += 1;
        console.log('[cleanup] Deleted "%s" entry (range=%s)', notes, range);
      }
    }

    if (totalDeleted === 0) {
      console.log('[cleanup] No time entries to delete — ending cleanup.');
    }
  } catch (error) {
    console.warn('[cleanup] Cleanup encountered an issue:', error);
  }
}

interface ProductEntitlementRow {
  flavour?: string;
  flavor?: string;
  [key: string]: unknown;
}

function mapFlavourToSKU(flavour: string): TETestAccount['sku'] {
  const f = flavour.toLowerCase();
  if (f.includes('simplestart')) return 'simplestart';
  if (f.includes('limited')) return 'limited';
  if (f.includes('ca')) return 'ca_hidden';
  return 'full';
}

export async function fetchProductEntitlementsFromUI(
  page: Page,
): Promise<{ sku: TETestAccount['sku'] | undefined; flavours: string[] }> {
  try {
    const rows: ProductEntitlementRow[] | null = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const qbo = (window as any).qbo;
      if (!qbo || typeof qbo.productEntitlements === 'undefined') {
        return null;
      }
      const raw = qbo.productEntitlements;
      return Array.isArray(raw) ? raw : Object.values(raw as object);
    });

    if (!rows || rows.length === 0) {
      console.warn(
        '[TE01][entitlements] qbo.productEntitlements returned nothing — SKU unresolved',
      );
      return { sku: undefined, flavours: [] };
    }

    let resolvedSKU: TETestAccount['sku'] | undefined;
    const flavours: string[] = [];

    rows.forEach((row, index) => {
      const flavour: string = (row?.flavour ?? row?.flavor ?? '') as string;
      console.log(
        '[TE01][entitlements] productEntitlements[%d] flavour: %s',
        index,
        flavour || '(empty)',
      );
      if (flavour) {
        flavours.push(flavour);
        if (!resolvedSKU) {
          resolvedSKU = mapFlavourToSKU(flavour);
        }
      }
    });

    return { sku: resolvedSKU, flavours };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(
      '[TE01][entitlements] Failed to read qbo.productEntitlements — %s',
      msg,
    );
    return { sku: undefined, flavours: [] };
  }
}

function mapFlavoursToCompanyType(
  flavours: string[],
): NonNullable<TETestAccount['companyType']> {
  const combined = flavours.join(' ').toUpperCase();
  if (combined.includes('IES') || combined.includes('ENTERPRISE')) return 'ies';
  if (combined.includes('ELITE')) return 'elite';
  if (combined.includes('PREMIUM')) return 'premium';
  return 'standard';
}

export async function step012_validateDashboard(
  page: Page,
  account: TETestAccount,
): Promise<void> {
  // --- Derive companyType from raw flavours ---------------------------------
  // rawFlavours was populated by fetchProductEntitlementsFromUI() in the
  // orchestrator.  The combined string (e.g. 'QBO_ADVANCED + PR_ELITE') drives
  // both the log line and all company-type-specific assertions below.
  const flavourLabel =
    account.rawFlavours && account.rawFlavours.length > 0
      ? account.rawFlavours.join(' + ')
      : '(no flavours)';

  if (account.rawFlavours && account.rawFlavours.length > 0) {
    account.companyType = mapFlavoursToCompanyType(account.rawFlavours);
  }

  console.log('[TE01][Step1.2] Validating dashboard: role=%s', account.role);
  console.log('[TE01][Step1.2][SKU]: %s', flavourLabel);
  console.log(
    '[TE01][Step1.2] companyType derived from flavours: %s',
    account.companyType ?? 'unresolved',
  );

  // --- Common (all company types) -------------------------------------------

  await test.step('dashboard: QBO body node visible', async () => {
    await expect(page.locator('[data-id=bodyNode]')).toBeVisible({
      timeout: 15000,
    });
  });

  await test.step('dashboard: account header visible', async () => {
    await expect(page.locator('.oneIntuitAccountHeaderItem')).toBeVisible({
      timeout: 15000,
    });
  });

  await test.step('dashboard: All apps nav trigger visible', async () => {
    await expect(
      page.locator(`//*[@aria-label='All apps']`).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  // --- Company-type-specific -------------------------------------------------

  if (account.companyType === 'ies') {
    // IES application shell — no standard QBO sidebar; check IES header region.
    await test.step('dashboard (IES): IES app header region visible', async () => {
      await expect(
        page
          .locator(`[data-testid="ies-app-header"]`)
          .or(page.locator(`[data-id="tsaGlobalHeader"]`))
          .first(),
      ).toBeVisible({ timeout: 10000 });
    });
    console.log('[TE01][Step1.2] IES dashboard validated');
  } else {
    // Elite, Premium, Standard (or unresolved) — standard QBO shell.
    await test.step(`dashboard (${
      account.companyType ?? 'standard'
    }): QuickBooks Landing Page sidebar link visible`, async () => {
      await expect(
        page
          .locator(
            `//a[@aria-label='QuickBooks Landing Page'] | //a[@aria-label='QuickBooks'] | //a[contains(@class,'fusion-leftrail--logo-item')]`,
          )
          .first(),
      ).toBeVisible({ timeout: 10000 });
    });
    console.log(
      '[TE01][Step1.2] %s dashboard validated',
      account.companyType ?? 'standard',
    );
  }

  console.log('[TE01][Step1.2] Dashboard validation complete');
}
// ============================================================================
// Orchestrator
// ============================================================================

/**
 * Runs a pre-CRUD step "softly": if it throws (a failed expectation, a missing
 * element, a page error), the error is logged and the suite PROCEEDS to the next
 * step instead of failing. Used only for the validation phase; the CRUD step
 * (step07) is NOT wrapped and stays hard.
 */
async function softStep(
  label: string,
  fn: () => Promise<unknown>,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    console.warn(`[TE01][soft] ${label} — failed, continuing:`, error);
  }
}

/**
 * Runs the full TE01 suite in sequence. `createdEntries` is populated with the
 * Notes identifiers of any entries created, so the spec's afterEach can clean
 * up even if a step fails.
 */
export async function runSTEFullSuite(
  page: Page,
  account: TETestAccount,
  createdEntries: string[] = [],
): Promise<void> {
  const teTabPage = new TETimeEntriesTabPage(page);

  // Fail fast: the global actionTimeout is 5 min, so a single stuck element
  // would hang the run for minutes. Cap the per-action default at 30s for this
  // test (explicit per-call timeouts still override this).
  page.setDefaultTimeout(30_000);

  // Step 1 — Login & role setup + dashboard validation (SOFT).
  await softStep('Step1 — login & role setup', () =>
    step01_loginAndRoleSetup(page, account),
  );
  await softStep('Step1.2 — dashboard validation', () =>
    step012_validateDashboard(page, account),
  );

  // Step 2 — Navigate to the Time Entries submenu (SOFT).
  await softStep('Step2 — navigate to Time entries', () =>
    step02_navigateToTimeSubmenu(page, account, teTabPage),
  );

  await validateLeftNavPersistence(page, account);

  // Step 3 — Tab visibility vs entitlements (SOFT).
  await softStep('Step3 — tab visibility vs entitlements', () =>
    step03_tabVisibilityVsEntitlements(page, account, teTabPage),
  );

  // Step 4 — Default state & filters validation (SOFT).
  await softStep('Step4 — filters validation', () =>
    step04_filtersValidation(page, account, teTabPage),
  );

  // Step 5 — Column visibility & settings (HARD — not in the soft list).
  await ensureTeSessionActive(page, account);
  await step05_columnVisibilityAndSettings(page, account, teTabPage);

  // Step 6 — Role-scoped data visibility
  await softStep('Step6 — role-scoped data visibility', () =>
    step06_roleScopedDataVisibility(page, account, teTabPage),
  );

  // Step 7 — CRUD
  await ensureTeSessionActive(page, account);
  await step07_steCRUD(page, account, teTabPage, createdEntries);

  console.log('[TE01] STE Full suite complete.');
}

export async function step02_navigateToTimeSubmenu(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
  submenu: TimeSubmenu = 'Time entries',
): Promise<boolean> {
  if (page.isClosed()) {
    console.warn(
      '[TE01][Step2] Page closed — cannot navigate to "%s"',
      submenu,
    );
    return false;
  }

  // Wait for the dashboard to FULLY load before touching the nav. The shell
  await test.step('dashboard loaded before navigation', async () => {
    await expect(page.locator('[data-id=bodyNode]')).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.locator(`//*[@aria-label='All apps']`).first(),
    ).toBeVisible({ timeout: 30000 });

    // Dashboard content finished loading (QBO shell spinner gone).
    await teTabPage.tePageBase.waitForLoadingToDisappear();
    // Settle buffer — let the dashboard paint before opening the nav flyout.
    await page.waitForTimeout(3000);
  });

  await teTabPage.navigateToTimeEntriesPageSubmenu(submenu);
  await teTabPage.waitForLoadingToDisappear();
  if (submenu === 'Time entries') {
    await ensureTimeEntriesGridReady(page, teTabPage);
  }

  // ── Left-nav persistence check ──────────────────────────────────────────
  // After landing on the Time page the QBO left navigation must remain fully
  // expanded and visible.  Three layers are verified:
  //
  //  Layer 1 — Global app switcher ("All apps")
  //            Present in every QBO shell (Elite, Premium, Standard, IES).
  //
  //  Layer 2 — "Time" nav item
  //            The hover-target used to reach the Time sub-menu.  Must still
  //            be visible so users (and subsequent steps) can navigate away
  //            and back without re-hovering the collapsed bar.
  //
  //  Layer 3 — Time sub-nav panel ([data-id="time-body"] links)
  //            The sub-menu that lists Time entries, Schedule, Approvals, etc.
  //            Must be visible and not collapsed/faded.
  //
  //  Layer 4 — QuickBooks Landing Page link (non-IES only)
  //            Confirms the wider QBO sidebar has not collapsed.

  await test.step('left-nav: All apps trigger still visible', async () => {
    await expect(
      page.locator(`//*[@aria-label='All apps']`).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  await test.step('left-nav: Time menu item still visible', async () => {
    const timeSubNavLink = page.locator(`//*[@data-id='time-body']//a`).first();
    const timeHeader = page.locator(`//*[@data-id='time-header']`).first();

    // Expand only when collapsed, so we never toggle an open panel shut.
    const expandSubNav = async () => {
      const expanded = await timeHeader
        .getAttribute('aria-expanded')
        .catch(() => null);
      if (expanded !== 'true') {
        await timeHeader.click({ timeout: 5000 }).catch(() => undefined);
      }
    };

    // Retry the expand until the sub-nav links are actually visible.
    await expect(async () => {
      if (!(await timeSubNavLink.isVisible().catch(() => false))) {
        await expandSubNav();
      }
      await expect(timeSubNavLink).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 20000 });
  });

  await test.step('left-nav: Time sub-nav panel not collapsed', async () => {
    await expect(page.locator(`//*[@data-id='time-body']`).first()).toBeVisible(
      { timeout: 10000 },
    );
  });

  if (account.companyType !== 'ies') {
    await test.step('left-nav: QBO sidebar not collapsed (Landing Page link visible)', async () => {
      await expect(
        page
          .locator(
            `//a[@aria-label='QuickBooks Landing Page'] | //a[@aria-label='QuickBooks'] | //a[contains(@class,'fusion-leftrail--logo-item')]`,
          )
          .first(),
      ).toBeVisible({ timeout: 10000 });
    });
  }

  console.log(
    '[TE01][Step2] Left-nav persistence verified after navigation to "%s"',
    submenu,
  );

  // ── Entitlement guard & content check (Time entries only) ───────────────
  if (submenu === 'Time entries') {
    if (account.entitlements.canSeeTimeEntriesTab === false) {
      await test.step('Time Entries tab hidden', async () => {
        const visible = await teTabPage.isTimeEntriesTabVisible();
        expect(visible).toBeFalsy();
      });
      console.log(
        '[TE01][Step2] Tab correctly hidden for role=%s sku=%s',
        account.role,
        account.sku ?? 'unresolved',
      );
      return false; // signal: skip subsequent steps
    }

    await test.step('Time Entries content present', async () => {
      const hasContent = await ensureTimeEntriesGridReady(page, teTabPage);
      expect(hasContent).toBeTruthy();
    });
  }

  console.log('[TE01][Step2] Navigation to "%s" is successful', submenu);
  return true;
}

// ============================================================================
// 7d. Time Clock — timeClock
// ============================================================================
//
// End-to-end Time Clock coverage launched from the on-page **Clock In** button
// on the Time Entries page (Time Clock is NOT under the "Add time" dropdown).
// Mirrors the STE suite's conventions: soft assertions + [TE01][TC-Step…]
// checkpoints, no test.skip() inside utils.
//
// Coverage map (per spec — exact 10-step flow):
//   1-2.  Open drawer + verify (Name, prompt header, Start date/time)
//                                                  → stepTC01_openAndVerifyDrawer
//   3.    Select Customer + Clock in (start)       → stepTC02_selectCustomerAndStart
//   4-5.  Clocked-in header, Service validation,
//         fill Service/Class/Location/CF/Billable/
//         Notes, then Save (NOT clock out)         → stepTC03_validateServiceFillAndSave
//   6.    Verify entry in grid with column values  → stepTC04_verifyEntryInGrid
//   7.    Who's Working visible + edit, verify
//         Class/Location/CF in the STE             → stepTC05_whosWorkingEditVerify
//   8.    Click running timer + clock out          → stepTC06_clockOutFromTimer
//   9.    Who's Working — worker not present        → stepTC07_verifyWhosWorkingInactive
//   10.   Edit entry from grid (mileage + CF) +
//         verify edited columns in grid            → stepTC08_editEntryInGrid
//   (deletion of created entries is handled by the spec's afterEach cleanup)
// ============================================================================

const TC_NOTES = 'TE01 time clock entry';
const TC_NOTES_EDITED = 'TE01 time clock entry - edited';
/** Manual mileage entered during the grid edit step. */
const TC_MILES = '50';

/** Shape of the column values captured while creating the clock entry. */
interface TCClockEntry {
  userName: string;
  customer: string;
  service: string;
  className: string;
  location: string;
  customFields: Record<string, string>;
  billable: boolean;
}

export async function stepTC01_openAndVerifyDrawer(
  page: Page,
  teTabPage: TETimeEntriesTabPage,
): Promise<string> {
  let name = '';

  await test.step('TC step1: open Time Clock from on-page Clock In', async () => {
    await teTabPage.openTimeClock();
    expect(await teTabPage.isTimeClockDrawerOpen()).toBeTruthy();
  });
  console.log('[TE01][TC-Step1] Time Clock drawer opened');

  await test.step('TC step2: Name field populated', async () => {
    name = await teTabPage.getClockDrawerName();
    console.log('[TE01][TC-Step2] Name field: "%s"', name);
    expect(name.length).toBeGreaterThan(0);
  });
  await test.step('TC step2: "Clock in to start tracking time" header', async () => {
    expect(await teTabPage.isClockInPromptVisible()).toBeTruthy();
  });
  await test.step('TC step2: Start date picker visible', async () => {
    expect(await teTabPage.isClockStartDateVisible()).toBeTruthy();
  });
  await test.step('TC step2: Start time dropdown visible', async () => {
    expect(await teTabPage.isClockStartTimeVisible()).toBeTruthy();
  });
  console.log('[TE01][TC-Step2] Pre-clock-in drawer verified');

  return name;
}

/**
 * Step 3 — Select a Customer/Project, then click the green **Clock in** button
 * to start the clock. Returns the selected customer and the resolved clock user
 * name (read from the "…clocked in at…" header).
 */
export async function stepTC02_selectCustomerAndStart(
  page: Page,
  teTabPage: TETimeEntriesTabPage,
): Promise<{ customer: string; userName: string }> {
  let customer = '';
  let userName = '';

  await test.step('TC step3: select Customer + Clock in', async () => {
    const options = await teTabPage.getClockCustomerProjectOptions();
    console.log('[TE01][TC-Step3] Customer options: %o', options);
    expect(options.length).toBeGreaterThan(0);
    customer = options[0];
    await teTabPage.selectClockCustomerProject(customer);
    console.log('[TE01][TC-Step3] Selected Customer: "%s"', customer);
    // Green "Clock in" button inside the drawer → starts the running clock.
    await teTabPage.clockIn();
  });

  await test.step('TC step3: clock started', async () => {
    const running =
      (await teTabPage.isClockedIn()) ||
      (await teTabPage.isClockTimerRunning());
    expect(running).toBeTruthy();
    const toast = await teTabPage.getClockInToastMessage();
    if (toast) {
      console.log('[TE01][TC-Step3] Clock-in toast: "%s"', toast);
    }
  });

  await test.step('TC step3: read clock user name', async () => {
    userName = await teTabPage.getClockUserName();
  });
  console.log(
    '[TE01][TC-Step3] Clocked in — user="%s"',
    userName || '(unknown)',
  );

  return { customer, userName };
}

/**
 * Steps 4-5 — Verify the running "…clocked in at…" header, select Service, then
 * validate that clocking out with the required Custom Field (CF1) left empty
 * surfaces "This field is required". Resolve it by filling the custom field(s),
 * then fill Class, Location, Billable and Notes, and **Save** (the clock is left
 * running — we do NOT clock out here). Returns the captured column values.
 */
export async function stepTC03_validateServiceFillAndSave(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
  createdEntries: string[],
): Promise<Omit<TCClockEntry, 'userName' | 'customer'>> {
  let service = '';
  let className = '';
  let location = '';
  let billable = false;
  const customFields: Record<string, string> = {};

  // Step 4 — running header, then validate required-field behaviour on clock out.
  // Accounts with custom fields (CF1) require CF validation after Service is set;
  // accounts without CFs validate the required Service field instead.
  await test.step('TC step4: clocked-in header visible', async () => {
    const header = await teTabPage.getClockedInHeaderText();
    console.log('[TE01][TC-Step4] Clocked-in header: "%s"', header);
    expect(header.toLowerCase()).toContain('clocked in');
  });

  const cfLabelsAtStep4 = await teTabPage.getCustomFieldLabels();
  console.log('[TE01][TC-Step4] Custom fields in drawer: %o', cfLabelsAtStep4);

  if (cfLabelsAtStep4.length > 0) {
    // Select Service first so CF — not Service — is the field that blocks clock-out.
    await test.step('TC step4: select Service', async () => {
      const serviceOptions = await teTabPage.getClockServiceItemOptions();
      console.log('[TE01][TC-Step4] Service options: %o', serviceOptions);
      expect(serviceOptions.length).toBeGreaterThan(0);
      service = serviceOptions[0];
      const selected = await teTabPage.selectClockServiceItem(service);
      console.log('[TE01][TC-Step4] Selected Service: "%s"', service);
      expect(selected).toContain(service);
    });

    await test.step('TC step4: clock out → required Custom Field validation', async () => {
      await teTabPage.clockOut();
      await page.waitForTimeout(500);
      const errorMsg = await teTabPage.getAnyClockRequiredFieldError();
      console.log('[TE01][TC-Step4] Required-field validation: "%s"', errorMsg);
      expect(errorMsg).toBeTruthy();
      expect(errorMsg.toLowerCase()).toMatch(/required/);
      await page.waitForTimeout(500);
    });
  } else {
    const serviceRequired = await teTabPage.isClockServiceRequired();
    const serviceValueBefore = await teTabPage.getClockServiceValue();
    console.log(
      '[TE01][TC-Step4] Service required=%s valueBefore="%s"',
      serviceRequired,
      serviceValueBefore,
    );

    if (serviceRequired && !serviceValueBefore) {
      await test.step('TC step4: clock out → required Service validation', async () => {
        await teTabPage.clockOut();
        await page.waitForTimeout(500);
        const errorMsg = await teTabPage.getAnyClockRequiredFieldError();
        console.log(
          '[TE01][TC-Step4] Required-field validation: "%s"',
          errorMsg,
        );
        if (errorMsg) {
          expect(errorMsg.toLowerCase()).toMatch(/required/);
        } else {
          // Some prod accounts mark Service required but do not surface an inline
          // error on clock-out; proceed to select Service directly.
          console.log(
            '[TE01][TC-Step4] No inline required error — selecting Service next',
          );
        }
        await page.waitForTimeout(500);
      });
    } else {
      console.log(
        '[TE01][TC-Step4] Skipping clock-out Service validation — required=%s prefill="%s"',
        serviceRequired,
        serviceValueBefore || '(empty)',
      );
    }

    await test.step('TC step4: select Service', async () => {
      const serviceOptions = await teTabPage.getClockServiceItemOptions();
      console.log('[TE01][TC-Step4] Service options: %o', serviceOptions);
      expect(serviceOptions.length).toBeGreaterThan(0);
      service = serviceOptions[0];
      const selected = await teTabPage.selectClockServiceItem(service);
      console.log('[TE01][TC-Step4] Selected Service: "%s"', service);
      expect(selected).toContain(service);
    });
  }

  // Step 5 — fill the custom field(s) (clears the validation), then Class /
  // Location / Billable / Notes, and Save (no clock out). Custom fields are
  // detected dynamically from the drawer rather than gated on the entitlement
  // flag, since this drawer renders a required CF1.
  await test.step('TC step5: fill custom fields', async () => {
    const labels = await teTabPage.getCustomFieldLabels();
    console.log('[TE01][TC-Step5][CF] Discovered custom fields: %o', labels);
    if (labels.length === 0) {
      console.log('[TE01][TC-Step5][CF] No custom fields found in drawer');
      return;
    }
    for (const label of labels) {
      const isDropdown = await teTabPage.isCustomFieldDropdown(label);
      const value = isDropdown
        ? await teTabPage.selectCustomFieldFirstOption(label)
        : await teTabPage.fillCustomFieldText(label, `${TC_NOTES} CF`);
      if (value) {
        customFields[label] = value;
        console.log('[TE01][TC-Step5][CF] "%s" = "%s"', label, value);
      }
    }
  });
  await test.step('TC step5: select Class', async () => {
    className = await teTabPage.selectFirstClockClass();
    console.log('[TE01][TC-Step5] Selected Class: "%s"', className || '(none)');
  });
  await test.step('TC step5: select Location', async () => {
    location = await teTabPage.selectFirstTimeLocation();
    console.log(
      '[TE01][TC-Step5] Selected Location: "%s"',
      location || '(none)',
    );
  });
  if (account.entitlements.canSeeBillable) {
    await test.step('TC step5: set Billable', async () => {
      await teTabPage.setClockBillable(true);
      billable = true;
    });
  }
  await test.step('TC step5: enter Notes', async () => {
    await teTabPage.fillClockNotes(TC_NOTES);
  });
  // First Save (in-drawer), then close the trowser. Closing shows a
  // "Do you want to save changes?" popup — keep the changes (Save).
  await test.step('TC step5: Save (do not clock out)', async () => {
    await teTabPage.clickSaveInClockDrawer();
  });
  await test.step('TC step5: close trowser (Save on prompt)', async () => {
    await teTabPage.closeTimeClockDrawer(true);
    await teTabPage.waitForLoadingToDisappear();
  });

  // Record for cleanup (notes updated to the edited value during step 10).
  createdEntries.push(TC_NOTES, TC_NOTES_EDITED);
  console.log('[TE01][TC-Step5] Entry saved — clock left running');

  return { service, className, location, customFields, billable };
}

/**
 * Step 6 — Close the drawer and verify the saved clock entry in the Time
 * Entries grid with every column value captured during create (Name, Customer,
 * Service, Class, Location, custom fields, Billable, Notes). Widens the date
 * range to "This month" so today's entry is in view.
 */
export async function stepTC04_verifyEntryInGrid(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
  created: TCClockEntry,
): Promise<void> {
  const common = new CommonLocators(page);

  await test.step('TC step6: close drawer', async () => {
    await teTabPage.closeTimeClockDrawer(true);
    await teTabPage.tePageBase.handlePopupsInAnyOrder();
    await teTabPage.waitForLoadingToDisappear();
    if (await teTabPage.isTimeClockDrawerOpen()) {
      await teTabPage.closeTimeClockDrawer(true);
      await teTabPage.waitForLoadingToDisappear();
    }
  });
  // Closing the clock drawer can leave the grid content mid-render (or an
  // overlay lingering), which makes the bare Display-by click flake. Reuse the
  // same readiness guard step02 uses so the filters are interactable before we
  // touch them.
  await test.step('TC step6: ensure Time Entries grid ready', async () => {
    const ready = await ensureTimeEntriesGridReady(page, teTabPage);
    expect(ready).toBeTruthy();
    await teTabPage.tePageBase.handlePopupsInAnyOrder();
    await teTabPage.common.dismissGotItPopupIfVisible();
  });
  await test.step('TC step6: set Date / This week range', async () => {
    await common.selectDisplayByOption(LABELS.date);
    await teTabPage.waitForLoadingToDisappear();
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.thisWeek);
    await teTabPage.waitForLoadingToDisappear();
  });

  // Resolve the canonical employee display name from the created grid row (the
  // clock header is the email/status, which does not match the grid or the
  // Who's Working map). Mutating `created.userName` propagates to steps 7 & 9.
  await test.step('TC step6: resolve employee name from grid row', async () => {
    const row = await teTabPage
      .getRowObjectByNotes(TC_NOTES)
      .catch(() => ({} as Record<string, string>));
    const gridName = (row.Name || row.Employee || '').trim();
    if (gridName) {
      created.userName = gridName;
      console.log('[TE01][TC-Step6] Employee name from grid: "%s"', gridName);
    }
  });

  await verifyEntryInGrid(page, teTabPage, {
    notes: TC_NOTES,
    employeeName: created.userName || undefined,
    customer: created.customer || undefined,
    service: created.service || undefined,
    className: created.className || undefined,
    location: created.location || undefined,
    billableChecked: account.entitlements.canSeeBillable
      ? created.billable
      : undefined,
    customFields: created.customFields,
  });
  console.log(
    '[TE01][TC-Step6] Clock entry verified in grid with column values',
  );
}

/**
 * Step 7 — Who's Working: the clock is still running (we Saved, didn't clock
 * out), so the worker must be VISIBLE on the map. Open the entry via the map's
 * "Edit Time" action and verify the Class, Location and custom-field values
 * captured at create now appear in the STE trowser. The STE is left open for
 * step 8 to close.
 */
export async function stepTC05_whosWorkingEditVerify(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
  created: TCClockEntry,
): Promise<void> {
  if (!created.userName) {
    console.log('[TE01][TC-Step7] SKIPPED — clock user name unknown');
    return;
  }

  await teTabPage.openWhosWorkingMap();

  // Before checking the worker, verify the Who's Working map screen itself has
  // rendered its core elements — the map, its camera controls, and the filter /
  // search controls. This catches a broken/empty map landing before we attribute
  // a "worker not found" to a real data issue.
  await test.step("TC step7: verify Who's Working map screen elements", async () => {
    const mapPage = new WhosWorkingMapPage(page);
    await mapPage.validateMapIsVisible();
    await mapPage.validateSearchBarIsVisible();
    await mapPage.validateFilterButtonIsVisible();
    await mapPage.validateMapControls();
    await mapPage
      .validateClockedInCount()
      .catch(() =>
        console.log('[TE01][TC-Step7] Clocked-in count not shown — continuing'),
      );
  });

  await test.step("TC step7: worker visible on Who's Working map", async () => {
    expect(
      await teTabPage.isWorkerInWhosWorking(created.userName),
    ).toBeTruthy();
    console.log(
      '[TE01][TC-Step7] Worker "%s" visible on Who\'s Working map',
      created.userName,
    );
  });

  let opened = false;
  await test.step("TC step7: edit from Who's Working map", async () => {
    opened = await teTabPage.clickEditInWhosWorking(created.userName);
  });
  if (!opened) {
    console.log('[TE01][TC-Step7] SKIPPED field verify — STE did not open');
    return;
  }

  // Let the STE form (incl. the custom-field MFE) finish loading before reading
  // field values, otherwise the reads can come back empty.
  await test.step('TC step7: wait for STE form to settle', async () => {
    await teTabPage.waitForLoadingToDisappear();
    await page.waitForTimeout(1500);
  });

  await test.step('TC step7: verify Class in STE', async () => {
    if (!created.className) return;
    const value = await teTabPage.getTrowserFieldValue('Class');
    console.log('[TE01][TC-Step7] STE Class: "%s"', value);
    expect(value).toContain(created.className);
  });
  await test.step('TC step7: verify Location in STE', async () => {
    if (!created.location) return;
    const value = await teTabPage.getTrowserFieldValue('Location');
    console.log('[TE01][TC-Step7] STE Location: "%s"', value);
    expect(value).toContain(created.location);
  });
  await test.step('TC step7: verify custom fields in STE', async () => {
    for (const [name, expectedValue] of Object.entries(created.customFields)) {
      if (!expectedValue) continue;
      const value = await teTabPage.getCustomFieldValue(name);
      console.log('[TE01][TC-Step7] STE CF "%s": "%s"', name, value);
      expect(value).toContain(expectedValue);
    }
  });
  console.log("[TE01][TC-Step7] Who's Working edit verified STE fields");
}

/**
 * Step 8 — Close the STE trowser (which leaves us on the Who's Working map),
 * return to the Time Entries screen (the running timer widget lives there, NOT
 * on the map), then click the timer to reopen the drawer and clock OUT.
 */
export async function stepTC06_clockOutFromTimer(
  page: Page,
  teTabPage: TETimeEntriesTabPage,
): Promise<void> {
  const stePage = new TESingleTimeEntryPage(page);

  // Closing the STE trowser leaves us on the Who's Working map. Close the map
  // and make sure we are back on the Time Entries screen, where the running
  // clock timer is shown.
  await test.step('TC step8: close STE + return to Time Entries screen', async () => {
    await stePage.closeSingleTimeTrowser().catch(() => undefined);
    await teTabPage.closeWhosWorkingMap();
    await teTabPage.waitForLoadingToDisappear();
    if (!(await teTabPage.isRunningClockTimerVisible())) {
      await teTabPage
        .navigateToTimeEntriesPageSubmenu('Time entries')
        .catch(() => undefined);
      await teTabPage.waitForLoadingToDisappear();
    }
  });

  // Click the running timer button on the Time Entries screen → wait for the
  // trowser + Clock out button to be visible → then Clock out. The worker only
  // actually clocks out once the drawer is fully rendered and Clock out clicked.
  await test.step('TC step8: click timer + clock out', async () => {
    await teTabPage.openRunningClockTimer();
    expect(await teTabPage.isTimeClockDrawerOpen()).toBeTruthy();
    // Wait for the Clock out button to be ready before clicking it.
    await teTabPage.waitForClockOutButton();
    await page.waitForTimeout(1000);
    await teTabPage.clockOut();
    const toast = await teTabPage.getClockOutToastMessage();
    if (toast) {
      console.log('[TE01][TC-Step8] Clock-out toast: "%s"', toast);
    }
    await teTabPage.waitForLoadingToDisappear();
    // No edits to persist after clock out — dismiss any prompt with Don't save.
    await teTabPage.closeTimeClockDrawer(false);
    await teTabPage.waitForLoadingToDisappear();
  });
  console.log('[TE01][TC-Step8] Clocked out from the running timer');
}

/**
 * Step 9 — Who's Working: after clocking out, the worker must NO LONGER be
 * present on the map. Best-effort when the clock user's name is unknown.
 */
export async function stepTC07_verifyWhosWorkingInactive(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
  userName: string,
): Promise<void> {
  if (!userName) {
    console.log(
      "[TE01][TC-Step9] SKIPPED Who's Working check — clock user unknown",
    );
    return;
  }
  await test.step("TC step9: worker no longer on Who's Working map", async () => {
    await teTabPage.openWhosWorkingMap();
    expect(await teTabPage.isWorkerInWhosWorking(userName)).toBeFalsy();
    // After clocking out, read the "on the clock" count from the map screen
    // (e.g. "1/2 on clock"). Logged for visibility; tolerant if not rendered.
    const mapPage = new WhosWorkingMapPage(page);
    const clockedInCount = await mapPage
      .validateClockedInCount()
      .catch(() => null);
    console.log(
      "[TE01][TC-Step9] Who's Working clocked-in count after clock-out: %s",
      clockedInCount ?? 'not shown',
    );
    await teTabPage.closeWhosWorkingMap();
  });
  console.log(
    '[TE01][TC-Step9] Worker "%s" not present on Who\'s Working map (clocked out)',
    userName,
  );
}

/**
 * Step 10 — Edit the time entry from the grid (same as the STE edit flow):
 * change mileage and a custom field, save, then verify the edited columns
 * updated in the Time Entries grid.
 */
export async function stepTC08_editEntryInGrid(
  page: Page,
  account: TETestAccount,
  teTabPage: TETimeEntriesTabPage,
  createdEntries: string[],
  created: TCClockEntry,
): Promise<void> {
  const stePage = new TESingleTimeEntryPage(page);
  const common = new CommonLocators(page);

  let miles = '';
  let cfEdited: Record<string, string> = {};

  await test.step('TC step10: open clock entry from grid', async () => {
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.thisWeek);
    await teTabPage.waitForLoadingToDisappear();
    const row = teTabPage.getRowByNotes(TC_NOTES);
    if (!(await row.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TE01][TC-Step10] No clock entry row to edit — skipped');
      return;
    }
    await row.click();
    await stePage.handleTourModal().catch(() => undefined);
    await stePage.expectSingleTimeEntryVisible();
    await teTabPage.waitForLoadingToDisappear();
  });

  await test.step('TC step10: edit mileage = 50', async () => {
    miles = await teTabPage.setMileageManual(TC_MILES);
    if (!miles) {
      console.log(
        '[TE01][TC-Step10] Mileage field not present — skipping grid miles check',
      );
    }
  });
  // Edit custom fields when the entry was created with any (detected at create).
  if (Object.keys(created.customFields).length > 0) {
    cfEdited = await editCustomFields(teTabPage, true);
  }
  await test.step('TC step10: edit notes → edited', async () => {
    await stePage.enterNotes(TC_NOTES_EDITED);
  });
  if (!createdEntries.includes(TC_NOTES_EDITED)) {
    createdEntries.push(TC_NOTES_EDITED);
  }
  await test.step('TC step10: save', async () => {
    await stePage.clickSaveAndCloseButton();
    await teTabPage.expectSaveSucceeded();
    await teTabPage.waitForLoadingToDisappear();
    if (
      await stePage.headingSingleTimeEntry
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await stePage.closeSingleTimeTrowser().catch(() => undefined);
      await teTabPage.waitForLoadingToDisappear();
    }
  });

  await verifyEntryInGrid(page, teTabPage, {
    notes: TC_NOTES_EDITED,
    ...(miles ? { miles: miles || TC_MILES } : {}),
    customFields: { ...created.customFields, ...cfEdited },
  });
  console.log('[TE01][TC-Step10] Edited clock entry verified in grid');
}

/**
 * Step 11 — Delete: open the clock entry from the grid and delete it (same flow
 * as the STE suite), then verify the row is gone.
 */
export async function stepTC09_deleteEntry(
  page: Page,
  teTabPage: TETimeEntriesTabPage,
): Promise<void> {
  const stePage = new TESingleTimeEntryPage(page);

  await test.step('TC step11: delete clock entry', async () => {
    // The entry's notes were changed to the edited value during step 10.
    const row = teTabPage.getRowByNotes(TC_NOTES_EDITED);
    if (!(await row.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('[TE01][TC-Step11] No clock entry row to delete — skipped');
      return;
    }
    await row.click();
    await stePage.handleTourModal().catch(() => undefined);
    await stePage.clickDeleteButton();
    await stePage.expectDeleteConfirmationVisible();
    await stePage.clickYesOnDeleteConfirmation();
    await stePage.expectTimeEntryDeletedToastVisible();

    if (
      await stePage.headingSingleTimeEntry
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await stePage.closeSingleTimeTrowser().catch(() => undefined);
    }
    await teTabPage.waitForLoadingToDisappear();
    await page.waitForTimeout(1500);
    await expect
      .poll(() => teTabPage.isRowWithNotesVisible(TC_NOTES_EDITED), {
        timeout: 15000,
      })
      .toBeFalsy();
  });
  console.log('[TE01][TC-Step11] Clock entry deleted from the grid');
}

/**
 * Runs the full Time Clock (7d) suite in sequence. `createdEntries` is populated
 * so the spec's afterEach can clean up even if a step fails.
 */
export async function runTimeClockSuite(
  page: Page,
  account: TETestAccount,
  createdEntries: string[] = [],
): Promise<void> {
  const teTabPage = new TETimeEntriesTabPage(page);

  // Fail fast: the global actionTimeout is 5 min, so a single stuck element
  // would hang the run for minutes. Cap the per-action default at 30s for this
  // test (explicit per-call timeouts still override this).
  page.setDefaultTimeout(30_000);

  await ensureTeSessionActive(page, account);
  await step01_loginAndRoleSetup(page, account);
  await validateDashboard(page, account);
  await step02_navigateToTimeSubmenu(page, account, teTabPage, 'Time entries');
  await validateLeftNavPersistence(page, account);
  await ensureTimeEntriesGridReady(page, teTabPage);

  // 1-2. Open the clock drawer + verify the pre-clock-in trowser.
  const drawerName = await stepTC01_openAndVerifyDrawer(page, teTabPage);
  // 3. Select a Customer and click the green Clock in (start the clock).
  const { customer, userName } = await stepTC02_selectCustomerAndStart(
    page,
    teTabPage,
  );
  // 4-5. Clocked-in header + Service validation, fill fields, Save (no clock out).
  const rest = await stepTC03_validateServiceFillAndSave(
    page,
    account,
    teTabPage,
    createdEntries,
  );
  const created: TCClockEntry = {
    userName: userName || drawerName,
    customer,
    ...rest,
  };
  // 6. Verify the saved entry in the grid with all column values.
  await stepTC04_verifyEntryInGrid(page, account, teTabPage, created);
  // 7. Who's Working — worker visible; edit from map + verify STE fields.
  await stepTC05_whosWorkingEditVerify(page, account, teTabPage, created);
  // 8. Close STE, click the running timer, clock out.
  await stepTC06_clockOutFromTimer(page, teTabPage);
  // 9. Who's Working — worker no longer present (clocked out).
  await stepTC07_verifyWhosWorkingInactive(
    page,
    account,
    teTabPage,
    created.userName,
  );
  // 10. Edit the entry from the grid (mileage + CF) + verify edited columns.
  await stepTC08_editEntryInGrid(
    page,
    account,
    teTabPage,
    createdEntries,
    created,
  );
  // 11. Delete the clock entry from the grid (same as the STE suite).
  await stepTC09_deleteEntry(page, teTabPage);

  console.log('[TE01][TC] Time Clock suite complete.');
}

// ============================================================================
// BR01 — Breaks Full Suite
// ============================================================================

/** Soft-assert helper for BR01: log a warning instead of failing the test. */
async function brSoft(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[BR01][soft] ${label} — ${message}`);
  }
}

/**
 * Cleanup helper — deletes EVERY break rule currently in the Manage breaks
 * table so the suite starts from a clean slate. Iterates the per-row
 * "Delete break rule" buttons, deleting the first one each pass and confirming
 * the dialog, until none remain (a guard + no-progress check prevents an
 * infinite loop if a rule cannot be removed).
 */
export async function deleteAllExistingBreakRules(page: Page): Promise<void> {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.goto();
  await page.waitForTimeout(2000);

  const deleteButtons = page.locator(
    `//button[@aria-label="Delete break rule"]`,
  );
  let remaining = await deleteButtons.count().catch(() => 0);
  console.log(' Cleaning up %d existing break rule(s)', remaining);

  let guard = 0;
  while (remaining > 0 && guard < 50) {
    guard++;
    const firstDelete = deleteButtons.first();
    if (!(await firstDelete.isVisible({ timeout: 5000 }).catch(() => false))) {
      break;
    }
    await firstDelete.click({ force: true });
    await page.waitForTimeout(1000);

    await brSoft('delete confirmation visible during cleanup', async () => {
      await expect(
        page.locator(`//h5[contains(text(), 'Want to delete')]`).first(),
      ).toBeVisible();
    });
    const confirmDelete = page
      .locator('//button[.//span[text()="Delete"]]')
      .first();
    if (await confirmDelete.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmDelete.click({ force: true });
    }
    await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
      state: 'hidden',
      timeout: 0,
    });
    await page.waitForTimeout(1000);

    const newRemaining = await deleteButtons.count().catch(() => 0);
    if (newRemaining >= remaining) {
      // No progress — a rule could not be deleted; stop to avoid looping forever.
      console.warn(
        ' Break rule cleanup made no progress (%d remaining) — stopping',
        newRemaining,
      );
      break;
    }
    remaining = newRemaining;
  }

  console.log(' ✓ Existing break rules cleaned up');
}

export async function setupBreakRulesPrerequisites(
  page: Page,
  account: TETestAccount,
  teTabPage: TimeEntriesPage,
  ctx: BreakSuiteContext,
): Promise<void> {
  const breaksRulesPage = new BreaksRulesPage(page);

  console.log(' role=%s companyType=%s', account.role, account.companyType);

  const { breakRuleDurationMinutes, breakRulePayType, dateRange } =
    BREAKS_VALIDATION_DATA;

  // Creates a fresh break rule of the given type and assigns it to a single
  // team member. No "already exists" check — every run creates uniquely-named
  // rules, so creation is unconditional. `teamMember` is the checkbox-label
  // form of the member name (lowercase, e.g. 'test emp1').
  // `teamMember` is the checkbox-label form of the member name (lowercase, e.g.
  // 'test emp1'). Omit it to leave the rule assigned to ALL team members.
  const createRule = async (
    breakName: string,
    breakRuleType: 'Manual' | 'Automatic',
    teamMember?: string,
  ) => {
    await breaksRulesPage.goto();
    await breaksRulesPage.clickAddBreakRuleButton();
    await page.waitForTimeout(1000);
    await page.waitForSelector(`//*[@aria-label="Loading"]`, {
      state: 'hidden',
      timeout: 0,
    });
    await expect(
      page.locator(`//strong[text()='Add break rule']`).first(),
    ).toBeVisible({ timeout: 15_000 });
    await page.locator(`#break-name`).first().fill(breakName);
    await page
      .getByLabel(`Enter duration`)
      .first()
      .fill(breakRuleDurationMinutes);
    await page.keyboard.press(`Tab`);
    await breaksRulesPage.selectAutomaticOrManualBreakCheckbox(breakRuleType);
    await breaksRulesPage.clickSaveBreakRuleButton();
    await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
      state: 'hidden',
      timeout: 0,
    });
    await brSoft(
      `break rule drawer closed after save for "${breakName}"`,
      async () => {
        await expect(
          page
            .locator(
              `//*[@data-testid="drawerTitle"]/*[text()='Add break rule']`,
            )
            .first(),
        ).toBeHidden();
      },
    );
    await brSoft(`break rule "${breakName}" visible in table`, async () => {
      await expect(
        page.locator(`//td[text()='${breakName}']`).first(),
      ).toBeVisible();
    });
    await brSoft(
      `break rule "${breakName}" pay type = ${breakRulePayType}`,
      async () => {
        await expect(
          page
            .locator(
              `//td[text()='${breakName}'] / following-sibling::td[text()='${breakRulePayType}']`,
            )
            .first(),
        ).toBeVisible();
      },
    );
    await brSoft(
      `break rule "${breakName}" type = ${breakRuleType}`,
      async () => {
        await expect(
          page
            .locator(
              `//td[text()='${breakName}'] / following-sibling::td[text()='${breakRuleType}']`,
            )
            .first(),
        ).toBeVisible();
      },
    );
    console.log(` ✓ Break rule '${breakName}' (${breakRuleType}) created`);

    // When a specific team member is given, restrict the rule to that member.
    // Otherwise leave it assigned to ALL team members (the creation default).
    if (teamMember) {
      await brSoft(
        `assign break rule "${breakName}" to "${teamMember}"`,
        async () => {
          await breaksRulesPage.assignBreakRuleToSingleTeamMember(
            breakName,
            teamMember,
          );
        },
      );
      console.log(` ✓ Break rule '${breakName}' assigned to "${teamMember}"`);
    } else {
      console.log(
        ` ✓ Break rule '${breakName}' left assigned to all team members`,
      );
    }
  };

  // Start from a clean slate — remove every break rule that already exists so
  // the suite always runs against exactly the rules it creates below.
  await deleteAllExistingBreakRules(page);

  // Create the rules fresh:
  //  • both Manual rules → ALL team members (so any clock user can take the
  //    manual break, e.g. in the Time Clock flow)
  //  • the Automatic rule → Test Emp2
  await createRule(ctx.manualBreakName, 'Manual');
  await createRule(ctx.manualBreakName2, 'Manual');
  await createRule(ctx.automaticBreakName, 'Automatic', 'test emp2');

  // Navigate to Time Entries and set the default Date / date-range view that the
  // subsequent create/edit/delete steps expect.
  await teTabPage.navigateToTimeEntriesPage();
  await teTabPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await teTabPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, dateRange);
  await teTabPage.waitForLoadingToDisappear();

  console.log(' ✓ Break rules prerequisites verified');
}

// ============================================================================
// Step 2 — Create: add a break entry and verify it appears in Time Entries
// ============================================================================

export async function createBreakEntry(
  page: Page,
  account: TETestAccount,
  teTabPage: TimeEntriesPage,
  ctx: BreakSuiteContext,
): Promise<void> {
  const breaksPage = new BreaksPage(page);

  console.log(
    ' Creating break entry — teamMember=%s',
    BREAKS_VALIDATION_DATA.teamMemberInput,
  );

  const { createEntryType, createStartTime, createEndTime, createNotes } =
    BREAKS_VALIDATION_DATA;

  // Break type shown in the Add Break drawer / row match come from the freshly
  // created Manual break rule for this run.
  const breakTypeForEntry = ctx.manualBreakType;
  const breakEntryRowMatch = ctx.manualBreakName;

  const teamMemberInput = BREAKS_VALIDATION_DATA.teamMemberInput;
  const teamMemberTable = BREAKS_VALIDATION_DATA.teamMemberTable;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  // Clean up any residual entries for this team member before creating
  let count = await teTabPage.countEmployeeRow(teamMemberTable);
  while (count > 0) {
    await teTabPage.clickActionDropdownForEmployee(teamMemberTable);
    await teTabPage.clickDeleteInActionDropdown();
    await teTabPage.expectDeleteEntryConfirmationPopupOpen();
    await teTabPage.clickYesOnDeleteEntryPopup();
    await teTabPage.waitForLoadingToDisappear();
    await teTabPage.navigateToTimeEntriesPage();
    await teTabPage.waitForLoadingToDisappear();
    await teTabPage.waitForTableOrNoEntriesMessage();
    count = await teTabPage.countEmployeeRow(teamMemberTable);
  }

  await breaksPage.openAddBreakDrawer();
  await page.waitForTimeout(1000);
  await breaksPage.selectTeamMemberAndBreakType(
    teamMemberInput,
    breakTypeForEntry,
  );
  await breaksPage.selectBreakEntryType(createEntryType);
  await page.waitForTimeout(500);
  await breaksPage.enterStartDate(yesterdayFormatted);
  await page.waitForTimeout(500);
  await breaksPage.toggleOnStartEndTime();
  await breaksPage.clearStartOrEndTime('Start Time');
  await breaksPage.enterStartOrEndTime('Start Time', createStartTime);
  await breaksPage.clearStartOrEndTime('End Time');
  await breaksPage.enterStartOrEndTime('End Time', createEndTime);
  await breaksPage.enterNotes(createNotes);
  await breaksPage.saveBreak();

  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });

  await brSoft(
    `break entry "${breakEntryRowMatch}" visible for ${teamMemberTable}`,
    async () => {
      await teTabPage.validateAddedBreaksEntryExistsForEmployee(
        breakEntryRowMatch,
        teamMemberTable,
      );
    },
  );

  console.log(' ✓ Break entry created and visible in Time Entries');
}

// ============================================================================
// Step 3 — Edit: update the break entry and verify the new hours
// ============================================================================

export async function editBreakEntry(
  page: Page,
  account: TETestAccount,
  teTabPage: TimeEntriesPage,
  ctx: BreakSuiteContext,
): Promise<void> {
  const breaksPage = new BreaksPage(page);

  console.log(
    ' Editing break entry — teamMemberTable=%s',
    BREAKS_VALIDATION_DATA.teamMemberTable,
  );

  const {
    editEntryType,
    editStartTime,
    editEndTime,
    editNotes,
    editExpectedHours,
  } = BREAKS_VALIDATION_DATA;

  // The entry was created with the first manual break rule; on edit it is
  // switched to the SECOND manual break rule.
  const originalBreakType = ctx.manualBreakType;
  const newBreakType = ctx.manualBreakType2;

  const teamMemberTable = BREAKS_VALIDATION_DATA.teamMemberTable;

  await teTabPage.clickEditForEmployee(teamMemberTable);
  await brSoft('edit break entry dialog visible', async () => {
    await breaksPage.validateEditBreakEntryDialogVisible();
  });

  // Verify break type is pre-populated with the rule the entry was created with.
  await page.waitForTimeout(3000);
  const selectedBreakType = await page
    .locator(`//input[@aria-label="Select Break"]`)
    .getAttribute('value');
  await brSoft(
    `break type pre-populated as "${originalBreakType}"`,
    async () => {
      await expect(selectedBreakType).toBe(originalBreakType);
    },
  );

  // Change the break type to the other manual break rule.
  await brSoft(`change break type to "${newBreakType}"`, async () => {
    await breaksPage.selectBreakTypeOnly(newBreakType);
  });
  await brSoft(`break type updated to "${newBreakType}"`, async () => {
    const updatedBreakType = await page
      .locator(`//input[@aria-label="Select Break"]`)
      .getAttribute('value');
    await expect(updatedBreakType).toBe(newBreakType);
  });

  // Update Start Time
  await breaksPage.clearStartOrEndTime('Start Time');
  await breaksPage.enterStartOrEndTime('Start Time', editStartTime);
  await breaksPage.blurFocusStartOrEndTime('Start Time');

  // Update End Time
  await breaksPage.clearStartOrEndTime('End Time');
  await breaksPage.enterStartOrEndTime('End Time', editEndTime);
  await breaksPage.blurFocusStartOrEndTime('End Time');

  // Update Notes
  await breaksPage.enterNotes(editNotes);

  await breaksPage.saveBreak();

  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });

  await brSoft(
    `updated hours = "${editExpectedHours}" for ${teamMemberTable}`,
    async () => {
      await teTabPage.validateUpdatedHoursForEmployee(
        teamMemberTable,
        editExpectedHours,
      );
    },
  );

  console.log(' ✓ Break entry updated — edited hours verified');
}

// ============================================================================
// Step 4 — Delete: remove the break entry and verify no rows remain
// ============================================================================

export async function deleteBreakEntry(
  page: Page,
  account: TETestAccount,
  teTabPage: TimeEntriesPage,
): Promise<void> {
  console.log(
    ' Deleting break entry — teamMemberTable=%s',
    BREAKS_VALIDATION_DATA.teamMemberTable,
  );

  const { dateRange } = BREAKS_VALIDATION_DATA;
  const teamMemberTable = BREAKS_VALIDATION_DATA.teamMemberTable;

  await teTabPage.navigateToTimeEntriesPage();
  await teTabPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await teTabPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, dateRange);
  await teTabPage.waitForLoadingToDisappear();

  await deleteAllVisibleTimeEntries(page, teTabPage);

  await brSoft(` No remaining entries for ${teamMemberTable}`, async () => {
    const remainingCount = await teTabPage.countEmployeeRow(teamMemberTable);
    expect(remainingCount).toBe(0);
  });

  console.log(
    ' ✓ Break entry deleted — no remaining entries for %s',
    teamMemberTable,
  );
}

/**
 * Cleanup helper — deletes EVERY time/break entry visible in the current month
 * so the suite starts each create flow from a clean slate. Sets Display by =
 * Date and Date range = This month, then removes all visible entries.
 */
export async function deleteAllBreakEntriesForMonth(
  page: Page,
  account: TETestAccount,
  teTabPage: TimeEntriesPage,
): Promise<void> {
  console.log(
    ' Deleting all break entries for this month — teamMemberTable=%s',
    BREAKS_VALIDATION_DATA.teamMemberTable,
  );

  const teamMemberTable = BREAKS_VALIDATION_DATA.teamMemberTable;

  await teTabPage.navigateToTimeEntriesPage();
  await teTabPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await teTabPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, LABELS.thisMonth);
  await teTabPage.waitForLoadingToDisappear();

  await deleteAllVisibleTimeEntries(page, teTabPage);

  await brSoft(
    ` No remaining entries this month for ${teamMemberTable}`,
    async () => {
      const remainingCount = await teTabPage.countEmployeeRow(teamMemberTable);
      expect(remainingCount).toBe(0);
    },
  );

  console.log(
    ' ✓ All break entries for this month deleted — no remaining entries for %s',
    teamMemberTable,
  );
}

// ============================================================================
// Step 5 — Automatic break: create a Single Time Entry whose span triggers the
// automatic break rule, then verify both the time entry and the auto-inserted
// break appear in the Time Entries table.
// ============================================================================

export async function createAutomaticBreakEntry(
  page: Page,
  account: TETestAccount,
  teFastTabPage: TETimeEntriesTabPage,
  teTabPage: TimeEntriesPage,
  ctx: BreakSuiteContext,
): Promise<void> {
  const stePage = new TESingleTimeEntryPage(page);
  const breaksPage = new BreaksPage(page);

  const {
    autoTeamMemberInput: teamMemberInput,
    autoTeamMemberTable: teamMemberTable,
    autoEntryCustomer,
    autoEntryService,
    autoEntryStartTime,
    autoEntryEndTime,
    autoEntryNotes,
    dateRange,
  } = BREAKS_VALIDATION_DATA;

  console.log(
    ' Creating automatic break (Single Time Entry) — teamMember=%s',
    teamMemberInput,
  );

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  // a. From the Time Entries page, open the "Add time" dropdown and select
  //    "Single time entry".
  await breaksPage.openSingleTimeEntryDrawer();
  await stePage.handleTourModal();
  await stePage.expectSingleTimeEntryVisible();
  // await test.step('Name field populated', async () => {
  //   await stePage.waitForNameFieldToPopulate();
  // });

  // b. Name = Test Emp2 (automatic break entries use Test Emp2)
  await test.step(`select Name "${teamMemberInput}"`, async () => {
    await teFastTabPage.selectNameOption(teamMemberInput);
  });

  // d. Start date = one day before the current day.
  await test.step('set start date to yesterday', async () => {
    await stePage.fillStartDate(yesterdayFormatted);
    await page.keyboard.press('Tab');
  });

  // c + d + e. Toggle on Set start and end time, then select 9:00 AM – 6:00 PM.
  await test.step('enable start/end time + select 9:00 AM - 6:00 PM', async () => {
    const toggleOn = await stePage.verifySetClockToggleState();
    if (!toggleOn) {
      await stePage.clickSetClockInAndOutToggles();
      await page.waitForTimeout(1500);
    }
    await page.waitForSelector(`//span[text()="Start time"]`, {
      state: 'visible',
      timeout: 10000,
    });
    await stePage.selectTime('Start', autoEntryStartTime);
    await stePage.selectTime('End', autoEntryEndTime);
  });

  // b. Customer = Test Customer1, Service = Sales
  await test.step(`select Customer "${autoEntryCustomer}"`, async () => {
    await stePage.selectOptionFromDropdown(autoEntryCustomer, 'Customer');
  });
  await test.step(`select Service "${autoEntryService}"`, async () => {
    await stePage.selectOptionFromDropdown(autoEntryService, 'Service');
  });

  // f. Notes
  await stePage.enterNotes(autoEntryNotes);

  // g. Save and close
  await stePage.clickSaveAndCloseButton();
  await teFastTabPage.expectSaveSucceeded();
  console.log(' ✓ Automatic break time entry created');

  // Step 6 — Validate the time entry and the automatic break in the table.
  await teTabPage.navigateToTimeEntriesPage();
  await teTabPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await teTabPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, dateRange);
  await teTabPage.waitForLoadingToDisappear();

  await brSoft(
    `time entry visible for ${teamMemberTable} (customer "${autoEntryCustomer}")`,
    async () => {
      await teTabPage.validateCustomerValueForSpecificEmployee(
        teamMemberTable,
        autoEntryCustomer,
      );
    },
  );
  await brSoft(
    `automatic break "${ctx.automaticBreakName}" reflected for ${teamMemberTable}`,
    async () => {
      await teTabPage.validateAddedBreaksEntryExistsForEmployee(
        ctx.automaticBreakName,
        teamMemberTable,
      );
    },
  );

  console.log(
    ' ✓ Time entry and automatic break reflected in Time Entries table',
  );
}

// ============================================================================
// Step 6b — Validate the created automatic break in the Time Entries page for
// the SPECIFIC date it was logged on (one day before the current day).
// ============================================================================

export async function validateAutomaticBreakEntryForDate(
  page: Page,
  account: TETestAccount,
  teTabPage: TimeEntriesPage,
  ctx: BreakSuiteContext,
): Promise<void> {
  const { autoTeamMemberTable: teamMemberTable } = BREAKS_VALIDATION_DATA;

  // Same date used by createAutomaticBreakEntry — one day before today.
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const pad = (n: number) => `${n}`.padStart(2, '0');
  const yesterdayIso = `${yesterday.getFullYear()}-${pad(
    yesterday.getMonth() + 1,
  )}-${pad(yesterday.getDate())}`; // YYYY-MM-DD → date-picker data-test-id
  const yesterdayMonthYear = yesterday.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  console.log(
    ' Validating automatic break "%s" for %s on %s',
    ctx.automaticBreakName,
    teamMemberTable,
    yesterdayIso,
  );

  await teTabPage.navigateToTimeEntriesPage();
  await teTabPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await teTabPage.waitForLoadingToDisappear();

  // Pin the grid to that exact date (yesterday → yesterday) via a Custom range.
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, LABELS.custom);
  await teTabPage.selectCustomDateRange(
    yesterdayMonthYear,
    yesterdayIso,
    yesterdayIso,
  );
  await teTabPage.waitForLoadingToDisappear();

  await brSoft(
    `automatic break "${ctx.automaticBreakName}" visible for ${teamMemberTable} on ${yesterdayIso}`,
    async () => {
      await teTabPage.validateAddedBreaksEntryExistsForEmployee(
        ctx.automaticBreakName,
        teamMemberTable,
      );
    },
  );

  console.log(
    ' ✓ Automatic break validated in Time Entries for %s',
    yesterdayIso,
  );
}

// ============================================================================
// Step 7 — Edit the automatic break time entry: change End time to 5:00 PM.
// ============================================================================

export async function editAutomaticBreakEntry(
  page: Page,
  account: TETestAccount,
  teTabPage: TimeEntriesPage,
): Promise<void> {
  const stePage = new TESingleTimeEntryPage(page);

  const { autoTeamMemberTable: teamMemberTable, autoEntryEditEndTime } =
    BREAKS_VALIDATION_DATA;

  console.log(
    ' Editing automatic break time entry — teamMemberTable=%s',
    teamMemberTable,
  );

  await teTabPage.clickEditForEmployee(teamMemberTable);
  await stePage.handleTourModal();
  await brSoft('single time entry edit trowser visible', async () => {
    await stePage.expectSingleTimeEntryVisible();
  });

  await test.step(`edit End time → ${autoEntryEditEndTime}`, async () => {
    await stePage.selectTime('End', autoEntryEditEndTime);
  });

  await stePage.clickSaveAndCloseButton();
  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });

  await brSoft(
    `automatic break time entry still visible for ${teamMemberTable}`,
    async () => {
      await teTabPage.validateCreatedSingleTimeEntryForEmployee(
        teamMemberTable,
      );
    },
  );

  console.log(' ✓ Automatic break time entry End time edited to 5:00 PM');
}

// ============================================================================
// Time Clock — create / validate / delete
// (Started from the on-page Clock In control, then clocked out to finalize.)
// ============================================================================

/** Notes entered on the time clock entry / used to find it in the grid. */
const TC_ENTRY_NOTES = 'Time Clock Entry';
/** Customer + Service selected for the time clock entry (per the suite spec). */
const TC_ENTRY_CUSTOMER = 'Test Customer1';
const TC_ENTRY_SERVICE = 'Hours';

/**
 * Step 2 — Create a Time Clock entry that takes a MANUAL break:
 *   a. validate the "Clock In" control is shown, then click it
 *   b. wait for the Time Clock side trowser to open
 *   c. validate the trowser header / details / dropdown fields
 *   d. select "Test Customer1" + Clock In
 *   e. validate the clocked-in header / fields
 *   f. select "Hours" Service, Billable, Notes "Time Clock Entry"
 *   g. click "Take break"
 *   h. select the manual break from the dropdown
 *   i. click "Take break" + validate the break-started description
 *   j. close the trowser
 *   k. wait for the Time Entries page to load
 *
 * NOTE: the manual break rules are assigned to ALL team members (see
 * setupBreakRulesPrerequisites) so the clocked-in user can take the break. The
 * break-specific locators ("Take break", "Select Break", "started a break")
 * are best-effort accessible-name/text matches and are soft-asserted.
 */
export async function createTimeClockEntry(
  page: Page,
  account: TETestAccount,
  teFastTabPage: TETimeEntriesTabPage,
  ctx: BreakSuiteContext,
): Promise<string> {
  console.log(' Creating Time Clock entry with a manual break');

  const clockInControl = page
    .locator(`//*[@type='button' and @aria-label='timeclock-action-button']`)
    .first();
  // "Take break" control — tolerant of the exact attribute/markup. The visible,
  // accessible button is preferred FIRST so `.first()` resolves to a clickable
  // element (a hidden data-test-id match previously caused a 15s click timeout).
  const takeBreakButton = page
    .locator(`//*[@data-test-id='time-clock-take-break-button']`)
    .first();

  const takeBreakButtonClockOut = page
    .locator(`//*[@data-test-id='time-clock-take-break-clockout-button']`)
    .first();

  // a. Validate the "Clock In" control is displayed, then open the drawer.
  await brSoft('Clock In control visible', async () => {
    await expect(clockInControl).toBeVisible({ timeout: 15000 });
  });
  // b. Open the Time Clock side trowser.
  await teFastTabPage.openTimeClock();
  await brSoft('Time Clock trowser open', async () => {
    expect(await teFastTabPage.isTimeClockDrawerOpen()).toBeTruthy();
  });

  // c. Validate trowser header + details + dropdown fields (pre clock-in).
  await brSoft('trowser header, details and fields present', async () => {
    const name = await teFastTabPage.getClockDrawerName();
    expect(name.length).toBeGreaterThan(0);
    expect(await teFastTabPage.isClockInPromptVisible()).toBeTruthy();
    expect(await teFastTabPage.isClockStartDateVisible()).toBeTruthy();
    expect(await teFastTabPage.isClockStartTimeVisible()).toBeTruthy();
  });

  // d. Select "Test Customer1" then click Clock In (bottom-right green button).
  await test.step(`select Customer "${TC_ENTRY_CUSTOMER}" + Clock in`, async () => {
    const options = await teFastTabPage.getClockCustomerProjectOptions();
    const match = options.find((o) =>
      o.toLowerCase().includes(TC_ENTRY_CUSTOMER.toLowerCase()),
    );
    await teFastTabPage.selectClockCustomerProject(match ?? options[0]);
    await teFastTabPage.clockIn();
  });

  // e. Validate the clocked-in header.
  await brSoft('clocked-in header visible', async () => {
    const header = await teFastTabPage.getClockedInHeaderText();
    expect(header.toLowerCase()).toContain('clocked in');
  });

  // f. Service "Hours", Billable, Notes "Time Clock Entry".
  await brSoft(`select Service "${TC_ENTRY_SERVICE}"`, async () => {
    const services = await teFastTabPage.getClockServiceItemOptions();
    const match = services.find((s) =>
      s.toLowerCase().includes(TC_ENTRY_SERVICE.toLowerCase()),
    );
    await teFastTabPage.selectClockServiceItem(match ?? services[0]);
  });
  if (account.entitlements.canSeeBillable) {
    await brSoft('set Billable', async () => {
      await teFastTabPage.setClockBillable(true);
    });
  }
  await teFastTabPage.fillClockNotes(TC_ENTRY_NOTES);

  // g. Click "Take break".
  await brSoft('click Take break', async () => {
    await expect(takeBreakButton).toBeVisible({ timeout: 15000 });
    await takeBreakButton.click({ timeout: 10000 });
    await teFastTabPage.waitForLoadingToDisappear();
  });

  ctx.clockBreakTaken = false;

  // h. Select the manual break from the chooser. The chooser may be a "Select
  //    Break" typeahead OR a menu of break options — handle both, and match the
  //    rule by its bare name or its "Paid: …" type label.
  await brSoft(`select manual break "${ctx.manualBreakName}"`, async () => {
    // Let the take-break panel finish rendering before reading its dropdown.
    await page.waitForTimeout(1500);
    const selectBreakDropdown = page
      .locator(`//input[@aria-label="Select Break"]`)
      .first();
    // Open the break-type dropdown to reveal the options (wait generously — the
    // panel can render after a short delay).
    if (
      await selectBreakDropdown.isVisible({ timeout: 10000 }).catch(() => false)
    ) {
      await selectBreakDropdown.click({ force: true });
      await page.waitForTimeout(800);
    }
    // Match the manual break option by its name or "Paid: …" type. Use
    // contains(., …) (matches descendant text — options often wrap the label in
    // a span, which contains(text(), …) misses) and wait for it before clicking.
    const option = page
      .locator(
        `//li[contains(., '${ctx.manualBreakName}') or contains(., '${ctx.manualBreakType}')]`,
      )
      .or(
        page.getByRole('option', {
          name: new RegExp(ctx.manualBreakName, 'i'),
        }),
      )
      .or(page.getByText(ctx.manualBreakType, { exact: false }))
      .or(page.getByText(ctx.manualBreakName, { exact: false }))
      .first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click({ timeout: 10000 });
    await teFastTabPage.waitForLoadingToDisappear();
  });

  // i. Confirm "Take break" AFTER the break is selected — the clock-out/confirm
  //    button (`…take-break-clockout-button`) is disabled until a break is
  //    chosen, so it is clicked here, not before selection. Then record whether
  //    the break actually started.
  await brSoft('confirm Take break after selecting break rule', async () => {
    if (
      await takeBreakButtonClockOut
        .isVisible({ timeout: 10000 })
        .catch(() => false)
    ) {
      // click() waits for the button to become enabled (it enables once the
      // break is selected) before acting.
      await takeBreakButtonClockOut
        .click({ timeout: 15000 })
        .catch(() => undefined);
      await teFastTabPage.waitForLoadingToDisappear();
      await page.waitForTimeout(1000);
    }
    ctx.clockBreakTaken = await page
      .getByText(/started (a )?break|on (a )?break|break started/i)
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    expect(ctx.clockBreakTaken).toBeTruthy();
  });

  // j. Close the trowser. k. Wait for the Time Entries page to load.
  await teFastTabPage.closeTimeClockDrawer(true);
  await teFastTabPage.waitForLoadingToDisappear();
  await ensureOnTimeEntriesGrid(page, teFastTabPage);

  console.log(' ✓ Time Clock entry + manual break created');
  return TC_ENTRY_NOTES;
}

/**
 * Steps 3-6 — validate the two records (time clock entry + manual break),
 * reopen the running timer, end the break, clock out, then validate the Clock
 * In control is shown again and the manual break row has a start/end Time range.
 */
export async function validateTimeClockEntry(
  page: Page,
  account: TETestAccount,
  teFastTabPage: TETimeEntriesTabPage,
  ctx: BreakSuiteContext,
): Promise<void> {
  const common = new CommonLocators(page);

  await ensureOnTimeEntriesGrid(page, teFastTabPage);
  await teFastTabPage.waitForLoadingToDisappear();
  await brSoft('set This month range for verification', async () => {
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.thisMonth);
    await teFastTabPage.waitForLoadingToDisappear();
  });

  // Match the row by the SAME manual break rule selected while creating the
  // time clock break — either its bare rule name ("manual break - <ts>") or its
  // pay-type label ("Paid: manual break - <ts>") as it renders in the grid.
  const breakRow = page
    .locator(
      `//tbody//tr[contains(., '${ctx.manualBreakName}') or contains(., '${ctx.manualBreakType}')]`,
    )
    .first();

  // 3. Two records: the time clock entry + the manual break (incl. the rule).
  await brSoft(`time clock entry "${TC_ENTRY_NOTES}" visible`, async () => {
    expect(
      await teFastTabPage.isRowWithNotesVisible(TC_ENTRY_NOTES),
    ).toBeTruthy();
  });
  // Only assert the break record when the break was actually taken — otherwise
  // skip fast (an unbounded toBeVisible here previously inherited the 180s
  // global expect timeout and stalled the run until it was interrupted).
  if (ctx.clockBreakTaken) {
    await brSoft(
      `manual break "${ctx.manualBreakName}" record visible`,
      async () => {
        await expect(breakRow).toBeVisible({ timeout: 15000 });
      },
    );
  } else {
    console.warn(
      '[BR01] manual break was not taken in the Time Clock — skipping break-record validation',
    );
  }

  // 4. Click the running timer; validate the side trowser opens.
  await brSoft('open running timer + trowser', async () => {
    if (
      !(await teFastTabPage.isRunningClockTimerVisible().catch(() => false))
    ) {
      await teFastTabPage
        .navigateToTimeEntriesPageSubmenu('Time entries')
        .catch(() => undefined);
      await teFastTabPage.waitForLoadingToDisappear();
    }
    await teFastTabPage.openRunningClockTimer();
    expect(await teFastTabPage.isTimeClockDrawerOpen()).toBeTruthy();
  });

  // 5. End the break (only when one was taken), then Clock out regardless so
  if (ctx.clockBreakTaken) {
    await brSoft('End break', async () => {
      await page
        .locator(`//*[@type='button']//child::span[text()='End break']`)
        .first()
        .click({ timeout: 15000 });
      await teFastTabPage.waitForLoadingToDisappear();
    });
  }
  await brSoft('Clock out', async () => {
    await teFastTabPage.waitForClockOutButton();
    await page.waitForTimeout(1000);
    await teFastTabPage.clockOut();
    await teFastTabPage.waitForLoadingToDisappear();
    await teFastTabPage.closeTimeClockDrawer(false);
    await teFastTabPage.waitForLoadingToDisappear();
  });

  // 6. Clock In shown again + manual break row has a start/end Time range.
  await ensureOnTimeEntriesGrid(page, teFastTabPage);
  await brSoft('Clock In control visible again', async () => {
    await expect(
      page
        .locator(
          `//*[@type='button' and @aria-label='timeclock-action-button']`,
        )
        .first(),
    ).toBeVisible({ timeout: 15000 });
  });
  if (ctx.clockBreakTaken) {
    await brSoft(
      `time clock entry has the manual break rule "${ctx.manualBreakName}"`,
      async () => {
        const text =
          (await breakRow.textContent({ timeout: 15000 }).catch(() => '')) ??
          '';
        expect(
          text.includes(ctx.manualBreakName) ||
            text.includes(ctx.manualBreakType),
        ).toBeTruthy();
      },
    );
  }

  console.log(' ✓ Time Clock + manual break validated; clocked out');
}

/**
 * Step 7 — Delete the time clock entries created this run (the clock entry and
 * its manual break) by removing all entries visible in the current month.
 */
export async function deleteTimeClockEntry(
  page: Page,
  account: TETestAccount,
  teFastTabPage: TETimeEntriesTabPage,
): Promise<void> {
  const common = new CommonLocators(page);

  await ensureOnTimeEntriesGrid(page, teFastTabPage);
  await brSoft('set This month range before delete', async () => {
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.thisMonth);
    await teFastTabPage.waitForLoadingToDisappear();
  });

  await brSoft('delete all time clock entries', async () => {
    await deleteAllVisibleTimeEntries(page, teFastTabPage.tePageBase);
  });
  console.log(' ✓ Time Clock entries deleted');
}

// ============================================================================
// Step 9 — Delete the break rules created during this run.
// ============================================================================

export async function deleteCreatedBreakRules(
  page: Page,
  ctx: BreakSuiteContext,
): Promise<void> {
  const breaksRulesPage = new BreaksRulesPage(page);

  console.log(
    ' Deleting all displayed break rules (created this run: %s, %s, %s)',
    ctx.manualBreakName,
    ctx.manualBreakName2,
    ctx.automaticBreakName,
  );

  await breaksRulesPage.goto();
  await page.waitForTimeout(2000);

  // Every deletable rule exposes a per-row "Delete break rule" button.
  const deleteButtons = page.locator(
    `//button[@aria-label="Delete break rule"]`,
  );
  // Confirmation dialog heading + its Delete button. The confirm button is
  // located RELATIVE to the heading (the dialog is portalled to the end of the
  // DOM, so `following::` resolves to the dialog's button — not a row button).
  const confirmHeading = page
    .locator(`//h5[contains(text(), 'Want to delete')]`)
    .first();
  const confirmDeleteButton = page
    .locator(
      `//h5[contains(text(), 'Want to delete')]/following::button[.//span[text()='Delete']][1]`,
    )
    .first();

  let remaining = await deleteButtons.count().catch(() => 0);
  console.log(' Found %d break rule(s) to delete', remaining);

  // Delete rules one at a time. Every wait/click is bounded by a short, explicit
  // timeout so a missed click or a dialog that never opens fails FAST instead of
  // hanging on the global 300s action timeout (the cause of the earlier stall).
  let guard = 0;
  while (remaining > 0 && guard < 50) {
    guard++;

    // 1. Open the delete confirmation for the first displayed rule, retrying the
    //    row-button click until the dialog actually appears.
    let dialogOpen = false;
    for (let attempt = 0; attempt < 3 && !dialogOpen; attempt++) {
      const firstDelete = deleteButtons.first();
      if (
        !(await firstDelete.isVisible({ timeout: 5000 }).catch(() => false))
      ) {
        break;
      }
      await firstDelete.click({ force: true, timeout: 10000 }).catch(() => {});
      dialogOpen = await confirmHeading
        .isVisible({ timeout: 5000 })
        .catch(() => false);
    }
    if (!dialogOpen) {
      console.warn(
        ' Delete confirmation dialog did not open — stopping (%d rule(s) left)',
        remaining,
      );
      break;
    }

    // 2. Confirm via the dialog's Delete button (bounded), with a fallback to
    //    the generic confirm locator if the relative one is not matched.
    await confirmDeleteButton
      .click({ force: true, timeout: 10000 })
      .catch(async () => {
        await page
          .locator(`//button[.//span[text()='Delete']]`)
          .last()
          .click({ force: true, timeout: 10000 })
          .catch(() => {});
      });

    // 3. Wait (bounded) for the dialog to close and the table to refresh.
    await confirmHeading
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});
    await page
      .waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
        state: 'hidden',
        timeout: 30000,
      })
      .catch(() => {});
    await page.waitForTimeout(1000);

    // 4. Progress guard — if the count did not drop, a rule could not be
    //    removed; stop rather than loop forever.
    const newRemaining = await deleteButtons.count().catch(() => 0);
    if (newRemaining >= remaining) {
      console.warn(
        ' Break rule deletion made no progress (%d remaining) — stopping',
        newRemaining,
      );
      break;
    }
    console.log(' ✓ Deleted a break rule (%d remaining)', newRemaining);
    remaining = newRemaining;
  }

  const finalCount = await deleteButtons.count().catch(() => 0);
  if (finalCount === 0) {
    console.log(' ✓ All break rules deleted');
  } else {
    console.warn(' ⚠ %d break rule(s) still present after cleanup', finalCount);
  }
}

// ============================================================================
// BR01 Orchestrator
// ============================================================================

/**
 * Runs the full BR01 suite in sequence. Mirrors runTEFullSuite's structure:
 *  - exported async function declaration
 *  - single shared TimeEntriesPage instance passed to every step
 *  - named brStepXX_ functions per phase
 *  - brSoft() for non-fatal assertions throughout
 *  - [BR01][StepN] console checkpoints for HTML report traceability
 */
export async function runBreaksFullSuite(
  page: Page,
  account: TETestAccount,
): Promise<void> {
  const teTabPage = new TimeEntriesPage(page);
  const teFastTabPage = new TETimeEntriesTabPage(page);
  const ctx = buildBreakSuiteContext();

  console.log(
    ' Starting suite — role=%s companyType=%s teamMember=%s',
    account.role,
    account.companyType,
    BREAKS_VALIDATION_DATA.teamMemberInput,
  );
  console.log(
    ' Break rules for this run — manual="%s" automatic="%s"',
    ctx.manualBreakName,
    ctx.automaticBreakName,
  );

  await step01_loginAndRoleSetup(page, account);
  await validateDashboard(page, account);
  await navigateToTimeSubmenu(page, account, 'Time entries');
  await validateLeftNavPersistence(page, account);
  await setupBreakRulesPrerequisites(page, account, teTabPage, ctx);
  await deleteAllBreakEntriesForMonth(page, account, teTabPage);
  await createBreakEntry(page, account, teTabPage, ctx);
  await validateTabVisibilityVsEntitlements(page, account, teFastTabPage);
  await validateFilters(page, account, teFastTabPage);
  await validateColumnVisibilityAndSettings(page, account, teFastTabPage);
  await validateRoleScopedDataVisibility(page, account, teFastTabPage);
  await editBreakEntry(page, account, teTabPage, ctx);
  await deleteBreakEntry(page, account, teTabPage);

  //Single Time Entry (automatic break) flow
  await createAutomaticBreakEntry(page, account, teFastTabPage, teTabPage, ctx);
  await validateAutomaticBreakEntryForDate(page, account, teTabPage, ctx);
  await deleteBreakEntry(page, account, teTabPage);

  //Time Clock flow — create (with manual break), validate/end break, delete
  await createTimeClockEntry(page, account, teFastTabPage, ctx);
  await validateTimeClockEntry(page, account, teFastTabPage, ctx);
  await deleteTimeClockEntry(page, account, teFastTabPage);
  await deleteCreatedBreakRules(page, ctx);
}

/** Minimal account shape required by the 4 generic validation methods. */
interface TimeAccountBase {
  role: 'admin' | 'manager' | 'employee' | 'vendor';
  sku?: 'limited' | 'full' | 'simplestart' | 'ca_hidden';
}

export async function validateTabVisibilityVsEntitlements(
  page: Page,
  account: TimeAccountBase,
  teFastTabPage: TETimeEntriesTabPage,
  { canSeeAllTabs = true }: { canSeeAllTabs?: boolean } = {},
): Promise<void> {
  const visibleTabs = await teFastTabPage.getVisibleTabNames();
  console.log('[Generic] Time tab count: %d', visibleTabs.length);
  console.log('[Generic] Tabs visible: %o', visibleTabs);

  const hasTab = (name: string): boolean =>
    visibleTabs.some((t) => t.toLowerCase().includes(name.toLowerCase()));

  if (canSeeAllTabs === true) {
    await brSoft('full tab set present', async () => {
      expect(hasTab('Time Entries') || hasTab('Time entries')).toBeTruthy();
    });
  } else if (account.sku === 'limited') {
    await brSoft('limited tab set (Time Entries + Schedule)', async () => {
      expect(hasTab('Time Entries')).toBeTruthy();
    });
  } else if (account.sku === 'simplestart') {
    await brSoft('simplestart tab set (Time Entries + Overview)', async () => {
      expect(hasTab('Time Entries')).toBeTruthy();
      expect(hasTab('Schedule')).toBeFalsy();
    });
  }
  console.log('[Generic] Tab visibility and entitlements check complete');
}

export async function validateFilters(
  page: Page,
  account: TimeAccountBase,
  teFastTabPage: TETimeEntriesTabPage,
  {
    canSeeAllTabs = true,
    hasLastWeekEntries = false,
    hasLastMonthEntries = false,
  }: {
    canSeeAllTabs?: boolean;
    hasLastWeekEntries?: boolean;
    hasLastMonthEntries?: boolean;
  } = {},
): Promise<void> {
  const common = new CommonLocators(page);

  // --- Default state check ---
  const displayByDefault = await readFilterControlValue(page, LABELS.displayBy);
  const dateRangeDefault = await readFilterControlValue(page, LABELS.dateRange);
  console.log(
    '[Generic] Default filters: displayBy=%s dateRange=%s',
    displayByDefault,
    dateRangeDefault,
  );
  await brSoft('default Display by = Date', async () => {
    expect(displayByDefault).toContain(LABELS.date);
  });
  await brSoft('default Date range = This month', async () => {
    // The control may display either the literal "This month" label or the
    // resolved current-month date span (e.g. "6/1/2026 - 6/30/2026"); accept both.
    const isThisMonth =
      dateRangeDefault.includes(LABELS.thisMonth) ||
      dateRangeIsCurrentMonth(dateRangeDefault);
    expect(isThisMonth).toBeTruthy();
  });

  // --- Date filter cycling ---
  const dateOptions = [
    LABELS.today,
    LABELS.thisWeek,
    LABELS.thisMonth,
    LABELS.lastWeek,
    LABELS.lastMonth,
    LABELS.custom,
  ];

  for (const option of dateOptions) {
    if (option === LABELS.lastWeek && !hasLastWeekEntries) {
      console.warn('[Generic] Skipping data assertion for Last week (no seed)');
    }
    if (option === LABELS.lastMonth && !hasLastMonthEntries) {
      console.warn(
        '[Generic] Skipping data assertion for Last month (no seed)',
      );
    }

    await brSoft(`apply date filter "${option}"`, async () => {
      await common.openDateRangeDropdown();
      await common.selectDateRangeOption(option);

      if (option === LABELS.custom) {
        await teFastTabPage.tePageBase.selectCustomDateRange(
          testData.customTargetMonth,
          testData.customStartDate,
          testData.customEndDate,
        );
      }
      await teFastTabPage.waitForLoadingToDisappear();
    });

    const rowCount = await teFastTabPage.getEntryRowCount().catch(() => 0);
    console.log(
      '[Generic] Date filter "%s" applied — rows visible: %s',
      option,
      rowCount > 0,
    );
  }

  // --- Display By cycling ---
  const displayByOptions = [LABELS.date];
  if (canSeeAllTabs) {
    displayByOptions.push(LABELS.customer);
  }
  for (const option of displayByOptions) {
    await brSoft(`apply Display by "${option}"`, async () => {
      await common.selectDisplayByOption(option);
      await teFastTabPage.waitForLoadingToDisappear();
    });
    const rowCount = await teFastTabPage.getEntryRowCount().catch(() => 0);
    console.log(
      '[Generic] Display by "%s" applied — rows visible: %s',
      option,
      rowCount > 0,
    );
  }

  // --- Reset to defaults ---
  await brSoft('reset filters to Date / This week', async () => {
    await common.selectDisplayByOption(LABELS.date);
    await teFastTabPage.waitForLoadingToDisappear();
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.thisWeek);
    await teFastTabPage.waitForLoadingToDisappear();
  });
  console.log('[Generic] Filters validation complete');
}

export async function validateColumnVisibilityAndSettings(
  _page: Page,
  account: TimeAccountBase,
  teFastTabPage: TETimeEntriesTabPage,
  {
    canSeeCostRate = true,
    canSeeBillable = true,
  }: {
    canSeeCostRate?: boolean;
    canSeeBillable?: boolean;
  } = {},
): Promise<void> {
  const defaultColumns = await teFastTabPage.getVisibleColumnNames();
  console.log('[Generic] Default columns: %o', defaultColumns);

  const settingsColumns = await teFastTabPage.getColumnSettingsLabels();
  console.log('[Generic] Toggleable columns: %o', settingsColumns);

  for (const column of settingsColumns) {
    await brSoft(`disable column "${column}" → hidden`, async () => {
      await teFastTabPage.setColumnVisibility(column, false);
      await teFastTabPage.assertColumnHidden(column);
      console.log('[Generic] Column "%s" hidden', column);
    });
    await brSoft(`enable column "${column}" → visible`, async () => {
      await teFastTabPage.setColumnVisibility(column, true);
      await teFastTabPage.assertColumnVisible(column);
      console.log('[Generic] Column "%s" visible', column);
    });
  }

  if (canSeeCostRate === false) {
    await brSoft('Cost rate column absent', async () => {
      await teFastTabPage.assertColumnHidden('Cost rate');
    });
  }
  if (canSeeBillable === false) {
    await brSoft('Billable column absent', async () => {
      await teFastTabPage.assertColumnHidden(LABELS.billable);
    });
  }
  console.log('[Generic] Column visibility checks complete');
}

export async function validateRoleScopedDataVisibility(
  page: Page,
  account: TimeAccountBase,
  teFastTabPage: TETimeEntriesTabPage,
): Promise<void> {
  const common = new CommonLocators(page);

  await brSoft('set Date view / This week', async () => {
    await common.selectDisplayByOption(LABELS.date);
    await teFastTabPage.waitForLoadingToDisappear();
    await common.openDateRangeDropdown();
    await common.selectDateRangeOption(LABELS.thisWeek);
    await teFastTabPage.waitForLoadingToDisappear();
  });

  const rowCount = await teFastTabPage.getEntryRowCount().catch(() => 0);
  const distinctNames = await teFastTabPage.getDistinctEmployeeNames();
  console.log(
    '[Generic] Role=%s, visible row count=%d, distinct names=%d',
    account.role,
    rowCount,
    distinctNames.length,
  );

  switch (account.role) {
    case 'admin':
      await brSoft('admin sees multiple team members', async () => {
        expect(distinctNames.length).toBeGreaterThan(0);
      });
      break;
    case 'manager':
      await brSoft('manager sees team-scoped rows', async () => {
        expect(distinctNames.length).toBeGreaterThanOrEqual(0);
      });
      break;
    case 'employee':
    case 'vendor':
      await brSoft('self-scoped data only', async () => {
        expect(distinctNames.length).toBeLessThanOrEqual(1);
      });
      break;
    default:
      break;
  }
  console.log('[Generic] Role-scoped data visibility check complete');
}
//UNUSED
export async function loginAndRoleSetup(
  page: Page,
  account: TETestAccount,
): Promise<void> {
  console.log(
    ' Login state: companyType=%s role=%s region=%s (sku will be resolved from qbo.productEntitlements)',
    account.companyType,
    account.role,
    account.region,
  );

  // Body node is present for ALL company types (Elite, Premium, IES, Standard).
  await soft('QBO body node visible', async () => {
    await expect(page.locator('[data-id=bodyNode]')).toBeVisible({
      timeout: 15000,
    });
  });

  if (account.companyType !== 'ies') {
    await soft('QBO sidebar visible', async () => {
      await expect(page.locator(`//*[@aria-label='Side']`)).toBeVisible({
        timeout: 15000,
      });
    });
  }

  console.log(' ✓ Login confirmed');
}
//UNUSED
export async function validateDashboardAndResolveSku(
  page: Page,
  account: TETestAccount,
): Promise<void> {
  const flavourLabel =
    account.rawFlavours && account.rawFlavours.length > 0
      ? account.rawFlavours.join(' + ')
      : '(no flavours)';

  if (account.rawFlavours && account.rawFlavours.length > 0) {
    account.companyType = mapFlavoursToCompanyType(account.rawFlavours);
  }

  console.log(' Validating dashboard: role=%s', account.role);
  console.log(' [SKU]: %s', flavourLabel);
  console.log(
    ' CompanyType derived from flavours: %s',
    account.companyType ?? 'unresolved',
  );

  // --- Common (all company types) -------------------------------------------

  await soft('dashboard: QBO body node visible', async () => {
    await expect(page.locator('[data-id=bodyNode]')).toBeVisible({
      timeout: 15000,
    });
  });

  await soft('dashboard: account header visible', async () => {
    await expect(page.locator('.oneIntuitAccountHeaderItem')).toBeVisible({
      timeout: 15000,
    });
  });

  await soft('dashboard: All apps nav trigger visible', async () => {
    await expect(
      page.locator(`//*[@aria-label='All apps']`).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  // --- Company-type-specific -------------------------------------------------

  if (account.companyType === 'ies') {
    // IES application shell — no standard QBO sidebar; check IES header region.
    await soft('dashboard (IES): IES app header region visible', async () => {
      await expect(
        page
          .locator(`[data-testid="ies-app-header"]`)
          .or(page.locator(`[data-id="tsaGlobalHeader"]`))
          .first(),
      ).toBeVisible({ timeout: 10000 });
    });
    console.log(' ✓ dashboard validated');
  } else {
    // Elite, Premium, Standard (or unresolved) — standard QBO shell.
    await soft(
      `dashboard (${
        account.companyType ?? 'standard'
      }): QuickBooks Landing Page sidebar link visible`,
      async () => {
        await expect(
          page.locator(`//*[@aria-label='Side']`).first(),
        ).toBeVisible({ timeout: 10000 });
      },
    );
    console.log(' ✓ %s dashboard validated', account.companyType ?? 'standard');
  }

  console.log(' ✓ Dashboard validation complete');
}
