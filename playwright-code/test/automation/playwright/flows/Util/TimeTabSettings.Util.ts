import { Page, expect as baseExpect, test } from '@playwright/test';

import * as TimeSettingsPage from '../../pages/TimeSettingsPage';
import * as TimeTabSettingsPage from '../../pages/TimeTabSettingsPage';
import * as CustomFieldsPage from '../../pages/CustomFieldSettingsPage';
import * as MileagePage from '../../pages/MileagePage';
import GeofencingPage from '../../pages/GeofencingPage';
import { OvertimePolicyPage } from '../../pages/OvertimePolicyPage';
import {
  AccountMatrix,
  ResolvedMatrixAccount,
  resolveMatrixAccounts,
} from './FastPipeline/accountMatrix';

// Fail fast: cap retrying-assertion timeout (vs the 3-min global default).
const expect = baseExpect.configure({ timeout: 20000 });

// ============================================================================
// Account matrix (mirrors the Assignments track)
// ============================================================================

// Maps the CI TEST_ACCOUNT parameter to the account-key pool it may run against.
export const TIMETAB_ACCOUNT_MATRIX: AccountMatrix = {
  IES: ['FPTIES01'],
  PR_ELITE: ['FPTSE01'],
  PR_PREMIUM: ['FPTSP01'],
  FREE_DATA_ADV: ['FPTFAD01'],
  FREE_DATA_ESSENTIAL: ['FPTFE01'],
  FREE_DATA_PLUS: ['FPTFP01'],
  FREE_DATA_SS: ['TODO_FREE_ACCOUNT_KEY'],
};

// Resolves TEST_ACCOUNT to the ordered account list (exact key or group); throws if unset.
export function buildTimeTabAccountsFromMatrix(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): ResolvedMatrixAccount[] {
  return resolveMatrixAccounts({
    matrix: TIMETAB_ACCOUNT_MATRIX,
    param: selector,
    label: 'TTAB',
  });
}

// Free-data SKUs (FP Free: Advanced / Essentials / Plus / SS) use account keys
// prefixed `FPTF` (e.g. FPTFAD01, FPTFE01, FPTFP01). These companies render a
// REDUCED Time tab — only the General + Timesheet cards — so the spec routes them
// to validateFreeDataTimeTabSettings instead of the full validateAllTimeTabSettings
// (mirrors the Assignments suite, which branches free-data to its own path).
export const isFreeDataTimeTabAccount = (testId: string): boolean =>
  /^FPTF/i.test(testId.trim());

// Cards that a full (PR_ELITE) Time tab renders but a FREE_DATA tab must NOT —
// asserted absent below. Some are matched by card test-id, the rest by heading.
const FREE_DATA_FORBIDDEN_CARD_TESTIDS = [
  TimeTabSettingsPage.TIME_TAB_CARD.timeTracking,
  TimeTabSettingsPage.TIME_TAB_CARD.timesheetFields,
  TimeTabSettingsPage.TIME_TAB_CARD.customFields,
  TimeTabSettingsPage.TIME_TAB_CARD.geolocation,
  TimeTabSettingsPage.TIME_TAB_CARD.breaks,
  'notifications-settings', // Notifications card
  'schedules-settings-handle', // Schedule preferences card
] as const;

const FREE_DATA_FORBIDDEN_CARD_HEADINGS = [
  'Time tracking',
  'Timesheet fields',
  'Custom fields',
  'Geolocation',
  'Breaks',
  'Notifications',
  'Approvals',
  'Overtime',
  'Schedules',
  'Time off',
  'Kiosk',
] as const;

// Free-data flow: validates ONLY the reduced layout these SKUs render — the
// General card (First day of work week) and the Timesheet card (Show service
// field + Allow time to be billable), each verified in view mode with its edit
// screen opened + cancelled (no mutation) — and asserts every OTHER card that a
// full PR_ELITE Time tab would show is NOT visible.
export const validateFreeDataTimeTabSettings = async (page: Page) => {
  await test.step('Land on Time tab (free-data layout)', async () => {
    console.log(
      '▶ [Time tab — free-data] landing on Account & Settings → Time',
    );
    await TimeTabSettingsPage.verifyFreeDataTimeTabLoaded(page);
    console.log('  ✓ Free-data Time tab loaded (General + Timesheet cards)');
  });

  await test.step('General - content & edit screen', async () => {
    console.log('▶ [Free-data] verifying General card');
    await TimeTabSettingsPage.verifyFreeDataGeneralCard(page);
    console.log(
      '  ✓ General: First day of work week + value + edit screen verified',
    );
  });

  await test.step('Timesheet - content & edit screen', async () => {
    console.log('▶ [Free-data] verifying Timesheet card');
    await TimeTabSettingsPage.verifyFreeDataTimesheetCard(page);
    console.log(
      '  ✓ Timesheet: service + billable fields, values & edit screen verified',
    );
  });

  await test.step('All other (PR_ELITE) cards are NOT visible', async () => {
    console.log('▶ [Free-data] verifying elite-only cards are hidden');
    for (const testId of FREE_DATA_FORBIDDEN_CARD_TESTIDS) {
      await expect(
        page.getByTestId(testId),
        `card "${testId}" must NOT be visible for a free-data account`,
      ).toBeHidden();
    }
    for (const heading of FREE_DATA_FORBIDDEN_CARD_HEADINGS) {
      await expect(
        page.getByRole('heading', { name: heading }),
        `"${heading}" card must NOT be visible for a free-data account`,
      ).toBeHidden();
    }
    console.log('  ✓ Only General + Timesheet shown (all elite cards hidden)');
  });
};

// Main flow: walks every Time tab card on one account, each card its own test.step.
export const validateAllTimeTabSettings = async (page: Page) => {
  await test.step('Land on Time tab', async () => {
    console.log('▶ [Time tab] landing on Account & Settings → Time');
    await TimeTabSettingsPage.verifyTimeTabLoaded(page);
    console.log('  ✓ Time tab loaded');
  });

  await test.step('Time tracking - edit, save & verify retained', async () => {
    await editAndVerifyTimeTracking(page);
  });

  await test.step('Timesheet fields - edit, save & verify retained', async () => {
    await editAndVerifyTimesheetFields(page);
  });

  await test.step('Geolocation - edit, save & verify retained', async () => {
    await editAndVerifyGeolocation(page);
  });

  await test.step('Custom fields - card present & edit screen opens', async () => {
    await verifyCustomFieldsCard(page);
  });

  await test.step('Breaks - header & UI elements', async () => {
    await verifyBreaksCard(page);
  });

  await test.step('Approvals - content & edit elements', async () => {
    await verifyApprovalsCard(page);
  });

  await test.step('Notifications - content & edit elements', async () => {
    await verifyNotificationsCard(page);
  });

  await test.step('Overtime - card content', async () => {
    await verifyOvertimeCard(page);
  });

  await test.step('Schedules - card present (gated)', async () => {
    await verifySchedulesCard(page);
  });

  await test.step('Time off - card content', async () => {
    await verifyTimeOffCard(page);
  });

  await test.step('Kiosk - card content', async () => {
    await verifyKioskCard(page);
  });
};

// ==========================================
// Edit -> save -> reload -> verify retained
// ==========================================

// Snapshot of the editable Time tracking fields — used to verify and to restore.
// `checkboxes` only holds the checkboxes actually present on this account.
interface TimeTrackingState {
  firstDay: string;
  timeZone: string;
  roundInDir: string;
  roundInInc: string;
  roundOutDir: string;
  roundOutInc: string;
  checkboxes: Record<string, boolean>;
  clockOutHours: string | null;
}

const DD = TimeTabSettingsPage.TIME_TRACKING_DROPDOWN;
const CB = TimeTabSettingsPage.TIME_TRACKING_CHECKBOX;
// Checkboxes we read/flip/verify. Mobile-app is excluded: it is a nested child of
// "Allow team members to create and edit..." so its state depends on that toggle —
// we only verify its presence (in verifyTimeTrackingEditElements), not its value.
const TRACKED_CHECKBOXES = [
  CB.splitMidnight,
  CB.allowCreateEdit,
  CB.captureSignatures,
  CB.editClockOut,
];
const FLIP_CHECKBOXES = [
  CB.splitMidnight,
  CB.allowCreateEdit,
  CB.captureSignatures,
];
const clockOutHoursInput = (page: Page) =>
  page.locator(`//input[@type='number']`);

// Reads the current Time tracking edit-form values into a snapshot.
const readTimeTrackingState = async (
  page: Page,
): Promise<TimeTrackingState> => {
  const checkboxes: Record<string, boolean> = {};
  for (const label of TRACKED_CHECKBOXES) {
    if (await TimeTabSettingsPage.timeTrackingCheckboxExists(page, label)) {
      checkboxes[label] = await TimeTabSettingsPage.getTimeTrackingCheckbox(
        page,
        label,
      );
    }
  }
  const hasHours = (await clockOutHoursInput(page).count()) > 0;
  return {
    firstDay: await TimeTabSettingsPage.readTimeTrackingDropdown(
      page,
      DD.firstDay,
    ),
    timeZone: await TimeTabSettingsPage.readTimeTrackingDropdown(
      page,
      DD.timeZone,
    ),
    roundInDir: await TimeTabSettingsPage.readTimeTrackingDropdown(
      page,
      DD.roundClockInDir,
    ),
    roundInInc: await TimeTabSettingsPage.readTimeTrackingDropdown(
      page,
      DD.roundClockInInc,
    ),
    roundOutDir: await TimeTabSettingsPage.readTimeTrackingDropdown(
      page,
      DD.roundClockOutDir,
    ),
    roundOutInc: await TimeTabSettingsPage.readTimeTrackingDropdown(
      page,
      DD.roundClockOutInc,
    ),
    checkboxes,
    clockOutHours: hasHours
      ? await clockOutHoursInput(page).inputValue()
      : null,
  };
};

// Restores the Time tracking form to a snapshot and saves (used for cleanup).
// Navigates fresh first so it works even if a prior step failed mid-edit.
const restoreTimeTrackingState = async (page: Page, s: TimeTrackingState) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickTimeTrackingEditButton(page);
  await TimeTabSettingsPage.selectTimeTrackingDropdownByText(
    page,
    DD.firstDay,
    s.firstDay,
  );
  await TimeTabSettingsPage.selectTimeTrackingDropdownByText(
    page,
    DD.timeZone,
    s.timeZone,
  );
  await TimeTabSettingsPage.selectTimeTrackingDropdownByText(
    page,
    DD.roundClockInDir,
    s.roundInDir,
  );
  await TimeTabSettingsPage.selectTimeTrackingDropdownByText(
    page,
    DD.roundClockInInc,
    s.roundInInc,
  );
  await TimeTabSettingsPage.selectTimeTrackingDropdownByText(
    page,
    DD.roundClockOutDir,
    s.roundOutDir,
  );
  await TimeTabSettingsPage.selectTimeTrackingDropdownByText(
    page,
    DD.roundClockOutInc,
    s.roundOutInc,
  );
  for (const [label, value] of Object.entries(s.checkboxes)) {
    await TimeTabSettingsPage.setTimeTrackingCheckbox(page, label, value);
  }
  if (s.clockOutHours != null && s.checkboxes[CB.editClockOut]) {
    await TimeSettingsPage.enterClkOutTimeHours(page, s.clockOutHours);
  }
  await TimeSettingsPage.clickOnTimeTrackingSaveButton(page);
};

// Time tracking: verify elements + Cancel/Save, edit every option, verify all
// retained after refresh, then restore the original state (cleanup ALWAYS runs).
export const editAndVerifyTimeTracking = async (page: Page) => {
  console.log('▶ [Time tracking] starting card validation');
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeTabSettingsPage.verifyTimeTrackingCardPresent(page);
  // View-mode card content.
  await expect(page.getByText('Timesheet management').first()).toBeVisible();
  await expect(page.getByText('First day of work week').first()).toBeVisible();
  console.log('  ✓ Time tracking card present on Time tab');
  await TimeTabSettingsPage.scrollIntoView(
    page.getByTestId('timetracking-settings-view'),
  );
  await TimeSettingsPage.clickTimeTrackingEditButton(page);

  await test.step('Time tracking: edit-screen header & all elements', async () => {
    console.log(
      '▶ [Time tracking] verifying edit-screen header & all elements',
    );
    await TimeTabSettingsPage.verifyTimeTrackingEditElements(page);
    await TimeTabSettingsPage.verifyMobileAppCheckboxState(page);
    console.log(
      '  ✓ Header, field lines, rounding block, Save/Cancel verified',
    );
  });

  await test.step('Time tracking: Cancel closes edit, back to view mode', async () => {
    console.log('▶ [Time tracking] verifying Cancel returns card to view mode');
    // Toggle an always-present checkbox, Cancel, confirm the card returns to view.
    await TimeTabSettingsPage.setTimeTrackingCheckbox(
      page,
      CB.splitMidnight,
      !(await TimeTabSettingsPage.getTimeTrackingCheckbox(
        page,
        CB.splitMidnight,
      )),
    );
    await TimeSettingsPage.clickOnTimeTrackingCancelButton(page);
    await TimeTabSettingsPage.verifyTimeTrackingViewMode(page);
    console.log('  ✓ Cancel discarded change and card is back in view mode');
    await TimeSettingsPage.clickTimeTrackingEditButton(page);
  });

  // Snapshot the original state for retention comparison + cleanup.
  const original = await readTimeTrackingState(page);
  console.log(
    '  ✓ Captured original Time tracking state for verification & cleanup',
  );

  const expected: TimeTrackingState = {
    ...original,
    checkboxes: { ...original.checkboxes },
  };
  try {
    await test.step('Time tracking: edit every option & save', async () => {
      console.log(
        '▶ [Time tracking] editing every option (dropdowns, checkboxes, hours)',
      );
      expected.firstDay = await TimeTabSettingsPage.changeTimeTrackingDropdown(
        page,
        DD.firstDay,
      );
      expected.timeZone = await TimeTabSettingsPage.changeTimeTrackingDropdown(
        page,
        DD.timeZone,
      );
      expected.roundInDir =
        await TimeTabSettingsPage.changeTimeTrackingDropdown(
          page,
          DD.roundClockInDir,
        );
      expected.roundInInc =
        await TimeTabSettingsPage.changeTimeTrackingDropdown(
          page,
          DD.roundClockInInc,
        );
      expected.roundOutDir =
        await TimeTabSettingsPage.changeTimeTrackingDropdown(
          page,
          DD.roundClockOutDir,
        );
      expected.roundOutInc =
        await TimeTabSettingsPage.changeTimeTrackingDropdown(
          page,
          DD.roundClockOutInc,
        );
      console.log(
        `  • firstDay=${expected.firstDay}, timeZone=${expected.timeZone}, ` +
          `roundIn=${expected.roundInDir}/${expected.roundInInc}, ` +
          `roundOut=${expected.roundOutDir}/${expected.roundOutInc}`,
      );

      // Flip every editable checkbox that is present + enabled.
      for (const label of FLIP_CHECKBOXES) {
        if (
          await TimeTabSettingsPage.timeTrackingCheckboxEnabled(page, label)
        ) {
          const next = !(await TimeTabSettingsPage.getTimeTrackingCheckbox(
            page,
            label,
          ));
          await TimeTabSettingsPage.setTimeTrackingCheckbox(page, label, next);
          expected.checkboxes[label] = next;
          console.log(`  • ${label} -> ${next}`);
        }
      }

      // Keep clock-out editing ON so the hours field stays editable; change the hours.
      if (
        await TimeTabSettingsPage.timeTrackingCheckboxEnabled(
          page,
          CB.editClockOut,
        )
      ) {
        await TimeTabSettingsPage.setTimeTrackingCheckbox(
          page,
          CB.editClockOut,
          true,
        );
        expected.checkboxes[CB.editClockOut] = true;
      }
      if (expected.clockOutHours != null) {
        expected.clockOutHours = expected.clockOutHours === '10' ? '8' : '10';
        await TimeSettingsPage.enterClkOutTimeHours(
          page,
          expected.clockOutHours,
        );
        console.log(`  • clockOutHours=${expected.clockOutHours}`);
      }

      await TimeSettingsPage.clickOnTimeTrackingSaveButton(page);
      console.log('  ✓ Saved all Time tracking changes');
    });

    await test.step('Time tracking: refresh & verify all values retained', async () => {
      console.log(
        '▶ [Time tracking] refresh, then verifying every value retained',
      );
      await TimeTabSettingsPage.softRefreshTimeTab(page);
      await TimeSettingsPage.clickTimeTrackingEditButton(page);
      const saved = await readTimeTrackingState(page);
      expect(saved.firstDay).toBe(expected.firstDay);
      expect(saved.timeZone).toBe(expected.timeZone);
      expect(saved.roundInDir).toBe(expected.roundInDir);
      expect(saved.roundInInc).toBe(expected.roundInInc);
      expect(saved.roundOutDir).toBe(expected.roundOutDir);
      expect(saved.roundOutInc).toBe(expected.roundOutInc);
      for (const [label, value] of Object.entries(expected.checkboxes)) {
        expect(saved.checkboxes[label], `checkbox "${label}" retained`).toBe(
          value,
        );
      }
      if (expected.clockOutHours != null) {
        expect(saved.clockOutHours).toBe(expected.clockOutHours);
      }
      console.log(
        '  ✓ All edited Time tracking options retained after refresh',
      );
    });
  } finally {
    // Cleanup ALWAYS runs — even if an edit/verify step above failed.
    await test.step('Time tracking: cleanup — restore original state', async () => {
      console.log('▶ [Time tracking] cleanup — restoring original state');
      try {
        await restoreTimeTrackingState(page, original);
        console.log('  ✓ Time tracking restored to original state');
      } catch (err) {
        console.log(`  ⚠ Time tracking cleanup failed (continuing): ${err}`);
      }
    });
  }
  console.log('✔ [Time tracking] card validation complete');
};

// Tab-switch refresh, then re-opens the Timesheet fields edit trowser (waits for rows).
const reopenTimesheetEdit = async (page: Page) => {
  await TimeTabSettingsPage.softRefreshTimeTab(page);
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
  await TimeTabSettingsPage.waitForTimesheetEditOpen(page);
};

// Saves the Timesheet fields table only if there are unsaved changes.
const saveTimesheetIfDirty = async (page: Page) => {
  const save = page.getByRole('button', { name: 'Save' }).first();
  await page.waitForTimeout(500);
  if (await save.isEnabled().catch(() => false)) {
    await save.click();
    await page.waitForTimeout(2000);
  } else {
    console.log('(timesheet) nothing to save — already persisted');
  }
};

// Timesheet fields: full validation — columns/fields visibility, the
// View/Action enabled-vs-readonly behaviour, and enable + save + reload retention
// for every field, Required toggle and subfield. (Applies only to this card.)
export const editAndVerifyTimesheetFields = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeTabSettingsPage.verifyTimesheetFieldsCardPresent(page);
  // View-mode card content.
  await expect(
    page
      .getByText('Configure what your team tracks on their timesheets')
      .first(),
  ).toBeVisible();
  await TimeTabSettingsPage.scrollIntoView(
    page.getByTestId('timeSheet-settings'),
  );
  await TimeSettingsPage.clickTimeSheetFieldsEditButton(page);
  await TimeTabSettingsPage.waitForTimesheetEditOpen(page);

  const trowser = page.getByRole('dialog', { name: 'Timesheet settings' });

  await test.step('Timesheet: header, columns, fields & Cancel/Close', async () => {
    await TimeTabSettingsPage.verifyTimesheetEditHeader(page);
    // "Standard fields (N)" section-count line.
    await expect(
      trowser.getByText(/Standard fields \(\d+\)/).first(),
    ).toBeVisible();
    await TimeTabSettingsPage.verifyTimesheetColumnsVisible(page);
    await TimeTabSettingsPage.verifyTimesheetFieldsVisible(page);
    await TimeTabSettingsPage.verifyCancelCloseButtons(page, trowser);
  });

  await test.step('Timesheet: Preview timesheet toggles the preview panel', async () => {
    const previewBtn = page.getByText('Preview timesheet').first();
    const previewPanel = page.getByText('Timesheet preview').first();
    await TimeTabSettingsPage.scrollIntoView(previewBtn);
    const openBefore = await previewPanel.isVisible().catch(() => false);
    await previewBtn.click();
    await page.waitForTimeout(1000);
    // After one click the panel state flips relative to its starting state.
    if (openBefore) {
      await expect(previewPanel).toBeHidden();
    } else {
      await expect(previewPanel).toBeVisible();
    }
    await previewBtn.click();
    await page.waitForTimeout(1000);
    // After the second click it returns to its starting state.
    if (openBefore) {
      await expect(previewPanel).toBeVisible();
    } else {
      await expect(previewPanel).toBeHidden();
    }
    console.log('  ✓ Preview timesheet panel toggles open/closed');
  });

  await test.step('Timesheet: View/Action toggles with Show-on-timesheet', async () => {
    await verifyTimesheetActionDropdownBehaviour(page);
  });

  await test.step('Timesheet: enable all fields, save & verify retained', async () => {
    await enableAllTimesheetFieldsAndVerifyRetained(page);
  });

  await test.step('Timesheet: Rate per hour & edit-notes subfields disable & retain', async () => {
    await toggleSubfieldsAndVerifyRetained(page, false);
  });
};

// Toggles the Billable "Rate per hour" and Notes "edit existing notes" subfields to
// `on`, saves, reloads and verifies they retained. (Enable is covered by enable-all;
// this exercises the opposite direction.)
const toggleSubfieldsAndVerifyRetained = async (page: Page, on: boolean) => {
  const subs = ['billingRateForTimeEnabled', 'timeSheetEntryEditNotesEnabled'];
  for (const key of subs) {
    if (await TimeTabSettingsPage.timesheetSwitchExists(page, key)) {
      await TimeTabSettingsPage.setTimesheetSwitch(page, key, on);
    }
  }
  await saveTimesheetIfDirty(page);
  await reopenTimesheetEdit(page);
  for (const key of subs) {
    if (await TimeTabSettingsPage.timesheetSwitchExists(page, key)) {
      await TimeTabSettingsPage.verifyTimesheetSwitch(page, key, on);
    }
  }
  console.log(
    `  ✓ Rate per hour & edit-notes subfields retained ${on ? 'ON' : 'OFF'}`,
  );
};

// View/Action state follows the SAVED Show-on-timesheet value (not the live toggle),
// so each direction is toggled -> saved -> reopened -> verified. Applies to every
// actionable field (those with a View/Action combo — excludes Customers & Notes).
const verifyTimesheetActionDropdownBehaviour = async (page: Page) => {
  if (!(await TimeTabSettingsPage.timesheetColumnExists(page, 'Action'))) {
    console.log(
      '(timesheet) Action column not present; skipping View/Action check',
    );
    return;
  }
  const actionable = TimeTabSettingsPage.TIMESHEET_FIELDS.filter(
    (f) => f.hasAction,
  );

  // Show-on OFF for all -> save -> reopen -> View ENABLED for each.
  for (const f of actionable)
    await TimeTabSettingsPage.setTimesheetSwitch(page, f.key, false);
  await saveTimesheetIfDirty(page);
  await reopenTimesheetEdit(page);
  for (const f of actionable) {
    await TimeTabSettingsPage.verifyTimesheetActionState(page, f.key, false);
  }
  console.log(
    '  ✓ Show-on OFF (saved) -> View enabled for all actionable fields',
  );

  // Show-on ON for all -> save -> reopen -> View READONLY (disabled) for each.
  for (const f of actionable)
    await TimeTabSettingsPage.setTimesheetSwitch(page, f.key, true);
  await saveTimesheetIfDirty(page);
  await reopenTimesheetEdit(page);
  for (const f of actionable) {
    await TimeTabSettingsPage.verifyTimesheetActionState(page, f.key, true);
  }
  console.log(
    '  ✓ Show-on ON (saved) -> View readonly for all actionable fields',
  );
};

// All toggle keys for a field (Show-on, Required, subfields) — used to enable + verify.
const timesheetFieldKeys = (field: TimeTabSettingsPage.TimesheetField) => [
  field.key,
  ...(field.requiredKey ? [field.requiredKey] : []),
  ...field.subFields.map((s) => s.key),
];

// Enables every ENABLED toggle (disabled ones like Customers are left as-is),
// saves, reloads and asserts each enabled toggle is retained ON.
const enableAllTimesheetFieldsAndVerifyRetained = async (page: Page) => {
  // Enable parents first, then Required toggles + subfields (need parent ON).
  for (const field of TimeTabSettingsPage.TIMESHEET_FIELDS) {
    await TimeTabSettingsPage.setTimesheetSwitch(page, field.key, true);
  }
  for (const field of TimeTabSettingsPage.TIMESHEET_FIELDS) {
    for (const key of timesheetFieldKeys(field).slice(1)) {
      await TimeTabSettingsPage.setTimesheetSwitch(page, key, true);
    }
  }

  await saveTimesheetIfDirty(page);

  // Reload, re-open edit and confirm every ENABLED toggle persisted as ON.
  // Disabled toggles (e.g. Customers show/required) can't be changed, so skip them.
  await reopenTimesheetEdit(page);
  for (const field of TimeTabSettingsPage.TIMESHEET_FIELDS) {
    for (const key of timesheetFieldKeys(field)) {
      if (await TimeTabSettingsPage.timesheetSwitchEnabled(page, key)) {
        await TimeTabSettingsPage.verifyTimesheetSwitch(page, key, true);
      } else {
        console.log(
          `(timesheet) "${key}" not editable; skipping retention check`,
        );
      }
    }
  }
  console.log(
    '✓ All editable timesheet fields, Required toggles & subfields retained',
  );
};

// Mileage tracking toggle ('Turn on mileage tracking'); visible only when Required.
const mileageToggle = (page: Page) =>
  page.getByRole('checkbox', { name: /Turn on mileage tracking/i });

// Opens the Geolocation edit dialog. Closes any dialog left open first — when a
// save is skipped (option already set) the trowser stays open and would otherwise
// intercept the Edit click.
const openGeoEdit = async (page: Page) => {
  const dialog = page.getByRole('dialog', { name: 'Geolocation' });
  if (await dialog.isVisible().catch(() => false)) {
    await page
      .getByRole('button', { name: 'Close' })
      .last()
      .click()
      .catch(() => {});
    await page.waitForTimeout(1000);
  }
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
};

// Reopens the Geolocation edit dialog and asserts the mileage toggle state, then closes.
const verifyMileageRetained = async (page: Page, on: boolean) => {
  await openGeoEdit(page);
  await page.waitForTimeout(2000);
  await TimeTabSettingsPage.scrollIntoView(mileageToggle(page));
  await expect(mileageToggle(page)).toBeVisible({ timeout: 15000 });
  await expect(mileageToggle(page)).toBeChecked({ checked: on });
  await page
    .getByRole('button', { name: 'Close' })
    .last()
    .click()
    .catch(() => {});
  await page.waitForTimeout(1000);
};

// Verifies the "Keep location tracking as <label>?" geofence-performance banner that
// shows when Optional/Never is selected (Required shows no banner).
const verifyGeoBanner = async (page: Page, label: 'Optional' | 'Never') => {
  const banner = page.getByText(`Keep location tracking as "${label}"`).first();
  await TimeTabSettingsPage.scrollIntoView(banner);
  await expect(banner).toBeVisible();
  await expect(
    page
      .getByText('For better geofence performance, set location tracking to', {
        exact: false,
      })
      .first(),
  ).toBeVisible();
};

// Geolocation: cycle all 3 location options (Required→Optional→Never), toggle
// mileage and geofence on/off, each save verified. Cleanup ALWAYS sets Never.
export const editAndVerifyGeolocation = async (page: Page) => {
  console.log('▶ [Geolocation] starting card validation');
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeTabSettingsPage.verifyGeolocationCardPresent(page);
  console.log('  ✓ Geolocation card present on Time tab');
  const geo = new GeofencingPage(page);

  try {
    await test.step('Geolocation: edit dialog elements, Required → save → verify', async () => {
      console.log(
        '▶ [Geolocation] verifying edit dialog elements + Required option',
      );
      await openGeoEdit(page);
      await TimeTabSettingsPage.verifyGeolocationEditElements(page);
      await TimeSettingsPage.saveLocationTrackingOption(page, 'REQUIRED');
      await TimeSettingsPage.verifyLocationTrackingSetting(page, 'Required');
      console.log('  ✓ Location tracking = Required saved & verified');
    });

    await test.step('Geolocation: Optional → banner → save → verify', async () => {
      console.log('▶ [Geolocation] selecting Optional');
      await openGeoEdit(page);
      // Select the option, verify its banner in the same dialog, then save.
      await page.locator('input[type="radio"][value="OPTIONAL"]').click();
      await page.waitForTimeout(500);
      await verifyGeoBanner(page, 'Optional');
      await TimeSettingsPage.saveLocationTrackingOption(page, 'OPTIONAL');
      await TimeSettingsPage.verifyLocationTrackingSetting(page, 'Optional');
      console.log('  ✓ Optional banner verified + saved');
    });

    await test.step('Geolocation: Never → banner → save → verify', async () => {
      console.log('▶ [Geolocation] selecting Never');
      await openGeoEdit(page);
      await page.locator('input[type="radio"][value="OFF"]').click();
      await page.waitForTimeout(500);
      await verifyGeoBanner(page, 'Never');
      await TimeSettingsPage.saveLocationTrackingOption(page, 'OFF');
      await TimeSettingsPage.verifyLocationTrackingSetting(page, 'Never');
      console.log('  ✓ Never banner verified + saved');
    });

    await test.step('Geolocation: enable mileage → save → verify ON', async () => {
      console.log(
        '▶ [Geolocation] enabling mileage tracking (selects Required)',
      );
      await MileagePage.enableMileageTrackingInQBO(page);
      await verifyMileageRetained(page, true);
      console.log('  ✓ Mileage tracking enabled & verified ON');
    });

    await test.step('Geolocation: disable mileage → save → verify OFF', async () => {
      console.log('▶ [Geolocation] disabling mileage tracking');
      await MileagePage.disableMileageTrackingInQBO(page);
      await verifyMileageRetained(page, false);
      console.log('  ✓ Mileage tracking disabled & verified OFF');
    });

    await test.step('Geolocation: enable geofence → save → verify ON', async () => {
      console.log('▶ [Geolocation] enabling geofence');
      await geo.enableGeofenceInCompanySettings();
      // Poll: the card's On/Off value can lag a moment behind the save.
      await baseExpect
        .poll(() => geo.isGeofenceEnabled(), { timeout: 20000 })
        .toBe(true);
      console.log('  ✓ Geofence enabled & verified ON');
    });

    await test.step('Geolocation: disable geofence → save → verify OFF', async () => {
      console.log('▶ [Geolocation] disabling geofence');
      await geo.disableGeofenceInCompanySettings();
      // Poll: the card's On/Off value can lag a moment behind the save.
      await baseExpect
        .poll(() => geo.isGeofenceEnabled(), { timeout: 20000 })
        .toBe(false);
      console.log('  ✓ Geofence disabled & verified OFF');
    });
  } finally {
    // Cleanup ALWAYS runs — leave geolocation on Never (which disables mileage &
    // geofence) so the next run starts fresh from Required even if a step failed.
    await test.step('Geolocation: cleanup — set Never', async () => {
      console.log('▶ [Geolocation] cleanup — restoring Never');
      try {
        await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
        await openGeoEdit(page);
        await TimeSettingsPage.saveLocationTrackingOption(page, 'OFF');
        await TimeSettingsPage.verifyLocationTrackingSetting(page, 'Never');
        console.log('  ✓ Geolocation restored to Never');
      } catch (err) {
        console.log(`  ⚠ Geolocation cleanup failed (continuing): ${err}`);
      }
    });
  }
  console.log('✔ [Geolocation] card validation complete');
};

// ==========================================
// Card-present (+ open edit where noted)
// ==========================================

export const verifyCustomFieldsCard = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeTabSettingsPage.verifyCustomFieldsCardPresent(page);
  // View-mode card content.
  await expect(
    page.getByText('Create custom fields for time tracking').first(),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Manage all custom fields' }).first(),
  ).toBeVisible();
  // Open the edit screen and verify its header + page elements (scoped to the dialog).
  await TimeTabSettingsPage.scrollIntoView(
    page.getByTestId('custom-fields-settings'),
  );
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await TimeTabSettingsPage.verifyCustomFieldsEditElements(page);
  console.log(
    '✓ Custom fields card present, edit screen header & elements verified',
  );
};

const BREAK_COLUMNS = [
  'Break name',
  'Duration',
  'Type',
  'Auto/Manual',
  'Assigned to',
  'Status',
  'Actions',
];

export const verifyBreaksCard = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeTabSettingsPage.verifyBreaksCardPresent(page);
  // View-mode card content.
  await expect(
    page.getByText('Manage break rules for your team').first(),
  ).toBeVisible();
  console.log(
    '▶ [Breaks] opening manage breaks & verifying header + UI elements',
  );
  // Open the manage-breaks screen from the card (tab already loaded via auth session).
  const breaksEditBtn = page
    .locator(`//div[@class="breaks-widget"]//button`)
    .first();
  await TimeTabSettingsPage.scrollIntoView(breaksEditBtn);
  await breaksEditBtn.click();

  // Scope to the dialog so the column checks don't match other tables on the page.
  const dialog = page.getByRole('dialog', { name: 'Manage breaks' });
  await expect(dialog).toBeVisible({ timeout: 30000 });
  await expect(
    dialog.getByRole('heading', { name: "Manage your team's break rules" }),
  ).toBeVisible();
  await expect(dialog.getByText('Add break rule').first()).toBeVisible();
  for (const col of BREAK_COLUMNS) {
    await expect(
      dialog.getByRole('columnheader', { name: col, exact: true }),
    ).toBeVisible();
  }
  // Empty zero-state.
  await expect(dialog.getByText('No break rules yet')).toBeVisible();
  await expect(
    dialog.getByText('to get started', { exact: false }).first(),
  ).toBeVisible();
  await TimeTabSettingsPage.verifyCancelCloseButtons(page, dialog);
  console.log(
    '  ✓ Breaks: header, Add rule, columns, zero-state & Cancel/Close verified',
  );
};

// Cancels an inline-edit card form and returns it to view mode.
const cancelInlineEdit = async (page: Page) => {
  await page
    .getByRole('button', { name: 'Cancel' })
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(1000);
};

// Approvals: card content + open Edit, verify edit elements, Cancel.
export const verifyApprovalsCard = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeTabSettingsPage.verifyApprovalsCardPresent(page);
  console.log('▶ [Approvals] verifying card content + edit elements');
  await expect(
    page.getByText('Require approval for tracked time').first(),
  ).toBeVisible();
  await TimeTabSettingsPage.scrollIntoView(
    page.getByTestId('approvals-settings-view'),
  );
  await TimeSettingsPage.clickEditApprovalsSection(page);
  await expect(
    page.getByText('Require approval for tracked time').first(),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  await cancelInlineEdit(page);
  console.log('  ✓ Approvals card content + edit elements verified');
};

// Notifications: card content + open Edit, verify edit elements, Cancel.
export const verifyNotificationsCard = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeTabSettingsPage.verifyNotificationsCardPresent(page);
  console.log('▶ [Notifications] verifying card content + edit elements');
  await expect(page.getByText('Send clock-in reminders').first()).toBeVisible();
  await expect(page.getByText('Days reminders are sent').first()).toBeVisible();
  await TimeTabSettingsPage.scrollIntoView(
    page.getByTestId('notifications-settings-view'),
  );
  await TimeSettingsPage.clickNotifEditButton(page);
  await page.waitForTimeout(1500);
  // In edit mode the labels render as switches; confirm the edit form opened (Save).
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  await cancelInlineEdit(page);
  console.log('  ✓ Notifications card content + edit elements verified');
};

// Overtime: card content (the manage view is an external policy widget — covered by
// the Overtime suite; here we verify the card heading + summary text).
export const verifyOvertimeCard = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeTabSettingsPage.verifyOvertimeCardPresent(page);
  console.log('▶ [Overtime] verifying card content');
  // View-mode card content: OBBBA banner + guidance link + subtitle.
  await expect(
    page
      .getByText('the One, Big, Beautiful Bill Act', { exact: false })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /View guidance/i }).first(),
  ).toBeVisible();
  await expect(
    page.getByText('Manage overtime policies for your team').first(),
  ).toBeVisible();

  // Open the Overtime manage trowser and verify its landing + zero-state.
  console.log('▶ [Overtime] opening manage policies & verifying zero-state');
  const overtime = new OvertimePolicyPage(page);
  await overtime.clickOvertimeSectionEdit();
  await overtime.waitForOvertimeTrowserOpen();
  await overtime.ensureManageOvertimePoliciesCompanyScreen();
  await expect(
    page
      .getByText(
        'Create and manage overtime rates, pay rates and payroll calculations',
        { exact: false },
      )
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Learn more about overtime/i }).first(),
  ).toBeVisible();
  await expect(
    page
      .getByRole('link', { name: /Check out overtime laws by state/i })
      .first(),
  ).toBeVisible();
  // Zero-state.
  await expect(
    page.getByText('Set up your overtime policies').first(),
  ).toBeVisible();
  await expect(
    page
      .getByText('Create overtime policies and assign overtime rules', {
        exact: false,
      })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Set up overtime policies' }),
  ).toBeVisible();

  await overtime.closeOvertimeTrowser();
  console.log('  ✓ Overtime card content + manage zero-state & links verified');
};

export const verifySchedulesCard = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeTabSettingsPage.verifySchedulesCardPresent(page);
};

// Time off: card content (managing navigates to Workforce — verify the card texts).
export const verifyTimeOffCard = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeTabSettingsPage.verifyTimeOffCardPresent(page);
  console.log('▶ [Time off] verifying card content + edit checkboxes');
  // View-mode content.
  await expect(page.getByText('Request time off').first()).toBeVisible();
  await expect(
    page.getByText('Employees can request time off in Workforce').first(),
  ).toBeVisible();
  await expect(
    page.getByText('Managers can approve time off in Workforce').first(),
  ).toBeVisible();

  const section = page.locator('#timeoff-settings');
  const empCb = page.getByRole('checkbox', {
    name: /Employees can request time off in Workforce/i,
  });
  const mgrCb = page.getByRole('checkbox', {
    name: /Managers can approve time off in Workforce/i,
  });
  const openEdit = async () => {
    await TimeTabSettingsPage.scrollIntoView(section);
    await section
      .getByRole('button', { name: /^Edit$/i })
      .first()
      .click();
    await page.waitForTimeout(1000);
  };
  const save = async () => {
    await section.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);
  };

  // Open edit, verify the two checkboxes + Save/Cancel.
  await openEdit();
  await expect(empCb).toBeVisible();
  await expect(mgrCb).toBeVisible();
  await expect(section.getByRole('button', { name: 'Save' })).toBeVisible();
  await expect(section.getByRole('button', { name: 'Cancel' })).toBeVisible();

  // Flip both, save, reopen and verify the selection (checked = Yes) was retained.
  const empOrig = await empCb.isChecked();
  const mgrOrig = await mgrCb.isChecked();
  await TimeTabSettingsPage.scrollIntoView(empCb);
  await empCb.setChecked(!empOrig, { force: true });
  await TimeTabSettingsPage.scrollIntoView(mgrCb);
  await mgrCb.setChecked(!mgrOrig, { force: true });
  await save();
  await openEdit();
  await expect(empCb).toBeChecked({ checked: !empOrig });
  await expect(mgrCb).toBeChecked({ checked: !mgrOrig });
  console.log(
    '  ✓ Time off checkboxes toggled, saved & retained (checked = Yes)',
  );

  // Cleanup: restore original selection.
  await empCb.setChecked(empOrig, { force: true });
  await mgrCb.setChecked(mgrOrig, { force: true });
  await save();
  console.log('  ✓ Time off restored to original');
};

// Kiosk: card content + the manage entry button (kiosk devices is an external widget).
export const verifyKioskCard = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeTabSettingsPage.verifyKioskCardPresent(page);
  console.log('▶ [Kiosk] verifying card content + manage dialog');
  // View-mode content.
  await expect(
    page
      .getByText(
        'Add or remove computers or tablets your team uses to clock in and out',
      )
      .first(),
  ).toBeVisible();
  const editKioskBtn = page.getByRole('button', { name: 'Edit kiosk devices' });
  await expect(editKioskBtn).toBeVisible();

  // Open the manage-kiosk dialog and verify it opened. The kiosk content
  // (Add device, inactivity, etc.) is rendered inside an external-widget
  // iframe that page-level locators can't reach, so we verify the dialog
  // shell instead: the "Kiosk Manager" heading and the Done button.
  await TimeTabSettingsPage.scrollIntoView(editKioskBtn);
  await editKioskBtn.click();
  await page.waitForTimeout(5000);
  await expect(
    page.getByRole('heading', { name: /Kiosk Manager/i }).first(),
  ).toBeVisible();
  const doneBtn = page.getByRole('button', { name: 'Done' }).first();
  await expect(doneBtn).toBeVisible();
  // Close the dialog.
  await doneBtn.click();
  await page.waitForTimeout(1000);
  console.log('  ✓ Kiosk card + manage dialog (Kiosk Manager, Done) verified');
};
