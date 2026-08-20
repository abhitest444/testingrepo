import { Page, expect } from '@playwright/test';
import {
  navigateToAccountAndSettingsTime,
  clickEditGeoLocationSection,
  waitForPageReady,
  handleClassicTimesheetPopupsInAnyOrder,
} from './TimeSettingsPage';

// ================= Cookie Consent Handler =================

/**
 * Dismisses the OneTrust cookie consent banner if visible
 */
export const dismissCookieConsent = async (page: Page) => {
  try {
    const acceptButton = page.locator(`//button[text()='I Understand']`);
    if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptButton.click();
      await page.waitForTimeout(500);
      console.log('✓ Dismissed cookie consent banner');
    }
  } catch {
    // Cookie banner not present, continue
  }
};

// ================= QBO Time Settings – Mileage tracking =================

export const navigateToQboTimeSettings = async (page: Page) => {
  await navigateToAccountAndSettingsTime(page);
};

const getMileageToggle = (page: Page) =>
  page.getByRole('checkbox', { name: /Turn on mileage tracking/i });

const clickOnSaveButton = async (page: Page) => {
  const saveButton = page.locator(`//span[text()='Save']`);
  await expect(saveButton).toBeVisible();
  await saveButton.click();
  await page.waitForTimeout(2000);
};

const SidepanelCloseFunction = async (page: Page) => {
  const SidepanelClose = page.locator(`//button[@aria-label="Close"]`);
  if (await SidepanelClose.isVisible()) {
    await SidepanelClose.click();
  }
};

const openGeolocationEdit = async (page: Page) => {
  await navigateToQboTimeSettings(page);

  const geoSectionHandle = page.locator(
    `//div[@data-testid="geo-locations-settings-handle"]`,
  );
  await expect(geoSectionHandle).toBeVisible();

  await page
    .locator(
      `//div[@data-testid="geo-locations-settings-handle"]//div[contains(@class, 'index-settingsSectionViewActions')]//button`,
    )
    .click();
};

export const enableMileageTrackingInQBO = async (page: Page) => {
  await openGeolocationEdit(page);
  await page.waitForLoadState('load');
  await selectRequiredAndEnableMileageToggle(page);
  await clickOnSaveButton(page);
};

export const disableMileageTrackingInQBO = async (page: Page) => {
  await openGeolocationEdit(page);
  await page.waitForLoadState('load');
  await selectRequiredAndDisableMileageToggle(page);
  await clickOnSaveButton(page);
};

// ================= TSheets – Manage / Feature add‑ons =================

export const verifyClassicMileageTrackingWithInstall = async (
  classicPage: Page,
) => {
  const mileageRowInstall = classicPage.locator(
    `//div[contains(text(), 'Mileage Tracking')]/parent::div/div/button[text()='Install']`,
  );
  await expect(mileageRowInstall).toBeVisible();
};

export const clickOnClassicMileageTrackingWithInstall = async (
  classicPage: Page,
) => {
  await classicPage
    .locator(
      `//div[contains(text(), 'Mileage Tracking')]/parent::div/div/button[text()='Install']`,
    )
    .click();
};

export const clickGeolocationEditButton = async (page: Page) => {
  await clickEditGeoLocationSection(page);
};

export const selectRequiredAndEnableMileageToggle = async (page: Page) => {
  const requiredRadio = page.locator('input[type="radio"][value="REQUIRED"]');
  await expect(requiredRadio).toBeVisible();
  await requiredRadio.click();

  await page.waitForTimeout(8000);

  const mileageToggle = page.getByRole('checkbox', {
    name: /Turn on mileage tracking/i,
  });
  await expect(mileageToggle).toBeVisible();
  if (!(await mileageToggle.isChecked())) {
    await mileageToggle.check();
  }
};

export const selectRequiredAndDisableMileageToggle = async (page: Page) => {
  const requiredRadio = page.locator('input[type="radio"][value="REQUIRED"]');
  await expect(requiredRadio).toBeVisible();
  await requiredRadio.click();

  await page.waitForTimeout(8000);

  const mileageToggle = page.getByRole('checkbox', {
    name: /Turn on mileage tracking/i,
  });
  await expect(mileageToggle).toBeVisible();
  if (await mileageToggle.isChecked()) {
    await mileageToggle.uncheck();
  }
};

export const navigateToClassicFeatureAddons = async (page: Page) => {
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

  // Dismiss cookie consent banner if present
  await dismissCookieConsent(classicPage);

  // Navigate to Feature Add-ons -> Manage addons
  await classicPage.locator('#addons_shortcut').click();
  await classicPage.waitForTimeout(5000);
  await dismissCookieConsent(classicPage);
  await classicPage.locator('#more_addons_shortcut').click();
  await expect(classicPage.locator('#addons_title_header')).toBeVisible();

  return { classicPage, classicPageUrl: classicPage.url() };
};

export const navigateToClassicTimeEntries = async (page: Page) => {
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

  // Navigate to Time Entries
  await classicPage.locator('#timesheets_v2_shortcut').click();
  await expect(
    classicPage.locator('#timesheets_v2_title_header'),
  ).toBeVisible();

  await dismissCookieConsent(classicPage);

  return { classicPage, classicPageUrl: classicPage.url() };
};

export const verifyClassicMileageTrackingWithUninstall = async (
  classicPage: Page,
) => {
  const mileageRowUninstall = classicPage.locator(
    `//div[contains(text(), 'Mileage Tracking')]/parent::div/div/button[text()='Uninstall']`,
  );
  await expect(mileageRowUninstall).toBeVisible();
};

export const clickOnClassicMileageTrackingWithUninstall = async (
  classicPage: Page,
) => {
  await classicPage
    .locator(
      `//div[contains(text(), 'Mileage Tracking')]/parent::div/div/button[text()='Uninstall']`,
    )
    .click();
};

export const updateMileageValueFromClasssicTimeSheet = async (
  classicPage: Page,
) => {
  await classicPage.locator(`//button[contains(@aria-label, 'Edit')]`).click();
  await classicPage.locator('input[name="manual_meters"]').dblclick();
  await classicPage.locator('input[name="manual_meters"]').fill('60');
  // Dismiss cookie consent banner if present
  await dismissCookieConsent(classicPage);
  await classicPage.locator('#timesheet_edit_save_button').click();
};

export const validateMileageValueInClassicTimeEntries = async (
  classicPage: Page,
) => {
  await expect(classicPage.locator('#time-entries-list')).toContainText(
    '60.00',
  );
};

export const verifyQBOMileageTrackingOn = async (page: Page) => {
  const mileageOn = page.locator(
    `//label[text()='Mileage tracking']/following-sibling::span`,
  );
  await expect(mileageOn).toContainText('On');
};

export const verifyQBOMileageTrackingOff = async (page: Page) => {
  const mileageOff = page.locator(
    `//label[text()='Mileage tracking']/following-sibling::span`,
  );
  await expect(mileageOff).toContainText('Off');
};

// ================= Pre‑cleanup helper =================

export const preCleanupExisitingData = async (page: Page) => {
  console.log('  Starting mileage pre-cleanup...');

  try {
    await openGeolocationEdit(page);

    await page.waitForLoadState('load');
    await page.waitForTimeout(8000);

    const requireChecked = await page
      .locator(
        `//input[@aria-label='Required']/parent::span[contains(@class, 'RcCheckbox-containerChecked')]`,
      )
      .isVisible();

    if (!requireChecked) {
      await page.locator(`//input[@aria-label='Required']`).check();
    }

    const mileageToggle = page.getByRole('checkbox', {
      name: /Turn on mileage tracking/i,
    });
    await expect(mileageToggle).toBeVisible();
    if (await mileageToggle.isChecked()) {
      await mileageToggle.uncheck();
    }

    await page.waitForTimeout(5000);
    // Set location setting to "Never" (disabled) to ensure clean state
    const neverOption = page.getByRole('radio', { name: 'Never' });

    if (requireChecked) {
      await neverOption.check();
    }

    // Save the changes
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);
    console.log('  ✓ Mileage pre-cleanup completed successfully');
  } catch (error) {
    console.log(
      '  ⚠ Mileage pre-cleanup encountered an error:',
      error instanceof Error ? error.message : String(error),
    );
    // Don't throw - cleanup failures shouldn't fail the test
  }
};

// Default export matching `TimeSettingsPage` style (object of helpers)
const MileagePage = {
  navigateToQboTimeSettings,
  enableMileageTrackingInQBO,
  disableMileageTrackingInQBO,
  verifyClassicMileageTrackingWithInstall,
  preCleanupExisitingData,
  clickGeolocationEditButton,
  selectRequiredAndEnableMileageToggle,
  navigateToClassicFeatureAddons,
  verifyClassicMileageTrackingWithUninstall,
  clickOnSaveButton,
  verifyQBOMileageTrackingOn,
  verifyQBOMileageTrackingOff,
  clickOnClassicMileageTrackingWithInstall,
  clickOnClassicMileageTrackingWithUninstall,
  navigateToClassicTimeEntries,
  updateMileageValueFromClasssicTimeSheet,
  validateMileageValueInClassicTimeEntries,
  SidepanelCloseFunction,
};

export default MileagePage;
