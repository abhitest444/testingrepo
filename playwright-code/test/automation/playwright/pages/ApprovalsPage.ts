import { Page, Locator, expect } from '@playwright/test';
import { employeeNameTableMatchPattern } from '../commonUtils';

/**
 * Page Object for Time Approvals page
 * URL: /app/time/approval?jobId=time
 */
class ApprovalsPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Navigation ====================

  async navigateToApprovalsPage() {
    await this.page.goto('/app/time/approval?jobId=time', {
      waitUntil: 'load',
    });
    await this.page.waitForTimeout(2000);
    await this.waitForLoadingToDisappear();
  }

  // ==================== Loading ====================

  get loadingSpinner(): Locator {
    return this.page.locator(
      '//div[@aria-label="Loading" and @role="progressbar"]',
    );
  }

  async waitForLoadingToDisappear(timeoutMs = 60_000) {
    try {
      await this.loadingSpinner.waitFor({
        state: 'hidden',
        timeout: timeoutMs,
      });
    } catch {
      // Loading spinner may not appear for fast loads
    }
  }

  // ==================== Filters ====================

  get dateRangeDropdown(): Locator {
    return this.page
      .locator(
        '//label[contains(., "Date range")]//following-sibling::*//button',
      )
      .or(this.page.locator('//button[contains(@class, "DatePicker")]'))
      .or(this.page.getByLabel('Date range'))
      .first();
  }

  get statusDropdown(): Locator {
    return this.page
      .locator('//label[contains(., "Status")]//select')
      .or(
        this.page.locator(
          '//label[contains(., "Status")]//div[contains(@class, "Dropdown")]',
        ),
      );
  }

  get teamMemberSearch(): Locator {
    return this.page.getByPlaceholder('Search team members');
  }

  async selectDateRange(option: string) {
    await this.dateRangeDropdown.waitFor({ state: 'visible', timeout: 15000 });
    await this.dateRangeDropdown.click();
    await this.page.getByRole('option', { name: option }).click();
    await this.waitForLoadingToDisappear();
    // Wait for table data to load after date range selection
    await this.page.waitForTimeout(2000);
  }

  async selectStatus(status: string) {
    await this.statusDropdown.click();
    await this.page.getByRole('option', { name: status }).click();
    await this.waitForLoadingToDisappear();
  }

  async searchTeamMember(name: string) {
    await this.teamMemberSearch.click();
    await this.teamMemberSearch.fill(name);
    await this.page.waitForTimeout(500);
  }

  async selectTeamMemberFromSearch(name: string) {
    await this.page.getByRole('menuitem', { name: name }).click();
    await this.waitForLoadingToDisappear();
  }

  async clearTeamMemberSearch() {
    await this.teamMemberSearch.clear();
    await this.page.keyboard.press('Escape');
  }

  // ==================== Add Time Button ====================
  // Note: Use clickAddTimeDropdown() and selectSingleTimeEntryFromAddTime() from commonUtils
  // for adding time entries. These are the standard patterns used across the codebase.

  get addTimeButton(): Locator {
    // Role-based match mirrors clickAddTimeDropdown() in commonUtils — the
    // brittle `//*[@type='button']/child::*[text()='Add time']` XPath required an
    // exact-text child node and timed out when the button structure differed.
    return this.page.getByRole('button', { name: 'Add time' });
  }

  // ==================== Run Payroll ====================

  get runPayrollButton(): Locator {
    return this.page.locator(`//*[@type='button']/*[text()='Run Payroll']`);
  }

  async clickRunPayroll() {
    await this.runPayrollButton.click();
  }

  // ==================== Approve Time Button (View Details) ====================

  /**
   * "Approve time" button in view details page - opens dropdown with Approve/Unapprove options
   */
  get approveTimeButton(): Locator {
    return this.page.getByRole('button', { name: 'Approve time' });
  }

  async clickApproveTimeButton() {
    await this.approveTimeButton.click();
  }

  // ==================== Create Employee ====================

  get createEmployeeButton(): Locator {
    return this.page.getByRole('button', { name: 'Create employee' });
  }

  // ==================== Table ====================

  get approvalsTable(): Locator {
    return this.page
      .locator(`//*[@data-id='tabbedNavNode']/following::*[@role='table']`)
      .first();
  }

  get tableRows(): Locator {
    // Match rows that have the Approve button (employee rows, not "All hours" row)
    return this.page
      .locator('/tbody/tr')
      .filter({ has: this.page.getByRole('button', { name: /approve/i }) });
  }

  get allTableRows(): Locator {
    // All rows including "All hours"
    return this.approvalsTable
      .locator('tbody tr')
      .or(this.approvalsTable.locator('tr'));
  }

  get tableHeaders(): Locator {
    return this.approvalsTable.locator('thead th');
  }

  async getTableHeaderTexts(): Promise<string[]> {
    const headers = await this.tableHeaders.allTextContents();
    return headers.map((h) => h.trim()).filter((h) => h.length > 0);
  }

  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  async getFirstEmployeeName(): Promise<string> {
    // Wait for table to have rows
    await this.tableRows.first().waitFor({ state: 'visible' });

    // Get the first row with an Approve button
    const firstRow = this.tableRows.first();

    // Try different methods to get the employee name
    // Method 1: Look for a link or text in the name column
    const nameLink = firstRow.locator('a').first();
    if (await nameLink.isVisible().catch(() => false)) {
      const name = await nameLink.textContent();
      if (name && name.trim()) return name.trim();
    }

    // Method 2: Get all td text and find the one that looks like a name (contains comma)
    const tds = firstRow.locator('td');
    const tdCount = await tds.count();
    for (let i = 0; i < tdCount; i++) {
      const text = (await tds.nth(i).textContent()) || '';
      const cleanText = text.trim().split('\n')[0].trim();
      // Name format is usually "LastName, FirstName" - contains comma
      if (
        cleanText.includes(',') &&
        !cleanText.includes('$') &&
        !cleanText.match(/^\d/)
      ) {
        return cleanText;
      }
    }

    // Method 3: Get first non-empty td that's not a number
    for (let i = 0; i < tdCount; i++) {
      const text = (await tds.nth(i).textContent()) || '';
      const cleanText = text.trim().split('\n')[0].trim();
      if (
        cleanText &&
        !cleanText.match(/^[\d.:]+$/) &&
        cleanText !== '--' &&
        cleanText !== 'Approve'
      ) {
        return cleanText;
      }
    }

    return '';
  }

  getRowByEmployeeName(name: string): Locator {
    return this.page
      .locator(`//*[@role='table']/tbody/tr`)
      .filter({ hasText: employeeNameTableMatchPattern(name) })
      .first();
  }

  getRowWithEmployeeName(name: string): Locator {
    return this.page
      .locator(`//*[@role='table']/tbody/tr`)
      .filter({ hasText: employeeNameTableMatchPattern(name) })
      .first();
  }

  async getEmployeeTotal(employeeName: string): Promise<string> {
    const row = this.getRowByEmployeeName(employeeName);
    const totalCell = row.locator('td').nth(1); // Total column
    return (await totalCell.textContent()) || '';
  }

  async getEmployeeRegular(employeeName: string): Promise<string> {
    const row = this.getRowByEmployeeName(employeeName);
    const regularCell = row.locator('td').nth(2); // Regular column
    return (await regularCell.textContent()) || '';
  }

  async getEmployeeOvertime(employeeName: string): Promise<string> {
    const row = this.getRowByEmployeeName(employeeName);
    const overtimeCell = row.locator('td').nth(3); // Overtime column
    return (await overtimeCell.textContent()) || '';
  }

  async getEmployeePaidTimeOff(employeeName: string): Promise<string> {
    const row = this.getRowByEmployeeName(employeeName);
    const ptoCell = row.locator('td').nth(4); // Paid time off column
    return (await ptoCell.textContent()) || '';
  }

  // ==================== Checkbox Selection ====================

  /**
   * Get checkbox to select an employee (unchecked state)
   * XPath: //*[@aria-label="Add Emp2, Test to selection"]
   */
  getEmployeeCheckbox(employeeName: string): Locator {
    return this.page.locator(
      `//*[@aria-label="Add ${employeeName} to selection"]`,
    );
  }

  /**
   * Get checkbox to deselect an employee (checked state)
   * XPath: //*[@aria-label="Remove Emp2, Test from selection"]
   */
  getEmployeeCheckboxChecked(employeeName: string): Locator {
    return this.page.locator(
      `//*[@aria-label="Remove ${employeeName} from selection"]`,
    );
  }

  /**
   * Get select all checkbox
   * XPath: //*[@aria-label="Select all"]
   */
  get selectAllCheckbox(): Locator {
    return this.page.locator(`//*[@aria-label="Select all"]`);
  }

  async selectEmployee(employeeName: string): Promise<boolean> {
    console.log(`  Selecting employee: ${employeeName}`);
    const checkbox = this.getEmployeeCheckbox(employeeName);

    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.click();
      await this.page.waitForTimeout(500);

      // Validate selection - checked checkbox should now be visible
      const isSelected = await this.getEmployeeCheckboxChecked(employeeName)
        .isVisible()
        .catch(() => false);
      console.log(`    ✓ Employee selected: ${isSelected}`);
      return isSelected;
    }

    console.log(`    ⚠ Checkbox not found for: ${employeeName}`);
    return false;
  }

  async deselectEmployee(employeeName: string): Promise<boolean> {
    console.log(`  Deselecting employee: ${employeeName}`);
    const checkbox = this.getEmployeeCheckboxChecked(employeeName);

    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.click();
      await this.page.waitForTimeout(500);

      // Validate deselection - unchecked checkbox should now be visible
      const isDeselected = await this.getEmployeeCheckbox(employeeName)
        .isVisible()
        .catch(() => false);
      console.log(`    ✓ Employee deselected: ${isDeselected}`);
      return isDeselected;
    }

    console.log(`    ⚠ Checked checkbox not found for: ${employeeName}`);
    return false;
  }

  async selectAllEmployees(): Promise<boolean> {
    console.log(`  Selecting all employees`);
    const checkbox = this.selectAllCheckbox;

    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.click();
      await this.page.waitForTimeout(500);
      console.log(`    ✓ Select all clicked`);
      return true;
    }

    console.log(`    ⚠ Select all checkbox not found`);
    return false;
  }

  async deselectAllEmployees(): Promise<boolean> {
    console.log(`  Deselecting all employees`);
    // Click select all again to deselect
    const checkbox = this.selectAllCheckbox;

    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.click();
      await this.page.waitForTimeout(500);
      console.log(`    ✓ Deselect all clicked`);
      return true;
    }

    return false;
  }

  // ==================== Action Banner (after selection) ====================

  /**
   * Action banner that appears after selecting employees
   * XPath: //*[contains(@class, 'ApproveTimeAction')]
   */
  get actionBanner(): Locator {
    return this.page.locator(`//*[contains(@class, 'ApproveTimeAction')]`);
  }

  /**
   * Approve button on action banner
   * XPath: //*[contains(@class, 'ApproveTimeAction')] / *[text()='Approve']
   */
  get actionBannerApproveButton(): Locator {
    return this.page.locator(
      `//*[contains(@class, 'ApproveTimeAction')]/*[text()='Approve']`,
    );
  }

  /**
   * Close button on action banner (X button)
   * XPath: //*[contains(@class, 'ApproveTimeAction')]//button[@aria-label='Close']
   */
  get actionBannerCloseButton(): Locator {
    return this.page.locator(
      `//*[contains(@class, 'ApproveTimeAction')]//button[@aria-label='Close']`,
    );
  }

  /**
   * Get items selected text (e.g., "1 items selected", "2 items selected")
   * Within the action banner
   */
  getItemsSelectedText(count: number): Locator {
    return this.page.locator(
      `//*[contains(@class, 'ApproveTimeAction')]//*[contains(text(), '${count} items selected')]`,
    );
  }

  async isActionBannerVisible(): Promise<boolean> {
    // Check for Approve button on banner since that's the confirmed working locator
    return await this.actionBannerApproveButton.isVisible().catch(() => false);
  }

  async validateItemsSelectedCount(expectedCount: number): Promise<boolean> {
    const text = this.getItemsSelectedText(expectedCount);
    const isVisible = await text.isVisible().catch(() => false);
    console.log(
      `    Items selected text "${expectedCount} items selected" visible: ${isVisible}`,
    );
    return isVisible;
  }

  async clickActionBannerApprove(): Promise<void> {
    console.log(`  Clicking Approve on action banner`);
    await this.actionBannerApproveButton.click();
    await this.page.waitForTimeout(500);
  }

  async closeActionBanner(): Promise<boolean> {
    console.log(`  Closing action banner`);
    const closeBtn = this.actionBannerCloseButton;

    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await this.page.waitForTimeout(500);

      // Validate banner is hidden
      const isHidden = !(await this.isActionBannerVisible());
      console.log(`    ✓ Action banner closed: ${isHidden}`);
      return isHidden;
    }

    return false;
  }

  // ==================== Approve/Unapprove Actions ====================

  getApproveButton(employeeName: string): Locator {
    return this.getRowByEmployeeName(employeeName).getByRole('button', {
      name: 'Approve',
    });
  }

  getUnapproveButton(employeeName: string): Locator {
    return this.getRowByEmployeeName(employeeName).getByRole('button', {
      name: 'Unapprove',
    });
  }

  getActionDropdown(employeeName: string): Locator {
    // Use the Expand Menu button in the employee row
    return this.getRowByEmployeeName(employeeName)
      .locator('[aria-label="Expand Menu"]')
      .or(
        this.getRowByEmployeeName(employeeName).locator(
          'button[aria-haspopup="true"]',
        ),
      );
  }

  /**
   * Get the "Expand Menu" dropdown button for an employee row
   * XPath: (//*[@aria-label="Expand Menu"])[1] - for first row
   */
  getExpandMenuButton(employeeName: string): Locator {
    return this.getRowByEmployeeName(employeeName).locator(
      '/*[aria-label="Expand Menu"]',
    );
  }

  async clickActionDropdown(employeeName: string) {
    console.log(`  Clicking action dropdown for: ${employeeName}`);
    const expandMenu = this.getExpandMenuButton(employeeName);

    if (await expandMenu.isVisible({ timeout: 15000 }).catch(() => false)) {
      await expandMenu.click();
      await this.page.waitForTimeout(500);
      return;
    }

    const globalExpandMenus = this.page.locator('[aria-label="Expand Menu"]');
    const n = await globalExpandMenus.count();
    if (n === 0) {
      console.log(
        `  No Expand Menu on page — Approvals may be empty (employee: ${employeeName})`,
      );
      return;
    }

    const firstMenu = globalExpandMenus.first();
    if (await firstMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstMenu.click();
    } else {
      console.log(
        `  Expand Menu exists but not visible — skipping (employee: ${employeeName})`,
      );
    }
    await this.page.waitForTimeout(500);
  }

  async approveEmployee(employeeName: string): Promise<boolean> {
    console.log(`Approving time for: ${employeeName}`);

    // Wait for row to be visible
    const row = this.getRowByEmployeeName(employeeName);
    await row.waitFor({ state: 'visible' });

    // Wait for and click Approve button
    const approveBtn = this.getApproveButton(employeeName);
    await approveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await approveBtn.click();
    console.log('  ✓ Clicked Approve button');

    // Handle "Lock time" confirmation dialog (includes 2s wait for dialog to appear)
    await this.handleLockTimeDialog();
    await this.waitForLoadingToDisappear();
    // Extra wait for UI to update after approval
    await this.page.waitForTimeout(2000);

    // Validate approval was successful - wait for Unapprove option to appear
    const isApproved = await this.waitForApprovalStatus(
      employeeName,
      'approved',
    );
    if (isApproved) {
      console.log('  ✓ Approval validated - entry is now approved');
    } else {
      console.log('  ⚠ Could not validate approval status');
    }

    return isApproved;
  }

  async unapproveEmployee(employeeName: string): Promise<boolean> {
    console.log(`Unapproving time for: ${employeeName}`);

    // Wait for row to be visible
    const row = this.getRowByEmployeeName(employeeName);
    await row.waitFor({ state: 'visible' });

    // Check if already unapproved (Approve button is visible instead of Unapprove)
    const approveBtn = row.getByRole('button', { name: /^approve$/i });
    if (await approveBtn.isVisible().catch(() => false)) {
      console.log(
        `  ✓ Time is already unapproved for ${employeeName} (Approve button visible)`,
      );
      return true;
    }

    // Method 1: Try direct Unapprove button first
    const directUnapproveBtn = row.getByRole('button', {
      name: /^unapprove$/i,
    });
    if (await directUnapproveBtn.isVisible().catch(() => false)) {
      console.log('  Found direct Unapprove button');
      await directUnapproveBtn.click();
      console.log('  ✓ Clicked Unapprove button');
    } else {
      // Method 2: Click dropdown arrow to find Unapprove option
      console.log('  Looking for Unapprove in dropdown...');

      // Find Expand Menu button in the row
      const expandMenu = row
        .locator('[aria-label="Expand Menu"]')
        .or(row.locator('button[aria-haspopup="true"]'));

      if (await expandMenu.isVisible().catch(() => false)) {
        await expandMenu.click();
        await this.page.waitForTimeout(500);

        // Check if unlock dialog appeared immediately (some flows skip menuitem)
        const dialogAppeared = await this.page
          .getByRole('button', { name: 'Unapprove and unlock time' })
          .isVisible()
          .catch(() => false);

        if (!dialogAppeared) {
          // Wait for and click Unapprove from menu
          const unapproveMenuItem = this.page
            .locator(`//*[text()='Unapprove']`)
            .or(this.page.getByRole('menuitem', { name: /unapprove/i }));
          const menuVisible = await unapproveMenuItem
            .isVisible({ timeout: 3000 })
            .catch(() => false);
          if (menuVisible) {
            await unapproveMenuItem.click();
            console.log('  ✓ Clicked Unapprove from dropdown');
          }
        }
      } else {
        // Method 3: Try clicking any button with dropdown in action column
        const actionBtn = row.locator('td').last().locator('button').first();
        await actionBtn.click();
        await this.page.waitForTimeout(500);

        // Check if dialog appeared
        const dialogAppeared = await this.page
          .getByRole('button', { name: 'Unapprove and unlock time' })
          .isVisible()
          .catch(() => false);

        if (!dialogAppeared) {
          const menuItem = this.page.getByRole('menuitem', {
            name: /unapprove/i,
          });
          if (await menuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
            await menuItem.click();
            console.log('  ✓ Clicked Unapprove from action column');
          }
        }
      }
    }

    // Handle any confirmation dialog for unapprove
    await this.handleUnlockTimeDialog();
    await this.waitForLoadingToDisappear();

    // Validate unapproval was successful - wait for Approve button to appear
    const isUnapproved = await this.waitForApprovalStatus(
      employeeName,
      'unapproved',
    );
    if (isUnapproved) {
      console.log('  ✓ Unapproval validated - entry is now unapproved');
    } else {
      console.log('  ⚠ Could not validate unapproval status');
    }

    return isUnapproved;
  }

  /**
   * Best-effort unapprove for all visible employees in the Approvals table.
   * Handles leftover entries irrespective of employee name.
   */
  async unapproveAllVisibleEmployees(maxEmployees = 25): Promise<number> {
    let unapproved = 0;

    // Ensure we are on a state with rows.
    await this.waitForLoadingToDisappear(60_000);
    await this.approvalsTable.waitFor({ state: 'visible', timeout: 60_000 });
    // Let rows hydrate (prod can be slow).
    await this.page.waitForTimeout(1500);

    const rows = this.allTableRows;
    const rowCount = Math.min(await rows.count(), maxEmployees);
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const hasApproveOrUnapprove = await row
        .getByRole('button', { name: /approve|unapprove/i })
        .first()
        .isVisible({ timeout: 500 })
        .catch(() => false);
      if (!hasApproveOrUnapprove) continue;

      // If already unapproved, don't try to unapprove again.
      const approveVisible = await row
        .getByRole('button', { name: /^approve$/i })
        .isVisible({ timeout: 500 })
        .catch(() => false);
      if (approveVisible) {
        continue;
      }

      // Extract a stable employee label from the row text.
      const rowText = ((await row.textContent()) || '').trim();
      const match = rowText.match(/[A-Za-z][^,\n]*,\s*[A-Za-z][^\n]*/);
      const employeeName = (match?.[0] || '').trim();
      if (!employeeName) continue;

      const ok = await this.unapproveEmployee(employeeName).catch(() => false);
      if (ok) {
        unapproved++;
      }

      // Let UI update before processing next row.
      await this.waitForLoadingToDisappear(60_000);
      await this.page.waitForTimeout(1000);
    }

    return unapproved;
  }

  /**
   * Wait for and validate approval status change
   */
  async waitForApprovalStatus(
    employeeName: string,
    expectedStatus: 'approved' | 'unapproved',
  ): Promise<boolean> {
    const row = this.getRowByEmployeeName(employeeName);
    const maxAttempts = 10;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.page.waitForTimeout(1500);

      if (expectedStatus === 'approved') {
        // After approval, wait for "Unapprove" button to appear
        const unapproveBtn = row.getByRole('button', { name: 'Unapprove' });
        const isUnapproveBtnVisible = await unapproveBtn
          .isVisible()
          .catch(() => false);

        console.log(
          `    Attempt ${attempt}/${maxAttempts}: Unapprove button visible: ${isUnapproveBtnVisible}`,
        );

        if (isUnapproveBtnVisible) {
          return true;
        }
      } else {
        // After unapproval, wait for "Approve" button to appear
        const approveBtn = row.getByRole('button', { name: 'Approve' });
        const isApproveBtnVisible = await approveBtn
          .isVisible()
          .catch(() => false);

        console.log(
          `    Attempt ${attempt}/${maxAttempts}: Approve button visible: ${isApproveBtnVisible}`,
        );

        if (isApproveBtnVisible) {
          return true;
        }
      }
    }

    return false;
  }

  // ==================== Bulk Actions ====================

  get bulkApproveButton(): Locator {
    return this.page.locator(
      `//div[contains(@class,"ApproveTimeButton")]//span[text()="Approve"]`,
    );
  }

  get bulkUnapproveButton(): Locator {
    return this.page.locator(
      `//div[contains(@class,"UnapproveTimeButton")]//span[text()="Unapprove"]`,
    );
  }

  async bulkApprove() {
    console.log('Performing bulk approve...');
    await this.page.waitForTimeout(3000);
    await this.bulkApproveButton.click();

    // Handle "Lock time" confirmation dialog
    await this.handleLockTimeDialog();
    await this.waitForLoadingToDisappear();
  }

  async bulkUnapprove() {
    console.log('Performing bulk unapprove...');
    await this.bulkUnapproveButton.click();

    // Handle any confirmation dialog for unapprove
    await this.handleUnlockTimeDialog();
    await this.waitForLoadingToDisappear();
  }

  // ==================== Validation Helpers ====================

  async validateEmployeeVisible(employeeName: string) {
    await expect(this.getRowByEmployeeName(employeeName)).toBeVisible();
  }

  async validateEmployeeNotVisible(employeeName: string) {
    await expect(this.getRowByEmployeeName(employeeName)).not.toBeVisible();
  }

  async validateApproveButtonVisible(employeeName: string) {
    await expect(this.getApproveButton(employeeName)).toBeVisible();
  }

  async validateEmployeeApproved(employeeName: string) {
    // After approval, the button text may change or show "Approved" status
    const row = this.getRowByEmployeeName(employeeName);
    const approvedIndicator = row
      .getByText('Approved')
      .or(row.locator('button:has-text("Unapprove")'));
    await expect(approvedIndicator).toBeVisible();
  }

  async validateTotalHours(employeeName: string, expectedTotal: string) {
    const total = await this.getEmployeeTotal(employeeName);
    expect(total.trim()).toContain(expectedTotal);
  }

  // ==================== Toast/Success Messages ====================

  get successToast(): Locator {
    return this.page
      .locator('[role="alert"]')
      .or(this.page.getByText(/approved|saved|created/i));
  }

  async waitForSuccessToast() {
    await this.successToast.first().waitFor({ state: 'visible' });
  }

  // ==================== All Hours Summary ====================

  get allHoursRow(): Locator {
    return this.page.locator('//tr[contains(., "All hours")]');
  }

  async getAllHoursTotal(): Promise<string> {
    const totalCell = this.allHoursRow.locator('td').nth(1);
    return (await totalCell.textContent()) || '';
  }

  // ==================== Handle Popups/Dialogs ====================

  async handlePopupsIfAny() {
    try {
      const gotItButton = this.page.getByRole('button', { name: 'Got it' });
      if (await gotItButton.isVisible().catch(() => false)) {
        await gotItButton.click();
      }
    } catch {
      // No popup present
    }
  }

  /**
   * Handle "Lock time through X?" confirmation dialog when approving
   * Dialog has "Go Back" and "Approve and lock time" buttons
   */
  async handleLockTimeDialog() {
    try {
      // Wait a moment for dialog to potentially appear
      await this.page.waitForTimeout(2000);

      const lockTimeDialog = this.page.getByText(/Lock time through/i);
      const isDialogVisible = await lockTimeDialog
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (isDialogVisible) {
        console.log('  Handling Lock time confirmation dialog...');
        const approveAndLockBtn = this.page.getByRole('button', {
          name: 'Approve and lock time',
        });
        await approveAndLockBtn.waitFor({ state: 'visible', timeout: 5000 });
        await approveAndLockBtn.click();
        await this.page.waitForTimeout(1000);
        console.log('  ✓ Clicked "Approve and lock time"');
      } else {
        console.log('  No Lock time dialog appeared');
      }
    } catch (e) {
      console.log(`  Lock time dialog handling: ${e}`);
    }
  }

  /**
   * Handle "Unlock time through X?" confirmation dialog when unapproving
   * Dialog has "Go Back" and "Unapprove and unlock time" buttons
   */
  async handleUnlockTimeDialog() {
    try {
      // Wait a moment for dialog to appear
      await this.page.waitForTimeout(1000);

      // Look for the "Unapprove and unlock time" button with multiple strategies
      const unapproveAndUnlockBtn = this.page
        .getByRole('button', { name: 'Unapprove and unlock time' })
        .or(this.page.getByRole('button', { name: /unapprove and unlock/i }))
        .or(this.page.locator('button:has-text("Unapprove and unlock time")'));

      // Wait for button to be visible with timeout
      const isVisible = await unapproveAndUnlockBtn
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (isVisible) {
        console.log('  Handling Unlock time confirmation dialog...');
        await unapproveAndUnlockBtn.first().click();
        await this.page.waitForTimeout(500);
        console.log('  ✓ Clicked "Unapprove and unlock time"');
      }
    } catch {
      // No dialog present, proceed
    }
  }

  async waitForPageReady(): Promise<void> {
    try {
      // Options 1 & 2 — shell ready
      await Promise.race([
        // Option 1: spinner appears then disappears
        this.loadingSpinner
          .waitFor({ state: 'visible', timeout: 2000 })
          .then(() =>
            this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }),
          ),
        // Option 2: key page-shell elements all visible
        Promise.all([
          this.addTimeButton.waitFor({ state: 'visible', timeout: 10000 }),
          this.teamMemberSearch.waitFor({ state: 'visible', timeout: 10000 }),
          this.dateRangeDropdown.waitFor({ state: 'visible', timeout: 10000 }),
        ]),
      ]);

      // Option 3: data or empty-state content rendered
      await Promise.race([
        this.approvalsTable.waitFor({ state: 'visible', timeout: 10000 }),
        this.page
          .locator(
            `//*[text()='No time for this date range' or text()='No time entries yet']`,
          )
          .waitFor({ state: 'visible', timeout: 10000 }),
      ]);

      // Small buffer for any immediate popups to appear before assertions run
      await this.page.waitForTimeout(500);
    } catch {
      // If specific elements are not found, fall back to a shorter static wait
      await this.page.waitForTimeout(2000);
    }
  }

  get unapproveTimeButton(): Locator {
    return this.page.getByRole('button', { name: 'Unapprove' });
  }

  async clickUnapproveTimeButton() {
    await this.unapproveTimeButton.click();
  }
}

export default ApprovalsPage;
