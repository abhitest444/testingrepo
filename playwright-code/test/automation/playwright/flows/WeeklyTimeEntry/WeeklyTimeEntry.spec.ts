import { test } from '@playwright/test';

import { getTestAccount } from '../../config/accounts';
import { openQBOTE } from '../../pages/QBOLogin';
import {
  validateSaveMultipleWeeklyTimeEntryRows,
  validateAddMultipleRowsAndPersist,
  validateSearchAndSelectCustomerProject,
  validateNumericAndRangeConstraintsOnHours,
  validateApplyNotesToRestOfWeek,
  validateCancelChangesAfterEditingTimesheet,
  validateInvalidCharactersInHoursField,
  validateSaveTimesheetWithZeroHours,
  validateSaveWithRequiredFieldMissing,
  validateAddAndDeleteRowBeforeSaving,
  validateEndToEndAddSearchSaveWeeklyTimeEntry,
  validateOpenKeyboardShortcutsModal,
  validateCloseKeyboardModalWithEsc,
  validateCloseKeyboardModalByOverlayClick,
  validateBackgroundInteractionBlockedWhenModalOpen,
  validateKeyboardModalResponsiveAndScrollable,
  validateKeyboardIconNotVisibleOnOtherPages,
  validateAddBreakEntryAndPersist,
  validateEditAndDeleteBreakEntry,
  validateBreakHoursNumericConstraints,
  validateAddTimeOffEntryAndPersist,
  validateEditAndDeleteTimeOffEntry,
  validateChangeWeekWithDatepicker,
  validateChangeWeekWithDatepickerRepeat,
  validateWeekSwitchAndPersistence,
  validateContextMenuOptionsOnCellRightClick,
  validateEditTimeToggleDisabledWithWeeklyEntries,
  validateConflictOverrideConfirmationSavesOnYes,
  validateConflictOverrideCancelledNoChanges,
  validateSidePanelCustomFields,
  validateWTEFieldSettingsReflectTimeSettings,
  validateWTEFieldSettingsUpdate,
  validateSTEFieldSettingsReflectTimeSettings,
  validateSTEFieldSettingsUpdate,
  validateDefaultTeamMemberState,
  validateDailyHourLimitExceededModal,
  validateInvalidTimeDurationFormatModal,
  validateCustomerTimeCategoryRequiredBanner,
  validateWeeklyLimitExceededBanner,
  validateSystemCantSaveChangesBanner,
  validateServiceUnavailableMessage,
  validateWeeklyTimeEntryFieldSettingsPopup,
  validateRequiredCustomFieldsInSidePanel,
  validateEditBlockedForApprovedTimesheet,
  validateKeyboardShortcutsModal,
  validateSidePanelCollapsedAndExpanded,
  validateSidePanelCollapsedAndReExpanded,
  expandCollapseSidePanel,
  validateWeeklyTimeEntryTableColumnsHeader,
  validateHotKeysDisplayInContextMenu,
  createAndValidateWeeklyTimeEntry,
} from '../Util/WeeklyTimeEntry.util';
import { validateRowHighlightOnCellSelection } from '../Util/GB/GBWeeklyTimeEntry.util';

test.describe('Weekly Time Entry Page Test Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTE(page, credentials);
  });

  test('WTE001 - Add Weekly Time For Single Row', async ({ page }) => {
    await createAndValidateWeeklyTimeEntry(page);
  });

  test('WTE002 - Save multiple time entry rows for different customers', async ({
    page,
  }) => {
    await validateSaveMultipleWeeklyTimeEntryRows(page);
  });

  // test('WTE003 - Verify "Apply notes to rest of week" feature', async ({
  //   page,
  // }) => {
  //   await validateApplyNotesToRestOfWeek(page);
  // });

  test('WTE004 - Cancel changes after editing an existing timesheet', async ({
    page,
  }) => {
    await validateCancelChangesAfterEditingTimesheet(page);
  });

  //there is require for pop message due to required field missing
  // test('WTE005 - Attempt to save with a required field missing (Time category)', async ({
  //   page,
  // }) => {
  //   await validateSaveWithRequiredFieldMissing(page);
  // });

  // test('WTE006 - Enter invalid characters in an hours field', async ({
  //   page,
  // }) => {
  //   await validateInvalidCharactersInHoursField(page);
  // });

  test('WTE007 - Validate Cell Selection Row Highlighted', async ({ page }) => {
    await validateRowHighlightOnCellSelection(page);
  });

  test('WTE008 - Add and then delete a row before saving', async ({ page }) => {
    await validateAddAndDeleteRowBeforeSaving(page);
  });

  test('WTE009 - Open and verify keyboard shortcuts modal content', async ({
    page,
  }) => {
    await validateOpenKeyboardShortcutsModal(page);
  });

  test('WTE010 - Close keyboard shortcuts modal using Esc key', async ({
    page,
  }) => {
    await validateCloseKeyboardModalWithEsc(page);
  });

  test('WTE011 - Close keyboard shortcuts modal by clicking overlay', async ({
    page,
  }) => {
    await validateCloseKeyboardModalByOverlayClick(page);
  });

  test('WTE012 - Background interaction blocked while modal open', async ({
    page,
  }) => {
    await validateBackgroundInteractionBlockedWhenModalOpen(page);
  });

  test('WTE013 - Modal responsive and scrollable on small screens', async ({
    page,
  }) => {
    await validateKeyboardModalResponsiveAndScrollable(page);
  });

  test('WTE014 - Keyboard icon not present on non-timesheet pages', async ({
    page,
  }) => {
    await validateKeyboardIconNotVisibleOnOtherPages(page);
  });

  test('WTE015 - Add multiple weekly time entries, save, and verify persistence', async ({
    page,
  }) => {
    await validateAddMultipleRowsAndPersist(page);
  });

  test('WTE016 - Search and select customer/project in Time category', async ({
    page,
  }) => {
    await validateSearchAndSelectCustomerProject(page);
  });

  test('WTE017 - Validate numeric and range constraints on hours', async ({
    page,
  }) => {
    await validateNumericAndRangeConstraintsOnHours(page);
  });

  test('WTE018 - Add Row Functionality for Multiple Rows', async ({ page }) => {
    await validateSaveMultipleWeeklyTimeEntryRows(page);
  });

  test('WTE019 - End-to-End Flow with Search, Add, and Save', async ({
    page,
  }) => {
    await validateEndToEndAddSearchSaveWeeklyTimeEntry(page);
  });

  test('WTE020 - Open keyboard shortcuts modal from Weekly Timesheet page', async ({
    page,
  }) => {
    await validateOpenKeyboardShortcutsModal(page);
  });

  //  test('WTE021 - Add Break Entry In WTE and validate', async ({ page }) => {
  //    await addBreakWte(page);
  //  });

  // test('WTE022 - Edit and delete an existing break entry', async ({ page }) => {
  //   await validateEditAndDeleteBreakEntry(page);
  // });

  // test('WTE023 - Break hours numeric and range constraints', async ({ page }) => {
  //   await validateBreakHoursNumericConstraints(page);
  // });

  // test('WTE024 - Add a time off entry and verify persistence', async ({ page }) => {
  //   await validateAddTimeOffEntryAndPersist(page);
  // });

  // test('WTE025 - Edit and delete a time off entry', async ({ page }) => {
  //   await validateEditAndDeleteTimeOffEntry(page);
  // });

  // test('WTE026 - Date Picker Week Change Validation', async ({ page }) => {
  //   await datePickerAdjustingWeeks(page);
  // });

  test('WTE027 - Change week using datepicker and verify timesheet updates (repeat)', async ({
    page,
  }) => {
    await validateChangeWeekWithDatepickerRepeat(page);
  });

  test('WTE028 - Enter time for one week, switch weeks, verify persistence', async ({
    page,
  }) => {
    await validateChangeWeekWithDatepickerRepeat(page);
  });

  test('WTE029 - Right-Clicked Selected Cell', async ({ page }) => {
    await validateContextMenuOptionsOnCellRightClick(page);
  });

  // test('WTE030 - Add WTE Entry And Validate Start And End Time Toggle On STE', async ({
  //   page,
  // }) => {
  //   await addWTEEntryAndValidateToggleDisabledOnSTE(page);
  // });

  // test('WTE031 - Override confirmation saves on Yes', async ({ page }) => {
  //   await validateConflictOverrideConfirmationSavesOnYes(page);
  // });

  // test('WTE032 - Override cancelled keeps original data', async ({ page }) => {
  //   await validateConflictOverrideCancelledNoChanges(page);
  // });

  test('WTE033 - Verify that the side panel can be collapsed and expanded', async ({
    page,
  }) => {
    await validateSidePanelCollapsedAndExpanded(page);
  });

  test('WTE034 - Verify that the side panel can be collapsed and re-expanded again', async ({
    page,
  }) => {
    await validateSidePanelCollapsedAndReExpanded(page);
  });

  test('WTE035 - Side sheet custom fields and scrollbar', async ({ page }) => {
    await validateSidePanelCustomFields(page);
  });

  test('WTE036 - Show/Hide Fields - WTE', async ({ page }) => {
    await validateWeeklyTimeEntryFieldSettingsPopup(page);
  });

  test('WTE037 - WTE field settings update reflects on grid', async ({
    page,
  }) => {
    await validateWTEFieldSettingsUpdate(page);
  });

  test('WTE038 - Validate Weekly Time Entry Table column header', async ({
    page,
  }) => {
    await validateWeeklyTimeEntryTableColumnsHeader(page);
  });

  test('WTE039 - Validate hot keys display in context menu', async ({
    page,
  }) => {
    await validateHotKeysDisplayInContextMenu(page);
  });

  test('WTE040 - Default to no team member selected', async ({ page }) => {
    await validateDefaultTeamMemberState(page);
  });

  // test('WTE041 - Daily hour limit exceeded shows modal and clears entry', async ({ page }) => {
  //   await validateDailyHourLimitExceededModal(page);
  // });

  // test("WTE042 - Invalid time duration format shows 'Looks like that time format isn't right' modal", async ({ page }) => {
  //   await validateInvalidTimeDurationFormatModal(page);
  // });

  // test('WTE043 - Customer/time category required shows red alert banner', async ({ page }) => {
  //   await validateCustomerTimeCategoryRequiredBanner(page);
  // });

  // test('WTE044 - Weekly limit exceeded shows top red alert banner', async ({ page }) => {
  //   await validateWeeklyLimitExceededBanner(page);
  // });

  test("WTE045 - System can't save changes shows red alert banner", async ({
    page,
  }) => {
    await validateSystemCantSaveChangesBanner(page);
  });

  test("WTE046 - Service unavailable shows 'Something isn't working' message", async ({
    page,
  }) => {
    await validateServiceUnavailableMessage(page);
  });

  // test('WTE047 - Required Custom Fields in Weekly Timesheet Side Panel', async ({
  //   page,
  // }) => {
  //   await validateRequiredCustomFieldsInSidePanel(page);
  // });

  // test('WTE049 - Edit Approved Timesheet', async ({ page }) => {
  //   await validateEditBlockedForApprovedTimesheet(page);
  // });
});
