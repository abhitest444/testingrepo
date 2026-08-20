import { Page, Locator, expect } from '@playwright/test';
import { testData } from '../../constants';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(timezone);
dayjs.extend(utc);

// Locator getters
export const getLoadingSpinner = (page: Page) => {
  return page.locator(`#app`).getByRole('progressbar', { name: 'Loading' });
};

export const getTcLoadingSpinner = (page: Page) => {
  return page
    .locator(`[data-test-id="time-clock-loading"]`)
    .getByRole('progressbar', { name: 'Loading' });
};

export const getDropdownMenu = (page: Page) => {
  return page.locator(
    `//div[contains(@class, 'DateRangeSelect') and @role='listbox']`,
  );
};

export const getListItems = (page: Page) => {
  return getDropdownMenu(page).locator('li');
};

// Action functions
export const getDropdownOptions = async (page: Page) => {
  const textContents = await getListItems(page).allInnerTexts();
  return textContents
    .filter((text) => text.trim() !== '')
    .map((text) => text.split('\n')[0].trim());
};

export const navigateToTimeClock = async (page: Page) => {
  await page.goto('/app/time?jobId=time', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await waitForLoadingToDisappear(page);
};

export const waitForLoadingToDisappear = async (page: Page) => {
  return await getLoadingSpinner(page).waitFor({ state: 'hidden', timeout: 0 });
};

export const waitForLoadingToDisappearTCPopup = async (page: Page) => {
  return await getTcLoadingSpinner(page).waitFor({
    state: 'hidden',
    timeout: 0,
  });
};

export const clickClockIn = async (page: Page) => {
  if (
    await page
      .locator(
        `//button/span[contains(@class, 'TimeActionButton')] /*[name()='svg']`,
      )
      .isVisible()
  ) {
    await page
      .locator(
        `//button/span[contains(@class, 'TimeActionButton')] /*[name()='svg']`,
      )
      .click();
    await waitForLoadingToDisappearTCPopup(page);
    await page.waitForLoadState('load');

    // Wait for service dropdown to be visible and enabled
    const serviceDropdown = page.locator(
      `//span[contains(text(),'Service')]/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    );

    await serviceDropdown.waitFor({ state: 'visible' });
    await expect(serviceDropdown).toBeEnabled();

    // Click on service dropdown to open options
    await serviceDropdown.click();

    // Wait for dropdown options to appear and get available service items
    await page.waitForTimeout(3000);
    const visibleListbox = page.locator(
      "div[role='listbox']:visible, ul[role='listbox']:visible",
    );
    const optionLabels = visibleListbox.locator(
      "ul[role='option'] span.rowTextLabel, li[role='option'] span.rowTextLabel",
    );

    await expect
      .poll(async () => await optionLabels.count(), { timeout: 10000 })
      .toBeGreaterThan(0);

    const serviceOptions = (await optionLabels.allTextContents()).map((t) =>
      t.trim(),
    );

    console.log(serviceOptions);
    expect(serviceOptions.length).toBeGreaterThan(0);

    // Select the first available service option
    await page.getByRole('option', { name: serviceOptions[0] }).click();

    await clickClockOut(page);
  }
  await waitForLoadingToDisappear(page);
  await page.locator(`//button/span[text()='Clock in']`).click();
  await waitForLoadingToDisappearTCPopup(page);
};

export const clickOnClockInButton = async (page: Page) => {
  await page
    .locator('[data-test-id="time-clock-in-button"]')
    .waitFor({ state: 'visible' });
  await page.locator('[data-test-id="time-clock-in-button"]').click();
};

export const clickOnClockInButtonFromAddTime = async (page: Page) => {
  await page.getByRole('button', { name: 'Add time' }).click();
  await page.getByRole('option', { name: 'Time clock' }).click();
};

export const clickClockOut = async (page: Page) => {
  await page.locator('[data-test-id="time-clock-out-button"]').click();
  await waitForLoadingToDisappear(page);
};

export const isClockInVisible = async (page: Page) => {
  return await page.locator(`//button/span[text()='Clock in']`).isVisible();
};

export const isClockInButtonVisible = async (page: Page) => {
  return await page
    .locator('[data-test-id="time-clock-in-button"]')
    .isVisible();
};

export const isClockOutButtonVisible = async (page: Page) => {
  return await page
    .locator('[data-test-id="time-clock-out-button"]')
    .isVisible();
};

export const isClockInScreenVisible = async (page: Page) => {
  return await page
    .locator('[data-test-id="time-clock-in-button"]')
    .isVisible();
};

export const getTimerDisplay = async (page: Page) => {
  return await page
    .locator(
      `//div[contains(@class, 'TimerDisplayContainer')]/div[contains(@class, 'TimerDisplay')]`,
    )
    .textContent();
};

export const validateTimerGreaterThanZero = async (page: Page) => {
  const timer = await getTimerDisplay(page);
  if (!timer) {
    return false;
  }
  const [hours, minutes, seconds] = timer.split(':').map(Number);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return totalSeconds > 0;
};

export const getTodayTime = async (page: Page) => {
  return await page
    .locator(`//span[text()='Today']//following-sibling::span`)
    .textContent();
};

export const getWeekTotalTime = async (page: Page) => {
  return await page
    .locator(`//span[text()='This Week']//following-sibling::span`)
    .textContent();
};

export const getAdminHeader = async (page: Page) => {
  return await page
    .locator(`//h2[contains(@class, 'TimerComponent__TimerHeading')]`)
    .textContent();
};

export const chooseCustomerProject = async (page: Page, option: string) => {
  await page.waitForTimeout(5000);
  await page.getByRole('option', { name: option }).click();
};

export const selectCustomerProject = async (page: Page, option: string) => {
  const labels = ['Customers', 'Customer/Project'];
  for (const label of labels) {
    try {
      const dropdown = page.locator(
        `//span[contains(text(),'${label}')]/../following-sibling::div[contains(@class,'Dropdown')]//div[contains(@class,'DropdownTypeahead-iconBox')]`,
      );
      await dropdown.first().click({ force: true });
      await page.waitForTimeout(2000);
      await page.getByRole('option', { name: option }).click();
      return;
    } catch {
      continue;
    }
  }
  throw new Error('Customer option not found');
};

export const getTodayDayDD = (): string => {
  const today = dayjs();
  return today.format('DD');
};

export const getPreviousDayDD = (): string => {
  const previousDay = dayjs().subtract(1, 'day');
  return previousDay.format('DD');
};

export const getNextDayDD = (): string => {
  const nextDay = dayjs().add(1, 'day');
  return nextDay.format('DD');
};

export const waitForDrawerVisible = async (page: Page) => {
  await page
    .locator(`[data-test-id="time-clock-header"]`)
    .waitFor({ state: 'visible' });
};

export const isDrawerNotVisible = async (page: Page) => {
  expect(page.locator(`[data-test-id="time-clock-header"]`)).not.toBeVisible();
};

export const selectCurrentDate = async (page: Page) => {
  await page.locator(`//button[@aria-label='Start date Calendar']`).click();
  await page.getByTitle('Current Date').click();
  await waitForLoadingToDisappear(page);
};

export const selectDate = async (page: Page, date: string) => {
  await page.locator(`//button[@aria-label='Start date Calendar']`).click();

  // Remove leading zero if present and convert to number
  const dateNum = parseInt(date.replace(/^0+/, ''), 10);

  if (dateNum > 7) {
    await page
      .getByRole('button', { name: dateNum.toString(), exact: true })
      .first()
      .click();
  } else {
    await page
      .getByRole('row', { name: '1 2 3 4 5 6 7' })
      .getByRole('button', { name: dateNum.toString() })
      .click();
  }

  await waitForLoadingToDisappear(page);
};

export const selectTime = async (page: Page, time: string) => {
  await page
    .locator(
      `//span[text()='Start time']/../div/div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .click();

  // Get all available time options
  const options = await page
    .locator(`//li[contains(@class, "Menu-menu-item-container")]`)
    .allTextContents();

  // Find the closest time option
  const targetTime = time.trim();

  await page.getByRole('option', { name: targetTime }).click();
  await waitForLoadingToDisappear(page);
};

// Helper function to convert time string to minutes
const getMinutesFromTime = (timeStr: string): number => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes;

  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (period === 'AM' && hours === 12) {
    totalMinutes -= 12 * 60;
  }

  return totalMinutes;
};

export const clearStartDate = async (page: Page) => {
  await page.locator(`//span[text()='Start date']/../div/input`).clear();
};

export const clearStartTime = async (page: Page) => {
  await page.locator(`//span[text()='Start time']/../div/input`).clear();
};

export const getCustomerProjectOptions = async (page: Page) => {
  const labels = ['Customer', 'Customer/Project'];
  const listboxOptionsLocator =
    "ul[role='listbox'] li[role='option'] span[class*='CustomerDropdown__RowTextLabel'], ul[role='listbox'] li[role='option'] span[class*='RowTextLabel']";
  for (const label of labels) {
    try {
      const customerElement = page.locator(
        `//span[contains(text(),'${label}')]/../following-sibling::div[contains(@class,'Dropdown')]//div[contains(@class,'DropdownTypeahead-iconBox')]`,
      );
      await customerElement.first().click({ force: true });
      await page.waitForTimeout(5000);
      const options = await page
        .locator(listboxOptionsLocator)
        .allTextContents();
      await customerElement.first().click();

      const trimmedOptions = options.map((t) => t.trim());
      if (trimmedOptions.length > 0) return trimmedOptions;
    } catch {
      continue;
    }
  }
  return [];
};

export const getServiceItemOptions = async (page: Page) => {
  const serviceElement = page.locator(
    `//span[contains(text(),'Service')]/..//following-sibling::div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
  );

  // Open the service dropdown
  await serviceElement.click({ force: true });

  // Scope to the currently visible dropdown listbox
  const visibleListbox = page.locator(
    "div[role='listbox']:visible, ul[role='listbox']:visible",
  );
  const optionLabels = visibleListbox.locator(
    "li[role='option'] span[class*='ServiceDropdown__RowTextLabel'], li[role='option'] span[class*='RowTextLabel']",
  );

  // Wait until at least one option is rendered
  await expect
    .poll(async () => await optionLabels.count(), {
      timeout: 10000,
    })
    .toBeGreaterThan(0);

  const options = (await optionLabels.allTextContents()).map((t) => t.trim());

  // Close the dropdown
  await serviceElement.click();

  return options;
};

export const getClassOptions = async (page: Page) => {
  const classElement = page.locator(
    `//span[text()='Class']/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
  );
  await page.waitForTimeout(5000);
  await classElement.click({ force: true });
  await page.waitForTimeout(5000);
  const options = await page
    .locator(
      "ul[role='option'] span[class='rowTextLabel'], li[role='option'] span[class='rowTextLabel']",
    )
    .allTextContents();
  await classElement.click();
  return options;
};

export const getDepartmentOptions = async (page: Page) => {
  const locationElement = page.locator(
    `//span[text()='Department']/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
  );
  await page.waitForTimeout(5000);
  await locationElement.click({ force: true });
  await page.waitForTimeout(5000);
  const options = await page
    .locator(
      "ul[role='option'] span[class='rowTextLabel'], li[role='option'] span[class='rowTextLabel']",
    )
    .allTextContents();
  await locationElement.click();
  return options;
};

export const getLocationOptions = async (page: Page) => {
  const locationElement = page.locator(
    `//span[text()='Location']/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
  );
  await page.waitForTimeout(5000);
  await locationElement.click({ force: true });
  await page.waitForTimeout(5000);
  const options = await page
    .locator(
      "ul[role='option'] span[class='rowTextLabel'], li[role='option'] span[class='rowTextLabel']",
    )
    .allTextContents();
  await locationElement.click();
  return options;
};

export const getDateTimeOptions = async (page: Page) => {
  await page
    .locator(
      `//span[text()='Start time']/../div/div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .click();

  const options = await page
    .locator(`//li[contains(@class, "Menu-menu-item-container")]`)
    .allTextContents();

  await page
    .locator(
      `//span[text()='Start time']/../div/div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .click();

  return options.map((opt) => opt.trim()).filter((opt) => opt.length > 0);
};

export const validateAdminHeader = async (page: Page) => {
  const header = await getAdminHeader(page);
  expect(header).toBeTruthy();
  expect(header).not.toBe('');
};

export const validateDateRangeDropdownOptions = async (page: Page) => {
  const options = await getDropdownOptions(page);
  expect(options).toContain('This month');
  expect(options).toContain('Last month');
  expect(options).toContain('This week');
  expect(options).toContain('Last week');
};

export const validateClockInButtonVisibility = async (page: Page) => {
  await page.waitForTimeout(9000);
  expect(await isClockInButtonVisible(page)).toBeTruthy();
};

export const validateClockInIntialBackgroundColor = async (page: Page) => {
  const timerDisplay = page.locator(
    `//div[contains(@class, 'TimerDisplayContainer')]`,
  );
  const backgroundColor = await timerDisplay.evaluate(
    (el) => window.getComputedStyle(el).backgroundColor,
  );
  expect(backgroundColor).toBe('');
};

export const validateClockOutButtonVisibility = async (page: Page) => {
  expect(await isClockOutButtonVisible(page)).toBeTruthy();
};

export const validateCustomerProjectSelection = async (page: Page) => {
  const options = await getCustomerProjectOptions(page);
  expect(options.length).toBeGreaterThan(0);
  if (options.length > 0) {
    await selectCustomerProject(page, options[0]);
    const selectedValue = await page
      .locator(`//span[text()='Customers']/..//input`)
      .inputValue();
    expect(selectedValue).toContain(options[0]);
  }
};

export const validateDateTimeSelection = async (page: Page) => {
  await selectCurrentDate(page);
  await selectTime(page, '3:00 PM');
};

export const validateDateTimeRestrictions = async (page: Page) => {
  const previousDay = getPreviousDayDD();
  await selectDate(page, previousDay);
  const options = await getCustomerProjectOptions(page);
  expect(options.length).toBeGreaterThan(0);
  if (options.length > 0) {
    await selectCustomerProject(page, options[0]);
  }
  await clickOnClockInButton(page);
  const errorMsg = await getErrorMessage(page);
  expect(errorMsg).toContain('Start time conflicts with other timesheets');
};

export const openTimeDropdown = async (page: Page) => {
  await page
    .locator(
      `//span[text()='Start time']/../div/div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .click();
};

export const clickClockInSubmit = async (page: Page) => {
  await page.locator('[data-testid="clock-in-submit"]').click();
};

export const getErrorMessage = async (page: Page) => {
  return await page
    .locator(
      `//div[contains(@id,'IDSDatePickerInput')]//span[contains(@class, 'InlineValidationMessage-ivm-message')]`,
    )
    .textContent();
};

export const getTimeErrorMessage = async (page: Page) => {
  return await page
    .locator(
      `//div[contains(@id,'idsDropdownTypeaheadTextField')]//span[contains(@class, 'InlineValidationMessage-ivm-message')]`,
    )
    .textContent();
};

export const getTimeClockScreenErrorMessage = async (page: Page) => {
  return await page
    .locator(`//h2[contains(@class, 'TimeClockError')]`)
    .textContent();
};

export const clickDrawerClose = async (page: Page) => {
  await page
    .locator('[data-test-id="time-clock-header"]')
    .getByRole('button', { name: 'Close' })
    .click();
  await waitForLoadingToDisappear(page);
};

export const getClockedOutMessage = async (page: Page) => {
  return await page
    .locator(`//span[contains(@class, 'ToastMessage-toastMessageText')]/span`)
    .textContent();
};

export const getClockedInMessage = async (page: Page) => {
  return await page
    .locator(`//span[contains(@class, 'ToastMessage-toastMessageText')]/span`)
    .textContent();
};

export const getDateTimeDropdownValue = async (page: Page) => {
  return await page
    .locator(
      `//span[text()='Start time']/../div/div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .inputValue();
};

export const validateTimerDisplayBackgroundColor = async (
  page: Page,
  expectedColor: string,
) => {
  const timerDisplay = page.locator(
    `//div[contains(@class, 'TimerDisplayContainer')]`,
  );
  const backgroundColor = await timerDisplay.evaluate(
    (el) => window.getComputedStyle(el).backgroundColor,
  );
  expect(backgroundColor).toBe(expectedColor);
};

export const selectClass = async (page: Page, option: string) => {
  await page
    .locator(
      `//span[text()='Class']/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .click();
  await page.getByRole('option', { name: option }).click();
};

export const selectLocation = async (page: Page, option: string) => {
  await page
    .locator(
      `//span[text()='Location']/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .click();
  await page.getByRole('option', { name: option }).click();
};

export const selectServiceItem = async (page: Page, option: string) => {
  await page
    .locator(
      `//span[text()='Service']/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .click();
  await page.getByRole('option', { name: option }).click();
};

export const selectDepartment = async (page: Page, option: string) => {
  await page
    .locator(
      `//span[text()='Department']/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .click();
  await page.getByRole('option', { name: option }).click();
};

export const quickfillCustomerProject = async (
  page: Page,
  query: string,
  option: string,
) => {
  await page.locator(`//input[@placeholder='Select customer']`).fill(query);
  await page.getByRole('option', { name: option }).click();
};

export const quickfillServiceItem = async (
  page: Page,
  query: string,
  option: string,
) => {
  await page.locator(`//input[@aria-label='Select service']`).fill(query);
  await page.getByRole('option', { name: option }).click();
};

export const quickfillDepartment = async (
  page: Page,
  query: string,
  option: string,
) => {
  await page.locator(`//input[@placeholder='Select Location']`).fill(query);
  await page.getByRole('option', { name: option }).click();
};

export const quickfillClass = async (
  page: Page,
  query: string,
  option: string,
) => {
  await page.locator(`//input[@aria-label='Select class']`).fill(query);
  await page.getByRole('option', { name: option }).click();
};

export const quickfillLocation = async (
  page: Page,
  query: string,
  option: string,
) => {
  await page.locator(`//input[@placeholder='Select location']`).fill(query);
  await page.getByRole('option', { name: option }).click();
};

// Fill Task Code field
export const fillTaskCode = async (page: Page, value: string) => {
  await page.locator(`//span[contains(text(),'Task')]/..//input`).fill(value);
};

// Fill Equipment Used field
export const fillEquipmentUsed = async (page: Page, value: string) => {
  await page
    .locator(`//span[contains(text(),'Equipment')]/..//input`)
    .fill(value);
};

// Select Shift from dropdown
export const selectShift = async (page: Page, option?: string) => {
  await page
    .locator(
      `//span[contains(text(),'Shift')]/..//div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .click();
  const shiftOptions = await page
    .locator(`//div[contains(@id, 'idsDropdownTypeahead')]//li`)
    .allTextContents();
  if (shiftOptions.length > 0) {
    const toSelect = option || shiftOptions[0];
    await page.getByRole('option', { name: toSelect }).click();
  }
};

// Export all utilities as a single object
export default {
  getLoadingSpinner,
  getTcLoadingSpinner,
  getDropdownMenu,
  getListItems,
  getDropdownOptions,
  navigateToTimeClock,
  waitForLoadingToDisappear,
  waitForLoadingToDisappearTCPopup,
  clickClockIn,
  clickOnClockInButton,
  clickOnClockInButtonFromAddTime,
  clickClockOut,
  isClockInVisible,
  isClockInButtonVisible,
  isClockOutButtonVisible,
  isClockInScreenVisible,
  getTimerDisplay,
  validateTimerGreaterThanZero,
  getTodayTime,
  getWeekTotalTime,
  getAdminHeader,
  selectCustomerProject,
  getTodayDayDD,
  getPreviousDayDD,
  getNextDayDD,
  waitForDrawerVisible,
  isDrawerNotVisible,
  selectCurrentDate,
  selectDate,
  selectTime,
  clearStartDate,
  clearStartTime,
  getCustomerProjectOptions,
  getDateTimeOptions,
  validateAdminHeader,
  validateDateRangeDropdownOptions,
  validateClockInButtonVisibility,
  validateClockInIntialBackgroundColor,
  validateClockOutButtonVisibility,
  validateCustomerProjectSelection,
  validateDateTimeSelection,
  validateDateTimeRestrictions,
  openTimeDropdown,
  clickClockInSubmit,
  getErrorMessage,
  getTimeErrorMessage,
  clickDrawerClose,
  getClockedOutMessage,
  getClockedInMessage,
  getDateTimeDropdownValue,
  validateTimerDisplayBackgroundColor,
  selectLocation,
  quickfillCustomerProject,
  quickfillServiceItem,
  quickfillDepartment,
  quickfillClass,
  quickfillLocation,
  getServiceItemOptions,
  getClassOptions,
  selectClass,
  selectServiceItem,
  selectDepartment,
  getLocationOptions,
  getDepartmentOptions,
  getTimeClockScreenErrorMessage,
  fillTaskCode,
  fillEquipmentUsed,
  selectShift,
  chooseCustomerProject,
};
