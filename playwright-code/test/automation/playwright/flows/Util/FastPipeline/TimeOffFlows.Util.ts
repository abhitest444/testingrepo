import { Page } from '@playwright/test';
import TimeOffPage from '../../../pages/FastPipeline/TimeOffPage';
import { LoginCredentials } from '../../../config/types';
import { QBOLogin } from '../../../pages/QBOLogin';
import { AccountMatrix, resolveMatrixAccounts } from './accountMatrix';
import {
  DashboardAccount,
  validateDashboard,
  navigateToTimeSubmenu,
  validateTimeOffLeftNavPersistence,
} from '../../../pages/FastPipeline/DashboardPage';

// ============================================================================
// TOF01 — Time off Tab Full Suite
//
// Mirrors the SCH01 Schedule suite (ScheduleFlows.Util.ts). Covers every
// element visible on the Time off tab. The tab content renders inside the
// TSheets requests iframe (`#time_off_requests_list_frame`); the page header
// and left-nav live in the QBO shell.
// ============================================================================

// ---- Account shape ----------------------------------------------------------

export interface TOFEntitlements {
  canViewTimeOff: boolean;
  canRequestTimeOff: boolean;
  canManageTimeOff: boolean;
}

export interface TOFSeededData {
  /** Team member expected to appear in the requests list, when seeded. */
  teamMemberName: string;
}

export interface TOFTestAccount {
  credentials: LoginCredentials;
  role: 'admin' | 'manager' | 'employee' | 'vendor';
  companyType?: 'elite' | 'premium' | 'ies' | 'standard';
  rawFlavours?: string[];
  region?: 'us' | 'ca';
  entitlements: TOFEntitlements;
  seededData: TOFSeededData;
}

function asDashboardAccount(account: TOFTestAccount): DashboardAccount {
  return { role: account.role, companyType: account.companyType };
}

// ---- Factory ----------------------------------------------------------------

/**
 * Builds a fully-populated TOFTestAccount. Mirrors buildSCHAccount.
 */
export function buildTOFAccount(
  credentials: LoginCredentials,
  overrides: {
    role?: TOFTestAccount['role'];
    companyType?: TOFTestAccount['companyType'];
    entitlements?: Partial<TOFEntitlements>;
    seededData?: Partial<TOFSeededData>;
  } = {},
): TOFTestAccount {
  const resolvedCompanyType: TOFTestAccount['companyType'] =
    overrides.companyType ??
    (credentials.companyType as TOFTestAccount['companyType'] | undefined) ??
    'elite';

  return {
    credentials,
    role: overrides.role ?? 'admin',
    companyType: resolvedCompanyType,
    entitlements: {
      canViewTimeOff: true,
      canRequestTimeOff: true,
      canManageTimeOff: true,
      ...overrides.entitlements,
    },
    seededData: {
      teamMemberName: 'Test Emp1',
      ...overrides.seededData,
    },
  };
}

// ---- Account matrix ---------------------------------------------------------

/** A built {@link TOFTestAccount} paired with the account key it came from. */
export interface TOFMatrixAccount {
  /** The account key (e.g. `TOF01`) — used to label the per-account test. */
  testId: string;
  account: TOFTestAccount;
}

/**
 * Time off (TOF01) FastPipeline account matrix — same shape and resolution rules
 * as the APT/TE matrices. The shared TEST_ACCOUNT selector resolves against the
 * Time off account pool for each SKU, so the same `TEST_ACCOUNT=PR_ELITE` run that
 * exercises the elite Approvals/TE suites also runs the Time off suite against
 * TOFEL01 (companyType 'elite'). Keys missing from the active env are skipped, so
 * SKUs without a Time off account yet stay as TODO placeholders.
 */
const TOF_ACCOUNT_MATRIX: AccountMatrix = {
  // Intuit Enterprise Suite.
  IES: ['TOFES01'],
  // QBO + Time/Payroll Elite.
  PR_ELITE: ['TOFEL01'],
  // QBO + Time/Payroll Premium.
  PR_PREMIUM: ['TOFPR01'],
  // Freedata_Advanced.
  FREE_DATA_ADV: ['TOFDA01'],
  // Freedata_Essential.
  FREE_DATA_ESSENTIAL: ['TOFDE01'],
  // Freedata_Plus.
  FREE_DATA_PLUS: ['TOFDP01'],
};

/**
 * Builds the list of {@link TOFTestAccount}s the TEST_ACCOUNT selector resolves to
 * for the Time off track. Mirrors buildAPTAccountsFromMatrix: a SKU group expands to
 * that SKU's Time off accounts, an exact key resolves to a single account. Role is
 * read from each account row's metadata.
 */
export function buildTOFAccountsFromMatrix(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): TOFMatrixAccount[] {
  return resolveMatrixAccounts({
    matrix: TOF_ACCOUNT_MATRIX,
    param: selector,
    label: 'TOF',
    allowEmpty: true,
  }).map(({ testId, credentials }) => ({
    testId,
    account: buildTOFAccount(credentials, {
      role: credentials.expectedRole ?? 'admin',
      entitlements: {
        canViewTimeOff: true,
        canRequestTimeOff: true,
        canManageTimeOff: true,
      },
    }),
  }));
}

// ============================================================================
// TOF01 — Validate all visible Time off page UI elements
//
// The detailed element-by-element validation now lives on the page object
// (TimeOffPage.validatePageUI). This thin wrapper keeps the suite-level log and
// delegates the page detail to the page object.
// ============================================================================

export async function validateTimeOffPageUI(
  page: Page,
  account: TOFTestAccount,
): Promise<void> {
  console.log(
    ' Validating Time off page UI — role=%s companyType=%s',
    account.role,
    account.companyType,
  );

  const timeOffPage = new TimeOffPage(page);
  await timeOffPage.validatePageUI();
}

// ============================================================================
// TOF01 — Full suite entry point
// ============================================================================

export async function runTimeOffSuite(
  page: Page,
  account: TOFTestAccount,
): Promise<void> {
  console.log(
    'Starting Time off suite — role=%s companyType=%s',
    account.role,
    account.companyType,
  );

  // Login is performed in the spec via openQBOTETab (mirrors the Approvals suite).
  // await QBOLogin(page, account.credentials);
  await validateDashboard(page, asDashboardAccount(account));
  if (
    !(await navigateToTimeSubmenu(
      page,
      asDashboardAccount(account),
      'Time off',
    ))
  ) {
    console.log(' Time off sub-menu not present for this SKU — ending suite.');
    return;
  }
  await validateTimeOffLeftNavPersistence(
    page,
    asDashboardAccount(account),
    'Time off',
  );
  await validateTimeOffPageUI(page, account);
  console.log(' ✓ Full Time off suite complete');
}
