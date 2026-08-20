import { Page, expect } from '@playwright/test';
import { getByText } from '@testing-library/dom';

class DashboardPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async validateDashboardQuickbooksLogo() {
    return await expect(
      this.page.locator(`//div[@aria-label="Intuit QuickBooks Online"]`),
    ).toBeVisible();
  }

  async clickOnSettings() {
    expect(
      this.page.getByRole('button', { name: 'Settings', exact: true }),
    ).toBeVisible();
    return await this.page
      .getByRole('button', { name: 'Settings', exact: true })
      .click();
  }

  async clickOnGivenOptionInSettings(option: string) {
    expect(this.page.getByText(option)).toBeVisible();
    await this.page.getByText(option).click();
  }

  async clickOnGivenOptionLinkInAccountAndSettings(option: string) {
    expect(await this.page.getByRole('link', { name: option })).toBeVisible();
    await this.page.getByRole('link', { name: option }).click();
  }

  navigateToAccountAndSettings() {
    const url = `app/accountsettings`;
    console.log(url);
    return this.page.goto(url);
  }

  async navigateToAccountAndSettingsTime() {
    const url = `app/accountsettings?p=time`;
    console.log(url);
    return await this.page.goto(url, { waitUntil: 'load' });
  }

  async navigateToAccountAndSettingsAdvanced() {
    const url = `app/accountsettings?p=advanced`;
    // console.log(url);
    return await this.page.goto(url, { waitUntil: 'load' });
  }

  async updateFirstDayOfWorkWeek(option: string) {
    //await expect(this.page.locator('.qbo-settings-ui').filter({hasText: 'First day of work week'})).toBeVisible();

    await expect(
      this.page.locator(
        `//div[@data-testid='timetracking-settings-view']//button[@aria-label='Edit' or @aria-label='Edit Time Tracking General Settings']`,
      ),
    ).toBeVisible();
    await this.page
      .locator(
        `//div[@data-testid='timetracking-settings-view']//button[@aria-label='Edit' or @aria-label='Edit Time Tracking General Settings']`,
      )
      .click();
    await expect(
      this.page.locator(`//input[@aria-label='DaysOfWeekDropDown']`),
    ).toBeVisible();
    await this.page
      .locator(`//input[@aria-label='DaysOfWeekDropDown']`)
      .click();
    await this.page.getByRole('option', { name: option }).click();
    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.page.waitForTimeout(2000);
    await expect(
      this.page.getByRole('button', { name: 'Save' }),
    ).not.toBeVisible({ timeout: 30000 });
    await this.page.reload();
    await this.page.getByRole('button', { name: 'Done' }).click();
  }

  async updateCurrencyFromAccountAndSettings(option: string) {
    await expect(
      this.page.getByRole('button', { name: 'Edit Currency' }),
    ).toBeVisible();
    await this.page.waitForTimeout(3000);
    await this.page.getByRole('button', { name: 'Edit Currency' }).click();
    await this.page
      .locator(
        `//div[contains(text(),'Home Currency')]/following::div[@aria-label='Home Currency']`,
      )
      .click();
    await this.page.getByRole('cell', { name: option }).click();
    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.page.waitForTimeout(5000);
    await expect(
      this.page.getByRole('button', { name: 'Save' }),
    ).not.toBeVisible({ timeout: 30000 });
    await this.page.getByRole('button', { name: 'Done' }).click();
  }

  async noTimeActivityAccess() {
    try {
      const element = await this.page.getByText(
        `We’re sorry!You don’t have access rights to view this data.Contact your company `,
      );
      return await element.isVisible();
    } catch (error) {
      return false;
    }
  }

  async validateAddTimeDrawerVisible() {
    return await this.page
      .locator(`//*[@id="worker-add-time-drawer"]`)
      .isVisible();
  }

  async validateDashboardTimeTracking() {
    return await this.page
      .locator(
        `//div[@class='timetracking-ui']/ div[contains(@class, 'timetracking')]`,
      )
      .isVisible();
  }

  async validateDashboardScreen() {
    const isQuickbooksLogoVisible = await this.page
      .locator(`//div[@aria-label="Intuit QuickBooks Online"]`)
      .isVisible()
      .catch(() => false);

    const isToolsBarVisible = await this.page
      .locator(`//nav[@aria-label="Tools"]`)
      .isVisible()
      .catch(() => false);

    if (isQuickbooksLogoVisible || isToolsBarVisible) {
      return true; // Pass validation if either element is visible
    }

    return false; // Fail validation if neither element is visible
  }
}

export default DashboardPage;
