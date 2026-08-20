import { expect, Page, test } from '@playwright/test';
import {
  getWeeklyValidationsLoginData,
  getWeeklyFeaturesLoginData,
  getWeeklyLoginData,
} from '../../logins';
import { openQBO, openQBOTT } from '../../pages/QBOLogin';
import { WeeklyTimeActivity } from '../../pages/WeeklyTimeActivity';
import { overridePlugin } from '../../plugin/overridePlugin';
import { WeeklyTimeUtils } from './WeeklyTimeUtils';
import {
  LABELS,
  NOTES_TEXT,
  USER_ROLES,
  USERS_TIME_ACTIVITY_NOTAPPLICABLE,
  USERS_TIME_ACTIVITY_DRAWER_APPLICABLE,
  USERS_BILL_RATE_NOTAPPLICABLE,
  USERS_TIME_ACTIVITY_NOTCUSTOMER_APPLICABLE,
  USERS_TIME_ACTIVITY_NOTEMP_APPLICABLE,
  USERS_TIME_ACTIVITY_NOTCLASS_APPLICABLE,
  USERS_TIME_ACTIVITY_NOTLOCATION_APPLICABLE,
  USERS_TIME_ACTIVITY_NOTSERVICE_APPLICABLE,
  USERS_HAVE_NO_ACCESS_TO_UPDATE_QBO_SETTINGS,
  USERS_TIME_ACTIVITY_PAYTYPE_NOTVISIBLE,
  USERS_TIME_ACTIVITY_LOCATION_NOT_VISIBLE,
  USERS_TIME_ACTIVITY_CLASS_NOT_VISIBLE,
  USERS_TIME_ACTIVITY_NEW_EMP_CREATE_ACCESS_DENIED,
} from '../../utils';
import DashboardPage from '../../pages/DashboardPage';
import {
  matchTimeEntryBatchSaveResponse,
  OIGQL_URL_PATTERN,
  waitForResponseWithURLandBodyWTA,
} from '../../pages/TimeTrowser';

const getPromisePayloadResponse = (page: Page) => {
  const createMutationPromise = waitForResponseWithURLandBodyWTA(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );
  return createMutationPromise;
};

const weeklyTANameFieldAddEmployeeVendor = async (
  page: Page,
  scenario: string,
) => {
  const weeklyTimeUtils = new WeeklyTimeUtils(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  // Create  a new employee for Weekly TA
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  await weeklyTimeActivity.selectAddNewOptionFromDropDown();

  await weeklyTimeActivity.checkEmployeeDrawerDisplayed();

  await weeklyTimeActivity.selectContactType('Employee');

  const employeeName =
    await weeklyTimeActivity.fillMandatoryFieldsForEmployee();

  await weeklyTimeActivity.clickOnEmployeeDialogSaveButton();

  await weeklyTimeActivity.waitUntilEmployeeDrawerDialogClosed();

  await weeklyTimeActivity.validateGivenNameDisplayedUnderNameLabel(
    employeeName,
  );

  await page.waitForTimeout(5000);

  await weeklyTimeUtils.fillOutRowSpecificJobDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
      customDropDownVal: 2,
      Duration: '1:00',
    },
    scenario,
  );

  // click save
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  await weeklyTimeActivity.navigateToWeeklyTime();

  // Now create a new vendor
  await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);

  await weeklyTimeActivity.selectAddNewOptionFromDropDown();

  await weeklyTimeActivity.checkEmployeeDrawerDisplayed();

  await weeklyTimeActivity.selectContactType('Vendor');

  await weeklyTimeActivity.validateVendorDialog();

  const companyName = await weeklyTimeActivity.fillMandatoryFieldsForVendor();

  await weeklyTimeActivity.clickOnVendorSaveButton();

  await weeklyTimeActivity.waitUntilVendorDrawerDialogClosed();

  await weeklyTimeActivity.validateGivenNameDisplayedUnderNameLabel(
    companyName,
  );

  await weeklyTimeUtils.fillOutRowSpecificJobDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes Vendor One',
      RowNo: 1,
      customDropDownVal: 2,
      Duration: '1:00',
    },
    scenario,
  );

  // click save
  await weeklyTimeActivity.clickButton(LABELS.Save);
  // await weeklyTimeActivity.validateSuccessToast();

  console.log('Testcase for new employee and Vendor Weekly TA completed');
};

const weeklyTAClassFieldAddNew = async (page: Page, scenario: string) => {
  const weeklyTimeUtils = new WeeklyTimeUtils(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  // Create  a new employee for Weekly TA
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);

  await weeklyTimeActivity.clickDropdownOption();

  await page.waitForTimeout(3000);

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  // now add the customer
  await weeklyTimeActivity.openRowDropdown(LABELS.Customers, 1);
  await weeklyTimeActivity.clickCustomDropdownOption(2);

  // Now add the class name
  if (await weeklyTimeActivity.isVisibile(LABELS.Class, 1)) {
    await weeklyTimeActivity.openRowDropdown(LABELS.Class, 1);
    await weeklyTimeActivity.selectAddNewOptionFromDropDown();
    await weeklyTimeActivity.checkClassDialogDrawerDisplayed();
    const className = await weeklyTimeActivity.addNewClassName();
    await weeklyTimeActivity.clickOnClassDrawerSaveButton();
    await weeklyTimeActivity.waitUntilClassDrawerDialogClosed();
    await page.waitForTimeout(2000);
    await weeklyTimeActivity.validateGivenClassDisplayedUnderClassLabel(
      LABELS.Class,
      className,
    );
    await page.waitForTimeout(3000);
    await weeklyTimeActivity.isVisibile(LABELS.Class, 1);
    await weeklyTimeActivity.openRowDropdown(LABELS.Class, 1);
    let isVisible =
      await weeklyTimeActivity.checkNewlyAddedOptionDisplayedUnderDropdown(
        className,
      );
    if (!isVisible) {
      await page.waitForTimeout(3000);
      await weeklyTimeActivity.openRowDropdown(LABELS.Class, 1);
      let isVisible =
        await weeklyTimeActivity.checkNewlyAddedOptionDisplayedUnderDropdown(
          className,
        );
    }
  }
  // click Cancel
  await weeklyTimeActivity.clickOnCancelButton();
  await weeklyTimeActivity.clickOnYesButton();

  console.log('Testcase for new class added Weekly TA completed');
};

const weeklyTAClassFieldClear = async (page: Page, scenario: string) => {
  const weeklyTimeUtils = new WeeklyTimeUtils(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  // Create  a new employee for Weekly TA
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  if (scenario !== USER_ROLES.timeTrackOnly) {
    await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);

    await weeklyTimeActivity.clickDropdownOption();

    await page.waitForTimeout(2000);
  }

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  // Now clear the class name
  if (await weeklyTimeActivity.isVisibile(LABELS.Class, 1)) {
    await weeklyTimeActivity.openRowDropdown(LABELS.Class, 1);
    await weeklyTimeActivity.emptyFieldData(LABELS.Class, 1);
    await page.waitForTimeout(1000);
    await weeklyTimeActivity.validateGivenClassDisplayedUnderClassLabel(
      LABELS.Class,
      '',
    );
  }

  // click save
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  console.log('Testcase for class selected cleared in Weekly TA completed');
};

const weeklyTACustomerFieldClear = async (page: Page, scenario: string) => {
  const weeklyTimeUtils = new WeeklyTimeUtils(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  // Create  a new employee for Weekly TA
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);

  await weeklyTimeActivity.clickDropdownOption();

  await page.waitForTimeout(5000);

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  // Now clear the customer field
  await weeklyTimeActivity.openRowDropdown(LABELS.Customers, 1);
  await page.waitForTimeout(1000);
  await weeklyTimeActivity.emptyFieldData(LABELS.Customers, 1);

  // click save
  await page.waitForTimeout(5000);
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await page.waitForTimeout(5000);
  await weeklyTimeActivity.validateErrorMessageDisplayed();

  // Coming out of that case
  await weeklyTimeActivity.clickOnCancelButton();
  await weeklyTimeActivity.clickOnYesButton();

  console.log(
    'Testcase for customer cleared in Weekly TA throws error completed',
  );
};

const weeklyTALocationFieldClear = async (page: Page, scenario: string) => {
  const weeklyTimeUtils = new WeeklyTimeUtils(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  // Create  a new employee for Weekly TA
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();
  if (scenario !== USER_ROLES.timeTrackOnly) {
    await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);

    await weeklyTimeActivity.clickDropdownOption();

    await page.waitForTimeout(1000);
  }

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  // Now clear the customer field
  await weeklyTimeActivity.openRowDropdown(LABELS.Location, 1);
  await weeklyTimeActivity.emptyFieldData(LABELS.Location, 1);

  // click save
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  console.log(
    'Testcase for Location cleared in Weekly TA throws error completed',
  );
};

const weeklyTAServiceFieldClear = async (page: Page, scenario: string) => {
  const weeklyTimeUtils = new WeeklyTimeUtils(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  // Create  a new employee for Weekly TA
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();
  if (scenario !== USER_ROLES.timeTrackOnly) {
    await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);

    await weeklyTimeActivity.clickDropdownOption();

    await page.waitForTimeout(1000);
  }

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  // now update the service field to Sales
  await weeklyTimeActivity.openRowDropdown(LABELS.Service, 1);
  await weeklyTimeActivity.clickCustomDropdownOnGivenOption('Sales');
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  // Now clear the customer field
  await weeklyTimeActivity.openRowDropdown(LABELS.Service, 1);
  await weeklyTimeActivity.emptyFieldData(LABELS.Service, 1);
  await page.waitForTimeout(5000);
  // click save
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  console.log(
    'Testcase for Service cleared in Weekly TA throws error completed',
  );
};

const weeklyTAPayTypeSelectedDisplayed = async (
  page: Page,
  scenario: string,
) => {
  const weeklyTimeUtils = new WeeklyTimeUtils(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  // Create  a new employee for Weekly TA
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);

  await weeklyTimeActivity.clickDropdownOption();

  await page.waitForTimeout(1000);

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  // now update the PayTypes
  await weeklyTimeActivity.openRowDropdown(LABELS.PayType, 1);
  await weeklyTimeActivity.clickDropdownOption(0);

  // await weeklyTimeActivity.clickCustomDropdownOnGivenOption('Overtime Pay');

  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  await weeklyTimeActivity.validateOptionDisplayedUnderGivenLabelNotNone(
    LABELS.PayType,
  );

  console.log(
    'Testcase for Pay type selected in Weekly TA throws error completed',
  );
};

const weeklyTAUpdateTeamMemberWithoutSavingSwitchToOtherTeamMember = async (
  page: Page,
  scenario: string,
) => {
  const weeklyTimeUtils = new WeeklyTimeUtils(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  // Create  a new employee for Weekly TA
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);

  await weeklyTimeActivity.clickDropdownOption();

  await page.waitForTimeout(2000);

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  if (!USERS_TIME_ACTIVITY_LOCATION_NOT_VISIBLE.split(',').includes(scenario)) {
    await weeklyTimeActivity.openRowDropdown(LABELS.Location, 1);
    await weeklyTimeActivity.clickCustomDropdownOption(4);
  } else {
    await weeklyTimeActivity.openRowDropdown(LABELS.Customer, 1);
    await weeklyTimeActivity.clickCustomDropdownOption(4);
  }

  await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);

  await weeklyTimeActivity.clickCustomDropdownOption(3);

  // to validate the pop up is displayed
  await weeklyTimeActivity.validatePopupDisplayedWhenNoChangesSaved(
    LABELS.switchUserYouLostTheData,
  );

  await weeklyTimeActivity.clickOnYesButton();

  console.log(
    'Testcase for Pay type selected in Weekly TA throws error completed',
  );
};

const weeklyTAChangeWeekDateWithoutSavingChanges = async (
  page: Page,
  scenario: string,
) => {
  const weeklyTimeUtils = new WeeklyTimeUtils(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  // Create  a new employee for Weekly TA
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();
  if (scenario !== USER_ROLES.timeTrackOnly) {
    await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);

    await weeklyTimeActivity.clickDropdownOption();

    await page.waitForTimeout(2000);
  }

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  // if (!USERS_TIME_ACTIVITY_LOCATION_NOT_VISIBLE.split(',').includes(scenario)) {
  //  await weeklyTimeActivity.openRowDropdown(LABELS.Location, 1);
  //  await weeklyTimeActivity.clickCustomDropdownOption(3);
  // } else {
  await weeklyTimeActivity.openRowDropdown(LABELS.Customer, 1);
  await weeklyTimeActivity.clickCustomDropdownOption(5);
  // }

  await weeklyTimeActivity.selectWeekDropdown(LABELS.SelectWeek, 1);

  // to validate the pop up is displayed
  await weeklyTimeActivity.validatePopupDisplayedWhenNoChangesSaved(
    LABELS.switchWeekYouLostTheData,
  );

  await weeklyTimeActivity.clickOnYesButton();

  console.log(
    'Testcase for pop up validation when changes are saved while switching to different week in Weekly TA throws error completed',
  );
};

const weeklyTAValidateFirstDayOfWeek = async (page: Page, scenario: string) => {
  const weeklyTimeUtils = new WeeklyTimeUtils(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);
  const dashboardPage = new DashboardPage(page);

  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  // now get the first display of the weekday
  const beforeUpdate =
    await weeklyTimeActivity.getFirstDayOfWeekDisplayedOnHeader();

  await dashboardPage.navigateToAccountAndSettingsTime();

  await dashboardPage.updateFirstDayOfWorkWeek('Wednesday');

  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  await weeklyTimeActivity.refreshScreen();

  const afterUpdate =
    await weeklyTimeActivity.getFirstDayOfWeekDisplayedOnHeader();

  // reverting back to initial state
  await dashboardPage.navigateToAccountAndSettingsTime();
  await page.waitForTimeout(3000);
  await dashboardPage.updateFirstDayOfWorkWeek('Sunday');

  await page.waitForTimeout(5000);

  if (afterUpdate !== beforeUpdate && afterUpdate?.includes('Wed')) {
    expect(true).toBeTruthy();
  } else {
    expect(afterUpdate).toContain('Sun');
    expect(afterUpdate).not.toEqual(beforeUpdate);
  }
  console.log(
    'Testcase for pop up validation when changes are saved while switching to different week in Weekly TA throws error completed',
  );
};

const validateNoAccessQBOSettingsPermissions = async (
  page: Page,
  scenario: string,
) => {
  const weeklyTimeActivity = new WeeklyTimeActivity(page);
  const dashboardPage = new DashboardPage(page);

  await dashboardPage.navigateToAccountAndSettingsAdvanced();
  await weeklyTimeActivity.validateDontHavePermissionToupdateCompanySettings();
};

const weeklyTAValidateCurrencyUpdate = async (page: Page, scenario: string) => {
  const weeklyTimeUtils = new WeeklyTimeUtils(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);
  const dashboardPage = new DashboardPage(page);

  await weeklyTimeActivity.navigateToWeeklyTime();

  // now get the first display of the weekday
  const beforeUpdate =
    await weeklyTimeActivity.getBillableAmountWithCurrencySymbol();

  await dashboardPage.navigateToAccountAndSettingsAdvanced();

  await dashboardPage.updateCurrencyFromAccountAndSettings(
    LABELS.CurrencyUpdate,
  );

  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  const afterUpdate =
    await weeklyTimeActivity.getBillableAmountWithCurrencySymbol();

  // reverting back to initial state
  await dashboardPage.navigateToAccountAndSettingsAdvanced();

  await dashboardPage.updateCurrencyFromAccountAndSettings(LABELS.CurrencyUS);

  await page.waitForTimeout(5000);
  if (
    afterUpdate !== beforeUpdate &&
    afterUpdate?.includes(LABELS.CurrencySymbolUpdateDisplayed)
  ) {
    expect(true).toBeTruthy();
  } else {
    expect(false).toEqual(true);
    expect(afterUpdate).toContain(LABELS.CurrencySymbolUpdateDisplayed);
    expect(afterUpdate).not.toEqual(beforeUpdate);
  }

  console.log('Testcase for validation of currency updated completed');
};

const weeklyTAValidateEmptyFormToFilledFormTransform = async (
  page: Page,
  scenario: string,
) => {
  const weeklyTimeUtils = new WeeklyTimeUtils(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  // Create  a new employee for Weekly TA
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  if (scenario !== USER_ROLES.timeTrackOnly) {
    await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);

    await weeklyTimeActivity.clickDropdownOption();

    await page.waitForTimeout(1000);
  }

  // to clear all the data
  await weeklyTimeActivity.clickButton(LABELS.ClearAllLines);

  // fetch the week date
  const currentWeek = await weeklyTimeActivity.getGivenFieldValueDisplayed(
    LABELS.SelectWeek,
  );

  await weeklyTimeUtils.fillOutRowSpecificJobDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
      customDropDownVal: 2,
      Duration: '1:00',
    },
    scenario,
  );

  // click save
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  // get the total value displayed
  const beforeUpdateTotal = await weeklyTimeActivity.getTotalDisplayed();

  const numberOfDurationFields =
    await weeklyTimeActivity.getNumberOfDurationDisplayedForRow(1);

  await weeklyTimeActivity.selectWeekDropdown(LABELS.SelectWeek, 1);

  await page.waitForTimeout(2000);

  if (!(await weeklyTimeActivity.checkATARowIsEmpty(1))) {
    await page.getByRole('button', { name: 'Clear all lines' }).click();
    await weeklyTimeActivity.clickButton(LABELS.Save);
  }

  await weeklyTimeActivity.clickSettingsIcon();

  if (numberOfDurationFields > 1) {
    await weeklyTimeActivity.columnSelectionDeSelectionLogicForDuration(
      LABELS.DeSelectWeekDays,
    );
  }

  await weeklyTimeActivity.openRowDropdown(LABELS.SelectWeek, 1);

  await weeklyTimeActivity.clickCustomDropdownOnGivenOption(currentWeek || '');

  await page.waitForTimeout(2000);

  const afterUpdateTotal = await weeklyTimeActivity.getTotalDisplayed();

  const numberOfDurationFieldsAfter =
    await weeklyTimeActivity.getNumberOfDurationDisplayedForRow(1);

  expect(numberOfDurationFields).toBeGreaterThan(numberOfDurationFieldsAfter);

  await weeklyTimeActivity.clickSettingsIcon();

  await weeklyTimeActivity.columnSelectionDeSelectionLogicForDuration(
    LABELS.DeSelectWeekDays,
  );

  expect(beforeUpdateTotal).toBe(afterUpdateTotal);

  console.log(
    'Testcase for validating non filled forms to filled forms by updating the weekdays completed',
  );
};

const weeklyTAValidateWeekSelectedInCurrentDateWeek = async (
  page: Page,
  scenario: string,
) => {
  const weeklyTimeUtils = new WeeklyTimeUtils(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);
  const dashboardPage = new DashboardPage(page);

  await weeklyTimeActivity.navigateToWeeklyTime();

  // now get the first display of the weekday
  await weeklyTimeActivity.validateCurrentWeekSelectedIsInCurrentDate();

  // click on the select a week dropdown
  await weeklyTimeActivity.openRowDropdown(LABELS.SelectWeek, 1);

  // get all the options count and validate it
  const count = await weeklyTimeActivity.dropdownOptionsCount();

  expect(count).toBeGreaterThan(6);

  console.log(
    'Testcase for validation of currency date is within the slected date range completed',
  );
};

const weeklyTAValidatePayTypeIsDisabledForVendor = async (
  page: Page,
  scenario: string,
) => {
  const weeklyTimeUtils = new WeeklyTimeUtils(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);
  const dashboardPage = new DashboardPage(page);

  await weeklyTimeActivity.navigateToWeeklyTime();

  await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);

  await weeklyTimeActivity.clickCustomDropdownOnGivenOption('Vendor');

  // validate that the paytype is disabled or not visibile
  const status = await weeklyTimeActivity.isPayTypeDisabled(LABELS.PayType, 1);

  const visibleStatus = await weeklyTimeActivity.isVisibile(LABELS.PayType, 1);

  if (!status && visibleStatus) {
    expect(false).toBeTruthy();
  } else {
    expect(true).toBeTruthy();
  }

  console.log(
    'Testcase for validation of Pay Type should be disabled completed',
  );
};

const weeklyTAValidatePrintContent = async (page: Page, scenario: string) => {
  const weeklyTimeActivity = new WeeklyTimeActivity(page);
  const weeklyTimeUtils = new WeeklyTimeUtils(page);

  await weeklyTimeActivity.navigateToWeeklyTime();

  if (scenario !== USER_ROLES.timeTrackOnly) {
    await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);

    await weeklyTimeActivity.clickDropdownOption();

    await page.waitForTimeout(2000);
  }

  // to clear all the data
  await weeklyTimeActivity.clickButton(LABELS.ClearAllLines);

  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
    },
    scenario,
  );

  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  const [printPage] = await Promise.all([
    page.waitForEvent('popup'),
    await page.getByRole('button', { name: 'Print time table' }).click(),
  ]);

  await printPage.waitForLoadState();
};

/***************************************Features and validation test case started*****************************************************/

const weeklyDurationWOEntries = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
) => {
  await weeklyTimeUtils.clearAllWeeklyTARows(page, weeklyTimeActivity);
};

const totalTimeByRow = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  if (!(await weeklyTimeActivity.checkATARowIsEmpty(1))) {
    await page.getByRole('button', { name: 'Clear all lines' }).click();
  }

  await page.waitForTimeout(2000);
  // create one row
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);
  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
    },
    scenario,
  );

  const timeValueFound = await page
    .locator('[data-test-id="weekly-time-table-row"]')
    .filter({ hasText: '7:00' })
    .count();
  if (timeValueFound === 0) {
    // Click settings icon
    await weeklyTimeActivity.clickSettingsIcon();

    // Select all checkboxes
    //const checkboxes = await page.locator('input[type="checkbox"]').all();
    const checkboxes = await page
      .locator(
        `//div[contains(@class,'SettingsCheckboxes')]/descendant::input[@type='checkbox']`,
      )
      .all();
    for (const checkbox of checkboxes) {
      if (!(await checkbox.isChecked())) {
        await checkbox.setChecked(true);
      }
      await page.waitForTimeout(2000);
    }
    await weeklyTimeActivity.clickButton(LABELS.SaveSettings);
    // Wait for changes to take effect
    await page.waitForTimeout(2000);
    weeklyTimeActivity.enterDuration(1);

    // Verify the time value again
    await expect(
      page.locator('[data-test-id="weekly-time-table-row"]'),
    ).toContainText('7:00');
  } else {
    // Original assertion if time value is found
    await expect(
      page.locator('[data-test-id="weekly-time-table-row"]'),
    ).toContainText('7:00');
  }

  if (!USERS_BILL_RATE_NOTAPPLICABLE.split(',').includes(scenario)) {
    const headerText = await page.locator('thead').textContent();
    expect(
      headerText?.includes('$14.00') || headerText?.includes('₹14.00'),
    ).toBeTruthy();
  } else {
    await expect(page.locator('thead')).toContainText('7:00');
  }
};

const totalTimeByTableBillable = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  if (!(await weeklyTimeActivity.checkATARowIsEmpty(1))) {
    await page.getByRole('button', { name: 'Clear all lines' }).click();
  }
  // create one row
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);
  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
      IsAlternateDuration: true,
      DurationStart: 1,
      Duration: '2:00',
    },
    scenario,
  );
  if (await weeklyTimeActivity.isExpandRowIconVisible(2)) {
    await weeklyTimeActivity.expandRow(2);
  }
  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes Two',
      RowNo: 2,
      Duration: '2:00',
    },
    scenario,
  );
  await expect(page.locator('thead')).toContainText('20:00');
  if (!USERS_BILL_RATE_NOTAPPLICABLE.split(',').includes(scenario)) {
    const headerText = await page.locator('thead').textContent();
    expect(
      headerText?.includes('$40.00') || headerText?.includes('₹40.00'),
    ).toBeTruthy();
  }
};

const totalTimeByTable = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  if (!(await weeklyTimeActivity.checkATARowIsEmpty(1))) {
    await page.getByRole('button', { name: 'Clear all lines' }).click();
  }
  // create one row
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);
  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
    },
    scenario,
  );
  if (await weeklyTimeActivity.isExpandRowIconVisible(2)) {
    await weeklyTimeActivity.expandRow(2);
  }
  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes Two',
      RowNo: 2,
      Duration: '2:00',
    },
    scenario,
  );
  await expect(page.locator('thead')).toContainText('21:00');
  if (!USERS_BILL_RATE_NOTAPPLICABLE.split(',').includes(scenario)) {
    const headerText = await page.locator('thead').textContent();
    expect(
      headerText?.includes('$42.00') || headerText?.includes('₹42.00'),
    ).toBeTruthy();
  }
};

const totalTimeByRowBillable = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  if (!(await weeklyTimeActivity.checkATARowIsEmpty(1))) {
    await page.getByRole('button', { name: 'Clear all lines' }).click();
  }

  await page.waitForTimeout(2000);
  await page.waitForLoadState();
  // create one row
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);
  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
      IsAlternateDuration: true,
      DurationStart: 1,
      Duration: '1:00',
    },
    scenario,
  );
  // await expect(page.locator("thead")).toContainText("3:00");
  // await expect(page.locator("thead")).toContainText("$6.00");
  await expect(
    page.locator('[data-test-id="weekly-time-table-row"]'),
  ).toContainText('3:00');
  if (!USERS_BILL_RATE_NOTAPPLICABLE.split(',').includes(scenario)) {
    const headerText = await page
      .locator('[data-test-id="weekly-time-table-row"]')
      .textContent();
    expect(
      headerText?.includes('$6.00') || headerText?.includes('₹6.00'),
    ).toBeTruthy();
  }
};

const copyTimesheet = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  await page.waitForTimeout(5000);

  await weeklyTimeActivity.getName();

  if (!(await weeklyTimeActivity.checkATARowIsEmpty(1))) {
    await page.getByRole('button', { name: 'Clear all lines' }).click();
  }

  // Check if duration is empty for row 2 and 3, if so, uncheck billable
  for (const row of [2, 3]) {
    const isDurationEmpty = await weeklyTimeActivity.isDurationRowsEmpty(row);
    if (isDurationEmpty) {
      const isBillableChecked = await weeklyTimeActivity.isChecked(
        row,
        LABELS.Billable,
      );
      if (isBillableChecked) {
        await weeklyTimeActivity.unCheckInputCheckbox(row, LABELS.Billable);
      }
    }
  }

  await page.waitForTimeout(2000);
  await page.waitForLoadState();
  // create one row
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);
  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
    },
    scenario,
  );

  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
  await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

  await page.waitForTimeout(2000);
  // await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);
  await weeklyTimeActivity.selectWeekDropdown(LABELS.SelectWeek, 1);
  if (
    await page.getByTestId('ModalDialog--wrapper').isVisible({ timeout: 20000 })
  ) {
    await page.getByRole('button', { name: 'Yes' }).click();
  }

  // Check if duration is empty for row 2 and 3, if so, uncheck billable
  for (const row of [2, 3]) {
    const isDurationEmpty = await weeklyTimeActivity.isDurationRowsEmpty(row);
    if (isDurationEmpty) {
      const isBillableChecked = await weeklyTimeActivity.isChecked(
        row,
        LABELS.Billable,
      );
      if (isBillableChecked) {
        await weeklyTimeActivity.unCheckInputCheckbox(row, LABELS.Billable);
      }
    }
  }

  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
    },
    scenario,
  );

  await page.getByRole('button', { name: 'Copy last timesheet' }).click();

  await expect(weeklyTimeActivity.findNotes(1)).toContainText(
    'Random Notes One',
  );

  await weeklyTimeActivity.durationHaveTextValue(1);
};

const copyTimesheetOverwrite = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  if (!(await weeklyTimeActivity.checkATARowIsEmpty(1))) {
    await page.getByRole('button', { name: 'Clear all lines' }).click();
  }
  await page.waitForTimeout(2000);
  await page.waitForLoadState();

  // create one row
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);
  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
      Duration: '2:00',
    },
    scenario,
  );

  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  await weeklyTimeActivity.selectWeekDropdown(LABELS.SelectWeek, 1);
  if (await page.getByTestId('ModalDialog--wrapper').isVisible()) {
    await page.getByRole('button', { name: 'Yes' }).click();
  }

  // await weeklyTimeActivity.selectWeekDropdown(LABELS.SelectWeek, -1);

  // create one row
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);
  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
    },
    scenario,
  );

  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  await weeklyTimeActivity.selectWeekDropdown(LABELS.SelectWeek, 1);

  await page.waitForTimeout(2000);
  await page.waitForLoadState();
  //
  await page.getByRole('button', { name: 'Copy last timesheet' }).click();
  await (
    await page.waitForSelector('[data-testid="ModalDialog"]', {
      timeout: 5000,
    })
  ).isVisible();
  await page
    .getByTestId('ModalDialog')
    .getByRole('button', { name: 'Overwrite' })
    .click();

  await page.waitForTimeout(2000);
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  await weeklyTimeActivity.validateDurationTextValue(1, '2:00');

  // await weeklyTimeActivity.durationHaveTextValue(1);

  //
};

const copyTimesheetAdd = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  if (!(await weeklyTimeActivity.checkATARowIsEmpty(1))) {
    await page.getByRole('button', { name: 'Clear all lines' }).click();
  }
  await page.waitForTimeout(2000);
  await page.waitForLoadState();
  // create one row
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);
  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
    },
    scenario,
  );
  await page.waitForTimeout(2000);
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  await weeklyTimeActivity.selectWeekDropdown(LABELS.SelectWeek, 1);

  if (await page.getByTestId('ModalDialog--wrapper').isVisible()) {
    await page.getByRole('button', { name: 'Yes' }).click();
  }

  if (!(await weeklyTimeActivity.checkATARowIsEmpty(1))) {
    await page.getByRole('button', { name: 'Clear all lines' }).click();
  }

  // await weeklyTimeActivity.selectWeekDropdown(LABELS.SelectWeek, -1);

  // create one row
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);
  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
    },
    scenario,
  );
  await page.waitForTimeout(2000);
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  await weeklyTimeActivity.selectWeekDropdown(LABELS.SelectWeek, 1);

  await page.waitForTimeout(2000);
  await page.waitForLoadState();
  //
  await page.getByRole('button', { name: 'Copy last timesheet' }).click();

  await (
    await page.waitForSelector('[data-testid="ModalDialog"]', {
      timeout: 5000,
    })
  ).isVisible();

  await page
    .getByTestId('ModalDialog')
    .getByRole('button', { name: 'Add' })
    .click();
  await page.waitForTimeout(2000);
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();
  weeklyTimeActivity.durationHaveTextValue(2);
  await expect(weeklyTimeActivity.findNotes(1)).not.toBeEmpty();
  await expect(weeklyTimeActivity.findNotes(2)).not.toBeEmpty();
};

const copyTimesheetNoPreviousData = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  if (!(await weeklyTimeActivity.checkATARowIsEmpty(1))) {
    await page.getByRole('button', { name: 'Clear all lines' }).click();
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();
  }
  await page.waitForTimeout(2000);
  await weeklyTimeActivity.selectWeekDropdown(LABELS.SelectWeek, 1);

  await page.waitForTimeout(2000);
  await page.waitForLoadState();
  if (!(await weeklyTimeActivity.checkATARowIsEmpty(1))) {
    await page.getByRole('button', { name: 'Clear all lines' }).click();
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();
  }

  await page.getByRole('button', { name: 'Copy last timesheet' }).click();
  await page.getByTestId('WeeklyTimeHOCErrorPageMessage').isVisible();
};

const copyTimesheetTeamMemberRequired = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);
  await page.waitForTimeout(5000);
  await weeklyTimeActivity.selectWeekDropdown(LABELS.SelectWeek, 1);
  weeklyTimeActivity.containsWeekDay('');

  // await page.getByLabel('Select name').click();
  await page
    .locator('label')
    .filter({ hasText: 'Name' })
    .locator('svg')
    .click();
  await page.waitForTimeout(5000);

  await page.getByLabel('Select name').fill('');

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);
  await weeklyTimeActivity.locatorEnabled(LABELS.PayType, 1);

  await page.getByRole('button', { name: 'Copy last timesheet' }).click();
  await page.waitForTimeout(5000);
  weeklyTimeActivity.requireFieldValidation(LABELS.SelectName);
  weeklyTimeActivity.validateErrorMessageDisplayed();
};

const billableRequiredField = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
    },
    scenario,
  );
  if (!USERS_BILL_RATE_NOTAPPLICABLE.split(',').includes(scenario)) {
    await (await weeklyTimeActivity.billRate(1)).fill('');
    await weeklyTimeActivity.clickButton(LABELS.Save);

    weeklyTimeActivity.requireFieldValidation(LABELS.Billable);
    weeklyTimeActivity.validateErrorMessageDisplayed();
  } else {
    await weeklyTimeActivity.clickButton(LABELS.Save);
  }
};

const hoverBillableIconOnRow = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  // await weeklyTimeActivity.expandRow(1);

  const billableIcon = await weeklyTimeActivity.billableIconTooltip(1);
  await billableIcon.hover();
  await page.getByTestId('undefined__tooltipOuterContainer').isVisible();
};

const weeklyTaNotes = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  const isBillableChecked = await weeklyTimeActivity.isChecked(
    1,
    LABELS.Billable,
  );
  if (isBillableChecked) {
    await page.getByRole('button', { name: 'Clear all lines' }).click();
    await weeklyTimeActivity.clickButton(LABELS.Save);
  }

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
    },
    scenario,
  );
  // click save
  const createMutationPromise = getPromisePayloadResponse(page);

  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  // verify response
  const createMutationPromisePayload = await createMutationPromise;
  await weeklyTimeActivity.validateResponse(createMutationPromisePayload);

  await weeklyTimeActivity.navigateToWeeklyTime(
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  );

  await expect(weeklyTimeActivity.findNotes(1)).toContainText(
    'Random Notes One',
  );
};

const weeklyTaNotesError = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: NOTES_TEXT,
      RowNo: 1,
    },
    scenario,
  );
  // click save
  await weeklyTimeActivity.clickButton(LABELS.Save);

  const exceedLimitMsg = await weeklyTimeActivity.validateMaxlength(1);
  expect(exceedLimitMsg).toBe(true);
};

const unSavedModalNochanges = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  await page.getByRole('banner').getByRole('button', { name: 'Close' }).click();
  await page.locator(`//div[@aria-label="${LABELS.QBO}"]`).isVisible();
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.locator(`//div[@aria-label="${LABELS.QBO}"]`).isVisible();
};

const unSavedModalAfterSave = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  const isBillableChecked = await weeklyTimeActivity.isChecked(
    1,
    LABELS.Billable,
  );
  if (isBillableChecked) {
    await page.getByRole('button', { name: 'Clear all lines' }).click();
    await weeklyTimeActivity.clickButton(LABELS.Save);
  }

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
    },
    scenario,
  );
  // click save
  const createMutationPromise = getPromisePayloadResponse(page);
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  // verify response
  const createMutationPromisePayload = await createMutationPromise;
  await weeklyTimeActivity.validateResponse(createMutationPromisePayload);
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);
  // await page.waitForTimeout(2000);
  await page.getByRole('banner').getByRole('button', { name: 'Close' }).click();
  await page.locator(`//div[@aria-label="${LABELS.QBO}"]`).isVisible();
};

const unSavedModalAfterSaveTMchange = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  const isBillableChecked = await weeklyTimeActivity.isChecked(
    1,
    LABELS.Billable,
  );
  if (isBillableChecked) {
    await page.getByRole('button', { name: 'Clear all lines' }).click();
    await weeklyTimeActivity.clickButton(LABELS.Save);
  }

  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);
  await weeklyTimeActivity.clickCustomDropdownOption(2); // choose first option in drop down
  //await weeklyTimeActivity.clickDropdownOption();

  await weeklyTimeUtils.fillOutRowSpecificDetails(
    weeklyTimeActivity,
    {
      Notes: 'Random Notes One',
      RowNo: 1,
    },
    scenario,
  );
  // click save
  const createMutationPromise = getPromisePayloadResponse(page);
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  // verify response
  const createMutationPromisePayload = await createMutationPromise;
  await weeklyTimeActivity.validateResponse(createMutationPromisePayload);
  await page.waitForTimeout(2000);

  await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);
  await weeklyTimeActivity.clickCustomDropdownOption(2); // choose second option in drop down

  await page.waitForTimeout(2000);
  await page.getByRole('banner').getByRole('button', { name: 'Close' }).click();
  await page.locator(`//div[@aria-label="${LABELS.QBO}"]`).isVisible();

  // await page.getByTestId('ModalDialog').locator('div').nth(2).click();
  // await page.getByRole('button', { name: 'No' }).click();
};

const feedBackModal = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();
  await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

  await page.getByRole('button', { name: 'Feedback' }).click();
  await page.getByRole('textbox', { name: 'Feedback' }).isVisible();
};

const useWeeklyTaNameFieldSearchAndFill = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
) => {
  await weeklyTimeUtils.nameFieldSearchAndFillWithData(
    page,
    weeklyTimeActivity,
  );
};

const useWeeklyTaAddEmployeeFromNameField = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
) => {
  await weeklyTimeUtils.addNewEmployee(page, weeklyTimeActivity);
};

const useWeeklyTaAddEmployeeFromNameFieldAccessDenied = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
) => {
  await weeklyTimeUtils.addNewEmployeeAccessDenied(page, weeklyTimeActivity);
  await expect(page.getByText('Access is denied')).toBeVisible({
    timeout: 30000,
  });
};

const useWeeklyTaNameFieldIsRequired = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  await weeklyTimeUtils.useWeeklyTAEntry(page, weeklyTimeActivity, scenario);
  await weeklyTimeActivity.emptyNameFieldData(LABELS.Name, '');

  if (
    await weeklyTimeActivity
      .getByText(LABELS.switchUserYouLostTheData)
      .isVisible()
  ) {
    await weeklyTimeActivity.clickButton(LABELS.Yes);
  }

  await page.waitForTimeout(2000);
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateNameFieldIsRequire();
};

const useWeeklyTaAddNewCustomer = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  await weeklyTimeUtils.addNewCustomer(page, weeklyTimeActivity, scenario);

  // click save
  const createMutationPromise = getPromisePayloadResponse(page);

  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  // verify response
  const createMutationPromisePayload = await createMutationPromise;
  await weeklyTimeActivity.validateResponse(createMutationPromisePayload);
};

const useWeeklyTaAddNewLocation = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  await weeklyTimeUtils.addNewLocation(page, weeklyTimeActivity, scenario);

  // click save
  const createMutationPromise = getPromisePayloadResponse(page);
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  // verify response
  const createMutationPromisePayload = await createMutationPromise;
  await weeklyTimeActivity.validateResponse(createMutationPromisePayload);
};

const useWeeklyTaAddNewService = async (
  page: Page,
  weeklyTimeUtils: WeeklyTimeUtils,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  await weeklyTimeUtils.addNewService(page, weeklyTimeActivity, scenario);

  // click save
  const createMutationPromise = getPromisePayloadResponse(page);
  await weeklyTimeActivity.clickButton(LABELS.Save);
  await weeklyTimeActivity.validateSuccessToast();

  // verify response
  const createMutationPromisePayload = await createMutationPromise;
  await weeklyTimeActivity.validateResponse(createMutationPromisePayload);
};

/***************************************Features test case started***********************************************/

const WeeklyTAFeaturesTest = async (page: Page, scenario: string) => {
  const company = getWeeklyFeaturesLoginData(scenario); // automation login data here
  scenario == USER_ROLES.timeTrackOnly
    ? await openQBOTT(page, company)
    : await openQBO(page, company);
  await overridePlugin(page);

  const weeklyTimeActivity = new WeeklyTimeActivity(page);
  const weeklyTimeUtils = new WeeklyTimeUtils(page);

  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  if (
    !USERS_TIME_ACTIVITY_NOTAPPLICABLE.split(',').includes(scenario) ||
    scenario == USER_ROLES.timeTrackOnly
  ) {
    //At least one weekday duration required
    await weeklyDurationWOEntries(page, weeklyTimeUtils, weeklyTimeActivity);
    console.log('1');

    //Total time by row
    await totalTimeByRow(page, weeklyTimeUtils, weeklyTimeActivity, scenario);
    console.log('2');

    // Update billable by row
    await totalTimeByTableBillable(
      page,
      weeklyTimeUtils,
      weeklyTimeActivity,
      scenario,
    );
    console.log('3');

    //Total time of table
    await totalTimeByTable(page, weeklyTimeUtils, weeklyTimeActivity, scenario);
    console.log('4');

    //Total billable of table
    await totalTimeByRowBillable(
      page,
      weeklyTimeUtils,
      weeklyTimeActivity,
      scenario,
    );
    console.log('5');

    // Copy last timesheet
    if (scenario !== USER_ROLES.qbAdvancedWithPayrollElite) {
      await copyTimesheet(page, weeklyTimeUtils, weeklyTimeActivity, scenario);
      console.log('6');
    }

    // //Copy last timesheet - Overwrite
    // await copyTimesheetOverwrite(
    //   page,
    //   weeklyTimeUtils,
    //   weeklyTimeActivity,
    //   scenario
    // );
    // console.log('7');

    // //Copy last timesheet - Add
    // await copyTimesheetAdd(page, weeklyTimeUtils, weeklyTimeActivity, scenario);
    // console.log('8');

    // Copy last timesheet - No previous data
    await copyTimesheetNoPreviousData(
      page,
      weeklyTimeUtils,
      weeklyTimeActivity,
      scenario,
    );
    console.log('9');

    if (scenario !== USER_ROLES.timeTrackOnly) {
      // Copy last timesheet - Team member required
      await copyTimesheetTeamMemberRequired(
        page,
        weeklyTimeUtils,
        weeklyTimeActivity,
        scenario,
      );
      console.log('10');
    }

    //Billable - Required Field
    await billableRequiredField(
      page,
      weeklyTimeUtils,
      weeklyTimeActivity,
      scenario,
    );
    console.log('11');

    //Hovering Billable Info Icon
    await hoverBillableIconOnRow(
      page,
      weeklyTimeUtils,
      weeklyTimeActivity,
      scenario,
    );
    console.log('12');

    //Notes
    await weeklyTaNotes(page, weeklyTimeUtils, weeklyTimeActivity, scenario);
    console.log('13');

    // Check weekly TA notes Error
    await weeklyTaNotesError(
      page,
      weeklyTimeUtils,
      weeklyTimeActivity,
      scenario,
    );
    console.log('14');

    // Unsaved changes modal - no fields changed (cancel + x buttons)
    await unSavedModalNochanges(
      page,
      weeklyTimeUtils,
      weeklyTimeActivity,
      scenario,
    );
    console.log('15');

    //Unsaved changes modal - after save
    await unSavedModalAfterSave(
      page,
      weeklyTimeUtils,
      weeklyTimeActivity,
      scenario,
    );
    console.log('16');

    if (scenario !== USER_ROLES.timeTrackOnly) {
      // Unsaved changes modal - Team Member change - after save`

      await unSavedModalAfterSaveTMchange(
        page,
        weeklyTimeUtils,
        weeklyTimeActivity,
        scenario,
      );
      console.log('17');
    }

    // Feedback modal show onclick
    await feedBackModal(page, weeklyTimeUtils, weeklyTimeActivity, scenario);
    console.log('18');
  }
};
/***************************************Features test case ended***********************************************/

/***************************************Validation test case started***********************************************/

const WeeklyTAValidationTest = async (page: Page, scenario: string) => {
  const company = getWeeklyValidationsLoginData(scenario); // automation login data here
  scenario == USER_ROLES.timeTrackOnly
    ? await openQBOTT(page, company)
    : await openQBO(page, company);
  await overridePlugin(page);

  const weeklyTimeActivity = new WeeklyTimeActivity(page);
  const weeklyTimeUtils = new WeeklyTimeUtils(page);

  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  if (
    !USERS_TIME_ACTIVITY_NOTAPPLICABLE.split(',').includes(scenario) ||
    scenario == USER_ROLES.timeTrackOnly
  ) {
    if (scenario !== USER_ROLES.timeTrackOnly) {
      // Name Field TA population
      await useWeeklyTaNameFieldSearchAndFill(
        page,
        weeklyTimeUtils,
        weeklyTimeActivity,
      );
      console.log('19');

      if (
        !USERS_TIME_ACTIVITY_NOTEMP_APPLICABLE.split(',').includes(scenario)
      ) {
        // Name Field Add New
        await useWeeklyTaAddEmployeeFromNameField(
          page,
          weeklyTimeUtils,
          weeklyTimeActivity,
        ); // need fix on assertion
        console.log('20');
      } else {
        if (
          !USERS_TIME_ACTIVITY_NEW_EMP_CREATE_ACCESS_DENIED.split(',').includes(
            scenario,
          )
        ) {
          console.log(`checking name field not to be created ${scenario}`);
          await weeklyTimeActivity.validateAddNewOptionIsNotAvailableForNameField(
            LABELS.Name,
          );
          console.log('20');
        } else {
          console.log(`checking name field not to be created ${scenario}`);
          await useWeeklyTaAddEmployeeFromNameFieldAccessDenied(
            page,
            weeklyTimeUtils,
            weeklyTimeActivity,
          );
          console.log('20');
        }
      }

      // Timefor field required validation
      // await useWeeklyTaNameFieldIsRequired(
      //   page,
      //   weeklyTimeUtils,
      //   weeklyTimeActivity,
      //   scenario
      // );
      console.log('21');

      if (
        !USERS_TIME_ACTIVITY_NOTCUSTOMER_APPLICABLE.split(',').includes(
          scenario,
        )
      ) {
        // Customer add new
        await useWeeklyTaAddNewCustomer(
          page,
          weeklyTimeUtils,
          weeklyTimeActivity,
          scenario,
        );
        console.log('22');
      } else {
        console.log(`Checking Customer field not to be created by ${scenario}`);
        await weeklyTimeActivity.validateAddNewOptionIsNotAvailableForGivenField(
          LABELS.Customer,
        );
        console.log('22');
      }

      if (
        !USERS_TIME_ACTIVITY_NOTLOCATION_APPLICABLE.split(',').includes(
          scenario,
        )
      ) {
        //Location add new
        await useWeeklyTaAddNewLocation(
          page,
          weeklyTimeUtils,
          weeklyTimeActivity,
          scenario,
        );
        console.log('23');
      } else {
        if (
          !USERS_TIME_ACTIVITY_LOCATION_NOT_VISIBLE.split(',').includes(
            scenario,
          )
        ) {
          console.log(`Location field has no add access for ${scenario}`);
          await weeklyTimeActivity.validateAddNewOptionIsNotAvailableForGivenField(
            LABELS.Location,
          );
          console.log('23');
        } else {
          await weeklyTimeActivity.validateGivenFieldNotVisible(
            LABELS.Location,
          );
          console.log('23');
        }
      }

      if (
        !USERS_TIME_ACTIVITY_NOTSERVICE_APPLICABLE.split(',').includes(scenario)
      ) {
        //Service add new
        await useWeeklyTaAddNewService(
          page,
          weeklyTimeUtils,
          weeklyTimeActivity,
          scenario,
        );
        console.log('24');
      } else {
        console.log(`Service field has no add access for ${scenario}`);
        await weeklyTimeActivity.validateAddNewOptionIsNotAvailableForGivenField(
          LABELS.Service,
        );
        console.log('24');
      }

      if (
        !USERS_TIME_ACTIVITY_NOTCLASS_APPLICABLE.split(',').includes(scenario)
      ) {
        // add new class field for Weekly TA
        await weeklyTAClassFieldAddNew(page, scenario);
        console.log('25');
      } else {
        if (
          !USERS_TIME_ACTIVITY_CLASS_NOT_VISIBLE.split(',').includes(scenario)
        ) {
          await weeklyTimeActivity.validateAddNewOptionIsNotAvailableForGivenField(
            LABELS.Class,
          );
          console.log('25');
        } else {
          await weeklyTimeActivity.validateGivenFieldNotVisible(LABELS.Class);
          console.log('25');
        }
      }

      if (
        !USERS_TIME_ACTIVITY_CLASS_NOT_VISIBLE.split(',').includes(scenario)
      ) {
        // clear class field for Weekly TA
        await weeklyTAClassFieldClear(page, scenario);
        console.log('26');
      } else {
        await weeklyTimeActivity.validateGivenFieldNotVisible(LABELS.Class);
        console.log('26');
      }

      // Customer Field clear for Weekly TA
      // await weeklyTACustomerFieldClear(page, scenario);
      console.log('27');

      // Service field Clear for Weekly TA
      await weeklyTAServiceFieldClear(page, scenario);
      console.log('28');

      if (
        !USERS_TIME_ACTIVITY_LOCATION_NOT_VISIBLE.split(',').includes(scenario)
      ) {
        // Location field clear for Weekly TA
        await weeklyTALocationFieldClear(page, scenario);
        console.log('29');
      } else {
        await weeklyTimeActivity.validateGivenFieldNotVisible(LABELS.Location);
        console.log('29');
      }

      // Check the selected week is within current date
      await weeklyTAValidateWeekSelectedInCurrentDateWeek(page, scenario);
      console.log('30');
      if (scenario !== USER_ROLES.timeTrackOnly) {
        // Switching users without saving changes for Weekly TA
        await weeklyTAUpdateTeamMemberWithoutSavingSwitchToOtherTeamMember(
          page,
          scenario,
        );
        console.log('31');
      }

      // Switching weekly time without saving changes for Weekly TA
      await weeklyTAChangeWeekDateWithoutSavingChanges(page, scenario);
      console.log('32');

      // Transform Empty form to Filled form with days updated
      await weeklyTAValidateEmptyFormToFilledFormTransform(page, scenario);
      console.log('33');

      if (
        !USERS_HAVE_NO_ACCESS_TO_UPDATE_QBO_SETTINGS.split(',').includes(
          scenario,
        )
      ) {
        // update the first day of the work week  // needs to be fixed
        await weeklyTAValidateFirstDayOfWeek(page, scenario);

        console.log('34');
      } else {
        await validateNoAccessQBOSettingsPermissions(page, scenario);
        console.log('34');
      }

      if (
        !USERS_HAVE_NO_ACCESS_TO_UPDATE_QBO_SETTINGS.split(',').includes(
          scenario,
        )
      ) {
        if (!USERS_BILL_RATE_NOTAPPLICABLE.split(',').includes(scenario)) {
          // Currency update
          await weeklyTAValidateCurrencyUpdate(page, scenario);

          console.log('35');
        } else {
          console.log(`Billable rate not displayed on Weekly TA`);
          console.log('35');
        }
      } else {
        await validateNoAccessQBOSettingsPermissions(page, scenario);
        console.log('35');
      }

      // if (!USERS_TIME_ACTIVITY_PAYTYPE_NOTVISIBLE.split(',').includes(scenario)) {
      //   // pay type selected for Weekly TA
      //   await weeklyTAPayTypeSelectedDisplayed(page, scenario);

      //   console.log('36');
      // } else {
      //   await weeklyTimeActivity.validateGivenFieldNotVisible(LABELS.PayType);
      //   console.log('36');
      // }

      if (scenario !== 'CA QL QB Plus (Canada)' && USER_ROLES.timeTrackOnly) {
        if (
          !USERS_TIME_ACTIVITY_NOTEMP_APPLICABLE.split(',').includes(scenario)
        ) {
          // add Employee and Vendor for Weekly TA #TODO Will fix the issue related to vendor not getting displayed
          await weeklyTANameFieldAddEmployeeVendor(page, scenario);

          console.log('37');
        } else {
          if (
            !USERS_TIME_ACTIVITY_NEW_EMP_CREATE_ACCESS_DENIED.split(
              ',',
            ).includes(scenario)
          ) {
            console.log(`checking name field not to be created ${scenario}`);
            await weeklyTimeActivity.validateAddNewOptionIsNotAvailableForNameField(
              LABELS.Name,
            );
            console.log('37');
          } else {
            console.log(`checking name field not to be created ${scenario}`);
            await useWeeklyTaAddEmployeeFromNameFieldAccessDenied(
              page,
              weeklyTimeUtils,
              weeklyTimeActivity,
            );
            console.log('37');
          }
        }

        // to validate for vendor paytype is disabled  #TODO fix the paytypescriptaccording to different company
        await weeklyTAValidatePayTypeIsDisabledForVendor(page, scenario);
        console.log('38');
      }
      // to print
      await weeklyTAValidatePrintContent(page, scenario);
      console.log('39');
    }
  } else if (
    USERS_TIME_ACTIVITY_DRAWER_APPLICABLE.split(',').includes(scenario)
  ) {
    const status = await weeklyTimeActivity.validateDrawerVisibility();
    expect(status).toBeTruthy();
  } else {
    await weeklyTimeActivity.checkNoAccess();
  }
};

/***************************************Validation test case ended***********************************************/
export { WeeklyTAValidationTest, WeeklyTAFeaturesTest };
