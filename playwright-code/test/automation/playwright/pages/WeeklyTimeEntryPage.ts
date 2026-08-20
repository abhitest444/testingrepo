import { Page, Locator, expect } from '@playwright/test';
import gotoWithAuthSession from '../gotoWithAuthSession';
import SingleTimeEntryPage from './SingleTimeEntryPage';
import TimeEntriesPage from './TimeEntriesPage';
import { clickAddTimeDropdown, escapeRegExp } from '../commonUtils';

// Locators
export const teamMemberDropdown = (page: Page): Locator =>
  page.locator(
    `//span[text()='Team Member']/..//div[contains(@class, 'DropdownTypeahead-iconBox')]`,
  );

export const leftArrowButton = (page: Page): Locator =>
  page.locator(
    `//div[contains(@class, 'DateRangePickerContainer')]//button[contains(@aria-label, 'Previous')]`,
  );

export const rightArrowButton = (page: Page): Locator =>
  page.locator(
    `//div[contains(@class, 'DateRangePickerContainer')]//button[contains(@aria-label, 'Next')]`,
  );

export const calendarButton = (page: Page): Locator =>
  page.locator(`//div[contains(@class, 'qbdsDatePicker')]`);

export const calendarModal = (page: Page): Locator =>
  page.locator(`//*[@data-automation-id="date_picker_calendar"]`);

export const dateRangeDisplay = (page: Page): Locator =>
  page.locator(`//div[contains(@class, 'DateRangePickerContainer')]//strong`);

export const firstDataCell = (page: Page): Locator =>
  page.locator(
    `(//td[contains(@class, 'WeeklyTimeEntryTablestyles') and not(@aria-label="weekly-time-category-selector")])[1]`,
  );

export const defaultPanelMessage = (page: Page): Locator =>
  page.locator(`//span[text()='Select a cell to add time details']`);

export const sidePanel = (page: Page): Locator =>
  page.locator(`//div[@data-testid="panelContent"]`);

export const dayLabelInSidePanel = (page: Page, day: string): Locator =>
  page.locator(`//span[contains(text(), '${day}')]`);

export const panelServiceDropdown = (page: Page): Locator =>
  page
    .locator(`//input[@aria-label="Select service"]`)
    .or(page.locator(`//input[@aria-label="Service"]`));

/**
 * QuickFind **service** menu (STE panel, WTE cell editor). Multiple other fields use `role="listbox"`
 * too (worker, customer, CFs); scope service **Hours** checks here, not `page.getByRole('option')`.
 */
export const quickFindServiceListbox = (page: Page): Locator =>
  page
    .getByRole('listbox')
    .filter({ hasText: /add new service item/i })
    .first();

/** **Hours** row(s) in {@link quickFindServiceListbox} (text match; scoped so not confused with other fields). */
export const quickFindServiceHoursOptions = (page: Page): Locator =>
  quickFindServiceListbox(page).getByText('Hours', { exact: true });

export const panelClassDropdown = (page: Page): Locator =>
  page
    .locator(`//input[@aria-label="Select class"]`)
    .or(page.locator(`//input[@aria-label="Class"]`));

export const panelLocationDropdown = (page: Page): Locator =>
  page
    .locator(`//input[@aria-label="Select location"]`)
    .or(page.locator(`//input[@aria-label="Location"]`));

export const panelBillable = (page: Page): Locator =>
  page.locator(
    `//div[@data-testid="panel"] / descendant::span[text()='Billable']`,
  );

export const panelNotes = (page: Page): Locator =>
  page.locator(`//textarea`).first();
export const panelSaveButton = (page: Page): Locator =>
  page
    .getByRole('button', { name: /save/i })
    .or(page.getByRole('button', { name: 'Save and close', exact: true }))
    .or(
      page.locator(`//footer/ descendant::span[contains(text(), 'Save and')]`),
    )
    .or(page.locator(`//button[contains(@aria-label, "Save and")]`))
    .first();
export const hidePanelButton = (page: Page): Locator =>
  page.locator(`//button[@aria-label="Hide Panel"]`);
export const showPanelButton = (page: Page): Locator =>
  page.locator(`//button[@aria-label="Show Panel"]`);

export const teamMemberDropdownValue = (page: Page): Locator =>
  page.locator(`//span[text()='Team Member']/..//input`);

export const customerProjectDropdown = (page: Page): Locator =>
  page.locator(
    `//td[contains(@class, 'WeeklySuperSerachstyles__SuperSearchCell')]//div/button`,
  );

export const customerProjectDropdownValue = (page: Page): Locator =>
  page.locator(
    `//span[contains(@class, 'WeeklySuperSerachstyles__CustomerNameColumn')]`,
  );

export const hours = (page: Page, index: number): Locator => {
  // 1-based: [1]=customer, [2]=Sun … [8]=Sat (TE01 Mon–Wed = 3,4,5).
  // Include SelectedCell so the active day does not drop out and shift indices.
  const grid = page
    .locator('.weekly-time-entry-table, [data-testid="weekly-timesheet-grid"]')
    .first();
  const dataRow = grid
    .locator('tr')
    .filter({
      has: page.locator(
        "[class*='DataCell'], [class*='SelectedCell'], [class*='SuperSearchCell']",
      ),
    })
    .first();
  return dataRow
    .locator(
      "td[class*='WeeklyTimeEntryTablestyles__DataCell'], td[class*='WeeklyTimeEntryTablestyles__SelectedCell'], td[class*='WeeklySuperSerachstyles__SuperSearchCell']",
    )
    .nth(index - 1);
};

export const hoursMultiple = (
  page: Page,
  rowIndex: number,
  columnIndex: number,
): Locator => {
  const grid = page
    .locator('.weekly-time-entry-table, [data-testid="weekly-timesheet-grid"]')
    .first();
  const dataRow = grid
    .locator('tr')
    .filter({
      has: page.locator(
        "[class*='DataCell'], [class*='SelectedCell'], [class*='SuperSearchCell']",
      ),
    })
    .nth(rowIndex - 1);
  return dataRow
    .locator(
      "td[class*='WeeklyTimeEntryTablestyles__DataCell'], td[class*='WeeklyTimeEntryTablestyles__SelectedCell'], td[class*='WeeklySuperSerachstyles__SuperSearchCell']",
    )
    .nth(columnIndex - 1);
};
export const hoursInputs = (page: Page): Locator =>
  page.locator(
    `//input[contains(@class, 'WeeklyTimeEntryTablestyles__CellInput')]`,
  );

export const TestAdmin = (page: Page): Locator =>
  page.locator(`//input[@aria-label="Test Admin"]`);
export const detailsCell = (page: Page): Locator =>
  page.locator(
    `//td[contains(@class, 'WeeklyTimeEntryTablestyles__FocusableCell')]`,
  );
export const serviceDropdown = (page: Page): Locator =>
  page
    .locator(
      `//div[contains(@class, 'qf-productService')]//input[@data-testid="__textField"]`,
    )
    .or(
      page.locator(
        `//div/label/div//input[@aria-label="Service"][@placeholder="Select service"]`,
      ),
    )
    .first();
export const classDropdown = (page: Page): Locator =>
  page
    .locator(
      `//div[contains(@class, 'qf-klass')]//input[@data-testid="__textField"]`,
    )
    .or(
      page.locator(
        `//div/label/div//input[@aria-label="Class"][@placeholder="Select class"]`,
      ),
    )
    .first();
export const locationDropdown = (page: Page): Locator =>
  page
    .locator(
      `//div[contains(@class, 'qf-locationV2')]//input[@data-testid="__textField"]`,
    )
    .or(
      page.locator(
        `//div/label/div//input[@aria-label="Location"][@placeholder="Select location"]`,
      ),
    )
    .first();
export const notesInput = (page: Page): Locator =>
  page.locator(`//span[contains(text(), 'Notes')]/following-sibling::textarea`);
export const saveandcloseButton = (page: Page): Locator =>
  page.locator(`//span[text()='Save and close']`);
export const keyboardIcon = (page: Page): Locator =>
  page.locator(`//button[@aria-label='Keyboard Shortcuts']`);
export const keyboardModal = (page: Page): Locator =>
  page
    .locator(
      `//div[@role='dialog' and .//h1[text()='Keyboard shortcuts and gestures']]`,
    )
    .first();
export const keyboardShortcutsList = (page: Page): Locator =>
  page.locator(
    `//span[contains(@class, 'KeyboardShortcutsModal__ShortcutKey')]/strong`,
  );
export const timesheetRows = (page: Page): Locator =>
  page.locator(`//table[contains(@class, 'weekly-time-entry-table')]/tbody/tr`);
export const loadingSpinner = (page: Page): Locator =>
  page.locator(`//div[contains(@class, 'Spinner')]`).first();
export const saveButton = (page: Page): Locator =>
  page.locator(`//span[text()='Save']`);

// Actions
export const navigate = async (page: Page) => {
  await gotoWithAuthSession(page, '/app/time?jobId=time', {
    waitUntil: 'load',
  });
  await waitForLoadingToDisappear(page);
  await handlePopupsInAnyOrder(page);
  await page.waitForTimeout(1000);
  await expect(page.getByLabel('Display by')).toBeVisible({ timeout: 60000 });
  await page.getByRole('button', { name: 'Add time' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('option', { name: 'Weekly time entry' }).click();
  await page.waitForTimeout(1000);
  await expect(teamMemberDropdown(page).first()).toBeVisible({
    timeout: 60000,
  });
  await handlePopupsInAnyOrder(page);
};

export const waitForLoadingToDisappear = async (page: Page) => {
  await loadingSpinner(page).waitFor({ state: 'hidden', timeout: 10000 });
};

export const clickCustomerDropdownOption = async (page: Page, n = 1) => {
  await page.locator(`(//ul/li/span)`).nth(n).click();
};

export const clickDropdownOption = async (page: Page, n = 1) => {
  await page.getByRole('option').nth(n).click();
  await page.waitForTimeout(2000);
};

export const selectTeamMemberByName = async (page: Page, name: string) => {
  await page.getByText(name, { exact: true }).first().click();
  await page.waitForTimeout(500);
};

export type SelectTeamMemberByMainLabelOptions = {
  /**
   * Match TeamMemberDropdownGraphQL **SubLabel** (type chip, e.g. "QBO user") instead of main display text.
   */
  matchSubLabel?: boolean;
  /**
   * When `matchSubLabel` is true and several rows share that type, pick the row whose full menu
   * text includes this substring (case-insensitive), e.g. part of the display name shown left of the chip.
   */
  matchMainLabelContains?: string;
  /**
   * `weeklyTimeEntry` (default): WTE header "Team Member" control.
   * `singleTimeEntryName`: STE **Name** field (same GraphQL quickfind menu). Does **not** clear the
   * Name filter input (clearing can collapse the menu on QBO); callers open → select → reopen → select.
   */
  context?: 'weeklyTimeEntry' | 'singleTimeEntryName';
};

const rowTextMatchesTeamTypeChip = (rowText: string, typeLabel: string) => {
  const norm = rowText.replace(/\s+/g, ' ').trim();
  if (/^\+?\s*add\s+new/i.test(norm)) return false;
  const escaped = escapeRegExp(typeLabel.trim()).replace(/\s+/g, '\\s*');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(norm);
};

/**
 * Team member / STE Name menus often render in a portal. Other `[role="listbox"]` nodes can
 * remain in the DOM (Display by, etc.); `.first()` is the wrong listbox on prod.
 */
const resolveOpenTeamMemberPickerListbox = async (
  page: Page,
): Promise<Locator> => {
  await page.waitForTimeout(300);
  const listboxes = page.locator('[role="listbox"]');
  const n = await listboxes.count();
  for (let i = n - 1; i >= 0; i--) {
    const lb = listboxes.nth(i);
    if (!(await lb.isVisible({ timeout: 800 }).catch(() => false))) continue;
    const addNew = lb.getByText('+ Add new', { exact: true });
    if ((await addNew.count()) > 0) {
      return lb;
    }
  }
  for (let i = n - 1; i >= 0; i--) {
    const lb = listboxes.nth(i);
    if (!(await lb.isVisible({ timeout: 800 }).catch(() => false))) continue;
    const t = ((await lb.innerText()) || '').replace(/\s+/g, ' ');
    if (/\bQBO\s*User\b|\bEmployee\b|\bVendor\b/i.test(t)) {
      return lb;
    }
  }
  for (let i = n - 1; i >= 0; i--) {
    const lb = listboxes.nth(i);
    if (await lb.isVisible().catch(() => false)) {
      return lb;
    }
  }
  return listboxes.last();
};

const teamPickerMenuRows = (listbox: Locator) =>
  listbox.locator('.quickfind-menu-item').or(listbox.getByRole('option'));

/** Word-boundary pattern for type chip text (e.g. `QBO User` / `QBO user`). */
const teamTypeTokenPattern = (typeLabel: string) => {
  const part = escapeRegExp(typeLabel.trim()).replace(/\s+/g, '\\s*');
  return new RegExp(`\\b${part}\\b`, 'i');
};

/**
 * QBO prod (and some shells) portals the typeahead: rows are often **not** under the
 * `[role="listbox"]` we resolve, or the surface is `role="menu"` / `ul` only. Prefer matching
 * **globally** on visible `.quickfind-menu-item` / `[role="option"]` after the menu opens.
 */
const clickVisiblePickerRowMatchingTeamType = async (
  page: Page,
  desiredTypeLabel: string,
  matchMainLabelContains?: string,
): Promise<boolean> => {
  const typeRe = teamTypeTokenPattern(desiredTypeLabel);
  const candidates = page
    .locator('.quickfind-menu-item, li[role="option"], [role="option"]')
    .filter({ hasText: typeRe });
  try {
    await expect
      .poll(
        async () => {
          const n = await candidates.count();
          for (let i = 0; i < n; i++) {
            if (
              await candidates
                .nth(i)
                .isVisible()
                .catch(() => false)
            ) {
              return true;
            }
          }
          return false;
        },
        { timeout: 20000 },
      )
      .toBeTruthy();
  } catch {
    return false;
  }
  const n = await candidates.count();
  for (let i = 0; i < n; i++) {
    const row = candidates.nth(i);
    if (!(await row.isVisible().catch(() => false))) continue;
    const rowText = ((await row.innerText()) || '').replace(/\s+/g, ' ');
    if (!rowTextMatchesTeamTypeChip(rowText, desiredTypeLabel)) continue;
    if (
      matchMainLabelContains &&
      !rowText.toLowerCase().includes(matchMainLabelContains.toLowerCase())
    ) {
      continue;
    }
    await row.click();
    await page.waitForTimeout(500);
    return true;
  }
  return false;
};

const teamMemberMainLabelPattern = (name: string) =>
  new RegExp(`\\b${escapeRegExp(name.trim()).replace(/\s+/g, '\\s+')}\\b`, 'i');

/** Pause after STE/WTE shell is visible so Team Member GraphQL list can load before opening the picker. */
export const TIME_ENTRY_FORM_SETTLE_MS = 5000;

const TEAM_MEMBER_DROPDOWN_VISIBLE_MS = 60_000;
const WTE_TEAM_MEMBER_REOPEN_RETRIES = 2;

const isWeeklyTimeEntryOpen = async (page: Page): Promise<boolean> =>
  (await teamMemberDropdown(page)
    .first()
    .isVisible({ timeout: 500 })
    .catch(() => false)) ||
  (await page
    .getByRole('heading', { name: /Weekly time\s*(sheet|entry)/i })
    .isVisible({ timeout: 500 })
    .catch(() => false));

/** Confirm leave/discard when closing WTE with unsaved changes. */
export const dismissWteCloseConfirmationIfVisible = async (
  page: Page,
): Promise<void> => {
  const leavePrompt = page.getByText(
    /Do you want to leave without saving|Your work will be lost if you leave|lose the data you entered/i,
  );
  if (await leavePrompt.isVisible({ timeout: 2500 }).catch(() => false)) {
    const yesInDialog = page
      .getByRole('dialog')
      .filter({ hasText: /leave|without saving|lose/i })
      .getByRole('button', { name: /^Yes$/i })
      .first();
    if (await yesInDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await yesInDialog.click();
    } else {
      await page.getByRole('button', { name: /^Yes$/i }).first().click();
    }
    await leavePrompt
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => undefined);
    console.log('✓ Confirmed leave WTE without saving');
    await page.waitForTimeout(300);
    return;
  }

  const confirmModal = page.getByTestId('time-tracking-confirmation-modal');
  if (await confirmModal.isVisible({ timeout: 1500 }).catch(() => false)) {
    const confirmBtn = confirmModal
      .getByRole('button', {
        name: /^(Yes|Leave|Discard|Continue|OK)$/i,
      })
      .first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await confirmModal
        .waitFor({ state: 'hidden', timeout: 10_000 })
        .catch(() => undefined);
      console.log('✓ Dismissed WTE close confirmation modal');
      await page.waitForTimeout(300);
    }
  }
};

/** Close WTE trowser/drawer when open so we can reopen from Time Entries. */
export const closeWeeklyTimeEntryIfOpen = async (page: Page): Promise<void> => {
  if (!(await isWeeklyTimeEntryOpen(page))) {
    return;
  }

  const trowserClose = page.locator(
    '[data-automation-id="weekly-time-trowser_close"]',
  );
  const headerClose = page.getByRole('button', { name: 'Close', exact: true });

  const clickClose = async (): Promise<void> => {
    if (await trowserClose.isVisible({ timeout: 1500 }).catch(() => false)) {
      await trowserClose.click({ force: true });
    } else if (
      await headerClose.isVisible({ timeout: 1500 }).catch(() => false)
    ) {
      await headerClose.click({ force: true });
    }
  };

  await clickClose();
  await dismissWteCloseConfirmationIfVisible(page);

  if (await isWeeklyTimeEntryOpen(page)) {
    await clickClose();
    await dismissWteCloseConfirmationIfVisible(page);
  }

  await page.waitForTimeout(1000);
};

/** Leave WTE and open it again from Add time → Weekly time entry / timesheet. */
export const reopenWeeklyTimeEntry = async (page: Page): Promise<void> => {
  await closeWeeklyTimeEntryIfOpen(page);

  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await clickAddTimeDropdown(page);

  const weeklyTimeEntry = page
    .locator(`//span[text()='Weekly time entry']`)
    .first();
  const weeklyTimesheet = page
    .locator(`//span[text()='Weekly timesheet']`)
    .first();
  if (await weeklyTimeEntry.isVisible().catch(() => false)) {
    await weeklyTimeEntry.click();
  } else {
    await weeklyTimesheet.click();
  }

  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await handlePopupsInAnyOrder(page);
};

/**
 * Wait for Team Member control (60s). If still missing, close/reopen WTE — up to 2 retries.
 */
export const waitForTeamMemberDropdownWithWteRetry = async (
  page: Page,
): Promise<void> => {
  const dropdown = teamMemberDropdown(page).first();

  for (let attempt = 0; attempt <= WTE_TEAM_MEMBER_REOPEN_RETRIES; attempt++) {
    await page.waitForTimeout(500);
    await closeTeamMemberTooltip(page);
    if (!(await dropdown.isVisible().catch(() => false))) {
      await handlePopupsInAnyOrder(page);
    }

    try {
      await dropdown.waitFor({
        state: 'visible',
        timeout: TEAM_MEMBER_DROPDOWN_VISIBLE_MS,
      });
      return;
    } catch {
      if (attempt >= WTE_TEAM_MEMBER_REOPEN_RETRIES) {
        throw new Error(
          `Team Member dropdown not visible after ${WTE_TEAM_MEMBER_REOPEN_RETRIES} WTE reopen attempt(s)`,
        );
      }
      console.log(
        `Team Member dropdown not visible after ${TEAM_MEMBER_DROPDOWN_VISIBLE_MS}ms — reopening WTE (retry ${
          attempt + 1
        }/${WTE_TEAM_MEMBER_REOPEN_RETRIES})`,
      );
      await reopenWeeklyTimeEntry(page);
    }
  }
};

/** Wait until the open team-member quickfind menu has at least one worker row (not only "+ Add new"). */
export const waitForTeamMemberPickerOptions = async (
  page: Page,
  options: { timeoutMs?: number } = {},
): Promise<void> => {
  const timeoutMs = options.timeoutMs ?? 20_000;
  const rows = page.locator(
    '.quickfind-menu-item, li[role="option"], [role="option"]',
  );
  await expect
    .poll(
      async () => {
        const n = await rows.count();
        for (let i = 0; i < n; i++) {
          const row = rows.nth(i);
          if (!(await row.isVisible().catch(() => false))) continue;
          const rowText = ((await row.innerText()) || '')
            .replace(/\s+/g, ' ')
            .trim();
          if (rowText && !/^\+?\s*add\s+new/i.test(rowText)) {
            return true;
          }
        }
        return (await page.getByRole('option').count()) > 0;
      },
      { timeout: timeoutMs },
    )
    .toBeTruthy();
};

export const waitForWeeklyTimeEntryFormSettled = async (
  page: Page,
): Promise<void> => {
  await waitForTeamMemberDropdownWithWteRetry(page);
  await page.waitForTimeout(TIME_ENTRY_FORM_SETTLE_MS);
};

const isTeamMemberPickerOpen = async (page: Page): Promise<boolean> =>
  page
    .getByText('+ Add new', { exact: true })
    .isVisible({ timeout: 800 })
    .catch(() => false);

/** WTE Team Member: chevron can miss under overlays; input fallback matches priority-case flow. */
const openWeeklyTimeEntryTeamMemberPicker = async (
  page: Page,
): Promise<void> => {
  if (await isTeamMemberPickerOpen(page)) {
    return;
  }
  const chevron = teamMemberDropdown(page).first();
  const fieldInput = teamMemberDropdownValue(page).first();
  await chevron.click({ force: true });
  await page.waitForTimeout(600);
  if ((await page.getByRole('option').count()) === 0) {
    await fieldInput.click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(600);
  }
  if (
    !(await isTeamMemberPickerOpen(page)) &&
    (await page.getByRole('option').count()) === 0
  ) {
    await chevron.click({ force: true });
    await page.waitForTimeout(600);
  }
};

const clickVisiblePickerRowMatchingMainLabel = async (
  page: Page,
  desired: string,
): Promise<boolean> => {
  const nameRe = teamMemberMainLabelPattern(desired);
  const rows = page.locator(
    '.quickfind-menu-item, li[role="option"], [role="option"]',
  );
  try {
    await expect
      .poll(
        async () => {
          const n = await rows.count();
          for (let i = 0; i < n; i++) {
            const row = rows.nth(i);
            if (!(await row.isVisible().catch(() => false))) continue;
            const rowText = ((await row.innerText()) || '')
              .replace(/\s+/g, ' ')
              .trim();
            if (/^\+?\s*add\s+new/i.test(rowText)) continue;
            if (nameRe.test(rowText)) return true;
          }
          return false;
        },
        { timeout: 20_000 },
      )
      .toBeTruthy();
  } catch {
    return false;
  }
  const n = await rows.count();
  for (let i = 0; i < n; i++) {
    const row = rows.nth(i);
    if (!(await row.isVisible().catch(() => false))) continue;
    const rowText = ((await row.innerText()) || '').replace(/\s+/g, ' ').trim();
    if (/^\+?\s*add\s+new/i.test(rowText)) continue;
    if (!nameRe.test(rowText)) continue;
    await row.click();
    await page.waitForTimeout(500);
    return true;
  }
  return false;
};

/** Inspector-verified path: `getByText('Barry Jones')` on the open team-member menu row. */
const clickTeamMemberByGetText = async (
  page: Page,
  desired: string,
): Promise<boolean> => {
  const tryClickInScope = async (scope: Locator): Promise<boolean> => {
    const label = scope.getByText(desired, { exact: true }).first();
    try {
      await expect(label).toBeVisible({ timeout: 20_000 });
    } catch {
      return false;
    }
    const row = label.locator(
      'xpath=ancestor::*[contains(@class,"quickfind-menu-item") or @role="option"][1]',
    );
    if ((await row.count()) > 0) {
      await row.first().click();
    } else {
      await label.click();
    }
    await page.waitForTimeout(500);
    return true;
  };

  const listbox = await resolveOpenTeamMemberPickerListbox(page);
  if (await tryClickInScope(listbox)) {
    return true;
  }

  const label = page.getByText(desired, { exact: true }).first();
  try {
    await expect(label).toBeVisible({ timeout: 20_000 });
  } catch {
    return false;
  }
  const row = label.locator(
    'xpath=ancestor::*[contains(@class,"quickfind-menu-item") or @role="option"][1]',
  );
  if ((await row.count()) > 0) {
    await row.first().click();
  } else {
    await label.click();
  }
  await page.waitForTimeout(500);
  return true;
};

const clickTeamMemberRowInOpenListbox = async (
  page: Page,
  desired: string,
): Promise<boolean> => {
  const nameRe = teamMemberMainLabelPattern(desired);
  const listbox = await resolveOpenTeamMemberPickerListbox(page);
  const menuRows = teamPickerMenuRows(listbox);
  const rowCount = await menuRows.count();
  for (let i = 0; i < rowCount; i++) {
    const row = menuRows.nth(i);
    if (!(await row.isVisible().catch(() => false))) continue;
    const rowText = ((await row.innerText()) || '').replace(/\s+/g, ' ').trim();
    if (/^\+?\s*add\s+new/i.test(rowText)) continue;
    if (!nameRe.test(rowText)) continue;
    await row.click();
    await page.waitForTimeout(500);
    return true;
  }
  const byMenuClass = listbox
    .locator('.quickfind-menu-item')
    .filter({ hasText: nameRe });
  if ((await byMenuClass.count()) > 0) {
    await byMenuClass.first().click();
    await page.waitForTimeout(500);
    return true;
  }
  const optionInList = listbox.getByRole('option').filter({ hasText: nameRe });
  if ((await optionInList.count()) > 0) {
    await optionInList.first().click();
    await page.waitForTimeout(500);
    return true;
  }
  return false;
};

const clickFirstVisiblePickerRowExcludingTeamType = async (
  page: Page,
  excludedTypeLabel: string,
): Promise<boolean> => {
  const items = page.locator(
    '.quickfind-menu-item, li[role="option"], [role="option"]',
  );
  try {
    await expect
      .poll(
        async () => {
          const n = await items.count();
          for (let i = 0; i < n; i++) {
            if (
              await items
                .nth(i)
                .isVisible()
                .catch(() => false)
            ) {
              return true;
            }
          }
          return false;
        },
        { timeout: 20000 },
      )
      .toBeTruthy();
  } catch {
    return false;
  }
  const n = await items.count();
  for (let i = 0; i < n; i++) {
    const row = items.nth(i);
    if (!(await row.isVisible().catch(() => false))) continue;
    const rowText = ((await row.innerText()) || '').replace(/\s+/g, ' ');
    if (/^\+?\s*add\s+new/i.test(rowText.trim())) continue;
    if (rowTextMatchesTeamTypeChip(rowText, excludedTypeLabel)) continue;
    await row.click();
    await page.waitForTimeout(600);
    return true;
  }
  return false;
};

/**
 * STE Name field (TeamMemberDropdownGraphQL): open picker and select the first row whose
 * type chip is not "QBO user". Call before choosing a QBO user row when the menu needs a
 * non-QBO selection first.
 */
export const selectFirstSteNameTeamMemberExcludingQboUserType = async (
  page: Page,
): Promise<void> => {
  await page
    .locator(
      `//span[contains(text(),'Name')]/ancestor::label/descendant::div[contains(@class, 'Dropdown')]`,
    )
    .first()
    .click({ timeout: 60000 });
  await page.waitForTimeout(5000);

  if (await clickFirstVisiblePickerRowExcludingTeamType(page, 'QBO user')) {
    return;
  }

  const listbox = await resolveOpenTeamMemberPickerListbox(page);
  const items = teamPickerMenuRows(listbox);
  const n = await items.count();
  for (let i = 0; i < n; i++) {
    const item = items.nth(i);
    const rowText = ((await item.innerText()) || '').replace(/\s+/g, ' ');
    if (rowTextMatchesTeamTypeChip(rowText, 'QBO user')) continue;
    await item.click();
    await page.waitForTimeout(600);
    return;
  }

  const options = listbox.getByRole('option');
  const optN = await options.count();
  for (let i = 0; i < optN; i++) {
    const opt = options.nth(i);
    const text = ((await opt.textContent()) || '').replace(/\s+/g, ' ');
    if (/qbo\s*user/i.test(text)) continue;
    await opt.click();
    await page.waitForTimeout(600);
    return;
  }
};

/**
 * Select a Team Member / Name quickfind row (TeamMemberDropdownGraphQL).
 * Default: WTE header + main label. Use `matchSubLabel` for STE when the row is identified by the
 * type subcopy (e.g. QBO user vs Employee); use `context: 'singleTimeEntryName'` for the STE Name field.
 * After opening the menu, waits **5s** so the GraphQL worker list can render before matching.
 */
export const selectTeamMemberByMainLabel = async (
  page: Page,
  label: string,
  options?: SelectTeamMemberByMainLabelOptions,
): Promise<void> => {
  const desired = label.trim();
  const context = options?.context ?? 'weeklyTimeEntry';
  const matchSubLabel = options?.matchSubLabel ?? false;
  const matchMainLabelContains = options?.matchMainLabelContains?.trim();

  if (context === 'weeklyTimeEntry') {
    await openWeeklyTimeEntryTeamMemberPicker(page);
  } else {
    await page
      .locator(
        `//span[contains(text(),'Name')]/ancestor::label/descendant::div[contains(@class, 'Dropdown')]`,
      )
      .first()
      .click({ timeout: 60000 });
  }
  await waitForTeamMemberPickerOptions(page);

  if (matchSubLabel) {
    if (
      await clickVisiblePickerRowMatchingTeamType(
        page,
        desired,
        matchMainLabelContains,
      )
    ) {
      return;
    }

    const typePattern = new RegExp(`^\\s*${escapeRegExp(desired)}\\s*$`, 'i');
    const listbox = await resolveOpenTeamMemberPickerListbox(page);
    const menuRows = teamPickerMenuRows(listbox);
    const rowCount = await menuRows.count();
    for (let i = 0; i < rowCount; i++) {
      const row = menuRows.nth(i);
      const rowText = ((await row.innerText()) || '').replace(/\s+/g, ' ');
      if (!rowTextMatchesTeamTypeChip(rowText, desired)) continue;
      if (
        matchMainLabelContains &&
        !rowText.toLowerCase().includes(matchMainLabelContains.toLowerCase())
      ) {
        continue;
      }
      await row.click();
      await page.waitForTimeout(500);
      return;
    }

    const subLabel = page
      .locator('span[class*="TeamMemberDropdownGraphQL__SubLabel"]')
      .filter({ hasText: typePattern })
      .first();
    if (await subLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subLabel.click();
      await page.waitForTimeout(500);
      return;
    }
    const byMenuClass = listbox
      .locator('.quickfind-menu-item')
      .filter({ hasText: new RegExp(escapeRegExp(desired), 'i') });
    if ((await byMenuClass.count()) > 0) {
      await byMenuClass.first().click();
      await page.waitForTimeout(500);
      return;
    }
    const optionInList = listbox.getByRole('option').filter({
      hasText: new RegExp(
        `\\b${escapeRegExp(desired).replace(/\s+/g, '\\s*')}\\b`,
        'i',
      ),
    });
    if ((await optionInList.count()) > 0) {
      await optionInList.first().click();
      await page.waitForTimeout(500);
      return;
    }
    const optionByRole = page.getByRole('option', {
      name: new RegExp(escapeRegExp(desired), 'i'),
    });
    if ((await optionByRole.count()) > 0) {
      await optionByRole.first().click();
      await page.waitForTimeout(500);
      return;
    }
    throw new Error(
      `Could not find Team Member / Name option (type subcopy) "${desired}"`,
    );
  }

  if (await clickTeamMemberByGetText(page, desired)) {
    return;
  }

  // Preferred: match the DOM structure shown in devtools (main label)
  const mainLabel = page
    .locator('span[class*="TeamMemberDropdownGraphQL__MainLabel"]')
    .filter({
      hasText: new RegExp(`^\\s*${escapeRegExp(desired)}\\s*$`, 'i'),
    })
    .first();

  if (await mainLabel.isVisible({ timeout: 10_000 }).catch(() => false)) {
    const menuRow = mainLabel.locator(
      'xpath=ancestor::*[contains(@class,"quickfind-menu-item") or @role="option"][1]',
    );
    if ((await menuRow.count()) > 0) {
      await menuRow.first().click();
    } else {
      await mainLabel.click();
    }
    await page.waitForTimeout(500);
    return;
  }

  if (await clickTeamMemberRowInOpenListbox(page, desired)) {
    return;
  }

  if (await clickVisiblePickerRowMatchingMainLabel(page, desired)) {
    return;
  }

  const listbox = await resolveOpenTeamMemberPickerListbox(page);
  const optionInList = listbox.getByRole('option').filter({
    hasText: teamMemberMainLabelPattern(desired),
  });
  if ((await optionInList.count()) > 0) {
    await optionInList.first().click();
    await page.waitForTimeout(500);
    return;
  }

  // Fallback: role option with accessible name (varies by experiment / layout)
  const optionByRole = page.getByRole('option', {
    name: teamMemberMainLabelPattern(desired),
  });
  if ((await optionByRole.count()) > 0) {
    await optionByRole.first().click();
    await page.waitForTimeout(500);
    return;
  }

  throw new Error(`Could not find Team Member option with label "${desired}"`);
};

export const openSettingsIcon = async (page: Page) => {
  await page.locator(`#weekly-time-entry-settings-gear`).click();
};

export const fieldSettingsPopup = (page: Page): Locator =>
  page.locator("//span[text()='Time entry settings']");

export const getFieldCheckboxes = async (page: Page) => {
  const rows = await page
    .locator("//div[contains(@class, 'WeeklyTimeEntryWeekdaySettings')]//label")
    .all();
  return Promise.all(
    rows.map(async (row) => {
      const checkbox = await row.locator('input[type="checkbox"]');
      const isRequired = await row
        .textContent()
        .then((text) => /required/i.test(text || ''));
      const hasHours = await row
        .textContent()
        .then((text) => /existing hours/i.test(text || ''));
      return { checkbox, isRequired, hasHours };
    }),
  );
};

export const navigateToSingleTimeEntry = async (page: Page) => {
  await gotoWithAuthSession(page, '/app/time?jobId=time', {
    waitUntil: 'load',
  });
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(5000);
  await page.locator(`//span[text()="Add time"]`).click();
  await page.waitForTimeout(1000);
  await page.locator(`//span[text()="Single time entry"]`).click();
  await page.waitForLoadState('load');
};

export const openSettingsIconSTE = async (page: Page) => {
  await page.getByRole('button', { name: /settings|gear/i }).click();
};

export const fieldSettingsPopupSTE = (page: Page): Locator =>
  page.locator(
    "//div[contains(@role, 'dialog') and .//h1[contains(text(), 'Show time entry fields')]]",
  );

export const getFieldCheckboxesSTE = async (page: Page) => {
  const rows = await page
    .locator("//div[contains(@role, 'dialog')]//label")
    .all();
  return Promise.all(
    rows.map(async (row) => {
      const checkbox = await row.locator('input[type="checkbox"]');
      const isRequired = await row
        .textContent()
        .then((text) => /required/i.test(text || ''));
      const hasHours = await row
        .textContent()
        .then((text) => /existing hours/i.test(text || ''));
      return { checkbox, isRequired, hasHours };
    }),
  );
};

export const openFirstCellSidePanel = async (page: Page) => {
  await page
    .locator("//td[contains(@class, 'WeeklyTimeEntryTablestyles__DataCell')]")
    .first()
    .click();
};

export const getRequiredCustomFieldsInSidePanel = async (page: Page) => {
  const fields = await page
    .locator("//div[contains(@class, 'side-panel')]//label")
    .all();
  return Promise.all(
    fields.map(async (field) => {
      const isMarkedRequired = await field
        .textContent()
        .then((text) => /\*/.test(text || ''));
      return { isMarkedRequired };
    }),
  );
};

export const trySaveSidePanel = async (page: Page) => {
  await page.getByRole('button', { name: /save/i }).click();
};

export const getSidePanelValidationError = (page: Page): Locator =>
  page.locator(
    "//div[contains(@class, 'side-panel')]//div[contains(@class, 'error')]",
  );

export const fillAllRequiredCustomFields = async (page: Page) => {
  const requiredFields = await page
    .locator("//div[contains(@class, 'side-panel')]//label")
    .all();
  for (const field of requiredFields) {
    if (await field.textContent().then((text) => /\*/.test(text || ''))) {
      const input = await field.locator('input, textarea');
      await input.fill('test');
    }
  }
};

export const openApprovedTimesheet = async (page: Page) => {
  // This would need to select an approved timesheet row, adjust selector as needed
  await page.locator("//tr[contains(@class, 'approved')]").first().click();
};

export const tryEditApprovedTimesheet = async (page: Page) => {
  // Try to edit a field in the approved timesheet
  await page.locator('//input').first().fill('1');
};

export const getEditBlockedMessage = (page: Page): Locator =>
  page.locator(
    "//*[contains(text(), 'This timesheet has been approved or exported.')]",
  );

export const isEditingDisabled = async (page: Page) => {
  // Check if all inputs are disabled
  const inputs = await page.locator('input').all();
  return (
    await Promise.all(inputs.map(async (i) => await i.isDisabled()))
  ).every(Boolean);
};

/** WTE grid context menu is `position: fixed` / high z-index; it blocks the next cell click until dismissed. */
export const dismissWeeklyTimeEntryContextMenuIfOpen = async (
  page: Page,
): Promise<void> => {
  const menuItem = page
    .locator("//span[contains(@class, 'WeeklyTimeEntryContextMenu__Label')]")
    .first();
  if (!(await menuItem.isVisible().catch(() => false))) {
    return;
  }
  // WeeklyTimeEntryContextMenu closes on document mousedown outside the menu ref — not Escape
  // (Escape can dismiss the WTE / embedded shell in some setups).
  const grid = page.getByTestId('weekly-timesheet-grid');
  if (await grid.isVisible().catch(() => false)) {
    const box = await grid.boundingBox();
    if (box) {
      await page.mouse.click(
        box.x + Math.min(Math.max(box.width * 0.35, 80), box.width - 8),
        box.y + 12,
      );
    }
  }
  if (await menuItem.isVisible().catch(() => false)) {
    await page.mouse.click(32, 140);
  }
  await menuItem
    .waitFor({ state: 'hidden', timeout: 8000 })
    .catch(() => undefined);
};

export const selectCell = async (page: Page, index: number) => {
  await dismissWeeklyTimeEntryContextMenuIfOpen(page);
  await page
    .locator(
      `(//td[contains(@class, 'WeeklyTimeEntryTablestyles__DataCell')])[${index}]`,
    )
    .first()
    .click();
};

export const selectSecondCell = async (page: Page) => {
  await dismissWeeklyTimeEntryContextMenuIfOpen(page);
  await page
    .locator(
      "(//td[contains(@class, 'WeeklyTimeEntryTablestyles__DataCell')])[4]",
    )
    .first()
    .click();
};

export const rightClickSelectedCell = async (page: Page, index: number) => {
  await dismissWeeklyTimeEntryContextMenuIfOpen(page);
  await page
    .locator(
      `(//td[contains(@class, 'WeeklyTimeEntryTablestyles__DataCell')])[${index}]`,
    )
    .first()
    .click({ button: 'right' });
};

export const getContextMenuOptions = async (page: Page) => {
  const options = await page
    .locator("//span[contains(@class, 'WeeklyTimeEntryContextMenu__Label')]")
    .allTextContents();
  return options;
};

export const clickContextMenuOption = async (page: Page, option: string) => {
  await page.locator(`//span[normalize-space(text())='${option}']`).click();
};

/** 1-based index within the weekly timesheet tbody (not global `//tr[n]`). */
export const clickOnDeleteRow = async (page: Page, row: number) => {
  await timesheetRows(page)
    .nth(row - 1)
    .locator('button[aria-label="weekly.deleterow"]')
    .click({ force: true });
};

export const getTeamMemberOptions = async (page: Page) => {
  const teamMemberElement = page.locator(
    `//span[text()='Team Member']/..//div[contains(@class, 'DropdownTypeahead-iconBox')]`,
  );
  await page.waitForTimeout(5000);
  await teamMemberElement.click({ force: true });
  await page.waitForTimeout(5000);
  const options = await page
    .locator(`//ul[@role='option']//span[@class='rowTextLabel']`)
    .allTextContents();
  await teamMemberElement.click();
  return options;
};

// Handle overlapping modals using Promise.race to check both simultaneously
export const handleKnownModals = async (page: Page): Promise<void> => {
  try {
    // Function to handle glow-up modal
    const handleGlowUpModal = async (): Promise<boolean> => {
      try {
        if (await page.getByText('QuickBooks Time got a glow-up').isVisible()) {
          console.log(
            'Found "QuickBooks Time got a glow-up" modal - closing with Close button',
          );
          await page.getByRole('button', { name: 'Close' }).click();
          await page.waitForTimeout(500);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    // Function to handle corner modal
    const handleCornerModal = async (): Promise<boolean> => {
      try {
        if (await page.getByText('Just around the corner').isVisible()) {
          console.log(
            'Found "Just around the corner" modal - closing with Ok button',
          );
          await page
            .getByTestId('ModalDialog')
            .getByRole('button', { name: 'Ok' })
            .click();
          await page.waitForTimeout(500);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    // Handle both modals simultaneously using Promise.allSettled
    const results = await Promise.allSettled([
      handleGlowUpModal(),
      handleCornerModal(),
    ]);

    // Check which modals were handled
    const handledModals = results
      .map((result, index) => ({
        result,
        type: index === 0 ? 'glow-up' : 'corner',
      }))
      .filter(
        ({ result }) => result.status === 'fulfilled' && result.value === true,
      );

    if (handledModals.length > 0) {
      console.log(
        `Handled ${handledModals.length} modal(s): ${handledModals
          .map((m) => m.type)
          .join(', ')}`,
      );

      // Check if any modals are still visible after handling
      await page.waitForTimeout(500);
      const modalDialogs = page.getByTestId('ModalDialog');
      const stillVisible = await modalDialogs.count();
      if (stillVisible > 0) {
        console.log(
          `Still found ${stillVisible} modal(s), handling remaining ones...`,
        );
        await handleKnownModals(page); // Recursive call for remaining modals
      } else {
        console.log('All modals handled successfully');
      }
    }
  } catch (error) {
    console.log('Error in handleKnownModals:', error);
  }
};

/**
 * Weekly service change can trigger a confirmation:
 * "Do you want to replace your description with the default description for this Service?"
 * This blocks Save until dismissed. We choose **No** to keep custom notes/description.
 */
export async function dismissServiceDefaultDescriptionConfirmIfVisible(
  page: Page,
): Promise<void> {
  const body =
    /replace your description with the default description for this Service/i;

  const dialog = page.getByRole('dialog').filter({ hasText: body });
  const modalFiltered = page
    .getByTestId('time-tracking-confirmation-modal')
    .filter({ hasText: body });
  const modalAny = page.getByTestId('time-tracking-confirmation-modal');

  let container: Locator | null = null;
  if (await dialog.isVisible({ timeout: 1500 }).catch(() => false)) {
    container = dialog;
  } else if (
    await modalFiltered.isVisible({ timeout: 800 }).catch(() => false)
  ) {
    container = modalFiltered;
  } else if (await modalAny.isVisible({ timeout: 800 }).catch(() => false)) {
    container = modalAny;
  }

  if (!container) return;

  const noBtn = container.getByRole('button', { name: /^no$/i }).first();
  await noBtn.click({ timeout: 10_000 });
  await container.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(150);
  console.log(
    '✓ Dismissed service default description confirmation (kept custom notes)',
  );
}

/**
 * Quickly dismiss the "Got it" popup if visible
 * This popup can appear at any time and block interactions
 */
export async function dismissGotItPopupIfVisible(page: Page): Promise<void> {
  try {
    const gotItBtn = page.getByRole('button', { name: /^Got it$/i });
    if (await gotItBtn.isVisible({ timeout: 500 })) {
      await gotItBtn.click({ timeout: 1000 });
      await page.waitForTimeout(300);
      console.log('Dismissed "Got it" popup');
    }
  } catch {
    // Popup not visible, continue
  }
}

/**
 * Handler for approval popups that appear late (5-10 seconds after page load)
 * Uses waitFor to actively watch for the button to appear
 */
export async function handleLateAppearingApprovalPopups(
  page: Page,
): Promise<void> {
  const gotItButton = page.getByRole('button', { name: /^Got it$/i });

  try {
    // Actively wait up to 10 seconds for the "Got it" button to appear
    await gotItButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Found approval popup "Got it" button');
    await gotItButton.click({ timeout: 2000 });
    await page.waitForTimeout(500);
    console.log('Dismissed approval popup');
  } catch {
    // Button didn't appear within timeout - that's OK, popup may not show
    console.log('No approval popup appeared within timeout');
  }
}

// Utility function to handle popups that may appear in any order
export async function handlePopupsInAnyOrder(page: Page): Promise<void> {
  await page.waitForTimeout(3000); // Increased initial wait for late-appearing popups
  let popupsHandled = 0;
  const maxAttempts = 10; // Prevent infinite loops
  // First do a quick check to see if any popups are immediately visible
  const hasImmediatePopups = await checkForImmediatePopups(page);
  if (!hasImmediatePopups) {
    // If no immediate popups, wait a bit longer for delayed popups to appear
    await page.waitForTimeout(3000); // Increased wait for delayed popups
  }
  for (let attempt = 0; attempt < maxAttempts && popupsHandled < 6; attempt++) {
    let handledThisRound = false;
    // Check for "A faster way to enter time" tour modal
    try {
      if (
        await page
          .getByRole('heading', {
            name: 'A faster way to enter time',
          })
          .isVisible({ timeout: 2000 })
      ) {
        await page
          .getByTestId('ModalDialog')
          .getByRole('button', { name: 'Close' })
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "Just around the corner" popup
    try {
      if (
        await page
          .getByText('Just around the corner')
          .isVisible({ timeout: 2000 })
      ) {
        await page
          .getByTestId('ModalDialog')
          .getByRole('button', { name: 'Ok' })
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "QuickBooks Time got a glow-up" popup
    try {
      if (
        await page
          .getByText('QuickBooks Time got a glow-up')
          .isVisible({ timeout: 5000 })
      ) {
        await page
          .locator(
            `//div[@data-automation-id="ModalDialog"] / descendant::button[@aria-label="Close"]`,
          )
          .or(page.getByRole('button', { name: 'Close', exact: true }))
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "Streamlined time settings" popup
    try {
      if (
        await page
          .getByText('Streamlined time settings')
          .or(page.getByRole('heading', { name: 'Streamlined time settings' }))
          .isVisible({ timeout: 3000 })
      ) {
        // Try to click "Got it" first, then fall back to "Close"
        try {
          await page
            .getByRole('button', { name: 'Got it' })
            .click({ timeout: 2000 });
        } catch {
          await page
            .getByTestId('ModalDialog')
            .getByRole('button', { name: 'Close' })
            .click({ timeout: 2000 });
        }
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "Single time entry" popup
    try {
      if (
        await page
          .getByTestId('ModalDialog')
          .getByRole('heading', { name: 'Single time entry' })
          .isVisible({ timeout: 2000 })
      ) {
        await page
          .getByRole('button', { name: 'Got it' })
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for approval popups ("Where's the Time Summary" modal)
    // Note: The text appears twice (banner + modal), so we look for the "Got it" button instead
    try {
      const gotItBtn = page.getByRole('button', { name: /^Got it$/i });
      if (await gotItBtn.isVisible({ timeout: 2000 })) {
        await gotItBtn.click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Weekly timesheet makeover tour (GeneralPopoverTour on WTE)
    try {
      const wteMakeoverTour = page.locator('[data-tour-popover="true"]');
      if (
        await wteMakeoverTour
          .getByText('Weekly timesheet got a makeover')
          .isVisible({ timeout: 2000 })
      ) {
        const closeBtn = wteMakeoverTour
          .locator('button[aria-label="Close"]')
          .or(
            wteMakeoverTour.getByRole('button', { name: 'Close', exact: true }),
          );
        if (await closeBtn.isVisible({ timeout: 2000 })) {
          await closeBtn.click({ timeout: 2000 });
          await page.waitForTimeout(500);
          popupsHandled++;
          handledThisRound = true;
        }
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "Go to QuickBooks Time to enter a timesheet" popup
    try {
      if (
        await page
          .getByRole('heading', {
            name: 'Go to QuickBooks Time to enter a timesheet',
          })
          .or(page.getByRole('heading', { name: 'Go to QuickBooks Time to' }))
          .isVisible({ timeout: 2000 })
      ) {
        await page
          .getByLabel('Please do not show again')
          .or(page.getByText('Please do not show again'))
          .click({ timeout: 2000 });
        await page
          .getByTestId('ModalDialog')
          .getByLabel('Close')
          .or(
            page
              .getByTestId('ModalDialog')
              .locator('button')
              .filter({ hasText: 'Close' }),
          )
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // If no popups were handled this round, break the loop
    if (!handledThisRound) {
      break;
    }
  }
}
// Helper method to quickly check if any popups are immediately visible
export async function checkForImmediatePopups(page: Page): Promise<boolean> {
  try {
    // Use Promise.race to check all popup types with very short timeout
    await Promise.race([
      page
        .getByRole('heading', {
          name: 'A faster way to enter time',
        })
        .waitFor({ state: 'visible', timeout: 100 }),
      page
        .getByText('Just around the corner')
        .waitFor({ state: 'visible', timeout: 100 }),
      page
        .getByText('QuickBooks Time got a glow-up')
        .waitFor({ state: 'visible', timeout: 100 }),
      page
        .locator('text="Streamlined time settings"')
        .or(page.getByRole('heading', { name: 'Streamlined time settings' }))
        .waitFor({ state: 'visible', timeout: 100 }),
      page
        .getByTestId('ModalDialog')
        .getByRole('heading', { name: 'Single time entry' })
        .waitFor({ state: 'visible', timeout: 100 }),
      page
        .locator('[data-tour-popover="true"]')
        .getByText('Weekly timesheet got a makeover')
        .waitFor({ state: 'visible', timeout: 100 }),
      page
        .getByRole('heading', {
          name: 'Go to QuickBooks Time to enter a timesheet',
        })
        .waitFor({ state: 'visible', timeout: 100 }),
      // Approval popup - look for "Got it" button (text appears twice on page)
      page
        .getByRole('button', { name: /^Got it$/i })
        .waitFor({ state: 'visible', timeout: 100 }),
    ]);
    return true; // At least one popup is immediately visible
  } catch (error) {
    return false; // No popups are immediately visible
  }
}

// Wait for page to be fully loaded and ready
export async function waitForPageReady(page: Page): Promise<void> {
  try {
    // Wait for either the loading spinner to appear and disappear, or key page elements to be visible
    await Promise.race([
      // Option 1: Wait for loading spinner to finish
      loadingSpinner(page)
        .waitFor({ state: 'visible', timeout: 2000 })
        .then(() =>
          loadingSpinner(page).waitFor({
            state: 'hidden',
            timeout: 10000,
          }),
        ),
      // Option 2: Wait for key page elements that indicate the page is ready
      Promise.all([
        page
          .locator('[data-testid="DateRangeSelect"], .DateRangeSelect')
          .waitFor({ state: 'visible', timeout: 10000 }),
        page
          .locator(
            '[aria-label="Display by"], [data-testid="DisplayByDropdown"]',
          )
          .waitFor({ state: 'visible', timeout: 10000 }),
      ]),
    ]);
    // Small buffer to ensure any immediate popups have time to appear
    await page.waitForTimeout(500);
  } catch (error) {
    // If specific elements aren't found, fall back to a shorter wait
    await page.waitForTimeout(2000);
  }
}

export const closeTeamMemberTooltip = async (page: Page) => {
  if (await page.getByRole('button', { name: 'Close Tooltip' }).isVisible()) {
    await page.getByRole('button', { name: 'Close Tooltip' }).click();
  }
};

export const clickTimeCategoryDownArrow = async (page: Page, index: number) => {
  await page
    .locator(
      `//tr[${index}]/td[contains(@class, 'WeeklySuperSerachstyles__SuperSearchCell')]//div/button`,
    )
    .click({ timeout: 2000 });
};

export const selectTimeCategory = async (page: Page, timeCategory: string) => {
  await page
    .locator(
      `//div[contains(@class,'WeeklySuperSerachstyles__TabsColumn')]/span[contains(text(),'${timeCategory}')]`,
    )
    .click({ timeout: 2000 });
};

export const selectTimeCategoryOption = async (page: Page, index: number) => {
  await page
    .locator(
      `(//div[contains(@class,'WeeklySuperSerachstyles__ContentColumn')]//ul/li/span)[${index}]`,
    )
    .click({ timeout: 2000 });
};

export const selectRowCell = async (
  page: Page,
  rowNumber: number,
  columnNumber: number,
) => {
  await page
    .locator(
      `(//tr[${rowNumber}]/td[contains(@class, 'WeeklyTimeEntryTablestyles__BaseCell')])[${columnNumber}]`,
    )
    .click({ timeout: 2000 });
};

export async function validateBackgroundColor(
  page: Page,
  rowNumber: number,
  columnNumber: number,
  expectedColor: string,
) {
  const myButton = page.locator(
    `(//tr[${rowNumber}]/td[contains(@class, 'WeeklyTimeEntryTablestyles__BaseCell')])[${columnNumber}]`,
  );
  const expectedBackgroundColor = expectedColor; // Example: Red
  await expect(myButton).toHaveCSS(
    'background-color',
    expectedBackgroundColor,
    { timeout: 2000 },
  );
}

export const columnHeader = (page: Page, index: number = 1): Locator =>
  page.locator(`//th[@role="columnheader"][${index}]/div/span[1]`);

export const allColumnHeaders = (page: Page): Locator =>
  page.locator(`//th[@role="columnheader"]`);

export const getCellBackgroundColor = async (
  page: Page,
  rowNumber: number,
  columnNumber: number,
) => {
  const backgroundColor = await page
    .locator(
      `(//tr[${rowNumber}]/td[contains(@class, 'WeeklyTimeEntryTablestyles__BaseCell')])[${columnNumber}]`,
    )
    .evaluate((element: HTMLElement) => {
      return window.getComputedStyle(element).backgroundColor;
    });
  return backgroundColor;
};

export const getNoOfTableRows = async (page: Page) => {
  const tableRows = await page.locator(`//tbody/tr[@role='row']`);
  return tableRows;
};

export const getNoOfDeleteIcon = async (page: Page) => {
  const noOfDeleteIcons = await page.locator(
    `//tbody/tr/td[contains(@class,'DeleteCell')]`,
  );
  return noOfDeleteIcons;
};

export const deleteEachRowOfTable = async (page: Page) => {
  const noOfDeleteIcons = await getNoOfDeleteIcon(page);
  const noOfDeleteIconsCount = await noOfDeleteIcons.count();
  for (let i = 0; i < noOfDeleteIconsCount; i++) {
    await page
      .locator(`//tbody/tr/td[contains(@class,'DeleteCell')]`)
      .click({ timeout: 2000 });
    await page.waitForTimeout(500);
  }
};

export const addNoOfRows = async (page: Page, numberOfRows: number) => {
  for (let i = 0; i < numberOfRows; i++) {
    await page
      .getByRole('button', { name: 'Add time' })
      .click({ timeout: 2000 });
    await page.waitForTimeout(500);
  }
};

export const clickSaveAndClose = async (page: Page) => {
  await page
    .getByRole('button', { name: 'Save and close', exact: true })
    .click({ timeout: 2000 });
};

export const modalHeaderJustAroundCorner = (page: Page): Locator =>
  page.locator(
    "//div[contains(@class,'Modal-headerWrapper')]//span[contains(text(),'Just around the corner')]",
  );

export const okButton = (page: Page): Locator =>
  page.locator("//button/span[contains(text(),'Ok')]");

export async function handleJustAroundTheCornerModal(page: Page) {
  try {
    // Check if the modal with "Just around the corner" text is visible
    const modalHeader = page.locator(
      "//div[contains(@class,'Modal-headerWrapper')]//span[contains(text(),'Just around the corner')]",
    );

    let isModalVisible = false;

    try {
      isModalVisible = await modalHeader.isVisible({ timeout: 1000 });
    } catch (error) {
      console.log('Modal element not found - skipping');
      return;
    }

    // If not visible initially, wait and check again
    if (!isModalVisible) {
      console.log(
        'Modal not visible initially, waiting 2 seconds and checking again...',
      );
      await page.waitForTimeout(2000);
      try {
        isModalVisible = await modalHeader.isVisible({ timeout: 1000 });
      } catch (error) {
        console.log('Modal element not found on retry - skipping');
        return;
      }
    }

    if (isModalVisible) {
      console.log(
        'Modal "Just around the corner" is visible - clicking OK button',
      );

      try {
        // Click the OK button with force to bypass interception
        const okButton = page.locator(
          "//button[.//span[contains(text(),'Ok')]]",
        );
        await okButton.click({ force: true, timeout: 3000 });

        console.log('Successfully clicked OK button on modal');

        // Wait for modal to disappear with longer timeout
        try {
          await modalHeader.waitFor({ state: 'hidden', timeout: 3000 });
          console.log('Modal successfully disappeared');
        } catch (error) {
          console.log(
            'Modal did not disappear within timeout - continuing anyway',
          );
        }
      } catch (error) {
        console.log('Failed to click OK button - continuing anyway');
      }
    } else {
      console.log(
        'Modal "Just around the corner" is not visible after retry - skipping',
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('Error handling modal - continuing anyway:', errorMessage);
  }
}

export async function handleTimesheetTooltip(page: Page) {
  try {
    // Check if the tooltip with "Ready to add a timesheet?" text is visible
    const tooltipText = page.locator(
      '//div[contains(@class,"qbdsGuidanceTooltip")]//span[contains(text(),\'Ready to add a timesheet?\')]',
    );

    let isTooltipVisible = false;

    try {
      isTooltipVisible = await tooltipText.isVisible({ timeout: 1000 });
    } catch (error) {
      console.log('Tooltip element not found - skipping');
      return;
    }

    // If not visible initially, wait and check again
    if (!isTooltipVisible) {
      console.log(
        'Tooltip not visible initially, waiting 2 seconds and checking again...',
      );
      await page.waitForTimeout(2000);
      try {
        isTooltipVisible = await tooltipText.isVisible({ timeout: 1000 });
      } catch (error) {
        console.log('Tooltip element not found on retry - skipping');
        return;
      }
    }

    if (isTooltipVisible) {
      console.log(
        'Timesheet tooltip "Ready to add a timesheet?" is visible - clicking Close Tooltip button',
      );

      try {
        // Click the Close Tooltip button
        const closeTooltipButton = page.locator(
          '//button[@aria-label="Close Tooltip"]',
        );
        await closeTooltipButton.click({ force: true, timeout: 2000 });

        console.log('Successfully clicked Close Tooltip button');

        // Wait for tooltip to disappear with error handling
        try {
          await tooltipText.waitFor({ state: 'hidden', timeout: 3000 });
          console.log('Tooltip successfully disappeared');
        } catch (error) {
          console.log(
            'Tooltip did not disappear within timeout - continuing anyway',
          );
        }
      } catch (error) {
        console.log('Failed to click Close Tooltip button - continuing anyway');
      }
    } else {
      console.log(
        'Timesheet tooltip "Ready to add a timesheet?" is not visible - skipping',
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('Error handling tooltip - continuing anyway:', errorMessage);
  }
}

export async function handleQuickBooksGlowUpModal(page: Page) {
  try {
    // Check if the modal with "QuickBooks Time got a glow-up" text is visible
    const modalText = page.locator(
      "//div[contains(@class,'ComponentsTourModal')]//span[contains(text(),'QuickBooks Time got a glow-up')]",
    );

    let isModalVisible = false;

    try {
      isModalVisible = await modalText.isVisible({ timeout: 1000 });
    } catch (error) {
      console.log('QuickBooks glow-up modal element not found - skipping');
      return;
    }

    // If not visible initially, wait and check again
    if (!isModalVisible) {
      console.log(
        'QuickBooks glow-up modal not visible initially, waiting 2 seconds and checking again...',
      );
      await page.waitForTimeout(2000);
      try {
        isModalVisible = await modalText.isVisible({ timeout: 1000 });
      } catch (error) {
        console.log(
          'QuickBooks glow-up modal element not found on retry - skipping',
        );
        return;
      }
    }

    if (isModalVisible) {
      console.log(
        'QuickBooks Time glow-up modal is visible - clicking Close button',
      );

      try {
        // Click the Close button
        const closeButton = page.locator('//button[@aria-label="Close"]');
        await closeButton.click({ force: true, timeout: 2000 });

        console.log(
          'Successfully clicked Close button on QuickBooks glow-up modal',
        );

        // Wait for modal to disappear with error handling
        try {
          await modalText.waitFor({ state: 'hidden', timeout: 3000 });
          console.log('QuickBooks glow-up modal successfully disappeared');
        } catch (error) {
          console.log(
            'QuickBooks glow-up modal did not disappear within timeout - continuing anyway',
          );
        }
      } catch (error) {
        console.log(
          'Failed to click Close button on QuickBooks glow-up modal - continuing anyway',
        );
      }
    } else {
      console.log(
        'QuickBooks Time glow-up modal is not visible after retry - skipping',
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(
      'Error handling QuickBooks glow-up modal - continuing anyway:',
      errorMessage,
    );
  }
}

export const saveAndClose = async (page: Page) => {
  // await page.locator(`//button[contains(@aria-label,"Save and")]`).click();
  await page.locator(`//span[text()="Save and close"]`).click();
};

export const editTimeEntryFromEmployeeDropdown = async (
  page: Page,
  newDuration: string,
  newNotes: string,
) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.clickEditForEmployee('Emp1, Test');

  // Edit the entry
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  await singleTimeEntryPage.waitForPageReady();

  // Update duration
  await singleTimeEntryPage.enterFieldValue('Duration', newDuration);

  // Update notes
  await singleTimeEntryPage.enterNotes(newNotes);

  // Save changes
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await singleTimeEntryPage.validateSuccessToast();
};

// export function saveButton(page: Page) {
//   throw new Error('Function not implemented.');
// }
// export function saveButton(page: Page) {
//   throw new Error('Function not implemented.');
// }

export class WeeklyTimeEntryPage {
  constructor(private readonly _page: Page) {}

  async clickOnDeleteRow(page: Page, rowIndex: number): Promise<void> {
    const row = timesheetRows(page).nth(rowIndex);
    await row.locator('button[aria-label*="Delete" i]').first().click();
  }

  wtesaveButton(page: Page): Locator {
    return page.getByRole('button', { name: 'weekly-save-button' });
  }

  customerProjectDropdown(page: Page): Locator {
    return page.locator(
      `//td[contains(@class, 'WeeklySuperSerachstyles__SuperSearchCell')]//div/button`,
    );
  }

  async clickCustomerDropdownOption(page: Page, n = 1): Promise<void> {
    await page.locator(`(//ul/li/span)`).nth(n).click();
  }

  hours(page: Page, colIndex: number): Locator {
    return page.locator('tbody tr').first().locator('td').nth(colIndex);
  }

  panelServiceDropdown(page: Page): Locator {
    return page.getByLabel('Service').first();
  }

  async clickDropdownOption(page: Page, optionIndex: number): Promise<void> {
    await clickDropdownOption(page, optionIndex);
  }

  panelNotes(page: Page): Locator {
    return page.locator(`//textarea`).first();
  }
}

/** Visible customer label in the weekly grid after a row’s customer/project is selected (`n` = row index). */
export const getCustomerName = async (page: Page, n = 0): Promise<string> => {
  const span = page
    .locator(
      `//span[contains(@class, 'WeeklySuperSerachstyles__CustomerNameColumn')]`,
    )
    .nth(n);
  await span.waitFor({ state: 'visible', timeout: 15000 });
  const raw = (await span.textContent())?.trim() ?? '';
  return raw.replace(/\s+/g, ' ').trim();
};
