import { Page, expect } from '@playwright/test';
import gotoWithAuthSession from '../../gotoWithAuthSession';
import MileagePage from '../../pages/MileagePage';
import TimeEntriesPage from '../../pages/TimeEntriesPage';
import TimeSettingsPage from '../../pages/TimeSettingsPage';
import {
  clickAddTimeDropdown,
  normalizeToMinutes,
  openDateRangeDropdown,
  selectDateRangeOption,
  selectDisplayByOption,
  selectSingleTimeEntryFromAddTime,
} from '../../commonUtils';
import SingleTimeEntryPage from '../../pages/SingleTimeEntryPage';
import SingleTimeActivityPage from '../../pages/SingleTimeActivityPage';
import { LABELS } from '../../constants';
import * as commonLocator from '../../commonUtils';

// Employee name constants - handle both formats
const TEST_EMPLOYEE = {
  listView: 'Emp1, Test',
  dropdown: 'Test Emp1',
  alternateListView: 'Test Emp1',
};

export const verifyMileageSettingsDualSyncFromQL = async (page: Page) => {
  // Step 1: Click on required radio button and click on toggle
  await MileagePage.navigateToQboTimeSettings(page);
  await MileagePage.enableMileageTrackingInQBO(page);

  // Step 2: Validate milage is on
  await MileagePage.verifyQBOMileageTrackingOn(page);

  await TimeSettingsPage.navigateToTimeEntries(page);

  // Step 3: Navigate to classic timesheet and Feature Add-ons
  const { classicPage } = await MileagePage.navigateToClassicFeatureAddons(
    page,
  );

  // Step 4: Check whether Mileage Tracking text is visible and in same row Uninstall text is visible
  await MileagePage.verifyClassicMileageTrackingWithUninstall(classicPage);

  // Step 5: Click on the classic milage install
  await MileagePage.clickOnClassicMileageTrackingWithUninstall(classicPage);

  // Step 6: Check whether Mileage Tracking text is visible and in same row install text is visible
  await MileagePage.verifyClassicMileageTrackingWithInstall(classicPage);

  // Switch back to QBO page
  await page.bringToFront();

  // Step 7: Validate milage is off
  await MileagePage.navigateToQboTimeSettings(page);
  await MileagePage.verifyQBOMileageTrackingOff(page);
};

export const verifyMileageSettingsDualSyncFromTsheets = async (page: Page) => {
  // Step 1: Navigate to classic timesheet and Feature Add-ons
  await TimeSettingsPage.navigateToTimeEntries(page);
  const { classicPage } = await MileagePage.navigateToClassicFeatureAddons(
    page,
  );

  // Step 2: Click on the classic milage install
  await MileagePage.clickOnClassicMileageTrackingWithInstall(classicPage);

  // Step 3: Check whether Mileage Tracking text is visible and in same row uninstall text is visible
  await MileagePage.verifyClassicMileageTrackingWithUninstall(classicPage);

  // Switch back to QBO page
  await page.bringToFront();

  // Step 4: Validate milage is on
  await MileagePage.navigateToQboTimeSettings(page);
  await MileagePage.verifyQBOMileageTrackingOn(page);

  // Step 5: Disable the milage value
  await MileagePage.disableMileageTrackingInQBO(page);

  // Step 6: Validate milage is off
  await MileagePage.verifyQBOMileageTrackingOff(page);

  // Switch back to classic page
  await classicPage.bringToFront();

  await classicPage.reload({ waitUntil: 'load' });

  // Step 6: Check whether Mileage Tracking text is visible and in same row install text is visible
  await MileagePage.verifyClassicMileageTrackingWithInstall(classicPage);
};

export const crudWithMileageFromQL = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);

  // Navigate to Time Entries and wait for data
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  const timeEntryData = await createSingleTimeEntry(page);

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  await timeEntriesPage.clickSettingsButton();
  await page.waitForTimeout(500);
  const milesCheckbox = await timeEntriesPage.getColumnsCheckboxFromSettings(
    'Miles',
  );
  const isChecked = await milesCheckbox.isChecked();
  if (!isChecked) {
    await milesCheckbox.click();
    await page.waitForTimeout(300);
    console.log('✓ Miles checkbox was not checked, now checked');
    await timeEntriesPage.waitForSettingsPopupToClose();
  } else {
    console.log('✓ Miles checkbox is already checked');
    await timeEntriesPage.clickSettingsButton(); // Close settings popup
  }

  //close sidepanel
  await MileagePage.SidepanelCloseFunction(page);

  // Validate the mileage value in time entries
  await validateMilageValueInTimeEntriesTable(
    page,
    'Emp1, Test',
    timeEntryData.milage,
  );

  await page.getByRole('button', { name: 'Edit', exact: true }).click();

  // Edit the milage value
  await page
    .locator(`//span[text()='Mileage']/following-sibling::div/input`)
    .fill('60');

  // Save the entry
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await singleTimeEntryPage.validateSuccessToast();

  // Close dialog if open
  const closeBtn = page.locator(`//button[@aria-label='Close']`).first();
  if (await closeBtn.count()) {
    await closeBtn.click();
  }

  // Validate the edited mileage value in time entries
  await validateMilageValueInTimeEntriesTable(page, 'Emp1, Test', '60');
};

export const crudWithMileageFromTsheets = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);

  // Navigate to Time Entries and wait for data
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  const timeEntryData = await createSingleTimeEntry(page);

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  await timeEntriesPage.clickSettingsButton();
  await page.waitForTimeout(500);
  const milesCheckbox2 = await timeEntriesPage.getColumnsCheckboxFromSettings(
    'Miles',
  );
  const isChecked2 = await milesCheckbox2.isChecked();
  if (!isChecked2) {
    await milesCheckbox2.click();
    await page.waitForTimeout(300);
    console.log('✓ Miles checkbox was not checked, now checked');
    await timeEntriesPage.waitForSettingsPopupToClose();
  } else {
    console.log('✓ Miles checkbox is already checked');
    await timeEntriesPage.clickSettingsButton(); // Close settings popup
  }

  // Validate the mileage value in time entries
  await validateMilageValueInTimeEntriesTable(
    page,
    'Emp1, Test',
    timeEntryData.milage,
  );

  const { classicPage } = await MileagePage.navigateToClassicTimeEntries(page);

  await MileagePage.updateMileageValueFromClasssicTimeSheet(classicPage);
  await MileagePage.validateMileageValueInClassicTimeEntries(classicPage);

  // Switch back to page
  await page.bringToFront();

  // Validate the edited mileage value in time entries
  await validateMilageValueInTimeEntriesTable(page, 'Emp1, Test', '60');
};

export const validateMileageColumnVisibilityInQL = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);

  // Navigate to Time Entries
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  const timeEntryData = await createSingleTimeEntry(page);

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Open settings / actions and enable Miles column
  await timeEntriesPage.clickSettingsButton();
  const milesCheckbox = await timeEntriesPage.getColumnsCheckboxFromSettings(
    'Miles',
  );
  const isChecked = await milesCheckbox.isChecked();
  if (!isChecked) {
    await milesCheckbox.click();
    await page.waitForTimeout(500);
    await timeEntriesPage.waitForSettingsPopupToClose();
    console.log('✓ Miles column checkbox enabled');
  } else {
    console.log('✓ Miles column checkbox is already enabled');
  }
  // Verify Miles column visible
  await timeEntriesPage.validateColumnVisible('Miles');

  // Disable Miles column
  await timeEntriesPage.clickSettingsButton();
  await page.waitForTimeout(500);
  const isCheckedAfterOpen = await milesCheckbox.isChecked();
  if (isCheckedAfterOpen) {
    try {
      await milesCheckbox.click({ force: true });
    } catch (error) {
      console.log(`Failed to check mileage checkbox: ${error}`);
    }
  }
  await timeEntriesPage.waitForSettingsPopupToClose();

  // Verify Miles column hidden
  await timeEntriesPage.validateColumnHidden('Miles');
};

export const createSingleTimeEntry = async (
  page: Page,
  milage: string = '50',
  duration: string = '08:00',
  notes: string = 'Test note - initial',
) => {
  console.log(`Creating single time entry with duration: ${duration}`);

  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);

  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  //close sidepanel
  await MileagePage.SidepanelCloseFunction(page);

  // Click Add time dropdown and select Single time entry
  await clickAddTimeDropdown(page);
  await page.locator(`//span[text()='Single time entry']`).click();

  // Wait for page to load
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  // Fill in entry details
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  const nameValue = await singleTimeEntryPage.getFieldValue('Name');
  console.log(`Selected employee: "${nameValue}"`);

  // Set date (today)
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await singleTimeEntryPage.fillStartDate(formattedDate);

  // Set duration
  await singleTimeEntryPage.enterFieldValue('Duration', duration);

  // Add notes
  await singleTimeEntryPage.enterNotes(notes);

  // Select first customer and service
  await singleTimeEntryPage.openAndselectCustomerOption(1);
  await page.waitForTimeout(500);

  await singleTimeEntryPage.openDropdown('Service');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.clickDropdownOption(1, 'Service');

  // Billable and rate
  await singleTimeActivityPage.checkCheckboxIfVisible('Billable');
  await singleTimeActivityPage.fillBillRateInput('10');

  // Save the entry
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await singleTimeEntryPage.validateSuccessToast();

  await page.waitForTimeout(8000);

  const mileageCheckBox = await page
    .locator(
      `//div[contains(@class, 'Mileage__CheckboxWrapper')]//input[contains(@class, 'inputCheckboxWrapper')]`,
    )
    .isChecked();

  if (mileageCheckBox) {
    await page
      .locator(
        `//div[contains(@class, 'Mileage__CheckboxWrapper')]//input[contains(@class, 'inputCheckboxWrapper')]`,
      )
      .uncheck();
  }

  // Mileage
  await page
    .locator(`//span[text()='Mileage']/following-sibling::div/input`)
    .fill(milage);

  // Save and close the entry
  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();

  return {
    employeeName: nameValue,
    milage: milage,
    notes: notes,
  };
};

export const validateMilageValueInTimeEntriesTable = async (
  page: Page,
  employeeName: string,
  expectedDuration: string,
) => {
  console.log(`Validating time entries for ${employeeName}`);

  const timeEntriesPage = new TimeEntriesPage(page);

  // Switch to Customer view
  await selectDisplayByOption(page, 'Customer');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Switch to Date view to refresh the data
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Open Date range and select This month
  await commonLocator.openDateRangeDropdown(page);
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await timeEntriesPage.waitForLoadingToDisappear();

  // Validate the entry exists
  const entryCount = await timeEntriesPage.countEmployeeRow(employeeName);
  expect(entryCount).toBeGreaterThan(0);

  // Get row data and validate
  const rowObj = await timeEntriesPage.getRowObjectForEmployee(employeeName);
  const actualMinutes = normalizeToMinutes(rowObj.Miles || '');
  const expectedMinutes = normalizeToMinutes(expectedDuration);
  expect(actualMinutes).toBe(expectedMinutes);
  console.log(`✓ Time entry validated: ${expectedDuration} hours`);
};

export const preCleanupProcess = async (page: Page) => {
  await MileagePage.preCleanupExisitingData(page);
};

export const deleteAllTimeEntries = async (page: Page) => {
  console.log('Cleaning up run payroll test data');

  try {
    const timeEntriesPage = new TimeEntriesPage(page);
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    // Delete all entries for test employee
    const cleanupEmployeeName =
      await timeEntriesPage.getEmployeeNameForListView(
        TEST_EMPLOYEE.listView,
        TEST_EMPLOYEE.alternateListView,
      );

    let count = await timeEntriesPage.countEmployeeRow(cleanupEmployeeName);

    while (count > 0) {
      await selectDisplayByOption(page, 'Date');
      await page
        .locator(`//button[@data-testid='chevron-down-icon-control']`)
        .first()
        .click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await page.getByRole('button', { name: 'Yes' }).click();
      await timeEntriesPage.waitForLoadingToDisappear();

      // Refresh data
      await selectDisplayByOption(page, 'Customer');
      await timeEntriesPage.waitForLoadingToDisappear();
      await selectDisplayByOption(page, 'Date');
      await timeEntriesPage.waitForLoadingToDisappear();

      count = await timeEntriesPage.countEmployeeRow(cleanupEmployeeName);
    }

    console.log('✓ Cleanup completed successfully');
  } catch (error) {
    console.log('Cleanup encountered an error:', error);
  }
};

export const verifyMileageInPrintView = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  const mileageValue = '50';
  const testNotes = 'testing the approval issue';

  // Step 1: Verify mileage is turned on in account and settings
  console.log('Step 1: Verifying mileage tracking is enabled in settings...');
  await MileagePage.navigateToQboTimeSettings(page);
  await page.waitForTimeout(1000);

  const mileageTrackingStatusLabel = page.locator(
    '//label[text()="Mileage tracking"]/following-sibling::span',
  );
  const currentStatus = await mileageTrackingStatusLabel.textContent();

  if (currentStatus === 'Off') {
    console.log('Mileage Tracking is OFF, enabling it...');
    await MileagePage.enableMileageTrackingInQBO(page);
    await MileagePage.verifyQBOMileageTrackingOn(page);
    console.log('✓ Mileage Tracking has been enabled');
  } else {
    console.log('✓ Mileage Tracking is already ON');
  }

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
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
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
  await singleTimeEntryPage.enterFieldValue('Duration', '7');
  await singleTimeEntryPage.enterNotes('Test entry for mileage tracking');
  await singleTimeEntryPage.checkCheckboxIfVisible('Billable');
  await page.waitForTimeout(500);
  console.log('✓ Billable checkbox checked');
  // Save
  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);
  console.log(`✓ Time entry created for Mileage Tracking`);

  // Select Date view and This month range
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Enable Miles column via settings checkbox
  console.log('Enabling Miles column in settings...');
  await timeEntriesPage.clickSettingsButton();
  await page.waitForTimeout(500);
  const milesCheckbox = await timeEntriesPage.getColumnsCheckboxFromSettings(
    'Miles',
  );
  const isChecked = await milesCheckbox.isChecked();
  if (!isChecked) {
    await milesCheckbox.click();
    await page.waitForTimeout(300);
    console.log('✓ Miles checkbox was not checked, now checked');
    await timeEntriesPage.waitForSettingsPopupToClose();
  } else {
    console.log('✓ Miles checkbox is already checked');
    await timeEntriesPage.clickSettingsButton(); // Close settings popup
  }

  // Click Edit button to open the entry for editing
  console.log('Editing the time entry to update mileage value...');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.waitForTimeout(2000);

  // Uncheck Auto calculate checkbox if checked (using existing pattern)
  const autoCalculateCheckbox = page.locator(
    `//div[contains(@class, 'Mileage__CheckboxWrapper')]//input[contains(@class, 'inputCheckboxWrapper')]`,
  );
  const mileageInput = page.locator(
    `//span[text()='Mileage']/following-sibling::div/input`,
  );

  const mileageCheckBox = await autoCalculateCheckbox.isChecked();

  if (mileageCheckBox) {
    await autoCalculateCheckbox.uncheck();
    await page.waitForTimeout(300);
    console.log('✓ Unchecked Auto calculate checkbox');
  }

  // Verify if mileage edit box is editable, if not toggle checkbox again
  const isEditable = await mileageInput.isEditable();
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

  // Edit the mileage value to 50
  await mileageInput.fill(mileageValue);
  console.log(`✓ Set mileage value to: ${mileageValue}`);

  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await page.waitForTimeout(500);

  // Verify updated mileage value in time entries table
  await validateMilageValueInTimeEntriesTable(
    page,
    TEST_EMPLOYEE.listView,
    mileageValue,
  );
  console.log(
    `✓ Updated mileage value ${mileageValue} verified in time entries`,
  );

  // Step 3: Navigate to Approvals
  console.log('Step 3: Navigating to Approvals...');
  await gotoWithAuthSession(page, '/app/time/approval?jobId=time', {
    waitUntil: 'load',
  });
  await page.waitForTimeout(1000);

  // Wait for loading to disappear
  const loadingSpinner = page.locator(
    '//div[@aria-label="Loading" and @role="progressbar"]',
  );
  await loadingSpinner
    .waitFor({ state: 'hidden', timeout: 10000 })
    .catch(() => {});

  // Open the "Date range" dropdown
  await openDateRangeDropdown(page);
  // Select "custom date range" from the "Date range" dropdown
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('✓ Selected This month date range');

  // Find and click on employee row to view details
  const employeeRow = page
    .locator(`//tr[contains(., '${TEST_EMPLOYEE.listView}')]`)
    .first();
  await expect(employeeRow).toBeVisible({ timeout: 10000 });
  console.log(`✓ Found employee: ${TEST_EMPLOYEE.listView}`);

  // Click Expand Menu to view details
  const expandMenu = employeeRow.locator('[aria-label="Expand Menu"]');
  await expandMenu.click();
  await page.waitForTimeout(500);

  // Click View details
  const viewDetailsOption = page.locator(`//*[text()='View details']`);
  await viewDetailsOption.waitFor({ state: 'visible', timeout: 5000 });
  await viewDetailsOption.click();
  await page.waitForTimeout(1000);
  console.log('✓ Clicked View details');

  // Wait for view details page to load
  await loadingSpinner
    .waitFor({ state: 'hidden', timeout: 1000 })
    .catch(() => {});
  const exportPrintDropdown = page.getByRole('button', {
    name: /Export.*Print/i,
  });
  await expect(exportPrintDropdown).toBeVisible({ timeout: 1000 });
  console.log('✓ View details page loaded');

  // Click on Export / Print dropdown
  console.log('Step 4: Clicking Export / Print dropdown...');
  await exportPrintDropdown.click();
  await page.waitForTimeout(1000);

  // Click on "Print or save PDF" option
  const printOrSavePdfOption = page.locator(`//*[text()='Print or save PDF']`);
  await expect(printOrSavePdfOption).toBeVisible();

  // Set up print event listener to detect when print dialog is triggered
  let printTriggered = false;
  await page.evaluate(() => {
    window.addEventListener('beforeprint', () => {
      (window as any).__printTriggered = true;
    });
  });

  // Click the print option
  await printOrSavePdfOption.click();
  console.log('✓ Clicked Print or save PDF');

  // Wait a moment for print dialog to appear
  await page.waitForTimeout(2000);

  // Check if print was triggered
  printTriggered = await page.evaluate(
    () => (window as any).__printTriggered === true,
  );

  if (printTriggered) {
    console.log('Print dialog was triggered successfully');
  } else {
    console.log('Print option clicked');

    // Verify NAME column with employee name "Emp1, Test"
    const employeeNameInTable = page
      .locator(`//*[contains(text(), 'Emp1, Test')]`)
      .first();
    await expect(employeeNameInTable).toBeVisible({ timeout: 10000 });
    console.log('✓ NAME column verified - Employee "Emp1, Test"');

    // Verify MILEAGE column with value "50.00"
    const mileageValueInTable = page
      .locator(`//*[contains(text(), '50.00')]`)
      .first();
    await expect(mileageValueInTable).toBeVisible({ timeout: 10000 });
    console.log('✓ MILEAGE column verified - Value "50.00"');

    // Close print dialog by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  }
};
