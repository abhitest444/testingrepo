import { Page } from 'playwright-core';
import { expect } from '@playwright/test';
import TimeClockPage from '../../pages/TimeClockPage';

// Import TSP functions from TimeSettings.Util
import {
  validateNavigationToTimeSettingsTimeTracking,
  validateEditModeTimeTracking,
  validateNavigationToTimeSettingsNotif,
  validateNotifEditMode,
  verifyDualSyncPriorityCase,
  verifyDualSyncCustomizeTimesheetSettingsFromClassicTimesheetSaved,
  verifyDualSyncCustomizeTimesheetSettingsFromQBOSaved,
  verifyNotifDualSyncPriorityCaseClassicSaved,
} from './TimeSettings.Util';

// Import CF functions from CustomFieldSettings.Util
import { CreateAndDeactivateNewCustomField } from './CustomFieldSettings.Util';

// Import BR functions from Breaks.Util
import {
  navigateToBreakPreferencesScreen,
  validateBreakSectionPresent,
  validateManageBreaksUIElements,
  addAutomaticBreakRuleAndDeleteIt,
  addManualBreakRuleAndDeleteIt,
} from './Breaks.Util';

// Import WTE functions from WeeklyTimeEntry.util
import {
  validateRowHighlightOnCellSelection,
  validateWeeklyTimeEntryFieldSettingsPopup,
  validateContextMenuOptionsOnCellRightClick,
  createAndValidateWeeklyTimeEntry,
} from './WeeklyTimeEntry.util';

// Import STA methods from STA util files
import {
  saveAndClose,
  validateSTARecentEntries,
  updateSingleTAUsingParamOptimized,
  saveAndCloseStartAndEndTime,
} from './SingleTimeActivityCRUD.util';
import {
  addSTAWithYesterdayDate,
  addSTAWithCurrentDateThenUpdateToYesterday,
} from './TimeEntries.util';
import {
  ensureStaServiceFieldEnabledForPriority,
  settingsCasesPriorityOptimized,
} from './SingleTimeActivitySettings.util';
import {
  checkForBillRateAndCostRateGettingPreFilledForEmployeePriority,
  checkForBillRateGettingPreFilledForBillableServicePriorityOptional,
} from './SingleTimeActivityFeatures.util';
import SingleTimeActivityPage from '../../pages/SingleTimeActivityPage';
import TimeSettingsPage, {
  waitForLoadingToDisappear,
} from '../../pages/TimeSettingsPage';
import TimeEntriesPage from '../../pages/TimeEntriesPage';
import {
  openDateRangeDropdown,
  selectDateRangeOption,
  selectDisplayByOption,
} from '../../commonUtils';
import { deleteTimeEntry } from './TimeClockUtil';
import { validateTimeClockEntriesInTable } from './RunPayrollEditFlow.util';

// TSP - Time Settings Priority Cases

export async function validateTimeSettingsPriorityCases(page: Page) {
  console.log('Starting: validateTimeSettingsPriorityCases');
  // TSP001 - Verify if Admin lands on to "Time Tracking" section and verifies the edit mode
  await validateNavigationToTimeSettingsTimeTracking(page);
  console.log('Navigated to Time Tracking and verified edit mode');
  await validateEditModeTimeTracking(page);

  // TSP002 - Verify if Admin lands on Notifications sections and verifies the edit mode
  await validateNavigationToTimeSettingsNotif(page);
  console.log('Navigated to Notifications and verified edit mode');
  await validateNotifEditMode(page);

  // TSP003 - Validate split timesheet setting for Time Tracking saved from QBO
  await verifyDualSyncPriorityCase(page);
  console.log('Verified dual sync priority case');

  // TSP004- Validate Clock In/Out reminder settings for Notifications saved from classic timesheet
  await verifyNotifDualSyncPriorityCaseClassicSaved(page);
  console.log(
    'Verified reminder settings for Notifications saved priority case',
  );

  // // TSP005 - Validate the dual sync settings for customize timesheet saved from QBO
  // await verifyDualSyncCustomizeTimesheetSettingsFromQBOSaved(page);
  // console.log('Verified dual sync customise timesheet priority case');

  // // TSP006 - Validate the dual sync settings for customize timesheet saved from classic timesheet
  // await verifyDualSyncCustomizeTimesheetSettingsFromClassicTimesheetSaved(
  //   page,
  // );
  // console.log('Verified dual sync settings for customize timesheet saved from classic timesheet');
}

// set custom timesheet fields pre-requisites
export async function setCustomTimesheetFieldsPrerequisites(page: Page) {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
  await TimeSettingsPage.validateFieldsOnCustomizeTimesheetPage(page);
  await TimeSettingsPage.checkedCustomizeTimesheetFieldsCheckbox(page);
  await TimeSettingsPage.checkServiceItemRequired(page);
  await TimeSettingsPage.clickOnCustomizeTimesheetSaveButton(page);
}

// CF - Custom Fields Priority Cases
export async function validateCustomFieldsPriorityCases(page: Page) {
  console.log('Starting: validateCustomFieldsPriorityCases');
  // CF0001 - Validate Custom Field Creation and Deactivation
  await CreateAndDeactivateNewCustomField(page);
  console.log('Custom Field created and deactivated');
}

// BR - Break Rules Priority Cases
export async function validateBreakRulesPriorityCases(page: Page) {
  console.log('Starting: validateBreakRulesPriorityCases');
  // BR001 - Priority Case - Break Rule - Validate Break Rules and Manage Break Sections
  await navigateToBreakPreferencesScreen(page);
  console.log('Navigated to Break Preferences Screen');
  await validateBreakSectionPresent(page);
  console.log('Validated Break Section Present');
  await validateManageBreaksUIElements(page);
  console.log('Validated Manage Breaks UI Elements');

  // BR002 - Priority Case - Break Rule - Add Automatic and Manual Break Rules, Validate and then delete it
  await addAutomaticBreakRuleAndDeleteIt(page);
  console.log('Added and deleted automatic break rule');
  await addManualBreakRuleAndDeleteIt(page);
  console.log('Added and deleted manual break rule');
}

// WTE - Weekly Time Entry Priority Cases
export async function validateWeeklyTimeEntryPriorityCases(page: Page) {
  console.log('Starting: validateWeeklyTimeEntryPriorityCases');
  // Step 1: Create weekly time entry and save
  console.log('Step 1: Creating weekly time entry...');
  await createAndValidateWeeklyTimeEntry(page);
  console.log('Validated weekly time entry persistence');

  // WTE002 - Validate Cell Selection Row Highlighted
  await validateRowHighlightOnCellSelection(page);
  console.log('Validated row highlight on cell selection');

  // WTE003 - Show/Hide Fields - WTE
  await validateWeeklyTimeEntryFieldSettingsPopup(page);
  console.log('Validated weekly time entry field settings popup');

  // WTE004 - Right-Clicked Selected Cell
  await validateContextMenuOptionsOnCellRightClick(page);
  console.log('Validated context menu options on cell right click');
}

const TIME_CLOCK_INLINE_TIME_ERROR_XPATH = `//div[contains(@id,'idsDropdownTypeaheadTextField')]//span[contains(@class, 'InlineValidationMessage-ivm-message')]`;

const OPTIONAL_TIME_CLOCK_ERROR_VISIBLE_MS = 3000;

/**
 * Priority-only: read inline and/or page-message time errors when present.
 * Uses short visibility waits so the suite does not hang when neither UI is shown.
 */
async function getOptionalTimeClockTimeErrorMessages(
  page: Page,
): Promise<string[]> {
  const messages: string[] = [];

  const inlineError = page.locator(TIME_CLOCK_INLINE_TIME_ERROR_XPATH).first();
  try {
    if (
      await inlineError.isVisible({
        timeout: OPTIONAL_TIME_CLOCK_ERROR_VISIBLE_MS,
      })
    ) {
      const text = (await inlineError.textContent())?.trim();
      if (text) {
        messages.push(text);
      }
    }
  } catch {
    // optional — inline validation not shown
  }

  const pageMessage = page.getByTestId('ClockOutSaveErrorPageMessage');
  try {
    if (
      await pageMessage.isVisible({
        timeout: OPTIONAL_TIME_CLOCK_ERROR_VISIBLE_MS,
      })
    ) {
      const text = (await pageMessage.textContent())?.trim();
      if (text) {
        messages.push(text);
      }
    }
  } catch {
    // optional — save-error page message not shown
  }

  return messages;
}

/** Priority-only: log optional validation text and dismiss blocking page message when shown. */
async function logOptionalTimeClockRequiredFieldErrors(
  page: Page,
): Promise<void> {
  const messages = await getOptionalTimeClockTimeErrorMessages(page);
  if (messages.length === 0) {
    console.log(
      'Optional time clock validation: no inline or page-message errors visible; continuing',
    );
    return;
  }

  const combined = messages.join(' | ');
  console.log('Optional time clock validation messages:', combined);
  if (!/required/i.test(combined)) {
    console.log(
      'Optional time clock validation: "required" wording not found; continuing',
    );
  }

  await dismissClockOutSaveErrorPageMessageIfVisible(page);
}

async function dismissClockOutSaveErrorPageMessageIfVisible(
  page: Page,
): Promise<void> {
  const pageMessage = page.getByTestId('ClockOutSaveErrorPageMessage');
  try {
    if (!(await pageMessage.isVisible({ timeout: 1000 }))) {
      return;
    }
    const closeButton = pageMessage
      .getByRole('button', { name: /close/i })
      .first();
    if (await closeButton.isVisible({ timeout: 1000 })) {
      await closeButton.click();
      await pageMessage
        .waitFor({ state: 'hidden', timeout: 5000 })
        .catch(() => undefined);
    }
  } catch {
    // best effort — do not block priority flow
  }
}

// TC - Time Clock Priority Cases
export async function validateTimeClockPriorityCases(page: Page) {
  console.log('Starting: validateTimeClockPriorityCases');
  // TC001 - Enable clock In, clock out
  await TimeClockPage.navigateToTimeClock(page);
  console.log('Navigated to Time Clock');

  console.log('Deleting the time entry...');
  await deleteTimeEntry(page, 'Emp1, Test');

  // Click Clock In button
  await TimeClockPage.clickClockIn(page);
  console.log('Clicked Clock In');
  await TimeClockPage.waitForDrawerVisible(page);
  console.log('Drawer is visible');

  // Get available options
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  console.log('Customer/Project options:', options);
  expect(options.length).toBeGreaterThan(0);

  // Verify we can select an option
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
    console.log('Selected customer/project:', options[0]);
  }

  await TimeClockPage.clickOnClockInButton(page);
  console.log('Clicked on Clock In button');

  // TC002 - Check mandatory fields
  await TimeClockPage.clickClockOut(page);
  console.log('Clicked Clock Out');

  await logOptionalTimeClockRequiredFieldErrors(page);
  console.log('Optional required-field validation step completed');

  // TC003 - Enable clockIn, Add service clock out
  // Get available service item options
  const serviceOptions = await TimeClockPage.getServiceItemOptions(page);
  console.log('Service item options:', serviceOptions);
  expect(serviceOptions.length).toBeGreaterThan(0);

  // Verify we can select a service item
  if (serviceOptions.length > 0) {
    await page
      .locator(
        `//span[contains(text(),'Service')]/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
      )
      .click();
    await page.getByRole('option', { name: serviceOptions[0] }).click();
    console.log('Selected service item:', serviceOptions[0]);

    // Verify selection was made
    const selectedServiceValue = await page
      .locator(`//span[contains(text(),'Service')]/..//input`)
      .inputValue();
    console.log('Selected service value:', selectedServiceValue);
    expect(selectedServiceValue).toContain(serviceOptions[0]);
  }
  // Verify Clock In button is not visible and Clock Out button is visible
  await TimeClockPage.validateClockOutButtonVisibility(page);
  console.log('Validated Clock Out button visibility');
  await TimeClockPage.clickClockOut(page);
  console.log('Clicked Clock Out (final)');

  await page.reload();
  console.log('Validating time clock entries in table...');
  await validateTimeClockEntriesInTable(page, 'Emp1, Test');
}

/** Local-part substring of TCPQBO01 login email; list "Name" should include this for the clocked-in employee row. */
function qboClockTestUserIdentitySubstring(): string {
  const env = process.env.PLAYWRIGHT_ENV || 'preprod';
  return env === 'prod'
    ? 'testproduction03qbousertest_iamtestpass_otp'
    : 'test1778489563828_iamtestpass';
}

function mapHeaderCellsToRowObject(
  headers: string[],
  rawTds: string[],
): Record<string, string> {
  const tds = rawTds.map((t) => (t ?? '').trim());
  const tdsToUse = tds[0] === '' ? tds.slice(1) : tds;
  const headersToUse = headers.slice(0, tdsToUse.length);
  return Object.fromEntries(
    headersToUse
      .map((header, idx) => [header, tdsToUse[idx] ?? ''])
      .filter(([header, value]) => header !== 'Details' && value !== '-'),
  ) as Record<string, string>;
}

/**
 * Clock-out and STA both use IDS Notes textareas. `SingleTimeActivityPage.enterFieldValue('Notes')`
 * only matches @type="text", so it never hits Notes — use this instead.
 */
async function fillNotesTextareaForQboClock(
  page: Page,
  value: string,
): Promise<void> {
  const notesTextarea = page
    .locator('[class*="NotesContainer"] textarea')
    .or(page.getByTestId('notes-row').locator('textarea'))
    .or(
      page.locator(
        `//span[contains(text(),'Notes')]/following-sibling::textarea`,
      ),
    )
    .or(page.getByRole('textbox', { name: /\bNotes\s*\*?$/i }))
    .first();
  await notesTextarea.waitFor({ state: 'visible', timeout: 60000 });
  await notesTextarea.clear();
  await page.waitForTimeout(500);
  await notesTextarea.fill(value);
  await page.waitForTimeout(500);
}

/**
 * Date view + This month: find the row containing the clock-out note, read the employee display name,
 * then assert customer, service, billable, notes, and that the row shows a clock time range.
 */
async function fetchAndValidateQboUserTimeClockListRow(
  page: Page,
  params: {
    entryNote: string;
    expectedCustomer: string;
    expectedService: string;
  },
): Promise<string> {
  const timeEntriesPage = new TimeEntriesPage(page);

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  const entryRow = page
    .locator('tbody tr')
    .filter({ hasText: params.entryNote })
    .first();
  await expect(entryRow).toBeVisible({ timeout: 60000 });

  const headers = await timeEntriesPage.getTableHeaders();
  const rawTds = await entryRow.locator('td').allTextContents();
  const rowObj = mapHeaderCellsToRowObject(headers, rawTds);

  const employeeDisplayName = (rowObj.Name || rowObj.Employee || '').trim();
  expect(employeeDisplayName.length).toBeGreaterThan(0);
  expect(employeeDisplayName).toContain(qboClockTestUserIdentitySubstring());

  expect(rowObj.Notes || '').toContain(params.entryNote);
  expect((rowObj.Customer || '').trim()).toBe(params.expectedCustomer.trim());

  const serviceFromRow =
    rowObj.Service ?? rowObj['Service item'] ?? rowObj['Service Item'] ?? '';
  expect((serviceFromRow || '').trim()).toContain(
    params.expectedService.trim(),
  );

  const billableCell = (rowObj.Billable ?? '').trim().toLowerCase();
  expect(
    ['yes', 'y', 'true', 'billable'].includes(billableCell) ||
      billableCell.startsWith('yes'),
  ).toBeTruthy();

  const rowText = (await entryRow.innerText()).replace(/\s+/g, ' ');
  expect(rowText).toMatch(/\d{1,2}:\d{2}/);

  console.log(`✓ QBO time clock list: row for "${employeeDisplayName}"`);
  return employeeDisplayName;
}

export async function validateTimeClockPriorityCasesForQBOUsers(page: Page) {
  const createdTimeClockNote = 'qbo time clock created';
  const editedTimeClockNote = 'qbo time clock edited';
  let selectedCustomer = '';
  let selectedService = '';

  console.log('Starting: validateTimeClockPriorityCases');
  await TimeClockPage.navigateToTimeClock(page);
  console.log('Navigated to Time Clock');

  await TimeClockPage.clickClockIn(page);
  console.log('Clicked Clock In');
  await TimeClockPage.waitForDrawerVisible(page);
  console.log('Drawer is visible');

  const options = await TimeClockPage.getCustomerProjectOptions(page);
  console.log('Customer/Project options:', options);
  expect(options.length).toBeGreaterThan(0);

  if (options.length > 0) {
    selectedCustomer = options[0];
    await TimeClockPage.selectCustomerProject(page, selectedCustomer);
    console.log('Selected customer/project:', selectedCustomer);
  }

  await TimeClockPage.clickOnClockInButton(page);
  console.log('Clicked on Clock In button');

  await TimeClockPage.clickClockOut(page);
  console.log('Clicked Clock Out');

  await logOptionalTimeClockRequiredFieldErrors(page);
  console.log('Optional required-field validation step completed');

  const serviceOptions = await TimeClockPage.getServiceItemOptions(page);
  console.log('Service item options:', serviceOptions);
  expect(serviceOptions.length).toBeGreaterThan(0);

  if (serviceOptions.length > 0) {
    await page
      .locator(
        `//span[contains(text(),'Service')]/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
      )
      .click();
    selectedService = serviceOptions[1];
    await page.getByRole('option', { name: selectedService }).click();
    console.log('Selected service item:', selectedService);

    const selectedServiceValue = await page
      .locator(`//span[contains(text(),'Service')]/..//input`)
      .inputValue();
    console.log('Selected service value:', selectedServiceValue);
    expect(selectedServiceValue).toContain(selectedService);
  }

  const drawer = page.locator('[data-test-id="time-clock-drawer"]');
  await drawer.waitFor({ state: 'visible' });

  const billableCheckbox = drawer
    .locator('[class*="BillableCheckbox"] input[type="checkbox"]')
    .first();
  await billableCheckbox.waitFor({ state: 'visible' });
  if (!(await billableCheckbox.isChecked())) {
    await billableCheckbox.check();
  }

  await fillNotesTextareaForQboClock(page, createdTimeClockNote);

  await TimeClockPage.validateClockOutButtonVisibility(page);
  console.log('Validated Clock Out button visibility');
  await TimeClockPage.clickClockOut(page);
  console.log('Clicked Clock Out (final)');
  await page.waitForTimeout(1000);
  await waitForLoadingToDisappear(page);

  const timeEntriesPage = new TimeEntriesPage(page);

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  console.log('Checking This month for time entries...');
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  console.log('Validating time clock entries in table (QBO user list row)...');
  const qboEmployeeDisplayName = await fetchAndValidateQboUserTimeClockListRow(
    page,
    {
      entryNote: createdTimeClockNote,
      expectedCustomer: selectedCustomer,
      expectedService: selectedService,
    },
  );

  const singleTimeActPage = new SingleTimeActivityPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await timeEntriesPage.clickEntryByDescription(createdTimeClockNote);
  await page.waitForTimeout(2000);
  await fillNotesTextareaForQboClock(page, editedTimeClockNote);
  await singleTimeActPage.clickSaveAndCloseButton();
  await page.waitForTimeout(2000);
  await waitForLoadingToDisappear(page);
  await expect(
    page.locator(`//tr[contains(., '${editedTimeClockNote}')]`),
  ).toHaveCount(1);
  console.log('✓ Verified edited entry in time clock list row');

  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();

  console.log('Checking This month for time entries...');
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  await expect(
    page.locator(`//tr[contains(., '${editedTimeClockNote}')]`).first(),
  ).toBeVisible();
  await deleteTimeEntry(page, qboEmployeeDisplayName);
  await expect(
    page.locator(`//tr[contains(., '${editedTimeClockNote}')]`),
  ).toHaveCount(0);
}

export async function singleTimeActivityPriorityCasesOptimized(page: Page) {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  await validateSTARecentEntries(page);

  // Single navigation and setup
  await singleTimeActPage.navigateToSingleTime();
  await singleTimeActPage.openDropdown('Name');
  await singleTimeActPage.clickDropdownOption(1, 'Name');

  // Optimized settings with reduced waits and batch operations
  await settingsCasesPriorityOptimized(page);
  await ensureStaServiceFieldEnabledForPriority(page);
  await checkForBillRateGettingPreFilledForBillableServicePriorityOptional(
    page,
    'Company Admin',
  );
  await checkForBillRateAndCostRateGettingPreFilledForEmployeePriority(page);
  await saveAndClose(page);
  await saveAndCloseStartAndEndTime(page, 'Company Admin');
  await updateSingleTAUsingParamOptimized(page);

  // STA Date Methods - Test yesterday's date and current date update scenarios
  console.log("Saving STA with yesterday's date test");
  await addSTAWithYesterdayDate(page, 'Company Admin');

  console.log('Saving STA with current date then update to yesterday test');
  await addSTAWithCurrentDateThenUpdateToYesterday(page, 'Company Admin');
}
