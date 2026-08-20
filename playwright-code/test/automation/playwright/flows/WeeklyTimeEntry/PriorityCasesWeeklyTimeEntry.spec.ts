import { test } from '@playwright/test';

import { getTestAccount } from '../../config/accounts';
import { openQBOTE } from '../../pages/QBOLogin';
import {
  validateRowHighlightOnCellSelection,
  validateKeyboardShortcutsModal,
  validateWeeklyTimeEntryFieldSettingsPopup,
  validateRequiredCustomFieldsInSidePanel,
  validateEditBlockedForApprovedTimesheet,
  validateContextMenuOptionsOnCellRightClick,
  validateColorPatternToTheCellLevel,
  validateWeeklyTimeEntryTableColumnsHeader,
  validateHotKeysDisplayInContextMenu,
  addBreakWte,
  datePickerAdjustingWeeks,
  addWTEEntryAndValidateToggleDisabledOnSTE,
  expandCollapseSidePanel,
  createAndValidateWeeklyTimeEntry,
  validateSaveMultipleWeeklyTimeEntryRows,
} from '../Util/WeeklyTimeEntry.util';

test.describe('Weekly Time Entry Page Test Cases', () => {
  test.beforeEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    const fastCompanyPicker = /QBO/i.test(testId);
    await openQBOTE(page, credentials, false, fastCompanyPicker);
  });

  test('WTEP001 - Add Weekly Time For Single Row', async ({ page }) => {
    await createAndValidateWeeklyTimeEntry(page);
  });

  test('WTEP002 - Validate Cell Selection Row Highlighted', async ({
    page,
  }) => {
    await validateRowHighlightOnCellSelection(page);
  });

  test('WTEP003 - Save multiple time entry rows for different customers', async ({
    page,
  }) => {
    await validateSaveMultipleWeeklyTimeEntryRows(page);
  });

  // test('WTEP003 - Keyboard Shortcuts Modal Validation', async ({ page }) => {
  //   await validateKeyboardShortcutsModal(page);
  // });

  // test('WTEP004 - Consolidate Color Pattern to the Cell Level', async ({
  //   page,
  // }) => {
  //   await validateColorPatternToTheCellLevel(page);
  // });

  test('WTEP005 - Validate Weekly Time Entry Table column header', async ({
    page,
  }) => {
    await validateWeeklyTimeEntryTableColumnsHeader(page);
  });

  test('WTEP006 - Validate hot keys display in context menu', async ({
    page,
  }) => {
    await validateHotKeysDisplayInContextMenu(page);
  });

  // test('WTEP007 - Add Break Entry In WTE and validate', async ({ page }) => {
  //   await addBreakWte(page);
  // });

  test('WTEP009 - Date Picker Week Change Validation', async ({ page }) => {
    await datePickerAdjustingWeeks(page);
  });

  test('WTEP010 - Add WTE Entry And Validate Start And End Time Toggle On STE', async ({
    page,
  }) => {
    await addWTEEntryAndValidateToggleDisabledOnSTE(page);
  });

  test('WTEP011 - Expand and collapse side panel and validate elements inside it', async ({
    page,
  }) => {
    await expandCollapseSidePanel(page);
  });

  test('WTEP012 - Show/Hide Fields - WTE', async ({ page }) => {
    await validateWeeklyTimeEntryFieldSettingsPopup(page);
  });

  // test('WTEP014 - Required Custom Fields in Weekly Timesheet Side Panel', async ({
  //   page,
  // }) => {
  //   await validateRequiredCustomFieldsInSidePanel(page);
  // });

  // test('WTEP015 - Edit Approved Timesheet', async ({ page }) => {
  //   await validateEditBlockedForApprovedTimesheet(page);
  // });

  test('WTEP016 - Right-Clicked Selected Cell', async ({ page }) => {
    await validateContextMenuOptionsOnCellRightClick(page);
  });

  // NOTE: WTE QBO-user lifecycle coverage moved to
  // flows/QBO/WeeklyTimeEntryQBO.spec.ts (one case per QBO SKU account).
});
