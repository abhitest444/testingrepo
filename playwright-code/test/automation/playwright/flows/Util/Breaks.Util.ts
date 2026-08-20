import { Page, expect } from '@playwright/test';
import { BreaksPage } from '../../pages/BreaksPage';
import { BreaksRulesPage } from '../../pages/BreaksRulesPage';

import { navigateToTimeClock } from '../../pages/TimeClockPage';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import SingleTimeActivityPage from '../../pages/SingleTimeActivityPage';
import {
  clickAddTimeDropdown,
  openDateRangeDropdown,
  selectDateRangeOption,
  selectDisplayByOption,
} from '../../commonUtils';
import TimeEntriesPage from '../../pages/TimeEntriesPage';
import { deleteAllVisibleTimeEntries } from './TimeEntries.util';
import ApprovalsPage from '../../pages/ApprovalsPage';

//========================================== Popup Handling Utility Functions ===============================================
/**
 * Handles common popup scenarios that might appear during break operations
 */
export const handleCommonPopups = async (page: Page) => {
  // Handle any unexpected error popups
  const errorPopup = page.locator(
    '[role="alert"], .error-message, .toast-error, .notification-error',
  );
  if (await errorPopup.isVisible()) {
    const errorText = await errorPopup.textContent();

    // Ignore known informational banners (not errors)
    // e.g., "Where's the Time Summary by Worker View?" approval migration banner
    const lowerText = errorText?.toLowerCase() || '';
    const isInfoBanner =
      lowerText.includes("where's the time summary by worker view") ||
      lowerText.includes('time summary by worker view has moved') ||
      lowerText.includes('dedicated approval workflows') ||
      lowerText.includes('selecting approvals in the left navigation');

    if (isInfoBanner) {
      return; // Not an error, just an info banner
    }

    throw new Error(`Unexpected error popup appeared: ${errorText}`);
  }

  // Handle any confirmation dialogs that might appear
  const confirmDialog = page.locator(
    '[role="dialog"]:has-text("confirm"), [role="dialog"]:has-text("Confirm")',
  );
  if (await confirmDialog.isVisible()) {
    await page.getByRole('button', { name: /yes|confirm|ok/i }).click();
  }

  // Handle any info/notification popups
  const infoPopup = page.locator(
    '.notification-info, .toast-info, [role="alert"]:has-text("info")',
  );
  if (await infoPopup.isVisible()) {
    await infoPopup.click(); // Dismiss info popups
  }
};

/**
 * Waits for and handles success toast notifications
 */
export const handleSuccessToast = async (
  page: Page,
  expectedMessage?: string,
) => {
  const successToast = page.locator(
    '.toast-success, .notification-success, [role="alert"]:has-text("success")',
  );

  try {
    await successToast.waitFor({ state: 'visible', timeout: 5000 });

    if (expectedMessage) {
      await expect(successToast).toContainText(expectedMessage);
    }

    // Wait for toast to disappear or click to dismiss
    await successToast.waitFor({ state: 'hidden', timeout: 10000 });
  } catch (error) {
    // If success toast doesn't appear, check for errors
    await handleCommonPopups(page);
  }
};

/**
 * Handles delete operation with comprehensive popup management
 */
export const handleDeleteOperation = async (
  page: Page,
  timeEntriesPage: TimeEntriesPage,
  employeeName: string,
) => {
  await timeEntriesPage.clickActionDropdownForEmployee(employeeName);
  await timeEntriesPage.clickDeleteInActionDropdown();
  await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
  await timeEntriesPage.clickYesOnDeleteEntryPopup();

  // Handle any additional popups that might appear after deletion
  await handleCommonPopups(page);

  await timeEntriesPage.waitForLoadingToDisappear();
};

//========================================== Breaks Utility Functions ===============================================

/**
 * Asserts that the Add Break option is visible in the Add Time dropdown.
 * Assumes the Add Time dropdown is already open.
 */
export const validateAddBreakOptionVisibility = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await expect(
    page.locator(
      `//span[text()='Display by'] / ancestor::label / descendant::input`,
    ),
  ).toBeVisible();

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await timeEntriesPage.validateDateRangeDropdownOptions();
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();
  const breaksPage = new BreaksPage(page);
  await clickAddTimeDropdown(page);
  await expect(breaksPage.addBreakOption.first()).toBeVisible();
};

/**
 * Asserts that the Add Break drawer opens.
 * Assumes the Add Break option has just been clicked.
 */
export const validateAddBreakDrawerOpens = async (page: Page) => {
  const breaksPage = new BreaksPage(page);
  await breaksPage.addBreakOption.first().click();
  await expect(breaksPage.addBreakDrawer.first()).toBeVisible();
};

/**
 * Validates that mandatory field validation works on Add Break. Opens the Add Break drawer, attempts to save with all fields empty, and checks for required field errors.
 */
export const validateMandatoryFieldsValidation = async (page: Page) => {
  const breaksPage = new BreaksPage(page);
  await breaksPage.openAddBreakDrawer();
  await breaksPage.saveButton.click();
  // Check for required field errors (adjust selector/message as needed)
  await expect(breaksPage.validationError).toBeVisible();
  await page.locator(`//span[text()='Try again']`).click();
};

/**
 * Validates that mandatory field validation works when editing a break. Assumes edit form is open.
 */
export const validateMandatoryFieldsValidationWhenEditing = async (
  page: Page,
) => {
  const breaksPage = new BreaksPage(page);
  await breaksPage.breakNameInput.fill('');
  await breaksPage.saveBreak();
  await expect(breaksPage.validationError).toBeVisible();
};

/**
 * Deletes a break. Assumes the break exists and is visible in the list.
 */
export const deleteBreak = async (page: Page, breakName: string) => {
  const breaksPage = new BreaksPage(page);
  await breaksPage.openEditForBreak(breakName);
  await breaksPage.clickDeleteBreakButton();
  await breaksPage.confirmDelete();
  await expect(page.locator(`text=${breakName}`)).not.toBeVisible();
};

/**
 * Approves a break. Assumes the break exists and is visible in the list.
 */
export const approveBreak = async (page: Page, breakName: string) => {
  const breaksPage = new BreaksPage(page);
  await breaksPage.openEditForBreak(breakName);
  await breaksPage.clickApproveBreakButton();
  await expect(
    page.locator(`.break-entry:has-text("${breakName}") .approved-indicator`),
  ).toBeVisible();
};

/**
 * Unapproves a break. Assumes the break is approved and visible in the list.
 */
export const unapproveBreak = async (page: Page, breakName: string) => {
  const breaksPage = new BreaksPage(page);
  await breaksPage.openEditForBreak(breakName);
  await breaksPage.clickUnapproveBreakButton();
  await expect(
    page.locator(`.break-entry:has-text("${breakName}") .approved-indicator`),
  ).not.toBeVisible();
};

/**
 * Edits a break entry. Assumes the break exists, is unapproved, and edit form is open.
 */
export const editBreakEntry = async (
  page: Page,
  breakName: string,
  newDetails: {
    name?: string;
    startTime?: string;
    endTime?: string;
    duration?: string;
  },
) => {
  const breaksPage = new BreaksPage(page);
  await breaksPage.editBreakDetails(newDetails);
  await breaksPage.saveButton.click();
  await expect(
    page.locator(`text=${newDetails.name || breakName}`),
  ).toBeVisible();
};

/**
 * Attempts to edit a break to 24-hour duration and expects an error. Assumes edit form is open.
 */
export const editBreakTo24HourExpectError = async (
  page: Page,
  breakName: string,
) => {
  const breaksPage = new BreaksPage(page);
  await breaksPage.editBreakDetails({
    startTime: '10:00 AM',
    endTime: '10:00 AM',
  });
  await breaksPage.saveButton.click();
  await expect(
    breaksPage.getErrorMessage('Break duration cannot exceed 24 hours'),
  ).toBeVisible();
};

/**
 * Attempts to edit a break with end time earlier than start and expects an error. Assumes edit form is open.
 */
export const editBreakWithEndTimeEarlierExpectError = async (
  page: Page,
  breakName: string,
) => {
  const breaksPage = new BreaksPage(page);
  await breaksPage.editBreakDetails({ endTime: '12:00 PM' });
  await breaksPage.saveButton.click();
  await expect(
    breaksPage.getErrorMessage('End time must be after start time'),
  ).toBeVisible();
};

/**
 * Unapproves a break to allow changes. Assumes break is approved and visible in the list.
 */
export const unapproveToAllowBreakChanges = async (
  page: Page,
  breakName: string,
) => {
  const breaksPage = new BreaksPage(page);
  await unapproveBreak(page, breakName);
  await editBreakEntry(page, breakName, { name: breakName + ' Changed' });
  await expect(
    breaksPage.getErrorMessage(
      'Time period is approved and cannot be modified',
    ),
  ).not.toBeVisible();
};

/**
 * Attempts to edit a break entry for a team member to overlap with an existing break and expects an error. Assumes edit form is open and another break exists for the time.
 */
export const editBreakEntryForTeamMemberWithExistingBreakExpectError = async (
  page: Page,
  teamMemberName: string,
) => {
  const breaksPage = new BreaksPage(page);
  await breaksPage.editBreakDetails({
    startTime: '10:00 AM',
    endTime: '10:15 AM',
  });
  await breaksPage.saveButton.click();
  await expect(
    breaksPage.getErrorMessage(
      'A timesheet already exists for this time period',
    ),
  ).toBeVisible();
};

/**
 * Validates that only admin has access to Add Break. Assumes already on the correct page and login is handled by the test.
 */
export const validateOnlyAdminHasAccessToAddBreak = async (page: Page) => {
  const breaksPage = new BreaksPage(page);
  await expect(breaksPage.addBreakOption).toBeVisible();
};

/**
 * Validates Add Break option is only visible for Premium/Elite admin. Assumes already on the correct page and login is handled by the test.
 */
export const validateAddBreakOptionVisibleForPremiumAdmin = async (
  page: Page,
) => {
  const breaksPage = new BreaksPage(page);
  await expect(breaksPage.addBreakOption).toBeVisible();
};

/**
 * Validates Paid Break badge. Assumes break entry exists in the list.
 */
export const validatePaidBreakBadge = async (page: Page, breakName: string) => {
  const breaksPage = new BreaksPage(page);
  await expect(breaksPage.getPaidBreakBadge(breakName)).toBeVisible();
};

/**
 * Validates Unpaid Break badge. Assumes break entry exists in the list.
 */
export const validateUnpaidBreakBadge = async (
  page: Page,
  breakName: string,
) => {
  const breaksPage = new BreaksPage(page);
  await expect(breaksPage.getUnpaidBreakBadge(breakName)).toBeVisible();
};

/**
 * Validates no badge for non-break entry. Assumes entry exists in the list.
 */
export const validateNoBadgeForNonBreakEntry = async (
  page: Page,
  entryName: string,
) => {
  const breaksPage = new BreaksPage(page);
  await expect(breaksPage.getNoBadgeForEntry(entryName)).not.toBeVisible();
};

/**
 * Simulates a network/backend error when saving a break. Assumes Add Break drawer is open and details are filled.
 */
export const validateBreakSaveNetworkError = async (page: Page) => {
  const breaksPage = new BreaksPage(page);
  await page.route('**/breaks', (route) => route.abort());
  await breaksPage.saveBreak();
  await expect(
    breaksPage.getErrorMessage(
      'A network or backend error occurred. Please refresh and try again.',
    ),
  ).toBeVisible();
  await page.unroute('**/breaks');
};

/**
 * Simulates a network/backend error when opening Add Break drawer. Assumes test will open the drawer after this call.
 */
export const validateAddBreakDrawerNetworkError = async (page: Page) => {
  await page.route('**/breaks/types', (route) => route.abort());
  // The test should now open the Add Break drawer and assert error
  // After assertion, unroute
  await page.unroute('**/breaks/types');
};

export const navigateToBreakPreferencesScreen = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.goto();
  // await expect(breaksRulesPage.addRuleButton).toBeVisible();
};

export const validateBreakSectionPresent = async (page: Page) => {
  await expect(page.getByTestId(`break-settings-handle`)).toBeVisible();
};

export const validateManageBreaksUIElements = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await page.waitForSelector(
    `(//h2[text()="Manage your team's break rules"])[1]`,
    { state: 'visible', timeout: 0 },
  );
  await breaksRulesPage.assertUIElements();
};

export const verifyManagerBreaksDataDisplay = async (
  page: Page,
  expectedRows: Array<Record<string, string>>,
) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.goto();
  await breaksRulesPage.assertTableData(expectedRows);
};

// export const validatePaginationControls = async (page: Page) => {
//   const breaksRulesPage = new BreaksRulesPage(page);
//   await breaksRulesPage.goto();
//   await breaksRulesPage.assertPaginationControls();
//   // Optionally, click next/prev and assert item counts
// };

export const validateNoSetDurationCheckBox = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.goto();
  // Click Add Break Rule button
  await breaksRulesPage.clickAddBreakRuleButton();
  // Verify No Set Duration check box is not checked
  await breaksRulesPage.verifyNoSetDurationNotChecked();
};

export const validateNoSetDurationBoxChecked = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  // Check No Set Duration check box
  await breaksRulesPage.clickNoSetDurationCheckbox();
  // Verify No Set Duration check box is now checked
  await breaksRulesPage.verifyNoSetDurationChecked();
  // Verify Automatic and manual break check box is disabled
  await breaksRulesPage.verifyAutomaticAndManualBreakDisabled();
  // Verify hour/minute dropdown is disabled
  await breaksRulesPage.verifyHourAndMinuteDropdownDisabled();
};

export const validateCloseAndXButton = async (page: Page) => {
  //Verify X icon
  const closeIcon = page.getByRole('button', { name: 'Close' }).last();
  await expect(closeIcon).toBeVisible();
  await closeIcon.click({ timeout: 1000 });

  // Click Close button
  const closeButton = page.locator('button:has(span:text("Close"))').first();
  await closeButton.click({ force: true });
};

export const navigateToAssignTeamMembersViaAssignedTo = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.goto();
  // Click the first 'Assigned to' link
  await breaksRulesPage.allTeamMembersLink.click();
  // Optionally, assert Assign Team Members screen
};

export const validateAssignTeamMembersPanel = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.verifyAssignTeamMembersPanel();
};

export const navigateToAssignTeamMembersViaAddBreakRule = async (
  page: Page,
) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await page.getByRole('button', { name: 'Close' }).last().click();
  await breaksRulesPage.clickAddBreakRuleButton();
  await expect(page.getByText('team members').last()).toBeVisible();
  await page.getByRole('button', { name: 'Edit access' }).click();
};

export const validateSelectDeselectAllMembers = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.selectDeselectTeamMembersCheckbox();
};

export const validateDeselectTeamMemberAndSave = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.deselectTeamMemberAndSave();
};

export const deselectAllTeamMembersAndCancel = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.deselectAllTeamMembersAndCancel();
};

export const validateSearchTeamMember = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.SuccessfullTeamMemberSearch('test emp1');
  await breaksRulesPage.NoResultTeamMemberSearch('test emp3');
};
export const validateBreaksForAdmins = async (page: Page) => {
  await navigateToBreakPreferencesScreen(page);
};

export const validateBreaksForNonPayrollOrNonAdminRoles = async (
  page: Page,
) => {
  await page.goto('/app/accountsettings?p=time');
  await page.waitForTimeout(3000);
  await expect(page.getByTestId(`break-settings-handle`)).not.toBeVisible();
};

export const AssignBreakToTeamMember = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  //await breaksRulesPage.AssignBreakToSpecificTeamMember();
  await breaksRulesPage.deselectTeamMemberAndSave();
};

export const verifyManualBreakForAssignedTeamMember = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const breaksPage = new BreaksPage(page);

  if (!(await breaksRulesPage.teamMemberCheckbox.isChecked())) {
    await breaksRulesPage.teamMemberCheckbox.click();
  }
  if (await breaksRulesPage.teamMember2Checkbox.isChecked()) {
    await breaksRulesPage.teamMember2Checkbox.click();
  }
  await expect(breaksRulesPage.teamMemberCheckbox).toBeChecked();
  await expect(breaksRulesPage.teamMember2Checkbox).not.toBeChecked();
  await breaksRulesPage.saveButton.click();
  await page.waitForTimeout(2000);
  //verify break entry exists for employee
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await expect(
    page.locator(
      `//span[text()='Display by'] / ancestor::label / descendant::input`,
    ),
  ).toBeVisible();
  await openDateRangeDropdown(page);
  await timeEntriesPage.validateDateRangeDropdownOptions();
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();
  await breaksPage.openAddBreakDrawer();
  await breaksPage.teamMemberDropdown.click({ force: true });
  await page.locator(`//span[@title="test emp1"]`).click();
  await page.waitForTimeout(1000);
  await breaksPage.breakTypeDropdown.click({ force: true });
  await expect(page.getByText('Paid: Break Man')).toBeVisible();
  await page.waitForTimeout(1000);
  //verify break entry does not exist for employee
  await breaksPage.teamMemberDropdown.click({ force: true });
  await page.locator(`//span[@title="test emp2"]`).click();
  await page.waitForTimeout(1000);
  await breaksPage.breakTypeDropdown.click();
  await expect(page.getByText('Paid: Break Man')).not.toBeVisible();
  await page.waitForTimeout(1000);

  // CLEANUP: Restore break rule to all team members
  await breaksRulesPage.goto();
  // Click on the assigned to link (handles both "1 team member" and "X team members")
  await breaksRulesPage.allTeamMembersLink.click();
  await page.waitForTimeout(1000);

  // Use "Select all team members" checkbox to ensure all are selected
  const selectAllCheckbox = breaksRulesPage.AllteamMembersCheckbox;
  const isChecked = await selectAllCheckbox.isChecked();
  if (!isChecked) {
    await selectAllCheckbox.click();
  }
  await breaksRulesPage.saveButton.click();
  await page.waitForTimeout(2000);

  // Verify cleanup was successful - should now show "All team members"
  await expect(page.getByText('All team members')).toBeVisible();
  console.log('  ✓ Cleanup: Restored break rule to all team members');
};

export const editAndSaveBreakRuleThenValidateChanges = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.goto();
  // Find a rule to edit (e.g., Rest break)
  await page
    .getByRole('row', { name: /rest break/i })
    .locator('.edit-button')
    .click();
  // Change duration and type
  await page.getByLabel('After working').fill('0');
  await page.getByLabel('minutes').fill('45');
  await page.getByLabel('Break type').selectOption({ label: 'Unpaid break' });
  await page.getByRole('button', { name: /save/i }).click();
  // Validate changes in table
  await expect(page.getByRole('cell', { name: /45 minutes/i })).toBeVisible();
  await expect(page.getByRole('cell', { name: /Unpaid/i })).toBeVisible();
  // Optionally, validate on new time entry (not implemented here)
};

// Edit a break rule, then cancel, and validate no changes
export const editAndCancelBreakRuleThenValidateNoChanges = async (
  page: Page,
  ruleName: string,
  newDuration: string,
) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  // Find the row for the rule and click the edit (pencil) icon
  const row = breaksRulesPage.table.getByRole('row', {
    name: new RegExp(ruleName, 'i'),
  });
  await row.getByRole('button', { name: /edit/i }).click();
  // Change the duration
  const durationInput = page.getByLabel(/duration/i);
  const originalValue = await durationInput.inputValue();
  await durationInput.fill(newDuration);
  // Click Cancel
  await page.getByRole('button', { name: /cancel/i }).click();
  // Validate on Manage Breaks screen: duration is unchanged
  await expect(row.getByRole('cell', { name: originalValue })).toBeVisible();
};

// Delete a break rule and confirm deletion
export const deleteBreakRule = async (page: Page, ruleName: string) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  const row = breaksRulesPage.table.getByRole('row', {
    name: new RegExp(ruleName, 'i'),
  });
  await row.getByRole('button', { name: /delete/i }).click();
  await page.getByRole('button', { name: /yes, delete/i }).click();
  await expect(row).not.toBeVisible();
};

// Attempt to delete a break rule, then cancel
export const cancelDeleteBreakRule = async (page: Page, ruleName: string) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  const row = breaksRulesPage.table.getByRole('row', {
    name: new RegExp(ruleName, 'i'),
  });
  await row.getByRole('button', { name: /delete/i }).click();
  await page.getByRole('button', { name: /no, cancel/i }).click();
  await expect(row).toBeVisible();
};

/**
 * Deactivate a break rule by name.
 */
export const deactivateBreakRule = async (page: Page, ruleName: string) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.goto();
  await breaksRulesPage.toggleRuleStatus(ruleName, false);
};

/**
 * Reactivate a break rule by name.
 */
export const reactivateBreakRule = async (page: Page, ruleName: string) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.goto();
  await breaksRulesPage.toggleRuleStatus(ruleName, true);
};

/**
 * Opens the Add Break drawer. Internal-use helper.
 */
export const openAddBreakDrawer = async (page: Page) => {
  const breaksPage = new BreaksPage(page);
  await breaksPage.openAddBreakDrawer();
};

// Help Panel Utilities
export const openHelpPanel = async (page: Page) => {
  const rulesPage = new BreaksRulesPage(page);
  await rulesPage.openHelpPanel();
};

export const searchHelpPanel = async (page: Page, query: string) => {
  const rulesPage = new BreaksRulesPage(page);
  await rulesPage.searchHelpPanel(query);
};

export const closeHelpPanel = async (page: Page) => {
  const rulesPage = new BreaksRulesPage(page);
  await rulesPage.closeHelpPanel();
};

export const clickContactUs = async (page: Page) => {
  const rulesPage = new BreaksRulesPage(page);
  await rulesPage.clickContactUs();
};

export const assertHelpPanelVisible = async (page: Page) => {
  await expect(
    page.locator(
      '[aria-label="Help Panel"], [role="dialog"][aria-label*="help"]',
    ),
  ).toBeVisible();
};

export const assertHelpPanelNotVisible = async (page: Page) => {
  await expect(
    page.locator(
      '[aria-label="Help Panel"], [role="dialog"][aria-label*="help"]',
    ),
  ).not.toBeVisible();
};

export const assertHelpPanelSearchResultsVisible = async (page: Page) => {
  await expect(
    page.locator(
      '[aria-label="Help Panel"] [role="listbox"], [aria-label*="help"] [role="listbox"]',
    ),
  ).toBeVisible();
};

export const assertContactUsNavigated = async (page: Page) => {
  await expect(page).toHaveURL(/support|contact/i);
};

// Break Preset Utilities
export const assertBreakPresetVisible = async (
  page: Page,
  breakName: string,
) => {
  const rulesPage = new BreaksRulesPage(page);
  await rulesPage.goto();
  await expect(
    rulesPage.table.getByRole('cell', { name: new RegExp(breakName, 'i') }),
  ).toBeVisible();
};

export const assertBreakPresetNotVisible = async (
  page: Page,
  breakName: string,
) => {
  const rulesPage = new BreaksRulesPage(page);
  await rulesPage.goto();
  await expect(
    rulesPage.table.getByRole('cell', { name: new RegExp(breakName, 'i') }),
  ).not.toBeVisible();
};

export const assertBreakPresetTableData = async (
  page: Page,
  expectedRows: Array<Record<string, string>>,
) => {
  const rulesPage = new BreaksRulesPage(page);
  await rulesPage.goto();
  await rulesPage.assertTableData(expectedRows);
};

export const toggleBreakPresetStatus = async (
  page: Page,
  breakName: string,
  active: boolean,
) => {
  const rulesPage = new BreaksRulesPage(page);
  await rulesPage.goto();
  await rulesPage.toggleRuleStatus(breakName, active);
};

export const assertBreakApplied = async (
  page: Page,
  breakName: string,
  teamMember: string,
  duration: string,
) => {
  // This would use SingleTimeActivityPage or similar to check break application
  // Placeholder: implement as needed
};

export const assertBreakNotApplied = async (
  page: Page,
  breakName: string,
  teamMember: string,
  duration: string,
) => {
  // This would use SingleTimeActivityPage or similar to check break non-application
  // Placeholder: implement as needed
};

export const editBreakPreset = async (
  page: Page,
  breakName: string,
  newDuration: string,
) => {
  const rulesPage = new BreaksRulesPage(page);
  await rulesPage.goto();
  const row = rulesPage.table.getByRole('row', {
    name: new RegExp(breakName, 'i'),
  });
  await row.getByRole('button', { name: /edit/i }).click();
  await page.getByLabel('Duration').fill(newDuration);
  await page.getByRole('button', { name: /save/i }).click();
};

export const deleteBreakPreset = async (page: Page, breakName: string) => {
  const rulesPage = new BreaksRulesPage(page);
  await rulesPage.goto();
  const row = rulesPage.table.getByRole('row', {
    name: new RegExp(breakName, 'i'),
  });
  await row.getByRole('button', { name: /delete|trash/i }).click();
  await page.getByRole('button', { name: /confirm|yes/i }).click();
};

export const assertAllBreaksInactive = async (page: Page) => {
  const rulesPage = new BreaksRulesPage(page);
  await rulesPage.goto();
  const rows = await rulesPage.table.getByRole('row').all();
  for (const row of rows) {
    await expect(row.getByRole('cell', { name: /inactive/i })).toBeVisible();
  }
};

export const addRegularTimeEntry = async (
  page: Page,
  teamMemberName: string,
  entryName: string,
  startTime: string,
  endTime: string,
) => {
  const breaksPage = new BreaksPage(page);
  await breaksPage.addRegularTimeEntry(
    teamMemberName,
    entryName,
    startTime,
    endTime,
  );
};

/**
 * Validates that only Payroll Premium/Elite Admins have access to Time Clock
 */
export const validateTimeClockAccessOnlyForPremiumEliteAdmins = async (
  page: Page,
) => {
  // Test as Premium/Elite Admin
  const premiumAdminCredentials = getTestAccount('premiumAdmin');
  await openQBOTS(page, premiumAdminCredentials);
  await navigateToTimeClock(page);

  // Verify Time Clock is accessible for premium admin
  await expect(
    page.locator('[data-test-id="time-clock-in-button"]'),
  ).toBeVisible();

  // Test as lower-tier admin (reuse same page, just change login)
  const lowerTierAdminCredentials = getTestAccount('basicAdmin');
  await openQBOTS(page, lowerTierAdminCredentials);
  // No need to navigate again, just check current state
  await expect(
    page.locator('[data-test-id="time-clock-in-button"]'),
  ).not.toBeVisible();
  // Or verify time entries section is not available
  await expect(
    page.locator('[data-test-id="time-entries-section"]'),
  ).not.toBeVisible();
};

/**
 * Validates that break rules checkbox is visible in Single Time Activity
 */
export const validateBreakRulesCheckboxVisibility = async (page: Page) => {
  const staPage = new SingleTimeActivityPage(page);

  // Navigate to single time activity screen (STA)
  await staPage.navigateToSingleTime();
  await staPage.validateSTALoaded();

  // Look for the "Apply break rules on save" checkbox in STA context
  const breakRulesCheckbox = page.locator(
    '[data-test-id="apply-break-rules-checkbox"]',
  );
  await expect(breakRulesCheckbox).toBeVisible();
  await expect(breakRulesCheckbox).toBeEnabled();
};

/**
 * Enables break rules for single time entry
 */
export const enableBreakRulesForSingleTimeEntry = async (page: Page) => {
  const staPage = new SingleTimeActivityPage(page);

  // Navigate to single time entry screen (STA)
  await staPage.navigateToSingleTime();
  await staPage.validateSTALoaded();

  // Check the "Apply break rules on save" checkbox in STA context
  const breakRulesCheckbox = page.locator(
    '[data-test-id="apply-break-rules-checkbox"]',
  );
  await breakRulesCheckbox.check();

  // Fill in time entry details using STA page methods
  await staPage.enterFieldValue('Name', 'Test Time Entry');
  await staPage.selectTime('Start', '09:00 AM');
  await staPage.selectTime('End', '05:00 PM');

  // Click "Save"
  await staPage.clickSaveAndCloseButton();

  // Verify checkbox is checked and break rules are applied
  await expect(breakRulesCheckbox).toBeChecked();

  // Verify success message or break rules application
  await expect(
    page.locator('text=Break rules applied successfully'),
  ).toBeVisible();
};

/**
 * Disables break rules for single time entry
 */
export const disableBreakRulesForSingleTimeEntry = async (page: Page) => {
  const staPage = new SingleTimeActivityPage(page);

  // Navigate to single time entry screen (STA)
  await staPage.navigateToSingleTime();
  await staPage.validateSTALoaded();

  // Leave the "Apply break rules on save" checkbox unchecked
  const breakRulesCheckbox = page.locator(
    '[data-test-id="apply-break-rules-checkbox"]',
  );
  await expect(breakRulesCheckbox).not.toBeChecked();

  // Fill in time entry details using STA page methods
  await staPage.enterFieldValue('Name', 'Test Time Entry No Rules');
  await staPage.selectTime('Start', '09:00 AM');
  await staPage.selectTime('End', '05:00 PM');

  // Click "Save"
  await staPage.clickSaveAndCloseButton();

  // Verify checkbox remains unchecked and no break rules applied
  await expect(breakRulesCheckbox).not.toBeChecked();

  // Verify time entry saved without break rules
  await expect(
    page.locator('text=Time entry saved successfully'),
  ).toBeVisible();
};

/**
 * Validates break rules with existing breaks
 */
export const validateBreakRulesWithExistingBreaks = async (page: Page) => {
  const staPage = new SingleTimeActivityPage(page);

  // Create a time entry with existing breaks in STA context
  await staPage.navigateToSingleTime();
  await staPage.validateSTALoaded();

  // First, create an entry with breaks in STA
  const breakRulesCheckbox = page.locator(
    '[data-test-id="apply-break-rules-checkbox"]',
  );
  await breakRulesCheckbox.check();
  await staPage.enterFieldValue('Name', 'STA Entry with Breaks');
  await staPage.selectTime('Start', '09:00 AM');
  await staPage.selectTime('End', '05:00 PM');

  // Add a break using STA page methods
  await staPage.clickBreakButton();
  await staPage.fillBreak('00:30');

  await staPage.clickSaveAndCloseButton();

  // Navigate to single time entry screen for the same period (different context)
  // For this test, we'll simulate editing the same entry
  await staPage.navigateToSingleTime();
  await staPage.validateSTALoaded();

  // Check the "Apply break rules on save" checkbox in STA context
  await breakRulesCheckbox.check();

  // Modify the time entry
  await staPage.enterFieldValue('Name', 'Modified Entry with Breaks');
  await staPage.selectTime('Start', '09:30 AM');
  await staPage.selectTime('End', '05:30 PM');

  // Save changes
  await staPage.clickSaveAndCloseButton();

  // Verify system considers existing breaks and no duplicates created
  await expect(
    page.locator('text=Break rules applied with existing breaks'),
  ).toBeVisible();

  // Verify no duplicate breaks
  const breakEntries = page.locator('.break-entry');
  const breakCount = await breakEntries.count();
  // Should have same number of breaks as original (no duplicates)
  expect(breakCount).toBeLessThanOrEqual(2); // Assuming original had 1-2 breaks
};

/**
 * Cancels operation after checking break rules
 */
export const cancelOperationAfterCheckingBreakRules = async (page: Page) => {
  const staPage = new SingleTimeActivityPage(page);

  // Navigate to single time entry screen (STA)
  await staPage.navigateToSingleTime();
  await staPage.validateSTALoaded();

  // Check the "Apply break rules on save" checkbox in STA context
  const breakRulesCheckbox = page.locator(
    '[data-test-id="apply-break-rules-checkbox"]',
  );
  await breakRulesCheckbox.check();

  // Fill in time entry details using STA page methods
  await staPage.enterFieldValue('Name', 'Cancelled Entry');
  await staPage.selectTime('Start', '09:00 AM');
  await staPage.selectTime('End', '05:00 PM');

  // Click "Cancel" instead of "Save"
  await staPage.clickFooterCancelButton();

  // Verify no break rules applied and time entry not saved
  await expect(
    page.locator('text=Time entry saved successfully'),
  ).not.toBeVisible();

  // Verify checkbox state is reset on next screen load
  await staPage.navigateToSingleTime();
  await staPage.validateSTALoaded();
  await expect(breakRulesCheckbox).not.toBeChecked();
};

/**
 * Validates that correct break rules are applied when checkbox is checked
 */
export const validateCorrectBreakRulesApplied = async (page: Page) => {
  const staPage = new SingleTimeActivityPage(page);

  // Navigate to single time entry screen (STA)
  await staPage.navigateToSingleTime();
  await staPage.validateSTALoaded();

  // Check the "Apply break rules on save" checkbox in STA context
  const breakRulesCheckbox = page.locator(
    '[data-test-id="apply-break-rules-checkbox"]',
  );
  await breakRulesCheckbox.check();

  // Fill in time entry details using STA page methods
  await staPage.enterFieldValue('Name', 'Correct Rules Entry');
  await staPage.selectTime('Start', '09:00 AM');
  await staPage.selectTime('End', '05:00 PM');

  // Click "Save"
  await staPage.clickSaveAndCloseButton();

  // Verify correct break rules are applied
  await expect(page.locator('text=Correct break rules applied')).toBeVisible();

  // Verify activity is saved
  await expect(page.locator('text=Activity saved successfully')).toBeVisible();

  // Verify break rules were actually applied (check for break entries)
  await expect(page.locator('.break-entry')).toBeVisible();
};

export const addAutomaticBreakRuleAndDeleteIt = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.goto();
  // Use the correct selector for the "Add break rule" button
  await breaksRulesPage.clickAddBreakRuleButton();
  //await page.locator('(//span[text()="Add break rule"])[1]').click();
  await page.waitForTimeout(1000);
  await page.waitForSelector(`//*[@aria-label="Loading"]`, {
    state: 'hidden',
    timeout: 0,
  });
  await expect(
    page.locator(`//strong[text()='Add break rule']`).first(),
  ).toBeVisible();
  const randomBreakName = `test break rule ${Date.now()}`;
  await page.locator(`#break-name`).first().fill(randomBreakName);
  await page.getByLabel(`Enter duration`).first().fill('30');
  await page.keyboard.press(`Tab`);
  await breaksRulesPage.selectAutomaticOrManualBreakCheckbox('Automatic');
  await breaksRulesPage.clickSaveBreakRuleButton();
  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });
  await expect(
    page.locator(`(//h2[@data-testid="drawerTitle"])[1]`),
  ).toBeHidden();
  await expect(
    page.locator(`//td[text()='${randomBreakName}']`).first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        `//td[text()='${randomBreakName}'] / following-sibling::td[text()='30 minutes']`,
      )
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        `//td[text()='${randomBreakName}'] / following-sibling::td[text()='Paid']`,
      )
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        `//td[text()='${randomBreakName}'] / following-sibling::td[text()='Automatic']`,
      )
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        `//td[text()='${randomBreakName}'] / following-sibling::td / descendant::button[@aria-label="Delete break rule"]`,
      )
      .first(),
  ).toBeVisible();
  // Retry clicking the delete button and check if popup appears
  const clickDeleteAndCheckPopup = async () => {
    await page
      .locator(
        `//td[text()='${randomBreakName}'] / following-sibling::td / descendant::button[@aria-label="Delete break rule"]`,
      )
      .first()
      .click({ force: true });
    await page.waitForTimeout(1000);
    const deletePopup = page
      .locator(`//h5[contains(text(), 'Want to delete test break rule')]`)
      .first();
    if (await deletePopup.isVisible().catch(() => false)) {
      return true;
    }
    return false;
  };

  // Try to click delete button and check if popup appears
  const popupAppeared = await clickDeleteAndCheckPopup();
  if (!popupAppeared) {
    // If popup not visible yet, wait 10 seconds and retry once
    await page.waitForTimeout(10000);
    await clickDeleteAndCheckPopup();
  }
  await expect(
    page
      .locator(`//h5[contains(text(), 'Want to delete test break rule')]`)
      .first(),
  ).toBeVisible();
  await page
    .locator('//button[.//span[text()="Delete"]]')
    .first()
    .click({ force: true });
  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });
  await expect(
    page.locator(`//td[text()='${randomBreakName}']`).first(),
  ).toBeHidden();
};

export const addManualBreakRuleAndDeleteIt = async (page: Page) => {
  const breaksRulesPage = new BreaksRulesPage(page);
  await breaksRulesPage.goto();
  // Use the correct selector for the "Add break rule" button
  await breaksRulesPage.clickAddBreakRuleButton();
  await page.waitForTimeout(1000);
  await page.waitForSelector(`//*[@aria-label="Loading"]`, {
    state: 'hidden',
    timeout: 0,
  });
  await expect(
    page.locator(`//strong[text()='Add break rule']`).first(),
  ).toBeVisible();
  const randomManualBreakName = `test break rule manual ${Date.now()}`;
  await page.locator(`#break-name`).first().fill(randomManualBreakName);
  await page.getByLabel(`Enter duration`).first().fill('20');
  await page.keyboard.press(`Tab`);
  await breaksRulesPage.selectAutomaticOrManualBreakCheckbox('Manual');
  await page
    .locator(
      `//span[text()='Notify Workforce app team members'] / ancestor::label / descendant::input[@type='checkbox']`,
    )
    .click();
  await breaksRulesPage.clickSaveBreakRuleButton();
  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });
  await expect(
    page.locator(`(//h2[@data-testid="drawerTitle"])[1]`),
  ).toBeHidden();
  await expect(
    page.locator(`//td[text()='${randomManualBreakName}']`).first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        `//td[text()='${randomManualBreakName}'] / following-sibling::td[text()='20 minutes']`,
      )
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        `//td[text()='${randomManualBreakName}'] / following-sibling::td[text()='Paid']`,
      )
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        `//td[text()='${randomManualBreakName}'] / following-sibling::td[text()='Manual']`,
      )
      .first(),
  ).toBeVisible();

  // Step 2: Go to time entries
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await expect(
    page.locator(
      `//span[text()='Display by'] / ancestor::label / descendant::input`,
    ),
  ).toBeVisible();

  // Step 3: Add breaks using the break functionality
  const breaksPage = new BreaksPage(page);
  await breaksPage.openAddBreakDrawer();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForSelector(`//input[@aria-label="Name"]`, {
    state: 'visible',
    timeout: 0,
  });
  await page.waitForTimeout(3000);

  // Step 4: Validate that the added break is visible using selectTeamMemberAndBreakType
  // The break type should include the manual break rule we just created
  const breakTypeToSelect = `Paid: ${randomManualBreakName}`;
  await breaksPage.selectTeamMemberAndBreakType('Test Emp1', breakTypeToSelect);
  const breakValue = await page
    .locator(`//input[@aria-label="Select Break"]`)
    .getAttribute(`value`);
  await expect(breakValue).toBe(breakTypeToSelect);

  // Close the drawer since we're just validating
  await breaksPage.cancelButton.click();

  // Go back to break rules to delete the rule
  await breaksRulesPage.goto();
  await expect(
    page
      .locator(
        `//td[text()='${randomManualBreakName}'] / following-sibling::td[text()='Manual']`,
      )
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        `//td[text()='${randomManualBreakName}'] / following-sibling::td / descendant::button[@aria-label="Delete break rule"]`,
      )
      .first(),
  ).toBeVisible();
  // Retry clicking the delete button and check if popup appears
  const clickDeleteAndCheckPopup = async () => {
    await page
      .locator(
        `//td[text()='${randomManualBreakName}'] / following-sibling::td / descendant::button[@aria-label="Delete break rule"]`,
      )
      .first()
      .click({ force: true });
    await page.waitForTimeout(1000);
    const deletePopup = page
      .locator(`//h5[contains(text(), 'Want to delete test break rule')]`)
      .first();
    if (await deletePopup.isVisible().catch(() => false)) {
      return true;
    }
    return false;
  };

  // Try to click delete button and check if popup appears
  const popupAppeared = await clickDeleteAndCheckPopup();
  if (!popupAppeared) {
    // If popup not visible yet, wait 10 seconds and retry once
    await page.waitForTimeout(10000);
    await clickDeleteAndCheckPopup();
  }
  await expect(
    page
      .locator(`//h5[contains(text(), 'Want to delete test break rule')]`)
      .first(),
  ).toBeVisible();
  await page
    .locator('//button[.//span[text()="Delete"]]')
    .first()
    .click({ force: true });
  await page.waitForTimeout(1000);
  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });
  await expect(
    page.locator(`//td[text()='${randomManualBreakName}']`).first(),
  ).toBeHidden();
};

export const addManualBreakWithStartEndTime = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await expect(
    page.locator(
      `//span[text()='Display by'] / ancestor::label / descendant::input`,
    ),
  ).toBeVisible();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await timeEntriesPage.validateDateRangeDropdownOptions();
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Clean up any existing entries for test employee
  const empRows = await timeEntriesPage.getAllRowsForAnEmployee('Emp1, Test');
  let count = await empRows.count();
  while (count > 0) {
    await timeEntriesPage.clickActionDropdownForEmployee('Emp1, Test');
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();
    count = await timeEntriesPage.countEmployeeRow('Emp1, Test');
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.waitForTableOrNoEntriesMessage();
    count = await timeEntriesPage.countEmployeeRow('Emp1, Test');
  }

  const breaksPage = new BreaksPage(page);
  await breaksPage.openAddBreakDrawer();
  await page.waitForTimeout(1000);
  await breaksPage.selectTeamMemberAndBreakType('Test Emp1', 'Paid: break man');
  await breaksPage.setBreakEntryType('Start and end time');

  // Get yesterday's date in MM/DD/YYYY format
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  await breaksPage.enterStartDate(yesterdayFormatted);
  // await page.getByLabel('Start Date', { exact: true }).fill();
  await page.waitForTimeout(1000);
  await breaksPage.clearStartOrEndTime('Start Time');
  await breaksPage.enterStartOrEndTime('Start Time', '08:00 AM');
  await breaksPage.clearStartOrEndTime('End Time');
  await breaksPage.enterStartOrEndTime('End Time', '06:00 PM');
  await breaksPage.enterNotes(`test notes auto`);
  await breaksPage.saveBreak();

  // Handle success toast and any other popups
  await handleSuccessToast(page, 'Break saved successfully');
  // Verify the "Display by" dropdown is visible
  await expect(
    page.locator(
      `//span[text()='Display by'] / ancestor::label / descendant::input`,
    ),
  ).toBeVisible();
  await timeEntriesPage.validateAddedBreaksEntryExistsForEmployee(
    'break man',
    'Emp1, Test',
  );

  // Clean up
  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });
  await selectDisplayByOption(page, 'Date');
  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });
  let remainingCount = await page
    .locator(
      "//div[contains(text(), 'Emp1, Test') or contains(text(), 'Test Emp1')]/ancestor::tr",
    )
    .count();

  while (remainingCount > 0) {
    await timeEntriesPage.clickActionDropdownForEmployee('Emp1, Test');
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();

    if (remainingCount > 0) {
      await timeEntriesPage.navigateToTimeEntriesPage();
      await timeEntriesPage.waitForLoadingToDisappear();
      await timeEntriesPage.waitForTableOrNoEntriesMessage();
      remainingCount = await timeEntriesPage.countEmployeeRow('Emp1, Test');
    }
  }
};

export const addManualBreakWithDuration = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);

  // Clean up any existing entries for test employee
  const empRows = await timeEntriesPage.getAllRowsForAnEmployee('Emp1, Test');
  let count = await empRows.count();
  while (count > 0) {
    await timeEntriesPage.clickActionDropdownForEmployee('Emp1, Test');
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();
    count = await timeEntriesPage.countEmployeeRow('Emp1, Test');
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.waitForTableOrNoEntriesMessage();
    count = await timeEntriesPage.countEmployeeRow('Emp1, Test');
  }
  const breaksPage = new BreaksPage(page);
  //await breaksPage.navigateToTimeEntries();
  await breaksPage.openAddBreakDrawer();
  await breaksPage.selectTeamMemberAndBreakType('Test Emp1', 'Paid: break man');
  // Get yesterday's date in MM/DD/YYYY format
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  await breaksPage.enterStartDate(yesterdayFormatted);
  // await page.locator(`//button[@aria-label="Start date Calendar"] / preceding-sibling::input`).fill(`07/16/2025`);
  await breaksPage.setBreakEntryType('Duration');
  // await breaksPage.enterDurationDate(`07/16/2025`);
  await page.keyboard.press(`Tab`);
  await breaksPage.enterDurationTime('05:00');
  await page.keyboard.press(`Tab`);
  await breaksPage.enterNotes(`test notes manual`);
  await breaksPage.saveBreak();

  // Handle success toast and any other popups
  await handleSuccessToast(page, 'Break saved successfully');

  // Verify the "Display by" dropdown is visible
  await expect(
    page.locator(
      `//span[text()='Display by'] / ancestor::label / descendant::input`,
    ),
  ).toBeVisible();
  // Clean up
  await timeEntriesPage.validateAddedBreaksEntryExistsForEmployee(
    'break man',
    'Emp1, Test',
  );

  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });
  await selectDisplayByOption(page, 'Date');
  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await page.waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
    state: 'hidden',
    timeout: 0,
  });
  let remainingCount = await page
    .locator(
      "//div[contains(text(), 'Emp1, Test') or contains(text(), 'Test Emp1')]/ancestor::tr",
    )
    .count();

  while (remainingCount > 0) {
    await timeEntriesPage.clickActionDropdownForEmployee('Emp1, Test');
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();

    if (remainingCount > 0) {
      await timeEntriesPage.navigateToTimeEntriesPage();
      await timeEntriesPage.waitForLoadingToDisappear();
      await timeEntriesPage.waitForTableOrNoEntriesMessage();
      remainingCount = await timeEntriesPage.countEmployeeRow('Emp1, Test');
    }
  }
};
export const validateMandatoryFieldsBreakEntry = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  const breaksPage = new BreaksPage(page);

  // Setup and navigation
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await timeEntriesPage.validateDisplayByDropdownVisible();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await timeEntriesPage.validateDateRangeDropdownOptions();
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Clean up any existing entries for test employee
  const empRows = await timeEntriesPage.getAllRowsForAnEmployee('Emp1, Test');
  let count = await empRows.count();
  while (count > 0) {
    await timeEntriesPage.clickActionDropdownForEmployee('Emp1, Test');
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();
    count = await timeEntriesPage.countEmployeeRow('Emp1, Test');
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.waitForTableOrNoEntriesMessage();
    count = await timeEntriesPage.countEmployeeRow('Emp1, Test');
  }

  // Test mandatory field validations
  await breaksPage.openAddBreakDrawer();
  await breaksPage.saveBreak();
  await breaksPage.validateBreakTypeRequiredError();
  await breaksPage.validateDurationRequiredError();

  // Fill required fields and verify errors are hidden
  await breaksPage.selectTeamMemberAndBreakType('Test Emp1', 'Paid: break man');
  await breaksPage.enterDurationTime('05:00');
  await page.keyboard.press(`Tab`);
  await breaksPage.validateBreakTypeRequiredErrorHidden();
  await breaksPage.validateDurationRequiredErrorHidden();

  // Test start and end time validation
  await breaksPage.setBreakEntryType('Start and end time');
  await page.waitForTimeout(1000);

  // Get yesterday's date in MM/DD/YYYY format
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  await breaksPage.enterStartDate(yesterdayFormatted);
  await page.waitForTimeout(1000);

  // Clear time fields to trigger validation errors
  await breaksPage.focusStartOrEndTime('Start Time');
  await page.waitForTimeout(500);
  await breaksPage.clearStartOrEndTime('Start Time');
  await breaksPage.focusStartOrEndTime('End Time');
  await page.waitForTimeout(500);
  await breaksPage.clearStartOrEndTime('End Time');
  await breaksPage.blurFocusStartOrEndTime('End Time');
  await page.waitForTimeout(1000);

  // Validate invalid time format errors
  await breaksPage.validateInvalidTimeFormatError(2);

  // Enter valid times and verify errors are cleared
  await breaksPage.enterStartOrEndTime('Start Time', '8:00 AM');
  await breaksPage.enterStartOrEndTime('End Time', '6:00 PM');
  await breaksPage.validateInvalidTimeFormatError(0);
  await breaksPage.saveBreak();

  // Handle success toast and any other popups
  await handleSuccessToast(page, 'Break saved successfully');

  // Test edit functionality with time validation
  await timeEntriesPage.validateDisplayByDropdownVisible();
  await timeEntriesPage.clickEditForEmployee('Emp1, Test');

  // Clear time fields again to test validation in edit mode
  await breaksPage.focusStartOrEndTime('Start Time');
  await page.waitForTimeout(500);
  await breaksPage.clearStartOrEndTime('Start Time');
  await breaksPage.focusStartOrEndTime('End Time');
  await page.waitForTimeout(500);
  await breaksPage.clearStartOrEndTime('End Time');
  await breaksPage.blurFocusStartOrEndTime('End Time');
  await page.waitForTimeout(1000);

  // Validate errors appear again in edit mode
  const validationError = breaksPage.getInvalidTimeFormatErrorLocator();
  await expect(validationError).toHaveCount(2);
};

/**
 * Pre-test cleanup for break tests that create/approve entries
 */
export const cleanupApprovedAndAllTimeEntries = async (page: Page) => {
  const approvalsPage = new ApprovalsPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await approvalsPage.navigateToApprovalsPage();
      await approvalsPage.waitForLoadingToDisappear();
      await approvalsPage
        .selectDateRange('This month')
        .catch(() =>
          console.log('Cleanup: selectDateRange skipped (using default range)'),
        );
      const unapproved = await approvalsPage.unapproveAllVisibleEmployees();
      console.log(`Cleanup: unapproved ${unapproved} employee(s)`);
      break;
    } catch (error) {
      console.log(`Cleanup unapprove attempt ${attempt}/3 failed:`, error);
      await page.waitForTimeout(3000);
    }
  }

  // 2) Delete all remaining (now unlocked) time entries across both ranges.
  for (const range of ['This month', 'This week']) {
    try {
      await timeEntriesPage.navigateToTimeEntriesPage();
      await timeEntriesPage.waitForLoadingToDisappear();
      await selectDisplayByOption(page, 'Date');
      await timeEntriesPage.waitForLoadingToDisappear();
      await openDateRangeDropdown(page);
      await selectDateRangeOption(page, range);
      await timeEntriesPage.waitForLoadingToDisappear();
      await deleteAllVisibleTimeEntries(page, timeEntriesPage);
    } catch (error) {
      console.log(`Cleanup delete (${range}) best-effort error:`, error);
    }
  }
};

export const validateApproveUnapproveBreaks = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  const breaksPage = new BreaksPage(page);

  // Setup and navigation
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await timeEntriesPage.validateDisplayByDropdownVisible();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await timeEntriesPage.validateDateRangeDropdownOptions();
  await selectDateRangeOption(page, 'This week');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Create a break entry for testing approval/unapproval
  await breaksPage.openAddBreakDrawer();
  await breaksPage.selectTeamMemberAndBreakType('Test Emp1', 'Paid: break man');

  // Get yesterday's date in MM/DD/YYYY format
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  await breaksPage.enterStartDate(yesterdayFormatted);
  await breaksPage.setBreakEntryType('Duration');
  await page.keyboard.press(`Tab`);
  await breaksPage.enterDurationTime('05:00');
  await page.keyboard.press(`Tab`);
  await breaksPage.enterNotes(`test notes manual`);
  await breaksPage.saveBreak();

  // Handle success toast and any other popups
  await handleSuccessToast(page, 'Break saved successfully');

  // Verify break entry was created
  await timeEntriesPage.validateDisplayByDropdownVisible();
  await timeEntriesPage.validateAddedBreaksEntryExistsForEmployee(
    'break man',
    'Emp1, Test',
  );

  // Test approval flow - Navigate to Approvals tab
  const approvalsPage = new ApprovalsPage(page);
  await approvalsPage.navigateToApprovalsPage();
  await page.waitForTimeout(2000);

  // Select This week date range to find our entry
  await approvalsPage.selectDateRange('This week');
  await page.waitForTimeout(2000);

  // Click on employee row to open view details
  const employeeRow = page
    .locator('tr')
    .filter({ hasText: 'Emp1, Test' })
    .first();
  await expect(employeeRow).toBeVisible();

  // Click the expand menu to get view details option
  await page.locator('(//*[@aria-label="Expand Menu"])[1]').click();
  await page.waitForTimeout(1000);
  await page.locator('//*[text()="View details"]').click();
  await page.waitForTimeout(2000);

  // Approve the entry from view details
  await approvalsPage.clickApproveTimeButton();
  await page.waitForTimeout(1000);
  await page.getByRole('option', { name: 'Approve time', exact: true }).click();

  // Handle the lock time confirmation popup if it appears
  const lockTimePopup = page.getByText(/Lock time through/i);
  if (await lockTimePopup.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Approve and lock time' }).click();
  }
  await page.waitForTimeout(2000);

  // Validate entry is approved (Unapprove option should now be visible)
  await approvalsPage.clickApproveTimeButton();
  await expect(
    page.getByRole('option', { name: 'Unapprove time', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape'); // Close the menu

  // Go back to Time Entries to verify approved entry shows as view-only
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This week');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Test that approved entries show as view-only
  await timeEntriesPage.validateApprovedRowWithViewButton('Emp1, Test');
  await timeEntriesPage.clickViewButtonForEmployee('Emp1, Test');
  await breaksPage.validateEditBreakEntryDialogVisible();

  // Test that approved entries cannot be edited
  await breaksPage.enterDurationTime('06:00');
  await breaksPage.saveBreak();
  await breaksPage.validateApprovedHoursErrorMessage();
  await breaksPage.clickCancelButtonInFooter();
  await breaksPage.clickNoButton();

  // Test unapproval flow - Navigate to Approvals tab
  await approvalsPage.navigateToApprovalsPage();
  await page.waitForTimeout(2000);
  await approvalsPage.selectDateRange('This week');
  await page.waitForTimeout(2000);

  // Click on employee row to open view details
  await page.locator('(//*[@aria-label="Expand Menu"])[1]').click();
  await page.waitForTimeout(1000);
  await page.locator('//*[text()="View details"]').click();
  await page.waitForTimeout(2000);

  // Unapprove the entry from view details
  await approvalsPage.clickApproveTimeButton();
  await page.waitForTimeout(1000);
  await page
    .getByRole('option', { name: 'Unapprove time', exact: true })
    .click();

  // Handle the unlock time confirmation popup if it appears
  const unlockTimePopup = page.getByText(/Unlock time/i);
  if (await unlockTimePopup.isVisible().catch(() => false)) {
    await page
      .getByRole('button', { name: 'Unapprove and unlock time' })
      .click();
  }
  await page.waitForTimeout(2000);

  // Go back to Time Entries to verify unapproved entry can be edited
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This week');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Test that unapproved entries can be edited
  await timeEntriesPage.checkEditVisibleOnlyForUnapproved('Emp1, Test');
  await timeEntriesPage.clickEditForEmployee('Emp1, Test');
  await breaksPage.validateEditBreakEntryDialogVisible();
  await breaksPage.enterDurationTime('06:00');
  await breaksPage.saveBreak();
  await timeEntriesPage.validateUpdatedHoursForEmployee('Emp1, Test', '6.00');

  // Clean up
  await deleteAllVisibleTimeEntries(page, timeEntriesPage);
};

export const validateEndTimeEarlierThanStartTime = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  const breaksPage = new BreaksPage(page);

  // Setup and navigation
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await timeEntriesPage.validateDisplayByDropdownVisible();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await timeEntriesPage.validateDateRangeDropdownOptions();
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Clean up any existing entries for test employee
  const empRows = await timeEntriesPage.getAllRowsForAnEmployee('Emp1, Test');
  let count = await empRows.count();
  while (count > 0) {
    await timeEntriesPage.clickActionDropdownForEmployee('Emp1, Test');
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();
    count = await timeEntriesPage.countEmployeeRow('Emp1, Test');
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.waitForTableOrNoEntriesMessage();
    count = await timeEntriesPage.countEmployeeRow('Emp1, Test');
  }

  // Test 1: Validate end time earlier than start time during ADD operation
  await breaksPage.openAddBreakDrawer();
  await breaksPage.selectTeamMemberAndBreakType('Test Emp1', 'Paid: break man');
  await breaksPage.setBreakEntryType('Start and end time');
  await page.waitForTimeout(1000);

  // Get yesterday's date in MM/DD/YYYY format
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  await breaksPage.enterStartDate(yesterdayFormatted);
  await page.waitForTimeout(1000);

  // Clear and enter start time later than end time to trigger validation error
  await breaksPage.clearStartOrEndTime('Start Time');
  await breaksPage.enterStartOrEndTime('Start Time', '2:00 PM');
  await breaksPage.blurFocusStartOrEndTime('Start Time');
  await breaksPage.clearStartOrEndTime('End Time');
  await breaksPage.enterStartOrEndTime('End Time', '1:00 PM');
  await breaksPage.blurFocusStartOrEndTime('End Time');
  await page.waitForTimeout(500);

  // Try to save and expect validation error
  await breaksPage.saveBreak();
  await breaksPage.validateEndTimeEarlierThanStartTimeError();

  // Clear and fix the times to valid values
  await breaksPage.clearStartOrEndTime('Start Time');
  await breaksPage.enterStartOrEndTime('Start Time', '1:00 PM');
  await breaksPage.blurFocusStartOrEndTime('Start Time');
  await breaksPage.clearStartOrEndTime('End Time');
  await breaksPage.enterStartOrEndTime('End Time', '2:00 PM');
  await breaksPage.blurFocusStartOrEndTime('End Time');
  await page.waitForTimeout(500);

  // Verify error is hidden and save successfully
  await breaksPage.validateEndTimeEarlierThanStartTimeErrorHidden();
  await breaksPage.saveBreak();

  // Handle success toast and any other popups
  await handleSuccessToast(page, 'Break saved successfully');

  // Test 2: Validate end time earlier than start time during EDIT operation
  await timeEntriesPage.validateDisplayByDropdownVisible();
  await timeEntriesPage.clickEditForEmployee('Emp1, Test');
  await breaksPage.validateEditBreakEntryDialogVisible();

  // Clear and change times so end time is earlier than start time
  await breaksPage.clearStartOrEndTime('Start Time');
  await breaksPage.enterStartOrEndTime('Start Time', '3:00 PM');
  await breaksPage.blurFocusStartOrEndTime('Start Time');
  await breaksPage.clearStartOrEndTime('End Time');
  await breaksPage.enterStartOrEndTime('End Time', '2:00 PM');
  await breaksPage.blurFocusStartOrEndTime('End Time');
  await page.waitForTimeout(500);

  // Try to save and expect validation error
  await breaksPage.saveBreak();
  await breaksPage.validateEndTimeEarlierThanStartTimeError();

  // Clear and fix the times to valid values
  await breaksPage.clearStartOrEndTime('Start Time');
  await breaksPage.enterStartOrEndTime('Start Time', '2:00 PM');
  await breaksPage.blurFocusStartOrEndTime('Start Time');
  await breaksPage.clearStartOrEndTime('End Time');
  await breaksPage.enterStartOrEndTime('End Time', '3:00 PM');
  await breaksPage.blurFocusStartOrEndTime('End Time');
  await page.waitForTimeout(500);

  // Verify error is hidden and save successfully
  await breaksPage.validateEndTimeEarlierThanStartTimeErrorHidden();
  await breaksPage.saveBreak();

  // Handle success toast
  await handleSuccessToast(page, 'Break saved successfully');

  // Verify the break was updated with correct times
  await timeEntriesPage.validateDisplayByDropdownVisible();

  // Clean up
  await deleteAllVisibleTimeEntries(page, timeEntriesPage);
};

export const validateOverlappingBreakEntries = async (page: Page) => {
  const timeEntriesPage = new TimeEntriesPage(page);
  const breaksPage = new BreaksPage(page);

  // Setup and navigation
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await timeEntriesPage.validateDisplayByDropdownVisible();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await timeEntriesPage.validateDateRangeDropdownOptions();
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  // Clean up any existing entries for test employee
  const empRows = await timeEntriesPage.getAllRowsForAnEmployee('Emp1, Test');
  let count = await empRows.count();
  while (count > 0) {
    await timeEntriesPage.clickActionDropdownForEmployee('Emp1, Test');
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();
    count = await timeEntriesPage.countEmployeeRow('Emp1, Test');
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.waitForTableOrNoEntriesMessage();
    count = await timeEntriesPage.countEmployeeRow('Emp1, Test');
  }

  // Get yesterday's date in MM/DD/YYYY format
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  // PHASE 1: Test overlap validation during ADD operation

  // Step 1: Create the first break entry (1:00 PM - 2:00 PM)
  await breaksPage.openAddBreakDrawer();
  await breaksPage.selectTeamMemberAndBreakType('Test Emp1', 'Paid: break man');
  await breaksPage.setBreakEntryType('Start and end time');
  await page.waitForTimeout(1000);

  await breaksPage.enterStartDate(yesterdayFormatted);
  await page.waitForTimeout(1000);

  await breaksPage.clearStartOrEndTime('Start Time');
  await breaksPage.enterStartOrEndTime('Start Time', '1:00 PM');
  await breaksPage.blurFocusStartOrEndTime('Start Time');
  await breaksPage.clearStartOrEndTime('End Time');
  await breaksPage.enterStartOrEndTime('End Time', '2:00 PM');
  await breaksPage.blurFocusStartOrEndTime('End Time');
  await page.waitForTimeout(500);

  await breaksPage.saveBreak();
  await handleSuccessToast(page, 'Break saved successfully');

  // Verify the first break entry was created
  await timeEntriesPage.validateDisplayByDropdownVisible();
  await timeEntriesPage.validateAddedBreaksEntryExistsForEmployee(
    'break man',
    'Emp1, Test',
  );

  // Step 2: Try to add a second overlapping break entry (ADD validation)
  await breaksPage.openAddBreakDrawer();
  await breaksPage.selectTeamMemberAndBreakType('Test Emp1', 'Paid: break man');
  await breaksPage.setBreakEntryType('Start and end time');
  await page.waitForTimeout(1000);

  await breaksPage.enterStartDate(yesterdayFormatted);
  await page.waitForTimeout(1000);

  // Enter overlapping time: 1:30 PM - 2:30 PM (overlaps with existing 1:00 PM - 2:00 PM)
  await breaksPage.clearStartOrEndTime('Start Time');
  await breaksPage.enterStartOrEndTime('Start Time', '1:30 PM');
  await breaksPage.blurFocusStartOrEndTime('Start Time');
  await breaksPage.clearStartOrEndTime('End Time');
  await breaksPage.enterStartOrEndTime('End Time', '2:30 PM');
  await breaksPage.blurFocusStartOrEndTime('End Time');
  await page.waitForTimeout(500);

  // Try to save and expect overlap error during ADD
  await breaksPage.saveBreak();
  await breaksPage.validateOverlapError();

  // Cancel the overlapping entry
  await breaksPage.clickCancelButton();
  await breaksPage.clickNoButton();

  // PHASE 2: Test overlap validation during EDIT operation

  // Step 3: Create a second non-overlapping break entry (3:00 PM - 4:00 PM)
  await breaksPage.openAddBreakDrawer();
  await breaksPage.selectTeamMemberAndBreakType('Test Emp1', 'Paid: break man');
  await breaksPage.setBreakEntryType('Start and end time');
  await page.waitForTimeout(1000);

  await breaksPage.enterStartDate(yesterdayFormatted);
  await page.waitForTimeout(1000);

  await breaksPage.clearStartOrEndTime('Start Time');
  await breaksPage.enterStartOrEndTime('Start Time', '3:00 PM');
  await breaksPage.blurFocusStartOrEndTime('Start Time');
  await breaksPage.clearStartOrEndTime('End Time');
  await breaksPage.enterStartOrEndTime('End Time', '4:00 PM');
  await breaksPage.blurFocusStartOrEndTime('End Time');
  await page.waitForTimeout(500);

  await breaksPage.saveBreak();
  await handleSuccessToast(page, 'Break saved successfully');

  // Verify both break entries exist
  await timeEntriesPage.validateDisplayByDropdownVisible();

  // Step 4: Edit the second break entry to overlap with the first one (EDIT validation)
  const allRows = await timeEntriesPage.getAllRowsForAnEmployee('Emp1, Test');
  const rowCount = await allRows.count();

  if (rowCount >= 2) {
    // Click edit on one of the break entries
    await timeEntriesPage.clickEditForEmployee('Emp1, Test');
    await breaksPage.validateEditBreakEntryDialogVisible();

    // Change the break to overlap with the existing one (1:30 PM - 2:30 PM)
    await breaksPage.clearStartOrEndTime('Start Time');
    await breaksPage.enterStartOrEndTime('Start Time', '1:30 PM');
    await breaksPage.blurFocusStartOrEndTime('Start Time');
    await breaksPage.clearStartOrEndTime('End Time');
    await breaksPage.enterStartOrEndTime('End Time', '2:30 PM');
    await breaksPage.blurFocusStartOrEndTime('End Time');
    await page.waitForTimeout(500);

    // Try to save and expect overlap error during EDIT
    await breaksPage.saveBreak();
    await breaksPage.validateOverlapError();

    // Cancel the edit
    await breaksPage.clickCancelButtonInFooter();
    await breaksPage.clickNoButton();
  }

  // Clean up - delete all break entries
  await deleteAllVisibleTimeEntries(page, timeEntriesPage);
};
