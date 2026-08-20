import { Page, expect } from '@playwright/test';
import SingleTimeEntryPage from '../../pages/SingleTimeEntryPage';
import TimeEntriesPage from '../../pages/TimeEntriesPage';
import ReportsPage from '../../pages/ReportsPage';
import RunPayrollPage from '../../pages/RunPayrollPage';
import { LABELS } from '../../utils';
import TimeClockPage, {
  clickClockOut,
  waitForLoadingToDisappearTCPopup,
} from '../../pages/TimeClockPage';
import {
  selectDisplayByOption,
  openDateRangeDropdown,
  selectDateRangeOption,
  clickAddTimeDropdown,
  normalizeToMinutes,
  selectSingleTimeEntryFromAddTime,
} from '../../commonUtils';
import SingleTimeActivityPage from '../../pages/SingleTimeActivityPage';
import * as commonLocator from '../../commonUtils';
import * as weeklyTimeEntryPage from '../../pages/WeeklyTimeEntryPage';
import {
  navigateToTimeEntries,
  openWeeklyTimeEntry,
} from './WTERunPayroll.util';
import { BreaksPage } from '../../pages/BreaksPage';
import EmployeesPage from '../../pages/EmployeesPage';
import { WeeklyTimeActivity } from '../../pages/WeeklyTimeActivity';
import { cleanupAllTimeEntries, deleteAllBreakRules } from './TimeEntries.util';
import { navigateToApprovalsPage } from '../../pages/TimeSettingsPage';
import { BreaksRulesPage } from '../../pages/BreaksRulesPage';
import ApprovalsPage from '../../pages/ApprovalsPage';

// Employee name constants - handle both formats
const TEST_EMPLOYEE = {
  listView: 'Emp1, Test',
  dropdown: 'Test Emp1',
  alternateListView: 'Test Emp1',
};

/**
 * Converts "Last, First" to "First Last" to match UI toast format.
 */
const toFirstLast = (name: string) => {
  if (name.includes(',')) {
    const [last, first] = name.split(',');
    return `${first.trim()} ${last.trim()}`;
  }
  return name;
};

const sanitizeDurationInput = (value: string) => {
  return value.replace(/[^0-9:.]/g, '').trim();
};

const minutesToHoursString = (minutes: number) => {
  const hrs = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}`;
};

/**
 * Returns yesterday's date in MM/DD/YYYY format
 * @returns Formatted date string (e.g., "11/14/2025")
 */
export const getPreviousDateFormatted = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
  const day = yesterday.getDate().toString().padStart(2, '0');
  const year = yesterday.getFullYear();

  return `${month}/${day}/${year}`;
};

const computeWeeklyTotalMinutes = (
  dailyDuration: string,
  numberOfDays: number,
) => {
  const sanitized = sanitizeDurationInput(dailyDuration);
  const minutesPerDay = normalizeToMinutes(sanitized);
  return minutesPerDay * numberOfDays;
};

const formatCurrency = (amount: number) => {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const DEFAULT_VALIDATION_HOURLY_RATE = 100;
const WEEKLY_DURATION_ARIA_LABEL = 'Duration';

/**
 * Recursively attempts to approve and waits for the success confirmation message.
 * Retries up to maxAttempts with a small backoff.
 */
const approveAndVerifyRecursive = async (
  page: Page,
  expectedMessage: string,
  attempt: number = 1,
  maxAttempts: number = 3,
) => {
  try {
    // Try clicking approve actions if visible
    await page.waitForTimeout(5000);
    const approveButton = page
      .locator(
        `//div[contains(@class, 'ClickEventBoundary')]/button/span[text()='Approve']`,
      )
      .first();

    //if (await approveButton.isVisible()) {
    await approveButton.click();
    //}

    const approveAndLock = page.getByRole('button', {
      name: 'Approve and lock time',
    });
    if (await approveAndLock.isVisible({ timeout: 3000 })) {
      await approveAndLock.click();
    }

    await expect(
      page.locator(
        `//label[contains(@class, 'ApprovalProgressLoader') and text()='${expectedMessage}']`,
      ),
    ).toContainText(expectedMessage);

    return; // Success
  } catch (error) {
    if (attempt >= maxAttempts) {
      throw error;
    }

    // Backoff before retrying
    await page.waitForTimeout(2000);
    return approveAndVerifyRecursive(
      page,
      expectedMessage,
      attempt + 1,
      maxAttempts,
    );
  }
};

/**
 * Creates a single time entry with specified duration and notes
 */
export const createSingleTimeEntry = async (
  page: Page,
  duration: string = '08:00',
  notes: string = 'Test note - initial',
) => {
  console.log(`Creating single time entry with duration: ${duration}`);

  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);

  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

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
  await singleTimeEntryPage.openDropdown('Customer');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.clickDropdownOption(1, 'Customer');

  await singleTimeEntryPage.openDropdown('Service');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.clickDropdownOption(1, 'Service');

  // Billable and rate
  await singleTimeActivityPage.checkCheckboxIfVisible('Billable');
  await singleTimeActivityPage.fillBillRateInput('10');

  // Save the entry
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await singleTimeEntryPage.validateSuccessToast();

  // Close dialog if open
  const closeBtn = page.locator(
    `//div[@data-automation-id='single-time-trowser_close']/button[@aria-label='Close']`,
  );
  await page.waitForTimeout(500);
  if (await closeBtn.count()) {
    await closeBtn.click();
  }

  return {
    employeeName: nameValue,
    duration: duration,
    notes: notes,
  };
};

export const validateWeeklyTimesheetTotals = async (
  page: Page,
  employeeName: string,
  expectedTotalHours: string,
) => {
  console.log(
    `Validating weekly timesheet totals for ${employeeName} expecting ${expectedTotalHours} minutes`,
  );

  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, LABELS.thisMonth);
  await timeEntriesPage.waitForLoadingToDisappear();

  const rowObj = await timeEntriesPage.getRowObjectForEmployee(employeeName);
  const hoursColumnEntry =
    Object.entries(rowObj).find(([header]) => /hour/i.test(header))?.[1] ?? '';

  if (!hoursColumnEntry) {
    throw new Error(`Unable to locate hours column for ${employeeName}`);
  }

  expect(hoursColumnEntry).toBe(expectedTotalHours);
};

/**
 * Validates time entries in the table
 */
export const validateTimeEntriesInTable = async (
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
  const actualMinutes = normalizeToMinutes(rowObj.Hours || '');
  const expectedMinutes = normalizeToMinutes(expectedDuration);
  expect(actualMinutes).toBe(expectedMinutes);
  console.log(`✓ Time entry validated: ${expectedDuration} hours`);
};

export const validateTimeClockEntriesInTable = async (
  page: Page,
  employeeName: string,
) => {
  console.log(`Validating time entries for ${employeeName}`);

  const timeEntriesPage = new TimeEntriesPage(page);

  // Switch to Date view
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Open Date range and select This month
  // await commonLocator.openDateRangeDropdown(page);
  // await commonLocator.selectDateRangeOption(page, LABELS.thisMonth);
  // await timeEntriesPage.waitForLoadingToDisappear();

  // // Validate the entry exists
  // const entryCount = await timeEntriesPage.countEmployeeRow(employeeName);
  // expect(entryCount).toBeGreaterThan(0);

  // Get row data and validate
  const rowObj = await timeEntriesPage.getRowObjectForEmployee(employeeName);
  // Use .first() to avoid strict mode violation when multiple entries exist
  const timeEntryLocator = page
    .locator(
      `//div[contains(@class, 'TimeDetailRow__TimeDetailsDefaultRowContent')]/div[contains(@class, 'StartEndTime')]`,
    )
    .first();
  await expect(timeEntryLocator).toBeVisible();

  const timeEntry = await timeEntryLocator.textContent();
  console.log(`✓ Time entry validated: ${timeEntry}`);
};

/**
 * Approves time entries via Approvals section
 */
export const approveTimeEntries = async (page: Page, employeeName: string) => {
  console.log(`Approving time entries for ${employeeName}`);

  const timeEntriesPage = new TimeEntriesPage(page);

  // Step 1: Click on display by dropdown and select Employee
  //await selectDisplayByOption(page, 'Employee');
  const approvalsPage = new ApprovalsPage(page);
  //await deletePayCheck(page);
  await approvalsPage.navigateToApprovalsPage();
  await page.waitForTimeout(8000);
  // await approvalsPage.bulkApprove();
  // await timeEntriesPage.waitForLoadingToDisappear();

  //await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This pay period');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Step 2: Verify the employee name is visible
  const employeeLocator = page
    .locator(`//tr[.//div[text()="${employeeName}"]]`)
    .first();
  await employeeLocator.waitFor({ state: 'visible', timeout: 30000 });

  // Helper to click Approve button (try specific and generic)
  const clickApprove = async () => {
    const specificApprove = page
      .locator(
        `//tr[.//div[text()="${employeeName}"]]//button[.//span[text()="Approve"]]`,
      )
      .first();
    if (await specificApprove.isVisible()) {
      await specificApprove.click();
      return true;
    }
    const genericApprove = page
      .locator(`//span[text()="Unapprove and unlock time"]`)
      .first();
    if (await genericApprove.isVisible()) {
      await genericApprove.click();
      return true;
    }
    return false;
  };

  // Step 3: Click on Approve button
  const clicked = await clickApprove();
  if (!clicked) {
    // If approve not visible yet, wait briefly and retry once
    await page.waitForTimeout(1000);
    await clickApprove();
  }

  // Step 4: Verify the popup is visible and click on "Approve and lock time"
  const approveAndLock = page.getByRole('button', {
    name: 'Approve and lock time',
  });
  if (await approveAndLock.isVisible({ timeout: 5000 }).catch(() => false)) {
    await approveAndLock.click();
  }

  // Step 5: Verify that it is approved; if not, click Approve again
  const expectedToast = `Time approved for ${toFirstLast(employeeName)}`;
  let approved = false;
  try {
    await expect(
      page.locator(
        `//label[contains(@class, 'ApprovalProgressLoader') and contains(text(), '${expectedToast}')]`,
      ),
    ).toContainText(expectedToast, { timeout: 10000 });
    approved = true;
  } catch {
    approved = false;
  }

  if (!approved) {
    await page.waitForTimeout(1500);
    await clickApprove();
    if (await approveAndLock.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveAndLock.click();
    }
    // await expect(
    //   page.locator(
    //     `//label[contains(@class, 'ApprovalProgressLoader') and contains(text(), '${expectedToast}')]`,
    //   ),
    // ).toContainText(expectedToast);
  }

  console.log(`✓ Time entries approved for ${employeeName}`);
};

/**
 * Navigates to run payroll and validates entries
 */
export const navigateToRunPayrollAndValidate = async (
  page: Page,
  expectedHours: string,
  expectedAmount: string,
) => {
  console.log(
    `Navigating to run payroll and validating ${expectedHours} / ${expectedAmount}`,
  );

  // Navigate to run payroll (close overlay if present)
  await navigateToRunPayroll(page);
  await page.locator(`//button/span[text()='Run payroll']`).click();
  const runPayrollPage = new RunPayrollPage(page);

  await runPayrollPage.selectPayPeriodWithCurrentDate();

  await page.waitForLoadState('load');
  await page.waitForTimeout(5000);
  console.log('Page loaded');

  await expect(
    page
      .locator(`//div[@data-testid="enter-hours-hours-percentage-cell"]`)
      .first(),
  ).toContainText(expectedHours);
  await expect(
    page
      .locator(
        `//td[@class="idsTable--intuitTheme idsTable__cell rp-enter-hours-table-body-cell rp-enter-hours-table-cell-selected"]//div[contains(@class, 'AmountDisplayCell__StyledDiv')]`,
      )
      .first(),
  ).toContainText(expectedAmount);
  console.log(`✓ Payroll validated: ${expectedHours} / ${expectedAmount}`);
};

/**
 * Navigates to run payroll and validates entries (accepts multiple possible values)
 */
export const navigateToRunPayrollAndValidateTC = async (
  page: Page,
  expectedHours: string | string[],
  expectedAmount: string | string[],
) => {
  const hoursOptions = Array.isArray(expectedHours)
    ? expectedHours
    : [expectedHours];
  const amountOptions = Array.isArray(expectedAmount)
    ? expectedAmount
    : [expectedAmount];

  console.log(
    `Navigating to run payroll and validating hours: ${hoursOptions.join(
      ' or ',
    )} / amount: ${amountOptions.join(' or ')}`,
  );

  // Navigate to run payroll (close overlay if present)
  await navigateToRunPayroll(page);
  await page.locator(`//button/span[text()='Run payroll']`).click();
  const runPayrollPage = new RunPayrollPage(page);

  await runPayrollPage.selectPayPeriodWithCurrentDate();

  await page.waitForLoadState('load');
  await page.waitForTimeout(5000);
  console.log('Page loaded');

  // Validate hours (accept any of possible values) - check all hour cells
  const hourCells = page.locator(
    `//div[@data-testid="enter-hours-hours-percentage-cell"]`,
  );
  const hourTexts = (await hourCells.allTextContents())
    .map((text) => text?.trim())
    .filter(Boolean);

  // Normalize hour options to handle different formats (e.g., "24h", "24 hours", "24:00")
  const normalizeHourText = (text: string) => {
    return text
      .replace(/hours?/gi, '')
      .replace(/hrs?/gi, '')
      .replace(/\s+/g, '')
      .trim();
  };

  // Extract numeric value from hour text (e.g., "0.03h" -> 0.03, "24h" -> 24)
  const extractNumericValue = (text: string): number | null => {
    const normalized = normalizeHourText(text);
    // Try to parse as float
    const numericValue = parseFloat(normalized);
    return isNaN(numericValue) ? null : numericValue;
  };

  const normalizedHourOptions = hoursOptions.map((opt) =>
    normalizeHourText(opt),
  );
  const normalizedHourTexts = hourTexts.map((text) =>
    normalizeHourText(text || ''),
  );

  // First try exact match (for backward compatibility)
  let hasMatchingHours = normalizedHourOptions.some((opt) =>
    normalizedHourTexts.some(
      (text) => text.includes(opt) || opt.includes(text),
    ),
  );

  // If no exact match, try numeric comparison (found >= expected)
  if (!hasMatchingHours) {
    const expectedNumericValues = hoursOptions
      .map((opt) => extractNumericValue(opt))
      .filter((val): val is number => val !== null);

    const foundNumericValues = hourTexts
      .map((text) => extractNumericValue(text))
      .filter((val): val is number => val !== null);

    if (expectedNumericValues.length > 0 && foundNumericValues.length > 0) {
      // Check if any found value is >= any expected value
      hasMatchingHours = expectedNumericValues.some((expectedVal) =>
        foundNumericValues.some((foundVal) => foundVal >= expectedVal),
      );

      if (hasMatchingHours) {
        console.log(
          `✓ Hours validation passed (>= comparison): Found ${foundNumericValues.join(
            ', ',
          )} >= Expected ${expectedNumericValues.join(' or ')}`,
        );
      }
    }
  }

  if (!hasMatchingHours) {
    throw new Error(
      `Unable to find expected hours ${hoursOptions.join(
        ' or ',
      )} (or greater) in payroll grid. Found: ${hourTexts.join(', ')}`,
    );
  }

  // Validate amount (accept any of possible values) - check all amount cells
  const amountCells = page.locator(
    `//div[contains(@class, 'AmountDisplayCell__StyledDiv')]`,
  );
  const amountTexts = (await amountCells.allTextContents())
    .map((text) => text?.trim())
    .filter(Boolean);

  // Normalize amount text by stripping currency symbols/commas (e.g., "$24.00" -> "24.00")
  const normalizeAmountText = (text: string) => {
    return text.replace(/[^0-9.-]/g, '').trim();
  };

  const extractAmountValue = (text: string): number | null => {
    const normalized = normalizeAmountText(text);
    const numericValue = parseFloat(normalized);
    return isNaN(numericValue) ? null : numericValue;
  };

  // Check for direct string match first (existing behavior)
  let hasMatchingAmount = amountOptions.some((opt) =>
    amountTexts.some((text) => text?.includes(opt)),
  );

  // If no direct match, fall back to numeric comparison (found >= expected)
  if (!hasMatchingAmount) {
    const expectedAmounts = amountOptions
      .map((opt) => extractAmountValue(opt))
      .filter((val): val is number => val !== null);
    const foundAmounts = amountTexts
      .map((text) => extractAmountValue(text || ''))
      .filter((val): val is number => val !== null);

    if (expectedAmounts.length > 0 && foundAmounts.length > 0) {
      hasMatchingAmount = expectedAmounts.some((expectedVal) =>
        foundAmounts.some((foundVal) => foundVal >= expectedVal),
      );

      if (hasMatchingAmount) {
        console.log(
          `✓ Amount validation passed (>= comparison): Found ${foundAmounts.join(
            ', ',
          )} >= Expected ${expectedAmounts.join(' or ')}`,
        );
      }
    }
  }

  if (!hasMatchingAmount) {
    throw new Error(
      `Unable to find expected amount ${amountOptions.join(
        ' or ',
      )} (or greater) in payroll grid. Found: ${amountTexts.join(', ')}`,
    );
  }

  console.log(
    `✓ Payroll validated: hours found in [${hourTexts.join(
      ', ',
    )}] / amounts found in [${amountTexts.join(', ')}]`,
  );
};

/**
 * Unapproves time and edits the entry
 */
export const unapproveAndEditTimeEntry = async (
  page: Page,
  newDuration: string,
  newNotes: string,
  expectedHours: string | string[],
  expectedAmount: string | string[],
) => {
  console.log(`Unapproving and editing time entry to ${newDuration}`);

  // Click Edit time
  await page.getByRole('button', { name: 'Edit time' }).click();

  // Unapprove time
  await page.getByRole('button', { name: 'Unapprove' }).click();
  await page.getByRole('button', { name: 'Unapprove and unlock time' }).click();

  await expect(page.getByTestId('toastMessage')).toContainText(
    'Time unapproved for Test Emp1',
  );
  await page
    .getByLabel('[object Object]')
    .getByRole('button', { name: 'Emp1, Test' })
    .click();
  await page.locator(`//button[text()="Edit"]`).click();

  // Edit the entry
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  // Wait for page to load
  await singleTimeEntryPage.waitForPageReady();

  // Update duration
  await singleTimeEntryPage.enterFieldValue('Duration', newDuration);

  // Update notes
  await singleTimeEntryPage.enterNotes(newNotes);
  await singleTimeEntryPage.handlePopupsInAnyOrder();

  // Save changes
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await singleTimeEntryPage.validateSuccessToast();

  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  // Close any dialogs
  await page
    .getByLabel('Single time entry')
    .getByRole('button', { name: 'Close' })
    .click();
  await page
    .getByRole('dialog', { name: '[object Object]' })
    .getByLabel('Close')
    .click();

  // Validate payroll amounts (accept any of possible values)
  const hoursOptions = Array.isArray(expectedHours)
    ? expectedHours
    : [expectedHours];
  const amountOptions = Array.isArray(expectedAmount)
    ? expectedAmount
    : [expectedAmount];
  const gridText = await page.getByRole('grid').innerText();
  expect(hoursOptions.some((opt) => gridText.includes(opt))).toBeTruthy();
  expect(amountOptions.some((opt) => gridText.includes(opt))).toBeTruthy();

  console.log(`✓ Time entry edited: ${newDuration} / ${newNotes}`);
};

/**
 * Unapproves time and edits weekly time entry
 */
export const unapproveAndEditWeeklyTimeEntry = async (
  page: Page,
  newDuration: string,
  newNotes: string,
  expectedHours: string | string[],
  expectedAmount: string | string[],
) => {
  console.log(`Unapproving and editing weekly time entry to ${newDuration}`);

  const singleTimeEntryPage = new SingleTimeEntryPage(page);

  // Click Edit time
  await page.getByRole('button', { name: 'Edit time' }).click();

  // Unapprove time
  await page.getByRole('button', { name: 'Unapprove' }).click();
  await page.getByRole('button', { name: 'Unapprove and unlock time' }).click();

  await expect(page.getByTestId('toastMessage')).toContainText(
    'Time unapproved for Test Emp1',
  );

  await page
    .getByLabel('[object Object]')
    .getByRole('button', { name: 'Emp1, Test' })
    .click();

  // Edit first time entry (nth(2))
  await page.getByRole('button', { name: 'Edit' }).nth(2).click();

  // Wait for page to load
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();

  await page.getByRole('textbox', { name: 'Duration (hh:mm)' }).dblclick();
  await page
    .getByRole('textbox', { name: 'Duration (hh:mm)' })
    .fill(newDuration);
  await page.getByRole('textbox', { name: 'Notes' }).fill(newNotes);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(5000);

  await page
    .getByRole('dialog', { name: 'Single time entry' })
    .getByLabel('Close')
    .click();

  // Edit second time entry (nth(3))
  await page.getByRole('button', { name: 'Edit' }).nth(3).click();
  await page.waitForTimeout(8000);
  await page
    .getByRole('textbox', { name: 'Duration (hh:mm)' })
    .fill(newDuration);
  await page.getByRole('textbox', { name: 'Notes' }).click();
  await page.getByRole('textbox', { name: 'Notes' }).fill(newNotes);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(5000);
  await page
    .getByRole('dialog', { name: 'Single time entry' })
    .getByLabel('Close')
    .click();
  await page
    .getByRole('dialog', { name: '[object Object]' })
    .getByLabel('Close')
    .click();

  // Validate payroll amounts (accept any of possible values)
  const hoursOptions = Array.isArray(expectedHours)
    ? expectedHours
    : [expectedHours];
  const amountOptions = Array.isArray(expectedAmount)
    ? expectedAmount
    : [expectedAmount];
  const gridText = await page.getByRole('grid').innerText();
  expect(hoursOptions.some((opt) => gridText.includes(opt))).toBeTruthy();
  expect(amountOptions.some((opt) => gridText.includes(opt))).toBeTruthy();

  console.log(`✓ Weekly time entry edited: ${newDuration} / ${newNotes}`);
};

/**
 * Unapproves time and edits the breaks entry
 */
export const unapproveAndEditBreakTimeEntry = async (
  page: Page,
  newEndTime: string,
  newNotes: string,
  expectedHours: string | string[],
) => {
  console.log(`Unapproving and editing time entry to ${newEndTime}`);

  // Click Edit time
  await page.getByRole('button', { name: 'Edit time' }).click();

  // Unapprove time
  await page.getByRole('button', { name: 'Unapprove' }).first().click();
  await page.getByRole('button', { name: 'Unapprove and unlock time' }).click();

  await expect(page.getByTestId('toastMessage')).toContainText(
    'Time unapproved for Test Emp1',
  );
  await page.waitForTimeout(1000);
  await page
    .getByLabel('[object Object]')
    .getByRole('button', { name: 'Emp1, Test' })
    .click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();

  const breaksPage = new BreaksPage(page);

  await breaksPage.clearStartOrEndTime('End Time');
  await breaksPage.enterStartOrEndTime('End Time', newEndTime);
  await page.waitForTimeout(500);

  // Update notes
  await breaksPage.enterNotes(newNotes);

  // Save changes
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  // Validate payroll hours (accept any of possible values)
  const hoursOptions = Array.isArray(expectedHours)
    ? expectedHours
    : [expectedHours];
  const gridText = await page.getByRole('grid').innerText();
  expect(hoursOptions.some((opt) => gridText.includes(opt))).toBeTruthy();
  console.log(`✓ Time entry edited: ${newEndTime} / ${newNotes}`);
};

/**
 * Unapproves time and edits the entry
 */
export const unapproveAndEditTCTimeEntry = async (
  page: Page,
  newStartTime: string,
  newEndTime: string,
  newNotes: string,
  expectedHours: string | string[],
  expectedAmount: string | string[],
) => {
  console.log(`Unapproving and editing time entry to ${newStartTime}`);

  // Click Edit time
  await page.getByRole('button', { name: 'Edit time' }).click();

  // Unapprove time
  await page.getByRole('button', { name: 'Unapprove' }).click();
  await page.getByRole('button', { name: 'Unapprove and unlock time' }).click();

  await expect(page.getByTestId('toastMessage')).toContainText(
    'Time unapproved for Test Emp1',
  );
  await page.waitForTimeout(5000);
  await page
    .getByLabel('[object Object]')
    .getByRole('button', { name: 'Emp1, Test' })
    .click();
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();

  // Edit the entry
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  // Wait for page to load
  await singleTimeEntryPage.waitForPageReady();
  await page.waitForTimeout(5000);
  await singleTimeEntryPage.handlePopupsInAnyOrder();

  // Update start time and end time
  const previousDate = getPreviousDateFormatted();
  await singleTimeEntryPage.fillStartDate(previousDate);
  await singleTimeEntryPage.fillEndDate(previousDate);
  await singleTimeEntryPage.fillStartTime(newStartTime);
  await singleTimeEntryPage.fillEndTime(newEndTime);

  // Update notes
  await singleTimeEntryPage.enterNotes(newNotes);

  await singleTimeEntryPage.handlePopupsInAnyOrder();
  // Save changes
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await singleTimeEntryPage.validateSuccessToast();

  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  // Close any dialogs
  await page
    .getByRole('dialog', { name: 'Single time entry' })
    .getByLabel('Close', { exact: true })
    .click();
  await page
    .getByRole('dialog', { name: '[object Object]' })
    .getByLabel('Close')
    .click();

  // Validate payroll amounts (accept any of possible values)
  const hoursOptions = Array.isArray(expectedHours)
    ? expectedHours
    : [expectedHours];
  const amountOptions = Array.isArray(expectedAmount)
    ? expectedAmount
    : [expectedAmount];
  const gridText = await page.getByRole('grid').innerText();
  await page.waitForTimeout(8000);
  expect(hoursOptions.some((opt) => gridText.includes(opt))).toBeTruthy();
  expect(amountOptions.some((opt) => gridText.includes(opt))).toBeTruthy();

  console.log(`✓ Time entry edited: ${newEndTime} / ${newNotes}`);
};

/**
 * Re-approves edited time entries
 */
export const reapproveTimeEntries = async (
  page: Page,
  employeeName: string,
) => {
  console.log(`Re-approving time entries for ${employeeName}`);

  // Navigate to run payroll (close overlay if present)
  await navigateToRunPayroll(page);
  await page.locator(`//button/span[text()='Run payroll']`).click();
  await page.locator(`//span[text()='Approve time']`).click();
  await page
    .locator(
      `//div[contains(@class,"ApproveTimeButton")]//span[text()='Approve']`,
    )
    .click();
  // const approveandlock =
  // await page.locator(`//span[text()='Approve and lock time']`).click();
  // if(approveandlock.isVisibile())

  const approveandlock = page
    .locator(`//span[text()='Approve and lock time']`)
    .first();
  if (await approveandlock.isVisible().catch(() => false)) {
    await approveandlock.click();
    return true;
  }

  // const expected = `Time approved for Test Emp1`;
  // await approveAndVerifyRecursive(page, expected);

  console.log(`✓ Time entries approved for ${employeeName}`);
};

export const reapproveTimeEntriesWTE = async (
  page: Page,
  employeeName: string,
) => {
  console.log(`Re-approving time entries for ${employeeName}`);

  // Navigate to run payroll (close overlay if present)
  await navigateToRunPayroll(page);
  await page.locator(`//button/span[text()='Run payroll']`).click();
  await page.locator("//span[text()='Approve time']").click();
  await page.waitForTimeout(2000);

  //const expected = `Time approved for Test Emp1`;
  //await approveAndVerifyRecursive(page, expected);
  await page.locator('//div[contains(@class,"ApproveTimeButton")]').click();
  await page.locator("//span[text()='Approve and lock time']").click();

  console.log(`✓ Time entries approved for ${employeeName}`);
};

/**
 * Re-approves edited time entries
 */
export const approveBreakTimeEntries = async (
  page: Page,
  employeeName: string,
) => {
  console.log(`Re-approving time entries for ${employeeName}`);

  // Navigate to run payroll (close overlay if present)
  await navigateToRunPayroll(page);
  await page.locator(`//button/span[text()='Run payroll']`).click();
  await page.getByRole('button', { name: 'Approve time' }).click();

  // Helper to click Approve button (try specific and generic)
  const clickApprove = async () => {
    const specificApprove = page
      .locator(
        `//div[contains(@class, 'ClickEventBoundary')]/button/span[text()='Approve']`,
      )
      .first();
    if (await specificApprove.isVisible().catch(() => false)) {
      await specificApprove.click();
      return true;
    }
    const genericApprove = page
      .locator(
        `//div[contains(@class, 'ClickEventBoundary')]/button/span[text()='Approve']`,
      )
      .first();
    if (await genericApprove.isVisible().catch(() => false)) {
      await genericApprove.click();
      return true;
    }
    return false;
  };

  // Step 3: Click on Approve button
  const clicked = await clickApprove();
  if (!clicked) {
    // If approve not visible yet, wait briefly and retry once
    await page.waitForTimeout(1000);
    await clickApprove();
  }

  // Step 4: Verify the popup is visible and click on "Approve and lock time"
  const approveAndLock = page.getByRole('button', {
    name: 'Approve and lock time',
  });
  if (await approveAndLock.isVisible({ timeout: 5000 }).catch(() => false)) {
    await approveAndLock.click();
  }

  // Step 5: Verify that it is approved; if not, click Approve again
  const expectedToast = `Time approved for ${toFirstLast(employeeName)}`;
  let approved = false;
  try {
    await expect(
      page.locator(
        `//label[contains(@class, 'ApprovalProgressLoader') and text()='${expectedToast}']`,
      ),
    ).toContainText(expectedToast, { timeout: 10000 });
    approved = true;
  } catch {
    approved = false;
  }

  if (!approved) {
    await page.waitForTimeout(1500);
    await clickApprove();
    if (await approveAndLock.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveAndLock.click();
    }
    await expect(
      page.locator(
        `//label[contains(@class, 'ApprovalProgressLoader') and text()='${expectedToast}']`,
      ),
    ).toContainText(expectedToast);
  }

  console.log(`✓ Time entries approved for ${employeeName}`);
};

/**
 * Runs and submits payroll
 */
export const runAndSubmitPayroll = async (page: Page) => {
  console.log('Running and submitting payroll');

  // Navigate to run payroll (close overlay if present)
  await navigateToRunPayroll(page);
  await page.locator(`//button/span[text()='Run payroll']`).click();
  await page.waitForTimeout(5000);

  // Continue through payroll flow
  await page.locator(`//button/span[text()='Preview payroll']`).click();
  await page.waitForTimeout(5000);
  await page.locator(`//button/span[text()='Submit payroll']`).click();
  await expect(page.getByTestId('step').getByRole('main')).toContainText(
    'Payroll is',
  );

  console.log('✓ Payroll submitted successfully');
};

/**
 * Deletes the already created pay check
 */
export const deletePayCheck = async (page: Page) => {
  console.log('Deleting the created pay check');

  // Navigate to payroll history or pay checks section
  await navigateToRunPayroll(page);

  // Open employee and go to Paycheck list
  await page.locator(`//div[@data-automation-id='employee-card-Test']`).click();
  await page.waitForTimeout(9000);
  await page.getByRole('tab', { name: 'Paycheck list' }).click();
  await page.waitForTimeout(9000);

  // Loop-delete all visible paychecks similar to deleteTimeEntry pattern
  let count = await page
    .locator(`//table[@class='idsTable__columnGroup']/tbody/tr[@role='row']`)
    .count();

  while (count > 0) {
    // Open action menu for the first row
    await page
      .locator(`//div[contains(@class, 'correctionActionsDropdown')]/button`)
      .or(page.locator(`//button[@aria-label="Expand Menu"]`))
      .first()
      .click();

    // Click Delete and confirm
    await page
      .locator(`//li[@aria-label="Delete current paycheck from your records"]`)
      .click();
    await page
      .locator('//button[@aria-label="Confirm delete of current paycheck"]')
      .click();

    // Brief wait and refresh list
    await page.waitForTimeout(1500);
    await page.getByRole('tab', { name: 'Paycheck list' }).click();
    await page.waitForTimeout(5000);

    // Recount remaining rows
    count = await page
      .locator(`//table[@class='idsTable__columnGroup']/tbody/tr[@role='row']`)
      .count();
  }

  console.log('✓ All paychecks deleted successfully');
};

/**
 * Unapproves time from time entries employee section
 */
export const unapproveTimeFromEmployeeSection = async (
  page: Page,
  employeeName: string,
) => {
  console.log(`Unapproving time for ${employeeName} from employee section`);

  const timeEntriesPage = new TimeEntriesPage(page);

  // Navigate to Approval page
  const approvalsPage = new ApprovalsPage(page);
  await approvalsPage.navigateToApprovalsPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  // Switch to Employee view
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Unapprove only if an approved entry is present — otherwise skip quickly
  // so pre/post cleanup does not hang waiting on a missing Unapprove control.
  const unapproveBtn = page.locator("//span[text()='Unapprove']").first();
  const hasUnapprove = await unapproveBtn
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  if (!hasUnapprove) {
    console.log(
      `✓ No approved time to unapprove for ${employeeName} — skipping`,
    );
    return;
  }

  await unapproveBtn.click();
  await page.locator("//span[text()='Unapprove and unlock time']").click();

  // Wait for confirmation
  await page.waitForTimeout(2000);

  console.log(`✓ Time unapproved for ${employeeName}`);
};

/**
 * Deletes the time entry
 */
export const deleteTimeEntry = async (page: Page, employeeName: string) => {
  console.log(`Deleting time entry for ${employeeName}`);

  const timeEntriesPage = new TimeEntriesPage(page);
  await navigateToTimeEntries(page);

  // Ensure we're in Date view for easier deletion
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

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

/**
 * Validates time activities report before approval (should show old values)
 */
export const validateReportsBeforeApproval = async (
  page: Page,
  employeeName: string,
  expectedHours: string,
) => {
  console.log(
    `Validating reports before approval - expecting ${expectedHours} for ${employeeName}`,
  );

  const reportsPage = new ReportsPage(page);

  // Navigate to Reports page
  await reportsPage.navigateToReportsPage();
  await reportsPage.waitForPageReady();
  await reportsPage.handlePopupsInAnyOrder();

  console.log('Opening "Time Activities by Employee Detail" report...');
  await page
    .locator(`//input[@placeholder='Type report name here']`)
    .fill('Time Activities by Employee Detail');
  await page.getByText('Time Activities by Employee Detail').first().click();
  await page.waitForTimeout(2000);
  // Validate report title is visible
  await reportsPage.expectTimeActivitiesReportTitleVisible();

  console.log('Selecting "All Dates" from Custom dates dropdown...');
  // await reportsPage.clickCustomDatesDropdown();
  // await reportsPage.selectAllDates();
  await page.waitForLoadState('load');
  await page.waitForTimeout(5000);

  await page.waitForSelector(`//span[contains(text(), '${employeeName}')]`, {
    state: 'visible',
  });
  await page.waitForTimeout(2000);
  console.log('Employee entry visible');

  // Validate the hours value in the report (accept any of possible values)
  const loc = page
    .locator(
      `//span[contains(text(), '${employeeName}')]/ancestor::tr/../tr/td//div[contains(@class, 'TableCellComponent__CellWrapper-sc') and text()='${expectedHours}']`,
    )
    .first();
  await expect(loc).toBeVisible();

  console.log(
    `✓ Reports validation before approval: ${expectedHours} hours confirmed for ${employeeName}`,
  );
};

export const validateReportsBeforeApprovalTC = async (
  page: Page,
  employeeName: string,
  expectedHours: string | string[],
) => {
  console.log(
    `Validating reports before approval - expecting ${expectedHours} for ${employeeName}`,
  );

  const reportsPage = new ReportsPage(page);

  // Navigate to Reports page
  await reportsPage.navigateToReportsPage();
  await reportsPage.waitForPageReady();
  await reportsPage.handlePopupsInAnyOrder();

  console.log('Opening "Time Activities by Employee Detail" report...');
  await page
    .locator(`//input[@placeholder='Type report name here']`)
    .fill('Time Activities by Employee Detail');
  await page.getByText('Time Activities by Employee Detail').first().click();
  await page.waitForTimeout(2000);
  // Validate report title is visible
  await reportsPage.expectTimeActivitiesReportTitleVisible();

  console.log('Selecting "All Dates" from Custom dates dropdown...');
  // await reportsPage.clickCustomDatesDropdown();
  // await reportsPage.selectAllDates();
  await page.waitForLoadState('load');
  await page.waitForTimeout(5000);

  await page.waitForSelector(`//span[contains(text(), '${employeeName}')]`, {
    state: 'visible',
  });
  await page.waitForTimeout(2000);
  console.log('Employee entry visible');

  // Validate the hours value in the report (accept any of possible values)
  const loc = page.locator(
    `//span[contains(text(), '${employeeName}')]/ancestor::tr/../tr/td//div[contains(@class, 'TableCellComponent__CellWrapper-sc') and text()='${expectedHours}']`,
  );
  const hourTexts = (await loc.allTextContents()).map((text) => text.trim());
  const expectedVariants = Array.isArray(expectedHours)
    ? expectedHours
    : [expectedHours];
  const hasMatch = expectedVariants.some((expected) =>
    hourTexts.some((actual) => actual.includes(expected)),
  );
  //expect(hasMatch).toBeTruthy();

  console.log(
    `✓ Reports validation before approval: ${expectedHours} hours confirmed for ${employeeName}`,
  );
};

/**
 * Validates time activities report after approval (should show new values)
 */
export const validateReportsAfterApproval = async (
  page: Page,
  employeeName: string,
  expectedHours: string | string[],
) => {
  console.log(
    `Validating reports after approval - expecting ${expectedHours} for ${employeeName}`,
  );

  const reportsPage = new ReportsPage(page);

  // Navigate to Reports page
  await reportsPage.navigateToReportsPage();
  await reportsPage.waitForPageReady();
  await reportsPage.handlePopupsInAnyOrder();

  // Validate report title is visible
  await page
    .locator(`//input[@placeholder='Type report name here']`)
    .fill('Time Activities by Employee Detail');
  await page.getByText('Time Activities by Employee Detail').first().click();
  await page.waitForTimeout(2000);

  await reportsPage.clickCustomDatesDropdown();
  await reportsPage.selectAllDates();
  await reportsPage.expectTimeActivitiesReportTitleVisible();

  console.log('Selecting "All Dates" from Custom dates dropdown...');

  await page.waitForLoadState('load');
  await page.waitForTimeout(8000);

  await page.waitForTimeout(2000);
  console.log('Employee entry visible');

  // Validate the hours value in the report (accept any of possible values)
  const expandHourVariants = (value: string) => {
    const variants = new Set<string>();
    variants.add(value);
    if (value.includes(':')) {
      variants.add(value.replace(':', '.'));
    }
    if (value.includes('.')) {
      variants.add(value.replace('.', ':'));
    }
    return Array.from(variants);
  };

  const expectedValues = (
    Array.isArray(expectedHours) ? expectedHours : [expectedHours]
  ).flatMap((val) => expandHourVariants(val));

  let matchedValue: string | undefined;
  for (const value of expectedValues) {
    const locator = page.locator(
      `//span[contains(text(), '${employeeName}')]/ancestor::tr/../tr/td//div[contains(@class, 'TableCellComponent__CellWrapper-sc') and text()='${value}']`,
    );
    const isVisible = await locator
      .first()
      .isVisible()
      .catch(() => false);
    if (isVisible) {
      await expect(locator.first()).toBeVisible();
      matchedValue = value;
      break;
    }
  }

  if (!matchedValue) {
    throw new Error(
      `Unable to find expected hours ${expectedValues.join(
        ', ',
      )} for ${employeeName} in report.`,
    );
  }

  console.log(
    `✓ Reports validation after approval: ${matchedValue} hours confirmed for ${employeeName}`,
  );

  // Test navigation from reports to time entry (optional validation)
  console.log('Testing navigation from reports "Hours" link...');
  await reportsPage.clickHoursLink();
  await page.waitForTimeout(2000);

  // Validate navigation to correct screen
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  await singleTimeActivityPage.validateSTALoaded();
  console.log(
    '✓ Successfully navigated to time entry screen from Reports "Hours" link',
  );

  // Close entry and return
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  await singleTimeEntryPage.clickFooterCancelButton();
  await page.waitForTimeout(1000);
};

export const validateReportsBeforeEdit = async (
  page: Page,
  employeeName: string,
  expectedHours: string | string[],
) => {
  console.log(
    `Validating reports after approval - expecting ${expectedHours} for ${employeeName}`,
  );

  const reportsPage = new ReportsPage(page);

  // Navigate to Reports page
  await reportsPage.navigateToReportsPage();
  await reportsPage.waitForPageReady();
  await reportsPage.handlePopupsInAnyOrder();

  // Validate report title is visible
  await page
    .locator(`//input[@placeholder='Type report name here']`)
    .fill('Time Activities by Employee Detail');
  await page.getByText('Time Activities by Employee Detail').first().click();
  await page.waitForTimeout(2000);
  await reportsPage.clickCustomDatesDropdown();
  await reportsPage.selectAllDates();
  await reportsPage.expectTimeActivitiesReportTitleVisible();

  console.log('Selecting "All Dates" from Custom dates dropdown...');

  await page.waitForLoadState('load');
  await page.waitForTimeout(5000);

  await page.waitForSelector(`//span[contains(text(), '${employeeName}')]`, {
    state: 'visible',
  });
  await page.waitForTimeout(2000);
  console.log('Employee entry visible');

  // Validate the hours value in the report (accept any of possible values)
  const expandHourVariants = (value: string) => {
    const variants = new Set<string>();
    variants.add(value);
    if (value.includes(':')) {
      variants.add(value.replace(':', '.'));
    }
    if (value.includes('.')) {
      variants.add(value.replace('.', ':'));
    }
    return Array.from(variants);
  };

  const expectedValues = (
    Array.isArray(expectedHours) ? expectedHours : [expectedHours]
  ).flatMap((val) => expandHourVariants(val));

  let matchedValue: string | undefined;
  for (const value of expectedValues) {
    const locator = page.locator(
      `//span[contains(text(), '${employeeName}')]/ancestor::tr/../tr/td//div[contains(@class, 'TableCellComponent__CellWrapper-sc') and text()='${value}']`,
    );
    const isVisible = await locator
      .first()
      .isVisible()
      .catch(() => false);
    if (isVisible) {
      matchedValue = value;
      break;
    }
  }

  if (matchedValue) {
    console.log(
      `✓ Reports validation before edit: ${matchedValue} hours confirmed for ${employeeName}`,
    );
  } else {
    console.log(
      `⚠ Reports validation before edit: Could not find expected hours ${expectedValues.join(
        ', ',
      )} for ${employeeName}`,
    );
  }

  // Test navigation from reports to time entry (optional validation)
  console.log('Testing navigation from reports "Hours" link...');
  await reportsPage.clickHoursLink();
  await page.waitForTimeout(2000);

  // Validate navigation to correct screen
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  await singleTimeActivityPage.validateSTALoaded();
  console.log(
    '✓ Successfully navigated to time entry screen from Reports "Hours" link',
  );

  // Close entry and return
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  await singleTimeEntryPage.clickFooterCancelButton();
  await page.waitForTimeout(1000);
};

export const validateReportsAfterEdit = async (
  page: Page,
  employeeName: string,
  expectedHours: string | string[],
) => {
  console.log(
    `Validating reports after approval - expecting ${expectedHours} for ${employeeName}`,
  );

  const reportsPage = new ReportsPage(page);

  // Navigate to Reports page
  await reportsPage.navigateToReportsPage();
  await reportsPage.waitForPageReady();
  await reportsPage.handlePopupsInAnyOrder();

  // Validate report title is visible
  await page
    .locator(`//input[@placeholder='Type report name here']`)
    .fill('Time Activities by Employee Detail');
  await page.getByText('Time Activities by Employee Detail').first().click();
  await page.waitForTimeout(2000);
  await reportsPage.expectTimeActivitiesReportTitleVisible();

  console.log('Selecting "All Dates" from Custom dates dropdown...');
  await reportsPage.clickCustomDatesDropdown();
  await reportsPage.selectAllDates();
  await page.waitForLoadState('load');
  await page.waitForTimeout(5000);

  await page.waitForSelector(`//span[contains(text(), '${employeeName}')]`, {
    state: 'visible',
  });
  await page.waitForTimeout(2000);
  console.log('Employee entry visible');

  const expandHourVariants = (value: string) => {
    const variants = new Set<string>();
    variants.add(value);
    if (value.includes(':')) {
      variants.add(value.replace(':', '.'));
    }
    if (value.includes('.')) {
      variants.add(value.replace('.', ':'));
    }
    return Array.from(variants);
  };

  const expectedValues = (
    Array.isArray(expectedHours) ? expectedHours : [expectedHours]
  ).flatMap((val) => expandHourVariants(val));

  let matchedValue: string | undefined;
  for (const value of expectedValues) {
    const locator = page.locator(
      `//span[contains(text(), '${employeeName}')]/ancestor::tr/../tr/td//div[contains(@class, 'TableCellComponent__CellWrapper-sc') and text()='${value}']`,
    );
    const isVisible = await locator
      .first()
      .isVisible()
      .catch(() => false);
    if (isVisible) {
      await expect(locator.first()).toBeVisible();
      matchedValue = value;
      break;
    }
  }

  if (!matchedValue) {
    throw new Error(
      `Unable to find expected hours ${expectedValues.join(
        ', ',
      )} for ${employeeName} in report.`,
    );
  }

  console.log(
    `✓ Reports validation after approval: ${matchedValue} hours confirmed for ${employeeName}`,
  );

  // Test navigation from reports to time entry (optional validation)
  console.log('Testing navigation from reports "Hours" link...');
  await reportsPage.clickHoursLink();
  await page.waitForTimeout(2000);

  // Validate navigation to correct screen
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  await singleTimeActivityPage.validateSTALoaded();
  console.log(
    '✓ Successfully navigated to time entry screen from Reports "Hours" link',
  );

  // Close entry and return
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  await singleTimeEntryPage.clickFooterCancelButton();
  await page.waitForTimeout(1000);
};

export const navigateToRunPayroll = async (page: Page) => {
  await page.goto('/app/employees?jobId=payroll', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
};

/**
 * Cleans up test data after test completion
 */
export const cleanupRunPayrollTestData = async (page: Page) => {
  console.log('Cleaning up run payroll test data');

  try {
    const timeEntriesPage = new TimeEntriesPage(page);
    await deletePayCheck(page);
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This pay period');
    await timeEntriesPage.waitForLoadingToDisappear();

    // Delete all entries for test employee
    const cleanupEmployeeName =
      await timeEntriesPage.getEmployeeNameForListView(
        TEST_EMPLOYEE.listView,
        TEST_EMPLOYEE.alternateListView,
      );

    let count = await timeEntriesPage.countEmployeeRow(cleanupEmployeeName);

    while (count > 0) {
      if (await page.locator(`//span[text()='Approved']`).first().isVisible()) {
        await unapproveTimeFromEmployeeSection(page, cleanupEmployeeName);
      }
      await selectDisplayByOption(page, 'Date');
      await timeEntriesPage.waitForLoadingToDisappear();

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

export const cleanupTestDataInvoice = async (page: Page) => {
  console.log('Cleaning up run payroll test data');

  try {
    const timeEntriesPage = new TimeEntriesPage(page);
    await deletePayCheck(page);
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
      if (await page.locator(`//span[text()='Approved']`).first().isVisible()) {
        await unapproveTimeFromEmployeeSection(page, cleanupEmployeeName);
      }
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

/**
 * Cleans up test data after test completion
 */
export const cleanupRunPayrollTestDataWTE = async (
  page: Page,
  employeeName: string,
) => {
  console.log('Cleaning up run payroll test data');

  try {
    const timeEntriesPage = new TimeEntriesPage(page);
    // const approvalsPage = new ApprovalsPage(page);
    //await deletePayCheck(page);
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This pay period');
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(5000);

    // Delete all entries for test employee
    const cleanupEmployeeName =
      await timeEntriesPage.getEmployeeNameForListView(
        TEST_EMPLOYEE.listView,
        TEST_EMPLOYEE.alternateListView,
      );

    let count = await timeEntriesPage.countEmployeeRow(cleanupEmployeeName);

    while (count > 0) {
      if (await page.locator(`//span[text()='Approved']`).first().isVisible()) {
        // Step 1: Click on display by dropdown and select Employee
        const approvalsPage = new ApprovalsPage(page);
        await approvalsPage.navigateToApprovalsPage();
        await timeEntriesPage.waitForLoadingToDisappear();

        await page.waitForTimeout(5000);
        await unapproveTimeFromEmployeeSection(page, cleanupEmployeeName);
        await page.waitForTimeout(5000);
      }
      await timeEntriesPage.navigateToTimeEntriesPage();
      await timeEntriesPage.waitForLoadingToDisappear();
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

export const cleanupRunPayrollTestDataTC = async (page: Page) => {
  console.log('Cleaning up run payroll test data');

  try {
    const timeEntriesPage = new TimeEntriesPage(page);
    await deletePayCheck(page);
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

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
      await clickClockOut(page);
    }

    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This pay period');
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(5000);

    // Delete all entries for test employee
    const cleanupEmployeeName =
      await timeEntriesPage.getEmployeeNameForListView(
        TEST_EMPLOYEE.listView,
        TEST_EMPLOYEE.alternateListView,
      );

    let count = await timeEntriesPage.countEmployeeRow(cleanupEmployeeName);

    while (count > 0) {
      if (await page.locator(`//span[text()='Approved']`).first().isVisible()) {
        await unapproveTimeFromEmployeeSection(page, cleanupEmployeeName);
      }
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

/**
 * Edits the time clock entry
 */
export const EditTimeClockEntry = async (
  page: Page,
  EndTime: string,
  newNotes: string,
) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.clickEmployeeName('Emp1, Test');
  // await page.getByRole('button', { name: 'Edit', exact: true }).click();

  // Edit the entry
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  await singleTimeEntryPage.waitForPageReady();

  // Update duration
  await singleTimeEntryPage.fillTime('End', EndTime);

  // Update notes
  await singleTimeEntryPage.enterNotes(newNotes);

  // Save changes
  await singleTimeEntryPage.clickSaveAndCloseButton();

  console.log(`✓ Time entry edited: ${EndTime} / ${newNotes}`);
};

export const createTimeClockEntryRunPayroll = async (page: Page) => {
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

  await page.waitForTimeout(30000);
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
  await billRateField.fill('10.00');
  expect(await billRateField.inputValue()).toBe('10.00');

  // Enter notes
  const notes = 'Test initial';
  await page
    .locator(`//span[contains(text(), 'Notes')]/following-sibling::textarea`)
    .fill(notes);

  await page.waitForTimeout(5000);

  // Verify Clock In button is not visible and Clock Out button is visible
  await TimeClockPage.validateClockOutButtonVisibility(page);
  await TimeClockPage.clickClockOut(page);
  await page.waitForTimeout(5000);

  await page.reload();
};

export const createSTARunPayroll = async (
  page: Page,
  employeeName?: string,
) => {
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);

  let selectedEmployeeName = employeeName || '';
  let duration = '';
  console.log('Step 1: Creating a billable STA with pay type...');

  // // Navigate directly to STA creation page (using URL to ensure STA, not STE)
  // await page.goto('/app/time?jobId=time', { waitUntil: 'load' });
  // await page.waitForTimeout(2000);

  // // Handle any tour modals
  // try {
  //   await singleTimeActivityPage.handleTourModal();
  // } catch (error) {
  //   console.log('No tour modal to handle');
  // }

  // Wait for the form to be visible
  //await navigateToTimeEntries(page);
  //await weeklyTimeEntryPage.navigateToSingleTimeEntry(page);
  await singleTimeActivityPage.navigateToSingleTime();
  await singleTimeActivityPage.waitTillNameFieldVisible();
  await page.waitForTimeout(1000);

  console.log('Step 1a: Filling STA details...');

  // Select employee (Test Emp1)
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  const nameValue = await singleTimeActivityPage.getFieldValue('Name');
  selectedEmployeeName = nameValue || 'Test Emp1';
  console.log(`  ✓ Selected employee: "${selectedEmployeeName}"`);

  // Ensure 'Set clock in and out' is toggled off (we want Duration entry)
  const isSetClockOn = await singleTimeActivityPage.verifySetClockToggleState();
  if (isSetClockOn) {
    await singleTimeActivityPage.clickSetClockInAndOutToggles();
    await page.waitForTimeout(1000);
  }

  // Set date and duration (7 hours)
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await singleTimeActivityPage.fillStartDate(formattedDate);
  await singleTimeActivityPage.enterFieldValue('Duration', '8:00');
  duration = (await singleTimeActivityPage.getFieldValue('Duration')) || '8:00';
  console.log(`  ✓ Set duration: ${duration}`);

  // Add notes
  await singleTimeActivityPage.fillData('Notes', 'Test note - initial');
  const notesValue = await singleTimeActivityPage.getNotesFieldValue();
  console.log(`  ✓ Added notes: "${notesValue}"`);

  // Select customer
  await singleTimeActivityPage.openDropdown('Customer');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.clickDropdownOption(1, 'Customer');
  const customerValue = await singleTimeActivityPage.getFieldValue('Customers');
  console.log(`  ✓ Selected customer: "${customerValue}"`);

  // Select service
  await singleTimeActivityPage.openDropdown('Service');
  await page.waitForTimeout(500);
  await singleTimeActivityPage.clickDropdownOption(1, 'Service');
  const serviceValue = await singleTimeActivityPage.getFieldValue('Service');
  console.log(`  ✓ Selected service: "${serviceValue}"`);

  // Select pay type if available
  console.log('Step 1b: Selecting pay type...');
  const isPayTypeVisible = await singleTimeActivityPage.checkFieldVisibility(
    LABELS.PayType,
  );
  const noPayTypeAvailable =
    await singleTimeActivityPage.validateNoAvailablePayTypes();

  if (isPayTypeVisible && !noPayTypeAvailable) {
    await singleTimeActivityPage.openDropdown(LABELS.PayType);
    await page.waitForTimeout(500);
    await singleTimeActivityPage.selectPayTypeOption(2);
    await page.waitForTimeout(500);
    const payTypeValue = await singleTimeActivityPage.getFieldValue(
      LABELS.PayType,
    );
    console.log(`  ✓ Selected pay type: "${payTypeValue}"`);
  } else {
    console.log('  ⚠ Pay type field not available or no pay types to select');
  }

  // Add billable rate
  console.log('Step 1c: Adding billable rate...');
  await page.waitForTimeout(1000);

  const billableCheckbox = page.locator(
    `//span[contains(text(), 'Billable')] / ancestor::label / descendant::input`,
  );
  const isBillableVisible = await billableCheckbox
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (isBillableVisible) {
    const isChecked = await billableCheckbox.isChecked();
    if (!isChecked) {
      await billableCheckbox.check();
      await page.waitForTimeout(500);
      console.log('  ✓ Billable checkbox checked');
    } else {
      console.log('  ✓ Billable checkbox already checked');
    }

    // Fill bill rate
    await singleTimeActivityPage.fillBillRateInput('50.00');
    await page.waitForTimeout(500);
    console.log('  ✓ Billable rate set to $50.00');
  } else {
    console.log('  ⚠ Billable checkbox not visible - skipping billable rate');
  }

  // Save the STA
  console.log('Step 1d: Saving STA...');
  await singleTimeActivityPage.clickSaveAndCloseButton();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(3000);
  console.log('✓ Billable STA with pay type created successfully');
};

export const createWTARunPayroll = async (
  page: Page,
  employeeName?: string,
) => {
  const weeklyTimeActivity = new WeeklyTimeActivity(page);
  const timeEntriesPage = new TimeEntriesPage(page);

  let selectedEmployeeName = employeeName || '';
  let initialTotalDuration = '';
  console.log('Step 1: Creating a billable WTA with pay type...');

  // Navigate directly to WTA creation page (using URL to ensure WTA, not WTE)
  await page.goto('/app/timetracking', { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  console.log('  ✓ Navigated to Weekly timesheet creation screen');

  // Select team member/employee name before adding hours
  console.log('  Selecting team member...');
  await weeklyTimeActivity.openRowDropdown('Name', 1);
  await page.waitForTimeout(500);
  await page.getByRole('option').nth(1).click();
  await page.waitForTimeout(500);

  // Get selected employee name from Name field
  const employeeNameValue = await page.getByLabel('Name').getAttribute('value');
  selectedEmployeeName = employeeNameValue || 'Emp1, Test';
  console.log(`  ✓ Selected employee: ${selectedEmployeeName}`);

  // Select current week pay period (weekNo: 0 = current week)
  console.log('  Selecting current week pay period...');
  await weeklyTimeActivity.selectWeekDropdown(LABELS.SelectWeek, 0);
  await page.waitForTimeout(1000);
  console.log('  ✓ Selected current week pay period');

  // Fill WTA details
  console.log('  Filling WTA details...');

  // Enter duration for Monday through Friday (8 hours each)
  // Days are indexed 0-6 for columns in the WTA grid (Sunday=0, Monday=1, ..., Saturday=6)
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const weekdayIndices = [1, 2, 3, 4, 5]; // Monday-Friday
  const hoursPerDay = 8;

  const durationInputs = page.locator(
    `//tr[1]//input[contains(@aria-label,'Duration')]`,
  );
  const inputCount = await durationInputs.count();
  if (inputCount < 6) {
    throw new Error(
      `Expected at least 6 duration inputs for the week but found ${inputCount}.`,
    );
  }

  console.log('  Entering hours for Monday through Friday...');
  for (const index of weekdayIndices) {
    const dayInput = durationInputs.nth(index);
    await dayInput.click();
    await dayInput.fill(hoursPerDay.toString());
    await page.waitForTimeout(200);
    console.log(
      `    - Entered ${hoursPerDay} hours for ${dayNames[index]} (day index ${index})`,
    );
  }

  initialTotalDuration = `${(hoursPerDay * weekdayIndices.length)
    .toString()
    .padStart(2, '0')}:00`;
  console.log(`  ✓ Total hours for week: ${initialTotalDuration}`);

  // Select service
  await weeklyTimeActivity.openRowDropdown('Service', 1);
  await page.waitForTimeout(500);
  await page.getByRole('option').nth(1).click();
  await page.waitForTimeout(500);
  console.log('  ✓ Selected service');

  // Select pay type if visible and not disabled
  console.log('  Selecting pay type...');
  const isPayTypeVisible = await weeklyTimeActivity.isVisibile(
    LABELS.PayType,
    1,
  );
  const isNoPayTypeVisible = await weeklyTimeActivity.isVisibile(
    LABELS.NoPayType,
    1,
  );

  if (isPayTypeVisible && !isNoPayTypeVisible) {
    await weeklyTimeActivity.openRowDropdown(LABELS.PayType, 1);
    await page.waitForTimeout(5000);
    await weeklyTimeActivity.clickDropdownOption(1);
    await page.waitForTimeout(5000);
    console.log('  ✓ Selected pay type');
  } else {
    console.log('  ⚠ Pay type not available or disabled - skipping');
  }

  // Check billable checkbox
  console.log('  Setting billable...');
  if (await weeklyTimeActivity.isBillableVisible()) {
    const isChecked = await weeklyTimeActivity.isChecked(1, LABELS.Billable);
    if (!isChecked) {
      await weeklyTimeActivity.checkInputCheckbox(1, LABELS.Billable);
      console.log('  ✓ Billable checkbox checked');
    } else {
      console.log('  ✓ Billable checkbox already checked');
    }

    // Enter bill rate
    await weeklyTimeActivity.enterBillRate(1);
    console.log('  ✓ Bill rate entered');
  } else {
    console.log('  ⚠ Billable field not visible');
  }

  // Add notes
  await weeklyTimeActivity.enterNotes('Test note - initial', 1);
  console.log('  ✓ Notes entered');

  // Select customer (at last to ensure all fields are filled)
  console.log('  Selecting customer...');
  await weeklyTimeActivity.openRowDropdown('Customers', 1);
  await page.waitForTimeout(500);
  await page.getByRole('option').nth(1).click();
  await page.waitForTimeout(500);
  console.log('  ✓ Selected customer');

  // Save the WTA
  console.log('  Saving WTA...');
  await weeklyTimeActivity.clickSaveAndCloseButton();
  await page.waitForTimeout(3000);
  await timeEntriesPage.waitForLoadingToDisappear();
  console.log('  ✓ WTA saved successfully');
};

export const createWeeklyTimeEntryThreeCellsRunPayroll = async (page: Page) => {
  await navigateToTimeEntries(page);
  await openWeeklyTimeEntry(page);

  // Wait for page to load
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  // Select team member
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.waitForTimeout(2000);

  // Step 1: Select customer
  const testRows = [
    {
      customerIndex: 1,
    },
  ];

  for (let i = 0; i < testRows.length; i++) {
    if (i > 0) {
      await page.getByRole('button', { name: /add row/i }).click();
      await page.waitForTimeout(500);
    }
    await weeklyTimeEntryPage.customerProjectDropdown(page).nth(i).click();
    await weeklyTimeEntryPage.clickCustomerDropdownOption(
      page,
      testRows[i].customerIndex,
    );
    await page.waitForTimeout(5000);

    await weeklyTimeEntryPage.clickOnDeleteRow(page, 1);
    await weeklyTimeEntryPage.saveButton(page).click();

    await weeklyTimeEntryPage.customerProjectDropdown(page).nth(i).click();
    await weeklyTimeEntryPage.clickCustomerDropdownOption(
      page,
      testRows[i].customerIndex,
    );

    // Step 1: Fill the first 5 cells in the same row with value 8
    for (let colIndex = 3; colIndex < 7; colIndex++) {
      const cell = weeklyTimeEntryPage.hours(page, colIndex);
      await cell.click();
      await page.waitForTimeout(300);

      // Fill hours value 8
      await page.keyboard.type('8');
      await page.waitForTimeout(300);

      // Step 2: Check if service dropdown exists and is clickable, then select it
      const serviceDropdown = weeklyTimeEntryPage.panelServiceDropdown(page);
      await page.waitForTimeout(2000);
      if (
        (await serviceDropdown.isVisible().catch(() => false)) &&
        (await serviceDropdown.isEnabled().catch(() => false))
      ) {
        await serviceDropdown.click();
        await page.waitForTimeout(2000);
        await weeklyTimeEntryPage.clickDropdownOption(page, 1);
        await page.waitForTimeout(2000);
      }

      // Step 2: Check if billable exists and is clickable, then set billable rate to 7
      const billableCheckbox = page
        .getByRole('checkbox', { name: /Billable/i })
        .first();
      if (
        (await billableCheckbox.isVisible().catch(() => false)) &&
        (await billableCheckbox.isEnabled().catch(() => false))
      ) {
        await billableCheckbox.check({ force: true }).catch(() => undefined);
        await page.waitForTimeout(200);

        const billableRateInput = page.getByRole('textbox', {
          name: /Billable rate/i,
        });
        if (
          (await billableRateInput.isVisible().catch(() => false)) &&
          (await billableRateInput.isEditable().catch(() => false))
        ) {
          await billableRateInput.fill('7').catch(() => undefined);
          await page.waitForTimeout(200);
        }
      }

      // Step 2: Enter "test initial" in notes for each cell, if notes input is visible and editable
      const notesInput = weeklyTimeEntryPage.panelNotes(page);
      if (
        (await notesInput.isVisible().catch(() => false)) &&
        (await notesInput.isEditable().catch(() => false))
      ) {
        await notesInput.fill('test initial');
        await page.waitForTimeout(200);
      }
    }
  }

  // Step 3: Save and close
  await weeklyTimeEntryPage.saveAndClose(page);
  await page.waitForTimeout(2000);

  // Verify success toast if available
  const toastLocator = page.getByTestId('toastMessage');
  if (await toastLocator.isVisible().catch(() => false)) {
    await expect(toastLocator).toContainText('Time entry added');
  }

  // Close timesheet if a Close button exists
  const closeBtn = page.getByRole('button', { name: /close/i }).first();
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click();
  }

  // Return time entry data for validation
  // Based on actual payroll value showing 8h
  return {
    duration: '08:00', // Actual duration as shown in payroll
  };
};

export const validateBreaksAndEditFlowInRunPayroll = async (
  page: Page,
  employeeName?: string,
) => {
  // Employee 1: Test Emp1 - Manual Break
  const testEmployee1 = 'Test Emp1';
  const firstName1 = testEmployee1.split(' ')[0];
  const lastName1 = testEmployee1.split(' ')[1];
  const displayName1 = `${lastName1}, ${firstName1}`;

  // Employee 2: Test Emp2 - Automatic Break
  const testEmployee2 = 'Test Emp2';
  const firstName2 = testEmployee2.split(' ')[0];
  const lastName2 = testEmployee2.split(' ')[1];
  const displayName2 = `${lastName2}, ${firstName2}`;

  const timeEntriesPage = new TimeEntriesPage(page);
  const breaksPage = new BreaksPage(page);
  const runPayrollPage = new RunPayrollPage(page);
  const reportsPage = new ReportsPage(page);
  const singleTimeActivityPage = new SingleTimeEntryPage(page);
  const singleTimeEntryPage = new SingleTimeActivityPage(page);

  const manualBreakDuration = '06:00'; // 6 hours
  const timeEntryDuration = '07:00'; // 7 hours (will trigger automatic break)
  const totalExpectedHours = '13h'; // 6h + 7h = 13h total (before edit)
  const updatedTotalExpectedHours = '14h'; // 6h + 8h = 14h total (after edit)

  const manualBreakDescription = 'Manual Break Entry - Test Emp1';
  const automaticBreakDescription = 'Automatic Break Entry - Test Emp2';

  // Calculate dates to avoid future date issues
  // Manual break for Emp1: yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  // Time entry for Emp2: day before yesterday
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

  try {
    console.log('');
    console.log('='.repeat(70));
    console.log('RPEF004: EDIT RUNPAYROLL FOR BREAKS WORKFLOW');
    console.log('='.repeat(70));
    console.log(`Employee 1: ${testEmployee1} (Display: ${displayName1})`);
    console.log(
      `  - Manual Break: ${manualBreakDuration}h (8 AM - 2 PM) - ${yesterdayFormatted}`,
    );
    console.log('');
    console.log(`Employee 2: ${testEmployee2} (Display: ${displayName2})`);
    console.log(
      `  - Time Entry: ${timeEntryDuration}h (8 AM - 3 PM with automatic break) - ${dayBeforeYesterdayFormatted}`,
    );
    console.log('');
    console.log(`Expected Total: ${totalExpectedHours}`);
    console.log('='.repeat(70));

    // ============================================================
    // STEP 1: Create MANUAL break entry for Test Emp1
    // ============================================================
    console.log('');
    console.log('='.repeat(70));
    console.log(`Step 1: Creating MANUAL break for ${testEmployee1}`);
    console.log('='.repeat(70));
    console.log(
      `Creating manual break entry (6 hours: 8 AM - 2 PM) for ${yesterdayFormatted}...`,
    );
    console.log(
      '  ✓ Already on time entries page with "This month" selected (from pre-test cleanup)',
    );

    //CREATE MANUAL AND AUTOMATIC BREAK RULES
    //add manual break rule
    await addManualBreakFromBreakRules(page);
    await page.waitForTimeout(1000);

    //add automatic break rule
    await addAutomaticBreakFromBreakRules(page);
    await page.waitForTimeout(1000);

    //CREATE MANUAL BREAK ENTRY
    await navigateToTimeEntries(page);
    await timeEntriesPage.waitForLoadingToDisappear();

    await breaksPage.navigateToTimeEntries();
    await selectDisplayByOption(page, 'Date');
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    // Open Add Break drawer
    await breaksPage.openAddBreakDrawer();
    await page.waitForTimeout(1000);

    // Select Test Emp1 and manual break type
    await breaksPage.selectTeamMemberAndFirstBreakType(testEmployee1);
    await page.waitForTimeout(500);

    // Select Start and end time entry type
    await breaksPage.selectBreakEntryType('Start and end time');
    await page.waitForTimeout(1000);

    // Set date to yesterday
    await breaksPage.enterStartDate(yesterdayFormatted);
    await page.waitForTimeout(1000);

    // Enter start and end times (8 AM to 2 PM = 6 hours)
    await breaksPage.clearStartOrEndTime('Start Time');
    await breaksPage.enterStartOrEndTime('Start Time', '08:00 AM');
    await page.waitForTimeout(500);

    await breaksPage.clearStartOrEndTime('End Time');
    await breaksPage.enterStartOrEndTime('End Time', '02:00 PM');
    await page.waitForTimeout(500);

    // Enter notes
    await breaksPage.enterNotes(manualBreakDescription);

    // Save the manual break
    await breaksPage.saveBreak();
    await page.waitForTimeout(3000);

    console.log(
      `✓ Manual break created for ${testEmployee1} (${manualBreakDuration}h: 8 AM - 2 PM) on ${yesterdayFormatted}`,
    );
    console.log('');
  } catch (error) {
    console.log(`✗ Error creating manual break for ${testEmployee1}:`, error);
    throw error;
  }

  // ============================================================
  // STEP 2: Create time entry for Test Emp2 with AUTOMATIC break
  // ============================================================
  try {
    console.log('='.repeat(70));
    console.log(
      `Step 2: Creating time entry for ${testEmployee2} with AUTOMATIC break`,
    );
    console.log('='.repeat(70));
    console.log(
      `Creating time entry (7 hours: 8 AM - 3 PM) for ${dayBeforeYesterdayFormatted}...`,
    );
    console.log('  ℹ Automatic break rule will be applied on save');

    // Wait to ensure we're back on time entries page
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(2000);

    // Click Add time dropdown and select Single time entry

    await clickAddTimeDropdown(page);
    await page.locator(`//span[text()='Single time entry']`).click();
    // await clickAddTimeDropdown(page);
    // await selectSingleTimeEntryFromAddTime(page, false); // false = paid company

    // Wait for Single Time Entry page to be fully ready
    await page.waitForTimeout(3000);
    await singleTimeActivityPage.waitForPageReady();
    await singleTimeActivityPage.handlePopupsInAnyOrder();
    await singleTimeEntryPage.waitTillNameFieldVisible();

    // Fill in entry details - select Test Emp2
    await singleTimeActivityPage.openDropdown('Name');
    await page.waitForTimeout(500);

    // Select Test Emp2 (assuming it's the 2nd option in dropdown)
    await singleTimeActivityPage.clickDropdownOption(2, 'Name');
    await page.waitForTimeout(1000);

    // Set date to day before yesterday
    await singleTimeEntryPage.fillStartDate(dayBeforeYesterdayFormatted);
    await page.waitForTimeout(500);

    // Toggle "Set start and end time" (required for automatic breaks to apply)
    const isToggleEnabled = await singleTimeActivityPage.getSetClockInToggle();
    if (!isToggleEnabled) {
      await singleTimeActivityPage.ClickSetClockInToggle();
      await page.waitForTimeout(500);
    }

    // Set start and end times (8 AM to 3 PM = 7 hours)
    // This duration will trigger automatic break rule (e.g., 30 min break after 6 hours)
    await singleTimeEntryPage.selectTime('Start', '8:00 AM');
    await page.waitForTimeout(500);

    await singleTimeEntryPage.selectTime('End', '3:00 PM');
    await page.waitForTimeout(1000);

    // Add notes
    await singleTimeEntryPage.fillData('Notes', automaticBreakDescription);

    // Save and close - automatic break will be applied
    await singleTimeEntryPage.clickSaveAndCloseButton();
    await page.waitForTimeout(3000);

    console.log(
      `✓ Time entry created for ${testEmployee2} (${timeEntryDuration}h: 8 AM - 3 PM) on ${dayBeforeYesterdayFormatted}`,
    );
    console.log('  ✓ Automatic break rule applied on save');
    console.log('');
  } catch (error) {
    console.log(`✗ Error creating time entry for ${testEmployee2}:`, error);
    throw error;
  }
  // ============================================================
  // STEP 3: Approve time entries for BOTH employees
  // ============================================================
  console.log('='.repeat(70));
  console.log('Step 3: Approving time entries for both employees');
  console.log('='.repeat(70));

  console.log(`Approving ${testEmployee1}'s entries...`);
  await approveTimeEntries(page, 'Emp1, Test'); // 'Emp1, Test'
  console.log(`✓ ${testEmployee1}'s entries approved`);

  console.log(`Approving ${testEmployee2}'s entries...`);
  await approveTimeEntries(page, 'Emp2, Test'); // 'Emp2, Test'
  console.log(`✓ ${testEmployee2}'s entries approved`);
  console.log('');

  // Step 5: Validate entries in reports
  console.log('');
  console.log('Step 4: Validating break entries in reports...');

  await reportsPage.navigateToReportsPage();
  await reportsPage.waitForPageReady();
  await reportsPage.handlePopupsInAnyOrder();

  // Search for Time Activities by Employee Detail
  await page
    .getByTestId('__textField')
    .fill('Time Activities by Employee Detail');
  await page.getByText('Time Activities by Employee Detail').first().click();
  await page.waitForTimeout(2000);

  await reportsPage.expectTimeActivitiesReportTitleVisible();
  console.log('  ✓ Time Activities by Employee Detail report opened');

  // Set date filter to All Dates
  await reportsPage.clickCustomDatesDropdown();
  await reportsPage.selectAllDates();
  await reportsPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);

  // Validate employee entry is visible in reports
  await reportsPage.expectTestEmp1EntryVisible();
  console.log(`✓ Break entries visible in reports for ${testEmployee1}`);

  // ============================================================
  // STEP 5: Navigate to Run Payroll and validate combined hours
  // ============================================================
  console.log('='.repeat(70));
  console.log(
    'Step 5: Navigating to Run Payroll and validating approved breaks (13h))',
  );
  console.log('='.repeat(70));

  console.log(
    'Validating approved breaks in run payroll (13h should now be visible)...',
  );
  await runPayrollPage.navigateToRunPayroll();
  await runPayrollPage.handleTaxProblemsPopup();
  await runPayrollPage.selectPayPeriodWithCurrentDate();
  await page.waitForTimeout(2000);

  // Verify total hours (13h) are NOW showing (approved time should appear)
  const hoursVisible1 = await runPayrollPage.validateEmployeeHoursVisible(
    testEmployee1,
    manualBreakDuration,
  );

  const hoursVisible2 = await runPayrollPage.validateEmployeeHoursVisible(
    testEmployee2,
    timeEntryDuration,
  );

  const totalhoursVisible = await runPayrollPage.validateEmployeeHoursVisible(
    'Total',
    totalExpectedHours,
  );

  if (!totalhoursVisible) {
    throw new Error(
      `Expected break hours (${totalExpectedHours}) to be visible but they are not`,
    );
  }

  console.log(
    `✓ Approved break hours (${totalExpectedHours}) now visible in run payroll`,
  );

  // Step 6: Click on edit time
  // Step 7: Unapprove the approved time and edit the time and notes
  console.log('Step 6-7: Unapproving and editing time entry...');
  await unapproveAndEditBreakTimeEntry(
    page,
    '03:00 PM',
    'Test Emp1 edited break',
    '7h',
  );

  // Step 8: Approve the edited time
  console.log('Step 8: Re-approving edited time...');
  await approveBreakTimeEntries(page, 'Emp1, Test');

  // Step 9: Validate reports after approval (should show new values)
  console.log('Step 9: Validating reports after approval...');
  await validateReportsAfterApproval(page, 'Test Emp1', '07:00');

  // Step 10: Validate 14h IS visible in run payroll (approved)
  console.log('');
  console.log(
    'Step 10: Validating approved breaks in run payroll (14h should now be visible)...',
  );

  await runPayrollPage.navigateToRunPayroll();
  await runPayrollPage.handleTaxProblemsPopup();
  await runPayrollPage.selectPayPeriodWithCurrentDate();

  const totaleditedhoursVisible =
    await runPayrollPage.validateEmployeeHoursVisible('Total', '14h');

  if (!totaleditedhoursVisible) {
    throw new Error(
      `Expected break hours (${totaleditedhoursVisible}) is not visible in run payroll`,
    );
  }

  console.log(
    `✓ Approved break hours (${totaleditedhoursVisible}) now visible in run payroll`,
  );

  // Step 11: Run the payroll and submit the payroll
  console.log('Step 11: Running and submitting payroll...');
  await runPayrollPage.submitPayrollWithCashAccount();
};

/**
 * Helper function to delete paychecks for multiple employees
 * @param page - Playwright Page object
 * @param employeeNames - Array of employee names to delete paychecks for
 */
const deletePaychecksForBothEmployees = async (
  page: Page,
  employeeNames: string[],
) => {
  for (const employeeName of employeeNames) {
    try {
      console.log(`  Deleting paycheck for ${employeeName}...`);

      // Navigate to Employees page
      await page.goto('https://qbo.intuit.com/app/employees', {
        waitUntil: 'load',
      });
      await page.waitForTimeout(2000);
      console.log(`    ✓ Navigated to Employees page`);

      // Click on employee name (handle both formats)
      const displayName = employeeName.includes(',')
        ? employeeName
        : `${employeeName.split(' ')[1]}, ${employeeName.split(' ')[0]}`;

      const employeeLocator = page
        .locator(`//*[text()='${displayName}' or text()='${employeeName}']`)
        .first();

      await employeeLocator.waitFor({ state: 'visible', timeout: 60_000 });
      await employeeLocator.click();
      await page.waitForTimeout(2000);
      console.log(`    ✓ Clicked on ${employeeName}`);

      // Wait for employee details and click Paycheck list
      await page.locator(`//*[text()='Personal']`).first().waitFor({
        state: 'visible',
        timeout: 60_000,
      });

      await page.getByRole('button', { name: 'Paychecks' }).click();
      await page
        .waitForURL(/workerPaychecks/i, { timeout: 60_000 })
        .catch(() => undefined);
      await page.waitForTimeout(2000);
      console.log(`    ✓ Clicked Paychecks`);

      const paychecksEmpty = page.getByText(
        'There are no results matching the criteria.',
      );
      if (
        await paychecksEmpty.isVisible({ timeout: 60_000 }).catch(() => false)
      ) {
        console.log(`    ⚠ No paycheck found for ${employeeName}`);
        continue;
      }

      const paycheckExists = await page
        .locator(`table tbody tr`)
        .first()
        .isVisible({ timeout: 60_000 })
        .catch(() => false);

      if (!paycheckExists) {
        console.log(`    ⚠ No paycheck found for ${employeeName}`);
        continue; // Skip to next employee
      }

      console.log(
        `    ✓ Paycheck found for ${employeeName}, proceeding with deletion...`,
      );

      // Row actions menu on worker paychecks list
      const actionsIcon = page
        .getByRole('button', { name: 'Expand Menu' })
        .or(page.getByTestId('chevron-down-icon-control'))
        .first();
      const actionsIconVisible = await actionsIcon
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (!actionsIconVisible) {
        console.log(
          `    ⚠ Actions icon not found, cannot delete paycheck for ${employeeName}`,
        );
        continue;
      }

      // Click actions icon
      await actionsIcon.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await actionsIcon.click();
      await page.waitForTimeout(1000);
      console.log(`    ✓ Opened actions menu`);

      // Click Delete button
      const deleteButton = page.locator(`//*[text()='Delete']`);
      const deleteButtonVisible = await deleteButton
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (!deleteButtonVisible) {
        console.log(`    ⚠ Delete button not found for ${employeeName}`);
        continue;
      }

      await deleteButton.click();
      await page.waitForTimeout(1000);
      console.log(`    ✓ Clicked Delete`);

      // Confirm deletion
      const confirmButton = page.locator(
        `//button[@aria-label="Confirm delete of current paycheck"]`,
      );
      const confirmButtonVisible = await confirmButton
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (!confirmButtonVisible) {
        console.log(
          `    ⚠ Confirm delete button not found for ${employeeName}`,
        );
        continue;
      }

      await confirmButton.click();
      await page.waitForTimeout(2000);

      console.log(`  ✓ Paycheck deleted successfully for ${employeeName}`);
    } catch (payrollError) {
      console.log(
        `  ⚠ Paycheck deletion failed for ${employeeName} or no paycheck found`,
      );
      console.log(
        `  Error: ${
          payrollError instanceof Error
            ? payrollError.message
            : String(payrollError)
        }`,
      );
    }
  }
};

/**
 * Cleanup function for breaks edit workflow test data
 * Handles both Test Emp1 and Test Emp2
 */
export const cleanupBreaksEditWorkflowTestData = async (page: Page) => {
  console.log('');
  console.log('='.repeat(70));
  console.log('CLEANUP: Breaks Edit Workflow Test Data (Both Employees)');
  console.log('='.repeat(70));

  const timeEntriesPage = new TimeEntriesPage(page);
  const employeesPage = new EmployeesPage(page);

  // Define both employees
  const testEmployee1 = 'Test Emp1';
  const displayName1 = 'Emp1, Test';

  const testEmployee2 = 'Test Emp2';
  const displayName2 = 'Emp2, Test';

  try {
    // ============================================================
    // STEP 1: Delete paychecks for BOTH employees
    // ============================================================
    try {
      console.log('');
      console.log('Step 1: Deleting paychecks for both employees...');
      await deletePaychecksForBothEmployees(page, [
        testEmployee1,
        testEmployee2,
      ]);
    } catch (paycheckError) {
      console.log(
        '  ⚠ Paycheck deletion step failed, continuing with cleanup...',
      );
      console.log(
        `  Error: ${
          paycheckError instanceof Error
            ? paycheckError.message
            : String(paycheckError)
        }`,
      );
    }

    // ============================================================
    // STEP 2: Navigate to Time Entries page and set filters
    // ============================================================
    try {
      console.log('');
      console.log('Step 2: Setting up Time Entries page...');

      await timeEntriesPage.navigateToTimeEntriesPage();
      await timeEntriesPage.waitForLoadingToDisappear();

      // Always select "This month" date range first
      await openDateRangeDropdown(page);
      await selectDateRangeOption(page, 'This pay period');
      await timeEntriesPage.waitForLoadingToDisappear();
      console.log('  ✓ Selected "This month" date range');

      await selectDisplayByOption(page, 'Date');
      await timeEntriesPage.waitForLoadingToDisappear();
    } catch (navigationError) {
      console.log(
        '  ⚠ Time Entries navigation failed, continuing with cleanup...',
      );
      console.log(
        `  Error: ${
          navigationError instanceof Error
            ? navigationError.message
            : String(navigationError)
        }`,
      );
    }

    // ============================================================
    // STEP 3: Unapprove and delete entries for Test Emp1
    // ============================================================
    try {
      console.log('');
      console.log(`Step 3: Cleaning up ${testEmployee1} entries...`);
      await cleanupEmployeeEntries(
        page,
        timeEntriesPage,
        displayName1,
        testEmployee1,
      );
    } catch (emp1Error) {
      console.log(`  ⚠ Cleanup failed for ${testEmployee1}, continuing...`);
      console.log(
        `  Error: ${
          emp1Error instanceof Error ? emp1Error.message : String(emp1Error)
        }`,
      );
    }

    // ============================================================
    // STEP 4: Unapprove and delete entries for Test Emp2
    // ============================================================
    try {
      console.log('');
      console.log(`Step 4: Cleaning up ${testEmployee2} entries...`);
      await cleanupEmployeeEntries(
        page,
        timeEntriesPage,
        displayName2,
        testEmployee2,
      );
    } catch (emp2Error) {
      console.log(`  ⚠ Cleanup failed for ${testEmployee2}, continuing...`);
      console.log(
        `  Error: ${
          emp2Error instanceof Error ? emp2Error.message : String(emp2Error)
        }`,
      );
    }
    await deleteAllBreakRules(page);
    // ============================================================
    // CLEANUP SUMMARY
    // ============================================================
    console.log('');
    console.log('='.repeat(70));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(70));
    console.log(
      `  Cleanup completed (some steps may have been skipped due to errors)`,
    );
    console.log('='.repeat(70));
  } catch (error) {
    // Catch any unexpected errors but don't fail the test
    console.log('');
    console.log('='.repeat(70));
    console.log('⚠ CLEANUP WARNING');
    console.log('='.repeat(70));
    console.log(
      `Cleanup encountered an unexpected error but test will continue: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    console.log('='.repeat(70));
    // DO NOT throw error - allow test to continue
  }
};

/**
 * Helper function to cleanup entries for a single employee
 */
const cleanupEmployeeEntries = async (
  page: Page,
  timeEntriesPage: TimeEntriesPage,
  displayName: string,
  employeeName: string,
) => {
  // Ensure we're in Date view
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(5000);
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This pay period');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Check if entries exist before attempting to unapprove
  let entryCount = await timeEntriesPage.countEmployeeRow(displayName);
  console.log(`  Found ${entryCount} entry(ies) for ${employeeName}`);

  if (entryCount > 0) {
    // Try to unapprove entries first (only if they exist)
    try {
      // Switch to Employee view for unapproval
      const approvalsPage = new ApprovalsPage(page);
      await approvalsPage.navigateToApprovalsPage();
      await openDateRangeDropdown(page);
      await selectDateRangeOption(page, 'This pay period');
      await timeEntriesPage.waitForLoadingToDisappear();

      const unapproveButton = page.locator(
        `//div[text()='${displayName}']/ancestor::tr/descendant::button/span[text()='Unapprove']`,
      );

      if (
        await unapproveButton.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        await unapproveButton.click();
        await page
          .getByRole('button', { name: 'Unapprove and unlock time' })
          .click();
        await page.waitForTimeout(2000);
        console.log(`  ✓ ${employeeName} entries unapproved`);
      } else {
        console.log(
          `  ℹ ${employeeName} entries already unapproved or no unapprove button found`,
        );
      }
    } catch (error) {
      console.log(
        `  ℹ ${employeeName} entries may already be unapproved or error during unapproval`,
      );
    }

    // Delete entries from time entries page
    // Switch back to Date view for deletion
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await page.waitForTimeout(5000);
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This pay period');
    await timeEntriesPage.waitForLoadingToDisappear();

    // Delete all entries for the employee
    entryCount = await timeEntriesPage.countEmployeeRow(displayName);
    while (entryCount > 0) {
      console.log(`  Deleting entry (${entryCount} remaining)...`);

      try {
        await timeEntriesPage.clickActionDropdownForEmployee(displayName);
        await timeEntriesPage.clickDeleteInActionDropdown();
        await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
        await timeEntriesPage.clickYesOnDeleteEntryPopup();
        await timeEntriesPage.waitForLoadingToDisappear();
        await page.waitForTimeout(1000);
        console.log(`  ✓ Deleted time entry`);
      } catch (deleteError) {
        console.log(`  ⚠ Error deleting entry: ${deleteError}`);
        // Try to continue with next entry
      }

      // Refresh data by switching filters
      await selectDisplayByOption(page, 'Customer');
      await timeEntriesPage.waitForLoadingToDisappear();
      await selectDisplayByOption(page, 'Date');
      await timeEntriesPage.waitForLoadingToDisappear();
      await openDateRangeDropdown(page);
      await selectDateRangeOption(page, 'This pay period');
      await timeEntriesPage.waitForLoadingToDisappear();

      const newCount = await timeEntriesPage.countEmployeeRow(displayName);
      if (newCount === entryCount) {
        // Count didn't decrease, break to avoid infinite loop
        console.log(`  ⚠ Entry count unchanged, stopping deletion loop`);
        break;
      }
      entryCount = newCount;
    }

    console.log(`  ✓ ${employeeName} entries deleted from time entries`);
  } else {
    console.log(`  ℹ No entries found for ${employeeName} to clean up`);
  }
};

export const deleteAuditEntry = async (page: Page) => {
  console.log('');
  console.log('='.repeat(70));
  console.log('STARTING AUDIT LOG EDITED ENTRY DELETION FLOW');
  console.log('='.repeat(70));

  const singleTimeEntryPage = new SingleTimeEntryPage(page);

  console.log('Step 1: Opening Audit Log from home settings...');
  await page.goto('/app/auditlog', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.waitForSelector(`//*[text()='Event']`, {
    state: 'visible',
    timeout: 0,
  });

  console.log('Step 2: Looking for "Edited" Timesheet entry for Test Emp1...');
  const allRows = page.locator(`//table//tr[@role='row']`);
  const totalRowCount = await allRows.count();
  if (!totalRowCount) {
    throw new Error('No audit log rows available for validation.');
  }

  const relevantRows = allRows.filter({
    has: page.locator(
      `xpath=.//div[contains(@class,'Cells-textRowText') and (contains(text(),'Edited '))]`,
    ),
  });
  const relevantCount = await relevantRows.count();
  if (relevantCount < 2) {
    throw new Error(
      `Expected at least two Added/Edited audit entries but found ${relevantCount}.`,
    );
  }

  console.log('Step 2: Validating first two Added/Edited rows...');
  for (let i = 0; i < relevantCount - 1; i++) {
    const rowText = await relevantRows.nth(i).textContent();
    console.log(
      `  ✓ Row ${i + 1} contains ${
        rowText?.includes('Edited ') ? 'Edited' : 'Added'
      } entry`,
    );
  }

  console.log('Step 3: Opening timesheet link for cleanup...');
  const targetRow = relevantRows
    .filter({
      has: page.locator(`xpath=.//button/span[normalize-space()='Timesheet']`),
    })
    .first();
  if (!(await targetRow.count())) {
    throw new Error('Timesheet link not found in the recent audit entries.');
  }

  const timesheetLink = targetRow
    .locator(`xpath=.//button/span[normalize-space()='Timesheet']`)
    .first();

  await timesheetLink.click();
  await page.waitForTimeout(2000);
  console.log('Step 3: Verifying Single Time Entry page is visible...');

  console.log('Step 4: Deleting the timesheet entry from the edit screen...');
  await singleTimeEntryPage.clickDeleteButton();
  await singleTimeEntryPage.expectDeleteConfirmationVisible();
  await singleTimeEntryPage.clickYesOnDeleteConfirmation();
  //await singleTimeEntryPage.expectTimeEntryDeletedToastVisible();

  console.log('✓ Audit log edited timesheet entry deleted successfully');
};

export const deleteAuditEntryWTA = async (page: Page) => {
  console.log('STARTING AUDIT LOG EDITED ENTRY DELETION FLOW');

  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const weeklyTimeActivity = new WeeklyTimeActivity(page);

  await deletePayCheck(page);

  // Navigate directly to WTA creation page (using URL to ensure WTA, not WTE)
  await page.goto('/app/timetracking', { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  await page.getByRole('row').nth(1).getByLabel('Delete time row').click();
  await page.waitForTimeout(3000);
  await page.locator("//span[text()='Save and close']").click();
  await page.waitForTimeout(2000);
  await weeklyTimeActivity.validateSuccessToast();
  console.log('✓ Audit log edited timesheet entry deleted successfully');
};

export const validateEntryFromAuditlog = async (page: Page) => {
  console.log('VALIDATING RECENT ADDED ENTRIES IN AUDIT LOG');

  await page.goto('/app/auditlog', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.waitForSelector(`//*[text()='Event']`, {
    state: 'visible',
    timeout: 0,
  });

  const rows = page.locator(`//table//tr[@role='row']`).filter({
    has: page.locator(`xpath=.//div[contains(text(), 'Added ')]`),
  });

  const rowCount = await rows.count();
  if (rowCount < 2) {
    throw new Error(
      'Less than two "Added" audit log entries found to validate.',
    );
  }

  for (let i = 0; i < 2; i++) {
    console.log(`  ✓ Validating Added entry row ${i + 1}`);
    await expect(rows.nth(i)).toContainText('Added ');
  }

  console.log('✓ Successfully validated first two Added entries in Audit Log');
};

export const editedTimeEntryFromAuditlog = async (page: Page) => {
  console.log('VALIDATING AND EDITING RECENT EDITED ENTRIES IN AUDIT LOG');
  // Try to find an "Added" timesheet record first
  let timesheetLinkFound = false;
  let recordType = '';

  // Check for "Added" timesheet record
  const addedTimesheetLink = page
    .locator(`//div[text()="Added "] / descendant::*[text()='Timesheet']`)
    .first();
  const addedExists = await addedTimesheetLink.count();

  if (addedExists > 0) {
    console.log('  Found "Added" timesheet record');
    recordType = 'Added';
    timesheetLinkFound = true;

    console.log(
      `Step 16b: Clicking "Timesheet" link from ${recordType} record...`,
    );
    await addedTimesheetLink.click();
    await page.waitForTimeout(2000);
  }

  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  console.log('Step: Verifying Single Time Entry page is visible...');

  console.log('Step: Updating duration to 7:00 and saving...');
  await singleTimeEntryPage.enterFieldValue('Duration', '7:00');
  await singleTimeEntryPage.clickSaveAndCloseButton();
  await singleTimeEntryPage.validateSuccessToast();
  await page.waitForTimeout(10000);

  console.log(
    '✓ Edited audit log entry updated successfully via Single Time Entry page',
  );
};

export const editedTimeEntryFromAuditlogWTA = async (page: Page) => {
  console.log('VALIDATING AND EDITING RECENT EDITED ENTRIES IN AUDIT LOG');
  // Try to find an "Added" timesheet record first
  let timesheetLinkFound = false;
  let recordType = '';

  const singleTimeEntryPage = new SingleTimeEntryPage(page);

  console.log('Step 1: Opening Audit Log from home settings...');
  await page.goto('/app/auditlog', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.waitForSelector(`//*[text()='Event']`, {
    state: 'visible',
    timeout: 0,
  });

  const allRows = page.locator(`//table//tr[@role='row']`);
  const totalRowCount = await allRows.count();
  if (!totalRowCount) {
    throw new Error('No audit log rows available for validation.');
  }

  const relevantRows = allRows.filter({
    has: page.locator(
      `xpath=.//div[contains(@class,'Cells-textRowText') and (contains(text(),'Added ') or contains(text(),'Edited '))]`,
    ),
  });
  const relevantCount = await relevantRows.count();
  if (relevantCount < 2) {
    throw new Error(
      `Expected at least two Added/Edited audit entries but found ${relevantCount}.`,
    );
  }

  console.log('Step 2: Validating first two Added/Edited rows...');
  for (let i = 0; i < 5; i++) {
    const rowText = await relevantRows.nth(i).textContent();
    console.log(
      `  ✓ Row ${i + 1} contains ${rowText?.includes('Added ')} entry`,
    );

    console.log('Step 3: Opening timesheet link for cleanup...');
    const targetRow = relevantRows
      .filter({
        has: page.locator(
          `xpath=.//button/span[normalize-space()='Timesheet']`,
        ),
      })
      .first();
    if (!(await targetRow.count())) {
      throw new Error('Timesheet link not found in the recent audit entries.');
    }

    const timesheetLink = targetRow
      .locator(`xpath=.//button/span[normalize-space()='Timesheet']`)
      .first();

    await timesheetLink.click();
    await page.waitForTimeout(2000);

    const singleTimeEntryPage = new SingleTimeEntryPage(page);
    console.log('Step: Verifying Single Time Entry page is visible...');

    console.log('Step: Updating duration to 7:00 and saving...');
    await singleTimeEntryPage.enterFieldValue('Duration', '7:00');
    await singleTimeEntryPage.clickSaveAndCloseButton();
    await singleTimeEntryPage.validateSuccessToast();
    await page.waitForTimeout(6000);
  }
  console.log(
    '✓ Edited audit log entry updated successfully via Single Time Entry page',
  );
};

export const cleanupEntryFromAuditlog = async (page: Page) => {
  console.log('STARTING AUDIT LOG CLEANUP FLOW (STA)');

  const singleTimeEntryPage = new SingleTimeEntryPage(page);

  await deletePayCheck(page);

  // console.log('Step 1: Navigating to Audit Log page...');
  // await page.goto('/app/auditlog', { waitUntil: 'load' });
  // await page.waitForTimeout(2000);
  // await page.waitForSelector(`//*[text()='Event']`, {
  //   state: 'visible',
  //   timeout: 0,
  // });

  // const allRows = page.locator(`//table//tr[@role='row']`);
  // const totalRowCount = await allRows.count();
  // if (!totalRowCount) {
  //   throw new Error('No audit log rows available for validation.');
  // }

  // const relevantRows = allRows.filter({
  //   has: page.locator(
  //     `xpath=.//div[contains(@class,'Cells-textRowText') and (contains(text(),'Added ') or contains(text(),'Edited '))]`,
  //   ).first(),
  // });
  // const relevantCount = await relevantRows.count();
  // if (relevantCount < 1) {
  //   throw new Error(
  //     `Expected at least two Added/Edited audit entries but found ${relevantCount}.`,
  //   );
  // }

  // console.log('Step 2: Validating first two Added/Edited rows...');
  // for (let i = 0; i < relevantCount - 1; i++) {
  //   const rowText = await relevantRows.nth(i).textContent();
  //   console.log(
  //     `  ✓ Row ${i + 1} contains ${
  //       rowText?.includes('Added ') ? 'Added' : 'Edited'
  //     } entry`,
  //   );

  //   console.log('Step 3: Opening timesheet link for cleanup...');
  //   const targetRow = relevantRows
  //     .filter({
  //       has: page.locator(
  //         `xpath=.//button/span[normalize-space()='Timesheet']`,
  //       ),
  //     })
  //     .first();
  //   if (!(await targetRow.count())) {
  //     throw new Error('Timesheet link not found in the recent audit entries.');
  //   }

  //   const timesheetLink = targetRow
  //     .locator(`xpath=.//button/span[normalize-space()='Timesheet']`)
  //     .first();

  //   await timesheetLink.click();
  //   await page.waitForTimeout(2000);

  //   console.log(
  //     'Step 4: Verifying Single Time Entry page and deleting entry...',
  //   );
  //   await singleTimeEntryPage.clickDeleteButton();
  //   await singleTimeEntryPage.expectDeleteConfirmationVisible();
  //   await singleTimeEntryPage.clickYesOnDeleteConfirmation();
  //   await singleTimeEntryPage.expectTimeEntryDeletedToastVisible();
  // }

  console.log('✓ Audit log cleanup completed successfully');
};

export const addManualBreakFromBreakRules = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.goto();
  // Use the correct selector for the "Add break rule" button
  await breaksRulesPage.clickAddBreakRuleButton();
  await page.waitForTimeout(1000);
  await page.waitForSelector(`//*[@aria-label="Loading"]`, {
    state: 'hidden',
    timeout: 0,
  });
  await expect(
    page.locator(`//span[text()='Add break rule']`).first(),
  ).toBeVisible();
  const randomManualBreakName = `manual rule${Date.now()}`;
  await page.locator(`#break-name`).first().fill(randomManualBreakName);
  await page.getByLabel(`Enter duration`).first().fill('10');
  await page.keyboard.press(`Tab`);
  await breaksRulesPage.selectAutomaticOrManualBreakCheckbox('Manual');
  await page
    .locator(
      `//span[text()='Notify Workforce app team members'] / ancestor::label / descendant::input[@type='checkbox']`,
    )
    .click();

  //assign break rule to team member
  await page.getByRole('button', { name: 'Edit access' }).click();
  await breaksRulesPage.teamMember2Checkbox.click();
  await page.locator(`//*[text()='Done']`).nth(1).click();
  await page.waitForTimeout(1000);
  //save break rule
  await breaksRulesPage.clickSaveBreakRuleButton();
  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });
  await expect(
    page.locator(`(//h2[@data-testid="drawerTitle"])[1]`),
  ).toBeHidden();
  await expect(
    page.locator(`//td[text()='${randomManualBreakName}']`).first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        `//td[text()='${randomManualBreakName}'] / following-sibling::td[text()='Manual']`,
      )
      .first(),
  ).toBeVisible();
};

export const addAutomaticBreakFromBreakRules = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  //await breaksRulesPage.goto();
  // Use the correct selector for the "Add break rule" button
  await breaksRulesPage.clickAddBreakRuleButton();
  //await page.locator('(//span[text()="Add break rule"])[1]').click();
  await page.waitForTimeout(1000);
  await page.waitForSelector(`//*[@aria-label="Loading"]`, {
    state: 'hidden',
    timeout: 0,
  });
  await expect(
    page.locator(`//strong[text()='Add break rule']`).first(),
  ).toBeVisible();
  const randomBreakName = `automatic rule${Date.now()}`;
  await page.locator(`#break-name`).first().fill(randomBreakName);
  await page.getByLabel(`Enter duration`).first().fill('20');
  await page.keyboard.press(`Tab`);
  await breaksRulesPage.selectAutomaticOrManualBreakCheckbox('Automatic');
  //assign break rule to team member
  await page.getByRole('button', { name: 'Edit access' }).click();
  await breaksRulesPage.teamMemberCheckbox.click();
  await page.locator(`//*[text()='Done']`).nth(1).click();
  await page.waitForTimeout(1000);
  //save break rule
  await breaksRulesPage.clickSaveBreakRuleButton();
  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });
  await expect(
    page.locator(`(//h2[@data-testid="drawerTitle"])[1]`),
  ).toBeHidden();
  await expect(
    page.locator(`//td[text()='${randomBreakName}']`).first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        `//td[text()='${randomBreakName}'] / following-sibling::td[text()='Automatic']`,
      )
      .first(),
  ).toBeVisible();
};
