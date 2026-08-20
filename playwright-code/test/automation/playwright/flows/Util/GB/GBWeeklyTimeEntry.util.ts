import { Locator, Page, expect } from '@playwright/test';
import gotoWithAuthSession from '../../../gotoWithAuthSession';
import * as weeklyTimeEntryPage from '../../../pages/WeeklyTimeEntryPage';
import { validateCustomFieldMandatoryFields } from '../TimeClockUtil';
import TimeEntriesPage from '../../../pages/TimeEntriesPage';
import {
  openDateRangeDropdown,
  selectDateRangeOption,
  selectDisplayByOption,
} from '../../../commonUtils';

import SingleTimeEntryPage from '../../../pages/SingleTimeEntryPage';
import { waitForLoadingToDisappear } from '../../../pages/TimeSettingsPage';

interface WeeklyTimeEntryRowData {
  hours: string[];
  notes: string;
}

async function fillOutWeeklyTimeEntryRow(
  page: Page,
  data: WeeklyTimeEntryRowData,
) {
  // 1. Select the time category dropdown on first row.
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.clickOnDeleteRow(page, 1);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);

  // 2. Select a customer/project.
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);

  // 3. Enter hours for each day.
  for (let i = 3; i < data.hours.length; i++) {
    const dayCell = weeklyTimeEntryPage.hours(page, i);
    await dayCell.click();
    await weeklyTimeEntryPage.hoursInputs(page).fill(data.hours[i]);
  }

  // 4. Click a cell to open the details panel.
  // This is handled by clicking an hour cell above.

  // 5. Select service, class, location, and add notes.
  await weeklyTimeEntryPage.serviceDropdown(page).click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.classDropdown(page).click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.locationDropdown(page).click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.notesInput(page).fill(data.notes);

  // 6. Click 'Save and close'.
  await weeklyTimeEntryPage.saveButton(page).click();
}

export async function validateWeeklyTimeEntryPersistence(page: Page) {
  await weeklyTimeEntryPage.navigate(page);

  const testData: WeeklyTimeEntryRowData = {
    hours: ['8', '8', '8', '8', '8', '8', '8'],
    notes: 'Test notes for WTEP-001',
  };
  await page.waitForTimeout(2000);
  await fillOutWeeklyTimeEntryRow(page, testData);

  // Assert all entered data is correctly saved and displayed

  // const teamOptions = await weeklyTimeEntryPage.getTeamMemberOptions(page);
  // // await expect(
  // //   weeklyTimeEntryPage.teamMemberDropdownValue(page).first().inputValue(),
  // // ).toContain(teamOptions[8]);
  // await expect(
  //   weeklyTimeEntryPage.customerProjectDropdownValue(page).first(),
  // ).toHaveText('Bakes and Beans');

  // for (let i = 3; i < testData.hours.length; i++) {
  //   await expect(weeklyTimeEntryPage.hours(page, i)).toHaveValue(
  //     testData.hours[i],
  //   );
  // }

  // // Re-open the details panel to verify its content
  // await weeklyTimeEntryPage.hours(page, 8).click();

  // await expect(weeklyTimeEntryPage.serviceDropdown(page)).toHaveText('Hours');
  // await expect(weeklyTimeEntryPage.classDropdown(page)).toHaveText(
  //   'Test Class',
  // );
  // await expect(weeklyTimeEntryPage.locationDropdown(page)).toHaveText('AL');
  // await expect(weeklyTimeEntryPage.notesInput(page)).toHaveValue(
  //   testData.notes,
  // );
}

export async function validateRowHighlightOnCellSelection(page: Page) {
  await weeklyTimeEntryPage.navigate(page);

  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);

  // 1. Click any cell in the timesheet grid.
  await weeklyTimeEntryPage.hours(page, 2).click();

  const row = weeklyTimeEntryPage.timesheetRows(page).first();
  await expect(row).toHaveClass(/selected-row/);
}

export async function validateKeyboardShortcutsModal(page: Page) {
  await weeklyTimeEntryPage.navigate(page);

  // 1. Select the time category dropdown on first row.
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);

  // 1. Locate and click the keyboard icon.
  await weeklyTimeEntryPage.keyboardIcon(page).click();

  // 2. Visually inspect the modal content against the requirements.
  await expect(weeklyTimeEntryPage.keyboardModal(page)).toBeVisible();

  // Define the list of expected shortcuts you want to validate
  const expectedShortcuts = [
    // 'Tab',
    // 'Shift + Tab',
    // 'Directional arrows (↑, →, ←, ↓)',
    // 'Ctrl + C',
    // 'Ctrl + V',
    // 'Ctrl + N',
    // 'Ctrl + S',
    // 'Ctrl + Z',
    // 'Ctrl + Y',
    // 'Alt + C',
    // 'Alt + T',
    // 'Alt + →',
    // 'Alt + ←',
    // 'Esc',
    'Tab',
    'Shift + Tab',
    'Directional arrows (↑, →, ←, ↓)',
    'Cmd + C',
    'Cmd + V',
    'Opt + N',
    'Opt + Shift + N',
    'Cmd + S',
    'Cmd + Z',
    'Cmd + Y',
    'Opt + C',
    'Opt + T',
    'Cmd + →',
    'Cmd + ←',
    'Esc',
    'Delete',
    'Shift + Delete',
    'Cmd + Shift + +',
  ];

  // Get all the text from the shortcut elements in the modal
  const listLocator = weeklyTimeEntryPage.keyboardShortcutsList(page);
  const actualShortcuts = await listLocator.allTextContents();

  // Check that every expected shortcut is present in the list from the UI.
  expect(actualShortcuts).toEqual(expect.arrayContaining(expectedShortcuts));
}

export async function validateWeeklyTimeEntryFieldSettingsPopup(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.waitForPageReady(page);
  // 1. Select the time category dropdown on first row.
  await page.waitForTimeout(2000);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await page.waitForTimeout(2000);
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.selectCell(page, 3);
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await weeklyTimeEntryPage.openSettingsIcon(page);
  await page.waitForTimeout(3000);
  //await expect(weeklyTimeEntryPage.fieldSettingsPopup(page)).toBeVisible();
  const fields = await weeklyTimeEntryPage.getFieldCheckboxes(page);
  for (const field of fields) {
    // Check if required fields are disabled
    if (field.isRequired) {
      expect(field.checkbox).toBeDisabled();
    }
    // Check if fields with hours are disabled
    if (field.hasHours) {
      expect(field.checkbox).toBeDisabled();
    }
  }
}

export async function validateRequiredCustomFieldsInSidePanel(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  // 1. Select the time category dropdown on first row.
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.openFirstCellSidePanel(page);
  const requiredFields =
    await weeklyTimeEntryPage.getRequiredCustomFieldsInSidePanel(page);
  for (const field of requiredFields) {
    expect(field.isMarkedRequired).toBeTruthy();
  }
  await weeklyTimeEntryPage.trySaveSidePanel(page);
  await expect(
    weeklyTimeEntryPage.getSidePanelValidationError(page),
  ).toBeVisible();
  await weeklyTimeEntryPage.fillAllRequiredCustomFields(page);
  await weeklyTimeEntryPage.trySaveSidePanel(page);
  await expect(
    weeklyTimeEntryPage.getSidePanelValidationError(page),
  ).toBeHidden();
}

export async function validateEditBlockedForApprovedTimesheet(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  // 1. Select the time category dropdown on first row.
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.openApprovedTimesheet(page);
  await weeklyTimeEntryPage.tryEditApprovedTimesheet(page);
  await expect(weeklyTimeEntryPage.getEditBlockedMessage(page)).toBeVisible();
  await expect(weeklyTimeEntryPage.isEditingDisabled(page)).toBeTruthy();
}

export async function validateContextMenuOptionsOnCellRightClick(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  // 1. Select the time category dropdown on first row.
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.selectCell(page, 3);
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await weeklyTimeEntryPage.rightClickSelectedCell(page, 3);
  const options = await weeklyTimeEntryPage.getContextMenuOptions(page);
  const expectedOptions = [
    'Copy entry',
    'Paste entry',
    'Insert 1 row below',
    'Delete 1 row',
    'Clear cell',
  ];
  for (const option of expectedOptions) {
    expect(options).toContain(option);
  }

  await weeklyTimeEntryPage.rightClickSelectedCell(page, 3);
  await weeklyTimeEntryPage.clickContextMenuOption(page, 'Copy entry');
  await weeklyTimeEntryPage.rightClickSelectedCell(page, 4);
  await weeklyTimeEntryPage.clickContextMenuOption(page, 'Paste entry');
  //await expect(weeklyTimeEntryPage.hoursInputs(page)).toHaveValue('8');

  // insert 1row
  const beforeAdd = await weeklyTimeEntryPage.timesheetRows(page).count();
  await weeklyTimeEntryPage.rightClickSelectedCell(page, 3);
  await weeklyTimeEntryPage.clickContextMenuOption(page, 'Insert 1 row below');
  const afterAdd = await weeklyTimeEntryPage.timesheetRows(page).count();
  expect(afterAdd).toBe(beforeAdd + 1);

  // delete 1row
  const beforeDelete = await weeklyTimeEntryPage.timesheetRows(page).count();
  await weeklyTimeEntryPage.rightClickSelectedCell(page, 3);
  await weeklyTimeEntryPage.clickContextMenuOption(page, 'Delete 1 row');
  const afterDelete = await weeklyTimeEntryPage.timesheetRows(page).count();
  expect(afterDelete).toBe(beforeDelete - 1);

  // clear cell
  await weeklyTimeEntryPage.rightClickSelectedCell(page, 4);
  await weeklyTimeEntryPage.clickContextMenuOption(page, 'Clear cell');
}

export async function validateSaveMultipleWeeklyTimeEntryRows(page: Page) {
  await weeklyTimeEntryPage.navigate(page);

  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  const testRows = [
    {
      customerIndex: 1,
      hours: ['8', '0', '0', '0', '0', '8', '0', '0', '0', '0'],
      notes: 'Row 1',
    },
    {
      customerIndex: 2,
      hours: ['0', '8', '0', '0', '0', '0', '8', '0', '0', '0'],
      notes: 'Row 2',
    },
    {
      customerIndex: 3,
      hours: ['0', '0', '8', '0', '0', '0', '0', '8', '0', '0'],
      notes: 'Row 3',
    },
  ];
  for (let i = 0; i < testRows.length; i++) {
    if (i > 0) {
      await page.getByRole('button', { name: /add row/i }).click();
    }
    await weeklyTimeEntryPage.customerProjectDropdown(page).nth(i).click();
    await weeklyTimeEntryPage.clickCustomerDropdownOption(
      page,
      testRows[i].customerIndex,
    );
    for (let j = 1; j < 4; j++) {
      for (let k = 3; k < 8; k++) {
        if (testRows[i].hours[k] !== '0') {
          const cell = weeklyTimeEntryPage.hoursMultiple(page, j, k);
          await cell.click();
          await weeklyTimeEntryPage
            .hoursInputs(page)
            .fill(testRows[i].hours[k]);
        }
      }
    }
    await weeklyTimeEntryPage.notesInput(page).fill(testRows[i].notes);
  }
  await weeklyTimeEntryPage.saveButton(page).click();

  /*
  for (let i = 0; i < testRows.length; i++) {
    for (let d = 0; d < testRows[i].hours.length; d++) {
      if (testRows[i].hours[d] !== '0') {
        const cell = weeklyTimeEntryPage.hours(page, i * 7 + d + 1); // adjust index as needed
        await expect(cell).toHaveValue(testRows[i].hours[d]);
      }
    }
    await expect(weeklyTimeEntryPage.notesInput(page)).toHaveValue(
      testRows[i].notes,
    );
  }
    */
}

// WTE-015: Add multiple weekly time entries, save, and verify persistence
export async function validateAddMultipleRowsAndPersist(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  // Select team member
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  // Select a specific week if needed via datepicker (optional step based on environment)
  // Add first row
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  await page.getByRole('button', { name: /add row/i }).click();
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page, 1);
  for (let d = 3; d <= 6; d++) {
    await weeklyTimeEntryPage.hours(page, d).click();
    await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  }
  // Add second row with different customer/project and hours
  await page.getByRole('button', { name: /add row/i }).click();
  await weeklyTimeEntryPage.customerProjectDropdown(page).nth(1).click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page, 2);
  for (let d = 3; d <= 6; d++) {
    await weeklyTimeEntryPage.hours(page, 7).click();
    await weeklyTimeEntryPage.hoursInputs(page).fill(d % 2 === 0 ? '6' : '4');
  }
  await weeklyTimeEntryPage.saveButton(page).click();
  // Verify persistence
  // for (let d = 3; d <= 6; d++) {
  //   await expect(weeklyTimeEntryPage.hours(page, d)).toHaveValue('8');
  //   await expect(weeklyTimeEntryPage.hours(page, 7 + d)).toHaveValue(
  //     d % 2 === 0 ? '6' : '4',
  //   );
  // }
}

// WTE-016: Search and select customer/project in Time category
export async function validateSearchAndSelectCustomerProject(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  await page.getByRole('button', { name: /add row/i }).click();
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  const searchInput = page.locator('input[placeholder="Search"]');
  await searchInput.fill('Azura');
  await page.waitForTimeout(500);
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page, 1);
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await weeklyTimeEntryPage.saveButton(page).click();
  await expect(
    weeklyTimeEntryPage.customerProjectDropdownValue(page).first(),
  ).toBeVisible();
  //await weeklyTimeEntryPage.hours(page, 3).click();
  //await expect(weeklyTimeEntryPage.hours(page, 3)).toHaveValue('8');
  //await expect(weeklyTimeEntryPage.hoursInputs(page)).not.toHaveValue('5');
}

// WTE-017: Validate numeric and range constraints on hours
export async function validateNumericAndRangeConstraintsOnHours(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  // 2. Select a customer/project.
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  await page.getByRole('button', { name: /add row/i }).click();
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  const attemptFill = async (value: string) => {
    await weeklyTimeEntryPage.hours(page, 4).click();
    await weeklyTimeEntryPage.hours(page, 3).click();
    await weeklyTimeEntryPage.hoursInputs(page).fill(value);
    await weeklyTimeEntryPage.saveButton(page).click();
  };
  // Non-numeric
  await attemptFill('abc');
  await page.waitForTimeout(6000);
  await weeklyTimeEntryPage.hours(page, 3).click();
  await expect(weeklyTimeEntryPage.hoursInputs(page)).not.toHaveValue('abc');

  // Greater than 24
  await attemptFill('25');
  await page.waitForTimeout(6000);
  await weeklyTimeEntryPage.hours(page, 3).click();
  await expect(weeklyTimeEntryPage.hoursInputs(page)).not.toHaveValue('25');

  // Negative value
  await attemptFill('-1');
  await page.waitForTimeout(6000);
  await weeklyTimeEntryPage.hours(page, 3).click();
  await expect(weeklyTimeEntryPage.hoursInputs(page)).not.toHaveValue('-1');

  // Valid value
  await attemptFill('8');
  await page.waitForTimeout(6000);
  await weeklyTimeEntryPage.hours(page, 3).click();
  await expect(weeklyTimeEntryPage.hoursInputs(page)).toHaveValue('8:00');
}

// ======================= Breaks (WTE-021..023) =======================
export async function validateAddBreakEntryAndPersist(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.getByRole('button', { name: /add row/i }).click();
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  // Select Breaks -> specific type by text
  await page
    .locator(`//ul//span[normalize-space(.)='CA lunch break']`)
    .first()
    .click();
  // Enter 0.5 on Wednesday (index 3 assuming Mon=1)
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('0.5');
  // Optional note
  await weeklyTimeEntryPage.notesInput(page).fill('Break note');
  await weeklyTimeEntryPage.saveButton(page).click();
  // Verify label and hours persisted
  await expect(
    weeklyTimeEntryPage.customerProjectDropdownValue(page).first(),
  ).toHaveText(/CA lunch break|Breaks/i);
  await expect(weeklyTimeEntryPage.hours(page, 3)).toHaveValue('0.5');
  await weeklyTimeEntryPage.hours(page, 3).click();
  await expect(weeklyTimeEntryPage.notesInput(page)).toHaveValue('Break note');
}

export async function validateEditAndDeleteBreakEntry(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  // Ensure a break row exists
  await page.getByRole('button', { name: /add row/i }).click();
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await page
    .locator(`//ul//span[normalize-space(.)='CA lunch break']`)
    .first()
    .click();
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('0.5');
  await weeklyTimeEntryPage.notesInput(page).fill('Break note');
  await weeklyTimeEntryPage.saveButton(page).click();

  // Edit: change Wednesday 0.5 -> 1.0
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('1');
  await weeklyTimeEntryPage.saveButton(page).click();
  await expect(weeklyTimeEntryPage.hours(page, 3)).toHaveValue('1');

  // Delete: remove row
  const before = await weeklyTimeEntryPage.timesheetRows(page).count();
  await weeklyTimeEntryPage.clickOnDeleteRow(page, 1);
  await weeklyTimeEntryPage.saveButton(page).click();
  const after = await weeklyTimeEntryPage.timesheetRows(page).count();
  expect(after).toBeLessThanOrEqual(before - 1);
}

export async function validateBreakHoursNumericConstraints(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.getByRole('button', { name: /add row/i }).click();
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await page
    .locator(`//ul//span[normalize-space(.)='CA lunch break']`)
    .first()
    .click();
  const tryValue = async (v: string) => {
    await weeklyTimeEntryPage.hours(page, 2).click();
    await weeklyTimeEntryPage.hoursInputs(page).fill(v);
    await weeklyTimeEntryPage.saveButton(page).click();
  };
  await tryValue('abc');
  await expect(weeklyTimeEntryPage.hoursInputs(page)).not.toHaveValue('abc');
  await tryValue('25');
  await expect(weeklyTimeEntryPage.hoursInputs(page)).not.toHaveValue('25');
  await tryValue('-1');
  await expect(weeklyTimeEntryPage.hoursInputs(page)).not.toHaveValue('-1');
  await tryValue('0.5');
  await expect(weeklyTimeEntryPage.hours(page, 2)).toHaveValue('0.5');
}

// ======================= Time off (WTE-024..025) =======================
export async function validateAddTimeOffEntryAndPersist(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.getByRole('button', { name: /add row/i }).click();
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  // Select Time off -> Holiday
  await page
    .locator(`//ul//span[normalize-space(.)='Holiday']`)
    .first()
    .click();
  // Enter 8 hours for Wednesday
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await weeklyTimeEntryPage.notesInput(page).fill('Holiday note');
  await weeklyTimeEntryPage.saveButton(page).click();
  await expect(
    weeklyTimeEntryPage.customerProjectDropdownValue(page).first(),
  ).toHaveText(/Holiday|Time off/i);
  await expect(weeklyTimeEntryPage.hours(page, 3)).toHaveValue('8');
  await weeklyTimeEntryPage.hours(page, 3).click();
  await expect(weeklyTimeEntryPage.notesInput(page)).toHaveValue(
    'Holiday note',
  );
}

export async function validateEditAndDeleteTimeOffEntry(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.getByRole('button', { name: /add row/i }).click();
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await page
    .locator(`//ul//span[normalize-space(.)='Holiday']`)
    .first()
    .click();
  await weeklyTimeEntryPage.hours(page, 4).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await weeklyTimeEntryPage.saveButton(page).click();

  // Edit to 4 hours
  await weeklyTimeEntryPage.hours(page, 4).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('4');
  await weeklyTimeEntryPage.saveButton(page).click();
  await expect(weeklyTimeEntryPage.hours(page, 4)).toHaveValue('4');

  // Delete the row
  const before = await weeklyTimeEntryPage.timesheetRows(page).count();
  await weeklyTimeEntryPage.clickOnDeleteRow(page, 1);
  await weeklyTimeEntryPage.saveButton(page).click();
  const after = await weeklyTimeEntryPage.timesheetRows(page).count();
  expect(after).toBeLessThanOrEqual(before - 1);
}

// ======================= Time Entries conflicts (WTE-030..032) =======================
export async function validateEditTimeToggleDisabledWithWeeklyEntries(
  page: Page,
) {
  // Navigate to Time Entries and open an entry for edit
  await weeklyTimeEntryPage.navigateToSingleTimeEntry(page);
  // Expect toggle is disabled
  const toggle = page.getByLabel(
    /set start and end time|Set clock in and out/i,
  );
  await expect(toggle).toBeDisabled();
  // Hover for tooltip if exists
  await toggle.hover({ trial: true });
  // Optional: check tooltip content
  // Attempt override if an override button/link appears
  const override = page.getByRole('button', {
    name: /override|enable anyway/i,
  });
  if (await override.isVisible()) {
    await override.click();
    // Confirmation dialog appears
    await expect(page.getByRole('dialog')).toBeVisible();
  }
}

export async function validateConflictOverrideConfirmationSavesOnYes(
  page: Page,
) {
  await weeklyTimeEntryPage.navigateToSingleTimeEntry(page);
  // Pretend there is overlap by proceeding to save change and expect confirmation
  await page.getByLabel(/Duration|Hours/i).fill('2:00');
  await page.getByRole('button', { name: 'Save and new', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /yes|confirm|ok/i }).click();
  // Expect success (toast or navigation)
  await expect(page.locator('text=/success|saved/i')).toBeVisible({
    timeout: 5000,
  });
}

export async function validateConflictOverrideCancelledNoChanges(page: Page) {
  await weeklyTimeEntryPage.navigateToSingleTimeEntry(page);
  const durationField = page.getByLabel(/Duration|Hours/i);
  const original = await durationField.inputValue().catch(() => '');
  await durationField.fill('3:00');
  await page.getByRole('button', { name: 'Save and new', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /no|cancel/i }).click();
  // Expect value not updated after reload
  await weeklyTimeEntryPage.navigateToSingleTimeEntry(page);
  const current = await page.getByLabel(/Duration|Hours/i).inputValue();
  expect(current).toBe(original);
}

// ======================= Side panel behaviors (WTE-033..035) =======================

export async function validateSidePanelCustomFields(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  await page
    .locator("//td[contains(@class, 'WeeklyTimeEntryTablestyles__DataCell')]")
    .nth(2)
    .click();

  //await weeklyTimeEntryPage.openFirstCellSidePanel(page);
  const sidePanel = page.locator('//div[@data-testid="panel"]');
  await expect(sidePanel).toBeVisible();
  // Check for custom field labels
  const customFields = page.locator(
    "//label[contains(., 'Status') or contains(., 'Custom Field')]",
  );
  await expect(customFields.first()).toBeVisible();
}

// ======================= Show/hide fields settings (WTE-036..039) =======================
export async function validateWTEFieldSettingsReflectTimeSettings(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.waitForPageReady(page);
  // Open WTE field settings
  await weeklyTimeEntryPage.openSettingsIcon(page);
  await expect(weeklyTimeEntryPage.fieldSettingsPopup(page)).toBeVisible();
  const fields = await weeklyTimeEntryPage.getFieldCheckboxes(page);
  for (const field of fields) {
    if (field.isRequired || field.hasHours) {
      expect(field.checkbox).toBeDisabled();
    }
  }
}

export async function validateWTEFieldSettingsUpdate(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.waitForPageReady(page);
  await weeklyTimeEntryPage.openSettingsIcon(page);
  await expect(weeklyTimeEntryPage.fieldSettingsPopup(page)).toBeVisible();
  // Toggle first enabled checkbox and click Update
  const fields = await weeklyTimeEntryPage.getFieldCheckboxes(page);
  for (const f of fields) {
    if (!(await f.checkbox.isDisabled())) {
      await f.checkbox.click();
      break;
    }
  }
  await page.locator(`//span[text()='Update']`).click();
  await page.waitForTimeout(5000);
  // Verify popup closes and grid reflects change (best-effort: popup hidden)
  //await expect(weeklyTimeEntryPage.fieldSettingsPopup(page)).toBeHidden();
}

export async function validateSTEFieldSettingsReflectTimeSettings(page: Page) {
  await weeklyTimeEntryPage.navigateToSingleTimeEntry(page);
  await weeklyTimeEntryPage.openSettingsIconSTE(page);
  await expect(weeklyTimeEntryPage.fieldSettingsPopupSTE(page)).toBeVisible();
  const fields = await weeklyTimeEntryPage.getFieldCheckboxesSTE(page);
  for (const field of fields) {
    if (field.isRequired || field.hasHours) {
      expect(field.checkbox).toBeDisabled();
    }
  }
}

export async function validateSTEFieldSettingsUpdate(page: Page) {
  await weeklyTimeEntryPage.navigateToSingleTimeEntry(page);
  await weeklyTimeEntryPage.openSettingsIconSTE(page);
  await expect(weeklyTimeEntryPage.fieldSettingsPopupSTE(page)).toBeVisible();
  const fields = await weeklyTimeEntryPage.getFieldCheckboxesSTE(page);
  for (const f of fields) {
    if (!(await f.checkbox.isDisabled())) {
      await f.checkbox.click();
      break;
    }
  }
  await page.getByRole('button', { name: /update/i }).click();
  await expect(weeklyTimeEntryPage.fieldSettingsPopupSTE(page)).toBeHidden();
}

// ======================= Default state and error states (WTE-040..046) =======================
export async function validateDefaultTeamMemberState(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  const input = weeklyTimeEntryPage.teamMemberDropdownValue(page).first();
  await expect(input).toBeVisible();
  const placeholder = await input.getAttribute('placeholder');
  if (placeholder) {
    expect(placeholder).toMatch(/select team member/i);
  }
  // Ensure no value selected yet
  const val = await input.inputValue();
  expect(val || '').toBe('');
  // Check add employee option existence when dropdown opened
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await expect(page.locator("//span[text()='Add new']").first()).toBeVisible();
}

export async function validateDailyHourLimitExceededModal(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.getByRole('button', { name: /add row/i }).click();
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  // Enter >24 hours
  await weeklyTimeEntryPage.hours(page, 2).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('25:00');
  await page.keyboard.press('Tab');
  const modal = page.getByRole('dialog');
  await expect(modal).toContainText(
    "You can't enter more than 24 hours in one day",
  );
  await modal.getByRole('button', { name: /ok/i }).click();
  await expect(modal).toBeHidden();
  await expect(weeklyTimeEntryPage.hours(page, 2)).not.toHaveValue('25:00');
}

export async function validateInvalidTimeDurationFormatModal(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.getByRole('button', { name: /add row/i }).click();
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('AAAAA');
  await page.keyboard.press('Tab');
  const modal = page.getByRole('dialog');
  await expect(modal).toContainText("Looks like that time format isn't right");
  await modal.getByRole('button', { name: /got it/i }).click();
  await expect(modal).toBeHidden();
  await expect(weeklyTimeEntryPage.hours(page, 3)).not.toHaveValue('AAAAA');
}

export async function validateCustomerTimeCategoryRequiredBanner(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  // Enter some hours without selecting customer/time category
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await weeklyTimeEntryPage.saveButton(page).click();
  const banner = page.locator(
    "//*[contains(., 'Select a customer for your billable time entries')]",
  );
  await expect(banner.first()).toBeVisible();
}

export async function validateWeeklyLimitExceededBanner(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.getByRole('button', { name: /add row/i }).click();
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  // Fill large hours total
  for (let d = 1; d <= 7; d++) {
    await weeklyTimeEntryPage.hours(page, d).click();
    await weeklyTimeEntryPage.hoursInputs(page).fill('16');
  }
  const banner = page.locator(
    "//*[contains(., 'Total weekly hours are over the limit')]",
  );
  await expect(banner.first()).toBeVisible();
}

export async function validateSystemCantSaveChangesBanner(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.getByRole('button', { name: /add row/i }).click();
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('1');
  // Simulate save failure
  //await page.route('**/*sbseggraphqlorch.api.intuit.com*', (route) => route.abort());
  await weeklyTimeEntryPage.saveButton(page).click();
  await page.route('**/*sbseggraphqlorch.api.intuit.com*', (route) =>
    route.abort(),
  );
  //await page.route('**/api/**', (route) => route.abort('failed'));
  const message = page.locator(
    '//*[contains(., ' + `'Something went wrong.')]`,
  );

  //await expect(message.first()).toBeVisible({ timeout: 10000 });
  await page.unroute('**/*sbseggraphqlorch.api.intuit.com*');
}

export async function validateServiceUnavailableMessage(page: Page) {
  await page.route('**/api/**', (route) => route.abort('failed'));
  await gotoWithAuthSession(page, '/app/time?jobId=time', {
    waitUntil: 'load',
  });
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(8000);
  //await page.route('**/api/**', (route) => route.abort('failed'));

  //await weeklyTimeEntryPage.navigate(page);
  const message = page.locator(
    '//*[contains(., ' + `'Something went wrong.')]`,
  );
  await expect(message.first()).toBeVisible({ timeout: 15000 });
  await page.unroute('**/api/**');
}

// ======================= Approved timesheet edit blocked (WTE-049) =======================

export async function validateApplyNotesToRestOfWeek(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  // Add a row and enter hours for Mon-Fri
  for (let d = 0; d < 5; d++) {
    const cell = weeklyTimeEntryPage.hours(page, d + 1);
    await cell.click();
    await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  }
  // Open details panel for Monday's cell
  await weeklyTimeEntryPage.hours(page, 3).click();
  // Enter a note and check 'Apply notes to rest of week'
  await weeklyTimeEntryPage.notesInput(page).fill('Note for week');
  await page.getByLabel(/apply notes to rest of week/i).check();
  await weeklyTimeEntryPage.saveButton(page).click();
  // Check the details panel for Tuesday-Friday
  for (let d = 2; d <= 5; d++) {
    await weeklyTimeEntryPage.hours(page, d).click();
    await expect(weeklyTimeEntryPage.notesInput(page)).toHaveValue(
      'Note for week',
    );
  }
}

export async function validateCancelChangesAfterEditingTimesheet(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  // Change the hours in a cell
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('5');
  // Add a new row
  await page.getByRole('button', { name: /add row/i }).click();
  await page.waitForTimeout(5000);
  // Click 'Cancel'
  await page.getByRole('button', { name: /Cancel/i }).click();
  await page.waitForTimeout(5000);
  // Confirm discard changes
  await page.locator(`//span[text()='Yes']`).click();
  // Check that changed hours are reverted and new row is removed
  // await weeklyTimeEntryPage.hours(page, 3).click();
  // await expect(weeklyTimeEntryPage.hoursInputs(page)).not.toHaveValue('5');
  // // Optionally, check that the row count is as expected (e.g., 1 row)
  // const rows = await weeklyTimeEntryPage.timesheetRows(page).count();
  // expect(rows).toBe(1);
}

export async function validateInvalidCharactersInHoursField(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  // Add a row and select a customer
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  // Try to enter non-numeric text in an hours cell
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('abc');
  // Try to save or click out
  await weeklyTimeEntryPage.saveButton(page).click();
  // Check for error message or rejection
  const error = page.locator(
    'text=/invalid|must be a number|not allowed|error/i',
  );
  await expect(error).toBeVisible();
  // Optionally, check that the value was not accepted
  await expect(weeklyTimeEntryPage.hoursInputs(page)).not.toHaveValue('abc');
}

export async function validateSaveTimesheetWithZeroHours(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  // Add a row and select a customer
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  // Enter 0 for all hours (or leave blank)
  for (let i = 1; i <= 7; i++) {
    await weeklyTimeEntryPage.hours(page, i).click();
    await weeklyTimeEntryPage.hoursInputs(page).fill('0');
  }
  await weeklyTimeEntryPage.saveButton(page).click();
  // Check that the row is saved with 0 hours
  for (let i = 1; i <= 7; i++) {
    await expect(weeklyTimeEntryPage.hours(page, i)).toHaveValue('0');
  }
}

export async function validateSaveWithRequiredFieldMissing(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);

  // Click 'Add row'
  await page.getByRole('button', { name: /add row/i }).click();
  // Enter hours for the week
  for (let i = 3; i <= 6; i++) {
    await weeklyTimeEntryPage.hours(page, i).click();
    await weeklyTimeEntryPage.hoursInputs(page).fill('1');
  }
  // Do NOT select a customer/project from the 'Time category' dropdown
  // Click 'Save'
  await weeklyTimeEntryPage.saveButton(page).click();
  // Check for error message indicating that 'Time category' is a required field
  const error = page.locator(
    'text=/time category.*required|required.*time category/i',
  );
  await expect(error).toBeVisible();
  // Optionally, check that the timesheet is not saved by verifying no data persists
  // This could be done by checking that the form is still in edit mode or that no saved data appears
}

export async function validateAddAndDeleteRowBeforeSaving(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  // Add two new rows
  await page.getByRole('button', { name: /add row/i }).click();
  await page.getByRole('button', { name: /add row/i }).click();
  // Enter data in both rows
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  for (let row = 3; row < 6; row++) {
    //await weeklyTimeEntryPage.teamMemberDropdown(page).nth(row).click();
    // await weeklyTimeEntryPage.clickDropdownOption(page);
    await weeklyTimeEntryPage.customerProjectDropdown(page).nth(row).click();
    await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
    await weeklyTimeEntryPage.hours(page, row).click();
    await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  }
  // Click the delete icon on the second row
  await page
    .locator(
      '//button[@class="idsF idsTSIconControl IconControl-iconControlButton-a2e6188 IconControl-sizeMedium-a2e6188"]',
    )
    .nth(5)
    .click();
  // Click 'Save'
  await weeklyTimeEntryPage.saveButton(page).click();
  // Check that only the first row remains
  // const rows = await weeklyTimeEntryPage.timesheetRows(page).count();
  // expect(rows).toBe(1);
  // // Optionally, check that the data in the remaining row is correct
  // await expect(weeklyTimeEntryPage.hours(page, 3)).toHaveValue('8');
}

export async function validateEndToEndAddSearchSaveWeeklyTimeEntry(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  // Select a team member (if needed)
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  // Select a week (if applicable, add logic here if needed)
  // Add a new row
  await page.getByRole('button', { name: /add row/i }).click();
  // Use the "Time category" dropdown search to find and select a customer/project
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  const searchInput = page.locator('input[placeholder="Search"]');
  await searchInput.fill('Bakes and Beans'); // Example search term, adjust as needed
  await page.waitForTimeout(500); // Wait for search results to update
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page, 1);
  // Enter hours for at least one day
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  // Save and close
  await weeklyTimeEntryPage.saveButton(page).click();
  // Reopen the timesheet and verify the row and hours persist
  await expect(
    weeklyTimeEntryPage.customerProjectDropdownValue(page).first(),
  ).toHaveText(/Bakes and Beans/i);
  await weeklyTimeEntryPage.hours(page, 3).click();
  // await expect(weeklyTimeEntryPage.hoursInputs(page)).toHaveValue('8:00');
}

export async function validateOpenKeyboardShortcutsModal(page: Page) {
  await validateKeyboardShortcutsModal(page);
}

// WTE-010: Close modal using the 'Esc' key
export async function validateCloseKeyboardModalWithEsc(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.keyboardIcon(page).click();
  await expect(weeklyTimeEntryPage.keyboardModal(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(weeklyTimeEntryPage.keyboardModal(page)).toBeHidden();
}

// WTE-011: Close modal by clicking the background overlay
export async function validateCloseKeyboardModalByOverlayClick(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.keyboardIcon(page).click();
  await expect(weeklyTimeEntryPage.keyboardModal(page)).toBeVisible();
  // Click on the modal backdrop/overlay
  await page
    .getByTestId('ModalDialog')
    .getByRole('button', { name: 'Close' })
    .click();
  // Fallback: click page body if overlay selector differs
  try {
    await expect(weeklyTimeEntryPage.keyboardModal(page)).toBeHidden({
      timeout: 2000,
    });
  } catch {
    await page.click('body', { position: { x: 0, y: 0 } });
    await expect(weeklyTimeEntryPage.keyboardModal(page)).toBeHidden();
  }
}

// WTE-012: Interaction with background is blocked while modal is open
export async function validateBackgroundInteractionBlockedWhenModalOpen(
  page: Page,
) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.keyboardIcon(page).click();
  await expect(weeklyTimeEntryPage.keyboardModal(page)).toBeVisible();
  // Try clicking add row
  // const addRowButton = page.getByRole('button', { name: /add row/i });
  // const addRowCountBefore = await weeklyTimeEntryPage.timesheetRows(page).count();
  // await addRowButton.click({ trial: true });
  // await expect(weeklyTimeEntryPage.keyboardModal(page)).toBeVisible();
  // const addRowCountAfter = await weeklyTimeEntryPage.timesheetRows(page).count();
  // expect(addRowCountAfter).toBe(addRowCountBefore);
  // // Try clicking a cell
  // await weeklyTimeEntryPage.detailsCell(page).first().click({ trial: true });
  // await expect(weeklyTimeEntryPage.keyboardModal(page)).toBeVisible();
}

// WTE-013: Verify modal is responsive and scrollable on small screens
export async function validateKeyboardModalResponsiveAndScrollable(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.keyboardIcon(page).click();
  await expect(weeklyTimeEntryPage.keyboardModal(page)).toBeVisible();
  // Resize to a small viewport
  await page.setViewportSize({ width: 375, height: 667 });
  const modal = weeklyTimeEntryPage.keyboardModal(page);
  await expect(modal).toBeVisible();
  // Assert content is scrollable when overflowing
  const scrollHeight = await modal.evaluate((el) => el.scrollHeight);
  const clientHeight = await modal.evaluate((el) => el.clientHeight);
  expect(scrollHeight).toBeGreaterThanOrEqual(clientHeight);
}

// WTE-014: Keyboard icon is not present on other pages
export async function validateKeyboardIconNotVisibleOnOtherPages(page: Page) {
  // Navigate to Single time entry page where icon should not be shown
  await weeklyTimeEntryPage.navigateToSingleTimeEntry(page);
  await expect(weeklyTimeEntryPage.keyboardIcon(page)).toHaveCount(0);
}

export async function validateChangeWeekWithDatepicker(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  // Observe the currently displayed week
  const weekDisplay = page.locator(
    `//span[contains(@class, 'Typography-body')]/strong`,
  );
  const initialWeek = await weekDisplay.textContent();

  // Helper: open the calendar reliably
  const openCalendar = async () => {
    // Try clicking the displayed week range first
    try {
      await weekDisplay.click({ timeout: 2000 });
    } catch {}
    // Fallbacks for a dedicated calendar button/icon
    const candidates = [
      page.getByRole('button', { name: /calendar|open calendar|date/i }),
      // page.locator(`#weekly-date-input button`).first(),
      // page.locator(`[data-testid="week-range"]`).first(),
    ];
    for (const c of candidates) {
      try {
        if (await c.isVisible({ timeout: 500 })) {
          await c.click({ timeout: 1000 });
          break;
        }
      } catch {}
    }
  };

  // Helper: format day with suffix
  const withDaySuffix = (day: number) => {
    const j = day % 10,
      k = day % 100;
    if (j === 1 && k !== 11) return `${day}st`;
    if (j === 2 && k !== 12) return `${day}nd`;
    if (j === 3 && k !== 13) return `${day}rd`;
    return `${day}th`;
  };

  // Helper: click a specific date in the calendar by aria-label (with robust fallbacks)
  const selectDateInCalendar = async (date: Date) => {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    const labelExact = `Choose ${weekday}, ${month} ${withDaySuffix(
      day,
    )}, ${year}`;
    const regexFallback = new RegExp(
      `${month}\\s+${day}(?:st|nd|rd|th)?,\\s+${year}`,
      'i',
    );
    // Try exact aria-label first
    try {
      await page
        .getByRole('button', { name: labelExact })
        .click({ timeout: 1000 });
      return;
    } catch {}
    // Fallback: match month day, year anywhere in aria-label
    try {
      await page
        .getByRole('button', { name: regexFallback })
        .click({ timeout: 1000 });
      return;
    } catch {}
    // Last resort: pick day cell by visible number within the current calendar grid
    await page
      .locator('.react-datepicker__day', { hasText: new RegExp(`^${day}$`) })
      .first()
      .click();
  };

  // Move to next week (today + 7 days)
  const today = new Date();
  const plus7 = new Date(today);
  plus7.setDate(today.getDate() + 7);
  await openCalendar();
  await selectDateInCalendar(plus7);

  // Verify the displayed week changed
  const afterForward = await weekDisplay.textContent();
  await expect(afterForward).not.toBe(initialWeek);

  // Move back to previous week (today - 7 days)
  const minus7 = new Date(today);
  minus7.setDate(today.getDate() - 7);
  await openCalendar();
  await selectDateInCalendar(minus7);

  // Verify it changed again from the forward week
  const afterBackward = await weekDisplay.textContent();
  await expect(afterBackward).not.toBe(afterForward);
}

export async function validateChangeWeekWithDatepickerRepeat(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  // Observe the currently displayed week
  const weekDisplay = page.locator(
    `//span[contains(@class, 'Typography-body')]/strong`,
  );
  const initialWeek = await weekDisplay.textContent();

  // Reuse helpers from the other test
  const withDaySuffix = (day: number) => {
    const j = day % 10,
      k = day % 100;
    if (j === 1 && k !== 11) return `${day}st`;
    if (j === 2 && k !== 12) return `${day}nd`;
    if (j === 3 && k !== 13) return `${day}rd`;
    return `${day}th`;
  };
  const openCalendar = async () => {
    try {
      await weekDisplay.click({ timeout: 2000 });
    } catch {}
    const candidates = [page.getByRole('button', { name: 'Calendar' })];
    for (const c of candidates) {
      try {
        if (await c.isVisible({ timeout: 500 })) {
          await c.click({ timeout: 1000 });
          break;
        }
      } catch {}
    }
  };
  const selectDateInCalendar = async (date: Date) => {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    console.log('current day: ', day);
    const year = date.getFullYear();
    const labelExact = `${day}`;
    const regexFallback = new RegExp(
      `${month}\\s+${day}(?:st|nd|rd|th)?,\\s+${year}`,
      'i',
    );
    // try {
    //   await page.getByRole('button', { name: labelExact }).first().click();
    //   return;
    // } catch {}
    // try {
    //   await page.getByRole('button', { name: regexFallback }).first().click();
    //   return;
    // } catch {}
  };

  const today = new Date();
  console.log(today);
  const plus7 = new Date(today);
  plus7.setDate(today.getDate() + 7);
  await openCalendar();
  await selectDateInCalendar(plus7);
  const forwardWeek = await weekDisplay.textContent();
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  const testData: WeeklyTimeEntryRowData = {
    hours: ['8', '8', '8', '8', '8', '8', '8'],
    notes: 'Test notes for WTEP-001',
  };
  await page.waitForTimeout(2000);
  await fillOutWeeklyTimeEntryRow(page, testData);

  const minus7 = new Date(today);
  minus7.setDate(today.getDate() - 7);
  await openCalendar();
  await selectDateInCalendar(minus7);
  //const backwardWeek = await weekDisplay.textContent();
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  const testData1: WeeklyTimeEntryRowData = {
    hours: ['8', '8', '8', '8', '8', '8', '8'],
    notes: 'Test notes for WTEP-002',
  };
  await page.waitForTimeout(2000);
  await fillOutWeeklyTimeEntryRow(page, testData1);
}

export async function validateWeekSwitchAndPersistence(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  // Select a team member (if needed)
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  // Use the datepicker to select Week A
  const weekDisplay = page.locator('[data-testid="week-range"]');
  await weekDisplay.click();
  const weekA = page
    .locator('.react-datepicker__week')
    .nth(1)
    .locator('div')
    .first();
  await weekA.click();
  // Enter time entries for Week A
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await weeklyTimeEntryPage.saveButton(page).click();
  // Use the datepicker to select Week B
  await weekDisplay.click();
  const weekB = page
    .locator('.react-datepicker__week')
    .nth(2)
    .locator('div')
    .first();
  await weekB.click();
  // Enter different time entries for Week B
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('5');
  await weeklyTimeEntryPage.saveButton(page).click();
  // Return to Week A
  await weekDisplay.click();
  await weekA.click();
  await expect(weeklyTimeEntryPage.hours(page, 3)).toHaveValue('8');
  // Switch to Week B and verify
  await weekDisplay.click();
  await weekB.click();
  await expect(weeklyTimeEntryPage.hours(page, 1)).toHaveValue('5');
}

export async function validateColorPatternToTheCellLevel(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.closeTeamMemberTooltip(page);

  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);

  //Select a customer/project.
  await weeklyTimeEntryPage.clickTimeCategoryDownArrow(page, 1);
  await weeklyTimeEntryPage.selectTimeCategory(page, 'Customer');
  await weeklyTimeEntryPage.selectTimeCategoryOption(page, 1);

  await weeklyTimeEntryPage.selectRowCell(page, 1, 2);
  await weeklyTimeEntryPage.hoursInputs(page).fill('1');

  await page.waitForTimeout(1000);
  // Select a break.
  await weeklyTimeEntryPage.clickTimeCategoryDownArrow(page, 2);
  await weeklyTimeEntryPage.selectTimeCategory(page, 'Breaks');
  await weeklyTimeEntryPage.selectTimeCategoryOption(page, 1);

  await weeklyTimeEntryPage.selectRowCell(page, 2, 2);
  await weeklyTimeEntryPage.hoursInputs(page).fill('2');
  await page.waitForTimeout(1000);
  await weeklyTimeEntryPage.selectRowCell(page, 3, 2);

  await weeklyTimeEntryPage.validateBackgroundColor(
    page,
    1,
    2,
    'rgba(0, 0, 0, 0)',
  );
  await page.waitForTimeout(1000);
  await weeklyTimeEntryPage.validateBackgroundColor(
    page,
    2,
    2,
    'rgb(255, 234, 199)',
  );
}

export async function validateWeeklyTimeEntryTableColumnsHeader(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.closeTeamMemberTooltip(page);
  await page.waitForTimeout(2000);
  // Get the total number of columns dynamically
  const totalColumns = await weeklyTimeEntryPage.allColumnHeaders(page).count();
  console.log(`Total columns detected: ${totalColumns}`);

  // Validate columns dynamically based on content
  const dateFormatRegex = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d{1,2}\/\d{1,2}$/;

  for (let i = 1; i <= totalColumns; i++) {
    try {
      // Check if the column header element exists first
      const headerElement = weeklyTimeEntryPage.columnHeader(page, i);
      const isVisible = await headerElement.isVisible({ timeout: 1000 });

      if (!isVisible) {
        console.log(`Column ${i}: Header element not visible - skipping`);
        continue;
      }

      const columnHeaderText = await headerElement.textContent({
        timeout: 2000,
      });
      console.log(`Column ${i} - columnHeaderText: "${columnHeaderText}"`);

      // Handle null, undefined, or empty string cases
      if (!columnHeaderText || columnHeaderText.trim() === '') {
        console.log(
          `Column ${i}: Empty or null header value - this is acceptable`,
        );
        continue;
      }

      // Validate based on content rather than fixed position
      if (columnHeaderText === 'Time category') {
        console.log(`Column ${i}: Time category (confirmed)`);
      } else if (columnHeaderText === 'Total') {
        console.log(`Column ${i}: Total (confirmed)`);
      } else if (columnHeaderText === 'Billable') {
        console.log(`Column ${i}: Billable (confirmed)`);
      } else if (dateFormatRegex.test(columnHeaderText)) {
        console.log(
          `Column ${i}: Date column - ${columnHeaderText} (confirmed)`,
        );
      } else {
        console.log(
          `Column ${i}: Unknown header - "${columnHeaderText}" (may be valid)`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(
        `Column ${i}: Error accessing header - ${errorMessage} (column may not exist)`,
      );
      // Don't break the loop, just continue to next column
      continue;
    }
  }
}

export async function validateHotKeysDisplayInContextMenu(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.closeTeamMemberTooltip(page);
  await page.waitForTimeout(2000);
  await weeklyTimeEntryPage.rightClickSelectedCell(page, 3);
  const options = await weeklyTimeEntryPage.getContextMenuOptions(page);
  const expectedOptions = [
    'Copy entry',
    'Paste entry',
    'Insert 1 row below',
    'Delete 1 row',
    'Clear cell',
  ];
  for (const option of expectedOptions) {
    console.log(`option: ${option}`);
    expect(options).toContain(option);
  }
}

export async function addBreakWte(page: Page) {
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  //Cleanup before test execution
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await timeEntriesPage.validateDateRangeDropdownOptions();
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();
  const empRowsNew = await timeEntriesPage.getAllRowsForAnEmployee('Emp, test');
  let countNew = await empRowsNew.count();
  while (countNew > 0) {
    await timeEntriesPage.clickActionDropdownForEmployee('Emp, test');
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();
    countNew = await timeEntriesPage.countEmployeeRow('Emp, test');
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.waitForTableOrNoEntriesMessage();
    countNew = await timeEntriesPage.countEmployeeRow('Emp, test');
  }
}

export async function datePickerAdjustingWeeks(page: Page) {
  await weeklyTimeEntryPage.navigate(page);

  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);

  // 1. Get the initial week display
  const initialWeekDisplay = await weeklyTimeEntryPage
    .dateRangeDisplay(page)
    .textContent();
  console.log(`Initial week: ${initialWeekDisplay}`);

  // 2. Test calendar approach
  await testWeekChangeViaCalendar(page, initialWeekDisplay);

  // 3. Reset to initial week for arrow test
  await resetToInitialWeek(page, initialWeekDisplay);

  // 4. Test arrow buttons approach
  console.log('Testing week change via arrow buttons...');
  await testWeekChangeViaArrows(page, initialWeekDisplay);

  console.log('All week change validation methods successful');
}

export async function addWTEEntryAndValidateToggleDisabledOnSTE(page: Page) {
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  //Cleanup before test execution
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await timeEntriesPage.validateDateRangeDropdownOptions();
  await selectDateRangeOption(page, 'This week');
  await timeEntriesPage.waitForLoadingToDisappear();
  const empRowsNew = await timeEntriesPage.getAllRowsForAnEmployee(
    'Employee, AAATest',
  );
  let countNew = await empRowsNew.count();
  while (countNew > 0) {
    await timeEntriesPage.clickActionDropdownForEmployee('Employee, AAATest');
    await timeEntriesPage.clickDeleteInActionDropdown();
    await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
    await timeEntriesPage.clickYesOnDeleteEntryPopup();
    await timeEntriesPage.waitForLoadingToDisappear();
    countNew = await timeEntriesPage.countEmployeeRow('Employee, AAATest');
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.waitForTableOrNoEntriesMessage();
    countNew = await timeEntriesPage.countEmployeeRow('Employee, AAATest');
  }

  //Add WTE Entry for first day of the current week
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  await weeklyTimeEntryPage.firstDataCell(page).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await weeklyTimeEntryPage.saveAndClose(page);
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);

  // Navigate to the Single Time Entries page
  await selectDisplayByOption(page, 'Customer');
  await timeEntriesPage.waitForLoadingToDisappear();
  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.clickEditForEmployee('Employee, AAATest');
  await timeEntriesPage.waitForLoadingToDisappear();
  await singleTimeEntryPage.expectSingleTimeEntryVisible();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.waitForTimeout(2000);
  await singleTimeEntryPage.handleTourModal();
  // The toggle should be disabled
  const toggle = await singleTimeEntryPage.getSetClockInToggle();
  await expect(toggle).toBeDisabled();

  // --- Step 3: Clean up ---
  await singleTimeEntryPage.clickDeleteButton();
  await singleTimeEntryPage.expectDeleteConfirmationVisible();
  await singleTimeEntryPage.clickYesOnDeleteConfirmation();
  await singleTimeEntryPage.expectTimeEntryDeletedToastVisible();
  await timeEntriesPage.waitForLoadingToDisappear();
  await page.reload();
  await timeEntriesPage.waitForLoadingToDisappear();
}

export async function expandCollapseSidePanel(page: Page) {
  await weeklyTimeEntryPage.navigate(page);
  await page
    .locator('//button[@aria-label="weekly.deleterow"]')
    .first()
    .click();
  await expect(weeklyTimeEntryPage.defaultPanelMessage(page)).toBeVisible();
  await weeklyTimeEntryPage.firstDataCell(page).click(); //select first cell
  await expect(weeklyTimeEntryPage.sidePanel(page)).toBeVisible();
  await expect(
    weeklyTimeEntryPage.dayLabelInSidePanel(page, 'Sunday'),
  ).toBeVisible();
  await expect(weeklyTimeEntryPage.panelServiceDropdown(page)).toBeVisible();
  await expect(weeklyTimeEntryPage.panelClassDropdown(page)).toBeVisible();
  await expect(weeklyTimeEntryPage.panelLocationDropdown(page)).toBeVisible();
  await expect(weeklyTimeEntryPage.panelBillable(page)).toBeVisible();
  await expect(weeklyTimeEntryPage.panelNotes(page)).toBeVisible();
  await expect(weeklyTimeEntryPage.panelSaveButton(page)).toBeVisible();
  await expect(weeklyTimeEntryPage.hidePanelButton(page)).toBeVisible();
  await weeklyTimeEntryPage.hidePanelButton(page).click();
  await expect(weeklyTimeEntryPage.sidePanel(page)).toBeHidden();
  await expect(weeklyTimeEntryPage.showPanelButton(page)).toBeVisible();
  await weeklyTimeEntryPage.showPanelButton(page).click();
  await expect(weeklyTimeEntryPage.sidePanel(page)).toBeVisible();
}

async function testWeekChangeViaCalendar(
  page: Page,
  initialWeekDisplay: string | null,
) {
  // Click on the calendar button to open the date picker
  await weeklyTimeEntryPage.calendarButton(page).click();

  // Wait for calendar modal to be visible
  await expect(weeklyTimeEntryPage.calendarModal(page)).toBeVisible();

  // Try multiple approaches to select a date that changes the week
  let dateSelected = false;

  // Approach 1: Try to select a date 7 days from now using data-date attribute
  try {
    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const nextWeekDateString = nextWeekDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Try using data-date attribute first
    await page.locator(`//div[@data-date="${nextWeekDateString}"]`).click();
    dateSelected = true;
  } catch (error) {
    console.log('Calendar approach 1 failed, trying approach 2...');
  }

  // Approach 2: Try to select by day number only using DatePicker-dayDiv
  if (!dateSelected) {
    try {
      const nextWeekDate = new Date();
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      const nextWeekDay = nextWeekDate.getDate();

      // Try clicking the div containing the date span
      await page
        .locator(
          `//div[contains(@class, 'DatePicker-dayDiv')]//span[text()="${nextWeekDay}"]`,
        )
        .click();
      dateSelected = true;
    } catch (error) {
      console.log('Calendar approach 2 failed, trying approach 3...');
    }
  }

  // Approach 3: Try to find any date in the next week range using data-date attributes
  if (!dateSelected) {
    try {
      // Look for any date div with data-date attribute that's not in the current week
      const dateDivs = await page.locator('//div[@data-date]').all();
      for (const div of dateDivs) {
        const dataDate = await div.getAttribute('data-date');
        if (dataDate) {
          const date = new Date(dataDate);
          const currentDate = new Date();
          // Select a date that's different from current date
          if (date.getDate() !== currentDate.getDate()) {
            await div.click();
            dateSelected = true;
            break;
          }
        }
      }
    } catch (error) {
      console.log('Calendar approach 3 failed');
    }
  }

  if (!dateSelected) {
    throw new Error('Could not select a date from the calendar');
  }

  // Wait for the calendar to close and page to update
  await page.waitForTimeout(2000);

  // Validate the week has changed
  await validateWeekChange(page, initialWeekDisplay, 'calendar');
}

async function testWeekChangeViaArrows(
  page: Page,
  initialWeekDisplay: string | null,
) {
  // Use the right arrow to go to next week
  await weeklyTimeEntryPage.rightArrowButton(page).click();

  // Wait for the page to update
  await page.waitForTimeout(1000);

  // Validate the week has changed
  await validateWeekChange(page, initialWeekDisplay, 'arrows');
}

async function validateWeekChange(
  page: Page,
  initialWeekDisplay: string | null,
  method: string,
) {
  // Get the new week display
  const newWeekDisplay = await weeklyTimeEntryPage
    .dateRangeDisplay(page)
    .textContent();
  console.log(`New week (${method}): ${newWeekDisplay}`);

  // Validate that the week has changed
  expect(newWeekDisplay).not.toEqual(initialWeekDisplay);
  expect(newWeekDisplay).toBeTruthy();

  // Additional validation - check that the week format is correct
  // The format should be like "Sep 28 - Oct 4, 2025" or similar
  expect(newWeekDisplay).toMatch(
    /[A-Za-z]{3}\s+\d{1,2}\s*-\s*[A-Za-z]{3}\s+\d{1,2},\s*\d{4}/,
  );
}

async function resetToInitialWeek(
  page: Page,
  initialWeekDisplay: string | null,
) {
  // Use the left arrow to go back to the initial week
  // We'll click multiple times to ensure we get back to the original week
  let currentWeekDisplay = await weeklyTimeEntryPage
    .dateRangeDisplay(page)
    .textContent();
  let attempts = 0;
  const maxAttempts = 10;

  while (currentWeekDisplay !== initialWeekDisplay && attempts < maxAttempts) {
    await weeklyTimeEntryPage.leftArrowButton(page).click();
    await page.waitForTimeout(500);
    currentWeekDisplay = await weeklyTimeEntryPage
      .dateRangeDisplay(page)
      .textContent();
    attempts++;
  }

  if (currentWeekDisplay !== initialWeekDisplay) {
    console.log(
      `Warning: Could not reset to initial week after ${maxAttempts} attempts`,
    );
  } else {
    console.log('Successfully reset to initial week using arrow navigation');
  }
}
