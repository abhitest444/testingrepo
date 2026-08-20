import { Page } from '@playwright/test';
import TimeReportsPage from '../../../pages/FastPipeline/TimeReportsPage';
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
// TRP01 — Time reports Tab Full Suite
//
// Mirrors the SCH01 / TOF01 / TTM01 FastPipeline suites. Covers the Time
// reports tab landing page (two report-type cards) and the Standard reports
// page each card opens. The detailed page validation lives on the page object
// (TimeReportsPage.validatePageUI). The Time reports landing and Standard
// reports render page-level (no iframe).
// ============================================================================

// ---- Account shape ----------------------------------------------------------

export interface TRPEntitlements {
  canViewTimeReports: boolean;
}

export interface TRPTestAccount {
  credentials: LoginCredentials;
  role: 'admin' | 'manager' | 'employee' | 'vendor';
  companyType?: 'elite' | 'premium' | 'ies' | 'standard';
  rawFlavours?: string[];
  region?: 'us' | 'ca';
  entitlements: TRPEntitlements;
}

function asDashboardAccount(account: TRPTestAccount): DashboardAccount {
  return { role: account.role, companyType: account.companyType };
}

// ---- Factory ----------------------------------------------------------------

/** Builds a fully-populated TRPTestAccount. Mirrors buildTTMAccount. */
export function buildTRPAccount(
  credentials: LoginCredentials,
  overrides: {
    role?: TRPTestAccount['role'];
    companyType?: TRPTestAccount['companyType'];
    entitlements?: Partial<TRPEntitlements>;
  } = {},
): TRPTestAccount {
  const resolvedCompanyType: TRPTestAccount['companyType'] =
    overrides.companyType ??
    (credentials.companyType as TRPTestAccount['companyType'] | undefined) ??
    'elite';

  return {
    credentials,
    role: overrides.role ?? 'admin',
    companyType: resolvedCompanyType,
    entitlements: {
      canViewTimeReports: true,
      ...overrides.entitlements,
    },
  };
}

// ---- Account matrix ---------------------------------------------------------

/** A built {@link TRPTestAccount} paired with the account key it came from. */
export interface TRPMatrixAccount {
  /** The account key (e.g. `TRP01`) — used to label the per-account test. */
  testId: string;
  account: TRPTestAccount;
}

/**
 * Time reports (TRP01) FastPipeline account matrix — same shape and resolution
 * rules as the APT/TE matrices. The shared TEST_ACCOUNT selector resolves against
 * the Time reports account pool for each SKU, so the same `TEST_ACCOUNT=PR_ELITE`
 * run that exercises the elite Approvals/TE suites also runs the Time reports suite
 * against TRPEL01 (companyType 'elite'). Keys missing from the active env are
 * skipped, so SKUs without a Time reports account yet stay as TODO placeholders.
 */
const TRP_ACCOUNT_MATRIX: AccountMatrix = {
  // Intuit Enterprise Suite.
  IES: ['TRPES01'],
  // QBO + Time/Payroll Elite.
  PR_ELITE: ['TRPEL01'],
  // QBO + Time/Payroll Premium.
  PR_PREMIUM: ['TRPPR01'],
  // Freedata_Advanced.
  FREE_DATA_ADV: ['TRPDA01'],
  // Freedata_Essential.
  FREE_DATA_ESSENTIAL: ['TRPDE01'],
  // Freedata_Plus.
  FREE_DATA_PLUS: ['TRPDP01'],
};

/**
 * Builds the list of {@link TRPTestAccount}s the TEST_ACCOUNT selector resolves to
 * for the Time reports track. Mirrors buildAPTAccountsFromMatrix: a SKU group
 * expands to that SKU's Time reports accounts, an exact key resolves to a single
 * account. Role is read from each account row's metadata.
 */
export function buildTRPAccountsFromMatrix(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): TRPMatrixAccount[] {
  return resolveMatrixAccounts({
    matrix: TRP_ACCOUNT_MATRIX,
    param: selector,
    label: 'TRP',
    allowEmpty: true,
  }).map(({ testId, credentials }) => ({
    testId,
    account: buildTRPAccount(credentials, {
      role: credentials.expectedRole ?? 'admin',
      entitlements: {
        canViewTimeReports: true,
      },
    }),
  }));
}

// ============================================================================
// TRP01 — Validate all visible Time reports page UI elements + flows
//
// The detailed validation now lives on the page object
// (TimeReportsPage.validatePageUI). This thin wrapper keeps the suite-level log
// and supplies the "navigate back to Time reports" step (which depends on the
// Dashboard navigation helper) as a callback so the page object stays
// decoupled from Dashboard navigation.
// ============================================================================

export async function validateTimeReportsPageUI(
  page: Page,
  account: TRPTestAccount,
): Promise<void> {
  console.log(
    ' Validating Time reports page UI — role=%s companyType=%s',
    account.role,
    account.companyType,
  );

  const reportsPage = new TimeReportsPage(page);
  await reportsPage.validatePageUI(async () => {
    await navigateToTimeSubmenu(
      page,
      asDashboardAccount(account),
      'Time reports',
    );
  });
}

// ============================================================================
// TRP01 — Full suite entry point
// ============================================================================

export async function runTimeReportsSuite(
  page: Page,
  account: TRPTestAccount,
): Promise<void> {
  console.log(
    'Starting Time reports suite — role=%s companyType=%s',
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
      'Time reports',
    ))
  ) {
    console.log(
      ' Time reports sub-menu not present for this SKU — ending suite.',
    );
    return;
  }
  await validateTimeOffLeftNavPersistence(
    page,
    asDashboardAccount(account),
    'Time reports',
  );
  await validateTimeReportsPageUI(page, account);
  console.log(' ✓ Full Time reports suite complete');
}
