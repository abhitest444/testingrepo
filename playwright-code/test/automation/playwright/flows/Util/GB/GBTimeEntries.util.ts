import { Page, expect } from '@playwright/test';
import SingleTimeEntryPage from '../../../pages/GB/GBSingleTimeEntryPage';
import TimeEntriesPage from '../../../pages/GB/GBTimeEntriesPage';
import SingleTimeActivityPage, {
  OIGQL_URL_PATTERN,
  matchTimeEntryBatchSaveResponse,
  waitForResponseWithURLandBody,
} from '../../../pages/SingleTimeActivityPage';
import { LABELS } from '../../../utils';
import { LABELS as CONSTANTS } from '../../../constants';
import * as commonLocator from '../../../commonUtils';
import {
  selectDisplayByOption,
  getDisplayByDropdown,
  openDateRangeDropdown,
  selectDateRangeOption,
  clickAddTimeDropdown,
  selectSingleTimeEntryFromAddTime,
  normalizeToMinutes,
  normalizeName,
} from '../../../commonUtils';
import { fillSingleTAFields } from '../SingleTimeActivityCRUD.util';
import { BreaksRulesPage } from '../../../pages/GB/GBBreaksRulesPage';
import * as weeklyTimeEntryPage from '../../../pages/WeeklyTimeEntryPage';

const DEFAULT_STE_EMPLOYEE_DISPLAY_NAME = 'Test AAA';

export type AddEditViewSteOptions = {
  steEmployeeDisplayName?: string;
  teamMemberTypeLabel?: string;
  qboUserRowMainLabelContains?: string;
};

export const addEditViewSte = async (
  page: Page,
  options?: AddEditViewSteOptions,
) => {
  const teamMemberTypeLabel = options?.teamMemberTypeLabel?.trim();
  const steEmployeeDisplayName =
    options?.steEmployeeDisplayName ?? DEFAULT_STE_EMPLOYEE_DISPLAY_NAME;

  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  // const commonLocator = new CommonLocators(page);

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

  // Ensure no previous entries for the test employee
  const empRows = await timeEntriesPage.getAllRowsForAnEmployee('AAA, Test');
  let count = await empRows.count();
  while (count > 0) {
    await timeEntriesPage.clickActionDropdownForEmployee('AAA, Test');
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();
    count = await timeEntriesPage.countEmployeeRow('AAA, Test');
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.waitForTableOrNoEntriesMessage();
    count = await timeEntriesPage.countEmployeeRow('AAA, Test');
  }

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
  const formattedDate = today.toLocaleDateString('en-GB', {
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

  await singleTimeEntryPage.openDropdown('Service');
  await page.waitForTimeout(500);
  await singleTimeEntryPage.clickDropdownOption(1, 'Service');
  const serviceValue = await singleTimeEntryPage.getFieldValue('Service');

  if (await singleTimeEntryPage.checkFieldVisibility('Billable (per hour)')) {
    await singleTimeEntryPage.checkCheckboxIfVisible('Billable (per hour)');
    await singleTimeEntryPage.fillBillRateInput('5.00');
  }

  await singleTimeEntryPage.openDropdown('Class');
  await singleTimeEntryPage.clickDropdownOption(1, 'Class');

  if (await singleTimeEntryPage.checkFieldVisibility('Department')) {
    await singleTimeEntryPage.openDropdown('Department');
    await singleTimeEntryPage.clickDropdownOption(1, 'Department');
  }

  if (await singleTimeEntryPage.checkFieldVisibility('Location')) {
    await singleTimeEntryPage.openDropdown('Location');
    await singleTimeEntryPage.clickDropdownOption(1, 'Location');
  }

  // Save the entry
  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await timeEntriesPage.waitForLoadingToDisappear();

  // Validate in Date view
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await timeEntriesPage.validateDateWiseDataVisible();
  const dateViewRowObj = await timeEntriesPage.getRowObjectForAnyEmployeeName([
    'AAA, Test',
    'Test AAA',
  ]);
  await expect(normalizeToMinutes(dateViewRowObj.Hours || '')).toBe(
    normalizeToMinutes(durationValue || ''),
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
  const customerViewRowObj =
    await timeEntriesPage.getRowObjectForAnyEmployeeName([
      'AAA, Test',
      'Test AAA',
    ]);
  await expect(normalizeToMinutes(dateViewRowObj.Hours || '')).toBe(
    normalizeToMinutes(durationValue || ''),
  );
  await expect(normalizeName(dateViewRowObj.Name || '')).toBe(
    normalizeName(nameValue || ''),
  );
  await expect(customerViewRowObj.Service).toBe(serviceValue);
  await expect(customerViewRowObj.Notes).toContain(notesValue);
  await page.getByRole('button', { name: 'Go back' }).click();
  await timeEntriesPage.waitForLoadingToDisappear();

  //note: Employee view is not available anymore and is replaced by Approvals tab
  // // Validate in Employee view
  // await selectDisplayByOption(page, 'Employee');
  // await timeEntriesPage.waitForLoadingToDisappear();
  // await timeEntriesPage.clickEmployeeName();
  // await timeEntriesPage.validateDateWiseDataVisible();
  // const employeeViewRowObj =
  //   await timeEntriesPage.getRowObjectForEmployeeDetaisView();

  // await expect(normalizeToMinutes(dateViewRowObj.Hours || '')).toBe(
  //   normalizeToMinutes(durationValue || ''),
  // );
  // await expect(employeeViewRowObj.Customer).toBe(customerValue);
  // await expect(employeeViewRowObj.Service).toBe(serviceValue);
  // await expect(employeeViewRowObj.Notes).toContain(notesValue);
  // await page.getByRole('button', { name: 'Back to summaries' }).click();

  // Switch back to Date view for editing
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Edit the entry
  await timeEntriesPage.clickEditForEmployee();
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
  const editedDateViewRowObj =
    await timeEntriesPage.getRowObjectForAnyEmployeeName([
      'AAA, Test',
      'Test AAA',
    ]);
  await expect(normalizeToMinutes(editedDateViewRowObj.Hours || '')).toBe(
    normalizeToMinutes(editedDurationValue || ''),
  );
  await expect(editedDateViewRowObj.Customer).toBe(editedCustomerValue);
  await expect(editedDateViewRowObj.Notes).toContain(editedNotesValue);

  //   // Delete the entry
  //   await timeEntriesPage.clickActionDropdownForEmployee('Emp1, Test');
  //   await timeEntriesPage.clickDeleteInActionDropdown();
  //   await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
  //   await timeEntriesPage.clickYesOnDeleteEntryPopup();
  //   await timeEntriesPage.waitForLoadingToDisappear();
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
 * Deletes all break rules (both automatic and manual) from the Breaks section
 * in Account and Settings -> Time -> Breaks
 *
 * @param page - Playwright Page object
 * @returns Promise<void>
 *
 * @example
 * // Use this method to clean up all breaks before or after tests
 * await deleteAllBreakRules(page);
 */
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
        await actionButtons.first().click();
        await timeEntriesPage.clickDeleteInActionDropdown();
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

export const addSTAWithYesterdayDate = async (page: Page, role?: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // Navigate to Single Time Activity page
  await singleTimeActPage.navigateToSingleTime();
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.handleTourModal();

  // Get yesterday's date in MM/DD/YYYY format
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-GB', {
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
  const currentDateFormatted = currentDate.toLocaleDateString('en-GB', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-GB', {
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
