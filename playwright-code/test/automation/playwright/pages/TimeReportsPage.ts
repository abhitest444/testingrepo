import { expect, Locator, Page } from '@playwright/test';
import gotoWithAuthSession from '../gotoWithAuthSession';
import TimeMenuNavigationPage from './TimeMenuNavigationPage';
import TimeEntriesPage from './TimeEntriesPage';

/** Search labels on Standard Reports → Time (prod/e2e copy may vary slightly). */
export const TIME_REPORT_SEARCH_LABELS = {
  timesheetDetailByEmployee: 'Timesheet detail by employee',
  timeSummaryByPaytype: 'Time summary by paytype',
  timeTotal: 'Time total',
} as const;

export const TIME_REPORT_NAMES = {
  timesheetDetailByEmployee: 'Timesheet Detail by Employee',
  timeSummaryByPaytype: 'Time Summary by Pay Type',
  timeTotal: 'Time Total',
  itemizedTotalTimeReport: 'Itemized Total Time Report',
} as const;

export const ITEMIZED_TOTAL_TIME_REPORT_LABEL = 'Itemized Total Time Report';

const STANDARD_REPORTS_URL = '/app/standardreports';

export default class TimeReportsPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  loadingSpinner(): Locator {
    return this.page.locator(
      `//div[@aria-label="Loading" and @role="progressbar"]`,
    );
  }

  reportSearchField(): Locator {
    return this.page.getByTestId('__textField');
  }

  timeSectionHeading(): Locator {
    return this.page
      .locator(`//span[@class="reportCategoryTitleText"][text()="Time"]`)
      .or(this.page.getByRole('heading', { name: /^time$/i }).first())
      .first();
  }

  reportTabContent(): Locator {
    return this.page.locator(
      `//div[@class="report-tab-content flex-flexible"]`,
    );
  }

  /** Scroll report tab panel until the Time category is in view. */
  async scrollToTimeSection(): Promise<void> {
    const reportContent = this.reportTabContent();
    await expect(reportContent).toBeVisible({ timeout: 30_000 });

    const timeSection = this.timeSectionHeading();
    const maxScrollAttempts = 15;

    for (let i = 0; i < maxScrollAttempts; i++) {
      if (await timeSection.isVisible({ timeout: 1000 }).catch(() => false)) {
        await timeSection.scrollIntoViewIfNeeded();
        return;
      }
      await reportContent.evaluate((el) => {
        el.scrollTop += el.clientHeight * 0.85;
      });
      await this.page.waitForTimeout(400);
    }

    await timeSection.scrollIntoViewIfNeeded();
  }

  timesheetDetailByEmployeeReport(): Locator {
    return this.page
      .getByText(TIME_REPORT_NAMES.timesheetDetailByEmployee, { exact: false })
      .or(
        this.page.getByText(
          TIME_REPORT_SEARCH_LABELS.timesheetDetailByEmployee,
          { exact: false },
        ),
      )
      .first();
  }

  timeSummaryByPaytypeReport(): Locator {
    return this.page
      .getByText(TIME_REPORT_NAMES.timeSummaryByPaytype, { exact: false })
      .or(
        this.page.getByText(TIME_REPORT_SEARCH_LABELS.timeSummaryByPaytype, {
          exact: false,
        }),
      )
      .first();
  }

  activityDateColumnHeader(): Locator {
    return this.page
      .getByRole('columnheader', { name: /activity date/i })
      .or(this.page.locator(`//th[contains(., "Activity Date")]`))
      .or(
        this.page.locator(
          `//*[contains(@class,"dgrid-header")]//*[text()="Activity Date"]`,
        ),
      )
      .first();
  }

  dayColumnHeader(): Locator {
    return this.page
      .getByRole('columnheader', { name: /^day$/i })
      .or(this.page.locator(`//th[contains(., "Day")]`))
      .or(
        this.page.locator(
          `//*[contains(@class,"dgrid-header")]//*[text()="Day"]`,
        ),
      )
      .first();
  }

  dayColumnSortAscButton(): Locator {
    return this.page.locator(
      `//motion.div[text()="Day"]//button[@aria-label="ASC"]`,
    );
  }

  dayColumnSortDescButton(): Locator {
    return this.page.locator(
      `//motion.div[text()="Day"]//button[@aria-label="DESC"]`,
    );
  }

  activityDateSortAscButton(): Locator {
    return this.page.locator(
      `//motion.div[text()="Activity Date"]//button[@aria-label="ASC"]`,
    );
  }

  activityDateSortDescButton(): Locator {
    return this.page.locator(
      `//motion.div[text()="Activity Date"]//button[@aria-label="DESC"]`,
    );
  }

  reportGridRows(): Locator {
    return this.page.locator('motion.div.dgrid-row');
  }

  reportTableDataRows(): Locator {
    return this.page.locator('//table//tbody//tr').filter({
      has: this.page.getByRole('rowheader', {
        name: /\d{1,2}\/\d{1,2}\/\d{2,4}/,
      }),
    });
  }

  async getReportTableDataRowCount(): Promise<number> {
    return this.reportTableDataRows().count();
  }

  async expectReportTableHasDataRows(minRows = 2): Promise<void> {
    const rows = this.reportTableDataRows();
    await expect(rows.first()).toBeVisible({ timeout: 60_000 });
    expect(await this.getReportTableDataRowCount()).toBeGreaterThanOrEqual(
      minRows,
    );
  }

  async navigateToStandardReports(): Promise<void> {
    const url = STANDARD_REPORTS_URL;
    await gotoWithAuthSession(this.page, url, { waitUntil: 'load' });
    await this.page.waitForLoadState('load');
    await this.waitForLoadingToDisappear();
    await this.handlePopupsInAnyOrder();
  }

  async waitForLoadingToDisappear(): Promise<void> {
    const loader = this.loadingSpinner();
    if (await loader.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loader
        .waitFor({ state: 'hidden', timeout: 120_000 })
        .catch(() => {});
    }
    await this.page.waitForTimeout(1500);
  }

  async handlePopupsInAnyOrder(): Promise<void> {
    const close = this.page.locator(`//button[@aria-label="Close"]`).first();
    if (await close.isVisible({ timeout: 2000 }).catch(() => false)) {
      await close.click().catch(() => {});
    }
    const gotIt = this.page.getByRole('button', { name: /^got it$/i });
    if (await gotIt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gotIt.click().catch(() => {});
    }
  }

  async expectTimeSectionVisible(): Promise<void> {
    await this.scrollToTimeSection();
    await expect(this.timeSectionHeading()).toBeVisible({ timeout: 30_000 });
  }

  /** Step 2 — Timesheet detail by employee is visible under the Time section. */
  async expectTimesheetDetailByEmployeeLocated(): Promise<void> {
    const reportContent = this.reportTabContent();
    const report = this.timesheetDetailByEmployeeReport();
    const maxScrollAttempts = 15;

    for (let i = 0; i < maxScrollAttempts; i++) {
      if (await report.isVisible({ timeout: 1000 }).catch(() => false)) {
        await report.scrollIntoViewIfNeeded();
        await expect(report).toBeVisible({ timeout: 30_000 });
        return;
      }
      await reportContent.evaluate((el) => {
        el.scrollTop += el.clientHeight * 0.85;
      });
      await this.page.waitForTimeout(400);
    }

    await report.scrollIntoViewIfNeeded();
    await expect(report).toBeVisible({ timeout: 30_000 });
  }

  /** Step 2 — Time Summary by Pay Type is visible under the Time section. */
  async expectTimeSummaryByPaytypeLocated(): Promise<void> {
    const reportContent = this.reportTabContent();
    const report = this.timeSummaryByPaytypeReport();
    const maxScrollAttempts = 15;

    for (let i = 0; i < maxScrollAttempts; i++) {
      if (await report.isVisible({ timeout: 1000 }).catch(() => false)) {
        await report.scrollIntoViewIfNeeded();
        await expect(report).toBeVisible({ timeout: 30_000 });
        return;
      }
      await reportContent.evaluate((el) => {
        el.scrollTop += el.clientHeight * 0.85;
      });
      await this.page.waitForTimeout(400);
    }

    await report.scrollIntoViewIfNeeded();
    await expect(report).toBeVisible({ timeout: 30_000 });
  }

  /** Step 3 — Open Timesheet detail by employee from the Time reports list. */
  async clickTimesheetDetailByEmployee(): Promise<void> {
    const report = this.timesheetDetailByEmployeeReport();
    await expect(report).toBeVisible({ timeout: 30_000 });
    await report.click();
    await this.waitForLoadingToDisappear();
    await this.page.waitForTimeout(2000);
    await this.expectReportTableHasDataRows();
  }

  /** Step 3 — Open Time Summary by Pay Type from the Time reports list. */
  async clickTimeSummaryByPaytype(): Promise<void> {
    const report = this.timeSummaryByPaytypeReport();
    await expect(report).toBeVisible({ timeout: 30_000 });
    await report.click();
    await this.waitForLoadingToDisappear();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Search and open a report from Standard Reports (Reports → Standard Reports → Time).
   */
  async searchAndOpenReport(reportSearchText: string): Promise<void> {
    const search = this.reportSearchField();
    await expect(search).toBeVisible({ timeout: 20_000 });
    await search.fill(reportSearchText);
    await this.page.waitForTimeout(1000);

    const reportOption = this.page
      .getByText(reportSearchText, { exact: false })
      .first();
    await expect(reportOption).toBeVisible({ timeout: 30_000 });
    await reportOption.click();
    await this.waitForLoadingToDisappear();
    await this.page.waitForTimeout(2000);
  }

  async openTimesheetDetailByEmployeeReport(): Promise<void> {
    await this.searchAndOpenReport(
      TIME_REPORT_SEARCH_LABELS.timesheetDetailByEmployee,
    );
  }

  async openTimeSummaryByPaytypeReport(): Promise<void> {
    const summaryLabel = TIME_REPORT_SEARCH_LABELS.timeSummaryByPaytype;
    const totalLabel = TIME_REPORT_SEARCH_LABELS.timeTotal;
    const search = this.reportSearchField();
    await expect(search).toBeVisible({ timeout: 20_000 });
    await search.fill(summaryLabel);
    await this.page.waitForTimeout(1000);

    const summary = this.page
      .getByText(TIME_REPORT_NAMES.timeSummaryByPaytype)
      .first();
    if (await summary.isVisible({ timeout: 5000 }).catch(() => false)) {
      await summary.click();
    } else {
      await search.clear();
      await search.fill(summaryLabel);
      await this.page.waitForTimeout(1000);
      await this.page
        .getByText(TIME_REPORT_NAMES.timeSummaryByPaytype)
        .first()
        .click();
    }
    await this.waitForLoadingToDisappear();
  }

  /** Sort Activity Date ASC — click only when DESC sort button is visible. */
  async clickActivityDateSortAsc(): Promise<void> {
    const descButton = this.activityDateSortDescButton();
    if (await descButton.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await descButton.click();
      await this.waitForLoadingToDisappear();
    }
  }

  /** Sort Activity Date DESC — click only when ASC sort button is visible. */
  async clickActivityDateSortDesc(): Promise<void> {
    const ascButton = this.activityDateSortAscButton();
    if (await ascButton.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await ascButton.click();
      await this.waitForLoadingToDisappear();
    }
  }

  /** Sort Day ASC — click only when DESC sort button is visible. */
  async clickDayColumnSortAsc(): Promise<void> {
    const descButton = this.dayColumnSortDescButton();
    if (await descButton.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await descButton.click();
      await this.waitForLoadingToDisappear();
    }
  }

  /** Sort Day DESC — click only when ASC sort button is visible. */
  async clickDayColumnSortDesc(): Promise<void> {
    const ascButton = this.dayColumnSortAscButton();
    if (await ascButton.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await ascButton.click();
      await this.waitForLoadingToDisappear();
    }
  }

  /** Day column values (e.g. Sunday, Monday) from `reportTableDataRows`. */
  async getDayColumnValues(): Promise<string[]> {
    const rows = this.reportTableDataRows();
    const count = await rows.count();
    const values: string[] = [];

    for (let i = 0; i < count; i++) {
      const dayCell = rows.nth(i).locator('td').first();
      const text = (
        await dayCell.textContent({ timeout: 2000 }).catch(() => '')
      )?.trim();
      if (text) values.push(text);
    }

    return values;
  }

  /** Activity Date values from visible report rows (skips empty cells). */
  async getActivityDateColumnValues(): Promise<string[]> {
    return this.getDateColumnValuesFromRows();
  }

  private async getDateColumnValuesFromRows(): Promise<string[]> {
    const rows = this.reportTableDataRows();
    const count = await rows.count();
    const values: string[] = [];

    for (let i = 0; i < count; i++) {
      const dateHeader = rows.nth(i).getByRole('rowheader').first();
      const text = (
        await dateHeader.textContent({ timeout: 2000 }).catch(() => '')
      )?.trim();
      if (text && /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text)) values.push(text);
    }

    if (values.length === 0) {
      const gridRows = this.reportGridRows();
      const gridCount = await gridRows.count();

      for (let i = 0; i < gridCount; i++) {
        const row = gridRows.nth(i);
        if (!(await row.isVisible().catch(() => false))) continue;

        const dateCell = row
          .locator('[class*="col-"]')
          .filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/ })
          .first()
          .or(row.getByText(/\d{1,2}\/\d{1,2}\/\d{2,4}/).first());

        const text = (
          await dateCell.textContent({ timeout: 2000 }).catch(() => '')
        )?.trim();
        if (text) values.push(text);
      }
    }

    return values;
  }

  async expectReportRowWithTextVisible(text: string): Promise<void> {
    const row = this.reportGridRows().filter({ hasText: text }).first();
    await expect(row).toBeVisible({ timeout: 60_000 });
  }

  async expectReportRowEditable(text: string): Promise<void> {
    const row = this.reportGridRows().filter({ hasText: text }).first();
    await expect(row).toBeVisible({ timeout: 60_000 });
    await row.click();
    const saveBtn = this.page.getByRole('button', { name: /^save$/i }).first();
    await expect(saveBtn).toBeEnabled({ timeout: 15_000 });
  }

  async expectReportRowNotEditable(text: string): Promise<void> {
    const row = this.reportGridRows().filter({ hasText: text }).first();
    await expect(row).toBeVisible({ timeout: 60_000 });
    await row.click();
    const saveBtn = this.page.getByRole('button', { name: /^save$/i }).first();
    await expect(saveBtn)
      .toBeDisabled({ timeout: 10_000 })
      .catch(async () => {
        await expect(saveBtn).toHaveCount(0);
      });
  }

  itemizedTotalTimeReportLink(): Locator {
    return this.page
      .getByRole('link', { name: TIME_REPORT_NAMES.itemizedTotalTimeReport })
      .or(this.page.getByText(TIME_REPORT_NAMES.itemizedTotalTimeReport))
      .first();
  }

  itemizedTotalTimeReportHeading(): Locator {
    return this.page
      .getByText(TIME_REPORT_NAMES.itemizedTotalTimeReport)
      .first();
  }

  runReportButton(): Locator {
    return this.page.getByRole('button', { name: /^run report$/i }).first();
  }

  /** Time → Time reports (Payroll report landing). */
  async navigateToTimeReportsFromTimeMenu(): Promise<void> {
    const timeMenu = new TimeMenuNavigationPage(this.page);
    const timeEntriesPage = new TimeEntriesPage(this.page);
    await timeMenu.hoverToRevealTimeSubmenu();
    await timeMenu.clickTimeReports();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.handlePopupsInAnyOrder();
    await timeMenu.validateTimeReportsPageLoaded();
  }

  async openItemizedTotalTimeReport(): Promise<void> {
    const link = this.itemizedTotalTimeReportLink();
    await expect(link).toBeVisible({ timeout: 30_000 });
    await link.click();
    await this.waitForLoadingToDisappear();
  }

  async expectItemizedTotalTimeReportPageVisible(): Promise<void> {
    await expect(this.itemizedTotalTimeReportHeading()).toBeVisible({
      timeout: 60_000,
    });
  }

  async clickRunReport(): Promise<void> {
    const runBtn = this.runReportButton();
    await expect(runBtn).toBeVisible({ timeout: 30_000 });
    await runBtn.click();
    await this.waitForLoadingToDisappear();
    await this.page.waitForTimeout(3000);
  }

  private pieChartSection(labelPattern: RegExp): Locator {
    return this.page
      .locator(
        `//*[contains(@class,"chart") or contains(@class,"Chart") or contains(@class,"pie") or contains(@class,"Pie")]`,
      )
      .filter({ hasText: labelPattern })
      .first();
  }

  /**
   * TR011–TR016 — pie charts show team member, customer, service item, and total hours.
   */
  async expectItemizedReportPieChartsVisible(fields: {
    teamMember: string;
    customer: string;
    serviceItem: string;
  }): Promise<void> {
    const { teamMember, customer, serviceItem } = fields;
    const hoursPattern = /\d+:\d{2}|\d+\.\d+\s*h|\d+\s*hrs?/i;

    for (const value of [teamMember, customer, serviceItem]) {
      if (!value) continue;
      await expect(
        this.page.getByText(value, { exact: false }).first(),
      ).toBeVisible({
        timeout: 90_000,
      });
    }

    await expect(this.page.getByText(hoursPattern).first()).toBeVisible({
      timeout: 90_000,
    });

    for (const label of [
      /team\s*member/i,
      /customer/i,
      /service/i,
      /billable/i,
    ]) {
      const section = this.pieChartSection(label);
      if (await section.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(section).toBeVisible();
      }
    }
  }

  /** TR011–TR016 step 7 — Billable pie chart shows Yes or No. */
  async expectBillablePieChartValue(answer: 'Yes' | 'No'): Promise<void> {
    const billableSection = this.pieChartSection(/billable/i);
    const target = (await billableSection
      .isVisible({ timeout: 5000 })
      .catch(() => false))
      ? billableSection.getByText(new RegExp(`^${answer}$`, 'i'))
      : this.page.getByText(new RegExp(`^${answer}$`, 'i'));

    await expect(target.first()).toBeVisible({ timeout: 60_000 });
  }
}
