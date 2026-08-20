import { expect, Page } from '@playwright/test';
import GeofencingPage from '../../pages/GeofencingPage';
import AssignmentsPage from '../../pages/AssignmentsPage';
import CustomersPage from '../../pages/CustomersPage';
import TimeMenuNavigationPage from '../../pages/TimeMenuNavigationPage';
import {
  handlePopupsInAnyOrder,
  navigateToAccountAndSettingsTime,
  clickEditGeoLocationSection,
  verifyGeoLocationSettingsSectionVisible,
  waitForLoadingToDisappear,
} from '../../pages/TimeSettingsPage';

// Test addresses for geofencing tests (structured format)
export const TEST_ADDRESSES = {
  VALID_ADDRESS_1: {
    street: '1600 Amphitheatre Parkway',
    city: 'Mountain View',
    state: 'CA',
    postalCode: '94043',
    country: 'USA',
  },
  VALID_ADDRESS_2: {
    street: '1 Infinite Loop',
    city: 'Cupertino',
    state: 'CA',
    postalCode: '95014',
    country: 'USA',
  },
  INVALID_ADDRESS: {
    street: 'Invalid Address 12345xyz',
    city: 'Invalid City',
    state: 'XX',
    postalCode: '00000',
  },
};

/**
 * Helper to get GeofencingPage instance
 */
const getGeofencingPage = (page: Page): GeofencingPage => {
  return new GeofencingPage(page);
};

/** Let Add/Edit customer drawer save register before reload or navigation (matches GeofencingPage.saveCustomer). */
const CUSTOMER_DRAWER_SAVE_SETTLE_MS = 3000;

async function saveCustomerDrawerAndSettle(
  page: Page,
  assignmentsPage: AssignmentsPage,
): Promise<void> {
  await assignmentsPage.saveCustomerDrawer();
  await page.waitForTimeout(CUSTOMER_DRAWER_SAVE_SETTLE_MS);
}

/**
 * Navigate to Time Settings and handle popups
 */
export const navigateToTimeSettings = async (page: Page) => {
  const geofencingPage = getGeofencingPage(page);
  await geofencingPage.gotoTimeSettings();
  await handlePopupsInAnyOrder(page);
};

/**
 * Enable geofence in company settings
 */
export const enableGeofenceInCompanySettings = async (page: Page) => {
  const geofencingPage = getGeofencingPage(page);
  await geofencingPage.enableGeofenceInCompanySettings();
};

/**
 * Disable geofence in company settings
 */
export const disableGeofenceInCompanySettings = async (page: Page) => {
  const geofencingPage = getGeofencingPage(page);
  await geofencingPage.disableGeofenceInCompanySettings();
};

/**
 * Check if geofence is enabled in company settings
 */
export const isGeofenceEnabled = async (page: Page): Promise<boolean> => {
  const geofencingPage = getGeofencingPage(page);
  await navigateToTimeSettings(page);
  return await geofencingPage.isGeofenceEnabled();
};

// ============================================================================
// GF013: Validate geofencing radius size is enabled for a customer with valid
// address when geofencing toggle is on
// ============================================================================
export const validateRadiusSizeEnabledWhenGeofenceOn = async (page: Page) => {
  const geofencingPage = getGeofencingPage(page);
  const assignmentsPage = new AssignmentsPage(page);
  let createdCustomerName: string | undefined;

  try {
    await enableGeofenceInCompanySettings(page);

    await geofencingPage.gotoAssignments();
    await handlePopupsInAnyOrder(page);
    await geofencingPage.openAddCustomerDrawer();

    const companyName = `GF013 Test ${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    await geofencingPage.enterCompanyName(companyName);
    await geofencingPage.enterFullAddress(TEST_ADDRESSES.VALID_ADDRESS_1);

    await saveCustomerDrawerAndSettle(page, assignmentsPage);
    createdCustomerName = companyName;

    await page.reload();
    await handlePopupsInAnyOrder(page);

    await geofencingPage.openGeofenceScreenForCustomer(companyName);
    await geofencingPage.toggleGeofenceOn();

    const radiusInput = geofencingPage.radiusInput();
    await expect(radiusInput).toBeVisible({ timeout: 15_000 });
    await expect(radiusInput).toBeEnabled();

    await geofencingPage.setRadiusSize('500');
    const updatedValue = await geofencingPage.getRadiusSize();
    expect(updatedValue).toBe('500');

    console.log(
      '✓ GF013: Radius size is enabled and editable when geofence toggle is on',
    );

    await geofencingPage.cancelAndDontSave();
  } finally {
    if (createdCustomerName) {
      await deactivateCustomerOnCustomersScreen(page, createdCustomerName);
    }
  }
};

// ============================================================================
// GF014: Customer without address — turn on geofence, expect address required error
// ============================================================================
export const validateMapNotDisplayedWithoutAddress = async (page: Page) => {
  const geofencingPage = getGeofencingPage(page);
  const assignmentsPage = new AssignmentsPage(page);
  let createdCustomerName: string | undefined;

  try {
    await enableGeofenceInCompanySettings(page);

    await geofencingPage.gotoAssignments();
    await handlePopupsInAnyOrder(page);
    await geofencingPage.openAddCustomerDrawer();

    const companyName = `GF014 Test ${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    await geofencingPage.enterCompanyName(companyName);

    await saveCustomerDrawerAndSettle(page, assignmentsPage);
    createdCustomerName = companyName;

    await page.reload();
    await handlePopupsInAnyOrder(page);

    await geofencingPage.openGeofenceScreenForCustomer(companyName);
    await geofencingPage.toggleGeofenceOn();

    await expect(
      geofencingPage.assignGeofenceAddressRequiredMessage(),
    ).toBeVisible({ timeout: 15_000 });

    console.log(
      '✓ GF014: With geofence on and no address, "Address is required" is shown',
    );

    await geofencingPage.cancelSettings();
  } finally {
    if (createdCustomerName) {
      await deactivateCustomerOnCustomersScreen(page, createdCustomerName);
    }
  }
};

// ============================================================================
// GF015: After billing address update, assign-geofence toggle is off — turn it on, then assert
// the geofence address field shows the updated billing address as one line.
// Create customer with address via Add drawer (Save), then turn geofence on from
// Assign geofence location (row menu), toggle on, then Save on the geofence drawer
// (`getByRole('button', { name: 'Save' })` on geofence flow — not `contact-drawer-save-button`). GF013 does not save
// that drawer (it cancels). Do not use
// createCustomerWithAddress({ enableGeofence }) here; the geofence switch lives
// on the assign-geofence drawer, not the add-customer form.
// After Edit customer → new address, Save → Assignments → **Assign geofence location** →
// turn geofence **on** again (product turns it off after billing address update), then
// validate address field → Cancel (no save).
// ============================================================================
export const validateGeofenceToggleRetainsOnAddressChange = async (
  page: Page,
) => {
  const geofencingPage = getGeofencingPage(page);
  const assignmentsPage = new AssignmentsPage(page);
  let createdCustomerName: string | undefined;

  try {
    await enableGeofenceInCompanySettings(page);

    const companyName = `GF015 Test ${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    await geofencingPage.gotoAssignments();
    await handlePopupsInAnyOrder(page);
    await geofencingPage.openAddCustomerDrawer();
    await geofencingPage.enterCompanyName(companyName);
    await geofencingPage.enterFullAddress(TEST_ADDRESSES.VALID_ADDRESS_1);
    await saveCustomerDrawerAndSettle(page, assignmentsPage);
    createdCustomerName = companyName;

    await page.reload();
    await handlePopupsInAnyOrder(page);

    await geofencingPage.openGeofenceScreenForCustomer(companyName);
    await geofencingPage.toggleGeofenceOn();
    await geofencingPage.saveAssignGeofenceDrawer();

    await page.reload();
    await handlePopupsInAnyOrder(page);

    await assignmentsPage.goto();
    await handlePopupsInAnyOrder(page);
    await assignmentsPage.openEditCustomerForCompany(companyName);

    await assignmentsPage.clearCustomerAddress();
    await assignmentsPage.fillCustomerAddress(TEST_ADDRESSES.VALID_ADDRESS_2);
    await saveCustomerDrawerAndSettle(page, assignmentsPage);

    // Reload so assignments/geofence use persisted billing; avoids stale first-address geocoding in the typeahead.
    // await page.reload();
    // await handlePopupsInAnyOrder(page);

    // await assignmentsPage.goto();
    // await handlePopupsInAnyOrder(page);

    // await geofencingPage.openGeofenceScreenForCustomer(companyName);
    // await geofencingPage.toggleGeofenceOn();

    await assignmentsPage.selectTab('WORKERS');
    await page.waitForTimeout(3000);
    await waitForLoadingToDisappear(page);

    await assignmentsPage.selectTab('CUSTOMERS');
    await page.waitForTimeout(3000);
    await waitForLoadingToDisappear(page);

    await geofencingPage.openGeofenceScreenForCustomer(companyName);
    await geofencingPage.toggleGeofenceOn();

    const geofenceAddressInput =
      geofencingPage.assignGeofenceAddressOrGpsInput();
    await expect(geofenceAddressInput).toBeVisible({ timeout: 20_000 });
    const updated = TEST_ADDRESSES.VALID_ADDRESS_2;
    // One formatted line; ZIP/country suffix can differ from billing (e.g. geocoder shows "9014" vs "95014").
    const expectedTogether = `${updated.street}, ${updated.city}, ${updated.state}`;
    // After billing change, the typeahead can briefly keep the previous geocoded line; wait until it matches the new contact.
    await expect(async () => {
      const v = await geofenceAddressInput.inputValue();
      expect(v.toLowerCase()).toContain(expectedTogether.toLowerCase());
    }).toPass({ timeout: 60_000, intervals: [500, 1000, 2000] });

    await geofencingPage
      .assignGeofenceDialog()
      .getByRole('button', { name: 'Cancel' })
      .click();
    const dontSave = page.getByRole('button', { name: "Don't save" });
    if (await dontSave.isVisible().catch(() => false)) {
      await dontSave.click();
    }

    console.log(
      '✓ GF015: Updated billing address appears in assign-geofence address field',
    );
  } finally {
    if (createdCustomerName) {
      await deactivateCustomerOnCustomersScreen(page, createdCustomerName);
    }
  }
};

// ============================================================================
// GF016: Validate radius size retains when address changed and changed back
// ============================================================================
export const validateRadiusSizeRetainsOnAddressChangeAndBack = async (
  page: Page,
) => {
  const geofencingPage = getGeofencingPage(page);
  const assignmentsPage = new AssignmentsPage(page);
  let createdCustomerName: string | undefined;

  try {
    await enableGeofenceInCompanySettings(page);

    const customRadius = '750';
    const companyName = `GF016 Test ${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // Same pattern as GF013/GF015: save contact first, then Assign geofence location → toggle → radius → Save on geofence drawer.
    await geofencingPage.gotoAssignments();
    await handlePopupsInAnyOrder(page);
    await geofencingPage.openAddCustomerDrawer();
    await geofencingPage.enterCompanyName(companyName);
    await geofencingPage.enterFullAddress(TEST_ADDRESSES.VALID_ADDRESS_1);
    await saveCustomerDrawerAndSettle(page, assignmentsPage);
    createdCustomerName = companyName;

    await page.reload();
    await handlePopupsInAnyOrder(page);

    await geofencingPage.openGeofenceScreenForCustomer(companyName);
    await geofencingPage.toggleGeofenceOn();
    await geofencingPage.setRadiusSize(customRadius);
    await geofencingPage.saveAssignGeofenceDrawer();

    await page.reload();
    await handlePopupsInAnyOrder(page);

    // Change billing address on Edit customer (contact drawer only — no geofence radius field there).
    await assignmentsPage.goto();
    await handlePopupsInAnyOrder(page);
    await assignmentsPage.openEditCustomerForCompany(companyName);

    await assignmentsPage.clearCustomerAddress();
    await assignmentsPage.fillCustomerAddress(TEST_ADDRESSES.VALID_ADDRESS_2);
    await saveCustomerDrawerAndSettle(page, assignmentsPage);

    // Radius lives on Assignments → Assign geofence location, not on Customers / Edit customer.
    await assignmentsPage.goto();
    await handlePopupsInAnyOrder(page);
    await geofencingPage.openGeofenceScreenForCustomer(companyName);
    await expect(geofencingPage.radiusInput()).toBeVisible({ timeout: 15_000 });
    await geofencingPage.setRadiusSize('500');
    await geofencingPage.saveAssignGeofenceDrawer();

    await page.reload();
    await handlePopupsInAnyOrder(page);

    await assignmentsPage.goto();
    await handlePopupsInAnyOrder(page);
    await assignmentsPage.openEditCustomerForCompany(companyName);

    await assignmentsPage.clearCustomerAddress();
    await assignmentsPage.fillCustomerAddress(TEST_ADDRESSES.VALID_ADDRESS_1);
    await saveCustomerDrawerAndSettle(page, assignmentsPage);

    await assignmentsPage.goto();
    await handlePopupsInAnyOrder(page);
    // Let billing address sync propagate before reading geofence radius for the restored address.
    await page.waitForTimeout(1500);

    await geofencingPage.openGeofenceScreenForCustomer(companyName);
    await expect(geofencingPage.radiusInput()).toBeVisible({ timeout: 15_000 });
    const addrField = geofencingPage.assignGeofenceAddressOrGpsInput();
    if (await addrField.isVisible().catch(() => false)) {
      await addrField.press('Tab');
      await page.waitForTimeout(400);
    }
    const currentRadius = await geofencingPage.getRadiusSize();
    expect(currentRadius).toBe(customRadius);

    const isMapVisible = await geofencingPage.isMapVisible();
    expect(isMapVisible).toBe(true);

    console.log(
      '✓ GF016: Radius size retained when address changed back to original',
    );

    await geofencingPage
      .assignGeofenceDialog()
      .getByRole('button', { name: 'Cancel' })
      .click({ timeout: 10_000 })
      .catch(() => {});
  } finally {
    if (createdCustomerName) {
      await deactivateCustomerOnCustomersScreen(page, createdCustomerName);
    }
  }
};

// ============================================================================
// GF017: With company geofencing off, assignments should not expose geofence at all
// (no table columns, no row action) — do not open assign-geofence UI to probe toggle/radius.
// ============================================================================
export const validateGeofenceNotDisplayedWhenDisabled = async (page: Page) => {
  const geofencingPage = getGeofencingPage(page);
  const assignmentsPage = new AssignmentsPage(page);
  let createdCustomerName: string | undefined;

  try {
    await disableGeofenceInCompanySettings(page);

    await geofencingPage.gotoAssignments();
    await handlePopupsInAnyOrder(page);

    expect(await geofencingPage.isGeofenceColumnVisible()).toBe(false);
    expect(await geofencingPage.isGeofenceAddressColumnVisible()).toBe(false);

    await geofencingPage.openAddCustomerDrawer();

    const companyName = `GF017 Test ${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    await geofencingPage.enterCompanyName(companyName);
    await geofencingPage.enterFullAddress(TEST_ADDRESSES.VALID_ADDRESS_1);

    await saveCustomerDrawerAndSettle(page, assignmentsPage);
    createdCustomerName = companyName;

    await page.reload();
    await handlePopupsInAnyOrder(page);

    await geofencingPage.gotoAssignments();
    await handlePopupsInAnyOrder(page);

    expect(await geofencingPage.isGeofenceColumnVisible()).toBe(false);
    expect(await geofencingPage.isGeofenceAddressColumnVisible()).toBe(false);

    const dropdown = geofencingPage.customerActionDropdown(companyName);
    await expect(dropdown).toBeVisible();
    await dropdown.click();
    await expect(geofencingPage.assignGeofenceLocationOption()).toHaveCount(0);

    await page.keyboard.press('Escape');

    console.log(
      '✓ GF017: No geofence columns or Assign geofence action when geofence disabled in company settings',
    );
  } finally {
    if (createdCustomerName) {
      await deactivateCustomerOnCustomersScreen(page, createdCustomerName);
    }
  }
};

// ============================================================================
// GF018: Non-elite — no Time app in QBO navigation; Settings → Time has no Geolocation/Geofence
// (Assignments and other Time surfaces are not reachable without the Time app.)
// ============================================================================
export const validateGeofenceNotDisplayedForNonElite = async (page: Page) => {
  const geofencingPage = getGeofencingPage(page);
  const timeMenuPage = new TimeMenuNavigationPage(page);

  await page.waitForLoadState('load').catch(() => {});
  await page.waitForTimeout(2000);

  console.log(
    'GF018: Hover My apps / All apps — Time must not appear for non-elite (no Time workflows in nav).',
  );
  await timeMenuPage.myAppsMenu.hover({ timeout: 15_000 });
  await page.waitForTimeout(2000);
  // GF018-only: bounded wait; other suites keep default timeouts on shared page objects.
  await expect(timeMenuPage.timeMenu).not.toBeVisible({ timeout: 15_000 });
  console.log('✓ GF018: Time app is not visible in the main app navigation');

  await navigateToTimeSettings(page);
  await handlePopupsInAnyOrder(page);

  await expect(page).toHaveURL(/accountsettings/, { timeout: 15_000 });
  await expect(page).toHaveURL(/[?&]p=time/, { timeout: 15_000 });

  const geolocationSection = geofencingPage.geolocationSection();
  await expect(geolocationSection).not.toBeVisible({ timeout: 15_000 });

  console.log(
    '✓ GF018: Settings → Time loads but Geolocation / Geofence UI is not shown for non-elite company',
  );
};

// ============================================================================
// GF019: Geofence / Geofence address column headers absent when company geofencing disabled
// ============================================================================
export const validateAssignmentPageWithoutGeofenceColumns = async (
  page: Page,
) => {
  const geofencingPage = getGeofencingPage(page);

  // Pre-requisite: Disable geofence in company settings
  await disableGeofenceInCompanySettings(page);

  // Navigate to Assignments page
  await geofencingPage.gotoAssignments();
  await handlePopupsInAnyOrder(page);

  // Verify columns
  await geofencingPage.verifyAssignmentTableColumnsWithoutGeofence();

  console.log(
    '✓ GF019: Geofence and Geofence address columns NOT displayed when geofence disabled',
  );
};

// ============================================================================
// GF020: Validate assignment page displays Geofence columns when enabled
// ============================================================================
export const validateAssignmentPageWithGeofenceColumns = async (page: Page) => {
  const geofencingPage = getGeofencingPage(page);

  // Pre-requisite: Enable geofence in company settings
  await enableGeofenceInCompanySettings(page);

  // Navigate to Assignments page
  await geofencingPage.gotoAssignments();
  await handlePopupsInAnyOrder(page);

  // Verify columns
  await geofencingPage.verifyAssignmentTableColumnsWithGeofence();

  console.log(
    '✓ GF020: Geofence and Geofence address columns displayed along with other columns',
  );
};

/**
 * Expands common USPS-style tokens so formatted UI values (e.g. "Pkwy")
 * still match structured test addresses ("Parkway").
 */
function normalizeAddressLineForContainsCompare(s: string): string {
  let t = s.toLowerCase();
  const expansions: Array<[RegExp, string]> = [
    [/\bpkwy\b/g, 'parkway'],
    [/\bpky\b/g, 'parkway'],
    [/\bblvd\b/g, 'boulevard'],
    [/\bave\b/g, 'avenue'],
    [/\bdr\b/g, 'drive'],
    [/\brd\b/g, 'road'],
    [/\bln\b/g, 'lane'],
    [/\bct\b/g, 'court'],
    [/\bpl\b/g, 'place'],
    [/\bcir\b/g, 'circle'],
    [/\bhwy\b/g, 'highway'],
    [/\bfwy\b/g, 'freeway'],
    [/\bste\b/g, 'suite'],
    [/\bst\b/g, 'street'],
  ];
  for (const [re, rep] of expansions) {
    t = t.replace(re, rep);
  }
  return t;
}

function expectAssignGeofenceInputContainsAddress(
  value: string,
  address: { street: string; city: string; state: string },
  stepLabel?: string,
): void {
  const needle = `${address.street}, ${address.city}, ${address.state}`;
  const haystack = value.toLowerCase();
  const needleLc = needle.toLowerCase();
  const rawIncludes = haystack.includes(needleLc);
  const normalizedHay = normalizeAddressLineForContainsCompare(value);
  const normalizedNeedle = normalizeAddressLineForContainsCompare(needle);
  const includes = normalizedHay.includes(normalizedNeedle);
  const prefix = stepLabel ? `[${stepLabel}] ` : '';

  if (!includes) {
    console.log(
      `${prefix}[expectAssignGeofenceInputContainsAddress] assign-geofence field vs expected substring`,
    );
    console.log(`${prefix}  address object:`, JSON.stringify(address));
    console.log(`${prefix}  expected substring (needle): "${needle}"`);
    console.log(`${prefix}  actual field value: "${value}"`);
    console.log(`${prefix}  raw includes(needle): ${rawIncludes}`);
    console.log(
      `${prefix}  normalized includes (abbrev-expanded): ${includes}`,
    );
    console.log(`${prefix}  normalized haystack: "${normalizedHay}"`);
    console.log(`${prefix}  normalized needle: "${normalizedNeedle}"`);
    let i = 0;
    while (
      i < normalizedHay.length &&
      i < normalizedNeedle.length &&
      normalizedHay[i] === normalizedNeedle[i]
    ) {
      i += 1;
    }
    console.log(
      `${prefix}  first mismatch index on normalized strings (0-based): ${i}`,
    );
  }

  expect(
    includes,
    `Assign-geofence field should contain "${needle}" (after normalizing common street abbreviations); got: ${value}`,
  ).toBe(true);
}

// ============================================================================
// GF021: Assign-geofence drawer — change address + radius, verify persisted;
// revert address in drawer and expect radius stored for the original address.
// ============================================================================
export const validateAssignGeofenceDrawerAddressRadiusThenRevertRetainsRadius =
  async (page: Page) => {
    const geofencingPage = getGeofencingPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    let createdCustomerName: string | undefined;
    const radiusForAddress1 = '400';
    const radiusForAddress2 = '750';
    const addr1 = TEST_ADDRESSES.VALID_ADDRESS_1;
    const addr2 = TEST_ADDRESSES.VALID_ADDRESS_2;

    try {
      await enableGeofenceInCompanySettings(page);

      const companyName = `GF021 Test ${Math.random()
        .toString(36)
        .substring(2, 8)}`;
      await geofencingPage.gotoAssignments();
      await handlePopupsInAnyOrder(page);
      await geofencingPage.openAddCustomerDrawer();
      await geofencingPage.enterCompanyName(companyName);
      await geofencingPage.enterFullAddress(addr1);
      await saveCustomerDrawerAndSettle(page, assignmentsPage);
      createdCustomerName = companyName;

      await page.reload();
      await handlePopupsInAnyOrder(page);

      await geofencingPage.openGeofenceScreenForCustomer(companyName);
      await geofencingPage.toggleGeofenceOn();
      await geofencingPage.setRadiusSize(radiusForAddress1);
      await geofencingPage.saveAssignGeofenceDrawer();

      await page.reload();
      await handlePopupsInAnyOrder(page);

      await geofencingPage.openGeofenceScreenForCustomer(companyName);
      await geofencingPage.toggleGeofenceOn();
      await geofencingPage.setAssignGeofenceAddressByTypingAndSuggestion(addr2);
      await geofencingPage.setRadiusSize(radiusForAddress2);
      await geofencingPage.saveAssignGeofenceDrawer();

      await page.reload();
      await handlePopupsInAnyOrder(page);

      await geofencingPage.openGeofenceScreenForCustomer(companyName);
      await geofencingPage.toggleGeofenceOn();
      const afterSecondSave = await geofencingPage
        .assignGeofenceAddressOrGpsInput()
        .inputValue();
      expectAssignGeofenceInputContainsAddress(
        afterSecondSave,
        addr2,
        'GF021 after second address save',
      );
      expect(await geofencingPage.getRadiusSize()).toBe(radiusForAddress2);

      await geofencingPage.setAssignGeofenceAddressByTypingAndSuggestion(addr1);
      const radiusAfterRevertAddress = await geofencingPage.getRadiusSize();
      expect(radiusAfterRevertAddress).toBe(radiusForAddress1);

      await geofencingPage.saveAssignGeofenceDrawer();

      await page.reload();
      await handlePopupsInAnyOrder(page);

      await geofencingPage.openGeofenceScreenForCustomer(companyName);
      await geofencingPage.toggleGeofenceOn();
      const finalAddr = await geofencingPage
        .assignGeofenceAddressOrGpsInput()
        .inputValue();
      expectAssignGeofenceInputContainsAddress(
        finalAddr,
        addr1,
        'GF021 final after revert to addr1',
      );
      expect(await geofencingPage.getRadiusSize()).toBe(radiusForAddress1);

      await geofencingPage.cancelAndDontSave();

      console.log(
        '✓ GF021: Assign drawer address + radius update; reverting address restores prior radius',
      );
    } finally {
      if (createdCustomerName) {
        await deactivateCustomerOnCustomersScreen(page, createdCustomerName);
      }
    }
  };

// ============================================================================
// GF022: Change assign-geofence address in drawer, save — billing address in
// Edit customer matches the new location.
// ============================================================================
export const validateGeofenceDrawerAddressSyncsToEditCustomer = async (
  page: Page,
) => {
  const geofencingPage = getGeofencingPage(page);
  const assignmentsPage = new AssignmentsPage(page);
  let createdCustomerName: string | undefined;
  const addr1 = TEST_ADDRESSES.VALID_ADDRESS_1;
  const addr2 = TEST_ADDRESSES.VALID_ADDRESS_2;

  try {
    await enableGeofenceInCompanySettings(page);

    const companyName = `GF022 Test ${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    await geofencingPage.gotoAssignments();
    await handlePopupsInAnyOrder(page);
    await geofencingPage.openAddCustomerDrawer();
    await geofencingPage.enterCompanyName(companyName);
    await geofencingPage.enterFullAddress(addr1);
    await saveCustomerDrawerAndSettle(page, assignmentsPage);
    createdCustomerName = companyName;

    await page.reload();
    await handlePopupsInAnyOrder(page);

    await geofencingPage.openGeofenceScreenForCustomer(companyName);
    await geofencingPage.toggleGeofenceOn();
    await geofencingPage.saveAssignGeofenceDrawer();

    await page.reload();
    await handlePopupsInAnyOrder(page);

    await geofencingPage.openGeofenceScreenForCustomer(companyName);
    await geofencingPage.toggleGeofenceOn();
    await geofencingPage.setAssignGeofenceAddressByTypingAndSuggestion(addr2);
    // Brief settle so Places `getDetails` / Redux `selectedPlace` can update before Save.
    await page.waitForTimeout(2500);
    const geofenceSaveResponse = page.waitForResponse(
      (response) => {
        if (response.request().method() !== 'POST') {
          return false;
        }
        const data = response.request().postData() ?? '';
        return (
          data.includes('updateGeofenceConfiguration') &&
          response.status() >= 200 &&
          response.status() < 300
        );
      },
      { timeout: 45_000 },
    );
    await geofencingPage.saveAssignGeofenceDrawer();
    await geofenceSaveResponse;

    await assignmentsPage.goto();
    await handlePopupsInAnyOrder(page);
    await page.reload();
    await handlePopupsInAnyOrder(page);

    const geofenceAddrCell =
      geofencingPage.assignmentsTableGeofenceAddressCellForCustomer(
        companyName,
      );
    let persistedGeofenceAddressText = '';
    if (await geofenceAddrCell.isVisible().catch(() => false)) {
      persistedGeofenceAddressText = (
        (await geofenceAddrCell.textContent()) ?? ''
      ).trim();
    }
    console.log(
      '[GF022]  assignments geofence-address cell (shipping from summary):',
      JSON.stringify(persistedGeofenceAddressText),
    );

    await assignmentsPage.openEditCustomerForCompany(companyName);
    await assignmentsPage
      .customerStreetAddressInput()
      .waitFor({ state: 'visible', timeout: 20_000 });
    await page.waitForTimeout(1500);

    const street = await assignmentsPage
      .customerStreetAddressInput()
      .inputValue();
    const city = await assignmentsPage.customerCityInput().inputValue();
    const state = await assignmentsPage.customerStateInput().inputValue();

    const streetMatch = normalizeAddressLineForContainsCompare(street).includes(
      normalizeAddressLineForContainsCompare(addr2.street),
    );
    const cityMatch = city.toLowerCase().includes(addr2.city.toLowerCase());
    const stateMatch = state.toLowerCase().includes(addr2.state.toLowerCase());

    console.log(
      '[GF022] Edit customer — billing fields vs geofence target (addr2)',
    );
    console.log(
      '[GF022]  initial customer address was addr1:',
      JSON.stringify(addr1),
    );
    console.log(
      '[GF022]  after geofence drawer, expect billing ~ addr2:',
      JSON.stringify(addr2),
    );
    console.log(
      '[GF022]  assignments geofence-address cell (persisted):',
      JSON.stringify(persistedGeofenceAddressText),
    );
    console.log('[GF022]  billing street inputValue:', JSON.stringify(street));
    console.log('[GF022]  billing city inputValue:', JSON.stringify(city));
    console.log('[GF022]  billing state inputValue:', JSON.stringify(state));
    console.log(
      `[GF022]  billing street matches addr2.street (normalized): ${streetMatch} (needle: ${JSON.stringify(
        addr2.street,
      )})`,
    );
    console.log(
      `[GF022]  billing city matches addr2.city: ${cityMatch} (needle: ${JSON.stringify(
        addr2.city,
      )})`,
    );
    console.log(
      `[GF022]  billing state matches addr2.state: ${stateMatch} (needle: ${JSON.stringify(
        addr2.state,
      )})`,
    );

    expect(
      streetMatch,
      `Billing street should reflect geofence address. Assignments geofence column: ${JSON.stringify(
        persistedGeofenceAddressText,
      )}; billing street: ${JSON.stringify(street)}`,
    ).toBe(true);
    expect(
      cityMatch,
      `Billing city should reflect geofence address. Assignments geofence column: ${JSON.stringify(
        persistedGeofenceAddressText,
      )}; billing city: ${JSON.stringify(city)}`,
    ).toBe(true);
    expect(
      stateMatch,
      `Billing state should reflect geofence address; got: ${state}`,
    ).toBe(true);

    await assignmentsPage.drawerCloseButton().click();
    const dontSave = page.getByRole('button', { name: "Don't save" });
    if (await dontSave.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dontSave.click();
    }

    console.log(
      '✓ GF022: Assign-geofence address update is reflected in Edit customer billing',
    );
  } finally {
    if (createdCustomerName) {
      await deactivateCustomerOnCustomersScreen(page, createdCustomerName);
    }
  }
};

// ============================================================================
// Cleanup utilities
// ============================================================================

/**
 * Customers → row expand → Make inactive → confirm. Asserts name is gone from list.
 * Wrapped in try/catch so teardown does not mask test failures.
 */
export const deactivateCustomerOnCustomersScreen = async (
  page: Page,
  customerName: string,
): Promise<void> => {
  try {
    const customersPage = new CustomersPage(page);
    await customersPage.makeCustomerInactive(customerName);
    console.log(`✓ Deactivated customer on Customers screen: ${customerName}`);
  } catch (error) {
    console.warn(
      `Could not deactivate customer "${customerName}" on Customers screen:`,
      error,
    );
  }
};

export const cleanupGeofenceSettings = async (
  page: Page,
  enableGeofence: boolean,
) => {
  try {
    if (enableGeofence) {
      await enableGeofenceInCompanySettings(page);
    } else {
      await disableGeofenceInCompanySettings(page);
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
};
