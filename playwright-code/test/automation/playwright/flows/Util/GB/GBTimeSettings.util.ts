//import { Page } from 'playwright-core';
import { Page, expect } from '@playwright/test';
import gotoWithAuthSession from '../../../gotoWithAuthSession';
import TimeSettingsPage from '../../../pages/GB/GBTimeSettingsPage';
import {
  TimeTrackingTestId,
  STALabels,
  TimeTrackingLabels,
} from '../../../utilsTS';
import exp from 'constants';
import { string } from 'prop-types';
import SingleTimeActivityPage from '../../../pages/SingleTimeActivityPage';
import { WeeklyTimeActivity } from '../../../pages/WeeklyTimeActivity';

import { LABELS } from '../../../constants';

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
  await TimeSettingsPage.waitForLoadingToDisappear(page);
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
  await TimeSettingsPage.chooseDropDownOption(page, 20);
  await TimeSettingsPage.checkBoxTimeTrack(page, 0);
  await TimeSettingsPage.checkBoxTimeTrack(page, 1);
  await TimeSettingsPage.checkBoxTimeTrack(page, 2);

  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.clkInDirection,
    0,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 2);
  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.clkInRoundInc,
    0,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 1);
  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.clkOutDirection,
    1,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 1);
  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.clkOutRoundInc,
    1,
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
    1,
  );
  await TimeSettingsPage.chooseDropDownOption(page, 2);
  await TimeSettingsPage.clickOnDropdown(
    page,
    TimeTrackingTestId.clkOutRoundInc,
    1,
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
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
  await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);
  await TimeSettingsPage.validateCustomizeTimesheetFieldsChangesFromClassicTimesheetToQBO(
    page,
  );

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

  await TimeSettingsPage.uncheckCustomField(page, field);

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

  await TimeSettingsPage.uncheckCustomField(page, field);

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

export {
  validateNavigationToTimeSettingsTimeTracking,
  validateEditModeTimeTracking,
  validateFirstDayofWorkWeek,
  validateTimeFormat,
  verifyCheckedUncheckedSplitTimeSheetFromSTE,
  validateTimeZone,
  verifyCheckedSplitTimeSheetFromTimeClock,
  verifyCheckUncheckAllowTMToCreateFromSTA,
  verifyIfEmpCanCreateTSFromSTA,
  verifyTimeSheetRoundingClkIn,
  verifyDualSyncSettingsQBOSaved,
  verifyDualSyncSettingsClassicSaved,
  validateNavigationToTimeSettingsNotif,
  validateDaysRemSent,
  validateSendClkInRem,
  validateNotifyWhenNotesAddedEdited,
  validateSendClkOutRem,
  validateCheckboxes,
  verifyNotifDualSyncSettingsQBOSaved,
  verifyNotifDualSyncSettingsClassicSaved,
  validateClockInOut,
  verifyDualSyncCustomizeTimesheetSettingsFromQBOSaved,
  verifyDualSyncCustomizeTimesheetSettingsFromClassicTimesheetSaved,
  verifyCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet,
  verifyCustomizedTimeSheetFieldFromClassicTimeSheetToQBO,
  verifyBillableCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet,
  verifyNotesCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet,
  validateNotifEditMode,
  verifyDualSyncPriorityCase,
  verifyNotifDualSyncPriorityCaseClassicSaved,
  verifyNotifDualSyncPriorityCaseClassicSavedWithTabManagement,
  verifyDualSyncCustomizeTimesheetSettingsFromQBOSavedWithTabManagement,
  verifyDualSyncCustomizeTimesheetSettingsFromClassicTimesheetSavedWithTabManagement,
};
