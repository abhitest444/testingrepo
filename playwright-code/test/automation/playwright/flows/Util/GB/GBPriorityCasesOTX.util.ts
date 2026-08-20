import { Page } from 'playwright-core';
import { expect } from '@playwright/test';
import TimeClockPage from '../../../pages/GB/GBTimeClockpage';

// Import TSP functions from TimeSettings.Util
import {
  validateNavigationToTimeSettingsTimeTracking,
  validateEditModeTimeTracking,
  validateNavigationToTimeSettingsNotif,
  validateNotifEditMode,
  verifyDualSyncPriorityCase,
  verifyDualSyncCustomizeTimesheetSettingsFromClassicTimesheetSaved,
  verifyDualSyncCustomizeTimesheetSettingsFromQBOSaved,
  verifyNotifDualSyncPriorityCaseClassicSaved,
} from './GBTimeSettings.util';

// Import CF functions from CustomFieldSettings.Util
import { CreateAndDeactivateNewCustomField } from './GBCustomFieldSettings.util';

// Import BR functions from Breaks.Util
import {
  navigateToBreakPreferencesScreen,
  validateBreakSectionPresent,
  validateManageBreaksUIElements,
  addAutomaticBreakRuleAndDeleteIt,
  addManualBreakRuleAndDeleteIt,
} from './GBBreaks.util';

// Import WTE functions from WeeklyTimeEntry.util
import {
  validateWeeklyTimeEntryPersistence,
  validateRowHighlightOnCellSelection,
  validateWeeklyTimeEntryFieldSettingsPopup,
  validateContextMenuOptionsOnCellRightClick,
} from './GBWeeklyTimeEntry.util';

// Import STA methods from STA util files
import {
  saveAndClose,
  validateSTARecentEntries,
  updateSingleTAUsingParamOptimized,
  saveAndCloseStartAndEndTime,
} from './GBSingleTimeActivityCRUD.util';
import {
  addSTAWithYesterdayDate,
  addSTAWithCurrentDateThenUpdateToYesterday,
} from './GBTimeEntries.util';
import { settingsCasesPriorityOptimized } from './GBSingleTimeActivitySettings.util';
import {
  checkForBillRateAndCostRateGettingPreFilledForEmployeePriority,
  checkForBillRateGettingPreFilledForBillableService,
  checkForServiceBillableStatusBillRateAndTaxableStatusGettingUpdated,
} from './GBSingleTimeActivityFeatures.util';
import SingleTimeActivityPage, {
  CERES_DAS_URL_PATTERN,
  waitForResponseWithURLandBody,
} from '../../../pages/GB/GBSingleTimeActivityPage';
import { matchServicesDetailsResponse } from '../../../pages/TimeTrowser';
import TimeSettingsPage from '../../../pages/GB/GBTimeSettingsPage';
import { createAndValidateWeeklyTimeEntry } from '../WeeklyTimeEntry.util';
import { deleteTimeEntry } from '../TimeClockUtil';

// TSP - Time Settings Priority Cases

export async function validateTimeSettingsPriorityCases(page: Page) {
  console.log('Starting: validateTimeSettingsPriorityCases');
  // TSP001 - Verify if Admin lands on to "Time Tracking" section and verifies the edit mode
  await validateNavigationToTimeSettingsTimeTracking(page);
  console.log('Navigated to Time Tracking and verified edit mode');
  await validateEditModeTimeTracking(page);

  // TSP002 - Verify if Admin lands on Notifications sections and verifies the edit mode
  await validateNavigationToTimeSettingsNotif(page);
  console.log('Navigated to Notifications and verified edit mode');
  await validateNotifEditMode(page);

  // TSP003 - Validate split timesheet setting for Time Tracking saved from QBO
  await verifyDualSyncPriorityCase(page);
  console.log('Verified dual sync priority case');

  // TSP004- Validate Clock In/Out reminder settings for Notifications saved from classic timesheet
  await verifyNotifDualSyncPriorityCaseClassicSaved(page);
  console.log(
    'Verified reminder settings for Notifications saved priority case',
  );

  // // TSP005 - Validate the dual sync settings for customize timesheet saved from QBO
  // await verifyDualSyncCustomizeTimesheetSettingsFromQBOSaved(page);
  // console.log('Verified dual sync customise timesheet priority case');

  // // TSP006 - Validate the dual sync settings for customize timesheet saved from classic timesheet
  // await verifyDualSyncCustomizeTimesheetSettingsFromClassicTimesheetSaved(
  //   page,
  // );
  // console.log('Verified dual sync settings for customize timesheet saved from classic timesheet');
}

// set custom timesheet fields pre-requisites
export async function setCustomTimesheetFieldsPrerequisites(page: Page) {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
  await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);
  await TimeSettingsPage.checkedCustomizeTimesheetFieldsCheckbox(page);
  await TimeSettingsPage.checkServiceItemRequired(page);
  await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);
}

// CF - Custom Fields Priority Cases
export async function validateCustomFieldsPriorityCases(page: Page) {
  console.log('Starting: validateCustomFieldsPriorityCases');
  // CF0001 - Validate Custom Field Creation and Deactivation
  await CreateAndDeactivateNewCustomField(page);
  console.log('Custom Field created and deactivated');
}

// BR - Break Rules Priority Cases
export async function validateBreakRulesPriorityCases(page: Page) {
  console.log('Starting: validateBreakRulesPriorityCases');
  // BR001 - Priority Case - Break Rule - Validate Break Rules and Manage Break Sections
  await navigateToBreakPreferencesScreen(page);
  console.log('Navigated to Break Preferences Screen');
  await validateBreakSectionPresent(page);
  console.log('Validated Break Section Present');
  await validateManageBreaksUIElements(page);
  console.log('Validated Manage Breaks UI Elements');

  // BR002 - Priority Case - Break Rule - Add Automatic and Manual Break Rules, Validate and then delete it
  await addAutomaticBreakRuleAndDeleteIt(page);
  console.log('Added and deleted automatic break rule');
  await addManualBreakRuleAndDeleteIt(page);
  console.log('Added and deleted manual break rule');
}

// WTE - Weekly Time Entry Priority Cases
export async function validateWeeklyTimeEntryPriorityCases(page: Page) {
  console.log('Starting: validateWeeklyTimeEntryPriorityCases');
  // WTE001 - Add Weekly Time For Single Row
  await createAndValidateWeeklyTimeEntry(page);
  console.log('Validated weekly time entry persistence');

  // WTE002 - Validate Cell Selection Row Highlighted
  await validateRowHighlightOnCellSelection(page);
  console.log('Validated row highlight on cell selection');

  // WTE003 - Show/Hide Fields - WTE
  await validateWeeklyTimeEntryFieldSettingsPopup(page);
  console.log('Validated weekly time entry field settings popup');

  // WTE004 - Right-Clicked Selected Cell
  await validateContextMenuOptionsOnCellRightClick(page);
  console.log('Validated context menu options on cell right click');
}

// TC - Time Clock Priority Cases
export async function validateTimeClockPriorityCases(page: Page) {
  console.log('Starting: validateTimeClockPriorityCases');
  // TC001 - Enable clock In, clock out
  await TimeClockPage.navigateToTimeClock(page);
  console.log('Navigated to Time Clock');

  console.log('Deleting the time entry...');
  await deleteTimeEntry(page, 'Emp1, Test');

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  console.log('Clicked Clock In');
  await TimeClockPage.waitForDrawerVisible(page);
  console.log('Drawer is visible');

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

  // TC002 - Check mandatory fields
  await TimeClockPage.clickClockOut(page);
  console.log('Clicked Clock Out');

  // Verify error message is displayed
  const timeErrorMsg = await TimeClockPage.getTimeErrorMessage(page);
  console.log('Time error message:', timeErrorMsg);
  expect(timeErrorMsg).toBeTruthy();
  expect(timeErrorMsg).toContain('This field is required');
  console.log('Required validation completed');

  // TC003 - Enable clockIn, Add service clock out
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
  // Verify Clock In button is not visible and Clock Out button is visible
  await TimeClockPage.validateClockOutButtonVisibility(page);
  console.log('Validated Clock Out button visibility');
  await TimeClockPage.clickClockOut(page);
  console.log('Clicked Clock Out (final)');
}

export async function singleTimeActivityPriorityCasesOptimized(page: Page) {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  await validateSTARecentEntries(page);

  // Single navigation and setup
  await singleTimeActPage.navigateToSingleTime();
  await singleTimeActPage.openDropdown('Name');
  await singleTimeActPage.clickDropdownOption(1, 'Name');

  // Optimized settings with reduced waits and batch operations
  await settingsCasesPriorityOptimized(page);
  await checkForBillRateGettingPreFilledForBillableService(
    page,
    'Company Admin',
  );
  await checkForBillRateAndCostRateGettingPreFilledForEmployeePriority(page);
  await saveAndClose(page);
  await saveAndCloseStartAndEndTime(page, 'Company Admin');
  await updateSingleTAUsingParamOptimized(page);

  // STA Date Methods - Test yesterday's date and current date update scenarios
  console.log("Saving STA with yesterday's date test");
  await addSTAWithYesterdayDate(page, 'Company Admin');

  console.log('Saving STA with current date then update to yesterday test');
  await addSTAWithCurrentDateThenUpdateToYesterday(page, 'Company Admin');
}
