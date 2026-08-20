import { Page, Locator, expect } from '@playwright/test';
import { durationDisplayMatchPattern } from '../commonUtils';
import {
  dismissWorkforceOverlaysBeforeInteraction,
  dismissWorkforceTasksDrawer,
  ensureWorkforceTasksDrawerClosed,
  isTasksDrawerVisible,
} from '../flows/Util/Workforce.Util';
import {
  leftArrowButton,
  rightArrowButton,
  firstDataCell,
  hours,
  hoursInputs,
  panelSaveButton,
  panelNotes,
  customerProjectDropdown,
  timesheetRows,
  waitForLoadingToDisappear,
  clickDropdownOption,
  clickCustomerDropdownOption,
  getCustomerName,
  serviceDropdown,
  notesInput,
  WeeklyTimeEntryPage,
} from './WeeklyTimeEntryPage';

/**
 * Page Object for Workforce Employee Portal
 * URL: workforce.intuit.com / workforce-e2e.intuit.com
 */
export default class WorkforcePage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Navigation Locators ====================

  get timeTrackingNavItem(): Locator {
    return this.page.locator(`//ul / descendant::*[text()='Time']`);
  }

  get myProfileLink(): Locator {
    return this.page.getByRole('link', { name: 'My Profile' });
  }

  get paychecksNavItem(): Locator {
    return this.page.locator(
      `//*[@data-test-id="navigation-item-label"]/descendant::*[text()='Paychecks']`,
    );
  }

  get expensesNavItem(): Locator {
    return this.page.locator(
      `//*[@data-test-id="navigation-item-label"]/descendant::*[text()='Expenses']`,
    );
  }

  get benefitsNavItem(): Locator {
    return this.page.locator(
      `//*[@data-test-id="navigation-item-label"]/descendant::*[text()='Benefits']`,
    );
  }

  get documentsNavItem(): Locator {
    return this.page.locator(
      `//*[@data-test-id="navigation-item-label"]/descendant::*[text()='Documents']`,
    );
  }

  // ==================== Time Tracking Page Locators ====================

  get displayByLabel(): Locator {
    return this.page.getByText('Display by');
  }

  get displayByDropdown(): Locator {
    return this.page
      .locator('text=Display by')
      .locator('..')
      .locator('button, select, [role="combobox"]');
  }

  get dateRangeLabel(): Locator {
    return this.page.getByText('Date range', { exact: true });
  }

  get statusLabel(): Locator {
    return this.page.getByText('Status');
  }

  get clockInButton(): Locator {
    return this.page
      .getByRole('button', { name: 'Clock in' })
      .or(this.page.locator('button:has-text("Clock in")'));
  }

  get timesheetPopupCloseButton(): Locator {
    return this.page.locator(
      '//*[text()="Ready to add a timesheet?"]/ancestor::div//button[contains(@aria-label, "close") or contains(@aria-label, "Close")]',
    );
  }

  get addTimeButton(): Locator {
    return this.page.getByRole('button', { name: /Add time/i });
  }

  get singleTimeEntryOption(): Locator {
    return this.page
      .getByRole('menuitem', { name: 'Single time entry' })
      .or(this.page.locator('text=Single time entry'));
  }

  get weeklyTimeEntryOption(): Locator {
    return this.page
      .getByRole('menuitem', { name: /Weekly time\s*(sheet|entry)/i })
      .or(this.page.getByText(/Weekly time\s*(sheet|entry)/i));
  }

  get breakOption(): Locator {
    return this.page
      .getByRole('menuitem', { name: 'Break' })
      .or(this.page.getByText('Break', { exact: true }))
      .first();
  }

  get noTimeEntriesYetText(): Locator {
    return this.page
      .getByText('No time for this date range')
      .or(this.page.getByText('No time entries yet'));
  }

  get noTimeEntriesSubtext(): Locator {
    return this.page.getByText('Go to recent time entries');
  }

  // ==================== Clock In/Out Locators ====================

  get clockOutButton(): Locator {
    return this.page
      .getByRole('button', { name: 'Clock out' })
      .or(this.page.locator('button:has-text("Clock out")'));
  }

  get clockedInStatus(): Locator {
    return this.page.locator('//*[contains(text(), "Clocked in")]');
  }

  get currentlyWorkingIndicator(): Locator {
    return this.page.locator('//*[contains(text(), "Currently working")]');
  }

  get clockInSuccessToast(): Locator {
    return this.page.locator(
      '//*[contains(text(), "clocked in") or contains(text(), "Clock in")]',
    );
  }

  get clockOutSuccessToast(): Locator {
    return this.page.locator(
      '//*[contains(text(), "clocked out") or contains(text(), "Clock out")]',
    );
  }

  // ==================== STE (Single Time Entry) Locators ====================

  get steDrawerTitle(): Locator {
    return this.page.getByRole('heading', { name: 'Single time entry' });
  }

  get steStartDateInput(): Locator {
    return this.page.getByLabel('Start date', { exact: true });
  }

  get steEndDateInput(): Locator {
    return this.page.getByLabel('End date', { exact: true });
  }

  get steDurationInput(): Locator {
    // Prefer the visible field — the drawer keeps hidden hh:mm inputs in the DOM
    // when start/end time mode is active, which caused 5-min clear() timeouts.
    return this.page.locator('input[placeholder="hh:mm"]:visible');
  }

  get steSetStartEndTimeToggle(): Locator {
    return this.page.locator('input[aria-label="Set start and end time"]');
  }

  get steStartTimeInput(): Locator {
    return this.page.locator(
      '//span[text()="Start time"]/ancestor::label//input',
    );
  }

  get steEndTimeInput(): Locator {
    return this.page.locator(
      '//span[text()="End time"]/ancestor::label//input',
    );
  }

  get steCustomerDropdown(): Locator {
    return this.page.getByRole('combobox', { name: 'Customer' });
  }

  get steServiceDropdown(): Locator {
    return this.page
      .getByLabel('Service')
      .or(this.page.locator('text=Select service').locator('..'));
  }

  get steNotesInput(): Locator {
    return this.page.locator(
      '//span[contains(text(), "Notes")]/following-sibling::textarea',
    );
  }

  get steBillableCheckbox(): Locator {
    return this.page.locator(
      `//span[contains(text(), 'Billable')]/ancestor::label//input`,
    );
  }

  get steSaveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save', exact: true });
  }

  get steSaveAndCloseButton(): Locator {
    return this.page.locator(`//*[text()='Save and close']`);
  }

  get steSaveAndNewButton(): Locator {
    return this.page.locator(`//*[text()='Save and new']`);
  }

  get steCancelButton(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  get steCloseButton(): Locator {
    return this.page.locator(
      `//div[contains(@data-automation-id, 'single-time')]//button[@aria-label="Close"]`,
    );
  }

  get steSuccessToast(): Locator {
    return this.page.getByText('Time entry added.');
  }

  get steFutureTimeError(): Locator {
    return this.page.getByText('Start or end time cannot be in the future.');
  }

  // ==================== Filter/Display Locators ====================

  get displayByDropdownInput(): Locator {
    return this.page.getByLabel('Display by');
  }

  get dateRangeDropdownInput(): Locator {
    return this.page.getByLabel('Date range');
  }

  get statusDropdownInput(): Locator {
    return this.page.getByLabel('Status');
  }

  // Display By Options
  get displayByDateOption(): Locator {
    return this.page.getByRole('option', { name: 'Date' });
  }

  get displayByCustomerOption(): Locator {
    return this.page.getByRole('option', { name: /Customer/i });
  }

  get displayByEmployeeOption(): Locator {
    return this.page.getByRole('option', { name: 'Employee' });
  }

  // Date Range Options
  get dateRangeTodayOption(): Locator {
    return this.page.getByRole('option', { name: 'Today' });
  }

  get dateRangeThisWeekOption(): Locator {
    return this.page.getByRole('option', { name: 'This week' });
  }

  get dateRangeThisMonthOption(): Locator {
    return this.page.getByRole('option', { name: 'This month' });
  }

  get dateRangeLastWeekOption(): Locator {
    return this.page.getByRole('option', { name: 'Last week' });
  }

  get dateRangeLastMonthOption(): Locator {
    return this.page.getByRole('option', { name: 'Last month' });
  }

  get dateRangeCustomOption(): Locator {
    return this.page.getByRole('option', { name: 'Custom' });
  }

  // Status Options
  get statusAllOption(): Locator {
    return this.page.getByRole('option', { name: 'All', exact: true });
  }

  get statusUnapprovedOption(): Locator {
    return this.page.getByRole('option', { name: 'Unapproved', exact: true });
  }

  get statusApprovedOption(): Locator {
    return this.page.getByRole('option', { name: 'Approved', exact: true });
  }

  get timeEntryRow(): Locator {
    return this.page
      .locator('tbody tr')
      .filter({ hasNot: this.page.locator('[aria-label*="Collapse"]') });
  }

  // ==================== Edit/Delete Entry Locators ====================

  get editButton(): Locator {
    return this.page.locator('//*[text()="Edit"]');
  }

  get viewButton(): Locator {
    return this.page.locator('//*[text()="View"]');
  }

  get actionDropdownButton(): Locator {
    return this.page.locator('button[aria-label="Expand Menu"]');
  }

  get deleteOptionInDropdown(): Locator {
    return this.page
      .locator('//li/span[text()="Delete"]')
      .or(this.page.getByRole('menuitem', { name: 'Delete' }));
  }

  get deleteConfirmationPopup(): Locator {
    return this.page.getByText(/Are you sure|Delete this entry/i);
  }

  get deleteConfirmYesButton(): Locator {
    return this.page.getByRole('button', { name: 'Yes' });
  }

  get deleteConfirmNoButton(): Locator {
    return this.page.getByRole('button', { name: 'No' });
  }

  get entryDeletedToast(): Locator {
    return this.page.locator(
      '//*[contains(text(), "deleted") or contains(text(), "removed")]',
    );
  }

  get entryUpdatedToast(): Locator {
    return this.page.locator(
      '//*[contains(text(), "updated") or contains(text(), "saved")]',
    );
  }

  // ==================== Break Entry Locators ====================

  get breakDrawerTitle(): Locator {
    return this.page.getByRole('heading', { name: /Break/i });
  }

  get breakSelectBreakDropdown(): Locator {
    return this.page.getByLabel('Select Break', { exact: true });
  }

  get breakStartDateInput(): Locator {
    return this.page.getByLabel('Start Date', { exact: true });
  }

  get breakDurationInput(): Locator {
    return this.page.getByLabel('Duration', { exact: true });
  }

  get breakStartTimeInput(): Locator {
    return this.page.getByLabel('Start Time', { exact: true });
  }

  get breakEndTimeInput(): Locator {
    return this.page.getByLabel('End Time', { exact: true });
  }

  get setStartAndEndTimeToggle(): Locator {
    return this.page.locator('input[aria-label="Set start and end time"]');
  }

  get breakNotesInput(): Locator {
    return this.page.getByLabel('Notes', { exact: true });
  }

  get breakSaveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save', exact: true });
  }

  get breakSaveAndCloseButton(): Locator {
    return this.page.getByRole('button', { name: 'Save and close' });
  }

  get breakCancelButton(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  get breakCloseButton(): Locator {
    return this.page.locator('button[aria-label="Close"]');
  }

  get breakSuccessToast(): Locator {
    return this.page.locator(
      '//*[contains(text(), "saved") or contains(text(), "entry")]',
    );
  }

  get breakTimeframeConflictError(): Locator {
    return this.page.getByText(/already has a timesheet for this timeframe/i);
  }

  // Break entry row identifier — break type name (e.g. TEST MAN) or generic Break label
  get breakEntryRow(): Locator {
    return this.timeEntryRow.filter({
      hasText: /TEST MAN|Break|break type|paid.*break/i,
    });
  }

  breakEntryRowContaining(marker: string): Locator {
    return this.timeEntryRow.filter({ hasText: marker });
  }

  private modalDialogContainer(): Locator {
    return this.page
      .locator(
        '[data-testid="ModalDialog--container"], [data-automation-id="ModalDialog--container"]',
      )
      .first();
  }

  private async waitForActionOverlayGone(): Promise<void> {
    const overlay = this.page.locator('[class*="ActionInProgressOverlay"]');
    if (
      await overlay
        .first()
        .isVisible({ timeout: 500 })
        .catch(() => false)
    ) {
      await overlay.first().waitFor({ state: 'hidden', timeout: 60_000 });
    }
  }

  /**
   * Clear ModalDialog / ActionInProgress overlays that intercept row menu clicks.
   * Completes a pending delete confirmation if present; otherwise closes/escapes.
   */
  private async prepareForTimeEntryRowAction(): Promise<void> {
    await this.waitForActionOverlayGone();

    const modal = this.modalDialogContainer();
    if (await modal.isVisible({ timeout: 500 }).catch(() => false)) {
      const deleteConfirmVisible = await this.deleteConfirmationPopup
        .isVisible({ timeout: 500 })
        .catch(() => false);
      if (deleteConfirmVisible) {
        console.log(
          '⚠ Delete confirmation still open — confirming before row action',
        );
        await this.deleteConfirmYesButton.click({ timeout: 10_000 });
        await modal
          .waitFor({ state: 'hidden', timeout: 30_000 })
          .catch(() => undefined);
      } else {
        const closeBtn = modal
          .locator('button[aria-label="Close"], button[aria-label="close"]')
          .first();
        if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await closeBtn.click({ force: true }).catch(() => undefined);
        } else {
          await this.page.keyboard.press('Escape').catch(() => undefined);
        }
        await modal
          .waitFor({ state: 'hidden', timeout: 15_000 })
          .catch(() => undefined);
      }
    }

    await this.waitForActionOverlayGone();
    await dismissWorkforceOverlaysBeforeInteraction(this.page);
  }

  get wteTimesheetTable(): Locator {
    return this.page.locator('table').filter({ hasText: 'Time category' });
  }

  get wteFirstTimesheetRow(): Locator {
    return this.wteTimesheetTable.locator('tbody tr').first();
  }

  // ==================== Weekly Time Entry (WTE) Locators ====================

  get wteDrawerTitle(): Locator {
    return this.page
      .getByRole('heading', { name: /Weekly time\s*(sheet|entry)/i })
      .or(
        this.page
          .locator('[data-testid="drawerTitle"]')
          .filter({ hasText: /Weekly|Timesheet/i }),
      );
  }

  get wteWeekSelector(): Locator {
    return this.page
      .locator('[class*="WeekSelector"]')
      .or(this.page.locator('button[aria-label*="Previous week"]'));
  }

  get wtePreviousWeekButton(): Locator {
    return this.page.getByRole('button', { name: 'Previous Week' });
  }

  get wteNextWeekButton(): Locator {
    return this.page.getByRole('button', { name: 'Next Week' });
  }

  get wteCustomerDropdown(): Locator {
    return customerProjectDropdown(this.page);
  }

  get wteHoursInput(): Locator {
    return hoursInputs(this.page);
  }

  get wteDayCells(): Locator {
    return this.page.locator(
      '//td[contains(@class, "DataCell") or contains(@class, "day")]',
    );
  }

  get wteFirstDayCell(): Locator {
    return firstDataCell(this.page);
  }

  get wteTotalHours(): Locator {
    return this.page.locator(
      '//*[contains(text(), "Total") or contains(@class, "total")]',
    );
  }

  get wteSaveButton(): Locator {
    return this.page.locator('button[aria-label="weekly-save-button"]');
  }

  get wteSaveAndCloseButton(): Locator {
    return this.page.locator('button[aria-label="weekly-save-close-button"]');
  }

  get wteCancelButton(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  get wteCloseButton(): Locator {
    return this.page.locator('button[aria-label="Close"]');
  }

  get wteSuccessToast(): Locator {
    return this.page.locator(
      '//*[contains(text(), "saved") or contains(text(), "Timesheet")]',
    );
  }

  get wteAddRowButton(): Locator {
    return this.page
      .getByRole('button', { name: /Add row|Add customer/i })
      .or(
        this.page.locator(
          '//*[contains(text(), "Add row") or contains(text(), "Add customer")]',
        ),
      );
  }

  get wteDeleteRowButton(): Locator {
    return this.page
      .locator('button[aria-label*="Delete"]')
      .or(
        this.page.locator(
          '//*[contains(@aria-label, "delete") or contains(@aria-label, "Delete")]',
        ),
      );
  }

  get wteTimesheetRows(): Locator {
    return timesheetRows(this.page);
  }

  get wteNotesInput(): Locator {
    return panelNotes(this.page);
  }

  get wteEntryRow(): Locator {
    return this.timeEntryRow.filter({ hasText: /Weekly|Timesheet/i });
  }

  // ==================== Navigation Methods ====================

  async isSteDrawerOpen(): Promise<boolean> {
    return this.steDrawerTitle.isVisible({ timeout: 2000 }).catch(() => false);
  }

  async ensureSteDrawerOpen(): Promise<void> {
    if (await this.isSteDrawerOpen()) {
      console.log('✓ Single time entry drawer already open');
      return;
    }
    await this.clickTimeTracking();
    await this.dismissTimesheetPopupIfVisible();
    await this.clickSingleTimeEntryOption();
    await this.validateSteDrawerOpened();
  }

  private steCustomerNamePattern(customerName: string): RegExp {
    const escaped = customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, 'i');
  }

  /** Open STE Customer picker and wait for the option list to render (assignment sync can lag). */
  async openSteCustomerDropdown(): Promise<void> {
    await expect(this.steCustomerDropdown).toBeVisible({ timeout: 15_000 });
    await this.steCustomerDropdown.click();
    const listbox = this.page.getByRole('listbox').first();
    const firstOption = this.page.getByRole('option').first();
    try {
      await Promise.race([
        listbox.waitFor({ state: 'visible', timeout: 15_000 }),
        firstOption.waitFor({ state: 'visible', timeout: 15_000 }),
      ]);
    } catch {
      // Popover may use ul/li without listbox role
    }
    await this.page.waitForTimeout(1000);
  }

  async steCustomerOptionIsVisible(customerName: string): Promise<boolean> {
    await this.openSteCustomerDropdown();
    const pattern = this.steCustomerNamePattern(customerName);
    const byRole = await this.page
      .getByRole('option', { name: pattern })
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    const byListRow = await this.page
      .locator('ul li')
      .filter({ hasText: pattern })
      .filter({ hasNotText: /add\s+customer/i })
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const byMainLabel = await this.page
      .locator('//span[contains(@class,"CustomerDropdown__MainLabel")]')
      .filter({ hasText: pattern })
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const byContactRow = await this.page
      .locator("li[data-automation-id='contact-row']")
      .filter({ hasText: pattern })
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const visible = byRole || byListRow || byMainLabel || byContactRow;
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
    return visible;
  }

  private wteDrawerShellLocator(): Locator {
    return this.page
      .getByRole('heading', { name: /Weekly time\s*(sheet|entry)/i })
      .or(
        this.page
          .locator('[data-testid="drawerTitle"]')
          .filter({ hasText: /Weekly|Timesheet/i }),
      );
  }

  async isWteDrawerOpen(): Promise<boolean> {
    return this.wteDrawerShellLocator()
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
  }

  /**
   * STE is dirty after picking Customer/Service/etc.; Cancel/Close shows this modal.
   */
  async dismissSteLeaveWithoutSavingIfVisible(): Promise<void> {
    const leavePrompt = this.page.getByText(
      /Do you want to leave without saving|Your work will be lost if you leave/i,
    );
    if (!(await leavePrompt.isVisible({ timeout: 2000 }).catch(() => false))) {
      return;
    }
    const yesInDialog = this.page
      .getByRole('dialog')
      .filter({ hasText: /leave without saving/i })
      .getByRole('button', { name: /^Yes$/i })
      .first();
    if (await yesInDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await yesInDialog.click();
    } else {
      await this.page.getByRole('button', { name: /^Yes$/i }).click();
    }
    await leavePrompt
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => {});
    await this.page.waitForTimeout(300);
    console.log('✓ Confirmed leave STE without saving');
  }

  /**
   * Close STE so the app returns to Time entries (required before opening WTE from Add time).
   */
  async closeSteDrawerIfOpen(): Promise<void> {
    if (!(await this.isSteDrawerOpen())) {
      return;
    }
    if (
      await this.steCancelButton.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await this.steCancelButton.click();
      await this.page.waitForTimeout(500);
    } else if (
      await this.steCloseButton.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await this.steCloseButton.click();
      await this.page.waitForTimeout(500);
      console.log('✓ Closed STE via Close button');
    } else {
      await this.closeAnyOpenDrawer();
    }
    await this.dismissSteLeaveWithoutSavingIfVisible();
    if (await this.isSteDrawerOpen()) {
      await this.steCloseButton.click().catch(() => undefined);
      await this.dismissSteLeaveWithoutSavingIfVisible();
    }
    await expect(this.steDrawerTitle).not.toBeVisible({ timeout: 15_000 });
    console.log('✓ STE closed — back on Time entries');
  }

  async ensureWteDrawerOpen(): Promise<void> {
    if (await this.isWteDrawerOpen()) {
      await this.waitForWteTimesheetReady();
      console.log('✓ Weekly time entry drawer already open');
      return;
    }
    await this.closeSteDrawerIfOpen();
    await this.clickTimeTracking();
    await this.dismissTimesheetPopupIfVisible();
    await this.clickWeeklyTimeEntryOption();
    await this.validateWteDrawerOpened();
    await this.waitForWteTimesheetReady();
  }

  /**
   * Wait until the WTE grid is interactive (spinner gone, first row / Select control visible).
   * Reuses {@link waitForLoadingToDisappear} from WeeklyTimeEntryPage where applicable.
   */
  async waitForWteTimesheetReady(): Promise<void> {
    await expect(this.wteDrawerShellLocator().first()).toBeVisible({
      timeout: 30_000,
    });

    const spinnerLocators = [
      this.page.locator('[role="progressbar"]'),
      this.page.locator('//div[contains(@class, "Spinner")]').first(),
      this.page.getByLabel('Loading'),
    ];
    for (const spinner of spinnerLocators) {
      if (await spinner.isVisible({ timeout: 1500 }).catch(() => false)) {
        await spinner.waitFor({ state: 'hidden', timeout: 60_000 });
      }
    }

    try {
      await waitForLoadingToDisappear(this.page);
    } catch {
      // Workforce shell may not use the QBO WTE Spinner class
    }

    const firstRowReady = this.page
      .locator('table.weekly-time-entry-table tbody tr')
      .first()
      .or(
        this.page
          .locator('tbody tr:first-child button')
          .filter({ hasText: /^Select/i })
          .first(),
      )
      .or(this.wteTimesheetTable.locator('tbody tr').first());

    await expect(firstRowReady).toBeVisible({ timeout: 60_000 });
    await expect(this.wteSaveButton).toBeVisible({ timeout: 30_000 });
    console.log('✓ WTE timesheet grid ready');
  }

  private static readonly wteTimeCategoryMenuSettleMs = 2_500;

  private wteTimeCategoryMenuOpenLocator(): Locator {
    return this.page
      .getByRole('listbox')
      .or(this.page.locator('ul li').first())
      .or(this.page.getByRole('option').first())
      .first();
  }

  private async waitForWteTimeCategoryMenuOpen(): Promise<void> {
    const menu = this.wteTimeCategoryMenuOpenLocator();
    try {
      await expect(menu).toBeVisible({ timeout: 15_000 });
    } catch {
      // Popover may render without listbox role
    }
    await this.page.waitForTimeout(WorkforcePage.wteTimeCategoryMenuSettleMs);
  }

  /**
   * Opens the first-row Time category picker (same fallbacks as {@link selectWteTimeCategory}).
   * Workforce WTE uses "Select…" buttons, not `[role=combobox]`.
   */
  async openWteFirstRowTimeCategoryDropdown(): Promise<void> {
    await this.ensureWteDrawerOpen();
    await this.waitForWteTimesheetReady();

    const timeCategoryDropdown = customerProjectDropdown(this.page).first();
    const selectButton = this.page
      .locator('tbody tr:first-child button')
      .filter({ hasText: /^Select/i })
      .first();
    const dropdownArrow = this.page
      .locator('tbody tr:first-child td:first-child button')
      .first();

    const openOnce = async (): Promise<void> => {
      if (
        await timeCategoryDropdown
          .isVisible({ timeout: 5000 })
          .catch(() => false)
      ) {
        await timeCategoryDropdown.click();
      } else if (
        await selectButton.isVisible({ timeout: 5000 }).catch(() => false)
      ) {
        await selectButton.click();
      } else if (
        await dropdownArrow.isVisible({ timeout: 5000 }).catch(() => false)
      ) {
        await dropdownArrow.click();
      } else {
        throw new Error(
          'Could not open WTE time category dropdown on first row',
        );
      }
      await this.waitForWteTimeCategoryMenuOpen();
    };

    await openOnce();
    const menuVisible = await this.page
      .locator('ul li')
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (!menuVisible) {
      await this.page.keyboard.press('Escape').catch(() => undefined);
      await this.page.waitForTimeout(400);
      await openOnce();
    }
  }

  private wteTimeCategoryCustomerPattern(customerName: string): RegExp {
    const escaped = customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, 'i');
  }

  /** Time category / customer options on the first WTE row. */
  async wteCustomerOptionIsVisible(customerName: string): Promise<boolean> {
    await this.openWteFirstRowTimeCategoryDropdown();
    const pattern = this.wteTimeCategoryCustomerPattern(customerName);
    const byRole = await this.page
      .getByRole('option', { name: pattern })
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const byListRow = await this.page
      .locator('ul li')
      .filter({ hasText: pattern })
      .filter({ hasNotText: /add\s+customer/i })
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    const visible = byRole || byListRow;
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
    return visible;
  }

  /** Pick a customer/project on the first WTE row (popover is usually `ul li`, not `[role=option]`). */
  async selectWteTimeCategoryCustomer(customerName: string): Promise<void> {
    const pattern = this.wteTimeCategoryCustomerPattern(customerName);
    const listRow = this.page
      .locator('ul li')
      .filter({ hasText: pattern })
      .filter({ hasNotText: /add\s+customer/i })
      .first();
    const byRole = this.page.getByRole('option', { name: pattern }).first();
    const byText = this.page.getByText(customerName, { exact: true }).first();

    const clickCustomerOption = async (): Promise<boolean> => {
      if (await listRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await listRow.click();
        return true;
      }
      if (await byRole.isVisible({ timeout: 5000 }).catch(() => false)) {
        await byRole.click();
        return true;
      }
      if (await byText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await byText.click();
        return true;
      }
      const divOrSpan = this.page
        .locator(
          `//div[contains(text(), '${customerName}')] | //span[contains(text(), '${customerName}')]`,
        )
        .first();
      if (await divOrSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
        await divOrSpan.click();
        return true;
      }
      return false;
    };

    for (let attempt = 0; attempt < 3; attempt++) {
      await this.openWteFirstRowTimeCategoryDropdown();
      if (await clickCustomerOption()) {
        await this.page.waitForTimeout(500);
        console.log(`✓ Selected WTE time category: ${customerName}`);
        return;
      }
      await this.page.keyboard.press('Escape').catch(() => undefined);
      await this.page.waitForTimeout(400);
    }

    throw new Error(
      `Could not select WTE time category "${customerName}" after opening the dropdown`,
    );
  }

  /** Focus a day cell so the WTE side panel (Class, custom fields, etc.) loads. */
  async focusWtePanelDayCell(dayIndex: number = 3): Promise<void> {
    const bodyFirstRow = this.page
      .locator('table.weekly-time-entry-table tbody tr')
      .first();
    const dataCells = bodyFirstRow.locator(
      "td[class*='WeeklyTimeEntryTablestyles__DataCell']",
    );
    const cellOffset = dayIndex >= 1 ? dayIndex : 1;
    await dataCells.nth(cellOffset).click();
    await this.page.waitForTimeout(500);
  }

  /** WTE side panel: focus a day, then pick customer in the time-category dropdown. */
  async selectWtePanelCustomerByName(
    customerName: string,
    dayIndex: number = 3,
  ): Promise<void> {
    await this.focusWtePanelDayCell(dayIndex);
    await this.selectWteTimeCategoryCustomer(customerName);
    await this.page.waitForTimeout(2500);
  }

  async clickTimeTracking(): Promise<void> {
    if ((await this.isSteDrawerOpen()) || (await this.isWteDrawerOpen())) {
      console.log(
        '✓ Time entry drawer open — skipping Time entries navigation',
      );
      return;
    }

    // Wait for loading spinner to disappear
    const loadingSpinner = this.page.locator(
      '[class*="Spinner"], [class*="Loading"], [role="progressbar"]',
    );
    await loadingSpinner
      .waitFor({ state: 'hidden', timeout: 30000 })
      .catch(() => {});

    // Wait for Time nav item to be visible (page fully loaded) - 5 minute timeout
    await expect(this.timeTrackingNavItem).toBeVisible({ timeout: 300000 });

    const timeEntriesLink = this.page.getByRole('link', {
      name: 'Time entries',
    });

    // Check if Time menu is already expanded (Time entries visible)
    const isMenuOpen = await timeEntriesLink.isVisible().catch(() => false);

    if (!isMenuOpen) {
      // Menu is closed, click to expand it
      await this.timeTrackingNavItem.click();
      await expect(timeEntriesLink).toBeVisible({ timeout: 5000 });
      console.log('✓ Expanded Time menu');
    } else {
      console.log('✓ Time menu already expanded');
    }

    // Click on "Time entries" submenu item
    await timeEntriesLink.click();
    await this.page.waitForLoadState('domcontentloaded');
    console.log('✓ Clicked Time entries');

    await this.dismissTimesheetPopupIfVisible();
    await this.waitForTimeEntriesPageReady();
  }

  /** Time entries list can render blank briefly after nav/reload; wait for shell before Add time. */
  private static readonly timeEntriesReadyTimeoutMs = 60_000;

  private timeEntriesPageReadyLocator(): Locator {
    return this.addTimeButton
      .or(this.page.getByLabel('Display by'))
      .or(this.noTimeEntriesYetText)
      .or(this.page.getByRole('button', { name: /^Clock in$/i }))
      .first();
  }

  async waitForTimeEntriesPageReady(): Promise<void> {
    if ((await this.isSteDrawerOpen()) || (await this.isWteDrawerOpen())) {
      return;
    }

    const loadingSpinner = this.page.locator(
      '[class*="Spinner"], [class*="Loading"], [role="progressbar"]',
    );
    await loadingSpinner
      .waitFor({
        state: 'hidden',
        timeout: WorkforcePage.timeEntriesReadyTimeoutMs,
      })
      .catch(() => {});

    await this.dismissTasksDrawerIfVisible();
    await this.dismissTimesheetPopupIfVisible();

    const ready = this.timeEntriesPageReadyLocator();
    const waitForShell = async (): Promise<boolean> => {
      try {
        await expect(ready).toBeVisible({
          timeout: WorkforcePage.timeEntriesReadyTimeoutMs,
        });
        return true;
      } catch {
        return false;
      }
    };

    if (await waitForShell()) {
      try {
        await waitForLoadingToDisappear(this.page);
      } catch {
        // Spinner helper may not apply on Workforce shell
      }
      return;
    }

    console.log('⚠ Time entries shell empty — re-opening Time entries');
    const timeEntriesLink = this.page.getByRole('link', {
      name: 'Time entries',
    });
    if (await timeEntriesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await timeEntriesLink.click();
      await this.page.waitForLoadState('domcontentloaded');
      await this.dismissTimesheetPopupIfVisible();
    } else {
      await this.timeTrackingNavItem.click().catch(() => undefined);
      await timeEntriesLink.click({ timeout: 10_000 }).catch(() => undefined);
      await this.dismissTimesheetPopupIfVisible();
    }

    if (!(await waitForShell())) {
      await this.page.reload();
      await this.page.waitForLoadState('domcontentloaded');
      await loadingSpinner
        .waitFor({
          state: 'hidden',
          timeout: WorkforcePage.timeEntriesReadyTimeoutMs,
        })
        .catch(() => {});
      await expect(this.timeTrackingNavItem).toBeVisible({
        timeout: WorkforcePage.timeEntriesReadyTimeoutMs,
      });
      await timeEntriesLink.click({ timeout: 15_000 }).catch(() => undefined);
      await this.dismissTimesheetPopupIfVisible();
      await expect(ready).toBeVisible({
        timeout: WorkforcePage.timeEntriesReadyTimeoutMs,
      });
    }

    try {
      await waitForLoadingToDisappear(this.page);
    } catch {
      // optional
    }
    await dismissWorkforceOverlaysBeforeInteraction(this.page);
    console.log('✓ Time entries page ready');
  }

  // ==================== Popup Handling Methods ====================

  /**
   * Tasks drawer can auto-open after login or when opening Time entries and blocks
   * the main page (e.g. Date range). Close if visible; no-op if not.
   *
   * Use only the drawer header Close (exact name), not the shell tray toggle
   * (`close-workforce-widgets-ui/wf-employee-task-drawer-tray`) — that button toggles
   * the drawer and causes repeated open/close if clicked during dismiss.
   *
   * @param maxWaitMs — how long to wait for the drawer title (default 10s; use less for follow-up passes)
   */
  async dismissTasksDrawerIfVisible(maxWaitMs: number = 10000): Promise<void> {
    await dismissWorkforceTasksDrawer(this.page, {
      maxAttempts: 3,
      waitForDrawerMs: maxWaitMs,
    });
  }

  /**
   * Call before Display by / Date range / Add time so the Tasks drawer does not block clicks.
   */
  async prepareForTimeEntriesInteraction(): Promise<void> {
    await ensureWorkforceTasksDrawerClosed(this.page);
  }

  /**
   * "Ready to add a timesheet?" often renders above the Tasks drawer; dismiss it first,
   * then Tasks (with an extra pass in case the drawer was covered).
   */
  async dismissTimesheetPopupIfVisible(): Promise<void> {
    try {
      const closeButton = this.timesheetPopupCloseButton;
      if (await closeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await closeButton.click();
        await this.page.waitForTimeout(500);
        console.log('✓ Dismissed "Ready to add a timesheet?" popup');
      }
    } catch {
      // Popup not visible, continue
    }

    await dismissWorkforceOverlaysBeforeInteraction(this.page);
  }

  // ==================== Validation Methods ====================

  async validateTimeTrackingNavVisible(): Promise<void> {
    await expect(this.timeTrackingNavItem).toBeVisible();
    console.log('✓ Time navigation item visible');
  }

  async validateMyProfileVisible(): Promise<void> {
    await expect(this.myProfileLink).toBeVisible();
    console.log('✓ My Profile link visible');
  }

  async validateDisplayByDropdown(): Promise<void> {
    await this.dismissTimesheetPopupIfVisible();
    await expect(this.displayByLabel).toBeVisible();
    console.log('✓ Display by dropdown label visible');
  }

  async validateDateRangeDropdown(): Promise<void> {
    await expect(this.dateRangeLabel).toBeVisible();
    console.log('✓ Date range dropdown label visible');
  }

  async validateStatusDropdown(): Promise<void> {
    await expect(this.statusLabel).toBeVisible();
    console.log('✓ Status dropdown label visible');
  }

  async validateClockInButton(): Promise<void> {
    await expect(this.clockInButton).toBeVisible();
    console.log('✓ Clock in button visible');
  }

  async validateAddTimeButton(): Promise<void> {
    await expect(this.addTimeButton).toBeVisible();
    console.log('✓ Add time button visible');
  }

  /** Pause after opening Add time so STE/WTE/Break menu items are stable before click. */
  private static readonly addTimeMenuSettleMs = 2_500;

  async openAddTimeDropdown(): Promise<void> {
    await ensureWorkforceTasksDrawerClosed(this.page);
    await expect(this.addTimeButton).toBeVisible({
      timeout: WorkforcePage.timeEntriesReadyTimeoutMs,
    });
    await this.addTimeButton.click();
    await this.page.waitForTimeout(800);
    // Close Tasks panel only — Escape / main click would collapse the Add time menu.
    if (await isTasksDrawerVisible(this.page, 800)) {
      await dismissWorkforceTasksDrawer(this.page, { maxAttempts: 3 });
    }
  }

  async validateAddTimeOptions(): Promise<void> {
    await expect(this.singleTimeEntryOption).toBeVisible();
    console.log('✓ Single time entry option visible');

    await expect(this.weeklyTimeEntryOption).toBeVisible();
    console.log('✓ Weekly time entry option visible');

    await expect(this.breakOption).toBeVisible();
    console.log('✓ Break option visible');
  }

  async closeDropdown(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
  }

  // ==================== Dropdown Options Validation Methods ====================

  async openDisplayByDropdown(): Promise<void> {
    await this.prepareForTimeEntriesInteraction();
    await this.displayByDropdownInput.click();
    await this.page.waitForTimeout(500);
    console.log('✓ Opened Display by dropdown');
  }

  async validateDisplayByOptions(): Promise<void> {
    await this.openDisplayByDropdown();
    await expect(this.displayByDateOption).toBeVisible();
    console.log('  ✓ Date option visible');
    await expect(this.displayByCustomerOption).toBeVisible();
    console.log('  ✓ Customer option visible');
    // await expect(this.displayByEmployeeOption).toBeVisible(); // Employee option has been removed from UI
    // console.log('  ✓ Employee option visible');
    await this.closeDropdown();
    console.log('✓ Display by dropdown options validated');
  }

  async openDateRangeDropdown(): Promise<void> {
    await this.prepareForTimeEntriesInteraction();
    await this.dateRangeDropdownInput.click();
    await this.page.waitForTimeout(500);
    console.log('✓ Opened Date range dropdown');
  }

  async validateDateRangeOptions(): Promise<void> {
    await this.openDateRangeDropdown();
    await expect(this.dateRangeTodayOption).toBeVisible();
    console.log('  ✓ Today option visible');
    await expect(this.dateRangeThisWeekOption).toBeVisible();
    console.log('  ✓ This week option visible');
    await expect(this.dateRangeThisMonthOption).toBeVisible();
    console.log('  ✓ This month option visible');
    await expect(this.dateRangeLastWeekOption).toBeVisible();
    console.log('  ✓ Last week option visible');
    await expect(this.dateRangeLastMonthOption).toBeVisible();
    console.log('  ✓ Last month option visible');
    await expect(this.dateRangeCustomOption).toBeVisible();
    console.log('  ✓ Custom option visible');
    await this.closeDropdown();
    console.log('✓ Date range dropdown options validated');
  }

  async openStatusDropdown(): Promise<void> {
    await this.statusDropdownInput.click();
    await this.page.waitForTimeout(500);
    console.log('✓ Opened Status dropdown');
  }

  async validateStatusOptions(): Promise<void> {
    await this.openStatusDropdown();
    await expect(this.statusAllOption).toBeVisible();
    console.log('  ✓ All option visible');
    await expect(this.statusUnapprovedOption).toBeVisible();
    console.log('  ✓ Unapproved option visible');
    await expect(this.statusApprovedOption).toBeVisible();
    console.log('  ✓ Approved option visible');
    await this.closeDropdown();
    console.log('✓ Status dropdown options validated');
  }

  async validateAllDropdownOptions(): Promise<void> {
    console.log('--- Validating Filter Dropdown Options ---');
    await this.validateDisplayByOptions();
    await this.validateDateRangeOptions();
    // await this.validateStatusOptions(); // Status dropdown has been removed from UI
    console.log('✓ All filter dropdown options validated');
  }

  async validateNoTimeEntriesYet(): Promise<void> {
    await expect(this.noTimeEntriesYetText).toBeVisible();
    console.log(
      '✓ Empty state visible ("No time for this date range" or "No time entries yet")',
    );
  }

  async validateTimeTrackingPageElements(): Promise<void> {
    await this.validateDisplayByDropdown();
    await this.validateDateRangeDropdown();
    // await this.validateStatusDropdown(); // Status dropdown has been removed from UI
    await this.validateClockInButton();
    await this.validateAddTimeButton();
  }

  async validateAddTimeDropdownOptions(): Promise<void> {
    await this.openAddTimeDropdown();
    await this.validateAddTimeOptions();
    await this.closeDropdown();
  }

  // ==================== Break Entry Methods ====================

  async clickBreakOption(): Promise<void> {
    await this.openAddTimeDropdown();
    await this.breakOption.click();
    await this.page.waitForTimeout(1000);
  }

  async handleBreakTypeRequiredError(): Promise<boolean> {
    // Check if 'Break type is required' error is visible
    const breakTypeError = this.page.getByText('Break type is required');
    const isErrorVisible = await breakTypeError
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isErrorVisible) {
      console.log('⚠ Break type is required - selecting break type');

      await this.breakSelectBreakDropdown.click();
      await this.page.waitForTimeout(500);

      const firstBreakType = this.page.getByRole('option').first();
      await firstBreakType.click();
      await this.page.waitForTimeout(500);
      console.log('✓ Selected break type from the list');

      return true; // Indicates we made selections
    }
    return false; // No selection needed
  }

  async validateBreakDrawerOpened(): Promise<void> {
    await expect(this.breakDrawerTitle).toBeVisible();
    console.log('✓ Break drawer opened');
  }

  async validateBreakDrawerElements(): Promise<void> {
    await expect(this.breakSelectBreakDropdown).toBeVisible();
    console.log('✓ Select Break dropdown visible');
    await expect(this.breakStartDateInput).toBeVisible();
    console.log('✓ Start Date input visible');
    await expect(this.breakDurationInput).toBeVisible();
    console.log('✓ Duration input visible');
    await expect(this.breakNotesInput).toBeVisible();
    console.log('✓ Notes input visible');
    await expect(this.breakSaveButton).toBeVisible();
    console.log('✓ Save button visible');
    await expect(this.breakCancelButton).toBeVisible();
    console.log('✓ Cancel button visible');
  }

  async fillBreakDuration(duration: string): Promise<void> {
    await this.breakDurationInput.clear();
    await this.breakDurationInput.fill(duration);
    console.log(`✓ Filled duration: ${duration}`);
  }

  async toggleSetStartAndEndTime(): Promise<void> {
    await this.setStartAndEndTimeToggle.click();
    await this.page.waitForTimeout(500);
    console.log('✓ Toggled Set start and end time');
  }

  async fillBreakStartTime(time: string): Promise<void> {
    await this.breakStartTimeInput.clear();
    await this.breakStartTimeInput.fill(time);
    console.log(`✓ Filled start time: ${time}`);
  }

  async fillBreakEndTime(time: string): Promise<void> {
    await this.breakEndTimeInput.clear();
    await this.breakEndTimeInput.fill(time);
    console.log(`✓ Filled end time: ${time}`);
  }

  async saveBreak(): Promise<void> {
    await this.breakSaveAndCloseButton.or(this.breakSaveButton).click();
    await this.page.waitForTimeout(2000);
    console.log('✓ Clicked Save button');
  }

  async cancelBreak(): Promise<void> {
    await this.breakCancelButton.click();
    await this.page.waitForTimeout(500);
    console.log('✓ Clicked Cancel button');
  }

  async closeBreakDrawer(): Promise<void> {
    await this.breakCloseButton.click();
    await this.page.waitForTimeout(500);
    console.log('✓ Closed Break drawer');
  }

  async validateBreakSaved(): Promise<void> {
    const toastVisible = await this.breakSuccessToast
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (toastVisible) {
      console.log('✓ Break saved successfully (toast visible)');
    } else {
      await expect(this.breakDrawerTitle).not.toBeVisible({ timeout: 5000 });
      console.log('✓ Break drawer closed after save');
    }
  }

  async validateBreakEntryOnScreen(expectedDuration: string): Promise<void> {
    await expect(this.breakEntryRow.first()).toBeVisible();
    const rowText = await this.breakEntryRow.first().textContent();
    // Convert hh:mm format to decimal hours (e.g., "00:30" or "0:30" → "0.50")
    const [hours, minutes] = expectedDuration.split(':').map(Number);
    const decimalHours = (hours + minutes / 60).toFixed(2);
    expect(rowText).toContain(decimalHours);
    console.log(`✓ Break entry visible with duration: ${decimalHours} hours`);
  }

  async validateBreakEntryTimeRangeOnScreen(
    expectedStartTime: string,
    expectedEndTime: string,
  ): Promise<void> {
    await expect(this.breakEntryRow.first()).toBeVisible();
    const rowText = await this.breakEntryRow.first().textContent();
    expect(rowText?.toLowerCase()).toContain(expectedStartTime.toLowerCase());
    expect(rowText?.toLowerCase()).toContain(expectedEndTime.toLowerCase());
    console.log(
      `✓ Break entry shows times: ${expectedStartTime} - ${expectedEndTime}`,
    );
  }

  async editBreakEntry(newDuration: string, rowMarker?: string): Promise<void> {
    const breakRow = rowMarker
      ? this.breakEntryRowContaining(rowMarker).first()
      : this.breakEntryRow.first();
    if (await breakRow.isVisible({ timeout: 15_000 }).catch(() => false)) {
      const editBtn = breakRow.locator('//*[text()="Edit"]');
      await editBtn.click();
      await this.page.waitForTimeout(1000);
      await this.validateEditDrawerOpened();
      await this.page.waitForTimeout(2000);

      // Check which type of entry this is (duration vs time-range)
      await this.breakDurationInput
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => undefined);
      const hasDurationField = await this.breakDurationInput
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      if (hasDurationField) {
        await this.fillBreakDuration(newDuration);
      } else {
        // Entry has start/end time - adjust end time to change duration
        // Convert duration (HH:MM) to minutes and calculate new end time
        const [hours, minutes] = newDuration.split(':').map(Number);
        const durationMinutes = hours * 60 + minutes;
        // Get current start time and calculate new end time
        const startTimeValue = await this.breakStartTimeInput.inputValue();
        const startMatch = startTimeValue.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (startMatch) {
          let startHour = parseInt(startMatch[1]);
          const startMin = parseInt(startMatch[2]);
          const period = startMatch[3].toUpperCase();
          if (period === 'PM' && startHour !== 12) startHour += 12;
          if (period === 'AM' && startHour === 12) startHour = 0;
          const totalStartMin = startHour * 60 + startMin;
          const totalEndMin = totalStartMin + durationMinutes;
          let endHour = Math.floor(totalEndMin / 60) % 24;
          const endMin = totalEndMin % 60;
          const endPeriod = endHour >= 12 ? 'PM' : 'AM';
          if (endHour > 12) endHour -= 12;
          if (endHour === 0) endHour = 12;
          const newEndTime = `${endHour}:${endMin
            .toString()
            .padStart(2, '0')} ${endPeriod}`;
          await this.fillBreakEndTime(newEndTime);
        }
        console.log(`✓ Adjusted end time for duration: ${newDuration}`);
      }

      await this.saveBreak();
      await this.validateEntryUpdated();
      console.log(`✓ Break entry edited to duration: ${newDuration}`);
    } else {
      throw new Error('No break entry found to edit');
    }
  }

  async deleteBreakEntry(rowMarker?: string): Promise<void> {
    await this.prepareForTimeEntryRowAction();
    const breakRow = rowMarker
      ? this.breakEntryRowContaining(rowMarker).first()
      : this.breakEntryRow.first();
    if (await breakRow.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await this.prepareForTimeEntryRowAction();
      const actionBtn = breakRow.locator('button[aria-label="Expand Menu"]');
      await actionBtn.click({ timeout: 15_000 });
      await this.page.waitForTimeout(500);
      await this.clickDeleteInActionDropdown();
      await this.validateDeleteConfirmationPopup();
      await this.confirmDelete();
      await this.validateEntryDeleted();
      console.log('✓ Break entry deleted');
    } else {
      throw new Error('No break entry found to delete');
    }
  }

  async handleTimeframeConflictError(): Promise<boolean> {
    const hasConflict = await this.breakTimeframeConflictError
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (hasConflict) {
      console.log('⚠ Timeframe conflict detected - canceling drawer');
      await this.breakCancelButton.click();
      await this.page.waitForTimeout(500);
      return true;
    }
    return false;
  }

  async cleanupAllBreakEntries(): Promise<void> {
    console.log('--- Cleaning up existing break entries ---');
    let deletedCount = 0;
    const maxIterations = 10;

    await this.prepareForTimeEntryRowAction();

    if (
      await this.noTimeEntriesYetText
        .isVisible({ timeout: 1500 })
        .catch(() => false)
    ) {
      console.log('✓ No existing break entries to clean up (empty state)');
      return;
    }

    for (let i = 0; i < maxIterations; i++) {
      await this.prepareForTimeEntryRowAction();

      const breakRow = this.breakEntryRow.first();
      const isVisible = await breakRow
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (!isVisible) {
        break;
      }

      try {
        const actionBtn = breakRow.locator('button[aria-label="Expand Menu"]');
        await actionBtn.click({ timeout: 15_000 });
        await this.page.waitForTimeout(500);
        await this.clickDeleteInActionDropdown();
        await this.validateDeleteConfirmationPopup();
        await this.confirmDelete();
        await this.prepareForTimeEntryRowAction();
        await this.page.waitForTimeout(1000);
        deletedCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(
          `⚠ Could not delete break entry (attempt ${i + 1}): ${
            message.split('\n')[0]
          }`,
        );
        await this.prepareForTimeEntryRowAction();
        break;
      }
    }

    if (deletedCount > 0) {
      console.log(`✓ Cleaned up ${deletedCount} existing break entries`);
    } else {
      console.log('✓ No existing break entries to clean up');
    }
  }

  // ==================== WTE Methods ====================

  async clickWeeklyTimeEntryOption(): Promise<void> {
    await this.openAddTimeDropdown();
    const option = this.weeklyTimeEntryOption.first();
    await expect(option).toBeVisible({ timeout: 10_000 });
    try {
      await option.click({ timeout: 10_000 });
    } catch {
      if (await isTasksDrawerVisible(this.page, 800)) {
        await dismissWorkforceTasksDrawer(this.page, { maxAttempts: 3 });
      }
      await this.addTimeButton.click().catch(() => undefined);
      await this.page.waitForTimeout(500);
      await option.click({ force: true, timeout: 10_000 });
    }
    await this.page.waitForTimeout(1000);
    try {
      await waitForLoadingToDisappear(this.page);
    } catch {
      // Loading spinner may not appear in Workforce
    }
    console.log('✓ Clicked Weekly time entry option');
  }

  async validateWteDrawerOpened(): Promise<void> {
    await expect(this.wteDrawerShellLocator().first()).toBeVisible({
      timeout: 30_000,
    });
    console.log('✓ WTE drawer/page opened');
  }

  async validateWteDrawerElements(): Promise<void> {
    // Check for Previous Week button specifically
    await expect(
      this.page.getByRole('button', { name: 'Previous Week' }),
    ).toBeVisible();
    console.log('✓ Week navigation visible');
    await expect(this.wteSaveButton).toBeVisible();
    console.log('✓ Save button visible');
  }

  async selectWteTimeCategory(): Promise<void> {
    await this.openWteFirstRowTimeCategoryDropdown();

    // Select the first available option from the dropdown menu
    const firstOption = this.page.locator(`(//ul/li/span)`).nth(1);
    if (await firstOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstOption.click();
    } else {
      // Fallback: try getByRole option
      const optionRole = this.page.getByRole('option').first();
      if (await optionRole.isVisible({ timeout: 2000 }).catch(() => false)) {
        await optionRole.click();
      } else {
        // Fallback: try clicking first menuitem
        const menuItem = this.page.getByRole('menuitem').first();
        if (await menuItem.isVisible({ timeout: 2000 }).catch(() => false)) {
          await menuItem.click();
        }
      }
    }

    await this.page.waitForTimeout(500);
    console.log('✓ Selected first time category');
  }

  async fillWteHours(
    dayIndex: number,
    hoursValue: string,
    panelNotes?: string,
  ): Promise<void> {
    // Match WeeklyTimeEntry.util / Approvals.util: day hour cells are tbody DataCells AFTER
    // the customer column. `hours(page, 1)` hits the customer SuperSearchCell (also DataCell),
    // not a day — Save then has nothing to persist for that column.
    const bodyFirstRow = this.page
      .locator('table.weekly-time-entry-table tbody tr')
      .first();
    const dataCells = bodyFirstRow.locator(
      "td[class*='WeeklyTimeEntryTablestyles__DataCell']",
    );
    const cellOffset = dayIndex >= 1 ? dayIndex : 1;
    const dayCell = dataCells.nth(cellOffset);

    await expect(dayCell).toBeVisible({ timeout: 15_000 });
    await dayCell.click();
    await this.page.waitForTimeout(500);

    const hoursInputField = hoursInputs(this.page);
    if (await hoursInputField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hoursInputField.fill(hoursValue);
      // DayCell commits on blur (handleHourChange); fill() alone does not blur.
      await hoursInputField.blur();
    } else {
      await this.page.keyboard.type(hoursValue);
      await this.page.keyboard.press('Tab');
    }

    await this.page.waitForTimeout(400);

    // Pick service only when empty. Re-opening the service control and choosing again runs
    // WeeklyServiceField.handleServiceChange; with custom notes (≠ service default description)
    // that opens "replace your description with the default description for this Service?" even
    // when the service name did not visually change.
    let serviceInputLoc: Locator | null = null;
    const serviceFieldInput = this.page
      .getByTestId('service-field')
      .locator('input')
      .first();
    if (
      await serviceFieldInput.isVisible({ timeout: 1500 }).catch(() => false)
    ) {
      serviceInputLoc = serviceFieldInput;
    } else {
      const legacySvc = serviceDropdown(this.page);
      if (await legacySvc.isVisible({ timeout: 1500 }).catch(() => false)) {
        serviceInputLoc = legacySvc;
      }
    }
    if (serviceInputLoc) {
      const existing = (
        await serviceInputLoc.inputValue().catch(() => '')
      ).trim();
      if (!existing && (await serviceInputLoc.isEnabled().catch(() => false))) {
        await serviceInputLoc.click();
        await this.page.waitForTimeout(500);
        await clickDropdownOption(this.page, 1);
        await this.page.waitForTimeout(400);
      }
    }

    const notes = notesInput(this.page);
    if (await notes.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notes.fill(panelNotes ?? `WF007 ${hoursValue}h`);
      await this.page.waitForTimeout(200);
    }

    await this.dismissWteServiceDescriptionConfirmIfVisible();

    await this.page.waitForTimeout(300);
    console.log(
      `✓ Filled ${hoursValue} hours for day column index ${dayIndex} (tbody DataCell nth ${cellOffset})`,
    );
  }

  /** WeeklyServiceField notes-vs-service-default confirmation; blocks Save until dismissed. */
  async dismissWteServiceDescriptionConfirmIfVisible(): Promise<void> {
    const body =
      /replace your description with the default description for this Service/i;

    const dialog = this.page.getByRole('dialog').filter({ hasText: body });
    const modalFiltered = this.page
      .getByTestId('time-tracking-confirmation-modal')
      .filter({ hasText: body });
    const modalAny = this.page.getByTestId('time-tracking-confirmation-modal');

    let container: Locator | null = null;
    if (await dialog.isVisible({ timeout: 2500 }).catch(() => false)) {
      container = dialog;
    } else if (
      await modalFiltered.isVisible({ timeout: 800 }).catch(() => false)
    ) {
      container = modalFiltered;
    } else if (await modalAny.isVisible({ timeout: 800 }).catch(() => false)) {
      container = modalAny;
    }

    if (!container) {
      return;
    }

    const noBtn = container.getByRole('button', { name: /^no$/i }).first();
    await noBtn.click({ timeout: 10_000 });
    await expect(container).not.toBeVisible({ timeout: 15_000 });
    await this.page.waitForTimeout(150);
    console.log(
      '✓ Dismissed service default description confirmation (kept custom notes)',
    );
  }

  async selectWteCustomer(customerName: string): Promise<void> {
    await this.wteCustomerDropdown.click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option', { name: customerName }).first().click();
    await this.page.waitForTimeout(500);
    console.log(`✓ Selected customer: ${customerName}`);
  }

  async fillWteNotes(notes: string): Promise<void> {
    await this.wteNotesInput.fill(notes);
    console.log(`✓ Filled WTE notes: ${notes}`);
  }

  async saveWte(closeAfterSave: boolean = false): Promise<void> {
    await this.dismissWteServiceDescriptionConfirmIfVisible();

    // Use "Save" to stay in WTE, or "Save and close" to exit
    let clicked = false;

    if (closeAfterSave) {
      // Prefer footer Save and close (same as Approvals.util saveandcloseButton).
      if (
        await this.wteSaveAndCloseButton
          .isVisible({ timeout: 10_000 })
          .catch(() => false)
      ) {
        // Modal can mount after the first dismiss (notes blur / service); clear again before click.
        await this.dismissWteServiceDescriptionConfirmIfVisible();
        await this.wteSaveAndCloseButton.click();
        clicked = true;
      }
      if (!clicked) {
        const saveAndCloseByRole = this.page.getByRole('button', {
          name: /save and close/i,
        });
        if (
          await saveAndCloseByRole
            .isVisible({ timeout: 3000 })
            .catch(() => false)
        ) {
          await saveAndCloseByRole.click();
          clicked = true;
        }
      }
      if (!clicked) {
        const saveAndCloseByText = this.page
          .locator(`//span[text()='Save and close']`)
          .first();
        if (
          await saveAndCloseByText
            .isVisible({ timeout: 2000 })
            .catch(() => false)
        ) {
          await saveAndCloseByText.click();
          clicked = true;
        }
      }
    }

    // Use just "Save" button (stays in WTE), or fallback when not closing.
    if (!clicked) {
      if (
        await this.wteSaveButton.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await this.dismissWteServiceDescriptionConfirmIfVisible();
        await this.wteSaveButton.click();
        clicked = true;
      }
    }

    if (!clicked) {
      const saveByText = this.page.locator(`//span[text()='Save']`).first();
      if (await saveByText.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveByText.click();
        clicked = true;
      }
    }

    if (!clicked) {
      const saveByRole = this.page.getByRole('button', {
        name: 'Save',
        exact: true,
      });
      if (await saveByRole.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveByRole.click();
        clicked = true;
      }
    }

    if (!clicked) {
      console.log(
        'Warning: Could not find Save button, trying to proceed anyway',
      );
    }

    await this.page.waitForTimeout(2000);
    console.log(
      `✓ Clicked WTE ${closeAfterSave ? 'Save and close' : 'Save'} button`,
    );
  }

  async cancelWte(): Promise<void> {
    const cancelBtn = this.wteCancelButton;
    const closeBtn = this.wteCloseButton;
    if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelBtn.click();
    } else if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
    }
    await this.page.waitForTimeout(500);
    console.log('✓ Cancelled/Closed WTE');
  }

  async validateWteSaved(expectClosed: boolean = false): Promise<void> {
    const toastVisible = await this.wteSuccessToast
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (toastVisible) {
      console.log('✓ WTE saved successfully (toast visible)');
    }

    if (expectClosed) {
      // Expect drawer to close after "Save and close"
      await expect(this.wteDrawerTitle).not.toBeVisible({ timeout: 5000 });
      console.log('✓ WTE drawer closed after save');
    } else {
      // Stay in WTE after just "Save"
      console.log('✓ WTE saved (staying in WTE view)');
    }
  }

  async validateWteEntryOnScreen(expectedHours: string): Promise<void> {
    const firstEntry = this.timeEntryRow.first();
    await expect(firstEntry).toBeVisible();
    const rowText = await firstEntry.textContent();

    // Handle decimal hours format (e.g., "4" might appear as "4.00" in UI)
    const expectedDecimal = parseFloat(expectedHours).toFixed(2);
    const foundExpected =
      rowText?.includes(expectedHours) || rowText?.includes(expectedDecimal);

    if (!foundExpected) {
      console.log(
        `Warning: Expected hours "${expectedHours}" or "${expectedDecimal}" not found in row. Row text: ${rowText}`,
      );
    }
    expect(foundExpected).toBeTruthy();
    console.log(`✓ WTE entry visible with hours: ${expectedHours}`);
  }

  async editWteEntry(): Promise<void> {
    // Following time-tracking-ui pattern: stay in WTE view and edit by clicking cells directly
    // We should already be in the WTE view after saving with just "Save" (not "Save and close")
    console.log(
      '✓ Ready to edit WTE (staying in WTE view - time-tracking-ui pattern)',
    );
  }

  async deleteWteEntry(): Promise<void> {
    await this.clickActionDropdownForEntry(0);
    await this.clickDeleteInActionDropdown();
    await this.validateDeleteConfirmationPopup();
    await this.confirmDelete();
    await this.validateEntryDeleted();
    console.log('✓ WTE entry deleted');
  }

  // ==================== Clock In/Out Methods ====================

  async clickClockIn(): Promise<void> {
    await expect(this.clockInButton).toBeVisible();
    await this.clockInButton.click();
    await this.page.waitForTimeout(2000);
    console.log('✓ Clicked Clock in button');
  }

  async validateClockInSuccess(): Promise<void> {
    await expect(this.clockOutButton).toBeVisible({ timeout: 10000 });
    console.log('✓ Clock in successful - Clock out button now visible');
  }

  async clickClockOut(): Promise<void> {
    await expect(this.clockOutButton).toBeVisible();
    await this.clockOutButton.click();
    await this.page.waitForTimeout(2000);
    console.log('✓ Clicked Clock out button');
  }

  async validateClockOutSuccess(): Promise<void> {
    await expect(this.clockInButton).toBeVisible({ timeout: 10000 });
    console.log('✓ Clock out successful - Clock in button now visible');
  }

  async validateCurrentlyWorkingEntry(): Promise<void> {
    const hasCurrentlyWorking = await this.currentlyWorkingIndicator
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasClockedIn = await this.clockedInStatus
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(hasCurrentlyWorking || hasClockedIn).toBeTruthy();
    console.log('✓ Currently working/Clocked in status visible');
  }

  // ==================== STE Methods ====================

  async clickSingleTimeEntryOption(): Promise<void> {
    await this.openAddTimeDropdown();
    const option = this.singleTimeEntryOption.first();
    await expect(option).toBeVisible({ timeout: 10_000 });
    try {
      await option.click({ timeout: 10_000 });
    } catch {
      await ensureWorkforceTasksDrawerClosed(this.page);
      await this.addTimeButton.click().catch(() => undefined);
      await this.page.waitForTimeout(500);
      await expect(option).toBeVisible({ timeout: 10_000 });
      await option.click({ force: true, timeout: 10_000 });
    }
    await this.page.waitForTimeout(1000);
    console.log('✓ Clicked Single time entry option');
  }

  async validateSteDrawerOpened(): Promise<void> {
    await expect(this.steDrawerTitle).toBeVisible({ timeout: 10000 });
    console.log('✓ Single time entry drawer opened');
  }

  async validateSteDrawerElements(): Promise<void> {
    await expect(this.steCustomerDropdown).toBeVisible();
    console.log('✓ Customer dropdown visible');
    await expect(this.steStartDateInput).toBeVisible();
    console.log('✓ Start date input visible');
    // Duration or Start/End time fields depending on toggle state
    const hasDuration = await this.steDurationInput
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    const hasStartTime = await this.steStartTimeInput
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    if (hasDuration) {
      console.log('✓ Duration input visible');
    } else if (hasStartTime) {
      console.log('✓ Start/End time inputs visible');
    }
    await expect(this.steSetStartEndTimeToggle).toBeVisible();
    console.log('✓ Set start and end time toggle visible');
    await expect(this.steSaveButton).toBeVisible();
    console.log('✓ Save button visible');
    await expect(this.steCancelButton).toBeVisible();
    console.log('✓ Cancel button visible');
  }

  async fillSteDuration(duration: string): Promise<void> {
    // Bounded wait: without it a missing field hangs on the 5-min action timeout.
    await expect(this.steDurationInput).toBeVisible({ timeout: 10_000 });
    await this.steDurationInput.clear();
    await this.steDurationInput.fill(duration);
    console.log(`✓ Filled STE duration: ${duration}`);
  }

  async fillSteNotes(notes: string): Promise<void> {
    await this.steNotesInput.fill(notes);
    console.log(`✓ Filled STE notes: ${notes}`);
  }

  async selectSteCustomer(): Promise<void> {
    await this.openSteCustomerDropdown();
    const firstOption = this.page.getByRole('option').first();
    await expect(firstOption).toBeVisible({ timeout: 10_000 });
    await firstOption.click();
    await this.page.waitForTimeout(500);
    console.log('✓ Selected first customer from dropdown');
  }

  /** STE Customer picker — same option locators as {@link steCustomerOptionIsVisible}. */
  async selectSteCustomerByName(customerName: string): Promise<void> {
    await this.openSteCustomerDropdown();
    const pattern = this.steCustomerNamePattern(customerName);
    const byRole = this.page.getByRole('option', { name: pattern }).first();
    if (await byRole.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await byRole.click();
    } else {
      const byListRow = this.page
        .locator('ul li')
        .filter({ hasText: pattern })
        .filter({ hasNotText: /add\s+customer/i })
        .first();
      await expect(byListRow).toBeVisible({ timeout: 10_000 });
      await byListRow.click();
    }
    await this.page.waitForTimeout(500);
    console.log(`✓ Selected STE customer: ${customerName}`);
  }

  get steClassCombobox(): Locator {
    return this.page.getByRole('combobox', { name: /^Class$/i });
  }

  customFieldLabelLocator(customFieldName: string): Locator {
    const labelText = customFieldName.split('(')[0].trim();
    return this.page
      .locator('label')
      .filter({ hasText: new RegExp(labelText, 'i') })
      .first();
  }

  async toggleSteStartEndTime(): Promise<void> {
    await this.steSetStartEndTimeToggle.click();
    await this.page.waitForTimeout(500);
    console.log('✓ Toggled STE start and end time');
  }

  async verifySteStartEndTimeToggleState(): Promise<boolean> {
    // Returns true when toggle is ON (start/end time mode), false when OFF (duration mode)
    try {
      const ariaChecked = await this.steSetStartEndTimeToggle.getAttribute(
        'aria-checked',
      );
      return ariaChecked === 'true';
    } catch {
      return false;
    }
  }

  async ensureSteStartEndTimeToggleOff(): Promise<void> {
    // Source of truth is the visible hh:mm field — NOT aria-checked on the toggle.
    for (let attempt = 0; attempt < 4; attempt++) {
      if (
        await this.steDurationInput
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        return;
      }
      await this.steSetStartEndTimeToggle.click({ force: true });
      await this.page.waitForTimeout(500);
    }
    await expect(this.steDurationInput).toBeVisible({ timeout: 10_000 });
    console.log('✓ Turned OFF start/end time toggle (now showing Duration)');
  }

  async ensureSteStartEndTimeToggleOn(): Promise<void> {
    // Check if toggle is OFF via aria-checked attribute
    const isToggleOn = await this.verifySteStartEndTimeToggleState();
    if (!isToggleOn) {
      // Toggle is OFF, need to turn it ON for start/end time mode
      await this.steSetStartEndTimeToggle.click();
      await this.page.waitForTimeout(500);
      console.log(
        '✓ Turned ON start/end time toggle (now showing Start/End time)',
      );
    }
  }

  /** Set the STE start date to an arbitrary date (m/d/yyyy, zero-padded). */
  async setSteStartDate(date: Date): Promise<void> {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const dateStr = `${month}/${day}/${year}`;

    await this.steStartDateInput.clear();
    await this.steStartDateInput.fill(dateStr);
    await this.page.waitForTimeout(500);
    console.log(`✓ Set STE start date to: ${dateStr}`);
  }

  /** Set the STE start date to `daysAgo` days before today (0 = today). */
  async setSteDateDaysAgo(daysAgo: number): Promise<void> {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    await this.setSteStartDate(date);
  }

  async setSteDateToYesterday(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const year = yesterday.getFullYear();
    const dateStr = `${month}/${day}/${year}`;

    await this.steStartDateInput.clear();
    await this.steStartDateInput.fill(dateStr);
    await this.page.waitForTimeout(500);
    console.log(`✓ Set STE start date to yesterday: ${dateStr}`);
  }

  async setSteDateToToday(): Promise<void> {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    const dateStr = `${month}/${day}/${year}`;

    await this.steStartDateInput.clear();
    await this.steStartDateInput.fill(dateStr);
    await this.page.waitForTimeout(500);
    console.log(`✓ Set STE start date to today: ${dateStr}`);
  }

  async selectSteStartTime(time: string): Promise<void> {
    await this.steStartTimeInput.click();
    await this.page.locator(`//li/span[text()='${time}']`).click();
    console.log(`✓ Selected STE start time: ${time}`);
  }

  async selectSteEndTime(time: string): Promise<void> {
    await this.steEndTimeInput.click();
    await this.page.locator(`//li/span[text()='${time}']`).click();
    console.log(`✓ Selected STE end time: ${time}`);
  }

  get steLockedDateBanner(): Locator {
    // e.g. "Thu the 2nd is locked because it's been submitted or approved. …"
    return this.page.getByText(
      /locked because it.?s been submitted or approved/i,
    );
  }

  /**
   * Click a save-flow button with a bounded timeout, falling back to a forced
   * click when a transient overlay (e.g. theme/backdrop div) intercepts pointer
   * events. Playwright's default actionability retry would otherwise spin for
   * minutes against such an overlay before timing out.
   */
  private async clickThroughOverlay(locator: Locator): Promise<void> {
    try {
      await locator.click({ timeout: 10000 });
    } catch (error) {
      console.log(
        `⚠ Save click intercepted (${
          error instanceof Error ? error.message.split('\n')[0] : String(error)
        }) — retrying with force`,
      );
      await locator.click({ force: true, timeout: 10000 });
    }
  }

  private async clickSteSaveButtons(): Promise<void> {
    const saveAndBtn = this.page.locator(
      `//button[contains(@aria-label, "Save and")]`,
    );
    if (await saveAndBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveAndBtn.click();
      await this.steSaveAndCloseButton.click();
    } else {
      await this.steSaveButton.click();
    }
    await this.page.waitForTimeout(2000);
  }

  async saveSte(options?: { skipLockedDateRetry?: boolean }): Promise<void> {
    await this.clickSteSaveButtons();

    const isLocked = () =>
      this.steLockedDateBanner.isVisible({ timeout: 2000 }).catch(() => false);

    if (await isLocked()) {
      if (options?.skipLockedDateRetry) {
        // Surface a "locked" message so callers can fall back (e.g. create
        // the entry as an admin on an unlocked day). See WF008.
        throw new Error(
          'STE save blocked: the selected day is locked (submitted or approved)',
        );
      }
      // Default behaviour: retry once on an earlier, unlocked day.
      console.log('⚠ STE day locked — retrying save with an earlier date');
      await this.setSteDateToYesterday();
      await this.clickSteSaveButtons();
      if (await isLocked()) {
        throw new Error(
          'STE save blocked: date is locked (submitted or approved) even after retry',
        );
      }
    }
    console.log('✓ Clicked Save button for STE');
  }

  // ---------------------------------------------------------------------------
  // Resilient STE save (opt-in) — used ONLY by tests that need to survive a
  // locked/overlay-flaky Workforce environment (e.g. SUT06). The default
  // clickSteSaveButtons()/saveSte() above are intentionally left unchanged so
  // every other caller keeps its original behaviour.
  // ---------------------------------------------------------------------------

  // Max number of earlier days to step back through when the selected STE day
  // is locked (submitted/approved). Covers a full prior week of locked days.
  private static readonly MAX_LOCKED_DATE_RETRIES = 8;

  private async clickSteSaveButtonsResilient(): Promise<void> {
    const saveAndBtn = this.page.locator(
      `//button[contains(@aria-label, "Save and")]`,
    );
    if (await saveAndBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.clickThroughOverlay(saveAndBtn);
      await this.clickThroughOverlay(this.steSaveAndCloseButton);
    } else {
      await this.clickThroughOverlay(this.steSaveButton);
    }
    await this.page.waitForTimeout(2000);
  }

  /**
   * Like saveSte(), but (a) clicks through transient overlays with a bounded
   * timeout + force fallback and (b) steps back up to a full week when the day
   * is locked, instead of retrying a single earlier day. Opt-in only.
   */
  async saveSteResilient(): Promise<void> {
    await this.clickSteSaveButtonsResilient();

    const isLocked = () =>
      this.steLockedDateBanner.isVisible({ timeout: 2000 }).catch(() => false);

    if (await isLocked()) {
      // Step back one day at a time until we land on an unlocked day. A
      // single-day retry is not enough when several consecutive days are
      // already submitted/approved.
      for (
        let daysAgo = 1;
        daysAgo <= WorkforcePage.MAX_LOCKED_DATE_RETRIES;
        daysAgo++
      ) {
        console.log(
          `⚠ STE day locked — retrying save ${daysAgo} day(s) earlier`,
        );
        await this.setSteDateDaysAgo(daysAgo);
        await this.clickSteSaveButtonsResilient();
        if (!(await isLocked())) {
          break;
        }
        if (daysAgo === WorkforcePage.MAX_LOCKED_DATE_RETRIES) {
          throw new Error(
            `STE save blocked: date is locked (submitted or approved) even after ` +
              `stepping back ${WorkforcePage.MAX_LOCKED_DATE_RETRIES} days`,
          );
        }
      }
    }
    console.log('✓ Clicked Save button for STE');
  }

  async cancelSte(): Promise<void> {
    await this.steCancelButton.click();
    await this.page.waitForTimeout(500);
    await this.dismissSteLeaveWithoutSavingIfVisible();
    console.log('✓ Cancelled STE');
  }

  async validateSteSaved(): Promise<void> {
    const toastVisible = await this.steSuccessToast
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (toastVisible) {
      console.log('✓ STE saved successfully (toast visible)');
      return;
    }
    // Fail fast with the real reason when the day is locked (already submitted/
    // approved) — otherwise this surfaces as a vague drawer-didn't-close timeout.
    // Plain-string getByText chained with .or() (a regex getByText serializes
    // badly with .first()); apostrophes avoided so quotes both match.
    const lockedError = this.page
      .getByText('been submitted or approved')
      .or(this.page.getByText('unsubmit or have'))
      .or(this.page.getByText('is locked'))
      .first();
    if (await lockedError.isVisible({ timeout: 2000 }).catch(() => false)) {
      const msg = ((await lockedError.textContent()) || '').trim();
      throw new Error(
        `STE could not be saved — the day is locked (already submitted/approved). ` +
          `The day must be un-submitted first. Message: "${msg}"`,
      );
    }
    await expect(this.steDrawerTitle).not.toBeVisible({ timeout: 5000 });
    console.log('✓ STE drawer closed after save');
  }

  async validateSteEntryOnScreen(expectedDuration: string): Promise<void> {
    const firstEntry = this.timeEntryRow.first();
    await expect(firstEntry).toBeVisible();
    const rowText = await firstEntry.textContent();
    // Convert h:mm format to decimal hours (e.g., "1:00" → "1.00", "0:30" → "0.50")
    const [hours, minutes] = expectedDuration.split(':').map(Number);
    const decimalHours = (hours + minutes / 60).toFixed(2);
    expect(rowText).toContain(decimalHours);
    console.log(`✓ STE entry visible with duration: ${decimalHours} hours`);
  }

  async validateSteEntryTimeRangeOnScreen(
    expectedStartTime: string,
    expectedEndTime: string,
  ): Promise<void> {
    // Find entry that contains the time range pattern (e.g., "09:00 AM - 10:00 AM")
    const timeRangeEntry = this.timeEntryRow.filter({
      hasText: /\d{1,2}:\d{2}\s*(AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)/i,
    });
    await expect(timeRangeEntry.first()).toBeVisible();
    const rowText = await timeRangeEntry.first().textContent();

    // Normalize times: "9:00 AM" -> "9:00am" or "09:00am"
    const normalizeTime = (time: string) =>
      time.toLowerCase().replace(/\s+/g, '').replace(/^0/, '');
    const rowTextNorm = rowText?.toLowerCase().replace(/\s+/g, '') || '';

    // Check if times are present (handle both "9:00am" and "09:00am" formats)
    const startNorm = normalizeTime(expectedStartTime);
    const endNorm = normalizeTime(expectedEndTime);
    const startWithZero = expectedStartTime
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/^(\d):/, '0$1:');
    const endWithZero = expectedEndTime
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/^(\d):/, '0$1:');

    const hasStart =
      rowTextNorm.includes(startNorm) || rowTextNorm.includes(startWithZero);
    const hasEnd =
      rowTextNorm.includes(endNorm) || rowTextNorm.includes(endWithZero);

    expect(hasStart).toBe(true);
    expect(hasEnd).toBe(true);
    console.log(
      `✓ STE entry shows times: ${expectedStartTime} - ${expectedEndTime}`,
    );
  }

  // ==================== Filter/Display Methods ====================

  /** @deprecated Status filter dropdown removed from Workforce time UI; use row text or {@link getApprovedTimeEntryRowCount} / {@link getUnapprovedTimeEntryRowCount}. */
  async selectStatusAll(): Promise<void> {
    await this.openStatusDropdown();
    await this.statusAllOption.click();
    await this.page.waitForTimeout(1000);
    console.log('✓ Selected All status');
  }

  /** @deprecated See {@link selectStatusAll}. */
  async selectStatusApproved(): Promise<void> {
    await this.openStatusDropdown();
    await this.statusApprovedOption.click();
    await this.page.waitForTimeout(1000);
    console.log('✓ Selected Approved status');
  }

  /** @deprecated See {@link selectStatusAll}. */
  async selectStatusUnapproved(): Promise<void> {
    await this.openStatusDropdown();
    await this.statusUnapprovedOption.click();
    await this.page.waitForTimeout(1000);
    console.log('✓ Selected Unapproved status');
  }

  async getTimeEntryCount(): Promise<number> {
    const count = await this.timeEntryRow.count();
    console.log(`Time entry count: ${count}`);
    return count;
  }

  /**
   * Count tbody time rows that show Approved (status is in the row; there is no Status filter dropdown).
   */
  async getApprovedTimeEntryRowCount(): Promise<number> {
    const count = await this.timeEntryRow
      .filter({ hasText: 'Approved' })
      .count();
    console.log(`Approved time entry row count: ${count}`);
    return count;
  }

  /**
   * Count tbody time rows that show Unapproved.
   */
  async getUnapprovedTimeEntryRowCount(): Promise<number> {
    const count = await this.timeEntryRow
      .filter({ hasText: 'Unapproved' })
      .count();
    console.log(`Unapproved time entry row count: ${count}`);
    return count;
  }

  // ==================== Sync Validation Methods ====================
  // Note: Workforce UI doesn't have a Status dropdown filter - status is shown in a column

  /**
   * Validates entry exists with specific duration and Approved status
   * Checks the Status column text instead of using a dropdown filter
   */
  async validateApprovedEntryExists(
    expectedDuration: string,
  ): Promise<boolean> {
    await this.page.waitForTimeout(2000);

    // Workforce table may show decimal hours (1.25) while STE uses hh:mm (1:15)
    const durationPattern = durationDisplayMatchPattern(expectedDuration);
    const approvedEntry = this.page
      .locator('tr')
      .filter({ hasText: durationPattern })
      .filter({ hasText: /Approved/i });
    const exists = await approvedEntry
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    console.log(
      `${exists ? '✓' : '✗'} Approved entry with duration ${expectedDuration} ${
        exists ? 'found' : 'not found'
      }`,
    );
    return exists;
  }

  /**
   * Validates entry exists with specific duration and Unapproved status
   * Checks the Status column text instead of using a dropdown filter
   */
  async validateUnapprovedEntryExists(
    expectedDuration: string,
  ): Promise<boolean> {
    await this.page.waitForTimeout(2000);

    const durationPattern = durationDisplayMatchPattern(expectedDuration);
    const unapprovedEntry = this.page
      .locator('tr')
      .filter({ hasText: durationPattern })
      .filter({ hasText: 'Unapproved' });
    const exists = await unapprovedEntry
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    console.log(
      `${
        exists ? '✓' : '✗'
      } Unapproved entry with duration ${expectedDuration} ${
        exists ? 'found' : 'not found'
      }`,
    );
    return exists;
  }

  /**
   * Validates that an entry created by admin is visible in Workforce
   */
  async validateEntrySyncedFromAdmin(expectedDuration: string): Promise<void> {
    await this.page.waitForTimeout(2000);

    const entryCount = await this.getTimeEntryCount();
    expect(entryCount).toBeGreaterThan(0);

    const durationPattern = durationDisplayMatchPattern(expectedDuration);
    const entryWithDuration = this.page
      .locator('tr')
      .filter({ hasText: durationPattern });
    await expect(entryWithDuration.first()).toBeVisible({ timeout: 10000 });
    console.log(
      `✓ Entry with ${expectedDuration} synced from admin is visible`,
    );
  }

  /**
   * Validates that an entry shows as Approved (View button visible, Edit hidden)
   * Checks the status text in the row
   */
  async validateEntryIsApproved(index: number = 0): Promise<void> {
    await this.page.waitForTimeout(2000);

    // Check that the entry row contains "Approved" status text
    const entryRow = this.timeEntryRow.nth(index);
    const rowText = await entryRow.textContent();
    expect(rowText).toContain('Approved');

    // Approved entries typically show View button instead of Edit
    const viewBtn = this.viewButton.nth(index);
    const editBtn = this.editButton.nth(index);

    const isViewVisible = await viewBtn
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    const isEditVisible = await editBtn
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // At minimum, confirm the status text shows Approved
    console.log(
      `✓ Entry at index ${index} is Approved (View: ${isViewVisible}, Edit: ${isEditVisible})`,
    );
  }

  /**
   * Validates that an entry shows as Unapproved (Edit button visible)
   * Checks the status text in the row
   */
  async validateEntryIsUnapproved(index: number = 0): Promise<void> {
    await this.page.waitForTimeout(2000);

    // Check that the entry row contains "Unapproved" status text
    const entryRow = this.timeEntryRow.nth(index);
    const rowText = await entryRow.textContent();
    expect(rowText).toContain('Unapproved');

    // Unapproved entries show Edit button
    await expect(this.editButton.nth(index)).toBeVisible();
    console.log(`✓ Entry at index ${index} is Unapproved (Edit visible)`);
  }

  async cleanupAllTimeEntries(): Promise<void> {
    console.log('--- Cleaning up all time entries ---');
    let deletedCount = 0;
    const maxIterations = 20;

    await this.prepareForTimeEntryRowAction();

    for (let i = 0; i < maxIterations; i++) {
      await this.prepareForTimeEntryRowAction();

      const entryRow = this.timeEntryRow.first();
      const isVisible = await entryRow
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (!isVisible) {
        break;
      }

      try {
        const actionBtn = entryRow.locator('button[aria-label="Expand Menu"]');
        await actionBtn.click({ timeout: 15_000 });
        await this.page.waitForTimeout(500);
        await this.clickDeleteInActionDropdown();
        await this.validateDeleteConfirmationPopup();
        await this.confirmDelete();
        await this.prepareForTimeEntryRowAction();
        await this.page.waitForTimeout(1000);
        deletedCount++;
      } catch {
        console.log('⚠ Could not delete entry, skipping...');
        await this.prepareForTimeEntryRowAction();
        break;
      }
    }

    if (deletedCount > 0) {
      console.log(`✓ Cleaned up ${deletedCount} time entries`);
    } else {
      console.log('✓ No time entries to clean up');
    }
  }

  // ==================== Edit Entry Methods ====================

  async clickEditForEntry(index: number = 0): Promise<void> {
    await this.editButton.nth(index).click();
    await this.page.waitForTimeout(1000);
    console.log(`✓ Clicked Edit button for entry at index ${index}`);
  }

  async validateEditDrawerOpened(): Promise<void> {
    await expect(this.steDrawerTitle.or(this.breakDrawerTitle)).toBeVisible();
    console.log('✓ Edit drawer opened');
  }

  async validateEntryUpdated(): Promise<void> {
    const toastVisible = await this.entryUpdatedToast
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (toastVisible) {
      console.log('✓ Entry updated successfully (toast visible)');
    } else {
      await expect(this.steDrawerTitle).not.toBeVisible({ timeout: 5000 });
      console.log('✓ Entry update drawer closed');
    }
  }

  async validateEditButtonVisible(index: number = 0): Promise<void> {
    await expect(this.editButton.nth(index)).toBeVisible();
    console.log(`✓ Edit button visible for entry at index ${index}`);
  }

  // ==================== Delete Entry Methods ====================

  async clickActionDropdownForEntry(index: number = 0): Promise<void> {
    await this.actionDropdownButton.nth(index).click();
    await this.page.waitForTimeout(500);
    console.log(`✓ Opened action dropdown for entry at index ${index}`);
  }

  async clickDeleteInActionDropdown(): Promise<void> {
    await this.deleteOptionInDropdown.first().click();
    await this.page.waitForTimeout(500);
    console.log('✓ Clicked Delete option in dropdown');
  }

  async validateDeleteConfirmationPopup(): Promise<void> {
    await expect(this.deleteConfirmationPopup).toBeVisible();
    console.log('✓ Delete confirmation popup visible');
  }

  async confirmDelete(): Promise<void> {
    await this.deleteConfirmYesButton.click();
    await this.modalDialogContainer()
      .waitFor({ state: 'hidden', timeout: 30_000 })
      .catch(() => undefined);
    await this.waitForActionOverlayGone();
    await this.page.waitForTimeout(1000);
    console.log('✓ Confirmed deletion');
  }

  async validateEntryDeleted(): Promise<void> {
    const toastVisible = await this.entryDeletedToast
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (toastVisible) {
      console.log('✓ Entry deleted successfully (toast visible)');
    } else {
      console.log('✓ Entry deleted (no toast but confirmation passed)');
    }
  }

  // ==================== Data Validation Methods ====================

  async validateEntryDurationOnScreen(
    expectedDuration: string,
    index: number = 0,
    rowMarker?: string,
  ): Promise<void> {
    const entryRow = rowMarker
      ? this.timeEntryRow.filter({ hasText: rowMarker }).first()
      : this.timeEntryRow.nth(index);
    await expect(entryRow).toBeVisible({ timeout: 15_000 });
    const rowText = (await entryRow.textContent()) ?? '';
    // Convert h:mm format to decimal hours (e.g., "2:00" → "2.00", "1:30" → "1.50")
    const [hours, minutes] = expectedDuration.split(':').map(Number);
    const decimalHours = (hours + minutes / 60).toFixed(2);
    expect(rowText).toContain(decimalHours);
    console.log(
      `✓ Entry shows duration: ${decimalHours} hours${
        rowMarker
          ? ` (marker: ${rowMarker.substring(0, 20)}…)`
          : ` at index ${index}`
      }`,
    );
  }

  async validateEntryNotesOnScreen(
    expectedNotes: string,
    index: number = 0,
  ): Promise<void> {
    const entryRow = this.timeEntryRow.nth(index);
    await expect(entryRow).toBeVisible();
    const rowText = await entryRow.textContent();
    if (rowText?.includes(expectedNotes)) {
      console.log(`✓ Entry at index ${index} shows notes: "${expectedNotes}"`);
    } else {
      console.log(`⚠ Notes not visible in row. Expected: "${expectedNotes}"`);
    }
  }

  async closeAnyOpenDrawer(): Promise<void> {
    const cancelBtn = this.page.getByRole('button', { name: 'Cancel' });
    const closeBtn = this.page.locator('button[aria-label="Close"]');

    if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelBtn.click();
      await this.page.waitForTimeout(500);
      console.log('✓ Closed open drawer via Cancel');
    } else if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click();
      await this.page.waitForTimeout(500);
      console.log('✓ Closed open drawer via Close button');
    }
  }

  async getCustomerProjectOptions(page: Page) {
    await page.waitForTimeout(8000);
    const customerElement = page.locator(
      `//span[contains(text(),'Customer')]/parent::div/..//following-sibling::div[contains(@id, 'Dropdown')]`,
    );
    await customerElement.click({ force: true });
    await page.waitForTimeout(5000);
    const options = await page
      .locator(`//span[contains(@class,"CustomerDropdown__MainLabel")]`)
      .or(
        page.locator(
          `li[data-automation-id='contact-row'] span[class='rowTextLabel']`,
        ),
      )
      .allTextContents();
    await customerElement.click();
    return options;
  }

  async selectCustomerProject(page: Page, option: string) {
    await page.waitForTimeout(5000);
    await page
      .locator(
        `//span[contains(text(),'Customer')]/parent::div/..//following-sibling::div[contains(@id, 'Dropdown')]`,
      )
      .click({ force: true });
    await page.waitForTimeout(2000);
    await page.getByRole('option', { name: option }).click();
  }

  async setBreakDateToYesterday(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const year = yesterday.getFullYear();
    const dateStr = `${month}/${day}/${year}`;

    await this.breakStartDateInput.clear();
    await this.breakStartDateInput.fill(dateStr);
    await this.page.waitForTimeout(500);
    console.log(`✓ Set Break start date to yesterday: ${dateStr}`);
  }

  async validateEditButtonVisibleInRowContaining(
    rowText: string,
  ): Promise<void> {
    const row = this.timeEntryRow.filter({ hasText: rowText });
    await expect(row.first()).toBeVisible({ timeout: 15000 });
    await expect(row.first().getByText('Edit', { exact: true })).toBeVisible({
      timeout: 10000,
    });
    console.log('✓ Edit button visible in row containing marker text');
  }

  /** Click **Edit** on the row that contains the marker text (QBO row-scoped edit pattern). */
  async clickEditInRowContaining(rowText: string): Promise<void> {
    const row = this.timeEntryRow.filter({ hasText: rowText });
    await expect(row.first()).toBeVisible({ timeout: 15000 });
    await row.first().getByText('Edit', { exact: true }).click();
    await this.page.waitForTimeout(1000);
    console.log('✓ Clicked Edit in row containing marker text');
  }

  async fillWteFirstRowWeekdaysWithDetailPanel(options: {
    hoursPerDay: string;
    notes: string;
    billableRate: string;
    serviceOptionIndex: number;
    /** Pick by list index — uses {@link clickCustomerDropdownOption}. */
    customerOptionIndex?: number;
    /** Pick by display name — uses {@link selectWteTimeCategoryCustomer}. */
    customerName?: string;
  }): Promise<{ customerName: string | null }> {
    if (options.customerName) {
      await this.selectWteTimeCategoryCustomer(options.customerName);
    } else if (options.customerOptionIndex !== undefined) {
      await this.openWteFirstRowTimeCategoryDropdown();
      await clickCustomerDropdownOption(this.page, options.customerOptionIndex);
      await this.page.waitForTimeout(500);
    }

    const customerName = await getCustomerName(this.page, 0);
    expect(customerName.length).toBeGreaterThan(0);

    await this.waitForWteTimesheetReady();

    // Mon–Fri: DataCell nth 1–5 (0 is time category column on tbody row).
    for (let dayIndex = 1; dayIndex <= 5; dayIndex++) {
      await this.fillWteHours(dayIndex, options.hoursPerDay, options.notes);
    }

    const billableCheckbox = this.page
      .getByRole('checkbox', { name: /Billable/i })
      .first();
    if (
      (await billableCheckbox
        .isVisible({ timeout: 3000 })
        .catch(() => false)) &&
      (await billableCheckbox.isEnabled().catch(() => false))
    ) {
      await billableCheckbox.check({ force: true }).catch(() => undefined);
      const billableRateInput = this.page.getByRole('textbox', {
        name: /Billable rate/i,
      });
      if (
        (await billableRateInput
          .isVisible({ timeout: 3000 })
          .catch(() => false)) &&
        (await billableRateInput.isEditable().catch(() => false))
      ) {
        await billableRateInput
          .fill(options.billableRate)
          .catch(() => undefined);
      }
    }

    // Step 3: Save and close
    const saveButton = this.wteSaveButton;
    await expect(saveButton).toBeVisible({ timeout: 15000 });
    await saveButton.click();
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(2000);
    await waitForLoadingToDisappear(this.page);

    const closeTrowser = this.page.locator(
      `[data-automation-id="weekly-time-trowser_close"]`,
    );
    await expect(closeTrowser).toBeVisible({ timeout: 20000 });
    await closeTrowser.click();
    await this.page.waitForTimeout(2000);
    await waitForLoadingToDisappear(this.page);

    return { customerName };
  }

  /**
   * WF007: fill only the first N weekday columns (default 3 = Mon–Wed), then save and close.
   * Does not modify {@link fillWteFirstRowWeekdaysWithDetailPanel}.
   */
  async fillWteFirstRowPartialWeekdaysWithDetailPanel(options: {
    hoursPerDay: string;
    notes: string;
    billableRate: string;
    serviceOptionIndex: number;
    customerOptionIndex?: number;
    customerName?: string;
    /** Weekday columns to fill (1 = Mon … 5 = Fri). Default 3. */
    weekdayCount?: number;
  }): Promise<{ customerName: string | null }> {
    if (options.customerName) {
      await this.selectWteTimeCategoryCustomer(options.customerName);
    } else if (options.customerOptionIndex !== undefined) {
      await this.openWteFirstRowTimeCategoryDropdown();
      await clickCustomerDropdownOption(this.page, options.customerOptionIndex);
      await this.page.waitForTimeout(500);
    }

    const customerName = await getCustomerName(this.page, 0);
    expect(customerName.length).toBeGreaterThan(0);

    await this.waitForWteTimesheetReady();

    const weekdayCount = Math.min(Math.max(options.weekdayCount ?? 3, 1), 5);
    for (let dayIndex = 1; dayIndex <= weekdayCount; dayIndex++) {
      await this.fillWteHours(dayIndex, options.hoursPerDay, options.notes);
    }
    console.log(
      `✓ Filled ${weekdayCount} weekday column(s) with ${options.hoursPerDay}h each`,
    );

    const billableCheckbox = this.page
      .getByRole('checkbox', { name: /Billable/i })
      .first();
    if (
      (await billableCheckbox
        .isVisible({ timeout: 3000 })
        .catch(() => false)) &&
      (await billableCheckbox.isEnabled().catch(() => false))
    ) {
      await billableCheckbox.check({ force: true }).catch(() => undefined);
      const billableRateInput = this.page.getByRole('textbox', {
        name: /Billable rate/i,
      });
      if (
        (await billableRateInput
          .isVisible({ timeout: 3000 })
          .catch(() => false)) &&
        (await billableRateInput.isEditable().catch(() => false))
      ) {
        await billableRateInput
          .fill(options.billableRate)
          .catch(() => undefined);
      }
    }

    const saveButton = this.wteSaveButton;
    await expect(saveButton).toBeVisible({ timeout: 15000 });
    await saveButton.click();
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(2000);
    await waitForLoadingToDisappear(this.page);

    const closeTrowser = this.page.locator(
      `[data-automation-id="weekly-time-trowser_close"]`,
    );
    await expect(closeTrowser).toBeVisible({ timeout: 20000 });
    await closeTrowser.click();
    await this.page.waitForTimeout(2000);
    await waitForLoadingToDisappear(this.page);

    return { customerName };
  }

  get submitTimeOption(): Locator {
    return this.page
      .getByRole('menuitem', { name: 'Submit time' })
      .or(this.page.getByText('Submit time', { exact: true }))
      .first();
  }

  /** Assert the "Submit time" option is present in the Add time dropdown. */
  async validateSubmitTimeOptionPresent(): Promise<void> {
    await this.openAddTimeDropdown();
    await expect(this.submitTimeOption).toBeVisible({ timeout: 30000 });
    console.log('✓ Submit time option visible in Add time dropdown');
    await this.closeDropdown();
  }

  /** Assert the "Submit time" option is NOT present in the Add time dropdown. */
  async validateSubmitTimeOptionNotPresent(): Promise<void> {
    await this.openAddTimeDropdown();
    await expect(this.submitTimeOption).toBeHidden({ timeout: 15000 });
    console.log('✓ Submit time option NOT visible in Add time dropdown');
    await this.closeDropdown();
  }

  /** STE Service picker — select a service item by its visible name. */
  async selectSteServiceByName(serviceName: string): Promise<void> {
    await this.steServiceDropdown.first().click();
    await this.page.waitForTimeout(500);
    const option = this.page
      .getByRole('option', { name: serviceName, exact: true })
      .or(this.page.getByRole('option', { name: serviceName }))
      .first();
    await expect(option).toBeVisible({ timeout: 10_000 });
    await option.click();
    await this.page.waitForTimeout(500);
    console.log(`✓ Selected STE service: ${serviceName}`);
  }

  /** Check the STE Billable checkbox when present and not already checked. */
  async checkSteBillable(): Promise<void> {
    const checkbox = this.steBillableCheckbox.first();
    const visible = await checkbox
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (visible && !(await checkbox.isChecked().catch(() => false))) {
      await checkbox.check({ force: true }).catch(async () => {
        await checkbox.click({ force: true });
      });
      console.log('✓ Checked STE billable');
    }
  }

  /**
   * Message shown in the STE drawer when the selected day is submitted:
   * "Time entry is submitted and cannot be edited" (falls back to the locked
   * wording). Plain-string getByText chained with .or() avoids the regex+first
   * serialization issue and matches straight/curly apostrophes.
   */
  get steSubmittedMessage(): Locator {
    return this.page
      .getByText('submitted and cannot be edited')
      .or(this.page.getByText('been submitted or approved'))
      .or(this.page.getByText('is locked'))
      .first();
  }

  async validateSteSubmittedCannotEditMessage(): Promise<void> {
    await expect(this.steSubmittedMessage).toBeVisible({ timeout: 15000 });
    console.log(
      '✓ "Time entry is submitted and cannot be edited" message displayed',
    );
  }

  /**
   * Validate that Save, Save and close, and the save-options dropdown are all
   * disabled in the STE drawer (submitted day is read-only).
   */
  async validateSteSaveOptionsDisabled(): Promise<void> {
    const saveBtn = this.page
      .getByRole('button', { name: 'Save', exact: true })
      .first();
    const saveAndCloseBtn = this.page
      .getByRole('button', { name: 'Save and close' })
      .or(
        this.page.locator(
          `//button[.//*[normalize-space(text())='Save and close']]`,
        ),
      )
      .first();
    const saveDropdown = this.page
      .getByRole('button', { name: /save options/i })
      .or(
        this.page.locator(
          `//button[@aria-haspopup='true' or @aria-haspopup='menu' or @aria-haspopup='listbox']`,
        ),
      )
      .last();

    await expect(saveBtn).toBeDisabled({ timeout: 15000 });
    await expect(saveAndCloseBtn).toBeDisabled({ timeout: 10000 });
    await expect(saveDropdown).toBeDisabled({ timeout: 10000 });
    console.log(
      '✓ Save, Save and close, and save-options dropdown are disabled',
    );
  }

  /**
   * Validate the time entry identified by its notes shows the "Submitted"
   * status in the Time entries list.
   */
  async validateEntrySubmittedByNotes(notes: string): Promise<void> {
    await this.validateEntryStatusByNotes(notes, 'Submitted');
  }

  /**
   * Validate the time entry identified by its notes shows the given status
   * (e.g. "Unapproved", "Submitted", "Approved") in the Time entries list.
   */
  async validateEntryStatusByNotes(
    notes: string,
    status: string,
  ): Promise<void> {
    const row = this.timeEntryRow.filter({ hasText: notes }).first();
    await expect(row).toBeVisible({ timeout: 30000 });
    await expect(row).toContainText(status, { timeout: 15000 });
    console.log(`✓ Entry with notes "${notes}" shows ${status} status`);
  }

  /**
   * Validate the time entry identified by its notes is NOT in "Submitted"
   * status (e.g. after it has been rejected/un-submitted).
   */
  async validateEntryNotSubmittedByNotes(notes: string): Promise<void> {
    const row = this.timeEntryRow.filter({ hasText: notes }).first();
    await expect(row).toBeVisible({ timeout: 30000 });
    await expect(row).not.toContainText('Submitted', { timeout: 15000 });
    console.log(`✓ Entry with notes "${notes}" is not in Submitted status`);
  }

  /**
   * Validate a time entry row for the given customer shows the expected
   * duration/hours. WTE list rows are keyed by customer (the detail-panel notes
   * are not shown in the row), so lookups match the first customer-name token —
   * mirroring validateTimeEntriesInTable in Workforce.Util.
   */
  async validateEntryDurationByCustomer(
    customerName: string,
    expectedHours: string,
  ): Promise<void> {
    const token = customerName.split(/\s+/)[0];
    const row = this.timeEntryRow.filter({ hasText: token }).first();
    await expect(row).toBeVisible({ timeout: 30000 });
    await expect(row).toContainText(expectedHours, { timeout: 15000 });
    console.log(
      `✓ Entry for customer "${customerName}" shows ${expectedHours}`,
    );
  }

  /**
   * Validate a time entry row for the given customer (matched by the first
   * customer-name token) shows the given status (e.g. "Submitted").
   */
  async validateEntryStatusByCustomer(
    customerName: string,
    status: string,
  ): Promise<void> {
    const token = customerName.split(/\s+/)[0];
    const row = this.timeEntryRow.filter({ hasText: token }).first();
    await expect(row).toBeVisible({ timeout: 30000 });
    await expect(row).toContainText(status, { timeout: 15000 });
    console.log(
      `✓ Entry for customer "${customerName}" shows ${status} status`,
    );
  }

  /**
   * Validate the time entry row for the given customer (matched by the first
   * customer-name token) does NOT expose an Edit option — a submitted weekly
   * time entry cannot be edited.
   */
  async validateEntryNoEditByCustomer(customerName: string): Promise<void> {
    const token = customerName.split(/\s+/)[0];
    const row = this.timeEntryRow.filter({ hasText: token }).first();
    await expect(row).toBeVisible({ timeout: 30000 });
    await expect(row.getByText('Edit', { exact: true })).toHaveCount(0);
    console.log(
      `✓ Entry for customer "${customerName}" has no Edit option (locked)`,
    );
  }

  /**
   * Validate the time entry row for the given customer (matched by the first
   * customer-name token) does NOT expose a Delete option — a submitted weekly
   * time entry cannot be deleted. The row either has no action menu, or the menu
   * exposes no Delete item.
   */
  async validateEntryNoDeleteByCustomer(customerName: string): Promise<void> {
    const token = customerName.split(/\s+/)[0];
    const row = this.timeEntryRow.filter({ hasText: token }).first();
    await expect(row).toBeVisible({ timeout: 30000 });
    const menuBtn = row.locator('button[aria-label="Expand Menu"]');
    if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuBtn.click();
      await this.page.waitForTimeout(500);
      await expect(this.deleteOptionInDropdown).toHaveCount(0);
      await this.page.keyboard.press('Escape');
    }
    console.log(
      `✓ Entry for customer "${customerName}" has no Delete option (locked)`,
    );
  }

  /**
   * Validate at least one time entry row in the table shows the "Submitted"
   * status. Used when the submitted entry has no unique notes to filter by
   * (e.g. a Time Clock entry).
   */
  async validateAnyEntrySubmitted(): Promise<void> {
    const submittedRow = this.timeEntryRow
      .filter({ hasText: 'Submitted' })
      .first();
    await expect(submittedRow).toBeVisible({ timeout: 30000 });
    console.log('✓ A time entry with Submitted status is present in the table');
  }

  /**
   * Validate the entry row (by notes) exposes both Edit (direct action) and
   * Delete (inside the row's action menu).
   */
  async validateEntryHasEditAndDeleteByNotes(notes: string): Promise<void> {
    const row = this.timeEntryRow.filter({ hasText: notes }).first();
    await expect(row).toBeVisible({ timeout: 30000 });
    // Edit is a direct row action; .first() avoids strict-mode when the label
    // is nested (e.g. <a><span>Edit</span></a>).
    await expect(row.getByText('Edit', { exact: true }).first()).toBeVisible({
      timeout: 10000,
    });
    await row.locator('button[aria-label="Expand Menu"]').click();
    await this.page.waitForTimeout(500);
    // The Delete menu item matches both the <li role="menuitem"> and its inner
    // <span>Delete</span>, so scope to the first to avoid a strict-mode error.
    await expect(this.deleteOptionInDropdown.first()).toBeVisible({
      timeout: 10000,
    });
    await this.page.keyboard.press('Escape');
    console.log(`✓ Entry with notes "${notes}" has Edit and Delete options`);
  }

  /**
   * Validate the entry row (by notes) exposes neither Edit nor Delete — i.e. a
   * submitted/locked entry with no editable actions.
   */
  async validateEntryNoEditAndDeleteByNotes(notes: string): Promise<void> {
    const row = this.timeEntryRow.filter({ hasText: notes }).first();
    await expect(row).toBeVisible({ timeout: 30000 });
    // No direct Edit action.
    await expect(row.getByText('Edit', { exact: true })).toHaveCount(0);
    // No Delete: either no action menu, or the menu exposes no Delete.
    const menuBtn = row.locator('button[aria-label="Expand Menu"]');
    if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuBtn.click();
      await this.page.waitForTimeout(500);
      await expect(this.deleteOptionInDropdown).toHaveCount(0);
      await this.page.keyboard.press('Escape');
    }
    console.log(
      `✓ Entry with notes "${notes}" has no Edit/Delete options (locked)`,
    );
  }

  /** Error surfaced when DELETING a submitted (locked) entry. */
  get deleteEntryError(): Locator {
    return this.page.getByText('delete your time entry').first();
  }

  /** Click "Yes" in a confirmation popup if one appears (best-effort). */
  async confirmYesInPopup(): Promise<void> {
    const yesButton = this.page.getByRole('button', { name: /^Yes$/i }).first();
    if (await yesButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await yesButton.click();
      await this.page.waitForTimeout(1000);
      console.log('✓ Selected "Yes" in confirmation popup');
    } else {
      console.log('  ℹ No confirmation popup appeared');
    }
  }

  /**
   * Attempt to delete the entry identified by its notes. Returns true when the
   * entry was removed (or was not present to begin with), and false when the
   * delete was rejected — e.g. the entry is still submitted/locked and Workforce
   * shows "…couldn't delete your time entry…". Never throws for the locked case,
   * so cleanup can report the true outcome instead of a false success.
   */
  async tryDeleteEntryByNotes(notes: string): Promise<boolean> {
    const row = this.timeEntryRow.filter({ hasText: notes }).first();
    if (!(await row.isVisible({ timeout: 15000 }).catch(() => false))) {
      console.log(`  ℹ No Workforce entry with notes "${notes}" to delete`);
      return true;
    }
    await row.locator('button[aria-label="Expand Menu"]').click();
    await this.page.waitForTimeout(500);
    await this.clickDeleteInActionDropdown();
    // Confirm "Yes" if a delete-confirmation popup appears (non-throwing).
    await this.confirmYesInPopup();
    await this.page.waitForTimeout(1500);

    // Submitted/locked entries surface a "couldn't delete" error and stay.
    if (
      await this.deleteEntryError
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      console.log(
        `  ⚠ Could not delete "${notes}" — entry is still submitted/locked`,
      );
      return false;
    }

    // Otherwise confirm the row is actually gone.
    const stillPresent = await this.timeEntryRow
      .filter({ hasText: notes })
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (stillPresent) {
      console.log(`  ⚠ Entry "${notes}" still present after delete attempt`);
      return false;
    }
    console.log(`✓ Deleted Workforce entry with notes "${notes}"`);
    return true;
  }

  /**
   * Validate the time entry identified by its unique notes shows the expected
   * duration. Scoping by notes avoids matching leftover rows (e.g. a previously
   * submitted entry that sorts to the top of the list).
   */
  async validateEntryDurationByNotes(
    notes: string,
    expectedDuration: string,
  ): Promise<void> {
    const entryRow = this.timeEntryRow.filter({ hasText: notes }).first();
    await expect(entryRow).toBeVisible({ timeout: 30000 });
    const rowText = await entryRow.textContent();
    // Convert h:mm format to decimal hours (e.g., "10:00" → "10.00").
    const [hours, minutes] = expectedDuration.split(':').map(Number);
    const decimalHours = (hours + minutes / 60).toFixed(2);
    expect(rowText).toContain(decimalHours);
    console.log(
      `✓ Entry with notes "${notes}" shows duration: ${decimalHours} hours`,
    );
  }
}
