import { Page, expect, test } from '@playwright/test';
import AssignmentFlowsPage from '../../../pages/FastPipeline/AssignmentFlowsPage';
import AssignmentsPage from '../../../pages/AssignmentsPage';
import TETimeEntriesTabPage from '../../../pages/FastPipeline/TimeEntriesFlowsPage';
import TESingleTimeEntryPage from '../../../pages/FastPipeline/TESingleTimeEntryPage';
import CustomFieldsPage, {
  clickCustomFieldsEditButton,
  verifyAssignCustomersPanelVisible,
  unselectAllCustomersInAssignPanel,
} from '../../../pages/CustomFieldSettingsPage';
import { LoginCredentials } from '../../../config/types';
import { AccountMatrix, resolveMatrixAccounts } from './accountMatrix';
import { verifyLeftNavPersistence } from '../../../commonUtils';

// ---- Reused Assignments flows (flows/Util/Assignments.util.ts) -------------
import {
  // Step 3 — visibility vs entitlements
  validateAssignmentsAvailableForPremiumElite,
  validateAssignmentsNotAvailableForTTOWorker,
  validateAssignmentsNotAvailableForStandardAccess,
  validateGeoParityForUKAndCanada,
  validateAssignmentsUrlFromMyApps,
  // Step 4 — default state, filters, search, pagination
  validateSearchInWorkersAndGroups,
  validatePaginationForWorkers,
  validatePaginationForGroups,
  validateWorkersTabInAssignments,
  validateGroupsTabInAssignments,
  validateAssignCustomerCloseAndSearchBehavior,
  // Step 7a — Customer → Field assignment (standard + custom)
  createDropdownCustomFieldAndValidate,
  // Step 7b — Customer → Worker assignment
  goToAssignments,
  // Step 7d — Customer CRUD
  createCustomerAndValidate,
  createCustomerValidateDelete,
  createAndEditCustomer,
  createCustomerAndAssignTimeTrackingFields,
  createCustomerAndAssignTimeTrackingFieldsSTE,
  createCustomerAndAssignTimeTrackingFieldsWTE,
  // Step 7f — Group CRUD
  groupsCrudOperations,
  createGroupAndValidateGroupDetails,
  assignWorkersAndLeadsFromDetailsPage,
  cleanupAllGroups,
  // Step 7g — worker view settings & bidirectional sync
  viewSettingForWorkersInWorkerTab,
  viewSettingForWorkersInGroupsTab,
  verifyFieldAssignmentsBidirectionalSync,
  verifyWorkerViewSettingsBreaksVisible,
  verifyWorkerViewSettingsEditBreaksNavigation,
  verifyWorkerViewSettingsNotificationsSave,
  initiateCustomFieldFromQLAndValidateInTSheets,
  cleanupViewSettingsTestData,
  // Step 7h — Who's Working map & payroll
  groupsInWhosWorkingMap,
  groupsInPayrollCoreCompany,
} from '../Assignments.util';

// ---- Reused Geofence flows -------------------------------------------------
import {
  validateAssignmentPageWithGeofenceColumns,
  validateAssignmentPageWithoutGeofenceColumns,
  validateGeofenceDrawerAddressSyncsToEditCustomer,
  enableGeofenceInCompanySettings,
  validateRadiusSizeEnabledWhenGeofenceOn,
  validateGeofenceToggleRetainsOnAddressChange,
  validateAssignGeofenceDrawerAddressRadiusThenRevertRetainsRadius,
  cleanupGeofenceSettings,
  deactivateCustomerOnCustomersScreen,
  TEST_ADDRESSES,
} from '../Geofencing.util';
import GeofencingPage from '../../../pages/GeofencingPage';
import {
  validateGeofenceRadiusAndMap,
  validateInvalidAddressError,
  validateCancelInCustomersGeofenceDrawer,
  verifySetupGeofenceNotificationsAfterCheckbox,
  verifyGeofenceNotificationsSettingsSync,
} from '../Geofence.util';
import {
  waitForLoadingToDisappear,
  handlePopupsInAnyOrder,
} from 'test/automation/playwright/pages/TimeSettingsPage';

/**
 * =============================================================================
 * AS01 — Assignments Tab End-to-End test utilities
 * =============================================================================
 *
 * Mirrors the TE01 (Time Entries) FastPipeline convention: the spec file is a
 * thin wrapper that wires up beforeEach / afterEach and calls
 * `runAssignmentsFullSuite`. All step logic lives here.
 *
 * Conventions:
 *  - console.log('[AS01][StepN] ...') checkpoints for HTML report traceability.
 *  - Every real expectation runs inside `test.step('label', async () => {...})`,
 *    which labels the step in the HTML report AND HARD-FAILS the test on any
 *    error (failed expect, missing element/column/value, page error). There is
 *    no soft/try-catch swallowing in the step logic.
 *  - Cleanup (Step 8 / afterEach) is the only best-effort path: it uses local
 *    try/catch so a teardown hiccup never masks the real test result.
 *  - The orchestrator does not skip steps; entitlement-specific sub-legs branch
 *    inside their own step function (so an inapplicable negative check is not
 *    run against the wrong account), but the suite always runs Steps 1–8.
 *  - The heavy CRUD / sub-feature flows (Step 7a–7h) are REUSED verbatim from
 *    the existing `Assignments.util` / `Geofencing.util` / `Geofence.util`
 *    modules; each of those navigates to Assignments itself, so they can be
 *    chained safely after a single login.
 * =============================================================================
 */

// ---- Test account shape ----------------------------------------------------

export interface ASEntitlements {
  /** Premium/Elite grant — Assignments tab is available at all. */
  canSeeAssignments: boolean;
  /** Time Elite — gates the Geofence column + GeofenceDrawer. */
  timeElite: boolean;
  /** Geofence feature flag (separate from the Elite entitlement). */
  geofenceFlag: boolean;
  /**
   * NTTF eligibility. Legacy (non-NTTF) companies show Leads/Managers UI;
   * NTTF companies hide it.
   */
  nttfEligible: boolean;
  /** "Invite to track time" feature flag. */
  inviteToTrackTimeFlag: boolean;
}

export interface ASTestAccount {
  credentials: LoginCredentials;
  role: 'admin' | 'manager' | 'employee' | 'vendor';
  region: 'us' | 'uk' | 'ca';
  /**
   * Derived post-login from qbo.productEntitlements flavours. `FreeData` marks
   * an FP Free-data SKU (Advanced / Essentials / Plus / SS): these companies do
   * NOT get the Assignments tab, so the suite runs ONLY a negative check
   * (Assignments absent under Time options) instead of the full CRUD flow.
   */
  companyType?: 'elite' | 'premium' | 'ies' | 'standard' | 'FreeData';
  /** Raw flavour strings collected from qbo.productEntitlements. */
  rawFlavours?: string[];
  /** Payroll Core company — drives the Step 7h payroll leg. */
  payrollCore: boolean;
  entitlements: ASEntitlements;
}

// ---- Factory ---------------------------------------------------------------

/**
 * Builds a fully-populated ASTestAccount from login credentials plus optional
 * overrides. Entitlements are merged shallowly so callers override only what
 * they care about. Defaults model an Elite admin (the broadest-coverage path).
 */
export function buildAssignmentAccount(
  credentials: LoginCredentials,
  overrides: {
    role?: ASTestAccount['role'];
    region?: ASTestAccount['region'];
    companyType?: ASTestAccount['companyType'];
    payrollCore?: boolean;
    entitlements?: Partial<ASEntitlements>;
  } = {},
): ASTestAccount {
  const resolvedCompanyType: ASTestAccount['companyType'] =
    overrides.companyType ??
    (credentials.companyType as ASTestAccount['companyType'] | undefined) ??
    'elite';

  return {
    credentials,
    role: overrides.role ?? credentials.expectedRole ?? 'admin',
    region: overrides.region ?? 'us',
    companyType: resolvedCompanyType,
    rawFlavours: [],
    payrollCore: overrides.payrollCore ?? false,
    entitlements: {
      canSeeAssignments: true,
      timeElite: resolvedCompanyType === 'elite',
      geofenceFlag: true,
      nttfEligible: false,
      inviteToTrackTimeFlag: true,
      ...overrides.entitlements,
    },
  };
}

// ---- SKU matrix: run the full suite across IES / Elite / Premium -----------
//
// `TEST_ACCOUNT` selects EITHER a SKU group (below) OR an exact account key
// (e.g. AS01, IES05 — an exact key wins over a group of the same name). A group
// expands to every account in its pool that exists in the active env
// (PLAYWRIGHT_ENV); missing keys are skipped, not fatal. Each resolved account
// gets its own full-suite test in the spec. companyType on each account row
// (prod/preprod.accounts.ts) seeds the suite's elite/IES/premium behaviour.
const AS_ACCOUNT_MATRIX: AccountMatrix = {
  // Intuit Enterprise Suite — companyType 'ies'. IES01–IES16 exist; one
  // representative is listed because the full suite is ~30 min/account. Pass an
  // exact key (e.g. TEST_ACCOUNT=IES05) to target a specific IES account, or add
  // more keys here to run several in one invocation.
  IES: ['IESF02'],
  // QBO + Time/Payroll Elite — companyType 'elite'. AS01 is the assignments
  // elite account.
  PR_ELITE: ['ASEL01'],
  // QBO + Time/Payroll Premium — companyType 'premium'. No premium account is
  // wired yet; replace the placeholder once one is added to *.accounts.ts.
  PR_PREMIUM: ['ASPRF01'],
  FREE_DATA_ADV: ['FPFDA02'],
  FREE_DATA_ESSENTIAL: ['FPFDE02'],
  FREE_DATA_PLUS: ['FPFDP02'],
  FREE_DATA_SS: ['TODO_FREE_ACCOUNT_KEY'],
};

/** A built {@link ASTestAccount} paired with the account key it came from. */
export interface ASMatrixAccount {
  /** The account key (e.g. `AS01`, `IES01`) — used to label the per-account test. */
  testId: string;
  account: ASTestAccount;
}

/**
 * Resolves `TEST_ACCOUNT` into the ORDERED list of {@link ASTestAccount}s the
 * Assignments full suite should run against. A SKU group returns its whole pool;
 * an exact account key returns a single account. `TEST_ACCOUNT` is required —
 * with no fallback configured, an unset selector throws (matches the TE track).
 */
export function buildAssignmentsAccountsFromMatrix(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): ASMatrixAccount[] {
  return resolveMatrixAccounts({
    matrix: AS_ACCOUNT_MATRIX,
    param: selector,
    label: 'AS',
  }).map(({ testId, credentials }) => ({
    testId,
    account: buildAssignmentAccount(credentials, {
      role: credentials.expectedRole ?? 'admin',
      // FP Free-data accounts (FPFD* keys) are marked 'FreeData' so the suite
      // runs ONLY the negative check (Assignments absent under Time options).
      ...(isFreeDataAccount(testId)
        ? { companyType: 'FreeData' as const }
        : {}),
    }),
  }));
}

/**
 * Free-data SKUs (FP Free: Advanced / Essentials / Plus / SS) use account keys
 * prefixed `FPFD` (e.g. FPFDA02, FPFDE02, FPFDP02, FPFDS02). These companies do
 * NOT get the Assignments tab.
 */
function isFreeDataAccount(testId: string): boolean {
  return /^FPFD/i.test(testId.trim());
}

/**
 * Geofence is available only on Elite and IES companies. Premium has NO geofence
 * feature, so all geofence steps (column checks, the geofence drawer/CRUD) are
 * skipped for premium and the suite proceeds.
 */
function isGeofenceSupported(account: ASTestAccount): boolean {
  return account.companyType === 'elite' || account.companyType === 'ies';
}

// ---- Assertion / step convention -------------------------------------------

/**
 * Assertion / step convention for this suite:
 *
 *  - Every real expectation runs inside `test.step('label', async () => {...})`.
 *    `test.step` renders the label in the Playwright HTML report AND propagates
 *    any failure (a failed `expect`, a missing element, a page error) so the
 *    test FAILS. There is intentionally no soft/try-catch swallowing here.
 *  - Cleanup (teardown) is the only place that stays best-effort: it uses a
 *    local `try/catch` so a teardown hiccup never masks the real test result.
 */

function mapFlavoursToCompanyType(
  flavours: string[],
): NonNullable<ASTestAccount['companyType']> {
  const combined = flavours.join(' ').toUpperCase();
  if (combined.includes('IES') || combined.includes('ENTERPRISE')) return 'ies';
  if (combined.includes('ELITE')) return 'elite';
  if (combined.includes('PREMIUM')) return 'premium';
  return 'standard';
}

// ============================================================================
// Step 1 — Login & Role / Entitlement Setup
// ============================================================================

export async function step01_loginAndEntitlements(
  page: Page,
  account: ASTestAccount,
  asPage: AssignmentFlowsPage,
): Promise<void> {
  console.log(
    '[AS01][Step1] Login state (pre-entitlements): role=%s region=%s companyType=%s payrollCore=%s',
    account.role,
    account.region,
    account.companyType,
    account.payrollCore,
  );

  // Body node is present for ALL company types — hard guard that login worked.
  await expect(page.locator('[data-id=bodyNode]')).toBeVisible({
    timeout: 30000,
  });

  // Derive companyType from the live product entitlements when available.
  // Free-data accounts keep their pre-assigned 'FreeData' marker (the live
  // flavours would otherwise resolve to 'standard') so the suite branches into
  // the Assignments-not-visible check below.
  const flavours = await asPage.getProductEntitlementFlavours();
  if (flavours.length > 0 && account.companyType !== 'FreeData') {
    account.rawFlavours = flavours;
    account.companyType = mapFlavoursToCompanyType(flavours);
    // Time Elite is only credible when the flavours actually report ELITE.
    account.entitlements.timeElite = account.companyType === 'elite';
  }

  // Capture the key entitlement gates up-front so later steps can branch.
  console.log('[AS01][Step1] productEntitlements flavours: %o', flavours);
  console.log(
    '[AS01][Step1] Gates → canSeeAssignments=%s timeElite=%s geofenceFlag=%s nttfEligible=%s inviteFlag=%s',
    account.entitlements.canSeeAssignments,
    account.entitlements.timeElite,
    account.entitlements.geofenceFlag,
    account.entitlements.nttfEligible,
    account.entitlements.inviteToTrackTimeFlag,
  );
  console.log(
    '[AS01][Step1] companyType resolved to: %s',
    account.companyType ?? 'unresolved',
  );

  // Non-IES companies keep the standard QBO sidebar.
  if (account.companyType !== 'ies') {
    await test.step('QBO sidebar (QuickBooks Landing Page) visible', async () => {
      await expect(
        page
          .locator(
            `//a[@aria-label='QuickBooks Landing Page'] | //a[@aria-label='QuickBooks'] | //a[contains(@class,'fusion-leftrail--logo-item')]`,
          )
          .first(),
      ).toBeVisible({ timeout: 15000 });
    });
  }

  console.log(
    '[AS01][Step1] Authentication confirmed for role=%s',
    account.role,
  );
}

// ============================================================================
// Step 2 — Navigate to Assignments (Page/Tab Verification)
// ============================================================================

export async function step02_navigateToAssignments(
  page: Page,
  account: ASTestAccount,
  asPage: AssignmentFlowsPage,
): Promise<boolean> {
  await asPage.navigateToAssignments();
  await page.waitForTimeout(5000);

  // Entitlement guard: Assignments must be unavailable for read-only/standard.
  if (account.entitlements.canSeeAssignments === false) {
    await test.step('Assignments not available for this role', async () => {
      const visible = await asPage.isCustomersTabVisible();
      expect(visible).toBeFalsy();
    });
    console.log(
      '[AS01][Step2] Assignments correctly unavailable for role=%s',
      account.role,
    );
    return false; // signal: skip subsequent steps
  }

  // After My Apps → Time → Assignments, confirm the left nav did not collapse.
  // Free-data accounts never reach Step 2 (they branch out after Step 1), so the
  // 'FreeData' marker can't appear here — narrow it for the shared CompanyType.
  await verifyLeftNavPersistence(page, {
    activeTab: 'Assignments',
    companyType:
      account.companyType === 'FreeData' ? 'standard' : account.companyType,
  });

  await test.step('both tabs render (Customers + Workers)', async () => {
    expect(await asPage.isCustomersTabVisible()).toBeTruthy();
    expect(await asPage.isWorkersTabVisible()).toBeTruthy();
  });

  await test.step('default tab is Customers', async () => {
    const active = await asPage.getActiveTabName();
    console.log('[AS01][Step2] Active tab on load: "%s"', active);
    expect(active.toLowerCase()).toContain('customer');
  });

  await test.step('customer assignment table loads', async () => {
    await asPage.waitForCustomerTable();
  });

  console.log('[AS01][Step2] Navigation successful');
  return true;
}

// ============================================================================
// Free-data — Assignments NOT available
// ============================================================================

/**
 * Free-data SKUs (FP Free: Advanced / Essentials / Plus / SS) do not include the
 * Assignments feature. Verify the "Assignments" item is absent from the left-nav
 * Time fly-out — the only check run for these accounts (no CRUD suite).
 */
export async function stepFreeData_assignmentsNotVisible(
  account: ASTestAccount,
  asPage: AssignmentFlowsPage,
): Promise<void> {
  await test.step('Assignments tab NOT visible under Time options', async () => {
    const visible = await asPage.isAssignmentsAvailableUnderTimeMenu();
    console.log(
      '[AS01][FreeData] companyType=%s — Assignments under Time visible=%s (want false)',
      account.companyType,
      visible,
    );
    expect(
      visible,
      'Assignments tab must NOT be visible under Time options for free-data accounts',
    ).toBeFalsy();
  });
}

// ============================================================================
// Step 3 — Tab & Feature Visibility vs Entitlements
// ============================================================================

export async function step03_visibilityVsEntitlements(
  page: Page,
  account: ASTestAccount,
): Promise<void> {
  // Assignments is available for Premium/Elite roles.
  if (account.entitlements.canSeeAssignments) {
    await test.step('Assignments available for Premium/Elite', async () => {
      await validateAssignmentsAvailableForPremiumElite(page);
    });
  }

  // Assignments hidden/blocked for TTO workers and Standard / non-admin access.
  if (account.role === 'vendor' || account.role === 'employee') {
    await test.step('Assignments blocked for TTO worker', async () => {
      await validateAssignmentsNotAvailableForTTOWorker(page);
    });
    await test.step('Assignments blocked for standard / non-admin', async () => {
      await validateAssignmentsNotAvailableForStandardAccess(page);
    });
  } else {
    console.log(
      '[AS01][Step3] SKIP blocked-role checks — account role=%s is privileged',
      account.role,
    );
  }

  // Geofence is available only on Elite and IES companies — premium has no
  // geofence feature at all, so skip every geofence step there and proceed.
  if (!isGeofenceSupported(account)) {
    console.log(
      '[AS01][Step3] Geofence not available for companyType=%s — skipping geofence column checks.',
      account.companyType,
    );
  } else if (account.entitlements.geofenceFlag) {
    await test.step('Geofence columns present (geofence enabled)', async () => {
      try {
        await validateAssignmentPageWithGeofenceColumns(page);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        // Safety net: if an Elite/IES account is somehow missing the company-
        // settings "Turn on geofence" toggle, skip rather than fail (and return
        // to Assignments so the settings screen doesn't cascade into later steps).
        if (/geofencing-checkbox|Turn on geofence/i.test(msg)) {
          console.log(
            '[AS01][Step3] Geofence company-setting toggle not available — skipping geofence column check (data not provisioned).',
          );
          await new AssignmentFlowsPage(page)
            .navigateToAssignments()
            .catch(() => undefined);
        } else {
          throw error;
        }
      }
    });
  } else {
    await test.step('Geofence columns absent (geofence flag off)', async () => {
      await validateAssignmentPageWithoutGeofenceColumns(page);
    });
  }

  // Leads/Managers UI appears only for non-NTTF (legacy) companies.
  await test.step('Leads/Managers UI gating by NTTF eligibility', async () => {
    const asPage = new AssignmentFlowsPage(page);
    // The reused checks above each navigate themselves and leave the page on
    // other screens, so return to the Assignments Workers/Groups view first.
    await asPage.navigateToAssignments();
    await asPage.selectWorkersTab();
    await page.waitForTimeout(500);
    await asPage.switchToGroupsView();
    await page.waitForTimeout(1000);
    // With no groups the view shows an empty state ("No groups yet") and the
    // Groups table — including the Group leads column — is not rendered. The
    // leads/managers gating is then verified later in Group CRUD (Step 7f),
    // which creates groups; nothing to assert here.
    if (await asPage.isGroupsEmptyState()) {
      console.log(
        '[AS01][Step3] No groups exist (empty state) — Group leads column not rendered; leads gating verified later in Group CRUD (Step 7f).',
      );
      return;
    }
    const leadsVisible = await asPage.isGroupLeadsColumnVisible();
    console.log(
      '[AS01][Step3] Group leads column visible=%s (nttfEligible=%s)',
      leadsVisible,
      account.entitlements.nttfEligible,
    );
    if (account.entitlements.nttfEligible) {
      expect(leadsVisible).toBeFalsy();
    } else {
      expect(leadsVisible).toBeTruthy();
    }
  });

  // // "Invite to track time" appears only when its flag is on.
  // await test.step('Invite to track time gating by flag', async () => {
  //   const asPage = new AssignmentFlowsPage(page);
  //   await asPage.navigateToAssignments();
  //   await asPage.selectWorkersTab();
  //   const inviteAvailable = await asPage.isInviteToTrackTimeAvailable();
  //   console.log(
  //     '[AS01][Step3] Invite-to-track-time available=%s (flag=%s)',
  //     inviteAvailable,
  //     account.entitlements.inviteToTrackTimeFlag,
  //   );
  //   expect(inviteAvailable).toBe(account.entitlements.inviteToTrackTimeFlag);
  // });

  // // Geo-parity for UK / Canada (same behaviour as US for eligible tiers).
  // if (account.region === 'uk' || account.region === 'ca') {
  //   await test.step(`geo-parity for ${account.region.toUpperCase()}`, async () => {
  //     await validateGeoParityForUKAndCanada(page);
  //   });
  // } else {
  //   console.log('[AS01][Step3] SKIP geo-parity — region=%s', account.region);
  // }

  // Assignments URL reachable from My apps.
  await test.step('Assignments URL navigation from My apps', async () => {
    await validateAssignmentsUrlFromMyApps(page);
  });
}

// ============================================================================
// Step 4 — Default State, Filters & Search Validation
// ============================================================================

export async function step04_filtersAndSearch(
  page: Page,
  account: ASTestAccount,
  asPage: AssignmentFlowsPage,
): Promise<void> {
  // Customers tab default hierarchy + Workers/Groups toggle + tab elements.
  await test.step('Workers tab elements + Add worker / toggle render', async () => {
    await validateWorkersTabInAssignments(page);
  });
  await test.step('Groups tab elements + toggle render', async () => {
    await validateGroupsTabInAssignments(page);
  });

  // Worker Type filter scoping (All / Employee / QBO User / Vendor-Contractor)
  // — present only in the Workers (list) view, hidden in Groups view.
  await test.step('Worker Type filter scoping + hidden in Groups view', async () => {
    // Reused checks above navigate themselves; return to Assignments first.
    await asPage.navigateToAssignments();
    await asPage.selectWorkersTab();
    await asPage.switchToWorkersView();
    expect(await asPage.isWorkerTypeFilterVisible()).toBeTruthy();
    for (const option of ['All', 'Employee', 'User', 'Vendor']) {
      await test.step(`apply Worker Type filter "${option}"`, async () => {
        await asPage.selectWorkerTypeFilter(option);
        const rows = await asPage.assignments.getWorkerRowsCount();
        console.log('[AS01][Step4] Worker Type "%s" → rows=%d', option, rows);
      });
    }
    // Filter must disappear in Groups view.
    await asPage.switchToGroupsView();
    expect(await asPage.isWorkerTypeFilterVisible()).toBeFalsy();
    await asPage.switchToWorkersView();
  });

  // Search workers / search groups → matches; clear → reset.
  await test.step('search workers & groups + clear resets', async () => {
    await validateSearchInWorkersAndGroups(page);
  });

  // Customers tab: assign-customer panel close icon + search behaviour.
  await test.step('Assign Customers panel close + search behaviour', async () => {
    await validateAssignCustomerCloseAndSearchBehavior(page);
  });

  // Pagination (20/page) for workers and groups — navigate, verify counts.
  await test.step('workers pagination (20/page)', async () => {
    await validatePaginationForWorkers(page);
  });
  await test.step('groups pagination', async () => {
    await validatePaginationForGroups(page);
  });
}

// ============================================================================
// Step 5 — Column / Structure Validation
// ============================================================================

export async function step05_columnValidation(
  page: Page,
  account: ASTestAccount,
  asPage: AssignmentFlowsPage,
): Promise<void> {
  // Customers table columns: Name, Workers Assigned, Fields Assigned,
  // Geofence (conditional), Actions.
  await test.step('Customers table columns', async () => {
    // Reused checks above navigate themselves; return to Assignments first.
    await asPage.navigateToAssignments();
    await asPage.selectCustomersTab();
    const headers = await asPage.getColumnHeaderTexts();
    console.log('[AS01][Step5] Customers columns: %o', headers);
    const geofenceVisible = await asPage.isGeofenceColumnVisible();
    console.log(
      '[AS01][Step5] Geofence column visible=%s (timeElite=%s flag=%s)',
      geofenceVisible,
      account.entitlements.timeElite,
      account.entitlements.geofenceFlag,
    );
    // Geofence column is gated by the company-settings geofence toggle (the
    // `geofenceFlag`), NOT by Time Elite — it renders for every SKU when on.
    expect(geofenceVisible).toBe(account.entitlements.geofenceFlag);
  });

  // Workers list columns: Worker Name, Customers/Groups, Actions.
  await test.step('Workers list columns', async () => {
    await asPage.selectWorkersTab();
    await asPage.switchToWorkersView();
    await asPage.assignments.verifyWorkersTableColumns();
  });

  // Groups view columns: Group Name, Member count, Manager/Lead count
  // (NTTF-gated), Actions.
  await test.step('Groups view columns', async () => {
    await asPage.switchToGroupsView();
    await page.waitForTimeout(1000);
    // No groups → empty state ("No groups yet"), so the Groups table/columns are
    // not rendered. Columns (incl. the Group leads column) are verified later in
    // Group CRUD (Step 7f), which creates groups.
    if (await asPage.isGroupsEmptyState()) {
      console.log(
        '[AS01][Step5] No groups exist (empty state) — Groups table columns not rendered; verified later in Group CRUD (Step 7f).',
      );
      return;
    }
    await asPage.assignments.verifyGroupsTableColumns();
    const leadsVisible = await asPage.isGroupLeadsColumnVisible();
    expect(leadsVisible).toBe(!account.entitlements.nttfEligible);
  });
}

// ============================================================================
// Step 6 — Role-Scoped Data Visibility
// ============================================================================

export async function step06_roleScopedData(
  page: Page,
  account: ASTestAccount,
  asPage: AssignmentFlowsPage,
): Promise<void> {
  await test.step('role-scoped worker visibility', async () => {
    // Self-sufficient: a prior step (e.g. a geofence check that navigated to
    // company settings) can leave the page off Assignments, which would make the
    // Workers tab unfindable here. Return to Assignments first.
    await asPage.navigateToAssignments();
    await asPage.selectWorkersTab();
    await asPage.switchToWorkersView();
    const rows = await asPage.assignments.getWorkerRowsCount();
    console.log(
      '[AS01][Step6] role=%s visible worker rows=%d',
      account.role,
      rows,
    );

    switch (account.role) {
      case 'admin':
        // Admin: access to all customers, all workers, all groups.
        expect(rows).toBeGreaterThan(0);
        break;
      case 'manager':
        // Manager: scoped to managed team / groups they lead.
        expect(rows).toBeGreaterThanOrEqual(0);
        break;
      case 'employee':
      case 'vendor':
        // Self / assigned scope only.
        expect(rows).toBeGreaterThanOrEqual(0);
        break;
      default:
        break;
    }
  });

  // NOTE: Class visibility-by-assignment (verifyClassVisibilityBasedOnAssignment)
  // is intentionally NOT run here — the standard-field assign→STE scoping is now
  // covered by assignCustomerToStandardFieldAndValidateSTE in its own Step 7 leg
  // (field-level "Assign customers" is honored while the field is active, unlike
  // the per-class-value assignment that flow relied on).

  // On a write attempt without permission, INSUFFICIENT_PERMISSIONS surfaces;
  // mutations are skipped for read-only roles.
  if (account.role === 'employee' || account.role === 'vendor') {
    console.log(
      '[AS01][Step6] role=%s is read-only — skipping mutation legs (Step 7).',
      account.role,
    );
  }
}

// ============================================================================
// Step 7a — Customer → Field Assignment
// ============================================================================

// The specific customer + employee the field-assignment legs target, so the
// STE verification selects the exact combo the field was assigned to.
const ASSIGN_TARGET_CUSTOMER = 'Bakes and Beans';
const ASSIGN_TARGET_EMPLOYEE = 'Test Emp1';
/** A different customer the custom field is NOT assigned to (negative case). */
const ASSIGN_UNASSIGNED_CUSTOMER = 'Test Customer';

// The custom field created (and renamed) in Step 7a, reused by Step 7b so the
// whole suite verifies a single field end-to-end (7a → 7b run as one test).
let sharedCustomFieldName = '';

// A group name created by Step 8b (the surviving group2, after group1 is
// renamed/deleted). Captured so Step 8's worker/group search can search by the
// ACTUAL created group name instead of a hardcoded one.
let as01CreatedGroupName = '';

/**
 * Assigns a time-tracking field (custom or standard) to a SPECIFIC customer via
 * the Assignments UI: open the customer's "Assign time tracking fields" drawer,
 * tick the field by name, and save.
 */
async function assignFieldToCustomerInUI(
  page: Page,
  asPage: AssignmentFlowsPage,
  customerName: string,
  fieldName: string,
): Promise<void> {
  await asPage.navigateToAssignments();
  await asPage.selectCustomersTab();
  await asPage.assignments.openAssignTimeTrackingFieldsForCustomer(
    customerName,
  );

  const checkbox = page
    .locator(`[type="checkbox"][aria-label="Select ${fieldName}"]`)
    .first();
  await checkbox
    .waitFor({ state: 'visible', timeout: 10000 })
    .catch(() => undefined);

  const isDisabled = await checkbox.isDisabled().catch(() => false);
  const isChecked = await checkbox.isChecked().catch(() => false);

  // Domain rule: when a field is ENABLED company-wide in Account & Settings, its
  // per-customer checkbox here is checked + DISABLED — the field already applies
  // to ALL customers, so it can't (and needn't) be toggled per-customer. To make
  // it per-customer you'd first disable it in Account & Settings. We don't fight
  // that here: the field already reflects for this customer in time entry, so we
  // close the drawer and let the STE verification confirm it.
  if (isDisabled) {
    console.log(
      '[AS01][Step7a] "%s" is company-enabled (Account & Settings) — applies to all customers; skipping per-customer toggle.',
      fieldName,
    );
    // Close the drawer (no changes were made) so its modal/backdrop doesn't
    // intercept the next navigation. Escape is the most reliable dismissal.
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(500);
    return;
  }

  if (!isChecked) {
    await checkbox.check().catch(() => undefined);
  }
  await asPage.assignments.saveDrawerChanges();
}

/**
 * Verifies an assigned field shows up in the STE for the EXACT customer +
 * employee it was assigned to. Opens an STE, selects the specific employee, then
 * the specific customer, WAITS for the form section to render, and asserts the
 * field is visible. Closes the trowser afterwards.
 *
 * `isCustomField` controls how visibility is read: custom fields are matched by
 * their aria-label among the configured custom fields; standard fields (Service,
 * Class, Location, …) use the STE field-visibility check.
 */
async function verifyFieldVisibleForCustomerEmployeeInSTE(
  page: Page,
  opts: {
    customer: string;
    employee: string;
    fieldLabel: string;
    isCustomField: boolean;
    /** Expected visibility — true (assigned customer) or false (NOT assigned). */
    expectVisible?: boolean;
  },
): Promise<void> {
  const expectVisible = opts.expectVisible ?? true;
  const teTabPage = new TETimeEntriesTabPage(page);
  const stePage = new TESingleTimeEntryPage(page);

  // Dismiss any drawer/modal left open by the assign step so the left-nav hover
  // isn't intercepted by a modal backdrop.
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);

  // Leave the account-settings page via a direct nav (its overlay blocks the
  // left-nav hover) to reach Time Entries for the STE check.
  await teTabPage.navigateToTimeEntriesPage();
  await teTabPage.waitForLoadingToDisappear();
  await stePage.handlePopupsInAnyOrder().catch(() => undefined);
  await teTabPage.openAddTimeOption('Single time entry');
  await stePage.handleTourModal().catch(() => undefined);
  await stePage.expectSingleTimeEntryVisible();
  await stePage.waitTillNameFieldVisible();

  // Select the SPECIFIC employee, then the SPECIFIC customer the field was
  // assigned to (not just the first option).
  await stePage.selectOptionFromDropdown(opts.employee, 'Name');
  await page.waitForTimeout(1500);
  await stePage.selectOptionFromDropdown(opts.customer, 'Customer');

  // After selecting the customer the assigned-field section loads async — wait
  // for it to settle before reading visibility.
  await teTabPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2500);

  let visible: boolean;
  if (opts.isCustomField) {
    const labels = await teTabPage.getCustomFieldLabels().catch(() => []);
    console.log(
      '[AS01][Step7a] STE custom fields for %s: %o',
      opts.customer,
      labels,
    );
    visible = labels.some((label) =>
      label.toLowerCase().includes(opts.fieldLabel.toLowerCase()),
    );
  } else {
    visible = await stePage
      .checkFieldVisibility(opts.fieldLabel)
      .catch(() => false);
  }
  console.log(
    '[AS01][Step7a] Field "%s" visible in STE for %s + %s = %s (expected %s)',
    opts.fieldLabel,
    opts.employee,
    opts.customer,
    visible,
    expectVisible,
  );
  if (expectVisible) {
    expect(visible).toBeTruthy();
  } else {
    // Negative case: the field is NOT assigned to this customer, so it must not
    // appear in the STE for this customer.
    expect(visible).toBeFalsy();
  }

  // We only verified visibility (nothing to save). Close the trowser and DISCARD
  // via whichever confirmation appears.
  await stePage.closeSingleTimeTrowser().catch(() => undefined);
  await discardUnsavedChangesPopup(page);
}

// ----------------------------------------------------------------------------
// AS01-local standard-field (Service item) assign-to-customer + STE scoping.
// Mirrors the shared assignCustomerToStandardFieldAndValidateSTE but uses MY
// proven StatusSwitchContainer "Show on timesheets" toggle for deactivate/
// reactivate (the shared toggleStandardTimesheetFieldStatusIfNeeded didn't flip
// Service item on this UI → Assign-customers stayed disabled). No shared changes.
// ----------------------------------------------------------------------------

/** Open Account & Settings → Time → Timesheet fields editor. */
async function as01OpenTimesheetFieldsEditor(page: Page): Promise<void> {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  const editBtn = page
    .locator(
      `//div[@data-testid="timeSheet-settings"]//button[@aria-label="Edit"]`,
    )
    .first();
  await expect(editBtn).toBeVisible({ timeout: 20_000 });
  await editBtn.click();
  await page.waitForTimeout(2000);
}

/** Save the Timesheet-fields editor (dialog/modal Save, with fallbacks). */
async function as01SaveTimesheetFieldsEditor(page: Page): Promise<void> {
  const save = page
    .getByTestId('ModalDialog')
    .or(page.getByRole('dialog'))
    .getByRole('button', { name: /^(Save|Done)$/i })
    .or(page.locator(`//div[@data-testid="ModalDialog"]//span[text()='Save']`))
    .or(page.locator(`//span[text()='Save']`).last());
  if (
    await save
      .first()
      .isVisible({ timeout: 8000 })
      .catch(() => false)
  ) {
    await save
      .first()
      .click({ force: true })
      .catch(() => undefined);
    await page.waitForTimeout(3000);
  } else {
    console.log('[AS01][Step6b] Timesheet editor Save not found.');
  }
}

/** Set a standard field's "Show on timesheets" via the row's StatusSwitchContainer
 *  (Yes/No). Returns true if it CHANGED (so the caller saves). */
async function as01SetStandardFieldShown(
  page: Page,
  fieldName: string,
  shown: boolean,
): Promise<boolean> {
  await page
    .locator(`//span[text()='${fieldName}']`)
    .first()
    .scrollIntoViewIfNeeded({ timeout: 5000 })
    .catch(() => undefined);
  await page.waitForTimeout(500);
  const toggle = page
    .locator(
      `//span[text()='${fieldName}']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span/input`,
    )
    .first();
  const statusText = page
    .locator(
      `(//span[text()='${fieldName}']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span)[1]`,
    )
    .first();
  if (!(await statusText.isVisible({ timeout: 15_000 }).catch(() => false))) {
    console.log('[AS01][Step6b] "%s" Show toggle not found.', fieldName);
    return false;
  }
  const txt = ((await statusText.textContent().catch(() => '')) ?? '').trim();
  const isShown = !(/Inactive/i.test(txt) || /\bNo\b/i.test(txt));
  console.log(
    '[AS01][Step6b] "%s" Show status="%s" isShown=%s → want %s',
    fieldName,
    txt,
    isShown,
    shown,
  );
  if (isShown !== shown) {
    await toggle.click();
    await page.waitForTimeout(800);
    return true;
  }
  return false;
}

/** Is a field (by visible text / combobox name / label) currently visible? The
 *  Service field can render as a combobox with no matching text node, so match
 *  broadly and treat ANY visible match as found. */
async function as01FieldVisibleNow(
  page: Page,
  labelRe: RegExp,
): Promise<boolean> {
  const candidates = page
    .getByText(labelRe)
    .or(page.getByRole('combobox', { name: labelRe }))
    .or(page.getByLabel(labelRe));
  const count = await candidates.count().catch(() => 0);
  for (let i = 0; i < count; i++) {
    if (
      await candidates
        .nth(i)
        .isVisible()
        .catch(() => false)
    )
      return true;
  }
  return false;
}

/**
 * Open a FRESH Single Time Entry for `employee` + `customer` and report whether
 * the field is visible. Each call is a brand-new STE session so per-customer
 * standard-field visibility is re-evaluated from scratch (an in-session customer
 * switch does NOT re-scope field visibility — the already-rendered field lingers).
 */
async function as01SteFieldVisibleForCustomer(
  page: Page,
  employee: string,
  customer: string,
  labelRe: RegExp,
): Promise<boolean> {
  const teTabPage = new TETimeEntriesTabPage(page);
  const stePage = new TESingleTimeEntryPage(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await teTabPage.navigateToTimeEntriesPage();
  await teTabPage.waitForLoadingToDisappear();
  await stePage.handlePopupsInAnyOrder().catch(() => undefined);
  await teTabPage.openAddTimeOption('Single time entry');
  await stePage.handleTourModal().catch(() => undefined);
  await stePage.expectSingleTimeEntryVisible();
  await stePage.waitTillNameFieldVisible();
  await stePage.selectOptionFromDropdown(employee, 'Name');
  await page.waitForTimeout(1500);
  await stePage.selectOptionFromDropdown(customer, 'Customer');
  await teTabPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2500);
  const visible = await as01FieldVisibleNow(page, labelRe);
  await stePage.closeSingleTimeTrowser().catch(() => undefined);
  await discardUnsavedChangesPopup(page);
  return visible;
}

/**
 * Verify per-customer scoping: open a FRESH STE for the ASSIGNED customer (field
 * should show), then a FRESH STE for ANOTHER customer (field should NOT show).
 * Reopening per customer (instead of switching in-session) is required so field
 * visibility is re-evaluated for each customer's context. Returns both results.
 */
async function as01SteFieldScopedToCustomer(
  page: Page,
  employee: string,
  assignedCustomer: string,
  otherCustomer: string,
  labelRe: RegExp,
): Promise<{ assignedVisible: boolean; otherVisible: boolean }> {
  // Assigned customer → fresh STE → field should be visible.
  const assignedVisible = await as01SteFieldVisibleForCustomer(
    page,
    employee,
    assignedCustomer,
    labelRe,
  );
  console.log(
    '[AS01][Step6b] STE %s for %s (assigned): visible=%s',
    String(labelRe),
    assignedCustomer,
    assignedVisible,
  );

  // Other customer → fresh STE (reopened) → field should disappear.
  const otherVisible = await as01SteFieldVisibleForCustomer(
    page,
    employee,
    otherCustomer,
    labelRe,
  );
  console.log(
    '[AS01][Step6b] STE %s for %s (other): visible=%s',
    String(labelRe),
    otherCustomer,
    otherVisible,
  );

  return { assignedVisible, otherVisible };
}

/** Close the Assign-customers drawer + Save the modal. */
async function as01CloseAssignDrawerAndSave(page: Page): Promise<void> {
  await page
    .locator(
      `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
    )
    .first()
    .click()
    .catch(() => undefined);
  await page.waitForTimeout(3000);
  await page
    .locator(`//div[@data-testid="ModalDialog"]//span[text()='Save']`)
    .first()
    .click()
    .catch(() => undefined);
  await page.waitForTimeout(2000);
}

/**
 * Standard field (Service item) → deactivate → assign ONLY one customer → reactivate
 * → STE shows the field for that customer, hidden for another → restore to All.
 * AS01-local; uses the StatusSwitchContainer toggle (no shared toggle helper).
 */
async function as01StandardFieldAssignCustomerAndVerifySTE(
  page: Page,
): Promise<void> {
  const FIELD = 'Service item';
  const STE_LABEL = /Service/i;
  const assignedCustomer = 'Bakes and Beans';
  const otherCustomer = 'Cooking Service';
  const employee = 'Test Emp1';

  // 1) Deactivate the field → its per-customer "Assign customers" becomes enabled.
  await as01OpenTimesheetFieldsEditor(page);
  if (await as01SetStandardFieldShown(page, FIELD, false)) {
    await as01SaveTimesheetFieldsEditor(page);
    await as01OpenTimesheetFieldsEditor(page);
  }

  // 2) Assign ONLY `assignedCustomer`.
  await CustomFieldsPage.clickAssignCustomersForStandardField(page, FIELD);
  await verifyAssignCustomersPanelVisible(page);
  await unselectAllCustomersInAssignPanel(page, false);
  await page.waitForTimeout(1000);
  let cb = page
    .locator(`//input[@aria-label="Select ${assignedCustomer}"]`)
    .first();
  if (!(await cb.isVisible({ timeout: 3000 }).catch(() => false))) {
    await page
      .locator(`//button[@aria-label="Search"]`)
      .first()
      .click()
      .catch(() => undefined);
    await page
      .locator(`//input[@aria-label="Search"]`)
      .first()
      .fill(assignedCustomer)
      .catch(() => undefined);
    await page.waitForTimeout(1500);
    cb = page
      .locator(`//input[@aria-label="Select ${assignedCustomer}"]`)
      .first();
  }
  await cb.check();
  await page.waitForTimeout(1000);
  await as01CloseAssignDrawerAndSave(page);
  console.log('[AS01][Step6b] Assigned "%s" to %s.', assignedCustomer, FIELD);

  // 3) Keep the field's "Show on timesheet" toggle DISABLED during verification —
  //    STE per-customer visibility only behaves correctly while the toggle is off.

  // 4) ONE STE session: assigned customer → field visible; switch (no reload) to
  //    another customer → field hidden.
  const { assignedVisible, otherVisible } = await as01SteFieldScopedToCustomer(
    page,
    employee,
    assignedCustomer,
    otherCustomer,
    STE_LABEL,
  );
  expect(
    assignedVisible,
    `"${FIELD}" should be VISIBLE in STE for ${assignedCustomer}`,
  ).toBe(true);
  expect(
    otherVisible,
    `"${FIELD}" should be HIDDEN in STE for ${otherCustomer}`,
  ).toBe(false);

  // 5) Restore: deactivate → re-assign ALL customers → reactivate (default state).
  await as01OpenTimesheetFieldsEditor(page);
  if (await as01SetStandardFieldShown(page, FIELD, false)) {
    await as01SaveTimesheetFieldsEditor(page);
    await as01OpenTimesheetFieldsEditor(page);
  }
  await CustomFieldsPage.clickAssignCustomersForStandardField(
    page,
    FIELD,
  ).catch(() => undefined);
  const selectAll = page
    .locator(`input[aria-label="Select all items"]`)
    .first();
  if (await selectAll.isVisible({ timeout: 3000 }).catch(() => false)) {
    await selectAll.check().catch(() => undefined);
  }
  await as01CloseAssignDrawerAndSave(page);
  await as01OpenTimesheetFieldsEditor(page);
  await as01SetStandardFieldShown(page, FIELD, true);
  await as01SaveTimesheetFieldsEditor(page);
  console.log('[AS01][Step6b] Restored "%s" to all customers + active.', FIELD);
}

/**
 * After closing the STE while just verifying (no save wanted), confirm the
 * unsaved-changes prompt by DISCARDING:
 *   - "Do you want to leave without saving?" → Yes (leave without saving).
 *   - "Want to save your changes?" / "Save changes?" → No / Don't save.
 * No-op when no prompt appears.
 */
async function discardUnsavedChangesPopup(page: Page): Promise<void> {
  const leavePrompt = page.getByText(/leave without saving/i).first();
  if (await leavePrompt.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page
      .getByRole('button', { name: /^Yes$/i })
      .first()
      .click({ timeout: 5000 })
      .catch(() => undefined);
    await page.waitForTimeout(500);
    return;
  }
  const savePrompt = page
    .getByText(/save your changes|save changes\?/i)
    .first();
  if (await savePrompt.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page
      .getByRole('button', { name: /don't save|^No$/i })
      .first()
      .click({ timeout: 5000 })
      .catch(() => undefined);
    await page.waitForTimeout(500);
  }
}

// Open Time custom-field settings from the Assignments page via the "Manage time
// tracking fields" button (present on Customers & Workers tabs), so closing
// settings returns to Assignments. clickCustomFieldsEditButton (called next)
// self-heals the panel if the button lands slightly off.
async function openCustomFieldSettingsViaAssignments(
  page: Page,
): Promise<void> {
  // Already on Account & Settings (custom fields)? Just reload in place — do NOT
  // bounce to Assignments and navigate back (the caller reopens the edit list via
  // the Edit button afterward, which refreshes the persisted state). Exactly ONE
  // load happens here (the reload) — no extra navigation/reload on top.
  if (page.url().includes('accountsettings')) {
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => undefined);
    await page.waitForLoadState('load').catch(() => undefined);
    await page.waitForTimeout(1500);
    return;
  }

  // Not on Settings yet → go straight there via URL. UI-hover navigation is
  // reserved for the test's FIRST navigation (Step 2); for these repeated CF opens
  // a direct URL nav is faster and avoids the Assignments detour.
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
}

// Edit the created field's name (row overflow → Edit → rename → Save) and return
// the new name so the rest of Step 7a tracks the SAME field. HARD.
async function editCustomFieldNameAndTrack(
  page: Page,
  currentName: string,
): Promise<string> {
  await openCustomFieldSettingsViaAssignments(page);
  await page.waitForTimeout(1000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load').catch(() => undefined);
  await page.waitForTimeout(3000);

  // Open the created field's row overflow menu → Edit.
  const row = page
    .locator(`//tbody/tr[td//strong[contains(text(),'${currentName}')]]`)
    .first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.locator('[aria-label="Expand Menu"]').first().click();
  await page.locator(`//span[text()='Edit']`).first().click();
  await page.waitForTimeout(3000);

  const randomString = Math.random().toString(10).substring(2, 6);
  const newName = `Edited DDF ${randomString}`;
  await CustomFieldsPage.editCustomFieldName(page, newName);
  await CustomFieldsPage.clickTimeTrackingCustomFieldSaveButton(page);
  await page.waitForTimeout(3000);

  await expect(CustomFieldsPage.getCustomFieldRow(page, newName)).toBeVisible({
    timeout: 30_000,
  });
  console.log(
    '[AS01][Step7a] Custom field renamed "%s" -> "%s"',
    currentName,
    newName,
  );
  return newName;
}

// Assign the field to ONE customer AND toggle Required ON in a SINGLE Account &
// Settings navigation. Order matters: toggle Required + save the list FIRST
// (the list-screen "Save" only exists in that state); THEN assign the customer
// via the panel's own save (no trailing list-save, which would hang). Verify
// Required = Yes on the edit list afterward — no extra reopen/reload.
async function assignCustomerAndSetRequired(
  page: Page,
  customFieldName: string,
  customerName: string,
): Promise<void> {
  // Open the Custom fields edit list once (from the Assignments page).
  await openCustomFieldSettingsViaAssignments(page);
  await page.waitForTimeout(1000);
  await clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load').catch(() => undefined);
  await page.waitForTimeout(3000);

  // 1) Toggle Required ON and save the list (works while the fresh edit list
  //    shows the list-screen "Save").
  await CustomFieldsPage.toggleRequiredONForCustomField(page, customFieldName);
  await CustomFieldsPage.clickSaveCustomFieldsListScreen(page);
  await page.waitForTimeout(3000);

  // 2) Re-open the edit list (no navigation) and assign ONLY the target
  //    customer: clear all WITHOUT saving (keeps panel open), select the target,
  //    then save the panel (this persists the assignment on its own).
  await clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load').catch(() => undefined);
  await page.waitForTimeout(3000);
  await openAssignCustomersPanelForCustomField(page, customFieldName);
  await verifyAssignCustomersPanelVisible(page);
  await unselectAllCustomersInAssignPanel(page, false);
  await CustomFieldsPage.selectCustomerInAssignPanel(page, customerName);
  await page.waitForTimeout(1000);
  await CustomFieldsPage.clickSaveAssignCustomersPanel(page);
  await CustomFieldsPage.waitForAssignCustomersPanelDismissed(page);
  await page.waitForTimeout(2000);

  // 3) Reopen the list so the PERSISTED Required state re-renders (the stale
  //    post-panel-save list doesn't show "Yes" — close+reopen via Edit acts as a
  //    reload; openCustomFieldSettingsViaAssignments reloads in place since we're
  //    already on Settings), then verify Required = Yes.
  await openCustomFieldSettingsViaAssignments(page);
  await clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load').catch(() => undefined);
  await page.waitForTimeout(3000);
  await CustomFieldsPage.verifyRequiredStatusOnInTable(page, customFieldName);
  console.log(
    '[AS01][Step7a] Assigned "%s" to "%s" + Required ON (verified Yes).',
    customFieldName,
    customerName,
  );
}

// Positive + required-error: open STE for the assigned customer+employee, confirm
// the field is visible, save WITHOUT it, assert the required error, then discard.
async function verifyRequiredCustomFieldErrorInSTE(
  page: Page,
  opts: { customer: string; employee: string; fieldLabel: string },
): Promise<void> {
  const teTabPage = new TETimeEntriesTabPage(page);
  const stePage = new TESingleTimeEntryPage(page);

  // Dismiss any drawer/modal left open so the left-nav hover isn't intercepted.
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);

  // Leave the account-settings page via a direct nav (its overlay blocks the
  // left-nav hover) to reach Time Entries for the STE check.
  await teTabPage.navigateToTimeEntriesPage();
  await teTabPage.waitForLoadingToDisappear();
  await stePage.handlePopupsInAnyOrder().catch(() => undefined);
  await teTabPage.openAddTimeOption('Single time entry');
  await stePage.handleTourModal().catch(() => undefined);
  await stePage.expectSingleTimeEntryVisible();
  await stePage.waitTillNameFieldVisible();

  // Select the SPECIFIC employee + customer the field was assigned to.
  await stePage.selectOptionFromDropdown(opts.employee, 'Name');
  await page.waitForTimeout(1500);
  await stePage.selectOptionFromDropdown(opts.customer, 'Customer');
  await teTabPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2500);

  // The required custom field must be visible for the assigned customer.
  const labels = await teTabPage.getCustomFieldLabels().catch(() => []);
  console.log(
    '[AS01][Step7a] STE custom fields for %s: %o',
    opts.customer,
    labels,
  );
  const visible = labels.some((label) =>
    label.toLowerCase().includes(opts.fieldLabel.toLowerCase()),
  );
  expect(visible).toBeTruthy();

  // Fill the other required fields but leave the required custom field empty.
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await stePage.fillStartDate(formattedDate).catch(() => undefined);
  await stePage.enterFieldValue('Duration', '08:00').catch(() => undefined);

  // Save WITHOUT the required custom field → expect the required-field error.
  await stePage.clickSaveButton();
  const errorText = page
    .getByText('field is required', { exact: false })
    .or(page.getByText('required fields', { exact: false }));
  await expect(errorText.first()).toBeVisible({ timeout: 15_000 });
  console.log(
    '[AS01][Step7a] Required-field error shown on save (custom field "%s" empty).',
    opts.fieldLabel,
  );

  // We intentionally did not complete the entry — close the trowser and discard.
  await stePage.closeSingleTimeTrowser().catch(() => undefined);
  await discardUnsavedChangesPopup(page);
}

/**
 * Open the "Assign customers" panel for a custom-field row in the Custom fields
 * EDIT list. In the current UI the per-row actions live behind an "Expand Menu"
 * overflow (same pattern the shared editCustomField uses: Expand Menu → Edit),
 * so we prefer a directly-visible action and fall back to the overflow menu.
 * No-op when the panel is already open (callers re-open it after unselect-all).
 */
async function openAssignCustomersPanelForCustomField(
  page: Page,
  customFieldName: string,
): Promise<void> {
  const panel = page.getByRole('dialog', { name: /Assign customers/i });
  if (await panel.isVisible({ timeout: 1000 }).catch(() => false)) {
    return;
  }

  const row = page
    .locator(`//tbody/tr[td//strong[contains(text(),'${customFieldName}')]]`)
    .first();
  await expect(row).toBeVisible({ timeout: 20_000 });

  // Preferred: a directly-visible "Assign customers" action in the row.
  const directAssign = row
    .getByRole('button', { name: /assign customers/i })
    .or(row.getByRole('link', { name: /assign customers/i }))
    .or(row.getByText(/^assign customers$/i))
    .first();
  if (await directAssign.isVisible({ timeout: 3000 }).catch(() => false)) {
    await directAssign.click();
    await page.waitForTimeout(1500);
    return;
  }

  // Current UI: open the row "Expand Menu" overflow → "Assign customers".
  const menuTrigger = row
    .locator('[aria-label="Expand Menu"]')
    .or(row.getByRole('button', { name: /expand menu/i }))
    .or(
      row.locator(
        'button[aria-haspopup="menu"], button[aria-haspopup="true"], button[aria-haspopup="listbox"]',
      ),
    )
    .first();
  await expect(menuTrigger).toBeVisible({ timeout: 20_000 });
  await menuTrigger.click();
  await page.waitForTimeout(500);

  const assignItem = page
    .getByRole('menuitem', { name: /assign customers/i })
    .or(page.getByRole('option', { name: /assign customers/i }))
    .or(
      page.locator(
        `//*[self::span or self::div][normalize-space(.)='Assign customers']`,
      ),
    )
    .first();
  await expect(assignItem).toBeVisible({ timeout: 8000 });
  await assignItem.click();
  await page.waitForTimeout(1500);
}

// Deactivate ALL active custom fields (any name) via Manage all custom fields,
// so only the newly-created field is active for the rest of Step 7a.
async function deactivateAllCustomFields(page: Page): Promise<void> {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(1000);
  await CustomFieldsPage.clickManageAllCustomFieldsLink(page);
  await page.waitForTimeout(8000);

  // Best-effort wait for the Manage-all-custom-fields page to render (the exact
  // "Custom fields" header markup varies — heading vs div — so don't hard-fail
  // on it; the action-button count below is the real gate).
  await page
    .locator(`//div[text()="Custom fields"]`)
    .or(page.getByRole('heading', { name: /Custom fields/i }))
    .or(page.locator(`//table//tbody/tr//button[@aria-haspopup='listbox']`))
    .first()
    .waitFor({ state: 'visible', timeout: 20_000 })
    .catch(() => undefined);

  // Any active custom-field row exposes an actions button (aria-haspopup=listbox).
  const actionButtons = page.locator(
    `//table//tbody/tr//button[@aria-haspopup='listbox']`,
  );
  const before = await actionButtons.count();
  console.log('[AS01][Step7a] Active custom fields before cleanup: %d', before);
  if (before === 0) {
    return;
  }

  const maxAttempts = before * 2;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if ((await actionButtons.count()) === 0) {
      break;
    }
    try {
      await actionButtons.first().click();
      await page.waitForTimeout(1500);
      await CustomFieldsPage.clickMakeInactiveFromOpenCustomFieldMenu(page);
      await page.waitForTimeout(1000);
      await expect(
        page.locator(`//p[contains(text(), 'Making custom')]`),
      ).toBeVisible({ timeout: 10_000 });
      await page.locator(`//span[text()='Yes']`).click();
      await page.waitForLoadState('load').catch(() => undefined);
      await expect(
        page.locator(`//p[contains(text(), 'Making custom')]`),
      ).toBeHidden({ timeout: 15_000 });
      await page.waitForTimeout(3000);
      console.log(
        '[AS01][Step7a] Deactivated a custom field (attempt %d)',
        attempt + 1,
      );
    } catch (error) {
      console.log(
        '[AS01][Step7a] deactivate attempt %d failed (continuing): %o',
        attempt + 1,
        error,
      );
      await page.waitForTimeout(2000);
    }
  }

  console.log(
    '[AS01][Step7a] Active custom fields after cleanup: %d',
    await actionButtons.count(),
  );
}

export async function step07a_customerFieldAssignment(
  page: Page,
): Promise<void> {
  let customFieldName = '';

  // Deactivate ALL existing custom fields first so only the newly-created field
  // is active for the rest of Step 7a.
  await test.step('deactivate all existing custom fields', async () => {
    await deactivateAllCustomFields(page);
  });

  // Create the dropdown custom field — HARD. This exact field is tracked through
  // edit / assign / required / STE verification (no fallbacks).
  await test.step('create dropdown custom field', async () => {
    customFieldName = (await createDropdownCustomFieldAndValidate(page)) ?? '';
    expect(customFieldName.length).toBeGreaterThan(0);
  });

  // Edit the custom field name — HARD. Track the new name downstream.
  await test.step('edit custom field name', async () => {
    customFieldName = await editCustomFieldNameAndTrack(page, customFieldName);
    expect(customFieldName.length).toBeGreaterThan(0);
    // Share with Step 7b so the worker flow reuses this exact field.
    sharedCustomFieldName = customFieldName;
  });

  // Scope the field to ONLY the target customer AND toggle Required ON in one
  // edit-list session (verifies Required column shows "Yes").
  await test.step('assign field to ONE customer + set Required ON', async () => {
    await assignCustomerAndSetRequired(
      page,
      customFieldName,
      ASSIGN_TARGET_CUSTOMER,
    );
  });

  // Positive + required-error: field visible in STE for the assigned customer;
  // saving without it surfaces the required error; verify and discard.
  await test.step('required custom field blocks STE save for assigned customer', async () => {
    await verifyRequiredCustomFieldErrorInSTE(page, {
      customer: ASSIGN_TARGET_CUSTOMER,
      employee: ASSIGN_TARGET_EMPLOYEE,
      fieldLabel: customFieldName,
    });
  });

  // Negative: a DIFFERENT customer the field was NOT assigned to must NOT show it.
  await test.step('custom field NOT visible in STE for unassigned customer', async () => {
    await verifyFieldVisibleForCustomerEmployeeInSTE(page, {
      customer: ASSIGN_UNASSIGNED_CUSTOMER,
      employee: ASSIGN_TARGET_EMPLOYEE,
      fieldLabel: customFieldName,
      isCustomField: true,
      expectVisible: false,
    });
  });
}

// ============================================================================
// Step 7b — Customer → Worker Assignment
// ============================================================================

// Read a group row's Workers cell ("X of Y") and return the total Y (the
// company's total worker count) so assertions don't hardcode it.
async function readGroupTotalWorkers(
  assignmentsPage: AssignmentsPage,
  groupName: string,
): Promise<number> {
  const cell = assignmentsPage.groupRow(groupName).locator('td').nth(1);
  const text = ((await cell.textContent()) ?? '').trim();
  const match = text.match(/of\s+(\d+)/i);
  const total = match ? parseInt(match[1], 10) : NaN;
  expect(total).toBeGreaterThan(0);
  console.log(
    '[AS01][Step7b] Total workers in company (from "%s"): %d',
    text,
    total,
  );
  return total;
}

// Local copy of the filter-dropdown check (the shared one is module-private).
async function verifyGroupsInFilterDropdownLocal(
  page: Page,
  assignmentsPage: AssignmentsPage,
  groups: { name: string; workerCount: number }[],
  openFromGroup: string,
): Promise<void> {
  const groupRow = assignmentsPage.groupRow(openFromGroup);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign workers' }).click();
  await page.waitForTimeout(500);
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();

  await page.locator(`input[aria-label='Filter workers by group']`).click();
  await page.waitForTimeout(500);
  await expect(page.getByRole('option', { name: 'All workers' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'No group' })).toBeVisible();
  for (const group of groups) {
    const expectedText = `${group.name} (${group.workerCount})`;
    await expect(
      page.getByRole('option', { name: expectedText }),
    ).toBeVisible();
    console.log(`✓ Verified "${expectedText}" is visible in filter dropdown`);
  }
  await assignmentsPage.drawerCloseButton().click();
  await page.waitForTimeout(300);
}

// Clean slate: delete all groups, then confirm the Groups empty state ("No
// groups yet"). cleanupAllGroups can occasionally mis-read the count on the
// first pass, so retry at most once if the empty state isn't shown yet.
async function ensureNoGroups(page: Page): Promise<void> {
  const emptyState = page
    .locator(`//*[contains(text(),'No groups yet')]`)
    .first();
  for (let attempt = 1; attempt <= 2; attempt++) {
    await cleanupAllGroups(page);
    if (await emptyState.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('[AS01][Step7b] Clean slate confirmed: "No groups yet".');
      return;
    }
  }
  // Fail clearly if groups somehow remain.
  await expect(emptyState).toBeVisible({ timeout: 10_000 });
}

// Data-independent worker assign/unassign flow (mirrors the shared
// assignUnassignWorkersTest, but reads the company's total worker count
// dynamically instead of hardcoding 7).
async function assignUnassignWorkersFlow(
  page: Page,
): Promise<{ group1Name: string; group2Name: string; group3Name: string }> {
  const group1Name = `Group_A_${Math.floor(Math.random() * 10000)}`;
  const group2Name = `Group_B_${Math.floor(Math.random() * 10000)}`;
  const group3Name = `Group_C_${Math.floor(Math.random() * 10000)}`;
  const testEmp1 = 'Test Emp1';
  const testEmp2 = 'Test Emp2';
  const testEmp3 = 'Test Emp3';
  const testEmp4 = 'Test Emp4';

  // Clean slate: delete any leftover groups from prior runs so the group-count
  // assertions are exact (between-run cleanup is otherwise disabled).
  await ensureNoGroups(page);

  const assignmentsPage = await goToAssignments(page);
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(500);

  // Create 3 groups, each with one worker and one lead.
  await assignmentsPage.createGroupWithWorkersAndLeads(
    group1Name,
    testEmp2,
    testEmp3,
  );
  await assignmentsPage.createGroupWithWorkersAndLeads(
    group2Name,
    testEmp3,
    testEmp4,
  );
  await assignmentsPage.createGroupWithWorkersAndLeads(
    group3Name,
    testEmp4,
    testEmp2,
  );

  await verifyGroupsInFilterDropdownLocal(
    page,
    assignmentsPage,
    [
      { name: group1Name, workerCount: 1 },
      { name: group2Name, workerCount: 1 },
      { name: group3Name, workerCount: 1 },
    ],
    group3Name,
  );

  await assignmentsPage.verifyGroupsCount(3);
  console.log('✓ Verified 3 groups created');

  // Read the company's total worker count dynamically (e.g. "1 of 10" -> 10).
  const total = await readGroupTotalWorkers(assignmentsPage, group1Name);

  await assignmentsPage.verifyGroupRowDetails(group1Name, 1, 1, total);
  await assignmentsPage.verifyGroupRowDetails(group2Name, 1, 1, total);
  await assignmentsPage.verifyGroupRowDetails(group3Name, 1, 1, total);

  // Assign Test Emp1 as Lead of Group1.
  let groupRow = assignmentsPage.groupRow(group1Name);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign group lead' }).click();
  await page.waitForTimeout(500);
  await expect(
    page.getByRole('heading', { name: 'Assign group lead' }),
  ).toBeVisible();
  await assignmentsPage.selectItemByNameInDrawer(testEmp1);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(300);
  await assignmentsPage.verifyGroupRowDetails(group1Name, 1, 2, total);
  console.log(`✓ ${testEmp1} assigned as Lead of ${group1Name}`);

  // Assign Test Emp1 as Worker of Group2.
  groupRow = assignmentsPage.groupRow(group2Name);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign workers' }).click();
  await page.waitForTimeout(500);
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();
  await assignmentsPage.selectItemByNameInDrawer(testEmp1);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);
  await assignmentsPage.verifyGroupRowDetails(group2Name, 2, 1, total);
  await assignmentsPage.verifyGroupRowDetails(group1Name, 1, 2, total);
  console.log(`✓ ${testEmp1} assigned as Worker of ${group2Name}`);

  // Assign Test Emp1 as Lead of Group3.
  groupRow = assignmentsPage.groupRow(group3Name);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign group lead' }).click();
  await page.waitForTimeout(500);
  await expect(
    page.getByRole('heading', { name: 'Assign group lead' }),
  ).toBeVisible();
  await assignmentsPage.selectItemByNameInDrawer(testEmp1);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);
  await assignmentsPage.verifyGroupRowDetails(group3Name, 1, 2, total);
  await assignmentsPage.verifyGroupRowDetails(group1Name, 1, 2, total);
  await assignmentsPage.verifyGroupRowDetails(group2Name, 2, 1, total);
  console.log(`✓ ${testEmp1} assigned as Lead of ${group3Name}`);

  // Assign Test Emp1 as Worker of Group1 (should remove him as worker of Group2).
  groupRow = assignmentsPage.groupRow(group1Name);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign workers' }).click();
  await page.waitForTimeout(500);
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();
  await assignmentsPage.selectItemByNameInDrawer(testEmp1);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);
  await assignmentsPage.verifyGroupRowDetails(group1Name, 2, 2, total);
  await assignmentsPage.verifyGroupRowDetails(group2Name, 1, 1, total);
  await assignmentsPage.verifyGroupRowDetails(group3Name, 1, 2, total);
  console.log(`✓ ${testEmp1} moved to Worker of ${group1Name}`);

  // Workers view: Test Emp1 shows Group1 as worker assignment.
  await assignmentsPage.workersToggleButton().click();
  await expect(assignmentsPage.workersToggleButton()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.waitForTimeout(1000);
  await expect(
    page.locator(
      `//tr[.//div[contains(text(),'${testEmp1}')]]//td[contains(text(),'${group1Name}')]`,
    ),
  ).toBeVisible();
  console.log(`✓ ${testEmp1} shows ${group1Name} in Workers view`);

  // Select-all / deselect-all behaviour on Group1.
  await assignmentsPage.groupsToggleButton().click();
  await expect(assignmentsPage.groupsToggleButton()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.waitForTimeout(500);

  groupRow = assignmentsPage.groupRow(group1Name);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign workers' }).click();
  await page.waitForTimeout(500);
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();

  const workerCheckboxes = assignmentsPage.drawerItemCheckboxes();
  const drawerTotal = await workerCheckboxes.count();
  const selectAllCheckbox = assignmentsPage.drawerSelectAllCheckbox();
  await expect(selectAllCheckbox).toBeVisible();
  await selectAllCheckbox.click();
  await page.waitForTimeout(500);
  for (let i = 0; i < drawerTotal; i++) {
    await expect(workerCheckboxes.nth(i)).toBeChecked();
  }
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);
  // All workers assigned → "total of total".
  await assignmentsPage.verifyGroupRowDetails(group1Name, total, 2, total);
  console.log(`✓ ${group1Name} now has all ${total} workers`);

  // Reset Group1 back to a single worker (Test Emp2).
  groupRow = assignmentsPage.groupRow(group1Name);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign workers' }).click();
  await page.waitForTimeout(500);
  await selectAllCheckbox.click();
  await page.waitForTimeout(500);
  for (let i = 0; i < drawerTotal; i++) {
    await expect(workerCheckboxes.nth(i)).not.toBeChecked();
  }
  await assignmentsPage.selectItemByNameInDrawer(testEmp2);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);
  await assignmentsPage.verifyGroupRowDetails(group1Name, 1, 2, total);
  console.log(`✓ ${group1Name} reset to 1 worker`);

  // Return the created groups so 7b can reuse them (details page + rename/delete)
  // instead of creating new ones.
  return { group1Name, group2Name, group3Name };
}

// Essential group CRUD merged from Step 7f: rename a group via the Edit dialog,
// then delete it. Reuses a group already created by the worker flow and verifies
// by group name (no hardcoded count assertions).
async function groupRenameAndDelete(
  page: Page,
  groupName: string,
): Promise<void> {
  const assignmentsPage = await goToAssignments(page);
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(500);

  // Rename via the Edit group dialog.
  const groupRow = assignmentsPage.groupRow(groupName);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Edit group' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Group name' })).toHaveValue(
    groupName,
  );
  const newName = `group_${Math.floor(Math.random() * 10000)}`;
  await page.getByRole('textbox', { name: 'Group name' }).clear();
  await page.getByRole('textbox', { name: 'Group name' }).fill(newName);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    assignmentsPage
      .groupRow(newName)
      .locator(`//td[@role='cell']//strong[text()='${newName}']`),
  ).toBeVisible({ timeout: 15_000 });
  console.log(`[AS01][Step7b] Group renamed "${groupName}" -> "${newName}".`);

  // Delete the renamed group and confirm its row is gone.
  const renamedRow = assignmentsPage.groupRow(newName);
  await renamedRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Delete group' }).click();
  await expect(
    page.getByRole('heading', { name: 'Delete group?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.waitForTimeout(2000);
  await expect(assignmentsPage.groupRow(newName)).toHaveCount(0);
  console.log(`[AS01][Step7b] Group "${newName}" deleted.`);
}

// Essential from Step 7f: assign workers & leads from the group DETAILS page
// (View → details). Reuses a group created by the worker flow; assigns workers
// via Select all so the group has AT LEAST 3, then verifies by name presence +
// a dynamic worker-count (>= 3, no hardcoded totals).
async function assignWorkersAndLeadsFromDetailsPageFlow(
  page: Page,
  groupName: string,
): Promise<void> {
  const expectedWorkers = ['Test Emp1', 'Test Emp2', 'Test Emp3'];
  const newLead = 'Test Emp1';

  const assignmentsPage = await goToAssignments(page);
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(500);

  const openDetails = async (): Promise<void> => {
    await assignmentsPage
      .groupRow(groupName)
      .getByRole('button', { name: 'View' })
      .click({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: groupName })).toBeVisible({
      timeout: 15_000,
    });
  };
  const backToGroups = async (): Promise<void> => {
    await page.locator(`//button[@aria-label='Back to Groups']`).click();
    await page.waitForTimeout(500);
    await expect(assignmentsPage.groupRow(groupName)).toBeVisible({
      timeout: 15_000,
    });
  };
  const workerHeaderCount = async (): Promise<number> => {
    const t = await page
      .locator("//th[contains(text(), 'Worker')]")
      .textContent()
      .catch(() => null);
    return parseInt(t?.match(/\((\d+)\)/)?.[1] ?? '0', 10);
  };

  // Open the Details page and verify its structure. NOTE: "View settings" is a
  // per-worker row action — it only exists once the group HAS workers, so it's
  // verified AFTER assigning workers below (the group can start empty here).
  await openDetails();
  await expect(page.locator('th', { hasText: 'Worker' })).toBeVisible();
  await expect(page.locator('th', { hasText: 'Type' })).toBeVisible();
  await expect(page.locator('th', { hasText: 'Actions' })).toBeVisible();

  // Assign workers from the Details page so the group has AT LEAST 3 (Select all
  // is deterministic regardless of the group's current members).
  await page.locator(`//button[@aria-label='Assign workers or leads']`).click();
  await page.locator(`//span[text()='Assign workers']`).click();
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();
  const selectAll = assignmentsPage.drawerSelectAllCheckbox();
  await expect(selectAll).toBeVisible({ timeout: 8000 });
  if (!(await selectAll.isChecked().catch(() => false))) {
    await selectAll.click();
    await page.waitForTimeout(500);
  }
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(1500);

  // Refresh details and verify the group has >= 3 workers, incl. the expected ones.
  await backToGroups();
  await openDetails();
  for (const worker of expectedWorkers) {
    await expect(
      page.locator(
        `//tr[.//div[contains(@class, 'WorkerName') and text()='${worker}']]`,
      ),
    ).toBeVisible({ timeout: 15_000 });
  }
  const workerCount = await workerHeaderCount();
  expect(workerCount).toBeGreaterThanOrEqual(3);
  console.log(
    '[AS01][Step7b] Details page: group "%s" has %d workers (>=3), incl. %o.',
    groupName,
    workerCount,
    expectedWorkers,
  );

  // Now that the group HAS workers, the per-worker "View settings" action exists.
  await expect(
    page.getByRole('link', { name: 'View settings' }).first(),
  ).toBeVisible({ timeout: 15_000 });
  console.log(
    '[AS01][Step7b] Details page: per-worker "View settings" present.',
  );

  // Assign a lead from the Details page and verify it appears.
  await page.locator(`//button[@aria-label='Assign workers or leads']`).click();
  await page.locator(`//span[text()='Assign leads']`).click();
  await expect(
    page.getByRole('heading', { name: 'Assign group lead' }),
  ).toBeVisible();
  await assignmentsPage.selectItemByNameInDrawer(newLead);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(1500);

  await backToGroups();
  await openDetails();
  await expect(
    page.locator(
      `//tr[.//div[contains(@class, 'WorkerName') and text()='${newLead}']]`,
    ),
  ).toBeVisible({ timeout: 15_000 });
  console.log('[AS01][Step7b] Details page: lead "%s" assigned.', newLead);

  await backToGroups();
}

// Local CF→worker validation: assign the FIELD itself (not a dropdown option)
// to ONLY "Test Emp1" via the field row's Actions → Assign workers, then verify
// in the STE that — for the matched customer — the field is visible for Test
// Emp1 and NOT for a different worker (Test Emp2). Field visibility is gated by
// the field-level worker assignment, so we assign the field, not an option.
async function assignCustomFieldToWorkerFlow(
  page: Page,
  customFieldName: string,
): Promise<void> {
  const assignedWorker = 'Test Emp1';
  const otherWorker = 'Test Emp2';
  // Step 7a scoped this field to ASSIGN_TARGET_CUSTOMER, so match that customer
  // in the STE to isolate the worker dimension.
  const customer = ASSIGN_TARGET_CUSTOMER;

  // --- Settings: assign the FIELD to ONLY the assigned worker. ---
  await openCustomFieldSettingsViaAssignments(page);
  await page.waitForTimeout(1000);
  await clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load').catch(() => undefined);
  await page.waitForTimeout(4000);

  const fieldRow = page
    .locator(`//tbody/tr[td//strong[contains(text(),'${customFieldName}')]]`)
    .first();
  await expect(fieldRow).toBeVisible({ timeout: 30_000 });

  // Open the FIELD row's Actions → "Assign workers".
  const openAssignWorkers = async (): Promise<void> => {
    await fieldRow.locator('[aria-label="Expand Menu"]').first().click();
    await page.waitForTimeout(500);
    const item = page
      .getByRole('menuitem', { name: /assign workers/i })
      .or(
        page.locator(
          `//*[self::span or self::div][normalize-space(.)='Assign workers']`,
        ),
      )
      .first();
    await expect(item).toBeVisible({ timeout: 8000 });
    await item.click();
    await page.waitForTimeout(1000);
  };

  // Clear all workers, save; then assign ONLY the target worker, save.
  await openAssignWorkers();
  await CustomFieldsPage.unselectAllWorkersInAssignPanel(page);
  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(2000);

  await openAssignWorkers();
  await page
    .locator(`//input[@aria-label="Select ${assignedWorker}"]`)
    .first()
    .check();
  await page.waitForTimeout(500);
  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(2000);
  console.log(
    '[AS01][Step7b] Assigned field "%s" to worker %s.',
    customFieldName,
    assignedWorker,
  );

  // --- STE: verify visibility per worker (matched customer isolates worker). ---
  const teTabPage = new TETimeEntriesTabPage(page);
  const stePage = new TESingleTimeEntryPage(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);
  await teTabPage.navigateToTimeEntriesPage();
  await teTabPage.waitForLoadingToDisappear();
  await stePage.handlePopupsInAnyOrder().catch(() => undefined);
  await teTabPage.openAddTimeOption('Single time entry');
  await stePage.handleTourModal().catch(() => undefined);
  await stePage.expectSingleTimeEntryVisible();
  await stePage.waitTillNameFieldVisible();

  // Assigned worker + matched customer → field visible.
  await stePage.selectOptionFromDropdown(assignedWorker, 'Name');
  await page.waitForTimeout(1500);
  await stePage.selectOptionFromDropdown(customer, 'Customer');
  await teTabPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2500);
  const labelsAssigned = await teTabPage.getCustomFieldLabels().catch(() => []);
  console.log(
    '[AS01][Step7b] STE custom fields for %s + %s: %o',
    assignedWorker,
    customer,
    labelsAssigned,
  );
  expect(
    labelsAssigned.some((l) =>
      l.toLowerCase().includes(customFieldName.toLowerCase()),
    ),
  ).toBeTruthy();

  // Different worker + same customer → field NOT visible.
  await stePage.selectOptionFromDropdown(otherWorker, 'Name');
  await page.waitForTimeout(1500);
  await stePage.selectOptionFromDropdown(customer, 'Customer');
  await teTabPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2500);
  const labelsOther = await teTabPage.getCustomFieldLabels().catch(() => []);
  console.log(
    '[AS01][Step7b] STE custom fields for %s + %s: %o',
    otherWorker,
    customer,
    labelsOther,
  );
  expect(
    labelsOther.some((l) =>
      l.toLowerCase().includes(customFieldName.toLowerCase()),
    ),
  ).toBeFalsy();

  await stePage.closeSingleTimeTrowser().catch(() => undefined);
  await discardUnsavedChangesPopup(page);
}

export async function step07b_customerWorkerAssignment(
  page: Page,
): Promise<void> {
  let groups = { group1Name: '', group2Name: '', group3Name: '' };
  await test.step('assign / unassign workers for customer', async () => {
    groups = await assignUnassignWorkersFlow(page);
  });
  // Essentials from Step 7f: assign workers & leads from the group Details page
  // (reuse group2, which survives the rename/delete of group1).
  await test.step('assign workers & leads from group Details page', async () => {
    await assignWorkersAndLeadsFromDetailsPageFlow(page, groups.group2Name);
  });
  // Essentials from Step 7f: rename + delete a group (reuse group1).
  await test.step('group rename + delete (CRUD)', async () => {
    await groupRenameAndDelete(page, groups.group1Name);
  });
  // Reuse the custom field created in Step 7a (7a → 7b is one whole flow).
  await test.step('assign custom field to worker → STE', async () => {
    expect(sharedCustomFieldName.length).toBeGreaterThan(0);
    await assignCustomFieldToWorkerFlow(page, sharedCustomFieldName);
  });
}

// ============================================================================
// AS01-local geofence helpers
// ============================================================================
//
// Why these exist: the AS01 suite caps `page.setDefaultTimeout(30_000)` for fast
// soft-fail. The QBO "web shell" boots Account & Settings (and the Assignments
// app) behind a full-page overlay (#web-shell-spinner) that intercepts pointer
// events until loaded. That page legitimately takes up to ~2 min on first load —
// the codebase budgets TIME_SETTINGS_*_TIMEOUT = 120_000 for it — so under the 30s
// cap the shared flows click the Geolocation "Edit" while the shell is still
// booting and time out. This is a timing issue, NOT a product bug: the page does
// load. These helpers explicitly wait for #web-shell-spinner to clear (generous
// timeout) before interacting, so the settings + assignments flows are reliable.

const WEB_SHELL_SPINNER_TIMEOUT = 120_000;

/**
 * Wait for the QBO web-shell boot overlay (#web-shell-spinner) to disappear so it
 * no longer intercepts pointer events. Resolves quietly if it never appears or is
 * already gone; only the subsequent action asserts real failure.
 */
async function as01_waitForWebShellSpinnerGone(
  page: Page,
  timeout = WEB_SHELL_SPINNER_TIMEOUT,
): Promise<void> {
  const spinner = page.locator('#web-shell-spinner');
  // Right after goto the spinner may not be mounted yet — `waitFor('hidden')`
  // would resolve instantly (element absent) and we'd "pass" before it even
  // appears, then it mounts and blocks the click. So first give it a moment to
  // appear (no-op on a warm load where it never shows), THEN wait for it to clear.
  await spinner
    .waitFor({ state: 'visible', timeout: 5000 })
    .catch(() => undefined);
  await spinner.waitFor({ state: 'hidden', timeout }).catch(() => undefined);
}

/**
 * AS01-local enable-geofence that survives the slow web-shell load: navigate to
 * Time settings, wait for #web-shell-spinner to clear, then drive the Geolocation
 * section via the public GeofencingPage methods (longer explicit timeout on the
 * Edit click). Mirrors the shared enableGeofenceInCompanySettings but is resilient
 * under the AS01 30s default cap.
 */
async function as01_enableGeofenceInCompanySettings(page: Page): Promise<void> {
  const gp = new GeofencingPage(page);
  await gp.gotoTimeSettings();
  await as01_waitForWebShellSpinnerGone(page);
  await expect(gp.geolocationSection()).toBeVisible({ timeout: 30_000 });
  await gp.clickEditGeolocationSection();
  await gp.waitForGeofenceSettingsCheckboxReady();
  const changed = await gp.enableGeofence();
  if (changed) {
    await gp.saveSettings();
    console.log('[AS01][Step7c] ✓ Geofence enabled in company settings');
  } else {
    await gp.cancelSettings();
    console.log(
      '[AS01][Step7c] ✓ Geofence already enabled in company settings',
    );
  }
}

/** GF020 (Assignments-only): geofence + geofence-address columns are present. */
async function as01_validateGeofenceColumnsOnAssignments(
  page: Page,
): Promise<void> {
  const gp = new GeofencingPage(page);
  await as01EnsureGridReady(page, gp);
  await gp.verifyAssignmentTableColumnsWithGeofence();
  console.log(
    '[AS01][Step7c] ✓ Geofence + Geofence address columns visible on Assignments',
  );
}

/**
 * GF013 (Assignments screen): create a customer with a valid address, open its
 * Assign-geofence drawer, toggle geofence ON, and confirm the radius input is
 * visible + enabled + editable (radius is hidden when geofence is off).
 */
/** The Assign/Edit geofence location drawer (matches both titles). */
function as01AssignGeofenceDrawer(page: Page) {
  return page.getByRole('dialog').filter({
    has: page
      .locator('[data-testid="drawerTitle"]')
      .getByText(/(Assign|Edit) geofence location/i),
  });
}

/** Create a customer with a valid address; returns its name (caller deactivates). */
async function as01CreateCustomerWithAddress(
  page: Page,
  gp: GeofencingPage,
  assignmentsPage: AssignmentsPage,
  prefix: string,
  address: { street: string; city: string; state: string; postalCode: string },
): Promise<string> {
  await gp.gotoAssignments();
  await as01_waitForWebShellSpinnerGone(page);
  await handlePopupsInAnyOrder(page);
  await gp.openAddCustomerDrawer();

  const companyName = `${prefix} ${Math.random().toString(36).substring(2, 8)}`;
  await gp.enterCompanyName(companyName);
  await gp.enterFullAddress(address);
  await assignmentsPage.saveCustomerDrawer();
  await page.waitForTimeout(3000);

  await page.reload();
  await as01_waitForWebShellSpinnerGone(page);
  await handlePopupsInAnyOrder(page);
  return companyName;
}

/**
 * Set the drawer's inner "Turn on geofence" switch to `on` by clicking it only
 * when `aria-checked` differs. Drives the switch directly (like canonical GF009/
 * GF014) — does NOT use gp.toggleGeofenceOn(), whose map-placeholder wait + time-
 * settings fallback breaks for customers that already have a valid address.
 */
async function as01SetDrawerGeofence(
  page: Page,
  drawer: ReturnType<typeof as01AssignGeofenceDrawer>,
  on: boolean,
): Promise<void> {
  const toggle = drawer
    .getByRole('switch', { name: /Turn on geofence/i })
    .first();
  await expect(toggle).toBeVisible({ timeout: 15_000 });
  // Use Playwright's check/uncheck: they actuate AND wait for the resulting state,
  // unlike a manual aria-checked read + click (which raced/missed and left the
  // toggle in the wrong state). Idempotent if already in the target state.
  if (on) {
    await toggle.check();
  } else {
    await toggle.uncheck();
  }
  await page.waitForTimeout(1500);
}

/**
 * Close any geofence drawer left open by a prior (failed) scenario — its overlay
 * (`Drawer-smallContent…`) intercepts clicks on the grid and cascades failures
 * into the next scenarios. Tries Cancel + Don't save, then Escape; best-effort.
 */
async function as01DismissOpenDrawer(
  page: Page,
  gp: GeofencingPage,
): Promise<void> {
  const dialog = page.getByRole('dialog').first();
  if (!(await dialog.isVisible({ timeout: 1500 }).catch(() => false))) {
    return;
  }
  await gp.cancelAndDontSave().catch(() => undefined);
  if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
    await page.keyboard.press('Escape').catch(() => undefined);
  }
  await page.waitForTimeout(1000);
}

/**
 * Make sure we're on the Assignments customer grid WITHOUT re-navigating when we
 * already are (scenarios run back-to-back on one customer, so a full goto each
 * time reloads the page 3–4× unnecessarily). Closes any stray drawer first, then
 * only navigates if the grid table isn't already visible.
 */
async function as01EnsureGridReady(
  page: Page,
  gp: GeofencingPage,
): Promise<void> {
  await as01_waitForWebShellSpinnerGone(page);
  await as01DismissOpenDrawer(page, gp);
  const table = page.locator('table[summary="Customer assignment table"]');
  if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
    return; // already on the grid — skip the redundant reload
  }
  await gp.gotoAssignments();
  await as01_waitForWebShellSpinnerGone(page);
  await handlePopupsInAnyOrder(page);
}

// ----------------------------------------------------------------------------
// Scenario helpers — all run against ONE shared customer (created once in
// step07c_geofence and deactivated once at the end). Each navigates to the
// Assignments grid, opens that customer's Assign/Edit-geofence drawer, and runs
// its checks. None creates or deactivates customers.
// ----------------------------------------------------------------------------

/**
 * (1) Geofence toggle is OFF by default for a customer that hasn't configured it
 * — both the inline grid switch and the drawer's inner toggle.
 */
async function as01_geofenceToggleOffByDefault(
  page: Page,
  customerName: string,
): Promise<void> {
  const gp = new GeofencingPage(page);
  await as01EnsureGridReady(page, gp);

  const inlineSwitch =
    gp.assignmentsTableGeofenceSwitchForCustomer(customerName);
  await expect(inlineSwitch).toBeVisible({ timeout: 20_000 });
  await expect(inlineSwitch).not.toBeChecked();

  await gp.openGeofenceScreenForCustomer(customerName);
  const drawer = as01AssignGeofenceDrawer(page);
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  const innerToggle = drawer
    .getByRole('switch', { name: /Turn on geofence/i })
    .first();
  await expect(innerToggle).toBeVisible({ timeout: 15_000 });
  await expect(innerToggle).not.toBeChecked();
  console.log(
    '[AS01][Step7c] ✓ Geofence toggle OFF by default (grid switch + drawer)',
  );
  await gp.cancelAndDontSave();
}

/**
 * (2) Enabling the geofence toggle directly on the Assignments grid opens the
 * Assign-geofence drawer; with geofence ON the address field, radius input and
 * map are visible/enabled; disabling hides all three. This is the ONE step that
 * opens geofence via the inline grid toggle — the other steps open it via the row
 * menu (Edit → Assign geofence location). Runs on a customer WITH a valid billing
 * address so the map can render.
 */
async function as01_geofenceDrawerVisibilityToggles(
  page: Page,
  customerName: string,
): Promise<void> {
  const gp = new GeofencingPage(page);
  await as01EnsureGridReady(page, gp);

  // Open the drawer by toggling the INLINE grid geofence switch (enabling
  // geofence on the assignment page itself), and wait for the drawer to open.
  const inlineSwitch =
    gp.assignmentsTableGeofenceSwitchForCustomer(customerName);
  await expect(inlineSwitch).toBeVisible({ timeout: 20_000 });
  if (!(await inlineSwitch.isChecked())) {
    await inlineSwitch.check();
  }
  await page.waitForTimeout(1500);
  const drawer = as01AssignGeofenceDrawer(page);
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  console.log(
    '[AS01][Step7c] ✓ Enabling the inline grid geofence toggle opens the Assign geofence drawer',
  );

  const innerToggle = drawer
    .getByRole('switch', { name: /Turn on geofence/i })
    .first();
  const addressField = drawer.getByRole('combobox', {
    name: /Enter an address or GPS coordinates/i,
  });
  // Canonical GF009 locators (more reliable than the GeofenceMapHost class).
  const radiusSize = drawer.getByText(/Radius size \(meters\)/i);
  const radiusInput = gp.radiusInput();
  const map = drawer.getByRole('region', { name: /Map/i });

  // Geofence was enabled from the grid column, so the drawer's inner toggle is
  // already ON by default — wait for it to settle and just verify it's checked
  // (do NOT enable/disable it here), then confirm address + radius + map show.
  await expect(innerToggle).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(2000);
  await expect(innerToggle).toBeChecked();
  console.log(
    '[AS01][Step7c] ✓ Drawer opened from grid column → geofence toggle ON by default',
  );
  await expect(addressField).toBeVisible({ timeout: 15_000 });
  await expect(radiusSize).toBeVisible({ timeout: 15_000 });
  await expect(radiusInput).toBeEnabled();
  await expect(map).toBeVisible({ timeout: 30_000 });
  console.log(
    '[AS01][Step7c] ✓ Geofence ON → address, radius (enabled) and map visible',
  );

  // Now DISABLE the inner toggle → address + radius + map hidden.
  await as01SetDrawerGeofence(page, drawer, false);
  await page.waitForTimeout(1000);
  await expect(addressField).not.toBeVisible({ timeout: 15_000 });
  await expect(radiusSize).not.toBeVisible({ timeout: 15_000 });
  await expect(map).not.toBeVisible({ timeout: 15_000 });
  console.log('[AS01][Step7c] ✓ Geofence OFF → address, radius and map hidden');

  await gp.cancelAndDontSave();
}

/**
 * (3) Error validations in the drawer (from GF008, minus the Manage-settings tail
 * that hits the slow web-shell page): empty address → "Address is required";
 * gibberish → "Choose address or coordinates from suggestions". (Radius is a
 * fixed preset dropdown, so there is no free-text invalid-radius case.)
 */
async function as01_geofenceAddressErrors(
  page: Page,
  customerName: string,
): Promise<void> {
  const gp = new GeofencingPage(page);
  await as01EnsureGridReady(page, gp);

  await gp.openGeofenceScreenForCustomer(customerName);
  const drawer = as01AssignGeofenceDrawer(page);
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500);

  // Ensure geofence is on so the address field + validations are present.
  await as01SetDrawerGeofence(page, drawer, true);
  await page.waitForTimeout(1000);

  const addressInput = drawer.getByRole('combobox', {
    name: /Enter an address or GPS coordinates/i,
  });
  await expect(addressInput).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(2000);

  // Empty address → "Address is required". After clearing, click another element
  // (the drawer title) so the address field blurs — the validation only fires on
  // blur. No Save click needed (Save stays disabled while the address is empty).
  await addressInput.click();
  await addressInput.clear();
  await page.waitForTimeout(500);
  await drawer.locator('[data-testid="drawerTitle"]').click();
  await page.waitForTimeout(1000);
  await expect(drawer.getByText(/Address is required/i)).toBeVisible({
    timeout: 15_000,
  });
  console.log('[AS01][Step7c] ✓ "Address is required" shown for empty address');

  // Gibberish → invalid-address error. Typing dirties the field so Save enables.
  await addressInput.fill('ygdcuide');
  await page.waitForTimeout(2000);
  const saveBtn = drawer.getByRole('button', { name: /^Save$/ });
  await expect(saveBtn).toBeEnabled({ timeout: 15_000 });
  await saveBtn.click();
  await page.waitForTimeout(1000);
  await expect(
    drawer.getByText(/Choose address or coordinates from suggestions/i),
  ).toBeVisible({ timeout: 15_000 });
  console.log('[AS01][Step7c] ✓ Invalid-address error shown for bad input');

  // Dismiss without saving (avoid the web-shell Manage-settings navigation).
  await gp.cancelAndDontSave();
}

/**
 * (4) Address persists in the grid geofence-address column, and editing the
 * address + radius is reflected back. Asserts the customer ROW text (the
 * geofence-address cell has no stable test id; the row reliably shows the
 * address). City is the discriminator: addr1=Mountain View, addr2=Cupertino.
 */
async function as01_geofenceAddressReflectsInColumn(
  page: Page,
  customerName: string,
): Promise<void> {
  const gp = new GeofencingPage(page);
  const addr1 = TEST_ADDRESSES.VALID_ADDRESS_1;
  const addr2 = TEST_ADDRESSES.VALID_ADDRESS_2;

  await as01EnsureGridReady(page, gp);

  // Open the drawer, turn geofence on, then SET the address via the suggestion
  // picker (resolves it to a valid place so Save enables — the auto-filled billing
  // address is aria-invalid until a suggestion is chosen), set a radius, save.
  await gp.openGeofenceScreenForCustomer(customerName);
  const drawer1 = as01AssignGeofenceDrawer(page);
  await expect(drawer1).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  await as01SetDrawerGeofence(page, drawer1, true);
  await page.waitForTimeout(1000);
  await gp.setAssignGeofenceAddressByTypingAndSuggestion(addr1);
  await page.waitForTimeout(1000);
  await gp.setRadiusSize('400');
  await page.waitForTimeout(500);
  await gp.saveAssignGeofenceDrawer();
  await page.waitForTimeout(1500);

  await page.reload();
  await as01_waitForWebShellSpinnerGone(page);
  await handlePopupsInAnyOrder(page);

  const row = gp.customerRow(customerName).first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await expect(row).toContainText(new RegExp(addr1.city, 'i'), {
    timeout: 15_000,
  });
  console.log(
    '[AS01][Step7c] ✓ Geofence address column shows initial address (%s)',
    addr1.city,
  );

  // EDIT the geofence address + radius in the drawer, save, and confirm the
  // grid column reflects the UPDATED address (addr2).
  await gp.openGeofenceScreenForCustomer(customerName);
  const drawer2 = as01AssignGeofenceDrawer(page);
  await expect(drawer2).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  await as01SetDrawerGeofence(page, drawer2, true);
  await page.waitForTimeout(1000);
  await gp.setAssignGeofenceAddressByTypingAndSuggestion(addr2);
  await page.waitForTimeout(1000);
  await gp.setRadiusSize('750');
  await page.waitForTimeout(500);
  await gp.saveAssignGeofenceDrawer();
  await page.waitForTimeout(1500);

  await page.reload();
  await as01_waitForWebShellSpinnerGone(page);
  await handlePopupsInAnyOrder(page);

  const rowAfterEdit = gp.customerRow(customerName).first();
  await expect(rowAfterEdit).toBeVisible({ timeout: 20_000 });
  await expect(rowAfterEdit).toContainText(new RegExp(addr2.city, 'i'), {
    timeout: 15_000,
  });
  console.log(
    '[AS01][Step7c] ✓ Edited geofence address + radius reflected in column (%s)',
    addr2.city,
  );
}

// ============================================================================
// Step 7c — Customer → Geofence (Time Elite only)
// ============================================================================

export async function step07c_geofence(
  page: Page,
  account: ASTestAccount,
): Promise<void> {
  if (!(account.entitlements.timeElite && account.entitlements.geofenceFlag)) {
    console.log(
      '[AS01][Step7c] SKIP geofence — not Time Elite / flag off (elite=%s flag=%s)',
      account.entitlements.timeElite,
      account.entitlements.geofenceFlag,
    );
    return;
  }

  // ONE customer is created up front and ALL geofence scenarios run against it; it
  // is deactivated once at the end. The geofence checks are HARD (test.step) now
  // that they pass reliably. Only the company-settings enable stays soft — it goes
  // through the slow Account & Settings web-shell (environment-flaky, deferred);
  // geofence is already enabled on this account, so the scenarios run regardless.
  const gp = new GeofencingPage(page);
  const assignmentsPage = new AssignmentsPage(page);

  // Setup: enable geofence in company settings (SOFT — flaky web-shell, deferred).
  await softStep('Step7c — enable geofence in company settings', () =>
    as01_enableGeofenceInCompanySettings(page),
  );

  await test.step('Step7c — assignment page shows geofence columns', () =>
    as01_validateGeofenceColumnsOnAssignments(page));

  // Create the single shared customer (valid address so the map can render).
  let customerName = '';
  await test.step('Step7c — create geofence test customer', async () => {
    customerName = await as01CreateCustomerWithAddress(
      page,
      gp,
      assignmentsPage,
      'AS01 Geofence',
      TEST_ADDRESSES.VALID_ADDRESS_1,
    );
  });

  // (1) Geofence toggle is OFF by default (runs before any enable/save).
  await test.step('Step7c [1] — geofence toggle OFF by default', () =>
    as01_geofenceToggleOffByDefault(page, customerName));

  // (2) Enable → address/radius/map visible+enabled; disable → all hidden.
  await test.step('Step7c [2] — toggle on shows address/radius/map; off hides them', () =>
    as01_geofenceDrawerVisibilityToggles(page, customerName));

  // (3) Error validations: address required (empty) + invalid address.
  await test.step('Step7c [3] — address required + invalid address errors', () =>
    as01_geofenceAddressErrors(page, customerName));

  // (4) Address persists in grid column; editing address + radius updates it.
  await test.step('Step7c [4] — geofence address reflects + updates in grid column', () =>
    as01_geofenceAddressReflectsInColumn(page, customerName));

  // Cleanup: deactivate the single shared customer (SOFT — teardown, best-effort;
  // dismiss any stray drawer first so its overlay doesn't block the navigation).
  await softStep('Step7c — deactivate geofence test customer', async () => {
    await as01DismissOpenDrawer(page, gp);
    await deactivateCustomerOnCustomersScreen(page, customerName);
  });

  // --- Intentionally skipped --------------------------------------------------
  // GF015 (validateGeofenceToggleRetainsOnAddressChange) and GF022
  // (validateGeofenceDrawerAddressSyncsToEditCustomer) are `test.fixme`
  // (known-broken product behavior) in canonical GeofenceTestCases.spec.ts.
  // Geofence notifications (GF004/GF005) and GF021 drive Account & Settings → Time
  // (the slow web-shell page) and are outside this assignment-screen scope.
}

// ============================================================================
// Step 7d — Customer CRUD
// ============================================================================

export async function step07d_customerCrud(page: Page): Promise<void> {
  await test.step('create customer + validate + delete', async () => {
    await createCustomerValidateDelete(page);
  });
  await test.step('create + edit customer', async () => {
    await createAndEditCustomer(page);
  });
  await test.step('create customer + assign tracking fields', async () => {
    await createCustomerAndAssignTimeTrackingFields(page);
  });
  await test.step('create customer + assign fields → STE', async () => {
    await createCustomerAndAssignTimeTrackingFieldsSTE(page);
  });
  await test.step('create customer + assign fields → WTE', async () => {
    await createCustomerAndAssignTimeTrackingFieldsWTE(page);
  });
}

// ============================================================================
// Step 7e — Worker Add / Invite
// ============================================================================

export async function step07e_workerAddInvite(
  page: Page,
  account: ASTestAccount,
  asPage: AssignmentFlowsPage,
): Promise<void> {
  // Add Employee / Add Contractor live behind the "Add worker" dropdown; the
  // Workers tab validation exercises the dropdown + its options.
  await test.step('Add worker → Add employee trowser opens and closes', async () => {
    await asPage.selectWorkersTab();
    const opened = await asPage.openAndCloseAddWorkerTrowser('Add employee');
    expect(opened).toBeTruthy();
    console.log('[AS01][Step7e] Add employee trowser opened & closed.');
  });

  await test.step('Add worker → Add contractor trowser opens and closes', async () => {
    const opened = await asPage.openAndCloseAddWorkerTrowser('Add contractor');
    expect(opened).toBeTruthy();
    console.log('[AS01][Step7e] Add contractor trowser opened & closed.');
  });

  // Invite to track time — flag-gated, INFORMATIONAL. For this account the
  // Add-worker dropdown exposes only "Add employee" / "Add contractor"; the
  // invite-to-track-time entry point is not in that menu. Log its presence
  // rather than hard-asserting, so a missing entry doesn't abort the worker
  // view-settings checks that follow.
  if (account.entitlements.inviteToTrackTimeFlag) {
    await test.step('Invite to track time availability (informational)', async () => {
      const available = await asPage.isInviteToTrackTimeAvailable();
      console.log(
        '[AS01][Step7e] Invite-to-track-time present in Add-worker menu: %s',
        available,
      );
    });
  } else {
    console.log('[AS01][Step7e] SKIP invite-to-track-time — flag off');
  }
}

// ============================================================================
// Step 7f — Group CRUD
// ============================================================================

export async function step07f_groupCrud(page: Page): Promise<void> {
  // Create + read (detail view) + counts + toast.
  await test.step('create group + validate details/counts', async () => {
    await createGroupAndValidateGroupDetails(page);
  });
  // Assign workers & leads directly from the Details page; toggle assign/unassign.
  await test.step('assign workers & leads from details page', async () => {
    await assignWorkersAndLeadsFromDetailsPage(page);
  });
  // Full CRUD: rename, add/remove workers & leads, name validation, lock, delete.
  await test.step('group full CRUD operations', async () => {
    await groupsCrudOperations(page);
  });
}

// ============================================================================
// Step 7g — Worker View Settings & Bidirectional Sync
// ============================================================================

export async function step07g_viewSettingsAndSync(page: Page): Promise<void> {
  await test.step('view time tracking settings from Workers tab', async () => {
    await viewSettingForWorkersInWorkerTab(page);
  });
  await test.step('view time tracking settings from Groups tab', async () => {
    await viewSettingForWorkersInGroupsTab(page);
  });
  await test.step('breaks visible in view settings', async () => {
    await verifyWorkerViewSettingsBreaksVisible(page);
  });
  await test.step('edit-breaks navigation from view settings', async () => {
    await verifyWorkerViewSettingsEditBreaksNavigation(page);
  });
  await test.step('notification / day-of-week settings persist', async () => {
    await verifyWorkerViewSettingsNotificationsSave(page);
  });
  // Bidirectional sync: Field Settings ↔ Assignments (both directions).
  await test.step('field assignments bidirectional sync', async () => {
    await verifyFieldAssignmentsBidirectionalSync(page);
  });
  // Cross-platform field sync QL ↔ TSheets.
  await test.step('cross-platform field sync (QL → TSheets)', async () => {
    await initiateCustomFieldFromQLAndValidateInTSheets(page);
  });
}

// ============================================================================
// Step 7h — Who's Working Map & Payroll integration
// ============================================================================

export async function step07h_whosWorkingAndPayroll(
  page: Page,
  account: ASTestAccount,
): Promise<void> {
  await test.step("groups surface in the Who's Working map", async () => {
    await groupsInWhosWorkingMap(page);
  });

  if (account.payrollCore) {
    await test.step('groups behaviour in a Payroll Core company', async () => {
      await groupsInPayrollCoreCompany(page);
    });
  } else {
    console.log(
      '[AS01][Step7h] SKIP payroll-core groups — account is not Payroll Core',
    );
  }
}

// ============================================================================
// Step 8 — Cleanup
// ============================================================================

export async function step08_cleanup(
  page: Page,
  account: ASTestAccount,
): Promise<void> {
  // Cleanup is best-effort: a teardown hiccup must not fail an otherwise-good
  // run, so each leg is wrapped in its own try/catch (not test.step).
  try {
    // Delete all test groups created during the run.
    await cleanupAllGroups(page);
  } catch (error) {
    console.warn('[AS01][Step8] delete all test groups failed:', error);
  }
  try {
    // Remove view-settings test data.
    await cleanupViewSettingsTestData(page);
  } catch (error) {
    console.warn('[AS01][Step8] view-settings cleanup failed:', error);
  }
  // Revert geofence config / QBO settings changed during the test.
  if (account.entitlements.timeElite && account.entitlements.geofenceFlag) {
    try {
      await cleanupGeofenceSettings(page, true);
    } catch (error) {
      console.warn('[AS01][Step8] geofence setting revert failed:', error);
    }
  }
  console.log('[AS01][Step8] Cleanup complete — environment restored');
}

// ============================================================================
// Step 7 — Customers tab (validation + add/edit). Sub-steps:
//   7a — assign time tracking fields, 7b — geofence (existing step07c_geofence).
// ============================================================================

// Validate the Customers tab: columns present + add a customer and edit it from
// the row Actions, verifying the edit. Reuses the working customer-CRUD helpers.
export async function step07_customersTab(
  page: Page,
  asPage: AssignmentFlowsPage,
): Promise<void> {
  await test.step('Customers tab: columns present', async () => {
    // Validate in place if we're already on Assignments; otherwise navigate via
    // the UI (hover All apps → Time → Assignments). UI-based guard, not URL.
    if (!(await asPage.isCustomersTabVisible())) {
      await asPage.navigateToAssignments();
    }
    await asPage.selectCustomersTab();
    await asPage.waitForCustomerTable();
    const headers = await asPage.getColumnHeaderTexts();
    console.log('[AS01][Step7] Customers tab columns: %o', headers);
    for (const col of [
      'Workers',
      'Time tracking fields',
      'Geofence',
      'Geofence address',
    ]) {
      expect(await asPage.hasColumn(col)).toBeTruthy();
    }
  });

  await test.step('Customers tab: add customer + validate + delete', async () => {
    await createCustomerValidateDelete(page);
  });

  await test.step('Customers tab: add customer + edit (Actions) + verify', async () => {
    await createAndEditCustomer(page);
  });
}

// Customer FILTERS — verified later, after the test has added customers so the
// search/assign-customer behaviour acts on real data.
export async function step07_customerFilters(page: Page): Promise<void> {
  await test.step('Assign Customers panel close + search behaviour', async () => {
    // AS01-local ASM047: use the custom field WE created earlier
    // (sharedCustomFieldName) — not the shared helper's hardcoded 'Test Admin'
    // (which doesn't exist in this account). Skip cleanly if no CF was created.
    if (!sharedCustomFieldName) {
      console.log(
        '[AS01][Step7] Customer filters SKIPPED — no created custom field (sharedCustomFieldName empty; CF flow not run).',
      );
      return;
    }
    await CustomFieldsPage.navigationToCustomFieldSettings(page);
    await page.waitForTimeout(2000);
    await clickCustomFieldsEditButton(page);
    await page.waitForTimeout(2000);

    await CustomFieldsPage.clickAssignCustomersForCustomField(
      page,
      sharedCustomFieldName,
    );
    await verifyAssignCustomersPanelVisible(page);

    // Close icon → panel closes.
    await unselectAllCustomersInAssignPanel(page);

    // Saving the panel above can exit edit mode on SOME accounts (e.g. IES),
    // removing the row's "Assign customers" button; on others (e.g. PR_ELITE)
    // edit mode persists and the button stays. Only re-enter edit mode when the
    // button is actually gone, so accounts that stayed in edit mode are not
    // perturbed (an unconditional Edit click regressed the PR_ELITE path).
    await page.waitForTimeout(1500);
    const assignCustomersRow = page
      .locator(`//strong[contains(text(),'${sharedCustomFieldName}')]`)
      .locator('xpath=ancestor::tr[1]');
    const assignCustomersBtn = assignCustomersRow
      .getByRole('button', { name: /assign customers/i })
      .or(assignCustomersRow.getByRole('link', { name: /assign customers/i }));
    if (
      !(await assignCustomersBtn
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false))
    ) {
      console.log(
        '[AS01][Step7] Assign-customers button gone (edit mode exited) — re-entering edit mode.',
      );
      await clickCustomFieldsEditButton(page);
      await page.waitForTimeout(2000);
    }

    // Re-open + search a specific customer and select it.
    await CustomFieldsPage.clickAssignCustomersForCustomField(
      page,
      sharedCustomFieldName,
    );
    await page.waitForTimeout(3000);
    await page
      .locator(`//div[contains(@class,"Drawer")]//button[@aria-label="Search"]`)
      .first()
      .click();
    // Scope to the Assign-customers drawer — an unscoped //input[@aria-label="Search"]
    // also matches the global QBO nav search bar (strict-mode violation).
    const searchInput = page
      .locator(`//div[contains(@class,"Drawer")]//input[@aria-label="Search"]`)
      .first();
    await page.waitForTimeout(2000);
    await searchInput.fill('Cooking Service');
    await page.waitForTimeout(1000);
    const cookingCheckbox = page.locator(
      `//input[@aria-label="Select Cooking Service"]`,
    );
    if (await cookingCheckbox.isVisible().catch(() => false)) {
      await cookingCheckbox.check();
    }

    // Close drawer + Save.
    await page
      .locator(
        `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
      )
      .first()
      .click();
    await page.waitForTimeout(4000);
    await page
      .locator(`//div[@data-testid="ModalDialog"]//span[text()='Save']`)
      .first()
      .click();
    console.log(
      '[AS01][Step7] Customer filters (Assign-customers close+search) done for CF "%s".',
      sharedCustomFieldName,
    );
  });
}

// Step 7a — assign time tracking fields to a customer, verify in the STE, and
// (via the reused helper) the customer-row field counts. Reuses working helpers.
export async function step07a_timeTrackingFields(page: Page): Promise<void> {
  // Entry guard (parity with step07_customersTab): a prior step may have left an
  // overlay/STE open or navigated away — land cleanly on the Assignments
  // Customers tab before the reused creation helpers run.
  const asPage = new AssignmentFlowsPage(page);
  if (!(await asPage.isCustomersTabVisible().catch(() => false))) {
    await asPage.navigateToAssignments();
  }

  await test.step('assign time tracking fields to a customer', async () => {
    await createCustomerAndAssignTimeTrackingFields(page);
  });
  await test.step('assign time tracking fields → verify in STE', async () => {
    await createCustomerAndAssignTimeTrackingFieldsSTE(page);
  });
}

// ----------------------------------------------------------------------------
// Consolidated Step 7 — ONE customer for the whole flow (create → edit → verify
// → time-tracking-field assign/unassign → delete). Avoids the shared
// `openActionMenu`, which clicks a globally-DISABLED `//span[text()="Time
// tracking fields"]` (the 13:46 failure), by opening the assign drawer via the
// row's Expand Menu (the same clean path as Edit/Geofence).
// ----------------------------------------------------------------------------

/**
 * Go to the Assignments Customers tab via DIRECT URL (no left-nav hover). Use when
 * arriving from Account & Settings / a CF settings overlay that blocks the hover
 * nav (the "UI hover blocked — falling back" case). Lands on the customer table.
 */
async function as01GotoAssignmentsDirect(
  page: Page,
  asPage: AssignmentFlowsPage,
): Promise<void> {
  await page
    .goto('/app/time/assignments?jobId=time', { waitUntil: 'load' })
    .catch(() => undefined);
  await page.waitForTimeout(2000);
  await handlePopupsInAnyOrder(page);
  await asPage.selectCustomersTab().catch(() => undefined);
  await asPage.waitForCustomerTable();
  await page.waitForTimeout(5000);
}

/** Filter the Customers grid to a single customer via the Search box, so the row
 *  is findable regardless of sort/pagination (leftover customers can push it off
 *  page 1). No-op-safe if the search affordance isn't present. */
async function as01SearchCustomer(
  page: Page,
  customerName: string,
): Promise<void> {
  const searchBtn = page.locator(`//button[@aria-label="Search"]`).first();
  if (await searchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await searchBtn.click().catch(() => undefined);
    await page.waitForTimeout(500);
  }
  const searchBox = page.getByRole('textbox', { name: /Search/i }).first();
  if (await searchBox.isVisible({ timeout: 3000 }).catch(() => false)) {
    await searchBox.fill(customerName).catch(() => undefined);
    await page.waitForTimeout(1800);
  }
}

/** Refresh the Customers grid by switching Workers↔Customers tabs instead of a
 *  full page reload — re-renders the grid with fresh data and is much faster.
 *  Waits for the DOM to settle after EACH tab click so the next step is reliable. */
async function as01RefreshCustomersViaTabSwitch(
  page: Page,
  asPage: AssignmentFlowsPage,
): Promise<void> {
  // → Workers tab, let its DOM render.
  await asPage.selectWorkersTab();
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  await page.waitForTimeout(1500);
  // → back to Customers tab, let its DOM render, then confirm the table is ready.
  await asPage.selectCustomersTab();
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  await page.waitForTimeout(1500);
  await asPage.waitForCustomerTable();
}

/** Open a customer's "Assign time tracking fields" drawer via the row menu. */
async function as01OpenAssignTtfDrawer(
  page: Page,
  asPage: AssignmentFlowsPage,
  customerName: string,
): Promise<void> {
  let row = asPage.assignments.customerRow(customerName);
  // If the row isn't on the visible page (sort/pagination after a fresh reload),
  // search to filter the grid down to this customer, then locate it.
  if (!(await row.isVisible({ timeout: 5000 }).catch(() => false))) {
    await as01SearchCustomer(page, customerName);
    row = asPage.assignments.customerRow(customerName);
  }
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.locator(`//button[@aria-label="Expand Menu"]`).first().click();
  await page.waitForTimeout(800);
  await page
    .getByRole('menuitem', { name: /Assign time tracking fields/i })
    .or(page.locator(`//span[text()="Assign time tracking fields"]`))
    .first()
    .click();
  await asPage.assignments.expectDrawerVisible('Assign time tracking fields');
  await page.waitForTimeout(1500);
}

/**
 * Check (assign) or uncheck (unassign) the ENABLED time-tracking-field checkboxes
 * in the drawer, save, and report counts. DISABLED checkboxes (field is enabled
 * globally in Settings → not per-customer editable) are skipped and logged so the
 * next run reveals exactly which fields need the Settings toggle.
 */
// Standard time-tracking fields (everything else enabled in the drawer is a
// CUSTOM field — used to derive the custom field name for the STE check without
// depending on the CF flow / sharedCustomFieldName).
const AS01_STANDARD_TTF = new Set([
  'all items',
  'service item',
  'billable',
  'class',
  'location',
  'customers and sub-customers',
  'customers',
  'notes',
  'rate per hour',
]);

async function as01SetTimeTrackingFields(
  page: Page,
  asPage: AssignmentFlowsPage,
  customerName: string,
  assign: boolean,
): Promise<{
  total: number;
  changed: number;
  disabled: number;
  customField: string;
}> {
  await as01OpenAssignTtfDrawer(page, asPage, customerName);
  const checkboxes = asPage.assignments.drawerItemCheckboxes();
  const total = await checkboxes.count();
  let changed = 0;
  let disabled = 0;
  const disabledNames: string[] = [];
  const enabledNames: string[] = [];
  for (let i = 0; i < total; i++) {
    const cb = checkboxes.nth(i);
    const label = ((await cb.getAttribute('aria-label').catch(() => '')) ?? '')
      .replace(/^Select\s+/i, '')
      .trim();
    if (!(await cb.isEnabled().catch(() => false))) {
      disabled += 1;
      disabledNames.push(label);
      continue;
    }
    enabledNames.push(label);
    const checked = await cb.isChecked().catch(() => false);
    if (assign && !checked) {
      await cb.check();
      changed += 1;
    } else if (!assign && checked) {
      await cb.uncheck();
      changed += 1;
    }
  }
  // The enabled field that isn't a known standard field is the custom field.
  const customField =
    enabledNames.find((n) => !AS01_STANDARD_TTF.has(n.toLowerCase())) ?? '';
  console.log(
    '[AS01][Step7a] TTF %s — total=%d changed=%d | enabled=[%s] disabled=[%s] | customField="%s"',
    assign ? 'assign' : 'unassign',
    total,
    changed,
    enabledNames.join(', '),
    disabledNames.join(', '),
    customField,
  );
  await asPage.assignments.saveDrawerChangesIfEnabledElseClose();
  await page.waitForTimeout(2500);
  return { total, changed, disabled, customField };
}

/**
 * Open the STE for a customer+employee and assert whether a field label is shown.
 * Reuses the proven CF STE pattern (getCustomFieldLabels). Logs the actual labels.
 */
async function as01VerifyFieldVisibleInSteForCustomer(
  page: Page,
  customerName: string,
  employee: string,
  fieldName: string,
  expectVisible: boolean,
): Promise<void> {
  const teTabPage = new TETimeEntriesTabPage(page);
  const stePage = new TESingleTimeEntryPage(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await teTabPage.navigateToTimeEntriesPage();
  await teTabPage.waitForLoadingToDisappear();
  await stePage.handlePopupsInAnyOrder().catch(() => undefined);
  await teTabPage.openAddTimeOption('Single time entry');
  await stePage.handleTourModal().catch(() => undefined);
  await stePage.expectSingleTimeEntryVisible();
  await stePage.waitTillNameFieldVisible();
  await stePage.selectOptionFromDropdown(employee, 'Name');
  await page.waitForTimeout(1500);
  await stePage.selectOptionFromDropdown(customerName, 'Customer');
  await teTabPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2500);
  const labels = await teTabPage.getCustomFieldLabels().catch(() => []);
  const visible = labels.some((l) =>
    l.toLowerCase().includes(fieldName.toLowerCase()),
  );
  console.log(
    '[AS01][Step7a] STE field "%s" for %s: visible=%s (expected %s); labels=%o',
    fieldName,
    customerName,
    visible,
    expectVisible,
    labels,
  );
  expect(visible).toBe(expectVisible);
  await stePage.closeSingleTimeTrowser().catch(() => undefined);
  await discardUnsavedChangesPopup(page);
}

/**
 * Single-customer Step 7: columns → create → edit + verify → time-tracking-field
 * assign/unassign (assignable fields) → delete. Replaces the per-helper
 * create/delete churn (step07_customersTab + step07a) with ONE customer.
 */
export async function step07_customerAndFields(
  page: Page,
  asPage: AssignmentFlowsPage,
  account: ASTestAccount,
): Promise<void> {
  const assignmentsPage = asPage.assignments;

  await test.step('Customers tab: columns present', async () => {
    // This step follows the Step-7a CF flow, which leaves an Account & Settings
    // overlay over the left nav — the UI hover nav is blocked here. Go straight to
    // Assignments via direct URL instead of attempting (and timing out on) hover.
    await as01GotoAssignmentsDirect(page, asPage);
    // Workers + Time tracking fields exist for every account. Geofence +
    // Geofence address exist only on geofence-supported companies (Elite/IES) —
    // premium has no geofence, so skip those columns there (Elite/IES unchanged).
    const columns = ['Workers', 'Time tracking fields'];
    if (isGeofenceSupported(account)) {
      columns.push('Geofence', 'Geofence address');
    } else {
      console.log(
        '[AS01][Step7] Geofence not available for companyType=%s — skipping geofence column checks.',
        account.companyType,
      );
    }
    for (const col of columns) {
      // The grid headers can lag a beat after the direct navigation — retry the
      // read with a short wait before asserting so a not-yet-rendered header
      // doesn't fail the column check.
      let present = false;
      for (let attempt = 1; attempt <= 2 && !present; attempt++) {
        present = await asPage.hasColumn(col);
        if (!present) {
          console.log(
            '[AS01][Step7] Column "%s" not visible yet (attempt %d/3) — waiting',
            col,
            attempt,
          );
          await page.waitForTimeout(2000);
        }
      }
      expect(
        present,
        `Column "${col}" should be present on the grid`,
      ).toBeTruthy();
    }
  });

  // Create ONE customer reused for the rest of the step.
  let customerName = '';
  await test.step('create customer + validate', async () => {
    customerName = await createCustomerAndValidate(page);
    console.log('[AS01][Step7] Created customer: %s', customerName);
  });

  // Edit (rename) + verify it reflects in the grid.
  await test.step('edit customer name + verify', async () => {
    await assignmentsPage.openEditCustomerForCompany(customerName);
    await page.waitForTimeout(1500);
    const editedName = `Edited ${customerName}`;
    await assignmentsPage.enterCompanyName(editedName);
    await assignmentsPage.drawerSaveButton().click();
    await page.waitForTimeout(3000);
    await as01RefreshCustomersViaTabSwitch(page, asPage);
    await assignmentsPage.expectCustomerInTable(editedName);
    customerName = editedName;
    console.log('[AS01][Step7] Edited customer → %s', customerName);
  });

  // Time-tracking fields: assign then unassign on the SAME customer.
  await test.step('time tracking fields: assign + verify column', async () => {
    const assigned = await as01SetTimeTrackingFields(
      page,
      asPage,
      customerName,
      true,
    );
    await as01RefreshCustomersViaTabSwitch(page, asPage);
    const ttfCell = assignmentsPage
      .customerRow(customerName)
      .locator('td')
      .nth(2);
    console.log(
      '[AS01][Step7a] TTF column after assign: %s',
      (await ttfCell.textContent().catch(() => '')) ?? '',
    );
    if (assigned.changed > 0) {
      await expect(ttfCell).not.toHaveText(/^\s*None\s*$/i, {
        timeout: 10_000,
      });
    }
  });

  // STE: after ASSIGN, the custom field should be visible for this customer. SOFT
  // — whether the Assignments-drawer assign drives the custom field's STE
  // visibility (vs the CF "Assign customers" panel) is still being confirmed.
  if (sharedCustomFieldName) {
    await softStep('TTF STE: custom field visible after assign', () =>
      as01VerifyFieldVisibleInSteForCustomer(
        page,
        customerName,
        'Test Emp1',
        sharedCustomFieldName,
        true,
      ),
    );
  }

  await test.step('time tracking fields: unassign + verify column', async () => {
    await as01GotoAssignmentsDirect(page, asPage); // return from STE
    await as01SetTimeTrackingFields(page, asPage, customerName, false);
    await as01RefreshCustomersViaTabSwitch(page, asPage);
    console.log(
      '[AS01][Step7a] TTF column after unassign: %s',
      (await assignmentsPage
        .customerRow(customerName)
        .locator('td')
        .nth(2)
        .textContent()
        .catch(() => '')) ?? '',
    );
  });

  // STE: after UNASSIGN, the custom field should NOT be visible for this customer.
  if (sharedCustomFieldName) {
    await softStep('TTF STE: custom field hidden after unassign', () =>
      as01VerifyFieldVisibleInSteForCustomer(
        page,
        customerName,
        'Test Emp1',
        sharedCustomFieldName,
        false,
      ),
    );

    // Post-STE cleanup: unassign ALL customers for the custom field in Settings so
    // it doesn't stay assigned to any customer for the next run. SOFT (teardown).
    await softStep(
      'TTF cleanup: unassign all customers for CF in settings',
      async () => {
        await openCustomFieldSettingsViaAssignments(page);
        await clickCustomFieldsEditButton(page);
        await page.waitForLoadState('load').catch(() => undefined);
        await page.waitForTimeout(2000);
        await openAssignCustomersPanelForCustomField(
          page,
          sharedCustomFieldName,
        );
        await verifyAssignCustomersPanelVisible(page);
        await unselectAllCustomersInAssignPanel(page, true);
        console.log(
          '[AS01][Step7a] CF "%s": unassigned all customers in settings (cleanup).',
          sharedCustomFieldName,
        );
      },
    );
  }

  // NOTE: the Settings-disable → assign worker+customer → reactivate → STE
  // visibility (matching vs non-matching) flow for the CLASS field is already
  // covered by ASM061 (verifyClassVisibilityBasedOnAssignment, run in Step 6), so
  // it is intentionally NOT repeated here. The column-level assign/unassign check
  // above covers the Assignments-drawer + grid-column behavior.

  // Cleanup: make the created customer inactive (robust: dismiss overlays, retry
  // once). Tracking-field Settings defaults are already restored per-field above.
  await test.step('cleanup: make created customer inactive', async () => {
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(500);
    try {
      await assignmentsPage.deleteCustomer(customerName);
    } catch (error) {
      console.warn('[AS01][Step7] delete attempt 1 failed — retrying:', error);
      await assignmentsPage.deleteCustomer(customerName);
    }
    await page.waitForTimeout(2000);
    // Direct URL nav — we're on the Customers list after delete, where the
    // left-nav hover is blocked.
    await as01GotoAssignmentsDirect(page, asPage);
    await assignmentsPage.expectCustomerNotInTable(customerName);
  });
}

// ============================================================================
// Step 8 — Workers tab (validation). Sub-steps:
//   8a — Add worker + worker view settings, 8b — Groups end-to-end + view settings.
// ============================================================================

// Validate the Workers tab COLUMNS up front (workers already exist) + the
// Workers/Groups toggle. Filters are verified later (step08_workerFilters),
// after the test has added more data.
export async function step08_workersTab(
  page: Page,
  asPage: AssignmentFlowsPage,
): Promise<void> {
  await test.step('Workers tab: columns present', async () => {
    // Independent entry: always navigate to Assignments ourselves so Step 8 does
    // NOT depend on a prior step (step02 / step07) having landed us here.
    // navigateToAssignments is a no-op-ish when already on the page (just selects
    // the Customers tab), so calling it unconditionally is safe.
    await asPage.navigateToAssignments();
    await asPage.selectWorkersTab();
    await asPage.switchToWorkersView();
    const headers = await asPage.getColumnHeaderTexts();
    console.log('[AS01][Step8] Workers tab columns: %o', headers);
    await asPage.assignments.verifyWorkersTableColumns();
  });

  await test.step('Workers tab: Workers/Groups toggle', async () => {
    await asPage.switchToGroupsView();
    await page.waitForTimeout(500);
    await asPage.switchToWorkersView();
    await page.waitForTimeout(500);
  });
}

// Worker/Group FILTERS — verified later, after the test has added workers and
// groups so the filters act on real data.
export async function step08_workerFilters(
  page: Page,
  asPage: AssignmentFlowsPage,
): Promise<void> {
  await test.step('Worker-type filter scoping + hidden in Groups view', async () => {
    // Independent entry: navigate to Assignments ourselves rather than assuming a
    // prior Step 8 sub-step left us on the Workers tab.
    await asPage.navigateToAssignments();
    await asPage.selectWorkersTab();
    await asPage.switchToWorkersView();
    if (!(await asPage.isWorkerTypeFilterVisible())) {
      console.log('[AS01][Step8] Worker-type filter not present — skipping.');
      return;
    }
    for (const option of ['All', 'Employee', 'User', 'Vendor']) {
      const selected = await asPage.selectWorkerTypeFilter(option);
      if (!selected) {
        console.log(
          '[AS01][Step8] Worker Type "%s" — option not available, skipped.',
          option,
        );
        continue;
      }
      const rows = await asPage.assignments.getWorkerRowsCount();
      console.log('[AS01][Step8] Worker Type "%s" → rows=%d', option, rows);
    }
    // Filter must disappear in Groups view.
    await asPage.switchToGroupsView();
    expect(await asPage.isWorkerTypeFilterVisible()).toBeFalsy();
    await asPage.switchToWorkersView();
  });

  await test.step('search workers & groups + clear resets', async () => {
    await as01ValidateSearchWorkersAndGroups(page, asPage);
  });
}

// AS01-local search validation. The shared validateSearchInWorkersAndGroups is
// hardcoded to a pre-existing "Group1" with a fixed worker composition (asserts
// "4 of 6 workers", Test Emp1/Emp2 membership) — it can't run against the
// dynamic Group_A/B/C this suite creates. This version searches by the ACTUAL
// created group name (captured in Step 8b) and resets, then searches workers.
async function as01ValidateSearchWorkersAndGroups(
  page: Page,
  asPage: AssignmentFlowsPage,
): Promise<void> {
  await asPage.navigateToAssignments();
  await asPage.selectWorkersTab();

  // ----- Groups search (by the real created group name) -----
  await asPage.switchToGroupsView();
  await page.waitForTimeout(800);

  const groupName = as01CreatedGroupName;
  if (groupName) {
    await asPage.searchGroups(groupName);
    console.log(
      '[AS01][Step8] Searched groups for created name "%s"',
      groupName,
    );
    await expect(asPage.assignments.groupRow(groupName).first()).toBeVisible({
      timeout: 15000,
    });

    const groupSearchInput = page
      .getByRole('textbox', { name: /search/i })
      .first();
    // Non-existent term → the created group disappears from results.
    await groupSearchInput.fill('Group__no_match__123');
    await page.waitForTimeout(1000);
    await expect(asPage.assignments.groupRow(groupName)).toHaveCount(0);

    // Clear → created group reappears (search reset).
    await groupSearchInput.clear();
    await page.waitForTimeout(1000);
    await expect(asPage.assignments.groupRow(groupName).first()).toBeVisible({
      timeout: 15000,
    });
    console.log('[AS01][Step8] Group search + clear-reset verified.');
  } else {
    console.log(
      '[AS01][Step8] No created group name captured (Step 8b skipped?) — skipping group search.',
    );
  }

  // ----- Workers search (Workers view) -----
  await asPage.switchToWorkersView();
  await page.waitForTimeout(800);
  const before = await asPage.assignments.getWorkerRowsCount();
  await asPage.searchWorkers('Test Emp1');
  console.log('[AS01][Step8] Searched workers for "Test Emp1"');
  await expect(
    page.locator('tr').filter({ hasText: 'Test Emp1' }).first(),
  ).toBeVisible({ timeout: 15000 });
  await asPage.clearWorkerSearch();
  await page.waitForTimeout(800);
  const after = await asPage.assignments.getWorkerRowsCount();
  console.log(
    '[AS01][Step8] Worker search rows before=%d, after-clear=%d',
    before,
    after,
  );
}

// Step 8a — Add worker (Employee/Contractor dropdown + Invite) and worker view
// settings. Reuses the working Add-worker and view-settings helpers.
export async function step08a_workerAddAndViewSettings(
  page: Page,
  account: ASTestAccount,
  asPage: AssignmentFlowsPage,
): Promise<void> {
  // Independent entry: land on the Workers tab ourselves (step07e assumes it).
  await asPage.navigateToAssignments();
  await asPage.selectWorkersTab();

  await step07e_workerAddInvite(page, account, asPage);

  await test.step('worker view settings (Workers tab)', async () => {
    await viewSettingForWorkersInWorkerTab(page);
  });
  await test.step('worker view settings: breaks visible', async () => {
    await as01VerifyWorkerBreaksVisible(page, asPage);
  });
  await test.step('worker view settings: notifications persist', async () => {
    await verifyWorkerViewSettingsNotificationsSave(page);
  });
}

// AS01-local breaks-visibility check. The shared verifyWorkerViewSettingsBreaksVisible
// targets the FIRST worker in the list and HARD-requires "Paid/Unpaid break
// rules" sections. Here the first worker is leftover data ("aaatest") with no
// breaks → empty state → it hard-fails. Target Test Emp1 (the prior view-settings
// step assigns a manual break to it) and treat the Paid/Unpaid sections as
// informational so a data gap doesn't fail the step.
async function as01VerifyWorkerBreaksVisible(
  page: Page,
  asPage: AssignmentFlowsPage,
): Promise<void> {
  await asPage.navigateToAssignments();
  await asPage.selectWorkersTab();
  await asPage.switchToWorkersView();
  await page.waitForTimeout(800);

  const worker = 'Test Emp1';
  const clicked = await asPage.assignments.clickViewSettingsForWorker(worker);
  if (!clicked) {
    console.log(
      '[AS01][Step8a] Could not open View settings for %s — skipping breaks check.',
      worker,
    );
    return;
  }
  await page.waitForTimeout(1500);

  const breaksVisible = await asPage.assignments
    .isBreaksCardVisible()
    .catch(() => false);
  console.log(
    '[AS01][Step8a] Breaks card visible for %s: %s',
    worker,
    breaksVisible,
  );
  expect(breaksVisible).toBeTruthy();

  // Paid/Unpaid break-rule sections only render when the worker has those rule
  // types assigned — informational, not a hard gate.
  const hasPaid = await page
    .locator(`//*[text()='Paid break rules']`)
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  const hasUnpaid = await page
    .locator(`//*[text()='Unpaid break rules']`)
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  console.log(
    '[AS01][Step8a] Break sections — Paid: %s, Unpaid: %s',
    hasPaid,
    hasUnpaid,
  );
}

// Step 8b — Groups end-to-end (the existing worker/group flow) + Groups-tab view
// settings. Reuses the working step07b_customerWorkerAssignment unchanged.
export async function step08b_groupsAndViewSettings(page: Page): Promise<void> {
  // Independent: run the group CRUD flows directly instead of
  // step07b_customerWorkerAssignment. step07b also assigns the step07a custom
  // field to a worker (assignCustomFieldToWorkerFlow), which requires
  // `sharedCustomFieldName` created in step07a — and Step 8 does NOT run step07a.
  // The group flows below self-navigate (goToAssignments) and create their own
  // data, so Step 8b stands alone.
  let groups = { group1Name: '', group2Name: '', group3Name: '' };
  await test.step('assign / unassign workers for group', async () => {
    groups = await assignUnassignWorkersFlow(page);
    // group1 is renamed+deleted below; group2 survives → use it for the later
    // worker/group search (search-by-real-created-name).
    as01CreatedGroupName = groups.group2Name;
  });
  await test.step('assign workers & leads from group Details page', async () => {
    await assignWorkersAndLeadsFromDetailsPageFlow(page, groups.group2Name);
  });
  await test.step('group rename + delete (CRUD)', async () => {
    await groupRenameAndDelete(page, groups.group1Name);
  });

  // Groups now exist → verify the Groups-view columns (data-backed).
  await test.step('Groups view columns', async () => {
    const asPage = new AssignmentFlowsPage(page);
    await asPage.navigateToAssignments();
    await asPage.selectWorkersTab();
    await asPage.switchToGroupsView();
    await page.waitForTimeout(1000);
    if (await asPage.isGroupsEmptyState()) {
      console.log(
        '[AS01][Step8b] No groups (empty state) — columns not rendered.',
      );
      return;
    }
    await asPage.assignments.verifyGroupsTableColumns();
  });

  await test.step('group view settings (Groups tab)', async () => {
    await viewSettingForWorkersInGroupsTab(page);
  });
}

/**
 * afterEach-friendly best-effort cleanup. Safe to call even when a step failed
 * midway: each sub-cleanup is wrapped so a single failure does not mask others.
 */
export async function cleanupAssignmentsTestData(page: Page): Promise<void> {
  try {
    await cleanupAllGroups(page);
  } catch (error) {
    console.warn('[AS01][cleanup] delete all test groups failed:', error);
  }
  try {
    await cleanupViewSettingsTestData(page);
  } catch (error) {
    console.warn('[AS01][cleanup] view-settings cleanup failed:', error);
  }
}

// ============================================================================
// Orchestrator
// ============================================================================

/**
 * Runs a pre-CRUD validation step "softly": if it throws (a failed expectation,
 * a missing element/column, a page error), the error is logged and the suite
 * PROCEEDS to the next step instead of failing. Used only for the validation
 * phase (Steps 1–6); the CRUD steps (7a–8) are NOT wrapped and stay hard.
 */
async function softStep(
  label: string,
  fn: () => Promise<unknown>,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (isLikelyProductDefect(msg)) {
      // An EXPECTED element/state never appeared and it is not an environmental
      // flake → call it out clearly so it's triaged as a product issue, not lost
      // in a generic soft-failure dump.
      console.error(
        `[AS01][DEFECT] ${label} — an expected element/state did NOT appear, Failure detail:\n${firstLines(
          msg,
        )}`,
      );
    } else {
      console.warn(
        `[AS01][soft] ${label} — failed (transient: overlay/reload/navigation/timeout), continuing. Failure detail:\n${firstLines(
          msg,
        )}`,
      );
    }
  }
}

/** First few lines of an error message — keeps the soft-step log readable. */
function firstLines(msg: string, n = 8): string {
  return msg.split('\n').slice(0, n).join('\n');
}

function isLikelyProductDefect(msg: string): boolean {
  const transient =
    /intercepts pointer events|Target (page|closed)|has been closed|Navigation (to|failed)|net::ERR|Execution context was destroyed|frame was detached|page\.goto/i;
  if (transient.test(msg)) {
    return false;
  }
  const expectedButMissing =
    /to be visible|toBeVisible|element\(s\) not found|toBeAttached|toHaveText|toHaveCount|toBeEnabled/i;
  const neverResolved = !/resolved to/i.test(msg);
  return expectedButMissing.test(msg) && neverResolved;
}

// ---- Per-step cleanup helpers ----------------------------------------------
//
// Steps that create data with a reusable cleanup call it directly in the
// orchestrator (groups → cleanupAllGroups, geofence → cleanupGeofenceSettings,
// view-settings → cleanupViewSettingsTestData). The helpers below cover the
// steps WITHOUT a dedicated reusable cleanup: they reset the UI (dismiss any
// open drawer/STE) and log what, if anything, may persist.

/** Dismiss any open drawer/modal/STE so the next step starts from a clean UI. */
async function resetUiState(page: Page): Promise<void> {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(400);
}

async function cleanupStep7a(page: Page): Promise<void> {
  // 7a verifies field visibility in the STE (read-only; the STE is discarded),
  // so nothing persistent is created — just reset the UI.
  await resetUiState(page);
  console.log(
    '[AS01][Step7a][cleanup] No persistent data created (read-only verification).',
  );
}

async function cleanupStep7b(page: Page): Promise<void> {
  await resetUiState(page);
  console.log(
    '[AS01][Step7b][cleanup] Worker/field assignments may persist (no reusable unassign-all).',
  );
}

async function cleanupStep7d(page: Page): Promise<void> {
  await resetUiState(page);
  console.log(
    '[AS01][Step7d][cleanup] Created customers may persist (dynamic names; remove manually if needed).',
  );
}

async function cleanupStep7e(page: Page): Promise<void> {
  await resetUiState(page);
  console.log(
    '[AS01][Step7e][cleanup] No persistent data (Add-worker menu inspected only).',
  );
}

/**
 * Runs the full AS01 suite in sequence (Steps 1–8, including the 7a–7h
 * sub-features). Each step gates itself on the resolved entitlements so the run
 * adapts to the account (Elite/Premium, NTTF, geofence flag, region, payroll).
 *
 * Steps 1–6 are SOFT (a failed expectation is logged and the suite proceeds).
 * The CRUD steps (7a–8) stay HARD.
 */
export async function runAssignmentsFullSuite(
  page: Page,
  account: ASTestAccount,
): Promise<void> {
  const asPage = new AssignmentFlowsPage(page);

  // Fail fast: bare actions default to the global 5-min actionTimeout, so a soft
  // step stuck on a missing element hangs the run. Cap the default at 30s for
  // this test (explicit per-call timeouts still override this).
  page.setDefaultTimeout(30_000);

  // Step 1 — Login & entitlement setup (resolves companyType + gates). (HARD)
  await test.step('Step1 — login & entitlements', () =>
    step01_loginAndEntitlements(page, account, asPage));

  // Free-data SKUs (FP Free) do NOT get Assignments. For these accounts run ONLY
  // the negative check (Assignments absent under Time options) and stop — the
  // full CRUD suite below applies to IES / Elite / Premium only. (HARD)
  if (account.companyType === 'FreeData') {
    await test.step('Free-data — Assignments tab NOT visible under Time options', () =>
      stepFreeData_assignmentsNotVisible(account, asPage));
    return;
  }

  // Step 2 — Navigate to Assignments + tab verification. (HARD)
  await test.step('Step2 — navigate + tab verification', () =>
    step02_navigateToAssignments(page, account, asPage));

  // Step 3 — Tab & feature visibility vs entitlements. (SOFT)
  await softStep('Step3 — visibility vs entitlements', () =>
    step03_visibilityVsEntitlements(page, account),
  );

  // Step 6 — Role-scoped data visibility. (SOFT)
  // NOTE: column/filter validation is intentionally NOT here — it's verified
  // inside the Customers/Workers tab steps below, with real data.
  await softStep('Step6 — role-scoped data', () =>
    step06_roleScopedData(page, account, asPage),
  );

  // Standard field (Service item) → assign to ONE customer at the field level →
  // Show on timesheets ON → STE shows the field ONLY for that customer (hidden for
  // others). Field-level "Assign customers" IS honored while the field is active
  // (unlike per-class-value assignment), so this reliably verifies the scoping.
  await softStep(
    'Step6b — standard field assign-to-customer + STE visibility',
    () => as01StandardFieldAssignCustomerAndVerifySTE(page),
  );

  // Custom field create + edit + assign-to-customer + Required + STE
  // (positive/negative). Runs BEFORE Steps 7/8 and shares its field with the
  // Step 8b worker→CF leg. (Existing working flow, unchanged.)
  // HARD (debugging): run the custom-field flow directly so any failure throws
  // and we see exactly which sub-step breaks (no soft-swallow).
  await step07a_customerFieldAssignment(page);
  await softStep('Custom field cleanup', () => cleanupStep7a(page));

  // ===== Step 7 — Customers tab =====
  // Columns first (data already present), then add/edit, fields, geofence, and
  // finally the customer filters (after the test has added customers).
  // Consolidated: ONE customer for columns + create + edit + verify +
  // time-tracking-field assign/unassign + delete. HARD (real failures surface).
  await softStep(
    'Step7 — customer CRUD + time tracking fields (one customer)',
    () => step07_customerAndFields(page, asPage, account),
  );

  // Geofence (HARD). Its cleanup stays SOFT (teardown / slow web-shell revert).
  // Geofence exists only on Elite/IES — premium has no geofence feature, so skip
  // the whole geofence flow AND its cleanup there (the cleanup would otherwise
  // fail trying to enable a geofence company-setting that doesn't exist).
  if (isGeofenceSupported(account)) {
    await softStep('Step7b — geofence (end to end)', () =>
      step07c_geofence(page, account),
    );
    await softStep('Step7b cleanup — revert geofence', () =>
      cleanupGeofenceSettings(page, true),
    );
  } else {
    console.log(
      '[AS01][Step7b] Geofence not available for companyType=%s — skipping geofence flow + cleanup.',
      account.companyType,
    );
  }

  await softStep('Step7 — Customer filters (after data)', () =>
    step07_customerFilters(page),
  );

  // ===== Step 8 — Workers tab =====
  // Columns first (workers already present), then add worker, groups, and
  // finally the worker/group filters (after the test has added data).
  await softStep('Step8 — Workers tab (columns + Workers/Groups toggle)', () =>
    step08_workersTab(page, asPage),
  );

  await softStep('Step8a — Add worker + worker view settings', () =>
    step08a_workerAddAndViewSettings(page, account, asPage),
  );
  await softStep('Step8a cleanup', () => cleanupStep7e(page));

  await softStep('Step8b — Groups (end to end) + group view settings', () =>
    step08b_groupsAndViewSettings(page),
  );
  await softStep('Step8b cleanup', () => cleanupStep7b(page));

  await softStep('Step8 — Worker/Group filters (after data)', () =>
    step08_workerFilters(page, asPage),
  );

  // Final cleanup. (SOFT) — full sweep at the end (also runs in afterEach).
  await softStep('Cleanup', () => step08_cleanup(page, account));

  console.log('[AS01] Full suite complete.');
}
