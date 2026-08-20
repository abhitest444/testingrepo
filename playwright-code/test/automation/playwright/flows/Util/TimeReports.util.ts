import { expect, Page } from '@playwright/test';
import TimeReportsPage from '../../pages/TimeReportsPage';
import SingleTimeActivityPage from '../../pages/SingleTimeActivityPage';
import SingleTimeEntryPage from '../../pages/SingleTimeEntryPage';
import { LABELS, testData } from '../../utils';
import { openWeeklyTimeEntry } from './WTERunPayroll.util';
import * as weeklyTimeEntryPage from '../../pages/WeeklyTimeEntryPage';
import TimeEntriesPage from '../../pages/TimeEntriesPage';
import { navigateToSingleTimeEntry } from '../../pages/WeeklyTimeEntryPage';
import { navigateToApprovals, approveSingleEmployee } from './Approvals.util';
import * as TimeClockPage from '../../pages/TimeClockPage';
import {
  openDateRangeDropdown,
  selectDateRangeOption,
  selectDisplayByOption,
} from '../../commonUtils';

const parseReportDate = (value: string): number => {
  const slash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const year =
      slash[3].length === 2 ? 2000 + Number(slash[3]) : Number(slash[3]);
    return new Date(year, Number(slash[1]) - 1, Number(slash[2])).getTime();
  }
  const iso = Date.parse(value);
  return Number.isNaN(iso) ? 0 : iso;
};

const assertDatesSorted = (
  values: string[],
  direction: 'asc' | 'desc',
): void => {
  expect(values.length).toBeGreaterThan(1);
  const timestamps = values.map(parseReportDate).filter((t) => t > 0);
  expect(timestamps.length).toBeGreaterThan(1);

  const sorted = [...timestamps].sort((a, b) => a - b);
  const expected = direction === 'asc' ? sorted : [...sorted].reverse();
  expect(timestamps).toEqual(expected);
};

const DAY_OF_WEEK_ORDER: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const parseDayColumnValue = (value: string): number => {
  const dateTs = parseReportDate(value);
  if (dateTs > 0) return dateTs;

  const dayKey = value.trim().toLowerCase();
  if (dayKey in DAY_OF_WEEK_ORDER) return DAY_OF_WEEK_ORDER[dayKey];

  return -1;
};

const assertDaysSorted = (
  values: string[],
  direction: 'asc' | 'desc',
): void => {
  expect(values.length).toBeGreaterThan(1);
  const sortKeys = values.map(parseDayColumnValue).filter((k) => k >= 0);
  expect(sortKeys.length).toBeGreaterThan(1);

  const sorted = [...sortKeys].sort((a, b) => a - b);
  const expected = direction === 'asc' ? sorted : [...sorted].reverse();
  expect(sortKeys).toEqual(expected);
};

const navigateToStandardReportsTimeSection = async (
  page: Page,
): Promise<TimeReportsPage> => {
  const reportsPage = new TimeReportsPage(page);
  await reportsPage.navigateToStandardReports();
  await reportsPage.expectTimeSectionVisible();
  return reportsPage;
};

/** TR006 — Sort Day column ASC/DESC on Timesheet detail by employee. */
export async function verifyTimesheetDetailByEmployeeActivityDateSort(
  page: Page,
): Promise<void> {
  const reportsPage = new TimeReportsPage(page);

  // 1. Reports → Standard Reports
  await reportsPage.navigateToStandardReports();

  // 2. Verify Time section and locate Timesheet detail by employee
  await reportsPage.expectTimeSectionVisible();
  await reportsPage.expectTimesheetDetailByEmployeeLocated();

  // 3. Click Timesheet detail by employee
  await reportsPage.clickTimesheetDetailByEmployee();

  // 4. Sort the Day column in ASC order
  await reportsPage.clickDayColumnSortAsc();

  // 5. Verify Day values are in ASC order
  const ascDayValues = await reportsPage.getDayColumnValues();
  assertDaysSorted(ascDayValues, 'asc');
  const ascRowCount = await reportsPage.getReportTableDataRowCount();

  // 6. Sort the Day column in DESC order
  await reportsPage.clickDayColumnSortDesc();

  // 7. Verify Day values are in DESC order
  const descDayValues = await reportsPage.getDayColumnValues();
  assertDaysSorted(descDayValues, 'desc');
  const descRowCount = await reportsPage.getReportTableDataRowCount();

  // 8. Both row counts are the same
  expect(ascRowCount).toBe(descRowCount);
}

/** TR007 — Sort Activity Date ASC/DESC on Time Summary by Pay Type. */
export async function verifyTimeSummaryByPaytypeActivityDateSort(
  page: Page,
): Promise<void> {
  const reportsPage = new TimeReportsPage(page);

  // 1. Navigate to Reports -> Standard Reports in qbo.
  await reportsPage.navigateToStandardReports();

  // 2. Verify time section and locate Time Summary by Pay Type.
  await reportsPage.expectTimeSectionVisible();
  await reportsPage.expectTimeSummaryByPaytypeLocated();

  // 3. Click on Time Summary by Pay Type.
  await reportsPage.clickTimeSummaryByPaytype();

  // 4. Sort the Activity Date column in ASC order.
  await reportsPage.clickActivityDateSortAsc();

  // 5. Verify activity dates are in ASC order (e.g. 05/17, 05/18, 05/19).
  const ascActivityDates = await reportsPage.getActivityDateColumnValues();
  assertDatesSorted(ascActivityDates, 'asc');
  const ascRowCount = await reportsPage.getReportTableDataRowCount();

  // 6. Sort the Activity Date column in DESC order.
  await reportsPage.clickActivityDateSortDesc();

  // 7. Verify activity dates are in DESC order (e.g. 05/19, 05/18, 05/17).
  const descActivityDates = await reportsPage.getActivityDateColumnValues();
  assertDatesSorted(descActivityDates, 'desc');
  const descRowCount = await reportsPage.getReportTableDataRowCount();

  // 8. Both row counts are the same
  expect(ascRowCount).toBe(descRowCount);
}

const openBothTimeReports = async (
  page: Page,
  markerText: string,
): Promise<TimeReportsPage> => {
  const reportsPage = await navigateToStandardReportsTimeSection(page);

  await reportsPage.openTimesheetDetailByEmployeeReport();
  await reportsPage.expectReportRowWithTextVisible(markerText);

  await reportsPage.navigateToStandardReports();
  await reportsPage.openTimeSummaryByPaytypeReport();
  await reportsPage.expectReportRowWithTextVisible(markerText);

  return reportsPage;
};

const createStaWithMarker = async (
  page: Page,
  marker: string,
): Promise<void> => {
  const staPage = new SingleTimeActivityPage(page);
  await staPage.navigateToSingleTime();
  await staPage.validateSTALoaded();
  await staPage.handleTourModal();

  await staPage.openDropdown(LABELS.Name);
  await staPage.clickDropdownOption(testData.option1, LABELS.Name);

  if (await staPage.checkFieldVisibility(LABELS.Customers)) {
    await staPage.openDropdown(LABELS.Customers);
    await staPage.clickDropdownOption(testData.option1, LABELS.Customers);
  }

  await staPage.fillData(LABELS.Duration, testData.duration);
  await staPage.fillData(LABELS.NotesLabel, marker);
  await staPage.clickButton(LABELS.Save);
  await page.waitForTimeout(3000);
};

const createWtaWithMarker = async (
  page: Page,
  marker: string,
): Promise<void> => {
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await openWeeklyTimeEntry(page);
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.waitForTimeout(1000);

  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page, 1);
  await page.waitForTimeout(500);

  const hoursInput = page.locator('input[type="text"]').first();
  await hoursInput.fill('2');
  const notes = weeklyTimeEntryPage.panelNotes(page);
  if (await notes.isVisible({ timeout: 3000 }).catch(() => false)) {
    await notes.fill(marker);
  }
  await weeklyTimeEntryPage.saveButton(page).click();
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
};

const createSteWithMarker = async (
  page: Page,
  marker: string,
): Promise<string> => {
  await navigateToSingleTimeEntry(page);
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  const teamMemberInput = weeklyTimeEntryPage.teamMemberDropdownValue(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.waitForTimeout(1000);

  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page, 1);

  const hoursInput = page.locator('input[type="text"]').first();
  await hoursInput.fill('3');
  const notes = weeklyTimeEntryPage.panelNotes(page);
  if (await notes.isVisible({ timeout: 3000 }).catch(() => false)) {
    await notes.fill(marker);
  }
  await weeklyTimeEntryPage.saveButton(page).click();
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);

  const employeeName =
    (await teamMemberInput.inputValue().catch(() => '')) || 'Test Emp1';
  return employeeName.trim() || 'Test Emp1';
};

export type ItemizedReportEntryFields = {
  teamMember: string;
  customer: string;
  serviceItem: string;
};

const pickDropdownOptionText = async (
  page: Page,
  optionIndex = 1,
): Promise<string> => {
  const option = page.getByRole('option').nth(optionIndex);
  await expect(option).toBeVisible({ timeout: 20_000 });
  const text = (await option.textContent())?.replace(/\s+/g, ' ').trim() ?? '';
  await option.click();
  await page.waitForTimeout(1000);
  return text;
};

const setBillableCheckbox = async (
  page: Page,
  billable: boolean,
): Promise<void> => {
  const billableCheckbox = page
    .getByRole('checkbox', { name: /Billable/i })
    .first();
  if (
    !(await billableCheckbox.isVisible({ timeout: 3000 }).catch(() => false))
  ) {
    return;
  }
  if (billable) {
    await billableCheckbox.check({ force: true }).catch(() => undefined);
  } else {
    await billableCheckbox.uncheck({ force: true }).catch(() => undefined);
  }
};

const readCustomerInputValue = async (page: Page): Promise<string> => {
  const customerInput = page
    .locator(
      `//input[contains(@aria-label, 'Customer') or contains(@aria-label, 'customer')]`,
    )
    .first();
  if (await customerInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    return ((await customerInput.inputValue().catch(() => '')) || '').trim();
  }
  return (
    (await weeklyTimeEntryPage.getCustomerName(page).catch(() => '')) || ''
  ).trim();
};

const readServiceInputValue = async (page: Page): Promise<string> => {
  const serviceField = weeklyTimeEntryPage.panelServiceDropdown(page);
  if (await serviceField.isVisible({ timeout: 3000 }).catch(() => false)) {
    return ((await serviceField.inputValue().catch(() => '')) || '').trim();
  }
  return '';
};

const createSteForItemizedReport = async (
  page: Page,
  billable: boolean,
): Promise<ItemizedReportEntryFields> => {
  await navigateToSingleTimeEntry(page);
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  const stePage = new SingleTimeEntryPage(page);
  await stePage.waitForPageReady();
  await stePage.handlePopupsInAnyOrder();

  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  const teamMember = await pickDropdownOptionText(page, 1);

  await stePage.openAndselectCustomerOption(1);
  const customer = (await readCustomerInputValue(page)) || 'Customer';

  const serviceDropdown = weeklyTimeEntryPage.panelServiceDropdown(page);
  let serviceItem = '';
  if (await serviceDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
    await serviceDropdown.click();
    serviceItem = (await pickDropdownOptionText(page, 1)) || 'Hours';
  }

  await setBillableCheckbox(page, billable);

  const hoursInput = page.locator('input[type="text"]').first();
  await hoursInput.fill('3');
  await stePage.clickSaveButton();
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);

  return {
    teamMember,
    customer,
    serviceItem: serviceItem || 'Hours',
  };
};

const createWteForItemizedReport = async (
  page: Page,
  billable: boolean,
): Promise<ItemizedReportEntryFields> => {
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await openWeeklyTimeEntry(page);
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  const teamMember = await pickDropdownOptionText(page, 1);

  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page, 1);
  const customer =
    (await weeklyTimeEntryPage.getCustomerName(page).catch(() => '')) ||
    'Customer';

  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('2');

  const serviceDropdown = weeklyTimeEntryPage.panelServiceDropdown(page);
  let serviceItem = '';
  if (await serviceDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
    await serviceDropdown.click();
    serviceItem = (await pickDropdownOptionText(page, 1)) || 'Hours';
  }

  await setBillableCheckbox(page, billable);
  await weeklyTimeEntryPage.saveButton(page).click();
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);

  return {
    teamMember,
    customer,
    serviceItem: serviceItem || (await readServiceInputValue(page)) || 'Hours',
  };
};

const createTimeClockForItemizedReport = async (
  page: Page,
  billable: boolean,
): Promise<ItemizedReportEntryFields> => {
  await TimeClockPage.navigateToTimeClock(page);
  await selectDisplayByOption(page, LABELS.date);
  await TimeClockPage.waitForLoadingToDisappear(page);
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  if (await TimeClockPage.isClockOutButtonVisible(page)) {
    await TimeClockPage.clickClockOut(page);
    await page.waitForTimeout(3000);
  }

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  const customerOptions = await TimeClockPage.getCustomerProjectOptions(page);
  const customer = customerOptions[0] ?? 'Customer';
  if (customerOptions.length > 0) {
    await TimeClockPage.selectCustomerProject(page, customer);
  }

  const serviceDropdown = page.locator(
    `//span[contains(text(),'Service')]/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
  );
  let serviceItem = 'Hours';
  if (await serviceDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
    await serviceDropdown.click();
    serviceItem = (await pickDropdownOptionText(page, 1)) || 'Hours';
  }

  await setBillableCheckbox(page, billable);
  await TimeClockPage.clickOnClockInButton(page);
  await page.waitForTimeout(5000);
  await TimeClockPage.clickClockOut(page);
  await TimeClockPage.waitForLoadingToDisappear(page);

  const teamMember =
    ((await TimeClockPage.getAdminHeader(page)) ?? '').trim() || 'Test Admin';

  return { teamMember, customer, serviceItem };
};

const verifyItemizedTotalTimeReportPieCharts = async (
  page: Page,
  fields: ItemizedReportEntryFields,
  billableAnswer: 'Yes' | 'No',
): Promise<void> => {
  const reportsPage = new TimeReportsPage(page);
  await reportsPage.navigateToTimeReportsFromTimeMenu();
  await reportsPage.openItemizedTotalTimeReport();
  await reportsPage.expectItemizedTotalTimeReportPageVisible();
  await reportsPage.clickRunReport();
  await reportsPage.expectItemizedReportPieChartsVisible(fields);
  await reportsPage.expectBillablePieChartValue(billableAnswer);
};

/** TR011 — STE (billable) in Itemized Total Time Report pie charts. */
export async function verifySteBillableInItemizedTotalTimeReport(
  page: Page,
): Promise<void> {
  const fields = await createSteForItemizedReport(page, true);
  await verifyItemizedTotalTimeReportPieCharts(page, fields, 'Yes');
}

/** TR012 — WTE (billable) in Itemized Total Time Report pie charts. */
export async function verifyWteBillableInItemizedTotalTimeReport(
  page: Page,
): Promise<void> {
  const fields = await createWteForItemizedReport(page, true);
  await verifyItemizedTotalTimeReportPieCharts(page, fields, 'Yes');
}

/** TR013 — Time Clock (billable) in Itemized Total Time Report pie charts. */
export async function verifyTimeClockBillableInItemizedTotalTimeReport(
  page: Page,
): Promise<void> {
  const fields = await createTimeClockForItemizedReport(page, true);
  await verifyItemizedTotalTimeReportPieCharts(page, fields, 'Yes');
}

/** TR014 — STE (non-billable) in Itemized Total Time Report pie charts. */
export async function verifySteNonBillableInItemizedTotalTimeReport(
  page: Page,
): Promise<void> {
  const fields = await createSteForItemizedReport(page, false);
  await verifyItemizedTotalTimeReportPieCharts(page, fields, 'No');
}

/** TR015 — WTE (non-billable) in Itemized Total Time Report pie charts. */
export async function verifyWteNonBillableInItemizedTotalTimeReport(
  page: Page,
): Promise<void> {
  const fields = await createWteForItemizedReport(page, false);
  await verifyItemizedTotalTimeReportPieCharts(page, fields, 'No');
}

/** TR016 — Time Clock (non-billable) in Itemized Total Time Report pie charts. */
export async function verifyTimeClockNonBillableInItemizedTotalTimeReport(
  page: Page,
): Promise<void> {
  const fields = await createTimeClockForItemizedReport(page, false);
  await verifyItemizedTotalTimeReportPieCharts(page, fields, 'No');
}
