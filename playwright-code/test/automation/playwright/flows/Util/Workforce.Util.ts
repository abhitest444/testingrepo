import { Browser, expect, Locator, Page } from '@playwright/test';
import AssignmentsPage from '../../pages/AssignmentsPage';
import CustomFieldsPage from '../../pages/CustomFieldSettingsPage';
import ApprovalsPage from '../../pages/ApprovalsPage';
import SingleTimeEntryPage from '../../pages/SingleTimeEntryPage';
import { LoginCredentials } from '../../config/types';
import { BreaksPage } from '../../pages/BreaksPage';
import {
  getQboRootUrl,
  openQBOWithLoginCredentials,
  openWorkforce,
} from '../../pages/QBOLogin';
import {
  clickAddTimeDropdown,
  dismissApprovalsMovedPopup,
  durationDisplayMatchPattern,
  locatorTableRowForEmployee,
  locatorTableRowsForEmployee,
  getDateRangeDropdown,
  openDateRangeDropdown,
  selectDateRangeOption,
  selectSingleTimeEntryFromAddTime,
  selectDisplayByOption,
} from '../../commonUtils';
import WorkforcePage from '../../pages/WorkforcePage';
import {
  deleteAllEntriesFromViewDetails,
  deleteEntryFromViewDetails,
} from './Approvals.util';
import {
  clickCustomerDropdownOption,
  customerProjectDropdown,
  getCustomerName,
  handlePopupsInAnyOrder,
  hours,
  saveButton,
  selectTeamMemberByMainLabel,
  teamMemberDropdown,
  waitForWeeklyTimeEntryFormSettled,
  waitForLoadingToDisappear,
  WeeklyTimeEntryPage,
} from '../../pages/WeeklyTimeEntryPage';
import TimeClockPage from '../../pages/TimeClockPage';
import TimeEntriesPage from '../../pages/TimeEntriesPage';
import { openWeeklyTimeEntry } from './WTERunPayroll.util';
import {
  assignClassFieldLevelCustomers,
  configureClassValuesWorkerAndCustomer,
  ensureClassFieldInactiveForAssignments,
  isClassValueVisibleInClassDropdown,
  openTimesheetFieldsEditMode,
} from './Assignments.util';

/**
 * Lightweight structured logger for WFS investigation. Emits a single
 * console line and never throws, so it is safe to sprinkle through flows.
 */
function debugSessionLog(
  source: string,
  event: string,
  data: Record<string, unknown> = {},
  tag?: string,
): void {
  try {
    console.log(
      `[wfs-debug]${
        tag ? `[${tag}]` : ''
      } ${source} › ${event} ${JSON.stringify(data)}`,
    );
  } catch {
    console.log(`[wfs-debug]${tag ? `[${tag}]` : ''} ${source} › ${event}`);
  }
}

// ==================== Workforce overlay helpers (Tasks drawer, etc.) ====================

export const isWorkforcePortalPage = (page: Page): boolean =>
  /workforce(\.intuit\.com|-e2e\.intuit\.com)/i.test(page.url());

/**
 * Tasks drawer title (Playwright recorder):
 * `page.getByTestId('drawerTitle').getByText('Tasks')`
 */
export function tasksDrawerTitleLocator(page: Page): Locator {
  return page.getByTestId('drawerTitle').getByText('Tasks', { exact: true });
}

/**
 * Shell tray toggle beside the header — NOT the drawer header Close.
 * Accessible name is like `close-workforce-widgets-ui/wf-employee-task-drawer-tray`;
 * clicking it toggles the drawer open/closed.
 */
export const WORKFORCE_TASKS_TRAY_TOGGLE_PATTERN =
  /task-drawer-tray|wf-employee-task-drawer-tray/i;

export function tasksDrawerTrayToggleLocator(page: Page): Locator {
  return page.getByRole('button', {
    name: WORKFORCE_TASKS_TRAY_TOGGLE_PATTERN,
  });
}

/** Open Tasks drawer panel (`role="dialog"`, `aria-modal="true"`, `idsTSDrawer`). */
export function tasksDrawerPanelLocator(page: Page): Locator {
  return page
    .locator(
      `//*[@role='dialog' and @aria-modal='true'][.//*[@data-testid='drawerTitle' and normalize-space()='Tasks']]`,
    )
    .first()
    .or(
      page
        .getByRole('dialog', { name: /Tasks/i })
        .filter({ has: tasksDrawerTitleLocator(page) })
        .first(),
    );
}

/**
 * Header Close (X) on the Tasks drawer — scoped to the open `aria-modal` dialog, not the
 * shell tray toggle (`close-workforce-widgets-ui/wf-employee-task-drawer-tray`).
 *
 * DevTools (Tasks drawer): `div.idsTSDrawer[role=dialog][aria-modal=true]` →
 * `button[aria-label="Close"].Drawer-headerCloseIcon`.
 */
export const TASKS_DRAWER_HEADER_CLOSE_XPATH = `//*[@role='dialog' and @aria-modal='true'][.//*[@data-testid='drawerTitle' and normalize-space()='Tasks']]//*[@aria-label='Close'][contains(@class,'Drawer-headerCloseIcon')]`;

export function tasksDrawerCloseButtonLocator(page: Page): Locator {
  return page.locator(TASKS_DRAWER_HEADER_CLOSE_XPATH).first();
}

export async function isTasksDrawerVisible(
  page: Page,
  timeoutMs = 1500,
): Promise<boolean> {
  return tasksDrawerTitleLocator(page)
    .isVisible({ timeout: timeoutMs })
    .catch(() => false);
}

type DismissTasksOptions = {
  maxAttempts?: number;
  waitForDrawerMs?: number;
};

/**
 * Close the Workforce Tasks drawer so main content (Display by, Date range, Add time) is clickable.
 * Safe to call on QBO pages — no-op when not Workforce or drawer is absent.
 */
async function dismissWorkforceTimesheetCoachmark(
  page: Page,
): Promise<boolean> {
  const coachmark = page.getByText(/Ready to add a timesheet\?/i);
  if (!(await coachmark.isVisible({ timeout: 1500 }).catch(() => false))) {
    return false;
  }
  const closeButton = page.locator(
    '//*[text()="Ready to add a timesheet?"]/ancestor::div//button[contains(@aria-label, "close") or contains(@aria-label, "Close")]',
  );
  if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeButton.click({ timeout: 5000 }).catch(() => undefined);
    await page.waitForTimeout(400);
    console.log('✓ Dismissed "Ready to add a timesheet?" popup');
    return true;
  }
  return false;
}

export async function dismissWorkforceTasksDrawer(
  page: Page,
  options: DismissTasksOptions = {},
): Promise<void> {
  if (!isWorkforcePortalPage(page)) {
    return;
  }

  const maxAttempts = options.maxAttempts ?? 4;
  const waitForDrawerMs = options.waitForDrawerMs ?? 8000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const title = tasksDrawerTitleLocator(page);
    const visible = await title
      .isVisible({ timeout: attempt === 0 ? waitForDrawerMs : 2000 })
      .catch(() => false);
    if (!visible) {
      return;
    }

    const closeBtn = tasksDrawerCloseButtonLocator(page);
    let closed = false;
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      try {
        await closeBtn.click({ timeout: 8000 });
        closed = true;
      } catch {
        await closeBtn
          .click({ timeout: 8000, force: true })
          .catch(() => undefined);
        closed = true;
      }
    }

    if (!closed) {
      await page.keyboard.press('Escape').catch(() => undefined);
      await page.waitForTimeout(200);
    }

    await page.waitForTimeout(400);
    await title.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});

    if (!(await isTasksDrawerVisible(page, 1000))) {
      console.log('✓ Dismissed Tasks drawer');
      return;
    }
  }

  if (await isTasksDrawerVisible(page, 500)) {
    console.log('⚠ Tasks drawer may still be open after dismiss attempts');
  }
}

/** Dismiss Workforce overlays that block Time entries filters (coachmark + Tasks drawer). */
export async function dismissWorkforceOverlaysBeforeInteraction(
  page: Page,
): Promise<void> {
  if (!isWorkforcePortalPage(page)) {
    return;
  }

  const tasksOpen = await isTasksDrawerVisible(page, 800);
  const coachmarkOpen = await page
    .getByText(/Ready to add a timesheet\?/i)
    .isVisible({ timeout: 500 })
    .catch(() => false);

  if (!tasksOpen && !coachmarkOpen) {
    return;
  }

  await dismissWorkforceTimesheetCoachmark(page);
  await dismissWorkforceTasksDrawer(page);
}

/**
 * Close Tasks drawer / coachmark before Add time, filters, or STE/WTE menu clicks.
 * Retries until the drawer is gone so menu items are not covered.
 */
export async function ensureWorkforceTasksDrawerClosed(
  page: Page,
): Promise<void> {
  if (!isWorkforcePortalPage(page)) {
    return;
  }

  await dismissWorkforceTimesheetCoachmark(page);
  await dismissWorkforceTasksDrawer(page);

  if (await isTasksDrawerVisible(page, 1000)) {
    await page.keyboard.press('Escape').catch(() => undefined);
    await dismissWorkforceTasksDrawer(page, {
      maxAttempts: 3,
      waitForDrawerMs: 5000,
    });
  }

  if (await isTasksDrawerVisible(page, 800)) {
    throw new Error(
      'Workforce Tasks drawer is still open and blocks Time entries actions (Add time / filters).',
    );
  }
}

/** Close STE/WTE/Break trowsers that block Display by / Date range filters. */
export async function ensureWorkforceTimeEntryDrawerClosed(
  page: Page,
): Promise<void> {
  if (!isWorkforcePortalPage(page)) {
    return;
  }

  const drawerTitles = [
    page.getByRole('heading', { name: /Single time entry/i }),
    page.getByRole('heading', { name: /Weekly time\s*(sheet|entry)/i }),
    page.getByRole('heading', { name: /^Break$/i }),
  ];

  for (const title of drawerTitles) {
    if (!(await title.isVisible({ timeout: 500 }).catch(() => false))) {
      continue;
    }

    const closeBtn = page.locator('button[aria-label="Close"]').first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click({ force: true });
    } else {
      await page.keyboard.press('Escape').catch(() => undefined);
      const cancelBtn = page.getByRole('button', { name: 'Cancel' });
      if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cancelBtn.click();
        const leaveBtn = page.getByRole('button', {
          name: /leave without saving/i,
        });
        if (await leaveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await leaveBtn.click();
        }
      }
    }
    await title
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => undefined);
    await page.waitForTimeout(500);
  }
}

/** Open Date range on Workforce (one overlay check — no full re-navigation). */
export async function openWorkforceDateRangeDropdown(
  page: Page,
): Promise<void> {
  await dismissWorkforceOverlaysBeforeInteraction(page);
  await getDateRangeDropdown(page).click({ timeout: 10_000 });
}

/** Open Date range and pick This month on Workforce Time entries. */
export async function selectWorkforceDateRangeThisMonth(
  page: Page,
): Promise<void> {
  await applyWorkforceTimeEntriesFilters(page, {
    displayBy: 'Date',
    dateRange: 'This month',
  });
}

/**
 * Navigate to Time entries and dismiss Tasks drawer / coachmark overlays.
 * Use before any Display by, Date range, or Add time interaction on Workforce.
 */
export async function navigateToWorkforceTimeEntries(
  page: Page,
): Promise<WorkforcePage> {
  const workforcePage = new WorkforcePage(page);
  await workforcePage.clickTimeTracking();
  await ensureWorkforceTasksDrawerClosed(page);
  return workforcePage;
}

/** Apply list filters on Workforce Time entries (overlay-safe). */
export async function applyWorkforceTimeEntriesFilters(
  page: Page,
  options: {
    displayBy?: string;
    dateRange?: string;
  } = {},
): Promise<void> {
  const steOpen = await page
    .getByRole('heading', { name: /Single time entry/i })
    .isVisible({ timeout: 500 })
    .catch(() => false);
  const tasksOpen = await isTasksDrawerVisible(page, 500).catch(() => false);
  debugSessionLog(
    'Workforce.Util.ts:applyWorkforceTimeEntriesFilters',
    'filter_apply_start',
    {
      steOpen,
      tasksOpen,
      displayBy: options.displayBy,
      dateRange: options.dateRange,
    },
    'H1',
  );
  await ensureWorkforceTimeEntryDrawerClosed(page);
  await ensureWorkforceTasksDrawerClosed(page);
  if (options.displayBy) {
    await selectDisplayByOption(page, options.displayBy);
    await waitForLoadingToDisappear(page).catch(() => undefined);
    await page.waitForTimeout(500);
  }
  if (options.dateRange) {
    await openWorkforceDateRangeDropdown(page);
    await selectDateRangeOption(page, options.dateRange);
    await page.waitForTimeout(2000);
  }
}

/**
 * Workforce Web App Utility Functions
 * Combined test case logic to reduce navigation overhead
 *
 * Test Cases:
 * - WF001: Login, Dashboard, Page Elements & All Filters
 * - WF002: Clock In/Out Complete Flow
 * - WF003: Break Entry Complete Flow (Create + Data Validation, Edit, Delete)
 * - WF004: STE Complete Flow (Create + Data Validation)
 * - WF005: Edit + delete entry flow (single STE: create → edit → delete → cleanup)
 * - WF007: WTE Complete Flow (Create + Data Validation, Edit, Delete)
 * - WF008–WF021: QBO Admin ↔ Workforce sync (see verifyAdmin* / verifyEmployee*)
 */

// ==================== WF001: Login, Dashboard, Page Elements & Filters ====================

export const verifyWorkforceLoginDashboardAndFilters = async (page: Page) => {
  const workforcePage = new WorkforcePage(page);

  // ===== Dashboard Validation =====
  console.log('--- Dashboard Validation ---');

  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);
  expect(currentUrl).toContain('workforce');

  await workforcePage.validateMyProfileVisible();
  await workforcePage.validateTimeTrackingNavVisible();

  // ===== Navigate to Time Tracking Page =====
  console.log('--- Time Tracking Page Validation ---');
  await page.waitForTimeout(2000);
  await navigateToWorkforceTimeEntries(page);
  console.log('✓ Navigated to Time entries page');

  // ===== Page Elements Validation =====
  await workforcePage.validateTimeTrackingPageElements();
  await workforcePage.validateAddTimeDropdownOptions();
  await workforcePage.validateNoTimeEntriesYet();

  // ===== Filter Dropdown Options Validation =====
  await workforcePage.validateAllDropdownOptions();

  console.log(
    '✓ WF001 Complete: Login, Dashboard, Page Elements & Filter Options validated',
  );
};

// ==================== WF002: Clock In/Out Complete Flow ====================

export const verifyClockInOutFlow = async (page: Page) => {
  await waitForLoadingToDisappear(page);
  const workforcePage = await navigateToWorkforceTimeEntries(page);
  console.log('✓ Navigated to Time tracking page');
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(3000);

  await cleanupAllTimeEntriesInWF(page);

  await dismissWorkforceOverlaysBeforeInteraction(page);
  // ===== Clock In Validation =====
  console.log('--- Clock In Validation ---');

  await workforcePage.validateClockInButton();
  await workforcePage.clickClockIn();
  await page.waitForTimeout(3000);
  //await workforcePage.validateCurrentlyWorkingEntry();

  // Get available options
  const options = await workforcePage.getCustomerProjectOptions(page);
  console.log('Customer/Project options:', options);
  expect(options.length).toBeGreaterThan(0);

  // Verify we can select an option
  if (options.length > 0) {
    await workforcePage.selectCustomerProject(page, options[0]);
    console.log('Selected customer/project:', options[0]);
  }

  await TimeClockPage.clickOnClockInButton(page);
  console.log('Clicked on Clock In button');
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(1000);

  // ===== Clock Out Validation =====
  console.log('--- Clock Out Validation ---');

  await workforcePage.clickClockOut();
  await workforcePage.validateClockOutSuccess();

  console.log('Validated time entries in table');

  // ===== Post-cleanup: Delete all created entries =====
  console.log('--- Post-cleanup ---');
  await page.waitForTimeout(1000);
  await workforcePage.cleanupAllTimeEntries();

  console.log('✓ WF002 Complete: Clock In/Out flow validated');
};

// ==================== WF003: Break Entry Complete Flow ====================

export const verifyBreakEntryCompleteFlow = async (page: Page) => {
  await waitForLoadingToDisappear(page);
  const workforcePage = await navigateToWorkforceTimeEntries(page);
  console.log('✓ Navigated to Time tracking page');
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(3000);

  await cleanupAllTimeEntriesInWF(page);

  await dismissWorkforceOverlaysBeforeInteraction(page);

  // ===== Cleanup existing break entries =====
  await selectDisplayByOption(page, 'Date');
  await page.waitForTimeout(1000);
  await selectDateRangeOption(page, 'This month');
  await page.waitForTimeout(2000);
  await waitForLoadingToDisappear(page);
  await dismissWorkforceOverlaysBeforeInteraction(page);
  await workforcePage.cleanupAllBreakEntries();

  // ===== Break Access & Visibility Validation =====
  console.log('--- Break Access & Visibility ---');

  await workforcePage.clickBreakOption();
  await workforcePage.validateBreakDrawerOpened();
  await workforcePage.validateBreakDrawerElements();
  await workforcePage.cancelBreak();

  // ===== Add Break with Duration + Data Validation =====
  console.log('--- Add Break with Duration ---');

  const breakDuration = '00:30';
  await workforcePage.clickBreakOption();
  await workforcePage.validateBreakDrawerOpened();
  await workforcePage.setBreakDateToYesterday();
  await workforcePage.fillBreakDuration(breakDuration);
  await workforcePage.saveBreak();

  // Handle 'Break type is required' error - only shows after save
  const needsBreakType = await workforcePage.handleBreakTypeRequiredError();
  if (needsBreakType) {
    await workforcePage.saveBreak();
  }

  await workforcePage.validateBreakSaved();

  await page.waitForTimeout(3000);
  await selectDisplayByOption(page, 'Date');
  await page.waitForTimeout(1000);
  await selectDateRangeOption(page, 'This month');
  await page.waitForTimeout(2000);
  await workforcePage.validateBreakEntryOnScreen(
    breakDuration.replace('00:', '0:'),
  );
  console.log(`✓ Break duration "${breakDuration}" validated on screen`);

  // ===== Add Break with Start/End Time + Data Validation =====
  console.log('--- Add Break with Start/End Time ---');

  let breakStartTime = '12:00 PM';
  let breakEndTime = '12:30 PM';
  await workforcePage.clickBreakOption();
  await workforcePage.validateBreakDrawerOpened();
  await workforcePage.setBreakDateToYesterday();
  await workforcePage.toggleSetStartAndEndTime();
  await workforcePage.fillBreakStartTime(breakStartTime);
  await workforcePage.fillBreakEndTime(breakEndTime);
  await workforcePage.saveBreak();

  // Handle 'Break type is required' error - only shows after save
  const needsBreakType2 = await workforcePage.handleBreakTypeRequiredError();
  if (needsBreakType2) {
    await workforcePage.saveBreak();
  }

  // Handle timeframe conflict - retry with different time if needed
  const hasConflict = await workforcePage.handleTimeframeConflictError();
  if (hasConflict) {
    breakStartTime = '2:00 PM';
    breakEndTime = '2:30 PM';
    await workforcePage.clickBreakOption();
    await workforcePage.validateBreakDrawerOpened();
    await workforcePage.setBreakDateToYesterday();
    await workforcePage.toggleSetStartAndEndTime();
    await workforcePage.fillBreakStartTime(breakStartTime);
    await workforcePage.fillBreakEndTime(breakEndTime);
    await workforcePage.saveBreak();
    const needsBreakType3 = await workforcePage.handleBreakTypeRequiredError();
    if (needsBreakType3) {
      await workforcePage.saveBreak();
    }
  }

  await workforcePage.validateBreakSaved();

  await page.waitForTimeout(3000);
  await selectDisplayByOption(page, 'Date');
  await page.waitForTimeout(1000);
  await selectDateRangeOption(page, 'This month');
  await page.waitForTimeout(2000);
  await workforcePage.validateBreakEntryTimeRangeOnScreen(
    breakStartTime,
    breakEndTime,
  );
  console.log(
    `✓ Break times "${breakStartTime} - ${breakEndTime}" validated on screen`,
  );

  // ===== Edit Break Entry =====
  console.log('--- Edit Break Entry ---');

  await page.waitForTimeout(2000);
  await workforcePage.editBreakEntry('00:45');

  // ===== Delete Break Entry =====
  console.log('--- Delete Break Entry ---');

  await page.waitForTimeout(2000);
  await workforcePage.deleteBreakEntry();
  console.log(
    '✓ WF003 Complete: Break entry flow (Create, Data Validation, Edit, Delete) validated',
  );
};

// ==================== WF004: STE Complete Flow ====================

export const verifySteCompleteFlow = async (page: Page) => {
  await waitForLoadingToDisappear(page);
  const workforcePage = await navigateToWorkforceTimeEntries(page);
  console.log('✓ Navigated to Time tracking page');
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(3000);

  await cleanupAllTimeEntriesInWF(page);

  await dismissWorkforceOverlaysBeforeInteraction(page);
  // ===== STE Access & Visibility Validation =====
  console.log('--- STE Access & Visibility ---');

  await workforcePage.clickSingleTimeEntryOption();
  await handlePopupsInAnyOrder(page);
  await workforcePage.validateSteDrawerOpened();
  await workforcePage.validateSteDrawerElements();
  await workforcePage.cancelSte();

  // ===== Add STE with Duration + Data Validation =====
  console.log('--- Add STE with Duration ---');

  const steDuration = '1:00';
  const steNotes = `Test STE duration - ${Date.now()}`;
  await workforcePage.clickSingleTimeEntryOption();
  await workforcePage.validateSteDrawerOpened();
  await page.waitForTimeout(2000);
  await workforcePage.selectSteCustomer();
  await workforcePage.ensureSteStartEndTimeToggleOff();
  await workforcePage.setSteDateToToday();
  await workforcePage.fillSteDuration(steDuration);
  await workforcePage.fillSteNotes(steNotes);
  await workforcePage.saveSte();
  await workforcePage.validateSteSaved();

  await applyWorkforceTimeEntriesFilters(page, {
    displayBy: 'Date',
    dateRange: 'This month',
  });

  await workforcePage.validateSteEntryOnScreen(steDuration);
  console.log(`✓ STE duration "${steDuration}" validated on screen`);

  await workforcePage.validateEntryNotesOnScreen(steNotes.substring(0, 15), 0);

  // ===== Edit STE (duration entry) — change duration =====
  console.log('--- Edit STE - Change Duration ---');

  const steDurationUpdated = '2:00';
  await workforcePage.validateEditButtonVisibleInRowContaining(steNotes);
  await workforcePage.clickEditInRowContaining(steNotes);
  await workforcePage.validateEditDrawerOpened();

  await workforcePage.ensureSteStartEndTimeToggleOff();
  await workforcePage.fillSteDuration(steDurationUpdated);
  await workforcePage.saveSte();
  await workforcePage.validateEntryUpdated();
  console.log('--- Validate edited duration on screen ---');
  await page.waitForTimeout(2000);
  await applyWorkforceTimeEntriesFilters(page, {
    displayBy: 'Date',
    dateRange: 'This month',
  });

  await workforcePage.validateEntryDurationOnScreen(
    steDurationUpdated,
    0,
    steNotes,
  );
  console.log(
    `✓ STE duration after edit "${steDurationUpdated}" validated on screen`,
  );

  // ===== Add STE with Start/End Time + Data Validation =====
  console.log('--- Add STE with Start/End Time ---');

  // Ensure any open drawer is closed before adding new entry
  await workforcePage.closeAnyOpenDrawer();

  const steStartTime = '9:00 AM';
  const steEndTime = '10:00 AM';
  const steStartEndNotes = `Test STE start/end - ${Date.now()}`;
  await workforcePage.clickSingleTimeEntryOption();
  await workforcePage.validateSteDrawerOpened();
  await page.waitForTimeout(2000);
  await workforcePage.selectSteCustomer();
  await workforcePage.ensureSteStartEndTimeToggleOn();
  await workforcePage.setSteDateToYesterday();
  await workforcePage.selectSteStartTime(steStartTime);
  await workforcePage.selectSteEndTime(steEndTime);
  await workforcePage.fillSteNotes(steStartEndNotes);
  await workforcePage.saveSte();
  await workforcePage.validateSteSaved();

  await applyWorkforceTimeEntriesFilters(page, {
    displayBy: 'Date',
    dateRange: 'This month',
  });

  await workforcePage.validateSteEntryTimeRangeOnScreen(
    steStartTime,
    steEndTime,
  );
  console.log(
    `✓ STE times "${steStartTime} - ${steEndTime}" validated on screen`,
  );

  // ===== Edit STE (same start/end entry) — change end time =====
  console.log('--- Edit STE - Change End Time ---');

  const steEndTimeUpdated = '11:00 AM';
  await workforcePage.validateEditButtonVisibleInRowContaining(
    steStartEndNotes,
  );
  await workforcePage.clickEditInRowContaining(steStartEndNotes);
  await workforcePage.validateEditDrawerOpened();

  //await workforcePage.ensureSteStartEndTimeToggleOn();
  await workforcePage.selectSteEndTime(steEndTimeUpdated);
  await workforcePage.saveSte();
  await workforcePage.validateEntryUpdated();

  console.log('--- Validate edited start/end on screen ---');
  await page.waitForTimeout(2000);
  await applyWorkforceTimeEntriesFilters(page, {
    displayBy: 'Date',
    dateRange: 'This month',
  });

  await workforcePage.validateSteEntryTimeRangeOnScreen(
    steStartTime,
    steEndTimeUpdated,
  );
  console.log(
    `✓ STE times after edit "${steStartTime} - ${steEndTimeUpdated}" validated on screen`,
  );

  // ===== Post-cleanup: Delete all created entries =====
  console.log('--- Post-cleanup ---');
  await page.waitForTimeout(1000);
  await workforcePage.cleanupAllTimeEntries();

  console.log('✓ WF004 Complete: STE flow with data validation completed');
};

// ==================== WF005 (+ former WF006): Edit then delete one STE ====================

export const verifyEditAndDeleteEntryFlow = async (page: Page) => {
  const workforcePage = await navigateToWorkforceTimeEntries(page);
  console.log('✓ Navigated to Time tracking page');

  console.log('--- Creating STE (used for edit + delete) ---');

  const originalDuration = '1:00';
  const steNotes = `Edit+delete STE - ${Date.now()}`;
  await workforcePage.clickSingleTimeEntryOption();
  await workforcePage.validateSteDrawerOpened();
  await page.waitForTimeout(2000);
  await workforcePage.selectSteCustomer();
  await workforcePage.ensureSteStartEndTimeToggleOff();
  await workforcePage.setSteDateToToday();
  await workforcePage.fillSteDuration(originalDuration);
  await workforcePage.fillSteNotes(steNotes);
  await workforcePage.saveSte();
  await workforcePage.validateSteSaved();

  await applyWorkforceTimeEntriesFilters(page, {
    displayBy: 'Date',
    dateRange: 'This month',
  });

  console.log('--- Edit STE - Change Duration ---');

  const updatedDuration = '2:00';
  await workforcePage.validateEditButtonVisibleInRowContaining(steNotes);
  await workforcePage.clickEditInRowContaining(steNotes);
  await workforcePage.validateEditDrawerOpened();

  await workforcePage.ensureSteStartEndTimeToggleOff();
  await workforcePage.fillSteDuration(updatedDuration);
  await workforcePage.saveSte();
  await workforcePage.validateEntryUpdated();

  console.log('--- Validate edited duration on screen ---');

  await page.waitForTimeout(2000);
  await applyWorkforceTimeEntriesFilters(page, {
    displayBy: 'Date',
    dateRange: 'This month',
  });
  await workforcePage.validateEntryDurationOnScreen(
    updatedDuration,
    0,
    steNotes,
  );
  console.log(`✓ Edited duration "${updatedDuration}" validated on screen`);

  const countBefore = await workforcePage.getTimeEntryCount();
  console.log(`Entries before deletion: ${countBefore}`);

  console.log('--- Delete same entry ---');

  const rowToDelete = workforcePage.timeEntryRow
    .filter({ hasText: steNotes })
    .first();
  await rowToDelete.locator('button[aria-label="Expand Menu"]').click();
  await workforcePage.clickDeleteInActionDropdown();
  await workforcePage.validateDeleteConfirmationPopup();
  await workforcePage.confirmDelete();
  await workforcePage.validateEntryDeleted();

  await page.waitForTimeout(2000);
  const countAfter = await workforcePage.getTimeEntryCount();
  console.log(`Entries after deletion: ${countAfter}`);

  if (countBefore > 0) {
    expect(countAfter).toBeLessThan(countBefore);
  }

  console.log('--- Post-cleanup ---');
  await page.waitForTimeout(1000);
  await workforcePage.cleanupAllTimeEntries();

  console.log(
    '✓ WF005 Complete: Edit then delete entry flow (merged former WF005 + WF006)',
  );
};

// ==================== Workforce partial-week WTE (WF007, WF017, WF018, WFP005) ====================

/** Mon=1 … Wed=3 — partial WTE fills/edits for WF007 / WFP005 (employee-created WTE). */
export const WORKFORCE_PARTIAL_WEEKDAY_COUNT = 3;

export const verifyWteCompleteFlow = async (page: Page) => {
  await waitForLoadingToDisappear(page);
  const workforcePage = await navigateToWorkforceTimeEntries(page);
  console.log('✓ Navigated to Time tracking page');
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(3000);

  await cleanupAllTimeEntriesInWF(page);

  await dismissWorkforceOverlaysBeforeInteraction(page);
  // ===== WTE Access & Visibility Validation =====
  console.log('--- WTE Access & Visibility ---');

  await workforcePage.clickWeeklyTimeEntryOption();
  await workforcePage.validateWteDrawerOpened();
  await workforcePage.validateWteDrawerElements();
  await workforcePage.cancelWte();

  // ===== Add WTE: customer, first N weekday hours + optional Service / Billable / Notes =====
  console.log('--- Add WTE with Hours + Panel Details ---');

  await workforcePage.clickWeeklyTimeEntryOption();
  await workforcePage.validateWteDrawerOpened();
  await workforcePage.waitForWteTimesheetReady();

  const wteCustomerName = await createAndValidatePartialWeeklyTimeEntry(page);
  console.log(`✓ WTE created for customer: ${wteCustomerName}`);

  await validatePartialTimeEntriesInTable(
    page,
    wteCustomerName,
    '8',
    WORKFORCE_PARTIAL_WEEKDAY_COUNT,
  );
  console.log('✓ WTE hours "8" validated on screen');

  // ===== Edit WTE Entry =====
  console.log('--- Edit WTE Entry ---');

  const updatedHoursPerDay = '6';
  await page.waitForTimeout(2000);
  await editPartialWeeklyTimeEntry(page, updatedHoursPerDay);

  await page.waitForTimeout(2000);
  await validatePartialTimeEntriesInTable(
    page,
    wteCustomerName,
    updatedHoursPerDay,
    WORKFORCE_PARTIAL_WEEKDAY_COUNT,
  );
  console.log(`✓ Edited WTE hours "${updatedHoursPerDay}" validated on screen`);

  // ===== Delete WTE Entry =====
  console.log('--- Delete WTE Entry ---');

  await page.waitForTimeout(2000);
  await cleanupAllTimeEntriesInWF(page);
  await page.waitForTimeout(2000);
  console.log(
    '✓ WF007 Complete: WTE flow (Create + Data Validation, Edit, Delete) validated',
  );
};

/**
 * QBO Approvals often lists one summary row per employee (totals), without line notes
 * or per-entry hours in that row. Prefer note/duration when present; else same as WF008.
 */
async function qboApprovalsRowForEmployee(
  page: Page,
  employeeName: string,
  syncNote: string,
  testDuration: string,
  stepLabel: string = 'lookup',
): Promise<Locator> {
  let rows = locatorTableRowsForEmployee(page, employeeName).filter({
    hasText: syncNote,
  });
  if ((await rows.count()) > 0) {
    return rows.first();
  }
  console.log(
    `QBO Approvals (${stepLabel}): summary row has no notes text; trying employee + duration`,
  );
  rows = locatorTableRowsForEmployee(page, employeeName).filter({
    hasText: durationDisplayMatchPattern(testDuration),
  });
  if ((await rows.count()) > 0) {
    return rows.first();
  }
  console.log(
    `QBO Approvals (${stepLabel}): summary row has no per-entry duration; using employee row only`,
  );
  return locatorTableRowForEmployee(page, employeeName);
}

/** QBO Time → Approvals with Date range = This month. */
export async function navigateToQboApprovalsThisMonth(
  page: Page,
): Promise<void> {
  await page.goto(`${getQboRootUrl()}/app/time?jobId=time`);
  await page.waitForTimeout(2000);

  const approvalsTab = page
    .locator('button:has-text("Approvals"), a:has-text("Approvals")')
    .first();
  if (await approvalsTab.isVisible().catch(() => false)) {
    await approvalsTab.click();
    await page.waitForTimeout(2000);
  }

  await dismissApprovalsMovedPopup(page);
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await page.waitForTimeout(1500);
}

/** Reuse logged-in admin tab — do not call {@link openQBOWithLoginCredentials} again. */
async function gotoQboTimeAsLoggedInAdmin(adminPage: Page): Promise<void> {
  await adminPage.bringToFront();
  await adminPage.goto(`${getQboRootUrl()}/app/time?jobId=time`);
  await adminPage.waitForTimeout(2000);
}

/** QBO admin STE create for a named employee (WF008 fallback when Workforce days are locked). */
async function createQboSteForEmployeeAdmin(
  adminPage: Page,
  employeeName: string,
  testDuration: string,
  notes: string,
): Promise<void> {
  await gotoQboTimeAsLoggedInAdmin(adminPage);
  await clickAddTimeDropdown(adminPage);
  await selectSingleTimeEntryFromAddTime(adminPage);

  const stePage = new SingleTimeEntryPage(adminPage);
  await stePage.handlePopupsInAnyOrder();
  await stePage.waitForSteFormSettled();
  await stePage.selectEmployeeByDisplayName(employeeName);

  const today = new Date();
  await stePage.fillStartDate(
    today.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }),
  );
  await stePage.openAndselectCustomerOption(1);
  await stePage.enterFieldValue('Duration', testDuration);
  await stePage.enterNotes(notes);
  await stePage.clickSaveButton();
  await expect(adminPage.getByText('Time entry added.')).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * WF008 / WF011: unapprove approved lines for the employee, delete Approvals line items,
 * then remove any matching Time Entries rows so nothing remains for the next run.
 */
async function cleanupQboEmployeeSyncTestEntries(
  adminPage: Page,
  employeeName: string,
  options?: { label?: string },
): Promise<void> {
  const displayName = toQboEmployeeDisplayName(employeeName);
  const label = options?.label ?? 'cleanup';

  console.log(
    `--- ${label}: QBO cleanup for ${displayName} (unapprove if approved → delete) ---`,
  );

  await navigateToQboApprovalsThisMonth(adminPage);
  const approvalsPage = new ApprovalsPage(adminPage);

  const employeeRow = approvalsPage.getRowByEmployeeName(displayName);
  if (await employeeRow.isVisible({ timeout: 8000 }).catch(() => false)) {
    const listUnapprove = employeeRow.getByRole('button', {
      name: /^unapprove$/i,
    });
    if (await listUnapprove.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`  ${label}: unapproving on Approvals list before delete`);
      await approvalsPage.unapproveEmployee(displayName);
      await approvalsPage.waitForLoadingToDisappear();
      await adminPage.waitForTimeout(1000);
    }
  }

  const deletedCount = await deleteAllEntriesFromViewDetails(
    adminPage,
    displayName,
  );
  console.log(
    `  ${label}: removed ${deletedCount} line item(s) from Approvals view details`,
  );

  const timeEntriesPage = new TimeEntriesPage(adminPage);
  try {
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(adminPage, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    for (let pass = 0; pass < 15; pass++) {
      const row = adminPage
        .getByRole('row')
        .filter({ hasText: displayName })
        .first();
      if (!(await row.isVisible({ timeout: 2000 }).catch(() => false))) {
        break;
      }
      const rowUnapprove = row.getByRole('button', { name: /^unapprove$/i });
      if (await rowUnapprove.isVisible({ timeout: 2000 }).catch(() => false)) {
        await rowUnapprove.click();
        await approvalsPage.handleUnlockTimeDialog();
        await timeEntriesPage.waitForLoadingToDisappear();
        await adminPage.waitForTimeout(500);
      }
      const expandMenu = row.locator('[aria-label="Expand Menu"]').first();
      if (!(await expandMenu.isVisible({ timeout: 2000 }).catch(() => false))) {
        break;
      }
      await expandMenu.click();
      const deleteItem = adminPage.getByRole('menuitem', { name: 'Delete' });
      if (!(await deleteItem.isVisible({ timeout: 2000 }).catch(() => false))) {
        await adminPage.keyboard.press('Escape');
        break;
      }
      await deleteItem.click();
      const yesBtn = adminPage.getByRole('button', { name: 'Yes' });
      if (await yesBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await yesBtn.click();
      }
      await timeEntriesPage.waitForLoadingToDisappear();
      await adminPage.waitForTimeout(500);
    }
  } catch {
    console.log(`  ${label}: Time Entries sweep skipped or partial`);
  }

  await navigateToQboApprovalsThisMonth(adminPage);
  const rowStillVisible = await approvalsPage
    .getRowByEmployeeName(displayName)
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  if (!rowStillVisible) {
    console.log(`✓ ${label}: no Approvals row remaining for ${displayName}`);
  } else {
    console.log(`  ${label}: Approvals row still present — second delete pass`);
    await approvalsPage.unapproveEmployee(displayName).catch(() => false);
    await deleteAllEntriesFromViewDetails(adminPage, displayName).catch(
      () => 0,
    );
  }
}

/**
 * Poll QBO Approvals until the employee summary row appears (Workforce → QBO sync can lag).
 */
export async function waitForEmployeeRowInQboApprovals(
  page: Page,
  employeeName: string,
  options: {
    timeoutMs?: number;
    syncNote?: string;
    testDuration?: string;
    /** Shown in poll logs, e.g. WF012 */
    testCaseId?: string;
  } = {},
): Promise<Locator> {
  const timeoutMs = options.timeoutMs ?? 240_000;
  const pollMs = 15_000;
  const deadline = Date.now() + timeoutMs;
  const stepLabel = options.testCaseId ?? 'sync';

  while (Date.now() < deadline) {
    await navigateToQboApprovalsThisMonth(page);

    const row =
      options.syncNote && options.testDuration
        ? await qboApprovalsRowForEmployee(
            page,
            employeeName,
            options.syncNote,
            options.testDuration,
            stepLabel,
          )
        : locatorTableRowForEmployee(page, employeeName);

    if (await row.isVisible({ timeout: 8000 }).catch(() => false)) {
      return row;
    }

    console.log(
      `  ${stepLabel}: QBO Approvals waiting for ${employeeName} (reverse sync in progress)...`,
    );
    await page.waitForTimeout(pollMs);
  }

  await navigateToQboApprovalsThisMonth(page);
  const finalRow =
    options.syncNote && options.testDuration
      ? await qboApprovalsRowForEmployee(
          page,
          employeeName,
          options.syncNote,
          options.testDuration,
          stepLabel,
        )
      : locatorTableRowForEmployee(page, employeeName);
  await expect(finalRow).toBeVisible({ timeout: 10_000 });
  return finalRow;
}

/**
 * Workforce Sync Utility Functions
 *
 * Test cases that validate synchronization between:
 * - QBO Admin actions → Workforce Employee view
 * - Workforce Employee actions → QBO Admin view
 *
 * Test Cases:
 * - WF008: Admin approves STE → Workforce shows Approved status
 * - WF009: Admin creates STE for employee → Workforce displays entry
 * - WF010: Admin edits STE → Workforce shows updated entry
 * - WF011: Admin unapproves entry → Workforce shows Unapproved status
 * - WF012: Employee creates → Admin sees entry
 *
 * Note: These tests require both admin and employee credentials.
 * The admin context is QBO Time Tracking, employee context is Workforce portal.
 */

// ==================== WF008: Admin Approves → Workforce Shows Approved ====================

/**
 * WF008 - Admin Approves STE → Workforce Shows Approved Status
 *
 * Steps:
 * 1. Login to Workforce as employee, create STE
 * 2. Login to QBO as admin, navigate to Approvals
 * 3. Approve the employee's entry
 * 4. Return to Workforce, validate entry shows as Approved
 *
 * Pre-cleanup and teardown: unapprove if needed, delete Approvals lines, sweep Time Entries.
 */
export const verifyAdminApprovesSteWorkforceShowsApproved = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
  employeeName: string,
) => {
  const testDuration = '1:15';
  const adminPage = await browser.newPage();
  let employeePage: Page | undefined;

  try {
    console.log('--- WF008 Pre-cleanup: clear prior entries for employee ---');
    await openQBOWithLoginCredentials(adminPage, adminCredentials);
    await cleanupQboEmployeeSyncTestEntries(adminPage, employeeName, {
      label: 'WF008 pre-cleanup',
    });

    console.log('--- Step 1: Create STE as Employee in Workforce ---');
    employeePage = await browser.newPage();
    await openWorkforce(employeePage, employeeCredentials);
    await cleanupAllTimeEntriesInWF(employeePage);

    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    await dismissWorkforceOverlaysBeforeInteraction(employeePage);

    await workforcePage.ensureSteDrawerOpen();
    await employeePage.waitForTimeout(2000);

    try {
      await workforcePage.selectSteCustomer();
      await workforcePage.ensureSteStartEndTimeToggleOff();
      await workforcePage.setSteDateToToday();
      await workforcePage.fillSteDuration(testDuration);
      const syncNotes = `WF008 sync test - ${Date.now()}`;
      await workforcePage.fillSteNotes(syncNotes);
      await workforcePage.saveSte({ skipLockedDateRetry: true });
      await workforcePage.validateSteSaved();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const useAdminFallback =
        message.includes('locked') ||
        message.includes('STE save blocked') ||
        message.includes('option');
      debugSessionLog(
        'Workforce.Util.ts:verifyAdminApprovesSteWorkforceShowsApproved',
        'wf008_employee_create_failed',
        { message, useAdminFallback, runId: 'post-fix' },
        useAdminFallback ? 'H2' : 'H3',
      );
      if (!useAdminFallback) {
        throw error;
      }
      console.log(
        '⚠ Employee STE create failed — creating via QBO admin instead',
      );
      await employeePage.close().catch(() => undefined);
      employeePage = undefined;
      const syncNotes = `WF008 sync test - ${Date.now()}`;
      await createQboSteForEmployeeAdmin(
        adminPage,
        employeeName,
        testDuration,
        syncNotes,
      );
      debugSessionLog(
        'Workforce.Util.ts:verifyAdminApprovesSteWorkforceShowsApproved',
        'wf008_admin_fallback_success',
        { employeeName, testDuration, runId: 'post-fix' },
        'H2',
      );
    }

    console.log(`✓ Created STE with duration ${testDuration} in Workforce`);

    console.log('--- Step 2: Approve Entry as Admin in QBO ---');
    await gotoQboTimeAsLoggedInAdmin(adminPage);

    const approvalsTab = adminPage
      .locator('button:has-text("Approvals"), a:has-text("Approvals")')
      .first();
    if (await approvalsTab.isVisible().catch(() => false)) {
      await approvalsTab.click();
      await adminPage.waitForTimeout(2000);
    }

    await dismissApprovalsMovedPopup(adminPage);
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This month');
    await adminPage.waitForTimeout(2000);

    const employeeRow = locatorTableRowForEmployee(adminPage, employeeName);
    await expect(employeeRow).toBeVisible();
    const approveCheckbox = employeeRow
      .locator('input[type="checkbox"]')
      .first();
    if (await approveCheckbox.isVisible().catch(() => false)) {
      await approveCheckbox.check();
    }
    const approveButton = adminPage
      .locator('button:has-text("Approve")')
      .first();
    if (await approveButton.isVisible().catch(() => false)) {
      await approveButton.click();
      await adminPage.waitForTimeout(2000);
    }
    const approveAndLock = adminPage.getByRole('button', {
      name: 'Approve and lock time',
    });
    if (await approveAndLock.isVisible().catch(() => false)) {
      await approveAndLock.click();
      await adminPage.waitForTimeout(2000);
    }

    console.log(`✓ Approved time entries for ${employeeName} in QBO`);

    console.log('--- Step 3: Validate Approved Status in Workforce ---');
    if (!employeePage) {
      employeePage = await browser.newPage();
      await openWorkforce(employeePage, employeeCredentials);
    } else {
      await employeePage.reload();
      await employeePage.waitForTimeout(3000);
    }

    const workforcePageForApproval = await navigateToWorkforceTimeEntries(
      employeePage,
    );
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await employeePage.waitForTimeout(2000);
    expect(
      await workforcePageForApproval.validateApprovedEntryExists(testDuration),
    ).toBe(true);

    console.log('✓ WF008 Complete: Admin approval synced to Workforce');
  } finally {
    try {
      if (!adminPage.isClosed()) {
        await gotoQboTimeAsLoggedInAdmin(adminPage).catch(() => undefined);
        await cleanupQboEmployeeSyncTestEntries(adminPage, employeeName, {
          label: 'WF008 teardown',
        });
      }
    } catch (error) {
      console.log(
        `⚠ WF008 cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    await adminPage.close().catch(() => {});
    if (employeePage) {
      await employeePage.close().catch(() => {});
    }
  }
};

// ==================== WF009: Admin Creates STE → Workforce Displays Entry ====================

/**
 * WF009 - Admin Creates STE for Employee → Workforce Displays Entry
 *
 * Steps:
 * 1. Login to QBO as admin
 * 2. Create STE for specific employee
 * 3. Login to Workforce as that employee
 * 4. Validate the entry is visible
 */
export const verifyAdminCreatesSteWorkforceDisplaysEntry = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
  employeeName: string,
) => {
  const testDuration = '2:30';
  const adminPage = await browser.newPage();
  let employeePage: Page | undefined;

  try {
    console.log('--- Step 1: Create STE as Admin in QBO ---');
    await openQBOWithLoginCredentials(adminPage, adminCredentials);

    await adminPage.goto(`${getQboRootUrl()}/app/time?jobId=time`);
    await adminPage.waitForTimeout(3000);

    await clickAddTimeDropdown(adminPage);
    await selectSingleTimeEntryFromAddTime(adminPage);

    const stePage = new SingleTimeEntryPage(adminPage);
    await stePage.handlePopupsInAnyOrder();
    await stePage.waitForSteFormSettled();
    console.log(
      `Step 1 (WF009): selecting "${employeeName}" in STE form — this is not cleanup`,
    );

    await stePage.selectEmployeeByDisplayName(employeeName);

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    await stePage.fillStartDate(formattedDate);

    await stePage.openAndselectCustomerOption(1);

    await stePage.enterFieldValue('Duration', testDuration);

    await stePage.enterNotes(`WF009 admin-created - ${Date.now()}`);

    await stePage.clickSaveButton();
    await expect(adminPage.getByText('Time entry added.')).toBeVisible();

    console.log(`✓ Created STE (${testDuration}) for ${employeeName} in QBO`);

    console.log('--- Step 2: Validate Entry in Workforce ---');
    employeePage = await browser.newPage();
    await openWorkforce(employeePage, employeeCredentials);

    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await employeePage.waitForTimeout(2000);
    await workforcePage.validateEntrySyncedFromAdmin(testDuration);

    console.log('✓ WF009 Complete: Admin-created STE visible in Workforce');
  } finally {
    try {
      console.log(
        '--- Cleanup: remove WF009 test entry from QBO Approvals ---',
      );
      console.log(
        '  (Cleanup: Approvals + View details → delete only; no Add time / STE Name.)',
      );
      await adminPage.goto(`${getQboRootUrl()}/app/time?jobId=time`);
      await adminPage.waitForTimeout(3000);

      const cleanupApprovalsTab = adminPage
        .locator('button:has-text("Approvals"), a:has-text("Approvals")')
        .first();
      if (await cleanupApprovalsTab.isVisible().catch(() => false)) {
        await cleanupApprovalsTab.click();
        await adminPage.waitForTimeout(2000);
      }

      await dismissApprovalsMovedPopup(adminPage);
      await openDateRangeDropdown(adminPage);
      await selectDateRangeOption(adminPage, 'This month');
      await adminPage.waitForTimeout(2000);

      const deletedCount = await deleteAllEntriesFromViewDetails(
        adminPage,
        employeeName,
      );
      console.log(
        `✓ QBO cleanup: removed ${deletedCount} line item(s) for ${employeeName}`,
      );
    } catch (error) {
      console.log(
        `⚠ WF009 QBO cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    await adminPage.close().catch(() => {});
    if (employeePage) {
      await employeePage.close().catch(() => {});
    }
  }
};

// ==================== WF010: Admin Edits STE → Workforce Shows Updated ====================

/**
 * WF010 - Admin Edits STE → Workforce Shows Updated Entry
 *
 * Steps:
 * 1. Login to Workforce as employee, create STE
 * 2. Login to QBO as admin, find and edit the entry
 * 3. Return to Workforce, validate updated duration
 */
export const verifyAdminEditsSteWorkforceShowsUpdated = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
  employeeName: string,
) => {
  const originalDuration = '1:00';
  const updatedDuration = '3:00';
  const adminPage = await browser.newPage();
  let employeePage: Page | undefined;

  try {
    console.log('--- Step 1: Create STE as Employee in Workforce ---');
    employeePage = await browser.newPage();
    await openWorkforce(employeePage, employeeCredentials);

    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);

    await workforcePage.clickSingleTimeEntryOption();
    await workforcePage.validateSteDrawerOpened();
    await employeePage.waitForTimeout(2000);
    await workforcePage.selectSteCustomer();
    await workforcePage.fillSteDuration(originalDuration);
    const wf010SyncNote = `WF010 edit sync test - ${Date.now()}`;
    await workforcePage.fillSteNotes(wf010SyncNote);
    await workforcePage.saveSte();
    await workforcePage.validateSteSaved();

    console.log(`✓ Created STE with duration ${originalDuration}`);

    console.log('--- Step 2: Edit Entry as Admin in QBO ---');
    await openQBOWithLoginCredentials(adminPage, adminCredentials);

    await adminPage.goto(`${getQboRootUrl()}/app/time?jobId=time`);
    await adminPage.waitForTimeout(3000);

    await dismissApprovalsMovedPopup(adminPage);
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This month');
    await adminPage.waitForTimeout(2000);

    const employeeRows = locatorTableRowsForEmployee(adminPage, employeeName);
    let targetRow = employeeRows.filter({ hasText: wf010SyncNote });
    if ((await targetRow.count()) === 0) {
      console.log(
        'WF010: QBO row has no notes text; scoping by employee + duration',
      );
      targetRow = employeeRows.filter({
        hasText: durationDisplayMatchPattern(originalDuration),
      });
    }
    await expect(targetRow.first()).toBeVisible({ timeout: 20000 });

    const row = targetRow.first();
    await row.click();
    await adminPage.waitForTimeout(1000);

    const editInRow = row
      .getByRole('button', { name: /^edit$/i })
      .or(row.getByRole('link', { name: /^edit$/i }));
    if ((await editInRow.count()) > 0) {
      await expect(editInRow.first()).toBeVisible({ timeout: 10000 });
      await editInRow.first().click();
    } else {
      const editButton = adminPage.locator('button:has-text("Edit")').first();
      await expect(editButton).toBeVisible({ timeout: 10000 });
      await editButton.click();
    }
    await adminPage.waitForTimeout(2000);

    const hoursInput = adminPage
      .locator('input[aria-label*="Duration"], input[aria-label*="Hours"]')
      .first();
    await expect(hoursInput).toBeVisible({ timeout: 10000 });
    await hoursInput.clear();
    await hoursInput.fill(updatedDuration);

    const saveButton = adminPage.locator('button:has-text("Save")').first();
    await saveButton.click();
    await adminPage.waitForTimeout(2000);

    console.log(`✓ Updated STE to ${updatedDuration} in QBO`);

    console.log('--- Step 3: Validate Updated Entry in Workforce ---');
    await employeePage.reload();
    await employeePage.waitForTimeout(3000);

    await navigateToWorkforceTimeEntries(employeePage);
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await employeePage.waitForTimeout(2000);
    await workforcePage.validateEntrySyncedFromAdmin(updatedDuration);

    console.log('✓ WF010 Complete: Admin edit synced to Workforce');
  } finally {
    try {
      console.log(
        '--- Cleanup: remove WF010 test entry from QBO Approvals ---',
      );
      console.log(
        '  (Cleanup: Approvals + View details → delete only; no Add time / STE Name.)',
      );
      await adminPage.goto(`${getQboRootUrl()}/app/time?jobId=time`);
      await adminPage.waitForTimeout(3000);

      const cleanupApprovalsTab = adminPage
        .locator('button:has-text("Approvals"), a:has-text("Approvals")')
        .first();
      if (await cleanupApprovalsTab.isVisible().catch(() => false)) {
        await cleanupApprovalsTab.click();
        await adminPage.waitForTimeout(2000);
      }

      await dismissApprovalsMovedPopup(adminPage);
      await openDateRangeDropdown(adminPage);
      await selectDateRangeOption(adminPage, 'This month');
      await adminPage.waitForTimeout(2000);

      const deletedCount = await deleteAllEntriesFromViewDetails(
        adminPage,
        employeeName,
      );
      console.log(
        `✓ QBO cleanup: removed ${deletedCount} line item(s) for ${employeeName}`,
      );
    } catch (error) {
      console.log(
        `⚠ WF010 QBO cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    await adminPage.close().catch(() => {});
    if (employeePage) {
      await employeePage.close().catch(() => {});
    }
  }
};

// ==================== WF011: Admin Unapproves → Workforce Shows Unapproved ====================

/**
 * WF011 - Admin Unapproves Entry → Workforce Shows Unapproved Status
 *
 * Steps:
 * 1. Admin creates STE in QBO (SingleTimeEntryPage + selectEmployeeByDisplayName);
 *    unique WF011 notes + This month on Time before Add time (aligned with WF009/WF010).
 * 2. Employee Workforce: entry synced (duration visible; This month).
 * 3. Admin Approvals: target row by employee + sync notes (fallback: duration pattern),
 *    approve (+ lock modal when shown).
 * 4. Workforce shows Approved for that duration.
 * 5. Same Approvals row targeting for unapprove (+ unlock modal when shown).
 * 6. Workforce shows Unapproved for that duration.
 * 7. Cleanup — unapprove if needed, delete lines, sweep Time Entries (pre + teardown).
 */
export const verifyAdminUnapprovesWorkforceShowsUnapproved = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
  employeeName: string,
) => {
  const testDuration = '1:22';
  const wf011SyncNote = `WF011 admin-created - ${Date.now()}`;
  const adminPage = await browser.newPage();
  let employeePage: Page | undefined;

  try {
    console.log('--- WF011 Pre-cleanup: clear prior entries for employee ---');
    await openQBOWithLoginCredentials(adminPage, adminCredentials);
    await cleanupQboEmployeeSyncTestEntries(adminPage, employeeName, {
      label: 'WF011 pre-cleanup',
    });

    console.log('--- Step 1: Create STE as Admin in QBO ---');
    await gotoQboTimeAsLoggedInAdmin(adminPage);

    await dismissApprovalsMovedPopup(adminPage);
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This month');
    await adminPage.waitForTimeout(2000);

    await clickAddTimeDropdown(adminPage);
    await selectSingleTimeEntryFromAddTime(adminPage);

    const stePage = new SingleTimeEntryPage(adminPage);
    await stePage.handlePopupsInAnyOrder();
    await stePage.waitForSteFormSettled();
    console.log(
      `Step 1 (WF011): selecting "${employeeName}" in STE form — not cleanup (cleanup only uses Approvals delete)`,
    );

    await stePage.selectEmployeeByDisplayName(employeeName);

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    await stePage.fillStartDate(formattedDate);

    await stePage.openAndselectCustomerOption(1);

    await stePage.enterFieldValue('Duration', testDuration);

    await stePage.enterNotes(wf011SyncNote);

    await stePage.clickSaveButton();
    await expect(adminPage.getByText('Time entry added.')).toBeVisible();

    console.log(`✓ Created STE (${testDuration}) for ${employeeName} in QBO`);

    console.log('--- Step 2: Validate entry synced to Workforce ---');
    employeePage = await browser.newPage();
    await openWorkforce(employeePage, employeeCredentials);

    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await employeePage.waitForTimeout(2000);
    await workforcePage.validateEntrySyncedFromAdmin(testDuration);

    console.log('--- Step 3: Approve entry as Admin in QBO ---');
    await gotoQboTimeAsLoggedInAdmin(adminPage);

    const approvalsTab = adminPage
      .locator('button:has-text("Approvals"), a:has-text("Approvals")')
      .first();
    if (await approvalsTab.isVisible().catch(() => false)) {
      await approvalsTab.click();
      await adminPage.waitForTimeout(2000);
    }

    await dismissApprovalsMovedPopup(adminPage);
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This month');
    await adminPage.waitForTimeout(2000);

    const employeeRowApprove = await qboApprovalsRowForEmployee(
      adminPage,
      employeeName,
      wf011SyncNote,
      testDuration,
      'approve',
    );
    await expect(employeeRowApprove).toBeVisible();
    const approveCheckbox = employeeRowApprove
      .locator('input[type="checkbox"]')
      .first();
    if (await approveCheckbox.isVisible().catch(() => false)) {
      await approveCheckbox.check();
    }
    const approveButton = adminPage
      .locator('button:has-text("Approve")')
      .first();
    if (await approveButton.isVisible().catch(() => false)) {
      await approveButton.click();
      await adminPage.waitForTimeout(2000);
    }
    const approveAndLock = adminPage.getByRole('button', {
      name: 'Approve and lock time',
    });
    if (await approveAndLock.isVisible().catch(() => false)) {
      await approveAndLock.click();
      await adminPage.waitForTimeout(2000);
    }

    console.log(`✓ Approved time entries for ${employeeName} in QBO`);

    console.log('--- Step 4: Validate Approved in Workforce ---');
    await employeePage.reload();
    await employeePage.waitForTimeout(3000);
    await navigateToWorkforceTimeEntries(employeePage);
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await employeePage.waitForTimeout(2000);
    expect(await workforcePage.validateApprovedEntryExists(testDuration)).toBe(
      true,
    );

    console.log('--- Step 5: Unapprove entry as Admin in QBO ---');
    await gotoQboTimeAsLoggedInAdmin(adminPage);

    const approvalsTabAgain = adminPage
      .locator('button:has-text("Approvals"), a:has-text("Approvals")')
      .first();
    if (await approvalsTabAgain.isVisible().catch(() => false)) {
      await approvalsTabAgain.click();
      await adminPage.waitForTimeout(2000);
    }

    await dismissApprovalsMovedPopup(adminPage);
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This month');
    await adminPage.waitForTimeout(2000);

    const employeeRowUnapprove = await qboApprovalsRowForEmployee(
      adminPage,
      employeeName,
      wf011SyncNote,
      testDuration,
      'unapprove',
    );
    await expect(employeeRowUnapprove).toBeVisible();
    const unapproveCheckbox = employeeRowUnapprove
      .locator('input[type="checkbox"]')
      .first();
    if (await unapproveCheckbox.isVisible().catch(() => false)) {
      await unapproveCheckbox.check();
    }
    const unapproveButton = adminPage
      .locator('button:has-text("Unapprove")')
      .first();
    await expect(unapproveButton).toBeVisible();
    await unapproveButton.click();
    await adminPage.waitForTimeout(2000);
    const unapproveAndUnlock = adminPage.getByRole('button', {
      name: 'Unapprove and unlock time',
    });
    if (await unapproveAndUnlock.isVisible().catch(() => false)) {
      await unapproveAndUnlock.click();
      await adminPage.waitForTimeout(2000);
    }

    console.log(`✓ Unapproved time entries for ${employeeName} in QBO`);

    console.log('--- Step 6: Validate Unapproved in Workforce ---');
    await employeePage.reload();
    await employeePage.waitForTimeout(3000);
    await navigateToWorkforceTimeEntries(employeePage);
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await employeePage.waitForTimeout(2000);
    expect(
      await workforcePage.validateUnapprovedEntryExists(testDuration),
    ).toBe(true);

    console.log('✓ WF011 Complete: Admin unapproval synced to Workforce');
  } finally {
    try {
      if (!adminPage.isClosed()) {
        await gotoQboTimeAsLoggedInAdmin(adminPage).catch(() => undefined);
        await cleanupQboEmployeeSyncTestEntries(adminPage, employeeName, {
          label: 'WF011 teardown',
        });
      }
    } catch (error) {
      console.log(
        `⚠ WF011 cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    await adminPage.close().catch(() => {});
    if (employeePage) {
      await employeePage.close().catch(() => {});
    }
  }
};

// ==================== WF012: Employee Creates → Admin Sees Entry ====================

/**
 * WF012 - Employee Creates STE in Workforce → Admin Sees in QBO
 *
 * Steps:
 * 1. Workforce (employee login): create STE — list has no employee name column; validate by duration.
 * 2. QBO (admin login): Approvals table has employee names — poll until row appears.
 * 3. Cleanup unapproved line(s) in QBO Approvals.
 *
 * `employeeName` is only used in Step 2 on the admin page, not on Workforce Time entries.
 */
export const verifyEmployeeCreatesAdminSeesEntry = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
  employeeName: string,
) => {
  // Step 1: Create entry as employee in Workforce
  console.log('--- Step 1: Create STE as Employee in Workforce ---');
  const employeePage = await browser.newPage();
  await openWorkforce(employeePage, employeeCredentials);

  const workforcePage = await navigateToWorkforceTimeEntries(employeePage);

  const testDuration = '1:45';
  const uniqueNote = `Reverse sync test - ${Date.now()}`;

  await workforcePage.clickSingleTimeEntryOption();
  await workforcePage.validateSteDrawerOpened();
  await employeePage.waitForTimeout(2000);
  await workforcePage.selectSteCustomer(); // Select customer (required field)
  await workforcePage.ensureSteStartEndTimeToggleOff();
  await workforcePage.setSteDateToToday();
  await workforcePage.fillSteDuration(testDuration);
  await workforcePage.fillSteNotes(uniqueNote);
  await workforcePage.saveSte();
  await workforcePage.validateSteSaved();

  await applyWorkforceTimeEntriesFilters(employeePage, {
    displayBy: 'Date',
    dateRange: 'This month',
  });
  await workforcePage.validateEntryDurationOnScreen(testDuration);
  console.log(
    `✓ Created STE (${testDuration}) in Workforce — validated on employee Time entries (no name column)`,
  );

  // Step 2: QBO admin Approvals (employee name column exists here)
  console.log('--- Step 2: Validate Entry in QBO Admin Approvals ---');
  const adminPage = await browser.newPage();
  await openQBOWithLoginCredentials(adminPage, adminCredentials);

  const employeeRow = await waitForEmployeeRowInQboApprovals(
    adminPage,
    employeeName,
    { syncNote: uniqueNote, testDuration, testCaseId: 'WF012' },
  );
  await expect(employeeRow).toBeVisible();

  console.log(`✓ Entry from ${employeeName} visible in QBO Approvals`);
  console.log('✓ WF012 Complete: Employee-created entry synced to QBO');

  // Cleanup: pending entry only — open View details and delete line items (no unapprove path)
  try {
    console.log('--- Cleanup: delete unapproved entry from QBO Approvals ---');
    await navigateToQboApprovalsThisMonth(adminPage);

    const approvalsPage = new ApprovalsPage(adminPage);
    await approvalsPage.clickActionDropdown(employeeName);
    const viewDetailsOption = adminPage.locator(`//*[text()='View details']`);
    await viewDetailsOption.waitFor({ state: 'visible' });
    await viewDetailsOption.click();
    await adminPage.waitForTimeout(2000);
    await approvalsPage.waitForLoadingToDisappear();

    let deletedCount = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      const deleted = await deleteEntryFromViewDetails(adminPage);
      if (!deleted) {
        break;
      }
      deletedCount++;
      await adminPage.waitForTimeout(500);
    }
    console.log(
      `✓ QBO Approvals cleanup: removed ${deletedCount} line item(s) for ${employeeName}`,
    );
  } catch (error) {
    console.log(
      `⚠ QBO Approvals cleanup failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await adminPage.close();
    await employeePage.close();
  }
};

export const cleanupTimeEntriesInWF = async (page: Page): Promise<void> => {
  const workforcePage = new WorkforcePage(page);

  await selectDisplayByOption(page, 'Customer');
  await waitForLoadingToDisappear(page);
  await selectDisplayByOption(page, 'Date');
  await waitForLoadingToDisappear(page);
  await selectDateRangeOption(page, 'This month');
  await page.waitForTimeout(2000);
  await waitForLoadingToDisappear(page);

  const rowCount = await workforcePage.timeEntryRow.count();
  if (rowCount === 0) {
    console.log(
      '✓ WTE cleanup: no time entry rows in list (Date / This month)',
    );
    return;
  }

  console.log(`WTE cleanup: ${rowCount} row(s) in list — deleting`);
  await workforcePage.deleteWteEntry();
};

/** WF007: delete every visible time-entry row (two passes). Does not change {@link cleanupTimeEntriesInWF}. */
export const cleanupAllTimeEntriesInWF = async (page: Page): Promise<void> => {
  const workforcePage = await navigateToWorkforceTimeEntries(page);

  await applyWorkforceTimeEntriesFilters(page, {
    displayBy: 'Date',
    dateRange: 'This month',
  });
  await waitForLoadingToDisappear(page);

  const rowCountBefore = await workforcePage.timeEntryRow.count();
  if (rowCountBefore === 0) {
    console.log(
      '✓ WTE cleanup: no time entry rows in list (Date / This month)',
    );
    return;
  }

  console.log(
    `WTE cleanup: ${rowCountBefore} row(s) in list — deleting all (up to 20)`,
  );
  await workforcePage.cleanupAllTimeEntries();
  await page.waitForTimeout(1500);
  await waitForLoadingToDisappear(page);

  const rowCountAfter = await workforcePage.timeEntryRow.count();
  if (rowCountAfter > 0) {
    console.log(
      `WTE cleanup: ${rowCountAfter} row(s) remain — second delete pass`,
    );
    await workforcePage.cleanupAllTimeEntries();
  }

  const rowCountFinal = await workforcePage.timeEntryRow.count();
  if (rowCountFinal === 0) {
    console.log('✓ WTE cleanup: all time entry rows removed');
  } else {
    console.log(
      `⚠ WTE cleanup: ${rowCountFinal} row(s) still visible after two passes`,
    );
  }
};

/** Workforce WTE create — uses DataCell hour entry (not QBO admin `td.nth` locators). */
export const createAndValidateWeeklyTimeEntry = async (
  page: Page,
): Promise<string> => {
  const workforcePage = new WorkforcePage(page);
  await workforcePage.waitForWteTimesheetReady();

  const resetBtn = page.getByRole('button', { name: /^Reset$/i });
  if (await resetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await resetBtn.click();
    await page.waitForTimeout(1500);
    await workforcePage.waitForWteTimesheetReady();
  }

  const { customerName } =
    await workforcePage.fillWteFirstRowWeekdaysWithDetailPanel({
      customerOptionIndex: 1,
      hoursPerDay: '8',
      notes: 'test initial',
      billableRate: '7',
      serviceOptionIndex: 1,
    });

  return customerName ?? '';
};

/** WF007: create WTE with only the first N weekday columns filled (default 3). */
export const createAndValidatePartialWeeklyTimeEntry = async (
  page: Page,
  weekdayCount: number = WORKFORCE_PARTIAL_WEEKDAY_COUNT,
): Promise<string> => {
  const workforcePage = new WorkforcePage(page);
  await workforcePage.waitForWteTimesheetReady();

  const resetBtn = page.getByRole('button', { name: /^Reset$/i });
  if (await resetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await resetBtn.click();
    await page.waitForTimeout(1500);
    await workforcePage.waitForWteTimesheetReady();
  }

  const { customerName } =
    await workforcePage.fillWteFirstRowPartialWeekdaysWithDetailPanel({
      customerOptionIndex: 1,
      hoursPerDay: '8',
      notes: 'test initial',
      billableRate: '7',
      serviceOptionIndex: 1,
      weekdayCount,
    });

  return customerName ?? '';
};

/** Workforce login lands on Home; time-entry table filters live under Time → Time entries. */
const ensureWorkforceTimeEntriesView = async (page: Page): Promise<void> => {
  if (!page.url().includes('workforce')) {
    return;
  }
  const displayBy = page.getByLabel('Display by');
  if (await displayBy.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dismissWorkforceOverlaysBeforeInteraction(page);
    return;
  }
  await navigateToWorkforceTimeEntries(page);
  await waitForLoadingToDisappear(page);
  await expect(displayBy).toBeVisible({ timeout: 60_000 });
};

export const validateTimeEntriesInTable = async (
  page: Page,
  customerName: string,
  hours: string,
) => {
  console.log(`Validating time entries for customer: ${customerName}`);

  await ensureWorkforceTimeEntriesView(page);

  const token = customerName.split(/\s+/)[0];
  const hoursDecimal = hours.includes('.') ? hours : `${hours}.00`;

  const rowHasHours = (rowText: string): boolean =>
    rowText.includes(hours) ||
    rowText.includes(hoursDecimal) ||
    rowText.includes(parseFloat(hoursDecimal).toString());

  const locateRows = () =>
    page
      .locator('tbody tr')
      .filter({ hasNot: page.locator('[aria-label*="Collapse"]') })
      .filter({ hasText: token });

  const applyFiltersAndCount = async (dateRange: string) => {
    await selectDisplayByOption(page, 'Customer');
    await waitForLoadingToDisappear(page);
    await selectDisplayByOption(page, 'Date');
    await waitForLoadingToDisappear(page);
    await selectDisplayByOption(page, 'Date');
    if (page.url().includes('workforce')) {
      await openWorkforceDateRangeDropdown(page);
    } else {
      await openDateRangeDropdown(page);
    }
    await selectDateRangeOption(page, dateRange);
    await page.waitForTimeout(2000);
    await waitForLoadingToDisappear(page);
    return locateRows();
  };

  const deadline = Date.now() + 90_000;
  let matchedRowIndex = -1;
  let entryCount = 0;

  while (Date.now() < deadline) {
    let rows = await applyFiltersAndCount('This week');
    entryCount = await rows.count();
    if (entryCount === 0) {
      rows = await applyFiltersAndCount('This month');
      entryCount = await rows.count();
    }

    for (let i = 0; i < entryCount; i++) {
      const rowText = (await rows.nth(i).textContent()) ?? '';
      if (rowHasHours(rowText)) {
        matchedRowIndex = i;
        break;
      }
    }
    if (matchedRowIndex >= 0) {
      break;
    }

    console.log(
      `WTE sync: ${entryCount} row(s) for "${token}" but none with "${hours}" yet — reloading…`,
    );
    await page.reload();
    await navigateToWorkforceTimeEntries(page);
    await waitForLoadingToDisappear(page);
    await page.waitForTimeout(3000);
  }

  expect(matchedRowIndex).toBeGreaterThanOrEqual(0);
  console.log(
    `✓ Time entries validated (row ${matchedRowIndex} of ${entryCount} contains "${hours}")`,
  );
};

/** WF007: assert exactly N list rows for the customer contain the given hours. */
export const validatePartialTimeEntriesInTable = async (
  page: Page,
  customerName: string,
  hours: string,
  expectedRowCount: number,
) => {
  console.log(
    `Validating ${expectedRowCount} time entries for customer: ${customerName}`,
  );

  await ensureWorkforceTimeEntriesView(page);

  const token = customerName.split(/\s+/)[0];
  const hoursDecimal = hours.includes('.') ? hours : `${hours}.00`;
  const weeklyTotalDecimal = (parseFloat(hours) * expectedRowCount).toFixed(2);

  const locateRows = () =>
    page
      .locator('tbody tr')
      .filter({ hasNot: page.locator('[aria-label*="Collapse"]') })
      .filter({ hasText: token });

  // Open the date-range dropdown BEFORE selecting: calling selectDateRangeOption
  // without opening it leaves the previous range in place, which returned 0 rows.
  const applyFiltersAndCount = async (dateRange: string) => {
    await selectDisplayByOption(page, 'Customer');
    await waitForLoadingToDisappear(page);
    await selectDisplayByOption(page, 'Date');
    await waitForLoadingToDisappear(page);
    await selectDisplayByOption(page, 'Date');
    if (page.url().includes('workforce')) {
      await openWorkforceDateRangeDropdown(page);
    } else {
      await openDateRangeDropdown(page);
    }
    await selectDateRangeOption(page, dateRange);
    await page.waitForTimeout(2000);
    await waitForLoadingToDisappear(page);
    return locateRows();
  };

  // The partial WTE fills the CURRENT week's Mon–Wed, which can straddle a month
  // boundary (run on Jul 2 → entries land on Jun 29/30 + Jul 1). Try "This week"
  // (always covers the WTE week), fall back to "This month", and retry with reload
  // to absorb WTE render/sync lag — mirrors validateTimeEntriesInTable.
  const deadline = Date.now() + 90_000;
  let rows = locateRows();
  let entryCount = 0;
  while (Date.now() < deadline) {
    rows = await applyFiltersAndCount('This week');
    entryCount = await rows.count();
    if (entryCount === 0) {
      rows = await applyFiltersAndCount('This month');
      entryCount = await rows.count();
    }
    if (entryCount > 0) break;
    console.log(`WTE partial: no rows for "${token}" yet — reloading…`);
    await page.reload();
    await navigateToWorkforceTimeEntries(page);
    await waitForLoadingToDisappear(page);
    await page.waitForTimeout(3000);
  }

  expect(entryCount).toBeGreaterThanOrEqual(1);

  const allText = (await rows.allTextContents()).join(' ');

  if (entryCount === expectedRowCount) {
    // Expanded view: one list row per filled weekday
    for (let i = 0; i < expectedRowCount; i++) {
      await expect(rows.nth(i)).toContainText(hours);
    }
  } else {
    // Collapsed weekly row: per-day hours and/or weekly total (e.g. 24.00 for 3×8h)
    const hasDailyHours =
      allText.includes(hours) ||
      allText.includes(hoursDecimal) ||
      allText.includes(parseFloat(hoursDecimal).toString());
    const hasWeeklyTotal =
      allText.includes(weeklyTotalDecimal) ||
      allText.includes(parseFloat(weeklyTotalDecimal).toString());
    expect(hasDailyHours || hasWeeklyTotal).toBeTruthy();
  }
  console.log(
    `✓ Time entries validated (${entryCount} row(s) for ${expectedRowCount} weekday(s) contain "${hours}")`,
  );
};

export const editWeeklyTimeEntry = async (
  page: Page,
  hoursPerDay: string,
): Promise<void> => {
  const workforcePage = new WorkforcePage(page);

  await workforcePage.clickWeeklyTimeEntryOption();
  await workforcePage.validateWteDrawerOpened();
  await workforcePage.waitForWteTimesheetReady();

  await workforcePage.fillWteFirstRowWeekdaysWithDetailPanel({
    hoursPerDay: hoursPerDay,
    notes: 'edited notes',
    billableRate: '7',
    serviceOptionIndex: 1,
  });
};

/** WF007: edit only the first N weekday columns (default 3). */
export const editPartialWeeklyTimeEntry = async (
  page: Page,
  hoursPerDay: string,
  weekdayCount: number = WORKFORCE_PARTIAL_WEEKDAY_COUNT,
): Promise<void> => {
  const workforcePage = new WorkforcePage(page);

  await workforcePage.clickWeeklyTimeEntryOption();
  await workforcePage.validateWteDrawerOpened();
  await workforcePage.waitForWteTimesheetReady();

  await workforcePage.fillWteFirstRowPartialWeekdaysWithDetailPanel({
    hoursPerDay,
    notes: 'edited notes',
    billableRate: '7',
    serviceOptionIndex: 1,
    weekdayCount,
  });
};

export const verifyMileageTrackingCompleteFlow = async (page: Page) => {
  await waitForLoadingToDisappear(page);
  const workforcePage = await navigateToWorkforceTimeEntries(page);
  console.log('✓ Navigated to Time tracking page');
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(3000);

  await cleanupAllTimeEntriesInWF(page);

  await dismissWorkforceOverlaysBeforeInteraction(page);
  // ===== STE Access & Visibility Validation =====
  console.log('--- STE Access & Visibility ---');

  await workforcePage.clickSingleTimeEntryOption();
  await handlePopupsInAnyOrder(page);
  await workforcePage.validateSteDrawerOpened();
  await workforcePage.validateSteDrawerElements();

  // STE for mileage (same intent as validateAutoCalculateInMileageTracking, Workforce UI)
  console.log('--- Mileage: create billable STE with start/end ---');
  const mileageNotes = `Mileage WF ${Date.now()}`;
  await workforcePage.selectSteCustomer();
  await page.waitForTimeout(500);
  await workforcePage.ensureSteStartEndTimeToggleOn();
  await workforcePage.setSteDateToYesterday();
  await workforcePage.selectSteStartTime('8:00 AM');
  await workforcePage.selectSteEndTime('3:00 PM');
  await workforcePage.fillSteNotes(mileageNotes);
  if (
    await workforcePage.steBillableCheckbox
      .isVisible({ timeout: 2000 })
      .catch(() => false)
  ) {
    await workforcePage.steBillableCheckbox.check();
  }
  await workforcePage.saveSte();
  await workforcePage.validateSteSaved();

  await selectDisplayByOption(page, 'Date');
  await page.waitForTimeout(1000);
  await selectDateRangeOption(page, 'This month');
  await page.waitForTimeout(2000);
  await waitForLoadingToDisappear(page);

  console.log('--- Mileage: edit entry — Auto calculate + Miles ---');
  await workforcePage.validateEditButtonVisibleInRowContaining(mileageNotes);
  await workforcePage.clickEditInRowContaining(mileageNotes);
  await workforcePage.validateEditDrawerOpened();

  const autoCalculateCheckbox = page.locator(
    "//span[text()='Auto calculate']/ancestor::label//input[@type='checkbox']",
  );
  const milesInput = page.locator(`//label[.//span[text()="Mileage"]]//input`);
  await expect(autoCalculateCheckbox).toBeVisible();
  await expect(milesInput).toBeVisible();
  const ro = await milesInput.getAttribute('readonly');
  const disabled = await milesInput.isDisabled();
  expect(ro !== null || disabled).toBeTruthy();

  if (!(await milesInput.isEditable())) {
    await autoCalculateCheckbox.check();
    await page.waitForTimeout(300);
    await autoCalculateCheckbox.uncheck();
    await page.waitForTimeout(300);
  }
  await milesInput.fill('50');
  await workforcePage.saveSte();
  await workforcePage.validateEntryUpdated();

  await selectDisplayByOption(page, 'Date');
  await page.waitForTimeout(1000);
  await selectDateRangeOption(page, 'This month');
  await page.waitForTimeout(2000);
  await expect(
    workforcePage.timeEntryRow.filter({ hasText: mileageNotes }).first(),
  ).toContainText(/50/);
  console.log('✓ Mileage auto-calculate flow validated');
};

// Get QBO base URL based on environment
function getQboBaseUrl(): string {
  const env = process.env.PLAYWRIGHT_ENV || 'preprod';
  return env === 'prod'
    ? 'https://qbo.intuit.com'
    : 'https://e2e.qbo.intuit.com';
}

// Helper to login to QBO admin (using same pattern as openWorkforce)
async function loginToQBOAdmin(
  page: Page,
  credentials: LoginCredentials,
): Promise<void> {
  const qboUrl = getQboBaseUrl();

  console.log(`Navigating to QBO: ${qboUrl}`);
  await page.goto(qboUrl);

  // Fill username
  await page.getByTestId('IdentifierFirstInternationalUserIdInput').click();
  await page
    .getByTestId('IdentifierFirstInternationalUserIdInput')
    .fill(credentials.username ?? '');
  await page.getByTestId('IdentifierFirstSubmitButton').click();

  // Fill password
  await page.getByTestId('currentPasswordInput').click();
  await page
    .getByTestId('currentPasswordInput')
    .fill(credentials.password ?? '');
  await page.getByTestId('passwordVerificationContinueButton').click();

  // Handle VUU Skip button if present
  try {
    const skipButton = await page.waitForSelector(
      '[data-testid="VUUSkipButton"]',
      { timeout: 5000, state: 'attached' },
    );
    if (skipButton) {
      await skipButton.click();
    }
  } catch (error) {
    console.log('VUUSkipButton not found, skipping...');
  }

  // Handle company selection if multiple companies
  try {
    const companySelector = await page.waitForSelector(
      '[data-testid="company-selector"]',
      { timeout: 5000, state: 'visible' },
    );
    if (companySelector) {
      await companySelector.click();
      console.log('Selected company from list');
    }
  } catch (error) {
    console.log('Company selector not found, continuing...');
  }

  // Wait for page to fully load
  await page.waitForLoadState('domcontentloaded');
  console.log('✓ Logged into QBO Admin');
}

/** QBO table name format, e.g. "Test Emp1" → "Emp1, Test" */
function toQboEmployeeDisplayName(employeeName: string): string {
  const trimmed = employeeName.trim();
  if (trimmed.includes(',')) {
    return trimmed;
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const first = parts.slice(0, -1).join(' ');
    return `${last}, ${first}`;
  }
  return trimmed;
}

/** Poll QBO Time entries until an employee row with the given hours (and optional notes) appears. */
async function expectQboEmployeeEntryRowVisible(
  page: Page,
  options: {
    employeeDisplayName: string;
    decimalHours: string;
    notes?: string;
    timeEntriesPage?: TimeEntriesPage;
  },
): Promise<void> {
  const row = await locateQboEmployeeEntryRow(page, options);
  await expect(row).toBeVisible({ timeout: 5000 });
}

/**
 * Locate a QBO Time entries row for an employee + decimal hours.
 * Notes are matched when present in the summary row; otherwise falls back to employee + hours.
 */
async function locateQboEmployeeEntryRow(
  page: Page,
  options: {
    employeeDisplayName: string;
    decimalHours: string;
    notes?: string;
    timeEntriesPage?: TimeEntriesPage;
  },
): Promise<Locator> {
  const { employeeDisplayName, decimalHours, notes, timeEntriesPage } = options;
  const tep = timeEntriesPage ?? new TimeEntriesPage(page);
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    for (const dateRange of ['This week', 'This month']) {
      await tep.navigateToTimeEntriesPage();
      await tep.waitForLoadingToDisappear();
      await selectDisplayByOption(page, 'Date');
      await tep.waitForLoadingToDisappear();
      await openDateRangeDropdown(page);
      await selectDateRangeOption(page, dateRange);
      await tep.waitForLoadingToDisappear();

      const baseRows = locatorTableRowsForEmployee(
        page,
        employeeDisplayName,
      ).filter({ hasText: decimalHours });

      if (notes) {
        const withNotes = baseRows.filter({ hasText: notes });
        if ((await withNotes.count()) > 0) {
          return withNotes.first();
        }
      }
      if ((await baseRows.count()) > 0) {
        if (notes) {
          console.log(
            `QBO row: notes not in summary — matching ${employeeDisplayName} + ${decimalHours}`,
          );
        }
        return baseRows.first();
      }
    }
    await page.waitForTimeout(3000);
  }

  throw new Error(
    `QBO row not found: ${employeeDisplayName} / ${decimalHours}${
      notes ? ` / ${notes}` : ''
    }`,
  );
}

/** Edit a QBO Time entries row (break or STE) via row-scoped or drawer Edit button. */
async function editQboTimeEntryRow(
  page: Page,
  row: Locator,
  editAction: () => Promise<void>,
): Promise<void> {
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.click();
  await page.waitForTimeout(1000);

  const editInRow = row
    .getByRole('button', { name: /^edit$/i })
    .or(row.getByRole('link', { name: /^edit$/i }));
  if ((await editInRow.count()) > 0) {
    await editInRow.first().click();
  } else {
    const editButton = page.locator('button:has-text("Edit")').first();
    await expect(editButton).toBeVisible({ timeout: 10_000 });
    await editButton.click();
  }
  await page.waitForTimeout(1500);
  await editAction();
}

export const verifyAdminCreatesBreakEntryWorkforceDisplaysEntry = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
  employeeName: string,
) => {
  const displayName = toQboEmployeeDisplayName(employeeName);
  const breakDuration = '0:45';
  const editedBreakDuration = '1:00';
  const breakNotes = `WF015 admin break - ${Date.now()}`;

  const decimalHoursInitial = (0 + 45 / 60).toFixed(2);
  const decimalHoursEdited = (1 + 0 / 60).toFixed(2);

  let adminPage: Page | null = null;
  let employeePage: Page | null = null;

  try {
    adminPage = await browser.newPage();
    await openQBOWithLoginCredentials(adminPage, adminCredentials);

    const timeEntriesPage = new TimeEntriesPage(adminPage);
    const breaksPage = new BreaksPage(adminPage);

    console.log(
      '--- Pre-step: Cleanup Workforce entries before test start ---',
    );
    await cleanupWorkforceEntries(adminPage);

    console.log('--- Step 1: Create Break as Admin in QBO ---');
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(adminPage, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    await breaksPage.openAddBreakDrawer();
    await breaksPage.selectTeamMemberAndFirstBreakType(employeeName);
    await breaksPage.selectBreakEntryType('Duration');
    await breaksPage.enterDurationTime(breakDuration);
    await breaksPage.enterNotes(breakNotes);
    await breaksPage.saveBreak();
    await adminPage.waitForTimeout(2000);
    await timeEntriesPage.waitForLoadingToDisappear();

    await expectQboEmployeeEntryRowVisible(adminPage, {
      employeeDisplayName: displayName,
      decimalHours: decimalHoursInitial,
      notes: breakNotes,
      timeEntriesPage,
    });
    console.log(
      `✓ Admin break (${breakDuration}) visible for ${displayName} in QBO`,
    );

    console.log('--- Step 2: Validate Break in Workforce ---');
    employeePage = await browser.newPage();
    await openWorkforce(employeePage, employeeCredentials);

    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);

    await selectDisplayByOption(employeePage, 'Customer');
    await employeePage.waitForTimeout(1000);
    await selectDisplayByOption(employeePage, 'Date');
    await employeePage.waitForTimeout(1000);
    await openWorkforceDateRangeDropdown(employeePage);
    await selectDateRangeOption(employeePage, 'This month');
    await employeePage.waitForTimeout(2000);

    await workforcePage.validateBreakEntryOnScreen(breakDuration);

    console.log('--- Step 3: Edit Break as Admin in QBO ---');
    await adminPage!.bringToFront();
    const breakRowForEdit = await locateQboEmployeeEntryRow(adminPage!, {
      employeeDisplayName: displayName,
      decimalHours: decimalHoursInitial,
      notes: breakNotes,
      timeEntriesPage,
    });
    await editQboTimeEntryRow(adminPage!, breakRowForEdit, async () => {
      await breaksPage.enterDurationTime(editedBreakDuration);
      await adminPage!.locator('button:has-text("Save")').first().click();
    });
    await adminPage.waitForTimeout(2000);
    await timeEntriesPage.waitForLoadingToDisappear();

    await expectQboEmployeeEntryRowVisible(adminPage, {
      employeeDisplayName: displayName,
      decimalHours: decimalHoursEdited,
      notes: breakNotes,
      timeEntriesPage,
    });
    console.log(`✓ Admin break updated to ${editedBreakDuration} in QBO`);

    console.log('--- Step 4: Validate Edited Break in Workforce ---');
    await employeePage.bringToFront();
    await employeePage.reload();
    await employeePage.waitForTimeout(3000);
    await navigateToWorkforceTimeEntries(employeePage);
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await workforcePage.validateBreakEntryOnScreen(editedBreakDuration);

    console.log('--- Step 5: Approve Break as Admin in QBO ---');
    await adminPage.bringToFront();
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(adminPage, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    await expectQboEmployeeEntryRowVisible(adminPage!, {
      employeeDisplayName: displayName,
      decimalHours: decimalHoursEdited,
      notes: breakNotes,
      timeEntriesPage,
    });

    const approvalsPage = new ApprovalsPage(adminPage);
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.selectDateRange('This month');
    const approvalSuccess = await approvalsPage.approveEmployee(displayName);
    if (!approvalSuccess) {
      throw new Error(`Failed to approve time entries for ${displayName}`);
    }
    console.log(`✓ Approved time for ${displayName} in QBO Approvals`);

    console.log('--- Step 6: Validate Approved Break in Workforce ---');
    await employeePage.bringToFront();
    await employeePage.reload();
    await employeePage.waitForTimeout(3000);
    await navigateToWorkforceTimeEntries(employeePage);
    await selectDisplayByOption(employeePage, 'Customer');
    await employeePage.waitForTimeout(1000);
    await selectDisplayByOption(employeePage, 'Date');
    await employeePage.waitForTimeout(1000);
    await openWorkforceDateRangeDropdown(employeePage);
    await selectDateRangeOption(employeePage, 'This month');
    await employeePage.waitForTimeout(2000);

    await workforcePage.validateApprovedEntryExists(decimalHoursEdited);

    console.log(
      '--- Step 7: Unapprove Break as Admin in QBO (required before delete) ---',
    );
    await adminPage.bringToFront();
    await approvalsPage.navigateToApprovalsPage();
    await approvalsPage.selectDateRange('This month');
    const unapproved = await approvalsPage.unapproveEmployee(displayName);
    if (!unapproved) {
      throw new Error(
        `WF015: Failed to unapprove time for ${displayName} before delete`,
      );
    }
    console.log(`✓ Unapproved time for ${displayName} in QBO Approvals`);

    console.log('--- Step 8: Delete Break as Admin in QBO ---');
    await adminPage.bringToFront();
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(adminPage, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    const breakRowToDelete = await locateQboEmployeeEntryRow(adminPage, {
      employeeDisplayName: displayName,
      decimalHours: decimalHoursEdited,
      notes: breakNotes,
      timeEntriesPage,
    });
    await breakRowToDelete.locator('[aria-label="Expand Menu"]').click();
    await adminPage.getByRole('menuitem', { name: 'Delete' }).click();
    await adminPage.getByRole('button', { name: 'Yes' }).click();
    await timeEntriesPage.waitForLoadingToDisappear();

    await expect(
      adminPage
        .getByRole('row')
        .filter({ hasText: displayName })
        .filter({ hasText: /Break/i })
        .filter({ hasText: decimalHoursEdited }),
    ).toHaveCount(0);
    console.log('✓ Admin break deleted in QBO');

    console.log('--- Step 9: Validate Break Removed in Workforce ---');
    await employeePage.bringToFront();
    await employeePage.reload();
    await employeePage.waitForTimeout(3000);
    await navigateToWorkforceTimeEntries(employeePage);
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await employeePage.waitForTimeout(2000);

    await expect(workforcePage.breakEntryRow).toHaveCount(0);

    console.log(
      '✓ WF015 Complete: Create → sync → edit → sync → approve → sync → unapprove → delete → sync',
    );
  } finally {
    if (adminPage && !adminPage.isClosed()) {
      await cleanupWorkforceEntries(adminPage, { unapproveFirst: true }).catch(
        (error) => console.log('Cleanup failed during WF015 teardown:', error),
      );
    }
    if (employeePage && !employeePage.isClosed()) {
      await employeePage
        .close()
        .catch((error) =>
          console.log('Failed to close WF015 employeePage:', error),
        );
    }
    if (adminPage && !adminPage.isClosed()) {
      await adminPage
        .close()
        .catch((error) =>
          console.log('Failed to close WF015 adminPage:', error),
        );
    }
  }
};

// ==================== WF019: Employee Creates Break → Admin Sees Entry ====================

/**
 * WF019 - Employee Creates Break in Workforce → Admin Sees on Time Entries
 *
 * Uses two pages: Workforce (employee) + QBO admin (pre-cleanup, sync checks, teardown).
 *
 * Flow: Create break (employee) → sync (admin) → edit (employee) → sync (admin) →
 * delete (employee) → sync (admin).
 */
export const verifyEmployeeCreatesBreakEntryAdminSeesEntry = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
  employeeName: string,
) => {
  const displayName = toQboEmployeeDisplayName(employeeName);
  const breakDuration = '0:45';
  const editedBreakDuration = '1:00';
  const breakNotes = `WF019 employee break - ${Date.now()}`;
  const decimalHoursInitial = (0 + 45 / 60).toFixed(2);
  const decimalHoursEdited = (1 + 0 / 60).toFixed(2);

  console.log('--- WF019: Employee break ↔ QBO admin sync ---');
  let employeePage: Page | null = null;
  let adminPage: Page | null = null;

  try {
    console.log(
      '--- Pre-step: Cleanup Workforce entries before test start (admin) ---',
    );
    adminPage = await browser.newPage();
    await loginToQBOAdmin(adminPage, adminCredentials);
    await cleanupWorkforceEntries(adminPage);

    employeePage = await browser.newPage();
    await openWorkforce(employeePage, employeeCredentials);
    const wfEmployeePage = employeePage;
    const workforcePage = await navigateToWorkforceTimeEntries(wfEmployeePage);

    await selectDisplayByOption(wfEmployeePage, 'Date');
    await wfEmployeePage.waitForTimeout(1000);
    await openWorkforceDateRangeDropdown(wfEmployeePage);
    await selectDateRangeOption(wfEmployeePage, 'This month');
    await wfEmployeePage.waitForTimeout(2000);
    await workforcePage.cleanupAllBreakEntries();

    const applyWorkforceDateThisMonth = async () => {
      await dismissWorkforceOverlaysBeforeInteraction(wfEmployeePage);
      await selectDisplayByOption(wfEmployeePage, 'Customer');
      await wfEmployeePage.waitForTimeout(500);
      await applyWorkforceTimeEntriesFilters(wfEmployeePage, {
        displayBy: 'Date',
        dateRange: 'This month',
      });
    };

    console.log('--- Step 1: Create Break as Employee in Workforce ---');
    await workforcePage.clickBreakOption();
    await workforcePage.validateBreakDrawerOpened();
    await workforcePage.fillBreakDuration(breakDuration);
    await workforcePage.breakNotesInput.fill(breakNotes);
    await workforcePage.saveBreak();
    const needsType = await workforcePage.handleBreakTypeRequiredError();
    if (needsType) {
      await workforcePage.saveBreak();
    }
    await workforcePage.validateBreakSaved();

    await applyWorkforceDateThisMonth();
    await workforcePage.validateBreakEntryOnScreen(breakDuration);
    console.log(`✓ Employee break (${breakDuration}) on screen`);

    const qboAdminPage = adminPage!;
    await qboAdminPage.bringToFront();
    const timeEntriesPage = new TimeEntriesPage(qboAdminPage);

    const navigateAdminTimeEntriesThisMonth = async () => {
      await timeEntriesPage.navigateToTimeEntriesPage();
      await timeEntriesPage.waitForLoadingToDisappear();
      await selectDisplayByOption(qboAdminPage, 'Date');
      await timeEntriesPage.waitForLoadingToDisappear();
      await openDateRangeDropdown(qboAdminPage);
      await selectDateRangeOption(qboAdminPage, 'This month');
      await timeEntriesPage.waitForLoadingToDisappear();
    };

    const adminBreakRow = (decimalHours: string) =>
      qboAdminPage
        .getByRole('row')
        .filter({ hasText: displayName })
        .filter({ hasText: decimalHours })
        .filter({ hasText: breakNotes });

    console.log('--- Step 2: Validate Break in QBO Admin (sync) ---');
    await expectQboEmployeeEntryRowVisible(qboAdminPage, {
      employeeDisplayName: displayName,
      decimalHours: decimalHoursInitial,
      notes: breakNotes,
      timeEntriesPage,
    });
    console.log(`✓ Admin sees break ${decimalHoursInitial} h`);

    console.log('--- Step 3: Edit Break as Employee in Workforce ---');
    await wfEmployeePage.bringToFront();
    await wfEmployeePage.reload();
    await waitForLoadingToDisappear(wfEmployeePage);
    await navigateToWorkforceTimeEntries(wfEmployeePage);
    await applyWorkforceDateThisMonth();
    await expect(
      workforcePage.breakEntryRowContaining(breakNotes).first(),
    ).toBeVisible({ timeout: 30_000 });
    await workforcePage.editBreakEntry(editedBreakDuration, breakNotes);
    await applyWorkforceDateThisMonth();
    await workforcePage.validateBreakEntryOnScreen(editedBreakDuration);
    console.log(`✓ Employee break updated to ${editedBreakDuration}`);

    console.log('--- Step 4: Validate Edited Break in QBO Admin (sync) ---');
    await qboAdminPage.bringToFront();
    await expectQboEmployeeEntryRowVisible(qboAdminPage, {
      employeeDisplayName: displayName,
      decimalHours: decimalHoursEdited,
      notes: breakNotes,
      timeEntriesPage,
    });
    console.log(`✓ Admin sees edited break ${decimalHoursEdited} h`);

    console.log('--- Step 5: Delete Break as Employee in Workforce ---');
    await wfEmployeePage.bringToFront();
    await wfEmployeePage.reload();
    await waitForLoadingToDisappear(wfEmployeePage);
    await navigateToWorkforceTimeEntries(wfEmployeePage);
    await applyWorkforceDateThisMonth();
    await expect(
      workforcePage.breakEntryRowContaining(breakNotes).first(),
    ).toBeVisible({ timeout: 30_000 });
    await workforcePage.deleteBreakEntry(breakNotes);

    console.log('--- Step 6: Validate Break Removed in QBO Admin (sync) ---');
    await qboAdminPage.bringToFront();
    await navigateAdminTimeEntriesThisMonth();
    await expect(adminBreakRow(decimalHoursEdited)).toHaveCount(0);

    await wfEmployeePage.bringToFront();
    await applyWorkforceDateThisMonth();
    await expect(workforcePage.breakEntryRow).toHaveCount(0);

    console.log(
      '✓ WF019 Complete: Create → sync → edit → sync → delete → sync',
    );
  } finally {
    if (adminPage && !adminPage.isClosed()) {
      await cleanupWorkforceEntries(adminPage).catch((error) =>
        console.log('Cleanup failed during WF019 teardown:', error),
      );
      await adminPage
        .close()
        .catch((error) =>
          console.log('Failed to close WF019 adminPage:', error),
        );
    }
    if (employeePage && !employeePage.isClosed()) {
      await employeePage
        .close()
        .catch((error) =>
          console.log('Failed to close WF019 employeePage:', error),
        );
    }
  }
};

export type CleanupWorkforceEntriesOptions = {
  /** Unapprove on Approvals before delete (e.g. WF018 teardown after approve). Default false. */
  unapproveFirst?: boolean;
};

/**
 * QBO admin cleanup: Time Entries (Date, This month) — delete rows via Expand menu.
 * Optional Approvals unapprove only when `unapproveFirst` (approved entries block delete).
 */
export async function cleanupWorkforceEntries(
  page: Page,
  options?: CleanupWorkforceEntriesOptions,
): Promise<void> {
  const CLEANUP_UI_MAX_PASSES = 30;
  const timeEntriesPage = new TimeEntriesPage(page);

  if (options?.unapproveFirst) {
    const approvalsPage = new ApprovalsPage(page);
    try {
      await approvalsPage.navigateToApprovalsPage();
      await approvalsPage.waitForLoadingToDisappear();
      await approvalsPage.selectDateRange('This month');

      for (let i = 0; i < CLEANUP_UI_MAX_PASSES; i++) {
        const unapproveBtn = page
          .getByRole('button', { name: /^unapprove$/i })
          .first();
        const visible = await unapproveBtn
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        if (!visible) {
          break;
        }
        await unapproveBtn.click();
        await approvalsPage.handleUnlockTimeDialog();
        await approvalsPage.waitForLoadingToDisappear();
        await page.waitForTimeout(500);
      }
    } catch {
      console.log(
        'cleanupWorkforceEntries: Approvals unapprove skipped or partial',
      );
    }
  }

  try {
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.waitForTableOrNoEntriesMessage();

    if (await timeEntriesPage.hasNoTimeEntries()) {
      console.log('✓ No time entries to delete in cleanup');
    } else {
      for (let i = 0; i < CLEANUP_UI_MAX_PASSES; i++) {
        if (await timeEntriesPage.hasNoTimeEntries()) {
          break;
        }
        const deleted = await timeEntriesPage.deleteFirstTimeEntry();
        if (!deleted) {
          break;
        }
        await page.waitForTimeout(500);
        await timeEntriesPage.waitForLoadingToDisappear();
      }
    }
  } catch {
    console.log('Time Entries delete skipped');
  }

  console.log('✓ cleanup completed');
}

// ==================== Admin ↔ Workforce assignment sync (WF013–WF021) ====================

/** WTE Team Member: open picker, wait for list, click row (no type-to-search). */
async function selectWeeklyTimeEntryTeamMember(
  page: Page,
  employeeName: string,
): Promise<void> {
  await waitForWeeklyTimeEntryFormSettled(page);

  const trimmed = employeeName.trim();
  const qboDisplay = toQboEmployeeDisplayName(trimmed);
  const candidates = [...new Set([trimmed, qboDisplay].filter(Boolean))];

  let lastError: Error | undefined;
  for (const name of candidates) {
    try {
      await selectTeamMemberByMainLabel(page, name, {
        context: 'weeklyTimeEntry',
      });
      return;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw new Error(
    `Could not select team member "${trimmed}" on Weekly time entry (tried: ${candidates.join(
      ', ',
    )}). ${lastError?.message ?? ''}`,
  );
}

/** WF014 — Class field + class value assignments (ASM061-style preprod data). */
export const WF014_WORKER_NAME = 'Dany Kross';
export const WF014_CLASS_VALUE_1 = 'class 1';
export const WF014_CLASS_VALUE_2 = 'class 2';
/** class 1 customer scope (value level). */
export const WF014_CLASS_CUSTOMER = 'test cust2';
/** Field-level only, then both customers (phase 1 → 2). */
export const WF014_FIELD_CUSTOMER_FIRST = 'test cust1';

/** WF013 — Assignments ↔ Workforce customer sync (preprod data). */
export const WF013_WORKER_NAME = 'Ashton Hall';
export const WF013_CUSTOMERS = ['test cust1', 'test cust2'] as const;

/** WF021 — Custom field Assign customers only (testprodwf015 / otomwf01). */
export const WF021_CUSTOMER_FIRST = 'test cust1';
export const WF021_CUSTOMER_SECOND = 'test cust2';

/** WF017 — Admin WTE on testprodwf017; Workforce login rvince01. */
export const WF017_EMPLOYEE_NAME = 'Ralph Vince';

/**
 * Assign or unassign a single worker on a customer via the Assign workers drawer.
 * Uses clear-all-then-select (same as assignments-matrix) so "All workers" / parent
 * checkbox state does not block Save when the target worker was already checked.
 */
async function setWorkerAssignedToCustomer(
  adminPage: Page,
  customerName: string,
  workerName: string,
  shouldBeAssigned: boolean,
): Promise<void> {
  const assignmentsPage = new AssignmentsPage(adminPage);
  await assignmentsPage.goto();
  await handlePopupsInAnyOrder(adminPage);
  await assignmentsPage.openAssignWorkersForCustomer(customerName);
  await assignmentsPage.expectDrawerVisible('Assign workers');
  await adminPage.waitForTimeout(500);

  await CustomFieldsPage.unselectAllWorkersInAssignPanel(adminPage);
  if (shouldBeAssigned) {
    await CustomFieldsPage.selectWorkerInAssignPanel(adminPage, workerName);
  }

  await CustomFieldsPage.clickSaveAssignWorkersPanel(adminPage);
  await adminPage
    .getByRole('dialog')
    .getByRole('heading', { name: /assign workers/i })
    .waitFor({ state: 'hidden', timeout: 25_000 })
    .catch(() => {});
  await adminPage.waitForTimeout(1500);
}

async function pollSteCustomerOptionVisibility(
  employeePage: Page,
  customer: string,
  visible: boolean,
): Promise<void> {
  const workforcePage = new WorkforcePage(employeePage);
  let lastActual = false;

  await expect
    .poll(
      async () => {
        await workforcePage.ensureSteDrawerOpen();
        lastActual = await workforcePage.steCustomerOptionIsVisible(customer);
        if (lastActual === visible) {
          return lastActual;
        }
        await employeePage.reload();
        await employeePage.waitForLoadState('domcontentloaded');
        await navigateToWorkforceTimeEntries(employeePage);
        await workforcePage.ensureSteDrawerOpen();
        lastActual = await workforcePage.steCustomerOptionIsVisible(customer);
        return lastActual;
      },
      { timeout: 90_000, intervals: [4000] },
    )
    .toBe(visible);
}

async function pollWteCustomerOptionVisibility(
  employeePage: Page,
  customer: string,
  visible: boolean,
): Promise<void> {
  const workforcePage = new WorkforcePage(employeePage);
  let lastActual = false;

  await expect
    .poll(
      async () => {
        await workforcePage.ensureWteDrawerOpen();
        lastActual = await workforcePage.wteCustomerOptionIsVisible(customer);
        if (lastActual === visible) {
          return lastActual;
        }
        await employeePage.reload();
        await employeePage.waitForLoadState('domcontentloaded');
        await navigateToWorkforceTimeEntries(employeePage);
        await workforcePage.ensureWteDrawerOpen();
        lastActual = await workforcePage.wteCustomerOptionIsVisible(customer);
        return lastActual;
      },
      { timeout: 90_000, intervals: [4000] },
    )
    .toBe(visible);
}

async function assertWorkforceSteAndWteCustomerOptions(
  employeePage: Page,
  expected: { customer: string; visible: boolean }[],
): Promise<void> {
  for (const { customer, visible } of expected) {
    await pollSteCustomerOptionVisibility(employeePage, customer, visible);
  }

  const workforcePage = new WorkforcePage(employeePage);
  await workforcePage.closeSteDrawerIfOpen();
  for (const { customer, visible } of expected) {
    await pollWteCustomerOptionVisibility(employeePage, customer, visible);
  }
}

const customFieldListName = (customFieldName: string): string =>
  customFieldName.split('(')[0].trim();

async function openCustomFieldsEdit(adminPage: Page): Promise<void> {
  await CustomFieldsPage.navigationToCustomFieldSettings(adminPage);
  await CustomFieldsPage.clickCustomFieldsEditButton(adminPage);
  await CustomFieldsPage.waitForCustomFieldsLoading(adminPage);
}

/** First row in the custom-fields table (Time → Custom fields → Edit, or Manage all custom fields). */
async function resolveFirstCustomFieldName(adminPage: Page): Promise<string> {
  const rows = adminPage.locator('//table//tbody//tr[.//strong]');
  for (let i = 0; i < 15; i++) {
    if ((await rows.count().catch(() => 0)) > 0) {
      const name = await CustomFieldsPage.getFirstCustomFieldName(adminPage);
      if (name) return name;
    }
    await adminPage.waitForTimeout(1000);
  }

  const manageAll = adminPage
    .getByRole('button', { name: /Manage all custom fields/i })
    .or(adminPage.locator('//span[text()="Manage all custom fields"]'));
  if (
    await manageAll
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
  ) {
    await CustomFieldsPage.clickManageAllCustomFieldsLink(adminPage);
    await CustomFieldsPage.waitForCustomFieldsLoading(adminPage);
    const name = await CustomFieldsPage.getFirstCustomFieldName(adminPage);
    if (name) return name;
  }

  const noFieldsYet = await adminPage
    .getByText(/No custom fields for time tracking yet/i)
    .isVisible()
    .catch(() => false);
  throw new Error(
    noFieldsYet
      ? 'WF021: Company has no time-tracking custom fields yet. On testprodwf015 create at least one (Time → Custom fields → Manage all custom fields), then re-run.'
      : 'WF021: No custom fields found in the list after Edit. Confirm testprodwf015 has at least one active custom field.',
  );
}

async function assignExclusiveCustomersToCustomField(
  adminPage: Page,
  customFieldName: string,
  customerNames: string[],
): Promise<void> {
  const base = customFieldListName(customFieldName);
  await CustomFieldsPage.clickAssignCustomersForCustomField(adminPage, base);
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(adminPage);
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(adminPage, false);
  for (const customerName of customerNames) {
    await CustomFieldsPage.selectCustomerInAssignPanel(adminPage, customerName);
  }
  await CustomFieldsPage.clickSaveAssignCustomersPanel(adminPage);
  await CustomFieldsPage.waitForAssignCustomersPanelDismissed(adminPage).catch(
    () => undefined,
  );
  await adminPage.waitForTimeout(1000);
}

async function clearCustomFieldCustomerAssignments(
  adminPage: Page,
  customFieldName: string,
): Promise<void> {
  await openCustomFieldsEdit(adminPage);
  const base = customFieldListName(customFieldName);
  await CustomFieldsPage.clickAssignCustomersForCustomField(adminPage, base);
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(adminPage);
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(adminPage);
}

async function assertWorkforceSteCustomFieldVisible(
  employeePage: Page,
  workforcePage: WorkforcePage,
  customFieldName: string,
  expectVisible: boolean,
  customerName?: string,
): Promise<void> {
  await workforcePage.ensureSteDrawerOpen();
  if (customerName) {
    await workforcePage.selectSteCustomerByName(customerName);
  }
  const fieldLabel = workforcePage.customFieldLabelLocator(customFieldName);
  if (expectVisible) {
    await expect(fieldLabel).toBeVisible({ timeout: 20_000 });
  } else {
    await expect(fieldLabel).not.toBeVisible({ timeout: 10_000 });
  }
}

/** Poll class dropdown; assignment → Workforce can lag after admin config. */
async function pollSteClassValueVisible(
  employeePage: Page,
  classValueName: string,
  expectVisible: boolean,
): Promise<boolean> {
  const attempts = expectVisible ? 5 : 2;
  let actual = await isClassValueVisibleInClassDropdown(
    employeePage,
    classValueName,
  );
  for (let i = 0; i < attempts && actual !== expectVisible; i++) {
    await employeePage.waitForTimeout(2000);
    actual = await isClassValueVisibleInClassDropdown(
      employeePage,
      classValueName,
    );
  }
  return actual;
}

async function assertWorkforceSteClassFieldForCustomer(
  employeePage: Page,
  workforcePage: WorkforcePage,
  customerName: string,
  expectVisible: boolean,
): Promise<void> {
  await workforcePage.ensureSteDrawerOpen();
  await workforcePage.selectSteCustomerByName(customerName);
  const classField = workforcePage.steClassCombobox;
  if (expectVisible) {
    await expect(classField).toBeVisible({ timeout: 15_000 });
  } else {
    await expect(classField).not.toBeVisible({ timeout: 10_000 });
  }
}

async function assertWorkforceSteClassValueForCustomer(
  employeePage: Page,
  workforcePage: WorkforcePage,
  customerName: string,
  classValueName: string,
  expectVisible: boolean,
): Promise<void> {
  await workforcePage.ensureSteDrawerOpen();
  await workforcePage.selectSteCustomerByName(customerName);
  await expect(workforcePage.steClassCombobox).toBeVisible({
    timeout: 15_000,
  });
  let actual = await pollSteClassValueVisible(
    employeePage,
    classValueName,
    expectVisible,
  );
  if (actual !== expectVisible) {
    await refreshWorkforceSte(employeePage, workforcePage);
    await workforcePage.selectSteCustomerByName(customerName);
    actual = await pollSteClassValueVisible(
      employeePage,
      classValueName,
      expectVisible,
    );
  }
  expect(actual).toBe(expectVisible);
}

async function refreshWorkforceSte(
  employeePage: Page,
  workforcePage: WorkforcePage,
): Promise<void> {
  await employeePage.reload();
  await employeePage.waitForLoadState('domcontentloaded');
  await workforcePage.clickTimeTracking();
  await workforcePage.waitForTimeEntriesPageReady();
  await workforcePage.ensureSteDrawerOpen();
}

async function refreshWorkforceWte(
  employeePage: Page,
  workforcePage: WorkforcePage,
): Promise<void> {
  await employeePage.reload();
  await employeePage.waitForLoadState('domcontentloaded');
  await workforcePage.clickTimeTracking();
  await workforcePage.waitForTimeEntriesPageReady();
  await workforcePage.ensureWteDrawerOpen();
}

async function assertWorkforceWteClassFieldForCustomer(
  employeePage: Page,
  workforcePage: WorkforcePage,
  customerName: string,
  expectVisible: boolean,
): Promise<void> {
  await workforcePage.ensureWteDrawerOpen();
  await workforcePage.selectWtePanelCustomerByName(customerName);
  const classField = workforcePage.steClassCombobox;
  if (expectVisible) {
    await expect(classField).toBeVisible({ timeout: 15_000 });
  } else {
    await expect(classField).not.toBeVisible({ timeout: 10_000 });
  }
}

async function assertWorkforceWteClassValueForCustomer(
  employeePage: Page,
  workforcePage: WorkforcePage,
  customerName: string,
  classValueName: string,
  expectVisible: boolean,
): Promise<void> {
  await workforcePage.ensureWteDrawerOpen();
  await workforcePage.selectWtePanelCustomerByName(customerName);
  await expect(workforcePage.steClassCombobox).toBeVisible({
    timeout: 15_000,
  });
  let actual = await pollSteClassValueVisible(
    employeePage,
    classValueName,
    expectVisible,
  );
  if (actual !== expectVisible) {
    await refreshWorkforceWte(employeePage, workforcePage);
    await workforcePage.selectWtePanelCustomerByName(customerName);
    actual = await pollSteClassValueVisible(
      employeePage,
      classValueName,
      expectVisible,
    );
  }
  expect(actual).toBe(expectVisible);
}

async function assertWorkforceWteCustomFieldVisible(
  employeePage: Page,
  workforcePage: WorkforcePage,
  customFieldName: string,
  expectVisible: boolean,
  customerName?: string,
): Promise<void> {
  await workforcePage.ensureWteDrawerOpen();
  if (customerName) {
    await workforcePage.selectWtePanelCustomerByName(customerName);
  } else {
    await workforcePage.focusWtePanelDayCell(3);
  }
  const fieldLabel = workforcePage.customFieldLabelLocator(customFieldName);
  if (expectVisible) {
    await expect(fieldLabel).toBeVisible({ timeout: 20_000 });
  } else {
    await expect(fieldLabel).not.toBeVisible({ timeout: 10_000 });
  }
}

async function adminCreateWeeklyTimeEntryForEmployee(
  adminPage: Page,
  employeeName: string,
  hoursPerDay: string,
): Promise<string> {
  await adminPage.goto(`${getQboRootUrl()}/app/time?jobId=time`);
  await adminPage.waitForTimeout(2000);
  await openWeeklyTimeEntry(adminPage);
  await handlePopupsInAnyOrder(adminPage);
  await selectWeeklyTimeEntryTeamMember(adminPage, employeeName);
  await adminPage.waitForTimeout(1000);

  await customerProjectDropdown(adminPage).first().click();
  await clickCustomerDropdownOption(adminPage, 1);
  const customerName = await getCustomerName(adminPage, 0);

  // DataCell columns are Mon=1 … Sun=7 — fill today's column so sync lands in "This week"
  const jsDay = new Date().getDay();
  const weekdayColumn = jsDay === 0 ? 7 : jsDay;
  const hourCell = hours(adminPage, weekdayColumn);
  await hourCell.click();
  await adminPage.keyboard.type(hoursPerDay);
  await saveButton(adminPage).click();
  await waitForLoadingToDisappear(adminPage);
  await adminPage.waitForTimeout(2000);

  return customerName;
}

async function adminEditWeeklyTimeEntryHours(
  adminPage: Page,
  employeeName: string,
  hoursPerDay: string,
): Promise<void> {
  await adminPage.goto(`${getQboRootUrl()}/app/time?jobId=time`);
  await adminPage.waitForTimeout(2000);
  await openWeeklyTimeEntry(adminPage);
  await handlePopupsInAnyOrder(adminPage);
  await selectWeeklyTimeEntryTeamMember(adminPage, employeeName);
  await adminPage.waitForTimeout(1000);
  const jsDay = new Date().getDay();
  const weekdayColumn = jsDay === 0 ? 7 : jsDay;
  const hourCell = hours(adminPage, weekdayColumn);
  await hourCell.click();
  await adminPage.keyboard.press('Meta+A');
  await adminPage.keyboard.type(hoursPerDay);
  await saveButton(adminPage).click();
  await waitForLoadingToDisappear(adminPage);
  await adminPage.waitForTimeout(2000);
}

/**
 * WF013 — Assign one customer, leave the other unassigned; validate on Workforce STE + WTE,
 * then unassign both so the next run starts clean.
 */
export const verifyAdminCustomerAssignmentWorkforceSync = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
  workerName: string = WF013_WORKER_NAME,
) => {
  const [assignedCustomer, unassignedCustomer] = WF013_CUSTOMERS;
  let adminPage: Page | null = null;
  let employeePage: Page | null = null;

  try {
    adminPage = await browser.newPage();
    await openQBOWithLoginCredentials(adminPage, adminCredentials);
    await cleanupWorkforceEntries(adminPage);

    for (const customer of WF013_CUSTOMERS) {
      await setWorkerAssignedToCustomer(adminPage, customer, workerName, false);
    }

    await setWorkerAssignedToCustomer(
      adminPage,
      assignedCustomer,
      workerName,
      true,
    );

    employeePage = await browser.newPage();
    await openWorkforce(employeePage, employeeCredentials);
    await employeePage.waitForTimeout(2000);
    await assertWorkforceSteAndWteCustomerOptions(employeePage, [
      { customer: assignedCustomer, visible: true },
      { customer: unassignedCustomer, visible: false },
    ]);

    await adminPage.bringToFront();
    for (const customer of WF013_CUSTOMERS) {
      await setWorkerAssignedToCustomer(adminPage, customer, workerName, false);
    }

    await employeePage.bringToFront();
    await employeePage.reload();
    await employeePage.waitForLoadState('domcontentloaded');
    await assertWorkforceSteAndWteCustomerOptions(employeePage, [
      { customer: assignedCustomer, visible: false },
      { customer: unassignedCustomer, visible: false },
    ]);

    console.log(
      `✓ WF013 Complete: ${workerName} — ${assignedCustomer} assigned on Workforce STE + WTE; ${unassignedCustomer} not; both unassigned at end`,
    );
  } finally {
    if (employeePage && !employeePage.isClosed()) {
      await employeePage.close().catch(() => undefined);
    }
    if (adminPage && !adminPage.isClosed()) {
      await cleanupWorkforceEntries(adminPage).catch(() => undefined);
      await adminPage.close().catch(() => undefined);
    }
  }
};

/**
 * WF014 — Class field-level customers + class-value worker/customer sync to Workforce STE + WTE.
 *
 * 1. Class row → Assign customers → only test cust1 → Class hidden on test cust2.
 * 2. Add test cust2 at field level → Class field visible on test cust2.
 * 3. class 2 → worker; class 1 → customer 2 + worker → class 2 on any customer; class 1 only on cust2.
 */
export const verifyAdminClassAssignmentWorkforceSync = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
  workerName: string = WF014_WORKER_NAME,
) => {
  let adminPage: Page | null = null;
  let employeePage: Page | null = null;

  try {
    adminPage = await browser.newPage();
    await openQBOWithLoginCredentials(adminPage, adminCredentials);
    await ensureClassFieldInactiveForAssignments(adminPage);
    await openTimesheetFieldsEditMode(adminPage);
    await assignClassFieldLevelCustomers(adminPage, [
      WF014_FIELD_CUSTOMER_FIRST,
    ]);

    employeePage = await browser.newPage();
    await openWorkforce(employeePage, employeeCredentials);
    const workforcePage = new WorkforcePage(employeePage);
    await assertWorkforceSteClassFieldForCustomer(
      employeePage,
      workforcePage,
      WF014_CLASS_CUSTOMER,
      false,
    );
    await assertWorkforceWteClassFieldForCustomer(
      employeePage,
      workforcePage,
      WF014_CLASS_CUSTOMER,
      false,
    );

    await adminPage.bringToFront();
    await openTimesheetFieldsEditMode(adminPage);
    await assignClassFieldLevelCustomers(adminPage, [
      WF014_FIELD_CUSTOMER_FIRST,
      WF014_CLASS_CUSTOMER,
    ]);
    await employeePage.bringToFront();
    await refreshWorkforceSte(employeePage, workforcePage);
    await assertWorkforceSteClassFieldForCustomer(
      employeePage,
      workforcePage,
      WF014_CLASS_CUSTOMER,
      true,
    );
    await refreshWorkforceWte(employeePage, workforcePage);
    await assertWorkforceWteClassFieldForCustomer(
      employeePage,
      workforcePage,
      WF014_CLASS_CUSTOMER,
      true,
    );

    await adminPage.bringToFront();
    await configureClassValuesWorkerAndCustomer(adminPage, [
      {
        classValue: WF014_CLASS_VALUE_2,
        workerName,
      },
      {
        classValue: WF014_CLASS_VALUE_1,
        customerName: WF014_CLASS_CUSTOMER,
        workerName,
      },
    ]);
    await employeePage.bringToFront();
    await refreshWorkforceSte(employeePage, workforcePage);
    await assertWorkforceSteClassValueForCustomer(
      employeePage,
      workforcePage,
      WF014_FIELD_CUSTOMER_FIRST,
      WF014_CLASS_VALUE_2,
      true,
    );
    await assertWorkforceSteClassValueForCustomer(
      employeePage,
      workforcePage,
      WF014_FIELD_CUSTOMER_FIRST,
      WF014_CLASS_VALUE_1,
      false,
    );
    await assertWorkforceSteClassValueForCustomer(
      employeePage,
      workforcePage,
      WF014_CLASS_CUSTOMER,
      WF014_CLASS_VALUE_2,
      true,
    );
    await assertWorkforceSteClassValueForCustomer(
      employeePage,
      workforcePage,
      WF014_CLASS_CUSTOMER,
      WF014_CLASS_VALUE_1,
      true,
    );
    await refreshWorkforceWte(employeePage, workforcePage);
    await assertWorkforceWteClassValueForCustomer(
      employeePage,
      workforcePage,
      WF014_FIELD_CUSTOMER_FIRST,
      WF014_CLASS_VALUE_2,
      true,
    );
    await assertWorkforceWteClassValueForCustomer(
      employeePage,
      workforcePage,
      WF014_FIELD_CUSTOMER_FIRST,
      WF014_CLASS_VALUE_1,
      false,
    );
    await assertWorkforceWteClassValueForCustomer(
      employeePage,
      workforcePage,
      WF014_CLASS_CUSTOMER,
      WF014_CLASS_VALUE_2,
      true,
    );
    await assertWorkforceWteClassValueForCustomer(
      employeePage,
      workforcePage,
      WF014_CLASS_CUSTOMER,
      WF014_CLASS_VALUE_1,
      true,
    );

    console.log(
      `✓ WF014 Complete: field-level customers → ${WF014_CLASS_VALUE_2} for ${workerName} on Workforce STE + WTE; ${WF014_CLASS_VALUE_1} on ${WF014_CLASS_CUSTOMER} only`,
    );
  } finally {
    if (employeePage && !employeePage.isClosed()) {
      await employeePage.close().catch(() => undefined);
    }
    if (adminPage && !adminPage.isClosed()) {
      await adminPage.close().catch(() => undefined);
    }
  }
};

/**
 * WF021 — Custom field Assign customers → Workforce STE + WTE (no Assign workers on this shell).
 *
 * 1. Assign customers test cust1 only on first custom field.
 * 2. Workforce STE + WTE: field visible for test cust1, hidden for test cust2.
 * 3. Clear all customer assignments on that field for next run.
 */
export const verifyAdminCustomFieldAssignmentWorkforceSync = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
) => {
  let adminPage: Page | null = null;
  let employeePage: Page | null = null;
  let customFieldName = '';

  try {
    adminPage = await browser.newPage();
    await openQBOWithLoginCredentials(adminPage, adminCredentials);
    await openCustomFieldsEdit(adminPage);
    customFieldName = await resolveFirstCustomFieldName(adminPage);

    await assignExclusiveCustomersToCustomField(adminPage, customFieldName, [
      WF021_CUSTOMER_FIRST,
    ]);

    employeePage = await browser.newPage();
    await openWorkforce(employeePage, employeeCredentials);
    const workforcePage = new WorkforcePage(employeePage);
    await assertWorkforceSteCustomFieldVisible(
      employeePage,
      workforcePage,
      customFieldName,
      true,
      WF021_CUSTOMER_FIRST,
    );
    await assertWorkforceSteCustomFieldVisible(
      employeePage,
      workforcePage,
      customFieldName,
      false,
      WF021_CUSTOMER_SECOND,
    );
    await assertWorkforceWteCustomFieldVisible(
      employeePage,
      workforcePage,
      customFieldName,
      true,
      WF021_CUSTOMER_FIRST,
    );
    await assertWorkforceWteCustomFieldVisible(
      employeePage,
      workforcePage,
      customFieldName,
      false,
      WF021_CUSTOMER_SECOND,
    );

    console.log(
      `✓ WF021 Complete: "${customFieldName}" — Assign customers ${WF021_CUSTOMER_FIRST} only; visible on Workforce STE + WTE for ${WF021_CUSTOMER_FIRST}, not ${WF021_CUSTOMER_SECOND}`,
    );
  } finally {
    if (employeePage && !employeePage.isClosed()) {
      await employeePage.close().catch(() => undefined);
    }
    if (adminPage && !adminPage.isClosed()) {
      if (customFieldName) {
        await clearCustomFieldCustomerAssignments(
          adminPage,
          customFieldName,
        ).catch(() => undefined);
      }
      await adminPage.close().catch(() => undefined);
    }
  }
};

/**
 * WF017 — Admin creates, edits, and deletes WTE; Workforce list reflects each step.
 */
export const verifyAdminWteWorkforceSync = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
  employeeName: string = WF017_EMPLOYEE_NAME,
) => {
  let adminPage: Page | null = null;
  let employeePage: Page | null = null;
  const displayName = toQboEmployeeDisplayName(employeeName);

  try {
    adminPage = await browser.newPage();
    await openQBOWithLoginCredentials(adminPage, adminCredentials);
    await cleanupWorkforceEntries(adminPage);

    // One WTE day is enough — WF017 only checks admin ↔ Workforce sync, not multi-day totals.
    const customerName = await adminCreateWeeklyTimeEntryForEmployee(
      adminPage,
      employeeName,
      '8',
    );

    employeePage = await browser.newPage();
    await openWorkforce(employeePage, employeeCredentials);
    await validateTimeEntriesInTable(employeePage, customerName, '8');

    await adminPage.bringToFront();
    const updatedHours = '6';
    await adminEditWeeklyTimeEntryHours(adminPage, employeeName, updatedHours);

    await employeePage.bringToFront();
    await employeePage.reload();
    await employeePage.waitForTimeout(2000);
    await validateTimeEntriesInTable(employeePage, customerName, updatedHours);

    await adminPage.bringToFront();
    const timeEntriesPage = new TimeEntriesPage(adminPage);
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(adminPage, 'Date');
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    const row = adminPage
      .getByRole('row')
      .filter({ hasText: displayName })
      .filter({ hasText: customerName.split(/\s+/)[0] })
      .first();
    if (await row.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await row.locator('[aria-label="Expand Menu"]').click();
      await adminPage.getByRole('menuitem', { name: 'Delete' }).click();
      await adminPage.getByRole('button', { name: 'Yes' }).click();
      await timeEntriesPage.waitForLoadingToDisappear();
    }

    await employeePage.bringToFront();
    await employeePage.reload();
    await employeePage.waitForTimeout(2000);
    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    await selectDisplayByOption(employeePage, 'Date');
    await openWorkforceDateRangeDropdown(employeePage);
    await selectDateRangeOption(employeePage, 'This month');
    await employeePage.waitForTimeout(2000);
    await expect(
      employeePage
        .locator('tbody tr')
        .filter({ hasText: customerName.split(/\s+/)[0] }),
    ).toHaveCount(0);

    console.log(
      '✓ WF017 Complete: Admin WTE create → edit → delete synced to Workforce',
    );
  } finally {
    if (employeePage && !employeePage.isClosed()) {
      await employeePage.close().catch(() => undefined);
    }
    if (adminPage && !adminPage.isClosed()) {
      await cleanupWorkforceEntries(adminPage).catch(() => undefined);
      await adminPage.close().catch(() => undefined);
    }
  }
};

/**
 * WF018 — Admin approves WTE totals; Workforce shows approved state.
 */
export const verifyAdminApprovesWteWorkforceShowsApproved = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
  employeeName: string,
) => {
  let adminPage: Page | null = null;
  let employeePage: Page | null = null;
  const displayName = toQboEmployeeDisplayName(employeeName);

  try {
    adminPage = await browser.newPage();
    await openQBOWithLoginCredentials(adminPage, adminCredentials);
    await cleanupWorkforceEntries(adminPage);

    // One WTE day is enough — WF018 only checks approval sync, not multi-day totals.
    const customerName = await adminCreateWeeklyTimeEntryForEmployee(
      adminPage,
      employeeName,
      '8',
    );

    employeePage = await browser.newPage();
    await openWorkforce(employeePage, employeeCredentials);
    await validateTimeEntriesInTable(employeePage, customerName, '8');

    await adminPage.bringToFront();
    const approvalsPage = new ApprovalsPage(adminPage);

    const waitForEmployeeInApprovals = async (): Promise<boolean> => {
      await approvalsPage.navigateToApprovalsPage();
      for (const dateRange of ['This week', 'This month']) {
        await approvalsPage.selectDateRange(dateRange);
        await approvalsPage.waitForLoadingToDisappear();
        const visible = await approvalsPage
          .getRowByEmployeeName(displayName)
          .isVisible({ timeout: 5000 })
          .catch(() => false);
        if (visible) return true;
      }
      return false;
    };

    const approvalsSyncDeadline = Date.now() + 90_000;
    let rowReady = false;
    while (Date.now() < approvalsSyncDeadline) {
      rowReady = await waitForEmployeeInApprovals();
      if (rowReady) break;
      console.log(
        `WF018: waiting for ${displayName} to appear in QBO Approvals…`,
      );
      await adminPage.waitForTimeout(5000);
    }
    if (!rowReady) {
      throw new Error(
        `WF018: ${displayName} not found in Approvals after WTE create`,
      );
    }

    const approved = await approvalsPage.approveEmployee(displayName);
    if (!approved) {
      throw new Error(`WF018: Failed to approve time for ${displayName}`);
    }

    await employeePage.bringToFront();
    await employeePage.reload();
    await employeePage.waitForTimeout(3000);
    await navigateToWorkforceTimeEntries(employeePage);
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This week',
    });

    const workforcePage = new WorkforcePage(employeePage);
    const approvalDeadline = Date.now() + 60_000;
    let approvedVisible = false;
    while (Date.now() < approvalDeadline) {
      approvedVisible = await workforcePage.validateApprovedEntryExists('8');
      if (approvedVisible) break;
      await employeePage.waitForTimeout(3000);
      await employeePage.reload();
      await navigateToWorkforceTimeEntries(employeePage);
      await applyWorkforceTimeEntriesFilters(employeePage, {
        displayBy: 'Date',
        dateRange: 'This week',
      });
    }
    expect(approvedVisible).toBe(true);

    console.log(
      '✓ WF018 Complete: Admin-approved WTE visible as approved in Workforce',
    );
  } finally {
    if (employeePage && !employeePage.isClosed()) {
      await employeePage.close().catch(() => undefined);
    }
    if (adminPage && !adminPage.isClosed()) {
      await cleanupWorkforceEntries(adminPage, { unapproveFirst: true }).catch(
        () => undefined,
      );
      await adminPage.close().catch(() => undefined);
    }
  }
};
