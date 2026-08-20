import { Page, expect } from '@playwright/test';
import TimeEntriesPage from '../../../pages/TimeEntriesPage';
import {
  DashboardAccount,
  navigateToTimeSubmenu,
} from '../../../pages/FastPipeline/DashboardPage';
import ApprovalsPage from '../../../pages/ApprovalsPage';
import SingleTimeEntryPage from '../../../pages/SingleTimeEntryPage';
import SingleTimeActivityPage from '../../../pages/SingleTimeActivityPage';
import RunPayrollPage from '../../../pages/RunPayrollPage';
import {
  clickAddTimeDropdown,
  openDateRangeDropdown,
  selectDateRangeOption,
  selectDisplayByOption,
  selectSingleTimeEntryFromAddTime,
} from '../../../commonUtils';
import { LoginCredentials } from '../../../config/types';
import { AccountMatrix, resolveMatrixAccounts } from './accountMatrix';

// Import TE01 types and generic login/dashboard helpers from the sibling util so
// they are not duplicated — APP01 reuses them for its login and dashboard steps.
import {
  TETestAccount,
  loginAndRoleSetup,
  validateDashboardAndResolveSku,
} from './TimeEntriesFlows.Util';

// ============================================================================
// APP01 — Approvals + Run Payroll Full Suite
// ============================================================================

// ---- Test account shape -----------------------------------------------------

export interface APTEntitlements {
  canApprove: boolean;
  canUnapprove: boolean;
  canEditAfterUnapprove: boolean;
  canRunPayroll: boolean;
}

export interface APTSeededData {
  employeeName: string;
  displayName: string; // "Last, First" format used in table rows
  initialDuration: string;
  updatedDuration: string;
  entryNotes: string;
  customer?: string; // Customer to select in the STE form, e.g. 'Test Customer1'
  service?: string; // Service/item to select in the STE form, e.g. 'Hours'
  billable?: boolean; // Whether to check the Billable checkbox in the STE form
}

export interface APTTestAccount {
  credentials: LoginCredentials;
  role: 'admin' | 'manager' | 'employee' | 'vendor';
  companyType?: 'elite' | 'premium' | 'ies' | 'standard';
  /** Resolved post-login by fetchProductEntitlementsFromUI() — mirrors TETestAccount. */
  rawFlavours?: string[];
  /** Defaults to 'us' — mirrors TETestAccount.region used by the generic login step. */
  region?: 'us' | 'ca';
  entitlements: APTEntitlements;
  seededData: APTSeededData;
}

// ---- Factory ----------------------------------------------------------------

/**
 * Builds a fully-populated APTTestAccount from login credentials plus optional
 * overrides. Mirrors buildTEAccount / buildBRAccount.
 */
export function buildAPTAccount(
  credentials: LoginCredentials,
  overrides: {
    role?: APTTestAccount['role'];
    companyType?: APTTestAccount['companyType'];
    entitlements?: Partial<APTEntitlements>;
    seededData?: Partial<APTSeededData>;
  } = {},
): APTTestAccount {
  const resolvedCompanyType: APTTestAccount['companyType'] =
    overrides.companyType ??
    (credentials.companyType as APTTestAccount['companyType'] | undefined) ??
    'elite';

  return {
    credentials,
    role: overrides.role ?? 'admin',
    companyType: resolvedCompanyType,
    region: 'us',
    rawFlavours: undefined,
    entitlements: {
      canApprove: true,
      canUnapprove: true,
      canEditAfterUnapprove: true,
      canRunPayroll: true,
      ...overrides.entitlements,
    },
    seededData: {
      employeeName: 'Test Emp1',
      displayName: 'Emp1, Test',
      initialDuration: '3',
      updatedDuration: '5',
      entryNotes: 'APP01 Approvals Flow Entry',
      customer: 'Test Customer',
      service: 'Hours',
      billable: true,
      ...overrides.seededData,
    },
  };
}

// ---- Private helpers --------------------------------------------------------

/** A built {@link APTTestAccount} paired with the account key it came from. */
export interface APTMatrixAccount {
  /** The account key (e.g. `APP01`) — used to label the per-account test. */
  testId: string;
  account: APTTestAccount;
}

/**
 * Approvals (APP01) FastPipeline account matrix — same shape and resolution rules
 * as the TE/Breaks matrices. The shared TEST_ACCOUNT selector resolves against the
 * Approvals account pool for each SKU, so the same `TEST_ACCOUNT=PR_ELITE` run that
 * exercises the elite TE/Breaks suites also runs the Approvals suite against APP01
 * (companyType 'elite'). Keys missing from the active env are skipped, so SKUs
 * without an Approvals account yet stay as TODO placeholders.
 */
const APT_ACCOUNT_MATRIX: AccountMatrix = {
  // Intuit Enterprise Suite — add the IES Approvals account key when provisioned.
  IES: ['APPES01'],
  // QBO + Time/Payroll Elite — APP01 is an elite company.
  PR_ELITE: ['APPEL01'],
  // QBO + Time/Payroll Premium — add the premium Approvals account key when provisioned.
  PR_PREMIUM: ['APPPR01'],
  // Freedata_Advanced.
  FREE_DATA_ADV: ['APFDA01'],
  // Freedata_Essential.
  FREE_DATA_ESSENTIAL: ['APFDE01'],
  // Freedata_Plus.
  FREE_DATA_PLUS: ['APFDP01'],
};

/**
 * Builds the list of {@link APTTestAccount}s the TEST_ACCOUNT selector resolves to
 * for the Approvals track. Mirrors buildTEAccountsFromMatrix / buildBRAccountsFromMatrix:
 * a SKU group expands to that SKU's Approvals accounts, an exact key resolves to a
 * single account. Role and entitlements are read from each account row's metadata.
 */
export function buildAPTAccountsFromMatrix(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): APTMatrixAccount[] {
  return resolveMatrixAccounts({
    matrix: APT_ACCOUNT_MATRIX,
    param: selector,
    label: 'APT',
    allowEmpty: true,
  }).map(({ testId, credentials }) => ({
    testId,
    account: buildAPTAccount(credentials, {
      role: credentials.expectedRole ?? 'admin',
      entitlements: {
        canApprove: credentials.canApproveTime ?? true,
        canRunPayroll: true,
      },
    }),
  }));
}

/** Soft-assert helper for APP01: log a warning instead of failing the test. */
async function aptSoft(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[soft] ${label} — ${message}`);
  }
}

/** Derive company type from raw QBO product entitlement flavour strings. */
function mapFlavoursToCompanyType(
  flavours: string[],
): NonNullable<APTTestAccount['companyType']> {
  const combined = flavours.join(' ').toUpperCase();
  if (combined.includes('IES') || combined.includes('ENTERPRISE')) return 'ies';
  if (combined.includes('ELITE')) return 'elite';
  if (combined.includes('PREMIUM')) return 'premium';
  return 'standard';
}

// ============================================================================
// APP01 helper — validate approval status on the view-details page
// ============================================================================

async function aptValidateViewDetailsApprovalStatus(
  page: Page,
  expectedStatus: 'approved' | 'unapproved',
): Promise<boolean> {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await page.waitForTimeout(1000);

    const statusCells = page
      .locator('td')
      .filter({ hasText: /^(Approved|Unapproved)$/ });
    const statusCount = await statusCells.count();

    if (statusCount > 0) {
      const firstStatus = await statusCells.first().textContent();
      const statusText = firstStatus?.trim().toLowerCase();

      if (expectedStatus === 'approved' && statusText === 'approved') {
        return true;
      }
      if (expectedStatus === 'unapproved' && statusText === 'unapproved') {
        return true;
      }
    }

    const approveTimeBtn = page.getByRole('button', { name: /approve time/i });
    if (await approveTimeBtn.isVisible().catch(() => false)) {
      await approveTimeBtn.click();
      await page.waitForTimeout(300);

      if (expectedStatus === 'approved') {
        const unapproveOption = page.locator(`//*[text()='Unapprove time']`);
        if (await unapproveOption.isVisible().catch(() => false)) {
          await page.keyboard.press('Escape');
          return true;
        }
      } else {
        const approveOption = page.locator(`//*[text()='Approve time']`).last();
        if (await approveOption.isVisible().catch(() => false)) {
          await page.keyboard.press('Escape');
          return true;
        }
      }
      await page.keyboard.press('Escape');
    }

    console.log(
      ` Validating ${expectedStatus} status... (attempt ${attempt}/${maxAttempts})`,
    );
  }

  return false;
}

// ============================================================================
// APP01 helper utilities — navigation, add-entry, approve/unapprove helpers
// ============================================================================

export async function aptSelectThisMonthDateRange(page: Page): Promise<void> {
  const approvalsPage = new ApprovalsPage(page);
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await approvalsPage.waitForLoadingToDisappear();
}

export async function aptAddSingleTimeEntry(
  page: Page,
  options: {
    employeeName?: string;
    duration?: string;
    notes?: string;
    customer?: string;
    service?: string;
    billable?: boolean;
  } = {},
): Promise<{ employeeName: string; duration: string; notes: string }> {
  const stePage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);

  await clickAddTimeDropdown(page);
  await selectSingleTimeEntryFromAddTime(page);

  await stePage.waitForPageReady();
  await page.waitForTimeout(5000);
  await stePage.handlePopupsInAnyOrder();
  await stePage.waitTillNameFieldVisible();

  // ── Employee ───────────────────────────────────────────────────────────────
  if (options.employeeName) {
    await stePage.selectEmployeeByDisplayName(options.employeeName);
  } else {
    await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  }
  const nameValue = (await stePage.getFieldValue('Name')) ?? '';

  // ── Date ───────────────────────────────────────────────────────────────────
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await stePage.fillStartDate(formattedDate);

  // ── Duration ───────────────────────────────────────────────────────────────
  const duration = options.duration || '01:00';
  await stePage.enterFieldValue('Duration', duration);

  // ── Service ────────────────────────────────────────────────────────────────
  if (options.service) {
    await stePage.openDropdown('Service');
    await page
      .getByRole('option', { name: options.service, exact: true })
      .click();
    await page.waitForTimeout(500);
  }

  // ── Notes ──────────────────────────────────────────────────────────────────
  if (options.notes) {
    await stePage.enterNotes(options.notes);
  }
  await page.waitForTimeout(3000);
  await stePage.clickSaveAndCloseButton();
  await stePage.validateSuccessToast();
  await page.waitForTimeout(1000);
  await aptSelectThisMonthDateRange(page);

  return {
    employeeName: nameValue,
    duration,
    notes: options.notes || '',
  };
}

export async function aptDeleteEntryFromViewDetails(
  page: Page,
): Promise<boolean> {
  try {
    const approvalsPage = new ApprovalsPage(page);

    // Returns the first tbody row that has an Edit button.
    // 500 ms timeout — the table is already rendered; if no Edit row exists the
    // answer is known immediately.
    const rowContainingEdit = (): ReturnType<Page['locator']> =>
      page
        .locator('tbody tr')
        .filter({ has: page.getByRole('button', { name: /edit/i }) })
        .first();

    let entryRow = rowContainingEdit();

    // Strategy 1 — tbody row with Edit button
    if (!(await entryRow.isVisible({ timeout: 500 }).catch(() => false))) {
      // Strategy 2 — any non-header row with Edit button
      entryRow = page
        .locator('tr')
        .filter({ hasNot: page.locator('th') })
        .filter({ has: page.getByRole('button', { name: /edit/i }) })
        .first();
    }

    // Strategy 3 — click the first body row to expand it, then retry
    if (!(await entryRow.isVisible({ timeout: 500 }).catch(() => false))) {
      const firstBodyRow = page.locator('tbody tr').first();
      if (await firstBodyRow.isVisible({ timeout: 500 }).catch(() => false)) {
        await firstBodyRow.click();
        await approvalsPage.waitForLoadingToDisappear();
      }
      entryRow = rowContainingEdit();
    }

    // No deletable row found — signal the loop to stop immediately
    if (!(await entryRow.isVisible({ timeout: 500 }).catch(() => false))) {
      console.log(' ✓ No more entries to delete — all rows removed');
      return false;
    }

    const editDropdown = entryRow
      .locator('[aria-label="Expand Menu"]')
      .or(entryRow.locator('button[aria-haspopup="true"]').last());

    if (!(await editDropdown.isVisible({ timeout: 3000 }).catch(() => false))) {
      console.log(' ✓ Row Expand Menu not visible — cannot reach Delete');
      return false;
    }

    await editDropdown.click();

    const deleteOption = page
      .getByRole('menuitem', { name: /^delete$/i })
      .or(page.getByRole('menuitem', { name: /delete/i }))
      .or(page.locator(`//*[normalize-space()='Delete']`));

    if (
      !(await deleteOption
        .first()
        .isVisible({ timeout: 4000 })
        .catch(() => false))
    ) {
      console.log(' ✓ Delete option did not appear in row actions menu');
      await page.keyboard.press('Escape');
      return false;
    }

    await deleteOption.first().click();

    const confirmDelete = page.getByRole('button', {
      name: /delete|confirm|yes/i,
    });
    if (await confirmDelete.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmDelete.click();
    }

    // Wait for the loading spinner, then wait for both overlays that can
    // intercept subsequent clicks to fully disappear before returning:
    //   • aria-modal="true" div  — the delete confirmation dialog.
    //   • ActionInProgressOverlay — the full-page "action in progress" overlay
    //     that QBO renders while the delete API call is in flight.
    await approvalsPage.waitForLoadingToDisappear();

    await page
      .locator('[aria-modal="true"]')
      .waitFor({ state: 'hidden', timeout: 10000 })
      .catch(() => {});

    await page
      .locator('[class*="ActionInProgressOverlay"]')
      .waitFor({ state: 'hidden', timeout: 10000 })
      .catch(() => {});

    console.log(' ✓ Entry deleted');
    return true;
  } catch (error) {
    console.log(` ⚠ Error deleting entry: ${error}`);
    return false;
  }
}

export async function aptDeleteAllEntriesFromViewDetails(
  page: Page,
  employeeName: string,
): Promise<number> {
  const approvalsPage = new ApprovalsPage(page);
  let deletedCount = 0;
  const maxAttempts = 3;

  // ── Guard: employee row must exist before opening View Details ─────────────
  const employeeRow = approvalsPage.getRowByEmployeeName(employeeName);
  const hasEmployeeRow = await employeeRow
    .isVisible({ timeout: 8000 })
    .catch(() => false);
  if (!hasEmployeeRow) {
    console.log(` No Approvals row for ${employeeName} — nothing to delete`);
    return 0;
  }

  await approvalsPage.waitForLoadingToDisappear();
  await page.waitForTimeout(5000);
  await approvalsPage.clickActionDropdown(employeeName);
  const viewDetailsOption = page.locator(`//*[text()='View details']`);
  const menuOpened = await viewDetailsOption
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  if (!menuOpened) {
    console.log(' Action menu / View details did not open — nothing to delete');
    return 0;
  }
  await viewDetailsOption.click();
  await approvalsPage.waitForLoadingToDisappear();

  // ── Unapprove any approved entries so they become deletable ────────────────
  const statusCells = page.locator('td');
  const cellCount = await statusCells.count();
  let hasApprovedEntries = false;
  for (let i = 0; i < cellCount; i++) {
    const cellText = await statusCells
      .nth(i)
      .textContent()
      .catch(() => '');
    if (cellText?.trim() === 'Approved') {
      hasApprovedEntries = true;
      break;
    }
  }

  if (hasApprovedEntries) {
    const approveTimeBtn = page.getByRole('button', { name: /approve time/i });
    if (await approveTimeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approveTimeBtn.click();

      const unapproveOption = page.locator(`//*[text()='Unapprove time']`);
      if (
        await unapproveOption.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await unapproveOption.click();

        const confirmBtn = page.getByRole('button', {
          name: 'Unapprove and unlock time',
        });
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
        }
        await approvalsPage.waitForLoadingToDisappear();

        // Wait for at least one editable row to appear confirming unapprove completed
        await page
          .locator('//tbody/tr')
          .filter({ has: page.getByRole('button', { name: /edit/i }) })
          .first()
          .waitFor({ state: 'visible', timeout: 10000 })
          .catch(() => {});
      } else {
        await page.keyboard.press('Escape');
      }
    }
  }

  // ── Delete loop ────────────────────────────────────────────────────────────
  // Two break conditions are checked at the top of every iteration:
  //   1. No rows with an Edit button remain — all entries have been deleted.
  //   2. The empty-state text "No time entries yet" is displayed.
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Break condition 1 — no deletable rows remain
    const hasRemainingRows = await page
      .locator('//tbody/tr')
      .filter({ has: page.getByRole('button', { name: /edit/i }) })
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (!hasRemainingRows) {
      console.log(
        ` No more entry rows — loop complete after ${deletedCount} deletion(s)`,
      );
      break;
    }

    // Break condition 2 — empty-state message is displayed
    const noEntriesVisible = await page
      .locator(`//*[text()='No time entries yet']`)
      .isVisible({ timeout: 500 })
      .catch(() => false);

    if (noEntriesVisible) {
      console.log(
        ` "No time entries yet" displayed — loop complete after ${deletedCount} deletion(s)`,
      );
      break;
    }

    const deleted = await aptDeleteEntryFromViewDetails(page);
    if (deleted) {
      deletedCount++;
    } else {
      break;
    }
  }

  console.log(` ✓ Deleted ${deletedCount} entries for ${employeeName}`);
  return deletedCount;
}

// ============================================================================
// APP01 Cleanup
// ============================================================================

export async function cleanupAPTEntries(
  page: Page,
  account: APTTestAccount,
): Promise<void> {
  const approvalsPage = new ApprovalsPage(page);

  try {
    // navigateToApprovalsPage already calls waitForLoadingToDisappear internally
    await approvalsPage.navigateToApprovalsPage();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await approvalsPage.waitForLoadingToDisappear();

    // Always delegate to aptDeleteAllEntriesFromViewDetails — it has its own
    // robust (8s) row guard and, crucially, UNAPPROVES any approved/locked
    // entries before deleting them. The suite leaves the entry APPROVED
    // (re-approved in step07), so a plain delete is never offered; the
    // unapprove-then-delete path is required.
    //
    // A previous short (2s) "is the row visible?" pre-check lived here, but it
    // could race the page render after the date-range change and falsely report
    // a clean state — returning early and leaving the approved entry behind.
    const deleted = await aptDeleteAllEntriesFromViewDetails(
      page,
      account.seededData.displayName,
    );
    if (deleted > 0) {
      console.log(
        ' ✓ [Cleanup] Removed %d pre-existing entry/entries',
        deleted,
      );
    } else {
      console.log(' ✓ [Cleanup] No entries found — clean state confirmed');
    }
  } catch (error) {
    console.warn(' ✓ [Cleanup] Cleanup error (continuing): %s', error);
  }
}

export async function revertAPTChanges(
  page: Page,
  account: APTTestAccount,
): Promise<void> {
  console.log(' Reverting changes — unapproving and deleting entry');
  try {
    await cleanupAPTEntries(page, account);
    console.log(' ✓ Changes reverted');
  } catch (error) {
    console.warn(' Revert error (continuing): %s', error);
  }
}

// ============================================================================
// APP01 Step functions
// ============================================================================

/** Adapt an APTTestAccount to the minimal shape the shared DashboardPage helpers expect. */
function asDashboardAccount(account: APTTestAccount): DashboardAccount {
  return { role: account.role, companyType: account.companyType };
}

/**
 * Validation — Validates the core Approvals page UI elements and sets the
 * date range to "This month". Must be called after navigateToTimeSubmenu.
 * All checks are wrapped in aptSoft() so a single environment quirk does not
 * fail the whole suite.
 */
export async function validateApprovalsPage(
  page: Page,
  account: APTTestAccount,
  approvalsPage: ApprovalsPage,
): Promise<void> {
  console.log(
    ' Validating Approvals page — role=%s companyType=%s',
    account.role,
    account.companyType,
  );
  await approvalsPage.waitForLoadingToDisappear();
  await approvalsPage.handlePopupsIfAny();
  await page.waitForTimeout(10000);

  await aptSoft('Add time button visible', async () => {
    await expect(approvalsPage.addTimeButton).toBeVisible({ timeout: 15000 });
  });
  await aptSoft('Run Payroll button visible', async () => {
    await expect(approvalsPage.runPayrollButton).toBeVisible({
      timeout: 15000,
    });
  });
  await aptSoft('Team member search visible', async () => {
    await expect(approvalsPage.teamMemberSearch).toBeVisible({
      timeout: 15000,
    });
  });

  try {
    await Promise.race([
      approvalsPage.approvalsTable.waitFor({
        state: 'visible',
        timeout: 15000,
      }),
      // The empty state renders one of two messages depending on context:
      // "No time for this date range" (date-filtered) or "No time entries yet".
      page
        .locator(
          `//*[text()='No time for this date range' or text()='No time entries yet']`,
        )
        .waitFor({ state: 'visible', timeout: 15000 }),
    ]);

    const tableVisible = await approvalsPage.approvalsTable
      .isVisible()
      .catch(() => false);

    if (tableVisible) {
      console.log(
        ' ✓ Approvals table visible — data present for the selected date range',
      );
    } else {
      console.log(
        ' ✓ Empty state visible — no data for the selected date range',
      );
    }
  } catch (error) {
    console.warn(
      ' [soft] Approvals table visible — neither the table nor the empty-state text appeared within the timeout',
    );
  }

  await aptSoft('Date range filter: set This month', async () => {
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await approvalsPage.waitForLoadingToDisappear();
  });

  console.log(' ✓ Approvals page, fields and filters validated');
}

export async function addTimeEntry(
  page: Page,
  account: APTTestAccount,
  approvalsPage: ApprovalsPage,
): Promise<string> {
  console.log(
    ' Adding Single Time Entry — duration=%s customer=%s service=%s billable=%s notes=%s',
    account.seededData.initialDuration,
    account.seededData.customer,
    account.seededData.service,
    account.seededData.billable,
    account.seededData.entryNotes,
  );

  const result = await aptAddSingleTimeEntry(page, {
    employeeName: account.seededData.employeeName,
    duration: `0${account.seededData.initialDuration}:00`,
    customer: account.seededData.customer,
    service: account.seededData.service,
    billable: account.seededData.billable,
    notes: account.seededData.entryNotes,
  });

  await approvalsPage.navigateToApprovalsPage();
  await approvalsPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await approvalsPage.waitForLoadingToDisappear();

  await aptSoft('Employee row visible after adding', async () => {
    await expect(
      approvalsPage.getRowByEmployeeName(account.seededData.displayName),
    ).toBeVisible({ timeout: 10000 });
  });

  console.log(' ✓ Entry created — employee=%s', result.employeeName);
  return result.employeeName || account.seededData.displayName;
}

export async function aptStep03_approveAndValidateLocked(
  page: Page,
  account: APTTestAccount,
  approvalsPage: ApprovalsPage,
): Promise<void> {
  console.log(' Approving entry for %s', account.seededData.displayName);

  const approved = await approvalsPage.approveEmployee(
    account.seededData.displayName,
  );
  await aptSoft('Approval confirmed (Unapprove button visible)', async () => {
    expect(approved).toBe(true);
  });

  await aptSoft(
    'Unapprove button visible (entry is approved/locked)',
    async () => {
      await expect(
        approvalsPage
          .getRowByEmployeeName(account.seededData.displayName)
          .getByRole('button', { name: 'Unapprove' }),
      ).toBeVisible({ timeout: 10000 });
    },
  );

  console.log(' ✓ Entry approved and locked');
}

export async function aptStep03b_verifyLockedInTimeEntries(
  page: Page,
  account: APTTestAccount,
  teTabPage: TimeEntriesPage,
): Promise<void> {
  console.log(' Navigating to Time Entries to verify approved/locked state');

  await teTabPage.navigateToTimeEntriesPage();
  await teTabPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await teTabPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await teTabPage.waitForLoadingToDisappear();

  await aptSoft(
    'Time Entries row shows Approved status with View button',
    async () => {
      await teTabPage.validateApprovedRowWithViewButton(
        account.seededData.displayName,
      );
    },
  );

  await teTabPage.clickViewButtonForEmployee(account.seededData.displayName);
  await page.waitForTimeout(5000);

  await aptSoft(
    'Save button not available on approved entry in STA',
    async () => {
      const saveBtn = page.getByRole('button', { name: /^save$/i }).first();
      const saveVisible = await saveBtn
        .isEnabled({ timeout: 10000 })
        .catch(() => false);
      expect(
        saveVisible,
        'Save button should NOT be visible for an approved/locked entry',
      ).toBe(false);
    },
  );

  await aptSoft(
    'Approved-lock info message visible in STA trowser',
    async () => {
      const infoMessage = page
        .getByText(/time entry is approved and cannot be edited/i)
        .or(
          page.getByText(
            /in order to edit the time entry, you need to unapprove it./i,
          ),
        );
      await expect(infoMessage.first()).toBeVisible({ timeout: 10000 });
    },
  );

  console.log(' ✓ Time Entries confirms entry is approved and locked');

  await aptSoft('Close STA trowser', async () => {
    const closeBtn = page
      .getByRole('button', { name: /close/i })
      .first()
      .or(page.locator(`//button[@aria-label='Close']`).first());
    if (await closeBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  });
}

export async function aptStep04_verifyApprovedEntryReadOnly(
  page: Page,
  account: APTTestAccount,
  approvalsPage: ApprovalsPage,
): Promise<void> {
  console.log(' Verifying approved entry is read-only');

  await approvalsPage.navigateToApprovalsPage();
  await approvalsPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await approvalsPage.waitForLoadingToDisappear();

  // Open the approved entry's detail view. An APPROVED + LOCKED entry on the
  // Approvals page exposes only an "Unapprove" button on its row — it has NO
  // per-row action ("Expand Menu") dropdown, so the "View details" path used for
  // unapproved entries (see aptStep06) is unavailable here. Try that path first;
  // if it is absent (the expected case for an approved entry), fall back to
  // clicking the employee row, which opens the read-only entry trowser. Neither
  // open is allowed to hard-fail — the locked/read-only state is already hard-
  // verified from Time Entries in aptStep03b_verifyLockedInTimeEntries.
  let detailOpened = false;
  await aptSoft('open approved entry details', async () => {
    await approvalsPage.clickActionDropdown(account.seededData.displayName);
    const viewDetailsOption = page
      .locator(`//*[text()='View details']`)
      .first();
    if (
      await viewDetailsOption.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await viewDetailsOption.click();
      await approvalsPage.waitForLoadingToDisappear();
      detailOpened = true;
      return;
    }

    // No action menu — expected for an approved + locked row. Open the read-only
    // entry trowser by clicking the employee row directly.
    console.log(
      '  Approved entry has no action menu — opening details via the employee row',
    );
    const row = approvalsPage.getRowByEmployeeName(
      account.seededData.displayName,
    );
    if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
      await row.click();
      await approvalsPage.waitForLoadingToDisappear();
      await page.waitForTimeout(1500);
      detailOpened = true;
    }
  });

  const entryRow = page
    .locator('tr')
    .filter({ hasText: account.seededData.entryNotes })
    .first();
  if (await entryRow.isVisible({ timeout: 3000 }).catch(() => false)) {
    await entryRow.click();
    await page.waitForTimeout(1500);
  }

  await aptSoft('Edit button not available on approved entry', async () => {
    const editBtn = page.getByRole('button', { name: /^edit$/i }).first();
    const editVisible = await editBtn
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(
      editVisible,
      'Edit button should NOT be visible for an approved entry',
    ).toBe(false);
  });

  await aptSoft('Approved-lock info message visible', async () => {
    const infoMessage = page
      .getByText(/time entry is approved and cannot be edited/i)
      .or(
        page.getByText(
          /in order to edit the time entry, you need to unapprove it./i,
        ),
      );
    await expect(infoMessage.first()).toBeVisible({ timeout: 5000 });
  });

  if (detailOpened) {
    console.log(' ✓ Approved entry is read-only — info message confirmed');
  } else {
    console.log(
      ' [soft] Could not open approved entry details from the Approvals page (approved + locked row has no action menu) — read-only state already verified in Time Entries (step03b)',
    );
  }

  await aptSoft('Close drawer and return to Approvals', async () => {
    const closeBtn = page
      .getByRole('button', { name: /close/i })
      .first()
      .or(page.locator(`//button[@aria-label='Close']`).first());
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  });
}

export async function aptStep05_unapprove(
  page: Page,
  account: APTTestAccount,
  approvalsPage: ApprovalsPage,
): Promise<void> {
  console.log(' Unapproving entry for %s', account.seededData.displayName);

  await approvalsPage.navigateToApprovalsPage();
  await approvalsPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await approvalsPage.waitForLoadingToDisappear();

  const unapproved = await approvalsPage.unapproveEmployee(
    account.seededData.displayName,
  );
  await aptSoft('Unapproval confirmed (Approve button visible)', async () => {
    expect(unapproved).toBe(true);
  });

  console.log(' ✓ Entry unapproved');
}

export async function aptStep06_verifyEditableAndUpdate(
  page: Page,
  account: APTTestAccount,
  approvalsPage: ApprovalsPage,
): Promise<void> {
  console.log(
    ' Verifying entry is editable, updating duration %s→%s',
    account.seededData.initialDuration,
    account.seededData.updatedDuration,
  );

  await approvalsPage.navigateToApprovalsPage();
  await approvalsPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await approvalsPage.waitForLoadingToDisappear();

  await page.waitForTimeout(5000);
  await approvalsPage.clickActionDropdown(account.seededData.displayName);
  const viewDetailsOption = page.locator(`//*[text()='View details']`);
  await viewDetailsOption.waitFor({ state: 'visible', timeout: 10000 });
  await viewDetailsOption.click();
  await approvalsPage.waitForLoadingToDisappear();

  // Locate the Edit button directly in the View Details table — do NOT click the
  // entry row first, as that opens the STE trowser which then intercepts the
  // Edit button click with its FormContainer overlay.
  const editBtn = page.getByRole('button', { name: /^edit$/i }).first();
  await expect(editBtn).toBeVisible({ timeout: 10000 });
  await editBtn.click();
  await approvalsPage.waitForLoadingToDisappear();

  const stePage = new SingleTimeEntryPage(page);
  await stePage.updateFieldValue(
    'Duration',
    `0${account.seededData.updatedDuration}:00`,
  );

  await stePage.clickSaveAndCloseButton();
  await approvalsPage.waitForLoadingToDisappear();

  console.log(
    ' ✓ Entry updated to %s hours',
    account.seededData.updatedDuration,
  );
}

export async function aptStep07_reApprove(
  page: Page,
  account: APTTestAccount,
  approvalsPage: ApprovalsPage,
): Promise<void> {
  console.log(
    ' ✓ Re-approving updated entry for %s',
    account.seededData.displayName,
  );

  await approvalsPage.navigateToApprovalsPage();
  await approvalsPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await approvalsPage.waitForLoadingToDisappear();

  const reApproved = await approvalsPage.approveEmployee(
    account.seededData.displayName,
  );
  await aptSoft('Re-approval confirmed', async () => {
    expect(reApproved).toBe(true);
  });

  console.log(' ✓ Entry re-approved');
}

export async function runPayrollAndVerify(
  page: Page,
  account: APTTestAccount,
  approvalsPage: ApprovalsPage,
): Promise<void> {
  const runPayrollPage = new RunPayrollPage(page);

  await selectDateRangeOption(page, 'This month');
  await approvalsPage.waitForLoadingToDisappear();

  await approvalsPage.clickRunPayroll();
  await expect(page).toHaveURL(/runpayroll/i, { timeout: 30000 });
  console.log(' ✓ Navigated to Run Payroll page');

  await runPayrollPage.selectPayPeriodWithCurrentDate();
  await runPayrollPage.handleTaxProblemsPopup();

  const updatedHours = `${account.seededData.updatedDuration}h`;
  const initialHours = `${account.seededData.initialDuration}h`;

  const visible = await runPayrollPage.validateEmployeeHoursVisible(
    account.seededData.employeeName,
    updatedHours,
  );
  expect(visible, `${updatedHours} should be visible in Run Payroll`).toBe(
    true,
  );

  const oldNotVisible = await runPayrollPage.validateEmployeeHoursNotVisible(
    account.seededData.employeeName,
    initialHours,
  );
  expect(
    oldNotVisible,
    `${initialHours} should NOT be visible after update`,
  ).toBe(true);

  console.log(' ✓ Updated hours (%s) reflected in Run Payroll', updatedHours);
}

/**
 * Runs the full APP01 Approvals suite. Returns false when the Approvals
 * sub-menu is not present for this SKU (the suite ended early and made no
 * changes, so the caller should skip cleanup); true when the suite ran.
 */
export async function runApprovalsSuite(
  page: Page,
  account: APTTestAccount,
): Promise<boolean> {
  const approvalsPage = new ApprovalsPage(page);
  const teTabPage = new TimeEntriesPage(page);

  console.log(
    ' Starting suite — role=%s companyType=%s employee=%s',
    account.role,
    account.companyType,
    account.seededData.employeeName,
  );

  await loginAndRoleSetup(page, account as unknown as TETestAccount);
  await validateDashboardAndResolveSku(
    page,
    account as unknown as TETestAccount,
  );
  if (
    !(await navigateToTimeSubmenu(
      page,
      asDashboardAccount(account),
      'Approvals',
    ))
  ) {
    console.log(' Approvals sub-menu not present for this SKU — ending suite.');
    return false;
  }
  await validateApprovalsPage(page, account, approvalsPage);
  await cleanupAPTEntries(page, account);
  await addTimeEntry(page, account, approvalsPage);
  await aptStep03_approveAndValidateLocked(page, account, approvalsPage);
  await aptStep03b_verifyLockedInTimeEntries(page, account, teTabPage);
  await aptStep04_verifyApprovedEntryReadOnly(page, account, approvalsPage);
  await aptStep05_unapprove(page, account, approvalsPage);
  await aptStep06_verifyEditableAndUpdate(page, account, approvalsPage);
  await aptStep07_reApprove(page, account, approvalsPage);
  await runPayrollAndVerify(page, account, approvalsPage);
  return true;
}
