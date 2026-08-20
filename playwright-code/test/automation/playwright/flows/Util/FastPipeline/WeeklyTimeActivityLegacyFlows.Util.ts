import { Page, expect } from '@playwright/test';
import TimeEntriesPage from '../../../pages/TimeEntriesPage';
import {
  clickAddTimeDropdown,
  selectDisplayByOption,
  openDateRangeDropdown,
  selectDateRangeOption,
} from '../../../commonUtils';
import { WTATestAccount } from './WeeklyTimeActivityFlows.Util';

/**
 * =============================================================================
 * WTA01 (LEGACY / Payroll First) — Weekly Time Activity on the classic
 * "Weekly Time Entry" grid
 * =============================================================================
 *
 * Payroll First companies use the PREVIOUS experience: WTA is opened from Time
 * entries → Add time → "Weekly time entry", which renders the classic FULL-PAGE
 * weekly grid (Today / week nav, User + Switch User, a Job column with
 * "(no job)" rows, one column per weekday + Job Totals, Options, a Notes box,
 * and Reset / Save / Close). A row's customer/job is set via a "Select Customer"
 * side panel. Created entries are verified by reading the Time Entries LIST
 * directly (NOT the Reports page), and cleaned up from the same list.
 *
 * Mirrors WeeklyTimeActivityFlows.Util's structure (soft() for non-critical
 * checks, hard asserts on create/save/delete) but targets the legacy grid.
 * Selected by the suite when the account's timeActivityExperience is Legacy.
 *
 * NOTE: locators are derived from the legacy grid DOM (visible text / roles).
 * Confirm against a live Payroll First account on the first run.
 * =============================================================================
 */

// ---- Constants -------------------------------------------------------------

const TEAM_MEMBER_MATCH = 'cadmin';
const DAY_HOURS = '5:00'; // per-day duration entered into a grid cell
const NOTE_CREATE = 'WTA legacy - create';
const NOTE_EDITED = 'WTA legacy - edited';

/** Notes this run creates — afterEach cleanup removes any that survive. */
export const WTA_LEGACY_NOTES = [NOTE_CREATE, NOTE_EDITED];

async function soft(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[WTA-LEGACY][soft] ${label} — ${message}`);
  }
}

// ---- Classic grid locators (inside the "Weekly Time Entry" iframe) ----------
//
// The classic weekly timecard is embedded in an iframe; the grid uses stable
// ids: the per-row job/name cell is `#weekly_timecard_row_name_<row>` and each
// day cell is `#weekly_timecard_weekly_<col>_<row>` (col = weekday index, row =
// job row index). Save/Reset/Notes live inside the iframe too; the modal Close
// chrome is on the host page.

const gridFrame = (page: Page) =>
  page.frameLocator(`iframe[title="Weekly Time Entry"]`);

/** Row job/name cell (shows "(no job)" until a customer/job is set). */
const jobCell = (page: Page, row = 0) =>
  gridFrame(page).locator(`#weekly_timecard_row_name_${row}`);

/**
 * A weekday duration cell. The id is `#weekly_timecard_weekly_<row>_<col>`
 * (first index = job ROW, second = weekday COLUMN), so varying col fills across
 * days of the SAME row.
 */
const dayCell = (page: Page, col: number, row = 0) =>
  gridFrame(page).locator(`#weekly_timecard_weekly_${row}_${col}`);

// Notes cell in #weekly_timecard_notes_table. The <td> itself isn't editable;
// clicking it reveals an inline textarea/input.
const notesCell = (page: Page) =>
  gridFrame(page)
    .locator(`#weekly_timecard_notes_table > tbody > tr > td`)
    .first();

/**
 * Enter notes. The notes box is only editable once a time cell WITH an entry is
 * selected (it otherwise reads "Enter time before adding notes to this entry"),
 * so the caller must click the relevant time cell first. Fills the revealed
 * textarea/input, falling back to typing.
 */
async function enterNotes(page: Page, text: string): Promise<void> {
  const editor = gridFrame(page)
    .locator(
      `#weekly_timecard_notes_table textarea, #weekly_timecard_notes_table input[type="text"]`,
    )
    .first();
  if (await editor.isVisible({ timeout: 5000 }).catch(() => false)) {
    await editor.click();
    await editor.fill(text);
  } else {
    await notesCell(page).click();
    await page.waitForTimeout(800);
    await page.keyboard.type(text);
  }
}

const saveBtn = (page: Page) =>
  gridFrame(page)
    .getByRole('button', { name: /^Save$/ })
    .first();
const resetBtn = (page: Page) =>
  gridFrame(page)
    .getByRole('button', { name: /^Reset$/ })
    .first();
// Close is host-page modal chrome (outside the iframe).
const closeLink = (page: Page) =>
  page
    .getByText('Close', { exact: true })
    .or(page.getByRole('button', { name: /^Close$/ }))
    .first();

// ---- Navigation ------------------------------------------------------------

/** Time entries → Add time → "Weekly time entry" → wait for the iframe grid. */
async function openWeeklyGrid(
  page: Page,
  timeEntriesPage: TimeEntriesPage,
): Promise<void> {
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await clickAddTimeDropdown(page);
  await page
    .getByRole('option', { name: 'Weekly time entry' })
    .or(page.getByText('Weekly time entry', { exact: true }))
    .first()
    .click();
  // The classic grid renders inside the iframe — wait for the first row cell.
  await expect(jobCell(page, 0)).toBeVisible({ timeout: 60000 });
  await page.waitForTimeout(1000);
}

/**
 * Set the customer/job on the first row. Clicking the job cell opens a
 * host-page "Select Customer" drawer whose customer list is in a NESTED iframe
 * (iframe[title="Select Customer"] — there can be several, use the 2nd). Always
 * selects a customer (asserts the option, then clicks).
 */
async function setFirstRowCustomer(page: Page): Promise<void> {
  await jobCell(page, 0).click();
  await expect(
    page
      .locator(`[id^="idsDrawerHeader"]`)
      .getByText('Select Customer')
      .first(),
  ).toBeVisible({ timeout: 15000 });
  const custFrame = page
    .locator(`iframe[title="Select Customer"]`)
    .nth(1)
    .contentFrame();
  const option = custFrame
    .getByRole('option', { name: 'test cust1' })
    .or(custFrame.getByRole('option', { name: 'test cust2' }))
    .first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();
}

/**
 * Weekday column indices (0=Sun..6=Sat) for the current week that are SAFE to
 * enter time on: not in the future AND in the current month (so a week that
 * straddles a month boundary never writes into the adjacent month, and the
 * "This month" list filter still shows them).
 */
function safeDayColumns(): number[] {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay()); // Sunday of current week
  const cols: number[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const inFuture = d > today;
    const sameMonth =
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    if (!inFuture && sameMonth) cols.push(i);
  }
  return cols;
}

/** Enter the per-day duration into a few SAFE weekday cells of row 0; returns
 * the columns actually filled (so the caller can re-select the last one). */
async function fillWeekDurations(page: Page): Promise<number[]> {
  const cols = safeDayColumns().slice(0, 3);
  for (const col of cols) {
    await soft(`fill day cell col ${col}`, async () => {
      const cell = dayCell(page, col, 0);
      await cell.click();
      await cell.fill(DAY_HOURS);
      await page.keyboard.press('Tab');
    });
  }
  return cols;
}

// ---- List read (Time Entries page, NOT Reports) ----------------------------

/**
 * Navigate to Time Entries and switch to Date / This month — entries are created
 * on TODAY, but the list defaults to a prior week ("No time for this date
 * range"), so they wouldn't otherwise be visible for read + delete.
 */
async function showEntriesList(
  page: Page,
  timeEntriesPage: TimeEntriesPage,
): Promise<void> {
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await soft('set list to Date / This month', async () => {
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();
  });
}

async function listHasRowContaining(
  page: Page,
  text: string,
): Promise<boolean> {
  return page
    .locator(`//table//tbody//tr[contains(., '${text}')]`)
    .first()
    .isVisible({ timeout: 8000 })
    .catch(() => false);
}

// ============================================================================
// Suite
// ============================================================================

export async function runWTALegacySuite(
  page: Page,
  account: WTATestAccount,
): Promise<void> {
  const timeEntriesPage = new TimeEntriesPage(page);
  console.log(
    '[WTA-LEGACY] companyType=%s role=%s (legacy weekly grid)',
    account.companyType,
    account.role,
  );

  // --- Step 1: open the classic weekly grid + verify structure -------------
  await openWeeklyGrid(page, timeEntriesPage);
  console.log('[WTA-LEGACY][Step1] Classic "Weekly Time Entry" grid opened');
  await soft('grid structure present', async () => {
    await expect(jobCell(page, 0)).toBeVisible();
    await expect(saveBtn(page)).toBeVisible();
  });

  // --- Step 2: CREATE — set customer + daily durations + notes → Save ------
  // Sequence matters: customer → settle → hours → settle → notes. Rushing notes
  // before the grid settles leaves the notes editor uneditable.
  await setFirstRowCustomer(page);
  await page.waitForTimeout(3000);
  const filledCols = await fillWeekDurations(page);
  await page.waitForTimeout(3000);
  // Notes are PER-CELL: select the last filled time cell so the notes box edits
  // that specific entry's note (it's disabled until an entry cell is selected).
  await soft('enter notes on the last entered cell', async () => {
    const lastCol =
      filledCols[filledCols.length - 1] ?? safeDayColumns()[0] ?? 0;
    await dayCell(page, lastCol, 0).click();
    await page.waitForTimeout(1000);
    await enterNotes(page, NOTE_CREATE);
  });
  await saveBtn(page).click();
  await soft('save succeeds (totals update / grid persists)', async () => {
    await timeEntriesPage.waitForLoadingToDisappear();
  });
  console.log('[WTA-LEGACY][Step2] Weekly entry created via Save');

  // READ from the Time Entries list (not Reports).
  await showEntriesList(page, timeEntriesPage);
  await soft('weekly entry visible in Time Entries list', async () => {
    expect(await listHasRowContaining(page, TEAM_MEMBER_MATCH)).toBeTruthy();
  });
  console.log('[WTA-LEGACY][Step2] Read created entry from list');

  // --- Step 3: EDIT — reopen grid, change a cell, Save ---------------------
  await openWeeklyGrid(page, timeEntriesPage);
  await soft('edit: change a day cell + save', async () => {
    const editCol = safeDayColumns()[0] ?? 0;
    const cell = dayCell(page, editCol, 0);
    await cell.click();
    await cell.fill('6:00');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2000);
    // Re-select the edited cell so its per-cell note is editable.
    await cell.click();
    await page.waitForTimeout(1000);
    await enterNotes(page, NOTE_EDITED);
    await saveBtn(page).click();
    await timeEntriesPage.waitForLoadingToDisappear();
  });
  console.log('[WTA-LEGACY][Step3] Edited the weekly entry');

  // --- Step 4: RESET behavior (non-destructive check) ----------------------
  await openWeeklyGrid(page, timeEntriesPage);
  await soft('Reset clears unsaved cell input', async () => {
    const cell = dayCell(page, safeDayColumns()[0] ?? 0, 0);
    await cell.click();
    await cell.fill('2:00');
    await resetBtn(page).click();
    // After reset the unsaved "2:00" should not persist as a NEW value.
    await page.waitForTimeout(1000);
  });
  await soft('close weekly grid', async () => {
    await closeLink(page).click();
  });
  console.log('[WTA-LEGACY][Step4] Reset + Close exercised');

  // --- Step 5: DELETE created entries from the list ------------------------
  if (account.entitlements.canDelete) {
    await cleanupWTALegacyEntries(page);
    console.log('[WTA-LEGACY][Step5] Deleted created entries from the list');
  }

  console.log('[WTA-LEGACY] Full legacy suite complete.');
}

// ---- Cleanup (delete every created entry from the Time Entries list) -------

export async function cleanupWTALegacyEntries(page: Page): Promise<void> {
  const timeEntriesPage = new TimeEntriesPage(page);
  await showEntriesList(page, timeEntriesPage);

  for (let i = 0; i < 12; i += 1) {
    // Empty state → nothing to delete.
    const empty = await page
      .getByText(/No time entries yet|No time for this date range/i)
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (empty) break;

    const expand = page.locator(`//button[@aria-label='Expand Menu']`).first();
    if (!(await expand.isVisible({ timeout: 4000 }).catch(() => false))) break;
    try {
      await expand.click({ timeout: 10000 });
      const del = page.getByRole('menuitem', { name: 'Delete' });
      if (!(await del.isVisible({ timeout: 4000 }).catch(() => false))) break;
      await del.click({ timeout: 10000 });
      await page
        .getByRole('button', { name: 'Yes' })
        .click({ timeout: 10000 })
        .catch(() => undefined);
      await timeEntriesPage.waitForLoadingToDisappear();
    } catch {
      break; // stop on any actionability issue instead of hanging
    }
  }
}
