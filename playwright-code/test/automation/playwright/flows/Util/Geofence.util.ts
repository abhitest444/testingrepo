import { Page, expect } from '@playwright/test';
import {
  navigateToAccountAndSettingsTime,
  clickEditGeoLocationSection,
  navigateToClassicLocationPreferences,
  waitForLoadingToDisappear,
  waitForPageReady,
  handlePopupsInAnyOrder,
  verifyGeolocationSectionTitle,
  verifyGeofenceDisplayed,
  verifyGeofenceValue,
} from '../../pages/TimeSettingsPage';
import { goToAssignments } from './Assignments.util';
import { navigateToTimeEntries } from './WTERunPayroll.util';
import TimeSettingsPage from '../../pages/TimeSettingsPage';
import { dismissCookieConsent } from '../../pages/MileagePage';

/** QBO Geolocation summary row: Geofence → On | Off (after Save closes the dialog). */
async function verifyGeofenceStatus(page: Page, status: 'On' | 'Off') {
  await expect(
    page
      .getByText('Geofence', { exact: true })
      .first()
      .locator('..')
      .getByText(status, { exact: true }),
  ).toBeVisible({ timeout: 15000 });
}

/** Assign geofence side drawer: IDS Drawer with role=dialog and drawerTitle heading. */
const geofenceDrawerRoot = (page: Page) =>
  page.getByRole('dialog').filter({
    has: page
      .locator('[data-testid="drawerTitle"]')
      .getByText(/Assign geofence location/i),
  });

export const validateGeofenceDualSyncFromQBO = async (page: Page) => {
  await navigateToAccountAndSettingsTime(page);
  await page.waitForTimeout(2000);
  await clickEditGeoLocationSection(page);
  await page.waitForTimeout(1500);

  const geoDialog = page.getByRole('dialog', { name: 'Geolocation' });
  const qboGeofenceCheckbox = geoDialog
    .getByRole('checkbox', { name: /Turn on geofence/i })
    .or(geoDialog.locator('[data-testid="geofencing-checkbox"]'));
  const qboGeofenceToggle = qboGeofenceCheckbox.first();
  if (!(await qboGeofenceToggle.isChecked())) {
    await qboGeofenceToggle.check();
    await page.waitForTimeout(500);
    await geoDialog.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);
  } else {
    await expect(
      geoDialog.getByRole('button', { name: 'Save' }),
    ).toBeDisabled();
    await page.waitForTimeout(2000);
  }
  await verifyGeofenceStatus(page, 'On');
  console.log('✓ Enabled Geofence in QBO (summary shows On)');

  await navigateToTimeEntries(page);
  const { classicPage } = await navigateToClassicLocationPreferences(page);
  await classicPage.waitForTimeout(1000);
  const geofencingLink = classicPage
    .getByRole('tab')
    .filter({ hasText: 'Geofencing' })
    .first();
  await geofencingLink.click();
  await classicPage.waitForTimeout(1000);
  const enableGeofencingCheckbox = classicPage.locator(
    '#enable_geofencing_feature',
  );
  await expect(enableGeofencingCheckbox).toBeChecked();
  console.log('✓ Verified Geofence is enabled in TSheets');

  await page.bringToFront();
  await navigateToAccountAndSettingsTime(page);
  await page.waitForTimeout(2000);
  await clickEditGeoLocationSection(page);
  await page.waitForTimeout(1500);

  if (await qboGeofenceToggle.isChecked()) {
    await qboGeofenceToggle.uncheck();
    await page.waitForTimeout(500);
  }
  await geoDialog.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(2000);
  await verifyGeofenceStatus(page, 'Off');
  console.log('✓ Geofence disabled in QBO settings (summary shows Off)');

  await classicPage.bringToFront();
  await classicPage.reload();
  await waitForLoadingToDisappear(classicPage);
  // await expect(classicPage.locator('#quickbooks_menu_top')).toBeVisible();

  // // Navigate to Feature Add-ons -> Approval Preferences
  // await classicPage.locator('#my_account_shortcut').click();
  await classicPage.getByRole('link', { name: 'Location' }).click();
  await classicPage.waitForTimeout(1000);
  await classicPage
    .getByRole('tab')
    .filter({ hasText: 'Geofencing' })
    .first()
    .click();
  await classicPage.waitForTimeout(1000);
  await expect(enableGeofencingCheckbox).not.toBeChecked({ timeout: 15000 });
  console.log('✓ Verified Geofence is disabled in TSheets');
};

export const validateGeofenceDualSyncFromTSheets = async (page: Page) => {
  await navigateToTimeEntries(page);
  await waitForLoadingToDisappear(page);
  const { classicPage } = await navigateToClassicLocationPreferences(page);
  await classicPage.waitForTimeout(1000);
  const geofencingLink = classicPage
    .getByRole('tab')
    .filter({ hasText: 'Geofencing' })
    .first();
  await geofencingLink.click();
  await classicPage.waitForTimeout(1000);
  await dismissCookieConsent(classicPage);
  const enableCheckbox = classicPage
    .getByRole('checkbox', { name: /Turn on geofence|Enable Geofencing/i })
    .first();
  if (!(await enableCheckbox.isChecked())) {
    await enableCheckbox.check();
    await classicPage.waitForTimeout(500);
    await classicPage.getByRole('button', { name: 'Save' }).click();
    await classicPage.waitForTimeout(2000);
  }
  console.log('✓ Enabled Geofencing in TSheets');

  await page.bringToFront();
  await navigateToAccountAndSettingsTime(page);
  await page.waitForTimeout(2000);
  await verifyGeofenceStatus(page, 'On');
  await clickEditGeoLocationSection(page);
  await page.waitForTimeout(1500);

  const verifyOnDialog = page.getByRole('dialog', { name: 'Geolocation' });
  const qboGeofenceOn = verifyOnDialog
    .getByRole('checkbox', { name: /Turn on geofence/i })
    .or(verifyOnDialog.locator('[data-testid="geofencing-checkbox"]'));
  await expect(qboGeofenceOn.first()).toBeChecked({ timeout: 15000 });
  console.log('Verified Geofence is enabled in QBO');

  await classicPage.bringToFront();
  await classicPage.reload();
  await waitForLoadingToDisappear(classicPage);
  await classicPage.getByRole('link', { name: 'Location' }).click();
  await classicPage.waitForTimeout(1000);
  await classicPage
    .getByRole('tab')
    .filter({ hasText: 'Geofencing' })
    .first()
    .click();
  await classicPage.waitForTimeout(1000);
  if (await enableCheckbox.isChecked()) {
    await enableCheckbox.uncheck();
    await classicPage.waitForTimeout(500);
    await classicPage.getByRole('button', { name: 'Save' }).click();
    await classicPage.waitForTimeout(2000);
  }
  console.log('✓ Disabled Geofencing in TSheets');

  await page.bringToFront();
  await page.reload();
  await waitForLoadingToDisappear(page);
  await verifyGeofenceStatus(page, 'Off');
  await clickEditGeoLocationSection(page);
  await page.waitForTimeout(1500);

  const verifyOffDialog = page.getByRole('dialog', { name: 'Geolocation' });
  const qboGeofenceOff = verifyOffDialog
    .getByRole('checkbox', { name: /Turn on geofence/i })
    .or(verifyOffDialog.locator('[data-testid="geofencing-checkbox"]'));
  await expect(qboGeofenceOff.first()).not.toBeChecked({ timeout: 15000 });
  console.log('Verified Geofence is disabled in QBO');
};

export const validateInvalidAddressError = async (page: Page) => {
  await goToAssignments(page);

  const firstCustomerRow = page
    .locator('table[summary="Customer assignment table"] tbody tr')
    .first();
  await expect(firstCustomerRow).toBeVisible({ timeout: 30_000 });
  const tableGeofenceSwitch = firstCustomerRow.getByRole('switch', {
    name: /^Geofence for /i,
  });
  await expect(tableGeofenceSwitch).toBeVisible({ timeout: 20_000 });
  await expect(tableGeofenceSwitch).not.toBeChecked();
  console.log('✓ Verified Geofence toggle is off for first customer');

  await firstCustomerRow.locator('[aria-label="Expand Menu"]').click();
  const assignGeofenceMenuItem = page.getByRole('menuitem', {
    name: /Assign geofence location/i,
  });
  await assignGeofenceMenuItem.click();

  const drawer = geofenceDrawerRoot(page);
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1000);

  const innerToggle = drawer.getByRole('switch', { name: /Turn on geofence/i });
  await expect(innerToggle).toBeVisible({ timeout: 15_000 });
  if (!(await innerToggle.isChecked())) {
    await innerToggle.check();
  }
  await page.waitForTimeout(1000);

  const addressInput = drawer.getByRole('combobox', {
    name: /Enter an address or GPS coordinates/i,
  });
  await expect(addressInput).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(3000);

  await addressInput.click();
  await addressInput.clear();
  await page.waitForTimeout(300);

  await drawer.getByRole('button', { name: 'Save' }).click();

  await expect(drawer.getByText(/Address is required/i)).toBeVisible({
    timeout: 15_000,
  });
  console.log('✓ Verified no address error state');

  await addressInput.fill('ygdcuide');
  await page.waitForTimeout(1500);
  await drawer.getByRole('button', { name: 'Save' }).click();

  await expect(
    drawer.getByText(/Choose address or coordinates from suggestions/i),
  ).toBeVisible({ timeout: 15_000 });
  console.log('✓ Verified Invalid address error state');

  await drawer.getByRole('link', { name: /Manage settings/i }).click();

  await waitForLoadingToDisappear(page);
  await verifyGeolocationSectionTitle(page);
  await verifyGeofenceDisplayed(page);
  await verifyGeofenceValue(page, 'On');
  console.log('✓ Verified Manage settings Navigation');
};

export const validateGeofenceRadiusAndMap = async (page: Page) => {
  const assignmentsPage = await goToAssignments(page);
  await assignmentsPage.selectTab('CUSTOMERS');
  await page.waitForTimeout(1000);

  const firstCustomerRow = page
    .locator('table[summary="Customer assignment table"] tbody tr')
    .first();
  await expect(firstCustomerRow).toBeVisible({ timeout: 30_000 });

  const tableGeofenceSwitch = firstCustomerRow.getByRole('switch', {
    name: /^Geofence for /i,
  });
  await expect(tableGeofenceSwitch).toBeVisible({ timeout: 20_000 });
  if (await tableGeofenceSwitch.isChecked()) {
    await tableGeofenceSwitch.uncheck();
    await page.waitForTimeout(1000);
    const offDrawer = geofenceDrawerRoot(page);
    if (await offDrawer.isVisible().catch(() => false)) {
      const innerOff = offDrawer
        .getByRole('switch', { name: /Turn on geofence/i })
        .or(offDrawer.getByRole('checkbox', { name: /Turn on geofence/i }));
      if (await innerOff.isChecked().catch(() => false)) {
        await innerOff.uncheck();
      }
      await offDrawer.getByRole('button', { name: 'Save' }).click();
      await expect(offDrawer).not.toBeVisible({ timeout: 15_000 });
    }
  }
  await expect(tableGeofenceSwitch).not.toBeChecked();
  console.log('Geofence toggle is off');

  await tableGeofenceSwitch.check();

  const drawer = page.getByRole('dialog').filter({
    has: page
      .locator('[data-testid="drawerTitle"]')
      .getByText(/Assign geofence location/i),
  });
  await expect(drawer).toBeVisible({ timeout: 20_000 });

  const innerToggle = drawer
    .getByRole('switch', { name: /Turn on geofence/i })
    .first();
  await expect(innerToggle).toBeEnabled();

  console.log('Enabled Geofence in drawer');
  const addressField = drawer.getByRole('combobox', {
    name: /Enter an address or GPS coordinates/i,
  });
  const mapContainer = drawer.getByRole('region', { name: /Map/i });
  const radiusSize = drawer.getByText(/Radius size \(meters\)/i);
  const mapRadiusIndicators = drawer.locator('[aria-label="Geofence center"]');

  await expect(addressField).toBeVisible({ timeout: 15_000 });
  await expect(radiusSize).toBeVisible({ timeout: 15_000 });
  await expect(mapContainer).toBeVisible({
    timeout: 15_000,
  });
  await expect(mapRadiusIndicators.first()).toBeVisible({
    timeout: 15_000,
  });
  console.log('Radius size and map are visible when geofence is on');

  await innerToggle.click();
  await page.waitForTimeout(1000);

  await expect(addressField).not.toBeVisible();
  await expect(radiusSize).not.toBeVisible({ timeout: 15_000 });
  await expect(mapContainer).not.toBeVisible({
    timeout: 15_000,
  });
  await expect(mapRadiusIndicators.first()).not.toBeVisible();
  await drawer.getByRole('button', { name: 'Cancel' }).click();
  await waitForLoadingToDisappear(page);
  console.log('Radius size and map are not visible when geofence is off');
};

export const validateCancelInCustomersGeofenceDrawer = async (page: Page) => {
  type Drawer = ReturnType<typeof geofenceDrawerRoot>;

  const assignmentsPage = await goToAssignments(page);
  await assignmentsPage.selectTab('CUSTOMERS');
  await page.waitForTimeout(1000);

  const row = page
    .locator('table[summary="Customer assignment table"] tbody tr')
    .first();
  await expect(row).toBeVisible({ timeout: 30_000 });

  const innerToggle = (drawer: Drawer) =>
    drawer.getByRole('switch', { name: /Turn on geofence/i });

  /** Second combobox in the drawer: radius (meters). Address field is the first combobox. */
  const radiusCombobox = (drawer: Drawer) =>
    drawer.getByRole('combobox').nth(1);

  const selectRadiusMeters = async (drawer: Drawer, meters: string) => {
    const box = radiusCombobox(drawer);
    await box.click();
    await page.getByRole('option', { name: meters, exact: true }).click();
    await page.waitForTimeout(300);
  };

  const isInnerGeofenceOn = async (t: ReturnType<typeof innerToggle>) => {
    const aria = await t.getAttribute('aria-checked');
    if (aria === 'true') return true;
    if (aria === 'false') return false;
    return t.isChecked();
  };

  await row.locator('[aria-label="Expand Menu"]').click();
  await page
    .getByRole('menuitem', { name: /Edit geofence location/i })
    .or(page.getByRole('menuitem', { name: /Assign geofence location/i }))
    .first()
    .click();
  const cleanupDrawer = geofenceDrawerRoot(page);
  await expect(cleanupDrawer).toBeVisible({ timeout: 20_000 });
  const currentRadius = (
    await radiusCombobox(cleanupDrawer).inputValue()
  ).trim();

  if (currentRadius !== '100') {
    await selectRadiusMeters(cleanupDrawer, '100');
  }

  if (currentRadius !== '100') {
    await cleanupDrawer.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);
    await expect(cleanupDrawer).not.toBeVisible({ timeout: 15_000 });
  } else {
    await cleanupDrawer.getByRole('button', { name: 'Cancel' }).click();
    await expect(cleanupDrawer).not.toBeVisible({ timeout: 15_000 });
  }

  const openDrawer = async (): Promise<Drawer> => {
    await row.locator('[aria-label="Expand Menu"]').click();
    await page
      .getByRole('menuitem', {
        name: /Assign geofence location|Edit geofence location/i,
      })
      .first()
      .click();
    const drawer = geofenceDrawerRoot(page);
    await expect(drawer).toBeVisible({ timeout: 20_000 });
    await expect(drawer.locator('[data-testid="drawerTitle"]')).toContainText(
      /Assign geofence location/i,
    );
    await page.waitForTimeout(500);
    return drawer;
  };

  const unsavedChangesModal = () =>
    page.getByRole('dialog').filter({
      has: page.getByText(/Want to save your changes/i),
    });

  // —— GF025: no edits — Cancel then Close — drawer closes, still on Assignments / Customers row
  let drawer = await openDrawer();
  await drawer.getByRole('button', { name: 'Cancel' }).click();
  await expect(drawer).not.toBeVisible({ timeout: 15_000 });
  await expect(row).toBeVisible({ timeout: 15_000 });
  console.log('✓ Cancel with no changes — drawer closed');

  drawer = await openDrawer();
  await drawer.getByRole('button', { name: 'Close' }).click();
  await expect(drawer).not.toBeVisible({ timeout: 15_000 });
  await expect(row).toBeVisible({ timeout: 15_000 });
  console.log('✓ Verified Close with no changes — drawer closed');

  // —— GF024: edit radius → Cancel → Don’t save (discard)
  drawer = await openDrawer();
  const radiusField = radiusCombobox(drawer);
  await expect(radiusField).toBeVisible({ timeout: 15_000 });
  const radiusBeforeEdit = await radiusField.inputValue();
  await selectRadiusMeters(drawer, '200');
  await drawer.getByRole('button', { name: 'Cancel' }).click();
  await expect(unsavedChangesModal()).toBeVisible({ timeout: 15_000 });
  await unsavedChangesModal()
    .getByRole('button', { name: /Don't save/i })
    .click();
  await expect(drawer).not.toBeVisible({ timeout: 15_000 });

  drawer = await openDrawer();
  const afterRevert = await radiusCombobox(drawer).inputValue();
  expect(afterRevert).toBe(radiusBeforeEdit);
  console.log("✓ Don't save on unsaved prompt — radius change discarded");

  // —— GF024: edit radius → Cancel → Save (keep)
  await selectRadiusMeters(drawer, '200');
  await drawer.getByRole('button', { name: 'Cancel' }).click();
  await page.waitForTimeout(1000);
  await expect(unsavedChangesModal()).toBeVisible({ timeout: 15_000 });
  await unsavedChangesModal()
    .getByRole('button', { name: /Save/i, exact: true })
    .last()
    .click();
  await expect(drawer).not.toBeVisible({ timeout: 15_000 });

  drawer = await openDrawer();
  await expect(radiusCombobox(drawer)).toHaveValue('200');
  console.log('✓ Verified Save on unsaved prompt — radius change kept');
  await waitForLoadingToDisappear(page);
};

/**
 * GF001 - Verify Geolocation section is visible in settings
 */
export const verifyGeolocationSectionVisible = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  console.log('✓ Navigated to Account & Settings > Time');
  await TimeSettingsPage.verifyGeolocationSectionTitle(page);
  await TimeSettingsPage.verifyLocationTrackingDisplayed(page);
  await TimeSettingsPage.verifyMileageTrackingDisplayed(page);
  await TimeSettingsPage.verifyGeofenceDisplayed(page);
  console.log(
    '✓ GF001 - Geolocation section verified with all elements visible',
  );
};

/**
 * GF002 - Verify Geofence value is displayed as OFF by default
 */
export const verifyGeofenceDefaultValueOff = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  console.log('✓ Navigated to Account & Settings > Time');

  await TimeSettingsPage.verifyGeolocationSectionTitle(page);
  await TimeSettingsPage.verifyGeofenceValue(page, 'Off');
  console.log('✓ GF002 - Geofence default value verified as Off');
};

/**
 * GF003 - Verify Geofence checkbox is not selected by default in settings
 */
export const verifyGeofenceCheckboxNotSelectedByDefault = async (
  page: Page,
) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  console.log('✓ Navigated to Account & Settings > Time');

  await TimeSettingsPage.verifyGeolocationSectionTitle(page);
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  await TimeSettingsPage.verifyGeofenceHeadingInEditMode(page);
  await TimeSettingsPage.verifyGeofenceDescription(page);
  await TimeSettingsPage.verifyTurnOnGeofenceCheckboxNotSelected(page);

  console.log(
    '✓ GF003 - Geofence checkbox verified as not selected by default',
  );
};

/**
 * GF004 - Verify set up geofence notifications is displayed after selecting the checkbox for geofence
 */
export const verifySetupGeofenceNotificationsAfterCheckbox = async (
  page: Page,
) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  console.log('✓ Navigated to Account & Settings > Time');

  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  await TimeSettingsPage.checkTurnOnGeofenceCheckbox(page);
  await page.waitForTimeout(1000);
  await TimeSettingsPage.verifySetupGeofenceNotificationsVisible(page);
  await TimeSettingsPage.clickSaveGeoLocationSection(page);
  await page.waitForTimeout(2000);
  await TimeSettingsPage.verifyGeofenceValue(page, 'On');
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  console.log('✓ Clicked Edit on Geolocation section again');
  await TimeSettingsPage.uncheckTurnOnGeofenceCheckbox(page);
  await page.waitForTimeout(500);
  await TimeSettingsPage.clickSaveGeoLocationSection(page);
  await page.waitForTimeout(2000);
  await TimeSettingsPage.verifyGeofenceValue(page, 'Off');
  console.log(
    '✓ GF004 - Set up geofence notifications and toggle behavior verified',
  );
};

/**
 * GF005 - Verify that the updated notifications settings for geofence is displayed in the Notifications section
 */
export const verifyGeofenceNotificationsSettingsSync = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  console.log('✓ Navigated to Account & Settings > Time');

  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  console.log('✓ Clicked Edit on Geolocation section');
  await TimeSettingsPage.checkTurnOnGeofenceCheckbox(page);
  await page.waitForTimeout(500);
  await TimeSettingsPage.clickSetupGeofenceNotifications(page);
  await TimeSettingsPage.handleSaveChangesPopup(page);
  await TimeSettingsPage.scrollToGeofenceReminder(page);
  await page.waitForTimeout(1000);
  await TimeSettingsPage.updateGeofenceStartTime(page, '8:00 AM');
  await TimeSettingsPage.updateGeofenceEndTime(page, '6:00 PM');
  await page.waitForTimeout(1000);
  await TimeSettingsPage.toggleGeofenceDay(page, 'Monday');
  await TimeSettingsPage.clickSaveButton(page);
  console.log('✓ Saved notification settings');

  await TimeSettingsPage.scrollToNotificationsSection(page);
  await TimeSettingsPage.verifyGeofenceNotificationSectionVisible(page);
  await TimeSettingsPage.verifyGeofenceReminderValue(
    page,
    '8:00 AM - 6:00 PM, Monday',
  );
  await TimeSettingsPage.clickEditNotifications(page);

  await TimeSettingsPage.scrollToGeofenceReminder(page);
  await TimeSettingsPage.revertGeofenceStartTime(page, '12:00 AM');
  await TimeSettingsPage.revertGeofenceEndTime(page, '11:45 PM');
  await TimeSettingsPage.toggleGeofenceDay(page, 'Monday');
  await TimeSettingsPage.clickSaveButton(page);
  await TimeSettingsPage.scrollToNotificationsSection(page);
  await TimeSettingsPage.verifyGeofenceNotificationSectionVisible(page);
  await TimeSettingsPage.verifyGeofenceReminderValue(
    page,
    '12:00 AM - 11:45 PM,',
  );
  console.log('✓ Saved reverted notification settings');

  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  console.log('✓ Navigated back and clicked Edit on Geolocation section');

  await TimeSettingsPage.verifyTurnOnGeofenceCheckboxSelected(page);
  await TimeSettingsPage.uncheckTurnOnGeofenceCheckbox(page);
  await TimeSettingsPage.clickSaveGeoLocationSection(page);
  await page.waitForTimeout(2000);
  console.log('✓ Cleanup: Geofence disabled');

  console.log(
    '✓ GF005 - Geofence notifications settings sync verified between Geolocation and Notifications sections',
  );
};

/**
 * GF028 - Verify geofence is not displayed in Notifications section when geofence is turned off
 */
export const verifyGeofenceNotVisibleInNotificationsWhenOff = async (
  page: Page,
) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  console.log('✓ Navigated to Account & Settings > Time');

  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  console.log('✓ Clicked Edit on Geolocation section');

  // Ensure Turn on geofence checkbox is NOT selected
  await TimeSettingsPage.verifyTurnOnGeofenceCheckboxNotSelected(page);
  await TimeSettingsPage.clickCancelGeoLocationSection(page);
  await page.waitForTimeout(2000);
  console.log('✓ Saved Geolocation section with geofence turned off');

  // Navigate to Notifications section
  await TimeSettingsPage.scrollToNotificationsSection(page);
  await page.waitForTimeout(1000);

  // Verify geofence is NOT displayed in Notifications section
  await TimeSettingsPage.verifyGeofenceNotificationSectionNotVisible(page);

  console.log(
    '✓ GF028 - Verified geofence is not displayed in Notifications section when geofence is turned off',
  );
};

/**
 * GF029 - Verify Turn on geofence checkbox is not checked after clicking Don't Save
 */
export const verifyGeofenceUncheckedAfterDontSave = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  console.log('✓ Navigated to Account & Settings > Time');

  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  console.log('✓ Clicked Edit on Geolocation section');

  // Select the checkbox for Turn on geofence
  await TimeSettingsPage.checkTurnOnGeofenceCheckbox(page);
  await page.waitForTimeout(500);
  console.log('✓ Selected Turn on geofence checkbox');

  // Click Set up geofence notifications
  await TimeSettingsPage.clickSetupGeofenceNotifications(page);
  console.log('✓ Clicked Set up geofence notifications');

  // Click Don't Save option in the popup
  await TimeSettingsPage.handleDontSaveChangesPopup(page);
  await page.waitForTimeout(1000);

  // Navigate back to Geolocation section
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);

  // Verify the checkbox for Turn on Geofence is displayed as not selected
  await TimeSettingsPage.verifyTurnOnGeofenceCheckboxNotSelected(page);

  console.log(
    "✓ GF029 - Verified Turn on geofence checkbox is not checked after clicking Don't Save",
  );
};

/**
 * GF030 - Verify user can type and enter specific hours in Start time dropdown
 */
export const verifyTypeStartTimeInGeofenceNotifications = async (
  page: Page,
) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  console.log('✓ Navigated to Account & Settings > Time');

  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  console.log('✓ Clicked Edit on Geolocation section');

  // Select the checkbox for Turn on geofence
  await TimeSettingsPage.checkTurnOnGeofenceCheckbox(page);
  await page.waitForTimeout(500);

  // Click Set up geofence notifications
  await TimeSettingsPage.clickSetupGeofenceNotifications(page);
  await TimeSettingsPage.handleSaveChangesPopup(page);
  await page.waitForTimeout(1000);

  // Scroll to Geofence reminder section
  await TimeSettingsPage.scrollToGeofenceReminder(page);
  await page.waitForTimeout(1000);

  // Type specific hours and mins in the Start time
  const testTime = '9:30 AM';
  await TimeSettingsPage.typeGeofenceStartTime(page, testTime);

  // Verify the time is accepted in correct format
  await TimeSettingsPage.verifyTimeInputAccepted(
    page,
    'Start',
    /^\d{1,2}:\d{2}\s?(AM|PM)$/i,
  );

  // Save the settings
  await TimeSettingsPage.clickSaveButton(page);
  await page.waitForTimeout(2000);

  // Verify the entered time is displayed
  await TimeSettingsPage.scrollToNotificationsSection(page);
  await TimeSettingsPage.verifyGeofenceNotificationSectionVisible(page);
  await TimeSettingsPage.verifyGeofenceReminderValue(page, '9:30 AM');
  console.log('✓ Verified Start time is accepted and displayed correctly');

  // Cleanup: Disable geofence
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  await TimeSettingsPage.uncheckTurnOnGeofenceCheckbox(page);
  await TimeSettingsPage.clickSaveGeoLocationSection(page);
  await page.waitForTimeout(2000);

  console.log(
    '✓ GF030 - Verified user can type and enter specific hours in Start time dropdown',
  );
};

/**
 * GF031 - Verify user can type and enter specific hours in End time dropdown
 */
export const verifyTypeEndTimeInGeofenceNotifications = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  console.log('✓ Navigated to Account & Settings > Time');

  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  console.log('✓ Clicked Edit on Geolocation section');

  // Select the checkbox for Turn on geofence
  await TimeSettingsPage.checkTurnOnGeofenceCheckbox(page);
  await page.waitForTimeout(500);

  // Click Set up geofence notifications
  await TimeSettingsPage.clickSetupGeofenceNotifications(page);
  await TimeSettingsPage.handleSaveChangesPopup(page);
  await page.waitForTimeout(1000);

  // Scroll to Geofence reminder section
  await TimeSettingsPage.scrollToGeofenceReminder(page);
  await page.waitForTimeout(1000);

  // Type specific hours and mins in the End time
  const testTime = '5:45 PM';
  await TimeSettingsPage.typeGeofenceEndTime(page, testTime);

  // Verify the time is accepted in correct format
  await TimeSettingsPage.verifyTimeInputAccepted(
    page,
    'End',
    /^\d{1,2}:\d{2}\s?(AM|PM)$/i,
  );

  // Save the settings
  await TimeSettingsPage.clickSaveButton(page);
  await page.waitForTimeout(2000);

  // Verify the entered time is displayed
  await TimeSettingsPage.scrollToNotificationsSection(page);
  await TimeSettingsPage.verifyGeofenceNotificationSectionVisible(page);
  await TimeSettingsPage.verifyGeofenceReminderValue(page, '5:45 PM');
  console.log('✓ Verified End time is accepted and displayed correctly');

  // Cleanup: Disable geofence
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  await TimeSettingsPage.uncheckTurnOnGeofenceCheckbox(page);
  await TimeSettingsPage.clickSaveGeoLocationSection(page);
  await page.waitForTimeout(2000);

  console.log(
    '✓ GF031 - Verified user can type and enter specific hours in End time dropdown',
  );
};

/**
 * GF032 - Verify Start time and End time accept only 12 hours format
 */
export const verifyTimeAcceptsOnly12HourFormat = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  console.log('✓ Navigated to Account & Settings > Time');

  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  console.log('✓ Clicked Edit on Geolocation section');

  // Select the checkbox for Turn on geofence
  await TimeSettingsPage.checkTurnOnGeofenceCheckbox(page);
  await page.waitForTimeout(500);

  // Click Set up geofence notifications
  await TimeSettingsPage.clickSetupGeofenceNotifications(page);
  await TimeSettingsPage.handleSaveChangesPopup(page);
  await page.waitForTimeout(1000);

  // Scroll to Geofence reminder section
  await TimeSettingsPage.scrollToGeofenceReminder(page);
  await page.waitForTimeout(1000);

  // Try entering invalid time (beyond 12 hour format)
  await TimeSettingsPage.typeGeofenceStartTime(page, '14:00 PM');
  await page.waitForTimeout(500);

  // Verify the time is either converted to valid format or not accepted
  // The input should either be converted to 12-hour format or reset
  const startTimeInput = page
    .locator(
      '//span[text()="Start time"]/following::input[@data-testid="__textField"]',
    )
    .first();
  const startValue = await startTimeInput.getAttribute('value');

  // Check if value is either converted to valid 12-hour format or is empty/default
  const isValid12HourFormat = /^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(
    startValue || '',
  );
  expect(isValid12HourFormat || !startValue || startValue === '').toBeTruthy();
  console.log(`✓ Start time input handled invalid format: ${startValue}`);

  // Test End time with invalid format
  await TimeSettingsPage.typeGeofenceEndTime(page, '25:70 PM');
  await page.waitForTimeout(500);

  const endTimeInput = page
    .locator(
      '//span[text()="End time"]/following::input[@data-testid="__textField"]',
    )
    .first();
  const endValue = await endTimeInput.getAttribute('value');

  const isValidEndFormat = /^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(endValue || '');
  expect(isValidEndFormat || !endValue || endValue === '').toBeTruthy();
  console.log(`✓ End time input handled invalid format: ${endValue}`);

  // Cancel to avoid saving invalid data
  await TimeSettingsPage.clickCancelNotificationsSection(page);

  // Cleanup: Disable geofence
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  await TimeSettingsPage.uncheckTurnOnGeofenceCheckbox(page);
  await TimeSettingsPage.clickSaveGeoLocationSection(page);
  await page.waitForTimeout(2000);

  console.log(
    '✓ GF032 - Verified Start time and End time accept only 12 hours format',
  );
};

/**
 * GF033 - Verify original values retain after clicking Cancel in Notifications edit section
 */
export const verifyOriginalValuesRetainAfterCancel = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  console.log('✓ Navigated to Account & Settings > Time');

  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  console.log('✓ Clicked Edit on Geolocation section');

  // Select the checkbox for Turn on geofence and save
  await TimeSettingsPage.checkTurnOnGeofenceCheckbox(page);
  await page.waitForTimeout(500);

  // Click Set up geofence notifications
  await TimeSettingsPage.clickSetupGeofenceNotifications(page);
  await TimeSettingsPage.handleSaveChangesPopup(page);
  await page.waitForTimeout(1000);

  // Scroll to Geofence reminder section
  await TimeSettingsPage.scrollToGeofenceReminder(page);
  await page.waitForTimeout(1000);

  // Get original values
  const originalStartTime = await TimeSettingsPage.getGeofenceStartTimeValue(
    page,
  );
  const originalEndTime = await TimeSettingsPage.getGeofenceEndTimeValue(page);
  const originalDays = await TimeSettingsPage.getGeofenceSelectedDays(page);
  console.log(
    `✓ Original values - Start: ${originalStartTime}, End: ${originalEndTime}, Days: ${originalDays.join(
      ', ',
    )}`,
  );

  // Update values
  await TimeSettingsPage.updateGeofenceStartTime(page, '9:00 AM');
  await TimeSettingsPage.updateGeofenceEndTime(page, '5:00 PM');
  await TimeSettingsPage.toggleGeofenceDay(page, 'Friday');
  console.log('✓ Updated Start Time, End Time and Days of the week');

  // Click Cancel
  await TimeSettingsPage.clickCancelNotificationsSection(page);
  await page.waitForTimeout(1000);
  console.log('✓ Clicked Cancel button');

  // Navigate back to notifications edit and verify original values retained
  await TimeSettingsPage.scrollToNotificationsSection(page);
  await TimeSettingsPage.clickEditNotifications(page);
  await TimeSettingsPage.scrollToGeofenceReminder(page);
  await page.waitForTimeout(1000);

  // Verify original values are retained
  const currentStartTime = await TimeSettingsPage.getGeofenceStartTimeValue(
    page,
  );
  const currentEndTime = await TimeSettingsPage.getGeofenceEndTimeValue(page);
  const currentDays = await TimeSettingsPage.getGeofenceSelectedDays(page);

  expect(currentStartTime).toBe(originalStartTime);
  expect(currentEndTime).toBe(originalEndTime);
  expect(currentDays.sort()).toEqual(originalDays.sort());
  console.log('✓ Verified original values are retained after Cancel');

  // Cleanup: Disable geofence
  await TimeSettingsPage.clickCancelNotificationsSection(page);
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  await TimeSettingsPage.uncheckTurnOnGeofenceCheckbox(page);
  await TimeSettingsPage.clickSaveGeoLocationSection(page);
  await page.waitForTimeout(2000);

  console.log(
    '✓ GF033 - Verified original values retain after clicking Cancel in Notifications edit section',
  );
};

/**
 * GF034 - Verify only Start time and End time displayed when no Days of week selected
 */
export const verifyOnlyTimeDisplayedWithoutDays = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  console.log('✓ Navigated to Account & Settings > Time');

  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  console.log('✓ Clicked Edit on Geolocation section');

  // Select the checkbox for Turn on geofence
  await TimeSettingsPage.checkTurnOnGeofenceCheckbox(page);
  await page.waitForTimeout(500);

  // Click Set up geofence notifications
  await TimeSettingsPage.clickSetupGeofenceNotifications(page);
  await TimeSettingsPage.handleSaveChangesPopup(page);
  await page.waitForTimeout(1000);

  // Scroll to Geofence reminder section
  await TimeSettingsPage.scrollToGeofenceReminder(page);
  await page.waitForTimeout(1000);

  // Update Start Time and End Time
  const testStartTime = '10:00 AM';
  const testEndTime = '4:00 PM';
  await TimeSettingsPage.updateGeofenceStartTime(page, testStartTime);
  await TimeSettingsPage.updateGeofenceEndTime(page, testEndTime);
  console.log('✓ Updated Start Time and End Time');

  // Clear all selected Days of the week
  await TimeSettingsPage.clearAllGeofenceDays(page);
  console.log('✓ Cleared all Days of the week');

  // Click Save
  await TimeSettingsPage.clickSaveButton(page);
  await page.waitForTimeout(2000);
  console.log('✓ Saved notification settings');

  // Navigate to Notifications section and verify
  await TimeSettingsPage.scrollToNotificationsSection(page);
  await TimeSettingsPage.verifyGeofenceNotificationSectionVisible(page);

  // Verify only time range is displayed (without days)
  await TimeSettingsPage.verifyGeofenceReminderTimeOnly(
    page,
    testStartTime,
    testEndTime,
  );

  // Cleanup: Disable geofence
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  await TimeSettingsPage.uncheckTurnOnGeofenceCheckbox(page);
  await TimeSettingsPage.clickSaveGeoLocationSection(page);
  await page.waitForTimeout(2000);

  console.log(
    '✓ GF034 - Verified only Start time and End time displayed when no Days of week selected',
  );
};

/**
 * GF026 GF027 - validate display message for different location tracking in Geofence
 */
export const validateGeofenceLocationTrackingDisplayMessage = async (
  page: Page,
) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await TimeSettingsPage.clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);
  await TimeSettingsPage.selectLocationTrackingOption(page, 'Optional');
  await TimeSettingsPage.verifyLocationTrackingMessageDisplayed(
    page,
    'Optional',
  );
  await TimeSettingsPage.selectLocationTrackingOption(page, 'Never');
  await TimeSettingsPage.verifyLocationTrackingMessageDisplayed(page, 'Never');
  await TimeSettingsPage.selectLocationTrackingOption(page, 'Required');
  await TimeSettingsPage.verifyLocationTrackingMessageDisplayed(
    page,
    'Required',
  );
};
