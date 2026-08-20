import { expect, Locator, Page } from '@playwright/test';
import gotoWithAuthSession from '../gotoWithAuthSession';

export default class AssignmentsPage {
  private readonly page: Page;
  private readonly baseUrl = '/app/time/assignments?jobId=time';
  /** QBO **Customer hub** list (replaces All apps → Customer hub → Customers). */
  private readonly customersListUrl = '/app/customers?jobId=customers';

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    const url = this.baseUrl;
    await gotoWithAuthSession(this.page, url, { waitUntil: 'load' });
    await this.page.waitForLoadState('load');
    // Always click Customers tab first to ensure consistent state
    // (page might remember last visited tab which could be Workers)
    await this.page.waitForTimeout(10000);
    await this.clickCustomersTab();
    await this.waitForCustomerTable();
  }

  /**
   * Navigates to the Workers list, preferring fast paths so we don't pay for a
   * full page reload + Customers-tab reset when we're already inside Assignments:
   *   1. Already on the workers list (a "View settings" link is shown) → no-op.
   *   2. On a worker-settings detail page → use the Assignments breadcrumb to
   *      return to the list (skips the reload + Customers-tab detour).
   *   3. Otherwise → full navigation from scratch.
   * Always ensures the Workers tab + workers toggle are active before returning.
   */
  async gotoWorkersList(): Promise<void> {
    const viewSettings = this.page
      .locator(`//*[text()='View settings']`)
      .first();

    // Fast path 1 — already on the workers list.
    if (await viewSettings.isVisible({ timeout: 2000 }).catch(() => false)) {
      return;
    }

    // Fast path 2 — on a worker-settings detail page: click the "Assignments"
    // breadcrumb to return to the workers list instead of reloading the whole
    // app (which would force the Customers-tab → Workers-tab detour). The crumb
    // is a clickable text node inside the breadcrumbs nav (not a link/button
    // role), so match several ways and force the click.
    const breadcrumbNav = this.page.getByRole('navigation', {
      name: /breadcrumb/i,
    });
    const breadcrumb = breadcrumbNav
      .getByText('Assignments', { exact: true })
      .or(breadcrumbNav.getByRole('link', { name: /^Assignments$/ }))
      .or(breadcrumbNav.getByRole('button', { name: /^Assignments$/ }))
      .or(this.page.locator('//nav//*[normalize-space(text())="Assignments"]'))
      .first();
    if (await breadcrumb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await breadcrumb.scrollIntoViewIfNeeded().catch(() => {});
      await breadcrumb.click({ force: true });
      // The assignments page remembers the last tab (Workers, since we came from
      // a worker), so the list usually appears with no tab switch. Only fall back
      // to the tab/toggle clicks if the workers list didn't render.
      if (await viewSettings.isVisible({ timeout: 8000 }).catch(() => false)) {
        return;
      }
      await this.clickWorkersTab();
      await this.clickWorkersToggle();
      return;
    }

    // Slow path — full navigation from scratch.
    await this.goto();
    await this.clickWorkersTab();
    await this.clickWorkersToggle();
  }

  async waitForCustomerTable(): Promise<void> {
    const loader = this.page
      .locator('[data-testid="customer-assignments-loading"]')
      .first();
    if (await loader.isVisible().catch(() => false)) {
      await loader.waitFor({ state: 'hidden', timeout: 30_000 });
    }

    // Check for either Customer table OR "Manage time tracking fields" button
    // (Workers tab won't have customer table but will have the button)
    await expect(
      this.page.locator('table[summary="Customer assignment table"]'),
    ).toBeVisible();
  }

  private actionMenuButtons(): Locator {
    return this.page.locator('//span[text()="Time tracking fields"]');
  }
  async openActionMenu(customerName?: string): Promise<Locator> {
    if (customerName) {
      const row = this.page
        .locator(`//button[@aria-haspopup="menu"]`)
        .first()
        .click();
      // //await expect(row).toBeVisible();
      // const actionButton = row.locator('//span[text()="Assign time tracking fields"]');
      // await actionButton.click();
      // return actionButton;
      await this.page
        .locator(`//span[text()="Assign time tracking fields"]`)
        .click();
    }
    //await this.page.locator(`//span[text()="Assign time tracking fields"]`).click();

    const firstButton = this.actionMenuButtons().first();
    await expect(firstButton).toBeVisible();
    await firstButton.click();
    return firstButton;
  }

  //    CancelAndSaveButton = async (
  //   page: Page,
  // ) => {
  //   await page
  //     .locator(
  //       `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
  //     )
  //     .click();
  //   await page
  //     .locator(`//div[@data-testid="ModalDialog"]//span[text()='Save']`)
  //     .click();
  // };

  CancelButton(): Locator {
    return this.page.locator(
      `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
    );
    // return this.page
    //   .locator(`//div[@data-testid="ModalDialog"]//span[text()='Save']`)
    //   .click();
  }
  Button(): Locator {
    return this.page.locator(
      `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
    );
    // return this.page
    //   .locator(`//div[@data-testid="ModalDialog"]//span[text()='Save']`)
    //   .click();
  }

  async selectAction(optionLabel: string): Promise<void> {
    const option = this.page.getByRole('menuitem', { name: optionLabel });
    await option.click();
  }

  async selectAssignWorkers(): Promise<void> {
    await this.page
      .locator(`//button[text()="Assign Workers"]`)
      .first()
      .click();
  }

  async selectAssignFields(): Promise<void> {
    await this.selectAction('Assign time tracking fields');
  }

  async selectEditCustomer(): Promise<void> {
    await this.selectAction('Edit');
  }

  assignmentDrawerTitle(title: string): Locator {
    return this.page.getByRole('heading', { name: title, exact: false });
  }
  async expectDrawerVisible(title: string): Promise<void> {
    await expect(this.assignmentDrawerTitle(title)).toBeVisible();
  }
  drawerItemCheckboxes(): Locator {
    return this.page.locator(
      'input[type="checkbox"][aria-label^="Select "]:not([aria-label="Select all workers"])',
    );
  }

  drawerSelectAllCheckbox(): Locator {
    return this.page.locator(
      'input[type="checkbox"][aria-label="Select all workers"]',
    );
  }

  drawerSearchInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Search' });
  }

  drawerSaveButton(): Locator {
    return this.page.getByRole('button', { name: /^Save$/ });
  }

  drawerCancelButton(): Locator {
    return this.page.getByRole('button', { name: /^Cancel$/ });
  }

  drawerCloseButton(): Locator {
    return this.page.getByRole('button', { name: 'Close' }).last();
  }

  async saveDrawerChanges(): Promise<void> {
    await this.drawerSaveButton().click();
  }

  /** If Save is enabled, persist; otherwise dismiss the drawer via the header close control. */
  async saveDrawerChangesIfEnabledElseClose(): Promise<void> {
    const save = this.drawerSaveButton();
    if (await save.isEnabled().catch(() => false)) {
      await save.click();
    } else {
      await this.page.locator('//button[@aria-label="Close"]').last().click();
    }
  }

  async cancelDrawerChanges(): Promise<void> {
    await this.drawerCloseButton().click();
  }

  /**
   * Cancels drawer changes and clicks "Don't save" on the confirmation popup.
   */
  async cancelAndDontSave(): Promise<void> {
    await this.page
      .getByRole('dialog')
      .getByRole('button', { name: 'Close' })
      .click();
    await this.page.waitForTimeout(500);
    await expect(
      this.page.getByText('Want to save your changes?'),
    ).toBeVisible();
    await this.page.getByRole('button', { name: "Don't save" }).click();
    await this.page.waitForTimeout(500);
  }
  successToast(message?: string): Locator {
    if (message) {
      return this.page.getByText(message, { exact: true });
    }
    return this.page.locator('[data-testid="success-toast"]');
  }

  manageTimeTrackingFieldsButton(): Locator {
    return this.page.getByRole('button', {
      name: 'Manage time tracking fields',
    });
  }

  addCustomerButton(): Locator {
    return this.page.getByRole('button', { name: 'Add customer' });
  }

  async openManageTimeTrackingFields(): Promise<void> {
    await this.manageTimeTrackingFieldsButton().click();
  }

  async openAddCustomerDrawer(): Promise<void> {
    await this.addCustomerButton().click();
  }

  // ==================== Customer Drawer Form Locators ====================

  customerDisplayNameInput(): Locator {
    return this.page.getByTestId('contact-drawer-display-name__textField');
  }

  customerStreetAddressInput(): Locator {
    return this.page.getByTestId('contact-drawer-billingAddress-street-1');
  }

  customerCityInput(): Locator {
    return this.page.getByTestId('contact-drawer-billingAddress-city');
  }

  customerStateInput(): Locator {
    return this.page.getByTestId('contact-drawer-billingAddress-province');
  }

  customerPostalCodeInput(): Locator {
    return this.page.getByTestId('contact-drawer-billingAddress-postal-code');
  }

  customerCountryInput(): Locator {
    return this.page.getByTestId('contact-drawer-billingAddress-country');
  }

  customerDrawerSaveButton(): Locator {
    return this.page.getByTestId('contact-drawer-save-button');
  }

  // ==================== Customer Drawer Form Methods ====================

  async fillCustomerName(name: string): Promise<void> {
    await this.customerDisplayNameInput().fill(name);
  }

  async fillCustomerAddress(address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  }): Promise<void> {
    await this.customerStreetAddressInput().fill(address.street);
    await this.customerCityInput().fill(address.city);
    await this.customerStateInput().fill(address.state);
    await this.customerPostalCodeInput().fill(address.postalCode);
    if (address.country) {
      await this.customerCountryInput().fill(address.country);
    }
  }

  async clearCustomerAddress(): Promise<void> {
    await this.customerStreetAddressInput().clear();
    await this.customerCityInput().clear();
    await this.customerStateInput().clear();
    await this.customerPostalCodeInput().clear();
  }

  async saveCustomerDrawer(): Promise<void> {
    await this.customerDrawerSaveButton().click();
  }

  fieldAssignmentPageMessage(): Locator {
    return this.page.locator('//td[text()="Permission denied!"]');
  }
  teamMemberStatusCell(customerId: string): Locator {
    return this.page.locator(`[data-testid="team-members-${customerId}"]`);
  }

  fieldStatusCell(customerId: string): Locator {
    return this.page.locator(
      `[data-testid="time-tracking-fields-${customerId}"]`,
    );
  }

  // ==================== Workers Tab Methods ====================

  /**
   * Selects a tab (CUSTOMERS or WORKERS) in the Assignments widget.
   */
  async selectTab(tabName: 'CUSTOMERS' | 'WORKERS'): Promise<void> {
    const tabLabel = tabName === 'CUSTOMERS' ? 'Customers' : 'Workers';
    const tab = this.page.getByRole('tab', { name: tabLabel });
    await expect(tab).toBeVisible();
    await tab.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Returns the Workers toggle button locator.
   */
  workersToggleButton(): Locator {
    return this.page.locator(`//div[@aria-label='workers']`);
  }

  /**
   * Returns the Groups toggle button locator.
   */
  groupsToggleButton(): Locator {
    return this.page.locator(`//div[@aria-label='groups']`);
  }

  /**
   * Returns the Add worker dropdown button locator.
   */
  addWorkerButton(): Locator {
    return this.page.getByRole('button', { name: 'Add worker' });
  }

  /**
   * Returns the Create group button locator.
   */
  createGroupButton(): Locator {
    return this.page.locator(`//button[@aria-label='Create group']`);
  }
  /**
   * Returns the Filter by worker type dropdown button locator.
   */
  filterByWorkerTypeDropdown(): Locator {
    return this.page.getByRole('combobox', { name: 'Filter by worker type' });
  }

  filterByWorkerTypeDropdownOptions(): Locator {
    return this.page.locator(`//input[@aria-label='Workers']`);
  }
  /**
   * Returns the Search worker button locator.
   */
  searchWorkerButton(): Locator {
    return this.page.locator(`//button[@aria-label="Search"]`);
  }

  /**
   * Returns the Search groups button locator.
   */
  searchGroupsButton(): Locator {
    return this.page.locator(`//button[@aria-label='Search groups']`);
  }

  /**
   * Returns a column header locator by name.
   */
  columnHeader(headerName: string): Locator {
    return this.page.getByRole('columnheader', { name: headerName });
  }

  /**
   * Verifies that all expected column headers are visible in the Workers table.
   */
  async verifyWorkersTableColumns(): Promise<void> {
    const expectedColumns = ['Workers', 'Type', 'Group', 'Actions'];
    for (const column of expectedColumns) {
      await expect(this.columnHeader(column)).toBeVisible();
    }
  }

  /**
   * Verifies that the Workers and Groups toggle section is visible.
   */
  async verifyWorkersGroupsToggle(): Promise<void> {
    await expect(this.workersToggleButton()).toBeVisible();
    await expect(this.groupsToggleButton()).toBeVisible();
  }

  /**
   * Verifies that action buttons on Workers tab are visible.
   */
  async verifyWorkersTabActionButtons(): Promise<void> {
    await expect(this.manageTimeTrackingFieldsButton()).toBeVisible();
    await expect(this.addWorkerButton()).toBeVisible();
    await expect(this.createGroupButton()).toBeVisible();
    await expect(this.filterByWorkerTypeDropdown()).toBeVisible();
    await expect(this.searchWorkerButton()).toBeVisible();
  }

  /**
   * Verifies that action buttons on Workers tab are visible.
   */
  async verifyGroupsTabActionButtons(): Promise<void> {
    await expect(this.manageTimeTrackingFieldsButton()).toBeVisible();
    await expect(this.addWorkerButton()).toBeVisible();
    await expect(this.createGroupButton()).toBeVisible();
    await expect(this.searchGroupsButton()).toBeVisible();
  }

  /**
   * Verifies all Workers tab elements including table columns and action buttons.
   */
  async verifyWorkersTabElements(): Promise<void> {
    await this.verifyWorkersTableColumns();
    await this.page.waitForTimeout(500);
    await this.verifyWorkersTabActionButtons();
    await this.page.waitForTimeout(500);
  }

  /**
   * Clicks on the Groups toggle button to switch to Groups view.
   */
  async switchToGroupsView(): Promise<void> {
    // The workers/groups toggle only renders once the Workers LIST view content
    // has finished loading. After a breadcrumb navigation back to Assignments the
    // view can lag, so step the waits up explicitly before clicking:
    //   1) the Workers list view itself is seen (its table rows render),
    //   2) the workers/groups toggle control has mounted,
    //   3) the Groups toggle is visible — then switch.
    // Match any tag with aria-label='workers'/'groups' (the toggle is not always
    // a <div>) so a markup change doesn't strand the wait.

    // 1) Wait for the Workers list view to be seen (rows rendered).
    await this.page
      .locator('tbody tr')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 })
      .catch(() => undefined);

    // 2) Wait for the workers/groups toggle control to mount.
    const workersToggle = this.page
      .locator(`//*[@aria-label='workers']`)
      .first();
    await workersToggle
      .waitFor({ state: 'visible', timeout: 30000 })
      .catch(() => undefined);

    // 3) Wait for the Groups toggle, then switch.
    const groupsToggle = this.page.locator(`//*[@aria-label='groups']`).first();
    await groupsToggle.waitFor({ state: 'visible', timeout: 30000 });
    await groupsToggle.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Verifies that all expected column headers are visible in the Groups table.
   */
  async verifyGroupsTableColumns(): Promise<void> {
    // Find the table row containing Groups column headers
    const groupsTableHeaderRow = this.page.locator('tr[role="row"]');

    // Groups column - may have count like "Groups (1)"
    const groupsHeader = groupsTableHeaderRow
      .locator('th[role="columnheader"]')
      .filter({ hasText: /^Groups/ });
    await expect(groupsHeader).toBeVisible();

    // Workers column
    const workersHeader = groupsTableHeaderRow
      .locator('th[role="columnheader"]')
      .filter({ hasText: 'Workers' });
    await expect(workersHeader).toBeVisible();

    // Group leads column
    const groupLeadsHeader = groupsTableHeaderRow
      .locator('th[role="columnheader"]')
      .filter({ hasText: 'Group leads' });
    await expect(groupLeadsHeader).toBeVisible();

    // Actions column
    const actionsHeader = groupsTableHeaderRow
      .locator('th[role="columnheader"]')
      .filter({ hasText: 'Actions' });
    await expect(actionsHeader.last()).toBeVisible();
  }

  /**
   * Verifies all Groups view elements including table columns and action buttons.
   */
  async verifyGroupsTabElements(): Promise<void> {
    await this.verifyGroupsTableColumns();
    await this.verifyGroupsTabActionButtons();
    await this.page.waitForTimeout(500);
    // Verify group exists
    await expect(
      this.page.getByRole('row').filter({ hasText: 'Group 1' }),
    ).toBeVisible();

    // Get count of groups
    const groupCount = await this.page.locator('[role="row"] strong').count();
    expect(groupCount).toBeGreaterThan(0);
    console.log(`Group count: ${groupCount}`);
  }

  // ==================== Create Group Methods ====================

  /**
   * Returns locator for a group row by group name.
   */
  groupRow(groupName: string): Locator {
    return this.page.locator('tr').filter({ hasText: groupName });
  }

  /**
   * Selects items by clicking on checkboxes in the drawer panel.
   * @param itemCount Number of items to select (selects first N items)
   */
  async selectItemsInDrawer(itemCount: number = 1): Promise<void> {
    const checkboxes = this.drawerItemCheckboxes();
    const count = await checkboxes.count();
    const selectCount = Math.min(itemCount, count);
    for (let i = 0; i < selectCount; i++) {
      await checkboxes.nth(i).click();
    }
  }

  /**
   * Selects an item by name in the drawer panel.
   * @param name Name of the item to select
   */
  async selectItemByNameInDrawer(name: string): Promise<void> {
    const checkbox = this.page.locator(
      `[type="checkbox"][aria-label="Select ${name}"]`,
    );
    await expect(checkbox).toBeVisible();
    await checkbox.click();
  }

  /**
   * Verifies all group row details including name with worker count, columns, and view button.
   */
  async verifyGroupRowDetails(
    groupName: string,
    workerCount: number | string,
    leadCount: number | string,
    totalWorkerCount?: number,
  ): Promise<void> {
    const row = this.groupRow(groupName);

    // Verify group name with worker count format (e.g., "Group 1 (2)")
    await expect(
      row.locator(`//td[@role='cell']//strong[text()='${groupName}']`),
    ).toBeVisible();

    // Verify Workers count column (use "None" for 0, "All" when all assigned, otherwise "X of Y" format)
    let expectedWorkerText: string;
    if (workerCount === 0) {
      expectedWorkerText = 'None';
    } else if (
      totalWorkerCount !== undefined &&
      workerCount === totalWorkerCount
    ) {
      expectedWorkerText = 'All';
    } else if (totalWorkerCount !== undefined) {
      expectedWorkerText = `${workerCount} of ${totalWorkerCount}`;
    } else {
      expectedWorkerText = String(workerCount);
    }
    await expect(row.locator('td').nth(1)).toHaveText(expectedWorkerText);

    // Verify Group leads count column
    await expect(row.locator('td').nth(2)).toHaveText(String(leadCount));

    // Verify View button in Actions column
    await expect(row.getByRole('button', { name: 'View' })).toBeVisible();
  }

  /**
   * Returns the total groups count from the Groups column header.
   */
  async getGroupsCount(): Promise<number> {
    const groupsHeader = this.page.getByRole('columnheader', {
      name: /Groups \(\d+\)/,
    });
    const headerText = await groupsHeader.textContent();
    const match = headerText?.match(/Groups \((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Verifies the total group count matches the expected count.
   */
  async verifyGroupsCount(expectedCount: number): Promise<void> {
    const groupsHeader = this.page.getByRole('columnheader', {
      name: `Groups (${expectedCount})`,
    });
    await expect(groupsHeader).toBeVisible();
  }

  /**
   * Creates a group with a worker and lead assigned by name.
   * @param groupName Name of the group to create
   * @param workerName Worker name to assign
   * @param leadName Lead name to assign
   */
  async createGroupWithWorkersAndLeads(
    groupName: string,
    workerName: string,
    leadName: string,
  ): Promise<void> {
    // Open create group dialog
    await this.createGroupButton().first().click();
    await expect(
      this.page.locator(`//strong[text()="Create group"]`),
    ).toBeVisible();

    // Enter group name
    await this.page
      .getByRole('textbox', { name: 'Group name' })
      .fill(groupName);

    // Assign worker by name
    await this.page.getByRole('button', { name: 'Assign workers' }).click();
    await this.selectItemByNameInDrawer(workerName);
    await this.saveDrawerChanges();

    // Assign lead by name
    await this.page.getByRole('button', { name: 'Assign leads' }).click();
    await this.selectItemByNameInDrawer(leadName);
    await this.saveDrawerChanges();

    // Submit to create the group
    await this.page
      .getByRole('button', { name: 'Create group' })
      .last()
      .click();
    await this.page.waitForTimeout(1000);
  }

  async verifyWorkersInTable(workerNames: string[]): Promise<void> {
    for (const name of workerNames) {
      await expect(
        this.page.locator(
          `//div[contains(@class, 'WorkerName') and text()='${name}']`,
        ),
      ).toBeVisible();
    }
  }

  /**
   * Verifies workers in the table with their types (Employee, Group lead, etc.)
   * @param workers Array of objects with workerName and workerType
   */
  async verifyWorkersWithType(
    workers: { workerName: string; workerType: string }[],
  ): Promise<void> {
    for (const worker of workers) {
      // Find the cell containing both worker name and worker type
      const workerCell = this.page.locator(
        `//td[.//div[contains(@class, 'WorkerName') and text()='${worker.workerName}'] and .//div[contains(@class, 'WorkerTypeText') and text()='${worker.workerType}']]`,
      );
      await expect(workerCell).toBeVisible();
      console.log(
        `✓ Verified worker "${worker.workerName}" with type "${worker.workerType}"`,
      );
    }
  }

  async verifyWorkersRoleType(
    workers: { workerName: string; workerType: string }[],
  ): Promise<void> {
    for (const worker of workers) {
      // Find the cell containing both worker name and worker type
      const workerCell = this.page.locator(
        `//td[.//div[contains(@class, 'WorkerName') and text()='${worker.workerName}'] and .//div[contains(@class, 'WorkerRoleText') and text()='${worker.workerType}']]`,
      );
      await expect(workerCell).toBeVisible();
      console.log(
        `✓ Verified worker "${worker.workerName}" with type "${worker.workerType}"`,
      );
    }
  }

  /**
   * Returns the count of worker rows displayed in the table.
   */
  async getWorkerRowsCount(): Promise<number> {
    return await this.page.locator('tbody tr').count();
  }

  /**
   * Verifies the worker rows count matches the expected count.
   * @param expectedCount Expected number of worker rows
   */
  async verifyWorkerRowsCount(expectedCount: number): Promise<void> {
    const actualCount = await this.getWorkerRowsCount();
    expect(actualCount).toBe(expectedCount);
    console.log(`✓ Verified worker rows count: ${actualCount}`);
  }

  /**
   * Gets the workers count from the "X of Y workers" badge.
   * Returns { assigned: number, total: number }
   */
  async getWorkersCountFromBadge(): Promise<{
    assigned: number;
    total: number;
  }> {
    const badge = this.page.locator(
      '//span[contains(text(), "of") and contains(text(), "workers")]',
    );
    const badgeText = await badge.textContent();
    const match = badgeText?.match(/(\d+)\s+of\s+(\d+)\s+workers/);
    return {
      assigned: match ? parseInt(match[1], 10) : 0,
      total: match ? parseInt(match[2], 10) : 0,
    };
  }

  /**
   * Verifies that worker rows count matches the badge assigned count.
   * Compares table row count with "X of Y workers" badge where X is the assigned count.
   */
  async verifyWorkerRowsMatchBadgeCount(): Promise<void> {
    const workerRowsCount = await this.getWorkerRowsCount();
    const badgeCounts = await this.getWorkersCountFromBadge();
    expect(workerRowsCount).toBe(badgeCounts.assigned);
    console.log(
      `✓ Worker rows (${workerRowsCount}) matches badge assigned count (${badgeCounts.assigned})`,
    );
  }

  async enterCompanyName(companyName: string): Promise<void> {
    const companyNameInput = this.page
      .getByLabel('Company name', { exact: true })
      .or(this.page.getByRole('textbox', { name: /company name/i }));
    await companyNameInput.fill(companyName);
  }
  errorMessage(expectedMessage?: string): Locator {
    if (expectedMessage) {
      return this.page.getByText(expectedMessage, { exact: false });
    }
    return this.page
      .locator('[role="alert"]')
      .or(this.page.locator('[data-testid*="error"]'));
  }

  async expectErrorMessageVisible(message?: string): Promise<void> {
    await expect(this.errorMessage(message)).toBeVisible({ timeout: 10000 });
  }

  customerRow(companyName: string): Locator {
    return this.page
      .locator('table[summary="Customer assignment table"] tbody tr')
      .filter({ hasText: companyName })
      .first();
  }

  async expectCustomerInTable(companyName: string): Promise<void> {
    await expect(this.customerRow(companyName)).toBeVisible();
  }

  /**
   * **Customers** list (`/app/customers?jobId=customers`), then the row’s menu → **Make inactive** → **Yes, make inactive**.
   */
  async deleteCustomer(companyName: string): Promise<void> {
    const { page } = this;
    const url = this.customersListUrl;
    await gotoWithAuthSession(page, url, {
      waitUntil: 'load',
    });
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    const dataRow = page
      .getByRole('row')
      .filter({ hasText: companyName })
      .first();
    await expect(dataRow).toBeVisible({ timeout: 30_000 });
    // The customers list can be long — scroll the row into view before opening
    // its action menu.
    await dataRow
      .scrollIntoViewIfNeeded({ timeout: 5000 })
      .catch(() => undefined);

    const rowMenu = dataRow
      .getByRole('button', {
        name: /action|row actions|open menu|more|expand menu/i,
      })
      .or(
        dataRow.locator(
          'button[aria-haspopup="menu"], button[aria-haspopup="true"]',
        ),
      )
      .or(dataRow.getByText(/^Actions$/i).first());
    await expect(rowMenu.first()).toBeVisible({ timeout: 20_000 });

    const makeInactive = page
      .getByRole('menuitem', { name: /make inactive/i })
      .or(page.getByRole('button', { name: /make inactive/i }))
      .or(page.locator('//li//span[text()="Make inactive"]'))
      .or(page.locator('//*[normalize-space(text())="Make inactive"]'));

    // Opening the row menu can be flaky — a single click sometimes toggles the
    // menu open then closed, leaving "Make inactive" unreachable. Retry the
    // open → wait-for-item sequence a few times before failing.
    let menuOpened = false;
    for (let attempt = 1; attempt <= 3 && !menuOpened; attempt++) {
      await rowMenu.first().click();
      await page.waitForTimeout(1000);
      try {
        await makeInactive
          .first()
          .scrollIntoViewIfNeeded({ timeout: 3000 })
          .catch(() => undefined);
        await expect(makeInactive.first()).toBeVisible({ timeout: 5000 });
        menuOpened = true;
      } catch {
        console.warn(
          `[deleteCustomer] "Make inactive" not visible (attempt ${attempt}/3) — re-opening row menu`,
        );
        // Dismiss any stray overlay before re-opening.
        await page.keyboard.press('Escape').catch(() => undefined);
        await page.waitForTimeout(500);
      }
    }
    await expect(makeInactive.first()).toBeVisible({ timeout: 15_000 });
    await this.clickThroughOverlay(makeInactive.first(), 'Make inactive');
    await page.waitForTimeout(5000);

    const confirmDialog = page.getByRole('dialog').last();
    const confirm = confirmDialog
      .getByRole('button', { name: /yes,?\s*make inactive/i })
      .or(confirmDialog.getByRole('button', { name: /^Yes$/i }).first());
    await expect(confirm).toBeVisible({ timeout: 20_000 });
    await this.clickThroughOverlay(confirm, 'Yes, make inactive');
    await page.waitForLoadState('load');
    await page.waitForTimeout(5000);
  }

  /**
   * Click a target that may be covered by a transient loading/overlay mask, or
   * be a dropdown menu item positioned off-screen. Escalates ONLY on failure, so
   * accounts where the normal click already works (e.g. Elite/IES) are unchanged:
   *   1. normal click (returns immediately on success — the common path),
   *   2. scroll into view + forced click (bypasses overlay interception),
   *   3. dispatchEvent('click') — fires the DOM click directly, with NO viewport
   *      or actionability requirement (a forced click still fails with "Element
   *      is outside of the viewport" when the menu item renders off-screen).
   * Transient-resilience helper — NOT a defect masker: the caller has already
   * asserted the target exists; we're only getting past a passing overlay/layout.
   */
  private async clickThroughOverlay(
    locator: Locator,
    label: string,
  ): Promise<void> {
    try {
      await locator.click({ timeout: 10_000 });
      return;
    } catch {
      console.warn(
        `[AssignmentsPage] "${label}" click intercepted/blocked — settling, then retrying with force + DOM-click fallback.`,
      );
    }
    await this.page.waitForTimeout(1500);
    await locator
      .scrollIntoViewIfNeeded({ timeout: 5000 })
      .catch(() => undefined);
    try {
      await locator.click({ force: true, timeout: 10_000 });
    } catch {
      // Last resort: the element is present but off-screen (a forced click can't
      // reach it). Dispatch the click directly on the DOM node.
      await locator.dispatchEvent('click');
    }
  }

  /** Asserts no **Customer assignment** table row includes `companyName` (e.g. after inactivation). */
  async expectCustomerNotInTable(companyName: string): Promise<void> {
    const rows = this.page
      .locator('table[summary="Customer assignment table"] tbody tr')
      .filter({ hasText: companyName });
    await expect(rows).toHaveCount(0, { timeout: 30_000 });
  }

  async selectMultipleItemsInDrawer(count: number): Promise<void> {
    const checkboxes = this.drawerItemCheckboxes();
    const totalCheckboxes = await checkboxes.count();
    const itemsToSelect = Math.min(count, totalCheckboxes);

    for (let i = 0; i < itemsToSelect; i++) {
      const checkbox = checkboxes.nth(i);
      if (!(await checkbox.isChecked().catch(() => false))) {
        await checkbox.check();
      }
    }
  }
  customerNameCell(companyName: string): Locator {
    return this.customerRow(companyName).locator('td').first();
  }

  // ==================== Worker View Settings Methods (ASM055-060) ====================

  /**
   * Clicks on the Workers tab in Assignments.
   */
  async clickWorkersTab(): Promise<void> {
    await this.page.waitForTimeout(5000);
    // IES shows an onboarding coachmark over the tabs on first load — clear it
    // before clicking so the click is not intercepted. No-op for elite/QBO.
    await this.dismissCoachmarks();
    const workersTab = this.page.locator(
      `//*[@role="tablist"]//*[text()='Workers']`,
    );
    await this.page.waitForTimeout(4000);
    await expect(workersTab).toBeVisible({ timeout: 10000 });
    await workersTab.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clicks on Workers toggle to show individual workers.
   */
  async clickWorkersToggle(): Promise<void> {
    const workersToggle = this.page.locator(`//*[@aria-label="workers"]`);
    await expect(workersToggle).toBeVisible({ timeout: 5000 });
    await workersToggle.click();
  }

  /**
   * Clicks on Groups toggle to show groups.
   */
  async clickGroupsToggle(): Promise<void> {
    const groupsToggle = this.page.locator(`//*[@aria-label="groups"]`);
    await expect(groupsToggle).toBeVisible({ timeout: 5000 });
    await groupsToggle.click();
  }

  async clickWorkerToggle(): Promise<void> {
    const groupsToggle = this.page.locator(`//*[@aria-label="workers"]`);
    await expect(groupsToggle).toBeVisible({ timeout: 5000 });
    await groupsToggle.click();
  }

  /**
   * Gets the first worker name from the table.
   */
  async getFirstWorkerName(): Promise<string> {
    const workerRows = this.page.locator('tbody tr');
    await expect(workerRows.first()).toBeVisible({ timeout: 5000 });

    // Try to get just the name without subtitle
    const workerNameElement = workerRows
      .first()
      .locator('td')
      .first()
      .locator('div, span, p')
      .first();
    let workerName = '';

    if (
      await workerNameElement.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      workerName = (await workerNameElement.textContent())?.trim() || '';
    }

    // Fallback: split by common role names
    if (
      !workerName ||
      workerName.includes('Group lead') ||
      workerName.includes('Employee')
    ) {
      const fullText =
        (
          await workerRows.first().locator('td').first().textContent()
        )?.trim() || '';
      workerName = fullText
        .split('Group lead')[0]
        .split('Employee')[0]
        .split('Manager')[0]
        .trim();
    }

    return workerName;
  }

  /**
   * Returns the name of the first worker in the table whose name differs from
   * `excludeName` (used to validate a SECOND worker still shows company-level
   * defaults, unaffected by edits made to the first worker). Returns '' when no
   * other worker exists.
   */
  async getWorkerNameOtherThan(excludeName: string): Promise<string> {
    const workerRows = this.page.locator('tbody tr');
    if (
      !(await workerRows
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false))
    ) {
      return '';
    }

    const count = await workerRows.count();
    for (let i = 0; i < count; i += 1) {
      const fullText =
        (await workerRows.nth(i).locator('td').first().textContent())?.trim() ||
        '';
      // Strip any trailing role label so we compare just the worker name.
      const workerName = fullText
        .split('Group lead')[0]
        .split('Employee')[0]
        .split('Manager')[0]
        .trim();
      if (workerName && workerName !== excludeName) {
        return workerName;
      }
    }
    return '';
  }

  /**
   * Returns the name of the first worker flagged "Group lead" in the workers
   * table (the role appears as a subtitle under the worker name). Returns '' when
   * no group-lead worker is present.
   */
  async getGroupLeadWorkerName(): Promise<string> {
    const workerRows = this.page.locator('tbody tr');
    if (
      !(await workerRows
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false))
    ) {
      return '';
    }

    const count = await workerRows.count();
    for (let i = 0; i < count; i += 1) {
      const cellText =
        (await workerRows.nth(i).locator('td').first().textContent())?.trim() ||
        '';
      if (/group lead/i.test(cellText)) {
        // Strip the role subtitle so we return just the worker name.
        return cellText
          .split(/group lead/i)[0]
          .split('Employee')[0]
          .split('Manager')[0]
          .trim();
      }
    }
    return '';
  }

  /**
   * Gets the first group name from the table.
   */
  async getFirstGroupName(): Promise<string> {
    const groupRows = this.page.locator('tbody tr');
    // No groups present (e.g. the Groups view shows "No groups yet"). Return
    // empty so callers fall through to their no-groups path instead of throwing.
    if (
      !(await groupRows
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false))
    ) {
      return '';
    }
    const groupNameCell = groupRows.first().locator('td').first();
    return (await groupNameCell.textContent())?.trim() || '';
  }

  /**
   * Clicks View settings link for a worker.
   */
  async clickViewSettingsForWorker(workerName: string): Promise<boolean> {
    const viewSettingsLink = this.page.locator(
      `//*[contains(text(),'${workerName}')]/ancestor::tr/descendant::*[text()='View settings']`,
    );
    const workerCell = this.page
      .locator(`//*[contains(text(),'${workerName}')]`)
      .first();

    // The workers list re-renders after a settings save, so the row can take a
    // moment to reappear. Try, then reload the tab once and try again.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      // Bring the worker row on-screen so its action link renders + is followable.
      await workerCell.scrollIntoViewIfNeeded().catch(() => {});
      if (
        await viewSettingsLink
          .first()
          .isVisible({ timeout: 15000 })
          .catch(() => false)
      ) {
        await viewSettingsLink
          .first()
          .scrollIntoViewIfNeeded()
          .catch(() => {});
        await viewSettingsLink.first().click();
        await this.page.waitForTimeout(2000);
        return true;
      }

      // Not found yet — re-enter the Workers tab to force a fresh render.
      if (attempt === 0) {
        await this.clickWorkersTab().catch(() => {});
        await this.clickWorkersToggle().catch(() => {});
        await this.page.waitForTimeout(2000);
      }
    }
    return false;
  }

  /**
   * Clicks View for a group row to open group detail (workers list).
   * UI uses ComboLink label "View" (workers.actions.view); legacy used "View settings".
   */
  async clickViewForGroup(groupName: string): Promise<boolean> {
    const row = this.page
      .getByRole('row')
      .filter({ hasText: groupName })
      .first();
    if (!(await row.isVisible({ timeout: 10000 }).catch(() => false))) {
      return false;
    }

    const comboLink = row
      .locator('[data-testid^="action-combo-link-"]')
      .first();
    if (await comboLink.isVisible().catch(() => false)) {
      await comboLink.click();
      await this.page.waitForTimeout(2000);
      return true;
    }

    const viewLink = row
      .getByRole('link', { name: /^view$/i })
      .or(row.getByRole('button', { name: /^view$/i }));
    if (
      await viewLink
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await viewLink.first().click();
      await this.page.waitForTimeout(2000);
      return true;
    }

    const viewSettingsLegacy = row.getByRole('link', {
      name: /view settings/i,
    });
    if (
      await viewSettingsLegacy
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await viewSettingsLegacy.first().click();
      await this.page.waitForTimeout(2000);
      return true;
    }

    await row.click();
    await this.page.waitForTimeout(2000);
    return true;
  }

  /**
   * Checks if Breaks card is visible in Worker View Settings.
   */
  async isBreaksCardVisible(): Promise<boolean> {
    const breaksCard = this.page.locator(`//*[text()='Breaks']`);
    return await breaksCard
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  /**
   * Checks if Notifications card is visible in Worker View Settings.
   */
  async isNotificationsCardVisible(): Promise<boolean> {
    const notificationsCard = this.page.locator(`//*[text()='Notifications']`);
    return await notificationsCard
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  /**
   * Clicks Edit Notifications button in Worker View Settings.
   */
  async clickEditNotifications(): Promise<boolean> {
    const editNotificationsButton = this.page.locator(
      `//*[@aria-label="edit-notifications"]`,
    );
    if (
      await editNotificationsButton
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await editNotificationsButton.first().click();
      await this.page.waitForTimeout(1000);
      return true;
    }
    return false;
  }

  /**
   * Clicks Edit Breaks button in Worker View Settings.
   */
  async clickEditBreaks(): Promise<boolean> {
    const editBreaksButton = this.page.locator(
      `//*[@aria-label="edit-breaks"]`,
    );
    if (
      await editBreaksButton
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await editBreaksButton.first().click();
      await this.page.waitForTimeout(1000);
      return true;
    }
    return false;
  }

  /**
   * Sets clock-in reminder time in notifications edit panel.
   */
  async setClockInReminderTime(time: string): Promise<void> {
    const clockInReminderDropdown = this.page.locator(
      `//*[text()='Send clock-in reminder at']/ancestor::div[1]/descendant::input`,
    );
    if (
      await clockInReminderDropdown
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await clockInReminderDropdown.click();
      await clockInReminderDropdown.fill(time);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Checks the email checkbox for clock-in notifications.
   */
  async checkEmailCheckbox(): Promise<boolean> {
    const emailCheckbox = this.page.locator(
      'input[aria-label="clock-in-email"]',
    );
    if (await emailCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isChecked = await emailCheckbox.isChecked().catch(() => false);
      if (!isChecked) {
        await emailCheckbox.check({ force: true });
        await this.page.waitForTimeout(500);
        return true;
      }
    }
    return false;
  }

  /**
   * Unchecks the email checkbox for clock-in notifications.
   */
  async uncheckEmailCheckbox(): Promise<boolean> {
    const emailCheckbox = this.page.locator(
      'input[aria-label="clock-in-email"]',
    );
    if (await emailCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isChecked = await emailCheckbox.isChecked().catch(() => false);
      if (isChecked) {
        await emailCheckbox.uncheck({ force: true });
        await this.page.waitForTimeout(500);
        return true;
      }
    }
    return false;
  }

  /**
   * Clicks Save button (uses nth to handle multiple save buttons).
   */
  async clickSaveButton(index: number = 0): Promise<boolean> {
    const saveButton = this.page.locator(`//*[text()='Save']`);
    if (
      await saveButton
        .nth(index)
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await saveButton.nth(index).click();
      await this.page.waitForTimeout(2000);
      return true;
    }
    return false;
  }

  /**
   * Checks if a specific time is displayed in the notification card.
   */
  async isNotificationTimeVisible(time: string): Promise<boolean> {
    const timeText = this.page.locator(
      `//*[contains(text(),'${time}')] | //*[contains(text(),'email at')]`,
    );
    return await timeText
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  /**
   * Dismisses the Assignments onboarding coachmark/walkthrough ("Customer
   * assignments for time-tracking … 1 of N") that the IES (Intuit Enterprise
   * Suite) shell shows on first visit. It renders as an overlay tooltip that
   * intercepts pointer events, so tab/row clicks fail with "…subtree intercepts
   * pointer events".
   *
   * Elite / QBO accounts do NOT show this coachmark, so this is a safe no-op
   * there — call it freely before any tab/row interaction to keep both IES and
   * elite working.
   */
  async dismissCoachmarks(): Promise<void> {
    // 1) Close the onboarding coachmark/walkthrough ("Customer assignments for
    //    time-tracking … 1 of N") — IES only. Its "Close Tooltip" button
    //    dismisses the whole multi-step flow. Retry a few times in case a fresh
    //    step's tooltip renders after the previous one is closed. No-op for
    //    elite/QBO, which never show it.
    const closeTooltip = this.page.getByRole('button', {
      name: 'Close Tooltip',
    });
    for (let i = 0; i < 3; i++) {
      const visible = await closeTooltip
        .first()
        .isVisible({ timeout: 1500 })
        .catch(() => false);
      if (!visible) break;
      await closeTooltip
        .first()
        .click({ timeout: 2000 })
        .catch(() => undefined);
      await this.page.waitForTimeout(500);
    }

    // 2) Dismiss any open top-nav popover that overlays the tabs — in the IES
    //    shell the company switcher (e.g. "MEIESParent3") menu and the "All
    //    apps" flyout can be left open and their dropdown intercepts the tab
    //    click. The company switcher auto-focuses its own "Search" box, so the
    //    FIRST Escape only clears that input — press a few times so a later one
    //    closes the menu. Then a neutral outside-click (empty right edge of the
    //    viewport, clear of every overlay) forces click-outside dismissal of
    //    anything still open. All no-ops for elite/QBO.
    for (let i = 0; i < 3; i++) {
      await this.page.keyboard.press('Escape').catch(() => undefined);
      await this.page.waitForTimeout(200);
    }
    const vp = this.page.viewportSize();
    if (vp) {
      await this.page.mouse
        .click(vp.width - 60, Math.floor(vp.height / 2))
        .catch(() => undefined);
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Clicks Customers tab in Assignments.
   */
  async clickCustomersTab(): Promise<void> {
    await this.page.waitForTimeout(5000);
    // IES shows an onboarding coachmark over the tabs on first load — clear it
    // before clicking so the click is not intercepted. No-op for elite/QBO.
    await this.dismissCoachmarks();
    const customersTab = this.page.locator(
      `//*[@role="tablist"]//*[text()='Customers']`,
    );
    await this.page.waitForTimeout(4000);
    await expect(customersTab).toBeVisible({ timeout: 5000 });
    await customersTab.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Row-scoped: open the **dropdown** next to “Assign Workers” → **Assign time tracking fields**.
   * (QBO uses a primary “Assign Workers” button plus a chevron menu; TTF lives in that menu.)
   * Falls back to ⋮ Expand Menu when no `aria-haspopup` trigger exists (older shells).
   */
  async openAssignTimeTrackingFieldsForCustomer(
    companyName: string,
  ): Promise<void> {
    const row = this.customerRow(companyName);
    await expect(row).toBeVisible();
    const actionsCell = row.getByRole('cell').last();
    const menuTrigger = actionsCell
      .locator('button[aria-haspopup="menu"], button[aria-haspopup="true"]')
      .first();
    if (await menuTrigger.isVisible({ timeout: 8000 }).catch(() => false)) {
      await menuTrigger.click();
    } else {
      const actionMenuButton = row
        .locator(`//button[@aria-label="Expand Menu"]`)
        .first();
      await expect(actionMenuButton).toBeVisible({ timeout: 8000 });
      await actionMenuButton.click();
    }
    await this.selectAssignFields();
  }

  /**
   * Customers tab → row **Assign Workers** primary control (opens drawer directly — not a menu item).
   */
  async openAssignWorkersForCustomer(companyName: string): Promise<void> {
    const row = this.customerRow(companyName);
    await expect(row).toBeVisible();
    const actionsCell = row.getByRole('cell').last();
    const assignWorkers = actionsCell
      .getByRole('button', { name: /^assign workers$/i })
      .or(actionsCell.getByRole('link', { name: /^assign workers$/i }))
      .first();
    await expect(assignWorkers).toBeVisible({ timeout: 20_000 });
    await assignWorkers.click();
  }

  /**
   * Clicks Assign time tracking field option for a customer.
   */
  async clickAssignFieldOptionForCustomer(
    customerName: string,
  ): Promise<boolean> {
    const assignButton = this.page
      .locator(
        `//*[contains(text(),'${customerName}')]/ancestor::tr/descendant::*[contains(text(),'Assign')]`,
      )
      .or(
        this.page
          .locator(`tbody tr`)
          .first()
          .locator(`text=Assign time tracking field option`)
          .or(this.page.locator(`tbody tr`).first().locator(`text=Assign`)),
      );

    if (
      await assignButton
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await assignButton.first().click();
      await this.page.waitForTimeout(1000);
      return true;
    }
    return false;
  }

  /**
   * Opens the action menu for a specific company and selects Edit option
   * @param companyName Name of the company to edit
   */
  async openEditCustomerForCompany(companyName: string): Promise<void> {
    const row = this.customerRow(companyName);
    await expect(row).toBeVisible();

    // Click the action menu button (Expand Menu) for this specific company row
    const actionMenuButton = row
      .locator(`//button[@aria-label="Expand Menu"]`)
      .first();
    await expect(actionMenuButton).toBeVisible();
    await actionMenuButton.click();
    await this.page.waitForTimeout(500);

    // Click the Edit menu item
    await this.page.locator(`//span[text()="Edit"]`).click();
    await this.page.waitForTimeout(500);
  }
}
