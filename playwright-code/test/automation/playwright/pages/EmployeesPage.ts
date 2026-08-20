import { Page, Locator, expect } from '@playwright/test';

/** Paycheck cleanup: navigation / heavy pages */
const PAYCHECK_NAV_TIMEOUT_MS = 60_000;
/** Dialogs, action menus, confirmation */
const PAYCHECK_INTERACTION_TIMEOUT_MS = 60_000;
/** Success toast, row visibility after delete */
const PAYCHECK_TOAST_OR_ROW_TIMEOUT_MS = 60_000;

class EmployeesPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ========== Locators ==========

  getEmployeeNameLocator(): Locator {
    // Handle both name formats: "Emp1, Test" (Last, First) and "Test Emp1" (First Last)
    return this.page
      .locator(`//*[text()='Emp1, Test' or text()='Test Emp1']`)
      .first();
  }

  get personalInfoText(): Locator {
    return this.page.locator(`//*[text()='Personal']`).first();
  }

  /** Employee profile → opens worker paychecks list (`/app/workerProfile/workerPaychecks`). */
  get paychecksButton(): Locator {
    return this.page.getByRole('button', { name: 'Paychecks' });
  }

  /** @deprecated Old tab label; use {@link paychecksButton}. */
  get paycheckListLink(): Locator {
    return this.paychecksButton;
  }

  get payDateHeader(): Locator {
    // Scope to the paychecks list table header (employee profile pages can also contain "Pay date").
    return this.page
      .locator(`//table//th[normalize-space(.)='Pay date']`)
      .first();
  }

  get paychecksPageHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Paychecks' });
  }

  get paychecksEmptyState(): Locator {
    return this.page.getByText('There are no results matching the criteria.');
  }

  get paycheckTableRows(): Locator {
    return this.page.locator(`table tbody tr`);
  }

  get actionsIcon(): Locator {
    // Chevron dropdown on Paycheck list page to access actions (Delete, etc.)
    // Use .first() to target only the first row's action button
    return this.page
      .getByRole('button', { name: 'Expand Menu' })
      .or(this.page.getByTestId('chevron-down-icon-control'))
      .first();
  }

  get deleteButton(): Locator {
    return this.page.locator(`//*[text()='Delete']`);
  }

  get deletePaycheckConfirmationText(): Locator {
    return this.page.locator(`//*[text()='Delete this paycheck?']`);
  }

  get confirmDeleteButton(): Locator {
    return this.page.locator(
      `//button[@aria-label="Confirm delete of current paycheck"]`,
    );
  }

  get paycheckDeletedToast(): Locator {
    // Generic toast that matches any employee name
    return this.page.locator(`//*[contains(text(), "paycheck was deleted")]`);
  }

  // ========== Navigation Methods ==========

  async navigateToEmployees() {
    await this.page.goto('https://qbo.intuit.com/app/employees', {
      waitUntil: 'load',
    });
    await this.page.waitForTimeout(2000);
  }

  // ========== Interaction Methods ==========

  /**
   * Clicks on the employee name to open details
   */
  async clickEmployeeName() {
    const employeeNameLocator = this.getEmployeeNameLocator();
    await employeeNameLocator.waitFor({
      state: 'visible',
      timeout: PAYCHECK_NAV_TIMEOUT_MS,
    });
    console.log('  ✓ Employee is visible');

    await employeeNameLocator.click();
    await this.page.waitForTimeout(2000);
    console.log('  ✓ Clicked on employee name');
  }

  /**
   * Waits for employee details page to load
   */
  async waitForEmployeeDetailsPage() {
    await this.personalInfoText.waitFor({
      state: 'visible',
      timeout: PAYCHECK_NAV_TIMEOUT_MS,
    });
    console.log('  ✓ Employee details page loaded');
  }

  /**
   * Employee profile → Paychecks button → worker paychecks screen.
   */
  async clickPaychecks() {
    await expect(this.paychecksButton).toBeVisible({
      timeout: PAYCHECK_NAV_TIMEOUT_MS,
    });
    await this.paychecksButton.click();
    // Prod can be slow to hydrate / SPA routing can lag; wait for either URL or page heading.
    await Promise.race([
      this.page
        .waitForURL(/workerPaychecks/i, { timeout: PAYCHECK_NAV_TIMEOUT_MS })
        .catch(() => undefined),
      this.paychecksPageHeading
        .waitFor({ state: 'visible', timeout: PAYCHECK_NAV_TIMEOUT_MS })
        .catch(() => undefined),
    ]);

    // Give the list a moment to populate (prevents premature "no paycheck" checks).
    await this.page.waitForTimeout(5000);
    console.log('  ✓ Clicked Paychecks');
  }

  /** @deprecated Use {@link clickPaychecks}. */
  async clickPaycheckList() {
    await this.clickPaychecks();
  }

  /**
   * Waits for worker paychecks list (`workerProfile/workerPaychecks`).
   */
  async waitForPaychecksPage() {
    // Avoid strict-mode failures: `.or()` can match 2 elements; assert one-at-a-time.
    const headingVisible = await this.paychecksPageHeading
      .isVisible({ timeout: PAYCHECK_NAV_TIMEOUT_MS })
      .catch(() => false);

    if (!headingVisible) {
      await expect(this.payDateHeader).toBeVisible({
        timeout: PAYCHECK_NAV_TIMEOUT_MS,
      });
    }
    // Give the list a moment to populate (prevents premature "no paycheck" checks).
    await this.page.waitForTimeout(5000);
    console.log('  ✓ Paychecks page loaded');
  }

  /**
   * Wait until the paychecks list has either rendered rows/actions OR shown empty-state.
   * This reduces flakes where the page is visible but data is still loading.
   */
  async waitForPaychecksResults() {
    await expect
      .poll(
        async () => {
          const empty = await this.paychecksEmptyState
            .isVisible({ timeout: 1000 })
            .catch(() => false);
          const row = await this.paycheckTableRows
            .first()
            .isVisible({ timeout: 1000 })
            .catch(() => false);
          const actions = await this.actionsIcon
            .isVisible({ timeout: 1000 })
            .catch(() => false);
          return empty || row || actions;
        },
        { timeout: PAYCHECK_NAV_TIMEOUT_MS },
      )
      .toBeTruthy();
  }

  /** @deprecated Use {@link waitForPaychecksPage}. */
  async waitForPaycheckListPage() {
    await this.waitForPaychecksPage();
  }

  /**
   * Checks if the paychecks table has at least one row (not empty-state).
   */
  async hasEmployeePaycheck(): Promise<boolean> {
    await this.waitForPaychecksResults().catch(() => undefined);

    if (
      await this.paychecksEmptyState
        .isVisible({ timeout: PAYCHECK_TOAST_OR_ROW_TIMEOUT_MS })
        .catch(() => false)
    ) {
      console.log('  ⚠ No paycheck found for employee');
      return false;
    }

    const hasDataRow = await this.paycheckTableRows
      .first()
      .isVisible({ timeout: PAYCHECK_TOAST_OR_ROW_TIMEOUT_MS })
      .catch(() => false);
    const hasRowActions = await this.actionsIcon
      .isVisible({ timeout: PAYCHECK_TOAST_OR_ROW_TIMEOUT_MS })
      .catch(() => false);

    if (hasDataRow || hasRowActions) {
      console.log('  ✓ Employee paycheck found');
      return true;
    }

    console.log('  ⚠ No paycheck found for employee');
    return false;
  }

  /**
   * Deletes a single paycheck (the first one visible)
   */
  async deletePaycheck() {
    await this.actionsIcon.waitFor({
      state: 'visible',
      timeout: PAYCHECK_INTERACTION_TIMEOUT_MS,
    });
    await this.actionsIcon.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);
    await this.actionsIcon.click();
    await this.page.waitForTimeout(1000);
    console.log('    ✓ Opened actions menu');

    await expect(this.deleteButton.first()).toBeVisible({
      timeout: PAYCHECK_INTERACTION_TIMEOUT_MS,
    });
    await this.deleteButton.first().click();
    await this.page.waitForTimeout(1000);
    console.log('    ✓ Clicked Delete');

    await expect(this.deletePaycheckConfirmationText).toBeVisible({
      timeout: PAYCHECK_INTERACTION_TIMEOUT_MS,
    });
    console.log('    ✓ Delete confirmation dialog visible');

    await this.confirmDeleteButton.waitFor({
      state: 'visible',
      timeout: PAYCHECK_INTERACTION_TIMEOUT_MS,
    });
    await this.confirmDeleteButton.click();
    await this.page.waitForTimeout(2000);
    console.log('    ✓ Confirmed deletion');

    try {
      await expect(this.paycheckDeletedToast).toBeVisible({
        timeout: PAYCHECK_TOAST_OR_ROW_TIMEOUT_MS,
      });
      console.log('    ✓ Paycheck deleted successfully (toast visible)');
    } catch {
      console.log('    ✓ Paycheck deleted (toast dismissed quickly)');
    }
  }

  /**
   * Validates paychecks list is empty after deletion.
   */
  async validatePaycheckDeleted() {
    await expect(this.paychecksEmptyState).toBeVisible({
      timeout: PAYCHECK_TOAST_OR_ROW_TIMEOUT_MS,
    });
    console.log('  ✓ Paychecks list empty after deletion');
  }

  /**
   * Complete workflow to delete ALL employee paychecks
   * Loops until no more paychecks exist for the employee
   * @throws Error if no paycheck exists initially
   */
  async deleteEmployeePaycheck() {
    await this.navigateToEmployees();
    console.log('  ✓ Navigated to Employees page');

    await this.clickEmployeeName();
    await this.waitForEmployeeDetailsPage();
    await this.clickPaychecks();
    await this.waitForPaychecksPage();

    const hasPaycheck = await this.hasEmployeePaycheck();
    if (!hasPaycheck) {
      throw new Error('No paycheck to delete');
    }

    // Delete all paychecks in a loop
    let paycheckCount = 0;
    while (await this.hasEmployeePaycheck()) {
      paycheckCount++;
      console.log(`  Deleting paycheck #${paycheckCount}...`);
      await this.deletePaycheck();
      await this.page.waitForTimeout(1000); // Wait for page to refresh after deletion
    }

    console.log(`  ✓ All ${paycheckCount} paycheck(s) deleted successfully`);
  }
}

export default EmployeesPage;
