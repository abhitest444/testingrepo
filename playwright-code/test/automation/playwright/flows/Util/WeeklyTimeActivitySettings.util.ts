import { expect, Page } from '@playwright/test';
import { getWeeklySettingsLoginData } from '../../logins';
import { openQBO, openQBOTT } from '../../pages/QBOLogin';
import { WeeklyTimeActivity } from '../../pages/WeeklyTimeActivity';
import { overridePlugin } from '../../plugin/overridePlugin';
import {
  LABELS,
  USER_ROLES,
  USERS_TIME_ACTIVITY_DRAWER_APPLICABLE,
  USERS_TIME_ACTIVITY_NO_RELEVANT_FIELDS_SETTINGS_APPLICABLE,
  USERS_TIME_ACTIVITY_NOTAPPLICABLE,
  WEEK_DAYS,
} from '../../utils';
import {
  matchTeamMemberQueryResponse,
  OIGQL_URL_PATTERN,
  waitForResponseWithURLandBody,
} from '../../pages/TimeTrowser';

const useWeeklyTAClassFieldToggle = async (
  page: Page,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  const timeActivityStatus = await useWeeklyTAToggleField(
    page,
    LABELS.Class,
    scenario,
  );

  if (!(await weeklyTimeActivity.isVisibile(LABELS.Class, 1))) {
    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(LABELS.Class);
    await useFillOutTheRowData(page, weeklyTimeActivity);
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();

    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
      LABELS.Class,
    );
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.Class)) {
      await expect(
        weeklyTimeActivity.getByText(
          LABELS.fieldContainingValueSoNotRemoveMessage,
        ),
      ).toBeVisible();
    }
  } else {
    await useFillOutTheRowData(page, weeklyTimeActivity);
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();

    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
      LABELS.Class,
    );
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.Class)) {
      await expect(
        weeklyTimeActivity.getByText(
          LABELS.fieldContainingValueSoNotRemoveMessage,
        ),
      ).toBeVisible();
    }
  }
};

const useWeeklyTAServiceFieldToggle = async (
  page: Page,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  await useWeeklyTAToggleField(page, LABELS.Service, scenario);

  if (!(await weeklyTimeActivity.isVisibile(LABELS.Service, 1))) {
    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(LABELS.Service);
    await useFillOutTheRowData(page, weeklyTimeActivity);
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();

    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
      LABELS.Service,
    );
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.Service)) {
      await expect(
        weeklyTimeActivity.getByText(
          LABELS.fieldContainingValueSoNotRemoveMessage,
        ),
      ).toBeVisible();
    }
  } else {
    await useFillOutTheRowData(page, weeklyTimeActivity);
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();

    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
      LABELS.Service,
    );
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.Service)) {
      await expect(
        weeklyTimeActivity.getByText(
          LABELS.fieldContainingValueSoNotRemoveMessage,
        ),
      ).toBeVisible();
    }
  }
};

const useWeeklyTALocationFieldToggle = async (
  page: Page,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  await useWeeklyTAToggleField(page, LABELS.Location, scenario);

  if (!(await weeklyTimeActivity.isVisibile(LABELS.Location, 1))) {
    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(LABELS.Location);
    await useFillOutTheRowData(page, weeklyTimeActivity);
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();

    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
      LABELS.Location,
    );
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.Location)) {
      await expect(
        weeklyTimeActivity.getByText(
          LABELS.fieldContainingValueSoNotRemoveMessage,
        ),
      ).toBeVisible();
    }
  } else {
    await useFillOutTheRowData(page, weeklyTimeActivity);
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();

    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
      LABELS.Location,
    );
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.Location)) {
      await expect(
        weeklyTimeActivity.getByText(
          LABELS.fieldContainingValueSoNotRemoveMessage,
        ),
      ).toBeVisible();
    }
  }
};

const useWeeklyTAPayTypeFieldToggle = async (
  page: Page,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  await useWeeklyTAToggleField(page, LABELS.PayType, scenario);

  if (!(await weeklyTimeActivity.isVisibile(LABELS.PayType, 1))) {
    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(LABELS.PayType);
    await useFillOutTheRowData(page, weeklyTimeActivity);
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();

    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
      LABELS.PayType,
    );
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.PayType)) {
      await expect(
        weeklyTimeActivity.getByText(
          LABELS.fieldContainingValueSoNotRemoveMessage,
        ),
      ).toBeVisible();
    }
  } else {
    await useFillOutTheRowData(page, weeklyTimeActivity);
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();

    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
      LABELS.PayType,
    );
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.PayType)) {
      await expect(
        weeklyTimeActivity.getByText(
          LABELS.fieldContainingValueSoNotRemoveMessage,
        ),
      ).toBeVisible();
    }
  }
};

const useWeeklyTABillableFieldToggle = async (
  page: Page,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  await useWeeklyTAToggleField(page, LABELS.Billable, scenario);

  if (!(await weeklyTimeActivity.isVisibile(LABELS.Billable, 1))) {
    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(LABELS.Billable);
    await useFillOutTheRowData(page, weeklyTimeActivity);
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();

    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
      LABELS.Billable,
    );
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.Billable)) {
      await expect(
        weeklyTimeActivity.getByText(
          LABELS.fieldContainingValueSoNotRemoveMessage,
        ),
      ).toBeVisible();
    }
  } else {
    await useFillOutTheRowData(page, weeklyTimeActivity);
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();

    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
      LABELS.Billable,
    );
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.Billable)) {
      await expect(
        weeklyTimeActivity.getByText(
          LABELS.fieldContainingValueSoNotRemoveMessage,
        ),
      ).toBeVisible();
    }
  }
};

const useWeeklyTACostRateFieldToggle = async (
  page: Page,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  await useWeeklyTAToggleField(page, LABELS.CostRate, scenario);

  if (!(await weeklyTimeActivity.isVisibile(LABELS.CostRate, 1))) {
    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(LABELS.CostRate);
    await useFillOutTheRowData(page, weeklyTimeActivity);
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();

    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
      LABELS.CostRate,
    );
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.CostRate)) {
      await expect(
        weeklyTimeActivity.getByText(
          LABELS.fieldContainingValueSoNotRemoveMessage,
        ),
      ).toBeVisible();
    }
  } else {
    await useFillOutTheRowData(page, weeklyTimeActivity);
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();

    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
      LABELS.CostRate,
    );
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.CostRate)) {
      await expect(
        weeklyTimeActivity.getByText(
          LABELS.fieldContainingValueSoNotRemoveMessage,
        ),
      ).toBeVisible();
    }
  }
};

const useWeeklyTATaxableFieldToggle = async (
  page: Page,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  await useWeeklyTAToggleField(page, LABELS.Taxable, scenario);

  if (!(await weeklyTimeActivity.isVisibile(LABELS.Taxable, 1))) {
    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(LABELS.Taxable);
    await useFillOutTheRowData(page, weeklyTimeActivity);
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();

    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
      LABELS.Taxable,
    );
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.Taxable)) {
      await expect(
        weeklyTimeActivity.getByText(
          LABELS.fieldContainingValueSoNotRemoveMessage,
        ),
      ).toBeVisible();
    }
  } else {
    await useFillOutTheRowData(page, weeklyTimeActivity);
    await weeklyTimeActivity.clickButton(LABELS.Save);
    await weeklyTimeActivity.validateSuccessToast();

    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
      LABELS.Taxable,
    );
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.Taxable)) {
      await expect(
        weeklyTimeActivity.getByText(
          LABELS.fieldContainingValueSoNotRemoveMessage,
        ),
      ).toBeVisible();
    }
  }
};

const useWeeklyTASettingPersists = async (
  page: Page,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  await useWeeklyTAToggleField(page, LABELS.Service, scenario);
  await weeklyTimeActivity.clickButton('Cancel');
  if (
    await weeklyTimeActivity
      .getByText(LABELS.DoYouWantToLeaveWithoutSaving)
      .isVisible()
  ) {
    await weeklyTimeActivity.clickButton('Yes');
  }

  await weeklyTimeActivity.navigateToWeeklyTime();
  await page.waitForTimeout(5000);
  if (!(await weeklyTimeActivity.isVisibile(LABELS.Service, 1))) {
    let retries = 0;
    const maxRetries = 5;
    while (
      !(await page
        .getByRole('button', { name: LABELS.SaveSettings, exact: true })
        .isVisible({ timeout: 10000 })) &&
      retries < maxRetries
    ) {
      await weeklyTimeActivity.clickSettingsIcon();
      await page.waitForTimeout(1000);
      retries++;
    }
    if (await weeklyTimeActivity.isFieldFindInPopover(LABELS.Service)) {
      await weeklyTimeActivity.toggleCheckboxFieldIsUnSelected(LABELS.Service);
    }
    await weeklyTimeActivity.clickButton(LABELS.SaveSettings);
  } else {
    let retries = 0;
    const maxRetries = 5;
    while (
      !(await page
        .getByRole('button', { name: LABELS.SaveSettings, exact: true })
        .isVisible({ timeout: 10000 })) &&
      retries < maxRetries
    ) {
      await weeklyTimeActivity.clickSettingsIcon();
      await page.waitForTimeout(1000);
      retries++;
    }
    await weeklyTimeActivity.toggleCheckboxFieldSelected(LABELS.Service);
    await weeklyTimeActivity.clickButton(LABELS.SaveSettings);
  }
  await page.waitForTimeout(5000);
  let retries = 0;
  const maxRetries = 5;
  while (
    !(await page
      .getByRole('button', { name: LABELS.SaveSettings, exact: true })
      .isVisible({ timeout: 10000 })) &&
    retries < maxRetries
  ) {
    await weeklyTimeActivity.clickSettingsIcon();
    await page.waitForTimeout(1000);
    retries++;
  }
  await weeklyTimeActivity.columnSelectionDeSelectionLogic(LABELS.Service);
};

const useWeeklyTAColumnSelection = async (
  page: Page,
  weeklyTimeActivity: WeeklyTimeActivity,
) => {
  await weeklyTAToggleWeekdays(page, LABELS.Sunday);
  await page.waitForTimeout(2000);

  if (
    !(await weeklyTimeActivity.isTableHeaderVisible(LABELS.Sunday)) ||
    (await weeklyTimeActivity.isTableHeaderVisible(LABELS.Sunday))
  ) {
    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(LABELS.Sunday);
  }
};

const useWeeklyTAColumnSelectionTT = async (
  page: Page,
  weeklyTimeActivity: WeeklyTimeActivity,
) => {
  await weeklyTAToggleWeekdaysTT(page, LABELS.Sunday);
  await page.waitForTimeout(2000);

  if (
    !(await weeklyTimeActivity.isTableHeaderVisible(LABELS.Sunday)) ||
    (await weeklyTimeActivity.isTableHeaderVisible(LABELS.Sunday))
  ) {
    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(LABELS.Sunday);
  }
};

const useWeeklyTaAtLeastOneWeekdayRequire = async (
  page: Page,
  weeklyTimeActivity: WeeklyTimeActivity,
) => {
  await weeklyTaOneWeekdaySelectionRequire(page, WEEK_DAYS);

  await page.waitForTimeout(2000);

  for (let i = 0; i < WEEK_DAYS.length; i += 1) {
    if (!(await weeklyTimeActivity.isTableHeaderVisible(WEEK_DAYS[i]))) {
      await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(WEEK_DAYS[i]);
    }
  }
};

const useWeeklyTaAtLeastOneWeekdayRequireTT = async (
  page: Page,
  weeklyTimeActivity: WeeklyTimeActivity,
) => {
  await weeklyTaOneWeekdaySelectionRequireTT(page, WEEK_DAYS);

  await page.waitForTimeout(2000);

  for (let i = 0; i < WEEK_DAYS.length; i += 1) {
    if (!(await weeklyTimeActivity.isTableHeaderVisible(WEEK_DAYS[i]))) {
      await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(WEEK_DAYS[i]);
    }
  }
};

const validateRelevantFieldsSectionInSettingsNotAvailable = async (
  page: Page,
  weeklyTimeActivity: WeeklyTimeActivity,
  scenario: string,
) => {
  await weeklyTimeActivity.navigateToWeeklyTime();
  await weeklyTimeActivity.validateRelevantFieldsSectionIsNotDIsplayed();
};

const useWeeklyTAToggleField = async (
  page: Page,
  field: string,
  scenario: string,
) => {
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
  // await teamMemberQuickfillResponsePromise;

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
    await page.waitForTimeout(2000);
    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(field);
  }
};

const useFillOutTheRowData = async (
  page: Page,
  weeklyTimeActivity: WeeklyTimeActivity,
) => {
  const data = {
    Notes: 'Random Notes One',
    RowNo: 1, // row one in WTA
  };

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
    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(LABELS.Billable);
  }
  if (!(await weeklyTimeActivity.isChecked(data.RowNo, LABELS.Billable))) {
    await weeklyTimeActivity.checkInputCheckbox(data.RowNo, LABELS.Billable);
  }
  await weeklyTimeActivity.enterBillRate(data.RowNo);

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

const weeklyTAToggleWeekdays = async (page: Page, field: string) => {
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
  // await teamMemberQuickfillResponsePromise;

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

const weeklyTAToggleWeekdaysTT = async (page: Page, field: string) => {
  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  // wait for trowser to load
  await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
  await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

  await weeklyTimeActivity.clickButton(LABELS.ClearAllLines);

  if (
    !(await weeklyTimeActivity.isTableHeaderVisible(field)) ||
    (await weeklyTimeActivity.isTableHeaderVisible(field))
  ) {
    await weeklyTimeActivity.columnsAndWeekdayPopoverPopulate(field);
  }
};

const weeklyTaOneWeekdaySelectionRequireTT = async (
  page: Page,
  field: string[],
) => {
  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  // wait for trowser to load
  await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
  await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

  await weeklyTimeActivity.clickButton(LABELS.ClearAllLines);

  for (let i = 0; i < field.length; i += 1) {
    if (await weeklyTimeActivity.isTableHeaderVisible(field[i])) {
      await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
        field[i],
      );

      if (i === field.length - 1) {
        await weeklyTimeActivity
          .getByText(LABELS.atLeastOneWeekdayRequire)
          .isVisible();
        await weeklyTimeActivity.clickSettingsIcon();
      }
    }
  }
};

const weeklyTaOneWeekdaySelectionRequire = async (
  page: Page,
  field: string[],
) => {
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
  // await teamMemberQuickfillResponsePromise;

  // wait for trowser to load
  await expect(weeklyTimeActivity.getByText(LABELS.WTA)).toBeVisible();
  await expect(weeklyTimeActivity.getByLabel(LABELS.timeFor)).toBeVisible();

  await weeklyTimeActivity.timeForDropdown(LABELS.timeFor);
  await weeklyTimeActivity.clickDropdownOption();

  await weeklyTimeActivity.clickButton(LABELS.ClearAllLines);

  for (let i = 0; i < field.length; i += 1) {
    if (await weeklyTimeActivity.isTableHeaderVisible(field[i])) {
      await weeklyTimeActivity.columnsAndWeekdayPopoverPopulateForWeekdaysError(
        field[i],
      );

      if (i === field.length - 1) {
        await weeklyTimeActivity
          .getByText(LABELS.atLeastOneWeekdayRequire)
          .isVisible();
        await weeklyTimeActivity.clickSettingsIcon();
      }
    }
  }
};

const useWeeklySettingsTest = async (page: Page, scenario: string) => {
  const company = getWeeklySettingsLoginData(scenario); // automation login data here
  scenario == USER_ROLES.timeTrackOnly
    ? await openQBOTT(page, company)
    : await openQBO(page, company);
  await overridePlugin(page);
  await page.setViewportSize({ width: 1200, height: 1000 });

  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  // navigate to trowser
  await weeklyTimeActivity.navigateToWeeklyTime();

  if (
    !USERS_TIME_ACTIVITY_NOTAPPLICABLE.split(',').includes(scenario) &&
    scenario !== USER_ROLES.timeTrackOnly
  ) {
    if (
      !USERS_TIME_ACTIVITY_NO_RELEVANT_FIELDS_SETTINGS_APPLICABLE.split(
        ',',
      ).includes(scenario)
    ) {
      //class field
      await useWeeklyTAClassFieldToggle(page, weeklyTimeActivity, scenario);
      console.log('1');
    } else {
      await validateRelevantFieldsSectionInSettingsNotAvailable(
        page,
        weeklyTimeActivity,
        scenario,
      );
      console.log('1');
    }

    if (
      !USERS_TIME_ACTIVITY_NO_RELEVANT_FIELDS_SETTINGS_APPLICABLE.split(
        ',',
      ).includes(scenario)
    ) {
      //service field
      await useWeeklyTAServiceFieldToggle(page, weeklyTimeActivity, scenario);
      console.log('2');
    } else {
      await validateRelevantFieldsSectionInSettingsNotAvailable(
        page,
        weeklyTimeActivity,
        scenario,
      );
      console.log('2');
    }

    if (
      !USERS_TIME_ACTIVITY_NO_RELEVANT_FIELDS_SETTINGS_APPLICABLE.split(
        ',',
      ).includes(scenario)
    ) {
      //Location field
      await useWeeklyTALocationFieldToggle(page, weeklyTimeActivity, scenario);
      console.log('3');
    } else {
      await validateRelevantFieldsSectionInSettingsNotAvailable(
        page,
        weeklyTimeActivity,
        scenario,
      );
      console.log('3');
    }

    if (
      !USERS_TIME_ACTIVITY_NO_RELEVANT_FIELDS_SETTINGS_APPLICABLE.split(
        ',',
      ).includes(scenario)
    ) {
      //paytype field
      await useWeeklyTAPayTypeFieldToggle(page, weeklyTimeActivity, scenario);
      console.log('4');
    } else {
      await validateRelevantFieldsSectionInSettingsNotAvailable(
        page,
        weeklyTimeActivity,
        scenario,
      );
      console.log('4');
    }

    if (
      !USERS_TIME_ACTIVITY_NO_RELEVANT_FIELDS_SETTINGS_APPLICABLE.split(
        ',',
      ).includes(scenario)
    ) {
      //billable field
      await useWeeklyTABillableFieldToggle(page, weeklyTimeActivity, scenario);
      console.log('5');
    } else {
      await validateRelevantFieldsSectionInSettingsNotAvailable(
        page,
        weeklyTimeActivity,
        scenario,
      );
      console.log('5');
    }

    if (
      !USERS_TIME_ACTIVITY_NO_RELEVANT_FIELDS_SETTINGS_APPLICABLE.split(
        ',',
      ).includes(scenario)
    ) {
      //cost rate field
      await useWeeklyTACostRateFieldToggle(page, weeklyTimeActivity, scenario);
      console.log('6');
    } else {
      await validateRelevantFieldsSectionInSettingsNotAvailable(
        page,
        weeklyTimeActivity,
        scenario,
      );
      console.log('6');
    }

    if (
      !USERS_TIME_ACTIVITY_NO_RELEVANT_FIELDS_SETTINGS_APPLICABLE.split(
        ',',
      ).includes(scenario)
    ) {
      //taxable field
      await useWeeklyTATaxableFieldToggle(page, weeklyTimeActivity, scenario);
      console.log('7');
    } else {
      await validateRelevantFieldsSectionInSettingsNotAvailable(
        page,
        weeklyTimeActivity,
        scenario,
      );
      console.log('7');
    }

    if (
      !USERS_TIME_ACTIVITY_NO_RELEVANT_FIELDS_SETTINGS_APPLICABLE.split(
        ',',
      ).includes(scenario)
    ) {
      //settings persists
      await useWeeklyTASettingPersists(page, weeklyTimeActivity, scenario);
      console.log('8');
    } else {
      await validateRelevantFieldsSectionInSettingsNotAvailable(
        page,
        weeklyTimeActivity,
        scenario,
      );
      console.log('8');
    }

    //column selection
    await useWeeklyTAColumnSelection(page, weeklyTimeActivity);
    console.log('9');

    //atleast one day required
    await useWeeklyTaAtLeastOneWeekdayRequire(page, weeklyTimeActivity);
    console.log('10');
  } else if (
    USERS_TIME_ACTIVITY_DRAWER_APPLICABLE.split(',').includes(scenario)
  ) {
    const status = await weeklyTimeActivity.validateDrawerVisibility();
    expect(status).toBeTruthy();
  } else if (scenario == USER_ROLES.timeTrackOnly) {
    await useWeeklyTAColumnSelectionTT(page, weeklyTimeActivity);
    console.log('time track only settings: 1');

    await useWeeklyTaAtLeastOneWeekdayRequireTT(page, weeklyTimeActivity);
    console.log('time track only settings: 2');
  } else {
    await weeklyTimeActivity.checkNoAccess();
  }
};
export { useWeeklySettingsTest };
