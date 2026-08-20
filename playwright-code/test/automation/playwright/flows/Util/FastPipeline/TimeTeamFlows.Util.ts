import { Page } from '@playwright/test';
import TimeTeamPage from '../../../pages/FastPipeline/TimeTeamPage';
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
// TTM01 — Time team Tab Full Suite
//
// Mirrors the SCH01 Schedule suite (ScheduleFlows.Util.ts). Covers every
// element visible on the Time team ("Your Team") tab. The tab content renders
// inside the QuickBooks Time widget iframe (`iframe[title="Your Team"]`); the
// page header and left-nav live in the QBO shell.
// ============================================================================

// ---- Account shape ----------------------------------------------------------

// UNUSED-FASTPIPELINE: entire interface populated by the factory but never read by TTM01 — candidate for removal
export interface TTMEntitlements {
  canViewTeam: boolean;
  canInviteTeamMembers: boolean;
  canAddTeamMembers: boolean;
}

export interface TTMSeededData {
  /** A team member expected to appear in the roster (First + Last name). */
  teamMemberFirstName: string;
  teamMemberLastName: string;
}

export interface TTMTestAccount {
  credentials: LoginCredentials;
  role: 'admin' | 'manager' | 'employee' | 'vendor';
  companyType?: 'elite' | 'premium' | 'ies' | 'standard';
  rawFlavours?: string[];
  region?: 'us' | 'ca';
  entitlements: TTMEntitlements;
  seededData: TTMSeededData;
}

function asDashboardAccount(account: TTMTestAccount): DashboardAccount {
  return { role: account.role, companyType: account.companyType };
}

// ---- Factory ----------------------------------------------------------------

/**
 * Builds a fully-populated TTMTestAccount. Mirrors buildSCHAccount / buildTOFAccount.
 */
export function buildTTMAccount(
  credentials: LoginCredentials,
  overrides: {
    role?: TTMTestAccount['role'];
    companyType?: TTMTestAccount['companyType'];
    entitlements?: Partial<TTMEntitlements>;
    seededData?: Partial<TTMSeededData>;
  } = {},
): TTMTestAccount {
  const resolvedCompanyType: TTMTestAccount['companyType'] =
    overrides.companyType ??
    (credentials.companyType as TTMTestAccount['companyType'] | undefined) ??
    'elite';

  return {
    credentials,
    role: overrides.role ?? 'admin',
    companyType: resolvedCompanyType,
    entitlements: {
      canViewTeam: true,
      canInviteTeamMembers: true,
      canAddTeamMembers: true,
      ...overrides.entitlements,
    },
    seededData: {
      teamMemberFirstName: 'Test',
      teamMemberLastName: 'Emp1',
      ...overrides.seededData,
    },
  };
}

// ---- Account matrix ---------------------------------------------------------

/** A built {@link TTMTestAccount} paired with the account key it came from. */
export interface TTMMatrixAccount {
  /** The account key (e.g. `TTM01`) — used to label the per-account test. */
  testId: string;
  account: TTMTestAccount;
}

/**
 * Time team (TTM01) FastPipeline account matrix — same shape and resolution rules
 * as the APT/TE matrices. The shared TEST_ACCOUNT selector resolves against the
 * Time team account pool for each SKU, so the same `TEST_ACCOUNT=PR_ELITE` run that
 * exercises the elite Approvals/TE suites also runs the Time team suite against
 * TTMEL01 (companyType 'elite'). Keys missing from the active env are skipped, so
 * SKUs without a Time team account yet stay as TODO placeholders.
 */
const TTM_ACCOUNT_MATRIX: AccountMatrix = {
  // Intuit Enterprise Suite.
  IES: ['TTMES01'],
  // QBO + Time/Payroll Elite.
  PR_ELITE: ['TTMEL01'],
  // QBO + Time/Payroll Premium.
  PR_PREMIUM: ['TTMPR01'],
  // Freedata_Advanced.
  FREE_DATA_ADV: ['TTMDA01'],
  // Freedata_Essential.
  FREE_DATA_ESSENTIAL: ['TTMDE01'],
  // Freedata_Plus.
  FREE_DATA_PLUS: ['TTMDP01'],
};

/**
 * Builds the list of {@link TTMTestAccount}s the TEST_ACCOUNT selector resolves to
 * for the Time team track. Mirrors buildAPTAccountsFromMatrix: a SKU group expands
 * to that SKU's Time team accounts, an exact key resolves to a single account. Role
 * is read from each account row's metadata.
 */
export function buildTTMAccountsFromMatrix(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): TTMMatrixAccount[] {
  return resolveMatrixAccounts({
    matrix: TTM_ACCOUNT_MATRIX,
    param: selector,
    label: 'TTM',
    allowEmpty: true,
  }).map(({ testId, credentials }) => ({
    testId,
    account: buildTTMAccount(credentials, {
      role: credentials.expectedRole ?? 'admin',
      entitlements: {
        canViewTeam: true,
        canInviteTeamMembers: true,
        canAddTeamMembers: true,
      },
    }),
  }));
}

// ============================================================================
// TTM01 — Validate all visible Time team page UI elements
//
// The detailed element-by-element validation now lives on the page object
// (TimeTeamPage.validatePageUI). This thin wrapper keeps the suite-level log
// and delegates the page detail to the page object.
// ============================================================================

export async function validateTimeTeamPageUI(
  page: Page,
  account: TTMTestAccount,
): Promise<void> {
  console.log(
    ' Validating Time team page UI — role=%s companyType=%s',
    account.role,
    account.companyType,
  );

  const teamPage = new TimeTeamPage(page);
  await teamPage.validatePageUI(account.seededData.teamMemberFirstName);
}

// ============================================================================
// TTM01 — Full suite entry point
// ============================================================================

export async function runTimeTeamSuite(
  page: Page,
  account: TTMTestAccount,
): Promise<void> {
  console.log(
    'Starting Time team suite — role=%s companyType=%s',
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
      'Time team',
    ))
  ) {
    console.log(' Time team sub-menu not present for this SKU — ending suite.');
    return;
  }
  await validateTimeOffLeftNavPersistence(
    page,
    asDashboardAccount(account),
    'Time team',
  );
  await validateTimeTeamPageUI(page, account);
  console.log(' ✓ Full Time team suite complete');
}
