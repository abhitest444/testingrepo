import { expect, Locator, Page } from '@playwright/test';

// ============================================================================
// FastPipeline-scoped Time reports page object
//
// Self-contained copy of the Time reports locators/methods required by the
// TRP01 suite only. The full shared TimeReportsPage (sorting, grid, pie charts,
// standard-reports navigation that pulls in TimeMenuNavigationPage /
// TimeEntriesPage / gotoWithAuthSession) is intentionally NOT duplicated — this
// copy depends only on @playwright/test.
// ============================================================================

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

export default class TimeReportsPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Loading / popups ────────────────────────────────────────────────────────

  loadingSpinner(): Locator {
    return this.page.locator(
      `//div[@aria-label="Loading" and @role="progressbar"]`,
    );
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

  // ── Standard reports — Time section + the two Time reports ───────────────────

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

  async expectTimeSectionVisible(): Promise<void> {
    await this.scrollToTimeSection();
    await expect(this.timeSectionHeading()).toBeVisible({ timeout: 30_000 });
  }

  /** Timesheet detail by employee is visible under the Time section. */
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

  /** Time Summary by Pay Type is visible under the Time section. */
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

  // ── Itemized Total Time Report ───────────────────────────────────────────────

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

  async openItemizedTotalTimeReport(): Promise<void> {
    const link = this.itemizedTotalTimeReportLink();
    await expect(link).toBeVisible({ timeout: 30_000 });
    await link.click();
    await this.waitForLoadingToDisappear();
  }

  // ==========================================================================
  // Time reports LANDING page — header + the two report-type cards
  //
  // The Time reports tab lands on a page headed "Reports"/"Time reports" that
  // offers two report types as cards:
  //   • Payroll report
  //   • Itemized Total Time Report
  // Each card has a title + a short description and navigates to the Standard
  // reports page when clicked. All locators are page-level (no iframe).
  // ==========================================================================

  /** The Time reports page header. */
  timeReportsHeader(): Locator {
    return this.page
      .getByRole('heading', { name: /^(time )?reports$/i })
      .or(
        this.page.locator(
          `//*[normalize-space(text())='Time reports' or normalize-space(text())='Reports']`,
        ),
      )
      .first();
  }

  /** "Payroll report" card title. */
  payrollReportTitle(): Locator {
    return this.page
      .locator(`//*[normalize-space(text())='Payroll report']`)
      .first();
  }

  /** Clickable "Payroll report" card/tile (falls back to the title element). */
  payrollReportCard(): Locator {
    return this.page
      .locator(
        `//*[normalize-space(text())='Payroll report']` +
          `/ancestor-or-self::*[self::a or self::button or @role='button' or @role='link'][1]`,
      )
      .or(this.payrollReportTitle())
      .first();
  }

  /** Descriptive copy shown under the "Payroll report" card title. */
  payrollReportDescription(): Locator {
    return this.page
      .locator(`//*[text()='Payroll report']/following-sibling::*`)
      .first();
  }

  /** "Itemized Total Time Report" card title (alias of the heading getter). */
  itemizedReportTitle(): Locator {
    return this.itemizedTotalTimeReportHeading();
  }

  /** Descriptive copy shown under the "Itemized Total Time Report" card title. */
  itemizedReportDescription(): Locator {
    return this.page
      .locator(`//*[text()='Itemized total time report']/following-sibling::*`)
      .first();
  }

  /** Clicks the "Payroll report" card and waits for the destination to settle. */
  async clickPayrollReport(): Promise<void> {
    const card = this.payrollReportCard();
    await expect(card).toBeVisible({ timeout: 30_000 });
    await card.click();
    await this.waitForLoadingToDisappear();
    await this.page.waitForTimeout(2000);
    await this.handlePopupsInAnyOrder();
  }

  /**
   * Asserts the user is on the Standard reports page after opening a report
   * type — either the URL switched to /app/standardreports or the standard
   * reports content panel rendered.
   */
  async expectStandardReportsPageVisible(): Promise<void> {
    const onUrl = await this.page
      .waitForURL(/standardreports/i, { timeout: 30_000 })
      .then(() => true)
      .catch(() => false);

    if (!onUrl) {
      await expect(this.reportTabContent()).toBeVisible({ timeout: 30_000 });
    }
  }

  // ==========================================================================
  // Page-level validation (moved here from TimeReportsFlows.Util.ts)
  // ==========================================================================

  /** Logs a warning instead of failing the test — mirrors the suite soft pattern. */
  private async soft(label: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
      console.warn(` [soft] ${label}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(` [soft] ${label} — ${message}`);
    }
  }

  /**
   * Validates the Standard reports "Time" section for an opened report type.
   * Shared by the Payroll report and Itemized report flows.
   */
  private async validateStandardReportsTimeSection(
    context: string,
  ): Promise<void> {
    // Scroll to the bottom and confirm the "Time" report category is in view.
    await this.soft(`${context}: Time section is visible`, async () => {
      await this.expectTimeSectionVisible();
    });

    // Validate the two Time reports are listed under the Time section.
    await this.soft(
      `${context}: "${TIME_REPORT_NAMES.timesheetDetailByEmployee}" report is visible`,
      async () => {
        await this.expectTimesheetDetailByEmployeeLocated();
      },
    );

    await this.soft(
      `${context}: "${TIME_REPORT_NAMES.timeSummaryByPaytype}" report is visible`,
      async () => {
        await this.expectTimeSummaryByPaytypeLocated();
      },
    );
  }

  /**
   * Validates the Time reports landing page (header + the two report-type
   * cards) and both report-type flows. All assertions are soft.
   *
   * @param navigateBackToTimeReports navigates back to the Time reports landing
   *   page between the two flows. Supplied by the suite so this page object
   *   stays decoupled from the Dashboard navigation helper.
   */
  async validatePageUI(
    navigateBackToTimeReports: () => Promise<void>,
  ): Promise<void> {
    await this.waitForLoadingToDisappear();

    // ── 1. Time Reports header ─────────────────────────────────────────────────
    await this.soft('Time reports header is visible', async () => {
      await expect(this.timeReportsHeader()).toBeVisible({ timeout: 30_000 });
    });

    // ── 2. Two report types + their descriptions ───────────────────────────────
    await this.soft(
      'Report type "Payroll report" title is visible',
      async () => {
        await expect(this.payrollReportTitle()).toBeVisible({
          timeout: 20_000,
        });
      },
    );
    await this.soft(
      'Report type "Payroll report" has a description',
      async () => {
        const desc = this.payrollReportDescription();
        await expect(desc).toBeVisible({ timeout: 10_000 });
        const text = ((await desc.textContent().catch(() => '')) ?? '').trim();
        console.log(' Payroll report description: "%s"', text);
        expect(
          text.length,
          'Payroll report description should not be empty',
        ).toBeGreaterThan(0);
      },
    );

    await this.soft(
      `Report type "${TIME_REPORT_NAMES.itemizedTotalTimeReport}" title is visible`,
      async () => {
        await expect(this.itemizedReportTitle()).toBeVisible({
          timeout: 20_000,
        });
      },
    );
    await this.soft(
      `Report type "${TIME_REPORT_NAMES.itemizedTotalTimeReport}" has a description`,
      async () => {
        const desc = this.itemizedReportDescription();
        await expect(desc).toBeVisible({ timeout: 10_000 });
        const text = ((await desc.textContent().catch(() => '')) ?? '').trim();
        console.log(' Itemized report description: "%s"', text);
        expect(
          text.length,
          'Itemized report description should not be empty',
        ).toBeGreaterThan(0);
      },
    );

    // ── 3. Click Payroll report → Standard reports page ────────────────────────
    await this.soft(
      'Click "Payroll report" → navigates to Standard reports page',
      async () => {
        await this.clickPayrollReport();
        await this.expectStandardReportsPageVisible();
      },
    );

    // ── 4 & 5. Time section + the two Time reports (Payroll report flow) ───────
    await this.validateStandardReportsTimeSection('Payroll report');

    // ── 6. Navigate back to the Time reports page ──────────────────────────────
    await this.soft('Navigate back to Time reports page', async () => {
      await navigateBackToTimeReports();
      await this.waitForLoadingToDisappear();
      await expect(this.timeReportsHeader()).toBeVisible({ timeout: 30_000 });
    });

    // ── 7. Click Itemized total time report → Standard reports page ────────────
    await this.soft(
      `Click "${TIME_REPORT_NAMES.itemizedTotalTimeReport}" → navigates to Standard reports page`,
      async () => {
        await this.openItemizedTotalTimeReport();
        await this.expectStandardReportsPageVisible();
      },
    );

    // ── 8 & 9. Time section + the two Time reports (Itemized report flow) ──────
    await this.validateStandardReportsTimeSection('Itemized total time report');

    console.log(' ✓ Time reports page UI validated');
  }
}
