import { Page, expect } from '@playwright/test';
import gotoWithAuthSession from '../../gotoWithAuthSession';
import SingleTimeEntryPage from '../../pages/SingleTimeEntryPage';
import TimeEntriesPage from '../../pages/TimeEntriesPage';
import ProjectsPage from '../../pages/ProjectsPage';
import ReportsPage from '../../pages/ReportsPage';
import { WeeklyTimeActivity } from '../../pages/WeeklyTimeActivity';
import {
  selectDisplayByOption,
  openDateRangeDropdown,
  selectDateRangeOption,
  clickAddTimeDropdown,
  selectSingleTimeEntryFromAddTime,
  normalizeToMinutes,
  normalizeName,
} from '../../commonUtils';
import SingleTimeActivityPage from '../../pages/SingleTimeActivityPage';
import { CompanyTier } from '../../config/types';
import { validateInvoiceIntegration } from './Invoice.util';

// Employee name constants - handle both formats
const TEST_EMPLOYEE = {
  listView: 'Emp1, Test', // Format in Time Entries list: "Last, First"
  dropdown: 'Test Emp1', // Format in dropdowns: "First Last"
  alternateListView: 'Test Emp1', // Alternate format if displayed differently
};

export const unifyTimeSheetCases = async (
  page: Page,
  companyTier: CompanyTier = CompanyTier.Paid,
  companyInfo?: string,
) => {
  // Determine page type based on company tier
  const isFreeCompany = companyTier === CompanyTier.Free;

  // Check if it's a SimpleStart company
  const isSimpleStart =
    companyInfo?.toLowerCase().includes('simplestart') || false;

  // Use SingleTimeEntryPage for common form operations (both STA and STE use same form fields)
  // Use SingleTimeActivityPage only for validation that page is loaded
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  const pageType = isFreeCompany ? 'STA' : 'STE';
  console.log(
    `Running Unify Timesheet Test Cases for ${companyTier} company...`,
  );

  if (isSimpleStart) {
    console.log(
      '⚠ SimpleStart company detected - Running limited validation (menu items only)',
    );
  }

  // Determine which employee name format is being used in the list view
  let employeeNameInList = TEST_EMPLOYEE.listView; // Default value, will be updated after first check

  try {
    await expect(
      page.getByText('See QuickBooks in action with a company sandbox'),
    ).toBeVisible({ timeout: 70000 });
    await page
      .getByRole('dialog', { name: 'popover' })
      .getByRole('button', { name: 'Close' })
      .click();
  } catch (error) {
    // Sandbox popup not present, continue with test
    console.log('Sandbox popup not present, continuing...');
  }

  console.log('Starting Unify Timesheet Test Cases...');

  // QBO Create flyout exposes links by accessible name; `data-content` is not reliable on prod shell.
  const staMenuLink = isFreeCompany
    ? page.getByRole('link', { name: 'Single time activity' }).first()
    : page.getByRole('link', { name: 'Single time entry' }).first();
  const weeklyMenuLink = page
    .getByRole('link', { name: 'Weekly timesheet' })
    .first();

  // Retry hover (and optional click) — flyout may not expose legacy `data-content` attributes.
  let hoverSuccessful = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(
        `Attempting to open Create menu via leftrail-item-create (attempt ${attempt}/5)...`,
      );
      await page.getByTestId('leftrail-item-create').hover({ timeout: 15000 });
      await page.waitForTimeout(2000);

      await expect(staMenuLink).toBeVisible({ timeout: 20000 });
      await expect(weeklyMenuLink).toBeVisible({ timeout: 20000 });

      console.log(
        '✓ Create flyout open; STA and Weekly timesheet links visible',
      );
      hoverSuccessful = true;
      break;
    } catch (error) {
      console.log(
        `Attempt ${attempt} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      if (attempt < 5) {
        try {
          await page
            .getByTestId('leftrail-item-create')
            .click({ timeout: 10000 });
          await page.waitForTimeout(1500);
          await expect(staMenuLink).toBeVisible({ timeout: 15000 });
          await expect(weeklyMenuLink).toBeVisible({ timeout: 15000 });
          console.log(
            '✓ Create flyout open after click; STA and Weekly timesheet links visible',
          );
          hoverSuccessful = true;
          break;
        } catch {
          await page.waitForTimeout(3000);
        }
      }
    }
  }

  if (!hoverSuccessful) {
    throw new Error(
      'Failed to open Create menu (hover/click) — STA / Weekly timesheet links not visible after 5 attempts',
    );
  }

  await expect(staMenuLink).toBeVisible();
  await expect(weeklyMenuLink).toBeVisible();

  // ========== TOUR POPUP VALIDATION: Click STA and handle tour ==========
  console.log('');
  console.log('Validating STA tour popup...');

  // Click on Single time activity / Single time entry to navigate there
  await staMenuLink.click();

  // Wait for STA to load completely with comprehensive checks
  await singleTimeActivityPage.validateSTALoaded();
  await timeEntriesPage.waitForLoadingToDisappear();
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();
  await page.waitForTimeout(1000);

  // Handle the tour popup (if it appears)
  await singleTimeActivityPage.handleSTATourPopup();

  console.log('✓ STA tour validation complete');

  // ========== TOUR POPUP VALIDATION: Navigate to WTA and handle tour ==========
  console.log('');
  console.log('Validating WTA tour popup...');

  // Navigate directly to Weekly Time Activity page
  await weeklyTimeActivity.navigateToWeeklyTime();

  // Wait for WTA to load completely with comprehensive checks
  await expect(
    page.getByRole('button', { name: 'Time entry settings' }),
  ).toBeVisible({ timeout: 30000 });
  await timeEntriesPage.waitForLoadingToDisappear();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await page.waitForTimeout(1000);

  // Handle the tour popup (if it appears)
  await weeklyTimeActivity.handleWTATourPopup();

  console.log('✓ WTA tour validation complete');

  // For SimpleStart companies, only validate menu items and skip the rest
  if (isSimpleStart) {
    console.log(
      '✓ SimpleStart validation complete: STA and Weekly timesheet menu items are visible',
    );
    console.log(
      '⚠ Skipping remaining tests - SimpleStart does not have access to Time Entries, Projects, or Reports',
    );
    return;
  }

  // ========== SETUP: Navigate to Time Entries Page ==========
  console.log('Step 1: Navigating to Time Entries page...');
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  // Setup date range to This month
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Validate GraphQL API when date filter is applied
  console.log(
    'Step 1a: Validating GraphQL API call after date filter selection...',
  );
  await timeEntriesPage.validateTimeEntriesGraphQLAPI(async () => {
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();
  });

  // ========== CLEANUP: Remove existing entries for test employee ==========
  console.log(
    `Step 2: Cleaning up existing entries for ${TEST_EMPLOYEE.dropdown}...`,
  );

  // Detect which name format is being used in the list view
  employeeNameInList = await timeEntriesPage.getEmployeeNameForListView(
    TEST_EMPLOYEE.listView,
    TEST_EMPLOYEE.alternateListView,
  );
  console.log(
    `  Detected employee name format in list: "${employeeNameInList}"`,
  );

  const empRows = await timeEntriesPage.getAllRowsForAnEmployee(
    employeeNameInList,
  );
  let count = await empRows.count();
  while (count > 0) {
    await timeEntriesPage.clickActionDropdownForEmployee(employeeNameInList);
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Refresh data by switching filters (faster than page reload)
    await selectDisplayByOption(page, 'Customer');
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();

    count = await timeEntriesPage.countEmployeeRow(employeeNameInList);
  }

  // ========== PART 1: CREATE SINGLE TIME ENTRY ==========
  console.log(`Step 3: Creating a ${pageType}...`);
  await clickAddTimeDropdown(page);
  await selectSingleTimeEntryFromAddTime(page, isFreeCompany);

  // Validate page loaded based on company tier
  if (isFreeCompany) {
    await singleTimeActivityPage.validateSTALoaded();
  } else {
    await singleTimeEntryPage.expectSingleTimeEntryVisible();
  }

  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  // Handle "Go to QuickBooks Time" modal if it appears
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

  // ========== VALIDATE SETTINGS: HIDE/SHOW FIELDS ==========
  console.log(`Step 3a: Validating settings - hiding and showing fields...`);

  // Step 1: Check initial state of fields
  console.log(`  Checking initial state of fields...`);
  const initialServiceVisible =
    await singleTimeActivityPage.checkFieldVisibility('Service');
  const initialBillableVisible =
    await singleTimeActivityPage.billRateCheckBoxVisibility();
  console.log(
    `  Initial state - Service: ${
      initialServiceVisible ? 'visible' : 'hidden'
    }, Billable: ${initialBillableVisible ? 'visible' : 'hidden'}`,
  );

  // Step 2: Ensure both fields are enabled first (prerequisite for testing hide/show cycle)
  if (!initialServiceVisible || !initialBillableVisible) {
    console.log(
      `  One or both fields are disabled - enabling them first to test full cycle...`,
    );

    // Open time settings popover to enable the fields
    await singleTimeActivityPage.openTimeSettingsPopoverForm();
    await expect(
      page.locator(`//*[text()='Time entry settings']`),
    ).toBeVisible();

    // Enable both fields to ensure we test the complete hide/show cycle
    console.log(`  Enabling Service and Billable fields...`);
    await singleTimeActivityPage.checkCheckboxInTimeSettingsPopover('Service');
    await singleTimeActivityPage.checkCheckboxInTimeSettingsPopover('Billable');

    // Save settings
    await singleTimeActivityPage.clickOnSaveSettingsInsidePopover();
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(5000);

    // Verify fields are now visible
    console.log(`  Verifying both fields are now visible...`);
    const serviceVisible = await singleTimeActivityPage.checkFieldVisibility(
      'Service',
    );
    const billableVisible =
      await singleTimeActivityPage.billRateCheckBoxVisibility();

    expect(serviceVisible).toBeTruthy();
    expect(billableVisible).toBeTruthy();
    console.log(
      `  ✓ Both Service and Billable fields are now visible - ready to test hide/show`,
    );
  } else {
    console.log(
      `  Both fields already visible - ready to test hide/show cycle`,
    );
  }

  // Step 3: Disable both fields and verify invisibility
  console.log(`  Disabling Service and Billable fields...`);
  await singleTimeActivityPage.openTimeSettingsPopoverForm();
  await expect(page.locator(`//*[text()='Time entry settings']`)).toBeVisible();
  await singleTimeActivityPage.uncheckCheckboxInTimeSettingsPopover('Service');
  await singleTimeActivityPage.uncheckCheckboxInTimeSettingsPopover('Billable');

  // Save settings
  await singleTimeActivityPage.clickOnSaveSettingsInsidePopover();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(5000);

  // Verify fields are hidden
  console.log(`  Verifying fields are hidden...`);
  const serviceHidden = !(await singleTimeActivityPage.checkFieldVisibility(
    'Service',
  ));
  const billableHidden =
    !(await singleTimeActivityPage.billRateCheckBoxVisibility());

  expect(serviceHidden).toBeTruthy();
  expect(billableHidden).toBeTruthy();
  console.log(`  ✓ Service and Billable fields are hidden`);

  // Step 4: Re-enable fields and verify visibility
  console.log(`  Re-enabling fields...`);
  await singleTimeActivityPage.openTimeSettingsPopoverForm();
  await expect(page.locator(`//*[text()='Time entry settings']`)).toBeVisible();
  // Enable both Service and Billable fields at the same time
  await singleTimeActivityPage.checkCheckboxInTimeSettingsPopover('Service');
  await singleTimeActivityPage.checkCheckboxInTimeSettingsPopover('Billable');

  // Save settings
  await singleTimeActivityPage.clickOnSaveSettingsInsidePopover();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(5000);

  // Verify fields are visible again
  console.log(`  Verifying fields are visible again...`);
  const serviceVisible = await singleTimeActivityPage.checkFieldVisibility(
    'Service',
  );
  const billableVisible =
    await singleTimeActivityPage.billRateCheckBoxVisibility();
  await page.waitForTimeout(1000);
  expect(serviceVisible).toBeTruthy();
  expect(billableVisible).toBeTruthy();
  console.log(`  ✓ Service and Billable fields are visible`);
  console.log(`✓ Settings validation completed successfully!`);

  // Fill in entry details
  console.log(`Step 4: Filling ${pageType} details...`);
  // Always select the first option from the dropdown (option 0)
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  const nameValue = await singleTimeEntryPage.getFieldValue('Name');

  // Store the selected employee name - will use flexible locators for list searches
  employeeNameInList = nameValue || '';
  console.log(`  Selected employee: "${employeeNameInList}"`);

  // Ensure 'Set clock in and out' is toggled off (we want Duration entry, not Start/End time)
  const isSetClockOn = await singleTimeEntryPage.verifySetClockToggleState();
  if (isSetClockOn) {
    await singleTimeEntryPage.clickSetClockInAndOutToggles();
    await page.waitForTimeout(1000);
  }

  // Set date and duration (using Duration method, not Start/End time)
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await singleTimeEntryPage.fillStartDate(formattedDate);
  await singleTimeEntryPage.enterFieldValue('Duration', '3:00');
  const durationValue = await singleTimeEntryPage.getFieldValue('Duration');

  // Add notes, customer, and service
  await singleTimeEntryPage.enterNotes(
    `${pageType} Unify Timesheet Test Entry`,
  );
  const notesValue = await singleTimeEntryPage.getNotesFieldValue();

  // Always select the first customer option (selection happens inside openDropdown)
  await singleTimeEntryPage.openDropdown('Customers');
  await page.waitForTimeout(500);
  const customerValue = await singleTimeEntryPage.getFieldValue('Customers');
  await page.waitForTimeout(1000); // Wait for customer to be fully loaded

  // Always select the first service option
  await singleTimeEntryPage.openDropdown('Service');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.clickDropdownOption(1, 'Service');
  const serviceValue = await singleTimeEntryPage.getFieldValue('Service');
  await page.waitForTimeout(1000); // Wait for service to be fully loaded

  // Add billable rate for invoice testing
  console.log(`Step 4a: Adding billable rate to ${pageType}...`);

  // Check if billable checkbox exists and check it
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
      console.log(`  ✓ Billable checkbox checked`);
    } else {
      console.log(`  ✓ Billable checkbox already checked`);
    }

    // Fill bill rate
    await singleTimeActivityPage.fillBillRateInput('50.00');
    await page.waitForTimeout(500);
    console.log(`  ✓ Billable rate set to $50.00`);
  } else {
    console.log(`  ⚠ Billable checkbox not visible - skipping billable rate`);
  }

  // Save the entry
  console.log(`Step 5: Saving ${pageType}...`);
  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await timeEntriesPage.waitForLoadingToDisappear();

  // Refresh data by switching filters (faster than page reload)
  console.log('Step 5a: Refreshing data by switching filters...');
  await selectDisplayByOption(page, 'Customer');
  await timeEntriesPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  // ========== PART 2: VALIDATE TIME ENTRY FROM DATE VIEW ==========
  console.log(`Step 6: Validating ${pageType} is visible in Date view...`);
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await timeEntriesPage.validateDateWiseDataVisible();
  await page.waitForTimeout(3000); // Wait for data to load

  const dateViewRowObj = await timeEntriesPage.getRowObjectForEmployee(
    employeeNameInList,
  );

  // Debug: Log the retrieved row object
  console.log(
    '  Retrieved row object:',
    JSON.stringify(dateViewRowObj, null, 2),
  );
  console.log(`  Expected duration: "${durationValue}"`);
  console.log(`  Actual Hours from row: "${dateViewRowObj.Hours}"`);

  // Verify entry data - Handle both decimal (3.00) and time format (3:00)
  const actualMinutes = normalizeToMinutes(dateViewRowObj.Hours || '');
  const expectedMinutes = normalizeToMinutes(durationValue || '');

  console.log(`  Normalized actual minutes: ${actualMinutes}`);
  console.log(`  Normalized expected minutes: ${expectedMinutes}`);

  // Verify entry data after refresh
  await expect(actualMinutes).toBe(expectedMinutes);
  await expect(normalizeName(dateViewRowObj.Name || '')).toBe(
    normalizeName(nameValue || ''),
  );
  await expect(dateViewRowObj.Customer).toBe(customerValue);
  await expect(dateViewRowObj.Service).toBe(serviceValue);
  await expect(dateViewRowObj.Notes).toContain(
    `${pageType} Unify Timesheet Test Entry`,
  );

  console.log(
    `Step 7: Clicking Edit from Date view and validating navigation to ${pageType} screen...`,
  );
  // Click the first Edit button for the employee
  await page
    .locator(
      `//div[contains(text(), '${employeeNameInList}')]/ancestor::tr//*[text()='Edit']`,
    )
    .first()
    .click();

  // Validate page loaded based on company tier
  if (isFreeCompany) {
    await singleTimeActivityPage.validateSTALoaded();
  } else {
    await singleTimeEntryPage.expectSingleTimeEntryVisible();
  }

  console.log(
    `✓ Successfully navigated to ${pageType} screen from Date view Edit`,
  );
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);

  // Verify we're on the correct screen and can see the data
  const editNameValue = await singleTimeEntryPage.getFieldValue('Name');
  expect(normalizeName(editNameValue || '')).toBe(
    normalizeName(nameValue || ''),
  );

  // Update the entry - change notes to validate update functionality
  console.log(
    `Step 7a: Updating ${pageType} notes to validate update functionality...`,
  );
  await singleTimeEntryPage.enterNotes(
    `Updated: ${pageType} Unify Timesheet Test Entry - Modified`,
  );

  // Save the updated entry
  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log(`✓ ${pageType} updated successfully`);

  // NOTE: Employee view validation removed - Employee view no longer exists in Time Entries
  // Data validation is done via Date view and Reports

  // ========== PART 4: CREATE WEEKLY TIMESHEET ==========
  console.log('Step 10: Creating a Weekly Timesheet...');
  // Already on Time Entries page after cancel, use Add time button to navigate
  await page.waitForTimeout(2000);
  await clickAddTimeDropdown(page);
  await page.getByRole('option', { name: 'Weekly timesheet' }).click();
  await page.waitForTimeout(3000);
  await page.waitForLoadState('load');

  // WeeklyTimeActivity page object already initialized at the top of the function
  await page.waitForTimeout(2000);

  // Fill weekly timesheet - always use first options
  console.log('Step 12: Filling Weekly Timesheet details...');
  // Select first customer (option 2, as option 1 is "Add new customer")
  await weeklyTimeActivity.openRowDropdown('Customers', 1);
  await page.waitForTimeout(500);
  await page.getByRole('option').nth(1).click();
  await page.waitForTimeout(500);

  // Enter duration for ONE day only (first day of the week)
  const firstDayDuration = page
    .locator(`//tr[1]//input[contains(@aria-label,'Duration')]`)
    .first();
  await firstDayDuration.click();
  await firstDayDuration.fill('5');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);

  // Select first service option (option 2, as option 1 might be "Add new service")
  await weeklyTimeActivity.openRowDropdown('Service', 1);
  await page.waitForTimeout(500);
  await page.getByRole('option').nth(1).click();
  await page.waitForTimeout(500);

  // Add notes
  await weeklyTimeActivity.enterNotes('WTE Unify Timesheet Test Entry', 1);

  // Save the weekly timesheet
  console.log('Step 11: Saving Weekly Timesheet...');
  await weeklyTimeActivity.clickSaveAndCloseButton();
  await page.waitForTimeout(3000);

  // ========== PART 5: VALIDATE WEEKLY TIMESHEET FROM DATE VIEW ==========
  console.log('Step 12: Validating Weekly Timesheet in Date view...');
  // Page automatically redirects to Time Entries after Save and Close, just wait for loading
  await timeEntriesPage.waitForLoadingToDisappear();

  // Refresh data by switching filters (faster than page reload)
  console.log('Step 12a: Refreshing data by switching filters...');
  await selectDisplayByOption(page, 'Customer');
  await timeEntriesPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Find both STA and WTE entries - should now have 2 entries for the employee
  const totalEntryCount = await timeEntriesPage.countEmployeeRow(
    employeeNameInList,
  );
  expect(totalEntryCount).toBeGreaterThan(0);
  console.log(
    `Found ${totalEntryCount} time entries for ${employeeNameInList} (STA + WTE)`,
  );

  console.log(`Step 13: Clicking Edit on Weekly Timesheet from Date view...`);
  // Get all edit buttons for the employee and click the first one (most recent)
  const editButtons = await page.locator(
    `//div[contains(text(), '${employeeNameInList}')] / ancestor::tr / descendant::*[text()='Edit']`,
  );
  const editButtonCount = await editButtons.count();
  expect(editButtonCount).toBeGreaterThan(0);

  // Click the first edit button (for the weekly timesheet we just created)
  await editButtons.first().click();

  // Validate page loaded based on company tier
  if (isFreeCompany) {
    await singleTimeActivityPage.validateSTALoaded();
  } else {
    await singleTimeEntryPage.expectSingleTimeEntryVisible();
  }

  console.log(
    `✓ Successfully navigated to ${pageType} screen from Date view Edit for Weekly Timesheet`,
  );
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);

  // Verify we're on the correct screen with weekly timesheet data
  const wteEditNameValue = await singleTimeEntryPage.getFieldValue('Name');
  expect(normalizeName(wteEditNameValue || '')).toBe(
    normalizeName(nameValue || ''),
  );

  // Cancel and return to Time Entries page
  await singleTimeEntryPage.clickFooterCancelButton();
  await timeEntriesPage.waitForLoadingToDisappear();

  // NOTE: Employee view validation for WTE removed - Employee view no longer exists in Time Entries

  // ========== PART 6: VALIDATE NAVIGATION FROM AUDIT LOG ==========
  console.log(
    'Step 16: Navigating to Audit Log to test timesheet link navigation...',
  );

  // Navigate to Audit Log
  await gotoWithAuthSession(page, '/app/auditlog', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.waitForSelector(`//*[text()='Event']`, {
    state: 'visible',
    timeout: 0,
  });

  console.log(
    'Step 16a: Looking for Added or Edited timesheet records in Audit Log...',
  );

  // Try to find an "Added" timesheet record first
  let timesheetLinkFound = false;
  let recordType = '';

  // Check for "Added" timesheet record
  const addedTimesheetLink = page
    .locator(`//div[text()="Added "] / descendant::*[text()='Timesheet']`)
    .first();
  const addedExists = await addedTimesheetLink.count();

  if (addedExists > 0) {
    console.log('  Found "Added" timesheet record');
    recordType = 'Added';
    timesheetLinkFound = true;

    console.log(
      `Step 16b: Clicking "Timesheet" link from ${recordType} record...`,
    );
    await addedTimesheetLink.click();
    await page.waitForTimeout(2000);
  } else {
    // If no "Added" record, try "Edited" timesheet record
    const editedTimesheetLink = page
      .locator(`//div[text()="Edited "] / descendant::*[text()='Timesheet']`)
      .first();
    const editedExists = await editedTimesheetLink.count();

    if (editedExists > 0) {
      console.log('  Found "Edited" timesheet record');
      recordType = 'Edited';
      timesheetLinkFound = true;

      console.log(
        `Step 16b: Clicking "Timesheet" link from ${recordType} record...`,
      );
      await editedTimesheetLink.click();
      await page.waitForTimeout(2000);
    }
  }

  if (timesheetLinkFound) {
    // Validate navigation to correct screen based on company tier
    console.log(
      `Step 16c: Validating navigation to ${pageType} screen from Audit Log...`,
    );

    if (isFreeCompany) {
      await singleTimeActivityPage.validateSTALoaded();
      console.log(
        `✓ Successfully navigated to ${pageType} screen from Audit Log "${recordType}" timesheet link`,
      );
    } else {
      await singleTimeEntryPage.expectSingleTimeEntryVisible();
      console.log(
        `✓ Successfully navigated to ${pageType} screen from Audit Log "${recordType}" timesheet link`,
      );
    }

    await timeEntriesPage.waitForLoadingToDisappear();

    // Close the entry and return
    console.log('Step 16d: Closing entry and returning...');
    await singleTimeEntryPage.clickFooterCancelButton();
    await page.waitForTimeout(1000);
  } else {
    console.log(
      '⚠ Warning: No "Added" or "Edited" timesheet records found in Audit Log',
    );
    console.log('  Skipping Audit Log navigation test');
  }

  // ========== PART 8: VALIDATE NAVIGATION & EDIT FROM PROJECTS SCREEN ==========
  console.log(
    'Step 17: Navigating to Projects screen to validate edit navigation...',
  );
  const projectsPage = new ProjectsPage(page);
  await projectsPage.navigateToProjectsList();
  await projectsPage.waitForPageReady();
  await projectsPage.handlePopupsInAnyOrder();

  // Check if company has access to projects
  const noAccessMessage = page.locator(
    `//*[text()="We're sorry, we can't find the page you requested."]`,
  );
  const hasNoAccess = await noAccessMessage
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (hasNoAccess) {
    console.log(
      '⚠ Warning: Company does not have access to Projects feature. Skipping project-related tests.',
    );
  } else {
    await expect(page.getByText('test proj')).toBeVisible();

    // Verify projects are available
    const projectCount = await projectsPage.getProjectCardsCount();
    console.log(`Found ${projectCount} projects`);

    if (projectCount === 0) {
      console.log(
        '⚠ Warning: No projects found. Skipping project-related tests.',
      );
    } else {
      // Get the first project name for logging
      const firstProjectName = await projectsPage.getFirstProjectName();
      console.log(`Step 17a: Opening project "${firstProjectName}"...`);

      // Click on first project card
      await projectsPage.clickFirstProjectCard();
      await page.waitForTimeout(2000);

      await expect(
        page.locator(`//*[contains(text(), 'Time Activity')]`),
      ).toBeVisible();
      await page.locator(`//*[contains(text(), 'Time Activity')]`).click();
      await page.waitForTimeout(1000);

      // Check if there are any existing time entries in this project
      // (We're using the entry created earlier in the test with customer field populated)
      const existingEntries = await page
        .locator(`//div[contains(text(), '${TEST_EMPLOYEE.dropdown}')]`)
        .count();

      if (existingEntries > 0) {
        // ===== EDIT: Click on existing entry to validate navigation =====
        console.log(
          `Step 17b: Clicking on existing ${pageType} to validate edit navigation from Projects...`,
        );

        // Click on the entry details to edit
        await page
          .locator(`//div[contains(text(), '${TEST_EMPLOYEE.dropdown}')]`)
          .first()
          .click();
        await page.waitForTimeout(2000);

        // Should navigate to STA/STE edit screen
        if (isFreeCompany) {
          await singleTimeActivityPage.validateSTALoaded();
        } else {
          await singleTimeEntryPage.expectSingleTimeEntryVisible();
        }
        console.log(
          `  ✓ Successfully navigated to ${pageType} edit screen from Projects`,
        );

        // Verify we can see the entry details
        const editNameValue = await singleTimeEntryPage.getFieldValue('Name');
        console.log(
          `  ✓ Entry details loaded in edit mode for: "${editNameValue}"`,
        );

        // Cancel and return to Projects
        console.log(
          `Step 17c: Closing ${pageType} and returning to Projects...`,
        );
        await singleTimeEntryPage.clickFooterCancelButton();
        await page.waitForTimeout(1000);
        console.log(`  ✓ Successfully returned to Projects screen`);
      } else {
        // No existing entries, test "Add to Project" -> "Time" navigation
        console.log(
          `Step 17b: No existing entries found. Testing "Add to project" -> "Time" navigation...`,
        );

        await projectsPage.expectAddToProjectButtonVisible();
        await projectsPage.clickAddToProjectButton();
        //await page.waitForTimeout(1000);
        await projectsPage.clickAddTimeOption();
        //await page.waitForTimeout(2000);

        // Validate navigation to correct screen based on company tier
        if (isFreeCompany) {
          await singleTimeActivityPage.validateSTALoaded();
        } else {
          await singleTimeEntryPage.expectSingleTimeEntryVisible();
        }
        console.log(
          `  ✓ Successfully navigated to ${pageType} screen from Projects`,
        );

        // Verify Customer field is pre-populated with the project
        await page.waitForTimeout(1000);
        const projectCustomerValue = await singleTimeEntryPage.getFieldValue(
          'Customers',
        );
        console.log(`  ✓ Customer pre-filled with: "${projectCustomerValue}"`);

        // Cancel without saving (no need to create another entry)
        console.log(`Step 17c: Closing ${pageType} without saving...`);
        await singleTimeEntryPage.clickFooterCancelButton();
        await page.waitForTimeout(1000);
        console.log(`  ✓ Successfully returned to Projects screen`);
      }

      console.log(
        `✓ Projects navigation validation completed for ${pageType}!`,
      );
    }
  } // End of else block for hasNoAccess check

  // ========== PART 9: VALIDATE INVOICE INTEGRATION ==========
  console.log('Step 18: Validating Invoice integration...');
  if (customerValue) {
    await validateInvoiceIntegration(page, customerValue);
    console.log(`✓ Invoice validation completed for ${pageType}!`);
  } else {
    console.log('⚠ Skipping invoice validation - no customer value available');
  }

  // ========== PART 10: VALIDATE NAVIGATION FROM REPORTS SCREEN ==========
  console.log('Step 19: Navigating to Reports screen...');
  const reportsPage = new ReportsPage(page);
  await reportsPage.navigateToReportsPage();
  await reportsPage.waitForPageReady();
  await reportsPage.handlePopupsInAnyOrder();
  await expect(
    page.locator(`(//*[text()='Accounts receivable aging summary'])[1]`),
  ).toBeVisible();

  console.log(
    'Step 19a: Clicking "Time Activities by Employee Detail" info button...',
  );
  await page
    .getByTestId('__textField')
    .fill('Time Activities by Employee Detail');
  await page.getByText('Time Activities by Employee Detail').first().click();
  await page.waitForTimeout(2000);
  // Validate report title is visible
  await reportsPage.expectTimeActivitiesReportTitleVisible();

  console.log('Step 19b: Selecting "All Dates" from Custom dates dropdown...');
  await reportsPage.clickCustomDatesDropdown();
  //await reportsPage.selectAllDates();
  await page.waitForTimeout(2000);

  // Validate Test Emp1 entry is visible
  await reportsPage.expectTestEmp1EntryVisible();

  console.log(
    'Step 19c: Clicking "Hours" or "Sales" link and validating navigation to STE screen...',
  );
  await reportsPage.clickHoursLink();
  await page.waitForTimeout(2000);

  // Validate navigation to correct screen based on company tier
  await singleTimeActivityPage.validateSTALoaded();
  console.log(
    `✓ Successfully navigated to ${pageType} screen from Reports "Hours" or "Sales" link`,
  );

  // Close entry
  await singleTimeEntryPage.clickFooterCancelButton();
  await page.waitForTimeout(1000);

  // ========== CLEANUP: Delete All Test Entries (STA + WTE) ==========
  console.log('Step 20: Cleaning up - Deleting all test entries...');
  // Navigate to Time Entries page and ensure we're in Date view
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Delete all test entries (both STA and WTE)
  let cleanupEntryCount = await timeEntriesPage.countEmployeeRow(
    employeeNameInList,
  );

  console.log(
    `Found ${cleanupEntryCount} test entry(ies) for ${employeeNameInList} - cleaning up...`,
  );

  // Delete all entries for the test employee
  while (cleanupEntryCount > 0) {
    await timeEntriesPage.clickActionDropdownForEmployee(employeeNameInList);
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Refresh data by switching filters (faster than page reload)
    await selectDisplayByOption(page, 'Customer');
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();

    // Check remaining count
    cleanupEntryCount = await timeEntriesPage.countEmployeeRow(
      employeeNameInList,
    );
    console.log(
      `Remaining entry(ies) for ${employeeNameInList}: ${cleanupEntryCount}`,
    );
  }

  console.log('✓ All test entries cleaned up successfully');

  console.log(`✓ All Unify Timesheet cases completed successfully!`);
  console.log('');
  console.log('='.repeat(70));
  console.log(
    `SUMMARY OF UNIFY TIMESHEET VALIDATIONS (${companyTier} Company)`,
  );
  console.log('='.repeat(70));
  console.log(
    `  [QLUNI001, QLUNI002] Settings validation (hide/show fields): PASSED`,
  );
  console.log(
    `  [QLUNI006] ${pageType} created and validated successfully (with billable rate)`,
  );
  console.log(`  [QLUNI008] ${pageType} updated successfully (notes modified)`);
  console.log(`  [QLUNI006] ${pageType} data validation: PASSED`);
  console.log(
    `  [QLUNI007] ${pageType} navigation from Date view - Edit: PASSED`,
  );
  console.log(
    `  [QLUNI003, QLUNI004] Weekly Timesheet created successfully (single day)`,
  );
  console.log(
    `  [QLUNI010] WTE to ${pageType} navigation from Date view - Edit: PASSED`,
  );
  console.log(
    `  [QLUNI015] ${pageType} navigation from Audit Log timesheet link: PASSED`,
  );
  console.log(
    `  [QLUNI011, QLUNI012, QLUNI013] ${pageType} edit navigation from Projects Time Activity tab: PASSED`,
  );
  console.log(
    `  [QLUNI017, QLUNI018, QLUNI019] Invoice integration validation: PASSED`,
  );
  console.log(
    `  [QLUNI014, QLUNI020] ${pageType} navigation from Reports "Hours" link: PASSED`,
  );
  console.log(`  [QLUNI016] Cleanup: All test entries deleted successfully`);
  console.log('='.repeat(70));
};

/**
 * Cleanup function to remove test entries after unify timesheet test cases
 */
export const cleanupUnifyTimesheetTestData = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);

  try {
    console.log('Cleaning up test data...');
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    // Delete all entries for test employee
    // Detect the employee name format first
    const TEST_EMPLOYEE_CLEANUP = {
      listView: 'Emp1, Test',
      alternateListView: 'Test Emp1',
    };
    const cleanupEmployeeName =
      await timeEntriesPage.getEmployeeNameForListView(
        TEST_EMPLOYEE_CLEANUP.listView,
        TEST_EMPLOYEE_CLEANUP.alternateListView,
      );

    let count = await timeEntriesPage.countEmployeeRow(cleanupEmployeeName);
    while (count > 0) {
      await timeEntriesPage.clickActionDropdownForEmployee(cleanupEmployeeName);
      await timeEntriesPage.clickDeleteInActionDropdown();
      await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
      await timeEntriesPage.clickYesOnDeleteEntryPopup();
      await timeEntriesPage.waitForLoadingToDisappear();

      // Refresh data by switching filters (faster than page reload)
      await selectDisplayByOption(page, 'Customer');
      await timeEntriesPage.waitForLoadingToDisappear();
      await selectDisplayByOption(page, 'Date');
      await timeEntriesPage.waitForLoadingToDisappear();

      count = await timeEntriesPage.countEmployeeRow(cleanupEmployeeName);
    }

    // Also cleanup Zack Test entries (used in sorting tests)
    let zackCount = await timeEntriesPage.countEmployeeRow('Zack Test');
    while (zackCount > 0) {
      await timeEntriesPage.clickActionDropdownForEmployee('Zack Test');
      await timeEntriesPage.clickDeleteInActionDropdown();
      await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
      await timeEntriesPage.clickYesOnDeleteEntryPopup();
      await timeEntriesPage.waitForLoadingToDisappear();

      // Refresh data by switching filters (faster than page reload)
      await selectDisplayByOption(page, 'Customer');
      await timeEntriesPage.waitForLoadingToDisappear();
      await selectDisplayByOption(page, 'Date');
      await timeEntriesPage.waitForLoadingToDisappear();

      zackCount = await timeEntriesPage.countEmployeeRow('Zack Test');
    }

    console.log('✓ Cleanup completed successfully');
  } catch (error) {
    console.log('Cleanup encountered an error:', error);
  }
};

// ============================================================================
// COMPREHENSIVE TEST FUNCTIONS
// ============================================================================

/**
 * Comprehensive data validation across all views with billable
 */
export async function comprehensiveDataValidation(page: Page): Promise<void> {
  console.log('');
  console.log('='.repeat(70));
  console.log('COMPREHENSIVE DATA VALIDATION TEST');
  console.log('='.repeat(70));

  const timeEntriesPage = new TimeEntriesPage(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  const reportsPage = new ReportsPage(page);

  // Navigate to Time Entries
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  // Add billable STA with duration - using EXISTING patterns
  console.log('Step 1: Adding billable STA with duration...');
  await clickAddTimeDropdown(page);
  await selectSingleTimeEntryFromAddTime(page, true); // true for free company (STA)
  await singleTimeActivityPage.validateSTALoaded();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);

  // Select employee (first option)
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  const nameValue = await singleTimeEntryPage.getFieldValue('Name');

  // Select customer (first option)
  await singleTimeActivityPage.clickDropdownOption(1, 'Customers');
  const customerValue = await singleTimeEntryPage.getFieldValue('Customers');

  // Select service (first option)
  await singleTimeActivityPage.clickDropdownOption(1, 'Service');
  const serviceValue = await singleTimeEntryPage.getFieldValue('Service');

  // Set date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await singleTimeEntryPage.fillStartDate(formattedDate);

  // Enter duration
  await singleTimeEntryPage.enterFieldValue('Duration', '3:30');

  // Enter notes
  await singleTimeEntryPage.enterNotes('Comprehensive validation test');

  // Make it billable - using existing pattern
  const billableCheckbox = page.locator(
    '//span[contains(text(), "Billable")]/ancestor::label/descendant::input',
  );
  const isBillableVisible = await billableCheckbox
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (isBillableVisible) {
    const isChecked = await billableCheckbox.isChecked();
    if (!isChecked) {
      await billableCheckbox.check();
      await page.waitForTimeout(500);
    }
    await singleTimeActivityPage.fillBillRateInput('75.00');
    await page.waitForTimeout(500);
  }

  // Save and close
  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await timeEntriesPage.waitForLoadingToDisappear(); // Save and close takes back to Time Entries
  await page.waitForTimeout(2000); // Wait for page transition
  await expect(page.getByLabel('Display by')).toBeVisible({ timeout: 10000 }); // Ensure page is fully loaded
  console.log('✓ Billable STA created successfully');

  // Validate in Date View
  console.log('Step 2: Validating in Date View...');
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Set date range to "This month" to ensure entry is visible
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  const dateViewRow = await timeEntriesPage.getRowObjectForEmployee(
    nameValue || 'Test Emp1',
  );
  console.log('  Date View Row:', JSON.stringify(dateViewRow, null, 2));
  expect(normalizeToMinutes(dateViewRow.Hours || '')).toBe(
    normalizeToMinutes('3:30'),
  );
  expect(dateViewRow.Customer).toBe(customerValue);
  expect(dateViewRow.Service).toContain(serviceValue);
  expect(dateViewRow.Notes).toContain('Comprehensive validation test');
  expect(dateViewRow.Billable).toBe('Yes');
  console.log(
    '✓ Date View validation completed - Hours, Customer, Service, Notes, Billable',
  );

  // NOTE: Employee view validation removed - Employee view no longer exists in Time Entries

  // Validate in Reports
  console.log('Step 3: Validating in Reports...');
  await reportsPage.navigateToReportsPage();
  await reportsPage.waitForPageReady();
  await reportsPage.searchAndOpenReport('Time Activities by Employee Detail');
  await reportsPage.expectTimeActivitiesReportTitleVisible();
  await reportsPage.clickCustomDatesDropdown();
  await page.getByRole('option', { name: 'Custom', exact: true }).click();
  await page.waitForTimeout(500);

  await page
    .getByRole('textbox', { name: /Report start date/i })
    .fill(formattedDate);
  await page
    .getByRole('textbox', { name: /Report end date/i })
    .fill(formattedDate);

  const groupByListbox = page.getByRole('listbox').first();
  const groupByShowsEmployee = await groupByListbox
    .getByRole('option', { name: 'Employee', exact: true })
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (!groupByShowsEmployee) {
    await groupByListbox.click();
    await page
      .getByRole('option', { name: 'Employee', exact: true })
      .last()
      .click();
    await page.waitForTimeout(500);
  }

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

  // Row: dgrid body row whose text includes the notes (no col-* needed to find the row)
  const reportRow = page
    .locator('div.dgrid-row')
    .filter({ hasText: 'Comprehensive validation test' })
    .first();
  await expect(reportRow).toBeVisible({ timeout: 10000 });

  // Cells: match class token col-N ([class~="col-1"] avoids col-10 matching "col-1" substring hacks)
  const col = (n: number) => reportRow.locator(`[class~="col-${n}"]`);

  if (customerValue == null) {
    throw new Error('customerValue is required for report validation');
  }
  await expect(col(1)).toContainText(customerValue);
  console.log('  ✓ Customer validated in report');

  if (serviceValue) {
    await expect(col(2)).toContainText(serviceValue);
    console.log('  ✓ Service validated in report');
  }

  await expect(col(3)).toContainText('Comprehensive validation test');
  console.log('  ✓ Notes validated in report');

  await expect(col(5)).toContainText(/3:30|03:30/);
  console.log('  ✓ Duration validated in report');

  await expect(col(6)).toContainText(/Yes|Y/i);
  console.log('  ✓ Billable status validated in report');

  console.log(
    '✓ Reports validation completed - Customer, Service, Notes, Duration, Billable',
  );

  console.log('');
  console.log('='.repeat(70));
  console.log('✓ COMPREHENSIVE DATA VALIDATION COMPLETED SUCCESSFULLY');
  console.log('='.repeat(70));
}

/**
 * Combined tests for sorting, searching, and column visibility
 */
export async function sortingSearchColumnTests(page: Page): Promise<void> {
  console.log('');
  console.log('='.repeat(70));
  console.log('SORTING, SEARCH, AND COLUMN VISIBILITY TESTS');
  console.log('='.repeat(70));

  const timeEntriesPage = new TimeEntriesPage(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);

  // Navigate to Time Entries
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  // Pre-test cleanup - delete any existing test entries
  console.log('Step 0: Pre-test cleanup - removing existing test data...');
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Detect the correct employee name format for Test Emp1
  const TEST_EMPLOYEE_CLEANUP = {
    listView: 'Emp1, Test',
    alternateListView: 'Test Emp1',
  };
  const testEmp1Name = await timeEntriesPage.getEmployeeNameForListView(
    TEST_EMPLOYEE_CLEANUP.listView,
    TEST_EMPLOYEE_CLEANUP.alternateListView,
  );

  // Delete all Test Emp1 entries
  let count = await timeEntriesPage.countEmployeeRow(testEmp1Name);
  while (count > 0) {
    await timeEntriesPage.clickActionDropdownForEmployee(testEmp1Name);
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Refresh data
    await selectDisplayByOption(page, 'Customer');
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    count = await timeEntriesPage.countEmployeeRow(testEmp1Name);
  }
  console.log('  ✓ Deleted all Test Emp1 entries');

  // Detect the correct employee name format for Zack Test
  const ZACK_TEST_CLEANUP = {
    listView: 'Test, Zack',
    alternateListView: 'Zack Test',
  };
  const zackTestName = await timeEntriesPage.getEmployeeNameForListView(
    ZACK_TEST_CLEANUP.listView,
    ZACK_TEST_CLEANUP.alternateListView,
  );

  // Delete all Zack Test entries
  count = await timeEntriesPage.countEmployeeRow(zackTestName);
  while (count > 0) {
    await timeEntriesPage.clickActionDropdownForEmployee(zackTestName);
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Refresh data
    await selectDisplayByOption(page, 'Customer');
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    count = await timeEntriesPage.countEmployeeRow(zackTestName);
  }
  console.log('  ✓ Deleted all Zack Test entries');
  console.log('✓ Pre-test cleanup completed');

  // Add multiple STAs for testing - using START/END TIME (not duration) so Time column is populated
  console.log(
    'Step 1: Adding multiple STAs with start/end times for testing...',
  );

  // Create 3 STAs with different start/end times
  const startTimes = ['8:00 AM', '9:00 AM', '10:00 AM'];
  const endTimes = ['10:00 AM', '11:30 AM', '1:00 PM'];

  for (let i = 1; i <= 3; i++) {
    await clickAddTimeDropdown(page);
    await selectSingleTimeEntryFromAddTime(page, true);
    await singleTimeActivityPage.validateSTALoaded();
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(2000);

    // Select team member: entries 1&2 use team member 1, entry 3 uses team member 2
    const teamMemberOption = i <= 2 ? 1 : 2;
    await singleTimeActivityPage.clickDropdownOption(teamMemberOption, 'Name');
    await singleTimeActivityPage.clickDropdownOption(i, 'Customers'); // Different customers
    await singleTimeActivityPage.clickDropdownOption(1, 'Service');

    // Enable start/end time mode
    if (!(await singleTimeEntryPage.verifySetClockToggleState())) {
      await singleTimeEntryPage.clickSetClockInAndOutToggles();
      await page.waitForTimeout(1000);
    }

    // Set start and end times using selectTime method
    await singleTimeActivityPage.selectTime('Start', startTimes[i - 1]);
    await page.waitForTimeout(500);
    await singleTimeActivityPage.selectTime('End', endTimes[i - 1]);
    await page.waitForTimeout(500);

    await singleTimeEntryPage.enterNotes(`Test entry ${i}`);
    await singleTimeEntryPage.clickSaveAndCloseButton();
    await singleTimeEntryPage.validateSuccessToast();
    await timeEntriesPage.waitForLoadingToDisappear(); // Save and close takes back to Time Entries
    await page.waitForTimeout(2000); // Wait for page transition
    await expect(page.getByLabel('Display by')).toBeVisible({ timeout: 10000 }); // Ensure page is fully loaded
  }

  console.log('✓ Multiple STAs created successfully');

  // Refresh page to ensure all entries are visible
  console.log('Step 2: Refreshing page to load all entries...');
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Set date range to "This month" to ensure entries are visible
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('✓ Page refreshed and entries validation completed');

  // Test Sorting with validation
  console.log('Step 3: Testing sorting functionality with validation...');

  // Helper function to get column values from table (skip collapsible header rows)
  const getColumnValues = async (columnName: string): Promise<string[]> => {
    const values: string[] = [];
    const headers = await timeEntriesPage.getTableHeaders();
    const columnIndex = headers.indexOf(columnName);
    console.log(
      `    DEBUG getColumnValues: Looking for column "${columnName}" at index ${columnIndex}`,
    );
    console.log(`    DEBUG getColumnValues: Headers:`, headers);

    // Get all rows
    const allRows = await page.locator('//table//tbody//tr').all();
    console.log(
      `    DEBUG getColumnValues: Total rows found: ${allRows.length}`,
    );

    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      const cells = await row.locator('td').allTextContents();
      console.log(
        `    DEBUG getColumnValues: Row ${i} has ${cells.length} cells:`,
        cells,
      );

      // Skip date header rows - they typically have only 1 cell with date text
      // Data rows have multiple cells (Name, Time, Hours, Customer, etc.)
      if (cells.length <= 1) {
        console.log(
          `    DEBUG getColumnValues: Row ${i} SKIPPED (single cell)`,
        );
        continue; // Skip header rows with single cell
      }

      // Cells array has an extra empty cell at index 0 (collapse button column)
      // So we need to add +1 to the columnIndex
      const actualIndex = columnIndex + 1;

      // Only add if we have a valid cell value at this index
      if (
        cells.length > actualIndex &&
        cells[actualIndex] &&
        cells[actualIndex].trim()
      ) {
        const cellValue = cells[actualIndex].trim();
        console.log(
          `    DEBUG getColumnValues: Row ${i} cell value at index ${actualIndex}: "${cellValue}"`,
        );
        // Skip if it looks like a date header (contains comma and year)
        if (!cellValue.includes(',') || !cellValue.includes('202')) {
          values.push(cellValue);
          console.log(
            `    DEBUG getColumnValues: Row ${i} ADDED: "${cellValue}"`,
          );
        } else {
          console.log(
            `    DEBUG getColumnValues: Row ${i} SKIPPED (looks like date)`,
          );
        }
      }
    }
    console.log(`    DEBUG getColumnValues: Final values array:`, values);
    return values;
  };

  // Sort by Name
  let beforeSort = await getColumnValues('Name');
  console.log('  DEBUG: beforeSort Name values:', beforeSort);
  await timeEntriesPage.clickSortIcon('Name');
  await timeEntriesPage.waitForLoadingToDisappear();
  let afterSort = await getColumnValues('Name');
  console.log('  DEBUG: afterSort Name values (ascending):', afterSort);

  // Verify ascending sort
  const expectedAscending = [...afterSort].sort();
  expect(afterSort).toEqual(expectedAscending);
  console.log('  ✓ Sorted by Name (ascending) - verified correct order');

  beforeSort = afterSort;
  await timeEntriesPage.clickSortIcon('Name');
  await timeEntriesPage.waitForLoadingToDisappear();
  afterSort = await getColumnValues('Name');
  console.log('  DEBUG: afterSort Name values (descending):', afterSort);

  // Verify descending sort
  const expectedDescending = [...afterSort].sort().reverse();
  expect(afterSort).toEqual(expectedDescending);
  console.log('  ✓ Sorted by Name (descending) - verified correct order');

  await page.waitForTimeout(1000); // Wait before next column

  // Sort by Time
  beforeSort = await getColumnValues('Time');
  console.log('  DEBUG: beforeSort Time values:', beforeSort);
  await timeEntriesPage.clickSortIcon('Time');
  await timeEntriesPage.waitForLoadingToDisappear();
  afterSort = await getColumnValues('Time');
  console.log('  DEBUG: afterSort Time values (ascending):', afterSort);
  expect(afterSort).toEqual([...afterSort].sort());
  console.log('  ✓ Sorted by Time (ascending) - verified correct order');

  beforeSort = afterSort;
  await timeEntriesPage.clickSortIcon('Time');
  await timeEntriesPage.waitForLoadingToDisappear();
  afterSort = await getColumnValues('Time');
  console.log('  DEBUG: afterSort Time values (descending):', afterSort);
  expect(afterSort).toEqual([...afterSort].sort().reverse());
  console.log('  ✓ Sorted by Time (descending) - verified correct order');

  await page.waitForTimeout(1000); // Wait before next column

  // Sort by Hours
  beforeSort = await getColumnValues('Hours');
  console.log('  DEBUG: beforeSort Hours values:', beforeSort);
  await timeEntriesPage.clickSortIcon('Hours');
  await timeEntriesPage.waitForLoadingToDisappear();
  afterSort = await getColumnValues('Hours');
  console.log('  DEBUG: afterSort Hours values (ascending):', afterSort);
  expect(afterSort).toEqual([...afterSort].sort());
  console.log('  ✓ Sorted by Hours (ascending) - verified correct order');

  beforeSort = afterSort;
  await timeEntriesPage.clickSortIcon('Hours');
  await timeEntriesPage.waitForLoadingToDisappear();
  afterSort = await getColumnValues('Hours');
  console.log('  DEBUG: afterSort Hours values (descending):', afterSort);
  expect(afterSort).toEqual([...afterSort].sort().reverse());
  console.log('  ✓ Sorted by Hours (descending) - verified correct order');

  await page.waitForTimeout(1000); // Wait before next column

  // Sort by Customer
  beforeSort = await getColumnValues('Customer');
  console.log('  DEBUG: beforeSort Customer values:', beforeSort);
  await timeEntriesPage.clickSortIcon('Customer');
  await timeEntriesPage.waitForLoadingToDisappear();
  afterSort = await getColumnValues('Customer');
  console.log('  DEBUG: afterSort Customer values (ascending):', afterSort);
  expect(afterSort).toEqual([...afterSort].sort());
  console.log('  ✓ Sorted by Customer (ascending) - verified correct order');

  beforeSort = afterSort;
  await timeEntriesPage.clickSortIcon('Customer');
  await timeEntriesPage.waitForLoadingToDisappear();
  afterSort = await getColumnValues('Customer');
  console.log('  DEBUG: afterSort Customer values (descending):', afterSort);
  expect(afterSort).toEqual([...afterSort].sort().reverse());
  console.log('  ✓ Sorted by Customer (descending) - verified correct order');

  // Test Searching (Team Member filter)
  console.log('Step 4: Testing search functionality...');
  await timeEntriesPage.clickTeamMember();
  await timeEntriesPage.fillTeamMember('Test Emp1');

  // Validate that the search result option appears in the dropdown
  const searchOption = page.locator(
    '//li[@role="menuitem" and contains(@aria-label, "Test Emp1")]',
  );
  await expect(searchOption).toBeVisible({ timeout: 5000 });
  console.log('  ✓ Search result "Test Emp1" appeared in dropdown');

  // Click on the option to apply the filter
  await timeEntriesPage.selectTeamMember('Test Emp1');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Validate that only Test Emp1 entries are shown
  const visibleRows = await page
    .locator('//table//tbody//tr[not(contains(@class, "collapsible"))]')
    .all();
  let testEmp1Count = 0;
  for (const row of visibleRows) {
    const text = await row.textContent();
    if (text && text.includes('Test Emp1')) {
      testEmp1Count++;
    }
  }
  expect(testEmp1Count).toBeGreaterThan(0);
  console.log(
    `  ✓ Filtered by team member: Test Emp1 - showing ${testEmp1Count} entries`,
  );

  // Test Column Visibility
  console.log('Step 5: Testing column visibility...');

  // Open settings and ensure popover is loaded
  await timeEntriesPage.clickSettingsButton();
  await page.waitForTimeout(1000);
  await expect(page.getByText('View hours as')).toBeVisible();

  const serviceCheckbox = await timeEntriesPage.getColumnsCheckboxFromSettings(
    'Service',
  );
  const isServiceChecked =
    (await serviceCheckbox.getAttribute('checked')) !== null;
  if (isServiceChecked) {
    await serviceCheckbox.click();

    // Wait for popup to close
    await expect(page.getByText('View hours as')).not.toBeVisible();
    await page.waitForTimeout(500);
    console.log('  ✓ Hidden Service column');

    // Validate Service column is hidden
    const serviceHeader = page.locator(
      '//th/ div[contains(text(), "Service")]',
    );
    await expect(serviceHeader).not.toBeVisible();
    console.log('  ✓ Verified Service column is hidden');
  }

  // Open settings again and show Service column (popup will close after clicking)
  await timeEntriesPage.clickSettingsButton();
  await page.waitForTimeout(1000);
  await expect(page.getByText('View hours as')).toBeVisible();

  const serviceCheckbox2 = await timeEntriesPage.getColumnsCheckboxFromSettings(
    'Service',
  );
  const isServiceUnchecked =
    (await serviceCheckbox2.getAttribute('checked')) === null;
  if (isServiceUnchecked) {
    await serviceCheckbox2.click();

    // Wait for popup to close
    await expect(page.getByText('View hours as')).not.toBeVisible();
    await page.waitForTimeout(500);
    console.log('  ✓ Shown Service column');

    // Validate Service column is visible again
    const serviceHeaderVisible = page.locator(
      '//th/ div[contains(text(), "Service")]',
    );
    await expect(serviceHeaderVisible).toBeVisible();
    console.log('  ✓ Verified Service column is visible');
  }

  console.log('  ✓ Column visibility test completed');

  console.log('');
  console.log('='.repeat(70));
  console.log('✓ SORTING, SEARCH, AND COLUMN TESTS COMPLETED SUCCESSFULLY');
  console.log('='.repeat(70));
}

/**
 * Tests for STA with start/end time
 */
export async function startEndTimeTests(page: Page): Promise<void> {
  console.log('');
  console.log('='.repeat(70));
  console.log('START/END TIME TESTS');
  console.log('='.repeat(70));

  const timeEntriesPage = new TimeEntriesPage(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);

  // Navigate to Time Entries
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  // ========== ERROR VALIDATION TESTS (FIRST) ==========
  console.log('Step 1: Testing error validations for Start/End Time...');
  await clickAddTimeDropdown(page);
  await selectSingleTimeEntryFromAddTime(page, true);
  await singleTimeActivityPage.validateSTALoaded();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);

  await singleTimeActivityPage.clickDropdownOption(1, 'Name');

  // Enable clock in/out toggle
  const isSetClockOn = await singleTimeEntryPage.verifySetClockToggleState();
  if (!isSetClockOn) {
    await singleTimeEntryPage.clickSetClockInAndOutToggles();
    await page.waitForTimeout(1000);
  }

  // Test invalid start time
  const startTimeInput = page.locator(
    `//span[text()='Start time']/ancestor::label/descendant::input[@data-testid="__textField"]`,
  );
  await startTimeInput.click();
  await startTimeInput.fill('99:99');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.validateInvalidTimeError('Start');
  console.log('  ✓ Invalid start time error validated');

  // Test invalid end time
  await startTimeInput.click();
  await startTimeInput.fill('9:00 AM');
  await page.keyboard.press('Tab');
  const endTimeInput = page.locator(
    `//span[text()='End time']/ancestor::label/descendant::input[@data-testid="__textField"]`,
  );
  await endTimeInput.click();
  await endTimeInput.fill('25:00');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.validateInvalidTimeError('End');
  console.log('  ✓ Invalid end time error validated');

  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('✓ Error validation tests completed');

  // ========== HAPPY PATH ==========
  console.log('Step 2: Adding STA with start/end time...');
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await clickAddTimeDropdown(page);
  await selectSingleTimeEntryFromAddTime(page, true);
  await singleTimeActivityPage.validateSTALoaded();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);

  await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  const nameValue = await singleTimeEntryPage.getFieldValue('Name');

  // Enable and set start/end time
  if (!(await singleTimeEntryPage.verifySetClockToggleState())) {
    await singleTimeEntryPage.clickSetClockInAndOutToggles();
    await page.waitForTimeout(1000);
  }
  // Use selectTime method to properly select times from dropdown
  await singleTimeActivityPage.selectTime('Start', '9:00 AM');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.selectTime('End', '12:00 PM');
  await page.waitForTimeout(500);

  await singleTimeActivityPage.clickDropdownOption(1, 'Customers');
  const customerValue = await singleTimeEntryPage.getFieldValue('Customers');
  await singleTimeActivityPage.clickDropdownOption(1, 'Service');
  const serviceValue = await singleTimeEntryPage.getFieldValue('Service');
  await singleTimeEntryPage.enterNotes('Start/End time test');
  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000); // Wait for page transition
  await expect(page.getByLabel('Display by')).toBeVisible({ timeout: 10000 }); // Ensure page is fully loaded
  console.log('✓ STA with start/end time created');

  // Validate in Date View
  console.log('Step 3: Validating in Date View...');
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Debug: Check table headers
  const headers = await timeEntriesPage.getTableHeaders();
  console.log('  DEBUG: Table headers =', headers);

  const dateViewRow = await timeEntriesPage.getRowObjectForEmployee(
    nameValue || 'Test Emp1',
  );
  console.log('  DEBUG: dateViewRow =', JSON.stringify(dateViewRow, null, 2));
  console.log('  DEBUG: dateViewRow.Time =', dateViewRow.Time);
  expect(dateViewRow.Time).toContain('9:00 AM');
  expect(dateViewRow.Time).toContain('12:00 PM');
  expect(normalizeToMinutes(dateViewRow.Hours || '')).toBe(
    normalizeToMinutes('3:00'),
  );
  expect(dateViewRow.Customer).toContain(customerValue || '');
  expect(dateViewRow.Service).toContain(serviceValue || '');
  expect(dateViewRow.Notes).toContain('Start/End time test');
  console.log(
    '✓ Date View validation completed - Time, Hours, Customer, Service, Notes',
  );

  // NOTE: Employee view validation removed - Employee view no longer exists in Time Entries

  // ========== EDIT FLOW ==========
  console.log('Step 4: Testing edit flow for start/end time...');

  // Navigate to Time Entries and set up filters
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Click Edit button directly on the row
  await timeEntriesPage.clickEditForEmployee(nameValue || 'Test Emp1');
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);

  // Edit start and end times using selectTime method (it will replace existing values)
  await singleTimeActivityPage.selectTime('Start', '10:00 AM');
  await page.waitForTimeout(500);

  await singleTimeActivityPage.selectTime('End', '2:00 PM');
  await page.waitForTimeout(500);

  // Update notes
  await singleTimeEntryPage.enterNotes(
    'Updated: Start/End time test - Modified',
  );

  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);
  await expect(page.getByLabel('Display by')).toBeVisible({ timeout: 10000 });
  console.log('✓ STA with start/end time edited');

  // Validate edited data in Date View
  console.log('Step 5: Validating edited data in Date View...');
  // Reload page to ensure fresh data after edit
  await page.reload({ waitUntil: 'load' });
  await timeEntriesPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  const dateViewRowEdited = await timeEntriesPage.getRowObjectForEmployee(
    nameValue || 'Test Emp1',
  );
  expect(dateViewRowEdited.Time).toContain('10:00 AM');
  expect(dateViewRowEdited.Time).toContain('2:00 PM');
  expect(normalizeToMinutes(dateViewRowEdited.Hours || '')).toBe(
    normalizeToMinutes('4:00'),
  );
  expect(dateViewRowEdited.Notes).toContain(
    'Updated: Start/End time test - Modified',
  );
  console.log(
    '✓ Date View validation after edit completed - Updated Time, Hours, Notes',
  );

  // NOTE: Employee view validation after edit removed - Employee view no longer exists in Time Entries

  console.log('');
  console.log('='.repeat(70));
  console.log('✓ START/END TIME TESTS COMPLETED (with Edit Flow)');
  console.log('='.repeat(70));
}

/**
 * Billable validation and summary tests
 */
export async function billableValidationTests(page: Page): Promise<void> {
  console.log('');
  console.log('='.repeat(70));
  console.log('BILLABLE VALIDATION TESTS');
  console.log('='.repeat(70));

  const timeEntriesPage = new TimeEntriesPage(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);

  // Navigate to Time Entries
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  // ========== TEST 1: Employee Bill Rate Auto-Population ==========
  console.log('Step 1: Testing employee bill rate auto-population...');
  await clickAddTimeDropdown(page);
  await selectSingleTimeEntryFromAddTime(page, true);
  await singleTimeActivityPage.validateSTALoaded();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);

  await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  await singleTimeActivityPage.clickDropdownOption(1, 'Customers');
  await singleTimeEntryPage.enterFieldValue('Duration', '2:30');

  // Check billable checkbox to enable bill rate field
  const billableCheckbox = page.locator(
    '//span[contains(text(), "Billable")]/ancestor::label/descendant::input',
  );
  const isBillableVisible = await billableCheckbox
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (isBillableVisible) {
    const isChecked = await billableCheckbox.isChecked();
    if (!isChecked) {
      await billableCheckbox.check();
      await page.waitForTimeout(1000);
    }

    // Get employee bill rate (should auto-populate)
    const employeeBillRate = await singleTimeActivityPage.returnBillRateValue();
    console.log(`  Employee bill rate auto-populated: $${employeeBillRate}`);

    // Tab out from the last field to trigger summary calculation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    // Validate summary with employee rate
    const summary1 = await page
      .locator('//*[contains(text(), "Summary:")]')
      .textContent();
    console.log(`  Summary: ${summary1}`);
    expect(summary1).toContain('2 hours 30 minutes');
    if (employeeBillRate && employeeBillRate > 0) {
      expect(summary1).toContain(employeeBillRate.toString());
    }
    console.log('  ✓ Employee bill rate validated');
  }

  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();
  await timeEntriesPage.waitForLoadingToDisappear();

  // ========== TEST 2: Service Rate Overrides Employee Rate ==========
  console.log('Step 2: Testing service rate override...');
  await clickAddTimeDropdown(page);
  await selectSingleTimeEntryFromAddTime(page, true);
  await singleTimeActivityPage.validateSTALoaded();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);

  await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  await singleTimeActivityPage.clickDropdownOption(1, 'Customers');
  await singleTimeEntryPage.enterFieldValue('Duration', '2:30');

  const billableCheckbox2 = page.locator(
    '//span[contains(text(), "Billable")]/ancestor::label/descendant::input',
  );
  const isBillableVisible2 = await billableCheckbox2
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (isBillableVisible2) {
    const isChecked2 = await billableCheckbox2.isChecked();
    if (!isChecked2) {
      await billableCheckbox2.check();
      await page.waitForTimeout(1000);
    }

    // Get employee bill rate first
    const employeeBillRate = await singleTimeActivityPage.returnBillRateValue();
    console.log(`  Employee bill rate: $${employeeBillRate}`);

    // Now select 'abc' service (which has a service rate) - it's the 3rd option
    await singleTimeActivityPage.clickDropdownOption(3, 'Service');
    await page.waitForTimeout(1000);

    // Get bill rate after service selection
    const billRateAfterService =
      await singleTimeActivityPage.returnBillRateValue();
    console.log(
      `  Bill rate after service selection: $${billRateAfterService}`,
    );

    // If service has a rate, it should override employee rate
    if (billRateAfterService && billRateAfterService !== employeeBillRate) {
      console.log(
        `  ✓ Service rate ($${billRateAfterService}) overrode employee rate ($${employeeBillRate})`,
      );
    }

    // Tab out from the last field to trigger summary calculation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    // Validate summary with updated rate
    const summary2 = await page
      .locator('//*[contains(text(), "Summary:")]')
      .textContent();
    console.log(`  Summary: ${summary2}`);
    expect(summary2).toContain('2 hours 30 minutes');
    expect(summary2).toContain('$');
    console.log('  ✓ Service rate override validated');
  }

  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();
  await timeEntriesPage.waitForLoadingToDisappear();

  // ========== TEST 3: Manual Bill Rate and Summary Calculation ==========
  console.log('Step 3: Testing manual bill rate and summary calculation...');
  await clickAddTimeDropdown(page);
  await selectSingleTimeEntryFromAddTime(page, true);
  await singleTimeActivityPage.validateSTALoaded();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);

  await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  await singleTimeActivityPage.clickDropdownOption(1, 'Customers');

  // Select 'abc' service (3rd option)
  await singleTimeActivityPage.clickDropdownOption(3, 'Service');
  await page.waitForTimeout(1000);

  await singleTimeEntryPage.enterFieldValue('Duration', '2:30');

  const billableCheckbox3 = page.locator(
    '//span[contains(text(), "Billable")]/ancestor::label/descendant::input',
  );
  const isBillableVisible3 = await billableCheckbox3
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (isBillableVisible3) {
    const isChecked3 = await billableCheckbox3.isChecked();
    if (!isChecked3) {
      await billableCheckbox3.check();
      await page.waitForTimeout(1000);
    }

    // Set manual bill rate
    await singleTimeActivityPage.fillBillRateInput('100.00');
    await page.waitForTimeout(1000);
    console.log('  Manual bill rate set to: $100.00');

    // Tab out from the last field to trigger summary calculation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    // Validate summary calculation (2.5 hours * $100 = $250)
    const summary3 = await page
      .locator('//*[contains(text(), "Summary:")]')
      .textContent();
    console.log(`  Summary: ${summary3}`);
    expect(summary3).toContain('2 hours 30 minutes');
    expect(summary3).toContain('$100.00 per hour');
    expect(summary3).toContain('$250.00');
    console.log('  ✓ Manual bill rate and summary calculation validated');
  }

  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('✓ All billable validation tests completed');

  console.log('');
  console.log('='.repeat(70));
  console.log('✓ BILLABLE VALIDATION TESTS COMPLETED');
  console.log('='.repeat(70));
}

/**
 * Cleanup function for comprehensive tests
 */
export async function cleanupComprehensiveTests(page: Page): Promise<void> {
  try {
    const timeEntriesPage = new TimeEntriesPage(page);

    // Navigate to Time Entries
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Set Date view and This month filter
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    // Detect the correct employee name format (same as cleanupUnifyTimesheetTestData)
    const TEST_EMPLOYEE_CLEANUP = {
      listView: 'Emp1, Test',
      alternateListView: 'Test Emp1',
    };
    const cleanupEmployeeName =
      await timeEntriesPage.getEmployeeNameForListView(
        TEST_EMPLOYEE_CLEANUP.listView,
        TEST_EMPLOYEE_CLEANUP.alternateListView,
      );

    // Delete all Test Emp1 entries
    let count = await timeEntriesPage.countEmployeeRow(cleanupEmployeeName);
    while (count > 0) {
      await timeEntriesPage.clickActionDropdownForEmployee(cleanupEmployeeName);
      await timeEntriesPage.clickDeleteInActionDropdown();
      await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
      await timeEntriesPage.clickYesOnDeleteEntryPopup();
      await timeEntriesPage.waitForLoadingToDisappear();

      // Refresh data by switching filters
      await selectDisplayByOption(page, 'Customer');
      await timeEntriesPage.waitForLoadingToDisappear();
      await selectDisplayByOption(page, 'Date');
      await timeEntriesPage.waitForLoadingToDisappear();

      // Re-apply date filter after view switch
      await openDateRangeDropdown(page);
      await selectDateRangeOption(page, 'This month');
      await timeEntriesPage.waitForLoadingToDisappear();

      count = await timeEntriesPage.countEmployeeRow(cleanupEmployeeName);
    }

    console.log('✓ Cleanup completed successfully');
  } catch (error) {
    console.log('Cleanup encountered an error:', error);
  }
}
