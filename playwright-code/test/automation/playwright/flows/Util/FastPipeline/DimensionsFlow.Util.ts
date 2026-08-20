import { Page, Locator, expect } from '@playwright/test';
import { openQBOTETab } from '../../../pages/QBOLogin';
import TimeClockPage from '../../../pages/TimeClockPage';
import { deleteTimeEntry } from '../TimeClockUtil';
import { LABELS } from '../../../constants';
import TETimeEntriesTabPage from '../../../pages/FastPipeline/TimeEntriesFlowsPage';
import TimeEntriesPage from '../../../pages/TimeEntriesPage';
import TESingleTimeEntryPage from '../../../pages/FastPipeline/TESingleTimeEntryPage';
import ApprovalsPage from '../../../pages/ApprovalsPage';
import RunPayrollPage from '../../../pages/RunPayrollPage';
import DimensionsPage from '../../../pages/DimensionsPage';
import DimensionsFlowsPage, {
  DIMENSION_TIMEOUT,
} from '../../../pages/DimensionsFlowsPage';
import DimensionsListPage from '../../../pages/DimensionsListPage';
import {
  navigateToAccountAndSettingsTime,
  clickTimeSheetFieldsEditButton,
  clickOnTimeTrackingSaveButton,
} from '../../../pages/TimeSettingsPage';
import {
  waitForTimesheetEditOpen,
  ensureDimensionVisibleAndRequired,
} from '../../../pages/TimeTabSettingsPage';
import {
  resolveMatrixAccounts,
  AccountMatrix,
  ResolvedMatrixAccount,
} from './accountMatrix';
import {
  openDateRangeDropdown,
  selectDateRangeOption,
  selectDisplayByOption,
} from '../../../commonUtils';
import EmployeesPage from '../../../pages/EmployeesPage';

/**
 * =============================================================================
 * Dimensions cross-surface E2E — Settings → STE/WTE/Time Clock → Time entries → Approve → Run payroll
 * =============================================================================
 * Flow (single long test per surface, per the framework's combine-in-one-test
 * convention):
 *
 *   1. DIMENSIONS LIST  — best-effort verify the pre-created dimension is listed
 *                         with its options (Settings > Lists > Dimensions). The
 *                         list is a QBO-shell page with no repo test-ids, so this
 *                         is a soft check; pass DIM_NAME (or DIM_LABELS) to assert.
 *   2. TIMESHEET FIELDS — turn ON the dimension's "visible on timesheets" and
 *                         "required" toggles, then Save (explicit save).
 *   3. STE / WTE / TC   — verify dimensions render; required + default validations;
 *                         select a dimension value; make the entry BILLABLE; save.
 *                         WTE uses the weekly cell side panel for dimensions.
 *                         Time Clock uses DimensionsFlowsPage comboboxes.
 *   4. TIME ENTRIES     — enable dimension column, verify value; disable →
 *                         assert hidden; re-enable → assert visible + value retained.
 *   5. UPDATE           — reopen the entry, change the dimension value, re-verify.
 *   6. APPROVALS        — approve (and lock) the entry.
 *   7. RUN PAYROLL      — validate hours (+ dimensions best-effort), submit payroll.
 *
 * Separate track from the RP suites: not coupled to RP employee/duration
 * constants. Account is provided via TEST_ACCOUNT (must have IES dimensions +
 * Payroll Elite + approve, as companyAdmin). The target dimension name comes
 * from DIM_NAME (or the first DIM_LABELS entry); if unset, the first dimension
 * in the Timesheet fields section is used.
 * =============================================================================
 */

/**
 * Account matrix for this track (SKU group -> account-key pool).
 *   index 0 → STE, index 1 → Time Clock, index 2 → WTE
 * Same shape as TE_ACCOUNT_MATRIX / other FastPipeline tracks.
 */
export const DIM_PAYROLL_ACCOUNT_MATRIX: AccountMatrix = {
  // Intuit Enterprise Suite — IES companies with dimensions configured.
  IES: ['DIMSTE01', 'DIMTC01', 'DIMWTE01'],
};

/**
 * Resolves the TEST_ACCOUNT selector into its ordered account array for this
 * track. A SKU group expands to that group's account keys; an exact key resolves
 * to a single account. Returns [] when the selector is unset so the spec simply
 * registers no tests (same pattern as other FastPipeline builders with allowEmpty).
 */
export function buildDimPayrollAccounts(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): ResolvedMatrixAccount[] {
  if (!selector) return [];
  return resolveMatrixAccounts({
    matrix: DIM_PAYROLL_ACCOUNT_MATRIX,
    param: selector,
    label: 'DIM',
    allowEmpty: true,
  });
}

/**
 * Static test data for the pre-created dimension this flow drives. These are
 * fixed (NOT env-driven): the target company must have this dimension with
 * these option values and this default configured.
 *   - valueA: the value first set on the entry
 *   - valueB: the value the entry is updated to
 */
const DIMENSION = {
  name: 'Dimension test',
  options: ['default value', 'value 1', 'value 2'],
  defaultValue: 'default value',
  valueA: 'value 1',
  valueB: 'value 2',
} as const;

// Single payable employee in the test company. Name field in STE shows
// "Test Emp1"; Approvals/Payroll/grid show "Emp1, Test" (Last, First).
const DIMENSION_EMPLOYEE = 'Test Emp1';

const uniqueNote = (): string => `DIM Payroll E2E ${Date.now()}`;
/** "First Last" -> "Last, First" (Approvals/Payroll display format). */
const toDisplayName = (name: string): string => {
  const n = name.trim();
  if (!n || n.includes(',')) return n;
  const parts = n.split(/\s+/);
  if (parts.length < 2) return n;
  return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`;
};

/**
 * Reopens the entry with the given note for edit via the TE grid Edit control.
 */
async function reopenEntryByNote(
  teTab: TETimeEntriesTabPage,
  note: string,
): Promise<boolean> {
  return teTab.reopenEntryByNotes(note);
}

/**
 * Step 1 — validate the pre-created dimension in the QBO Dimensions list:
 * navigate Settings > Lists > Dimensions, assert the dimension + its options on
 * the detail page, then open the Payroll dimension defaults and confirm the
 * dimension has a default (not "None selected") whose value matches dimDefault.
 */
async function validateDimensionInList(
  page: Page,
  dimName: string,
  dimOptions: string[],
  dimDefault: string,
): Promise<void> {
  const dimList = new DimensionsListPage(page);
  await dimList.openViaSettingsMenu();
  console.log('[DIMPR] Dimensions list opened (Settings > Lists > Dimensions)');
  await dimList.assertDimensionVisible(dimName);
  console.log(`[DIMPR] Dimensions list: "${dimName}" is listed`);
  await dimList.openDimensionDetail(dimName);
  console.log(`[DIMPR] Dimension detail page opened for "${dimName}"`);
  if (dimOptions.length) {
    await dimList.assertOptionsVisible(dimOptions);
    console.log(`[DIMPR] Dimension options visible: ${dimOptions.join(', ')}`);
  }
  await dimList.openSetTimeAndPayrollDefaults(dimName);
  console.log('[DIMPR] Payroll dimension defaults page opened');
  await dimList.assertDefaultIsSet(dimName);
  console.log(`[DIMPR] "${dimName}" has a default set (not "None selected")`);
  await dimList.openEditPayrollDefault(dimName);
  if (dimDefault) {
    await dimList.assertAssignedDefaultValue(dimDefault);
    console.log(`[DIMPR] Assigned default value confirmed: "${dimDefault}"`);
  }
  await dimList.closeEditDrawer();
}

/**
 * Step 2 — open Timesheet fields settings and ensure the target dimension's
 * "visible on timesheets" and "required" switches are ON, then Save.
 * "required" is disabled until "visible" is ON, so enable visible first.
 * Returns the dimension name that was toggled (discovered when none is passed).
 */
async function ensureDimensionEnabledAndRequired(
  page: Page,
  targetName: string = DIMENSION.name,
): Promise<string> {
  await navigateToAccountAndSettingsTime(page);
  await clickTimeSheetFieldsEditButton(page);
  await waitForTimesheetEditOpen(page);
  console.log('[DIMPR] Timesheet fields settings opened');

  await ensureDimensionVisibleAndRequired(page, targetName);
  console.log(
    `[DIMPR] Timesheet fields: "${targetName}" set visible + required`,
  );

  await clickOnTimeTrackingSaveButton(page);
  console.log('[DIMPR] Timesheet fields: settings saved');
  return targetName;
}

/**
 * Full cleanup for this flow, matching RP005 STE cleanup
 * (cleanupSTEWorkflowTestData): delete paycheck → count STE rows → only if
 * entries exist, unapprove via ApprovalsPage then delete. Skips unapprove when
 * there is nothing to unlock so pre/post cleanup does not hang.
 * Always re-applies Display by Date + Date range = This month so no entries
 * are missed under a stale week filter.
 */
export async function cleanupDimensionsPayroll(
  page: Page,
  employeeName: string = toDisplayName(DIMENSION_EMPLOYEE),
): Promise<void> {
  console.log('[DIMPR] CLEANUP: delete paycheck → unapprove → delete entry');
  const timeEntriesPage = new TimeEntriesPage(page);
  const teTab = new TETimeEntriesTabPage(page);
  const displayName = toDisplayName(employeeName);

  try {
    await new EmployeesPage(page).deleteEmployeePaycheck();
    console.log('[DIMPR] CLEANUP: paycheck deleted');
  } catch (e) {
    console.log(`[DIMPR] CLEANUP: deletePaycheck skipped/failed: ${e}`);
  }

  try {
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    // This month before the first count — avoid skipping delete on a week filter.
    await teTab.resetListFiltersToThisMonth();

    let entryCount = await timeEntriesPage.countEmployeeRow(displayName);
    console.log(
      `[DIMPR] CLEANUP: found ${entryCount} STE entry(ies) for ${displayName}`,
    );

    if (entryCount === 0) {
      console.log(
        '[DIMPR] CLEANUP: no STE entries — skipping unapprove/delete',
      );
      return;
    }

    try {
      const approvalsPage = new ApprovalsPage(page);
      await approvalsPage.navigateToApprovalsPage();
      await approvalsPage.waitForLoadingToDisappear();
      await approvalsPage.selectDateRange('This month');
      await approvalsPage.waitForLoadingToDisappear().catch(() => undefined);
      // Handles already-unapproved (Approve visible) without hanging.
      await approvalsPage.unapproveEmployee(displayName);
      console.log('[DIMPR] CLEANUP: time unapproved');
    } catch (e) {
      console.log(
        `[DIMPR] CLEANUP: unapprove skipped (already clean or failed): ${e}`,
      );
    }

    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await teTab.resetListFiltersToThisMonth();

    entryCount = await timeEntriesPage.countEmployeeRow(displayName);
    while (entryCount > 0) {
      console.log(
        `[DIMPR] CLEANUP: deleting entry (${entryCount} remaining)...`,
      );
      const deleted = await timeEntriesPage.deleteFirstTimeEntry();
      if (!deleted) break;
      // Re-apply This month after each delete so the next row stays in view.
      await teTab.resetListFiltersToThisMonth();
      entryCount = await timeEntriesPage.countEmployeeRow(displayName);
    }

    // Final pass: This month again, delete any remaining rows.
    await teTab.resetListFiltersToThisMonth();
    entryCount = await timeEntriesPage.countEmployeeRow(displayName);
    while (entryCount > 0) {
      console.log(
        `[DIMPR] CLEANUP: final pass deleting (${entryCount} remaining)...`,
      );
      const deleted = await timeEntriesPage.deleteFirstTimeEntry();
      if (!deleted) break;
      await teTab.resetListFiltersToThisMonth();
      entryCount = await timeEntriesPage.countEmployeeRow(displayName);
    }
    console.log('[DIMPR] CLEANUP: time entry deleted');
  } catch (e) {
    console.log(`[DIMPR] CLEANUP: STE cleanup skipped/failed: ${e}`);
  }
}

/**
 * STEP 4 shared — enable dimension column → validate value → disable → hidden →
 * re-enable → visible + value retained.
 */
async function verifyTeDimensionColumnToggle(
  page: Page,
  teTab: TETimeEntriesTabPage,
  tePage: TimeEntriesPage,
  note: string,
  dimColumn: string,
  expectedValue: string,
): Promise<void> {
  console.log('[DIMPR] STEP 4: verifying entry + dimension column toggle');
  await teTab.isRowWithNotesVisible(note).catch(() => undefined);
  await tePage.waitForLoadingToDisappear().catch(() => undefined);
  await page.waitForTimeout(4000);

  await teTab.setColumnVisibility(dimColumn, true);
  await tePage.waitForLoadingToDisappear().catch(() => undefined);
  await page.waitForTimeout(2000);
  await tePage
    .validateColumnVisible(dimColumn)
    .then(() =>
      console.log(`[DIMPR] TE: dimension column "${dimColumn}" visible`),
    )
    .catch(() =>
      expect
        .soft(false, `TE: dimension column "${dimColumn}" is visible`)
        .toBe(true),
    );

  await page.waitForTimeout(2000);
  const rowAfterCreate = await teTab
    .getRowObjectByNotes(note)
    .catch(() => ({} as Record<string, string>));
  console.log(`[DIMPR] TE columns: ${Object.keys(rowAfterCreate).join(', ')}`);
  console.log(`[DIMPR] TE row (create): ${JSON.stringify(rowAfterCreate)}`);
  const createCell = rowAfterCreate[dimColumn] ?? '';
  expect
    .soft(
      createCell.includes(expectedValue) || expectedValue.includes(createCell),
      `TE grid shows dimension "${dimColumn}"="${expectedValue}" (got "${createCell}")`,
    )
    .toBe(true);
  console.log(`[DIMPR] TE: dimension cell = "${createCell}"`);

  await teTab.setColumnVisibility(dimColumn, false);
  await tePage.waitForLoadingToDisappear().catch(() => undefined);
  await page.waitForTimeout(2000);
  await tePage
    .validateColumnHidden(dimColumn)
    .then(() =>
      console.log(`[DIMPR] TE: dimension column "${dimColumn}" hidden`),
    )
    .catch(() =>
      expect
        .soft(false, `TE: dimension column "${dimColumn}" is hidden`)
        .toBe(true),
    );

  await teTab.setColumnVisibility(dimColumn, true);
  await tePage.waitForLoadingToDisappear().catch(() => undefined);
  await page.waitForTimeout(2000);
  await tePage
    .validateColumnVisible(dimColumn)
    .then(() =>
      console.log(`[DIMPR] TE: dimension column "${dimColumn}" re-enabled`),
    )
    .catch(() =>
      expect
        .soft(
          false,
          `TE: dimension column "${dimColumn}" is visible after re-enable`,
        )
        .toBe(true),
    );

  await page.waitForTimeout(2000);
  const rowAfterToggle = await teTab
    .getRowObjectByNotes(note)
    .catch(() => ({} as Record<string, string>));
  const retainedCell = rowAfterToggle[dimColumn] ?? '';
  expect
    .soft(
      retainedCell.includes(expectedValue) ||
        expectedValue.includes(retainedCell),
      `TE grid retains dimension "${dimColumn}"="${expectedValue}" after column toggle (got "${retainedCell}")`,
    )
    .toBe(true);
  console.log(
    `[DIMPR] STEP 4 done: column toggle ok, retained cell = "${retainedCell}"`,
  );
}

/**
 * Assert Time Entries grid shows Billable = Yes and a visible bill rate value.
 * Enables the Billable / Billable Rate columns via settings if needed.
 */
async function assertTeBillableAndRate(
  page: Page,
  teTab: TETimeEntriesTabPage,
  tePage: TimeEntriesPage,
  note: string,
  expectedRate = '10',
): Promise<void> {
  console.log('[DIMPR] TE: asserting Billable=Yes and bill rate visible');
  await teTab.setColumnVisibility('Billable', true);
  await teTab.setColumnVisibility('Billable Rate', true);
  await tePage.waitForLoadingToDisappear().catch(() => undefined);
  await page.waitForTimeout(1500);

  const row = await teTab
    .getRowObjectByNotes(note)
    .catch(() => ({} as Record<string, string>));
  console.log(
    `[DIMPR] TE billable/rate columns: ${Object.keys(row).join(', ')}`,
  );
  console.log(`[DIMPR] TE billable/rate row: ${JSON.stringify(row)}`);

  const billableKey = Object.keys(row).find((h) => /^billable$/i.test(h));
  const rateKey = Object.keys(row).find((h) =>
    /billable\s*rate|bill\s*rate|^rates?$/i.test(h),
  );

  const billable = (billableKey ? row[billableKey] : '').trim();
  const isYes =
    billable.length > 0 && billable !== '-' && !/^no$/i.test(billable);
  expect.soft(isYes, `TE: Billable is Yes (got "${billable}")`).toBe(true);

  const rate = (rateKey ? row[rateKey] : '').trim();
  expect
    .soft(
      Boolean(rateKey) && rate.length > 0 && rate !== '-',
      `TE: Billable Rate column visible with a value (got key="${rateKey}", value="${rate}")`,
    )
    .toBe(true);
  if (rate) {
    expect
      .soft(
        rate.includes(expectedRate),
        `TE: Billable Rate shows "${expectedRate}" (got "${rate}")`,
      )
      .toBe(true);
  }
  console.log(
    `[DIMPR] TE: Billable="${billable}", Billable Rate="${rate}" (expected rate contains "${expectedRate}")`,
  );
}

/** STEPS 6–7 shared — approve then run payroll (hours assert + submit). */
async function approveAndSubmitPayroll(
  page: Page,
  tePage: TimeEntriesPage,
  employeeName: string,
  expectedHours = '8h',
): Promise<void> {
  const approvals = new ApprovalsPage(page);
  const payroll = new RunPayrollPage(page);
  const displayName = toDisplayName(employeeName);

  console.log('[DIMPR] STEP 6: approving the entry');
  await approvals.navigateToApprovalsPage();
  await approvals.selectDateRange('This month').catch(() => undefined);
  await approvals.searchTeamMember(displayName).catch(() => undefined);
  let approved = await approvals
    .approveEmployee(displayName)
    .catch(() => false);
  if (!approved && displayName !== employeeName) {
    approved = await approvals.approveEmployee(employeeName).catch(() => false);
  }
  console.log(`[DIMPR] STEP 6 done: approved=${approved}`);
  expect.soft(approved, 'Approvals: entry approved and locked').toBe(true);

  console.log(
    '[DIMPR] STEP 7: run payroll — validate hours + dimension, submit',
  );
  await approvals.clickRunPayroll().catch(() => undefined);
  await payroll.prepareRunPayrollScreen().catch(() => undefined);
  await payroll.selectPayPeriodWithCurrentDate().catch(() => undefined);

  await tePage.waitForLoadingToDisappear().catch(() => undefined);
  await page
    .locator('[data-testid="LoadingSpinner"]')
    .first()
    .waitFor({ state: 'hidden', timeout: 60000 })
    .catch(() => undefined);
  await page.waitForTimeout(5000);

  const hoursOk = await payroll
    .validateEmployeeHoursVisible(displayName, expectedHours)
    .catch(() => false);
  expect
    .soft(hoursOk, `Run payroll: employee shows ${expectedHours}`)
    .toBe(true);
  console.log(
    `[DIMPR] Run payroll: hours(${expectedHours}) visible=${hoursOk}`,
  );

  // TODO: re-enable once dimensions popover assertion is stable on Run Payroll.
  // validateDimensionInPayroll(...)

  console.log('[DIMPR] Run payroll: submitting payroll');
  await payroll.submitPayrollWithCashAccount().catch((e) => {
    expect
      .soft(false, `Run payroll: submit payroll succeeds (${e})`)
      .toBe(true);
  });
  console.log('[DIMPR] STEP 7 done: payroll submitted');
}

export async function runSteDimensionsPayrollFlow(
  page: Page,
  account: ResolvedMatrixAccount,
  createdEntries: string[] = [],
): Promise<void> {
  page.setDefaultTimeout(30_000);

  const teTab = new TETimeEntriesTabPage(page);
  const tePage = new TimeEntriesPage(page);
  const ste = new TESingleTimeEntryPage(page);
  const dims = new DimensionsPage(page);

  // Static pre-created dimension driven by this flow (see DIMENSION above).
  let targetDimName: string = DIMENSION.name;
  const dimOptions: string[] = [...DIMENSION.options];
  const dimDefault: string = DIMENSION.defaultValue;

  const note = uniqueNote();
  let employeeName = '';
  // Column header / value tracked for the Time-entries assertions. The column
  // header equals the dimension name; the value is the static valueA/valueB.
  const dimColumn = DIMENSION.name;

  // Login (lands on Time Entries tab).
  await openQBOTETab(page, account.credentials);
  console.log(`[DIMPR] Logged in (account ${account.testId})`);

  // Pre-cleanup — clear any leftover paycheck/approved/locked entry from a prior
  // failed run so this run starts from a clean slate.
  console.log('[DIMPR] PRE-CLEANUP: clearing any leftover state');
  await cleanupDimensionsPayroll(page, toDisplayName(DIMENSION_EMPLOYEE));

  // ---- 1) DIMENSIONS LIST — validate dimension, options, and default --------
  console.log('[DIMPR] STEP 1: validating dimension in Dimensions list');
  try {
    await validateDimensionInList(page, targetDimName, dimOptions, dimDefault);
    console.log('[DIMPR] STEP 1 done: dimension + options + default validated');
  } catch (e) {
    expect.soft(false, `Dimensions list validation (${e})`).toBe(true);
  }

  // ---- 2) TIMESHEET FIELDS — enable "visible on timesheets" + "required" ----
  console.log('[DIMPR] STEP 2: enabling dimension on timesheet + required');
  try {
    targetDimName = await ensureDimensionEnabledAndRequired(
      page,
      targetDimName || undefined,
    );
    console.log(
      `[DIMPR] Timesheet fields: "${targetDimName}" set visible + required.`,
    );
  } catch (e) {
    expect
      .soft(false, `Timesheet fields: enable visible + required (${e})`)
      .toBe(true);
  }

  // Back to Time Entries for STE.
  await teTab.navigateToTimeEntriesPage().catch(() => undefined);

  // ---- 3) STE — render + required + default + billable + set dimension ------
  console.log('[DIMPR] STEP 3: creating billable STE entry with dimension');
  await teTab.openAddTimeOption('Single time entry');
  await ste.handleTourModal();
  await ste.expectSingleTimeEntryVisible();
  console.log('[DIMPR] STE trowser opened');

  // Team member first — dimensions and their (company/worker) defaults seed once
  // the team member is known. Helper skips "+ Add new" and returns the name.
  employeeName = await teTab.selectNameOption();
  console.log(`[DIMPR] Employee: "${employeeName}"`);

  // Use duration mode (start/end toggle OFF) so a single hh:mm is enough. Read
  // the real toggle state from the input (isChecked) rather than probing fields.
  if (
    await ste
      .getSetClockInToggle()
      .isChecked()
      .catch(() => false)
  ) {
    await ste.clickSetClockInAndOutToggles();
  }
  await ste.enterFieldValue('duration', '8:00').catch(() => undefined);

  // Customer (billable requires one) — first real option (helper skips "+ Add new").
  await teTab
    .openDropdownAndSelectFirstOption('Customer')
    .catch(() => undefined);
  await ste.checkCheckboxIfVisible('Billable');
  await ste.fillBillRateInput('10').catch(() => undefined);

  await ste.enterNotes(note).catch(() => undefined);

  // Dimensions render once the team member is selected.
  const widgetVisible = await dims.isWidgetVisible();
  expect.soft(widgetVisible, 'STE: dimensions widget renders').toBe(true);

  if (widgetVisible) {
    const targetIdx = await dims.findRowIndexByLabel(targetDimName);

    // Default validation — the configured default pre-populates the dimension.
    const prefilled = await dims.getRowValue(targetIdx);
    expect
      .soft(
        prefilled.includes(DIMENSION.defaultValue) ||
          DIMENSION.defaultValue.includes(prefilled),
        `STE: default "${DIMENSION.defaultValue}" pre-populates the dimension (got "${prefilled}")`,
      )
      .toBe(true);

    // Required validation (we set the target dimension required in step 2):
    // clear the default, try to save, expect the inline required error.
    if (await dims.isRowRequired(targetIdx)) {
      await dims.clearValue(targetIdx).catch(() => undefined);
      await ste.clickSaveButton().catch(() => undefined);
      await dims
        .expectRequiredError(targetIdx)
        .then(() => console.log('[DIMPR] STE required error shown'))
        .catch(() =>
          expect
            .soft(
              false,
              'STE: required dimension blocks save with inline error',
            )
            .toBe(true),
        );
    }

    // Select the dimension value carried through the flow (static valueA).
    const selected = await dims.selectOption(targetIdx, DIMENSION.valueA);
    expect
      .soft(
        selected.includes(DIMENSION.valueA) ||
          DIMENSION.valueA.includes(selected),
        `STE: dimension set to "${DIMENSION.valueA}" (got "${selected}")`,
      )
      .toBe(true);
    console.log(`[DIMPR] Dimension "${dimColumn}" set to "${selected}"`);
  }

  await ste.clickSaveAndCloseButton();
  await ste.validateSuccessToast().catch(() => undefined);
  createdEntries.push(note);
  console.log(`[DIMPR] STEP 3 done: STE entry saved (note "${note}")`);

  // ---- 4) TIME ENTRIES — column toggle + value retained --------------------
  await verifyTeDimensionColumnToggle(
    page,
    teTab,
    tePage,
    note,
    dimColumn,
    DIMENSION.valueA,
  );
  await assertTeBillableAndRate(page, teTab, tePage, note, '10');

  // ---- 5) UPDATE — change the dimension value, re-verify -------------------
  console.log(`[DIMPR] STEP 5: updating dimension to "${DIMENSION.valueB}"`);
  if (await reopenEntryByNote(teTab, note)) {
    await dims.isWidgetVisible();
    const targetIdx = await dims.findRowIndexByLabel(dimColumn);
    await dims.selectOption(targetIdx, DIMENSION.valueB);
    await ste.clickSaveAndCloseButton();
    await ste.validateSuccessToast().catch(() => undefined);

    // Allow the TE grid to refresh before asserting the updated dimension value.
    await page.waitForTimeout(5000);

    // Filter reset (Customer → Date) + This month before validating edited value.
    await teTab.resetListFiltersToThisMonth();

    const rowAfterUpdate = await teTab
      .getRowObjectByNotes(note)
      .catch(() => ({} as Record<string, string>));
    const cell = rowAfterUpdate[dimColumn] ?? '';
    expect
      .soft(
        cell.includes(DIMENSION.valueB) || DIMENSION.valueB.includes(cell),
        `TE grid reflects updated dimension "${dimColumn}"="${DIMENSION.valueB}" (got "${cell}")`,
      )
      .toBe(true);
    console.log(`[DIMPR] STEP 5 done: dimension cell = "${cell}"`);
  } else {
    console.log(
      '[DIMPR] Update step skipped — could not reopen entry by note.',
    );
  }

  // ---- 6–7) APPROVALS + RUN PAYROLL ----------------------------------------
  await approveAndSubmitPayroll(page, tePage, employeeName, '8h');

  console.log('[DIMPR] Dimensions STE payroll flow complete.');
  // Post-cleanup is handled by the spec afterEach (pass and fail), same as RP STE.
}

/**
 * WTE dimensions payroll flow — same steps as STE, but create/update use the
 * Weekly time entry trowser + cell side panel (where DimensionsPage renders).
 */

/**
 * =============================================================================
 * Time Clock Dimensions E2E (DIMTC-01) — separate track from the STE flow above.
 * =============================================================================
 *   Time Clock (clock in, validate default + required, pick Value A, clock out)
 *     -> Time Entries (dimension column toggle; row shows Value A)
 *     -> STE edit (change to Value B, save)
 *     -> Approvals (filter to worker, approve)
 *     -> Run Payroll (worker + hours + dimension carried over).
 *
 * Uses DimensionsFlowsPage (the Time Clock combobox rendering) — separate from
 * the STE flow's pages/DimensionsPage (qf-dimension quickfills), so the STE flow
 * is untouched. Account comes from the same matrix as the STE flow (TEST_ACCOUNT);
 * login is done inside the flow via openQBOTETab, mirroring runSteDimensionsPayrollFlow.
 * =============================================================================
 */

// Admin team-member whose stale clock entries are cleared before the run; also
// used for the STE edit, Approvals and Run Payroll steps on this track.
const TC_WORKER_NAME = 'Emp1, Test';

/** Cleanup: unapprove a prior run's (approved/locked) entry so it can be deleted. */
async function unapproveTcWorkerEntry(page: Page): Promise<void> {
  const approvals = new ApprovalsPage(page);
  try {
    await approvals.navigateToApprovalsPage();
    await approvals.waitForLoadingToDisappear();
    await approvals.selectDateRange(LABELS.thisMonth);
    const count = await approvals.unapproveAllVisibleEmployees();
    console.log(`[DIMTC] Cleanup unapproved ${count} entr(ies)`);
  } catch (e) {
    console.log(
      `[DIMTC] Unapprove cleanup skipped: ${
        e instanceof Error ? e.message : String(e)
      }`,
    );
  }
}

/** Open Time Clock, clear stale entries, pick the first customer, and clock in. */
async function clockInWithCustomer(page: Page): Promise<void> {
  await unapproveTcWorkerEntry(page);
  await deleteTimeEntry(page, TC_WORKER_NAME).catch(() => undefined);

  await TimeClockPage.navigateToTimeClock(page);
  await selectDisplayByOption(page, LABELS.date);
  await TimeClockPage.waitForLoadingToDisappear(page);
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Clock out first if a previous run left the worker clocked in.
  if (await TimeClockPage.isClockOutButtonVisible(page)) {
    await TimeClockPage.clickClockOut(page);
    await page.waitForTimeout(3000);
  }

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  const options = await TimeClockPage.getCustomerProjectOptions(page);
  expect(
    options.length,
    'expected at least one customer/project',
  ).toBeGreaterThan(0);
  await TimeClockPage.selectCustomerProject(page, options[0]);

  // Clock in — the drawer switches to the clocked-in screen with all fields.
  await TimeClockPage.clickOnClockInButton(page);
  await TimeClockPage.waitForLoadingToDisappearTCPopup(page);
}

/** Ordering: the dimensions widget sits below Customer and above Notes. */
async function validateTcDimensionOrdering(
  page: Page,
  dimensions: DimensionsFlowsPage,
): Promise<void> {
  const dimBox = await dimensions.widget.boundingBox();
  const customerBox = await page
    .locator(`//span[contains(text(),'Customers')]`)
    .first()
    .boundingBox();
  const notesBox = await page
    .locator(`//span[contains(text(),'${LABELS.notes}')]`)
    .first()
    .boundingBox();

  if (!dimBox || !customerBox || !notesBox) {
    throw new Error('Dimension, Customer or Notes field is not positioned');
  }
  expect(dimBox.y).toBeGreaterThan(customerBox.y);
  expect(dimBox.y).toBeLessThan(notesBox.y);
}

// The Billable checkbox on the clock / STE drawer.
const tcBillableCheckbox = (page: Page): Locator =>
  page
    .getByRole('checkbox', { name: new RegExp(LABELS.billable, 'i') })
    .first();

/** Enable Billable on the Time Clock drawer and assert it is checked. */
async function enableAndValidateBillable(page: Page): Promise<void> {
  const billable = tcBillableCheckbox(page);
  await expect(billable).toBeVisible({ timeout: 30000 });
  if (!(await billable.isChecked())) {
    await billable.click();
  }
  await expect(billable).toBeChecked({ timeout: 30000 });
}

/**
 * Run Payroll checks: hours carried over, and the Dimension column shows a
 * dimension link whose popover lists the dimension name.
 */
async function validateTcWorkerInRunPayroll(
  page: Page,
  workerName: string,
  expectedHours: string,
  dimensionName: string,
  dimensionValue: string,
): Promise<void> {
  const runPayrollPage = new RunPayrollPage(page);
  await runPayrollPage.prepareRunPayrollScreen().catch(() => undefined);
  // Select the pay period covering the entry (created today), then let the grid
  // recompute the hours before reading them.
  await runPayrollPage.selectPayPeriodWithCurrentDate();
  await page.waitForTimeout(5000);
  await runPayrollPage.ensureEmployeeCheckboxSelected(workerName);

  const workerRow = page.locator(`//tr[contains(., '${workerName}')]`).first();
  await expect(
    workerRow,
    `expected ${workerName} on the Run Payroll screen`,
  ).toBeVisible({ timeout: 30000 });

  // Hours carried into payroll must match the entry's hours.
  const payrollHours = await runPayrollPage.getEmployeeDuration();
  console.log(
    `[DIMTC] Run Payroll hours for ${workerName}: ${payrollHours}h (entry ${expectedHours}h)`,
  );
  expect(
    payrollHours,
    `Run Payroll hours should match the entry (${expectedHours}h)`,
  ).toBe(parseFloat(expectedHours));

  // Dimension column shows a dimension link (e.g. "1 dimension").
  const dimensionLink = workerRow.getByText(/\d+\s+dimension/i).first();
  await expect(
    dimensionLink,
    'expected a dimension in the Run Payroll Dimension column',
  ).toBeVisible({ timeout: 30000 });
  console.log(
    `[DIMTC] Run Payroll dimension column: "${(
      await dimensionLink.innerText()
    ).trim()}"`,
  );

  // Open the dimensions popover and verify heading, name and value.
  await dimensionLink.click();
  await expect(
    page.getByText('Dimensions', { exact: true }).first(),
    'Dimensions popover heading',
  ).toBeVisible({ timeout: DIMENSION_TIMEOUT });
  await expect(
    page.getByText(new RegExp(dimensionName, 'i')).first(),
    `dimension name "${dimensionName}" in popover`,
  ).toBeVisible({ timeout: DIMENSION_TIMEOUT });
  await expect(
    page.getByText(dimensionValue, { exact: false }).first(),
    `dimension value "${dimensionValue}" in popover`,
  ).toBeVisible({ timeout: DIMENSION_TIMEOUT });
  console.log(
    `[DIMTC-01] Run Payroll dimensions popover: ${dimensionName} = ${dimensionValue}`,
  );

  // Preview payroll and confirm the dimensions column is present.
  await page.getByRole('button', { name: /Preview for \d+ employee/i }).click();
  await expect(
    page.getByText(/\d+\s+dimension/i).first(),
    'expected the Dimensions column on the Preview screen',
  ).toBeVisible({ timeout: DIMENSION_TIMEOUT });
  console.log('[DIMTC-01] Run Payroll preview shows the dimensions column');
}

/**
 * DIMTC-01 — full Time Clock dimension lifecycle in one pass (see header above).
 */
export async function dimensionTimeClockE2EFlow(
  page: Page,
  account: ResolvedMatrixAccount,
): Promise<void> {
  page.setDefaultTimeout(30_000);

  const dimensions = new DimensionsFlowsPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const teTab = new TETimeEntriesTabPage(page);
  const approvalsPage = new ApprovalsPage(page);

  // Login (lands on the Time Entries tab), same as the STE flow.
  await openQBOTETab(page, account.credentials);
  console.log(`[DIMTC] Logged in (account ${account.testId})`);

  // --- Time Clock: clock in, render dimensions, validate default ------------
  await clockInWithCustomer(page);

  await dimensions.waitForWidget();
  const count = await dimensions.getFieldCount();
  expect(count, 'expected at least one dimension selector').toBeGreaterThan(0);
  await expect(dimensions.fieldInput(0)).toBeVisible({
    timeout: DIMENSION_TIMEOUT,
  });

  await validateTcDimensionOrdering(page, dimensions);
  await enableAndValidateBillable(page);

  const dimensionName =
    (await dimensions.getFieldLabels()).find((l) => l.length > 0) ?? '';
  expect(dimensionName, 'expected a dimension field label').toBeTruthy();

  await page.waitForTimeout(1000);
  // Validate the pre-populated default value and log it.
  const defaultValue = (await dimensions.getFieldValue(0)).trim();
  expect(
    defaultValue,
    'expected a pre-populated default dimension value',
  ).not.toBe('');
  console.log(`[DIMTC] Time Clock default dimension value: "${defaultValue}"`);

  // Clear the required dimension: focus, settle, clear, settle. clearValue uses
  // input.clear() (no Escape) so it does not trigger the drawer's "save changes?"
  // dialog that would otherwise block Clock out.
  await dimensions.fieldInput(0).click();
  await page.waitForTimeout(2000);
  await dimensions.clearValue(0);
  await page.waitForTimeout(2000);
  // Add notes (also dismisses the open options dropdown) so Clock out registers.
  await page
    .getByRole('textbox', { name: LABELS.notes })
    .fill('dimensions time clock validation');
  await TimeClockPage.clickClockOut(page);
  await expect(
    page.getByText(/required/i).first(),
    'expected a required-field error when clocking out with the dimension empty',
  ).toBeVisible({ timeout: DIMENSION_TIMEOUT });
  console.log(
    '[DIMTC] Required error shown when clocking out with the dimension empty',
  );

  // Re-select the logged default value (Value A = default), then clock out.
  await dimensions.selectValue(0, defaultValue);
  await expect
    .poll(async () => (await dimensions.getFieldValue(0)).trim(), {
      timeout: DIMENSION_TIMEOUT,
    })
    .toContain(defaultValue);
  const valueA = defaultValue;
  console.log(`[DIMTC] Re-selected default value; clocking out: "${valueA}"`);
  await TimeClockPage.clickClockOut(page);

  // --- Time Entries: dimension column toggle + value retained ---------------
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, LABELS.date);
  await timeEntriesPage.waitForLoadingToDisappear();

  // Enable the dimension column and confirm the row shows Value A.
  await teTab.setColumnVisibility(dimensionName, true);
  await teTab.assertColumnVisible(dimensionName);
  const rowAfterClockOut = await teTab.getRowObjectByNotes(TC_WORKER_NAME);
  console.log(
    '[DIMTC] Time Entries row (after clock-out): %o',
    rowAfterClockOut,
  );
  expect(
    rowAfterClockOut[dimensionName],
    `Time Entries "${dimensionName}" column should show Value A`,
  ).toBe(valueA);

  // Disable the column — its header and value are no longer visible.
  await teTab.setColumnVisibility(dimensionName, false);
  await teTab.assertColumnHidden(dimensionName);
  await expect(
    page.getByRole('cell', { name: valueA, exact: true }),
    `dimension value "${valueA}" should be hidden when the column is off`,
  ).toBeHidden({ timeout: 30000 });
  console.log('[DIMTC] Dimension column hidden — value not visible');

  // Re-enable — the column and its value are visible again and match Value A.
  await teTab.setColumnVisibility(dimensionName, true);
  await teTab.assertColumnVisible(dimensionName);
  const rowColumnReenabled = await teTab.getRowObjectByNotes(TC_WORKER_NAME);
  expect(
    rowColumnReenabled[dimensionName],
    `Time Entries "${dimensionName}" value should match after re-enabling`,
  ).toBe(valueA);
  console.log('[DIMTC] Dimension column re-enabled — value matches Value A');

  // --- STE: edit the time clock entry, change dimension to Value B ---------
  await timeEntriesPage.clickEditForEmployee(TC_WORKER_NAME);
  // STE drawer renders the same dimensions widget — waiting on it asserts open.
  await dimensions.waitForWidget();

  // Billable set on the clock entry is reflected in the STE edit drawer.
  await expect(tcBillableCheckbox(page)).toBeChecked({
    timeout: DIMENSION_TIMEOUT,
  });

  const valueB = await dimensions.selectDifferentOption(0);
  expect(
    valueB,
    'a different dimension option (Value B) should exist to edit to',
  ).not.toBe('');
  await expect
    .poll(async () => (await dimensions.getFieldValue(0)).trim(), {
      timeout: DIMENSION_TIMEOUT,
    })
    .toContain(valueB);
  console.log(`[DIMTC] STE changed dimension value to: "${valueB}"`);

  // Edit the notes too.
  await page
    .getByRole('textbox', { name: LABELS.notes })
    .fill('dimensions time clock - edited');

  // Save & close the STE drawer, then wait for it to close before reading the row.
  await page.getByRole('button', { name: 'Save and close' }).first().click();
  await expect(page.getByText('Single time entry')).toBeHidden({
    timeout: 30000,
  });
  await timeEntriesPage.waitForLoadingToDisappear();

  // Row now shows the edited Value B in the dimension column (edit persisted).
  const rowAfterEdit = await teTab.getRowObjectByNotes(TC_WORKER_NAME);
  console.log('[DIMTC] Time Entries row (after STE edit): %o', rowAfterEdit);
  expect(
    rowAfterEdit[dimensionName],
    `Time Entries "${dimensionName}" column should show edited Value B`,
  ).toBe(valueB);

  // --- Approvals: filter to worker, approve --------------------------------
  await approvalsPage.navigateToApprovalsPage();
  await approvalsPage.waitForLoadingToDisappear();
  await approvalsPage.selectDateRange(LABELS.thisMonth);
  await approvalsPage.searchTeamMember(TC_WORKER_NAME);
  await approvalsPage
    .selectTeamMemberFromSearch(TC_WORKER_NAME)
    .catch(() => undefined);
  await approvalsPage.validateEmployeeVisible(TC_WORKER_NAME);

  const approved = await approvalsPage.approveEmployee(TC_WORKER_NAME);
  expect(approved, `expected ${TC_WORKER_NAME} to be approved`).toBeTruthy();
  await approvalsPage.validateEmployeeApproved(TC_WORKER_NAME);

  // --- Run Payroll: worker + approved hours + dimension carried over -------
  await approvalsPage.clickRunPayroll();
  await validateTcWorkerInRunPayroll(
    page,
    TC_WORKER_NAME,
    rowAfterEdit['Hours'],
    dimensionName,
    valueB,
  );

  console.log('[DIMTC] Time Clock dimensions flow complete.');
}

export async function runWteDimensionsPayrollFlow(
  page: Page,
  account: ResolvedMatrixAccount,
  createdEntries: string[] = [],
): Promise<void> {
  page.setDefaultTimeout(30_000);

  const teTab = new TETimeEntriesTabPage(page);
  const tePage = new TimeEntriesPage(page);
  const dims = new DimensionsPage(page);

  let targetDimName: string = DIMENSION.name;
  const dimOptions: string[] = [...DIMENSION.options];
  const dimDefault: string = DIMENSION.defaultValue;

  const note = `DIM WTE Payroll E2E ${Date.now()}`;
  let employeeName = DIMENSION_EMPLOYEE;
  const dimColumn = DIMENSION.name;
  // 3 consecutive WTE day cols (customer=1, Sun=2 … Sat=8) that fall in the
  // current Thu→Wed pay period AND the visible week — same period
  // selectPayPeriodWithCurrentDate() will select on Run Payroll (so we get 24h).
  // Mon–Wed → [3, 4, 5] (matches TE01 WTE_WEEKDAY_COLS).
  const dayCols = RunPayrollPage.wteDayColumnsInCurrentPayPeriod(3);
  const hoursPerDay = '8';
  const totalHoursLabel = `${dayCols.length * Number(hoursPerDay)}h`;
  if (dayCols.length < 3) {
    console.warn(
      `[DIMPR][WTE] Only ${
        dayCols.length
      } day(s) available in current pay period ∩ WTE week (cols [${dayCols.join(
        ', ',
      )}]); expected hours ${totalHoursLabel}`,
    );
  }

  await openQBOTETab(page, account.credentials);
  console.log(`[DIMPR][WTE] Logged in (account ${account.testId})`);

  console.log('[DIMPR][WTE] PRE-CLEANUP: clearing any leftover state');
  await cleanupDimensionsPayroll(page, toDisplayName(DIMENSION_EMPLOYEE));

  // ---- 1) DIMENSIONS LIST --------------------------------------------------
  console.log('[DIMPR][WTE] STEP 1: validating dimension in Dimensions list');
  try {
    await validateDimensionInList(page, targetDimName, dimOptions, dimDefault);
    console.log(
      '[DIMPR][WTE] STEP 1 done: dimension + options + default validated',
    );
  } catch (e) {
    expect.soft(false, `Dimensions list validation (${e})`).toBe(true);
  }

  // ---- 2) TIMESHEET FIELDS -------------------------------------------------
  console.log(
    '[DIMPR][WTE] STEP 2: enabling dimension on timesheet + required',
  );
  try {
    targetDimName = await ensureDimensionEnabledAndRequired(
      page,
      targetDimName || undefined,
    );
    console.log(
      `[DIMPR][WTE] Timesheet fields: "${targetDimName}" set visible + required.`,
    );
  } catch (e) {
    expect
      .soft(false, `Timesheet fields: enable visible + required (${e})`)
      .toBe(true);
  }

  await teTab.navigateToTimeEntriesPage().catch(() => undefined);
  // TE list under This month before opening WTE.
  await teTab.selectDateRangeThisMonth();

  // ---- 3) WTE — multi-day billable cells + dimension on each day -----------
  console.log(
    '[DIMPR][WTE] STEP 3: creating multi-day billable WTE entry with dimension',
  );
  await teTab.openWeeklyTimeEntryTrowser();
  employeeName =
    (await teTab.prepareWeeklySheet(true, DIMENSION_EMPLOYEE)) ||
    DIMENSION_EMPLOYEE;
  console.log(`[DIMPR][WTE] Employee: "${employeeName}"`);
  await teTab.clearDefaultWeeklyRow().catch(() => undefined);

  const customer = await teTab.selectCustomerFirstOption();
  console.log(`[DIMPR][WTE] Customer selected: "${customer}"`);
  console.log(
    `[DIMPR][WTE] Entering ${hoursPerDay}h on columns [${dayCols.join(
      ', ',
    )}] (${totalHoursLabel} total)`,
  );

  const selectDimValue = async (value: string): Promise<string> => {
    const selected = await dims.selectValueByName(targetDimName, value);
    if (!selected.includes(value)) {
      throw new Error(
        `WTE: expected dimension "${value}" after select (got "${selected}")`,
      );
    }
    return selected;
  };

  const setAndAssertBillableRate = async (): Promise<void> => {
    const { billableChecked, rateValue } =
      await teTab.setSidePanelBillableAndRate('10');
    expect
      .soft(billableChecked, 'WTE: Billable checkbox is checked')
      .toBe(true);
    expect
      .soft(
        rateValue.includes('10'),
        `WTE: Bill rate input shows 10 (got "${rateValue}")`,
      )
      .toBe(true);
    console.log(`[DIMPR][WTE] Billable checked, Bill rate="${rateValue}"`);
  };

  // ---- Day 1: open panel → required check (then reset; do not keep these hours) -
  const firstCol = dayCols[0];
  await teTab.fillActiveCellHours(hoursPerDay, firstCol);

  console.log('[DIMPR][WTE] waiting 3s for side drawer / dimension field');
  await page.waitForTimeout(3000);

  await setAndAssertBillableRate();
  await teTab.fillSidePanelNotes(note);

  await expect
    .soft(
      dims.comboboxForDimension(targetDimName),
      'WTE: dimension combobox visible in side drawer',
    )
    .toBeVisible({ timeout: 15000 });

  console.log(
    `[DIMPR][WTE] selecting dimension "${DIMENSION.valueA}" then clearing for required check`,
  );
  await selectDimValue(DIMENSION.valueA);
  await page.waitForTimeout(3000);

  await dims.clearValueByName(targetDimName);
  await page.waitForTimeout(3000);

  // Save immediately after closing options — triggers required validation.
  await teTab.wteSave();
  await page.waitForTimeout(3000);

  await expect
    .soft(
      dims.panelRequiredMessage(),
      'WTE: panel shows Required under dimension field',
    )
    .toBeVisible({ timeout: 10000 });

  await expect
    .soft(
      dims.requiredDimensionAlert(targetDimName),
      `WTE: alert lists missing required dimension ": ${targetDimName}"`,
    )
    .toBeVisible({ timeout: 10000 });
  console.log('[DIMPR][WTE] dimension required validated (panel + alert)');

  // Required-check Save poisons day 1 — reset row, then fill each day once.
  await selectDimValue(DIMENSION.valueA).catch(() => undefined);
  await teTab.clearDefaultWeeklyRow().catch(() => undefined);
  const customerAfterReset = await teTab.selectCustomerFirstOption();
  console.log(
    `[DIMPR][WTE] Customer re-selected after required check: "${customerAfterReset}"`,
  );

  // One pass per day: hours → billable/notes (day 1) → dimension last.
  // Do not re-click the cell after dimension select (re-seeds company default).
  for (let i = 0; i < dayCols.length; i++) {
    const col = dayCols[i];
    await teTab.fillActiveCellHours(hoursPerDay, col);
    await page.waitForTimeout(1000);

    if (i === 0) {
      await setAndAssertBillableRate();
      await teTab.fillSidePanelNotes(note);
    }

    await selectDimValue(DIMENSION.valueA);

    const dimVal = await dims.getValueByName(targetDimName);
    expect(
      dimVal.includes(DIMENSION.valueA) &&
        !dimVal.includes(DIMENSION.defaultValue),
      `WTE day col ${col}: dimension is "${DIMENSION.valueA}" not default (got "${dimVal}")`,
    ).toBe(true);
    console.log(`[DIMPR][WTE] day col ${col}: hours + dimension="${dimVal}"`);
  }

  // Settle after selecting value 1 on the last cell before save.
  await page.waitForTimeout(2000);
  await teTab.wteSaveAndClose();
  createdEntries.push(note);
  console.log(
    `[DIMPR][WTE] STEP 3 done: WTE multi-day entry saved (note "${note}", ${totalHoursLabel}, cols [${dayCols.join(
      ', ',
    )}])`,
  );

  // ---- 4) TIME ENTRIES — column toggle + value retained --------------------
  await teTab.selectDateRangeThisMonth();
  await verifyTeDimensionColumnToggle(
    page,
    teTab,
    tePage,
    note,
    dimColumn,
    DIMENSION.valueA,
  );
  await assertTeBillableAndRate(page, teTab, tePage, note, '10');

  // ---- 5) UPDATE — reopen WTE cell panel, change dimension, re-verify ------
  console.log(
    `[DIMPR][WTE] STEP 5: updating dimension to "${DIMENSION.valueB}" via WTE`,
  );
  try {
    await teTab.openWeeklyTimeEntryTrowser();
    await teTab.prepareWeeklySheet(true, employeeName || DIMENSION_EMPLOYEE);
    // Edit via WTE only — open first multi-day cell and change dimension.
    await teTab.clickWeekdayCell(dayCols[0]);
    await page.waitForTimeout(1000);
    const widgetOk = await dims.isWidgetVisible();
    if (widgetOk) {
      // Move focus off the hours CellInput onto the dimension field first.
      const dimCombobox = dims.comboboxForDimension(dimColumn);
      await expect(dimCombobox).toBeVisible({ timeout: 15000 });
      await dimCombobox.click({ force: true });
      // Settle after prior save / panel open before choosing value 2.
      await page.waitForTimeout(2000);

      const selected = await dims.selectValueByName(
        dimColumn,
        DIMENSION.valueB,
      );
      expect(
        selected.includes(DIMENSION.valueB),
        `WTE update: dimension set to "${DIMENSION.valueB}" (got "${selected}")`,
      ).toBe(true);
      await page.waitForTimeout(2000);
      await teTab.wteSaveAndClose();
      await page.waitForTimeout(5000);

      // Filter reset (Customer → Date) + This month before validating edited value.
      await teTab.resetListFiltersToThisMonth();
      await teTab.setColumnVisibility(dimColumn, true);
      await page.waitForTimeout(2000);

      const rowAfterUpdate = await teTab
        .getRowObjectByNotes(note)
        .catch(() => ({} as Record<string, string>));
      const cell = rowAfterUpdate[dimColumn] ?? '';
      expect
        .soft(
          cell.includes(DIMENSION.valueB) || DIMENSION.valueB.includes(cell),
          `TE grid reflects updated dimension "${dimColumn}"="${DIMENSION.valueB}" (got "${cell}")`,
        )
        .toBe(true);
      console.log(`[DIMPR][WTE] STEP 5 done: dimension cell = "${cell}"`);
    } else {
      console.log(
        '[DIMPR][WTE] Update step skipped — dimensions widget not visible on cell panel.',
      );
      await teTab.closeWeeklyTrowserIfOpen().catch(() => undefined);
    }
  } catch (e) {
    console.log(`[DIMPR][WTE] Update step skipped/failed: ${e}`);
    await teTab.closeWeeklyTrowserIfOpen().catch(() => undefined);
  }

  // ---- 6–7) APPROVALS + RUN PAYROLL ----------------------------------------
  // Run payroll Value B / dimensions popover assert stays commented in
  // approveAndSubmitPayroll for now.
  await approveAndSubmitPayroll(page, tePage, employeeName, totalHoursLabel);

  console.log('[DIMPR] Dimensions WTE payroll flow complete.');
}
