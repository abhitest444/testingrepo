import { Page } from 'playwright-core';
import { expect } from '@playwright/test';
import {
  AutomationLoginData,
  TIME_TRACKING_AUTOMATION_LOGINS,
} from '../../logins';
import { LABELS, USER_ROLES, USERS_BILL_RATE_NOTAPPLICABLE } from '../../utils';
import { openQBO } from '../../pages/QBOLogin';
import { overridePlugin } from '../../plugin/overridePlugin';
import TimeTrowser, {
  matchTeamMemberQueryResponse,
  OIGQL_URL_PATTERN,
  waitForResponseWithURLandBody,
  waitForResponseWithURLandBodyWTA,
} from '../../pages/TimeTrowser';

import { WeeklyTimeActivity } from '../../pages/WeeklyTimeActivity';
import { userAndCompanyIdHeader } from 'src/js/service/ApolloClientBuilderUtils';

export class WeeklyTimeUtils {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  useFillOutTheRowData = async (
    page: Page,
    weeklyTimeActivity: WeeklyTimeActivity,
    scenario: string,
  ) => {
    const data = {
      Notes: 'Random Notes One',
      RowNo: 1, // row one in WTA
    };
    await this.page.waitForTimeout(7000);
    await weeklyTimeActivity.openRowDropdown(LABELS.Customers, data.RowNo);
    await weeklyTimeActivity.clickDropdownOption();

    if (await weeklyTimeActivity.isVisibile(LABELS.Class, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Class, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption();
    }

    if (await weeklyTimeActivity.isVisibile(LABELS.Service, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Service, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption();
    }

    if (await weeklyTimeActivity.isVisibile(LABELS.Location, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Location, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption();
    }
    /*
    // pick pay type
    if (
      (await weeklyTimeActivity.isVisibile(LABELS.PayType, data.RowNo)) &&
      !(await weeklyTimeActivity.isVisibile(LABELS.NoPayType, data.RowNo))
    ) {
      await weeklyTimeActivity.openRowDropdown(LABELS.PayType, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption(0);
    }

    */
    await weeklyTimeActivity.enterDuration(data.RowNo);

    if (!(await weeklyTimeActivity.isBillableVisible())) {
      await weeklyTimeActivity.clickSettingsIcon();
      await weeklyTimeActivity.page.waitForTimeout(1000);
      await weeklyTimeActivity.clickOnFieldToggleCheckbox(LABELS.Billable);
      await weeklyTimeActivity.scrollTillButtonNotFound(LABELS.SaveSettings);
      await weeklyTimeActivity.clickButton(LABELS.SaveSettings);
      await weeklyTimeActivity.page.waitForTimeout(3000);
    }

    if (
      !(await weeklyTimeActivity.isChecked(data.RowNo, LABELS.Billable)) ||
      (await weeklyTimeActivity.checkATARowIsEmpty(data.RowNo))
    ) {
      await weeklyTimeActivity.checkInputCheckbox(data.RowNo, LABELS.Billable);
      if (!USERS_BILL_RATE_NOTAPPLICABLE.split(',').includes(scenario)) {
        await weeklyTimeActivity.enterBillRate(data.RowNo);
      } else {
        expect(await weeklyTimeActivity.billRate(data.RowNo)).not.toBeVisible();
      }
    }

    // check taxable
    if (
      (await weeklyTimeActivity.isVisibile(LABELS.Taxable, data.RowNo)) &&
      !(await weeklyTimeActivity.isChecked(data.RowNo, LABELS.Taxable))
    ) {
      await weeklyTimeActivity.checkInputCheckbox(data.RowNo, LABELS.Taxable);
    }

    // add a note
    await weeklyTimeActivity.enterNotes(data.Notes, data.RowNo);
  };

  useWeeklyTAEntry = async (
    page: Page,
    weeklyTimeActivity: WeeklyTimeActivity,
    scenario: string,
  ) => {
    // build query to wait for teammember quickfill response
    const teamMemberQuickfillResponsePromise = waitForResponseWithURLandBodyWTA(
      page,
      OIGQL_URL_PATTERN,
      matchTeamMemberQueryResponse,
    );

    // navigate to trowser
    await weeklyTimeActivity.navigateToWeeklyTime();

    // wait for teammember quickfill response to resolve
    // await teamMemberQuickfillResponsePromise;

    // wait for trowser to load
    await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
    await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

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

    if (scenario !== USER_ROLES.timeTrackOnly) {
      await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);
      await weeklyTimeActivity.clickDropdownOption();
    }

    await weeklyTimeActivity.locatorEnabled(LABELS.Customers, 1);

    if (
      await page
        .getByTestId('ModalDialog--wrapper')
        .isVisible({ timeout: 20000 })
    ) {
      await page.getByRole('button', { name: 'Yes' }).click();
    }

    await this.useFillOutTheRowData(page, weeklyTimeActivity, scenario);
  };

  useWeeklyTAUpdateRow = async (
    page: Page,
    weeklyTimeActivity: WeeklyTimeActivity,
    rowData: any,
    scenario: string,
  ) => {
    // navigate to trowser
    await weeklyTimeActivity.navigateToWeeklyTime();

    const data = {
      Notes: rowData.Notes,
      RowNo: rowData.RowNo, // row one in WTA
    };

    // expand row
    if (await weeklyTimeActivity.isExpandRowIconVisible(data.RowNo)) {
      await weeklyTimeActivity.expandRow(data.RowNo);
    }

    // wait for trowser to load
    await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
    await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

    await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);
    await weeklyTimeActivity.clickDropdownOption();
    await page.waitForLoadState('networkidle');
    await this.fillOutRowSpecificDetails(weeklyTimeActivity, rowData, scenario);
  };

  useWeeklyTAToggleField = async (
    page: Page,
    company: AutomationLoginData,
    field: string,
  ) => {
    await page.setViewportSize({ width: 1200, height: 1200 });
    await openQBO(page, company);
    await overridePlugin(page);

    const weeklyTimeActivity = new WeeklyTimeActivity(page);

    // build query to wait for teammember quickfill response
    const teamMemberQuickfillResponsePromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTeamMemberQueryResponse,
    );

    // navigate to trowser
    await weeklyTimeActivity.navigateToWeeklyTime();

    const data = {
      Notes: 'Random Notes One',
      RowNo: 1, // row one in WTA
    };

    // wait for teammember quickfill response to resolve
    await teamMemberQuickfillResponsePromise;

    // wait for trowser to load
    await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
    await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

    await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);
    await weeklyTimeActivity.clickDropdownOption();

    await weeklyTimeActivity.clickButton(LABELS.ClearAllLines);

    if (
      !(await weeklyTimeActivity.isVisibile(field, data.RowNo)) ||
      (await weeklyTimeActivity.isVisibile(field, data.RowNo))
    ) {
      await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(field);
    }
  };

  weeklyTAToggleWeekdays = async (
    page: Page,
    company: AutomationLoginData,
    field: string,
  ) => {
    await page.setViewportSize({ width: 1200, height: 1200 });
    await openQBO(page, company);
    await overridePlugin(page);

    const weeklyTimeActivity = new WeeklyTimeActivity(page);

    // build query to wait for teammember quickfill response
    const teamMemberQuickfillResponsePromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTeamMemberQueryResponse,
    );

    // navigate to trowser
    await weeklyTimeActivity.navigateToWeeklyTime();

    // wait for teammember quickfill response to resolve
    await teamMemberQuickfillResponsePromise;

    // wait for trowser to load
    await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
    await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

    await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);
    await weeklyTimeActivity.clickDropdownOption();

    await weeklyTimeActivity.clickButton(LABELS.ClearAllLines);

    if (
      !(await weeklyTimeActivity.isTableHeaderVisible(field)) ||
      (await weeklyTimeActivity.isTableHeaderVisible(field))
    ) {
      await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(field);
    }
  };

  weeklyTaOneWeekdaySelectionRequire = async (
    page: Page,
    company: AutomationLoginData,
    field: string[],
  ) => {
    await page.setViewportSize({ width: 1200, height: 1200 });
    await openQBO(page, company);
    await overridePlugin(page);

    const weeklyTimeActivity = new WeeklyTimeActivity(page);

    // build query to wait for teammember quickfill response
    const teamMemberQuickfillResponsePromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTeamMemberQueryResponse,
    );

    // navigate to trowser
    await weeklyTimeActivity.navigateToWeeklyTime();

    // wait for teammember quickfill response to resolve
    await teamMemberQuickfillResponsePromise;

    // wait for trowser to load
    await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
    await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

    await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);
    await weeklyTimeActivity.clickDropdownOption();

    await weeklyTimeActivity.clickButton(LABELS.ClearAllLines);

    for (let i = 0; i < field.length; i += 1) {
      if (await weeklyTimeActivity.isTableHeaderVisible(field[i])) {
        await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(field[i]);

        if (i === field.length - 1) {
          await weeklyTimeActivity
            .getByText(LABELS.atLeastOneWeekdayRequire)
            .isVisible();
          await weeklyTimeActivity.clickSettingsIcon();
        }
      }
    }
  };

  fillOutRowSpecificDetails = async (
    weeklyTimeActivity: WeeklyTimeActivity,
    rowData: any,
    scenario: string,
  ) => {
    const data = {
      Notes: rowData.Notes,
      RowNo: rowData.RowNo, // row one in WTA
      Duration: rowData?.Duration,
      IsAlternateDuration: rowData?.IsAlternateDuration,
      DurationStart: rowData?.DurationStart,
    };
    await this.page.waitForTimeout(3000);
    await weeklyTimeActivity.openRowDropdown(LABELS.Customers, data.RowNo);
    await weeklyTimeActivity.clickDropdownOption();

    if (await weeklyTimeActivity.isVisibile(LABELS.Class, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Class, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption();
    }

    if (await weeklyTimeActivity.isVisibile(LABELS.Service, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Service, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption();
    }

    if (await weeklyTimeActivity.isVisibile(LABELS.Location, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Location, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption();
    }

    const isPaytypeDisabled = weeklyTimeActivity.isPayTypeDisabled(
      LABELS.PayType,
      data.RowNo,
    );

    /*

    // pick pay type
    if (
      (await weeklyTimeActivity.isVisibile(LABELS.PayType, data.RowNo)) &&
      !(await weeklyTimeActivity.isVisibile(LABELS.NoPayType, data.RowNo))
    ) {
      await weeklyTimeActivity.openRowDropdown(LABELS.PayType, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption(0);
    }

    */

    if (data?.IsAlternateDuration) {
      if (data?.DurationStart > 0) {
        await weeklyTimeActivity.enterCustomOddDuration(
          data.RowNo,
          data.DurationStart,
          data.Duration,
        );
      } else {
        await weeklyTimeActivity.enterCustomEvenDuration(
          data.RowNo,
          data.DurationStart,
          data.Duration,
        );
      }
    } else {
      if (data?.Duration !== undefined) {
        await weeklyTimeActivity.enterDurationWithValue(
          data.RowNo,
          data.Duration,
        );
      } else {
        await weeklyTimeActivity.enterDuration(data.RowNo);
      }
    }

    // check billrate
    if (
      !(await weeklyTimeActivity.isChecked(data.RowNo, LABELS.Billable)) &&
      (await weeklyTimeActivity.isVisibile(LABELS.BillablePerHour, data.RowNo))
    ) {
      await weeklyTimeActivity.checkInputCheckbox(data.RowNo, LABELS.Billable);
    }

    if (await weeklyTimeActivity.isChecked(data.RowNo, LABELS.Billable)) {
      if (!USERS_BILL_RATE_NOTAPPLICABLE.split(',').includes(scenario)) {
        await this.page.waitForTimeout(1000);
        await weeklyTimeActivity.enterBillRate(data.RowNo);
        await this.page.waitForTimeout(1000);
      }
    }

    // check taxable
    if (
      (await weeklyTimeActivity.isVisibile(LABELS.Taxable, data.RowNo)) &&
      !(await weeklyTimeActivity.isChecked(data.RowNo, LABELS.Taxable))
    ) {
      await weeklyTimeActivity.checkInputCheckbox(data.RowNo, LABELS.Taxable);
    }

    // await this.page.waitForTimeout(2000);
    // add a note
    await weeklyTimeActivity.enterNotes(data.Notes, data.RowNo);
  };

  fillOutRowSpecificJobDetails = async (
    weeklyTimeActivity: WeeklyTimeActivity,
    rowData: any,
    scenario: string,
  ) => {
    const data = {
      Notes: rowData.Notes,
      RowNo: rowData.RowNo, // row one in WTA
      Duration: rowData?.Duration,
      customDropDownVal: rowData?.customDropDownVal,
    };

    await this.page.waitForLoadState('load');
    await weeklyTimeActivity.openRowDropdown(LABELS.Customers, data.RowNo);
    await weeklyTimeActivity.clickCustomDropdownOption(data.customDropDownVal);

    if (await weeklyTimeActivity.isVisibile(LABELS.Service, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Service, data.RowNo);
      await weeklyTimeActivity.clickCustomDropdownOption(
        data.customDropDownVal,
      );
    }

    if (await weeklyTimeActivity.isVisibile(LABELS.Class, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Class, data.RowNo);
      await weeklyTimeActivity.clickCustomDropdownOption(
        data.customDropDownVal,
      );
    }

    if (await weeklyTimeActivity.isVisibile(LABELS.Location, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Location, data.RowNo);
      await weeklyTimeActivity.clickCustomDropdownOption(
        data.customDropDownVal,
      );
    }

    const isPaytypeDisabled = weeklyTimeActivity.isPayTypeDisabled(
      LABELS.PayType,
      data.RowNo,
    );

    // pick pay type
    if (
      (await weeklyTimeActivity.isVisibile(LABELS.PayType, data.RowNo)) &&
      !(await weeklyTimeActivity.isPayTypeDisabled(LABELS.PayType, data.RowNo))
    ) {
      await weeklyTimeActivity.openRowDropdown(LABELS.PayType, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption(0);
    }

    if (data?.Duration !== undefined) {
      await weeklyTimeActivity.enterDurationWithValue(
        data.RowNo,
        data.Duration,
      );
    } else {
      await weeklyTimeActivity.enterDuration(data.RowNo);
    }

    // check billrate
    if (!(await weeklyTimeActivity.isChecked(data.RowNo, LABELS.Billable))) {
      await weeklyTimeActivity.checkInputCheckbox(data.RowNo, LABELS.Billable);
      if (!USERS_BILL_RATE_NOTAPPLICABLE.split(',').includes(scenario)) {
        await weeklyTimeActivity.enterBillRate(data.RowNo);
      }
    }

    // check taxable
    if (
      (await weeklyTimeActivity.isVisibile(LABELS.Taxable, data.RowNo)) &&
      !(await weeklyTimeActivity.isChecked(data.RowNo, LABELS.Taxable))
    ) {
      await weeklyTimeActivity.checkInputCheckbox(data.RowNo, LABELS.Taxable);
    }

    // add a note
    await weeklyTimeActivity.enterNotes(data.Notes, data.RowNo);
  };

  clearAllRowsBeforeEnteringValues = async (
    page: Page,
    company: AutomationLoginData,
  ) => {
    await openQBO(page, company);
    await overridePlugin(page);

    const weeklyTimeActivity = new WeeklyTimeActivity(page);

    // navigate to trowser
    await weeklyTimeActivity.navigateToWeeklyTime();

    // wait for trowser to load
    await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
    await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

    await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);
    await weeklyTimeActivity.clickDropdownOption();

    await page.getByRole('button', { name: 'Clear all lines' }).click();
    await weeklyTimeActivity.clickButton(LABELS.Save);
  };

  clearAllWeeklyTARows = async (
    page: Page,
    weeklyTimeActivity: WeeklyTimeActivity,
  ) => {
    // navigate to trowser
    await weeklyTimeActivity.navigateToWeeklyTime();

    if (!(await weeklyTimeActivity.checkATARowIsEmpty(1))) {
      await page.getByRole('button', { name: 'Clear all lines' }).click();
      await weeklyTimeActivity.clickButton(LABELS.Save);
    }

    //await expect(async () =>{
    await page.waitForTimeout(5000);

    await weeklyTimeActivity.getName();

    // Check if duration is empty for row 2 and 3, if so, uncheck billable
    for (const row of [1, 2, 3]) {
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

    //adding to avoid failures due to blank Name while saving
    await weeklyTimeActivity.clickButton(LABELS.Save);

    await expect(weeklyTimeActivity.getErrorMessage()).toContainText(
      'You must enter at least one time activity before you can save the timesheet.',
    );
    //}).toPass({intervals: [500, 1000, 2000], timeout: 10000});
  };

  nameFieldSearchAndFillWithData = async (
    page: Page,
    weeklyTimeActivity: WeeklyTimeActivity,
  ) => {
    // build query to wait for teammember quickfill response
    const teamMemberQuickfillResponsePromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTeamMemberQueryResponse,
    );

    // navigate to trowser
    await weeklyTimeActivity.navigateToWeeklyTime();

    // wait for teammember quickfill response to resolve
    //await teamMemberQuickfillResponsePromise;

    // wait for trowser to load
    await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
    await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

    await weeklyTimeActivity.fillTheTimeForDropdown(
      LABELS.timeFor,
      'test data',
    );
    // this.page.waitForTimeout(1000);

    if (await weeklyTimeActivity.isOptionAvailable(1)) {
      await weeklyTimeActivity.clickDropdownOption();
    }
  };

  addNewEmployee = async (
    page: Page,
    weeklyTimeActivity: WeeklyTimeActivity,
  ) => {
    // build query to wait for teammember quickfill response
    const teamMemberQuickfillResponsePromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTeamMemberQueryResponse,
    );

    // navigate to trowser
    await weeklyTimeActivity.navigateToWeeklyTime();

    // wait for teammember quickfill response to resolve
    // await teamMemberQuickfillResponsePromise;

    // wait for trowser to load
    await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
    await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

    const randomName = await weeklyTimeActivity.generateRandomString(10);

    await weeklyTimeActivity.fillTheTimeForDropdown(LABELS.timeFor, randomName);
    this.page.waitForTimeout(1000);

    if ((await weeklyTimeActivity.dropdownOptionsCount()) === 1) {
      await weeklyTimeActivity.clickDropdownOption(0);
      await this.page.waitForTimeout(10000);
      //await weeklyTimeActivity.isDialogVisible(LABELS.Employee);
      await weeklyTimeActivity.isFieldFilled('First name');
      await weeklyTimeActivity.clickSaveDialog();
    }
  };

  addNewEmployeeAccessDenied = async (
    page: Page,
    weeklyTimeActivity: WeeklyTimeActivity,
  ) => {
    // build query to wait for teammember quickfill response
    const teamMemberQuickfillResponsePromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTeamMemberQueryResponse,
    );

    // navigate to trowser
    await weeklyTimeActivity.navigateToWeeklyTime();

    // wait for teammember quickfill response to resolve
    // await teamMemberQuickfillResponsePromise;

    // wait for trowser to load
    await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
    await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

    const randomName = await weeklyTimeActivity.generateRandomString(10);

    await weeklyTimeActivity.fillTheTimeForDropdown(LABELS.timeFor, randomName);
    this.page.waitForTimeout(1000);

    if ((await weeklyTimeActivity.dropdownOptionsCount()) === 1) {
      await weeklyTimeActivity.clickDropdownOption(0);
      await this.page.waitForTimeout(10000);
      //await weeklyTimeActivity.isDialogVisible(LABELS.Employee);
      await weeklyTimeActivity.isFieldFilled('First name');
      await expect(
        this.page.locator(`//button[@aria-label="Save"]`),
      ).toBeVisible({ timeout: 10000 });
      await this.page.locator(`//button[@aria-label="Save"]`).click();
    }
  };

  addNewCustomer = async (
    page: Page,
    weeklyTimeActivity: WeeklyTimeActivity,
    scenario: string,
  ) => {
    // build query to wait for teammember quickfill response
    const teamMemberQuickfillResponsePromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTeamMemberQueryResponse,
    );

    // navigate to trowser
    await weeklyTimeActivity.navigateToWeeklyTime();

    // wait for teammember quickfill response to resolve
    // await teamMemberQuickfillResponsePromise;

    // wait for trowser to load
    await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
    await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

    await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);
    await weeklyTimeActivity.clickDropdownOption();
    // await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await weeklyTimeActivity.clickButton(LABELS.ClearAllLines);

    const randomCustomerName = await weeklyTimeActivity.generateRandomString(
      10,
    );

    const data = {
      Notes: 'Random Notes One',
      RowNo: 1, // row one in WTA
    };

    await weeklyTimeActivity.fillTheDropDown(
      LABELS.Customers,
      data.RowNo,
      randomCustomerName,
    );

    if ((await weeklyTimeActivity.dropdownOptionsCount()) === 1) {
      await weeklyTimeActivity.clickDropdownOption(0);
      await this.page.waitForTimeout(10000);
      //await weeklyTimeActivity.isDialogVisible(LABELS.Customer);
      await weeklyTimeActivity.isRowFieldFilled('First name');
      await weeklyTimeActivity.isRowFieldFilled(
        'Customer display name (required)',
      );
      await page.waitForTimeout(1000);
      await weeklyTimeActivity.clickSaveDialog();
    }

    await page.waitForTimeout(5000);
    await weeklyTimeActivity.validateGivenNameDisplayedUnderGivenLabel(
      randomCustomerName,
      LABELS.Customer,
      data.RowNo,
    );

    if (await weeklyTimeActivity.isVisibile(LABELS.Service, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Service, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption();
    }

    if (await weeklyTimeActivity.isVisibile(LABELS.Class, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Class, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption();
    }

    if (await weeklyTimeActivity.isVisibile(LABELS.Location, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Location, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption();
    }
    /*
    // pick pay type
    if (
      (await weeklyTimeActivity.isVisibile(LABELS.PayType, data.RowNo)) &&
      !(await weeklyTimeActivity.isVisibile(LABELS.NoPayType, data.RowNo))
    ) {
      await weeklyTimeActivity.openRowDropdown(LABELS.PayType, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption(0);
    }

    */

    await weeklyTimeActivity.enterDuration(data.RowNo);

    // add a note
    await weeklyTimeActivity.enterNotes(data.Notes, data.RowNo);

    if (!(await weeklyTimeActivity.isChecked(data.RowNo, LABELS.Billable))) {
      await weeklyTimeActivity.checkInputCheckbox(data.RowNo, LABELS.Billable);
      if (!USERS_BILL_RATE_NOTAPPLICABLE.split(',').includes(scenario)) {
        await weeklyTimeActivity.enterBillRate(data.RowNo);
      }
    }

    // check taxable
    if (
      (await weeklyTimeActivity.isVisibile(LABELS.Taxable, data.RowNo)) &&
      !(await weeklyTimeActivity.isChecked(data.RowNo, LABELS.Taxable))
    ) {
      await weeklyTimeActivity.checkInputCheckbox(data.RowNo, LABELS.Taxable);
    }
  };

  addNewLocation = async (
    page: Page,
    weeklyTimeActivity: WeeklyTimeActivity,
    scenario: string,
  ) => {
    // build query to wait for teammember quickfill response
    const teamMemberQuickfillResponsePromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTeamMemberQueryResponse,
    );

    // navigate to trowser
    await weeklyTimeActivity.navigateToWeeklyTime();

    // wait for teammember quickfill response to resolve
    // await teamMemberQuickfillResponsePromise;

    // wait for trowser to load
    await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
    await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

    await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);
    await weeklyTimeActivity.clickDropdownOption();
    // await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await weeklyTimeActivity.clickButton(LABELS.ClearAllLines);

    const randomLocation = await weeklyTimeActivity.generateRandomString(10);

    const data = {
      Notes: 'Random Notes One',
      RowNo: 1, // row one in WTA
    };

    await weeklyTimeActivity.openRowDropdown(LABELS.Customers, data.RowNo);
    await weeklyTimeActivity.clickDropdownOption();
    // await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    if (await weeklyTimeActivity.isVisibile(LABELS.Service, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Service, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption();
    }

    if (await weeklyTimeActivity.isVisibile(LABELS.Class, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Class, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption();
    }

    /*

    // pick pay type
    if (
      (await weeklyTimeActivity.isVisibile(LABELS.PayType, data.RowNo)) &&
      !(await weeklyTimeActivity.isVisibile(LABELS.NoPayType, data.RowNo))
    ) {
      await weeklyTimeActivity.openRowDropdown(LABELS.PayType, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption(0);
    }

    */

    await weeklyTimeActivity.enterDuration(data.RowNo);

    // add a note
    await weeklyTimeActivity.enterNotes(data.Notes, data.RowNo);

    if (!(await weeklyTimeActivity.isChecked(data.RowNo, LABELS.Billable))) {
      await weeklyTimeActivity.checkInputCheckbox(data.RowNo, LABELS.Billable);
      if (!USERS_BILL_RATE_NOTAPPLICABLE.split(',').includes(scenario)) {
        await weeklyTimeActivity.enterBillRate(data.RowNo);
      }
    }

    // check taxable
    if (
      (await weeklyTimeActivity.isVisibile(LABELS.Taxable, data.RowNo)) &&
      !(await weeklyTimeActivity.isChecked(data.RowNo, LABELS.Taxable))
    ) {
      await weeklyTimeActivity.checkInputCheckbox(data.RowNo, LABELS.Taxable);
    }

    await weeklyTimeActivity.fillTheDropDown(
      LABELS.Location,
      data.RowNo,
      randomLocation,
    );

    if ((await weeklyTimeActivity.dropdownOptionsCount()) === 1) {
      await weeklyTimeActivity.clickDropdownOption(0);
      await this.page.waitForTimeout(10000);
      await weeklyTimeActivity.locationDialogHeader(
        LABELS.LocationDrawerHeader,
      );
      await weeklyTimeActivity.isLocationRowFieldFilled('locationName');
      await weeklyTimeActivity.locationDrawerSaveButton();
      await this.page.waitForTimeout(1000);
    }

    await page.waitForTimeout(5000);
    await weeklyTimeActivity.validateGivenNameDisplayedUnderGivenLabelIfNotSelect(
      randomLocation,
      LABELS.Location,
      data.RowNo,
    );
  };

  addNewService = async (
    page: Page,
    weeklyTimeActivity: WeeklyTimeActivity,
    scenario: string,
  ) => {
    // build query to wait for teammember quickfill response
    const teamMemberQuickfillResponsePromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTeamMemberQueryResponse,
    );

    // navigate to trowser
    await weeklyTimeActivity.navigateToWeeklyTime();

    // wait for teammember quickfill response to resolve
    // await teamMemberQuickfillResponsePromise;

    // wait for trowser to load
    await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
    await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

    await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);
    await weeklyTimeActivity.clickDropdownOption();
    // await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await weeklyTimeActivity.clickButton(LABELS.ClearAllLines);

    await page.waitForTimeout(2000);
    const randomServiceName = await weeklyTimeActivity.generateRandomString(10);

    const data = {
      Notes: 'Random Notes One',
      RowNo: 1, // row one in WTA
    };

    await weeklyTimeActivity.openRowDropdown(LABELS.Customers, data.RowNo);
    await weeklyTimeActivity.clickDropdownOption();
    // await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    if (await weeklyTimeActivity.isVisibile(LABELS.Location, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Location, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption();
    }

    if (await weeklyTimeActivity.isVisibile(LABELS.Class, data.RowNo)) {
      await weeklyTimeActivity.openRowDropdown(LABELS.Class, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption();
    }

    /*

    // pick pay type
    if (
      (await weeklyTimeActivity.isVisibile(LABELS.PayType, data.RowNo)) &&
      !(await weeklyTimeActivity.isVisibile(LABELS.NoPayType, data.RowNo))
    ) {
      await weeklyTimeActivity.openRowDropdown(LABELS.PayType, data.RowNo);
      await weeklyTimeActivity.clickDropdownOption(0);
    }

    */

    await weeklyTimeActivity.enterDuration(data.RowNo);

    // add a note
    await weeklyTimeActivity.enterNotes(data.Notes, data.RowNo);

    if (
      (await weeklyTimeActivity.checkATARowIsEmpty(data.RowNo)) &&
      !(await weeklyTimeActivity.isChecked(data.RowNo, LABELS.Billable))
    ) {
      await weeklyTimeActivity.checkInputCheckbox(data.RowNo, LABELS.Billable);
    }

    if (!USERS_BILL_RATE_NOTAPPLICABLE.split(',').includes(scenario)) {
      await weeklyTimeActivity.enterBillRate(data.RowNo);
    }

    // check taxable
    if (
      (await weeklyTimeActivity.isVisibile(LABELS.Taxable, data.RowNo)) &&
      !(await weeklyTimeActivity.isChecked(data.RowNo, LABELS.Taxable))
    ) {
      await weeklyTimeActivity.checkInputCheckbox(data.RowNo, LABELS.Taxable);
    }

    await weeklyTimeActivity.fillTheDropDown(
      LABELS.Service,
      data.RowNo,
      randomServiceName,
    );

    if ((await weeklyTimeActivity.dropdownOptionsCount()) === 1) {
      await weeklyTimeActivity.clickDropdownOption(0);
      await this.page.waitForTimeout(10000);
      // await weeklyTimeActivity.serviceDrawerHeader();
      if (
        await page
          .getByRole('button', {
            name: 'img Service Services that you provide to customers, for example, landscaping or tax preparation services.',
          })
          .isVisible()
      ) {
        await page
          .getByRole('button', {
            name: 'img Service Services that you provide to customers, for example, landscaping or tax preparation services.',
          })
          .click();
      }
      await weeklyTimeActivity.serviceDrawerNameField();
      await weeklyTimeActivity.serviceDrawerSaveButtonClick();
      await this.page.waitForTimeout(2000);
    }

    await weeklyTimeActivity.validateGivenNameDisplayedUnderGivenLabelIfNotSelect(
      randomServiceName,
      LABELS.Service,
      data.RowNo,
    );
  };

  clearAllRows = async (page: Page, company: AutomationLoginData) => {
    const weeklyTimeActivity = new WeeklyTimeActivity(page);
    await page.getByRole('button', { name: 'Clear all lines' }).click();
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();
  };

  weeklyDurationCheck = async (page: Page, company: AutomationLoginData) => {
    await openQBO(page, company);
    await overridePlugin(page);
    const weeklyTimeActivity = new WeeklyTimeActivity(page);
    // navigate to trowser
    await weeklyTimeActivity.navigateToWeeklyTime();
    // await page.getByTestId('clear-all-lines').click();
    await page.getByRole('button', { name: 'Clear all lines' }).click();
    await weeklyTimeActivity.clickButton(LABELS.Save);
  };
}
