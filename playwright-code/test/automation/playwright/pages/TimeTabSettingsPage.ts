import { Page, Locator, expect as baseExpect } from '@playwright/test';

import * as TimeSettingsPage from './TimeSettingsPage';
import { TimeTrackingTestId } from '../utilsTS';

// Fail fast: cap the retrying-assertion timeout (vs the 3-min global default) so a
// missing element surfaces quickly instead of stalling the run.
const expect = baseExpect.configure({ timeout: 20000 });

// Bounded visibility timeout for explicit per-call use.
const ELEMENT_TIMEOUT = 15000;

// Time tab page-object: card-presence + reload/read-back helpers; reuses TimeSettingsPage.

// data-testids / handles rendered for each settings card.
export const TIME_TAB_CARD = {
  timeTracking: 'timetracking-settings-view',
  timesheetFields: 'timeSheet-settings',
  customFields: 'custom-fields-settings',
  geolocation: 'geo-locations-settings-handle',
  breaks: 'break-settings-handle',
} as const;

// Persistence refresh: after a save the card stays on the Time tab in view mode,
// so just let it settle and confirm the Time panel is still shown — no reload.
export const softRefreshTimeTab = async (page: Page) => {
  await page.waitForLoadState('load').catch(() => {});
  await TimeSettingsPage.waitForLoadingToDisappear(page).catch(() => {});
  await page.waitForTimeout(1500);
  await TimeSettingsPage.waitForSettingsHomePage(page);
};

// Confirms the Time tab landed and is ready before any assertions.
export const verifyTimeTabLoaded = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.waitForSettingsHomePage(page);
};

// ==========================================
// Card-presence assertions (one per Time tab card)
// ==========================================

export const verifyTimeTrackingCardPresent = async (page: Page) => {
  await expect(
    page.getByRole('heading', { name: 'Time tracking' }),
  ).toBeVisible();
};

// ==========================================
// Edit-screen header + element checks (after clicking Edit on a card)
// ==========================================

// Time tracking edit form: header + every visible line and the Save/Cancel actions.
// Always-present elements are asserted strictly; checkboxes that are account-gated
// (mobile-app, capture-signatures, edit-clock-out) are verified only when shown.
export const verifyTimeTrackingEditElements = async (page: Page) => {
  const vis = (loc: Locator) =>
    expect(loc).toBeVisible({ timeout: ELEMENT_TIMEOUT });
  await vis(page.getByRole('heading', { name: 'Time tracking' }));
  await vis(page.getByText('Timesheet management'));
  await vis(page.getByText('First day of work week'));
  await vis(page.getByPlaceholder('Select days').first());
  await vis(page.getByText('Time zone'));
  await vis(
    page.getByRole('checkbox', { name: TIME_TRACKING_CHECKBOX.splitMidnight }),
  );
  await vis(
    page.getByRole('checkbox', {
      name: TIME_TRACKING_CHECKBOX.allowCreateEdit,
    }),
  );

  // Optional, account-dependent checkboxes — verify only if present.
  for (const label of [
    TIME_TRACKING_CHECKBOX.mobileApp,
    TIME_TRACKING_CHECKBOX.captureSignatures,
    TIME_TRACKING_CHECKBOX.editClockOut,
  ]) {
    const cb = page.getByRole('checkbox', { name: label });
    if ((await cb.count()) > 0) await vis(cb.first());
    else
      console.log(
        `(time tracking) checkbox not present on this account: ${label}`,
      );
  }

  // Timesheet rounding block (labels + direction/increment dropdowns).
  await TimeSettingsPage.verifyTimeSheetRounding(page);
  await vis(page.getByRole('button', { name: 'Save' }));
  await vis(page.getByText('Cancel'));
};

// ==========================================
// Time tracking — read / change / restore field helpers
// ==========================================

// Dropdown locators on the Time tracking edit form.
export const TIME_TRACKING_DROPDOWN = {
  firstDay: 'Select days', // placeholder
  timeZone: TimeTrackingTestId.Timezone,
  roundClockInDir: TimeTrackingTestId.clkInDirection,
  roundClockInInc: TimeTrackingTestId.clkInRoundInc,
  roundClockOutDir: TimeTrackingTestId.clkOutDirection,
  roundClockOutInc: TimeTrackingTestId.clkOutRoundInc,
} as const;

// Time tracking checkboxes by accessible name (the set varies per account; some
// are absent or disabled). Matched as a substring, so partial labels are fine.
export const TIME_TRACKING_CHECKBOX = {
  splitMidnight: 'Split timesheets at midnight',
  allowCreateEdit: 'Allow team members to create and edit their own timesheets',
  mobileApp: 'Allow team members to track time on the mobile app',
  captureSignatures: 'Capture signatures for timesheets',
  editClockOut: 'Allow team members to edit their clock-out time',
} as const;

const isXpath = (s: string) => s.startsWith('/') || s.startsWith('(');

// Scrolls a locator into view (no-op when already visible) so headed runs show the
// element settling into view before it is clicked/toggled.
export const scrollIntoView = async (locator: Locator) => {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
};

// Verifies the Cancel and/or Close controls on an edit/manage screen (whichever are
// present). Pass `scope` (e.g. a dialog locator) to limit the search to that screen.
export const verifyCancelCloseButtons = async (page: Page, scope?: Locator) => {
  const root = scope ?? page;
  for (const name of ['Cancel', 'Close']) {
    const btn = root.getByRole('button', { name });
    if ((await btn.count()) > 0) {
      await expect(btn.first()).toBeVisible();
      console.log(`  ✓ ${name} button visible`);
    }
  }
};

const dropdownInput = (page: Page, locator: string) =>
  isXpath(locator)
    ? page.locator(locator).first()
    : page.getByPlaceholder(locator).first();

// Reads a dropdown's currently-displayed value.
export const readTimeTrackingDropdown = async (page: Page, locator: string) =>
  (await dropdownInput(page, locator).inputValue()) ?? '';

// Selects the open listbox option whose text equals `optionText` (used for restore).
export const selectTimeTrackingDropdownByText = async (
  page: Page,
  locator: string,
  optionText: string,
) => {
  await scrollIntoView(dropdownInput(page, locator));
  await TimeSettingsPage.clickOnDropdown(page, locator, 0);
  await page.waitForTimeout(400);
  const option = page
    .getByRole('option', { name: optionText, exact: true })
    .first();
  await scrollIntoView(option);
  await option.click();
  await page.waitForTimeout(300);
};

// Selects any option different from the current value; returns the new value text.
export const changeTimeTrackingDropdown = async (
  page: Page,
  locator: string,
) => {
  const current = await readTimeTrackingDropdown(page, locator);
  await scrollIntoView(dropdownInput(page, locator));
  await TimeSettingsPage.clickOnDropdown(page, locator, 0);
  await page.waitForTimeout(400);
  const options = page.getByRole('option');
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const text = (await options.nth(i).innerText()).trim();
    if (text && text !== current) {
      await scrollIntoView(options.nth(i));
      await options.nth(i).click();
      await page.waitForTimeout(300);
      return text;
    }
  }
  await page.waitForTimeout(300);
  return current;
};

const ttCheckbox = (page: Page, label: string) =>
  page.getByRole('checkbox', { name: label });

// True if the checkbox is present on this account.
export const timeTrackingCheckboxExists = async (page: Page, label: string) =>
  (await ttCheckbox(page, label).count()) > 0;

// True if the checkbox is present AND enabled (some, e.g. mobile-app, are disabled).
export const timeTrackingCheckboxEnabled = async (
  page: Page,
  label: string,
) => {
  const cb = ttCheckbox(page, label).first();
  if ((await ttCheckbox(page, label).count()) === 0) return false;
  return cb.isEnabled().catch(() => false);
};

export const getTimeTrackingCheckbox = async (page: Page, label: string) =>
  ttCheckbox(page, label).first().isChecked();

// Sets a checkbox to the desired state (skips absent or disabled checkboxes).
export const setTimeTrackingCheckbox = async (
  page: Page,
  label: string,
  on: boolean,
) => {
  if (!(await timeTrackingCheckboxEnabled(page, label))) return;
  const cb = ttCheckbox(page, label).first();
  if ((await cb.isChecked()) !== on) {
    await scrollIntoView(cb);
    if (on) await cb.check({ force: true });
    else await cb.uncheck({ force: true });
    await page.waitForTimeout(300);
  }
};

// The mobile-app checkbox is disabled exactly when "Allow team members to create
// and edit their own timesheets" is ON (source: disabled={isManageOwnTimeSheetsEnabled}).
// Verify that relationship rather than a fixed state (which drifts with the parent).
export const verifyMobileAppCheckboxState = async (page: Page) => {
  const mobile = ttCheckbox(page, TIME_TRACKING_CHECKBOX.mobileApp);
  if ((await mobile.count()) === 0) {
    console.log(
      '(time tracking) mobile-app checkbox not present; skipping state check',
    );
    return;
  }
  const parentOn = await getTimeTrackingCheckbox(
    page,
    TIME_TRACKING_CHECKBOX.allowCreateEdit,
  );
  if (parentOn) {
    await expect(mobile.first()).toBeDisabled({ timeout: ELEMENT_TIMEOUT });
  } else {
    await expect(mobile.first()).toBeEnabled({ timeout: ELEMENT_TIMEOUT });
  }
  console.log(
    `  ✓ Mobile-app checkbox ${
      parentOn ? 'disabled' : 'enabled'
    } (matches allow-create-edit=${parentOn})`,
  );
};

// Confirms the Time tracking card is back in VIEW mode (Edit button shown, no Save).
export const verifyTimeTrackingViewMode = async (page: Page) => {
  await expect(
    page
      .getByTestId('timetracking-settings-view')
      .getByRole('button', { name: 'Edit' }),
  ).toBeVisible();
};

// Custom fields edit dialog: header, description, Add button and all columns.
// Scoped to the "Custom fields" dialog so it doesn't clash with other cards
// (e.g. the Geolocation card's saved "Required" value on the page behind it).
export const CUSTOM_FIELD_COLUMNS = [
  'Custom field',
  'Data type',
  'Customers',
  'Workers',
  'Status',
  'Required',
  'Actions',
];

export const verifyCustomFieldsEditElements = async (page: Page) => {
  const dialog = page.getByRole('dialog', { name: 'Custom fields' });
  await expect(dialog).toBeVisible({ timeout: 30000 });
  await expect(
    dialog.getByRole('heading', {
      name: 'Manage custom fields for time tracking',
    }),
  ).toBeVisible();
  await expect(
    dialog.getByText('Add up to 12 custom fields', { exact: false }),
  ).toBeVisible();
  // "Manage all custom fields" (rendered as text in the dialog) + the Add button
  // (its accessible name is the automation id "custom-fields-add-button").
  await expect(
    dialog.getByText('Manage all custom fields').first(),
  ).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'custom-fields-add-button' }),
  ).toBeVisible();

  // All 7 table columns.
  for (const col of CUSTOM_FIELD_COLUMNS) {
    await expect(
      dialog.getByRole('columnheader', { name: col, exact: true }).first(),
    ).toBeVisible();
  }

  // Empty zero-state.
  await expect(
    dialog.getByText('No custom fields for time tracking yet'),
  ).toBeVisible();
  await expect(
    dialog.getByText('to get started', { exact: false }).first(),
  ).toBeVisible();

  // Pagination row.
  await expect(dialog.getByText(/of \d+ items/).first()).toBeVisible();
  await expect(
    dialog.getByText('Page', { exact: false }).first(),
  ).toBeVisible();

  await verifyCancelCloseButtons(page, dialog);
};

// Geolocation edit dialog: location-tracking options (+ descriptions), the Mileage
// tracking and Geofence sections (headings, descriptions, checkboxes), Save + Cancel/Close.
export const verifyGeolocationEditElements = async (page: Page) => {
  const dialog = page.getByRole('dialog', { name: 'Geolocation' });
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await expect(
    page.getByText('Select your geolocation preferences').first(),
  ).toBeVisible();

  // Location tracking options + their descriptions.
  await expect(page.locator(`//*[text()='Required']`).first()).toBeVisible();
  await expect(
    page
      .getByText('Location is required for clocking in', { exact: false })
      .first(),
  ).toBeVisible();
  await expect(page.locator(`//*[text()='Optional']`).first()).toBeVisible();
  await expect(
    page
      .getByText('decide whether or not to track their', { exact: false })
      .first(),
  ).toBeVisible();
  await expect(page.locator(`//*[text()='Never']`).first()).toBeVisible();
  await expect(
    page.getByText('location at all', { exact: false }).first(),
  ).toBeVisible();

  // Mileage tracking section (label is bold text, not a heading role).
  await expect(
    page.getByText('Mileage tracking', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page
      .getByText(
        'Automatically track employee mileage for expense reimbursement',
        { exact: false },
      )
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole('checkbox', { name: /Turn on mileage tracking/i }),
  ).toBeVisible();

  // Geofence section.
  await expect(
    page.getByText('Geofence', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page
      .getByText('Geofences are invisible boundaries around specific areas', {
        exact: false,
      })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole('checkbox', { name: /Turn on geofence/i }),
  ).toBeVisible();

  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  await verifyCancelCloseButtons(page, dialog);
};

export const verifyTimesheetFieldsCardPresent = async (page: Page) => {
  await expect(page.getByText('Timesheet fields').first()).toBeVisible();
};

export const verifyCustomFieldsCardPresent = async (page: Page) => {
  await expect(page.getByTestId(TIME_TAB_CARD.customFields)).toBeVisible();
};

export const verifyGeolocationCardPresent = async (page: Page) => {
  await TimeSettingsPage.verifyGeoLocationSettingsSectionVisible(page);
  await expect(
    page.getByRole('heading', { name: 'Geolocation' }),
  ).toBeVisible();
};

export const verifyBreaksCardPresent = async (page: Page) => {
  await expect(page.getByTestId(TIME_TAB_CARD.breaks)).toBeVisible();
};

export const verifyNotificationsCardPresent = async (page: Page) => {
  await expect(page.getByText('Notifications').first()).toBeVisible();
};

export const verifyApprovalsCardPresent = async (page: Page) => {
  await TimeSettingsPage.verifyApprovalsSectionInSettings(page);
};

export const verifyOvertimeCardPresent = async (page: Page) => {
  await expect(page.getByText('Overtime').first()).toBeVisible();
};

// Schedules is entitlement-gated and absent on some SKUs — verify only if present.
export const verifySchedulesCardPresent = async (page: Page) => {
  const card = page.getByText('Schedules').first();
  if ((await card.count()) === 0) {
    console.log(
      '(time tab) Schedules card not present on this account; skipping',
    );
    return;
  }
  await expect(card).toBeVisible();
};

export const verifyTimeOffCardPresent = async (page: Page) => {
  await expect(page.getByText('Time off').first()).toBeVisible();
};

export const verifyKioskCardPresent = async (page: Page) => {
  await expect(page.getByText('Kiosk').first()).toBeVisible();
};

// ==========================================
// Read-back helpers (for "did the save stick?" assertions)
// ==========================================

// ==========================================
// Timesheet fields — table model + helpers
// ==========================================

// Column header labels (some columns are entitlement/FF gated).
export const TIMESHEET_COLUMN_HEADERS = {
  field: 'Field',
  customers: 'Customers assigned',
  status: 'Show on timesheets',
  required: 'Require on timesheets',
  action: 'Action',
} as const;

export interface TimesheetSubField {
  key: string;
  label: string;
}

export interface TimesheetField {
  key: string; // Show-on-timesheet toggle aria-label
  labels: string[]; // accepted visible labels (account-dependent, e.g. Location/Department)
  requiredKey: string | null; // Required toggle aria-label (FF gated column)
  hasAction: boolean; // has a View/Action combo (assignments gated)
  subFields: TimesheetSubField[];
}

// Every standard timesheet field, its Required toggle and subfields.
// Keys verified against the live table (each is a `switch` aria-label).
export const TIMESHEET_FIELDS: TimesheetField[] = [
  {
    key: 'customersForTimeSheetEnabled',
    labels: ['Customers and sub-customers', 'Customers'],
    requiredKey: 'customersRequired',
    hasAction: false,
    subFields: [],
  },
  {
    key: 'isServiceFieldEnabled',
    labels: ['Service item', 'Service'],
    requiredKey: 'serviceItemRequired',
    hasAction: true,
    subFields: [],
  },
  {
    key: 'isBillingFieldEnabled',
    labels: ['Billable'],
    requiredKey: 'requireBillable',
    hasAction: true,
    subFields: [{ key: 'billingRateForTimeEnabled', label: 'Rate per hour' }],
  },
  {
    key: 'classForTimeSheetEnabled',
    labels: ['Class'],
    requiredKey: 'classRequired',
    hasAction: true,
    subFields: [],
  },
  {
    // Location is renamed "Department" on some accounts — accept both.
    key: 'locationForTimeSheetEnabled',
    labels: ['Location', 'Department'],
    requiredKey: 'locationRequired',
    hasAction: true,
    subFields: [],
  },
  {
    key: 'timeSheetEntryNotesEnabled',
    labels: ['Notes'],
    requiredKey: 'timeSheetEntryMakesNotesRequiredEnabled',
    hasAction: false,
    subFields: [
      {
        key: 'timeSheetEntryEditNotesEnabled',
        label: 'Allow team members to edit existing notes',
      },
    ],
  },
];

const timesheetSwitch = (page: Page, key: string) =>
  page.getByRole('switch', { name: key, exact: true });

// True if a switch (toggle) with the given aria-label is present.
export const timesheetSwitchExists = async (page: Page, key: string) =>
  (await timesheetSwitch(page, key).count()) > 0;

// True if the switch is present AND enabled (some toggles, e.g. Customers, are disabled).
export const timesheetSwitchEnabled = async (page: Page, key: string) => {
  const sw = timesheetSwitch(page, key).first();
  if ((await sw.count()) === 0) return false;
  return sw.isEnabled().catch(() => false);
};

// True if a column header with the given label is present.
export const timesheetColumnExists = async (page: Page, header: string) =>
  (await page.getByRole('columnheader', { name: header }).count()) > 0;

// Sets a toggle to the desired checked state (skips disabled toggles, e.g. Customers).
export const setTimesheetSwitch = async (
  page: Page,
  key: string,
  on: boolean,
) => {
  const sw = timesheetSwitch(page, key).first();
  await expect(sw).toBeVisible({ timeout: 10000 });
  if (!(await sw.isEnabled().catch(() => false))) {
    console.log(`(timesheet) switch "${key}" is disabled; skipping toggle`);
    return;
  }
  if ((await sw.isChecked()) !== on) {
    await scrollIntoView(sw);
    await sw.click();
    await page.waitForTimeout(500);
  }
};

/**
 * Expands the Dimensions section in Timesheet fields when collapsed.
 * Detects open state via the dimension row text; does not click if already open.
 */
export const expandDimensionsSectionIfNeeded = async (
  page: Page,
  dimensionName: string,
): Promise<void> => {
  const dimRowText = page.getByText(dimensionName, { exact: true }).first();
  const alreadyOpen = await dimRowText
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (alreadyOpen) return;
  await page
    .getByText('Dimensions (1)')
    .click()
    .catch(() => undefined);
  await dimRowText
    .waitFor({ state: 'visible', timeout: 10000 })
    .catch(() => undefined);
};

/**
 * Turns ON "shown on timesheet" then "required" for a named dimension row.
 * Reads dynamic switch aria-labels from the row (definition id / id-required).
 * "required" stays disabled until visible is on — polls until enabled.
 */
export const ensureDimensionVisibleAndRequired = async (
  page: Page,
  dimensionName: string,
): Promise<void> => {
  await expandDimensionsSectionIfNeeded(page, dimensionName);

  const dimRow = page
    .getByRole('row')
    .filter({ hasText: dimensionName })
    .first();
  await dimRow.waitFor({ state: 'visible', timeout: 15000 });

  const statusKey = await dimRow
    .locator('input[role="switch"]:not([aria-label$="-required"])')
    .first()
    .getAttribute('aria-label');
  const requiredKey = await dimRow
    .locator('input[role="switch"][aria-label$="-required"]')
    .first()
    .getAttribute('aria-label');

  if (statusKey) {
    await setTimesheetSwitch(page, statusKey, true);
  }
  if (requiredKey) {
    for (
      let i = 0;
      i < 20 && !(await timesheetSwitchEnabled(page, requiredKey));
      i++
    ) {
      await page.waitForTimeout(500);
    }
    await setTimesheetSwitch(page, requiredKey, true);
  }
};

// Asserts a toggle is in the expected checked state.
export const verifyTimesheetSwitch = async (
  page: Page,
  key: string,
  on: boolean,
) => {
  await expect(timesheetSwitch(page, key).first()).toBeChecked({ checked: on });
};

// Waits for the Timesheet settings trowser AND its field rows to render.
export const waitForTimesheetEditOpen = async (page: Page) => {
  await expect(
    page.getByRole('dialog', { name: 'Timesheet settings' }),
  ).toBeVisible({ timeout: 30000 });
  // Rows load after the trowser opens; wait for the first field's toggle.
  await expect(
    timesheetSwitch(page, 'customersForTimeSheetEnabled').first(),
  ).toBeVisible({ timeout: 30000 });
};

// Verifies the Timesheet settings edit trowser header + intro text.
export const verifyTimesheetEditHeader = async (page: Page) => {
  await expect(
    page.getByRole('heading', { name: 'Timesheet settings' }),
  ).toBeVisible();
  await expect(
    page.getByText('Customize your timesheets').first(),
  ).toBeVisible();
};

// Asserts present column headers (Field + Show on timesheets always; rest if gated-in).
export const verifyTimesheetColumnsVisible = async (page: Page) => {
  await expect(
    page
      .getByRole('columnheader', { name: TIMESHEET_COLUMN_HEADERS.field })
      .first(),
  ).toBeVisible();
  await expect(
    page
      .getByRole('columnheader', { name: TIMESHEET_COLUMN_HEADERS.status })
      .first(),
  ).toBeVisible();
  for (const header of [
    TIMESHEET_COLUMN_HEADERS.customers,
    TIMESHEET_COLUMN_HEADERS.required,
    TIMESHEET_COLUMN_HEADERS.action,
  ]) {
    if (await timesheetColumnExists(page, header)) {
      await expect(
        page.getByRole('columnheader', { name: header }).first(),
      ).toBeVisible();
    } else {
      console.log(`(timesheet) optional column not present: ${header}`);
    }
  }
};

// The table row that contains a given field's toggle.
const timesheetFieldRow = (page: Page, fieldKey: string) =>
  page.getByRole('row').filter({ has: timesheetSwitch(page, fieldKey) });

// True if any of the candidate labels is visible inside the field's row
// (handles per-account label aliases, e.g. Location vs Department).
const timesheetLabelVisible = async (
  page: Page,
  fieldKey: string,
  labels: string[],
) => {
  const row = timesheetFieldRow(page, fieldKey).first();
  for (const label of labels) {
    const visible = await row
      .getByText(label, { exact: true })
      .first()
      .isVisible()
      .catch(() => false);
    if (visible) return true;
  }
  return false;
};

// Asserts every available field's row (label + Show-on-timesheet toggle) is visible,
// plus its Required toggle and subfield toggles (each rendered as its own row).
// Labels are account-dependent, so the switch key is the anchor and ANY accepted
// label alias satisfies the label check.
export const verifyTimesheetFieldsVisible = async (page: Page) => {
  for (const field of TIMESHEET_FIELDS) {
    if (!(await timesheetSwitchExists(page, field.key))) {
      console.log(
        `(timesheet) field not present: ${field.labels[0]} (${field.key})`,
      );
      continue;
    }
    await expect(timesheetSwitch(page, field.key).first()).toBeVisible();
    await expect(timesheetFieldRow(page, field.key).first()).toBeVisible();

    const labelFound = await timesheetLabelVisible(
      page,
      field.key,
      field.labels,
    );
    expect(
      labelFound,
      `Expected one of [${field.labels.join(', ')}] as the label for ${
        field.key
      }`,
    ).toBeTruthy();

    if (
      field.requiredKey &&
      (await timesheetSwitchExists(page, field.requiredKey))
    ) {
      await expect(
        timesheetSwitch(page, field.requiredKey).first(),
      ).toBeVisible();
    }
    for (const sub of field.subFields) {
      if (await timesheetSwitchExists(page, sub.key)) {
        await expect(timesheetSwitch(page, sub.key).first()).toBeVisible();
      }
    }
  }
};

// True if the View button in a field's Action cell is disabled (readonly).
export const isTimesheetActionDisabled = async (
  page: Page,
  fieldKey: string,
) => {
  const view = timesheetFieldRow(page, fieldKey)
    .getByRole('button', { name: 'View', exact: true })
    .first();
  await expect(view).toBeVisible({ timeout: 10000 });
  return view.isDisabled();
};

// Asserts the View/Action combo enabled/disabled state for a field.
export const verifyTimesheetActionState = async (
  page: Page,
  fieldKey: string,
  expectedDisabled: boolean,
) => {
  expect(await isTimesheetActionDisabled(page, fieldKey)).toBe(
    expectedDisabled,
  );
};

// ==========================================
// Free-data accounts (FP Free SKUs) — reduced Time tab
// ==========================================
// Visible labels (mirror src/nls/timeTrackingSettings.json + viewForm config).
export const FREE_DATA_LABELS = {
  general: 'General',
  firstDayOfWorkWeek: 'First day of work week',
  timesheet: 'Timesheet',
  showServiceField: 'Show service field',
  allowBillable: 'Allow time to be billable',
} as const;

// The Settings dialog that hosts the Time tab content.
const freeDataSettings = (page: Page) =>
  page.getByRole('dialog', { name: 'Settings' });

// The view-mode value <span> rendered next to a card row's <label>.
const freeDataRowValue = (page: Page, label: string) =>
  freeDataSettings(page)
    .locator(
      `xpath=.//label[normalize-space()='${label}']/following-sibling::span`,
    )
    .first();

// The Edit pencil belonging to a given card heading (the first Edit button that
// follows that card's heading in document order).
const freeDataEditButton = (page: Page, heading: string) =>
  freeDataSettings(page)
    .locator(
      `xpath=(.//*[self::h1 or self::h2 or self::h3][normalize-space()='${heading}']` +
        `/following::button[@aria-label='Edit'])[1]`,
    )
    .first();

// Waits for the free-data Time tab to render (the "General" card heading).
export const verifyFreeDataTimeTabLoaded = async (page: Page) => {
  // NOTE: do NOT use navigateToAccountAndSettingsTime — its readiness gate waits
  // for ELITE card test-ids (timetracking/notifications/overtime…) that a
  // free-data company never renders (→ 60s timeout). Navigate directly and wait
  // for the free-data content (the General heading) instead.
  await TimeSettingsPage.navigateWithAuthSession(
    page,
    'app/accountsettings?p=time',
    {
      waitUntil: 'load',
    },
  );
  await TimeSettingsPage.waitForLoadingToDisappear(page).catch(() => {});
  await TimeSettingsPage.handlePopupsInAnyOrder(page).catch(() => {});
  await expect(
    freeDataSettings(page).getByRole('heading', {
      name: FREE_DATA_LABELS.general,
      exact: true,
    }),
  ).toBeVisible({ timeout: 30000 });
};

// Opens a free-data card's edit panel (pencil), runs an in-edit assertion, asserts
// Save is shown, then Cancels back to view (no mutation). Cancel with nothing dirty
// never triggers the unsaved-changes modal, so this is side-effect free.
const openVerifyCancelFreeDataEdit = async (
  page: Page,
  heading: string,
  verifyEdit: () => Promise<void>,
) => {
  const dialog = freeDataSettings(page);
  const editBtn = freeDataEditButton(page, heading);
  await expect(editBtn).toBeVisible({ timeout: ELEMENT_TIMEOUT });
  await scrollIntoView(editBtn);
  await editBtn.click();
  await page.waitForTimeout(800);
  await verifyEdit();
  await expect(
    dialog.getByRole('button', { name: 'Save' }).first(),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).first().click();
  await page.waitForTimeout(800);
  // Back in view mode → the Edit pencil is shown again.
  await expect(editBtn).toBeVisible();
};

// General card (free-data): heading, "First day of work week" + its day value, and
// the edit screen (days dropdown + Save/Cancel), then cancels back to view.
export const verifyFreeDataGeneralCard = async (page: Page) => {
  const dialog = freeDataSettings(page);
  await expect(
    dialog.getByRole('heading', {
      name: FREE_DATA_LABELS.general,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    dialog.getByText(FREE_DATA_LABELS.firstDayOfWorkWeek).first(),
  ).toBeVisible();
  // The displayed value is a weekday (e.g. "Sunday").
  await expect(
    freeDataRowValue(page, FREE_DATA_LABELS.firstDayOfWorkWeek),
  ).toHaveText(/(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/i);

  await openVerifyCancelFreeDataEdit(
    page,
    FREE_DATA_LABELS.general,
    async () => {
      await expect(
        dialog.locator('[aria-label="DaysOfWeekDropDown"]').first(),
      ).toBeVisible();
    },
  );
};

// Timesheet card (free-data): heading, "Show service field" + "Allow time to be
// billable" rows (each On/Off), and the edit screen (both toggles + Save/Cancel),
// then cancels back to view.
export const verifyFreeDataTimesheetCard = async (page: Page) => {
  const dialog = freeDataSettings(page);
  await expect(
    dialog.getByRole('heading', {
      name: FREE_DATA_LABELS.timesheet,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    dialog.getByText(FREE_DATA_LABELS.showServiceField).first(),
  ).toBeVisible();
  await expect(
    freeDataRowValue(page, FREE_DATA_LABELS.showServiceField),
  ).toHaveText(/^(On|Off)$/);

  await expect(
    dialog.getByText(FREE_DATA_LABELS.allowBillable).first(),
  ).toBeVisible();
  await expect(
    freeDataRowValue(page, FREE_DATA_LABELS.allowBillable),
  ).toHaveText(/^(On|Off)$/);

  await openVerifyCancelFreeDataEdit(
    page,
    FREE_DATA_LABELS.timesheet,
    async () => {
      await expect(
        dialog.locator('[aria-label="serviceFieldEnableSwitch"]').first(),
      ).toBeVisible();
      await expect(
        dialog.locator('[aria-label="billableFieldEnableSwitch"]').first(),
      ).toBeVisible();
    },
  );
};
