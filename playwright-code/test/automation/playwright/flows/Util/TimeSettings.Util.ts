import { Page, expect } from '@playwright/test';
import gotoWithAuthSession from '../../gotoWithAuthSession';
import TimeSettingsPage, {
  CleanupApprovalsFromClassicTimesheet,
  CleanupApprovalsFromClassicTimesheetUpdated,
  cleanupApprovalManagerDayOfWeekFromQBOSettings,
  cleanupApprovalManagerPayPeriodFromQBOSettings,
  cleanupApprovalManagerPayrollCloseDateFromQBOSettings,
  cleanupCustomMessageFromClassicTimesheet,
  cleanupCustomMessageFromQBOSettings,
  cleanupDailyRemindersFromQBOSettings,
  cleanupEmailManagerFromQBOSettings,
  cleanupPayPeriodRemindersFromQBOSettings,
  cleanupPayrollCloseDateRemindersFromQBOSettings,
  cleanupRemindersDayOfWeekFromQBOSettings,
  NavigateToApprovalsInClassicTimeSheet,
  navigateToNotificationSection,
  verifyApprovalsEnabled,
  verifyApprovalsSectionInSettings,
  verifyRequireApprovalValue,
  verifySubmissionSectionIsVisibleInQBO,
  verifySubmissionSectionNotVisibleInQBO,
  verifyTeamMemberNotificationCheckboxesDisabled,
  verifyTeamMemberNotificationCheckboxesEditable,
  verifyTeamMemberNotificationSectionDisabled,
  verifyTeamMembersReviewSubmitCheckbox,
  verifyTeamMembersReviewSubmitValue,
  cleanupDefaultCustomMessageFromQBOSettings,
  verifyFiveWeekdaysSelected,
  selectFiveWeekdays,
  selectFiveWeekdaysQBO,
  verifyFiveWeekdaysSelectedQBO,
  verifyLocationTrackingSetting,
} from '../../pages/TimeSettingsPage';
// ApprovalsAndSettingsPage functions are now part of TimeSettingsPage
import {
  TimeTrackingTestId,
  STALabels,
  TimeTrackingLabels,
} from '../../utilsTS';
import exp from 'constants';
import { string } from 'prop-types';
import SingleTimeActivityPage from '../../pages/SingleTimeActivityPage';
import { WeeklyTimeActivity } from '../../pages/WeeklyTimeActivity';

import { dismissCookieConsent } from '../../pages/MileagePage';

const validateNavigationToTimeSettingsTimeTracking = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.verifyReadOnltimeTrackSection(page);
};

const validateEditModeTimeTracking = async (page: Page) => {
  await TimeSettingsPage.clickTimeTrackingEditButton(page);

  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.firstDayOfWorkWeek,
    0,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 2);

  await TimeSettingsPage.clickOnDropdown(page, TimeTrackingTestId.Timezone, 0);
  await TimeSettingsPage.chooseDropDownOption(page, 10);

  //commenting out time format as field has been removed from UI
  /*await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.TimeFormat,
    0,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 1);*/

  await TimeSettingsPage.checkBoxTimeTrack(page, 0);
  await TimeSettingsPage.checkBoxTimeTrack(page, 1);
  await TimeSettingsPage.checkBoxTimeTrack(page, 2);

  await page.locator(`//*[@aria-label="directionClockIn"]`).first().click();

  await TimeSettingsPage.chooseDropDownOption(page, 1);
  await page.locator(`//*[@aria-label="directionClockIn"]`).nth(1).click();

  await TimeSettingsPage.chooseDropDownOption(page, 2);
  await page.locator(`//*[@aria-label="roundingClockIN"]`).first().click();

  await TimeSettingsPage.chooseDropDownOption(page, 2);
  await page.locator(`//*[@aria-label="roundingClockIN"]`).nth(1).click();

  await TimeSettingsPage.chooseDropDownOption(page, 3);

  await TimeSettingsPage.clickOnTimeTrackingCancelButton(page);
};

const validateFirstDayofWorkWeek = async (page: Page) => {
  // Settings
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeTrackingEditButton(page);
  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.firstDayOfWorkWeek,
    0,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 2);

  const firstDayValueFromSettings = await page
    .getByPlaceholder(TimeTrackingTestId.firstDayOfWorkWeek)
    .getAttribute('value');
  const firstDayValueFromSettings1 = firstDayValueFromSettings?.substring(0, 3);

  await TimeSettingsPage.clickOnTimeTrackingSaveButton(page);

  await TimeSettingsPage.directToWeeklyTime(page);
  const firstDayFromWTA3 = (
    await page
      .locator(`//th[contains(@class,'WeekdayHeader')]`)
      .nth(0)
      .innerText()
  ).substring(0, 3);
  expect(firstDayValueFromSettings1).toContain(firstDayFromWTA3);
};

const validateTimeFormat = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeTrackingEditButton(page);
  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.TimeFormat,
    0,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 1);
  await TimeSettingsPage.clickOnTimeTrackingSaveButton(page);

  // Create => Single Time Activity
  await TimeSettingsPage.directToSingleTimeAct(page);
  await TimeSettingsPage.validateTimeFormat(page, 'STA');

  //Time => Time Entries => Add time => Single time entry
  await TimeSettingsPage.navigateToTimeEntries(page);
  await TimeSettingsPage.clickOnAddTime(page);
  await TimeSettingsPage.validateTimeFormat(page, 'STE');

  //Time => Time Entries => Add time => Time clock
  await TimeSettingsPage.navigateToTimeEntries(page);
  await TimeSettingsPage.selectDisplayByDate(page);
  await TimeSettingsPage.openDateRangeDropdown(page);
  await TimeSettingsPage.selectDateRangeOption(page, 'This week');
  //await TimeSettingsPage.clickOnAddTime(page);
  //await TimeSettingsPage.chooseTimeEntryScreen(page, 'Time clock');
  await TimeSettingsPage.clickOnMainClockIn(page);
  await TimeSettingsPage.validateTimeFormat(page, 'TCL');
};

const validateTimeZone = async (page: Page) => {
  // Settings
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeTrackingEditButton(page);
  await TimeSettingsPage.clickOnDropdown(page, TimeTrackingTestId.Timezone, 1);
  await TimeSettingsPage.chooseDropDownOption(page, 6);
  const selectedTimeZone = await page
    .getByPlaceholder(TimeTrackingTestId.Timezone)
    .nth(1)
    .getAttribute('value');
  await TimeSettingsPage.clickOnTimeTrackingSaveButton(page);

  await TimeSettingsPage.navigateToTimeEntries(page);
  await TimeSettingsPage.waitForLoadingToDisappear(page);
  //await expect(TimeSettingsPage.displayByDropdown(page)).toBeVisible();
  await TimeSettingsPage.clickOnAddTime(page);
  await TimeSettingsPage.chooseTimeEntryScreen(page, 'Single time entry');
  await TimeSettingsPage.expectSingleTimeEntryVisible(page);
  const state = await TimeSettingsPage.verifySetClockToggleState(page);
  if (!state) {
    await TimeSettingsPage.ToggleSetClockInAndOut(page);
  }
  const staTimezone = await page
    .getByLabel(STALabels.Timezone)
    .getAttribute('value');
  expect(staTimezone).toBe(selectedTimeZone);
};

const verifyCheckedUncheckedSplitTimeSheetFromSTE = async (
  page: Page,
  action: string,
) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeTrackingEditButton(page);
  if (action == 'check') {
    await TimeSettingsPage.checkBoxTimeTrack(page, 0);
  }
  if (action == 'uncheck') {
    await TimeSettingsPage.uncheckBoxTimeTrack(page, 0);
  }
  await TimeSettingsPage.clickOnTimeTrackingSaveButton(page);
  await TimeSettingsPage.navigateToTimeEntries(page);
  await TimeSettingsPage.waitForLoadingToDisappear(page);

  await TimeSettingsPage.selectDisplayByOption(page, 'Date');
  //await TimeSettingsPage.waitForLoadingToDisappear(page);
  await TimeSettingsPage.openDateRangeDropdown(page);
  await TimeSettingsPage.selectDateRangeOption(page, 'Last week');
  await TimeSettingsPage.waitForLoadingToDisappear(page);

  await page.waitForTimeout(2000);
  const empRowsLastWeek = await page.locator(
    "//div[contains(text(), 'Emp, test')]/ancestor::tr",
  );

  let countLastWeek = await empRowsLastWeek.count();
  while (countLastWeek > 0) {
    await TimeSettingsPage.clickActionDropdownForEmployee(page, 'Emp, test');
    await TimeSettingsPage.clickDeleteInActionDropdown(page);
    await TimeSettingsPage.expectDeleteEntryConfirmationPopupOpen(page);
    await TimeSettingsPage.clickYesOnDeleteEntryPopup(page);
    await TimeSettingsPage.waitForLoadingToDisappear(page);
    countLastWeek = await TimeSettingsPage.countEmployeeRow(page, 'Emp, test');
    await TimeSettingsPage.navigateToTimeEntries(page);
    await page.waitForTimeout(2000);
    await TimeSettingsPage.waitForLoadingToDisappear(page);
    await page.waitForTimeout(2000);
    countLastWeek = await TimeSettingsPage.countEmployeeRow(page, 'Emp, test');
  }

  await TimeSettingsPage.selectDisplayByOption(page, 'Date');
  await TimeSettingsPage.waitForLoadingToDisappear(page);
  await TimeSettingsPage.openDateRangeDropdown(page);
  await TimeSettingsPage.selectDateRangeOption(page, 'This week');
  await TimeSettingsPage.waitForLoadingToDisappear(page);

  await page.waitForTimeout(2000);
  const empRows = await page.locator(
    "//div[contains(text(), 'Emp, test')]/ancestor::tr",
  );

  let count = await empRows.count();
  while (count > 0) {
    await TimeSettingsPage.clickActionDropdownForEmployee(page, 'Emp, test');
    await TimeSettingsPage.clickDeleteInActionDropdown(page);
    await TimeSettingsPage.expectDeleteEntryConfirmationPopupOpen(page);
    await TimeSettingsPage.clickYesOnDeleteEntryPopup(page);
    await TimeSettingsPage.waitForLoadingToDisappear(page);
    count = await TimeSettingsPage.countEmployeeRow(page, 'Emp, test');
    await TimeSettingsPage.navigateToTimeEntries(page);
    await page.waitForTimeout(2000);
    await TimeSettingsPage.waitForLoadingToDisappear(page);
    await page.waitForTimeout(2000);
    count = await TimeSettingsPage.countEmployeeRow(page, 'Emp, test');
  }

  //Add new entry using STE
  await TimeSettingsPage.clickOnAddTime(page);
  await TimeSettingsPage.chooseTimeEntryScreen(page, 'Single time entry');
  await expect(page.getByText('Single time entry')).toBeVisible();
  await TimeSettingsPage.expectSingleTimeEntryVisible(page);
  await TimeSettingsPage.waitForLoadingToDisappear(page);
  //await TimeSettingsPage.waitForNameFieldToPopulate(page);
  await TimeSettingsPage.openDropdown(page, 'Name');
  await TimeSettingsPage.selectOptionFromDropdown(page, 'Test Emp1');

  await TimeSettingsPage.enterNotes(
    page,
    `Add STE with start and end time ${Math.floor(Math.random() * 1000)}`,
  );

  await TimeSettingsPage.openDropdown(page, 'Customer');
  await page.waitForTimeout(500);
  await TimeSettingsPage.clickDropdownOption(page, 1, 'Customer');

  await TimeSettingsPage.openDropdown(page, 'Service');
  await page.waitForTimeout(500);
  await TimeSettingsPage.clickDropdownOption(page, 1, 'Service');

  if (
    await TimeSettingsPage.checkFieldVisibility(page, 'Billable (per hour)')
  ) {
    await TimeSettingsPage.checkCheckboxIfVisible(page, 'Billable (per hour)');
    await TimeSettingsPage.fillBillRateInput(page, '5.00');
  }
  await page.waitForTimeout(6000);
  const state = await TimeSettingsPage.verifySetClockToggleState(page);
  if (!state) {
    await TimeSettingsPage.ToggleSetClockInAndOut(page);
  }
  const previousDayStart = TimeSettingsPage.getPreviousDayDD(page, 2);

  await TimeSettingsPage.selectStartDate(page, previousDayStart);

  const previousDayEnd = TimeSettingsPage.getPreviousDayDD(page, 1);
  await TimeSettingsPage.selectEndDate(page, previousDayEnd);

  await TimeSettingsPage.selectStartEndTime(page, 'Start', '11:00 PM');
  await TimeSettingsPage.selectStartEndTime(page, 'End', '2:00 AM');
  await page.keyboard.press('Tab');

  await TimeSettingsPage.clickSaveAndCloseButton(page);
  await TimeSettingsPage.validateSuccessToast(page);
  await TimeSettingsPage.waitForLoadingToDisappear(page);

  //await TimeSettingsPage.validateDateWiseDataVisible(page);

  if (action == 'check') {
    await TimeSettingsPage.validateDateWiseDataVisible(page);
    await TimeSettingsPage.validateCreatedSingleTimeEntryForEmployee(
      page,
      'Emp, test',
      'check',
    );
  }
  if (action == 'uncheck') {
    await TimeSettingsPage.validateCreatedSingleTimeEntryForEmployee(
      page,
      'Emp, test',
      'uncheck',
    );
  }
};

const verifyCheckedSplitTimeSheetFromTimeClock = async (
  page: Page,
  action: string,
) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  //await TimeSettingsPage.hoverOnSplitTimeSheet(page);
  await TimeSettingsPage.clickTimeTrackingEditButton(page);
  if (action == 'check') {
    await TimeSettingsPage.checkBoxTimeTrack(page, 0);
  }
  if (action == 'uncheck') {
    await TimeSettingsPage.uncheckBoxTimeTrack(page, 0);
  }
  await TimeSettingsPage.clickOnTimeTrackingSaveButton(page);

  await TimeSettingsPage.navigateToTimeEntries(page);
  await TimeSettingsPage.waitForLoadingToDisappear(page);
  await TimeSettingsPage.selectDisplayByOption(page, 'Date');
  await TimeSettingsPage.waitForLoadingToDisappear(page);
  await TimeSettingsPage.openDateRangeDropdown(page);
  await TimeSettingsPage.validateDateRangeDropdownOptions(page);
  await TimeSettingsPage.selectDateRangeOption(page, 'This week');
  await TimeSettingsPage.waitForLoadingToDisappear(page);
  await page.waitForTimeout(2000);

  const empRows = await page.locator(
    "//div[contains(text(), 'PrimaryEmp1, TestAcct')]/ancestor::tr",
  );

  let count = await empRows.count();

  while (count > 0) {
    await TimeSettingsPage.clickActionDropdownForEmployee(
      page,
      'PrimaryEmp1, TestAcct',
    );
    await TimeSettingsPage.clickDeleteInActionDropdown(page);
    await TimeSettingsPage.expectDeleteEntryConfirmationPopupOpen(page);
    await TimeSettingsPage.clickYesOnDeleteEntryPopup(page);
    await TimeSettingsPage.waitForLoadingToDisappear(page);
    count = await TimeSettingsPage.countEmployeeRow(
      page,
      'PrimaryEmp1, TestAcct',
    );
    await TimeSettingsPage.navigateToTimeEntries(page);
    await page.waitForTimeout(2000);
    await TimeSettingsPage.waitForLoadingToDisappear(page);
    await page.waitForTimeout(2000);
    count = await TimeSettingsPage.countEmployeeRow(
      page,
      'PrimaryEmp1, TestAcct',
    );
  }

  await TimeSettingsPage.verifyIfRunningClock(page);
  await TimeSettingsPage.clickOnMainClockIn(page);

  await TimeSettingsPage.selectCustomerOption(page);
  const previousDay = TimeSettingsPage.getPreviousDayDD(page, 1);

  await TimeSettingsPage.selectStartDate(page, previousDay);
  await TimeSettingsPage.selectStartEndTime(page, 'Start', '11:00 PM');
  await TimeSettingsPage.clickOnClockInBtn(page);
  //await TimeSettingsPage.clickTimeClockSave(page);
  await TimeSettingsPage.clickClockOut(page);
  await TimeSettingsPage.openDateRangeDropdown(page);
  await TimeSettingsPage.selectDateRangeOption(page, 'Today');
  await TimeSettingsPage.openDateRangeDropdown(page);
  await TimeSettingsPage.selectDateRangeOption(page, 'This week');

  await TimeSettingsPage.validateDateWiseDataVisible(page);

  if (action == 'check') {
    await TimeSettingsPage.validateCreatedSingleTimeEntryForEmployee(
      page,
      'PrimaryEmp1, TestAcct',
      'check',
    );
  }
  if (action == 'uncheck') {
    await TimeSettingsPage.validateCreatedSingleTimeEntryForEmployee(
      page,
      'PrimaryEmp1, TestAcct',
      'uncheck',
    );
  }
};

const verifyCheckUncheckAllowTMToCreateFromSTA = async (
  page: Page,
  action: string,
) => {
  //Company Admin
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeTrackingEditButton(page);
  if (action == 'check') {
    await TimeSettingsPage.checkBoxTimeTrack(page, 1);
  }
  if (action == 'uncheck') {
    await TimeSettingsPage.uncheckBoxTimeTrack(page, 1);
  }
  await TimeSettingsPage.clickOnTimeTrackingSaveButton(page);
};

const verifyIfEmpCanCreateTSFromSTA = async (page: Page, action: string) => {
  await TimeSettingsPage.directToSingleTimeAct(page);
  await TimeSettingsPage.openSTADropdown(page, STALabels.Name);
  await TimeSettingsPage.chooseSpecificEmployee(page, 'Team Member1');
  await TimeSettingsPage.openSTADropdown(page, STALabels.Customers);
  await TimeSettingsPage.chooseSTADropdownOption(page);
  await TimeSettingsPage.openSTADropdown(page, STALabels.Class);
  await TimeSettingsPage.chooseSTADropdownOption(page);
  await TimeSettingsPage.openSTADropdown(page, STALabels.Location);
  await TimeSettingsPage.chooseSTADropdownOption(page);
  await TimeSettingsPage.openSTADropdown(page, STALabels.Service);
  await TimeSettingsPage.chooseSTADropdownOption(page);
  await TimeSettingsPage.checkBillableCheckboxIfVisible(
    page,
    STALabels.Billable,
  );
  await TimeSettingsPage.fillSTABillRate(page, '2');
  await TimeSettingsPage.fillNotes(page);
  await TimeSettingsPage.clickSTASave(page);
  if (action == 'access') {
    await TimeSettingsPage.STASaveToast(page);
  }
  if (action == 'noaccess') {
  }
};

const verifyTimeSheetRoundingClkIn = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeTrackingEditButton(page);
  await TimeSettingsPage.verifyTimeSheetRounding(page);

  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.clkInDirection,
    0,
  );
  await TimeSettingsPage.chooseRoundingOptions(page, 'Down');

  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.clkInRoundInc,
    0,
  );
  await TimeSettingsPage.chooseRoundingOptions(page, '3 min');

  await TimeSettingsPage.clickOnTimeTrackingSaveButton(page);

  //Time => Time Entries => Add time => Time clock
  await TimeSettingsPage.navigateToTimeEntries(page);
  await TimeSettingsPage.selectDisplayByDate(page);
  await TimeSettingsPage.openDateRangeDropdown(page);
  await TimeSettingsPage.selectDateRangeOption(page, 'Today');
  await page.waitForTimeout(2000);
  const empRows = await page.locator(
    "//div[contains(text(), 'AdminEmp, TestAcct')]/ancestor::tr",
  );

  let count = await empRows.count();

  while (count > 0) {
    await TimeSettingsPage.clickActionDropdownForEmployee(
      page,
      'AdminEmp, TestAcct',
    );
    await TimeSettingsPage.clickDeleteInActionDropdown(page);
    await TimeSettingsPage.expectDeleteEntryConfirmationPopupOpen(page);
    await TimeSettingsPage.clickYesOnDeleteEntryPopup(page);
    await TimeSettingsPage.waitForLoadingToDisappear(page);
    count = await TimeSettingsPage.countEmployeeRow(page, 'AdminEmp, TestAcct');
    await TimeSettingsPage.navigateToTimeEntries(page);
    await page.waitForTimeout(2000);
    await TimeSettingsPage.waitForLoadingToDisappear(page);
    await page.waitForTimeout(2000);
    count = await TimeSettingsPage.countEmployeeRow(page, 'AdminEmp, TestAcct');
  }

  await TimeSettingsPage.verifyIfRunningClock(page);
  //await TimeSettingsPage.clickOnAddTime(page);
  //await TimeSettingsPage.chooseTimeEntryScreen(page, 'Time clock' );
  await TimeSettingsPage.clickOnMainClockIn(page);
  const intialTimer = await TimeSettingsPage.getTimerDisplay(page);
  expect(intialTimer).toContain('00:00:00');
  await TimeSettingsPage.selectCustomerOption(page);
  await TimeSettingsPage.clearStartTime(page);
  await TimeSettingsPage.enterTime(page, '12:03 AM');

  await TimeSettingsPage.clickOnClockInBtn(page);
  const clockedInMsg = await TimeSettingsPage.getClockedInMessage(page);
  expect(clockedInMsg).toContain('clocked in at 12:00AM');
};

const verifyDualSyncPriorityCase = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeTrackingEditButton(page);
  await TimeSettingsPage.checkBoxTimeTrack(page, 0);
  await TimeSettingsPage.uncheckBoxTimeTrack(page, 0);
  await TimeSettingsPage.clickOnTimeTrackingSaveButton(page);

  const splitTimesheetState = await page
    .locator(
      `//label[text()='Split timesheets at midnight']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();

  await TimeSettingsPage.navigateToTimeEntries(page);
  await page.waitForLoadState('load');
  await TimeSettingsPage.verifyPriorityCaseFromClassicUI(
    page,
    splitTimesheetState as string,
  );
};

const verifyDualSyncSettingsQBOSaved = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeTrackingEditButton(page);

  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.firstDayOfWorkWeek,
    0,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 3);
  await TimeSettingsPage.clickOnDropdown(page, TimeTrackingTestId.Timezone, 0);
  await TimeSettingsPage.chooseDropDownOption(page, 2);
  await TimeSettingsPage.checkBoxTimeTrack(page, 0);
  await TimeSettingsPage.checkBoxTimeTrack(page, 1);
  await TimeSettingsPage.checkBoxTimeTrack(page, 2);

  await TimeSettingsPage.clickOnDropdownWithLabel(
    page,
    TimeTrackingTestId.clkInDirection,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 2);
  await TimeSettingsPage.clickOnDropdownWithLabel(
    page,
    TimeTrackingTestId.clkInRoundInc,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 1);
  await TimeSettingsPage.clickOnDropdownWithLabel(
    page,
    TimeTrackingTestId.clkOutDirection,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 1);
  await TimeSettingsPage.clickOnDropdownWithLabel(
    page,
    TimeTrackingTestId.clkOutRoundInc,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 2);
  await TimeSettingsPage.enterClkOutTimeHours(page, '5');
  await TimeSettingsPage.clickOnTimeTrackingSaveButton(page);

  await TimeSettingsPage.clickTimeTrackingEditButton(page);
  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.clkInDirection,
    0,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 1);
  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.clkInRoundInc,
    0,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 3);
  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.clkOutDirection,
    0,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 2);
  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.clkOutRoundInc,
    0,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 4);
  await TimeSettingsPage.clickOnTimeTrackingSaveButton(page);

  const firstDayOfWorkValue = await page
    .locator(
      `//label[text()='First day of work week']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const timezoneValue = await page
    .locator(
      `//label[text()='Time zone']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const splitTimesheetState = await page
    .locator(
      `//label[text()='Split timesheets at midnight']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const allowToEditTSState = await page
    .locator(
      `//label[text()='Allow team member to create and edit timesheets']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const allowToEditClkOutTimetState = await page
    .locator(
      `//label[text()='Allow team members to edit clock out time']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const ClkInvalues = await page
    .locator(
      `//label[text()='Round clock-in times']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const ClkOutvalues = await page
    .locator(
      `//label[text()='Round clock-out times']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();

  //const allowToEditClkOutHrsValue = await page.locator(TimeTrackingTestId.AllowToEditClkOutTimeHours).getAttribute('value');

  await TimeSettingsPage.navigateToTimeEntries(page);
  await TimeSettingsPage.verifyFromClassicUI(
    page,
    firstDayOfWorkValue as string,
    timezoneValue as string,
    splitTimesheetState as string,
    allowToEditTSState as string,
    allowToEditClkOutTimetState as string,
    ClkInvalues as string,
    ClkOutvalues as string,
  );
};

const verifyDualSyncSettingsClassicSaved = async (page: Page) => {
  await TimeSettingsPage.navigateToTimeEntries(page);
  await TimeSettingsPage.SaveFromClassicUI(page);
};

// Notifications
const validateNavigationToTimeSettingsNotif = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.scrollToBottom(page);
  await TimeSettingsPage.verifyReadOnlyNotifSection(page);
  await TimeSettingsPage.clickNotifEditButton(page);
};

const validateNotifEditMode = async (page: Page) => {
  await TimeSettingsPage.verifyNotifEditMode(page);
};

const validateDaysRemSent = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickNotifEditButton(page);
  await TimeSettingsPage.verifyDaysRemindersAreSent(page);
};

const validateSendClkInRem = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickNotifEditButton(page);
  await TimeSettingsPage.verifySendClkInRemAt(page);
};

const validateSendClkOutRem = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickNotifEditButton(page);
  await TimeSettingsPage.verifySendClkOutRemAt(page);
};

const validateNotifyWhenNotesAddedEdited = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickNotifEditButton(page);
  await TimeSettingsPage.verifyWhenNotesAddedOrEdited(page);
};

const validateClockInOut = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickNotifEditButton(page);
  await TimeSettingsPage.verifyClkInOutEdited(page);
};

const validateCheckboxes = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickNotifEditButton(page);

  await TimeSettingsPage.uncheckEmailMobileBox(page, 0);
  await TimeSettingsPage.checkEmailMobileBox(page, 0);

  await TimeSettingsPage.uncheckEmailMobileBox(page, 1);
  await TimeSettingsPage.checkEmailMobileBox(page, 1);

  await TimeSettingsPage.uncheckEmailMobileBox(page, 2);
  await TimeSettingsPage.checkEmailMobileBox(page, 2);

  await TimeSettingsPage.uncheckEmailMobileBox(page, 3);
  await TimeSettingsPage.checkEmailMobileBox(page, 3);

  await TimeSettingsPage.clickOnNotifSaveButton(page);
  await TimeSettingsPage.verifySavedCheckedCheckBoxes(page);

  await TimeSettingsPage.clickNotifEditButton(page);
  await TimeSettingsPage.uncheckEmailMobileBox(page, 0);
  await TimeSettingsPage.uncheckEmailMobileBox(page, 1);
  await TimeSettingsPage.uncheckEmailMobileBox(page, 2);
  await TimeSettingsPage.uncheckEmailMobileBox(page, 3);
  await TimeSettingsPage.verifyIfDaysRemSentDisabled(page);
  await TimeSettingsPage.clickOnNotifSaveButton(page);
  await TimeSettingsPage.verifySavedUncheckedCheckBoxes(page);
};

const verifyNotifDualSyncSettingsQBOSaved = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickNotifEditButton(page);
  await TimeSettingsPage.inputNotifSettings(page);

  const NotesSavedValue = await page
    .locator(
      `//label[text()='Notify when notes are added or edited']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const ClkInSavedValue = await page
    .locator(
      `//label[text()='Send clock-in reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const ClkOutSavedValue = await page
    .locator(
      `//label[text()='Send clock-out reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const DaysRemSentSavedValue = await page
    .locator(
      `//label[text()='Days reminders are sent']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const ClkInOutEditedSavedValue = await page
    .locator(
      `//label[text()='Notify when clock-in/-out time is adjusted']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();

  await TimeSettingsPage.navigateToTimeEntries(page);
  await TimeSettingsPage.verifyNotifFromClassicUI(
    page,
    ClkInSavedValue as string,
    ClkOutSavedValue as string,
    DaysRemSentSavedValue as string,
    NotesSavedValue as string,
    ClkInOutEditedSavedValue as string,
  );
};

const verifyNotifDualSyncPriorityCaseClassicSaved = async (page: Page) => {
  await page.waitForTimeout(2000);
  await TimeSettingsPage.navigateToTimeEntries(page);
  await page.waitForTimeout(1000);
  await TimeSettingsPage.SaveNotifyPriorityCaseFromClassicUI(page);
  await TimeSettingsPage.closeSpecificTabsOrPage(page, 'tsheets');
};

// New method with tab management for combined test execution
const verifyNotifDualSyncPriorityCaseClassicSavedWithTabManagement = async (
  page: Page,
) => {
  // Close any existing classic timesheet tabs before starting
  const context = page.context();
  const pages = context.pages();

  for (const existingPage of pages) {
    try {
      const url = existingPage.url();
      // Close any page that is NOT the new timesheet
      // Keep: qbo.intuit or e2e.qbo.intuit + app/time (new timesheet)
      // Close: tsheets domain (classic timesheet - both e2e and prod)
      const isNewTimesheet =
        (url.includes('qbo.intuit') || url.includes('e2e.qbo.intuit')) &&
        url.includes('app/time');
      const isClassicTimesheet = url.includes('tsheets');

      if ((!isNewTimesheet || isClassicTimesheet) && existingPage !== page) {
        await existingPage.close();
      }
    } catch (error) {}
  }

  await page.waitForTimeout(2000);

  // Ensure we're on the new timesheet page
  const currentUrl = page.url();
  if (!currentUrl.includes('qbo.intuit') || !currentUrl.includes('app/time')) {
    const baseUrl =
      currentUrl.split('/app/')[0] || 'https://e2e.qbo.intuit.com';
    await gotoWithAuthSession(page, `${baseUrl}/app/time`);
    await page.waitForLoadState();
  }

  await TimeSettingsPage.navigateToTimeEntries(page);
  await TimeSettingsPage.SaveNotifyPriorityCaseFromClassicUI(page);
};

const verifyNotifDualSyncSettingsClassicSaved = async (page: Page) => {
  await TimeSettingsPage.navigateToTimeEntries(page);
  await TimeSettingsPage.SaveNotifSettingsFromClassicUI(page);
};

const verifyDualSyncCustomizeTimesheetSettingsFromQBOSaved = async (
  page: Page,
) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
  await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);
  await TimeSettingsPage.checkedCustomizeTimesheetFieldsCheckbox(page);
  await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);
  await TimeSettingsPage.navigateToTimeEntries(page);
  const { classicPage, classicPageUrl } =
    await TimeSettingsPage.navigateToClassicTimeSheet(page);
  await TimeSettingsPage.selectOptionFromQuickBooksPayroll(
    classicPage,
    'Preferences',
  );
  await TimeSettingsPage.validateCustomizeTimesheetFieldsChangesOnClassicUI(
    classicPage,
  );

  await TimeSettingsPage.selectOptionFromQuickBooksPayroll(
    classicPage,
    'Preferences',
  );
  await TimeSettingsPage.preferencesUncheckedTimesheetFieldsCheckbox(
    classicPage,
  );
  await TimeSettingsPage.closeQuickBooksOnline(classicPage);
  await TimeSettingsPage.uncheckNotesCheckboxFromCompanySettings(classicPage);
  await TimeSettingsPage.saveCompanySettings(classicPage);
  await TimeSettingsPage.closeCompanySettings(classicPage);

  await TimeSettingsPage.switchBackToQBO(page);
  await page.waitForTimeout(1000);
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
  await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);
  // Retry validation with re-navigate when sync is delayed (e.g. TS024 in pipeline)
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.waitForTimeout(3000);
      await TimeSettingsPage.validateCustomizeTimesheetFieldsChangesFromClassicTimesheetToQBO(
        page,
      );
      break;
    } catch (e) {
      if (attempt === maxAttempts) throw e;
      await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
      await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
      await page.waitForTimeout(5000);
    }
  }

  await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);
};

// New method with tab management for combined test execution
const verifyDualSyncCustomizeTimesheetSettingsFromClassicTimesheetSavedWithTabManagement =
  async (page: Page) => {
    // Close any existing classic timesheet tabs before starting
    const context = page.context();
    const pages = context.pages();

    for (const existingPage of pages) {
      try {
        const url = existingPage.url();
        // Close any page that is NOT the new timesheet
        // Keep: qbo.intuit or e2e.qbo.intuit + app/time (new timesheet)
        // Close: tsheets domain (classic timesheet - both e2e and prod)
        const isNewTimesheet =
          (url.includes('qbo.intuit') || url.includes('e2e.qbo.intuit')) &&
          url.includes('app/time');
        const isClassicTimesheet = url.includes('tsheets');

        if ((!isNewTimesheet || isClassicTimesheet) && existingPage !== page) {
          await existingPage.close();
        }
      } catch (error) {}
    }

    await page.waitForTimeout(2000);

    // Ensure we're on the new timesheet page
    const currentUrl = page.url();
    if (
      !currentUrl.includes('qbo.intuit') ||
      !currentUrl.includes('app/time')
    ) {
      const baseUrl =
        currentUrl.split('/app/')[0] || 'https://e2e.qbo.intuit.com';
      await gotoWithAuthSession(page, `${baseUrl}/app/time`);
      await page.waitForLoadState();
    }

    await TimeSettingsPage.navigateToTimeEntries(page);
    const { classicPage, classicPageUrl } =
      await TimeSettingsPage.navigateToClassicTimeSheet(page);
    await TimeSettingsPage.selectOptionFromQuickBooksPayroll(
      classicPage,
      'Preferences',
    );
    await TimeSettingsPage.preferencesUncheckedTimesheetFieldsCheckbox(
      classicPage,
    );
    await TimeSettingsPage.closeQuickBooksOnline(classicPage);
    await TimeSettingsPage.uncheckNotesCheckboxFromCompanySettings(classicPage);
    await TimeSettingsPage.saveCompanySettings(classicPage);
    await TimeSettingsPage.closeCompanySettings(classicPage);
    await classicPage.close();
    await TimeSettingsPage.switchBackToQBO(page);
    await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
    await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
    await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);
    await TimeSettingsPage.validateCustomizeTimesheetFieldsChangesFromClassicTimesheetToQBO(
      page,
    );
    await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);
  };

// New method with tab management for combined test execution
const verifyDualSyncCustomizeTimesheetSettingsFromQBOSavedWithTabManagement =
  async (page: Page) => {
    // Close any existing classic timesheet tabs before starting
    const context = page.context();
    const pages = context.pages();

    for (const existingPage of pages) {
      try {
        const url = existingPage.url();
        // Close any page that is NOT the new timesheet
        // Keep: qbo.intuit or e2e.qbo.intuit + app/time (new timesheet)
        // Close: tsheets domain (classic timesheet - both e2e and prod)
        const isNewTimesheet =
          (url.includes('qbo.intuit') || url.includes('e2e.qbo.intuit')) &&
          url.includes('app/time');
        const isClassicTimesheet = url.includes('tsheets');

        if ((!isNewTimesheet || isClassicTimesheet) && existingPage !== page) {
          await existingPage.close();
        }
      } catch (error) {}
    }

    await page.waitForTimeout(2000);

    // Ensure we're on the new timesheet page
    const currentUrl = page.url();
    if (
      !currentUrl.includes('qbo.intuit') ||
      !currentUrl.includes('app/time')
    ) {
      const baseUrl =
        currentUrl.split('/app/')[0] || 'https://e2e.qbo.intuit.com';
      await gotoWithAuthSession(page, `${baseUrl}/app/time`);
      await page.waitForLoadState();
    }

    await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
    await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
    await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);
    await TimeSettingsPage.checkedCustomizeTimesheetFieldsCheckbox(page);
    await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);
    await TimeSettingsPage.navigateToTimeEntries(page);
    const { classicPage, classicPageUrl } =
      await TimeSettingsPage.navigateToClassicTimeSheet(page);
    await TimeSettingsPage.selectOptionFromQuickBooksPayroll(
      classicPage,
      'Preferences',
    );
    await TimeSettingsPage.validateCustomizeTimesheetFieldsChangesOnClassicUI(
      classicPage,
    );

    await TimeSettingsPage.selectOptionFromQuickBooksPayroll(
      classicPage,
      'Preferences',
    );
    await TimeSettingsPage.preferencesUncheckedTimesheetFieldsCheckbox(
      classicPage,
    );
    await TimeSettingsPage.closeQuickBooksOnline(classicPage);
    await TimeSettingsPage.uncheckNotesCheckboxFromCompanySettings(classicPage);
    await TimeSettingsPage.saveCompanySettings(classicPage);
    await TimeSettingsPage.closeCompanySettings(classicPage);

    await TimeSettingsPage.switchBackToQBO(page);
    await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
    await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
    await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);
    await TimeSettingsPage.validateCustomizeTimesheetFieldsChangesFromClassicTimesheetToQBO(
      page,
    );

    await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);
  };

const verifyDualSyncCustomizeTimesheetSettingsFromClassicTimesheetSaved =
  async (page: Page) => {
    await TimeSettingsPage.navigateToTimeEntries(page);
    const { classicPage, classicPageUrl } =
      await TimeSettingsPage.navigateToClassicTimeSheet(page);
    await TimeSettingsPage.selectOptionFromQuickBooksPayroll(
      classicPage,
      'Preferences',
    );
    await TimeSettingsPage.preferencesUncheckedTimesheetFieldsCheckbox(
      classicPage,
    );
    await TimeSettingsPage.closeQuickBooksOnline(classicPage);
    await TimeSettingsPage.uncheckNotesCheckboxFromCompanySettings(classicPage);
    await TimeSettingsPage.saveCompanySettings(classicPage);
    await TimeSettingsPage.closeCompanySettings(classicPage);
    await classicPage.close();
    await TimeSettingsPage.switchBackToQBO(page);
    await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
    await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
    await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);
    await TimeSettingsPage.validateCustomizeTimesheetFieldsChangesFromClassicTimesheetToQBO(
      page,
    );
    await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);
  };

const verifyCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet = async (
  page: Page,
  field: string,
) => {
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  const weeklyTimeActivityPage = new WeeklyTimeActivity(page);

  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
  await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);

  await TimeSettingsPage.uncheckedCustomizeTimesheetFieldsCheckbox(page);
  await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
  await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);
  await TimeSettingsPage.checkCustomField(page, field);

  await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);

  await TimeSettingsPage.validateTimeSheetFieldsVisible(page);

  await TimeSettingsPage.navigateToSTA(page);
  await singleTimeActivityPage.validateSTALoaded();
  await singleTimeActivityPage.checkFieldVisibility(field);
  await singleTimeActivityPage.closeTooltip();

  await weeklyTimeActivityPage.navigateToWeeklyTime();
  await singleTimeActivityPage.closeTooltip();
  await weeklyTimeActivityPage.isVisibile(field, 1);

  await TimeSettingsPage.navigateToTimeEntries(page);

  // Navigate to classic timesheet
  const { classicPage: classicPage1, classicPageUrl: classicPageUrl1 } =
    await TimeSettingsPage.navigateToClassicTimeSheet(page);

  if (field !== 'Notes') {
    // Go to QuickBooks Payroll > Preferences
    await TimeSettingsPage.selectOptionFromQuickBooksPayroll(
      classicPage1,
      'Preferences',
    );

    const isChecked = await TimeSettingsPage.validateCheckboxIsChecked(
      classicPage1,
      field,
    );
    await expect(isChecked).toBeTruthy();

    if (field === 'Class') {
      await TimeSettingsPage.validateOnlyClassFieldValuesCheckboxIsChecked(
        classicPage1,
        field,
      );
    }

    if (field === 'Location') {
      await TimeSettingsPage.validateOnlyLocationFieldValuesCheckboxIsChecked(
        classicPage1,
        field,
      );
    }

    if (field === 'Service item') {
      await TimeSettingsPage.validateOnlyServiceItemFieldValuesCheckboxIsChecked(
        classicPage1,
        field,
      );
    }

    await TimeSettingsPage.clickClosePreferencesButton(classicPage1);
    await classicPage1.waitForTimeout(2000);
  }
  if (field === 'Notes') {
    await TimeSettingsPage.verifyNotesCheckboxIsCheckedFromCompanySettings(
      classicPage1,
    );
    await TimeSettingsPage.saveCompanySettings(classicPage1);
    await TimeSettingsPage.closeCompanySettings(classicPage1);
  }

  await TimeSettingsPage.switchBackToQBO(page);

  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);

  await TimeSettingsPage.uncheckCustomField(page, field);

  await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);

  await TimeSettingsPage.validateTimeSheetFieldsVisible(page);
  await page.waitForTimeout(12000);

  // Validate on STA page
  await TimeSettingsPage.navigateToSTA(page);
  await singleTimeActivityPage.validateSTALoaded();
  await singleTimeActivityPage.closeTooltip();
  await singleTimeActivityPage.validateFieldNotVisible(field);

  // Validate on WTA page
  await weeklyTimeActivityPage.navigateToWeeklyTime();
  await weeklyTimeActivityPage.closeTooltip();
  await weeklyTimeActivityPage.validateFieldNotVisible(field);

  await TimeSettingsPage.switchBackToClassicTimeSheet(
    classicPage1,
    classicPageUrl1,
  );

  if (field !== 'Notes') {
    // Go to QuickBooks Payroll > Preferences
    await TimeSettingsPage.selectOptionFromQuickBooksPayroll(
      classicPage1,
      'Preferences',
    );

    const isUnchecked = await TimeSettingsPage.validateCheckboxIsUnchecked(
      classicPage1,
      field,
    );
    await expect(isUnchecked).toBeTruthy();

    if (field === 'Location') {
      await TimeSettingsPage.validateAllFieldValuesCheckboxAreUnchecked(
        classicPage1,
        ['Location'],
      );
    }

    if (field === 'Service item') {
      await TimeSettingsPage.validateAllFieldValuesCheckboxAreUnchecked(
        classicPage1,
        ['Service item'],
      );
    }
  }
  if (field === 'Notes') {
    await TimeSettingsPage.verifyNotesCheckboxIsUncheckedFromCompanySettings(
      classicPage1,
    );
    await TimeSettingsPage.saveCompanySettings(classicPage1);
    await TimeSettingsPage.closeCompanySettings(classicPage1);
  }
};

const verifyBillableCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet = async (
  page: Page,
  field: string,
) => {
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  const weeklyTimeActivityPage = new WeeklyTimeActivity(page);

  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
  await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);

  await TimeSettingsPage.uncheckedCustomizeTimesheetFieldsCheckbox(page);
  await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
  await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);
  await TimeSettingsPage.checkCustomField(page, field);

  await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);

  await TimeSettingsPage.validateTimeSheetFieldsVisible(page);

  await TimeSettingsPage.navigateToSTA(page);
  await singleTimeActivityPage.validateSTALoaded();
  await singleTimeActivityPage.checkFieldVisibility(field);
  await singleTimeActivityPage.closeTooltip();

  await weeklyTimeActivityPage.navigateToWeeklyTime();
  await singleTimeActivityPage.closeTooltip();
  await weeklyTimeActivityPage.isVisibile(field, 1);

  await TimeSettingsPage.navigateToTimeEntries(page);

  // Navigate to classic timesheet
  const { classicPage: classicPage1, classicPageUrl: classicPageUrl1 } =
    await TimeSettingsPage.navigateToClassicTimeSheet(page);

  // Go to QuickBooks Payroll > Preferences
  await TimeSettingsPage.selectOptionFromQuickBooksPayroll(
    classicPage1,
    'Preferences',
  );

  const isChecked = await TimeSettingsPage.validateCheckboxIsChecked(
    classicPage1,
    field,
  );
  await expect(isChecked).toBeTruthy();

  await TimeSettingsPage.validateOnlyBillableFieldValuesCheckboxIsChecked(
    classicPage1,
    field,
  );

  await TimeSettingsPage.clickClosePreferencesButton(classicPage1);
  await classicPage1.waitForTimeout(2000);

  await TimeSettingsPage.switchBackToQBO(page);

  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);

  // await TimeSettingsPage.uncheckCustomField(page, field);
  await TimeSettingsPage.uncheckedCustomizeTimesheetFieldsCheckbox(page);

  await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);

  await TimeSettingsPage.validateTimeSheetFieldsVisible(page);

  // Validate on STA page
  await TimeSettingsPage.navigateToSTA(page);
  await singleTimeActivityPage.validateSTALoaded();
  await singleTimeActivityPage.closeTooltip();
  await singleTimeActivityPage.validateFieldNotVisible(field);

  // Validate on WTA page
  await weeklyTimeActivityPage.navigateToWeeklyTime();
  await weeklyTimeActivityPage.closeTooltip();
  await weeklyTimeActivityPage.validateFieldNotVisible(field);

  await TimeSettingsPage.switchBackToClassicTimeSheet(
    classicPage1,
    classicPageUrl1,
  );

  // Go to QuickBooks Payroll > Preferences
  await TimeSettingsPage.selectOptionFromQuickBooksPayroll(
    classicPage1,
    'Preferences',
  );

  const isUnchecked = await TimeSettingsPage.validateCheckboxIsUnchecked(
    classicPage1,
    field,
  );
  await expect(isUnchecked).toBeTruthy();

  await TimeSettingsPage.validateAllFieldValuesCheckboxAreUnchecked(
    classicPage1,
    ['Billable'],
  );
};

const verifyNotesCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet = async (
  page: Page,
  field: string,
) => {
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  const weeklyTimeActivityPage = new WeeklyTimeActivity(page);

  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
  await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);

  await TimeSettingsPage.uncheckedCustomizeTimesheetFieldsCheckbox(page);
  await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
  await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);
  await TimeSettingsPage.checkCustomField(page, field);

  await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);

  await TimeSettingsPage.validateTimeSheetFieldsVisible(page);

  await TimeSettingsPage.navigateToSTA(page);
  await singleTimeActivityPage.validateSTALoaded();
  await singleTimeActivityPage.checkFieldVisibility(field);
  await singleTimeActivityPage.closeTooltip();

  await weeklyTimeActivityPage.navigateToWeeklyTime();
  await singleTimeActivityPage.closeTooltip();
  await weeklyTimeActivityPage.isVisibile(field, 1);

  await TimeSettingsPage.navigateToTimeEntries(page);

  // Navigate to classic timesheet
  const { classicPage: classicPage1, classicPageUrl: classicPageUrl1 } =
    await TimeSettingsPage.navigateToClassicTimeSheet(page);

  await TimeSettingsPage.verifyNotesCheckboxIsCheckedFromCompanySettings(
    classicPage1,
  );
  await TimeSettingsPage.saveCompanySettings(classicPage1);
  await TimeSettingsPage.closeCompanySettings(classicPage1);

  await TimeSettingsPage.switchBackToQBO(page);

  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);

  //await TimeSettingsPage.uncheckCustomField(page, field);
  await TimeSettingsPage.uncheckedCustomizeTimesheetFieldsCheckbox(page);

  await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);

  await TimeSettingsPage.validateTimeSheetFieldsVisible(page);

  // Validate on STA page
  await TimeSettingsPage.navigateToSTA(page);
  await singleTimeActivityPage.validateSTALoaded();
  await singleTimeActivityPage.closeTooltip();
  await singleTimeActivityPage.validateFieldNotVisible(field);

  // Validate on WTA page
  await weeklyTimeActivityPage.navigateToWeeklyTime();
  await weeklyTimeActivityPage.closeTooltip();
  await weeklyTimeActivityPage.validateFieldNotVisible(field);

  await TimeSettingsPage.switchBackToClassicTimeSheet(
    classicPage1,
    classicPageUrl1,
  );

  await TimeSettingsPage.verifyNotesCheckboxIsUncheckedFromCompanySettings(
    classicPage1,
  );

  await TimeSettingsPage.saveCompanySettings(classicPage1);
  await TimeSettingsPage.closeCompanySettings(classicPage1);
};

const verifyCustomizedTimeSheetFieldFromClassicTimeSheetToQBO = async (
  page: Page,
  field: string,
) => {
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  const weeklyTimeActivityPage = new WeeklyTimeActivity(page);

  await TimeSettingsPage.navigateToTimeEntries(page);

  // Navigate to classic timesheet
  const { classicPage, classicPageUrl } =
    await TimeSettingsPage.navigateToClassicTimeSheet(page);

  // Go to QuickBooks Payroll > Preferences
  await TimeSettingsPage.selectOptionFromQuickBooksPayroll(
    classicPage,
    'Preferences',
  );

  // Enable custom field
  await TimeSettingsPage.checkCustomField(classicPage, field);

  await classicPage.waitForSelector(`//*[@role="progressbar"]`, {
    state: 'hidden',
    timeout: 0,
  });
  await TimeSettingsPage.clickClosePreferencesButton(classicPage);
  await classicPage.waitForTimeout(2000);

  // Close classic timesheet and switch back
  await TimeSettingsPage.switchBackToQBO(page);

  // Verify Class field is visible on STA
  await TimeSettingsPage.navigateToSTA(page);

  await singleTimeActivityPage.validateSTALoaded();

  await singleTimeActivityPage.closeTooltip();
  const visibility = await singleTimeActivityPage.checkFieldVisibility(field);

  await expect(visibility).toBeTruthy();

  // Verify Class field is visible on WTA
  await weeklyTimeActivityPage.navigateToWeeklyTime();
  await weeklyTimeActivityPage.closeTooltip();
  await weeklyTimeActivityPage.isVisibile(field, 1);

  // Switch to classic timesheet
  await TimeSettingsPage.switchBackToClassicTimeSheet(
    classicPage,
    classicPageUrl,
  );

  await TimeSettingsPage.selectOptionFromQuickBooksPayroll(
    classicPage,
    'Preferences',
  );

  // Verify Class field is still enabled
  const isChecked = await TimeSettingsPage.validateCheckboxIsChecked(
    classicPage,
    field,
  );
  await expect(isChecked).toBeTruthy();

  // Disable custom field
  await TimeSettingsPage.uncheckCustomField(classicPage, field);

  await classicPage.waitForSelector(`//*[@role="progressbar"]`, {
    state: 'hidden',
    timeout: 0,
  });
  await TimeSettingsPage.clickClosePreferencesButton(classicPage);

  await classicPage.waitForTimeout(2000);

  // Close classic timesheet and switch back
  // await classicPage.close();
  await TimeSettingsPage.switchBackToQBO(page);
  // Verify Class field is not visible on STA
  await TimeSettingsPage.navigateToSTA(page);

  await singleTimeActivityPage.validateSTALoaded();
  await singleTimeActivityPage.validateFieldNotVisible(field);

  // Verify Class field is not visible on WTA
  await weeklyTimeActivityPage.navigateToWeeklyTime();
  await expect(weeklyTimeActivityPage.getByLabel('Name')).toBeVisible();
  await weeklyTimeActivityPage.validateFieldNotVisible(field);

  // Switch to classic timesheet
  await TimeSettingsPage.switchBackToClassicTimeSheet(
    classicPage,
    classicPageUrl,
  );

  // Verify Class field is still disabled
  const isStillUnchecked = await TimeSettingsPage.validateCheckboxIsUnchecked(
    classicPage,
    field,
  );
  await expect(isStillUnchecked).toBeTruthy();

  // Close final classic timesheet
  await classicPage.close();
  await TimeSettingsPage.switchBackToQBO(page);
};

// Approvals and Settings Utility Functions

const navigateToApprovalsInClassicTimeSheet = async (page: Page) => {
  await TimeSettingsPage.navigateToTimeEntries(page);
  const classicPage = await NavigateToApprovalsInClassicTimeSheet(page);
  return classicPage;
};

const validateApprovalsInQBOSettingsSubmissionOn = async (page: Page) => {
  // Validate "Require approval for tracked time"  when approval is turned on
  await expect(
    page.locator(`//label[text()='Require approval for tracked time']`),
  ).toBeVisible();
  await expect(
    page
      .locator(`//div[@data-testid='approvals-settings']//span[text()='On']`)
      .nth(0),
  ).toBeVisible();

  await expect(
    page.locator(
      `//label[text()='Team members can review and submit their time']`,
    ),
  ).toBeVisible();
  await expect(
    page
      .locator(`//div[@data-testid='approvals-settings']//span[text()='On']`)
      .nth(1),
  ).toBeVisible();
};

const selectTeamMembersReviewSubmitCheckbox = async (page: Page) => {
  await page
    .locator(`//input[@id='addon_approvals_employee_approval']`)
    .click();
  await page.reload();
  await page.waitForTimeout(2000);
  await expect(
    page.locator(`//input[@id='addon_approvals_employee_approval']`),
  ).toBeChecked();
  await expect(
    page.locator(`//input[@id='addon_approvals_employee_approval_full_week']`),
  ).toBeChecked();
};

const validateApprovalDefaultValuesInQBOSettings = async (page: Page) => {
  // Validate "Require approval for tracked time" default value
  await verifyRequireApprovalValue(page);

  // Validate "Team members can review and submit their time" default value
  await verifyTeamMembersReviewSubmitValue(page);
};

const selectTeamMembersReviewSubmitCheckboxInQBOSettings = async (
  page: Page,
) => {
  await page
    .locator(
      `//div[@data-testid='approvals-settings']//button[@aria-label='Edit']`,
    )
    .click();
  await page.waitForTimeout(2000); // Wait for edit mode to load

  // select the "Team members can review and submit their time" checkbox
  const approvalsActiveCheckbox = page.getByRole('checkbox', {
    name: 'Team members can review and submit their time',
  });
  await approvalsActiveCheckbox.click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.reload();
  await page.waitForTimeout(2000);
};

export const verifyNotificationTeamMemberSectionDisabled = async (
  page: Page,
) => {
  await navigateToNotificationSection(page);

  // Verify team member section radio buttons are disabled
  await verifyTeamMemberNotificationSectionDisabled(page);

  // Verify team member section checkboxes are disabled
  await verifyTeamMemberNotificationCheckboxesDisabled(page);
};

const navigateToApprovalsInQBOSettings = async (
  qboPage: Page,
  useUpdatedPanel = false,
) => {
  await qboPage.bringToFront();
  await TimeSettingsPage.navigateToAccountAndSettingsTime(
    qboPage,
    useUpdatedPanel,
  );
  await verifyApprovalsSectionInSettings(qboPage);
};

const verifyApprovalDefaultValuesInClassicTimesheet = async (page: Page) => {
  await page.waitForTimeout(2000);
  await verifyApprovalsEnabled(page);
  await verifyTeamMembersReviewSubmitCheckbox(page);
};

const verifyDefaultApprovalPreferencesInTSheetsAndQBOSettings = async (
  page: Page,
) => {
  console.log('Starting cleanup...');
  await CleanupApprovalsFromClassicTimesheet(page); // Cleanup any existing approvals

  //Navigate to Classic Timesheet and verify Approvals section
  const classicPage = await navigateToApprovalsInClassicTimeSheet(page);
  await verifyApprovalDefaultValuesInClassicTimesheet(classicPage);

  // Navigate to Time settings and verify Approvals section
  await navigateToApprovalsInQBOSettings(page);
  await validateApprovalDefaultValuesInQBOSettings(page);
};

const verifyApprovalsSectionWhenSubmissionIsTurnedOff = async (page: Page) => {
  console.log('Starting cleanup...');
  await CleanupApprovalsFromClassicTimesheet(page); // Cleanup any existing approvals

  //Navigate to Classic Timesheet and verify Submissions under Notifications section is not visible
  const classicPage = await navigateToApprovalsInClassicTimeSheet(page);
  await verifyApprovalDefaultValuesInClassicTimesheet(classicPage);
  await verifyNotificationTeamMemberSectionDisabled(classicPage);

  //Navigate to Time Account & Settings and verify submission section is not visible in notifications section
  await navigateToApprovalsInQBOSettings(page);
  await validateApprovalDefaultValuesInQBOSettings(page);
  await verifySubmissionSectionNotVisibleInQBO(page);
};

const verifyApprovalsSectionWhenSubmissionIsTurnedOnFromTSheets = async (
  page: Page,
) => {
  console.log('Starting cleanup...');
  await CleanupApprovalsFromClassicTimesheet(page); // Cleanup any existing approvals

  await TimeSettingsPage.navigateToTimeEntries(page);
  //Navigate to Classic Timesheet and verify Submissions under Notifications section is not visible
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);
  await selectTeamMembersReviewSubmitCheckbox(classicPage);
  await verifyTeamMemberNotificationCheckboxesEditable(classicPage);

  //Navigate to Time Account & Settings and verify submission section is not visible in notifications section
  await navigateToApprovalsInQBOSettings(page);
  await validateApprovalsInQBOSettingsSubmissionOn(page);
  await verifySubmissionSectionIsVisibleInQBO(page);
};

const verifyApprovalsSectionWhenSubmissionIsTurnedOnFromQBOSettings = async (
  page: Page,
  useTSheetsDirectNav = false,
) => {
  console.log('Starting cleanup...');
  // SUT01 (Submit Time) uses the Updated cleanup/navigation helpers; the shared
  // callers (e.g. APS004) keep the original methods.
  if (useTSheetsDirectNav) {
    await CleanupApprovalsFromClassicTimesheetUpdated(page); // Cleanup any existing approvals
  } else {
    await CleanupApprovalsFromClassicTimesheet(page); // Cleanup any existing approvals
  }

  //Navigate to Time Account & Settings and verify submission section is not visible in notifications section
  await navigateToApprovalsInQBOSettings(page, useTSheetsDirectNav);
  await selectTeamMembersReviewSubmitCheckboxInQBOSettings(page);
  await validateApprovalsInQBOSettingsSubmissionOn(page);

  //Navigate to TSheets Approvals Preferences (SUT01 opens TSheets directly in a
  //new tab; other callers use the classic "Go to QuickBooks Time" link).
  const classicPage = useTSheetsDirectNav
    ? await navigateToApprovalsInTimeSheet(page)
    : await navigateToApprovalsInClassicTimeSheet(page);

  // Validate the "Team members can review and submit their time" checkbox under
  // TEAM MEMBER OPTIONS is selected in TSheets Approvals Preferences. Only SUT01
  // (Submit Time) validates this — via the TSheets direct-nav path; the shared
  // caller (APS004) keeps its original behavior.
  if (useTSheetsDirectNav) {
    await verifyTeamMembersReviewSubmitCheckboxSelected(classicPage);
  }
  await verifyTeamMemberNotificationCheckboxesEditable(classicPage);
};

const validateSubmissionsRemindersDayOfWeekFromClassicTimesheet = async (
  page: Page,
) => {
  console.log('Starting cleanup...');
  await cleanupRemindersDayOfWeekFromQBOSettings(page); // Cleanup any existing approvals

  await TimeSettingsPage.navigateToTimeEntries(page);
  // Step 1: Go to Classic Timesheet -> Feature Add-ons -> Approval Preferences
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);

  // Step 2: Verify Approvals is enabled section
  await TimeSettingsPage.verifyTeamMemberOptions(classicPage);

  // Step 3: Check the team member option under Team members can review and submit their time checkbox
  await TimeSettingsPage.checkTeamMembersCanReviewAndSubmitTime(classicPage);

  // Step 4: Go to the Notification section
  await TimeSettingsPage.navigateToNotificationSection(classicPage);

  // Step 5: Team member section should be enabled for radio section
  await TimeSettingsPage.verifyTeamMemberOptionsEnabled(classicPage);

  // Step 6: Select the value for day of week
  await TimeSettingsPage.selectDayOfWeekOption(classicPage);

  // Step 7: Check the when they have not submitted their time for the current week and prior week checkboxes
  await TimeSettingsPage.checkCurrentWeekSubmissionReminder(classicPage);
  await TimeSettingsPage.checkPriorWeekSubmissionReminder(classicPage);

  // Step 8: Choose the time at 2pm and day as Monday in current week section
  await TimeSettingsPage.setCurrentWeekReminderTime(
    classicPage,
    '2:00pm',
    'Monday',
  );

  // Step 9: Choose the time at 2pm and day as Friday in prior week section
  await TimeSettingsPage.setPriorWeekReminderTime(
    classicPage,
    '3:00pm',
    'Friday',
  );

  // Step 10: Save settings and refresh the page
  await classicPage.reload();
  await TimeSettingsPage.navigateToNotificationSection(classicPage);
  await TimeSettingsPage.verifyDayOfWeekOptionSelected(classicPage);

  // Step 11: Verify the Remind when they have not approved their team's timesheets for current week value as 2:00 PM and Monday
  await TimeSettingsPage.verifyClassicCurrentWeekReminderValue(
    classicPage,
    '2:00pm',
    'Monday',
  );

  // Step 12: Verify the Remind when they have not approved their team's timesheets for prior week value as 3:00 PM and Friday
  await TimeSettingsPage.verifyClassicPriorWeekReminderValue(
    classicPage,
    '3:00pm',
    'Friday',
  );

  // Step 13: Navigate QBO Time to time in Account & Settings
  await page.bringToFront();
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  // Step 14: Verify Team members can review and submit their time value as on
  await TimeSettingsPage.verifyTeamMembersCanReviewAndSubmitTimeValue(
    page,
    'On',
  );

  // Step 15: Check for Submission section
  await TimeSettingsPage.verifySubmissionSectionVisible(page);

  // Step 16: Verify the Send reminder to team to submit time value as On day of week
  await TimeSettingsPage.verifySendReminderToTeamValue(page, 'On day of week');

  // Step 17: Verify the Remind when they have not approved their team's timesheets for current week value as Monday, 2:00 PM, Email
  await TimeSettingsPage.verifyCurrentWeekReminderValue(
    page,
    'Monday, 2:00 PM, Email',
  );

  // Step 18: Verify the Remind when they have not approved their team's timesheets for prior week value as Friday, 2:00 PM, Email
  await TimeSettingsPage.verifyPriorWeekReminderValue(
    page,
    'Friday, 3:00 PM, Email',
  );

  await classicPage.close();
};

const validateSubmissionsRemindersDayOfWeekFromQBOTime = async (page: Page) => {
  console.log('Starting cleanup...');
  await cleanupRemindersDayOfWeekFromQBOSettings(page); // Cleanup any existing approvals

  // Step 1: Navigate QBO Time to time in Account & Settings
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  // Step 2: Check for Approvals section
  await TimeSettingsPage.verifyApprovalsSectionVisible(page);

  // Step 3: Verify Team members can review and submit their time value as off
  await TimeSettingsPage.verifyTeamMembersCanReviewAndSubmitTimeValue(
    page,
    'Off',
  );

  // Step 4: Click on edit approvals section
  await TimeSettingsPage.clickEditApprovalsSection(page);

  // Step 5: Check the Team members can review and submit their time checkbox
  await TimeSettingsPage.checkTeamMembersCanReviewAndSubmitTimeCheckbox(page);

  // Step 6: Click on save button
  await TimeSettingsPage.saveApprovalSettings(page);

  // Step 7: Verify the Team members can review and submit their time value as on
  await TimeSettingsPage.verifyTeamMembersCanReviewAndSubmitTimeValue(
    page,
    'On',
  );

  // Step 8: Check for Submission section
  await TimeSettingsPage.verifySubmissionSectionVisible(page);

  // Step 9: Click on edit notification section
  await TimeSettingsPage.clickEditNotificationSection(page);

  // Step 10: Select the value for day of week
  await TimeSettingsPage.selectDayOfWeekOptionQBO(page);

  // Step 11: Check the when they have not submitted their time for the current week and prior week checkboxes
  await TimeSettingsPage.checkCurrentWeekSubmissionReminderQBO(page);
  await TimeSettingsPage.checkPriorWeekSubmissionReminderQBO(page);

  // Step 12: Choose the reminder time at 2pm and reminder day as Monday in current week section
  await TimeSettingsPage.setCurrentWeekReminderTimeQBO(
    page,
    '2:00 PM',
    'Monday',
  );

  // Step 13: Choose the reminder time at 2pm and reminder day as Friday in prior week section
  await TimeSettingsPage.setPriorWeekReminderTimeQBO(page, '3:00 PM', 'Friday');

  // Step 14: Click on save button
  await TimeSettingsPage.saveNotificationSettings(page);

  // Step 15: Verify the Send reminder to team to submit time value as On day of week
  await TimeSettingsPage.verifySendReminderToTeamValue(page, 'On day of week');

  // Step 16: Verify the Remind when they have not approved their team's timesheets for current week value as Friday, 12:00 PM, Email
  await TimeSettingsPage.verifyCurrentWeekReminderValue(
    page,
    'Monday, 2:00 PM, Email',
  );

  // Step 17: Verify the Remind when they have not approved their team's timesheets for prior week value as Monday, 12:00 PM, Email
  await TimeSettingsPage.verifyPriorWeekReminderValue(
    page,
    'Friday, 3:00 PM, Email',
  );

  await TimeSettingsPage.navigateToTimeEntries(page);

  // Step 18: Go to Classic Timesheet -> Feature Add-ons -> Approval Preferences
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);

  // Step 19: Verify team member section checked
  await TimeSettingsPage.verifyTeamMemberSectionChecked(classicPage);

  // Step 20: Go to the Notification section
  await TimeSettingsPage.navigateToNotificationSection(classicPage);

  // Step 21: Verify the Based on value as day of week
  await TimeSettingsPage.verifyBasedOnDayOfWeekChecked(classicPage);

  // Step 22: Verify the Remind when they have not approved their team's timesheets for current week value as 2:00 PM and Friday
  await TimeSettingsPage.verifyClassicCurrentWeekReminderValue(
    classicPage,
    '2:00pm',
    'Monday',
  );

  // Step 23: Verify the Remind when they have not approved their team's timesheets for prior week value as 2:00 PM and Monday
  await TimeSettingsPage.verifyClassicPriorWeekReminderValue(
    classicPage,
    '3:00pm',
    'Friday',
  );

  await classicPage.close();
};

const validateSubmissionsRemindersPayrollCloseDateFromClassicTimesheet = async (
  page: Page,
) => {
  console.log('Starting cleanup...');
  await cleanupPayrollCloseDateRemindersFromQBOSettings(page); // Cleanup any existing approvals

  await TimeSettingsPage.navigateToTimeEntries(page);
  // Step 1: Go to Classic Timesheet -> Feature Add-ons -> Approval Preferences
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);

  // Step 2: Verify Approvals is enabled section
  await TimeSettingsPage.verifyTeamMemberOptions(classicPage);

  // Step 3: Check the team member option under Team members can review and submit their time checkbox
  await TimeSettingsPage.checkTeamMembersCanReviewAndSubmitTime(classicPage);

  // Step 4: Go to the Notification section
  await TimeSettingsPage.navigateToNotificationSection(classicPage);

  // Step 5: Team member section should be enabled for radio and checkbox section
  await TimeSettingsPage.verifyTeamMemberOptionsEnabled(classicPage);

  // Step 6: Select the value for payroll close date
  await TimeSettingsPage.selectPayrollCloseDateOption(classicPage);

  // Step 7: Check the payroll close date and When they have not submitted their time by checkboxes
  await TimeSettingsPage.checkPayrollCloseDateReminder(classicPage);
  await TimeSettingsPage.checkNotSubmittedByPayrollCloseDate(classicPage);

  // Step 8: Choose the time at 5pm and day as 2 day after in the payroll close date section
  await TimeSettingsPage.setPayrollCloseDateReminderTime(
    classicPage,
    '5:00pm',
    '2 day after',
  );

  // Step 9: Choose the time at 5pm and day as 2 day after in When they have not submitted their time by the payroll close date section
  await TimeSettingsPage.setNotSubmittedByPayrollCloseDateReminderTime(
    classicPage,
    '8:00pm',
    '4 day after',
  );

  // Step 10: Save settings and refresh the page
  await classicPage.reload();
  await TimeSettingsPage.navigateToNotificationSection(classicPage);

  // Step 11: Verify the Remind during set time from the payroll close date value as 5:00 PM and 2 day after
  await TimeSettingsPage.verifyClassicPayrollCloseDateReminderValue(
    classicPage,
    '5:00pm',
    '2 day after',
  );

  // Step 12: Verify the Remind when they have not submitted their time by the payroll close date value as 8:00 PM and 4 days after
  await TimeSettingsPage.verifyClassicNotSubmittedByPayrollCloseDateReminderValue(
    classicPage,
    '8:00pm',
    '4 day after',
  );

  // Step 13: Navigate QBO Time to time in Account & Settings
  await page.bringToFront();
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  // Step 14: Check for Submission section
  await TimeSettingsPage.verifySubmissionSectionVisible(page);
  await page.reload();
  // Step 15: Verify Team members can review and submit their time value as on
  await TimeSettingsPage.verifyTeamMembersCanReviewAndSubmitTimeValue(
    page,
    'On',
  );

  // Step 16: Verify the Send reminder to team to submit time value as Based on pay period
  await TimeSettingsPage.verifySendReminderToTeamValue(
    page,
    'Based on pay period',
  );

  // Step 17: Verify the Remind during set time from the payroll close date value as 2 days after payroll close, 5:00 PM, Email
  await TimeSettingsPage.verifySubmissionPayrollCloseDateReminderValue(
    page,
    '2 days after payroll close, 5:00 PM, Email',
  );

  // Step 18: Verify the Remind when they have not submitted their time by the payroll close date value as 2 days after payroll close, 5:00 PM, Email
  await TimeSettingsPage.verifyNotSubmittedByPayrollCloseDateValue(
    page,
    '4 days after payroll close, 8:00 PM, Email',
  );

  await classicPage.close();
};

const validateSubmissionsRemindersPayPeriodFromQBOTime = async (page: Page) => {
  console.log('Starting cleanup...');
  await cleanupPayPeriodRemindersFromQBOSettings(page); // Cleanup any existing approvals

  // Step 1: Navigate QBO Time to time in Account & Settings
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  // Step 2: Check for Approvals section
  await TimeSettingsPage.verifyApprovalsSectionVisible(page);

  // Step 3: Verify Team members can review and submit their time value as off
  // await TimeSettingsPage.verifyTeamMembersCanReviewAndSubmitTimeValue(page, 'Off');

  // Step 4: Click on edit approvals section
  await TimeSettingsPage.clickEditApprovalsSection(page);

  // Step 5: Check the Team members can review and submit their time checkbox
  await TimeSettingsPage.checkTeamMembersCanReviewAndSubmitTimeCheckbox(page);

  // Step 6: Click on save button
  await TimeSettingsPage.saveApprovalSettings(page);

  // Step 7: Verify the Team members can review and submit their time value as on
  await TimeSettingsPage.verifyTeamMembersCanReviewAndSubmitTimeValue(
    page,
    'On',
  );

  // Step 8: Click on edit notification section
  await TimeSettingsPage.clickEditNotificationSection(page);

  // Step 9: Select the value for Based on pay period
  await TimeSettingsPage.selectBasedOnPayPeriodOption(page);

  // Step 10: Check the Remind during set time from the payroll close date and Remind when they have not submitted their time by the payroll close date checkboxes
  await TimeSettingsPage.checkPayrollCloseDateReminderQBO(page);
  await TimeSettingsPage.checkNotSubmittedByPayrollCloseDateQBO(page);

  // Step 11: Choose the reminder time at 5pm and reminder day as 2 days after payroll close in Remind during set time from the payroll close date section
  await TimeSettingsPage.setPayrollCloseDateReminderTimeQBO(
    page,
    '5:00 PM',
    '2 days after payroll close',
  );

  // Step 12: Choose the reminder time at 5pm and reminder day as 2 days after payroll close in Remind when they have not submitted their time by the payroll close date section
  await TimeSettingsPage.setNotSubmittedByPayrollCloseDateReminderTimeQBO(
    page,
    '8:00 PM',
    '4 days after payroll close',
  );

  // Step 13: Click on save button
  await TimeSettingsPage.saveNotificationSettings(page);

  // Step 14: Verify the Send reminder to team to submit time value as Based on pay period
  await TimeSettingsPage.verifySendReminderToTeamValue(
    page,
    'Based on pay period',
  );

  // Step 15: Verify the Remind during set time from the payroll close date value as 2 days after payroll close, 5:00 PM, Email
  await TimeSettingsPage.verifyPayrollCloseDateReminderValue(
    page,
    '2 days after payroll close, 5:00 PM, Email',
  );

  // Step 16: Verify the Remind when they have not submitted their time by the payroll close date value as 2 days after payroll close, 5:00 PM, Email
  await TimeSettingsPage.verifyNotSubmittedByPayrollCloseDateValue(
    page,
    '4 days after payroll close, 8:00 PM, Email',
  );

  await TimeSettingsPage.navigateToTimeEntries(page);
  // Step 17: Go to Classic Timesheet -> Feature Add-ons -> Approval Preferences
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);

  // Step 18: Verify team member section checked
  await TimeSettingsPage.verifyTeamMemberSectionChecked(classicPage);

  // Step 19: Go to the Notification section
  await TimeSettingsPage.navigateToNotificationSection(classicPage);

  // Step 20: Verify the Based on value as Based on pay period
  await TimeSettingsPage.verifyBasedOnPayrollCloseDateChecked(classicPage);

  // Step 21: Verify the payroll close date value as 5:00 PM and 2 day after
  await TimeSettingsPage.verifyClassicPayrollCloseDateReminderValue(
    classicPage,
    '5:00pm',
    '2 day after',
  );

  // Step 22: Verify the When they have not submitted their time by value as 5:00 PM and 2 day after
  await TimeSettingsPage.verifyClassicNotSubmittedByPayrollCloseDateReminderValue(
    classicPage,
    '8:00pm',
    '4 day after',
  );

  await classicPage.close();
};

const validateSubmissionsRemindersDailyFromClassicTimesheet = async (
  page: Page,
) => {
  console.log('Starting cleanup...');
  await cleanupDailyRemindersFromQBOSettings(page); // Cleanup any existing approvals

  await TimeSettingsPage.navigateToTimeEntries(page);
  // Step 1: Go to Classic Timesheet -> Feature Add-ons -> Approval Preferences
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);

  // Step 2: Verify Approvals is enabled section
  await TimeSettingsPage.verifyTeamMemberOptions(classicPage);

  // Step 3: Check the team member option under Team members can review and submit their time checkbox
  await TimeSettingsPage.checkTeamMembersCanReviewAndSubmitTime(classicPage);

  // Step 4: Go to the Notification section
  await TimeSettingsPage.navigateToNotificationSection(classicPage);

  // Step 5: Team member section should be enabled for radio and checkbox section
  await TimeSettingsPage.verifyTeamMemberOptionsEnabled(classicPage);

  // Step 6: Select the value for daily
  await TimeSettingsPage.selectDailyOption(classicPage);

  // Step 7: Check the when they have not submitted their time for the selected days and when they still have not submitted their time for the selected days checkboxes
  await TimeSettingsPage.checkNotSubmittedForSelectedDays(classicPage);
  await TimeSettingsPage.checkStillNotSubmittedForSelectedDays(classicPage);

  // Step 8: Choose the time at 3pm in when they have not submitted their time for the selected days section
  await TimeSettingsPage.setNotSubmittedForSelectedDaysTime(
    classicPage,
    '3:00pm',
  );

  // Step 9: Choose the time at 5pm in when they still have not submitted their time for the selected days section
  await TimeSettingsPage.setStillNotSubmittedForSelectedDaysTime(
    classicPage,
    '5:00pm',
  );

  // Step 10: Choose day Tue, Wed, Thu
  await selectFiveWeekdays(classicPage);

  // Step 11: Save settings and refresh the page
  await classicPage.reload();
  await TimeSettingsPage.navigateToNotificationSection(classicPage);

  // Step 12: Verify the payroll close date value as 5:00 PM and 2 day after
  await TimeSettingsPage.verifyClassicDailyReminderValue(classicPage, '3:00pm');

  // Step 13: Verify the When they have not submitted their time by value as 5:00 PM and 2 day after
  await TimeSettingsPage.verifyClassicNotSubmittedByDailyReminderValue(
    classicPage,
    '5:00pm',
  );

  // Verify 5 weekdays are selected
  //await verifyFiveWeekdaysSelected(page);

  // Step 14: Navigate QBO Time to time in Account & Settings
  await page.bringToFront();
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  // Step 15: Check for Submission section
  await TimeSettingsPage.verifySubmissionSectionVisible(page);

  // Step 16: Verify Team members can review and submit their time value as on
  await TimeSettingsPage.verifyTeamMembersCanReviewAndSubmitTimeValue(
    page,
    'On',
  );

  // Step 17: Verify the Send reminder to team to submit time value as daily
  await TimeSettingsPage.verifySendReminderToTeamValue(page, 'Daily');

  // Step 18: Verify the Days reminders are sent value as Tuesday, Wednesday, Thursday
  //await TimeSettingsPage.verifyDaysRemindersAreSentValue(page, 'Thursday, Friday, Monday, Tuesday, Wednesday');

  // Step 19: Verify the Remind when they have not submitted their time for the selected days value as 3:00 PM, Email
  await TimeSettingsPage.verifyNotSubmittedForSelectedDaysValue(
    page,
    '3:00 PM, Email',
  );

  // Step 20: Verify the Remind when they have still not submitted their time for the selected days value as 5:00 PM, Email
  await TimeSettingsPage.verifyStillNotSubmittedForSelectedDaysValue(
    page,
    '5:00 PM, Email',
  );

  await classicPage.close();
};

const validateSubmissionsRemindersDailyFromQBOTime = async (page: Page) => {
  console.log('Starting cleanup...');
  await cleanupDailyRemindersFromQBOSettings(page); // Cleanup any existing approvals

  // Step 1: Navigate QBO Time to time in Account & Settings
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  // Step 2: Check for Approvals section
  await TimeSettingsPage.verifyApprovalsSectionVisible(page);

  // Step 3: Verify Team members can review and submit their time value as off
  // await TimeSettingsPage.verifyTeamMembersCanReviewAndSubmitTimeValue(page, 'Off');

  // Step 4: Click on edit approvals section
  await TimeSettingsPage.clickEditApprovalsSection(page);

  // Step 5: Check the Team members can review and submit their time checkbox
  await TimeSettingsPage.checkTeamMembersCanReviewAndSubmitTimeCheckbox(page);

  // Step 6: Click on save button
  await TimeSettingsPage.saveApprovalSettings(page);

  await page.reload();

  // Step 7: Verify the Team members can review and submit their time value as on
  await TimeSettingsPage.verifyTeamMembersCanReviewAndSubmitTimeValue(
    page,
    'On',
  );

  // Step 8: Click on edit notification section
  await TimeSettingsPage.clickEditNotificationSection(page);

  // Step 9: Select the value for Daily
  await TimeSettingsPage.selectDailyOptionQBO(page);

  // Step 10: Check the Remind when they have not submitted their time for the selected days and Remind when they have still not submitted their time for the selected days checkboxes
  await TimeSettingsPage.checkNotSubmittedForSelectedDaysQBO(page);
  await TimeSettingsPage.checkStillNotSubmittedForSelectedDaysQBO(page);

  // Step 11: Choose the reminder time at 3pm in Remind during set time from the payroll close date section
  await TimeSettingsPage.setNotSubmittedForSelectedDaysTimeQBO(page, '3:00 PM');

  // Step 12: Choose the reminder time at 5pm in Remind when they have still not submitted their time for the selected days section
  await TimeSettingsPage.setStillNotSubmittedForSelectedDaysTimeQBO(
    page,
    '5:00 PM',
  );

  // Step 13: Choose the Days of week Tuesday, Wednesday, Thursday
  await selectFiveWeekdaysQBO(page);

  // Step 14: Click on save button
  await TimeSettingsPage.saveNotificationSettings(page);

  // Step 15: Verify the Send reminder to team to submit time value as Daily
  await TimeSettingsPage.verifySendReminderToTeamValue(page, 'Daily');

  // Step 16: Verify the Days reminders are sent value as Tuesday, Wednesday, Thursday
  await verifyFiveWeekdaysSelectedQBO(
    page,
    'Thursday, Friday, Monday, Tuesday, Wednesday',
  );

  // Step 17: Verify the Remind when they have not submitted their time for the selected days value as 3:00 PM, Email
  await TimeSettingsPage.verifyNotSubmittedForSelectedDaysValue(
    page,
    '3:00 PM, Email',
  );

  // Step 18: Verify the Remind when they have still not submitted their time for the selected days value as 5:00 PM, Email
  await TimeSettingsPage.verifyStillNotSubmittedForSelectedDaysValue(
    page,
    '5:00 PM, Email',
  );

  await TimeSettingsPage.navigateToTimeEntries(page);

  // Step 19: Go to Classic Timesheet -> Feature Add-ons -> Approval Preferences
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);

  // Step 20: Verify team member section checked
  await TimeSettingsPage.verifyTeamMemberSectionChecked(classicPage);

  // Step 21: Go to the Notification section
  await TimeSettingsPage.navigateToNotificationSection(classicPage);

  // Step 22: Verify the Based on value as Daily
  await TimeSettingsPage.verifyBasedOnDailyChecked(classicPage);

  // Step 23: Verify the payroll close date value as 5:00 PM and 2 day after
  await TimeSettingsPage.verifyClassicDailyReminderValue(classicPage, '3:00pm');

  // Step 24: Verify the When they have not submitted their time by value as 5:00 PM and 2 day after
  await TimeSettingsPage.verifyClassicNotSubmittedByDailyReminderValue(
    classicPage,
    '5:00pm',
  );

  await classicPage.close();
};

const validateApprovalManagerRemindersDayOfWeekFromClassicTimesheet = async (
  page: Page,
) => {
  console.log('Starting cleanup...');
  await cleanupApprovalManagerDayOfWeekFromQBOSettings(page); // Cleanup any existing approvals

  await TimeSettingsPage.navigateToTimeEntries(page);
  // Step 1: Go to Classic Timesheet -> Feature Add-ons -> Approval Preferences
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);

  // Step 2: Go to the Notification section
  await TimeSettingsPage.navigateToNotificationSection(classicPage);

  // Step 3: Approval Manager section should be enabled for radio and checkbox section
  //await TimeSettingsPage.verifyApprovalManagerSectionEnabled(classicPage);

  // Step 4: Select the value for day of week
  await TimeSettingsPage.selectDayOfWeekOptionApprovalMgr(classicPage);

  // Step 5: Check the when they have not approved their team's timesheets for the current week and prior week checkboxes
  await TimeSettingsPage.checkCurrentWeekApprovalReminder(classicPage);
  await TimeSettingsPage.checkPriorWeekApprovalReminder(classicPage);

  // Step 6: Choose the time at 2pm and day as Monday in when they have not approved their team's timesheets for the current week section
  await TimeSettingsPage.setCurrentWeekApprovalReminderTime(
    classicPage,
    '2:00 PM',
    'Monday',
  );

  // Step 7: Choose the time at 3pm and day as Friday in when they have not approved their team's timesheets for the prior week section
  await TimeSettingsPage.setPriorWeekApprovalReminderTime(
    classicPage,
    '3:00 PM',
    'Friday',
  );

  // Step 8: Save settings and refresh the page
  await classicPage.reload();
  await TimeSettingsPage.navigateToNotificationSection(classicPage);

  await TimeSettingsPage.verifyBasedOnDayOfWeekMangerChecked(classicPage);

  // Step 22: Verify the Remind when they have not approved their team's timesheets for current week value as 2:00 PM and Friday
  await TimeSettingsPage.verifyClassicCurrentWeekApprovalReminderManagerValue(
    classicPage,
    '2:00pm',
    'Monday',
  );

  // Step 23: Verify the Remind when they have not approved their team's timesheets for prior week value as 2:00 PM and Monday
  await TimeSettingsPage.verifyClassicPriorWeekApprovalReminderManagerValue(
    classicPage,
    '3:00pm',
    'Friday',
  );

  // Step 9: Navigate QBO Time to time in Account & Settings
  await page.bringToFront();
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  // Step 10: Check for Approval under notification section
  // await TimeSettingsPage.verifyApprovalNotificationSectionVisible(page);

  // Step 11: Verify the Remind managers to approve time value as On day of week
  await TimeSettingsPage.verifyRemindManagersToApproveTimeValue(
    page,
    'On day of week',
  );

  // Step 12: Verify the Remind when managers have not approved their team's timesheets for the current week value as Monday, 2:00 PM, Email
  await TimeSettingsPage.verifyCurrentWeekManagerApprovalReminderValue(
    page,
    'Monday, 2:00 PM, Email',
  );

  // Step 13: Verify the Remind when managers have not approved their team's timesheets for the prior week value as Friday, 2:00 PM, Email
  await TimeSettingsPage.verifyPriorWeekManagerApprovalReminderValue(
    page,
    'Friday, 3:00 PM, Email',
  );
};

// APS012 - Validate submissions reminders to approval manager based on day of week from QBO time
const validateApprovalManagerRemindersDayOfWeekFromQBOTime = async (
  page: Page,
) => {
  console.log('Starting cleanup...');
  await cleanupApprovalManagerDayOfWeekFromQBOSettings(page);

  // Navigate to QBO Time Account & Settings
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  // Click on edit notification section
  await TimeSettingsPage.clickEditNotificationSection(page);

  // Select day of week option for approval manager
  await TimeSettingsPage.selectManagerDayOfWeekOptionQBO(page);

  // Check current week and prior week approval reminders
  await TimeSettingsPage.checkCurrentWeekSubmissionReminderManagerQBO(page);
  await TimeSettingsPage.checkPriorWeekSubmissionReminderManagerQBO(page);

  // Set reminder times
  await TimeSettingsPage.setCurrentWeekReminderTimeManagerQBO(
    page,
    '2:00 PM',
    'Monday',
  );
  await TimeSettingsPage.setPriorWeekReminderTimeManagerQBO(
    page,
    '4:00 PM',
    'Friday',
  );

  // Save notification settings
  await TimeSettingsPage.saveNotificationSettings(page);

  // Verify QBO Time values
  await TimeSettingsPage.verifyRemindManagersToApproveTimeValue(
    page,
    'On day of week',
  );
  await TimeSettingsPage.verifyCurrentWeekManagerApprovalReminderValue(
    page,
    'Monday, 2:00 PM, Email',
  );
  await TimeSettingsPage.verifyPriorWeekManagerApprovalReminderValue(
    page,
    'Friday, 4:00 PM, Email',
  );

  await TimeSettingsPage.navigateToTimeEntries(page);
  // Navigate to Classic Timesheet Approval Preferences
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);
  await TimeSettingsPage.navigateToNotificationSection(classicPage);

  // Verify Classic Timesheet values
  await TimeSettingsPage.verifyBasedOnDayOfWeekMangerChecked(classicPage);
  await TimeSettingsPage.verifyClassicCurrentWeekApprovalReminderManagerValue(
    classicPage,
    '2:00pm',
    'Monday',
  );
  await TimeSettingsPage.verifyClassicPriorWeekApprovalReminderManagerValue(
    classicPage,
    '4:00pm',
    'Friday',
  );
};

// APS013 - Validate submissions reminders to approval manager based on payroll close date from classic time sheet
const validateApprovalManagerRemindersPayrollCloseDateFromClassicTimesheet =
  async (page: Page) => {
    console.log('Starting cleanup...');
    await cleanupApprovalManagerPayPeriodFromQBOSettings(page);

    await TimeSettingsPage.navigateToTimeEntries(page);
    // Navigate to Classic Timesheet Approval Preferences
    const { classicPage } =
      await TimeSettingsPage.navigateToClassicApprovalPreferences(page);
    await TimeSettingsPage.navigateToNotificationSection(classicPage);

    // Verify approval manager section is enabled
    // await TimeSettingsPage.verifyApprovalManagerSectionEnabled(classicPage);

    // Select payroll close date option
    await TimeSettingsPage.selectPayrollCloseDateManagerOption(classicPage);

    // Check payroll close date and not approved by payroll close date reminders
    await TimeSettingsPage.checkPayrollCloseDateReminderManager(classicPage);
    await TimeSettingsPage.checkNotSubmittedByPayrollCloseDateManager(
      classicPage,
    );

    // Set reminder times
    await TimeSettingsPage.setManagerPayrollCloseDateReminderTime(
      classicPage,
      '5:00pm',
      '2 day after',
    );
    await TimeSettingsPage.setManagerNotSubmittedByPayrollCloseDateReminderTime(
      classicPage,
      '7:00pm',
      '4 day after',
    );

    // Refresh page and validate
    await page.reload();
    await TimeSettingsPage.navigateToNotificationSection(classicPage);
    // Verify Classic Timesheet values
    await TimeSettingsPage.verifyBasedOnPayrollCloseDateManagerChecked(
      classicPage,
    );
    await TimeSettingsPage.verifyClassicPayrollCloseDateReminderManagerValue(
      classicPage,
      '5:00pm',
      '2 day after',
    );
    await TimeSettingsPage.verifyClassicNotSubmittedByPayrollCloseDateReminderManagerValue(
      classicPage,
      '7:00pm',
      '4 day after',
    );

    await page.bringToFront();

    // Navigate to QBO Time
    await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
    //await TimeSettingsPage.verifyApprovalNotificationSectionVisible(page);
    await page.reload();

    // Verify QBO Time values
    await TimeSettingsPage.verifyRemindManagersToApproveTimeValue(
      page,
      'Based on pay period',
    );
    await TimeSettingsPage.verifyPayrollCloseDateReminderValue(
      page,
      '2 days after payroll close, 5:00 PM, Email',
    );
    await TimeSettingsPage.verifyNotSubmittedByPayrollCloseDateManagerValue(
      page,
      '4 days after payroll close, 7:00 PM, Email',
    );
  };

// APS014 - Validate submissions reminders to approval manager based on pay period from QBO time
const validateApprovalManagerRemindersPayPeriodFromQBOTime = async (
  page: Page,
) => {
  console.log('Starting cleanup...');
  await cleanupApprovalManagerPayPeriodFromQBOSettings(page);

  // Navigate to QBO Time Account & Settings
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  // Check for Approvals section
  await TimeSettingsPage.verifyApprovalsSectionVisible(page);

  // Click on edit notification section
  await TimeSettingsPage.clickEditNotificationSection(page);

  // Select based on pay period option for approval manager
  await TimeSettingsPage.selectManagerBasedOnPayPeriodOption(page);

  // Check payroll close date reminders
  await TimeSettingsPage.checkPayrollCloseDateReminderQBO(page);
  await TimeSettingsPage.checkNotSubmittedByPayrollCloseDateManagerQBO(page);

  // Set reminder times
  await TimeSettingsPage.setPayrollCloseDateReminderTimeManagerQBO(
    page,
    '5:00 PM',
    '2 days after payroll close',
  );
  await TimeSettingsPage.setNotSubmittedByPayrollCloseDateReminderTimeManagerQBO(
    page,
    '7:00 PM',
    '4 days after payroll close',
  );

  // Save notification settings
  await TimeSettingsPage.saveNotificationSettings(page);

  // Verify QBO Time values
  await TimeSettingsPage.verifyRemindManagersToApproveTimeValue(
    page,
    'Based on pay period',
  );
  await TimeSettingsPage.verifyPayrollCloseDateReminderValue(
    page,
    '2 days after payroll close, 5:00 PM, Email',
  );
  await TimeSettingsPage.verifyNotSubmittedByPayrollCloseDateManagerValue(
    page,
    '4 days after payroll close, 7:00 PM, Email',
  );

  await TimeSettingsPage.navigateToTimeEntries(page);
  // Navigate to Classic Timesheet Approval Preferences
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);
  await TimeSettingsPage.navigateToNotificationSection(classicPage);

  // Verify Classic Timesheet values
  await TimeSettingsPage.verifyBasedOnPayrollCloseDateManagerChecked(
    classicPage,
  );
  await TimeSettingsPage.verifyClassicPayrollCloseDateReminderManagerValue(
    classicPage,
    '5:00pm',
    '2 day after',
  );
  await TimeSettingsPage.verifyClassicNotSubmittedByPayrollCloseDateReminderManagerValue(
    classicPage,
    '7:00pm',
    '4 day after',
  );
};

// APS015 - Validate submissions reminders to email manager from classic time sheet
const validateEmailManagerFromClassicTimesheet = async (page: Page) => {
  console.log('Starting cleanup...');
  await cleanupEmailManagerFromQBOSettings(page); // Cleanup any existing approvals

  await TimeSettingsPage.navigateToTimeEntries(page);
  // Navigate to Classic Timesheet Approval Preferences
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);

  // Step 2: Verify Approvals is enabled section
  await TimeSettingsPage.verifyTeamMemberOptions(classicPage);

  // Step 3: Check the team member option under Team members can review and submit their time checkbox
  await TimeSettingsPage.checkTeamMembersCanReviewAndSubmitTime(classicPage);

  await TimeSettingsPage.navigateToNotificationSection(classicPage);

  await dismissCookieConsent(classicPage);

  // Check email manager options
  await TimeSettingsPage.checkEmailManagerWhenEachTeamMemberSubmits(
    classicPage,
  );
  await TimeSettingsPage.checkEmailManagerWhenEntireTeamSubmits(classicPage);

  // Refresh page and validate
  await classicPage.reload();
  await TimeSettingsPage.navigateToNotificationSection(classicPage);
  // Verify Classic Timesheet values
  await TimeSettingsPage.verifyEmailManagerWhenEachTeamMemberSubmitsChecked(
    classicPage,
  );
  await TimeSettingsPage.verifyEmailManagerWhenEntireTeamSubmitsChecked(
    classicPage,
  );

  await page.bringToFront();

  // Navigate to QBO Time
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await page.reload();
  await page.waitForTimeout(5000);

  // Verify QBO Time values
  await TimeSettingsPage.verifyEmailManagerWhenEachTeamMemberSubmitsValue(
    page,
    'On',
  );
  await TimeSettingsPage.verifyEmailManagerWhenEntireTeamSubmitsValue(
    page,
    'On',
  );
};

// APS016 - Validate submissions reminders to email manager from QBO time
const validateEmailManagerFromQBOTime = async (page: Page) => {
  console.log('Starting cleanup...');
  await cleanupEmailManagerFromQBOSettings(page); // Cleanup any existing approvals

  // Navigate to QBO Time Account & Settings
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  // Check for Approvals section
  await TimeSettingsPage.verifyApprovalsSectionVisible(page);

  // Click on edit approvals section
  await TimeSettingsPage.clickEditApprovalsSection(page);

  // Check the Team members can review and submit their time checkbox
  await TimeSettingsPage.checkTeamMembersCanReviewAndSubmitTimeCheckbox(page);

  // Click on save button
  await TimeSettingsPage.saveApprovalSettings(page);

  await page.reload();

  // Step 7: Verify the Team members can review and submit their time value as on
  await TimeSettingsPage.verifyTeamMembersCanReviewAndSubmitTimeValue(
    page,
    'On',
  );

  // Click on edit notification section
  await TimeSettingsPage.clickEditNotificationSection(page);

  // Check email manager options
  await TimeSettingsPage.checkEmailManagerWhenEachTeamMemberSubmitsQBO(page);
  await TimeSettingsPage.checkEmailManagerWhenEntireTeamSubmitsQBO(page);

  // Save notification settings
  await TimeSettingsPage.saveNotificationSettings(page);

  // Verify QBO Time values
  await TimeSettingsPage.verifyEmailManagerWhenEachTeamMemberSubmitsValue(
    page,
    'On',
  );
  await TimeSettingsPage.verifyEmailManagerWhenEntireTeamSubmitsValue(
    page,
    'On',
  );

  await TimeSettingsPage.navigateToTimeEntries(page);
  // Navigate to Classic Timesheet Approval Preferences
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);
  await TimeSettingsPage.navigateToNotificationSection(classicPage);

  // Verify Classic Timesheet values
  await TimeSettingsPage.verifyEmailManagerWhenEachTeamMemberSubmitsChecked(
    classicPage,
  );
  await TimeSettingsPage.verifyEmailManagerWhenEntireTeamSubmitsChecked(
    classicPage,
  );
};

// APS017 - Validate custom message validation from classic time sheet
const validateCustomMessageFromClassicTimesheet = async (page: Page) => {
  console.log('Starting cleanup...');
  await cleanupDefaultCustomMessageFromQBOSettings(page);

  await TimeSettingsPage.navigateToTimeEntries(page);
  // Navigate to Classic Timesheet Approval Preferences
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);

  // Go to team member option section
  await TimeSettingsPage.verifyTeamMemberOptions(classicPage);

  // Check team members can review and submit time
  await TimeSettingsPage.checkTeamMembersCanReviewAndSubmitTime(classicPage);

  // Click on customize button
  await TimeSettingsPage.clickCustomizeButton(classicPage);

  // Edit custom message
  await TimeSettingsPage.editCustomMessage(classicPage, 'Test custom message');

  // Save custom message
  await TimeSettingsPage.saveCustomMessage(classicPage);

  // Validate the new custom message value
  await TimeSettingsPage.verifyCustomMessageValue(
    classicPage,
    'Test custom message',
  );

  await page.bringToFront();
  // Navigate to QBO Time
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.verifyApprovalsSectionVisible(page);

  await page.reload();
  await page.waitForTimeout(5000);
  // Verify QBO Time custom message value

  await TimeSettingsPage.verifyCustomMessageValueQBO(
    page,
    'Test custom message',
  );
};

// APS018 - Validate custom message validation from QBO time
const validateCustomMessageFromQBOTime = async (page: Page) => {
  console.log('Starting cleanup...');
  await cleanupDefaultCustomMessageFromQBOSettings(page);

  // Navigate to QBO Time Account & Settings
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  // Check for Approvals section
  await TimeSettingsPage.verifyApprovalsSectionVisible(page);

  // Click on edit approval section
  await TimeSettingsPage.clickEditApprovalsSection(page);

  await TimeSettingsPage.checkTeamMembersCanReviewAndSubmitTimeCheckbox(page);

  await TimeSettingsPage.editCustomMessageQBO(page, 'Test custom message');

  await TimeSettingsPage.saveApprovalSettings(page);

  await TimeSettingsPage.verifyCustomMessageValueQBO(
    page,
    'Test custom message',
  );

  await TimeSettingsPage.navigateToTimeEntries(page);
  // Navigate to Classic Timesheet Approval Preferences
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);

  // Verify the new custom message
  await TimeSettingsPage.verifyCustomMessageValue(
    classicPage,
    'Test custom message',
  );
};

// APS019 - Validate restore custom message validation from classic time sheet
const validateRestoreCustomMessageFromClassicTimesheet = async (page: Page) => {
  console.log('Starting cleanup...');
  await cleanupCustomMessageFromQBOSettings(page);

  await TimeSettingsPage.navigateToTimeEntries(page);

  // Navigate to Classic Timesheet Approval Preferences
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);

  // Go to team member option section
  await TimeSettingsPage.verifyTeamMemberOptions(classicPage);

  // Check team members can review and submit time
  await TimeSettingsPage.checkTeamMembersCanReviewAndSubmitTime(classicPage);

  // Click on customize button
  await TimeSettingsPage.clickCustomizeButton(classicPage);

  // Edit custom message
  await TimeSettingsPage.editCustomMessage(classicPage, 'Test custom message');

  // Save custom message
  await TimeSettingsPage.saveCustomMessage(classicPage);

  // Validate the new custom message value
  await TimeSettingsPage.verifyCustomMessageValue(
    classicPage,
    'Test custom message',
  );

  await page.bringToFront();

  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.verifyApprovalsSectionVisible(page);

  // Verify QBO Time custom message value is default
  await TimeSettingsPage.verifyCustomMessageValueQBO(
    page,
    'Test custom message',
  );

  await classicPage.bringToFront();
  // Click on customize button again
  await TimeSettingsPage.clickCustomizeButton(classicPage);

  // Click on restore message
  await TimeSettingsPage.clickRestoreMessage(classicPage);

  // Save custom message
  await TimeSettingsPage.saveCustomMessage(classicPage);

  // Validate default custom message value
  await TimeSettingsPage.verifyCustomMessageValue(
    classicPage,
    'By submitting your timesheets you agree that they are complete and accurate.',
  );

  await page.bringToFront();
  // Navigate to QBO Time
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.verifyApprovalsSectionVisible(page);

  // Verify QBO Time custom message value is default
  await TimeSettingsPage.verifyCustomMessageValueQBO(
    page,
    'By submitting your timesheets you agree that they are complete and accurate.',
  );
};

// APS020 - Validate reset custom message validation from QBO time
const validateResetCustomMessageFromQBOTime = async (page: Page) => {
  console.log('Starting cleanup...');
  await cleanupCustomMessageFromQBOSettings(page);

  // Navigate to QBO Time Account & Settings
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  // Check for Approvals section
  await TimeSettingsPage.verifyApprovalsSectionVisible(page);

  // Click on edit approval section
  await TimeSettingsPage.clickEditApprovalsSection(page);

  await TimeSettingsPage.checkTeamMembersCanReviewAndSubmitTimeCheckbox(page);

  await TimeSettingsPage.editCustomMessageQBO(page, 'Test custom message');

  await TimeSettingsPage.saveApprovalSettings(page);
  await page.reload();

  await page.waitForTimeout(6000);
  await TimeSettingsPage.verifyCustomMessageValueQBO(
    page,
    'Test custom message',
  );

  await TimeSettingsPage.navigateToTimeEntries(page);
  // Navigate to Classic Timesheet
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicApprovalPreferences(page);

  // Verify the default custom message
  await TimeSettingsPage.verifyCustomMessageValue(
    classicPage,
    'Test custom message',
  );

  await page.bringToFront();
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickEditApprovalsSection(page);
  await TimeSettingsPage.clickResetMessage(page);

  await TimeSettingsPage.saveApprovalSettings(page);

  await TimeSettingsPage.verifyCustomMessageValueQBO(
    page,
    'By submitting your timesheets you agree that they are complete and accurate.',
  );

  await classicPage.bringToFront();
  await classicPage.reload();
  // Verify the default custom message
  await TimeSettingsPage.verifyCustomMessageValue(
    classicPage,
    'By submitting your timesheets you agree that they are complete and accurate.',
  );
};

const validateGeoLocationElementsFromQBOTimeSettings = async (page: Page) => {
  // Navigate to QBO Time Account & Settings
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  // Verify Geo Location settings section is visible
  await TimeSettingsPage.verifyGeoLocationSettingsSectionVisible(page);

  // Verify the New badge exists near Geolocation text
  // await TimeSettingsPage.verifyNewBadgeVisible(page);

  // Click on edit geo location section
  await TimeSettingsPage.clickEditGeoLocationSection(page);

  // Check geo location options
  await TimeSettingsPage.verifyGeoLocationTrackingPageElements(page);

  //Click on Cancel and close iconbutton
  await TimeSettingsPage.clickCancelButton(page);

  await TimeSettingsPage.clickCloseIcon(page);
  await TimeSettingsPage.clickEditGeoLocationSection(page);

  //Verify popup after selecting location option and closing the trowser
  await TimeSettingsPage.verifyPopupAndDontSaveLocationTracking(page);

  console.log('Geo Location elements verified successfully');
};

const validateRequireLocationDualSyncFromQBO = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  //Verify Require location tracking option is selected
  await TimeSettingsPage.verifyRequireLocationTrackingOption(page);
  await TimeSettingsPage.selectAndVerifyRequireLocationOption(page);

  await TimeSettingsPage.navigateToTimeEntries(page);
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicLocationPreferences(page);
  await TimeSettingsPage.verifyLocationTrackingRadioButton(
    classicPage,
    'Required',
  );
  console.log('Require location tracking option verified successfully');
};

const validateOptionalLocationDualSyncFromQBOSettings = async (page: Page) => {
  //Verify Optional location tracking option is selected
  await TimeSettingsPage.verifyOptionalLocationTrackingOption(page);
  await TimeSettingsPage.selectAndVerifyOptionalLocationOption(page);

  await TimeSettingsPage.navigateToTimeEntries(page);
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicLocationPreferences(page);
  await TimeSettingsPage.verifyLocationTrackingRadioButton(
    classicPage,
    'Optional',
  );
  console.log('Optional location tracking option verified successfully');
};

const validateOptionalLocationDualSyncFromClassicTimesheet = async (
  page: Page,
) => {
  await TimeSettingsPage.navigateToTimeEntries(page);
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicLocationPreferences(page);
  await TimeSettingsPage.selectAndSaveLocationTrackingOption(
    classicPage,
    'Optional',
  );

  await page.bringToFront();
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await verifyLocationTrackingSetting(page, 'Optional');
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await TimeSettingsPage.verifyLocationTrackingOptionSelected(page, 'Optional');
  console.log('Optional location tracking verified from classic timesheet');
};

const validateNeverLocationDualSyncFromClassicTimesheet = async (
  page: Page,
) => {
  await TimeSettingsPage.navigateToTimeEntries(page);
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicLocationPreferences(page);
  await TimeSettingsPage.selectAndSaveLocationTrackingOption(
    classicPage,
    'Off',
  );

  await page.bringToFront();
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await page.reload();
  await verifyLocationTrackingSetting(page, 'Never');
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await TimeSettingsPage.verifyLocationTrackingOptionSelected(page, 'Never');
  console.log('Never location tracking verified from classic timesheet');
};

const validateRequireLocationDualSyncFromClassicTimesheet = async (
  page: Page,
) => {
  await TimeSettingsPage.navigateToTimeEntries(page);
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicLocationPreferences(page);
  await TimeSettingsPage.selectAndSaveLocationTrackingOption(
    classicPage,
    'Required',
  );

  await page.bringToFront();
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await verifyLocationTrackingSetting(page, 'Required');
  await page.reload();
  await page.waitForTimeout(500);
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await TimeSettingsPage.verifyLocationTrackingOptionSelected(page, 'Required');
  console.log('Require location tracking verified from classic timesheet');
};

const validateNeverLocationDualSyncFromQBO = async (page: Page) => {
  // Verify Never location tracking option is selected
  await TimeSettingsPage.verifyNeverLocationTrackingOption(page);
  await TimeSettingsPage.selectAndVerifyNeverLocationOption(page);

  await TimeSettingsPage.navigateToTimeEntries(page);
  const { classicPage } =
    await TimeSettingsPage.navigateToClassicLocationPreferences(page);
  await TimeSettingsPage.verifyLocationTrackingRadioButton(classicPage, 'Off');
  await page.waitForTimeout(500);
  console.log('Never location tracking option verified successfully');
};

const navigatetoLocationTrackingPage = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
};

const validateLocationTrackingSettingsForQBOFreeCompany = async (
  page: Page,
) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await expect(
    page.locator(
      `//div[@data-testid='geo-locations-settings-handle']//span[text()='Geolocation']`,
    ),
  ).not.toBeVisible();
  await expect(page.getByText('Location tracking')).not.toBeVisible();
  await expect(
    page.locator(
      `//div[@data-testid='geo-locations-settings-handle']//button[@aria-label='Edit']`,
    ),
  ).not.toBeVisible();
  console.log('Location Tracking settings not seen for qbo free company');
};

/**
 * Cleanup function to reset location tracking option to a specific value
 * @param page - Playwright page object
 * @param option - Location tracking option to set ('Optional', 'Never', or 'Require')
 */
const cleanupLocationTrackingOption = async (
  page: Page,
  option: 'Optional' | 'Never' | 'Require',
) => {
  try {
    console.log(`[CLEANUP] Resetting location tracking to: ${option}`);
    await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
    await page.waitForTimeout(1000);
    await TimeSettingsPage.clickEditGeoLocationSection(page);
    await page.waitForTimeout(1000);

    switch (option) {
      case 'Optional':
        await TimeSettingsPage.selectAndVerifyOptionalLocationOption(page);
        break;
      case 'Never':
        await TimeSettingsPage.selectAndVerifyNeverLocationOption(page);
        break;
      case 'Require':
        await TimeSettingsPage.selectAndVerifyRequireLocationOption(page);
        break;
      default:
        throw new Error(`Invalid location option: ${option}`);
    }

    console.log(`Cleanup: Location tracking successfully reset to: ${option}`);
  } catch (error) {
    console.error(`Cleanup: Failed to reset location tracking: ${error}`);
    // Don't throw to avoid failing the test due to cleanup issues
  }
};

const validateTimeSignatureAndTeamMemberPermissionsSettings = async (
  page: Page,
) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);

  // verify time signature settings
  await TimeSettingsPage.verifyTimeSignatureAndTeamMemberPermissionsSettings(
    page,
  );
  await TimeSettingsPage.changeTimeSignatureSettings(page);

  // verify team member permissions settings
  await TimeSettingsPage.verifyTeamMemberPermissionsSettings(page);
  await TimeSettingsPage.changeTeamMemberPermissionsSettings(page);
};

// Open TSheets directly in a new browser tab and navigate to Approvals
// Preferences (used by SUT01 instead of the QBO "Go to classic QuickBooks Time"
// link). Reuses the current authenticated browser context.
const navigateToApprovalsInTimeSheet = async (page: Page) => {
  // 1. Open a new tab in the browser.
  const tsheetsPage = await page.context().newPage();

  // 2. Navigate to TSheets.
  await tsheetsPage.goto('https://tsheets.intuit.com', { waitUntil: 'load' });
  await tsheetsPage.waitForLoadState();

  // Dismiss the welcome overlay if it appears.
  if (
    await tsheetsPage
      .locator(`//div[@class='overlay_content_box']`)
      .isVisible()
      .catch(() => false)
  ) {
    await tsheetsPage
      .getByTitle('Close')
      .click()
      .catch(() => {});
  }
  await expect(tsheetsPage.locator('#addons_shortcut')).toBeVisible();

  // 3. Click on Feature Add-ons.
  await tsheetsPage
    .locator(`//a[@id='addons_shortcut' or text()='Feature Add-ons']`)
    .click();

  // 4. Select Approvals Preferences.
  await tsheetsPage
    .locator(
      `//a[@id='addon_approvals_prefs_shortcut' or text()='Approvals Preferences']`,
    )
    .click();

  return tsheetsPage;
};

// Validate the "Team members can review and submit their time" checkbox under
// TEAM MEMBER OPTIONS is selected in TSheets Approvals Preferences.
const verifyTeamMembersReviewSubmitCheckboxSelected = async (page: Page) => {
  await expect(
    page.locator(`//input[@id='addon_approvals_employee_approval']`),
  ).toBeChecked();
};

// SUT02 (QBO): ensure submission is turned OFF in QBO Accounts & Settings >
// Approvals, then validate the disabled state in TSheets Approvals Preferences.
const verifyApprovalsSectionWhenSubmissionOffFromTSheets = async (
  page: Page,
) => {
  // 1. Cleanup: ensure the "Team members can review and submit their time"
  //    checkbox is unchecked inside Accounts & Settings > Approvals edit page.
  //    SUT02 (Submit Time) uses the Updated cleanup/navigation helpers.
  console.log('Starting cleanup...');
  await CleanupApprovalsFromClassicTimesheetUpdated(page);

  // 2. In TSheets Approvals Preferences validate the disabled state.
  //    Open TSheets directly in a new tab (same navigation as SUT01).
  const classicPage = await navigateToApprovalsInTimeSheet(page);
  //    General tab — "Team members can review and submit their time" not selected
  await expect(
    classicPage.locator(`//input[@id='addon_approvals_employee_approval']`),
  ).not.toBeChecked();
  //    Notifications tab — both submission reminder checkboxes disabled
  await navigateToNotificationSection(classicPage);
  await verifyTeamMemberNotificationCheckboxesDisabled(classicPage);
};

export {
  validateNavigationToTimeSettingsTimeTracking,
  validateEditModeTimeTracking,
  validateFirstDayofWorkWeek,
  validateTimeFormat,
  validateTimeZone,
  verifyCheckedUncheckedSplitTimeSheetFromSTE,
  verifyCheckedSplitTimeSheetFromTimeClock,
  verifyCheckUncheckAllowTMToCreateFromSTA,
  verifyIfEmpCanCreateTSFromSTA,
  verifyTimeSheetRoundingClkIn,
  verifyDualSyncPriorityCase,
  verifyDualSyncSettingsQBOSaved,
  verifyDualSyncSettingsClassicSaved,
  validateNavigationToTimeSettingsNotif,
  validateNotifEditMode,
  validateDaysRemSent,
  validateSendClkInRem,
  validateSendClkOutRem,
  validateNotifyWhenNotesAddedEdited,
  validateClockInOut,
  validateCheckboxes,
  verifyNotifDualSyncSettingsQBOSaved,
  verifyNotifDualSyncPriorityCaseClassicSaved,
  verifyNotifDualSyncPriorityCaseClassicSavedWithTabManagement,
  verifyNotifDualSyncSettingsClassicSaved,
  verifyDualSyncCustomizeTimesheetSettingsFromQBOSaved,
  verifyDualSyncCustomizeTimesheetSettingsFromClassicTimesheetSavedWithTabManagement,
  verifyDualSyncCustomizeTimesheetSettingsFromQBOSavedWithTabManagement,
  verifyDualSyncCustomizeTimesheetSettingsFromClassicTimesheetSaved,
  verifyCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet,
  verifyBillableCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet,
  verifyNotesCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet,
  verifyCustomizedTimeSheetFieldFromClassicTimeSheetToQBO,
  validateSubmissionsRemindersDayOfWeekFromClassicTimesheet,
  validateSubmissionsRemindersDayOfWeekFromQBOTime,
  validateSubmissionsRemindersPayrollCloseDateFromClassicTimesheet,
  validateSubmissionsRemindersPayPeriodFromQBOTime,
  validateSubmissionsRemindersDailyFromClassicTimesheet,
  validateSubmissionsRemindersDailyFromQBOTime,
  validateApprovalManagerRemindersDayOfWeekFromClassicTimesheet,
  validateApprovalManagerRemindersDayOfWeekFromQBOTime,
  validateApprovalManagerRemindersPayrollCloseDateFromClassicTimesheet,
  validateApprovalManagerRemindersPayPeriodFromQBOTime,
  validateEmailManagerFromClassicTimesheet,
  validateEmailManagerFromQBOTime,
  validateCustomMessageFromClassicTimesheet,
  validateCustomMessageFromQBOTime,
  validateRestoreCustomMessageFromClassicTimesheet,
  validateResetCustomMessageFromQBOTime,
  verifyDefaultApprovalPreferencesInTSheetsAndQBOSettings,
  verifyApprovalsSectionWhenSubmissionIsTurnedOff,
  verifyApprovalsSectionWhenSubmissionIsTurnedOnFromTSheets,
  verifyApprovalsSectionWhenSubmissionIsTurnedOnFromQBOSettings,
  validateGeoLocationElementsFromQBOTimeSettings,
  validateRequireLocationDualSyncFromQBO,
  validateOptionalLocationDualSyncFromQBOSettings,
  validateNeverLocationDualSyncFromQBO,
  navigatetoLocationTrackingPage,
  validateOptionalLocationDualSyncFromClassicTimesheet,
  validateNeverLocationDualSyncFromClassicTimesheet,
  validateRequireLocationDualSyncFromClassicTimesheet,
  cleanupLocationTrackingOption,
  validateLocationTrackingSettingsForQBOFreeCompany,
  validateTimeSignatureAndTeamMemberPermissionsSettings,
  verifyApprovalsSectionWhenSubmissionOffFromTSheets,
};
