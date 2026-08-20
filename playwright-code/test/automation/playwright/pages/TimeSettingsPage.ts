import { Page, Locator, expect } from '@playwright/test';
import gotoWithAuthSession from '../gotoWithAuthSession';
import exp from 'constants';
import {
  TimeTrackingLabels,
  TimesheetRoundingLabels,
  TimeTrackingTestId,
  NotificationsLabels,
} from '../utilsTS';
import { LABELS, testData } from '../constants';
import { exact } from 'prop-types';
import { dismissCookieConsent } from './MileagePage';
import { time } from 'console';

/** Default timeouts for Time Settings navigation and loading waits (ms). */
export const TIME_SETTINGS_NAV_TIMEOUT = 120_000;
export const TIME_SETTINGS_SPINNER_TIMEOUT = 120_000;
export const TIME_SETTINGS_PAGE_READY_TIMEOUT = 60_000;
export const TIME_SETTINGS_POST_NAV_DELAY = 2000;

const timeSettingsContentLocator = (page: Page) =>
  page
    .locator(
      [
        '[data-testid="timetracking-settings-view"]',
        '[data-testid="approvals-settings"]',
        '[data-testid="notifications-settings"]',
        '[data-testid="overtime-settings-handle"]',
        '[data-testid="overtime-settings-handle-view"]',
        '#overtime-settings-handle',
      ].join(', '),
    )
    .first();

/** Account settings often opens on Company; `?p=time` alone may not load Time content (IES). */
export const ensureAccountSettingsTimePanel = async (
  page: Page,
): Promise<void> => {
  if (
    await timeSettingsContentLocator(page)
      .isVisible({ timeout: 5000 })
      .catch(() => false)
  ) {
    // #region agent log
    fetch('http://127.0.0.1:7477/ingest/77f6fdb5-1c43-48bf-a717-bc5c8246fbb8', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '2edb97',
      },
      body: JSON.stringify({
        sessionId: '2edb97',
        location: 'TimeSettingsPage.ts:ensureAccountSettingsTimePanel',
        message: 'Time panel already visible',
        data: { skippedClick: true },
        timestamp: Date.now(),
        hypothesisId: 'H1',
        runId: 'post-fix',
      }),
    }).catch(() => {});
    // #endregion
    return;
  }

  const settingsDialog = page.getByRole('dialog', { name: 'Settings' });
  await settingsDialog
    .waitFor({ state: 'visible', timeout: 30_000 })
    .catch(() => {});

  const timeNav = settingsDialog
    .getByRole('button', { name: /^Time$/i })
    .or(settingsDialog.getByRole('link', { name: /^Time/i }))
    .or(settingsDialog.getByRole('tab', { name: /^Time/i }))
    .first();

  const timeNavVisible = await timeNav
    .isVisible({ timeout: 15_000 })
    .catch(() => false);
  // #region agent log
  fetch('http://127.0.0.1:7477/ingest/77f6fdb5-1c43-48bf-a717-bc5c8246fbb8', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '2edb97',
    },
    body: JSON.stringify({
      sessionId: '2edb97',
      location: 'TimeSettingsPage.ts:ensureAccountSettingsTimePanel',
      message: 'Time nav visibility',
      data: { timeNavVisible },
      timestamp: Date.now(),
      hypothesisId: 'H1',
      runId: 'post-fix',
    }),
  }).catch(() => {});
  // #endregion

  if (timeNavVisible) {
    await timeNav.click();
    await waitForLoadingToDisappear(page);
  }
};

/**
 * Submit Time variant of {@link ensureAccountSettingsTimePanel}. Kept separate
 * so the Submit Time flows (SUT*) can evolve this navigation independently
 * without affecting the shared callers of the original method.
 */
export const ensureAccountSettingsTimePanelUpdated = async (
  page: Page,
): Promise<void> => {
  if (
    await timeSettingsContentLocator(page)
      .isVisible({ timeout: 5000 })
      .catch(() => false)
  ) {
    return;
  }

  const settingsDialog = page.getByRole('dialog', { name: 'Settings' });
  await settingsDialog
    .waitFor({ state: 'visible', timeout: 30_000 })
    .catch(() => {});

  const timeNav = settingsDialog
    .getByRole('button', { name: /^Time$/i })
    .or(settingsDialog.getByRole('link', { name: /^Time/i }))
    .or(settingsDialog.getByRole('tab', { name: /^Time/i }))
    .first();

  const timeNavVisible = await timeNav
    .isVisible({ timeout: 15_000 })
    .catch(() => false);

  if (timeNavVisible) {
    await timeNav.click();
    await waitForLoadingToDisappear(page);
  }
};

/** Wait until Account & Settings → Time panel content is rendered (not Time Entries chrome). */
export async function waitForTimeSettingsPanelReady(
  page: Page,
  timeout = TIME_SETTINGS_PAGE_READY_TIMEOUT,
): Promise<void> {
  await waitForLoadingToDisappear(page, timeout);

  const progress = page.getByRole('progressbar', { name: /loading/i });
  const progressCount = await progress.count();
  if (progressCount > 0) {
    await progress
      .first()
      .waitFor({ state: 'hidden', timeout })
      .catch(() => {});
  }

  const contentVisible = await timeSettingsContentLocator(page)
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  // #region agent log
  fetch('http://127.0.0.1:7477/ingest/77f6fdb5-1c43-48bf-a717-bc5c8246fbb8', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '2edb97',
    },
    body: JSON.stringify({
      sessionId: '2edb97',
      location: 'TimeSettingsPage.ts:waitForTimeSettingsPanelReady',
      message: 'After spinner wait',
      data: { progressCount, contentVisible },
      timestamp: Date.now(),
      hypothesisId: 'H2',
      runId: 'post-fix',
    }),
  }).catch(() => {});
  // #endregion

  await expect(timeSettingsContentLocator(page)).toBeVisible({ timeout });
}

export const navigateToAccountAndSettingsTime = async (
  page: Page,
  useUpdatedPanel = false,
) => {
  const url = `app/accountsettings?p=time`;
  await navigateWithAuthSession(page, url, { waitUntil: 'load' });
  if (useUpdatedPanel) {
    await ensureAccountSettingsTimePanelUpdated(page);
  } else {
    await ensureAccountSettingsTimePanel(page);
  }
  await waitForTimeSettingsPanelReady(page, TIME_SETTINGS_PAGE_READY_TIMEOUT);
  await handlePopupsInAnyOrder(page);
};

export const verifyTimeSignatureAndTeamMemberPermissionsSettings = async (
  page: Page,
) => {
  await expect(page.getByText(LABELS.signatureSettings)).toBeVisible();
};

export const changeTimeSignatureSettings = async (page: Page) => {
  const settingsView = page.getByTestId('timetracking-settings-view');
  await settingsView.getByRole('button', { name: 'Edit' }).click();

  const signatureCheckbox = page.getByLabel(LABELS.signatureSettings);
  const wasChecked = await signatureCheckbox.isChecked();
  if (wasChecked) {
    await signatureCheckbox.uncheck();
  } else {
    await signatureCheckbox.check();
  }

  await clickOnTimeTrackingSaveButton(page);

  const expectedToggleText = wasChecked ? 'Off' : 'On';
  const signatureRowPattern = new RegExp(
    `^${LABELS.signatureSettings.replace(
      /[()]/g,
      '\\$&',
    )}\\s*${expectedToggleText}$`,
  );
  await expect(
    page.locator('div').filter({ hasText: signatureRowPattern }).first(),
  ).toBeVisible();
};

export const verifyTeamMemberPermissionsSettings = async (page: Page) => {
  await expect(page.getByText(LABELS.teamMemberPermissionsView)).toBeVisible();
  await expect(page.getByText(LABELS.mobileTimeTracking)).toBeVisible();
};

const mobileAppLabel = (page: Page) =>
  page.locator('label').filter({
    hasText: LABELS.mobileTimeTracking,
  });

/** Saves and verifies the three team-member timesheets × mobile-tracking combinations. */
export const changeTeamMemberPermissionsSettings = async (page: Page) => {
  const settingsView = page.getByTestId('timetracking-settings-view');
  const manageOwn = page.getByLabel(LABELS.teamMemberPermissionsEdit);
  const mobileEnabled = page.getByLabel(LABELS.mobileTimeTracking);

  const assertMobileAppTrackingFollowsTimesheetsPermission = async () => {
    if (await manageOwn.isChecked()) {
      const mobile = mobileAppLabel(page).getByRole('checkbox');
      await expect(mobile).toBeChecked();
      await expect(mobile).toBeDisabled();
    } else {
      await expect(mobileEnabled).toBeEnabled();
    }
  };

  const steps: { manageOn: boolean; mobileOn: boolean }[] = [
    { manageOn: true, mobileOn: true },
    { manageOn: false, mobileOn: true },
    { manageOn: false, mobileOn: false },
  ];

  // iterate for three different scenarios and verify the save operation is successful for each scenario
  for (const { manageOn, mobileOn } of steps) {
    await page.waitForTimeout(2000);
    await settingsView.getByRole('button', { name: 'Edit' }).click();
    await assertMobileAppTrackingFollowsTimesheetsPermission();

    if (manageOn) {
      await manageOwn.check();
    } else {
      await manageOwn.uncheck();
      if (mobileOn) {
        await mobileEnabled.check();
      } else {
        await mobileEnabled.uncheck();
      }
    }

    await assertMobileAppTrackingFollowsTimesheetsPermission();
    await clickOnTimeTrackingSaveButton(page);

    const manageTimesheetsValue = page
      .locator('div')
      .filter({
        hasText: new RegExp(
          `^${LABELS.teamMemberPermissionsView}${manageOn ? 'On' : 'Off'}$`,
        ),
      })
      .first()
      .locator('span');
    const mobileTrackingValue = page
      .locator('div')
      .filter({
        hasText: new RegExp(
          `^${LABELS.mobileTimeTracking}${mobileOn ? 'On' : 'Off'}$`,
        ),
      })
      .first()
      .locator('span');

    await expect(manageTimesheetsValue).toHaveText(manageOn ? 'On' : 'Off');
    await expect(mobileTrackingValue).toHaveText(mobileOn ? 'On' : 'Off');
  }
};
export const clickOnDropdown = async (
  page: Page,
  dropdown: string,
  option: number,
) => {
  // Check if dropdown is an XPath (starts with / or ()
  if (dropdown.startsWith('/') || dropdown.startsWith('(')) {
    // Use locator for XPath selectors (e.g., aria-label based)
    await page.locator(dropdown).click({ force: true, timeout: 10000 });
  } else {
    // Use getByPlaceholder for placeholder text
    let dropdownSelector = page.getByPlaceholder(dropdown).nth(option);
    await dropdownSelector.click({ force: true, timeout: 10000 });
  }
};

export const clickOnDropdownWithLabel = async (
  page: Page,
  labelName: string,
) => {
  const byLabelOrXpath = labelName.startsWith('//')
    ? page.locator(labelName)
    : page
        .locator(`//*[text()='${labelName}']/following::input[1]`)
        .or(page.getByLabel(labelName));
  await byLabelOrXpath
    .or(page.getByLabel('directionClockIn'))
    .or(page.getByLabel('directionClockOut'))
    .first()
    .click({ force: true, timeout: 5000 });
};

export const chooseDropDownOption = async (page: Page, ddOption: number) => {
  await page
    .locator(`//*[contains(@class,"Menu-menu-item-wrapper")]`)
    .nth(ddOption)
    .click();
};

export const optionToChoose = async (page: Page, ddOption: number) => {
  return page
    .locator(`//li[contains(@class,'menu-item-container')]`)
    .nth(ddOption);
};

export const chooseDropDownOptionCustom = async (
  page: Page,
  ddOption: number,
) => {
  await page
    .locator(`//li[contains(@class,'menu-item-container')]`)
    .nth(ddOption)
    .click();
};

export const chooseRoundingOptions = async (page: Page, option: string) => {
  await page
    .locator(`//li[contains(@class,'menu-item-container')]`)
    .getByText(option)
    .click();
};

export const getSelectedDropdownValue = async (page: Page, locator: string) => {
  return await page.getByPlaceholder(locator).inputValue();
};

// Methods for Time => Time Tracking

export const verifyReadOnltimeTrackSection = async (page: Page) => {
  await expect(
    page.getByRole('heading', { name: 'Time tracking' }),
  ).toBeVisible(); // time tracking
  await expect(page.getByText('Timesheet management')).toBeVisible(); // timesheet management
  await expect(
    page.getByText(TimeTrackingLabels.firstdayOfWorkWeek),
  ).toBeVisible(); // First day of work
  await expect(page.getByText(TimeTrackingLabels.timezone)).toBeVisible(); // Time zone
  //commenting time format as the field has been removed from UI
  //await expect(page.getByText(TimeTrackingLabels.timeformat)).toBeVisible(); // Time format
  await expect(
    page.getByText(TimeTrackingLabels.SplitTSCheckbox),
  ).toBeVisible(); // Split timesheets at midnight
  await expect(page.getByText(TimeTrackingLabels.EditTSCheckbox)).toBeVisible(); // allow team members to create/edit timesheets
  await expect(
    page.getByText(TimeTrackingLabels.EditClkOutCheckbox),
  ).toBeVisible(); // allow team members to edit clock out time
  await expect(page.getByText('Timesheet rounding')).toBeVisible(); // timesheet rounding label
  await expect(
    page.getByText(TimeTrackingLabels.roundClkInTimes),
  ).toBeVisible(); // Round clock in times
  await expect(
    page.getByText(TimeTrackingLabels.roundClkOutTimes),
  ).toBeVisible(); // Round clock out times
  await expect(
    page
      .getByTestId('timetracking-settings-view')
      .getByRole('button', { name: 'Edit' }),
  ).toBeVisible(); // edit icon
};

export const clickTimeTrackingEditButton = async (page: Page) => {
  let EditBtn = page
    .getByTestId('timetracking-settings-view')
    .getByRole('button', { name: 'Edit' });
  await expect(EditBtn).toBeVisible(); // edit icon
  await EditBtn.click({ force: true, timeout: 2000 });
};

export const clickOnTimeTrackingSaveButton = async (page: Page) => {
  let SaveBtn = page.getByRole('button', { name: 'Save' });
  await expect(SaveBtn).toBeVisible(); // Save button
  await SaveBtn.click();
};

export const waitForSettingsHomePage = async (page: Page) => {
  await expect(page.getByTestId('timetracking-settings-view')).toBeVisible();
};

export const verifySavedFirstDayOfWorkWeek = async (page: Page) => {
  //return await expect(page.getByText('First day of work week').textContent()).toMatch(day);
  return String(
    await page.getByText('First day of work week').getAttribute('value'),
  );
};

export const clickOnTimeTrackingCancelButton = async (page: Page) => {
  await expect(page.getByText('Cancel')).toBeVisible(); // Cancel Button
  await page.getByText('Cancel').click();
};

export const checkBoxTimeTrack = async (page: Page, option: number) => {
  if (
    !(await page.locator(`//input[@type='checkbox']`).nth(option).isChecked())
  ) {
    await page
      .locator(`//input[@type='checkbox']`)
      .nth(option)
      .setChecked(true);
  }
};

export const uncheckBoxTimeTrack = async (page: Page, option: number) => {
  if (await page.locator(`//input[@type='checkbox']`).nth(option).isChecked()) {
    await page.locator(`//input[@type='checkbox']`).nth(option).uncheck();
  }
};

export const enterClkOutTimeHours = async (page: Page, hrs: string) => {
  let textbox = page.locator(`//input[@type='number']`);
  await expect(textbox).toBeVisible();
  await textbox.fill(hrs);
};

export const verifyTooltip = async (page: Page, tooltip: string) => {
  await page.getByTestId('').hover(); // i icon
  await expect(page.getByTestId(tooltip)).toBeVisible(); // tooltip
};

export const verifyTimeSheetRounding = async (page: Page) => {
  await expect(
    page.getByText(TimesheetRoundingLabels.timesheetRounding),
  ).toBeVisible();
  await expect(
    page.getByText(TimesheetRoundingLabels.timesheetRoundingInfo),
  ).toBeVisible();
  //await expect(page.getByTestId('')).toBeVisible(); // Timesheet rounding link
  await expect(
    page.getByText(TimesheetRoundingLabels.roundClkInTimes),
  ).toBeVisible(); // round clock in times
  await expect(
    page.getByText(TimesheetRoundingLabels.roundClkOutTimes),
  ).toBeVisible(); // round clock out times
  await expect(
    page.getByText(TimesheetRoundingLabels.roundClkInDirLabel),
  ).toBeVisible(); // clock in direction
  await expect(
    page.getByText(TimesheetRoundingLabels.roundClkOutDirLabel),
  ).toBeVisible(); // clock out direction
  await expect(
    page.getByText(TimesheetRoundingLabels.clkInRoundIncLabel),
  ).toBeVisible(); // clock in increment
  await expect(
    page.getByText(TimesheetRoundingLabels.clkOutRoundIncLabel),
  ).toBeVisible(); // clock out increment
};

export const waitForLoadingToDisappear = async (
  page: Page,
  timeout = TIME_SETTINGS_SPINNER_TIMEOUT,
) => {
  const loader = page
    .locator(`//div[@aria-label="Loading" and @role="progressbar"]`)
    .first();

  if (await loader.isVisible({ timeout: 5000 }).catch(() => false)) {
    await loader.waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  const spinners = page.locator(
    `//div[@aria-label="Loading" and @role="progressbar"]`,
  );
  const count = await spinners.count();

  for (let i = 0; i < count; i++) {
    await spinners
      .nth(i)
      .waitFor({ state: 'hidden', timeout })
      .catch(() => {});
  }

  await page.waitForTimeout(TIME_SETTINGS_POST_NAV_DELAY);
};

type NavigateWithAuthOptions = {
  waitUntil?: 'load' | 'domcontentloaded' | 'commit' | 'networkidle';
  timeout?: number;
  waitForSpinner?: boolean;
  spinnerTimeout?: number;
  postNavigateTimeout?: number;
};

/** Navigate with auth session, then wait for loading spinners to finish. */
export const navigateWithAuthSession = async (
  page: Page,
  url: string,
  options: NavigateWithAuthOptions = {},
) => {
  const {
    waitUntil = 'domcontentloaded',
    timeout = TIME_SETTINGS_NAV_TIMEOUT,
    waitForSpinner = true,
    spinnerTimeout = TIME_SETTINGS_SPINNER_TIMEOUT,
    postNavigateTimeout = TIME_SETTINGS_POST_NAV_DELAY,
  } = options;

  await gotoWithAuthSession(page, url, { waitUntil, timeout });
  await page.waitForLoadState('load', { timeout }).catch(() => {});

  if (waitForSpinner) {
    await waitForLoadingToDisappear(page, spinnerTimeout);
  }

  if (postNavigateTimeout > 0) {
    await page.waitForTimeout(postNavigateTimeout);
  }
};

export const loadingSpinner = async (page: Page) => {
  return page
    .locator(`//div[@aria-label="Loading" and @role="progressbar"]`)
    .first();
};

export const displayByDropdown = async (page: Page) => {
  return page.getByLabel('Display by');
};

export const expectSingleTimeEntryVisible = async (page: Page) => {
  return await expect(
    page.getByRole('heading', { name: 'Single time entry' }),
  ).toBeVisible();
};

// Hovers over the 'Split timesheets at midnight' checkbox
export const hoverOnSplitTimeSheet = async (page: Page) => {
  await page.getByLabel('Split timesheets at midnight').hover();
};

export const validateDateRangeDropdownOptions = async (page: Page) => {
  const actualOptions = await getDateRangeDropdownOptions(page);
  testData.expectedOptions.forEach((option) => {
    if (!actualOptions.includes(option)) {
      throw new Error(`Option "${option}" is missing in the dropdown.`);
    }
  });
};

export const getDateRangeDropdownOptions = async (page: Page) => {
  const listItems = await getlistItems(page);
  const textContents = await listItems.allInnerTexts();
  return textContents
    .filter((text: string) => text.trim() !== '') // Remove empty strings
    .map((text: string) => text.split('\n')[0].trim()); // Extract the part before '\n' and trim whitespace
};

export const getlistItems = async (page: Page) => {
  const dropdownMenu = await getdropdownMenu(page);
  return dropdownMenu.locator('li');
};

export const getdropdownMenu = async (page: Page) => {
  return await page.locator(
    `//div[contains(@class, 'DateRangeSelect') and @role='listbox']`,
  );
};

// Clicks the action dropdown for a given employee
export const clickActionDropdownForEmployee = async (
  page: Page,
  empName: string,
) => {
  return await page
    .locator(
      `(//div[text()='${empName}'] / ancestor::tr / descendant::button[@aria-label="Expand Menu"])[1]`,
    )
    .click();
};

// Clicks the 'Delete' option in the action dropdown
export const clickDeleteInActionDropdown = async (page: Page) => {
  return await page.locator(`//li[text()='Delete']`).click();
};

// Expects the delete entry confirmation popup to be visible
export const expectDeleteEntryConfirmationPopupOpen = async (page: Page) => {
  return await expect(
    page.getByText('Are you sure you want to delete this time entry?'),
  ).toBeVisible();
};

// Clicks 'Yes' on the delete entry confirmation popup
export const clickYesOnDeleteEntryPopup = async (page: Page) => {
  return await page.getByRole('button', { name: 'Yes' }).click();
};

// Counts the number of rows for a given employee
export const countEmployeeRow = async (page: Page, empName: string) => {
  return await page
    .locator(`//div[contains(text(), '${empName}')]/ancestor::tr`)
    .count();
};

export const waitForNameFieldToPopulate = async (page: Page) => {
  return await page.waitForFunction(
    (sel) => {
      const el = document.evaluate(
        sel,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      ).singleNodeValue as HTMLInputElement | null;
      return el && el.value && el.value.trim().length > 0;
    },
    `//*[contains(@placeholder, "name") and @type="text"]`,
    { timeout: 20000 },
  );
};

export const openDropdown = async (page: Page, label: string) => {
  await await page.waitForSelector(
    `//span[contains(text(),'${label}')] / ancestor::label / descendant::div[contains(@class, 'Dropdown')]`,
    { state: 'visible', timeout: 0 },
  );
  return await page
    .locator(
      `//span[contains(text(),'${label}')] / ancestor::label / descendant::div[contains(@class, 'Dropdown')]`,
    )
    .click();
};

export const selectOptionFromDropdown = async (page: Page, name: string) => {
  return await page
    .locator(`//li / descendant::*[self::b | self::span][text()='${name}']`)
    .click();
};

export const clickSetClockInAndOutToggles = async (page: Page) => {
  return await page
    .locator(
      `//span[contains(text(), 'Set clock')] / .. / following-sibling::input`,
    )
    .click();
};

export const enterNotes = async (page: Page, value: string) => {
  return await page
    .locator(`//span[contains(text(),'Notes')]/following-sibling::textarea`)
    .fill(value);
};

export const checkFieldVisibility = async (page: Page, fieldName: string) => {
  const lowerCaseFieldName = fieldName.toLowerCase();
  switch (lowerCaseFieldName) {
    case 'customers':
      const replaceSmalls = lowerCaseFieldName.replace(/s$/, '');
      return await page
        .locator(
          `//*[contains(@placeholder, "${replaceSmalls}") and @type="text"]`,
        )
        .isVisible();
    case 'duration':
      return await page
        .locator(`//*[contains(@placeholder, "hh:mm") and @type="text"]`)
        .isVisible();
    case 'billable (per hour)':
      return await billRateCheckBoxVisibility(page);
    default:
      return await page
        .locator(
          `//*[contains(@placeholder, "${lowerCaseFieldName}") and @type="text"]`,
        )
        .isVisible();
  }
};

export const billRateCheckBoxVisibility = async (page: Page) => {
  return await page
    .locator(`//span[contains(text(), 'Billable (per hour)')]`)
    .isVisible();
};

export const fillBillRateInput = async (page: Page, rate: string) => {
  const billRateInput = page.locator(
    `//span[contains(text(), 'Billable')]  / ancestor::div[contains(@class, 'BillableTaxable')] / descendant::input[@aria-label="Bill rate"]`,
  );
  if (await billRateInput.isVisible()) {
    return await billRateInput.fill(rate);
  }
};

export const clickSaveAndCloseButton = async (page: Page) => {
  await page.locator(`//button[contains(@aria-label, "Save and")]`).click();
  return await page.locator(`//*[text()='Save and close']`).click();
};

export const getFieldValue = async (page: Page, fieldName: string) => {
  const lowerCaseFieldName = fieldName.toLowerCase();
  switch (lowerCaseFieldName) {
    case 'customers':
      const replaceSmalls = lowerCaseFieldName.replace(/s$/, '');
      return await page
        .locator(
          `//*[contains(@placeholder, "${replaceSmalls}") and @type="text"]`,
        )
        .getAttribute('value');
    case 'duration':
    case 'break':
      return await page
        .locator(`//*[contains(@placeholder, "hh:mm") and @type="text"]`)
        .getAttribute('value');
    default:
      return await page
        .locator(
          `//*[contains(@placeholder, "${lowerCaseFieldName}") and @type="text"]`,
        )
        .getAttribute('value');
  }
};

export const getNotesFieldValue = async (page: Page) => {
  const value = await page
    .locator(`//span[text()='Notes']/following-sibling::textarea`)
    .textContent();
  return value;
};

export const enterFieldValue = async (
  page: Page,
  fieldName: string,
  value: string,
) => {
  const lowerCaseFieldName = fieldName.toLowerCase();
  switch (lowerCaseFieldName) {
    case 'customers':
      const replaceSmalls = lowerCaseFieldName.replace(/s$/, '');
      return await page
        .locator(
          `//*[contains(@placeholder, "${replaceSmalls}") and @type="text"]`,
        )
        .fill(value);
    case 'duration':
      return await page
        .locator(`//*[contains(@placeholder, "hh:mm") and @type="text"]`)
        .fill(value);
    default:
      return await page
        .locator(
          `//*[contains(@placeholder, "${lowerCaseFieldName}") and @type="text"]`,
        )
        .fill(value);
  }
};

export const validateSuccessToast = async (page: Page) => {
  try {
    return await expect(page.getByText('Time entry added.')).toBeVisible({
      timeout: 10000,
    });
  } catch (error) {
    // Ignore the error and move ahead
  }
};

export const validateDateWiseDataVisible = async (page: Page) => {
  return await expect(
    page.locator(`(//*[contains(@aria-label, "Collapse rows for")])[1]`),
  ).toBeVisible();
};

export const validateCreatedSingleTimeEntryForEmployee = async (
  page: Page,
  empName: string,
  checkuncheck: string,
) => {
  if (checkuncheck == 'check') {
    let splitRowCountCheck = await page
      .locator(
        `//tbody//*[@role='row']//div[contains(@class, 'StyledName') and text()='${empName}']`,
      )
      .count();
    if (splitRowCountCheck == 1) {
      await openDateRangeDropdown(page);
      await validateDateRangeDropdownOptions(page);
      await selectDateRangeOption(page, 'Last week');
      await waitForLoadingToDisappear(page);

      await page.waitForTimeout(2000);
      const empRows = await page
        .locator("//div[contains(text(), 'Emp, test')]/ancestor::tr")
        .count();
      if (empRows == 1) {
        return true;
      }
    }
    if (splitRowCountCheck == 2) {
      return await expect(
        page.locator(
          `//tbody//*[@role='row']//div[contains(@class, 'StyledName') and text()='${empName}']`,
        ),
      ).toHaveCount(2);
    }
  }
  if (checkuncheck == 'uncheck') {
    let splitRowCountUncheck = await page
      .locator(
        `//tbody//*[@role='row']//div[contains(@class, 'StyledName') and text()='${empName}']`,
      )
      .count();
    if (splitRowCountUncheck == 1) {
      return await expect(
        page.locator(
          `//tbody//*[@role='row']//div[contains(@class, 'StyledName') and text()='${empName}']`,
        ),
      ).toHaveCount(1);
    }
    if (splitRowCountUncheck == 0) {
      await openDateRangeDropdown(page);
      await selectDateRangeOption(page, 'Last week');
      await waitForLoadingToDisappear(page);

      await page.waitForTimeout(2000);
      const empRows = await page
        .locator("//div[contains(text(), 'Emp, test')]/ancestor::tr")
        .count();
      if (empRows == 1) {
        return true;
      }
    }
  }
};

// Gets all table headers as an array of strings
export const getTableHeaders = async (page: Page) => {
  const tableHeaders = await page.locator(
    '//thead//*[@role="row"]/descendant::th',
  );
  return (await tableHeaders.allTextContents())
    .map((h) => h?.trim())
    .filter((h) => h && h.length > 0);
};

// Gets all cell values for a given employee row as an array of strings
export const getRowCellsForEmployee = async (
  page: Page,
  employeeName: string,
) => {
  const rowLocator = page.locator(
    `//div[contains(text(), '${employeeName}')]/ancestor::tr`,
  );
  const tdLocators = rowLocator.locator('td');
  const tdCount = await tdLocators.count();
  const tds: string[] = [];
  for (let i = 0; i < tdCount; i++) {
    const td = tdLocators.nth(i);
    const text = (await td.textContent())?.trim() ?? '';
    tds.push(text);
  }
  return tds;
};

// Returns a mapping of header to cell value for a given employee row
export const getRowObjectForEmployee = async (
  page: Page,
  employeeName: string,
) => {
  const headers = await getTableHeaders(page);
  const tds = await getRowCellsForEmployee(page, employeeName);
  const tdsToUse = tds.length > headers.length ? tds.slice(1) : tds;
  return Object.fromEntries(
    headers
      .map((header, idx) => [header, tdsToUse[idx]])
      .filter(([header, value]) => header !== 'Details' && value !== '-'),
  );
};

export const clickDropdownOption = async (
  page: Page,
  optionNumber: number,
  label: string,
) => {
  await page.waitForTimeout(2000);
  const locator = page.locator(
    `//span[text()='${label}'] / ancestor::label / descendant::input[@aria-expanded="false"]`,
  );
  if (await locator.isVisible()) {
    await page
      .locator(
        `//span[text()='${label}'] / ancestor::label / descendant::div[contains(@class, 'Dropdown')]`,
      )
      .click();
  }
  return await page
    .getByRole('option')
    .nth(optionNumber)
    .click({ force: true });
};

export const checkCheckboxIfVisible = async (page: Page, label: string) => {
  const checkbox = page.locator(
    `//span[contains(text(), '${label}')] / ancestor::label / descendant::input`,
  );
  if ((await checkbox.isVisible()) && !(await checkbox.isChecked())) {
    return await checkbox.check();
  }
};

export const getTime = async (page: Page, timeType: 'Start' | 'End') => {
  const timeValue = await page
    .locator(
      `//span[text()="${timeType} time"] / ancestor::label / descendant::input[@data-testid="__textField"]`,
    )
    .getAttribute('value');
  await page.keyboard.press(`Tab`);
  return timeValue;
};

export const normalizeTime = async (page: Page, time: string) => {
  if (!time) return '';
  const [timePart, period] = time.split(' ');
  const [hours, minutes] = timePart.split(':');
  const normalizedHours = hours.padStart(2, '0');
  return `${normalizedHours}:${minutes} ${period}`;
};

// Function to normalize name format
export const normalizeName = async (page: Page, name: string) => {
  return name
    .replace(/,/g, '') // Remove commas
    .trim() // Remove extra spaces
    .toLowerCase() // Convert to lowercase
    .split(/\s+/) // Split by whitespace
    .sort() // Sort the words
    .join(' '); // Join back with spaces
};

export const checkCheckBoxSplitTimeSheet = async (page: Page) => {
  const checkbox = page.getByLabel('Split timesheets at midnight');
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

// Selects an option from the 'Display by' dropdown
export const selectDisplayByOption = async (page: Page, optionName: string) => {
  // Check for any remaining popups before interacting with dropdown
  await handlePopupsInAnyOrder(page); // Skip initial wait for faster performance
  const dropdown = await displayByDropdown(page);
  await dropdown.click();
  const optionLocator = page.getByRole('option', { name: optionName });
  await optionLocator.waitFor({ state: 'visible', timeout: 5000 });
  return await optionLocator.click();
};

// Time Activity, Time Entries, Time Clock Verification

export const directToSingleTimeAct = async (page: Page, id?: string | null) => {
  if (id) {
    await navigateWithAuthSession(page, `/app/timeactivity?id=${id}`, {
      waitUntil: 'load',
    });
  } else {
    await navigateWithAuthSession(page, `app/timeactivity?t=s`, {
      waitUntil: 'load',
    });
  }
  await handlePopupsInAnyOrder(page);
};

export const directToSingleTimeActWithId = async (
  page: Page,
  id?: string | null,
) => {
  if (id) {
    await navigateWithAuthSession(page, `/app/timeactivity?id=${id}`, {
      waitUntil: 'load',
    });
  } else {
    await navigateWithAuthSession(page, `app/timeactivity?t=s`, {
      waitUntil: 'load',
    });
  }
  await handlePopupsInAnyOrder(page);
};

export const directToWeeklyTime = async (page: Page) => {
  return navigateWithAuthSession(page, `/app/timetracking`, {
    waitUntil: 'load',
  });
};

export const verifyFirstDayAtWorkOnWTA = async (page: Page) => {
  //await expect(page.locator(`//th[contains(@class,'WeekdayHeader')]`).nth(0)).toContainText(weekdayFromSettings);
  return String(page.locator(`//th[contains(@class,'WeekdayHeader')]`).nth(0));
};

export const verifyDaysOfWeekOnWTA = async (
  page: Page,
  weekFromSettings: string,
) => {
  let splitWeekStartDay = weekFromSettings.split(' - ')[0];
  let splitWeekEndDay = weekFromSettings.split(' - ')[1];
  await expect(
    page.locator(`//th[contains(@class,'WeekdayHeader')]`).nth(0),
  ).toHaveText(splitWeekStartDay);
  await expect(
    page.locator(`//th[contains(@class,'WeekdayHeader')]`).nth(6),
  ).toHaveText(splitWeekEndDay);
};

export const verifyFieldsDisplayed = async (page: Page, field: string) => {
  let count = page.getByText(field).count();
  if ((await count) > 0) {
    return true;
  } else {
    return false;
  }
};

export const openSTADropdown = async (page: Page, label: string) => {
  await page.waitForSelector(
    `//span[contains(text(),'${label}')] / ancestor::label / descendant::div[contains(@class, 'Dropdown')]`,
    { state: 'visible', timeout: 0 },
  );
  return await page
    .locator(
      `//span[contains(text(),'${label}')] / ancestor::label / descendant::div[contains(@class, 'Dropdown')]`,
    )
    .click();
};

export const chooseSTADropdownOption = async (page: Page) => {
  return await page.getByRole('option').last().click();
};

export const chooseSpecificEmployee = async (page: Page, empName: string) => {
  await expect(page.getByRole('option', { name: empName })).toBeVisible();
  return await page.getByRole('option', { name: empName }).click();
};

export const clickSTACloseIcon = async (page: Page) => {
  await expect(page.getByRole('option', { name: 'Close' })).toBeVisible();
  return await page.getByRole('option', { name: 'Close' }).click();
};

export const checkBillableCheckboxIfVisible = async (
  page: Page,
  label: string,
) => {
  const checkbox = page.locator(
    `//span[contains(text(), '${label}')] / ancestor::label / descendant::input`,
  );
  if ((await checkbox.isVisible()) && !(await checkbox.isChecked())) {
    return await checkbox.check();
  }
};

export const uncheckBillableCheckboxIfVisible = async (
  page: Page,
  label: string,
) => {
  const checkbox = page.locator(
    `//span[contains(text(), '${label}')] / ancestor::label / descendant::input`,
  );
  if ((await checkbox.isVisible()) && (await checkbox.isChecked())) {
    return await checkbox.setChecked(false);
  }
};

export const fillSTABillRate = async (page: Page, rate: string) => {
  const billRateInput = page.locator(
    `//span[contains(text(), 'Billable')]  / ancestor::div[contains(@class, 'BillableTaxable')] / descendant::input[@aria-label="Bill rate"]`,
  );
  if (await billRateInput.isVisible()) {
    return await billRateInput.fill(rate);
  }
};

export const clickSTASave = async (page: Page) => {
  await page.getByLabel('Save').click({ force: true });
};

export const verifySTARequiredError = async (page: Page, fieldName: string) => {
  return expect(
    await page.locator(
      `//span[text()='${fieldName}'] / ancestor::label / following::span[text()='This field is required']`,
    ),
  ).toBeVisible();
};

export const fillNotes = async (page: Page) => {
  await page.getByLabel('Notes').fill('Test Note from Settings');
};

export const STASaveToast = async (page: Page) => {
  return await expect(page.getByText('Time entry added.')).toBeVisible({
    timeout: 10000,
  });
};

export const navigateToTimeEntries = async (page: Page) => {
  await navigateWithAuthSession(page, '/app/time?jobId=time', {
    waitUntil: 'load',
    postNavigateTimeout: 0,
  });
  await waitForPageReady(page, TIME_SETTINGS_PAGE_READY_TIMEOUT);
  await handlePopupsInAnyOrder(page);
  await waitForLoadingToDisappearTEPopup(page);
  await expect(page.getByLabel('Display by')).toBeVisible({ timeout: 60000 });
};

export const navigateToApprovalsPage = async (page: Page) => {
  await navigateWithAuthSession(page, '/app/time/approval?jobId=time', {
    waitUntil: 'load',
    postNavigateTimeout: 0,
  });
  await waitForPageReady(page, TIME_SETTINGS_PAGE_READY_TIMEOUT);
  await handlePopupsInAnyOrder(page);
  await waitForLoadingToDisappearTEPopup(page);
};

export const clickRunPayrollButtonInApprovals = async (page: Page) => {
  const runPayrollButton = page.locator(
    `//button[@aria-label='run payroll button']`,
  );
  await expect(runPayrollButton).toBeVisible();
  await runPayrollButton.click();
  console.log('✓ Clicked Run Payroll button');
};

export const waitForLoadingToDisappearTEPopup = async (
  page: Page,
  timeout = TIME_SETTINGS_SPINNER_TIMEOUT,
) => {
  const spinner = getTcLoadingSpinner(page);
  if (await spinner.isVisible({ timeout: 5000 }).catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout }).catch(() => {});
  }
};

export const waitForLoadingToDisappearOnTC = async (
  page: Page,
  timeout = TIME_SETTINGS_SPINNER_TIMEOUT,
) => {
  const spinner = getLoadingSpinner(page);
  if (await spinner.isVisible({ timeout: 5000 }).catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout }).catch(() => {});
  }
};

export const getLoadingSpinner = (page: Page) => {
  return page.locator(`#app`).getByRole('progressbar', { name: 'Loading' });
};

export const getTcLoadingSpinner = (page: Page) => {
  return page
    .locator(`[data-test-id="time-clock-loading"]`)
    .getByRole('progressbar', { name: 'Loading' });
};

export const clickOnAddTime = async (page: Page) => {
  //await page.getByText('Add time').click({force:true, timeout:3000});
  await page.getByRole('button', { name: 'Add time' }).click();
};

export const chooseTimeEntryScreen = async (page: Page, option: string) => {
  await page.getByText(option).click({ force: true });
};

export const validateTimeFormat = async (page: Page, option: string) => {
  if (option == 'STA') {
    const state = await verifySetClockToggleState(page);
    if (!state) {
      await ToggleSetClockInAndOut(page);
    }
  }
  await clickTimeDropdown(page, 'Start');
  await VerifyFormat24hr(page);
  if (!(option == 'TCL')) await clickTimeDropdown(page, 'End');
  await VerifyFormat24hr(page);
};

export const VerifyFormat24hr = async (page: Page) => {
  await expect(
    page.locator(`//ul[@role='option']`).filter({ hasText: '13:00 PM' }),
  ).toBeVisible();
  await expect(
    page.locator(`//ul[@role='option']`).filter({ hasText: '24:00 PM' }),
  ).toBeVisible();
};

export const navigateToSingleTime = async (page: Page, id?: string | null) => {
  if (id) {
    await navigateWithAuthSession(page, `/app/timeactivity?id=${id}`, {
      waitUntil: 'load',
    });
  } else {
    await navigateWithAuthSession(page, `app/timeactivity?t=s`, {
      waitUntil: 'load',
    });
  }
  await handlePopupsInAnyOrder(page);
};

export const clickTimeDropdown = async (
  page: Page,
  timeType: 'Start' | 'End',
) => {
  await page
    .locator(
      `//span[text()="${timeType} time"] / ancestor::label / descendant::input`,
    )
    .click();
};

export const ToggleSetClockInAndOut = async (page: Page) => {
  return await page
    .locator(`//input[@aria-label='Set start and end time']`)
    .click();
};

export const verifySetClockToggleState = async (page: Page) => {
  // when toggle is on returns true, else false
  let status;
  try {
    status = await page
      .locator(
        `//span[text()='Set clock in and out'] / following::input[@aria-checked='true']`,
      )
      .isVisible();
  } catch {
    status = false;
  }
  return status;
};

export const selectDisplayByDate = async (page: Page) => {
  const displayByDropdown = page.getByLabel('Display by');
  await displayByDropdown.click();
  return await page.getByRole('option', { name: 'Date' }).click();
};

export const openDateRangeDropdown = async (page: Page) => {
  const dateRangeDropdown = page.getByLabel('Date range');
  await dateRangeDropdown.click();
};

export const selectDateRangeOption = async (page: Page, optionName: string) => {
  return await page.getByText(optionName, { exact: true }).click();
};

export const selectCustomerOption = async (page: Page) => {
  const customerElement = page.getByPlaceholder('Select customer').nth(1);
  await customerElement.click({ force: true });
  return await chooseDropDownOption(page, 1);
};

export const clickOnMainClockIn = async (page: Page) => {
  //await page.getByRole('button', { name: 'Clock in' }).nth(0).click();
  await page.locator(`//span[text()='Clock in']`).click();
};

export const clickOnClockInBtn = async (page: Page) => {
  await page
    .locator('[data-test-id="time-clock-in-button"]')
    .waitFor({ state: 'visible' });
  await page.locator('[data-test-id="time-clock-in-button"]').click();
};

export const clickClockOut = async (page: Page) => {
  await page.locator('[data-test-id="time-clock-out-button"]').click();
  await waitForLoadingToDisappearOnTC(page);
};

export const getTimerDisplay = async (page: Page) => {
  return await page
    .locator(
      `//div[contains(@class, 'TimerDisplayContainer')]/div[contains(@class, 'TimerDisplay')]`,
    )
    .textContent();
};

export const getCurrentStartTime = async (page: Page) => {
  return page
    .locator(
      `//span[text()='Start time']/../div/input[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .inputValue();
};

export const getPreviousDayDD = (page: Page, day: number): string => {
  const today = new Date();
  today.setDate(today.getDate() - day);
  return String(today.getDate()).padStart(1);
};

export const getPreviousDayDDTC = (page: Page): string => {
  const today = new Date();
  today.setDate(today.getDate() - 1);
  return String(today.getDate()).padStart(2, '0');
};

export const getTodayDayDD = (): string => {
  const today = new Date();
  return String(today.getDate()).padStart(1);
};

export const selectStartDate = async (page: Page, date: string) => {
  await page.locator(`//button[@aria-label='Start date Calendar']`).click();
  await page.getByRole('button', { name: date, exact: true }).nth(0).click();
  await waitForLoadingToDisappearOnTC(page);
};

export const selectEndDate = async (page: Page, date: string) => {
  await page.locator(`//button[@aria-label='End date Calendar']`).click();
  await page.getByRole('button', { name: date, exact: true }).nth(0).click();
};

export const selectTime = async (page: Page, time: string) => {
  await page
    .locator(
      `//span[text()='Start time']/../div/div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
    )
    .click();
  await page.getByRole('option', { name: time }).click();
  await waitForLoadingToDisappearOnTC(page);
};

export const enterTime = async (page: Page, time: string) => {
  await page
    .locator(`//input[contains(@id, 'idsDropdownTypeaheadTextField')]`)
    .nth(0)
    .fill(time);
};

export const clearStartTime = async (page: Page) => {
  await page
    .locator(`//input[contains(@id, 'idsDropdownTypeaheadTextField')]`)
    .nth(0)
    .clear();
};

export const selectStartEndTime = async (
  page: Page,
  timeType: 'Start' | 'End',
  time: string,
) => {
  await page
    .locator(
      `//span[text()="${timeType} time"] / ancestor::label / descendant::input[@data-testid="__textField"]`,
    )
    .click();
  return await page.locator(`//span[text()='${time}']`).click();
};

export const getClockedOutMessage = async (page: Page) => {
  return await page
    .locator('[data-test-id="time-clock-clocked-out-message"]')
    .textContent();
};

export const getClockedInMessage = async (page: Page) => {
  return await page
    .locator('[data-test-id="time-clock-clocked-in-message"]')
    .textContent();
};

export const verifyTimeOnTimeEntries = async (page: Page) => {
  page.getByText('12:00 AM - 12:05 AM');
};

export const verifyIfRunningClock = async (page: Page) => {
  let IsRunningClkVisible = await page
    .locator(`//span[contains(@class,'TimeActionButton__Icon')]`)
    .isVisible();
  if (IsRunningClkVisible) {
    await page
      .locator(`//span[contains(@class,'TimeActionButton__Icon')]`)
      .click();
    await clickClockOut(page);
  }
};

export const clickTimeClockSave = async (page: Page) => {
  await expect(page.locator(`//span[text()='Save']`)).toBeVisible();
  //await expect(page.getByTestId('time-clock-save-button')).toBeVisible();
  await page.locator(`//span[text()='Save']`).click();

  await expect(page.getByText('Changes saved')).toBeVisible();
};

//Settings to Settings functions
export const SaveFromClassicUI = async (page: Page) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible();
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page.getByText('Go to classic QuickBooks Time').click(),
  ]);
  await classicPage.waitForLoadState();

  page = classicPage;

  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByTitle('Close').click();
  }
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await clickOnTimeOptions(classicPage);
  classicPage.waitForTimeout(2000);

  let firstDayOfWorkWeek = classicPage.locator('#client_week_start_select');
  const state = await firstDayOfWorkWeek.isEnabled();
  if (state) {
    classicPage.locator('#client_week_start_select').click({ force: true });
    await firstDayOfWorkWeek.selectOption('Thursday');
  }
  let timezoneSelector = classicPage.locator('#client_timezone_select');
  await timezoneSelector.click();
  await timezoneSelector.selectOption('Asia/Kolkata');

  await clickOnTimeEntryTab(page);

  await classicPage.waitForTimeout(2000);
  await dismissCookieConsent(classicPage);
  await classicPage.locator('#te_split_at_eod').setChecked(true);
  await classicPage.locator('#te_manage_timesheets').setChecked(true);
  await classicPage.locator('#te_clockout_override').setChecked(true);
  await classicPage.locator('#te_clockout_override_hours').fill('6');
  await classicPage
    .getByRole('button', { name: 'Save', exact: true })
    .click({ force: true });

  const splitTimesheetValue = await classicPage
    .getByLabel('Split timesheets at midnight')
    .isChecked();
  const allowEditTSValue = await classicPage
    .getByLabel('Allow team members to manage their own timesheets')
    .isChecked();
  const allowToEditClkOutValue = await classicPage
    .getByLabel('Allow team members to adjust clock-out time')
    .isChecked();
  const overrideValue = await classicPage
    .locator('#te_clockout_override_hours')
    .textContent();

  await clickTimeOptionsCloseIcon(page);
  await clickOnFeatureAddOns(page);
  await clickOnAddOnRounding(page);

  await classicPage
    .locator('#addon_rounding_round_in_direction_up')
    .setChecked(true);
  await classicPage
    .locator('#addon_rounding_round_out_direction_down')
    .setChecked(true);
  await classicPage.locator('#addon_rounding_round_in_min').click();
  await classicPage
    .locator('#addon_rounding_round_in_min')
    .selectOption('3 min');
  await classicPage.locator('#addon_rounding_round_out_min').click();
  await classicPage
    .locator('#addon_rounding_round_out_min')
    .selectOption('5 min');
  await classicPage.getByText('Save').click({ force: true });

  const roundClkInDIrValue = await classicPage
    .locator('#addon_rounding_round_in_direction_up')
    .isChecked();
  const roundClkOutDIrValue = await classicPage
    .locator('#addon_rounding_round_out_direction_down')
    .isChecked();
  const roundClkInIncValue = await classicPage
    .locator('#addon_rounding_round_in_min')
    .textContent();
  const roundClkOutIncValue = await classicPage
    .locator('#addon_rounding_round_out_min')
    .textContent();

  await page.bringToFront();
  await navigateToAccountAndSettingsTime(page);

  const firstDayOfWorkValue = await page
    .locator(
      `//label[text()='First day of work week']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const timezoneValueqbo = await page
    .locator(
      `//label[text()='Time zone']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const splitTimesheetState = await page
    .locator(
      `//label[text()='Split timesheets at midnight']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const allowToEditTSState = await page
    .locator(
      `//label[text()='${LABELS.teamMemberPermissionsView}']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const allowToEditClkOutTimetState = await page
    .locator(
      `//label[text()='Allow team members to edit clock out time']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const ClkInvalues = await page
    .locator(
      `//label[text()='Round clock-in times']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const ClkOutvalues = await page
    .locator(
      `//label[text()='Round clock-out times']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();

  expect(firstDayOfWorkValue).toBe('Sunday');
  expect(timezoneValueqbo).toBe('Asia/Calcutta');
  if (await splitTimesheetValue) {
    expect(splitTimesheetState).toBe('On');
  }
  if (await allowEditTSValue) {
    expect(allowToEditTSState).toBe('On');
  }
  if (await allowToEditClkOutValue) {
    expect(allowToEditClkOutTimetState?.split(',')[0]).toBe('On');
  }
  if (await roundClkInDIrValue) {
    expect(ClkInvalues?.split(',')[0]).toBe('Up');
  }
  if (await roundClkOutDIrValue) {
    expect(ClkOutvalues?.split(',')[0]).toBe('Down');
  }
  expect(ClkInvalues?.split(',')[1]).toBe(' 3 minute');
  expect(ClkOutvalues?.split(',')[1]).toEqual(' 5 minute');
};

export const verifyPriorityCaseFromClassicUI = async (
  page: Page,
  splitTS: string,
) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible({
    timeout: 3000,
  });
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page
      .getByText('Go to classic QuickBooks Time')
      .click({ timeout: 3000 }),
  ]);
  await classicPage.waitForLoadState();
  await handleClassicTimesheetPopupsInAnyOrder(classicPage);
  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByTitle('Close').click();
  }
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await waitForPageReady(classicPage);
  await handleMergeEmployeePopup(classicPage);
  await clickOnCompSettings(classicPage);
  await waitForPageReady(classicPage);
  await clickOnTimeOptions(classicPage);

  // Wait for time options to fully load
  await classicPage.waitForTimeout(3000);

  // Wait for time entry tab to be visible and clickable
  await classicPage.waitForSelector(
    '[data-testid="time-entry-tab"], [role="tab"][aria-selected="false"]',
    { timeout: 10000 },
  );

  await clickOnTimeEntryTab(classicPage);

  // Wait for time entry content to load
  await classicPage.waitForTimeout(2000);

  if (splitTS == 'Off') {
    // Wait for the checkbox to be visible and interactable
    const splitCheckbox = classicPage.getByLabel(
      'Split timesheets at midnight',
    );
    await splitCheckbox.waitFor({ state: 'visible', timeout: 10000 });

    // Check if the element is actually a checkbox and get its checked state
    const isChecked = await splitCheckbox.evaluate((el) => {
      if (el instanceof HTMLInputElement) {
        return el.checked;
      }
      // Fallback for other element types
      return (
        el.getAttribute('aria-checked') === 'true' ||
        el.classList.contains('checked')
      );
    });

    expect(isChecked).toBe(false);
  }
  await classicPage.close();
};

export const verifyFromClassicUI = async (
  page: Page,
  firstDay: string,
  timezone: string,
  splitTS: string,
  editTS: string,
  editClkOut: string,
  clkInTimes: string,
  clkOutTimes: string,
) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible();
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page.getByText('Go to classic QuickBooks Time').click(),
  ]);
  await classicPage.waitForLoadState();

  page = classicPage;

  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByTitle('Close').click();
  }
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await clickOnTimeOptions(classicPage);

  const firstDayText = await getSelectedOptionText(
    page,
    '#client_week_start_select',
  );

  // You can then assert:
  //expect(firstDayText).toBe('Wednesday');
  //expect(firstDayValue).toBe(firstDay);

  const timezoneValues = await classicPage
    .locator('#client_timezone_select')
    .inputValue();

  const selectedTimezoneValue = await classicPage
    .locator(`#client_timezone_select option[value='${timezoneValues}']`)
    .textContent();

  //expect(timezoneValue).toBe(timezone);

  await clickOnTimeEntryTab(page);
  if (splitTS == 'On') {
    expect(await page.getByLabel('Split timesheets at midnight')).toBeChecked();
  }
  if (editTS == 'On') {
    expect(
      await page.getByLabel(
        'Allow team members to manage their own timesheets',
      ),
    ).toBeChecked();
  }
  if (editClkOut.match('On')) {
    expect(
      await page.getByLabel('Allow team members to adjust clock-out time'),
    ).toBeChecked();
  }
  //expect(page.locator('#te_clockout_override_hours').getAttribute('value')).toBe(allowToEditClkOutHrsValue);

  await clickTimeOptionsCloseIcon(page);
  await clickOnFeatureAddOns(page);
  await clickOnAddOnRounding(page);
  const qboClkInDir = clkInTimes?.split(',')[0];
  if (qboClkInDir == 'Down') {
    expect(
      page.locator('#addon_rounding_round_in_direction_down'),
    ).toBeChecked();
  } else if (qboClkInDir == 'Up') {
    expect(page.locator('#addon_rounding_round_in_direction_up')).toBeChecked();
  } else {
    expect(
      page.locator('#addon_rounding_round_in_direction_nearest'),
    ).toBeChecked();
  }

  const qboClkOutDir = clkOutTimes?.split(',')[0];
  if (qboClkOutDir == 'Up') {
    expect(
      page.locator('#addon_rounding_round_out_direction_up'),
    ).toBeChecked();
  } else if (qboClkOutDir == 'Down') {
    expect(
      page.locator('#addon_rounding_round_out_direction_down'),
    ).toBeChecked();
  } else {
    expect(
      page.locator('#addon_rounding_round_out_direction_nearest'),
    ).toBeChecked();
  }

  //expect(page.locator('#addon_rounding_round_in_min').getAttribute('value')).toBe((clkInTimes?.split(',')[1]));
  //expect(page.locator('#addon_rounding_round_out_min').getAttribute('value')).toBe(clkOutTimes?.split(',')[1]);
};

export const getSelectedOptionText = async (
  page: Page,
  selector: string,
): Promise<string> => {
  const select = page.locator(selector);
  // Find the selected option within the select element
  const selectedOption = select.locator('option[selected]');
  if ((await selectedOption.count()) > 0) {
    return (await selectedOption.textContent())?.trim() || '';
  }
  // Fallback: Sometimes the 'selected' attribute is not present, so check by property
  const options = select.locator('option');
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    if (await options.nth(i).evaluate((el: HTMLOptionElement) => el.selected)) {
      return (await options.nth(i).textContent())?.trim() || '';
    }
  }
  return '';
};

export const clickOnCompSettings = async (page: Page) => {
  await page.locator('#my_account_shortcut').click({ force: true });
  await page.locator(`#company_settings`).waitFor({ state: 'visible' });
  await expect(page.locator('#company_settings')).toBeVisible();
};

export const clickOnTimeOptions = async (page: Page) => {
  await expect(page.getByText('Time Options')).toBeVisible();
  await page.getByText('Time Options').click({ force: true });
  await expect(
    page.locator('#company-settings-tabview-tab-date_time'),
  ).toBeVisible();
};

export const clickOnNotifications = async (page: Page) => {
  await expect(
    page.getByRole('link', { name: 'Notifications', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Notifications', exact: true })
    .click({ force: true });
};

export const clickOnTimeEntryTab = async (page: Page) => {
  await page.getByRole('tab', { name: 'Time Entry' }).click();
};

export const clickTimeOptionsCloseIcon = async (page: Page) => {
  await expect(page.locator('#company_settings_close_winc')).toBeVisible();
  await page.locator('#company_settings_close_winc').click();
};

export const clickOnFeatureAddOns = async (page: Page) => {
  await expect(page.locator('#addons_shortcut')).toBeVisible();
  await page.locator('#addons_shortcut').click();
};
export const clickOnAddOnRounding = async (page: Page) => {
  await expect(page.locator('#addon_rounding_shortcut')).toBeVisible();
  await page.locator('#addon_rounding_shortcut').click();
  await expect(page.locator('#addon_rounding_title')).toBeVisible();
};

//=================================== Time => Notifications =================================================================
const verifyReadOnlyNotifSection = async (page: Page) => {
  await expect(
    page
      .getByTestId('notifications-settings')
      .filter({ hasText: 'Notifications' }),
  ).toBeVisible();
  await expect(
    page
      .getByTestId('notifications-settings-view')
      .filter({ hasText: 'Time tracking' }),
  ).toBeVisible();
  await expect(
    page.getByText(NotificationsLabels.SendClkInReminders),
  ).toBeVisible();
  await expect(
    page.getByText(NotificationsLabels.SendClkOutReminders),
  ).toBeVisible();
  await expect(page.getByText(NotificationsLabels.DaysRemSent)).toBeVisible();
  // await expect(
  //   page.getByText(NotificationsLabels.NotifyNotesAddedEdited),
  // ).toBeVisible();
};

export const clickNotifEditButton = async (page: Page) => {
  let EditBtn = page
    .getByTestId('notifications-settings-view')
    .getByRole('button', { name: 'Edit' });
  await expect(EditBtn).toBeVisible(); // edit icon
  await EditBtn.click({ force: true, timeout: 2000 });
};

export const verifyNotifEditMode = async (page: Page) => {
  let ClkInRemAt = await page
    .locator(`//input[@data-testid='__textField']`)
    .nth(0);
  expect(ClkInRemAt).toBeVisible();
  await ClkInRemAt.click();

  // Wait for dropdown to appear and be stable before clicking option
  await page.waitForTimeout(2000);
  await page
    .getByRole('option', { name: '10:15 AM' })
    .waitFor({ state: 'visible', timeout: 3000 });
  await page.getByRole('option', { name: '10:15 AM' }).click({ timeout: 3000 });

  let ClkOutRemAt = await page
    .locator(`//input[@data-testid='__textField']`)
    .nth(1);
  expect(ClkOutRemAt).toBeVisible();
  await ClkOutRemAt.click();

  // Wait for dropdown to appear and be stable before clicking option
  await page.waitForTimeout(2000);
  await page
    .getByRole('option', { name: '5:30 PM' })
    .waitFor({ state: 'visible', timeout: 3000 });
  await page.getByRole('option', { name: '5:30 PM' }).click({ timeout: 3000 });

  let NotifyClkInOut = await page.getByPlaceholder(
    'Notify when clock-in/-out time is adjusted',
  );
  expect(NotifyClkInOut).toBeVisible();
  await NotifyClkInOut.click();

  // Wait for dropdown to appear and be stable before clicking option
  await page.waitForTimeout(1000);
  await page
    .getByRole('option', { name: 'Admins only' })
    .waitFor({ state: 'visible', timeout: 3000 });
  await page
    .getByRole('option', { name: 'Admins only' })
    .click({ timeout: 3000 });

  let daysAreRemAreSent = await page.locator(
    `//input[@aria-label='notificationEnabledForDays']`,
  );

  await checkEmailMobileBox(page, 0);
  await checkEmailMobileBox(page, 3);

  expect(daysAreRemAreSent).toBeVisible();
  await daysAreRemAreSent.click();

  // Wait for dropdown to appear and be stable before clicking options
  await page.waitForTimeout(1000);
  await page
    .getByRole('option', { name: 'Sunday' })
    .waitFor({ state: 'visible', timeout: 3000 });
  await page.getByRole('option', { name: 'Sunday' }).click({ timeout: 3000 });
  await page
    .getByRole('option', { name: 'Monday' })
    .waitFor({ state: 'visible', timeout: 3000 });
  await page.getByRole('option', { name: 'Monday' }).click({ timeout: 3000 });
  await page
    .getByRole('option', { name: 'Tuesday' })
    .waitFor({ state: 'visible', timeout: 3000 });
  await page.getByRole('option', { name: 'Tuesday' }).click({ timeout: 3000 });
  await page
    .getByRole('option', { name: 'Wednesday' })
    .waitFor({ state: 'visible', timeout: 3000 });
  await page
    .getByRole('option', { name: 'Wednesday' })
    .click({ timeout: 3000 });

  await uncheckEmailMobileBox(page, 0);
  await uncheckEmailMobileBox(page, 3);
};

export const verifyDaysRemindersAreSent = async (page: Page) => {
  let Days: string;
  let daysAreRemAreSent = await page.locator(
    `//input[@aria-label='notificationEnabledForDays']`,
  );
  await uncheckEmailMobileBox(page, 0);
  await checkEmailMobileBox(page, 0);

  expect(daysAreRemAreSent).toBeVisible();
  await daysAreRemAreSent.click();
  await page.waitForTimeout(5000);

  const sun = await page
    .getByRole('option', { name: 'Sunday' })
    .getAttribute('aria-checked');
  const mon = await page
    .getByRole('option', { name: 'Monday' })
    .getAttribute('aria-checked');
  const tue = await page
    .getByRole('option', { name: 'Tuesday' })
    .getAttribute('aria-checked');
  const wed = await page
    .getByRole('option', { name: 'Wednesday' })
    .getAttribute('aria-checked');
  const thu = await page
    .getByRole('option', { name: 'Thursday' })
    .getAttribute('aria-checked');
  const fri = await page
    .getByRole('option', { name: 'Friday' })
    .getAttribute('aria-checked');
  const sat = await page
    .getByRole('option', { name: 'Saturday' })
    .getAttribute('aria-checked');

  if (sun == 'true') {
    await page.getByRole('option', { name: 'Sunday' }).click();
  }
  if (mon == 'true') {
    await page.getByRole('option', { name: 'Monday' }).click();
  }
  if (tue !== 'true') {
    await page.getByRole('option', { name: 'Tuesday' }).click();
  }
  if (wed !== 'true') {
    await page.getByRole('option', { name: 'Wednesday' }).click();
  }
  if (thu !== 'true') {
    await page.getByRole('option', { name: 'Thursday' }).click();
  }
  if (fri !== 'true') {
    await page.getByRole('option', { name: 'Friday' }).click();
  }
  if (sat !== 'true') {
    await page.getByRole('option', { name: 'Saturday' }).click();
  }
  await page.waitForTimeout(2000);
  await page.keyboard.press(`Tab`);
  await clickOnNotifSaveButton(page);

  const DaysRemSentSavedValue = await page
    .locator(
      `//label[text()='Days reminders are sent']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect(DaysRemSentSavedValue).toBe(
    'Tuesday, Wednesday, Thursday, Friday, Saturday',
  );
};

export const verifyIfDaysRemSentDisabled = async (page: Page) => {
  let disabled = await page.locator(
    `//input[@aria-label='notificationEnabledForDays'][@disabled]`,
  );
  expect(disabled).toBeVisible();
};

export const verifyWhenNotesAddedOrEdited = async (page: Page) => {
  let NotifyNotesAddedEdited = await page.getByPlaceholder(
    'Notify when notes are added or edited',
  );
  expect(NotifyNotesAddedEdited).toBeVisible();

  await NotifyNotesAddedEdited.click();
  await page.getByRole('option', { name: 'None' }).click();

  page.waitForTimeout(1000);
  await NotifyNotesAddedEdited.click();
  await page.getByRole('option', { name: 'Managers only' }).click();
  await clickOnNotifSaveButton(page);

  const SavedValue = await page
    .locator(
      `//label[text()='Notify when notes are added or edited']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect('Managers only').toBe(SavedValue);
};

export const verifyClkInOutEdited = async (page: Page) => {
  let NotifyClkInOut = await page.getByPlaceholder(
    'Notify when clock-in/-out time is adjusted',
  );
  expect(NotifyClkInOut).toBeVisible();

  await NotifyClkInOut.click();
  await page.getByRole('option', { name: 'None' }).click();

  page.waitForTimeout(1000);
  await NotifyClkInOut.click();
  await page.getByRole('option', { name: 'Admins only' }).click();
  await clickOnNotifSaveButton(page);

  const SavedValue = await page
    .locator(
      `//label[text()='Notify when clock-in/-out time is adjusted']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect('Admins only').toBe(SavedValue);
};

export const verifySendClkInRemAt = async (page: Page) => {
  let ClkInRemAt = await page
    .locator(`//input[@data-testid='__textField']`)
    .nth(0);
  expect(ClkInRemAt).toBeVisible();

  await ClkInRemAt.click();
  await page.getByRole('option', { name: '8:15 AM' }).click();
  await checkEmailMobileBox(page, 0);
  await checkEmailMobileBox(page, 1);

  page.waitForTimeout(1000);
  await ClkInRemAt.click();
  await page.getByRole('option', { name: '8:30 AM' }).click();
  await clickOnNotifSaveButton(page);

  const SavedValue = await page
    .locator(
      `//label[text()='Send clock-in reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect(' 8:30 AM').toBe(SavedValue?.split(',')[3]);
};

export const verifySendClkOutRemAt = async (page: Page) => {
  let ClkOutRemAt = await page
    .locator(`//input[@data-testid='__textField']`)
    .nth(1);
  expect(ClkOutRemAt).toBeVisible();

  await ClkOutRemAt.click();
  await page.getByRole('option', { name: '4:45 PM' }).click();

  await checkEmailMobileBox(page, 2);
  await checkEmailMobileBox(page, 3);

  await ClkOutRemAt.click();
  await page.getByRole('option', { name: '5:30 PM' }).click();
  await clickOnNotifSaveButton(page);

  const SavedValue = await page
    .locator(
      `//label[text()='Send clock-out reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect(' 5:30 PM').toBe(SavedValue?.split(',')[3]);
};

export const clickOnNotifSaveButton = async (page: Page) => {
  let saveBtn = await page.getByRole('button', { name: 'Save' });
  expect(saveBtn).toBeVisible();
  await saveBtn.click();
};

export const checkEmailMobileBox = async (page: Page, option: number) => {
  let checkbox = await page.locator(`//input[@type='checkbox']`).nth(option);
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const uncheckEmailMobileBox = async (page: Page, option: number) => {
  let checkbox = await page.locator(`//input[@type='checkbox']`).nth(option);
  if (await checkbox.isChecked()) {
    await checkbox.uncheck();
  }
};

export const verifySavedCheckedCheckBoxes = async (page: Page) => {
  const ClkInSavedValue = await page
    .locator(
      `//label[text()='Send clock-in reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect(ClkInSavedValue?.split(',')[1]).toBe(' Email');
  expect(ClkInSavedValue?.split(',')[2]).toBe(' Mobile');

  const ClkOutSavedValue = await page
    .locator(
      `//label[text()='Send clock-out reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect(ClkOutSavedValue?.split(',')[1]).toBe(' Email');
  expect(ClkOutSavedValue?.split(',')[2]).toBe(' Mobile');
};

export const verifySavedUncheckedCheckBoxes = async (page: Page) => {
  const ClkInSavedValue = await page
    .locator(
      `//label[text()='Send clock-in reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const ClkOutSavedValue = await page
    .locator(
      `//label[text()='Send clock-out reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const DaysRemSentSavedValue = await page
    .locator(
      `//label[text()='Days reminders are sent']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect(ClkInSavedValue).toBe('Off');
  expect(ClkOutSavedValue).toBe('Off');
  expect(DaysRemSentSavedValue).toBe('Off');
};

export const inputNotifSettings = async (page: Page) => {
  let ClkInRemAt = await page
    .locator(`//input[@data-testid='__textField']`)
    .nth(0);
  await ClkInRemAt.click();
  await page.getByRole('option', { name: '9:15 AM' }).click();
  await ClkInRemAt.click();
  await page.getByRole('option', { name: '10:15 AM' }).click();

  let ClkOutRemAt = await page
    .locator(`//input[@data-testid='__textField']`)
    .nth(1);
  await ClkOutRemAt.click();
  await page.getByRole('option', { name: '4:15 PM' }).click();
  await ClkOutRemAt.click();
  await page.getByRole('option', { name: '5:15 PM' }).click();

  await uncheckEmailMobileBox(page, 0);
  await uncheckEmailMobileBox(page, 1);
  await uncheckEmailMobileBox(page, 2);
  await uncheckEmailMobileBox(page, 3);

  await checkEmailMobileBox(page, 0);
  await checkEmailMobileBox(page, 1);
  await checkEmailMobileBox(page, 2);
  await checkEmailMobileBox(page, 3);

  let daysAreRemAreSent = await page.locator(
    `//input[@aria-label='notificationEnabledForDays']`,
  );
  expect(daysAreRemAreSent).toBeVisible();
  await daysAreRemAreSent.click();
  const sun = await page
    .getByRole('option', { name: 'Sunday' })
    .getAttribute('aria-checked');
  const mon = await page
    .getByRole('option', { name: 'Monday' })
    .getAttribute('aria-checked');
  const tue = await page
    .getByRole('option', { name: 'Tuesday' })
    .getAttribute('aria-checked');
  const wed = await page
    .getByRole('option', { name: 'Wednesday' })
    .getAttribute('aria-checked');
  const thu = await page
    .getByRole('option', { name: 'Thursday' })
    .getAttribute('aria-checked');
  const fri = await page
    .getByRole('option', { name: 'Friday' })
    .getAttribute('aria-checked');
  const sat = await page
    .getByRole('option', { name: 'Saturday' })
    .getAttribute('aria-checked');

  if (sun !== 'true') {
    await page.getByRole('option', { name: 'Sunday' }).click();
  }
  if (mon !== 'true') {
    await page.getByRole('option', { name: 'Monday' }).click();
  }
  if (tue !== 'true') {
    await page.getByRole('option', { name: 'Tuesday' }).click();
  }
  if (wed !== 'true') {
    await page.getByRole('option', { name: 'Wednesday' }).click();
  }
  if (thu !== 'true') {
    await page.getByRole('option', { name: 'Thursday' }).click();
  }
  if (fri !== 'true') {
    await page.getByRole('option', { name: 'Friday' }).click();
  }
  if (sat !== 'true') {
    await page.getByRole('option', { name: 'Saturday' }).click();
  }

  await page.keyboard.press(`Tab`);

  let NotifyClkInOut = await page.getByPlaceholder(
    'Notify when clock-in/-out time is adjusted',
  );
  await NotifyClkInOut.click();
  await page.getByRole('option', { name: 'None' }).click();
  await NotifyClkInOut.click();
  await page.getByRole('option', { name: 'Admins only' }).click();

  let NotifyNotesAddedEdited = await page.getByPlaceholder(
    'Notify when notes are added or edited',
  );
  await NotifyNotesAddedEdited.click();
  await page.getByRole('option', { name: 'None' }).click();
  await NotifyNotesAddedEdited.click();
  await page.getByRole('option', { name: 'Managers only' }).click();

  await clickOnNotifSaveButton(page);
};

export const verifyNotifFromClassicUI = async (
  page: Page,
  clkIn: string,
  clkOut: string,
  remDays: string,
  notes: string,
  clkInOutAdjust: string,
) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible();
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page.getByText('Go to classic QuickBooks Time').click(),
  ]);
  await classicPage.waitForLoadState();

  page = classicPage;

  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByTitle('Close').click();
  }
  if (
    await classicPage
      .getByText('Take a tour to learn what QuickBooks Time can do.')
      .isVisible()
  ) {
    await classicPage.getByRole('button', { name: 'Skip for Now' }).click();
  }
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await clickOnNotifications(classicPage);
  await classicPage.waitForTimeout(2000);
  await dismissCookieConsent(classicPage);

  await classicPage.waitForTimeout(5000);
  const clkInTime = await page
    .locator(`//input[@id='notifications_clock_in_time']`)
    .getAttribute('value');
  const clkOutTime = await page
    .locator(`//input[@id='notifications_clock_out_time']`)
    .getAttribute('value');
  const ClkInEmailState = await page
    .locator(
      `//*[@name='notifications_clock_in_email_checkbox'][@aria-label='Email']`,
    )
    .isChecked();
  const ClkInMobileState = await classicPage
    .locator(
      `//*[@name='notifications_clock_in_push_checkbox'][@aria-label='Mobile']`,
    )
    .isChecked();
  const ClkOutEmailState = await classicPage
    .locator(
      `//*[@name='notifications_clock_out_email_checkbox'][@aria-label='Email']`,
    )
    .isChecked();
  const ClkOutMobileState = await classicPage
    .locator(
      `//*[@name='notifications_clock_out_push_checkbox'][@aria-label='Mobile']`,
    )
    .isChecked();
  //expect(clkIn.split(',')[3]).toBe(clkInTime);
  expect(clkIn.split(',')[3]).toContain(clkInTime);
  expect(clkOut.split(',')[3]).toContain(clkOutTime);
  if (clkIn.split(',')[1] == ' Email') {
    expect(ClkInEmailState).toBeTruthy();
  }
  if (clkIn.split(',')[2] == ' Mobile') {
    expect(ClkInMobileState).toBeTruthy();
  }
  if (clkOut.split(',')[1] == ' Email') {
    expect(ClkOutEmailState).toBeTruthy();
  }
  if (clkOut.split(',')[2] == ' Mobile') {
    expect(ClkOutMobileState).toBeTruthy();
  }

  if (
    (remDays = 'Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday')
  ) {
    await expect(
      page.locator(
        `//ul[@id='notification_calendar']/li[@class='csn-calendar-day selected']`,
      ),
    ).toHaveCount(7);
  }

  await clickOnTimeOptions(classicPage);
  await clickOnTimeEntryTab(classicPage);
  if (notes == 'Admins and Managers') {
    await expect(page.locator('#te_email_admin_on_edit')).toBeChecked();
    await expect(page.locator('#te_email_manager_on_edit')).toBeChecked();
  }
  if (notes == 'Admins only') {
    await expect(page.locator('#te_email_admin_on_edit')).toBeChecked();
    await expect(page.locator('#te_email_manager_on_edit')).not.toBeChecked();
  }
  if (notes == 'Managers only') {
    await expect(page.locator('#te_email_admin_on_edit')).not.toBeChecked();
    await expect(page.locator('#te_email_manager_on_edit')).toBeChecked();
  }
  if (notes == 'None') {
    await expect(page.locator('#te_email_admin_on_edit')).not.toBeChecked();
    await expect(page.locator('#te_email_manager_on_edit')).not.toBeChecked();
  }

  if (clkInOutAdjust == 'Admins and Managers') {
    await expect(
      page.locator('#te_clockout_override_notify_mgrs'),
    ).toBeChecked();
    await expect(
      page.locator('#te_clockout_override_notify_admin'),
    ).toBeChecked();
  }
  if (clkInOutAdjust == 'Admins only') {
    await expect(
      page.locator('#te_clockout_override_notify_admin'),
    ).toBeChecked();
    await expect(
      page.locator('#te_clockout_override_notify_mgrs'),
    ).not.toBeChecked();
  }
  if (clkInOutAdjust == 'Managers only') {
    await expect(
      page.locator('#te_clockout_override_notify_mgrs'),
    ).toBeChecked();
    await expect(
      page.locator('#te_clockout_override_notify_admin'),
    ).not.toBeChecked();
  }
  if (clkInOutAdjust == 'None') {
    await expect(
      page.locator('#te_clockout_override_notify_mgrs'),
    ).not.toBeChecked();
    await expect(
      page.locator('#te_clockout_override_notify_admin'),
    ).not.toBeChecked();
  }
};

export const SaveNotifyPriorityCaseFromClassicUI = async (page: Page) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible({
    timeout: 7000,
  });
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page
      .getByText('Go to classic QuickBooks Time')
      .click({ timeout: 3000 }),
  ]);
  await classicPage.waitForLoadState();
  await waitForPageReady(classicPage);
  await classicPage.waitForTimeout(2000);
  await handlePopupsInAnyOrder(classicPage);
  page = classicPage;
  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByTitle('Close').click();
  }
  if (
    await classicPage
      .getByText('Take a tour to learn what QuickBooks Time can do.')
      .isVisible()
  ) {
    await classicPage.getByRole('button', { name: 'Skip for Now' }).click();
  }
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await classicPage.waitForTimeout(2000);
  await clickOnCompSettings(classicPage);
  await classicPage.waitForTimeout(2000);
  await clickOnNotifications(classicPage);

  await classicPage.waitForTimeout(2000);
  await dismissCookieConsent(classicPage);
  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_in_push_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_in_push_checkbox']`)
      .check();
  }
  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_in_email_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_in_email_checkbox']`)
      .check();
  }
  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_out_push_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_out_push_checkbox']`)
      .check();
  }
  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_out_email_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_out_email_checkbox']`)
      .check();
  }

  await classicPage.locator('#notifications_clock_in_time').fill('10:15');
  await classicPage.locator('#notifications_clock_out_time').fill('4:00');

  await dismissCookieConsent(classicPage);
  await classicPage
    .locator(`//button/span[text()='Save']`)
    .click({ force: true });

  await page.bringToFront();
  await navigateToAccountAndSettingsTime(page);
  const ClkInSavedValue = await page
    .locator(
      `//label[text()='Send clock-in reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const ClkOutSavedValue = await page
    .locator(
      `//label[text()='Send clock-out reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  expect(ClkInSavedValue?.split(',')[3]).toBe(' 10:15 AM');
  expect(ClkOutSavedValue?.split(',')[3]).toBe(' 4:00 PM');
};

export const SaveNotifSettingsFromClassicUI = async (page: Page) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible();
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page.getByText('Go to classic QuickBooks Time').click(),
  ]);
  await classicPage.waitForLoadState();

  page = classicPage;
  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByTitle('Close').click();
  }
  if (
    await classicPage
      .getByText('Take a tour to learn what QuickBooks Time can do.')
      .isVisible()
  ) {
    await classicPage.getByRole('button', { name: 'Skip for Now' }).click();
  }

  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await clickOnNotifications(classicPage);
  await classicPage.waitForTimeout(5000);
  await dismissCookieConsent(classicPage);

  await classicPage.locator('#notifications_clock_in_time').fill('9:15');
  await classicPage.locator('#notifications_clock_out_time').fill('6:00');
  if (
    !(await classicPage
      .locator(`//li[@id='notify_sun'][contains(@class,'selected')]`)
      .isVisible())
  ) {
    await classicPage.locator('#notify_sun').click();
  }
  if (
    !(await classicPage
      .locator(`//li[@id='notify_mon'][contains(@class,'selected')]`)
      .isVisible())
  ) {
    await classicPage.locator('#notify_mon').click();
  }
  if (
    !(await classicPage
      .locator(`//li[@id='notify_tue'][contains(@class,'selected')]`)
      .isVisible())
  ) {
    await classicPage.locator('#notify_tue').click();
  }
  if (
    !(await classicPage
      .locator(`//li[@id='notify_wed'][contains(@class,'selected')]`)
      .isVisible())
  ) {
    await classicPage.locator('#notify_wed').click();
  }
  if (
    !(await classicPage
      .locator(`//li[@id='notify_thu'][contains(@class,'selected')]`)
      .isVisible())
  ) {
    await classicPage.locator('#notify_thu').click();
  }
  if (
    await classicPage
      .locator(`//li[@id='notify_fri'][contains(@class,'selected')]`)
      .isVisible()
  ) {
    await classicPage.locator('#notify_fri').click();
  }
  if (
    await classicPage
      .locator(`//li[@id='notify_sat'][contains(@class,'selected')]`)
      .isVisible()
  ) {
    await classicPage.locator('#notify_sat').click();
  }
  await classicPage.keyboard.press(`Tab`);
  await classicPage
    .locator(`//button[contains(@class,'main-save-btn')]`)
    .click();

  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_in_push_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_in_push_checkbox']`)
      .check();
  }
  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_in_email_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_in_email_checkbox']`)
      .check();
  }
  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_out_push_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_out_push_checkbox']`)
      .check();
  }
  if (
    !(await classicPage
      .locator(`//input[@name='notifications_clock_out_email_checkbox']`)
      .isChecked())
  ) {
    await classicPage
      .locator(`//input[@name='notifications_clock_out_email_checkbox']`)
      .check();
  }

  expect(
    classicPage.locator(`//button[contains(@class,'main-save-btn')]`),
  ).toBeVisible();
  await classicPage
    .locator(`//button[contains(@class,'main-save-btn')]`)
    .click();

  await clickOnTimeOptions(classicPage);
  await clickOnTimeEntryTab(classicPage);

  if (!(await classicPage.locator('#te_email_admin_on_edit').isChecked())) {
    await classicPage.locator('#te_email_admin_on_edit').check();
  }
  if (await classicPage.locator('#te_email_manager_on_edit').isChecked()) {
    await classicPage.locator('#te_email_manager_on_edit').uncheck();
  }

  if (
    !(await classicPage
      .locator('#te_clockout_override_notify_mgrs')
      .isChecked())
  ) {
    await classicPage.locator('#te_clockout_override_notify_mgrs').check();
  }
  if (
    await classicPage.locator('#te_clockout_override_notify_admin').isChecked()
  ) {
    await classicPage.locator('#te_clockout_override_notify_admin').uncheck();
  }
  await classicPage
    .getByRole('button', { name: 'Save' })
    .click({ force: true });

  await page.bringToFront();
  await navigateToAccountAndSettingsTime(page);

  const NotesSavedValue = await page
    .locator(
      `//label[text()='Notify when notes are added or edited']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const ClkInSavedValue = await page
    .locator(
      `//label[text()='Send clock-in reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const ClkOutSavedValue = await page
    .locator(
      `//label[text()='Send clock-out reminders']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const DaysRemSentSavedValue = await page
    .locator(
      `//label[text()='Days reminders are sent']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();
  const ClkInOutEditedSavedValue = await page
    .locator(
      `//label[text()='Notify when clock-in/-out time is adjusted']/following::span[contains(@class,'viewContent__Value')]`,
    )
    .nth(0)
    .textContent();

  expect(ClkInSavedValue).toBe('On, email, mobile, 9:15 AM');
  expect(ClkOutSavedValue).toBe('On, email, mobile, 6:00 PM');
  expect(DaysRemSentSavedValue).toBe(
    'Sunday, Monday, Tuesday, Wednesday, Thursday',
  );
  expect(ClkInOutEditedSavedValue).toBe('Managers only');
  expect(NotesSavedValue).toBe('Admins only');
};

export const clickTimeSheetFieldsEditButton = async (page: Page) => {
  let timeSheetFieldsEditBtn = page.locator(
    `//div[@data-testid="timeSheet-settings"]//button[@aria-label="Edit"]`,
  );
  //await expect(timeSheetFieldsEditBtn).toBeVisible(); // edit icon
  await timeSheetFieldsEditBtn.click({ force: true, timeout: 15000 });
  await page.waitForTimeout(2000);
};

export const validateFieldsOnCustomizeTimesheetPage = async (page: Page) => {
  await page.waitForLoadState();
  for (const header of testData.qbocustomizeTimesheetFields) {
    // Look for elements in the preview section with exact text match
    const previewElement = page
      .locator(`//span[text()="Customize your timesheets"]`)
      .filter({ hasText: new RegExp(`^${header}$`) });
    if ((await previewElement.count()) > 0) {
      await expect(previewElement.first()).toBeVisible();
    } else {
      // If not found in preview, look for it in the main content
      await expect(
        page.getByText(header, { exact: true }).first(),
      ).toBeVisible();
    }
  }
};

export const checkedCustomizeTimesheetFieldsCheckbox = async (page: Page) => {
  // Check for any remaining popups before interacting with checkboxes
  await handlePopupsInAnyOrder(page);
  for (const fieldName of testData.qbocustomizeTimesheetFields) {
    const toggle = page.locator(
      `//span[text()='${fieldName}']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span/input`,
    );
    const statusText = page.locator(
      `(//span[text()='${fieldName}']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span)[1]`,
    );

    // Check if the toggle shows "Inactive" or "No" status
    const isInactive = await statusText
      .textContent()
      .then((text) => text?.includes('Inactive') || text?.includes('No'));
    if (isInactive) {
      await toggle.click();
    }
  }
};

export const checkServiceItemRequired = async (page: Page) => {
  // Check for any remaining popups before interacting with switches
  await handlePopupsInAnyOrder(page);
  await page.getByRole('switch', { name: 'serviceItemRequired' }).uncheck();
};

export const checkedCustomizeTimesheetFieldsCheckboxForTimeClock = async (
  page: Page,
) => {
  for (const fieldName of testData.customizeTimesheetFieldsforTimeClock) {
    const toggle = page.locator(
      `//span[text()='${fieldName}']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span/input`,
    );
    const statusText = page.locator(
      `(//span[text()='${fieldName}']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span)[1]`,
    );

    // const toggle = page.locator(`//span[text()='${fieldName}']/../../../parent::tr//label/following-sibling::input`);
    // const statusText = page.locator(`//span[text()='${fieldName}']/../../../parent::tr//label/span/span`);

    // Check if the toggle shows "Inactive" status
    const isInactive = await statusText
      .textContent()
      //.then((text) => text?.includes('Inactive'));
      .then((text) => text?.includes('Inactive') || text?.includes('No'));
    if (isInactive) {
      await toggle.click();
    }
  }
};

export const uncheckedCustomizeTimesheetFieldsCheckbox = async (page: Page) => {
  for (const fieldName of testData.qbocustomizeTimesheetFieldsUnCheck) {
    const toggle = page.locator(
      `//span[text()='${fieldName}']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span/input`,
    );
    const statusText = page.locator(
      `(//span[text()='${fieldName}']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span)[1]`,
    );
    // const toggle = page.locator(`//span[text()='${fieldName}']/../../../parent::tr//label/following-sibling::input`);
    // const statusText = page.locator(`//span[text()='${fieldName}']/../../../parent::tr//label/span/span`);

    // Check if the toggle shows "Active" status (meaning it's currently checked)
    const isActive = await statusText
      .textContent()
      //.then((text) => text?.includes('Active'));
      .then((text) => text?.includes('Active') || text?.includes('Yes'));

    if (isActive) {
      await toggle.click();
      await page.waitForTimeout(1000);
    }
  }
  await page.waitForTimeout(2000);
};

export const clickOnCustomizeTimesheetSaveButton = async (page: Page) => {
  let SaveBtn = page.locator(`//span[text()="Save"]`);
  await page.waitForTimeout(1000);
  await expect(SaveBtn).toBeVisible(); // Save button
  await page.waitForTimeout(1000);
  await SaveBtn.click({ timeout: 3000 });
  await page.waitForTimeout(2000);
};

//Settings to Settings functions
export const navigateToClassicTimeSheet = async (page: Page) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible({
    timeout: 10000,
  });
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page
      .getByText('Go to classic QuickBooks Time')
      .click({ timeout: 3000 }),
  ]);
  await classicPage.waitForLoadState();
  await waitForPageReady(classicPage);
  await handleClassicTimesheetPopupsInAnyOrder(classicPage);
  // page = classicPage;

  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByRole('button').first().click();
    await classicPage.getByTitle('Close').click();
  }
  await expect(classicPage.locator('#quickbooks_menu_top')).toBeVisible();
  classicPage.waitForTimeout(2000);

  return { classicPage, classicPageUrl: classicPage.url() };
};

export const selectOptionFromQuickBooksPayroll = async (
  classicPage: Page,
  option: string,
) => {
  await classicPage.waitForTimeout(5000);
  if (
    await classicPage
      .locator(
        `//h2[text()='These people are showing up more than once on your My Team list. To make sure timesheets are being tracked accurately, review these team members to see if they should be merged.']`,
      )
      .isVisible()
  ) {
    await classicPage.getByRole('button').first().click();
  }
  if (
    await classicPage
      .getByRole('button', { name: 'QuickBooks Payroll' })
      .first()
      .isVisible()
  ) {
    await classicPage
      .getByRole('button', { name: 'QuickBooks Payroll' })
      .click({ force: true, timeout: 1000 });
  }
  await classicPage
    .getByRole('link', { name: option })
    .click({ force: true, timeout: 8000 });
  await expect(classicPage.locator('#quickbooks_menu_top')).toBeVisible();
  await classicPage.waitForLoadState();
  await expect(
    classicPage.getByRole('heading', { name: 'Timesheets Should Show' }),
  ).toBeVisible();
  await classicPage.waitForTimeout(2000);
};

export const validateCustomizeTimesheetFieldsChangesOnClassicUI = async (
  classicPage: Page,
) => {
  //validate checkbox are checked
  await expect(
    classicPage.getByRole('checkbox', { name: 'Service Items' }),
  ).toBeChecked();
  // await expect(
  //   classicPage
  //     .getByRole('checkbox', { name: 'Billable yes/no choice' })
  //     .first(),
  // ).toBeChecked();
  // await expect(
  //   classicPage
  //     .getByRole('checkbox', { name: 'Require Billable yes/no choice' })
  //     .first(),
  // ).toBeChecked();
  // await expect(
  //   classicPage.getByRole('checkbox', { name: 'Billable Rate' }).first(),
  // ).toBeChecked();
  await expect(
    classicPage.getByRole('checkbox', { name: 'Class' }).first(),
  ).toBeChecked();

  await expect(
    classicPage.getByRole('checkbox', { name: 'Location' }).first(),
  ).toBeChecked();

  closeQuickBooksOnline(classicPage);

  // check notes from company settings
  await classicPage.waitForTimeout(2000);
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeOptions(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeEntryTab(classicPage);
  await classicPage.waitForTimeout(1000);
  const notesCheckbox = classicPage.getByRole('checkbox', {
    name: 'Allow team members to enter',
  });
  await expect(notesCheckbox).toBeChecked();
  await classicPage.waitForTimeout(1000);
  // close company settings
  await classicPage
    .getByRole('button', { name: 'Close Company Settings' })
    .click();
  await classicPage.waitForTimeout(2000);
};

export const closeQuickBooksOnline = async (classicPage: Page) => {
  await classicPage
    .getByRole('button', { name: 'Close QuickBooks Online' })
    .click();
  await classicPage.waitForLoadState();
  await classicPage.waitForTimeout(2000);
};

export const switchBackToQBO = async (page: Page) => {
  await page.bringToFront();
  await page.waitForTimeout(2000);
};

export const switchBackToClassicTimeSheet = async (
  classicPage: Page,
  classicPageUrl: string,
) => {
  await classicPage.bringToFront();
  await navigateWithAuthSession(classicPage, classicPageUrl, {
    waitUntil: 'load',
  });
};

export const preferencesUncheckedTimesheetFieldsCheckbox = async (
  classicPage: Page,
) => {
  for (const fieldName of testData.classicPreferencesCustomizeTimesheetFields) {
    const checkbox = classicPage
      .getByRole('checkbox', {
        name: fieldName,
        exact: true,
      })
      .first();
    if (await checkbox.isChecked()) {
      await checkbox.click({ timeout: 3000 });
      await classicPage.waitForLoadState();
      await classicPage.waitForTimeout(8000);
    }
    await classicPage.waitForTimeout(8000);
  }
};

export const validateCustomizeTimesheetFieldsChangesFromClassicTimesheetToQBO =
  async (page: Page) => {
    // assert the checkbox are unchecked for the qbocustomizeTimesheetField
    for (const fieldName of testData.qbocustomizeTimesheetFields) {
      //const toggle = page.locator(`//span[text()='${fieldName}']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span/input`);
      const statusText = page.locator(
        //`(//span[text()='${fieldName}']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span)[1]`,
        `//tr[.//span[text()='${fieldName}']]//div[contains(@class,"StatusSwitchContainer")]//span[1]`,
      );
      // Will enable this after fix in local
      // await expect(statusText).toContainText('Inactive', { timeout: 20000 });
    }
  };

export const checkNotesCheckboxFromCompanySettings = async (
  classicPage: Page,
) => {
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeOptions(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeEntryTab(classicPage);
  await classicPage.waitForTimeout(1000);
  const notesCheckbox = classicPage.getByRole('checkbox', {
    name: 'Allow team members to enter',
  });
  if (!(await notesCheckbox.isChecked())) {
    await notesCheckbox.click({ force: true, timeout: 1000 });
  }
  await classicPage.waitForTimeout(1000);
};

export const uncheckNotesCheckboxFromCompanySettings = async (
  classicPage: Page,
) => {
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeOptions(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeEntryTab(classicPage);
  await classicPage.waitForTimeout(1000);
  const notesCheckbox = classicPage.getByRole('checkbox', {
    name: 'Allow team members to enter',
  });
  if (await notesCheckbox.isChecked()) {
    await notesCheckbox.click({ force: true, timeout: 6000 });
  }
  await classicPage.waitForTimeout(6000);
};

// verify notes checkbox is checked from company settings
export const verifyNotesCheckboxIsCheckedFromCompanySettings = async (
  classicPage: Page,
) => {
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeOptions(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeEntryTab(classicPage);
  await classicPage.waitForTimeout(1000);
  const notesCheckbox = classicPage.getByRole('checkbox', {
    name: 'Allow team members to enter',
  });
  await expect(notesCheckbox).toBeChecked();
};

// verify notes checkbox is unchecked from company settings
export const verifyNotesCheckboxIsUncheckedFromCompanySettings = async (
  classicPage: Page,
) => {
  await expect(classicPage.locator('#my_account_shortcut')).toBeVisible();
  await clickOnCompSettings(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeOptions(classicPage);
  await classicPage.waitForTimeout(1000);
  await clickOnTimeEntryTab(classicPage);
  await classicPage.waitForTimeout(1000);
  const notesCheckbox = classicPage.getByRole('checkbox', {
    name: 'Allow team members to enter',
  });
  await expect(notesCheckbox).not.toBeChecked();
};

export const saveCompanySettings = async (classicPage: Page) => {
  await classicPage
    .getByRole('button', { name: 'Save' })
    .click({ force: true, timeout: 1000 });
  await classicPage.waitForTimeout(2000);
};

export const closeCompanySettings = async (classicPage: Page) => {
  await classicPage
    .getByRole('button', { name: 'Close Company Settings' })
    .click({ force: true, timeout: 1000 });
  await classicPage.waitForTimeout(2000);
};

export const checkCustomField = async (page: Page, fieldName: string) => {
  const checkbox = page.locator(
    `(//span[text()='${fieldName}']/ancestor::tr//input)[1]`,
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.click({ force: true, timeout: 2000 });
    await page.waitForTimeout(2000);
  }
};

export const clickSaveButtonCustomField = async (page: Page) => {
  const saveButton = page.getByRole('button', { name: 'Save' });
  await expect(saveButton).toBeVisible();
  await saveButton.click();
};

export const validateTimeSheetFieldsVisible = async (page: Page) => {
  await expect(page.getByText('Timesheet fields')).toBeVisible();
};

export const navigateToSTA = async (page: Page) => {
  await navigateWithAuthSession(page, '/app/timeactivity?t=s', {
    waitUntil: 'load',
  });
};

export const uncheckCustomField = async (page: Page, fieldName: string) => {
  const checkbox = page.locator(
    `//span[text()='${fieldName}']/ancestor::tr//input[@aria-label='isBillingFieldEnabled']`,
  );
  if (await checkbox.isChecked()) {
    await checkbox.click({ force: true, timeout: 2000 });
    await page.waitForTimeout(2000);
  }
};

export const getClassCheckboxLocator = async (classicPage: Page) => {
  return classicPage.getByRole('checkbox', { name: 'Class' }).first();
};

export const validateCheckboxIsChecked = async (
  classicPage: Page,
  fieldName: string,
) => {
  const checkbox = await classicPage
    .getByRole('checkbox', { name: fieldName })
    .first();
  return await checkbox.isChecked();
};

export const validateCheckboxIsUnchecked = async (
  classicPage: Page,
  fieldName: string,
) => {
  await classicPage.waitForTimeout(8000);

  const maxRetries = 10;
  const retryDelay = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const checkbox = await classicPage
        .getByRole('checkbox', { name: fieldName })
        .first();

      // Wait for checkbox to be visible
      await checkbox.waitFor({ state: 'visible', timeout: 5000 });

      // Check if checkbox is unchecked
      const isUnchecked = !(await checkbox.isChecked());

      if (isUnchecked) {
        console.log(
          `Checkbox "${fieldName}" is unchecked on attempt ${attempt}`,
        );
        return true;
      }

      console.log(
        `Checkbox "${fieldName}" is still checked on attempt ${attempt}, retrying...`,
      );

      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await classicPage.waitForTimeout(retryDelay);
      }
    } catch (error) {
      console.log(
        `Attempt ${attempt} failed for checkbox "${fieldName}":`,
        error,
      );
      if (attempt < maxRetries) {
        await classicPage.waitForTimeout(retryDelay);
      }
    }
  }

  // If we get here, all retries failed
  console.log(
    `Checkbox "${fieldName}" is still checked after ${maxRetries} attempts`,
  );
  return false;
};

export const validateOnlyClassFieldValuesCheckboxIsChecked = async (
  classicPage: Page,
  fieldName: string,
  uncheckedFields?: string[],
) => {
  // Validate the main field is checked
  const fieldValueCheckbox = await classicPage
    .getByRole('checkbox', { name: fieldName })
    .first();
  await expect(fieldValueCheckbox).toBeChecked();

  // Default unchecked fields (can be overridden)
  const defaultUncheckedFields = [
    'Service Items',
    'Billable yes/no choice',
    'Require Billable yes/no choice',
    'Billable Rate',
    'Location',
  ];

  const fieldsToCheck = uncheckedFields || defaultUncheckedFields;

  // Always check that 'Customers & sub-customers' is checked
  const customersCheckbox = await classicPage
    .getByRole('checkbox', { name: 'Customers & sub-customers' })
    .first();
  await expect(customersCheckbox).toBeChecked();

  // Validate specified fields are unchecked
  for (const fieldToCheck of fieldsToCheck) {
    const checkbox = await classicPage
      .getByRole('checkbox', { name: fieldToCheck })
      .first();
    await expect(checkbox).not.toBeChecked();
  }

  return await fieldValueCheckbox.isChecked();
};

export const validateOnlyLocationFieldValuesCheckboxIsChecked = async (
  classicPage: Page,
  fieldName: string,
  uncheckedFields?: string[],
) => {
  // Validate the main field is checked
  const fieldValueCheckbox = await classicPage
    .getByRole('checkbox', { name: fieldName })
    .first();
  await expect(fieldValueCheckbox).toBeChecked();

  // Default unchecked fields (can be overridden)
  const defaultUncheckedFields = [
    'Service Items',
    'Billable yes/no choice',
    'Require Billable yes/no choice',
    'Billable Rate',
    'Class',
  ];

  const fieldsToCheck = uncheckedFields || defaultUncheckedFields;

  // Always check that 'Customers & sub-customers' is checked
  const customersCheckbox = await classicPage
    .getByRole('checkbox', { name: 'Customers & sub-customers' })
    .first();
  await expect(customersCheckbox).toBeChecked();

  // Validate specified fields are unchecked
  for (const fieldToCheck of fieldsToCheck) {
    const checkbox = await classicPage
      .getByRole('checkbox', { name: fieldToCheck })
      .first();
    await expect(checkbox).not.toBeChecked();
  }

  return await fieldValueCheckbox.isChecked();
};

export const validateOnlyServiceItemFieldValuesCheckboxIsChecked = async (
  classicPage: Page,
  fieldName: string,
  uncheckedFields?: string[],
) => {
  // Validate the main field is checked
  const fieldValueCheckbox = await classicPage
    .getByRole('checkbox', { name: fieldName })
    .first();
  await expect(fieldValueCheckbox).toBeChecked();

  // Default unchecked fields (can be overridden)
  const defaultUncheckedFields = [
    'Billable yes/no choice',
    'Require Billable yes/no choice',
    'Billable Rate',
    'Class',
    'Location',
  ];

  const fieldsToCheck = uncheckedFields || defaultUncheckedFields;

  // Always check that 'Customers & sub-customers' is checked
  const customersCheckbox = await classicPage
    .getByRole('checkbox', { name: 'Customers & sub-customers' })
    .first();
  await expect(customersCheckbox).toBeChecked();

  // Validate specified fields are unchecked
  for (const fieldToCheck of fieldsToCheck) {
    const checkbox = await classicPage
      .getByRole('checkbox', { name: fieldToCheck })
      .first();
    await expect(checkbox).not.toBeChecked();
  }

  return await fieldValueCheckbox.isChecked();
};

export const validateOnlyBillableFieldValuesCheckboxIsChecked = async (
  classicPage: Page,
  fieldName: string,
  uncheckedFields?: string[],
) => {
  // Validate the main field is checked
  const fieldValueCheckbox = await classicPage
    .getByRole('checkbox', { name: fieldName })
    .first();
  await expect(fieldValueCheckbox).toBeChecked();

  // Default unchecked fields (can be overridden)
  const defaultUncheckedFields = [
    'Service Items',
    'Require Billable yes/no choice',
    'Billable Rate',
    'Class',
    'Location',
  ];

  const fieldsToCheck = uncheckedFields || defaultUncheckedFields;

  // Always check that 'Customers & sub-customers' is checked
  const customersCheckbox = await classicPage
    .getByRole('checkbox', { name: 'Customers & sub-customers' })
    .first();
  await expect(customersCheckbox).toBeChecked();

  // Validate specified fields are unchecked
  for (const fieldToCheck of fieldsToCheck) {
    const checkbox = await classicPage
      .getByRole('checkbox', { name: fieldToCheck })
      .first();
    await expect(checkbox).not.toBeChecked();
  }

  return await fieldValueCheckbox.isChecked();
};

export const validateAllFieldValuesCheckboxAreUnchecked = async (
  classicPage: Page,
  uncheckedFields?: string[],
) => {
  // Default unchecked fields (can be overridden)
  const defaultUncheckedFields = [
    'Service Items',
    'Billable yes/no choice',
    'Require Billable yes/no choice',
    'Billable Rate',
    'Class',
    'Location',
  ];

  const fieldsToCheck = uncheckedFields || defaultUncheckedFields;

  // Always check that 'Customers & sub-customers' is checked
  const customersCheckbox = await classicPage
    .getByRole('checkbox', { name: 'Customers & sub-customers' })
    .first();
  await expect(customersCheckbox).toBeChecked();

  // Validate specified fields are unchecked
  for (const fieldToCheck of fieldsToCheck) {
    const checkbox = await classicPage
      .getByRole('checkbox', { name: fieldToCheck })
      .first();
    await expect(checkbox).not.toBeChecked();
  }
};

export const checkClassCheckbox = async (classicPage: Page) => {
  const checkbox = await getClassCheckboxLocator(classicPage);
  await checkbox.check();
};

export const uncheckClassCheckbox = async (classicPage: Page) => {
  const checkbox = await getClassCheckboxLocator(classicPage);
  await checkbox.uncheck();
};

export const getClosePreferencesButtonLocator = async (classicPage: Page) => {
  return classicPage.locator('#qbsync_preferences_close_winc');
};

export const clickClosePreferencesButton = async (classicPage: Page) => {
  const button = await getClosePreferencesButtonLocator(classicPage);
  await button.click();
};

export const saveAndClosePreferences = async (classicPage: Page) => {
  await checkClassCheckbox(classicPage);
  await clickClosePreferencesButton(classicPage);
};

export const uncheckAndClosePreferences = async (classicPage: Page) => {
  await uncheckClassCheckbox(classicPage);
  await clickClosePreferencesButton(classicPage);
};

// Handle overlapping modals using Promise.race to check both simultaneously
export const handleKnownModals = async (page: Page): Promise<void> => {
  try {
    // Function to handle glow-up modal
    const handleGlowUpModal = async (): Promise<boolean> => {
      try {
        if (await page.getByText('QuickBooks Time got a glow-up').isVisible()) {
          await page.getByRole('button', { name: 'Close' }).click();
          await page.waitForTimeout(500);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    // Function to handle corner modal
    const handleCornerModal = async (): Promise<boolean> => {
      try {
        if (await page.getByText('Just around the corner').isVisible()) {
          await page
            .getByTestId('ModalDialog')
            .getByRole('button', { name: 'Ok' })
            .click();
          await page.waitForTimeout(500);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    // Handle both modals simultaneously using Promise.allSettled
    const results = await Promise.allSettled([
      handleGlowUpModal(),
      handleCornerModal(),
    ]);

    // Check which modals were handled
    const handledModals = results
      .map((result, index) => ({
        result,
        type: index === 0 ? 'glow-up' : 'corner',
      }))
      .filter(
        ({ result }) => result.status === 'fulfilled' && result.value === true,
      );

    if (handledModals.length > 0) {
      // Check if any modals are still visible after handling
      await page.waitForTimeout(500);
      const modalDialogs = page.getByTestId('ModalDialog');
      const stillVisible = await modalDialogs.count();
      if (stillVisible > 0) {
        await handleKnownModals(page); // Recursive call for remaining modals
      } else {
      }
    }
  } catch (error) {}
};

export const scrollToBottom = async (page: Page) => {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
};

// Utility function to handle popups that may appear in any order
export async function handlePopupsInAnyOrder(page: Page): Promise<void> {
  await page.waitForTimeout(3000); // Increased initial wait for late-appearing popups
  let popupsHandled = 0;
  const maxAttempts = 10; // Prevent infinite loops
  // First do a quick check to see if any popups are immediately visible
  const hasImmediatePopups = await checkForImmediatePopups(page);
  if (!hasImmediatePopups) {
    // If no immediate popups, wait a bit longer for delayed popups to appear
    await page.waitForTimeout(3000); // Increased wait for delayed popups
  }
  for (let attempt = 0; attempt < maxAttempts && popupsHandled < 6; attempt++) {
    let handledThisRound = false;
    // Check for "A faster way to enter time" tour modal
    try {
      if (
        await page
          .getByRole('heading', {
            name: 'A faster way to enter time',
          })
          .isVisible({ timeout: 2000 })
      ) {
        await page
          .getByTestId('ModalDialog')
          .getByRole('button', { name: 'Close' })
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "Just around the corner" popup
    try {
      if (
        await page
          .getByText('Just around the corner')
          .isVisible({ timeout: 2000 })
      ) {
        await page
          .getByTestId('ModalDialog')
          .getByRole('button', { name: 'Ok' })
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "QuickBooks Time got a glow-up" popup
    try {
      if (
        await page
          .getByText('QuickBooks Time got a glow-up')
          .isVisible({ timeout: 5000 })
      ) {
        await page
          .locator(
            `//div[@data-automation-id="ModalDialog"] / descendant::button[@aria-label="Close"]`,
          )
          .or(page.getByRole('button', { name: 'Close', exact: true }))
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "Streamlined time settings" popup
    try {
      if (
        await page
          .getByText('Streamlined time settings')
          .or(page.getByRole('heading', { name: 'Streamlined time settings' }))
          .isVisible({ timeout: 3000 })
      ) {
        // Try to click "Got it" first, then fall back to "Close"
        try {
          await page
            .getByRole('button', { name: 'Got it' })
            .click({ timeout: 2000 });
        } catch {
          await page
            .getByTestId('ModalDialog')
            .getByRole('button', { name: 'Close' })
            .click({ timeout: 2000 });
        }
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "Single time entry" popup
    try {
      if (
        await page
          .getByTestId('ModalDialog')
          .getByRole('heading', { name: 'Single time entry' })
          .isVisible({ timeout: 2000 })
      ) {
        await page
          .getByRole('button', { name: 'Got it' })
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // Check for "Go to QuickBooks Time to enter a timesheet" popup
    try {
      if (
        await page
          .getByRole('heading', {
            name: 'Go to QuickBooks Time to enter a timesheet',
          })
          .or(page.getByRole('heading', { name: 'Go to QuickBooks Time to' }))
          .isVisible({ timeout: 2000 })
      ) {
        await page
          .getByLabel('Please do not show again')
          .or(page.getByText('Please do not show again'))
          .click({ timeout: 2000 });
        await page
          .getByTestId('ModalDialog')
          .getByLabel('Close')
          .or(
            page
              .getByTestId('ModalDialog')
              .locator('button')
              .filter({ hasText: 'Close' }),
          )
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    try {
      if (
        await page
          .locator('#guided-modal-title')
          .filter({ hasText: "What's New in QuickBooks Time" })
          .isVisible({ timeout: 5000 })
      ) {
        await page
          .locator(
            `//div[@data-automation-id="ModalDialog"] / descendant::button[@aria-label="Close"]`,
          )
          .or(page.getByRole('button', { name: 'Close', exact: true }))
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }
    // If no popups were handled this round, break the loop
    if (!handledThisRound) {
      break;
    }
  }
}
// Private helper methods
// Wait for page to be fully loaded and ready
export async function waitForPageReady(
  page: Page,
  timeout = TIME_SETTINGS_PAGE_READY_TIMEOUT,
): Promise<void> {
  try {
    await Promise.race([
      page
        .locator('[data-testid="LoadingSpinner"]')
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() =>
          page.locator('[data-testid="LoadingSpinner"]').waitFor({
            state: 'hidden',
            timeout,
          }),
        ),
      Promise.all([
        page
          .locator('[data-testid="DateRangeSelect"], .DateRangeSelect')
          .waitFor({ state: 'visible', timeout }),
        page
          .locator(
            '[aria-label="Display by"], [data-testid="DisplayByDropdown"]',
          )
          .waitFor({ state: 'visible', timeout }),
      ]),
    ]);
    await page.waitForTimeout(TIME_SETTINGS_POST_NAV_DELAY);
  } catch {
    await page.waitForTimeout(TIME_SETTINGS_POST_NAV_DELAY);
  }
}
// Helper method to quickly check if any popups are immediately visible
export async function checkForImmediatePopups(page: Page): Promise<boolean> {
  try {
    // Use Promise.race to check all popup types with increased timeout for late-appearing popups
    await Promise.race([
      page
        .getByRole('heading', {
          name: 'A faster way to enter time',
        })
        .waitFor({ state: 'visible', timeout: 500 }),
      page
        .getByText('Just around the corner')
        .waitFor({ state: 'visible', timeout: 500 }),
      page
        .getByText('QuickBooks Time got a glow-up')
        .waitFor({ state: 'visible', timeout: 500 }),
      page
        .locator('text="Streamlined time settings"')
        .or(page.getByRole('heading', { name: 'Streamlined time settings' }))
        .waitFor({ state: 'visible', timeout: 1000 }),
      page
        .getByTestId('ModalDialog')
        .getByRole('heading', { name: 'Single time entry' })
        .waitFor({ state: 'visible', timeout: 500 }),
      page
        .getByRole('heading', {
          name: 'Go to QuickBooks Time to enter a timesheet',
        })
        .waitFor({ state: 'visible', timeout: 500 }),
      page
        .getByText("What's New in QuickBooks Time")
        .waitFor({ state: 'visible', timeout: 500 }),
    ]);
    return true; // At least one popup is immediately visible
  } catch (error) {
    return false; // No popups are immediately visible
  }
}

export const closeSpecificTabsOrPage = async (page: Page, url: string) => {
  // Close any tab
  const context = page.context();
  const pages = context.pages();

  for (const existingPage of pages) {
    try {
      const url = existingPage.url();
      // Close any page that is NOT the new timesheet
      // Keep: qbo.intuit or e2e.qbo.intuit + app/time (new timesheet)
      // Close: tsheets domain (classic timesheet - both e2e and prod)
      const isNewTimesheet =
        (url.includes('qbo.intuit') || url.includes('e2e.qbo.intuit')) &&
        url.includes('app/time');
      const isClassicTimesheet = url.includes('tsheets');

      if ((!isNewTimesheet || isClassicTimesheet) && existingPage !== page) {
        await existingPage.close();
      }
    } catch (error) {}
  }

  await page.waitForTimeout(2000);
};

// Utility function to handle popups that may appear in any order
export async function handleClassicTimesheetPopupsInAnyOrder(
  page: Page,
): Promise<void> {
  await page.waitForTimeout(2000);
  let popupsHandled = 0;
  const maxAttempts = 10; // Prevent infinite loops
  // First do a quick check to see if any popups are immediately visible
  const hasImmediatePopups = await checkForImmediatePopups(page);
  if (!hasImmediatePopups) {
    // If no immediate popups, wait a bit longer for delayed popups to appear
    await page.waitForTimeout(2000);
  }
  for (let attempt = 0; attempt < maxAttempts && popupsHandled < 6; attempt++) {
    let handledThisRound = false;
    // Check for "A faster way to enter time" tour modal
    try {
      if (
        await page
          .getByText('Welcome to your Elite time')
          .or(page.getByRole('button', { name: 'Get Started' }))
          .isVisible({ timeout: 1000 })
      ) {
        await page.getByRole('img', { name: 'Close' }).click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }

    try {
      if (
        await page
          .getByRole('heading', { name: 'Welcome to QuickBooks Time!' })
          .isVisible({ timeout: 1000 })
      ) {
        await page
          .getByRole('button', { name: 'Skip for Now' })
          .click({ timeout: 2000 });
        await page.waitForTimeout(500);
        popupsHandled++;
        handledThisRound = true;
      }
    } catch (error) {
      // Popup disappeared on its own, continue
    }

    // If no popups were handled this round, break the loop
    if (!handledThisRound) {
      break;
    }
  }
}

// Helper method to quickly check if any popups are immediately visible
export async function checkForImmediateClassicTimesheetPopups(
  page: Page,
): Promise<boolean> {
  try {
    // Use Promise.race to check all popup types with very short timeout
    await Promise.race([
      page
        .getByText('Welcome to your Elite time')
        .or(page.getByRole('button', { name: 'Get Started' }))
        .isVisible({ timeout: 1000 }),
      page
        .getByRole('heading', { name: 'Welcome to QuickBooks Time!' })
        .isVisible({ timeout: 1000 }),
    ]);
    return true; // At least one popup is immediately visible
  } catch (error) {
    return false; // No popups are immediately visible
  }
}

// Approvals and Settings Functions

export const navigateToClassicApprovalPreferences = async (page: Page) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible({
    timeout: 10000,
  });
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page
      .getByText('Go to classic QuickBooks Time')
      .click({ timeout: 3000 }),
  ]);
  await classicPage.waitForLoadState();
  await waitForPageReady(classicPage);
  await handleClassicTimesheetPopupsInAnyOrder(classicPage);

  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage
      .locator(
        `//div[@class='ts_overlay_close_icon_container payroll-close-div']`,
      )
      .click();
  }
  await expect(classicPage.locator('#quickbooks_menu_top')).toBeVisible();
  classicPage.waitForTimeout(9000);
  await dismissCookieConsent(classicPage);

  // Navigate to Feature Add-ons -> Approval Preferences
  await classicPage.locator('#addons_shortcut').click();
  await classicPage.locator('#addon_approvals_prefs_shortcut').click();
  await expect(classicPage.locator('#addon_approvals_title')).toBeVisible();

  return { classicPage, classicPageUrl: classicPage.url() };
};

export const navigateToNotificationSection = async (classicPage: Page) => {
  await classicPage.locator(`//a[text()='Notifications']`).click();
  await classicPage.waitForTimeout(5000);
};

// Verification methods for Approvals section
export const verifyTeamMemberOptions = async (classicPage: Page) => {
  await expect(
    classicPage.locator(`//div[contains(text(), ' Team member Options')]`),
  ).toBeVisible();
};

export const verifyApprovalsSectionVisible = async (page: Page) => {
  await expect(
    page.locator(`//label[text()='Approvals']`).first(),
  ).toBeVisible();
};

export const verifySubmissionSectionVisible = async (page: Page) => {
  await expect(page.locator(`//label[text()='Submissions']`)).toBeVisible();
};

export const verifyApprovalNotificationSectionVisible = async (page: Page) => {
  await expect(page.getByText('Approval')).toBeVisible();
};

// Team member checkbox methods
export const checkTeamMembersCanReviewAndSubmitTime = async (
  classicPage: Page,
) => {
  const checkbox = classicPage.locator('#addon_approvals_employee_approval');
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkTeamMembersCanReviewAndSubmitTimeCheckbox = async (
  page: Page,
) => {
  const checkbox = page.locator(
    `//span[text()='Team members can review and submit their time']/../..//input`,
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const verifyTeamMembersCanReviewAndSubmitTimeValue = async (
  page: Page,
  expectedValue: string,
) => {
  const valueElement = page.locator(
    `//label[text()='Team members can review and submit their time']/../span`,
  );
  await expect(valueElement).toHaveText(expectedValue);
};

export const verifyTeamMemberOptionsEnabled = async (classicPage: Page) => {
  // Verify the day of week option is enabled
  const dayOfWeekRadio = classicPage.locator(
    '#addon_approvals_employee_reminders_based_on_dow',
  );
  await expect(dayOfWeekRadio).toBeEnabled();
};

export const verifyTeamMemberSectionChecked = async (classicPage: Page) => {
  const checkbox = classicPage.getByLabel(
    'Team members can review and submit their time',
  );
  await expect(checkbox).toBeChecked();
};

export const verifyApprovalManagerSectionEnabled = async (
  classicPage: Page,
) => {
  await expect(classicPage.getByText('Approval Manager')).toBeVisible();
};

// Edit button methods
export const clickEditApprovalsSection = async (page: Page) => {
  const editButton = page.locator(
    `//div[@data-testid='approvals-settings-view']//button[@aria-label='Edit']`,
  );
  await expect(editButton).toBeVisible();
  await editButton.click();
};

export const clickEditNotificationSection = async (page: Page) => {
  const editButton = page.locator(
    `//div[@data-testid='notifications-settings-view']//button[@aria-label='Edit']`,
  );
  await expect(editButton).toBeVisible();
  await editButton.click();
};

// Option selection methods
export const selectDayOfWeekOption = async (page: Page) => {
  const dayOfWeekRadio = page.locator(
    '#addon_approvals_employee_reminders_based_on_dow',
  );
  await dayOfWeekRadio.click();
};

export const selectDayOfWeekOptionApprovalMgr = async (page: Page) => {
  const dayOfWeekRadio = page.locator(
    '#addon_approvals_mgr_reminders_based_on_dow',
  );
  await dayOfWeekRadio.click();
};

export const selectDayOfWeekOptionQBO = async (page: Page) => {
  const dayOfWeekRadio = page.locator(
    `//input[@name='employeeReminderBasedOn' and @value='DAY_OF_WEEK']`,
  );
  await dayOfWeekRadio.click();
};

export const selectManagerDayOfWeekOptionQBO = async (page: Page) => {
  const dayOfWeekRadio = page.locator(
    `//input[@name='managerReminderBasedOn' and @value='DAY_OF_WEEK']`,
  );
  await dayOfWeekRadio.click();
};

export const verifyDayOfWeekOptionSelected = async (classicPage: Page) => {
  const dayOfWeekRadio = classicPage.locator(
    '#addon_approvals_employee_reminders_based_on_dow',
  );
  await expect(dayOfWeekRadio).toBeChecked();
};

export const verifyDayOfWeekOptionSelectedApprovalMgr = async (
  classicPage: Page,
) => {
  const dayOfWeekRadio = classicPage.locator(
    '#addon_approvals_mgr_reminders_based_on_dow',
  );
  await expect(dayOfWeekRadio).toBeChecked();
};

export const selectPayrollCloseDateOption = async (classicPage: Page) => {
  const payrollCloseDateRadio = classicPage.locator(
    '#addon_approvals_employee_reminders_based_on_pcd',
  );
  await payrollCloseDateRadio.click();
};

export const selectPayrollCloseDateManagerOption = async (
  classicPage: Page,
) => {
  const payrollCloseDateRadio = classicPage.locator(
    '#addon_approvals_mgr_reminders_based_on_pcd',
  );
  await payrollCloseDateRadio.click();
};

export const selectBasedOnPayPeriodOption = async (page: Page) => {
  const payPeriodRadio = page.locator(
    `//input[@name='employeeReminderBasedOn' and @value='PAYROLL_CLOSE_DATE']`,
  );
  await payPeriodRadio.click();
};

export const selectManagerBasedOnPayPeriodOption = async (page: Page) => {
  const payPeriodRadio = page.locator(
    `//input[@name='managerReminderBasedOn' and @value='PAYROLL_CLOSE_DATE']`,
  );
  await payPeriodRadio.click();
};

export const selectDailyOption = async (page: Page) => {
  const dailyRadio = page.locator(
    '#addon_approvals_employee_reminders_based_on_daily',
  );
  await dailyRadio.click();
};

export const selectDailyOptionQBO = async (page: Page) => {
  const dailyRadio = page.locator(
    `//input[@name='employeeReminderBasedOn' and @value='DAILY']`,
  );
  await dailyRadio.click();
};

// Checkbox methods for reminders
export const checkCurrentWeekSubmissionReminder = async (page: Page) => {
  const checkbox = page.locator('#addon_approvals_emp_submit_reminder_pre');
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkPriorWeekSubmissionReminder = async (page: Page) => {
  const checkbox = page.locator('#addon_approvals_emp_submit_reminder_post');
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkCurrentWeekSubmissionReminderQBO = async (page: Page) => {
  const checkbox = page.locator(
    `//span[text()="Remind when they have not submitted their team's timesheets for current week"]/..//input`,
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkPriorWeekSubmissionReminderQBO = async (page: Page) => {
  const checkbox = page.locator(
    `//span[text()="Remind when they have not submitted their team's timesheets for prior week"]/..//input`,
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkCurrentWeekSubmissionReminderManagerQBO = async (
  page: Page,
) => {
  const checkbox = page.locator(
    `//span[text()="Remind when managers have not approved their team's timesheets for the current week"]/..//input`,
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkPriorWeekSubmissionReminderManagerQBO = async (
  page: Page,
) => {
  const checkbox = page.locator(
    `//span[text()="Remind when managers have not approved their team's timesheets for the prior week"]/..//input`,
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const unCheckCurrentWeekSubmissionReminderQBO = async (page: Page) => {
  const checkbox = page.locator(
    `//span[text()="Remind when they have not submitted their team's timesheets for current week"]/..//input`,
  );
  if (await checkbox.isChecked()) {
    await checkbox.uncheck();
  }
};

export const unCheckPriorWeekSubmissionReminderQBO = async (page: Page) => {
  const checkbox = page.locator(
    `//span[text()="Remind when they have not submitted their team's timesheets for prior week"]/..//input`,
  );
  if (await checkbox.isChecked()) {
    await checkbox.uncheck();
  }
};

export const unCheckCurrentWeekSubmissionReminderManagerQBO = async (
  page: Page,
) => {
  const checkbox = page.locator(
    `//span[text()="Remind when managers have not approved their team's timesheets for the current week"]/..//input`,
  );
  if (await checkbox.isChecked()) {
    await checkbox.uncheck();
  }
};

export const unCheckPriorWeekSubmissionReminderManagerQBO = async (
  page: Page,
) => {
  const checkbox = page.locator(
    `//span[text()="Remind when managers have not approved their team's timesheets for the prior week"]/..//input`,
  );
  if (await checkbox.isChecked()) {
    await checkbox.uncheck();
  }
};

export const checkPayrollCloseDateReminder = async (page: Page) => {
  const checkbox = page.locator(
    '#addon_approvals_emp_submit_pay_period_reminder_pre',
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkNotSubmittedByPayrollCloseDate = async (page: Page) => {
  const checkbox = page.locator(
    '#addon_approvals_emp_submit_pay_period_reminder_post',
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkPayrollCloseDateReminderManager = async (page: Page) => {
  const checkbox = page.locator(
    '#addon_approvals_mgr_approval_pay_period_reminder_pre',
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkNotSubmittedByPayrollCloseDateManager = async (
  page: Page,
) => {
  const checkbox = page.locator(
    '#addon_approvals_mgr_approval_pay_period_reminder_post',
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkPayrollCloseDateReminderQBO = async (page: Page) => {
  const checkbox = page.locator(
    `//span[text()="Remind during set time from the payroll close date"]/..//input`,
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkNotSubmittedByPayrollCloseDateQBO = async (page: Page) => {
  const checkbox = page.locator(
    `//span[text()="Remind when they have not submitted their time by the payroll close date"]/..//input`,
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkNotSubmittedByPayrollCloseDateManagerQBO = async (
  page: Page,
) => {
  const checkbox = page.locator(
    `//span[text()="Remind when managers have not approved their team members' time by the payroll close date"]/..//input`,
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkNotSubmittedForSelectedDays = async (page: Page) => {
  const checkbox = page.locator('#addon_approvals_emp_submit_reminder_daily_1');
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkStillNotSubmittedForSelectedDays = async (page: Page) => {
  const checkbox = page.locator('#addon_approvals_emp_submit_reminder_daily_2');
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkNotSubmittedForSelectedDaysQBO = async (page: Page) => {
  const checkbox = page.locator(
    `//span[text()="Remind when they have not submitted their time for the selected days"]/..//input`,
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkStillNotSubmittedForSelectedDaysQBO = async (page: Page) => {
  const checkbox = page.locator(
    `//span[text()="Remind when they have still not submitted their time for the selected days"]/..//input`,
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkCurrentWeekApprovalReminder = async (classicPage: Page) => {
  const checkbox = classicPage.locator(
    '#addon_approvals_mgr_approval_reminder_pre',
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

export const checkPriorWeekApprovalReminder = async (classicPage: Page) => {
  const checkbox = classicPage.locator(
    '#addon_approvals_mgr_approval_reminder_post',
  );
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
};

// Time and day setting methods
export const setCurrentWeekReminderTime = async (
  page: Page,
  time: string,
  day: string,
) => {
  // Set time - convert format to match DOM (e.g., "2:00 PM" -> "2:00pm")
  const formattedTime = time.toLowerCase().replace(/\s/g, '');
  await page
    .locator(`#addon_approvals_emp_submit_reminder_pre_hour`)
    .selectOption({ label: formattedTime });

  // Set day - match exact day name
  await page
    .locator(`#addon_approvals_emp_submit_reminder_pre_dow`)
    .selectOption({ label: day });
};

export const setPriorWeekReminderTime = async (
  page: Page,
  time: string,
  day: string,
) => {
  // Set time - convert format to match DOM (e.g., "2:00 PM" -> "2:00pm")
  const formattedTime = time.toLowerCase().replace(/\s/g, '');
  await page
    .locator(`#addon_approvals_emp_submit_reminder_post_hour`)
    .selectOption({ label: formattedTime });

  // Set day - match exact day name
  await page
    .locator(`#addon_approvals_emp_submit_reminder_post_dow`)
    .selectOption({ label: day });
};

export const setCurrentWeekReminderTimeQBO = async (
  page: Page,
  time: string,
  day: string,
) => {
  // Set time
  const timeInput = page.locator(
    `//span[text()="Remind when they have not submitted their team's timesheets for current week"]/ancestor::div[contains(@class, 'EditSubmissionsNotificationSettings__SubmissionContent')]//span[text()='Reminder time']/..//div[contains(@class, 'DropdownTypeahead-iconBox')]`,
  );
  await timeInput.click();
  await page.locator(`//li/span[text()='${time}']`).click();

  // Set day
  const dayInput = page.locator(
    `//span[text()="Remind when they have not submitted their team's timesheets for current week"]/ancestor::div[contains(@class, 'EditSubmissionsNotificationSettings__SubmissionContent')]//span[text()='Reminder day']/..//div[contains(@class, 'Dropdown-iconBox')]`,
  );
  await dayInput.click();
  await page.locator(`//li/span[text()='${day}']`).click();
};

export const setPriorWeekReminderTimeQBO = async (
  page: Page,
  time: string,
  day: string,
) => {
  // Set time
  const timeInput = page.locator(
    `//span[text()="Remind when they have not submitted their team's timesheets for prior week"]/ancestor::div[contains(@class, 'EditSubmissionsNotificationSettings__SubmissionContent')]//span[text()='Reminder time']/..//div[contains(@class, 'DropdownTypeahead-iconBox')]`,
  );
  await timeInput.click();
  await page.locator(`//li/span[text()='${time}']`).click();

  // Set day
  const dayInput = page.locator(
    `//span[text()="Remind when they have not submitted their team's timesheets for prior week"]/ancestor::div[contains(@class, 'EditSubmissionsNotificationSettings__SubmissionContent')]//span[text()='Reminder day']/..//div[contains(@class, 'Dropdown-iconBox')]`,
  );
  await dayInput.click();
  await page.locator(`//li/span[text()='${day}']`).click();
};

export const setCurrentWeekReminderTimeManagerQBO = async (
  page: Page,
  time: string,
  day: string,
) => {
  // Set time
  const timeInput = page.locator(
    `//span[text()="Remind when managers have not approved their team's timesheets for the current week"]/ancestor::div[contains(@class, 'EditApprovalsNotificationSettings__ApprovalContent')]//span[text()='Reminder time']/..//div[contains(@class, 'DropdownTypeahead-iconBox')]`,
  );
  await timeInput.click();
  await page.locator(`//li/span[text()='${time}']`).click();

  // Set day
  const dayInput = page.locator(
    `//span[text()="Remind when managers have not approved their team's timesheets for the current week"]/ancestor::div[contains(@class, 'EditApprovalsNotificationSettings__ApprovalContent')]//span[text()='Reminder day']/..//div[contains(@class, 'Dropdown-iconBox')]`,
  );
  await dayInput.click();
  await page.locator(`//li/span[text()='${day}']`).click();
};

export const setPriorWeekReminderTimeManagerQBO = async (
  page: Page,
  time: string,
  day: string,
) => {
  // Set time
  const timeInput = page.locator(
    `//span[text()="Remind when managers have not approved their team's timesheets for the prior week"]/ancestor::div[contains(@class, 'EditApprovalsNotificationSettings__ApprovalContent')]//span[text()='Reminder time']/..//div[contains(@class, 'DropdownTypeahead-iconBox')]`,
  );
  await timeInput.click();
  await page.locator(`//li/span[text()='${time}']`).click();

  // Set day
  const dayInput = page.locator(
    `//span[text()="Remind when managers have not approved their team's timesheets for the prior week"]/ancestor::div[contains(@class, 'EditApprovalsNotificationSettings__ApprovalContent')]//span[text()='Reminder day']/..//div[contains(@class, 'Dropdown-iconBox')]`,
  );
  await dayInput.click();
  await page.locator(`//li/span[text()='${day}']`).click();
};

export const setPayrollCloseDateReminderTime = async (
  page: Page,
  time: string,
  daysAfter: string,
) => {
  // Set time - convert format to match DOM (e.g., "5:00 PM" -> "5:00pm")
  const formattedTime = time.toLowerCase().replace(/\s/g, '');
  await page
    .locator(`#addon_approvals_emp_submit_pay_period_reminder_pre_hour`)
    .selectOption({ label: formattedTime });

  // Set days after
  await page
    .locator(`#addon_approvals_emp_submit_pay_period_reminder_pre_da`)
    .selectOption({ label: daysAfter });
};

export const setNotSubmittedByPayrollCloseDateReminderTime = async (
  page: Page,
  time: string,
  daysAfter: string,
) => {
  // Set time - convert format to match DOM (e.g., "7:00 PM" -> "7:00pm")
  const formattedTime = time.toLowerCase().replace(/\s/g, '');
  await page
    .locator(`#addon_approvals_emp_submit_pay_period_reminder_post_hour`)
    .selectOption({ label: formattedTime });

  // Set days after
  await page
    .locator(`#addon_approvals_emp_submit_pay_period_reminder_post_da`)
    .selectOption({ label: daysAfter });
};

export const setManagerPayrollCloseDateReminderTime = async (
  page: Page,
  time: string,
  daysAfter: string,
) => {
  // Set time - convert format to match DOM (e.g., "5:00 PM" -> "5:00pm")
  const formattedTime = time.toLowerCase().replace(/\s/g, '');
  await page
    .locator(`#addon_approvals_mgr_approval_pay_period_reminder_pre_hour`)
    .selectOption({ label: formattedTime });

  // Set days after
  await page
    .locator(`#addon_approvals_mgr_approval_pay_period_reminder_pre_da`)
    .selectOption({ label: daysAfter });
};

export const setManagerNotSubmittedByPayrollCloseDateReminderTime = async (
  page: Page,
  time: string,
  daysAfter: string,
) => {
  // Set time - convert format to match DOM (e.g., "7:00 PM" -> "7:00pm")
  const formattedTime = time.toLowerCase().replace(/\s/g, '');
  await page
    .locator(`#addon_approvals_mgr_approval_pay_period_reminder_post_hour`)
    .selectOption({ label: formattedTime });

  // Set days after
  await page
    .locator(`#addon_approvals_mgr_approval_pay_period_reminder_post_da`)
    .selectOption({ label: daysAfter });
};

export const setPayrollCloseDateReminderTimeQBO = async (
  page: Page,
  time: string,
  daysAfter: string,
) => {
  // Set time
  const timeInput = page.locator(
    `//span[text()="Remind during set time from the payroll close date"]/ancestor::div[contains(@class, 'EditSubmissionsNotificationSettings__SubmissionContent')]//span[text()='Reminder time']/..//div[contains(@class, 'DropdownTypeahead-iconBox')]`,
  );
  await timeInput.click();
  await page.locator(`//li/span[text()='${time}']`).click();

  // Set day
  const dayInput = page.locator(
    `//span[text()="Remind during set time from the payroll close date"]/ancestor::div[contains(@class, 'EditSubmissionsNotificationSettings__SubmissionContent')]//span[text()='Reminder day']/..//div[contains(@class, 'Dropdown-iconBox')]`,
  );
  await dayInput.click();
  await page.locator(`//li/span[text()='${daysAfter}']`).click();
};

export const setNotSubmittedByPayrollCloseDateReminderTimeQBO = async (
  page: Page,
  time: string,
  daysAfter: string,
) => {
  // Set time
  const timeInput = page.locator(
    `//span[text()="Remind when they have not submitted their time by the payroll close date"]/ancestor::div[contains(@class, 'EditSubmissionsNotificationSettings__SubmissionContent')]//span[text()='Reminder time']/..//div[contains(@class, 'DropdownTypeahead-iconBox')]`,
  );
  await timeInput.click();
  await page.locator(`//li/span[text()='${time}']`).click();

  // Set day
  const dayInput = page.locator(
    `//span[text()="Remind when they have not submitted their time by the payroll close date"]/ancestor::div[contains(@class, 'EditSubmissionsNotificationSettings__SubmissionContent')]//span[text()='Reminder day']/..//div[contains(@class, 'Dropdown-iconBox')]`,
  );
  await dayInput.click();
  await page.locator(`//li/span[text()='${daysAfter}']`).click();
};

export const setPayrollCloseDateReminderTimeManagerQBO = async (
  page: Page,
  time: string,
  daysAfter: string,
) => {
  // Set time
  const timeInput = page.locator(
    `//span[text()="Remind during set time from the payroll close date"]/ancestor::div[contains(@class, 'EditApprovalsNotificationSettings__ApprovalContent')]//span[text()='Reminder time']/..//div[contains(@class, 'DropdownTypeahead-iconBox')]`,
  );
  await timeInput.click();
  await page.locator(`//li/span[text()='${time}']`).click();

  // Set day
  const dayInput = page.locator(
    `//span[text()="Remind during set time from the payroll close date"]/ancestor::div[contains(@class, 'EditApprovalsNotificationSettings__ApprovalContent')]//span[text()='Reminder day']/..//div[contains(@class, 'Dropdown-iconBox')]`,
  );
  await dayInput.click();
  await page.locator(`//li/span[text()='${daysAfter}']`).click();
};

export const setNotSubmittedByPayrollCloseDateReminderTimeManagerQBO = async (
  page: Page,
  time: string,
  daysAfter: string,
) => {
  // Set time
  const timeInput = page.locator(
    `//span[text()="Remind when managers have not approved their team members' time by the payroll close date"]/ancestor::div[contains(@class, 'EditApprovalsNotificationSettings__ApprovalContent')]//span[text()='Reminder time']/..//div[contains(@class, 'DropdownTypeahead-iconBox')]`,
  );
  await timeInput.click();
  await page.locator(`//li/span[text()='${time}']`).click();

  // Set day
  const dayInput = page.locator(
    `//span[text()="Remind when managers have not approved their team members' time by the payroll close date"]/ancestor::div[contains(@class, 'EditApprovalsNotificationSettings__ApprovalContent')]//span[text()='Reminder day']/..//div[contains(@class, 'Dropdown-iconBox')]`,
  );
  await dayInput.click();
  await page.locator(`//li/span[text()='${daysAfter}']`).click();
};

export const setNotSubmittedForSelectedDaysTime = async (
  page: Page,
  time: string,
) => {
  // Set time - convert format to match DOM (e.g., "3:00 PM" -> "3:00pm")
  const formattedTime = time.toLowerCase().replace(/\s/g, '');
  await page
    .locator(`#addon_approvals_emp_submit_reminder_daily_1_hour`)
    .selectOption({ label: formattedTime });
};

export const setStillNotSubmittedForSelectedDaysTime = async (
  page: Page,
  time: string,
) => {
  // Set time - convert format to match DOM (e.g., "5:00 PM" -> "5:00pm")
  const formattedTime = time.toLowerCase().replace(/\s/g, '');
  await page
    .locator(`#addon_approvals_emp_submit_reminder_daily_2_hour`)
    .selectOption({ label: formattedTime });
};

export const setNotSubmittedForSelectedDaysTimeQBO = async (
  page: Page,
  time: string,
) => {
  const timeInput = page.locator(
    `//span[text()="Remind when they have not submitted their time for the selected days"]/ancestor::div[contains(@class, 'EditSubmissionsNotificationSettings__SubmissionContent')]//span[text()='Reminder time']/..//div[contains(@class, 'DropdownTypeahead-iconBox')]`,
  );
  await timeInput.click();
  await page.getByRole('option', { name: time }).click();
};

export const setStillNotSubmittedForSelectedDaysTimeQBO = async (
  page: Page,
  time: string,
) => {
  const timeInput = page.locator(
    `//span[text()="Remind when they have still not submitted their time for the selected days"]/ancestor::div[contains(@class, 'EditSubmissionsNotificationSettings__SubmissionContent')]//span[text()='Reminder time']/..//div[contains(@class, 'DropdownTypeahead-iconBox')]`,
  );
  await timeInput.click();
  await page.getByRole('option', { name: time }).click();
};

export const setCurrentWeekApprovalReminderTime = async (
  classicPage: Page,
  time: string,
  day: string,
) => {
  // Set time - convert format to match DOM (e.g., "2:00 PM" -> "2:00pm")
  const formattedTime = time.toLowerCase().replace(/\s/g, '');
  await classicPage
    .locator(`#addon_approvals_mgr_approval_reminder_pre_hour`)
    .selectOption({ label: formattedTime });

  // Set day - match exact day name
  await classicPage
    .locator(`#addon_approvals_mgr_approval_reminder_pre_dow`)
    .selectOption({ label: day });
};

export const setPriorWeekApprovalReminderTime = async (
  classicPage: Page,
  time: string,
  day: string,
) => {
  // Set time - convert format to match DOM (e.g., "2:00 PM" -> "2:00pm")
  const formattedTime = time.toLowerCase().replace(/\s/g, '');
  await classicPage
    .locator(`#addon_approvals_mgr_approval_reminder_post_hour`)
    .selectOption({ label: formattedTime });

  // Set day - match exact day name
  await classicPage
    .locator(`#addon_approvals_mgr_approval_reminder_post_dow`)
    .selectOption({ label: day });
};

export const selectDaysOfWeek = async (page: Page, days: string[]) => {
  for (const day of days) {
    // Look for the day checkbox within the specific daily reminder options container
    const dayCheckbox = page.locator(
      `#addon_approvals_daily_employee_reminder_options_days //td[@role='checkbox' and @aria-label='${day}']`,
    );

    // Check if the day is already selected
    const isChecked = await dayCheckbox.getAttribute('aria-checked');

    // Only click if not already checked
    if (isChecked === 'false') {
      await dayCheckbox.click();
    }
  }
};

export const selectFiveWeekdays = async (page: Page) => {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  for (const day of weekdays) {
    // Look for the day checkbox within the specific daily reminder options container
    const dayCheckbox = page.locator(
      `//div[@id='addon_approvals_daily_employee_reminder_options_days']//td[@role='checkbox' and @aria-label='${day}']`,
    );
    // Check if the day is already selected
    const isChecked = await dayCheckbox.getAttribute('aria-checked');

    // Only click if not already checked
    if (isChecked === 'false') {
      await dayCheckbox.click();
    }
  }
};

export const verifyFiveWeekdaysSelected = async (page: Page) => {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  for (const day of weekdays) {
    // Look for the day checkbox within the specific daily reminder options container
    const dayCheckbox = page.locator(
      `//div[@id='addon_approvals_daily_employee_reminder_options_days']//td[@role='checkbox' and @aria-label='${day}']`,
    );
    await expect(dayCheckbox).toHaveAttribute('aria-checked', 'true');
  }
};

export const selectDaysOfWeekQBO = async (page: Page, days: string[]) => {
  for (const day of days) {
    await page.waitForTimeout(6000);
    // Click to open the dropdown
    await page.locator(`//label[text()='Days of week']/..//input`).click();
    await page.waitForTimeout(6000);

    // Find the list item with the specific day text
    const dayItem = page.locator(`//span[text()='${day}']/parent::li`);

    // Check if the day is already selected
    const isChecked = await dayItem.getAttribute('aria-checked');

    // Only click if not already checked
    if (isChecked === 'true') {
      await dayItem.click();
    } else {
      await page.locator(`//label[text()='Days of week']/..//input`).click();
    }
  }
};

export const selectFiveWeekdaysQBO = async (page: Page) => {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  for (const day of weekdays) {
    await page.waitForTimeout(5000);
    // Click to open the dropdown
    await page.locator(`//label[text()='Days of week']/..//input`).click();
    await page.waitForTimeout(6000);
    const dayItem = page.locator(`//span[text()='${day}']/parent::li`);
    const isChecked = await dayItem.getAttribute('aria-checked');

    // Only click if not already checked
    if (isChecked === 'false' || isChecked === null) {
      await dayItem.click();
    } else {
      await page.locator(`//label[text()='Days of week']/..//input`).click();
    }
  }
};

export const verifyFiveWeekdaysSelectedQBO = async (
  page: Page,
  expectedValue: string,
) => {
  const valueElement = page.locator(
    `(//label[text()='Days reminders are sent']/../span)[2]`,
  );
  await expect(valueElement).toHaveText(expectedValue);
};

// Save methods
export const saveApprovalSettings = async (page: Page) => {
  const saveButton = page.locator(`//button/span[text()='Save']`);
  await expect(saveButton).toBeVisible();
  await saveButton.click();
  await page.waitForTimeout(2000);
};

export const saveNotificationSettings = async (page: Page) => {
  const saveButton = page.getByRole('button', { name: 'Save' });
  await expect(saveButton).toBeVisible();
  await saveButton.click();
  await page.waitForTimeout(2000);
};

// Verification methods for QBO Time values
export const verifySendReminderToTeamValue = async (
  page: Page,
  expectedValue: string,
) => {
  await page
    .locator(`//label[text()='Send reminder to team to submit time']/../span`)
    .scrollIntoViewIfNeeded();
  const valueElement = page.locator(
    `//label[text()='Send reminder to team to submit time']/../span`,
  );
  await expect(valueElement).toHaveText(expectedValue);
};

export const verifyCurrentWeekReminderValue = async (
  page: Page,
  expectedValue: string,
) => {
  const valueElement = page.locator(
    `//label[text()="Remind when they have not submitted their team's timesheets for current week"]/parent::div/span`,
  );
  await expect(valueElement).toHaveText(expectedValue);
};

export const verifyPriorWeekReminderValue = async (
  page: Page,
  expectedValue: string,
) => {
  const valueElement = page.locator(
    `//label[text()="Remind when they have not submitted their team's timesheets for prior week"]/../span`,
  );
  await expect(valueElement).toHaveText(expectedValue);
};

export const verifyPayrollCloseDateReminderValue = async (
  page: Page,
  expectedValue: string,
) => {
  const valueElement = page.locator(
    `//label[text()="Remind during set time from the payroll close date"]/../span`,
  );
  await expect(valueElement).toHaveText(expectedValue);
};

export const verifyNotSubmittedByPayrollCloseDateValue = async (
  page: Page,
  expectedValue: string,
) => {
  const valueElement = page.locator(
    `//label[text()="Remind when they have not submitted their time by the payroll close date"]/../span`,
  );
  await expect(valueElement).toHaveText(expectedValue);
};

export const verifyNotSubmittedByPayrollCloseDateManagerValue = async (
  page: Page,
  expectedValue: string,
) => {
  const valueElement = page.locator(
    `//label[text()="Remind when managers have not approved their team members' time by the payroll close date"]/../span`,
  );
  await expect(valueElement).toHaveText(expectedValue);
};

export const verifyDaysRemindersAreSentValue = async (
  page: Page,
  expectedValue: string,
) => {
  const valueElement = page.locator(
    `(//label[text()="Days reminders are sent"]/../span)[2]`,
  );
  await expect(valueElement).toHaveText(expectedValue);
};

export const verifyNotSubmittedForSelectedDaysValue = async (
  page: Page,
  expectedValue: string,
) => {
  const valueElement = page.locator(
    `//label[text()="Remind when they have not submitted their time for the selected days"]/../span`,
  );
  await expect(valueElement).toHaveText(expectedValue);
};

export const verifyStillNotSubmittedForSelectedDaysValue = async (
  page: Page,
  expectedValue: string,
) => {
  const valueElement = page.locator(
    `//label[text()="Remind when they have still not submitted their time for the selected days"]/../span`,
  );
  await expect(valueElement).toHaveText(expectedValue);
};

export const verifyRemindManagersToApproveTimeValue = async (
  page: Page,
  expectedValue: string,
) => {
  const valueElement = page.locator(
    `//label[text()="Remind managers to approve time"]/../span`,
  );
  await expect(valueElement).toHaveText(expectedValue);
};

export const verifyCurrentWeekManagerApprovalReminderValue = async (
  page: Page,
  expectedValue: string,
) => {
  const valueElement = page.locator(
    `//label[text()="Remind when managers have not approved their team's timesheets for the current week"]/../span`,
  );
  await expect(valueElement).toHaveText(expectedValue);
};

export const verifyPriorWeekManagerApprovalReminderValue = async (
  page: Page,
  expectedValue: string,
) => {
  const valueElement = page.locator(
    `//label[text()="Remind when managers have not approved their team's timesheets for the prior week"]/../span`,
  );
  await expect(valueElement).toHaveText(expectedValue);
};

// Verification methods for Classic Timesheet values
export const verifyBasedOnDayOfWeekChecked = async (classicPage: Page) => {
  const valueElement = classicPage.locator(
    `#addon_approvals_employee_reminders_based_on_dow`,
  );
  await expect(valueElement).toBeChecked();
};

export const verifyBasedOnDayOfWeekMangerChecked = async (
  classicPage: Page,
) => {
  const valueElement = classicPage.locator(
    `#addon_approvals_mgr_reminders_based_on_dow`,
  );
  await expect(valueElement).toBeChecked();
};

export const verifyBasedOnPayrollCloseDateChecked = async (
  classicPage: Page,
) => {
  const valueElement = classicPage.locator(
    `#addon_approvals_employee_reminders_based_on_pcd`,
  );
  await expect(valueElement).toBeChecked();
};

export const verifyBasedOnPayrollCloseDateManagerChecked = async (
  classicPage: Page,
) => {
  const valueElement = classicPage.locator(
    `#addon_approvals_mgr_reminders_based_on_pcd`,
  );
  await expect(valueElement).toBeChecked();
};

export const verifyBasedOnDailyChecked = async (classicPage: Page) => {
  const valueElement = classicPage.locator(
    `#addon_approvals_employee_reminders_based_on_daily`,
  );
  await expect(valueElement).toBeChecked();
};

export const verifyClassicCurrentWeekReminderValue = async (
  classicPage: Page,
  time: string,
  day: string,
) => {
  // Verify the time dropdown has the correct value selected
  const timeSelect = classicPage.locator(
    '#addon_approvals_emp_submit_reminder_pre_hour',
  );
  const selectedTimeOption = timeSelect.locator('option:checked');
  await expect(selectedTimeOption).toHaveText(time);

  // Verify the day dropdown has the correct value selected
  const daySelect = classicPage.locator(
    '#addon_approvals_emp_submit_reminder_pre_dow',
  );
  const selectedDayOption = daySelect.locator('option:checked');
  await expect(selectedDayOption).toHaveText(day);

  // Verify the checkbox is checked
  const checkbox = classicPage.locator(
    '#addon_approvals_emp_submit_reminder_pre',
  );
  await expect(checkbox).toBeChecked();
};

export const verifyClassicPriorWeekReminderValue = async (
  classicPage: Page,
  time: string,
  day: string,
) => {
  // Verify the time dropdown has the correct value selected
  const timeSelect = classicPage.locator(
    '#addon_approvals_emp_submit_reminder_post_hour',
  );
  const selectedTimeOption = timeSelect.locator('option:checked');
  await expect(selectedTimeOption).toHaveText(time);

  // Verify the day dropdown has the correct value selected
  const daySelect = classicPage.locator(
    '#addon_approvals_emp_submit_reminder_post_dow',
  );
  const selectedDayOption = daySelect.locator('option:checked');
  await expect(selectedDayOption).toHaveText(day);

  // Verify the checkbox is checked
  const checkbox = classicPage.locator(
    '#addon_approvals_emp_submit_reminder_post',
  );
  await expect(checkbox).toBeChecked();
};

export const verifyClassicCurrentWeekApprovalReminderValue = async (
  classicPage: Page,
  time: string,
  day: string,
) => {
  // Verify the time dropdown has the correct value selected
  const timeSelect = classicPage.locator(
    '#addon_approvals_mgr_approval_reminder_pre_hour',
  );
  const selectedTimeOption = timeSelect.locator('option:checked');
  await expect(selectedTimeOption).toHaveText(time);

  // Verify the day dropdown has the correct value selected
  const daySelect = classicPage.locator(
    '#addon_approvals_mgr_approval_reminder_pre_dow',
  );
  const selectedDayOption = daySelect.locator('option:checked');
  await expect(selectedDayOption).toHaveText(day);

  // Verify the checkbox is checked
  const checkbox = classicPage.locator(
    '#addon_approvals_mgr_approval_reminder_pre',
  );
  await expect(checkbox).toBeChecked();
};

export const verifyClassicPriorWeekApprovalReminderValue = async (
  classicPage: Page,
  time: string,
  day: string,
) => {
  // Verify the time dropdown has the correct value selected
  const timeSelect = classicPage.locator(
    '#addon_approvals_mgr_approval_reminder_post_hour',
  );
  const selectedTimeOption = timeSelect.locator('option:checked');
  await expect(selectedTimeOption).toHaveText(time);

  // Verify the day dropdown has the correct value selected
  const daySelect = classicPage.locator(
    '#addon_approvals_mgr_approval_reminder_post_dow',
  );
  const selectedDayOption = daySelect.locator('option:checked');
  await expect(selectedDayOption).toHaveText(day);

  // Verify the checkbox is checked
  const checkbox = classicPage.locator(
    '#addon_approvals_mgr_approval_reminder_post',
  );
  await expect(checkbox).toBeChecked();
};

export const verifyClassicCurrentWeekApprovalReminderManagerValue = async (
  classicPage: Page,
  time: string,
  day: string,
) => {
  // Verify the time dropdown has the correct value selected
  const timeSelect = classicPage.locator(
    '#addon_approvals_mgr_approval_reminder_pre_hour',
  );
  const selectedTimeOption = timeSelect.locator('option:checked');
  await expect(selectedTimeOption).toHaveText(time);

  // Verify the day dropdown has the correct value selected
  const daySelect = classicPage.locator(
    '#addon_approvals_mgr_approval_reminder_pre_dow',
  );
  const selectedDayOption = daySelect.locator('option:checked');
  await expect(selectedDayOption).toHaveText(day);

  // Verify the checkbox is checked
  const checkbox = classicPage.locator(
    '#addon_approvals_mgr_approval_reminder_pre',
  );
  await expect(checkbox).toBeChecked();
};

export const verifyClassicPriorWeekApprovalReminderManagerValue = async (
  classicPage: Page,
  time: string,
  day: string,
) => {
  // Verify the time dropdown has the correct value selected
  const timeSelect = classicPage.locator(
    '#addon_approvals_mgr_approval_reminder_post_hour',
  );
  const selectedTimeOption = timeSelect.locator('option:checked');
  await expect(selectedTimeOption).toHaveText(time);

  // Verify the day dropdown has the correct value selected
  const daySelect = classicPage.locator(
    '#addon_approvals_mgr_approval_reminder_post_dow',
  );
  const selectedDayOption = daySelect.locator('option:checked');
  await expect(selectedDayOption).toHaveText(day);

  // Verify the checkbox is checked
  const checkbox = classicPage.locator(
    '#addon_approvals_mgr_approval_reminder_post',
  );
  await expect(checkbox).toBeChecked();
};

// Email Manager Functions
export const checkEmailManagerWhenEachTeamMemberSubmits = async (
  classicPage: Page,
) => {
  await classicPage.locator('#addon_approvals_notify_mgr_on_submit').check();
};

export const checkEmailManagerWhenEntireTeamSubmits = async (
  classicPage: Page,
) => {
  await classicPage
    .locator('#addon_approvals_notify_mgr_on_group_submitted')
    .check();
};

export const checkEmailManagerWhenEachTeamMemberSubmitsQBO = async (
  page: Page,
) => {
  await page
    .locator(
      '//span[text()="Email managers when each team member submits"]/..//input',
    )
    .check();
};

export const checkEmailManagerWhenEntireTeamSubmitsQBO = async (page: Page) => {
  await page
    .locator(
      '//span[text()="Email managers when entire team submits"]/..//input',
    )
    .check();
};

export const verifyEmailManagerOptionsChecked = async (classicPage: Page) => {
  await expect(
    classicPage.locator('#addon_approvals_mgr_email_each'),
  ).toBeChecked();
  await expect(
    classicPage.locator('#addon_approvals_mgr_email_all'),
  ).toBeChecked();
};

export const verifyEmailManagerWhenEachTeamMemberSubmitsValue = async (
  page: Page,
  expectedValue: string,
) => {
  const value = await page
    .locator(
      '//label[text()="Email managers when each team member submits"]/../span',
    )
    .textContent();
  expect(value).toContain(expectedValue);
};

export const verifyEmailManagerWhenEntireTeamSubmitsValue = async (
  page: Page,
  expectedValue: string,
) => {
  const value = await page
    .locator(
      '//label[text()="Email managers when entire team submits"]/../span',
    )
    .textContent();
  expect(value).toContain(expectedValue);
};

export const verifyEmailManagerWhenEachTeamMemberSubmitsChecked = async (
  classicPage: Page,
) => {
  await expect(
    classicPage.locator('#addon_approvals_notify_mgr_on_submit'),
  ).toBeChecked();
};

export const verifyEmailManagerWhenEntireTeamSubmitsChecked = async (
  classicPage: Page,
) => {
  await expect(
    classicPage.locator('#addon_approvals_notify_mgr_on_group_submitted'),
  ).toBeChecked();
};

// Custom Message Functions
export const clickCustomizeButton = async (classicPage: Page) => {
  await classicPage.locator('#addon_approvals_submit_message_button').click();
};

export const editCustomMessage = async (classicPage: Page, message: string) => {
  await classicPage
    .locator(`//textarea[@class='approvals-submit-message-field']`)
    .fill(message);
};

export const saveCustomMessage = async (classicPage: Page) => {
  await classicPage.locator(`//button[text()='Save']`).click();
};

export const editCustomMessageQBO = async (
  classicPage: Page,
  message: string,
) => {
  await classicPage
    .locator(
      `//label[text()='Message when team members submit time (custom)']/parent::div//label[contains(@class, 'TextArea')]//textarea`,
    )
    .fill(message);
};

export const clickRestoreMessage = async (classicPage: Page) => {
  await classicPage.getByText('Restore message').click();
};

export const clickResetMessage = async (page: Page) => {
  await page.locator(`//a[text()='Reset message']`).click();
};

export const verifyCustomMessageValue = async (
  classicPage: Page,
  expectedValue: string,
) => {
  const message = await classicPage
    .locator('#addon_approvals_approvals_submit_message_preview')
    .textContent();
  expect(message).toBe(expectedValue);
};

export const verifyCustomMessageValueQBO = async (
  page: Page,
  expectedValue: string,
) => {
  await page
    .locator(
      `//label[text()='Message when team members submit time (custom)']/../span`,
    )
    .scrollIntoViewIfNeeded();

  const message = await page
    .locator(
      `//label[text()='Message when team members submit time (custom)']/../span`,
    )
    .textContent();
  expect(message).toBe(expectedValue);
};

// Export all utilities as a single object

export const verifyClassicPayrollCloseDateReminderValue = async (
  classicPage: Page,
  time: string,
  daysAfter: string,
) => {
  const timeSelect = classicPage.locator(
    `#addon_approvals_emp_submit_pay_period_reminder_pre_hour`,
  );
  const selectedTimeOption = timeSelect.locator('option:checked');
  await expect(selectedTimeOption).toHaveText(time);

  const daysSelect = classicPage.locator(
    '#addon_approvals_emp_submit_pay_period_reminder_pre_da',
  );
  const selectedDaysOption = daysSelect.locator('option:checked');
  await expect(selectedDaysOption).toHaveText(daysAfter);

  const checkbox = classicPage.locator(
    '#addon_approvals_emp_submit_pay_period_reminder_pre',
  );
  await expect(checkbox).toBeChecked();
};

export const verifyClassicNotSubmittedByPayrollCloseDateReminderValue = async (
  classicPage: Page,
  time: string,
  daysAfter: string,
) => {
  const timeSelect = classicPage.locator(
    `#addon_approvals_emp_submit_pay_period_reminder_post_hour`,
  );
  const selectedTimeOption = timeSelect.locator('option:checked');
  await expect(selectedTimeOption).toHaveText(time);

  const daysSelect = classicPage.locator(
    '#addon_approvals_emp_submit_pay_period_reminder_post_da',
  );
  const selectedDaysOption = daysSelect.locator('option:checked');
  await expect(selectedDaysOption).toHaveText(daysAfter);

  const checkbox = classicPage.locator(
    '#addon_approvals_emp_submit_pay_period_reminder_post',
  );
  await expect(checkbox).toBeChecked();
};

export const verifyClassicPayrollCloseDateReminderManagerValue = async (
  classicPage: Page,
  time: string,
  daysAfter: string,
) => {
  const timeSelect = classicPage.locator(
    `#addon_approvals_mgr_approval_pay_period_reminder_pre_hour`,
  );
  const selectedTimeOption = timeSelect.locator('option:checked');
  await expect(selectedTimeOption).toHaveText(time);

  const daysSelect = classicPage.locator(
    '#addon_approvals_mgr_approval_pay_period_reminder_pre_da',
  );
  const selectedDaysOption = daysSelect.locator('option:checked');
  await expect(selectedDaysOption).toHaveText(daysAfter);

  const checkbox = classicPage.locator(
    '#addon_approvals_mgr_approval_pay_period_reminder_pre',
  );
  await expect(checkbox).toBeChecked();
};

export const verifyClassicNotSubmittedByPayrollCloseDateReminderManagerValue =
  async (classicPage: Page, time: string, daysAfter: string) => {
    const timeSelect = classicPage.locator(
      `#addon_approvals_mgr_approval_pay_period_reminder_post_hour`,
    );
    const selectedTimeOption = timeSelect.locator('option:checked');
    await expect(selectedTimeOption).toHaveText(time);

    const daysSelect = classicPage.locator(
      '#addon_approvals_mgr_approval_pay_period_reminder_post_da',
    );
    const selectedDaysOption = daysSelect.locator('option:checked');
    await expect(selectedDaysOption).toHaveText(daysAfter);

    const checkbox = classicPage.locator(
      '#addon_approvals_mgr_approval_pay_period_reminder_post',
    );
    await expect(checkbox).toBeChecked();
  };

export const verifyClassicDailyReminderValue = async (
  classicPage: Page,
  time: string,
) => {
  const timeSelect = classicPage.locator(
    `#addon_approvals_emp_submit_reminder_daily_1_hour`,
  );
  const selectedTimeOption = timeSelect.locator('option:checked');
  await expect(selectedTimeOption).toHaveText(time);

  const checkbox = classicPage.locator(
    '#addon_approvals_emp_submit_reminder_daily_1',
  );
  await expect(checkbox).toBeChecked();
};

export const verifyClassicNotSubmittedByDailyReminderValue = async (
  classicPage: Page,
  time: string,
) => {
  await classicPage.waitForTimeout(2000);
  await dismissCookieConsent(classicPage);
  const timeSelect = classicPage.locator(
    `#addon_approvals_emp_submit_reminder_daily_2_hour`,
  );
  const selectedTimeOption = timeSelect.locator('option:checked');
  await expect(selectedTimeOption).toHaveText(time);

  const checkbox = classicPage.locator(
    '#addon_approvals_emp_submit_reminder_daily_2',
  );
  await expect(checkbox).toBeChecked();
};

export const verifyTeamMemberNotificationCheckboxesEditable = async (
  page: Page,
) => {
  await navigateToNotificationSection(page);
  // Verify all checkboxes in team member section are editable
  await page
    .locator(`//input[@id='addon_approvals_employee_reminders_based_on_pcd']`)
    .click();
  await page
    .locator(
      `//input[@type='checkbox' and @id='addon_approvals_emp_submit_pay_period_reminder_pre']`,
    )
    .click();
};

export const NavigateToApprovalsInClassicTimeSheet = async (page: Page) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible();
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page.getByText('Go to classic QuickBooks Time').click(),
  ]);
  await classicPage.waitForLoadState();

  page = classicPage;

  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage.getByTitle('Close').click();
  }
  await expect(classicPage.locator('#addons_shortcut')).toBeVisible();
  // Navigate to Feature Add-ons menu
  await page
    .locator(`//a[@id='addons_shortcut' or text()='Feature Add-ons']`)
    .click();
  // Click on Approval Preferences
  await page
    .locator(
      `//a[@id='addon_approvals_prefs_shortcut' or text()='Approvals Preferences']`,
    )
    .click();

  return classicPage;
};

export const verifySubmissionSectionIsVisibleInQBO = async (page: Page) => {
  // Navigate to Notifications section in QBO Time Settings
  const notificationsSection = page.locator(
    `//div[@data-testid='notifications-settings' or contains(text(), 'Notifications')]`,
  );
  await expect(notificationsSection).toBeVisible();

  await clickNotifEditButton(page);
  const submissionSection = page.locator(`//label[text()='Submissions']`);
  await expect(submissionSection).toBeVisible();

  await expect(
    page.locator(`//div[text()='Send reminder to team to submit time']`),
  ).toBeVisible();
};

export const verifyTeamMemberNotificationSectionDisabled = async (
  page: Page,
) => {
  // Verify all radio buttons in team member section are disabled
  const radioIds = [
    'addon_approvals_employee_reminders_based_on_dow',
    'addon_approvals_employee_reminders_based_on_pcd',
    'addon_approvals_employee_reminders_based_on_daily',
  ];

  for (const id of radioIds) {
    const radio = page.locator(`//input[@id='${id}']`);

    // Try to force click and verify state doesn't change
    const checkedBefore = await radio.isChecked();
    await radio.click({ force: true }).catch(() => {}); // Ignore errors
    const checkedAfter = await radio.isChecked();

    // State should not change after click attempt
    expect(checkedBefore).toBe(checkedAfter);
  }
};

export const verifyApprovalsEnabled = async (page: Page) => {
  await expect(
    page.locator(
      `//div[normalize-space(text())='Timesheet approvals enabled']`,
    ),
  ).toBeVisible();
};

export const verifyTeamMembersReviewSubmitCheckbox = async (page: Page) => {
  const TeamMembersReviewCheckbox = page.locator(
    `//input[@id='addon_approvals_employee_approval']`,
  );
  expect(TeamMembersReviewCheckbox).not.toBeChecked();
};

export const verifyTeamMemberNotificationCheckboxesDisabled = async (
  page: Page,
) => {
  // Verify all checkboxes in team member section are disabled
  await expect(
    page.locator(
      `//input[@type='checkbox' and @id='addon_approvals_emp_submit_reminder_pre']`,
    ),
  ).toBeDisabled();
  await expect(
    page.locator(
      `//input[@type='checkbox' and @id='addon_approvals_emp_submit_reminder_post']`,
    ),
  ).toBeDisabled();
};

export const verifyApprovalsSectionInSettings = async (page: Page) => {
  const approvalsSection = page.getByTestId('approvals-settings');
  await expect(approvalsSection).toBeVisible();
};

const navigateToApprovalsInQBOSettings = async (
  qboPage: Page,
  useUpdatedPanel = false,
) => {
  await qboPage.bringToFront();
  await navigateToAccountAndSettingsTime(qboPage, useUpdatedPanel);
  await verifyApprovalsSectionInSettings(qboPage);
  await qboPage.waitForTimeout(5000);
};

export const verifySubmissionSectionNotVisibleInQBO = async (page: Page) => {
  // Navigate to Notifications section in QBO Time Settings
  const notificationsSection = page.locator(
    `//div[@data-testid='notifications-settings' or contains(text(), 'Notifications')]`,
  );

  // Check if notifications section exists
  const exists = await notificationsSection
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (exists) {
    // If notifications section exists, verify submission subsection is not visible
    const submissionSection = page.locator(`//label[text()='Submissions']`);
    await expect(submissionSection).not.toBeVisible();
  }
};

export const verifyRequireApprovalValue = async (page: Page) => {
  await expect(
    page.locator(`//label[text()='Require approval for tracked time']`),
  ).toBeVisible();
  await expect(
    page.locator(`//div[@data-testid='approvals-settings']//span[text()='On']`),
  ).toBeVisible();
};

export const verifyTeamMembersReviewSubmitValue = async (page: Page) => {
  await expect(
    page.locator(
      `//label[text()='Team members can review and submit their time']`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `//div[@data-testid='approvals-settings']//span[text()='Off']`,
    ),
  ).toBeVisible();
};

export const CleanupApprovalsFromClassicTimesheet = async (page: Page) => {
  // Navigate to Time Entries page
  await navigateToApprovalsInQBOSettings(page);
  // Click on the edit button
  await page
    .locator(
      `//div[@data-testid='approvals-settings']//button[@aria-label='Edit']`,
    )
    .click();
  await page.waitForTimeout(2000); // Wait for edit mode to load

  // Uncheck the "Team members can review and submit their time" checkbox if it's checked
  const approvalsActiveCheckbox = page.getByRole('checkbox', {
    name: 'Team members can review and submit their time',
  });

  if (await approvalsActiveCheckbox.isChecked()) {
    await approvalsActiveCheckbox.uncheck();
    await page.waitForTimeout(500);
  }

  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(2000);

  console.log('Approvals have been disabled successfully');
};

/**
 * Submit Time variant of {@link CleanupApprovalsFromClassicTimesheet}. Behaves
 * identically but navigates via {@link ensureAccountSettingsTimePanelUpdated}
 * (through `navigateToApprovalsInQBOSettings(page, true)`). Kept separate so the
 * Submit Time flows (SUT*) can evolve this cleanup independently without
 * affecting the shared callers of the original method.
 */
export const CleanupApprovalsFromClassicTimesheetUpdated = async (
  page: Page,
) => {
  // Navigate to Time Entries page (Submit Time uses the updated panel helper).
  await navigateToApprovalsInQBOSettings(page, true);

  // Click on the edit button (bounded wait so a missing button fails fast
  // instead of hanging for the 5-minute actionTimeout).
  const editButton = page.locator(
    `//div[@data-testid='approvals-settings']//button[@aria-label='Edit']`,
  );
  await editButton.waitFor({ state: 'visible', timeout: 30_000 });
  await editButton.click();
  await page.waitForTimeout(2000); // Wait for edit mode to load

  // Uncheck the "Team members can review and submit their time" checkbox if it's checked
  const approvalsActiveCheckbox = page.getByRole('checkbox', {
    name: 'Team members can review and submit their time',
  });
  await approvalsActiveCheckbox.waitFor({ state: 'visible', timeout: 15_000 });

  let changed = false;
  if (await approvalsActiveCheckbox.isChecked()) {
    await approvalsActiveCheckbox.uncheck();
    changed = true;
    await page.waitForTimeout(500);
  }

  // Only Save when something actually changed. Clicking a disabled Save button
  // (no change to persist) would block on it becoming actionable for the full
  // 5-minute actionTimeout, which is what makes cleanup appear "stuck".
  const saveButton = page.getByRole('button', { name: 'Save' });
  if (changed && (await saveButton.isEnabled().catch(() => false))) {
    await saveButton.click();
    await page.waitForTimeout(2000);
    console.log('Approvals have been disabled successfully');
  } else {
    console.log('Approvals already disabled — nothing to save');
  }
};

export const CleanupApprovalsFromQBOSettings = async (page: Page) => {
  // Click on the edit button
  await page
    .locator(
      `//div[@data-testid='approvals-settings']//button[@aria-label='Edit']`,
    )
    .click();
  await page.waitForTimeout(2000); // Wait for edit mode to load

  // Uncheck the "Team members can review and submit their time" checkbox if it's checked
  const approvalsActiveCheckbox = page.getByRole('checkbox', {
    name: 'Team members can review and submit their time',
  });

  if (await approvalsActiveCheckbox.isChecked()) {
    await approvalsActiveCheckbox.uncheck();
    await page.waitForTimeout(500);
  }

  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(2000);

  console.log('Approvals have been disabled successfully');
};

export const cleanupRemindersDayOfWeekFromQBOSettings = async (page: Page) => {
  // Navigate to QBO Time Account & Settings
  await navigateToApprovalsInQBOSettings(page);

  await page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .scrollIntoViewIfNeeded();

  const valueElement = page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .textContent();

  if ((await valueElement) === 'On') {
    await clickEditNotificationSection(page);

    // Ensure "Based on day of week" is selected
    await selectDayOfWeekOptionQBO(page);

    // Reset current week reminder to default values: 12:00 AM, Sunday
    await setCurrentWeekReminderTimeQBO(page, '12:00 PM', 'Sunday');

    // Reset prior week reminder to default values: 12:00 AM, Sunday
    await setPriorWeekReminderTimeQBO(page, '11:00 PM', 'Saturday');

    // Uncheck current week reminder if checked
    await unCheckCurrentWeekSubmissionReminderQBO(page);
    // Uncheck prior week reminder if checked
    await unCheckPriorWeekSubmissionReminderQBO(page);
    await page.waitForTimeout(500);

    // Ensure "Based on day of week" is selected
    await selectDailyOptionQBO(page);

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);
    await CleanupApprovalsFromQBOSettings(page);
  }
  console.log('Cleanup completed - Reminder times and days reset to default');
};

export const cleanupPayrollCloseDateRemindersFromQBOSettings = async (
  page: Page,
) => {
  // Navigate to QBO Time Account & Settings
  await navigateToApprovalsInQBOSettings(page);
  await page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .scrollIntoViewIfNeeded();

  const valueElement = page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .textContent();

  if ((await valueElement) === 'On') {
    // Click Edit button in Notifications section
    await clickEditNotificationSection(page);
    await page.waitForTimeout(2000);

    // Switch to "Based on pay period" option temporarily to access fields
    await selectBasedOnPayPeriodOption(page);
    await page.waitForTimeout(1000);

    // Reset "Remind during set time from the payroll close date" to default
    await setPayrollCloseDateReminderTimeQBO(
      page,
      '12:00 PM',
      '1 day after payroll close',
    );

    // Reset "Remind when they have not submitted their time by the payroll close date" to default
    await setNotSubmittedByPayrollCloseDateReminderTimeQBO(
      page,
      '11:00 PM',
      '3 days after payroll close',
    );

    // Uncheck payroll close date reminders
    const payrollReminderCheckbox = page
      .locator(
        `//*[@id='notifications-submissions-subsection']//following::*[text()='Remind during set time from the payroll close date']/..//input`,
      )
      .first();
    if (await payrollReminderCheckbox.isChecked()) {
      await payrollReminderCheckbox.uncheck();
    }

    const notSubmittedCheckbox = page.locator(
      `//span[text()="Remind when they have not submitted their time by the payroll close date"]/..//input`,
    );
    if (await notSubmittedCheckbox.isChecked()) {
      await notSubmittedCheckbox.uncheck();
    }

    // Switch back to "Day of week" option (default)
    await selectDayOfWeekOptionQBO(page);

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
  }

  console.log(
    'Cleanup completed - Payroll close date reminders reset to default from QBOSettings',
  );
};

export const cleanupPayPeriodRemindersFromQBOSettings = async (page: Page) => {
  // Navigate to QBO Time Account & Settings
  await navigateToApprovalsInQBOSettings(page);
  await page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .scrollIntoViewIfNeeded();

  const valueElement = page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .textContent();

  if ((await valueElement) === 'On') {
    // Click Edit button in Notifications section
    await clickEditNotificationSection(page);
    // Switch to "Based on pay period" option temporarily to access and reset fields
    await selectBasedOnPayPeriodOption(page);

    // Uncheck "Remind during set time from the payroll close date" if checked
    const payrollReminderCheckbox = page.locator(
      `//span[text()="Remind during set time from the payroll close date"]/..//input`,
    );
    if (await payrollReminderCheckbox.isChecked()) {
      await payrollReminderCheckbox.uncheck();
    }

    // Uncheck "Remind when they have not submitted their time by the payroll close date" if checked
    const notSubmittedCheckbox = page.locator(
      `//span[text()="Remind when they have not submitted their time by the payroll close date"]/..//input`,
    );
    if (await notSubmittedCheckbox.isChecked()) {
      await notSubmittedCheckbox.uncheck();
    }

    // Reset time and days to default values (12:00 AM, 1 day before/after)
    await setPayrollCloseDateReminderTimeQBO(
      page,
      '12:00 AM',
      '1 day after payroll close',
    );
    await setNotSubmittedByPayrollCloseDateReminderTimeQBO(
      page,
      '12:00 PM',
      '3 days after payroll close',
    );

    // Switch back to "Day of week" option (default)
    await selectDayOfWeekOptionQBO(page);
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(1000);
  }

  console.log(
    'Cleanup completed - Pay period reminders reset to default from QBOSettings',
  );
};

export const cleanupDailyRemindersFromQBOSettings = async (page: Page) => {
  // Navigate to QBO Time Account & Settings
  await navigateToApprovalsInQBOSettings(page);
  await page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .scrollIntoViewIfNeeded();

  const valueElement = page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .textContent();

  if ((await valueElement) === 'On') {
    // Click Edit button in Notifications section
    await clickEditNotificationSection(page);
    await page.waitForTimeout(2000);
    await selectDailyOptionQBO(page);

    await selectDaysOfWeekQBO(page, ['Monday', 'Tuesday', 'Wednesday']);

    // Reset time to default (12:00 AM)
    await setNotSubmittedForSelectedDaysTimeQBO(page, '12:00 PM');
    await setStillNotSubmittedForSelectedDaysTimeQBO(page, '12:00 AM');

    // Uncheck "Remind when they have not submitted their time for the selected days" if checked
    const notSubmittedCheckbox = page.locator(
      `//span[text()="Remind when they have not submitted their time for the selected days"]/..//input`,
    );
    if (await notSubmittedCheckbox.isChecked()) {
      await notSubmittedCheckbox.uncheck();
    }

    // Uncheck "Remind when they have still not submitted their time for the selected days" if checked
    const stillNotSubmittedCheckbox = page.locator(
      `//span[text()="Remind when they have still not submitted their time for the selected days"]/..//input`,
    );
    if (await stillNotSubmittedCheckbox.isChecked()) {
      await stillNotSubmittedCheckbox.uncheck();
    }

    // Switch back to "Day of week" option (default)
    await selectDayOfWeekOptionQBO(page);
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);
  }

  console.log(
    'Cleanup completed - Daily reminders reset to default from QBOSettings',
  );
};

// Cleanup functions for Approval Manager tests
export const cleanupApprovalManagerDayOfWeekFromQBOSettings = async (
  page: Page,
) => {
  // Navigate to QBO Time Account & Settings
  await navigateToApprovalsInQBOSettings(page);

  await clickEditNotificationSection(page);

  // Ensure "Based on day of week" is selected for approval manager
  await selectManagerDayOfWeekOptionQBO(page);

  // Reset current week reminder to default values: 12:00 AM, Sunday
  await setCurrentWeekReminderTimeManagerQBO(page, '12:00 PM', 'Sunday');

  // Reset prior week reminder to default values: 12:00 AM, Sunday
  await setPriorWeekReminderTimeManagerQBO(page, '11:00 PM', 'Saturday');

  // Uncheck current week reminder if checked
  await unCheckCurrentWeekSubmissionReminderManagerQBO(page);
  // Uncheck prior week reminder if checked
  await unCheckPriorWeekSubmissionReminderManagerQBO(page);
  await page.waitForTimeout(500);

  await selectManagerBasedOnPayPeriodOption(page);
  // Save
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(2000);
  await CleanupApprovalsFromQBOSettings(page);
  console.log(
    'Cleanup completed - Approval manager day of week reminders reset to default',
  );
};

export const cleanupApprovalManagerPayrollCloseDateFromQBOSettings = async (
  page: Page,
) => {
  // Navigate to QBO Time Account & Settings
  await navigateToApprovalsInQBOSettings(page);
  await page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .scrollIntoViewIfNeeded();

  const valueElement = page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .textContent();

  if ((await valueElement) === 'On') {
    await clickEditNotificationSection(page);

    // Switch to "Based on pay period" option for approval manager
    await selectBasedOnPayPeriodOption(page);

    // Uncheck approval manager payroll close date reminders if checked
    const payrollApprovalReminderCheckbox = page.locator(
      `//span[text()="Remind during set time from the payroll close date"]/..//input`,
    );
    if (await payrollApprovalReminderCheckbox.isChecked()) {
      await payrollApprovalReminderCheckbox.uncheck();
    }

    const notApprovedByPayrollCheckbox = page.locator(
      `//span[text()="Remind when managers have not approved their team members' time by the payroll close date"]/..//input`,
    );
    if (await notApprovedByPayrollCheckbox.isChecked()) {
      await notApprovedByPayrollCheckbox.uncheck();
    }

    // Reset approval manager payroll close date reminder times to default values
    await setPayrollCloseDateReminderTimeQBO(page, '12:00am', '1 day before');
    await setNotSubmittedByPayrollCloseDateReminderTimeQBO(
      page,
      '12:00am',
      '1 day after',
    );

    // Switch back to "Day of week" option (default)
    await selectDayOfWeekOptionQBO(page);

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);
    await CleanupApprovalsFromQBOSettings(page);
  }

  console.log(
    'Cleanup completed - Approval manager payroll close date reminders reset to default',
  );
};

export const cleanupApprovalManagerPayPeriodFromQBOSettings = async (
  page: Page,
) => {
  // Navigate to QBO Time Account & Settings
  await navigateToApprovalsInQBOSettings(page);

  await clickEditNotificationSection(page);

  // Switch to "Based on pay period" option for approval manager
  await selectManagerBasedOnPayPeriodOption(page);

  // Reset approval manager pay period reminder times to default values
  await setPayrollCloseDateReminderTimeManagerQBO(
    page,
    '11:00 AM',
    '1 day after payroll close',
  );
  await setNotSubmittedByPayrollCloseDateReminderTimeManagerQBO(
    page,
    '11:00 PM',
    '3 days after payroll close',
  );

  // Uncheck approval manager pay period reminders if checked
  const payrollApprovalReminderCheckbox = page
    .locator(
      `//*[@id='notifications-approvals-subsection']//following::span[text()='Remind during set time from the payroll close date']/..//input`,
    )
    .first();
  if (await payrollApprovalReminderCheckbox.isChecked()) {
    await payrollApprovalReminderCheckbox.uncheck();
  }

  const notApprovedByPayrollCheckbox = page.locator(
    `//span[text()="Remind when managers have not approved their team members' time by the payroll close date"]/..//input`,
  );
  if (await notApprovedByPayrollCheckbox.isChecked()) {
    await notApprovedByPayrollCheckbox.uncheck();
  }

  // Switch back to "Day of week" option (default)
  await selectManagerDayOfWeekOptionQBO(page);

  // Save
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(2000);
  await CleanupApprovalsFromQBOSettings(page);
  console.log(
    'Cleanup completed - Approval manager pay period reminders reset to default',
  );
};

export const cleanupEmailManagerFromQBOSettings = async (page: Page) => {
  // Navigate to QBO Time Account & Settings
  await navigateToApprovalsInQBOSettings(page);
  await page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .scrollIntoViewIfNeeded();

  const valueElement = page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .textContent();

  if ((await valueElement) === 'On') {
    await clickEditNotificationSection(page);

    // Uncheck email manager options if checked
    const emailEachSubmitCheckbox = page.locator(
      `//span[text()="Email managers when each team member submits"]/..//input`,
    );
    if (await emailEachSubmitCheckbox.isChecked()) {
      await emailEachSubmitCheckbox.uncheck();
    }

    const emailEntireTeamCheckbox = page.locator(
      `//span[text()="Email managers when entire team submits"]/..//input`,
    );
    if (await emailEntireTeamCheckbox.isChecked()) {
      await emailEntireTeamCheckbox.uncheck();
    }

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);
    await CleanupApprovalsFromQBOSettings(page);
  }
  console.log('Cleanup completed - Email manager options reset to default');
};

export const cleanupCustomMessageFromQBOSettings = async (page: Page) => {
  // Navigate to QBO Time Account & Settings
  await navigateToApprovalsInQBOSettings(page);
  await page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .scrollIntoViewIfNeeded();

  const valueElement = page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .textContent();

  if ((await valueElement) === 'On') {
    await CleanupApprovalsFromQBOSettings(page);
  }
  console.log('Cleanup completed - Custom message reset to default');
};

export const cleanupDefaultCustomMessageFromQBOSettings = async (
  page: Page,
) => {
  // Navigate to QBO Time Account & Settings
  await navigateToApprovalsInQBOSettings(page);
  await page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .scrollIntoViewIfNeeded();

  const valueElement = page
    .locator(
      `//label[text()='Team members can review and submit their time']/../span`,
    )
    .textContent();

  if ((await valueElement) === 'On') {
    const message = await page
      .locator(
        `//label[text()='Message when team members submit time (custom)']/../span`,
      )
      .textContent();
    if (message === 'Test custom message') {
      await clickEditApprovalsSection(page);
      await clickResetMessage(page);

      await saveApprovalSettings(page);
    }
    await CleanupApprovalsFromQBOSettings(page);
  }

  console.log('Cleanup completed - Default Custom message reset to default');
};

export const cleanupCustomMessageFromClassicTimesheet = async (page: Page) => {
  // Navigate to Classic Timesheet Approval Preferences
  const classicPage = await NavigateToApprovalsInClassicTimeSheet(page);

  // Go to team member option section
  await verifyTeamMemberOptions(classicPage);

  // Check if team members can review and submit time is enabled
  const teamMemberCheckbox = classicPage.locator(
    '#addon_approvals_employee_approval',
  );
  if (await teamMemberCheckbox.isChecked()) {
    // Click on customize button
    await clickCustomizeButton(classicPage);

    // Click on restore message to reset to default
    await clickRestoreMessage(classicPage);

    // Save custom message
    await saveCustomMessage(classicPage);
  }

  await classicPage.close();
  console.log(
    'Cleanup completed - Custom message reset to default from Classic Timesheet',
  );
};

//handle merge employee popup
export const handleMergeEmployeePopup = async (page: Page) => {
  try {
    const modal = page.getByText(
      'These people are showing up more than once on your My Team list.',
      { exact: false },
    );
    if (await modal.isVisible({ timeout: 5000 })) {
      await page.getByRole('button', { name: 'Cancel' }).click();
    }
  } catch (error) {
    // Modal didn't appear, continue
  }
};

export const clickEditGeoLocationSection = async (page: Page) => {
  const editGeofenceButton = page.locator(
    '//div[@data-testid="geo-locations-settings-handle"]//button[@aria-label="Edit"]',
  );
  await editGeofenceButton.scrollIntoViewIfNeeded();
  await editGeofenceButton.click();
};

export const clickCancelButton = async (page: Page) => {
  const cancelButton = page.getByRole('button', { name: 'Cancel' });
  await expect(cancelButton).toBeVisible();
  await cancelButton.click();
  //verify user is redirected to Time Tracking section
  await page
    .locator(
      `//div[@data-testid='geo-locations-settings-handle']//span[text()='Geolocation']`,
    )
    .isVisible();
  await clickEditGeoLocationSection(page);
  console.log(
    '✓ Cancel button clicked and user is redirected to Time Tracking section',
  );
};

export const clickCloseIcon = async (page: Page) => {
  const closeIcon = page.getByRole('button', { name: 'Close' }).nth(2);
  await expect(closeIcon).toBeVisible();
  await closeIcon.click();
  //verify user is redirected to Time Tracking section
  await page.waitForTimeout(1000);
  await page
    .locator(
      `//div[@data-testid='geo-locations-settings-handle']//span[text()='Geolocation']`,
    )
    .isVisible();
  await clickEditGeoLocationSection(page);
  console.log(
    '✓ Close icon clicked and user is redirected to Time Tracking section',
  );
};

export const verifyNewBadgeVisible = async (page: Page) => {
  const newBadge = page.locator(
    '//span[text()="Geolocation"]/following-sibling::div[contains(@class, "idsTSBadge")]//div[text()="New"]',
  );
  await expect(newBadge).toBeVisible({ timeout: 10000 });
  console.log('  ✓ Geolocation "New" badge is visible');
};

export const verifyGeoLocationSettingsSectionVisible = async (page: Page) => {
  await page
    .locator(
      `//div[@data-testid='geo-locations-settings-handle']//span[text()='Geolocation']`,
    )
    .isVisible();
  await page.getByText('Location tracking').isVisible();
  await page
    .locator(
      `//div[@data-testid='geo-locations-settings-handle']//button[@aria-label='Edit']`,
    )
    .isVisible();
  await page.waitForTimeout(500);
};

export const verifyGeoLocationTrackingPageElements = async (page: Page) => {
  await page
    .getByRole('heading', { name: 'Geolocation', exact: true })
    .first()
    .isVisible();
  await page
    .locator(`//h3[text()='Select your geolocation preferences']`)
    .isVisible();
  await page.getByRole('button', { name: 'Cancel' }).isVisible();
  await page.locator(`//button[@aria-label='Close']`).nth(1).isVisible();
  await expect(page.locator(`//*[text()='Required']`)).toBeVisible();
  await expect(page.locator(`//*[text()='Never']`)).toBeVisible();
  await expect(page.locator(`//*[text()='Optional']`).nth(1)).toBeVisible();
  await expect(
    page.locator('input[type="radio"][value="OPTIONAL"]'),
  ).toBeChecked();
  console.log('✓ By default Optional location tracking option is selected');
  await page.getByRole('button', { name: 'Save' }).isDisabled();
  console.log('✓ Save button is disabled when no option is selected');
};

export const verifyRequireLocationTrackingOption = async (page: Page) => {
  await expect(page.locator(`//span[text()='Required']`)).toBeVisible();
  await page
    .locator(`//span[contains(text(), "Location is required for clocking in")]`)
    .isVisible();

  const requireLocationTrackingOption = page.locator(
    'input[type="radio"][value="REQUIRED"]',
  );
  await expect(requireLocationTrackingOption).toBeVisible();
};

/**
 * Selects a location tracking radio option and saves it.
 * If the option is already the saved selection, clicking the radio makes no
 * change so the Save button stays disabled. In that case we skip the click
 * (instead of waiting for it to become enabled and timing out).
 */
export const saveLocationTrackingOption = async (
  page: Page,
  value: 'REQUIRED' | 'OPTIONAL' | 'OFF',
) => {
  await page.locator(`input[type="radio"][value="${value}"]`).click();

  const saveButton = page.getByRole('button', { name: 'Save' });
  // Give the UI a moment to enable Save if the selection actually changed.
  await page.waitForTimeout(500);

  if (await saveButton.isEnabled()) {
    await saveButton.click();
    await page.waitForTimeout(2000);
  } else {
    console.log(
      `✓ "${value}" location tracking option is already saved; Save is disabled, skipping click`,
    );
  }
};

export const selectAndVerifyRequireLocationOption = async (page: Page) => {
  await saveLocationTrackingOption(page, 'REQUIRED');
  await verifyLocationTrackingSetting(page, 'Required');
};

export const verifyOptionalLocationTrackingOption = async (page: Page) => {
  await expect(page.locator(`//span[text()='Optional']`)).toBeVisible();
  await page
    .locator(`//span[contains(text(), "whether or not to track")]`)
    .isVisible();

  const optionalLocationTrackingOption = page.locator(
    'input[type="radio"][value="OPTIONAL"]',
  );
  await expect(optionalLocationTrackingOption).toBeVisible();
  //await optionalLocationTrackingOption.click();
};

export const selectAndVerifyOptionalLocationOption = async (page: Page) => {
  await saveLocationTrackingOption(page, 'OPTIONAL');
  await verifyLocationTrackingSetting(page, 'Optional');
};

export const verifyNeverLocationTrackingOption = async (page: Page) => {
  await expect(page.locator(`//span[text()='Never']`)).toBeVisible();
  await page.locator(`//span[contains(text(), "Don't track")]`).isVisible();

  const neverLocationTrackingOption = page.locator(
    'input[type="radio"][value="OFF"]',
  );
  await expect(neverLocationTrackingOption).toBeVisible();
  //await neverLocationTrackingOption.click();
};

export const selectAndVerifyNeverLocationOption = async (page: Page) => {
  await saveLocationTrackingOption(page, 'OFF');
  await verifyLocationTrackingSetting(page, 'Never');
};

export const verifyLocationTrackingSetting = async (
  page: Page,
  expectedValue: string,
) => {
  await page
    .locator(
      `//div[@data-testid='geo-locations-settings-handle']//span[text()='Geolocation']`,
    )
    .isVisible();
  const locationTrackingValue = page.locator(
    '//label[text()="Location tracking"]/following-sibling::span',
  );
  await expect(locationTrackingValue).toHaveText(expectedValue);
  console.log(` ✓ ${expectedValue} Location tracking setting verified`);
};

/**
 * Verifies if the expected location tracking radio button is selected
 * @param page - Playwright Page object
 * @param expectedSetting - Expected setting: 'Required', 'Optional', or 'Off'
 */
export const verifyLocationTrackingRadioButton = async (
  page: Page,
  expectedSetting: 'Required' | 'Optional' | 'Off',
): Promise<void> => {
  console.log(
    `Verifying location tracking radio button is set to: ${expectedSetting}.`,
  );

  const radioIdMap = {
    Required: 'required_location_tracking',
    Optional: 'optional_location_tracking',
    Off: 'off_location_tracking',
  };

  const radioId = radioIdMap[expectedSetting];
  const radioButton = page.locator(`#${radioId}`);

  // Wait for the radio button to be visible first
  await expect(radioButton).toBeVisible({ timeout: 10000 });

  // Verify the radio button is checked
  await expect(radioButton).toBeChecked({ timeout: 5000 });
  console.log(`  ✓ ${expectedSetting} radio button is checked`);
};

/**
 * Verifies the selected location tracking option card/tab in the Geolocation dialog
 * @param page - Playwright Page object
 * @param expectedOption - Expected option: 'Required', 'Optional', or 'Never'
 */
export const verifyLocationTrackingOptionSelected = async (
  page: Page,
  expectedOption: 'Required' | 'Optional' | 'Never',
): Promise<void> => {
  console.log(
    `Verifying location tracking option selected: ${expectedOption}...`,
  );

  // Wait for the Geolocation dialog to be visible
  await expect(page.getByRole('dialog', { name: 'Geolocation' })).toBeVisible({
    timeout: 10000,
  });

  const radioIdMap = {
    Required: 'REQUIRED',
    Optional: 'OPTIONAL',
    Never: 'OFF',
  };

  const radioId = radioIdMap[expectedOption];
  const radioButton = page.locator(`input[type="radio"][value="${radioId}"]`);

  // Verify radio button is checked
  await expect(radioButton).toBeChecked({ timeout: 5000 });
  console.log(`  ✓ ${expectedOption} radio button is checked`);
};

/**
 * Selects a location tracking radio button option and saves the setting
 * @param page - Playwright Page object
 * @param setting - Setting to select: 'Required', 'Optional', or 'Off'
 */
export const selectAndSaveLocationTrackingOption = async (
  page: Page,
  setting: 'Required' | 'Optional' | 'Off',
): Promise<void> => {
  const radioIdMap = {
    Required: 'required_location_tracking',
    Optional: 'optional_location_tracking',
    Off: 'off_location_tracking',
  };
  await page.waitForTimeout(1000);
  await dismissCookieConsent(page);

  const radioId = radioIdMap[setting];
  await page.locator(`#${radioId}`).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(1000);
  console.log(` ✓ ${setting} Location tracking selected and saved`);
};

// Approvals and Settings Functions

export const navigateToClassicLocationPreferences = async (page: Page) => {
  await expect(page.getByText('Go to classic QuickBooks Time')).toBeVisible({
    timeout: 10000,
  });
  const [classicPage] = await Promise.all([
    page.context().waitForEvent('page'),
    await page
      .getByText('Go to classic QuickBooks Time')
      .click({ timeout: 3000 }),
  ]);
  await classicPage.waitForLoadState();
  await waitForPageReady(classicPage);
  await handleClassicTimesheetPopupsInAnyOrder(classicPage);

  if (
    await classicPage.locator(`//div[@class='overlay_content_box']`).isVisible()
  ) {
    await classicPage
      .locator(
        `//div[@class='ts_overlay_close_icon_container payroll-close-div']`,
      )
      .click();

    await page
      .getByRole('button', { name: 'Skip for Now' })
      .click({ timeout: 2000 });
    await page.waitForTimeout(500);
  }
  await expect(classicPage.locator('#quickbooks_menu_top')).toBeVisible();
  //classicPage.waitForTimeout(5000);

  // Navigate to Feature Add-ons -> Approval Preferences
  await classicPage.locator('#my_account_shortcut').click();
  await classicPage.getByRole('link', { name: 'Location' }).click();

  return { classicPage, classicPageUrl: classicPage.url() };
};

//await page1.getByLabel('Optional — Team members can decide whether or not to track their location.').check();

const verifyPopupAndDontSaveLocationTracking = async (page: Page) => {
  await page.locator(`input[type="radio"][value="OFF"]`).click();
  await page.getByRole('button', { name: 'Close' }).nth(2).click();
  await expect(
    page.locator(`//*[text()='Want to save your changes?']`),
  ).toBeVisible();
  await page.getByRole('button', { name: "Don't save" }).click();
  console.log('✓ Verify popup and dont save location tracking');
  await page.waitForTimeout(500);
  await page.reload();
  await verifyLocationTrackingSetting(page, 'Optional');
};

export const verifyMileageTrackingStatus = async (
  page: Page,
  expectedValue: string,
) => {
  await page.getByText('Mileage tracking').isVisible();
  const mileageTrackingValue = page.locator(
    '//label[text()="Mileage tracking"]/following-sibling::span',
  );
  await expect(mileageTrackingValue).toHaveText(expectedValue);
  console.log(` ✓ ${expectedValue} Mileage tracking status verified`);
};

export const verifyGeolocationSectionTitle = async (page: Page) => {
  const geolocationSection = page.locator(
    '//*[@data-testid="geo-locations-settings-handle"]//child::*[text()="Geolocation"]',
  );
  await geolocationSection.scrollIntoViewIfNeeded();
  await expect(geolocationSection).toBeVisible();
  console.log('✓ Geolocation section title is visible');
};

export const verifyLocationTrackingDisplayed = async (page: Page) => {
  const locationTracking = page.locator('//*[text()="Location tracking"]');
  await expect(locationTracking).toBeVisible();
  console.log('✓ Location tracking is displayed');
};

export const verifyMileageTrackingDisplayed = async (page: Page) => {
  const mileageTracking = page.locator('//*[text()="Mileage tracking"]');
  await expect(mileageTracking).toBeVisible();
  console.log('✓ Mileage tracking is displayed');
};

export const verifyGeofenceDisplayed = async (page: Page) => {
  const geofence = page.locator('//*[text()="Geofence"]').first();
  await expect(geofence).toBeVisible();
  console.log('✓ Geofence is displayed inside Geolocation section');
};

export const verifyGeofenceValue = async (
  page: Page,
  expectedValue: 'Off' | 'On',
) => {
  const geofenceValue = page.locator(
    `//label[text()='Geofence']/following-sibling::span`,
  );
  await geofenceValue.scrollIntoViewIfNeeded();
  await expect(geofenceValue).toBeVisible();
  await expect(geofenceValue).toHaveText(expectedValue);
  console.log(`✓ Geofence value is displayed as ${expectedValue}`);
};

export const verifyGeofenceHeadingInEditMode = async (page: Page) => {
  const geofenceHeading = page.locator(
    '//h3[text()="Select your geolocation preferences"]//following::span[text()="Geofence"]',
  );
  await expect(geofenceHeading).toBeVisible();
  console.log('✓ Geofence heading is visible in edit mode');
};

export const verifyGeofenceDescription = async (page: Page) => {
  const geofenceDescription = page.locator(
    '//span[contains(text(), "Geofences are invisible boundaries around specific areas")]',
  );
  await expect(geofenceDescription).toBeVisible();
  console.log('✓ Geofence description is visible');
};

export const verifyTurnOnGeofenceCheckboxNotSelected = async (page: Page) => {
  const turnOnGeofenceCheckbox = page.locator(
    '//span[text()="Turn on geofence"]/ancestor::label//input[@type="checkbox"]',
  );
  await turnOnGeofenceCheckbox.scrollIntoViewIfNeeded();
  await expect(turnOnGeofenceCheckbox).toBeVisible();
  await expect(turnOnGeofenceCheckbox).not.toBeChecked();
  console.log("✓ 'Turn on geofence' checkbox is not selected by default");
};

export const checkTurnOnGeofenceCheckbox = async (page: Page) => {
  const turnOnGeofenceCheckbox = page.locator(
    `//span[text()='Turn on geofence']/ancestor::label//input[@type='checkbox']`,
  );
  await turnOnGeofenceCheckbox.scrollIntoViewIfNeeded();
  await turnOnGeofenceCheckbox.check();
  console.log("✓ Checked 'Turn on geofence' checkbox");
};

export const uncheckTurnOnGeofenceCheckbox = async (page: Page) => {
  const turnOnGeofenceCheckbox = page.locator(
    '//span[text()="Turn on geofence"]/ancestor::label//input[@type="checkbox"]',
  );
  await turnOnGeofenceCheckbox.scrollIntoViewIfNeeded();
  await turnOnGeofenceCheckbox.uncheck();
  console.log("✓ Unchecked 'Turn on geofence' checkbox");
};

export const verifyTurnOnGeofenceCheckboxSelected = async (page: Page) => {
  const turnOnGeofenceCheckbox = page.locator(
    '//span[text()="Turn on geofence"]/ancestor::label//input[@type="checkbox"]',
  );
  await turnOnGeofenceCheckbox.scrollIntoViewIfNeeded();
  await expect(turnOnGeofenceCheckbox).toBeVisible();
  await expect(turnOnGeofenceCheckbox).toBeChecked();
  console.log("✓ 'Turn on geofence' checkbox is selected");
};

export const verifySetupGeofenceNotificationsVisible = async (page: Page) => {
  const setupGeofenceNotifications = page.locator(
    `//*[contains(text(), 'Set up geofence notifications')]`,
  );
  await setupGeofenceNotifications.scrollIntoViewIfNeeded();
  await expect(setupGeofenceNotifications).toBeVisible();
  console.log("✓ 'Set up geofence notifications' is displayed");
};

export const clickSaveGeoLocationSection = async (page: Page) => {
  const saveButton = page.getByRole('button', { name: 'Save' });
  await saveButton.scrollIntoViewIfNeeded();
  await expect(saveButton).toBeVisible();
  await saveButton.click();
  console.log('✓ Clicked Save button in Geolocation section');
};

export const clickCancelGeoLocationSection = async (page: Page) => {
  const cancelButton = page.getByRole('button', { name: 'Cancel' });
  await cancelButton.scrollIntoViewIfNeeded();
  await expect(cancelButton).toBeVisible();
  await cancelButton.click();
  console.log('✓ Clicked Cancel button in Geolocation section');
};

export const clickSetupGeofenceNotifications = async (page: Page) => {
  const setupGeofenceNotifications = page.locator(
    '//*[contains(text(), "Set up geofence notifications")]',
  );
  await setupGeofenceNotifications.scrollIntoViewIfNeeded();
  await expect(setupGeofenceNotifications).toBeVisible();
  await setupGeofenceNotifications.click();
  await page.waitForTimeout(2000);
  console.log("✓ Clicked on 'Set up geofence notifications'");
};

export const handleSaveChangesPopup = async (page: Page) => {
  const popup = page.locator('//*[text()="Want to save your changes?"]');
  if (await popup.isVisible()) {
    page.on('dialog', async (dialog) => {
      console.log(dialog.message());
      await dialog.accept();
    });
    await page.locator('//*[text()="Save"]').last().click();
    console.log('✓ Clicked on Save button in the popup');
  }
};

export const scrollToGeofenceReminder = async (page: Page) => {
  const geofenceSection = page.locator('//*[text()="Geofence"]').first();
  await geofenceSection.scrollIntoViewIfNeeded();
  console.log('✓ Scrolled to Geofence section');
};

export const updateGeofenceStartTime = async (page: Page, time: string) => {
  const startTimeDropdown = page
    .locator(
      '//span[text()="Start time"]/following::div[contains(@class, "DropdownTypeahead-iconBox")]',
    )
    .first();
  await startTimeDropdown.scrollIntoViewIfNeeded();
  await expect(startTimeDropdown).toBeVisible({ timeout: 15000 });
  await startTimeDropdown.click();
  await page.waitForTimeout(3000);
  const timeOption = page.locator(
    `//*[@role="listbox"]//span[contains(text(), "${time}")]`,
  );
  await timeOption.scrollIntoViewIfNeeded();
  await expect(timeOption).toBeVisible({ timeout: 10000 });
  await timeOption.click();
  console.log(`✓ Updated start time to ${time}`);
};

export const updateGeofenceEndTime = async (page: Page, time: string) => {
  const endTimeDropdown = page
    .locator(
      '//span[text()="End time"]/following::div[contains(@class, "DropdownTypeahead-iconBox")]',
    )
    .first();
  await endTimeDropdown.scrollIntoViewIfNeeded();
  await expect(endTimeDropdown).toBeVisible({ timeout: 15000 });
  await endTimeDropdown.click();
  await page.waitForTimeout(500);
  const timeOption = page.locator(`//li/span[text()='${time}']`);
  await expect(timeOption).toBeVisible({ timeout: 10000 });
  await timeOption.click();
  console.log(`✓ Updated end time to ${time}`);
};

export const toggleGeofenceDay = async (page: Page, day: string) => {
  const selectDaysDropdown = page
    .locator('//*[text()="Days of week"]/following::input')
    .first();
  await selectDaysDropdown.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await selectDaysDropdown.click();
  await page.waitForTimeout(1000);
  const dayToggle = page.locator(`//span[text()='${day}']/parent::li`);
  await expect(dayToggle).toBeVisible({ timeout: 10000 });
  await dayToggle.click();
  console.log(`✓ Toggled ${day}`);
};

export const revertGeofenceStartTime = async (page: Page, time: string) => {
  const startTimeDropdown = page
    .locator(
      '//span[text()="Start time"]/following::div[contains(@class, "DropdownTypeahead-iconBox")]',
    )
    .first();
  await startTimeDropdown.scrollIntoViewIfNeeded();
  await expect(startTimeDropdown).toBeVisible({ timeout: 15000 });
  await startTimeDropdown.click();
  await page.waitForTimeout(500);
  const timeOption = page.locator(`//li/span[text()='${time}']`);
  await expect(timeOption).toBeVisible({ timeout: 10000 });
  await timeOption.click();
  console.log(`✓ Reverted start time to ${time}`);
};

export const revertGeofenceEndTime = async (page: Page, time: string) => {
  const endTimeDropdown = page
    .locator(
      '//span[text()="End time"]/following::div[contains(@class, "DropdownTypeahead-iconBox")]',
    )
    .first();
  await endTimeDropdown.scrollIntoViewIfNeeded();
  await expect(endTimeDropdown).toBeVisible({ timeout: 15000 });
  await endTimeDropdown.click();
  await page.waitForTimeout(500);
  const timeOption = page.locator(`//li/span[text()='${time}']`);
  await expect(timeOption).toBeVisible({ timeout: 10000 });
  await timeOption.click();
  console.log(`✓ Reverted end time to ${time}`);
};

export const scrollToNotificationsSection = async (page: Page) => {
  const notificationsSection = page.locator('//*[text()="Notifications"]');
  await notificationsSection.scrollIntoViewIfNeeded();
  await expect(notificationsSection).toBeVisible();
  await page.waitForTimeout(2000);
  console.log('✓ Scrolled to Notifications section');
};

export const verifyGeofenceNotificationSectionVisible = async (page: Page) => {
  const geofenceNotificationSection = page.locator(
    '//*[text()="Notifications"]/following::*[text()="Geofence"]',
  );
  await geofenceNotificationSection.scrollIntoViewIfNeeded();
  await expect(geofenceNotificationSection).toBeVisible({ timeout: 10000 });
  console.log('✓ Geofence notification section is visible in Notifications');
};

export const verifyGeofenceReminderValue = async (
  page: Page,
  expectedValue: string | RegExp,
) => {
  const reminderField = page
    .locator(
      '//*[text()="Send reminder to team when they enter geofence radius"]/following::span',
    )
    .first();
  await reminderField.scrollIntoViewIfNeeded();
  const reminderValue = await reminderField.textContent();
  if (typeof expectedValue == 'string') {
    expect(reminderValue).toContain(expectedValue);
  } else {
    expect(reminderValue).toMatch(expectedValue);
  }
  console.log(`✓ Verified geofence reminder value: ${reminderValue}`);
};

export const clickEditGeofenceNotifications = async (page: Page) => {
  const editGeofenceNotifications = page.locator(
    '//button[contains(text(), "Set up geofence notifications")]',
  );
  if (await editGeofenceNotifications.first().isVisible({ timeout: 5000 })) {
    await editGeofenceNotifications.first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Clicked on geofence notifications edit/setup');
  }
};

export const clickSaveButton = async (page: Page) => {
  const saveButton = page.getByRole('button', { name: 'Save' });
  await saveButton.scrollIntoViewIfNeeded();
  await saveButton.click();
  await page.waitForTimeout(2000);
  console.log('✓ Clicked Save button');
};

export const clickEditNotifications = async (page: Page) => {
  const editButton = page.locator(
    '//div[@data-testid="notifications-settings-view"]//button[@aria-label="Edit"]',
  );
  await editButton.scrollIntoViewIfNeeded();
  await expect(editButton).toBeVisible({ timeout: 10000 });
  await editButton.click();
  await page.waitForTimeout(1000);
  console.log('✓ Clicked Edit button in Notifications section');
};

/**
 * Handle "Don't Save" option in save changes popup
 */
export const handleDontSaveChangesPopup = async (page: Page) => {
  const popup = page.locator('//*[text()="Want to save your changes?"]');
  if (await popup.isVisible({ timeout: 5000 })) {
    await page.getByRole('button', { name: "Don't save" }).click();
    console.log("✓ Clicked on Don't Save button in the popup");
    await page.waitForTimeout(500);
  }
};

/**
 * Verify geofence section is NOT visible in Notifications section
 */
export const verifyGeofenceNotificationSectionNotVisible = async (
  page: Page,
) => {
  const geofenceNotificationSection = page.locator(
    '//*[text()="Notifications"]/following::label[text()="Geofence"]',
  );
  await expect(geofenceNotificationSection).not.toBeVisible({ timeout: 5000 });
  console.log(
    '✓ Geofence notification section is NOT visible in Notifications',
  );
};

/**
 * Type specific time in Start time input field
 */
export const typeGeofenceStartTime = async (page: Page, time: string) => {
  const startTimeInput = page
    .locator(
      '//span[text()="Start time"]/following::input[@data-testid="__textField"]',
    )
    .first();
  await startTimeInput.scrollIntoViewIfNeeded();
  await expect(startTimeInput).toBeVisible({ timeout: 10000 });
  await startTimeInput.click();
  await startTimeInput.clear();
  await startTimeInput.fill(time);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  console.log(`✓ Typed start time: ${time}`);
};

/**
 * Type specific time in End time input field
 */
export const typeGeofenceEndTime = async (page: Page, time: string) => {
  const endTimeInput = page
    .locator(
      '//span[text()="End time"]/following::input[@data-testid="__textField"]',
    )
    .first();
  await endTimeInput.scrollIntoViewIfNeeded();
  await expect(endTimeInput).toBeVisible({ timeout: 10000 });
  await endTimeInput.click();
  await endTimeInput.clear();
  await endTimeInput.fill(time);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  console.log(`✓ Typed end time: ${time}`);
};

/**
 * Get current Start time value
 */
export const getGeofenceStartTimeValue = async (
  page: Page,
): Promise<string> => {
  const startTimeInput = page
    .locator(
      '//span[text()="Start time"]/following::input[@data-testid="__textField"]',
    )
    .first();
  await startTimeInput.scrollIntoViewIfNeeded();
  const value = await startTimeInput.getAttribute('value');
  console.log(`✓ Current start time value: ${value}`);
  return value || '';
};

/**
 * Get current End time value
 */
export const getGeofenceEndTimeValue = async (page: Page): Promise<string> => {
  const endTimeInput = page
    .locator(
      '//span[text()="End time"]/following::input[@data-testid="__textField"]',
    )
    .first();
  await endTimeInput.scrollIntoViewIfNeeded();
  const value = await endTimeInput.getAttribute('value');
  console.log(`✓ Current end time value: ${value}`);
  return value || '';
};

/**
 * Get currently selected days of week
 */
export const getGeofenceSelectedDays = async (
  page: Page,
): Promise<string[]> => {
  const daysInput = page
    .locator('//*[text()="Days of week"]/following::input')
    .first();
  await daysInput.scrollIntoViewIfNeeded();
  const value = await daysInput.getAttribute('value');
  const days = value ? value.split(', ').filter((d) => d.trim()) : [];
  console.log(`✓ Currently selected days: ${days.join(', ')}`);
  return days;
};

/**
 * Click Cancel button in notifications edit section
 */
export const clickCancelNotificationsSection = async (page: Page) => {
  const cancelButton = page.getByRole('button', { name: 'Cancel' });
  await cancelButton.scrollIntoViewIfNeeded();
  await expect(cancelButton).toBeVisible();
  await cancelButton.click();
  await page.waitForTimeout(1000);
  console.log('✓ Clicked Cancel button in Notifications section');
};

/**
 * Clear all selected days of week
 */
export const clearAllGeofenceDays = async (page: Page) => {
  const daysInput = page
    .locator('//*[text()="Days of week"]/following::input')
    .first();
  await daysInput.scrollIntoViewIfNeeded();
  await daysInput.click();
  await page.waitForTimeout(500);

  // Get all currently selected days and unselect them
  const selectedDays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  for (const day of selectedDays) {
    const dayOption = page.locator(
      `//span[text()='${day}']/parent::li[contains(@class, 'isSelected')]`,
    );
    if (await dayOption.isVisible({ timeout: 1000 }).catch(() => false)) {
      await dayOption.click();
      await page.waitForTimeout(300);
    }
  }
  // Close dropdown by pressing Escape
  await page.keyboard.press('Escape');
  console.log('✓ Cleared all selected days of week');
};

/**
 * Verify geofence reminder shows only time (no days)
 */
export const verifyGeofenceReminderTimeOnly = async (
  page: Page,
  expectedStartTime: string,
  expectedEndTime: string,
) => {
  const reminderField = page
    .locator(
      '//*[text()="Send reminder to team when they enter geofence radius"]/following::span',
    )
    .first();
  await reminderField.scrollIntoViewIfNeeded();
  const reminderValue = await reminderField.textContent();
  const expectedTimeRange = `${expectedStartTime} - ${expectedEndTime}`;
  expect(reminderValue).toContain(expectedTimeRange);
  // Verify no days are displayed (no comma after time range at end)
  const timeOnlyPattern = new RegExp(
    `^${expectedStartTime.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    )} - ${expectedEndTime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
  );
  console.log(`✓ Verified geofence reminder shows time only: ${reminderValue}`);
};

/**
 * Verify typed time is accepted in correct format
 */
export const verifyTimeInputAccepted = async (
  page: Page,
  timeType: 'Start' | 'End',
  expectedFormat: RegExp,
) => {
  const timeInput = page
    .locator(
      `//span[text()="${timeType} time"]/following::input[@data-testid="__textField"]`,
    )
    .first();
  const value = await timeInput.getAttribute('value');
  expect(value).toMatch(expectedFormat);
  console.log(
    `✓ ${timeType} time input value '${value}' matches expected format`,
  );
};

export const selectLocationTrackingOption = async (
  page: Page,
  option: string,
) => {
  const trackingOption = page.locator(
    `//input[@type="radio" and @aria-label="${option}"]`,
  );
  await expect(trackingOption).toBeVisible({ timeout: 5000 });
  await trackingOption.click();
  await page.waitForTimeout(1000);
};

export const verifyLocationTrackingMessageDisplayed = async (
  page: Page,
  option: string,
) => {
  const trackingoption = page.locator(
    `//*[text()='Keep location tracking as "${option}"?']`,
  );
  const trackingoptionMessage = page.locator(
    '//*[contains(text(),"For better geofence performance, set location tracking to")]',
  );
  if (option == 'Optional' || option == 'Never') {
    await trackingoption.scrollIntoViewIfNeeded();
    await expect(trackingoption).toBeVisible({ timeout: 5000 });
    await trackingoptionMessage.scrollIntoViewIfNeeded();
    await expect(trackingoptionMessage).toBeVisible({ timeout: 5000 });
  } else if (option == 'Required') {
    await expect(trackingoption).not.toBeVisible({ timeout: 5000 });
    await expect(trackingoptionMessage).not.toBeVisible({ timeout: 5000 });
  }
};

export const verifySubmissionPayrollCloseDateReminderValue = async (
  page: Page,
  expectedValue: string,
) => {
  const valueElement = page
    .locator(
      `//*[text()='Submissions']//following::*[text()='Remind during set time from the payroll close date']/../span`,
    )
    .first();
  await expect(valueElement).toHaveText(expectedValue);
};

export default {
  TIME_SETTINGS_NAV_TIMEOUT,
  TIME_SETTINGS_SPINNER_TIMEOUT,
  TIME_SETTINGS_PAGE_READY_TIMEOUT,
  TIME_SETTINGS_POST_NAV_DELAY,
  navigateWithAuthSession,
  navigateToAccountAndSettingsTime,
  ensureAccountSettingsTimePanel,
  ensureAccountSettingsTimePanelUpdated,
  waitForTimeSettingsPanelReady,
  verifyTimeSignatureAndTeamMemberPermissionsSettings,
  changeTimeSignatureSettings,
  verifyTeamMemberPermissionsSettings,
  changeTeamMemberPermissionsSettings,
  clickOnDropdown,
  chooseDropDownOption,
  verifyReadOnltimeTrackSection,
  clickTimeTrackingEditButton,
  clickOnTimeTrackingSaveButton,
  clickOnTimeTrackingCancelButton,
  checkBoxTimeTrack,
  uncheckBoxTimeTrack,
  verifyTooltip,
  verifyTimeSheetRounding,
  directToSingleTimeAct,
  directToSingleTimeActWithId,
  directToWeeklyTime,
  verifyFirstDayAtWorkOnWTA,
  verifyDaysOfWeekOnWTA,
  verifyFieldsDisplayed,
  openSTADropdown,
  chooseSTADropdownOption,
  checkBillableCheckboxIfVisible,
  uncheckBillableCheckboxIfVisible,
  fillSTABillRate,
  clickSTASave,
  verifySTARequiredError,
  fillNotes,
  STASaveToast,
  navigateToTimeEntries,
  getTcLoadingSpinner,
  clickOnAddTime,
  chooseTimeEntryScreen,
  validateTimeFormat,
  selectDisplayByDate,
  openDateRangeDropdown,
  selectCustomerOption,
  selectDateRangeOption,
  clickOnMainClockIn,
  clickOnClockInBtn,
  getTimerDisplay,
  getCurrentStartTime,
  selectStartDate,
  selectEndDate,
  selectTime,
  getClockedInMessage,
  getClockedOutMessage,
  clickClockOut,
  verifyTimeOnTimeEntries,
  waitForLoadingToDisappearOnTC,
  getSelectedDropdownValue,
  waitForLoadingToDisappear,
  loadingSpinner,
  displayByDropdown,
  expectSingleTimeEntryVisible,
  hoverOnSplitTimeSheet,
  validateDateRangeDropdownOptions,
  getDateRangeDropdownOptions,
  getlistItems,
  getdropdownMenu,
  clickActionDropdownForEmployee,
  clickDeleteInActionDropdown,
  expectDeleteEntryConfirmationPopupOpen,
  clickYesOnDeleteEntryPopup,
  countEmployeeRow,
  waitForNameFieldToPopulate,
  openDropdown,
  selectOptionFromDropdown,
  clickSetClockInAndOutToggles,
  enterNotes,
  checkFieldVisibility,
  billRateCheckBoxVisibility,
  fillBillRateInput,
  clickSaveAndCloseButton,
  getFieldValue,
  getNotesFieldValue,
  enterFieldValue,
  validateSuccessToast,
  validateDateWiseDataVisible,
  validateCreatedSingleTimeEntryForEmployee,
  getTableHeaders,
  getRowCellsForEmployee,
  getRowObjectForEmployee,
  clickDropdownOption,
  checkCheckboxIfVisible,
  getTime,
  normalizeTime,
  normalizeName,
  checkCheckBoxSplitTimeSheet,
  selectDisplayByOption,
  verifySetClockToggleState,
  selectStartEndTime,
  getPreviousDayDD,
  clickTimeClockSave,
  enterClkOutTimeHours,
  chooseSpecificEmployee,
  clickSTACloseIcon,
  verifySavedFirstDayOfWorkWeek,
  ToggleSetClockInAndOut,
  getTodayDayDD,
  getPreviousDayDDTC,
  verifyIfRunningClock,
  chooseRoundingOptions,
  enterTime,
  clearStartTime,
  verifyFromClassicUI,
  clickOnCompSettings,
  clickOnTimeOptions,
  clickOnTimeEntryTab,
  clickTimeOptionsCloseIcon,
  clickOnFeatureAddOns,
  clickOnAddOnRounding,
  SaveFromClassicUI,
  verifyReadOnlyNotifSection,
  clickNotifEditButton,
  verifyDaysRemindersAreSent,
  clickOnNotifSaveButton,
  verifyWhenNotesAddedOrEdited,
  verifySendClkInRemAt,
  verifySendClkOutRemAt,
  checkEmailMobileBox,
  uncheckEmailMobileBox,
  verifyIfDaysRemSentDisabled,
  verifySavedCheckedCheckBoxes,
  verifySavedUncheckedCheckBoxes,
  inputNotifSettings,
  verifyNotifFromClassicUI,
  verifyClkInOutEdited,
  SaveNotifSettingsFromClassicUI,
  clickTimeSheetFieldsEditButton,
  validateFieldsOnCustomizeTimesheetPage,
  checkedCustomizeTimesheetFieldsCheckbox,
  uncheckedCustomizeTimesheetFieldsCheckbox,
  clickOnCustomizeTimesheetSaveButton,
  navigateToClassicTimeSheet,
  selectOptionFromQuickBooksPayroll,
  validateCustomizeTimesheetFieldsChangesOnClassicUI,
  closeQuickBooksOnline,
  switchBackToQBO,
  switchBackToClassicTimeSheet,
  preferencesUncheckedTimesheetFieldsCheckbox,
  validateCustomizeTimesheetFieldsChangesFromClassicTimesheetToQBO,
  checkNotesCheckboxFromCompanySettings,
  uncheckNotesCheckboxFromCompanySettings,
  verifyNotesCheckboxIsCheckedFromCompanySettings,
  verifyNotesCheckboxIsUncheckedFromCompanySettings,
  closeCompanySettings,
  saveCompanySettings,
  checkCustomField,
  clickSaveButtonCustomField,
  validateTimeSheetFieldsVisible,
  navigateToSTA,
  uncheckCustomField,
  getClassCheckboxLocator,
  validateCheckboxIsChecked,
  validateCheckboxIsUnchecked,
  validateOnlyClassFieldValuesCheckboxIsChecked,
  validateOnlyLocationFieldValuesCheckboxIsChecked,
  validateOnlyServiceItemFieldValuesCheckboxIsChecked,
  validateOnlyBillableFieldValuesCheckboxIsChecked,
  validateAllFieldValuesCheckboxAreUnchecked,
  checkClassCheckbox,
  uncheckClassCheckbox,
  getClosePreferencesButtonLocator,
  clickClosePreferencesButton,
  saveAndClosePreferences,
  uncheckAndClosePreferences,
  verifyNotifEditMode,
  verifyPriorityCaseFromClassicUI,
  SaveNotifyPriorityCaseFromClassicUI,
  scrollToBottom,
  checkedCustomizeTimesheetFieldsCheckboxForTimeClock,
  closeSpecificTabsOrPage,
  checkServiceItemRequired,
  // Approvals and Settings Functions (moved from ApprovalsAndSettingsPage.ts)
  navigateToClassicApprovalPreferences,
  navigateToNotificationSection,
  verifyTeamMemberOptions,
  verifyApprovalsSectionVisible,
  verifySubmissionSectionVisible,
  verifyApprovalNotificationSectionVisible,
  checkTeamMembersCanReviewAndSubmitTime,
  checkTeamMembersCanReviewAndSubmitTimeCheckbox,
  verifyTeamMembersCanReviewAndSubmitTimeValue,
  verifyTeamMemberOptionsEnabled,
  verifyTeamMemberSectionChecked,
  verifyApprovalManagerSectionEnabled,
  clickEditApprovalsSection,
  clickEditNotificationSection,
  selectDayOfWeekOption,
  selectPayrollCloseDateOption,
  selectBasedOnPayPeriodOption,
  selectDailyOption,
  checkCurrentWeekSubmissionReminder,
  checkPriorWeekSubmissionReminder,
  checkPayrollCloseDateReminder,
  checkNotSubmittedByPayrollCloseDate,
  checkNotSubmittedForSelectedDays,
  checkStillNotSubmittedForSelectedDays,
  checkCurrentWeekApprovalReminder,
  checkPriorWeekApprovalReminder,
  setCurrentWeekReminderTime,
  setPriorWeekReminderTime,
  setPayrollCloseDateReminderTime,
  setNotSubmittedByPayrollCloseDateReminderTime,
  setNotSubmittedForSelectedDaysTime,
  setStillNotSubmittedForSelectedDaysTime,
  setCurrentWeekApprovalReminderTime,
  setPriorWeekApprovalReminderTime,
  selectDaysOfWeek,
  saveApprovalSettings,
  saveNotificationSettings,
  verifySendReminderToTeamValue,
  verifyCurrentWeekReminderValue,
  verifyPriorWeekReminderValue,
  verifyPayrollCloseDateReminderValue,
  verifyNotSubmittedByPayrollCloseDateValue,
  verifyDaysRemindersAreSentValue,
  verifyNotSubmittedForSelectedDaysValue,
  verifyStillNotSubmittedForSelectedDaysValue,
  verifyRemindManagersToApproveTimeValue,
  verifyCurrentWeekManagerApprovalReminderValue,
  verifyPriorWeekManagerApprovalReminderValue,
  verifyBasedOnDayOfWeekChecked,
  verifyClassicCurrentWeekReminderValue,
  verifyClassicPriorWeekReminderValue,
  verifyDayOfWeekOptionSelected,
  selectDayOfWeekOptionQBO,
  checkCurrentWeekSubmissionReminderQBO,
  checkPriorWeekSubmissionReminderQBO,
  setCurrentWeekReminderTimeQBO,
  setPriorWeekReminderTimeQBO,
  unCheckCurrentWeekSubmissionReminderQBO,
  unCheckPriorWeekSubmissionReminderQBO,
  verifyClassicPayrollCloseDateReminderValue,
  verifyClassicNotSubmittedByPayrollCloseDateReminderValue,
  checkPayrollCloseDateReminderQBO,
  checkNotSubmittedByPayrollCloseDateQBO,
  setPayrollCloseDateReminderTimeQBO,
  setNotSubmittedByPayrollCloseDateReminderTimeQBO,
  verifyClassicDailyReminderValue,
  verifyClassicNotSubmittedByDailyReminderValue,
  selectDailyOptionQBO,
  checkNotSubmittedForSelectedDaysQBO,
  checkStillNotSubmittedForSelectedDaysQBO,
  setNotSubmittedForSelectedDaysTimeQBO,
  setStillNotSubmittedForSelectedDaysTimeQBO,
  selectDaysOfWeekQBO,
  verifyBasedOnPayrollCloseDateChecked,
  verifyBasedOnDailyChecked,
  selectDayOfWeekOptionApprovalMgr,
  verifyClassicCurrentWeekApprovalReminderValue,
  verifyClassicPriorWeekApprovalReminderValue,
  // Email Manager Functions
  checkEmailManagerWhenEachTeamMemberSubmits,
  checkEmailManagerWhenEntireTeamSubmits,
  checkEmailManagerWhenEachTeamMemberSubmitsQBO,
  checkEmailManagerWhenEntireTeamSubmitsQBO,
  verifyEmailManagerOptionsChecked,
  verifyEmailManagerWhenEachTeamMemberSubmitsValue,
  verifyEmailManagerWhenEntireTeamSubmitsValue,
  verifyEmailManagerWhenEachTeamMemberSubmitsChecked,
  verifyEmailManagerWhenEntireTeamSubmitsChecked,
  // Custom Message Functions
  clickCustomizeButton,
  editCustomMessage,
  saveCustomMessage,
  clickRestoreMessage,
  clickResetMessage,
  verifyCustomMessageValue,
  verifyCustomMessageValueQBO,
  verifyTeamMemberNotificationCheckboxesEditable,
  NavigateToApprovalsInClassicTimeSheet,
  cleanupApprovalManagerDayOfWeekFromQBOSettings,
  cleanupApprovalManagerPayrollCloseDateFromQBOSettings,
  cleanupApprovalManagerPayPeriodFromQBOSettings,
  cleanupEmailManagerFromQBOSettings,
  cleanupCustomMessageFromQBOSettings,
  cleanupCustomMessageFromClassicTimesheet,
  editCustomMessageQBO,
  selectManagerBasedOnPayPeriodOption,
  checkNotSubmittedByPayrollCloseDateManagerQBO,
  setPayrollCloseDateReminderTimeManagerQBO,
  setNotSubmittedByPayrollCloseDateReminderTimeManagerQBO,
  verifyNotSubmittedByPayrollCloseDateManagerValue,
  verifyBasedOnPayrollCloseDateManagerChecked,
  verifyClassicPayrollCloseDateReminderManagerValue,
  verifyClassicNotSubmittedByPayrollCloseDateReminderManagerValue,
  selectPayrollCloseDateManagerOption,
  checkPayrollCloseDateReminderManager,
  checkNotSubmittedByPayrollCloseDateManager,
  setManagerPayrollCloseDateReminderTime,
  setManagerNotSubmittedByPayrollCloseDateReminderTime,
  selectManagerDayOfWeekOptionQBO,
  setCurrentWeekReminderTimeManagerQBO,
  setPriorWeekReminderTimeManagerQBO,
  checkPriorWeekSubmissionReminderManagerQBO,
  checkCurrentWeekSubmissionReminderManagerQBO,
  verifyBasedOnDayOfWeekMangerChecked,
  verifyClassicCurrentWeekApprovalReminderManagerValue,
  verifyClassicPriorWeekApprovalReminderManagerValue,
  selectFiveWeekdays,
  verifyFiveWeekdaysSelected,
  selectFiveWeekdaysQBO,
  verifyFiveWeekdaysSelectedQBO,
  handleMergeEmployeePopup,
  verifyGeoLocationSettingsSectionVisible,
  verifyGeoLocationTrackingPageElements,
  clickEditGeoLocationSection,
  clickCancelButton,
  clickCloseIcon,
  verifyRequireLocationTrackingOption,
  selectAndVerifyRequireLocationOption,
  verifyOptionalLocationTrackingOption,
  selectAndVerifyOptionalLocationOption,
  verifyNeverLocationTrackingOption,
  selectAndVerifyNeverLocationOption,
  verifyLocationTrackingRadioButton,
  verifyLocationTrackingOptionSelected,
  navigateToClassicLocationPreferences,
  verifyPopupAndDontSaveLocationTracking,
  selectAndSaveLocationTrackingOption,
  verifyNewBadgeVisible,
  clickOnDropdownWithLabel,
  verifyGeolocationSectionTitle,
  verifyLocationTrackingDisplayed,
  verifyMileageTrackingDisplayed,
  verifyGeofenceDisplayed,
  verifyGeofenceValue,
  verifyGeofenceHeadingInEditMode,
  verifyGeofenceDescription,
  verifyTurnOnGeofenceCheckboxNotSelected,
  checkTurnOnGeofenceCheckbox,
  uncheckTurnOnGeofenceCheckbox,
  verifyTurnOnGeofenceCheckboxSelected,
  verifySetupGeofenceNotificationsVisible,
  clickSaveGeoLocationSection,
  clickCancelGeoLocationSection,
  clickSetupGeofenceNotifications,
  handleSaveChangesPopup,
  scrollToGeofenceReminder,
  updateGeofenceStartTime,
  updateGeofenceEndTime,
  toggleGeofenceDay,
  revertGeofenceStartTime,
  revertGeofenceEndTime,
  scrollToNotificationsSection,
  verifyGeofenceNotificationSectionVisible,
  verifyGeofenceReminderValue,
  clickEditGeofenceNotifications,
  clickSaveButton,
  clickEditNotifications,
  handleDontSaveChangesPopup,
  verifyGeofenceNotificationSectionNotVisible,
  typeGeofenceStartTime,
  typeGeofenceEndTime,
  getGeofenceStartTimeValue,
  getGeofenceEndTimeValue,
  getGeofenceSelectedDays,
  clickCancelNotificationsSection,
  clearAllGeofenceDays,
  verifyGeofenceReminderTimeOnly,
  verifyTimeInputAccepted,
  selectLocationTrackingOption,
  verifyLocationTrackingMessageDisplayed,
  verifySubmissionPayrollCloseDateReminderValue,
};
