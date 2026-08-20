import { Page, Locator, expect } from '@playwright/test';

export const WHOS_WORKING_MAP_URL_PATTERN = /whoIsWorking|whosworking|map/i;

class WhosWorkingMapPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Locators
  getWhosWorkingMapEntryPoint(): Locator {
    return this.page.locator('//*[text()="View who\'s working"]');
  }

  getMapPageTitle(): Locator {
    return this.page.locator('//*[text()="Overview of who\'s on clock"]');
  }

  getLiveTeamMapLabel(): Locator {
    return this.page.locator('//*[text()="Live team map"]');
  }

  getMapContainer(): Locator {
    return this.page.locator(
      '//*[contains(@class, "WorkerMapstyled__WorkerMapContainer")]',
    );
  }

  getSearchBar(): Locator {
    return this.page.locator('//*[@aria-label="Search team member"]');
  }

  getFilterButton(): Locator {
    return this.page.locator('//*[@aria-label="Filter and sort"]');
  }

  getWorkerPin(workerName?: string): Locator {
    // Worker pins on the map have title attributes with the employee name
    if (workerName) {
      return this.page.getByTitle(workerName);
    }
    // For getting all worker pins, look within the map container for elements with title
    // that match worker name patterns (exclude Google Maps UI elements)
    return this.getMapContainer()
      .locator('[title]')
      .filter({
        hasNot: this.page.locator('[aria-label*="Zoom"]'),
      });
  }

  // Get worker pins by looking for title attributes within map
  getWorkerPinByName(name: string): Locator {
    return this.page.getByTitle(name);
  }

  getClockedInCount(): Locator {
    return this.page.locator(
      '//*[contains(@class, "ClockedInCountContainer")]',
    );
  }

  getRefreshMapButton(): Locator {
    return this.page.locator('//*[@aria-label="Refresh map"]');
  }

  getNoResultsMessage(searchText: string): Locator {
    return this.page.locator(`//*[text()='Nothing matches "${searchText}"']`);
  }

  getRoadmapButton(): Locator {
    return this.page.locator('//*[@aria-label="roadmap"]');
  }

  getSatelliteButton(): Locator {
    return this.page.locator('//*[@aria-label="satellite"]');
  }

  getFullscreenButton(): Locator {
    return this.page.locator('//*[@aria-label="Toggle fullscreen view"]');
  }

  getWorkerList(): Locator {
    return this.page
      .locator('[class*="worker-list"]')
      .or(this.page.locator('[data-testid="worker-list"]'));
  }

  // Get worker rows in the list table (right side panel)
  getWorkerListRows(): Locator {
    // Target rows that have "Edit Time" action - these are worker rows
    return this.page.locator('tr').filter({
      has: this.page.getByText('Edit Time'),
    });
  }

  getMapCameraControlsButton(): Locator {
    return this.page.locator('//*[@aria-label="Map camera controls"]');
  }

  getZoomInButton(): Locator {
    return this.page
      .locator('button[aria-label*="Zoom in"]')
      .or(this.page.locator('[title*="Zoom in"]'))
      .or(this.page.locator('button:has-text("+")'));
  }

  getZoomOutButton(): Locator {
    return this.page
      .locator('button[aria-label*="Zoom out"]')
      .or(this.page.locator('[title*="Zoom out"]'))
      .or(this.page.locator('button:has-text("-")'));
  }

  getMoveUpButton(): Locator {
    return this.page.locator('//*[@aria-label="Move up"]');
  }

  getMoveDownButton(): Locator {
    return this.page.locator('//*[@aria-label="Move down"]');
  }

  getMoveLeftButton(): Locator {
    return this.page.locator('//*[@aria-label="Move left"]');
  }

  getMoveRightButton(): Locator {
    return this.page.locator('//*[@aria-label="Move right"]');
  }

  getSatelliteToggle(): Locator {
    return this.getSatelliteButton();
  }

  getDetailsPanel(): Locator {
    return this.page
      .locator('[class*="details-panel"]')
      .or(this.page.locator('[data-testid="worker-details"]'))
      .or(this.page.locator('[role="dialog"]'));
  }

  getEmptyStateMessage(): Locator {
    return this.page.locator(
      '//*[text()="No one\'s on the clock at the moment"]',
    );
  }

  getFilterSortBoxTitle(): Locator {
    return this.page.locator('//*[text()="Filter and sort"]');
  }

  getDisplayByDropdown(): Locator {
    return this.page.locator('//*[@aria-label="Display by"]');
  }

  getSortByDropdown(): Locator {
    return this.page.locator('//*[@aria-label="Sort by"]');
  }

  // Display by options
  getOnClockOnlyOption(): Locator {
    return this.page.locator('//*[text()="On the clock only"]');
  }

  getByGroupOption(): Locator {
    return this.page.locator('//*[text()="By group"]');
  }

  getAllEmployeesOption(): Locator {
    return this.page.locator('//*[text()="All employees"]');
  }

  // Sort by options
  getMostRecentClockInOption(): Locator {
    return this.page.locator('//*[text()="Most recent clocked-in time"]');
  }

  getDailyTotalOption(): Locator {
    return this.page.locator('//*[text()="Daily total"]');
  }

  getTeamMemberOption(): Locator {
    // Use role selector to target dropdown option specifically (not table header or search label)
    return this.page.getByRole('option', { name: 'Team member' });
  }

  getSharingLocationOption(): Locator {
    return this.page.locator('//*[text()="Sharing location"]');
  }

  getApplyButton(): Locator {
    return this.page.locator('//*[text()="Apply"]');
  }

  getCancelButton(): Locator {
    return this.page.locator('//*[text()="Cancel"]');
  }

  getCloseMapButton(): Locator {
    return this.page.locator(
      '//div[@aria-modal="true"]/descendant::*[@aria-label="Close"]',
    );
  }

  getCloseFilterPopoverButton(): Locator {
    return this.page.locator(
      '//div[@aria-label="popover"]/descendant::*[@aria-label="Close"]',
    );
  }

  // Worker List / Employee Details Locators
  getWorkerNameInList(employeeName: string): Locator {
    return this.page.locator(`//td/descendant::*[text()='${employeeName}']`);
  }

  getWorkerTimeInList(timeText: string): Locator {
    return this.page.locator(`//td/descendant::*[text()='${timeText}']`);
  }

  getAddTimeLink(employeeName: string): Locator {
    return this.page.locator(
      `//*[text()='${employeeName}']/ancestor::tr/descendant::*[text()='Add Time']`,
    );
  }

  getSingleTimeEntryOption(): Locator {
    // Match commonUtils pattern - 'Single time entry' (lowercase)
    return this.page.getByText('Single time entry');
  }

  getAddBreakOption(): Locator {
    // Match pattern used elsewhere - getByText for menu options
    return this.page.getByText('Add break');
  }

  getEditTimeLink(): Locator {
    return this.page.locator("//td/descendant::*[text()='Edit Time']");
  }

  getEditTimeLinkForWorker(employeeName: string): Locator {
    return this.page.locator(
      `//*[text()='${employeeName}']/ancestor::tr/descendant::*[text()='Edit Time']`,
    );
  }

  getShowWorkerOnMapButton(): Locator {
    // Button aria-label changes between "Show worker on map" and "Deselect worker on map"
    return this.page.locator(
      '//*[@aria-label="Show worker on map" or @aria-label="Deselect worker on map"]',
    );
  }

  getShowWorkerOnMapButtonForWorker(employeeName: string): Locator {
    // Button aria-label changes between "Show worker on map" and "Deselect worker on map"
    return this.page.locator(
      `//*[text()='${employeeName}']/ancestor::tr/descendant::*[@aria-label="Show worker on map" or @aria-label="Deselect worker on map"]`,
    );
  }

  getCurrentClockInTime(): Locator {
    return this.page.locator('//*[@color="#00892E"]');
  }

  getCurrentClockInTimeForWorker(employeeName: string): Locator {
    return this.page.locator(
      `//*[text()='${employeeName}']/ancestor::tr/descendant::*[@color="#00892E"]`,
    );
  }

  getBackButton(): Locator {
    return this.page
      .locator('[aria-label*="Back"]')
      .or(this.page.getByRole('button', { name: /back/i }))
      .or(this.page.locator('button:has-text("Time Entries")'));
  }

  // First Add Time link (for any employee)
  getFirstAddTimeLink(): Locator {
    return this.page.locator(`(//*[text()='Add Time'])[1]`);
  }

  // Tooltip locator
  getTooltip(): Locator {
    return this.page
      .locator('[role="tooltip"]')
      .or(this.page.locator('[class*="tooltip"]'))
      .or(this.page.locator('[class*="popup"]'))
      .or(this.page.locator('[class*="Tooltip"]'));
  }

  // Error message locator
  getErrorMessage(): Locator {
    return this.page.locator('text=/error|failed|something went wrong/i');
  }

  // Text locator helper
  getTextLocator(text: string): Locator {
    return this.page.getByText(text);
  }

  // Break type option in dropdown
  getBreakTypeOption(breakTypeName: string): Locator {
    return this.page
      .locator(`//li[contains(text(),'${breakTypeName}')]`)
      .or(this.page.locator(`//span[contains(text(),'${breakTypeName}')]`));
  }

  // First break option in dropdown
  getFirstBreakOption(): Locator {
    return this.page.locator('//ul[@role="listbox"]//li').first();
  }

  // Break indicator on Time Entries
  getBreakIndicator(): Locator {
    return this.page.locator(
      '//*[contains(@class, "break") or contains(@class, "Break")]',
    );
  }

  // Actions
  async navigateToWhosWorkingMap() {
    console.log("Navigating to Who's Working Map...");
    await this.getWhosWorkingMapEntryPoint().click();
    await this.page.waitForTimeout(2000); // Wait for map to load
    console.log("Who's Working Map opened");
  }

  async waitForMapToLoad() {
    await this.getMapContainer().waitFor({ state: 'visible' });
    await this.getMapPageTitle().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000); // Wait for map tiles to load
  }

  async waitForWorkerListToLoad() {
    // Wait for any loading indicator to disappear
    const loader = this.page
      .locator('[class*="loading"]')
      .or(this.page.locator('[class*="spinner"]'));
    await loader.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    // Wait for at least one worker row to appear (Edit Time link indicates worker row)
    await this.getWorkerListRows()
      .first()
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => {});
  }

  async searchWorker(workerName: string) {
    console.log(`Searching for worker: ${workerName}`);
    await this.getSearchBar().click();
    await this.getSearchBar().fill(workerName);

    // Wait for loader to disappear (search works automatically)
    await this.page.waitForTimeout(500);
    const loader = this.page
      .locator('[class*="loading"]')
      .or(this.page.locator('[class*="spinner"]'));
    await loader.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async clearSearch() {
    console.log('Clearing search');
    const searchBar = this.getSearchBar();
    await searchBar.fill('');
    await this.page.waitForTimeout(1000);
  }

  async clickWorkerPin(index: number = 0) {
    console.log(`Clicking worker pin ${index}`);
    const pins = await this.getWorkerPin().all();
    if (pins.length > index) {
      await pins[index].click();
      await this.page.waitForTimeout(1000);
    }
  }

  async openFilters() {
    console.log('Opening filters');
    await this.getFilterButton().click();
    await this.page.waitForTimeout(500);

    // Wait for filter box to be visible
    await this.getFilterSortBoxTitle().waitFor({ state: 'visible' });
  }

  async closeFilters() {
    console.log('Closing filter popover');
    await this.getCloseFilterPopoverButton().click();
    await this.page.waitForTimeout(300);
  }

  async selectDisplayByOption(
    option: 'On the clock only' | 'By group' | 'All employees',
  ) {
    console.log(`Selecting display by: ${option}`);
    await this.getDisplayByDropdown().click();
    await this.page.waitForTimeout(300);

    switch (option) {
      case 'On the clock only':
        await this.getOnClockOnlyOption().click();
        break;
      case 'By group':
        await this.getByGroupOption().click();
        break;
      case 'All employees':
        await this.getAllEmployeesOption().click();
        break;
    }
    await this.page.waitForTimeout(500);
  }

  async selectSortByOption(
    option:
      | 'Most recent clocked-in time'
      | 'Daily total'
      | 'Team member'
      | 'Sharing location',
  ) {
    console.log(`Selecting sort by: ${option}`);
    await this.getSortByDropdown().click();
    await this.page.waitForTimeout(300);

    switch (option) {
      case 'Most recent clocked-in time':
        await this.getMostRecentClockInOption().click();
        break;
      case 'Daily total':
        await this.getDailyTotalOption().click();
        break;
      case 'Team member':
        await this.getTeamMemberOption().click();
        break;
      case 'Sharing location':
        await this.getSharingLocationOption().click();
        break;
    }
    await this.page.waitForTimeout(500);
  }

  async applyFilters() {
    console.log('Applying filters');
    await this.getApplyButton().click();
    await this.page.waitForTimeout(1000);

    // Wait for loader to disappear
    const loader = this.page
      .locator('[class*="loading"]')
      .or(this.page.locator('[class*="spinner"]'));
    await loader.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  async closeMap() {
    console.log("Closing Who's Working Map");
    await this.getCloseMapButton().click();
    await this.page.waitForTimeout(500);
  }

  // Worker List Actions
  async clickEditTimeForWorker(employeeName: string) {
    console.log(`Clicking Edit Time for ${employeeName}`);
    await this.getEditTimeLinkForWorker(employeeName).click();
    await this.page.waitForTimeout(500);
  }

  async clickAddTimeForWorker(employeeName: string) {
    console.log(`Clicking Add Time for ${employeeName}`);
    await this.getAddTimeLink(employeeName).click();
    await this.page.waitForTimeout(500);
  }

  async selectSingleTimeEntry() {
    console.log('Selecting Single Time entry');
    await this.getSingleTimeEntryOption().click();
    await this.page.waitForTimeout(500);
  }

  async clickFirstAddTimeLink() {
    console.log('Clicking first Add Time link');
    await this.getFirstAddTimeLink().click();
    await this.page.waitForTimeout(500);
  }

  async closeDropdownWithEscape() {
    await this.page.keyboard.press('Escape');
  }

  async pressTab() {
    await this.page.keyboard.press('Tab');
  }

  async isFirstAddTimeLinkVisible(): Promise<boolean> {
    return await this.getFirstAddTimeLink().isVisible();
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return await this.getErrorMessage()
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
  }

  async isTooltipVisible(): Promise<boolean> {
    return await this.getTooltip()
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
  }

  async selectBreakType(breakTypeName: string): Promise<boolean> {
    const breakOption = this.getBreakTypeOption(breakTypeName);
    if (await breakOption.first().isVisible({ timeout: 3000 })) {
      await breakOption.first().click();
      return true;
    }
    // Fallback to first option
    await this.getFirstBreakOption().click();
    return false;
  }

  async isBreakVisible(breakTypeName?: string): Promise<boolean> {
    if (breakTypeName) {
      return await this.page
        .getByText(breakTypeName)
        .first()
        .isVisible()
        .catch(() => false);
    }
    return (
      (await this.getBreakIndicator()
        .first()
        .isVisible()
        .catch(() => false)) ||
      (await this.page
        .getByText(/break/i)
        .first()
        .isVisible()
        .catch(() => false))
    );
  }

  async isTextVisible(text: string): Promise<boolean> {
    return await this.page.getByText(text).first().isVisible();
  }

  async selectAddBreak() {
    console.log('Selecting Add break');
    await this.getAddBreakOption().click();
    await this.page.waitForTimeout(500);
  }

  async showWorkerOnMap(employeeName: string) {
    console.log(`Showing ${employeeName} on map`);
    await this.getShowWorkerOnMapButtonForWorker(employeeName).click();
    await this.page.waitForTimeout(1000);
  }

  async getWorkerCurrentClockInTime(
    employeeName: string,
  ): Promise<string | null> {
    const timeElement = this.getCurrentClockInTimeForWorker(employeeName);
    const isVisible = await timeElement.isVisible().catch(() => false);

    if (isVisible) {
      const time = await timeElement.textContent();
      console.log(`Current clock-in time for ${employeeName}: ${time}`);
      return time;
    }

    console.log(`${employeeName} is not currently clocked in`);
    return null;
  }

  async validateWorkerInList(employeeName: string) {
    await expect(this.getWorkerNameInList(employeeName)).toBeVisible();
    console.log(`✅ Worker ${employeeName} found in list`);
  }

  async validateWorkerClockInTime(employeeName: string) {
    const time = await this.getWorkerCurrentClockInTime(employeeName);
    expect(time).not.toBeNull();
    console.log(`✅ Worker ${employeeName} has clock-in time: ${time}`);
  }

  async openMapCameraControls() {
    // Wait for map to fully load first
    await this.page
      .locator('.gm-style')
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(1000);

    // Check if zoom button is already visible (controls already open)
    const isAlreadyOpen = await this.getZoomInButton()
      .isVisible()
      .catch(() => false);
    if (isAlreadyOpen) {
      console.log('Map camera controls already open');
      return;
    }

    console.log('Opening map camera controls');
    await this.getMapCameraControlsButton().click();
    await this.page.waitForTimeout(500);
  }

  async zoomIn(times: number = 1) {
    console.log(`Zooming in ${times} time(s)`);
    await this.openMapCameraControls();
    for (let i = 0; i < times; i++) {
      await this.getZoomInButton().click();
      await this.page.waitForTimeout(300);
    }
  }

  async zoomOut(times: number = 1) {
    console.log(`Zooming out ${times} time(s)`);
    await this.openMapCameraControls();
    for (let i = 0; i < times; i++) {
      await this.getZoomOutButton().click();
      await this.page.waitForTimeout(300);
    }
  }

  async moveUp(times: number = 1) {
    console.log(`Moving up ${times} time(s)`);
    await this.openMapCameraControls();
    for (let i = 0; i < times; i++) {
      await this.getMoveUpButton().click();
      await this.page.waitForTimeout(300);
    }
  }

  async moveDown(times: number = 1) {
    console.log(`Moving down ${times} time(s)`);
    await this.openMapCameraControls();
    for (let i = 0; i < times; i++) {
      await this.getMoveDownButton().click();
      await this.page.waitForTimeout(300);
    }
  }

  async moveLeft(times: number = 1) {
    console.log(`Moving left ${times} time(s)`);
    await this.openMapCameraControls();
    for (let i = 0; i < times; i++) {
      await this.getMoveLeftButton().click();
      await this.page.waitForTimeout(300);
    }
  }

  async moveRight(times: number = 1) {
    console.log(`Moving right ${times} time(s)`);
    await this.openMapCameraControls();
    for (let i = 0; i < times; i++) {
      await this.getMoveRightButton().click();
      await this.page.waitForTimeout(300);
    }
  }

  async toggleSatelliteView() {
    console.log('Toggling satellite view');
    await this.getSatelliteToggle().click();
    await this.page.waitForTimeout(1000);
  }

  async clickBackToTimeEntries() {
    console.log('Navigating back to Time Entries');
    await this.getBackButton().click();
    await this.page.waitForTimeout(1000);
  }

  async toggleFullscreen() {
    console.log('Toggling fullscreen');
    await this.getFullscreenButton().click();
    await this.page.waitForTimeout(500);
  }

  async refreshMap() {
    console.log('Refreshing map');
    await this.getRefreshMapButton().click();
    await this.page.waitForTimeout(1000);

    // Wait for loader to disappear
    const loader = this.page
      .locator('[class*="loading"]')
      .or(this.page.locator('[class*="spinner"]'));
    await loader.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  async toggleRoadmapView() {
    console.log('Toggling roadmap view');
    await this.getRoadmapButton().click();
    await this.page.waitForTimeout(500);
  }

  // Validations
  async validateMapIsVisible() {
    await expect(this.getMapContainer()).toBeVisible();
    await expect(this.getMapPageTitle()).toBeVisible();
    console.log('✅ Map is visible');
  }

  async validateSearchBarIsVisible() {
    await expect(this.getSearchBar()).toBeVisible();
    console.log('✅ Search bar is visible');
  }

  async validateFilterButtonIsVisible() {
    await expect(this.getFilterButton()).toBeVisible();
    console.log('✅ Filter button is visible');
  }

  async validateClockedInCount() {
    const countElement = this.getClockedInCount();
    await expect(countElement).toBeVisible();
    const countText = await countElement.textContent();
    console.log(`✅ Clocked in count: ${countText}`);
    return countText;
  }

  async validateWorkerPinsAreVisible() {
    // Wait a bit for pins to load
    await this.page.waitForTimeout(1000);
    const pins = await this.getWorkerPin().count();
    expect(pins).toBeGreaterThan(0);
    console.log(`✅ ${pins} worker pin(s) visible`);
    return pins;
  }

  async validateNoSearchResults(searchText: string) {
    const noResultsMsg = this.getNoResultsMessage(searchText);
    await expect(noResultsMsg).toBeVisible();
    console.log(`✅ No results message displayed for "${searchText}"`);
  }

  async validateDetailsPanelIsVisible() {
    await expect(this.getDetailsPanel()).toBeVisible();
    console.log('✅ Details panel is visible');
  }

  async validateEmptyStateIsVisible() {
    await expect(this.getEmptyStateMessage()).toBeVisible();
    console.log(
      '✅ Empty state message: "No one\'s on the clock at the moment"',
    );
  }

  async validateFilterSortBoxOpen() {
    await expect(this.getFilterSortBoxTitle()).toBeVisible();
    await expect(this.getDisplayByDropdown()).toBeVisible();
    await expect(this.getSortByDropdown()).toBeVisible();
    console.log('✅ Filter and sort box is open');
  }

  async validateMapControls() {
    // First open camera controls to reveal zoom/move buttons
    await this.openMapCameraControls();
    await expect(this.getZoomInButton()).toBeVisible();
    await expect(this.getZoomOutButton()).toBeVisible();
    console.log('✅ Map controls are visible');
  }

  async getWorkerCount(): Promise<number> {
    // Count "Edit Time" links/buttons - each worker row has one
    const editTimeCount = await this.page.getByText('Edit Time').count();
    if (editTimeCount > 0) {
      return editTimeCount;
    }

    // Fallback: count "Show worker on map" buttons
    const mapButtonCount = await this.getShowWorkerOnMapButton().count();
    if (mapButtonCount > 0) {
      return mapButtonCount;
    }

    // Last fallback: try table rows with filter
    return await this.getWorkerListRows().count();
  }
}

export default WhosWorkingMapPage;
