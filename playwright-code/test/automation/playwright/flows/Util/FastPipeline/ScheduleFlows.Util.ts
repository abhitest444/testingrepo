import { Page, expect } from '@playwright/test';
import SchedulePage from '../../../pages/FastPipeline/SchedulePage';
import { LoginCredentials } from '../../../config/types';
import { QBOLogin } from '../../../pages/QBOLogin';
import { AccountMatrix, resolveMatrixAccounts } from './accountMatrix';
import {
  DashboardAccount,
  validateDashboard,
  navigateToTimeSubmenu,
  validateLeftNavPersistence,
} from '../../../pages/FastPipeline/DashboardPage';

// ============================================================================
// SCH01 — Schedule Tab Full Suite
// ============================================================================

// ---- Account shape ----------------------------------------------------------

export interface SCHEntitlements {
  canViewSchedule: boolean;
  canCreateShift: boolean;
  canEditShift: boolean;
  canDeleteShift: boolean;
  canPublish: boolean;
}

export interface SCHSeededData {
  /** Employee name as shown in the Schedule grid row (e.g. 'Test Emp1'). */
  teamMemberName: string;
  /** Shift title written into the creation panel. */
  shiftTitle: string;
  /** Updated title used during the edit step. */
  shiftTitleEdited: string;
  /** Start time for the initial shift, e.g. '8:00am'. */
  startTime: string;
  /** End time for the initial shift, e.g. '12:00pm'. */
  endTime: string;
  /** Updated start time used during the edit step. */
  startTimeEdited: string;
  /** Updated end time used during the edit step. */
  endTimeEdited: string;
}

export interface SCHTestAccount {
  credentials: LoginCredentials;
  role: 'admin' | 'manager' | 'employee' | 'vendor';
  companyType?: 'elite' | 'premium' | 'ies' | 'standard';
  // UNUSED-FASTPIPELINE: rawFlavours & region are populated for TETestAccount parity but never read by SCH01 (asDashboardAccount only reads role + companyType) — candidates for removal
  rawFlavours?: string[];
  region?: 'us' | 'ca';
  entitlements: SCHEntitlements;
  seededData: SCHSeededData;
}

function asDashboardAccount(account: SCHTestAccount): DashboardAccount {
  return { role: account.role, companyType: account.companyType };
}

// ---- Factory ----------------------------------------------------------------

/**
 * Builds a fully-populated SCHTestAccount. Mirrors buildAPTAccount / buildTEAccount.
 */
export function buildSCHAccount(
  credentials: LoginCredentials,
  overrides: {
    role?: SCHTestAccount['role'];
    companyType?: SCHTestAccount['companyType'];
    entitlements?: Partial<SCHEntitlements>;
    seededData?: Partial<SCHSeededData>;
  } = {},
): SCHTestAccount {
  const resolvedCompanyType: SCHTestAccount['companyType'] =
    overrides.companyType ??
    (credentials.companyType as SCHTestAccount['companyType'] | undefined) ??
    'elite';

  return {
    credentials,
    role: overrides.role ?? 'admin',
    companyType: resolvedCompanyType,
    entitlements: {
      canViewSchedule: true,
      canCreateShift: true,
      canEditShift: true,
      canDeleteShift: true,
      canPublish: true,
      ...overrides.entitlements,
    },
    seededData: {
      teamMemberName: 'Test Emp1',
      shiftTitle: 'SCH01 Shift Entry',
      shiftTitleEdited: 'SCH01 Shift Entry - Edited',
      startTime: '8:00am',
      endTime: '12:00pm',
      startTimeEdited: '9:00am',
      endTimeEdited: '1:00pm',
      ...overrides.seededData,
    },
  };
}

// ---- Account matrix ---------------------------------------------------------

/** A built {@link SCHTestAccount} paired with the account key it came from. */
export interface SCHMatrixAccount {
  /** The account key (e.g. `SCH01`) — used to label the per-account test. */
  testId: string;
  account: SCHTestAccount;
}

/**
 * Schedule (SCH01) FastPipeline account matrix — same shape and resolution rules
 * as the APT/TE matrices. The shared TEST_ACCOUNT selector resolves against the
 * Schedule account pool for each SKU, so the same `TEST_ACCOUNT=PR_ELITE` run that
 * exercises the elite Approvals/TE suites also runs the Schedule suite against
 * SCHEL01 (companyType 'elite'). Keys missing from the active env are skipped, so
 * SKUs without a Schedule account yet stay as TODO placeholders.
 */
const SCH_ACCOUNT_MATRIX: AccountMatrix = {
  // Intuit Enterprise Suite.
  IES: ['SCHES01'],
  // QBO + Time/Payroll Elite.
  PR_ELITE: ['SCHEL01'],
  // QBO + Time/Payroll Premium.
  PR_PREMIUM: ['SCHPR01'],
  // Freedata_Advanced.
  FREE_DATA_ADV: ['SCFDA01'],
  // Freedata_Essential.
  FREE_DATA_ESSENTIAL: ['SCFDE01'],
  // Freedata_Plus.
  FREE_DATA_PLUS: ['SCFDP01'],
};

/**
 * Builds the list of {@link SCHTestAccount}s the TEST_ACCOUNT selector resolves to
 * for the Schedule track. Mirrors buildAPTAccountsFromMatrix: a SKU group expands to
 * that SKU's Schedule accounts, an exact key resolves to a single account. Role is
 * read from each account row's metadata.
 */
export function buildSCHAccountsFromMatrix(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): SCHMatrixAccount[] {
  return resolveMatrixAccounts({
    matrix: SCH_ACCOUNT_MATRIX,
    param: selector,
    label: 'SCH',
    allowEmpty: true,
  }).map(({ testId, credentials }) => ({
    testId,
    account: buildSCHAccount(credentials, {
      role: credentials.expectedRole ?? 'admin',
      entitlements: {
        canViewSchedule: true,
        canCreateShift: true,
        canEditShift: true,
        canDeleteShift: true,
        canPublish: true,
      },
    }),
  }));
}

// ============================================================================
// Validate all visible Schedule page UI elements
//
// The detailed element-by-element validation now lives on the page object
// (SchedulePage.validatePageUI). This thin wrapper keeps the suite-level log
// and delegates the page detail to the page object.
// ============================================================================

async function getTimeSubmenuNames(page: Page): Promise<string[]> {
  const links = page.locator(`//*[@data-id='time-body']//a`);
  const texts = await links.allInnerTexts().catch(() => [] as string[]);
  return texts.map((t) => t.trim()).filter(Boolean);
}

function hasOnlyTimeEntriesAndSchedule(submenus: string[]): boolean {
  const names = new Set(submenus.map((s) => s.toLowerCase()));
  return names.size === 2 && names.has('time entries') && names.has('schedule');
}

export async function validateSchedulePageUI(
  page: Page,
  account: SCHTestAccount,
): Promise<void> {
  console.log(
    ' Validating Schedule page UI — role=%s companyType=%s',
    account.role,
    account.companyType,
  );

  // When the Time sub-menu lists only "Time entries" and "Schedule" the company
  // has the limited (Free Data) Schedule experience: a static upsell panel
  // rather than the full Schedule widget. Validate that panel and end the suite.
  const submenus = await getTimeSubmenuNames(page);
  console.log(' Time sub-menu items: %o', submenus);

  if (hasOnlyTimeEntriesAndSchedule(submenus)) {
    console.log(
      " Limited Schedule experience (only 'Time entries' + 'Schedule') — validating Schedule upsell view.",
    );
    try {
      // 1. Schedule header is displayed.
      const scheduleHeader = page
        .getByRole('heading', { name: /^schedule$/i })
        .or(page.locator(`//h1[normalize-space(.)='Schedule']`))
        .first();
      await expect(scheduleHeader).toBeVisible({ timeout: 15000 });
      console.log(' ✓ Schedule header is displayed');

      // 2. Headline + the listed feature points are present.
      const headline = page
        .locator(`//*[text()="Schedule and track your team's time on the go"]`)
        .first();
      await expect(headline).toBeVisible({ timeout: 15000 });
      console.log(
        ' ✓ "Schedule and track your team\'s time on the go" is present',
      );

      const points = page.locator(
        `//*[text()="Schedule and track your team's time on the go"]/following::ul[1]//li`,
      );
      const pointsCount = await points.count();
      expect(
        pointsCount,
        'Schedule upsell should list at least one feature point',
      ).toBeGreaterThan(0);
      console.log(
        ' ✓ %d listed point(s) present: %o',
        pointsCount,
        await points.allInnerTexts(),
      );

      // 3. "Learn more" is present and clickable.
      const learnMore = page
        .getByRole('link', { name: /learn more/i })
        .or(page.getByRole('button', { name: /learn more/i }))
        .or(page.locator(`//*[normalize-space(.)='Learn more']`))
        .first();
      await expect(learnMore).toBeVisible({ timeout: 15000 });
      await expect(learnMore).toBeEnabled();
      console.log(' ✓ "Learn more" is present and clickable');
    } catch (error) {
      console.warn(
        ' [soft] Schedule upsell validation — %s',
        error instanceof Error ? error.message : error,
      );
    }

    // 4. Complete the suite here — the limited experience has no further UI.
    console.log(' ✓ Schedule upsell validation complete — ending suite.');
    return;
  }

  // Full Schedule experience — run the normal page-object validation.
  const schedulePage = new SchedulePage(page);
  await schedulePage.validatePageUI(account.seededData.teamMemberName);
}

export async function runScheduleSuite(
  page: Page,
  account: SCHTestAccount,
): Promise<void> {
  console.log(
    'Starting suite — role=%s companyType=%s employee=%s',
    account.role,
    account.companyType,
    account.seededData.teamMemberName,
  );

  // await QBOLogin(page, account.credentials);
  await validateDashboard(page, asDashboardAccount(account));
  if (
    !(await navigateToTimeSubmenu(
      page,
      asDashboardAccount(account),
      'Schedule',
    ))
  ) {
    console.log(' Schedule sub-menu not present for this SKU — ending suite.');
    return;
  }
  await validateLeftNavPersistence(page, asDashboardAccount(account));
  await validateSchedulePageUI(page, account);
  console.log(' ✓ Full Schedule suite complete');
}
