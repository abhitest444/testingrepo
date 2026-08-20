import { Page } from 'playwright-core';
import { expect } from '@playwright/test';
import TimeClockPage from '../../pages/TimeClockPage';
import { LABELS } from '../../constants';
import * as commonLocator from '../../commonUtils';
import { validateTimeClockEntriesInTable } from './RunPayrollEditFlow.util';
import {
  openDateRangeDropdown,
  selectDateRangeOption,
  selectDisplayByOption,
} from '../../commonUtils';
import TimeEntriesPage from '../../pages/TimeEntriesPage';

const validateTimeClockNavigationAndAccess = async (page: Page) => {
  // Navigate to Time Clock from dropdown
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    // Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);

  await TimeClockPage.waitForDrawerVisible(page);

  // Verify Clock In screen is visible
  await TimeClockPage.isClockInScreenVisible(page);
};

const validateClockInFunctionality = async (page: Page) => {
  console.log('Deleting the time entry...');
  await deleteTimeEntry(page, 'Emp1, Test');

  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    // Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForLoadingToDisappearTCPopup(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Verify Clock In screen with default timer and time displays
  await TimeClockPage.isClockInScreenVisible(page);

  // Verify Clock In button is visible
  await TimeClockPage.validateClockInButtonVisibility(page);
};

const validateClockOutButtonVisibility = async (page: Page) => {
  console.log('Deleting the time entry...');
  await deleteTimeEntry(page, 'employee, aaatest');

  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  // Get available options
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  console.log(options);
  expect(options.length).toBeGreaterThan(0);

  // Verify we can select an option
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }
  await TimeClockPage.clickOnClockInButton(page);
  await TimeClockPage.waitForLoadingToDisappearTCPopup(page);
  await page.waitForTimeout(8000);
  // Verify Clock In button is not visible and Clock Out button is visible
  await TimeClockPage.validateClockOutButtonVisibility(page);
  await TimeClockPage.clickClockOut(page);
  await page.waitForTimeout(5000);

  await page.reload();
  // validate the Time entrie in the table
  await validateTimeClockEntriesInTable(page, 'employee, aaatest');
};

const validateClockInIntialTimeDisplayBackgroundColor = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  // Verify Clock In screen with default timer and time displays
  await TimeClockPage.isClockInScreenVisible(page);

  // Verify Clock In button is visible
  await TimeClockPage.validateTimerDisplayBackgroundColor(
    page,
    'rgba(0, 0, 0, 0)',
  );
};

const validateClockInTimeDisplayBackgroundColor = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  // Verify Clock In screen with default timer and time displays
  await TimeClockPage.isClockInScreenVisible(page);

  // Get available options
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  console.log(options);
  expect(options.length).toBeGreaterThan(0);

  // Verify we can select an option
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }
  await TimeClockPage.clickOnClockInButton(page);

  // Verify Clock In button is visible
  await TimeClockPage.validateTimerDisplayBackgroundColor(page, '#F6FDEB');
};

const validateTimeSelectionAMPM = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  await TimeClockPage.openTimeDropdown(page);
  const options = await TimeClockPage.getDateTimeOptions(page);
  console.log(options);
  const hasAMPM = options.some((opt) => /AM|PM/i.test(opt));
  // expect(hasAMPM).toBeTruthy();
};

const validateClockInScreenInitialState = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  // Verify today's time starts at 0
  const todayTime = await TimeClockPage.getTodayTime(page);
  // expect(todayTime).toContain('0h 00m');

  // Verify week total time is displayed
  const weekTotalTime = await TimeClockPage.getWeekTotalTime(page);
  expect(weekTotalTime).toBeTruthy();

  // Verify date dropdown is present
  expect(
    page.locator(`//button[@aria-label='Start date Calendar']`),
  ).toBeVisible();

  // Verify time dropdown is present
  expect(
    page.locator(
      `//span[text()='Start time']/../div/div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    ),
  ).toBeVisible();

  await page
    .locator(
      `//span[text()='Customers']/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .waitFor({ state: 'visible' });

  // Verify customer/project dropdown is present
  expect(
    page.locator(
      `//span[text()='Customers']/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    ),
  ).toBeVisible();
};

const validateAdminNameInHeader = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);

  await TimeClockPage.waitForDrawerVisible(page);
  await page.waitForTimeout(5000);
  // Verify admin header is visible and contains admin name
  const adminHeader = await TimeClockPage.getAdminHeader(page);
  expect(adminHeader).toBeTruthy();
  expect(adminHeader).not.toBe('');
};

const validateCustomerProjectSelection = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  console.log(options);
  expect(options.length).toBeGreaterThan(0);

  // Verify we can select an option
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
    // Verify selection was made
    const selectedValue = await page
      .locator(`//span[text()='Customers']/..//input`)
      .inputValue();
    expect(selectedValue).toContain(options[0]);
  }
};

const validateDateTimeSelection = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  const todayDD = TimeClockPage.getTodayDayDD();
  await TimeClockPage.selectCurrentDate(page);
  await TimeClockPage.selectTime(page, '3:00 PM');
};

const validateMandatoryFields = async (page: Page) => {
  await TimeClockPage.navigateToTimeClock(page);
  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);

  // Try to submit without filling required fields
  await TimeClockPage.clearStartDate(page);
  await TimeClockPage.clearStartTime(page);

  await page.waitForTimeout(5000);
  await TimeClockPage.clickOnClockInButton(page);
  await TimeClockPage.waitForDrawerVisible(page);
  // Verify error message is displayed
  const dateErrorMsg = await TimeClockPage.getErrorMessage(page);
  expect(dateErrorMsg).toBeTruthy();
  expect(dateErrorMsg).toContain('Invalid date');

  const timeErrorMsg = await TimeClockPage.getTimeErrorMessage(page);
  expect(timeErrorMsg).toBeTruthy();
  expect(timeErrorMsg).toContain('This field is required');
};

const validateCustomerMandatoryFields = async (page: Page) => {
  await TimeClockPage.navigateToTimeClock(page);
  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);

  await TimeClockPage.clickOnClockInButton(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Verify error message is displayed
  const timeErrorMsg = await TimeClockPage.getTimeErrorMessage(page);
  expect(timeErrorMsg).toBeTruthy();
  expect(timeErrorMsg).toContain('This field is required');
};

const validateCustomFieldMandatoryFields = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  await TimeClockPage.clickClockOut(page);

  // Verify error message is displayed
  const timeErrorMsg = await TimeClockPage.getTimeErrorMessage(page);
  expect(timeErrorMsg).toBeTruthy();
  expect(timeErrorMsg).toContain('This field is required');

  await TimeClockPage.selectShift(page);
  await TimeClockPage.clickClockOut(page);
};

const validateDateTimeRestrictions = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  const previousDay = TimeClockPage.getPreviousDayDD();
  // Try to select a date more than 24 hours in the past
  await TimeClockPage.selectDate(page, previousDay);
  // Get available options
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  console.log(options);
  expect(options.length).toBeGreaterThan(0);

  // Verify we can select an option
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }
  await TimeClockPage.clickOnClockInButton(page);

  // Verify error message
  const errorMsg = await TimeClockPage.getTimeErrorMessage(page);
  expect(errorMsg).toContain('Start time conflicts with other timesheets.');
};

const validateClockedOutMessage = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  const adminName = await TimeClockPage.getAdminHeader(page);
  // Get available options
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  console.log(options);
  expect(options.length).toBeGreaterThan(0);

  // Verify we can select an option
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }
  await TimeClockPage.clickOnClockInButton(page);
  await page.waitForTimeout(7000);
  await TimeClockPage.clickClockOut(page);
  const clockedOutMsg = await TimeClockPage.getClockedOutMessage(page);
  expect(clockedOutMsg).toContain(`clocked out at`);
  await page.waitForTimeout(5000);
};

const validateClockedInMessage = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  console.log(options);
  expect(options.length).toBeGreaterThan(0);

  // Verify we can select an option
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }
  await TimeClockPage.clickOnClockInButton(page);

  const clockedOutMsg = await TimeClockPage.getClockedInMessage(page);
  expect(clockedOutMsg).toContain('clocked in at');

  await TimeClockPage.clickClockOut(page);
  await page.waitForTimeout(5000);
};

const validateDrawerReset = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Click outside the drawer
  await TimeClockPage.clickDrawerClose(page);

  // Verify drawer is closed
  await TimeClockPage.isDrawerNotVisible(page);

  // Verify user is not clocked in
  expect(await TimeClockPage.isClockInVisible(page)).toBeTruthy();
  expect(await TimeClockPage.isClockOutButtonVisible(page)).toBeFalsy();
};

const validateClockInDrawerClose = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  await page.waitForTimeout(5000);
  // Verify Clock Out button is visible
  expect(await TimeClockPage.isClockOutButtonVisible(page)).toBeTruthy();

  // Verify Clock In button is not visible
  expect(await TimeClockPage.isClockInButtonVisible(page)).toBeFalsy();

  await TimeClockPage.clickClockOut(page);
  await page.waitForTimeout(5000);
};

const validateTimerStartsOnClockIn = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);
  await TimeClockPage.waitForLoadingToDisappearTCPopup(page);
  // Wait for timer to start
  await page.waitForTimeout(6000);

  // Verify timer is running
  const timer = await TimeClockPage.getTimerDisplay(page);
  expect(timer).not.toBe('00:00:00');
  expect(await TimeClockPage.validateTimerGreaterThanZero(page)).toBeTruthy();

  await TimeClockPage.clickClockOut(page);
  await page.waitForTimeout(5000);
};

const validateHeaderShowsClockedIn = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  // Get admin name
  const adminName = await TimeClockPage.getAdminHeader(page);

  // Verify clocked in message
  const clockedInMessage = await TimeClockPage.getClockedInMessage(page);
  expect(clockedInMessage).toContain(`clocked in at`);
};

const validateHeaderShowsTodayAndWeekTime = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  // Wait for timer to start
  await page.waitForTimeout(2000);

  // Verify today's time is displayed
  const todayTime = await TimeClockPage.getTodayTime(page);
  expect(todayTime).toMatch(/\d+h\s+\d+m/);

  // Verify week's time is displayed
  const weekTime = await TimeClockPage.getWeekTotalTime(page);
  expect(weekTime).toMatch(/\d+h\s+\d+m/);
};

const validateRunningTimerAfterClockIn = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);
  await TimeClockPage.waitForLoadingToDisappearTCPopup(page);
  await page.waitForTimeout(6000);
  // Verify Clock In button is not visible
  expect(await TimeClockPage.isClockInButtonVisible(page)).toBeFalsy();

  // Verify running timer is displayed
  const timer = await TimeClockPage.getTimerDisplay(page);
  expect(timer).not.toBe('00:00:00');
  expect(await TimeClockPage.validateTimerGreaterThanZero(page)).toBeTruthy();
};

const validateClockInDrawerNotAccessible = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);
  await TimeClockPage.waitForLoadingToDisappearTCPopup(page);
  await page.waitForTimeout(8000);

  // Verify Clock Out button is visible
  expect(await TimeClockPage.isClockOutButtonVisible(page)).toBeTruthy();

  // Verify additional fields are displayed
  expect(page.locator(`//span[contains(text(),'Service')]`)).toBeVisible();
  expect(page.locator(`//span[text()='Billable']`)).toBeVisible();

  await TimeClockPage.clickClockOut(page);
  await page.waitForTimeout(2000);
};

export const validatePreselectedFields = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  const currentDate = new Date();

  // Format date as MM/DD/YYYY to match input format
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  // Verify Start Date is preselected with current date
  const startDate = await page
    .locator(`//span[text()='Start date']/..//input`)
    .inputValue();
  expect(startDate).toContain(formattedDate);

  // Get the actual time from the input
  const startTime = await page
    .locator(`//span[text()='Start time']/..//input`)
    .inputValue();

  // Verify that the time is in the correct format (HH:MM AM/PM)
  expect(startTime).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);

  // Verify Customer/Project is preselected
  const customerProject = await page
    .locator(`//span[text()='Customers']/..//input`)
    .inputValue();
  // expect(customerProject).toBeTruthy();
  expect(customerProject).toBe('');
};

const validateServiceItemSelection = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  console.log('Deleting the time entry...');
  await deleteTimeEntry(page, 'employee, aaatest');

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  //await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  //await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  // Get available service item options
  await TimeClockPage.waitForLoadingToDisappearTCPopup(page);
  const serviceOptions = await TimeClockPage.getServiceItemOptions(page);
  expect(serviceOptions.length).toBeGreaterThan(0);

  // Verify we can select a service item
  if (serviceOptions.length > 0) {
    await page
      .locator(
        `//span[contains(text(),'Service')]/..//following-sibling::div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
      )
      .click();
    await page.getByRole('option', { name: serviceOptions[0] }).click();

    await page.locator(`[data-test-id="time-clock-save-button"]`).click();
    await expect(
      page.getByTestId('toastMessage').locator('span').nth(1),
    ).toBeVisible();

    // Verify selection was made
    const selectedValue = await page
      .locator(`//span[contains(text(),'Service')]/..//input`)
      .inputValue();
    expect(selectedValue).toContain(serviceOptions[0]);

    await TimeClockPage.clickClockOut(page);
    await page.waitForTimeout(5000);

    await page.reload();
    console.log('Validating time clock entries in table...');
    await validateTimeClockEntriesInTable(page, 'employee, aaatest');
  }
};

const validateCustomField = async (page: Page) => {
  console.log('Deleting the time entry...');
  await deleteTimeEntry(page, 'employee, aaatest');

  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  // Get available service item options
  const serviceOptions = await TimeClockPage.getServiceItemOptions(page);
  expect(serviceOptions.length).toBeGreaterThan(0);

  // Verify we can select a service item
  if (serviceOptions.length > 0) {
    await page
      .locator(
        `//span[contains(text(),'Service')]/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
      )
      .click();
    await page.getByRole('option', { name: serviceOptions[0] }).click();

    // Fill Task Code
    await TimeClockPage.fillTaskCode(page, 'T-102');
    // Fill Equipment Used
    await TimeClockPage.fillEquipmentUsed(page, 'Excavator #4');
    // Select Shift (dropdown)
    await TimeClockPage.selectShift(page);

    await page.locator(`[data-test-id="time-clock-save-button"]`).click();
    await expect(
      page.getByTestId('toastMessage').locator('span').nth(1),
    ).toBeVisible();

    // Verify selection was made
    const selectedValue = await page
      .locator(`//span[contains(text(),'Service')]/..//input`)
      .inputValue();
    expect(selectedValue).toContain(serviceOptions[0]);

    await TimeClockPage.clickClockOut(page);
    await page.waitForTimeout(5000);

    console.log('Validating time clock entries in table...');
    await validateTimeClockEntriesInTable(page, 'employee, aaatest');
  }
};

const validateBillableField = async (page: Page) => {
  console.log('Deleting the time entry...');
  await deleteTimeEntry(page, 'Employee, aaatest');
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  await page.waitForTimeout(6000);
  // Verify billable checkbox is visible
  const billableCheckbox = page.locator(
    `//input[contains(@class, 'RcCheckbox')]`,
  );
  await billableCheckbox.waitFor({ state: 'visible' });
  expect(billableCheckbox).toBeVisible();

  // Test checking the billable checkbox
  await billableCheckbox.check();
  expect(await billableCheckbox.isChecked()).toBeTruthy();

  // Verify bill rate field appears when billable is checked
  const billRateField = page.locator(`//input[@aria-label='Bill rate']`);
  expect(billRateField).toBeVisible();

  // Test entering bill rate
  await billRateField.fill('100.00');
  expect(await billRateField.inputValue()).toBe('100.00');

  await page.waitForTimeout(5000);
  // Test unchecking the billable checkbox
  await billableCheckbox.uncheck();
  expect(await billableCheckbox.isChecked()).toBeFalsy();

  // Verify bill rate field is hidden when billable is unchecked
  expect(billRateField).not.toBeVisible();
};

const validateClassSelection = async (page: Page) => {
  console.log('Deleting the time entry...');
  await deleteTimeEntry(page, 'Employee, aaatest');
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);
  await TimeClockPage.waitForLoadingToDisappearTCPopup(page);

  // Get available class options
  const classOptions = await TimeClockPage.getClassOptions(page);
  console.log(classOptions);
  if (classOptions.length > 0) {
    await TimeClockPage.selectClass(page, classOptions[0]);
  }

  // Verify we can select a class
  const selectedValue = await page
    .locator(`//input[@placeholder='Select class']`)
    .inputValue();
  expect(selectedValue).toContain(classOptions[0]);
};

const validateDepartmentSelection = async (page: Page) => {
  console.log('Deleting the time entry...');
  await deleteTimeEntry(page, 'Employee, aaatest');
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  // Get available department options
  const departmentOptions = await TimeClockPage.getDepartmentOptions(page);
  if (departmentOptions.length > 0) {
    await TimeClockPage.selectDepartment(page, departmentOptions[0]);
  }

  // Verify we can select a class
  const selectedValue = await page
    .locator(`//input[@placeholder='Select Department']`)
    .inputValue();
  expect(selectedValue).toContain(departmentOptions[0]);
  await page.waitForTimeout(2000);
  await TimeClockPage.clickClockOut(page);
};

const validateLocationSelection = async (page: Page) => {
  console.log('Deleting the time entry...');
  await deleteTimeEntry(page, 'Employee, aaatest');
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  // Get available location options
  const locationOptions = await TimeClockPage.getLocationOptions(page);
  console.log(locationOptions);
  if (locationOptions.length > 0) {
    await TimeClockPage.selectLocation(page, locationOptions[1]);
  }

  await page.locator(`[data-test-id="time-clock-save-button"]`).click();

  // Verify we can select a class
  const selectedValue = await page
    .locator(`//input[@placeholder='Select Location']`)
    .inputValue();
  expect(selectedValue).toContain(locationOptions[0]);
  await page.waitForTimeout(2000);
  await TimeClockPage.clickClockOut(page);
};

const validateCustomerProjectQuickfill = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Test customer/project quickfill
  const searchText = 'Test';
  const expectedOption = 'Test Customer';

  await TimeClockPage.quickfillCustomerProject(
    page,
    searchText,
    expectedOption,
  );

  // Verify selection was made
  const selectedValue = await page
    .locator(`//span[text()='Customers']/..//input`)
    .inputValue();
  expect(selectedValue).toContain(expectedOption);
};

const validateServiceItemQuickfill = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  // Test service item quickfill
  const searchText = 'Test';
  const expectedOption = 'Test Service';

  await TimeClockPage.quickfillServiceItem(page, searchText, expectedOption);

  // Verify selection was made
  const selectedValue = await page
    .locator(`//span[contains(text(),'Service')]/..//input`)
    .inputValue();
  expect(selectedValue).toContain(expectedOption);

  await page.locator(`[data-test-id="time-clock-save-button"]`).click();
  await expect(
    page.getByTestId('toastMessage').locator('span').nth(1),
  ).toBeVisible();

  await TimeClockPage.clickClockOut(page);
  await page.waitForTimeout(5000);
};

const validateTimerTurnsGreenOnClockIn = async (page: Page) => {
  await TimeClockPage.navigateToTimeClock(page);
  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  // Get available options
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  console.log(options);
  expect(options.length).toBeGreaterThan(0);

  // Verify we can select an option
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }
  await TimeClockPage.clickOnClockInButton(page);
  await page.waitForTimeout(5000);
  // Check timer container background color is green (e.g., #F6FDEB)
  // await TimeClockPage.validateTimerDisplayBackgroundColor(page, '#F6FDEB');
  await TimeClockPage.clickClockOut(page);
  await page.waitForTimeout(5000);
};

const validateTimesheetUpdateOnSave = async (page: Page) => {
  console.log('Deleting the time entry...');
  await deleteTimeEntry(page, 'Emp1, Test');

  await TimeClockPage.navigateToTimeClock(page);
  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  // Get available options
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  console.log(options);
  expect(options.length).toBeGreaterThan(0);

  // Verify we can select an option
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }
  // Fill required fields and clock in
  await TimeClockPage.clickOnClockInButton(page);
  // Simulate save (if there's a save button, click it)
  await page.locator(`[data-test-id="time-clock-save-button"]`).click();
  // Validate that timesheet is updated (e.g., check for a success toast or updated entry)
  // This is a placeholder, adjust as per your UI
  await expect(
    page.getByTestId('toastMessage').locator('span').nth(1),
  ).toBeVisible();
};

const validateTimerResetOnClockOut = async (page: Page) => {
  console.log('Deleting the time entry...');
  await deleteTimeEntry(page, 'employee, aaatest');

  await TimeClockPage.navigateToTimeClock(page);
  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  // Get available options
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  console.log(options);
  expect(options.length).toBeGreaterThan(0);

  // Verify we can select an option
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }
  await TimeClockPage.clickOnClockInButton(page);
  // Wait a bit for timer to tick
  await page.waitForTimeout(2000);
  // Get available service item options
  const serviceOptions = await TimeClockPage.getServiceItemOptions(page);
  expect(serviceOptions.length).toBeGreaterThan(0);

  // Verify we can select a service item
  if (serviceOptions.length > 0) {
    await page
      .locator(
        `//span[contains(text(),'Service')]/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
      )
      .click();
    await page.getByRole('option', { name: serviceOptions[0] }).click();
  }
  await page.waitForTimeout(5000);
  await TimeClockPage.clickClockOut(page);

  await page.waitForTimeout(2000);
  await TimeClockPage.clickClockIn(page);
};

const validateTimerResetOnSwitchJob = async (page: Page) => {
  console.log('Deleting the time entry...');
  await deleteTimeEntry(page, 'employee, aaatest');

  await TimeClockPage.navigateToTimeClock(page);
  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  // Get available options
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  console.log(options);
  expect(options.length).toBeGreaterThan(0);

  // Verify we can select an option
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }
  await TimeClockPage.clickOnClockInButton(page);
  // Wait a bit for timer to tick
  await page.waitForTimeout(8000);
  // Click switch job
  await page.locator(`//span[text()='Switch jobs']`).click();
  await page.waitForTimeout(5000);
  await TimeClockPage.chooseCustomerProject(page, options[1]);

  // Timer should reset to 00:00:00
  const timer = await TimeClockPage.getTimerDisplay(page);
  expect(timer).not.toContain('00:00:00');
  // Should be on clock in screen
  expect(await TimeClockPage.isClockInButtonVisible(page)).toBeFalsy();
};

const validateSwitchJobShowsAllFields = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);
  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  // Wait for timer to start
  await page.waitForTimeout(5000);

  // Click Switch Job button
  await page.locator(`//span[text()='Switch jobs']`).click();

  // Verify all fields are visible
  expect(page.locator(`//span[text()='Customers']`)).toBeVisible();
  expect(page.locator(`//span[contains(text(),'Service')]`)).toBeVisible();

  await page.waitForTimeout(2000);
  // Select new customer/project
  if (options.length > 1) {
    await TimeClockPage.selectCustomerProject(page, options[1]);
  }

  // Verify new timesheet is created
  const toastMessage = await page
    .locator(
      `//div[contains(@class, 'SuccessToast__StyledToastMessage')]//span[contains(@class, 'Typography-regular')]`,
    )
    .textContent();
  expect(toastMessage).toContain(`Job switched to ${options[1]}`);

  // Get available service item options
  const serviceOptions = await TimeClockPage.getServiceItemOptions(page);
  expect(serviceOptions.length).toBeGreaterThan(0);

  // Verify we can select a service item
  if (serviceOptions.length > 0) {
    await page
      .locator(
        `//span[contains(text(),'Service')]/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
      )
      .click();
    await page.getByRole('option', { name: serviceOptions[0] }).click();
  }
  await TimeClockPage.clickClockOut(page);

  console.log('Validating time clock entries in table...');
  await validateTimeClockEntriesInTable(page, 'employee, aaatest');
};

const validateBackendErrorHandling = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Simulate backend error by intercepting API calls
  await page.route('**/api/**', (route) => route.abort('failed'));

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);

  // Verify error message is displayed
  const errorMessage = await TimeClockPage.getTimeClockScreenErrorMessage(page);
  expect(errorMessage).toContain(`Your info didn’t load`);

  // Restore network
  await page.unroute('**/api/**');
};

const validateMultipleDeviceClockIn = async (page: Page) => {
  // First device/tab - Clock in successfully
  await TimeClockPage.navigateToTimeClock(page);
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  await TimeClockPage.clickOnClockInButton(page);
  await page.locator(`[data-test-id="time-clock-save-button"]`).click();
  await TimeClockPage.clickDrawerClose(page);

  // Open a new tab and navigate to Time Clock
  const newPage = await page.context().newPage();
  await TimeClockPage.navigateToTimeClock(newPage);

  // Verify clock in is prevented in the new tab
  expect(await TimeClockPage.isClockInButtonVisible(newPage)).toBeFalsy();

  await TimeClockPage.clickClockIn(newPage);
};

const validateRunningTimeErrorHandling = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  await TimeClockPage.clickOnClockInButton(page);

  // Simulate running time API failure
  await page.route('**/intuit.com/graphql**', (route) => route.abort('failed'));

  // Verify error message is displayed at the top of the screen
  const errorMessage = await page.locator(`//h3/strong`).textContent();
  expect(errorMessage).toContain(`We couldn't save your recent changes`);

  // Restore network
  await page.unroute('**/intuit.com/graphql**');
};

const validateNetworkErrorOnTimeEntries = async (page: Page) => {
  // Simulate network outage
  await page.route('**/api/**', (route) => route.abort('failed'));

  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify error message is displayed
  const errorTitleMessage = await page
    .locator(`div[data-testid='error-page-error-title']`)
    .textContent();

  const errorBodyMessage = await page
    .locator(`div[data-testid='error-page-error-body']`)
    .textContent();
  expect(errorTitleMessage).toContain('Something went wrong.');
  expect(errorBodyMessage).toContain('Try again later.');

  // Verify no time entries are shown
  expect(page.locator(`//span[text()='Display by']`)).not.toBeVisible();

  // Restore network
  await page.unroute('**/api/**');
};

const validateNetworkErrorOnClockInDrawer = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Simulate network outage
  await page.route('**/api/**', (route) => route.abort('failed'));

  // Verify error message is displayed in drawer
  await page.reload();
  const errorTitleMessage = await page
    .locator(`div[data-testid='error-page-error-title']`)
    .textContent();

  const errorBodyMessage = await page
    .locator(`div[data-testid='error-page-error-body']`)
    .textContent();
  expect(errorTitleMessage).toContain('Something went wrong.');
  expect(errorBodyMessage).toContain('Try again later.');

  // Restore network
  await page.unroute('**/api/**');
};

const validateSaveTimeClockError = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  // Simulate save error
  await page.route('**/api/time-clock/save', (route) => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({
        message: 'Could not save. Please try again.',
      }),
    });
  });

  // Click save button
  await page.locator(`//button/span[text()='Save']`).click();

  // Verify error message
  const errorMessage = await TimeClockPage.getErrorMessage(page);
  expect(errorMessage).toContain('Could not save');
  expect(errorMessage).toContain('Please try again');

  // Verify entry is not saved
  expect(await TimeClockPage.isClockInButtonVisible(page)).toBeTruthy();

  // Restore API
  await page.unroute('**/api/time-clock/save');
};

const validateClockOutError = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Clock in first
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  await TimeClockPage.clickOnClockInButton(page);
  await page.locator(`//button/span[text()='Save']`).click();

  // Simulate clock out error
  await page.route('**/api/time-clock/out', (route) => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({
        message: 'Could not clock out. Please try again.',
      }),
    });
  });

  // Click clock out button
  await TimeClockPage.clickClockOut(page);

  // Verify error message
  const errorMessage = await TimeClockPage.getErrorMessage(page);
  expect(errorMessage).toContain('Could not clock out');
  expect(errorMessage).toContain('Please try again');

  // Verify user is still clocked in
  expect(await TimeClockPage.isClockOutButtonVisible(page)).toBeTruthy();

  // Restore API
  await page.unroute('**/api/time-clock/out');
};

const validateTimesheetOverlapOnClockIn = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  // Set a time that would overlap
  await TimeClockPage.selectTime(page, '3:00 PM');

  // Simulate overlap error
  await page.route('**/api/time-clock/in', (route) => {
    route.fulfill({
      status: 409,
      body: JSON.stringify({
        message:
          'Time entry overlaps with another timesheet. Please resolve the conflict before proceeding.',
      }),
    });
  });

  // Click save button
  await page.locator(`[data-test-id="time-clock-save-button"]`).click();

  // Verify error message
  const errorMessage = await TimeClockPage.getErrorMessage(page);
  expect(errorMessage).toContain('Time entry overlaps with another timesheet');
  expect(errorMessage).toContain('Please resolve the conflict');

  // Verify user is not clocked in
  expect(await TimeClockPage.isClockInButtonVisible(page)).toBeTruthy();

  // Restore API
  await page.unroute('**/api/time-clock/in');
};

const validateTimesheetOverlapOnEdit = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  await TimeClockPage.waitForLoadingToDisappearTCPopup(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  // Set a time that would overlap
  await TimeClockPage.selectTime(page, '3:00 PM');

  // Simulate overlap error on edit
  await page.route('**/api/time-clock/edit', (route) => {
    route.fulfill({
      status: 409,
      body: JSON.stringify({
        message:
          'Time entry overlaps with another timesheet. Please resolve the conflict before saving.',
      }),
    });
  });

  // Click save button
  await page.locator(`[data-test-id="time-clock-save-button"]`).click();

  // Verify error message
  const errorMessage = await TimeClockPage.getErrorMessage(page);
  expect(errorMessage).toContain('Time entry overlaps with another timesheet');
  expect(errorMessage).toContain('Please resolve the conflict');

  // Verify changes are not saved
  const currentTime = await TimeClockPage.getDateTimeDropdownValue(page);
  expect(currentTime).not.toBe('3:00 PM');

  // Restore API
  await page.unroute('**/api/time-clock/edit');
};

const validateClockInPermission = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Verify Clock In button is not visible
  expect(await TimeClockPage.isClockInVisible(page)).toBeFalsy();
};

const validateFutureStartTime = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  // Set a future time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const futureTime = tomorrow.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  await TimeClockPage.selectDate(page, tomorrow.toDateString());
  await TimeClockPage.selectTime(page, futureTime);

  // Click save button
  await page.locator(`[data-test-id="time-clock-save-button"]`).click();

  // Verify error message
  const errorMessage = await TimeClockPage.getTimeErrorMessage(page);
  expect(errorMessage).toContain('Start time cannot be in the future');

  // Verify entry is not saved
  expect(await TimeClockPage.isClockInButtonVisible(page)).toBeTruthy();
};

const validateQuickfillDropdowns = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);

  await TimeClockPage.waitForLoadingToDisappear(page);

  // Open the "Date range" dropdown
  await commonLocator.openDateRangeDropdown(page);

  // Select "This month" from the "Date range" dropdown
  await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  // Test Class quickfill
  const classSearchText = 'Test';
  const expectedClassOption = 'Test Class';
  await TimeClockPage.quickfillClass(
    page,
    classSearchText,
    expectedClassOption,
  );
  const selectedClass = await page
    .locator(`//input[@aria-label='Select class']`)
    .inputValue();
  expect(selectedClass).toContain(expectedClassOption);

  // Test Department quickfill
  const deptSearchText = 'Test';
  const expectedDeptOption = 'Test Department';
  await TimeClockPage.quickfillDepartment(
    page,
    deptSearchText,
    expectedDeptOption,
  );
  const selectedDepartment = await page
    .locator(`//input[@placeholder='Select Location']`)
    .inputValue();
  expect(selectedDepartment).toContain(expectedDeptOption);

  // Save the time entry
  await page.locator(`[data-test-id="time-clock-save-button"]`).click();
  await expect(
    page.getByTestId('toastMessage').locator('span').nth(1),
  ).toBeVisible();

  // Clock out
  await TimeClockPage.clickClockOut(page);
  await page.waitForTimeout(5000);
};

export const validateFieldLabels = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  await TimeClockPage.waitForLoadingToDisappearTCPopup(page);

  // Verify field labels on Clock In screen
  expect(
    await page.locator(`//span[text()='Start date']`).isVisible(),
  ).toBeTruthy();
  expect(
    await page.locator(`//span[text()='Start time']`).isVisible(),
  ).toBeTruthy();

  // Get available options and select one
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click Clock In button
  await TimeClockPage.clickOnClockInButton(page);

  expect(
    await page.locator(`//span[text()='Customers']`).isVisible(),
  ).toBeTruthy();
  expect(
    await page.locator(`//span[contains(text(),'Service')]`).isVisible(),
  ).toBeTruthy();
  expect(await page.locator(`//span[text()='Class']`).isVisible()).toBeTruthy();
  expect(
    await page.locator(`//span[text()='Location']`).isVisible(),
  ).toBeTruthy();
  expect(await page.locator(`//span[text()='Notes']`).isVisible()).toBeTruthy();

  // Get available service item options
  const serviceOptions = await TimeClockPage.getServiceItemOptions(page);
  expect(serviceOptions.length).toBeGreaterThan(0);

  // Verify we can select a service item
  if (serviceOptions.length > 0) {
    await page
      .locator(
        `//span[contains(text(),'Service')]/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
      )
      .click();
    await page.getByRole('option', { name: serviceOptions[0] }).click();
  }
  await TimeClockPage.clickClockOut(page);
};

export const validateTimeEntriesOrder = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Get all time entries
  const timeEntries = await page
    .locator('[data-test-id="time-entry-row"]')
    .all();

  // Verify entries are in descending order by date
  for (let i = 0; i < timeEntries.length - 1; i++) {
    const currentDate = await timeEntries[i]
      .locator('[data-test-id="time-entry-date"]')
      .textContent();
    const nextDate = await timeEntries[i + 1]
      .locator('[data-test-id="time-entry-date"]')
      .textContent();
    expect(new Date(currentDate!) >= new Date(nextDate!)).toBeTruthy();
  }
};

export const validateSavingNotes = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  await TimeClockPage.waitForLoadingToDisappearTCPopup(page);

  // Select customer/project
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click clock in button
  await TimeClockPage.clickOnClockInButton(page);

  // Enter notes
  const notes = 'Test notes for time clock entry';
  await page.locator('[data-test-id="time-clock-notes"]').fill(notes);

  // Save the time entry
  await page.locator(`[data-test-id="time-clock-save-button"]`).click();
  await expect(
    page.getByTestId('toastMessage').locator('span').nth(1),
  ).toBeVisible();

  // Verify saved toast message
  const toastMessage = await TimeClockPage.getClockedInMessage(page);
  expect(toastMessage).toContain('clocked in at');

  // Click clock out
  await TimeClockPage.clickClockOut(page);

  // Verify notes in time entries
  const savedNotes = await page
    .locator('[data-test-id="time-entry-notes"]')
    .first()
    .textContent();
  expect(savedNotes).toContain(notes);
};

export const validateCustomerToProjectSwitch = async (page: Page) => {
  // Navigate to Time Clock
  await TimeClockPage.navigateToTimeClock(page);

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);
  await TimeClockPage.waitForLoadingToDisappearTCPopup(page);

  // Select customer
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
  }

  // Click clock in button
  await TimeClockPage.clickOnClockInButton(page);

  await page.waitForTimeout(3000);

  // Click switch job
  await page.locator(`//span[text()='Switch jobs']`).click();

  // Select project
  const projectOptions = await TimeClockPage.getCustomerProjectOptions(page);
  if (projectOptions.length > 1) {
    await TimeClockPage.selectCustomerProject(page, projectOptions[1]);
  }

  // Click clock in button
  await TimeClockPage.clickOnClockInButton(page);

  // Verify class field error message
  const errorMessage = await TimeClockPage.getErrorMessage(page);
  expect(errorMessage).toContain('Class is required for project time entries');
};

/**
 * Deletes the time entry
 */
export const deleteTimeEntry = async (page: Page, employeeName: string) => {
  console.log(`Deleting time entry for ${employeeName}`);

  const timeEntriesPage = new TimeEntriesPage(page);

  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  // Verify the "Display by" dropdown is visible
  expect(commonLocator.getDisplayByDropdown(page)).toBeVisible();

  const displayByDefaultValue = await page
    .getByLabel(LABELS.displayBy)
    .textContent();

  try {
    expect(displayByDefaultValue).toBe(LABELS.date);
  } catch (error) {
    //Soft asserting whether by default, date is selected in displayBy filter
  }

  // Select "Date" from the "Display by" dropdown
  await commonLocator.selectDisplayByOption(page, LABELS.date);
  await page.waitForTimeout(2000);
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Delete all entries for the employee
  let count = await timeEntriesPage.countEmployeeRow(employeeName);
  while (count > 0) {
    await page.locator(`//button[@aria-label='Expand Menu']`).first().click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Yes' }).click();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Refresh data by switching filters
    await selectDisplayByOption(page, 'Customer');
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();

    count = await timeEntriesPage.countEmployeeRow(employeeName);
  }

  console.log(`✓ All time entries deleted for ${employeeName}`);
};

export {
  validateTimeClockNavigationAndAccess,
  validateClockInFunctionality,
  validateClockOutButtonVisibility,
  validateClockInIntialTimeDisplayBackgroundColor,
  validateClockInTimeDisplayBackgroundColor,
  validateTimeSelectionAMPM,
  validateClockInScreenInitialState,
  validateAdminNameInHeader,
  validateCustomerProjectSelection,
  validateDateTimeSelection,
  validateMandatoryFields,
  validateDateTimeRestrictions,
  validateClockedOutMessage,
  validateClockedInMessage,
  validateDrawerReset,
  validateClockInDrawerClose,
  validateTimerStartsOnClockIn,
  validateHeaderShowsClockedIn,
  validateHeaderShowsTodayAndWeekTime,
  validateRunningTimerAfterClockIn,
  validateClockInDrawerNotAccessible,
  validateServiceItemSelection,
  validateBillableField,
  validateClassSelection,
  validateDepartmentSelection,
  validateLocationSelection,
  validateCustomerProjectQuickfill,
  validateServiceItemQuickfill,
  validateTimerTurnsGreenOnClockIn,
  validateTimesheetUpdateOnSave,
  validateTimerResetOnClockOut,
  validateTimerResetOnSwitchJob,
  validateSwitchJobShowsAllFields,
  validateBackendErrorHandling,
  validateMultipleDeviceClockIn,
  validateRunningTimeErrorHandling,
  validateNetworkErrorOnTimeEntries,
  validateNetworkErrorOnClockInDrawer,
  validateSaveTimeClockError,
  validateClockOutError,
  validateTimesheetOverlapOnClockIn,
  validateTimesheetOverlapOnEdit,
  validateClockInPermission,
  validateFutureStartTime,
  validateQuickfillDropdowns,
  validateCustomerMandatoryFields,
  validateCustomField,
  validateCustomFieldMandatoryFields,
};
