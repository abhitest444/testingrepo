import { Page, Locator, expect } from '@playwright/test';

class RunPayrollPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ========== Locators ==========

  get payPeriodDropdown(): Locator {
    return this.page.locator(`//*[@aria-label="Select a pay period"]`);
  }

  get previewPayrollButton(): Locator {
    return this.page.getByRole('button', { name: 'Preview for 1 employee' });
  }

  get totalPayrollCostText(): Locator {
    //return this.page.getByText(`//*[text()='Total payroll cost']`);
    return this.page.getByText('Total payroll cost');
  }

  get accountSelectionDropdown(): Locator {
    return this.page.locator(`//*[@aria-label="Account selection dropdown"]`);
  }

  get cashOption(): Locator {
    return this.page
      .getByRole('option', { name: /cash/i })
      .or(this.page.locator(`//li[contains(text(), 'Cash')]`))
      .or(this.page.locator(`//*[text()='Cash']`))
      .first();
  }

  get submitPayrollButton(): Locator {
    return this.page.locator(`//*[text()='Submit payroll']`);
  }

  get taxProblemsPopup(): Locator {
    return this.page.locator(
      `//*[contains(text(), 'Avoid tax problems. Make sure')]`,
    );
  }

  get iDontHavePayHistoryButton(): Locator {
    return this.page.locator(`//span[text()="I don't have pay history"]`);
  }

  // ========== Navigation Methods ==========

  async navigateToRunPayroll() {
    await this.page.goto('https://qbo.intuit.com/app/runpayroll', {
      waitUntil: 'load',
    });
    await this.page.waitForTimeout(3000);
  }

  // ========== Interaction Methods ==========

  /**
   * Weekly pay periods for this payroll company run Thursday → Wednesday
   * (matches the Run Payroll "Pay period" dropdown, e.g. 07/16/2026 to 07/22/2026).
   * Returns inclusive start/end for the period containing `date`.
   */
  static getWeeklyPayPeriodBounds(
    date: Date = new Date(),
    periodStartWeekday = 4, // Thursday
  ): { start: Date; end: Date } {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const daysSinceStart = (d.getDay() - periodStartWeekday + 7) % 7;
    const start = new Date(d);
    start.setDate(d.getDate() - daysSinceStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  /**
   * WTE day columns for `hours()` / `clickWeekdayCell` (1-based).
   * Grid DataCells are: [1]=customer/category, [2]=Sun … [8]=Sat
   * (same mapping as TE01 `WTE_WEEKDAY_COLS = [3,4,5]` for Mon–Wed).
   * Picks up to `count` consecutive columns in the visible WTE week ∩ current
   * Thu→Wed pay period. Prefers Mon–Sat (skips Sunday — often non-editable)
   * and may include remaining days through period end (e.g. Wed) so we still
   * get 3 days / 24h for Run Payroll.
   */
  static wteDayColumnsInCurrentPayPeriod(count = 3): number[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { start: periodStart, end: periodEnd } =
      RunPayrollPage.getWeeklyPayPeriodBounds(today);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Sunday

    type DayCand = { col: number; date: Date; dow: number };
    const inPeriod: DayCand[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      d.setHours(0, 0, 0, 0);
      if (d < periodStart || d > periodEnd) continue;
      // Do not go past pay-period end; allow up to period end (not only today)
      // so Tue runs can still use Wed when it closes the period.
      if (d > periodEnd) continue;
      // +2: index 1 is customer/category DataCell; Sun starts at 2.
      inPeriod.push({ col: i + 2, date: d, dow: d.getDay() });
    }

    // Prefer Mon–Sat — Sunday cells are frequently grayed / non-editable.
    const prefer = inPeriod.filter((c) => c.dow !== 0);
    const pool = prefer.length >= count ? prefer : inPeriod;

    const cols = pool.map((c) => c.col);
    if (cols.length >= count) {
      for (let end = cols.length - 1; end >= count - 1; end--) {
        const slice = cols.slice(end - count + 1, end + 1);
        const consecutive = slice.every(
          (c, idx) => idx === 0 || c === slice[idx - 1] + 1,
        );
        if (consecutive) return slice;
      }
      return cols.slice(-count);
    }
    return cols;
  }

  /**
   * Selects the pay period that contains the current date
   */
  async selectPayPeriodWithCurrentDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`  Current date: ${today.toLocaleDateString('en-US')}`);

    // Click pay period dropdown
    await this.payPeriodDropdown.click();
    await this.page.waitForTimeout(1000);
    console.log('  ✓ Opened pay period dropdown');

    // Get all pay period options
    const options = await this.page.locator(`//*[@role='option']`).all();
    console.log(`  Found ${options.length} pay period options`);

    // Parse and find the correct pay period
    for (const option of options) {
      const text = await option.textContent();
      if (!text) continue;

      // Parse date range like "10/30/2025 to 11/05/2025"
      const dateRangeMatch = text.match(
        /(\d{1,2}\/\d{1,2}\/\d{4})\s+to\s+(\d{1,2}\/\d{1,2}\/\d{4})/,
      );

      if (dateRangeMatch) {
        const startDate = new Date(dateRangeMatch[1]);
        const endDate = new Date(dateRangeMatch[2]);

        // Check if today falls within this pay period (inclusive)
        if (today >= startDate && today <= endDate) {
          await option.click();
          await this.page.waitForTimeout(1000);
          console.log(`  ✓ Selected pay period: ${text}`);
          return;
        }
      }
    }

    // If no matching pay period found, close dropdown
    await this.page.keyboard.press('Escape');
    console.log('  ⚠ No pay period found containing current date');
  }

  /**
   * After navigation to Run payroll: dismiss "Finish tax setup" modal if shown, wait for
   * shell UI, then settle (no networkidle). Call before other Run payroll interactions.
   */
  async prepareRunPayrollScreen(): Promise<void> {
    const finishTaxHeading = this.page.locator(
      `xpath=//*[contains(text(), 'Finish tax setup by')]`,
    );
    const remindMeLater = this.page
      .locator(`xpath=//*[text()='Remind me later']`)
      .first();

    for (let i = 0; i < 24; i++) {
      if (await finishTaxHeading.isVisible().catch(() => false)) {
        console.log(
          '  ✓ Finish tax setup modal visible — clicking Remind me later',
        );
        await remindMeLater.click();
        await this.page.waitForTimeout(1500);
        break;
      }
      const shellReady =
        (await this.payPeriodDropdown.isVisible().catch(() => false)) ||
        (await this.previewPayrollButton.isVisible().catch(() => false));
      if (shellReady) {
        break;
      }
      await this.page.waitForTimeout(500);
    }

    // Single locator — .or() in expect() is strict and fails when *both* match (pay period + Preview payroll).
    await expect(this.payPeriodDropdown).toBeVisible();
    console.log('  ✓ Run payroll shell visible');
    await this.page.waitForTimeout(4000);
  }

  /**
   * Handles the tax problems popup if it appears
   */
  async handleTaxProblemsPopup() {
    await this.prepareRunPayrollScreen();

    try {
      const isPopupVisible = await this.taxProblemsPopup.isVisible({
        timeout: 5000,
      });

      if (isPopupVisible) {
        console.log('  ⚠ Tax problems popup appeared');
        await this.iDontHavePayHistoryButton.click();
        await this.page.waitForTimeout(1000);
        console.log('  ✓ Dismissed tax problems popup');
      }
    } catch (error) {
      // Popup didn't appear, continue normally
    }
  }

  /**
   * Ensures employee checkbox is selected on Run Payroll page
   * Only checks if currently unchecked, leaves it checked if already checked
   * If checkbox is disabled (employee already paid), clicks "Create another check" link
   */
  async ensureEmployeeCheckboxSelected(employeeName: string = 'Emp1, Test') {
    // Handle both name formats: "Emp1, Test" or "Test Emp1"
    const alternativeName = employeeName.includes(',')
      ? employeeName.split(', ').reverse().join(' ')
      : employeeName.split(' ').reverse().join(', ');

    // Find the employee row first
    const employeeRow = this.page
      .locator(
        `//tr[contains(., '${employeeName}') or contains(., '${alternativeName}')]`,
      )
      .first();

    try {
      await employeeRow.waitFor({ state: 'visible', timeout: 5000 });

      // Find checkbox with aria-label="Select employee" within the row
      const checkboxLocator = employeeRow
        .getByLabel('Select employee')
        .or(employeeRow.getByLabel('Checkbox'));

      // Check if checkbox is disabled (employee already paid in this period)
      const isDisabled = await checkboxLocator.isDisabled().catch(() => false);

      if (isDisabled) {
        console.log(
          `  ℹ Checkbox is disabled for ${employeeName} - employee already paid, clicking "Create another check"`,
        );

        // Click "Create another check" link to enable selection
        const createAnotherCheckLink = employeeRow.getByText(
          'Create another check',
        );
        if (await createAnotherCheckLink.isVisible().catch(() => false)) {
          await createAnotherCheckLink.click();
          console.log(
            `  ✓ Clicked "Create another check" link for: ${employeeName}`,
          );

          // Wait for and click the confirmation button in the modal dialog
          const confirmButton = this.page
            .getByTestId('ModalDialog')
            .getByRole('button', { name: 'Create another check' });
          await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
          await confirmButton.click();
          await this.page.waitForTimeout(1000); // Wait for UI to update
          console.log(
            `  ✓ Confirmed "Create another check" for: ${employeeName}`,
          );
          return; // Employee should now be selected/enabled
        }
      }

      // Check if already checked
      const isChecked = await checkboxLocator.isChecked().catch(() => false);

      if (!isChecked) {
        await checkboxLocator.check();
        await this.page.waitForTimeout(500); // Wait for UI to update
        console.log(`  ✓ Employee checkbox selected for: ${employeeName}`);
      } else {
        console.log(
          `  ✓ Employee checkbox already selected for: ${employeeName}`,
        );
      }
    } catch (error) {
      console.log(
        `  ℹ Could not find/select checkbox for ${employeeName} - may already be selected or not found`,
      );
    }
  }

  /**
   * Validates that an employee with a specific duration is visible
   */
  async validateEmployeeDuration(durationInHours: string) {
    // Ensure employee checkbox is selected first
    await this.ensureEmployeeCheckboxSelected();

    // Wait for employee name - handle both formats
    const employeeLocator = this.page
      .locator(`//*[text()='Emp1, Test' or text()='Test Emp1']`)
      .first();
    await employeeLocator.waitFor({ state: 'visible', timeout: 30000 });
    console.log('  ✓ Employee is visible on Run Payroll screen');

    // Validate the duration is visible in the employee's row - handle both name formats
    const durationLocator = this.page
      .locator(
        `(//*[text()='Emp1, Test'] | //*[text()='Test Emp1']) / ancestor::tr / descendant::*[text()='${durationInHours}']`,
      )
      .first();

    await expect(durationLocator).toBeVisible({ timeout: 10000 });
    console.log(
      `  ✓ Duration "${durationInHours}" is visible in Run Payroll screen`,
    );
  }

  /**
   * Gets the employee's duration from Run Payroll screen
   * Returns the duration as a number (e.g., 0.05 from "0.05h")
   */
  async getEmployeeDuration(): Promise<number> {
    // Ensure employee checkbox is selected first
    await this.ensureEmployeeCheckboxSelected();

    // Wait for employee name - handle both formats
    const employeeRow = this.page
      .locator(
        `(//*[text()='Emp1, Test'] | //*[text()='Test Emp1'])/ancestor::tr`,
      )
      .first();
    await employeeRow.waitFor({ state: 'visible', timeout: 30000 });

    // Get the duration text from the row - look for pattern like "0.05h" or "1.50h"
    const durationCell = employeeRow
      .locator(`//*[contains(text(), 'h')]`)
      .first();
    const durationText = await durationCell.textContent();

    if (!durationText) {
      throw new Error('Could not find duration in employee row');
    }

    // Extract number from text like "0.05h" -> 0.05
    const match = durationText.match(/(\d+\.?\d*)h/);
    if (!match) {
      throw new Error(`Could not parse duration from text: ${durationText}`);
    }

    return parseFloat(match[1]);
  }

  /**
   * Validates that employee duration is greater than a minimum value
   */
  async validateEmployeeDurationGreaterThan(minDuration: number) {
    const actualDuration = await this.getEmployeeDuration();
    console.log(
      `  Duration check: actual=${actualDuration}h, minimum=${minDuration}h`,
    );

    if (actualDuration <= minDuration) {
      throw new Error(
        `Duration validation failed: ${actualDuration}h is not greater than ${minDuration}h`,
      );
    }

    console.log(
      `  ✓ Duration "${actualDuration}h" is greater than initial "${minDuration}h"`,
    );
    return actualDuration;
  }

  /**
   * Validates that employee hours are visible in run payroll
   */
  async validateEmployeeHoursVisible(
    employeeName: string,
    durationInHours: string,
  ): Promise<boolean> {
    // Prepare both name formats
    const firstName = employeeName.split(' ')[0];
    const lastName = employeeName.split(' ')[1] || employeeName.split(' ')[0];
    const displayName = employeeName.includes(',')
      ? employeeName
      : `${lastName}, ${firstName}`;

    // Ensure employee checkbox is selected first
    await this.ensureEmployeeCheckboxSelected(displayName);

    // Check if employee row exists
    const employeeRow = this.page
      .locator(
        `//tr[contains(., '${employeeName}') or contains(., '${displayName}')]`,
      )
      .first();
    await expect(employeeRow).toBeVisible({ timeout: 10000 });

    // Check if hours are visible in the employee's row
    const hoursLocator = this.page
      .locator(
        `(//*[text()='${employeeName}'] | //*[text()='${displayName}'])/ancestor::tr/descendant::*[text()='${durationInHours}']`,
      )
      .first();

    const isVisible = await hoursLocator
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    return isVisible;
  }

  /**
   * Validates a dimension value for an employee in Run payroll. The Dimension
   * column shows an "N dimensions" link per row; clicking it opens the
   * DataGridDimensionsPopover listing each dimension and its selected value.
   * Returns true when the popover shows the given dimension name and value.
   */
  async validateDimensionInPayroll(
    employeeName: string,
    dimName: string,
    dimValue: string,
  ): Promise<boolean> {
    const firstName = employeeName.split(' ')[0];
    const lastName = employeeName.split(' ')[1] || firstName;
    const displayName = employeeName.includes(',')
      ? employeeName
      : `${lastName}, ${firstName}`;

    const employeeRow = this.page
      .locator(
        `//tr[contains(., '${employeeName}') or contains(., '${displayName}')]`,
      )
      .first();
    await expect(employeeRow).toBeVisible({ timeout: 10000 });

    // The "N dimensions" link in this row's Dimension column.
    const dimLink = employeeRow
      .locator('button[class*="DimensionsLink"]')
      .first();
    if (!(await dimLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      return false;
    }
    await dimLink.click();

    // The dimensions popover.
    const popover = this.page
      .locator('[class*="DataGridDimensionsPopover__PopoverWrapper"]')
      .first();
    await popover.waitFor({ state: 'visible', timeout: 10000 });

    // Assert the dimension name (payroll shows it uppercased) and its value.
    const nameVisible = await popover
      .getByText(new RegExp(dimName, 'i'))
      .first()
      .isVisible()
      .catch(() => false);
    const valueVisible = await popover
      .getByText(dimValue, { exact: false })
      .first()
      .isVisible()
      .catch(() => false);

    await this.page.keyboard.press('Escape').catch(() => undefined);
    return nameVisible && valueVisible;
  }

  /**
   * Validates that employee hours are NOT visible in run payroll
   */
  async validateEmployeeHoursNotVisible(
    employeeName: string,
    durationInHours: string,
  ): Promise<boolean> {
    // Prepare both name formats
    const firstName = employeeName.split(' ')[0];
    const lastName = employeeName.split(' ')[1] || employeeName.split(' ')[0];
    const displayName = employeeName.includes(',')
      ? employeeName
      : `${lastName}, ${firstName}`;

    // Ensure employee checkbox is selected first
    await this.ensureEmployeeCheckboxSelected(displayName);

    // Check if employee row exists
    const employeeRow = this.page
      .locator(
        `//tr[contains(., '${employeeName}') or contains(., '${displayName}')]`,
      )
      .first();
    await expect(employeeRow).toBeVisible({ timeout: 10000 });

    // Check if hours are NOT visible in the employee's row
    const hoursLocator = this.page
      .locator(
        `//*[text()='${displayName}'] / ancestor::tr / descendant::*[text()='${durationInHours}']`,
      )
      .first();

    const isNotVisible = await hoursLocator
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    return !isNotVisible; // Return true if NOT visible
  }

  /**
   * Navigates back from run payroll screen
   */
  async navigateBack() {
    await this.page.goBack();
    await this.page.waitForTimeout(2000);
    console.log('  ✓ Navigated back from run payroll');
  }

  /**
   * Clicks Preview payroll button
   */
  async clickPreviewPayroll() {
    await expect(this.previewPayrollButton).toBeVisible({ timeout: 10000 });
    await this.previewPayrollButton.click();
    await this.page.waitForTimeout(3000);
    console.log('  ✓ Clicked Preview payroll button');
  }

  /**
   * Waits for Preview payroll screen to load
   */
  async waitForPreviewPayrollScreen() {
    await this.totalPayrollCostText.waitFor({
      state: 'visible',
      timeout: 10000,
    });
    console.log('  ✓ Preview payroll screen loaded');
  }

  /**
   * Selects Cash account from dropdown
   */
  async selectCashAccount() {
    await expect(this.accountSelectionDropdown).toBeVisible({ timeout: 10000 });

    // Check if Cash is already selected in the input
    const inputValue = await this.accountSelectionDropdown
      .inputValue()
      .catch(() => '');
    if (inputValue.toLowerCase().includes('cash')) {
      console.log('  ✓ Cash account already selected');
      return;
    }

    await this.accountSelectionDropdown.click();
    await this.page.waitForTimeout(1000);
    console.log('  ✓ Account dropdown opened');

    // Try to find and click Cash option
    const cashOptionVisible = await this.cashOption
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (cashOptionVisible) {
      await this.cashOption.click();
      await this.page.waitForTimeout(1000);
      console.log('  ✓ Selected Cash account');
    } else {
      // If option not visible, try typing Cash and selecting
      await this.accountSelectionDropdown.fill('Cash');
      await this.page.waitForTimeout(1000);
      const option = this.page.getByRole('option', { name: /cash/i }).first();
      if (await option.isVisible().catch(() => false)) {
        await option.click();
        console.log('  ✓ Selected Cash account from search');
      } else {
        // Press Enter to confirm typed value
        await this.page.keyboard.press('Enter');
        console.log('  ✓ Confirmed Cash account selection');
      }
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Clicks Submit payroll button
   */
  async clickSubmitPayroll() {
    await expect(this.submitPayrollButton).toBeVisible({ timeout: 10000 });
    await this.submitPayrollButton.click();
    await this.page.waitForTimeout(3000);
    console.log('  ✓ Clicked Submit payroll button');
  }

  /**
   * Complete workflow: Preview → Select Cash → Submit
   */
  async submitPayrollWithCashAccount() {
    await this.clickPreviewPayroll();
    await this.waitForPreviewPayrollScreen();
    await this.selectCashAccount();
    await this.clickSubmitPayroll();
  }
}

export default RunPayrollPage;
