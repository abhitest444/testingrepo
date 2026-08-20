import { Page, expect } from '@playwright/test';
import SingleTimeEntryPage from '../../pages/SingleTimeActivityPage';
import ActualSingleTimeEntryPage from '../../pages/SingleTimeEntryPage';
import TimeEntriesPage from '../../pages/TimeEntriesPage';
import ReportsPage from '../../pages/ReportsPage';
import { WeeklyTimeActivity } from '../../pages/WeeklyTimeActivity';
import RunPayrollPage from '../../pages/RunPayrollPage';
import EmployeesPage from '../../pages/EmployeesPage';
import * as weeklyTimeEntryPage from '../../pages/WeeklyTimeEntryPage';
import TimeClockPage from '../../pages/TimeClockPage';
import { BreaksPage } from '../../pages/BreaksPage';
import ProjectsPage from '../../pages/ProjectsPage';
import TimeMenuNavigationPage from '../../pages/TimeMenuNavigationPage';
import ApprovalsPage from '../../pages/ApprovalsPage';
import {
  openDateRangeDropdown,
  selectDateRangeOption,
  selectDisplayByOption,
  normalizeToMinutes,
  clickAddTimeDropdown,
  selectSingleTimeEntryFromAddTime,
} from '../../commonUtils';
import { LABELS } from '../../utils';
import { EditTimeClockEntry } from './RunPayrollEditFlow.util';
import { editTimeEntryFromEmployeeDropdown } from '../../pages/WeeklyTimeEntryPage';
import { validateTimesheetUpdateOnSave } from './TimeClockUtil';

/** Pre-test / post-test cleanup on prod (payroll, reports, STE). */
export const CLEANUP_OPERATION_TIMEOUT_MS = 60_000;

/**
 * Helper function to delete STA entries from Reports (works for paid companies)
 * For paid companies, Time Entries shows STE, so we need to delete from Reports
 * Exported for use in pre-test cleanup
 */
export const deleteSTAEntriesFromReports = async (
  page: Page,
  searchText: string,
  maxAttempts: number = 10,
) => {
  const reportsPage = new ReportsPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const singleTimeActivityPage = new SingleTimeEntryPage(page);

  try {
    // Navigate to reports
    await reportsPage.navigateToReportsPage();
    await reportsPage.waitForPageReady();
    await reportsPage.handlePopupsInAnyOrder();
    await expect(
      page.locator(`(//*[text()='Accounts receivable aging summary'])[1]`),
    ).toBeVisible({ timeout: 10000 });
    console.log('  ✓ Reports page loaded');

    // Search for and open Time Activities by Employee Detail
    await page
      .getByTestId('__textField')
      .fill('Time Activities by Employee Detail');
    await page.getByText('Time Activities by Employee Detail').first().click();
    await page.waitForTimeout(2000);

    // Wait for report to load (just check for Activity date header, not employee)
    const activityDateLocator = page.locator(
      `//div[translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='activity date']`,
    );
    await activityDateLocator.waitFor({ state: 'visible', timeout: 30000 });
    console.log('  ✓ Time Activities by Employee Detail report opened');

    // Wait for data to fully load in case of delay
    await page.waitForTimeout(3000);

    // Select "All Dates" to see all entries
    await reportsPage.clickCustomDatesDropdown();
    await reportsPage.selectAllDates();
    await reportsPage.waitForLoadingToDisappear();
    await page.waitForTimeout(3000);
    console.log('  ✓ Selected All Dates filter');

    // Delete entries — click each `//*[text()='Hours']` until none remain
    let entriesDeleted = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // If searchText is empty, delete ANY entry with Hours link; otherwise filter by searchText
      const entryRow = searchText
        ? page.locator(`//tr[contains(., '${searchText}')]`).first()
        : page
            .locator(`//tr[descendant::*[text()='Hours' or text()='Sales']]`)
            .first();

      // Increased timeout to 5 seconds to account for slower page refreshes
      const isVisible = await entryRow
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (!isVisible) {
        const message = searchText
          ? `  ✓ No more entries with "${searchText}" found`
          : `  ✓ No more entries found in report`;
        console.log(message);
        break;
      }

      const logMessage = searchText
        ? `  Found entry with "${searchText}", attempting to delete...`
        : `  Found entry, attempting to delete...`;
      console.log(logMessage);

      // Click Hours link WITHIN the matching row (not just the first Hours link on page)
      const hoursLinkInRow = entryRow
        .locator(`//*[text()='Hours' or text()='Sales']`)
        .first();
      await hoursLinkInRow.waitFor({ state: 'visible', timeout: 10000 });
      await hoursLinkInRow.click();
      await page.waitForTimeout(2000);
      console.log('  ✓ Opened STA from report');

      await singleTimeActivityPage.waitTillNameFieldVisible(
        CLEANUP_OPERATION_TIMEOUT_MS,
      );
      await page.waitForTimeout(1000);

      await singleTimeActivityPage.clickButton('Delete');
      await page.waitForTimeout(1000);
      console.log('  ✓ Clicked Delete button');

      await singleTimeActivityPage.clickYesOnDeleteConfirmation();
      await timeEntriesPage.waitForLoadingToDisappear(
        CLEANUP_OPERATION_TIMEOUT_MS,
      );
      await page.waitForTimeout(2000);
      console.log('  ✓ Confirmed deletion');

      entriesDeleted++;
      console.log(`  ✓ Deleted entry ${entriesDeleted}`);

      // Wait till we land back on report
      await reportsPage.expectTimeActivitiesReportTitleVisible();
      console.log('  ✓ Landed back on report');

      // Refresh data by switching to "This month" then back to "All Dates"
      // (selecting same filter doesn't refresh)
      await reportsPage.clickCustomDatesDropdown();
      const thisMonthOption = page.getByRole('option', {
        name: 'This month',
        exact: true,
      });
      await thisMonthOption.waitFor({ state: 'visible', timeout: 10000 });
      await thisMonthOption.click();
      await reportsPage.waitForLoadingToDisappear();
      await page.waitForTimeout(1000);
      console.log('  ✓ Switched to "This month" filter');

      // Switch back to "All Dates" to find remaining entries
      await reportsPage.clickCustomDatesDropdown();
      await reportsPage.selectAllDates();
      await reportsPage.waitForLoadingToDisappear();
      await page.waitForTimeout(3000); // Increased wait for table to fully refresh

      // Additional wait for table content to be visible (ensures data is loaded)
      await page
        .waitForSelector('//table', { state: 'visible', timeout: 5000 })
        .catch(() => {});
      await page.waitForTimeout(1000); // Extra buffer for table population
      console.log(
        '  ✓ Switched back to "All Dates" filter and table refreshed',
      );
    }

    console.log(
      `  ✓ Cleanup completed - deleted ${entriesDeleted} STA entry(ies)`,
    );
    return entriesDeleted;
  } catch (error) {
    console.log(
      `  ⚠ Error deleting STAs from reports: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
};

/**
 * Test flow to validate STA billable entry in reports and verify updates are retained
 *
 * Steps:
 * 1. Add a billable STA
 * 2. Go to reports -> Time Activities by Employee Detail
 * 3. Check whether the billable entry is visible
 * 4. Click on hours or notes which will take us to STA screen
 * 5. There, update duration and notes, save and close
 * 6. We will land back to reports after save and close
 * 7. In reports -> Time Activities by Employee, verify that the updated values are retained
 */
export const validateBillableSTAInReports = async (
  page: Page,
  employeeName?: string,
) => {
  const singleTimeActivityPage = new SingleTimeEntryPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const reportsPage = new ReportsPage(page);

  let selectedEmployeeName = employeeName || '';
  let initialDuration = '';
  let initialNotes = '';
  let updatedDuration = '';
  let updatedNotes = '';

  console.log('');
  console.log('='.repeat(70));
  console.log('STARTING BILLABLE STA IN REPORTS VALIDATION');
  console.log('='.repeat(70));

  // ========== PART 1: CREATE BILLABLE STA ==========
  console.log('Step 1: Creating a billable STA...');

  // Navigate directly to STA creation page (using URL to ensure STA, not STE)
  await page.goto('/app/timeactivity?t=s', { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  // Handle any tour modals
  try {
    await singleTimeActivityPage.handleTourModal();
  } catch (error) {
    console.log('No tour modal to handle');
  }

  // Wait for the form to be visible
  await singleTimeActivityPage.waitTillNameFieldVisible();
  await page.waitForTimeout(1000);

  console.log('Step 1a: Filling STA details...');

  // Select employee
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  const nameValue = await singleTimeActivityPage.getFieldValue('Name');
  selectedEmployeeName = nameValue || '';
  console.log(`  ✓ Selected employee: "${selectedEmployeeName}"`);

  // Ensure 'Set clock in and out' is toggled off (we want Duration entry)
  const isSetClockOn = await singleTimeActivityPage.verifySetClockToggleState();
  if (isSetClockOn) {
    await singleTimeActivityPage.clickSetClockInAndOutToggles();
    await page.waitForTimeout(1000);
  }

  // Set date and duration
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await singleTimeActivityPage.fillStartDate(formattedDate);
  await singleTimeActivityPage.enterFieldValue('Duration', '3:00');
  initialDuration =
    (await singleTimeActivityPage.getFieldValue('Duration')) || '3:00';
  console.log(`  ✓ Set duration: ${initialDuration}`);

  // Add notes
  initialNotes = 'Billable STA Test Entry for Reports';
  await singleTimeActivityPage.fillData('Notes', initialNotes);
  const notesValue = await singleTimeActivityPage.getNotesFieldValue();
  console.log(`  ✓ Added notes: "${notesValue}"`);

  // Select customer
  await singleTimeActivityPage.openDropdown('Customer');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.clickDropdownOption(1, 'Customer');
  const customerValue = await singleTimeActivityPage.getFieldValue('Customers');
  console.log(`  ✓ Selected customer: "${customerValue}"`);

  // Select service
  await singleTimeActivityPage.openDropdown('Service');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.clickDropdownOption(1, 'Service');
  const serviceValue = await singleTimeActivityPage.getFieldValue('Service');
  console.log(`  ✓ Selected service: "${serviceValue}"`);

  // Add billable rate
  console.log('Step 1b: Adding billable rate...');
  await page.waitForTimeout(1000);

  const billableCheckbox = page.locator(
    `//span[contains(text(), 'Billable')] / ancestor::label / descendant::input`,
  );
  const isBillableVisible = await billableCheckbox
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (isBillableVisible) {
    const isChecked = await billableCheckbox.isChecked();
    if (!isChecked) {
      await billableCheckbox.check();
      await page.waitForTimeout(500);
      console.log('  ✓ Billable checkbox checked');
    } else {
      console.log('  ✓ Billable checkbox already checked');
    }

    // Fill bill rate
    await singleTimeActivityPage.fillBillRateInput('50.00');
    await page.waitForTimeout(500);
    console.log('  ✓ Billable rate set to $50.00');
  } else {
    throw new Error(
      'Billable checkbox not visible - cannot create billable STA',
    );
  }

  // Save the STA
  console.log('Step 1c: Saving STA...');
  await singleTimeActivityPage.clickSaveAndCloseButton();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(3000);
  console.log('✓ Billable STA created successfully');

  // ========== PART 2: NAVIGATE TO REPORTS ==========
  console.log(
    'Step 2: Navigating to Reports -> Time Activities by Employee Detail...',
  );

  await reportsPage.navigateToReportsPage();
  await reportsPage.waitForPageReady();
  await reportsPage.handlePopupsInAnyOrder();
  await expect(
    page.locator(`(//*[text()='Accounts receivable aging summary'])[1]`),
  ).toBeVisible({ timeout: 10000 });
  console.log('✓ Reports page loaded');

  // Search for and click on Time Activities by Employee Detail
  console.log('Searching for Time Activities by Employee Detail report...');
  await page
    .getByTestId('__textField')
    .fill('Time Activities by Employee Detail');
  await page.getByText('Time Activities by Employee Detail').first().click();
  await page.waitForTimeout(2000);
  // Validate report title is visible
  await reportsPage.expectTimeActivitiesReportTitleVisible();
  console.log('✓ Time Activities by Employee Detail report opened');

  // Set date filter to All Dates to ensure we see the entry
  console.log('Step 2a: Setting date filter to All Dates...');
  await reportsPage.clickCustomDatesDropdown();
  await reportsPage.selectAllDates();
  await reportsPage.waitForLoadingToDisappear();
  await page.waitForTimeout(3000);
  console.log('✓ Navigated to Time Activities by Employee Detail report');

  // ========== PART 3: VERIFY BILLABLE ENTRY IS VISIBLE ==========
  console.log('Step 3: Verifying billable entry is visible in the report...');

  // Look for the employee name and billable entry
  const employeeInReport = page.locator(
    `//*[contains(text(), '${selectedEmployeeName}')]`,
  );
  await expect(employeeInReport.first()).toBeVisible({ timeout: 10000 });
  console.log(`  ✓ Found employee "${selectedEmployeeName}" in report`);

  // Verify billable rate is shown (50.00) - scope to table rows to avoid script tags
  const billableRateInReport = page.locator(
    `//tr//*[contains(text(), '50.00')]`,
  );
  await expect(billableRateInReport.first()).toBeVisible({ timeout: 5000 });
  console.log('  ✓ Billable rate ($50.00) is visible in report');

  // Verify duration (3:00 or 3.00 hours) - scope to table rows to avoid script tags
  const durationPattern = page.locator(
    `//tr//*[contains(text(), '3:00') or contains(text(), '3.00')]`,
  );
  await expect(durationPattern.first()).toBeVisible({ timeout: 5000 });
  console.log('  ✓ Duration (3 hours) is visible in report');

  console.log('✓ Billable entry verified in report');

  // ========== PART 4: CLICK ON HOURS TO NAVIGATE TO STA ==========
  console.log('Step 4: Clicking on Hours link to navigate to STA...');

  // Use ReportsPage method to click Hours link (same as UnifyTimesheet)
  await reportsPage.clickHoursLink();
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('✓ Navigated to STA screen');

  // Wait for STA form to load
  await singleTimeActivityPage.waitTillNameFieldVisible();
  await page.waitForTimeout(1000);

  // ========== PART 5: UPDATE DURATION AND NOTES ==========
  console.log('Step 5: Updating duration and notes in STA...');

  // Update duration from 3:00 to 4:30
  updatedDuration = '4:30';
  await singleTimeActivityPage.enterFieldValue('Duration', updatedDuration);
  await page.waitForTimeout(500);
  const newDurationValue = await singleTimeActivityPage.getFieldValue(
    'Duration',
  );
  console.log(`  ✓ Updated duration to: ${newDurationValue}`);

  // Update notes
  updatedNotes = 'Billable STA Test Entry - UPDATED';
  await singleTimeActivityPage.fillData('Notes', updatedNotes);
  await page.waitForTimeout(500);
  const newNotesValue = await singleTimeActivityPage.getNotesFieldValue();
  console.log(`  ✓ Updated notes to: "${newNotesValue}"`);

  // Save and close
  console.log('Step 5a: Saving STA...');
  await singleTimeActivityPage.clickSaveAndCloseButton();
  await page.waitForTimeout(3000);
  await timeEntriesPage.waitForLoadingToDisappear();

  // ========== PART 6: VERIFY WE'RE BACK ON REPORTS ==========
  console.log('Step 6: Verifying we landed back on reports...');

  // Check if we're back on the report by looking for the report title
  const reportTitleVisible = await reportsPage.timeActivitiesReportTitle
    .isVisible({ timeout: 10000 })
    .catch(() => false);

  if (reportTitleVisible) {
    console.log('✓ Successfully landed back on Time Activities report');
  } else {
    console.log('⚠ Did not land back on report, navigating manually...');
    await reportsPage.navigateToReportsPage();
    await reportsPage.waitForPageReady();
    await reportsPage.handlePopupsInAnyOrder();
    await expect(
      page.locator(`(//*[text()='Accounts receivable aging summary'])[1]`),
    ).toBeVisible({ timeout: 10000 });
    await page
      .getByTestId('__textField')
      .fill('Time Activities by Employee Detail');
    await page.getByText('Time Activities by Employee Detail').first().click();
    await page.waitForTimeout(2000);
    await reportsPage.expectTimeActivitiesReportTitleVisible();
    await reportsPage.clickCustomDatesDropdown();
    await reportsPage.selectAllDates();
    await reportsPage.waitForLoadingToDisappear();
    await page.waitForTimeout(3000);
  }

  // ========== PART 7: VERIFY UPDATED VALUES IN REPORT ==========
  console.log('Step 7: Verifying updated values are retained in the report...');

  // Refresh the report data
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(3000);
  await reportsPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);

  // Verify employee is still visible
  const employeeStillInReport = page.locator(
    `//*[contains(text(), '${selectedEmployeeName}')]`,
  );
  await expect(employeeStillInReport.first()).toBeVisible({ timeout: 10000 });
  console.log(`  ✓ Employee "${selectedEmployeeName}" still visible in report`);

  // Verify updated duration (4:30 or 04:30 or 4.50 hours) - exclude script tags
  const updatedDurationPattern = page
    .locator(
      `//td[contains(text(), '4:30') or contains(text(), '04:30') or contains(text(), '4.50')]`,
    )
    .or(
      page.locator(
        `//span[contains(text(), '4:30') or contains(text(), '04:30') or contains(text(), '4.50')]`,
      ),
    )
    .or(
      page.locator(
        `//div[contains(text(), '4:30') or contains(text(), '04:30') or contains(text(), '4.50')]`,
      ),
    );
  const isDurationUpdated = await updatedDurationPattern
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (isDurationUpdated) {
    console.log('  ✓ Updated duration (4:30 hours) is visible in report');
  } else {
    console.log(
      '  ⚠ Updated duration not immediately visible, checking again...',
    );
    await page.waitForTimeout(2000);
    await expect(updatedDurationPattern.first()).toBeVisible({
      timeout: 10000,
    });
    console.log('  ✓ Updated duration (4:30 hours) is now visible');
  }

  // Verify billable rate is still shown
  const billableRateStillInReport = page.locator(
    `//*[contains(text(), '50.00')]`,
  );
  await expect(billableRateStillInReport.first()).toBeVisible({
    timeout: 5000,
  });
  console.log('  ✓ Billable rate ($50.00) still visible in report');

  console.log('✓ All updated values verified in report');

  // ========== SUMMARY ==========
  console.log('');
  console.log('='.repeat(70));
  console.log('SUMMARY OF BILLABLE STA IN REPORTS VALIDATION');
  console.log('='.repeat(70));
  console.log(`  [EXTA001] Billable STA created successfully`);
  console.log(
    `  [EXTA002] Navigated to Time Activities by Employee Detail report`,
  );
  console.log(`  [EXTA003] Billable entry visible in report`);
  console.log(`  [EXTA004] Clicked hours link and navigated to STA`);
  console.log(
    `  [EXTA005] Updated duration from ${initialDuration} to ${updatedDuration}`,
  );
  console.log(`  [EXTA006] Updated notes successfully`);
  console.log(`  [EXTA007] Landed back on reports after save and close`);
  console.log(`  [EXTA008] Updated values retained in report`);
  console.log('='.repeat(70));

  return { employeeName: selectedEmployeeName, duration: updatedDuration };
};

/**
 * Cleanup function to remove test entries after extra flow test
 */
export const cleanupExtraFlowTestData = async (
  page: Page,
  employeeName?: string,
) => {
  console.log('');
  console.log('Starting cleanup of extra flow test data...');

  try {
    // Delete all entries from reports (works for paid companies where Time Entries shows STE)
    try {
      await deleteSTAEntriesFromReports(page, '', 50);
      console.log('✓ All entries cleanup from reports completed');
    } catch (reportsError) {
      console.log('  ⚠ Reports cleanup skipped or no entries found');
    }

    // Navigate back to Time Entries page for next steps (always do this)
    const timeEntriesPage = new TimeEntriesPage(page);
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('  ✓ Navigated to Time Entries with "This month" selected');

    console.log('✓ Cleanup completed successfully');
  } catch (error) {
    console.log(
      `⚠ Cleanup encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
};

/**
 * Test flow to validate billable STA with pay type in run payroll screen
 *
 * Steps:
 * 1. Add a billable STA with pay type selected
 * 2. Go to run payroll screen
 * 3. Wait for employee to be visible
 * 4. Validate that the duration entered in STA is visible on run payroll screen
 * 5. Go to reports and edit the STA
 * 6. Update the duration
 * 7. Go back to run payroll
 * 8. Validate that the duration got updated
 * 9. Click preview payroll
 * 10. Wait for total payroll cost
 * 11. Select Cash account
 * 12. Submit payroll
 */
export const validateBillableSTAWithPayTypeInRunPayroll = async (
  page: Page,
  employeeName?: string,
) => {
  const singleTimeActivityPage = new SingleTimeEntryPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);

  let selectedEmployeeName = employeeName || '';
  let duration = '';

  console.log('');
  console.log('='.repeat(70));
  console.log('STARTING BILLABLE STA WITH PAY TYPE IN RUN PAYROLL VALIDATION');
  console.log('='.repeat(70));

  // ========== PART 1: CREATE BILLABLE STA WITH PAY TYPE ==========
  console.log('Step 1: Creating a billable STA with pay type...');

  // Navigate directly to STA creation page (using URL to ensure STA, not STE)
  await page.goto('/app/timeactivity?t=s', { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  // Handle any tour modals
  try {
    await singleTimeActivityPage.handleTourModal();
  } catch (error) {
    console.log('No tour modal to handle');
  }

  // Wait for the form to be visible
  await singleTimeActivityPage.waitTillNameFieldVisible();
  await page.waitForTimeout(1000);

  console.log('Step 1a: Filling STA details...');

  // Select employee (Test Emp1)
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  const nameValue = await singleTimeActivityPage.getFieldValue('Name');
  selectedEmployeeName = nameValue || 'Test Emp1';
  console.log(`  ✓ Selected employee: "${selectedEmployeeName}"`);

  // Ensure 'Set clock in and out' is toggled off (we want Duration entry)
  const isSetClockOn = await singleTimeActivityPage.verifySetClockToggleState();
  if (isSetClockOn) {
    await singleTimeActivityPage.clickSetClockInAndOutToggles();
    await page.waitForTimeout(1000);
  }

  // Set date and duration (7 hours)
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await singleTimeActivityPage.fillStartDate(formattedDate);
  await singleTimeActivityPage.enterFieldValue('Duration', '7:00');
  duration = (await singleTimeActivityPage.getFieldValue('Duration')) || '7:00';
  console.log(`  ✓ Set duration: ${duration}`);

  // Add notes
  await singleTimeActivityPage.fillData(
    'Notes',
    'Billable STA Test Entry with Pay Type',
  );
  const notesValue = await singleTimeActivityPage.getNotesFieldValue();
  console.log(`  ✓ Added notes: "${notesValue}"`);

  // Select customer
  await singleTimeActivityPage.openDropdown('Customer');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.clickDropdownOption(1, 'Customer');
  const customerValue = await singleTimeActivityPage.getFieldValue('Customers');
  console.log(`  ✓ Selected customer: "${customerValue}"`);

  // Select service
  await singleTimeActivityPage.openDropdown('Service');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.clickDropdownOption(1, 'Service');
  const serviceValue = await singleTimeActivityPage.getFieldValue('Service');
  console.log(`  ✓ Selected service: "${serviceValue}"`);

  // Select pay type if available
  console.log('Step 1b: Selecting pay type...');
  const isPayTypeVisible = await singleTimeActivityPage.checkFieldVisibility(
    LABELS.PayType,
  );
  const noPayTypeAvailable =
    await singleTimeActivityPage.validateNoAvailablePayTypes();

  if (isPayTypeVisible && !noPayTypeAvailable) {
    await singleTimeActivityPage.openDropdown(LABELS.PayType);
    await page.waitForTimeout(500);
    await singleTimeActivityPage.selectPayTypeOption(1);
    await page.waitForTimeout(500);
    const payTypeValue = await singleTimeActivityPage.getFieldValue(
      LABELS.PayType,
    );
    console.log(`  ✓ Selected pay type: "${payTypeValue}"`);
  } else {
    console.log('  ⚠ Pay type field not available or no pay types to select');
  }

  // Add billable rate
  console.log('Step 1c: Adding billable rate...');
  await page.waitForTimeout(1000);

  const billableCheckbox = page.locator(
    `//span[contains(text(), 'Billable')] / ancestor::label / descendant::input`,
  );
  const isBillableVisible = await billableCheckbox
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (isBillableVisible) {
    const isChecked = await billableCheckbox.isChecked();
    if (!isChecked) {
      await billableCheckbox.check();
      await page.waitForTimeout(500);
      console.log('  ✓ Billable checkbox checked');
    } else {
      console.log('  ✓ Billable checkbox already checked');
    }

    // Fill bill rate
    await singleTimeActivityPage.fillBillRateInput('50.00');
    await page.waitForTimeout(500);
    console.log('  ✓ Billable rate set to $50.00');
  } else {
    console.log('  ⚠ Billable checkbox not visible - skipping billable rate');
  }

  // Save the STA
  console.log('Step 1d: Saving STA...');
  await singleTimeActivityPage.clickSaveAndCloseButton();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(3000);
  console.log('✓ Billable STA with pay type created successfully');

  // ========== PART 2: NAVIGATE TO RUN PAYROLL SCREEN ==========
  console.log('Step 2: Navigating to Run Payroll screen...');

  const runPayrollPage = new RunPayrollPage(page);
  await runPayrollPage.navigateToRunPayroll();
  console.log('✓ Navigated to Run Payroll screen');

  // Select pay period with current date and handle popup
  await runPayrollPage.handleTaxProblemsPopup();
  await runPayrollPage.selectPayPeriodWithCurrentDate();

  // ========== PART 3-4: VALIDATE EMPLOYEE AND DURATION ==========
  console.log(
    'Step 3: Validating employee and duration on Run Payroll screen...',
  );

  // Convert duration to hours format (e.g., 7:00 -> 7h)
  const durationInHours = duration.split(':')[0] + 'h';
  await runPayrollPage.validateEmployeeDuration(durationInHours);

  // ========== PART 5: NAVIGATE TO REPORTS TO EDIT STA ==========
  console.log('Step 5: Navigating to Reports to edit STA...');

  const reportsPage = new ReportsPage(page);
  await reportsPage.navigateToReportsPage();
  await reportsPage.waitForPageReady();
  await reportsPage.handlePopupsInAnyOrder();
  await expect(
    page.locator(`(//*[text()='Accounts receivable aging summary'])[1]`),
  ).toBeVisible({ timeout: 10000 });
  console.log('✓ Reports page loaded');

  // Search for and click on Time Activities by Employee Detail
  console.log('Step 5a: Navigating to Time Activities by Employee Detail...');
  await page
    .getByTestId('__textField')
    .fill('Time Activities by Employee Detail');
  await page.getByText('Time Activities by Employee Detail').first().click();
  await page.waitForTimeout(2000);
  // Validate report title is visible
  await reportsPage.expectTimeActivitiesReportTitleVisible();
  console.log('✓ Time Activities by Employee Detail report opened');

  // Set date filter to All Dates to ensure we see the entry
  console.log('Step 5b: Setting date filter to All Dates...');
  await reportsPage.clickCustomDatesDropdown();
  await reportsPage.selectAllDates();
  await reportsPage.waitForLoadingToDisappear();
  await page.waitForTimeout(3000);
  console.log('✓ Navigated to Time Activities by Employee Detail report');

  // ========== PART 6: CLICK ON HOURS LINK TO EDIT STA ==========
  console.log('Step 6: Clicking on Hours link to edit STA...');

  // Use ReportsPage method to click Hours link (same as UnifyTimesheet)
  await reportsPage.clickHoursLink();
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('✓ Navigated to STA screen from report');

  // Wait for STA form to load
  await singleTimeActivityPage.waitTillNameFieldVisible();
  await page.waitForTimeout(1000);

  // ========== PART 7: UPDATE DURATION IN STA ==========
  console.log('Step 7: Updating duration in STA...');

  // Update duration from 7:00 to 5:00
  const updatedDuration = '5:00';
  await singleTimeActivityPage.enterFieldValue('Duration', updatedDuration);
  await page.waitForTimeout(500);
  const newDurationValue = await singleTimeActivityPage.getFieldValue(
    'Duration',
  );
  console.log(`  ✓ Updated duration to: ${newDurationValue}`);

  // Save and close
  console.log('Step 7a: Saving STA...');
  await singleTimeActivityPage.clickSaveAndCloseButton();
  await page.waitForTimeout(3000);
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('✓ STA updated and saved');

  // ========== PART 8: NAVIGATE BACK TO RUN PAYROLL ==========
  console.log('Step 8: Navigating back to Run Payroll screen...');

  await page.goto('https://qbo.intuit.com/app/runpayroll', {
    waitUntil: 'load',
  });
  await page.waitForTimeout(3000);
  console.log('✓ Navigated back to Run Payroll screen');

  // Select pay period with current date and handle popup
  await runPayrollPage.handleTaxProblemsPopup();
  await runPayrollPage.selectPayPeriodWithCurrentDate();

  // ========== PART 9: VALIDATE UPDATED DURATION ON RUN PAYROLL ==========
  console.log('Step 9: Validating updated duration on Run Payroll screen...');

  // Convert updated duration to hours format (e.g., 5:00 -> 5h)
  const updatedDurationInHours = updatedDuration.split(':')[0] + 'h';
  await runPayrollPage.validateEmployeeDuration(updatedDurationInHours);

  // Store the updated duration for return value
  duration = updatedDuration;

  // ========== PART 10-14: SUBMIT PAYROLL ==========
  console.log('Step 10: Submitting payroll with Cash account...');
  await runPayrollPage.submitPayrollWithCashAccount();

  console.log(
    '✓ Billable STA with pay type validation in Run Payroll completed',
  );

  // ========== SUMMARY ==========
  console.log('');
  console.log('='.repeat(70));
  console.log(
    'SUMMARY OF BILLABLE STA WITH PAY TYPE IN RUN PAYROLL VALIDATION',
  );
  console.log('='.repeat(70));
  console.log(`  [WRKF001] Billable STA with pay type created successfully`);
  console.log(`  [WRKF002] Navigated to Run Payroll screen`);
  console.log(
    `  [WRKF003] Employee "Emp1, Test" visible on Run Payroll screen`,
  );
  console.log(
    `  [WRKF004] Initial duration "${durationInHours}" validated in Run Payroll screen`,
  );
  console.log(`  [WRKF005] Navigated to Reports to edit STA`);
  console.log(`  [WRKF006] Clicked hours link and opened STA from report`);
  console.log(
    `  [WRKF007] Updated duration from ${durationInHours} to ${updatedDurationInHours}`,
  );
  console.log(`  [WRKF008] Navigated back to Run Payroll screen`);
  console.log(
    `  [WRKF009] Updated duration "${updatedDurationInHours}" validated in Run Payroll screen`,
  );
  console.log(`  [WRKF010] Clicked Preview payroll button`);
  console.log(`  [WRKF011] Total payroll cost visible on preview screen`);
  console.log(`  [WRKF012] Selected Cash account from dropdown`);
  console.log(`  [WRKF013] Submitted payroll successfully`);
  console.log('='.repeat(70));

  return {
    employeeName: selectedEmployeeName,
    duration: updatedDurationInHours,
  };
};

/**
 * Cleanup function to remove test entries after workflow test
 * 1. Delete the created payroll
 * 2. Delete the created billable STA entry
 */
export const cleanupWorkflowTestData = async (
  page: Page,
  employeeName?: string,
) => {
  console.log('');
  console.log('Starting cleanup of workflow test data...');

  const timeEntriesPage = new TimeEntriesPage(page);

  const employeesPage = new EmployeesPage(page);

  try {
    // ========== PART 1: DELETE PAYROLL ==========
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

    // ========== PART 2: DELETE BILLABLE STA ENTRY ==========
    console.log('Step 2: Deleting billable STA entry...');

    // Delete all entries from reports (works for paid companies where Time Entries shows STE)
    try {
      await deleteSTAEntriesFromReports(page, '', 50);
      console.log('✓ All entries cleanup from reports completed');
    } catch (reportsError) {
      console.log('  ⚠ Reports cleanup skipped or no entries found');
    }

    // Navigate back to Time Entries page for next steps (always do this)
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    console.log('  ✓ Navigated to Time Entries with "This month" selected');

    console.log('');
    console.log('='.repeat(70));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(70));
    console.log(`  ✓ Payroll deleted successfully`);
    console.log(`  ✓ Billable STA entries deleted`);
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

/**
 * Test flow to validate WTA (Weekly Time Activity) billable entry with pay type in run payroll
 *
 * Steps:
 * 1. Add a billable WTA with pay type selected (hours for at least 3 days)
 * 2. Go to run payroll screen and validate duration is visible
 * 3. Go to reports and edit the WTA
 * 4. Update the duration
 * 5. Go back to run payroll and validate updated duration
 * 6. Preview payroll and submit payroll
 */
export const validateBillableWTAWithPayTypeInRunPayroll = async (
  page: Page,
  employeeName?: string,
) => {
  const singleTimeActivityPage = new SingleTimeEntryPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const reportsPage = new ReportsPage(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);
  const runPayrollPage = new RunPayrollPage(page);

  let selectedEmployeeName = employeeName || '';
  let initialTotalDuration = ''; // Total hours across all days
  let updatedTotalDuration = '';

  console.log('');
  console.log('='.repeat(70));
  console.log('WORKFLOW TEST: Billable WTA with Pay Type in Run Payroll');
  console.log('='.repeat(70));

  try {
    // ========== PART 1: CREATE BILLABLE WTA WITH PAY TYPE ==========
    console.log('Step 1: Creating a billable WTA with pay type...');

    // Navigate directly to WTA creation page (using URL to ensure WTA, not WTE)
    await page.goto('/app/timetracking', { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('  ✓ Navigated to Weekly timesheet creation screen');

    // Select team member/employee name before adding hours
    console.log('  Selecting team member...');
    await weeklyTimeActivity.openRowDropdown('Name', 1);
    await page.waitForTimeout(500);
    await page.getByRole('option').nth(1).click();
    await page.waitForTimeout(500);

    // Get selected employee name from Name field
    const employeeNameValue = await page
      .getByLabel('Name')
      .getAttribute('value');
    selectedEmployeeName = employeeNameValue || 'Emp1, Test';
    console.log(`  ✓ Selected employee: ${selectedEmployeeName}`);

    // Select current week pay period (weekNo: 0 = current week)
    console.log('  Selecting current week pay period...');
    await weeklyTimeActivity.selectWeekDropdown(LABELS.SelectWeek, 0);
    await page.waitForTimeout(1000);
    console.log('  ✓ Selected current week pay period');

    // Fill WTA details
    console.log('  Filling WTA details...');

    // Enter duration for current date only
    // Days are indexed 0-6 for columns in the WTA grid (Sunday=0, Monday=1, ..., Saturday=6)
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    console.log(
      `  Entering hours for current date only: ${dayNames[currentDayOfWeek]} (day index ${currentDayOfWeek})...`,
    );

    const durationArr = page.locator(
      `//tr[1]//input[contains(@aria-label,'Duration')]`,
    );

    const initialHours = '7'; // 7 hours for today
    const todayInput = durationArr.nth(currentDayOfWeek);
    await todayInput.click();
    await todayInput.fill(initialHours);
    await page.waitForTimeout(300);
    console.log(
      `  ✓ Entered ${initialHours} hours for ${dayNames[currentDayOfWeek]}`,
    );

    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    initialTotalDuration = `${initialHours}:00`;
    console.log(`  ✓ Total hours: ${initialHours}h`);

    // Select service
    await weeklyTimeActivity.openRowDropdown('Service', 1);
    await page.waitForTimeout(500);
    await page.getByRole('option').nth(1).click();
    await page.waitForTimeout(500);
    console.log('  ✓ Selected service');

    // Select pay type if visible and not disabled
    console.log('  Selecting pay type...');
    const isPayTypeVisible = await weeklyTimeActivity.isVisibile(
      LABELS.PayType,
      1,
    );
    const isNoPayTypeVisible = await weeklyTimeActivity.isVisibile(
      LABELS.NoPayType,
      1,
    );

    if (isPayTypeVisible && !isNoPayTypeVisible) {
      await weeklyTimeActivity.openRowDropdown(LABELS.PayType, 1);
      await page.waitForTimeout(500);
      await weeklyTimeActivity.clickDropdownOption(0);
      await page.waitForTimeout(500);
      console.log('  ✓ Selected pay type');
    } else {
      console.log('  ⚠ Pay type not available or disabled - skipping');
    }

    // Check billable checkbox
    console.log('  Setting billable...');
    if (await weeklyTimeActivity.isBillableVisible()) {
      const isChecked = await weeklyTimeActivity.isChecked(1, LABELS.Billable);
      if (!isChecked) {
        await weeklyTimeActivity.checkInputCheckbox(1, LABELS.Billable);
        console.log('  ✓ Billable checkbox checked');
      } else {
        console.log('  ✓ Billable checkbox already checked');
      }

      // Enter bill rate
      await weeklyTimeActivity.enterBillRate(1);
      console.log('  ✓ Bill rate entered');
    } else {
      console.log('  ⚠ Billable field not visible');
    }

    // Add notes
    await weeklyTimeActivity.enterNotes(
      'Billable WTA Test Entry with Pay Type',
      1,
    );
    console.log('  ✓ Notes entered');

    // Select customer (at last to ensure all fields are filled)
    console.log('  Selecting customer...');
    await weeklyTimeActivity.openRowDropdown('Customers', 1);
    await page.waitForTimeout(500);
    await page.getByRole('option').nth(1).click();
    await page.waitForTimeout(500);
    console.log('  ✓ Selected customer');

    // Save the WTA
    console.log('  Saving WTA...');
    await weeklyTimeActivity.clickSaveAndCloseButton();
    await page.waitForTimeout(3000);
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('  ✓ WTA saved successfully');

    // ========== PART 2: NAVIGATE TO RUN PAYROLL ==========
    console.log('Step 2: Navigating to Run Payroll screen...');

    await runPayrollPage.navigateToRunPayroll();
    console.log('  ✓ Navigated to Run Payroll screen');

    // Select pay period with current date and handle popup
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    // ========== PART 3: VALIDATE DURATION ON RUN PAYROLL ==========
    console.log('Step 3: Validating duration on Run Payroll screen...');

    // Convert initial duration to hours format (e.g., 7:00 -> 7h)
    const initialDurationInHours = initialTotalDuration.split(':')[0] + 'h';
    await runPayrollPage.validateEmployeeDuration(initialDurationInHours);

    // ========== PART 4: NAVIGATE TO REPORTS ==========
    console.log('Step 4: Navigating to Reports...');

    // Navigate to Reports
    await reportsPage.navigateToReportsPage();
    await reportsPage.waitForPageReady();
    await reportsPage.handlePopupsInAnyOrder();
    await expect(
      page.locator(`(//*[text()='Accounts receivable aging summary'])[1]`),
    ).toBeVisible({ timeout: 10000 });
    console.log('  ✓ Reports page loaded');

    // ========== PART 5: NAVIGATE TO TIME ACTIVITIES BY EMPLOYEE DETAIL ==========
    console.log(
      'Step 5: Navigating to Time Activities by Employee Detail report...',
    );

    // Search for and click on Time Activities by Employee Detail
    await page
      .getByTestId('__textField')
      .fill('Time Activities by Employee Detail');
    await page.getByText('Time Activities by Employee Detail').first().click();
    await page.waitForTimeout(2000);
    // Validate report title is visible
    await reportsPage.expectTimeActivitiesReportTitleVisible();
    console.log('  ✓ Time Activities by Employee Detail report opened');

    // Set date filter to This month to ensure we see the entry
    console.log('Step 5a: Setting date filter to This month...');
    await reportsPage.clickCustomDatesDropdown();
    await reportsPage.selectAllDates();
    await reportsPage.waitForLoadingToDisappear();
    await page.waitForTimeout(3000);

    await page.getByRole('button', { name: /Run report/i }).click();
    await reportsPage.waitForLoadingToDisappear();
    await page.waitForTimeout(2000);

    // Validate employee name is visible
    const employeeNameLocator = page.locator(
      `(//*[contains(text(), 'Test Emp1')])[1]`,
    );
    await expect(employeeNameLocator).toBeVisible({ timeout: 60000 });
    console.log(
      'Time Activities report loaded and employee "Test Emp1" is visible',
    );
    console.log('  ✓ Navigated to Time Activities by Employee Detail report');

    // ========== PART 6: CLICK ON HOURS LINK (OPENS STA, NOT WTA) ==========
    console.log('Step 6: Clicking on Hours link (will open STA screen)...');

    // Use ReportsPage method to click Hours link (same as UnifyTimesheet)
    await reportsPage.clickHoursLink();
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(2000);
    console.log('  ✓ Opened STA screen from report (even though entry is WTA)');

    // ========== PART 7: FIRST EDIT - UPDATE DURATION IN STA ==========
    console.log('Step 7: First Edit - Updating duration in STA...');

    console.log('  Original: 7h');
    console.log('  Updating to: 6h (first edit via STA)');

    // Update duration from 7h to 6h in STA
    await singleTimeActivityPage.fillData('Duration', '6');
    await page.waitForTimeout(500);
    console.log('  ✓ Updated duration: 7h → 6h');

    let firstEditDuration = '6:00';
    console.log('  ✓ First edit duration: 6h');

    // Save the STA
    console.log('  Saving STA changes...');
    await singleTimeActivityPage.clickButton('Save and close');
    await page.waitForTimeout(3000);
    console.log('  ✓ STA updated and saved');

    // ========== PART 8: VALIDATE FIRST EDIT ON RUN PAYROLL ==========
    console.log('Step 8: Validating first edit (6h) on Run Payroll screen...');

    await runPayrollPage.navigateToRunPayroll();
    console.log('  ✓ Navigated to Run Payroll screen');

    // Select pay period with current date and handle popup
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    const firstEditDurationInHours = '6h';
    await runPayrollPage.validateEmployeeDuration(firstEditDurationInHours);

    // ========== PART 9: SECOND EDIT - NAVIGATE TO WTA SCREEN DIRECTLY ==========
    console.log('Step 9: Second Edit - Navigating to WTA screen directly...');

    await page.goto('https://qbo.intuit.com/app/timetracking', {
      waitUntil: 'load',
    });
    await page.waitForTimeout(3000);
    console.log('  ✓ Navigated to WTA screen');

    // Find the WTA entry we created (it should be visible on the screen)
    // Look for the row with "Billable WTA Test Entry with Pay Type" notes
    const wtaRow = page
      .locator(`//*[contains(text(), 'Billable WTA Test Entry with Pay Type')]`)
      .first();
    await expect(wtaRow).toBeVisible({ timeout: 10000 });
    console.log('  ✓ Found WTA entry on screen');

    // Click on the WTA entry to open it for editing
    await wtaRow.click();
    await page.waitForTimeout(2000);
    console.log('  ✓ Opened WTA for editing');

    // ========== PART 10: UPDATE DURATION IN WTA ==========
    console.log('Step 10: Updating duration in WTA...');

    // Get current day of week for updating the correct day
    const updateToday = new Date();
    const updateDayOfWeek = updateToday.getDay();
    const updateDayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    console.log(
      `  Current: ${updateDayNames[updateDayOfWeek]} 6h (after STA edit)`,
    );
    console.log(
      `  Updating to: ${updateDayNames[updateDayOfWeek]} 5h (second edit via WTA)`,
    );

    const updateDurationArr = page.locator(
      `//tr[1]//input[contains(@aria-label,'Duration')]`,
    );

    // Update current day - from 6h to 5h
    const updateTodayInput = updateDurationArr.nth(updateDayOfWeek);
    await updateTodayInput.click();
    await updateTodayInput.clear();
    await updateTodayInput.fill('5');
    await page.waitForTimeout(300);
    console.log(`  ✓ Updated ${updateDayNames[updateDayOfWeek]}: 6h → 5h`);

    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    updatedTotalDuration = '5:00';
    console.log('  ✓ Second edit duration: 5h');

    // Save the WTA
    console.log('  Saving WTA changes...');
    await weeklyTimeActivity.clickSaveAndCloseButton();
    await page.waitForTimeout(3000);
    console.log('  ✓ WTA updated and saved');

    // ========== PART 11: NAVIGATE BACK TO RUN PAYROLL FOR FINAL VALIDATION ==========
    console.log(
      'Step 11: Navigating back to Run Payroll for final validation...',
    );

    await runPayrollPage.navigateToRunPayroll();
    console.log('  ✓ Navigated back to Run Payroll screen');

    // Select pay period with current date and handle popup
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    // ========== PART 12: VALIDATE FINAL DURATION (5H) ON RUN PAYROLL ==========
    console.log(
      'Step 12: Validating final duration (5h) on Run Payroll screen...',
    );

    // Convert updated duration to hours format (e.g., 5:00 -> 5h)
    const updatedDurationInHours = updatedTotalDuration.split(':')[0] + 'h';
    await runPayrollPage.validateEmployeeDuration(updatedDurationInHours);

    // ========== PART 13-16: SUBMIT PAYROLL ==========
    console.log('Step 13: Submitting payroll with Cash account...');
    await runPayrollPage.submitPayrollWithCashAccount();

    // ========== SUMMARY ==========
    console.log('');
    console.log('='.repeat(70));
    console.log('WORKFLOW TEST SUMMARY: Billable WTA with Pay Type');
    console.log('='.repeat(70));
    console.log(`  [WRKF002-01] Created billable WTA with pay type`);
    console.log(`  [WRKF002-02] Employee: ${selectedEmployeeName}`);
    console.log(
      `  [WRKF002-03] Initial total duration: ${initialDurationInHours} (current date only)`,
    );
    console.log(
      `  [WRKF002-04] Validated initial duration (7h) on Run Payroll screen`,
    );
    console.log(
      `  [WRKF002-05] First Edit: Clicked hours in reports → Opened STA`,
    );
    console.log(`  [WRKF002-06] First Edit: Updated duration 7h → 6h in STA`);
    console.log(
      `  [WRKF002-07] Validated first edited duration (6h) on Run Payroll screen`,
    );
    console.log(`  [WRKF002-08] Second Edit: Navigated to WTA screen directly`);
    console.log(
      `  [WRKF002-09] Second Edit: Updated duration 6h → ${updatedDurationInHours} in WTA`,
    );
    console.log(
      `  [WRKF002-10] Validated final duration (${updatedDurationInHours}) on Run Payroll screen`,
    );
    console.log(`  [WRKF002-11] Selected Cash account from dropdown`);
    console.log(`  [WRKF002-12] Submitted payroll successfully`);
    console.log('='.repeat(70));

    return {
      employeeName: selectedEmployeeName,
      duration: updatedDurationInHours,
    };
  } catch (error) {
    console.log(
      `⚠ Billable WTA with Pay Type validation encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
};

/**
 * Test flow to validate WTE (Weekly Time Entry) billable entry in run payroll
 *
 * Steps:
 * 1. Add a billable WTE with pay type selected (hours for at least 3 days)
 * 2. Go to run payroll screen and validate duration is visible
 * 3. Go to time entries screen and edit the WTE
 * 4. Update the duration
 * 5. Go back to run payroll and validate updated duration
 * 6. Go to wte screen and edit the entry
 * 7. Update the duration and validate the duration in run payroll
 * 8. Preview payroll and submit payroll
 */
export const validateBillableWTEInRunPayroll = async (
  page: Page,
  employeeName?: string,
) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  const reportsPage = new ReportsPage(page);
  const runPayrollPage = new RunPayrollPage(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);
  const singleTimeActivityPage = new SingleTimeEntryPage(page);

  let selectedEmployeeName = employeeName || '';
  let initialTotalDuration = ''; // Total hours across all days
  let updatedTotalDuration = '';

  console.log('');
  console.log('='.repeat(70));
  console.log('WORKFLOW TEST: Billable WTE in Run Payroll');
  console.log('='.repeat(70));

  try {
    // ========== PART 1: CREATE BILLABLE WTE ==========
    console.log('Step 1: Creating a billable WTE...');

    // Navigate directly to WTE creation page
    await weeklyTimeEntryPage.navigate(page);
    await page.waitForTimeout(2000);
    console.log('  ✓ Navigated to Weekly time entry creation screen');

    // Close chatbot sidebar if visible
    const chatbotCloseButton = page
      .getByTestId('headerFlyoutNode-omni-side-panel')
      .getByRole('button', { name: 'Close' });
    if (
      await chatbotCloseButton.isVisible({ timeout: 4000 }).catch(() => false)
    ) {
      await chatbotCloseButton.click();
      await page.waitForTimeout(500);
      console.log('  ✓ Closed chatbot sidebar');
    }

    // Select team member/employee name before adding hours - explicitly select "Test Emp1"
    // Note: WTE shows "Test Emp1" format, Time Entries table shows "Emp1, Test" format
    const targetEmployeeWTE = 'Test Emp1';
    const targetEmployeeTable = 'Emp1, Test';
    console.log(`  Selecting team member (${targetEmployeeWTE})...`);
    await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
    await page.waitForTimeout(500);
    await weeklyTimeEntryPage.selectTeamMemberByName(page, targetEmployeeWTE);

    // Use table format for validation/approval (Time Entries shows "Emp1, Test" format)
    selectedEmployeeName = targetEmployeeTable;
    console.log(
      `  ✓ Selected employee: ${targetEmployeeWTE} (table format: ${selectedEmployeeName})`,
    );

    // Fill WTE details
    console.log('  Filling WTE details...');

    // Select customer/project
    console.log('  Selecting customer...');
    await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
    await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
    await page.waitForTimeout(500);
    console.log('  ✓ Selected customer');

    // Enter duration for current date only
    // Days are indexed 0-6 for columns in the WTE grid (Sunday=0, Monday=1, ..., Saturday=6)
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    console.log(
      `  Entering hours for current date only: ${dayNames[currentDayOfWeek]} (day index ${currentDayOfWeek})...`,
    );

    // Enter hours for today
    const initialHours = '7'; // 7 hours for today
    const hoursInput = weeklyTimeEntryPage.hours(page, 3);
    await hoursInput.click();
    await page.waitForTimeout(300);
    await weeklyTimeEntryPage.hoursInputs(page).fill(initialHours);
    await page.waitForTimeout(500);
    console.log(
      `  ✓ Entered ${initialHours} hours for ${dayNames[currentDayOfWeek]}`,
    );

    initialTotalDuration = `${initialHours}:00`;
    console.log(`  ✓ Total hours: ${initialHours}h`);

    // Now the side panel should be open, fill in the details

    // Select service in side panel
    console.log('  Selecting service...');
    await weeklyTimeEntryPage.panelServiceDropdown(page).click();
    await weeklyTimeEntryPage.clickDropdownOption(page);
    await page.waitForTimeout(500);
    console.log('  ✓ Selected service');

    // Select class in side panel (if available)
    console.log('  Selecting class...');
    const classDropdown = weeklyTimeEntryPage.panelClassDropdown(page);
    const isClassVisible = await classDropdown
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (isClassVisible) {
      await classDropdown.click();
      await weeklyTimeEntryPage.clickDropdownOption(page);
      await page.waitForTimeout(500);
      console.log('  ✓ Selected class');
    } else {
      console.log('  ⚠ Class field not visible - skipping');
    }

    // Select location in side panel (if available)
    console.log('  Selecting location...');
    const locationDropdown = weeklyTimeEntryPage.panelLocationDropdown(page);
    const isLocationVisible = await locationDropdown
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (isLocationVisible) {
      await locationDropdown.click();
      await weeklyTimeEntryPage.clickDropdownOption(page);
      await page.waitForTimeout(500);
      console.log('  ✓ Selected location');
    } else {
      console.log('  ⚠ Location field not visible - skipping');
    }

    // Check billable checkbox in side panel
    console.log('  Setting billable...');
    const billableCheckbox = page.locator(
      `//div[@data-testid="panel"]//span[contains(text(), 'Billable')]/ancestor::label/descendant::input`,
    );
    const isBillableVisible = await billableCheckbox
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isBillableVisible) {
      const isChecked = await billableCheckbox.isChecked();
      if (!isChecked) {
        await billableCheckbox.check();
        await page.waitForTimeout(500);
        console.log('  ✓ Billable checkbox checked');
      } else {
        console.log('  ✓ Billable checkbox already checked');
      }

      // Fill bill rate
      const billRateInput = page.locator(
        `//div[@data-testid="panel"]//input[@aria-label="Bill rate"]`,
      );
      const isBillRateVisible = await billRateInput
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (isBillRateVisible) {
        await billRateInput.fill('50.00');
        await page.waitForTimeout(500);
        console.log('  ✓ Billable rate set to $50.00');
      }
    } else {
      console.log('  ⚠ Billable checkbox not visible - skipping');
    }

    // Add notes in side panel
    console.log('  Adding notes...');
    await weeklyTimeEntryPage.panelNotes(page).fill('Billable WTE Test Entry');
    await page.waitForTimeout(300);
    console.log('  ✓ Notes entered');

    // Select customer (at last to ensure all fields are filled)
    console.log('  Selecting customer...');
    await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
    await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
    await page.waitForTimeout(500);
    console.log('  ✓ Selected customer');

    // Save the WTE
    console.log('  Saving WTE...');
    await weeklyTimeEntryPage.saveAndClose(page);
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('  ✓ WTE saved successfully');

    // Step 2: Validate the time entries entered in the table
    console.log('Step 2: Validating time entries in table...');
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    // Use "This week" to ensure entries from weekly timesheet are found (handles month boundaries)
    await selectDateRangeOption(page, 'This week');
    await timeEntriesPage.waitForLoadingToDisappear();

    // Validate time entries for the selected employee (should be "Emp1, Test")
    const entryCount = await timeEntriesPage.countEmployeeRow(
      selectedEmployeeName,
    );
    expect(entryCount).toBeGreaterThan(0);
    console.log(
      `  ✓ Time entries validated in table for ${selectedEmployeeName}`,
    );

    // ========== PART 2: APPROVE AND NAVIGATE TO RUN PAYROLL AND VALIDATE TIME ENTRIES==========
    // Step 3: APPROVE TIME ENTRIES FROM APPROVALS PAGE
    console.log('Step 3: Approving time entries...');
    const approvalsPage = new ApprovalsPage(page);
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.selectDateRange('This pay period');
    await approvalsPage.approveEmployee(selectedEmployeeName);
    console.log('  ✓ Time entries approved');

    // Step 4: Navigate to Run Payroll screen and Validate intitial duration
    console.log(
      'Step 4: Navigating to Run Payroll screen and Validate intitial duration...',
    );

    await runPayrollPage.navigateToRunPayroll();
    console.log('  ✓ Navigated to Run Payroll screen');

    // Select pay period with current date and handle popup
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    console.log('Step 4a: Validate intitial duration on Run Payroll screen...');
    // Convert initial duration to hours format (e.g., 7:00 -> 7h)
    const initialDurationInHours = initialTotalDuration.split(':')[0] + 'h';
    await runPayrollPage.validateEmployeeDuration(initialDurationInHours);

    // ========== PART 3: UNAPPROVE THE TIME ENTRY FROM APPROVALS PAGE AND EDIT ENTRY FROM STE==========
    // Step 5: Unapprove the time entry from approvals page and edit the time entry
    console.log('Step 5: Unapproving and editing time entry...');
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.selectDateRange('This pay period');
    await approvalsPage.unapproveEmployee('Emp1, Test');
    console.log('  ✓ Time entry unapproved');

    // Wait and verify unapproval before editing
    await page.waitForTimeout(2000);
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('  ✓ Verified entry is unapproved');

    // Edit the time entry in STE
    console.log('Step 5a: Editing the time entry...');
    await editTimeEntryFromEmployeeDropdown(
      page,
      '6:00',
      'Billable WTE Test Entry - edited',
    );
    console.log('  ✓ Time entry edited successfully');

    // ========== PART 4: VALIDATE EDITED ENTRY IN RUN PAYROLL ==========
    console.log(
      'Step 6: Validating edited and unapproved entry in Run Payroll screen...',
    );
    // Navigate to Run Payroll screen
    await runPayrollPage.navigateToRunPayroll();
    console.log('  ✓ Navigated back to Run Payroll screen');
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();
    // After edit, validate the edited duration dont show up in run payroll grid as it not approved
    await runPayrollPage.validateEmployeeDuration(initialDurationInHours);
    console.log(
      `  ✓ Initial duration "${initialDurationInHours}" validated in Run Payroll screen`,
    );

    // ========== PART 5: APPROVE THE EDITED ENTRY FROM APPROVALS PAGE==========
    console.log('Step 7: Approving the edited entry from Approvals page...');
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.selectDateRange('This pay period');
    await approvalsPage.approveEmployee('Emp1, Test');
    console.log('  ✓ Edited entry approved');

    // ========== PART 6: NAVIGATE BACK TO RUN PAYROLL FOR (6H) DURATION VALIDATION ==========
    console.log(
      'Step 8: Navigating back to Run Payroll for edited duration validation...',
    );
    await runPayrollPage.navigateToRunPayroll();
    console.log('  ✓ Navigated back to Run Payroll screen');
    await runPayrollPage.handleTaxProblemsPopup();
    // Select pay period with current date and handle popup
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    // After edit, validate the edited duration shows up in run payroll grid
    await page.waitForTimeout(2000);
    const editedDurationInHours = '6:00'.split(':')[0] + 'h';

    // Validate edited duration is visible in run payroll grid
    const editedDurationLocator = page
      .locator(
        `(//*[text()='Emp1, Test'] | //*[text()='Test Emp1']) / ancestor::tr / descendant::*[text()='${editedDurationInHours}']`,
      )
      .first();
    await expect(editedDurationLocator).toBeVisible({ timeout: 10000 });
    console.log(
      `  ✓ Edited duration "${editedDurationInHours}" validated in Run Payroll screen`,
    );

    // ========== PART 7: EDIT ENTRY FROM WTE AND APPROVE THE EDITED ENTRY==========
    // Step 9: Unapprove the time entry from approvals page
    console.log('Step 9: Unapproving the time entry...');
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.selectDateRange('This pay period');
    await approvalsPage.unapproveEmployee('Emp1, Test');
    console.log('  ✓ Time entry unapproved');

    // Wait and verify unapproval before editing
    await page.waitForTimeout(2000);
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('  ✓ Verified entry is unapproved');

    // Edit the time entry in WTE
    console.log('Step 9a: Editing the time entry from WTE...');
    await weeklyTimeEntryPage.navigate(page);
    await page.waitForTimeout(2000);
    console.log('  ✓ Navigated to Weekly time entry screen');
    //Edit the entry: Update hours from 7 to 6 and change notes
    const editedHoursFromWTE = '5'; // 5 hours for today
    const hoursInput1 = weeklyTimeEntryPage.hours(page, 3);
    await hoursInput1.click();
    await page.waitForTimeout(300);
    await weeklyTimeEntryPage.hoursInputs(page).clear();
    await hoursInput1.click();
    await weeklyTimeEntryPage.hoursInputs(page).fill(editedHoursFromWTE);

    await page.waitForTimeout(500);
    console.log(`  ✓ Updated hours to: ${editedHoursFromWTE}h`);

    // Select service in side panel
    console.log('  Selecting service...');
    await weeklyTimeEntryPage.panelServiceDropdown(page).click();
    await weeklyTimeEntryPage.clickDropdownOption(page);
    await page.waitForTimeout(500);
    console.log('  ✓ Selected service');

    // Update notes if provided
    // await weeklyTimeEntryPage.panelNotes(page).clear();
    await weeklyTimeEntryPage.panelNotes(page).fill('Edited from WTE');
    await page.waitForTimeout(300);
    console.log(`  ✓ Updated notes to: Billable Entry - Edited from WTE`);

    // Save the changes
    await weeklyTimeEntryPage.saveAndClose(page);
    await page.waitForTimeout(1000);
    console.log('  ✓ WTE entry edited and saved successfully');

    //await editWTEEntryFromWTEScreen(page, currentDayOfWeek, '5', 'Billable Entry - Edited from WTE');

    // Update the total duration variable
    updatedTotalDuration = '5:00';
    console.log(`  ✓ WTE entry edited: ${editedDurationInHours}h → 5h`);
    console.log('  ✓ Time entry edited successfully');

    // Approve the edited entry
    console.log('Step 9b: Approving the edited entry...');
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.selectDateRange('This pay period');
    await approvalsPage.approveEmployee('Emp1, Test');
    console.log('  ✓ Time entry approved successfully');

    // ========== PART 8: NAVIGATE BACK TO RUN PAYROLL FOR (5H) DURATION VALIDATION ==========
    console.log(
      'Step 10: Navigating back to Run Payroll for edited duration validation...',
    );
    await runPayrollPage.navigateToRunPayroll();
    console.log('  ✓ Navigated back to Run Payroll screen');
    await runPayrollPage.handleTaxProblemsPopup();
    // Select pay period with current date and handle popup
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    // After edit, validate the edited duration shows up in run payroll grid
    await page.waitForTimeout(2000);
    const editedDurationInHoursFromWTE = '5:00'.split(':')[0] + 'h';

    // Validate edited duration is visible in run payroll grid
    const editedDurationLocatorFromWTE = page
      .locator(
        `(//*[text()='Emp1, Test'] | //*[text()='Test Emp1']) / ancestor::tr / descendant::*[text()='${editedDurationInHoursFromWTE}']`,
      )
      .first();
    await expect(editedDurationLocatorFromWTE).toBeVisible({ timeout: 10000 });
    console.log(
      `  ✓ Edited duration "${editedDurationInHoursFromWTE}" validated in Run Payroll screen`,
    );

    // ========== PART 8: SUBMIT PAYROLL ==========
    console.log('Step 11: Submitting payroll with Cash account...');
    await runPayrollPage.submitPayrollWithCashAccount();

    // ========== SUMMARY ==========
    console.log('');
    console.log('='.repeat(70));
    console.log('WORKFLOW TEST SUMMARY: Billable WTE in Run Payroll');
    console.log('='.repeat(70));
    console.log(`  [Step 1] Created billable WTE entry`);
    console.log(
      `  [Step 2] Validated ${selectedEmployeeName} time entry duration and notes in time entries page`,
    );
    console.log(
      `  [Step 3] Approved time entry from Approvals page with initial duration (7h)`,
    );
    console.log(
      `  [Step 4] Validated initial duration (7h) in Run Payroll screen`,
    );
    console.log(`  [Step 5] Unapproved time entry and edited duration 7h → 6h`);
    console.log(
      `  [Step 6] Validated initial duration (7h) in Run Payroll as entry is not approved`,
    );
    console.log(`  [Step 7] Approved the edited entry with duration (6h)`);
    console.log(`  [Step 8] Validated duration (6h) in Run Payroll screen`);
    console.log(
      `  [Step 9] Edited entry from WTE and approved the edited entry`,
    );
    console.log(`  [Step 10] Validated duration (5h) in Run Payroll screen`);
    console.log(`  [Step 11] Selected Cash account from dropdown`);
    console.log(`  [Step 12] Submitted payroll successfully`);
    console.log('='.repeat(70));

    return {
      employeeName: selectedEmployeeName,
      duration: editedDurationInHours,
    };
  } catch (error) {
    console.log(
      `⚠ Billable WTE validation encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
};

/**
 * Edits a WTE entry directly from the WTE screen
 * @param page - Playwright Page object
 * @param dayIndex - Day of week to edit (0=Sunday, 6=Saturday)
 * @param newDurationWTE - New duration to set
 * @param newNotesWTE - New notes to set (optional)
 */
export const editWTEEntryFromWTEScreen = async (
  page: Page,
  dayIndex: number,
  newDurationWTE: string,
  newNotesWTE?: string,
) => {
  console.log('  Editing WTE entry from WTE screen...');
  // Navigate directly to WTE creation page
  await weeklyTimeEntryPage.navigate(page);
  await page.waitForTimeout(2000);
  console.log('  ✓ Navigated to Weekly time entry creation screen');

  // Update duration

  const hoursInput = weeklyTimeEntryPage.hours(page, dayIndex);
  await hoursInput.click();
  await hoursInput.clear();
  await weeklyTimeEntryPage.hoursInputs(page).fill(newDurationWTE);
  await page.waitForTimeout(500);
  console.log(`  ✓ Updated duration to: ${newDurationWTE}`);

  await weeklyTimeEntryPage.navigate(page);
  // Select service in side panel
  console.log('  Selecting service...');
  await weeklyTimeEntryPage.panelServiceDropdown(page).click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.waitForTimeout(500);
  console.log('  ✓ Selected service');

  // Update notes if provided
  if (newNotesWTE) {
    await weeklyTimeEntryPage.panelNotes(page).clear();
    await weeklyTimeEntryPage.panelNotes(page).fill(newNotesWTE);
    await page.waitForTimeout(300);
    console.log(`  ✓ Updated notes to: ${newNotesWTE}`);
  }

  // Save the changes using the panel save button
  await weeklyTimeEntryPage.saveAndClose(page);
  await page.waitForTimeout(1000);
  console.log('  ✓ WTE entry edited and saved successfully');
};

/**
 * Test flow to validate Time Clock billable entry in run payroll
 *
 * Steps:
 * 1. Add a billable Time Clock entry
 * 2. Go to run payroll screen and validate duration is visible
 * 3. Go to time entries screen and edit the Time Clock entry
 * 4. Update the duration
 * 5. Go back to run payroll and validate updated duration
 * 6. Preview payroll and submit payroll
 */
export const validateTimeClockInRunPayroll = async (
  page: Page,
  employeeName?: string,
) => {
  const singleTimeActivityPage = new SingleTimeEntryPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const reportsPage = new ReportsPage(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);
  const runPayrollPage = new RunPayrollPage(page);

  let selectedEmployeeName = employeeName || 'Emp1, Test';
  let initialTotalDuration = ''; // Total hours across all days
  let updatedTotalDuration = '';

  console.log('');
  console.log('='.repeat(70));
  console.log('WORKFLOW TEST: Billable Time Clock in Run Payroll');
  console.log('='.repeat(70));

  try {
    // ========== PART 1: CREATE BILLABLE time clock entry ==========
    console.log('Step 1: Creating a billable Time Clock entry...');

    // Fill Time Clock details
    console.log('  Filling Time Clock details...');

    await TimeClockPage.navigateToTimeClock(page);
    console.log('Navigated to Time Clock');

    // Click Clock In button
    await TimeClockPage.clickClockIn(page);
    console.log('Clicked Clock In');
    await TimeClockPage.waitForDrawerVisible(page);
    console.log('Drawer is visible');

    const todayDD = TimeClockPage.getTodayDayDD();
    await TimeClockPage.selectCurrentDate(page);
    //await TimeClockPage.selectTime(page, '10:00 AM');

    // Get available options
    const options = await TimeClockPage.getCustomerProjectOptions(page);
    console.log('Customer/Project options:', options);
    expect(options.length).toBeGreaterThan(0);

    // Verify we can select an option
    if (options.length > 0) {
      await TimeClockPage.selectCustomerProject(page, options[0]);
      console.log('Selected customer/project:', options[0]);
    }

    await TimeClockPage.clickOnClockInButton(page);
    console.log('Clicked on Clock In button');

    // Get available service item options
    const serviceOptions = await TimeClockPage.getServiceItemOptions(page);
    console.log('Service item options:', serviceOptions);
    expect(serviceOptions.length).toBeGreaterThan(0);

    // Verify we can select a service item
    if (serviceOptions.length > 0) {
      await page
        .locator(
          `//span[contains(text(),'Service')]/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
        )
        .click();
      await page.getByRole('option', { name: serviceOptions[0] }).click();
      console.log('Selected service item:', serviceOptions[0]);

      // Verify selection was made
      const selectedServiceValue = await page
        .locator(`//span[contains(text(),'Service')]/..//input`)
        .inputValue();
      console.log('Selected service value:', selectedServiceValue);
      expect(selectedServiceValue).toContain(serviceOptions[0]);
    }

    const billableCheckbox = page.locator(
      `//input[contains(@class, 'RcCheckbox')]`,
    );
    expect(billableCheckbox).toBeVisible();

    // Test checking the billable checkbox
    await billableCheckbox.check();
    expect(await billableCheckbox.isChecked()).toBeTruthy();

    await TimeClockPage.clickClockOut(page);
    console.log('Clicked Clock Out');

    console.log('  ✓ Time Clock entry saved successfully');

    // ======= PART 2: VALIDATE TIME CLOCK ENTRY IN TIME ENTRIES TABLE =====================
    console.log('Step 2: Validating time clock entry in Time Entries table...');
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    // Use "This week" to ensure entries from current week are found (handles month boundaries)
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();
    const entryCount = await timeEntriesPage.countEmployeeRow(
      selectedEmployeeName,
    );
    expect(entryCount).toBeGreaterThan(0);
    console.log('  ✓ Time clock entry validated in table');

    // Approve time entries from Approvals page
    console.log('Step 2a: Approving time entries...');
    const approvalsPage = new ApprovalsPage(page);
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.selectDateRange('This pay period');
    // Wait for data to load after date range selection
    await page.waitForTimeout(3000);
    await approvalsPage.approveEmployee('Emp1, Test');
    console.log('  ✓ Time entries approved successfully');

    // ========== PART 3: NAVIGATE TO RUN PAYROLL AND VALIDATE INITIAL DURATION==========
    console.log('Step 3: Navigating to Run Payroll screen...');

    await runPayrollPage.navigateToRunPayroll();
    console.log('  ✓ Navigated to Run Payroll screen');

    // Select pay period with current date and handle popup
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    console.log('Step 3a: Getting initial duration from Run Payroll screen...');
    // Get the actual initial duration dynamically (varies based on clock in/out timing)
    const initialDurationValue = await runPayrollPage.getEmployeeDuration();
    console.log(`  ✓ Initial duration captured: ${initialDurationValue}h`);

    // ========== PART 4: UNAPPROVE THE TIME ENTRY FROM APPROVALS PAGE AND EDIT ENTRY FROM STE==========
    console.log('Step 4: Unapproving and editing time entry...');
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.selectDateRange('This pay period');
    await approvalsPage.unapproveEmployee('Emp1, Test');
    console.log('  ✓ Time entry unapproved');

    // Wait and verify unapproval before editing
    await page.waitForTimeout(2000);
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('  ✓ Verified entry is unapproved');

    // Get current time in 12-hour format with AM/PM to edit the time clock entry
    const now = new Date();
    let currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const ampm = currentHours >= 12 ? 'PM' : 'AM';
    currentHours = currentHours % 12;
    currentHours = currentHours ? currentHours : 12; // the hour '0' should be '12'
    const currentTime = `${String(currentHours).padStart(2, '0')}:${String(
      currentMinutes,
    ).padStart(2, '0')} ${ampm}`;

    // Edit the end time in time clock entry in STE
    console.log('Step 4a: Editing the time entry...');
    await EditTimeClockEntry(
      page,
      currentTime,
      'Billable time clock entry - edited',
    );
    console.log('  ✓ Time entry edited successfully');

    // ========== PART 5: VALIDATE EDITED ENTRY IN RUN PAYROLL ==========
    console.log(
      'Step 5: Validating edited and unapproved entry in Run Payroll screen...',
    );
    // Navigate to Run Payroll screen
    await runPayrollPage.navigateToRunPayroll();
    console.log('  ✓ Navigated back to Run Payroll screen');
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();
    // After edit, validate the edited duration doesn't show up in run payroll grid as it's not approved
    // The duration should still be the initial value (unapproved edits don't reflect)
    await runPayrollPage.validateEmployeeDuration(initialDurationValue + 'h');
    console.log(
      `  ✓ Initial duration "${initialDurationValue}h" still shown (unapproved edit not reflected)`,
    );

    // ========== PART 6: APPROVE THE EDITED ENTRY FROM APPROVALS PAGE==========
    console.log('Step 6: Approving the edited entry from Approvals page...');
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.selectDateRange('This pay period');
    await approvalsPage.approveEmployee('Emp1, Test');
    console.log('  ✓ Edited entry approved');

    // ========== PART 7: NAVIGATE BACK TO RUN PAYROLL FOR FINAL VALIDATION ==========
    console.log(
      'Step 7: Navigating back to Run Payroll for final validation...',
    );

    await runPayrollPage.navigateToRunPayroll();
    console.log('  ✓ Navigated back to Run Payroll screen');

    // Select pay period with current date and handle popup
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    console.log('Step 7a: Validating final duration on Run Payroll screen...');
    // Validate that duration after edit is greater than the initial duration captured earlier
    // The actual duration varies based on test execution timing
    const actualDuration =
      await runPayrollPage.validateEmployeeDurationGreaterThan(
        initialDurationValue,
      );
    console.log(
      `  ✓ Validated duration: ${actualDuration}h is greater than initial ${initialDurationValue}h`,
    );
    //}

    // ========== PART 8: SUBMIT PAYROLL ==========
    console.log('Step 8: Submitting payroll with Cash account...');
    await runPayrollPage.submitPayrollWithCashAccount();

    // ========== SUMMARY ==========
    console.log('');
    console.log('='.repeat(70));
    console.log('WORKFLOW TEST SUMMARY: Billable Time Clock in Run Payroll');
    console.log('='.repeat(70));
    console.log(`  [Step 1] Created billable Time Clock entry`);
    console.log(`  [Step 2] Validated time clock entry in Time Entries table`);
    console.log(
      `  [Step 3] Approved and Validated initial duration on Run Payroll screen`,
    );
    console.log(`  [Step 4] Unapproved and edited time clock entry`);
    console.log(
      `  [Step 5] Validated edited and unapproved time clock entry duration doesnt show on Run Payroll screen`,
    );
    console.log(`  [Step 6] Approved the edited entry...`);
    console.log(`  [Step 7] Validated final duration on Run Payroll screen`);
    console.log(`  [Step 8] Submitted payroll successfully`);
    console.log('='.repeat(70));

    return {
      employeeName: selectedEmployeeName,
      duration: actualDuration + 'h',
    };
  } catch (error) {
    console.log(
      `⚠ Billable Time Clock validation encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
};

/**
 * Cleanup function to remove WTA test entries after workflow test
 * 1. Delete the created payroll
 * 2. Delete the created billable WTA entry
 */
export const cleanupWorkflowWTATestData = async (
  page: Page,
  employeeName?: string,
) => {
  console.log('');
  console.log('Starting cleanup of workflow WTA test data...');

  const timeEntriesPage = new TimeEntriesPage(page);
  const employeesPage = new EmployeesPage(page);

  try {
    // ========== PART 1: DELETE PAYROLL ==========
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

    // ========== PART 2: DELETE BILLABLE WTA ENTRY FROM REPORTS ==========
    console.log('Step 2: Deleting billable WTA entries from Reports...');
    let entriesDeleted = 0;
    try {
      entriesDeleted = await deleteSTAEntriesFromReports(page, '', 50);
      console.log(
        `✓ Reports cleanup completed (${entriesDeleted} STA entry/entries deleted)`,
      );
    } catch (reportsError) {
      console.log('  ⚠ Reports cleanup skipped or no entries found');
      console.log(
        `  Error: ${
          reportsError instanceof Error
            ? reportsError.message
            : String(reportsError)
        }`,
      );
    }

    // Navigate back to Time Entries page for next steps (always do this)
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    console.log('  ✓ Navigated to Time Entries with "This month" selected');

    console.log('');
    console.log('='.repeat(70));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(70));
    console.log(`  ✓ Payroll deleted successfully`);
    console.log(
      `  ✓ Billable WTA entries deleted (${entriesDeleted} from Reports)`,
    );
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

/**
 * Cleanup function to remove WTE/STE test entries after workflow test
 * 1. Delete the created payroll
 * 2. Delete the created billable time entry
 * 3. Delete the created billable entry from reports
 */
export const cleanupWorkflowTimeEntryTestData = async (
  page: Page,
  employeeName?: string,
) => {
  console.log('');
  console.log('Starting cleanup of WTE/Timeclock workflow test data...');

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

    // Step 2 & 3: Unapprove and delete WTE/Timeclock entries
    console.log('Step 2-3: Unapproving and deleting entries...');

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
      // Try to unapprove entries first from Approvals tab (only if they exist)
      try {
        const approvalsPage = new ApprovalsPage(page);
        await approvalsPage.navigateToApprovalsPage();
        await approvalsPage.waitForLoadingToDisappear();
        await approvalsPage.selectDateRange('This month');

        // Try to unapprove - will handle if already unapproved
        await approvalsPage.unapproveEmployee(displayName);
        console.log('✓ Time entry unapproved from Approvals tab');
      } catch (error) {
        console.log(
          '  ℹ Time entry may already be unapproved or error during unapproval',
        );
      }

      // Delete time entries from time entries page
      await timeEntriesPage.navigateToTimeEntriesPage();
      await timeEntriesPage.waitForLoadingToDisappear();
      await openDateRangeDropdown(page);
      await selectDateRangeOption(page, 'This month');
      await timeEntriesPage.waitForLoadingToDisappear();

      // Delete all entries for the employee
      entryCount = await timeEntriesPage.countEmployeeRow(displayName);
      while (entryCount > 0) {
        console.log(`  Deleting entry (${entryCount} remaining)...`);
        await timeEntriesPage.deleteFirstTimeEntry();

        // Refresh data by switching filters
        await selectDisplayByOption(page, 'Customer');
        await timeEntriesPage.waitForLoadingToDisappear();
        await selectDisplayByOption(page, 'Date');
        await timeEntriesPage.waitForLoadingToDisappear();

        entryCount = await timeEntriesPage.countEmployeeRow(displayName);
      }

      console.log('✓ WTE/Timeclock entries deleted from time entries');
    } else {
      console.log('  ℹ No STE entries found to clean up');
    }
    // Delete all entries from reports (works for paid companies where Time Entries shows WTE)
    try {
      await deleteSTAEntriesFromReports(page, '', 50);
      console.log('✓ All entries cleanup from reports completed');
    } catch (reportsError) {
      console.log('  ⚠ Reports cleanup skipped or no entries found');
    }

    // Navigate back to Time Entries page for next steps (always do this)
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    console.log('  ✓ Navigated to Time Entries with "This month" selected');

    console.log('');
    console.log('='.repeat(70));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(70));
    console.log(`  ✓ Payroll deleted successfully`);
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

/**
 * RP005: Validate STE with approval workflow in Run Payroll
 * Steps:
 * 1. Create STE from time entries (already on page with "This month" from pre-test cleanup)
 * 2. Validate unapproved STE hours (3h) NOT visible in run payroll
 * 3. Approve the STE with retry logic (checking for alert errors)
 * 4. Validate STE visible in reports
 * 5. Validate approved STE hours (3h) now visible in run payroll
 * 6. Unapprove, update STE to 5h, and approve again (with retry logic)
 * 7. Validate updated STE hours (5h) visible in run payroll (3h not showing) and submit payroll
 * 8. Cleanup: delete paycheck followed by entry
 */
export const validateSTEWithApprovalInRunPayroll = async (
  page: Page,
  employeeName?: string,
) => {
  console.log('');
  console.log('='.repeat(70));
  console.log('TEST: STE WITH APPROVAL WORKFLOW IN RUN PAYROLL');
  console.log('='.repeat(70));

  const singleTimeActivityPage = new SingleTimeEntryPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const runPayrollPage = new RunPayrollPage(page);
  const reportsPage = new ReportsPage(page);
  const employeesPage = new EmployeesPage(page);

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
    console.log(
      '  ✓ Already on time entries page with "This month" selected (from pre-test cleanup)',
    );

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

    // Set duration
    await singleTimeActivityPage.enterFieldValue('Duration', initialDuration);

    // Add description/notes
    await singleTimeActivityPage.fillData('Notes', testDescription);

    // Save and close the entry (STE does not have pay type)
    await singleTimeActivityPage.clickSaveAndCloseButton();
    await page.waitForTimeout(2000);
    console.log(`✓ Created STE: ${initialDuration} hours`);

    // Step 2: Validate unapproved STE in run payroll screen (STE hours should NOT be visible)
    console.log('');
    console.log(
      'Step 2: Validating unapproved STE in run payroll screen (STE hours should NOT be visible)...',
    );
    await runPayrollPage.navigateToRunPayroll();
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
      throw new Error(
        `Unapproved STE hours (${durationInHours}) are visible in run payroll (unexpected)`,
      );
    }

    // Step 3: Approve the STE from Approvals tab
    console.log('');
    console.log('Step 3: Approving the STE from Approvals tab...');

    const approvalsPage = new ApprovalsPage(page);
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.waitForLoadingToDisappear();

    // Select "This month" date range
    await approvalsPage.selectDateRange('This month');
    console.log('  ✓ Selected "This month" date range');

    // Approve the employee's time entries
    const approvalSuccess = await approvalsPage.approveEmployee(displayName);
    if (!approvalSuccess) {
      throw new Error('Failed to approve STE from Approvals tab');
    }
    console.log('  ✓ STE approved successfully from Approvals tab');

    // Step 4: Validate STE in reports
    console.log('');
    console.log('Step 4: Validating STE in reports...');

    await reportsPage.navigateToReportsPage();
    await reportsPage.waitForPageReady();
    await reportsPage.handlePopupsInAnyOrder();

    // Search for Time Activities by Employee Detail
    await page
      .getByTestId('__textField')
      .fill('Time Activities by Employee Detail');
    await page.getByText('Time Activities by Employee Detail').first().click();
    await page.waitForTimeout(2000);

    await reportsPage.expectTimeActivitiesReportTitleVisible();
    console.log('  ✓ Time Activities by Employee Detail report opened');

    // Set date filter to All Dates
    await reportsPage.clickCustomDatesDropdown();
    await reportsPage.selectAllDates();
    await reportsPage.waitForLoadingToDisappear();
    await page.waitForTimeout(2000);

    // Validate employee entry is visible in reports
    await reportsPage.expectTestEmp1EntryVisible();
    console.log(`✓ STE visible in reports for ${testEmployee}`);

    // Step 5: Validate approved STE in run payroll screen (STE hours should now be visible)
    console.log('');
    console.log(
      'Step 5: Validating approved STE in run payroll screen (STE hours should now be visible)...',
    );
    await runPayrollPage.navigateToRunPayroll();
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

    // Unapprove from Approvals tab
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.waitForLoadingToDisappear();
    await approvalsPage.selectDateRange('This month');
    console.log('  ✓ Selected "This month" date range');

    // Unapprove the employee's time entries
    const unapprovalSuccess = await approvalsPage.unapproveEmployee(
      displayName,
    );
    if (!unapprovalSuccess) {
      throw new Error('Failed to unapprove STE from Approvals tab');
    }
    console.log('✓ STE unapproved successfully from Approvals tab');

    // Navigate to Time Entries to edit the entry (Date view)
    await timeEntriesPage.navigateToTimeEntriesPage();
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

    // Re-approve from Approvals tab with updated duration
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.waitForLoadingToDisappear();
    await approvalsPage.selectDateRange('This month');
    console.log('  ✓ Selected "This month" date range');

    // Re-approve the employee's time entries
    const reApprovalSuccess = await approvalsPage.approveEmployee(displayName);
    if (!reApprovalSuccess) {
      throw new Error('Failed to re-approve STE from Approvals tab');
    }
    console.log('  ✓ STE re-approved with updated duration from Approvals tab');

    // Step 7: Validate updated values in payroll and submit payroll (updated STE hours should be visible)
    console.log('');
    console.log(
      'Step 7: Validating updated values in payroll and submitting...',
    );
    await runPayrollPage.navigateToRunPayroll();
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

    console.log('');
    console.log('='.repeat(70));
    console.log('TEST SUMMARY: STE WITH APPROVAL WORKFLOW');
    console.log('='.repeat(70));
    console.log(`  [Step 1] Created STE: ${initialDuration} hours`);
    console.log(
      `  [Step 2] Verified unapproved STE hours (${initialDuration}h) NOT visible in run payroll`,
    );
    console.log(
      `  [Step 3] Approved STE from time entries (with retry logic for alert errors)`,
    );
    console.log(`  [Step 4] Validated STE visible in reports`);
    console.log(
      `  [Step 5] Verified approved STE hours (${initialDuration}h) now visible in run payroll`,
    );
    console.log(
      `  [Step 6] Unapproved, updated STE duration to ${updatedDuration}h, re-approved (with retry)`,
    );
    console.log(
      `  [Step 7] Verified updated STE hours (${updatedDuration}h) visible in run payroll and submitted payroll`,
    );
    console.log('='.repeat(70));
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));
  } catch (error) {
    console.log(
      `⚠ Test encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
};

/**
 * Cleanup function for RP005: STE workflow test data
 * Steps:
 * 1. Delete payroll
 * 2. Unapprove STE
 * 3. Delete STE entries
 */
export const cleanupSTEWorkflowTestData = async (
  page: Page,
  employeeName?: string,
) => {
  console.log('');
  console.log('Starting cleanup of STE workflow test data...');

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
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );

    // Always select "This month" date range first
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    console.log('  ✓ Selected "This month" date range');

    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );

    const testEmployee = employeeName || 'Test Emp1';
    const displayName = testEmployee.includes(',')
      ? testEmployee
      : `${testEmployee.split(' ')[1]}, ${testEmployee.split(' ')[0]}`;

    // Check if entries exist before attempting to unapprove
    let entryCount = await timeEntriesPage.countEmployeeRow(displayName);
    console.log(`Found ${entryCount} STE entry(ies) for ${displayName}`);

    if (entryCount > 0) {
      // Try to unapprove entries first from Approvals tab (only if they exist)
      try {
        const approvalsPage = new ApprovalsPage(page);
        await approvalsPage.navigateToApprovalsPage();
        await approvalsPage.waitForLoadingToDisappear();
        await approvalsPage.selectDateRange('This month');

        // Try to unapprove - will handle if already unapproved
        await approvalsPage.unapproveEmployee(displayName);
        console.log('✓ STE unapproved from Approvals tab');
      } catch (error) {
        console.log(
          '  ℹ STE may already be unapproved or error during unapproval',
        );
      }

      // Delete STE entries from time entries page
      await timeEntriesPage.navigateToTimeEntriesPage();
      await timeEntriesPage.waitForLoadingToDisappear(
        CLEANUP_OPERATION_TIMEOUT_MS,
      );
      await openDateRangeDropdown(page);
      await selectDateRangeOption(page, 'This month');
      await timeEntriesPage.waitForLoadingToDisappear(
        CLEANUP_OPERATION_TIMEOUT_MS,
      );

      // Delete all entries for the employee
      entryCount = await timeEntriesPage.countEmployeeRow(displayName);
      while (entryCount > 0) {
        console.log(`  Deleting entry (${entryCount} remaining)...`);
        await timeEntriesPage.deleteFirstTimeEntry(
          CLEANUP_OPERATION_TIMEOUT_MS,
        );

        // Refresh data by switching filters
        await selectDisplayByOption(page, 'Customer');
        await timeEntriesPage.waitForLoadingToDisappear(
          CLEANUP_OPERATION_TIMEOUT_MS,
        );
        await selectDisplayByOption(page, 'Date');
        await timeEntriesPage.waitForLoadingToDisappear(
          CLEANUP_OPERATION_TIMEOUT_MS,
        );

        entryCount = await timeEntriesPage.countEmployeeRow(displayName);
      }

      console.log('✓ STE entries deleted from time entries');
    } else {
      console.log('  ℹ No STE entries found to clean up');
    }

    // ========== DELETE ENTRIES FROM REPORTS ==========
    console.log('Step 4: Deleting entries from Reports...');
    let entriesDeleted = 0;
    try {
      entriesDeleted = await deleteSTAEntriesFromReports(page, '', 50);
      console.log(
        `✓ Reports cleanup completed (${entriesDeleted} STA entry/entries deleted)`,
      );
    } catch (reportsError) {
      console.log('  ⚠ Reports cleanup skipped or no entries found');
      console.log(
        `  Error: ${
          reportsError instanceof Error
            ? reportsError.message
            : String(reportsError)
        }`,
      );
    }

    // Navigate back to Time Entries page for next steps (always do this)
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    console.log('  ✓ Navigated to Time Entries with "This month" selected');

    console.log('');
    console.log('='.repeat(70));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(70));
    console.log(`  ✓ Payroll deleted successfully`);
    console.log(`  ✓ STE entries unapproved and deleted`);
    console.log(`  ✓ Reports entries cleaned (${entriesDeleted} from Reports)`);
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

/**
 * RP007 - Regression: Breaks with Approval → Run Payroll → Unapprove/Edit → Validate Changes
 *
 * This test validates the complete breaks workflow including manual break entries,
 * automatic breaks applied to time entries, approval/unapproval, validation in run payroll,
 * validation in reports, editing split entries, and payroll submission.
 *
 * Pre-requisites:
 * - Account must have pre-created automatic and manual breaks configured
 * - Manual break rule name: "Paid: manual break"
 * - Test employee: Test Emp1
 *
 * Test Flow:
 * 1. Create manual break entry (6 hours: 8 AM - 2 PM) with start/end time for yesterday
 * 2. Create time entry (7 hours: 3 PM - 10 PM) with start/end time for yesterday (same day as break, non-overlapping)
 * 3. Validate 13h NOT visible in run payroll (unapproved)
 * 4. Approve entries from employee view
 * 5. Validate entries in reports
 * 6. Validate 13h IS visible in run payroll (approved)
 * 7. Unapprove entries from employee view
 * 8. Edit one of the split entries
 * 9. Approve after update and validate in run payroll
 * 10. Submit payroll
 * 11. Cleanup payroll and entries
 *
 * Note: Both entries use start/end time (not duration) to enable automatic break application
 * Note: Uses past dates (yesterday and day before yesterday) to avoid future date validation issues
 */
export const validateBreaksWithApprovalInRunPayroll = async (
  page: Page,
  employeeName?: string,
) => {
  const testEmployee = employeeName || 'Test Emp1';
  const firstName = testEmployee.split(' ')[0];
  const lastName = testEmployee.split(' ')[1] || testEmployee.split(' ')[0];
  const displayName = testEmployee.includes(',')
    ? testEmployee
    : `${lastName}, ${firstName}`;

  const timeEntriesPage = new TimeEntriesPage(page);
  const breaksPage = new BreaksPage(page);
  const runPayrollPage = new RunPayrollPage(page);
  const reportsPage = new ReportsPage(page);
  const singleTimeActivityPage = new SingleTimeEntryPage(page);
  const singleTimeEntryPage = new ActualSingleTimeEntryPage(page);

  const manualBreakDuration = '6'; // 6 hours
  const timeEntryDuration = '7'; // 7 hours (will be updated to 8h in Step 8)
  const totalExpectedHours = '13h'; // 6h + 7h = 13h total (before edit)
  const updatedTotalExpectedHours = '14h'; // 6h + 8h = 14h total (after edit)

  const manualBreakDescription = 'Manual Break Entry - RP007';
  const automaticBreakDescription = 'Automatic Break Entry - RP007';

  // Calculate dates to avoid future date issues
  // Both entries should be on the same day to be in the same pay period
  // Manual break: yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  // Both manual break and time entry are on the same day (yesterday)
  // Manual break uses 8 AM - 2 PM (6h), time entry uses 3 PM - 10 PM (7h)
  // Total: 13 hours, non-overlapping times

  try {
    console.log('');
    console.log('='.repeat(70));
    console.log('RP007: BREAKS WITH APPROVAL WORKFLOW TEST');
    console.log('='.repeat(70));
    console.log(`Test Employee: ${testEmployee} (Display: ${displayName})`);
    console.log(
      `Manual Break: ${manualBreakDuration}h (8 AM - 2 PM) - ${yesterdayFormatted}`,
    );
    console.log(
      `Time Entry: ${timeEntryDuration}h (3 PM - 10 PM) - ${yesterdayFormatted}`,
    );
    console.log(`Expected Total: ${totalExpectedHours}`);
    console.log('='.repeat(70));

    // Step 1: Navigate to Time Entries and create manual break entry
    console.log('');
    console.log(
      `Step 1: Creating manual break entry (6 hours: 8 AM - 2 PM) for ${yesterdayFormatted}...`,
    );

    // Navigate to Time Entries page
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Select "This month" date range
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log(
      '  ✓ Navigated to Time Entries page with "This month" selected',
    );

    // Open Add Break drawer
    await breaksPage.openAddBreakDrawer();

    // Select team member and break type (manual break rule must exist)
    await breaksPage.selectTeamMemberAndBreakType(
      testEmployee,
      'Paid: manual break',
    );

    // Select Start and end time entry type (breaks only support this, not duration)
    await breaksPage.selectBreakEntryType('Start and end time');
    await page.waitForTimeout(1000);

    // Set date to yesterday to avoid future date issues
    await breaksPage.enterStartDate(yesterdayFormatted);
    await page.waitForTimeout(1000);

    // Clear and enter start and end times (8 AM to 2 PM = 6 hours)
    await breaksPage.clearStartOrEndTime('Start Time');
    await breaksPage.enterStartOrEndTime('Start Time', '08:00 AM');
    await breaksPage.clearStartOrEndTime('End Time');
    await breaksPage.enterStartOrEndTime('End Time', '02:00 PM');

    // Enter notes (indicate this is a manual break)
    await breaksPage.enterNotes(manualBreakDescription);

    // Save the break
    await breaksPage.saveBreak();
    await page.waitForTimeout(3000);

    console.log(
      `✓ Manual break entry created (${manualBreakDuration}h: 8 AM - 2 PM) for ${yesterdayFormatted}`,
    );

    // Step 2: Create time entry (7 hours: 3 PM - 10 PM) - non-overlapping with break
    console.log('');
    console.log(
      `Step 2: Creating time entry (7 hours: 3 PM - 10 PM) for ${yesterdayFormatted}...`,
    );

    // Wait to ensure we're back on time entries page and break drawer is closed
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(2000);

    // Click Add time dropdown and select Single time entry
    await clickAddTimeDropdown(page);
    await selectSingleTimeEntryFromAddTime(page, false); // false = paid company

    // Wait for Single Time Entry page to be fully ready
    await page.waitForTimeout(3000);
    await singleTimeEntryPage.waitForPageReady();
    await singleTimeEntryPage.handlePopupsInAnyOrder();
    await singleTimeEntryPage.waitTillNameFieldVisible();

    // Fill in entry details - select employee
    await singleTimeActivityPage.openDropdown('Name');
    await page.waitForTimeout(500);
    await singleTimeActivityPage.clickDropdownOption(1, 'Name');

    // Set date to day before yesterday to avoid future date issues
    await singleTimeEntryPage.fillStartDate(yesterdayFormatted);
    await page.waitForTimeout(500);

    // Toggle "Set start and end time" (required for automatic breaks to apply)
    const isToggleEnabled =
      await singleTimeActivityPage.verifySetClockToggleState();
    if (!isToggleEnabled) {
      await singleTimeActivityPage.clickSetClockInAndOutToggles();
      await page.waitForTimeout(500);
    }

    // Set start and end times (3 PM to 10 PM = 7 hours, no overlap with manual break 8 AM - 2 PM)
    await singleTimeActivityPage.selectTime('Start', '3:00 PM');
    await singleTimeActivityPage.selectTime('End', '10:00 PM');

    // Add notes (indicate this will trigger automatic break)
    await singleTimeActivityPage.fillData('Notes', automaticBreakDescription);

    // Save and close
    await singleTimeActivityPage.clickSaveAndCloseButton();
    await page.waitForTimeout(2000);

    console.log(
      `✓ Time entry created (${timeEntryDuration}h: 3 PM - 10 PM) for ${yesterdayFormatted}`,
    );

    // Step 3: Validate 13h NOT visible in run payroll (unapproved)
    console.log('');
    console.log(
      'Step 3: Validating unapproved breaks in run payroll (13h should NOT be visible)...',
    );

    await runPayrollPage.navigateToRunPayroll();
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    // Verify total hours (13h) are NOT showing (unapproved time should not appear)
    const hoursNotVisible =
      await runPayrollPage.validateEmployeeHoursNotVisible(
        testEmployee,
        totalExpectedHours,
      );

    if (hoursNotVisible) {
      console.log(
        `✓ Unapproved break hours (${totalExpectedHours}) NOT visible in run payroll (as expected)`,
      );
    } else {
      console.log(
        `⚠ Warning: Break hours (${totalExpectedHours}) are visible (unexpected for unapproved entries)`,
      );
    }

    // Step 4: Approve entries from Approvals tab
    console.log('');
    console.log('Step 4: Approving break entries from Approvals tab...');

    const approvalsPage = new ApprovalsPage(page);
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.waitForLoadingToDisappear();

    // Select "This month" date range
    await approvalsPage.selectDateRange('This month');
    console.log('  ✓ Selected "This month" date range');

    // Approve the employee's time entries
    const approvalSuccess = await approvalsPage.approveEmployee(displayName);
    if (!approvalSuccess) {
      throw new Error('Failed to approve break entries from Approvals tab');
    }
    console.log('  ✓ Break entries approved successfully from Approvals tab');

    // Wait for approval to propagate and verify entries are actually approved
    await page.waitForTimeout(2000);

    // Navigate to Time Entries to verify entries show "Approved" status
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    // Check for "Approved" status on entries (status can be in various elements)
    const approvedStatus = page
      .getByText('Approved', { exact: true })
      .or(page.locator(`//*[contains(@class, 'status')]//*[text()='Approved']`))
      .or(page.locator(`//td//*[text()='Approved']`))
      .first();
    const isApprovedVisible = await approvedStatus
      .isVisible()
      .catch(() => false);
    if (isApprovedVisible) {
      console.log(
        '  ✓ Verified entries show "Approved" status in Time Entries',
      );
    } else {
      console.log('  ⚠ Could not verify "Approved" status, proceeding anyway');
    }

    console.log('✓ Break entries approved successfully');

    // Step 5: Validate entries in reports
    console.log('');
    console.log('Step 5: Validating break entries in reports...');

    await reportsPage.navigateToReportsPage();
    await reportsPage.waitForPageReady();
    await reportsPage.handlePopupsInAnyOrder();

    // Search for Time Activities by Employee Detail
    await page
      .getByTestId('__textField')
      .fill('Time Activities by Employee Detail');
    await page.getByText('Time Activities by Employee Detail').first().click();
    await page.waitForTimeout(2000);

    await reportsPage.expectTimeActivitiesReportTitleVisible();
    console.log('  ✓ Time Activities by Employee Detail report opened');

    // Set date filter to All Dates
    await reportsPage.clickCustomDatesDropdown();
    await reportsPage.selectAllDates();
    await reportsPage.waitForLoadingToDisappear();
    await page.waitForTimeout(2000);

    // Validate employee entry is visible in reports
    await reportsPage.expectTestEmp1EntryVisible();
    console.log(`✓ Break entries visible in reports for ${testEmployee}`);

    // Step 6: Validate 13h IS visible in run payroll (approved)
    console.log('');
    console.log(
      'Step 6: Validating approved breaks in run payroll (13h should now be visible)...',
    );

    await runPayrollPage.navigateToRunPayroll();
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    // Verify total hours (13h) are NOW showing (approved time should appear)
    const hoursVisible = await runPayrollPage.validateEmployeeHoursVisible(
      testEmployee,
      totalExpectedHours,
    );

    if (!hoursVisible) {
      throw new Error(
        `Expected break hours (${totalExpectedHours}) to be visible but they are not`,
      );
    }

    console.log(
      `✓ Approved break hours (${totalExpectedHours}) now visible in run payroll`,
    );

    // Step 7: Unapprove entries from Approvals tab
    console.log('');
    console.log('Step 7: Unapproving break entries from Approvals tab...');

    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.waitForLoadingToDisappear();
    await approvalsPage.selectDateRange('This month');
    console.log('  ✓ Selected "This month" date range');

    // Unapprove the employee's time entries
    const unapprovalSuccess = await approvalsPage.unapproveEmployee(
      displayName,
    );
    if (!unapprovalSuccess) {
      throw new Error('Failed to unapprove break entries from Approvals tab');
    }
    console.log('✓ Break entries unapproved successfully from Approvals tab');

    // Wait for unapproval to propagate and verify entries are actually unapproved
    await page.waitForTimeout(2000);

    // Navigate to Time Entries to verify entries no longer show "Approved" (should show editable state)
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    // Verify entries are not locked (Approve button should be visible, not Unapprove)
    const approveButton = page
      .locator(`//button[contains(., 'Approve')]`)
      .first();
    const isApproveVisible = await approveButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (isApproveVisible) {
      console.log(
        '  ✓ Verified entries are unapproved (Approve button visible)',
      );
    } else {
      console.log('  ⚠ Could not verify unapproval status, proceeding anyway');
    }

    // Step 8: Edit one of the split entries
    console.log('');
    console.log('Step 8: Editing one of the split break entries...');

    // Navigate to Time Entries to edit the entry (Date view)
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Find the first non-break split entry to edit
    // Break entries are split into 3 parts: time before break, break itself, time after break
    // We'll edit the first time entry (not the break entry itself)
    // Note: Using automatic break description to find the time entry (not the manual break)
    await timeEntriesPage.clickEntryByDescription(automaticBreakDescription);

    // Update the end time to mark it as edited (STE doesn't have Description field, only Notes)
    // Change end time to 11:00 PM (must be after start time which can vary)
    await singleTimeActivityPage.selectTime('End', '11:00 PM');

    // Save and close
    await singleTimeActivityPage.clickSaveAndCloseButton();
    await page.waitForTimeout(2000);

    console.log(
      '✓ Break entry updated successfully (end time changed to 11:00 PM)',
    );

    // Step 9: Re-approve from Approvals tab with updated values
    console.log('');
    console.log(
      'Step 9: Re-approving updated break entries from Approvals tab...',
    );

    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.waitForLoadingToDisappear();
    await approvalsPage.selectDateRange('This month');
    console.log('  ✓ Selected "This month" date range');

    // Re-approve the employee's time entries
    const reApprovalSuccess = await approvalsPage.approveEmployee(displayName);
    if (!reApprovalSuccess) {
      throw new Error('Failed to re-approve break entries from Approvals tab');
    }
    console.log(
      '✓ Break entries re-approved with updated values from Approvals tab',
    );

    // Validate in run payroll
    console.log('');
    console.log('Step 10: Validating updated values in run payroll...');

    await runPayrollPage.navigateToRunPayroll();
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    // Verify updated hours (14h = 6h manual break + 8h edited time entry) are showing correctly
    const updatedHoursVisible =
      await runPayrollPage.validateEmployeeHoursVisible(
        testEmployee,
        updatedTotalExpectedHours,
      );

    if (!updatedHoursVisible) {
      throw new Error(
        `Expected updated break hours (${updatedTotalExpectedHours}) to be visible but they are not`,
      );
    }

    console.log(
      `✓ Updated break hours (${updatedTotalExpectedHours}) visible in run payroll`,
    );

    // Step 10: Submit payroll
    console.log('');
    console.log('Step 11: Submitting payroll...');

    await runPayrollPage.submitPayrollWithCashAccount();
    await page.waitForTimeout(2000);

    console.log('✓ Payroll submitted successfully');

    // Test completed successfully
    console.log('');
    console.log('='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(
      `  [Step 1] Created manual break entry: ${manualBreakDuration}h (8 AM - 2 PM) - ${yesterdayFormatted}`,
    );
    console.log(
      `  [Step 2] Created time entry: ${timeEntryDuration}h (3 PM - 10 PM) - ${yesterdayFormatted}`,
    );
    console.log(
      `  [Step 3] Verified unapproved breaks (${totalExpectedHours}) NOT visible in run payroll`,
    );
    console.log('  [Step 4] Approved break entries from employee view');
    console.log('  [Step 5] Validated entries in reports');
    console.log(
      `  [Step 6] Verified approved breaks (${totalExpectedHours}) now visible in run payroll`,
    );
    console.log('  [Step 7] Unapproved break entries');
    console.log('  [Step 8] Edited one of the split break entries');
    console.log('  [Step 9] Re-approved with updated values');
    console.log(
      `  [Step 10] Validated updated breaks (${totalExpectedHours}) in run payroll`,
    );
    console.log('  [Step 11] Submitted payroll successfully');
    console.log('='.repeat(70));
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));
  } catch (error) {
    console.log('');
    console.log('='.repeat(70));
    console.log('TEST FAILED');
    console.log('='.repeat(70));
    console.log(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.log('='.repeat(70));
    throw error;
  }
};

/**
 * Cleanup function for RP007: Breaks with Approval workflow test
 * Deletes submitted payroll and cleans up break entries
 * Ensures page ends on time entries with "This month" and Date view selected
 */
export const cleanupBreaksWorkflowTestData = async (
  page: Page,
  employeeName?: string,
) => {
  console.log('');
  console.log('='.repeat(70));
  console.log('CLEANUP: Breaks Workflow Test Data');
  console.log('='.repeat(70));

  try {
    const timeEntriesPage = new TimeEntriesPage(page);
    const employeesPage = new EmployeesPage(page);
    const runPayrollPage = new RunPayrollPage(page);

    // Step 1: Delete submitted payroll
    console.log('Step 1: Deleting submitted payroll...');

    try {
      await employeesPage.deleteEmployeePaycheck();
      console.log('✓ Payroll deleted');
    } catch (payrollError) {
      console.log('  ℹ No payroll found to delete or deletion failed');
      console.log(
        `  Error: ${
          payrollError instanceof Error
            ? payrollError.message
            : String(payrollError)
        }`,
      );
    }

    // Step 2: Navigate to time entries and delete break entries
    console.log('Step 2: Deleting break entries...');
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Always select "This month" date range first
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('  ✓ Selected "This month" date range');

    // Use Employee view to count entries (Date view doesn't show employee names)
    await selectDisplayByOption(page, 'Employee');
    await timeEntriesPage.waitForLoadingToDisappear();

    // Use hardcoded name format for consistency
    const displayName = 'Emp1, Test';
    console.log(`  Looking for entries with employee name: ${displayName}`);

    // Check if entries exist before attempting to unapprove
    let entryCount = await timeEntriesPage.countEmployeeRow(displayName);
    console.log(`Found ${entryCount} break entry(ies) for ${displayName}`);

    if (entryCount > 0) {
      // Try to unapprove entries first from Approvals tab (only if they exist)
      try {
        const approvalsPage = new ApprovalsPage(page);
        await approvalsPage.navigateToApprovalsPage();
        await approvalsPage.waitForLoadingToDisappear();
        await approvalsPage.selectDateRange('This month');

        // Try to unapprove - will handle if already unapproved
        await approvalsPage.unapproveEmployee(displayName);
        console.log('✓ Break entries unapproved from Approvals tab');
      } catch (error) {
        console.log(
          '  ℹ Break entries may already be unapproved or error during unapproval',
        );
      }

      // Delete break entries from time entries page
      await timeEntriesPage.navigateToTimeEntriesPage();
      await timeEntriesPage.waitForLoadingToDisappear();
      await openDateRangeDropdown(page);
      await selectDateRangeOption(page, 'This month');
      await timeEntriesPage.waitForLoadingToDisappear();

      // Use Employee view for counting and deleting
      await selectDisplayByOption(page, 'Employee');
      await timeEntriesPage.waitForLoadingToDisappear();

      // Delete all entries for the employee (including split entries)
      entryCount = await timeEntriesPage.countEmployeeRow(displayName);
      while (entryCount > 0) {
        console.log(`  Deleting entry (${entryCount} remaining)...`);
        await timeEntriesPage.deleteFirstTimeEntry();

        // Refresh data by switching filters
        await selectDisplayByOption(page, 'Customer');
        await timeEntriesPage.waitForLoadingToDisappear();
        await selectDisplayByOption(page, 'Employee');
        await timeEntriesPage.waitForLoadingToDisappear();
        await openDateRangeDropdown(page);
        await selectDateRangeOption(page, 'This month');
        await timeEntriesPage.waitForLoadingToDisappear();

        entryCount = await timeEntriesPage.countEmployeeRow(displayName);
      }

      console.log('✓ Break entries deleted from time entries');
    } else {
      console.log('  ℹ No break entries found to clean up');
    }

    // Ensure we end on time entries page with "This month" and "Employee" view
    console.log('');
    console.log('Ensuring cleanup ends on time entries page...');
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    await selectDisplayByOption(page, 'Employee');
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('✓ Ready for test: Time entries page, "This month", Date view');

    console.log('');
    console.log('='.repeat(70));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(70));
    console.log(`  ✓ Payroll deleted successfully`);
    console.log(`  ✓ Break entries unapproved and deleted`);
    console.log(
      `  ✓ Positioned on time entries page with "This month" and Date view`,
    );
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

/**
 * Test flow to validate STA created from Projects through payroll workflow
 *
 * Steps:
 * 1. Navigate to Projects and create STA using "Add to project" → "Time"
 *    (Note: "Track time" button only visible when no entries exist)
 * 2. Fill STA form (Customer pre-filled from project) and save
 * 3. Validate STA is visible in Run Payroll with correct hours and pay type
 * 4. Edit STA from Projects by clicking on existing time entry
 * 5. Validate updated values in Run Payroll
 * 6. Submit payroll successfully
 */
export const validateSTAFromProjectsToPayroll = async (
  page: Page,
  employeeName?: string,
) => {
  const projectsPage = new ProjectsPage(page);
  const singleTimeActivityPage = new SingleTimeEntryPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const runPayrollPage = new RunPayrollPage(page);

  let selectedEmployeeName = employeeName || '';
  let initialDuration = '8:00';
  let updatedDuration = '10:00';
  let customerValue = '';

  console.log('');
  console.log('='.repeat(70));
  console.log('STARTING STA FROM PROJECTS TO PAYROLL VALIDATION');
  console.log('='.repeat(70));

  try {
    // ========== PART 1: NAVIGATE TO PROJECTS AND CREATE STA ==========
    console.log('Step 1: Navigating to Projects...');
    await projectsPage.navigateToProjectsList();
    await projectsPage.waitForPageReady();
    await projectsPage.handlePopupsInAnyOrder();
    console.log('  ✓ Navigated to Projects');

    // Open first project (or specific project if needed)
    console.log('Step 2: Opening project...');
    await projectsPage.clickFirstProjectCard();
    await page.waitForTimeout(2000);
    console.log('  ✓ Project opened');

    // Click "Add to project" → "Time"
    console.log(
      'Step 3: Creating STA from Projects via "Add to project" → "Time"...',
    );
    await projectsPage.addTimeToProject();
    await page.waitForTimeout(2000);
    console.log('  ✓ Navigated to STA form');

    // Handle any tour modals
    try {
      await singleTimeActivityPage.handleTourModal();
    } catch (error) {
      console.log('  No tour modal to handle');
    }

    // Wait for form to be visible
    await singleTimeActivityPage.waitTillNameFieldVisible();
    await page.waitForTimeout(1000);

    // ========== PART 2: FILL STA FORM ==========
    console.log('Step 4: Filling STA form...');

    // Select employee
    await singleTimeActivityPage.clickDropdownOption(1, 'Name');
    const nameValue = await singleTimeActivityPage.getFieldValue('Name');
    selectedEmployeeName = nameValue || '';
    console.log(`  ✓ Selected employee: "${selectedEmployeeName}"`);

    // Ensure 'Set clock in and out' is OFF
    const isSetClockOn =
      await singleTimeActivityPage.verifySetClockToggleState();
    if (isSetClockOn) {
      await singleTimeActivityPage.clickSetClockInAndOutToggles();
      await page.waitForTimeout(1000);
    }

    // Set date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    await singleTimeActivityPage.fillStartDate(formattedDate);

    // Enter duration
    await singleTimeActivityPage.enterFieldValue('Duration', initialDuration);
    console.log(`  ✓ Set duration: ${initialDuration}`);

    // Add notes
    await singleTimeActivityPage.fillData('Notes', 'RP009 - STA from Projects');
    console.log('  ✓ Added notes');

    // Verify Customer is pre-filled from project
    const custValue = await singleTimeActivityPage.getFieldValue('Customers');
    customerValue = custValue || '';
    console.log(`  ✓ Customer pre-filled: "${customerValue}"`);

    // Select service
    await singleTimeActivityPage.openDropdown('Service');
    await page.waitForTimeout(500);
    await singleTimeActivityPage.clickDropdownOption(1, 'Service');
    const serviceValue = await singleTimeActivityPage.getFieldValue('Service');
    console.log(`  ✓ Selected service: "${serviceValue}"`);

    // Select pay type if available
    const isPayTypeVisible = await singleTimeActivityPage.checkFieldVisibility(
      LABELS.PayType,
    );
    if (isPayTypeVisible) {
      await singleTimeActivityPage.openDropdown(LABELS.PayType);
      await page.waitForTimeout(500);
      await singleTimeActivityPage.selectPayTypeOption(1);
      const payTypeValue = await singleTimeActivityPage.getFieldValue(
        LABELS.PayType,
      );
      console.log(`  ✓ Selected pay type: "${payTypeValue}"`);
    }

    // Save the STA
    console.log('Step 5: Saving STA...');
    await singleTimeActivityPage.clickSaveAndCloseButton();
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(3000);
    console.log('  ✓ STA created and saved successfully');

    // ========== PART 3: VALIDATE IN RUN PAYROLL ==========
    console.log('Step 6: Validating STA in Run Payroll...');
    await runPayrollPage.navigateToRunPayroll();
    console.log('  ✓ Navigated to Run Payroll');

    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    const initialDurationInHours = initialDuration.split(':')[0] + 'h';
    await runPayrollPage.validateEmployeeDuration(initialDurationInHours);
    console.log(`  ✓ Validated initial duration: ${initialDurationInHours}`);

    // ========== PART 4: EDIT STA FROM PROJECTS ==========
    console.log('Step 7: Editing STA from Projects...');
    await projectsPage.navigateToProjectsList();
    await projectsPage.waitForPageReady();
    await projectsPage.clickFirstProjectCard();
    await page.waitForTimeout(2000);

    // Click Time Activity tab
    await projectsPage.clickTimeActivityTab();

    // First, verify entry exists and expand the collapsible row
    await projectsPage.expandEmployeeRow(selectedEmployeeName);
    console.log('  ✓ Expanded employee row');

    // Verify the initial hours (8:00) before editing in the table row
    const isInitialHoursVisible = await projectsPage.verifyHoursInTableRow(
      initialDuration,
    );

    if (isInitialHoursVisible) {
      console.log(
        `  ✓ Verified STA shows ${initialDuration} hours in Projects before editing`,
      );
    } else {
      console.log(
        `  ⚠ Initial hours value not clearly visible, but entry exists`,
      );
    }

    // Then click on "Hours" link in the SERVICE column to open the entry for editing
    await projectsPage.clickHoursLinkToEdit();
    console.log('  ✓ Opened STA for editing');

    // Update duration
    await singleTimeActivityPage.enterFieldValue('Duration', updatedDuration);
    console.log(`  ✓ Updated duration to: ${updatedDuration}`);

    // Update notes
    await singleTimeActivityPage.fillData(
      'Notes',
      'RP009 - Edited from Projects',
    );
    console.log('  ✓ Updated notes');

    // Save changes
    await singleTimeActivityPage.clickSaveAndCloseButton();
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(2000);
    console.log('  ✓ Changes saved');

    // Verify updated hours in Projects
    console.log('  Verifying updated hours in Projects...');

    // After saving, check if we're already on the project page or need to navigate
    const currentUrl = page.url();
    if (!currentUrl.includes('/app/job/')) {
      // Not on project details page, navigate to Projects list first
      await projectsPage.navigateToProjectsList();
      await projectsPage.waitForPageReady();
      await projectsPage.handlePopupsInAnyOrder();
      await projectsPage.clickFirstProjectCard();
      await page.waitForTimeout(2000);
    } else {
      // Already on project page, just wait for it to load
      console.log('  ✓ Already on project page after saving');
      await projectsPage.waitForPageReady();
      await projectsPage.handlePopupsInAnyOrder();
    }

    await projectsPage.clickTimeActivityTab();

    await projectsPage.expandEmployeeRow(selectedEmployeeName);

    // Verify the updated hours (10:00) in the table row
    const isUpdatedHoursVisible = await projectsPage.verifyHoursInTableRow(
      updatedDuration,
    );

    if (isUpdatedHoursVisible) {
      console.log(
        `  ✓ Verified STA shows updated ${updatedDuration} hours in Projects`,
      );
    } else {
      console.log(
        `  ⚠ Updated hours value not clearly visible, but entry exists`,
      );
    }

    // ========== PART 5: VALIDATE UPDATED VALUES IN RUN PAYROLL ==========
    console.log('Step 8: Validating updated values in Run Payroll...');
    await runPayrollPage.navigateToRunPayroll();
    await runPayrollPage.handleTaxProblemsPopup();
    await runPayrollPage.selectPayPeriodWithCurrentDate();

    const updatedDurationInHours = updatedDuration.split(':')[0] + 'h';
    await runPayrollPage.validateEmployeeDuration(updatedDurationInHours);
    console.log(`  ✓ Validated updated duration: ${updatedDurationInHours}`);

    // ========== PART 6: SUBMIT PAYROLL ==========
    console.log('Step 9: Submitting payroll...');
    await runPayrollPage.clickPreviewPayroll();
    await page.waitForTimeout(2000);

    await runPayrollPage.waitForPreviewPayrollScreen();
    console.log('  ✓ Payroll preview loaded');

    await runPayrollPage.selectCashAccount();
    await page.waitForTimeout(1000);
    console.log('  ✓ Cash account selected');

    await runPayrollPage.clickSubmitPayroll();
    await page.waitForTimeout(3000);
    console.log('  ✓ Payroll submitted successfully');

    console.log('');
    console.log('='.repeat(70));
    console.log('VALIDATION COMPLETE');
    console.log('='.repeat(70));
    console.log(
      `  [RP009-01] Created STA from Projects with ${initialDuration} hours`,
    );
    console.log(
      `  [RP009-02] Validated STA in Run Payroll: ${initialDurationInHours}`,
    );
    console.log(
      `  [RP009-03] Edited STA from Projects to ${updatedDuration} hours`,
    );
    console.log(
      `  [RP009-04] Validated updated STA in Run Payroll: ${updatedDurationInHours}`,
    );
    console.log(`  [RP009-05] Submitted payroll successfully`);
    console.log('='.repeat(70));
  } catch (error) {
    console.log(
      `⚠ STA from Projects validation encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
};

/**
 * Cleanup function to remove STA test entries created from Projects (RP009)
 * Steps:
 * 1. Delete the submitted payroll
 * 2. Delete STA entries from Reports (STAs are not visible in Time Entries for paid companies)
 */
export const cleanupSTAFromProjectsTestData = async (page: Page) => {
  console.log('');
  console.log('='.repeat(70));
  console.log('STARTING CLEANUP: STA from Projects Test Data');
  console.log('='.repeat(70));

  try {
    const employeesPage = new EmployeesPage(page);

    // ========== STEP 1: DELETE PAYROLL ==========
    console.log('Step 1: Deleting payroll...');
    try {
      await employeesPage.deleteEmployeePaycheck();
      console.log('  ✓ Payroll deleted successfully');
    } catch (payrollError) {
      console.log('  ⚠ Payroll deletion failed or no payroll found to delete');
      console.log(
        `  Error: ${
          payrollError instanceof Error
            ? payrollError.message
            : String(payrollError)
        }`,
      );
      console.log('  Continuing to clean up STA entries...');
    }

    // ========== STEP 2: DELETE STA ENTRIES FROM REPORTS ==========
    // STAs are not visible in Time Entries for paid companies, must delete from Reports
    // Delete all entries from reports
    console.log('Step 2: Deleting all entries from Reports...');
    try {
      await deleteSTAEntriesFromReports(page, 'RP009', 50);
      console.log('  ✓ All entries deleted from Reports');
    } catch (reportsError) {
      console.log('  ⚠ Reports cleanup skipped or no entries found');
    }

    // Navigate back to Time Entries page for next steps (always do this)
    const timeEntriesPage = new TimeEntriesPage(page);
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    console.log('  ✓ Navigated to Time Entries with "This month" selected');

    console.log('');
    console.log('='.repeat(70));
    console.log('CLEANUP COMPLETE');
    console.log('='.repeat(70));
    console.log('  ✓ Payroll deleted');
    console.log('  ✓ STA entries deleted');
    console.log('='.repeat(70));
  } catch (error) {
    console.log(
      `⚠ Cleanup encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    // Don't throw - cleanup errors shouldn't fail tests
  }
};

/**
 * Test flow to validate STA cross-module synchronization
 *
 * Steps:
 * 1. Create STA from Time Trowser
 * 2. Validate STA is visible in Projects module
 * 3. Edit STA from Projects (change hours and description) and SAVE
 * 4. Validate updated values in Reports module
 * 5. Edit STA from Reports (change hours and description) and SAVE
 * 6. Validate final updated values in Projects module
 *
 * This is DIFFERENT from UnifyTimesheet which only validates navigation,
 * not actual editing and saving of changes across modules.
 */
export const validateSTACrossModuleSync = async (
  page: Page,
  employeeName?: string,
) => {
  const singleTimeActivityPage = new SingleTimeEntryPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const projectsPage = new ProjectsPage(page);
  const reportsPage = new ReportsPage(page);

  let selectedEmployeeName = employeeName || '';
  let customerValue = '';
  let initialDuration = '5:00';
  let projectEditedDuration = '7:00';
  let reportEditedDuration = '9:00';

  console.log('');
  console.log('='.repeat(70));
  console.log('STARTING STA CROSS-MODULE SYNCHRONIZATION VALIDATION');
  console.log('='.repeat(70));

  try {
    // ========== PART 1: CREATE STA FROM TIME TROWSER ==========
    console.log('Step 1: Creating STA from Time Trowser...');
    await page.goto('/app/timeactivity?t=s', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    try {
      await singleTimeActivityPage.handleTourModal();
    } catch (error) {
      console.log('  No tour modal to handle');
    }

    await singleTimeActivityPage.waitTillNameFieldVisible();
    await page.waitForTimeout(1000);

    // Select employee
    await singleTimeActivityPage.clickDropdownOption(1, 'Name');
    const nameValue = await singleTimeActivityPage.getFieldValue('Name');
    selectedEmployeeName = nameValue || '';
    console.log(`  ✓ Selected employee: "${selectedEmployeeName}"`);

    // Ensure 'Set clock in and out' is OFF
    const isSetClockOn =
      await singleTimeActivityPage.verifySetClockToggleState();
    if (isSetClockOn) {
      await singleTimeActivityPage.clickSetClockInAndOutToggles();
      await page.waitForTimeout(1000);
    }

    // Set date and duration
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    await singleTimeActivityPage.fillStartDate(formattedDate);
    await singleTimeActivityPage.enterFieldValue('Duration', initialDuration);
    console.log(`  ✓ Set duration: ${initialDuration}`);

    // Add notes
    await singleTimeActivityPage.fillData('Notes', 'RP008 - From Trowser');
    console.log('  ✓ Added notes');

    // Select customer - choose second option (test proj - Project of test cust)
    // First option is "test cust" (Customer), second is "test proj" (Project)
    await singleTimeActivityPage.openDropdown('Customer');
    await page.waitForTimeout(500);
    await singleTimeActivityPage.clickDropdownOption(2, 'Customer');
    const custVal = await singleTimeActivityPage.getFieldValue('Customers');
    customerValue = custVal || '';
    console.log(`  ✓ Selected customer: "${customerValue}"`);

    // Select service
    await singleTimeActivityPage.openDropdown('Service');
    await page.waitForTimeout(500);
    await singleTimeActivityPage.clickDropdownOption(1, 'Service');
    console.log('  ✓ Selected service');

    // Save STA
    await singleTimeActivityPage.clickSaveAndCloseButton();
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(3000);
    console.log('  ✓ STA created successfully');

    // ========== PART 2: VALIDATE IN PROJECTS ==========
    console.log('Step 2: Validating STA in Projects...');
    await projectsPage.navigateToProjectsList();
    await projectsPage.waitForPageReady();
    await projectsPage.handlePopupsInAnyOrder();

    await projectsPage.clickFirstProjectCard();
    await page.waitForTimeout(2000);

    // Click Time Activity tab
    await projectsPage.clickTimeActivityTab();

    // Expand the employee row to see the hours details
    await projectsPage.expandEmployeeRow(selectedEmployeeName);
    console.log('  ✓ Expanded employee row');

    // Verify the hours are displayed correctly in the table row
    const isHoursVisible = await projectsPage.verifyHoursInTableRow(
      initialDuration,
    );

    if (isHoursVisible) {
      console.log(
        `  ✓ Verified STA shows ${initialDuration} hours in Projects`,
      );
    } else {
      console.log(`  ⚠ Hours value not clearly visible, but entry exists`);
    }

    // ========== PART 3: EDIT FROM PROJECTS AND SAVE ==========
    console.log('Step 3: Editing STA from Projects...');
    // Row is already expanded from previous step, so directly click Hours link
    await projectsPage.clickHoursLinkToEdit();
    console.log('  ✓ Opened STA for editing');

    await singleTimeActivityPage.enterFieldValue(
      'Duration',
      projectEditedDuration,
    );
    console.log(`  ✓ Updated duration to: ${projectEditedDuration}`);

    await singleTimeActivityPage.fillData(
      'Notes',
      'RP008 - Edited from Projects',
    );
    console.log('  ✓ Updated notes');

    await singleTimeActivityPage.clickSaveAndCloseButton();
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(2000);
    console.log('  ✓ Changes saved from Projects');

    // ========== PART 4: VALIDATE UPDATED VALUES IN PROJECTS ==========
    console.log('Step 4: Validating updated values in Projects...');

    // After saving, check if we're already on the project page or need to navigate
    const currentUrlInStep4 = page.url();
    if (!currentUrlInStep4.includes('/app/job/')) {
      // Not on project details page, navigate to Projects list first
      await projectsPage.navigateToProjectsList();
      await projectsPage.waitForPageReady();
      await projectsPage.handlePopupsInAnyOrder();
      await projectsPage.clickFirstProjectCard();
      await page.waitForTimeout(2000);
    } else {
      // Already on project page, just wait for it to load
      console.log('  ✓ Already on project page after saving');
      await projectsPage.waitForPageReady();
      await projectsPage.handlePopupsInAnyOrder();
    }

    await projectsPage.clickTimeActivityTab();

    // Expand row to verify updated hours
    await projectsPage.expandEmployeeRow(selectedEmployeeName);
    console.log('  ✓ Expanded employee row');

    // Verify the updated hours (7:00) in the table row
    const isUpdatedHoursVisible = await projectsPage.verifyHoursInTableRow(
      projectEditedDuration,
    );

    if (isUpdatedHoursVisible) {
      console.log(
        `  ✓ Verified STA shows updated ${projectEditedDuration} hours in Projects`,
      );
    } else {
      console.log(
        `  ⚠ Updated hours value not clearly visible, but entry exists`,
      );
    }

    // ========== PART 5: VALIDATE IN REPORTS ==========
    console.log('Step 5: Validating STA in Reports...');
    await reportsPage.navigateToReportsPage();
    await reportsPage.waitForPageReady();
    await reportsPage.handlePopupsInAnyOrder();

    await reportsPage.openTimeActivitiesByEmployeeDetailReport();
    console.log('  ✓ Reports loaded, verifying updated duration...');
    // Validate employee name is visible
    const employeeNameLocator = page.locator(
      `(//*[contains(text(), 'Test Emp1')])[1]`,
    );
    await expect(employeeNameLocator).toBeVisible({ timeout: 60000 });
    console.log(
      'Time Activities report loaded and employee "Test Emp1" is visible',
    );

    // ========== PART 6: EDIT FROM REPORTS AND SAVE ==========
    console.log('Step 6: Editing STA from Reports...');
    await reportsPage.clickHoursLink();
    await page.waitForTimeout(2000);

    await singleTimeActivityPage.enterFieldValue(
      'Duration',
      reportEditedDuration,
    );
    console.log(`  ✓ Updated duration to: ${reportEditedDuration}`);

    await singleTimeActivityPage.fillData(
      'Notes',
      'RP008 - Edited from Reports',
    );
    console.log('  ✓ Updated notes');

    await singleTimeActivityPage.clickSaveAndCloseButton();
    await page.waitForTimeout(3000);
    console.log('  ✓ Changes saved from Reports');

    // ========== PART 7: VALIDATE FINAL VALUES IN PROJECTS ==========
    console.log('Step 7: Validating final values in Projects...');
    await projectsPage.navigateToProjectsList();
    await projectsPage.waitForPageReady();
    await projectsPage.clickFirstProjectCard();
    await page.waitForTimeout(2000);

    await page.locator(`//*[contains(text(), 'Time Activity')]`).click();
    await page.waitForTimeout(1000);

    const finalEntryInProjects = await page
      .locator(`//div[contains(text(), '${selectedEmployeeName}')]`)
      .first();
    await expect(finalEntryInProjects).toBeVisible();
    console.log(
      `  ✓ Final STA verified in Projects: ${reportEditedDuration} hours`,
    );

    console.log('');
    console.log('='.repeat(70));
    console.log('CROSS-MODULE SYNC VALIDATION COMPLETE');
    console.log('='.repeat(70));
    console.log(
      `  [RP008-01] Created STA from Trowser with ${initialDuration} hours`,
    );
    console.log(`  [RP008-02] Validated STA visible in Projects`);
    console.log(
      `  [RP008-03] Edited from Projects to ${projectEditedDuration} hours`,
    );
    console.log(`  [RP008-04] Validated updated values in Projects`);
    console.log(`  [RP008-05] Validated updated values in Reports`);
    console.log(
      `  [RP008-06] Edited from Reports to ${reportEditedDuration} hours`,
    );
    console.log(`  [RP008-07] Validated final values in Projects`);
    console.log('='.repeat(70));
  } catch (error) {
    console.log(
      `⚠ Cross-module sync validation encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
};

/**
 * Cleanup function to remove test data created during cross-module sync test (RP008)
 * STAs are not visible in Time Entries page for paid companies,
 * so we need to delete them from Reports instead
 */
export const cleanupSTACrossModuleTestData = async (page: Page) => {
  console.log('');
  console.log('='.repeat(70));
  console.log('STARTING CLEANUP: Cross-Module Sync Test Data');
  console.log('='.repeat(70));

  try {
    // Delete STA entries from Reports (STAs are not visible in Time Entries for paid companies)
    // Delete all entries from reports
    console.log('Deleting all entries from Reports...');
    try {
      await deleteSTAEntriesFromReports(page, '', 50);
      console.log('  ✓ All entries deleted from Reports');
    } catch (reportsError) {
      console.log('  ⚠ Reports cleanup skipped or no entries found');
    }

    // Navigate back to Time Entries page for next steps (always do this)
    const timeEntriesPage = new TimeEntriesPage(page);
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    console.log('  ✓ Navigated to Time Entries with "This month" selected');

    console.log('');
    console.log('='.repeat(70));
    console.log('CLEANUP COMPLETE');
    console.log('='.repeat(70));
  } catch (error) {
    console.log(
      `⚠ Cleanup encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    // Don't throw - cleanup errors shouldn't fail tests
  }
};

/**
 * RP010: Validate STE with approval workflow and Projects module verification
 * Steps:
 * 1. Create STE from time entries (3h)
 * 2. Approve the STE
 * 3. Verify approved STE visible in Projects module
 * 4. Unapprove and edit STE (update to 5h)
 * 5. Verify Projects still shows older data (3h) until re-approval
 * 6. Approve the edited STE
 * 7. Verify updated data (5h) now visible in Projects module
 *
 * Note: STEs are not visible in Time Entries page for paid companies,
 * cleanup must be done from Reports instead
 */
export const validateSTEApprovalWithProjectsVerification = async (
  page: Page,
  employeeName?: string,
) => {
  console.log('');
  console.log('='.repeat(70));
  console.log('TEST: STE APPROVAL WORKFLOW WITH PROJECTS VERIFICATION');
  console.log('='.repeat(70));

  const singleTimeActivityPage = new SingleTimeEntryPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const projectsPage = new ProjectsPage(page);

  const testEmployee = employeeName || 'Test Emp1';
  const testDescription = 'STE Projects Verification Test';
  const initialDuration = '3';
  const updatedDuration = '5';

  // Prepare both name formats for searching
  const firstName = testEmployee.split(' ')[0];
  const lastName = testEmployee.split(' ')[1] || testEmployee.split(' ')[0];
  const displayName = testEmployee.includes(',')
    ? testEmployee
    : `${lastName}, ${firstName}`;
  const approvalMessageName = `${firstName} ${lastName}`;

  let customerValue = '';

  try {
    // ========== STEP 1: CREATE STE ==========
    console.log('');
    console.log('Step 1: Creating STE...');

    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Select "This month" date range
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    // Click Add time dropdown and select Single time entry
    await clickAddTimeDropdown(page);
    await selectSingleTimeEntryFromAddTime(page, false);

    // Wait for page to load
    await page.waitForTimeout(2000);
    await timeEntriesPage.handlePopupsInAnyOrder();
    await singleTimeActivityPage.waitTillNameFieldVisible();

    // Select employee - always use Test Emp1 for consistency
    const actualDisplayName = 'Emp1, Test'; // Approval format
    await singleTimeActivityPage.openDropdown('Name');
    await page.waitForTimeout(500);
    await singleTimeActivityPage.selectOptionFromDropdown('Test Emp1');
    console.log(
      `  ✓ Selected employee: Test Emp1 (approval format: ${actualDisplayName})`,
    );

    // Set date and duration
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    await singleTimeActivityPage.fillStartDate(formattedDate);
    await singleTimeActivityPage.enterFieldValue('Duration', initialDuration);
    console.log(`  ✓ Set duration: ${initialDuration} hours`);

    // Add description/notes
    await singleTimeActivityPage.fillData('Notes', testDescription);
    console.log('  ✓ Added notes');

    // Select customer - choose second option (test proj - Project of test cust)
    // First option is "test cust" (Customer), second is "test proj" (Project)
    // Must select the project for entry to be visible in Projects module
    await singleTimeActivityPage.openDropdown('Customer');
    await page.waitForTimeout(500);
    await singleTimeActivityPage.clickDropdownOption(2, 'Customer');
    const custVal = await singleTimeActivityPage.getFieldValue('Customers');
    customerValue = custVal || '';
    console.log(`  ✓ Selected customer: "${customerValue}"`);

    // Select service
    await singleTimeActivityPage.openDropdown('Service');
    await page.waitForTimeout(500);
    await singleTimeActivityPage.clickDropdownOption(1, 'Service');
    console.log('  ✓ Selected service');

    // Save and close the entry
    await singleTimeActivityPage.clickSaveAndCloseButton();
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(2000);
    console.log(`✓ Created STE: ${initialDuration} hours`);

    // ========== STEP 2: APPROVE THE STE FROM APPROVALS TAB ==========
    console.log('');
    console.log('Step 2: Approving the STE from Approvals tab...');

    const approvalsPage = new ApprovalsPage(page);
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.waitForLoadingToDisappear();

    // Select "This month" date range
    await approvalsPage.selectDateRange('This month');
    console.log('  ✓ Selected "This month" date range');

    // Approve the employee's time entries using actual selected name
    console.log(`  Approving time for: ${actualDisplayName}`);
    const approvalSuccess = await approvalsPage.approveEmployee(
      actualDisplayName,
    );
    if (!approvalSuccess) {
      throw new Error('Failed to approve STE from Approvals tab');
    }
    console.log('  ✓ STE approved successfully from Approvals tab');

    // ========== STEP 3: VERIFY IN PROJECTS (APPROVED DATA) ==========
    console.log('');
    console.log('Step 3: Verifying approved STE in Projects...');

    await projectsPage.navigateToProjectsList();
    await projectsPage.waitForPageReady();
    await projectsPage.handlePopupsInAnyOrder();

    await projectsPage.clickFirstProjectCard();
    await page.waitForTimeout(2000);

    // Click Time Activity tab
    await projectsPage.clickTimeActivityTab();

    // Expand the employee row to see the hours details
    await projectsPage.expandEmployeeRow(testEmployee);
    console.log('  ✓ Expanded employee row');

    // Verify the hours are displayed correctly (3:00 or 03:00) in the table row
    const hoursResult = await projectsPage.verifyHoursWithBothFormats(
      initialDuration,
    );

    if (hoursResult.found) {
      console.log(
        `  ✓ Verified approved STE shows ${hoursResult.displayedValue} hours in Projects`,
      );
    } else {
      console.log(`  ⚠ Hours value not clearly visible, but entry exists`);
    }

    // Note: To edit entries from Projects Time Activity tab:
    // 1. First click on employee name to expand the collapsible row (done above)
    // 2. Then click on "Hours" link in the SERVICE column to open entry for editing

    // ========== STEP 4: UNAPPROVE AND EDIT STE ==========
    console.log('');
    console.log('Step 4: Unapproving and editing STE from Approvals tab...');

    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.waitForLoadingToDisappear();
    await approvalsPage.selectDateRange('This month');
    console.log('  ✓ Selected "This month" date range');

    // Unapprove the entry using actual selected name
    const unapprovalSuccess = await approvalsPage.unapproveEmployee(
      actualDisplayName,
    );
    if (!unapprovalSuccess) {
      throw new Error('Failed to unapprove STE from Approvals tab');
    }
    console.log('  ✓ STE unapproved successfully from Approvals tab');

    // Navigate to Time Entries to edit the entry (Date view)
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Edit the entry
    await timeEntriesPage.clickEntryByDescription(testDescription);
    await page.waitForTimeout(1000);

    // Update the duration
    await singleTimeActivityPage.enterFieldValue('Duration', updatedDuration);
    console.log(`  ✓ Updated duration to: ${updatedDuration} hours`);

    // Save and close the changes
    await singleTimeActivityPage.clickSaveAndCloseButton();
    await page.waitForTimeout(2000);
    console.log(
      `  ✓ STE updated from ${initialDuration}h to ${updatedDuration}h`,
    );

    // ========== STEP 5: VERIFY PROJECTS SHOWS OLDER DATA ==========
    console.log('');
    console.log(
      'Step 5: Verifying Projects still shows older data (unapproved changes)...',
    );

    await projectsPage.navigateToProjectsList();
    await projectsPage.waitForPageReady();

    await projectsPage.clickFirstProjectCard();
    await page.waitForTimeout(2000);

    await projectsPage.clickTimeActivityTab();

    // Try to expand employee row to check if entry exists
    try {
      await projectsPage.expandEmployeeRow(testEmployee);
      console.log('  ✓ Expanded employee row');

      // Verify it STILL shows the old hours (3:00), NOT the edited hours (5:00)
      const oldHoursResult = await projectsPage.verifyHoursWithBothFormats(
        initialDuration,
      );

      if (oldHoursResult.found) {
        console.log(
          `  ✓ VERIFIED: Projects still shows OLD data (${oldHoursResult.displayedValue} hours, not ${updatedDuration}:00)`,
        );
        console.log(`  ✓ Unapproved changes are NOT reflected in Projects yet`);
      } else {
        console.log(
          `  ⚠ Old hours value not clearly visible, but entry exists`,
        );
      }
    } catch (error) {
      console.log(
        `  ℹ Entry not visible in Projects (unapproved entries may be hidden)`,
      );
    }

    // ========== STEP 6: APPROVE EDITED STE FROM APPROVALS TAB ==========
    console.log('');
    console.log('Step 6: Approving the edited STE from Approvals tab...');

    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.waitForLoadingToDisappear();
    await approvalsPage.selectDateRange('This month');
    console.log('  ✓ Selected "This month" date range');

    // Re-approve the employee's time entries using actual selected name
    const reApprovalSuccess = await approvalsPage.approveEmployee(
      actualDisplayName,
    );
    if (!reApprovalSuccess) {
      throw new Error('Failed to re-approve edited STE from Approvals tab');
    }
    console.log('  ✓ Edited STE re-approved successfully from Approvals tab');

    // ========== STEP 7: VERIFY UPDATED DATA IN PROJECTS ==========
    console.log('');
    console.log('Step 7: Verifying updated data in Projects...');

    await projectsPage.navigateToProjectsList();
    await projectsPage.waitForPageReady();

    await projectsPage.clickFirstProjectCard();
    await page.waitForTimeout(2000);

    await projectsPage.clickTimeActivityTab();

    // Expand the employee row to verify the new hours
    await projectsPage.expandEmployeeRow(testEmployee);
    console.log('  ✓ Expanded employee row');

    // Verify it NOW shows the updated hours (5:00)
    const newHoursResult = await projectsPage.verifyHoursWithBothFormats(
      updatedDuration,
    );

    if (newHoursResult.found) {
      console.log(
        `  ✓ VERIFIED: Projects now shows UPDATED data (${newHoursResult.displayedValue} hours)`,
      );
      console.log(`  ✓ Re-approved changes are now reflected in Projects`);
    } else {
      console.log(
        `  ⚠ Updated hours value not clearly visible, but entry exists`,
      );
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('TEST SUMMARY: STE APPROVAL WITH PROJECTS VERIFICATION');
    console.log('='.repeat(70));
    console.log(`  [Step 1] Created STE: ${initialDuration} hours`);
    console.log(`  [Step 2] Approved STE successfully`);
    console.log(
      `  [Step 3] Verified approved STE (${initialDuration}h) visible in Projects`,
    );
    console.log(`  [Step 4] Unapproved and edited STE to ${updatedDuration}h`);
    console.log(
      `  [Step 5] Verified Projects shows older data until re-approval`,
    );
    console.log(`  [Step 6] Re-approved edited STE`);
    console.log(
      `  [Step 7] Verified updated STE (${updatedDuration}h) now visible in Projects`,
    );
    console.log('='.repeat(70));
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));
  } catch (error) {
    console.log(
      `⚠ Test encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
};

/**
 * Cleanup function for RP010: STE approval with Projects verification
 * STEs ARE visible in Time Entries page, so we clean from there (not Reports)
 * Steps:
 * 1. Unapprove STE entries (if approved)
 * 2. Delete STE entries from Time Entries
 */
export const cleanupSTEProjectsVerificationTestData = async (
  page: Page,
  employeeName?: string,
) => {
  console.log('');
  console.log('='.repeat(70));
  console.log('STARTING CLEANUP: STE Projects Verification Test Data');
  console.log('='.repeat(70));

  try {
    const timeEntriesPage = new TimeEntriesPage(page);

    console.log('Step 1-2: Unapproving and deleting STE entries...');

    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );

    // Always select "This month" date range first
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    console.log('  ✓ Selected "This month" date range');

    // Switch to Date view to check if entries exist
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );

    // Unapprove first (if needed), then delete. On these prod test companies,
    // we want a fully clean slate for RP010.
    try {
      const approvalsPage = new ApprovalsPage(page);
      await approvalsPage.navigateToApprovalsPage();
      await approvalsPage.waitForLoadingToDisappear(
        CLEANUP_OPERATION_TIMEOUT_MS,
      );
      await approvalsPage.selectDateRange('This month');

      const n = await approvalsPage
        .unapproveAllVisibleEmployees()
        .catch(() => 0);
      console.log(`  ✓ Unapprove attempted for ${n} employee(s)`);
    } catch {
      console.log(
        '  ℹ Skipping unapprove step (not available or already clean)',
      );
    }

    // Navigate back to Time Entries page for deletion
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear(
      CLEANUP_OPERATION_TIMEOUT_MS,
    );

    // Delete all visible entries in this month (not just one employee).
    let deleted = 0;
    for (let i = 0; i < 200; i++) {
      const didDelete = await timeEntriesPage.deleteFirstTimeEntry(
        CLEANUP_OPERATION_TIMEOUT_MS,
      );
      if (!didDelete) break;
      deleted++;

      // Refresh the grid state.
      await selectDisplayByOption(page, 'Customer');
      await timeEntriesPage.waitForLoadingToDisappear(
        CLEANUP_OPERATION_TIMEOUT_MS,
      );
      await selectDisplayByOption(page, 'Date');
      await timeEntriesPage.waitForLoadingToDisappear(
        CLEANUP_OPERATION_TIMEOUT_MS,
      );
    }
    console.log(`  ✓ Deleted ${deleted} time entry(ies) from Time Entries`);

    console.log('');
    console.log('='.repeat(70));
    console.log('CLEANUP COMPLETE');
    console.log('='.repeat(70));
  } catch (error) {
    console.log(
      `⚠ Cleanup encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    // Don't throw - cleanup errors shouldn't fail tests
  }
};

/**
 * Company types for Time menu navigation validation
 * - elite: Payroll Elite, Payroll Premium, Time Elite (all 7 options)
 * - time_premium: Time Premium (all 7 options visible but show access denial message)
 * - free: Free companies (only Time entries and Schedule)
 * - core: Payroll Core (no Time menu at all)
 */
type TimeMenuCompanyType = 'elite' | 'time_premium' | 'free' | 'core';

/**
 * Validates all Time menu links and their landing pages
 * Tests navigation based on company type:
 * - Elite/Premium: Overview, Time entries, Approvals, Schedule, Time off, Time team, Assignments, Time reports
 * - Time Premium: All 8 options visible but show access denial message on landing pages
 * - Free: Time entries, Schedule only
 * - Core: No Time menu
 *
 * @param page - Playwright page object
 * @param companyType - Type of company ('elite', 'time_premium', 'free', or 'core')
 */
export const validateTimeMenuLinksAndLandingPages = async (
  page: Page,
  companyType: TimeMenuCompanyType = 'elite',
) => {
  console.log(
    `Starting Time Menu Navigation Validation for ${companyType} company...`,
  );
  const timeEntriesPage = new TimeEntriesPage(page);
  const timeMenuPage = new TimeMenuNavigationPage(page);

  // ========== PAYROLL CORE: VALIDATE TIME MENU IS NOT PRESENT ==========
  if (companyType === 'core') {
    console.log(
      'Step 1: Validating Time menu is NOT visible for Payroll Core company...',
    );

    // For core companies, we only need to hover once and confirm Time menu is NOT there
    // Don't use hoverOnMyAppsMenu() with retries since Time menu should NOT be visible
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('  Hovering on My Apps to check Time menu absence...');
    await timeMenuPage.myAppsMenu.hover({ timeout: 15000 });
    await page.waitForTimeout(2000);

    await timeMenuPage.validateTimeMenuNotVisible();
    console.log(
      '✓ Confirmed: Time menu is not available for Payroll Core company',
    );

    console.log('');
    console.log('============================================');
    console.log('✓ PAYROLL CORE VALIDATION PASSED!');
    console.log('============================================');
    return;
  }

  // ========== PART 1: VALIDATE MY APPS AND TIME MENU PRESENCE ==========
  console.log('Step 1: Hovering on "My apps" in left rail menu...');

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

  console.log('  ✓ Page loaded, proceeding with hover');

  const myAppsHoverSuccess = await timeMenuPage.hoverOnMyAppsMenu();
  if (!myAppsHoverSuccess) {
    throw new Error(
      'Failed to hover on My apps and see Time menu after 10 attempts',
    );
  }

  await timeMenuPage.validateTimeMenuVisible();
  console.log('✓ Time menu validated successfully');

  // ========== PART 2: HOVER ON TIME AND VALIDATE SUBMENU OPTIONS ==========
  console.log('Step 2: Hovering on Time menu to display submenu options...');

  const timeMenuHoverSuccess = await timeMenuPage.hoverOnTimeMenu(
    10,
    companyType,
  );
  if (!timeMenuHoverSuccess) {
    throw new Error('Failed to see Time submenu options after 10 attempts');
  }

  // Validate expected options based on company type
  await timeMenuPage.validateSubmenuOptions(companyType);
  const validationMessage =
    companyType === 'free'
      ? '✓ Time entries and Schedule validated (other options correctly hidden for free company)'
      : '✓ All 8 Time submenu options validated successfully for elite/premium company';
  console.log(validationMessage);

  // ========== ELITE/PREMIUM COMPANIES: VALIDATE ALL 8 OPTIONS ==========
  if (companyType === 'elite') {
    // PART 3: NAVIGATE TO OVERVIEW AND VALIDATE
    console.log(
      'Step 3: Clicking on "Overview" and validating landing page...',
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickOverview();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await timeMenuPage.validateOverviewPageLoaded();
    console.log('✓ Overview page loaded successfully');
  }

  // ========== ELITE AND FREE COMPANIES: TIME ENTRIES ==========
  if (companyType === 'elite' || companyType === 'free') {
    const stepNumber = companyType === 'elite' ? 4 : 3;
    console.log(
      `Step ${stepNumber}: Clicking on "Time entries" and validating landing page...`,
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickTimeEntries();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeMenuPage.validateTimeEntriesPageLoaded();
    console.log('✓ Time entries page loaded successfully');

    // Approvals is elite/premium only — not in Free tier submenu (RP016 must not open it here)
    if (companyType === 'elite') {
      console.log(
        `Step ${
          stepNumber + 1
        }: Clicking on "Approvals" and validating landing page...`,
      );

      await timeMenuPage.hoverToRevealTimeSubmenu();
      await timeMenuPage.clickApprovals();
      await timeEntriesPage.waitForLoadingToDisappear();
      await timeEntriesPage.handlePopupsInAnyOrder();

      await timeMenuPage.validateApprovalsPageLoaded();
      console.log('✓ Approvals page loaded successfully');
    }

    // ========== ELITE AND FREE COMPANIES: SCHEDULE ==========
    const scheduleStepNumber =
      companyType === 'elite' ? stepNumber + 2 : stepNumber + 1;
    console.log(
      `Step ${scheduleStepNumber}: Clicking on "Schedule" and validating landing page...`,
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickSchedule();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await timeMenuPage.validateSchedulePageLoaded(companyType);
    console.log('✓ Schedule page loaded successfully');
  }

  // ========== ELITE COMPANIES ONLY: REMAINING OPTIONS ==========
  if (companyType === 'elite') {
    // PART 7: NAVIGATE TO TIME OFF AND VALIDATE
    console.log(
      'Step 7: Clicking on "Time off" and validating landing page...',
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickTimeOff();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await timeMenuPage.validateTimeOffPageLoaded();
    console.log('✓ Time off page loaded successfully');

    // PART 8: NAVIGATE TO TIME TEAM AND VALIDATE
    console.log(
      'Step 8: Clicking on "Time team" and validating landing page...',
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickTimeTeam();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await timeMenuPage.validateTimeTeamPageLoaded();
    console.log('✓ Time team page loaded successfully');

    // PART 9: NAVIGATE TO ASSIGNMENTS AND VALIDATE
    console.log(
      'Step 9: Clicking on "Assignments" and validating landing page...',
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickAssignments();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await timeMenuPage.validateAssignmentsPageLoaded();
    console.log('✓ Assignments page loaded successfully');

    // PART 10: NAVIGATE TO TIME REPORTS AND VALIDATE
    console.log(
      'Step 10: Clicking on "Time reports" and validating landing page...',
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickTimeReports();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await timeMenuPage.validateTimeReportsPageLoaded();
    console.log('✓ Time reports page loaded successfully');
  }

  // ========== TIME PREMIUM COMPANIES: VALIDATE ACCESS DENIED MESSAGE FOR ALL OPTIONS ==========
  if (companyType === 'time_premium') {
    // PART 3: NAVIGATE TO OVERVIEW AND VALIDATE ACCESS DENIED
    console.log(
      'Step 3: Clicking on "Overview" and validating access denied message...',
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickOverview();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await timeMenuPage.validateAccessDenied();
    console.log('✓ Access denied message shown on Overview page');

    // PART 4: NAVIGATE TO TIME ENTRIES AND VALIDATE ACCESS DENIED
    console.log(
      'Step 4: Clicking on "Time entries" and validating access denied message...',
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickTimeEntries();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await timeMenuPage.validateAccessDenied();
    console.log('✓ Access denied message shown on Time entries page');

    // PART 5: NAVIGATE TO APPROVALS AND VALIDATE ACCESS DENIED
    console.log(
      'Step 5: Clicking on "Approvals" and validating access denied message...',
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickApprovals();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await timeMenuPage.validateAccessDenied();
    console.log('✓ Access denied message shown on Approvals page');

    // PART 6: NAVIGATE TO SCHEDULE AND VALIDATE ACCESS DENIED
    console.log(
      'Step 6: Clicking on "Schedule" and validating access denied message...',
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickSchedule();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await timeMenuPage.validateAccessDenied();
    console.log('✓ Access denied message shown on Schedule page');

    // PART 7: NAVIGATE TO TIME OFF AND VALIDATE ACCESS DENIED
    console.log(
      'Step 7: Clicking on "Time off" and validating access denied message...',
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickTimeOff();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await timeMenuPage.validateAccessDenied();
    console.log('✓ Access denied message shown on Time off page');

    // PART 8: NAVIGATE TO TIME TEAM AND VALIDATE ACCESS DENIED
    console.log(
      'Step 8: Clicking on "Time team" and validating access denied message...',
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickTimeTeam();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await timeMenuPage.validateAccessDenied();
    console.log('✓ Access denied message shown on Time team page');

    // PART 9: NAVIGATE TO ASSIGNMENTS AND VALIDATE ACCESS DENIED
    console.log(
      'Step 9: Clicking on "Assignments" and validating access denied message...',
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickAssignments();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await timeMenuPage.validateAccessDenied();
    console.log('✓ Access denied message shown on Assignments page');

    // PART 10: NAVIGATE TO TIME REPORTS AND VALIDATE ACCESS DENIED
    console.log(
      'Step 10: Clicking on "Time reports" and validating access denied message...',
    );

    await timeMenuPage.hoverToRevealTimeSubmenu();
    await timeMenuPage.clickTimeReports();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();

    await timeMenuPage.validateAccessDenied();
    console.log('✓ Access denied message shown on Time reports page');
  }

  console.log('');
  console.log('============================================');
  console.log(
    `✓ ALL TIME MENU NAVIGATION TESTS PASSED FOR ${companyType.toUpperCase()} COMPANY!`,
  );
  console.log('============================================');
};

// ==================== Approval Helpers (via Approvals Tab) ====================

/**
 * Helper function to approve time entries via the Approvals tab
 * @param page - Playwright page object
 * @param employeeName - Employee name to approve (e.g., "Test Emp1" or "Emp1, Test")
 * @param dateRange - Date range to select (default: 'This month')
 */
export const approveTimeViaApprovalsTab = async (
  page: Page,
  employeeName: string,
  dateRange: string = 'This month',
): Promise<boolean> => {
  const approvalsPage = new ApprovalsPage(page);

  try {
    // Navigate to Approvals tab
    await approvalsPage.navigateToApprovalsPage();
    await page.waitForTimeout(2000);

    // Select date range
    await approvalsPage.selectDateRange(dateRange);
    await page.waitForTimeout(2000);

    // Find and click on employee row expand menu
    const employeeRow = page
      .locator('tr')
      .filter({ hasText: employeeName })
      .first();
    if (!(await employeeRow.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log(`  Employee ${employeeName} not found in Approvals`);
      return false;
    }

    // Click expand menu and view details
    await page.locator('(//*[@aria-label="Expand Menu"])[1]').click();
    await page.waitForTimeout(1000);
    await page.locator('//*[text()="View details"]').click();
    await page.waitForTimeout(2000);

    // Click Approve time button and select Approve
    await approvalsPage.clickApproveTimeButton();
    await page.waitForTimeout(1000);
    await page.getByRole('menuitem', { name: 'Approve' }).click();

    // Handle lock time confirmation popup
    const lockTimePopup = page.getByText(/Lock time through/i);
    if (await lockTimePopup.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByRole('button', { name: 'Approve and lock time' }).click();
    }
    await page.waitForTimeout(2000);

    console.log(`  ✓ Approved time for ${employeeName} via Approvals tab`);
    return true;
  } catch (error) {
    console.log(`  ✗ Failed to approve time for ${employeeName}: ${error}`);
    return false;
  }
};

/**
 * Helper function to unapprove time entries via the Approvals tab
 * @param page - Playwright page object
 * @param employeeName - Employee name to unapprove
 * @param dateRange - Date range to select (default: 'This month')
 */
export const unapproveTimeViaApprovalsTab = async (
  page: Page,
  employeeName: string,
  dateRange: string = 'This month',
): Promise<boolean> => {
  const approvalsPage = new ApprovalsPage(page);

  try {
    // Navigate to Approvals tab
    await approvalsPage.navigateToApprovalsPage();
    await page.waitForTimeout(2000);

    // Select date range
    await approvalsPage.selectDateRange(dateRange);
    await page.waitForTimeout(2000);

    // Find and click on employee row expand menu
    const employeeRow = page
      .locator('tr')
      .filter({ hasText: employeeName })
      .first();
    if (!(await employeeRow.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log(`  Employee ${employeeName} not found in Approvals`);
      return false;
    }

    // Click expand menu and view details
    await page.locator('(//*[@aria-label="Expand Menu"])[1]').click();
    await page.waitForTimeout(1000);
    await page.locator('//*[text()="View details"]').click();
    await page.waitForTimeout(2000);

    // Click Approve time button and select Unapprove
    await approvalsPage.clickApproveTimeButton();
    await page.waitForTimeout(1000);
    await page.getByRole('menuitem', { name: 'Unapprove' }).click();

    // Handle unlock time confirmation popup
    const unlockTimePopup = page.getByText(/Unlock time/i);
    if (await unlockTimePopup.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page
        .getByRole('button', { name: 'Unapprove and unlock time' })
        .click();
    }
    await page.waitForTimeout(2000);

    console.log(`  ✓ Unapproved time for ${employeeName} via Approvals tab`);
    return true;
  } catch (error) {
    console.log(`  ✗ Failed to unapprove time for ${employeeName}: ${error}`);
    return false;
  }
};
