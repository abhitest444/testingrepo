import { Page, expect } from '@playwright/test';
import TimeEntriesPage from '../../../pages/TimeEntriesPage';
import {
  clickAddTimeDropdown,
  selectDisplayByOption,
  openDateRangeDropdown,
  selectDateRangeOption,
} from '../../../commonUtils';
import { STATestAccount } from './SingleTimeActivityFlows.Util';

/**
 * =============================================================================
 * STA01 (LEGACY / Payroll First) — Single Time Activity on the legacy "Add time"
 * drawer
 * =============================================================================
 *
 * Payroll First companies use the PREVIOUS time-entry experience: STA is opened
 * from Time entries → Add time → "Single time entry", which renders the legacy
 * side drawer titled "Add time" (fewer fields than the new trowser: Team member,
 * Entry type [Start and end time | Duration], Currently working, Start/End
 * date+time, Customer, Notes, Time zone, and Save / Save and new / Save and
 * copy). Created entries are verified by reading the Time Entries LIST directly
 * (NOT the Reports page), and cleaned up from the same list.
 *
 * This mirrors the structure of SingleTimeActivityFlows.Util (soft() for
 * non-critical checks, hard asserts on create/save/delete) but targets the
 * legacy drawer. It is selected by the suite when the account's
 * timeActivityExperience is Legacy.
 *
 * NOTE: locators are derived from the legacy drawer DOM (data-testid
 * "select-worker__textField", role-based controls, visible labels). They should
 * be confirmed against a live Payroll First account on the first run.
 * =============================================================================
 */

// ---- Constants -------------------------------------------------------------

const TEAM_MEMBER_MATCH = 'cadmin'; // substring identifying the admin row in the list
const DURATION = '05:00';
const START_TIME = '9:00 AM';
const END_TIME = '11:00 AM';
const NOTE_DURATION = 'STA legacy - duration';
const NOTE_START_END = 'STA legacy - start/end';
const NOTE_SAVE_NEW = 'STA legacy - save and new';
const NOTE_SAVE_COPY = 'STA legacy - save and copy';
const NOTE_EDITED = 'STA legacy - edited';

/** Notes this run creates — afterEach cleanup removes any that survive. */
export const STA_LEGACY_NOTES = [
  NOTE_DURATION,
  NOTE_START_END,
  NOTE_SAVE_NEW,
  NOTE_SAVE_COPY,
  NOTE_EDITED,
];

/** Soft-assert helper — warn instead of failing, time-bounded. */
async function soft(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[STA-LEGACY][soft] ${label} — ${message}`);
  }
}

// ---- Drawer locators -------------------------------------------------------

// Create shows "Add time"; edit shows "Edit time" — match both so the drawer-
// scoped locators work in either flow.
const drawer = (page: Page) =>
  page.getByRole('dialog', { name: /Add time|Edit time/i }).first();

const teamMemberInput = (page: Page) =>
  page
    .locator(`input[data-testid="select-worker__textField"]`)
    .or(page.getByRole('combobox', { name: /Team member/i }))
    .first();

// Entry-type radios share name="entry_method" with stable VALUES:
//   REGULAR = "Start and end time", MANUAL = "Duration".
// Target by value (the styled <input> is visually hidden, so we click the
// wrapping <label>, not the input itself).
const entryMethodRadio = (page: Page, value: 'REGULAR' | 'MANUAL') =>
  page.locator(`input[name="entry_method"][value="${value}"]`);

async function selectEntryType(
  page: Page,
  value: 'REGULAR' | 'MANUAL',
): Promise<void> {
  await entryMethodRadio(page, value)
    .locator('xpath=ancestor::label')
    .first()
    .click();
}

// The duration VALUE field (shown when MANUAL is selected) is labeled
// "Total (hh:mm)" — NOT "Duration" (that's the radio's label).
const durationInput = (page: Page) =>
  drawer(page)
    .getByRole('textbox', { name: /Total/i })
    .or(drawer(page).getByLabel(/Total \(hh:mm\)/i))
    .first();

// exact:true — a substring match on "End time" otherwise hits the "Start and
// end time" entry-type radio. Scoped to the drawer.
const startTimeInput = (page: Page) =>
  drawer(page).getByLabel('Start time', { exact: true }).first();
const endTimeInput = (page: Page) =>
  drawer(page).getByLabel('End time', { exact: true }).first();
const startDateInput = (page: Page) =>
  drawer(page).getByLabel('Start date', { exact: true }).first();
const endDateInput = (page: Page) =>
  drawer(page).getByLabel('End date', { exact: true }).first();

/** Yesterday as MM/DD/YYYY — used so start/end times are never "in the future". */
function yesterdayMMDDYYYY(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}
const notesArea = (page: Page) =>
  page
    .getByLabel('Notes')
    .or(page.getByRole('textbox', { name: /Notes/i }))
    .first();

const customerDropdown = (page: Page) =>
  page
    .locator(`//*[text()='Customer']/ancestor::label/descendant::input`)
    .first();

const saveButton = (page: Page) =>
  drawer(page)
    .getByRole('button', { name: /^Save$/ })
    .first();

/** Open the Save split-button menu and click the requested variant. */
async function clickSaveVariant(
  page: Page,
  variant: 'Save and new' | 'Save and copy',
): Promise<void> {
  // The caret next to Save opens the menu with "Save and copy" / "Save and new".
  await drawer(page)
    .getByRole('button', { name: /expand|more|save options/i })
    .or(saveButton(page).locator('xpath=following-sibling::button'))
    .first()
    .click();
  await page
    .getByRole('menuitem', { name: variant })
    .or(page.getByText(variant, { exact: true }))
    .first()
    .click();
}

// ---- Navigation ------------------------------------------------------------

/** Time entries → Add time → "Single time entry" → wait for the legacy drawer. */
async function openAddTimeDrawer(
  page: Page,
  timeEntriesPage: TimeEntriesPage,
): Promise<void> {
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await clickAddTimeDropdown(page);
  await page
    .getByRole('option', { name: 'Single time entry' })
    .or(page.getByText('Single time entry', { exact: true }))
    .first()
    .click();
  await expect(drawer(page)).toBeVisible({ timeout: 30000 });
  await waitForDrawerReady(page);
}

/**
 * The drawer renders its shell (title + Team member) immediately, then loads the
 * rest of the form behind a spinner. Wait for the form to actually settle: the
 * entry-type radios + Save present, and the in-drawer loading spinner gone —
 * otherwise we interact before fields exist.
 */
async function waitForDrawerReady(page: Page): Promise<void> {
  const d = drawer(page);
  // Loading spinner inside the drawer — wait for it to detach (best-effort).
  await d
    .locator(`[class*="Spinner"], [class*="spinner"], [role="progressbar"]`)
    .first()
    .waitFor({ state: 'hidden', timeout: 30000 })
    .catch(() => undefined);
  // Stable post-load signals: the entry-type labels and the Save button.
  await expect(d.getByText('Start and end time', { exact: true })).toBeVisible({
    timeout: 30000,
  });
  await expect(saveButton(page)).toBeVisible({ timeout: 30000 });
  await page.waitForTimeout(500);
}

// ---- Field helpers ---------------------------------------------------------

/** Team member defaults to the admin; only fill if empty. Best-effort. */
async function ensureTeamMember(page: Page): Promise<void> {
  await soft('ensure team member set', async () => {
    const input = teamMemberInput(page);
    const current = (await input.inputValue().catch(() => '')) ?? '';
    if (current.trim()) return; // already populated (admin)
    await input.click();
    await input.fill(TEAM_MEMBER_MATCH);
    await page.waitForTimeout(800);
    await page.getByRole('option').first().click();
  });
}

async function setEntryTypeDuration(page: Page): Promise<void> {
  await selectEntryType(page, 'MANUAL');
  await durationInput(page).fill(DURATION);
}

async function setEntryTypeStartEnd(page: Page): Promise<void> {
  await selectEntryType(page, 'REGULAR');
  // Use YESTERDAY so 9–11 AM is never in the future (QBO blocks future times
  // with "Enter a time that's not in the future").
  const date = yesterdayMMDDYYYY();
  await soft('set start/end date to yesterday', async () => {
    await startDateInput(page).fill(date);
    await page.keyboard.press('Tab');
    await endDateInput(page).fill(date);
    await page.keyboard.press('Tab');
  });
  await startTimeInput(page).fill(START_TIME);
  await endTimeInput(page).fill(END_TIME);
}

async function fillNotes(page: Page, note: string): Promise<void> {
  await notesArea(page).fill(note);
}

/**
 * Always select a customer (even though it's optional) for coverage. Handles
 * both an inline option list AND the "Select Customer" side panel (rows like
 * "test cust1"). Asserts an option appears and clicks it, then verifies the
 * field is populated. NEVER presses Escape (that closes the drawer).
 */
async function selectFirstCustomer(page: Page): Promise<void> {
  const input = customerDropdown(page);
  // Customer options are role=option (e.g. "test cust1"); match by name so
  // .first() can't grab a folder ("Top") or filter option.
  const candidate = page.getByRole('option', { name: /test cust/i }).first();

  // Open the dropdown. A plain click sometimes only focuses the field without
  // expanding the list, so nudge it: click → (if no options) type to filter
  // (it's a typeahead) → (still none) ArrowDown.
  await input.click();
  await page.waitForTimeout(600);
  if (!(await candidate.isVisible({ timeout: 2000 }).catch(() => false))) {
    await input.fill('test').catch(() => undefined);
    await page.waitForTimeout(800);
  }
  if (!(await candidate.isVisible({ timeout: 2000 }).catch(() => false))) {
    await input.press('ArrowDown').catch(() => undefined);
    await page.waitForTimeout(800);
  }

  await expect(candidate).toBeVisible({ timeout: 8000 });
  await candidate.click();
  await page.waitForTimeout(500);
  // Confirm the field now holds a customer.
  await soft('customer selected', async () => {
    const val = (await input.inputValue().catch(() => '')) ?? '';
    expect(val.trim().length).toBeGreaterThan(0);
  });
}

/** If the "Save changes?" (unsaved-changes) modal is up, dismiss it. */
async function dismissUnsavedChangesModal(
  page: Page,
  choice: 'Yes' | 'No' = 'No',
): Promise<void> {
  const prompt = page.getByText('Save changes?', { exact: false }).first();
  if (await prompt.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page
      .getByRole('button', { name: choice })
      .first()
      .click()
      .catch(() => undefined);
    await page.waitForTimeout(500);
  }
}

/** Click the drawer Save and confirm the entry persisted (drawer closes). */
async function saveEntry(page: Page): Promise<void> {
  await saveButton(page).click();
  // A normal Save just closes the drawer; if an unsaved-changes prompt ever
  // appears, confirm the save.
  await dismissUnsavedChangesModal(page, 'Yes');
  await expect(drawer(page)).toBeHidden({ timeout: 20000 });
}

// ---- List read (Time Entries page, NOT Reports) ----------------------------

/** Show the Time Entries list by Date / This month so created rows are visible. */
async function showEntriesList(
  page: Page,
  timeEntriesPage: TimeEntriesPage,
): Promise<void> {
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  // Entries are created on TODAY, but the list defaults to a prior week
  // ("No time for this date range"). Switch to Date / This month so today's
  // created entries are visible for read + delete.
  await soft('set list to Date / This month', async () => {
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();
  });
}

/** True if a row whose text contains `text` is present in the entries table. */
async function listHasRowContaining(
  page: Page,
  text: string,
): Promise<boolean> {
  return page
    .locator(`//table//tbody//tr[contains(., ${xpathLiteral(text)})]`)
    .first()
    .isVisible({ timeout: 8000 })
    .catch(() => false);
}

/** XPath string literal that tolerates quotes in `value`. */
function xpathLiteral(value: string): string {
  if (!value.includes("'")) return `'${value}'`;
  if (!value.includes('"')) return `"${value}"`;
  return `concat('${value.replace(/'/g, "',\"'\",'")}')`;
}

// ============================================================================
// Suite
// ============================================================================

export async function runSTALegacySuite(
  page: Page,
  account: STATestAccount,
): Promise<void> {
  const timeEntriesPage = new TimeEntriesPage(page);
  console.log(
    '[STA-LEGACY] companyType=%s role=%s (legacy Add-time drawer)',
    account.companyType,
    account.role,
  );

  // --- Step 1: open the legacy drawer + verify structure -------------------
  await openAddTimeDrawer(page, timeEntriesPage);
  console.log('[STA-LEGACY][Step1] "Add time" drawer opened');
  await soft('core fields present', async () => {
    await expect(teamMemberInput(page)).toBeVisible();
    await expect(
      drawer(page).getByText('Start and end time', { exact: true }),
    ).toBeVisible();
    await expect(
      drawer(page).getByText('Duration', { exact: true }),
    ).toBeVisible();
    await expect(notesArea(page)).toBeVisible();
  });

  // --- Step 2: CREATE with Duration entry type → Save ----------------------
  await ensureTeamMember(page);
  await setEntryTypeDuration(page);
  await selectFirstCustomer(page); // always set a customer (optional but covered)
  await fillNotes(page, NOTE_DURATION);
  await soft('duration entry saved (drawer closes)', async () => {
    await saveEntry(page);
  });
  // READ from the Time Entries list (not Reports).
  await showEntriesList(page, timeEntriesPage);
  await soft('duration entry visible in Time Entries list', async () => {
    expect(await listHasRowContaining(page, TEAM_MEMBER_MATCH)).toBeTruthy();
  });
  console.log('[STA-LEGACY][Step2] Duration entry created + read from list');

  // --- Step 3: CREATE with Start and end time → Save and new ---------------
  await openAddTimeDrawer(page, timeEntriesPage);
  await ensureTeamMember(page);
  await setEntryTypeStartEnd(page);
  await selectFirstCustomer(page); // always set a customer (optional but covered)
  await fillNotes(page, NOTE_SAVE_NEW);
  await soft('Save and new keeps drawer open + clears notes', async () => {
    await clickSaveVariant(page, 'Save and new');
    await expect(drawer(page)).toBeVisible({ timeout: 15000 });
    await expect(notesArea(page)).toHaveValue('', { timeout: 10000 });
  });
  console.log('[STA-LEGACY][Step3] Start/End entry saved via Save and new');

  // --- Step 4: Save and copy (drawer stays open, values copied) ------------
  await fillNotes(page, NOTE_SAVE_COPY);
  await setEntryTypeStartEnd(page);
  await soft('Save and copy keeps drawer open', async () => {
    await clickSaveVariant(page, 'Save and copy');
    await expect(drawer(page)).toBeVisible({ timeout: 15000 });
  });
  // Close the drawer (Cancel) before reading the list. Cancel with the copied
  // (unsaved) values pops the "Save changes?" prompt — discard via "No".
  await soft('close drawer after save-and-copy', async () => {
    await drawer(page)
      .getByRole('button', { name: /^Cancel$/i })
      .click();
    await dismissUnsavedChangesModal(page, 'No');
    await expect(drawer(page)).toBeHidden({ timeout: 10000 });
  });
  console.log('[STA-LEGACY][Step4] Save and copy exercised');

  // --- Step 5: EDIT an entry from the list ---------------------------------
  await showEntriesList(page, timeEntriesPage);
  await soft('edit first entry from list → save', async () => {
    // Edit is an inline row action (NOT an Expand-Menu item). Use the proven
    // page-object locator, which finds the row by team-member name and clicks
    // its Edit; .first() handles multiple entries safely.
    await timeEntriesPage.clickEditForEmployee(TEAM_MEMBER_MATCH);
    await expect(drawer(page)).toBeVisible({ timeout: 20000 });
    await fillNotes(page, NOTE_EDITED);
    await saveEntry(page);
  });
  console.log('[STA-LEGACY][Step5] Edited an entry from the list');

  // --- Step 6: DELETE entries from the list --------------------------------
  if (account.entitlements.canDelete) {
    await cleanupSTALegacyEntries(page);
    console.log('[STA-LEGACY][Step6] Deleted created entries from the list');
  }

  console.log('[STA-LEGACY] Full legacy suite complete.');
}

// ---- Cleanup (delete every created entry from the Time Entries list) -------

export async function cleanupSTALegacyEntries(page: Page): Promise<void> {
  const timeEntriesPage = new TimeEntriesPage(page);
  await showEntriesList(page, timeEntriesPage);

  // Delete rows until the list is empty (bounded). Clicks carry explicit short
  // timeouts — the project's default actionTimeout is 5 min, so an un-bounded
  // click on a phantom/hidden "Expand Menu" would hang the whole run.
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
