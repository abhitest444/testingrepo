import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for Projects/Project Details screen
 * URL: https://e2e.qbo.intuit.com/app/projects-list?jobId=projects
 */
class ProjectsPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ========== Locators ==========

  get loadingSpinner(): Locator {
    return this.page.locator(
      `//div[@aria-label="Loading" and @role="progressbar"]`,
    );
  }

  get projectCardNames(): Locator {
    return this.page.locator(`//*[@data-id="card-name"]`);
  }

  get trackTimeButton(): Locator {
    return this.page.locator(`//button[text()='Track time']`);
  }

  get addToProjectButton(): Locator {
    return this.page.locator(`//span[text()='Add to project']`);
  }

  get addTimeOption(): Locator {
    return this.page.locator(`//span/span[text()='Time']`);
  }

  get timeActivityTab(): Locator {
    return this.page.locator(`//*[contains(text(), 'Time Activity')]`);
  }

  get hoursLink(): Locator {
    return this.page.locator(`//a[contains(text(), 'Hours')]`).first();
  }

  getProjectCardByName(projectName: string): Locator {
    return this.page.locator(
      `//*[@data-id="card-name"][contains(text(), "${projectName}")]`,
    );
  }

  getEmployeeEntryInTimeActivity(employeeName: string): Locator {
    return this.page
      .locator(`//div[contains(text(), '${employeeName}')]`)
      .first();
  }

  getHoursValueInTableRow(hoursValue: string): Locator {
    return this.page.locator(`(//tr/descendant::*[text()='${hoursValue}'])[1]`);
  }

  get firstProjectCard(): Locator {
    return this.projectCardNames.first();
  }

  // ========== Navigation Methods ==========

  async navigateToProjectsList() {
    await this.page.goto('/app/projects-list?jobId=projects', {
      waitUntil: 'load',
    });
    await this.page.waitForTimeout(2000);
  }

  async waitForLoadingToDisappear() {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 });
  }

  async waitForPageReady() {
    await this.page.waitForLoadState('load');
    await this.page.waitForTimeout(1000);
    try {
      await this.waitForLoadingToDisappear();
    } catch (error) {
      // Loading spinner may not appear if page loads quickly
      console.log('Loading spinner not found or already hidden');
    }
  }

  // ========== Action Methods ==========

  async clickFirstProjectCard() {
    await this.firstProjectCard.waitFor({ state: 'visible', timeout: 10000 });
    await this.firstProjectCard.click();
    await this.page.waitForTimeout(1000);
  }

  async clickProjectCardByName(projectName: string) {
    const projectCard = this.getProjectCardByName(projectName);
    await projectCard.waitFor({ state: 'visible', timeout: 10000 });
    await projectCard.click();
    await this.page.waitForTimeout(1000);
  }

  async clickTrackTimeButton() {
    await this.trackTimeButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.trackTimeButton.click();
    await this.page.waitForTimeout(1000);
  }

  async clickAddToProjectButton() {
    await this.addToProjectButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.addToProjectButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickAddTimeOption() {
    await this.addTimeOption.waitFor({ state: 'visible', timeout: 10000 });
    await this.addTimeOption.click();
    await this.page.waitForTimeout(1000);
  }

  async clickProjectAndTrackTime(projectName?: string) {
    if (projectName) {
      await this.clickProjectCardByName(projectName);
    } else {
      await this.clickFirstProjectCard();
    }
    await this.clickTrackTimeButton();
  }

  async addTimeToProject() {
    await this.clickAddToProjectButton();
    await this.clickAddTimeOption();
  }

  async clickTimeActivityTab() {
    await expect(this.timeActivityTab).toBeVisible();
    await this.timeActivityTab.click();
    await this.page.waitForTimeout(1000);
  }

  async expandEmployeeRow(employeeName: string) {
    const employeeEntry = this.getEmployeeEntryInTimeActivity(employeeName);
    await expect(employeeEntry).toBeVisible();
    await employeeEntry.click();
    await this.page.waitForTimeout(1000);
  }

  async clickHoursLinkToEdit() {
    await expect(this.hoursLink).toBeVisible();
    await this.hoursLink.click();
    await this.page.waitForTimeout(2000);
  }

  async verifyHoursInTableRow(hoursValue: string): Promise<boolean> {
    const hoursLocator = this.getHoursValueInTableRow(hoursValue);
    return await hoursLocator.isVisible({ timeout: 5000 }).catch(() => false);
  }

  async verifyHoursWithBothFormats(
    hourValue: string,
  ): Promise<{ found: boolean; displayedValue: string }> {
    // Try with leading zero (e.g., "03:00")
    const hoursWithLeadingZero = `0${hourValue}:00`;
    const isVisibleWithZero = await this.verifyHoursInTableRow(
      hoursWithLeadingZero,
    );

    if (isVisibleWithZero) {
      return { found: true, displayedValue: hoursWithLeadingZero };
    }

    // Try without leading zero (e.g., "3:00")
    const hoursWithoutLeadingZero = `${hourValue}:00`;
    const isVisibleWithoutZero = await this.verifyHoursInTableRow(
      hoursWithoutLeadingZero,
    );

    if (isVisibleWithoutZero) {
      return { found: true, displayedValue: hoursWithoutLeadingZero };
    }

    return { found: false, displayedValue: '' };
  }

  // ========== Validation Methods ==========

  async expectTrackTimeButtonVisible() {
    await expect(this.trackTimeButton).toBeVisible();
  }

  async expectAddToProjectButtonVisible() {
    await expect(this.addToProjectButton).toBeVisible();
  }

  async expectProjectCardsVisible() {
    const count = await this.projectCardNames.count();
    expect(count).toBeGreaterThan(0);
  }

  async getProjectCardsCount(): Promise<number> {
    return await this.projectCardNames.count();
  }

  async getFirstProjectName(): Promise<string> {
    const text = await this.firstProjectCard.textContent();
    return text?.trim() || '';
  }

  async isProjectVisible(projectName: string): Promise<boolean> {
    try {
      const projectCard = this.getProjectCardByName(projectName);
      return await projectCard.isVisible();
    } catch (error) {
      return false;
    }
  }

  async handlePopupsInAnyOrder() {
    try {
      // Check for tour/onboarding modals
      const tourCloseButton = this.page.locator(
        `//button[@aria-label="Close"]`,
      );
      if (await tourCloseButton.isVisible({ timeout: 2000 })) {
        await tourCloseButton.click();
        await this.page.waitForTimeout(500);
      }
    } catch (error) {
      // No popup found, continue
      console.log('No popups found to handle');
    }

    try {
      // Check for "Got it" or similar buttons
      const gotItButton = this.page.getByRole('button', { name: 'Got it' });
      if (await gotItButton.isVisible({ timeout: 2000 })) {
        await gotItButton.click();
        await this.page.waitForTimeout(500);
      }
    } catch (error) {
      // No button found, continue
    }
  }

  async goBackToProjectsList() {
    // Try multiple methods to go back
    try {
      // Try clicking a back button if it exists
      const backButton = this.page.locator(
        `//button[contains(@aria-label, 'Back')] | //button[contains(text(), 'Back')]`,
      );
      if (await backButton.isVisible({ timeout: 2000 })) {
        await backButton.click();
        await this.page.waitForTimeout(1000);
        return;
      }
    } catch (error) {
      // No back button, use browser back
      await this.page.goBack();
      await this.page.waitForTimeout(1000);
    }
  }
}

export default ProjectsPage;
