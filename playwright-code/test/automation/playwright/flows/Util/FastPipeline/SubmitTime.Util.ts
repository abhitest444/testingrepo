import { Browser, BrowserContext, Page, expect } from '@playwright/test';
import TimeEntriesPage from '../../../pages/TimeEntriesPage';
import SingleTimeEntryPage from '../../../pages/SingleTimeEntryPage';
import WorkforcePage from '../../../pages/WorkforcePage';
import SubmitTimePage from '../../../pages/FastPipeline/SubmitTimePage';
import TimeClockPage from '../../../pages/TimeClockPage';
import { LoginCredentials } from '../../../config/types';
import { openQBOTS, openWorkforce } from '../../../pages/QBOLogin';
import {
  navigateToWorkforceTimeEntries,
  applyWorkforceTimeEntriesFilters,
} from '../Workforce.Util';
import {
  clickAddTimeDropdown,
  selectSingleTimeEntryFromAddTime,
  selectDisplayByOption,
  openDateRangeDropdown,
  selectDateRangeOption,
} from '../../../commonUtils';
import {
  navigateToApprovals,
  selectThisMonthDateRange,
  approveSingleEmployee,
  unapproveSingleEmployee,
} from '../Approvals.util';
import {
  verifyApprovalsSectionWhenSubmissionIsTurnedOnFromQBOSettings,
  verifyApprovalsSectionWhenSubmissionOffFromTSheets,
} from '../TimeSettings.Util';

/**
 * Shared test data for the Submit Time flows. Update the employeeName to match
 * the team member that owns the submitted timesheets in the test company.
 */
export const SUBMIT_TIME_TEST_DATA = {
  customer: 'Test Customer1',
  service: 'Sales',
  duration: '5:00', // 5 hr in hh:mm
  notes: 'Single Time Entry',
  employeeName: 'Emp1, Test',
};

/** SUT06 uses a distinct note for its time entries (flow + cleanup). */
const SUT06_NOTES = 'Single Time Entries';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Create a single time entry in Workforce (Customer, Service, Billable,
 * Duration, Notes) and refresh the Time entries list. Does not submit.
 */
const createTimeEntryInWorkforce = async (
  employeePage: Page,
  workforcePage: WorkforcePage,
  notes: string = SUBMIT_TIME_TEST_DATA.notes,
  duration: string = SUBMIT_TIME_TEST_DATA.duration,
  // Opt-in: use the overlay-aware / multi-day locked-date save. Defaults to the
  // original saveSte() so existing callers are unaffected.
  options: { resilientSave?: boolean } = {},
) => {
  await workforcePage.clickSingleTimeEntryOption();
  await workforcePage.validateSteDrawerOpened();
  await employeePage.waitForTimeout(5000);
  await workforcePage.selectSteCustomerByName(SUBMIT_TIME_TEST_DATA.customer);
  await workforcePage.selectSteServiceByName(SUBMIT_TIME_TEST_DATA.service);
  await workforcePage.checkSteBillable();
  await workforcePage.fillSteDuration(duration);
  await workforcePage.fillSteNotes(notes);
  if (options.resilientSave) {
    await workforcePage.saveSteResilient();
  } else {
    await workforcePage.saveSte();
  }
  await workforcePage.validateSteSaved();
  await applyWorkforceTimeEntriesFilters(employeePage, {
    displayBy: 'Date',
    dateRange: 'This month',
  });
};

/** Submit the current time via the Submit time trowser (Submit + Confirm). */
const submitTimeInWorkforce = async (
  employeePage: Page,
  workforcePage: WorkforcePage,
  submitTimePage: SubmitTimePage,
  // Opt-in: wait for the trowser's eligible-hours summary to load (retrying
  // through the transient "An error occurred" banner) instead of the original
  // fixed 5s wait + instantaneous enabled-check. Defaults to original.
  options: { waitForSummaryReady?: boolean } = {},
) => {
  await workforcePage.openAddTimeDropdown();
  await workforcePage.submitTimeOption.click();
  await employeePage.waitForTimeout(5000);
  await submitTimePage.expectPanelVisible();
  await submitTimePage.selectSubmitThroughDate();
  if (options.waitForSummaryReady) {
    expect(await submitTimePage.waitForSubmitSummaryReady()).toBeTruthy();
  } else {
    await employeePage.waitForTimeout(5000);
    expect(await submitTimePage.isSubmitButtonEnabled()).toBeTruthy();
  }
  await submitTimePage.clickSubmit();
  await submitTimePage.validateConfirmationDetails();
  await submitTimePage.clickConfirm();
};

/**
 * Open Time Entries, open the Add time dropdown and assert the "Submit time"
 * option is present (shared by SUT01 and SUT02).
 */
export const validateSubmitTimeOptionInAddTimeDropdown = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  const submitTimePage = new SubmitTimePage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await clickAddTimeDropdown(page);
  await page.waitForTimeout(1000);
  await submitTimePage.validateSubmitTimeOptionPresent();
  // Close the dropdown so we leave the page in a clean state.
  await page.keyboard.press('Escape');
  console.log('✓ "Submit time" option present in Add time dropdown');
};

// ---------------------------------------------------------------------------
// SUT01 - Enable Submit Time entry in WFS from QBO
//
// Dual-session flow (mirrors the Workforce <-> QBO sync cases): the admin
// enables submission from QBO in one page, and the team member logs into
// Workforce (WFS) with a SEPARATE email in a second page to validate the
// Submit time option appears in the Add time dropdown.
// ---------------------------------------------------------------------------
export const validateEnableSubmitTimeFromQBO = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
) => {
  // Use an explicit context (not browser.newPage()) so the admin session can
  // open additional tabs — e.g. TSheets in a new tab sharing the same auth.
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  let employeePage: Page | undefined;

  try {
    console.log('--- Step 1: Enable Submit Time in QBO as Admin ---');
    await openQBOTS(adminPage, adminCredentials);
    await verifyApprovalsSectionWhenSubmissionIsTurnedOnFromQBOSettings(
      adminPage,
      true, // SUT01: open TSheets directly in a new tab for Approvals Preferences
    );

    console.log('--- Step 2: Validate Submit time option in Workforce ---');
    employeePage = await browser.newPage();
    await openWorkforce(employeePage, employeeCredentials);
    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    await workforcePage.validateSubmitTimeOptionPresent();
    console.log(
      '✓ SUT01 Complete: Submit time option present in Workforce Add time dropdown',
    );
  } finally {
    await adminContext.close().catch(() => {});
    if (employeePage) {
      await employeePage.close().catch(() => {});
    }
  }
};

// ---------------------------------------------------------------------------
// SUT02 - Submit Time disabled in WFS validated from TSheets
//
// Dual-session flow (same login pattern as SUT01): the admin ensures submission
// is turned OFF in QBO and validates the disabled state in TSheets, and the team
// member logs into Workforce (WFS) with a SEPARATE email to confirm the Submit
// time option is NOT available in the Add time dropdown.
// ---------------------------------------------------------------------------
export const validateEnableSubmitTimeFromTSheets = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
) => {
  // Use an explicit context (not browser.newPage()) so the admin session can
  // open TSheets in a new tab sharing the same auth (same as SUT01).
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  let employeePage: Page | undefined;

  try {
    console.log('--- Step 1: Validate Submit Time disabled in QBO/TSheets ---');
    await openQBOTS(adminPage, adminCredentials);
    await verifyApprovalsSectionWhenSubmissionOffFromTSheets(adminPage);

    console.log(
      '--- Step 2: Validate Submit time option hidden in Workforce ---',
    );
    employeePage = await browser.newPage();
    await openWorkforce(employeePage, employeeCredentials);
    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    await workforcePage.validateSubmitTimeOptionNotPresent();
    console.log(
      '✓ SUT02 Complete: Submit time option not available in Workforce Add time dropdown',
    );
  } finally {
    await adminContext.close().catch(() => {});
    if (employeePage) {
      await employeePage.close().catch(() => {});
    }
  }
};

// ---------------------------------------------------------------------------
// SUT03 - Submit Time flow in WFS (P0)
//
// The team member creates and submits their time in Workforce (WFS) with a
// SEPARATE email. Admin credentials are used only by the pre-test cleanup.
// ---------------------------------------------------------------------------
export const validateSubmitTimeFlow = async (
  browser: Browser,
  employeeCredentials: LoginCredentials,
) => {
  // Cleanup runs in the spec's beforeEach so it does not consume the test
  // body's time budget nor leave the body starting against a torn-down browser.
  const employeePage = await browser.newPage();

  try {
    // Steps 1-9: log in to WFS (Workforce) as the team member (separate email)
    // and create the single time entry to be submitted.
    console.log('--- Step 1: Create STE as team member in Workforce ---');
    await openWorkforce(employeePage, employeeCredentials);
    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    const submitTimePage = new SubmitTimePage(employeePage);

    await workforcePage.clickSingleTimeEntryOption();
    await workforcePage.validateSteDrawerOpened();
    await employeePage.waitForTimeout(5000);
    await workforcePage.selectSteCustomerByName(SUBMIT_TIME_TEST_DATA.customer);
    await workforcePage.selectSteServiceByName(SUBMIT_TIME_TEST_DATA.service);
    await workforcePage.checkSteBillable();
    await workforcePage.fillSteDuration(SUBMIT_TIME_TEST_DATA.duration);
    await workforcePage.fillSteNotes(SUBMIT_TIME_TEST_DATA.notes);
    await workforcePage.saveSte();
    await workforcePage.validateSteSaved();

    // Step 10: validate the added entry is reflected in the Time entries list.
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await workforcePage.validateEntryDurationByNotes(
      SUBMIT_TIME_TEST_DATA.notes,
      SUBMIT_TIME_TEST_DATA.duration,
    );
    console.log('✓ Added time entry reflected in Workforce Time entries');

    // Steps 11-13: open the Submit time trowser, validate it, then Cancel.
    await workforcePage.openAddTimeDropdown();
    await workforcePage.submitTimeOption.click();
    // await employeePage.waitForLoadState('networkidle').catch(() => {});
    await employeePage.waitForTimeout(5000);
    await submitTimePage.validateSubmitTimeTrowser();
    await submitTimePage.clickCancel();

    // Steps 14-15: reopen Submit time, choose a date, then Submit.
    await workforcePage.openAddTimeDropdown();
    await workforcePage.submitTimeOption.click();
    // Let the Submit time trowser render for a few seconds before proceeding.
    await employeePage.waitForTimeout(5000);
    await submitTimePage.expectPanelVisible();
    await submitTimePage.selectSubmitThroughDate();
    // With eligible time entries the Submit button must be enabled.
    expect(await submitTimePage.isSubmitButtonEnabled()).toBeTruthy();
    await submitTimePage.clickSubmit();

    // Step 16: validate the confirmation details and Confirm.
    await submitTimePage.validateConfirmationDetails();

    await submitTimePage.clickConfirm();
    console.log('✓ Time submitted and confirmed in Workforce');

    // Step 17: validate the entry now shows "Submitted" status in Time entries.
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await workforcePage.validateEntrySubmittedByNotes(
      SUBMIT_TIME_TEST_DATA.notes,
    );
    console.log(
      '✓ SUT03 Complete: submitted time entry shows Submitted status',
    );
  } finally {
    await employeePage.close().catch(() => {});
  }
};

/** Format a Date as M/D/YYYY (the format the Submit-through date picker uses). */
const formatMDY = (d: Date): string =>
  `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

/**
 * On an already-opened TSheets tab (navigated to the TSheets URL), go to the
 * Approvals report, run it, and reject the first record with more than 0.00
 * hrs. Best-effort against TSheets classic — each sub-step is guarded so it
 * never throws. Returns true when a reject was actually clicked.
 */
export const rejectFirstSubmittedOnTSheets = async (
  tsheetsPage: Page,
  enableRejectIfDisabled = false,
): Promise<boolean> => {
  let rejected = false;
  try {
    await tsheetsPage.waitForLoadState();

    // Dismiss the welcome overlay if present, then wait for the TSheets shell.
    if (
      await tsheetsPage
        .locator(`//div[@class='overlay_content_box']`)
        .isVisible()
        .catch(() => false)
    ) {
      await tsheetsPage
        .getByTitle('Close')
        .click()
        .catch(() => {});
    }
    await expect(tsheetsPage.locator('#addons_shortcut')).toBeVisible({
      timeout: 30000,
    });

    // 2. Navigate to the Approvals tab (main nav — not Approvals Preferences).
    const approvalsNav = tsheetsPage
      .getByRole('link', { name: /^Approve( Time)?$|^Approvals$/i })
      .or(
        tsheetsPage.locator(
          `//a[normalize-space(text())='Approvals' or normalize-space(text())='Approve Time']`,
        ),
      )
      .first();
    await approvalsNav.waitFor({ state: 'visible', timeout: 30000 });
    await approvalsNav.click();
    await tsheetsPage.waitForLoadState();
    await tsheetsPage.waitForTimeout(2000);

    // 3. Run the report for the week containing the added time entry.
    const runReport = tsheetsPage
      .getByRole('button', { name: /run report/i })
      .first();
    if (await runReport.isVisible({ timeout: 15000 }).catch(() => false)) {
      await runReport.click();
      await tsheetsPage.waitForLoadState();
      await tsheetsPage.waitForTimeout(2000);
      console.log('✓ Ran the TSheets Approvals report');
    }

    // 4. Dismiss any popup that appears after running the report.
    //    Prefer the "Dismiss" button; if it isn't present, click the "X" (close).
    const dismissButton = tsheetsPage
      .getByRole('button', { name: /^dismiss$/i })
      .or(
        tsheetsPage.locator(
          `//button[contains(normalize-space(.), 'Dismiss')]`,
        ),
      )
      .first();
    if (await dismissButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dismissButton.click();
      await tsheetsPage.waitForTimeout(1000);
      console.log('✓ Dismissed popup on TSheets Approvals report');
    } else {
      const closeButton = tsheetsPage
        .getByRole('button', { name: /^close$/i })
        .or(tsheetsPage.getByRole('button', { name: /^(x|✕|×)$/i }))
        .or(
          tsheetsPage.locator(
            `//button[@aria-label='Close' or @title='Close']`,
          ),
        )
        .first();
      if (await closeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await closeButton.click();
        await tsheetsPage.waitForTimeout(1000);
        console.log('✓ Closed popup (X) on TSheets Approvals report');
      }
    }

    // 5. Reject the first record that has more than 0.00 hrs. Match rows that
    //    contain a Reject action AND a non-zero hours value. The non-zero regex
    //    (not hasNotText:'0.00') avoids dropping the target row when it also
    //    shows 0.00 in another hours column (OT/PTO/total).
    const rejectRow = tsheetsPage
      .locator('tr')
      .filter({ has: tsheetsPage.getByText('Reject', { exact: true }) })
      .filter({ hasText: /(?!0+\.0+\b)\d+\.\d+/ })
      .first();

    // Case 1: no record with more than 0.00 hrs — nothing to reject.
    if (!(await rejectRow.isVisible({ timeout: 10000 }).catch(() => false))) {
      console.log(
        '  ℹ TSheets report has no record with >0.00 hrs to reject — proceeding',
      );
      return false;
    }

    // The Reject action may be revealed on hover, so scroll + hover first.
    await rejectRow.scrollIntoViewIfNeeded().catch(() => {});
    await rejectRow.hover().catch(() => {});
    await tsheetsPage.waitForTimeout(500);

    // Row-scoped Reject (button OR link OR any element with exact text).
    const rowReject = rejectRow
      .getByRole('button', { name: /^reject$/i })
      .or(rejectRow.getByRole('link', { name: /^reject$/i }))
      .or(rejectRow.getByText('Reject', { exact: true }))
      .first();

    // Case 2: reject control is not enabled.
    let rejectEnabled = await rowReject
      .isEnabled({ timeout: 5000 })
      .catch(() => false);
    if (!rejectEnabled && enableRejectIfDisabled) {
      // Enable Reject by approving then unapproving the record.
      console.log(
        '  Reject disabled — approving then unapproving to enable it',
      );
      // 1. Approve the record.
      const rowApprove = rejectRow
        .getByRole('button', { name: /^approve$/i })
        .or(rejectRow.getByText('Approve', { exact: true }))
        .first();
      await rowApprove.scrollIntoViewIfNeeded().catch(() => {});
      await rowApprove.click();
      await tsheetsPage.waitForTimeout(1500);

      // 2. Confirm by clicking Ok in the popup.
      const okButton = tsheetsPage
        .getByRole('dialog')
        .getByRole('button', { name: /^ok$/i })
        .or(tsheetsPage.getByRole('button', { name: /^ok$/i }))
        .or(
          tsheetsPage.locator(
            `//*[@role='dialog']//button[normalize-space(.)='Ok']`,
          ),
        )
        .first();
      if (await okButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await okButton.click();
        await tsheetsPage.waitForTimeout(1500);
      }

      // 3. Unapprove the record.
      const rowUnapprove = rejectRow
        .getByRole('button', { name: /^unapprove$/i })
        .or(rejectRow.getByText('Unapprove', { exact: true }))
        .first();
      await rowUnapprove.scrollIntoViewIfNeeded().catch(() => {});
      await rowUnapprove.click();
      await tsheetsPage.waitForTimeout(1500);

      // 4. Validate the Reject button is now enabled.
      await expect(rowReject).toBeEnabled({ timeout: 10000 });
      rejectEnabled = true;
      console.log('✓ Reject button enabled after approve/unapprove');
    }

    if (!rejectEnabled) {
      console.log(
        '  ℹ TSheets Reject button is not enabled — no records to reject, proceeding',
      );
      return false;
    }

    // Case 3: eligible record with an enabled Reject — click it + confirm.
    await rowReject.scrollIntoViewIfNeeded().catch(() => {});
    await rowReject.click();
    await tsheetsPage.waitForTimeout(2000);

    const popupReject = tsheetsPage
      .getByRole('dialog')
      .getByRole('button', { name: /^reject$/i })
      .or(
        tsheetsPage.locator(
          `//*[@role='dialog']//button[contains(normalize-space(.), 'Reject')]`,
        ),
      )
      .or(
        tsheetsPage.locator(
          `//*[@role='dialog']//a[normalize-space(.)='Reject']`,
        ),
      )
      .first();
    if (await popupReject.isVisible({ timeout: 5000 }).catch(() => false)) {
      await popupReject.click();
      await tsheetsPage.waitForTimeout(1000);
    }
    rejected = true;
    console.log('✓ Rejected the first record with >0.00 hrs in TSheets');
  } catch (error) {
    console.log(
      `  ⚠ TSheets reject step skipped: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  return rejected;
};

/**
 * Open TSheets in a new tab of the given (already QBO-authenticated) context,
 * navigate to the URL, then run the report and reject the first submitted
 * record. Thin wrapper over rejectFirstSubmittedOnTSheets.
 */
export const openTSheetsAndRejectFirstSubmitted = async (
  adminContext: BrowserContext,
  enableRejectIfDisabled = false,
): Promise<boolean> => {
  const tsheetsPage = await adminContext.newPage();
  await tsheetsPage.goto('https://tsheets.intuit.com', { waitUntil: 'load' });
  return rejectFirstSubmittedOnTSheets(tsheetsPage, enableRejectIfDisabled);
};

// ---------------------------------------------------------------------------
// SUT03 Cleanup - remove the submitted time entry
//
// A submitted entry is locked, so its submission must first be rejected in
// TSheets, then the entry is deleted from QBO Time entries.
// ---------------------------------------------------------------------------
export const cleanupSubmittedTimeEntry = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  enableRejectIfDisabled = false,
  dateRange = 'This week',
  removeAll = false,
) => {
  console.log('--- Cleanup: removing submitted time entry ---');

  // The admin rejects the submitted timesheet in TSheets.
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  try {
    // Login to QBO to establish the Intuit session (needed for TSheets SSO).
    await openQBOTS(adminPage, adminCredentials);

    // TSheets: reject the submitted timesheet for the entry's week. When
    // enableRejectIfDisabled is set, first enable a disabled Reject by
    // approving (Ok) then unapproving the record.
    await openTSheetsAndRejectFirstSubmitted(
      adminContext,
      enableRejectIfDisabled,
    );

    // Delete the (now un-submitted) entry from QBO Time entries.
    const timeEntriesPage = new TimeEntriesPage(adminPage);
    // 1. Navigate to the QBO tab in the browser.
    await adminPage.bringToFront();
    // 2. Open Time entries in the Time tab.
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    // 3. Select the Date range dropdown (window scanned for leftovers).
    await selectDisplayByOption(adminPage, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, dateRange);
    await timeEntriesPage.waitForLoadingToDisappear();
    // 4. Delete the matching time entry record(s) (identified by unique notes).
    //    When removeAll is set, a single window can hold more than one leftover
    //    entry (e.g. residue from a prior run on a different day), so keep
    //    deleting until none remain; otherwise remove only the first match.
    let deletedCount = 0;
    if (removeAll) {
      while (
        await timeEntriesPage.deleteTimeEntryByText(SUBMIT_TIME_TEST_DATA.notes)
      ) {
        deletedCount++;
      }
    } else if (
      await timeEntriesPage.deleteTimeEntryByText(SUBMIT_TIME_TEST_DATA.notes)
    ) {
      deletedCount = 1;
    }
    // 5. Validate no matching entry is displayed after deletion.
    if (deletedCount > 0) {
      await timeEntriesPage.validateTimeEntryNotPresent(
        SUBMIT_TIME_TEST_DATA.notes,
      );
      console.log(
        `✓ cleanup complete (${deletedCount} entr${
          deletedCount === 1 ? 'y' : 'ies'
        } removed)`,
      );
    } else {
      console.log(' cleanup: no matching QBO time entry to delete');
    }
  } finally {
    await adminContext.close().catch(() => {});
  }
};

// ---------------------------------------------------------------------------
// SUT04 - Submitted Time Entry status & locked actions
//
// The team member (Workforce/WFS) creates a time entry (Unapproved, editable),
// submits it, and confirms it becomes Submitted with no edit/delete options.
// Admin credentials are used only by the pre-test cleanup.
// ---------------------------------------------------------------------------
export const validateSubmittedTimeEntryCannotBeEdited = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
) => {
  // 1. Cleanup: remove any leftover submitted entry. Enable a disabled Reject
  //    (approve → Ok → unapprove) so the day is reliably un-submitted. Non-fatal.
  await cleanupSubmittedTimeEntry(browser, adminCredentials, true).catch(
    (error) => {
      console.log(
        `⚠ SUT05 pre-test cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    },
  );

  const employeePage = await browser.newPage();

  try {
    // 2. Login to WFS (Workforce).
    console.log('--- SUT05: Login to Workforce ---');
    await openWorkforce(employeePage, employeeCredentials);

    // 3. Navigate to Time entries inside the Time tab.
    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    const submitTimePage = new SubmitTimePage(employeePage);

    // 4. Create a new time entry using the Single time entry option.
    await workforcePage.clickSingleTimeEntryOption();
    await workforcePage.validateSteDrawerOpened();
    await employeePage.waitForTimeout(5000);
    await workforcePage.selectSteCustomerByName(SUBMIT_TIME_TEST_DATA.customer);
    await workforcePage.selectSteServiceByName(SUBMIT_TIME_TEST_DATA.service);
    await workforcePage.checkSteBillable();
    await workforcePage.fillSteDuration(SUBMIT_TIME_TEST_DATA.duration);
    await workforcePage.fillSteNotes(SUBMIT_TIME_TEST_DATA.notes);
    await workforcePage.saveSte();
    await workforcePage.validateSteSaved();

    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });

    // 5. Validate the created record is displayed with "Unapproved" status.
    await workforcePage.validateEntryStatusByNotes(
      SUBMIT_TIME_TEST_DATA.notes,
      'Unapproved',
    );

    // 6. Validate the record has Edit and Delete options.
    await workforcePage.validateEntryHasEditAndDeleteByNotes(
      SUBMIT_TIME_TEST_DATA.notes,
    );

    // 7. Open the Add time dropdown and select Submit time.
    await workforcePage.openAddTimeDropdown();
    await workforcePage.submitTimeOption.click();
    await employeePage.waitForTimeout(5000);
    await submitTimePage.expectPanelVisible();
    await submitTimePage.selectSubmitThroughDate();

    // 8. Click the Submit button.
    expect(await submitTimePage.isSubmitButtonEnabled()).toBeTruthy();
    await submitTimePage.clickSubmit();

    // 9. Confirm in the popup displayed.
    await submitTimePage.validateConfirmationDetails();
    await submitTimePage.clickConfirm();
    console.log('✓ Time submitted and confirmed in Workforce');

    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });

    // 10. Validate the submitted time entry shows "Submitted" status.
    await workforcePage.validateEntryStatusByNotes(
      SUBMIT_TIME_TEST_DATA.notes,
      'Submitted',
    );

    // 11. Validate the record has no Edit and Delete options.
    await workforcePage.validateEntryNoEditAndDeleteByNotes(
      SUBMIT_TIME_TEST_DATA.notes,
    );

    console.log(
      '✓ SUT05 Complete: submitted entry is Submitted with no edit/delete options',
    );
  } finally {
    await employeePage.close().catch(() => {});
  }
};

// ---------------------------------------------------------------------------
// SUT05 - Approval flow of submitted time
//
// The team member (Workforce/WFS) creates and submits a time entry (so there is
// a submitted record to act on), then the admin approves and unapproves it from
// QBO Approvals. Admin credentials are also used by the pre-test cleanup.
// ---------------------------------------------------------------------------
export const validateApprovalFlowOfSubmittedTime = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
  employeeName: string = SUBMIT_TIME_TEST_DATA.employeeName,
) => {
  // Pre-test cleanup: remove any leftover submitted entry. Non-fatal.
  await cleanupSubmittedTimeEntry(browser, adminCredentials).catch((error) => {
    console.log(
      `⚠ SUT07 pre-test cleanup failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  });

  const employeePage = await browser.newPage();
  let adminPage: Page | undefined;

  try {
    // Steps 1-3: create and submit a time entry in Workforce so there is a
    // submitted record to approve.
    console.log('--- Step 1: Create & submit time entry in Workforce ---');
    await openWorkforce(employeePage, employeeCredentials);
    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    const submitTimePage = new SubmitTimePage(employeePage);

    await workforcePage.clickSingleTimeEntryOption();
    await workforcePage.validateSteDrawerOpened();
    await employeePage.waitForTimeout(5000);
    await workforcePage.selectSteCustomerByName(SUBMIT_TIME_TEST_DATA.customer);
    await workforcePage.selectSteServiceByName(SUBMIT_TIME_TEST_DATA.service);
    await workforcePage.checkSteBillable();
    await workforcePage.fillSteDuration(SUBMIT_TIME_TEST_DATA.duration);
    await workforcePage.fillSteNotes(SUBMIT_TIME_TEST_DATA.notes);
    await workforcePage.saveSte();
    await workforcePage.validateSteSaved();

    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });

    // Submit the entry.
    await workforcePage.openAddTimeDropdown();
    await workforcePage.submitTimeOption.click();
    await employeePage.waitForTimeout(5000);
    await submitTimePage.expectPanelVisible();
    await submitTimePage.selectSubmitThroughDate();
    expect(await submitTimePage.isSubmitButtonEnabled()).toBeTruthy();
    await submitTimePage.clickSubmit();
    await submitTimePage.validateConfirmationDetails();
    await submitTimePage.clickConfirm();

    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await workforcePage.validateEntryStatusByNotes(
      SUBMIT_TIME_TEST_DATA.notes,
      'Submitted',
    );
    console.log('✓ Submitted time entry created in Workforce');

    // Steps 4-6: log in to QBO as the admin and open Approvals for the range.
    console.log('--- Step 2: Approve then unapprove in QBO as Admin ---');
    adminPage = await browser.newPage();
    await openQBOTS(adminPage, adminCredentials);
    await navigateToApprovals(adminPage);
    await selectThisMonthDateRange(adminPage);

    // Steps 7-9: approve the submitted record and validate the Approved status.
    const approved = await approveSingleEmployee(adminPage, employeeName);
    expect(approved).toBeTruthy();
    console.log(`✓ Record approved for "${employeeName}"`);

    // Steps 10-11: unapprove and validate it returns to Submitted status.
    const unapproved = await unapproveSingleEmployee(adminPage, employeeName);
    expect(unapproved).toBeTruthy();
    console.log(
      `✓ SUT07 Complete: Record unapproved (back to Submitted) for "${employeeName}"`,
    );
  } finally {
    await employeePage.close().catch(() => {});
    if (adminPage) {
      await adminPage.close().catch(() => {});
    }
  }
};

// ---------------------------------------------------------------------------
// SUT06 - New time entry cannot be created within the submitted timeline (WFS)
//
// The team member creates + submits an entry, then attempts to create another
// entry on the SAME date and confirms it is blocked. Cleanup runs in the
// spec's beforeEach.
// ---------------------------------------------------------------------------
export const validateNoNewEntryWithinSubmittedTimeline = async (
  browser: Browser,
  employeeCredentials: LoginCredentials,
) => {
  const employeePage = await browser.newPage();

  try {
    // 1. Login to Workforce.
    console.log('--- SUT08: Create & submit an entry in Workforce ---');
    await openWorkforce(employeePage, employeeCredentials);
    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    const submitTimePage = new SubmitTimePage(employeePage);

    // 2-3. Create a new time entry and submit it.
    await createTimeEntryInWorkforce(employeePage, workforcePage);
    await submitTimeInWorkforce(employeePage, workforcePage, submitTimePage);

    // 4. Validate the submission.
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await workforcePage.validateEntryStatusByNotes(
      SUBMIT_TIME_TEST_DATA.notes,
      'Submitted',
    );

    // 5. Open the Single time entry page on the submitted date (the STE date
    //    defaults to today, which is within the submitted timeline).
    console.log('--- SUT08: Open STE on the submitted date ---');
    await workforcePage.clickSingleTimeEntryOption();
    await workforcePage.validateSteDrawerOpened();
    await employeePage.waitForTimeout(3000);

    // 5a. Validate the "Time entry is submitted and cannot be edited" message.
    await workforcePage.validateSteSubmittedCannotEditMessage();

    // 5b. Validate Save, Save and close, and the save-options dropdown are all
    //     disabled.
    await workforcePage.validateSteSaveOptionsDisabled();

    // 6. Close the Single time entry page.
    await workforcePage.cancelSte();
    console.log(
      '✓ SUT08 Complete: STE on the submitted date is read-only (save disabled)',
    );
  } finally {
    await employeePage.close().catch(() => {});
  }
};

// ---------------------------------------------------------------------------
// SUT06-specific cleanup — create a submitted entry in QBO, reject it in
// TSheets (to un-submit the day), then delete it in QBO. Used ONLY by SUT06;
// other tests keep using cleanupSubmittedTimeEntry.
// ---------------------------------------------------------------------------
export const cleanupSubmittedTimeEntryForSUT06 = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
) => {
  console.log('--- SUT06 Cleanup: create → reject → delete (QBO/TSheets) ---');
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  try {
    // 1. Login to QBO.
    await openQBOTS(adminPage, adminCredentials);

    const timeEntriesPage = new TimeEntriesPage(adminPage);
    const ste = new SingleTimeEntryPage(adminPage);

    // 2. Navigate to Time entries inside the Time tab.
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    // 3. Create a single time entry with today's date (default date).
    await clickAddTimeDropdown(adminPage);
    await selectSingleTimeEntryFromAddTime(adminPage, false);
    await adminPage.waitForTimeout(5000);
    await ste.waitForPageReady();
    await ste.handlePopupsInAnyOrder();
    await ste.waitTillNameFieldVisible();
    await ste.openDropdown('Name');
    await adminPage.waitForTimeout(500);
    await ste.clickDropdownOption(1, 'Name');
    await ste.openAndselectCustomerOption(1);
    await ste.openDropdown('Service');
    await adminPage.waitForTimeout(500);
    await ste.clickDropdownOption(1, 'Service');
    await ste.checkCheckboxIfVisible('Billable');
    await ste.enterFieldValue('Duration', SUBMIT_TIME_TEST_DATA.duration);
    await ste.enterNotes(SUT06_NOTES);
    await ste.clickSaveAndCloseButton();
    await ste.validateSuccessToast();
    await timeEntriesPage.waitForLoadingToDisappear();

    // 1. Filter to This week and check the created record's status.
    await selectDisplayByOption(adminPage, 'Date');
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This week');
    await timeEntriesPage.waitForLoadingToDisappear();

    const isSubmitted = await timeEntriesPage.isTimeEntryStatus(
      SUT06_NOTES,
      'Submitted',
    );

    // 2-3. Unapproved → just delete all records and finish.
    if (!isSubmitted) {
      console.log('  Created record is Unapproved — deleting all records');
      await timeEntriesPage.deleteAllTimeEntries();
      await timeEntriesPage.validateNoTimeEntries();
      console.log('✓ SUT06 cleanup complete (unapproved entries deleted)');
      return;
    }

    // 4-5. Submitted → approve then unapprove the record in QBO Approvals.
    console.log('  Created record is Submitted — approve → unapprove → reject');
    await navigateToApprovals(adminPage);
    await selectThisMonthDateRange(adminPage);
    await approveSingleEmployee(
      adminPage,
      SUBMIT_TIME_TEST_DATA.employeeName,
    ).catch(() => {});
    await unapproveSingleEmployee(
      adminPage,
      SUBMIT_TIME_TEST_DATA.employeeName,
    ).catch(() => {});

    // 6. Open a new tab in the browser and enter the TSheets URL.
    const tsheetsPage = await adminContext.newPage();
    await tsheetsPage.goto('https://tsheets.intuit.com', { waitUntil: 'load' });

    // 7. Run the report for the week and reject the record.
    await rejectFirstSubmittedOnTSheets(tsheetsPage, true);

    // 8-9. Back to QBO, Time entries, Date range = This week.
    await adminPage.bringToFront();
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(adminPage, 'Date');
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This week');
    await timeEntriesPage.waitForLoadingToDisappear();

    // 10-11. Delete all records and verify they are removed.
    await timeEntriesPage.deleteAllTimeEntries();
    await timeEntriesPage.validateNoTimeEntries();
    console.log(
      '✓ SUT06 cleanup complete (submitted entry rejected & deleted)',
    );
  } finally {
    await adminContext.close().catch(() => {});
  }
};

// ---------------------------------------------------------------------------
// SUT06 - Admin can edit and delete a submitted time entry in QBO
//
// The team member submits an entry in Workforce; the admin then edits (save)
// and deletes it from QBO Time entries.
// ---------------------------------------------------------------------------
export const validateAdminCanEditDeleteSubmittedEntry = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
) => {
  await cleanupSubmittedTimeEntryForSUT06(browser, adminCredentials).catch(
    (error) => {
      console.log(
        `⚠ SUT06 pre-test cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    },
  );

  const employeePage = await browser.newPage();
  let adminContext: BrowserContext | undefined;

  try {
    // Employee creates + submits in Workforce.
    console.log('--- SUT06 Step 1: Create & submit entry in Workforce ---');
    await openWorkforce(employeePage, employeeCredentials);
    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    const submitTimePage = new SubmitTimePage(employeePage);
    await createTimeEntryInWorkforce(
      employeePage,
      workforcePage,
      SUT06_NOTES,
      undefined,
      {
        resilientSave: true,
      },
    );
    await submitTimeInWorkforce(employeePage, workforcePage, submitTimePage, {
      waitForSummaryReady: true,
    });

    // Admin edits + deletes in QBO.
    console.log('--- SUT06 Step 2: Admin edits & deletes in QBO ---');
    adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await openQBOTS(adminPage, adminCredentials);

    const timeEntriesPage = new TimeEntriesPage(adminPage);
    const ste = new SingleTimeEntryPage(adminPage);
    // 2-3. Open Time entries and select the current month.
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(adminPage, 'Date');
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    // 4. Validate the submitted entry is present.
    await timeEntriesPage.validateTimeEntryPresent(SUT06_NOTES);

    // 5. Edit the submitted entry and save it.
    await timeEntriesPage.clickEditForTimeEntryByText(SUT06_NOTES);
    await adminPage.waitForTimeout(5000);
    await ste.waitForPageReady();
    await ste.enterFieldValue('Duration', '8:00');
    await ste.clickSaveAndCloseButton();
    await ste.validateSuccessToast();
    await timeEntriesPage.waitForLoadingToDisappear();
    console.log('✓ Submitted entry edited & saved by admin in QBO');

    // 6. Delete the submitted entry and validate it is gone.
    const deleted = await timeEntriesPage.deleteTimeEntryByText(SUT06_NOTES);
    expect(deleted).toBeTruthy();
    await timeEntriesPage.validateTimeEntryNotPresent(SUT06_NOTES);
    console.log(
      '✓ SUT06 Complete: submitted entry edited & deleted by admin in QBO',
    );
  } finally {
    await employeePage.close().catch(() => {});
    if (adminContext) {
      await adminContext.close().catch(() => {});
    }
  }
};

// ---------------------------------------------------------------------------
// SUT08 - Submit button enable/disable in the Submit time trowser (WFS)
//
// With eligible time in the current week only, the Submit button is disabled
// for a previous-week date (0 hrs) and enabled for a current-week date.
// ---------------------------------------------------------------------------
export const validateSubmitButtonEnableDisable = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
) => {
  // Widen the cleanup window to "This month" so leftover entries in the
  // *previous* week are also removed — SUT03 later asserts the prior week has
  // zero eligible hours, which a stale prior-week entry would break.
  await cleanupSubmittedTimeEntry(
    browser,
    adminCredentials,
    false,
    'This month',
    true,
  ).catch((error) => {
    console.log(
      `⚠ SUT03 pre-test cleanup failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  });

  const employeePage = await browser.newPage();

  try {
    // 1-2. Login to WFS and open Time entries; create eligible time this week.
    console.log('--- SUT03: Create a current-week entry in Workforce ---');
    await openWorkforce(employeePage, employeeCredentials);
    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    const submitTimePage = new SubmitTimePage(employeePage);
    await createTimeEntryInWorkforce(employeePage, workforcePage);

    // 3. Select the current week.
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This week',
    });

    // 5. Open the Add time dropdown and select Submit time.
    await workforcePage.openAddTimeDropdown();
    await workforcePage.submitTimeOption.click();
    await employeePage.waitForTimeout(5000);
    await submitTimePage.expectPanelVisible();

    // 6-8. Previous-week date -> zero hrs -> Submit disabled.
    const previousWeek = new Date();
    previousWeek.setDate(previousWeek.getDate() - 7);
    await submitTimePage.selectSubmitThroughDate(formatMDY(previousWeek));
    // Let the trowser recalculate the eligible hours for the selected date.
    await employeePage.waitForTimeout(5000);
    expect(await submitTimePage.isSubmitSummaryZero()).toBeTruthy();
    await employeePage.waitForTimeout(2000);
    expect(await submitTimePage.isSubmitButtonEnabled()).toBeFalsy();
    console.log('✓ Submit button disabled for previous week (zero hrs)');

    // 9-11. Current-week date -> has hrs -> Submit enabled.
    await submitTimePage.selectSubmitThroughDate(formatMDY(new Date()));
    // Let the trowser recalculate the eligible hours for the selected date.
    await employeePage.waitForTimeout(5000);
    expect(await submitTimePage.isSubmitSummaryZero()).toBeFalsy();
    expect(await submitTimePage.isSubmitButtonEnabled()).toBeTruthy();
    console.log(
      '✓ SUT03 Complete: Submit button enabled for current week (has hrs)',
    );
  } finally {
    await employeePage.close().catch(() => {});
  }
};

// ---------------------------------------------------------------------------
// SUT09 - Delete a submitted time entry in WFS after TSheets reject
//
// The team member submits an entry, the admin rejects it in TSheets, then the
// team member deletes the (now un-submitted) entry in Workforce.
// ---------------------------------------------------------------------------
export const validateDeleteSubmittedEntryInWFS = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
  employeeCredentials: LoginCredentials,
) => {
  await cleanupSubmittedTimeEntry(browser, adminCredentials).catch((error) => {
    console.log(
      `⚠ SUT09 pre-test cleanup failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  });

  const employeePage = await browser.newPage();
  let adminContext: BrowserContext | undefined;

  try {
    // 1-4. Create + submit an entry in Workforce; confirm Submitted status.
    console.log('--- SUT09 Step 1: Create & submit entry in Workforce ---');
    await openWorkforce(employeePage, employeeCredentials);
    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    const submitTimePage = new SubmitTimePage(employeePage);
    await createTimeEntryInWorkforce(employeePage, workforcePage);
    await submitTimeInWorkforce(employeePage, workforcePage, submitTimePage);
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await workforcePage.validateEntryStatusByNotes(
      SUBMIT_TIME_TEST_DATA.notes,
      'Submitted',
    );

    // 5-9. Admin rejects the submission in TSheets (new window).
    console.log('--- SUT09 Step 2: Reject the submission in TSheets ---');
    adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await openQBOTS(adminPage, adminCredentials);
    const rejected = await openTSheetsAndRejectFirstSubmitted(adminContext);
    console.log(`  TSheets reject performed: ${rejected}`);
    await adminContext.close().catch(() => {});
    adminContext = undefined;

    // 10-13. Back in WFS: reload so the un-submitted status is fetched fresh
    //        (the page was opened before the reject), then confirm the entry is
    //        no longer Submitted.
    console.log('--- SUT09 Step 3: Delete the rejected entry in Workforce ---');
    await employeePage.bringToFront();
    await employeePage.reload({ waitUntil: 'load' }).catch(() => {});
    await employeePage.waitForTimeout(2000);
    await navigateToWorkforceTimeEntries(employeePage);
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await workforcePage.validateEntryNotSubmittedByNotes(
      SUBMIT_TIME_TEST_DATA.notes,
    );

    // 14-16. Delete the entry and validate it is removed.
    const deleted = await workforcePage.tryDeleteEntryByNotes(
      SUBMIT_TIME_TEST_DATA.notes,
    );
    expect(deleted).toBeTruthy();
    console.log(
      '✓ SUT09 Complete: rejected time entry deleted successfully in WFS',
    );
  } finally {
    await employeePage.close().catch(() => {});
    if (adminContext) {
      await adminContext.close().catch(() => {});
    }
  }
};

/** Notes carried by the SUT10 Weekly time entry (flow + cleanup). */
const SUT10_WTE_NOTES = 'Weekly Time Entries';

// ---------------------------------------------------------------------------
// SUT10 Cleanup - reject the submitted Weekly time entry in TSheets, then
// delete the (now un-submitted) WTE records from QBO Time entries.
//
// A WTE creates one row per weekday, so all available records in the month are
// removed. Runs as the SUT10 spec's pre-test beforeEach.
// ---------------------------------------------------------------------------
export const cleanupSubmittedTimeEntryForSUT10 = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
) => {
  console.log('--- SUT10 Cleanup: reject (TSheets) → delete WTE (QBO) ---');
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  try {
    // 1. Login to QBO to establish the Intuit session (needed for TSheets SSO).
    await openQBOTS(adminPage, adminCredentials);

    // 2. Reject the submitted timesheet for the entry's week in TSheets.
    await openTSheetsAndRejectFirstSubmitted(adminContext);

    // 3. Back in QBO Time entries, widen the view to the whole month so every
    //    available record is in scope for deletion.
    const timeEntriesPage = new TimeEntriesPage(adminPage);
    await adminPage.bringToFront();
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(adminPage, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    // 4. Delete all available time entry records in the view.
    const deleted = await timeEntriesPage.deleteAllTimeEntries();
    if (deleted > 0) {
      console.log('✓ SUT10 cleanup complete (WTE rows rejected & removed)');
    } else {
      console.log('  ℹ SUT10 cleanup: no WTE record to delete');
    }
  } finally {
    await adminContext.close().catch(() => {});
  }
};

// ---------------------------------------------------------------------------
// SUT11 Cleanup - reject the submitted Time Clock entry in TSheets, then delete
// the (now un-submitted) record from QBO Time entries. Time Clock entries carry
// no notes, so every row in the current week is removed. Runs as the SUT11
// spec's pre-test beforeEach.
// ---------------------------------------------------------------------------
export const cleanupSubmittedTimeEntryForSUT11 = async (
  browser: Browser,
  adminCredentials: LoginCredentials,
) => {
  console.log(
    '--- SUT11 Cleanup: reject (TSheets) → delete Time Clock (QBO) ---',
  );
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  try {
    // 1. Login to QBO to establish the Intuit session (needed for TSheets SSO).
    await openQBOTS(adminPage, adminCredentials);

    // 2. Reject the submitted timesheet for the entry's week in TSheets.
    await openTSheetsAndRejectFirstSubmitted(adminContext);

    // 3. Back in QBO Time entries, select the current week.
    const timeEntriesPage = new TimeEntriesPage(adminPage);
    await adminPage.bringToFront();
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await selectDisplayByOption(adminPage, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(adminPage);
    await selectDateRangeOption(adminPage, 'This week');
    await timeEntriesPage.waitForLoadingToDisappear();

    // 4. The Time Clock entry has no notes to filter on — clear the week view.
    const deleted = await timeEntriesPage.deleteAllTimeEntries();
    if (deleted > 0) {
      console.log(
        '✓ SUT11 cleanup complete (Time Clock entries rejected & removed)',
      );
    } else {
      console.log('  ℹ SUT11 cleanup: no Time Clock record to delete');
    }
  } finally {
    await adminContext.close().catch(() => {});
  }
};

// ---------------------------------------------------------------------------
// SUT10 - Submit time for a Weekly time entry (WTE) in WFS
//
// The team member creates + submits a Weekly time entry in Workforce, confirms
// the Submitted status, then re-opens the WTE and confirms the submitted
// (locked) weekly record cannot be edited.
// ---------------------------------------------------------------------------
export const validateSubmitTimeForWTE = async (
  browser: Browser,
  employeeCredentials: LoginCredentials,
) => {
  const WTE_NOTES = SUT10_WTE_NOTES;
  const employeePage = await browser.newPage();

  try {
    // 1. Login to WFS and open Time entries.
    console.log('--- SUT10: Create a Weekly time entry in Workforce ---');
    await openWorkforce(employeePage, employeeCredentials);
    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    const submitTimePage = new SubmitTimePage(employeePage);

    // 2-3. Open the Weekly time entry drawer and fill the first row (Mon–Fri)
    //      with a billable rate and the 'Weekly Time Entries' note, then Save
    //      and close.
    await workforcePage.clickWeeklyTimeEntryOption();
    await workforcePage.validateWteDrawerOpened();
    await workforcePage.waitForWteTimesheetReady();
    const { customerName } =
      await workforcePage.fillWteFirstRowWeekdaysWithDetailPanel({
        hoursPerDay: '8',
        notes: WTE_NOTES,
        billableRate: '50',
        serviceOptionIndex: 1,
        customerName: SUBMIT_TIME_TEST_DATA.customer,
      });
    // WTE list rows are keyed by customer, not by the detail-panel notes.
    const wteCustomer = customerName ?? SUBMIT_TIME_TEST_DATA.customer;

    // 4. Validate the added weekly entry is reflected in the Time entries list.
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await workforcePage.validateEntryDurationByCustomer(wteCustomer, '8.00');
    console.log('✓ Weekly time entry reflected in Workforce Time entries');

    // 5-8. Open the Submit time trowser, validate it, submit and confirm.
    await workforcePage.openAddTimeDropdown();
    await workforcePage.submitTimeOption.click();
    await employeePage.waitForTimeout(5000);
    await submitTimePage.validateSubmitTimeTrowser();
    await submitTimePage.selectSubmitThroughDate();
    expect(await submitTimePage.isSubmitButtonEnabled()).toBeTruthy();
    await submitTimePage.clickSubmit();
    await submitTimePage.validateConfirmationDetails();
    await submitTimePage.clickConfirm();
    console.log('✓ Weekly time submitted and confirmed in Workforce');

    // 9. Validate the entry now shows the Submitted status in the table.
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This month',
    });
    await workforcePage.validateEntryStatusByCustomer(wteCustomer, 'Submitted');

    // 10. Validate the submitted weekly time entry cannot be edited — the Edit
    //     option is not available on the record's row.
    console.log('--- SUT10: Validate the submitted weekly entry is locked ---');
    await workforcePage.validateEntryNoEditByCustomer(wteCustomer);

    // 11. Validate the submitted weekly time entry cannot be deleted — the
    //     Delete option is not available on the record's row.
    await workforcePage.validateEntryNoDeleteByCustomer(wteCustomer);
    console.log(
      '✓ SUT10 Complete: WTE submitted (Submitted status) with no Edit/Delete options',
    );
  } finally {
    await employeePage.close().catch(() => {});
  }
};

// ---------------------------------------------------------------------------
// SUT11 - Submit time for a Time Clock entry in WFS
//
// The team member creates a time-clock entry (Clock in → wait → Clock out) in
// Workforce, then submits it and confirms the Submitted status. A short wait
// between clock in and clock out lets the entry accrue non-zero time so the
// Submit button is enabled.
// ---------------------------------------------------------------------------
export const validateSubmitTimeForTimeClock = async (
  browser: Browser,
  employeeCredentials: LoginCredentials,
) => {
  const employeePage = await browser.newPage();

  try {
    // 1-3. Login to WFS, open Time entries and create a Time Clock entry via the
    //      Clock in / Clock out buttons.
    console.log('--- SUT11: Create a Time Clock entry in Workforce ---');
    await openWorkforce(employeePage, employeeCredentials);
    const workforcePage = await navigateToWorkforceTimeEntries(employeePage);
    const submitTimePage = new SubmitTimePage(employeePage);

    await workforcePage.validateClockInButton();
    await workforcePage.clickClockIn();
    await employeePage.waitForTimeout(3000);

    // Select a customer/project for the running timer, then confirm Clock in.
    const options = await workforcePage.getCustomerProjectOptions(employeePage);
    expect(options.length).toBeGreaterThan(0);
    await workforcePage.selectCustomerProject(employeePage, options[0]);
    await TimeClockPage.clickOnClockInButton(employeePage);
    await employeePage.waitForTimeout(2000);

    // Let the timer run ~65s so the entry accrues non-zero time (0h 1m+) and is
    // therefore eligible for submission.
    console.log('--- SUT11: Waiting for the timer to accrue time ---');
    await employeePage.waitForTimeout(65000);

    await workforcePage.clickClockOut();
    await workforcePage.validateClockOutSuccess();
    console.log('✓ Time Clock entry created via Clock in/out');

    // 4. Validate the added time-clock entry is reflected in the list.
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This week',
    });
    expect(await workforcePage.getTimeEntryCount()).toBeGreaterThan(0);
    console.log('✓ Time Clock entry reflected in Workforce Time entries');

    // 5-8. Open the Submit time trowser, validate it, submit and confirm.
    await workforcePage.openAddTimeDropdown();
    await workforcePage.submitTimeOption.click();
    await employeePage.waitForTimeout(5000);
    await submitTimePage.validateSubmitTimeTrowser();
    await submitTimePage.selectSubmitThroughDate();
    // Wait for the trowser's eligible-hours summary to load (retrying through
    // the transient "An error occurred" banner) rather than asserting eagerly.
    expect(await submitTimePage.waitForSubmitSummaryReady()).toBeTruthy();
    await submitTimePage.clickSubmit();
    await submitTimePage.validateConfirmationDetails();
    await submitTimePage.clickConfirm();
    console.log('✓ Time Clock time submitted and confirmed in Workforce');

    // 9. Validate a Submitted entry now appears in the table.
    await applyWorkforceTimeEntriesFilters(employeePage, {
      displayBy: 'Date',
      dateRange: 'This week',
    });
    await workforcePage.validateAnyEntrySubmitted();
    console.log('✓ SUT11 Complete: Time Clock entry shows Submitted status');
  } finally {
    await employeePage.close().catch(() => {});
  }
};
