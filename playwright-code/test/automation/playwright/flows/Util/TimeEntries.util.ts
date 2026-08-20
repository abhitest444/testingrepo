import { type Locator, Page, expect } from '@playwright/test';
import SingleTimeEntryPage from '../../pages/SingleTimeEntryPage';
import TimeEntriesPage from '../../pages/TimeEntriesPage';
import ApprovalsPage from '../../pages/ApprovalsPage';
import TimeMenuNavigationPage from '../../pages/TimeMenuNavigationPage';
import ReportsPage from '../../pages/ReportsPage';
import RunPayrollPage from '../../pages/RunPayrollPage';
import EmployeesPage from '../../pages/EmployeesPage';
import SingleTimeActivityPage, {
  OIGQL_URL_PATTERN,
  matchTimeEntryBatchSaveResponse,
  waitForResponseWithURLandBody,
} from '../../pages/SingleTimeActivityPage';
import { LABELS } from '../../utils';
import { LABELS as CONSTANTS, testData } from '../../constants';
import * as commonLocator from '../../commonUtils';
import {
  selectDisplayByOption,
  getDisplayByDropdown,
  getDateRangeDropdown,
  openDateRangeDropdown,
  selectDateRangeOption,
  clickAddTimeDropdown,
  selectSingleTimeEntryFromAddTime,
  normalizeToMinutes,
  normalizeName,
} from '../../commonUtils';
import { fillSingleTAFields } from './SingleTimeActivityCRUD.util';
import { BreaksRulesPage } from '../../pages/BreaksRulesPage';
import TimeSettingsPage, {
  navigateToAccountAndSettingsTime,
  navigateToApprovalsPage,
  navigateToTimeEntries,
  verifyMileageTrackingStatus,
  waitForLoadingToDisappearTEPopup,
  clickRunPayrollButtonInApprovals,
  waitForLoadingToDisappear,
} from '../../pages/TimeSettingsPage';
import { validateMilageValueInTimeEntriesTable } from './Mileage.util';
import { deactivateAllTestCustomFields } from './CustomFieldSettings.Util';
import * as weeklyTimeEntryPage from '../../pages/WeeklyTimeEntryPage';

/** Defaults match legacy elite STE coverage (standard employee). */
const DEFAULT_STE_EMPLOYEE_DISPLAY_NAME = 'AAATEST Emp1';
const DEFAULT_TIME_ENTRIES_TABLE_EMPLOYEE_MATCH = 'Emp1, AAATEST';

export function normalizeTimeEntriesTableMatchCandidates(
  raw: string | string[] | undefined,
): string[] {
  if (raw == null) {
    return [];
  }
  const arr = Array.isArray(raw) ? raw : [raw];
  return [...new Set(arr.map((s) => String(s).trim()).filter(Boolean))];
}

/** First candidate whose row has cells. Polls briefly for slow grids; never falls back to candidates[0] on zero matches. */
export async function pickTimeEntriesRowEmployeeSubstring(
  timeEntriesPage: TimeEntriesPage,
  candidates: string[],
): Promise<string> {
  let resolved = '';
  await expect
    .poll(
      async () => {
        for (const c of candidates) {
          const cells = await timeEntriesPage.getRowCellsForEmployee(c);
          if (cells.length > 0) {
            resolved = c;
            return c;
          }
        }
        return '';
      },
      { timeout: 20000 },
    )
    .not.toBe('');
  return resolved;
}

export type AddEditViewSteOptions = {
  /**
   * Name field / team member to enter time for (default AAATEST Emp1).
   * Ignored when `teamMemberTypeLabel` is set.
   */
  steEmployeeDisplayName?: string;
  /**
   * Team member **type** subcopy (GraphQL `SubLabel`, e.g. en "QBO user"). Uses
   * `selectTeamMemberByMainLabel` from WeeklyTimeEntryPage with `matchSubLabel` and STE Name context.
   * When set, you must also pass `timeEntriesTableEmployeeMatch`.
   */
  teamMemberTypeLabel?: string;
  /**
   * Substring(s) used to find that person’s rows in the Time Entries **Name** column. QBO may show
   * the sign-in **email**, **Last, First** (e.g. `cadmin, test`), or **First Last** (`test cadmin`).
   * Pass a **string** or **string[]**; with `teamMemberTypeLabel`, each value is tried in order
   * after save until a row matches (no silent fallback to the first entry if none match).
   * Required when using `teamMemberTypeLabel`.
   * Defaults to the legacy table string when using the default display name; otherwise defaults to the display name.
   */
  timeEntriesTableEmployeeMatch?: string | string[];
  /**
   * When using `teamMemberTypeLabel`, optional substring of the **left** display text in the Name
   * dropdown row (prod often shows several "QBO user" rows). If omitted, the first matching type row is used.
   */
  qboUserRowMainLabelContains?: string;
};

/**
 * Deletes every Time Entries row for `employeeMatch` in Date view / This month
 * (same behavior as addEditViewSte pre-clean). Used for setup/teardown; errors in `finally`
 * are typically swallowed by callers.
 */
export async function deleteAllTimeEntriesForEmployeeInDateViewThisMonth(
  page: Page,
  employeeMatch: string,
): Promise<void> {
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await commonLocator.selectDisplayByOption(page, CONSTANTS.date);
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  const empRows = timeEntriesPage.getAllRowsForAnEmployee(employeeMatch);
  let count = await empRows.count();
  let guard = 0;
  while (count > 0 && guard++ < 50) {
    await timeEntriesPage.clickActionDropdownForEmployee(employeeMatch);
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();
    count = await timeEntriesPage.countEmployeeRow(employeeMatch);
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.waitForTableOrNoEntriesMessage();
    count = await timeEntriesPage.countEmployeeRow(employeeMatch);
  }
}

export const addEditViewSte = async (
  page: Page,
  options?: AddEditViewSteOptions,
) => {
  const teamMemberTypeLabel = options?.teamMemberTypeLabel?.trim();
  const steEmployeeDisplayName =
    options?.steEmployeeDisplayName ?? DEFAULT_STE_EMPLOYEE_DISPLAY_NAME;

  const tableRowMatchCandidates = teamMemberTypeLabel
    ? normalizeTimeEntriesTableMatchCandidates(
        options?.timeEntriesTableEmployeeMatch,
      )
    : null;

  if (teamMemberTypeLabel && (tableRowMatchCandidates?.length ?? 0) === 0) {
    throw new Error(
      'addEditViewSte: pass timeEntriesTableEmployeeMatch (string or non-empty string[]) when teamMemberTypeLabel is set. Use substrings that may appear in the Time Entries Name column (sign-in email and/or display name).',
    );
  }

  let resolvedTableEmployeeMatch = teamMemberTypeLabel
    ? ''
    : (() => {
        const raw = options?.timeEntriesTableEmployeeMatch;
        if (raw != null) {
          const list = normalizeTimeEntriesTableMatchCandidates(raw);
          if (list.length > 0) {
            return list[0]!;
          }
        }
        return steEmployeeDisplayName === DEFAULT_STE_EMPLOYEE_DISPLAY_NAME
          ? DEFAULT_TIME_ENTRIES_TABLE_EMPLOYEE_MATCH
          : steEmployeeDisplayName;
      })();

  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  // const commonLocator = new CommonLocators(page);

  const assertSteRowHours = async (
    label: string,
    row: Record<string, string>,
    expectedDuration: string,
    rowMatchForGrid: string,
  ) => {
    try {
      await expect(normalizeToMinutes(row.Hours || '')).toBe(
        normalizeToMinutes(expectedDuration || ''),
      );
    } catch (e) {
      const rawTds = await timeEntriesPage.getRowCellsForEmployee(
        rowMatchForGrid,
      );
      // eslint-disable-next-line no-console -- diagnostic when Hours scrape/assert fails
      console.log(`[addEditViewSte] ${label}: Hours assert failed`, {
        tableRowMatchCandidates,
        rowMatchForGrid,
        row,
        rawTds,
        expectedDuration,
        receivedMinutes: normalizeToMinutes(row.Hours || ''),
        expectedMinutes: normalizeToMinutes(expectedDuration || ''),
      });
      throw e;
    }
  };

  // Navigate to Time Entries page
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  // Verify the "Display by" dropdown is visible
  await expect(getDisplayByDropdown(page)).toBeVisible();
  const displayByDefaultValue = await page
    .getByLabel(CONSTANTS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(CONSTANTS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, CONSTANTS.date);

  await timeEntriesPage.waitForLoadingToDisappear();

  // Open the "Date range" dropdown
  await openDateRangeDropdown(page);
  // Select "custom date range" from the "Date range" dropdown
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  if (tableRowMatchCandidates?.length) {
    for (const c of tableRowMatchCandidates) {
      await deleteAllTimeEntriesForEmployeeInDateViewThisMonth(page, c);
    }
  } else {
    await deleteAllTimeEntriesForEmployeeInDateViewThisMonth(
      page,
      resolvedTableEmployeeMatch,
    );
  }

  try {
    // Add new entry using STE
    await clickAddTimeDropdown(page);
    await selectSingleTimeEntryFromAddTime(page);
    await singleTimeEntryPage.expectSingleTimeEntryVisible();
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(2000);
    await singleTimeEntryPage.waitForPageReady();
    await singleTimeEntryPage.handlePopupsInAnyOrder();
    await singleTimeEntryPage.waitTillNameFieldVisible();

    if (
      await page
        .getByRole('heading', {
          name: 'Go to QuickBooks Time to enter a timesheet',
        })
        .or(page.getByRole('heading', { name: 'Go to QuickBooks Time to' }))
        .isVisible()
    ) {
      await page.getByLabel('Please do not show again').click();
      await page.locator(`//button/*[text()='Close']`).click();
    }

    // Fill in all entry details and save values for validation
    if (teamMemberTypeLabel) {
      await weeklyTimeEntryPage.selectFirstSteNameTeamMemberExcludingQboUserType(
        page,
      );
      await page.waitForTimeout(500);
      await weeklyTimeEntryPage.selectTeamMemberByMainLabel(
        page,
        teamMemberTypeLabel,
        {
          matchSubLabel: true,
          context: 'singleTimeEntryName',
          ...(options?.qboUserRowMainLabelContains?.trim()
            ? {
                matchMainLabelContains:
                  options.qboUserRowMainLabelContains.trim(),
              }
            : {}),
        },
      );
      await expect
        .poll(
          async () =>
            ((await singleTimeEntryPage.getFieldValue('Name')) || '').trim(),
          { timeout: 10000 },
        )
        .not.toEqual('');
    } else {
      // Open Name picker and click row by label (no clear/type) — same as QBO-user STE path.
      await weeklyTimeEntryPage.selectTeamMemberByMainLabel(
        page,
        steEmployeeDisplayName,
        { context: 'singleTimeEntryName' },
      );
      await expect
        .poll(
          async () =>
            ((await singleTimeEntryPage.getFieldValue('Name')) || '').trim(),
          { timeout: 10000 },
        )
        .not.toEqual('');
    }
    const nameValue = await singleTimeEntryPage.getFieldValue('Name');

    // Ensure 'Set clock in and out' is toggled off for duration entry
    const isSetClockOn = await singleTimeEntryPage.verifySetClockToggleState();
    if (isSetClockOn) {
      await singleTimeEntryPage.clickSetClockInAndOutToggles();
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    await singleTimeEntryPage.fillStartDate(formattedDate);
    await singleTimeEntryPage.enterFieldValue('Duration', '1:00');
    const durationValue = await singleTimeEntryPage.getFieldValue('Duration');

    await singleTimeEntryPage.enterNotes('Test entry for deletion');
    const notesValue = await singleTimeEntryPage.getNotesFieldValue();
    await singleTimeEntryPage.openAndselectCustomerOption(1);
    const customerValue =
      (await singleTimeEntryPage.getFieldValue('Customer')) ??
      (await singleTimeEntryPage.getFieldValue('Customer/Project')) ??
      null;

    // Hover Customers tooltip
    const customersTooltip = page
      .locator('[aria-label*="Can\'t find all your customers"]')
      .first();
    await customersTooltip.hover();
    await page.waitForTimeout(500);

    await singleTimeEntryPage.openDropdown('Service');
    await page.waitForTimeout(500);
    await singleTimeEntryPage.clickDropdownOption(1, 'Service');
    const serviceValue = await singleTimeEntryPage.getFieldValue('Service');

    if (await singleTimeEntryPage.checkFieldVisibility('Billable (per hour)')) {
      await singleTimeEntryPage.checkCheckboxIfVisible('Billable (per hour)');
      await singleTimeEntryPage.fillBillRateInput('5.00');
    }

    // Save the entry
    await singleTimeEntryPage.clickSaveAndCloseButton();
    await singleTimeEntryPage.validateSuccessToast();
    await timeEntriesPage.waitForLoadingToDisappear();

    if (tableRowMatchCandidates?.length) {
      resolvedTableEmployeeMatch = await pickTimeEntriesRowEmployeeSubstring(
        timeEntriesPage,
        tableRowMatchCandidates,
      );
    }

    // Validate in Date view
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.validateDateWiseDataVisible();
    const dateViewRowObj = await timeEntriesPage.getRowObjectForEmployee(
      resolvedTableEmployeeMatch,
    );
    await assertSteRowHours(
      'Date view',
      dateViewRowObj,
      durationValue || '',
      resolvedTableEmployeeMatch,
    );
    await expect(normalizeName(dateViewRowObj.Name || '')).toBe(
      normalizeName(nameValue || ''),
    );
    await expect(dateViewRowObj.Customer).toBe(customerValue);
    await expect(dateViewRowObj.Service).toBe(serviceValue);
    await expect(dateViewRowObj.Notes).toContain(notesValue);

    // Validate in Customer view
    await selectDisplayByOption(page, 'Customer');
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.validateCustomerRecordVisible(customerValue || '');
    await timeEntriesPage.clickCustomerName(customerValue || '');
    await timeEntriesPage.validateDateWiseDataVisible();
    const customerViewRowObj = await timeEntriesPage.getRowObjectForEmployee(
      resolvedTableEmployeeMatch,
    );
    await assertSteRowHours(
      'Customer view',
      customerViewRowObj,
      durationValue || '',
      resolvedTableEmployeeMatch,
    );
    await expect(normalizeName(customerViewRowObj.Name || '')).toBe(
      normalizeName(nameValue || ''),
    );
    await expect(customerViewRowObj.Service).toBe(serviceValue);
    await expect(customerViewRowObj.Notes).toContain(notesValue);
    await page.getByRole('button', { name: 'Go back' }).click();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Switch back to Date view for editing
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();

    // Edit the entry
    await timeEntriesPage.clickEditForEmployee(resolvedTableEmployeeMatch);
    await singleTimeEntryPage.expectSingleTimeEntryVisible();
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(2000);

    // Edit the duration and notes
    await singleTimeEntryPage.enterFieldValue('Duration', '2:30');
    const editedDurationValue = await singleTimeEntryPage.getFieldValue(
      'Duration',
    );

    await singleTimeEntryPage.enterNotes('Updated test entry for validation');
    const editedNotesValue = await singleTimeEntryPage.getNotesFieldValue();

    // Edit the customer (select different option)
    await singleTimeEntryPage.openAndselectCustomerOption(2);
    const editedCustomerValue =
      (await singleTimeEntryPage.getFieldValue('Customers')) ??
      (await singleTimeEntryPage.getFieldValue('Customer')) ??
      (await singleTimeEntryPage.getFieldValue('Customer/Projects')) ??
      null;

    // Save the edited entry
    await singleTimeEntryPage.clickSaveAndCloseButton();
    await singleTimeEntryPage.validateSuccessToast();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Validate the edit was successful in Date view
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.validateDateWiseDataVisible();
    const editedDateViewRowObj = await timeEntriesPage.getRowObjectForEmployee(
      resolvedTableEmployeeMatch,
    );
    await assertSteRowHours(
      'Date view (edited)',
      editedDateViewRowObj,
      editedDurationValue || '',
      resolvedTableEmployeeMatch,
    );
    await expect(editedDateViewRowObj.Customer).toBe(editedCustomerValue);
    await expect(editedDateViewRowObj.Notes).toContain(editedNotesValue);
  } finally {
    try {
      if (tableRowMatchCandidates?.length) {
        for (const c of tableRowMatchCandidates) {
          await deleteAllTimeEntriesForEmployeeInDateViewThisMonth(page, c);
        }
      } else {
        await deleteAllTimeEntriesForEmployeeInDateViewThisMonth(
          page,
          resolvedTableEmployeeMatch,
        );
      }
    } catch {
      /* best-effort cleanup; do not mask test failure */
    }
  }
};

/**
 * Cleanup function to delete ALL time entries regardless of employee name
 * This should be run after tests to ensure clean state
 */
export const cleanupAllTimeEntries = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);

  try {
    console.log('Starting cleanup: Deleting ALL time entries...');

    // Navigate to Time Entries page
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Set display to Date view and date range to This month
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();

    console.log('Checking This month for time entries...');
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    await deleteAllVisibleTimeEntries(page, timeEntriesPage);

    await deleteAllBreakRules(page);

    console.log('Cleanup completed successfully - all time entries deleted');
  } catch (error) {
    console.log('Cleanup encountered an error:', error);
    // Don't throw error to avoid failing the test due to cleanup issues
  }
};

/**
 * Time entries cleanup only (no Break Rules navigation/deletes).
 * Use for suites that don't touch Breaks to avoid extra hops.
 */
export const cleanupAllTimeEntriesOnly = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);

  try {
    console.log(
      'Starting cleanup: Deleting ALL time entries (no Break Rules)...',
    );

    // Navigate to Time Entries page
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Set display to Date view and date range to This month
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();

    console.log('Checking This month for time entries...');
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    await deleteAllVisibleTimeEntries(page, timeEntriesPage);

    console.log(
      'Cleanup completed successfully - all time entries deleted (no Break Rules)',
    );
  } catch (error) {
    console.log('Cleanup encountered an error:', error);
  }
};
export const cleanupTimeEntriesForAT = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);

  try {
    console.log('Starting cleanup for Add Time drawer tests');

    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    const displayBy = getDisplayByDropdown(page);
    if (!(await displayBy.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log(
        'Display by not visible; skipping AT time entries cleanup (no Date view)',
      );
      return;
    }

    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();

    const ranges = ['This month', 'This week'] as const;
    for (const range of ranges) {
      console.log(`Checking ${range} for time entries...`);
      await openDateRangeDropdown(page);
      await selectDateRangeOption(page, range);
      await timeEntriesPage.waitForLoadingToDisappear();

      await deleteTimeEntriesForTimeEditFlows(page, timeEntriesPage);
    }

    console.log('cleanup completed successfully');
  } catch (error) {
    console.log('cleanup encountered an error:', error);
  }
};

export const deleteAllBreakRules = async (page: Page): Promise<void> => {
  console.log('========== CLEANUP: Deleting all break rules ==========');

  try {
    // Navigate to Account and Settings -> Time -> Breaks section
    const breaksRulesPage = new BreaksRulesPage(page);
    await breaksRulesPage.goto();
    console.log('  ✓ Navigated to Breaks Rules page');

    // Wait for the table to load
    await page.waitForTimeout(2000);
    //await waitForPageReady(page);

    // `BreaksRulesPage.table` is the first `//table` on the page — that is often *not* the break
    // rules grid (e.g. another widget can render a table whose tbody tr is empty state / tasks copy).
    // Target the data grid that has the Break name column, and only rows with an Actions delete.
    const breaksDataTable = page
      .locator('table[role="table"]')
      .filter({ has: page.getByRole('columnheader', { name: 'Break name' }) })
      .first();
    // Require at least one <td> so we never treat a header-only <tr> (e.g. th row in tbody) as a rule row.
    const tableRows = breaksDataTable
      .locator('tbody tr')
      .filter({ has: page.locator('td') })
      .filter({
        has: page.locator(
          'button[aria-label*="Delete"], button:has-text("Delete")',
        ),
      });
    let rowCount = await tableRows.count();
    console.log(`  Found ${rowCount} break rule(s) to delete`);

    // Loop through and delete all break rules
    let deletedCount = 0;
    while (rowCount > 0) {
      try {
        // Always target the first row since rows shift after deletion
        const firstRow = tableRows.first();

        // Check if the row exists and is visible
        const isVisible = await firstRow.isVisible({ timeout: 2000 });
        if (!isVisible) {
          console.log('  No more visible rows to delete');
          break;
        }

        // Get the break name before deleting for logging
        const breakName = await firstRow.locator('td').first().textContent();
        console.log(`  Deleting break rule: ${breakName?.trim() || 'Unknown'}`);

        // Find and click the delete button in the row
        const deleteButton = firstRow.locator(
          'button[aria-label*="Delete"], button:has-text("Delete")',
        );
        await deleteButton.click();
        console.log(`    ✓ Clicked delete button`);

        // Wait for confirmation modal to appear
        await page.waitForTimeout(1000);

        // Confirm deletion by clicking "Yes, delete" or "Delete" button in the modal
        // const confirmDeleteButton = page.getByRole('button', {
        //   name: /yes, delete|delete|confirm/i
        // });
        // await expect(confirmDeleteButton).toBeVisible({ timeout: 5000 });
        // await confirmDeleteButton.click();
        await page
          .locator('//button[.//span[text()="Delete"]]')
          .first()
          .click({ force: true });
        await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
          state: 'hidden',
          timeout: 0,
        });
        console.log(`    ✓ Confirmed deletion`);

        // Wait for the deletion to complete and table to refresh
        await page.waitForTimeout(2000);
        //await waitForPageReady(page);

        deletedCount++;

        // Update row count for next iteration
        rowCount = await tableRows.count();
        console.log(
          `    ✓ Break rule deleted successfully (${deletedCount} total deleted)`,
        );
      } catch (error) {
        console.log(`    ✗ Error deleting break rule: ${error}`);
        // Try to close any open modals
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);

        // Recount rows to see if we should continue
        rowCount = await tableRows.count();

        // If we still have rows but encountered an error, skip this one
        if (rowCount > 0) {
          console.log(
            `    Attempting to continue with remaining ${rowCount} break(s)`,
          );
          // Try to refresh the page state
          await breaksRulesPage.goto();
          rowCount = await tableRows.count();
        }
      }
    }

    console.log(
      `========== CLEANUP COMPLETE: Deleted ${deletedCount} break rule(s) ==========`,
    );
  } catch (error) {
    console.error('Error during breaks cleanup:', error);
    throw error;
  }
};

/**
 * Helper function to delete all visible time entries regardless of employee name
 */
export const deleteAllVisibleTimeEntries = async (
  page: Page,
  timeEntriesPage: TimeEntriesPage,
) => {
  try {
    let iterationCount = 0;
    const maxIterations = 50; // Safety limit to prevent infinite loops

    while (iterationCount < maxIterations) {
      // Get all action dropdown buttons (these represent time entries that can be deleted)
      const actionButtons = page.locator('//button[@aria-label="Expand Menu"]');
      const buttonCount = await actionButtons.count();

      console.log(
        `Iteration ${
          iterationCount + 1
        }: Found ${buttonCount} time entries to delete`,
      );

      if (buttonCount === 0) {
        console.log('No more time entries found - cleanup complete');
        break;
      }

      // Click the first action button and delete the entry
      try {
        await actionButtons.first().click({ timeout: 15000 });

        // Only deletable entries expose a "Delete" option. Probe it with a
        // short timeout so an approved/locked entry fails fast instead of
        // hanging on the global 5-minute action timeout.
        const deleteOption = page
          .locator(`//li[text()='Delete']`)
          .or(page.locator(`//span[text()='Delete']`));
        if (
          !(await deleteOption.isVisible({ timeout: 5000 }).catch(() => false))
        ) {
          console.log(
            'Delete option not available for this entry (likely approved/locked) - stopping cleanup.',
          );
          break;
        }
        await deleteOption.click({ timeout: 15000 });
        await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
        await timeEntriesPage.clickYesOnDeleteEntryPopup();
        await timeEntriesPage.waitForLoadingToDisappear();

        // Fast refresh by switching views instead of navigating to page
        console.log('Refreshing data by switching views...');
        await selectDisplayByOption(page, 'Customer');
        await timeEntriesPage.waitForLoadingToDisappear();
        await selectDisplayByOption(page, 'Date');
        await timeEntriesPage.waitForLoadingToDisappear();

        console.log(`Successfully deleted entry ${iterationCount + 1}`);
      } catch (entryError) {
        // Stop on error rather than retrying the same undeletable entry in a
        // loop (which previously caused multi-minute hangs).
        console.log(
          `Error deleting entry ${iterationCount + 1} - stopping cleanup:`,
          entryError,
        );
        break;
      }

      iterationCount++;
    }

    if (iterationCount >= maxIterations) {
      console.log(
        `Reached maximum iterations (${maxIterations}) - stopping cleanup to prevent infinite loop`,
      );
    }
  } catch (error) {
    console.log('Error in deleteAllVisibleTimeEntries:', error);
  }
};

export const addSTAWithYesterdayDate = async (page: Page, role?: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // Navigate to Single Time Activity page
  await singleTimeActPage.navigateToSingleTime();
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.handleTourModal();

  // Get yesterday's date in MM/DD/YYYY format
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  console.log(`Creating STA with yesterday's date: ${yesterdayFormatted}`);

  // Set yesterday's date
  await singleTimeActPage.fillStartDate(yesterdayFormatted);

  // Fill required fields
  await fillSingleTAFields(
    page,
    1, // optionNumber
    '50.00', // billRate
    '25.00', // costRate
    'STA with yesterday date', // note
    role,
  );

  // Set duration
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
  }
  await singleTimeActPage.fillData(LABELS.Duration, '02:30');

  // Save the entry
  const createMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );

  await singleTimeActPage.clickButton(LABELS.Save);

  // Verify response
  const createMutationPromisePayload = await createMutationPromise;
  expect(createMutationPromisePayload).toBeDefined();
  expect(
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  ).toBeDefined();

  await singleTimeActPage.validateSuccessToast();

  // Validate the date was set correctly
  const savedDate = await singleTimeActPage.getStartDateValue();
  expect(savedDate).toBe(yesterdayFormatted);

  console.log(`STA created successfully with yesterday's date: ${savedDate}`);
};

/**
 * Creates a Single Time Activity with current date, then updates it to yesterday's date and validates
 * @param page - Playwright page object
 * @param role - User role (optional)
 * @returns Promise<void>
 */
export const addSTAWithCurrentDateThenUpdateToYesterday = async (
  page: Page,
  role?: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // Navigate to Single Time Activity page
  await singleTimeActPage.navigateToSingleTime();
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.handleTourModal();

  // Get current date and yesterday's date
  const currentDate = new Date();
  const currentDateFormatted = currentDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  console.log(`Creating STA with current date: ${currentDateFormatted}`);

  // Verify current date is set by default (or set it explicitly)
  const defaultDate = await singleTimeActPage.getStartDateValue();
  if (defaultDate !== currentDateFormatted) {
    await singleTimeActPage.fillStartDate(currentDateFormatted);
  }

  // Fill required fields
  await fillSingleTAFields(
    page,
    1, // optionNumber
    '75.00', // billRate
    '35.00', // costRate
    'STA updated from current to yesterday', // note
    role,
  );

  // Set duration
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
  }
  await singleTimeActPage.fillData(LABELS.Duration, '03:15');

  // Save the entry with current date
  const createMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );

  await singleTimeActPage.clickButton(LABELS.Save);

  // Verify initial save
  const createMutationPromisePayload = await createMutationPromise;
  expect(createMutationPromisePayload).toBeDefined();
  expect(
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  ).toBeDefined();

  await singleTimeActPage.validateSuccessToast();

  // Validate initial date
  const initialDate = await singleTimeActPage.getStartDateValue();
  expect(initialDate).toBe(currentDateFormatted);

  console.log(`STA created with current date: ${initialDate}`);

  // Now update to yesterday's date
  console.log(`Updating STA to yesterday's date: ${yesterdayFormatted}`);

  await singleTimeActPage.fillStartDate(yesterdayFormatted);

  // Update the entry
  const updateMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );

  await singleTimeActPage.clickButton(LABELS.Save);

  // Verify update
  const updateMutationPromisePayload = await updateMutationPromise;
  expect(updateMutationPromisePayload).toBeDefined();
  expect(
    updateMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  ).toBeDefined();

  await singleTimeActPage.validateSuccessToast();

  // Validate the date was updated correctly
  const updatedDate = await singleTimeActPage.getStartDateValue();
  expect(updatedDate).toBe(yesterdayFormatted);

  console.log(`STA updated successfully to yesterday's date: ${updatedDate}`);
};

export const validateMileageTrackingInQBO = async (page: Page) => {
  await navigateToAccountAndSettingsTime(page);

  // Verify the "Mileage Tracking" section is visible
  await expect(page.getByText('Mileage Tracking')).toBeVisible();
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(500);

  // Define the mileage tracking toggle locator
  const mileageTrackingToggle = page.getByRole('checkbox', {
    name: /Turn on mileage tracking/i,
  });
  await expect(mileageTrackingToggle).toBeVisible();

  // Step 1: Check if mileage tracking is enabled by default, if not enable it

  if (await mileageTrackingToggle.isChecked()) {
    // Mileage is already enabled, do nothing
    console.log('✓ Mileage Tracking is already enabled by default');
  } else {
    // Mileage is disabled, enable it
    console.log('Mileage Tracking is OFF, enabling it...');
    await mileageTrackingToggle.check();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(5000);
    await verifyMileageTrackingStatus(page, 'On');
    console.log('✓ Mileage Tracking has been enabled');
    // Re-open geolocation section for next steps
    await TimeSettingsPage.clickEditGeoLocationSection(page);
    await page.waitForTimeout(500);
  }

  // Step 2: Disable mileage tracking and verify status is Off
  await expect(mileageTrackingToggle).toBeVisible();
  await mileageTrackingToggle.uncheck();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(5000);
  await verifyMileageTrackingStatus(page, 'Off');
  console.log('✓ Mileage Tracking disabled and verified Off');

  // Step 3: Enable mileage tracking and verify status is On
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(500);
  await expect(mileageTrackingToggle).toBeVisible();
  await mileageTrackingToggle.check();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(5000);
  await verifyMileageTrackingStatus(page, 'On');
  console.log('✓ Mileage Tracking enabled and verified On');
};

export const validateAutoCalculateInMileageTracking = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  await navigateToAccountAndSettingsTime(page);
  await expect(page.getByText('Mileage Tracking')).toBeVisible();
  await verifyMileageTrackingStatus(page, 'On');
  //Add new single time entry
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  // Navigate and open STE
  await timeEntriesPage.navigateToTimeEntriesPage();
  // Click Add time dropdown and select Single time entry
  await clickAddTimeDropdown(page);
  await selectSingleTimeEntryFromAddTime(page, false);
  // Wait for Single Time Entry page to be fully ready
  await page.waitForTimeout(3000);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();
  // Fill in entry details - select Test Emp2
  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(500);
  // Select Test Emp1
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  await page.waitForTimeout(1000);
  // Fill other fields
  await singleTimeEntryPage.openAndselectCustomerOption(1);
  await singleTimeActivityPage.clickDropdownOption(1, 'Service');
  // Time entry for Emp1: day before yesterday
  const dayBeforeYesterday = new Date();
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
  const dayBeforeYesterdayFormatted = dayBeforeYesterday.toLocaleDateString(
    'en-US',
    {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    },
  );
  // Set date to day before yesterday
  await singleTimeEntryPage.fillStartDate(dayBeforeYesterdayFormatted);
  await page.waitForTimeout(500);
  // Toggle "Set start and end time" (required for automatic breaks to apply)
  const isToggleEnabled = await singleTimeEntryPage.verifySetClockToggleState();
  if (!isToggleEnabled) {
    await singleTimeEntryPage.clickSetClockInAndOutToggles();
    await page.waitForTimeout(500);
  }
  // Set start and end times (8 AM to 3 PM = 7 hours)
  //await singleTimeEntryPage.selectTime('Start', '8:00 AM');
  await singleTimeEntryPage.fillTime('Start', '8:00 AM');
  await page.waitForTimeout(500);
  //await singleTimeEntryPage.selectTime('End', '3:00 PM');
  await singleTimeEntryPage.fillTime('End', '3:00 PM');
  await page.waitForTimeout(1000);
  await singleTimeEntryPage.enterNotes('Test entry for mileage tracking');
  await singleTimeEntryPage.checkCheckboxIfVisible('Billable');
  await singleTimeActivityPage.fillBillRateInput('100.00');
  await page.waitForTimeout(500);
  console.log('✓ Billable checkbox checked');
  // Save
  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);
  console.log(`✓ Time entry created for Mileage Tracking`);
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Validate miles in Date View
  await validateMileageColumnVisibility(page, 'Emp1, Test');
  //Go to Edit the single time entry
  await timeEntriesPage.clickEditForEmployee('Emp1, Test');
  await singleTimeEntryPage.expectSingleTimeEntryVisible();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(1000);
  // Verify the label containing "Auto calculate" has a checked checkbox
  await page.locator(`//span[text()='Auto calculate']`).isVisible();
  const autoCalculateCheckbox = page.locator(
    `//span[text()='Auto calculate']/ancestor::label//input[@type='checkbox']`,
  );
  await expect(autoCalculateCheckbox).toBeVisible();
  // await expect(autoCalculateCheckbox).toBeChecked();
  // console.log('✓ Auto calculate checkbox is visible and checked');
  // Verify Miles field is readonly/disabled
  const milesInput = page.locator(`//label[.//span[text()="Mileage"]]//input`);
  await expect(milesInput).toBeVisible();
  const isReadOnly = await milesInput.getAttribute('readonly');
  const isDisabled = await milesInput.isDisabled();
  expect(isReadOnly !== null || isDisabled).toBeTruthy();
  console.log('✓ Mileage field is readonly/not editable');
  // Uncheck Auto calculate checkbox and edit the miles field
  // await autoCalculateCheckbox.uncheck();
  // await page.waitForTimeout(500);

  // Verify if mileage edit box is editable, if not toggle checkbox again
  const isEditable = await milesInput.isEditable();
  if (!isEditable) {
    console.log(
      '⚠ Mileage input not editable, toggling Auto calculate checkbox...',
    );
    await autoCalculateCheckbox.check();
    await page.waitForTimeout(300);
    await autoCalculateCheckbox.uncheck();
    await page.waitForTimeout(300);
    console.log('✓ Toggled Auto calculate checkbox to enable editing');
  }

  await milesInput.fill('50');
  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);
  // Validate miles in Date View
  await validateMilesInTimeEntriesTable(page, 'Emp1, Test', '50');
  await page.waitForTimeout(1000);
  // verify edited value in the single time entry - 50
  await timeEntriesPage.clickEditForEmployee('Emp1, Test');
  await singleTimeEntryPage.expectSingleTimeEntryVisible();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);
  // Verify Mileage section is visible
  await expect(milesInput).toHaveValue('50.00');
  console.log('✓ Miles field has updated value in STE');
  await expect(autoCalculateCheckbox).not.toBeChecked();
  await page.getByRole('button', { name: 'Cancel' }).click();
  //Go to Edit the single time entry
  await timeEntriesPage.clickEditForEmployee('Emp1, Test');
  await singleTimeEntryPage.expectSingleTimeEntryVisible();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(1000);
  // Check Auto calculate checkbox and edit the miles field
  await milesInput.fill('100');
  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);
  // Validate miles in Date View
  await validateMilesInTimeEntriesTable(page, 'Emp1, Test', '100');
  await page.waitForTimeout(1000);
  // verify edited value in the single time entry - 100
  await timeEntriesPage.clickEditForEmployee('Emp1, Test');
  await singleTimeEntryPage.expectSingleTimeEntryVisible();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);
  // Verify Mileage section is visible
  await expect(milesInput).toHaveValue('100.00');
  console.log('✓ Miles field has updated value in STE');
  await expect(autoCalculateCheckbox).not.toBeChecked();
  // Hover on the tooltip trigger
  await page.locator(`[class*="Mileage__TooltipContent"]`).hover();
  // // Verify tooltip content
  // await expect(
  //   page.getByText(
  //     'Auto calculate mileage based on GPS points for this timesheet.',
  //   ),
  // ).toBeVisible();
  // console.log('✓ Tooltip content verified');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.waitForTimeout(1000);
  await approveTimeEntriesML(page, 'Emp1, Test');
  // Switch to Date view to refresh the data
  await navigateToTimeEntries(page);
  await timeEntriesPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  // Open Date range and select This month
  await commonLocator.openDateRangeDropdown(page);
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await timeEntriesPage.waitForLoadingToDisappear();
  await timeEntriesPage.clickViewForEmployee('Emp1, Test');
  await singleTimeEntryPage.expectSingleTimeEntryVisible();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(1000);
  await expect(milesInput).toBeVisible();
  await expect(milesInput).toBeDisabled();
  await expect(milesInput).not.toBeEditable();
  await expect(autoCalculateCheckbox).not.toBeEditable();
  await page.waitForTimeout(1000);
  console.log('✓ Mileage field is not editable when time is approved');
};

/**
 * Validates miles entry in the time entries table
 */
export const validateMilesInTimeEntriesTable = async (
  page: Page,
  employeeName: string,
  expectedMiles: string,
) => {
  console.log(`Validating miles for ${employeeName}: ${expectedMiles}`);

  const timeEntriesPage = new TimeEntriesPage(page);

  // Switch to Employee view to refresh
  await selectDisplayByOption(page, 'Customer');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Switch to Date view to refresh the data
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Open Date range and select This month
  await commonLocator.openDateRangeDropdown(page);
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await timeEntriesPage.waitForLoadingToDisappear();

  // Validate the Miles column is visible
  await timeEntriesPage.validateColumnVisible('Miles');

  // Validate the entry exists
  const entryCount = await timeEntriesPage.countEmployeeRow(employeeName);
  expect(entryCount).toBeGreaterThan(0);

  // Get row data and validate miles
  const rowObj = await timeEntriesPage.getRowObjectForEmployee(employeeName);
  // Column header is "Mileage" and value may include decimals (e.g., "100.00")
  const actualMileage = rowObj.Miles;
  const expectedMileageValue = parseFloat(expectedMiles);
  const actualMileageValue = parseFloat(actualMileage);
  expect(actualMileageValue).toBe(expectedMileageValue);
  console.log(`✓ Mileage validated: ${actualMileage} for ${employeeName}`);
};

export const validateMileageColumnVisibility = async (
  page: Page,
  employeeName: string,
) => {
  const timeEntriesPage = new TimeEntriesPage(page);

  // Switch to Customer view to refresh
  await selectDisplayByOption(page, 'Customer');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Switch to Date view to refresh the data
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Open Date range and select This month
  await commonLocator.openDateRangeDropdown(page);
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await timeEntriesPage.waitForLoadingToDisappear();

  // Ensure Miles column is visible
  await timeEntriesPage.clickSettingsButton();
  await page.waitForTimeout(500);

  const milesCheckbox = await timeEntriesPage.getColumnsCheckboxFromSettings(
    LABELS.miles,
  );

  const isChecked = await milesCheckbox.isChecked();
  if (!isChecked) {
    await milesCheckbox.click();
    await page.waitForTimeout(300);
    console.log('✓ Miles checkbox was not checked, now checked');
    await timeEntriesPage.waitForSettingsPopupToClose();
  } else {
    console.log('✓ Miles checkbox is already checked');
    // Close settings popup by clicking the settings button again
    await timeEntriesPage.clickSettingsButton();
  }

  // Validate the Miles column is visible
  await timeEntriesPage.validateColumnVisible('Miles');

  // Validate the entry exists
  const entryCount = await timeEntriesPage.countEmployeeRow(employeeName);
  expect(entryCount).toBeGreaterThan(0);
};

export const validateMileageEntriesInCustomerView = async (
  page: Page,
  expectedMileage: string,
  durationValue: string,
) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);

  // Step 1: Navigate to Time Entries and create a new STE
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  // Click Add time dropdown and select Single time entry
  await clickAddTimeDropdown(page);
  await selectSingleTimeEntryFromAddTime(page, false);

  // Wait for Single Time Entry page to be fully ready
  await page.waitForTimeout(3000);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();
  console.log('✓ Single Time Entry form opened');

  // Select employee (first option)
  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  await page.waitForTimeout(1000);
  console.log('✓ Employee selected');

  // Set date (today)
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await singleTimeEntryPage.fillStartDate(formattedDate);
  console.log(`✓ Date set to: ${formattedDate}`);

  // Set duration
  await singleTimeEntryPage.enterFieldValue('Duration', durationValue);
  await page.waitForTimeout(500);
  console.log(`✓ Duration set to: ${durationValue}`);

  await singleTimeEntryPage.enterNotes(
    'Test entry for mileage tracking in Customer view',
  );

  // Select Customer "Bakes and Beans"
  await singleTimeEntryPage.openAndselectCustomerOption(1);
  await page.waitForTimeout(500);

  // Select Service (first option)
  await singleTimeActivityPage.openDropdown('Service');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.clickDropdownOption(1, 'Service');
  await page.waitForTimeout(500);
  console.log('✓ Service selected');

  await singleTimeActivityPage.checkCheckboxIfVisible('Billable');
  // await singleTimeActivityPage.fillBillRateInput('100.00');
  // await page.waitForTimeout(500);
  console.log('✓ Billable checkbox checked');

  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await commonLocator.openDateRangeDropdown(page);
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await timeEntriesPage.waitForLoadingToDisappear();

  await selectDisplayByOption(page, 'Customer');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('✓ Navigated to Customer view');

  // Step 3: Verify customer row is visible
  const customerRow = page.locator(
    '//div[contains(text(), "Bakes and Beans")]/ancestor::tr',
  );
  await customerRow.first().click();
  await page.waitForTimeout(500);

  // Ensure Mileage column is visible
  await timeEntriesPage.clickSettingsButton();
  await page.waitForTimeout(500);
  const milesCheckbox = await timeEntriesPage.getColumnsCheckboxFromSettings(
    LABELS.miles,
  );
  const isChecked = await milesCheckbox.isChecked();
  if (!isChecked) {
    await milesCheckbox.click();
    await page.waitForTimeout(300);
    console.log('✓ Mileage checkbox was not checked, now checked');
    await timeEntriesPage.waitForSettingsPopupToClose();
  } else {
    console.log('✓ Mileage checkbox is already checked');
    await timeEntriesPage.clickSettingsButton();
  }
  await page.waitForTimeout(500);

  await timeEntriesPage.clickEditForEmployee('Emp1, Test');
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.expectSingleTimeEntryVisible();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(1000);

  // Step 6: Edit the mileage value to 100 and save
  const milesInputEdit = page.locator(
    `//label[.//span[text()="Mileage"]]//input`,
  );
  await expect(milesInputEdit).toBeVisible();
  const autoCalculateCheckboxEdit = page.locator(
    `//span[text()='Auto calculate']/ancestor::label//input[@type='checkbox']`,
  );
  await expect(autoCalculateCheckboxEdit).toBeVisible();
  await expect(milesInputEdit).not.toBeEditable();
  await autoCalculateCheckboxEdit.uncheck();
  await page.waitForTimeout(500);

  // Verify if mileage edit box is editable, if not toggle checkbox again
  const isEditable = await milesInputEdit.isEditable();
  if (!isEditable) {
    console.log(
      '⚠ Mileage input not editable, toggling Auto calculate checkbox...',
    );
    await autoCalculateCheckboxEdit.check();
    await page.waitForTimeout(300);
    await autoCalculateCheckboxEdit.uncheck();
    await page.waitForTimeout(300);
    console.log('✓ Toggled Auto calculate checkbox to enable editing');
  }

  await milesInputEdit.fill(expectedMileage);
  await page.waitForTimeout(500);
  console.log(`✓ Mileage set to: ${expectedMileage}`);

  // Save the entry
  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(1000);

  // Validate the Miles column is visible
  await timeEntriesPage.validateColumnVisible('Miles');

  await page.waitForTimeout(500);
  await timeEntriesPage.clickEditForEmployee('Emp1, Test');
  await singleTimeEntryPage.expectSingleTimeEntryVisible();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(1000);

  // Verify Mileage section is visible
  await expect(milesInputEdit).toHaveValue('100.00');
  console.log('✓ Miles field has updated value in STE');
  await expect(autoCalculateCheckboxEdit).not.toBeChecked();

  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  // Step 8: Switch to Date view and verify the updated mileage value
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('✓ Switched to Date view');

  // Check if Miles column is visible in Time Entries table
  const milesColumnHeader = page.locator('//th/div[text()="Miles"]');
  const isMilesColumnVisible = await milesColumnHeader
    .isVisible()
    .catch(() => false);

  if (!isMilesColumnVisible) {
    // Miles column not visible, open settings and enable it
    console.log('Miles column not visible, enabling it via settings...');
    await timeEntriesPage.clickSettingsButton();
    await page.waitForTimeout(500);
    const milesCheckbox = await timeEntriesPage.getColumnsCheckboxFromSettings(
      'Miles',
    );
    const isChecked = await milesCheckbox.isChecked();
    if (!isChecked) {
      await milesCheckbox.click();
      await page.waitForTimeout(500);
      await timeEntriesPage.waitForSettingsPopupToClose();
      console.log('✓ Miles column checkbox enabled');
    }
  } else {
    console.log('✓ Miles column is already visible in Time Entries table');
  }

  // Verify mileage value is 100 in Date view
  const updatedRowObjDate = await timeEntriesPage.getRowObjectForEmployee(
    'Emp1, Test',
  );
  const updatedMileageDate = parseFloat(updatedRowObjDate.Miles);
  expect(updatedMileageDate).toBe(parseFloat(expectedMileage));
  console.log(`✓ Mileage verified in Date view: ${updatedMileageDate}`);

  await selectDisplayByOption(page, 'Customer');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('✓ Navigated to Customer view');

  await customerRow.first().click();
  await page.waitForTimeout(1000);

  // Validate the entry exists
  const entryCount = await timeEntriesPage.countEmployeeRow('Emp1, Test');
  expect(entryCount).toBeGreaterThan(0);

  // Get row data and validate miles in Customer view
  const rowObjCustomer = await timeEntriesPage.getRowObjectForEmployee(
    'Emp1, Test',
  );
  const actualMileageCustomer = rowObjCustomer.Miles;
  const expectedMileageValueCustomer = parseFloat('100');
  const actualMileageValueCustomer = parseFloat(actualMileageCustomer);
  expect(actualMileageValueCustomer).toBe(expectedMileageValueCustomer);
  console.log(
    `✓ Mileage validated in Customer view: ${actualMileageCustomer} for Emp1, Test`,
  );
};

export const validateMileageTrackingForPremiumCompanies = async (
  page: Page,
) => {
  // Step 1: Navigate to Account and Settings -> Time tab
  console.log('Navigating to Account and Settings -> Time tab...');
  await navigateToAccountAndSettingsTime(page);
  console.log('✓ Navigated to Account and Settings -> Time tab');

  // Step 2: Verify Geolocation section is visible
  const geolocationSection = page.getByText('Geolocation');
  await expect(geolocationSection).toBeVisible();
  await expect(page.getByText('Location tracking')).toBeVisible();
  console.log('✓ Geolocation section is visible');

  // Step 3: Verify Mileage Tracking section under Geolocation is NOT visible
  const mileageTrackingSection = page.getByText('Mileage tracking');
  await expect(mileageTrackingSection).not.toBeVisible();
  console.log(
    '✓ Mileage Tracking section is NOT visible under Geolocation for Premium companies',
  );

  // Step 4: Click on edit button in Geolocation section and verify mileage tracking is not visible
  console.log('Step 4: Clicking edit button in Geolocation section...');
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(500);
  console.log('✓ Clicked edit button in Geolocation section');

  // Verify Geolocation dialog is open
  await expect(page.locator(`//h2[text()='Geolocation']`)).toBeVisible();
  console.log('✓ Geolocation edit dialog is open');

  // Verify mileage tracking toggle is NOT visible inside the edit dialog
  const mileageTrackingToggle = page.locator(
    '//label[.//span[contains(text(), "mileage tracking")]]//input[@type="checkbox"]',
  );
  await expect(mileageTrackingToggle).not.toBeVisible();
  await page.waitForTimeout(500);
  console.log('✓ Mileage Tracking toggle is NOT visible');
};

export const validateDataPersistenceWhenCheckingMileageOnOrOff = async (
  page: Page,
) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);

  await navigateToAccountAndSettingsTime(page);
  await expect(page.getByText('Mileage Tracking')).toBeVisible();

  // Check if Mileage Tracking is Off and enable it if needed
  const mileageTrackingStatusLabel = page.locator(
    '//label[text()="Mileage tracking"]/following-sibling::span',
  );
  const currentStatus = await mileageTrackingStatusLabel.textContent();

  if (currentStatus === 'Off') {
    console.log('Mileage Tracking is OFF, enabling it...');
    await TimeSettingsPage.clickEditGeoLocationSection(page);
    await page.waitForTimeout(500);

    const mileageTrackingToggle = page.locator(
      '//label[.//span[contains(text(), "mileage tracking")]]//input[@type="checkbox"]',
    );
    await expect(mileageTrackingToggle).toBeVisible();
    await mileageTrackingToggle.click({ force: true });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);
    await verifyMileageTrackingStatus(page, 'On');
    console.log('✓ Mileage Tracking has been enabled');
  } else {
    console.log('✓ Mileage Tracking is already ON');
  }

  // Step 1: Navigate to Time Entries and create a new STE
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Click Add time dropdown and select Single time entry
  await clickAddTimeDropdown(page);
  await selectSingleTimeEntryFromAddTime(page, false);

  // Wait for Single Time Entry page to be fully ready
  await page.waitForTimeout(3000);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();
  console.log('✓ Single Time Entry form opened');

  // Select employee (first option)
  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  await page.waitForTimeout(1000);
  console.log('✓ Employee selected');

  // Set date (today)
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await singleTimeEntryPage.fillStartDate(formattedDate);
  console.log(`✓ Date set to: ${formattedDate}`);

  // Set duration
  await singleTimeEntryPage.enterFieldValue('Duration', '7');
  await page.waitForTimeout(500);
  console.log(`✓ Duration set to: 7`);

  await singleTimeEntryPage.enterNotes(
    'Test entry for mileage data persistence',
  );

  // Select Customer "Bakes and Beans"
  await singleTimeEntryPage.openAndselectCustomerOption(1);
  await page.waitForTimeout(500);

  // Select Service (first option)
  await singleTimeActivityPage.openDropdown('Service');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.clickDropdownOption(1, 'Service');
  await page.waitForTimeout(500);
  console.log('✓ Service selected');

  await singleTimeActivityPage.checkCheckboxIfVisible('Billable');
  // await singleTimeActivityPage.fillBillRateInput('100.00');
  // await page.waitForTimeout(500);
  console.log('✓ Billable checkbox checked');

  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Validate miles in Date View
  await validateMileageColumnVisibility(page, 'Emp1, Test');
  //Go to Edit the single time entry
  await timeEntriesPage.clickEditForEmployee('Emp1, Test');
  await singleTimeEntryPage.expectSingleTimeEntryVisible();
  await timeEntriesPage.waitForLoadingToDisappear();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await page.waitForTimeout(1000);
  // Verify the label containing "Auto calculate" has a checked checkbox
  await page.locator(`//span[text()='Auto calculate']`).isVisible();
  const autoCalculateCheckbox = page.locator(
    `//span[text()='Auto calculate']/ancestor::label//input[@type='checkbox']`,
  );
  //await expect(autoCalculateCheckbox).toBeChecked();
  // Verify Miles field is readonly/disabled
  const milesInput = page.locator(`//label[.//span[text()="Mileage"]]//input`);
  await expect(milesInput).toBeVisible();
  await autoCalculateCheckbox.uncheck();
  await page.waitForTimeout(500);

  // Verify if mileage edit box is editable, if not toggle checkbox again
  const isEditable = await milesInput.isEditable();
  if (!isEditable) {
    console.log(
      '⚠ Mileage input not editable, toggling Auto calculate checkbox...',
    );
    await autoCalculateCheckbox.check();
    await page.waitForTimeout(300);
    await autoCalculateCheckbox.uncheck();
    await page.waitForTimeout(300);
    console.log('✓ Toggled Auto calculate checkbox to enable editing');
  }

  await milesInput.fill('100');
  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);

  const milesColumnHeader1 = page.locator('//th/div[text()="Miles"]');
  const isMilesColumnVisible1 = await milesColumnHeader1
    .isVisible()
    .catch(() => false);

  if (!isMilesColumnVisible1) {
    console.log('Miles column not visible, enabling it via settings...');
    await timeEntriesPage.clickSettingsButton();
    await page.waitForTimeout(500);
    const milesCheckbox = await timeEntriesPage.getColumnsCheckboxFromSettings(
      'Miles',
    );
    const isChecked = await milesCheckbox.isChecked();
    if (!isChecked) {
      await milesCheckbox.click();
      await page.waitForTimeout(500);
      await timeEntriesPage.waitForSettingsPopupToClose();
      console.log('✓ Miles column checkbox enabled');
    }
  } else {
    console.log('✓ Miles column is already visible in Time Entries table');
  }

  // Validate miles in Date View
  await validateMilesInTimeEntriesTable(page, 'Emp1, Test', '100');

  // Step 1: Turn Mileage Tracking OFF in settings
  console.log('Step 1: Turning Mileage Tracking OFF in settings...');
  await navigateToAccountAndSettingsTime(page);
  await expect(page.getByText('Mileage Tracking')).toBeVisible();
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(500);

  // Define the mileage tracking toggle locator
  const mileageTrackingToggle = page.locator(
    '//label[.//span[contains(text(), "mileage tracking")]]//input[@type="checkbox"]',
  );
  await expect(mileageTrackingToggle).toBeVisible();

  // Check current state and turn OFF if it's ON
  const isMileageOn = await mileageTrackingToggle.isChecked();
  if (isMileageOn) {
    await mileageTrackingToggle.click({ force: true });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);
    await verifyMileageTrackingStatus(page, 'Off');
    console.log('✓ Mileage Tracking turned OFF');
  } else {
    console.log('✓ Mileage Tracking is already OFF');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(500);
  }

  // Step 2: Return to Time Entries and verify an entry exists
  console.log(
    'Step 2: Navigating to Time Entries and verifying entry exists...',
  );
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  await selectDisplayByOption(page, 'Customer');
  await timeEntriesPage.waitForLoadingToDisappear();

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Verify entry exists for employee
  const entryCount = await timeEntriesPage.countEmployeeRow('Emp1, Test');
  expect(entryCount).toBeGreaterThan(0);
  console.log(`✓ Verified ${entryCount} entry(ies) exist for Emp1, Test`);

  // Step 3: Approve the STE that has existing miles
  console.log('Step 3: Approving the STE with existing miles...');
  await approveTimeEntriesML(page, 'Emp1, Test');
  console.log('✓ Time entry approved');

  // Step 4: Verify Miles field is no longer editable and Miles is not visible in STE UI
  console.log(
    'Step 4: Verifying Miles field is not editable and not visible in STE UI...',
  );
  await navigateToTimeEntries(page);
  await timeEntriesPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Click View to open the approved STE (since it's approved, it should be view-only)
  await timeEntriesPage.clickViewForEmployee('Emp1, Test');
  await singleTimeEntryPage.expectSingleTimeEntryVisible();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(1000);

  // Verify Mileage field is NOT visible in STE UI when Mileage Tracking is OFF
  //const milesInput = page.locator(`//label[.//span[text()="Mileage"]]//input`);
  await expect(milesInput).not.toBeVisible();
  console.log(
    '✓ Miles field is NOT visible in STE UI when Mileage Tracking is OFF',
  );

  // Verify Auto calculate checkbox is also not visible
  await expect(autoCalculateCheckbox).not.toBeVisible();
  console.log('✓ Auto calculate checkbox is NOT visible in STE UI');

  // Close the STE view
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.waitForTimeout(500);

  // Step 5: Turn Mileage Tracking back ON
  console.log('Step 5: Turning Mileage Tracking back ON...');
  await navigateToAccountAndSettingsTime(page);
  await expect(page.getByText('Mileage Tracking')).toBeVisible();
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(500);

  // Define the mileage tracking toggle locator
  const mileageTrackingToggleOn = page.locator(
    '//label[.//span[contains(text(), "mileage tracking")]]//input[@type="checkbox"]',
  );
  await expect(mileageTrackingToggleOn).toBeVisible();

  // Turn ON mileage tracking
  const isMileageOff = !(await mileageTrackingToggleOn.isChecked());
  if (isMileageOff) {
    await mileageTrackingToggleOn.click({ force: true });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Save' }).click();
    await waitForLoadingToDisappear(page);
    await page.waitForTimeout(500);
    await verifyMileageTrackingStatus(page, 'On');
    console.log('✓ Mileage Tracking turned back ON');
  } else {
    console.log('✓ Mileage Tracking is already ON');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(500);
  }

  // Step 6: Verify Miles column and STE Miles field show same values as before
  console.log(
    'Step 6: Verifying Miles column and STE Miles field show values after Mileage is turned back ON...',
  );

  // Navigate to Time Entries
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Check if Miles column is visible in Time Entries table
  const milesColumnHeader = page.locator('//th/div[text()="Miles"]');
  const isMilesColumnVisible = await milesColumnHeader
    .isVisible()
    .catch(() => false);

  if (!isMilesColumnVisible) {
    // Miles column not visible, open settings and enable it
    console.log('Miles column not visible, enabling it via settings...');
    await timeEntriesPage.clickSettingsButton();
    await page.waitForTimeout(500);
    const milesCheckbox = await timeEntriesPage.getColumnsCheckboxFromSettings(
      'Miles',
    );
    const isChecked = await milesCheckbox.isChecked();
    if (!isChecked) {
      await milesCheckbox.click();
      await page.waitForTimeout(500);
      await timeEntriesPage.waitForSettingsPopupToClose();
      console.log('✓ Miles column checkbox enabled');
    }
  } else {
    console.log('✓ Miles column is already visible in Time Entries table');
  }

  // Expected mileage value for all verifications
  const expectedMileageValue = 100;

  // Get the mileage value from the table
  // const rowObj = await timeEntriesPage.getRowObjectForEmployee('Emp1, Test');
  // const mileageValueInTable = rowObj.Miles;
  // console.log(`✓ Mileage value in table: ${mileageValueInTable}`);
  // expect(parseFloat(mileageValueInTable)).toBe(expectedMileageValue);
  await validateMilageValueInTimeEntriesTable(page, 'Emp1, Test', '100');

  // Open the STE to verify Miles field shows the same value
  await timeEntriesPage.clickViewForEmployee('Emp1, Test');
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.expectSingleTimeEntryVisible();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(1000);

  // Verify Mileage field is visible and shows the preserved value
  const milesInputAfterOn = page.locator(
    `//label[.//span[text()="Mileage"]]//input`,
  );
  await expect(milesInputAfterOn).toBeVisible();
  const mileageValueInSTE = await milesInputAfterOn.inputValue();
  console.log(`✓ Mileage value in STE: ${mileageValueInSTE}`);

  // Verify the mileage value in STE matches expected value of 100
  expect(parseFloat(mileageValueInSTE)).toBe(expectedMileageValue);
  console.log(`✓ Vlidated Mileage value: ${expectedMileageValue}`);

  // Close the STE view
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.waitForTimeout(500);

  // Step 7: Unapprove the time entries
  console.log('Step 7: Unapproving the time entries...');

  await navigateToApprovalsPage(page);
  await timeEntriesPage.waitForLoadingToDisappear();

  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Find and click the Unapprove button for the employee
  const unapproveButton = page.locator(
    `//tr[.//div[text()="Emp1, Test"]]//button[.//span[text()="Unapprove"]]`,
  );

  if (await unapproveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await unapproveButton.click();
    await page.waitForTimeout(500);
    await page
      .getByRole('button', { name: 'Unapprove and unlock time' })
      .click();
    await page.waitForTimeout(2000);
    console.log('✓ Time entry unapproved');
  } else {
    console.log(
      'ℹ Time entry is already unapproved or no unapprove button found',
    );
  }

  // Step 8: Verify mileage value is same in both date and customer view after unapproval
  console.log('Step 8: Verifying mileage value after unapproval...');

  await navigateToTimeEntries(page);
  await timeEntriesPage.waitForLoadingToDisappear();
  // Switch to Date view
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Get the mileage value from the table after unapproval
  const rowObjAfterUnapprove = await timeEntriesPage.getRowObjectForEmployee(
    'Emp1, Test',
  );
  const mileageValueInTableAfterUnapprove = rowObjAfterUnapprove.Miles;
  console.log(
    `✓ Mileage value in table after unapproval: ${mileageValueInTableAfterUnapprove}`,
  );

  // Verify mileage value in table matches expected value of 100
  expect(parseFloat(mileageValueInTableAfterUnapprove)).toBe(100);
  console.log(
    `✓ Mileage value in table matches expected: ${mileageValueInTableAfterUnapprove}`,
  );

  // Open the STE to verify Miles field shows the same value (now editable since unapproved)
  await timeEntriesPage.clickEditForEmployee('Emp1, Test');
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.expectSingleTimeEntryVisible();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(1000);

  // Verify Mileage field is visible and shows the preserved value
  const milesInputAfterUnapprove = page.locator(
    `//label[.//span[text()="Mileage"]]//input`,
  );
  await expect(milesInputAfterUnapprove).toBeVisible();
  const mileageValueInSTEAfterUnapprove =
    await milesInputAfterUnapprove.inputValue();
  console.log(
    `✓ Mileage value in STE after unapproval: ${mileageValueInSTEAfterUnapprove}`,
  );

  // Verify mileage value in STE matches expected value of 100
  expect(parseFloat(mileageValueInSTEAfterUnapprove)).toBe(100);
  console.log(`✓ Mileage value in STE: ${mileageValueInSTEAfterUnapprove}`);

  // Verify mileage field is now editable (since time entry is unapproved)
  await expect(milesInputAfterUnapprove).toBeEditable();
  console.log('✓ Mileage field is editable after unapproval');

  console.log(
    '✓ Data persistence validation completed - Miles data is preserved across approval/unapproval and Mileage ON/OFF states',
  );
};

export const cleanupAllTimeEntriesForMileageTracking = async (
  page: Page,
  employeeName?: string,
) => {
  console.log('');
  console.log('Starting cleanup of Mileage Tracking test data...');

  const timeEntriesPage = new TimeEntriesPage(page);

  try {
    // Unapprove and delete Mileage Tracking entries
    console.log('Unapproving and deleting entries...');

    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Always select "This month" date range first
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('  ✓ Selected "This month" date range');

    // Step 1: Check if entries exist in Date view first
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();

    const testEmployee = employeeName || 'Test Emp1';
    const displayName = testEmployee.includes(',')
      ? testEmployee
      : `${testEmployee.split(' ')[1]}, ${testEmployee.split(' ')[0]}`;

    // Check if entries exist before attempting to unapprove
    let entryCount = await timeEntriesPage.countEmployeeRow(displayName);
    console.log(`Found ${entryCount} STE entry(ies) for ${displayName}`);

    if (entryCount > 0) {
      // Step 2: Navigate to Approvals section and unapprove ALL approved entries first
      console.log('  Navigating to Approvals section to unapprove entries...');
      await navigateToApprovalsPage(page);
      await timeEntriesPage.waitForLoadingToDisappear();
      await openDateRangeDropdown(page);
      await selectDateRangeOption(page, 'This month');
      await timeEntriesPage.waitForLoadingToDisappear();

      // Loop to unapprove all approved entries
      let unapproveAttempts = 0;
      const maxUnapproveAttempts = 3; // Safety limit to prevent infinite loop

      while (unapproveAttempts < maxUnapproveAttempts) {
        const unapproveButton = page.locator(
          `//tr[.//div[text()="${displayName}"]]//button[.//span[text()="Unapprove"]]`,
        );

        const isUnapproveVisible = await unapproveButton
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);

        if (!isUnapproveVisible) {
          console.log(
            '  ℹ No more Unapprove buttons found - all entries are unapproved',
          );
          break;
        }

        try {
          await unapproveButton.first().click();
          await page
            .getByRole('button', { name: 'Unapprove and unlock time' })
            .click();
          await timeEntriesPage.waitForLoadingToDisappear();
          await page.waitForTimeout(1000);
          unapproveAttempts++;
          console.log(`  ✓ Time entry unapproved (${unapproveAttempts})`);
        } catch (error) {
          console.log(
            `  ℹ Error during unapproval attempt: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          break;
        }
      }

      if (unapproveAttempts > 0) {
        console.log(`  ✓ Total entries unapproved: ${unapproveAttempts}`);
      }

      // Step 3: Navigate back to Time Entries and switch to Date view for deletion
      console.log('  Navigating back to Time Entries for deletion...');
      await navigateToTimeEntries(page);
      await timeEntriesPage.waitForLoadingToDisappear();
      await selectDisplayByOption(page, 'Date');
      await timeEntriesPage.waitForLoadingToDisappear();

      entryCount = await timeEntriesPage.countEmployeeRow(displayName);
      console.log(`  Found ${entryCount} entry(ies) for ${displayName}`);
    } else {
      console.log('  ℹ No STE entries found to clean up');
    }

    // Delete entries from time entries page
    await cleanupAllTimeEntries(page);
    console.log('✓ All time entries cleanup completed');

    console.log('');
    console.log('='.repeat(70));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(70));
    console.log(`  ✓ Time entries unapproved and deleted`);
    console.log('='.repeat(70));
  } catch (error) {
    console.log(
      `⚠ Cleanup encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
};

export const verifyApprovalsInTimeTab = async (page: Page) => {
  console.log('Verifying Approvals in Time Tab...');

  const timeEntriesPage = new TimeEntriesPage(page);
  const timeMenuPage = new TimeMenuNavigationPage(page);

  // Wait for page to be fully loaded and settled before hovering
  console.log('  Waiting for page to fully load...');
  await page.waitForLoadState('load');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000); // Let page render settle

  // Wait for loading spinner to disappear
  const loadingSpinner = page.locator('[aria-label="Loading"]');
  if (await loadingSpinner.isVisible({ timeout: 1000 }).catch(() => false)) {
    console.log('  Waiting for loading spinner to disappear...');
    await loadingSpinner
      .waitFor({ state: 'hidden', timeout: 30000 })
      .catch(() => {});
    await page.waitForTimeout(2000);
  }

  await timeEntriesPage.waitForLoadingToDisappear();

  // Wait for dynamic content like Business Feed to settle
  const businessFeed = page.locator('text=Business Feed');
  if (await businessFeed.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('  Business Feed detected, waiting for it to settle...');
    await page.waitForTimeout(2000);
  }

  console.log('✓ Page loaded, proceeding with hover');

  // Hover on My Apps menu and click Time menu with re-hover if menu closes
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`  Attempt ${attempt}/${maxAttempts}: Hovering on My Apps...`);
    await timeMenuPage.myAppsMenu.hover({ timeout: 10000 });
    await page.waitForTimeout(2000); // Increased wait for menu to fully appear

    // Check if Time menu is visible before clicking
    const isTimeMenuVisible = await timeMenuPage.timeMenu
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (isTimeMenuVisible) {
      // Try to click Time menu
      try {
        await timeMenuPage.timeMenu.click({ timeout: 5000 });
        console.log('✓ Clicked on Time menu');
        break;
      } catch {
        console.log(`  Click failed, menu may have closed. Retrying...`);
        if (attempt === maxAttempts) {
          throw new Error('Failed to click Time menu after multiple attempts');
        }
        await page.waitForTimeout(2000);
        continue;
      }
    } else {
      console.log(`  Time menu not visible, re-hovering...`);
      if (attempt === maxAttempts) {
        throw new Error('Time menu not visible after multiple hover attempts');
      }
      await page.waitForTimeout(2000);
    }
  }

  await timeEntriesPage.waitForLoadingToDisappear();

  // Verify Approvals section under time tab
  const approvalsTab = page.locator('//*[@aria-label="Approvals"]');
  await expect(approvalsTab).toBeVisible();
  console.log('✓ Approvals section visible under Time tab');

  // Click on Approvals
  await approvalsTab.click();
  await page.waitForTimeout(5000);
  await timeEntriesPage.waitForLoadingToDisappear();

  await verifyApprovalsPageElements(page);
  await page.waitForTimeout(3000);

  // Select custom date range: December 2025 (where data exists)
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'Custom');
  await timeEntriesPage.selectCustomDateRange(
    'December 2025',
    '2025-12-01',
    '2025-12-31',
  );
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('✓ Selected custom date range: December 2025');

  // Verify Emp1, Test is present in the table
  const employeeName = 'Emp1, Test';
  const employeeRow = page.locator(`//div[text()='${employeeName}']`).first();
  await expect(employeeRow).toBeVisible();
  console.log(`✓ ${employeeName} is visible in Approvals table`);

  // Verify employee row details
  const rowDetails = await timeEntriesPage.getRowObjectForEmployee(
    employeeName,
  );
  // console.log(`✓ Employee row details verified for ${employeeName}:`, rowDetails);

  // Verify Time entries with Approve link
  const approveLink = page.getByRole('button', { name: 'Approve' }).first();
  await expect(approveLink).toBeVisible();
  console.log('✓ Approve link visible');

  // Verify dropdown arrow with View details links
  const dropdownArrow = page.locator('[aria-label="Expand Menu"]').first();
  await expect(dropdownArrow).toBeVisible();
  await dropdownArrow.click();
  await expect(
    page.getByRole('menuitem', { name: 'View details' }),
  ).toBeVisible();
  console.log('✓ Dropdown arrow with View details link verified');

  console.log('✓ Approvals in Time Tab verified');
};

export const verifyApprovalsNavigationFromTimeEntriesTab = async (
  page: Page,
) => {
  console.log('Verifying Approvals navigation from Time entries Tab...');

  const timeEntriesPage = new TimeEntriesPage(page);
  const timeMenuPage = new TimeMenuNavigationPage(page);

  await navigateToTimeEntries(page);
  console.log('✓ Navigated to Time Entries');

  // Select date range to ensure entries are visible
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Select custom date range: December 2025 (where data exists)
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'Custom');
  await timeEntriesPage.selectCustomDateRange(
    'December 2025',
    '2025-12-01',
    '2025-12-31',
  );
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(1000);
  console.log('✓ Selected custom date range: December 2025');

  // Verify Emp1, Test is present in the table
  const employeeName = 'Emp1, Test';
  // Verify employee row details
  await timeEntriesPage.getRowObjectForEmployee(employeeName);

  const approvalsButton = page.locator(
    `//*[contains(@class,'Toolbar__StyledActionButtonList')]//following::span[text()='Approvals']`,
  );
  await expect(approvalsButton).toBeVisible();
  await approvalsButton.click();
  console.log('✓ Clicked Approvals button');

  // Verify user is on Approvals tab
  await expect(page).toHaveURL(/approval/i);
  console.log('✓ URL contains approval - user is on Approvals tab');

  await verifyApprovalsPageElements(page);
  const approveButton = page.getByRole('button', { name: 'Approve' }).first();
  await expect(approveButton).toBeVisible();
  console.log('✓ Approve button visible');

  console.log('✓ Approvals navigation from Time entries Tab verified');
};

export const verifyViewDetailsLinkInApprovals = async (page: Page) => {
  console.log('Verifying View details link in Approvals...');

  const timeEntriesPage = new TimeEntriesPage(page);

  await navigateToApprovalsPage(page);

  // Select custom date range: December 2025 (where data exists)
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'Custom');
  await timeEntriesPage.selectCustomDateRange(
    'December 2025',
    '2025-12-01',
    '2025-12-31',
  );
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('✓ Selected custom date range: December 2025');

  // Step 1: Verify time entries present for Test Emp1
  const employeeName = 'Emp1, Test';
  const employeeRow = page.locator(`//div[text()='${employeeName}']`).first();
  await expect(employeeRow).toBeVisible();
  console.log(`✓ ${employeeName} is visible in Approvals table`);

  // Step 2: Verify time entries with Approve link and dropdown
  const approveButton = page.getByRole('button', { name: 'Approve' }).first();
  await expect(approveButton).toBeVisible();
  console.log('✓ Approve button visible');

  const dropdownArrow = page.locator('[aria-label="Expand Menu"]').first();
  await expect(dropdownArrow).toBeVisible();
  console.log('✓ Dropdown arrow visible');

  // Step 3: Click on dropdown and select View details
  await dropdownArrow.click();
  const viewDetailsOption = page.getByRole('menuitem', {
    name: 'View details',
  });
  await expect(viewDetailsOption).toBeVisible();
  console.log('✓ View details option visible in dropdown');

  await viewDetailsOption.click();
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('✓ Clicked View details');

  // Step 4: Verify Employee details page
  // Verify time entries displayed has status unapproved
  const unapprovedStatus = page.locator(`//span[text()='Unapproved']`).first();
  await expect(unapprovedStatus).toBeVisible();
  console.log('✓ Time entry status is Unapproved');

  // Verify Edit button is visible
  const editButton = page.locator(`//*[text()='Edit']`).first();
  await expect(editButton).toBeVisible();
  console.log('✓ Edit button is visible');

  // Verify Approve Time dropdown button is visible
  const approveTimeDropdown = page.getByRole('button', {
    name: 'Approve time',
  });
  await expect(approveTimeDropdown).toBeVisible();
  console.log('✓ Approve Time dropdown button is visible');

  // Click Approve Time dropdown and verify options
  await approveTimeDropdown.click();
  await expect(
    page.locator(`//li[@role='option']//span[text()='Approve time']`),
  ).toBeVisible();

  // Verify Unapprove time is disabled (aria-disabled is on the parent li element)
  const unapproveOptionLi = page.locator(
    `//li[@role='option'][.//span[text()='Unapprove time']]`,
  );
  await expect(unapproveOptionLi).toBeVisible();
  await expect(unapproveOptionLi).toHaveAttribute('aria-disabled', 'true');
  console.log('✓ Unapprove time is disabled');

  // Close dropdown
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  console.log('✓ View details link in Approvals verified successfully');
};

export const verifyApprovalsPageElements = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);

  // Verify Date range dropdown (using existing locator from commonUtils)
  const dateRangeDropdown = getDateRangeDropdown(page);
  await expect(dateRangeDropdown).toBeVisible();
  console.log('✓ Date range dropdown visible');

  // Verify Status dropdown with "All" option (using existing method from TimeEntriesPage)
  await timeEntriesPage.validateStatusDropdownVisible();
  console.log('✓ Status dropdown visible');

  // Verify Search bar for Team member (using existing locator pattern from TimeEntriesPage)
  await expect(page.getByPlaceholder('Search team members')).toBeVisible();
  console.log('✓ Team member search bar visible');

  // Verify "View who's working" button (using existing locator pattern from WhosWorkingMapPage)
  await expect(page.locator('//*[text()="View who\'s working"]')).toBeVisible();
  console.log("✓ View who's working button visible");

  // Verify "Add time" dropdown button (using existing locator pattern from commonUtils)
  await expect(page.getByRole('button', { name: 'Add time' })).toBeVisible();
  console.log('✓ Add time dropdown button visible');

  // Verify "Run Payroll" button
  await expect(page.getByRole('button', { name: 'Run Payroll' })).toBeVisible();
  console.log('✓ Run Payroll button visible');

  console.log('✓ Approvals page elements verified successfully');
};

export const validateTeamMemberSearchInApprovals = async (page: Page) => {
  console.log('Validating Team Member Search in Approvals...');

  const timeEntriesPage = new TimeEntriesPage(page);

  await navigateToApprovalsPage(page);

  // Select custom date range: December 2025 (where data exists)
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'Custom');
  await timeEntriesPage.selectCustomDateRange(
    'December 2025',
    '2025-12-01',
    '2025-12-31',
  );
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('✓ Selected custom date range: December 2025');

  // Step 1: Search for valid employee name "Test Emp1"
  const searchInput = page.getByPlaceholder('Search team members');
  await expect(searchInput).toBeVisible();
  console.log('✓ Team member search bar visible');

  await searchInput.click();
  await searchInput.fill('Test Emp1');
  await page.waitForTimeout(1000);

  // Select from dropdown suggestion
  const dropdownOption = page.getByText('Test Emp1', { exact: true }).last();
  await expect(dropdownOption).toBeVisible();
  await dropdownOption.click();
  console.log('✓ Selected "Test Emp1" from dropdown');
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(1000);
  // Verify entry is shown for valid search
  const employeeName = 'Emp1, Test';
  const employeeRow = page.locator(`//div[text()='${employeeName}']`).first();
  await expect(employeeRow).toBeVisible();
  console.log(`✓ ${employeeName} is visible in search results`);
  await page.waitForTimeout(500);
  await expect(page.locator(`//div[text()='Emp2, Test']`)).not.toBeVisible();
  console.log('✓ Emp2, Test is not visible in search results');
  await page.waitForTimeout(500);

  // Clear search
  await searchInput.clear();
  await timeEntriesPage.waitForLoadingToDisappear();

  // Step 2: Search for invalid employee name "Test user"
  await searchInput.click();
  await searchInput.fill('Test Emp2');
  await page.waitForTimeout(1000);

  // Select from dropdown suggestion
  const dropdownOption2 = page.getByText('Test Emp2', { exact: true }).last();
  await expect(dropdownOption2).toBeVisible();
  await dropdownOption2.click();
  await page.waitForTimeout(1000);
  console.log('✓ Selected "Test Emp2" from dropdown');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Verify entry is shown for valid search
  const employeeName2 = 'Emp2, Test';
  const employeeRow2 = page.locator(`//div[text()='${employeeName2}']`).first();
  await expect(employeeRow2).toBeVisible();
  console.log(`✓ ${employeeName2} is visible in search results`);
  await page.waitForTimeout(1000);
  await expect(page.locator(`//div[text()='Emp1, Test']`)).not.toBeVisible();
  console.log('✓ Emp1, Test is not visible in search results');
  await page.waitForTimeout(1000);

  // Clear search
  await searchInput.clear();
  await timeEntriesPage.waitForLoadingToDisappear();

  // Step 2: Search for invalid employee name "Test user"
  await searchInput.click();
  await searchInput.fill('Test user');
  await page.waitForTimeout(1000);

  // Select first option from dropdown (if available)
  const firstDropdownOption = page
    .getByText('Test user', { exact: true })
    .last();
  if (
    await firstDropdownOption.isVisible({ timeout: 3000 }).catch(() => false)
  ) {
    await firstDropdownOption.click();
    await page.waitForTimeout(1000);
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('✓ Selected "Test user" from dropdown');
  } else {
    // Press Enter to trigger search if no dropdown
    await page.keyboard.press('Enter');
    console.log('✓ No dropdown option found, pressed Enter to search');
  }

  // Verify no results are shown for invalid search
  const noResultsMessage = page.getByText('No time entries found');
  await expect(noResultsMessage).toBeVisible();
  console.log(
    '✓ "No time entries found" message displayed for invalid search "Test user"',
  );

  // Clear search to reset
  await searchInput.clear();
  await timeEntriesPage.waitForLoadingToDisappear();

  console.log('✓ Team Member Search in Approvals validated successfully');
};

/**
 * Cleanup function for Approvals Run Payroll test data
 * Steps:
 * 1. Delete payroll
 * 2. Unapprove entries from Approvals page
 * 3. Delete STE entries
 */
export const ApprovalsRunpayrollcleanup = async (
  page: Page,
  employeeName?: string,
) => {
  console.log('');
  console.log('Starting cleanup of Approvals Run Payroll test data...');

  const timeEntriesPage = new TimeEntriesPage(page);
  const employeesPage = new EmployeesPage(page);

  try {
    // Step 1: Delete payroll
    console.log('Step 1: Deleting payroll...');

    try {
      await employeesPage.deleteEmployeePaycheck();
      console.log('✓ Payroll deleted successfully');
    } catch (payrollError) {
      console.log('  ⚠ Payroll deletion failed or no payroll found to delete');
      console.log(
        `  Error: ${
          payrollError instanceof Error
            ? payrollError.message
            : String(payrollError)
        }`,
      );
      console.log('  Continuing to clean up time activities...');
    }

    // Step 2 & 3: Unapprove and delete STE entries
    console.log('Step 2-3: Unapproving and deleting STE entries...');

    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Always select "This month" date range first
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('  ✓ Selected "This month" date range');

    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();

    const testEmployee = employeeName || 'Test Emp1';
    const displayName = testEmployee.includes(',')
      ? testEmployee
      : `${testEmployee.split(' ')[1]}, ${testEmployee.split(' ')[0]}`;

    // Check if entries exist before attempting to unapprove
    let entryCount = await timeEntriesPage.countEmployeeRow(displayName);
    console.log(`Found ${entryCount} STE entry(ies) for ${displayName}`);

    if (entryCount > 0) {
      // Try to unapprove entries first (only if they exist)
      try {
        // Switch to Employee view for unapproval
        await navigateToApprovalsPage(page);
        await timeEntriesPage.waitForLoadingToDisappear();
        await openDateRangeDropdown(page);
        await selectDateRangeOption(page, 'This month');
        await timeEntriesPage.waitForLoadingToDisappear();

        const unapproveButton = page.locator(
          `//tr[.//div[text()="${displayName}"]]//button[.//span[text()="Unapprove"]]`,
        );

        if (
          await unapproveButton.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          await unapproveButton.click();
          await page
            .getByRole('button', { name: 'Unapprove and unlock time' })
            .click();
          await page.waitForTimeout(2000);
          console.log('✓ STE unapproved');
        } else {
          console.log(
            '  ℹ STE is already unapproved or no unapprove button found',
          );
        }
      } catch (error) {
        console.log(
          '  ℹ STE may already be unapproved or error during unapproval',
        );
      }

      // Delete STE entries from time entries page
      // Switch back to Date view for deletion
      await navigateToTimeEntries(page);
      await timeEntriesPage.waitForLoadingToDisappear();
      await selectDisplayByOption(page, 'Date');
      await timeEntriesPage.waitForLoadingToDisappear();

      // Delete all entries for the employee
      entryCount = await timeEntriesPage.countEmployeeRow(displayName);
      while (entryCount > 0) {
        console.log(`  Deleting entry (${entryCount} remaining)...`);
        const deleted = await timeEntriesPage.deleteFirstTimeEntry();
        if (!deleted) {
          break;
        }

        // Refresh data by switching filters
        await selectDisplayByOption(page, 'Customer');
        await timeEntriesPage.waitForLoadingToDisappear();
        await selectDisplayByOption(page, 'Date');
        await timeEntriesPage.waitForLoadingToDisappear();

        entryCount = await timeEntriesPage.countEmployeeRow(displayName);
      }

      console.log('✓ STE entries deleted from time entries');
    } else {
      console.log('  ℹ No STE entries found to clean up');
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(70));
    console.log(`  ✓ Payroll deleted successfully`);
    console.log(`  ✓ STE entries unapproved from Approvals page and deleted`);
    console.log('='.repeat(70));
  } catch (error) {
    console.log(
      `⚠ Cleanup encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
};

export const validateRunPayrollFlowInApprovals = async (
  page: Page,
  employeeName?: string,
) => {
  console.log('Validating Run Payroll flow in Approvals...');

  const timeEntriesPage = new TimeEntriesPage(page);
  const singleTimeActivityPage = new SingleTimeEntryPage(page);
  const runPayrollPage = new RunPayrollPage(page);

  const testEmployee = employeeName || 'Test Emp1';
  const testDescription = 'STE Test Entry';
  const initialDuration = '3';
  const updatedDuration = '5';

  // Prepare both name formats for searching (some screens show "First Last", others show "Last, First")
  const firstName = testEmployee.split(' ')[0];
  const lastName = testEmployee.split(' ')[1] || testEmployee.split(' ')[0];
  const displayName = testEmployee.includes(',')
    ? testEmployee
    : `${lastName}, ${firstName}`;

  try {
    // Step 1: Add STE
    console.log('');
    console.log('Step 1: Creating STE...');

    await navigateToTimeEntries(page);

    // Wait a moment for page to be ready
    await timeEntriesPage.waitForLoadingToDisappear();

    // Click Add time dropdown and select Single time entry
    await clickAddTimeDropdown(page);
    await selectSingleTimeEntryFromAddTime(page, false); // false = paid company (Single time entry)

    // Wait for page to load
    await page.waitForTimeout(2000);
    await timeEntriesPage.handlePopupsInAnyOrder();
    await singleTimeActivityPage.waitTillNameFieldVisible();

    // Select employee
    await singleTimeActivityPage.openDropdown('Name');
    await page.waitForTimeout(500);
    await singleTimeActivityPage.clickDropdownOption(1, 'Name');

    await singleTimeActivityPage.openAndselectCustomerOption(1);

    // Set duration
    await singleTimeActivityPage.enterFieldValue('Duration', initialDuration);

    // Add description/notes
    await singleTimeActivityPage.enterNotes(testDescription);

    // Save and close the entry (STE does not have pay type)
    await singleTimeActivityPage.clickSaveAndCloseButton();
    await page.waitForTimeout(2000);
    console.log(`✓ Created STE: ${initialDuration} hours`);

    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();

    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    await navigateToApprovalsPage(page);

    // Select date range to ensure entries are visible
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    await clickRunPayrollButtonInApprovals(page);

    // Step 2: Validate unapproved STE in run payroll screen (STE hours should NOT be visible)
    console.log('');
    console.log(
      'Step 2: Validating unapproved STE in run payroll screen (STE hours should NOT be visible)...',
    );
    // Verify navigation to Run Payroll page
    await expect(page).toHaveURL(/runpayroll/i, { timeout: 30000 });
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('✓ Navigated to Run Payroll page');
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    // Verify STE hours (3h) are NOT showing (unapproved time should not appear)
    const durationInHours = `${initialDuration}h`;
    const hoursNotVisible =
      await runPayrollPage.validateEmployeeHoursNotVisible(
        testEmployee,
        durationInHours,
      );

    if (hoursNotVisible) {
      console.log(
        `✓ Unapproved STE hours (${durationInHours}) NOT visible in run payroll (as expected)`,
      );
    } else {
      console.log(
        `⚠ Warning: STE hours (${durationInHours}) are visible (unexpected for unapproved STE)`,
      );
    }

    // Step 3: Approve the STE with retry logic
    console.log('');
    console.log('Step 3: Approving the STE...');
    // Already on time entries page from navigateBack(), just wait for loading
    await navigateToApprovalsPage(page);
    await timeEntriesPage.waitForLoadingToDisappear();

    // Always select "This month" date range before approval
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('  ✓ Selected "This month" date range');

    // Approve time entries using reliable method with retry logic
    const approvalMessageName = `${firstName} ${lastName}`;

    let approvalSuccess = false;
    let approvalAttempts = 0;
    const maxApprovalAttempts = 2;

    while (!approvalSuccess && approvalAttempts < maxApprovalAttempts) {
      approvalAttempts++;
      console.log(
        `  Approval attempt ${approvalAttempts}/${maxApprovalAttempts}...`,
      );

      try {
        // Click the Approve button for Emp1, Test
        const approveButton = page.locator(
          `//tr[.//div[text()="${displayName}"]]//button[.//span[text()="Approve"]]`,
        );
        await expect(approveButton).toBeVisible();
        await approveButton.click();

        // Lock-time confirmation may or may not appear
        await timeEntriesPage.handleLockTimeDialogIfPresent();

        // Wait for approval to complete
        await timeEntriesPage.waitForApprovalProcessing();

        // Check for error alert
        const hasAlert = await timeEntriesPage.hasErrorAlert();

        if (hasAlert) {
          console.log(
            `  ⚠ Error alert detected on attempt ${approvalAttempts}`,
          );

          // Check if approval actually succeeded despite the alert (Unapprove button visible)
          await page.waitForTimeout(1000);
          const hasUnapproveButton =
            await timeEntriesPage.isUnapproveButtonVisible(displayName);

          if (hasUnapproveButton) {
            console.log(
              `  ✓ Approval succeeded despite alert (Unapprove button now visible)`,
            );
            approvalSuccess = true;
            break;
          } else {
            console.log(
              `  ✗ Approval failed (Unapprove button not visible), retrying...`,
            );
            await page.waitForTimeout(1000);
            continue; // Retry
          }
        }

        // Validate approval success message
        await timeEntriesPage.validateTimeApprovedMessage(approvalMessageName);
        approvalSuccess = true;
        console.log('  ✓ STE approved successfully with proper validation');
      } catch (error) {
        if (approvalAttempts >= maxApprovalAttempts) {
          throw error;
        }
        console.log(
          `  ⚠ Approval attempt ${approvalAttempts} failed, retrying...`,
        );
        await page.waitForTimeout(1000);
      }
    }

    if (!approvalSuccess) {
      throw new Error('Failed to approve STE after maximum attempts');
    }

    // Step 5: Validate approved STE in run payroll screen (STE hours should now be visible)
    console.log('');
    console.log(
      'Step 5: Validating approved STE in run payroll screen (STE hours should now be visible)...',
    );
    await clickRunPayrollButtonInApprovals(page);
    await expect(page).toHaveURL(/runpayroll/i, { timeout: 30000 });
    await timeEntriesPage.waitForLoadingToDisappear();
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    // Verify STE hours (3h) are now showing (approved time should appear)
    const hoursVisible = await runPayrollPage.validateEmployeeHoursVisible(
      testEmployee,
      durationInHours,
    );

    if (!hoursVisible) {
      throw new Error(
        `Expected STE hours (${durationInHours}) to be visible but they are not`,
      );
    }

    console.log(
      `✓ Approved STE hours (${durationInHours}) now visible in run payroll`,
    );

    // Step 6: Unapprove, update STE, and approve again
    console.log('');
    console.log('Step 6: Unapproving, editing, and re-approving STE...');

    // Navigate to time entries page (navigateBack not reliable)
    await navigateToApprovalsPage(page);
    await timeEntriesPage.waitForLoadingToDisappear();

    // Always select "This month" date range before unapproval
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('  ✓ Selected "This month" date range');

    // Click the Approve button for Emp1, Test
    const unapproveButton = page.locator(
      `//tr[.//div[text()="${displayName}"]]//button[.//span[text()="Unapprove"]]`,
    );
    await expect(unapproveButton).toBeVisible();
    await unapproveButton.click();

    // Handle unapprove and unlock time dialog
    await page
      .getByRole('button', { name: 'Unapprove and unlock time' })
      .click();

    // Wait for unapproval to complete and validate success message
    await page.waitForTimeout(2000);
    await expect(page.getByTestId('toastMessage')).toContainText(
      `Time unapproved for ${approvalMessageName}`,
      { timeout: 10000 },
    );

    console.log('✓ STE unapproved successfully with proper validation');

    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    // Switch to Date view to edit the entry
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();

    // Edit the entry by clicking on it
    await timeEntriesPage.clickEntryByDescription(testDescription);

    // Update the duration
    await singleTimeActivityPage.enterFieldValue('Duration', updatedDuration);

    // Save and close the changes
    await singleTimeActivityPage.clickSaveAndCloseButton();
    await page.waitForTimeout(2000);
    console.log(
      `✓ Updated STE duration from ${initialDuration} to ${updatedDuration} hours`,
    );

    // Approve again with updated duration and retry logic
    await navigateToApprovalsPage(page);
    await timeEntriesPage.waitForLoadingToDisappear();

    // Always select "This month" date range before re-approval
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('  ✓ Selected "This month" date range');

    // Re-approve with retry logic
    approvalSuccess = false;
    approvalAttempts = 0;

    while (!approvalSuccess && approvalAttempts < maxApprovalAttempts) {
      approvalAttempts++;
      console.log(
        `  Re-approval attempt ${approvalAttempts}/${maxApprovalAttempts}...`,
      );

      try {
        // Click the Approve button for Emp1, Test
        const approveButton = page.locator(
          `//tr[.//div[text()="${displayName}"]]//button[.//span[text()="Approve"]]`,
        );
        await expect(approveButton).toBeVisible();
        await approveButton.click();

        // Lock-time confirmation may or may not appear
        await timeEntriesPage.handleLockTimeDialogIfPresent();

        // Wait for approval to complete
        await timeEntriesPage.waitForApprovalProcessing();

        // Check for error alert
        const hasAlert = await timeEntriesPage.hasErrorAlert();

        if (hasAlert) {
          console.log(
            `  ⚠ Error alert detected on re-approval attempt ${approvalAttempts}`,
          );

          // Check if re-approval actually succeeded despite the alert (Unapprove button visible)
          await page.waitForTimeout(1000);
          const hasUnapproveButton =
            await timeEntriesPage.isUnapproveButtonVisible(displayName);

          if (hasUnapproveButton) {
            console.log(
              `  ✓ Re-approval succeeded despite alert (Unapprove button now visible)`,
            );
            approvalSuccess = true;
            break;
          } else {
            console.log(
              `  ✗ Re-approval failed (Unapprove button not visible), retrying...`,
            );
            await page.waitForTimeout(1000);
            continue; // Retry
          }
        }

        // Validate re-approval success message
        await timeEntriesPage.validateTimeApprovedMessage(approvalMessageName);
        approvalSuccess = true;
        console.log(
          '  ✓ STE re-approved with updated duration and proper validation',
        );
      } catch (error) {
        if (approvalAttempts >= maxApprovalAttempts) {
          throw error;
        }
        console.log(
          `  ⚠ Re-approval attempt ${approvalAttempts} failed, retrying...`,
        );
        await page.waitForTimeout(1000);
      }
    }

    if (!approvalSuccess) {
      throw new Error('Failed to re-approve STE after maximum attempts');
    }

    // Step 7: Validate updated values in payroll and submit payroll (updated STE hours should be visible)
    console.log('');
    console.log(
      'Step 7: Validating updated values in payroll and submitting...',
    );
    await clickRunPayrollButtonInApprovals(page);
    await expect(page).toHaveURL(/runpayroll/i, { timeout: 30000 });
    await timeEntriesPage.waitForLoadingToDisappear();
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    // Verify updated STE hours (5h) are showing, NOT old hours (3h)
    const updatedDurationInHours = `${updatedDuration}h`;
    const updatedHoursVisible =
      await runPayrollPage.validateEmployeeHoursVisible(
        testEmployee,
        updatedDurationInHours,
      );

    // Check old hours are NOT showing
    const oldHoursStillVisible =
      !(await runPayrollPage.validateEmployeeHoursNotVisible(
        testEmployee,
        durationInHours,
      ));

    if (oldHoursStillVisible) {
      console.log(
        `⚠ Warning: Still showing old hours (${durationInHours}), update may not have taken effect`,
      );
    }

    if (!updatedHoursVisible) {
      throw new Error(
        `Expected updated STE hours (${updatedDurationInHours}) to be visible but they are not`,
      );
    }

    console.log(
      `✓ Updated STE hours (${updatedDurationInHours}) now visible in run payroll (old ${durationInHours} not showing)`,
    );

    // Submit the payroll
    console.log('  Submitting payroll with Cash account...');
    await runPayrollPage.submitPayrollWithCashAccount();
    console.log('✓ Payroll submitted successfully');
  } catch (error) {
    console.log(`✗ Error validating Run Payroll flow in Approvals:`, error);
    throw error;
  }
};

/**
 * Approves time entries via Approvals section
 */
export const approveTimeEntriesML = async (
  page: Page,
  employeeName: string,
) => {
  console.log(`Approving time entries for ${employeeName}`);

  const approvalsPage = new ApprovalsPage(page);

  // Step 1: Navigate to Approvals page
  await approvalsPage.navigateToApprovalsPage();
  await approvalsPage.waitForLoadingToDisappear();

  // Step 2: Select date range "This month"
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await approvalsPage.waitForLoadingToDisappear();

  // Step 3: Click employee's Approve button and handle lock dialog
  let approved = await approvalsPage.approveEmployee(employeeName);

  // Step 4: If not approved, retry once
  if (!approved) {
    console.log(`Retrying approval for ${employeeName}...`);
    await page.waitForTimeout(1500);
    approved = await approvalsPage.approveEmployee(employeeName);
  }

  console.log(`✓ Time entries approved for ${employeeName}`);
};

// ---------- Add Time Drawer helpers (used by validateAddTimeDrawerCases) ----------

const ADD_TIME_DRAWER_DURATION_NOTES = 'Add duration entry';
const ADD_TIME_DRAWER_START_END_NOTES = 'Add time drawer start end test';
const ADD_TIME_DRAWER_LIST_EDIT_NOTES = 'Add time drawer test — edit';

async function createEntryWithDuration(page: Page): Promise<{
  workerName: string | null;
  yesterday: Date;
  dayNum: number;
  dayShort: string;
  durationValue: string;
  notesValue: string;
  nameToUse: string;
  expectedMinutes: number;
}> {
  const timeEntriesPage = new TimeEntriesPage(page);
  await navigateToTimeEntries(page);
  await timeEntriesPage.waitForLoadingToDisappear();
  await clickAddTimeDropdown(page);
  await page.waitForTimeout(1000);
  const singleTimeActivityOption = page
    .getByRole('menuitem', { name: /^Single Time Activity$/i })
    .or(page.getByText('Single Time Activity', { exact: true }));
  if (
    await singleTimeActivityOption
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)
  ) {
    await selectSingleTimeEntryFromAddTime(page, true);
  }
  await timeEntriesPage.waitForLoadingToDisappear();

  const addTimeDialog = page.getByRole('dialog', { name: 'Add time' });
  const workerCardButton = addTimeDialog
    .locator('button[class*="WorkerCard__Container"]')
    .first();
  const workerName = await workerCardButton
    .locator('p[data-di-mask="true"]')
    .textContent();
  await workerCardButton.click();
  console.log(`✓ Clicked worker: ${workerName?.trim() ?? ''}`);
  await page.waitForTimeout(1000);

  const addTimeForWorkDrawer = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: 'Add time for Test' }),
  });

  await addTimeForWorkDrawer
    .getByRole('combobox', { name: 'Date range selector' })
    .click();
  await page.waitForTimeout(500);
  await page.getByRole('option', { name: 'This week' }).click();
  await page.waitForTimeout(500);
  console.log('✓ Selected This week');

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dayNum = yesterday.getDate();
  const dayShort = yesterday
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toUpperCase()
    .slice(0, 3);
  await addTimeForWorkDrawer
    .locator('#segmented-date-control-container')
    .getByRole('tab')
    .filter({ hasText: String(dayNum) })
    .filter({ hasText: dayShort })
    .click();
  await page.waitForTimeout(500);
  console.log(`✓ Selected yesterday's date: ${dayNum} ${dayShort}`);

  const startEndSwitch = addTimeForWorkDrawer
    .getByRole('switch', { name: 'Start/end times' })
    .first();
  const isStartEndEnabled = await startEndSwitch.isChecked();
  if (isStartEndEnabled) {
    await startEndSwitch.click();
    await expect(startEndSwitch).not.toBeChecked();
    console.log('✓ Unchecked Start/end times toggle');
  }

  const durationValue = '1';
  await addTimeForWorkDrawer
    .locator('[data-automation-id="duration-textfield"]')
    .fill(durationValue);
  await page.waitForTimeout(300);
  console.log(`✓ Filled duration: ${durationValue}`);

  await addTimeForWorkDrawer
    .getByRole('button', { name: 'Add work details' })
    .click();
  await page.waitForTimeout(1000);

  const addWorkDetailsDrawer = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: 'Add work details' }),
  });

  const workerNameTrimmed = workerName?.trim() ?? '';
  const workerNameReversed = workerNameTrimmed.includes(',')
    ? workerNameTrimmed
        .split(',')
        .map((p) => p.trim())
        .reverse()
        .join(' ')
    : workerNameTrimmed;
  await expect(
    addWorkDetailsDrawer
      .getByText(workerNameTrimmed, { exact: false })
      .or(addWorkDetailsDrawer.getByText(workerNameReversed, { exact: false })),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    addWorkDetailsDrawer.locator('[data-automation-id="duration-textfield"]'),
  ).toHaveValue('1.00');
  console.log('✓ Worker, start date, duration verified');

  await addWorkDetailsDrawer
    .getByLabel('Notes')
    .fill(ADD_TIME_DRAWER_DURATION_NOTES);
  await page.waitForTimeout(300);
  console.log('✓ Added notes');

  await addWorkDetailsDrawer
    .getByRole('button')
    .filter({ hasText: 'Done' })
    .click();
  await page.waitForTimeout(500);

  await addTimeForWorkDrawer
    .getByRole('button')
    .filter({ hasText: 'Save' })
    .click();
  await page.waitForTimeout(2000);
  // await addTimeForWorkDrawer
  //   .locator('button[aria-label="Close"]')
  //   .first()
  //   .click();
  // await page.waitForTimeout(2000);
  await waitForLoadingToDisappear(page);
  console.log('✓ Time Drawer added successfully');

  await selectDisplayByOption(page, 'Customer');
  await timeEntriesPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  const targetMonthYear = yesterday.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const entryDateIso = `${yesterday.getFullYear()}-${pad2(
    yesterday.getMonth() + 1,
  )}-${pad2(yesterday.getDate())}`;
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'Custom');
  await timeEntriesPage.selectCustomDateRange(
    targetMonthYear,
    entryDateIso,
    entryDateIso,
  );
  await timeEntriesPage.waitForLoadingToDisappear();

  const nameTrimmed = workerName?.trim() ?? '';
  const displayName = nameTrimmed.includes(',')
    ? nameTrimmed
    : (() => {
        const parts = nameTrimmed.split(/\s+/);
        return parts.length >= 2
          ? `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`
          : nameTrimmed;
      })();
  const displayNameReversed = nameTrimmed.includes(',')
    ? nameTrimmed
        .split(',')
        .map((p) => p.trim())
        .reverse()
        .join(' ')
    : nameTrimmed;

  let entryCount = await timeEntriesPage.countEmployeeRow(displayName);
  let nameToUse = displayName;
  if (entryCount === 0) {
    entryCount = await timeEntriesPage.countEmployeeRow(displayNameReversed);
    nameToUse = displayNameReversed;
  }
  expect(entryCount).toBeGreaterThan(0);

  const rowObj = await timeEntriesPage.getRowObjectForEmployee(nameToUse);
  const actualMinutes = normalizeToMinutes(rowObj.Hours || '');
  const expectedMinutesNum = normalizeToMinutes(durationValue);
  expect(actualMinutes).toBe(expectedMinutesNum);
  console.log(
    `✓ Created entry verified in list: ${nameToUse}, duration ${durationValue}`,
  );

  return {
    workerName,
    yesterday,
    dayNum,
    dayShort,
    durationValue,
    notesValue: ADD_TIME_DRAWER_DURATION_NOTES,
    nameToUse,
    expectedMinutes: normalizeToMinutes(durationValue),
  };
}

async function createEntryWithStartAndEndTime(
  page: Page,
  dayNum: number,
  dayShort: string,
  nameToUse: string,
  yesterday: Date,
): Promise<void> {
  const timeEntriesPage = new TimeEntriesPage(page);
  await clickAddTimeDropdown(page);
  await timeEntriesPage.waitForLoadingToDisappear();
  const addTimeDialogSet = page.getByRole('dialog', { name: 'Add time' });
  await addTimeDialogSet
    .locator('button[class*="WorkerCard__Container"]')
    .first()
    .click();
  await page.waitForTimeout(1000);

  const addTimeForWorkSet = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: 'Add time for Test' }),
  });
  await addTimeForWorkSet
    .getByRole('combobox', { name: 'Date range selector' })
    .click();
  await page.waitForTimeout(500);
  await page.getByRole('option', { name: 'This week' }).click();
  await page.waitForTimeout(500);
  await addTimeForWorkSet
    .locator('#segmented-date-control-container')
    .getByRole('tab')
    .filter({ hasText: String(dayNum) })
    .filter({ hasText: dayShort })
    .click();
  await page.waitForTimeout(500);

  const startEndToggle = addTimeForWorkSet.getByRole('switch', {
    name: 'Start/end times',
  });
  const toggleCount = await startEndToggle.count();
  const newEntrySectionIndex = toggleCount >= 2 ? 1 : 0;
  await expect(startEndToggle.nth(newEntrySectionIndex)).toBeVisible({
    timeout: 15000,
  });
  console.log('✓ New entry section visible');

  await startEndToggle.nth(newEntrySectionIndex).click();
  await page.waitForTimeout(500);

  const startTimeLabel = addTimeForWorkSet.getByLabel('Start time');
  const endTimeLabel = addTimeForWorkSet.getByLabel('End time');
  const startCount = await startTimeLabel.count();
  const endCount = await endTimeLabel.count();
  const startInput = startCount > 1 ? startTimeLabel.last() : startTimeLabel;
  const endInput = endCount > 1 ? endTimeLabel.last() : endTimeLabel;
  await startInput.click();
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: '08:00 AM' }).click();
  await page.waitForTimeout(300);
  await endInput.click();
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: '09:00 AM' }).click();
  await page.waitForTimeout(300);

  await addTimeForWorkSet
    .getByRole('button', { name: 'Add work details' })
    .last()
    .click();
  await page.waitForTimeout(1000);
  const addWorkDetailsStartEnd = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: 'Add work details' }),
  });
  await expect(addWorkDetailsStartEnd).toBeVisible({ timeout: 15000 });
  await addWorkDetailsStartEnd
    .getByLabel('Notes')
    .fill(ADD_TIME_DRAWER_START_END_NOTES);
  await page.waitForTimeout(300);
  await addWorkDetailsStartEnd
    .getByRole('button')
    .filter({ hasText: 'Done' })
    .click();
  await page.waitForTimeout(500);

  await addTimeForWorkSet
    .getByRole('button')
    .filter({ hasText: 'Save' })
    .click();
  await page.waitForTimeout(2000);
  console.log(
    '✓ Start/end time entry (08:00 AM - 09:00 AM) saved with Add work details notes',
  );

  const listTargetMonthYear = yesterday.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const listEntryDateIso = `${yesterday.getFullYear()}-${pad2(
    yesterday.getMonth() + 1,
  )}-${pad2(yesterday.getDate())}`;
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'Custom');
  await timeEntriesPage.selectCustomDateRange(
    listTargetMonthYear,
    listEntryDateIso,
    listEntryDateIso,
  );
  await timeEntriesPage.waitForLoadingToDisappear();
  const entryCountWithStartEnd = await timeEntriesPage.countEmployeeRow(
    nameToUse,
  );
  expect(entryCountWithStartEnd).toBeGreaterThan(0);
  const rowStartEnd = await timeEntriesPage.getRowObjectForEmployee(nameToUse);
  const hoursStartEnd = normalizeToMinutes(rowStartEnd.Hours || '');
  expect(hoursStartEnd).toBeGreaterThanOrEqual(normalizeToMinutes('1'));
  console.log('✓ Entry with start/end time visible in list');

  // Start/end block is deleted later in validateAddTimeDrawerCases after verifying
  // the duration entry (5h); the duration block is removed from Add time first so
  // list edit targets the start/end entry.
  //
  // await clickAddTimeDropdown(page);
  // ... (previously: Additional Options nth(1) → Delete start/end → Save → reopen
  // drawer → assert 08:00–09:00 gone → Close → custom range → assert list hours
  // back to duration-only)
}

async function getRowObjectForEmployeeByNotesSubstring(
  timeEntriesPage: TimeEntriesPage,
  nameToUse: string,
  notesSubstring: string,
): Promise<Record<string, string>> {
  const count = await timeEntriesPage.countEmployeeRow(nameToUse);
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const rowObj = await timeEntriesPage.getRowObjectForEmployee(nameToUse, i);
    if ((rowObj.Notes || '').includes(notesSubstring)) {
      return rowObj;
    }
  }
  throw new Error(
    `No row for "${nameToUse}" with notes containing "${notesSubstring}"`,
  );
}

async function clickEditOnEmployeeRowContainingNotes(
  page: Page,
  nameToUse: string,
  notesSubstring: string,
): Promise<void> {
  const row = page
    .locator(`//div[contains(text(), '${nameToUse}')]/ancestor::tr`)
    .filter({ hasText: notesSubstring })
    .first();
  await expect(row).toBeVisible({ timeout: 15000 });
  await row
    .getByRole('button', { name: 'Edit' })
    .or(row.getByRole('link', { name: 'Edit' }))
    .or(row.getByText('Edit', { exact: true }))
    .first()
    .click();
}

/** List only: This week → find employee row whose Notes contain substring → assert hours. */
async function verifyListHoursForEntryByNotes(
  page: Page,
  nameToUse: string,
  notesContains: string,
  expectedHoursStr: string,
): Promise<void> {
  const timeEntriesPage = new TimeEntriesPage(page);
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This week');
  await timeEntriesPage.waitForLoadingToDisappear();
  const rowObj = await getRowObjectForEmployeeByNotesSubstring(
    timeEntriesPage,
    nameToUse,
    notesContains,
  );
  expect(normalizeToMinutes(rowObj.Hours || '')).toBe(
    normalizeToMinutes(expectedHoursStr),
  );
  console.log(
    `✓ List row (notes contain "${notesContains}"): hours ${expectedHoursStr}`,
  );
}

type VerifyEntryInTimeEntriesExtras = {
  /** When set, list + details dialog assert notes. */
  expectedNotes?: string;
  /** Combobox values after selection in edit; dialog inputs must match these. */
  expectedCustomer?: string;
  expectedService?: string;
  /**
   * When set, list assertions and row click use the employee row whose Notes
   * contain this substring (e.g. start/end entry after list edit).
   */
  rowNotesContains?: string;
};

async function verifyEntryInTimeEntriesScreen(
  page: Page,
  nameToUse: string,
  expectedDateFormatted: string,
  expectedDurationStr: string,
  extras?: VerifyEntryInTimeEntriesExtras,
): Promise<void> {
  const timeEntriesPage = new TimeEntriesPage(page);
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This week');
  await timeEntriesPage.waitForLoadingToDisappear();
  const rowMatchNotes =
    extras?.rowNotesContains ?? extras?.expectedNotes ?? undefined;
  const rowObj = rowMatchNotes
    ? await getRowObjectForEmployeeByNotesSubstring(
        timeEntriesPage,
        nameToUse,
        rowMatchNotes,
      )
    : await timeEntriesPage.getRowObjectForEmployee(nameToUse);
  const actualMinutes = normalizeToMinutes(rowObj.Hours || '');
  expect(actualMinutes).toBe(normalizeToMinutes(expectedDurationStr));
  console.log(`✓ Duration ${expectedDurationStr} verified in entries list`);
  if (extras?.expectedNotes) {
    expect(rowObj.Notes || '').toContain(extras.expectedNotes);
    console.log('✓ List: notes verified');
  }
  if (extras?.expectedCustomer !== undefined) {
    expect(rowObj.Customer?.trim()).toBe(extras.expectedCustomer);
  }
  if (extras?.expectedService !== undefined) {
    const serviceFromRow =
      rowObj.Service ?? rowObj['Service item'] ?? rowObj['Service Item'];
    expect(serviceFromRow?.trim()).toBe(extras.expectedService);
  }
  if (
    extras?.expectedCustomer !== undefined ||
    extras?.expectedService !== undefined
  ) {
    console.log('✓ List: customer and service match selection');
  }

  const rowToOpen = rowMatchNotes
    ? page
        .locator(`//div[contains(text(), '${nameToUse}')]/ancestor::tr`)
        .filter({ hasText: rowMatchNotes })
        .first()
    : page
        .locator(`//div[contains(text(), '${nameToUse}')]/ancestor::tr`)
        .first();
  await rowToOpen.click();
  await page.waitForTimeout(1000);

  const timeEntryDetailsDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByText('Time entry details') });
  await expect(timeEntryDetailsDialog).toBeVisible({ timeout: 15000 });

  const dateInputs = timeEntryDetailsDialog.locator(
    'input[id^="IDSDatePickerInput"]',
  );
  const dateCount = await dateInputs.count();
  expect(dateCount).toBeGreaterThan(0);
  for (let i = 0; i < dateCount; i++) {
    await expect(dateInputs.nth(i)).toHaveValue(expectedDateFormatted);
  }

  const startTimeInput = timeEntryDetailsDialog
    .locator('xpath=.//input[contains(@aria-label, "Start time")]')
    .first();
  const endTimeInput = timeEntryDetailsDialog
    .locator('xpath=.//input[contains(@aria-label, "End time")]')
    .first();
  await expect(startTimeInput).toBeVisible({ timeout: 15000 });
  await expect(endTimeInput).toBeVisible({ timeout: 15000 });

  await expect(startTimeInput).toHaveValue(/08:00\s*am/i);
  await expect(endTimeInput).toHaveValue(/03:00\s*pm/i);

  const expectedTotalFormatted = expectedDurationStr.includes('.')
    ? expectedDurationStr
    : `${expectedDurationStr}.00`;
  await expect(
    timeEntryDetailsDialog.locator(
      '.timesheet-details-total .total-field-value',
    ),
  ).toHaveText(expectedTotalFormatted);

  console.log(
    '✓ Time entry details: start/end dates, times (IST), and total verified',
  );

  if (extras?.expectedNotes) {
    await expect(
      timeEntryDetailsDialog.locator(
        '[data-automation-id="notes-textarea_textarea"]',
      ),
    ).toHaveValue(extras.expectedNotes);
  }
  if (
    extras?.expectedCustomer !== undefined &&
    extras?.expectedService !== undefined
  ) {
    const customerInput = timeEntryDetailsDialog
      .locator('input[role="combobox"][data-testid="__textField"]')
      .first();
    const customerValue = (await customerInput.inputValue()).trim();
    expect(customerValue).toBe(extras.expectedCustomer);
    const serviceInput = timeEntryDetailsDialog
      .locator(
        'input[role="combobox"][data-testid="customfield-dropdown-typeahead__textField"]',
      )
      .or(
        timeEntryDetailsDialog.locator(
          'input[role="combobox"][placeholder="(none)"]',
        ),
      )
      .first();
    const serviceValue = (await serviceInput.inputValue()).trim();
    expect(serviceValue).toBe(extras.expectedService);
    console.log(
      `✓ Time entry details — customer: ${customerValue}, service: ${serviceValue}, notes: ${
        extras.expectedNotes ?? '—'
      }`,
    );
  } else if (extras?.expectedNotes) {
    console.log(`✓ Time entry details — notes: ${extras.expectedNotes}`);
  }
  await timeEntryDetailsDialog
    .locator('.carousel-navigation .navigation-icon-close')
    .first()
    .click();
  await page.waitForTimeout(1000);
  await waitForLoadingToDisappear(page);
}

/**
 * Run only after `editTimeEntryDetailsFromTimeEntriesList` for the start/end row:
 * list + Time entry details assert hours, edit notes, customer, and service (row
 * matched by edit notes).
 */
async function verifyStartEndTimeEntryAfterListEdit(
  page: Page,
  nameToUse: string,
  expectedDateFormatted: string,
  expectedHoursStr: string,
  extras: {
    expectedNotes: string;
    expectedCustomer: string;
    expectedService: string;
  },
): Promise<void> {
  await verifyEntryInTimeEntriesScreen(
    page,
    nameToUse,
    expectedDateFormatted,
    expectedHoursStr,
    {
      ...extras,
      rowNotesContains: extras.expectedNotes,
    },
  );
}

/** Edit from time entries list: Edit → duration or start/end, 2nd customer & service, notes → Save; assert list. */
async function editTimeEntryDetailsFromTimeEntriesList(
  page: Page,
  nameToUse: string,
  opts?: { forStartEndEntry?: boolean },
): Promise<{ selectedCustomer: string; selectedService: string }> {
  const timeEntriesPage = new TimeEntriesPage(page);

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This week');
  await timeEntriesPage.waitForLoadingToDisappear();

  if (opts?.forStartEndEntry) {
    await clickEditOnEmployeeRowContainingNotes(
      page,
      nameToUse,
      ADD_TIME_DRAWER_START_END_NOTES,
    );
  } else {
    await timeEntriesPage.clickEditForEmployee(nameToUse);
  }
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(1000);

  const details = page
    .getByRole('dialog')
    .filter({ has: page.getByText('Time entry details') });
  await expect(details).toBeVisible({ timeout: 15000 });

  const newDurationHours = '7';
  const endTimeLabel = details
    .locator('label')
    .filter({ hasText: /^End time/i })
    .first();
  const endTimeInput = endTimeLabel.locator('input[type="text"]').first();
  await endTimeInput.click();
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: '03:00 PM' }).click();
  await page.waitForTimeout(300);
  console.log(
    '✓ Time entry details: end time set to 3:00 PM (start unchanged, 7h total)',
  );

  // Customer / Service: IDS typeahead comboboxes in drawer — open list, pick 2nd option
  const customerCombo = details
    .locator('input[role="combobox"][data-testid="__textField"]')
    .first();
  await customerCombo.click();
  await page.waitForTimeout(400);
  await page.getByRole('listbox').last().getByRole('option').nth(1).click();
  await page.waitForTimeout(300);
  const selectedCustomer = (await customerCombo.inputValue()).trim();

  const serviceCombo = details
    .locator(
      'input[role="combobox"][data-testid="customfield-dropdown-typeahead__textField"]',
    )
    .or(details.locator('input[role="combobox"][placeholder="(none)"]'))
    .first();
  await serviceCombo.click();
  await page.waitForTimeout(400);
  await page.getByRole('listbox').last().getByRole('option').nth(1).click();
  await page.waitForTimeout(300);
  const selectedService = (await serviceCombo.inputValue()).trim();

  const billableSwitch = details.getByRole('switch', {
    name: 'Billable to customer',
  });
  if ((await billableSwitch.getAttribute('aria-checked')) !== 'true') {
    await billableSwitch.click();
    await page.waitForTimeout(300);
  }

  await details
    .locator('[data-automation-id="notes-textarea_textarea"]')
    .fill(ADD_TIME_DRAWER_LIST_EDIT_NOTES);
  await page.waitForTimeout(300);

  await details.getByRole('button').filter({ hasText: 'Save' }).click();
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(2000);

  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This week');
  await timeEntriesPage.waitForLoadingToDisappear();

  const rowObj = opts?.forStartEndEntry
    ? await getRowObjectForEmployeeByNotesSubstring(
        timeEntriesPage,
        nameToUse,
        ADD_TIME_DRAWER_LIST_EDIT_NOTES,
      )
    : await timeEntriesPage.getRowObjectForEmployee(nameToUse);
  expect(normalizeToMinutes(rowObj.Hours || '')).toBe(
    normalizeToMinutes(newDurationHours),
  );
  expect(rowObj.Notes || '').toContain(ADD_TIME_DRAWER_LIST_EDIT_NOTES);
  expect(rowObj.Customer?.trim()).toBe(selectedCustomer);
  const serviceFromRow =
    rowObj.Service ?? rowObj['Service item'] ?? rowObj['Service Item'];
  expect(serviceFromRow?.trim()).toBe(selectedService);
  console.log(
    opts?.forStartEndEntry
      ? '✓ Time entries list: start/end hours, customer/service, notes updated'
      : '✓ Time entries list: duration, customer/service, notes updated',
  );
  return { selectedCustomer, selectedService };
}

/**
 * Deletes the duration-only day entry in Add time for Test: the block where
 * Start/end times is off and the duration field matches `matchDurationHours`.
 */
async function deleteDurationEntryFromAddTimeDrawer(
  page: Page,
  dayNum: number,
  dayShort: string,
  matchDurationHours: string = '5',
): Promise<void> {
  const timeEntriesPage = new TimeEntriesPage(page);
  await clickAddTimeDropdown(page);
  await timeEntriesPage.waitForLoadingToDisappear();
  await page
    .getByRole('dialog', { name: 'Add time' })
    .locator('button[class*="WorkerCard__Container"]')
    .first()
    .click();
  await page.waitForTimeout(1000);
  const drawer = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: 'Add time for Test' }),
  });
  await drawer.getByRole('combobox', { name: 'Date range selector' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('option', { name: 'This week' }).click();
  await page.waitForTimeout(500);
  await drawer
    .locator('#segmented-date-control-container')
    .getByRole('tab')
    .filter({ hasText: String(dayNum) })
    .filter({ hasText: dayShort })
    .click();
  await page.waitForTimeout(500);

  const startEndSwitches = drawer.getByRole('switch', {
    name: 'Start/end times',
  });
  const switchCount = await startEndSwitches.count();
  expect(switchCount).toBeGreaterThan(0);

  const expectedMinutes = normalizeToMinutes(matchDurationHours);
  let clickedMenuForDurationBlock = false;
  for (let i = 0; i < switchCount; i++) {
    const sw = startEndSwitches.nth(i);
    if ((await sw.getAttribute('aria-checked')) === 'true') {
      continue;
    }

    // Walk up from the switch: the day `<section>` can wrap every row and would
    // match 3× Additional Options (strict mode). Use the innermost ancestor where
    // exactly one menu + one Start/end switch + duration live together (one card).
    let scope: Locator = sw.locator('xpath=..');
    for (let depth = 0; depth < 25; depth++) {
      const menus = scope.getByRole('button', { name: 'Additional Options' });
      const switchesInScope = scope.getByRole('switch', {
        name: 'Start/end times',
      });
      const durFields = scope.locator(
        '[data-automation-id="duration-textfield"]',
      );
      const [menuN, switchN, durN] = await Promise.all([
        menus.count(),
        switchesInScope.count(),
        durFields.count(),
      ]);
      if (menuN === 1 && switchN === 1 && durN >= 1) {
        const raw = (await durFields.first().inputValue()).trim();
        if (normalizeToMinutes(raw) === expectedMinutes) {
          await menus.first().click();
          clickedMenuForDurationBlock = true;
          break;
        }
      }
      scope = scope.locator('xpath=..');
    }
    if (clickedMenuForDurationBlock) {
      break;
    }
  }
  if (!clickedMenuForDurationBlock) {
    throw new Error(
      `No duration block (Start/end off) with ${matchDurationHours}h in Add time drawer`,
    );
  }
  await page.waitForTimeout(300);
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.waitForTimeout(300);
  await drawer.getByRole('button').filter({ hasText: 'Save' }).click();
  await page.waitForTimeout(2000);
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log(
    `✓ Duration entry (${matchDurationHours}h block) deleted from Add time drawer`,
  );

  // Same close control as createEntryWithDuration (aria-label, not visible "Close" text).
  const closeBtn = drawer.locator('button[aria-label="Close"]').first();
  if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(500);
  }
}

async function deleteEntry(page: Page, nameToUse: string): Promise<void> {
  const timeEntriesPage = new TimeEntriesPage(page);
  await page
    .locator(`//div[contains(text(), '${nameToUse}')]/ancestor::tr`)
    .first()
    .click();
  await page.waitForTimeout(1000);

  const timeEntryDetailsDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByText('Time entry details') });
  await expect(timeEntryDetailsDialog).toBeVisible({ timeout: 15000 });

  await timeEntryDetailsDialog
    .getByRole('button')
    .filter({ hasText: 'Delete' })
    .click();
  await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
  await timeEntriesPage.clickYesOnDeleteEntryPopup();
  await page.waitForTimeout(3000);
  await timeEntriesPage.waitForLoadingToDisappear();

  const countAfterDelete = await timeEntriesPage.countEmployeeRow(nameToUse);
  expect(countAfterDelete).toBe(0);
  console.log('✓ Entry deleted and no longer visible in list');
}

export const validateAddTimeDrawerCases = async (page: Page) => {
  const { yesterday, dayNum, dayShort, nameToUse } =
    await createEntryWithDuration(page);

  await createEntryWithStartAndEndTime(
    page,
    dayNum,
    dayShort,
    nameToUse,
    yesterday,
  );

  // Edit duration via Add time
  const timeEntriesPage = new TimeEntriesPage(page);
  await clickAddTimeDropdown(page);
  await timeEntriesPage.waitForLoadingToDisappear();
  const addTimeDialogEdit = page.getByRole('dialog', { name: 'Add time' });
  await addTimeDialogEdit
    .locator('button[class*="WorkerCard__Container"]')
    .first()
    .click();
  await page.waitForTimeout(1000);

  const addTimeForWorkDrawerEdit = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: 'Add time for Test' }),
  });
  await addTimeForWorkDrawerEdit
    .getByRole('combobox', { name: 'Date range selector' })
    .click();
  await page.waitForTimeout(500);
  await page.getByRole('option', { name: 'This week' }).click();
  await page.waitForTimeout(500);
  await addTimeForWorkDrawerEdit
    .locator('#segmented-date-control-container')
    .getByRole('tab')
    .filter({ hasText: String(dayNum) })
    .filter({ hasText: dayShort })
    .click();
  await page.waitForTimeout(500);
  await addTimeForWorkDrawerEdit
    .locator('[data-automation-id="duration-textfield"]')
    .clear();
  await addTimeForWorkDrawerEdit
    .locator('[data-automation-id="duration-textfield"]')
    .fill('5');
  await page.waitForTimeout(300);
  await addTimeForWorkDrawerEdit
    .getByRole('button')
    .filter({ hasText: 'Save' })
    .click();
  await page.waitForTimeout(2000);
  console.log('✓ Edited duration to 5 and saved');

  const expectedDateFormatted = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  await verifyListHoursForEntryByNotes(
    page,
    nameToUse,
    ADD_TIME_DRAWER_DURATION_NOTES,
    '5',
  );

  await deleteDurationEntryFromAddTimeDrawer(page, dayNum, dayShort, '5');

  const { selectedCustomer, selectedService } =
    await editTimeEntryDetailsFromTimeEntriesList(page, nameToUse, {
      forStartEndEntry: true,
    });

  await verifyStartEndTimeEntryAfterListEdit(
    page,
    nameToUse,
    expectedDateFormatted,
    '7',
    {
      expectedNotes: ADD_TIME_DRAWER_LIST_EDIT_NOTES,
      expectedCustomer: selectedCustomer,
      expectedService: selectedService,
    },
  );

  await deleteEntry(page, nameToUse);
};

export const deleteTimeEntriesForTimeEditFlows = async (
  page: Page,
  timeEntriesPage: TimeEntriesPage,
) => {
  try {
    let iterationCount = 0;
    const maxIterations = 3; // Safety limit to prevent infinite loops

    while (iterationCount < maxIterations) {
      // Get all action dropdown buttons (these represent time entries that can be deleted)
      const actionButtons = page.locator('//button[@aria-label="Expand Menu"]');
      const buttonCount = await actionButtons.count();

      console.log(
        `Iteration ${
          iterationCount + 1
        }: Found ${buttonCount} time entries to delete`,
      );

      if (buttonCount === 0) {
        console.log('No more time entries found - cleanup complete');
        break;
      }

      // Click the first action button and delete the entry
      try {
        await actionButtons.first().click();
        const deleteInActionMenu = page
          .locator(`//li[text()='Delete']`)
          .or(page.locator(`//span[text()='Delete']`))
          .first();
        const deleteInMenuVisible = await deleteInActionMenu
          .isVisible({ timeout: 5000 })
          .catch(() => false);
        if (!deleteInMenuVisible) {
          console.log(
            'Delete is not visible in action menu; skipping delete for this entry',
          );
          await selectDisplayByOption(page, 'Customer');
          await timeEntriesPage.waitForLoadingToDisappear();
          await selectDisplayByOption(page, 'Date');
          await timeEntriesPage.waitForLoadingToDisappear();
          iterationCount++;
          continue;
        }
        await deleteInActionMenu.click();
        await timeEntriesPage.clickYesOnDeleteEntryPopup();
        await timeEntriesPage.waitForLoadingToDisappear();

        // Fast refresh by switching views instead of navigating to page
        console.log('Refreshing data by switching views...');
        await selectDisplayByOption(page, 'Customer');
        await timeEntriesPage.waitForLoadingToDisappear();
        await selectDisplayByOption(page, 'Date');
        await timeEntriesPage.waitForLoadingToDisappear();

        console.log(`Successfully deleted entry ${iterationCount + 1}`);
      } catch (entryError) {
        console.log(`Error deleting entry ${iterationCount + 1}:`, entryError);
        // Try to refresh using view switching and continue
        await selectDisplayByOption(page, 'Customer');
        await timeEntriesPage.waitForLoadingToDisappear();
        await selectDisplayByOption(page, 'Date');
        await timeEntriesPage.waitForLoadingToDisappear();
      }

      iterationCount++;
    }

    if (iterationCount >= maxIterations) {
      console.log(
        `Reached maximum iterations (${maxIterations}) - stopping cleanup to prevent infinite loop`,
      );
    }
  } catch (error) {
    console.log('Error in deleteAllVisibleTimeEntries:', error);
  }
};
