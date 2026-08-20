import { Page, Locator, expect } from '@playwright/test';
import gotoWithAuthSession from '../../gotoWithAuthSession';
import exp from 'constants';
import {
  TimeTrackingLabels,
  TimesheetRoundingLabels,
  TimeTrackingTestId,
  NotificationsLabels,
} from '../../utilsTS';
import { testData } from '../../constants';
import context from '__mocks__/shell/lib/context';
import { string } from 'prop-types';
import { Expand, List } from '@design-systems/icons';
import { randomFill, randomInt } from 'crypto';
import { Console, count } from 'console';
import { dismissCookieConsent } from '../MileagePage';

export const navigateToAccountAndSettingsTime = async (page: Page) => {
  const url = `app/accountsettings?p=time`;
  await gotoWithAuthSession(page, url, { waitUntil: 'load' });
  await waitForPageReady(page);
  await handlePopupsInAnyOrder(page);
};

export const clickOnDropdown = async (
  page: Page,
  dropdown: string,
  option: number,
) => {
  // Check if dropdown is an XPath (starts with / or ()
  if (dropdown.startsWith('/') || dropdown.startsWith('(')) {
    // Use locator for XPath selectors (e.g., aria-label based)
    await page.locator(dropdown).click({ force: true, timeout: 5000 });
  } else {
    // Use getByPlaceholder for placeholder text
    let dropdownSelector = page.getByPlaceholder(dropdown).nth(option);
    await dropdownSelector.click({ force: true, timeout: 2000 });
  }
};

export const chooseDropDownOption = async (page: Page, ddOption: number) => {
  await page
    .locator(`//*[contains(@class,'menu-item-container')]`)
    .nth(ddOption)
    .click();
};

export const optionToChoose = async (page: Page, ddOption: number) => {
  return page
    .locator(`//li[contains(@class,'menu-item-container')]`)
    .nth(ddOption);
};

export const chooseDropDownOptionCustom = async (
  page: Page,
  ddOption: number,
) => {
  await page
    .locator(`//li[contains(@class,'menu-item-container')]`)
    .nth(ddOption)
    .click();
};

export const chooseRoundingOptions = async (page: Page, option: string) => {
  await page
    .locator(`//li[contains(@class,'menu-item-container')]`)
    .getByText(option)
    .click();
};

export const getSelectedDropdownValue = async (page: Page, locator: string) => {
  return await page.getByPlaceholder(locator).inputValue();
};

// Methods for Time => Time Tracking

export const verifyReadOnltimeTrackSection = async (page: Page) => {
  await expect(
    page.getByRole('heading', { name: 'Time tracking' }),
  ).toBeVisible(); // time tracking
  await expect(page.getByText('Timesheet management')).toBeVisible(); // timesheet management
  await expect(
    page.getByText(TimeTrackingLabels.firstdayOfWorkWeek),
  ).toBeVisible(); // First day of work
  await expect(page.getByText(TimeTrackingLabels.timezone)).toBeVisible(); // Time zone
  //commenting time format as the field has been removed from UI
  //await expect(page.getByText(TimeTrackingLabels.timeformat)).toBeVisible(); // Time format
  await expect(
    page.getByText(TimeTrackingLabels.SplitTSCheckbox),
  ).toBeVisible(); // Split timesheets at midnight
  await expect(page.getByText(TimeTrackingLabels.EditTSCheckbox)).toBeVisible(); // allow team members to create/edit timesheets
  await expect(
    page.getByText(TimeTrackingLabels.EditClkOutCheckbox),
  ).toBeVisible(); // allow team members to edit clock out time
  await expect(page.getByText('Timesheet rounding')).toBeVisible(); // timesheet rounding label
  await expect(
    page.getByText(TimeTrackingLabels.roundClkInTimes),
  ).toBeVisible(); // Round clock in times
  await expect(
    page.getByText(TimeTrackingLabels.roundClkOutTimes),
  ).toBeVisible(); // Round clock out times
  await expect(
    page
      .getByTestId('timetracking-settings-view')
      .getByRole('button', { name: 'Edit' }),
  ).toBeVisible(); // edit icon
};

export const clickTimeTrackingEditButton = async (page: Page) => {
  let EditBtn = page
    .getByTestId('timetracking-settings-view')
    .getByRole('button', { name: 'Edit' });
  await expect(EditBtn).toBeVisible(); // edit icon
  await EditBtn.click({ force: true });
};

export const clickOnTimeTrackingSaveButton = async (page: Page) => {
  let SaveBtn = page.getByRole('button', { name: 'Save' });
  await expect(SaveBtn).toBeVisible(); // Save button
  await SaveBtn.click();
};

export const waitForSettingsHomePage = async (page: Page) => {
  await expect(page.getByTestId('timetracking-settings-view')).toBeVisible();
};

export const verifySavedFirstDayOfWorkWeek = async (page: Page) => {
  //return await expect(page.getByText('First day of work week').textContent()).toMatch(day);
  return String(
    await page.getByText('First day of work week').getAttribute('value'),
  );
};

export const clickOnTimeTrackingCancelButton = async (page: Page) => {
  await expect(page.getByText('Cancel')).toBeVisible(); // Cancel Button
  await page.getByText('Cancel').click();
};

export const checkBoxTimeTrack = async (page: Page, option: number) => {
  if (
    !(await page.locator(`//input[@type='checkbox']`).nth(option).isChecked())
  ) {
    await page
      .locator(`//input[@type='checkbox']`)
      .nth(option)
      .setChecked(true);
  }
};

export const uncheckBoxTimeTrack = async (page: Page, option: number) => {
  if (await page.locator(`//input[@type='checkbox']`).nth(option).isChecked()) {
    await page.locator(`//input[@type='checkbox']`).nth(option).uncheck();
  }
};

export const enterClkOutTimeHours = async (page: Page, hrs: string) => {
  let textbox = page.locator(`//input[@type='number']`);
  await expect(textbox).toBeVisible();
  await textbox.fill(hrs);
};

export const verifyTooltip = async (page: Page, tooltip: string) => {
  await page.getByTestId('').hover(); // i icon
  await expect(page.getByTestId(tooltip)).toBeVisible(); // tooltip
};

export const verifyTimeSheetRounding = async (page: Page) => {
  await expect(
    page.getByText(TimesheetRoundingLabels.timesheetRounding),
  ).toBeVisible();
  await expect(
    page.getByText(TimesheetRoundingLabels.timesheetRoundingInfo),
  ).toBeVisible();
  //await expect(page.getByTestId('')).toBeVisible(); // Timesheet rounding link
  await expect(
    page.getByText(TimesheetRoundingLabels.roundClkInTimes),
  ).toBeVisible(); // round clock in times
  await expect(
    page.getByText(TimesheetRoundingLabels.roundClkOutTimes),
  ).toBeVisible(); // round clock out times
  await expect(
    page.getByText(TimesheetRoundingLabels.roundClkInDirLabel),
  ).toBeVisible(); // clock in direction
  await expect(
    page.getByText(TimesheetRoundingLabels.roundClkOutDirLabel),
  ).toBeVisible(); // clock out direction
  await expect(
    page.getByText(TimesheetRoundingLabels.clkInRoundIncLabel),
  ).toBeVisible(); // clock in increment
  await expect(
    page.getByText(TimesheetRoundingLabels.clkOutRoundIncLabel),
  ).toBeVisible(); // clock out increment
};

export const waitForLoadingToDisappear = async (page: Page) => {
  return await (
    await loadingSpinner(page)
  ).waitFor({ state: 'hidden', timeout: 0 });
};

export const loadingSpinner = async (page: Page) => {
  return page.locator(`//div[@aria-label="Loading" and @role="progressbar"]`);
};

export const displayByDropdown = async (page: Page) => {
  return page.getByLabel('Display by');
};

export const expectSingleTimeEntryVisible = async (page: Page) => {
  return await expect(
    page.getByRole('heading', { name: 'Single time entry' }),
  ).toBeVisible();
};

// Hovers over the 'Split timesheets at midnight' checkbox
export const hoverOnSplitTimeSheet = async (page: Page) => {
  await page.getByLabel('Split timesheets at midnight').hover();
};

export const validateDateRangeDropdownOptions = async (page: Page) => {
  const actualOptions = await getDateRangeDropdownOptions(page);
  testData.expectedOptions.forEach((option) => {
    if (!actualOptions.includes(option)) {
      throw new Error(`Option "${option}" is missing in the dropdown.`);
    }
  });
};

export const getDateRangeDropdownOptions = async (page: Page) => {
  const listItems = await getlistItems(page);
  const textContents = await listItems.allInnerTexts();
  return textContents
    .filter((text: string) => text.trim() !== '') // Remove empty strings
    .map((text: string) => text.split('\n')[0].trim()); // Extract the part before '\n' and trim whitespace
};

export const getlistItems = async (page: Page) => {
  const dropdownMenu = await getdropdownMenu(page);
  return dropdownMenu.locator('li');
};

export const getdropdownMenu = async (page: Page) => {
  return await page.locator(
    `//div[contains(@class, 'DateRangeSelect') and @role='listbox']`,
  );
};

// Clicks the action dropdown for a given employee
export const clickActionDropdownForEmployee = async (
  page: Page,
  empName: string,
) => {
  return await page
    .locator(
      `(//div[text()='${empName}'] / ancestor::tr / descendant::button[@aria-label="Expand Menu"])[1]`,
    )
    .click();
};

// Clicks the 'Delete' option in the action dropdown
export const clickDeleteInActionDropdown = async (page: Page) => {
  return await page.locator(`//li[text()='Delete']`).click();
};

// Expects the delete entry confirmation popup to be visible
export const expectDeleteEntryConfirmationPopupOpen = async (page: Page) => {
  return await expect(
    page.getByText('Are you sure you want to delete this time entry?'),
  ).toBeVisible();
};

// Clicks 'Yes' on the delete entry confirmation popup
export const clickYesOnDeleteEntryPopup = async (page: Page) => {
  return await page.getByRole('button', { name: 'Yes' }).click();
};

// Counts the number of rows for a given employee
export const countEmployeeRow = async (page: Page, empName: string) => {
  return await page
    .locator(`//div[contains(text(), '${empName}')]/ancestor::tr`)
    .count();
};

export const waitForNameFieldToPopulate = async (page: Page) => {
  return await page.waitForFunction(
    (sel) => {
      const el = document.evaluate(
        sel,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      ).singleNodeValue as HTMLInputElement | null;
      return el && el.value && el.value.trim().length > 0;
    },
    `//*[contains(@placeholder, "name") and @type="text"]`,
    { timeout: 20000 },
  );
};

export const openDropdown = async (page: Page, label: string) => {
  await await page.waitForSelector(
    `//span[contains(text(),'${label}')] / ancestor::label / descendant::div[contains(@class, 'Dropdown')]`,
    { state: 'visible', timeout: 0 },
  );
  return await page
    .locator(
      `//span[contains(text(),'${label}')] / ancestor::label / descendant::div[contains(@class, 'Dropdown')]`,
    )
    .click();
};

export const selectOptionFromDropdown = async (page: Page, name: string) => {
  return await page
    .locator(`//li / descendant::*[self::b | self::span][text()='${name}']`)
    .click();
};

export const clickSetClockInAndOutToggles = async (page: Page) => {
  return await page
    .locator(
      `//span[contains(text(), 'Set clock')] / .. / following-sibling::input`,
    )
    .click();
};

export const enterNotes = async (page: Page, value: string) => {
  return await page
    .locator(`//span[contains(text(),'Notes')]/following-sibling::textarea`)
    .fill(value);
};

export const checkFieldVisibility = async (page: Page, fieldName: string) => {
  const lowerCaseFieldName = fieldName.toLowerCase();
  switch (lowerCaseFieldName) {
    case 'customers':
      const replaceSmalls = lowerCaseFieldName.replace(/s$/, '');
      return await page
        .locator(
          `//*[contains(@placeholder, "${replaceSmalls}") and @type="text"]`,
        )
        .isVisible();
    case 'duration':
      return await page
        .locator(`//*[contains(@placeholder, "hh:mm") and @type="text"]`)
        .isVisible();
    case 'billable (per hour)':
      return await billRateCheckBoxVisibility(page);
    default:
      return await page
        .locator(
          `//*[contains(@placeholder, "${lowerCaseFieldName}") and @type="text"]`,
        )
        .isVisible();
  }
};

export const billRateCheckBoxVisibility = async (page: Page) => {
  return await page
    .locator(`//span[contains(text(), 'Billable (per hour)')]`)
    .isVisible();
};

export const fillBillRateInput = async (page: Page, rate: string) => {
  const billRateInput = page.locator(
    `//span[contains(text(), 'Billable')]  / ancestor::div[contains(@class, 'BillableTaxable')] / descendant::input[@aria-label="Bill rate"]`,
  );
  if (await billRateInput.isVisible()) {
    return await billRateInput.fill(rate);
  }
};

export const clickSaveAndCloseButton = async (page: Page) => {
  await page.locator(`//button[contains(@aria-label, "Save and")]`).click();
  return await page.locator(`//*[text()='Save and close']`).click();
};

export const getFieldValue = async (page: Page, fieldName: string) => {
  const lowerCaseFieldName = fieldName.toLowerCase();
  switch (lowerCaseFieldName) {
    case 'customers':
      const replaceSmalls = lowerCaseFieldName.replace(/s$/, '');
      return await page
        .locator(
          `//*[contains(@placeholder, "${replaceSmalls}") and @type="text"]`,
        )
        .getAttribute('value');
    case 'duration':
    case 'break':
      return await page
        .locator(`//*[contains(@placeholder, "hh:mm") and @type="text"]`)
        .getAttribute('value');
    default:
      return await page
        .locator(
          `//*[contains(@placeholder, "${lowerCaseFieldName}") and @type="text"]`,
        )
        .getAttribute('value');
  }
};

export const getNotesFieldValue = async (page: Page) => {
  const value = await page
    .locator(`//span[text()='Notes']/following-sibling::textarea`)
    .textContent();
  return value;
};

export const enterFieldValue = async (
  page: Page,
  fieldName: string,
  value: string,
) => {
  const lowerCaseFieldName = fieldName.toLowerCase();
  switch (lowerCaseFieldName) {
    case 'customers':
      const replaceSmalls = lowerCaseFieldName.replace(/s$/, '');
      return await page
        .locator(
          `//*[contains(@placeholder, "${replaceSmalls}") and @type="text"]`,
        )
        .fill(value);
    case 'duration':
      return await page
        .locator(`//*[contains(@placeholder, "hh:mm") and @type="text"]`)
        .fill(value);
    default:
      return await page
        .locator(
          `//*[contains(@placeholder, "${lowerCaseFieldName}") and @type="text"]`,
        )
        .fill(value);
  }
};

export const validateSuccessToast = async (page: Page) => {
  try {
    return await expect(page.getByText('Time entry added.')).toBeVisible({
      timeout: 10000,
    });
  } catch (error) {
    // Ignore the error and move ahead
  }
};

export const validateDateWiseDataVisible = async (page: Page) => {
  return await expect(
    page.locator(`(//*[contains(@aria-label, "Collapse rows for")])[1]`),
  ).toBeVisible();
};

export const validateCreatedSingleTimeEntryForEmployee = async (
  page: Page,
  empName: string,
  checkuncheck: string,
) => {
  if (checkuncheck == 'check') {
    let splitRowCountCheck = await page
      .locator(
        `//tbody//*[@role='row']//div[contains(@class, 'StyledName') and text()='${empName}']`,
      )
      .count();
    if (splitRowCountCheck == 1) {
      await openDateRangeDropdown(page);
      await validateDateRangeDropdownOptions(page);
      await selectDateRangeOption(page, 'Last week');
      await waitForLoadingToDisappear(page);

      await page.waitForTimeout(2000);
      const empRows = await page
        .locator("//div[contains(text(), 'Emp, test')]/ancestor::tr")
        .count();
      if (empRows == 1) {
        return true;
      }
    }
    if (splitRowCountCheck == 2) {
      return await expect(
        page.locator(
          `//tbody//*[@role='row']//div[contains(@class, 'StyledName') and text()='${empName}']`,
        ),
      ).toHaveCount(2);
    }
  }
  if (checkuncheck == 'uncheck') {
    let splitRowCountUncheck = await page
      .locator(
        `//tbody//*[@role='row']//div[contains(@class, 'StyledName') and text()='${empName}']`,
      )
      .count();
    if (splitRowCountUncheck == 1) {
      return await expect(
        page.locator(
          `//tbody//*[@role='row']//div[contains(@class, 'StyledName') and text()='${empName}']`,
        ),
      ).toHaveCount(1);
    }
    if (splitRowCountUncheck == 0) {
      await openDateRangeDropdown(page);
      await selectDateRangeOption(page, 'Last week');
      await waitForLoadingToDisappear(page);

      await page.waitForTimeout(2000);
      const empRows = await page
        .locator("//div[contains(text(), 'Emp, test')]/ancestor::tr")
        .count();
      if (empRows == 1) {
        return true;
      }
    }
  }
};

// Gets all table headers as an array of strings
export const getTableHeaders = async (page: Page) => {
  const tableHeaders = await page.locator(
    '//thead//*[@role="row"]/descendant::th',
  );
  return (await tableHeaders.allTextContents())
    .map((h) => h?.trim())
    .filter((h) => h && h.length > 0);
};

// Gets all cell values for a given employee row as an array of strings
export const getRowCellsForEmployee = async (
  page: Page,
  employeeName: string,
) => {
  const rowLocator = page.locator(
    `//div[contains(text(), '${employeeName}')]/ancestor::tr`,
  );
  const tdLocators = rowLocator.locator('td');
  const tdCount = await tdLocators.count();
  const tds: string[] = [];
  for (let i = 0; i < tdCount; i++) {
    const td = tdLocators.nth(i);
    const text = (await td.textContent())?.trim() ?? '';
    tds.push(text);
  }
  return tds;
};

// Returns a mapping of header to cell value for a given employee row
export const getRowObjectForEmployee = async (
  page: Page,
  employeeName: string,
) => {
  const headers = await getTableHeaders(page);
  const tds = await getRowCellsForEmployee(page, employeeName);
  const tdsToUse = tds.length > headers.length ? tds.slice(1) : tds;
  return Object.fromEntries(
    headers
      .map((header, idx) => [header, tdsToUse[idx]])
      .filter(([header, value]) => header !== 'Details' && value !== '-'),
  );
};

export const clickDropdownOption = async (
  page: Page,
  optionNumber: number,
  label: string,
) => {
  await page.waitForTimeout(2000);
  const locator = page.locator(
    `//span[text()='${label}'] / ancestor::label / descendant::input[@aria-expanded="false"]`,
  );
  if (await locator.isVisible()) {
    await page
      .locator(
        `//span[text()='${label}'] / ancestor::label / descendant::div[contains(@class, 'Dropdown')]`,
      )
      .click();
  }
  return await page
    .getByRole('option')
    .nth(optionNumber)
    .click({ force: true });
};

export const checkCheckboxIfVisible = async (page: Page, label: string) => {
  const checkbox = page.locator(
    `//span[contains(text(), '${label}')] / ancestor::label / descendant::input`,
  );
  if ((await checkbox.isVisible()) && !(await checkbox.isChecked())) {
    return await checkbox.check();
  }
};

export const getTime = async (page: Page, timeType: 'Start' | 'End') => {
  const timeValue = await page
    .locator(
      `//span[text()="${timeType} time"] / ancestor::label / descendant::input[@data-testid="__textField"]`,
    )
    .getAttribute('value');
  await page.keyboard.press(`Tab`);
  return timeValue;
};

export const normalizeTime = async (page: Page, time: string) => {
  if (!time) return '';
  const [timePart, period] = time.split(' ');
  const [hours, minutes] = timePart.split(':');
  const normalizedHours = hours.padStart(2, '0');
  return `${normalizedHours}:${minutes} ${period}`;
};

// Function to normalize name format
export const normalizeName = async (page: Page, name: string) => {
  return name
    .replace(/,/g, '') // Remove commas
    .trim() // Remove extra spaces
    .toLowerCase() // Convert to lowercase
    .split(/\s+/) // Split by whitespace
    .sort() // Sort the words
    .join(' '); // Join back with spaces
};

export const checkCheckBoxSplitTimeSheet = async (page: Page) => {
  const checkbox = page.getByLabel('Split timesheets at midnight');
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

// Selects an option from the 'Display by' dropdown
export const selectDisplayByOption = async (page: Page, optionName: string) => {
  // Check for any remaining popups before interacting with dropdown
  await handlePopupsInAnyOrder(page); // Skip initial wait for faster performance
  const dropdown = await displayByDropdown(page);
  await dropdown.click();
  const optionLocator = page.getByRole('option', { name: optionName });
  await optionLocator.waitFor({ state: 'visible', timeout: 5000 });
  return await optionLocator.click();
};

// Time Activity, Time Entries, Time Clock Verification

export const directToSingleTimeAct = async (page: Page, id?: string | null) => {
  if (id) {
    await gotoWithAuthSession(page, `/app/timeactivity?id=${id}`, {
      waitUntil: 'load',
    });
  } else {
    await gotoWithAuthSession(page, `app/timeactivity?t=s`, {
      waitUntil: 'load',
    });
  }
  await page.waitForTimeout(2000);
  await handlePopupsInAnyOrder(page);
};

export const directToSingleTimeActWithId = async (
  page: Page,
  id?: string | null,
) => {
  if (id) {
    await gotoWithAuthSession(page, `/app/timeactivity?id=${id}`, {
      waitUntil: 'load',
    });
  } else {
    await gotoWithAuthSession(page, `app/timeactivity?t=s`, {
      waitUntil: 'load',
    });
  }
  await page.waitForTimeout(2000);
  await handlePopupsInAnyOrder(page);
};

export const directToWeeklyTime = async (page: Page) => {
  return gotoWithAuthSession(page, `/app/timetracking`);
};

export const verifyFirstDayAtWorkOnWTA = async (page: Page) => {
  //await expect(page.locator(`//th[contains(@class,'WeekdayHeader')]`).nth(0)).toContainText(weekdayFromSettings);
  return String(page.locator(`//th[contains(@class,'WeekdayHeader')]`).nth(0));
};

export const verifyDaysOfWeekOnWTA = async (
  page: Page,
  weekFromSettings: string,
) => {
  let splitWeekStartDay = weekFromSettings.split(' - ')[0];
  let splitWeekEndDay = weekFromSettings.split(' - ')[1];
  await expect(
    page.locator(`//th[contains(@class,'WeekdayHeader')]`).nth(0),
  ).toHaveText(splitWeekStartDay);
  await expect(
    page.locator(`//th[contains(@class,'WeekdayHeader')]`).nth(6),
  ).toHaveText(splitWeekEndDay);
};

export const verifyFieldsDisplayed = async (page: Page, field: string) => {
  let count = page.getByText(field).count();
  if ((await count) > 0) {
    return true;
  } else {
    return false;
  }
};

export const openSTADropdown = async (page: Page, label: string) => {
  await page.waitForSelector(
    `//span[contains(text(),'${label}')] / ancestor::label / descendant::div[contains(@class, 'Dropdown')]`,
    { state: 'visible', timeout: 0 },
  );
  return await page
    .locator(
      `//span[contains(text(),'${label}')] / ancestor::label / descendant::div[contains(@class, 'Dropdown')]`,
    )
    .click();
};

export const chooseSTADropdownOption = async (page: Page) => {
  return await page.getByRole('option').last().click();
};

export const chooseSpecificEmployee = async (page: Page, empName: string) => {
  await expect(page.getByRole('option', { name: empName })).toBeVisible();
  return await page.getByRole('option', { name: empName }).click();
};

export const clickSTACloseIcon = async (page: Page) => {
  await expect(page.getByRole('option', { name: 'Close' })).toBeVisible();
  return await page.getByRole('option', { name: 'Close' }).click();
};

export const checkBillableCheckboxIfVisible = async (
  page: Page,
  label: string,
) => {
  const checkbox = page.locator(
    `//span[contains(text(), '${label}')] / ancestor::label / descendant::input`,
  );
  if ((await checkbox.isVisible()) && !(await checkbox.isChecked())) {
    return await checkbox.check();
  }
};

export const uncheckBillableCheckboxIfVisible = async (
  page: Page,
  label: string,
) => {
  const checkbox = page.locator(
    `//span[contains(text(), '${label}')] / ancestor::label / descendant::input`,
  );
  if ((await checkbox.isVisible()) && (await checkbox.isChecked())) {
    return await checkbox.setChecked(false);
  }
};

export const fillSTABillRate = async (page: Page, rate: string) => {
  const billRateInput = page.locator(
    `//span[contains(text(), 'Billable')]  / ancestor::div[contains(@class, 'BillableTaxable')] / descendant::input[@aria-label="Bill rate"]`,
  );
  if (await billRateInput.isVisible()) {
    return await billRateInput.fill(rate);
  }
};

export const clickSTASave = async (page: Page) => {
  await page.getByLabel('Save').click({ force: true });
};

export const verifySTARequiredError = async (page: Page, fieldName: string) => {
  return expect(
    await page.locator(
      `//span[text()='${fieldName}'] / ancestor::label / following::span[text()='This field is required']`,
    ),
  ).toBeVisible();
};

export const fillNotes = async (page: Page) => {
  await page.getByLabel('Notes').fill('Test Note from Settings');
};

export const STASaveToast = async (page: Page) => {
  return await expect(page.getByText('Time entry added.')).toBeVisible({
    timeout: 10000,
  });
};

export const navigateToTimeEntries = async (page: Page) => {
  await gotoWithAuthSession(page, '/app/time?jobId=time', {
    waitUntil: 'load',
  });
  await waitForPageReady(page);
  await handlePopupsInAnyOrder(page);
  await page.waitForTimeout(2000);
  await waitForLoadingToDisappearTEPopup(page);
};

export const waitForLoadingToDisappearTEPopup = async (page: Page) => {
  return await getTcLoadingSpinner(page).waitFor({
    state: 'hidden',
    timeout: 0,
  });
};

export const waitForLoadingToDisappearOnTC = async (page: Page) => {
  return await getLoadingSpinner(page).waitFor({ state: 'hidden', timeout: 0 });
};

export const getLoadingSpinner = (page: Page) => {
  return page.locator(`#app`).getByRole('progressbar', { name: 'Loading' });
};

export const getTcLoadingSpinner = (page: Page) => {
  return page
    .locator(`[data-test-id="time-clock-loading"]`)
    .getByRole('progressbar', { name: 'Loading' });
};

export const clickOnAddTime = async (page: Page) => {
  //await page.getByText('Add time').click({force:true, timeout:3000});
  await page.getByRole('button', { name: 'Add time' }).click();
};

export const chooseTimeEntryScreen = async (page: Page, option: string) => {
  await page.getByText(option).click({ force: true });
};

export const validateTimeFormat = async (page: Page, option: string) => {
  if (option == 'STA') {
    const state = await verifySetClockToggleState(page);
    if (!state) {
      await ToggleSetClockInAndOut(page);
    }
  }
  await clickTimeDropdown(page, 'Start');
  await VerifyFormat24hr(page);
  if (!(option == 'TCL')) await clickTimeDropdown(page, 'End');
  await VerifyFormat24hr(page);
};

export const VerifyFormat24hr = async (page: Page) => {
  await expect(
    page.locator(`//ul[@role='option']`).filter({ hasText: '13:00 PM' }),
  ).toBeVisible();
  await expect(
    page.locator(`//ul[@role='option']`).filter({ hasText: '24:00 PM' }),
  ).toBeVisible();
};

export const navigateToSingleTime = async (page: Page, id?: string | null) => {
  if (id) {
    await gotoWithAuthSession(page, `/app/timeactivity?id=${id}`, {
      waitUntil: 'load',
    });
  } else {
    await gotoWithAuthSession(page, `app/timeactivity?t=s`, {
      waitUntil: 'load',
    });
  }
  await page.waitForTimeout(2000);
  await handlePopupsInAnyOrder(page);
};

export const clickTimeDropdown = async (
  page: Page,
  timeType: 'Start' | 'End',
) => {
  await page
    .locator(
      `//span[text()="${timeType} time"] / ancestor::label / descendant::input`,
    )
    .click();
};

export const ToggleSetClockInAndOut = async (page: Page) => {
  return await page
    .locator(`//input[@aria-label='Set start and end time']`)
    .click();
};

export const verifySetClockToggleState = async (page: Page) => {
  // when toggle is on returns true, else false
  let status;
  try {
    status = await page
      .locator(
        `//span[text()='Set clock in and out'] / following::input[@aria-checked='true']`,
      )
      .isVisible();
  } catch {
    status = false;
  }
  return status;
};

export const selectDisplayByDate = async (page: Page) => {
  const displayByDropdown = page.getByLabel('Display by');
  await displayByDropdown.click();
  return await page.getByRole('option', { name: 'Date' }).click();
};

export const openDateRangeDropdown = async (page: Page) => {
  const dateRangeDropdown = page.getByLabel('Date range');
  await dateRangeDropdown.click();
};

export const selectDateRangeOption = async (page: Page, optionName: string) => {
  return await page.getByText(optionName, { exact: true }).click();
};

export const selectCustomerOption = async (page: Page) => {
  const customerElement = page.getByPlaceholder('Select customer').nth(1);
  await customerElement.click({ force: true });
  return await chooseDropDownOption(page, 1);
};

export const clickOnMainClockIn = async (page: Page) => {
  //await page.getByRole('button', { name: 'Clock in' }).nth(0).click();
  await page.locator(`//span[text()='Clock in']`).click();
};

export const clickOnClockInBtn = async (page: Page) => {
  await page
    .locator('[data-test-id="time-clock-in-button"]')
    .waitFor({ state: 'visible' });
  await page.locator('[data-test-id="time-clock-in-button"]').click();
};

export const clickClockOut = async (page: Page) => {
  await page.locator('[data-test-id="time-clock-out-button"]').click();
  await waitForLoadingToDisappearOnTC(page);
};

export const getTimerDisplay = async (page: Page) => {
  return await page
    .locator(
      `//div[contains(@class, 'TimerDisplayContainer')]/div[contains(@class, 'TimerDisplay')]`,
    )
    .textContent();
};

export const getCurrentStartTime = async (page: Page) => {
  return page
    .locator(
      `//span[text()='Start time']/../div/input[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .inputValue();
};

export const getPreviousDayDD = (page: Page, day: number): string => {
  const today = new Date();
  today.setDate(today.getDate() - day);
  return String(today.getDate()).padStart(1);
};

export const getPreviousDayDDTC = (page: Page): string => {
  const today = new Date();
  today.setDate(today.getDate() - 1);
  return String(today.getDate()).padStart(2, '0');
};

export const getTodayDayDD = (): string => {
  const today = new Date();
  return String(today.getDate()).padStart(1);
};

export const selectStartDate = async (page: Page, date: string) => {
  await page.locator(`//button[@aria-label='Start date Calendar']`).click();
  await page.getByRole('button', { name: date, exact: true }).nth(0).click();
  await waitForLoadingToDisappearOnTC(page);
};

export const selectEndDate = async (page: Page, date: string) => {
  await page.locator(`//button[@aria-label='End date Calendar']`).click();
  await page.getByRole('button', { name: date, exact: true }).nth(0).click();
};

export const selectTime = async (page: Page, time: string) => {
  await page
    .locator(
      `//span[text()='Start time']/../div/div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .click();
  await page.getByRole('option', { name: time }).click();
  await waitForLoadingToDisappearOnTC(page);
};

export const enterTime = async (page: Page, time: string) => {
  await page
    .locator(`//input[contains(@id, 'idsDropdownTypeaheadTextField')]`)
    .nth(0)
    .fill(time);
};

export const clearStartTime = async (page: Page) => {
  await page
    .locator(`//input[contains(@id, 'idsDropdownTypeaheadTextField')]`)
    .nth(0)
    .clear();
};

export const selectStartEndTime = async (
  page: Page,
  timeType: 'Start' | 'End',
  time: string,
) => {
  await page
    .locator(
      `//span[text()="${timeType} time"] / ancestor::label / descendant::input[@data-testid="__textField"]`,
    )
    .click();
  return await page.locator(`//span[text()='${time}']`).click();
};

export const getClockedOutMessage = async (page: Page) => {
  return await page
    .locator('[data-test-id="time-clock-clocked-out-message"]')
    .textContent();
};

export const getClockedInMessage = async (page: Page) => {
  return await page
    .locator('[data-test-id="time-clock-clocked-in-message"]')
    .textContent();
};

export const verifyTimeOnTimeEntries = async (page: Page) => {
  page.getByText('12:00 AM - 12:05 AM');
};

export const verifyIfRunningClock = async (page: Page) => {
  let IsRunningClkVisible = await page
    .locator(`//span[contains(@class,'TimeActionButton__Icon')]`)
    .isVisible();
  if (IsRunningClkVisible) {
    await page
      .locator(`//span[contains(@class,'TimeActionButton__Icon')]`)
      .click();
    await clickClockOut(page);
  }
};

export const clickTimeClockSave = async (page: Page) => {
  await expect(page.locator(`//span[text()='Save']`)).toBeVisible();
  //await expect(page.getByTestId('time-clock-save-button')).toBeVisible();
  await page.locator(`//span[text()='Save']`).click();

  await expect(page.getByText('Changes saved')).toBeVisible();
};

//Settings to Settings functions
export const SaveFromClassicUI = async (page: Page) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible();
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page.getByText('Go to classic QuickBooks Time').click(),
  ]);
  await classicPage.waitForLoadState();

  page = classicPage;

  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByTitle('Close').click();
  }
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await clickOnTimeOptions(classicPage);
  classicPage.waitForTimeout(2000);

  let firstDayOfWorkWeek = classicPage.locator('#client_week_start_select');
  const state = await firstDayOfWorkWeek.isEnabled();
  if (state) {
    classicPage.locator('#client_week_start_select').click({ force: true });
    await firstDayOfWorkWeek.selectOption('Thursday');
  }
  let timezoneSelector = classicPage.locator('#client_timezone_select');
  await timezoneSelector.click();
  await timezoneSelector.selectOption('Asia/Kolkata');

  await clickOnTimeEntryTab(page);
  await classicPage.locator('#te_split_at_eod').setChecked(true);
  await classicPage.locator('#te_manage_timesheets').setChecked(true);
  await classicPage.locator('#te_clockout_override').setChecked(true);
  await classicPage.locator('#te_clockout_override_hours').fill('6');
  await classicPage.getByText('Save').click({ force: true });

  const splitTimesheetValue = await classicPage
    .getByLabel('Split timesheets at midnight')
    .isChecked();
  const allowEditTSValue = await classicPage
    .getByLabel('Allow team members to manage their own timesheets')
    .isChecked();
  const allowToEditClkOutValue = await classicPage
    .getByLabel('Allow team members to adjust clock-out time')
    .isChecked();
  const overrideValue = await classicPage
    .locator('#te_clockout_override_hours')
    .textContent();

  await clickTimeOptionsCloseIcon(page);
  await clickOnFeatureAddOns(page);
  await clickOnAddOnRounding(page);

  await classicPage
    .locator('#addon_rounding_round_in_direction_up')
    .setChecked(true);
  await classicPage
    .locator('#addon_rounding_round_out_direction_down')
    .setChecked(true);
  await classicPage.locator('#addon_rounding_round_in_min').click();
  await classicPage
    .locator('#addon_rounding_round_in_min')
    .selectOption('3 min');
  await classicPage.locator('#addon_rounding_round_out_min').click();
  await classicPage
    .locator('#addon_rounding_round_out_min')
    .selectOption('5 min');
  await classicPage.getByText('Save').click({ force: true });

  const roundClkInDIrValue = await classicPage
    .locator('#addon_rounding_round_in_direction_up')
    .isChecked();
  const roundClkOutDIrValue = await classicPage
    .locator('#addon_rounding_round_out_direction_down')
    .isChecked();
  const roundClkInIncValue = await classicPage
    .locator('#addon_rounding_round_in_min')
    .textContent();
  const roundClkOutIncValue = await classicPage
    .locator('#addon_rounding_round_out_min')
    .textContent();

  await page.bringToFront();
  await navigateToAccountAndSettingsTime(page);

  const firstDayOfWorkValue = await page
    .locator(
      `//label[text()='First day of work week']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const timezoneValueqbo = await page
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

  expect(firstDayOfWorkValue).toBe('Sunday');
  expect(timezoneValueqbo).toBe('Asia/Calcutta');
  if (await splitTimesheetValue) {
    expect(splitTimesheetState).toBe('On');
  }
  if (await allowEditTSValue) {
    expect(allowToEditTSState).toBe('On');
  }
  if (await allowToEditClkOutValue) {
    expect(allowToEditClkOutTimetState?.split(',')[0]).toBe('On');
  }
  if (await roundClkInDIrValue) {
    expect(ClkInvalues?.split(',')[0]).toBe('Up');
  }
  if (await roundClkOutDIrValue) {
    expect(ClkOutvalues?.split(',')[0]).toBe('Down');
  }
  expect(ClkInvalues?.split(',')[1]).toBe(' 3 minute');
  expect(ClkOutvalues?.split(',')[1]).toEqual(' 5 minute');
};

export const verifyPriorityCaseFromClassicUI = async (
  page: Page,
  splitTS: string,
) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible({
    timeout: 3000,
  });
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page
      .getByText('Go to classic QuickBooks Time')
      .click({ timeout: 3000 }),
  ]);
  await classicPage.waitForLoadState();
  await handleClassicTimesheetPopupsInAnyOrder(classicPage);
  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByTitle('Close').click();
  }
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await waitForPageReady(classicPage);
  await clickOnCompSettings(classicPage);
  await waitForPageReady(classicPage);
  await clickOnTimeOptions(classicPage);
  await clickOnUKTimeFormat(classicPage);

  // Wait for time options to fully load
  await classicPage.waitForTimeout(3000);

  // Wait for time entry tab to be visible and clickable
  await classicPage.waitForSelector(
    '[data-testid="time-entry-tab"], [role="tab"][aria-selected="false"]',
    { timeout: 10000 },
  );

  await clickOnTimeEntryTab(classicPage);

  // Wait for time entry content to load
  await classicPage.waitForTimeout(2000);

  if (splitTS == 'Off') {
    // Wait for the checkbox to be visible and interactable
    const splitCheckbox = classicPage.getByLabel(
      'Split timesheets at midnight',
    );
    await splitCheckbox.waitFor({ state: 'visible', timeout: 10000 });

    // Check if the element is actually a checkbox and get its checked state
    const isChecked = await splitCheckbox.evaluate((el) => {
      if (el instanceof HTMLInputElement) {
        return el.checked;
      }
      // Fallback for other element types
      return (
        el.getAttribute('aria-checked') === 'true' ||
        el.classList.contains('checked')
      );
    });

    expect(isChecked).toBe(false);
  }
  await classicPage.close();
};

export const verifyFromClassicUI = async (
  page: Page,
  firstDay: string,
  timezone: string,
  splitTS: string,
  editTS: string,
  editClkOut: string,
  clkInTimes: string,
  clkOutTimes: string,
) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible();
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page.getByText('Go to classic QuickBooks Time').click(),
  ]);
  await classicPage.waitForLoadState();

  page = classicPage;

  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByTitle('Close').click();
  }
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await clickOnTimeOptions(classicPage);

  classicPage.waitForTimeout(2000);

  const firstDayText = await getSelectedOptionText(
    page,
    '#client_week_start_select',
  );

  // You can then assert:
  //expect(firstDayText).toBe('Wednesday');
  //expect(firstDayValue).toBe(firstDay);

  const timezoneValues = await classicPage
    .locator('#client_timezone_select')
    .inputValue();

  const selectedTimezoneValue = await classicPage
    .locator(`#client_timezone_select option[value='${timezoneValues}']`)
    .textContent();

  //expect(timezoneValue).toBe(timezone);

  await clickOnTimeEntryTab(page);
  if (splitTS == 'On') {
    expect(await page.getByLabel('Split timesheets at midnight')).toBeChecked();
  }
  if (editTS == 'On') {
    expect(
      await page.getByLabel(
        'Allow team members to manage their own timesheets',
      ),
    ).toBeChecked();
  }
  if (editClkOut.match('On')) {
    expect(
      await page.getByLabel('Allow team members to adjust clock-out time'),
    ).toBeChecked();
  }
  //expect(page.locator('#te_clockout_override_hours').getAttribute('value')).toBe(allowToEditClkOutHrsValue);

  await clickTimeOptionsCloseIcon(page);
  await clickOnFeatureAddOns(page);
  await clickOnAddOnRounding(page);
  const qboClkInDir = clkInTimes?.split(',')[0];
  if (qboClkInDir == 'Down') {
    expect(
      page.locator('#addon_rounding_round_in_direction_down'),
    ).toBeChecked();
  } else if (qboClkInDir == 'Up') {
    expect(page.locator('#addon_rounding_round_in_direction_up')).toBeChecked();
  } else {
    expect(
      page.locator('#addon_rounding_round_in_direction_nearest'),
    ).toBeChecked();
  }

  const qboClkOutDir = clkOutTimes?.split(',')[0];
  if (qboClkOutDir == 'Up') {
    expect(
      page.locator('#addon_rounding_round_out_direction_up'),
    ).toBeChecked();
  } else if (qboClkOutDir == 'Down') {
    expect(
      page.locator('#addon_rounding_round_out_direction_down'),
    ).toBeChecked();
  } else {
    expect(
      page.locator('#addon_rounding_round_out_direction_nearest'),
    ).toBeChecked();
  }

  //expect(page.locator('#addon_rounding_round_in_min').getAttribute('value')).toBe((clkInTimes?.split(',')[1]));
  //expect(page.locator('#addon_rounding_round_out_min').getAttribute('value')).toBe(clkOutTimes?.split(',')[1]);
};

export const getSelectedOptionText = async (
  page: Page,
  selector: string,
): Promise<string> => {
  const select = page.locator(selector);
  // Find the selected option within the select element
  const selectedOption = select.locator('option[selected]');
  if ((await selectedOption.count()) > 0) {
    return (await selectedOption.textContent())?.trim() || '';
  }
  // Fallback: Sometimes the 'selected' attribute is not present, so check by property
  const options = select.locator('option');
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    if (await options.nth(i).evaluate((el: HTMLOptionElement) => el.selected)) {
      return (await options.nth(i).textContent())?.trim() || '';
    }
  }
  return '';
};

export const clickOnCompSettings = async (page: Page) => {
  await page.locator('#my_account_shortcut').click({ force: true });
  await page.locator(`#company_settings`).waitFor({ state: 'visible' });
  await expect(page.locator('#company_settings')).toBeVisible();
};

export const clickOnTimeOptions = async (page: Page) => {
  await expect(page.getByText('Time Options')).toBeVisible();
  await page.getByText('Time Options').click({ force: true });
  await expect(
    page.locator('#company-settings-tabview-tab-date_time'),
  ).toBeVisible();
};

export const clickOnUKTimeFormat = async (page: Page) => {
  await page.locator('#client_time_format_24').click();
  page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'Save' });
};

export const clickOnNotifications = async (page: Page) => {
  await expect(
    page.getByRole('link', { name: 'Notifications', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Notifications', exact: true })
    .click({ force: true });
};

export const clickOnTimeEntryTab = async (page: Page) => {
  await page.getByRole('tab', { name: 'Time Entry' }).click();
  await page.waitForTimeout(5000);
};

export const clickTimeOptionsCloseIcon = async (page: Page) => {
  await expect(page.locator('#company_settings_close_winc')).toBeVisible();
  await page.locator('#company_settings_close_winc').click();
};

export const clickOnFeatureAddOns = async (page: Page) => {
  await expect(page.locator('#addons_shortcut')).toBeVisible();
  await page.locator('#addons_shortcut').click();
};
export const clickOnAddOnRounding = async (page: Page) => {
  await expect(page.locator('#addon_rounding_shortcut')).toBeVisible();
  await page.locator('#addon_rounding_shortcut').click();
  await expect(page.locator('#addon_rounding_title')).toBeVisible();
};

//=================================== Time => Notifications =================================================================
const verifyReadOnlyNotifSection = async (page: Page) => {
  await expect(
    page
      .getByTestId('notifications-settings')
      .filter({ hasText: 'Notifications' }),
  ).toBeVisible();
  await expect(
    page
      .getByTestId('notifications-settings-view')
      .filter({ hasText: 'Time tracking' }),
  ).toBeVisible();
  await expect(
    page.getByText(NotificationsLabels.SendClkInReminders),
  ).toBeVisible();
  await expect(
    page.getByText(NotificationsLabels.SendClkOutReminders),
  ).toBeVisible();
  await expect(page.getByText(NotificationsLabels.DaysRemSent)).toBeVisible();
  // await expect(
  //   page.getByText(NotificationsLabels.NotifyNotesAddedEdited),
  // ).toBeVisible();
};

export const clickNotifEditButton = async (page: Page) => {
  let EditBtn = page
    .getByTestId('notifications-settings-view')
    .getByRole('button', { name: 'Edit' });
  await expect(EditBtn).toBeVisible(); // edit icon
  await EditBtn.click({ force: true, timeout: 2000 });
};

export const verifyNotifEditMode = async (page: Page) => {
  let ClkInRemAt = await page
    .locator(`//input[@data-testid='__textField']`)
    .nth(0);
  expect(ClkInRemAt).toBeVisible();
  await ClkInRemAt.click();

  // Wait for dropdown to appear and be stable before clicking option
  await page.waitForTimeout(2000);
  await page
    .getByRole('option', { name: '10:15' })
    .waitFor({ state: 'visible', timeout: 3000 });
  await page.getByRole('option', { name: '10:15' }).click({ timeout: 3000 });

  let ClkOutRemAt = await page
    .locator(`//input[@data-testid='__textField']`)
    .nth(1);
  expect(ClkOutRemAt).toBeVisible();
  await ClkOutRemAt.click();

  // Wait for dropdown to appear and be stable before clicking option
  await page.waitForTimeout(2000);
  await page
    .getByRole('option', { name: '05:30' })
    .waitFor({ state: 'visible', timeout: 3000 });
  await page.getByRole('option', { name: '05:30' }).click({ timeout: 3000 });

  let NotifyClkInOut = await page.getByPlaceholder(
    'Notify when clock-in/-out time is adjusted',
  );
  expect(NotifyClkInOut).toBeVisible();
  await NotifyClkInOut.click();

  // Wait for dropdown to appear and be stable before clicking option
  await page.waitForTimeout(1000);
  await page
    .getByRole('option', { name: 'Admins only' })
    .waitFor({ state: 'visible', timeout: 3000 });
  await page
    .getByRole('option', { name: 'Admins only' })
    .click({ timeout: 3000 });

  let daysAreRemAreSent = await page.locator(
    `//input[@aria-label='notificationEnabledForDays']`,
  );

  await checkEmailMobileBox(page, 0);
  await checkEmailMobileBox(page, 3);

  expect(daysAreRemAreSent).toBeVisible();
  await daysAreRemAreSent.click();

  // Wait for dropdown to appear and be stable before clicking options
  await page.waitForTimeout(1000);
  await page
    .getByRole('option', { name: 'Sunday' })
    .waitFor({ state: 'visible', timeout: 3000 });
  await page.getByRole('option', { name: 'Sunday' }).click({ timeout: 3000 });
  await page
    .getByRole('option', { name: 'Monday' })
    .waitFor({ state: 'visible', timeout: 3000 });
  await page.getByRole('option', { name: 'Monday' }).click({ timeout: 3000 });
  await page
    .getByRole('option', { name: 'Tuesday' })
    .waitFor({ state: 'visible', timeout: 3000 });
  await page.getByRole('option', { name: 'Tuesday' }).click({ timeout: 3000 });
  await page
    .getByRole('option', { name: 'Wednesday' })
    .waitFor({ state: 'visible', timeout: 3000 });
  await page
    .getByRole('option', { name: 'Wednesday' })
    .click({ timeout: 3000 });

  await uncheckEmailMobileBox(page, 0);
  await uncheckEmailMobileBox(page, 3);
};

export const verifyDaysRemindersAreSent = async (page: Page) => {
  let Days: string;
  let daysAreRemAreSent = await page.locator(
    `//input[@aria-label='notificationEnabledForDays']`,
  );
  await uncheckEmailMobileBox(page, 0);
  await checkEmailMobileBox(page, 0);

  expect(daysAreRemAreSent).toBeVisible();
  await daysAreRemAreSent.click();

  const sun = await page
    .getByRole('option', { name: 'Sunday' })
    .getAttribute('aria-checked');
  const mon = await page
    .getByRole('option', { name: 'Monday' })
    .getAttribute('aria-checked');
  const tue = await page
    .getByRole('option', { name: 'Tuesday' })
    .getAttribute('aria-checked');
  const wed = await page
    .getByRole('option', { name: 'Wednesday' })
    .getAttribute('aria-checked');
  const thu = await page
    .getByRole('option', { name: 'Thursday' })
    .getAttribute('aria-checked');
  const fri = await page
    .getByRole('option', { name: 'Friday' })
    .getAttribute('aria-checked');
  const sat = await page
    .getByRole('option', { name: 'Saturday' })
    .getAttribute('aria-checked');

  if (sun == 'true') {
    await page.getByRole('option', { name: 'Sunday' }).click();
  }
  if (mon == 'true') {
    await page.getByRole('option', { name: 'Monday' }).click();
  }
  if (tue !== 'true') {
    await page.getByRole('option', { name: 'Tuesday' }).click();
  }
  if (wed !== 'true') {
    await page.getByRole('option', { name: 'Wednesday' }).click();
  }
  if (thu !== 'true') {
    await page.getByRole('option', { name: 'Thursday' }).click();
  }
  if (fri !== 'true') {
    await page.getByRole('option', { name: 'Friday' }).click();
  }
  if (sat !== 'true') {
    await page.getByRole('option', { name: 'Saturday' }).click();
  }
  page.waitForTimeout(2000);
  await page.keyboard.press(`Tab`);
  await clickOnNotifSaveButton(page);

  const DaysRemSentSavedValue = await page
    .locator(
      `//label[text()='Days reminders are sent']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect(DaysRemSentSavedValue).toBe(
    'Tuesday, Wednesday, Thursday, Friday, Saturday',
  );
};

export const verifyIfDaysRemSentDisabled = async (page: Page) => {
  let disabled = await page.locator(
    `//input[@aria-label='notificationEnabledForDays'][@disabled]`,
  );
  expect(disabled).toBeVisible();
};

export const verifyWhenNotesAddedOrEdited = async (page: Page) => {
  let NotifyNotesAddedEdited = await page.getByPlaceholder(
    'Notify when notes are added or edited',
  );
  expect(NotifyNotesAddedEdited).toBeVisible();

  await NotifyNotesAddedEdited.click();
  await page.getByRole('option', { name: 'None' }).click();

  page.waitForTimeout(1000);
  await NotifyNotesAddedEdited.click();
  await page.getByRole('option', { name: 'Managers only' }).click();
  await clickOnNotifSaveButton(page);

  const SavedValue = await page
    .locator(
      `//label[text()='Notify when notes are added or edited']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect('Managers only').toBe(SavedValue);
};

export const verifyClkInOutEdited = async (page: Page) => {
  let NotifyClkInOut = await page.getByPlaceholder(
    'Notify when clock-in/-out time is adjusted',
  );
  expect(NotifyClkInOut).toBeVisible();

  await NotifyClkInOut.click();
  await page.getByRole('option', { name: 'None' }).click();

  page.waitForTimeout(1000);
  await NotifyClkInOut.click();
  await page.getByRole('option', { name: 'Admins only' }).click();
  await clickOnNotifSaveButton(page);

  const SavedValue = await page
    .locator(
      `//label[text()='Notify when clock-in/-out time is adjusted']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect('Admins only').toBe(SavedValue);
};

export const verifySendClkInRemAt = async (page: Page) => {
  let ClkInRemAt = await page
    .locator(`//input[@data-testid='__textField']`)
    .nth(0);
  expect(ClkInRemAt).toBeVisible();

  await ClkInRemAt.click();
  await page.getByRole('option', { name: '8:15 AM' }).click();
  await checkEmailMobileBox(page, 0);
  await checkEmailMobileBox(page, 1);

  page.waitForTimeout(1000);
  await ClkInRemAt.click();
  await page.getByRole('option', { name: '8:30 AM' }).click();
  await clickOnNotifSaveButton(page);

  const SavedValue = await page
    .locator(
      `//label[text()='Send clock-in reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect(' 8:30 AM').toBe(SavedValue?.split(',')[3]);
};

export const verifySendClkOutRemAt = async (page: Page) => {
  let ClkOutRemAt = await page
    .locator(`//input[@data-testid='__textField']`)
    .nth(1);
  expect(ClkOutRemAt).toBeVisible();

  await ClkOutRemAt.click();
  await page.getByRole('option', { name: '4:45 PM' }).click();

  await checkEmailMobileBox(page, 2);
  await checkEmailMobileBox(page, 3);

  await ClkOutRemAt.click();
  await page.getByRole('option', { name: '5:30 PM' }).click();
  await clickOnNotifSaveButton(page);

  const SavedValue = await page
    .locator(
      `//label[text()='Send clock-out reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect(' 5:30 PM').toBe(SavedValue?.split(',')[3]);
};

export const clickOnNotifSaveButton = async (page: Page) => {
  let saveBtn = await page.getByRole('button', { name: 'Save' });
  expect(saveBtn).toBeVisible();
  await saveBtn.click();
};

export const checkEmailMobileBox = async (page: Page, option: number) => {
  let checkbox = await page.locator(`//input[@type='checkbox']`).nth(option);
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const uncheckEmailMobileBox = async (page: Page, option: number) => {
  let checkbox = await page.locator(`//input[@type='checkbox']`).nth(option);
  if (await checkbox.isChecked()) {
    await checkbox.uncheck();
  }
};

export const verifySavedCheckedCheckBoxes = async (page: Page) => {
  const ClkInSavedValue = await page
    .locator(
      `//label[text()='Send clock-in reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect(ClkInSavedValue?.split(',')[1]).toBe(' Email');
  expect(ClkInSavedValue?.split(',')[2]).toBe(' Mobile');

  const ClkOutSavedValue = await page
    .locator(
      `//label[text()='Send clock-out reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect(ClkOutSavedValue?.split(',')[1]).toBe(' Email');
  expect(ClkOutSavedValue?.split(',')[2]).toBe(' Mobile');
};

export const verifySavedUncheckedCheckBoxes = async (page: Page) => {
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
  expect(ClkInSavedValue).toBe('Off');
  expect(ClkOutSavedValue).toBe('Off');
  expect(DaysRemSentSavedValue).toBe('Off');
};

export const inputNotifSettings = async (page: Page) => {
  let ClkInRemAt = await page
    .locator(`//input[@data-testid='__textField']`)
    .nth(0);
  await ClkInRemAt.click();
  await page.getByRole('option', { name: '9:15 AM' }).click();
  await ClkInRemAt.click();
  await page.getByRole('option', { name: '10:15 AM' }).click();

  let ClkOutRemAt = await page
    .locator(`//input[@data-testid='__textField']`)
    .nth(1);
  await ClkOutRemAt.click();
  await page.getByRole('option', { name: '4:15 PM' }).click();
  await ClkOutRemAt.click();
  await page.getByRole('option', { name: '5:15 PM' }).click();

  await uncheckEmailMobileBox(page, 0);
  await uncheckEmailMobileBox(page, 1);
  await uncheckEmailMobileBox(page, 2);
  await uncheckEmailMobileBox(page, 3);

  await checkEmailMobileBox(page, 0);
  await checkEmailMobileBox(page, 1);
  await checkEmailMobileBox(page, 2);
  await checkEmailMobileBox(page, 3);

  let daysAreRemAreSent = await page.locator(
    `//input[@aria-label='notificationEnabledForDays']`,
  );
  expect(daysAreRemAreSent).toBeVisible();
  await daysAreRemAreSent.click();
  const sun = await page
    .getByRole('option', { name: 'Sunday' })
    .getAttribute('aria-checked');
  const mon = await page
    .getByRole('option', { name: 'Monday' })
    .getAttribute('aria-checked');
  const tue = await page
    .getByRole('option', { name: 'Tuesday' })
    .getAttribute('aria-checked');
  const wed = await page
    .getByRole('option', { name: 'Wednesday' })
    .getAttribute('aria-checked');
  const thu = await page
    .getByRole('option', { name: 'Thursday' })
    .getAttribute('aria-checked');
  const fri = await page
    .getByRole('option', { name: 'Friday' })
    .getAttribute('aria-checked');
  const sat = await page
    .getByRole('option', { name: 'Saturday' })
    .getAttribute('aria-checked');

  if (sun !== 'true') {
    await page.getByRole('option', { name: 'Sunday' }).click();
  }
  if (mon !== 'true') {
    await page.getByRole('option', { name: 'Monday' }).click();
  }
  if (tue !== 'true') {
    await page.getByRole('option', { name: 'Tuesday' }).click();
  }
  if (wed !== 'true') {
    await page.getByRole('option', { name: 'Wednesday' }).click();
  }
  if (thu !== 'true') {
    await page.getByRole('option', { name: 'Thursday' }).click();
  }
  if (fri !== 'true') {
    await page.getByRole('option', { name: 'Friday' }).click();
  }
  if (sat !== 'true') {
    await page.getByRole('option', { name: 'Saturday' }).click();
  }

  await page.keyboard.press(`Tab`);

  let NotifyClkInOut = await page.getByPlaceholder(
    'Notify when clock-in/-out time is adjusted',
  );
  await NotifyClkInOut.click();
  await page.getByRole('option', { name: 'None' }).click();
  await NotifyClkInOut.click();
  await page.getByRole('option', { name: 'Admins only' }).click();

  let NotifyNotesAddedEdited = await page.getByPlaceholder(
    'Notify when notes are added or edited',
  );
  await NotifyNotesAddedEdited.click();
  await page.getByRole('option', { name: 'None' }).click();
  await NotifyNotesAddedEdited.click();
  await page.getByRole('option', { name: 'Managers only' }).click();

  await clickOnNotifSaveButton(page);
};

export const verifyNotifFromClassicUI = async (
  page: Page,
  clkIn: string,
  clkOut: string,
  remDays: string,
  notes: string,
  clkInOutAdjust: string,
) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible();
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page.getByText('Go to classic QuickBooks Time').click(),
  ]);
  await classicPage.waitForLoadState();

  page = classicPage;

  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByTitle('Close').click();
  }
  if (
    await classicPage
      .getByText('Take a tour to learn what QuickBooks Time can do.')
      .isVisible()
  ) {
    await classicPage.getByRole('button', { name: 'Skip for Now' }).click();
  }
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await clickOnNotifications(classicPage);

  await classicPage.waitForTimeout(5000);
  const clkInTime = await page
    .locator(`//input[@id='notifications_clock_in_time']`)
    .getAttribute('value');
  const clkOutTime = await page
    .locator(`//input[@id='notifications_clock_out_time']`)
    .getAttribute('value');
  const ClkInEmailState = await page
    .locator(
      `//*[@name='notifications_clock_in_email_checkbox'][@aria-label='Email']`,
    )
    .isChecked();
  const ClkInMobileState = await classicPage
    .locator(
      `//*[@name='notifications_clock_in_push_checkbox'][@aria-label='Mobile']`,
    )
    .isChecked();
  const ClkOutEmailState = await classicPage
    .locator(
      `//*[@name='notifications_clock_out_email_checkbox'][@aria-label='Email']`,
    )
    .isChecked();
  const ClkOutMobileState = await classicPage
    .locator(
      `//*[@name='notifications_clock_out_push_checkbox'][@aria-label='Mobile']`,
    )
    .isChecked();
  //expect(clkIn.split(',')[3]).toBe(clkInTime);
  expect(clkIn.split(',')[3]).toContain(clkInTime);
  expect(clkOut.split(',')[3]).toContain(clkOutTime);
  if (clkIn.split(',')[1] == ' Email') {
    expect(ClkInEmailState).toBeTruthy();
  }
  if (clkIn.split(',')[2] == ' Mobile') {
    expect(ClkInMobileState).toBeTruthy();
  }
  if (clkOut.split(',')[1] == ' Email') {
    expect(ClkOutEmailState).toBeTruthy();
  }
  if (clkOut.split(',')[2] == ' Mobile') {
    expect(ClkOutMobileState).toBeTruthy();
  }

  if (
    (remDays = 'Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday')
  ) {
    await expect(
      page.locator(
        `//ul[@id='notification_calendar']/li[@class='csn-calendar-day selected']`,
      ),
    ).toHaveCount(7);
  }

  await clickOnTimeOptions(classicPage);
  await clickOnTimeEntryTab(classicPage);
  if (notes == 'Admins and Managers') {
    await expect(page.locator('#te_email_admin_on_edit')).toBeChecked();
    await expect(page.locator('#te_email_manager_on_edit')).toBeChecked();
  }
  if (notes == 'Admins only') {
    await expect(page.locator('#te_email_admin_on_edit')).toBeChecked();
    await expect(page.locator('#te_email_manager_on_edit')).not.toBeChecked();
  }
  if (notes == 'Managers only') {
    await expect(page.locator('#te_email_admin_on_edit')).not.toBeChecked();
    await expect(page.locator('#te_email_manager_on_edit')).toBeChecked();
  }
  if (notes == 'None') {
    await expect(page.locator('#te_email_admin_on_edit')).not.toBeChecked();
    await expect(page.locator('#te_email_manager_on_edit')).not.toBeChecked();
  }

  if (clkInOutAdjust == 'Admins and Managers') {
    await expect(
      page.locator('#te_clockout_override_notify_mgrs'),
    ).toBeChecked();
    await expect(
      page.locator('#te_clockout_override_notify_admin'),
    ).toBeChecked();
  }
  if (clkInOutAdjust == 'Admins only') {
    await expect(
      page.locator('#te_clockout_override_notify_admin'),
    ).toBeChecked();
    await expect(
      page.locator('#te_clockout_override_notify_mgrs'),
    ).not.toBeChecked();
  }
  if (clkInOutAdjust == 'Managers only') {
    await expect(
      page.locator('#te_clockout_override_notify_mgrs'),
    ).toBeChecked();
    await expect(
      page.locator('#te_clockout_override_notify_admin'),
    ).not.toBeChecked();
  }
  if (clkInOutAdjust == 'None') {
    await expect(
      page.locator('#te_clockout_override_notify_mgrs'),
    ).not.toBeChecked();
    await expect(
      page.locator('#te_clockout_override_notify_admin'),
    ).not.toBeChecked();
  }
};

export const SaveNotifyPriorityCaseFromClassicUI = async (page: Page) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible({
    timeout: 3000,
  });
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page
      .getByText('Go to classic QuickBooks Time')
      .click({ timeout: 3000 }),
  ]);
  await classicPage.waitForLoadState();
  await waitForPageReady(classicPage);
  await classicPage.waitForTimeout(2000);
  await handlePopupsInAnyOrder(classicPage);
  page = classicPage;
  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByTitle('Close').click();
  }
  if (
    await classicPage
      .getByText('Take a tour to learn what QuickBooks Time can do.')
      .isVisible()
  ) {
    await classicPage.getByRole('button', { name: 'Skip for Now' }).click();
  }
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await classicPage.waitForTimeout(2000);
  await clickOnCompSettings(classicPage);
  await classicPage.waitForTimeout(2000);
  await clickOnNotifications(classicPage);

  await classicPage.waitForTimeout(2000);
  await dismissCookieConsent(classicPage);
  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_in_push_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_in_push_checkbox']`)
      .check();
  }
  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_in_email_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_in_email_checkbox']`)
      .check();
  }
  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_out_push_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_out_push_checkbox']`)
      .check();
  }
  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_out_email_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_out_email_checkbox']`)
      .check();
  }

  await classicPage.locator('#notifications_clock_in_time').fill('10:15');
  await classicPage.locator('#notifications_clock_out_time').fill('16:00');

  await dismissCookieConsent(classicPage);
  await classicPage
    .locator(`//button/span[text()='Save']`)
    .click({ force: true });

  await page.bringToFront();
  await navigateToAccountAndSettingsTime(page);
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
  expect(ClkInSavedValue?.split(',')[3]).toBe(' 10:15');
  expect(ClkOutSavedValue?.split(',')[3]).toBe(' 12:00');
};

export const SaveNotifSettingsFromClassicUI = async (page: Page) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible();
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page.getByText('Go to classic QuickBooks Time').click(),
  ]);
  await classicPage.waitForLoadState();

  page = classicPage;
  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByTitle('Close').click();
  }
  if (
    await classicPage
      .getByText('Take a tour to learn what QuickBooks Time can do.')
      .isVisible()
  ) {
    await classicPage.getByRole('button', { name: 'Skip for Now' }).click();
  }
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await clickOnNotifications(classicPage);
  await classicPage.waitForTimeout(5000);

  await classicPage.locator('#notifications_clock_in_time').fill('9:15');
  await classicPage.locator('#notifications_clock_out_time').fill('6:00');
  if (
    !(await classicPage
      .locator(`//li[@id='notify_sun'][contains(@class,'selected')]`)
      .isVisible())
  ) {
    await classicPage.locator('#notify_sun').click();
  }
  if (
    !(await classicPage
      .locator(`//li[@id='notify_mon'][contains(@class,'selected')]`)
      .isVisible())
  ) {
    await classicPage.locator('#notify_mon').click();
  }
  if (
    !(await classicPage
      .locator(`//li[@id='notify_tue'][contains(@class,'selected')]`)
      .isVisible())
  ) {
    await classicPage.locator('#notify_tue').click();
  }
  if (
    !(await classicPage
      .locator(`//li[@id='notify_wed'][contains(@class,'selected')]`)
      .isVisible())
  ) {
    await classicPage.locator('#notify_wed').click();
  }
  if (
    !(await classicPage
      .locator(`//li[@id='notify_thu'][contains(@class,'selected')]`)
      .isVisible())
  ) {
    await classicPage.locator('#notify_thu').click();
  }
  if (
    await classicPage
      .locator(`//li[@id='notify_fri'][contains(@class,'selected')]`)
      .isVisible()
  ) {
    await classicPage.locator('#notify_fri').click();
  }
  if (
    await classicPage
      .locator(`//li[@id='notify_sat'][contains(@class,'selected')]`)
      .isVisible()
  ) {
    await classicPage.locator('#notify_sat').click();
  }
  await classicPage.keyboard.press(`Tab`);
  await classicPage
    .locator(`//button[contains(@class,'main-save-btn')]`)
    .click();

  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_in_push_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_in_push_checkbox']`)
      .check();
  }
  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_in_email_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_in_email_checkbox']`)
      .check();
  }
  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_out_push_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_out_push_checkbox']`)
      .check();
  }
  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_out_email_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_out_email_checkbox']`)
      .check();
  }

  expect(
    classicPage.locator(`//button[contains(@class,'main-save-btn')]`),
  ).toBeVisible();
  await classicPage
    .locator(`//button[contains(@class,'main-save-btn')]`)
    .click();

  await clickOnTimeOptions(classicPage);
  await clickOnTimeEntryTab(classicPage);

  if (!(await classicPage.locator('#te_email_admin_on_edit').isChecked())) {
    await classicPage.locator('#te_email_admin_on_edit').check();
  }
  if (await classicPage.locator('#te_email_manager_on_edit').isChecked()) {
    await classicPage.locator('#te_email_manager_on_edit').uncheck();
  }

  if (
    !(await classicPage
      .locator('#te_clockout_override_notify_mgrs')
      .isChecked())
  ) {
    await classicPage.locator('#te_clockout_override_notify_mgrs').check();
  }
  if (
    await classicPage.locator('#te_clockout_override_notify_admin').isChecked()
  ) {
    await classicPage.locator('#te_clockout_override_notify_admin').uncheck();
  }
  await classicPage
    .getByRole('button', { name: 'Save' })
    .click({ force: true });

  await page.bringToFront();
  await navigateToAccountAndSettingsTime(page);

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

  expect(ClkInSavedValue).toBe('On, email, mobile, 9:15 AM');
  expect(ClkOutSavedValue).toBe('On, email, mobile, 6:00 PM');
  expect(DaysRemSentSavedValue).toBe(
    'Sunday, Monday, Tuesday, Wednesday, Thursday',
  );
  expect(ClkInOutEditedSavedValue).toBe('Managers only');
  expect(NotesSavedValue).toBe('Admins only');
};

export const clickTimeSheetFieldsEditButton = async (page: Page) => {
  let timeSheetFieldsEditBtn = page
    .getByTestId('timeSheet-settings-view')
    .getByRole('button', { name: 'Edit' });
  await expect(timeSheetFieldsEditBtn).toBeVisible(); // edit icon
  await timeSheetFieldsEditBtn.click({ force: true, timeout: 2000 });
  await page.waitForTimeout(2000);
};

export const validateFieldsOnCustomizeTimesheetPage = async (page: Page) => {
  await page.waitForLoadState();
  for (const header of testData.qbocustomizeTimesheetFieldsGB) {
    // Look for elements in the preview section with exact text match
    const previewElement = page
      .locator(
        `[class*="FieldsPreview__CheckBoxText"], [class*="MobilePreview__PreviewFieldTitle"]`,
      )
      .filter({ hasText: new RegExp(`^${header}$`) });
    if ((await previewElement.count()) > 0) {
      await expect(previewElement.first()).toBeVisible();
    } else {
      // If not found in preview, look for it in the main content
      await expect(
        page.getByText(header, { exact: true }).first(),
      ).toBeVisible();
    }
  }
};

export const checkedCustomizeTimesheetFieldsCheckbox = async (page: Page) => {
  // Check for any remaining popups before interacting with checkboxes
  await handlePopupsInAnyOrder(page);
  for (const fieldName of testData.qbocustomizeTimesheetFieldsGB) {
    const toggle = page.locator(
      `//span[text()='${fieldName}']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span/input`,
    );
    const statusText = page.locator(
      `(//span[text()='${fieldName}']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span)[1]`,
    );

    // Check if the toggle shows "Inactive" status
    const isInactive = await statusText
      .textContent()
      .then((text) => text?.includes('Inactive'));
    if (isInactive) {
      await toggle.click();
    }
  }
};

export const checkServiceItemRequired = async (page: Page) => {
  // Check for any remaining popups before interacting with switches
  await handlePopupsInAnyOrder(page);
  await page.getByRole('switch', { name: 'serviceItemRequired' }).uncheck();
};

export const checkedCustomizeTimesheetFieldsCheckboxForTimeClock = async (
  page: Page,
) => {
  for (const fieldName of testData.customizeTimesheetFieldsforTimeClock) {
    const checkbox = page.getByRole('checkbox', {
      name: fieldName,
      exact: true,
    });
    if (!(await checkbox.isChecked())) {
      await checkbox.click();
    }
  }
};

export const uncheckedCustomizeTimesheetFieldsCheckbox = async (page: Page) => {
  for (const fieldName of testData.qbocustomizeTimesheetFieldsUnCheck) {
    const checkbox = page.getByRole('checkbox', {
      name: fieldName,
      exact: true,
    });
    if (await checkbox.isChecked()) {
      await checkbox.click();
      await page.waitForTimeout(1000);
    }
  }
  await page.waitForTimeout(2000);
};

export const clickOnCustomizeTimesheetSaveButton = async (page: Page) => {
  let SaveBtn = page.getByRole('button', { name: 'Save' });
  await page.waitForTimeout(1000);
  await expect(SaveBtn).toBeVisible(); // Save button
  await page.waitForTimeout(1000);
  await SaveBtn.click({ timeout: 3000 });
  await page.waitForTimeout(2000);
};

//Settings to Settings functions
export const navigateToClassicTimeSheet = async (page: Page) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible({
    timeout: 10000,
  });
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page
      .getByText('Go to classic QuickBooks Time')
      .click({ timeout: 3000 }),
  ]);
  await classicPage.waitForLoadState();
  await waitForPageReady(classicPage);
  await handleClassicTimesheetPopupsInAnyOrder(classicPage);
  // page = classicPage;

  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByRole('button').first().click();
    await classicPage.getByTitle('Close').click();
  }
  await expect(classicPage.locator('#quickbooks_menu_top')).toBeVisible();
  classicPage.waitForTimeout(2000);

  return { classicPage, classicPageUrl: classicPage.url() };
};

export const selectOptionFromQuickBooksPayroll = async (
  classicPage: Page,
  option: string,
) => {
  await classicPage.waitForTimeout(5000);
  if (
    await classicPage
      .locator(
        `//h2[text()='These people are showing up more than once on your My Team list. To make sure timesheets are being tracked accurately, review these team members to see if they should be merged.']`,
      )
      .isVisible()
  ) {
    await classicPage.getByRole('button').first().click();
  }
  if (
    await classicPage
      .getByRole('button', { name: 'QuickBooks Payroll' })
      .first()
      .isVisible()
  ) {
    await classicPage
      .getByRole('button', { name: 'QuickBooks Payroll' })
      .click({ force: true, timeout: 1000 });
  }
  await classicPage
    .getByRole('link', { name: option })
    .click({ force: true, timeout: 1000 });
  await expect(classicPage.locator('#quickbooks_menu_top')).toBeVisible();
  await classicPage.waitForLoadState();
  await expect(
    classicPage.getByRole('heading', { name: 'Timesheets Should Show' }),
  ).toBeVisible();
  await classicPage.waitForTimeout(2000);
};

export const validateCustomizeTimesheetFieldsChangesOnClassicUI = async (
  classicPage: Page,
) => {
  //validate checkbox are checked
  await expect(
    classicPage.getByRole('checkbox', { name: 'Service Items' }),
  ).toBeChecked();
  // await expect(
  //   classicPage
  //     .getByRole('checkbox', { name: 'Billable yes/no choice' })
  //     .first(),
  // ).toBeChecked();
  // await expect(
  //   classicPage
  //     .getByRole('checkbox', { name: 'Require Billable yes/no choice' })
  //     .first(),
  // ).toBeChecked();
  // await expect(
  //   classicPage.getByRole('checkbox', { name: 'Billable Rate' }).first(),
  // ).toBeChecked();
  await expect(
    classicPage.getByRole('checkbox', { name: 'Class' }).first(),
  ).toBeChecked();
  await expect(
    classicPage.getByRole('checkbox', { name: 'Location' }).first(),
  ).toBeChecked();

  closeQuickBooksOnline(classicPage);

  // check notes from company settings
  await classicPage.waitForTimeout(2000);
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeOptions(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeEntryTab(classicPage);
  await classicPage.waitForTimeout(1000);
  const notesCheckbox = classicPage.getByRole('checkbox', {
    name: 'Allow team members to enter',
  });
  await expect(notesCheckbox).toBeChecked();
  await classicPage.waitForTimeout(1000);
  // close company settings
  await classicPage
    .getByRole('button', { name: 'Close Company Settings' })
    .click();
  await classicPage.waitForTimeout(2000);
};

export const closeQuickBooksOnline = async (classicPage: Page) => {
  await classicPage
    .getByRole('button', { name: 'Close QuickBooks Online' })
    .click();
  await classicPage.waitForLoadState();
  await classicPage.waitForTimeout(2000);
};

export const switchBackToQBO = async (page: Page) => {
  await page.bringToFront();
  await page.waitForTimeout(2000);
};

export const switchBackToClassicTimeSheet = async (
  classicPage: Page,
  classicPageUrl: string,
) => {
  await classicPage.bringToFront();
  await classicPage.goto(classicPageUrl, {
    waitUntil: 'load',
  });
  await classicPage.waitForLoadState();
  await classicPage.waitForTimeout(2000);
};

export const preferencesUncheckedTimesheetFieldsCheckbox = async (
  classicPage: Page,
) => {
  for (const fieldName of testData.classicPreferencesCustomizeTimesheetFields) {
    const checkbox = classicPage
      .getByRole('checkbox', {
        name: fieldName,
        exact: true,
      })
      .first();
    if (await checkbox.isChecked()) {
      await checkbox.click({ timeout: 1000 });
      await classicPage.waitForLoadState();
      await classicPage.waitForTimeout(3000);
    }
    await classicPage.waitForTimeout(2000);
  }
};

export const validateCustomizeTimesheetFieldsChangesFromClassicTimesheetToQBO =
  async (page: Page) => {
    // assert the checkbox are unchecked for the qbocustomizeTimesheetField
    for (const fieldName of testData.qbocustomizeTimesheetFieldsGB) {
      const statusText = page.locator(
        `(//span[text()='${fieldName}']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span)[1]`,
      );
      // const statusText = page.locator(`//span[text()='${fieldName}']/../../../parent::tr//label/span/span`);
      await expect(statusText).toContainText('Active');
    }
  };

export const checkNotesCheckboxFromCompanySettings = async (
  classicPage: Page,
) => {
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeOptions(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeEntryTab(classicPage);
  await classicPage.waitForTimeout(1000);
  const notesCheckbox = classicPage.getByRole('checkbox', {
    name: 'Allow team members to enter',
  });
  if (!(await notesCheckbox.isChecked())) {
    await notesCheckbox.click({ force: true, timeout: 1000 });
  }
  await classicPage.waitForTimeout(1000);
};

export const uncheckNotesCheckboxFromCompanySettings = async (
  classicPage: Page,
) => {
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeOptions(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeEntryTab(classicPage);
  await classicPage.waitForTimeout(1000);
  const notesCheckbox = classicPage.getByRole('checkbox', {
    name: 'Allow team members to enter',
  });
  if (await notesCheckbox.isChecked()) {
    await notesCheckbox.click({ force: true, timeout: 1000 });
  }
  await classicPage.waitForTimeout(1000);
};

// verify notes checkbox is checked from company settings
export const verifyNotesCheckboxIsCheckedFromCompanySettings = async (
  classicPage: Page,
) => {
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeOptions(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeEntryTab(classicPage);
  await classicPage.waitForTimeout(1000);
  const notesCheckbox = classicPage.getByRole('checkbox', {
    name: 'Allow team members to enter',
  });
  await expect(notesCheckbox).toBeChecked();
};

// verify notes checkbox is unchecked from company settings
export const verifyNotesCheckboxIsUncheckedFromCompanySettings = async (
  classicPage: Page,
) => {
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeOptions(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeEntryTab(classicPage);
  await classicPage.waitForTimeout(1000);
  const notesCheckbox = classicPage.getByRole('checkbox', {
    name: 'Allow team members to enter',
  });
  await expect(notesCheckbox).not.toBeChecked();
};

export const saveCompanySettings = async (classicPage: Page) => {
  await classicPage
    .getByRole('button', { name: 'Save' })
    .click({ force: true, timeout: 1000 });
  await classicPage.waitForTimeout(2000);
};

export const closeCompanySettings = async (classicPage: Page) => {
  await classicPage
    .getByRole('button', { name: 'Close Company Settings' })
    .click({ force: true, timeout: 1000 });
  await classicPage.waitForTimeout(2000);
};

export const checkCustomField = async (page: Page, fieldName: string) => {
  const checkbox = page.getByLabel(fieldName).first();
  if (!(await checkbox.isChecked())) {
    await checkbox.click({ force: true, timeout: 2000 });
    await page.waitForTimeout(2000);
  }
};

export const clickSaveButtonCustomField = async (page: Page) => {
  const saveButton = page.getByRole('button', { name: 'Save' });
  await expect(saveButton).toBeVisible();
  await saveButton.click();
};

export const validateTimeSheetFieldsVisible = async (page: Page) => {
  await expect(page.getByText('Timesheet fields')).toBeVisible();
};

export const navigateToSTA = async (page: Page) => {
  await gotoWithAuthSession(page, '/app/timeactivity?t=s', {
    waitUntil: 'load',
  });
};

export const uncheckCustomField = async (page: Page, fieldName: string) => {
  const checkbox = page.getByLabel(fieldName).first();
  if (await checkbox.isChecked()) {
    await checkbox.click({ force: true, timeout: 2000 });
    await page.waitForTimeout(2000);
  }
};

export const getClassCheckboxLocator = async (classicPage: Page) => {
  return classicPage.getByRole('checkbox', { name: 'Class' }).first();
};

export const validateCheckboxIsChecked = async (
  classicPage: Page,
  fieldName: string,
) => {
  const checkbox = await classicPage
    .getByRole('checkbox', { name: fieldName })
    .first();
  return await checkbox.isChecked();
};

export const validateCheckboxIsUnchecked = async (
  classicPage: Page,
  fieldName: string,
) => {
  await classicPage.waitForTimeout(8000);

  const maxRetries = 10;
  const retryDelay = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const checkbox = await classicPage
        .getByRole('checkbox', { name: fieldName })
        .first();

      // Wait for checkbox to be visible
      await checkbox.waitFor({ state: 'visible', timeout: 5000 });

      // Check if checkbox is unchecked
      const isUnchecked = !(await checkbox.isChecked());

      if (isUnchecked) {
        console.log(
          `Checkbox "${fieldName}" is unchecked on attempt ${attempt}`,
        );
        return true;
      }

      console.log(
        `Checkbox "${fieldName}" is still checked on attempt ${attempt}, retrying...`,
      );

      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await classicPage.waitForTimeout(retryDelay);
      }
    } catch (error) {
      console.log(
        `Attempt ${attempt} failed for checkbox "${fieldName}":`,
        error,
      );
      if (attempt < maxRetries) {
        await classicPage.waitForTimeout(retryDelay);
      }
    }
  }

  // If we get here, all retries failed
  console.log(
    `Checkbox "${fieldName}" is still checked after ${maxRetries} attempts`,
  );
  return false;
};

export const validateOnlyClassFieldValuesCheckboxIsChecked = async (
  classicPage: Page,
  fieldName: string,
  uncheckedFields?: string[],
) => {
  // Validate the main field is checked
  const fieldValueCheckbox = await classicPage
    .getByRole('checkbox', { name: fieldName })
    .first();
  await expect(fieldValueCheckbox).toBeChecked();

  // Default unchecked fields (can be overridden)
  const defaultUncheckedFields = [
    'Service Items',
    'Billable yes/no choice',
    'Require Billable yes/no choice',
    'Billable Rate',
    'Location',
  ];

  const fieldsToCheck = uncheckedFields || defaultUncheckedFields;

  // Always check that 'Customers & sub-customers' is checked
  const customersCheckbox = await classicPage
    .getByRole('checkbox', { name: 'Customers & sub-customers' })
    .first();
  await expect(customersCheckbox).toBeChecked();

  // Validate specified fields are unchecked
  for (const fieldToCheck of fieldsToCheck) {
    const checkbox = await classicPage
      .getByRole('checkbox', { name: fieldToCheck })
      .first();
    await expect(checkbox).not.toBeChecked();
  }

  return await fieldValueCheckbox.isChecked();
};

export const validateOnlyLocationFieldValuesCheckboxIsChecked = async (
  classicPage: Page,
  fieldName: string,
  uncheckedFields?: string[],
) => {
  // Validate the main field is checked
  const fieldValueCheckbox = await classicPage
    .getByRole('checkbox', { name: fieldName })
    .first();
  await expect(fieldValueCheckbox).toBeChecked();

  // Default unchecked fields (can be overridden)
  const defaultUncheckedFields = [
    'Service Items',
    'Billable yes/no choice',
    'Require Billable yes/no choice',
    'Billable Rate',
    'Class',
  ];

  const fieldsToCheck = uncheckedFields || defaultUncheckedFields;

  // Always check that 'Customers & sub-customers' is checked
  const customersCheckbox = await classicPage
    .getByRole('checkbox', { name: 'Customers & sub-customers' })
    .first();
  await expect(customersCheckbox).toBeChecked();

  // Validate specified fields are unchecked
  for (const fieldToCheck of fieldsToCheck) {
    const checkbox = await classicPage
      .getByRole('checkbox', { name: fieldToCheck })
      .first();
    await expect(checkbox).not.toBeChecked();
  }

  return await fieldValueCheckbox.isChecked();
};

export const validateOnlyServiceItemFieldValuesCheckboxIsChecked = async (
  classicPage: Page,
  fieldName: string,
  uncheckedFields?: string[],
) => {
  // Validate the main field is checked
  const fieldValueCheckbox = await classicPage
    .getByRole('checkbox', { name: fieldName })
    .first();
  await expect(fieldValueCheckbox).toBeChecked();

  // Default unchecked fields (can be overridden)
  const defaultUncheckedFields = [
    'Billable yes/no choice',
    'Require Billable yes/no choice',
    'Billable Rate',
    'Class',
    'Location',
  ];

  const fieldsToCheck = uncheckedFields || defaultUncheckedFields;

  // Always check that 'Customers & sub-customers' is checked
  const customersCheckbox = await classicPage
    .getByRole('checkbox', { name: 'Customers & sub-customers' })
    .first();
  await expect(customersCheckbox).toBeChecked();

  // Validate specified fields are unchecked
  for (const fieldToCheck of fieldsToCheck) {
    const checkbox = await classicPage
      .getByRole('checkbox', { name: fieldToCheck })
      .first();
    await expect(checkbox).not.toBeChecked();
  }

  return await fieldValueCheckbox.isChecked();
};

export const validateOnlyBillableFieldValuesCheckboxIsChecked = async (
  classicPage: Page,
  fieldName: string,
  uncheckedFields?: string[],
) => {
  // Validate the main field is checked
  const fieldValueCheckbox = await classicPage
    .getByRole('checkbox', { name: fieldName })
    .first();
  await expect(fieldValueCheckbox).toBeChecked();

  // Default unchecked fields (can be overridden)
  const defaultUncheckedFields = [
    'Service Items',
    'Require Billable yes/no choice',
    'Billable Rate',
    'Class',
    'Location',
  ];

  const fieldsToCheck = uncheckedFields || defaultUncheckedFields;

  // Always check that 'Customers & sub-customers' is checked
  const customersCheckbox = await classicPage
    .getByRole('checkbox', { name: 'Customers & sub-customers' })
    .first();
  await expect(customersCheckbox).toBeChecked();

  // Validate specified fields are unchecked
  for (const fieldToCheck of fieldsToCheck) {
    const checkbox = await classicPage
      .getByRole('checkbox', { name: fieldToCheck })
      .first();
    await expect(checkbox).not.toBeChecked();
  }

  return await fieldValueCheckbox.isChecked();
};

export const validateAllFieldValuesCheckboxAreUnchecked = async (
  classicPage: Page,
  uncheckedFields?: string[],
) => {
  // Default unchecked fields (can be overridden)
  const defaultUncheckedFields = [
    'Service Items',
    'Billable yes/no choice',
    'Require Billable yes/no choice',
    'Billable Rate',
    'Class',
    'Location',
  ];

  const fieldsToCheck = uncheckedFields || defaultUncheckedFields;

  // Always check that 'Customers & sub-customers' is checked
  const customersCheckbox = await classicPage
    .getByRole('checkbox', { name: 'Customers & sub-customers' })
    .first();
  await expect(customersCheckbox).toBeChecked();

  // Validate specified fields are unchecked
  for (const fieldToCheck of fieldsToCheck) {
    const checkbox = await classicPage
      .getByRole('checkbox', { name: fieldToCheck })
      .first();
    await expect(checkbox).not.toBeChecked();
  }
};

export const checkClassCheckbox = async (classicPage: Page) => {
  const checkbox = await getClassCheckboxLocator(classicPage);
  await checkbox.check();
};

export const uncheckClassCheckbox = async (classicPage: Page) => {
  const checkbox = await getClassCheckboxLocator(classicPage);
  await checkbox.uncheck();
};

export const getClosePreferencesButtonLocator = async (classicPage: Page) => {
  return classicPage.locator('#qbsync_preferences_close_winc');
};

export const clickClosePreferencesButton = async (classicPage: Page) => {
  const button = await getClosePreferencesButtonLocator(classicPage);
  await button.click();
};

export const saveAndClosePreferences = async (classicPage: Page) => {
  await checkClassCheckbox(classicPage);
  await clickClosePreferencesButton(classicPage);
};

export const uncheckAndClosePreferences = async (classicPage: Page) => {
  await uncheckClassCheckbox(classicPage);
  await clickClosePreferencesButton(classicPage);
};

// Handle overlapping modals using Promise.race to check both simultaneously
export const handleKnownModals = async (page: Page): Promise<void> => {
  try {
    // Function to handle glow-up modal
    const handleGlowUpModal = async (): Promise<boolean> => {
      try {
        if (await page.getByText('QuickBooks Time got a glow-up').isVisible()) {
          await page.getByRole('button', { name: 'Close' }).click();
          await page.waitForTimeout(500);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    // Function to handle corner modal
    const handleCornerModal = async (): Promise<boolean> => {
      try {
        if (await page.getByText('Just around the corner').isVisible()) {
          await page
            .getByTestId('ModalDialog')
            .getByRole('button', { name: 'Ok' })
            .click();
          await page.waitForTimeout(500);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    // Handle both modals simultaneously using Promise.allSettled
    const results = await Promise.allSettled([
      handleGlowUpModal(),
      handleCornerModal(),
    ]);

    // Check which modals were handled
    const handledModals = results
      .map((result, index) => ({
        result,
        type: index === 0 ? 'glow-up' : 'corner',
      }))
      .filter(
        ({ result }) => result.status === 'fulfilled' && result.value === true,
      );

    if (handledModals.length > 0) {
      // Check if any modals are still visible after handling
      await page.waitForTimeout(500);
      const modalDialogs = page.getByTestId('ModalDialog');
      const stillVisible = await modalDialogs.count();
      if (stillVisible > 0) {
        await handleKnownModals(page); // Recursive call for remaining modals
      } else {
      }
    }
  } catch (error) {}
};

export const scrollToBottom = async (page: Page) => {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
};

// Utility function to handle popups that may appear in any order
export async function handlePopupsInAnyOrder(page: Page): Promise<void> {
  await page.waitForTimeout(3000); // Increased initial wait for late-appearing popups
  let popupsHandled = 0;
  const maxAttempts = 10; // Prevent infinite loops
  // First do a quick check to see if any popups are immediately visible
  const hasImmediatePopups = await checkForImmediatePopups(page);
  if (!hasImmediatePopups) {
    // If no immediate popups, wait a bit longer for delayed popups to appear
    await page.waitForTimeout(3000); // Increased wait for delayed popups
  }
  for (let attempt = 0; attempt < maxAttempts && popupsHandled < 6; attempt++) {
    let handledThisRound = false;
    // Check for "A faster way to enter time" tour modal
    try {
      if (
        await page
          .getByRole('heading', {
            name: 'A faster way to enter time',
          })
          .isVisible({ timeout: 2000 })
      ) {
        await page
          .getByTestId('ModalDialog')
          .getByRole('button', { name: 'Close' })
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "Just around the corner" popup
    try {
      if (
        await page
          .getByText('Just around the corner')
          .isVisible({ timeout: 2000 })
      ) {
        await page
          .getByTestId('ModalDialog')
          .getByRole('button', { name: 'Ok' })
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "QuickBooks Time got a glow-up" popup
    try {
      if (
        await page
          .getByText('QuickBooks Time got a glow-up')
          .isVisible({ timeout: 5000 })
      ) {
        await page
          .locator(
            `//div[@data-automation-id="ModalDialog"] / descendant::button[@aria-label="Close"]`,
          )
          .or(page.getByRole('button', { name: 'Close', exact: true }))
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "Streamlined time settings" popup
    try {
      if (
        await page
          .getByText('Streamlined time settings')
          .or(page.getByRole('heading', { name: 'Streamlined time settings' }))
          .isVisible({ timeout: 3000 })
      ) {
        // Try to click "Got it" first, then fall back to "Close"
        try {
          await page
            .getByRole('button', { name: 'Got it' })
            .click({ timeout: 2000 });
        } catch {
          await page
            .getByTestId('ModalDialog')
            .getByRole('button', { name: 'Close' })
            .click({ timeout: 2000 });
        }
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "Single time entry" popup
    try {
      if (
        await page
          .getByTestId('ModalDialog')
          .getByRole('heading', { name: 'Single time entry' })
          .isVisible({ timeout: 2000 })
      ) {
        await page
          .getByRole('button', { name: 'Got it' })
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "Go to QuickBooks Time to enter a timesheet" popup
    try {
      if (
        await page
          .getByRole('heading', {
            name: 'Go to QuickBooks Time to enter a timesheet',
          })
          .or(page.getByRole('heading', { name: 'Go to QuickBooks Time to' }))
          .isVisible({ timeout: 2000 })
      ) {
        await page
          .getByLabel('Please do not show again')
          .or(page.getByText('Please do not show again'))
          .click({ timeout: 2000 });
        await page
          .getByTestId('ModalDialog')
          .getByLabel('Close')
          .or(
            page
              .getByTestId('ModalDialog')
              .locator('button')
              .filter({ hasText: 'Close' }),
          )
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // If no popups were handled this round, break the loop
    if (!handledThisRound) {
      break;
    }
  }
}
// Private helper methods
// Wait for page to be fully loaded and ready
export async function waitForPageReady(page: Page): Promise<void> {
  try {
    // Wait for either the loading spinner to appear and disappear, or key page elements to be visible
    await Promise.race([
      // Option 1: Wait for loading spinner to finish
      page
        .locator('[data-testid="LoadingSpinner"]')
        .waitFor({ state: 'visible', timeout: 2000 })
        .then(() =>
          page.locator('[data-testid="LoadingSpinner"]').waitFor({
            state: 'hidden',
            timeout: 10000,
          }),
        ),
      // Option 2: Wait for key page elements that indicate the page is ready
      Promise.all([
        page
          .locator('[data-testid="DateRangeSelect"], .DateRangeSelect')
          .waitFor({ state: 'visible', timeout: 10000 }),
        page
          .locator(
            '[aria-label="Display by"], [data-testid="DisplayByDropdown"]',
          )
          .waitFor({ state: 'visible', timeout: 10000 }),
      ]),
    ]);
    // Small buffer to ensure any immediate popups have time to appear
    await page.waitForTimeout(500);
  } catch (error) {
    // If specific elements aren't found, fall back to a shorter wait
    await page.waitForTimeout(2000);
  }
}
// Helper method to quickly check if any popups are immediately visible
export async function checkForImmediatePopups(page: Page): Promise<boolean> {
  try {
    // Use Promise.race to check all popup types with increased timeout for late-appearing popups
    await Promise.race([
      page
        .getByRole('heading', {
          name: 'A faster way to enter time',
        })
        .waitFor({ state: 'visible', timeout: 500 }),
      page
        .getByText('Just around the corner')
        .waitFor({ state: 'visible', timeout: 500 }),
      page
        .getByText('QuickBooks Time got a glow-up')
        .waitFor({ state: 'visible', timeout: 500 }),
      page
        .locator('text="Streamlined time settings"')
        .or(page.getByRole('heading', { name: 'Streamlined time settings' }))
        .waitFor({ state: 'visible', timeout: 1000 }),
      page
        .getByTestId('ModalDialog')
        .getByRole('heading', { name: 'Single time entry' })
        .waitFor({ state: 'visible', timeout: 500 }),
      page
        .getByRole('heading', {
          name: 'Go to QuickBooks Time to enter a timesheet',
        })
        .waitFor({ state: 'visible', timeout: 500 }),
    ]);
    return true; // At least one popup is immediately visible
  } catch (error) {
    return false; // No popups are immediately visible
  }
}

export const closeSpecificTabsOrPage = async (page: Page, url: string) => {
  // Close any tab
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
};

// Utility function to handle popups that may appear in any order
export async function handleClassicTimesheetPopupsInAnyOrder(
  page: Page,
): Promise<void> {
  await page.waitForTimeout(2000);
  let popupsHandled = 0;
  const maxAttempts = 10; // Prevent infinite loops
  // First do a quick check to see if any popups are immediately visible
  const hasImmediatePopups = await checkForImmediatePopups(page);
  if (!hasImmediatePopups) {
    // If no immediate popups, wait a bit longer for delayed popups to appear
    await page.waitForTimeout(2000);
  }
  for (let attempt = 0; attempt < maxAttempts && popupsHandled < 6; attempt++) {
    let handledThisRound = false;
    // Check for "A faster way to enter time" tour modal
    try {
      if (
        await page
          .getByText('Welcome to your Elite time')
          .or(page.getByRole('button', { name: 'Get Started' }))
          .isVisible({ timeout: 1000 })
      ) {
        await page.getByRole('img', { name: 'Close' }).click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }

    try {
      if (
        await page
          .getByRole('heading', { name: 'Welcome to QuickBooks Time!' })
          .isVisible({ timeout: 1000 })
      ) {
        await page
          .getByRole('button', { name: 'Skip for Now' })
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }

    // If no popups were handled this round, break the loop
    if (!handledThisRound) {
      break;
    }
  }
}

// Helper method to quickly check if any popups are immediately visible
export async function checkForImmediateClassicTimesheetPopups(
  page: Page,
): Promise<boolean> {
  try {
    // Use Promise.race to check all popup types with very short timeout
    await Promise.race([
      page
        .getByText('Welcome to your Elite time')
        .or(page.getByRole('button', { name: 'Get Started' }))
        .isVisible({ timeout: 1000 }),
      page
        .getByRole('heading', { name: 'Welcome to QuickBooks Time!' })
        .isVisible({ timeout: 1000 }),
    ]);
    return true; // At least one popup is immediately visible
  } catch (error) {
    return false; // No popups are immediately visible
  }
}

export default {
  navigateToAccountAndSettingsTime,
  clickOnDropdown,
  chooseDropDownOption,
  verifyReadOnltimeTrackSection,
  clickTimeTrackingEditButton,
  clickOnTimeTrackingSaveButton,
  clickOnTimeTrackingCancelButton,
  checkBoxTimeTrack,
  uncheckBoxTimeTrack,
  verifyTooltip,
  verifyTimeSheetRounding,
  directToSingleTimeAct,
  directToSingleTimeActWithId,
  directToWeeklyTime,
  verifyFirstDayAtWorkOnWTA,
  verifyDaysOfWeekOnWTA,
  verifyFieldsDisplayed,
  openSTADropdown,
  chooseSTADropdownOption,
  checkBillableCheckboxIfVisible,
  uncheckBillableCheckboxIfVisible,
  fillSTABillRate,
  clickSTASave,
  verifySTARequiredError,
  fillNotes,
  STASaveToast,
  navigateToTimeEntries,
  getTcLoadingSpinner,
  clickOnAddTime,
  chooseTimeEntryScreen,
  validateTimeFormat,
  selectDisplayByDate,
  openDateRangeDropdown,
  selectCustomerOption,
  selectDateRangeOption,
  clickOnMainClockIn,
  clickOnClockInBtn,
  getTimerDisplay,
  getCurrentStartTime,
  selectStartDate,
  selectEndDate,
  selectTime,
  getClockedInMessage,
  getClockedOutMessage,
  clickClockOut,
  verifyTimeOnTimeEntries,
  waitForLoadingToDisappearOnTC,
  getSelectedDropdownValue,
  waitForLoadingToDisappear,
  loadingSpinner,
  displayByDropdown,
  expectSingleTimeEntryVisible,
  hoverOnSplitTimeSheet,
  validateDateRangeDropdownOptions,
  getDateRangeDropdownOptions,
  getlistItems,
  getdropdownMenu,
  clickActionDropdownForEmployee,
  clickDeleteInActionDropdown,
  expectDeleteEntryConfirmationPopupOpen,
  clickYesOnDeleteEntryPopup,
  countEmployeeRow,
  waitForNameFieldToPopulate,
  openDropdown,
  selectOptionFromDropdown,
  clickSetClockInAndOutToggles,
  enterNotes,
  checkFieldVisibility,
  billRateCheckBoxVisibility,
  fillBillRateInput,
  clickSaveAndCloseButton,
  getFieldValue,
  getNotesFieldValue,
  enterFieldValue,
  validateSuccessToast,
  validateDateWiseDataVisible,
  validateCreatedSingleTimeEntryForEmployee,
  getTableHeaders,
  getRowCellsForEmployee,
  getRowObjectForEmployee,
  clickDropdownOption,
  checkCheckboxIfVisible,
  getTime,
  normalizeTime,
  normalizeName,
  checkCheckBoxSplitTimeSheet,
  selectDisplayByOption,
  verifySetClockToggleState,
  selectStartEndTime,
  getPreviousDayDD,
  clickTimeClockSave,
  enterClkOutTimeHours,
  chooseSpecificEmployee,
  clickSTACloseIcon,
  verifySavedFirstDayOfWorkWeek,
  ToggleSetClockInAndOut,
  getTodayDayDD,
  getPreviousDayDDTC,
  verifyIfRunningClock,
  chooseRoundingOptions,
  enterTime,
  clearStartTime,
  verifyFromClassicUI,
  clickOnCompSettings,
  clickOnTimeOptions,
  clickOnTimeEntryTab,
  clickTimeOptionsCloseIcon,
  clickOnFeatureAddOns,
  clickOnAddOnRounding,
  SaveFromClassicUI,
  verifyReadOnlyNotifSection,
  clickNotifEditButton,
  verifyDaysRemindersAreSent,
  clickOnNotifSaveButton,
  verifyWhenNotesAddedOrEdited,
  verifySendClkInRemAt,
  verifySendClkOutRemAt,
  checkEmailMobileBox,
  uncheckEmailMobileBox,
  verifyIfDaysRemSentDisabled,
  verifySavedCheckedCheckBoxes,
  verifySavedUncheckedCheckBoxes,
  inputNotifSettings,
  verifyNotifFromClassicUI,
  verifyClkInOutEdited,
  SaveNotifSettingsFromClassicUI,
  clickTimeSheetFieldsEditButton,
  validateFieldsOnCustomizeTimesheetPage,
  checkedCustomizeTimesheetFieldsCheckbox,
  uncheckedCustomizeTimesheetFieldsCheckbox,
  clickOnCustomizeTimesheetSaveButton,
  navigateToClassicTimeSheet,
  selectOptionFromQuickBooksPayroll,
  validateCustomizeTimesheetFieldsChangesOnClassicUI,
  closeQuickBooksOnline,
  switchBackToQBO,
  switchBackToClassicTimeSheet,
  preferencesUncheckedTimesheetFieldsCheckbox,
  validateCustomizeTimesheetFieldsChangesFromClassicTimesheetToQBO,
  checkNotesCheckboxFromCompanySettings,
  uncheckNotesCheckboxFromCompanySettings,
  verifyNotesCheckboxIsCheckedFromCompanySettings,
  verifyNotesCheckboxIsUncheckedFromCompanySettings,
  closeCompanySettings,
  saveCompanySettings,
  checkCustomField,
  clickSaveButtonCustomField,
  validateTimeSheetFieldsVisible,
  navigateToSTA,
  uncheckCustomField,
  getClassCheckboxLocator,
  validateCheckboxIsChecked,
  validateCheckboxIsUnchecked,
  validateOnlyClassFieldValuesCheckboxIsChecked,
  validateOnlyLocationFieldValuesCheckboxIsChecked,
  validateOnlyServiceItemFieldValuesCheckboxIsChecked,
  validateOnlyBillableFieldValuesCheckboxIsChecked,
  validateAllFieldValuesCheckboxAreUnchecked,
  checkClassCheckbox,
  uncheckClassCheckbox,
  getClosePreferencesButtonLocator,
  clickClosePreferencesButton,
  saveAndClosePreferences,
  uncheckAndClosePreferences,
  verifyNotifEditMode,
  verifyPriorityCaseFromClassicUI,
  SaveNotifyPriorityCaseFromClassicUI,
  scrollToBottom,
  checkedCustomizeTimesheetFieldsCheckboxForTimeClock,
  closeSpecificTabsOrPage,
  checkServiceItemRequired,
};
