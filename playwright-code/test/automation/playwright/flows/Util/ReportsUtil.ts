import { Page, expect, Locator } from '@playwright/test';
import ReportsPage from '../../pages/ReportsPage';

const TIMESHEET_DETAIL_BY_EMPLOYEE_COLUMNS = [
  'Activity Date',
  'Day',
  'Duration',
  'Customer',
  'Description',
  'Running Total',
];

const TIME_SUMMARY_BY_PAY_TYPE_COLUMNS = [
  'Activity Date',
  'Duration',
  'Total Seconds',
];

async function openStandardReports(page: Page) {
  const reportsPage = new ReportsPage(page);
  await reportsPage.navigateToReportsPage();
  await reportsPage.scrollToBottom();
  return reportsPage;
}

/** Escape → Customize → Data tab. */
async function openCustomize(page: Page, reportsPage: ReportsPage) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await reportsPage.clickCustomizeAndWait();
  const drawer = reportsPage.customizeDrawer;
  await expect(drawer).toBeVisible({ timeout: 20000 });
  await drawer.getByRole('tab', { name: /^Data$/i }).click();
  return drawer;
}

/** Pivot: Rows / Columns / Values dropdowns + show pivot table. */
async function setPivotAndEnable(
  page: Page,
  drawer: Locator,
  rows: string,
  columns: string,
  values: string,
) {
  const pivot = drawer.locator('[data-id="pivot-button"]');
  await pivot.scrollIntoViewIfNeeded();

  const pivotFieldset = page.getByLabel('Pivot', { exact: true });
  for (const [prefix, label] of [
    ['rows', rows],
    ['columns', columns],
    ['values', values],
  ] as const) {
    const field = pivot.locator(
      `[data-automation-id="${prefix}-pivot-stacked-group-0-displayed-Value"]`,
    );
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.scrollIntoViewIfNeeded();
    await field.click();
    await page.waitForTimeout(500);
    if (await pivotFieldset.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pivotFieldset.getByText(label, { exact: true }).click();
      await page.waitForTimeout(500);
    } else {
      await page.getByText(label, { exact: true }).first().click();
      await page.waitForTimeout(500);
    }
    await expect(field).toHaveAttribute(
      'value',
      new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    );
  }

  const toggle = drawer.getByRole('switch', { name: /pivot switch/i });
  await toggle.scrollIntoViewIfNeeded();
  await expect(toggle).toBeEnabled({ timeout: 25000 });
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await page.waitForTimeout(500);
}

export async function verifyTimeSectionInReports(page: Page) {
  const reportsPage = new ReportsPage(page);
  await reportsPage.navigateToReportsPage();
  await reportsPage.scrollToBottom();
  await reportsPage.expectTimeSectionVisible();
}

export async function verifyTimesheetDetailByEmployeeNavigation(page: Page) {
  const reportsPage = await openStandardReports(page);
  await reportsPage.expectTimeSectionVisible();
  await reportsPage.timesheetDetailByEmployeeLink.click();
  await reportsPage.waitForLoadingToDisappear();
  await page.waitForTimeout(1500);
  const reportTitle = page.locator(
    '[data-automation-id="report-name-display"]',
  );
  await expect(reportTitle).toBeVisible({ timeout: 30000 });
  await expect(reportTitle).toHaveText(/Timesheet Detail by Employee/i);
  await reportsPage.expectColumnHeadersVisible(
    TIMESHEET_DETAIL_BY_EMPLOYEE_COLUMNS,
  );
}

export async function verifyTimeSummaryByPayTypeNavigation(page: Page) {
  const reportsPage = await openStandardReports(page);
  await reportsPage.expectTimeSectionVisible();
  await reportsPage.timeSummaryByPayTypeLink.click();
  await reportsPage.waitForLoadingToDisappear();
  await page.waitForTimeout(1500);
  const reportTitle = page.locator(
    '[data-automation-id="report-name-display"]',
  );
  await expect(reportTitle).toBeVisible({ timeout: 30000 });
  await expect(reportTitle).toHaveText(/Time Summary by Pay Type/i);
  await reportsPage.expectColumnHeadersVisible(
    TIME_SUMMARY_BY_PAY_TYPE_COLUMNS,
  );
}

export async function verifyCustomizationInTimesheetDetailByEmployee(
  page: Page,
) {
  const reportsPage = await openStandardReports(page);
  await reportsPage.openReportFromTimeSection('Timesheet Detail by Employee');
  await expect(
    page.locator('[data-automation-id="report-name-display"]'),
  ).toHaveText(/Timesheet Detail by Employee/i);

  let drawer = await openCustomize(page, reportsPage);

  // Filters — Employee + one employee
  await reportsPage.expandCustomizeSection('Filters');
  await drawer.getByRole('combobox', { name: 'Filter by' }).click();
  await page.getByText('Employee', { exact: true }).first().click();
  await drawer
    .locator('[data-automation-id="filterby-rowcontainer"]')
    .getByRole('textbox', { name: 'Select' })
    .click();
  for (const name of ['Test Emp1', 'Test Emp2'] as const) {
    const cb = page.getByRole('checkbox', { name });
    if (await cb.isVisible({ timeout: 2500 }).catch(() => false)) {
      await cb.check();
      await page.getByRole('main').click();
      const grid = reportsPage.reportTable();
      await expect(grid).toContainText(new RegExp(name, 'i'));
      break;
    }
  }
  console.log('✓ Verified filters');

  // Columns — Reorder: uncheck / check Duration & Running Total
  drawer = await openCustomize(page, reportsPage);
  await reportsPage.expandCustomizeSection('Columns');
  await drawer.getByRole('tab', { name: /^Reorder$/i }).click();
  for (const col of ['Duration', 'Running Total']) {
    await drawer
      .getByRole('checkbox', { name: new RegExp(`^${col}$`, 'i') })
      .uncheck();
  }
  await page.waitForTimeout(500);
  await reportsPage.applyCustomizeAndClose();
  const table = reportsPage.reportTable();
  await expect(
    table.locator('th').filter({ hasText: /duration/i }),
  ).toHaveCount(0);
  await expect(
    table.locator('th').filter({ hasText: /running total/i }),
  ).toHaveCount(0);

  drawer = await openCustomize(page, reportsPage);
  await reportsPage.expandCustomizeSection('Columns');
  await drawer.getByRole('tab', { name: /^Reorder$/i }).click();
  for (const col of ['Duration', 'Running Total']) {
    await drawer
      .getByRole('checkbox', { name: new RegExp(`^${col}$`, 'i') })
      .check();
  }
  await reportsPage.applyCustomizeAndClose();
  await expect(
    table
      .locator('th')
      .filter({ hasText: /duration/i })
      .first(),
  ).toBeVisible();
  await expect(
    table
      .locator('th')
      .filter({ hasText: /running total/i })
      .first(),
  ).toBeVisible();
  console.log('✓ Verified columns');

  // Groups — clear filter, group by Employee
  drawer = await openCustomize(page, reportsPage);
  await reportsPage.expandCustomizeSection('Filters');
  const clearAll = drawer.locator(
    '[data-automation-id="filterby-clearall-btn"]',
  );
  if (await clearAll.isVisible({ timeout: 3000 }).catch(() => false)) {
    await clearAll.click();
    // await page.getByRole('main').click();
    // drawer = await openCustomize(page, reportsPage);
  }
  await reportsPage.expandCustomizeSection('Groups');
  const groupVal = drawer
    .locator('[data-automation-id="groupby-dropdown-displayed-Value"]')
    .first();
  if (
    !/^employee$/i.test(((await groupVal.getAttribute('value')) || '').trim())
  ) {
    await drawer
      .locator('[data-automation-id="groupby-dropdown-input-con"]')
      .first()
      .click();
    await page.getByText('Employee', { exact: true }).first().click();
  }
  await reportsPage.applyCustomizeAndClose();
  await expect(reportsPage.reportTable()).toContainText(/Test Emp1/i);
  await expect(reportsPage.reportTable()).toContainText(/Test Emp2/i);
  console.log('✓ Verified groups');

  // Pivot — Activity date × Employee × Duration
  drawer = await openCustomize(page, reportsPage);
  await reportsPage.expandCustomizeSection('Pivot');
  await setPivotAndEnable(page, drawer, 'Customer', 'Employee', 'Duration');
  await reportsPage.applyCustomizeAndClose();
  await expect(
    table
      .locator('th')
      .filter({ hasText: /customer/i })
      .first(),
  ).toBeVisible();
  await expect(
    table
      .locator('th')
      .filter({ hasText: /test emp1/i })
      .first(),
  ).toBeVisible();
  await expect(
    table
      .locator('th')
      .filter({ hasText: /test emp2/i })
      .first(),
  ).toBeVisible();
  await expect(
    table
      .locator('th')
      .filter({ hasText: /^total$/i })
      .first(),
  ).toBeVisible();
  await expect(
    table
      .locator('th')
      .filter({ hasText: /running total/i })
      .first(),
  ).not.toBeVisible();
  console.log('✓ Verified pivot');
}

export async function verifyCustomizationInTimeSummaryByPayType(page: Page) {
  const reportsPage = await openStandardReports(page);
  await reportsPage.openReportFromTimeSection('Time Summary by Pay Type');
  await expect(
    page.locator('[data-automation-id="report-name-display"]'),
  ).toHaveText(/Time Summary by Pay Type/i);

  let drawer = await openCustomize(page, reportsPage);

  // Filters
  await reportsPage.expandCustomizeSection('Filters');
  await drawer.getByRole('combobox', { name: 'Filter by' }).click();
  await page.getByText('Employee', { exact: true }).first().click();
  await drawer
    .locator('[data-automation-id="filterby-rowcontainer"]')
    .getByRole('textbox', { name: 'Select' })
    .click();
  for (const name of ['Test Emp1', 'Test Emp2'] as const) {
    const cb = page.getByRole('checkbox', { name });
    if (await cb.isVisible({ timeout: 2500 }).catch(() => false)) {
      await cb.check();
      await page.getByRole('main').click();
      const grid = reportsPage.reportTable();
      await expect(grid).toContainText(/Test Emp1/i);
      await expect(grid).not.toContainText(/Test Emp2/i);
      break;
    }
  }
  console.log('✓ Verified filters');

  // Columns — More Columns: Description & Rates (Rates → Bill rate / Cost rate in grid)
  drawer = await openCustomize(page, reportsPage);
  await reportsPage.expandCustomizeSection('Columns');
  await drawer.getByRole('tab', { name: 'More Columns' }).click();
  const timeActivityBtn = drawer.getByRole('button', {
    name: /^Time activity$/i,
  });
  if (
    (await timeActivityBtn.getAttribute('aria-expanded').catch(() => null)) !==
    'true'
  ) {
    await timeActivityBtn.click();
  }
  for (const col of ['Description', 'Rates']) {
    await drawer
      .getByRole('checkbox', { name: new RegExp(`^${col}$`, 'i') })
      .check();
  }
  await reportsPage.applyCustomizeAndClose();
  const table = reportsPage.reportTable();
  await expect(
    table
      .locator('th')
      .filter({ hasText: /description/i })
      .first(),
  ).toBeVisible();
  await expect(
    table.locator('th').filter({ hasText: /rates/i }).first(),
  ).toBeVisible();

  drawer = await openCustomize(page, reportsPage);
  await reportsPage.expandCustomizeSection('Columns');
  await drawer.getByRole('tab', { name: 'More Columns' }).click();
  const timeActivityBtn2 = drawer.getByRole('button', {
    name: /^Time activity$/i,
  });
  if (
    (await timeActivityBtn2.getAttribute('aria-expanded').catch(() => null)) !==
    'true'
  ) {
    await timeActivityBtn2.click();
  }
  for (const col of ['Description', 'Rates']) {
    await drawer
      .getByRole('checkbox', { name: new RegExp(`^${col}$`, 'i') })
      .uncheck();
  }
  await reportsPage.applyCustomizeAndClose();
  await expect(
    table.locator('th').filter({ hasText: /description/i }),
  ).toHaveCount(0);
  await expect(table.locator('th').filter({ hasText: /rates/i })).toHaveCount(
    0,
  );

  console.log('✓ Verified columns');

  // Groups
  drawer = await openCustomize(page, reportsPage);
  await reportsPage.expandCustomizeSection('Filters');
  const clearAll = drawer.locator(
    '[data-automation-id="filterby-clearall-btn"]',
  );
  if (await clearAll.isVisible({ timeout: 3000 }).catch(() => false)) {
    await clearAll.click();
  }
  await reportsPage.expandCustomizeSection('Groups');
  const groupVal = drawer
    .locator('[data-automation-id="groupby-dropdown-displayed-Value"]')
    .first();
  if (
    !/^employee$/i.test(((await groupVal.getAttribute('value')) || '').trim())
  ) {
    await drawer
      .locator('[data-automation-id="groupby-dropdown-input-con"]')
      .first()
      .click();
    await page.getByText('Employee', { exact: true }).first().click();
  }
  await reportsPage.applyCustomizeAndClose();
  await expect(table).toContainText(/Test Emp1/i);
  await expect(table).toContainText(/Test Emp2/i);

  console.log('✓ Verified groups');

  // Pivot — Type × Employee × Duration
  drawer = await openCustomize(page, reportsPage);
  await reportsPage.expandCustomizeSection('Pivot');
  await setPivotAndEnable(page, drawer, 'Type', 'Employee', 'Duration');
  await reportsPage.applyCustomizeAndClose();
  await expect(
    table
      .locator('th')
      .filter({ hasText: /type|activity date/i })
      .first(),
  ).toBeVisible();
  await expect(
    table
      .locator('th')
      .filter({ hasText: /test emp1/i })
      .first(),
  ).toBeVisible();
  await expect(
    table
      .locator('th')
      .filter({ hasText: /^total$/i })
      .first(),
  ).toBeVisible();

  console.log('✓ Verified pivot');
}
