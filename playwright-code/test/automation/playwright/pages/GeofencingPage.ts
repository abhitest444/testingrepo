import { expect, Locator, Page } from '@playwright/test';
import AssignmentsPage from './AssignmentsPage';

/** Allow Add/Edit customer save to persist before reload or the next step. */
const CUSTOMER_DRAWER_SAVE_SETTLE_MS = 3000;

/** Substring shared by QBO address-resolution errors (wording after this may differ). */
const ASSIGN_GEOFENCE_ADDRESS_ERROR_SNIPPET =
  'having trouble with this address';

/** After map fullscreen is up, allow address validation UI to catch up before reading the error. */
const ASSIGN_GEOFENCE_AFTER_MAP_FULLSCREEN_MS = 2_000;

/** After opening Time Settings → Geolocation edit, checkbox state can lag real value in prod. */
const TIME_SETTINGS_GEOFENCE_EDIT_SETTLE_MS = 2_000;

export default class GeofencingPage {
  private readonly page: Page;
  private readonly assignmentsPage: AssignmentsPage;
  private readonly timeSettingsUrl = '/app/accountsettings?p=time';
  private readonly assignmentsUrl = '/app/time/assignments?jobId=time';

  constructor(page: Page) {
    this.page = page;
    this.assignmentsPage = new AssignmentsPage(page);
  }

  // ==================== Navigation ====================

  async gotoTimeSettings(): Promise<void> {
    await this.page.goto(this.timeSettingsUrl, { waitUntil: 'load' });
    await this.page.waitForLoadState('load');
  }

  async gotoAssignments(): Promise<void> {
    await this.page.goto(this.assignmentsUrl, { waitUntil: 'load' });
    await this.page.waitForLoadState('load');
  }

  // ==================== Geolocation Section Locators ====================
  // Using existing data-testid from TimeSettingsPage.ts

  geolocationSection(): Locator {
    return this.page.locator(
      `//div[@data-testid='geo-locations-settings-handle']`,
    );
  }

  geolocationSectionTitle(): Locator {
    return this.page.locator(
      `//div[@data-testid='geo-locations-settings-handle']//span[text()='Geolocation']`,
    );
  }

  geolocationEditButton(): Locator {
    return this.page.locator(
      `//div[@data-testid='geo-locations-settings-handle']//button[@aria-label='Edit']`,
    );
  }

  geolocationDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Geolocation' });
  }

  geofenceValueDisplay(): Locator {
    return this.page.locator(
      `//div[@data-testid='geo-locations-settings-handle']//label[text()='Geofence']/following-sibling::span`,
    );
  }

  geofenceCheckbox(): Locator {
    return this.page
      .locator('[data-testid="geofencing-checkbox"]')
      .or(
        this.page.locator(
          `xpath=//*[contains(normalize-space(.),'Turn on geofence')]/ancestor::label/descendant::input`,
        ),
      );
  }

  geofenceLabel(): Locator {
    return this.page.locator(
      `xpath=//*[contains(normalize-space(.),'Turn on geofence')]`,
    );
  }

  geofenceDescription(): Locator {
    return this.page.getByText(
      'Geofences are invisible boundaries around specific areas',
    );
  }

  setupGeofenceNotificationsLink(): Locator {
    return this.page.getByText('Set up geofence notifications');
  }

  locationTrackingLabel(): Locator {
    return this.page.locator(
      '//label[text()="Location tracking"]/following-sibling::span',
    );
  }

  // ==================== Customer Drawer Geofence Locators ====================
  // Note: Basic customer form locators (name, address, save) are in AssignmentsPage
  // These are geofence-specific locators within the customer drawer

  // ==================== Assignment Page - Geofence Access ====================

  customerActionDropdown(customerName: string): Locator {
    return this.page
      .locator('table[summary="Customer assignment table"] tbody tr')
      .filter({ hasText: customerName })
      .locator('button[aria-haspopup="menu"]');
  }

  /** Row overflow: label is "Assign geofence location" or "Edit geofence location" depending on shell / state. */
  assignGeofenceLocationOption(): Locator {
    return this.page.getByRole('menuitem', {
      name: /^(Assign|Edit) geofence location$/i,
    });
  }

  assignWorkersButton(customerName: string): Locator {
    return this.page
      .locator('table[summary="Customer assignment table"] tbody tr')
      .filter({ hasText: customerName })
      .getByRole('button', { name: 'Assign Workers' });
  }

  // ==================== Geofence Screen Locators ====================

  /**
   * Assign geofence location drawer — "Turn on geofence" control (QBO / IDS DOM).
   *
   * Structure (e2e):
   * - Row: `div` with class `GeofenceDrawerstyled__ToggleRow-*`
   * - Copy: `span` with class `GeofenceDrawerstyled__ToggleLabel-*` → text "Turn on geofence"
   * - Input: inside `span.idsTSSwitch.Switch-wrapper-*` — native control is
   *   `input.idsCheckbox__input` with `type="checkbox"`, `role="switch"`,
   *   `aria-label="Turn on geofence"`, `aria-checked="true"|"false"`.
   *   (Do not rely on hashed suffixes like `Switch-switch-86340d8` — they change per build.)
   *
   * Prefer role + name; `.or()` matches the same node via stable attributes if needed.
   */
  assignGeofenceModalToggle(): Locator {
    return this.page
      .getByRole('switch', { name: 'Turn on geofence' })
      .or(
        this.page.locator(
          'input[role="switch"][type="checkbox"][aria-label="Turn on geofence"]',
        ),
      );
  }

  /**
   * Same switch scoped under the assign-geofence dialog when you need disambiguation.
   */
  assignGeofenceDialogGeofenceSwitch(): Locator {
    return this.assignGeofenceDialog().getByRole('switch', {
      name: 'Turn on geofence',
    });
  }

  /**
   * Assign-geofence drawer: IDS drawer with `drawerTitle` (same root as `Geofence.util` `geofenceDrawerRoot`).
   */
  assignGeofenceDialog(): Locator {
    return this.page
      .getByRole('dialog')
      .filter({
        has: this.page
          .locator('[data-testid="drawerTitle"]')
          .getByText(/Assign geofence location|Edit geofence location/i),
      })
      .first();
  }

  /** Assign geofence panel — single-line address / GPS typeahead (IDS). */
  assignGeofenceAddressOrGpsInput(): Locator {
    return this.assignGeofenceDialog().getByLabel(
      'Enter an address or GPS coordinates',
    );
  }

  /**
   * First autocomplete row under the address field (`//ul/li[1]/span` in DOM terms).
   * Prefer the assign-geofence panel; falls back to the first `ul > li > span` on the page if needed.
   */
  assignGeofenceAddressFirstSuggestion(): Locator {
    return this.assignGeofenceDialog()
      .locator('ul li')
      .first()
      .locator('span')
      .first();
  }

  /** Switch in modal, else time-settings checkbox — for shared assertions. */
  geofenceToggle(): Locator {
    return this.assignGeofenceModalToggle()
      .or(this.page.locator('[data-testid="geofencing-checkbox"]'))
      .or(this.page.getByRole('checkbox', { name: 'Turn on geofence' }));
  }

  geofenceToggleSwitch(): Locator {
    return this.assignGeofenceModalToggle().or(
      this.page.locator(
        `xpath=//*[contains(normalize-space(.),'Turn on geofence')]/ancestor::label`,
      ),
    );
  }

  radiusSlider(): Locator {
    return this.assignGeofenceDialog().locator(
      '[data-testid="geofence-radius-slider"]',
    );
  }

  /**
   * Radius IDS typeahead inside **Assign geofence location** only (second `__textField` there;
   * billing / contact drawers also use `__textField` and must not be read as radius).
   */
  radiusInput(): Locator {
    return this.assignGeofenceDialog()
      .locator('[data-testid="__textField"]')
      .nth(1);
  }

  /** Outer wrapper: `div.idsDropdownTypeahead__wrapper` (avoid hashed `idsDropdownTypeahead-wrapper-*` suffix). */
  radiusSizeDropdown(): Locator {
    const panel = this.assignGeofenceDialog();
    return panel
      .locator('div.idsDropdownTypeahead__wrapper')
      .or(this.page.locator('[data-testid="geofence-radius-dropdown"]'));
  }

  /**
   * Map host: `…GeofenceMapHost…` (styled-components); tiles use `.gm-style`.
   * Includes page-level class match when the geofence panel is not a dialog in the a11y tree.
   */
  mapContainer(): Locator {
    const panel = this.assignGeofenceDialog();
    return panel
      .locator('[class*="GeofenceMapHost"]')
      .or(panel.locator('[data-testid="geofence-map"]'));
  }

  /**
   * Map fullscreen control (Google) — you provided this XPath; it appears only after the map is fully loaded.
   */
  assignGeofenceMapFullscreenToggle(): Locator {
    return this.page.locator('xpath=//*[@aria-label="Toggle fullscreen view"]');
  }

  noLocationMessage(): Locator {
    return this.page.getByText('No Location');
  }

  /** Shown when geofence is on and the address field is empty (`assignments.geofence.drawer.addressRequired`). */
  assignGeofenceAddressRequiredMessage(): Locator {
    return this.assignGeofenceDialog().getByText('Address is required');
  }

  addValidAddressDescription(): Locator {
    return this.page.getByText(
      'Add a valid address to set nearby Customer options',
    );
  }

  // ==================== Buttons ====================

  saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save' });
  }

  /**
   * Assign-geofence drawer footer Save — scoped to the assign-geofence dialog so we do not
   * hit the Add/Edit customer drawer Save (`contact-drawer-save-button`).
   */
  assignGeofenceDrawerSaveButton(): Locator {
    return this.assignGeofenceDialog().getByRole('button', { name: /^Save$/ });
  }

  cancelButton(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  closeButton(): Locator {
    return this.page.getByRole('button', { name: 'Close' });
  }

  dontSaveButton(): Locator {
    return this.page.getByRole('button', { name: "Don't save" });
  }

  // ==================== Assignment Table Locators ====================

  customerAssignmentTable(): Locator {
    return this.page.locator('table[summary="Customer assignment table"]');
  }

  geofenceColumnHeader(): Locator {
    return this.customerAssignmentTable().getByRole('columnheader', {
      name: /^Geofence$/,
    });
  }

  geofenceAddressColumnHeader(): Locator {
    return this.page.locator('th:has-text("Geofence address")');
  }

  customersColumnHeader(): Locator {
    return this.page.locator('th:has-text("Customers")');
  }

  workersColumnHeader(): Locator {
    return this.page.locator('th:has-text("Workers")');
  }

  timeTrackingColumnHeader(): Locator {
    return this.page.locator('th:has-text("Time tracking")');
  }

  actionsColumnHeader(): Locator {
    return this.page.locator('th:has-text("Actions")');
  }

  customerRow(customerName: string): Locator {
    return this.page
      .locator('table[summary="Customer assignment table"] tbody tr')
      .filter({ hasText: customerName });
  }

  geofenceCellForCustomer(customerName: string): Locator {
    return this.customerRow(customerName).locator(
      'td[data-testid*="geofence"]',
    );
  }

  /**
   * Assignments table inline geofence switch (`CustomerAssignmentTable` → `geofence-toggle-{nodeId}`).
   * Not `assignGeofenceModalToggle`: that uses aria-label "Turn on geofence" on GeofenceDrawer only.
   */
  assignmentsTableGeofenceSwitchForCustomer(customerName: string): Locator {
    const row = this.customerRow(customerName).first();
    return row
      .locator('td[data-testid^="geofence-toggle-"]')
      .getByRole('switch')
      .or(row.getByRole('switch', { name: /Geofence for/i }));
  }

  /** Assignments grid geofence **address** column (`geofence-address-{nodeId}`), not the toggle cell. */
  assignmentsTableGeofenceAddressCellForCustomer(
    customerName: string,
  ): Locator {
    return this.customerRow(customerName)
      .first()
      .locator('td[data-testid^="geofence-address-"]');
  }

  // ==================== Notification Settings Locators ====================

  notificationStartTimeInput(): Locator {
    return this.page.locator('[data-testid="notification-start-time"]');
  }

  notificationEndTimeInput(): Locator {
    return this.page.locator('[data-testid="notification-end-time"]');
  }

  notificationDayCheckbox(day: string): Locator {
    return this.page.locator(`input[aria-label="${day}"]`);
  }

  // ==================== Error Messages ====================

  invalidAddressError(): Locator {
    return this.page
      .getByText(ASSIGN_GEOFENCE_ADDRESS_ERROR_SNIPPET, { exact: false })
      .first();
  }

  /** Red address validation line in the assign-geofence drawer (substring match). */
  assignGeofenceAddressTroubleError(): Locator {
    return this.assignGeofenceDialog()
      .getByText(ASSIGN_GEOFENCE_ADDRESS_ERROR_SNIPPET, { exact: false })
      .first();
  }

  /**
   * Map shell ready indicator after turning geofence on in the assign-geofence drawer.
   */
  assignGeofenceMapPlaceholder(): Locator {
    return this.page.locator(
      "xpath=//*[contains(@class, 'GeofenceDrawerstyled__MapPlaceholder')]",
    );
  }

  /**
   * Waits until the embedded map is fully loaded (fullscreen control is rendered).
   */
  async waitForAssignGeofenceMapFullyLoaded(options?: {
    timeout?: number;
  }): Promise<void> {
    const timeout = options?.timeout ?? 120_000;
    await expect(this.assignGeofenceMapFullscreenToggle()).toBeVisible({
      timeout,
    });
  }

  /**
   * After the map is up, QBO may show an address-resolution error until the user picks a suggestion.
   * Wait for the map fullscreen control, then if the error is visible run backspace + first suggestion; otherwise no-op.
   */
  async resolveAssignGeofenceAddressViaSuggestionIfInvalid(): Promise<void> {
    await this.waitForAssignGeofenceMapFullyLoaded().catch(() => {
      /* No fullscreen control (e.g. maps blocked) — still check once for the error */
    });
    await this.page.waitForTimeout(ASSIGN_GEOFENCE_AFTER_MAP_FULLSCREEN_MS);

    const err = this.assignGeofenceAddressTroubleError();
    if (!(await err.isVisible())) {
      return;
    }

    const input = this.assignGeofenceAddressOrGpsInput();
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.click();
    await input.press('Backspace');
    await this.page.waitForTimeout(800);
    const inPanel = this.assignGeofenceAddressFirstSuggestion();
    const fallback = this.page.locator('xpath=//ul/li[1]/span').first();
    if (await inPanel.isVisible({ timeout: 4000 }).catch(() => false)) {
      await inPanel.click();
    } else {
      await expect(fallback).toBeVisible({ timeout: 15_000 });
      await fallback.click();
    }
    await expect(this.assignGeofenceAddressTroubleError()).toBeHidden({
      timeout: 25_000,
    });
  }

  /**
   * Assign-geofence drawer: replace the typeahead value by typing street/city/state and selecting the first suggestion.
   */
  async setAssignGeofenceAddressByTypingAndSuggestion(address: {
    street: string;
    city: string;
    state: string;
  }): Promise<void> {
    const input = this.assignGeofenceAddressOrGpsInput();
    await expect(input).toBeVisible({ timeout: 20_000 });
    await input.click();
    await input.press('Control+a');
    await input.fill(`${address.street}, ${address.city}, ${address.state}`);
    await this.page.waitForTimeout(1200);
    const sugg = this.assignGeofenceAddressFirstSuggestion();
    const fallback = this.page.locator('xpath=//ul/li[1]/span').first();
    if (await sugg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sugg.click();
    } else {
      await expect(fallback).toBeVisible({ timeout: 25_000 });
      await fallback.click();
    }
    await this.page.waitForTimeout(800);
    await this.resolveAssignGeofenceAddressViaSuggestionIfInvalid();
  }

  // ==================== Actions ====================

  async clickEditGeolocationSection(): Promise<void> {
    await expect(this.geolocationEditButton()).toBeVisible();
    await this.geolocationEditButton().click();
  }

  /**
   * Geolocation edit drawer: wait until the geofence control is present, then settle so
   * `isChecked()` matches server state (avoids false "off" → unnecessary check → stuck Save).
   */
  async waitForGeofenceSettingsCheckboxReady(): Promise<void> {
    const checkbox = this.geofenceCheckbox();
    await expect(checkbox).toBeVisible({ timeout: 20_000 });
    await this.page.waitForTimeout(TIME_SETTINGS_GEOFENCE_EDIT_SETTLE_MS);
  }

  /**
   * Enable geofence checkbox
   * @returns true if a change was made, false if already enabled
   */
  async enableGeofence(): Promise<boolean> {
    const checkbox = this.geofenceCheckbox();
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
      return true;
    }
    return false;
  }

  /**
   * Disable geofence checkbox
   * @returns true if a change was made, false if already disabled
   */
  async disableGeofence(): Promise<boolean> {
    const checkbox = this.geofenceCheckbox();
    if (await checkbox.isChecked()) {
      await checkbox.uncheck();
      return true;
    }
    return false;
  }

  async saveSettings(): Promise<void> {
    await this.saveButton().click();
  }

  async cancelSettings(): Promise<void> {
    await this.cancelButton().click();
  }

  async cancelAndDontSave(): Promise<void> {
    await this.cancelButton().click();
    const dontSaveBtn = this.dontSaveButton();
    if (await dontSaveBtn.isVisible().catch(() => false)) {
      await dontSaveBtn.click();
    }
  }

  async openAddCustomerDrawer(): Promise<void> {
    await this.assignmentsPage.openAddCustomerDrawer();
  }

  async openGeofenceScreenForCustomer(customerName: string): Promise<void> {
    const dropdown = this.customerActionDropdown(customerName);
    await expect(dropdown).toBeVisible({ timeout: 30_000 });
    await dropdown.click();

    const geofenceOption = this.assignGeofenceLocationOption();
    await expect(geofenceOption).toBeVisible({ timeout: 30_000 });
    await geofenceOption.click();
  }

  async enterCompanyName(name: string): Promise<void> {
    await this.assignmentsPage.fillCustomerName(name);
  }

  /**
   * Enter full address using individual fields
   */
  async enterFullAddress(address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  }): Promise<void> {
    await this.assignmentsPage.fillCustomerAddress(address);
  }

  /**
   * Clear customer address fields
   */
  async clearAddress(): Promise<void> {
    await this.assignmentsPage.clearCustomerAddress();
  }

  /**
   * Save customer using the customer drawer save button
   */
  async saveCustomer(): Promise<void> {
    await this.assignmentsPage.saveCustomerDrawer();
    await this.page.waitForTimeout(CUSTOMER_DRAWER_SAVE_SETTLE_MS);
  }

  /** Persist assign-geofence drawer (toggle / radius / map), not the contact form. */
  async saveAssignGeofenceDrawer(): Promise<void> {
    const saveBtn = this.assignGeofenceDrawerSaveButton();
    await expect(saveBtn).toBeEnabled({ timeout: 20_000 });
    await saveBtn.click();
    await this.page.waitForTimeout(CUSTOMER_DRAWER_SAVE_SETTLE_MS);
  }

  /**
   * Get address input locators from AssignmentsPage for direct access
   */
  streetAddressInput(): Locator {
    return this.assignmentsPage.customerStreetAddressInput();
  }

  cityInput(): Locator {
    return this.assignmentsPage.customerCityInput();
  }

  stateInput(): Locator {
    return this.assignmentsPage.customerStateInput();
  }

  postalCodeInput(): Locator {
    return this.assignmentsPage.customerPostalCodeInput();
  }

  /**
   * Turn on geofence. Modal switch: use `aria-checked` (authoritative for this IDS `role="switch"` control).
   * If already on, no-op. Falls back to time-settings `[data-testid="geofencing-checkbox"]` with `isChecked()` when the modal switch is absent.
   */
  async toggleGeofenceOn(): Promise<void> {
    const sw = this.assignGeofenceModalToggle();
    try {
      await expect(sw).toBeVisible({ timeout: 15_000 });
      if ((await sw.getAttribute('aria-checked')) !== 'true') {
        await sw.click();
      }
      await expect(this.assignGeofenceMapPlaceholder()).toBeVisible({
        timeout: 60_000,
      });
      await this.resolveAssignGeofenceAddressViaSuggestionIfInvalid();
      return;
    } catch {
      // No switch with this accessible name on this surface
    }

    const settingsCb = this.page.locator('[data-testid="geofencing-checkbox"]');
    await expect(settingsCb).toBeVisible({ timeout: 10_000 });
    if (!(await settingsCb.isChecked())) {
      await settingsCb.check();
    }
  }

  /**
   * Turn off geofence. Modal switch uses `aria-checked` like toggleGeofenceOn. If already off, no-op.
   */
  async toggleGeofenceOff(): Promise<void> {
    const sw = this.assignGeofenceModalToggle();
    try {
      await expect(sw).toBeVisible({ timeout: 15_000 });
      if ((await sw.getAttribute('aria-checked')) === 'true') {
        await sw.click();
      }
      return;
    } catch {
      /* */
    }

    const settingsCb = this.page.locator('[data-testid="geofencing-checkbox"]');
    await expect(settingsCb).toBeVisible({ timeout: 10_000 });
    if (await settingsCb.isChecked()) {
      await settingsCb.uncheck();
    }
  }

  async setRadiusSize(size: string): Promise<void> {
    const input = this.radiusInput();
    await expect(input).toBeVisible({ timeout: 15_000 });
    await input.click();
    await input.press('Control+a');
    await input.fill(size);
    // IDS radius typeahead: dirty state / validation often requires focus leave before Save enables.
    await input.press('Tab');
    await this.page.waitForTimeout(400);
    const map = this.mapContainer();
    if (await map.isVisible().catch(() => false)) {
      await map.click({ position: { x: 30, y: 30 } });
    } else {
      await this.assignGeofenceDialog().click({ position: { x: 24, y: 80 } });
    }
    await this.page.waitForTimeout(300);
  }

  async getRadiusSize(): Promise<string> {
    return await this.radiusInput().inputValue();
  }

  // ==================== Validations ====================

  async isGeofenceEnabled(): Promise<boolean> {
    const value = await this.geofenceValueDisplay().textContent();
    return value === 'On';
  }

  async isGeofenceToggleVisible(): Promise<boolean> {
    return await this.geofenceToggle()
      .isVisible()
      .catch(() => false);
  }

  async isRadiusInputVisible(): Promise<boolean> {
    return await this.radiusInput()
      .isVisible()
      .catch(() => false);
  }

  async isRadiusInputEnabled(): Promise<boolean> {
    return await this.radiusInput().isEnabled();
  }

  async isMapVisible(): Promise<boolean> {
    return await this.mapContainer()
      .isVisible()
      .catch(() => false);
  }

  async isGeofenceColumnVisible(): Promise<boolean> {
    return await this.geofenceColumnHeader()
      .isVisible()
      .catch(() => false);
  }

  async isGeofenceAddressColumnVisible(): Promise<boolean> {
    return await this.geofenceAddressColumnHeader()
      .isVisible()
      .catch(() => false);
  }

  // ==================== Compound Actions ====================

  async enableGeofenceInCompanySettings(): Promise<void> {
    await this.gotoTimeSettings();
    await expect(this.geolocationSection()).toBeVisible();
    await this.clickEditGeolocationSection();
    await this.waitForGeofenceSettingsCheckboxReady();
    const changed = await this.enableGeofence();
    if (changed) {
      await this.saveSettings();
      console.log('✓ Geofence enabled in company settings');
    } else {
      await this.cancelSettings();
      console.log('✓ Geofence was already enabled in company settings');
    }
  }

  async disableGeofenceInCompanySettings(): Promise<void> {
    await this.gotoTimeSettings();
    await expect(this.geolocationSection()).toBeVisible();
    await this.clickEditGeolocationSection();
    await this.waitForGeofenceSettingsCheckboxReady();
    const changed = await this.disableGeofence();
    if (changed) {
      await this.saveSettings();
      console.log('✓ Geofence disabled in company settings');
    } else {
      await this.cancelSettings();
      console.log('✓ Geofence was already disabled in company settings');
    }
  }

  /**
   * Create customer with address using individual address fields
   */
  async createCustomerWithAddress(
    companyName: string,
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
    },
    options?: { enableGeofence?: boolean; radiusSize?: string },
  ): Promise<void> {
    await this.gotoAssignments();
    await this.openAddCustomerDrawer();
    await this.enterCompanyName(companyName);
    await this.enterFullAddress(address);

    if (options?.enableGeofence) {
      await this.toggleGeofenceOn();

      if (options?.radiusSize) {
        await this.setRadiusSize(options.radiusSize);
      }
      // Geofence changes live on the assign-geofence layer; persist before contact Save.
      if (
        await this.assignGeofenceDialog()
          .isVisible()
          .catch(() => false)
      ) {
        await this.saveAssignGeofenceDrawer();
      }
    }

    await this.saveCustomer();
    console.log(`✓ Created customer: ${companyName}`);
  }

  async verifyAssignmentTableColumnsWithGeofence(): Promise<void> {
    await expect(this.customersColumnHeader()).toBeVisible();
    await expect(this.workersColumnHeader()).toBeVisible();
    await expect(this.timeTrackingColumnHeader()).toBeVisible();
    await expect(this.actionsColumnHeader()).toBeVisible();
    await expect(this.geofenceColumnHeader()).toBeVisible();
    await expect(this.geofenceAddressColumnHeader()).toBeVisible();
  }

  /** Geofence-only: when company geofencing is off, these headers must not appear. */
  async verifyAssignmentTableColumnsWithoutGeofence(): Promise<void> {
    await expect(this.geofenceColumnHeader()).not.toBeVisible();
    await expect(this.geofenceAddressColumnHeader()).not.toBeVisible();
  }
}
