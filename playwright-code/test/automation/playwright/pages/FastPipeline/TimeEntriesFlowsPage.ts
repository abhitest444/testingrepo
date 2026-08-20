import { Page, Locator, expect } from '@playwright/test';
import TimeEntriesPage from '../TimeEntriesPage';
import TESingleTimeEntryPage from './TESingleTimeEntryPage';
import {
  CommonLocators,
  selectSingleTimeEntryFromAddTime,
} from '../../commonUtils';
import { TimeSubmenu } from '../../config/types';
import * as wteGrid from '../WeeklyTimeEntryPage';
import * as TimeClock from '../TimeClockPage';

/**
 * Page object for the TE01 Time Entries Tab end-to-end suite.
 *
 * This object intentionally COMPOSES the existing page objects
 * (`TimeEntriesPage`, `SingleTImeEntryPage`, `CommonLocators`) rather than
 * duplicating their selectors. It only adds the NEW actions/selectors that
 * TE01 needs and that do not already exist elsewhere.
 */
class TETimeEntriesTabPage {
  readonly tePageBase: TimeEntriesPage;
  readonly stePage: TESingleTimeEntryPage;
  readonly common: CommonLocators;
  private page: Page;

  constructor(page: Page) {
    this.page = page;
    this.tePageBase = new TimeEntriesPage(page);
    this.stePage = new TESingleTimeEntryPage(page);
    this.common = new CommonLocators(page);
  }

  // ---- Delegated common methods (kept thin on purpose) ---------------------

  async navigateToTimeEntriesPage(): Promise<void> {
    await this.tePageBase.navigateToTimeEntriesPage();
  }

  async navigateToTimeEntriesPageSubmenu(submenu: TimeSubmenu): Promise<void> {
    if (this.page.isClosed()) {
      throw new Error('Cannot navigate to Time submenu — page is closed');
    }

    const allApps = this.page.locator(`//*[@aria-label='All apps']`).first();
    await expect(allApps).toBeVisible({ timeout: 30000 });
    await allApps.hover();

    const timeMenu = this.page.locator(`//*[@aria-label='Time']`).first();
    await expect(timeMenu).toBeVisible({ timeout: 10000 });
    await timeMenu.hover();

    const tabItem = this.page.locator(`//*[@aria-label='${submenu}']`).first();
    await expect(tabItem).toBeVisible({ timeout: 10000 });
    await tabItem.click();

    await this.tePageBase.waitForPageReady(this.page);
    await this.tePageBase.handlePopupsInAnyOrder();
  }

  async waitForLoadingToDisappear(): Promise<void> {
    await this.tePageBase.waitForLoadingToDisappear();
  }

  // ---- Tab visibility ------------------------------------------------------

  /**
   * Returns the visible Time tab labels from the left nav / tab bar.
   * QBO renders the Time sub-navigation as links; we read their inner text and
   * normalise it so callers can assert on a clean string array.
   */
  async getVisibleTabNames(): Promise<string[]> {
    const tabs = this.page.locator(`//*[@data-id='time-body']//a`);
    const texts = await tabs.allInnerTexts().catch(() => [] as string[]);
    return texts.map((t) => t.trim()).filter(Boolean);
  }
  /**
   * Best-effort check that the Time Entries tab is reachable. Returns true when
   * either the Time Entries grid filters are present or a Time Entries nav link
   * is visible.
   */
  async isTimeEntriesTabVisible(): Promise<boolean> {
    const displayByVisible = await this.common.displayByDropdown
      .isVisible()
      .catch(() => false);
    if (displayByVisible) {
      return true;
    }
    const navLink = this.page
      .getByRole('link', { name: /time entries/i })
      .first();
    return navLink.isVisible().catch(() => false);
  }

  // ---- Column visibility ---------------------------------------------------

  /**
   * Returns the visible column header strings from the time entries grid.
   * Delegates to the existing `getTableHeaders` helper so we stay consistent
   * with how the rest of the suite reads headers.
   */
  async getVisibleColumnNames(): Promise<string[]> {
    try {
      const clean = (values: string[]): string[] =>
        values.map((h) => h?.trim()).filter((h): h is string => !!h);

      const roleHeaders = clean(
        await this.page
          .locator('//thead//th[@role="columnheader"]')
          .allTextContents(),
      );
      if (roleHeaders.length > 0) {
        return roleHeaders;
      }

      // Fallback: some grids render header cells without the columnheader role.
      return clean(await this.page.locator('//thead//th').allTextContents());
    } catch {
      return [];
    }
  }

  async assertColumnVisible(columnName: string): Promise<void> {
    await this.tePageBase.validateColumnVisible(columnName);
  }

  async assertColumnHidden(columnName: string): Promise<void> {
    await this.tePageBase.validateColumnHidden(columnName);
  }

  // ---- Rows ----------------------------------------------------------------

  async getEntryRowCount(): Promise<number> {
    return this.tePageBase.getRowCount();
  }

  /** Find a grid row by the Notes text it contains. */
  getRowByNotes(notes: string): Locator {
    return this.page.locator(`//tr[contains(., '${notes}')]`).first();
  }

  /**
   * The first actual entry row in the grid body. The grid groups entries under
   * date-divider rows (a single `td` with a "DateDividerCell" class spanning all
   * columns, e.g. "Thu, May 14, 2026"); those are skipped so we return the first
   * row that holds a real time entry (employee name + detail cells).
   */
  getFirstEntryRow(): Locator {
    return this.page
      .locator(
        `//table//tbody/tr[not(.//td[contains(@class, 'DateDividerCell')])]`,
      )
      .first();
  }

  // ---- Recent Time Entries (history / timer icon) --------------------------
  //
  // The history/timer icon sits at the top-left of the STE trowser, just before
  // the "Single time entry" heading. Clicking it opens the "RECENT TIME
  // ENTRIES" popup which lists recently saved entries (each row: Time entry |
  // date | amount | customer) plus a "View more" button. Clicking a row reloads
  // that entry into the STE form for editing. These selectors live in the TE01
  // page object so the shared SingleTimeEntryPage is left untouched.

  /** The history/timer icon button (left of the "Single time entry" heading). */
  get recentTimeEntriesIcon(): Locator {
    return this.page
      .locator(
        `//*[normalize-space(text())='Single time entry']/preceding::button[1]`,
      )
      .first();
  }

  /** The "RECENT TIME ENTRIES" popup header (scoped to the modal). */
  get recentTimeEntriesPopup(): Locator {
    return this.page.locator(
      `//header[contains(@class, 'RecentTimeActivitiesModal__StyledHeader')]`,
    );
  }

  /** Opens the Recent Time Entries popup via the timer icon. */
  async openRecentTimeEntries(): Promise<void> {
    await this.recentTimeEntriesIcon.click();
    await expect(this.recentTimeEntriesPopup).toBeVisible({ timeout: 10000 });
  }

  async expectRecentTimeEntriesPopupVisible(): Promise<void> {
    await expect(this.recentTimeEntriesPopup).toBeVisible({ timeout: 10000 });
  }

  /**
   * Clicks the Recent Time Entries row whose date matches the given STE added
   * date, which reopens that entry in the STE form for editing. The popup lists
   * each entry's date in `YYYY-MM-DD` format (e.g. "2026-04-29").
   */
  async clickRecentTimeEntryByDate(date: string): Promise<void> {
    const row = this.page
      .locator(
        `//tr[contains(@class, 'RecentTimeActivitiesModal__StyledTableRow')]` +
          `[.//td[normalize-space(text())='${date}']]`,
      )
      .first();
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.click();
    await this.stePage.expectSingleTimeEntryVisible();
    await this.waitForLoadingToDisappear();
  }

  /**
   * Clicks the "View more" link in the Recent Time Entries popup, which closes
   * the trowser and navigates to the Time Entries view/grid.
   */
  async clickViewMoreInRecentTimeEntries(): Promise<void> {
    const viewMore = this.page
      .getByRole('button', { name: /view more/i })
      .or(this.page.getByRole('link', { name: /view more/i }))
      .first();
    await viewMore.waitFor({ state: 'visible', timeout: 10000 });
    await viewMore.click();
    await this.waitForLoadingToDisappear();
  }

  async isRowWithNotesVisible(notes: string): Promise<boolean> {
    return this.getRowByNotes(notes)
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  /**
   * Returns the set of distinct employee names visible in the grid's Name
   * column. Used by the role-scoped data visibility checks.
   */
  async getDistinctEmployeeNames(): Promise<string[]> {
    const nameCells = this.page.locator(
      `//tbody//*[@role='row']//div[contains(@class, 'StyledName')]`,
    );
    const texts = await nameCells.allInnerTexts().catch(() => [] as string[]);
    const cleaned = texts.map((t) => t.trim()).filter(Boolean);
    return Array.from(new Set(cleaned));
  }

  // ---- Add Time ------------------------------------------------------------

  /**
   * Opens the Add Time dropdown and selects the requested entry type.
   * Reuses `CommonLocators` so popup dismissal stays centralised.
   */
  async openAddTimeOption(
    option: 'Single time entry' | 'Weekly time entry',
  ): Promise<void> {
    await this.common.clickAddTimeDropdown();
    if (option === 'Single time entry') {
      await this.common.selectSingleTimeEntryFromAddTime();
    } else {
      await this.common.dismissGotItPopupIfVisible();
      await this.page.getByText(option, { exact: true }).click();
    }
  }

  /** Free-data companies: Add time → Single time activity (STA trowser). */
  async openAddTimeSTA(): Promise<void> {
    await this.common.clickAddTimeDropdown();
    await selectSingleTimeEntryFromAddTime(this.page, true);
    await this.waitForLoadingToDisappear();
  }

  /** Free-data companies: Add time → Weekly timesheet (WTA trowser). */
  async openAddTimeWTA(): Promise<void> {
    await this.common.clickAddTimeDropdown();
    await this.common.dismissGotItPopupIfVisible();
    const weeklyOption = this.page
      .getByRole('option', { name: 'Weekly timesheet' })
      .or(this.page.getByText('Weekly Timesheet', { exact: true }))
      .or(this.page.locator(`//span[text()='Weekly timesheet']`).first());
    await weeklyOption.first().click();
    await this.page
      .getByRole('dialog', { name: 'popover' })
      .getByLabel('Close')
      .click()
      .catch(() => undefined);
    await this.waitForLoadingToDisappear();
  }

  // ---- Approve / Unapprove on a specific row -------------------------------

  async approveEntryByNotes(
    notes: string,
    employeeName?: string,
  ): Promise<void> {
    const row = this.getRowByNotes(notes);
    await row.scrollIntoViewIfNeeded().catch(() => undefined);

    const nameToken = employeeName?.trim().split(/\s+/)[0];
    if (nameToken) {
      const byEmployee = this.page
        .locator(
          `//tr[contains(., '${notes}')]//div[contains(text(),'${nameToken}')]` +
            `/ancestor::tr//span[text()='Approve']`,
        )
        .first();
      if (await byEmployee.isVisible({ timeout: 5000 }).catch(() => false)) {
        await byEmployee.click();
        await this.tePageBase.handleLockTimeDialogIfPresent();
        return;
      }
    }

    const approve = row
      .locator(`xpath=.//span[text()='Approve']`)
      .or(row.getByRole('button', { name: /^approve$/i }))
      .first();
    await approve.waitFor({ state: 'visible', timeout: 15000 });
    await approve.click();
    await this.tePageBase.handleLockTimeDialogIfPresent();
  }

  async unapproveEntryByNotes(
    notes: string,
    employeeName?: string,
  ): Promise<void> {
    const row = this.getRowByNotes(notes);
    await row.scrollIntoViewIfNeeded().catch(() => undefined);

    const nameToken = employeeName?.trim().split(/\s+/)[0];
    if (nameToken) {
      const byEmployee = this.page
        .locator(
          `//tr[contains(., '${notes}')]//div[contains(text(),'${nameToken}')]` +
            `/ancestor::tr//span[text()='Unapprove']`,
        )
        .first();
      if (await byEmployee.isVisible({ timeout: 5000 }).catch(() => false)) {
        await byEmployee.click();
        return;
      }
    }

    const unapprove = row
      .locator(`xpath=.//span[text()='Unapprove']`)
      .or(row.getByRole('button', { name: /^unapprove$/i }))
      .first();
    await unapprove.waitFor({ state: 'visible', timeout: 15000 });
    await unapprove.click();
  }

  async assertEntryStatus(
    notes: string,
    expectedStatus: string,
  ): Promise<void> {
    const row = this.getRowByNotes(notes);
    await expect(
      row.getByText(expectedStatus, { exact: false }).first(),
    ).toBeVisible();
  }

  // ---- Column settings drawer helpers -------------------------------------
  //
  // The Settings gear opens a side drawer of column checkboxes. Toggling ANY
  // checkbox immediately closes the drawer, so each column must be toggled in
  // its own open/close cycle: open gear → toggle one checkbox → drawer closes.
  // To change another column the gear has to be clicked again.

  /** The settings side drawer container. */
  private get settingsDrawer(): Locator {
    return this.page.locator(`//*[@name="detailColumnSettings"]`);
  }

  /**
   * The column-settings gear in the grid header. `.first()` keeps it strict-mode
   * safe on grids that render more than one `Settings`-labelled control.
   */
  private get settingsGear(): Locator {
    return this.page
      .locator(`//th/descendant::*[@aria-label="Settings"]`)
      .first();
  }

  private async isSettingsDrawerOpen(): Promise<boolean> {
    return this.settingsDrawer.isVisible({ timeout: 1000 }).catch(() => false);
  }

  /**
   * Opens the settings drawer (no-op if already open). Returns true once the
   * drawer is open, false when the grid exposes no column-settings gear.
   */
  private async openSettingsDrawer(): Promise<boolean> {
    if (await this.isSettingsDrawerOpen()) {
      return true;
    }
    if (
      !(await this.settingsGear.isVisible({ timeout: 5000 }).catch(() => false))
    ) {
      return false;
    }
    await this.settingsGear.scrollIntoViewIfNeeded().catch(() => undefined);
    await this.settingsGear.click().catch(() => undefined);
    await this.settingsDrawer
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => undefined);
    await this.page.waitForTimeout(500);
    return this.isSettingsDrawerOpen();
  }

  /** Closes the settings drawer if it is open (used when no toggle occurred). */
  private async closeSettingsDrawerIfOpen(): Promise<void> {
    if (!(await this.isSettingsDrawerOpen())) {
      return;
    }
    await this.settingsGear.click().catch(() => undefined); // gear toggles the drawer shut
    if (await this.isSettingsDrawerOpen()) {
      await this.page.keyboard.press('Escape').catch(() => undefined);
    }
    await this.tePageBase.waitForSettingsPopupToClose().catch(() => undefined);
  }

  /** Reads the column option labels listed in the (open) settings drawer. */
  private async getSettingsColumnLabels(): Promise<string[]> {
    const spans = this.settingsDrawer.locator(
      `xpath=.//label//span[normalize-space(text())]`,
    );
    const texts = await spans.allInnerTexts().catch(() => [] as string[]);
    const seen = new Set<string>();
    const labels: string[] = [];
    for (const raw of texts) {
      const label = raw.trim();
      if (!label || seen.has(label)) continue;
      seen.add(label);
      labels.push(label);
    }
    return labels;
  }

  /**
   * Sets a single column's visibility. Skips when the grid header already
   * matches the desired state. Opens the drawer, toggles the matching
   * checkbox if needed (which auto-closes the drawer), and otherwise closes the
   * drawer it opened. No-op when the column has no settings checkbox.
   */
  /** True when the grid already shows a column header for `columnName`. */
  private async isColumnHeaderVisible(columnName: string): Promise<boolean> {
    const exact = this.page.locator(`//th/div[text()='${columnName}']`).first();
    if (await exact.isVisible({ timeout: 1500 }).catch(() => false)) {
      return true;
    }
    // Some TE grids render the label as th text without an inner div.
    const loose = this.page
      .locator(`//th[contains(., '${columnName}')]`)
      .first();
    return loose.isVisible({ timeout: 1500 }).catch(() => false);
  }

  async setColumnVisibility(
    columnName: string,
    visible: boolean,
  ): Promise<void> {
    // Fast path: use the grid header — don't open settings if already correct.
    const headerVisible = await this.isColumnHeaderVisible(columnName);
    if (visible && headerVisible) return;
    if (!visible && !headerVisible) return;

    if (!(await this.openSettingsDrawer())) {
      // No column-settings gear on this grid — nothing to toggle.
      return;
    }

    // Re-check header after drawer animation — column may already be on.
    if (visible && (await this.isColumnHeaderVisible(columnName))) {
      await this.closeSettingsDrawerIfOpen();
      return;
    }

    const checkbox = (
      await this.tePageBase.getColumnsCheckboxFromSettings(columnName)
    ).first();
    if ((await checkbox.count()) === 0) {
      await this.closeSettingsDrawerIfOpen();
      return;
    }

    const isChecked = await checkbox.isChecked().catch(() => false);
    const isDisabled = await checkbox.isDisabled().catch(() => false);
    // Already in the desired state — do NOT click (a toggle click would flip it
    // the wrong way, e.g. uncheck an already-enabled Dimension column).
    if (isDisabled || isChecked === visible) {
      await this.closeSettingsDrawerIfOpen();
      return;
    }

    // RcCheckbox inputs are visually hidden — never use check()/uncheck()
    // (they hang on actionability). Click the label only when state must change.
    await checkbox
      .locator('xpath=ancestor::label[1]')
      .click({ timeout: 10000 })
      .catch(async () => {
        await checkbox.click({ force: true, timeout: 10000 });
      });

    await this.page.waitForTimeout(1000); // settle after the toggle click
    await this.tePageBase.waitForSettingsPopupToClose().catch(() => undefined);
    await this.waitForLoadingToDisappear().catch(() => undefined);
    await this.page.waitForTimeout(2000); // header/cells settle after chooser closes
  }

  /**
   * Returns the toggleable column labels listed in the Settings drawer.
   * Opens the gear, reads the labels, and closes the drawer.
   */
  async getColumnSettingsLabels(): Promise<string[]> {
    await this.openSettingsDrawer();
    const labels = await this.getSettingsColumnLabels();
    await this.closeSettingsDrawerIfOpen();
    return labels;
  }

  /**
   * Enables or disables every (toggleable) column. Because toggling a checkbox
   * closes the drawer, we read the column list once, then reopen the gear for
   * each column individually.
   */
  async setAllColumnCheckboxes(enable: boolean): Promise<void> {
    const labels = await this.getColumnSettingsLabels();
    for (const label of labels) {
      await this.setColumnVisibility(label, enable);
    }
  }

  // ==========================================================================
  // STE trowser dropdown helpers
  // ==========================================================================

  /**
   * Opens a trowser dropdown by its label, waits for the option list to settle,
   * then clicks the FIRST real option — skipping any "+ Add new / Add a new …"
   * creation item (which is option index 0 in QBO and, if clicked, opens a
   * full create panel whose backdrop blocks all further interaction).
   *
   * `settleMs` is the deliberate pause after opening the dropdown and before
   * picking an option (requested so the async option list has time to render).
   * Returns the selected option's text so callers can verify it in the grid.
   */
  async openDropdownAndSelectFirstOption(
    label: string,
    settleMs = 3000,
  ): Promise<string> {
    await this.stePage.openDropdown(label);
    await this.page.waitForTimeout(settleMs);

    // Wait until the dropdown options are actually rendered before selecting.
    const options = this.page.getByRole('option');
    await options.first().waitFor({ state: 'visible', timeout: 15000 });
    await expect
      .poll(async () => options.count(), { timeout: 15000 })
      .toBeGreaterThan(0);

    const texts = await options.allInnerTexts().catch(() => [] as string[]);
    const addNew = /add\s+(a\s+)?new|^\s*\+/i;
    let targetIndex = texts.findIndex((t) => !addNew.test(t.trim()));
    if (targetIndex === -1) {
      targetIndex = 0; // fall back to the only option available
    }
    const optionText = (texts[targetIndex] ?? '').trim();
    await options.nth(targetIndex).click({ force: true, timeout: 10000 });
    // Deliberate settle after the click — selecting can trigger async field
    // updates (rate, sub-fields) that intercept the next action if we race it.
    await this.page.waitForTimeout(1000);

    // Return the value actually COMMITTED to the field (the clean display value
    // shown in the input, e.g. "Bakes and Beans" / "aaatest employee"), NOT the
    // option's inner text — the option also renders a type badge on a second
    // line ("Customer", "Employee", …) which does not appear in the grid. Fall
    // back to the option's first line if the field value can't be read.
    const committed = (
      (await this.stePage.getFieldValue(label).catch(() => null)) ?? ''
    ).trim();
    return committed || optionText.split('\n')[0].trim();
  }

  /**
   * Reads back the current value of a trowser field by label (input value
   * attribute). Returns '' when the field is absent.
   */
  async getTrowserFieldValue(label: string): Promise<string> {
    const value = await this.stePage.getFieldValue(label).catch(() => null);
    return (value ?? '').trim();
  }

  /**
   * Fetches the employee name actually committed to the STE Name field — the
   * clean name (e.g. "aaatest employee"), without the dropdown option's
   * worker-type/role badge ("Employee", "Vendor", …). The grid compares this via
   * normalizeName, which is order-/comma-insensitive, so both "First Last" and
   * "Last, First" display formats match.
   */
  async getSelectedEmployeeName(): Promise<string> {
    const value = await this.getTrowserFieldValue('Name');
    return value.trim();
  }

  // ==========================================================================
  // Custom fields (rendered by an external MFE)
  //
  // Per the time-tracking-ui trowser, a custom field input is identified by its
  // aria-label, which equals the field NAME (plus a trailing " *" when the field
  // is required). Text CFs are filled directly; dropdown CFs are filled by
  // clicking the input and choosing the first option.
  // ==========================================================================

  /**
   * aria-label values that belong to standard (non-custom) STE fields, so they
   * can be excluded when discovering configured custom fields.
   */
  private static readonly STANDARD_FIELD_LABELS = [
    'name',
    'customer',
    'customers',
    'customer/project',
    'customers/projects',
    'service',
    'class',
    'location',
    'notes',
    'billable (per hour)',
    'billable rate',
    'cost rate (per hour)',
    'bill rate',
    'taxable',
    'pay type',
    'start time',
    'end time',
    'start date',
    'end date',
    'hours',
    'total',
    'duration',
    'set start and end time',
    'clock in/out',
    'status',
    'break',
    'team member',
  ];

  /**
   * Locator for a custom field input/textarea by its name — matching both the
   * plain and required (" *") aria-label variants.
   */
  private customFieldInput(name: string): Locator {
    return this.page
      .locator(
        `input[aria-label="${name}"], input[aria-label="${name} *"], ` +
          `textarea[aria-label="${name}"], textarea[aria-label="${name} *"]`,
      )
      .first();
  }

  /**
   * Discovers the configured custom fields in the open STE trowser by listing
   * every visible aria-labelled input/textarea and removing the known standard
   * fields (and obvious non-fields like search / date pickers). Best-effort:
   * returns [] if the trowser markup does not match.
   */
  async getCustomFieldLabels(): Promise<string[]> {
    const inputs = this.page.locator('input[aria-label], textarea[aria-label]');
    const count = await inputs.count().catch(() => 0);
    const seen = new Set<string>();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const raw =
        (await input.getAttribute('aria-label').catch(() => null)) ?? '';
      const name = raw.replace(/\s*\*$/, '').trim();
      if (!name) continue;
      const lower = name.toLowerCase();
      if (TETimeEntriesTabPage.STANDARD_FIELD_LABELS.includes(lower)) continue;
      if (/search|calendar|date range|display by|^date$/.test(lower)) continue;
      if (seen.has(lower)) continue;
      if (!(await input.isVisible().catch(() => false))) continue;
      seen.add(lower);
      result.push(name);
    }
    return result;
  }

  /**
   * Detects whether a custom field is a dropdown (vs a plain text input).
   * Dropdown/typeahead inputs expose a combobox role, an aria-expanded state,
   * a readonly attribute, or a Dropdown wrapper element; text inputs do not.
   */
  async isCustomFieldDropdown(name: string): Promise<boolean> {
    const input = this.customFieldInput(name);
    if (!(await input.isVisible({ timeout: 2000 }).catch(() => false))) {
      return false;
    }
    const role = await input.getAttribute('role').catch(() => null);
    const ariaExpanded = await input
      .getAttribute('aria-expanded')
      .catch(() => null);
    const readonly = await input.getAttribute('readonly').catch(() => null);
    const ariaAutocomplete = await input
      .getAttribute('aria-autocomplete')
      .catch(() => null);
    if (
      role === 'combobox' ||
      ariaExpanded !== null ||
      readonly !== null ||
      ariaAutocomplete !== null
    ) {
      return true;
    }
    // Fall back to looking for a Dropdown wrapper around the field.
    const wrapper = this.page
      .locator(
        `//input[@aria-label="${name}" or @aria-label="${name} *"]` +
          `/ancestor::*[contains(@class,'Dropdown') or contains(@class,'Typeahead')]`,
      )
      .first();
    return wrapper
      .count()
      .then((c) => c > 0)
      .catch(() => false);
  }

  /**
   * Types a value into a TEXT custom field identified by its name.
   * Returns the value entered (empty string if the input was not found).
   */
  async fillCustomFieldText(name: string, textValue: string): Promise<string> {
    const input = this.customFieldInput(name);
    const visible = await input.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) {
      return '';
    }
    await input.fill(textValue, { timeout: 5000 });
    return textValue;
  }

  /**
   * Selects the option at `optionIndex` (0-based) from a DROPDOWN custom field
   * identified by its name. Returns the selected option's text.
   */
  async selectCustomFieldOption(
    name: string,
    optionIndex = 0,
  ): Promise<string> {
    const input = this.customFieldInput(name);
    await input.click({ timeout: 10000 });
    const option = this.page.getByRole('option').nth(optionIndex);
    await option.waitFor({ state: 'visible', timeout: 10000 });
    const value = ((await option.textContent()) ?? '').trim();
    await option.click();
    await this.page.waitForTimeout(1000); // settle after the option click
    return value;
  }

  /** Selects the first option from a DROPDOWN custom field by name. */
  async selectCustomFieldFirstOption(name: string): Promise<string> {
    return this.selectCustomFieldOption(name, 0);
  }

  // ==========================================================================
  // Mileage (rendered when Mileage Tracking is ON for the company)
  //
  // Selectors per the time-tracking-ui trowser:
  //   • Auto calculate checkbox: span "Auto calculate" → ancestor label input.
  //   • Miles input: the input inside the label whose span text is "Mileage".
  // Auto calculate (on) makes the miles input readonly; unchecking it enables
  // manual entry.
  // ==========================================================================

  private get mileageAutoCalculateCheckbox(): Locator {
    return this.page.locator(
      `//span[text()='Auto calculate']/ancestor::label//input[@type='checkbox']`,
    );
  }

  private get milesInput(): Locator {
    return this.page.locator(`//label[.//span[text()="Mileage"]]//input`);
  }

  /** True when the Mileage field is present in the open trowser. */
  async isMileageFieldPresent(): Promise<boolean> {
    return this.milesInput.isVisible({ timeout: 3000 }).catch(() => false);
  }

  /**
   * Enters a manual mileage value: unchecks "Auto calculate" to enable the text
   * field (with the toggle-twice fallback the app sometimes needs), then fills
   * `miles`. Returns the value entered, or '' when the field is not present.
   */
  async setMileageManual(miles: string): Promise<string> {
    if (!(await this.isMileageFieldPresent())) {
      return '';
    }
    const checkbox = this.mileageAutoCalculateCheckbox;

    // Uncheck Auto calculate to enable manual editing.
    if (await checkbox.isChecked().catch(() => false)) {
      await checkbox
        .uncheck({ force: true })
        .catch(async () => checkbox.click({ force: true }));
      await this.page.waitForTimeout(500);
    }

    // If still not editable, toggle the checkbox on→off to unlock the input.
    if (!(await this.milesInput.isEditable().catch(() => false))) {
      await checkbox.check({ force: true }).catch(() => undefined);
      await this.page.waitForTimeout(300);
      await checkbox.uncheck({ force: true }).catch(() => undefined);
      await this.page.waitForTimeout(300);
    }

    await this.milesInput.fill(miles, { timeout: 5000 });
    await this.page.waitForTimeout(500);
    return miles;
  }

  // ==========================================================================
  // Name selection + "Currently working"
  // ==========================================================================

  /**
   * Opens the Name dropdown and selects an employee. If `preferred` is given and
   * a matching option exists it is chosen; otherwise the first real option
   * (skipping "+ Add new"). Returns the selected option's text.
   */
  async selectNameOption(preferred?: string): Promise<string> {
    await this.stePage.openDropdown('Name');
    await this.page.waitForTimeout(1000);

    const options = this.page.getByRole('option');
    await options.first().waitFor({ state: 'visible', timeout: 10000 });
    const texts = (
      await options.allInnerTexts().catch(() => [] as string[])
    ).map((t) => t.trim());

    const addNew = /add\s+(a\s+)?new|^\s*\+/i;
    let idx = -1;
    if (preferred) {
      const want = preferred.replace(/[\s,]+/g, '').toLowerCase();
      idx = texts.findIndex((t) =>
        t
          .replace(/[\s,]+/g, '')
          .toLowerCase()
          .includes(want),
      );
    }
    if (idx === -1) idx = texts.findIndex((t) => !addNew.test(t));
    if (idx === -1) idx = 0;

    // Option text is "Name\nRole" (e.g. "Test Emp1\nEmployee"); keep just the
    // first line so the returned name matches what other views display.
    const selected = (texts[idx] ?? '').split('\n')[0].trim();
    await options.nth(idx).click({ force: true, timeout: 10000 });
    await this.page.waitForTimeout(1000);
    return selected;
  }

  /**
   * Opens the Name dropdown and selects an employee different from `excludeName`
   * (normalized, order-insensitive). Falls back to the second real option, then
   * the first, when only one worker exists on the account.
   */
  async selectNameOptionExcluding(excludeName: string): Promise<string> {
    await this.stePage.openDropdown('Name');
    await this.page.waitForTimeout(1000);

    const options = this.page.getByRole('option');
    await options.first().waitFor({ state: 'visible', timeout: 10000 });
    const texts = (
      await options.allInnerTexts().catch(() => [] as string[])
    ).map((t) => t.trim());

    const addNew = /add\s+(a\s+)?new|^\s*\+/i;
    const normalize = (s: string) =>
      s
        .replace(/[\s,]+/g, '')
        .toLowerCase()
        .split('\n')[0];
    const excludeNorm = normalize(excludeName);

    const realIndices: number[] = [];
    for (let i = 0; i < texts.length; i++) {
      if (!addNew.test(texts[i])) {
        realIndices.push(i);
      }
    }

    let pickIdx = realIndices.find((i) => {
      const nameNorm = normalize(texts[i]);
      return (
        nameNorm.length > 0 &&
        !nameNorm.includes(excludeNorm) &&
        !excludeNorm.includes(nameNorm)
      );
    });
    if (pickIdx === undefined) {
      pickIdx = realIndices[1] ?? realIndices[0] ?? 0;
    }

    const selected = (texts[pickIdx] ?? '').split('\n')[0].trim();
    await options.nth(pickIdx).click({ force: true, timeout: 10000 });
    await this.page.waitForTimeout(1000);
    return selected;
  }

  private get currentlyWorkingCheckbox(): Locator {
    return this.page.locator(
      `//span[text()='Currently working']/ancestor::label/descendant::input`,
    );
  }

  private get currentlyWorkingLabel(): Locator {
    return this.page
      .locator(`//span[text()='Currently working']/ancestor::label`)
      .first();
  }

  /**
   * Checks/unchecks "Currently working". The control reports its state via
   * aria-checked (not always native `checked`), so we read both and toggle by
   * clicking the label (the reliable visible target) when the state differs.
   */
  async setCurrentlyWorking(checked: boolean): Promise<void> {
    const checkbox = this.currentlyWorkingCheckbox;
    if (!(await checkbox.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }
    const ariaChecked = await checkbox
      .getAttribute('aria-checked')
      .catch(() => null);
    const nativeChecked = await checkbox.isChecked().catch(() => false);
    const isOn = ariaChecked === 'true' || nativeChecked;
    if (isOn !== checked) {
      await this.currentlyWorkingLabel
        .click({ force: true })
        .catch(() => checkbox.click({ force: true }));
      await this.page.waitForTimeout(1000);
    }
  }

  // ==========================================================================
  // Who's Working map (button + trowser are in this repo; the map content is an
  // external "time-tracking-ui/whosworking" widget, so its internals are
  // best-effort).
  // ==========================================================================

  private get whosWorkingButton(): Locator {
    // The button's accessible name is its aria-label ("Who's working map
    // button"), while its visible text is "View who's working". Match either,
    // plus the data-testid when present.
    return this.page
      .locator(`button[aria-label="Who's working map button"]`)
      .or(this.page.locator(`[data-testid="whos-working-map-button"]`))
      .or(this.page.getByRole('button', { name: "View who's working" }))
      .or(this.page.getByText("View who's working"));
  }

  /**
   * Reliable signal that the Who's working map trowser is open: it contains a
   * "Search team member" input and a "Live team map" header (the IDS Trowser is
   * not necessarily role="dialog", so we key off its content instead).
   */
  private get whosWorkingPanel(): Locator {
    return this.page
      .locator(`input[aria-label="Search team member"]`)
      .or(this.page.getByText('Live team map'))
      .first();
  }

  async isWhosWorkingMapOpen(): Promise<boolean> {
    return this.whosWorkingPanel
      .isVisible({ timeout: 2000 })
      .catch(() => false);
  }

  /** Clicks "View who's working" and waits for the map trowser to open. */
  async openWhosWorkingMap(): Promise<void> {
    if (await this.isWhosWorkingMapOpen()) {
      return; // already open — don't re-click (the button is covered by it)
    }
    await this.whosWorkingButton.first().click({ timeout: 15000 });
    await this.whosWorkingPanel
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => undefined);
    await this.page.waitForTimeout(3000); // allow the map widget to load
  }

  /** Name variants to search for in the map ("Test Emp1" ↔ "Emp1, Test"). */
  private nameVariants(name: string): string[] {
    const trimmed = name.trim();
    const variants = new Set<string>([trimmed]);
    if (trimmed.includes(',')) {
      const [last, first] = trimmed.split(',').map((s) => s.trim());
      if (first && last) variants.add(`${first} ${last}`);
    } else {
      const parts = trimmed.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        variants.add(
          `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`,
        );
      }
    }
    return Array.from(variants);
  }

  /** The worker-list row in the map that contains the given name. */
  private whosWorkingRow(name: string): Locator {
    return this.page
      .locator(`tr[class*="WorkerRow"]`)
      .filter({ hasText: name })
      .first();
  }

  /** Is the worker shown in the open Who's working map worker list? */
  async isWorkerInWhosWorking(name: string): Promise<boolean> {
    for (const variant of this.nameVariants(name)) {
      // Preferred: the worker-name cell in the worker list.
      const inList = this.page
        .locator(`[class*="WorkerNameDetails"]`)
        .filter({ hasText: variant });
      if (
        await inList
          .first()
          .isVisible({ timeout: 5000 })
          .catch(() => false)
      ) {
        return true;
      }
      // Fallback: any worker row / visible text with the name.
      if (
        await this.whosWorkingRow(variant)
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Clicks the "Edit Time" action for a worker in the Who's working map (scoped
   * to that worker's row when `name` is given). Returns true if the STE trowser
   * opened as a result.
   */
  async clickEditInWhosWorking(name?: string): Promise<boolean> {
    // Try each name variant ("Last, First" ↔ "First Last") so the worker row is
    // found regardless of how the map renders the name; fall back to page scope.
    const scopes: Array<Locator | Page> = name
      ? this.nameVariants(name).map((variant) => this.whosWorkingRow(variant))
      : [this.page];
    scopes.push(this.page);

    for (const scope of scopes) {
      // The worker's action button: <button class="…WorkerListstyled__ActionButton…">
      // <span>Edit Time</span></button>.
      const editControl = scope
        .locator(`button[class*="WorkerListstyled__ActionButton"]`)
        .filter({ hasText: 'Edit Time' })
        .or(
          scope
            .locator(`button[class*="ActionButton"]`)
            .filter({ hasText: 'Edit Time' }),
        )
        .or(scope.getByRole('button', { name: /edit time/i }))
        .first();

      if (
        !(await editControl.isVisible({ timeout: 5000 }).catch(() => false))
      ) {
        continue;
      }
      await editControl.scrollIntoViewIfNeeded().catch(() => undefined);
      await editControl.click({ timeout: 10000 }).catch(() => undefined);
      await this.page.waitForTimeout(2000);
      return this.stePage.headingSingleTimeEntry
        .isVisible({ timeout: 8000 })
        .catch(() => false);
    }
    return false;
  }

  /** Closes the Who's working trowser if it is open (retries Close/Cancel/Esc). */
  async closeWhosWorkingMap(): Promise<void> {
    const close = this.page
      .getByRole('button', { name: 'Close' })
      .or(this.page.getByRole('button', { name: 'Cancel' }))
      .first();
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!(await this.isWhosWorkingMapOpen())) {
        return;
      }
      await close.click({ timeout: 3000 }).catch(() => undefined);
      if (await this.isWhosWorkingMapOpen()) {
        await this.page.keyboard.press('Escape').catch(() => undefined);
      }
      await this.page.waitForTimeout(800);
    }
  }

  // ==========================================================================
  // Save validation (hard — a failed save must fail the test)
  // ==========================================================================

  /**
   * Collects any error text currently surfaced in/around the STE trowser:
   * generic alerts, the single-time error banner, future-time and overlap
   * validation messages. Returns a single joined string ('' when none).
   */
  async collectTrowserErrors(): Promise<string> {
    const messages: string[] = [];
    const candidates = [
      this.page.getByRole('alert'),
      this.page.locator(
        `//div[@data-automation-id="SingleTimeHOCErrorPageMessage"]`,
      ),
      this.page.getByText('Something went wrong.'),
      this.page.getByText('Try again later.'),
      this.page.getByText('Start or end time cannot be in the future.'),
      this.page.getByText(
        'This time entry conflicts with an existing time entry.',
      ),
      this.page.getByText('End time conflicts with an existing time entry.'),
      this.page.locator(`//*[contains(text(), 'already has a timesheet')]`),
    ];
    for (const candidate of candidates) {
      const count = await candidate.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const el = candidate.nth(i);
        if (await el.isVisible().catch(() => false)) {
          const text = ((await el.textContent().catch(() => '')) ?? '').trim();
          if (text) {
            messages.push(text);
          }
        }
      }
    }
    return Array.from(new Set(messages)).join(' | ');
  }

  /**
   * Asserts the save succeeded: the "Time entry added." toast must appear. If it
   * does not, any error surfaced in the trowser is logged and a hard error is
   * thrown so the test fails (instead of silently passing).
   */
  async expectSaveSucceeded(): Promise<void> {
    const successToast = this.page.getByText('Time entry added.');
    try {
      await expect(successToast).toBeVisible({ timeout: 15000 });
    } catch {
      // Save-and-close on an edit can succeed without re-showing the add toast.
      const trowserClosed = await this.stePage.headingSingleTimeEntry
        .isHidden({ timeout: 5000 })
        .catch(() => false);
      if (trowserClosed) {
        console.log(
          '[TE01][save] Save succeeded — STE trowser closed after save',
        );
        return;
      }
      const errorText = await this.collectTrowserErrors();
      const detail =
        errorText || 'success toast "Time entry added." never appeared';
      // eslint-disable-next-line no-console
      console.error('[TE01][save] Save failed — %s', detail);
      throw new Error(`STE save failed — ${detail}`);
    }
    console.log(
      '[TE01][save] Save succeeded — "Time entry added." toast shown',
    );
  }

  // ==========================================================================
  // Grid verification
  // ==========================================================================

  /**
   * Returns a header→value map for the grid row that contains the given Notes
   * text. Handles the leading expander cell the same way the existing
   * `getRowObjectForEmployee` does (slice off the first td when the row has one
   * more cell than there are headers).
   */
  async getRowObjectByNotes(notes: string): Promise<Record<string, string>> {
    const row = this.page
      .locator(`//tbody//tr[contains(., '${notes}')]`)
      .first();
    await row.waitFor({ state: 'visible', timeout: 10000 });

    const headers = await this.tePageBase.getTableHeaders();
    const tds = await row.locator('td').allTextContents();
    const tdsToUse = tds.length > headers.length ? tds.slice(1) : tds;
    return Object.fromEntries(
      headers.map((header, idx) => [header, (tdsToUse[idx] ?? '').trim()]),
    );
  }

  /**
   * Ensures a column is shown in the grid. No-op when the column is already
   * visible; otherwise opens the Settings gear and ticks its checkbox (which
   * auto-closes the drawer). Matches the real UI flow where each column needs
   * its own gear-open → toggle cycle.
   */
  async ensureColumnVisibleViaSettings(columnName: string): Promise<void> {
    const headers = await this.getVisibleColumnNames();
    const alreadyVisible = headers.some(
      (h) => h.toLowerCase() === columnName.toLowerCase(),
    );
    if (alreadyVisible) {
      return;
    }
    await this.setColumnVisibility(columnName, true);
  }

  // ==========================================================================
  // Time Clock (clock-in drawer opened from "Add time → Time clock")
  //
  // These thin helpers COMPOSE the existing functional TimeClockPage selectors
  // (imported as `TimeClock`) so the TE Time-Clock suite reuses the same
  // selectors as the dedicated Time Clock spec instead of duplicating them.
  // ==========================================================================

  /**
   * Opens the Time Clock drawer via the on-page **Clock In** button on the Time
   * Entries page (the `TimeActionButton` widget). Time Clock is NOT exposed
   * under the "Add time" dropdown — this mirrors `TimeClockPage.clickClockIn`,
   * which also clears any leftover running clock before opening the drawer.
   */
  async openTimeClock(): Promise<void> {
    await TimeClock.clickClockIn(this.page);
    await TimeClock.waitForDrawerVisible(this.page).catch(() => undefined);
    // Let the drawer's content (spinner → fields) finish rendering before any
    // caller reads values like the Name field.
    await this.waitForLoadingToDisappear().catch(() => undefined);
    await this.page.waitForTimeout(2000);
  }

  /** True when the Time Clock drawer/header is visible. */
  async isTimeClockDrawerOpen(): Promise<boolean> {
    return this.page
      .locator(`[data-test-id="time-clock-header"]`)
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  /**
   * Closes the Time Clock drawer if it is open, then handles the
   * "Do you want to save changes?" confirmation popup if it appears.
   * `keepChanges` (default true) clicks "Save"; false clicks "Don't save".
   */
  async closeTimeClockDrawer(keepChanges: boolean = true): Promise<void> {
    if (!(await this.isTimeClockDrawerOpen())) {
      return;
    }
    await TimeClock.clickDrawerClose(this.page).catch(() => undefined);
    await this.handleSaveChangesPopup(keepChanges);
  }

  /**
   * Handles the "Do you want to save changes?" / "Want to save your changes?"
   * confirmation that can appear when closing the clock drawer with edits.
   * keepChanges=true clicks "Save"; false clicks "Don't save". No-op when the
   * popup is not shown.
   */
  async handleSaveChangesPopup(keepChanges: boolean = true): Promise<void> {
    const popup = this.page.getByText(/want to save your changes/i).first();
    if (!(await popup.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    const modal = this.page.locator('[aria-modal="true"]').filter({
      has: this.page.getByText(/want to save your changes/i),
    });

    if (keepChanges) {
      await modal
        .getByRole('button', { name: /^save$/i })
        .click({ timeout: 10_000 });
    } else {
      await modal
        .getByRole('button', { name: /don'?t save/i })
        .click({ timeout: 10_000 });
    }

    await popup
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => undefined);
    await this.waitForLoadingToDisappear().catch(() => undefined);
  }

  /**
   * Selects the first available Time Location (Location, falling back to
   * Department) in the clock-in drawer. Returns the selected option text, or ''
   * when the company has no location/department configured.
   */
  async selectFirstTimeLocation(): Promise<string> {
    const locationOptions = await TimeClock.getLocationOptions(this.page).catch(
      () => [] as string[],
    );
    if (locationOptions.length > 0) {
      await TimeClock.selectLocation(this.page, locationOptions[0]).catch(
        () => undefined,
      );
      await this.page.waitForTimeout(1000);
      // Return the value actually committed to the field (the real location
      // name shown to the user), not the option-list label — these can differ,
      // and downstream verification must match what the UI displays.
      const committed = await this.getCapturedTimeLocation();
      return committed || locationOptions[0];
    }
    const departmentOptions = await TimeClock.getDepartmentOptions(
      this.page,
    ).catch(() => [] as string[]);
    if (departmentOptions.length > 0) {
      await TimeClock.selectDepartment(this.page, departmentOptions[0]).catch(
        () => undefined,
      );
      await this.page.waitForTimeout(1000);
      const committed = await this.getCapturedTimeLocation();
      return committed || departmentOptions[0];
    }
    return '';
  }

  /** Reads back the captured Location/Department value from the drawer (''=absent). */
  async getCapturedTimeLocation(): Promise<string> {
    const input = this.page
      .locator(`//span[text()='Location']/..//input`)
      .or(this.page.locator(`//span[text()='Department']/..//input`))
      .first();
    if (!(await input.isVisible({ timeout: 3000 }).catch(() => false))) {
      return '';
    }
    return (await input.inputValue().catch(() => '')).trim();
  }

  /** Customer/Project options available in the open clock-in drawer. */
  async getClockCustomerProjectOptions(): Promise<string[]> {
    return TimeClock.getCustomerProjectOptions(this.page).catch(
      () => [] as string[],
    );
  }

  /** Selects a Customer/Project option in the clock-in drawer. */
  async selectClockCustomerProject(option: string): Promise<void> {
    await TimeClock.selectCustomerProject(this.page, option).catch(
      () => undefined,
    );
  }

  /** Locator for the clock-in drawer's Service dropdown control. */
  private clockServiceDropdown(): Locator {
    return this.page
      .locator(
        `//span[contains(text(),'Service')]/..//following-sibling::div[contains(@id,'idsDropdownTypeaheadTextField')]`,
      )
      .first();
  }

  /**
   * Service item options available in the open clock-in drawer.
   *
   * Mirrors the proven Class/Location option readers in TimeClockPage: the
   * drawer's service items only finish loading a moment after clock-in, so we
   * wait before opening, open the dropdown, wait for the listbox, and read the
   * `li[role='option']` labels. (The base getServiceItemOptions scopes to
   * `li[id*='Dropdown']`, which does not match here and returns [].)
   */
  async getClockServiceItemOptions(): Promise<string[]> {
    const serviceElement = this.clockServiceDropdown();
    await this.page.waitForTimeout(5000);
    await serviceElement.click({ force: true, timeout: 15000 });
    await this.page.waitForTimeout(5000);
    const options = await this.page
      .locator(
        "ul[role='listbox'] li[role='option'] span[class*='RowTextLabel']",
      )
      .allTextContents();
    // Close the dropdown so it does not intercept the next action (short
    // timeout + catch so a non-actionable close never hangs the 300s default).
    await serviceElement.click({ timeout: 5000 }).catch(() => undefined);
    return options.map((t) => t.trim()).filter(Boolean);
  }

  /**
   * Selects a Service item in the clock-in drawer and returns the value read
   * back from the input (for verifying the selection persisted).
   */
  async selectClockServiceItem(option: string): Promise<string> {
    await this.clockServiceDropdown()
      .click({ force: true, timeout: 15000 })
      .catch(() => undefined);
    await this.page.waitForTimeout(1000);
    await this.page
      .getByRole('option', { name: option, exact: false })
      .first()
      .click({ force: true, timeout: 15000 });
    await this.page.waitForTimeout(1000);
    return (
      await this.page
        .locator(`//span[contains(text(),'Service')]/..//input`)
        .first()
        .inputValue()
        .catch(() => '')
    ).trim();
  }

  /**
   * Reads the inline required-field validation message shown when clocking out
   * with a mandatory field (e.g. Service) left empty. Returns '' if none.
   */
  async getClockRequiredFieldError(): Promise<string> {
    return (
      (await TimeClock.getTimeErrorMessage(this.page).catch(() => '')) ?? ''
    ).trim();
  }

  /** True when the in-drawer Clock Out button is visible (clock is running). */
  async isClockOutButtonVisible(): Promise<boolean> {
    return TimeClock.isClockOutButtonVisible(this.page).catch(() => false);
  }

  /**
   * Reads ANY visible "This field is required" inline validation message in the
   * drawer — works for text custom fields (CF1) as well as dropdown fields,
   * unlike `getClockRequiredFieldError` which only scopes to typeahead dropdowns.
   * Returns '' when no such message is shown.
   */
  async getRequiredFieldError(): Promise<string> {
    const msg = this.page
      .getByText('This field is required', { exact: false })
      .first();
    if (!(await msg.isVisible({ timeout: 5000 }).catch(() => false))) {
      return '';
    }
    return ((await msg.textContent().catch(() => '')) ?? '').trim();
  }

  /**
   * Reads the full-page validation banner shown when clock-out/save is blocked
   * (data-test-id="ClockOutSaveErrorPageMessage"). Returns '' when absent.
   */
  async getClockOutSaveErrorMessage(): Promise<string> {
    const pageMessage = this.page.getByTestId('ClockOutSaveErrorPageMessage');
    if (!(await pageMessage.isVisible({ timeout: 5000 }).catch(() => false))) {
      return '';
    }
    return ((await pageMessage.textContent().catch(() => '')) ?? '').trim();
  }

  /** Combines inline and page-message clock validation errors. */
  async getAnyClockRequiredFieldError(): Promise<string> {
    const inline =
      (await this.getRequiredFieldError()) ||
      (await this.getClockRequiredFieldError());
    if (inline) {
      return inline;
    }
    return (await this.getClockOutSaveErrorMessage()).trim();
  }

  /** True when the clock drawer's Service label shows the required asterisk. */
  async isClockServiceRequired(): Promise<boolean> {
    const input = this.page
      .locator(`//span[contains(text(),'Service')]/..//input`)
      .first();
    const ariaLabel =
      (await input.getAttribute('aria-label').catch(() => null)) ?? '';
    if (/\*\s*$/.test(ariaLabel.trim())) {
      return true;
    }
    const label = this.page
      .locator(`//span[contains(text(),'Service')]`)
      .first();
    const text = ((await label.textContent().catch(() => '')) ?? '').trim();
    return /\*\s*$/.test(text) || text.includes(' *');
  }

  /** Current Service input value in the open clock drawer. */
  async getClockServiceValue(): Promise<string> {
    return (
      (await this.page
        .locator(`//span[contains(text(),'Service')]/..//input`)
        .first()
        .inputValue()
        .catch(() => '')) ?? ''
    ).trim();
  }

  /**
   * Fills the Notes textarea inside the clock-in drawer (the drawer uses an IDS
   * textarea, not the STE text input, so the STE notes helper does not match).
   */
  async fillClockNotes(value: string): Promise<void> {
    const notesTextarea = this.page
      .locator('[class*="NotesContainer"] textarea')
      .or(this.page.getByTestId('notes-row').locator('textarea'))
      .or(
        this.page.locator(
          `//span[contains(text(),'Notes')]/following-sibling::textarea`,
        ),
      )
      .or(this.page.getByRole('textbox', { name: /\bNotes\s*\*?$/i }))
      .first();
    if (
      !(await notesTextarea.isVisible({ timeout: 5000 }).catch(() => false))
    ) {
      return;
    }
    await notesTextarea.clear().catch(() => undefined);
    await notesTextarea.fill(value).catch(() => undefined);
  }

  /** Checks/unchecks the Billable checkbox inside the clock-in drawer if present. */
  async setClockBillable(checked: boolean): Promise<void> {
    const billableCheckbox = this.page
      .locator('[data-test-id="time-clock-drawer"]')
      .locator('[class*="BillableCheckbox"] input[type="checkbox"]')
      .first();
    if (
      !(await billableCheckbox.isVisible({ timeout: 3000 }).catch(() => false))
    ) {
      return;
    }
    if ((await billableCheckbox.isChecked()) !== checked) {
      await billableCheckbox.setChecked(checked).catch(() => undefined);
    }
  }

  /** Clicks the Clock In button inside the drawer. */
  async clockIn(): Promise<void> {
    await TimeClock.clickOnClockInButton(this.page);
    await this.waitForLoadingToDisappear().catch(() => undefined);
  }

  /** Clicks Clock Out inside the drawer. */
  async clockOut(): Promise<void> {
    await TimeClock.clickClockOut(this.page);
  }

  async isClockedIn(): Promise<boolean> {
    return TimeClock.isClockOutButtonVisible(this.page).catch(() => false);
  }

  async isClockedOut(): Promise<boolean> {
    return TimeClock.isClockInButtonVisible(this.page).catch(() => false);
  }

  /** True when the running timer has advanced past 00:00:00 (clock is active). */
  async isClockTimerRunning(): Promise<boolean> {
    return TimeClock.validateTimerGreaterThanZero(this.page).catch(() => false);
  }

  async getClockInToastMessage(): Promise<string> {
    return (
      (await TimeClock.getClockedInMessage(this.page).catch(() => '')) ?? ''
    ).trim();
  }

  async getClockOutToastMessage(): Promise<string> {
    return (
      (await TimeClock.getClockedOutMessage(this.page).catch(() => '')) ?? ''
    ).trim();
  }

  /**
   * The admin/employee display name shown in the Time Clock header
   * (e.g. "Test Admin is clocked in" → "Test Admin"). Returns '' if unreadable.
   */
  async getClockUserName(): Promise<string> {
    const header = (
      (await TimeClock.getAdminHeader(this.page).catch(() => '')) ?? ''
    ).trim();
    if (!header) {
      return '';
    }
    // Strip the trailing status suffix, e.g. "<name> clocked in at 3:14 PM" or
    // "<name> is clocked out" → "<name>".
    return header.replace(/\s+(is\s+)?clocked\s+(in|out)\b.*$/i, '').trim();
  }

  /**
   * Reads the Name value shown in the clock drawer BEFORE clock-in (the plain
   * text under the "Name" label, e.g. the user's email). Returns '' if absent.
   */
  async getClockDrawerName(): Promise<string> {
    const value = this.page
      .locator(`//*[normalize-space(text())='Name']/following-sibling::*[1]`)
      .or(this.page.locator(`//*[normalize-space(text())='Name']/../*[2]`))
      .first();
    // The drawer shows a loading spinner before the Name resolves, so wait for
    // the field to appear and then poll until it actually has text (up to ~15s)
    // instead of reading once and racing the spinner.
    await value
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => undefined);
    let text = '';
    for (let attempt = 0; attempt < 15; attempt++) {
      text = ((await value.textContent().catch(() => '')) ?? '').trim();
      if (text.length > 0) {
        break;
      }
      await this.page.waitForTimeout(1000);
    }
    return text;
  }

  /** True when the pre-clock-in "Clock in to start tracking time" header shows. */
  async isClockInPromptVisible(): Promise<boolean> {
    return this.page
      .locator(
        `//*[contains(normalize-space(.), 'Clock in to start tracking')]`,
      )
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  /** True when the clock drawer Start date picker is visible. */
  async isClockStartDateVisible(): Promise<boolean> {
    return this.page
      .locator(`//span[text()='Start date']`)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  /** True when the clock drawer Start time dropdown is visible. */
  async isClockStartTimeVisible(): Promise<boolean> {
    return this.page
      .locator(`//span[text()='Start time']`)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  /**
   * The green "…clocked in at …" status header shown after clock-in
   * (e.g. "user@x.com clocked in at 2:39 PM"). Returns '' if not present.
   */
  async getClockedInHeaderText(): Promise<string> {
    return (
      (await TimeClock.getAdminHeader(this.page).catch(() => '')) ?? ''
    ).trim();
  }

  /**
   * Selects the first available Class in the clock drawer. Returns the selected
   * option text, or '' when no class is configured.
   */
  async selectFirstClockClass(): Promise<string> {
    const options = await TimeClock.getClassOptions(this.page).catch(
      () => [] as string[],
    );
    if (options.length === 0) {
      return '';
    }
    await TimeClock.selectClass(this.page, options[0]).catch(() => undefined);
    return options[0];
  }

  /**
   * Clicks the "Save" button inside the clock drawer (persists the running entry
   * WITHOUT clocking out). Scoped to the drawer so it does not collide with the
   * STE Save button.
   */
  async clickSaveInClockDrawer(): Promise<void> {
    const saveBtn = this.page
      .locator('[data-test-id="time-clock-drawer"]')
      .getByRole('button', { name: /^save$/i })
      .or(this.page.getByRole('button', { name: /^save$/i }))
      .first();
    await saveBtn.click({ timeout: 10000 }).catch(() => undefined);
    await this.waitForLoadingToDisappear().catch(() => undefined);
  }

  /**
   * Clicks the running Time Clock timer widget on the Time Entries page to
   * reopen the drawer (used after Save, when the clock is still running). Unlike
   * `openTimeClock`, it does not run the leftover-clock cleanup path.
   */
  /** The on-page Time Clock timer/action button (aria-label="timeclock-action-button"). */
  private get timeClockActionButton(): Locator {
    return this.page
      .locator('[aria-label="timeclock-action-button"]')
      .or(
        this.page.locator(
          `//button[.//span[contains(@class, 'TimeActionButton')]]`,
        ),
      )
      .first();
  }

  async openRunningClockTimer(): Promise<void> {
    const widget = this.timeClockActionButton;
    await widget
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => undefined);
    await widget.click({ timeout: 10000 }).catch(() => undefined);
    // Wait for the drawer trowser to be visible before any further interaction.
    await this.page
      .locator(`[data-test-id="time-clock-header"]`)
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => undefined);
  }

  /**
   * True when the on-page Time Clock timer widget is visible — i.e. we are on
   * the Time Entries screen (it is NOT present on the Who's Working map).
   */
  async isRunningClockTimerVisible(): Promise<boolean> {
    return this.timeClockActionButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  /** Waits for the in-drawer Clock Out button to be visible (clock running). */
  async waitForClockOutButton(): Promise<boolean> {
    return this.page
      .locator(`[data-test-id="time-clock-out-button"]`)
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);
  }

  /** Reads a custom field's current value from the open trowser ('' if absent). */
  async getCustomFieldValue(name: string): Promise<string> {
    const input = this.customFieldInput(name);
    if (!(await input.isVisible({ timeout: 3000 }).catch(() => false))) {
      return '';
    }
    return ((await input.inputValue().catch(() => '')) ?? '').trim();
  }

  // ==========================================================================
  // Weekly Time Entry (WTE) trowser helpers (aligned with WeeklyTimeEntry.util)
  // ==========================================================================

  /** Wait for Team Member dropdown; reopen WTE once if still hidden (prod/CI). */
  private async waitForWteTeamMemberDropdown(): Promise<void> {
    const dropdown = wteGrid.teamMemberDropdown(this.page).first();
    await this.page.waitForTimeout(500);
    await wteGrid.closeTeamMemberTooltip(this.page);

    if (!(await dropdown.isVisible().catch(() => false))) {
      await wteGrid.handlePopupsInAnyOrder(this.page);
    }
    if (!(await dropdown.isVisible().catch(() => false))) {
      await this.tePageBase.navigateToTimeEntriesPage();
      await this.openWeeklyTimeEntryTrowser();
      await this.tePageBase.dismissIntuitIntelligenceIfVisible();
      await wteGrid.handlePopupsInAnyOrder(this.page);
    }

    await dropdown.waitFor({ state: 'visible', timeout: 60000 });
  }

  async openWeeklyTimeEntryTrowser(): Promise<void> {
    await this.common.clickAddTimeDropdown();
    await this.common.dismissGotItPopupIfVisible();
    const weeklyEntry = this.page
      .locator(`//span[text()='Weekly time entry']`)
      .first();
    const weeklyTimesheet = this.page
      .locator(`//span[text()='Weekly timesheet']`)
      .first();
    if (await weeklyEntry.isVisible().catch(() => false)) {
      await weeklyEntry.click();
    } else {
      await weeklyTimesheet.click();
    }
    await wteGrid.waitForLoadingToDisappear(this.page);
    await wteGrid.handlePopupsInAnyOrder(this.page);
    await expect(wteGrid.teamMemberDropdown(this.page).first()).toBeVisible({
      timeout: 60000,
    });
  }

  async prepareWeeklySheet(
    selectTeamMember = true,
    teamMemberLabel?: string,
  ): Promise<string> {
    await wteGrid.handlePopupsInAnyOrder(this.page);
    await this.waitForWteTeamMemberDropdown();

    let teamMemberName = '';
    if (selectTeamMember) {
      if (teamMemberLabel?.trim()) {
        await wteGrid.selectTeamMemberByMainLabel(
          this.page,
          teamMemberLabel.trim(),
        );
        teamMemberName = teamMemberLabel.trim();
      } else {
        await wteGrid.teamMemberDropdown(this.page).first().click();
        await wteGrid.clickDropdownOption(this.page);
        teamMemberName =
          (await wteGrid
            .teamMemberDropdownValue(this.page)
            .inputValue()
            .catch(() => '')) || '';
      }
      await this.page.waitForTimeout(2000);
    }
    return teamMemberName.trim();
  }

  /** Clears the default row before adding customer/hours (WeeklyTimeEntry.util pattern). */
  async clearDefaultWeeklyRow(): Promise<void> {
    await wteGrid.clickOnDeleteRow(this.page, 1).catch(() => undefined);
    await wteGrid.saveButton(this.page).click();
    await this.page.waitForTimeout(1000);
  }

  async clickWeekdayCell(columnIndex = 3, rowIndex = 1): Promise<void> {
    void rowIndex;
    const cell = wteGrid.hours(this.page, columnIndex);
    await cell.waitFor({ state: 'visible', timeout: 10000 });
    await cell.scrollIntoViewIfNeeded().catch(() => undefined);
    await cell.click({ force: true });
    // CellInput is often not a stable child of the td (editor mounts at row
    // level). After clicking the day cell, wait for the active grid input.
    // Do NOT press Escape — it dismisses the Weekly time entry trowser.
    const input = wteGrid.hoursInputs(this.page).first();
    const opened = await input
      .waitFor({ state: 'visible', timeout: 2000 })
      .then(() => true)
      .catch(() => false);
    if (!opened) {
      await this.page.waitForTimeout(300);
      await cell.click({ force: true });
      await input.waitFor({ state: 'visible', timeout: 5000 });
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * Fills hours in the active CellInput. Click the target column first via
   * {@link clickWeekdayCell} so the correct day owns the editor.
   */
  async fillActiveCellHours(
    hours: string,
    columnIndex?: number,
  ): Promise<void> {
    if (columnIndex != null) {
      await this.clickWeekdayCell(columnIndex);
    }
    const input = wteGrid.hoursInputs(this.page).first();
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.fill(hours);
    // Do NOT blur here: blur moves selection to the next day, and dimension
    // edits would then apply to the wrong cell. Hours commit when the next
    // day is clicked or on Save.
    await this.page.waitForTimeout(300);
  }

  /**
   * Reads the displayed hours text for a WTE day column (1-based; customer
   * is col 1, Sun=2 … Sat=8). Empty/whitespace → "".
   */
  async getWeekdayCellHoursText(columnIndex: number): Promise<string> {
    const cell = wteGrid.hours(this.page, columnIndex);
    await cell.waitFor({ state: 'visible', timeout: 5000 });
    const text = ((await cell.innerText().catch(() => '')) ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    return text;
  }

  /** Clears hours in the active day cell (WTE-safe keyboard clear). */
  async clearActiveCellHours(columnIndex?: number): Promise<void> {
    if (columnIndex != null) {
      await this.clickWeekdayCell(columnIndex);
    }
    const input = wteGrid.hoursInputs(this.page).first();
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.click();
    await this.page.keyboard.press('ControlOrMeta+a');
    await this.page.keyboard.press('Backspace');
    await this.page.waitForTimeout(200);
  }

  async selectCustomerFirstOption(): Promise<string> {
    const customerDropdown = wteGrid.customerProjectDropdown(this.page).first();
    await customerDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await customerDropdown.click();
    await this.page.waitForTimeout(500);

    // Menu shows "+ Add Customer/Project", then customers/projects.
    // Click the first real customer row — never re-click the dropdown to
    // dismiss (that re-opens the popover and blocks day cells).
    const customerRow = this.page
      .locator('li, [role="option"]')
      .filter({ hasText: /customer/i })
      .filter({ hasNotText: /add customer\/project/i })
      .first();
    await customerRow.waitFor({ state: 'visible', timeout: 10000 });
    await customerRow.click();

    await customerRow
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => undefined);
    await this.page.waitForTimeout(500);

    const name = await wteGrid.getCustomerName(this.page, 0);
    if (!name || /^select/i.test(name)) {
      throw new Error(
        `WTE: customer not selected after pick (got "${name || ''}")`,
      );
    }
    return name;
  }

  async fillSidePanelServiceClassLocation(): Promise<{
    service: string;
    className: string;
    location: string;
  }> {
    let service = '';
    let className = '';
    let location = '';

    const serviceDropdown = wteGrid.panelServiceDropdown(this.page);
    if (await serviceDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await serviceDropdown.click();
      await wteGrid.clickDropdownOption(this.page);
      service = (
        (await serviceDropdown.inputValue().catch(() => '')) ?? ''
      ).trim();
    }

    const classDropdown = wteGrid.panelClassDropdown(this.page);
    if (await classDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await classDropdown.click();
      await wteGrid.clickDropdownOption(this.page);
      className = (
        (await classDropdown.inputValue().catch(() => '')) ?? ''
      ).trim();
    }

    const locationDropdown = wteGrid.panelLocationDropdown(this.page);
    if (
      await locationDropdown.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await locationDropdown.click();
      await wteGrid.clickDropdownOption(this.page);
      location = (
        (await locationDropdown.inputValue().catch(() => '')) ?? ''
      ).trim();
    }

    return { service, className, location };
  }

  async getSidePanelLocationValue(): Promise<string> {
    const locationDropdown = wteGrid.panelLocationDropdown(this.page);
    if (
      !(await locationDropdown.isVisible({ timeout: 2000 }).catch(() => false))
    ) {
      return '';
    }
    return ((await locationDropdown.inputValue().catch(() => '')) ?? '').trim();
  }

  async fillSidePanelNotes(notes: string): Promise<void> {
    const notesInput = wteGrid.panelNotes(this.page);
    if (await notesInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notesInput.fill(notes);
    }
  }

  async setSidePanelBillable(rate = '50'): Promise<boolean> {
    const result = await this.setSidePanelBillableAndRate(rate);
    return result.applied;
  }

  /**
   * Checks Billable and fills billable rate in the WTE side panel.
   * Uses the original role-based locators that work on this surface.
   */
  async setSidePanelBillableAndRate(rate = '50'): Promise<{
    applied: boolean;
    billableChecked: boolean;
    rateValue: string;
  }> {
    const billable = wteGrid.panelBillable(this.page);
    if (!(await billable.isVisible({ timeout: 2000 }).catch(() => false))) {
      return { applied: false, billableChecked: false, rateValue: '' };
    }
    const checkbox = this.page
      .getByRole('checkbox', { name: /billable/i })
      .first();
    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.check({ force: true }).catch(() => undefined);
    }
    const billableChecked = await checkbox.isChecked().catch(() => false);
    const rateInput = this.page.getByRole('textbox', {
      name: /billable rate/i,
    });
    if (await rateInput.isVisible().catch(() => false)) {
      await rateInput.fill(rate).catch(() => undefined);
    }
    const rateValue = await rateInput.inputValue().catch(() => '');
    return { applied: true, billableChecked, rateValue };
  }

  /**
   * Reopens the TE grid row matching `notes` via its Edit control.
   * Same action-cell pattern as approveEntryByNotes / unapproveEntryByNotes.
   */
  async reopenEntryByNotes(notes: string): Promise<boolean> {
    const row = this.getRowByNotes(notes);
    if (!(await row.isVisible().catch(() => false))) return false;
    await row.scrollIntoViewIfNeeded().catch(() => undefined);
    const edit = row
      .locator(`xpath=.//span[text()='Edit']`)
      .or(row.getByRole('link', { name: /^edit$/i }))
      .or(row.getByRole('button', { name: /^edit$/i }))
      .first();
    if (!(await edit.isVisible({ timeout: 15000 }).catch(() => false))) {
      return false;
    }
    await edit.click();
    return true;
  }

  /** Date range → This month (TE list). */
  async selectDateRangeThisMonth(): Promise<void> {
    await this.common.openDateRangeDropdown().catch(() => undefined);
    await this.common
      .selectDateRangeOption('This month')
      .catch(() => undefined);
    await this.waitForLoadingToDisappear().catch(() => undefined);
  }

  /**
   * Filter refresh used after edits: Display by Customer → Date, then
   * Date range = This month.
   */
  async resetListFiltersToThisMonth(): Promise<void> {
    await this.common.selectDisplayByOption('Customer').catch(() => undefined);
    await this.waitForLoadingToDisappear().catch(() => undefined);
    await this.common.selectDisplayByOption('Date').catch(() => undefined);
    await this.waitForLoadingToDisappear().catch(() => undefined);
    await this.selectDateRangeThisMonth();
  }

  async wteSave(): Promise<void> {
    await wteGrid.saveButton(this.page).click();
    await this.page.waitForTimeout(1000);
  }

  async wteSaveAndClose(): Promise<void> {
    await wteGrid.saveAndClose(this.page);
    await this.page.waitForTimeout(1500);
    await wteGrid.waitForLoadingToDisappear(this.page);
  }

  async closeWeeklyTrowserIfOpen(): Promise<void> {
    const closeBtn = this.page
      .getByRole('button', { name: /^close$/i })
      .first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click().catch(() => undefined);
      await this.page.waitForTimeout(500);
    }
  }
}

export default TETimeEntriesTabPage;
