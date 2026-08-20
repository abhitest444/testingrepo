import { Page, expect } from '@playwright/test';
import gotoWithAuthSession from '../../gotoWithAuthSession';
import TimeEntriesPage from '../../pages/TimeEntriesPage';
import { clickAddTimeDropdown, selectDisplayByOption } from '../../commonUtils';
import * as weeklyTimeEntryPage from '../../pages/WeeklyTimeEntryPage';

/**
 * Recursively attempts to approve and waits for the success confirmation message.
 */
const approveAndVerifyRecursive = async (
  page: Page,
  expectedMessage: string,
  attempt: number = 1,
  maxAttempts: number = 3,
) => {
  try {
    const approveButton = page
      .locator(
        `//div[contains(@class, 'ClickEventBoundary')]/button/span[text()='Approve']`,
      )
      .first();

    if (await approveButton.isVisible().catch(() => false)) {
      await approveButton.click();
    }

    const approveAndLock = page.getByRole('button', {
      name: 'Approve and lock time',
    });
    if (await approveAndLock.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approveAndLock.click();
    }

    await expect(
      page.locator(
        `//label[contains(@class, 'ApprovalProgressLoader') and text()='${expectedMessage}']`,
      ),
    ).toContainText(expectedMessage);
    return;
  } catch (error) {
    if (attempt >= maxAttempts) throw error;
    await page.waitForTimeout(2000);
    return approveAndVerifyRecursive(
      page,
      expectedMessage,
      attempt + 1,
      maxAttempts,
    );
  }
};

export const navigateToTimeEntries = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
};

export const openWeeklyTimeEntry = async (page: Page) => {
  await page.waitForTimeout(6000);
  await clickAddTimeDropdown(page);
  // Try both common labels
  const wte1 = page.locator(`//span[text()='Weekly time entry']`).first();
  const wte2 = page.locator(`//span[text()='Weekly timesheet']`).first();
  if (await wte1.isVisible().catch(() => false)) {
    await wte1.click();
  } else {
    await wte2.click();
  }
  await weeklyTimeEntryPage.waitForTeamMemberDropdownWithWteRetry(page);
};

type WeeklyCellInput = {
  hours: string;
  notes: string;
  billableRate?: string;
};

/**
 * Fills a single row/cell worth of data on the weekly time entry grid and saves.
 * Uses generic selectors; adjust if your DOM differs.
 */
const fillWeeklyCellAndSave = async (
  page: Page,
  cellIndex: number,
  data: WeeklyCellInput,
) => {
  // Enter hours into the Nth grid cell
  await page.getByRole('gridcell').nth(cellIndex).click();
  await page.keyboard.type(data.hours);

  // Service
  const serviceDropdown = page
    .getByRole('button', { name: /service/i })
    .first();
  if (await serviceDropdown.isVisible().catch(() => false)) {
    await serviceDropdown.click();
    await page.waitForTimeout(300);
    await page.getByRole('option').first().click();
  }

  // Class
  const classDropdown = page.getByRole('button', { name: /class/i }).first();
  if (await classDropdown.isVisible().catch(() => false)) {
    await classDropdown.click();
    await page.waitForTimeout(300);
    await page.getByRole('option').first().click();
  }

  // Location
  const locationDropdown = page
    .getByRole('button', { name: /location/i })
    .first();
  if (await locationDropdown.isVisible().catch(() => false)) {
    await locationDropdown.click();
    await page.waitForTimeout(300);
    await page.getByRole('option').first().click();
  }

  // Billable
  const billableCheckbox = page.getByRole('checkbox', { name: /billable/i });
  if (await billableCheckbox.isVisible().catch(() => false)) {
    await billableCheckbox.check();
  }
  if (data.billableRate) {
    const rateInput = page.getByRole('spinbutton').first();
    if (await rateInput.isVisible().catch(() => false)) {
      await rateInput.fill(data.billableRate);
    }
  }

  // Notes
  const notesInput = page.getByRole('textbox', { name: /notes/i }).first();
  if (await notesInput.isVisible().catch(() => false)) {
    await notesInput.fill(data.notes);
  }

  // Save
  const saveBtn = page.getByRole('button', { name: /^save$/i }).first();
  await saveBtn.click();
  await page.waitForTimeout(800);
};

export const createWeeklyTimeEntryThreeCells = async (page: Page) => {
  await navigateToTimeEntries(page);
  await openWeeklyTimeEntry(page);

  // Wait for page to load
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  // Select team member
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.waitForTimeout(500);

  // Step 1: Click billable checkbox and give 6 as value
  const billableCheckbox = page
    .getByRole('checkbox', { name: /Billable/i })
    .first();
  if (await billableCheckbox.isVisible().catch(() => false)) {
    await billableCheckbox.check({ force: true }).catch(() => undefined);
    await page.waitForTimeout(300);
  }

  const billableRateInput = page.getByRole('textbox', {
    name: /Billable rate/i,
  });
  if (await billableRateInput.isVisible().catch(() => false)) {
    await billableRateInput.fill('6').catch(() => undefined);
    await page.waitForTimeout(300);
  }

  // Step 2: Select customer and fill rows with test data
  const testRows = [
    {
      customerIndex: 1,
      hours: ['8', '0', '0', '0', '0', '8', '0', '0', '0', '0'],
      notes: 'Row 1',
    },
    {
      customerIndex: 2,
      hours: ['0', '8', '0', '0', '0', '0', '8', '0', '0', '0'],
      notes: 'Row 2',
    },
    {
      customerIndex: 3,
      hours: ['0', '0', '8', '0', '0', '0', '0', '8', '0', '0'],
      notes: 'Row 3',
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
    await page.waitForTimeout(500);

    // Fill hours for the row
    for (let j = 1; j < 4; j++) {
      for (let k = 3; k < 8; k++) {
        if (testRows[i].hours[k] !== '0') {
          const cell = weeklyTimeEntryPage.hoursMultiple(page, j, k);
          await cell.click();
          await page.waitForTimeout(200);
          // Type the value after clicking the cell
          await page.keyboard.type(testRows[i].hours[k]);
          await page.waitForTimeout(200);
        }
      }
    }

    // Step 3: Give notes as "test initial" for all rows
    await weeklyTimeEntryPage.notesInput(page).fill('test initial');
    await page.waitForTimeout(300);
  }

  // Save the entry
  await weeklyTimeEntryPage.saveButton(page).click();
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
};

export const approveWeeklyTimeEntries = async (
  page: Page,
  employeeName: string,
) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  await selectDisplayByOption(page, 'Employee');
  await timeEntriesPage.waitForLoadingToDisappear();

  const expected = `Time approved for Test Emp1`;
  await approveAndVerifyRecursive(page, expected);
};

export const navigateToRunPayroll = async (page: Page) => {
  await gotoWithAuthSession(page, '/app/employees?jobId=payroll', {
    waitUntil: 'load',
  });
  await page.waitForTimeout(2000);
};

export const payrollProcessForWTE = async (
  page: Page,
  employeeName: string,
) => {
  await navigateToRunPayroll(page);
  await page.locator(`//span[text()="Run payroll"]`).click();

  // Verify employee name and select
  await expect(page.getByText(employeeName)).toBeVisible();
  await page.getByRole('checkbox').first().check();

  // Edit time -> Unapprove
  await page.getByRole('button', { name: 'Edit time' }).click();
  await page.getByRole('button', { name: 'Unapprove' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Unapprove and unlock time' }).click();

  // Verify approve visible
  await expect(
    page.getByRole('button', { name: 'Approve time' }),
  ).toBeVisible();

  // Open employee details
  await page.getByText(employeeName).first().click();
};

export const editEmployeeEntriesAndApprove = async (page: Page) => {
  // First edit
  await page
    .getByRole('button', { name: /^Edit$/ })
    .first()
    .click();
  await page.getByRole('textbox', { name: /notes/i }).fill('test edited');
  const duration = page.getByRole('spinbutton').first();
  if (await duration.isVisible().catch(() => false)) {
    await duration.fill('1');
  }
  await page.getByRole('button', { name: /^Save$/ }).click();

  // Second edit
  await page
    .getByRole('button', { name: /^Edit$/ })
    .first()
    .click();
  await page.getByRole('textbox', { name: /notes/i }).fill('test edited');
  if (await duration.isVisible().catch(() => false)) {
    await duration.fill('1');
  }
  await page.getByRole('button', { name: /^Save$/ }).click();

  // Third edit
  await page
    .getByRole('button', { name: /^Edit$/ })
    .first()
    .click();
  await page.getByRole('textbox', { name: /notes/i }).fill('test edited');
  if (await duration.isVisible().catch(() => false)) {
    await duration.fill('1');
  }
  await page.getByRole('button', { name: /^Save$/ }).click();

  // Approve time, preview and submit payroll
  await page.getByRole('button', { name: 'Approve time' }).click();
  await page.locator(`//span[text()="Preview payroll"]`).click();
  await page.locator(`//span[text()="Submit payroll"]`).click();
  await expect(page.getByTestId('step').getByRole('main')).toContainText(
    'Payroll is submitted',
  );
};

export const unapprovalProcessFromTimeEntries = async (
  page: Page,
  employeeName: string,
) => {
  await navigateToTimeEntries(page);
  await selectDisplayByOption(page, 'Employee');
  await page.getByText(employeeName).first().click();

  // Verify note
  await expect(page.getByText(/test edited/i)).toBeVisible();

  // Unapprove from dropdown
  await page.getByRole('button', { name: /Approve time/i }).click();
  await page.getByRole('menuitem', { name: /Unapprove time/i }).click();
  await page.getByRole('button', { name: 'Unapprove and unlock time' }).click();
};

export const deleteValuesForEmployee = async (
  page: Page,
  employeeName: string,
) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  let count = await timeEntriesPage.countEmployeeRow(employeeName);
  while (count > 0) {
    await page.locator(`//button[@aria-label='Expand Menu']`).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Yes' }).click();
    await timeEntriesPage.waitForLoadingToDisappear();

    await selectDisplayByOption(page, 'Employee');
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();

    count = await timeEntriesPage.countEmployeeRow(employeeName);
  }
};
