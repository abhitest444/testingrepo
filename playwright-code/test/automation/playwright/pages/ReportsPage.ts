import { Page, Locator, expect } from '@playwright/test';
import gotoWithAuthSession from '../gotoWithAuthSession';

/** Report open, date filter, Hours drill-down, delete cleanup (prod can be slow). */
const REPORT_OPERATION_TIMEOUT_MS = 60_000;

class ReportsPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ========== Locators ==========

  get loadingSpinner(): Locator {
    return this.page.locator(
      `//div[@aria-label="Loading" and @role="progressbar"]`,
    );
  }

  get timeActivitiesInfoButtons(): Locator {
    return this.page.locator(
      `//*[text()='Time Activities by Employee Detail']`,
    );
  }

  get timeActivitiesReportTitle(): Locator {
    return this.page.getByRole('heading', {
      name: /Time Activities by\s+Employee Detail/i,
    });
  }

  /** Column header on prod report builder (filter / table). */
  get activityDateColumnHeader(): Locator {
    return this.page.getByText(/^\s*time\s+activity\s+date\s*$/i).first();
  }

  get customDatesDropdown(): Locator {
    return this.page.locator(`(//*[@aria-label="Custom dates"])[1]`);
  }

  get allDatesOption(): Locator {
    // Use .last() to get the clickable menu option, not the heading
    return this.page.locator(`//*[text()='All Dates']`).last();
  }

  get testEmp1Entry(): Locator {
    return this.page.locator(`(//*[contains(text(),'Test Emp1')])[1]`);
  }

  /**
   * PRODUCT/SERVICE "Hours" drill-down on Time Activities by Employee Detail (opens STA).
   * Scoped to report tables — not nav/sidebar. Do not scope with `tr[contains(., RP009)]`; report v2 rows are not reliable `<tr>`.
   */
  get reportHoursDrilldownLinks(): Locator {
    return this.page
      .locator(`//table//*[text()='Hours']`)
      .or(this.page.getByRole('link', { name: /^Hours$/i }))
      .or(this.page.locator(`//*[text()='Hours']`));
  }

  get hoursLink(): Locator {
    return this.reportHoursDrilldownLinks.first();
  }

  /** Standard reports search — must be the `<input>`, not IDS `__wrapper` / `__textField` container. */
  get reportSearchField(): Locator {
    return this.page
      .locator('input[placeholder="Type report name here"]')
      .or(this.page.locator('input[data-testid="__textField"]'))
      .or(
        this.page.getByRole('textbox', {
          name: /type report name here/i,
        }),
      )
      .first();
  }

  get timeSectionHeading(): Locator {
    return this.page.locator('[data-id="report-category-title-TIME"]');
  }

  get timesheetDetailByEmployeeLink(): Locator {
    return this.page
      .getByRole('link', { name: /^Timesheet Detail by Employee$/i })
      .first();
  }

  get timeSummaryByPayTypeLink(): Locator {
    return this.page
      .getByRole('link', { name: /^Time Summary by Pay Type$/i })
      .first();
  }

  get customizeButton(): Locator {
    return this.page
      .locator('[data-id="report-customization-actions-container"]')
      .getByRole('button', { name: 'Customize' })
      .first();
  }

  /** Right-hand Customize drawer: same node is `role="dialog"` and `data-automation-id="report-side-panel"`. */
  get customizeDrawer(): Locator {
    return this.page
      .locator('[data-automation-id="report-side-panel"]')
      .first();
  }

  // ========== Navigation Methods ==========

  async navigateToReportsPage() {
    await gotoWithAuthSession(this.page, '/app/standardreports', {
      waitUntil: 'domcontentloaded',
    });
    await this.waitForLoadingToDisappear();
    await this.page
      .getByRole('main')
      .waitFor({ state: 'visible', timeout: 60000 });
  }

  async waitForLoadingToDisappear() {
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 60000 });
    } catch (error) {
      // Loading spinner may not appear if page loads quickly
      console.log('Loading spinner not found or already hidden');
    }
  }

  async waitForPageReady() {
    await this.page.waitForLoadState('load');
    await this.page.waitForTimeout(3000);
    await this.waitForLoadingToDisappear();
  }

  /**
   * Scroll to the bottom of Standard reports until the Time section is in view.
   * Uses the same patterns as TimeSettingsPage.scrollToBottom, bodyNode shell scroll,
   * WeeklyTimeActivity mouse.wheel loop, and scrollIntoViewIfNeeded on the target link.
   */
  async scrollToBottom() {
    await this.waitForLoadingToDisappear();
    const timeLink = this.timesheetDetailByEmployeeLink;

    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page
      .locator('[data-id=bodyNode]')
      .first()
      .evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

    const reportsList = this.page.getByRole('main');
    await reportsList.hover().catch(() => {});
    for (let i = 0; i < 30; i++) {
      if (await timeLink.isVisible({ timeout: 400 }).catch(() => false)) {
        break;
      }
      await this.page.mouse.wheel(0, 1000);
      await this.page.waitForTimeout(400);
    }

    await timeLink.scrollIntoViewIfNeeded();
    await this.timeSectionHeading.scrollIntoViewIfNeeded();
  }

  // ========== Action Methods ==========

  /**
   * Searches for and opens a report by name using the search field
   * @param reportName - The name of the report to search for and open
   */
  async searchAndOpenReport(reportName: string) {
    console.log(`Searching for report: ${reportName}`);

    await this.reportSearchField.waitFor({
      state: 'visible',
      timeout: REPORT_OPERATION_TIMEOUT_MS,
    });
    await this.reportSearchField.fill(reportName);
    await this.page.waitForTimeout(1000);

    const reportOption = this.page
      .getByText(reportName, { exact: true })
      .first();
    await reportOption.waitFor({
      state: 'visible',
      timeout: REPORT_OPERATION_TIMEOUT_MS,
    });
    await reportOption.click();
    await this.page.waitForTimeout(2000);
    await this.waitForLoadingToDisappear();

    console.log(`✓ Report "${reportName}" opened successfully`);
  }

  /** RP008 / cleanup: Time Activities by Employee Detail from Standard reports search. */
  async openTimeActivitiesByEmployeeDetailReport() {
    const reportName = 'Time Activities by Employee Detail';
    await this.searchAndOpenReport(reportName);
    await this.expectTimeActivitiesReportTitleVisible();
  }

  async openReportFromTimeSection(
    reportName: 'Timesheet Detail by Employee' | 'Time Summary by Pay Type',
  ) {
    await this.scrollToBottom();
    const reportLink = this.page
      .getByText(new RegExp(`^${reportName}$`, 'i'))
      .first();
    const visibleInTimeSection = await reportLink
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (visibleInTimeSection) {
      await reportLink.click();
      await this.waitForLoadingToDisappear();
      await this.page.waitForTimeout(1500);
      return;
    }
  }

  async expectTimeSectionVisible() {
    await expect(this.timeSectionHeading).toBeVisible({ timeout: 30000 });
    await expect(this.timesheetDetailByEmployeeLink).toBeVisible({
      timeout: 30000,
    });
    await expect(this.timeSummaryByPayTypeLink).toBeVisible({
      timeout: 30000,
    });
  }

  /** Report grid only — avoids matching unrelated `table` elements on the page. */
  private reportGrid(): Locator {
    return this.page
      .locator('table:has(tr.tanstackTable__headerRow)')
      .or(this.page.locator('table:has(th:has-text("Activity date"))'))
      .or(
        this.page
          .locator('table')
          .filter({ hasText: /Activity date/i })
          .filter({ hasText: /Duration/i }),
      )
      .first();
  }

  /** Header row `<th>` whose visible text matches `label` (regex-safe). */
  private columnHeader(label: string): Locator {
    const pattern = new RegExp(
      label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i',
    );
    return this.reportGrid()
      .locator('tr.tanstackTable__headerRow')
      .first()
      .locator('th')
      .filter({ hasText: pattern })
      .first();
  }

  async expectColumnHeadersVisible(columnHeaders: string[]) {
    await this.reportGrid().waitFor({ state: 'visible', timeout: 30000 });
    for (const columnHeader of columnHeaders) {
      await expect(this.columnHeader(columnHeader)).toBeVisible({
        timeout: 30000,
      });
    }
  }

  async clickCustomizeAndWait() {
    await this.customizeButton.waitFor({ state: 'visible', timeout: 20000 });
    await this.customizeButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Expands a Customize drawer accordion (Filters, Columns, Groups, Pivot) if collapsed.
   */
  async expandCustomizeSection(
    section: 'Filters' | 'Columns' | 'Groups' | 'Pivot',
  ) {
    const panel = this.customizeDrawer;
    await panel.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});

    const byAutomation: Record<typeof section, string> = {
      Filters: 'customize-accordion-item-filter_by',
      Columns: 'customize-accordion-item-columns',
      Groups: 'customize-accordion-item-group_by',
      Pivot: 'customize-accordion-item-pivot_by',
    };
    const sectionRoot = panel.locator(
      `[data-automation-id="${byAutomation[section]}"]`,
    );
    const headerBtn = sectionRoot
      .locator('[id^="accordion__item-header"]')
      .first();
    if (await headerBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const expanded = await headerBtn.getAttribute('aria-expanded');
      if (expanded === 'false') {
        await headerBtn.click();
        await this.page.waitForTimeout(500);
      }
      return;
    }

    const trigger = panel
      .getByRole('button')
      .filter({ hasText: new RegExp(`^${section}`, 'i') })
      .first();
    if (!(await trigger.isVisible({ timeout: 3000 }).catch(() => false))) {
      return;
    }
    const expanded = await trigger.getAttribute('aria-expanded');
    if (expanded === 'false') {
      await trigger.click();
      await this.page.waitForTimeout(500);
    }
  }

  /** Run / Apply / Update report from customize flow when the button is shown. */
  async runApplyReportFromCustomizeIfShown() {
    const btn = this.page
      .getByRole('button', { name: /run report|apply|update report/i })
      .first();
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await this.waitForLoadingToDisappear();
      await this.page.waitForTimeout(2000);
    }
  }

  /** Close the Customize side panel so the report grid can be asserted. */
  async closeCustomizeDrawer() {
    const drawer = this.customizeDrawer;
    if (!(await drawer.isVisible({ timeout: 2000 }).catch(() => false))) {
      return;
    }
    const close = drawer.getByRole('button', { name: /^Close$/i });
    if (await close.isVisible({ timeout: 3000 }).catch(() => false)) {
      await close.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await drawer.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    await this.waitForLoadingToDisappear();
  }

  async applyCustomizeAndClose() {
    await this.runApplyReportFromCustomizeIfShown();
    await this.closeCustomizeDrawer();
  }

  /** Main report table (same scope as {@link expectColumnHeadersVisible}). */
  reportTable(): Locator {
    return this.reportGrid();
  }

  async setSimpleReportPeriodFromCustomize() {
    const reportPeriodSelect = this.page
      .getByRole('combobox', {
        name: /report period/i,
      })
      .first();
    const canSetPeriod = await reportPeriodSelect
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!canSetPeriod) {
      return;
    }

    await reportPeriodSelect.click();
    const thisMonthOption = this.page
      .getByRole('option', { name: /this month/i })
      .first();
    const last30DaysOption = this.page
      .getByRole('option', { name: /last 30 days|last 30 days to date/i })
      .first();

    if (await thisMonthOption.isVisible().catch(() => false)) {
      await thisMonthOption.click();
    } else if (await last30DaysOption.isVisible().catch(() => false)) {
      await last30DaysOption.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
  }

  async sortColumn(columnName: string) {
    const sortableHeader = this.columnHeader(columnName);
    await sortableHeader.waitFor({ state: 'visible', timeout: 15000 });
    await sortableHeader.click();
    await this.page.waitForTimeout(1000);
  }

  async getColumnValuesByHeader(columnName: string): Promise<string[]> {
    const table = this.reportGrid();
    await table.waitFor({ state: 'visible', timeout: 20000 });
    const header = this.columnHeader(columnName);
    await header.waitFor({ state: 'visible', timeout: 20000 });
    const headerIndex = await header.evaluate((el) =>
      Number((el as HTMLTableCellElement).cellIndex),
    );
    const rowCells = table.locator(
      `tbody tr > td:nth-child(${headerIndex + 1})`,
    );
    const rowCount = await rowCells.count();
    const values: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      const value = (await rowCells.nth(i).textContent())?.trim();
      if (value) {
        values.push(value);
      }
      if (values.length >= 20) {
        break;
      }
    }
    return values;
  }

  async clickTimeActivitiesInfoButton() {
    // First, check if the report is already loaded
    const isReportAlreadyVisible = await this.timeActivitiesReportTitle
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (isReportAlreadyVisible) {
      console.log(
        'Time Activities report is already loaded, skipping button click',
      );
      return;
    }

    const buttons = this.timeActivitiesInfoButtons;
    const buttonCount = await buttons.count();
    console.log(`Found ${buttonCount} Time Activities info buttons`);

    if (buttonCount === 0) {
      throw new Error('No Time Activities info buttons found');
    }

    // Click the first visible button
    try {
      console.log('Clicking first Time Activities info button');
      await buttons.first().scrollIntoViewIfNeeded();
      await buttons.first().click({ timeout: 10000 });
      console.log('Button clicked, waiting for report to load...');

      // Wait for initial navigation/loading - increased for preprod
      await this.page.waitForTimeout(5000);
      await this.waitForLoadingToDisappear();

      // Wait for report to fully render after loading disappears - increased for preprod
      console.log('Loading spinner disappeared, waiting for report title...');
      await this.page.waitForTimeout(5000);

      // Check if report title appeared after clicking with longer timeout for preprod
      const reportVisible = await this.timeActivitiesReportTitle.isVisible({
        timeout: 60000,
      });
      if (reportVisible) {
        console.log('Successfully opened Time Activities report');
        // Give it extra time to stabilize
        await this.page.waitForTimeout(3000);
        return;
      } else {
        throw new Error('Report title not visible after clicking button');
      }
    } catch (error) {
      throw new Error(
        `Failed to open Time Activities report: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** Report v2 date preset dropdown (dijit popup — options are not children of the combobox). */
  private visibleDateFilterMenu(): Locator {
    return this.page
      .locator(
        `[role="listbox"]:visible, div.dijitMenuPopup:not([style*="display: none"])`,
      )
      .last();
  }

  private dateFilterCombobox(): Locator {
    return this.page
      .getByRole('combobox', { name: /time activity date/i })
      .or(this.page.getByRole('combobox', { name: /^Report period$/i }))
      .or(this.page.getByRole('combobox', { name: /^Custom dates$/i }))
      .first();
  }

  /**
   * Opens the report date filter dropdown.
   * Prefers **Time Activity Date** on report v2; falls back to Report period / Custom dates.
   */
  async clickCustomDatesDropdown() {
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await this.page.waitForTimeout(300);

    const timeActivityDate = this.page.getByRole('combobox', {
      name: /time activity date/i,
    });
    if (
      await timeActivityDate
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      console.log('  Using Time Activity Date combobox');
      await timeActivityDate.first().click();
      await this.page.waitForTimeout(800);
      return;
    }

    const timeActivityDateNearLabel = this.page.locator(
      `//*[contains(normalize-space(.),'Time Activity Date')]/following::*[@role='combobox'][1]`,
    );
    if (
      await timeActivityDateNearLabel
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      console.log('  Using Time Activity Date combobox (label xpath)');
      await timeActivityDateNearLabel.click();
      await this.page.waitForTimeout(800);
      return;
    }

    const combobox = this.dateFilterCombobox();
    console.log('  Using report period / custom dates combobox');
    await combobox.waitFor({
      state: 'visible',
      timeout: REPORT_OPERATION_TIMEOUT_MS,
    });
    await combobox.click();
    await this.page.waitForTimeout(800);
  }

  private async clickVisibleDateFilterOption(optionLabel: string) {
    const menu = this.visibleDateFilterMenu();
    await menu.waitFor({
      state: 'visible',
      timeout: REPORT_OPERATION_TIMEOUT_MS,
    });

    const menuOption = menu.getByRole('option', {
      name: optionLabel,
      exact: true,
    });
    if (
      await menuOption
        .first()
        .isVisible({ timeout: REPORT_OPERATION_TIMEOUT_MS })
        .catch(() => false)
    ) {
      await menuOption.first().click();
      return;
    }

    const dijitSpan = menu.locator(
      `span[role="option"]:has-text("${optionLabel}")`,
    );
    if (
      await dijitSpan
        .first()
        .isVisible({ timeout: REPORT_OPERATION_TIMEOUT_MS })
        .catch(() => false)
    ) {
      await dijitSpan.first().click();
      return;
    }

    await menu.locator(`//*[text()='${optionLabel}']`).first().click();
  }

  /**
   * Some report v2 layouts require explicitly clicking "Run report" after changing filters;
   * auto-refresh is not reliable.
   */
  private async clickRunReportBestEffort() {
    const runReport = this.page.getByRole('button', { name: /^Run report$/i });
    const canClick = await runReport
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (!canClick) {
      return;
    }

    await runReport.scrollIntoViewIfNeeded().catch(() => undefined);
    await runReport
      .click({ timeout: REPORT_OPERATION_TIMEOUT_MS })
      .catch(() => {
        // If the click fails (overlay/transient state), don't hard-fail cleanup.
      });
  }

  /** Open filter → pick preset → Run report (if shown) → wait for reload. */
  async applyDateFilterPreset(optionLabel: string) {
    await this.clickCustomDatesDropdown();
    await this.clickVisibleDateFilterOption(optionLabel);
    // Always attempt Run report; required on some prod layouts.
    await this.clickRunReportBestEffort();
    await this.waitForLoadingToDisappear();
    await this.page.waitForTimeout(2000);
  }

  async selectAllDates() {
    await this.applyDateFilterPreset('All Dates');
    await this.page.waitForTimeout(3000);
  }

  async selectToday() {
    await this.applyDateFilterPreset('Today');
  }

  /**
   * Toggle Today → All Dates so the report table drops deleted STAs (stale Hours links otherwise).
   */
  async refreshTimeActivitiesReportDateFilter() {
    console.log('  Refreshing report date filter (Today → All Dates)...');
    await this.applyDateFilterPreset('Today');
    await this.applyDateFilterPreset('All Dates');
    console.log('  ✓ Report date filter refreshed');
  }

  async clickHoursLink() {
    console.log('Clicking first Hours link in report...');
    await this.hoursLink.waitFor({
      state: 'visible',
      timeout: REPORT_OPERATION_TIMEOUT_MS,
    });
    await this.hoursLink.click();
    await this.page.waitForTimeout(3000);
    console.log('Opened time entry from report successfully');
  }

  async expectTimeActivitiesReportTitleVisible() {
    await this.waitForLoadingToDisappear();
    // Use heading only — `.or(activity date)` matches 2 nodes and strict mode fails.
    await expect(this.timeActivitiesReportTitle.first()).toBeVisible({
      timeout: REPORT_OPERATION_TIMEOUT_MS,
    });
  }

  async expectTestEmp1EntryVisible() {
    await expect(this.testEmp1Entry).toBeVisible();
    console.log('Test Emp1 entry is visible in the report');
  }

  async handlePopupsInAnyOrder() {
    try {
      // Check for tour/onboarding modals
      const tourCloseButton = this.page.locator(
        `//button[@aria-label="Close"]`,
      );
      if (await tourCloseButton.isVisible({ timeout: 2000 })) {
        await tourCloseButton.click();
        await this.page.waitForTimeout(500);
      }
    } catch (error) {
      // No popup found, continue
      console.log('No popups found to handle');
    }

    try {
      // Check for "Got it" or similar buttons
      const gotItButton = this.page.getByRole('button', { name: 'Got it' });
      if (await gotItButton.isVisible({ timeout: 2000 })) {
        await gotItButton.click();
        await this.page.waitForTimeout(500);
      }
    } catch (error) {
      // No button found, continue
    }
  }
}

export default ReportsPage;
