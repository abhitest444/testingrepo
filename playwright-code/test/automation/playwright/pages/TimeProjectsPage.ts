import { expect, Locator, Page } from '@playwright/test';
import gotoWithAuthSession from '../gotoWithAuthSession';
import { handlePopupsInAnyOrder } from './TimeSettingsPage';

/** QBO shell route for the Time projects widget (`src/config.json` path `timeproject`). */
export const TIME_PROJECTS_APP_PATH = '/app/timeproject';

/** Time app route embedding the Time project job (`/app/time/timeProject?jobId=time`). */
export const TIME_PROJECTS_TIME_APP_PATH = '/app/time/timeProject';

/**
 * Page object for **Time → Time projects** (`timeProject` widget).
 * Copy and `data-testid`s align with `src/js/widgets/timeProject` and `src/nls/timeProject.json`.
 */
export class TimeProjectsPage {
  constructor(private readonly page: Page) {}

  /**
   * When set, `firstProjectRow()` (and everything that builds on it) resolves to
   * the grid row containing this exact project name instead of the literal first
   * row. This lets every first-row operation (summary, estimate, assign, inline
   * edit/delete) target OUR project even when other projects — e.g. a Completed
   * one whose name sorts ahead of ours — sit above it in the grid. No filter or
   * search interaction is needed, so it doesn't depend on dropdown DOM.
   */
  private targetProjectName?: string;

  setTargetProject(name?: string): void {
    this.targetProjectName = name;
  }

  async goto(): Promise<void> {
    await gotoWithAuthSession(this.page, TIME_PROJECTS_TIME_APP_PATH, {
      waitUntil: 'load',
    });
    await this.page.waitForLoadState('load');
    await handlePopupsInAnyOrder(this.page);
  }

  /** Open Time projects via `/app/time/timeProject?jobId=time` (Time app shell; not `/app/timeproject`). */
  async navigateToTimeProjects(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await gotoWithAuthSession(this.page, TIME_PROJECTS_TIME_APP_PATH, {
      waitUntil: 'load',
    });
    await this.page.waitForLoadState('load');
    //await handlePopupsInAnyOrder(this.page);
  }

  /** Filters + Manage projects (shell may also show a page title). */
  rootShell(): Locator {
    return this.page.locator('[data-id=bodyNode]').first();
  }

  filtersContainer(): Locator {
    return this.page.getByTestId('time-project-filters');
  }

  manageProjectsButton(): Locator {
    return this.page.getByRole('button', { name: /manage projects/i });
  }

  zeroState(): Locator {
    return this.page.getByTestId('time-project-zero-state');
  }

  projectsTable(): Locator {
    return this.page.getByTestId('time-project-table');
  }

  projectRows(): Locator {
    return this.page.locator(
      `//table[@summary='Time projects table']/tbody/tr[contains(@class,"Table-row")]`,
    );
  }

  firstProjectRow(): Locator {
    if (this.targetProjectName) {
      return this.projectRows()
        .filter({ hasText: this.targetProjectName })
        .first();
    }
    return this.projectRows().first();
  }

  actionComboForFirstRow(): Locator {
    // Scope the action menu to OUR row when a target is set; otherwise page-wide
    // first Expand Menu (original behaviour for single-project accounts).
    if (this.targetProjectName) {
      return this.firstProjectRow()
        .locator('//button[@aria-label="Expand Menu"]')
        .first();
    }
    return this.page.locator('//button[@aria-label="Expand Menu"]').first();
  }

  statusFilter(): Locator {
    return this.page.locator(`//input[@placeholder="All statuses"]`).first();
  }

  customerFilter(): Locator {
    return this.page.locator(`//input[@placeholder="All customers"]`).first();
  }

  projectSearch(): Locator {
    // The Time projects search is an always-present IDS DropdownTypeahead input
    // (role="combobox", labelled "Search"). NOTE: the placeholder "Search for
    // projects" is on BOTH the wrapper div and the input, so getByPlaceholder
    // is ambiguous — target the combobox by its accessible name instead.
    return this.page.getByRole('combobox', { name: 'Search' });
  }

  /**
   * @param timeoutMs Use a higher value on slow QBO / heavy accounts (e.g. PR016).
   */
  async expectPageReady(timeoutMs = 60_000): Promise<void> {
    await expect(
      this.filtersContainer()
        .or(this.zeroState())
        .or(this.page.getByTestId('time-project-loader')),
    ).toBeVisible({ timeout: timeoutMs });
    const loader = this.page.getByTestId('time-project-loader');
    if (await loader.isVisible().catch(() => false)) {
      await loader
        .waitFor({ state: 'hidden', timeout: timeoutMs })
        .catch(() => {});
    }
  }

  async expectZeroStateCopy(): Promise<void> {
    await expect(this.zeroState()).toBeVisible({ timeout: 30_000 });
    await expect(
      this.page.getByText(/View insights into actual versus estimate hours/i),
    ).toBeVisible();
    await expect(
      this.page.getByText(
        /Get started by creating estimates to accurate plan for how time is spent on your projects/i,
      ),
    ).toBeVisible();
  }

  /** PR003: no in-widget “create / new project” primary action (projects are created under Projects). */
  async expectNoCreateProjectControlInWidget(): Promise<void> {
    const scope = this.rootShell();
    await expect(
      scope.getByRole('button', { name: /^(create|new)\s+project$/i }),
    ).toHaveCount(0);
    await expect(
      scope.getByRole('link', { name: /^(create|new)\s+project$/i }),
    ).toHaveCount(0);
  }

  async clickManageProjects(): Promise<void> {
    await this.manageProjectsButton().click();
  }

  async expectManageProjectsNavigatesToProjectsApp(): Promise<void> {
    await this.page.waitForURL(/\/app\/projects/i, { timeout: 30_000 });
    await expect(this.page).toHaveURL(/\/app\/projects/);
  }

  /** PR005: table headers (EN) + Status / Customer filters + search. */
  async expectListChromeWhenTableVisible(): Promise<void> {
    const table = this.projectsTable();
    await expect(table).toBeVisible({ timeout: 30_000 });
    const headerRegion = table
      .locator('thead')
      .or(table.locator('[class*="Header"]'));
    for (const label of [
      'Project / Customer',
      'Status',
      'Deadline',
      'Budget',
      'Actions',
    ]) {
      await expect(headerRegion.getByText(label, { exact: true })).toBeVisible({
        timeout: 15_000,
      });
    }
    await expect(this.statusFilter()).toBeVisible();
    await expect(this.customerFilter()).toBeVisible();
    await expect(this.projectSearch()).toBeVisible();
  }

  /**
   * Exact label match for a primary **Create Estimate** control in the table.
   * Also used to decide create vs. edit in PR016+ flows.
   */
  createEstimateButtonExactText(): Locator {
    return this.page.locator('//button[text()="Create Estimate"]');
  }

  async openCreateEstimateFromFirstRow(): Promise<void> {
    await expect(this.firstProjectRow()).toBeVisible({ timeout: 30_000 });
    const combo = this.actionComboForFirstRow();
    await expect(combo).toBeVisible();
    const primary = combo
      .getByRole('button', { name: /^create estimate$/i })
      .or(combo.getByRole('link', { name: /^create estimate$/i }))
      .first();
    if ((await primary.count()) > 0) {
      await primary.click();
    } else {
      await combo.click();
    }
  }

  /**
   * If **Create Estimate** is visible, click it; else open the row menu and choose **Edit estimate** (see
   * `openEditEstimateFromFirstRowExpandMenuThenEditEstimate`).
   */
  async openCreateOrEditEstimateFromFirstRow(options?: {
    timeoutMs?: number;
  }): Promise<void> {
    const t = options?.timeoutMs ?? 90_000;
    await expect(this.firstProjectRow()).toBeVisible({ timeout: t });
    const createBtn = this.createEstimateButtonExactText().first();
    if (await createBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await createBtn.click();
      return;
    }
    await this.openEditEstimateFromFirstRowExpandMenuThenEditEstimate({
      timeoutMs: t,
    });
  }

  /** First row Actions combo that shows **Edit** (project already has an estimate / budget). */
  firstActionComboWithEdit(): Locator {
    return this.page
      .locator('[data-testid^="action-combo-link-"]')
      .filter({ hasText: /^Edit$/i })
      .first();
  }

  /** Step 3: open **Edit** estimate from the first row that has a budget. */
  async openEditEstimateFromFirstRowWithBudget(): Promise<void> {
    await expect(this.firstProjectRow()).toBeVisible({ timeout: 30_000 });
    const combo = this.firstActionComboWithEdit();
    await expect(combo).toBeVisible({ timeout: 30_000 });
    const primary = combo
      .getByRole('button', { name: /^edit$/i })
      .or(combo.getByRole('link', { name: /^edit$/i }))
      .first();
    if ((await primary.count()) > 0) {
      await primary.click();
    } else {
      await combo.click();
    }
  }

  /**
   * First **table** row → Actions combo → **Edit** (same row only).
   * Use when the scenario requires the top project row, not the first row anywhere that shows Edit.
   */
  async openEditEstimateFromFirstProjectRow(): Promise<void> {
    await expect(this.firstProjectRow()).toBeVisible({ timeout: 30_000 });
    const combo = this.firstProjectRow().locator(
      '[data-testid^="action-combo-link-"]',
    );
    await expect(combo).toBeVisible({ timeout: 30_000 });
    const primary = combo
      .getByRole('button', { name: /^edit$/i })
      .or(combo.getByRole('link', { name: /^edit$/i }))
      .first();
    if ((await primary.count()) > 0) {
      await primary.click();
    } else {
      await combo.click();
      const edit = this.page.getByText(/^Edit$/i).first();
      await expect(edit).toBeVisible({ timeout: 10_000 });
      await edit.click();
    }
  }

  /**
   * First project row → `//button[@aria-label="Expand Menu"]` → `//span[text()="Edit estimate"]` (or fallbacks).
   * `timeoutMs` defaults to 90s for **slow** QBO sessions.
   * If Expand Menu is absent, falls back to `openEditEstimateFromFirstProjectRowViaActionDropdown`.
   */
  async openEditEstimateFromFirstRowExpandMenuThenEditEstimate(options?: {
    timeoutMs?: number;
  }): Promise<void> {
    const t = options?.timeoutMs ?? 90_000;
    await expect(this.firstProjectRow()).toBeVisible({ timeout: t });
    const row = this.firstProjectRow();
    const expandMenu = row.locator('//button[@aria-label="Expand Menu"]');
    if (await expandMenu.isVisible({ timeout: t }).catch(() => false)) {
      await expandMenu.click();
      const editSpan = this.page
        .locator('//strong[text()="Edit estimate"]')
        .or(this.page.locator('//span[normalize-space(.)="Edit estimate"]'));
      const target = editSpan
        .or(this.page.getByRole('menuitem', { name: /edit estimate/i }))
        .or(this.page.getByText(/^Edit estimate$/i))
        .first();
      await expect(target).toBeVisible({ timeout: t });
      await target.click();
      return;
    }
    await this.openEditEstimateFromFirstProjectRowViaActionDropdown();
  }

  /**
   * First row → open the actions **menu** (ComboLink caret when split), choose **Edit** if listed;
   * otherwise fall back to the primary **Edit** control (rows with a budget only show Assign workers in the menu).
   */
  async openEditEstimateFromFirstProjectRowViaActionDropdown(): Promise<void> {
    await expect(this.firstProjectRow()).toBeVisible({ timeout: 30_000 });
    const combo = this.firstProjectRow().locator(
      '[data-testid^="action-combo-link-"]',
    );
    await expect(combo).toBeVisible({ timeout: 30_000 });

    const innerButtons = combo.locator(':scope button');
    const btnCount = await innerButtons.count();
    // Split ComboLink: caret is usually the last inner button; a single control is typically primary **Edit**.
    if (btnCount >= 2) {
      await innerButtons.nth(btnCount - 1).click();
      const editMenuItem = this.page
        .getByRole('menuitem', { name: /^Edit$/i })
        .first();
      if (await editMenuItem.isVisible({ timeout: 2500 }).catch(() => false)) {
        await editMenuItem.click();
        return;
      }
      await this.page.keyboard.press('Escape').catch(() => {});
    } else if (btnCount === 1) {
      await this.openEditEstimateFromFirstProjectRow();
      return;
    } else {
      await combo.click();
    }

    const primary = combo
      .getByRole('button', { name: /^edit$/i })
      .or(combo.getByRole('link', { name: /^edit$/i }))
      .first();
    if ((await primary.count()) > 0) {
      await primary.click();
      return;
    }

    await combo.click();
    const edit = this.page.getByText(/^Edit$/i).first();
    await expect(edit).toBeVisible({ timeout: 10_000 });
    await edit.click();
  }

  async expectEditEstimateDrawerOpen(options?: {
    createDrawerTimeoutMs?: number;
    headingTimeoutMs?: number;
  }): Promise<void> {
    const createMs = options?.createDrawerTimeoutMs ?? 15_000;
    const headMs = options?.headingTimeoutMs ?? 10_000;
    await this.expectCreateEstimateDrawerOpen(createMs);
    await expect(this.page.getByText(/Edit estimate/i)).toBeVisible({
      timeout: headMs,
    });
  }

  /** After `openCreateOrEditEstimateFromFirstRow` — create **or** edit estimate title. */
  async expectCreateOrEditEstimateDrawerOpen(options?: {
    createDrawerTimeoutMs?: number;
    headingTimeoutMs?: number;
  }): Promise<void> {
    const createMs = options?.createDrawerTimeoutMs ?? 15_000;
    const headMs = options?.headingTimeoutMs ?? 10_000;
    await expect(this.createEstimateDrawer()).toBeVisible({
      timeout: createMs,
    });
    const edit = this.page.getByText(/Edit estimate/i);
    const create = this.page.getByText(
      /How are you estimating this project\?/i,
    );
    await expect(edit.or(create).first()).toBeVisible({ timeout: headMs });
  }

  /** Select first service item, enter hours, **Add** (steps 5 for PR015-style flows). */
  async selectFirstServiceItemEnterHoursAndAdd(hours: string): Promise<void> {
    await this.estimateTypeByService().click();
    await this.serviceItemDropdown().click();
    const firstOpt = this.page.getByRole('option').first();
    await expect(firstOpt).toBeVisible({ timeout: 15_000 });
    await firstOpt.click();
    await this.serviceItemHoursInput().locator('input').fill(hours);
    await expect(this.serviceItemAddButton()).toBeEnabled();
    await this.serviceItemAddButton().click();
  }

  async expectChangeEstimateTypeModalVisible(
    firstVisibleTimeoutMs = 20_000,
  ): Promise<void> {
    const m = this.changeTypeModal();
    await expect(m).toBeVisible({ timeout: firstVisibleTimeoutMs });
    const inner = 30_000;
    await expect(this.page.getByText(/Change estimate type\?/i)).toBeVisible({
      timeout: inner,
    });
    await expect(
      this.page.getByText(
        /Changing the estimate type will delete the current estimate so you can create a new one/i,
      ),
    ).toBeVisible({ timeout: inner });
    await expect(
      this.page.getByText(/No time data will be deleted/i),
    ).toBeVisible({ timeout: inner });
    await expect(this.changeTypeCancel()).toBeVisible({ timeout: inner });
    await expect(this.changeTypeContinue()).toBeVisible({ timeout: inner });
  }

  /** Filter list by project name (search field inside `time-project-search`). */
  async searchProjectsByName(name: string): Promise<void> {
    const box = this.projectSearch().first();
    await box.fill(name, { timeout: 8000 });
    await this.page.waitForTimeout(500);
  }

  createEstimateDrawer(): Locator {
    return this.page
      .locator('//strong[text()="Create estimate"]')
      .or(this.page.locator(`//strong[text()="Edit estimate"]`));
  }

  estimateTypeByHours(): Locator {
    return this.page.locator(
      `//div[contains(@class,"RadioRow")]//span[text()="By hours"]/preceding-sibling::input`,
    );
  }

  estimateTypeByService(): Locator {
    return this.page.locator(
      `//div[contains(@class,"RadioRow")]//span[text()="By service item"]/preceding-sibling::input`,
    );
  }

  estimateHoursInput(): Locator {
    return this.page.locator(
      `//*[contains(@class,'CreateEstimateDrawerstyled__InputWrapper')]`,
    );
  }

  estimateSaveButton(): Locator {
    return this.page.locator(
      `//button[contains(@class,"Button")]//span[text()="Save"]`,
    );
  }

  serviceItemDropdown(): Locator {
    return this.page.locator(`//*[@aria-label="Select service item"]`);
  }

  serviceItemHoursInput(): Locator {
    return this.page.locator(`//*[@aria-label='Enter hours']`);
  }

  serviceItemAddButton(): Locator {
    return this.page.locator(
      `//button[contains(@class,'Button')]//span[text()='+ Add']`,
    );
  }

  changeTypeModal(): Locator {
    return this.page.locator(`//div[contains(@class,"Modal")]`).first();
  }

  changeTypeCancel(): Locator {
    return this.page.locator(
      `//button[contains(@class,"Button")]//span[text()="Cancel"]`,
    );
  }

  changeTypeContinue(): Locator {
    return this.page.locator(
      `//button[contains(@class,"Button")]//span[text()="Continue"]`,
    );
  }

  async closeEstimateDrawerViaHeader(): Promise<void> {
    const drawer = this.createEstimateDrawer();
    await expect(drawer).toBeVisible({ timeout: 15_000 });
    const close = this.page.locator(`//button[@aria-label="Close"]`);
    await close.first().click();
  }

  async expectCreateEstimateDrawerOpen(timeoutMs = 15_000): Promise<void> {
    const drawer = this.createEstimateDrawer();
    await expect(drawer).toBeVisible({ timeout: timeoutMs });
    await expect(
      this.page.getByText(/How are you estimating this project\?/i),
    ).toBeVisible({ timeout: timeoutMs });
  }

  async expectByHoursSectionCopy(): Promise<void> {
    await expect(this.page.getByText(/^By hours$/i)).toBeVisible();
    await expect(
      this.page.getByText(
        /Estimate by total hours on a project and track time towards the total/i,
      ),
    ).toBeVisible();
    await expect(
      this.page.getByText(
        /How many hours are estimated to complete the project\?/i,
      ),
    ).toBeVisible();
    await expect(this.estimateHoursInput()).toBeVisible();
  }

  async expectByServiceItemSectionCopy(): Promise<void> {
    await expect(this.page.getByText(/^By service item$/i)).toBeVisible();
    await expect(
      this.page.getByText(
        /Estimate by service items on the project and track progress on those service items/i,
      ),
    ).toBeVisible();
    await expect(
      this.page.getByText(/Enter the service items and estimated hours/i),
    ).toBeVisible();
    await expect(this.serviceItemDropdown()).toBeVisible();
    await expect(this.serviceItemHoursInput()).toBeVisible();
  }

  async expectDrawerClosed(): Promise<void> {
    await expect(this.createEstimateDrawer()).not.toBeVisible({
      timeout: 15_000,
    });
  }

  projectSummary(): Locator {
    return this.page.locator(`//strong[text()="Summary"]`);
  }

  async openFirstProjectSummary(): Promise<void> {
    await expect(this.firstProjectRow()).toBeVisible({ timeout: 30_000 });
    await this.firstProjectRow().click({ position: { x: 40, y: 16 } });
    await expect(this.projectSummary()).toBeVisible({ timeout: 30_000 });
  }

  projectRowAt(index: number): Locator {
    return this.projectRows().nth(index);
  }

  /** Summary page table (only when estimate is By service item). */
  summaryServiceItemTable(): Locator {
    return this.page.locator(`//table[@summary="Total hours estimate table"]`);
  }

  /**
   * Open project summaries until one shows the service-item estimate table, or give up.
   * @returns true if a matching project was opened
   */
  async openSummaryWithServiceItemEstimate(
    maxRowsToTry = 25,
  ): Promise<boolean> {
    await expect(this.firstProjectRow()).toBeVisible({ timeout: 30_000 });
    const n = Math.min(await this.projectRows().count(), maxRowsToTry);
    for (let i = 0; i < n; i += 1) {
      await this.projectRowAt(i).click({ position: { x: 40, y: 16 } });
      await expect(this.projectSummary()).toBeVisible({ timeout: 30_000 });
      if (
        await this.summaryServiceItemTable()
          .isVisible()
          .catch(() => false)
      ) {
        return true;
      }
      await this.page.getByTestId('project-summary-back').click();
      await expect(this.projectsTable()).toBeVisible({ timeout: 15_000 });
    }
    return false;
  }

  assignWorkersDrawer(): Locator {
    return this.page.locator(`//div[contains(@class,"Drawer-largeContent")]`);
  }

  assignmentDrawerSaveButton(): Locator {
    return this.page.locator(`//button//span[text()="Save"]`);
  }

  async closeAssignWorkersDrawerHeader(): Promise<void> {
    const drawer = this.assignWorkersDrawer();
    await this.page
      .locator(`//button[@aria-label="Close"]`)
      .or(this.page.locator('button[aria-label*="Close" i]'))
      .first()
      .click();
  }

  async clickAssignmentDontSaveIfShown(): Promise<void> {
    const dont = this.page.locator(`//span[text()="Don't save"]`);
    if (await dont.isVisible()) {
      await dont.click();
    }
  }

  async selectFirstWorkerCheckboxInAssignmentDrawer(): Promise<void> {
    const drawer = this.assignWorkersDrawer();
    const boxes = drawer.getByRole('checkbox');
    const count = await boxes.count();
    for (let i = 0; i < count; i += 1) {
      const c = boxes.nth(i);
      const label = (await c.getAttribute('aria-label')) || '';
      if (label === 'Select all items') continue;
      await c.click();
      return;
    }
    throw new Error('No assignable checkbox in Assign workers drawer');
  }

  /** Add distinct service rows until `targetCount` or dropdown exhausted. */
  async addServiceItemsToEstimateInDrawer(
    targetCount: number,
    hoursPerRow = '1',
  ): Promise<number> {
    const drawer = this.createEstimateDrawer();
    let added = await drawer.locator('[data-testid^="service-row-"]').count();
    while (added < targetCount) {
      await this.estimateTypeByService().click();
      await this.serviceItemDropdown().click();
      const opt = this.page.getByRole('option').first();
      if (!(await opt.isVisible().catch(() => false))) break;
      await opt.click();
      await this.serviceItemHoursInput().locator('input').fill(hoursPerRow);
      await this.serviceItemAddButton().click();
      await this.page.waitForTimeout(300);
      const next = await drawer
        .locator('[data-testid^="service-row-"]')
        .count();
      if (next <= added) break;
      added = next;
    }
    return added;
  }

  async openAssignWorkersFromFirstRowMenu(): Promise<void> {
    await expect(this.firstProjectRow()).toBeVisible({ timeout: 30_000 });
    const combo = this.actionComboForFirstRow();
    await combo.click();
    await this.page.getByText(/^Assign workers$/i).click();
  }

  /**
   * Open Assign workers on the first ASSIGNABLE project (skips Completed /
   * Canceled rows — those can't be assigned workers, so their row menu has no
   * "Assign workers" option). Falls back to the first row if no status is
   * detectable. Use this instead of the plain first-row variant when the grid
   * may contain a Completed project ahead of ours.
   */
  async openAssignWorkersForFirstAssignableProject(): Promise<void> {
    // When a target project is set, assign to OUR row directly (it's the In
    // Progress project we created — always assignable).
    if (this.targetProjectName) {
      const row = this.firstProjectRow();
      await expect(row).toBeVisible({ timeout: 30_000 });
      await row.locator('//button[@aria-label="Expand Menu"]').click({
        timeout: 10_000,
      });
      await this.page.getByText(/^Assign workers$/i).click({ timeout: 10_000 });
      return;
    }
    const rows = this.projectRows();
    await expect(rows.first()).toBeVisible({ timeout: 30_000 });
    const count = await rows.count().catch(() => 0);
    for (let i = 0; i < count; i += 1) {
      const row = rows.nth(i);
      const text = (
        (await row.innerText().catch(() => '')) || ''
      ).toLowerCase();
      if (/completed|cancel/.test(text)) continue; // not assignable
      const combo = row.locator('//button[@aria-label="Expand Menu"]');
      await combo.click({ timeout: 10_000 });
      await this.page.getByText(/^Assign workers$/i).click({ timeout: 10_000 });
      return;
    }
    // No clearly-assignable row detected — fall back to the first row.
    await this.openAssignWorkersFromFirstRowMenu();
  }

  async expectAssignWorkersDrawerVisible(): Promise<void> {
    await expect(this.assignWorkersDrawer()).toBeVisible({ timeout: 20_000 });
  }
}

export default TimeProjectsPage;
